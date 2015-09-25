import * as FS from "node:fs";
import * as REPL from "node:repl";
import * as VM from "node:vm";
import * as Path from "node:path";
import * as Util from "node:util";

import { ConsoleStyle as Style } from "zen-cmd";
import { parse } from "esparse";
import { translate } from "./Translator.js";
import { isPackageSpecifier, locateModule } from "./Locator.js";

let Module = require.main.constructor;

export function formatSyntaxError(e, filename) {

    let msg = e.message,
        text = e.sourceText;

    if (filename === void 0 && e.filename !== void 0)
        filename = e.filename;

    if (filename)
        msg += `\n    ${filename}:${e.line}`;

    if (e.lineOffset < text.length) {

        let code = "\n\n" +
            text.slice(e.lineOffset, e.startOffset) +
            Style.bold(Style.red(text.slice(e.startOffset, e.endOffset))) +
            text.slice(e.endOffset, text.indexOf("\n", e.endOffset)) +
            "\n";

        msg += code.replace(/\n/g, "\n    ");
    }

    return msg;
}

function addExtension() {

    let moduleLoad = Module._load;

    // Create _esdown global variable so that it doesn't need to be bundled into
    // each module
    global._esdown = _esdown;

    Module.prototype.importSync = function(path) {

        if (/^node:/.test(path))
            path = path.slice(5);
        else
            path += "##ES6";

        let e = this.require(path);
        if (e && e.constructor !== Object) e.default = e;
        return e;
    };

    Module._load = (request, parent, isMain) => {

        if (request.endsWith("##ES6")) {

            let loc = locateModule(request.slice(0, -5), Path.dirname(parent.filename));
            request = loc.path;

            parent.__es6 = !loc.legacy;
        }

        let m = moduleLoad(request, parent, isMain);
        parent.__es6 = false;
        return m;
    };

    // Compile ES6 js files
    require.extensions[".js"] = (module, filename) => {

        let text, source;

        try {

            text = source = FS.readFileSync(filename, "utf8");

            let m = Boolean(module.parent.__es6);

            text = translate(text, {
                wrap: m,
                module: m,
                functionContext: !m,
                runtimeImports: true,
            });

        } catch (e) {

            if (e instanceof SyntaxError)
                e = new SyntaxError(formatSyntaxError(e, filename));

            throw e;
        }

        return module._compile(text, filename);
    };
}

export function runModule(path) {

    addExtension();

    if (isPackageSpecifier(path))
        path = "./" + path;

    let loc = locateModule(path, process.cwd());

    if (!loc.legacy)
        loc.path += "##ES6";

    let m = require(loc.path);

    if (m && m.constructor !== Object)
        m = Object.create(m, { "default": { value: m } });

    if (m && typeof m.main === "function") {

        let result = m.main();
        Promise.resolve(result).then(null, x => setTimeout($=> { throw x }, 0));
    }
}

export function startREPL() {

    // Node 0.10.x pessimistically wraps all input in parens and then
    // re-evaluates function expressions as function declarations.  Since
    // Node is unaware of class declarations, this causes classes to
    // always be interpreted as expressions in the REPL.
    let removeParens = process.version.startsWith("v0.10.");

    addExtension();

    console.log(`esdown ${ _esdown.version } (Node ${ process.version })`);

    let prompt = ">>> ", contPrompt = "... ";

    let repl = REPL.start({

        prompt,

        useGlobal: true,

        eval(input, context, filename, cb) {

            let text, result, script, displayErrors = false;

            // Remove wrapping parens for function and class declaration forms
            if (removeParens && /^\((class|function\*?)\s[\s\S]*?\n\)$/.test(input))
                input = input.slice(1, -1);

            try {

                text = translate(input, { module: false });

            } catch (x) {

                // Regenerate syntax error to eliminate parser stack
                if (x instanceof SyntaxError) {

                    // Detect multiline input
                    if (/^(Unexpected end of input|Unexpected token)/.test(x.message)) {

                        this.bufferedCommand = input + "\n";
                        this.displayPrompt();
                        return;
                    }

                    x = new SyntaxError(x.message);
                }

                return cb(x);
            }

            try {

                script = VM.createScript(text, { filename, displayErrors });

                result = repl.useGlobal ?
                    script.runInThisContext({ displayErrors }) :
                    script.runInContext(context, { displayErrors });

            } catch (x) {

                return cb(x);
            }

            if (result instanceof Promise) {

                // Without displayPrompt, asynchronously calling the "eval"
                // callback results in no text being displayed on the screen.

                let token = {};

                Promise.race([

                    result,
                    new Promise(a => setTimeout($=> a(token), 3000)),
                ])
                .then(x => {

                    if (x === token)
                        return void cb(null, result);

                    this.outputStream.write(Style.gray("(async) "));
                    cb(null, x);
                })
                .catch(err => cb(err, null))
                .then($=> this.displayPrompt());

            } else {

                cb(null, result);
            }
        }
    });

    // Override displayPrompt so that ellipses are displayed for
    // cross-line continuations

    if (typeof repl.displayPrompt === "function" &&
        typeof repl._prompt === "string") {

        let displayPrompt = repl.displayPrompt;

        repl.displayPrompt = function(preserveCursor) {

            this._prompt = this.bufferedCommand ? contPrompt : prompt;
            return displayPrompt.call(this, preserveCursor);
        };
    }

    function parseAction(input, module) {

        let text, ast;

        try {

            ast = parse(input, { module }).ast;
            text = Util.inspect(ast, { colors: true, depth: 20 });

        } catch (x) {

            text = x instanceof SyntaxError ?
                formatSyntaxError(x, "REPL") :
                x.toString();
        }

        console.log(text);
    }

    function translateAction(input, module) {

        let text;

        try {

            text = translate(input, { wrap: false, module: true });

        } catch (x) {

            text = x instanceof SyntaxError ?
                formatSyntaxError(x, "REPL") :
                x.toString();
        }

        console.log(text);
    }

    let commands = {

        "help": {

            help: "Show REPL commands",

            action() {

                let list = Object.keys(this.commands).sort(),
                    len = list.reduce((n, key) => Math.max(n, key.length), 0);

                list.forEach(key => {

                    let help = this.commands[key].help || "",
                        pad = " ".repeat(4 + len - key.length);

                    this.outputStream.write(key + pad + help + "\n");
                });

                this.displayPrompt();
            }

        },

        "translate": {

            help: "Translate an ES6 script to ES5 and show the result (esdown)",

            action(input) {

                translateAction(input, false);
                this.displayPrompt();
            }
        },

        "translateModule": {

            help: "Translate an ES6 module to ES5 and show the result (esdown)",

            action(input) {

                translateAction(input, true);
                this.displayPrompt();
            }
        },

        "parse": {

            help: "Parse a script and show the AST (esdown)",

            action(input) {

                parseAction(input, false);
                this.displayPrompt();
            }

        },

        "parseModule": {

            help: "Parse a module and show the AST (esdown)",

            action(input) {

                parseAction(input, true);
                this.displayPrompt();
            }

        },
    };

    if (typeof repl.defineCommand === "function")
        Object.keys(commands).forEach(key => repl.defineCommand(key, commands[key]));
}
