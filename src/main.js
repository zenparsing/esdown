module FS from "node:fs";
module Path from "node:path";
module Runtime from "Runtime.js";

import { runModule, startREPL } from "NodeAdapter.js";
import { AsyncFS, ConsoleCommand } from "package:zen-bits";
import { createBundle } from "package:js-bundle";
import { translate } from "Translator.js";
import { locatePackage } from "PackageLocator.js";


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
    
        process.argv.splice(1, 1);
        
        if (params.input) runModule(params.input);
        else startREPL();
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

