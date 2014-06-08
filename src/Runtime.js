export var Runtime = {};

Runtime.API = 

`var global = this, 
    arraySlice = Array.prototype.slice,
    hasOwn = Object.prototype.hasOwnProperty,
    staticName = /^__static_/;

// Returns true if the object has the specified property in
// its prototype chain
function has(obj, name) {

    for (; obj; obj = Object.getPrototypeOf(obj))
        if (hasOwn.call(obj, name))
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
    
        forEachDesc(from, (name, desc) => {
        
            if (!has(to, name))
                Object.defineProperty(to, name, desc);
        });
    }
    
    return to;
}

// Installs methods on a prototype
function defineMethods(to, from) {

    forEachDesc(from, (name, desc) => {
    
        if (typeof name !== "string" || !staticName.test(name))
            Object.defineProperty(to, name, desc);
    });
}

// Installs static methods on a constructor
function defineStatic(to, from) {

    forEachDesc(from, (name, desc) => {
    
        if (typeof name === "string" &&
            staticName.test(name) && 
            typeof desc.value === "object" && 
            desc.value) {
            
            defineMethods(to, desc.value);
        }
    });
}

// Builds a class
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
        throw new TypeError;
    
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

this._es6now = {

    Class: Class,

    // Support for iterator protocol
    iter(obj) {

        if (global.Symbol && Symbol.iterator && obj[Symbol.iterator] !== void 0)
            return obj[Symbol.iterator]();
    
        if (Array.isArray(obj))
            return obj.values();
    
        return obj;
    },

    // Support for computed property names
    computed(obj) {

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
    },

    // Support for tagged templates
    callSite(values, raw) {

        values.raw = raw || values;
        return values;
    },

    // Support for async functions
    async(iterable) {
    
        var iter = _es6now.iter(iterable),
            resolver,
            promise;
    
        promise = new Promise((resolve, reject) => resolver = { resolve, reject });
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
                    value.then(resolver.resolve, resolver.reject);
                else
                    value.then(x => resume(x, false), x => resume(x, true));
            
            } catch (x) { resolver.reject(x) }
        
        }
    },
    
    // Support for spread operations
    spread() {
    
        return {
        
            a: [], 
            
            // Add items
            s() { 
            
                for (var i = 0; i < arguments.length; ++i) 
                    this.a.push(arguments[i]);
                
                return this;
            },
            
            // Add the contents of iterables
            i(list) {
            
                if (Array.isArray(list)) {
                
                    this.a.push.apply(this.a, list);
                
                } else {
                
                    for (var item of list)
                        this.a.push(item);
                }
                
                return this;
            }
            
        };
    },
    
    // Support for object destructuring
    objd(obj) {
    
        if (!obj || typeof obj !== "object")
           throw new TypeError;
        
        return obj;
    },
    
    // Support for array destructuring
    arrayd(obj) {
    
        if (Array.isArray(obj)) {
        
            return { 
            
                at(skip, pos) { return obj[pos] },
                rest(skip, pos) { return obj.slice(pos) }
            };
        }
        
        var iter = _es6now.iter(obj);
        
        return {
        
            at(skip) {
            
                var r;
                
                while (skip--)
                    r = iter.next();
                
                return r.value;
            },
            
            rest(skip) {
                
                var a = [], r;
                
                while (--skip)
                    r = iter.next();
                
                while (r = iter.next(), !r.done)
                    a.push(r.value);
                
                return a;
            }
        };
    }
    
};
`;

Runtime.ES6 = 

`var global = this, 
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

function polyfill(obj, methods) {

    eachKey(methods, key => {
    
        if (key in obj && !global._testES6Shims)
            return;
        
        var desc = {
        
            value: methods[key],
            configurable: true,
            enumerable: false,
            writable: true
        };
        
        try { Object.defineProperty(obj, key, desc) }
        catch (x) { }
        
    });
}

function toInteger(val) {

    var n = +val;
    
    return (Number.isNaN(n)) ? 0 :
        (n === 0 || !Number.isFinite(n)) ? n :
        Math.sign(n) * Math.floor(Math.abs(n));
}

function toLength(val) {

    var n = toInteger(val);
    return n < 0 ? 0 : Math.min(n, Number.MAX_SAFE_INTEGER);
}

// === Object ===

polyfill(Object, {

    is(left, right) {
    
        if (left === right)
            return left !== 0 || 1 / left === 1 / right;
        
        return left !== left && right !== right;
    },
    
    // TODO: Multiple sources
    assign(target, source) {
    
        Object.keys(source).forEach(key => target[key] = source[key]);
        return target;
    }
    
});

// === Number ===

polyfill(Number, {

    EPSILON: ($=> {
    
        var next, result;
        
        for (next = 1; 1 + next !== 1; next = next / 2)
            result = next;
        
        return result;
        
    })(),
    
    MAX_SAFE_INTEGER: 9007199254740992,
    
    MIN_SAFE_INTEGER: -9007199254740991,
    
    isInteger(val) { return typeof val === "number" && val | 0 === val },
    
    isFinite(val) { return typeof val === "number" && global.isFinite(val) },
    
    isNaN(val) { return val !== val },
    
    isSafeInteger(val) { return Number.isInteger(val) && Math.abs(val) <= Number.MAX_SAFE_INTEGER }
    
});

// === String === 

polyfill(String, {

    raw(callsite, ...args) {
    
        var raw = callsite.raw,
            len = toLength(raw.length);
        
        if (len === 0)
            return "";
            
        var s = "", i = 0;
        
        while (true) {
        
            s += raw[i];
            if (i + 1 === len || i >= args.length) break;
            s += args[i++];
        }
        
        return s;
    }
    
    // TODO:  fromCodePoint
    
});

// Repeat a string by "squaring"
function repeat(s, n) {

    if (n < 1) return "";
    if (n % 2) return repeat(s, n - 1) + s;
    var half = repeat(s, n / 2);
    return half + half;
}

polyfill(String.prototype, {
    
    repeat(count) {
    
        if (this == null) 
            throw new TypeError;
        
        var string = String(this);
        
        count = toInteger(count);
        
        if (count < 0 || count === Infinity)
            throw new RangeError;
        
        return repeat(string, count);
    },
    
    startsWith(search) {
        
        if (this == null || toString.call(search) == "[object RegExp]")
            throw new TypeError;
        
        var string = String(this);
        
        search = String(search);
        
        var pos = arguments.length > 1 ? arguments[1] : undefined,
            start = Math.max(toInteger(pos), 0);
        
        return string.slice(start, start + search.length) === search;
    },
    
    endsWith(search) {
        
        if (this == null || toString.call(search) == '[object RegExp]')
            throw new TypeError;
        
        var string = String(this);
        
        search = String(search);
        
        var len = string.length,
            arg = arguments.length > 1 ? arguments[1] : undefined,
            pos = arg === undefined ? len : toInteger(arg),
            end = Math.min(Math.max(pos, 0), len);
        
        return string.slice(end - search.length, end) === search;
    },
    
    contains(search) {
    
        var pos = arguments.length > 1 ? arguments[1] : undefined;
        
        // Somehow this trick makes method 100% compat with the spec.
        return stringIndexOf.call(this, search, pos) !== -1;
    },
    
    codePointAt(pos) {
    
        if (this == null) 
            throw new TypeError;
        
        var string = String(this),
            len = string.length;
        
        pos = toInteger(pos);
        
        if (pos < 0 || pos >= len) 
            return undefined;
        
        var a = string.charCodeAt(pos);
        
        if (a < 0xD800 || a > 0xDBFF || pos + 1 === len) 
            return a;
        
        var b = string.charCodeAt(pos + 1);
        
        if (b < 0xDC00 || b > 0xDFFF) 
            return a;
        
        return ((a - 0xD800) * 1024) + (b - 0xDC00) + 0x10000;
    },
    
    [Symbol.iterator]() { 
    
        if (this == null)
            throw new TypeError;
        
        return new StringIterator(this);
    }
    
});

class StringIterator {

    constructor(string) {
    
        this.string = string;
        this.current = 0;
    }
    
    next() {
    
        var s = this.string, 
            i = this.current,
            len = s.length;
        
        if (i >= len) {
        
            this.current = Infinity;
            return { value: void 0, done: true };
        }
        
        var c = s.charCodeAt(i),
            chars = 1;
        
        if (!(c < 0xD800 || c > 0xDBFF || i + 1 >= s.length)) {
        
            c = s.charCodeAt(i + 1);
            chars = c < 0xDC00 || c > 0xDFFF ? 1 : 2;
        }
        
        this.current = i + chars;
        
        return { value: s.slice(i, this.current), done: false };
    }
    
    [Symbol.iterator]() { return this }
    
}

// === Array ===

class ArrayIterator {

    constructor(array, kind) {
    
        this.array = array;
        this.current = 0;
        this.kind = kind;
    }
    
    next() {
    
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
    }
    
    [Symbol.iterator]() { return this }

}

polyfill(Array.prototype, {

    values()  { return new ArrayIterator(this, "values") },
    entries() { return new ArrayIterator(this, "entries") },
    keys()    { return new ArrayIterator(this, "keys") },
    [Symbol.iterator]() { return this.values() }
    
});
`;

Runtime.Promise = 

`var enqueueMicrotask = ($=> {

    var window = this.window,
        process = this.process,
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
        msgChannel.port1.onmessage = $=> { if (list.length) list.shift()(); };
    
        return fn => {
        
            list.push(fn);
            msgChannel.port2.postMessage(0);
        };
    }
    
    return fn => setTimeout(fn, 0);

})();

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

    d.promise = new ctor((resolve, reject) => {
        d.resolve = resolve;
        d.reject = reject;
    });

    return d;
}

function promiseChain(promise, onResolve, onReject) {

    if (typeof onResolve !== "function") onResolve = x => x;
    if (typeof onReject !== "function") onReject = e => { throw e };

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

    enqueueMicrotask($=> {
    
        try { promiseUnwrap(deferred, handler(x)) } 
        catch(e) { try { deferred.reject(e) } catch (e) { } }
    });
}

class Promise {

    constructor(init) {
    
        if (typeof init !== "function")
            throw new TypeError("Promise constructor called without initializer");
        
        this[$value] = void 0;
        this[$status] = "pending";
        this[$onResolve] = [];
        this[$onReject] = [];
    
        var resolve = x => promiseResolve(this, x),
            reject = r => promiseReject(this, r);
        
        try { init(resolve, reject) } catch (x) { reject(x) }
    }
    
    chain(onResolve, onReject) {
    
        return promiseChain(this, onResolve, onReject);
    }
    
    then(onResolve, onReject) {

        if (typeof onResolve !== "function") onResolve = x => x;
        
        return promiseChain(this, x => {
    
            if (x && typeof x === "object") {
            
                var maybeThen = x.then;
                
                if (typeof maybeThen === "function")
                    return maybeThen.call(x, onResolve, onReject);
            }
                        
            return onResolve(x);
        
        }, onReject);
        
    }
    
    catch(onReject) {
    
        return this.then(void 0, onReject);
    }
    
    static defer() {
    
        return promiseDefer(this);
    }
    
    static accept(x) {
    
        var d = promiseDefer(this);
        d.resolve(x);
        return d.promise;
    }
    
    static resolve(x) { 
    
        if (isPromise(x))
            return x;
            
        var d = promiseDefer(this);
        d.resolve(x);
        return d.promise;
    }
    
    static reject(x) { 
    
        var d = promiseDefer(this);
        d.reject(x);
        return d.promise;
    }

    static all(values) {

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
    
            return x => {
        
                resolutions[i] = x;
            
                if (--count === 0)
                    deferred.resolve(resolutions);
            };
        }
    }
    
    static race(values) {
    
        // TODO: We should be getting an iterator from values
        
        var deferred = promiseDefer(this);
        
        try {
        
            if (!Array.isArray(values))
                throw new Error("Invalid argument");
            
            for (var i = 0; i < values.length; ++i)
                this.resolve(values[i]).then(deferred.resolve, deferred.reject);
        
        } catch(x) { deferred.reject(x) }
        
        return deferred.promise;
    }
    
}

Promise.prototype[$$isPromise] = true;

if (this.Promise === void 0)
    this.Promise = Promise;
`;

