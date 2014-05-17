module AsyncFS from "AsyncFS.js";

import { runModule, startREPL, formatSyntaxError } from "NodeRun.js";
import { ConsoleCommand } from "package:zencmd";
import { createBundle } from "package:js-bundle";
import { translate } from "Translator.js";
import { locatePackage } from "PackageLocator.js";

var FS = require("fs");
var Path = require("path");

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
        
        var promise = 
            params.bundle ? createBundle(params.input, locatePackage) :
            params.input ? AsyncFS.readFile(params.input, { encoding: "utf8" }) :
            Promise.resolve("");
        
        promise.then(text => {
        
            text = translate(text, { 
        
                global: params.global,
                runtime: params.runtime,
                wrap: true
            });
        
            if (params.output) {
            
                var outPath = getOutPath(params.input, params.output);
                return AsyncFS.writeFile(outPath, text, "utf8");
            
            } else {
            
                process.stdout.write(text + "\n");
            }
            
        }).then(null, x => {
            
            if (x instanceof SyntaxError) {
            
                var filename;
                
                if (!params.bundle) 
                    filename = Path.resolve(params.input);
                
                process.stdout.write(`\nSyntax Error: ${formatSyntaxError(x, filename)}\n`);
                return;
            }
            
            setTimeout($=> { throw x }, 0);
        });
    }

}).run();

