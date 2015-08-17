import { Runtime } from "./Runtime.js";
import { Replacer } from "./Replacer.js";

const SIGNATURE = "/*=esdown=*/";

const WRAP_CALLEE = "(function(fn, deps, name) { " +

    "function obj() { return {} } " +

    // CommonJS:
    "if (typeof exports !== 'undefined') " +
        "fn(require, exports, module); " +

    // AMD:
    "else if (typeof define === 'function' && define.amd) " +
        "define(['require', 'exports', 'module'].concat(deps), fn); " +

    // DOM global module:
    "else if (typeof window !== 'undefined' && name) " +
        "fn(obj, window[name] = {}, {}); " +

    // Hail Mary:
    "else " +
        "fn(obj, {}, {}); " +

"})";

const WRAP_HEADER = "function(require, exports, module) { " +
    "'use strict'; " +
    "function __load(p, l) { " +
        "module.__es6 = !l; " +
        "var e = require(p); " +
        "if (e && e.constructor !== Object) e.default = e; " +
        "return e; " +
    "} ";

const WRAP_FOOTER = "\n\n}";

function sanitize(text) {

    // From node/lib/module.js/Module.prototype._compile
    text = text.replace(/^\#\!.*/, '');

    // From node/lib/module.js/stripBOM
    if (text.charCodeAt(0) === 0xFEFF)
        text = text.slice(1);

    return text;
}

function wrapRuntimeModules() {

    return Object.keys(Runtime).map(key => {

        return "(function() {\n\n" + Runtime[key] + "\n\n}).call(this);\n\n";

    }).join("");
}

function wrapRuntimeAPI() {

    return "var _esdown; (function() {\n\n" + Runtime.API + "\n\n}).call(this);\n\n";
}

function wrapPolyfillModules() {

    return Object.keys(Runtime).map(key => {

        if (key === "API")
            return "_esdown.global._esdown = _esdown;\n\n";

        return "(function() {\n\n" + Runtime[key] + "\n\n}).call(this);\n\n";

    }).join("");
}

export function translate(input, options = {}) {

    input = sanitize(input);

    let prefix = "";

    if (options.runtime) {

        prefix = "\n" + wrapRuntimeAPI();

        if (options.polyfill)
            prefix += "\n" + wrapPolyfillModules();
    }

    input = prefix + input;

    // Node modules are wrapped inside of a function expression, which allows
    // return statements
    if (options.functionContext)
        input = "(function(){" + input + "})";

    let replacer = options.replacer || new Replacer,
        output = replacer.replace(input, { module: options.module });

    // Remove function expression wrapper for node-modules
    if (options.functionContext)
        output = output.slice(12, -2);

    if (options.wrap) {

        // Doesn't make sense to create a module wrapper for a non-module
        if (!options.module)
            throw new Error("Cannot wrap a non-module");

        output = wrapModule(
            output,
            replacer.dependencies.map(d => d.url),
            options.global);
    }

    return output;
}

export function wrapModule(text, dep, global) {

    return SIGNATURE + WRAP_CALLEE + "(" +
        WRAP_HEADER + text + WRAP_FOOTER + ", " +
        JSON.stringify(dep) + ", " +
        JSON.stringify(global || "") +
    ");";
}

export function isWrapped(text) {

    return text.indexOf(SIGNATURE) === 0;
}
