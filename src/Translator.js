"use strict";

/*

== Notes ==

- With this approach, we can't have cyclic dependencies.  But there are
  many other restrictions as well.  They may be lifted at some point in
  the future.

*/

var Parser = require("./Parser.js");

var FILENAME = /^[^\.\/\\][\s\S]*?\.[^\s\.]+$/;

var SIGNATURE = "/*=es6now=*/";

var WRAP_CALLEE = "(function(fn, deps) { " +

    // Node.js, Rewrapped:
    "if (typeof exports !== 'undefined') " +
        "fn.call(typeof global === 'object' ? global : this, require, exports); " +
        
    // Sane module transport:
    "else if (typeof MODULE === 'function') " +
        "MODULE(fn, deps); " +
        
    // Insane module transport:
    "else if (typeof define === 'function' && define.amd) " +
        "define(['require', 'exports'].concat(deps), fn); " +
        
    // DOM global module:
    "else if (typeof window !== 'undefined' && {0}) " +
        "fn.call(window, null, window[{0}] = {}); " +
    
    // Hail Mary:
    "else " +
        "fn.call(window || this, null, {}); " +

"})";


function Translator() {
    
    this.exports = {};
    this.imports = {};
    this.dependencies = [];
    this.uid = 0;
}

Translator.prototype = {
    
    DoStatement: function(node) {
    
        // TODO: Insert trailing semicolon if necessary
    },
    
    Script: function(node) {
    
        // TODO: This should go after any "use strict" directive
        if (node.createThisBinding) {
        
            return "var __this = this; " + node.outerText;
        }
    },
    
    FunctionBody: function(node) {
    
        if (node.parentNode.createThisBinding)
            return "{ var __this = this; " + node.innerText.slice(1);
    },
    
    VariableDeclaration: function(node) {
    
        // TODO: if node.kind == "let" or "const" then look for another
        // variable in scope with the same name.  If there is, then
        // generate a new name and substitute all occurances in this block
        // and child scopes.
    },
    
    MethodDefinition: function(node) {
    
        var name = node.name;
        
        if (node.kind === "method")
            return name.innerText + ": function(" + this.paramList(node.params) + ")" + node.body.outerText;
    },
    
    PropertyDefinition: function(node) {
    
        if (node.expression === null)
            return node.name.value + ": " + node.name.value;
    },
    
    ModuleImport: function(node) {
    
        var url = this.requirePath(node.from.value);
        return "var " + node.id.value + " = " + this.requireCall(url) + ";";
    },
    
    ModuleDeclaration: function(node) {
    
        // TODO: Inline modules
    },
    
    ImportDeclaration: function(node) {
    
        var binding = node.binding,
            from = node.from,
            moduleSpec,
            out = "",
            tmp;
        
        moduleSpec = from.type === "String" ?
            this.requireCall(this.requirePath(from.value)) :
            from.innerText;
        
        if (binding.type === "Identifier") {
        
            out = "var " + binding.value + " = " + moduleSpec + "." + binding.value + ";";
            
        } else if (binding.type === "ImportSpecifierSet") {
        
            tmp = "_M" + (this.uid++);
            out = "var " + tmp + " = " + moduleSpec;
            
            binding.specifiers.forEach(function(spec) {
            
                var name = spec.name,
                    id = spec.id || name;
                
                out += ", " + id.value + " = " + tmp + "." + name.value;
            });
            
            out += ";";
        }
        
        return out;
    },
    
    ExportDeclaration: function(node) {
    
        var binding = node.binding,
            out = binding.innerText,
            exports = this.exports,
            modulePath,
            from,
            id;
        
        switch (binding.type) {
        
            case "*":
            
                from = node.from;
                
                if (from.type === "String") {
                
                    modulePath = "_M" + (this.uid++);
                    out = "var " + modulePath + " = " + this.requireCall(this.requirePath(from.value)) + "; ";
                
                } else {
                
                    modulePath = node.from.innerText;
                    out = "";
                }
                
                out += "Object.keys(" + modulePath + ").forEach(function(k) { exports[k] = " + modulePath + "[k]; });";
                break;
        
            case "VariableDeclaration":
            
                binding.declarations.forEach(function(decl) {
            
                    var id = decl.pattern.value;
                    exports[id] = id;
                });
                
                out += ";";
                break;
            
            case "FunctionDeclaration":
            case "ClassDeclaration":
            
                id = binding.id.value;
                exports[id] = id;
                break;
            
            case "Identifier":
            
                id = binding.value;
                exports[id] = id;
                out = "";
                break;
            
            default:
            
                binding.specifiers.forEach(function(spec) {
            
                    var id = spec.id,
                        from = spec.from;
                    
                    exports[id.value] = from ? 
                        from.elements.map(function(e) { return e.value }).join(".") :
                        id.value;
                });
                
                out = "";
                break;
                
        }
        
        return out;
    },
    
    CallExpression: function(node) {
    
        var callee = node.callee,
            args = node.arguments;
        
        if (callee.type === "Identifier" && 
            callee.value === "require" &&
            args.length === 1 &&
            args[0].type === "String") {
        
            return this.requireCall(this.requirePath(args[0].value));
        }
        
        if (node.isSuperCall) {
        
            var argText = "this";
            
            if (args.length > 0) {
            
                argText += ", ";
                argText += args.map(function(arg) { return arg.outerText; }).join(",");
            }
            
            return callee.innerText + ".call(" + argText + ")";
        }
        
        return null;
    },
    
    SuperExpression: function(node) {
    
        var p = node.parentNode;
        
        if (p.type === "CallExpression") {
        
            p.isSuperCall = true;
            return "__super";
        }
        
        p = p.parentNode;
        
        if (p.type === "CallExpression")
            p.isSuperCall = true;
        
        return "__super.prototype";
    },
    
    MemberExpression: function(node) {
    
        if (node.object.type === "super") {
        
            return node.innerText.replace(/^super/, "super.prototype");
        }
    },
    
    ArrowFunction: function(node) {
    
        var head, body, expr;
        
        head = "function(" + this.paramList(node.params) + ")";
        
        if (node.body.type === "FunctionBody") {
        
            body = " { " + node.body.innerText.replace(/^\{|\}$/g, "")  + "}";
        
        } else {
        
            body = " { return " + node.body.innerText + "; }";
        }

        return "(" + head + body + ")";
    },
    
    ThisExpression: function(node) {
    
        var fn = this.parentFunction(node);
        
        if (fn.type === "ArrowFunction") {
        
            while (fn = this.parentFunction(fn))
                if (fn.type !== "ArrowFunction")
                    fn.createThisBinding = true;
            
            return "__this";
        }
    },
    
    ClassDeclaration: function(node) {
    
        var name = node.id ? ("var " + node.id.value + " = ") : "";
        
        return name + "es6now.Class(" + 
            (node.base ? node.base.innerText : "null") + ", " +
            "function(__super) { return" +
            node.body.outerText + "});";
    },
    
    ClassExpression: function(node) {
    
        // TODO:  named class expressions aren't currently supported
        
        return "es6now.Class(" + 
            (node.base ? node.base.innerText : "null") + ", " +
            "function(__super) { return" +
            node.body.outerText + "})";
    },
    
    ClassBody: function(node) {
    
        var elems = node.elements,
            out = "",
            i;
        
        for (i = 0; i < elems.length; ++i) {
        
            if (i > 0)
                out += ",";
            
            out += elems[i].outerText;
        }
        
        return "{" + out + "\n}";
    },
    
    QuasiExpression: function(node) {
    
        var lit = node.literals,
            sub = node.substitutions,
            out = "",
            i;
        
        for (i = 0; i < lit.length; ++i) {
        
            if (i > 0)
                out += " + (" + sub[i - 1].innerText + ") + ";
            
            out += JSON.stringify(lit[i].value);
        }
        
        return out;
    },
    
    paramList: function(list) {
    
        return list
            .map(function(param) { return param.innerText; })
            .join(", ");
    },
    
    parentFunction: function(node) {
    
        for (var p = node.parentNode; p; p = p.parentNode) {
        
            switch (p.type) {
            
                case "ArrowFunction":
                case "FunctionDeclaration":
                case "FunctionExpression":
                case "MethodDefinition":
                case "Script":
                    return p;
            }
        }
        
        return null;
    },
    
    hasThisRef: function(node) {
    
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
            
            Parser.forEachChild(node, visit);
        }
    },
    
    requirePath: function(url) {
    
        if (FILENAME.test(url))
            url = "./" + url;
        
        if (this.imports[url] !== true) {
        
            this.imports[url] = true;
            this.dependencies.push(url);
        }
        
        return url;
    },
    
    requireCall: function(url) {
    
        return "require(" + JSON.stringify(url) + ")";
    }

};

function translate(input, options) {

    options || (options = {});
    
    var translator = new Translator(),
        output;
    
    if (options.requireCall)
        translator.requireCall = options.requireCall;
    
    output = Parser.replace(input, translator);
        
    Object.keys(translator.exports).forEach(function(k) {
    
        output += "\nexports." + k + " = " + translator.exports[k] + ";";
    });
    
    if (options.wrap !== false)
        output = wrap(output, translator.dependencies, options.global);
    
    return output;
}

function wrap(text, dep, global) {

    var callee = WRAP_CALLEE.replace(/\{0\}/g, JSON.stringify(global || ""));
    
    return SIGNATURE + callee + "(function(require, exports) { " + text + "\n\n}, " + JSON.stringify(dep) + ");";
}

function isWrapped(text) {

    return text.indexOf(SIGNATURE) === 0;
}

exports.translate = translate;
exports.wrap = wrap;
exports.isWrapped = isWrapped;
