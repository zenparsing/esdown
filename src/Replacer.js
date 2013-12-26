/*

== Notes ==

- With this approach, we can't have cyclic dependencies.  But there are
  many other restrictions as well.  They may be lifted at some point in
  the future.

*/

import { Parser, AST } from "package:es6parse";

var HAS_SCHEMA = /^[a-z]+:/i,
    NODE_SCHEMA = /^(?:npm|node):/i;

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

class RootNode extends AST.Node {

    constructor(root, end) {
    
        super(0, end);
        this.root = root;
    }
}

export class Replacer {

    constructor(options) {
        
        options || (options = {});
        
        this.loadCall = options.loadCall || (url => "__load(" + JSON.stringify(url) + ")");
        this.mapURI = options.mapURI || (uri => uri);
    }
    
    replace(input) {
    
        this.exportStack = [this.exports = {}];
        this.imports = {};
        this.dependencies = [];
        this.uid = 0;
        this.input = input;

        var parser = new Parser(input),
            scanner = parser.scanner,
            root = parser.Module();
        
        var visit = node => {
        
            node.text = null;
                
            // Call pre-order traversal method
            if (this[node.type + "Begin"])
                this[node.type + "Begin"](node);
            
            // Perform a depth-first traversal
            node.forEachChild(child => {
            
                child.parentNode = node;
                visit(child);
            });
            
            var text = null;
            
            // Call replacer
            if (this[node.type])
                text = this[node.type](node);
            
            if (text === null || text === void 0)
                text = this.stringify(node);
            
            var height = scanner.lineNumber(node.end - 1) - scanner.lineNumber(node.start);
            
            return node.text = preserveNewlines(text, height);
        };
        
        var output = visit(new RootNode(root, input.length)),
            head = "";
        
        this.dependencies.forEach(url => {
        
            if (head) head += ", ";
            else head = "var ";
            
            head += this.imports[url] + " = " + this.loadCall(url);
        });
        
        if (head) 
            head += "; ";
        
        output = head + output;
        
        Object.keys(this.exports).forEach(k => {
    
            output += "\nexports";
            
            if (RESERVED_WORD.test(k))
                output += "[" + JSON.stringify(k) + "]";
            else
                output += "." + k;
            
            output += " = " + this.exports[k] + ";";
        });
        
        return output;
    }

    DoWhileStatement(node) {
    
        var text = this.stringify(node);
        
        if (text.slice(-1) !== ";")
            return text + ";";
    }
    
    Module(node) {
    
        if (node.createThisBinding)
            return "var __this = this; " + this.stringify(node);
    }
    
    Script(node) {
    
        if (node.createThisBinding)
            return "var __this = this; " + this.stringify(node);
    }
    
    FunctionBody(node) {
    
        if (node.parentNode.createThisBinding)
            return "{ var __this = this; " + this.stringify(node).slice(1);
    }
    
    MethodDefinition(node) {
    
        if (node.parentNode.type === "ClassElement" && 
            node.parentNode.static) {
            
            node.name.text = "__static_" + (node.name.value || "");
        }
        
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
    
        var out = "var " + node.identifier.text + " = (function(exports) ";
        
        out += node.body.text.replace(/\}$/, "");
        
        Object.keys(this.exports).forEach(k => {
    
            out += "exports." + k + " = " + this.exports[k] + "; ";
        });
        
        this.exportStack.pop();
        this.exports = this.exportStack[this.exportStack.length - 1];
        
        out += "return exports; }).call(this, {});";
        
        return out;
    }
    
    ImportDeclaration(node) {
    
        var moduleSpec = this.modulePath(node.from),
            list = [];
        
        if (node.specifiers) {
        
            node.specifiers.forEach(spec => {
        
                var remote = spec.remote,
                    local = spec.local || remote;
            
                list.push({
                    start: spec.start,
                    end: spec.end,
                    text: local.text + " = " + moduleSpec + "." + remote.text
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
    
        var binding = node.binding,
            bindingType = binding ? binding.type : "*",
            exports = this.exports,
            ident;
        
        // Exported declarations
        switch (binding.type) {
        
            case "VariableDeclaration":
            
                binding.declarations.forEach(decl => {
            
                    ident = decl.pattern.text;
                    exports[ident] = ident;
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
                    remote = spec.remote ? spec.remote.text : local;
            
                exports[remote] = from ? 
                    fromPath + "." + local :
                    local;
            });
        }
        
        return out;
    }
    
    CallExpression(node) {
    
        var callee = node.callee,
            args = node.arguments;
        
        if (node.isSuperCall) {
        
            var argText = "this";
            
            if (args.length > 0)
                argText += ", " + this.joinList(args);
            
            return callee.text + ".call(" + argText + ")";
        }
    }
    
    SuperExpression(node) {
    
        var p = node.parentNode;
        
        if (p.type === "CallExpression") {
        
            // super(args);
        
            p.isSuperCall = true;
            
            var m = this.parentFunction(p),
                name = (m.type === "MethodDefinition" ? m.name.text : "constructor");
            
            return "__super(" + JSON.stringify(name) + ")";
            
        } else {
        
            // super.foo...
            p.isSuperLookup = true;
        }
        
        p = p.parentNode;
        
        if (p.type === "CallExpression") {
        
            // super.foo(args);
            p.isSuperCall = true;
        }
        
        return "__super";
    }
    
    MemberExpression(node) {
    
        if (node.isSuperLookup) {
        
            var prop = node.property.text;
            
            if (!node.computed)
                prop = '"' + prop + '"';
            
            return node.object.text + "(" + prop + ")";
        }
    }
    
    ArrowFunction(node) {
    
        var body = node.body.type === "FunctionBody" ?
            node.body.text :
            "{ return " + node.body.text + "; }";
        
        return node.kind === "async" ?
            "(" + this.asyncFunction(null, node.params, body) + ")" :
            "(function(" + this.joinList(node.params) + ") " + body + ")";
    }
    
    ThisExpression(node) {
    
        var fn = this.parentFunction(node);
        
        if (fn.type === "ArrowFunction") {
        
            while (fn = this.parentFunction(fn))
                if (fn.type !== "ArrowFunction")
                    fn.createThisBinding = true;
            
            return "__this";
        }
    }
    
    AwaitExpression(node) {
    
        return node.expression ? "(yield " + node.expression.text + ")" : "yield";
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
    
        return "var " + node.identifier.text + " = __class(" + 
            (node.base ? (node.base.text + ", ") : "") +
            "function(__super) { return " +
            node.body.text + " });";
    }
    
    ClassExpression(node) {
    
        var before = "", 
            after = "";
        
        if (node.identifier) {
        
            before = "(function() { var " + node.identifier.text + " = ";
            after = "; return " + node.identifier.text + "; })()";
        }
        
        return "(" + before + 
            "__class(" + 
            (node.base ? (node.base.text + ", ") : "") +
            "function(__super) { return " +
            node.body.text + " })" +
            after + ")";
    }
    
    ClassBody(node) {
    
        var classIdent = node.parentNode.identifier,
            hasBase = !!node.parentNode.base,
            elems = node.elements, 
            hasCtor = false,
            e,
            i;
        
        for (i = elems.length; i--;) {
        
            e = elems[i];
            
            if (e.static) {
            
                e.text = e.text.replace(/^static\s+/, "");
                
            } else if (e.method.name.value === "constructor") {
            
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
            
                ctor += ' var c = __super("constructor"); ';
                ctor += "if (c) return c.apply(this, arguments); }";
                
            } else {
            
                ctor += "}";
            }
            
            if (elems.length === 0)
                return "{ " + ctor + " }";
                
            elems[elems.length - 1].text += ", " + ctor;
        }
    }
    
    TemplateExpression(node) {
    
        var lit = node.literals,
            sub = node.substitutions,
            out = "",
            i;
        
        for (i = 0; i < lit.length; ++i) {
        
            if (i > 0)
                out += " + (" + sub[i - 1].text + ") + ";
            
            out += JSON.stringify(lit[i].value);
        }
        
        return out;
    }
    
    asyncFunction(ident, params, body) {
    
        var head = "function";
        
        if (ident)
            head += " " + ident.text;
        
        var outerParams = params.map((x, i) => "__" + i).join(", ");
        
        return `${head}(${outerParams}) { ` +
            `try { return __async(function*(${ this.joinList(params) }) ` + 
            `${ body }.apply(this, arguments)); ` +
            `} catch (x) { return Promise.reject(x); } }`;
    }
    
    parentFunction(node) {
    
        for (var p = node.parentNode; p; p = p.parentNode) {
        
            switch (p.type) {
            
                case "ArrowFunction":
                case "FunctionDeclaration":
                case "FunctionExpression":
                case "MethodDefinition":
                case "Script":
                case "Module":
                    return p;
            }
        }
        
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
            
            node.forEachChild(visit);
        }
    }
    
    modulePath(node) {
    
        return node.type === "String" ?
            this.moduleIdent(node.value) :
            this.stringify(node);
    }
    
    moduleIdent(url) {
    
        url = this.mapURI(url.trim());
        
        if (NODE_SCHEMA.test(url))
            url = url.replace(NODE_SCHEMA, "");
        else if (!HAS_SCHEMA.test(url) && url.charAt(0) !== "/")
            url = "./" + url;
        
        if (typeof this.imports[url] !== "string") {
        
            this.imports[url] = "_M" + (this.uid++);
            this.dependencies.push(url);
        }
        
        return this.imports[url];
    }
    
    stringify(node) {
        
        var offset = node.start,
            input = this.input,
            text = "";
        
        // Build text from child nodes
        node.forEachChild(child => {
        
            if (offset < child.start)
                text += input.slice(offset, child.start);
            
            text += child.text;
            offset = child.end;
        });
        
        if (offset < node.end)
            text += input.slice(offset, node.end);
        
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
