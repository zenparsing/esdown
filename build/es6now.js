/*=es6now=*/(function(fn, deps, name) { if (typeof exports !== 'undefined') fn.call(typeof global === 'object' ? global : this, require, exports); else if (typeof __MODULE === 'function') __MODULE(fn, deps); else if (typeof define === 'function' && define.amd) define(['require', 'exports'].concat(deps), fn); else if (typeof window !== 'undefined' && name) fn.call(window, null, window[name] = {}); else fn.call(window || this, null, {}); })(function(require, exports) { 'use strict'; function __load(p) { var e = require(p); return typeof e === 'object' ? e : { 'default': e }; } var _M0 = __load("path"), _M1 = __load("fs"), _M2 = __load("repl"), _M3 = __load("vm"); 

var __this = this; (function() {

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
    
    var proto = Object.create(parent),
        sup = (function(prop) { return Object.getPrototypeOf(proto)[prop]; });
    
    // Generate the method collection, closing over "__super"
    var props = def(sup),
        constructor = props.constructor;
    
    if (!constructor)
        throw new Error("No constructor specified.");
    
    // Make constructor non-enumerable and assign a default
    // if none is provided
    Object.defineProperty(props, "constructor", {
    
        enumerable: false,
        writable: true,
        configurable: true,
        value: constructor
    });
    
    // Set prototype methods
    defineMethods(proto, props, false);
    
    // Set constructor's prototype
    constructor.prototype = proto;
    
    // Set class "static" methods
    defineMethods(constructor, props, true);
    
    // "Inherit" from base constructor
    if (base) inherit(constructor, base);
    
    return constructor;
}

this.__class = Class;


}).call(this);

(function() {

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
    TRIM_S = /^s+/,
    TRIM_E = /s+$/,
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
    
        return "__proto__" in o ? o.__proto__ : o.constructor.prototype;
    },
    
    /*
    
    NOTE: getOwnPropertyNames is buggy since there is no way to get non-enumerable 
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
    
    var isoRE = /^(?:((?:[+-]d{2})?d{4})(?:-(d{2})(?:-(d{2}))?)?)?(?:T(d{2}):(d{2})(?::(d{2})(?:.d{3})?)?)?(?:Z|([-+]d{2}):(d{2}))?$/,
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


}).call(this);

(function() {

var global = this,
    HAS_OWN = Object.prototype.hasOwnProperty;

// TODO:  Not everything gets added with the same property attributes...


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

addProps(Object, {

    is: function(a, b) {
    
        // TODO
    },
    
    assign: function(target, source) {
    
        Object.keys(source).forEach((function(k) { return target[k] = source[k]; }));
        return target;
    }
});

// TODO Math?

addProps(Number, {

    EPSILON: ((function($) {
    
        var next, result;
        
        for (next = 1; 1 + next !== 1; next = next / 2)
            result = next;
        
        return result;
    }))(),
    
    MAX_SAFE_INTEGER: 9007199254740992,
    
    MIN_SAFE_INTEGER: -9007199254740991,
    
    isInteger: function(val) {
    
        typeof val === "number" && val | 0 === val;
    },
    
    isSafeInteger: function(val) {
        // TODO
    }
});

addProps(Number.prototype, {

    clz: function() {
    
        var n = this >>> 0; // uint32
        // TODO:  Count leading bitwise zeros of n
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

addProps(Array.prototype, {

    copyWithin: function() {
        // TODO
    },
    
    keys: function() {
        // TODO
    },
    
    entries: function() {
        // TODO
    },
    
    fill: function() {
        // TODO
    },
    
    find: function() {
        // TODO
    },
    
    findIndex: function() {
        // TODO
    },
    
    values: function() {
        // TODO
    }
    
    // TODO:  ArrayIterator??
});

addProps(String, {

    raw: function() {
        // TODO
    }
});

addProps(String.prototype, {
    
    repeat: function(count) {
    
        // TODO
        return new Array(count + 1).join(this);
    },
    
    startsWith: function(search, start) {
    
        // TODO
        start = start >>> 0;
        return this.indexOf(search, start) === start;
    },
    
    endsWith: function(search, end) {
    
        // TODO
        return this.slice(-search.length) === search;
    },
    
    contains: function(search, pos) {
    
        // TODO
        return this.indexOf(search, pos >>> 0) !== -1;
    }
});

// TODO:  Should we even be going here?
if (typeof Reflect === "undefined") global.Reflect = {

    hasOwn: function(obj, name) { return HAS_OWN.call(obj, name); }
};


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


var $status = "Promise#status",
    $value = "Promise#value",
    $onResolve = "Promise#onResolve",
    $onReject = "Promise#onReject";

function isPromise(x) { 

    return !!x && $status in Object(x);
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
        x.chain(deferred.resolve, deferred.reject);
    else
        deferred.resolve(x);
}

function promiseReact(deferred, handler, x) {

    enqueueMicrotask((function($) {
    
        try { promiseUnwrap(deferred, handler(x)) } 
        catch(e) { deferred.reject(e) }
    }));
}

function getDeferred(constructor) {

    var result = {};

    result.promise = new constructor((function(resolve, reject) {
        result.resolve = resolve;
        result.reject = reject;
    }));

    return result;
}

var Promise = __class(function(__super) { return {

    constructor: function Promise(init) { var __this = this; 
    
        if (typeof init !== "function")
            throw new TypeError("Promise constructor called without initializer");
        
        this[$status] = "pending";
        this[$onResolve] = [];
        this[$onReject] = [];
    
        init((function(x) { return promiseResolve(__this, x); }), (function(r) { return promiseReject(__this, r); }));
    },
    
    chain: function(onResolve, onReject) {
    
        if (typeof onResolve !== "function") onResolve = (function(x) { return x; });
        if (typeof onReject !== "function") onReject = (function(e) { throw e });

        var deferred = getDeferred(this.constructor);

        switch (this[$status]) {

            case undefined:
                throw new TypeError("Promise method called on a non-promise");
        
            case "pending":
                this[$onResolve].push([deferred, onResolve]);
                this[$onReject].push([deferred, onReject]);
                break;
    
            case "resolved":
                promiseReact(deferred, onResolve, this[$value]);
                break;
        
            case "rejected":
                promiseReact(deferred, onReject, this[$value]);
                break;
        }

        return deferred.promise;
    },
    
    then: function(onResolve, onReject) {

        if (typeof onResolve !== "function") onResolve = (function(x) { return x; });
    
        return this.chain((function(x) {
    
            if (x && typeof x === "object") {
            
                var maybeThen = x.then;
                
                if (typeof maybeThen === "function")
                    return maybeThen.call(x, onResolve, onReject);
            }
            
            return onResolve(x);
        
        }), onReject);
    },
    
    __static_resolve: function(x) { 
    
        return new this((function(resolve) { return resolve(x); }));
    },
    
    __static_reject: function(x) { 
    
        return new this((function(resolve, reject) { return reject(x); }));
    },
    
    __static_isPromise: function(x) {
        
        return isPromise(x);
    }
    
} });

this.Promise = Promise;


}).call(this);

(function() {

function getDeferred(constructor) {

    var result = {};

    result.promise = new constructor((function(resolve, reject) {
        result.resolve = resolve;
        result.reject = reject;
    }));

    return result;
}

function promiseWhen(constructor, x) {

    if (Promise.isPromise(x))
        return x.chain((function(x) { return promiseWhen(constructor, x); }));
    
    var deferred = getDeferred(constructor);
    deferred.resolve(x);
    return deferred.promise;
}

function promiseIterate(iterable) {
    
    // TODO:  Use System.iterator
    var iter = iterable;
    
    var constructor = Promise,
        deferred = getDeferred(constructor);
    
    function resume(value, error) {
    
        if (error && !("throw" in iter))
            return deferred.reject(value);
        
        try {
        
            // Invoke the iterator/generator
            var result = error ? iter.throw(value) : iter.next(value);
            
            // Recursively unwrap the result value
            var promise = promiseWhen(constructor, result.value);
            
            if (result.done)
                promise.chain(deferred.resolve, deferred.reject);
            else
                promise.chain((function(x) { return resume(x, false); }), (function(x) { return resume(x, true); }));
            
        } catch (x) {
        
            deferred.reject(x);
        }
    }
    
    resume(void 0, false);
    
    return deferred.promise;
}

this.__async = promiseIterate;


}).call(this);

var Runtime_ = (function(exports) {

var ES5 = 

"/*\n\nProvides basic support for methods added in EcmaScript 5 for EcmaScript 4 browsers.\nThe intent is not to create 100% spec-compatible replacements, but to allow the use\nof basic ES5 functionality with predictable results.  There are features in ES5 that\nrequire an ES5 engine (freezing an object, for instance).  If you plan to write for \nlegacy engines, then don't rely on those features.\n\n*/\n\nvar global = this,\n    OP = Object.prototype,\n    HOP = OP.hasOwnProperty,\n    slice = Array.prototype.slice,\n    TRIM_S = /^s+/,\n    TRIM_E = /s+$/,\n    FALSE = function() { return false; },\n    TRUE = function() { return true; },\n    identity = function(o) { return o; },\n    defGet = OP.__defineGetter__,\n    defSet = OP.__defineSetter__,\n    keys = Object.keys || es4Keys,\n    ENUM_BUG = !function() { var o = { constructor: 1 }; for (var i in o) return i = true; }(),\n    ENUM_BUG_KEYS = [ \"toString\", \"toLocaleString\", \"valueOf\", \"hasOwnProperty\", \"isPrototypeOf\", \"propertyIsEnumerable\", \"constructor\" ],\n    ERR_REDUCE = \"Reduce of empty array with no initial value\";\n\n// Returns the internal class of an object\nfunction getClass(o) {\n\n    if (o === null || o === undefined) return \"Object\";\n    return OP.toString.call(o).slice(\"[object \".length, -1);\n}\n\n// Returns an array of keys defined on the object\nfunction es4Keys(o) {\n\n    var a = [], i;\n    \n    for (i in o)\n        if (HOP.call(o, i))\n            a.push(i);\n    \n    if (ENUM_BUG) \n        for (i = 0; i < ENUM_BUG_KEYS.length; ++i)\n            if (HOP.call(o, ENUM_BUG_KEYS[i]))\n                a.push(ENUM_BUG_KEYS[i]);\n    \n    return a;\n}\n\n// Sets a collection of keys, if the property is not already set\nfunction addKeys(o, p) {\n\n    for (var i = 0, a = keys(p), k; i < a.length; ++i) {\n    \n        k = a[i];\n        \n        if (o[k] === undefined) \n            o[k] = p[k];\n    }\n    \n    return o;\n}\n\n\n// In IE8, defineProperty and getOwnPropertyDescriptor only work on DOM objects\n// and are therefore useless - so bury them.\ntry { (Object.defineProperty || FALSE)({}, \"-\", { value: 0 }); }\ncatch (x) { Object.defineProperty = undefined; };\n\ntry { (Object.getOwnPropertyDescriptor || FALSE)({}, \"-\"); }\ncatch (x) { Object.getOwnPropertyDescriptor = undefined; }\n\n// In IE < 9 [].slice does not work properly when the start or end arguments are undefined.\ntry { [0].slice(0, undefined)[0][0]; }\ncatch (x) {\n\n    Array.prototype.slice = function(s, e) {\n    \n        s = s || 0;\n        return (e === undefined ? slice.call(this, s) : slice.call(this, s, e));\n    };\n}\n\n// ES5 Object functions\naddKeys(Object, {\n\n    create(o, p) {\n    \n        var n;\n        \n        if (o === null) {\n        \n            n = { \"__proto__\": o };\n        \n        } else {\n        \n            var f = function() {};\n            f.prototype = o;\n            n = new f;\n        }\n        \n        if (p !== undefined)\n            Object.defineProperties(n, p);\n        \n        return n;\n    },\n    \n    keys: keys,\n    \n    getOwnPropertyDescriptor(o, p) {\n    \n        if (!HOP.call(o, p))\n            return undefined;\n        \n        return { \n            value: o[p], \n            writable: true, \n            configurable: true, \n            enumerable: OP.propertyIsEnumerable.call(o, p)\n        };\n    },\n    \n    defineProperty(o, n, p) {\n    \n        var msg = \"Accessor properties are not supported.\";\n        \n        if (\"get\" in p) {\n        \n            if (defGet) defGet(n, p.get);\n            else throw new Error(msg);\n        }\n        \n        if (\"set\" in p) {\n        \n            if (defSet) defSet(n, p.set);\n            else throw new Error(msg);\n        }\n        \n        if (\"value\" in p)\n            o[n] = p.value;\n        \n        return o;\n    },\n    \n    defineProperties(o, d) {\n    \n        Object.keys(d).forEach(function(k) { Object.defineProperty(o, k, d[k]); });\n        return o;\n    },\n    \n    getPrototypeOf(o) {\n    \n        return \"__proto__\" in o ? o.__proto__ : o.constructor.prototype;\n    },\n    \n    /*\n    \n    NOTE: getOwnPropertyNames is buggy since there is no way to get non-enumerable \n    ES3 properties.\n    \n    */\n    \n    getOwnProperyNames: keys,\n    \n    freeze: identity,\n    seal: identity,\n    preventExtensions: identity,\n    isFrozen: FALSE,\n    isSealed: FALSE,\n    isExtensible: TRUE\n    \n});\n\n\n// Add ES5 String extras\naddKeys(String.prototype, {\n\n    trim() { return this.replace(TRIM_S, \"\").replace(TRIM_E, \"\"); }\n});\n\n\n// Add ES5 Array extras\naddKeys(Array, {\n\n    isArray(obj) { return getClass(obj) === \"Array\"; }\n});\n\n\naddKeys(Array.prototype, {\n\n    indexOf(v, i) {\n    \n        var len = this.length >>> 0;\n        \n        i = i || 0;\n        if (i < 0) i = Math.max(len + i, 0);\n        \n        for (; i < len; ++i)\n            if (this[i] === v)\n                return i;\n        \n        return -1;\n    },\n    \n    lastIndexOf(v, i) {\n    \n        var len = this.length >>> 0;\n        \n        i = Math.min(i || 0, len - 1);\n        if (i < 0) i = len + i;\n        \n        for (; i >= 0; --i)\n            if (this[i] === v)\n                return i;\n        \n        return -1;\n    },\n    \n    every(fn, self) {\n    \n        var r = true;\n        \n        for (var i = 0, len = this.length >>> 0; i < len; ++i)\n            if (i in this && !(r = fn.call(self, this[i], i, this)))\n                break;\n        \n        return !!r;\n    },\n    \n    some(fn, self) {\n    \n        var r = false;\n        \n        for (var i = 0, len = this.length >>> 0; i < len; ++i)\n            if (i in this && (r = fn.call(self, this[i], i, this)))\n                break;\n        \n        return !!r;\n    },\n    \n    forEach(fn, self) {\n    \n        for (var i = 0, len = this.length >>> 0; i < len; ++i)\n            if (i in this)\n                fn.call(self, this[i], i, this);\n    },\n    \n    map(fn, self) {\n    \n        var a = [];\n        \n        for (var i = 0, len = this.length >>> 0; i < len; ++i)\n            if (i in this)\n                a[i] = fn.call(self, this[i], i, this);\n        \n        return a;\n    },\n    \n    filter(fn, self) {\n    \n        var a = [];\n        \n        for (var i = 0, len = this.length >>> 0; i < len; ++i)\n            if (i in this && fn.call(self, this[i], i, this))\n                a.push(this[i]);\n        \n        return a;\n    },\n    \n    reduce(fn) {\n    \n        var len = this.length >>> 0,\n            i = 0, \n            some = false,\n            ini = (arguments.length > 1),\n            val = (ini ? arguments[1] : this[i++]);\n        \n        for (; i < len; ++i) {\n        \n            if (i in this) {\n            \n                some = true;\n                val = fn(val, this[i], i, this);\n            }\n        }\n        \n        if (!some && !ini)\n            throw new TypeError(ERR_REDUCE);\n        \n        return val;\n    },\n    \n    reduceRight(fn) {\n    \n        var len = this.length >>> 0,\n            i = len - 1,\n            some = false,\n            ini = (arguments.length > 1),\n            val = (ini || i < 0  ? arguments[1] : this[i--]);\n        \n        for (; i >= 0; --i) {\n        \n            if (i in this) {\n            \n                some = true;\n                val = fn(val, this[i], i, this);\n            }\n        }\n        \n        if (!some && !ini)\n            throw new TypeError(ERR_REDUCE);\n        \n        return val;\n    }\n});\n\n// Add ES5 Function extras\naddKeys(Function.prototype, {\n\n    bind(self) {\n    \n        var f = this,\n            args = slice.call(arguments, 1),\n            noargs = (args.length === 0);\n        \n        bound.prototype = f.prototype;\n        return bound;\n        \n        function bound() {\n        \n            return f.apply(\n                this instanceof bound ? this : self, \n                noargs ? arguments : args.concat(slice.call(arguments, 0)));\n        }\n    }\n});\n\n// Add ES5 Date extras\naddKeys(Date, {\n\n    now() { return (new Date()).getTime(); }\n});\n\n// Add ES5 Date extras\naddKeys(Date.prototype, {\n\n    toISOString() {\n    \n        function pad(s) {\n        \n            if ((s = \"\" + s).length === 1) s = \"0\" + s;\n            return s;\n        }\n        \n        return this.getUTCFullYear() + \"-\" +\n            pad(this.getUTCMonth() + 1, 2) + \"-\" +\n            pad(this.getUTCDate(), 2) + \"T\" +\n            pad(this.getUTCHours(), 2) + \":\" +\n            pad(this.getUTCMinutes(), 2) + \":\" +\n            pad(this.getUTCSeconds(), 2) + \"Z\";\n    },\n    \n    toJSON() {\n    \n        return this.toISOString();\n    }\n});\n\n// Add ISO support to Date.parse\nif (Date.parse(new Date(0).toISOString()) !== 0) !function() {\n\n    /*\n    \n    In ES5 the Date constructor will also parse ISO dates, but overwritting \n    the Date function itself is too far.  Note that new Date(isoDateString)\n    is not backward-compatible.  Use the following instead:\n    \n    new Date(Date.parse(dateString));\n    \n    1: +/- year\n    2: month\n    3: day\n    4: hour\n    5: minute\n    6: second\n    7: fraction\n    8: +/- tz hour\n    9: tz minute\n    \n    */\n    \n    var isoRE = /^(?:((?:[+-]d{2})?d{4})(?:-(d{2})(?:-(d{2}))?)?)?(?:T(d{2}):(d{2})(?::(d{2})(?:.d{3})?)?)?(?:Z|([-+]d{2}):(d{2}))?$/,\n        dateParse = Date.parse;\n\n    Date.parse = function(s) {\n    \n        var t, m, hasDate, i, offset;\n        \n        if (!isNaN(t = dateParse(s)))\n            return t;\n        \n        if (s && (m = isoRE.exec(s))) {\n        \n            hasDate = m[1] !== undefined;\n            \n            // Convert matches to numbers (month and day default to 1)\n            for (i = 1; i <= 9; ++i)\n                m[i] = Number(m[i] || (i <= 3 ? 1 : 0));\n            \n            // Calculate ms directly if no date is provided\n            if (!hasDate)\n                return ((m[4] * 60 + m[5]) * 60 + m[6]) * 1000 + m[7];\n            \n            // Convert month to zero-indexed\n            m[2] -= 1;\n            \n            // Get TZ offset\n            offset = (m[8] * 60 + m[9]) * 60 * 1000;\n            \n            // Remove full match from array\n            m.shift();\n            \n            t = Date.UTC.apply(this, m) + offset;\n        }\n        \n        return t;\n    };\n            \n}();\n";

var ES6 = 

"var global = this,\n    HAS_OWN = Object.prototype.hasOwnProperty;\n\n// TODO:  Not everything gets added with the same property attributes...\n\n\nfunction addProps(obj, props) {\n\n    Object.keys(props).forEach(k => {\n    \n        if (typeof obj[k] !== \"undefined\")\n            return;\n        \n        Object.defineProperty(obj, k, {\n        \n            value: props[k],\n            configurable: true,\n            enumerable: false,\n            writable: true\n        });\n    });\n}\n\naddProps(Object, {\n\n    is(a, b) {\n    \n        // TODO\n    },\n    \n    assign(target, source) {\n    \n        Object.keys(source).forEach(k => target[k] = source[k]);\n        return target;\n    }\n});\n\n// TODO Math?\n\naddProps(Number, {\n\n    EPSILON: ($=> {\n    \n        var next, result;\n        \n        for (next = 1; 1 + next !== 1; next = next / 2)\n            result = next;\n        \n        return result;\n    })(),\n    \n    MAX_SAFE_INTEGER: 9007199254740992,\n    \n    MIN_SAFE_INTEGER: -9007199254740991,\n    \n    isInteger(val) {\n    \n        typeof val === \"number\" && val | 0 === val;\n    },\n    \n    isSafeInteger(val) {\n        // TODO\n    }\n});\n\naddProps(Number.prototype, {\n\n    clz() {\n    \n        var n = this >>> 0; // uint32\n        // TODO:  Count leading bitwise zeros of n\n    }\n});\n\naddProps(Array, {\n\n    from(arg) {\n        // TODO\n    },\n    \n    of() {\n        // ?\n    }\n\n});\n\naddProps(Array.prototype, {\n\n    copyWithin() {\n        // TODO\n    },\n    \n    keys() {\n        // TODO\n    },\n    \n    entries() {\n        // TODO\n    },\n    \n    fill() {\n        // TODO\n    },\n    \n    find() {\n        // TODO\n    },\n    \n    findIndex() {\n        // TODO\n    },\n    \n    values() {\n        // TODO\n    }\n    \n    // TODO:  ArrayIterator??\n});\n\naddProps(String, {\n\n    raw() {\n        // TODO\n    }\n});\n\naddProps(String.prototype, {\n    \n    repeat(count) {\n    \n        // TODO\n        return new Array(count + 1).join(this);\n    },\n    \n    startsWith(search, start) {\n    \n        // TODO\n        start = start >>> 0;\n        return this.indexOf(search, start) === start;\n    },\n    \n    endsWith(search, end) {\n    \n        // TODO\n        return this.slice(-search.length) === search;\n    },\n    \n    contains(search, pos) {\n    \n        // TODO\n        return this.indexOf(search, pos >>> 0) !== -1;\n    }\n});\n\n// TODO:  Should we even be going here?\nif (typeof Reflect === \"undefined\") global.Reflect = {\n\n    hasOwn(obj, name) { return HAS_OWN.call(obj, name); }\n};\n";

var Class = 

"var HOP = Object.prototype.hasOwnProperty,\n    STATIC = /^__static_/;\n\n// Returns true if the object has the specified property\nfunction hasOwn(obj, name) {\n\n    return HOP.call(obj, name);\n}\n\n// Returns true if the object has the specified property in\n// its prototype chain\nfunction has(obj, name) {\n\n    for (; obj; obj = Object.getPrototypeOf(obj))\n        if (HOP.call(obj, name))\n            return true;\n    \n    return false;\n}\n\n// Iterates over the descriptors for each own property of an object\nfunction forEachDesc(obj, fn) {\n\n    var names = Object.getOwnPropertyNames(obj);\n    \n    for (var i = 0, name; i < names.length; ++i)\n        fn(names[i], Object.getOwnPropertyDescriptor(obj, names[i]));\n    \n    return obj;\n}\n\n// Performs copy-based inheritance\nfunction inherit(to, from) {\n\n    for (; from; from = Object.getPrototypeOf(from)) {\n    \n        forEachDesc(from, (name, desc) => {\n        \n            if (!has(to, name))\n                Object.defineProperty(to, name, desc);\n        });\n    }\n    \n    return to;\n}\n\nfunction defineMethods(to, from, classMethods) {\n\n    forEachDesc(from, (name, desc) => {\n    \n        if (STATIC.test(name) === classMethods)\n            Object.defineProperty(to, classMethods ? name.replace(STATIC, \"\") : name, desc);\n    });\n}\n\nfunction Class(base, def) {\n\n    var parent;\n    \n    if (def === void 0) {\n    \n        // If no base class is specified, then Object.prototype\n        // is the parent prototype\n        def = base;\n        base = null;\n        parent = Object.prototype;\n    \n    } else if (base === null) {\n    \n        // If the base is null, then then then the parent prototype is null\n        parent = null;\n        \n    } else if (typeof base === \"function\") {\n    \n        parent = base.prototype;\n        \n        // Prototype must be null or an object\n        if (parent !== null && Object(parent) !== parent)\n            parent = void 0;\n    }\n    \n    if (parent === void 0)\n        throw new TypeError();\n    \n    var proto = Object.create(parent),\n        sup = prop => Object.getPrototypeOf(proto)[prop];\n    \n    // Generate the method collection, closing over \"__super\"\n    var props = def(sup),\n        constructor = props.constructor;\n    \n    if (!constructor)\n        throw new Error(\"No constructor specified.\");\n    \n    // Make constructor non-enumerable and assign a default\n    // if none is provided\n    Object.defineProperty(props, \"constructor\", {\n    \n        enumerable: false,\n        writable: true,\n        configurable: true,\n        value: constructor\n    });\n    \n    // Set prototype methods\n    defineMethods(proto, props, false);\n    \n    // Set constructor's prototype\n    constructor.prototype = proto;\n    \n    // Set class \"static\" methods\n    defineMethods(constructor, props, true);\n    \n    // \"Inherit\" from base constructor\n    if (base) inherit(constructor, base);\n    \n    return constructor;\n}\n\nthis.__class = Class;\n";

var Promise = 

"var enqueueMicrotask = ($=> {\n\n    var window = this.window,\n        process = this.process,\n        msgChannel = null,\n        list = [];\n    \n    if (typeof setImmediate === \"function\") {\n    \n        return window ?\n            window.setImmediate.bind(window) :\n            setImmediate;\n    \n    } else if (process && typeof process.nextTick === \"function\") {\n    \n        return process.nextTick;\n        \n    } else if (window && window.MessageChannel) {\n        \n        msgChannel = new window.MessageChannel();\n        msgChannel.port1.onmessage = $=> { if (list.length) list.shift()(); };\n    \n        return fn => {\n        \n            list.push(fn);\n            msgChannel.port2.postMessage(0);\n        };\n    }\n    \n    return fn => setTimeout(fn, 0);\n\n})();\n\n\nvar $status = \"Promise#status\",\n    $value = \"Promise#value\",\n    $onResolve = \"Promise#onResolve\",\n    $onReject = \"Promise#onReject\";\n\nfunction isPromise(x) { \n\n    return !!x && $status in Object(x);\n}\n\nfunction promiseResolve(promise, x) {\n    \n    promiseDone(promise, \"resolved\", x, promise[$onResolve]);\n}\n\nfunction promiseReject(promise, x) {\n    \n    promiseDone(promise, \"rejected\", x, promise[$onReject]);\n}\n\nfunction promiseDone(promise, status, value, reactions) {\n\n    if (promise[$status] !== \"pending\") \n        return;\n        \n    promise[$status] = status;\n    promise[$value] = value;\n    promise[$onResolve] = promise[$onReject] = void 0;\n    \n    for (var i = 0; i < reactions.length; ++i) \n        promiseReact(reactions[i][0], reactions[i][1], value);\n}\n\nfunction promiseUnwrap(deferred, x) {\n\n    if (x === deferred.promise)\n        throw new TypeError(\"Promise cannot wrap itself\");\n    \n    if (isPromise(x))\n        x.chain(deferred.resolve, deferred.reject);\n    else\n        deferred.resolve(x);\n}\n\nfunction promiseReact(deferred, handler, x) {\n\n    enqueueMicrotask($=> {\n    \n        try { promiseUnwrap(deferred, handler(x)) } \n        catch(e) { deferred.reject(e) }\n    });\n}\n\nfunction getDeferred(constructor) {\n\n    var result = {};\n\n    result.promise = new constructor((resolve, reject) => {\n        result.resolve = resolve;\n        result.reject = reject;\n    });\n\n    return result;\n}\n\nclass Promise {\n\n    constructor(init) {\n    \n        if (typeof init !== \"function\")\n            throw new TypeError(\"Promise constructor called without initializer\");\n        \n        this[$status] = \"pending\";\n        this[$onResolve] = [];\n        this[$onReject] = [];\n    \n        init(x => promiseResolve(this, x), r => promiseReject(this, r));\n    }\n    \n    chain(onResolve, onReject) {\n    \n        if (typeof onResolve !== \"function\") onResolve = x => x;\n        if (typeof onReject !== \"function\") onReject = e => { throw e };\n\n        var deferred = getDeferred(this.constructor);\n\n        switch (this[$status]) {\n\n            case undefined:\n                throw new TypeError(\"Promise method called on a non-promise\");\n        \n            case \"pending\":\n                this[$onResolve].push([deferred, onResolve]);\n                this[$onReject].push([deferred, onReject]);\n                break;\n    \n            case \"resolved\":\n                promiseReact(deferred, onResolve, this[$value]);\n                break;\n        \n            case \"rejected\":\n                promiseReact(deferred, onReject, this[$value]);\n                break;\n        }\n\n        return deferred.promise;\n    }\n    \n    then(onResolve, onReject) {\n\n        if (typeof onResolve !== \"function\") onResolve = x => x;\n    \n        return this.chain(x => {\n    \n            if (x && typeof x === \"object\") {\n            \n                var maybeThen = x.then;\n                \n                if (typeof maybeThen === \"function\")\n                    return maybeThen.call(x, onResolve, onReject);\n            }\n            \n            return onResolve(x);\n        \n        }, onReject);\n    }\n    \n    static resolve(x) { \n    \n        return new this(resolve => resolve(x));\n    }\n    \n    static reject(x) { \n    \n        return new this((resolve, reject) => reject(x));\n    }\n    \n    static isPromise(x) {\n        \n        return isPromise(x);\n    }\n    \n}\n\nthis.Promise = Promise;\n";

var Async = 

"function getDeferred(constructor) {\n\n    var result = {};\n\n    result.promise = new constructor((resolve, reject) => {\n        result.resolve = resolve;\n        result.reject = reject;\n    });\n\n    return result;\n}\n\nfunction promiseWhen(constructor, x) {\n\n    if (Promise.isPromise(x))\n        return x.chain(x => promiseWhen(constructor, x));\n    \n    var deferred = getDeferred(constructor);\n    deferred.resolve(x);\n    return deferred.promise;\n}\n\nfunction promiseIterate(iterable) {\n    \n    // TODO:  Use System.iterator\n    var iter = iterable;\n    \n    var constructor = Promise,\n        deferred = getDeferred(constructor);\n    \n    function resume(value, error) {\n    \n        if (error && !(\"throw\" in iter))\n            return deferred.reject(value);\n        \n        try {\n        \n            // Invoke the iterator/generator\n            var result = error ? iter.throw(value) : iter.next(value);\n            \n            // Recursively unwrap the result value\n            var promise = promiseWhen(constructor, result.value);\n            \n            if (result.done)\n                promise.chain(deferred.resolve, deferred.reject);\n            else\n                promise.chain(x => resume(x, false), x => resume(x, true));\n            \n        } catch (x) {\n        \n            deferred.reject(x);\n        }\n    }\n    \n    resume(void 0, false);\n    \n    return deferred.promise;\n}\n\nthis.__async = promiseIterate;\n";



exports.ES5 = ES5; exports.ES6 = ES6; exports.Class = Class; exports.Promise = Promise; exports.Async = Async; return exports; }).call(this, {});

var AST_ = (function(exports) {

var Node = __class(function(__super) { return {

    constructor: function Node(start, end) {
    
        this.type = this.constructor.name;
        this.start = start;
        this.end = end;
        this.error = "";
    },
    
    forEachChild: function(fn) {

        var keys = Object.keys(this), val, i, j;
    
        for (i = 0; i < keys.length; ++i) {
    
            // Don't iterate over backlink to parent
            if (keys[i] === "parentNode")
                continue;
            
            val = this[keys[i]];
        
            // Skip non-objects and functions
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
    
} });

var Script = __class(Node, function(__super) { return {

    constructor: function Script(statements, start, end) {
    
        __super("constructor").call(this, start, end);
        this.statements = statements;
    }
} });

var Module = __class(Node, function(__super) { return {

    constructor: function Module(statements, start, end) {
    
        __super("constructor").call(this, start, end);
        this.statements = statements;
    }
} });

var Identifier = __class(Node, function(__super) { return {

    constructor: function Identifier(value, context, start, end) {
    
        __super("constructor").call(this, start, end);
        this.value = value;
        this.context = context;
    }
} });

var Number = __class(Node, function(__super) { return {

    constructor: function Number(value, start, end) {
    
        __super("constructor").call(this, start, end);
        this.value = value;
    }
} });

var String = __class(Node, function(__super) { return {

    constructor: function String(value, start, end) {
    
        __super("constructor").call(this, start, end);
        this.value = value;
    }
} });

var Template = __class(Node, function(__super) { return {

    constructor: function Template(value, isEnd, start, end) {
    
        __super("constructor").call(this, start, end);
        this.value = value;
        this.templateEnd = isEnd;
    }
} });

var RegularExpression = __class(Node, function(__super) { return {

    constructor: function RegularExpression(value, flags, start, end) {
    
        __super("constructor").call(this, start, end);
        this.value = value;
        this.flags = flags;
    }
} });

var Null = __class(Node, function(__super) { return { constructor: function Null() { var c = __super("constructor"); if (c) return c.apply(this, arguments); } } });

var Boolean = __class(Node, function(__super) { return {

    constructor: function Boolean(value, start, end) {
    
        __super("constructor").call(this, start, end);
        this.value = value;
    }
} });

var ThisExpression = __class(Node, function(__super) { return { constructor: function ThisExpression() { var c = __super("constructor"); if (c) return c.apply(this, arguments); } } });

var SuperExpression = __class(Node, function(__super) { return { constructor: function SuperExpression() { var c = __super("constructor"); if (c) return c.apply(this, arguments); } } });

var SequenceExpression = __class(Node, function(__super) { return {

    constructor: function SequenceExpression(list, start, end) {
    
        __super("constructor").call(this, start, end);
        this.expressions = list;
    }
} });

var AssignmentExpression = __class(Node, function(__super) { return {

    constructor: function AssignmentExpression(op, left, right, start, end) {
    
        __super("constructor").call(this, start, end);
        this.operator = op;
        this.left = left;
        this.right = right;
    }
} });

var SpreadExpression = __class(Node, function(__super) { return {

    constructor: function SpreadExpression(expr, start, end) {
    
        __super("constructor").call(this, start, end);
        this.expression = expr;
    }
} });

var YieldExpression = __class(Node, function(__super) { return {

    constructor: function YieldExpression(expr, delegate, start, end) {
    
        __super("constructor").call(this, start, end);
        this.delegate = delegate;
        this.expression = expr;
    }
} });

var AwaitExpression = __class(Node, function(__super) { return {

    constructor: function AwaitExpression(expression, start, end) {
    
        __super("constructor").call(this, start, end);
        this.expression = expression;
    }
} });

var ConditionalExpression = __class(Node, function(__super) { return {

    constructor: function ConditionalExpression(test, cons, alt, start, end) {
    
        __super("constructor").call(this, start, end);
        this.test = test;
        this.consequent = cons;
        this.alternate = alt;
    }
} });

var BinaryExpression = __class(Node, function(__super) { return {

    constructor: function BinaryExpression(op, left, right, start, end) {
    
        __super("constructor").call(this, start, end);
        this.operator = op;
        this.left = left;
        this.right = right;
    }
} });

var UpdateExpression = __class(Node, function(__super) { return {

    constructor: function UpdateExpression(op, expr, prefix, start, end) {
    
        __super("constructor").call(this, start, end);
        this.operator = op;
        this.expression = expr;
        this.prefix = prefix;
    }
} });

var UnaryExpression = __class(Node, function(__super) { return {

    constructor: function UnaryExpression(op, expr, start, end) {
    
        __super("constructor").call(this, start, end);
        this.operator = op;
        this.expression = expr;
    }
} });

var MemberExpression = __class(Node, function(__super) { return {

    constructor: function MemberExpression(obj, prop, computed, start, end) {
    
        __super("constructor").call(this, start, end);
        this.object = obj;
        this.property = prop;
        this.computed = computed;
    }
} });

var CallExpression = __class(Node, function(__super) { return {

    constructor: function CallExpression(callee, args, start, end) {
    
        __super("constructor").call(this, start, end);
        this.callee = callee;
        this.arguments = args;
    }
} });

var TaggedTemplateExpression = __class(Node, function(__super) { return {

    constructor: function TaggedTemplateExpression(tag, template, start, end) {
    
        __super("constructor").call(this, start, end);
        this.tag = tag;
        this.template = template;
    }
} });

var NewExpression = __class(Node, function(__super) { return {

    constructor: function NewExpression(callee, args, start, end) {
    
        __super("constructor").call(this, start, end);
        this.callee = callee;
        this.arguments = args;
    }
} });

var ParenExpression = __class(Node, function(__super) { return {
    
    constructor: function ParenExpression(expr, start, end) {
    
        __super("constructor").call(this, start, end);
        this.expression = expr;
    }
} });

var ObjectLiteral = __class(Node, function(__super) { return {

    constructor: function ObjectLiteral(props, start, end) {
    
        __super("constructor").call(this, start, end);
        this.properties = props;
    }
} });

var ComputedPropertyName = __class(Node, function(__super) { return {

    constructor: function ComputedPropertyName(expr, start, end) {
    
        __super("constructor").call(this, start, end);
        this.expression = expr;
    }
} });

var PropertyDefinition = __class(Node, function(__super) { return {

    constructor: function PropertyDefinition(name, expr, start, end) {
    
        __super("constructor").call(this, start, end);
        this.name = name;
        this.expression = expr;
    }
} });

var PatternProperty = __class(Node, function(__super) { return {

    constructor: function PatternProperty(name, pattern, initializer, start, end) {
    
        __super("constructor").call(this, start, end);
        this.name = name;
        this.pattern = pattern;
        this.initializer = initializer;
    }
} });

var PatternElement = __class(Node, function(__super) { return {

    constructor: function PatternElement(pattern, initializer, rest, start, end) {
    
        __super("constructor").call(this, start, end);
        this.pattern = pattern;
        this.initializer = initializer;
        this.rest = rest;
    }
} });

var MethodDefinition = __class(Node, function(__super) { return {

    constructor: function MethodDefinition(kind, name, params, body, start, end) {
    
        __super("constructor").call(this, start, end);
        this.kind = kind;
        this.name = name;
        this.params = params;
        this.body = body;
    }
} });

var ArrayLiteral = __class(Node, function(__super) { return {

    constructor: function ArrayLiteral(elements, start, end) {
    
        __super("constructor").call(this, start, end);
        this.elements = elements;
    }
} });

var ArrayComprehension = __class(Node, function(__super) { return {

    constructor: function ArrayComprehension(qualifiers, expr, start, end) {
    
        __super("constructor").call(this, start, end);
        this.qualifiers = qualifiers;
        this.expression = expr;
    }
} });

var GeneratorComprehension = __class(Node, function(__super) { return {

    constructor: function GeneratorComprehension(qualifiers, expr, start, end) {
    
        __super("constructor").call(this, start, end);
        this.qualifiers = qualifiers;
        this.expression = expr;
    }
} });

var ComprehensionFor = __class(Node, function(__super) { return {

    constructor: function ComprehensionFor(left, right, start, end) {
    
        __super("constructor").call(this, start, end);
        this.left = left;
        this.right = right;
    }
} });

var ComprehensionIf = __class(Node, function(__super) { return {

    constructor: function ComprehensionIf(test, start, end) {
    
        __super("constructor").call(this, start, end);
        this.test = test;
    }
} });

var TemplateExpression = __class(Node, function(__super) { return {

    constructor: function TemplateExpression(lits, subs, start, end) {
    
        __super("constructor").call(this, start, end);
        this.literals = lits;
        this.substitutions = subs;
    }
} });

var Block = __class(Node, function(__super) { return {

    constructor: function Block(statements, start, end) {
    
        __super("constructor").call(this, start, end);
        this.statements = statements;
    }
} });

var LabelledStatement = __class(Node, function(__super) { return {

    constructor: function LabelledStatement(label, statement, start, end) {
    
        __super("constructor").call(this, start, end);
        this.label = label;
        this.statement = statement;
    }
} });

var ExpressionStatement = __class(Node, function(__super) { return {

    constructor: function ExpressionStatement(expr, start, end) {
    
        __super("constructor").call(this, start, end);
        this.expression = expr;
        this.directive = null;
    }
} });

var EmptyStatement = __class(Node, function(__super) { return { constructor: function EmptyStatement() { var c = __super("constructor"); if (c) return c.apply(this, arguments); } } });

var VariableDeclaration = __class(Node, function(__super) { return {

    constructor: function VariableDeclaration(kind, list, start, end) {
    
        __super("constructor").call(this, start, end);
        this.kind = kind;
        this.declarations = list;
    }
} });

var VariableDeclarator = __class(Node, function(__super) { return {

    constructor: function VariableDeclarator(pattern, initializer, start, end) {
    
        __super("constructor").call(this, start, end);
        this.pattern = pattern;
        this.initializer = initializer;
    }
} });

var ReturnStatement = __class(Node, function(__super) { return {

    constructor: function ReturnStatement(arg, start, end) {
    
        __super("constructor").call(this, start, end);
        this.argument = arg;
    }
} });

var BreakStatement = __class(Node, function(__super) { return {

    constructor: function BreakStatement(label, start, end) {
    
        __super("constructor").call(this, start, end);
        this.label = label;
    }
} });

var ContinueStatement = __class(Node, function(__super) { return {

    constructor: function ContinueStatement(label, start, end) {
    
        __super("constructor").call(this, start, end);
        this.label = label;
    }
} });

var ThrowStatement = __class(Node, function(__super) { return {

    constructor: function ThrowStatement(expr, start, end) {
    
        __super("constructor").call(this, start, end);
        this.expression = expr;
    }
} });

var DebuggerStatement = __class(Node, function(__super) { return { constructor: function DebuggerStatement() { var c = __super("constructor"); if (c) return c.apply(this, arguments); } } });

var IfStatement = __class(Node, function(__super) { return {

    constructor: function IfStatement(test, cons, alt, start, end) {
    
        __super("constructor").call(this, start, end);
        this.test = test;
        this.consequent = cons;
        this.alternate = alt;
    }
} });

var DoWhileStatement = __class(Node, function(__super) { return {

    constructor: function DoWhileStatement(body, test, start, end) {
    
        __super("constructor").call(this, start, end);
        this.body = body;
        this.test = test;
    }
} });

var WhileStatement = __class(Node, function(__super) { return {

    constructor: function WhileStatement(test, body, start, end) {
    
        __super("constructor").call(this, start, end);
        this.test = test;
        this.body = body;
    }
} });

var ForStatement = __class(Node, function(__super) { return {

    constructor: function ForStatement(initializer, test, update, body, start, end) {
    
        __super("constructor").call(this, start, end);
        this.initializer = initializer;
        this.test = test;
        this.update = update;
        this.body = body;
    }
} });

var ForInStatement = __class(Node, function(__super) { return {

    constructor: function ForInStatement(left, right, body, start, end) {
    
        __super("constructor").call(this, start, end);
        this.left = left;
        this.right = right;
        this.body = body;
    }
} });

var ForOfStatement = __class(Node, function(__super) { return {

    constructor: function ForOfStatement(left, right, body, start, end) {
    
        __super("constructor").call(this, start, end);
        this.left = left;
        this.right = right;
        this.body = body;
    }
} });

var WithStatement = __class(Node, function(__super) { return {

    constructor: function WithStatement(object, body, start, end) {
    
        __super("constructor").call(this, start, end);
        this.object = object;
        this.body = body;
    }
} });

var SwitchStatement = __class(Node, function(__super) { return {

    constructor: function SwitchStatement(desc, cases, start, end) {
    
        __super("constructor").call(this, start, end);
        this.descriminant = desc;
        this.cases = cases;
    }
} });

var SwitchCase = __class(Node, function(__super) { return {

    constructor: function SwitchCase(test, cons, start, end) {
    
        __super("constructor").call(this, start, end);
        this.test = test;
        this.consequent = cons;
    }
} });

var TryStatement = __class(Node, function(__super) { return {

    constructor: function TryStatement(block, handler, fin, start, end) {
    
        __super("constructor").call(this, start, end);
        this.block = block;
        this.handler = handler;
        this.finalizer = fin;
    }
} });

var CatchClause = __class(Node, function(__super) { return {

    constructor: function CatchClause(param, body, start, end) {
    
        __super("constructor").call(this, start, end);
        this.param = param;
        this.body = body;
    }
} });

var FunctionDeclaration = __class(Node, function(__super) { return {

    constructor: function FunctionDeclaration(kind, identifier, params, body, start, end) {
    
        __super("constructor").call(this, start, end);
        this.kind = kind;
        this.identifier = identifier;
        this.params = params;
        this.body = body;
    }
} });

var FunctionExpression = __class(Node, function(__super) { return {

    constructor: function FunctionExpression(kind, identifier, params, body, start, end) {
    
        __super("constructor").call(this, start, end);
        this.kind = kind;
        this.identifier = identifier;
        this.params = params;
        this.body = body;
    }
} });

var FormalParameter = __class(Node, function(__super) { return {

    constructor: function FormalParameter(pattern, initializer, start, end) {
    
        __super("constructor").call(this, start, end);
        this.pattern = pattern;
        this.initializer = initializer;
    }
} });

var RestParameter = __class(Node, function(__super) { return {

    constructor: function RestParameter(identifier, start, end) {
    
        __super("constructor").call(this, start, end);
        this.identifier = identifier;
    }
} });

var FunctionBody = __class(Node, function(__super) { return {

    constructor: function FunctionBody(statements, start, end) {
    
        __super("constructor").call(this, start, end);
        this.statements = statements;
    }
} });

var ArrowFunctionHead = __class(Node, function(__super) { return {

    constructor: function ArrowFunctionHead(params, start, end) {
    
        __super("constructor").call(this, start, end);
        this.parameters = params;
    }
} });

var ArrowFunction = __class(Node, function(__super) { return {

    constructor: function ArrowFunction(kind, params, body, start, end) {
    
        __super("constructor").call(this, start, end);
        this.kind = kind;
        this.params = params;
        this.body = body;
    }
} });

var ModuleDeclaration = __class(Node, function(__super) { return {

    constructor: function ModuleDeclaration(identifier, body, start, end) {
    
        __super("constructor").call(this, start, end);
        this.identifier = identifier;
        this.body = body;
    }
} });

var ModuleBody = __class(Node, function(__super) { return {

    constructor: function ModuleBody(statements, start, end) {
    
        __super("constructor").call(this, start, end);
        this.statements = statements;
    }
} });

var ModuleImport = __class(Node, function(__super) { return {

    constructor: function ModuleImport(identifier, from, start, end) {
    
        __super("constructor").call(this, start, end);
        this.identifier = identifier;
        this.from = from;
    }
} });

var ModuleAlias = __class(Node, function(__super) { return {

    constructor: function ModuleAlias(identifier, path, start, end) {
    
        __super("constructor").call(this, start, end);
        this.identifier = identifier;
        this.path = path;
    }
} });

var ImportDefaultDeclaration = __class(Node, function(__super) { return {

    constructor: function ImportDefaultDeclaration(ident, from, start, end) {
    
        __super("constructor").call(this, start, end);
        this.identifier = ident;
        this.from = from;
    }
} });

var ImportDeclaration = __class(Node, function(__super) { return {

    constructor: function ImportDeclaration(specifiers, from, start, end) {
    
        __super("constructor").call(this, start, end);
        this.specifiers = specifiers;
        this.from = from;
    }
} });

var ImportSpecifier = __class(Node, function(__super) { return {

    constructor: function ImportSpecifier(remote, local, start, end) {
    
        __super("constructor").call(this, start, end);
        this.remote = remote;
        this.local = local;
    }
} });

var ExportDeclaration = __class(Node, function(__super) { return {

    constructor: function ExportDeclaration(binding, start, end) {
    
        __super("constructor").call(this, start, end);
        this.binding = binding;
    }
} });

var ExportsList = __class(Node, function(__super) { return {

    constructor: function ExportsList(list, from, start, end) {
    
        __super("constructor").call(this, start, end);
        this.specifiers = list;
        this.from = from;
    }
} });

var ExportSpecifier = __class(Node, function(__super) { return {

    constructor: function ExportSpecifier(local, remote, start, end) {
    
        __super("constructor").call(this, start, end);
        this.local = local;
        this.remote = remote;
    }
} });

var ModulePath = __class(Node, function(__super) { return {
    
    constructor: function ModulePath(list, start, end) {
    
        __super("constructor").call(this, start, end);
        this.elements = list;
    }
} });

var ClassDeclaration = __class(Node, function(__super) { return {

    constructor: function ClassDeclaration(identifier, base, body, start, end) {
    
        __super("constructor").call(this, start, end);
        this.identifier = identifier;
        this.base = base;
        this.body = body;
    }
} });

var ClassExpression = __class(Node, function(__super) { return {

    constructor: function ClassExpression(identifier, base, body, start, end) {
    
        __super("constructor").call(this, start, end);
        this.identifier = identifier;
        this.base = base;
        this.body = body;
    }
} });

var ClassBody = __class(Node, function(__super) { return {

    constructor: function ClassBody(elems, start, end) {
    
        __super("constructor").call(this, start, end);
        this.elements = elems;
    }
} });

var ClassElement = __class(Node, function(__super) { return {

    constructor: function ClassElement(isStatic, method, start, end) {
    
        __super("constructor").call(this, start, end);
        this.static = isStatic;
        this.method = method;
    }
} });


exports.Node = Node; exports.Script = Script; exports.Module = Module; exports.Identifier = Identifier; exports.Number = Number; exports.String = String; exports.Template = Template; exports.RegularExpression = RegularExpression; exports.Null = Null; exports.Boolean = Boolean; exports.ThisExpression = ThisExpression; exports.SuperExpression = SuperExpression; exports.SequenceExpression = SequenceExpression; exports.AssignmentExpression = AssignmentExpression; exports.SpreadExpression = SpreadExpression; exports.YieldExpression = YieldExpression; exports.AwaitExpression = AwaitExpression; exports.ConditionalExpression = ConditionalExpression; exports.BinaryExpression = BinaryExpression; exports.UpdateExpression = UpdateExpression; exports.UnaryExpression = UnaryExpression; exports.MemberExpression = MemberExpression; exports.CallExpression = CallExpression; exports.TaggedTemplateExpression = TaggedTemplateExpression; exports.NewExpression = NewExpression; exports.ParenExpression = ParenExpression; exports.ObjectLiteral = ObjectLiteral; exports.ComputedPropertyName = ComputedPropertyName; exports.PropertyDefinition = PropertyDefinition; exports.PatternProperty = PatternProperty; exports.PatternElement = PatternElement; exports.MethodDefinition = MethodDefinition; exports.ArrayLiteral = ArrayLiteral; exports.ArrayComprehension = ArrayComprehension; exports.GeneratorComprehension = GeneratorComprehension; exports.ComprehensionFor = ComprehensionFor; exports.ComprehensionIf = ComprehensionIf; exports.TemplateExpression = TemplateExpression; exports.Block = Block; exports.LabelledStatement = LabelledStatement; exports.ExpressionStatement = ExpressionStatement; exports.EmptyStatement = EmptyStatement; exports.VariableDeclaration = VariableDeclaration; exports.VariableDeclarator = VariableDeclarator; exports.ReturnStatement = ReturnStatement; exports.BreakStatement = BreakStatement; exports.ContinueStatement = ContinueStatement; exports.ThrowStatement = ThrowStatement; exports.DebuggerStatement = DebuggerStatement; exports.IfStatement = IfStatement; exports.DoWhileStatement = DoWhileStatement; exports.WhileStatement = WhileStatement; exports.ForStatement = ForStatement; exports.ForInStatement = ForInStatement; exports.ForOfStatement = ForOfStatement; exports.WithStatement = WithStatement; exports.SwitchStatement = SwitchStatement; exports.SwitchCase = SwitchCase; exports.TryStatement = TryStatement; exports.CatchClause = CatchClause; exports.FunctionDeclaration = FunctionDeclaration; exports.FunctionExpression = FunctionExpression; exports.FormalParameter = FormalParameter; exports.RestParameter = RestParameter; exports.FunctionBody = FunctionBody; exports.ArrowFunctionHead = ArrowFunctionHead; exports.ArrowFunction = ArrowFunction; exports.ModuleDeclaration = ModuleDeclaration; exports.ModuleBody = ModuleBody; exports.ModuleImport = ModuleImport; exports.ModuleAlias = ModuleAlias; exports.ImportDefaultDeclaration = ImportDefaultDeclaration; exports.ImportDeclaration = ImportDeclaration; exports.ImportSpecifier = ImportSpecifier; exports.ExportDeclaration = ExportDeclaration; exports.ExportsList = ExportsList; exports.ExportSpecifier = ExportSpecifier; exports.ModulePath = ModulePath; exports.ClassDeclaration = ClassDeclaration; exports.ClassExpression = ClassExpression; exports.ClassBody = ClassBody; exports.ClassElement = ClassElement; return exports; }).call(this, {});

var Scanner_ = (function(exports) {

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
var charTable = ((function(_) {

    var charTable = new Array(128);
    
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
    
    var i;
    
    for (i = 65; i <= 90; ++i) charTable[i] = IDENTIFIER;
    for (i = 97; i <= 122; ++i) charTable[i] = IDENTIFIER;
    
    return charTable;
    
    function add(type, string) {
    
        string.split("").forEach((function(c) { return charTable[c.charCodeAt(0)] = type; }));
    }
    
}))();

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

var Scanner = __class(function(__super) { return {

    constructor: function Scanner(input, offset) {

        this.input = input || "";
        this.offset = offset || 0;
        this.length = this.input.length;
        this.lines = [-1];
        this.lastLineBreak = -1;
        
        this.type = "";
        this.start = 0;
        this.end = 0;
        this.value = "";
        this.number = 0;
        this.templateEnd = false;
        this.regExpFlags = null;
        this.newlineBefore = false;
        this.strictError = "";
    },
    
    next: function(context) {

        if (this.type !== "COMMENT")
            this.newlineBefore = false;
        
        this.strictError = "";
        this.value = null;
        
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
    
    lineNumber: function(offset) {
    
        if (Number(offset) !== offset)
            offset = (offset || this).start;
        
        return binarySearch(this.lines, offset);
    },
    
    position: function(token) {
    
        token || (token = this);
        
        var offset = token.start,
            line = this.lineNumber(offset),
            pos = this.lines[line - 1],
            column = offset - pos;
        
        return { 
        
            line: line, 
            column: column,
            startOffset: offset, 
            endOffset: token.end,
            lineOffset: pos + 1
        };
    },
    
    addLineBreak: function(offset) {
    
        if (offset > this.lastLineBreak)
            this.lines.push(this.lastLineBreak = offset);
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
                
                } else {
                
                    this.strictError = "Octal literals are not allowed in strict mode";
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
        
        this.strictError = "Octal literals are not allowed in strict mode";
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
        
        if (reservedWord.test(id))
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
        return "ILLEGAL";
    }
    
} });


exports.Scanner = Scanner; return exports; }).call(this, {});

var Transform_ = (function(exports) {

var AST = AST_;

var Transform = __class(function(__super) { return {

    // Transform an expression into a formal parameter list
    transformFormals: function(expr, rest) {
    
        if (expr === null)
            return [];
            
        var list = (expr.type === "SequenceExpression") ? expr.expressions : [expr],
            params = [],
            param,
            node,
            i;
    
        for (i = 0; i < list.length; ++i) {
        
            node = list[i];
            params.push(param = new AST.FormalParameter(node, null, node.start, node.end));
            this.transformPatternElement(param, true);
        }
        
        if (rest)
            params.push(rest);
        
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
                
                elem = elems[i] = new AST.PatternElement(
                    rest ? elem.expression : elem,
                    null,
                    rest,
                    elem.start,
                    elem.end);
                
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
            
            // Clear the error flag
            prop.error = "";
            
            switch (prop.type) {
            
                case "PatternProperty":
                
                    break;
                    
                case "PropertyDefinition":
                    
                    // Replace node
                    prop = new AST.PatternProperty(
                        prop.name,
                        prop.expression,
                        null,
                        prop.start,
                        prop.end);
                    
                    props[i] = prop;
                    
                    break;
                
                default:
                
                    this.fail("Invalid pattern", prop);
            }
            
            if (prop.pattern) this.transformPatternElement(prop, binding);
            else this.transformPattern(prop.name, binding);
        }
    },
    
    transformPatternElement: function(elem, binding) {
    
        var node = elem.pattern;
        
        // Split assignment into pattern and initializer
        if (node.type === "AssignmentExpression" && node.operator === "=") {
        
            elem.pattern = node.left;
            elem.initializer = node.right;
        }
        
        this.transformPattern(elem.pattern, binding);
    },
    
    // Transforms an expression into a pattern
    transformPattern: function(node, binding) {

        switch (node.type) {
        
            case "Identifier":
                if (binding) this.checkBindingIdentifier(node, true);
                else this.checkAssignTarget(node);
                
                break;
            
            case "MemberExpression":
            case "CallExpression":
                if (binding) this.fail("Invalid left-hand-side in binding pattern", node);
                break;
            
            case "ObjectLiteral":
            case "ObjectPattern":
                this.transformObjectPattern(node, binding);
                break;
            
            case "ArrayLiteral":
            case "ArrayPattern":
                this.transformArrayPattern(node, binding);
                break;
                
            default:
                this.fail("Invalid expression in pattern", node);
                break;
        }
        
        return node;
    }, constructor: function Transform() {}
    
} });



exports.Transform = Transform; return exports; }).call(this, {});

var Validate_ = (function(exports) {

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

// Encodes a string as a map key for use in regular object
function mapKey(name) { 

    return "." + (name || "");
}

// Returns true if the specified name is a restricted identifier in strict mode
function isPoisonIdent(name) {

    return name === "eval" || name === "arguments";
}

var Validate = __class(function(__super) { return {

    // Checks an assignment target for strict mode restrictions
    checkAssignTarget: function(node, simple) {
    
        // Remove any parenthesis surrounding the target
        for (; node.type === "ParenExpression"; node = node.expression);
        
        switch (node.type) {
        
            case "Identifier":
            
                // Mark identifier node as a variable
                node.context = "variable";

                if (isPoisonIdent(node.value))
                    this.addStrictError("Cannot modify " + node.value + " in strict mode", node);
        
                break;
            
            case "MemberExpression":
                break;
                    
            case "ObjectLiteral":
            case "ArrayLiteral":
            
                if (!simple) {
                
                    this.transformPattern(node, false);
                    break;
                }
            
            default:
                this.fail("Invalid left-hand side in assignment", node);
        }
    },
    
    // Checks an identifier for strict mode reserved words
    checkIdentifier: function(node) {
    
        var ident = node.value;
        
        if (ident === "yield" && this.context.functionType === "generator")
            this.fail("yield cannot be an identifier inside of a generator function", node);
        else if (isStrictReserved(ident))
            this.addStrictError(ident + " cannot be used as an identifier in strict mode", node);
    },
    
    // Checks a binding identifier for strict mode restrictions
    checkBindingIdentifier: function(node, strict) {
    
        // Perform basic identifier check
        this.checkIdentifier(node);
        
        // Mark identifier node as a declaration
        node.context = "declaration";
            
        var name = node.value;
        
        if (isPoisonIdent(name)) {
        
            var msg = "Binding cannot be created for '" + name + "' in strict mode";
            
            if (strict) this.fail(msg, node);
            else this.addStrictError(msg, node);
        }
    },
    
    // Checks function formal parameters for strict mode restrictions
    checkParameters: function(params) {
    
        var names = {}, 
            name,
            key,
            node,
            i;
        
        for (i = 0; i < params.length; ++i) {
        
            node = params[i];
            
            if (node.type !== "FormalParameter" || node.pattern.type !== "Identifier")
                continue;
            
            name = node.pattern.value;
            key = mapKey(name);
            
            if (isPoisonIdent(name))
                this.addStrictError("Parameter name " + name + " is not allowed in strict mode", node);
            
            if (names[key])
                this.addStrictError("Strict mode function may not have duplicate parameter names", node);
            
            names[key] = 1;
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
        
            if (decl.initializer && (
                type === "of" ||
                init.kind !== "var" ||
                decl.pattern.type !== "Identifier")) {
            
                this.fail("Invalid initializer in for-" + type + " statement", init);
            }
            
        } else {
        
            this.checkAssignTarget(init);
        }
    },
    
    // Checks for duplicate object literal property names
    checkPropertyName: function(node, nameSet) {
    
        if (node.name.type !== "Identifier")
            return;
        
        var flag = PROP_NORMAL,
            name;
        
        switch (node.type) {

            case "PropertyDefinition": flag = PROP_DATA; break;
    
            case "MethodDefinition":
        
                switch (node.kind) {

                    case "get": flag = PROP_GET; break;
                    case "set": flag = PROP_SET; break;
                }
        }

        // Check for duplicate names
        name = mapKey(node.name.value);

        if (this.isDuplicateName(flag, nameSet[name], false))
            this.addInvalidNode("Duplicate property names in object literal not allowed", node, false);
        else if (this.isDuplicateName(flag, nameSet[name], true))
            this.addInvalidNode("Duplicate data property names in object literal not allowed in strict mode", node, true);

        // Set name flag
        nameSet[name] |= flag;
    },
    
    // Checks for duplicate class element names
    checkClassElementName: function(node, nameSet) {
    
        if (node.name.type !== "Identifier")
            return;
        
        var flag = PROP_NORMAL,
            name;
        
        switch (node.kind) {

            case "get": flag = PROP_GET; break;
            case "set": flag = PROP_SET; break;
        }

        // Check for duplicate names
        name = mapKey(node.name.value);

        if (this.isDuplicateName(flag, nameSet[name], false))
            this.addInvalidNode("Duplicate method names in class not allowed", node, false);

        // Set name flag
        nameSet[name] |= flag;
    },
    
    // Returns true if the specified name type is a duplicate for a given set of flags
    isDuplicateName: function(type, flags, strict) {
    
        if (!flags)
            return false;
        
        switch (type) {
        
            case PROP_DATA: return strict || flags !== PROP_DATA;
            case PROP_GET: return flags !== PROP_SET;
            case PROP_SET: return flags !== PROP_GET;
            default: return !!flags;
        }
    },
    
    checkInvalidNodes: function() {
    
        var context = this.context,
            list = context.invalidNodes,
            item,
            node,
            i;
        
        if (list === null)
            return;
        
        for (i = 0; i < list.length; ++i) {
        
            item = list[i];
            node = item.node;
            
            if (node.error) {
            
                if (item.strict) this.addStrictError(node.error, node);
                else this.fail(node.error, node);
            }
        }
        
        context.invalidNodes = null;
    }, constructor: function Validate() {}
    
} });

exports.Validate = Validate; return exports; }).call(this, {});

var Parser_ = (function(exports) {

var AST = AST_;

var Scanner = Scanner_.Scanner;
var Transform = Transform_.Transform;
var Validate = Validate_.Validate;

// Object literal property name flags
var PROP_NORMAL = 1,
    PROP_DATA = 2,
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

// Encodes a string as a map key for use in regular object
function mapKey(name) { return "." + (name || "") }

var Token = __class(function(__super) { return {

    constructor: function Token(s) {
    
        this.type = s.type;
        this.start = s.start;
        this.end = s.end;
        this.value = s.value;
        this.number = s.number;
        this.templateEnd = s.templateEnd;
        this.regExpFlags = s.regExpFlags;
        this.newlineBefore = s.newlineBefore;
        this.strictError = s.strictError;
    }
} });

var Context = __class(function(__super) { return {

    constructor: function Context(parent, isStrict, isFunction) {
    
        this.parent = parent;
        this.strict = isStrict;
        this.isFunction = isFunction;
        this.functionBody = false;
        this.functionType = null;
        this.labelSet = {};
        this.switchDepth = 0;
        this.invalidNodes = null;
        this.strictError = null;
    }
} });

var Parser = __class(function(__super) { return {

    constructor: function Parser(input, offset) {

        var scanner = new Scanner(input, offset);
        
        this.scanner = scanner;
        this.token = new Scanner;
        this.input = input;
        
        this.peek0 = null;
        this.peek1 = null;
        this.endOffset = scanner.offset;
        
        this.context = null;
        this.pushContext(false);
    },

    get startOffset() {
    
        return this.peekToken().start;
    },
    
    nextToken: function(context) {
    
        var scanner = this.scanner,
            type;
        
        do { type = scanner.next(context); }
        while (type === "COMMENT");
        
        return new Token(scanner);
    },
    
    readToken: function(type, context) {
    
        var token = this.peek0 || this.nextToken(context);
        
        this.peek0 = this.peek1;
        this.peek1 = null;
        this.endOffset = token.end;
        
        if (type && token.type !== type)
            this.unexpected(token);
        
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
    
    unexpected: function(token) {
    
        var type = token.type, msg;
        
        msg = type === "EOF" ?
            "Unexpected end of input" :
            "Unexpected token " + token.type;
        
        this.fail(msg, token);
    },
    
    fail: function(msg, loc) {
    
        var pos = this.scanner.position(loc || this.peek0),
            err = new SyntaxError(msg);
        
        err.line = pos.line;
        err.column = err.column;
        err.lineOffset = pos.lineOffset;
        err.startOffset = pos.startOffset;
        err.endOffset = pos.endOffset;
        
        throw err;
    },
    
    readKeyword: function(word) {
    
        var token = this.readToken();
        
        if (token.type === word || token.type === "IDENTIFIER" && token.value === word)
            return token;
        
        this.unexpected(token);
    },
    
    peekKeyword: function(word) {
    
        var token = this.peekToken();
        return token.type === "IDENTIFIER" && token.value === word;
    },
    
    peekLet: function() {
    
        if (this.peekKeyword("let")) {
        
            switch (this.peek("div", 1)) {
            
                case "{":
                case "[":
                case "IDENTIFIER": return true;
            }
        }
        
        return false;
    },
    
    peekModule: function() {
    
        if (this.peekKeyword("module")) {
        
            var token = this.peekToken("div", 1);
            return (!token.newlineBefore && token.type === "IDENTIFIER");
        }
        
        return false;
    },
    
    peekYield: function() {
    
        return this.peekKeyword("yield") && 
            this.context.functionType === "generator" && 
            this.context.functionBody;
    },
    
    // [Async Functions]
    
    peekAwait: function() {
    
        if (this.peekKeyword("await") && this.context.functionBody) {
        
            switch (this.context.functionType) {
            
                case "async": return true;
                case "arrow": this.context.functionType = "async"; return true;
            }
        }
        
        return false;
    },
    
    peekAsync: function() {
    
        if (this.peekKeyword("async")) {
        
            var token = this.peekToken("div", 1);
            return (!token.newlineBefore && token.type === "IDENTIFIER");
        }
        
        return false;
    },
    
    // == Context Management ==
    
    pushContext: function(isFunction, isStrict) {
    
        isStrict = isStrict || (this.context ? this.context.strict : null);
        this.context = new Context(this.context, isStrict, isFunction);
    },
    
    popContext: function(collapse) {
    
        var context = this.context,
            parent = context.parent;
        
        if (context.strict !== true)
            this.setStrict(false);
        
        // If collapsing into parent context, copy invalid nodes into parent
        if (collapse && parent && context.invalidNodes) {

            if (!parent.invalidNodes) {
            
                parent.invalidNodes = context.invalidNodes;
                
            } else {
                
                for (var i = 0; i < context.invalidNodes.length; ++i)
                    parent.invalidNodes.push(context.invalidNodes[i]);
            }
            
            context.invalidNodes = null;
        }
        
        this.checkInvalidNodes();
        
        this.context = this.context.parent;
    },
    
    setStrict: function(strict) {
    
        var context = this.context,
            parent = this.context.parent;
        
        if (context.strict === true)
            return;
        
        context.strict = strict;
        
        var node = context.strictError;
        if (!node) return;
        
        if (strict) {
        
            if (node.error)
                this.fail(node.error, node);
            
        } else if (parent) {
        
            if (parent.strict === null && !parent.strictError)
                parent.strictError = node;
        }
        
        context.strictError = null;
    },
    
    addStrictError: function(error, node) {
    
        var c = this.context;
        
        node.error = error;
        
        if (c.strict === true)
            this.fail(error, node);
        else if (c.strict === null && !c.strictError)
            c.strictError = node;
    },
    
    maybeEnd: function() {
    
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
    
    addInvalidNode: function(error, node, strict) {
    
        var context = this.context,
            list = context.invalidNodes,
            item = { node: node, strict: strict };
        
        node.error = error;
        
        if (!list) context.invalidNodes = [item];
        else list.push(item);
    },
    
    // === Top Level ===
    
    Script: function() {
    
        this.pushContext(false);
        
        var start = this.startOffset,
            statements = this.StatementList(true, false);
        
        this.popContext();
        
        return new AST.Script(statements, start, this.endOffset);
    },
    
    Module: function() {
    
        this.pushContext(false, true);
        
        var start = this.startOffset,
            statements = this.StatementList(true, true);
        
        this.popContext();
        
        return new AST.Module(statements, start, this.endOffset);
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
                expr = new AST.SequenceExpression(list = [expr], start, -1);
            
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
        
        if (this.peekYield())
            return this.YieldExpression(noIn);
        
        left = this.ConditionalExpression(noIn);
        
        if (left.type === "ArrowFunctionHead")
            return this.ArrowFunctionBody(left, noIn);
        
        // Check for assignment operator
        if (!isAssignment(this.peek("div")))
            return left;
        
        this.checkAssignTarget(left);
        
        return new AST.AssignmentExpression(
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
            
            return new AST.SpreadExpression(
                this.AssignmentExpression(noIn), 
                start, 
                this.endOffset);
        }
        
        return this.AssignmentExpression(noIn);
    },
    
    YieldExpression: function(noIn) {
    
        var start = this.startOffset,
            delegate = false,
            expr = null;
            
        this.readKeyword("yield");
        
        if (!this.maybeEnd()) {
        
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
        
        return new AST.ConditionalExpression(left, middle, right, start, this.endOffset);
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
            
            lhs = new AST.BinaryExpression(op, lhs, rhs, lhs.start, rhs.end);
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
            this.checkAssignTarget(expr, true);
            
            return new AST.UpdateExpression(type, expr, true, start, this.endOffset);
        }
        
        // [Async Functions]
        if (this.peekAwait())
            return this.AwaitExpression();
        
        if (isUnary(type)) {
        
            this.read();
            expr = this.UnaryExpression();
            
            if (type === "delete" && expr.type === "Identifier")
                this.addStrictError("Cannot delete unqualified property in strict mode", expr);
            
            return new AST.UnaryExpression(type, expr, start, this.endOffset);
        }
        
        expr = this.MemberExpression(true);
        token = this.peekToken("div");
        type = token.type;
        
        // Check for postfix operator
        if (isIncrement(type) && !token.newlineBefore) {
        
            this.read();
            this.checkAssignTarget(expr, true);
            
            return new AST.UpdateExpression(type, expr, false, start, this.endOffset);
        }
        
        return expr;
    },
    
    // [Async Functions]
    AwaitExpression: function() {
    
        var start = this.startOffset,
            expr = null;
        
        this.readKeyword("await");
        
        if (!this.maybeEnd())
            expr = this.UnaryExpression();
        
        return new AST.AwaitExpression(
            expr,
            start,
            this.endOffset);
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
                    
                    expr = new AST.MemberExpression(
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
                    
                    expr = new AST.MemberExpression(
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
                    
                    expr = new AST.CallExpression(
                        expr, 
                        this.ArgumentList(), 
                        start, 
                        this.endOffset);
                    
                    break;
                
                case "TEMPLATE":
                
                    expr = new AST.TaggedTemplateExpression(
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
        
        var expr = this.peek() === "super" ?
            this.SuperExpression() :
            this.MemberExpression(false);
        
        var args = this.peek("div") === "(" ? this.ArgumentList() : null;
        
        return new AST.NewExpression(expr, args, start, this.endOffset);
    },
    
    SuperExpression: function() {
    
        var start = this.startOffset;
        this.read("super");
        
        return new AST.SuperExpression(start, this.endOffset);
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
    
        var token = this.peekToken(),
            type = token.type,
            start = this.startOffset;
        
        switch (type) {
            
            case "function": return this.FunctionExpression();
            case "class": return this.ClassExpression();
            case "TEMPLATE": return this.TemplateExpression();
            case "NUMBER": return this.Number();
            case "STRING": return this.String();
            case "{": return this.ObjectLiteral();
            
            case "(": return this.peek(null, 1) === "for" ? 
                this.GeneratorComprehension() :
                this.ParenExpression();
            
            case "[": return this.peek(null, 1) === "for" ?
                this.ArrayComprehension() :
                this.ArrayLiteral();
            
            case "IDENTIFIER":
            
                if (this.peekAsync()) {
                
                    return this.AsyncExpression();
                
                } else if (this.peek("div", 1) === "=>") {
                
                    this.pushContext(true);
                    return this.ArrowFunctionHead(this.BindingIdentifier(), null, start);
                }
                    
                return this.Identifier(true);
            
            case "REGEX":
                this.read();
                
                return new AST.RegularExpression(
                    token.value, 
                    token.regExpFlags, 
                    token.start, 
                    token.end);
            
            case "null":
                this.read();
                return new AST.Null(token.start, token.end);
            
            case "true":
            case "false":
                this.read();
                return new AST.Boolean(type === "true", token.start, token.end);
            
            case "this":
                this.read();
                return new AST.ThisExpression(token.start, token.end);
        }
        
        this.unexpected(token);
    },
    
    Identifier: function(isVar) {
    
        var token = this.readToken("IDENTIFIER"),
            context = isVar ? "variable" : "",
            node;
            
        node = new AST.Identifier(token.value, context, token.start, token.end);
        this.checkIdentifier(node);
        
        return node;
    },
    
    IdentifierName: function() {
    
        var token = this.readToken("IDENTIFIER", "name");
        return new AST.Identifier(token.value, "", token.start, token.end);
    },
    
    String: function() {
    
        var token = this.readToken("STRING");
        
        // Ocatal escapes are not allowed in strict mode
        if (token.strictError)
            this.addStrictError(token.strictError, token);
            
        return new AST.String(token.value, token.start, token.end);
    },
    
    Number: function() {
    
        var token = this.readToken("NUMBER");
        
        // Legacy ocatals are not allowed in strict mode
        if (token.strictError)
            this.addStrictError(token.strictError, token);
            
        return new AST.Number(token.number, token.start, token.end);
    },
    
    Template: function() {
    
        var token = this.readToken("TEMPLATE", "template");
        
        // Ocatal escapes are not allowed in strict mode
        if (token.strictError)
            this.addStrictError(token.strictError, token);
            
        return new AST.Template(token.value, token.templateEnd, token.start, token.end);
    },
    
    BindingIdentifier: function() {
    
        var token = this.readToken("IDENTIFIER", "name"),
            node = new AST.Identifier(token.value, "", token.start, token.end);
        
        this.checkBindingIdentifier(node);
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
        
        // Push a new context in case we are parsing an arrow function
        var parent = this.context;
        this.pushContext(this.context.isFunction);
        this.context.functionBody = parent.functionBody;
        this.context.functionType = parent.functionType;
        
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
        
        if (expr === null || rest !== null || this.peek("div") === "=>")
            return this.ArrowFunctionHead(expr, rest, start);
        
        // Collapse this context into its parent
        this.popContext(true);
        
        return new AST.ParenExpression(expr, start, this.endOffset);
    },
    
    ObjectLiteral: function() {
    
        var start = this.startOffset,
            list = [],
            nameSet = {},
            node,
            flag,
            key;
        
        this.read("{");
        
        while (this.peekUntil("}", "name")) {
        
            if (list.length > 0)
                this.read(",");
            
            if (this.peek("name") !== "}") {
            
                list.push(node = this.PropertyDefinition());
                this.checkPropertyName(node, nameSet);
            }
        }
        
        this.read("}");
        
        return new AST.ObjectLiteral(list, start, this.endOffset);
    },
    
    PropertyDefinition: function() {
    
        var start = this.startOffset,
            node,
            name;
        
        if (this.peek("name") === "*")
            return this.MethodDefinition();
        
        switch (this.peek("name", 1)) {
        
            case "=":
        
                // Re-read token as an identifier
                this.unpeek();
            
                node = new AST.PatternProperty(
                    this.Identifier(),
                    null,
                    (this.read(), this.AssignmentExpression()),
                    start,
                    this.endOffset);
        
                this.addInvalidNode("Invalid property definition in object literal", node, false);
                return node;
            
            case ",":
            case "}":
            
                // Re-read token as an identifier
                this.unpeek();
        
                return new AST.PropertyDefinition(
                    this.Identifier(),
                    null,
                    start,
                    this.endOffset);
        }
            
        name = this.PropertyName();
        
        if (this.peek("name") === ":") {
        
            return new AST.PropertyDefinition(
                name,
                (this.read(), this.AssignmentExpression()),
                start,
                this.endOffset);
        }
        
        return this.MethodDefinition(name);
    },
    
    PropertyName: function() {
    
        var token = this.peekToken("name");
        
        switch (token.type) {
        
            case "IDENTIFIER": return this.Identifier();
            case "STRING": return this.String();
            case "NUMBER": return this.Number();
            case "[": return this.ComputedPropertyName();
        }
        
        this.unexpected(token);
    },
    
    ComputedPropertyName: function() {
    
        var start = this.startOffset;
        
        this.read("[");
        var expr = this.AssignmentExpression();
        this.read("]");
        
        return new AST.ComputedPropertyName(expr, start, this.endOffset);
    },
    
    MethodDefinition: function(name) {
    
        var start = name ? name.start : this.startOffset,
            kind = "";
        
        if (!name && this.peek("name") === "*") {
        
            this.read();
            
            kind = "generator";
            name = this.PropertyName();
        
        } else {
        
            if (!name)
                name = this.PropertyName();
            
            if (name.type === "Identifier" && this.peek("name") !== "(") {
            
                switch (name.value) {
                
                    case "get":
                    case "set":
                    case "async":
                        kind = name.value;
                        name = this.PropertyName();
                        break;
                }
            }
        }
        
        this.pushContext(true);
        
        if (kind === "generator" || kind === "async")
            this.context.functionType = kind;
        
        var params = this.FormalParameters(),
            body = this.FunctionBody();
        
        this.checkParameters(params);
        this.popContext();
        
        return new AST.MethodDefinition(
            kind,
            name,
            params,
            body,
            start,
            this.endOffset);
    },
    
    ArrayLiteral: function() {
    
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
        
        return new AST.ArrayLiteral(list, start, this.endOffset);
    },
    
    ArrayComprehension: function() {
    
        var start = this.startOffset;
        
        this.read("[");
        
        var list = this.ComprehensionQualifierList(),
            expr = this.AssignmentExpression();
        
        this.read("]");
        
        return new AST.ArrayComprehension(list, expr, start, this.endOffset);
    },
    
    GeneratorComprehension: function() {
    
        var start = this.startOffset;
        
        this.read("(");
        
        var list = this.ComprehensionQualifierList(),
            expr = this.AssignmentExpression();
        
        this.read(")");
        
        return new AST.GeneratorComprehension(list, expr, start, this.endOffset);
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
        
        return new AST.ComprehensionFor(
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
        
        return new AST.ComprehensionIf(test, start, this.endOffset);
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
        
        return new AST.TemplateExpression(lit, sub, start, this.endOffset);
    },
    
    // === Statements ===
    
    Statement: function() {
    
        switch (this.peek()) {
            
            case "IDENTIFIER":
            
                return this.peekAsync() ? this.AsyncDeclaration() :
                    this.peek("div", 1) === ":" ? this.LabelledStatement() :
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
    
        var name = mapKey(label && label.value),
            labelSet = this.context.labelSet,
            stmt;
        
        if (!labelSet[name]) labelSet[name] = 0;
        else if (label) this.fail("Invalid label", label);
        
        labelSet[name] += 1;
        stmt = this.Statement();
        labelSet[name] -= 1;
        
        return stmt;
    },
    
    Block: function() {
        
        var start = this.startOffset;
        
        this.read("{");
        var list = this.StatementList(false, false);
        this.read("}");
        
        return new AST.Block(list, start, this.endOffset);
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
        
        return new AST.LabelledStatement(
            label, 
            this.StatementWithLabel(label),
            start,
            this.endOffset);
    },
    
    ExpressionStatement: function() {
    
        var start = this.startOffset,
            expr = this.Expression();
        
        this.Semicolon();
        
        return new AST.ExpressionStatement(expr, start, this.endOffset);
    },
    
    EmptyStatement: function() {
    
        var start = this.startOffset;
        
        this.Semicolon();
        
        return new AST.EmptyStatement(start, this.endOffset);
    },
    
    VariableStatement: function() {
    
        var node = this.VariableDeclaration(false);
        
        this.Semicolon();
        node.end = this.endOffset;
        
        return node;
    },
    
    VariableDeclaration: function(noIn) {
    
        var start = this.startOffset,
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
        
        return new AST.VariableDeclaration(kind, list, start, this.endOffset);
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
        
        return new AST.VariableDeclarator(pattern, init, start, this.endOffset);
    },
    
    ReturnStatement: function() {
    
        if (!this.context.isFunction)
            this.fail("Return statement outside of function");
        
        var start = this.startOffset;
        
        this.read("return");
        var value = this.maybeEnd() ? null : this.Expression();
        
        this.Semicolon();
        
        return new AST.ReturnStatement(value, start, this.endOffset);
    },
    
    BreakOrContinueStatement: function() {
    
        var start = this.startOffset,
            token = this.readToken(),
            keyword = token.type,
            labelSet = this.context.labelSet,
            label,
            name;
        
        label = this.maybeEnd() ? null : this.Identifier();
        name = mapKey(label && label.value);
        
        this.Semicolon();
        
        if (label) {
        
            if (!labelSet[name])
                this.fail("Invalid label", label);
        
        } else {
        
            if (!labelSet[name] && !(keyword === "break" && this.context.switchDepth > 0))
                this.fail("Invalid " + keyword + " statement", token);
        }
        
        return keyword === "break" ?
            new AST.BreakStatement(label, start, this.endOffset) :
            new AST.ContinueStatement(label, start, this.endOffset);
    },
    
    ThrowStatement: function() {
    
        var start = this.startOffset;
        
        this.read("throw");
        
        var expr = this.maybeEnd() ? null : this.Expression();
        
        if (expr === null)
            this.fail("Missing throw expression");
        
        this.Semicolon();
        
        return new AST.ThrowStatement(expr, start, this.endOffset);
    },
    
    DebuggerStatement: function() {
    
        var start = this.startOffset;
        
        this.read("debugger");
        this.Semicolon();
        
        return new AST.DebuggerStatement(start, this.endOffset);
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
        
        return new AST.IfStatement(test, body, elseBody, start, this.endOffset);
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
        
        return new AST.DoWhileStatement(body, test, start, this.endOffset);
    },
    
    WhileStatement: function() {
    
        var start = this.startOffset;
        
        this.read("while");
        this.read("(");
        
        return new AST.WhileStatement(
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
        
        return new AST.ForStatement(
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
        
        return new AST.ForInStatement(
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
        
        return new AST.ForOfStatement(
            init, 
            expr, 
            this.StatementWithLabel(), 
            start, 
            this.endOffset);
    },
    
    WithStatement: function() {
    
        var token = this.readToken("with");
        
        this.addStrictError("With statement is not allowed in strict mode", token);
    
        var start = this.startOffset;
        
        this.read("with");
        this.read("(");
        
        return new AST.WithStatement(
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
        
        return new AST.SwitchStatement(head, cases, start, this.endOffset);
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
        
        return new AST.SwitchCase(expr, list, start, this.endOffset);
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
        
        return new AST.TryStatement(tryBlock, handler, fin, start, this.endOffset);
    },
    
    CatchClause: function() {
    
        var start = this.startOffset;
        
        this.read("catch");
        this.read("(");
        var param = this.BindingPattern();
        this.read(")");
        
        return new AST.CatchClause(param, this.Block(), start, this.endOffset);
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
                    this.setStrict(true);
            
            } else {
            
                prologue = false;
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
                
                if (this.peekModule())
                    return this.ModuleDefinition();
                
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
            kind = "";
        
        this.read("function");
        
        if (this.peek() === "*") {
            
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
            this.endOffset);
    },
    
    FunctionExpression: function() {
    
        var start = this.startOffset,
            kind = "",
            ident = null;
        
        this.read("function");
        
        if (this.peek() === "*") {
            
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
            this.endOffset);
    },
    
    AsyncDeclaration: function() {
    
        var start = this.startOffset;
        
        this.readKeyword("async");
        this.pushContext(true);
        this.context.functionType = "async";
        
        var ident = this.BindingIdentifier(),
            params = this.FormalParameters(),
            body = this.FunctionBody();
            
        this.checkParameters(params);
        this.popContext();
        
        return new AST.FunctionDeclaration(
            "async",
            ident,
            params,
            body,
            start,
            this.endOffset);
    },
    
    AsyncExpression: function() {
    
        var start = this.startOffset;
        
        this.readKeyword("async");
        this.pushContext(true);
        this.context.functionType = "async";
        
        var ident = this.BindingIdentifier(),
            params = this.FormalParameters(),
            body = this.FunctionBody();

        this.checkParameters(params);        
        this.popContext();
        
        return new AST.FunctionExpression(
            "async",
            ident,
            params,
            body,
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
        
        return new AST.FormalParameter(pattern, init, start, this.endOffset);
    },
    
    RestParameter: function() {
    
        var start = this.startOffset;
        
        this.read("...");
        
        return new AST.RestParameter(this.BindingIdentifier(), start, this.endOffset);
    },
    
    FunctionBody: function() {
        
        this.context.functionBody = true;
        
        var start = this.startOffset;
        
        this.read("{");
        var statements = this.StatementList(true, false);
        this.read("}");
        
        return new AST.FunctionBody(statements, start, this.endOffset);
    },
    
    ArrowFunctionHead: function(formals, rest, start) {
    
        // Context must have been pushed by caller
        this.context.isFunction = true;
        
        var params = this.transformFormals(formals, rest);
        this.checkParameters(params);
        
        return new AST.ArrowFunctionHead(params, start, this.endOffset);
    },
    
    ArrowFunctionBody: function(head, noIn) {
    
        this.read("=>");
        
        var params = head.parameters,
            start = head.start,
            kind = "";
        
        // Use function body context even if parsing expression body form
        this.context.functionType = "arrow";
        this.context.functionBody = true;
        
        var body = this.peek() === "{" ?
            this.FunctionBody() :
            this.AssignmentExpression(noIn);
        
        if (this.context.functionType === "async")
            kind = "async";
        
        this.popContext();
        
        return new AST.ArrowFunction(kind, params, body, start, this.endOffset);
    },
    
    // === Modules ===
    
    ModuleDefinition: function() {
    
        var start = this.startOffset,
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
                this.endOffset);
            
        } else if (this.peekKeyword("from")) {
    
            this.read();
            target = this.ModuleSpecifier();
            this.Semicolon();
        
            return new AST.ModuleImport(
                ident,
                target,
                start,
                this.endOffset);
        }
        
        return new AST.ModuleDeclaration(
            ident,
            this.ModuleBody(),
            start,
            this.endOffset);
    },
    
    ModuleDeclaration: function() {
        
        var start = this.startOffset;
        
        this.readKeyword("module");
        
        return new AST.ModuleDeclaration(
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
        
        return new AST.ModuleBody(list, start, this.endOffset);
    },
    
    ModuleSpecifier: function() {
    
        return this.peek() === "STRING" ? this.String() : this.ModulePath();
    },
    
    ImportDeclaration: function() {
    
        var start = this.startOffset,
            ident,
            from;
        
        this.read("import");
        
        switch (this.peek()) {
        
            case "IDENTIFIER":
            
                ident = this.BindingIdentifier();
                this.readKeyword("from");
                from = this.ModuleSpecifier();
                this.Semicolon();
                
                return new AST.ImportDefaultDeclaration(ident, from, start, this.endOffset);
            
            case "STRING":
            
                from = this.ModuleSpecifier();
                this.Semicolon();
                
                return new AST.ImportDeclaration(null, from, start, this.endOffset);
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
        
        return new AST.ImportDeclaration(list, from, start, this.endOffset);
    },
    
    ImportSpecifier: function() {
    
        var start = this.startOffset,
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
        
            this.checkBindingIdentifier(remote);
        }
        
        return new AST.ImportSpecifier(remote, local, start, this.endOffset);
    },
    
    ExportDeclaration: function() {
    
        var start = this.startOffset,
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
                
                if (this.peekAsync()) {
                
                    binding = this.AsyncDeclaration();
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
        
        return new AST.ExportDeclaration(binding, start, this.endOffset);
    },
    
    ExportsList: function() {
    
        var start = this.startOffset,
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
        
        return new AST.ExportsList(list, from, start, this.endOffset);
    },
    
    ExportSpecifier: function() {
    
        var start = this.startOffset,
            local = this.IdentifierName(),
            remote = null;
        
        if (this.peekKeyword("as")) {
        
            this.read();
            remote = this.IdentifierName();
        }
        
        return new AST.ExportSpecifier(local, remote, start, this.endOffset);
    },
    
    ModulePath: function() {
    
        var start = this.startOffset,
            path = [];
        
        while (true) {
        
            path.push(this.Identifier());
            
            if (this.peek() === ".") this.read();
            else break;
        }
        
        return new AST.ModulePath(path, start, this.endOffset);
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
            base = this.MemberExpression(true);
        }
        
        return new AST.ClassDeclaration(
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
            base = this.MemberExpression(true);
        }
        
        return new AST.ClassExpression(
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
        
        return new AST.ClassBody(list, start, this.endOffset);
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
        this.checkClassElementName(method, nameSet);
        
        return new AST.ClassElement(isStatic, method, start, this.endOffset);
    }
    
} });


function mixin(source) {

    source = source.prototype;
    Object.keys(source).forEach((function(key) { return Parser.prototype[key] = source[key]; }));
}

// Add externally defined methods
mixin(Transform);
mixin(Validate);



exports.Parser = Parser; return exports; }).call(this, {});

var main______ = (function(exports) {

var AST = AST_;

var Parser = Parser_.Parser;
var Scanner = Scanner_.Scanner;



function parseModule(input, options) {

    return new Parser(input, options).Module();
}

function parseScript(input, options) {

    return new Parser(input, options).Script();
}


exports.Parser = Parser; exports.Scanner = Scanner; exports.AST = AST; exports.parseModule = parseModule; exports.parseScript = parseScript; return exports; }).call(this, {});

var main_____ = (function(exports) {

Object.keys(main______).forEach(function(k) { exports[k] = main______[k]; });

return exports; }).call(this, {});

var Replacer_ = (function(exports) {

/*

== Notes ==

- With this approach, we can't have cyclic dependencies.  But there are
  many other restrictions as well.  They may be lifted at some point in
  the future.

*/

var Parser = main_____.Parser, AST = main_____.AST;

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

var RootNode = __class(AST.Node, function(__super) { return {

    constructor: function RootNode(root, end) {
    
        __super("constructor").call(this, 0, end);
        this.root = root;
    }
} });

var Replacer = __class(function(__super) { return {

    constructor: function Replacer(options) {
        
        options || (options = {});
        
        this.loadCall = options.loadCall || ((function(url) { return "__load(" + JSON.stringify(url) + ")"; }));
        this.mapURI = options.mapURI || ((function(uri) { return uri; }));
    },
    
    replace: function(input) { var __this = this; 
    
        this.exportStack = [this.exports = {}];
        this.imports = {};
        this.dependencies = [];
        this.uid = 0;
        this.input = input;

        var parser = new Parser(input),
            scanner = parser.scanner,
            root = parser.Module();
        
        var visit = (function(node) {
        
            node.text = null;
                
            // Call pre-order traversal method
            if (__this[node.type + "Begin"])
                __this[node.type + "Begin"](node);
            
            // Perform a depth-first traversal
            node.forEachChild((function(child) {
            
                child.parentNode = node;
                visit(child);
            }));
            
            var text = null;
            
            // Call replacer
            if (__this[node.type])
                text = __this[node.type](node);
            
            if (text === null || text === void 0)
                text = __this.stringify(node);
            
            var height = scanner.lineNumber(node.end - 1) - scanner.lineNumber(node.start);
            
            return node.text = preserveNewlines(text, height);
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
    
    Module: function(node) {
    
        if (node.createThisBinding)
            return "var __this = this; " + this.stringify(node);
    },
    
    Script: function(node) {
    
        if (node.createThisBinding)
            return "var __this = this; " + this.stringify(node);
    },
    
    FunctionBody: function(node) {
    
        if (node.parentNode.createThisBinding)
            return "{ var __this = this; " + this.stringify(node).slice(1);
    },
    
    MethodDefinition: function(node) {
    
        if (node.parentNode.type === "ClassElement" && 
            node.parentNode.static) {
            
            node.name.text = "__static_" + (node.name.value || "");
        }
        
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
    
        var out = "var " + node.identifier.text + " = (function(exports) ";
        
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
    
        var moduleSpec = this.modulePath(node.from),
            list = [];
        
        if (node.specifiers) {
        
            node.specifiers.forEach((function(spec) {
        
                var remote = spec.remote,
                    local = spec.local || remote;
            
                list.push({
                    start: spec.start,
                    end: spec.end,
                    text: local.text + " = " + moduleSpec + "." + remote.text
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
    
        var binding = node.binding,
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
        
        if (node.isSuperCall) {
        
            var argText = "this";
            
            if (args.length > 0)
                argText += ", " + this.joinList(args);
            
            return callee.text + ".call(" + argText + ")";
        }
    },
    
    SuperExpression: function(node) {
    
        var p = node.parentNode;
        
        if (p.type === "CallExpression") {
        
            // super(args);
        
            p.isSuperCall = true;
            
            var m = this.parentFunction(p),
                name = (m.type === "MethodDefinition" ? m.name.text : "constructor");
            
            return "__super(" + JSON.stringify(name) + ")";
            
        } else {
        
            // super.foo...
            p.isSuperLookup = true;
        }
        
        p = p.parentNode;
        
        if (p.type === "CallExpression") {
        
            // super.foo(args);
            p.isSuperCall = true;
        }
        
        return "__super";
    },
    
    MemberExpression: function(node) {
    
        if (node.isSuperLookup) {
        
            var prop = node.property.text;
            
            if (!node.computed)
                prop = '"' + prop + '"';
            
            return node.object.text + "(" + prop + ")";
        }
    },
    
    ArrowFunction: function(node) {
    
        var body = node.body.type === "FunctionBody" ?
            node.body.text :
            "{ return " + node.body.text + "; }";
        
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
    
    AwaitExpression: function(node) {
    
        return node.expression ? "(yield " + node.expression.text + ")" : "yield";
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
    
        return "var " + node.identifier.text + " = __class(" + 
            (node.base ? (node.base.text + ", ") : "") +
            "function(__super) { return " +
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
            "__class(" + 
            (node.base ? (node.base.text + ", ") : "") +
            "function(__super) { return " +
            node.body.text + " })" +
            after + ")";
    },
    
    ClassBody: function(node) {
    
        var classIdent = node.parentNode.identifier,
            hasBase = !!node.parentNode.base,
            elems = node.elements, 
            hasCtor = false,
            e,
            i;
        
        for (i = elems.length; i--;) {
        
            e = elems[i];
            
            if (e.static) {
            
                e.text = e.text.replace(/^static\s+/, "");
                
            } else if (e.method.name.value === "constructor") {
            
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
            
                ctor += ' var c = __super("constructor"); ';
                ctor += "if (c) return c.apply(this, arguments); }";
                
            } else {
            
                ctor += "}";
            }
            
            if (elems.length === 0)
                return "{ " + ctor + " }";
                
            elems[elems.length - 1].text += ", " + ctor;
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
    
    asyncFunction: function(ident, params, body) {
    
        var head = "function";
        
        if (ident)
            head += " " + ident.text;
        
        var outerParams = params.map((function(x, i) { return "__" + i; })).join(", ");
        
        return "" + (head) + "(" + (outerParams) + ") { " +
            "try { return __async(function*(" + (this.joinList(params)) + ") " + 
            "" + (body) + ".apply(this, arguments)); " +
            "} catch (x) { return Promise.reject(x); } }";
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
            
            node.forEachChild(visit);
        }
    },
    
    modulePath: function(node) {
    
        return node.type === "String" ?
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
        node.forEachChild((function(child) {
        
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
    
    var replacer = new Replacer(options),
        output;
    
    input = sanitize(input);
    
    if (options.runtime) {
            
        input = "\n\n" +
            wrapRuntimeModule(Runtime.Class) + 
            wrapRuntimeModule(Runtime.ES5) +
            wrapRuntimeModule(Runtime.ES6) +
            wrapRuntimeModule(Runtime.Promise) +
            wrapRuntimeModule(Runtime.Async) +
            input;
    }
            
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



exports.translate = translate; exports.wrap = wrap; exports.isWrapped = isWrapped; return exports; }).call(this, {});

var PackageLocator = (function(exports) {

var Path = _M0;
var FS = _M1;

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

var ConsoleStyle_ = (function(exports) {

function green(msg) {

    return "\u001b[32m" + (msg) + "\u001b[39m";
}

function red(msg) {

    return "\u001b[31m" + (msg) + "\u001b[39m";
}

function gray(msg) {

    return "\u001b[90m" + (msg) + "\u001b[39m";
}

function bold(msg) {

    return "\u001b[1m" + (msg) + "\u001b[22m";
}

exports.green = green; exports.red = red; exports.gray = gray; exports.bold = bold; return exports; }).call(this, {});

var ConsoleCommand = (function(exports) {

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

var ConsoleCommand = __class(function(__super) { return {

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

var ConsoleIO = (function(exports) {

var Style = ConsoleStyle_;

var ConsoleIO = __class(function(__super) { return {

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

var StringMap = __class(function(__super) { return {

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

var StringSet = __class(function(__super) { return {

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

var PromiseExtensions = __class(function(__super) { return {

    __static_iterate: function(fn) {

        var done = false,
            stop = (function(val) { done = true; return val; }),
            next = (function(last) { return done ? last : Promise.resolve(fn(stop)).then(next); });
    
        return Promise.resolve().then(next);
    },

    __static_forEach: function(list, fn) {

        var i = -1;
        return this.iterate((function(stop) { return (++i >= list.length) ? stop() : fn(list[i], i, list); }));
    }, constructor: function PromiseExtensions() {}

} });

exports.PromiseExtensions = PromiseExtensions; return exports; }).call(this, {});

var AsyncFS_ = (function(exports) {

var FS = _M1;

// Wraps a standard Node async function with a promise
// generating function
function wrap(fn) {

	return function() {
	
	    var a = [].slice.call(arguments, 0);
	    
		return new Promise((function(resolve, reject) {
		    
            a.push((function(err, data) {
        
                if (err) reject(err);
                else resolve(data);
            }));
            
            fn.apply(null, a);
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

var main___ = (function(exports) {

Object.keys(ConsoleCommand).forEach(function(k) { exports[k] = ConsoleCommand[k]; });
Object.keys(ConsoleIO).forEach(function(k) { exports[k] = ConsoleIO[k]; });
Object.keys(StringSet).forEach(function(k) { exports[k] = StringSet[k]; });
Object.keys(StringMap_).forEach(function(k) { exports[k] = StringMap_[k]; });
Object.keys(PromiseExtensions).forEach(function(k) { exports[k] = PromiseExtensions[k]; });

var ConsoleStyle = ConsoleStyle_;


var AsyncFS = AsyncFS_;




exports.ConsoleStyle = ConsoleStyle; exports.AsyncFS = AsyncFS; return exports; }).call(this, {});

var main_ = (function(exports) {

Object.keys(main___).forEach(function(k) { exports[k] = main___[k]; });

return exports; }).call(this, {});

var NodeRun = (function(exports) {

var FS = _M1;
var REPL = _M2;
var VM = _M3;
var Path = _M0;

var translate = Translator.translate;
var isPackageURI = PackageLocator.isPackageURI, locatePackage = PackageLocator.locatePackage;
var Style = main_.ConsoleStyle;


var ES6_GUESS = /(?:^|\n)\s*(?:import|export|class)\s/;


function formatSyntaxError(e, text, filename) {

    var msg = e.message;
    
    if (filename)
        msg += "\n    at " + filename + ":" + e.line;
    
    if (e.lineOffset < text.length) {
    
        msg += "\n\n" +
            text.slice(e.lineOffset, e.startOffset) +
            Style.bold(Style.red(text.slice(e.startOffset, e.endOffset))) + 
            text.slice(e.endOffset, text.indexOf("\n", e.endOffset)) + "\n";
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
                text = translate(text);
        
        } catch (e) {
        
            if (e instanceof SyntaxError)
                e = new SyntaxError(formatSyntaxError(e, source, filename));
            
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
    
        var result = m.main();
        
        if (Promise.isPromise(result))
            result.then(null, (function(x) { return setTimeout((function($) { throw x }), 0); }));
    }
}

function startREPL() {

    addExtension();

    var repl = REPL.start({ 
    
        prompt: "es6now> ",
        
        eval: function(input, context, filename, cb) {
        
            var text, result, script, displayErrors = false;
            
            try {
            
                text = translate(input, { wrap: false });
                script = VM.createScript(text, { filename: filename, displayErrors: displayErrors });
            
            } catch (x) {
            
                if (x instanceof SyntaxError)
                    x = new SyntaxError(formatSyntaxError(x, input));
                
                return cb(x);
            }
            
            try {
            
                result = context === global ? 
                    script.runInThisContext({ displayErrors: displayErrors }) : 
                    script.runInContext(context, { displayErrors: displayErrors });
                
            } catch (x) {
            
                return cb(x);
            }
            
            return cb(null, result);
        }
    });
}

exports.formatSyntaxError = formatSyntaxError; exports.runModule = runModule; exports.startREPL = startREPL; return exports; }).call(this, {});

var Analyzer = (function(exports) {

var parseModule = main_____.parseModule;
var StringSet = main_.StringSet, StringMap = main_.StringMap;

function parse(code) { 

    return parseModule(code);
}

function analyze(ast, resolvePath) {

    if (typeof ast === "string")
        ast = parseModule(ast);
    
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
        
        node.forEachChild((function(child) { return visit(child, topLevel); }));
    }
    
    function addEdge(spec) {
    
        if (!spec || spec.type !== "String")
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

exports.parse = parse; exports.analyze = analyze; return exports; }).call(this, {});

var Bundler = (function(exports) {

var Path = _M0;

var AsyncFS = main_.AsyncFS, StringMap = main_.StringMap, StringSet = main_.StringSet;
var analyze = Analyzer.analyze;

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

var main____ = (function(exports) {

var createBundle = Bundler.createBundle;
var AsyncFS = main_.AsyncFS, ConsoleCommand = main_.ConsoleCommand;


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

Object.keys(main____).forEach(function(k) { exports[k] = main____[k]; });

return exports; }).call(this, {});

var main = (function(exports) {

var FS = _M1;
var Path = _M0;

var runModule = NodeRun.runModule, startREPL = NodeRun.startREPL, formatSyntaxError = NodeRun.formatSyntaxError;
var AsyncFS = main_.AsyncFS, ConsoleCommand = main_.ConsoleCommand;
var createBundle = main__.createBundle;
var translate = Translator.translate;
var locatePackage = PackageLocator.locatePackage;


function getOutPath(inPath, outPath) {

    var stat;
    
    outPath = Path.resolve(process.cwd(), outPath);
    
    try { stat = FS.statSync(outPath); } catch (e) {}
    
    if (stat && stat.isDirectory())
        return Path.resolve(outPath, Path.basename(inPath));
    
    return outPath;
}

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
        
        var promise = params.bundle ?
            createBundle(params.input, locatePackage) :
            AsyncFS.readFile(params.input, { encoding: "utf8" });
        
        promise.then((function(text) {
        
            try {
            
                text = translate(text, { 
            
                    global: params.global,
                    runtime: params.runtime
                });
            
            } catch (x) {
            
                if (x instanceof SyntaxError)
                    x = new SyntaxError(formatSyntaxError(x, text));
                
                throw x;
            }
        
            if (params.output) {
            
                var outPath = getOutPath(params.input, params.output);
                return AsyncFS.writeFile(outPath, text, "utf8");
            
            } else {
            
                process.stdout.write(text + "\n");
            }
            
        })).then(null, (function(x) {
        
            setTimeout((function($) { throw x }), 0);
        }));
    }

}).run();



return exports; }).call(this, {});

Object.keys(main).forEach(function(k) { exports[k] = main[k]; });


}, ["path","fs","repl","vm"], "");