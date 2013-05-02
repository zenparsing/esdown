import "node:path" as Path;
import "FutureFS.js" as FFS;

import Promise from "Promise.js";
import translate, wrap from "Translator.js";

var EXTERNAL = /^[a-z]+:|^[^\.]+$/i;

var OUTPUT_BEGIN = "var __modules = [], __exports = [], __global = this; \n\
\n\
function __init(i, obj) { \n\
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

export function bundle(filename, options) {

    options || (options = {});
    
    var externals = {},
        modules = {},
        nodes = [],
        current = 0;
    
    createNode(filename, null);
    
    return Promise.iterate(stop => {
    
        if (current >= nodes.length)
            return stop();
        
        var node = nodes[current],
            path = node.path,
            dir = Path.dirname(path);
        
        current += 1;
        
        if (options.log)
            options.log(path);
        
        // Read file
        return FFS.readFile(path, "utf8").then(text => {
        
            node.factory = translate(text, {
            
                wrap: false,
                
                loadCall(url) {
                
                    if (isExternal(url)) {
                
                        externals[url] = 1;
                        return "__load(" + JSON.stringify(url) + ")";
                    }
                    
                    return "__init(" + createNode(url, dir).toString() + ")";
                }
                
            });
        });
            
    }).then($=> {
    
        var out = OUTPUT_BEGIN, i;

        for (i = 0; i < nodes.length; ++i) {
        
            out += "\n__modules[" + i.toString() + "] = ";
            out += "function(exports) {\n" + nodes[i].factory + "\n};\n";
        }
        
        out += "\n__init(0, exports);\n";
        out = wrap("\n\n" + out, Object.keys(externals), options.global);
        
        return out;
    
    });
    
    function createNode(path, base) {
    
        path = resolve(path, base);
        
        if (hasKey(modules, path))
            return modules[path];
        
        var index = nodes.length;
        
        modules[path] = index;
        nodes.push({ path: path, factory: "" });
        
        return index;
    }
}
