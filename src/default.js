import * as FS from "node:fs";
import * as Path from "node:path";
import { ConsoleCommand } from "zen-cmd";
import { readFile, writeFile } from "./AsyncFS.js";
import { runModule, startREPL, formatSyntaxError } from "./NodeRun.js";
import { bundle } from "./Bundler.js";
import { translate } from "./Translator.js";

export { translate, bundle };
export { parse } from "esparse";

function getOutPath(inPath, outPath) {

    let stat;

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

            let promise = null;

            if (params.bundle) {

                promise = bundle(params.input, {

                    global: params.global,
                    runtime: params.runtime
                });

            } else {

                promise = params.input ?
                    readFile(params.input, { encoding: "utf8" }) :
                    Promise.resolve("");

                promise = promise.then(text => {

                    return translate(text, {

                        global: params.global,
                        runtime: params.runtime,
                        wrap: true,
                        module: true
                    });
                });
            }

            promise.then(text => {

                if (params.output) {

                    let outPath = getOutPath(params.input, params.output);
                    return writeFile(outPath, text, "utf8");

                } else {

                    process.stdout.write(text + "\n");
                }

            }).then(null, x => {

                if (x instanceof SyntaxError) {

                    let filename;

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
