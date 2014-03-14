var FS = require("fs"),
    Path = require("path");

restore();

function restore() {

    var target = Path.resolve(__dirname, "../build/es6now.js"),
        source = sourceName();
    
    console.log("Restoring from [" + source + "]...");
    FS.writeFileSync(target, FS.readFileSync(source, { encoding: "utf8" }));
    console.log("Done.");
}

function sourceName() {

    var files = FS.readdirSync(Path.resolve(__dirname, "../_prev"));
    
    files = files.filter(function(name) { return name.indexOf("es6now-") === 0; });
    files = files.sort();
    
    if (files.length === 0)
        throw new Error("No archived files were found.");
    
    return Path.resolve(__dirname, "../_prev/", files[files.length - 1]);
}
