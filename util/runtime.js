/*

Builds the "src/Runtime.js" module from the scripts in the "runtime" folder.  Must be
run before building esdown if there are changes to runtime components.

*/

var FS = require("fs"),
    Path = require("path");

var outPath = Path.resolve(__dirname, "../src/Runtime.js");

var files = {

    "API": "../esdown-runtime/default.js",
    "Polyfill": "../polyfill/Polyfill.js",
    "MapSet": "../polyfill/MapSet.js",
    "Promise": "../polyfill/Promise.js",
};

function run() {

    var output = "export let Runtime = {};\n\n";

    Object.keys(files).forEach(function(key) {

        var source = FS.readFileSync(
            Path.resolve(__dirname, files[key]),
            { encoding: "utf8" });

        output += "Runtime." + key + " = \n\n`" + source + "`;\n\n";
    });

    FS.writeFileSync(outPath, output);
}

run();
