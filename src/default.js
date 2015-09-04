import * as FS from "node:fs";
import * as Path from "node:path";
import { ConsoleCommand } from "zen-cmd";
import { readFile, writeFile } from "./AsyncFS.js";
import { runModule, startREPL, formatSyntaxError } from "./NodeRun.js";
import { bundle } from "./Bundler.js";
import { translate } from "./Translator.js";

export { translate, bundle };
export { parse } from "esparse";

const HELP = `
Start a REPL by running it without any arguments:

    esdown

Execute a module by adding a path:

    esdown main.js

Translate a module by using a hyphen:

    esdown - [input] [output] [options]

    --input, -i  (1)    The file to translate.
    --output, -o (2)    The file to write to. If not set, then the output
                        will be written to the console.
    --bundle, -b        If present, module dependencies will be bundled
                        together in the output.
    --runtime, -r       If present, the esdown runtime code will be bundled
                        with the output.
    --polyfill, -p      If present, ES6 polyfills will be bundled with the
                        output.
    -R                  If present, the esdown runtime and ES6 polyfills will
                        be bundled with the output.  Equivalent to including
                        both the -p and -r options.
    --global, -g        If specified, the name of the global variable to
                        dump this module's exports into, if the resulting
                        script is not executed within any module system.
`;

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

    }).add("?", {

        execute() {

            console.log(HELP);
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

            "runtime": { short: "r", flag: true },

            "fullRuntime": { short: "R", flag: true },

            "polyfill": { short: "p", flag: true },

            "nowrap": { flag: true },
        },

        execute(params) {

            let promise = null;

            if (params.bundle) {

                promise = bundle(params.input, {

                    global: params.global,
                    runtime: params.fullRuntime || params.runtime,
                    polyfill: params.fullRuntime || params.polyfill,
                });

            } else {

                promise = params.input ?
                    readFile(params.input, { encoding: "utf8" }) :
                    Promise.resolve("");

                promise = promise.then(text => {

                    return translate(text, {

                        global: params.global,
                        runtime: params.fullRuntime || params.runtime,
                        polyfill: params.fullRuntime || params.polyfill,
                        wrap: !params.nowrap,
                        module: true,
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

                    process.stdout.write(`\nSyntax Error: ${ formatSyntaxError(x, filename) }\n`);
                    return;
                }

                setTimeout($=> { throw x }, 0);
            });
        }

    }).run();
}
