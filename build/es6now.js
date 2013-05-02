/*=es6now=*/(function(fn, deps, name) { if (typeof exports !== 'undefined') fn.call(typeof global === 'object' ? global : this, require, exports); else if (typeof __MODULE === 'function') __MODULE(fn, deps); else if (typeof define === 'function' && define.amd) define(['require', 'exports'].concat(deps), fn); else if (typeof window !== 'undefined' && name) fn.call(window, null, window[name] = {}); else fn.call(window || this, null, {}); })(function(require, exports) { 'use strict'; function __load(p) { var e = require(p); return typeof e === 'object' ? e : { module: e }; } 

var __modules = [], __exports = [], __global = this; 

function __init(i, obj) { 
    var e = __exports; 
    if (e[i] !== void 0) return e[i]; 
    __modules[i].call(__global, e[i] = (obj || {})); 
    return e[i]; 
} 

__modules[0] = function(exports) {
var _M0 = __init(1), _M1 = __init(2); var Runtime = _M0;
var Program = _M1;

if (typeof require === "function" && 
    typeof module !== "undefined" && 
    module === require.main) {
    
    Program.run();
}
};

__modules[1] = function(exports) {
var _M0 = __init(3); Object.keys(_M0).forEach(function(k) { exports[k] = _M0[k]; });
};

__modules[2] = function(exports) {
var _M0 = __load("fs"), _M1 = __load("path"), _M2 = __init(4), _M3 = __init(5), _M4 = __init(6), _M5 = __init(7), _M6 = __init(8), _M7 = __init(9); var FS = _M0;
var Path = _M1;
var CommandLine = _M2;
var FFS = _M3;

var Promise = _M4.Promise;
var bundle = _M5.bundle;
var Server = _M6.Server;
var translate = _M7.translate;

var ES6_GUESS = /(?:^|\n)\s*(?:import|export|class)\s/;

function absPath(path) {

    return Path.resolve(process.cwd(), path);
}

function getOutPath(inPath, outPath) {

    var stat;
    
    outPath = absPath(outPath);
    
    try { stat = FS.statSync(outPath); } catch (e) {}
    
    if (stat && stat.isDirectory())
        return Path.resolve(outPath, Path.basename(inPath));
    
    return outPath;
}

function writeFile(path, text) {

    console.log("[Writing] " + absPath(path));
    FS.writeFileSync(path, text, "utf8");
}

function overrideCompilation() {

    // Compile ES6 js files
    require.extensions[".js"] = (function(module, filename) {
    
        var text;
        
        try {
        
            text = FS.readFileSync(filename, "utf8");
            
            if (ES6_GUESS.test(text))
                text = translate(text);
        
        } catch (e) {
        
            if (e instanceof SyntaxError)
                e = new SyntaxError(e.message);
            
            throw e;
        }
        
        return module._compile(text, filename);
    });
}

function run() {

    CommandLine.run({
    
        "*": {
        
            params: {
            
                "target": {
                
                    positional: true,
                    required: true
                }
            },
            
            execute: function(params) {
            
                params.debug = true;
                overrideCompilation();
                require(absPath(params.target));
            }
        
        },
        
        translate: {
        
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
                
                "debug": { flag: true }
            },
            
            execute: function(params) {
            
                var options = { 
                
                    global: params.global,
                    
                    log: function(filename) { 
                    
                        console.log("[Reading] " + absPath(filename));
                    }
                };
                
                options.log(params.input);
                
                FFS
                .readFile(params.input, "utf8")
                .then((function(text) { return translate(text, options); }))
                .then((function(text) {
                    
                    if (params.output) {
                    
                        var out = getOutPath(params.input, params.output);
                        writeFile(out, text);
                    
                    } else {
                    
                        console.log(text);
                    }
                    
                }), (function(err) {
                
                    throw err;
                }));
            }
        },
        
        bundle: {
        
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
                
                "debug": { flag: true }
            },
            
            execute: function(params) {
            
                var options = { 
                
                    global: params.global,
                    
                    log: function(filename) { 
                    
                        console.log("[Reading] " + absPath(filename));
                    }
                };
                
                bundle(params.input, options).then((function(text) {
                
                    if (params.output) {
                    
                        var out = getOutPath(params.input, params.output);
                        writeFile(out, text);
                    
                    } else {
                    
                        console.log(text);
                    }
                    
                }), (function(err) {
                
                    throw err;
                }));           
            }
        },
        
        serve: {
        
            params: {
            
                "root": { short: "r", positional: true },
                "port": { short: "p", positional: true }
            },
            
            execute: function(params) {
            
                var server = new Server(params);
                server.start();
                
                console.log("Listening on port " + server.port + ".  Press Enter to exit.");
                
                var stdin = process.stdin;
                
                stdin.resume();
                stdin.setEncoding('utf8');
                
                stdin.on("data", (function() { 
                
                    server.stop().then((function(val) { process.exit(0); }));
                }));
            }
        },
        
        error: function(err, params) {
        
            if (params.debug) {
            
                throw err;
            
            } else {
            
                console.log("Oops! ", err.toString());
            }
            
            process.exit(1);
        }
    });
}
exports.run = run;
};

__modules[3] = function(exports) {
var _M0 = __init(10), _M1 = __init(11); var Class = _M0.Class;
var emulate = _M1.emulate;

this.es6now = { Class: Class };

emulate();

};

__modules[4] = function(exports) {
function parse(argv, params) {

    var pos = Object.keys(params),
        values = {},
        shorts = {},
        required = [],
        param,
        value,
        name,
        i,
        a;
    
    // Create short-to-long mapping
    pos.forEach((function(name) {
    
        var p = params[name];
        
        if (p.short)
            shorts[p.short] = name;
        
        if (p.required)
            required.push(name);
    }));
    
    // For each command line arg...
    for (i = 0; i < argv.length; ++i) {
    
        a = argv[i];
        param = null;
        value = null;
        name = "";
        
        if (a[0] === "-") {
        
            if (a.slice(0, 2) === "--") {
            
                // Long named parameter
                param = params[name = a.slice(2)];
            
            } else {
            
                // Short named parameter
                param = params[name = shorts[a.slice(1)]];
            }
            
            // Verify parameter exists
            if (!param)
                throw new Error("Invalid command line option: " + a);
            
            if (param.flag) {
            
                value = true;
            
            } else {
            
                // Get parameter value
                value = argv[++i] || "";
                
                if (typeof value !== "string" || value[0] === "-")
                    throw new Error("No value provided for option " + a);
            }
            
        } else {
        
            // Positional parameter
            do { param = params[name = pos.shift()]; } 
            while (param && !param.positional);;
            
            value = a;
        }
        
        if (param)
            values[name] = value;
    }
    
    required.forEach((function(name) {
    
        if (values[name] === undefined)
            throw new Error("Missing required option: --" + name);
    }));
    
    return values;
}

function fail(msg) {

    console.log(msg);
    process.exit(1);
}

function runCommand(command, options) {
    
    options || (options = {});
    
    var argv = options.args || process.argv.slice(2),
        error = options.error || command.error || fail,
        params = {};
    
    try {
    
        params = parse(argv, command.params || {});
        return command.execute(params);
    
    } catch (err) {
    
        return error(err, params);
    }
}

function run(config) {

    var error = config.error || fail,
        argv = process.argv.slice(2),
        action = argv[0] || "*",
        command;
    
    if (!action)
        return error("No action specified.", {});
    
    command = config[action];
    
    if (!command) {
    
        if (config["*"]) {
        
            argv.unshift(command);
            command = config["*"];

        } else {
        
            return error("Invalid command: " + action, {});
        }
    }
    
    return runCommand(command, {
    
        args: argv.slice(1),
        error: config.error 
    });
}

/*

Example: 

parse(process.argv.slice(2), {

    "verbose": {
    
        short: "v",
        flag: true
    },
    
    "input": {
    
        short: "i",
        positional: true,
        required: true
    },
    
    "output": {
    
        short: "o",
        positional: true
    },
    
    "recursive": {
    
        short: "r",
        flag: false
    }
});

*/

exports.parse = parse;
exports.runCommand = runCommand;
exports.run = run;
};

__modules[5] = function(exports) {
var _M0 = __load("fs"), _M1 = __init(6); var FS = _M0;

var Promise = _M1.Promise;

// Wraps a standard Node async function with a promise
// generating function
function wrap(obj, name) {

	return function() {
	
		var a = [].slice.call(arguments, 0),
			promise = new Promise;
		
		a.push((function(err, data) {
		
			if (err) promise.reject(err);
			else promise.resolve(data);
		}));
		
		if (name) obj[name].apply(obj, a);
    	else obj.apply(null, a);
		
		return promise.future;
	};
}

var 
    exists = wrap(FS.exists),
    readFile = wrap(FS.readFile),
    close = wrap(FS.close),
    open = wrap(FS.open),
    read = wrap(FS.read),
    write = wrap(FS.write),
    rename = wrap(FS.rename),
    truncate = wrap(FS.truncate),
    rmdir = wrap(FS.rmdir),
    fsync = wrap(FS.fsync),
    mkdir = wrap(FS.mkdir),
    sendfile = wrap(FS.sendfile),
    readdir = wrap(FS.readdir),
    fstat = wrap(FS.fstat),
    lstat = wrap(FS.lstat),
    stat = wrap(FS.stat),
    readlink = wrap(FS.readlink),
    symlink = wrap(FS.symlink),
    link = wrap(FS.link),
    unlink = wrap(FS.unlink),
    fchmod = wrap(FS.fchmod),
    lchmod = wrap(FS.lchmod),
    chmod = wrap(FS.chmod),
    lchown = wrap(FS.lchown),
    fchown = wrap(FS.fchown),
    chown = wrap(FS.chown),
    utimes = wrap(FS.utimes),
    futimes = wrap(FS.futimes),
    writeFile = wrap(FS.writeFile),
    appendFile = wrap(FS.appendFile),
    realpath = wrap(FS.realpath);

exports.exists = exists;
exports.readFile = readFile;
exports.close = close;
exports.open = open;
exports.read = read;
exports.write = write;
exports.rename = rename;
exports.truncate = truncate;
exports.rmdir = rmdir;
exports.fsync = fsync;
exports.mkdir = mkdir;
exports.sendfile = sendfile;
exports.readdir = readdir;
exports.fstat = fstat;
exports.lstat = lstat;
exports.stat = stat;
exports.readlink = readlink;
exports.symlink = symlink;
exports.link = link;
exports.unlink = unlink;
exports.fchmod = fchmod;
exports.lchmod = lchmod;
exports.chmod = chmod;
exports.lchown = lchown;
exports.fchown = fchown;
exports.chown = chown;
exports.utimes = utimes;
exports.futimes = futimes;
exports.writeFile = writeFile;
exports.appendFile = appendFile;
exports.realpath = realpath;
};

__modules[6] = function(exports) {
var _M0 = __init(12); Object.keys(_M0).forEach(function(k) { exports[k] = _M0[k]; });
};

__modules[7] = function(exports) {
var _M0 = __load("path"), _M1 = __init(5), _M2 = __init(6), _M3 = __init(9); var Path = _M0;
var FFS = _M1;

var Promise = _M2.Promise;
var translate = _M3.translate, wrap = _M3.wrap;

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

function bundle(filename, options) {

    options || (options = {});
    
    var externals = {},
        modules = {},
        nodes = [],
        current = 0;
    
    createNode(filename, null);
    
    return Promise.iterate((function(stop) {
    
        if (current >= nodes.length)
            return stop();
        
        var node = nodes[current],
            path = node.path,
            dir = Path.dirname(path);
        
        current += 1;
        
        if (options.log)
            options.log(path);
        
        // Read file
        return FFS.readFile(path, "utf8").then((function(text) {
        
            node.factory = translate(text, {
            
                wrap: false,
                
                loadCall: function(url) {
                
                    if (isExternal(url)) {
                
                        externals[url] = 1;
                        return "__load(" + JSON.stringify(url) + ")";
                    }
                    
                    return "__init(" + createNode(url, dir).toString() + ")";
                }
                
            });
        }));
            
    })).then((function($) {
    
        var out = OUTPUT_BEGIN, i;

        for (i = 0; i < nodes.length; ++i) {
        
            out += "\n__modules[" + i.toString() + "] = ";
            out += "function(exports) {\n" + nodes[i].factory + "\n};\n";
        }
        
        out += "\n__init(0, exports);\n";
        out = wrap("\n\n" + out, Object.keys(externals), options.global);
        
        return out;
    
    }));
    
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

exports.bundle = bundle;
};

__modules[8] = function(exports) {
var _M0 = __load("fs"), _M1 = __load("http"), _M2 = __load("path"), _M3 = __load("url"), _M4 = __init(5), _M5 = __init(6), _M6 = __init(9), _M7 = __init(13); var __this = this; var FS = _M0;
var HTTP = _M1;
var Path = _M2;
var URL = _M3;

var FFS = _M4;

var Promise = _M5.Promise;
var translate = _M6.translate, isWrapped = _M6.isWrapped;
var mimeTypes = _M7.mimeTypes;

var DEFAULT_PORT = 80,
    DEFAULT_ROOT = ".",
    JS_FILE = /\.js$/i;

var Server = es6now.Class(function(__super) { return {

    constructor: function(options) { var __this = this; 
    
        options || (options = {});
    
        this.root = Path.resolve(options.root || DEFAULT_ROOT);
        this.port = options.port || DEFAULT_PORT;
        this.hostname = options.hostname || null;
        this.server = HTTP.createServer((function(request, response) { return __this.onRequest(request, response); }));
        this.active = false;
    },
    
    start: function(port, hostname) {
    
        if (this.active)
            throw new Error("Server is already listening");
        
        if (port)
            this.port = port;
        
        if (hostname)
            this.hostname = hostname;
        
        var promise = new Promise;
        this.server.listen(this.port, this.hostname, (function(ok) { return promise.resolve(null); }));
        
        this.active = true;
        
        return promise.future;
    },
    
    stop: function() {
    
        var promise = new Promise;
        
        if (this.active) {
        
            this.active = false;
            this.server.close((function(ok) { return promise.resolve(null); }));
        
        } else {
        
            promise.resolve(null);
        }
        
        return promise.future;
    },
    
    onRequest: function(request, response) { var __this = this; 
    
        if (request.method !== "GET" && request.method !== "HEAD")
            return this.error(405, response);
        
        var path = URL.parse(request.url).pathname;
        
        path = Path.join(this.root, path);
        
        if (path.indexOf(this.root) !== 0)
            return this.error(403, response);
        
        FFS.stat(path).then((function(stat) {
        
            if (stat.isDirectory())
                return __this.streamDefault(path, response);
            
            if (stat.isFile()) {
            
                return JS_FILE.test(path) ? 
                    __this.streamJS(path, response) : 
                    __this.streamFile(path, stat.size, response);
            }
            
            return __this.error(404, response);
            
        }), (function(err) {
        
            return __this.error(404, response);
            
        }));
    },
    
    error: function(code, response) {
    
        response.writeHead(code, { "Content-Type": "text/plain" });
        response.write(HTTP.STATUS_CODES[code] + "\n")
        response.end();
    },
    
    streamDefault: function(path, response) { var __this = this; 
    
        var files = [ "index.html", "index.htm", "default.html", "default.htm" ];
        
        var next = (function() {
        
            if (files.length === 0)
                return __this.error(404, response);
            
            var file = files.shift(),
                search = Path.join(path, file);
            
            FFS.stat(search).then((function(stat) {
            
                if (!stat.isFile())
                    return next();
                
                path = search;
                __this.streamFile(path, stat.size, response);
                
            }), (function(err) {
            
                return next();
            }));
        });
        
        next();
    },
    
    streamJS: function(path, response) { var __this = this; 
        
        FFS.readFile(path, "utf8").then((function(source) {
        
            if (!isWrapped(source)) {
            
                // TODO:  A better way to report errors?
                try { source = translate(source); } 
                catch (x) { source += "\n\n// " + x.message; }
            }
            
            response.writeHead(200, { "Content-Type": "text/javascript; charset=UTF-8" });
            response.end(source, "utf8");
        
        }), (function(err) {
        
            __this.error(500, err);
        }));
    },
    
    streamFile: function(path, size, response) { var __this = this; 
            
        var ext = Path.extname(path).slice(1).toLowerCase();
            
        var headers = { 
    
            // TODO: we should only append charset to certain types
            "Content-Type": (mimeTypes[ext] || mimeTypes["*"]) + "; charset=UTF-8",
            "Content-Length": size
        };
            
        var stream = FS.createReadStream(path, { 
        
            flags: "r", 
            mode: 438
        });
        
        stream.on("error", (function(err) {
        
            __this.error(500, response);
        }));
        
        stream.on("data", (function(data) {
        
            if (headers) {
            
                response.writeHead(200, headers);
                headers = null;
            }
        }));
        
        stream.pipe(response);
    }
}});
exports.Server = Server;
};

__modules[9] = function(exports) {
var _M0 = __init(14); var Replacer = _M0.Replacer;

var SIGNATURE = "/*=es6now=*/";

var WRAP_CALLEE = "(function(fn, deps, name) { " +

    // Node.js:
    "if (typeof exports !== 'undefined') " +
        "fn.call(typeof global === 'object' ? global : this, require, exports); " +
        
    // Sane module transport:
    "else if (typeof __MODULE === 'function') " +
        "__MODULE(fn, deps); " +
        
    // Insane module transport:
    "else if (typeof define === 'function' && define.amd) " +
        "define(['require', 'exports'].concat(deps), fn); " +
        
    // DOM global module:
    "else if (typeof window !== 'undefined' && name) " +
        "fn.call(window, null, window[name] = {}); " +
    
    // Hail Mary:
    "else " +
        "fn.call(window || this, null, {}); " +

"})";

var WRAP_HEADER = "function(require, exports) { " +
    "'use strict'; " +
    "function __load(p) { " +
        "var e = require(p); " +
        "return typeof e === 'object' ? e : { module: e }; " +
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

function translate(input, options) {

    options || (options = {});
    
    var replacer = new Replacer(),
        output;
    
    if (options.loadCall)
        replacer.loadCall = options.loadCall;
    
    input = sanitize(input);
    output = replacer.replace(input);
    
    if (options.wrap !== false)
        output = wrap(output, replacer.dependencies, options.global);
    
    return output;
}

function wrap(text, dep, global) {

    return SIGNATURE + WRAP_CALLEE + "(" + 
        WRAP_HEADER + text + WRAP_FOOTER + ", " + 
        JSON.stringify(dep || []) + ", " + 
        JSON.stringify(global || "") +
    ");";
}

function isWrapped(text) {

    return text.indexOf(SIGNATURE) === 0;
}


exports.translate = translate;
exports.wrap = wrap;
exports.isWrapped = isWrapped;
};

__modules[10] = function(exports) {
var HOP = Object.prototype.hasOwnProperty,
    STATIC = /^__static_/;

// Returns true if the object has the specified property
function hasOwn(obj, name) {

    return HOP.call(obj, name);
}

// Returns true if the object has the specified property in
// its prototype chain
function has(obj, name) {

    for (; obj; obj = Object.getPrototypeOf(obj))
        if (HOP.call(obj, name))
            return true;
    
    return false;
}

// Iterates over the descriptors for each own property of an object
function forEachDesc(obj, fn) {

    var names = Object.getOwnPropertyNames(obj);
    
    for (var i = 0, name; i < names.length; ++i)
        fn(names[i], Object.getOwnPropertyDescriptor(obj, names[i]));
    
    return obj;
}

// Performs copy-based inheritance
function inherit(to, from) {

    for (; from; from = Object.getPrototypeOf(from)) {
    
        forEachDesc(from, (function(name, desc) {
        
            if (!has(to, name))
                Object.defineProperty(to, name, desc);
        }));
    }
    
    return to;
}

function defineMethods(to, from, classMethods) {

    forEachDesc(from, (function(name, desc) {
    
        if (STATIC.test(name) === classMethods)
            Object.defineProperty(to, classMethods ? name.replace(STATIC, "") : name, desc);
    }));
    
    return to;
}

function Class(base, def) {

    function constructor() { 
    
        if (parent && parent.constructor)
            parent.constructor.apply(this, arguments);
    }
    
    var parent;
    
    if (def === void 0) {
    
        // If no base class is specified, then Object.prototype
        // is the parent prototype
        def = base;
        base = null;
        parent = Object.prototype;
    
    } else if (base === null) {
    
        // If the base is null, then then then the parent prototype is null
        parent = null;
        
    } else if (typeof base === "function") {
    
        parent = base.prototype;
        
        // Prototype must be null or an object
        if (parent !== null && Object(parent) !== parent)
            parent = void 0;
    }
    
    if (parent === void 0)
        throw new TypeError();
    
    // Generate the method collection, closing over "super"
    var props = def(parent);
    
    // Get constructor
    if (hasOwn(props, "constructor"))
        constructor = props.constructor;
    
    // Make constructor non-enumerable and assign a default
    // if none is provided
    Object.defineProperty(props, "constructor", {
    
        enumerable: false,
        writable: true,
        configurable: true,
        value: constructor
    });
    
    // Create prototype object
    var proto = defineMethods(Object.create(parent), props, false);
    
    // Set constructor's prototype
    constructor.prototype = proto;
    
    // Set class "static" methods
    defineMethods(constructor, props, true);
    
    // "Inherit" from base constructor
    if (base) inherit(constructor, base);
    
    return constructor;
}



exports.Class = Class;
};

__modules[11] = function(exports) {
var _M0 = __init(15); var ES5 = _M0;

var global = this;

function addProps(obj, props) {

    Object.keys(props).forEach((function(k) {
    
        if (typeof obj[k] !== "undefined")
            return;
        
        Object.defineProperty(obj, k, {
        
            value: props[k],
            configurable: true,
            enumerable: false,
            writable: true
        });
    }));
}

function emulate() {

    ES5.emulate();

    addProps(Object, {
    
        is: function(a, b) {
        
            // TODO
        },
        
        assign: function(target, source) {
        
            Object.keys(source).forEach((function(k) { return target[k] = source[k]; }));
            return target;
        },
        
        mixin: function(target, source) {
        
            Object.getOwnPropertyNames(source).forEach((function(name) {
            
                var desc = Object.getOwnPropertyDescriptor(source, name);
                Object.defineProperty(target, name, desc);
            }));
            
            return target;
        }
    });
    
    addProps(Number, {
    
        EPSILON: Number.EPSILON || (function() {
        
            var next, result;
            
            for (next = 1; 1 + next !== 1; next = next / 2)
                result = next;
            
            return result;
        }()),
        
        MAX_INTEGER: 9007199254740992,
        
        isFinite: function(val) {
            
            return typeof val === "number" && isFinite(val);
        },
        
        isNaN: function(val) {
        
            return typeof val === "number" && isNaN(val);
        },
        
        isInteger: function(val) {
        
            typeof val === "number" && val | 0 === val;
        },
        
        toInteger: function(val) {
            
            return val | 0;
        }
    });
    
    addProps(Array, {
    
        from: function(arg) {
            // TODO
        },
        
        of: function() {
            // ?
        }
    
    });
    
    addProps(String.prototype, {
        
        repeat: function(count) {
        
            return new Array(count + 1).join(this);
        },
        
        startsWith: function(search, start) {
        
            return this.indexOf(search, start) === start;
        },
        
        endsWith: function(search, end) {
        
            return this.slice(-search.length) === search;
        },
        
        contains: function(search, pos) {
        
            return this.indexOf(search, pos) !== -1;
        }
    });
    
    if (typeof Map === "undefined") global.Map = (function() {
    
        function Map() {
        
        }
        
        return Map;
        
    })();
    
    if (typeof Set === "undefined") global.Set = (function() {
    
        function Set() {
        
        }
        
        return Set;
        
    })();
    
}



exports.emulate = emulate;
};

__modules[12] = function(exports) {
var EventLoop = (function(exports) {

    var asap;
    
    var msg = uuid(),
        process = this.process,
        window = this.window,
        msgChannel = null,
        list = [];
    
    if (process && typeof process.nextTick === "function") {
    
        // NodeJS
        asap = process.nextTick;
   
    } else if (window && window.addEventListener && window.postMessage) {
    
        // Modern Browsers
        if (window.MessageChannel) {
        
            msgChannel = new window.MessageChannel();
            msgChannel.port1.onmessage = onmsg;
        
        } else {
        
            window.addEventListener("message", onmsg, true);
        }
        
        asap = (function(fn) {
        
            list.push(fn);
            
            if (msgChannel !== null)
                msgChannel.port2.postMessage(msg);
            else
                window.postMessage(msg, "*");
            
            return 1;
        });
    
    } else {
    
        // Legacy
        asap = (function(fn) { return setTimeout(fn, 0); });
    }
        
    function onmsg(evt) {
    
        if (msgChannel || (evt.source === window && evt.data === msg)) {
        
            evt.stopPropagation();
            if (list.length) list.shift()();
        }
    }
    
    function uuid() {
    
        return [32, 16, 16, 16, 48].map((function(bits) { return rand(bits); })).join("-");
        
        function rand(bits) {
        
            if (bits > 32) 
                return rand(bits - 32) + rand(32);
            
            var str = (Math.random() * 0xffffffff >>> (32 - bits)).toString(16),
                len = bits / 4 >>> 0;
            
            if (str.length < len) 
                str = (new Array(len - str.length + 1)).join("0") + str;
            
            return str;
        }
    }
    
exports.asap = asap; return exports; }).call(this, {});

var asap = EventLoop.asap;

var identity = (function(obj) { return obj; }),
    freeze = Object.freeze || identity,
    queue = [],
    waiting = false;

// UUID property names used for duck-typing
var DISPATCH = "07b06b7e-3880-42b1-ad55-e68a77514eb9",
    IS_FAILURE = "7d24bf0f-d8b1-4783-b594-cec32313f6bc";

var EMPTY_LIST_MSG = "List cannot be empty.",
    WAS_RESOLVED_MSG = "The promise has already been resolved.",
    CYCLE_MSG = "A promise cycle was detected.";

var THROW_DELAY = 50;

// Enqueues a message
function enqueue(future, args) {

    queue.push({ fn: future[DISPATCH], args: args });
    
    if (!waiting) {
    
        waiting = true;
        asap(flush);
    }
}

// Flushes the message queue
function flush() {

    waiting = false;

    while (queue.length > 0) {
        
        // Send each message in queue
        for (var count = queue.length, msg; count > 0; --count) {
        
            msg = queue.shift();
            msg.fn.apply(void 0, msg.args);
        }
    }
}

// Returns a cycle error
function cycleError() {

    return failure(CYCLE_MSG);
}

// Future constructor
function Future(dispatch) {
    
    this[DISPATCH] = dispatch;
}

// Registers a callback for completion when a future is complete
Future.prototype.then = function then(onSuccess, onFail) {

    onSuccess || (onSuccess = identity);
    
    var resolve = (function(value) { return finish(value, onSuccess); }),
        reject = (function(value) { return finish(value, onFail); }),
        promise = new Promise(onQueue),
        target = this,
        done = false;
    
    onQueue(onSuccess, onFail);
    
    return promise.future;
    
    function onQueue(success, error) {
    
        if (success && resolve) {
        
            enqueue(target, [ resolve, null ]);
            resolve = null;
        }
        
        if (error && reject) {
        
            enqueue(target, [ null, reject ]);
            reject = null;
        }
    }
    
    function finish(value, transform) {
    
        if (!done) {
        
            done = true;
            promise.resolve(applyTransform(transform, value));
        }
    }
};

// Begins a deferred operation
function Promise(onQueue) {

    var token = {},
        pending = [],
        throwable = true,
        next = null;

    this.future = freeze(new Future(dispatch));
    this.resolve = resolve;
    this.reject = reject;
    
    freeze(this);
    
    // Dispatch function for future
    function dispatch(success, error, src) {
    
        var msg = [success, error, src || token];
        
        if (error)
            throwable = false;
        
        if (pending) {
        
            pending.push(msg);
            
            if (onQueue)
                onQueue(success, error);
        
        } else {
        
            // If a cycle is detected, convert resolution to a rejection
            if (src === token) {
            
                next = cycleError();
                maybeThrow();
            }
            
            enqueue(next, msg);
        }
    }
    
    // Resolves the promise
    function resolve(value) {
    
        if (!pending)
            throw new Error(WAS_RESOLVED_MSG);
        
        var list = pending;
        pending = false;
        
        // Create a future from the provided value
        next = when(value);

        // Send internally queued messages to the next future
        for (var i = 0; i < list.length; ++i)
            enqueue(next, list[i]);
        
        maybeThrow();
    }
    
    // Resolves the promise with a rejection
    function reject(error) {
    
        resolve(failure(error));
    }
    
    // Throws an error if the promise is rejected and there
    // are no error handlers
    function maybeThrow() {
    
        if (!throwable || !isFailure(next))
            return;
        
        setTimeout((function() {
        
            var error = null;
            
            // Get the error value
            next[DISPATCH](null, (function(val) { return error = val; }));
            
            // Throw it
            if (error && throwable)
                throw error;
            
        }), THROW_DELAY);
    }
}

// Returns a future for an object
function when(obj) {

    if (obj && obj[DISPATCH])
        return obj;
    
    if (obj && typeof obj.then === "function") {
    
        var promise = new Promise();
        obj.then(promise.resolve, promise.reject);
        return promise.future;
    }
    
    // Wrap a value in an immediate future
    return freeze(new Future((function(success) { return success && success(obj); })));
}

// Returns true if the object is a failed future
function isFailure(obj) {

    return obj && obj[IS_FAILURE];
}

// Creates a failure Future
function failure(value) {

    var future = new Future((function(success, error) { return error && error(value); }));
    
    // Tag the future as a failure
    future[IS_FAILURE] = true;
    
    return freeze(future);
}

// Applies a promise transformation function
function applyTransform(transform, value) {

    try { return (transform || failure)(value); }
    catch (ex) { return failure(ex); }
}

// Returns a future for every completed future in an array
function whenAll(list) {

    var count = list.length,
        promise = new Promise(),
        out = [],
        value = out,
        i;
    
    for (i = 0; i < list.length; ++i)
        waitFor(list[i], i);
    
    if (count === 0)
        promise.resolve(out);
    
    return promise.future;
    
    function waitFor(f, index) {
    
        when(f).then((function(val) { 
        
            out[index] = val;
            
            if (--count === 0)
                promise.resolve(value);
        
        }), (function(err) {
        
            value = failure(err);
            
            if (--count === 0)
                promise.resolve(value);
        }));
    }
}

// Returns a future for the first completed future in an array
function whenAny(list) {

    if (list.length === 0)
        throw new Error(EMPTY_LIST_MSG);
    
    var promise = new Promise(), i;
    
    for (i = 0; i < list.length; ++i)
        when(list[i]).then((function(val) { return promise.resolve(val); }), (function(err) { return promise.reject(err); }));
    
    return promise.future;
}

function iterate(fn) {

    var done = false,
        stop = (function(val) { done = true; return val; }),
        next = (function(last) { return done ? last : when(fn(stop)).then(next); });
    
    return when(null).then(next);
}

function forEach(list, fn) {

    var i = -1;
    
    return iterate((function(stop) { return (++i >= list.length) ? stop() : fn(list[i], i, list); }));
}

Promise.when = when;
Promise.whenAny = whenAny;
Promise.whenAll = whenAll;
Promise.forEach = forEach;
Promise.iterate = iterate;
Promise.reject = failure;


exports.Promise = Promise;
};

__modules[13] = function(exports) {
var mimeTypes = {

    "aiff": "audio/x-aiff",
    "arj": "application/x-arj-compressed",
    "asf": "video/x-ms-asf",
    "asx": "video/x-ms-asx",
    "au": "audio/ulaw",
    "avi": "video/x-msvideo",
    "bcpio": "application/x-bcpio",
    "ccad": "application/clariscad",
    "cod": "application/vnd.rim.cod",
    "com": "application/x-msdos-program",
    "cpio": "application/x-cpio",
    "cpt": "application/mac-compactpro",
    "csh": "application/x-csh",
    "css": "text/css",
    "deb": "application/x-debian-package",
    "dl": "video/dl",
    "doc": "application/msword",
    "drw": "application/drafting",
    "dvi": "application/x-dvi",
    "dwg": "application/acad",
    "dxf": "application/dxf",
    "dxr": "application/x-director",
    "etx": "text/x-setext",
    "ez": "application/andrew-inset",
    "fli": "video/x-fli",
    "flv": "video/x-flv",
    "gif": "image/gif",
    "gl": "video/gl",
    "gtar": "application/x-gtar",
    "gz": "application/x-gzip",
    "hdf": "application/x-hdf",
    "hqx": "application/mac-binhex40",
    "htm": "text/html",
    "html": "text/html",
    "ice": "x-conference/x-cooltalk",
    "ico": "image/x-icon",
    "ief": "image/ief",
    "igs": "model/iges",
    "ips": "application/x-ipscript",
    "ipx": "application/x-ipix",
    "jad": "text/vnd.sun.j2me.app-descriptor",
    "jar": "application/java-archive",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "js": "text/javascript",
    "json": "application/json",
    "latex": "application/x-latex",
    "less": "text/css",
    "lsp": "application/x-lisp",
    "lzh": "application/octet-stream",
    "m": "text/plain",
    "m3u": "audio/x-mpegurl",
    "man": "application/x-troff-man",
    "manifest": "text/cache-manifest",
    "me": "application/x-troff-me",
    "midi": "audio/midi",
    "mif": "application/x-mif",
    "mime": "www/mime",
    "movie": "video/x-sgi-movie",
    "mp4": "video/mp4",
    "mpg": "video/mpeg",
    "mpga": "audio/mpeg",
    "ms": "application/x-troff-ms",
    "nc": "application/x-netcdf",
    "oda": "application/oda",
    "ogm": "application/ogg",
    "pbm": "image/x-portable-bitmap",
    "pdf": "application/pdf",
    "pgm": "image/x-portable-graymap",
    "pgn": "application/x-chess-pgn",
    "pgp": "application/pgp",
    "pm": "application/x-perl",
    "png": "image/png",
    "pnm": "image/x-portable-anymap",
    "ppm": "image/x-portable-pixmap",
    "ppz": "application/vnd.ms-powerpoint",
    "pre": "application/x-freelance",
    "prt": "application/pro_eng",
    "ps": "application/postscript",
    "qt": "video/quicktime",
    "ra": "audio/x-realaudio",
    "rar": "application/x-rar-compressed",
    "ras": "image/x-cmu-raster",
    "rgb": "image/x-rgb",
    "rm": "audio/x-pn-realaudio",
    "rpm": "audio/x-pn-realaudio-plugin",
    "rtf": "text/rtf",
    "rtx": "text/richtext",
    "scm": "application/x-lotusscreencam",
    "set": "application/set",
    "sgml": "text/sgml",
    "sh": "application/x-sh",
    "shar": "application/x-shar",
    "silo": "model/mesh",
    "sit": "application/x-stuffit",
    "skt": "application/x-koan",
    "smil": "application/smil",
    "snd": "audio/basic",
    "sol": "application/solids",
    "spl": "application/x-futuresplash",
    "src": "application/x-wais-source",
    "stl": "application/SLA",
    "stp": "application/STEP",
    "sv4cpio": "application/x-sv4cpio",
    "sv4crc": "application/x-sv4crc",
    "svg": "image/svg+xml",
    "swf": "application/x-shockwave-flash",
    "tar": "application/x-tar",
    "tcl": "application/x-tcl",
    "tex": "application/x-tex",
    "texinfo": "application/x-texinfo",
    "tgz": "application/x-tar-gz",
    "tiff": "image/tiff",
    "tr": "application/x-troff",
    "tsi": "audio/TSP-audio",
    "tsp": "application/dsptype",
    "tsv": "text/tab-separated-values",
    "txt": "text/plain",
    "unv": "application/i-deas",
    "ustar": "application/x-ustar",
    "vcd": "application/x-cdlink",
    "vda": "application/vda",
    "vivo": "video/vnd.vivo",
    "vrm": "x-world/x-vrml",
    "wav": "audio/x-wav",
    "wax": "audio/x-ms-wax",
    "wma": "audio/x-ms-wma",
    "wmv": "video/x-ms-wmv",
    "wmx": "video/x-ms-wmx",
    "wrl": "model/vrml",
    "wvx": "video/x-ms-wvx",
    "xbm": "image/x-xbitmap",
    "xlw": "application/vnd.ms-excel",
    "xml": "text/xml",
    "xpm": "image/x-xpixmap",
    "xwd": "image/x-xwindowdump",
    "xyz": "chemical/x-pdb",
    "zip": "application/zip",
    "*": "application/octect-stream"
};

exports.mimeTypes = mimeTypes;
};

__modules[14] = function(exports) {
var _M0 = __init(16); /*

== Notes ==

- With this approach, we can't have cyclic dependencies.  But there are
  many other restrictions as well.  They may be lifted at some point in
  the future.

*/

var __this = this; var Parser = _M0;

var HAS_SCHEMA = /^[a-z]+:/i,
    NODE_SCHEMA = /^(?:npm|node):/i;

function loadCall(url) {

    return "__load(" + JSON.stringify(url) + ")";
}

var Replacer = es6now.Class(function(__super) { return {

    constructor: function() {
        
        this.loadCall = loadCall;
    },
    
    replace: function(input) { var __this = this; 
    
        this.exportStack = [this.exports = {}];
        this.imports = {};
        this.dependencies = [];
        this.uid = 0;
        this.input = input;

        var root = Parser.parseModule(input);
        
        var visit = (function(node) {
        
            // Call pre-order traversal method
            if (__this[node.type + "Begin"])
                __this[node.type + "Begin"](node);
            
            // Perform a depth-first traversal
            Parser.forEachChild(node, (function(child) {
            
                child.parentNode = node;
                visit(child);
            }));
            
            node.text = __this.stringify(node);
            
            // Call replacer
            if (__this[node.type]) {
            
                var replaced = __this[node.type](node);
                
                node.text = (replaced === undefined || replaced === null) ?
                    __this.stringify(node) :
                    replaced;
            }
            
            return node.text;
        });
        
        var output = visit({ 
        
            type: "$", 
            root: root, 
            start: 0, 
            end: input.length
        });
        
        var head = "";
        
        this.dependencies.forEach((function(url) {
        
            if (head) head += ", ";
            else head = "var ";
            
            head += __this.imports[url] + " = " + __this.loadCall(url);
        }));
        
        if (head) 
            head += "; ";
        
        output = head + output;
        
        Object.keys(this.exports).forEach((function(k) {
    
            output += "\nexports." + k + " = " + __this.exports[k] + ";";
        }));
        
        return output;
    },

    DoWhileStatement: function(node) {
    
        if (node.text.slice(-1) !== ";")
            return node.text + ";";
    },
    
    Module: function(node) {
    
        if (node.createThisBinding)
            return "var __this = this; " + node.text;
    },
    
    Script: function(node) {
    
        if (node.createThisBinding)
            return "var __this = this; " + node.text;
    },
    
    FunctionBody: function(node) {
    
        if (node.parentNode.createThisBinding)
            return "{ var __this = this; " + node.text.slice(1);
    },
    
    MethodDefinition: function(node) {
    
        // TODO: Generator methods
        
        // TODO: will fail if name is a string:  static "name"() {}
        if (node.parentNode.type === "ClassElement" && 
            node.parentNode.static) {
            
            node.name.text = "__static_" + node.name.text;
        }
        
        if (!node.modifier)
            return node.name.text + ": function(" + this.joinList(node.params) + ") " + node.body.text;
    },
    
    PropertyDefinition: function(node) {
    
        if (node.expression === null)
            return node.name.text + ": " + node.name.text;
    },
    
    ImportAsDeclaration: function(node) {
    
        return "var " + node.ident.text + " = " + this.moduleIdent(node.from.value) + ";";
    },
    
    ModuleDeclarationBegin: function(node) {
    
        this.exportStack.push(this.exports = {});
    },
    
    ModuleDeclaration: function(node) { var __this = this; 
    
        var out = "var " + node.ident.text + " = (function(exports) ";
        
        out += node.body.text.replace(/\}$/, "");
        
        Object.keys(this.exports).forEach((function(k) {
    
            out += "exports." + k + " = " + __this.exports[k] + "; ";
        }));
        
        this.exportStack.pop();
        this.exports = this.exportStack[this.exportStack.length - 1];
        
        out += "return exports; }).call(this, {});";
        
        return out;
    },
    
    ImportDeclaration: function(node) {
    
        var out = "";
        
        var moduleSpec = node.from.type === "String" ?
            this.moduleIdent(node.from.value) :
            node.from.text;
        
        node.specifiers.forEach((function(spec) {
        
            var remote = spec.remote,
                local = spec.local || remote;
            
            if (out) out += ", ";
            else out = "var ";
            
            out += local.text + " = " + moduleSpec + "." + remote.text;
        }));
        
        out += ";";
        
        return out;
    },
    
    ExportDeclaration: function(node) {
    
        var binding = node.binding,
            bindingType = binding ? binding.type : "*",
            exports = this.exports,
            ident;
        
        // Exported declarations
        switch (binding.type) {
        
            case "VariableDeclaration":
            
                binding.declarations.forEach((function(decl) {
            
                    // TODO: Destructuring!
                    ident = decl.pattern.text;
                    exports[ident] = ident;
                }));
                
                return binding.text + ";";
            
            case "FunctionDeclaration":
            case "ClassDeclaration":
            case "ModuleDeclaration":
            
                ident = binding.ident.text;
                exports[ident] = ident;
                return binding.text;
        }
        
        var from = binding.from,
            fromPath = "",
            out = "";
        
        if (from) {
        
            fromPath = from.type === "String" ?
                this.moduleIdent(from.value) :
                from.text;
        }
        
        if (!binding.specifiers) {
        
            if (from) {
            
                out += "Object.keys(" + fromPath + ").forEach(function(k) { exports[k] = " + fromPath + "[k]; });";
                
            } else {
            
                // TODO:
                throw new Error("`export *;` is not implemented.");
            }
        
        } else {
        
            binding.specifiers.forEach((function(spec) {
            
                var local = spec.local.text,
                    remote = spec.remote ? spec.remote.text : local;
            
                exports[remote] = from ? 
                    fromPath + "." + local :
                    local;
            }));        
        }
        
        return out;
    },
    
    CallExpression: function(node) {
    
        var callee = node.callee,
            args = node.arguments;
        
        /*
        // Translate CommonJS require calls
        if (callee.type === "Identifier" && 
            callee.value === "require" &&
            args.length === 1 &&
            args[0].type === "String") {
        
            return this.loadCall(this.requirePath(args[0].value));
        }
        */
        
        if (node.isSuperCall) {
        
            var argText = "this";
            
            if (args.length > 0)
                argText += ", " + this.joinList(args);
            
            // TODO: what if callee is of the form super["abc"]?
            return callee.text + ".call(" + argText + ")";
        }
    },
    
    SuperExpression: function(node) {
    
        var p = node.parentNode;
        
        if (p.type === "CallExpression") {
        
            p.isSuperCall = true;
            
            var m = this.parentFunction(p),
                name = (m.type === "MethodDefinition" ? m.name.text : "constructor");
            
            // TODO: what if method name is not an identifier?
            return "__super." + name;
        }
        
        p = p.parentNode;
        
        if (p.type === "CallExpression")
            p.isSuperCall = true;
        
        return "__super";
    },
    
    ArrowFunction: function(node) {
    
        var head, body, expr;
        
        head = "function(" + this.joinList(node.params) + ")";
        
        if (node.body.type === "FunctionBody") {
        
            body = node.body.text;
        
        } else {
        
            body = "{ return " + node.body.text + "; }";
        }

        return "(" + head + " " + body + ")";
    },
    
    ThisExpression: function(node) {
    
        var fn = this.parentFunction(node);
        
        if (fn.type === "ArrowFunction") {
        
            while (fn = this.parentFunction(fn))
                if (fn.type !== "ArrowFunction")
                    fn.createThisBinding = true;
            
            return "__this";
        }
    },
    
    ClassDeclaration: function(node) {
    
        return "var " + node.ident.text + " = es6now.Class(" + 
            (node.base ? (node.base.text + ", ") : "") +
            "function(__super) { return " +
            node.body.text + "});";
    },
    
    ClassExpression: function(node) {
    
        var before = "", 
            after = "";
        
        if (node.ident) {
        
            before = "(function() { var " + node.ident.text + " = ";
            after = "; return " + node.ident.text + "; })()";
        }
        
        return before + 
            "es6now.Class(" + 
            (node.base ? (node.base.text + ", ") : "") +
            "function(__super) { return" +
            node.body.text + "})" +
            after;
    },
    
    ClassBody: function(node) {
    
        var elems = node.elements, 
            e,
            i;
        
        for (i = elems.length; i--;) {
        
            e = elems[i];
            
            if (e.static)
                e.text = e.text.replace(/^static\s+/, "");
            
            if (i < elems.length - 1)
                e.text += ",";
        }
    },
    
    TemplateExpression: function(node) {
    
        var lit = node.literals,
            sub = node.substitutions,
            out = "",
            i;
        
        for (i = 0; i < lit.length; ++i) {
        
            if (i > 0)
                out += " + (" + sub[i - 1].text + ") + ";
            
            out += JSON.stringify(lit[i].value);
        }
        
        return out;
    },
    
    parentFunction: function(node) {
    
        for (var p = node.parentNode; p; p = p.parentNode) {
        
            switch (p.type) {
            
                case "ArrowFunction":
                case "FunctionDeclaration":
                case "FunctionExpression":
                case "MethodDefinition":
                case "Script":
                case "Module":
                    return p;
            }
        }
        
        return null;
    },
    
    hasThisRef: function(node) {
    
        var hasThis = {};
        
        try { 
        
            visit(node);
        
        } catch (err) { 
        
            if (err === hasThis) return true; 
            else throw err;
        }
        
        return false;
        
        function visit(node) {
        
            if (node.type === "FunctionExpression" || 
                node.type === "FunctionDeclaration")
                return;
            
            if (node.type === "ThisExpression")
                throw hasThis;
            
            Parser.forEachChild(node, visit);
        }
    },
    
    moduleIdent: function(url) {
    
        url = url.trim();
        
        if (NODE_SCHEMA.test(url))
            url = url.replace(NODE_SCHEMA, "");
        else if (!HAS_SCHEMA.test(url) && url.charAt(0) !== "/")
            url = "./" + url;
        
        if (typeof this.imports[url] !== "string") {
        
            this.imports[url] = "_M" + (this.uid++);
            this.dependencies.push(url);
        }
        
        return this.imports[url];
    },
    
    stringify: function(node) {
        
        var offset = node.start,
            input = this.input,
            text = "";
        
        // Build text from child nodes
        Parser.forEachChild(node, (function(child) {
        
            if (offset < child.start)
                text += input.slice(offset, child.start);
            
            text += child.text;
            offset = child.end;
        }));
        
        if (offset < node.end)
            text += input.slice(offset, node.end);
        
        return text;
    },
    
    joinList: function(list) {
    
        var input = this.input,
            offset = -1, 
            text = "";
        
        list.forEach((function(child) {
        
            if (offset >= 0 && offset < child.start)
                text += input.slice(offset, child.start);
            
            text += child.text;
            offset = child.end;
        }));
        
        return text;
    }

}});

exports.Replacer = Replacer;
};

__modules[15] = function(exports) {
/*

Provides basic support for methods added in EcmaScript 5 for EcmaScript 4 browsers.
The intent is not to create 100% spec-compatible replacements, but to allow the use
of basic ES5 functionality with predictable results.  There are features in ES5 that
require an ES5 engine (freezing an object, for instance).  If you plan to write for 
legacy engines, then don't rely on those features.

*/

var global = this,
    OP = Object.prototype,
    HOP = OP.hasOwnProperty,
    slice = Array.prototype.slice,
    TRIM_S = /^\s+/,
    TRIM_E = /\s+$/,
    FALSE = function() { return false; },
    TRUE = function() { return true; },
    identity = function(o) { return o; },
    defGet = OP.__defineGetter__,
    defSet = OP.__defineSetter__,
    keys = Object.keys || es4Keys,
    ENUM_BUG = !function() { var o = { constructor: 1 }; for (var i in o) return i = true; }(),
    ENUM_BUG_KEYS = [ "toString", "toLocaleString", "valueOf", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "constructor" ],
    ERR_REDUCE = "Reduce of empty array with no initial value";

// Returns the internal class of an object
function getClass(o) {

    if (o === null || o === undefined) return "Object";
    return OP.toString.call(o).slice("[object ".length, -1);
}

// Returns an array of keys defined on the object
function es4Keys(o) {

    var a = [], i;
    
    for (i in o)
        if (HOP.call(o, i))
            a.push(i);
    
    if (ENUM_BUG) 
        for (i = 0; i < ENUM_BUG_KEYS.length; ++i)
            if (HOP.call(o, ENUM_BUG_KEYS[i]))
                a.push(ENUM_BUG_KEYS[i]);
    
    return a;
}

// Sets a collection of keys, if the property is not already set
function addKeys(o, p) {

    for (var i = 0, a = keys(p), k; i < a.length; ++i) {
    
        k = a[i];
        
        if (o[k] === undefined) 
            o[k] = p[k];
    }
    
    return o;
}

// Emulates an ES5 environment
function emulate() {

    // In IE8, defineProperty and getOwnPropertyDescriptor only work on DOM objects
    // and are therefore useless - so bury them.
    try { (Object.defineProperty || FALSE)({}, "-", { value: 0 }); }
    catch (x) { Object.defineProperty = undefined; };
    
    try { (Object.getOwnPropertyDescriptor || FALSE)({}, "-"); }
    catch (x) { Object.getOwnPropertyDescriptor = undefined; }
    
    // In IE < 9 [].slice does not work properly when the start or end arguments are undefined.
    try { [0].slice(0, undefined)[0][0]; }
    catch (x) {
    
        Array.prototype.slice = function(s, e) {
        
            s = s || 0;
            return (e === undefined ? slice.call(this, s) : slice.call(this, s, e));
        };
    }
    
    // ES5 Object functions
    addKeys(Object, {
    
        create: function(o, p) {
        
            var n;
            
            if (o === null) {
            
                n = { "__proto__": o };
            
            } else {
            
                var f = function() {};
                f.prototype = o;
                n = new f;
            }
            
            if (p !== undefined)
                Object.defineProperties(n, p);
            
            return n;
        },
        
        keys: keys,
        
        getOwnPropertyDescriptor: function(o, p) {
        
            if (!HOP.call(o, p))
                return undefined;
            
            return { 
                value: o[p], 
                writable: true, 
                configurable: true, 
                enumerable: OP.propertyIsEnumerable.call(o, p)
            };
        },
        
        defineProperty: function(o, n, p) {
        
            var msg = "Accessor properties are not supported.";
            
            if ("get" in p) {
            
                if (defGet) defGet(n, p.get);
                else throw new Error(msg);
            }
            
            if ("set" in p) {
            
                if (defSet) defSet(n, p.set);
                else throw new Error(msg);
            }
            
            if ("value" in p)
                o[n] = p.value;
            
            return o;
        },
        
        defineProperties: function(o, d) {
        
            Object.keys(d).forEach(function(k) { Object.defineProperty(o, k, d[k]); });
            return o;
        },
        
        getPrototypeOf: function(o) {
        
            var p = o.__proto__ || o.constructor.prototype;
            return p;
        },
        
        /*
        
        getOwnPropertyNames is buggy since there is no way to get non-enumerable 
        ES3 properties.
        
        */
        
        getOwnProperyNames: keys,
        
        freeze: identity,
        seal: identity,
        preventExtensions: identity,
        isFrozen: FALSE,
        isSealed: FALSE,
        isExtensible: TRUE
        
    });
    
    
    // Add ES5 String extras
    addKeys(String.prototype, {
    
        trim: function() { return this.replace(TRIM_S, "").replace(TRIM_E, ""); }
    });
    
    
    // Add ES5 Array extras
    addKeys(Array, {
    
        isArray: function(obj) { return getClass(obj) === "Array"; }
    });
    
    
    addKeys(Array.prototype, {
    
        indexOf: function(v, i) {
        
            var len = this.length >>> 0;
            
            i = i || 0;
            if (i < 0) i = Math.max(len + i, 0);
            
            for (; i < len; ++i)
                if (this[i] === v)
                    return i;
            
            return -1;
        },
        
        lastIndexOf: function(v, i) {
        
            var len = this.length >>> 0;
            
            i = Math.min(i || 0, len - 1);
            if (i < 0) i = len + i;
            
            for (; i >= 0; --i)
                if (this[i] === v)
                    return i;
            
            return -1;
        },
        
        every: function(fn, self) {
        
            var r = true;
            
            for (var i = 0, len = this.length >>> 0; i < len; ++i)
                if (i in this && !(r = fn.call(self, this[i], i, this)))
                    break;
            
            return !!r;
        },
        
        some: function(fn, self) {
        
            var r = false;
            
            for (var i = 0, len = this.length >>> 0; i < len; ++i)
                if (i in this && (r = fn.call(self, this[i], i, this)))
                    break;
            
            return !!r;
        },
        
        forEach: function(fn, self) {
        
            for (var i = 0, len = this.length >>> 0; i < len; ++i)
                if (i in this)
                    fn.call(self, this[i], i, this);
        },
        
        map: function(fn, self) {
        
            var a = [];
            
            for (var i = 0, len = this.length >>> 0; i < len; ++i)
                if (i in this)
                    a[i] = fn.call(self, this[i], i, this);
            
            return a;
        },
        
        filter: function(fn, self) {
        
            var a = [];
            
            for (var i = 0, len = this.length >>> 0; i < len; ++i)
                if (i in this && fn.call(self, this[i], i, this))
                    a.push(this[i]);
            
            return a;
        },
        
        reduce: function(fn) {
        
            var len = this.length >>> 0,
                i = 0, 
                some = false,
                ini = (arguments.length > 1),
                val = (ini ? arguments[1] : this[i++]);
            
            for (; i < len; ++i) {
            
                if (i in this) {
                
                    some = true;
                    val = fn(val, this[i], i, this);
                }
            }
            
            if (!some && !ini)
                throw new TypeError(ERR_REDUCE);
            
            return val;
        },
        
        reduceRight: function(fn) {
        
            var len = this.length >>> 0,
                i = len - 1,
                some = false,
                ini = (arguments.length > 1),
                val = (ini || i < 0  ? arguments[1] : this[i--]);
            
            for (; i >= 0; --i) {
            
                if (i in this) {
                
                    some = true;
                    val = fn(val, this[i], i, this);
                }
            }
            
            if (!some && !ini)
                throw new TypeError(ERR_REDUCE);
            
            return val;
        }
    });
    
    // Add ES5 Function extras
    addKeys(Function.prototype, {
    
        bind: function(self) {
        
            var f = this,
                args = slice.call(arguments, 1),
                noargs = (args.length === 0);
            
            bound.prototype = f.prototype;
            return bound;
            
            function bound() {
            
                return f.apply(
                    this instanceof bound ? this : self, 
                    noargs ? arguments : args.concat(slice.call(arguments, 0)));
            }
        }
    });
    
    // Add ES5 Date extras
    addKeys(Date, {
    
        now: function() { return (new Date()).getTime(); }
    });
    
    // Add ES5 Date extras
    addKeys(Date.prototype, {
    
        toISOString: function() {
        
            function pad(s) {
            
                if ((s = "" + s).length === 1) s = "0" + s;
                return s;
            }
            
            return this.getUTCFullYear() + "-" +
                pad(this.getUTCMonth() + 1, 2) + "-" +
                pad(this.getUTCDate(), 2) + "T" +
                pad(this.getUTCHours(), 2) + ":" +
                pad(this.getUTCMinutes(), 2) + ":" +
                pad(this.getUTCSeconds(), 2) + "Z";
        },
        
        toJSON: function() {
        
            return this.toISOString();
        }
    });
    
    // Add ISO support to Date.parse
    if (Date.parse(new Date(0).toISOString()) !== 0) !function() {
    
        /*
        
        In ES5 the Date constructor will also parse ISO dates, but overwritting 
        the Date function itself is too far.  Note that new Date(isoDateString)
        is not backward-compatible.  Use the following instead:
        
        new Date(Date.parse(dateString));
        
        1: +/- year
        2: month
        3: day
        4: hour
        5: minute
        6: second
        7: fraction
        8: +/- tz hour
        9: tz minute
        
        */
        
        var isoRE = /^(?:((?:[+-]\d{2})?\d{4})(?:-(\d{2})(?:-(\d{2}))?)?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{3})?)?)?(?:Z|([-+]\d{2}):(\d{2}))?$/,
            dateParse = Date.parse;
    
        Date.parse = function(s) {
        
            var t, m, hasDate, i, offset;
            
            if (!isNaN(t = dateParse(s)))
                return t;
            
            if (s && (m = isoRE.exec(s))) {
            
                hasDate = m[1] !== undefined;
                
                // Convert matches to numbers (month and day default to 1)
                for (i = 1; i <= 9; ++i)
                    m[i] = Number(m[i] || (i <= 3 ? 1 : 0));
                
                // Calculate ms directly if no date is provided
                if (!hasDate)
                    return ((m[4] * 60 + m[5]) * 60 + m[6]) * 1000 + m[7];
                
                // Convert month to zero-indexed
                m[2] -= 1;
                
                // Get TZ offset
                offset = (m[8] * 60 + m[9]) * 60 * 1000;
                
                // Remove full match from array
                m.shift();
                
                t = Date.UTC.apply(this, m) + offset;
            }
            
            return t;
        };
                
    }();
    
}

exports.addKeys = addKeys;
exports.emulate = emulate;
};

__modules[16] = function(exports) {
var _M0 = __init(17); Object.keys(_M0).forEach(function(k) { exports[k] = _M0[k]; });
};

__modules[17] = function(exports) {
var _M0 = __init(18), _M1 = __init(19), _M2 = __init(20); var Node = _M0;
var Parser = _M1.Parser;
var Scanner = _M2.Scanner;



function parseModule(input, options) {

    return new Parser(input, options).parseModule();
}

function parseScript(input, options) {

    return new Parser(input, options).parseScript();
}

function forEachChild(node, fn) {

    var keys = Object.keys(node), val, i, j;
    
    for (i = 0; i < keys.length; ++i) {
    
        if (keys[i] === "parentNode")
            continue;
            
        val = node[keys[i]];
        
        // Skip non-objects
        if (!val || typeof val !== "object") 
            continue;
        
        if (typeof val.type === "string") {
        
            // Nodes have a "type" property
            fn(val);
        
        } else {
        
            // Iterate arrays
            for (j = 0; j < (val.length >>> 0); ++j)
                if (val[j] && typeof val[j].type === "string")
                    fn(val[j]);
        }
    }
}


exports.Parser = Parser;
exports.Scanner = Scanner;
exports.Node = Node;
exports.parseModule = parseModule;
exports.parseScript = parseScript;
exports.forEachChild = forEachChild;
};

__modules[18] = function(exports) {

var Script = es6now.Class(function(__super) { return {

    constructor: function(statements, start, end) {
    
        this.type = "Script";
        this.statements = statements;
        this.start = start;
        this.end = end;
    }
}});

var Module = es6now.Class(function(__super) { return {

    constructor: function(statements, start, end) {
    
        this.type = "Module";
        this.statements = statements;
        this.start = start;
        this.end = end;
    }
}});

var Identifier = es6now.Class(function(__super) { return {

    constructor: function(value, context, start, end) {
    
        this.type = "Identifier";
        this.value = value;
        this.context = context;
        this.start = start;
        this.end = end;
    }
}});

var Number = es6now.Class(function(__super) { return {

    constructor: function(value, start, end) {
    
        this.type = "Number";
        this.value = value;
        this.start = start;
        this.end = end;
    }
}});

var String = es6now.Class(function(__super) { return {

    constructor: function(value, start, end) {
    
        this.type = "String";
        this.value = value;
        this.start = start;
        this.end = end;
    }
}});

var Template = es6now.Class(function(__super) { return {

    constructor: function(value, isEnd, start, end) {
    
        this.type = "Template";
        this.value = value;
        this.templateEnd = isEnd;
        this.start = start;
        this.end = end;
    }
}});

var RegularExpression = es6now.Class(function(__super) { return {

    constructor: function(value, flags, start, end) {
    
        this.type = "RegularExpression";
        this.value = value;
        this.flags = flags;
        this.start = start;
        this.end = end;
    }
}});

var Null = es6now.Class(function(__super) { return {

    constructor: function(start, end) {
    
        this.type = "Null";
        this.start = start;
        this.end = end;
    }
}});

var Boolean = es6now.Class(function(__super) { return {

    constructor: function(value, start, end) {
    
        this.type = "Boolean";
        this.value = value;
        this.start = start;
        this.end = end;
    }
}});

var ThisExpression = es6now.Class(function(__super) { return {

    constructor: function(start, end) {
    
        this.type = "ThisExpression";
        this.start = start;
        this.end = end;
    }
}});

var SuperExpression = es6now.Class(function(__super) { return {

    constructor: function(start, end) {
    
        this.type = "SuperExpression";
        this.start = start;
        this.end = end;
    }
}});

var SequenceExpression = es6now.Class(function(__super) { return {

    constructor: function(list, start, end) {
    
        this.type = "SequenceExpression";
        this.expressions = list;
        this.start = start;
        this.end = end;
    }
}});

var AssignmentExpression = es6now.Class(function(__super) { return {

    constructor: function(op, left, right, start, end) {
    
        this.type = "AssignmentExpression";
        this.operator = op;
        this.left = left;
        this.right = right;
        this.start = start;
        this.end = end;
    }
}});

var SpreadExpression = es6now.Class(function(__super) { return {

    constructor: function(expr, start, end) {
    
        this.type = "SpreadExpression";
        this.expression = expr;
        this.start = start;
        this.end = end;
    }
}});

var YieldExpression = es6now.Class(function(__super) { return {

    constructor: function(expr, delegate, start, end) {
    
        this.type = "YieldExpression";
        this.delegate = delegate;
        this.expression = expr;
        this.start = start;
        this.end = end;
    }
}});

var ConditionalExpression = es6now.Class(function(__super) { return {

    constructor: function(test, cons, alt, start, end) {
    
        this.type = "ConditionalExpression";
        this.test = test;
        this.consequent = cons;
        this.alternate = alt;
        this.start = start;
        this.end = end;
    }
}});

var BinaryExpression = es6now.Class(function(__super) { return {

    constructor: function(op, left, right, start, end) {
    
        this.type = "BinaryExpression";
        this.operator = op;
        this.left = left;
        this.right = right;
        this.start = start;
        this.end = end;
    }
}});

var UpdateExpression = es6now.Class(function(__super) { return {

    constructor: function(op, expr, prefix, start, end) {
    
        this.type = "UpdateExpression";
        this.operator = op;
        this.expression = expr;
        this.prefix = prefix;
        this.start = start;
        this.end = end;
    }
}});

var UnaryExpression = es6now.Class(function(__super) { return {

    constructor: function(op, expr, start, end) {
    
        this.type = "UnaryExpression";
        this.operator = op;
        this.expression = expr;
        this.start = start;
        this.end = end;
    }
}});

var MemberExpression = es6now.Class(function(__super) { return {

    constructor: function(obj, prop, computed, start, end) {
    
        this.type = "MemberExpression";
        this.object = obj;
        this.property = prop;
        this.computed = computed;
        this.start = start;
        this.end = end;
    }
}});

var CallExpression = es6now.Class(function(__super) { return {

    constructor: function(callee, args, start, end) {
    
        this.type = "CallExpression";
        this.callee = callee;
        this.arguments = args;
        this.start = start;
        this.end = end;
    }
}});

var TaggedTemplateExpression = es6now.Class(function(__super) { return {

    constructor: function(tag, template, start, end) {
    
        this.type = "TaggedTemplateExpression";
        this.tag = tag;
        this.template = template;
        this.start = start;
        this.end = end;
    }
}});

var NewExpression = es6now.Class(function(__super) { return {

    constructor: function(callee, args, start, end) {
    
        this.type = "NewExpression";
        this.callee = callee;
        this.arguments = args;
        this.start = start;
        this.end = end;
    }
}});

var ParenExpression = es6now.Class(function(__super) { return {
    
    constructor: function(expr, start, end) {
    
        this.type = "ParenExpression";
        this.expression = expr;
        this.start = start;
        this.end = end;
    }
}});

var ObjectExpression = es6now.Class(function(__super) { return {

    constructor: function(props, start, end) {
    
        this.type = "ObjectExpression";
        this.properties = props;
        this.start = start;
        this.end = end;
    }
}});

var PropertyDefinition = es6now.Class(function(__super) { return {

    constructor: function(name, expr, start, end) {
    
        this.type = "PropertyDefinition";
        this.name = name;
        this.expression = expr;
        this.start = start;
        this.end = end;
    }
}});

var CoveredPatternProperty = es6now.Class(function(__super) { return {

    constructor: function(name, pattern, init, start, end) {
    
        this.type = "CoveredPatternProperty";
        this.name = name;
        this.pattern = pattern;
        this.init = init;
        this.start = start;
        this.end = end;
    }
}});

var MethodDefinition = es6now.Class(function(__super) { return {

    constructor: function(modifier, name, params, body, start, end) {
    
        this.type = "MethodDefinition";
        this.modifier = modifier;
        this.name = name;
        this.params = params;
        this.body = body;
        this.start = start;
        this.end = end;
    }
}});

var ArrayExpression = es6now.Class(function(__super) { return {

    constructor: function(elements, start, end) {
    
        this.type = "ArrayExpression";
        this.elements = elements;
        this.start = start;
        this.end = end;
    }
}});

var ArrayComprehension = es6now.Class(function(__super) { return {

    constructor: function(qualifiers, expr, start, end) {
    
        this.type = "ArrayComprehension";
        this.qualifiers = qualifiers;
        this.expression = expr;
        this.start = start;
        this.end = end;
    }
}});

var GeneratorComprehension = es6now.Class(function(__super) { return {

    constructor: function(qualifiers, expr, start, end) {
    
        this.type = "GeneratorComprehension";
        this.qualifiers = qualifiers;
        this.expression = expr;
        this.start = start;
        this.end = end;
    }
}});

var ComprehensionFor = es6now.Class(function(__super) { return {

    constructor: function(left, right, start, end) {
    
        this.type = "ComprehensionFor";
        this.left = left;
        this.right = right;
        this.start = start;
        this.end = end;
    }
}});

var ComprehensionIf = es6now.Class(function(__super) { return {

    constructor: function(test, start, end) {
    
        this.type = "ComprehensionIf";
        this.test = test;
        this.start = start;
        this.end = end;
    }
}});

var TemplateExpression = es6now.Class(function(__super) { return {

    constructor: function(lits, subs, start, end) {
    
        this.type = "TemplateExpression";
        this.literals = lits;
        this.substitutions = subs;
        this.start = start;
        this.end = end;
    }
}});

var Block = es6now.Class(function(__super) { return {

    constructor: function(statements, start, end) {
    
        this.type = "Block";
        this.statements = statements;
        this.start = start;
        this.end = end;
    }
}});

var LabelledStatement = es6now.Class(function(__super) { return {

    constructor: function(label, statement, start, end) {
    
        this.type = "LabelledStatement";
        this.label = label;
        this.statement = statement;
        this.start = start;
        this.end = end;
    }
}});

var ExpressionStatement = es6now.Class(function(__super) { return {

    constructor: function(expr, start, end) {
    
        this.type = "ExpressionStatement";
        this.expression = expr;
        this.directive = null;
        this.start = start;
        this.end = end;
    }
}});

var EmptyStatement = es6now.Class(function(__super) { return {

    constructor: function(start, end) {
    
        this.type = "EmptyStatement";
        this.start = start;
        this.end = end;
    }
}});

var VariableDeclaration = es6now.Class(function(__super) { return {

    constructor: function(keyword, list, start, end) {
    
        this.type = "VariableDeclaration";
        this.keyword = keyword;
        this.declarations = list;
        this.start = start;
        this.end = end;
    }
}});

var VariableDeclarator = es6now.Class(function(__super) { return {

    constructor: function(pattern, init, start, end) {
    
        this.type = "VariableDeclarator";
        this.pattern = pattern;
        this.init = init;
        this.start = start;
        this.end = end;
    }
}});

var ReturnStatement = es6now.Class(function(__super) { return {

    constructor: function(arg, start, end) {
    
        this.type = "ReturnStatement";
        this.argument = arg;
        this.start = start;
        this.end = end;
    }
}});

var BreakStatement = es6now.Class(function(__super) { return {

    constructor: function(label, start, end) {
    
        this.type = "BreakStatement";
        this.start = start;
        this.end = end;
    }
}});

var ContinueStatement = es6now.Class(function(__super) { return {

    constructor: function(label, start, end) {
    
        this.type = "ContinueStatement";
        this.start = start;
        this.end = end;
    }
}});

var ThrowStatement = es6now.Class(function(__super) { return {

    constructor: function(expr, start, end) {
    
        this.type = "ThrowStatement";
        this.expression = expr;
        this.start = start;
        this.end = end;
    }
}});

var DebuggerStatement = es6now.Class(function(__super) { return {

    constructor: function(start, end) {
    
        this.type = "DebuggerStatement";
        this.start = start;
        this.end = end;
    }
}});

var IfStatement = es6now.Class(function(__super) { return {

    constructor: function(test, cons, alt, start, end) {
    
        this.type = "IfStatement";
        this.test = test;
        this.consequent = cons;
        this.alternate = alt;
        this.start = start;
        this.end = end;
    }
}});

var DoWhileStatement = es6now.Class(function(__super) { return {

    constructor: function(body, test, start, end) {
    
        this.type = "DoWhileStatement";
        this.body = body;
        this.test = test;
        this.start = start;
        this.end = end;
    }
}});

var WhileStatement = es6now.Class(function(__super) { return {

    constructor: function(test, body, start, end) {
    
        this.type = "WhileStatement";
        this.test = test;
        this.body = body;
        this.start = start;
        this.end = end;
    }
}});

var ForStatement = es6now.Class(function(__super) { return {

    constructor: function(init, test, update, body, start, end) {
    
        this.type = "ForStatement";
        this.init = init;
        this.test = test;
        this.update = update;
        this.body = body;
        this.start = start;
        this.end = end;
    }
}});

var ForInStatement = es6now.Class(function(__super) { return {

    constructor: function(left, right, body, start, end) {
    
        this.type = "ForInStatement";
        this.left = left;
        this.right = right;
        this.body = body;
        this.start = start;
        this.end = end;
    }
}});

var ForOfStatement = es6now.Class(function(__super) { return {

    constructor: function(left, right, body, start, end) {
    
        this.type = "ForOfStatement";
        this.left = left;
        this.right = right;
        this.body = body;
        this.start = start;
        this.end = end;
    }
}});

var WithStatement = es6now.Class(function(__super) { return {

    constructor: function(object, body, start, end) {
    
        this.type = "WithStatement";
        this.object = object;
        this.body = body;
        this.start = start;
        this.end = end;
    }
}});

var SwitchStatement = es6now.Class(function(__super) { return {

    constructor: function(desc, cases, start, end) {
    
        this.type = "SwitchStatement";
        this.descriminant = desc;
        this.cases = cases;
        this.start = start;
        this.end = end;
    }
}});

var SwitchCase = es6now.Class(function(__super) { return {

    constructor: function(test, cons, start, end) {
    
        this.type = "SwitchCase";
        this.test = test;
        this.consequent = cons;
        this.start = start;
        this.end = end;
    }
}});

var TryStatement = es6now.Class(function(__super) { return {

    constructor: function(block, handler, fin, start, end) {
    
        this.type = "TryStatement";
        this.block = block;
        this.handler = handler;
        this.finalizer = fin;
        this.start = start;
        this.end = end;
    }
}});

var CatchClause = es6now.Class(function(__super) { return {

    constructor: function(param, body, start, end) {
    
        this.type = "CatchClause";
        this.param = param;
        this.body = body;
        this.start = start;
        this.end = end;
    }
}});

var FunctionDeclaration = es6now.Class(function(__super) { return {

    constructor: function(gen, ident, params, body, start, end) {
    
        this.type = "FunctionDeclaration";
        this.generator = gen;
        this.ident = ident;
        this.params = params;
        this.body = body;
        this.start = start;
        this.end = end;
    }
}});

var FunctionExpression = es6now.Class(function(__super) { return {

    constructor: function(gen, ident, params, body, start, end) {
    
        this.type = "FunctionExpression";
        this.generator = gen;
        this.ident = ident;
        this.params = params;
        this.body = body;
        this.start = start;
        this.end = end;
    }
}});

var FormalParameter = es6now.Class(function(__super) { return {

    constructor: function(pattern, init, start, end) {
    
        this.type = "FormalParameter";
        this.pattern = pattern;
        this.init = init;
        this.start = start;
        this.end = end;
    }
}});

var RestParameter = es6now.Class(function(__super) { return {

    constructor: function(ident, start, end) {
    
        this.type = "RestParameter";
        this.ident = ident;
        this.start = start;
        this.end = end;
    }
}});

var FunctionBody = es6now.Class(function(__super) { return {

    constructor: function(statements, start, end) {
    
        this.type = "FunctionBody";
        this.statements = statements;
        this.start = start;
        this.end = end;
    }
}});

var ArrowFunction = es6now.Class(function(__super) { return {

    constructor: function(params, body, start, end) {
    
        this.type = "ArrowFunction";
        this.params = params;
        this.body = body;
        this.start = start;
        this.end = end;
    }
}});

var ModuleDeclaration = es6now.Class(function(__super) { return {

    constructor: function(ident, body, start, end) {
    
        this.type = "ModuleDeclaration";
        this.ident = ident;
        this.body = body;
        this.start = start;
        this.end = end;
    }
}});

var CoveredModuleHead = es6now.Class(function(__super) { return {

    constructor: function(first, second, start, end) {
    
        this.type = "CoveredModuleHead";
        this.first = first;
        this.second = second;
        this.start = start;
        this.end = end;
    }
}});

var ModuleBody = es6now.Class(function(__super) { return {

    constructor: function(statements, start, end) {
    
        this.type = "ModuleBody";
        this.statements = statements;
        this.start = start;
        this.end = end;
    }
}});

var ImportAsDeclaration = es6now.Class(function(__super) { return {

    constructor: function(from, ident, start, end) {
    
        this.type = "ImportAsDeclaration";
        this.from = from;
        this.ident = ident;
        this.start = start;
        this.end = end;
    }
}});

var ImportDeclaration = es6now.Class(function(__super) { return {

    constructor: function(specifiers, from, start, end) {
    
        this.type = "ImportDeclaration";
        this.specifiers = specifiers;
        this.from = from;
        this.start = start;
        this.end = end;
    }
}});

var ImportSpecifier = es6now.Class(function(__super) { return {

    constructor: function(remote, local, start, end) {
    
        this.type = "ImportSpecifier";
        this.remote = remote;
        this.local = local;
        this.start = start;
        this.end = end;
    }
}});

var ExportDeclaration = es6now.Class(function(__super) { return {

    constructor: function(binding, start, end) {
    
        this.type = "ExportDeclaration";
        this.binding = binding;
        this.start = start;
        this.end = end;
    }
}});

var ExportSpecifierSet = es6now.Class(function(__super) { return {

    constructor: function(list, from, start, end) {
    
        this.type = "ExportSpecifierSet";
        this.specifiers = list;
        this.from = from;
        this.start = start;
        this.end = end;
    }
}});

var ExportSpecifier = es6now.Class(function(__super) { return {

    constructor: function(local, remote, start, end) {
    
        this.type = "ExportSpecifier";
        this.local = local;
        this.remote = remote;
        this.start = start;
        this.end = end;
    }
}});

var ModulePath = es6now.Class(function(__super) { return {
    
    constructor: function(list, start, end) {
    
        this.type = "ModulePath";
        this.elements = list;
        this.start = start;
        this.end = end;
    }
}});

var ClassDeclaration = es6now.Class(function(__super) { return {

    constructor: function(ident, base, body, start, end) {
    
        this.type = "ClassDeclaration";
        this.ident = ident;
        this.base = base;
        this.body = body;
        this.start = start;
        this.end = end;
    }
}});

var ClassExpression = es6now.Class(function(__super) { return {

    constructor: function(ident, base, body, start, end) {
    
        this.type = "ClassExpression";
        this.ident = ident;
        this.base = base;
        this.body = body;
        this.start = start;
        this.end = end;
    }
}});

var ClassBody = es6now.Class(function(__super) { return {

    constructor: function(elems, start, end) {
    
        this.type = "ClassBody";
        this.elements = elems;
        this.start = start;
        this.end = end;
    }
}});

var ClassElement = es6now.Class(function(__super) { return {

    constructor: function(isStatic, method, start, end) {
    
        this.type = "ClassElement";
        this.static = isStatic;
        this.method = method;
        this.start = start;
        this.end = end;
    }
}});

exports.Script = Script;
exports.Module = Module;
exports.Identifier = Identifier;
exports.Number = Number;
exports.String = String;
exports.Template = Template;
exports.RegularExpression = RegularExpression;
exports.Null = Null;
exports.Boolean = Boolean;
exports.ThisExpression = ThisExpression;
exports.SuperExpression = SuperExpression;
exports.SequenceExpression = SequenceExpression;
exports.AssignmentExpression = AssignmentExpression;
exports.SpreadExpression = SpreadExpression;
exports.YieldExpression = YieldExpression;
exports.ConditionalExpression = ConditionalExpression;
exports.BinaryExpression = BinaryExpression;
exports.UpdateExpression = UpdateExpression;
exports.UnaryExpression = UnaryExpression;
exports.MemberExpression = MemberExpression;
exports.CallExpression = CallExpression;
exports.TaggedTemplateExpression = TaggedTemplateExpression;
exports.NewExpression = NewExpression;
exports.ParenExpression = ParenExpression;
exports.ObjectExpression = ObjectExpression;
exports.PropertyDefinition = PropertyDefinition;
exports.CoveredPatternProperty = CoveredPatternProperty;
exports.MethodDefinition = MethodDefinition;
exports.ArrayExpression = ArrayExpression;
exports.ArrayComprehension = ArrayComprehension;
exports.GeneratorComprehension = GeneratorComprehension;
exports.ComprehensionFor = ComprehensionFor;
exports.ComprehensionIf = ComprehensionIf;
exports.TemplateExpression = TemplateExpression;
exports.Block = Block;
exports.LabelledStatement = LabelledStatement;
exports.ExpressionStatement = ExpressionStatement;
exports.EmptyStatement = EmptyStatement;
exports.VariableDeclaration = VariableDeclaration;
exports.VariableDeclarator = VariableDeclarator;
exports.ReturnStatement = ReturnStatement;
exports.BreakStatement = BreakStatement;
exports.ContinueStatement = ContinueStatement;
exports.ThrowStatement = ThrowStatement;
exports.DebuggerStatement = DebuggerStatement;
exports.IfStatement = IfStatement;
exports.DoWhileStatement = DoWhileStatement;
exports.WhileStatement = WhileStatement;
exports.ForStatement = ForStatement;
exports.ForInStatement = ForInStatement;
exports.ForOfStatement = ForOfStatement;
exports.WithStatement = WithStatement;
exports.SwitchStatement = SwitchStatement;
exports.SwitchCase = SwitchCase;
exports.TryStatement = TryStatement;
exports.CatchClause = CatchClause;
exports.FunctionDeclaration = FunctionDeclaration;
exports.FunctionExpression = FunctionExpression;
exports.FormalParameter = FormalParameter;
exports.RestParameter = RestParameter;
exports.FunctionBody = FunctionBody;
exports.ArrowFunction = ArrowFunction;
exports.ModuleDeclaration = ModuleDeclaration;
exports.CoveredModuleHead = CoveredModuleHead;
exports.ModuleBody = ModuleBody;
exports.ImportAsDeclaration = ImportAsDeclaration;
exports.ImportDeclaration = ImportDeclaration;
exports.ImportSpecifier = ImportSpecifier;
exports.ExportDeclaration = ExportDeclaration;
exports.ExportSpecifierSet = ExportSpecifierSet;
exports.ExportSpecifier = ExportSpecifier;
exports.ModulePath = ModulePath;
exports.ClassDeclaration = ClassDeclaration;
exports.ClassExpression = ClassExpression;
exports.ClassBody = ClassBody;
exports.ClassElement = ClassElement;
};

__modules[19] = function(exports) {
var _M0 = __init(18), _M1 = __init(20), _M2 = __init(21), _M3 = __init(22); var Node = _M0;

var Scanner = _M1.Scanner;
var Transform = _M2.Transform;
var Validate = _M3.Validate;

// Object literal property name flags
var PROP_NORMAL = 1,
    PROP_ASSIGN = 2,
    PROP_GET = 4,
    PROP_SET = 8;

// Returns true if the specified operator is an increment operator
function isIncrement(op) {

    return op === "++" || op === "--";
}

// Returns a binary operator precedence level
function getPrecedence(op) {

    switch (op) {
    
        case "||": return 1;
        case "&&": return 2;
        case "|": return 3;
        case "^": return 4;
        case "&": return 5;
        case "==":
        case "!=":
        case "===":
        case "!==": return 6;
        case "<=":
        case ">=":
        case ">":
        case "<":
        case "instanceof":
        case "in": return 7;
        case ">>>":
        case ">>":
        case "<<": return 8;
        case "+":
        case "-": return 9;
        case "*":
        case "/":
        case "%": return 10;
    }
    
    return 0;
}

// Returns true if the specified operator is an assignment operator
function isAssignment(op) {

    if (op === "=")
        return true;
    
    switch (op) {
    
        case "*=": 
        case "&=": 
        case "^=": 
        case "|=": 
        case "<<=": 
        case ">>=": 
        case ">>>=": 
        case "%=": 
        case "+=": 
        case "-=": 
        case "/=":
            return true;
    }
    
    return false;
}

// Returns true if the specified operator is a unary operator
function isUnary(op) {
    
    switch (op) {
    
        case "delete":
        case "void": 
        case "typeof":
        case "!":
        case "~":
        case "+":
        case "-":
            return true;
    }
    
    return false;
}

var Parser = es6now.Class(function(__super) { return {

    constructor: function(input, offset) {

        var scanner = new Scanner(input, offset);
        
        this.scanner = scanner;
        this.token = new Scanner;
        this.input = input;
        
        this.peek0 = null;
        this.peek1 = null;
        this.endOffset = scanner.offset;
        
        this.contextStack = [];
        this.pushContext(false);
    },

    get startOffset() {
    
        return this.peekToken().start;
    },
    
    parseScript: function() { 
    
        return this.Script();
    },
    
    parseModule: function() {
    
        return this.Module();
    },
    
    nextToken: function(context) {
    
        var scanner = this.scanner,
            type = null;
        
        while (!type || type === "COMMENT")
            type = scanner.next(context);
        
        return scanner;
    },
    
    readToken: function(type, context) {
    
        var token = this.peek0 || this.nextToken(context);
        
        this.peek0 = this.peek1;
        this.peek1 = null;
        this.endOffset = token.end;
        
        if (type && token.type !== type)
            this.fail("Unexpected token " + token.type, token);
        
        return token;
    },
    
    read: function(type, context) {
    
        return this.readToken(type, context).type;
    },
    
    peekToken: function(context, index) {
    
        if (index === 0 || index === void 0) {
        
            return this.peek0 || (this.peek0 = this.nextToken(context));
        
        } else if (index === 1) {
        
            if (this.peek1) {
            
                return this.peek1;
            
            } else if (this.peek0) {
            
                // Copy scanner state to token (inlined for performance)
                var tok = this.token, 
                    scanner = this.scanner;
        
                tok.type = scanner.type;
                tok.value = scanner.value;
                tok.number = scanner.number;
                tok.newlineBefore = scanner.newlineBefore;
                tok.start = scanner.start;
                tok.end = scanner.end;
                tok.regExpFlags = scanner.regExpFlags;
                tok.templateEnd = scanner.templateEnd;
                tok.flags = scanner.flags;
                
                this.peek0 = tok;
                return this.peek1 = this.nextToken(context);
            }
        }
        
        throw new Error("Invalid lookahead");
    },
    
    peek: function(context, index) {
    
        return this.peekToken(context, index).type;
    },
    
    unpeek: function() {
    
        if (this.peek0) {
        
            this.scanner.offset = this.peek0.start;
            this.peek0 = null;
            this.peek1 = null;
        }
    },
    
    peekUntil: function(type, context) {
    
        var tok = this.peek(context);
        return tok !== "EOF" && tok !== type ? tok : null;
    },
    
    formatErrorMessage: function(msg, pos) {
    
        return "" + (msg) + " (line " + (pos.line) + ":" + (pos.column) + ")";
    },
    
    fail: function(msg, loc) {
    
        var pos = this.scanner.position(loc || this.peek0),
            err = new SyntaxError(this.formatErrorMessage(msg, pos));
        
        throw err;
    },
    
    readKeyword: function(word) {
    
        var token = this.readToken();
        
        if (token.type === word || token.type === "IDENTIFIER" && token.value === word)
            return token;
        
        this.fail("Unexpected token " + token.type, token);
    },
    
    peekKeyword: function(word) {
    
        var token = this.peekToken();
        return token.type === word || token.type === "IDENTIFIER" && token.value === word;
    },
    
    // Context management
    pushContext: function(isFunction, isStrict) {
    
        this.context = { 
            
            strict: isStrict || (this.context ? this.context.strict : false),
            isFunction: isFunction,
            labelSet: {},
            switchDepth: 0,
            invalidNodes: null
        };
        
        this.contextStack.push(this.context);
        this.scanner.strict = this.context.strict;
    },
    
    popContext: function() {
    
        this.contextStack.pop();
        this.context = this.contextStack[this.contextStack.length - 1];
        this.scanner.strict = this.context ? this.context.strict : false;
    },
    
    setStrict: function() {
    
        this.context.strict = true;
        this.scanner.strict = true;
    },
    
    maybeEnd: function() {
    
        var token = this.peekToken();
        
        if (!token.newlineBefore) {
            
            switch (token.type) {
            
                case "EOF":
                case "}":
                case ";":
                    break;
                
                default:
                    return true;
            }
        }
        
        return false;
    },
    
    peekModule: function(predict) {
    
        var isModule = false;
        
        if (this.peekToken().value === "module") {
        
            var p = this.peekToken("div", 1),
                offset;
            
            // If a module identifier follows...
            if (!p.newlineBefore && p.type === "IDENTIFIER") {
            
                if (predict) {
                
                    // Scan for "{" token
                    offset = this.readToken().start;
                    isModule = (this.peek(null, 1) === "{");
                
                    // Restore scanner position
                    this.unpeek();
                    this.scanner.offset = offset;
                    
                } else {
                
                    isModule = true;
                }
            }
        }
        
        return isModule;
    },
    
    addInvalidNode: function(node, error) {
    
        var context = this.context,
            list = context.invalidNodes;
        
        node.error = error;
        
        if (!list) context.invalidNodes = [node];
        else list.push(node);
    },
    
    // === Top Level ===
    
    Script: function() {
    
        var start = this.startOffset;
        
        return new Node.Script(this.StatementList(true, false), start, this.endOffset);
    },
    
    Module: function() {
    
        var start = this.startOffset;
        
        // Modules are always strict
        this.setStrict();
        
        return new Node.Module(this.StatementList(true, true), start, this.endOffset);
    },
    
    // === Expressions ===
    
    Expression: function(noIn) {
    
        var start = this.startOffset,
            expr = this.AssignmentExpression(noIn),
            list = null;
            
        while (this.peek("div") === ",") {
        
            // If the next token after "," is "...", we might be
            // trying to parse an arrow function formal parameter
            // list with a trailing rest parameter.  Return the 
            // expression up to, but not including ",".
            
            if (this.peek(null, 1) === "...")
                break;
            
            this.read();
            
            if (list === null)
                expr = new Node.SequenceExpression(list = [expr], start, -1);
            
            list.push(this.AssignmentExpression(noIn));
        }
        
        if (list)
            expr.end = this.endOffset;
        
        return expr;
    },
    
    AssignmentExpression: function(noIn) {
    
        var start = this.startOffset,
            left,
            lhs;
        
        if (this.peek() === "yield")
            return this.YieldExpression();
        
        left = this.ConditionalExpression(noIn);
        
        // Check for assignment operator
        if (!isAssignment(this.peek("div")))
            return left;
        
        // Binding forms can be contained within parens
        for (lhs = left; lhs.type === "ParenExpression"; lhs = lhs.expression);
        
        // Make sure that left hand side is assignable
        switch (lhs.type) {
        
            case "MemberExpression":
            case "CallExpression":
                break;
                
            case "Identifier":
                this.checkAssignTarget(lhs);
                break;
        
            default:
                this.transformPattern(lhs, false);
                break;
        }
        
        return new Node.AssignmentExpression(
            this.read(),
            left,
            this.AssignmentExpression(noIn),
            start,
            this.endOffset);
    },
    
    SpreadAssignment: function(noIn) {
    
        if (this.peek() === "...") {
        
            var start = this.startOffset;
            
            this.read();
            
            return new Node.SpreadExpression(
                this.AssignmentExpression(noIn), 
                start, 
                this.endOffset);
        }
        
        return this.AssignmentExpression(noIn);
    },
    
    YieldExpression: function() {
    
        var start = this.startOffset,
            delegate = false;
            
        this.read("yield");
        
        if (this.peek() === "*") {
        
            this.read();
            delegate = true;
        }
        
        return new Node.YieldExpression(
            this.AssignmentExpression(), 
            delegate, 
            start, 
            this.endOffset);
    },
    
    ConditionalExpression: function(noIn) {
    
        var start = this.startOffset,
            left = this.BinaryExpression(noIn),
            middle,
            right;
        
        if (this.peek("div") !== "?")
            return left;
        
        this.read("?");
        middle = this.AssignmentExpression();
        this.read(":");
        right = this.AssignmentExpression(noIn);
        
        return new Node.ConditionalExpression(left, middle, right, start, this.endOffset);
    },
    
    BinaryExpression: function(noIn) {
    
        return this.PartialBinaryExpression(this.UnaryExpression(), 0, noIn);
    },
    
    PartialBinaryExpression: function(lhs, minPrec, noIn) {
    
        var prec,
            next, 
            max, 
            rhs,
            op;
        
        while (next = this.peek("div")) {
            
            // Exit if operator is "in" and in is not allowed
            if (next === "in" && noIn)
                break;
            
            prec = getPrecedence(next);
            
            // Exit if not a binary operator or lower precendence
            if (prec === 0 || prec < minPrec)
                break;
            
            this.read();
            
            op = next;
            max = prec;
            rhs = this.UnaryExpression();
            
            while (next = this.peek("div")) {
            
                prec = getPrecedence(next);
                
                // Exit if not a binary operator or equal or higher precendence
                if (prec === 0 || prec <= max)
                    break;
                
                rhs = this.PartialBinaryExpression(rhs, prec, noIn);
            }
            
            lhs = new Node.BinaryExpression(op, lhs, rhs, lhs.start, rhs.end);
        }
        
        return lhs;
    },
    
    UnaryExpression: function() {
    
        var start = this.startOffset,
            type = this.peek(),
            token,
            expr;
        
        if (isIncrement(type)) {
        
            this.read();
            expr = this.MemberExpression(true);
            this.checkAssignTarget(expr);
            
            return new Node.UpdateExpression(type, expr, true, start, this.endOffset);
        }
        
        if (isUnary(type)) {
        
            this.read();
            expr = this.UnaryExpression();
            
            if (type === "delete" && this.context.strict && expr.type === "Identifier")
                this.fail("Cannot delete unqualified property in strict mode", expr);
            
            return new Node.UnaryExpression(type, expr, start, this.endOffset);
        }
        
        expr = this.MemberExpression(true);
        token = this.peekToken("div");
        type = token.type;
        
        // Check for postfix operator
        if (isIncrement(type) && !token.newlineBefore) {
        
            this.read();
            this.checkAssignTarget(expr);
            
            return new Node.UpdateExpression(type, expr, false, start, this.endOffset);
        }
        
        return expr;
    },
    
    MemberExpression: function(allowCall) {
    
        var start = this.startOffset,
            type = this.peek(),
            exit = false,
            prop,
            expr;
        
        expr = 
            type === "new" ? this.NewExpression() :
            type === "super" ? this.SuperExpression() :
            this.PrimaryExpression();
        
        while (!exit && (type = this.peek("div"))) {
        
            switch (type) {
            
                case ".":
                
                    this.read();
                    
                    expr = new Node.MemberExpression(
                        expr, 
                        this.IdentifierName(), 
                        false, 
                        start, 
                        this.endOffset);
                    
                    break;
                
                case "[":
                
                    this.read();
                    prop = this.Expression();
                    this.read("]");
                    
                    expr = new Node.MemberExpression(
                        expr, 
                        prop, 
                        true, 
                        start, 
                        this.endOffset);
        
                    break;
                
                case "(":
                    
                    if (!allowCall) {
                    
                        exit = true;
                        break;
                    }
                    
                    expr = new Node.CallExpression(
                        expr, 
                        this.ArgumentList(), 
                        start, 
                        this.endOffset);
                    
                    break;
                
                case "TEMPLATE":
                
                    expr = new Node.TaggedTemplateExpression(
                        expr,
                        this.TemplateExpression(),
                        start,
                        this.endOffset);
                    
                    break;
                
                default:
                
                    if (expr.type === "SuperExpression")
                        this.fail("Invalid super expression", expr);
                    
                    exit = true;
                    break;
            }
        }
        
        return expr;
    },
    
    NewExpression: function() {
    
        var start = this.startOffset;
        
        this.read("new");
        
        var expr = this.MemberExpression(false),
            args = this.peek("div") === "(" ? this.ArgumentList() : null;
        
        return new Node.NewExpression(expr, args, start, this.endOffset);
    },
    
    SuperExpression: function() {
    
        var start = this.startOffset;
        this.read("super");
        
        return new Node.SuperExpression(start, this.endOffset);
    },
    
    ArgumentList: function() {
    
        var list = [];
        
        this.read("(");
        
        while (this.peekUntil(")")) {
        
            if (list.length > 0)
                this.read(",");
            
            list.push(this.SpreadAssignment());
        }
        
        this.read(")");
        
        return list;
    },
    
    PrimaryExpression: function() {
    
        var tok = this.peekToken(),
            type = tok.type,
            start = tok.start;
        
        switch (type) {
            
            case "function": return this.FunctionExpression();
            case "class": return this.ClassExpression();
            case "TEMPLATE": return this.TemplateExpression();
            case "NUMBER": return this.Number();
            case "STRING": return this.String();
            case "{": return this.ObjectExpression();
            
            case "(": return this.peek(null, 1) === "for" ? 
                this.GeneratorComprehension() :
                this.ParenExpression();
            
            case "[": return this.peek(null, 1) === "for" ?
                this.ArrayComprehension() :
                this.ArrayExpression();
            
            case "IDENTIFIER":
            
                return this.peek("div", 1) === "=>" ?
                    this.ArrowFunction(this.BindingIdentifier(), null, start) :
                    this.Identifier(true);
            
            case "REGEX":
                this.read();
                return new Node.RegularExpression(tok.value, tok.regExpFlags, tok.start, tok.end);
            
            case "null":
                this.read();
                return new Node.Null(tok.start, tok.end);
            
            case "true":
            case "false":
                this.read();
                return new Node.Boolean(type === "true", tok.start, tok.end);
            
            case "this":
                this.read();
                return new Node.ThisExpression(tok.start, tok.end);
        }
        
        this.fail("Unexpected token " + type);
    },
    
    Identifier: function(isVar) {
    
        var token = this.readToken("IDENTIFIER"),
            context = isVar ? "variable" : "";
        
        return new Node.Identifier(token.value, context, token.start, token.end);
    },
    
    IdentifierName: function() {
    
        var token = this.readToken("IDENTIFIER", "name");
        return new Node.Identifier(token.value, "", token.start, token.end);
    },
    
    String: function() {
    
        var token = this.readToken("STRING");
        return new Node.String(token.value, token.start, token.end);
    },
    
    Number: function() {
    
        var token = this.readToken("NUMBER");
        return new Node.Number(token.number, token.start, token.end);
    },
    
    Template: function() {
    
        var token = this.readToken("TEMPLATE", "template");
        return new Node.Template(token.value, token.templateEnd, token.start, token.end);
    },
    
    BindingIdentifier: function() {
    
        var node = this.Identifier();
        
        this.checkBindingIdent(node);
        return node;
    },
    
    BindingPattern: function() {
    
        var node;
        
        switch (this.peek()) { 
        
            case "{":
                node = this.ObjectExpression();
                break;
            
            case "[":
                node = this.ArrayExpression();
                break;
            
            default:
                node = this.BindingIdentifier();
                break;
        }
        
        // Transform expressions to patterns
        if (node.type !== "Identifier")
            this.transformPattern(node, true);
        
        return node;
    },
    
    ParenExpression: function() {

        var start = this.startOffset,
            expr = null,
            rest = null;
        
        this.read("(");
        
        switch (this.peek()) {
        
            // An empty arrow function formal list
            case ")":
                break;
            
            // An arrow function formal list with a single rest parameter
            case "...":
                rest = this.RestParameter();
                break;
            
            // Paren expression
            default:
                expr = this.Expression();
                break;
        }
        
        // Look for a trailing rest formal parameter within an arrow formal list
        if (!rest && this.peek() === "," && this.peek(null, 1) === "...") {
        
            this.read();
            rest = this.RestParameter();
        }
        
        this.read(")");
        
        // Determine whether this is a paren expression or an arrow function
        if (expr === null || rest !== null || this.peek("div") === "=>")
            return this.ArrowFunction(expr, rest, start);
        
        return new Node.ParenExpression(expr, start, this.endOffset);
    },
    
    ObjectExpression: function() {
    
        var start = this.startOffset,
            list = [],
            nameSet = {};
        
        this.read("{");
        
        while (this.peekUntil("}", "name")) {
        
            if (list.length > 0)
                this.read(",");
            
            if (this.peek("name") !== "}")
                list.push(this.PropertyDefinition(nameSet));
        }
        
        this.read("}");
        
        return new Node.ObjectExpression(list, start, this.endOffset);
    },
    
    PropertyDefinition: function(nameSet) {
        
        var start = this.startOffset,
            flag = PROP_NORMAL, 
            node,
            name;
        
        switch (this.peek("name", 1)) {
        
            case "IDENTIFIER":
            case "STRING":
            case "NUMBER":
                
                node = this.MethodDefinition();
                
                switch (node.modifier) {
                
                    case "get": flag = PROP_GET; break;
                    case "set": flag = PROP_SET; break;
                }
                
                break;
            
            case "(":
            
                node = this.MethodDefinition();
                break;
            
            case ":":
                
                flag = PROP_ASSIGN;
                
                node = new Node.PropertyDefinition(
                    this.PropertyName(),
                    (this.read(), this.AssignmentExpression()),
                    start,
                    this.endOffset);
                
                break;
            
            case "=":
            
                this.unpeek();
                
                node = new Node.CoveredPatternProperty(
                    this.Identifier(),
                    null,
                    (this.read(), this.AssignmentExpression()),
                    start,
                    this.endOffset);
                
                this.addInvalidNode(node, "Invalid property definition in object literal");
                
                break;
                
            default:
            
                // Re-read token as an identifier
                this.unpeek();
            
                node = new Node.PropertyDefinition(
                    this.Identifier(),
                    null,
                    start,
                    this.endOffset);
                
                break;
        }
        
        // Check for duplicate names
        if (this.isDuplicateName(flag, nameSet[name = "." + node.name.value]))
            this.addInvalidNode(node, "Duplicate property names in object literal");
        
        // Set name flag
        nameSet[name] |= flag;
        
        return node;
    },
    
    PropertyName: function() {
    
        var type = this.peek("name");
        
        switch (type) {
        
            case "IDENTIFIER": return this.Identifier();
            case "STRING": return this.String();
            case "NUMBER": return this.Number();
        }
        
        this.fail("Unexpected token " + type);
    },
    
    MethodDefinition: function() {
    
        var start = this.startOffset,
            modifier = null,
            params,
            name;
        
        if (this.peek("name") === "*") {
        
            this.read();
            
            modifier = "*";
            name = this.PropertyName();
        
        } else {
        
            name = this.PropertyName();
            
            if (name.type === "Identifier" && 
                this.peek("name") !== "(" &&
                (name.value === "get" || name.value === "set")) {
            
                modifier = name.value;
                name = this.PropertyName();
            }
        }
        
        return new Node.MethodDefinition(
            modifier,
            name,
            params = this.FormalParameters(),
            this.FunctionBody(null, params, false),
            start,
            this.endOffset);
    },
    
    ArrayExpression: function() {
    
        var start = this.startOffset,
            list = [],
            comma = false,
            next,
            type;
        
        this.read("[");
        
        while (type = this.peekUntil("]")) {
            
            if (type === ",") {
            
                this.read();
                
                if (comma)
                    list.push(null);
                
                comma = true;
            
            } else {
            
                list.push(next = this.SpreadAssignment());
                comma = false;
            }
        }
        
        this.read("]");
        
        return new Node.ArrayExpression(list, start, this.endOffset);
    },
    
    ArrayComprehension: function() {
    
        var start = this.startOffset;
        
        this.read("[");
        
        var list = this.ComprehensionQualifierList(),
            expr = this.AssignmentExpression();
        
        this.read("]");
        
        return new Node.ArrayComprehension(list, expr, start, this.endOffset);
    },
    
    GeneratorComprehension: function() {
    
        var start = this.startOffset;
        
        this.read("(");
        
        var list = this.ComprehensionQualifierList(),
            expr = this.AssignmentExpression();
        
        this.read(")");
        
        return new Node.GeneratorComprehension(list, expr, start, this.endOffset);
    },
    
    ComprehensionQualifierList: function() {
    
        var list = [],
            done = false;
        
        list.push(this.ComprehensionFor());
        
        while (!done) {
        
            switch (this.peek()) {
            
                case "for": list.push(this.ComprehensionFor()); break;
                case "if": list.push(this.ComprehensionIf()); break;
                default: done = true; break;
            }
        }
        
        return list;
    },
    
    ComprehensionFor: function() {
    
        var start = this.startOffset;
        
        this.read("for");
        
        return new Node.ComprehensionFor(
            this.BindingPattern(),
            (this.readKeyword("of"), this.AssignmentExpression()),
            start,
            this.endOffset);
    },
    
    ComprehensionIf: function() {
    
        var start = this.startOffset,
            test;
            
        this.read("if");
        
        this.read("(");
        test = this.AssignmentExpression();
        this.read(")");
        
        return new Node.ComprehensionIf(test, start, this.endOffset);
    },
    
    TemplateExpression: function() {
        
        var atom = this.Template(),
            start = atom.start,
            lit = [ atom ],
            sub = [];
        
        while (!atom.templateEnd) {
        
            sub.push(this.Expression());
            
            // Discard any tokens that have been scanned using a different context
            this.unpeek();
            
            lit.push(atom = this.Template());
        }
        
        return new Node.TemplateExpression(lit, sub, start, this.endOffset);
    },
    
    // === Statements ===
    
    Statement: function() {
    
        switch (this.peek()) {
            
            case "IDENTIFIER":
            
                return this.peek("div", 1) === ":" ?
                    this.LabelledStatement() :
                    this.ExpressionStatement();
            
            case "{": return this.Block();
            case ";": return this.EmptyStatement();
            case "var": return this.VariableStatement();
            case "return": return this.ReturnStatement();
            case "break":
            case "continue": return this.BreakOrContinueStatement();
            case "throw": return this.ThrowStatement();
            case "debugger": return this.DebuggerStatement();
            case "if": return this.IfStatement();
            case "do": return this.DoWhileStatement();
            case "while": return this.WhileStatement();
            case "for": return this.ForStatement();
            case "with": return this.WithStatement();
            case "switch": return this.SwitchStatement();
            case "try": return this.TryStatement();
            
            default: return this.ExpressionStatement();
        }
    },
    
    StatementWithLabel: function(label) {
    
        var name = label && label.value || "",
            labelSet = this.context.labelSet,
            stmt;
        
        if (!labelSet[name]) labelSet[name] = 1;
        else if (label) this.fail("Invalid label", label);
        
        labelSet[name] += 1;
        stmt = this.Statement();
        labelSet[name] -= 1;
        
        return stmt;
    },
    
    Block: function() {
        
        var start = this.startOffset;
        
        this.read("{");
        var list = this.StatementList(false);
        this.read("}");
        
        return new Node.Block(list, start, this.endOffset);
    },
    
    Semicolon: function() {
    
        var token = this.peekToken(),
            type = token.type;
        
        if (type === ";" || !(type === "}" || type === "EOF" || token.newlineBefore))
            this.read(";");
    },
    
    LabelledStatement: function() {
    
        var start = this.startOffset,
            label = this.Identifier();
        
        this.read(":");
        
        return new Node.LabelledStatement(
            label, 
            this.StatementWithLabel(label),
            start,
            this.endOffset);
    },
    
    ExpressionStatement: function() {
    
        var start = this.startOffset,
            expr = this.Expression();
        
        this.Semicolon();
        
        return new Node.ExpressionStatement(expr, start, this.endOffset);
    },
    
    EmptyStatement: function() {
    
        var start = this.startOffset;
        
        this.Semicolon();
        
        return new Node.EmptyStatement(start, this.endOffset);
    },
    
    VariableStatement: function() {
    
        var node = this.VariableDeclaration(false);
        
        this.Semicolon();
        node.end = this.endOffset;
        
        return node;
    },
    
    VariableDeclaration: function(noIn) {
    
        var start = this.startOffset,
            keyword = this.peek(),
            isConst = false,
            list = [];
        
        switch (keyword) {
        
            case "var":
                break;
            
            case "const":
                isConst = true;
            
            case "let":
                break;
                
            default:
                this.fail("Expected var, const, or let");
        }
        
        this.read();
        
        while (true) {
        
            list.push(this.VariableDeclarator(noIn, isConst));
            
            if (this.peek() === ",") this.read();
            else break;
        }
        
        return new Node.VariableDeclaration(keyword, list, start, this.endOffset);
    },
    
    VariableDeclarator: function(noIn, isConst) {
    
        var start = this.startOffset,
            pattern = this.BindingPattern(),
            init = null;
        
        if (pattern.type !== "Identifier" || this.peek() === "=") {
        
            this.read("=");
            init = this.AssignmentExpression(noIn);
            
        } else if (isConst) {
        
            this.fail("Missing const initializer", pattern);
        }
        
        return new Node.VariableDeclarator(pattern, init, start, this.endOffset);
    },
    
    ReturnStatement: function() {
    
        if (!this.context.isFunction)
            this.fail("Return statement outside of function");
        
        var start = this.startOffset;
        
        this.read("return");
        var value = this.maybeEnd() ? this.Expression() : null;
        
        this.Semicolon();
        
        return new Node.ReturnStatement(value, start, this.endOffset);
    },
    
    BreakOrContinueStatement: function() {
    
        var start = this.startOffset,
            token = this.readToken(),
            keyword = token.type,
            labelSet = this.context.labelSet,
            label;
        
        label = this.maybeEnd() ? this.Identifier() : null;
        
        this.Semicolon();
        
        if (label) {
        
            if (!labelSet[label.value])
                this.fail("Invalid label", label);
        
        } else {
        
            // TODO: token may be mutated!
            if (!labelSet[""] && !(keyword === "break" && this.context.switchDepth > 0))
                this.fail("Invalid " + keyword + " statement", token);
        }
        
        return keyword === "break" ?
            new Node.BreakStatement(label, start, this.endOffset) :
            new Node.ContinueStatement(label, start, this.endOffset);
    },
    
    ThrowStatement: function() {
    
        var start = this.startOffset;
        
        this.read("throw");
        
        var expr = this.maybeEnd() ? this.Expression() : null;
        
        if (expr === null)
            this.fail("Missing throw expression");
        
        this.Semicolon();
        
        return new Node.ThrowStatement(expr, start, this.endOffset);
    },
    
    DebuggerStatement: function() {
    
        var start = this.startOffset;
        
        this.read("debugger");
        this.Semicolon();
        
        return new Node.DebuggerStatement(start, this.endOffset);
    },
    
    IfStatement: function() {
    
        var start = this.startOffset;
        
        this.read("if");
        this.read("(");
        
        var test = this.Expression(),
            body = null,
            elseBody = null;
        
        this.read(")");
        body = this.Statement();
        
        if (this.peek() === "else") {
        
            this.read();
            elseBody = this.Statement();
        }
        
        return new Node.IfStatement(test, body, elseBody, start, this.endOffset);
    },
    
    DoWhileStatement: function() {
    
        var start = this.startOffset,
            body, 
            test;
        
        this.read("do");
        body = this.StatementWithLabel();
        
        this.read("while");
        this.read("(");
        
        test = this.Expression();
        
        this.read(")");
        
        return new Node.DoWhileStatement(body, test, start, this.endOffset);
    },
    
    WhileStatement: function() {
    
        var start = this.startOffset;
        
        this.read("while");
        this.read("(");
        
        return new Node.WhileStatement(
            this.Expression(), 
            (this.read(")"), this.StatementWithLabel()), 
            start, 
            this.endOffset);
    },
    
    ForStatement: function() {
    
        var start = this.startOffset,
            init = null,
            test,
            step;
        
        this.read("for");
        this.read("(");
        
        // Get loop initializer
        switch (this.peek()) {
        
            case ";":
                break;
                
            case "var":
            case "let":
            case "const":
                init = this.VariableDeclaration(true);
                break;
            
            default:
                init = this.Expression(true);
                break;
        }
        
        if (init) {
        
            if (this.peekKeyword("in"))
                return this.ForInStatement(init, start);
        
            if (this.peekKeyword("of"))
                return this.ForOfStatement(init, start);
        }
        
        this.read(";");
        test = this.peek() === ";" ? null : this.Expression();
        
        this.read(";");
        step = this.peek() === ")" ? null : this.Expression();
        
        this.read(")");
        
        return new Node.ForStatement(
            init, 
            test, 
            step, 
            this.StatementWithLabel(), 
            start, 
            this.endOffset);
    },
    
    ForInStatement: function(init, start) {
    
        this.checkForInit(init, "in");
        
        this.read("in");
        var expr = this.Expression();
        this.read(")");
        
        return new Node.ForInStatement(
            init, 
            expr, 
            this.StatementWithLabel(), 
            start, 
            this.endOffset);
    },
    
    ForOfStatement: function(init, start) {
    
        this.checkForInit(init, "of");
        
        this.readKeyword("of");
        var expr = this.AssignmentExpression();
        this.read(")");
        
        return new Node.ForOfStatement(
            init, 
            expr, 
            this.StatementWithLabel(), 
            start, 
            this.endOffset);
    },
    
    WithStatement: function() {
    
        if (this.context.strict)
            this.fail("With statement is not allowed in strict mode");
    
        var start = this.startOffset;
        
        this.read("with");
        this.read("(");
        
        return new Node.WithStatement(
            this.Expression(), 
            (this.read(")"), this.Statement()),
            start,
            this.endOffset);
    },
    
    SwitchStatement: function() {
    
        var start = this.startOffset;
        
        this.read("switch");
        this.read("(");
        
        var head = this.Expression(),
            hasDefault = false,
            cases = [],
            node;
        
        this.read(")");
        this.read("{");
        this.context.switchDepth += 1;
        
        while (this.peekUntil("}")) {
        
            node = this.SwitchCase();
            
            if (node.test === null) {
            
                if (hasDefault)
                    this.fail("Switch statement cannot have more than one default");
                
                hasDefault = true;
            }
            
            cases.push(node);
        }
        
        this.context.switchDepth -= 1;
        this.read("}");
        
        return new Node.SwitchStatement(head, cases, start, this.endOffset);
    },
    
    SwitchCase: function() {
    
        var start = this.startOffset,
            expr = null, 
            list = [],
            type;
        
        if (this.peek() === "default") {
        
            this.read();
        
        } else {
        
            this.read("case");
            expr = this.Expression();
        }
        
        this.read(":");
        
        while (type = this.peekUntil("}")) {
        
            if (type === "case" || type === "default")
                break;
            
            list.push(this.Statement());
        }
        
        return new Node.SwitchCase(expr, list, start, this.endOffset);
    },
    
    TryStatement: function() {
    
        var start = this.startOffset;
        
        this.read("try");
        
        var tryBlock = this.Block(),
            handler = null,
            fin = null;
        
        if (this.peek() === "catch")
            handler = this.CatchClause();
        
        if (this.peek() === "finally") {
        
            this.read("finally");
            fin = this.Block();
        }
        
        return new Node.TryStatement(tryBlock, handler, fin, start, this.endOffset);
    },
    
    CatchClause: function() {
    
        var start = this.startOffset;
        
        this.read("catch");
        this.read("(");
        var param = this.BindingPattern();
        this.read(")");
        
        return new Node.CatchClause(param, this.Block(), start, this.endOffset);
    },
    
    // === Declarations ===
    
    StatementList: function(prologue, isModule) {
    
        var list = [],
            element,
            node,
            dir;
        
        while (this.peekUntil("}")) {
        
            list.push(element = this.Declaration(isModule));
            
            // Check for directives
            if (prologue && 
                element.type === "ExpressionStatement" &&
                element.expression.type === "String") {
                
                // Get the non-escaped literal text of the string
                node = element.expression;
                dir = this.input.slice(node.start + 1, node.end - 1);
                
                element.directive = dir;
                
                // Check for strict mode
                if (dir === "use strict")
                    this.setStrict();
                    
            } else {
            
                prologue = false;
            }
        }
        
        // Check for invalid nodes
        this.checkInvalidNodes();
        
        return list;
    },
    
    Declaration: function(isModule) {
    
        switch (this.peek()) {
            
            case "function": return this.FunctionDeclaration();
            case "class": return this.ClassDeclaration();
            case "let": 
            case "const": return this.LexicalDeclaration();
            
            case "import": return this.ImportDeclaration();
            
            case "export":
                
                if (isModule)
                    return this.ExportDeclaration();
                
                break;
            
            case "IDENTIFIER":
                
                if (this.peekModule(false))
                    return this.ModuleDeclaration();
                
                break;
        }
        
        return this.Statement();
    },
    
    LexicalDeclaration: function() {
    
        var node = this.VariableDeclaration(false);
        
        this.Semicolon();
        node.end = this.endOffset;
        
        return node;
    },
    
    // === Functions ===
    
    FunctionDeclaration: function() {
    
        var start = this.startOffset,
            gen = false,
            ident,
            params;
        
        this.read("function");
        
        if (this.peek() === "*") {
            
            this.read();
            gen = true;
        }
        
        return new Node.FunctionDeclaration(
            gen,
            ident = this.Identifier(),
            params = this.FormalParameters(),
            this.FunctionBody(ident, params, false),
            start,
            this.endOffset);
    },
    
    FunctionExpression: function() {
    
        var start = this.startOffset,
            gen = false,
            ident = null,
            params;
        
        this.read("function");
        
        if (this.peek() === "*") {
            
            this.read();
            gen = true;
        }
        
        if (this.peek() !== "(")
            ident = this.Identifier();
        
        return new Node.FunctionExpression(
            gen,
            ident,
            params = this.FormalParameters(),
            this.FunctionBody(ident, params, false),
            start,
            this.endOffset);
    },
    
    FormalParameters: function() {
    
        var list = [];
        
        this.read("(");
        
        while (this.peekUntil(")")) {
            
            if (list.length > 0)
                this.read(",");
            
            // Parameter list may have a trailing rest parameter
            if (this.peek() === "...") {
            
                list.push(this.RestParameter());
                break;
            }
            
            list.push(this.FormalParameter());
        }
        
        this.read(")");
        
        return list;
    },
    
    FormalParameter: function() {
    
        var start = this.startOffset,
            pattern = this.BindingPattern(),
            init = null;
        
        if (this.peek() === "=") {
        
            this.read("=");
            init = this.AssignmentExpression();
        }
        
        return new Node.FormalParameter(pattern, init, start, this.endOffset);
    },
    
    RestParameter: function() {
    
        var start = this.startOffset;
        
        this.read("...");
        
        return new Node.RestParameter(this.BindingIdentifier(), start, this.endOffset);
    },
    
    FunctionBody: function(ident, params, isStrict) {
    
        this.pushContext(true, isStrict);
        
        var start = this.startOffset;
        
        this.read("{");
        var statements = this.StatementList(true);
        this.read("}");
        
        if (ident) this.checkBindingIdent(ident);
        this.checkParameters(params);
        
        this.popContext();
        
        return new Node.FunctionBody(statements, start, this.endOffset);
    },
    
    ArrowFunction: function(formals, rest, start) {
    
        this.read("=>");
        
        var params = this.transformFormals(formals), 
            body;
        
        if (rest)
            params.push(rest);
        
        if (this.peek() === "{") {
        
            body = this.FunctionBody(null, params, true);
            
        } else {
        
            // Check parameters in the current context
            this.checkParameters(params);
            body = this.AssignmentExpression();
        }
        
        return new Node.ArrowFunction(params, body, start, this.endOffset);
    },
    
    // === Modules ===
    
    ModuleDeclaration: function() {
        
        var start = this.startOffset;
        
        this.readKeyword("module");
        
        return new Node.ModuleDeclaration(
            this.BindingIdentifier(),
            this.ModuleBody(),
            start,
            this.endOffset);
    },
    
    ModuleBody: function() {
    
        this.pushContext(false, true);
        
        var start = this.startOffset;
        
        this.read("{");
        var list = this.StatementList(true, true);
        this.read("}");
        
        this.popContext();
        
        return new Node.ModuleBody(list, start, this.endOffset);
    },
    
    ImportDeclaration: function() {
    
        var start = this.startOffset,
            ident,
            list,
            from;
        
        this.read("import");
        
        if (this.peek() === "STRING") {
        
            from = this.String();
            this.readKeyword("as");
            ident = this.BindingIdentifier();
            this.Semicolon();
            
            return new Node.ImportAsDeclaration(from, ident, start, this.endOffset);
        }
        
        list = [];
        
        while (true) {
        
            list.push(this.ImportSpecifier());
            
            if (this.peek() === ",") this.read();
            else break;
        }
        
        this.readKeyword("from");
        from = this.peek() === "STRING" ? this.String() : this.ModulePath();
        this.Semicolon();
        
        return new Node.ImportDeclaration(list, from, start, this.endOffset);
    },
    
    ImportSpecifier: function() {
    
        var start = this.startOffset,
            remote = this.Identifier(),
            local = null;
        
        if (this.peekKeyword("as")) {
        
            this.read();
            local = this.BindingIdentifier();
            
        } else {
        
            this.checkBindingIdent(remote);
        }
        
        return new Node.ImportSpecifier(remote, local, start, this.endOffset);
    },
    
    ExportDeclaration: function() {
    
        var start = this.startOffset,
            binding,
            tok;
        
        this.read("export");
        
        switch (tok = this.peek()) {
                
            case "var":
            case "let":
            case "const":
            
                binding = this.VariableDeclaration(false);
                this.Semicolon();
                break;
            
            case "function":
            
                binding = this.FunctionDeclaration();
                break;
            
            case "class":
            
                binding = this.ClassDeclaration();
                break;
            
            case "IDENTIFIER":
            
                if (this.peekModule(true)) {
                
                    binding = this.ModuleDeclaration();
                    break;
                }
                
            default:
                
                binding = this.ExportSpecifierSet();
                break;
        }
        
        return new Node.ExportDeclaration(binding, start, this.endOffset);
    },
    
    ExportSpecifierSet: function() {
    
        var start = this.startOffset,
            list = null,
            from = null;
        
        if (this.peek() === "*") {
        
            this.read();
            
        } else {
        
            list = [];
            
            while (true) {
        
                list.push(this.ExportSpecifier());
            
                if (this.peek() === ",") this.read();
                else break;
            }
        }
        
        // TODO: Make sure that token after "from" is valid!
        if (this.peekKeyword("from")) {
            
            this.read();
            from = this.peek() === "STRING" ? this.String() : this.ModulePath();
        }
        
        this.Semicolon();
        
        return new Node.ExportSpecifierSet(list, from, start, this.endOffset);
    },
    
    ExportSpecifier: function() {
    
        var start = this.startOffset,
            local = this.Identifier(),
            remote = null;
        
        // TODO: Make sure that token after "as" is valid!
        if (this.peekKeyword("as")) {
        
            this.read();
            remote = this.BindingIdentifier();
        }
        
        return new Node.ExportSpecifier(local, remote, start, this.endOffset);
    },
    
    ModulePath: function() {
    
        var start = this.startOffset,
            path = [];
        
        while (true) {
        
            path.push(this.Identifier());
            
            if (this.peek() === ".") this.read();
            else break;
        }
        
        return new Node.ModulePath(path, start, this.endOffset);
    },
    
    // === Classes ===
    
    ClassDeclaration: function() {
    
        var start = this.startOffset,
            ident = null,
            base = null;
        
        this.read("class");
        
        ident = this.BindingIdentifier();
        
        if (this.peek() === "extends") {
        
            this.read();
            base = this.AssignmentExpression();
        }
        
        return new Node.ClassDeclaration(
            ident,
            base,
            this.ClassBody(),
            start,
            this.endOffset);
    },
    
    ClassExpression: function() {
    
        var start = this.startOffset, 
            ident = null,
            base = null;
        
        this.read("class");
        
        if (this.peek() === "IDENTIFIER")
            ident = this.BindingIdentifier();
        
        if (this.peek() === "extends") {
        
            this.read();
            base = this.AssignmentExpression();
        }
        
        return new Node.ClassExpression(
            ident, 
            base, 
            this.ClassBody(), 
            start, 
            this.endOffset);
    },
    
    ClassBody: function() {
    
        this.pushContext(false, true);
        
        var start = this.startOffset,
            nameSet = {}, 
            staticSet = {},
            list = [];
        
        this.read("{");
        
        while (this.peekUntil("}", "name"))
            list.push(this.ClassElement(nameSet, staticSet));
        
        this.read("}");
        
        this.popContext();
        
        return new Node.ClassBody(list, start, this.endOffset);
    },
    
    ClassElement: function(nameSet, staticSet) {
    
        var start = this.startOffset,
            isStatic = false,
            flag = PROP_NORMAL,
            method,
            name;
        
        // Check for static modifier
        if (this.peekToken("name").value === "static" &&
            this.peek("name", 1) !== "(") {
        
            isStatic = true;
            nameSet = staticSet;
            this.read();
        }
        
        method = this.MethodDefinition();
        
        switch (method.modifier) {
        
            case "get": flag = PROP_GET; break;
            case "set": flag = PROP_SET; break;
        }
        
        // Check for duplicate names
        if (this.isDuplicateName(flag, nameSet[name = "." + method.name.value]))
            this.fail("Duplicate element name in class definition.", method);
        
        // Set name flag
        nameSet[name] |= flag;
        
        return new Node.ClassElement(isStatic, method, start, this.endOffset);
    }
    
    
}});


// Add externally defined methods
Object.mixin(Parser.prototype, Transform.prototype);
Object.mixin(Parser.prototype, Validate.prototype);

exports.Parser = Parser;
};

__modules[20] = function(exports) {
// Unicode 6.2.0 | 2012-05-23, 20:34:59 GMT [MD]
var identifierStart = /[\x24\x41-\x5A\x5F\x61-\x7A\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376-\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E-\u066F\u0671-\u06D3\u06D5\u06E5-\u06E6\u06EE-\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4-\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097F\u0985-\u098C\u098F-\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC-\u09DD\u09DF-\u09E1\u09F0-\u09F1\u0A05-\u0A0A\u0A0F-\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32-\u0A33\u0A35-\u0A36\u0A38-\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2-\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0-\u0AE1\u0B05-\u0B0C\u0B0F-\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32-\u0B33\u0B35-\u0B39\u0B3D\u0B5C-\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99-\u0B9A\u0B9C\u0B9E-\u0B9F\u0BA3-\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58-\u0C59\u0C60-\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0-\u0CE1\u0CF1-\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32-\u0E33\u0E40-\u0E46\u0E81-\u0E82\u0E84\u0E87-\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA-\u0EAB\u0EAD-\u0EB0\u0EB2-\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065-\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F0\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE-\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5-\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A-\uA62B\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5-\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40-\uFB41\uFB43-\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/,
    identifierPart = /[\x24\x30-\x39\x41-\x5A\x5F\x61-\x7A\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u036F\u0370-\u0374\u0376-\u0377\u037A-\u037D\u0386\u0387\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1-\u05C2\u05C4-\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u064A\u064B-\u0669\u066E-\u066F\u0670\u0671-\u06D3\u06D5\u06D6-\u06DC\u06DF-\u06E4\u06E5-\u06E6\u06E7-\u06E8\u06EA-\u06ED\u06EE-\u06EF\u06F0-\u06F9\u06FA-\u06FC\u06FF\u0710\u0711\u0712-\u072F\u0730-\u074A\u074D-\u07A5\u07A6-\u07B0\u07B1\u07C0-\u07C9\u07CA-\u07EA\u07EB-\u07F3\u07F4-\u07F5\u07FA\u0800-\u0815\u0816-\u0819\u081A\u081B-\u0823\u0824\u0825-\u0827\u0828\u0829-\u082D\u0840-\u0858\u0859-\u085B\u08A0\u08A2-\u08AC\u08E4-\u08FE\u0900-\u0903\u0904-\u0939\u093A-\u093C\u093D\u093E-\u094F\u0950\u0951-\u0957\u0958-\u0961\u0962-\u0963\u0966-\u096F\u0971-\u0977\u0979-\u097F\u0981-\u0983\u0985-\u098C\u098F-\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC\u09BD\u09BE-\u09C4\u09C7-\u09C8\u09CB-\u09CD\u09CE\u09D7\u09DC-\u09DD\u09DF-\u09E1\u09E2-\u09E3\u09E6-\u09EF\u09F0-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F-\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32-\u0A33\u0A35-\u0A36\u0A38-\u0A39\u0A3C\u0A3E-\u0A42\u0A47-\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A71\u0A72-\u0A74\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2-\u0AB3\u0AB5-\u0AB9\u0ABC\u0ABD\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE1\u0AE2-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F-\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32-\u0B33\u0B35-\u0B39\u0B3C\u0B3D\u0B3E-\u0B44\u0B47-\u0B48\u0B4B-\u0B4D\u0B56-\u0B57\u0B5C-\u0B5D\u0B5F-\u0B61\u0B62-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99-\u0B9A\u0B9C\u0B9E-\u0B9F\u0BA3-\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C01-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55-\u0C56\u0C58-\u0C59\u0C60-\u0C61\u0C62-\u0C63\u0C66-\u0C6F\u0C82-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC\u0CBD\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5-\u0CD6\u0CDE\u0CE0-\u0CE1\u0CE2-\u0CE3\u0CE6-\u0CEF\u0CF1-\u0CF2\u0D02-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D4E\u0D57\u0D60-\u0D61\u0D62-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82-\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2-\u0DF3\u0E01-\u0E30\u0E31\u0E32-\u0E33\u0E34-\u0E3A\u0E40-\u0E46\u0E47-\u0E4E\u0E50-\u0E59\u0E81-\u0E82\u0E84\u0E87-\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA-\u0EAB\u0EAD-\u0EB0\u0EB1\u0EB2-\u0EB3\u0EB4-\u0EB9\u0EBB-\u0EBC\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18-\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F3F\u0F40-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F87\u0F88-\u0F8C\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u102A\u102B-\u103E\u103F\u1040-\u1049\u1050-\u1055\u1056-\u1059\u105A-\u105D\u105E-\u1060\u1061\u1062-\u1064\u1065-\u1066\u1067-\u106D\u106E-\u1070\u1071-\u1074\u1075-\u1081\u1082-\u108D\u108E\u108F-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F0\u1700-\u170C\u170E-\u1711\u1712-\u1714\u1720-\u1731\u1732-\u1734\u1740-\u1751\u1752-\u1753\u1760-\u176C\u176E-\u1770\u1772-\u1773\u1780-\u17B3\u17B4-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18A8\u18A9\u18AA\u18B0-\u18F5\u1900-\u191C\u1920-\u192B\u1930-\u193B\u1946-\u194F\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C0\u19C1-\u19C7\u19C8-\u19C9\u19D0-\u19DA\u1A00-\u1A16\u1A17-\u1A1B\u1A20-\u1A54\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1B00-\u1B04\u1B05-\u1B33\u1B34-\u1B44\u1B45-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1B82\u1B83-\u1BA0\u1BA1-\u1BAD\u1BAE-\u1BAF\u1BB0-\u1BB9\u1BBA-\u1BE5\u1BE6-\u1BF3\u1C00-\u1C23\u1C24-\u1C37\u1C40-\u1C49\u1C4D-\u1C4F\u1C50-\u1C59\u1C5A-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CE9-\u1CEC\u1CED\u1CEE-\u1CF1\u1CF2-\u1CF4\u1CF5-\u1CF6\u1D00-\u1DBF\u1DC0-\u1DE6\u1DFC-\u1DFF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C-\u200D\u203F-\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CEF-\u2CF1\u2CF2-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u3029\u302A-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309A\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA620-\uA629\uA62A-\uA62B\uA640-\uA66E\uA66F\uA674-\uA67D\uA67F-\uA697\uA69F\uA6A0-\uA6EF\uA6F0-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA801\uA802\uA803-\uA805\uA806\uA807-\uA80A\uA80B\uA80C-\uA822\uA823-\uA827\uA840-\uA873\uA880-\uA881\uA882-\uA8B3\uA8B4-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F1\uA8F2-\uA8F7\uA8FB\uA900-\uA909\uA90A-\uA925\uA926-\uA92D\uA930-\uA946\uA947-\uA953\uA960-\uA97C\uA980-\uA983\uA984-\uA9B2\uA9B3-\uA9C0\uA9CF\uA9D0-\uA9D9\uAA00-\uAA28\uAA29-\uAA36\uAA40-\uAA42\uAA43\uAA44-\uAA4B\uAA4C-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A\uAA7B\uAA80-\uAAAF\uAAB0\uAAB1\uAAB2-\uAAB4\uAAB5-\uAAB6\uAAB7-\uAAB8\uAAB9-\uAABD\uAABE-\uAABF\uAAC0\uAAC1\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAEB-\uAAEF\uAAF2-\uAAF4\uAAF5-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uABE3-\uABEA\uABEC-\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1E\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40-\uFB41\uFB43-\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE26\uFE33-\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/,
    whitespaceChars = /[\x09\x0B-\x0C\x20\xA0\u1680\u180E\u2000-\u200A\u202F\u205F\u3000\uFEFF]/;

var identifierEscape = /\\u([0-9a-fA-F]{4})/g,
    newlineSequence = /\r\n?|[\n\u2028\u2029]/g;

// === Reserved Words ===
var reservedWord = new RegExp("^(?:" +
    "break|case|catch|class|const|continue|debugger|default|delete|do|" +
    "else|enum|export|extends|false|finally|for|function|if|import|in|" +
    "instanceof|new|null|return|super|switch|this|throw|true|try|typeof|" +
    "var|void|while|with" +
")$");

var strictReservedWord = new RegExp("^(?:" +
    "implements|private|public|interface|package|let|protected|static|yield" +
")$");

// === Punctuators ===
var multiCharPunctuator = new RegExp("^(?:" +
    "[-+]{2}|" +
    "[&|]{2}|" +
    "<<=?|" +
    ">>>?=?|" +
    "[!=]==|" +
    "=>|" +
    "[\.]{2,3}|" +
    "[-+&|<>!=*&\^%\/]=" +
")$");

var ASSIGNMENT = 1,
    UNARY = 2,
    INCREMENT = 4;

// === Miscellaneous Patterns ===
var octalEscape = /^(?:[0-3][0-7]{0,2}|[4-7][0-7]?)/,
    blockCommentPattern = /\r\n?|[\n\u2028\u2029]|\*\//g,
    hexChar = /[0-9a-f]/i;

// === Character Types ===
var WHITESPACE = 1,
    NEWLINE = 2,
    DECIMAL_DIGIT = 3,
    PUNCTUATOR = 4,
    PUNCTUATOR_CHAR = 5,
    STRING = 6,
    TEMPLATE = 7,
    IDENTIFIER = 8,
    ZERO = 9,
    DOT = 10,
    SLASH = 11,
    LBRACE = 12;

// === Character Type Lookup Table ===
var LookupTable = (function(exports) {

    var charTable = new Array(128), i;
    
    add(WHITESPACE, "\t\v\f ");
    add(NEWLINE, "\r\n");
    add(DECIMAL_DIGIT, "123456789");
    add(PUNCTUATOR_CHAR, "{[]();,?:");
    add(PUNCTUATOR, "<>+-*%&|^!~=");
    add(DOT, ".");
    add(SLASH, "/");
    add(LBRACE, "}");
    add(ZERO, "0");
    add(STRING, "'\"");
    add(TEMPLATE, "`");
    
    add(IDENTIFIER, "$_\\");
    for (i = 65; i <= 90; ++i) charTable[i] = IDENTIFIER;
    for (i = 97; i <= 122; ++i) charTable[i] = IDENTIFIER;
    
    function add(type, string) {
    
        string.split("").forEach((function(c) { return charTable[c.charCodeAt(0)] = type; }));
    }
exports.charTable = charTable; exports.i = i; return exports; }).call(this, {});

var charTable = LookupTable.charTable;

// Performs a binary search on an array
function binarySearch(array, val) {

    var right = array.length - 1,
        left = 0,
        mid,
        test;
    
    while (left <= right) {
        
        mid = (left + right) >> 1;
        test = array[mid];
        
        if (val > test) left = mid + 1;
        else if (val < test) right = mid - 1;
        else return mid;
    }
    
    return left;
}

// Returns true if the character is a valid identifier part
function isIdentifierPart(c) {

    if (c === void 0)
        return false;
    
    var code = c.charCodeAt(0);
    
    return  code > 64 && code < 91 || 
            code > 96 && code < 123 ||
            code > 47 && code < 58 ||
            code === 36 ||
            code === 95 ||
            code === 92 ||
            code > 123 && identifierPart.test(c);
}

// Returns true if the specified character is a newline
function isNewlineChar(c) {

    switch (c) {
    
        case "\r":
        case "\n":
        case "\u2028":
        case "\u2029":
            return true;
    }
    
    return false;
}

// Returns true if the specified character can exist in a non-starting position
function isPunctuatorNext(c) {

    switch (c) {
    
        case "+":
        case "-":
        case "&":
        case "|":
        case "<":
        case ">":
        case "=":
        case ".":
            return true;
    }
    
    return false;
}

// Returns true if the specified character is a valid numeric following character
function isNumberFollow(c) {

    if (c === void 0)
        return true;
    
    var code = c.charCodeAt(0);
    
    return !(
        code > 64 && code < 91 || 
        code > 96 && code < 123 ||
        code > 47 && code < 58 ||
        code === 36 ||
        code === 95 ||
        code === 92 ||
        code > 123 && identifierStart.test(c)
    );
}

var Scanner = es6now.Class(function(__super) { return {

    constructor: function(input, offset) {

        this.input = input || "";
        this.offset = offset || 0;
        this.length = this.input.length;
        this.lines = [-1];
        
        this.strict = false;
        
        this.type = "";
        this.start = 0;
        this.end = 0;
        this.value = "";
        this.number = 0;
        this.templateEnd = false;
        this.regExpFlags = null;
        this.newlineBefore = false;
        this.flags = 0;
        this.error = "";
    },
    
    next: function(context) {

        if (this.type !== "COMMENT")
            this.newlineBefore = false;
        
        this.error = "";
        this.value = null;
        this.flags = 0;
        
        var type = null, 
            start;
        
        while (type === null) {
        
            start = this.offset;
            type = start >= this.length ? "EOF" : this.Start(context);
        }
        
        this.type = type;
        this.start = start;
        this.end = this.offset;
        
        return type;
    },
    
    raw: function(token) {
    
        token || (token = this);
        return this.input.slice(this.start, this.end);
    },
    
    position: function(token) {
    
        token || (token = this);
        
        var offset = token.start,
            i = binarySearch(this.lines, offset);
        
        return { 
        
            offset: offset, 
            line: i, 
            column: offset - this.lines[i - 1]
        };
    },
    
    addLineBreak: function(offset) {
    
        this.lines.push(offset);
    },
    
    readIdentifierEscape: function() {
    
        if (this.input[this.offset++] !== "u")
            return null;
        
        var hex;
        
        if (this.input[this.offset] === "{") {
        
            this.offset++;
            hex = this.readHex(0);
            
            if (this.input[this.offset++] !== "}")
                return null;
        
        } else {
        
            hex = this.readHex(4);
        
            if (hex.length < 4)
                return null;
        }
        
        return String.fromCharCode(parseInt(hex, 16));
    },
    
    readOctalEscape: function() {
    
        var m = octalEscape.exec(this.input.slice(this.offset, this.offset + 3)),
            val = m ? m[0] : "";
        
        this.offset += val.length;
        
        return val;
    },
    
    readStringEscape: function() {
    
        this.offset++;
        
        var chr, esc;
        
        switch (chr = this.input[this.offset++]) {
        
            case "t": return "\t";
            case "b": return "\b";
            case "v": return "\v";
            case "f": return "\f";
            case "r": return "\r";
            case "n": return "\n";
    
            case "\r":
            
                this.addLineBreak(this.offset - 1);
                
                if (this.input[this.offset] === "\n")
                    this.offset++;
                
                return "";
            
            case "\n":
            case "\u2028":
            case "\u2029":
            
                this.addLineBreak(this.offset - 1);
                return "";

            case "0":
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            
                this.offset--;
                esc = this.readOctalEscape();
                
                if (esc === "0") {
                
                    return String.fromCharCode(0);
                
                } else if (this.strict) {
                
                    this.error = "Octal literals are not allowed in strict mode";
                    return null;
                    
                } else {
                
                    return String.fromCharCode(parseInt(esc, 8));
                }
            
            case "x":
            
                esc = this.readHex(2);
                return (esc.length < 2) ? null : String.fromCharCode(parseInt(esc, 16));
            
            case "u":
            
                if (this.input[this.offset] === "{") {
                
                    this.offset++;
                    esc = this.readHex(0);
                    
                    if (this.input[this.offset++] !== "}")
                        return null;
                    
                } else {
                
                    esc = this.readHex(4);
                    if (esc.length < 4) return null;
                }
                
                return String.fromCharCode(parseInt(esc, 16));
            
            default: 
            
                return chr;
        }
    },
    
    readRange: function(low, high) {
    
        var start = this.offset,
            code;
        
        while (code = this.input.charCodeAt(this.offset)) {
        
            if (code >= low && code <= high) this.offset++;
            else break;
        }
        
        return this.input.slice(start, this.offset);
    },
    
    readInteger: function() {
    
        var start = this.offset,
            code;
        
        while (code = this.input.charCodeAt(this.offset)) {
        
            if (code >= 48 && code <= 57) this.offset++;
            else break;
        }
        
        return this.input.slice(start, this.offset);
    },
    
    readHex: function(maxLen) {
        
        var str = "", 
            chr;
        
        while (chr = this.input[this.offset]) {
        
            if (!hexChar.test(chr))
                break;
            
            str += chr;
            this.offset++;
            
            if (str.length === maxLen)
                break;
        }
        
        return str;
    },
    
    Start: function(context) {
    
        var code = this.input.charCodeAt(this.offset),
            next;
            
        switch (charTable[code]) {
        
            case PUNCTUATOR_CHAR: return this.PunctuatorChar(code);
            
            case WHITESPACE: return this.Whitespace(code);
            
            case IDENTIFIER: 
            
                return context === "name" ? 
                    this.IdentifierName(code) : 
                    this.Identifier(code);
            
            case LBRACE:
            
                if (context === "template") return this.Template(code);
                else return this.PunctuatorChar(code);
            
            case PUNCTUATOR: return this.Punctuator(code);
            
            case NEWLINE: return this.Newline(code);
            
            case DECIMAL_DIGIT: return this.Number(code);
            
            case TEMPLATE: return this.Template(code);
            
            case STRING: return this.String(code);
            
            case ZERO: 
            
                switch (next = this.input.charCodeAt(this.offset + 1)) {
                
                    case 88: case 120: return this.HexNumber(code);   // x
                    case 66: case 98: return this.BinaryNumber(code); // b
                    case 79: case 111: return this.OctalNumber(code); // o
                }
                
                return next >= 48 && next <= 55 ?
                    this.LegacyOctalNumber(code) :
                    this.Number(code);
            
            case DOT: 
            
                next = this.input.charCodeAt(this.offset + 1);
                
                if (next >= 48 && next <= 57) return this.Number(code);
                else return this.Punctuator(code);
            
            case SLASH:
            
                next = this.input.charCodeAt(this.offset + 1);

                if (next === 47) return this.LineComment(code);       // /
                else if (next === 42) return this.BlockComment(code); // *
                else if (context === "div") return this.Punctuator(code);
                else return this.RegularExpression(code);
            
        }
        
        var chr = this.input[this.offset];
        
        // Unicode newlines
        if (isNewlineChar(chr))
            return this.Newline(code);
        
        // Unicode whitespace
        if (whitespaceChars.test(chr))
            return this.UnicodeWhitespace(code);
        
        // Unicode identifier chars
        if (identifierStart.test(chr))
            return context === "name" ? this.IdentifierName(code) : this.Identifier(code);
        
        return this.Error();
    },
    
    Whitespace: function(code) {
    
        this.offset++;
        
        while (code = this.input.charCodeAt(this.offset)) {
        
            // ASCII Whitespace:  [\t] [\v] [\f] [ ] 
            if (code === 9 || code === 11 || code === 12 || code ===32)
                this.offset++;
            else
                break;
        }
        
        return null;
    },
    
    UnicodeWhitespace: function() {
    
        this.offset++;
        
        // General unicode whitespace
        while (whitespaceChars.test(this.input[this.offset]))
            this.offset++;
        
        return null;
    },
    
    Newline: function(code) {
        
        this.addLineBreak(this.offset++);
        
        // Treat /r/n as a single newline
        if (code === 13 && this.input.charCodeAt(this.offset) === 10)
            this.offset++;
        
        this.newlineBefore = true;
        
        return null;
    },
    
    PunctuatorChar: function() {
    
        return this.input[this.offset++];
    },
    
    Punctuator: function() {
        
        var op = this.input[this.offset++], 
            chr,
            next;
        
        while (
            isPunctuatorNext(chr = this.input[this.offset]) &&
            multiCharPunctuator.test(next = op + chr)) {
    
            this.offset++;
            op = next;
        }
        
        // ".." is not a valid token
        if (op === "..") {
        
            this.offset--;
            op = ".";
        }
        
        return op;
    },
    
    Template: function() {
    
        var first = this.input[this.offset++],
            end = false, 
            val = "", 
            esc,
            chr;
        
        while (chr = this.input[this.offset]) {
            
            if (chr === "`") {
            
                end = true;
                break;
            }
            
            if (chr === "$" && this.input[this.offset + 1] === "{") {
            
                this.offset++;
                break;
            }
            
            if (chr === "\\") {
            
                esc = this.readStringEscape();
                
                if (!esc) 
                    return this.Error();
                
                val += esc;
                
            } else {
            
                val += chr;
                this.offset++;
            }
        }
        
        if (!chr)
            return this.Error();
        
        this.offset++;
        
        this.value = val;
        this.templateEnd = end;
        
        return "TEMPLATE";
    },
    
    String: function() {
    
        var delim = this.input[this.offset++],
            val = "",
            esc,
            chr;
        
        while (chr = this.input[this.offset]) {
        
            if (chr === delim)
                break;
            
            if (isNewlineChar(chr))
                return this.Error();
            
            if (chr === "\\") {
            
                esc = this.readStringEscape();
                
                if (esc === null)
                    return this.Error();
                
                val += esc;
                
            } else {
            
                val += chr;
                this.offset++;
            }
        }
        
        if (!chr)
            return this.Error();
        
        this.offset++;
        this.value = val;
        
        return "STRING";
    },
    
    RegularExpression: function() {
    
        this.offset++;
        
        var backslash = false, 
            inClass = false,
            flags = null,
            val = "", 
            chr;
        
        while (chr = this.input[this.offset++]) {
        
            if (isNewlineChar(chr))
                return this.Error();
            
            if (backslash) {
            
                val += "\\" + chr;
                backslash = false;
            
            } else if (chr === "[") {
            
                inClass = true;
                val += chr;
            
            } else if (chr === "]" && inClass) {
            
                inClass = false;
                val += chr;
            
            } else if (chr === "/" && !inClass) {
            
                break;
            
            } else if (chr === "\\") {
            
                backslash = true;
                
            } else {
            
                val += chr;
            }
        }
        
        if (!chr)
            return this.Error();
        
        if (isIdentifierPart(this.input[this.offset]))
            flags = this.IdentifierName().value;
        
        this.value = val;
        this.regExpFlags = flags;
        
        return "REGEX";
    },
    
    LegacyOctalNumber: function() {
    
        this.offset++;
        
        var start = this.offset,
            code;
        
        while (code = this.input.charCodeAt(this.offset)) {
        
            if (code >= 48 && code <= 55)
                this.offset++;
            else
                break;
        }
        
        if (this.strict)
            return this.Error("Octal literals are not allowed in strict mode");
        
        this.number = parseInt(this.input.slice(start, this.offset), 8);
        
        return isNumberFollow(this.input[this.offset]) ? "NUMBER" : this.Error();
    },
    
    Number: function() {
    
        var start = this.offset,
            next;
        
        this.readInteger();
        
        if (this.input[this.offset] === ".") {
        
            this.offset++;
            this.readInteger();
        }
        
        next = this.input[this.offset];
        
        if (next === "e" || next === "E") {
        
            this.offset++;
            
            next = this.input[this.offset];
            
            if (next === "+" || next === "-")
                this.offset++;
            
            if (!this.readInteger())
                return this.Error();
        }
        
        this.number = parseFloat(this.input.slice(start, this.offset));
        
        return isNumberFollow(this.input[this.offset]) ? "NUMBER" : this.Error();
    },
    
    BinaryNumber: function() {
    
        this.offset += 2;
        this.number = parseInt(this.readRange(48, 49), 2);
        
        return isNumberFollow(this.input[this.offset]) ? "NUMBER" : this.Error();
    },
    
    OctalNumber: function() {
    
        this.offset += 2;
        this.number = parseInt(this.readRange(48, 55), 8);
        
        return isNumberFollow(this.input[this.offset]) ? "NUMBER" : this.Error();
    },
    
    HexNumber: function() {
    
        this.offset += 2;
        this.number = parseInt(this.readHex(0), 16);
        
        return isNumberFollow(this.input[this.offset]) ? "NUMBER" : this.Error();
    },
    
    Identifier: function() {
    
        var start = this.offset,
            id = "",
            chr,
            esc;

        while (isIdentifierPart(chr = this.input[this.offset])) {
        
            if (chr === "\\") {
            
                id += this.input.slice(start, this.offset++);
                esc = this.readIdentifierEscape();
                
                if (esc === null)
                    return this.Error();
                
                id += esc;
                start = this.offset;
                
            } else {
            
                this.offset++;
            }
        }
        
        id += this.input.slice(start, this.offset);
        
        if (reservedWord.test(id) || this.strict && strictReservedWord.test(id))
            return id;
        
        this.value = id;
        
        return "IDENTIFIER";
    },
    
    IdentifierName: function() {
    
        var start = this.offset,
            id = "",
            chr,
            esc;

        while (isIdentifierPart(chr = this.input[this.offset])) {
        
            if (chr === "\\") {
            
                id += this.input.slice(start, this.offset++);
                esc = this.readIdentifierEscape();
                
                if (esc === null)
                    return this.Error();
                
                id += esc;
                start = this.offset;
                
            } else {
            
                this.offset++;
            }
        }
        
        this.value = id + this.input.slice(start, this.offset);
        
        return "IDENTIFIER";
    },
    
    LineComment: function() {
    
        this.offset += 2;
        
        var start = this.offset,
            chr;
        
        while (chr = this.input[this.offset]) {
        
            if (isNewlineChar(chr))
                break;
            
            this.offset++;
        }
        
        this.value = this.input.slice(start, this.offset);
        
        return "COMMENT";
    },
    
    BlockComment: function() {
    
        this.offset += 2;
        
        var pattern = blockCommentPattern,
            start = this.offset,
            m;
        
        while (true) {
        
            pattern.lastIndex = this.offset;
            
            m = pattern.exec(this.input);
            if (!m) return this.Error();
            
            this.offset = m.index + m[0].length;
            
            if (m[0] === "*/")
                break;
            
            this.newlineBefore = true;
            this.addLineBreak(m.index);
        }
        
        this.value = this.input.slice(start, this.offset - 2);
        
        return "COMMENT";
    },
    
    Error: function(msg) {
    
        this.offset++;
        
        if (msg)
            this.error = msg;
        
        return "ILLEGAL";
    }
    
}});

exports.Scanner = Scanner;
};

__modules[21] = function(exports) {
var Transform = es6now.Class(function(__super) { return {

    // Transform an expression into a formal parameter list
    transformFormals: function(expr) {
    
        if (expr === null)
            return [];
            
        var list = (expr.type === "SequenceExpression") ? expr.expressions : [expr],
            params = [],
            param,
            node,
            i;
    
        for (i = 0; i < list.length; ++i) {
        
            node = list[i];
            
            params.push(param = {
            
                type: "FormalParameter",
                pattern: node,
                init: null,
                start: node.start,
                end: node.end
            });
            
            this.transformPatternElement(param, true);
        }
        
        return params;
    },
    
    transformArrayPattern: function(node, binding) {
    
        node.type = "ArrayPattern";
        
        var elems = node.elements,
            elem,
            rest,
            i;
        
        for (i = 0; i < elems.length; ++i) {
        
            elem = elems[i];
            
            if (!elem) 
                continue;
            
            if (elem.type !== "PatternElement") {
            
                rest = (elem.type === "SpreadExpression");
                
                elem = elems[i] = {
                
                    type: "PatternElement",
                    pattern: rest ? elem.expression : elem,
                    init: null,
                    rest: rest,
                    start: elem.start,
                    end: elem.end
                };
                
                // No trailing comma allowed after rest
                if (rest && (node.trailingComma || i < elems.length - 1))
                    this.fail("Invalid destructuring pattern", elem);
            }
            
            if (elem.rest) this.transformPattern(elem.pattern, binding);
            else this.transformPatternElement(elem, binding);
        }
    },
    
    transformObjectPattern: function(node, binding) {

        node.type = "ObjectPattern";
        
        var props = node.properties, 
            prop,
            i;
        
        for (i = 0; i < props.length; ++i) {
        
            prop = props[i];
            
            switch (prop.type) {
            
                case "PatternProperty":
                
                    break;
                
                case "CoveredPatternProperty":
                    
                    prop.type = "PatternProperty";
                    break;
                    
                case "PropertyDefinition":
                    
                    prop.type = "PatternProperty";
                    prop.pattern = prop.expression;
                    prop.init = null;
                    
                    delete prop.expression;
                    break;
                
                default:
                
                    this.fail("Invalid pattern", prop);
            }
            
            // Clear error flags
            if (prop.error)
                delete prop.error;
            
            if (prop.pattern) this.transformPatternElement(prop, binding);
            else this.transformPattern(prop.name, binding);
        }
    },
    
    transformPatternElement: function(elem, binding) {
    
        var node = elem.pattern;
        
        // Split assignment into pattern and initializer
        if (node.type === "AssignmentExpression" && node.operator === "=") {
        
            elem.pattern = node.left;
            elem.init = node.right;
        }
        
        this.transformPattern(elem.pattern, binding);
    },
    
    // Transforms an expression into a pattern
    transformPattern: function(node, binding) {

        switch (node.type) {
        
            case "Identifier":
            
                if (binding) this.checkBindingIdent(node, true);
                else this.checkAssignTarget(node, true);
                
                break;
            
            case "MemberExpression":
            case "CallExpression":
                if (binding) this.fail("Invalid left-hand-side in binding pattern", node);
                break;
            
            case "ObjectExpression":
            case "ObjectPattern":
                this.transformObjectPattern(node, binding);
                break;
            
            case "ArrayExpression":
            case "ArrayPattern":
                this.transformArrayPattern(node, binding);
                break;
                
            default:
                this.fail("Invalid expression in pattern", node);
                break;
        }
        
        return node;
    }
    
}});


exports.Transform = Transform;
};

__modules[22] = function(exports) {
// Object literal property name flags
var PROP_NORMAL = 1,
    PROP_ASSIGN = 2,
    PROP_GET = 4,
    PROP_SET = 8;

// Returns true if the specified name is a restricted identifier in strict mode
function isPoisonIdent(name) {

    return name === "eval" || name === "arguments";
}

var Validate = es6now.Class(function(__super) { return {

    // Checks an assignment target for strict mode restrictions
    checkAssignTarget: function(node, strict) {
    
        if (node.type !== "Identifier")
            return;
        
        // Mark identifier node as a variable
        node.context = "variable";
        
        if (!strict && !this.context.strict)
            return;
        
        if (isPoisonIdent(node.value))
            this.fail("Cannot modify " + node.value + " in strict mode", node);
    },
    
    // Checks a binding identifier for strict mode restrictions
    checkBindingIdent: function(node, strict) {
    
        // Mark identifier node as a declaration
        node.context = "declaration";
        
        if (!strict && !this.context.strict)
            return;
            
        var name = node.value;
        
        if (isPoisonIdent(name))
            this.fail("Binding cannot be created for '" + name + "' in strict mode", node);
    },
    
    // Checks function formal parameters for strict mode restrictions
    checkParameters: function(params) {
    
        if (!this.context.strict)
            return;
        
        var names = {}, 
            name,
            node,
            i;
        
        for (i = 0; i < params.length; ++i) {
        
            node = params[i];
            
            if (node.type !== "FormalParameter" || node.pattern.type !== "Identifier")
                continue;
            
            name = node.pattern.value;
            
            if (isPoisonIdent(name))
                this.fail("Parameter name " + name + " is not allowed in strict mode", node);
            
            if (names[name] === 1)
                this.fail("Strict mode function may not have duplicate parameter names", node);
            
            names[name] = 1;
        }
    },
    
    // Performs validation on the init portion of a for-in or for-of statement
    checkForInit: function(init, type) {
    
        if (init.type === "VariableDeclaration") {
        
            // For-in/of may only have one variable declaration
            
            if (init.declarations.length !== 1)
                this.fail("for-" + type + " statement may not have more than one variable declaration", init);
            
            // A variable initializer is only allowed in for-in where 
            // variable type is "var" and it is not a pattern
                
            var decl = init.declarations[0];
            
            if (decl.init && (
                type === "of" ||
                init.keyword !== "var" ||
                decl.pattern.type !== "Identifier")) {
                
                this.fail("Invalid initializer in for-" + type + " statement", init);
            }
            
        } else {
        
            // Transform object and array patterns
            this.transformPattern(init, false);
        }
    },
    
    // Returns true if the specified name type is a duplicate for a given set of flags
    isDuplicateName: function(type, flags) {
    
        if (!flags)
            return false;
        
        switch (type) {
        
            case PROP_ASSIGN: return (this.context.strict || flags !== PROP_ASSIGN);
            case PROP_GET: return (flags !== PROP_SET);
            case PROP_SET: return (flags !== PROP_GET);
            default: return !!flags;
        }
    },
    
    // Checks for duplicate property names in object literals or classes
    checkInvalidNodes: function() {
    
        var context = this.context,
            list = context.invalidNodes,
            node,
            i;
        
        if (list === null)
            return;
        
        for (i = 0; i < list.length; ++i) {
        
            node = list[i];
            
            if (node.error)
                this.fail(node.error, node);
        }
        
        context.invalidNodes = null;
    }
    
}});
exports.Validate = Validate;
};

__init(0, exports);


}, ["fs","path","http","url"], "");