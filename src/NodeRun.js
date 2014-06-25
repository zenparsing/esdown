import { ConsoleStyle as Style } from "package:zencmd";
import { parse } from "package:esparse";
import { translate } from "Translator.js";
import { isPackageURI, locatePackage } from "PackageLocator.js";

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

function locateModule(path, base) {

    if (isPackageURI(path))
        return locatePackage(path, base);
    
    path = Path.resolve(base, path);
    
    var stat;

    try { stat = FS.statSync(path) }
    catch (x) {}

    if (stat && stat.isDirectory())
        path = Path.join(path, "main.js");
    
    return path;
}

function addExtension() {

    var resolveFilename = Module._resolveFilename;
    
    Module._resolveFilename = (filename, parent) => {
    
        if (parent.__es6)
            filename = locateModule(filename, Path.dirname(parent.filename));
        
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
    
    var path = locateModule(path, process.cwd());
    
    // "__load" is defined in the module wrapper and ensures that the
    // target is loaded as a module
    
    var m = __load(path);

    if (m && typeof m.main === "function") {
    
        var result = m.main(process.argv);
        Promise.resolve(result).then(null, x => setTimeout($=> { throw x }, 0));
    }
}

export function startREPL() {

    // Node 0.10.x pessimistically wraps all input in parens and then
    // re-evaluates function expressions as function declarations.  Since
    // Node is unaware of class declarations, this causes classes to 
    // always be interpreted as expressions in the REPL.
    var removeParens = global.process.version.startsWith("v0.10.");
    
    addExtension();
    
    console.log(`es6now ${ _es6now.version } (Node ${ process.version })`);
    
    // Provide a way to load an ES6 module from the REPL
    global.loadModule = path => __load(locateModule(path, process.cwd()));
    
    var prompt = ">>> ", contPrompt = "... ";
    
    var repl = REPL.start({ 
        
        prompt, 
        
        useGlobal: true,
        
        eval(input, context, filename, cb) {
        
            var text, result, script, displayErrors = false;
                        
            // Remove wrapping parens for function and class declaration forms
            if (removeParens && /^\((class|function\*?)\s[\s\S]*?\n\)$/.test(input))
                input = input.slice(1, -1);
            
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
    
    var commands = {
    
        "help": {
        
            help: "Show REPL commands",
            
            action() {
            
                var list = Object.keys(this.commands).sort(),
                    len = list.reduce((n, key) => Math.max(n, key.length), 0);
                    
                list.forEach(key => {
                
                    var help = this.commands[key].help || "",
                        pad = " ".repeat(4 + len - key.length);
                    
                    this.outputStream.write(key + pad + help + "\n");
                });
                
                this.displayPrompt();
            }
        
        },
    
        "translate": {
    
            help: "Translate ES6 to ES5 and show the result (es6now)",
        
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
        },
        
        "parse": {
        
            help: "Parse a script and show the AST (es6now)",
            
            action(input) {
            
                parseAction(input, false);
                this.displayPrompt();
            }
            
        },
        
        "parseModule": {
        
            help: "Parse a module and show the AST (es6now)",
            
            action(input) {
            
                parseAction(input, true);
                this.displayPrompt();
            }
            
        },
    };
    
    if (typeof repl.defineCommand === "function")
        Object.keys(commands).forEach(key => repl.defineCommand(key, commands[key]));
}
