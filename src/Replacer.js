/*

== Notes ==

- With this approach, we can't have cyclic dependencies.  But there are
  many other restrictions as well.  They may be lifted at some point in
  the future.

*/

import "Parser.js" as Parser;

var HAS_SCHEMA = /^[a-z]+:/i,
    NPM_SCHEMA = /^npm:/i;

function loadCall(url) {

    return "__load(" + JSON.stringify(url) + ")";
}

export class Replacer {

    constructor() {
        
        this.loadCall = loadCall;
    }
    
    replace(input) {
    
        this.exportStack = [this.exports = {}];
        this.imports = {};
        this.dependencies = [];
        this.uid = 0;
        this.input = input;

        var root = Parser.parseModule(input);
        
        var visit = (node) => {
        
            // Call pre-order traversal method
            if (this[node.type + "Begin"])
                this[node.type + "Begin"](node);
            
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
        
        var output = visit({ 
        
            type: "$", 
            root: root, 
            start: 0, 
            end: input.length
        });
        
        var head = "";
        
        this.dependencies.forEach(url => {
        
            if (head) head += ", ";
            else head = "var ";
            
            head += this.imports[url] + " = " + this.loadCall(url);
        });
        
        if (head) 
            head += "; ";
        
        output = head + output;
        
        Object.keys(this.exports).forEach(k => {
    
            output += "\nexports." + k + " = " + this.exports[k] + ";";
        });
        
        return output;
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
    
        return "var " + node.ident.text + " = " + this.moduleIdent(node.from.value) + ";";
    }
    
    ModuleDeclarationBegin(node) {
    
        this.exportStack.push(this.exports = {});
    }
    
    ModuleDeclaration(node) {
    
        var out = "var " + node.ident.text + " = (function(exports) ";
        
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
    
        var out = "";
        
        var moduleSpec = node.from.type === "String" ?
            this.moduleIdent(node.from.value) :
            node.from.text;
        
        node.specifiers.forEach(spec => {
        
            var remote = spec.remote,
                local = spec.local || remote;
            
            if (out) out += ", ";
            else out = "var ";
            
            out += local.text + " = " + moduleSpec + "." + remote.text;
        });
        
        out += ";";
        
        return out;
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
        
        var from = binding.from,
            fromPath = "",
            out = "";
        
        if (from) {
        
            fromPath = from.type === "String" ?
                this.moduleIdent(from.value) :
                from.text;
        }
        
        if (!binding.specifiers) {
        
            if (from) {
            
                out += "Object.keys(" + fromPath + ").forEach(function(k) { exports[k] = " + fromPath + "[k]; });";
                
            } else {
            
                // TODO:
                throw new Error("`export *;` is not implemented.");
            }
        
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
        
        /*
        // Translate CommonJS require calls
        if (callee.type === "Identifier" && 
            callee.value === "require" &&
            args.length === 1 &&
            args[0].type === "String") {
        
            return this.loadCall(this.requirePath(args[0].value));
        }
        */
        
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
    
    /*
    requirePath(url) {
    
        url = url.trim();
        
        if (NPM_SCHEMA.test(url))
            url = url.replace(NPM_SCHEMA, "");
        else if (!HAS_SCHEMA.test(url) && url.charAt(0) !== "/")
            url = "./" + url;
        
        // Add to dependency list
        if (typeof this.imports[url] !== "string") {
        
            this.imports[url] = "_M" + (this.uid++);
            this.dependencies.push(url);
        }
        
        return url;
    }
    */
    
    moduleIdent(url) {
    
        url = url.trim();
        
        if (NPM_SCHEMA.test(url))
            url = url.replace(NPM_SCHEMA, "");
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
