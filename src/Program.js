module FS from "node:fs";
module Path from "node:path";
module AsyncFS from "AsyncFS.js";
module Runtime from "Runtime.js";

import { ModuleInstaller } from "ModuleInstaller.js";
import { bundle } from "Bundler.js";
import { translate } from "Translator.js";
import { Server } from "Server.js";
import { Proxy } from "Proxy.js";
import { ConsoleCommand } from "ConsoleCommand.js";
import { ConsoleIO, Style } from "ConsoleIO.js";

var ES6_GUESS = /(?:^|\n)\s*(?:import|export|class)\s/,
    WEB_URL = /^https?:\/\//i;

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
        resolveFilename = Module._resolveFilename,
        installer = new ModuleInstaller;
    
    Module._resolveFilename = function(filename, parent) {
    
        if (WEB_URL.test(filename))
            filename = installer.localPath(filename);
        
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
            require(absPath(params.target));
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
                bundle(params.input) :
                AsyncFS.readFile(params.input, { encoding: "utf8" });
            
            promise.then(text => {
            
                if (params.runtime) {
                
                    text = "\n\n" +
                        wrapRuntimeModule(Runtime.Class) + 
                        wrapRuntimeModule(Runtime.ES5) +
                        wrapRuntimeModule(Runtime.ES6) +
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
    
    }).add("install", {
    
        params: {
        
            "input": { short: "i", positional: true }
        },
        
        execute(params) {
        
            var installer = new ModuleInstaller(),
                io = new ConsoleIO;

            installer.on("fetch-begin", evt => {

                io.writeLine('Fetching "' + evt.url + '"');
            
            }).on("fetch-complete", evt => {

                io.writeLine('Received "' + evt.url + '"');
            
            }).on("create-path", evt => {

                io.writeLine('Creating path "' + evt.path + '"');
            
            }).on("overwrite", evt => {

                io.write('Overwrite "' + evt.url + '"? [n]: ');
                
                evt.overwrite = io.readLine().then(val => {
                
                    val = val.trim().toLowerCase() || "n";
                    return val === "y" || val === "yes";
                });
                
            }).on("move-begin", evt => {
            
                io.writeLine('Installing "' + evt.url + '"');
            });

            installer.install(params.input);
        }
        
    }).add("proxy", {
    
        params: {
        
            "port": { short: "p", positional: true }
        },
        
        execute(params) {
        
            var proxy = new Proxy(params),
                io = new ConsoleIO,
                stopped = false;
                
            proxy.start();
            
            io.write("Listening on port " + proxy.port + ".  Press Enter to exit.");
            
            io.readLine().then(data => {
            
                if (stopped)
                    return;
                
                stopped = true;
                
                io.write("Waiting for connections to close...");
                
                proxy.stop().then(val => {
                
                    io.writeLine("OK");
                });
                
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