// Builds the Runtime.js module from the modules in the runtime folder

var FS = require("fs"),
    Path = require("path");

var EXT = /\.[\S\s]+$/;

var runtimePath = Path.resolve(__dirname, "../runtime/"),
    outPath = Path.resolve(__dirname, "../src/Runtime.js"),
    files = [ "API.js", "ES6.js", "MapSet.js", "Promise.js" ];

function run() {

    var output = "export var Runtime = {};\n\n";
    
    files.forEach(function(file) {
    
        var source = FS.readFileSync(
            Path.join(runtimePath, file), 
            { encoding: "utf8" });
        
        output += "Runtime." + file.replace(EXT, "") + " = \n\n`" + source + "`;\n\n";
    });
    
    FS.writeFileSync(outPath, output);
}

run();
