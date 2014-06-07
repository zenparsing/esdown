import { runTests } from "package:moon-unit";
import { translate } from "../src/Translator.js";

var FS = require("fs"),
    Path = require("path");

function statPath(path) {

    try { return FS.statSync(path); } catch (ex) {}
    return false;
}

function getFilePaths(dir) {

    return FS
        .readdirSync(dir)
        .filter(name => name[0] !== ".")
        .map(name => Path.resolve(dir, name))
        .map(path => ({ path: path, stat: statPath(path) }))
        .filter(item => item.stat.isFile())
        .map(item => item.path);
}

export function main(args) {

    var inputFiles = [],
        outputFiles = [],
        stop = {};
    
    getFilePaths(__dirname + "/translate").forEach(path => {
    
        if (path.slice(-3) === ".js") {
        
            if (path.slice(-7) === ".out.js") outputFiles.push(path);
            else inputFiles.push(path);
        }
    });
    
    return runTests({
    
        "Translation" (test) {
    
            try {
    
                inputFiles.forEach(path => {
        
                    var input = FS.readFileSync(path, "utf8"),
                        output = translate(input, { wrap: false, module: true }),
                        expected = FS.readFileSync(path.replace(/\.js$/, ".out.js"), "utf8"),
                        ok = output === expected;
            
                    test.name(Path.basename(path).replace(/-/g, " ").replace(/\.js$/, "")).assert(ok);
            
                    if (!ok) {
            
                        FS.writeFileSync(__dirname + "/_test-fail.js", output);
                
                        console.log("");
                        console.log(output);
                        console.log("");
                        throw stop;
                    }
                });
    
            } catch(x) {
    
                if (x !== stop)
                    throw x;
            }
        }
        
    });
    
}

