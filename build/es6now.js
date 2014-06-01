/*=es6now=*/(function(fn, deps, name) { if (typeof exports !== 'undefined') fn.call(typeof global === 'object' ? global : this, require, exports); else if (typeof define === 'function' && define.amd) define(['require', 'exports'].concat(deps), fn); else if (typeof window !== 'undefined' && name) fn.call(window, null, window[name] = {}); else fn.call(window || this, null, {}); })(function(require, exports) { 'use strict'; function __load(p) { var e = require(p); return typeof e === 'object' ? e : { 'default': e }; } 

var __this = this; this._es6now = {};

(function() {

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

    var names = Object.getOwnPropertyNames(obj), i;
    
    for (i = 0; i < names.length; ++i)
        fn(names[i], Object.getOwnPropertyDescriptor(obj, names[i]));
    
    if (Object.getOwnPropertySymbols) {
    
        names = Object.getOwnPropertySymbols(obj);
        
        for (i = 0; i < names.length; ++i)
            fn(names[i], Object.getOwnPropertyDescriptor(obj, names[i]));
    }
    
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

function defineMethods(to, from) {

    forEachDesc(from, (function(name, desc) {
    
        if (typeof name !== "string" || !STATIC.test(name))
            Object.defineProperty(to, name, desc);
    }));
}

function defineStatic(to, from) {

    forEachDesc(from, (function(name, desc) {
    
        if (typeof name === "string" &&
            STATIC.test(name) && 
            typeof desc.value === "object" && 
            desc.value) {
            
            defineMethods(to, desc.value);
        }
    }));
}

function Class(base, def) {

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
    
    // Generate the method collection, closing over "__super"
    var proto = Object.create(parent),
        props = def(parent),
        constructor = props.constructor;
    
    if (!constructor)
        throw new Error("No constructor specified.");
    
    // Make constructor non-enumerable
    // if none is provided
    Object.defineProperty(props, "constructor", {
    
        enumerable: false,
        writable: true,
        configurable: true,
        value: constructor
    });
    
    // Set prototype methods
    defineMethods(proto, props);
    
    // Set constructor's prototype
    constructor.prototype = proto;
    
    // Set class "static" methods
    defineStatic(constructor, props);
    
    // "Inherit" from base constructor
    if (base) inherit(constructor, base);
    
    return constructor;
}

_es6now.Class = Class;


}).call(this);

(function() {

var global = this, 
    arraySlice = Array.prototype.slice,
    toString = Object.prototype.toString;

// === Symbols ===

var symbolCounter = 0;

function fakeSymbol() {

    return "__$" + Math.floor(Math.random() * 1e9) + "$" + (++symbolCounter) + "$__";
}

// NOTE:  As of Node 0.11.12, V8's Symbol implementation is a little wonky.
// There is no Object.getOwnPropertySymbols, so reflection doesn't seem to
// work like it should.  Furthermore, Node blows up when trying to inspect
// Symbol objects.  We expect to replace this override when V8's symbols
// catch up with the ES6 specification.

this.Symbol = fakeSymbol;

Symbol.iterator = Symbol("iterator");

// Support for iterator protocol
_es6now.iterator = function(obj) {

    if (global.Symbol && Symbol.iterator && obj[Symbol.iterator] !== void 0)
        return obj[Symbol.iterator]();
    
    if (Array.isArray(obj))
        return obj.values();
    
    return obj;
};

// Support for computed property names
_es6now.computed = function(obj) {

    var name, desc, i;
    
    for (i = 1; i < arguments.length; ++i) {
    
        name = "__$" + (i - 1);
        desc = Object.getOwnPropertyDescriptor(obj, name);
        
        if (!desc)
            continue;
        
        Object.defineProperty(obj, arguments[i], desc);
        delete obj[name];
    }
    
    return obj;
};

// Support for rest parameters
_es6now.rest = function(args, pos) {

    return arraySlice.call(args, pos);
};

// Support for tagged templates
_es6now.templateSite = function(values, raw) {

    values.raw = raw || values;
    return values;
};

// Support for destructuring
_es6now.path = function(obj, path, def) {

    if (!path)
        return obj;
    
    for (var i = 0; i < path.length; ++i) {
    
        if (!obj || typeof obj !== "object")
            throw new TypeError();
                
        obj = obj[path[i]];
    }
    
    return obj === void 0 ? def : obj;
};

// Throws an error if the argument is not an object
_es6now.obj = function(obj) {

    if (!obj || typeof obj !== "object")
        throw new TypeError();
    
    return obj;
};

function eachKey(obj, fn) {

    var keys = Object.getOwnPropertyNames(obj),
        i;
    
    for (i = 0; i < keys.length; ++i)
        fn(keys[i]);
    
    if (!Object.getOwnPropertySymbols)
        return;
    
    keys = Object.getOwnPropertySymbols(obj);
    
    for (i = 0; i < keys.length; ++i)
        fn(keys[i]);
}

function addMethods(obj, methods) {

    eachKey(methods, (function(key) {
    
        if (key in obj)
            return;
        
        Object.defineProperty(obj, key, {
        
            value: methods[key],
            configurable: true,
            enumerable: false,
            writable: true
        });
    }));
}


// === Object ===

addMethods(Object, {

    is: function(left, right) {
    
        if (left === right)
            return left !== 0 || 1 / left === 1 / right;
        
        return left !== left && right !== right;
    },
    
    // TODO: Multiple sources
    assign: function(target, source) {
    
        Object.keys(source).forEach((function(key) { return target[key] = source[key]; }));
        return target;
    }
    
});

// === Number ===

addMethods(Number, {

    EPSILON: ((function($) {
    
        var next, result;
        
        for (next = 1; 1 + next !== 1; next = next / 2)
            result = next;
        
        return result;
        
    }))(),
    
    MAX_SAFE_INTEGER: 9007199254740992,
    
    MIN_SAFE_INTEGER: -9007199254740991,
    
    isInteger: function(val) { return typeof val === "number" && val | 0 === val },
    
    isFinite: function(val) { return typeof val === "number" && global.isFinite(val) },
    
    isNaN: function(val) { return val !== val },
    
    isSafeInteger: function(val) { return Number.isInteger(val) && Math.abs(val) <= Number.MAX_SAFE_INTEGER }
    
});

// === String === 

addMethods(String, {

    raw: function(callsite) { var args = _es6now.rest(arguments, 1); 
    
        var raw = callsite.raw,
            len = raw.length >>> 0;
        
        if (len === 0)
            return "";
            
        var s = "", i = 0;
        
        while (true) {
        
            s += raw[i];
        
            if (i + 1 === len)
                return s;
        
            s += args[i++];
        }
    }
    
    // TODO:  fromCodePoint
    
});

addMethods(String.prototype, {
    
    repeat: function(count) {
    
        if (this == null)
            throw TypeError();
        
        var n = count ? Number(count) : 0;
        
        if (isNaN(n))
            n = 0;
        
        // Account for out-of-bounds indices
        if (n < 0 || n == Infinity)
            throw RangeError();
        
        if (n == 0)
            return "";
            
        var result = "";
        
        while (n--)
            result += this;
        
        return result;
    },
    
    startsWith: function(search) {
    
        var string = String(this);
        
        if (this == null || toString.call(search) == "[object RegExp]")
            throw TypeError();
            
        var stringLength = this.length,
            searchString = String(search),
            searchLength = searchString.length,
            position = arguments.length > 1 ? arguments[1] : undefined,
            pos = position ? Number(position) : 0;
            
        if (isNaN(pos))
            pos = 0;
        
        var start = Math.min(Math.max(pos, 0), stringLength);
        
        return this.indexOf(searchString, pos) == start;
    },
    
    endsWith: function(search) {
    
        if (this == null || toString.call(search) == '[object RegExp]')
            throw TypeError();
        
        var stringLength = this.length,
            searchString = String(search),
            searchLength = searchString.length,
            pos = stringLength;
        
        if (arguments.length > 1) {
        
            var position = arguments[1];
        
            if (position !== undefined) {
        
                pos = position ? Number(position) : 0;
                
                if (isNaN(pos))
                    pos = 0;
            }
        }
        
        var end = Math.min(Math.max(pos, 0), stringLength),
            start = end - searchLength;
        
        if (start < 0)
            return false;
            
        return this.lastIndexOf(searchString, start) == start;
    },
    
    contains: function(search) {
    
        if (this == null)
            throw TypeError();
            
        var stringLength = this.length,
            searchString = String(search),
            searchLength = searchString.length,
            position = arguments.length > 1 ? arguments[1] : undefined,
            pos = position ? Number(position) : 0;
        
        if (isNaN(pos))
            pos = 0;
            
        var start = Math.min(Math.max(pos, 0), stringLength);
        
        return this.indexOf(string, searchString, pos) != -1;
    }
    
    // TODO: codePointAt
    
});

// === Array ===

var ArrayIterator = _es6now.Class(function(__super) { return _es6now.computed({

    constructor: function ArrayIterator(array, kind) {
    
        this.array = array;
        this.current = 0;
        this.kind = kind;
    },
    
    next: function() {
    
        var length = this.array.length >>> 0,
            index = this.current;
        
        if (index >= length) {
        
            this.current = Infinity;
            return { value: void 0, done: true };
        }
        
        this.current += 1;
        
        switch (this.kind) {
        
            case "values":
                return { value: this.array[index], done: false };
            
            case "entries":
                return { value: [ index, this.array[index] ], done: false };
            
            default:
                return { value: index, done: false };
        }
    },
    
    __$0: function() { return this }

}, Symbol.iterator) });

addMethods(Array.prototype, _es6now.computed({

    values: function() { return new ArrayIterator(this, "values") },
    entries: function() { return new ArrayIterator(this, "entries") },
    keys: function() { return new ArrayIterator(this, "keys") },
    __$0: function() { return this.values() }
}, Symbol.iterator));


}).call(this);

(function() { var __this = this; 

var enqueueMicrotask = ((function($) {

    var window = __this.window,
        process = __this.process,
        msgChannel = null,
        list = [];
    
    if (typeof setImmediate === "function") {
    
        return window ?
            window.setImmediate.bind(window) :
            setImmediate;
    
    } else if (process && typeof process.nextTick === "function") {
    
        return process.nextTick;
        
    } else if (window && window.MessageChannel) {
        
        msgChannel = new window.MessageChannel();
        msgChannel.port1.onmessage = (function($) { if (list.length) list.shift()(); });
    
        return (function(fn) {
        
            list.push(fn);
            msgChannel.port2.postMessage(0);
        });
    }
    
    return (function(fn) { return setTimeout(fn, 0); });

}))();

// The following property names are used to simulate the internal data
// slots that are defined for Promise objects.

var $status = "Promise#status",
    $value = "Promise#value",
    $onResolve = "Promise#onResolve",
    $onReject = "Promise#onReject";

// The following property name is used to simulate the built-in symbol @@isPromise
var $$isPromise = "@@isPromise";

function isPromise(x) { 

    return !!x && $$isPromise in Object(x);
}

function promiseDefer(ctor) {

    var d = {};

    d.promise = new ctor((function(resolve, reject) {
        d.resolve = resolve;
        d.reject = reject;
    }));

    return d;
}

function promiseChain(promise, onResolve, onReject) {

    if (typeof onResolve !== "function") onResolve = (function(x) { return x; });
    if (typeof onReject !== "function") onReject = (function(e) { throw e });

    var deferred = promiseDefer(promise.constructor);
    
    if (typeof promise[$status] !== "string")
        throw new TypeError("Promise method called on a non-promise");

    switch (promise[$status]) {

        case "pending":
            promise[$onResolve].push([deferred, onResolve]);
            promise[$onReject].push([deferred, onReject]);
            break;

        case "resolved":
            promiseReact(deferred, onResolve, promise[$value]);
            break;
    
        case "rejected":
            promiseReact(deferred, onReject, promise[$value]);
            break;
    }

    return deferred.promise;
}

function promiseResolve(promise, x) {
    
    promiseDone(promise, "resolved", x, promise[$onResolve]);
}

function promiseReject(promise, x) {
    
    promiseDone(promise, "rejected", x, promise[$onReject]);
}

function promiseDone(promise, status, value, reactions) {

    if (promise[$status] !== "pending") 
        return;
        
    promise[$status] = status;
    promise[$value] = value;
    promise[$onResolve] = promise[$onReject] = void 0;
    
    for (var i = 0; i < reactions.length; ++i) 
        promiseReact(reactions[i][0], reactions[i][1], value);
}

function promiseUnwrap(deferred, x) {

    if (x === deferred.promise)
        throw new TypeError("Promise cannot wrap itself");
    
    if (isPromise(x))
        promiseChain(x, deferred.resolve, deferred.reject);
    else
        deferred.resolve(x);
}

function promiseReact(deferred, handler, x) {

    enqueueMicrotask((function($) {
    
        try { promiseUnwrap(deferred, handler(x)) } 
        catch(e) { try { deferred.reject(e) } catch (e) { } }
    }));
}

var Promise = _es6now.Class(function(__super) { return {

    constructor: function Promise(init) { var __this = this; 
    
        if (typeof init !== "function")
            throw new TypeError("Promise constructor called without initializer");
        
        this[$value] = void 0;
        this[$status] = "pending";
        this[$onResolve] = [];
        this[$onReject] = [];
    
        var resolve = (function(x) { return promiseResolve(__this, x); }),
            reject = (function(r) { return promiseReject(__this, r); });
        
        try { init(resolve, reject) } catch (x) { reject(x) }
    },
    
    chain: function(onResolve, onReject) {
    
        return promiseChain(this, onResolve, onReject);
    },
    
    then: function(onResolve, onReject) {

        if (typeof onResolve !== "function") onResolve = (function(x) { return x; });
        
        return promiseChain(this, (function(x) {
    
            if (x && typeof x === "object") {
            
                var maybeThen = x.then;
                
                if (typeof maybeThen === "function")
                    return maybeThen.call(x, onResolve, onReject);
            }
                        
            return onResolve(x);
        
        }), onReject);
        
    },
    
    catch: function(onReject) {
    
        return this.then(void 0, onReject);
    },
    
    __static_0: { defer: function() {
    
        return promiseDefer(this);
    } },
    
    __static_1: { accept: function(x) {
    
        var d = promiseDefer(this);
        d.resolve(x);
        return d.promise;
    } },
    
    __static_2: { resolve: function(x) { 
    
        if (isPromise(x))
            return x;
            
        var d = promiseDefer(this);
        d.resolve(x);
        return d.promise;
    } },
    
    __static_3: { reject: function(x) { 
    
        var d = promiseDefer(this);
        d.reject(x);
        return d.promise;
    } },

    __static_4: { all: function(values) {

        // TODO: We should be getting an iterator from values
        
        var deferred = promiseDefer(this),
            count = values.length,
            resolutions = [];
            
        try {
        
            if (!Array.isArray(values))
                throw new Error("Invalid argument");
        
            var count = values.length;
        
            if (count === 0) {
        
                deferred.resolve(resolutions);
            
            } else {
        
                for (var i = 0; i < values.length; ++i)
                    this.resolve(values[i]).then(onResolve(i), deferred.reject);
            }
            
        } catch(x) { deferred.reject(x) }
        
        return deferred.promise;
        
        function onResolve(i) {
    
            return (function(x) {
        
                resolutions[i] = x;
            
                if (--count === 0)
                    deferred.resolve(resolutions);
            });
        }
    } },
    
    __static_5: { race: function(values) {
    
        // TODO: We should be getting an iterator from values
        
        var deferred = promiseDefer(this);
        
        try {
        
            if (!Array.isArray(values))
                throw new Error("Invalid argument");
            
            for (var i = 0; i < values.length; ++i)
                this.resolve(values[i]).then(deferred.resolve, deferred.reject);
        
        } catch(x) { deferred.reject(x) }
        
        return deferred.promise;
    } }
    
} });

Promise.prototype[$$isPromise] = true;

if (this.Promise === void 0)
    this.Promise = Promise;


}).call(this);

(function() {

_es6now.async = function(iterable) {
    
    var iter = _es6now.iterator(iterable),
        resolver,
        promise;
    
    promise = new Promise((function(resolve, reject) { return resolver = { resolve: resolve, reject: reject }; }));
    resume(void 0, false);
    return promise;
    
    function resume(value, error) {
    
        if (error && !("throw" in iter))
            return resolver.reject(value);
        
        try {
        
            // Invoke the iterator/generator
            var result = error ? iter.throw(value) : iter.next(value),
                value = Promise.resolve(result.value),
                done = result.done;
            
            if (result.done)
                value.chain(resolver.resolve, resolver.reject);
            else
                value.chain((function(x) { return resume(x, false); }), (function(x) { return resume(x, true); }));
            
        } catch (x) { resolver.reject(x) }
        
    }
};


}).call(this);

var AsyncFS_ = (function(exports) { 

var FS = require("fs");

// Wraps a standard Node async function with a promise
// generating function
function wrap(fn) {

	return function() { var args = _es6now.rest(arguments, 0); 
	
		return new Promise((function(resolve, reject) {
		    
            args.push((function(err, data) {
        
                if (err) reject(err);
                else resolve(data);
            }));
            
            fn.apply(null, args);
        }));
	};
}

function exists(path) {

    return new Promise((function(resolve) {
    
        FS.exists(path, (function(result) { return resolve(result); }));
    }));
}

var 
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



exports.exists = exists; exports.readFile = readFile; exports.close = close; exports.open = open; exports.read = read; exports.write = write; exports.rename = rename; exports.truncate = truncate; exports.rmdir = rmdir; exports.fsync = fsync; exports.mkdir = mkdir; exports.sendfile = sendfile; exports.readdir = readdir; exports.fstat = fstat; exports.lstat = lstat; exports.stat = stat; exports.readlink = readlink; exports.symlink = symlink; exports.link = link; exports.unlink = unlink; exports.fchmod = fchmod; exports.lchmod = lchmod; exports.chmod = chmod; exports.lchown = lchown; exports.fchown = fchown; exports.chown = chown; exports.utimes = utimes; exports.futimes = futimes; exports.writeFile = writeFile; exports.appendFile = appendFile; exports.realpath = realpath; return exports; }).call(this, {});

var Runtime_ = (function(exports) { 

var ES6 = 

"var global = this, \n\
    arraySlice = Array.prototype.slice,\n\
    toString = Object.prototype.toString;\n\
\n\
// === Symbols ===\n\
\n\
var symbolCounter = 0;\n\
\n\
function fakeSymbol() {\n\
\n\
    return \"__$\" + Math.floor(Math.random() * 1e9) + \"$\" + (++symbolCounter) + \"$__\";\n\
}\n\
\n\
// NOTE:  As of Node 0.11.12, V8's Symbol implementation is a little wonky.\n\
// There is no Object.getOwnPropertySymbols, so reflection doesn't seem to\n\
// work like it should.  Furthermore, Node blows up when trying to inspect\n\
// Symbol objects.  We expect to replace this override when V8's symbols\n\
// catch up with the ES6 specification.\n\
\n\
this.Symbol = fakeSymbol;\n\
\n\
Symbol.iterator = Symbol(\"iterator\");\n\
\n\
// Support for iterator protocol\n\
_es6now.iterator = function(obj) {\n\
\n\
    if (global.Symbol && Symbol.iterator && obj[Symbol.iterator] !== void 0)\n\
        return obj[Symbol.iterator]();\n\
    \n\
    if (Array.isArray(obj))\n\
        return obj.values();\n\
    \n\
    return obj;\n\
};\n\
\n\
// Support for computed property names\n\
_es6now.computed = function(obj) {\n\
\n\
    var name, desc, i;\n\
    \n\
    for (i = 1; i < arguments.length; ++i) {\n\
    \n\
        name = \"__$\" + (i - 1);\n\
        desc = Object.getOwnPropertyDescriptor(obj, name);\n\
        \n\
        if (!desc)\n\
            continue;\n\
        \n\
        Object.defineProperty(obj, arguments[i], desc);\n\
        delete obj[name];\n\
    }\n\
    \n\
    return obj;\n\
};\n\
\n\
// Support for rest parameters\n\
_es6now.rest = function(args, pos) {\n\
\n\
    return arraySlice.call(args, pos);\n\
};\n\
\n\
// Support for tagged templates\n\
_es6now.templateSite = function(values, raw) {\n\
\n\
    values.raw = raw || values;\n\
    return values;\n\
};\n\
\n\
// Support for destructuring\n\
_es6now.path = function(obj, path, def) {\n\
\n\
    if (!path)\n\
        return obj;\n\
    \n\
    for (var i = 0; i < path.length; ++i) {\n\
    \n\
        if (!obj || typeof obj !== \"object\")\n\
            throw new TypeError();\n\
                \n\
        obj = obj[path[i]];\n\
    }\n\
    \n\
    return obj === void 0 ? def : obj;\n\
};\n\
\n\
// Throws an error if the argument is not an object\n\
_es6now.obj = function(obj) {\n\
\n\
    if (!obj || typeof obj !== \"object\")\n\
        throw new TypeError();\n\
    \n\
    return obj;\n\
};\n\
\n\
function eachKey(obj, fn) {\n\
\n\
    var keys = Object.getOwnPropertyNames(obj),\n\
        i;\n\
    \n\
    for (i = 0; i < keys.length; ++i)\n\
        fn(keys[i]);\n\
    \n\
    if (!Object.getOwnPropertySymbols)\n\
        return;\n\
    \n\
    keys = Object.getOwnPropertySymbols(obj);\n\
    \n\
    for (i = 0; i < keys.length; ++i)\n\
        fn(keys[i]);\n\
}\n\
\n\
function addMethods(obj, methods) {\n\
\n\
    eachKey(methods, key => {\n\
    \n\
        if (key in obj)\n\
            return;\n\
        \n\
        Object.defineProperty(obj, key, {\n\
        \n\
            value: methods[key],\n\
            configurable: true,\n\
            enumerable: false,\n\
            writable: true\n\
        });\n\
    });\n\
}\n\
\n\
\n\
// === Object ===\n\
\n\
addMethods(Object, {\n\
\n\
    is(left, right) {\n\
    \n\
        if (left === right)\n\
            return left !== 0 || 1 / left === 1 / right;\n\
        \n\
        return left !== left && right !== right;\n\
    },\n\
    \n\
    // TODO: Multiple sources\n\
    assign(target, source) {\n\
    \n\
        Object.keys(source).forEach(key => target[key] = source[key]);\n\
        return target;\n\
    }\n\
    \n\
});\n\
\n\
// === Number ===\n\
\n\
addMethods(Number, {\n\
\n\
    EPSILON: ($=> {\n\
    \n\
        var next, result;\n\
        \n\
        for (next = 1; 1 + next !== 1; next = next / 2)\n\
            result = next;\n\
        \n\
        return result;\n\
        \n\
    })(),\n\
    \n\
    MAX_SAFE_INTEGER: 9007199254740992,\n\
    \n\
    MIN_SAFE_INTEGER: -9007199254740991,\n\
    \n\
    isInteger(val) { return typeof val === \"number\" && val | 0 === val },\n\
    \n\
    isFinite(val) { return typeof val === \"number\" && global.isFinite(val) },\n\
    \n\
    isNaN(val) { return val !== val },\n\
    \n\
    isSafeInteger(val) { return Number.isInteger(val) && Math.abs(val) <= Number.MAX_SAFE_INTEGER }\n\
    \n\
});\n\
\n\
// === String === \n\
\n\
addMethods(String, {\n\
\n\
    raw(callsite, ...args) {\n\
    \n\
        var raw = callsite.raw,\n\
            len = raw.length >>> 0;\n\
        \n\
        if (len === 0)\n\
            return \"\";\n\
            \n\
        var s = \"\", i = 0;\n\
        \n\
        while (true) {\n\
        \n\
            s += raw[i];\n\
        \n\
            if (i + 1 === len)\n\
                return s;\n\
        \n\
            s += args[i++];\n\
        }\n\
    }\n\
    \n\
    // TODO:  fromCodePoint\n\
    \n\
});\n\
\n\
addMethods(String.prototype, {\n\
    \n\
    repeat(count) {\n\
    \n\
        if (this == null)\n\
            throw TypeError();\n\
        \n\
        var n = count ? Number(count) : 0;\n\
        \n\
        if (isNaN(n))\n\
            n = 0;\n\
        \n\
        // Account for out-of-bounds indices\n\
        if (n < 0 || n == Infinity)\n\
            throw RangeError();\n\
        \n\
        if (n == 0)\n\
            return \"\";\n\
            \n\
        var result = \"\";\n\
        \n\
        while (n--)\n\
            result += this;\n\
        \n\
        return result;\n\
    },\n\
    \n\
    startsWith(search) {\n\
    \n\
        var string = String(this);\n\
        \n\
        if (this == null || toString.call(search) == \"[object RegExp]\")\n\
            throw TypeError();\n\
            \n\
        var stringLength = this.length,\n\
            searchString = String(search),\n\
            searchLength = searchString.length,\n\
            position = arguments.length > 1 ? arguments[1] : undefined,\n\
            pos = position ? Number(position) : 0;\n\
            \n\
        if (isNaN(pos))\n\
            pos = 0;\n\
        \n\
        var start = Math.min(Math.max(pos, 0), stringLength);\n\
        \n\
        return this.indexOf(searchString, pos) == start;\n\
    },\n\
    \n\
    endsWith(search) {\n\
    \n\
        if (this == null || toString.call(search) == '[object RegExp]')\n\
            throw TypeError();\n\
        \n\
        var stringLength = this.length,\n\
            searchString = String(search),\n\
            searchLength = searchString.length,\n\
            pos = stringLength;\n\
        \n\
        if (arguments.length > 1) {\n\
        \n\
            var position = arguments[1];\n\
        \n\
            if (position !== undefined) {\n\
        \n\
                pos = position ? Number(position) : 0;\n\
                \n\
                if (isNaN(pos))\n\
                    pos = 0;\n\
            }\n\
        }\n\
        \n\
        var end = Math.min(Math.max(pos, 0), stringLength),\n\
            start = end - searchLength;\n\
        \n\
        if (start < 0)\n\
            return false;\n\
            \n\
        return this.lastIndexOf(searchString, start) == start;\n\
    },\n\
    \n\
    contains(search) {\n\
    \n\
        if (this == null)\n\
            throw TypeError();\n\
            \n\
        var stringLength = this.length,\n\
            searchString = String(search),\n\
            searchLength = searchString.length,\n\
            position = arguments.length > 1 ? arguments[1] : undefined,\n\
            pos = position ? Number(position) : 0;\n\
        \n\
        if (isNaN(pos))\n\
            pos = 0;\n\
            \n\
        var start = Math.min(Math.max(pos, 0), stringLength);\n\
        \n\
        return this.indexOf(string, searchString, pos) != -1;\n\
    }\n\
    \n\
    // TODO: codePointAt\n\
    \n\
});\n\
\n\
// === Array ===\n\
\n\
class ArrayIterator {\n\
\n\
    constructor(array, kind) {\n\
    \n\
        this.array = array;\n\
        this.current = 0;\n\
        this.kind = kind;\n\
    }\n\
    \n\
    next() {\n\
    \n\
        var length = this.array.length >>> 0,\n\
            index = this.current;\n\
        \n\
        if (index >= length) {\n\
        \n\
            this.current = Infinity;\n\
            return { value: void 0, done: true };\n\
        }\n\
        \n\
        this.current += 1;\n\
        \n\
        switch (this.kind) {\n\
        \n\
            case \"values\":\n\
                return { value: this.array[index], done: false };\n\
            \n\
            case \"entries\":\n\
                return { value: [ index, this.array[index] ], done: false };\n\
            \n\
            default:\n\
                return { value: index, done: false };\n\
        }\n\
    }\n\
    \n\
    [Symbol.iterator]() { return this }\n\
\n\
}\n\
\n\
addMethods(Array.prototype, {\n\
\n\
    values()  { return new ArrayIterator(this, \"values\") },\n\
    entries() { return new ArrayIterator(this, \"entries\") },\n\
    keys()    { return new ArrayIterator(this, \"keys\") },\n\
    [Symbol.iterator]() { return this.values() }\n\
});\n\
";

var Class = 

"var HOP = Object.prototype.hasOwnProperty,\n\
    STATIC = /^__static_/;\n\
\n\
// Returns true if the object has the specified property\n\
function hasOwn(obj, name) {\n\
\n\
    return HOP.call(obj, name);\n\
}\n\
\n\
// Returns true if the object has the specified property in\n\
// its prototype chain\n\
function has(obj, name) {\n\
\n\
    for (; obj; obj = Object.getPrototypeOf(obj))\n\
        if (HOP.call(obj, name))\n\
            return true;\n\
    \n\
    return false;\n\
}\n\
\n\
// Iterates over the descriptors for each own property of an object\n\
function forEachDesc(obj, fn) {\n\
\n\
    var names = Object.getOwnPropertyNames(obj), i;\n\
    \n\
    for (i = 0; i < names.length; ++i)\n\
        fn(names[i], Object.getOwnPropertyDescriptor(obj, names[i]));\n\
    \n\
    if (Object.getOwnPropertySymbols) {\n\
    \n\
        names = Object.getOwnPropertySymbols(obj);\n\
        \n\
        for (i = 0; i < names.length; ++i)\n\
            fn(names[i], Object.getOwnPropertyDescriptor(obj, names[i]));\n\
    }\n\
    \n\
    return obj;\n\
}\n\
\n\
// Performs copy-based inheritance\n\
function inherit(to, from) {\n\
\n\
    for (; from; from = Object.getPrototypeOf(from)) {\n\
    \n\
        forEachDesc(from, (name, desc) => {\n\
        \n\
            if (!has(to, name))\n\
                Object.defineProperty(to, name, desc);\n\
        });\n\
    }\n\
    \n\
    return to;\n\
}\n\
\n\
function defineMethods(to, from) {\n\
\n\
    forEachDesc(from, (name, desc) => {\n\
    \n\
        if (typeof name !== \"string\" || !STATIC.test(name))\n\
            Object.defineProperty(to, name, desc);\n\
    });\n\
}\n\
\n\
function defineStatic(to, from) {\n\
\n\
    forEachDesc(from, (name, desc) => {\n\
    \n\
        if (typeof name === \"string\" &&\n\
            STATIC.test(name) && \n\
            typeof desc.value === \"object\" && \n\
            desc.value) {\n\
            \n\
            defineMethods(to, desc.value);\n\
        }\n\
    });\n\
}\n\
\n\
function Class(base, def) {\n\
\n\
    var parent;\n\
    \n\
    if (def === void 0) {\n\
    \n\
        // If no base class is specified, then Object.prototype\n\
        // is the parent prototype\n\
        def = base;\n\
        base = null;\n\
        parent = Object.prototype;\n\
    \n\
    } else if (base === null) {\n\
    \n\
        // If the base is null, then then then the parent prototype is null\n\
        parent = null;\n\
        \n\
    } else if (typeof base === \"function\") {\n\
    \n\
        parent = base.prototype;\n\
        \n\
        // Prototype must be null or an object\n\
        if (parent !== null && Object(parent) !== parent)\n\
            parent = void 0;\n\
    }\n\
    \n\
    if (parent === void 0)\n\
        throw new TypeError();\n\
    \n\
    // Generate the method collection, closing over \"__super\"\n\
    var proto = Object.create(parent),\n\
        props = def(parent),\n\
        constructor = props.constructor;\n\
    \n\
    if (!constructor)\n\
        throw new Error(\"No constructor specified.\");\n\
    \n\
    // Make constructor non-enumerable\n\
    // if none is provided\n\
    Object.defineProperty(props, \"constructor\", {\n\
    \n\
        enumerable: false,\n\
        writable: true,\n\
        configurable: true,\n\
        value: constructor\n\
    });\n\
    \n\
    // Set prototype methods\n\
    defineMethods(proto, props);\n\
    \n\
    // Set constructor's prototype\n\
    constructor.prototype = proto;\n\
    \n\
    // Set class \"static\" methods\n\
    defineStatic(constructor, props);\n\
    \n\
    // \"Inherit\" from base constructor\n\
    if (base) inherit(constructor, base);\n\
    \n\
    return constructor;\n\
}\n\
\n\
_es6now.Class = Class;\n\
";

var Promise = 

"var enqueueMicrotask = ($=> {\n\
\n\
    var window = this.window,\n\
        process = this.process,\n\
        msgChannel = null,\n\
        list = [];\n\
    \n\
    if (typeof setImmediate === \"function\") {\n\
    \n\
        return window ?\n\
            window.setImmediate.bind(window) :\n\
            setImmediate;\n\
    \n\
    } else if (process && typeof process.nextTick === \"function\") {\n\
    \n\
        return process.nextTick;\n\
        \n\
    } else if (window && window.MessageChannel) {\n\
        \n\
        msgChannel = new window.MessageChannel();\n\
        msgChannel.port1.onmessage = $=> { if (list.length) list.shift()(); };\n\
    \n\
        return fn => {\n\
        \n\
            list.push(fn);\n\
            msgChannel.port2.postMessage(0);\n\
        };\n\
    }\n\
    \n\
    return fn => setTimeout(fn, 0);\n\
\n\
})();\n\
\n\
// The following property names are used to simulate the internal data\n\
// slots that are defined for Promise objects.\n\
\n\
var $status = \"Promise#status\",\n\
    $value = \"Promise#value\",\n\
    $onResolve = \"Promise#onResolve\",\n\
    $onReject = \"Promise#onReject\";\n\
\n\
// The following property name is used to simulate the built-in symbol @@isPromise\n\
var $$isPromise = \"@@isPromise\";\n\
\n\
function isPromise(x) { \n\
\n\
    return !!x && $$isPromise in Object(x);\n\
}\n\
\n\
function promiseDefer(ctor) {\n\
\n\
    var d = {};\n\
\n\
    d.promise = new ctor((resolve, reject) => {\n\
        d.resolve = resolve;\n\
        d.reject = reject;\n\
    });\n\
\n\
    return d;\n\
}\n\
\n\
function promiseChain(promise, onResolve, onReject) {\n\
\n\
    if (typeof onResolve !== \"function\") onResolve = x => x;\n\
    if (typeof onReject !== \"function\") onReject = e => { throw e };\n\
\n\
    var deferred = promiseDefer(promise.constructor);\n\
    \n\
    if (typeof promise[$status] !== \"string\")\n\
        throw new TypeError(\"Promise method called on a non-promise\");\n\
\n\
    switch (promise[$status]) {\n\
\n\
        case \"pending\":\n\
            promise[$onResolve].push([deferred, onResolve]);\n\
            promise[$onReject].push([deferred, onReject]);\n\
            break;\n\
\n\
        case \"resolved\":\n\
            promiseReact(deferred, onResolve, promise[$value]);\n\
            break;\n\
    \n\
        case \"rejected\":\n\
            promiseReact(deferred, onReject, promise[$value]);\n\
            break;\n\
    }\n\
\n\
    return deferred.promise;\n\
}\n\
\n\
function promiseResolve(promise, x) {\n\
    \n\
    promiseDone(promise, \"resolved\", x, promise[$onResolve]);\n\
}\n\
\n\
function promiseReject(promise, x) {\n\
    \n\
    promiseDone(promise, \"rejected\", x, promise[$onReject]);\n\
}\n\
\n\
function promiseDone(promise, status, value, reactions) {\n\
\n\
    if (promise[$status] !== \"pending\") \n\
        return;\n\
        \n\
    promise[$status] = status;\n\
    promise[$value] = value;\n\
    promise[$onResolve] = promise[$onReject] = void 0;\n\
    \n\
    for (var i = 0; i < reactions.length; ++i) \n\
        promiseReact(reactions[i][0], reactions[i][1], value);\n\
}\n\
\n\
function promiseUnwrap(deferred, x) {\n\
\n\
    if (x === deferred.promise)\n\
        throw new TypeError(\"Promise cannot wrap itself\");\n\
    \n\
    if (isPromise(x))\n\
        promiseChain(x, deferred.resolve, deferred.reject);\n\
    else\n\
        deferred.resolve(x);\n\
}\n\
\n\
function promiseReact(deferred, handler, x) {\n\
\n\
    enqueueMicrotask($=> {\n\
    \n\
        try { promiseUnwrap(deferred, handler(x)) } \n\
        catch(e) { try { deferred.reject(e) } catch (e) { } }\n\
    });\n\
}\n\
\n\
class Promise {\n\
\n\
    constructor(init) {\n\
    \n\
        if (typeof init !== \"function\")\n\
            throw new TypeError(\"Promise constructor called without initializer\");\n\
        \n\
        this[$value] = void 0;\n\
        this[$status] = \"pending\";\n\
        this[$onResolve] = [];\n\
        this[$onReject] = [];\n\
    \n\
        var resolve = x => promiseResolve(this, x),\n\
            reject = r => promiseReject(this, r);\n\
        \n\
        try { init(resolve, reject) } catch (x) { reject(x) }\n\
    }\n\
    \n\
    chain(onResolve, onReject) {\n\
    \n\
        return promiseChain(this, onResolve, onReject);\n\
    }\n\
    \n\
    then(onResolve, onReject) {\n\
\n\
        if (typeof onResolve !== \"function\") onResolve = x => x;\n\
        \n\
        return promiseChain(this, x => {\n\
    \n\
            if (x && typeof x === \"object\") {\n\
            \n\
                var maybeThen = x.then;\n\
                \n\
                if (typeof maybeThen === \"function\")\n\
                    return maybeThen.call(x, onResolve, onReject);\n\
            }\n\
                        \n\
            return onResolve(x);\n\
        \n\
        }, onReject);\n\
        \n\
    }\n\
    \n\
    catch(onReject) {\n\
    \n\
        return this.then(void 0, onReject);\n\
    }\n\
    \n\
    static defer() {\n\
    \n\
        return promiseDefer(this);\n\
    }\n\
    \n\
    static accept(x) {\n\
    \n\
        var d = promiseDefer(this);\n\
        d.resolve(x);\n\
        return d.promise;\n\
    }\n\
    \n\
    static resolve(x) { \n\
    \n\
        if (isPromise(x))\n\
            return x;\n\
            \n\
        var d = promiseDefer(this);\n\
        d.resolve(x);\n\
        return d.promise;\n\
    }\n\
    \n\
    static reject(x) { \n\
    \n\
        var d = promiseDefer(this);\n\
        d.reject(x);\n\
        return d.promise;\n\
    }\n\
\n\
    static all(values) {\n\
\n\
        // TODO: We should be getting an iterator from values\n\
        \n\
        var deferred = promiseDefer(this),\n\
            count = values.length,\n\
            resolutions = [];\n\
            \n\
        try {\n\
        \n\
            if (!Array.isArray(values))\n\
                throw new Error(\"Invalid argument\");\n\
        \n\
            var count = values.length;\n\
        \n\
            if (count === 0) {\n\
        \n\
                deferred.resolve(resolutions);\n\
            \n\
            } else {\n\
        \n\
                for (var i = 0; i < values.length; ++i)\n\
                    this.resolve(values[i]).then(onResolve(i), deferred.reject);\n\
            }\n\
            \n\
        } catch(x) { deferred.reject(x) }\n\
        \n\
        return deferred.promise;\n\
        \n\
        function onResolve(i) {\n\
    \n\
            return x => {\n\
        \n\
                resolutions[i] = x;\n\
            \n\
                if (--count === 0)\n\
                    deferred.resolve(resolutions);\n\
            };\n\
        }\n\
    }\n\
    \n\
    static race(values) {\n\
    \n\
        // TODO: We should be getting an iterator from values\n\
        \n\
        var deferred = promiseDefer(this);\n\
        \n\
        try {\n\
        \n\
            if (!Array.isArray(values))\n\
                throw new Error(\"Invalid argument\");\n\
            \n\
            for (var i = 0; i < values.length; ++i)\n\
                this.resolve(values[i]).then(deferred.resolve, deferred.reject);\n\
        \n\
        } catch(x) { deferred.reject(x) }\n\
        \n\
        return deferred.promise;\n\
    }\n\
    \n\
}\n\
\n\
Promise.prototype[$$isPromise] = true;\n\
\n\
if (this.Promise === void 0)\n\
    this.Promise = Promise;\n\
";

var Async = 

"_es6now.async = function(iterable) {\n\
    \n\
    var iter = _es6now.iterator(iterable),\n\
        resolver,\n\
        promise;\n\
    \n\
    promise = new Promise((resolve, reject) => resolver = { resolve, reject });\n\
    resume(void 0, false);\n\
    return promise;\n\
    \n\
    function resume(value, error) {\n\
    \n\
        if (error && !(\"throw\" in iter))\n\
            return resolver.reject(value);\n\
        \n\
        try {\n\
        \n\
            // Invoke the iterator/generator\n\
            var result = error ? iter.throw(value) : iter.next(value),\n\
                value = Promise.resolve(result.value),\n\
                done = result.done;\n\
            \n\
            if (result.done)\n\
                value.chain(resolver.resolve, resolver.reject);\n\
            else\n\
                value.chain(x => resume(x, false), x => resume(x, true));\n\
            \n\
        } catch (x) { resolver.reject(x) }\n\
        \n\
    }\n\
};\n\
";



exports.ES6 = ES6; exports.Class = Class; exports.Promise = Promise; exports.Async = Async; return exports; }).call(this, {});

var AST_ = (function(exports) { 

/*

NOTE:  For auto-documentation purposes, the following conventions must be followed:

1)  The last parameters to each constructor function must always be "start"
    and "end", in that order.

2)  With the exception of "start" and "end", the order of constructor parameters
    must be identical to the order of property assignments within the constructor.

*/

/*

NOTE: We forego using classes and class-based inheritance for the following reasons:

1)  super() is currently slow when using ES6 transpilers.
2)  Using object literal methods allows us to easily iterated over all AST nodes
    from within this module.

*/

var AST = {
    
    Node: function(type, start, end) {

        this.type = type; // (string) The node type
        this.start = start;
        this.end = end;
    },
    
    Identifier: function(value, context, start, end) { 

        this.type = "Identifier";
        this.start = start;
        this.end = end;
        this.value = value; // (string) The string value of the identifier
        this.context = context; // (string) The context in which the identifier appears ("", "variable", "declaration")
    },

    // A number literal
    NumberLiteral: function(value, start, end) {
    
        this.type = "NumberLiteral";
        this.start = start;
        this.end = end;
        this.value = value; // (number) The mathmatical value of the number literal
    },

    // A string literal
    StringLiteral: function(value, start, end) {

        this.type = "StringLiteral";
        this.start = start;
        this.end = end;
        this.value = value; // (string) The value of the string literal
    },

    TemplatePart: function(value, raw, isEnd, start, end) {
    
        this.type = "TemplatePart";
        this.start = start;
        this.end = end;
        this.value = value; // (string) The string value of the template fragment
        this.raw = raw;
        this.templateEnd = isEnd; // (boolean) True if this template fragment terminates the template literal
    },

    RegularExpression: function(value, flags, start, end) {
    
        this.type = "RegularExpression";
        this.start = start;
        this.end = end;
        this.value = value; // (string) The raw value of the regular expression literal
        this.flags = flags; // (string) The set of flags for the regular expression literal
    },

    BooleanLiteral: function(value, start, end) {
    
        this.type = "BooleanLiteral";
        this.start = start;
        this.end = end;
        this.value = value; // (boolean) The value of the boolean literal
    },
    
    NullLiteral: function(start, end) { 

        this.type = "NullLiteral";
        this.start = start;
        this.end = end;
    },

    Script: function(statements, start, end) {
    
        this.type = "Script";
        this.start = start;
        this.end = end;
        this.statements = statements; // [Node] A list of statements
    },

    Module: function(statements, start, end) {

        this.type = "Module";
        this.start = start;
        this.end = end;
        this.statements = statements; // [Node] A list of statements
    },

    ThisExpression: function(start, end) { 

        this.type = "ThisExpression";
        this.start = start;
        this.end = end;
    },

    SuperExpression: function(start, end) { 

        this.type = "SuperExpression";
        this.start = start;
        this.end = end;
    },

    SequenceExpression: function(list, start, end) {

        this.type = "SequenceExpression";
        this.start = start;
        this.end = end;
        this.expressions = list; // [Node] A list of expressions
    },

    AssignmentExpression: function(op, left, right, start, end) {
    
        this.type = "AssignmentExpression";
        this.start = start;
        this.end = end;
        this.operator = op; // (string) An assignment operator
        this.left = left; // The left-hand-side of the assignment operator
        this.right = right; // The right-hand-side of the assignment operator
    },

    SpreadExpression: function(expr, start, end) {
    
        this.type = "SpreadExpression";
        this.start = start;
        this.end = end;
        this.expression = expr; // An expression
    },

    YieldExpression: function(expr, delegate, start, end) {
    
        this.type = "YieldExpression";
        this.start = start;
        this.end = end;
        this.delegate = delegate; // (boolean) True if the yield expression is delegating
        this.expression = expr; // An expression
    },

    ConditionalExpression: function(test, cons, alt, start, end) {
    
        this.type = "ConditionalExpression";
        this.start = start;
        this.end = end;
        this.test = test; // A test expression
        this.consequent = cons; // The expression evaluated if the test passes
        this.alternate = alt; // The expression evaluated if the test fails
    },

    BinaryExpression: function(op, left, right, start, end) {
    
        this.type = "BinaryExpression";
        this.start = start;
        this.end = end;
        this.operator = op; // (string) A binary operator
        this.left = left; // The left operand expression
        this.right = right; // The right operand expression
    },

    UpdateExpression: function(op, expr, prefix, start, end) {
    
        this.type = "UpdateExpression";
        this.start = start;
        this.end = end;
        this.operator = op; // (string) An update operator
        this.expression = expr; // An expression
        this.prefix = prefix; // (boolean) True if the operator is a prefix
    },

    UnaryExpression: function(op, expr, start, end) {
    
        this.type = "UnaryExpression";
        this.start = start;
        this.end = end;
        this.operator = op; // (string) A unary operator
        this.expression = expr; // An expression
    },

    MemberExpression: function(obj, prop, computed, start, end) {
    
        this.type = "MemberExpression";
        this.start = start;
        this.end = end;
        this.object = obj; // An expression evaulating to an object
        this.property = prop; // An expression evaluating to a property name
        this.computed = computed; // (boolean) True if the property name is computed
    },

    CallExpression: function(callee, args, start, end) {
    
        this.type = "CallExpression";
        this.start = start;
        this.end = end;
        this.callee = callee; // An expression
        this.arguments = args; // [Node] A list of call arguments
    },

    TaggedTemplateExpression: function(tag, template, start, end) {
    
        this.type = "TaggedTemplateExpression";
        this.start = start;
        this.end = end;
        this.tag = tag; // The template tag
        this.template = template; // (TemplateExpression) A template
    },

    NewExpression: function(callee, args, start, end) {
    
        this.type = "NewExpression";
        this.start = start;
        this.end = end;
        this.callee = callee; // An expression
        this.arguments = args; // [Node] A list of call arguments
    },

    ParenExpression: function(expr, start, end) {
    
        this.type = "ParenExpression";
        this.start = start;
        this.end = end;
        this.expression = expr; // An expression contained within parenthesis
    },

    ObjectLiteral: function(props, start, end) {
    
        this.type = "ObjectLiteral";
        this.start = start;
        this.end = end;
        this.properties = props; // [PropertyDefinition|MethodDefinition] A list of properties and methods defined in the object literal
    },

    ComputedPropertyName: function(expr, start, end) {
    
        this.type = "ComputedPropertyName";
        this.start = start;
        this.end = end;
        this.expression = expr; // An expression
    },

    PropertyDefinition: function(name, expr, start, end) {
    
        this.type = "PropertyDefinition";
        this.start = start;
        this.end = end;
        this.name = name; // (StringLiteral|NumberLiteral|Identifier|ComputedPropertyName) The property name
        this.expression = expr; // (Node?) An expression
    },

    ObjectPattern: function(props, start, end) {
        
        this.type = "ObjectPattern";
        this.start = start;
        this.end = end;
        this.properties = props; // [PatternProperty] A list of destructuring pattern properties
    },
    
    PatternProperty: function(name, pattern, initializer, start, end) {
    
        this.type = "PatternProperty";
        this.start = start;
        this.end = end;
        this.name = name; // The destructuring property name
        this.pattern = pattern; // (Node?) A destructuring target pattern
        this.initializer = initializer; // (Node?) A default initializer expression
    },

    ArrayPattern: function(elements, start, end) {
    
        this.type = "ArrayPattern";
        this.start = start;
        this.end = end;
        this.elements = elements; // [PatternElement|PatternRestElement] A list of of destructuring pattern elements
    },
    
    PatternElement: function(pattern, initializer, start, end) {
    
        this.type = "PatternElement";
        this.start = start;
        this.end = end;
        this.pattern = pattern; // A destructuring target pattern
        this.initializer = initializer; // (Node?) A default initializer expression
    },
    
    PatternRestElement: function(pattern, start, end) {
    
        this.type = "PatternRestElement";
        this.start = start;
        this.end = end;
        this.pattern = pattern; // A destructuring target
    },

    MethodDefinition: function(kind, name, params, body, start, end) {
    
        this.type = "MethodDefinition";
        this.start = start;
        this.end = end;
        this.kind = kind; // (string) The type of method
        this.name = name; // The method name
        this.params = params; // [FormalParameter] A list of formal parameters
        this.body = body; // (FunctionBody) The function body
    },

    ArrayLiteral: function(elements, start, end) {
    
        this.type = "ArrayLiteral";
        this.start = start;
        this.end = end;
        this.elements = elements; // [Node|null]
    },

    ArrayComprehension: function(qualifiers, expr, start, end) {
    
        this.type = "ArrayComprehension";
        this.start = start;
        this.end = end;
        this.qualifiers = qualifiers;
        this.expression = expr;
    },

    GeneratorComprehension: function(qualifiers, expr, start, end) {
    
        this.type = "GeneratorComprehension";
        this.start = start;
        this.end = end;
        this.qualifiers = qualifiers;
        this.expression = expr;
    },

    ComprehensionFor: function(left, right, start, end) {
    
        this.type = "ComprehensionFor";
        this.start = start;
        this.end = end;
        this.left = left;
        this.right = right;
    },

    ComprehensionIf: function(test, start, end) {
    
        this.type = "ComprehensionIf";
        this.start = start;
        this.end = end;
        this.test = test;
    },

    TemplateExpression: function(lits, subs, start, end) {
    
        this.type = "TemplateExpression";
        this.start = start;
        this.end = end;
        this.literals = lits;
        this.substitutions = subs;
    },

    Block: function(statements, start, end) {
    
        this.type = "Block";
        this.start = start;
        this.end = end;
        this.statements = statements;
    },

    LabelledStatement: function(label, statement, start, end) {
    
        this.type = "LabelledStatement";
        this.start = start;
        this.end = end;
        this.label = label;
        this.statement = statement;
    },

    ExpressionStatement: function(expr, start, end) {
    
        this.type = "ExpressionStatement";
        this.start = start;
        this.end = end;
        this.expression = expr;
    },

    EmptyStatement: function(start, end) { 

        this.type = "EmptyStatement";
        this.start = start;
        this.end = end;
    },

    VariableDeclaration: function(kind, list, start, end) {
    
        this.type = "VariableDeclaration";
        this.start = start;
        this.end = end;
        this.kind = kind;
        this.declarations = list;
    },

    VariableDeclarator: function(pattern, initializer, start, end) {
    
        this.type = "VariableDeclarator";
        this.start = start;
        this.end = end;
        this.pattern = pattern;
        this.initializer = initializer;
    },

    ReturnStatement: function(arg, start, end) {
    
        this.type = "ReturnStatement";
        this.start = start;
        this.end = end;
        this.argument = arg;
    },

    BreakStatement: function(label, start, end) {
    
        this.type = "BreakStatement";
        this.start = start;
        this.end = end;
        this.label = label;
    },

    ContinueStatement: function(label, start, end) {
    
        this.type = "ContinueStatement";
        this.start = start;
        this.end = end;
        this.label = label;
    },

    ThrowStatement: function(expr, start, end) {
    
        this.type = "ThrowStatement";
        this.start = start;
        this.end = end;
        this.expression = expr;
    },

    DebuggerStatement: function(start, end) {
    
        this.type = "DebuggerStatement";
        this.start = start;
        this.end = end;
    },

    IfStatement: function(test, cons, alt, start, end) {
    
        this.type = "IfStatement";
        this.start = start;
        this.end = end;
        this.test = test;
        this.consequent = cons;
        this.alternate = alt;
    },

    DoWhileStatement: function(body, test, start, end) {
    
        this.type = "DoWhileStatement";
        this.start = start;
        this.end = end;
        this.body = body;
        this.test = test;
    },

    WhileStatement: function(test, body, start, end) {
    
        this.type = "WhileStatement";
        this.start = start;
        this.end = end;
        this.test = test;
        this.body = body;
    },

    ForStatement: function(initializer, test, update, body, start, end) {
    
        this.type = "ForStatement";
        this.start = start;
        this.end = end;
        this.initializer = initializer;
        this.test = test;
        this.update = update;
        this.body = body;
    },

    ForInStatement: function(left, right, body, start, end) {
    
        this.type = "ForInStatement";
        this.start = start;
        this.end = end;
        this.left = left;
        this.right = right;
        this.body = body;
    },

    ForOfStatement: function(left, right, body, start, end) {
    
        this.type = "ForOfStatement";
        this.start = start;
        this.end = end;
        this.left = left;
        this.right = right;
        this.body = body;
    },

    WithStatement: function(object, body, start, end) {
    
        this.type = "WithStatement";
        this.start = start;
        this.end = end;
        this.object = object;
        this.body = body;
    },

    SwitchStatement: function(desc, cases, start, end) {
    
        this.type = "SwitchStatement";
        this.start = start;
        this.end = end;
        this.descriminant = desc;
        this.cases = cases;
    },

    SwitchCase: function(test, cons, start, end) {
    
        this.type = "SwitchCase";
        this.start = start;
        this.end = end;
        this.test = test;
        this.consequent = cons;
    },

    TryStatement: function(block, handler, fin, start, end) {
    
        this.type = "TryStatement";
        this.start = start;
        this.end = end;
        this.block = block;
        this.handler = handler;
        this.finalizer = fin;
    },

    CatchClause: function(param, body, start, end) {
    
        this.type = "CatchClause";
        this.start = start;
        this.end = end;
        this.param = param;
        this.body = body;
    },

    FunctionDeclaration: function(kind, identifier, params, body, start, end) {
    
        this.type = "FunctionDeclaration";
        this.start = start;
        this.end = end;
        this.kind = kind;
        this.identifier = identifier;
        this.params = params;
        this.body = body;
    },

    FunctionExpression: function(kind, identifier, params, body, start, end) {
    
        this.type = "FunctionExpression";
        this.start = start;
        this.end = end;
        this.kind = kind;
        this.identifier = identifier;
        this.params = params;
        this.body = body;
    },

    FormalParameter: function(pattern, initializer, start, end) {
    
        this.type = "FormalParameter";
        this.start = start;
        this.end = end;
        this.pattern = pattern;
        this.initializer = initializer;
    },

    RestParameter: function(identifier, start, end) {
    
        this.type = "RestParameter";
        this.start = start;
        this.end = end;
        this.identifier = identifier;
    },

    FunctionBody: function(statements, start, end) {
    
        this.type = "FunctionBody";
        this.start = start;
        this.end = end;
        this.statements = statements;
    },

    ArrowFunctionHead: function(params, start, end) {
    
        this.type = "ArrowFunctionHead";
        this.start = start;
        this.end = end;
        this.parameters = params;
    },

    ArrowFunction: function(kind, params, body, start, end) {
    
        this.type = "ArrowFunction";
        this.start = start;
        this.end = end;
        this.kind = kind;
        this.params = params;
        this.body = body;
    },

    ClassDeclaration: function(identifier, base, body, start, end) {
    
        this.type = "ClassDeclaration";
        this.start = start;
        this.end = end;
        this.identifier = identifier;
        this.base = base;
        this.body = body;
    },

    ClassExpression: function(identifier, base, body, start, end) {
    
        this.type = "ClassExpression";
        this.start = start;
        this.end = end;
        this.identifier = identifier;
        this.base = base;
        this.body = body;
    },

    ClassBody: function(elems, start, end) {
    
        this.type = "ClassBody";
        this.start = start;
        this.end = end;
        this.elements = elems;
    },

    ClassElement: function(isStatic, method, start, end) {
    
        this.type = "ClassElement";
        this.start = start;
        this.end = end;
        this.static = isStatic;
        this.method = method;
    },
    
    ModuleDeclaration: function(identifier, body, start, end) {
    
        this.type = "ModuleDeclaration";
        this.start = start;
        this.end = end;
        this.identifier = identifier;
        this.body = body;
    },

    ModuleBody: function(statements, start, end) {
    
        this.type = "ModuleBody";
        this.start = start;
        this.end = end;
        this.statements = statements;
    },

    ModuleImport: function(identifier, from, start, end) {
    
        this.type = "ModuleImport";
        this.start = start;
        this.end = end;
        this.identifier = identifier;
        this.from = from;
    },

    ModuleAlias: function(identifier, path, start, end) {
    
        this.type = "ModuleAlias";
        this.start = start;
        this.end = end;
        this.identifier = identifier;
        this.path = path;
    },

    ImportDefaultDeclaration: function(ident, from, start, end) {
    
        this.type = "ImportDefaultDeclaration";
        this.start = start;
        this.end = end;
        this.identifier = ident;
        this.from = from;
    },

    ImportDeclaration: function(specifiers, from, start, end) {
    
        this.type = "ImportDeclaration";
        this.start = start;
        this.end = end;
        this.specifiers = specifiers;
        this.from = from;
    },

    ImportSpecifier: function(imported, local, start, end) {
    
        this.type = "ImportSpecifier";
        this.start = start;
        this.end = end;
        this.imported = imported;
        this.local = local;
    },

    ExportDeclaration: function(declaration, start, end) {
    
        this.type = "ExportDeclaration";
        this.start = start;
        this.end = end;
        this.declaration = declaration;
    },

    ExportsList: function(list, from, start, end) {
    
        this.type = "ExportsList";
        this.start = start;
        this.end = end;
        this.specifiers = list;
        this.from = from;
    },

    ExportSpecifier: function(local, exported, start, end) {
    
        this.type = "ExportSpecifier";
        this.start = start;
        this.end = end;
        this.local = local;
        this.exported = exported;
    },

    ModulePath: function(list, start, end) {
    
        this.type = "ModulePath";
        this.start = start;
        this.end = end;
        this.elements = list;
    }

};

function isNode(x) {

    return x !== null && typeof x === "object" && typeof x.type === "string";
}

var NodeBase = _es6now.Class(function(__super) { return {

    children: function() { var __this = this; 
    
        var list = [];
        
        Object.keys(this).forEach((function(k) {
        
            // Don't iterate over backlinks to parent node
            if (k === "parent")
                return;
            
            var value = __this[k];
            
            if (Array.isArray(value))
                value.forEach((function(x) { if (isNode(x)) list.push(x) }));
            else if (isNode(value))
                list.push(value);
        }));
        
        return list;
    }, constructor: function NodeBase() {}
} });

Object.keys(AST).forEach((function(k) { return AST[k].prototype = NodeBase.prototype; }));


exports.AST = AST; return exports; }).call(this, {});

var UnicodeData = (function(exports) { 

// Unicode 6.3.0 | 2013-09-25, 18:58:50 GMT [MD]

var IDENTIFIER = [
    36,0,2,
    48,9,3,
    65,25,2,
    95,0,2,
    97,25,2,
    170,0,2,
    181,0,2,
    183,0,3,
    186,0,2,
    192,22,2,
    216,30,2,
    248,457,2,
    710,11,2,
    736,4,2,
    748,0,2,
    750,0,2,
    768,111,3,
    880,4,2,
    886,1,2,
    890,3,2,
    902,0,2,
    903,0,3,
    904,2,2,
    908,0,2,
    910,19,2,
    931,82,2,
    1015,138,2,
    1155,4,3,
    1162,157,2,
    1329,37,2,
    1369,0,2,
    1377,38,2,
    1425,44,3,
    1471,0,3,
    1473,1,3,
    1476,1,3,
    1479,0,3,
    1488,26,2,
    1520,2,2,
    1552,10,3,
    1568,42,2,
    1611,30,3,
    1646,1,2,
    1648,0,3,
    1649,98,2,
    1749,0,2,
    1750,6,3,
    1759,5,3,
    1765,1,2,
    1767,1,3,
    1770,3,3,
    1774,1,2,
    1776,9,3,
    1786,2,2,
    1791,0,2,
    1808,0,2,
    1809,0,3,
    1810,29,2,
    1840,26,3,
    1869,88,2,
    1958,10,3,
    1969,0,2,
    1984,9,3,
    1994,32,2,
    2027,8,3,
    2036,1,2,
    2042,0,2,
    2048,21,2,
    2070,3,3,
    2074,0,2,
    2075,8,3,
    2084,0,2,
    2085,2,3,
    2088,0,2,
    2089,4,3,
    2112,24,2,
    2137,2,3,
    2208,0,2,
    2210,10,2,
    2276,26,3,
    2304,3,3,
    2308,53,2,
    2362,2,3,
    2365,0,2,
    2366,17,3,
    2384,0,2,
    2385,6,3,
    2392,9,2,
    2402,1,3,
    2406,9,3,
    2417,6,2,
    2425,6,2,
    2433,2,3,
    2437,7,2,
    2447,1,2,
    2451,21,2,
    2474,6,2,
    2482,0,2,
    2486,3,2,
    2492,0,3,
    2493,0,2,
    2494,6,3,
    2503,1,3,
    2507,2,3,
    2510,0,2,
    2519,0,3,
    2524,1,2,
    2527,2,2,
    2530,1,3,
    2534,9,3,
    2544,1,2,
    2561,2,3,
    2565,5,2,
    2575,1,2,
    2579,21,2,
    2602,6,2,
    2610,1,2,
    2613,1,2,
    2616,1,2,
    2620,0,3,
    2622,4,3,
    2631,1,3,
    2635,2,3,
    2641,0,3,
    2649,3,2,
    2654,0,2,
    2662,11,3,
    2674,2,2,
    2677,0,3,
    2689,2,3,
    2693,8,2,
    2703,2,2,
    2707,21,2,
    2730,6,2,
    2738,1,2,
    2741,4,2,
    2748,0,3,
    2749,0,2,
    2750,7,3,
    2759,2,3,
    2763,2,3,
    2768,0,2,
    2784,1,2,
    2786,1,3,
    2790,9,3,
    2817,2,3,
    2821,7,2,
    2831,1,2,
    2835,21,2,
    2858,6,2,
    2866,1,2,
    2869,4,2,
    2876,0,3,
    2877,0,2,
    2878,6,3,
    2887,1,3,
    2891,2,3,
    2902,1,3,
    2908,1,2,
    2911,2,2,
    2914,1,3,
    2918,9,3,
    2929,0,2,
    2946,0,3,
    2947,0,2,
    2949,5,2,
    2958,2,2,
    2962,3,2,
    2969,1,2,
    2972,0,2,
    2974,1,2,
    2979,1,2,
    2984,2,2,
    2990,11,2,
    3006,4,3,
    3014,2,3,
    3018,3,3,
    3024,0,2,
    3031,0,3,
    3046,9,3,
    3073,2,3,
    3077,7,2,
    3086,2,2,
    3090,22,2,
    3114,9,2,
    3125,4,2,
    3133,0,2,
    3134,6,3,
    3142,2,3,
    3146,3,3,
    3157,1,3,
    3160,1,2,
    3168,1,2,
    3170,1,3,
    3174,9,3,
    3202,1,3,
    3205,7,2,
    3214,2,2,
    3218,22,2,
    3242,9,2,
    3253,4,2,
    3260,0,3,
    3261,0,2,
    3262,6,3,
    3270,2,3,
    3274,3,3,
    3285,1,3,
    3294,0,2,
    3296,1,2,
    3298,1,3,
    3302,9,3,
    3313,1,2,
    3330,1,3,
    3333,7,2,
    3342,2,2,
    3346,40,2,
    3389,0,2,
    3390,6,3,
    3398,2,3,
    3402,3,3,
    3406,0,2,
    3415,0,3,
    3424,1,2,
    3426,1,3,
    3430,9,3,
    3450,5,2,
    3458,1,3,
    3461,17,2,
    3482,23,2,
    3507,8,2,
    3517,0,2,
    3520,6,2,
    3530,0,3,
    3535,5,3,
    3542,0,3,
    3544,7,3,
    3570,1,3,
    3585,47,2,
    3633,0,3,
    3634,1,2,
    3636,6,3,
    3648,6,2,
    3655,7,3,
    3664,9,3,
    3713,1,2,
    3716,0,2,
    3719,1,2,
    3722,0,2,
    3725,0,2,
    3732,3,2,
    3737,6,2,
    3745,2,2,
    3749,0,2,
    3751,0,2,
    3754,1,2,
    3757,3,2,
    3761,0,3,
    3762,1,2,
    3764,5,3,
    3771,1,3,
    3773,0,2,
    3776,4,2,
    3782,0,2,
    3784,5,3,
    3792,9,3,
    3804,3,2,
    3840,0,2,
    3864,1,3,
    3872,9,3,
    3893,0,3,
    3895,0,3,
    3897,0,3,
    3902,1,3,
    3904,7,2,
    3913,35,2,
    3953,19,3,
    3974,1,3,
    3976,4,2,
    3981,10,3,
    3993,35,3,
    4038,0,3,
    4096,42,2,
    4139,19,3,
    4159,0,2,
    4160,9,3,
    4176,5,2,
    4182,3,3,
    4186,3,2,
    4190,2,3,
    4193,0,2,
    4194,2,3,
    4197,1,2,
    4199,6,3,
    4206,2,2,
    4209,3,3,
    4213,12,2,
    4226,11,3,
    4238,0,2,
    4239,14,3,
    4256,37,2,
    4295,0,2,
    4301,0,2,
    4304,42,2,
    4348,332,2,
    4682,3,2,
    4688,6,2,
    4696,0,2,
    4698,3,2,
    4704,40,2,
    4746,3,2,
    4752,32,2,
    4786,3,2,
    4792,6,2,
    4800,0,2,
    4802,3,2,
    4808,14,2,
    4824,56,2,
    4882,3,2,
    4888,66,2,
    4957,2,3,
    4969,8,3,
    4992,15,2,
    5024,84,2,
    5121,619,2,
    5743,16,2,
    5761,25,2,
    5792,74,2,
    5870,2,2,
    5888,12,2,
    5902,3,2,
    5906,2,3,
    5920,17,2,
    5938,2,3,
    5952,17,2,
    5970,1,3,
    5984,12,2,
    5998,2,2,
    6002,1,3,
    6016,51,2,
    6068,31,3,
    6103,0,2,
    6108,0,2,
    6109,0,3,
    6112,9,3,
    6155,2,3,
    6160,9,3,
    6176,87,2,
    6272,40,2,
    6313,0,3,
    6314,0,2,
    6320,69,2,
    6400,28,2,
    6432,11,3,
    6448,11,3,
    6470,9,3,
    6480,29,2,
    6512,4,2,
    6528,43,2,
    6576,16,3,
    6593,6,2,
    6600,1,3,
    6608,10,3,
    6656,22,2,
    6679,4,3,
    6688,52,2,
    6741,9,3,
    6752,28,3,
    6783,10,3,
    6800,9,3,
    6823,0,2,
    6912,4,3,
    6917,46,2,
    6964,16,3,
    6981,6,2,
    6992,9,3,
    7019,8,3,
    7040,2,3,
    7043,29,2,
    7073,12,3,
    7086,1,2,
    7088,9,3,
    7098,43,2,
    7142,13,3,
    7168,35,2,
    7204,19,3,
    7232,9,3,
    7245,2,2,
    7248,9,3,
    7258,35,2,
    7376,2,3,
    7380,20,3,
    7401,3,2,
    7405,0,3,
    7406,3,2,
    7410,2,3,
    7413,1,2,
    7424,191,2,
    7616,38,3,
    7676,3,3,
    7680,277,2,
    7960,5,2,
    7968,37,2,
    8008,5,2,
    8016,7,2,
    8025,0,2,
    8027,0,2,
    8029,0,2,
    8031,30,2,
    8064,52,2,
    8118,6,2,
    8126,0,2,
    8130,2,2,
    8134,6,2,
    8144,3,2,
    8150,5,2,
    8160,12,2,
    8178,2,2,
    8182,6,2,
    8204,1,3,
    8255,1,3,
    8276,0,3,
    8305,0,2,
    8319,0,2,
    8336,12,2,
    8400,12,3,
    8417,0,3,
    8421,11,3,
    8450,0,2,
    8455,0,2,
    8458,9,2,
    8469,0,2,
    8472,5,2,
    8484,0,2,
    8486,0,2,
    8488,0,2,
    8490,15,2,
    8508,3,2,
    8517,4,2,
    8526,0,2,
    8544,40,2,
    11264,46,2,
    11312,46,2,
    11360,132,2,
    11499,3,2,
    11503,2,3,
    11506,1,2,
    11520,37,2,
    11559,0,2,
    11565,0,2,
    11568,55,2,
    11631,0,2,
    11647,0,3,
    11648,22,2,
    11680,6,2,
    11688,6,2,
    11696,6,2,
    11704,6,2,
    11712,6,2,
    11720,6,2,
    11728,6,2,
    11736,6,2,
    11744,31,3,
    12293,2,2,
    12321,8,2,
    12330,5,3,
    12337,4,2,
    12344,4,2,
    12353,85,2,
    12441,1,3,
    12443,4,2,
    12449,89,2,
    12540,3,2,
    12549,40,2,
    12593,93,2,
    12704,26,2,
    12784,15,2,
    13312,6581,2,
    19968,20940,2,
    40960,1164,2,
    42192,45,2,
    42240,268,2,
    42512,15,2,
    42528,9,3,
    42538,1,2,
    42560,46,2,
    42607,0,3,
    42612,9,3,
    42623,24,2,
    42655,0,3,
    42656,79,2,
    42736,1,3,
    42775,8,2,
    42786,102,2,
    42891,3,2,
    42896,3,2,
    42912,10,2,
    43000,9,2,
    43010,0,3,
    43011,2,2,
    43014,0,3,
    43015,3,2,
    43019,0,3,
    43020,22,2,
    43043,4,3,
    43072,51,2,
    43136,1,3,
    43138,49,2,
    43188,16,3,
    43216,9,3,
    43232,17,3,
    43250,5,2,
    43259,0,2,
    43264,9,3,
    43274,27,2,
    43302,7,3,
    43312,22,2,
    43335,12,3,
    43360,28,2,
    43392,3,3,
    43396,46,2,
    43443,13,3,
    43471,0,2,
    43472,9,3,
    43520,40,2,
    43561,13,3,
    43584,2,2,
    43587,0,3,
    43588,7,2,
    43596,1,3,
    43600,9,3,
    43616,22,2,
    43642,0,2,
    43643,0,3,
    43648,47,2,
    43696,0,3,
    43697,0,2,
    43698,2,3,
    43701,1,2,
    43703,1,3,
    43705,4,2,
    43710,1,3,
    43712,0,2,
    43713,0,3,
    43714,0,2,
    43739,2,2,
    43744,10,2,
    43755,4,3,
    43762,2,2,
    43765,1,3,
    43777,5,2,
    43785,5,2,
    43793,5,2,
    43808,6,2,
    43816,6,2,
    43968,34,2,
    44003,7,3,
    44012,1,3,
    44016,9,3,
    44032,11171,2,
    55216,22,2,
    55243,48,2,
    63744,365,2,
    64112,105,2,
    64256,6,2,
    64275,4,2,
    64285,0,2,
    64286,0,3,
    64287,9,2,
    64298,12,2,
    64312,4,2,
    64318,0,2,
    64320,1,2,
    64323,1,2,
    64326,107,2,
    64467,362,2,
    64848,63,2,
    64914,53,2,
    65008,11,2,
    65024,15,3,
    65056,6,3,
    65075,1,3,
    65101,2,3,
    65136,4,2,
    65142,134,2,
    65296,9,3,
    65313,25,2,
    65343,0,3,
    65345,25,2,
    65382,88,2,
    65474,5,2,
    65482,5,2,
    65490,5,2,
    65498,2,2,
    65536,11,2,
    65549,25,2,
    65576,18,2,
    65596,1,2,
    65599,14,2,
    65616,13,2,
    65664,122,2,
    65856,52,2,
    66045,0,3,
    66176,28,2,
    66208,48,2,
    66304,30,2,
    66352,26,2,
    66432,29,2,
    66464,35,2,
    66504,7,2,
    66513,4,2,
    66560,157,2,
    66720,9,3,
    67584,5,2,
    67592,0,2,
    67594,43,2,
    67639,1,2,
    67644,0,2,
    67647,22,2,
    67840,21,2,
    67872,25,2,
    67968,55,2,
    68030,1,2,
    68096,0,2,
    68097,2,3,
    68101,1,3,
    68108,3,3,
    68112,3,2,
    68117,2,2,
    68121,26,2,
    68152,2,3,
    68159,0,3,
    68192,28,2,
    68352,53,2,
    68416,21,2,
    68448,18,2,
    68608,72,2,
    69632,2,3,
    69635,52,2,
    69688,14,3,
    69734,9,3,
    69760,2,3,
    69763,44,2,
    69808,10,3,
    69840,24,2,
    69872,9,3,
    69888,2,3,
    69891,35,2,
    69927,13,3,
    69942,9,3,
    70016,2,3,
    70019,47,2,
    70067,13,3,
    70081,3,2,
    70096,9,3,
    71296,42,2,
    71339,12,3,
    71360,9,3,
    73728,878,2,
    74752,98,2,
    77824,1070,2,
    92160,568,2,
    93952,68,2,
    94032,0,2,
    94033,45,3,
    94095,3,3,
    94099,12,2,
    110592,1,2,
    119141,4,3,
    119149,5,3,
    119163,7,3,
    119173,6,3,
    119210,3,3,
    119362,2,3,
    119808,84,2,
    119894,70,2,
    119966,1,2,
    119970,0,2,
    119973,1,2,
    119977,3,2,
    119982,11,2,
    119995,0,2,
    119997,6,2,
    120005,64,2,
    120071,3,2,
    120077,7,2,
    120086,6,2,
    120094,27,2,
    120123,3,2,
    120128,4,2,
    120134,0,2,
    120138,6,2,
    120146,339,2,
    120488,24,2,
    120514,24,2,
    120540,30,2,
    120572,24,2,
    120598,30,2,
    120630,24,2,
    120656,30,2,
    120688,24,2,
    120714,30,2,
    120746,24,2,
    120772,7,2,
    120782,49,3,
    126464,3,2,
    126469,26,2,
    126497,1,2,
    126500,0,2,
    126503,0,2,
    126505,9,2,
    126516,3,2,
    126521,0,2,
    126523,0,2,
    126530,0,2,
    126535,0,2,
    126537,0,2,
    126539,0,2,
    126541,2,2,
    126545,1,2,
    126548,0,2,
    126551,0,2,
    126553,0,2,
    126555,0,2,
    126557,0,2,
    126559,0,2,
    126561,1,2,
    126564,0,2,
    126567,3,2,
    126572,6,2,
    126580,3,2,
    126585,3,2,
    126590,0,2,
    126592,9,2,
    126603,16,2,
    126625,2,2,
    126629,4,2,
    126635,16,2,
    131072,42710,2,
    173824,4148,2,
    177984,221,2,
    194560,541,2,
    917760,239,3
];

var WHITESPACE = [
    9,0,1,
    11,1,1,
    32,0,1,
    160,0,1,
    5760,0,1,
    8192,10,1,
    8239,0,1,
    8287,0,1,
    12288,0,1,
    65279,0,1
];



exports.IDENTIFIER = IDENTIFIER; exports.WHITESPACE = WHITESPACE; return exports; }).call(this, {});

var Unicode_ = (function(exports) { 

var IDENTIFIER = UnicodeData.IDENTIFIER, WHITESPACE = UnicodeData.WHITESPACE;

function binarySearch(table, val) {

    var right = (table.length / 3) - 1,
        left = 0,
        mid = 0,
        test = 0,
        offset = 0;
    
    while (left <= right) {
        
        mid = (left + right) >> 1;
        offset = mid * 3;
        test = table[offset];
        
        if (val < test) {
        
            right = mid - 1;
        
        } else if (val === test || val <= test + table[offset + 1]) {
        
            return table[offset + 2];
            
        } else {
        
            left = mid + 1; 
        }
    }
    
    return 0;
}

function isIdentifierStart(code) {

    return binarySearch(IDENTIFIER, code) === 2;
}

function isIdentifierPart(code) {

    return binarySearch(IDENTIFIER, code) >= 2;
}

function isWhitespace(code) {

    return binarySearch(WHITESPACE, code) === 1;
}

function length(code) {

    return code > 0xffff ? 2 : 1;
}

function codePointAt(str, offset) {

    var a = str.charCodeAt(offset);
        
    if (a >= 0xd800 && 
        a <= 0xdbff && 
        str.length > offset + 1) {
    
        var b = str.charCodeAt(offset + 1);
        
        if (b >= 0xdc00 && b <= 0xdfff)
            return (a - 0xd800) * 0x400 + b - 0xdc00 + 0x10000;
    }
    
    return a;
}

function toString(code) {

    if (code > 0x10ffff)
        return "";
    
    if (code <= 0xffff)
        return String.fromCharCode(code);
    
    // If value is greater than 0xffff, then it must be encoded
    // as 2 UTF-16 code units in a surrogate pair.
    
    code -= 0x10000;
    
    return String.fromCharCode(
        (code >> 10) + 0xd800, 
        (code % 0x400) + 0xdc00);
}



exports.isIdentifierStart = isIdentifierStart; exports.isIdentifierPart = isIdentifierPart; exports.isWhitespace = isWhitespace; exports.length = length; exports.codePointAt = codePointAt; exports.toString = toString; return exports; }).call(this, {});

var Scanner_ = (function(exports) { 

var Unicode = Unicode_;

var identifierEscape = /\\u([0-9a-fA-F]{4})/g,
    newlineSequence = /\r\n?|[\n\u2028\u2029]/g,
    crNewline = /\r\n?/g;

// === Reserved Words ===
var reservedWord = new RegExp("^(?:" +
    "break|case|catch|class|const|continue|debugger|default|delete|do|" +
    "else|enum|export|extends|false|finally|for|function|if|import|in|" +
    "instanceof|new|null|return|super|switch|this|throw|true|try|typeof|" +
    "var|void|while|with" +
")$");

// === Punctuators ===
var multiCharPunctuator = new RegExp("^(?:" +
    "--|[+]{2}|" +
    "&&|[|]{2}|" +
    "<<=?|" +
    ">>>?=?|" +
    "[!=]==|" +
    "=>|" +
    "[\.]{2,3}|" +
    "[-+&|<>!=*&\^%\/]=" +
")$");

// === Miscellaneous Patterns ===
var octalEscape = /^(?:[0-3][0-7]{0,2}|[4-7][0-7]?)/,
    blockCommentPattern = /\r\n?|[\n\u2028\u2029]|\*\//g,
    hexChar = /[0-9a-f]/i;

// === Character type lookup table ===
function makeCharTable() {

    var table = [],
        i;
    
    for (i = 0; i < 128; ++i) table[i] = "";
    for (i = 65; i <= 90; ++i) table[i] = "identifier";
    for (i = 97; i <= 122; ++i) table[i] = "identifier";
    
    add("whitespace", "\t\v\f ");
    add("newline", "\r\n");
    add("decimal-digit", "123456789");
    add("punctuator-char", "{[]();,?:");
    add("punctuator", "<>+-*%&|^!~=");
    add("dot", ".");
    add("slash", "/");
    add("rbrace", "}");
    add("zero", "0");
    add("string", "'\"");
    add("template", "`");
    add("identifier", "$_\\");
    
    return table;
    
    function add(type, string) {
    
        string.split("").forEach((function(c) { return table[c.charCodeAt(0)] = type; }));
    }
}

var charTable = makeCharTable();

// Performs a binary search on an array
function binarySearch(array, val) {

    var right = array.length - 1,
        left = 0,
        mid,
        test;
    
    while (left <= right) {
        
        mid = (left + right) >> 1;
        test = array[mid];
        
        if (val === test)
            return mid;
        
        if (val < test) right = mid - 1;
        else left = mid + 1;
    }
    
    return left;
}

// Returns true if the character is a valid identifier part
function isIdentifierPartAscii(c) {

    return  c > 64 && c < 91 || 
            c > 96 && c < 123 ||
            c > 47 && c < 58 ||
            c === 36 ||
            c === 95;
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

var Scanner = _es6now.Class(function(__super) { return {

    constructor: function Scanner(input) {

        this.input = input || "";
        this.offset = 0;
        this.length = this.input.length;
        this.lines = [-1];
        this.lastLineBreak = -1;
        
        this.value = "";
        this.number = 0;
        this.regexFlags = "";
        this.templateEnd = false;
        this.newlineBefore = false;
        this.strictError = "";
        this.start = 0;
        this.end = 0;
    },
    
    skip: function() {
        
        return this.next("skip");
    },
    
    next: function(context) {

        if (this.type !== "COMMENT")
            this.newlineBefore = false;
        
        this.strictError = "";
        
        do {
        
            this.start = this.offset;
            
            this.type = 
                this.start >= this.length ? this.EOF() : 
                context === "skip" ? this.Skip() :
                this.Start(context);
        
        } while (!this.type);
        
        this.end = this.offset;
        
        return this.type;
    },
    
    location: function(offset) {
    
        var line = binarySearch(this.lines, offset),
            pos = this.lines[line - 1],
            column = offset - pos;
        
        return { line: line, column: column, lineOffset: pos + 1 };
    },
    
    rawValue: function(start, end) {
    
        // Line endings are normalized to <LF>
        return this.input.slice(start, end).replace(crNewline, "\n");
    },
    
    addLineBreak: function(offset) {
    
        if (offset > this.lastLineBreak)
            this.lines.push(this.lastLineBreak = offset);
    },
    
    peekChar: function() {
    
        return this.input.charAt(this.offset);
    },
    
    peekCharAt: function(n) {
    
        return this.input.charAt(this.offset + n);
    },
    
    peekCodePoint: function() {
    
        return Unicode.codePointAt(this.input, this.offset);
    },
    
    peekCode: function() {
    
        return this.input.charCodeAt(this.offset) | 0;
    },
    
    peekCodeAt: function(n) {
    
        return this.input.charCodeAt(this.offset + n) | 0;
    },
    
    readChar: function() {
    
        return this.input.charAt(this.offset++);
    },
    
    readUnicodeEscapeValue: function() {
    
        var hex = "";
        
        if (this.peekChar() === "{") {
        
            this.offset++;
            hex = this.readHex(0);
            
            if (hex.length < 1 || this.readChar() !== "}")
                return null;
        
        } else {
        
            hex = this.readHex(4);
        
            if (hex.length < 4)
                return null;
        }
        
        return parseInt(hex, 16);
    },
    
    readUnicodeEscape: function() {

        var cp = this.readUnicodeEscapeValue(),
            val = Unicode.toString(cp);
        
        return val === "" ? null : val;
    },
    
    readIdentifierEscape: function(startChar) {
    
        this.offset++;
        
        if (this.readChar() !== "u")
            return null;
        
        var cp = this.readUnicodeEscapeValue();
        
        if (startChar) {
        
            if (!Unicode.isIdentifierStart(cp))
                return null;
            
        } else {
        
            if (!Unicode.isIdentifierPart(cp))
                return null;
        }
        
        return Unicode.toString(cp);
    },
    
    readOctalEscape: function() {
    
        var m = octalEscape.exec(this.input.slice(this.offset, this.offset + 3)),
            val = m ? m[0] : "";
        
        this.offset += val.length;
        
        return val;
    },
    
    readStringEscape: function(continuationChar) {
    
        this.offset++;
        
        var chr = "", 
            esc = "";
        
        switch (chr = this.readChar()) {
        
            case "t": return "\t";
            case "b": return "\b";
            case "v": return "\v";
            case "f": return "\f";
            case "r": return "\r";
            case "n": return "\n";
    
            case "\r":
            
                this.addLineBreak(this.offset - 1);
                
                if (this.peekChar() === "\n")
                    this.offset++;
                
                return continuationChar;
            
            case "\n":
            case "\u2028":
            case "\u2029":
            
                this.addLineBreak(this.offset - 1);
                return continuationChar;

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
                
                } else {
                
                    this.strictError = "Octal literals are not allowed in strict mode";
                    return String.fromCharCode(parseInt(esc, 8));
                }
            
            case "x":
            
                esc = this.readHex(2);
                return (esc.length < 2) ? null : String.fromCharCode(parseInt(esc, 16));
            
            case "u":
            
                return this.readUnicodeEscape();
            
            default: 
            
                return chr;
        }
    },
    
    readRange: function(low, high) {
    
        var start = this.offset,
            code = 0;
        
        while (code = this.peekCode()) {
        
            if (code >= low && code <= high) this.offset++;
            else break;
        }
        
        return this.input.slice(start, this.offset);
    },
    
    readInteger: function() {
    
        var start = this.offset,
            code = 0;
        
        while (code = this.peekCode()) {
        
            if (code >= 48 && code <= 57) this.offset++;
            else break;
        }
        
        return this.input.slice(start, this.offset);
    },
    
    readHex: function(maxLen) {
        
        var str = "", 
            chr = "";
        
        while (chr = this.peekChar()) {
        
            if (!hexChar.test(chr))
                break;
            
            str += chr;
            this.offset++;
            
            if (str.length === maxLen)
                break;
        }
        
        return str;
    },
    
    peekNumberFollow: function() {
    
        var c = this.peekCode();
        
        if (c > 127)
            return !Unicode.isIdentifierStart(this.peekCodePoint());
    
        return !(
            c > 64 && c < 91 || 
            c > 96 && c < 123 ||
            c > 47 && c < 58 ||
            c === 36 ||
            c === 95 ||
            c === 92
        );
    },
    
    Skip: function() {
    
        var code = this.peekCode();
        
        if (code < 128) {
        
            switch (charTable[code]) {
        
                case "whitespace": return this.Whitespace();
            
                case "newline": return this.Newline(code);
            
                case "slash":
            
                    var next = this.peekCodeAt(1);

                    if (next === 47) return this.LineComment();       // /
                    else if (next === 42) return this.BlockComment(); // *
            }
        
        } else {
        
            // Unicode newlines
            if (isNewlineChar(this.peekChar()))
                return this.Newline(code);
        
            var cp = this.peekCodePoint();
            
            // Unicode whitespace
            if (Unicode.isWhitespace(cp))
                return this.UnicodeWhitespace(cp);
        }
        
        return "UNKNOWN";
    },
    
    Start: function(context) {
    
        var code = this.peekCode(), 
            next = 0;
        
        switch (charTable[code]) {
        
            case "punctuator-char": return this.PunctuatorChar();
            
            case "whitespace": return this.Whitespace();
            
            case "identifier": return this.Identifier(context, code);
            
            case "rbrace":
            
                if (context === "template") return this.Template();
                else return this.PunctuatorChar();
            
            case "punctuator": return this.Punctuator();
            
            case "newline": return this.Newline(code);
            
            case "decimal-digit": return this.Number();
            
            case "template": return this.Template();
            
            case "string": return this.String();
            
            case "zero": 
            
                switch (next = this.peekCodeAt(1)) {
                
                    case 88: case 120: return this.HexNumber();   // x
                    case 66: case 98: return this.BinaryNumber(); // b
                    case 79: case 111: return this.OctalNumber(); // o
                }
                
                return next >= 48 && next <= 55 ?
                    this.LegacyOctalNumber() :
                    this.Number();
            
            case "dot": 
            
                next = this.peekCodeAt(1);
                
                if (next >= 48 && next <= 57) return this.Number();
                else return this.Punctuator();
            
            case "slash":
            
                next = this.peekCodeAt(1);

                if (next === 47) return this.LineComment();       // /
                else if (next === 42) return this.BlockComment(); // *
                else if (context === "div") return this.Punctuator();
                else return this.RegularExpression();
            
        }
        
        // Unicode newlines
        if (isNewlineChar(this.peekChar()))
            return this.Newline(code);
        
        var cp = this.peekCodePoint();
        
        // Unicode whitespace
        if (Unicode.isWhitespace(cp))
            return this.UnicodeWhitespace(cp);
        
        // Unicode identifier chars
        if (Unicode.isIdentifierStart(cp))
            return this.Identifier(context, cp);
        
        return this.Error();
    },
    
    Whitespace: function() {
    
        this.offset++;
        
        var code = 0;
        
        while (code = this.peekCode()) {
        
            // ASCII Whitespace:  [\t] [\v] [\f] [ ] 
            if (code === 9 || code === 11 || code === 12 || code === 32)
                this.offset++;
            else
                break;
        }
        
        return "";
    },
    
    UnicodeWhitespace: function(cp) {
    
        this.offset += Unicode.length(cp);
        
        // General unicode whitespace
        while (Unicode.isWhitespace(cp = this.peekCodePoint()))
            this.offset += Unicode.length(cp);
        
        return "";
    },
    
    Newline: function(code) {
        
        this.addLineBreak(this.offset++);
        
        // Treat /r/n as a single newline
        if (code === 13 && this.peekCode() === 10)
            this.offset++;
        
        this.newlineBefore = true;
        
        return "";
    },
    
    PunctuatorChar: function() {
    
        return this.readChar();
    },
    
    Punctuator: function() {
        
        var op = this.readChar(), 
            chr = "",
            next = "";
        
        while (
            isPunctuatorNext(chr = this.peekChar()) &&
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
    
        var first = this.readChar(),
            end = false, 
            val = "", 
            esc = "",
            chr = "";
        
        while (chr = this.peekChar()) {
            
            if (chr === "`") {
            
                end = true;
                break;
            }
            
            if (chr === "$" && this.peekCharAt(1) === "{") {
            
                this.offset++;
                break;
            }
            
            if (chr === "\\") {
            
                esc = this.readStringEscape("\n");
                
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
        this.templateEnd = end;
        
        return "TEMPLATE";
    },
    
    String: function() {
    
        var delim = this.readChar(),
            val = "",
            esc = "",
            chr = "";
        
        while (chr = this.input[this.offset]) {
        
            if (chr === delim)
                break;
            
            if (isNewlineChar(chr))
                return this.Error();
            
            if (chr === "\\") {
            
                esc = this.readStringEscape("");
                
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
            val = "", 
            chr = "",
            code = 0,
            flagStart = 0;
        
        while (chr = this.readChar()) {
        
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
        
        flagStart = this.offset;
        
        while (true) {
        
            code = this.peekCode();
        
            if (code === 92) {
            
                return this.Error();
            
            } else if (code > 127) {
            
                if (Unicode.isIdentifierPart(code = this.peekCodePoint()))
                    this.offset += Unicode.length(code);
                else
                    break;
            
            } else if (isIdentifierPartAscii(code)) {
            
                this.offset++;
                
            } else {
            
                break;
            }
        }
        
        this.value = val;
        this.regexFlags = this.input.slice(flagStart, this.offset);
        
        return "REGEX";
    },
    
    LegacyOctalNumber: function() {
    
        this.offset++;
        
        var start = this.offset,
            code = 0;
        
        while (code = this.peekCode()) {
        
            if (code >= 48 && code <= 55)
                this.offset++;
            else
                break;
        }
        
        this.strictError = "Octal literals are not allowed in strict mode";
        
        var val = parseInt(this.input.slice(start, this.offset), 8);
        
        if (!this.peekNumberFollow())
            return this.Error();
        
        this.number = val;
        
        return "NUMBER";
    },
    
    Number: function() {
    
        var start = this.offset,
            next = "";
        
        this.readInteger();
        
        if ((next = this.peekChar()) === ".") {
        
            this.offset++;
            this.readInteger();
            next = this.peekChar();
        }
        
        if (next === "e" || next === "E") {
        
            this.offset++;
            
            next = this.peekChar();
            
            if (next === "+" || next === "-")
                this.offset++;
            
            if (!this.readInteger())
                return this.Error();
        }
        
        var val = parseFloat(this.input.slice(start, this.offset));
        
        if (!this.peekNumberFollow())
            return this.Error();
        
        this.number = val;
        
        return "NUMBER";
    },
    
    BinaryNumber: function() {
    
        this.offset += 2;
        
        var val = parseInt(this.readRange(48, 49), 2);
        
        if (!this.peekNumberFollow())
            return this.Error();
        
        this.number = val;
        
        return "NUMBER";
    },
    
    OctalNumber: function() {
    
        this.offset += 2;
        
        var val = parseInt(this.readRange(48, 55), 8);
        
        if (!this.peekNumberFollow())
            return this.Error();
        
        this.number = val;
        
        return "NUMBER";
    },
    
    HexNumber: function() {
    
        this.offset += 2;
        
        var val = parseInt(this.readHex(0), 16);
        
        if (!this.peekNumberFollow())
            return this.Error();
        
        this.number = val;
        
        return "NUMBER";
    },
    
    Identifier: function(context, code) {
    
        var start = this.offset,
            val = "",
            esc = "";
        
        // Identifier Start
    
        if (code === 92) {

            esc = this.readIdentifierEscape(true);
    
            if (esc === null)
                return this.Error();
    
            val = esc;
            start = this.offset;

        } else if (code > 127) {

            this.offset += Unicode.length(code);
            
        } else {
        
            this.offset++;
        }
        
        // Identifier Part
        
        while (true) {
        
            code = this.peekCode();
        
            if (code === 92) {
            
                val += this.input.slice(start, this.offset);
                esc = this.readIdentifierEscape(false);
                
                if (esc === null)
                    return this.Error();
                
                val += esc;
                start = this.offset;
            
            } else if (code > 127) {
            
                if (Unicode.isIdentifierPart(code = this.peekCodePoint()))
                    this.offset += Unicode.length(code);
                else
                    break;
            
            } else if (isIdentifierPartAscii(code)) {
            
                this.offset++;
                
            } else {
            
                break;
            }
        }
        
        val += this.input.slice(start, this.offset);
        
        this.value = val;
        
        if (context !== "name" && reservedWord.test(val))
            return esc ? this.Error() : val;
        
        return "IDENTIFIER";
    },
    
    LineComment: function() {
    
        this.offset += 2;
        
        var start = this.offset,
            chr = "";
        
        while (chr = this.peekChar()) {
        
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
            m = null;
        
        while (true) {
        
            pattern.lastIndex = this.offset;
            
            m = pattern.exec(this.input);
            if (!m) return this.Error(msg);
            
            this.offset = m.index + m[0].length;
            
            if (m[0] === "*/")
                break;
            
            this.newlineBefore = true;
            this.addLineBreak(m.index);
        }
        
        this.value = this.input.slice(start, this.offset - 2);
        
        return "COMMENT";
    },
    
    EOF: function() {
    
        return "EOF";
    },
    
    Error: function(msg) {
    
        if (this.start === this.offset)
            this.offset++;
        
        return "ILLEGAL";
    }
    
} });


exports.Scanner = Scanner; return exports; }).call(this, {});

var Transform_ = (function(exports) { 

var AST = AST_.AST;
    
var Transform = _es6now.Class(function(__super) { return {

    // Transform an expression into a formal parameter list
    transformFormals: function(expr) {
        
        if (!expr)
            return [];
            
        var param,
            list,
            node,
            expr;
        
        switch (expr.type) {
        
            case "SequenceExpression": list = expr.expressions; break;
            case "CallExpression": list = expr.arguments; break;
            default: list = [expr]; break;
        }
    
        for (var i = 0; i < list.length; ++i) {
        
            node = list[i];
            
            if (i === list.length - 1 && node.type === "SpreadExpression") {
            
                expr = node.expression;
                
                // Rest parameters can only be identifiers
                if (expr.type !== "Identifier")
                    this.fail("Invalid rest parameter", expr);
                
                this.checkBindingTarget(expr);
                
                // Clear parser error for invalid spread expression
                node.error = "";
                
                param = new AST.RestParameter(expr, node.start, node.end);
                
            } else {
             
                param = new AST.FormalParameter(node, null, node.start, node.end);
                this.transformPatternElement(param, true);
            }
            
            list[i] = param;
        }
        
        return list;
    },
    
    transformArrayPattern: function(node, binding) {
    
        // NOTE: ArrayPattern and ArrayLiteral are isomorphic
        node.type = "ArrayPattern";
        
        var elems = node.elements,
            elem,
            expr;
        
        for (var i = 0; i < elems.length; ++i) {
        
            elem = elems[i];
            
            // Skip holes in pattern
            if (!elem) 
                continue;
            
            switch (elem.type) {
                
                case "SpreadExpression":
                
                    // TODO:  Currently, we are ignoring the last comma, but commas
                    // are not allowed after a rest element.  Should they be?
                    
                    // Rest element must be in the last position
                    if (i < elems.length - 1)
                        this.fail("Invalid destructuring pattern", elem);
                    
                    expr = elem.expression;
                    
                    // Rest target cannot be a destructuring pattern
                    switch (expr.type) {
                    
                        case "ObjectLiteral":
                        case "ObjectPattern":
                        case "ArrayLiteral":
                        case "ArrayPattern": 
                            this.fail("Invalid rest pattern", expr);
                    }
                    
                    elem = new AST.PatternRestElement(expr, elem.start, elem.end);
                    this.checkPatternTarget(elem.pattern, binding);
                    break;
                
                case "PatternRestElement":
                    this.checkPatternTarget(elem.pattern, binding);
                    break;
                    
                case "PatternElement":
                    this.transformPatternElement(elem, binding);
                    break;
                
                default:
                    elem = new AST.PatternElement(elem, null, elem.start, elem.end);
                    this.transformPatternElement(elem, binding);
                    break;
                    
            }
            
            elems[i] = elem;
        }
        
    },
    
    transformObjectPattern: function(node, binding) {

        // NOTE: ObjectPattern and ObjectLiteral are isomorphic
        node.type = "ObjectPattern";
        
        var props = node.properties;
        
        for (var i = 0; i < props.length; ++i) {
        
            var prop = props[i];
            
            // Clear the error flag
            prop.error = "";
            
            switch (prop.type) {
                    
                case "PropertyDefinition":
                    
                    // Replace node
                    props[i] = prop = new AST.PatternProperty(
                        prop.name,
                        prop.expression,
                        null,
                        prop.start,
                        prop.end);
                    
                    break;
                
                case "PatternProperty":
                    break;
                
                default:
                    this.fail("Invalid pattern", prop);
            }
            
            if (prop.pattern) this.transformPatternElement(prop, binding);
            else this.checkPatternTarget(prop.name, binding);
        }
    },
    
    transformPatternElement: function(elem, binding) {
    
        var node = elem.pattern;
        
        // Split assignment into pattern and initializer
        if (node && node.type === "AssignmentExpression" && node.operator === "=") {
        
            elem.initializer = node.right;
            elem.pattern = node = node.left;
        }
        
        this.checkPatternTarget(node, binding);
    }, constructor: function Transform() {}
    
} });



exports.Transform = Transform; return exports; }).call(this, {});

var IntMap_ = (function(exports) { 

/*

NOTE:  We are using an O(n) list-based search algorithm, because for our purposes
it is much faster than using an object-as-dictionary.  Object properties can be
read very fast, but creating new properties tends to be sluggish (v8 2014-05).  As 
v8 progresses, we may want to see if using the built-in Map class is faster.

*/

var IntMap = _es6now.Class(function(__super) { return {

    constructor: function IntMap() {
    
        this.list = [];
    },
    
    get: function(key) {
    
        var i = this.searchList(key);
        return i >= 0 ? this.list[i][1] : 0;
    },
    
    set: function(key, val) {
    
        var i = this.searchList(key);
        
        if (i >= 0) this.list[i][1] = val;
        else this.list.push([ key, val ]);
    },
    
    searchList: function(key) {
    
        var list = this.list;

        for (var i = 0; i < list.length; ++i)
            if (list[i][0] === key)
                return i;
    
        return -1;
    }
    
} });



exports.IntMap = IntMap; return exports; }).call(this, {});

var Validate_ = (function(exports) { 

var IntMap = IntMap_.IntMap;

// Object literal property name flags
var PROP_NORMAL = 1,
    PROP_DATA = 2,
    PROP_GET = 4,
    PROP_SET = 8;

// Identifiers which are reserved in strict mode    
var strictReservedWord = new RegExp("^(?:" +
    "implements|private|public|interface|package|let|protected|static|yield" +
")$");

// Returns true if the identifier is a reserved word in strict mode
function isStrictReserved(word) {

    return strictReservedWord.test(word);
}

// Returns true if the specified name is a restricted identifier in strict mode
function isPoisonIdent(name) {

    return name === "eval" || name === "arguments";
}

// Unwraps parens surrounding an expression
function unwrapParens(node) {

    // Remove any parenthesis surrounding the target
    for (; node.type === "ParenExpression"; node = node.expression);
    return node;
}

var Validate = _es6now.Class(function(__super) { return {

    // Validates an assignment target
    checkAssignmentTarget: function(node, simple) {
    
        switch (node.type) {
        
            case "Identifier":
            
                if (isPoisonIdent(node.value))
                    this.addStrictError("Cannot modify " + node.value + " in strict mode", node);
        
                return;
            
            case "MemberExpression":
                return;
            
            case "ObjectPattern":
            case "ArrayPattern":
                if (!simple) return;
                break;
            
            case "ObjectLiteral":
                if (!simple) { this.transformObjectPattern(node, false); return }
                break;
                
            case "ArrayLiteral":
                if (!simple) { this.transformArrayPattern(node, false); return }
                break;
            
        }
        
        this.fail("Invalid left-hand side in assignment", node);
    },
    
    // Validates a binding target
    checkBindingTarget: function(node) {
    
        var name, msg;
        
        switch (node.type) {
        
            case "Identifier":
            
                // Perform basic identifier validation
                this.checkIdentifier(node);
        
                // Mark identifier node as a declaration
                node.context = "declaration";
            
                name = node.value;
        
                if (isPoisonIdent(name))
                    this.addStrictError("Binding cannot be created for '" + name + "' in strict mode", node);
                
                return;
            
            case "ArrayLiteral":
            case "ArrayPattern":
                this.transformArrayPattern(node, true);
                return;
            
            case "ObjectLiteral":
            case "ObjectPattern":
                this.transformObjectPattern(node, true);
                return;
            
        }
        
        this.fail("Invalid binding target", node);
    },
    
    // Validates a target in a binding or assignment pattern
    checkPatternTarget: function(node, binding) {
    
        return binding ? this.checkBindingTarget(node) : this.checkAssignmentTarget(node, false);
    },
    
    // Checks an identifier for strict mode reserved words
    checkIdentifier: function(node) {
    
        var ident = node.value;
        
        // TODO: Add a restriction for await in async functions?
        
        if (ident === "yield" && this.context.functionType === "generator")
            this.fail("yield cannot be an identifier inside of a generator function", node);
        else if (isStrictReserved(ident))
            this.addStrictError(ident + " cannot be used as an identifier in strict mode", node);
    },
    
    // Checks function formal parameters for strict mode restrictions
    checkParameters: function(params, kind) {
    
        var names = new IntMap, 
            name,
            node;
        
        for (var i = 0; i < params.length; ++i) {
        
            node = params[i];
            
            if (node.type !== "FormalParameter" || node.pattern.type !== "Identifier")
                continue;
            
            name = node.pattern.value;
            
            if (isPoisonIdent(name))
                this.addStrictError("Parameter name " + name + " is not allowed in strict mode", node);
            
            if (names.get(name))
                this.addStrictError("Strict mode function may not have duplicate parameter names", node);
            
            names.set(name, 1);
        }
    },
    
    // TODO: Add a method for validating the parameter list of arrow functions, which may
    // contain identifiers or initializers which are not valid within the containing context.
    
    // TODO: For identifiers within an arrow function parameter list, we have
    // to take into account the parent context.  For example, yield is not
    // allowed as an identifier within the parameter list of an arrow function
    // contained within a generator.  For "modified" arrow functions (e.g. 
    // async arrows) we'll have to take the union of these restrictions.
    
    // Performs validation on transformed arrow formal parameters
    checkArrowParameters: function(params) {
    
        params = this.transformFormals(params);
        this.checkParameters(params);
        return params;
    },
    
    // Performs validation on the init portion of a for-in or for-of statement
    checkForInit: function(init, type) {
    
        if (init.type === "VariableDeclaration") {
            
            // For-in/of may only have one variable declaration
            if (init.declarations.length !== 1)
                this.fail("for-" + type + " statement may not have more than one variable declaration", init);
            
            var decl = init.declarations[0];
            
            // Initializers are not allowed in for in and for of
            if (decl.initializer)
                this.fail("Invalid initializer in for-" + type + " statement", init);
            
        } else {
        
            this.checkAssignmentTarget(this.unwrapParens(init));
        }
    },
    
    // Checks for duplicate object literal property names
    checkPropertyName: function(node, nameSet) {
    
        var flag = PROP_NORMAL,
            currentFlags = 0,
            name = "";
        
        switch (node.name.type) {
        
            case "Identifier":
            case "StringLiteral":
                name = node.name.value;
                break;
                
            case "ComputedPropertyName":
                // If property name is computed, skip duplicate check
                return;
            
            default:
                name = String(node.name.value);
                break;
        }
        
        switch (node.type) {

            case "PropertyDefinition":
            
                // Duplicates only allowed for "x: expr" form
                if (node.expression)
                    flag = PROP_DATA;
                
                break;
    
            case "MethodDefinition":
        
                switch (node.kind) {

                    case "get": flag = PROP_GET; break;
                    case "set": flag = PROP_SET; break;
                }
                
                break;
        }

        // If this name has already been added...
        if (currentFlags = nameSet.get(name)) {
            
            var duplicate = true;
            
            switch (flag) {
    
                case PROP_DATA:
                    
                    if (currentFlags === PROP_DATA) {
                    
                        this.addStrictError("Duplicate data property names in object literal not allowed in strict mode", node);
                        duplicate = false;
                    }
                    
                    break;
                
                case PROP_GET:
                    if (currentFlags === PROP_SET) duplicate = false;
                    break;
                    
                case PROP_SET:
                    if (currentFlags === PROP_GET) duplicate = false;
                    break;
            }
            
            if (duplicate)
                this.addInvalidNode("Duplicate property names in object literal not allowed", node);
        }

        // Set name flag
        nameSet.set(name, currentFlags | flag);
    },
    
    checkInvalidNodes: function() {
    
        var context = this.context,
            parent = context.parent,
            list = context.invalidNodes,
            item,
            node,
            error;
        
        for (var i = 0; i < list.length; ++i) {
        
            item = list[i];
            node = item.node;
            error = node.error;
            
            // Skip if error has been resolved
            if (!error)
                continue;
            
            // Throw if item is not a strict-mode-only error, or
            // if the current context is strict
            if (!item.strict || context.mode === "strict")
                this.fail(error, node);
            
            // Skip strict errors in sloppy mode
            if (context.mode === "sloppy")
                continue;
            
            // NOTE:  If the parent context is sloppy, then we ignore.
            // If the parent context is strict, then this context would
            // also be known to be strict and therefore handled above.
            
            // If parent mode has not been determined, add error to
            // parent context
            if (!parent.mode)
                parent.invalidNodes.push(item);
        }
        
    },
    
    checkDelete: function(node) {
    
        node = this.unwrapParens(node);
        
        if (node.type === "Identifier")
            this.addStrictError("Cannot delete unqualified property in strict mode", node);
    }, constructor: function Validate() {}
    
} });


exports.Validate = Validate; return exports; }).call(this, {});

var Parser_ = (function(exports) { 

var AST = AST_.AST;
var Scanner = Scanner_.Scanner;
var Transform = Transform_.Transform;
var Validate = Validate_.Validate;
var IntMap = IntMap_.IntMap;

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
    
        case "await":
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

// Returns true if the value is a function modifier keyword
function isFunctionModifier(value) {

    switch (value) {
    
        case "async": return true;
    }
    
    return false;
}

// Returns the value of the specified token, if it is an identifier and does not
// contain any unicode escapes
function keywordFromToken(token) {

    if (token.type === "IDENTIFIER" && token.end - token.start === token.value.length)
        return token.value;
    
    return "";
}

// Returns the value of the specified node, if it is an Identifier and does not
// contain any unicode escapes
function keywordFromNode(node) {

    if (node.type === "Identifier" && node.end - node.start === node.value.length)
        return node.value;
    
    return "";
}

// Copies token data
function copyToken(from, to) {

    to.type = from.type;
    to.value = from.value;
    to.number = from.number;
    to.regexFlags = from.regexFlags;
    to.templateEnd = from.templateEnd;
    to.newlineBefore = from.newlineBefore;
    to.strictError = from.strictError;
    to.start = from.start;
    to.end = from.end;
    
    return to;
}

var Context = _es6now.Class(function(__super) { return {

    constructor: function Context(parent, isFunction) {
    
        this.parent = parent;
        this.mode = "";
        this.isFunction = isFunction;
        this.functionBody = false;
        this.functionType = "";
        this.labelSet = new IntMap;
        this.switchDepth = 0;
        this.loopDepth = 0;
        this.invalidNodes = [];
    }
} });

var Options = _es6now.Class(function(__super) { return {

    constructor: function Options(obj) {
    
        this.obj = obj || {};
    },
    
    get: function(key, def) {
    
        var v = this.obj[key];
        return v === void 0 ? def : v;
    }
} });

var Parser = _es6now.Class(function(__super) { return {

    parse: function(input, options) {
    
        options = new Options(options);
        
        var scanner = new Scanner(input);
        
        this.scanner = scanner;
        this.input = input;
        
        this.peek0 = null;
        this.peek1 = null;
        this.tokenStash = new Scanner;
        this.tokenEnd = scanner.offset;
        
        this.context = new Context(null, false);
        this.setStrict(false);
        
        return options.get("module") ? this.Module() : this.Script();
    },
    
    location: function(offset) {
    
        if (!this.scanner)
            throw new Error("Parser not initialized");
        
        return this.scanner.location(offset);
    },
    
    nextToken: function(context) {
    
        var scanner = this.scanner,
            type = "";
        
        context = context || "";
        
        do { type = scanner.next(context); }
        while (type === "COMMENT");
        
        return scanner;
    },
    
    nodeStart: function() {
    
        if (this.peek0)
            return this.peek0.start;
        
        // Skip over whitespace and comments
        this.scanner.skip();
        
        return this.scanner.offset;
    },
    
    nodeEnd: function() {
    
        return this.tokenEnd;
    },
    
    readToken: function(type, context) {
    
        var token = this.peek0 || this.nextToken(context);
        
        this.peek0 = this.peek1;
        this.peek1 = null;
        this.tokenEnd = token.end;
        
        if (type && token.type !== type)
            this.unexpected(token);
            
        return token;
    },
    
    read: function(type, context) {
    
        return this.readToken(type, context).type;
    },
    
    peekToken: function(context) {
    
        if (!this.peek0)
            this.peek0 = this.nextToken(context);
        
        return this.peek0;
    },
    
    peek: function(context) {
    
        return this.peekToken(context).type;
    },
    
    peekTokenAt: function(context, index) {
    
        if (index !== 1 || this.peek0 === null)
            throw new Error("Invalid lookahead")
        
        if (this.peek1 === null) {
        
            this.peek0 = copyToken(this.peek0, this.tokenStash);
            this.peek1 = this.nextToken(context);
        }
        
        return this.peek1;
    },
    
    peekAt: function(context, index) {
    
        return this.peekTokenAt(context, index).type;
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
    
    readKeyword: function(word) {
    
        var token = this.readToken();
        
        if (token.type === word || keywordFromToken(token) === word)
            return token;
        
        this.unexpected(token);
    },
    
    peekKeyword: function(word) {
    
        var token = this.peekToken();
        return token.type === word || keywordFromToken(token) === word;
    },
    
    peekLet: function() {
    
        if (this.peekKeyword("let")) {
        
            switch (this.peekAt("div", 1)) {
            
                case "{":
                case "[":
                case "IDENTIFIER": return true;
            }
        }
        
        return false;
    },
    
    peekModule: function() {
    
        if (this.peekKeyword("module")) {
        
            var token = this.peekTokenAt("div", 1);
            return (!token.newlineBefore && token.type === "IDENTIFIER");
        }
        
        return false;
    },
    
    peekYield: function() {
    
        return this.context.functionBody &&
            this.context.functionType === "generator" && 
            this.peekKeyword("yield");
    },
    
    peekAwait: function() {
    
        return this.context.functionBody && 
            this.context.functionType === "async" &&
            this.peekKeyword("await");
    },
    
    peekFunctionModifier: function() {
    
        var token = this.peekToken();
        
        if (!isFunctionModifier(keywordFromToken(token)))
            return false;
        
        token = this.peekTokenAt("div", 1);
        return token.type === "function" && !token.newlineBefore;
    },
    
    peekEnd: function() {
    
        var token = this.peekToken();
        
        if (!token.newlineBefore) {
            
            switch (token.type) {
            
                case "EOF":
                case "}":
                case ";":
                case ")":
                    break;
                
                default:
                    return false;
            }
        }
        
        return true;
    },
    
    unexpected: function(token) {
    
        var type = token.type, msg;
        
        msg = type === "EOF" ?
            "Unexpected end of input" :
            "Unexpected token " + token.type;
        
        this.fail(msg, token);
    },
    
    fail: function(msg, node) {
    
        if (!node)
            node = this.peekToken();
        
        var loc = this.scanner.location(node.start),
            err = new SyntaxError(msg);
        
        err.line = loc.line;
        err.column = loc.column;
        err.lineOffset = loc.lineOffset;
        err.startOffset = node.start;
        err.endOffset = node.end;
        err.sourceText = this.input;
        
        throw err;
    },
    
    unwrapParens: function(node) {

        // Remove any parenthesis surrounding the target
        for (; node.type === "ParenExpression"; node = node.expression);
        return node;
    },

    
    // == Context Management ==
    
    pushContext: function(isFunction) {
    
        var parent = this.context;
        
        this.context = new Context(parent, isFunction);
        
        if (parent.mode === "strict")
            this.context.mode = "strict";
    },
    
    pushMaybeContext: function() {
    
        var parent = this.context;
        this.pushContext(parent.isFunction);
        this.context.functionBody = parent.functionBody;
        this.context.functionType = parent.functionType;
    },
    
    popContext: function(collapse) {
    
        var context = this.context,
            parent = context.parent;
        
        // If collapsing into parent context, copy invalid nodes into parent
        if (collapse) {

            for (var i = 0; i < context.invalidNodes.length; ++i)
                parent.invalidNodes.push(context.invalidNodes[i]);
            
        } else {
        
            this.checkInvalidNodes();
        }
        
        this.context = this.context.parent;
    },
    
    setStrict: function(strict) {
    
        this.context.mode = strict ? "strict" : "sloppy";
    },
    
    addStrictError: function(error, node) {
    
        this.addInvalidNode(error, node, true);
    },
    
    addInvalidNode: function(error, node, strict) {
    
        node.error = error;
        this.context.invalidNodes.push({ node: node, strict: !!strict });
    },
    
    setLoopLabel: function(label) {
    
        this.context.labelSet.set(label, 2);
    },
    
    // === Top Level ===
    
    Script: function() {
    
        this.pushContext(false);
        
        var start = this.nodeStart(),
            statements = this.StatementList(true, false);
        
        this.popContext();
        
        return new AST.Script(statements, start, this.nodeEnd());
    },
    
    Module: function() {
    
        this.pushContext(false);
        this.setStrict(true);
        
        var start = this.nodeStart(),
            statements = this.StatementList(true, true);
        
        this.popContext();
        
        return new AST.Module(statements, start, this.nodeEnd());
    },
    
    // === Expressions ===
    
    Expression: function(noIn) {
    
        var start = this.nodeStart(),
            expr = this.AssignmentExpression(noIn),
            list = null;
            
        while (this.peek("div") === ",") {

            this.read();
            
            if (list === null)
                expr = new AST.SequenceExpression(list = [expr], start, -1);
            
            list.push(this.AssignmentExpression(noIn));
        }
        
        if (list)
            expr.end = this.nodeEnd();
        
        return expr;
    },
    
    AssignmentExpression: function(noIn, allowSpread) {
    
        var start = this.nodeStart(),
            node;
        
        if (this.peek() === "...") {
        
            this.read();
            
            node = new AST.SpreadExpression(
                this.AssignmentExpression(noIn),
                start,
                this.nodeEnd());
            
            if (!allowSpread)
                this.addInvalidNode("Invalid spread expression", node);
            
            return node;
        }
        
        if (this.peekYield())
            return this.YieldExpression(noIn);
        
        node = this.ConditionalExpression(noIn);
        
        if (node.type === "ArrowFunctionHead")
            return this.ArrowFunctionBody(node, noIn);
        
        // Check for assignment operator
        if (!isAssignment(this.peek("div")))
            return node;
        
        this.checkAssignmentTarget(this.unwrapParens(node), false);
        
        return new AST.AssignmentExpression(
            this.read(),
            node,
            this.AssignmentExpression(noIn),
            start,
            this.nodeEnd());
    },
    
    YieldExpression: function(noIn) {
    
        var start = this.nodeStart(),
            delegate = false,
            expr = null;
            
        this.readKeyword("yield");
        
        if (!this.peekEnd()) {
        
            if (this.peek() === "*") {
        
                this.read();
                delegate = true;
            }
        
            expr = this.AssignmentExpression(noIn);
        }
        
        return new AST.YieldExpression(
            expr, 
            delegate, 
            start, 
            this.nodeEnd());
    },
    
    ConditionalExpression: function(noIn) {
    
        var start = this.nodeStart(),
            left = this.BinaryExpression(noIn),
            middle,
            right;
        
        if (this.peek("div") !== "?")
            return left;
        
        this.read("?");
        middle = this.AssignmentExpression();
        this.read(":");
        right = this.AssignmentExpression(noIn);
        
        return new AST.ConditionalExpression(left, middle, right, start, this.nodeEnd());
    },
    
    BinaryExpression: function(noIn) {
    
        return this.PartialBinaryExpression(this.UnaryExpression(), 0, noIn);
    },
    
    PartialBinaryExpression: function(lhs, minPrec, noIn) {
    
        var prec = 0,
            next = "", 
            max = 0, 
            op = "",
            rhs;
        
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
            
            lhs = new AST.BinaryExpression(op, lhs, rhs, lhs.start, rhs.end);
        }
        
        return lhs;
    },
    
    UnaryExpression: function() {
    
        var start = this.nodeStart(),
            type = this.peek(),
            token,
            expr;
        
        if (isIncrement(type)) {
        
            this.read();
            expr = this.MemberExpression(true);
            this.checkAssignmentTarget(this.unwrapParens(expr), true);
            
            return new AST.UpdateExpression(type, expr, true, start, this.nodeEnd());
        }
        
        if (this.peekAwait())
            type = "await";
        
        if (isUnary(type)) {
        
            this.read();
            expr = this.UnaryExpression();
            
            if (type === "delete")
                this.checkDelete(expr);
            
            return new AST.UnaryExpression(type, expr, start, this.nodeEnd());
        }
        
        expr = this.MemberExpression(true);
        token = this.peekToken("div");
        type = token.type;
        
        // Check for postfix operator
        if (isIncrement(type) && !token.newlineBefore) {
        
            this.read();
            this.checkAssignmentTarget(this.unwrapParens(expr), true);
            
            return new AST.UpdateExpression(type, expr, false, start, this.nodeEnd());
        }
        
        return expr;
    },
    
    MemberExpression: function(allowCall) {
    
        var start = this.nodeStart(),
            token = this.peekToken(),
            arrowType = "",
            exit = false,
            prop,
            expr;
        
        expr = 
            token.type === "new" ? this.NewExpression() :
            token.type === "super" ? this.SuperExpression() :
            this.PrimaryExpression();
        
        while (!exit) { 
        
            token = this.peekToken("div");
            
            switch (token.type) {
            
                case ".":
                
                    this.read();
                    
                    expr = new AST.MemberExpression(
                        expr, 
                        this.IdentifierName(), 
                        false, 
                        start, 
                        this.nodeEnd());
                    
                    break;
                
                case "[":
                
                    this.read();
                    prop = this.Expression();
                    this.read("]");
                    
                    expr = new AST.MemberExpression(
                        expr, 
                        prop, 
                        true, 
                        start, 
                        this.nodeEnd());
        
                    break;
                
                case "(":
                    
                    if (!allowCall) {
                    
                        exit = true;
                        break;
                    }
                    
                    if (isFunctionModifier(keywordFromNode(expr))) {
                
                        arrowType = expr.value;
                        this.pushMaybeContext();
                    }
                    
                    expr = new AST.CallExpression(
                        expr, 
                        this.ArgumentList(), 
                        start, 
                        this.nodeEnd());
                    
                    if (arrowType) {
                    
                        token = this.peekToken("div");

                        if (token.type === "=>" && !token.newlineBefore) {
                        
                            expr = this.ArrowFunctionHead(arrowType, expr, start);
                            exit = true;
                        
                        } else {
                            
                            arrowType = "";
                            this.popContext(true);
                        }
                    }
                    
                    break;
                
                case "TEMPLATE":
                
                    expr = new AST.TaggedTemplateExpression(
                        expr,
                        this.TemplateExpression(),
                        start,
                        this.nodeEnd());
                    
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
    
        var start = this.nodeStart();
        
        this.read("new");
        
        var expr = this.peek() === "super" ?
            this.SuperExpression() :
            this.MemberExpression(false);
        
        var args = this.peek("div") === "(" ? this.ArgumentList() : null;
        
        return new AST.NewExpression(expr, args, start, this.nodeEnd());
    },
    
    SuperExpression: function() {
    
        var start = this.nodeStart();
        this.read("super");
        
        var node = new AST.SuperExpression(start, this.nodeEnd());
        
        if (!this.context.isFunction)
            this.fail("Super keyword outside of function", node);
        
        return node;
    },
    
    ArgumentList: function() {
    
        var list = [];
        
        this.read("(");
        
        while (this.peekUntil(")")) {
        
            if (list.length > 0)
                this.read(",");
            
            list.push(this.AssignmentExpression(false, true));
        }
        
        this.read(")");
        
        return list;
    },
    
    PrimaryExpression: function() {
    
        var token = this.peekToken(),
            type = token.type,
            start = this.nodeStart(),
            next,
            value;
        
        switch (type) {
            
            case "function": return this.FunctionExpression();
            case "class": return this.ClassExpression();
            case "TEMPLATE": return this.TemplateExpression();
            case "NUMBER": return this.NumberLiteral();
            case "STRING": return this.StringLiteral();
            case "{": return this.ObjectLiteral();
            
            case "(": return this.peekAt(null, 1) === "for" ? 
                this.GeneratorComprehension() :
                this.ParenExpression();
            
            case "[": return this.peekAt(null, 1) === "for" ?
                this.ArrayComprehension() :
                this.ArrayLiteral();
            
            case "IDENTIFIER":
                
                value = keywordFromToken(token);
                next = this.peekTokenAt("div", 1);
                
                if (!next.newlineBefore) {
                
                    if (next.type === "=>") {
                
                        this.pushContext(true);
                        return this.ArrowFunctionHead("", this.BindingIdentifier(), start);
                
                    } else if (next.type === "function") {
                    
                        return this.FunctionExpression();
                    
                    } else if (next.type === "IDENTIFIER" && isFunctionModifier(value)) {
                    
                        this.read();
                        this.pushContext(true);
                        return this.ArrowFunctionHead(value, this.BindingIdentifier(), start);
                    }
                }
                
                return this.Identifier(true);
            
            case "REGEX": return this.RegularExpression();
            
            case "null":
                this.read();
                return new AST.NullLiteral(token.start, token.end);
            
            case "true":
            case "false":
                this.read();
                return new AST.BooleanLiteral(type === "true", token.start, token.end);
            
            case "this":
                this.read();
                return new AST.ThisExpression(token.start, token.end);
        }
        
        this.unexpected(token);
    },
    
    Identifier: function(isVar) {
    
        var token = this.readToken("IDENTIFIER"),
            node = new AST.Identifier(token.value, isVar ? "variable" : "", token.start, token.end);
        
        this.checkIdentifier(node);
        return node;
    },
    
    IdentifierName: function() {
    
        var token = this.readToken("IDENTIFIER", "name");
        return new AST.Identifier(token.value, "", token.start, token.end);
    },
    
    StringLiteral: function() {
    
        var token = this.readToken("STRING"),
            node = new AST.StringLiteral(token.value, token.start, token.end);
        
        if (token.strictError)
            this.addStrictError(token.strictError, node);
        
        return node;
    },
    
    NumberLiteral: function() {
    
        var token = this.readToken("NUMBER"),
            node = new AST.NumberLiteral(token.number, token.start, token.end);
        
        if (token.strictError)
            this.addStrictError(token.strictError, node);
        
        return node;
    },
    
    TemplatePart: function() {
    
        var token = this.readToken("TEMPLATE", "template"),
            end = token.templateEnd,
            node;
        
        node = new AST.TemplatePart(
            token.value, 
            this.scanner.rawValue(token.start + 1, token.end - (end ? 1 : 2)), 
            end, 
            token.start, 
            token.end);
        
        if (token.strictError)
            this.addStrictError(token.strictError, node);
        
        return node;
    },
    
    RegularExpression: function() {
    
        // TODO:  Validate regular expression against RegExp grammar (21.2.1)
        var token = this.readToken("REGEX");
        
        return new AST.RegularExpression(
            token.value, 
            token.regexFlags, 
            token.start, 
            token.end);
    },
    
    BindingIdentifier: function() {
    
        var token = this.readToken("IDENTIFIER"),
            node = new AST.Identifier(token.value, "", token.start, token.end);
        
        this.checkBindingTarget(node);
        return node;
    },
    
    BindingPattern: function() {
    
        var node;
        
        switch (this.peek()) { 
        
            case "{":
                node = this.ObjectLiteral();
                break;
            
            case "[":
                node = this.ArrayLiteral();
                break;
            
            default:
                return this.BindingIdentifier();
        }
        
        this.checkBindingTarget(node);
        return node;
    },
    
    ParenExpression: function() {

        var start = this.nodeStart(),
            expr = null,
            rest = null;
        
        // Push a new context in case we are parsing an arrow function
        this.pushMaybeContext();
        
        this.read("(");
        
        switch (this.peek()) {
        
            // An empty arrow function formal list
            case ")":
                break;
            
            // Paren expression
            default:
                expr = this.Expression();
                break;
        }
        
        this.read(")");
        
        var next = this.peekToken("div");
        
        if (!next.newlineBefore && (next.type === "=>" || expr === null))
            return this.ArrowFunctionHead("", expr, start);
        
        // Collapse this context into its parent
        this.popContext(true);
        
        return new AST.ParenExpression(expr, start, this.nodeEnd());
    },
    
    ObjectLiteral: function() {
    
        var start = this.nodeStart(),
            nameSet = new IntMap,
            comma = false,
            list = [],
            node;
        
        this.read("{");
        
        while (this.peekUntil("}", "name")) {
        
            if (!comma && node) {
            
                this.read(",");
                comma = true;

            } else {
            
                comma = false;
                list.push(node = this.PropertyDefinition());
                this.checkPropertyName(node, nameSet);
            }
        }
        
        this.read("}");
        
        return new AST.ObjectLiteral(list, start, this.nodeEnd());
    },
    
    PropertyDefinition: function() {
    
        var start = this.nodeStart(),
            node,
            name;
        
        if (this.peek("name") === "*")
            return this.MethodDefinition();
        
        switch (this.peekAt("name", 1)) {
        
            case "=":
        
                // Re-read token as an identifier
                this.unpeek();
            
                node = new AST.PatternProperty(
                    this.Identifier(true),
                    null,
                    (this.read(), this.AssignmentExpression()),
                    start,
                    this.nodeEnd());
        
                this.addInvalidNode("Invalid property definition in object literal", node);
                return node;
            
            case ",":
            case "}":
            
                // Re-read token as an identifier
                this.unpeek();
        
                return new AST.PropertyDefinition(
                    this.Identifier(true),
                    null,
                    start,
                    this.nodeEnd());
        }
            
        name = this.PropertyName();
        
        if (this.peek("name") === ":") {
        
            return new AST.PropertyDefinition(
                name,
                (this.read(), this.AssignmentExpression()),
                start,
                this.nodeEnd());
        }
        
        return this.MethodDefinition(name);
    },
    
    PropertyName: function() {
    
        var token = this.peekToken("name");
        
        switch (token.type) {
        
            case "IDENTIFIER": return this.IdentifierName();
            case "STRING": return this.StringLiteral();
            case "NUMBER": return this.NumberLiteral();
            case "[": return this.ComputedPropertyName();
        }
        
        this.unexpected(token);
    },
    
    ComputedPropertyName: function() {
    
        var start = this.nodeStart();
        
        this.read("[");
        var expr = this.AssignmentExpression();
        this.read("]");
        
        return new AST.ComputedPropertyName(expr, start, this.nodeEnd());
    },
    
    ArrayLiteral: function() {
    
        var start = this.nodeStart(),
            comma = false,
            list = [],
            type;
        
        this.read("[");
        
        while (type = this.peekUntil("]")) {
            
            if (type === ",") {
            
                this.read();
                
                if (comma)
                    list.push(null);
                
                comma = true;
            
            } else {
            
                list.push(this.AssignmentExpression(false, true));
                comma = false;
            }
        }
        
        this.read("]");
        
        return new AST.ArrayLiteral(list, start, this.nodeEnd());
    },
    
    ArrayComprehension: function() {
    
        var start = this.nodeStart();
        
        this.read("[");
        
        var list = this.ComprehensionQualifierList(),
            expr = this.AssignmentExpression();
        
        this.read("]");
        
        return new AST.ArrayComprehension(list, expr, start, this.nodeEnd());
    },
    
    GeneratorComprehension: function() {
    
        var start = this.nodeStart(),
            fType = this.context.functionType;
        
        // Generator comprehensions cannot contain contextual expresions like yield
        this.context.functionType = "";
        this.read("(");
        
        var list = this.ComprehensionQualifierList(),
            expr = this.AssignmentExpression();
        
        this.read(")");
        this.context.functionType = fType;
        
        return new AST.GeneratorComprehension(list, expr, start, this.nodeEnd());
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
    
        var start = this.nodeStart();
        
        this.read("for");
        
        return new AST.ComprehensionFor(
            this.BindingPattern(),
            (this.readKeyword("of"), this.AssignmentExpression()),
            start,
            this.nodeEnd());
    },
    
    ComprehensionIf: function() {
    
        var start = this.nodeStart(),
            test;
            
        this.read("if");
        
        this.read("(");
        test = this.AssignmentExpression();
        this.read(")");
        
        return new AST.ComprehensionIf(test, start, this.nodeEnd());
    },
    
    TemplateExpression: function() {
        
        var atom = this.TemplatePart(),
            start = atom.start,
            lit = [atom],
            sub = [];
        
        while (!atom.templateEnd) {
        
            sub.push(this.Expression());
            
            // Discard any tokens that have been scanned using a different context
            this.unpeek();
            
            lit.push(atom = this.TemplatePart());
        }
        
        return new AST.TemplateExpression(lit, sub, start, this.nodeEnd());
    },
    
    // === Statements ===
    
    Statement: function(label) {
    
        var next;
        
        switch (this.peek()) {
            
            case "IDENTIFIER":
            
                next = this.peekTokenAt("div", 1);
                
                if (next.type === ":")
                    return this.LabelledStatement();
                
                return this.ExpressionStatement();
            
            case "{": return this.Block();
            case ";": return this.EmptyStatement();
            case "var": return this.VariableStatement();
            case "return": return this.ReturnStatement();
            case "break": return this.BreakStatement();
            case "continue": return this.ContinueStatement();
            case "throw": return this.ThrowStatement();
            case "debugger": return this.DebuggerStatement();
            case "if": return this.IfStatement();
            case "do": return this.DoWhileStatement(label);
            case "while": return this.WhileStatement(label);
            case "for": return this.ForStatement(label);
            case "with": return this.WithStatement();
            case "switch": return this.SwitchStatement();
            case "try": return this.TryStatement();
            
            default: return this.ExpressionStatement();
        }
    },
    
    Block: function() {
        
        var start = this.nodeStart();
        
        this.read("{");
        var list = this.StatementList(false, false);
        this.read("}");
        
        return new AST.Block(list, start, this.nodeEnd());
    },
    
    Semicolon: function() {
    
        var token = this.peekToken(),
            type = token.type;
        
        if (type === ";" || !(type === "}" || type === "EOF" || token.newlineBefore))
            this.read(";");
    },
    
    LabelledStatement: function() {
    
        var start = this.nodeStart(),
            label = this.Identifier(),
            name = label.value,
            labelSet = this.context.labelSet;
        
        if (labelSet.get(name) > 0)
            this.fail("Invalid label", label);
        
        this.read(":");
        
        labelSet.set(name, 1);
        var statement = this.Statement(name);
        labelSet.set(name, 0);
        
        return new AST.LabelledStatement(
            label, 
            statement,
            start,
            this.nodeEnd());
    },
    
    ExpressionStatement: function() {
    
        var start = this.nodeStart(),
            expr = this.Expression();
        
        this.Semicolon();
        
        return new AST.ExpressionStatement(expr, start, this.nodeEnd());
    },
    
    EmptyStatement: function() {
    
        var start = this.nodeStart();
        
        this.Semicolon();
        
        return new AST.EmptyStatement(start, this.nodeEnd());
    },
    
    VariableStatement: function() {
    
        var node = this.VariableDeclaration(false);
        
        this.Semicolon();
        node.end = this.nodeEnd();
        
        return node;
    },
    
    VariableDeclaration: function(noIn) {
    
        var start = this.nodeStart(),
            token = this.peekToken(),
            kind = token.type,
            isConst = false,
            list = [];
        
        switch (kind) {
        
            case "var":
                break;
            
            case "const":
                isConst = true;
                break;
            
            case "IDENTIFIER":
            
                if (token.value === "let") {
                
                    kind = "let";
                    break;
                }
                
            default:
                this.fail("Expected var, const, or let");
        }
        
        this.read();
        
        while (true) {
        
            list.push(this.VariableDeclarator(noIn, isConst));
            
            if (this.peek() === ",") this.read();
            else break;
        }
        
        return new AST.VariableDeclaration(kind, list, start, this.nodeEnd());
    },
    
    VariableDeclarator: function(noIn, isConst) {
    
        var start = this.nodeStart(),
            pattern = this.BindingPattern(),
            init = null;
        
        if ((!noIn && pattern.type !== "Identifier") || this.peek() === "=") {
        
            // NOTE: Patterns must have initializers when not in declaration
            // section of a for statement
            
            this.read("=");
            init = this.AssignmentExpression(noIn);
            
        } else if (isConst) {
        
            this.fail("Missing const initializer", pattern);
        }
        
        return new AST.VariableDeclarator(pattern, init, start, this.nodeEnd());
    },
    
    ReturnStatement: function() {
    
        if (!this.context.isFunction)
            this.fail("Return statement outside of function");
        
        var start = this.nodeStart();
        
        this.read("return");
        var value = this.peekEnd() ? null : this.Expression();
        
        this.Semicolon();
        
        return new AST.ReturnStatement(value, start, this.nodeEnd());
    },
    
    BreakStatement: function() {
    
        var start = this.nodeStart(),
            context = this.context,
            labelSet = context.labelSet;
        
        this.read("break");
        var label = this.peekEnd() ? null : this.Identifier();
        this.Semicolon();
        
        var node = new AST.BreakStatement(label, start, this.nodeEnd());
        
        if (label) {
        
            if (labelSet.get(label.value) === 0)
                this.fail("Invalid label", label);
                
        } else if (context.loopDepth === 0 && context.switchDepth === 0) {
        
            this.fail("Break not contained within a switch or loop", node);
        }
        
        return node;
    },
    
    ContinueStatement: function() {
    
        var start = this.nodeStart(),
            context = this.context,
            labelSet = context.labelSet;
        
        this.read("continue");
        var label = this.peekEnd() ? null : this.Identifier();
        this.Semicolon();
        
        var node = new AST.ContinueStatement(label, start, this.nodeEnd());
        
        if (label) {
        
            if (labelSet.get(label.value) !== 2)
                this.fail("Invalid label", label);
                
        } else if (context.loopDepth === 0) {
        
            this.fail("Continue not contained within a loop", node);
        }
        
        return node;
    },

    ThrowStatement: function() {
    
        var start = this.nodeStart();
        
        this.read("throw");
        
        var expr = this.peekEnd() ? null : this.Expression();
        
        if (expr === null)
            this.fail("Missing throw expression");
        
        this.Semicolon();
        
        return new AST.ThrowStatement(expr, start, this.nodeEnd());
    },
    
    DebuggerStatement: function() {
    
        var start = this.nodeStart();
        
        this.read("debugger");
        this.Semicolon();
        
        return new AST.DebuggerStatement(start, this.nodeEnd());
    },
    
    IfStatement: function() {
    
        var start = this.nodeStart();
        
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
        
        return new AST.IfStatement(test, body, elseBody, start, this.nodeEnd());
    },
    
    DoWhileStatement: function(label) {
    
        var start = this.nodeStart(),
            body, 
            test;
        
        if (label) 
            this.setLoopLabel(label);
        
        this.read("do");
        
        this.context.loopDepth += 1;
        body = this.Statement();
        this.context.loopDepth -= 1;
        
        this.read("while");
        this.read("(");
        
        test = this.Expression();
        
        this.read(")");
        
        return new AST.DoWhileStatement(body, test, start, this.nodeEnd());
    },
    
    WhileStatement: function(label) {
    
        var start = this.nodeStart();
        
        if (label) 
            this.setLoopLabel(label);
        
        this.read("while");
        this.read("(");
        var expr = this.Expression();
        this.read(")");
        
        this.context.loopDepth += 1;
        var statement = this.Statement();
        this.context.loopDepth -= 1;
        
        return new AST.WhileStatement(
            expr, 
            statement, 
            start, 
            this.nodeEnd());
    },
    
    ForStatement: function(label) {
    
        var start = this.nodeStart(),
            init = null,
            test,
            step;
        
        if (label) 
            this.setLoopLabel(label);
        
        this.read("for");
        this.read("(");
        
        // Get loop initializer
        switch (this.peek()) {
        
            case ";":
                break;
                
            case "var":
            case "const":
                init = this.VariableDeclaration(true);
                break;
            
            case "IDENTIFIER":
            
                if (this.peekLet()) {
                
                    init = this.VariableDeclaration(true);
                    break;
                }
            
            default:
                init = this.Expression(true);
                break;
        }
        
        if (init) {
        
            if (this.peek() === "in")
                return this.ForInStatement(init, start);
        
            if (this.peekKeyword("of"))
                return this.ForOfStatement(init, start);
        }
        
        this.read(";");
        test = this.peek() === ";" ? null : this.Expression();
        
        this.read(";");
        step = this.peek() === ")" ? null : this.Expression();
        
        this.read(")");
        
        this.context.loopDepth += 1;
        var statement = this.Statement();
        this.context.loopDepth -= 1;
        
        return new AST.ForStatement(
            init, 
            test, 
            step, 
            statement, 
            start, 
            this.nodeEnd());
    },
    
    ForInStatement: function(init, start) {
    
        this.checkForInit(init, "in");
        
        this.read("in");
        var expr = this.Expression();
        this.read(")");
        
        this.context.loopDepth += 1;
        var statement = this.Statement();
        this.context.loopDepth -= 1;
        
        return new AST.ForInStatement(
            init, 
            expr, 
            statement, 
            start, 
            this.nodeEnd());
    },
    
    ForOfStatement: function(init, start) {
    
        this.checkForInit(init, "of");
        
        this.readKeyword("of");
        var expr = this.AssignmentExpression();
        this.read(")");
        
        this.context.loopDepth += 1;
        var statement = this.Statement();
        this.context.loopDepth -= 1;
        
        return new AST.ForOfStatement(
            init, 
            expr, 
            statement, 
            start, 
            this.nodeEnd());
    },
    
    WithStatement: function() {
    
        var start = this.nodeStart();
        
        this.read("with");
        this.read("(");
        
        var node = new AST.WithStatement(
            this.Expression(), 
            (this.read(")"), this.Statement()),
            start,
            this.nodeEnd());
            
        this.addStrictError("With statement is not allowed in strict mode", node);
        
        return node;
    },
    
    SwitchStatement: function() {
    
        var start = this.nodeStart();
        
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
                    this.fail("Switch statement cannot have more than one default", node);
                
                hasDefault = true;
            }
            
            cases.push(node);
        }
        
        this.context.switchDepth -= 1;
        this.read("}");
        
        return new AST.SwitchStatement(head, cases, start, this.nodeEnd());
    },
    
    SwitchCase: function() {
    
        var start = this.nodeStart(),
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
        
        return new AST.SwitchCase(expr, list, start, this.nodeEnd());
    },
    
    TryStatement: function() {
    
        var start = this.nodeStart();
        
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
        
        return new AST.TryStatement(tryBlock, handler, fin, start, this.nodeEnd());
    },
    
    CatchClause: function() {
    
        var start = this.nodeStart();
        
        this.read("catch");
        this.read("(");
        var param = this.BindingPattern();
        this.read(")");
        
        return new AST.CatchClause(param, this.Block(), start, this.nodeEnd());
    },
    
    // === Declarations ===
    
    StatementList: function(prologue, isModule) {
    
        var list = [],
            element,
            node,
            dir;
        
        // TODO: is this wrong for braceless statement lists?
        while (this.peekUntil("}")) {
        
            list.push(element = this.Declaration(isModule));
            
            // Check for directives
            if (prologue) {
            
                if (element.type === "ExpressionStatement" &&
                    element.expression.type === "StringLiteral") {
                
                    // Get the non-escaped literal text of the string
                    node = element.expression;
                    dir = this.input.slice(node.start + 1, node.end - 1);

                    // Check for strict mode
                    if (dir === "use strict")
                        this.setStrict(true);
                        
                } else {
                
                    prologue = false;
                }
            }
        }
        
        return list;
    },
    
    Declaration: function(isModule) {
    
        switch (this.peek()) {
            
            case "function": return this.FunctionDeclaration();
            case "class": return this.ClassDeclaration();
            case "const": return this.LexicalDeclaration();
            
            case "import": 
            
                if (isModule)
                    return this.ImportDeclaration();
            
            case "export":
                
                if (isModule)
                    return this.ExportDeclaration();
                
                break;
            
            case "IDENTIFIER":
            
                if (this.peekLet())
                    return this.LexicalDeclaration();
                
                if (this.peekFunctionModifier())
                    return this.FunctionDeclaration();
                
                if (this.peekModule())
                    return this.ModuleDefinition();
                
                break;
        }
        
        return this.Statement();
    },
    
    LexicalDeclaration: function() {
    
        var node = this.VariableDeclaration(false);
        
        this.Semicolon();
        node.end = this.nodeEnd();
        
        return node;
    },
    
    // === Functions ===
    
    FunctionDeclaration: function() {
    
        var start = this.nodeStart(),
            kind = "",
            tok;
        
        tok = this.peekToken();
        
        if (isFunctionModifier(keywordFromToken(tok))) {
        
            this.read();
            kind = tok.value;
        }
        
        this.read("function");
        
        if (!kind && this.peek() === "*") {
            
            this.read();
            kind = "generator";
        }
        
        this.pushContext(true);
        this.context.functionType = kind;
        
        var ident = this.BindingIdentifier(),
            params = this.FormalParameters(),
            body = this.FunctionBody();

        this.checkParameters(params);
        this.popContext();
        
        return new AST.FunctionDeclaration(
            kind,
            ident,
            params,
            body,
            start,
            this.nodeEnd());
    },
    
    FunctionExpression: function() {
    
        var start = this.nodeStart(),
            ident = null,
            kind = "",
            tok;
        
        tok = this.peekToken();
        
        if (isFunctionModifier(keywordFromToken(tok))) {
        
            this.read();
            kind = tok.value;
        }
        
        this.read("function");
        
        if (!kind && this.peek() === "*") {
            
            this.read();
            kind = "generator";
        }
        
        this.pushContext(true);
        this.context.functionType = kind;
        
        if (this.peek() !== "(")
            ident = this.BindingIdentifier();
        
        var params = this.FormalParameters(),
            body = this.FunctionBody();
        
        this.checkParameters(params);
        this.popContext();
        
        return new AST.FunctionExpression(
            kind,
            ident,
            params,
            body,
            start,
            this.nodeEnd());
    },
    
    MethodDefinition: function(name) {
    
        var start = name ? name.start : this.nodeStart(),
            kind = "",
            val;
        
        if (!name && this.peek("name") === "*") {
        
            this.read();
            
            kind = "generator";
            name = this.PropertyName();
        
        } else {
        
            if (!name)
                name = this.PropertyName();
            
            val = keywordFromNode(name);
            
            if (this.peek("name") !== "(") {
                
                if (val === "get" || val === "set" || isFunctionModifier(val)) {
                
                    kind = name.value;
                    name = this.PropertyName();
                }
            }
        }
        
        this.pushContext(true);
        
        if (kind === "generator" || isFunctionModifier(kind))
            this.context.functionType = kind;
        
        var params = kind === "get" || kind === "set" ?
            this.AccessorParameters(kind) :
            this.FormalParameters();
        
        var body = this.FunctionBody();
        
        this.checkParameters(params);
        this.popContext();
        
        return new AST.MethodDefinition(
            kind,
            name,
            params,
            body,
            start,
            this.nodeEnd());
    },
    
    AccessorParameters: function(kind) {
    
        var list = [];
        
        this.read("(");
        
        if (kind === "set")
            list.push(this.FormalParameter(false));
        
        this.read(")");
        
        return list;
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
            
            list.push(this.FormalParameter(true));
        }
        
        this.read(")");
        
        return list;
    },
    
    FormalParameter: function(allowDefault) {
    
        var start = this.nodeStart(),
            pattern = this.BindingPattern(),
            init = null;
        
        if (allowDefault && this.peek() === "=") {
        
            this.read("=");
            init = this.AssignmentExpression();
        }
        
        return new AST.FormalParameter(pattern, init, start, this.nodeEnd());
    },
    
    RestParameter: function() {
    
        var start = this.nodeStart();
        
        this.read("...");
        
        return new AST.RestParameter(this.BindingIdentifier(), start, this.nodeEnd());
    },
    
    FunctionBody: function() {
        
        this.context.functionBody = true;
        
        var start = this.nodeStart();
        
        this.read("{");
        var statements = this.StatementList(true, false);
        this.read("}");
        
        return new AST.FunctionBody(statements, start, this.nodeEnd());
    },
    
    ArrowFunctionHead: function(kind, formals, start) {
    
        // Context must have been pushed by caller
        this.context.isFunction = true;
        this.context.functionType = kind;
        
        // Transform and validate formal parameters
        var params = this.checkArrowParameters(formals);
        
        return new AST.ArrowFunctionHead(params, start, this.nodeEnd());
    },
    
    ArrowFunctionBody: function(head, noIn) {
    
        this.read("=>");
        
        var params = head.parameters,
            start = head.start,
            kind = this.context.functionType;
        
        // Use function body context even if parsing expression body form
        this.context.functionBody = true;
        
        var body = this.peek() === "{" ?
            this.FunctionBody() :
            this.AssignmentExpression(noIn);
        
        this.popContext();
        
        return new AST.ArrowFunction(kind, params, body, start, this.nodeEnd());
    },
    
    // === Classes ===
    
    ClassDeclaration: function() {
    
        var start = this.nodeStart(),
            ident = null,
            base = null;
        
        this.read("class");
        
        ident = this.BindingIdentifier();
        
        if (this.peek() === "extends") {
        
            this.read();
            base = this.MemberExpression(true);
        }
        
        return new AST.ClassDeclaration(
            ident,
            base,
            this.ClassBody(),
            start,
            this.nodeEnd());
    },
    
    ClassExpression: function() {
    
        var start = this.nodeStart(), 
            ident = null,
            base = null;
        
        this.read("class");
        
        if (this.peek() === "IDENTIFIER")
            ident = this.BindingIdentifier();
        
        if (this.peek() === "extends") {
        
            this.read();
            base = this.MemberExpression(true);
        }
        
        return new AST.ClassExpression(
            ident, 
            base, 
            this.ClassBody(), 
            start, 
            this.nodeEnd());
    },
    
    ClassBody: function() {
        
        var start = this.nodeStart(),
            nameSet = new IntMap, 
            staticSet = new IntMap,
            list = [],
            node;
        
        this.pushContext(false);
        this.setStrict(true);
        this.read("{");
        
        while (this.peekUntil("}", "name")) {
        
            list.push(node = this.ClassElement());
            this.checkPropertyName(node.method, node.static ? staticSet : nameSet);
        }
        
        this.read("}");
        this.popContext();
        
        return new AST.ClassBody(list, start, this.nodeEnd());
    },
    
    ClassElement: function() {
    
        var start = this.nodeStart(),
            isStatic = false;
        
        // Check for static modifier
        if (this.peekToken("name").value === "static" &&
            this.peekAt("name", 1) !== "(") {
        
            isStatic = true;
            this.read();
        }
        
        var method = this.MethodDefinition(),
            name = method.name;
        
        if (isStatic) {
        
            if (name.type === "Identifier" && name.value === "prototype")
                this.fail("Invalid prototype property in class definition", name);
            
        } else {
        
            if (name.type === "Identifier" && name.value === "constructor" && method.kind !== "")
                this.fail("Invalid constructor property in class definition", name);
        }
        
        return new AST.ClassElement(isStatic, method, start, this.nodeEnd());
    },
    
    // === Modules ===
    
    ModuleDefinition: function() {
    
        var start = this.nodeStart(),
            ident,
            target;
        
        this.readKeyword("module");
        
        ident = this.BindingIdentifier();
        
        if (this.peek() === "=") {
    
            this.read();
            target = this.ModulePath();
            this.Semicolon();
        
            return new AST.ModuleAlias(
                ident,
                target,
                start,
                this.nodeEnd());
            
        } else if (this.peekKeyword("from")) {
    
            this.read();
            target = this.ModuleSpecifier();
            this.Semicolon();
        
            return new AST.ModuleImport(
                ident,
                target,
                start,
                this.nodeEnd());
        }
        
        return new AST.ModuleDeclaration(
            ident,
            this.ModuleBody(),
            start,
            this.nodeEnd());
    },
    
    ModuleDeclaration: function() {
        
        var start = this.nodeStart();
        
        this.readKeyword("module");
        
        return new AST.ModuleDeclaration(
            this.BindingIdentifier(),
            this.ModuleBody(),
            start,
            this.nodeEnd());
    },
    
    ModuleBody: function() {
    
        this.pushContext(false);
        this.setStrict(true);
        
        var start = this.nodeStart();
        
        this.read("{");
        var list = this.StatementList(true, true);
        this.read("}");
        
        this.popContext();
        
        return new AST.ModuleBody(list, start, this.nodeEnd());
    },
    
    ModuleSpecifier: function() {
    
        return this.peek() === "STRING" ? this.StringLiteral() : this.ModulePath();
    },
    
    ImportDeclaration: function() {
    
        var start = this.nodeStart(),
            ident,
            from;
        
        this.read("import");
        
        switch (this.peek()) {
        
            case "IDENTIFIER":
            
                ident = this.BindingIdentifier();
                this.readKeyword("from");
                from = this.ModuleSpecifier();
                this.Semicolon();
                
                return new AST.ImportDefaultDeclaration(ident, from, start, this.nodeEnd());
            
            case "STRING":
            
                from = this.ModuleSpecifier();
                this.Semicolon();
                
                return new AST.ImportDeclaration(null, from, start, this.nodeEnd());
        }
        
        var list = [];
        
        this.read("{");
    
        while (this.peekUntil("}")) {
    
            list.push(this.ImportSpecifier());
        
            if (this.peek() === ",") 
                this.read();
        }
    
        this.read("}");
        this.readKeyword("from");
        from = this.ModuleSpecifier();
        this.Semicolon();
        
        return new AST.ImportDeclaration(list, from, start, this.nodeEnd());
    },
    
    ImportSpecifier: function() {
    
        var start = this.nodeStart(),
            hasLocal = false,
            local = null,
            remote;
        
        if (this.peek() !== "IDENTIFIER") {
        
            // Re-scan token as an identifier name
            this.unpeek();
            remote = this.IdentifierName();
            hasLocal = true;
            
        } else {
        
            remote = this.Identifier();
            hasLocal = this.peekKeyword("as");
        }
        
        if (hasLocal) {
        
            this.readKeyword("as");
            local = this.BindingIdentifier();
            
        } else {
        
            this.checkBindingTarget(remote);
        }
        
        return new AST.ImportSpecifier(remote, local, start, this.nodeEnd());
    },
    
    ExportDeclaration: function() {
    
        var start = this.nodeStart(),
            binding;
        
        this.read("export");
        
        switch (this.peek()) {
                
            case "var":
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
            
                if (this.peekLet()) {
                
                    binding = this.VariableDeclaration(false);
                    this.Semicolon();
                    break;
                }
                
                if (this.peekFunctionModifier()) {
                
                    binding = this.FunctionDeclaration();
                    break;
                }
            
                if (this.peekModule()) {
                
                    binding = this.ModuleDeclaration();
                    break;
                }
                
            default:
                
                binding = this.ExportsList();
                this.Semicolon();
                break;
        }
        
        return new AST.ExportDeclaration(binding, start, this.nodeEnd());
    },
    
    ExportsList: function() {
    
        var start = this.nodeStart(),
            list = null,
            from = null;
        
        if (this.peek() === "*") {
        
            this.read();
            this.readKeyword("from");
            from = this.ModuleSpecifier();
            
        } else {
        
            list = [];
            
            this.read("{");
            
            while (this.peekUntil("}")) {
        
                list.push(this.ExportSpecifier());
            
                if (this.peek() === ",") 
                    this.read();
            }
            
            this.read("}");
            
            if (this.peekKeyword("from")) {
            
                this.read();
                from = this.ModuleSpecifier();
            
            } else {
            
                // TODO: Make sure that export specifiers do
                // not reference reserved words!
            }
        }
        
        return new AST.ExportsList(list, from, start, this.nodeEnd());
    },
    
    ExportSpecifier: function() {
    
        var start = this.nodeStart(),
            local = this.IdentifierName(),
            remote = null;
        
        if (this.peekKeyword("as")) {
        
            this.read();
            remote = this.IdentifierName();
        }
        
        return new AST.ExportSpecifier(local, remote, start, this.nodeEnd());
    },
    
    ModulePath: function() {
    
        var start = this.nodeStart(),
            path = [];
        
        while (true) {
        
            path.push(this.Identifier());
            
            if (this.peek() === ".") this.read();
            else break;
        }
        
        return new AST.ModulePath(path, start, this.nodeEnd());
    }, constructor: function Parser() {}
    
} });

// Add externally defined methods
Object.assign(Parser.prototype, Transform.prototype);
Object.assign(Parser.prototype, Validate.prototype);


exports.Parser = Parser; return exports; }).call(this, {});

var main______ = (function(exports) { 

var Parser = Parser_.Parser;
var AST = AST_.AST;

function parse(input, options) {

    return new Parser().parse(input, options);
}










exports.AST = AST; exports.Parser = Parser; exports.parse = parse; exports.default = parse; return exports; }).call(this, {});

var main___ = (function(exports) { 

Object.keys(main______).forEach(function(k) { exports[k] = main______[k]; });

return exports; }).call(this, {});

var Replacer_ = (function(exports) { 

/*

== Notes ==

- With this approach, we can't have cyclic dependencies.  But there are
  many other restrictions as well.  They may be lifted at some point in
  the future.

*/

var Parser = main___.Parser, AST = main___.AST;

var HAS_SCHEMA = /^[a-z]+:/i,
    NODE_SCHEMA = /^(?:npm|node):/i;

var RESERVED_WORD = new RegExp("^(?:" +
    "break|case|catch|class|const|continue|debugger|default|delete|do|" +
    "else|enum|export|extends|false|finally|for|function|if|import|in|" +
    "instanceof|new|null|return|super|switch|this|throw|true|try|typeof|" +
    "var|void|while|with|implements|private|public|interface|package|let|" +
    "protected|static|yield" +
")$");

function countNewlines(text) {

    var m = text.match(/\r\n?|\n/g);
    return m ? m.length : 0;
}

function preserveNewlines(text, height) {

    var n = countNewlines(text);
    
    if (height > 0 && n < height)
        text += "\n".repeat(height - n);
    
    return text;
}

var PatternTreeNode = _es6now.Class(function(__super) { return {

    constructor: function PatternTreeNode(name, init) {
    
        this.name = name;
        this.initializer = init;
        this.children = [];
        this.target = "";
        this.rest = false;
    }
} });

var RootNode = _es6now.Class(AST.Node, function(__super) { return {

    constructor: function RootNode(root, end) {
    
        this.type = "Root";
        this.start = 0;
        this.end = end;
        this.root = root;
    }
} });

var Replacer = _es6now.Class(function(__super) { return {

    replace: function(input, options) { var __this = this; 
        
        options || (options = {});
        
        this.loadCall = options.loadCall || ((function(url) { return "__load(" + JSON.stringify(url) + ")"; }));
        this.mapURI = options.mapURI || ((function(uri) { return uri; }));
        
        var parser = new Parser,
            root = parser.parse(input, { module: options.module });
        
        this.input = input;
        this.parser = parser;
        this.exportStack = [this.exports = {}];
        this.imports = {};
        this.dependencies = [];
        this.isStrict = false;
        this.uid = 0;
        
        var visit = (function(node) {
        
            node.text = null;
                
            // Call pre-order traversal method
            if (__this[node.type + "Begin"])
                __this[node.type + "Begin"](node);
                
            var strict = __this.isStrict;
            
            // Set the strictness for implicitly strict nodes
            switch (node.type) {
            
                case "Module":
                case "ModuleDeclaration":
                case "ClassDeclaration":
                case "ClassExpresion":
                    __this.isStrict = true;
            }
            
            // Perform a depth-first traversal
            node.children().forEach((function(child) {
            
                child.parent = node;
                visit(child);
            }));
            
            // Restore strictness
            __this.isStrict = strict;
            
            var text = null;
            
            // Call replacer
            if (__this[node.type])
                text = __this[node.type](node);
            
            if (text === null || text === void 0)
                text = __this.stringify(node);
            
            return node.text = __this.syncNewlines(node.start, node.end, text);
        });
        
        var output = visit(new RootNode(root, input.length)),
            head = "";
        
        this.dependencies.forEach((function(url) {
        
            if (head) head += ", ";
            else head = "var ";
            
            head += __this.imports[url] + " = " + __this.loadCall(url);
        }));
        
        if (head) 
            head += "; ";
        
        output = head + output;
        
        Object.keys(this.exports).forEach((function(k) {
    
            output += "\nexports";
            
            if (RESERVED_WORD.test(k))
                output += "[" + JSON.stringify(k) + "]";
            else
                output += "." + k;
            
            output += " = " + __this.exports[k] + ";";
        }));
        
        return output;
    },

    DoWhileStatement: function(node) {
    
        var text = this.stringify(node);
        
        if (text.slice(-1) !== ";")
            return text + ";";
    },
    
    ForOfStatement: function(node) {
    
        var iter = this.addTempVar(node),
            iterResult = this.addTempVar(node),
            value = "",
            out = "";
        
        out += "" + (iter) + " = _es6now.iterator(" + (node.right.text) + "); ";
        out += "for (";
        
        if (node.left.type === "VariableDeclaration") {
        
            out += node.left.text;
            value = node.left.declarations[0].pattern.value;
        
        } else {
        
            value = node.left.text;
        }
        
        out += "; " + (iterResult) + " = " + (iter) + ".next()";
        out += ", " + (value) + " = " + (iterResult) + ".value";
        out += ", !" + (iterResult) + ".done";
        out += ";) ";
        
        out = this.syncNewlines(node.left.start, node.body.start, out);
        
        return out + node.body.text;
    },
    
    Module: function(node) {
    
        // NOTE: Strict directive is included with module wrapper
        
        var inserted = [];
        
        if (node.createThisBinding)
            inserted.push("var __this = this;");
        
        if (node.tempVars)
            inserted.push(this.tempVars(node));
        
        if (inserted.length > 0)
            return inserted.join(" ") + " " + this.stringify(node);
    },
    
    Script: function(node) {
    
        return this.Module(node);
    },
    
    FunctionBody: function(node) {
        
        var insert = this.functionInsert(node.parent);
        
        if (insert)
            return "{ " + insert + " " + this.stringify(node).slice(1);
    },
    
    FormalParameter: function(node) {
    
        if (this.isPattern(node.pattern))
            return this.addTempVar(node, null, true);
        
        return node.pattern.text;
    },
    
    RestParameter: function(node) {
    
        node.parent.createRestBinding = true;
        
        var p = node.parent.params;
        
        if (p.length > 1) {
        
            var prev = p[p.length - 2];
            node.start = prev.end;
        }
        
        return "";
    },
    
    ComputedPropertyName: function(node) {
    
        return this.addComputedName(node);
    },
    
    ObjectLiteral: function(node) {
    
        if (node.computedNames)
            return this.wrapComputed(node);
    },
    
    MethodDefinition: function(node) {
    
        switch (node.kind) {
        
            case "":
                return node.name.text + ": function(" + 
                    this.joinList(node.params) + ") " + 
                    node.body.text;
            
            case "async":
                return node.name.text + ": " + this.asyncFunction(null, node.params, node.body.text);
            
            case "generator":
                return node.name.text + ": function*(" + 
                    this.joinList(node.params) + ") " + 
                    node.body.text;
        }
    },
    
    PropertyDefinition: function(node) {
    
        if (node.expression === null)
            return node.name.text + ": " + node.name.text;
    },
    
    ModuleImport: function(node) {
    
        return "var " + node.identifier.text + " = " + this.modulePath(node.from) + ";";
    },
    
    ModuleDeclarationBegin: function(node) {
    
        this.exportStack.push(this.exports = {});
    },
    
    ModuleDeclaration: function(node) { var __this = this; 
    
        var out = "var " + node.identifier.text + " = (function(exports) {";
        
        out += this.strictDirective() + " ";
        out += node.body.text.replace(/^\{|\}$/g, "");
        
        Object.keys(this.exports).forEach((function(k) {
    
            out += "exports." + k + " = " + __this.exports[k] + "; ";
        }));
        
        this.exportStack.pop();
        this.exports = this.exportStack[this.exportStack.length - 1];
        
        out += "return exports; }).call(this, {});";
        
        return out;
    },
    
    ImportDeclaration: function(node) {
    
        var moduleSpec = this.modulePath(node.from),
            list = [];
        
        if (node.specifiers) {
        
            node.specifiers.forEach((function(spec) {
        
                var imported = spec.imported,
                    local = spec.local || imported;
            
                list.push({
                    start: spec.start,
                    end: spec.end,
                    text: local.text + " = " + moduleSpec + "." + imported.text
                });
            }));
        }
        
        if (list.length === 0)
            return "";
        
        return "var " + this.joinList(list) + ";";
    },
    
    ImportDefaultDeclaration: function(node) {
    
        var moduleSpec = this.modulePath(node.from);
        return "var " + node.identifier.text + " = " + moduleSpec + "['default'];";
    },
    
    ExportDeclaration: function(node) {
    
        var binding = node.declaration,
            bindingType = binding ? binding.type : "*",
            exports = this.exports,
            ident;
        
        // Exported declarations
        switch (binding.type) {
        
            case "VariableDeclaration":
            
                binding.declarations.forEach((function(decl) {
            
                    ident = decl.pattern.text;
                    exports[ident] = ident;
                }));
                
                return binding.text + ";";
            
            case "FunctionDeclaration":
            case "ClassDeclaration":
            case "ModuleDeclaration":
            
                ident = binding.identifier.text;
                exports[ident] = ident;
                return binding.text;
        }
        
        var from = binding.from,
            fromPath = from ? this.modulePath(from) : "",
            out = "";
        
        if (!binding.specifiers) {
        
            out += "Object.keys(" + fromPath + ").forEach(function(k) { exports[k] = " + fromPath + "[k]; });";
        
        } else {
        
            binding.specifiers.forEach((function(spec) {
            
                var local = spec.local.text,
                    exported = spec.exported ? spec.exported.text : local;
            
                exports[exported] = from ? 
                    fromPath + "." + local :
                    local;
            }));
        }
        
        return out;
    },
    
    CallExpression: function(node) {
    
        var callee = node.callee,
            args = node.arguments,
            spread = null,
            calleeText,
            argText;
        
        if (node.hasSpreadArg) {
        
            spread = args.pop().expression.text;
            
            if (args.length > 0)
                spread = "[" + this.joinList(args) + "].concat(" + spread + ")";
        }
        
        if (node.isSuperCall) {
        
            if (spread)
                argText = "this, " + spread;
            else if (args.length > 0)
                argText = "this, " + this.joinList(args);
            else
                argText = "this";
            
            return callee.text + "." + (spread ? "apply" : "call") + "(" + argText + ")";
        }
        
        if (spread) {
        
            argText = "void 0";
            
            if (node.callee.type === "MemberExpression") {
            
                argText = this.addTempVar(node);
                
                callee.object.text = "(" + (argText) + " = " + (callee.object.text) + ")";
                callee.text = this.MemberExpression(callee) || this.stringify(callee);
            }
            
            return callee.text + ".apply(" + argText + ", " + spread + ")";
        }
    },
    
    SpreadExpression: function(node) {
    
        if (node.parent.type === "CallExpression")
            node.parent.hasSpreadArg = true;
    },
    
    SuperExpression: function(node) {
    
        var p = node.parent;
        
        if (p.type === "CallExpression") {
        
            // super(args);
            p.isSuperCall = true;
            
            var m = this.parentFunction(p),
                name = ".constructor";
            
            if (m.type === "MethodDefinition") {
            
                name = m.name.type === "Identifier" ?
                    "." + m.name.text :
                    "[" + JSON.stringify(m.name.text) + "]";
            }
            
            return "__super" + name;
            
        } else {
        
            // super.foo...
            p.isSuperLookup = true;
        }
        
        p = p.parent;
        
        if (p.type === "CallExpression") {
        
            // super.foo(args);
            p.isSuperCall = true;
        }
        
        return "__super";
    },
    
    MemberExpression: function(node) {
    
        if (node.isSuperLookup) {
        
            var prop = node.property.text;
            
            prop = node.computed ?
                "[" + prop + "]" :
                "." + prop;
            
            return node.object.text + prop;
        }
    },
    
    ArrowFunction: function(node) {
    
        var body = node.body.text;
        
        if (node.body.type !== "FunctionBody") {
        
            var insert = this.functionInsert(node);
            
            if (insert)
                insert += " ";
            
            body = "{ " + insert + "return " + body + "; }";
        }
        
        return node.kind === "async" ?
            "(" + this.asyncFunction(null, node.params, body) + ")" :
            "(function(" + this.joinList(node.params) + ") " + body + ")";
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
    
    UnaryExpression: function(node) {
    
        if (node.operator !== "await")
            return;
        
        return "(yield " + node.expression.text + ")";
    },
    
    FunctionDeclaration: function(node) {
    
        if (node.kind === "async")
            return this.asyncFunction(node.identifier, node.params, node.body.text);
    },
    
    FunctionExpression: function(node) {
    
        if (node.kind === "async")
            return this.asyncFunction(node.identifier, node.params, node.body.text);
    },
    
    ClassDeclaration: function(node) {
    
        return "var " + node.identifier.text + " = _es6now.Class(" + 
            (node.base ? (node.base.text + ", ") : "") +
            "function(__super) {" + this.strictDirective() + " return " +
            node.body.text + " });";
    },
    
    ClassExpression: function(node) {
    
        var before = "", 
            after = "";
        
        if (node.identifier) {
        
            before = "(function() { var " + node.identifier.text + " = ";
            after = "; return " + node.identifier.text + "; })()";
        }
        
        return "(" + before + 
            "_es6now.Class(" + 
            (node.base ? (node.base.text + ", ") : "") +
            "function(__super) {" + this.strictDirective() + " return " +
            node.body.text + " })" +
            after + ")";
    },
    
    ClassElement: function(node) {
    
        if (node.static) {
        
            var p = node.parent,
                id = p.staticID;
            
            if (id === void 0)
                id = p.staticID = 0;
            
            p.staticID += 1;
            
            var text = "{ " + this.stringify(node).replace(/^static\s+/, "") + " }";
            
            if (node.computedNames)
                text = this.wrapComputed(node, text);
            
            return "__static_" + id + ": " + text;
        }
    },
    
    ClassBody: function(node) {
    
        var classIdent = node.parent.identifier,
            hasBase = !!node.parent.base,
            elems = node.elements, 
            hasCtor = false,
            e,
            i;
        
        for (i = elems.length; i--;) {
        
            e = elems[i];
            
            if (!e.static && e.method.name.value === "constructor") {
            
                hasCtor = true;
                
                // Give the constructor function a name so that the
                // class function's name property will be correct.
                if (classIdent)
                    e.text = e.text.replace(/:\s*function/, ": function " + classIdent.value);
            }
            
            if (i < elems.length - 1)
                e.text += ",";
        }
        
        // Add a default constructor if none was provided
        if (!hasCtor) {
            
            var ctor = "constructor: function";
            
            if (classIdent)
                ctor += " " + classIdent.value;
            
            ctor += "() {";
            
            if (hasBase) {
            
                ctor += ' var c = __super.constructor; ';
                ctor += "if (c) return c.apply(this, arguments); }";
                
            } else {
            
                ctor += "}";
            }
            
            if (elems.length === 0)
                return "{ " + ctor + " }";
                
            elems[elems.length - 1].text += ", " + ctor;
        }
        
        if (node.computedNames)
            return this.wrapComputed(node);
    },
    
    TemplateExpression: function(node) { var __this = this; 
    
        var lit = node.literals,
            sub = node.substitutions,
            out = "",
            i;
            
        if (node.parent.type === "TaggedTemplateExpression") {
        
            out = "(_es6now.templateSite(" + 
                "[" + lit.map((function(x) { return __this.rawToString(x.raw); })).join(", ") + "]";
            
            // Only output the raw array if it is different from the cooked array
            for (i = 0; i < lit.length; ++i) {
            
                if (lit[i].raw !== lit[i].value) {
                
                    out += ", [" + lit.map((function(x) { return JSON.stringify(x.raw); })).join(", ") + "]";
                    break;
                }
            }
            
            out += ")";
            
            if (sub.length > 0)
                out += ", " + sub.map((function(x) { return x.text; })).join(", ");
            
            out += ")";
        
        } else {
        
            for (i = 0; i < lit.length; ++i) {
        
                if (i > 0)
                    out += " + (" + sub[i - 1].text + ") + ";
            
                out += this.rawToString(lit[i].raw);
            }
        }
        
        return out;
    },
    
    ComprehensionFor: function(node) {
    
        return "for (var " + node.left.text + " of " + node.right.text + ")";
    },
    
    ArrayComprehension: function(node) {
    
        var out = "(function() { var __array = []; ";
        
        node.qualifiers.forEach((function(q) { out += q.text + " " }));
        
        out += "__array.push(" + node.expression.text + "); ";
        out += "return __array; ";
        out += "}).call(this)"
        
        // Run replacer over this input to translate for-of statements
        return new Replacer().replace(out);
    },
    
    GeneratorComprehension: function(node) {
    
        var out = "(function*() { ";
        
        node.qualifiers.forEach((function(q) { out += q.text + " " }));
        
        out += "yield (" + node.expression.text + "); ";
        out += "}).call(this)"
        
        // Run replacer over this input to translate for-of statements
        return new Replacer().replace(out);
    },
    
    VariableDeclarator: function(node) {
        
        if (!this.isPattern(node.pattern))
            return null;
            
        var list = this.translatePattern(node.pattern, node.initializer.text);
        
        return list.join(", ");
    },
    
    AssignmentExpression: function(node) {
    
        var left = this.unwrapParens(node.left);
        
        if (!this.isPattern(left))
            return null;
        
        var temp = this.addTempVar(node),
            list = this.translatePattern(left, temp);
        
        list.unshift(temp + " = " + node.right.text);
        list.push(temp);
        
        return "(" + list.join(", ") + ")";
    },
    
    isPattern: function(node) {
    
        switch (node.type) {
        
            case "ArrayPattern":
            case "ObjectPattern":
                return true;
        }
        
        return false;
    },
    
    unwrapParens: function(node) {
    
        while (node && node.type === "ParenExpression")
            node = node.expression;
        
        return node;
    },
    
    translatePattern: function(node, base) { var __this = this; 
    
        var outer = [],
            inner = [];
        
        var visit = (function(tree, base) {
        
            var target = tree.target,
                str = "", 
                temp;
            
            // TODO:  If name is integer, then no quotes.  If name is
            // identifier, then no brackets.  Perhaps parser should expose
            // an isIdentifier function.
            
            var access =
                tree.rest ? "_es6now.rest(" + (base) + ", " + (tree.name) + ")" :
                tree.name ? "" + (base) + "[" + (JSON.stringify(tree.name)) + "]" :
                base;
            
            if (tree.initializer) {
            
                temp = __this.addTempVar(node);
                inner.push("" + (temp) + " = " + (access) + "");
                
                str = "" + (temp) + " === void 0 ? " + (tree.initializer) + " : " + (temp) + "";
                
                if (!tree.target)
                    str = "" + (temp) + " = _es6now.obj(" + (str) + ")";
                
                inner.push(str);
                    
            } else if (tree.target) {
            
                inner.push("" + (access) + "");
            
            } else {
            
                temp = __this.addTempVar(node);
                inner.push("" + (temp) + " = _es6now.obj(" + (access) + ")");
            }
            
            if (tree.target) {
            
                outer.push(inner.length === 1 ?
                    "" + (target) + " = " + (inner[0]) + "" :
                    "" + (target) + " = (" + (inner.join(", ")) + ")");
                
                inner.length = 0;
            }
            
            if (temp)
                base = temp;
            
            tree.children.forEach((function(c) { return visit(c, base); }));
        });

        visit(this.createPatternTree(node), base);

        return outer;
    },
    
    createPatternTree: function(ast, parent) { var __this = this; 

        if (!parent)
            parent = new PatternTreeNode("", null);
        
        var child, init;
    
        switch (ast.type) {
    
            case "ArrayPattern":
        
                ast.elements.forEach((function(e, i) { 
            
                    if (!e)
                        return;
                    
                    init = e.initializer ? e.initializer.text : "";
                    
                    child = new PatternTreeNode(String(i), init);
                    
                    if (e.type === "PatternRestElement")
                        child.rest = true;
                    
                    parent.children.push(child);
                    __this.createPatternTree(e.pattern, child);
                }));
                
                break;
        
            case "ObjectPattern":
        
                ast.properties.forEach((function(p) { 
            
                    init = p.initializer ? p.initializer.text : "";
                    child = new PatternTreeNode(p.name.text, init);
                    
                    parent.children.push(child);
                    __this.createPatternTree(p.pattern || p.name, child);
                }));
        
                break;
                
            default:
            
                parent.target = ast.text;
                break;
        }
        
        return parent;
    },
    
    asyncFunction: function(ident, params, body) {
    
        var head = "function";
        
        if (ident)
            head += " " + ident.text;
        
        var outerParams = params.map((function(x, i) { return "__" + i; })).join(", ");
        
        return "" + (head) + "(" + (outerParams) + ") { " +
            "try { return _es6now.async(function*(" + (this.joinList(params)) + ") " + 
            "" + (body) + ".apply(this, arguments)); " +
            "} catch (x) { return Promise.reject(x); } }";
    },
    
    rawToString: function(raw) {
        
        raw = raw.replace(/([^\n])?\n/g, (function(m, m1) { return m1 === "\\" ? m : (m1 || "") + "\\n\\\n"; }));
        raw = raw.replace(/([^"])?"/g, (function(m, m1) { return m1 === "\\" ? m : (m1 || "") + '\\"'; }));
        
        return '"' + raw + '"';
    },
    
    parentFunction: function(node) {
    
        for (var p = node.parent; p; p = p.parent) {
        
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
            
            node.children().forEach(visit);
        }
    },
    
    modulePath: function(node) {
    
        return node.type === "StringLiteral" ?
            this.moduleIdent(node.value) :
            this.stringify(node);
    },
    
    moduleIdent: function(url) {
    
        url = this.mapURI(url.trim());
        
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
        node.children().forEach((function(child) {
        
            if (offset < child.start)
                text += input.slice(offset, child.start);
            
            text += child.text;
            offset = child.end;
        }));
        
        if (offset < node.end)
            text += input.slice(offset, node.end);
        
        return text;
    },
    
    restParamVar: function(node) {
    
        var name = node.params[node.params.length - 1].identifier.value,
            pos = node.params.length - 1,
            slice = "_es6now.rest(arguments, " + pos + ")";
        
        return "var " + name + " = " + slice + ";";
    },
    
    addComputedName: function(node) {
    
        var name, p;
        
        for (p = node.parent; p; p = p.parent) {
        
            switch (p.type) {
            
                case "ClassElement":
                    if (!p.static) break;
            
                case "ObjectLiteral":
                case "ClassBody":
                
                    if (!p.computedNames)
                        p.computedNames = [];
                    
                    var id = "__$" + p.computedNames.length;
                    p.computedNames.push(node.expression.text);
                    
                    return id;
            }
        }
        
        return null;
    },
    
    wrapComputed: function(node, text) {
    
        if (node.computedNames)
            return "_es6now.computed(" + (text || this.stringify(node)) + ", " + node.computedNames.join(", ") + ")";
    },
    
    functionInsert: function(node) { var __this = this; 
    
        var inserted = [];
        
        if (node.createThisBinding)
            inserted.push("var __this = this;");
        
        if (node.createRestBinding)
            inserted.push(this.restParamVar(node));
        
        node.params.forEach((function(param) {
        
            if (!param.pattern)
                return;
            
            var name = param.text;
            
            if (param.initializer)
                inserted.push("if (" + (name) + " === void 0) " + (name) + " = " + (param.initializer.text) + ";");
            
            if (__this.isPattern(param.pattern))
                inserted.push("var " +  __this.translatePattern(param.pattern, name).join(", ") + ";"); 
        }));
        
        var temps = this.tempVars(node);
        
        // Add temp var declarations to the top of the insert
        if (temps)
            inserted.unshift(temps);
        
        return inserted.join(" ");
    },
    
    addTempVar: function(node, value, noDeclare) {
    
        var p = this.parentFunction(node);
        
        if (!p.tempVars)
            p.tempVars = [];
        
        var name = "__$" + p.tempVars.length;
        
        p.tempVars.push({ name: name, value: value, noDeclare: noDeclare });
        
        return name;
    },
    
    tempVars: function(node) {
    
        if (!node.tempVars)
            return "";
        
        var list = node.tempVars.filter((function(item) { return !item.noDeclare; }));
        
        if (list.length === 0)
            return "";
        
        return "var " + list.map((function(item) {
        
            var out = item.name;
            
            if (typeof item.value === "string")
                out += " = " + item.value;
            
            return out;
        
        })).join(", ") + ";";
    },
    
    strictDirective: function() {
    
        return this.isStrict ? "" : ' "use strict";';
    },
    
    lineNumber: function(offset) {
    
        return this.parser.location(offset).line;
    },
    
    syncNewlines: function(start, end, text) {
    
        var height = this.lineNumber(end - 1) - this.lineNumber(start);
        return preserveNewlines(text, height);
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
    }, constructor: function Replacer() {}

} });


exports.Replacer = Replacer; return exports; }).call(this, {});

var Translator = (function(exports) { 

var Runtime = Runtime_;

var Replacer = Replacer_.Replacer;

var SIGNATURE = "/*=es6now=*/";
var WRAP_CALLEE = "(function(fn, deps, name) { " +

    // Node.js:
    "if (typeof exports !== 'undefined') " +
        "fn.call(typeof global === 'object' ? global : this, require, exports); " +
        
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

function translate(input, options) {

    options || (options = {});
    
    var replacer = new Replacer,
        output;
    
    input = sanitize(input);
    
    if (options.runtime) {
            
        input = "\n\n" +
            "this._es6now = {};\n\n" +
            wrapRuntimeModule(Runtime.Class) + 
            wrapRuntimeModule(Runtime.ES6) +
            wrapRuntimeModule(Runtime.Promise) +
            wrapRuntimeModule(Runtime.Async) +
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



exports.translate = translate; exports.wrap = wrap; exports.isWrapped = isWrapped; return exports; }).call(this, {});

var PackageLocator = (function(exports) { 

var Path = require("path"),
    FS = require("fs");

var PACKAGE_URI = /^package:/i,
    JS_PACKAGE_ROOT = process.env["JS_PACKAGE_ROOT"] || "",
    packageRoots;

function isPackageURI(uri) {

    return PACKAGE_URI.test(uri);
}

function locatePackage(uri) {
    
    var name = uri.replace(PACKAGE_URI, ""),
        path;
    
    if (name === uri)
        throw new Error("Not a package URI.");
    
    if (!packageRoots)
        packageRoots = JS_PACKAGE_ROOT.split(/;/g).map((function(v) { return v.trim(); }));
    
    var found = packageRoots.some((function(root) {
    
        var stat = null;
        
        path = Path.join(Path.resolve(root, name), "main.js");
        
        try { stat = FS.statSync(path); }
        catch (x) {}
        
        return stat && stat.isFile();
    }));
    
    if (found)
        return path;
    
    throw new Error("Package " + (name) + " could not be found.");
}

exports.isPackageURI = isPackageURI; exports.locatePackage = locatePackage; return exports; }).call(this, {});

var ConsoleCommand = (function(exports) { 

var HAS = Object.prototype.hasOwnProperty;

function parse(argv, params) {

    params || (params = {});
    
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
    
        if (values[name] === void 0)
            throw new Error("Missing required option: --" + name);
    }));
    
    return values;
}

var ConsoleCommand = _es6now.Class(function(__super) { return {

    constructor: function ConsoleCommand(cmd) {
    
        this.fallback = cmd;
        this.commands = {};
    },
    
    add: function(name, cmd) {
    
        this.commands[name] = cmd;
        return this;
    },
    
    run: function(args) {
    
        // Peel off the "node" and main module args
        args || (args = process.argv.slice(2));
        
        var name = args[0] || "",
            cmd = this.fallback;
        
        if (name && HAS.call(this.commands, name)) {
        
            cmd = this.commands[name];
            args = args.slice(1);
        }
        
        if (!cmd)
            throw new Error("Invalid command");
        
        return cmd.execute(parse(args, cmd.params));
    }
    
} });


exports.ConsoleCommand = ConsoleCommand; return exports; }).call(this, {});

var ConsoleIO = (function(exports) { 


var ConsoleIO = _es6now.Class(function(__super) { return {

    constructor: function ConsoleIO() {
    
        this._inStream = process.stdin;
        this._outStream = process.stdout;
        
        this._outEnc = "utf8";
        this._inEnc = "utf8";
        
        this.inputEncoding = "utf8";
        this.outputEncoding = "utf8";
    },
    
    get inputEncoding() { 
    
        return this._inEnc;
    },
    
    set inputEncoding(enc) {
    
        this._inStream.setEncoding(this._inEnc = enc);
    },
    
    get outputEncoding() {
    
        return this._outEnc;
    },
    
    set outputEncoding(enc) {
    
        this._outStream.setEncoding(this._outEnc = enc);
    },
    
    readLine: function() { var __this = this; 
    
        return new Promise((function(resolve) {
        
            var listener = (function(data) {
            
                resolve(data);
                __this._inStream.removeListener("data", listener);
                __this._inStream.pause();
            });
            
            __this._inStream.resume();
            __this._inStream.on("data", listener);
        }));
    },
    
    writeLine: function(msg) {
    
        console.log(msg);
    },
    
    write: function(msg) {
    
        process.stdout.write(msg);
    }
    
} });


exports.ConsoleIO = ConsoleIO; return exports; }).call(this, {});

var ConsoleStyle = (function(exports) { 

var ConsoleStyle = {

    green: function(msg) { return "\x1B[32m" + (msg) + "\x1B[39m" },

    red: function(msg) { return "\x1B[31m" + (msg) + "\x1B[39m" },

    gray: function(msg) { return "\x1B[90m" + (msg) + "\x1B[39m" },

    bold: function(msg) { return "\x1B[1m" + (msg) + "\x1B[22m" },

};


exports.ConsoleStyle = ConsoleStyle; return exports; }).call(this, {});

var main____ = (function(exports) { 

Object.keys(ConsoleCommand).forEach(function(k) { exports[k] = ConsoleCommand[k]; });
Object.keys(ConsoleIO).forEach(function(k) { exports[k] = ConsoleIO[k]; });
Object.keys(ConsoleStyle).forEach(function(k) { exports[k] = ConsoleStyle[k]; });


return exports; }).call(this, {});

var main_ = (function(exports) { 

Object.keys(main____).forEach(function(k) { exports[k] = main____[k]; });

return exports; }).call(this, {});

var NodeRun = (function(exports) { 

var translate = Translator.translate;
var isPackageURI = PackageLocator.isPackageURI, locatePackage = PackageLocator.locatePackage;
var Style = main_.ConsoleStyle;
var parse = main___.parse;

var FS = require("fs"),
    REPL = require("repl"),
    VM = require("vm"),
    Path = require("path"),
    Util = require("util");

var ES6_GUESS = /(?:^|\n)\s*(?:import|export|class)\s/;

function formatSyntaxError(e, filename) {

    var msg = e.message,
        text = e.sourceText;
        
    if (filename === void 0 && e.filename !== void 0)
        filename = e.filename;
    
    if (filename)
        msg += "\n    " + (filename) + ":" + (e.line) + "";
    
    if (e.lineOffset < text.length) {
    
        var code = "\n\n" +
            text.slice(e.lineOffset, e.startOffset) +
            Style.bold(Style.red(text.slice(e.startOffset, e.endOffset))) + 
            text.slice(e.endOffset, text.indexOf("\n", e.endOffset)) +
            "\n";
        
        msg += code.replace(/\n/g, "\n    ");
    }
    
    return msg;
}

function addExtension() {

    var Module = module.constructor,
        resolveFilename = Module._resolveFilename;
    
    Module._resolveFilename = (function(filename, parent) {
    
        if (isPackageURI(filename))
            filename = locatePackage(filename);
        
        return resolveFilename(filename, parent);
    });
    
    // Compile ES6 js files
    require.extensions[".js"] = (function(module, filename) {
    
        var text, source;
        
        try {
        
            text = source = FS.readFileSync(filename, "utf8");
            
            if (ES6_GUESS.test(text))
                text = translate(text, { wrap: true, module: true });
        
        } catch (e) {
        
            if (e instanceof SyntaxError)
                e = new SyntaxError(formatSyntaxError(e, filename));
            
            throw e;
        }
        
        return module._compile(text, filename);
    });
}

function runModule(path) {

    addExtension();
    
    var path = Path.resolve(process.cwd(), path),
        stat;

    try { stat = FS.statSync(path) }
    catch (x) {}

    if (stat && stat.isDirectory())
        path = Path.join(path, "main.js");

    var m = require(path);

    if (m && typeof m.main === "function") {
    
        var result = m.main(process.argv);
        
        Promise.resolve(result).then(null, (function(x) { return setTimeout((function($) { throw x }), 0); }));
    }
}

function startREPL() { var __this = this; 

    addExtension();
    
    var repl = REPL.start({ 
    
        prompt: "es6now> ",
        
        useGlobal: true,
        
        eval: function(input, context, filename, cb) { var __this = this; 
        
            var text, result, script, displayErrors = false;
            
            try {
            
                text = translate(input, { wrap: false, module: false });
            
            } catch (x) {
            
                // Regenerate syntax error to eliminate parser stack
                if (x instanceof SyntaxError)
                    x = new SyntaxError(x.message);
                
                return cb(x);
            }
            
            try {
                
                script = VM.createScript(text, { filename: filename, displayErrors: displayErrors });
                
                result = repl.useGlobal ?
                    script.runInThisContext(text, { displayErrors: displayErrors }) :
                    script.runInContext(context, { displayErrors: displayErrors });
                
            } catch (x) {
            
                return cb(x);
            }
            
            if (result instanceof Promise) {
            
                // Without displayPrompt, asynchronously calling the "eval"
                // callback results in no text being displayed on the screen.
                
                result
                .then((function(x) { return cb(null, x); }), (function(err) { return cb(err, null); }))
                .then((function($) { return __this.displayPrompt(); }));
                
            } else {
            
                cb(null, result);
            }
        }
    });
    
    function parseAction(input, module) {
    
        var text, ast;
            
        try {
    
            ast = parse(input, { module: module });
            text = Util.inspect(ast, { colors: true, depth: 10 });
    
        } catch (x) {
    
            text = x instanceof SyntaxError ?
                formatSyntaxError(x, "REPL") :
                x.toString();
        }
    
        console.log(text);
    }
    
    if (typeof repl.defineCommand === "function") {
    
        repl.defineCommand("translate", {
    
            help: "Translate ES6 to ES5",
        
            action: function(input) {
            
                var text;
            
                try {
            
                    text = translate(input, { wrap: false, module: false });
            
                } catch (x) {
            
                    text = x instanceof SyntaxError ?
                        formatSyntaxError(x, "REPL") :
                        x.toString();
                }
            
                console.log(text);
            
                this.displayPrompt();
            }
        });
        
        repl.defineCommand("parse", {
        
            help: "Parse a script",
            
            action: function(input) {
            
                parseAction(input, false);
                this.displayPrompt();
            }
            
        });
        
        repl.defineCommand("parseModule", {
        
            help: "Parse a module",
            
            action: function(input) {
            
                parseAction(input, true);
                this.displayPrompt();
            }
            
        });
    }
    
}


exports.formatSyntaxError = formatSyntaxError; exports.runModule = runModule; exports.startREPL = startREPL; return exports; }).call(this, {});

var ConsoleStyle_ = (function(exports) { 

function green(msg) {

    return "\x1B[32m" + (msg) + "\x1B[39m";
}

function red(msg) {

    return "\x1B[31m" + (msg) + "\x1B[39m";
}

function gray(msg) {

    return "\x1B[90m" + (msg) + "\x1B[39m";
}

function bold(msg) {

    return "\x1B[1m" + (msg) + "\x1B[22m";
}

exports.green = green; exports.red = red; exports.gray = gray; exports.bold = bold; return exports; }).call(this, {});

var ConsoleCommand_ = (function(exports) { 

var Style = ConsoleStyle_;

var HAS = Object.prototype.hasOwnProperty;

function parse(argv, params) {

    params || (params = {});
    
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
    
        if (values[name] === void 0)
            throw new Error("Missing required option: --" + name);
    }));
    
    return values;
}

var ConsoleCommand = _es6now.Class(function(__super) { return {

    constructor: function ConsoleCommand(cmd) {
    
        this.fallback = cmd;
        this.commands = {};
    },
    
    add: function(name, cmd) {
    
        this.commands[name] = cmd;
        return this;
    },
    
    run: function(args) {
    
        // Peel off the "node" and main module args
        args || (args = process.argv.slice(2));
        
        var name = args[0] || "",
            cmd = this.fallback;
        
        if (name && HAS.call(this.commands, name)) {
        
            cmd = this.commands[name];
            args = args.slice(1);
        }
        
        if (!cmd)
            throw new Error("Invalid command");
        
        return cmd.execute(parse(args, cmd.params));
    }
    
} });

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


exports.ConsoleCommand = ConsoleCommand; return exports; }).call(this, {});

var ConsoleIO_ = (function(exports) { 

var Style = ConsoleStyle_;

var ConsoleIO = _es6now.Class(function(__super) { return {

    constructor: function ConsoleIO() {
    
        this._inStream = process.stdin;
        this._outStream = process.stdout;
        
        this._outEnc = "utf8";
        this._inEnc = "utf8";
        
        this.inputEncoding = "utf8";
        this.outputEncoding = "utf8";
    },
    
    get inputEncoding() { 
    
        return this._inEnc;
    },
    
    set inputEncoding(enc) {
    
        this._inStream.setEncoding(this._inEnc = enc);
    },
    
    get outputEncoding() {
    
        return this._outEnc;
    },
    
    set outputEncoding(enc) {
    
        this._outStream.setEncoding(this._outEnc = enc);
    },
    
    readLine: function() { var __this = this; 
    
        return new Promise((function(resolve) {
        
            var listener = (function(data) {
            
                resolve(data);
                __this._inStream.removeListener("data", listener);
                __this._inStream.pause();
            });
            
            __this._inStream.resume();
            __this._inStream.on("data", listener);
        }));
    },
    
    writeLine: function(msg) {
    
        console.log(msg);
    },
    
    write: function(msg) {
    
        process.stdout.write(msg);
    }
    
} });


exports.ConsoleIO = ConsoleIO; return exports; }).call(this, {});

var StringMap_ = (function(exports) { 

var HAS = Object.prototype.hasOwnProperty;

var StringMap = _es6now.Class(function(__super) { return {

    constructor: function StringMap() {
    
        this._map = {};
    },
    
    get: function(key) {
    
        if (HAS.call(this._map, key))
            return this._map[key];
    },
    
    set: function(key, value) {
    
        this._map[key] = value;
        return this;
    },
    
    has: function(key) {
    
        return HAS.call(this._map, key);
    },
    
    delete: function(key) {
    
        if (!HAS.call(this._map, key))
            return false;
        
        delete this._map[key];
        return true;
    },
    
    clear: function() {
    
        this._map = {};
    },
    
    keys: function() {
    
        return Object.keys(this._map);
    },
    
    values: function() { var __this = this; 
    
        return Object.keys(this._map).map((function(key) { return __this._map[key]; }));
    },
    
    forEach: function(fn, thisArg) {
    
        var keys = this.keys(), i;
        
        for (i = 0; i < keys.length; ++i)
            fn.call(thisArg, this._map[keys[i]], keys[i], this);
    }
} });

exports.StringMap = StringMap; return exports; }).call(this, {});

var StringSet = (function(exports) { 

var StringMap = StringMap_.StringMap;

var StringSet = _es6now.Class(function(__super) { return {

    constructor: function StringSet() {
    
        this._map = new StringMap;
    },
    
    has: function(key) {
    
        return this._map.has(key);
    },
    
    add: function(key) {
    
        this._map.set(key, key);
        return this;
    },
    
    delete: function(key) {
    
        return this._map.delete(key);
    },
    
    clear: function() {
    
        this._map.clear();
    },
    
    keys: function() {
    
        return this._map.keys();
    },
    
    values: function() {
    
        return this._map.keys();
    },
    
    forEach: function(fn, thisArg) { var __this = this; 
    
        this._map.forEach((function(value, key) { return fn.call(thisArg, value, key, __this); }));
    }
} });

exports.StringSet = StringSet; return exports; }).call(this, {});

var PromiseExtensions = (function(exports) { 

var PromiseExtensions = _es6now.Class(function(__super) { return {

    __static_0: { iterate: function(fn) {

        var done = false,
            stop = (function(val) { done = true; return val; }),
            next = (function(last) { return done ? last : Promise.resolve(fn(stop)).then(next); });
    
        return Promise.resolve().then(next);
    } },

    __static_1: { forEach: function(list, fn) {

        var i = -1;
        return this.iterate((function(stop) { return (++i >= list.length) ? stop() : fn(list[i], i, list); }));
    } }, constructor: function PromiseExtensions() {}

} });

exports.PromiseExtensions = PromiseExtensions; return exports; }).call(this, {});

var EventTarget = (function(exports) { 

/*

This EventTarget implementation differs from DOM3 EventTargets in the following
ways:

- There is no capture phase.
- Listeners must be functions.  They cannot be EventListener objects.
- There is no way to tell if a DOM event has been stopped by a handler.
  Instead, we check a "propagationStopped" property on the event object.
- stopImmediatePropagation is not implemented.

*/

function listeners(obj, type) {

	var list = obj.eventListeners[type];
	
	if (!list) 
	    list = obj.eventListeners[type] = [];
	
	return list;
}

function fire(obj, evt) {

	var list = listeners(obj, evt.type),
	    len = list.length,
	    i,
	    x;
	
	for (i = 0; i < len; ++i) {
	
	    x = list[i].call(obj, evt);
	    
	    if (Promise.isPromise(x))
	        x.then(null, (function(x) { return setTimeout((function($) { throw x }), 0); }));
	}
}

var EventTarget = _es6now.Class(function(__super) { return {

    constructor: function EventTarget() {
    
        this.eventListeners = {};
        this.parentEventTarget = null;
    },
    
    on: function(type, handler) {
    
        return this.addEventListener(type, handler);
    },
    
    addEventListener: function(type, handler) {
    
        if (typeof handler !== "function")
            throw new Error("Listener is not a function");
        
        var a = listeners(this, type), 
            i = a.indexOf(handler);
            
        if (i === -1) 
            a.push(handler);
    },
    
    removeEventListener: function(type, handler) {
    
        var a = list(this, type), 
            i = a.indexOf(handler);
        
    	if (i !== -1) 
    	    a.splice(i, 1);
    },
    
    dispatchEvent: function(evt) {
    
        evt.target = this;
        
        // At target phase
        fire(evt.currentTarget = this, evt);
        
        // Bubble phase
        if (evt.bubbles) {
        
            for (var target = this.parentEventTarget; 
                 target && !evt.propagationStopped; 
                 target = target.parentEventTarget) {
                
                fire(evt.currentTarget = target, evt);
            }
        }
        
        // Reset current target for default actions
        evt.currentTarget = null;
        
        return !evt.defaultPrevented;
    }
} });

var Event = _es6now.Class(function(__super) { return {

    constructor: function Event(type, bubbles, cancellable) {
    
        this.type = type;
        this.timeStamp = new Date();
        this.bubbles = !!bubbles;
        this.cancelable = !!cancellable;
        this.currentTarget = null;
        this.target = null;
        this.defaultPrevented = false;
        this.propagationStopped = false;
    },
    
    stopPropagation: function() {
    
        this.propagationStopped = true;
    },
    
    preventDefault: function() {
    
        this.defaultPrevented = true;
    }
    
} });



exports.EventTarget = EventTarget; exports.Event = Event; return exports; }).call(this, {});

var AsyncFS__ = (function(exports) { 

var FS = require("fs");

// Wraps a standard Node async function with a promise
// generating function
function wrap(fn) {

	return function() { var args = _es6now.rest(arguments, 0); 
	
		return new Promise((function(resolve, reject) {
		    
            args.push((function(err, data) {
        
                if (err) reject(err);
                else resolve(data);
            }));
            
            fn.apply(null, args);
        }));
	};
}

function exists(path) {

    return new Promise((function(resolve) {
    
        FS.exists(path, (function(result) { return resolve(result); }));
    }));
}

var 
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



exports.exists = exists; exports.readFile = readFile; exports.close = close; exports.open = open; exports.read = read; exports.write = write; exports.rename = rename; exports.truncate = truncate; exports.rmdir = rmdir; exports.fsync = fsync; exports.mkdir = mkdir; exports.sendfile = sendfile; exports.readdir = readdir; exports.fstat = fstat; exports.lstat = lstat; exports.stat = stat; exports.readlink = readlink; exports.symlink = symlink; exports.link = link; exports.unlink = unlink; exports.fchmod = fchmod; exports.lchmod = lchmod; exports.chmod = chmod; exports.lchown = lchown; exports.fchown = fchown; exports.chown = chown; exports.utimes = utimes; exports.futimes = futimes; exports.writeFile = writeFile; exports.appendFile = appendFile; exports.realpath = realpath; return exports; }).call(this, {});

var main________ = (function(exports) { 

Object.keys(ConsoleCommand_).forEach(function(k) { exports[k] = ConsoleCommand_[k]; });
Object.keys(ConsoleIO_).forEach(function(k) { exports[k] = ConsoleIO_[k]; });
Object.keys(StringSet).forEach(function(k) { exports[k] = StringSet[k]; });
Object.keys(StringMap_).forEach(function(k) { exports[k] = StringMap_[k]; });
Object.keys(PromiseExtensions).forEach(function(k) { exports[k] = PromiseExtensions[k]; });
Object.keys(EventTarget).forEach(function(k) { exports[k] = EventTarget[k]; });

var ConsoleStyle = ConsoleStyle_;


var AsyncFS = AsyncFS__;




exports.ConsoleStyle = ConsoleStyle; exports.AsyncFS = AsyncFS; return exports; }).call(this, {});

var main_______ = (function(exports) { 

Object.keys(main________).forEach(function(k) { exports[k] = main________[k]; });

return exports; }).call(this, {});

var Analyzer = (function(exports) { 

var parse = main___.parse;
var StringSet = main_______.StringSet, StringMap = main_______.StringMap;

function analyze(ast, resolvePath) {

    if (typeof ast === "string")
        ast = parse(ast, { module: true });
    
    if (!resolvePath)
        resolvePath = (function(x) { return x; });
    
    var edges = new StringMap,
        identifiers = new StringSet;
    
    visit(ast, true);
    
    return { edges: edges, identifiers: identifiers };
    
    function visit(node, topLevel) {
        
        switch (node.type) {
        
            case "ExportsList":
            case "ImportDeclaration":
            case "ImportDefaultDeclaration":
            case "ModuleImport":
                
                addEdge(node.from);
                break;
            
            case "Identifier":
            
                if (node.context === "declaration" && topLevel)
                    identifiers.add(node.value);
                
                break;
            
            // TODO: Add generator, block (let, const, function in block)?
            case "ClassExpression":
            case "ClassBody":
            case "FunctionExpression":
            case "FormalParameter":
            case "FunctionBody":
            
                topLevel = false;
                break;
                
        }
        
        node.children().forEach((function(child) { return visit(child, topLevel); }));
    }
    
    function addEdge(spec) {
    
        if (!spec || spec.type !== "StringLiteral")
            return;
        
        var path = resolvePath(spec.value);
        
        if (path) {
        
            if (edges.has(path))
                edges.get(path).push(spec);
            else
                edges.set(path, [spec]);
        }
    }
}

exports.analyze = analyze; return exports; }).call(this, {});

var Bundler = (function(exports) { 

var AsyncFS = main_______.AsyncFS, StringMap = main_______.StringMap, StringSet = main_______.StringSet;
var analyze = Analyzer.analyze;

var Path = require("path");

var EXTERNAL_URL = /[a-z][a-z]+:/i;

function identFromPath(path) {

    // TODO: Make this unicode friendly.  Can we export some
    // functions or patterns from the parser to help?
    
    var name = Path.basename(path);
    
    // Remove the file extension
    name = name.replace(/\..*$/i, "");
    
    // Replace dashes
    name = name.replace(/-(\S?)/g, (function(m, m1) { return m1 ? m1.toUpperCase() : ""; }));
    
    // Replace any other non-ident chars with _
    name = name.replace(/[^a-z0-9$_]+/ig, "_");
    
    // Make sure the name doesn't start with a number
    name = name.replace(/^[0-9]+/, "");
    
    return name;
}

function createBundle(rootPath, locatePackage) {
    
    rootPath = Path.resolve(rootPath);
    locatePackage = locatePackage || ((function(x) { return x; }));
    
    var nodes = new StringMap,
        nodeNames = new StringSet,
        sort = [],
        pending = 0,
        resolver,
        allFetched;
    
    allFetched = new Promise((function(resolve, reject) { return resolver = { resolve: resolve, reject: reject }; }));
    
    function visit(path) {

        if (nodes.has(path))
            return;
        
        nodes.set(path, null);
        pending += 1;
        
        var dir = Path.dirname(path);
        
        AsyncFS.readFile(path, { encoding: "utf8" }).then((function(code) {
    
            var node = analyze(code, (function(p) {
            
                try { p = locatePackage(p) }
                catch (x) {}
                
                return EXTERNAL_URL.test(p) ? null : Path.resolve(dir, p);
            }));
            
            nodes.set(path, node);
            node.path = path;
            node.source = code;
            node.visited = false;
            node.inEdges = new StringSet;
            node.name = "";
            
            node.edges.keys().forEach(visit);
            
            pending -= 1;
            
            if (pending === 0)
                resolver.resolve(null);
        
        })).then(null, (function(err) {
        
            if (err instanceof SyntaxError && "sourceText" in err)
                err.filename = path;
            
            resolver.reject(err);
            
        }));
    }
    
    function traverse(path, from) {
    
        var node = nodes.get(path);
        
        if (from)
            node.inEdges.add(from);
        
        if (node.visited)
            return;
        
        node.visited = true;
        node.edges.forEach((function(val, key) { return traverse(key, path); }));   
        sort.push(path);
    }
    
    function assignNames() {
    
        nodes.forEach((function(node) {
        
            var name = identFromPath(node.path),
                identifiers = new StringSet;
            
            // Build list of top-level identifiers in
            // referencing modules
            node.inEdges.forEach((function(key) {
            
                nodes.get(key).identifiers.forEach((function(k) { return identifiers.add(k); }));
            }));
        
            // Resolve naming conflicts IMPROVE
            while (identifiers.has(name) || nodeNames.has(name))
                name += "_";
        
            nodeNames.add(node.name = name);
        }));
    }
    
    function getModifiedSource(node) {
    
        var offset = 0,
            source = "",
            ranges = [];
        
        // Build list of ranges to replace
        node.edges.forEach((function(val, key) {
        
            var ref = nodes.get(key);
            
            val.forEach((function(range) {
            
                ranges.push({ start: range.start, end: range.end, name: ref.name });
            }));
        }));
        
        // Sort the list of ranges in order of appearance
        ranges.sort((function(a, b) { return a.start - b.start; }));
        
        // Build modified source with replace subranges
        ranges.forEach((function(range) {
        
            source += node.source.slice(offset, range.start);
            source += range.name;
            
            offset = range.end;
        }));
        
        source += node.source.slice(offset);
        
        return source;
    }
    
    visit(rootPath);
    
    return allFetched.then((function($) {
    
        traverse(rootPath, null);
        assignNames();
        
        var out = "";
        
        sort.forEach((function(path) {
        
            var node = nodes.get(path);
            
            out += "module " + node.name + " {\n\n";
            out += getModifiedSource(node);
            out += "\n\n}\n\n";
        }));
        
        out += "export * from " + nodes.get(rootPath).name + ";\n";
        
        return out;
    }));
}


exports.createBundle = createBundle; return exports; }).call(this, {});

var main_____ = (function(exports) { 

var createBundle = Bundler.createBundle;
var AsyncFS = main_______.AsyncFS, ConsoleCommand = main_______.ConsoleCommand;


function main() {

    new ConsoleCommand({

        params: {
    
            "input": { short: "i", positional: true, required: true },
            "output": { short: "o", positional: true, required: false }
        },
    
        execute: function(options) {

            createBundle(options.input).then((function(code) {
        
                return options.output ?
                    AsyncFS.writeFile(options.output, code) :
                    console.log(code);
            }));
        }
    
    }).run();
    
}


exports.createBundle = createBundle; exports.main = main; return exports; }).call(this, {});

var main__ = (function(exports) { 

Object.keys(main_____).forEach(function(k) { exports[k] = main_____[k]; });

return exports; }).call(this, {});

var main = (function(exports) { 

var AsyncFS = AsyncFS_;

var runModule = NodeRun.runModule, startREPL = NodeRun.startREPL, formatSyntaxError = NodeRun.formatSyntaxError;
var ConsoleCommand = main_.ConsoleCommand;
var createBundle = main__.createBundle;
var translate = Translator.translate;
var locatePackage = PackageLocator.locatePackage;

var FS = require("fs");
var Path = require("path");



function getOutPath(inPath, outPath) {

    var stat;
    
    outPath = Path.resolve(process.cwd(), outPath);
    
    try { stat = FS.statSync(outPath); } catch (e) {}
    
    if (stat && stat.isDirectory())
        return Path.resolve(outPath, Path.basename(inPath));
    
    return outPath;
}

function main() {

    new ConsoleCommand({

        params: {
    
            "input": {
        
                positional: true,
                required: false
            }
        },
    
        execute: function(params) {
    
            process.argv.splice(1, 1);
        
            if (params.input) runModule(params.input);
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
    
        execute: function(params) {
        
            var promise = 
                params.bundle ? createBundle(params.input, locatePackage) :
                params.input ? AsyncFS.readFile(params.input, { encoding: "utf8" }) :
                Promise.resolve("");
        
            promise.then((function(text) {
        
                text = translate(text, { 
        
                    global: params.global,
                    runtime: params.runtime,
                    wrap: true,
                    module: true
                });
        
                if (params.output) {
            
                    var outPath = getOutPath(params.input, params.output);
                    return AsyncFS.writeFile(outPath, text, "utf8");
            
                } else {
            
                    process.stdout.write(text + "\n");
                }
            
            })).then(null, (function(x) {
            
                if (x instanceof SyntaxError) {
            
                    var filename;
                
                    if (!params.bundle) 
                        filename = Path.resolve(params.input);
                
                    process.stdout.write("\nSyntax Error: " + (formatSyntaxError(x, filename)) + "\n");
                    return;
                }
            
                setTimeout((function($) { throw x }), 0);
            }));
        }

    }).run();
}

// TODO:  Use a "main" export instead of this ugliness
if (typeof require === "function" && 
    typeof module !== "undefined" &&
    require.main === module) {
 
    main();   
}


exports.translate = translate; return exports; }).call(this, {});

Object.keys(main).forEach(function(k) { exports[k] = main[k]; });


}, [], "");