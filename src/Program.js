import "fs" as FS;
import "path" as Path;
import "CommandLine.js" as CommandLine;
import "FutureFS.js" as FFS;

import Promise from "Promise.js";
import bundle from "Bundler.js";
import Server from "Server.js";
import translate from "Translator.js";

function absPath(path) {

    return Path.resolve(process.cwd(), path);
}

function writeFile(path, text) {

    console.log("[Writing] " + absPath(path));
    FS.writeFileSync(path, text, "utf8");
}

function overrideCompilation() {

    // Compile ES6 js files
    require.extensions[".js"] = (module, filename) => {
    
        var text;
        
        try {
        
            text = translate(FS.readFileSync(filename, "utf8"));
        
        } catch (e) {
        
            if (e instanceof SyntaxError)
                e = new SyntaxError(e.message);
            
            throw e;
        }
        
        return module._compile(text, filename);
    };
}

export function run() {

    CommandLine.run({
    
        "*": {
        
            params: {
            
                "target": {
                
                    positional: true,
                    required: true
                }
            },
            
            execute(params) {
            
                params.debug = true;
                overrideCompilation();
                require(absPath(params.target));
            }
        
        },
        
        translate: {
        
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
                
                "debug": { flag: true }
            },
            
            execute(params) {
            
                var options = { 
                
                    global: params.global,
                    
                    log(filename) { 
                    
                        console.log("[Reading] " + absPath(filename));
                    }
                };
                
                options.log(params.input);
                
                FFS
                .readFile(params.input, "utf8")
                .then(text => translate(text, options))
                .then(text => {
                
                    if (params.output) writeFile(params.output, text);
                    else console.log(text);
                    
                }, err => {
                
                    throw err;
                });           
            }
        },
        
        bundle: {
        
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
                
                "debug": { flag: true }
            },
            
            execute(params) {
            
                var options = { 
                
                    global: params.global,
                    
                    log(filename) { 
                    
                        console.log("[Reading] " + absPath(filename));
                    }
                };
                
                bundle(params.input, options).then(text => {
                
                    if (params.output) writeFile(params.output, text);
                    else console.log(text);
                    
                }, err => {
                
                    throw err;
                });           
            }
        },
        
        serve: {
        
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
        },
        
        error(err, params) {
        
            if (params.debug) {
            
                throw err;
            
            } else {
            
                console.log("Oops! ", err.toString());
            }
            
            process.exit(1);
        }
    });
}