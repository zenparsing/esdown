module Runtime from "Runtime.js";

import { Replacer } from "Replacer.js";

var SIGNATURE = "/*=es6now=*/";
var WRAP_CALLEE = "(function(fn, deps, name) { " +

    // Node.js:
    "if (typeof exports !== 'undefined') " +
        "fn.call(typeof global === 'object' ? global : this, require, exports, module); " +
        
    // Insane module transport:
    "else if (typeof define === 'function' && define.amd) " +
        "define(['require', 'exports', 'module'].concat(deps), fn); " +
        
    // DOM global module:
    "else if (typeof window !== 'undefined' && name) " +
        "fn.call(window, null, window[name] = {}, {}); " +
    
    // Hail Mary:
    "else " +
        "fn.call(window || this, null, {}, {}); " +

"})";

var WRAP_HEADER = "function(require, exports, module) { " +
    "'use strict'; " +
    "function __load(p) { " +
        "module.__es6 = 1; var e = require(p); module.__es6 = 0; " +
        "return typeof e === 'object' ? e : { 'default': e }; " +
    "} ";

var WRAP_FOOTER = "\n\n}";

function sanitize(text) {

    // From node/lib/module.js/Module.prototype._compile
    text = text.replace(/^\#\!.*/, '');
    
    // From node/lib/module.js/stripBOM
    if (text.charCodeAt(0) === 0xFEFF)
        text = text.slice(1);
    
    return text;
}

function wrapRuntimeModule(text) {

    return "(function() {\n\n" + text + "\n\n}).call(this);\n\n";
}

export function translate(input, options = {}) {

    var replacer = new Replacer,
        output;
    
    input = sanitize(input);
    
    if (options.runtime) {
            
        input = "\n\n" +
            wrapRuntimeModule(Runtime.API) + 
            wrapRuntimeModule(Runtime.ES6) +
            wrapRuntimeModule(Runtime.Promise) +
            input;
    }
            
    output = replacer.replace(input, options);
    
    if (options.wrap) {
    
        // Doesn't make sense to create a module wrapper for a non-module
        if (!options.module)
            throw new Error("Cannot wrap a non-module");
        
        output = wrap(output, replacer.dependencies, options.global);
    }
    
    return output;
}

export function wrap(text, dep, global) {

    return SIGNATURE + WRAP_CALLEE + "(" + 
        WRAP_HEADER + text + WRAP_FOOTER + ", " + 
        JSON.stringify(dep || []) + ", " + 
        JSON.stringify(global || "") +
    ");";
}

export function isWrapped(text) {

    return text.indexOf(SIGNATURE) === 0;
}

