module FS from "node:fs";
module Path from "node:path";
module Runtime from "Runtime.js";

import {
    
    AsyncFS,
    ConsoleCommand,
    ConsoleIO,
    ConsoleStyle as Style
    
} from "package:zen-bits";

import { createBundle } from "package:js-bundle";
import { translate } from "Translator.js";
import { Server } from "Server.js";
import { isPackageURI, locatePackage } from "PackageLocator.js";

var ES6_GUESS = /(?:^|\n)\s*(?:import|export|class)\s/;

function absPath(path) {

    return Path.resolve(process.cwd(), path);
}

function getOutPath(inPath, outPath) {

    var stat;
    
    outPath = absPath(outPath);
    
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

function wrapRuntimeModule(text) {

    return "(function() {\n\n" + text + "\n\n}).call(this);\n\n";
}

export function run() {

    new ConsoleCommand({

        params: {
        
            "target": {
            
                positional: true,
                required: true
            }
        },
        
        execute(params) {
        
            params.debug = true;
            overrideCompilation();
            process.argv.splice(1, 1);
            
            var m = require(absPath(params.target));
            
            if (typeof m.main === "function")
                m.main(process.argv);
        }
        
    }).add("translate", {
    
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
                
            });
        }
    
    }).add("serve", {
    
        params: {
        
            "root": { short: "r", positional: true },
            "port": { short: "p", positional: true }
        },
        
        execute(params) {
        
            var server = new Server(params);
            server.start();
            
            console.log("Listening on port " + server.port + ".  Press Enter to exit.");
            
            var stdin = process.stdin;
            
            stdin.resume();
            stdin.setEncoding('utf8');
            
            stdin.on("data", () => { 
            
                server.stop().then(val => { process.exit(0); });
            });
        }
        
    }).run();
    
}