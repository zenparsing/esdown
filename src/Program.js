"use strict";

var FS = require("fs"),
    Path = require("path");

var CommandLine = require("./CommandLine.js"),
    Translator = require("./Translator.js"),
    Combiner = require("./Combiner.js"),
    Server = require("./Server.js"),
    Runtime = require("./Runtime.js");

function absPath(path) {

    return Path.resolve(process.cwd(), path);
}

function writeFile(path, text) {

    console.log("[Writing] " + absPath(path));
    FS.writeFileSync(path, text, "utf8");
}

function overrideCompilation() {

    // Compile ES6 js files
    require.extensions[".js"] = function(module, filename) {
    
        var text = Combiner.readFile(filename);
    
        if (/(\n|^)\s*(export|import)\s/.test(text))
            text = Translator.translate(text);
        
        return module._compile(text, filename);
    };
}

function run() {

    CommandLine.run({
    
        "*": {
        
            params: {
            
                "target": {
                
                    positional: true,
                    required: true
                }
            },
            
            execute: function(params) {
            
                params.debug = true;
                
                overrideCompilation();
                Runtime.initialize();
                
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
            
            execute: function(params) {
            
                var options = { 
                
                    global: params.global,
                    
                    log: function(filename) { 
                    
                        console.log("[Reading] " + absPath(filename));
                    }
                };
                
                var text = Combiner.readFile(params.input, options.log);
                text = Translator.translate(text, options);
                
                if (params.output) writeFile(params.output, text);
                else console.log(text);
            }
        },
        
        combine: {
        
            params: {
        
                "input": {
        
                    short: "i",
                    positional: true,
                    required: true
                },
                
                "output": {
                    
                    short: "o",
                    positional: true,
                    required: true
                },
                
                "global": { short: "g" },
                
                "debug": { flag: true }
            },
            
            execute: function(params) {
            
                var options = { 
                
                    global: params.global,
                    
                    log: function(filename) { 
                    
                        console.log("[Reading] " + absPath(filename));
                    }
                };
                
                var text = Combiner.combine(params.input, options);
                writeFile(params.output, text);
            }
        },
        
        serve: {
        
            params: {
            
                "root": { short: "r", positional: true },
                "port": { short: "p", positional: true }
            },
            
            execute: function(params) {
            
                var server = Server.listen(params);
                
                console.log("Listening on port " + server.port + ".  Press Enter to exit.");
                
                var stdin = process.stdin;
                
                stdin.resume();
                stdin.setEncoding('utf8');
                stdin.on("data", function() { process.exit(); });
            }
        },
        
        error: function(err, params) {
        
            if (params.debug) {
            
                throw err;
            
            } else {
            
                console.log("Oops! ", err.toString());
            }
            
            process.exit(1);
        }
    });
}

exports.run = run;