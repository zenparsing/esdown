/*

Restores esdown.js from the most recent copy in "_prev" created with "archive.js".

*/

var FS = require("fs"),
    Path = require("path");

restore();

function restore() {
    var target = Path.resolve(__dirname, "../build/esdown.js"),
        source = sourceName();

    console.log("Restoring from [" + source + "]...");
    FS.writeFileSync(target, FS.readFileSync(source, { encoding: "utf8" }));
    console.log("Done.");
}

function sourceName() {
    var dir = Path.resolve(__dirname, "../_archive");

    // Create the archive directory if it doesn't already exist
    if (!FS.existsSync(dir))
        FS.mkdirSync(dir);

    var files = FS.readdirSync(dir);

    files = files.filter(function(name) { return name.indexOf("esdown-") === 0; });
    files = files.sort();

    if (files.length === 0)
        throw new Error("No archived files were found.");

    return Path.resolve(dir, files[files.length - 1]);
}
