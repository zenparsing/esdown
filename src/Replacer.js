import { Parser, AST } from "esparse";
import { isLegacyScheme, removeScheme } from "./Schema.js";

var NODE_SCHEME = /^node:/i,
    URI_SCHEME = /^[a-z]+:/i;

var RESERVED_WORD = new RegExp("^(?:" +
    "break|case|catch|class|const|continue|debugger|default|delete|do|" +
    "else|enum|export|extends|false|finally|for|function|if|import|in|" +
    "instanceof|new|null|return|super|switch|this|throw|true|try|typeof|" +
    "var|void|while|with|implements|private|public|interface|package|let|" +
    "protected|static|yield" +
")$");

function countNewlines(text) {

    var m = text.match(/\r\n?|\n/g);
    return m ? m.length : 0;
}

function preserveNewlines(text, height) {

    var n = countNewlines(text);

    if (height > 0 && n < height)
        text += "\n".repeat(height - n);

    return text;
}

class PatternTreeNode {

    constructor(name, init, skip) {

        this.name = name;
        this.initializer = init;
        this.children = [];
        this.target = "";
        this.skip = skip | 0;
        this.array = false;
        this.rest = false;
    }
}

class RootNode extends AST.Node {

    constructor(root, end) {

        this.type = "Root";
        this.start = 0;
        this.end = end;
        this.root = root;
    }
}

export class Replacer {

    replace(input, options = {}) {

        var parser = new Parser,
            root = parser.parse(input, { module: options.module });

        this.input = input;
        this.parser = parser;
        this.exportStack = [this.exports = {}];
        this.imports = {};
        this.dependencies = [];
        this.isStrict = false;
        this.uid = 0;

        var visit = node => {

            node.text = null;

            // Call pre-order traversal method
            if (this[node.type + "Begin"])
                this[node.type + "Begin"](node);

            var strict = this.isStrict;

            // Set the strictness for implicitly strict nodes
            switch (node.type) {

                case "Module":
                case "ModuleDeclaration":
                case "ClassDeclaration":
                case "ClassExpresion":
                    this.isStrict = true;
            }

            // Perform a depth-first traversal
            node.children().forEach(child => {

                child.parent = node;
                visit(child);
            });

            // Restore strictness
            this.isStrict = strict;

            var text = null;

            // Call replacer
            if (this[node.type])
                text = this[node.type](node);

            if (text === null || text === void 0)
                text = this.stringify(node);

            return node.text = this.syncNewlines(node.start, node.end, text);
        };

        var output = visit(new RootNode(root, input.length)),
            head = "";

        this.dependencies.forEach(dep => {

            if (head) head += ", ";
            else head = "var ";

            var url = dep.url,
                legacyFlag = dep.legacy ? ", 1" : "";

            head += `${ this.imports[url] } = __load(${ JSON.stringify(dep.url) }${ legacyFlag })`;
        });

        if (head)
            head += "; ";

        output = head + output;

        var exports = Object.keys(this.exports);

        if (exports.length > 0) {

            output += "\n";
            output += exports.map(k => `exports.${ k } = ${ this.exports[k] };`).join("\n");
            output += "\n";
        }

        return output;
    }

    DoWhileStatement(node) {

        var text = this.stringify(node);

        if (text.slice(-1) !== ";")
            return text + ";";
    }

    ForOfStatement(node) {

        var iter = this.addTempVar(node, null, true),
            iterResult = this.addTempVar(node, null, true),
            decl = "",
            binding,
            out;

        out = `for (var ${ iter } = _es6now.iter(${ node.right.text }), ${ iterResult }; `;
        out += `${ iterResult } = ${ iter }.next(), !${ iterResult }.done;)`;

        if (node.left.type === "VariableDeclaration") {

            decl = node.left.kind + " ";
            binding = node.left.declarations[0].pattern;

        } else {

            binding = this.unwrapParens(node.left);
        }

        out = this.syncNewlines(node.left.start, node.body.start, out);

        var body = node.body.text;

        // Remove braces from block bodies
        if (node.body.type === "Block") body = body.slice(1, -1);
        else body += " ";

        var assign = this.isPattern(binding) ?
            this.translatePattern(binding, `${ iterResult }.value`).join(", ") :
            `${ binding.text } = ${ iterResult }.value`;

        return `${ out } { ${ decl }${ assign }; ${ body }}`;
    }

    Module(node) {

        // NOTE: Strict directive is included with module wrapper

        var inserted = [],
            temps = this.tempVars(node);

        if (node.createThisBinding)
            inserted.push("var __this = this;");

        if (temps)
            inserted.push(temps);

        if (inserted.length > 0)
            return inserted.join(" ") + " " + this.stringify(node);
    }

    Script(node) {

        return this.Module(node);
    }

    FunctionBody(node) {

        var insert = this.functionInsert(node.parent);

        if (insert)
            return "{ " + insert + " " + this.stringify(node).slice(1);
    }

    FormalParameter(node) {

        if (this.isPattern(node.pattern))
            return this.addTempVar(node, null, true);

        return node.pattern.text;
    }

    RestParameter(node) {

        node.parent.createRestBinding = true;

        var p = node.parent.params;

        if (p.length > 1) {

            var prev = p[p.length - 2];
            node.start = prev.end;
        }

        return "";
    }

    ComputedPropertyName(node) {

        return this.addComputedName(node);
    }

    ObjectLiteral(node) {

        if (node.computedNames)
            return this.wrapComputed(node);
    }

    ArrayLiteral(node) {

        if (node.hasSpread)
            return "(" + this.spreadList(node.elements, true) + ")";
    }

    MethodDefinition(node) {

        switch (node.kind) {

            case "":
                return node.name.text + ": function(" +
                    this.joinList(node.params) + ") " +
                    node.body.text;

            case "async":
                return node.name.text + ": " + this.asyncFunction(null, node.params, node.body.text);

            case "generator":
                return node.name.text + ": function*(" +
                    this.joinList(node.params) + ") " +
                    node.body.text;
        }
    }

    PropertyDefinition(node) {

        if (node.expression === null)
            return node.name.text + ": " + node.name.text;
    }

    ModuleImport(node) {

        return "var " + node.identifier.text + " = " + this.modulePath(node.from) + ";";
    }

    ModuleDeclarationBegin(node) {

        this.exportStack.push(this.exports = {});
    }

    ModuleDeclaration(node) {

        var out = "var " + node.identifier.text + " = function(exports) {";

        out += this.strictDirective() + " ";
        out += node.body.text.replace(/^\{|\}$/g, "");

        Object.keys(this.exports).forEach(k => {

            out += "exports." + k + " = " + this.exports[k] + "; ";
        });

        this.exportStack.pop();
        this.exports = this.exportStack[this.exportStack.length - 1];

        out += "return exports; }.call(this, {});";

        return out;
    }

    ImportDeclaration(node) {

        var moduleSpec = this.modulePath(node.from),
            list = [];

        if (node.specifiers) {

            node.specifiers.forEach(spec => {

                var imported = spec.imported,
                    local = spec.local || imported;

                list.push({
                    start: spec.start,
                    end: spec.end,
                    text: local.text + " = " + moduleSpec + "." + imported.text
                });
            });
        }

        if (list.length === 0)
            return "";

        return "var " + this.joinList(list) + ";";
    }

    ImportDefaultDeclaration(node) {

        var moduleSpec = this.modulePath(node.from);
        return "var " + node.identifier.text + " = " + moduleSpec + "['default'];";
    }

    ExportDeclaration(node) {

        var binding = node.declaration,
            bindingType = binding ? binding.type : "*",
            exports = this.exports,
            ident;

        // Exported declarations
        switch (binding.type) {

            case "VariableDeclaration":

                binding.declarations.forEach(decl => {

                    if (this.isPattern(decl.pattern)) {

                        decl.pattern.patternTargets.forEach(x => exports[x] = x);

                    } else {

                        ident = decl.pattern.text;
                        exports[ident] = ident;
                    }
                });

                return binding.text + ";";

            case "FunctionDeclaration":
            case "ClassDeclaration":
            case "ModuleDeclaration":

                ident = binding.identifier.text;
                exports[ident] = ident;
                return binding.text;
        }

        var from = binding.from,
            fromPath = from ? this.modulePath(from) : "",
            out = "";

        if (!binding.specifiers) {

            out += "Object.keys(" + fromPath + ").forEach(function(k) { exports[k] = " + fromPath + "[k]; });";

        } else {

            binding.specifiers.forEach(spec => {

                var local = spec.local.text,
                    exported = spec.exported ? spec.exported.text : local;

                exports[exported] = from ?
                    fromPath + "." + local :
                    local;
            });
        }

        return out;
    }

    CallExpression(node) {

        var callee = node.callee,
            args = node.arguments,
            spread = null,
            calleeText,
            argText;

        if (node.hasSpread)
            spread = this.spreadList(args, false);

        if (node.isSuperCall) {

            if (spread)
                argText = "this, " + spread;
            else if (args.length > 0)
                argText = "this, " + this.joinList(args);
            else
                argText = "this";

            return callee.text + "." + (spread ? "apply" : "call") + "(" + argText + ")";
        }

        if (spread) {

            argText = "void 0";

            if (node.callee.type === "MemberExpression") {

                argText = this.addTempVar(node);

                callee.object.text = `(${ argText } = ${ callee.object.text })`;
                callee.text = this.MemberExpression(callee) || this.stringify(callee);
            }

            return callee.text + ".apply(" + argText + ", " + spread + ")";
        }
    }

    SpreadExpression(node) {

        node.parent.hasSpread = true;
    }

    SuperExpression(node) {

        var proto = "__super",
            p = node.parent,
            elem = p;

        while (elem && elem.type !== "ClassElement")
            elem = elem.parent;

        if (elem.static) {

            proto = "__csuper";
            elem.parent.hasStaticSuper = true;
        }

        if (p.type === "CallExpression") {

            // super(args);
            p.isSuperCall = true;

            var m = this.parentFunction(p),
                name = ".constructor";

            if (m.type === "MethodDefinition") {

                name = m.name.type === "Identifier" ?
                    "." + m.name.text :
                    "[" + JSON.stringify(m.name.text) + "]";
            }

            return proto + name;

        } else {

            // super.foo...
            p.isSuperLookup = true;
        }

        p = p.parent;

        if (p.type === "CallExpression") {

            // super.foo(args);
            p.isSuperCall = true;
        }

        return proto;
    }

    MemberExpression(node) {

        if (node.isSuperLookup) {

            var prop = node.property.text;

            prop = node.computed ?
                "[" + prop + "]" :
                "." + prop;

            return node.object.text + prop;
        }
    }

    ArrowFunction(node) {

        var body = node.body.text;

        if (node.body.type !== "FunctionBody") {

            var insert = this.functionInsert(node);

            if (insert)
                insert += " ";

            body = "{ " + insert + "return " + body + "; }";
        }

        var text = node.kind === "async" ?
            this.asyncFunction(null, node.params, body) :
            "function(" + this.joinList(node.params) + ") " + body;

        return this.wrapFunctionExpression(text, node);
    }

    ThisExpression(node) {

        var fn = this.parentFunction(node);

        if (fn.type === "ArrowFunction") {

            while (fn = this.parentFunction(fn)) {

                if (fn.type !== "ArrowFunction") {

                    fn.createThisBinding = true;
                    break;
                }
            }

            return "__this";
        }
    }

    UnaryExpression(node) {

        if (node.operator !== "await")
            return;

        return "(yield " + node.expression.text + ")";
    }

    FunctionDeclaration(node) {

        if (node.kind === "async")
            return this.asyncFunction(node.identifier, node.params, node.body.text);
    }

    FunctionExpression(node) {

        if (node.kind === "async")
            return this.asyncFunction(node.identifier, node.params, node.body.text);
    }

    ClassDeclaration(node) {

        var params = "__super";

        if (node.body.hasStaticSuper)
            params += ", __csuper";

        return "var " + node.identifier.text + " = _es6now.class(" +
            (node.base ? (node.base.text + ", ") : "") +
            "function(" + params + ") {" + this.strictDirective() + " return " +
            node.body.text + " });";
    }

    ClassExpression(node) {

        var before = "",
            after = "";

        if (node.identifier) {

            before = "function() { var " + node.identifier.text + " = ";
            after = "; return " + node.identifier.text + "; }()";
        }

        var params = "__super";

        if (node.body.hasStaticSuper)
            params += ", __csuper";

        return "(" + before +
            "_es6now.class(" +
            (node.base ? (node.base.text + ", ") : "") +
            "function(" + params + ") {" + this.strictDirective() + " return " +
            node.body.text + " })" +
            after + ")";
    }

    ClassElement(node) {

        if (node.static) {

            var p = node.parent,
                id = p.staticID;

            if (id === void 0)
                id = p.staticID = 0;

            p.staticID += 1;

            var text = "{ " + this.stringify(node).replace(/^static\s+/, "") + " }";

            if (node.computedNames)
                text = this.wrapComputed(node, text);

            return "__static_" + id + ": " + text;
        }
    }

    ClassBody(node) {

        var classIdent = node.parent.identifier,
            hasBase = !!node.parent.base,
            elems = node.elements,
            hasCtor = false,
            e,
            i;

        for (i = elems.length; i--;) {

            e = elems[i];

            if (!e.static && e.method.name.value === "constructor") {

                hasCtor = true;

                // Give the constructor function a name so that the
                // class function's name property will be correct.
                if (classIdent)
                    e.text = e.text.replace(/:\s*function/, ": function " + classIdent.value);
            }

            if (i < elems.length - 1)
                e.text += ",";
        }

        // Add a default constructor if none was provided
        if (!hasCtor) {

            var ctor = "constructor: function";

            if (classIdent)
                ctor += " " + classIdent.value;

            ctor += "() {";

            if (hasBase) {

                ctor += ' var c = __super.constructor; ';
                ctor += "if (c) return c.apply(this, arguments); }";

            } else {

                ctor += "}";
            }

            if (elems.length === 0)
                return "{ " + ctor + " }";

            elems[elems.length - 1].text += ", " + ctor;
        }

        if (node.computedNames)
            return this.wrapComputed(node);
    }

    TemplateExpression(node) {

        var lit = node.literals,
            sub = node.substitutions,
            out = "",
            i;

        if (node.parent.type === "TaggedTemplateExpression") {

            out = "(_es6now.callSite(" +
                "[" + lit.map(x => this.rawToString(x.raw)).join(", ") + "]";

            // Only output the raw array if it is different from the cooked array
            for (i = 0; i < lit.length; ++i) {

                if (lit[i].raw !== lit[i].value) {

                    out += ", [" + lit.map(x => JSON.stringify(x.raw)).join(", ") + "]";
                    break;
                }
            }

            out += ")";

            if (sub.length > 0)
                out += ", " + sub.map(x => x.text).join(", ");

            out += ")";

        } else {

            for (i = 0; i < lit.length; ++i) {

                if (i > 0)
                    out += " + (" + sub[i - 1].text + ") + ";

                out += this.rawToString(lit[i].raw);
            }
        }

        return out;
    }

    ComprehensionFor(node) {

        return "for (var " + node.left.text + " of " + node.right.text + ")";
    }

    ArrayComprehension(node) {

        var out = "(function() { var __array = []; ";

        node.qualifiers.forEach(q => { out += q.text + " " });

        out += "__array.push(" + node.expression.text + "); ";
        out += "return __array; ";
        out += "}).call(this)"

        // Run replacer over this input to translate for-of statements
        return new Replacer().replace(out);
    }

    GeneratorComprehension(node) {

        var out = "(function*() { ";

        node.qualifiers.forEach(q => { out += q.text + " " });

        out += "yield (" + node.expression.text + "); ";
        out += "}).call(this)"

        // Run replacer over this input to translate for-of statements
        return new Replacer().replace(out);
    }

    CatchClause(node) {

        if (!this.isPattern(node.param))
            return null;

        var temp = this.addTempVar(node, null, true),
            assign = this.translatePattern(node.param, temp).join(", "),
            body = node.body.text.slice(1);

        return `catch (${ temp }) { let ${ assign }; ${ body }`;
    }

    VariableDeclarator(node) {

        if (!node.initializer || !this.isPattern(node.pattern))
            return null;

        var list = this.translatePattern(node.pattern, node.initializer.text);

        return list.join(", ");
    }

    AssignmentExpression(node) {

        var left = this.unwrapParens(node.left);

        if (!this.isPattern(left))
            return null;

        var temp = this.addTempVar(node),
            list = this.translatePattern(left, temp);

        list.unshift(temp + " = " + node.right.text);
        list.push(temp);

        return "(" + list.join(", ") + ")";
    }

    isPattern(node) {

        switch (node.type) {

            case "ArrayPattern":
            case "ObjectPattern":
                return true;
        }

        return false;
    }

    unwrapParens(node) {

        while (node && node.type === "ParenExpression")
            node = node.expression;

        return node;
    }

    spreadList(elems, newArray) {

        var list = [],
            last = -1,
            i;

        for (i = 0; i < elems.length; ++i) {

            if (elems[i].type === "SpreadExpression") {

                if (last < i - 1)
                    list.push({ type: "s", args: this.joinList(elems.slice(last + 1, i)) });

                list.push({ type: "i", args: elems[i].expression.text });

                last = i;
            }
        }

        if (last < elems.length - 1)
            list.push({ type: "s", args: this.joinList(elems.slice(last + 1)) });

        var out = "(_es6now.spread()";

        for (i = 0; i < list.length; ++i)
            out += `.${ list[i].type }(${ list[i].args })`;

        out += ".a)";

        return out;
    }

    translatePattern(node, base) {

        function propGet(name) {

            return /^[\.\d'"]/.test(name) ?
                "[" + name + "]" :
                "." + name;
        }

        var outer = [],
            inner = [],
            targets = [];

        node.patternTargets = targets;

        var visit = (tree, base) => {

            var target = tree.target,
                dType = tree.array ? "arrayd" : "objd",
                str = "",
                temp;

            var access =
                tree.rest ? `${ base }.rest(${ tree.skip }, ${ tree.name })` :
                tree.skip ? `${ base }.at(${ tree.skip }, ${ tree.name })` :
                tree.name ? base + propGet(tree.name) :
                base;

            if (tree.initializer) {

                temp = this.addTempVar(node);
                inner.push(`${ temp } = ${ access }`);

                str = `${ temp } === void 0 ? ${ tree.initializer } : ${ temp }`;

                if (!tree.target)
                    str = `${ temp } = _es6now.${ dType }(${ str })`;

                inner.push(str);

            } else if (tree.target) {

                inner.push(`${ access }`);

            } else {

                temp = this.addTempVar(node);
                inner.push(`${ temp } = _es6now.${ dType }(${ access })`);
            }

            if (tree.target) {

                targets.push(target);

                outer.push(inner.length === 1 ?
                    `${ target } = ${ inner[0] }` :
                    `${ target } = (${ inner.join(", ") })`);

                inner.length = 0;
            }

            if (temp)
                base = temp;

            tree.children.forEach(c => visit(c, base));
        };

        visit(this.createPatternTree(node), base);

        return outer;
    }

    createPatternTree(ast, parent) {

        if (!parent)
            parent = new PatternTreeNode("", null);

        var child, init, skip = 1;

        switch (ast.type) {

            case "ArrayPattern":

                parent.array = true;

                ast.elements.forEach((e, i) => {

                    if (!e) {

                        ++skip;
                        return;
                    }

                    init = e.initializer ? e.initializer.text : "";

                    child = new PatternTreeNode(String(i), init, skip);

                    if (e.type === "PatternRestElement")
                        child.rest = true;

                    parent.children.push(child);
                    this.createPatternTree(e.pattern, child);

                    skip = 1;
                });

                break;

            case "ObjectPattern":

                ast.properties.forEach(p => {

                    init = p.initializer ? p.initializer.text : "";
                    child = new PatternTreeNode(p.name.text, init);

                    parent.children.push(child);
                    this.createPatternTree(p.pattern || p.name, child);
                });

                break;

            default:

                parent.target = ast.text;
                break;
        }

        return parent;
    }

    asyncFunction(ident, params, body) {

        var head = "function";

        if (ident)
            head += " " + ident.text;

        var outerParams = params.map((x, i) => {

            var p = x.pattern || x.identifier;
            return p.type === "Identifier" ? p.value : "__$" + i;

        }).join(", ");

        return `${head}(${outerParams}) { ` +
            `try { return _es6now.async(function*(${ this.joinList(params) }) ` +
            `${ body }.apply(this, arguments)); ` +
            `} catch (x) { return Promise.reject(x); } }`;
    }

    rawToString(raw) {

        raw = raw.replace(/([^\n])?\n/g, (m, m1) => m1 === "\\" ? m : (m1 || "") + "\\n\\\n");
        raw = raw.replace(/([^"])?"/g, (m, m1) => m1 === "\\" ? m : (m1 || "") + '\\"');

        return '"' + raw + '"';
    }

    isVarScope(node) {

        switch (node.type) {

            case "ArrowFunction":
            case "FunctionDeclaration":
            case "FunctionExpression":
            case "MethodDefinition":
            case "Script":
            case "Module":
                return true;
        }

        return false;
    }

    parentFunction(node) {

        for (var p = node.parent; p; p = p.parent)
            if (this.isVarScope(p))
                return p;

        return null;
    }

    hasThisRef(node) {

        var hasThis = {};

        try {

            visit(node);

        } catch (err) {

            if (err === hasThis) return true;
            else throw err;
        }

        return false;

        function visit(node) {

            if (node.type === "FunctionExpression" ||
                node.type === "FunctionDeclaration")
                return;

            if (node.type === "ThisExpression")
                throw hasThis;

            node.children().forEach(visit);
        }
    }

    modulePath(node) {

        return node.type === "StringLiteral" ?
            this.identifyModule(node.value) :
            this.stringify(node);
    }

    identifyModule(url) {

        var legacy = false;

        url = url.trim();

        if (isLegacyScheme(url)) {

            url = removeScheme(url).trim();
            legacy = true;
        }

        if (typeof this.imports[url] !== "string") {

            this.imports[url] = "_M" + (this.uid++);
            this.dependencies.push({ url, legacy });
        }

        return this.imports[url];
    }

    stringify(node) {

        var offset = node.start,
            input = this.input,
            text = "";

        // Build text from child nodes
        node.children().forEach(child => {

            if (offset < child.start)
                text += input.slice(offset, child.start);

            text += child.text;
            offset = child.end;
        });

        if (offset < node.end)
            text += input.slice(offset, node.end);

        return text;
    }

    restParamVar(node) {

        var name = node.params[node.params.length - 1].identifier.value,
            pos = node.params.length - 1,
            temp = this.addTempVar(node, null, true);

        return `for (var ${ name } = [], ${ temp } = ${ pos }; ` +
            `${ temp } < arguments.length; ` +
            `++${ temp }) ${ name }.push(arguments[${ temp }]);`;

        return "var " + name + " = " + slice + ";";
    }

    addComputedName(node) {

        var name, p;

        for (p = node.parent; p; p = p.parent) {

            switch (p.type) {

                case "ClassElement":
                    if (!p.static) break;

                case "ObjectLiteral":
                case "ClassBody":

                    if (!p.computedNames)
                        p.computedNames = [];

                    var id = "__$" + p.computedNames.length;
                    p.computedNames.push(node.expression.text);

                    return id;
            }
        }

        return null;
    }

    wrapComputed(node, text) {

        if (node.computedNames)
            return "_es6now.computed(" + (text || this.stringify(node)) + ", " + node.computedNames.join(", ") + ")";
    }

    functionInsert(node) {

        var inserted = [];

        if (node.createThisBinding)
            inserted.push("var __this = this;");

        if (node.createRestBinding)
            inserted.push(this.restParamVar(node));

        node.params.forEach(param => {

            if (!param.pattern)
                return;

            var name = param.text;

            if (param.initializer)
                inserted.push(`if (${ name } === void 0) ${ name } = ${ param.initializer.text };`);

            if (this.isPattern(param.pattern))
                inserted.push("var " +  this.translatePattern(param.pattern, name).join(", ") + ";");
        });

        var temps = this.tempVars(node);

        // Add temp var declarations to the top of the insert
        if (temps)
            inserted.unshift(temps);

        return inserted.join(" ");
    }

    addTempVar(node, value, noDeclare) {

        var p = this.isVarScope(node) ? node : this.parentFunction(node);

        if (!p.tempVars)
            p.tempVars = [];

        var name = "__$" + p.tempVars.length;

        p.tempVars.push({ name, value, noDeclare });

        return name;
    }

    tempVars(node) {

        if (!node.tempVars)
            return "";

        var list = node.tempVars.filter(item => !item.noDeclare);

        if (list.length === 0)
            return "";

        return "var " + list.map(item => {

            var out = item.name;

            if (typeof item.value === "string")
                out += " = " + item.value;

            return out;

        }).join(", ") + ";";
    }

    strictDirective() {

        return this.isStrict ? "" : ' "use strict";';
    }

    lineNumber(offset) {

        return this.parser.location(offset).line;
    }

    syncNewlines(start, end, text) {

        var height = this.lineNumber(end - 1) - this.lineNumber(start);
        return preserveNewlines(text, height);
    }

    wrapFunctionExpression(text, node) {

        for (var p = node.parent; p; p = p.parent) {

            if (this.isVarScope(p))
                break;

            if (p.type === "ExpressionStatement") {

                if (p.start === node.start)
                    return "(" + text + ")";

                break;
            }
        }

        return text;
    }

    joinList(list) {

        var input = this.input,
            offset = -1,
            text = "";

        list.forEach(child => {

            if (offset >= 0 && offset < child.start)
                text += input.slice(offset, child.start);

            text += child.text;
            offset = child.end;
        });

        return text;
    }

}
