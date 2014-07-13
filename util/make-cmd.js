/*

Creates the "es6now" command target dynamically when the package is installed.  This 
(hack) was necessary for the following reasons:

1. For now, we always want es6now to run node with the "--harmony" flag.
2. We don't want to have to spin up an extra node process just to launch es6now.

On linux we can't specify command arguments on the shebang line, so we need to launch node
with a shell script.  The $0 variable isn't reliable through symlinks, so we inject the
script path directly into the shell script.

For windows, NPM will create a "cmd" file which proxies to the "bin" file.  In that case,
arguments on the shebang line work fine so we just copy the "es6now-cli.js" file and let
NPM point to that.

*/

var Path = require("path");
var FS = require("fs");

function makeCmd() {

    var platform = process.platform,
        dir = Path.resolve(__dirname, "..", "bin"),
        target = Path.join(dir, "es6now"),
        source = "es6now.sh";
    
    if (platform === "win32") {
    
        copy(Path.join(dir, "es6now-cli.js"));
        
    } else {
    
        copy(Path.join(dir, "es6now.sh"), function(text) {
     
            return text.replace(/\$ES6NOW_BIN_DIR/g, Path.dirname(target));
        });
    }
    
    function copy(from, transform) {

        var text = FS.readFileSync(from, { encoding: "utf-8" });
    
        if (transform)
            text = transform(text);
    
        FS.writeFileSync(target,  text, { encoding: "utf-8" });
        FS.chmodSync(target, "755");
    }
}

makeCmd();
