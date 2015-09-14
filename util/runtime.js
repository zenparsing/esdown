/*

Builds the "src/Runtime.js" module from the scripts in the "runtime" folder.  Must be
run before building esdown if there are changes to runtime components.

*/

var FS = require("fs"),
    Path = require("path");

var outPath = Path.resolve(__dirname, "../src/Runtime.js");

var files = {

    API: "../esdown-runtime/index.js",
    Polyfill: "../esdown-polyfill/index.js",
};

function run() {

    var output = "export let Runtime = {};\n\n";

    Object.keys(files).forEach(function(key) {

        var source = FS.readFileSync(
            Path.resolve(__dirname, files[key]),
            { encoding: "utf8" });

        // Remove signature and strict directive
        source = source.replace(/^\/\*=esdown=\*\/'use strict'; /, "");

        output += "Runtime." + key + " = \n\n`" + source + "`;\n\n";
    });

    FS.writeFileSync(outPath, output);
}

run();
