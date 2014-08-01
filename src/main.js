import { ConsoleCommand } from "zen-cmd";
import { readFile, writeFile } from "./AsyncFS.js";
import { runModule, startREPL, formatSyntaxError } from "./NodeRun.js";
import { createBundle } from "./Bundler.js";
import { translate } from "./Translator.js";
import { locatePackage } from "./PackageLocator.js";

var FS = require("fs");
var Path = require("path");

export { translate };

function getOutPath(inPath, outPath) {

    var stat;

    outPath = Path.resolve(process.cwd(), outPath);

    try { stat = FS.statSync(outPath); } catch (e) {}

    if (stat && stat.isDirectory())
        return Path.resolve(outPath, Path.basename(inPath));

    return outPath;
}

export function main() {

    new ConsoleCommand({

        execute(input) {

            process.argv.splice(1, 1);

            if (input) runModule(input);
            else startREPL();
        }

    }).add("-", {

        params: {

            "input": {

                short: "i",
                positional: true,
                required: true
            },

            "output": {

                short: "o",
                positional: true,
                required: false
            },

            "global": { short: "g" },

            "bundle": { short: "b", flag: true },

            "runtime": { short: "r", flag: true }
        },

        execute(params) {

            var promise =
                params.bundle ? createBundle(params.input, locatePackage) :
                params.input ? readFile(params.input, { encoding: "utf8" }) :
                Promise.resolve("");

            promise.then(text => {

                text = translate(text, {

                    global: params.global,
                    runtime: params.runtime,
                    wrap: true,
                    module: true
                });

                if (params.output) {

                    var outPath = getOutPath(params.input, params.output);
                    return writeFile(outPath, text, "utf8");

                } else {

                    process.stdout.write(text + "\n");
                }

            }).then(null, x => {

                if (x instanceof SyntaxError) {

                    var filename;

                    if (!params.bundle)
                        filename = Path.resolve(params.input);

                    process.stdout.write(`\nSyntax Error: ${formatSyntaxError(x, filename)}\n`);
                    return;
                }

                setTimeout($=> { throw x }, 0);
            });
        }

    }).run();
}
