import { spawn } from "node:child_process";
import * as FS from "node:fs";
import * as Path from "node:path";

function buildRuntimeModule() {

    var outPath = Path.resolve(__dirname, "../src/Runtime.js");

    var files = {

        API: "./esdown-runtime.js",
        Polyfill: "./esdown-polyfill.js",
    };

    var output = "export let Runtime = {};\n\n";

    Object.keys(files).forEach(function(key) {

        var source = FS.readFileSync(
            Path.resolve(__dirname, files[key]),
            { encoding: "utf8" });

        // Remove signature and strict directive
        source = source.replace(/^\/\*=esdown=\*\/('use strict'; )?/, "");

        output += "Runtime." + key + " = \n\n`" + source + "`;\n\n";
    });

    FS.writeFileSync(outPath, output);
}

function runDown(args) {

    return new Promise(resolve => {

        let ts = +new Date;
        args = "- " + args;
        process.stdout.write(`Running esdown...`);

        let opts = { stdio: "inherit", env: process.env, cwd: __dirname },
            child = spawn("esdown", args.split(/ /g), opts);

        child.on("close", _=> {

            resolve();
            process.stdout.write(`finished in ${ ((+new Date) - ts) / 1000 }s.\n`);

        });
    });
}

export async function main() {

    let args = process.argv.slice(2);

    if (args.length === 0)
        args.push("esdown");

    switch (args[0]) {

        case "runtime":
            await runDown("../esdown-runtime/runtime.js ../esdown-runtime/esdown-runtime.js");
            await runDown("../esdown-runtime/runtime.js ./esdown-runtime.js");
            buildRuntimeModule();
            break;

        case "polyfill":
            await runDown("../esdown-polyfill/default.js ../esdown-polyfill/esdown-polyfill.js -b -g .");
            await runDown("../esdown-polyfill/default.js ./esdown-polyfill.js -b");
            buildRuntimeModule();
            break;

        case "minimal":
            await runDown("../src/minimal.js ../build/esdown-minimal.js -b -R -g esdown");
            break;

        case "esdown":
            await runDown("../src/default.js ../build/esdown.js -b -R");
            break;

        default:
            console.log(`Unknown command '${ args[0] }'`);
            return;
    }
}
