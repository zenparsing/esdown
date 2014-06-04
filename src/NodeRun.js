import { translate } from "Translator.js";
import { isPackageURI, locatePackage } from "PackageLocator.js";
import { ConsoleStyle as Style } from "package:zencmd";
import { parse } from "package:esparse";

var FS = require("fs"),
    REPL = require("repl"),
    VM = require("vm"),
    Path = require("path"),
    Util = require("util"),
    Module = module.constructor,
    global = this;

export function formatSyntaxError(e, filename) {

    var msg = e.message,
        text = e.sourceText;
        
    if (filename === void 0 && e.filename !== void 0)
        filename = e.filename;
    
    if (filename)
        msg += `\n    ${filename}:${e.line}`;
    
    if (e.lineOffset < text.length) {
    
        var code = "\n\n" +
            text.slice(e.lineOffset, e.startOffset) +
            Style.bold(Style.red(text.slice(e.startOffset, e.endOffset))) + 
            text.slice(e.endOffset, text.indexOf("\n", e.endOffset)) +
            "\n";
        
        msg += code.replace(/\n/g, "\n    ");
    }
    
    return msg;
}

function addExtension() {

    var resolveFilename = Module._resolveFilename;
    
    Module._resolveFilename = (filename, parent) => {
    
        if (isPackageURI(filename))
            filename = locatePackage(filename, Path.dirname(parent.filename));
        
        return resolveFilename(filename, parent);
    };
    
    // Compile ES6 js files
    require.extensions[".js"] = (module, filename) => {
    
        var text, source;
        
        try {
        
            text = source = FS.readFileSync(filename, "utf8");
            
            // Only translate as a module if the source module is requesting 
            // via import syntax
            var m = !!module.parent.__es6;
            
            text = translate(text, { wrap: m, module: m });
        
        } catch (e) {
        
            if (e instanceof SyntaxError)
                e = new SyntaxError(formatSyntaxError(e, filename));
            
            throw e;
        }
        
        return module._compile(text, filename);
    };
}

export function runModule(path) {

    addExtension();
    
    var path = Path.resolve(process.cwd(), path),
        stat;

    try { stat = FS.statSync(path) }
    catch (x) {}

    if (stat && stat.isDirectory())
        path = Path.join(path, "main.js");

    // "__load" is defined in the module wrapper and ensures that the
    // target is loaded as a module
    
    var m = __load(path);

    if (m && typeof m.main === "function") {
    
        var result = m.main(process.argv);
        Promise.resolve(result).then(null, x => setTimeout($=> { throw x }, 0));
    }
}

export function startREPL() {

    addExtension();
    
    // Provide a way to load a module from the REPL
    global.loadModule = path => __load(global.require.resolve(path));
    
    var prompt = ">>> ", contPrompt = "... ";
    
    var repl = REPL.start({ 
        
        prompt, 
        
        useGlobal: true,
        
        eval(input, context, filename, cb) {
        
            var text, result, script, displayErrors = false;
            
            try {
            
                text = translate(input, { module: false });
            
            } catch (x) {
            
                // Regenerate syntax error to eliminate parser stack
                if (x instanceof SyntaxError)
                    x = new SyntaxError(x.message);
                
                return cb(x);
            }
            
            try {
                
                script = VM.createScript(text, { filename, displayErrors });
                
                result = repl.useGlobal ?
                    script.runInThisContext({ displayErrors }) :
                    script.runInContext(context, { displayErrors });
                
            } catch (x) {
            
                return cb(x);
            }
            
            if (result instanceof Promise) {
            
                // Without displayPrompt, asynchronously calling the "eval"
                // callback results in no text being displayed on the screen.
                
                result
                .then(x => cb(null, x), err => cb(err, null))
                .then($=> this.displayPrompt());
                
            } else {
            
                cb(null, result);
            }
        }
    });
    
    // Override displayPrompt so that ellipses are displayed for
    // cross-line continuations
    
    if (typeof repl.displayPrompt === "function" && 
        typeof repl._prompt === "string") {
    
        var displayPrompt = repl.displayPrompt;
    
        repl.displayPrompt = function(preserveCursor) {
    
            this._prompt = this.bufferedCommand ? contPrompt : prompt;
            return displayPrompt.call(this, preserveCursor);
        };
    }
    
    function parseAction(input, module) {
    
        var text, ast;
            
        try {
    
            ast = parse(input, { module });
            text = Util.inspect(ast, { colors: true, depth: 10 });
    
        } catch (x) {
    
            text = x instanceof SyntaxError ?
                formatSyntaxError(x, "REPL") :
                x.toString();
        }
    
        console.log(text);
    }
    
    if (typeof repl.defineCommand === "function") {
    
        repl.defineCommand("translate", {
    
            help: "Translate ES6 to ES5",
        
            action(input) {
            
                var text;
            
                try {
            
                    text = translate(input, { wrap: false, module: false });
            
                } catch (x) {
            
                    text = x instanceof SyntaxError ?
                        formatSyntaxError(x, "REPL") :
                        x.toString();
                }
            
                console.log(text);
            
                this.displayPrompt();
            }
        });
        
        repl.defineCommand("parse", {
        
            help: "Parse a script",
            
            action(input) {
            
                parseAction(input, false);
                this.displayPrompt();
            }
            
        });
        
        repl.defineCommand("parseModule", {
        
            help: "Parse a module",
            
            action(input) {
            
                parseAction(input, true);
                this.displayPrompt();
            }
            
        });
    }
    
}
