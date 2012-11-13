"use strict";

var FS = require("fs"),
    Path = require("path");
    
var Translator = require("./Translator.js");

var EXTERNAL = /^[a-z]+:|^[^\.]+$/i;

var OUTPUT_BEGIN = "var __modules = [], __exports = [], __global = this; \n\
\n\
function __require(i, obj) { \n\
    var e = __exports; \n\
    if (e[i] !== void 0) return e[i]; \n\
    __modules[i].call(__global, e[i] = (obj || {})); \n\
    return e[i]; \n\
} \n";

function hasKey(obj, key) {

    return Object.prototype.hasOwnProperty.call(obj, key);
}

function isExternal(path) {

    return EXTERNAL.test(path);
}

function resolve(path, base) {

    if (!isExternal(path) && base)
        path = Path.resolve(base, path);
    
    return path;
}

function readFile(filename, log) {

    if (log) log(filename);
    
    var text = FS.readFileSync(filename, "utf8");
    
    // From node/lib/module.js/Module.prototype._compile
    text = text.replace(/^\#\!.*/, '');
    
    // From node/lib/module.js/stripBOM
    if (text.charCodeAt(0) === 0xFEFF)
        text = text.slice(1);
    
    return text;
}

function combine(filename, options) {

    options || (options = {});
    
    var externals = {},
        modules = {},
        factories = [];
    
    visit(filename, null);
    
    var out = OUTPUT_BEGIN, i;

    for (i = 0; i < factories.length; ++i) {
    
        out += "\n__modules[" + i.toString() + "] = ";
        out += "function(exports) {\n" + factories[i] + "\n};\n";
    }
    
    out += "\n__require(0, exports);\n";
    
    return Translator.wrap("\n\n" + out, Object.keys(externals), options.global);
    
    function visit(path, base) {
    
        path = resolve(path, base);
        
        var dir = Path.dirname(path),
            index = factories.length,
            text;
        
        // Exit if already visited
        if (hasKey(modules, path))
            return modules[path];
        
        // Add module
        modules[path] = index;
        factories.push("");
        
        // Read file
        text = readFile(path, options.log);
        
        // Translate files recursively
        factories[index] = Translator.translate(text, { 
        
            wrap: false,
            
            requireCall: function(url) {
            
                if (isExternal(url)) {
            
                    externals[url] = 1;
                    return "require(" + JSON.stringify(url) + ")";
                }
                
                return "__require(" + visit(url, dir).toString() + ")";
            }
        });
        
        return index;
    }
}

exports.combine = combine;
exports.readFile = readFile;
