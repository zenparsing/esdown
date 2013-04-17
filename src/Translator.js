import Replacer from "Replacer.js";

var SIGNATURE = "/*=es6now=*/";

var WRAP_CALLEE = "(function(fn, deps) { " +

    // Node.js, Rewrapped:
    "if (typeof exports !== 'undefined') " +
        "fn.call(typeof global === 'object' ? global : this, require, exports); " +
        
    // Sane module transport:
    "else if (typeof __MODULE === 'function') " +
        "__MODULE(fn, deps); " +
        
    // Insane module transport:
    "else if (typeof define === 'function' && define.amd) " +
        "define(['require', 'exports'].concat(deps), fn); " +
        
    // DOM global module:
    "else if (typeof window !== 'undefined' && {0}) " +
        "fn.call(window, null, window[{0}] = {}); " +
    
    // Hail Mary:
    "else " +
        "fn.call(window || this, null, {}); " +

"})";

function sanitize(text) {

    // From node/lib/module.js/Module.prototype._compile
    text = text.replace(/^\#\!.*/, '');
    
    // From node/lib/module.js/stripBOM
    if (text.charCodeAt(0) === 0xFEFF)
        text = text.slice(1);
    
    return text;
}

export function translate(input, options) {

    options || (options = {});
    
    var replacer = new Replacer(),
        output;
    
    if (options.requireCall)
        replacer.requireCall = options.requireCall;
    
    input = sanitize(input);
    output = replacer.replace(input);
    
    if (options.wrap !== false)
        output = wrap(output, replacer.dependencies, options.global);
    
    return output;
}

export function wrap(text, dep, global) {

    var callee = WRAP_CALLEE.replace(/\{0\}/g, JSON.stringify(global || ""));
    
    return SIGNATURE + callee + "(function(require, exports) { \"use strict\"; " + text + "\n\n}, " + JSON.stringify(dep) + ");";
}

export function isWrapped(text) {

    return text.indexOf(SIGNATURE) === 0;
}

