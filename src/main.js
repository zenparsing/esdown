module FS from "node:fs";
module Path from "node:path";
module REPL from "node:repl";
module VM from "node:vm";

module Runtime from "Runtime.js";

import {
    
    AsyncFS,
    ConsoleCommand,
    ConsoleIO,
    ConsoleStyle as Style
    
} from "package:zen-bits";

import { createBundle } from "package:js-bundle";
import { translate } from "Translator.js";
import { isPackageURI, locatePackage } from "PackageLocator.js";

var ES6_GUESS = /(?:^|\n)\s*(?:import|export|class)\s/;

function absolutePath(path) {

    return Path.resolve(process.cwd(), path);
}

function getOutPath(inPath, outPath) {

    var stat;
    
    outPath = absolutePath(outPath);
    
    try { stat = FS.statSync(outPath); } catch (e) {}
    
    if (stat && stat.isDirectory())
        return Path.resolve(outPath, Path.basename(inPath));
    
    return outPath;
}

function overrideCompilation() {

    var Module = module.constructor,
        resolveFilename = Module._resolveFilename;
    
    Module._resolveFilename = function(filename, parent) {
    
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
        
            if (e instanceof SyntaxError) {
            
                var desc = e.message + "\n" +
                    "    at " + filename + ":" + e.line + "\n\n" + 
                    source.slice(e.lineOffset, e.startOffset) +
                    Style.bold(Style.red(source.slice(e.startOffset, e.endOffset))) + 
                    source.slice(e.endOffset, source.indexOf("\n", e.endOffset)) +
                    "\n";
                
                e = new SyntaxError(desc);
            }
            
            throw e;
        }
        
        return module._compile(text, filename);
    };
}

function startREPL() {

    var r = REPL.start({ 
    
        prompt: "es6> ",
        
        eval(input, context, filename, cb) {
        
            try {
            
                input = translate(input, { wrap: false });
                
                var result = context === global ? 
                    VM.runInThisContext(input, filename) : 
                    VM.runInContext(input, context, filename);
                
                cb(null, result);
            
            } catch (x) {
            
                cb(x);
            }
        }
    });
    
    r.on("exit", $=> REPL.outputStream.write("\n"));
    
    return r;
}

function wrapRuntimeModule(text) {

    return "(function() {\n\n" + text + "\n\n}).call(this);\n\n";
}

new ConsoleCommand({

    params: {
    
        "input": {
        
            positional: true,
            required: false
        }
    },
    
    execute(params) {
    
        overrideCompilation();
        process.argv.splice(1, 1);
        
        if (params.path) {
        
            var path = absolutePath(params.path),
                stat;
        
            try { stat = FS.statSync(path) }
            catch (x) {}
        
            if (stat && stat.isDirectory())
                path = Path.join(path, "main.js");
        
            var m = require(path);
        
            if (m && typeof m.main === "function")
                Promise.cast(m.main()).catch(x => setTimeout($=> { throw x }, 0));
        
        } else {
        
            startREPL();
        }
    }
    
}).add("-", {

    params: {
            
        "input": {

            short: "i",
            positional: true,
            required: true
        },
        
        "output": {
            
            short: "o",
            positional: true,
            required: false
        },
        
        "global": { short: "g" },
        
        "bundle": { short: "b", flag: true },
        
        "runtime": { short: "r", flag: true }
    },
    
    execute(params) {
        
        var promise = params.bundle ?
            createBundle(params.input, locatePackage) :
            AsyncFS.readFile(params.input, { encoding: "utf8" });
        
        promise.then(text => {
        
            if (params.runtime) {
            
                text = "\n\n" +
                    wrapRuntimeModule(Runtime.Class) + 
                    wrapRuntimeModule(Runtime.ES5) +
                    wrapRuntimeModule(Runtime.ES6) +
                    wrapRuntimeModule(Runtime.Promise) +
                    text;
            }
            
            return translate(text, { global: params.global });
        
        }).then(text => {
            
            if (params.output) {
            
                var outPath = getOutPath(params.input, params.output);
                FS.writeFileSync(outPath, text, "utf8");
            
            } else {
            
                console.log(text);
            }
            
        }).catch(x => {
        
            setTimeout($=> { throw x }, 0);
        });
    }

}).run();

