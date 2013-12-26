module FS from "node:fs";
module Path from "node:path";

import { runModule, startREPL, formatSyntaxError } from "NodeRun.js";
import { AsyncFS, ConsoleCommand } from "package:zen-bits";
import { createBundle } from "package:js-bundle";
import { translate } from "Translator.js";
import { locatePackage } from "PackageLocator.js";


function getOutPath(inPath, outPath) {

    var stat;
    
    outPath = Path.resolve(process.cwd(), outPath);
    
    try { stat = FS.statSync(outPath); } catch (e) {}
    
    if (stat && stat.isDirectory())
        return Path.resolve(outPath, Path.basename(inPath));
    
    return outPath;
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
        
            try {
            
                text = translate(text, { 
            
                    global: params.global,
                    runtime: params.runtime
                });
            
            } catch (x) {
            
                if (x instanceof SyntaxError)
                    x = new SyntaxError(formatSyntaxError(x, text));
                
                throw x;
            }
        
            if (params.output) {
            
                var outPath = getOutPath(params.input, params.output);
                return AsyncFS.writeFile(outPath, text, "utf8");
            
            } else {
            
                process.stdout.write(text + "\n");
            }
            
        }).then(null, x => {
        
            setTimeout($=> { throw x }, 0);
        });
    }

}).run();

