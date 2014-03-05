module FS from "node:fs";
module REPL from "node:repl";
module VM from "node:vm";
module Path from "node:path";

import { translate } from "Translator.js";
import { isPackageURI, locatePackage } from "PackageLocator.js";
import { ConsoleStyle as Style } from "package:zen-bits";

var ES6_GUESS = /(?:^|\n)\s*(?:import|export|class)\s/;

export function formatSyntaxError(e, filename) {

    var msg = e.message,
        text = e.sourceText;
    
    if (filename === void 0 && e.filename !== void 0)
        filename = e.filename;
    
    if (filename)
        msg += "\n    at " + filename + ":" + e.line;
    
    if (e.lineOffset < text.length) {
    
        msg += "\n\n" +
            text.slice(e.lineOffset, e.startOffset) +
            Style.bold(Style.red(text.slice(e.startOffset, e.endOffset))) + 
            text.slice(e.endOffset, text.indexOf("\n", e.endOffset)) + "\n";
    }
    
    return msg;
}

function addExtension() {

    var Module = module.constructor,
        resolveFilename = Module._resolveFilename;
    
    Module._resolveFilename = (filename, parent) => {
    
        if (isPackageURI(filename))
            filename = locatePackage(filename);
        
        return resolveFilename(filename, parent);
    };
    
    // Compile ES6 js files
    require.extensions[".js"] = (module, filename) => {
    
        var text, source;
        
        try {
        
            text = source = FS.readFileSync(filename, "utf8");
            
            if (ES6_GUESS.test(text))
                text = translate(text);
        
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

    var m = require(path);

    if (m && typeof m.main === "function") {
    
        var result = m.main();
        
        if (Promise.isPromise(result))
            result.then(null, x => setTimeout($=> { throw x }, 0));
    }
}

export function startREPL() {

    addExtension();

    var repl = REPL.start({ 
    
        prompt: "es6now> ",
        
        eval(input, context, filename, cb) {
        
            var text, result, script, displayErrors = false;
            
            try {
            
                text = translate(input, { wrap: false });
                script = VM.createScript(text, { filename, displayErrors });
            
            } catch (x) {
            
                if (x instanceof SyntaxError)
                    x = new SyntaxError(formatSyntaxError(x));
                
                return cb(x);
            }
            
            try {
            
                result = context === global ? 
                    script.runInThisContext({ displayErrors }) : 
                    script.runInContext(context, { displayErrors });
                
            } catch (x) {
            
                return cb(x);
            }
            
            return cb(null, result);
        }
    });
}
