"use strict";

var FS = require("fs"),
    Path = require("path");

var Now = require("../src/main.js");

function statPath(path) {

    try { return FS.statSync(path); } catch (ex) {}
    return false;
}

function getFilePaths(dir) {

    return FS
        .readdirSync(dir)
        .filter(function(name) { return name[0] !== "."; })
        .map(function(name) { return Path.resolve(dir, name); })
        .map(function(path) { return { path: path, stat: statPath(path) }; })
        .filter(function(item) { return item.stat.isFile(); })
        .map(function(item) { return item.path; });
}

function testTranslator() {

    var inputFiles = [],
        outputFiles = [],
        stop = {};
    
    getFilePaths(__dirname + "/translate").forEach(function(path) {
    
        if (path.slice(-3) === ".js") {
        
            if (path.slice(-7) === ".out.js") outputFiles.push(path);
            else inputFiles.push(path);
        }
    });
    
    try {
    
        inputFiles.forEach(function(path) {
        
            var input = FS.readFileSync(path, "utf8"),
                output = Now.translate(input, { wrap: false }),
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
    
        if (!stop)
            throw x;
    }
}

testTranslator();