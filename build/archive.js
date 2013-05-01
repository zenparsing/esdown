var FS = require("fs"),
    Path = require("path");

copy();

function copy() {

    var source = Path.resolve(__dirname, "es6now.js"),
        target = targetName();
    
    console.log("Archiving to [" + target + "]...");
    FS.writeFileSync(targetName(), FS.readFileSync(source, { encoding: "utf8" }));
    console.log("Done.");
}

function targetName() {

    var files = FS.readdirSync(Path.resolve(__dirname, "../_prev")),
        now = new Date,
        name = "es6now-",
        num = 0;
    
    name += [now.getFullYear(), pad2(now.getMonth() + 1), pad2(now.getDate())].join("");
    
    if (files.indexOf(name + ".js") !== -1) {
    
        num = 1;
        
        while (files.indexOf(name + "-" + num + ".js") !== -1)
            num++;
    }
    
    if (num > 0)
        name += "-" + num;
    
    name += ".js";
    
    return Path.resolve(__dirname, "../_prev/", name);
}

function pad2(n) {

    n = String(n);
    
    while (n.length < 2)
        n = "0" + n;
    
    return n;
}