/*

== Notes ==

- With this approach, we can't have cyclic dependencies.  But there are
  many other restrictions as well.  They may be lifted at some point in
  the future.

*/

import "Parser.js" as Parser;

var FILENAME = /^[^\.\/\\][\s\S]*?\.[^\s\.]+$/;

function requireCall(url) {

    return "require(" + JSON.stringify(url) + ")";
}

export class Replacer {

    constructor() {
        
        this.requireCall = requireCall;
    }
    
    replace(input) {
    
        this.exports = {};
        this.imports = {};
        this.dependencies = [];
        this.uid = 0;
        this.input = input;

        var root = Parser.parseModule(input);
        
        var visit = (node) => {
        
            // Perform a depth-first traversal
            Parser.forEachChild(node, child => {
            
                child.parentNode = node;
                visit(child);
            });
            
            node.text = this.stringify(node);
            
            // Call replacer
            if (this[node.type]) {
            
                var replaced = this[node.type](node);
                
                node.text = (replaced === undefined || replaced === null) ?
                    this.stringify(node) :
                    replaced;
            }
            
            return node.text;
        };
        
        return visit({ 
        
            type: "$", 
            root: root, 
            start: 0, 
            end: input.length
        });
    }

    DoWhileStatement(node) {
    
        if (node.text.slice(-1) !== ";")
            return node.text + ";";
    }
    
    Module(node) {
    
        if (node.createThisBinding)
            return "var __this = this; " + node.text;
    }
    
    Script(node) {
    
        if (node.createThisBinding)
            return "var __this = this; " + node.text;
    }
    
    FunctionBody(node) {
    
        if (node.parentNode.createThisBinding)
            return "{ var __this = this; " + node.text.slice(1);
    }
    
    MethodDefinition(node) {
    
        // TODO: Generator methods
        
        // TODO: will fail if name is a string:  static "name"() {}
        if (node.parentNode.type === "ClassElement" && 
            node.parentNode.static) {
            
            node.name.text = "__static_" + node.name.text;
        }
        
        if (!node.modifier)
            return node.name.text + ": function(" + this.joinList(node.params) + ") " + node.body.text;
    }
    
    PropertyDefinition(node) {
    
        if (node.expression === null)
            return node.name.text + ": " + node.name.text;
    }
    
    ImportAsDeclaration(node) {
    
        var expr = this.requireCall(this.requirePath(node.url.value));
        
        return "var " + node.ident.text + " = " + expr + ";";
    }
    
    ModuleDeclaration(node) {
    
        // TODO: Inline modules
    }
    
    ImportDeclaration(node) {
    
        var binding = node.binding,
            from = node.from,
            moduleSpec,
            out = "",
            tmp;
        
        moduleSpec = from.type === "String" ?
            this.requireCall(this.requirePath(from.value)) :
            from.text;
        
        if (binding.type === "Identifier") {
        
            out = "var " + binding.text + " = " + moduleSpec + "." + binding.text + ";";
            
        } else if (binding.type === "ImportSpecifierSet") {
        
            tmp = "_M" + (this.uid++);
            out = "var " + tmp + " = " + moduleSpec;
            
            binding.specifiers.forEach(spec => {
            
                var name = spec.name,
                    ident = spec.ident || name;
                
                out += ", " + ident.text + " = " + tmp + "." + name.text;
            });
            
            out += ";";
        }
        
        return out;
    }
    
    ExportDeclaration(node) {
    
        var binding = node.binding,
            bindingType = binding ? binding.type : "*",
            exports = this.exports,
            ident;
        
        // Exported declarations
        switch (bindingType) {
        
            case "VariableDeclaration":
            
                binding.declarations.forEach(decl => {
            
                    // TODO: Destructuring!
                    ident = decl.pattern.text;
                    exports[ident] = ident;
                });
                
                return binding.text + ";";
            
            case "FunctionDeclaration":
            case "ClassDeclaration":
            
                ident = binding.ident.text;
                exports[ident] = ident;
                return binding.text;
        }
        
        var from = node.from,
            fromPath = "",
            out = "";
        
        if (from) {
        
            if (from.type === "String") {
            
                fromPath = "_M" + (this.uid++);
                out = "var " + fromPath + " = " + this.requireCall(this.requirePath(from.value)) + "; ";
            
            } else {
            
                fromPath = node.from.text;
            }
        }
        
        // Exported bindings
        switch (bindingType) {
        
            case "*":
            
                if (from) {
                
                    out += "Object.keys(" + fromPath + ").forEach(function(k) { exports[k] = " + fromPath + "[k]; });";
                    
                } else {
                
                    // TODO:
                    throw new Error("`export *;` is not implemented.");
                }
                
                break;
                
            case "Identifier":
            
                ident = binding.text;
                exports[ident] = from ? (fromPath + "." + ident) : ident;
                break;
            
            default:
            
                binding.specifiers.forEach(spec => {
            
                    var ident = spec.ident.text,
                        path = spec.path ? spec.path.text : ident;
                    
                    exports[ident] = from ? 
                        fromPath + "." + path :
                        path;
                });
                
                break;
        }
        
        return out;
    }
    
    CallExpression(node) {
    
        var callee = node.callee,
            args = node.arguments;
        
        // Translate CommonJS require calls
        if (callee.type === "Identifier" && 
            callee.value === "require" &&
            args.length === 1 &&
            args[0].type === "String") {
        
            return this.requireCall(this.requirePath(args[0].value));
        }
        
        if (node.isSuperCall) {
        
            var argText = "this";
            
            if (args.length > 0)
                argText += ", " + this.joinList(args);
            
            // TODO: what if callee is of the form super["abc"]?
            return callee.text + ".call(" + argText + ")";
        }
    }
    
    SuperExpression(node) {
    
        var p = node.parentNode;
        
        if (p.type === "CallExpression") {
        
            p.isSuperCall = true;
            
            var m = this.parentFunction(p),
                name = (m.type === "MethodDefinition" ? m.name.text : "constructor");
            
            // TODO: what if method name is not an identifier?
            return "__super." + name;
        }
        
        p = p.parentNode;
        
        if (p.type === "CallExpression")
            p.isSuperCall = true;
        
        return "__super";
    }
    
    ArrowFunction(node) {
    
        var head, body, expr;
        
        head = "function(" + this.joinList(node.params) + ")";
        
        if (node.body.type === "FunctionBody") {
        
            body = node.body.text;
        
        } else {
        
            body = "{ return " + node.body.text + "; }";
        }

        return "(" + head + " " + body + ")";
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
    
    ClassDeclaration(node) {
    
        return "var " + node.ident.text + " = es6now.Class(" + 
            (node.base ? (node.base.text + ", ") : "") +
            "function(__super) { return " +
            node.body.text + "});";
    }
    
    ClassExpression(node) {
    
        var before = "", 
            after = "";
        
        if (node.ident) {
        
            before = "(function() { var " + node.ident.text + " = ";
            after = "; return " + node.ident.text + "; })()";
        }
        
        return before + 
            "es6now.Class(" + 
            (node.base ? (node.base.text + ", ") : "") +
            "function(__super) { return" +
            node.body.text + "})" +
            after;
    }
    
    ClassBody(node) {
    
        var elems = node.elements, 
            e,
            i;
        
        for (i = elems.length; i--;) {
        
            e = elems[i];
            
            if (e.static)
                e.text = e.text.replace(/^static\s+/, "");
            
            if (i < elems.length - 1)
                e.text += ",";
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
            
            Parser.forEachChild(node, visit);
        }
    }
    
    requirePath(url) {
    
        // If this is a simple local filename, then add "./" prefix
        // so that Node will not treat it as a package
        if (FILENAME.test(url))
            url = "./" + url;
        
        // Add to dependency list
        if (this.imports[url] !== true) {
        
            this.imports[url] = true;
            this.dependencies.push(url);
        }
        
        return url;
    }
    
    stringify(node) {
        
        var offset = node.start,
            input = this.input,
            text = "";
        
        // Build text from child nodes
        Parser.forEachChild(node, child => {
        
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
