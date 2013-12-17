var FS = require("fs"),
    Path = require("path");

var EXT = /\.[\S\s]+$/;

var runtimePath = Path.resolve(__dirname, "../runtime/"),
    outPath = Path.resolve(__dirname, "../src/Runtime.js"),
    files = [ "ES5.js", "ES6.js", "Class.js", "Promise.js" ];

function run() {

    var output = "";
    
    files.forEach(function(file) {
    
        var source = FS.readFileSync(
            Path.join(runtimePath, file), 
            { encoding: "utf8" });
        
        output += "export var " + file.replace(EXT, "") + " = \n\n`" + source + "`;\n\n";
    });
    
    FS.writeFileSync(outPath, output);
}

run();