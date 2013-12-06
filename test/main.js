module FS from "node:fs";
module Path from "node:path";

import { translate } from "../src/Translator.js";
import { runTests } from "package:moon-unit";

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

export function main() {

    var inputFiles = [],
        outputFiles = [],
        stop = {};
    
    getFilePaths(__dirname + "/translate").forEach(path => {
    
        if (path.slice(-3) === ".js") {
        
            if (path.slice(-7) === ".out.js") outputFiles.push(path);
            else inputFiles.push(path);
        }
    });
    
    try {
    
        inputFiles.forEach(path => {
        
            var input = FS.readFileSync(path, "utf8"),
                output = translate(input, { wrap: false }),
                expected = FS.readFileSync(path.replace(/\.js$/, ".out.js"), "utf8"),
                ok = output === expected;
            
            console.log(Path.basename(path) + " " + (ok ? "[OK]" : "[FAIL]"));
            
            if (!ok) {
            
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

