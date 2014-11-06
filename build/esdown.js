/*=esdown=*/(function(fn, deps, name) { function obj() { return {} } if (typeof exports !== 'undefined') fn(require, exports, module); else if (typeof define === 'function' && define.amd) define(['require', 'exports', 'module'].concat(deps), fn); else if (typeof window !== 'undefined' && name) fn(obj, window[name] = {}, {}); else fn(obj, {}, {}); })(function(require, exports, module) { 'use strict'; function __load(p, l) { module.__es6 = !l; var e = require(p); if (e && e.constructor !== Object) e.default = e; return e; } 
(function() {

function globalObject() {

    try { return global.global } catch (x) {}
    try { return window.window } catch (x) {}
    return null;
}

var arraySlice = Array.prototype.slice,
    hasOwn = Object.prototype.hasOwnProperty,
    staticName = /^__static_/,
    Global = globalObject();

function toObject(val) {

    if (val == null)
        throw new TypeError(val + " is not an object");

    return Object(val);
}

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

        forEachDesc(from, function(name, desc) {

            if (!has(to, name))
                Object.defineProperty(to, name, desc);
        });
    }

    return to;
}

// Installs methods on a prototype
function defineMethods(to, from) {

    forEachDesc(from, function(name, desc) {

        if (typeof name !== "string" || !staticName.test(name))
            Object.defineProperty(to, name, desc);
    });
}

// Installs static methods on a constructor
function defineStatic(to, from) {

    forEachDesc(from, function(name, desc) {

        if (typeof name === "string" &&
            staticName.test(name) &&
            typeof desc.value === "object" &&
            desc.value) {

            defineMethods(to, desc.value);
        }
    });
}

// Builds a class
function buildClass(base, def) {

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
        props = def(parent, base || Function.prototype),
        constructor = props.constructor;

    if (!constructor)
        throw new Error("No constructor specified");

    // Make constructor non-enumerable
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

Global._esdown = {

    version: "0.9.1",

    global: Global,

    class: buildClass,

    // Support for iterator protocol
    iter: function(obj) {

        if (obj[Symbol.iterator] !== void 0)
            return obj[Symbol.iterator]();

        if (Array.isArray(obj))
            return obj.values();

        return obj;
    },

    asyncIter: function(obj) {

        if (obj[Symbol.asyncIterator] !== void 0)
            return obj[Symbol.asyncIterator]();

        var iter = _esdown.computed({ __$0: function() { return this } }, Symbol.asyncIterator),
            inner = _esdown.iter(obj);

        ["next", "throw", "return"].forEach(function(name) {

            if (name in inner)
                iter[name] = function(value) { return Promise.resolve(inner[name](value)); };
        });

        return iter;
    },

    // Support for computed property names
    computed: function(obj) {

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
    callSite: function(values, raw) {

        values.raw = raw || values;
        return values;
    },

    // Support for async functions
    async: function(iterable) {

        try {

            var iter = _esdown.iter(iterable),
                resolver,
                promise;

            promise = new Promise(function(resolve, reject) { return resolver = { resolve: resolve, reject: reject }; });
            resume("next", void 0);
            return promise;

        } catch (x) { return Promise.reject(x) }

        function resume(type, value) {

            if (!(type in iter)) {

                resolver.reject(value);
                return;
            }

            try {

                var result = iter[type](value);

                value = Promise.resolve(result.value);

                if (result.done) value.then(resolver.resolve, resolver.reject);
                else value.then(function(x) { return resume("next", x); }, function(x) { return resume("throw", x); });

            } catch (x) { resolver.reject(x) }
        }
    },

    // Support for async generators
    asyncGen: function(iterable) {

        var iter = _esdown.iter(iterable),
            state = "paused",
            queue = [];

        return _esdown.computed({

            next: function(val) { return enqueue("next", val) },
            throw: function(val) { return enqueue("throw", val) },
            return: function(val) { return enqueue("return", val) },
            __$0: function() { return this }
        }, Symbol.asyncIterator);

        function enqueue(type, value) {

            var resolve, reject;
            var promise = new Promise(function(res, rej) { return (resolve = res, reject = rej); });

            queue.push({ type: type, value: value, resolve: resolve, reject: reject });

            if (state === "paused")
                next();

            return promise;
        }

        function next() {

            if (queue.length > 0) {

                state = "running";
                var first = queue[0];
                resume(first.type, first.value);

            } else {

                state = "paused";
            }
        }

        function resume(type, value) {

            if (type === "return" && !(type in iter)) {

                // If the generator does not support the "return" method, then
                // emulate it (poorly) using throw
                type = "throw";
                value = { value: value, __return: true };
            }

            try {

                var result = iter[type](value),
                    value = result.value;

                if (typeof value === "object" && "_esdown_await" in value) {

                    if (result.done)
                        throw new Error("Invalid async generator return");

                    Promise.resolve(value._esdown_await).then(
                        function(x) { return resume("next", x); },
                        function(x) { return resume("throw", x); });

                    return;

                } else {

                    queue.shift().resolve(result);
                }

            } catch (x) {

                if (x && x.__return === true)
                    queue.shift().resolve({ value: x.value, done: true });
                else
                    queue.shift().reject(x);
            }

            next();
        }
    },

    // Support for spread operations
    spread: function() {

        return {

            a: [],

            // Add items
            s: function() {

                for (var i = 0; i < arguments.length; ++i)
                    this.a.push(arguments[i]);

                return this;
            },

            // Add the contents of iterables
            i: function(list) {

                if (Array.isArray(list)) {

                    this.a.push.apply(this.a, list);

                } else {

                    for (var __$0 = _esdown.iter(list), __$1; __$1 = __$0.next(), !__$1.done;)
                        { var item = __$1.value; this.a.push(item); }
                }

                return this;
            }

        };
    },

    // Support for object destructuring
    objd: function(obj) {

        return toObject(obj);
    },

    // Support for array destructuring
    arrayd: function(obj) {

        if (Array.isArray(obj)) {

            return {

                at: function(skip, pos) { return obj[pos] },
                rest: function(skip, pos) { return obj.slice(pos) }
            };
        }

        var iter = _esdown.iter(toObject(obj));

        return {

            at: function(skip) {

                var r;

                while (skip--)
                    r = iter.next();

                return r.value;
            },

            rest: function(skip) {

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


}).call(this);

(function() {

// === Polyfill Utilities ===

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

    eachKey(methods, function(key) {

        if (key in obj)
            return;

        Object.defineProperty(obj, key, {

            value: methods[key],
            configurable: true,
            enumerable: false,
            writable: true
        });

    });
}


// === Spec Helpers ===

var sign = Math.sign || function(val) {

    var n = +val;

    if (n === 0 || Number.isNaN(n))
        return n;

    return n < 0 ? -1 : 1;
};

function toInteger(val) {

    var n = +val;

    return n !== n /* n is NaN */ ? 0 :
        (n === 0 || !isFinite(n)) ? n :
        sign(n) * Math.floor(Math.abs(n));
}

function toLength(val) {

    var n = toInteger(val);
    return n < 0 ? 0 : Math.min(n, Number.MAX_SAFE_INTEGER);
}

function sameValue(left, right) {

    if (left === right)
        return left !== 0 || 1 / left === 1 / right;

    return left !== left && right !== right;
}

function isRegExp(val) {

    return Object.prototype.toString.call(val) == "[object RegExp]";
}

function toObject(val) {

    if (val == null)
        throw new TypeError(val + " is not an object");

    return Object(val);
}

function iteratorMethod(obj) {

    // TODO:  What about typeof === "string"?
    if (!obj || typeof obj !== "object")
        return null;

    var m = obj[Symbol.iterator];

    // Generator iterators in Node 0.11.13 do not have a [Symbol.iterator] method
    if (!m && typeof obj.next === "function" && typeof obj.throw === "function")
        return function() { return this };

    return m;
}

function assertThis(val, name) {

    if (val == null)
        throw new TypeError(name + " called on null or undefined");
}

// === Symbols ===

var symbolCounter = 0,
    global = _esdown.global;

function fakeSymbol() {

    return "__$" + Math.floor(Math.random() * 1e9) + "$" + (++symbolCounter) + "$__";
}

if (!global.Symbol)
    global.Symbol = fakeSymbol;

polyfill(Symbol, {

    iterator: Symbol("iterator"),

    // Experimental async iterator support
    asyncIterator: Symbol("asyncIterator"),

    // Experimental VirtualPropertyExpression support
    referenceGet: Symbol("referenceGet"),
    referenceSet: Symbol("referenceSet"),
    referenceDelete: Symbol("referenceDelete")

});

// Experimental VirtualPropertyExpression support
polyfill(Function.prototype, _esdown.computed({

    __$0: function() { return this }
}, Symbol.referenceGet));

if (global.WeakMap) polyfill(WeakMap.prototype, _esdown.computed({

    __$0: function(base) {

        while (base !== null) {

            if (this.has(base))
                return this.get(base);

            base = Object.getPrototypeOf(base);
        }

        return void 0;
    },

    __$1: function(base, value) { this.set(base, value) },
    __$2: function(base, value) { this.delete(base, value) }

}, Symbol.referenceGet, Symbol.referenceSet, Symbol.referenceDelete));

// === Object ===

polyfill(Object, {

    is: sameValue,

    assign: function(target, source) {

        var error;

        target = toObject(target);

        for (var i = 1; i < arguments.length; ++i) {

            source = arguments[i];

            if (source == null) // null or undefined
                continue;

            try { Object.keys(source).forEach(function(key) { return target[key] = source[key]; }) }
            catch (x) { error = error || x }
        }

        if (error)
            throw error;

        return target;
    },

    setPrototypeOf: function(object, proto) {

        // Least effort attempt
        object.__proto__ = proto;
    }

});

// === Number ===

function isInteger(val) {

    return typeof val === "number" && isFinite(val) && toInteger(val) === val;
}

function epsilon() {

    // Calculate the difference between 1 and the smallest value greater than 1 that
    // is representable as a Number value

    var next, result;

    for (next = 1; 1 + next !== 1; next = next / 2)
        result = next;

    return result;
}

polyfill(Number, {

    EPSILON: epsilon(),
    MAX_SAFE_INTEGER: 9007199254740991,
    MIN_SAFE_INTEGER: -9007199254740991,

    parseInt: parseInt,
    parseFloat: parseFloat,
    isInteger: isInteger,
    isFinite: function(val) { return typeof val === "number" && isFinite(val) },
    isNaN: function(val) { return val !== val },
    isSafeInteger: function(val) { return isInteger(val) && Math.abs(val) <= Number.MAX_SAFE_INTEGER }

});

// === String ===

polyfill(String, {

    raw: function(callsite) { for (var args = [], __$0 = 1; __$0 < arguments.length; ++__$0) args.push(arguments[__$0]); 

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
    },

    fromCodePoint: function() { for (var points = [], __$0 = 0; __$0 < arguments.length; ++__$0) points.push(arguments[__$0]); 

        var out = [];

        points.forEach(function(next) {

            next = Number(next);

            if (!sameValue(next, toInteger(next)) || next < 0 || next > 0x10ffff)
                throw new RangeError("Invalid code point " + next);

            if (next < 0x10000) {

                out.push(String.fromCharCode(next));

            } else {

                next -= 0x10000;
                out.push(String.fromCharCode((next >> 10) + 0xD800));
                out.push(String.fromCharCode((next % 0x400) + 0xDC00));
            }
        });

        return out.join("");
    }

});

// Repeat a string by "squaring"
function repeat(s, n) {

    if (n < 1) return "";
    if (n % 2) return repeat(s, n - 1) + s;
    var half = repeat(s, n / 2);
    return half + half;
}

var StringIterator = _esdown.class(function(__super) { return _esdown.computed({

    constructor: function StringIterator(string) {

        this.string = string;
        this.current = 0;
    },

    next: function() {

        var s = this.string,
            i = this.current,
            len = s.length;

        if (i >= len) {

            this.current = Infinity;
            return { value: void 0, done: true };
        }

        var c = s.charCodeAt(i),
            chars = 1;

        if (c >= 0xD800 && c <= 0xDBFF && i + 1 < s.length) {

            c = s.charCodeAt(i + 1);
            chars = (c < 0xDC00 || c > 0xDFFF) ? 1 : 2;
        }

        this.current += chars;

        return { value: s.slice(i, this.current), done: false };
    },

    __$0: function() { return this }

}, Symbol.iterator) });

polyfill(String.prototype, _esdown.computed({

    repeat: function(count) {

        assertThis(this, "String.prototype.repeat");

        var string = String(this);

        count = toInteger(count);

        if (count < 0 || count === Infinity)
            throw new RangeError("Invalid count value");

        return repeat(string, count);
    },

    startsWith: function(search) {

        assertThis(this, "String.prototype.startsWith");

        if (isRegExp(search))
            throw new TypeError("First argument to String.prototype.startsWith must not be a regular expression");

        var string = String(this);

        search = String(search);

        var pos = arguments.length > 1 ? arguments[1] : undefined,
            start = Math.max(toInteger(pos), 0);

        return string.slice(start, start + search.length) === search;
    },

    endsWith: function(search) {

        assertThis(this, "String.prototype.endsWith");

        if (isRegExp(search))
            throw new TypeError("First argument to String.prototype.endsWith must not be a regular expression");

        var string = String(this);

        search = String(search);

        var len = string.length,
            arg = arguments.length > 1 ? arguments[1] : undefined,
            pos = arg === undefined ? len : toInteger(arg),
            end = Math.min(Math.max(pos, 0), len);

        return string.slice(end - search.length, end) === search;
    },

    contains: function(search) {

        assertThis(this, "String.prototype.contains");

        var string = String(this),
            pos = arguments.length > 1 ? arguments[1] : undefined;

        // Somehow this trick makes method 100% compat with the spec
        return string.indexOf(search, pos) !== -1;
    },

    codePointAt: function(pos) {

        assertThis(this, "String.prototype.codePointAt");

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

    __$0: function() {

        assertThis(this, "String.prototype[Symbol.iterator]");
        return new StringIterator(this);
    }

}, Symbol.iterator));

// === Array ===

var ArrayIterator = _esdown.class(function(__super) { return _esdown.computed({

    constructor: function ArrayIterator(array, kind) {

        this.array = array;
        this.current = 0;
        this.kind = kind;
    },

    next: function() {

        var length = toLength(this.array.length),
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

polyfill(Array, {

    from: function(list) {

        list = toObject(list);

        var ctor = typeof this === "function" ? this : Array, // TODO: Always use "this"?
            map = arguments[1],
            thisArg = arguments[2],
            i = 0,
            out;

        if (map !== void 0 && typeof map !== "function")
            throw new TypeError(map + " is not a function");

        var getIter = iteratorMethod(list);

        if (getIter) {

            var iter = getIter.call(list),
                result;

            out = new ctor;

            while (result = iter.next(), !result.done) {

                out[i++] = map ? map.call(thisArg, result.value, i) : result.value;
                out.length = i;
            }

        } else {

            var len = toLength(list.length);

            out = new ctor(len);

            for (; i < len; ++i)
                out[i] = map ? map.call(thisArg, list[i], i) : list[i];

            out.length = len;
        }

        return out;
    },

    of: function() { for (var items = [], __$0 = 0; __$0 < arguments.length; ++__$0) items.push(arguments[__$0]); 

        var ctor = typeof this === "function" ? this : Array; // TODO: Always use "this"?

        if (ctor === Array)
            return items;

        var len = items.length,
            out = new ctor(len);

        for (var i = 0; i < len; ++i)
            out[i] = items[i];

        out.length = len;

        return out;
    }

});

function arrayFind(obj, pred, thisArg, type) {

    var len = toLength(obj.length),
        val;

    if (typeof pred !== "function")
        throw new TypeError(pred + " is not a function");

    for (var i = 0; i < len; ++i) {

        val = obj[i];

        if (pred.call(thisArg, val, i, obj))
            return type === "value" ? val : i;
    }

    return type === "value" ? void 0 : -1;
}

polyfill(Array.prototype, _esdown.computed({

    copyWithin: function(target, start) {

        var obj = toObject(this),
            len = toLength(obj.length),
            end = arguments[2];

        target = toInteger(target);
        start = toInteger(start);

        var to = target < 0 ? Math.max(len + target, 0) : Math.min(target, len),
            from = start < 0 ? Math.max(len + start, 0) : Math.min(start, len);

        end = end !== void 0 ? toInteger(end) : len;
        end = end < 0 ? Math.max(len + end, 0) : Math.min(end, len);

        var count = Math.min(end - from, len - to),
            dir = 1;

        if (from < to && to < from + count) {

            dir = -1;
            from += count - 1;
            to += count - 1;
        }

        for (; count > 0; --count) {

            if (from in obj) obj[to] = obj[from];
            else delete obj[to];

            from += dir;
            to += dir;
        }

        return obj;
    },

    fill: function(value) {

        var obj = toObject(this),
            len = toLength(obj.length),
            start = toInteger(arguments[1]),
            pos = start < 0 ? Math.max(len + start, 0) : Math.min(start, len),
            end = arguments.length > 2 ? toInteger(arguments[2]) : len;

        end = end < 0 ? Math.max(len + end, 0) : Math.min(end, len);

        for (; pos < end; ++pos)
            obj[pos] = value;

        return obj;
    },

    find: function(pred) {

        return arrayFind(toObject(this), pred, arguments[1], "value");
    },

    findIndex: function(pred) {

        return arrayFind(toObject(this), pred, arguments[1], "index");
    },

    values: function() { return new ArrayIterator(this, "values") },

    entries: function() { return new ArrayIterator(this, "entries") },

    keys: function() { return new ArrayIterator(this, "keys") },

    __$0: function() { return this.values() }

}, Symbol.iterator));


}).call(this);

(function() {

var global = _esdown.global,
    ORIGIN = {},
    REMOVED = {};

var MapNode = _esdown.class(function(__super) { return {

    constructor: function MapNode(key, val) {

        this.key = key;
        this.value = val;
        this.prev = this;
        this.next = this;
    },

    insert: function(next) {

        this.next = next;
        this.prev = next.prev;
        this.prev.next = this;
        this.next.prev = this;
    },

    remove: function() {

        this.prev.next = this.next;
        this.next.prev = this.prev;
        this.key = REMOVED;
    }

} });

var MapIterator = _esdown.class(function(__super) { return _esdown.computed({

    constructor: function MapIterator(node, kind) {

        this.current = node;
        this.kind = kind;
    },

    next: function() {

        var node = this.current;

        while (node.key === REMOVED)
            node = this.current = this.current.next;

        if (node.key === ORIGIN)
            return { value: void 0, done: true };

        this.current = this.current.next;

        switch (this.kind) {

            case "values":
                return { value: node.value, done: false };

            case "entries":
                return { value: [ node.key, node.value ], done: false };

            default:
                return { value: node.key, done: false };
        }
    },

    __$0: function() { return this }
}, Symbol.iterator) });

function hashKey(key) {

    switch (typeof key) {

        case "string": return "$" + key;
        case "number": return String(key);
    }

    throw new TypeError("Map and Set keys must be strings or numbers in esdown");
}

var Map = _esdown.class(function(__super) { return _esdown.computed({

    constructor: function Map() {

        if (arguments.length > 0)
            throw new Error("Arguments to Map constructor are not supported in esdown");

        this._index = {};
        this._origin = new MapNode(ORIGIN);
    },

    clear: function() {

        for (var node = this._origin.next; node !== this._origin; node = node.next)
            node.key = REMOVED;

        this._index = {};
        this._origin = new MapNode(ORIGIN);
    },

    delete: function(key) {

        var h = hashKey(key),
            node = this._index[h];

        if (node) {

            node.remove();
            delete this._index[h];
            return true;
        }

        return false;
    },

    forEach: function(fn) {

        var thisArg = arguments[1];

        if (typeof fn !== "function")
            throw new TypeError(fn + " is not a function");

        for (var node = this._origin.next; node.key !== ORIGIN; node = node.next)
            if (node.key !== REMOVED)
                fn.call(thisArg, node.value, node.key, this);
    },

    get: function(key) {

        var h = hashKey(key),
            node = this._index[h];

        return node ? node.value : void 0;
    },

    has: function(key) {

        return hashKey(key) in this._index;
    },

    set: function(key, val) {

        var h = hashKey(key),
            node = this._index[h];

        if (node) {

            node.value = val;
            return;
        }

        node = new MapNode(key, val);

        this._index[h] = node;
        node.insert(this._origin);
    },

    get size() {

        return Object.keys(this._index).length;
    },

    keys: function() { return new MapIterator(this._origin.next, "keys") },
    values: function() { return new MapIterator(this._origin.next, "values") },
    entries: function() { return new MapIterator(this._origin.next, "entries") },

    __$0: function() { return new MapIterator(this._origin.next, "entries") }

}, Symbol.iterator) });

var mapSet = Map.prototype.set;

var Set = _esdown.class(function(__super) { return _esdown.computed({

    constructor: function Set() {

        if (arguments.length > 0)
            throw new Error("Arguments to Set constructor are not supported in esdown");

        this._index = {};
        this._origin = new MapNode(ORIGIN);
    },

    add: function(key) { return mapSet.call(this, key, key) },

    __$0: function() { return new MapIterator(this._origin.next, "entries") }

}, Symbol.iterator) });

// Copy shared prototype members to Set
["clear", "delete", "forEach", "has", "size", "keys", "values", "entries"].forEach(function(k) {

    var d = Object.getOwnPropertyDescriptor(Map.prototype, k);
    Object.defineProperty(Set.prototype, k, d);
});

if (!global.Map || !global.Map.prototype.entries) {

    global.Map = Map;
    global.Set = Set;
}


}).call(this);

(function() {

(function() { "use strict";

// Find global variable and exit if Promise is defined on it

var Global = (function() {
    if (typeof window !== "undefined" && window && window.window === window)
        return window;
    if (typeof global !== "undefined" && global && global.global === global)
        return global;
    throw new Error("Unable to determine global object");
})();

if (typeof Global.Promise === "function")
    return;

// Create an efficient microtask queueing mechanism

var runLater = (function() {
    // Node
    if (Global.process && typeof process.version === "string") {
        return Global.setImmediate ?
            function(fn) { setImmediate(fn); } :
            function(fn) { process.nextTick(fn); };
    }

    // Newish Browsers
    var Observer = Global.MutationObserver || Global.WebKitMutationObserver;

    if (Observer) {
        var div = document.createElement("div"),
            queuedFn = void 0;

        var observer = new Observer(function() {
            var fn = queuedFn;
            queuedFn = void 0;
            fn();
        });

        observer.observe(div, { attributes: true });

        return function(fn) {
            if (queuedFn !== void 0)
                throw new Error("Only one function can be queued at a time");
            queuedFn = fn;
            div.classList.toggle("x");
        };
    }

    // Fallback
    return function(fn) { setTimeout(fn, 0); };
})();

var EnqueueMicrotask = (function() {
    var queue = null;

    function flush() {
        var q = queue;
        queue = null;
        for (var i = 0; i < q.length; ++i)
            q[i]();
    }

    return function PromiseEnqueueMicrotask(fn) {
        // fn must not throw
        if (!queue) {
            queue = [];
            runLater(flush);
        }
        queue.push(fn);
    };
})();

// Mock V8 internal functions and vars

function SET_PRIVATE(obj, prop, val) { obj[prop] = val; }
function GET_PRIVATE(obj, prop) { return obj[prop]; }
function IS_SPEC_FUNCTION(obj) { return typeof obj === "function"; }
function IS_SPEC_OBJECT(obj) { return obj === Object(obj); }
function HAS_DEFINED_PRIVATE(obj, prop) { return prop in obj; }
function IS_UNDEFINED(x) { return x === void 0; }
function MakeTypeError(msg) { return new TypeError(msg); }

// In IE8 Object.defineProperty only works on DOM nodes, and defineProperties does not exist
var _defineProperty = Object.defineProperties && Object.defineProperty;

function AddNamedProperty(target, name, value) {
    if (!_defineProperty) {
        target[name] = value;
        return;
    }

    _defineProperty(target, name, {
        configurable: true,
        writable: true,
        enumerable: false,
        value: value
    });
}

function InstallFunctions(target, attr, list) {
    for (var i = 0; i < list.length; i += 2)
        AddNamedProperty(target, list[i], list[i + 1]);
}

var IsArray = Array.isArray || (function(obj) {
    var str = Object.prototype.toString;
    return function(obj) { return str.call(obj) === "[object Array]" };
})();

var UNDEFINED, DONT_ENUM, InternalArray = Array;

// V8 Implementation

var IsPromise;
var PromiseCreate;
var PromiseResolve;
var PromiseReject;
var PromiseChain;
var PromiseCatch;
var PromiseThen;

// Status values: 0 = pending, +1 = resolved, -1 = rejected
var promiseStatus = "Promise#status";
var promiseValue = "Promise#value";
var promiseOnResolve = "Promise#onResolve";
var promiseOnReject = "Promise#onReject";
var promiseRaw = {};
var promiseHasHandler = "Promise#hasHandler";
var lastMicrotaskId = 0;

var $Promise = function Promise(resolver) {
    if (resolver === promiseRaw) return;
    if (!IS_SPEC_FUNCTION(resolver))
      throw MakeTypeError('resolver_not_a_function', [resolver]);
    var promise = PromiseInit(this);
    try {
        resolver(function(x) { PromiseResolve(promise, x) },
                 function(r) { PromiseReject(promise, r) });
    } catch (e) {
        PromiseReject(promise, e);
    }
}

// Core functionality.

function PromiseSet(promise, status, value, onResolve, onReject) {
    SET_PRIVATE(promise, promiseStatus, status);
    SET_PRIVATE(promise, promiseValue, value);
    SET_PRIVATE(promise, promiseOnResolve, onResolve);
    SET_PRIVATE(promise, promiseOnReject, onReject);
    return promise;
}

function PromiseInit(promise) {
    return PromiseSet(promise, 0, UNDEFINED, new InternalArray, new InternalArray);
}

function PromiseDone(promise, status, value, promiseQueue) {
    if (GET_PRIVATE(promise, promiseStatus) === 0) {
        PromiseEnqueue(value, GET_PRIVATE(promise, promiseQueue), status);
        PromiseSet(promise, status, value);
    }
}

function PromiseCoerce(constructor, x) {
    if (!IsPromise(x) && IS_SPEC_OBJECT(x)) {
        var then;
        try {
            then = x.then;
        } catch(r) {
            return PromiseRejected.call(constructor, r);
        }
        if (IS_SPEC_FUNCTION(then)) {
            var deferred = PromiseDeferred.call(constructor);
            try {
                then.call(x, deferred.resolve, deferred.reject);
            } catch(r) {
                deferred.reject(r);
            }
            return deferred.promise;
        }
    }
    return x;
}

function PromiseHandle(value, handler, deferred) {
    try {
        var result = handler(value);
        if (result === deferred.promise)
            throw MakeTypeError('promise_cyclic', [result]);
        else if (IsPromise(result))
            PromiseChain.call(result, deferred.resolve, deferred.reject);
        else
            deferred.resolve(result);
    } catch (exception) {
        try { deferred.reject(exception) } catch (e) { }
    }
}

function PromiseEnqueue(value, tasks, status) {
    EnqueueMicrotask(function() {
        for (var i = 0; i < tasks.length; i += 2)
            PromiseHandle(value, tasks[i], tasks[i + 1]);
    });
}

function PromiseIdResolveHandler(x) { return x }
function PromiseIdRejectHandler(r) { throw r }

function PromiseNopResolver() {}

// -------------------------------------------------------------------
// Define exported functions.

// For bootstrapper.

IsPromise = function IsPromise(x) {
    return IS_SPEC_OBJECT(x) && HAS_DEFINED_PRIVATE(x, promiseStatus);
};

PromiseCreate = function PromiseCreate() {
    return new $Promise(PromiseNopResolver);
};

PromiseResolve = function PromiseResolve(promise, x) {
    PromiseDone(promise, +1, x, promiseOnResolve);
};

PromiseReject = function PromiseReject(promise, r) {
    PromiseDone(promise, -1, r, promiseOnReject);
};

// Convenience.

function PromiseDeferred() {
    if (this === $Promise) {
        // Optimized case, avoid extra closure.
        var promise = PromiseInit(new $Promise(promiseRaw));
        return {
            promise: promise,
            resolve: function(x) { PromiseResolve(promise, x) },
            reject: function(r) { PromiseReject(promise, r) }
        };
    } else {
        var result = {};
        result.promise = new this(function(resolve, reject) {
            result.resolve = resolve;
            result.reject = reject;
        });
        return result;
    }
}

function PromiseResolved(x) {
    if (this === $Promise) {
        // Optimized case, avoid extra closure.
        return PromiseSet(new $Promise(promiseRaw), +1, x);
    } else {
        return new this(function(resolve, reject) { resolve(x) });
    }
}

function PromiseRejected(r) {
    var promise;
    if (this === $Promise) {
        // Optimized case, avoid extra closure.
        promise = PromiseSet(new $Promise(promiseRaw), -1, r);
    } else {
        promise = new this(function(resolve, reject) { reject(r) });
    }
    return promise;
}

// Simple chaining.

PromiseChain = function PromiseChain(onResolve, onReject) {
    onResolve = IS_UNDEFINED(onResolve) ? PromiseIdResolveHandler : onResolve;
    onReject = IS_UNDEFINED(onReject) ? PromiseIdRejectHandler : onReject;
    var deferred = PromiseDeferred.call(this.constructor);
    switch (GET_PRIVATE(this, promiseStatus)) {
        case UNDEFINED:
            throw MakeTypeError('not_a_promise', [this]);
        case 0:  // Pending
            GET_PRIVATE(this, promiseOnResolve).push(onResolve, deferred);
            GET_PRIVATE(this, promiseOnReject).push(onReject, deferred);
            break;
        case +1:  // Resolved
            PromiseEnqueue(GET_PRIVATE(this, promiseValue), [onResolve, deferred], +1);
            break;
        case -1:  // Rejected
            PromiseEnqueue(GET_PRIVATE(this, promiseValue), [onReject, deferred], -1);
            break;
    }
    // Mark this promise as having handler.
    SET_PRIVATE(this, promiseHasHandler, true);
    return deferred.promise;
}

PromiseCatch = function PromiseCatch(onReject) {
    return this.then(UNDEFINED, onReject);
}

// Multi-unwrapped chaining with thenable coercion.

PromiseThen = function PromiseThen(onResolve, onReject) {
    onResolve = IS_SPEC_FUNCTION(onResolve) ? onResolve : PromiseIdResolveHandler;
    onReject = IS_SPEC_FUNCTION(onReject) ? onReject : PromiseIdRejectHandler;
    var that = this;
    var constructor = this.constructor;
    return PromiseChain.call(
        this,
        function(x) {
            x = PromiseCoerce(constructor, x);
            return x === that ? onReject(MakeTypeError('promise_cyclic', [x])) :
                IsPromise(x) ? x.then(onResolve, onReject) :
                onResolve(x);
        },
        onReject);
}

// Combinators.

function PromiseCast(x) {
    return IsPromise(x) ? x : new this(function(resolve) { resolve(x) });
}

function PromiseAll(values) {
    var deferred = PromiseDeferred.call(this);
    var resolutions = [];
    if (!IsArray(values)) {
        deferred.reject(MakeTypeError('invalid_argument'));
        return deferred.promise;
    }
    try {
        var count = values.length;
        if (count === 0) {
            deferred.resolve(resolutions);
        } else {
            for (var i = 0; i < values.length; ++i) {
                this.resolve(values[i]).then(
                    (function() {
                        // Nested scope to get closure over current i (and avoid .bind).
                        var i_captured = i;
                        return function(x) {
                            resolutions[i_captured] = x;
                            if (--count === 0) deferred.resolve(resolutions);
                        };
                    })(),
                    function(r) { deferred.reject(r) });
            }
        }
    } catch (e) {
        deferred.reject(e);
    }
    return deferred.promise;
}

function PromiseOne(values) {
    var deferred = PromiseDeferred.call(this);
    if (!IsArray(values)) {
        deferred.reject(MakeTypeError('invalid_argument'));
        return deferred.promise;
    }
    try {
        for (var i = 0; i < values.length; ++i) {
            this.resolve(values[i]).then(
                function(x) { deferred.resolve(x) },
                function(r) { deferred.reject(r) });
        }
    } catch (e) {
        deferred.reject(e);
    }
    return deferred.promise;
}

// -------------------------------------------------------------------
// Install exported functions.

AddNamedProperty(Global, 'Promise', $Promise, DONT_ENUM);

InstallFunctions($Promise, DONT_ENUM, [
    "defer", PromiseDeferred,
    "accept", PromiseResolved,
    "reject", PromiseRejected,
    "all", PromiseAll,
    "race", PromiseOne,
    "resolve", PromiseCast
]);

InstallFunctions($Promise.prototype, DONT_ENUM, [
    "chain", PromiseChain,
    "then", PromiseThen,
    "catch", PromiseCatch
]);

})();


}).call(this);



var _M2 = __load("fs", 1), _M3 = __load("path", 1), _M18 = {}, _M19 = {}, _M20 = {}, _M9 = {}, _M4 = {}, _M5 = {}, _M10 = __load("repl", 1), _M11 = __load("vm", 1), _M12 = __load("util", 1), _M23 = {}, _M29 = {}, _M28 = {}, _M24 = {}, _M25 = {}, _M27 = {}, _M26 = {}, _M22 = {}, _M21 = {}, _M13 = {}, _M17 = {}, _M16 = {}, _M15 = {}, _M8 = {}, _M14 = {}, _M6 = {}, _M7 = {}, _M1 = exports;

(function(exports) {

var HAS = Object.prototype.hasOwnProperty;

function raise(x) {

    x.name = "CommandError";
    throw x;
}

function has(obj, name) {

    return HAS.call(obj, name);
}

function parse(argv, params) {

    if (!params)
        return argv.slice(0);

    var pos = Object.keys(params),
        values = {},
        shorts = {},
        required = [],
        list = [values],
        param,
        value,
        name,
        i,
        a;

    // Create short-to-long mapping
    pos.forEach(function(name) {

        var p = params[name];

        if (p.short)
            shorts[p.short] = name;

        if (p.required)
            required.push(name);
    });

    // For each command line arg...
    for (i = 0; i < argv.length; ++i) {

        a = argv[i];
        param = null;
        value = null;
        name = "";

        if (a[0] === "-") {

            if (a.slice(0, 2) === "--") {

                // Long named parameter
                name = a.slice(2);
                param = has(params, name) ? params[name] : null;

            } else {

                // Short named parameter
                name = a.slice(1);
                name = has(shorts, name) ? shorts[name] : "";
                param = has(params, name) ? params[name] : null;
            }

            // Verify parameter exists
            if (!param)
                raise(new Error("Invalid command line option: " + a));

            if (param.flag) {

                value = true;

            } else {

                // Get parameter value
                value = argv[++i] || "";

                if (typeof value !== "string" || value[0] === "-")
                    raise(new Error("No value provided for option " + a));
            }

        } else {

            // Positional parameter
            do {

                name = pos.length > 0 ? pos.shift() : "";
                param = name ? params[name] : null;

            } while (param && !param.positional);;

            value = a;
        }

        if (param)
            values[name] = value;
        else
            list.push(value);
    }

    required.forEach(function(name) {

        if (values[name] === void 0)
            raise(new Error("Missing required option: --" + name));
    });

    return list;
}

var ConsoleCommand = _esdown.class(function(__super) { return {

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

        if (name && has(this.commands, name)) {

            cmd = this.commands[name];
            args = args.slice(1);
        }

        if (!cmd)
            raise(new Error("Invalid command"));

        return cmd.execute.apply(cmd, parse(args, cmd.params));
    }

} });

exports.ConsoleCommand = ConsoleCommand;


}).call(this, _M18);

(function(exports) {


var ConsoleIO = _esdown.class(function(__super) { return {

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
    
        return new Promise(function(resolve) {
        
            var listener = function(data) {
            
                resolve(data);
                __this._inStream.removeListener("data", listener);
                __this._inStream.pause();
            };
            
            __this._inStream.resume();
            __this._inStream.on("data", listener);
        });
    },
    
    writeLine: function(msg) {
    
        console.log(msg);
    },
    
    write: function(msg) {
    
        process.stdout.write(msg);
    }
    
} });

exports.ConsoleIO = ConsoleIO;


}).call(this, _M19);

(function(exports) {

var ConsoleStyle = {

    green: function(msg) { return "\x1B[32m" + (msg) + "\x1B[39m" },

    red: function(msg) { return "\x1B[31m" + (msg) + "\x1B[39m" },

    gray: function(msg) { return "\x1B[90m" + (msg) + "\x1B[39m" },

    bold: function(msg) { return "\x1B[1m" + (msg) + "\x1B[22m" },

};

exports.ConsoleStyle = ConsoleStyle;


}).call(this, _M20);

(function(exports) {

Object.keys(_M18).forEach(function(k) { exports[k] = _M18[k]; });
Object.keys(_M19).forEach(function(k) { exports[k] = _M19[k]; });
Object.keys(_M20).forEach(function(k) { exports[k] = _M20[k]; });


}).call(this, _M9);

(function(exports) {

Object.keys(_M9).forEach(function(k) { exports[k] = _M9[k]; });


}).call(this, _M4);

(function(exports) {

var FS = _M2;

// Wraps a standard Node async function with a promise
// generating function
function wrap(fn) {

	return function() { for (var args = [], __$0 = 0; __$0 < arguments.length; ++__$0) args.push(arguments[__$0]); 

		return new Promise(function(resolve, reject) {

            args.push(function(err, data) {

                if (err) reject(err);
                else resolve(data);
            });

            fn.apply(null, args);
        });
	};
}

function exists(path) {

    return new Promise(function(resolve) {

        FS.exists(path, function(result) { return resolve(result); });
    });
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


}).call(this, _M5);

(function(exports) {

/*

NOTE: We forego using classes and class-based inheritance for the following reasons:

1)  super() is currently slow when using ES6 transpilers.
2)  Using object literal methods allows us to easily iterate over all AST nodes
    from within this module.

*/

var AST = {

    Node: function(type, start, end) {

        this.type = type;
        this.start = start;
        this.end = end;
    },

    Identifier: function(value, context, start, end) {

        this.type = "Identifier";
        this.start = start;
        this.end = end;
        this.value = value;
        this.context = context;
    },

    NumberLiteral: function(value, start, end) {

        this.type = "NumberLiteral";
        this.start = start;
        this.end = end;
        this.value = value;
    },

    StringLiteral: function(value, start, end) {

        this.type = "StringLiteral";
        this.start = start;
        this.end = end;
        this.value = value;
    },

    TemplatePart: function(value, raw, isEnd, start, end) {

        this.type = "TemplatePart";
        this.start = start;
        this.end = end;
        this.value = value;
        this.raw = raw;
        this.templateEnd = isEnd;
    },

    RegularExpression: function(value, flags, start, end) {

        this.type = "RegularExpression";
        this.start = start;
        this.end = end;
        this.value = value;
        this.flags = flags;
    },

    BooleanLiteral: function(value, start, end) {

        this.type = "BooleanLiteral";
        this.start = start;
        this.end = end;
        this.value = value;
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
        this.statements = statements;
    },

    Module: function(statements, start, end) {

        this.type = "Module";
        this.start = start;
        this.end = end;
        this.statements = statements;
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
        this.expressions = list;
    },

    AssignmentExpression: function(op, left, right, start, end) {

        this.type = "AssignmentExpression";
        this.start = start;
        this.end = end;
        this.operator = op;
        this.left = left;
        this.right = right;
    },

    SpreadExpression: function(expr, start, end) {

        this.type = "SpreadExpression";
        this.start = start;
        this.end = end;
        this.expression = expr;
    },

    YieldExpression: function(expr, delegate, start, end) {

        this.type = "YieldExpression";
        this.start = start;
        this.end = end;
        this.delegate = delegate;
        this.expression = expr;
    },

    ConditionalExpression: function(test, cons, alt, start, end) {

        this.type = "ConditionalExpression";
        this.start = start;
        this.end = end;
        this.test = test;
        this.consequent = cons;
        this.alternate = alt;
    },

    BinaryExpression: function(op, left, right, start, end) {

        this.type = "BinaryExpression";
        this.start = start;
        this.end = end;
        this.operator = op;
        this.left = left;
        this.right = right;
    },

    UpdateExpression: function(op, expr, prefix, start, end) {

        this.type = "UpdateExpression";
        this.start = start;
        this.end = end;
        this.operator = op;
        this.expression = expr
        this.prefix = prefix;
    },

    UnaryExpression: function(op, expr, start, end) {

        this.type = "UnaryExpression";
        this.start = start;
        this.end = end;
        this.operator = op;
        this.expression = expr
    },

    MemberExpression: function(obj, prop, computed, start, end) {

        this.type = "MemberExpression";
        this.start = start;
        this.end = end;
        this.object = obj
        this.property = prop
        this.computed = computed;
    },

    VirtualPropertyExpression: function(obj, prop, start, end) {

        this.type = "VirtualPropertyExpression";
        this.start = start;
        this.end = end;
        this.object = obj;
        this.property = prop;
    },

    CallExpression: function(callee, args, start, end) {

        this.type = "CallExpression";
        this.start = start;
        this.end = end;
        this.callee = callee
        this.arguments = args;
    },

    TaggedTemplateExpression: function(tag, template, start, end) {

        this.type = "TaggedTemplateExpression";
        this.start = start;
        this.end = end;
        this.tag = tag
        this.template = template;
    },

    NewExpression: function(callee, args, start, end) {

        this.type = "NewExpression";
        this.start = start;
        this.end = end;
        this.callee = callee;
        this.arguments = args;
    },

    ParenExpression: function(expr, start, end) {

        this.type = "ParenExpression";
        this.start = start;
        this.end = end;
        this.expression = expr;
    },

    ObjectLiteral: function(props, comma, start, end) {

        this.type = "ObjectLiteral";
        this.start = start;
        this.end = end;
        this.properties = props;
        this.trailingComma = comma;
    },

    ComputedPropertyName: function(expr, start, end) {

        this.type = "ComputedPropertyName";
        this.start = start;
        this.end = end;
        this.expression = expr;
    },

    PropertyDefinition: function(name, expr, start, end) {

        this.type = "PropertyDefinition";
        this.start = start;
        this.end = end;
        this.name = name;
        this.expression = expr;
    },

    ObjectPattern: function(props, comma, start, end) {

        this.type = "ObjectPattern";
        this.start = start;
        this.end = end;
        this.properties = props;
        this.trailingComma = comma;
    },

    PatternProperty: function(name, pattern, initializer, start, end) {

        this.type = "PatternProperty";
        this.start = start;
        this.end = end;
        this.name = name;
        this.pattern = pattern;
        this.initializer = initializer;
    },

    ArrayPattern: function(elements, comma, start, end) {

        this.type = "ArrayPattern";
        this.start = start;
        this.end = end;
        this.elements = elements;
        this.trailingComma = comma;
    },

    PatternElement: function(pattern, initializer, start, end) {

        this.type = "PatternElement";
        this.start = start;
        this.end = end;
        this.pattern = pattern;
        this.initializer = initializer;
    },

    PatternRestElement: function(pattern, start, end) {

        this.type = "PatternRestElement";
        this.start = start;
        this.end = end;
        this.pattern = pattern;
    },

    MethodDefinition: function(kind, name, params, body, start, end) {

        this.type = "MethodDefinition";
        this.start = start;
        this.end = end;
        this.kind = kind;
        this.name = name;
        this.params = params;
        this.body = body;
    },

    ArrayLiteral: function(elements, comma, start, end) {

        this.type = "ArrayLiteral";
        this.start = start;
        this.end = end;
        this.elements = elements;
        this.trailingComma = comma;
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

    ForOfStatement: function(async, left, right, body, start, end) {

        this.type = "ForOfStatement";
        this.async = async;
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

    DefaultExport: function(binding, start, end) {

        this.type = "DefaultExport";
        this.binding = binding;
        this.start = start;
        this.end = end;
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
    }

};

function isNode(x) {

    return x !== null && typeof x === "object" && typeof x.type === "string";
}

var NodeBase = _esdown.class(function(__super) { return {

    children: function() { var __this = this; 

        var list = [];

        Object.keys(this).forEach(function(k) {

            // Don't iterate over backlinks to parent node
            if (k === "parent")
                return;

            var value = __this[k];

            if (Array.isArray(value))
                value.forEach(function(x) { if (isNode(x)) list.push(x) });
            else if (isNode(value))
                list.push(value);
        });

        return list;
    }, constructor: function NodeBase() {}
} });

Object.keys(AST).forEach(function(k) { return AST[k].prototype = NodeBase.prototype; });

exports.AST = AST;


}).call(this, _M23);

(function(exports) {

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


exports.IDENTIFIER = IDENTIFIER;
exports.WHITESPACE = WHITESPACE;


}).call(this, _M29);

(function(exports) {

var IDENTIFIER = _M29.IDENTIFIER, WHITESPACE = _M29.WHITESPACE;

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

function codePointLength(code) {

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

function codePointString(code) {

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


exports.isIdentifierStart = isIdentifierStart;
exports.isIdentifierPart = isIdentifierPart;
exports.isWhitespace = isWhitespace;
exports.codePointLength = codePointLength;
exports.codePointAt = codePointAt;
exports.codePointString = codePointString;


}).call(this, _M28);

(function(exports) {

var isIdentifierStart = _M28.isIdentifierStart,
    isIdentifierPart = _M28.isIdentifierPart,
    isWhitespace = _M28.isWhitespace,
    codePointLength = _M28.codePointLength,
    codePointAt = _M28.codePointAt,
    codePointString = _M28.codePointString;





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

var strictReservedWord = new RegExp("^(?:" +
    "implements|private|public|interface|package|let|protected|static|yield" +
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
    "::|" +
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
    add("punctuator-char", "{[]();,?");
    add("punctuator", "<>+-*%&|^!~=:");
    add("dot", ".");
    add("slash", "/");
    add("rbrace", "}");
    add("zero", "0");
    add("string", "'\"");
    add("template", "`");
    add("identifier", "$_\\");

    return table;

    function add(type, string) {

        string.split("").forEach(function(c) { return table[c.charCodeAt(0)] = type; });
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
        case ":":
            return true;
    }

    return false;
}

// Returns true if the specified string is a reserved word
function isReservedWord(word) {

    return reservedWord.test(word);
}

// Returns true if the specified string is a strict mode reserved word
function isStrictReservedWord(word) {

    return strictReservedWord.test(word);
}

var Scanner = _esdown.class(function(__super) { return {

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

        return codePointAt(this.input, this.offset);
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
            val = codePointString(cp);

        return val === "" ? null : val;
    },

    readIdentifierEscape: function(startChar) {

        this.offset++;

        if (this.readChar() !== "u")
            return null;

        var cp = this.readUnicodeEscapeValue();

        if (startChar) {

            if (!isIdentifierStart(cp))
                return null;

        } else {

            if (!isIdentifierPart(cp))
                return null;
        }

        return codePointString(cp);
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
            return !isIdentifierStart(this.peekCodePoint());

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
            if (isWhitespace(cp))
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
        if (isWhitespace(cp))
            return this.UnicodeWhitespace(cp);

        // Unicode identifier chars
        if (isIdentifierStart(cp))
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

        this.offset += codePointLength(cp);

        // General unicode whitespace
        while (isWhitespace(cp = this.peekCodePoint()))
            this.offset += codePointLength(cp);

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

                if (isIdentifierPart(code = this.peekCodePoint()))
                    this.offset += codePointLength(code);
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

            this.offset += codePointLength(code);

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

                if (isIdentifierPart(code = this.peekCodePoint()))
                    this.offset += codePointLength(code);
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

        if (context !== "name" && isReservedWord(val))
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

exports.isReservedWord = isReservedWord;
exports.isStrictReservedWord = isStrictReservedWord;
exports.Scanner = Scanner;


}).call(this, _M24);

(function(exports) {

var AST = _M23.AST;
var isReservedWord = _M24.isReservedWord;


var Transform = _esdown.class(function(__super) { return {

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

                    // Rest element must be in the last position and cannot be followed
                    // by a comma
                    if (i < elems.length - 1 || node.trailingComma)
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
    },

    transformIdentifier: function(node) {

        var value = node.value;

        if (isReservedWord(value))
            this.fail("Unexpected token " + value, node);

        this.checkIdentifier(node);
    },

    transformDefaultExport: function(node) {

        var toType = null;

        switch (node.type) {

            case "ClassExpression":
                if (node.identifier) toType = "ClassDeclaration";
                break;

            case "FunctionExpression":
                if (node.identifier) toType = "FunctionDeclaration";
                break;
        }

        if (toType) {

            node.type = toType;
            return true;
        }

        return false;
    }, constructor: function Transform() {}

} });


exports.Transform = Transform;


}).call(this, _M25);

(function(exports) {


var IntMap = _esdown.class(function(__super) { return {

    constructor: function IntMap() {
    
        this.obj = {};
    },
    
    get: function(key) {
    
        return this.obj["$" + key] | 0;
    },
    
    set: function(key, val) {
    
        this.obj["$" + key] = val | 0;
    }
    
} });


exports.IntMap = IntMap;


}).call(this, _M27);

(function(exports) {

var IntMap = _M27.IntMap;
var isStrictReservedWord = _M24.isStrictReservedWord;


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

var Validate = _esdown.class(function(__super) { return {

    // Validates an assignment target
    checkAssignmentTarget: function(node, simple) {

        switch (node.type) {

            case "Identifier":

                if (isPoisonIdent(node.value))
                    this.addStrictError("Cannot modify " + node.value + " in strict mode", node);

                return;

            case "MemberExpression":
            case "VirtualPropertyExpression":
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

        if (ident === "yield" && this.context.isGenerator)
            this.fail("yield cannot be an identifier inside of a generator function", node);
        else if (isStrictReservedWord(ident))
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

            // Throw if item is not a strict-mode-only error, or if the current
            // context is strict
            if (!item.strict || context.mode === "strict")
                this.fail(error, node);

            // Skip strict errors in sloppy mode
            if (context.mode === "sloppy")
                continue;

            // If the parent context is sloppy, then we ignore. If the parent context
            // is strict, then this context would also be known to be strict and
            // therefore handled above.

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

exports.Validate = Validate;


}).call(this, _M26);

(function(exports) {

var AST = _M23.AST;
var Scanner = _M24.Scanner;
var Transform = _M25.Transform;
var Validate = _M26.Validate;
var IntMap = _M27.IntMap;

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

    return value === "async";
}

// Returns true if the value is a generator function modifier keyword
function isGeneratorModifier(value) {

    return value === "async" || value === "";
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

var Context = _esdown.class(function(__super) { return {

    constructor: function Context(parent) {

        this.parent = parent;
        this.mode = "";
        this.isFunction = false;
        this.functionBody = false;
        this.isGenerator = false;
        this.isAsync = false;
        this.labelSet = new IntMap;
        this.switchDepth = 0;
        this.loopDepth = 0;
        this.invalidNodes = [];
    }
} });

var Options = _esdown.class(function(__super) { return {

    constructor: function Options(obj) {

        this.obj = obj || {};
    },

    get: function(key, def) {

        var v = this.obj[key];
        return v === void 0 ? def : v;
    }
} });

var Parser = _esdown.class(function(__super) { return {

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

    peekYield: function() {

        return this.context.functionBody &&
            this.context.isGenerator &&
            this.peekKeyword("yield");
    },

    peekAwait: function() {

        return this.context.functionBody &&
            this.context.isAsync &&
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

    pushContext: function() {

        var parent = this.context;

        this.context = new Context(parent);

        if (parent.mode === "strict")
            this.context.mode = "strict";
    },

    pushMaybeContext: function() {

        var parent = this.context;
        this.pushContext();
        this.context.isFunction = parent.isFunction;
        this.context.isGenerator = parent.isGenerator;
        this.context.isAsync = parent.isAsync;
        this.context.functionBody = parent.functionBody;
    },

    popContext: function(collapse) {

        var context = this.context,
            parent = context.parent;

        // If collapsing into parent context, copy invalid nodes into parent
        if (collapse)
            context.invalidNodes.forEach(function(node) { return parent.invalidNodes.push(node); });
        else
            this.checkInvalidNodes();

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

    setFunctionType: function(kind) {

        var c = this.context,
            a = false,
            g = false;

        switch (kind) {

            case "async": a = true; break;
            case "generator": g = true; break;
            case "async-generator": a = g = true; break;
        }

        c.isFunction = true;
        c.isAsync = a;
        c.isGenerator = g;
    },

    // === Top Level ===

    Script: function() {

        this.pushContext();

        var start = this.nodeStart(),
            statements = this.StatementList(true, false);

        this.popContext();

        return new AST.Script(statements, start, this.nodeEnd());
    },

    Module: function() {

        this.pushContext();
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

                case "::":

                    this.read();

                    expr = new AST.VirtualPropertyExpression(
                        expr,
                        this.Identifier(true),
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
            case "(": return this.ParenExpression();
            case "[": return this.ArrayLiteral();

            case "IDENTIFIER":

                value = keywordFromToken(token);
                next = this.peekTokenAt("div", 1);

                if (!next.newlineBefore) {

                    if (next.type === "=>") {

                        this.pushContext();
                        return this.ArrowFunctionHead("", this.BindingIdentifier(), start);

                    } else if (next.type === "function") {

                        return this.FunctionExpression();

                    } else if (next.type === "IDENTIFIER" && isFunctionModifier(value)) {

                        this.read();
                        this.pushContext();
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
            }
        }

        this.read("}");

        return new AST.ObjectLiteral(list, comma, start, this.nodeEnd());
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
                comma = true;
                list.push(null);

            } else {

                list.push(this.AssignmentExpression(false, true));
                comma = false;

                if (this.peek() !== "]") {

                    this.read(",");
                    comma = true;
                }
            }
        }

        this.read("]");

        return new AST.ArrayLiteral(list, comma, start, this.nodeEnd());
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
            async = false,
            test,
            step;

        if (label)
            this.setLoopLabel(label);

        this.read("for");

        if (this.context.isAsync && this.peekKeyword("async")) {

            this.read();
            async = true;
        }

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

        if (async || init && this.peekKeyword("of"))
            return this.ForOfStatement(async, init, start);

        if (init && this.peek() === "in")
            return this.ForInStatement(init, start);

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

    ForOfStatement: function(async, init, start) {

        this.checkForInit(init, "of");

        this.readKeyword("of");
        var expr = this.AssignmentExpression();
        this.read(")");

        this.context.loopDepth += 1;
        var statement = this.Statement();
        this.context.loopDepth -= 1;

        return new AST.ForOfStatement(
            async,
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

        if (isGeneratorModifier(kind) && this.peek() === "*") {

            this.read();
            kind = kind ? kind + "-generator" : "generator";
        }

        this.pushContext();
        this.setFunctionType(kind);

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

        if (isGeneratorModifier(kind) && this.peek() === "*") {

            this.read();
            kind = kind ? kind + "-generator" : "generator";
        }

        this.pushContext();
        this.setFunctionType(kind);

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

                    if (isGeneratorModifier(kind) && this.peek("name") === "*") {

                        this.read();
                        kind += "-generator";
                    }

                    name = this.PropertyName();
                }
            }
        }

        this.pushContext();
        this.setFunctionType(kind);

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
        this.setFunctionType(kind);

        // Transform and validate formal parameters
        var params = this.checkArrowParameters(formals);

        return new AST.ArrowFunctionHead(params, start, this.nodeEnd());
    },

    ArrowFunctionBody: function(head, noIn) {

        this.read("=>");

        var params = head.parameters,
            start = head.start,
            kind = this.context.isAsync ? "async" : "";

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
            list = [],
            node;

        this.pushContext();
        this.setStrict(true);
        this.read("{");

        while (this.peekUntil("}", "name"))
            list.push(node = this.ClassElement());

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

    ImportDeclaration: function() {

        var start = this.nodeStart(),
            ident,
            from;

        this.read("import");

        switch (this.peek()) {

            case "*":

                this.read();
                this.readKeyword("as");
                ident = this.BindingIdentifier();
                this.readKeyword("from");
                from = this.StringLiteral();
                this.Semicolon();

                return new AST.ModuleImport(ident, from, start, this.nodeEnd());

            case "IDENTIFIER":

                ident = this.BindingIdentifier();
                this.readKeyword("from");
                from = this.StringLiteral();
                this.Semicolon();

                return new AST.ImportDefaultDeclaration(ident, from, start, this.nodeEnd());

            case "STRING":

                from = this.StringLiteral();
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
        from = this.StringLiteral();
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
            decl;

        this.read("export");

        switch (this.peek()) {

            case "var":
            case "const":
                decl = this.VariableDeclaration(false);
                this.Semicolon();
                break;

            case "function":
                decl = this.FunctionDeclaration();
                break;

            case "class":
                decl = this.ClassDeclaration();
                break;

            case "default":
                decl = this.DefaultExport();
                break;

            case "IDENTIFIER":

                if (this.peekLet()) {

                    decl = this.VariableDeclaration(false);
                    this.Semicolon();
                    break;
                }

                if (this.peekFunctionModifier()) {

                    decl = this.FunctionDeclaration();
                    break;
                }

            default:
                decl = this.ExportsList();
                this.Semicolon();
                break;
        }

        return new AST.ExportDeclaration(decl, start, this.nodeEnd());
    },

    DefaultExport: function() {

        var start = this.nodeStart(),
            binding;

        this.read("default");

        switch (this.peek()) {

            case "class":
                binding = this.ClassExpression();
                break;

            case "function":
                binding = this.FunctionExpression();
                break;

            case "IDENTIFIER":

                if (this.peekFunctionModifier()) {

                    binding = this.FunctionExpression();
                    break;
                }

            default:
                binding = this.AssignmentExpression();
                break;
        }

        var isDecl = this.transformDefaultExport(binding);

        if (!isDecl)
            this.Semicolon();

        return new AST.DefaultExport(binding, start, this.nodeEnd());
    },

    ExportsList: function() { var __this = this; 

        var start = this.nodeStart(),
            list = null,
            from = null;

        if (this.peek() === "*") {

            this.read();
            this.readKeyword("from");
            from = this.StringLiteral();

        } else {

            list = [];

            this.read("{");

            while (this.peekUntil("}", "name")) {

                list.push(this.ExportSpecifier());

                if (this.peek() === ",")
                    this.read();
            }

            this.read("}");

            if (this.peekKeyword("from")) {

                this.read();
                from = this.StringLiteral();

            } else {

                // Transform identifier names to identifiers
                list.forEach(function(node) { return __this.transformIdentifier(node.local); });
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
    }, constructor: function Parser() {}

} });

// Add externally defined methods
Object.assign(Parser.prototype, Transform.prototype);
Object.assign(Parser.prototype, Validate.prototype);

exports.Parser = Parser;


}).call(this, _M22);

(function(exports) {

var Parser = _M22.Parser;
var AST = _M23.AST;

function parse(input, options) {

    return new Parser().parse(input, options);
}









exports.AST = AST;
exports.Parser = Parser;
exports.parse = parse;
exports.default = parse;


}).call(this, _M21);

(function(exports) {

Object.keys(_M21).forEach(function(k) { exports[k] = _M21[k]; });


}).call(this, _M13);

(function(exports) {

var Runtime = {};

Runtime.API = 

"function globalObject() {\n\
\n\
    try { return global.global } catch (x) {}\n\
    try { return window.window } catch (x) {}\n\
    return null;\n\
}\n\
\n\
var arraySlice = Array.prototype.slice,\n\
    hasOwn = Object.prototype.hasOwnProperty,\n\
    staticName = /^__static_/,\n\
    Global = globalObject();\n\
\n\
function toObject(val) {\n\
\n\
    if (val == null)\n\
        throw new TypeError(val + \" is not an object\");\n\
\n\
    return Object(val);\n\
}\n\
\n\
// Returns true if the object has the specified property in\n\
// its prototype chain\n\
function has(obj, name) {\n\
\n\
    for (; obj; obj = Object.getPrototypeOf(obj))\n\
        if (hasOwn.call(obj, name))\n\
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
// Installs methods on a prototype\n\
function defineMethods(to, from) {\n\
\n\
    forEachDesc(from, (name, desc) => {\n\
\n\
        if (typeof name !== \"string\" || !staticName.test(name))\n\
            Object.defineProperty(to, name, desc);\n\
    });\n\
}\n\
\n\
// Installs static methods on a constructor\n\
function defineStatic(to, from) {\n\
\n\
    forEachDesc(from, (name, desc) => {\n\
\n\
        if (typeof name === \"string\" &&\n\
            staticName.test(name) &&\n\
            typeof desc.value === \"object\" &&\n\
            desc.value) {\n\
\n\
            defineMethods(to, desc.value);\n\
        }\n\
    });\n\
}\n\
\n\
// Builds a class\n\
function buildClass(base, def) {\n\
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
        throw new TypeError;\n\
\n\
    // Generate the method collection, closing over \"__super\"\n\
    var proto = Object.create(parent),\n\
        props = def(parent, base || Function.prototype),\n\
        constructor = props.constructor;\n\
\n\
    if (!constructor)\n\
        throw new Error(\"No constructor specified\");\n\
\n\
    // Make constructor non-enumerable\n\
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
Global._esdown = {\n\
\n\
    version: \"0.9.1\",\n\
\n\
    global: Global,\n\
\n\
    class: buildClass,\n\
\n\
    // Support for iterator protocol\n\
    iter(obj) {\n\
\n\
        if (obj[Symbol.iterator] !== void 0)\n\
            return obj[Symbol.iterator]();\n\
\n\
        if (Array.isArray(obj))\n\
            return obj.values();\n\
\n\
        return obj;\n\
    },\n\
\n\
    asyncIter(obj) {\n\
\n\
        if (obj[Symbol.asyncIterator] !== void 0)\n\
            return obj[Symbol.asyncIterator]();\n\
\n\
        var iter = { [Symbol.asyncIterator]() { return this } },\n\
            inner = _esdown.iter(obj);\n\
\n\
        [\"next\", \"throw\", \"return\"].forEach(name => {\n\
\n\
            if (name in inner)\n\
                iter[name] = value => Promise.resolve(inner[name](value));\n\
        });\n\
\n\
        return iter;\n\
    },\n\
\n\
    // Support for computed property names\n\
    computed(obj) {\n\
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
    },\n\
\n\
    // Support for tagged templates\n\
    callSite(values, raw) {\n\
\n\
        values.raw = raw || values;\n\
        return values;\n\
    },\n\
\n\
    // Support for async functions\n\
    async(iterable) {\n\
\n\
        try {\n\
\n\
            var iter = _esdown.iter(iterable),\n\
                resolver,\n\
                promise;\n\
\n\
            promise = new Promise((resolve, reject) => resolver = { resolve, reject });\n\
            resume(\"next\", void 0);\n\
            return promise;\n\
\n\
        } catch (x) { return Promise.reject(x) }\n\
\n\
        function resume(type, value) {\n\
\n\
            if (!(type in iter)) {\n\
\n\
                resolver.reject(value);\n\
                return;\n\
            }\n\
\n\
            try {\n\
\n\
                var result = iter[type](value);\n\
\n\
                value = Promise.resolve(result.value);\n\
\n\
                if (result.done) value.then(resolver.resolve, resolver.reject);\n\
                else value.then(x => resume(\"next\", x), x => resume(\"throw\", x));\n\
\n\
            } catch (x) { resolver.reject(x) }\n\
        }\n\
    },\n\
\n\
    // Support for async generators\n\
    asyncGen(iterable) {\n\
\n\
        var iter = _esdown.iter(iterable),\n\
            state = \"paused\",\n\
            queue = [];\n\
\n\
        return {\n\
\n\
            next(val) { return enqueue(\"next\", val) },\n\
            throw(val) { return enqueue(\"throw\", val) },\n\
            return(val) { return enqueue(\"return\", val) },\n\
            [Symbol.asyncIterator]() { return this }\n\
        };\n\
\n\
        function enqueue(type, value) {\n\
\n\
            var resolve, reject;\n\
            var promise = new Promise((res, rej) => (resolve = res, reject = rej));\n\
\n\
            queue.push({ type, value, resolve, reject });\n\
\n\
            if (state === \"paused\")\n\
                next();\n\
\n\
            return promise;\n\
        }\n\
\n\
        function next() {\n\
\n\
            if (queue.length > 0) {\n\
\n\
                state = \"running\";\n\
                var first = queue[0];\n\
                resume(first.type, first.value);\n\
\n\
            } else {\n\
\n\
                state = \"paused\";\n\
            }\n\
        }\n\
\n\
        function resume(type, value) {\n\
\n\
            if (type === \"return\" && !(type in iter)) {\n\
\n\
                // If the generator does not support the \"return\" method, then\n\
                // emulate it (poorly) using throw\n\
                type = \"throw\";\n\
                value = { value, __return: true };\n\
            }\n\
\n\
            try {\n\
\n\
                var result = iter[type](value),\n\
                    value = result.value;\n\
\n\
                if (typeof value === \"object\" && \"_esdown_await\" in value) {\n\
\n\
                    if (result.done)\n\
                        throw new Error(\"Invalid async generator return\");\n\
\n\
                    Promise.resolve(value._esdown_await).then(\n\
                        x => resume(\"next\", x),\n\
                        x => resume(\"throw\", x));\n\
\n\
                    return;\n\
\n\
                } else {\n\
\n\
                    queue.shift().resolve(result);\n\
                }\n\
\n\
            } catch (x) {\n\
\n\
                if (x && x.__return === true)\n\
                    queue.shift().resolve({ value: x.value, done: true });\n\
                else\n\
                    queue.shift().reject(x);\n\
            }\n\
\n\
            next();\n\
        }\n\
    },\n\
\n\
    // Support for spread operations\n\
    spread() {\n\
\n\
        return {\n\
\n\
            a: [],\n\
\n\
            // Add items\n\
            s() {\n\
\n\
                for (var i = 0; i < arguments.length; ++i)\n\
                    this.a.push(arguments[i]);\n\
\n\
                return this;\n\
            },\n\
\n\
            // Add the contents of iterables\n\
            i(list) {\n\
\n\
                if (Array.isArray(list)) {\n\
\n\
                    this.a.push.apply(this.a, list);\n\
\n\
                } else {\n\
\n\
                    for (var item of list)\n\
                        this.a.push(item);\n\
                }\n\
\n\
                return this;\n\
            }\n\
\n\
        };\n\
    },\n\
\n\
    // Support for object destructuring\n\
    objd(obj) {\n\
\n\
        return toObject(obj);\n\
    },\n\
\n\
    // Support for array destructuring\n\
    arrayd(obj) {\n\
\n\
        if (Array.isArray(obj)) {\n\
\n\
            return {\n\
\n\
                at(skip, pos) { return obj[pos] },\n\
                rest(skip, pos) { return obj.slice(pos) }\n\
            };\n\
        }\n\
\n\
        var iter = _esdown.iter(toObject(obj));\n\
\n\
        return {\n\
\n\
            at(skip) {\n\
\n\
                var r;\n\
\n\
                while (skip--)\n\
                    r = iter.next();\n\
\n\
                return r.value;\n\
            },\n\
\n\
            rest(skip) {\n\
\n\
                var a = [], r;\n\
\n\
                while (--skip)\n\
                    r = iter.next();\n\
\n\
                while (r = iter.next(), !r.done)\n\
                    a.push(r.value);\n\
\n\
                return a;\n\
            }\n\
        };\n\
    }\n\
\n\
};\n\
";

Runtime.ES6 = 

"// === Polyfill Utilities ===\n\
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
function polyfill(obj, methods) {\n\
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
\n\
    });\n\
}\n\
\n\
\n\
// === Spec Helpers ===\n\
\n\
var sign = Math.sign || function(val) {\n\
\n\
    var n = +val;\n\
\n\
    if (n === 0 || Number.isNaN(n))\n\
        return n;\n\
\n\
    return n < 0 ? -1 : 1;\n\
};\n\
\n\
function toInteger(val) {\n\
\n\
    var n = +val;\n\
\n\
    return n !== n /* n is NaN */ ? 0 :\n\
        (n === 0 || !isFinite(n)) ? n :\n\
        sign(n) * Math.floor(Math.abs(n));\n\
}\n\
\n\
function toLength(val) {\n\
\n\
    var n = toInteger(val);\n\
    return n < 0 ? 0 : Math.min(n, Number.MAX_SAFE_INTEGER);\n\
}\n\
\n\
function sameValue(left, right) {\n\
\n\
    if (left === right)\n\
        return left !== 0 || 1 / left === 1 / right;\n\
\n\
    return left !== left && right !== right;\n\
}\n\
\n\
function isRegExp(val) {\n\
\n\
    return Object.prototype.toString.call(val) == \"[object RegExp]\";\n\
}\n\
\n\
function toObject(val) {\n\
\n\
    if (val == null)\n\
        throw new TypeError(val + \" is not an object\");\n\
\n\
    return Object(val);\n\
}\n\
\n\
function iteratorMethod(obj) {\n\
\n\
    // TODO:  What about typeof === \"string\"?\n\
    if (!obj || typeof obj !== \"object\")\n\
        return null;\n\
\n\
    var m = obj[Symbol.iterator];\n\
\n\
    // Generator iterators in Node 0.11.13 do not have a [Symbol.iterator] method\n\
    if (!m && typeof obj.next === \"function\" && typeof obj.throw === \"function\")\n\
        return function() { return this };\n\
\n\
    return m;\n\
}\n\
\n\
function assertThis(val, name) {\n\
\n\
    if (val == null)\n\
        throw new TypeError(name + \" called on null or undefined\");\n\
}\n\
\n\
// === Symbols ===\n\
\n\
var symbolCounter = 0,\n\
    global = _esdown.global;\n\
\n\
function fakeSymbol() {\n\
\n\
    return \"__$\" + Math.floor(Math.random() * 1e9) + \"$\" + (++symbolCounter) + \"$__\";\n\
}\n\
\n\
if (!global.Symbol)\n\
    global.Symbol = fakeSymbol;\n\
\n\
polyfill(Symbol, {\n\
\n\
    iterator: Symbol(\"iterator\"),\n\
\n\
    // Experimental async iterator support\n\
    asyncIterator: Symbol(\"asyncIterator\"),\n\
\n\
    // Experimental VirtualPropertyExpression support\n\
    referenceGet: Symbol(\"referenceGet\"),\n\
    referenceSet: Symbol(\"referenceSet\"),\n\
    referenceDelete: Symbol(\"referenceDelete\")\n\
\n\
});\n\
\n\
// Experimental VirtualPropertyExpression support\n\
polyfill(Function.prototype, {\n\
\n\
    [Symbol.referenceGet]() { return this }\n\
});\n\
\n\
if (global.WeakMap) polyfill(WeakMap.prototype, {\n\
\n\
    [Symbol.referenceGet](base) {\n\
\n\
        while (base !== null) {\n\
\n\
            if (this.has(base))\n\
                return this.get(base);\n\
\n\
            base = Object.getPrototypeOf(base);\n\
        }\n\
\n\
        return void 0;\n\
    },\n\
\n\
    [Symbol.referenceSet](base, value) { this.set(base, value) },\n\
    [Symbol.referenceDelete](base, value) { this.delete(base, value) }\n\
\n\
});\n\
\n\
// === Object ===\n\
\n\
polyfill(Object, {\n\
\n\
    is: sameValue,\n\
\n\
    assign(target, source) {\n\
\n\
        var error;\n\
\n\
        target = toObject(target);\n\
\n\
        for (var i = 1; i < arguments.length; ++i) {\n\
\n\
            source = arguments[i];\n\
\n\
            if (source == null) // null or undefined\n\
                continue;\n\
\n\
            try { Object.keys(source).forEach(key => target[key] = source[key]) }\n\
            catch (x) { error = error || x }\n\
        }\n\
\n\
        if (error)\n\
            throw error;\n\
\n\
        return target;\n\
    },\n\
\n\
    setPrototypeOf(object, proto) {\n\
\n\
        // Least effort attempt\n\
        object.__proto__ = proto;\n\
    }\n\
\n\
});\n\
\n\
// === Number ===\n\
\n\
function isInteger(val) {\n\
\n\
    return typeof val === \"number\" && isFinite(val) && toInteger(val) === val;\n\
}\n\
\n\
function epsilon() {\n\
\n\
    // Calculate the difference between 1 and the smallest value greater than 1 that\n\
    // is representable as a Number value\n\
\n\
    var next, result;\n\
\n\
    for (next = 1; 1 + next !== 1; next = next / 2)\n\
        result = next;\n\
\n\
    return result;\n\
}\n\
\n\
polyfill(Number, {\n\
\n\
    EPSILON: epsilon(),\n\
    MAX_SAFE_INTEGER: 9007199254740991,\n\
    MIN_SAFE_INTEGER: -9007199254740991,\n\
\n\
    parseInt: parseInt,\n\
    parseFloat: parseFloat,\n\
    isInteger: isInteger,\n\
    isFinite(val) { return typeof val === \"number\" && isFinite(val) },\n\
    isNaN(val) { return val !== val },\n\
    isSafeInteger(val) { return isInteger(val) && Math.abs(val) <= Number.MAX_SAFE_INTEGER }\n\
\n\
});\n\
\n\
// === String ===\n\
\n\
polyfill(String, {\n\
\n\
    raw(callsite, ...args) {\n\
\n\
        var raw = callsite.raw,\n\
            len = toLength(raw.length);\n\
\n\
        if (len === 0)\n\
            return \"\";\n\
\n\
        var s = \"\", i = 0;\n\
\n\
        while (true) {\n\
\n\
            s += raw[i];\n\
            if (i + 1 === len || i >= args.length) break;\n\
            s += args[i++];\n\
        }\n\
\n\
        return s;\n\
    },\n\
\n\
    fromCodePoint(...points) {\n\
\n\
        var out = [];\n\
\n\
        points.forEach(next => {\n\
\n\
            next = Number(next);\n\
\n\
            if (!sameValue(next, toInteger(next)) || next < 0 || next > 0x10ffff)\n\
                throw new RangeError(\"Invalid code point \" + next);\n\
\n\
            if (next < 0x10000) {\n\
\n\
                out.push(String.fromCharCode(next));\n\
\n\
            } else {\n\
\n\
                next -= 0x10000;\n\
                out.push(String.fromCharCode((next >> 10) + 0xD800));\n\
                out.push(String.fromCharCode((next % 0x400) + 0xDC00));\n\
            }\n\
        });\n\
\n\
        return out.join(\"\");\n\
    }\n\
\n\
});\n\
\n\
// Repeat a string by \"squaring\"\n\
function repeat(s, n) {\n\
\n\
    if (n < 1) return \"\";\n\
    if (n % 2) return repeat(s, n - 1) + s;\n\
    var half = repeat(s, n / 2);\n\
    return half + half;\n\
}\n\
\n\
class StringIterator {\n\
\n\
    constructor(string) {\n\
\n\
        this.string = string;\n\
        this.current = 0;\n\
    }\n\
\n\
    next() {\n\
\n\
        var s = this.string,\n\
            i = this.current,\n\
            len = s.length;\n\
\n\
        if (i >= len) {\n\
\n\
            this.current = Infinity;\n\
            return { value: void 0, done: true };\n\
        }\n\
\n\
        var c = s.charCodeAt(i),\n\
            chars = 1;\n\
\n\
        if (c >= 0xD800 && c <= 0xDBFF && i + 1 < s.length) {\n\
\n\
            c = s.charCodeAt(i + 1);\n\
            chars = (c < 0xDC00 || c > 0xDFFF) ? 1 : 2;\n\
        }\n\
\n\
        this.current += chars;\n\
\n\
        return { value: s.slice(i, this.current), done: false };\n\
    }\n\
\n\
    [Symbol.iterator]() { return this }\n\
\n\
}\n\
\n\
polyfill(String.prototype, {\n\
\n\
    repeat(count) {\n\
\n\
        assertThis(this, \"String.prototype.repeat\");\n\
\n\
        var string = String(this);\n\
\n\
        count = toInteger(count);\n\
\n\
        if (count < 0 || count === Infinity)\n\
            throw new RangeError(\"Invalid count value\");\n\
\n\
        return repeat(string, count);\n\
    },\n\
\n\
    startsWith(search) {\n\
\n\
        assertThis(this, \"String.prototype.startsWith\");\n\
\n\
        if (isRegExp(search))\n\
            throw new TypeError(\"First argument to String.prototype.startsWith must not be a regular expression\");\n\
\n\
        var string = String(this);\n\
\n\
        search = String(search);\n\
\n\
        var pos = arguments.length > 1 ? arguments[1] : undefined,\n\
            start = Math.max(toInteger(pos), 0);\n\
\n\
        return string.slice(start, start + search.length) === search;\n\
    },\n\
\n\
    endsWith(search) {\n\
\n\
        assertThis(this, \"String.prototype.endsWith\");\n\
\n\
        if (isRegExp(search))\n\
            throw new TypeError(\"First argument to String.prototype.endsWith must not be a regular expression\");\n\
\n\
        var string = String(this);\n\
\n\
        search = String(search);\n\
\n\
        var len = string.length,\n\
            arg = arguments.length > 1 ? arguments[1] : undefined,\n\
            pos = arg === undefined ? len : toInteger(arg),\n\
            end = Math.min(Math.max(pos, 0), len);\n\
\n\
        return string.slice(end - search.length, end) === search;\n\
    },\n\
\n\
    contains(search) {\n\
\n\
        assertThis(this, \"String.prototype.contains\");\n\
\n\
        var string = String(this),\n\
            pos = arguments.length > 1 ? arguments[1] : undefined;\n\
\n\
        // Somehow this trick makes method 100% compat with the spec\n\
        return string.indexOf(search, pos) !== -1;\n\
    },\n\
\n\
    codePointAt(pos) {\n\
\n\
        assertThis(this, \"String.prototype.codePointAt\");\n\
\n\
        var string = String(this),\n\
            len = string.length;\n\
\n\
        pos = toInteger(pos);\n\
\n\
        if (pos < 0 || pos >= len)\n\
            return undefined;\n\
\n\
        var a = string.charCodeAt(pos);\n\
\n\
        if (a < 0xD800 || a > 0xDBFF || pos + 1 === len)\n\
            return a;\n\
\n\
        var b = string.charCodeAt(pos + 1);\n\
\n\
        if (b < 0xDC00 || b > 0xDFFF)\n\
            return a;\n\
\n\
        return ((a - 0xD800) * 1024) + (b - 0xDC00) + 0x10000;\n\
    },\n\
\n\
    [Symbol.iterator]() {\n\
\n\
        assertThis(this, \"String.prototype[Symbol.iterator]\");\n\
        return new StringIterator(this);\n\
    }\n\
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
        var length = toLength(this.array.length),\n\
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
polyfill(Array, {\n\
\n\
    from(list) {\n\
\n\
        list = toObject(list);\n\
\n\
        var ctor = typeof this === \"function\" ? this : Array, // TODO: Always use \"this\"?\n\
            map = arguments[1],\n\
            thisArg = arguments[2],\n\
            i = 0,\n\
            out;\n\
\n\
        if (map !== void 0 && typeof map !== \"function\")\n\
            throw new TypeError(map + \" is not a function\");\n\
\n\
        var getIter = iteratorMethod(list);\n\
\n\
        if (getIter) {\n\
\n\
            var iter = getIter.call(list),\n\
                result;\n\
\n\
            out = new ctor;\n\
\n\
            while (result = iter.next(), !result.done) {\n\
\n\
                out[i++] = map ? map.call(thisArg, result.value, i) : result.value;\n\
                out.length = i;\n\
            }\n\
\n\
        } else {\n\
\n\
            var len = toLength(list.length);\n\
\n\
            out = new ctor(len);\n\
\n\
            for (; i < len; ++i)\n\
                out[i] = map ? map.call(thisArg, list[i], i) : list[i];\n\
\n\
            out.length = len;\n\
        }\n\
\n\
        return out;\n\
    },\n\
\n\
    of(...items) {\n\
\n\
        var ctor = typeof this === \"function\" ? this : Array; // TODO: Always use \"this\"?\n\
\n\
        if (ctor === Array)\n\
            return items;\n\
\n\
        var len = items.length,\n\
            out = new ctor(len);\n\
\n\
        for (var i = 0; i < len; ++i)\n\
            out[i] = items[i];\n\
\n\
        out.length = len;\n\
\n\
        return out;\n\
    }\n\
\n\
});\n\
\n\
function arrayFind(obj, pred, thisArg, type) {\n\
\n\
    var len = toLength(obj.length),\n\
        val;\n\
\n\
    if (typeof pred !== \"function\")\n\
        throw new TypeError(pred + \" is not a function\");\n\
\n\
    for (var i = 0; i < len; ++i) {\n\
\n\
        val = obj[i];\n\
\n\
        if (pred.call(thisArg, val, i, obj))\n\
            return type === \"value\" ? val : i;\n\
    }\n\
\n\
    return type === \"value\" ? void 0 : -1;\n\
}\n\
\n\
polyfill(Array.prototype, {\n\
\n\
    copyWithin(target, start) {\n\
\n\
        var obj = toObject(this),\n\
            len = toLength(obj.length),\n\
            end = arguments[2];\n\
\n\
        target = toInteger(target);\n\
        start = toInteger(start);\n\
\n\
        var to = target < 0 ? Math.max(len + target, 0) : Math.min(target, len),\n\
            from = start < 0 ? Math.max(len + start, 0) : Math.min(start, len);\n\
\n\
        end = end !== void 0 ? toInteger(end) : len;\n\
        end = end < 0 ? Math.max(len + end, 0) : Math.min(end, len);\n\
\n\
        var count = Math.min(end - from, len - to),\n\
            dir = 1;\n\
\n\
        if (from < to && to < from + count) {\n\
\n\
            dir = -1;\n\
            from += count - 1;\n\
            to += count - 1;\n\
        }\n\
\n\
        for (; count > 0; --count) {\n\
\n\
            if (from in obj) obj[to] = obj[from];\n\
            else delete obj[to];\n\
\n\
            from += dir;\n\
            to += dir;\n\
        }\n\
\n\
        return obj;\n\
    },\n\
\n\
    fill(value) {\n\
\n\
        var obj = toObject(this),\n\
            len = toLength(obj.length),\n\
            start = toInteger(arguments[1]),\n\
            pos = start < 0 ? Math.max(len + start, 0) : Math.min(start, len),\n\
            end = arguments.length > 2 ? toInteger(arguments[2]) : len;\n\
\n\
        end = end < 0 ? Math.max(len + end, 0) : Math.min(end, len);\n\
\n\
        for (; pos < end; ++pos)\n\
            obj[pos] = value;\n\
\n\
        return obj;\n\
    },\n\
\n\
    find(pred) {\n\
\n\
        return arrayFind(toObject(this), pred, arguments[1], \"value\");\n\
    },\n\
\n\
    findIndex(pred) {\n\
\n\
        return arrayFind(toObject(this), pred, arguments[1], \"index\");\n\
    },\n\
\n\
    values()  { return new ArrayIterator(this, \"values\") },\n\
\n\
    entries() { return new ArrayIterator(this, \"entries\") },\n\
\n\
    keys()    { return new ArrayIterator(this, \"keys\") },\n\
\n\
    [Symbol.iterator]() { return this.values() }\n\
\n\
});\n\
";

Runtime.MapSet = 

"var global = _esdown.global,\n\
    ORIGIN = {},\n\
    REMOVED = {};\n\
\n\
class MapNode {\n\
\n\
    constructor(key, val) {\n\
\n\
        this.key = key;\n\
        this.value = val;\n\
        this.prev = this;\n\
        this.next = this;\n\
    }\n\
\n\
    insert(next) {\n\
\n\
        this.next = next;\n\
        this.prev = next.prev;\n\
        this.prev.next = this;\n\
        this.next.prev = this;\n\
    }\n\
\n\
    remove() {\n\
\n\
        this.prev.next = this.next;\n\
        this.next.prev = this.prev;\n\
        this.key = REMOVED;\n\
    }\n\
\n\
}\n\
\n\
class MapIterator {\n\
\n\
    constructor(node, kind) {\n\
\n\
        this.current = node;\n\
        this.kind = kind;\n\
    }\n\
\n\
    next() {\n\
\n\
        var node = this.current;\n\
\n\
        while (node.key === REMOVED)\n\
            node = this.current = this.current.next;\n\
\n\
        if (node.key === ORIGIN)\n\
            return { value: void 0, done: true };\n\
\n\
        this.current = this.current.next;\n\
\n\
        switch (this.kind) {\n\
\n\
            case \"values\":\n\
                return { value: node.value, done: false };\n\
\n\
            case \"entries\":\n\
                return { value: [ node.key, node.value ], done: false };\n\
\n\
            default:\n\
                return { value: node.key, done: false };\n\
        }\n\
    }\n\
\n\
    [Symbol.iterator]() { return this }\n\
}\n\
\n\
function hashKey(key) {\n\
\n\
    switch (typeof key) {\n\
\n\
        case \"string\": return \"$\" + key;\n\
        case \"number\": return String(key);\n\
    }\n\
\n\
    throw new TypeError(\"Map and Set keys must be strings or numbers in esdown\");\n\
}\n\
\n\
class Map {\n\
\n\
    constructor() {\n\
\n\
        if (arguments.length > 0)\n\
            throw new Error(\"Arguments to Map constructor are not supported in esdown\");\n\
\n\
        this._index = {};\n\
        this._origin = new MapNode(ORIGIN);\n\
    }\n\
\n\
    clear() {\n\
\n\
        for (var node = this._origin.next; node !== this._origin; node = node.next)\n\
            node.key = REMOVED;\n\
\n\
        this._index = {};\n\
        this._origin = new MapNode(ORIGIN);\n\
    }\n\
\n\
    delete(key) {\n\
\n\
        var h = hashKey(key),\n\
            node = this._index[h];\n\
\n\
        if (node) {\n\
\n\
            node.remove();\n\
            delete this._index[h];\n\
            return true;\n\
        }\n\
\n\
        return false;\n\
    }\n\
\n\
    forEach(fn) {\n\
\n\
        var thisArg = arguments[1];\n\
\n\
        if (typeof fn !== \"function\")\n\
            throw new TypeError(fn + \" is not a function\");\n\
\n\
        for (var node = this._origin.next; node.key !== ORIGIN; node = node.next)\n\
            if (node.key !== REMOVED)\n\
                fn.call(thisArg, node.value, node.key, this);\n\
    }\n\
\n\
    get(key) {\n\
\n\
        var h = hashKey(key),\n\
            node = this._index[h];\n\
\n\
        return node ? node.value : void 0;\n\
    }\n\
\n\
    has(key) {\n\
\n\
        return hashKey(key) in this._index;\n\
    }\n\
\n\
    set(key, val) {\n\
\n\
        var h = hashKey(key),\n\
            node = this._index[h];\n\
\n\
        if (node) {\n\
\n\
            node.value = val;\n\
            return;\n\
        }\n\
\n\
        node = new MapNode(key, val);\n\
\n\
        this._index[h] = node;\n\
        node.insert(this._origin);\n\
    }\n\
\n\
    get size() {\n\
\n\
        return Object.keys(this._index).length;\n\
    }\n\
\n\
    keys() { return new MapIterator(this._origin.next, \"keys\") }\n\
    values() { return new MapIterator(this._origin.next, \"values\") }\n\
    entries() { return new MapIterator(this._origin.next, \"entries\") }\n\
\n\
    [Symbol.iterator]() { return new MapIterator(this._origin.next, \"entries\") }\n\
\n\
}\n\
\n\
var mapSet = Map.prototype.set;\n\
\n\
class Set {\n\
\n\
    constructor() {\n\
\n\
        if (arguments.length > 0)\n\
            throw new Error(\"Arguments to Set constructor are not supported in esdown\");\n\
\n\
        this._index = {};\n\
        this._origin = new MapNode(ORIGIN);\n\
    }\n\
\n\
    add(key) { return mapSet.call(this, key, key) }\n\
\n\
    [Symbol.iterator]() { return new MapIterator(this._origin.next, \"entries\") }\n\
\n\
}\n\
\n\
// Copy shared prototype members to Set\n\
[\"clear\", \"delete\", \"forEach\", \"has\", \"size\", \"keys\", \"values\", \"entries\"].forEach(k => {\n\
\n\
    var d = Object.getOwnPropertyDescriptor(Map.prototype, k);\n\
    Object.defineProperty(Set.prototype, k, d);\n\
});\n\
\n\
if (!global.Map || !global.Map.prototype.entries) {\n\
\n\
    global.Map = Map;\n\
    global.Set = Set;\n\
}\n\
";

Runtime.Promise = 

"(function() { \"use strict\";\n\
\n\
// Find global variable and exit if Promise is defined on it\n\
\n\
var Global = (function() {\n\
    if (typeof window !== \"undefined\" && window && window.window === window)\n\
        return window;\n\
    if (typeof global !== \"undefined\" && global && global.global === global)\n\
        return global;\n\
    throw new Error(\"Unable to determine global object\");\n\
})();\n\
\n\
if (typeof Global.Promise === \"function\")\n\
    return;\n\
\n\
// Create an efficient microtask queueing mechanism\n\
\n\
var runLater = (function() {\n\
    // Node\n\
    if (Global.process && typeof process.version === \"string\") {\n\
        return Global.setImmediate ?\n\
            function(fn) { setImmediate(fn); } :\n\
            function(fn) { process.nextTick(fn); };\n\
    }\n\
\n\
    // Newish Browsers\n\
    var Observer = Global.MutationObserver || Global.WebKitMutationObserver;\n\
\n\
    if (Observer) {\n\
        var div = document.createElement(\"div\"),\n\
            queuedFn = void 0;\n\
\n\
        var observer = new Observer(function() {\n\
            var fn = queuedFn;\n\
            queuedFn = void 0;\n\
            fn();\n\
        });\n\
\n\
        observer.observe(div, { attributes: true });\n\
\n\
        return function(fn) {\n\
            if (queuedFn !== void 0)\n\
                throw new Error(\"Only one function can be queued at a time\");\n\
            queuedFn = fn;\n\
            div.classList.toggle(\"x\");\n\
        };\n\
    }\n\
\n\
    // Fallback\n\
    return function(fn) { setTimeout(fn, 0); };\n\
})();\n\
\n\
var EnqueueMicrotask = (function() {\n\
    var queue = null;\n\
\n\
    function flush() {\n\
        var q = queue;\n\
        queue = null;\n\
        for (var i = 0; i < q.length; ++i)\n\
            q[i]();\n\
    }\n\
\n\
    return function PromiseEnqueueMicrotask(fn) {\n\
        // fn must not throw\n\
        if (!queue) {\n\
            queue = [];\n\
            runLater(flush);\n\
        }\n\
        queue.push(fn);\n\
    };\n\
})();\n\
\n\
// Mock V8 internal functions and vars\n\
\n\
function SET_PRIVATE(obj, prop, val) { obj[prop] = val; }\n\
function GET_PRIVATE(obj, prop) { return obj[prop]; }\n\
function IS_SPEC_FUNCTION(obj) { return typeof obj === \"function\"; }\n\
function IS_SPEC_OBJECT(obj) { return obj === Object(obj); }\n\
function HAS_DEFINED_PRIVATE(obj, prop) { return prop in obj; }\n\
function IS_UNDEFINED(x) { return x === void 0; }\n\
function MakeTypeError(msg) { return new TypeError(msg); }\n\
\n\
// In IE8 Object.defineProperty only works on DOM nodes, and defineProperties does not exist\n\
var _defineProperty = Object.defineProperties && Object.defineProperty;\n\
\n\
function AddNamedProperty(target, name, value) {\n\
    if (!_defineProperty) {\n\
        target[name] = value;\n\
        return;\n\
    }\n\
\n\
    _defineProperty(target, name, {\n\
        configurable: true,\n\
        writable: true,\n\
        enumerable: false,\n\
        value: value\n\
    });\n\
}\n\
\n\
function InstallFunctions(target, attr, list) {\n\
    for (var i = 0; i < list.length; i += 2)\n\
        AddNamedProperty(target, list[i], list[i + 1]);\n\
}\n\
\n\
var IsArray = Array.isArray || (function(obj) {\n\
    var str = Object.prototype.toString;\n\
    return function(obj) { return str.call(obj) === \"[object Array]\" };\n\
})();\n\
\n\
var UNDEFINED, DONT_ENUM, InternalArray = Array;\n\
\n\
// V8 Implementation\n\
\n\
var IsPromise;\n\
var PromiseCreate;\n\
var PromiseResolve;\n\
var PromiseReject;\n\
var PromiseChain;\n\
var PromiseCatch;\n\
var PromiseThen;\n\
\n\
// Status values: 0 = pending, +1 = resolved, -1 = rejected\n\
var promiseStatus = \"Promise#status\";\n\
var promiseValue = \"Promise#value\";\n\
var promiseOnResolve = \"Promise#onResolve\";\n\
var promiseOnReject = \"Promise#onReject\";\n\
var promiseRaw = {};\n\
var promiseHasHandler = \"Promise#hasHandler\";\n\
var lastMicrotaskId = 0;\n\
\n\
var $Promise = function Promise(resolver) {\n\
    if (resolver === promiseRaw) return;\n\
    if (!IS_SPEC_FUNCTION(resolver))\n\
      throw MakeTypeError('resolver_not_a_function', [resolver]);\n\
    var promise = PromiseInit(this);\n\
    try {\n\
        resolver(function(x) { PromiseResolve(promise, x) },\n\
                 function(r) { PromiseReject(promise, r) });\n\
    } catch (e) {\n\
        PromiseReject(promise, e);\n\
    }\n\
}\n\
\n\
// Core functionality.\n\
\n\
function PromiseSet(promise, status, value, onResolve, onReject) {\n\
    SET_PRIVATE(promise, promiseStatus, status);\n\
    SET_PRIVATE(promise, promiseValue, value);\n\
    SET_PRIVATE(promise, promiseOnResolve, onResolve);\n\
    SET_PRIVATE(promise, promiseOnReject, onReject);\n\
    return promise;\n\
}\n\
\n\
function PromiseInit(promise) {\n\
    return PromiseSet(promise, 0, UNDEFINED, new InternalArray, new InternalArray);\n\
}\n\
\n\
function PromiseDone(promise, status, value, promiseQueue) {\n\
    if (GET_PRIVATE(promise, promiseStatus) === 0) {\n\
        PromiseEnqueue(value, GET_PRIVATE(promise, promiseQueue), status);\n\
        PromiseSet(promise, status, value);\n\
    }\n\
}\n\
\n\
function PromiseCoerce(constructor, x) {\n\
    if (!IsPromise(x) && IS_SPEC_OBJECT(x)) {\n\
        var then;\n\
        try {\n\
            then = x.then;\n\
        } catch(r) {\n\
            return PromiseRejected.call(constructor, r);\n\
        }\n\
        if (IS_SPEC_FUNCTION(then)) {\n\
            var deferred = PromiseDeferred.call(constructor);\n\
            try {\n\
                then.call(x, deferred.resolve, deferred.reject);\n\
            } catch(r) {\n\
                deferred.reject(r);\n\
            }\n\
            return deferred.promise;\n\
        }\n\
    }\n\
    return x;\n\
}\n\
\n\
function PromiseHandle(value, handler, deferred) {\n\
    try {\n\
        var result = handler(value);\n\
        if (result === deferred.promise)\n\
            throw MakeTypeError('promise_cyclic', [result]);\n\
        else if (IsPromise(result))\n\
            PromiseChain.call(result, deferred.resolve, deferred.reject);\n\
        else\n\
            deferred.resolve(result);\n\
    } catch (exception) {\n\
        try { deferred.reject(exception) } catch (e) { }\n\
    }\n\
}\n\
\n\
function PromiseEnqueue(value, tasks, status) {\n\
    EnqueueMicrotask(function() {\n\
        for (var i = 0; i < tasks.length; i += 2)\n\
            PromiseHandle(value, tasks[i], tasks[i + 1]);\n\
    });\n\
}\n\
\n\
function PromiseIdResolveHandler(x) { return x }\n\
function PromiseIdRejectHandler(r) { throw r }\n\
\n\
function PromiseNopResolver() {}\n\
\n\
// -------------------------------------------------------------------\n\
// Define exported functions.\n\
\n\
// For bootstrapper.\n\
\n\
IsPromise = function IsPromise(x) {\n\
    return IS_SPEC_OBJECT(x) && HAS_DEFINED_PRIVATE(x, promiseStatus);\n\
};\n\
\n\
PromiseCreate = function PromiseCreate() {\n\
    return new $Promise(PromiseNopResolver);\n\
};\n\
\n\
PromiseResolve = function PromiseResolve(promise, x) {\n\
    PromiseDone(promise, +1, x, promiseOnResolve);\n\
};\n\
\n\
PromiseReject = function PromiseReject(promise, r) {\n\
    PromiseDone(promise, -1, r, promiseOnReject);\n\
};\n\
\n\
// Convenience.\n\
\n\
function PromiseDeferred() {\n\
    if (this === $Promise) {\n\
        // Optimized case, avoid extra closure.\n\
        var promise = PromiseInit(new $Promise(promiseRaw));\n\
        return {\n\
            promise: promise,\n\
            resolve: function(x) { PromiseResolve(promise, x) },\n\
            reject: function(r) { PromiseReject(promise, r) }\n\
        };\n\
    } else {\n\
        var result = {};\n\
        result.promise = new this(function(resolve, reject) {\n\
            result.resolve = resolve;\n\
            result.reject = reject;\n\
        });\n\
        return result;\n\
    }\n\
}\n\
\n\
function PromiseResolved(x) {\n\
    if (this === $Promise) {\n\
        // Optimized case, avoid extra closure.\n\
        return PromiseSet(new $Promise(promiseRaw), +1, x);\n\
    } else {\n\
        return new this(function(resolve, reject) { resolve(x) });\n\
    }\n\
}\n\
\n\
function PromiseRejected(r) {\n\
    var promise;\n\
    if (this === $Promise) {\n\
        // Optimized case, avoid extra closure.\n\
        promise = PromiseSet(new $Promise(promiseRaw), -1, r);\n\
    } else {\n\
        promise = new this(function(resolve, reject) { reject(r) });\n\
    }\n\
    return promise;\n\
}\n\
\n\
// Simple chaining.\n\
\n\
PromiseChain = function PromiseChain(onResolve, onReject) {\n\
    onResolve = IS_UNDEFINED(onResolve) ? PromiseIdResolveHandler : onResolve;\n\
    onReject = IS_UNDEFINED(onReject) ? PromiseIdRejectHandler : onReject;\n\
    var deferred = PromiseDeferred.call(this.constructor);\n\
    switch (GET_PRIVATE(this, promiseStatus)) {\n\
        case UNDEFINED:\n\
            throw MakeTypeError('not_a_promise', [this]);\n\
        case 0:  // Pending\n\
            GET_PRIVATE(this, promiseOnResolve).push(onResolve, deferred);\n\
            GET_PRIVATE(this, promiseOnReject).push(onReject, deferred);\n\
            break;\n\
        case +1:  // Resolved\n\
            PromiseEnqueue(GET_PRIVATE(this, promiseValue), [onResolve, deferred], +1);\n\
            break;\n\
        case -1:  // Rejected\n\
            PromiseEnqueue(GET_PRIVATE(this, promiseValue), [onReject, deferred], -1);\n\
            break;\n\
    }\n\
    // Mark this promise as having handler.\n\
    SET_PRIVATE(this, promiseHasHandler, true);\n\
    return deferred.promise;\n\
}\n\
\n\
PromiseCatch = function PromiseCatch(onReject) {\n\
    return this.then(UNDEFINED, onReject);\n\
}\n\
\n\
// Multi-unwrapped chaining with thenable coercion.\n\
\n\
PromiseThen = function PromiseThen(onResolve, onReject) {\n\
    onResolve = IS_SPEC_FUNCTION(onResolve) ? onResolve : PromiseIdResolveHandler;\n\
    onReject = IS_SPEC_FUNCTION(onReject) ? onReject : PromiseIdRejectHandler;\n\
    var that = this;\n\
    var constructor = this.constructor;\n\
    return PromiseChain.call(\n\
        this,\n\
        function(x) {\n\
            x = PromiseCoerce(constructor, x);\n\
            return x === that ? onReject(MakeTypeError('promise_cyclic', [x])) :\n\
                IsPromise(x) ? x.then(onResolve, onReject) :\n\
                onResolve(x);\n\
        },\n\
        onReject);\n\
}\n\
\n\
// Combinators.\n\
\n\
function PromiseCast(x) {\n\
    return IsPromise(x) ? x : new this(function(resolve) { resolve(x) });\n\
}\n\
\n\
function PromiseAll(values) {\n\
    var deferred = PromiseDeferred.call(this);\n\
    var resolutions = [];\n\
    if (!IsArray(values)) {\n\
        deferred.reject(MakeTypeError('invalid_argument'));\n\
        return deferred.promise;\n\
    }\n\
    try {\n\
        var count = values.length;\n\
        if (count === 0) {\n\
            deferred.resolve(resolutions);\n\
        } else {\n\
            for (var i = 0; i < values.length; ++i) {\n\
                this.resolve(values[i]).then(\n\
                    (function() {\n\
                        // Nested scope to get closure over current i (and avoid .bind).\n\
                        var i_captured = i;\n\
                        return function(x) {\n\
                            resolutions[i_captured] = x;\n\
                            if (--count === 0) deferred.resolve(resolutions);\n\
                        };\n\
                    })(),\n\
                    function(r) { deferred.reject(r) });\n\
            }\n\
        }\n\
    } catch (e) {\n\
        deferred.reject(e);\n\
    }\n\
    return deferred.promise;\n\
}\n\
\n\
function PromiseOne(values) {\n\
    var deferred = PromiseDeferred.call(this);\n\
    if (!IsArray(values)) {\n\
        deferred.reject(MakeTypeError('invalid_argument'));\n\
        return deferred.promise;\n\
    }\n\
    try {\n\
        for (var i = 0; i < values.length; ++i) {\n\
            this.resolve(values[i]).then(\n\
                function(x) { deferred.resolve(x) },\n\
                function(r) { deferred.reject(r) });\n\
        }\n\
    } catch (e) {\n\
        deferred.reject(e);\n\
    }\n\
    return deferred.promise;\n\
}\n\
\n\
// -------------------------------------------------------------------\n\
// Install exported functions.\n\
\n\
AddNamedProperty(Global, 'Promise', $Promise, DONT_ENUM);\n\
\n\
InstallFunctions($Promise, DONT_ENUM, [\n\
    \"defer\", PromiseDeferred,\n\
    \"accept\", PromiseResolved,\n\
    \"reject\", PromiseRejected,\n\
    \"all\", PromiseAll,\n\
    \"race\", PromiseOne,\n\
    \"resolve\", PromiseCast\n\
]);\n\
\n\
InstallFunctions($Promise.prototype, DONT_ENUM, [\n\
    \"chain\", PromiseChain,\n\
    \"then\", PromiseThen,\n\
    \"catch\", PromiseCatch\n\
]);\n\
\n\
})();\n\
";


exports.Runtime = Runtime;


}).call(this, _M17);

(function(exports) {

var NODE_SCHEME = /^node:/i,
    URI_SCHEME = /^[a-z]+:/i;

function isLegacyScheme(spec) {

    return NODE_SCHEME.test(spec);
}

function removeScheme(uri) {

    return uri.replace(URI_SCHEME, "");
}

function hasScheme(uri) {

    return URI_SCHEME.test(uri);
}

exports.isLegacyScheme = isLegacyScheme;
exports.removeScheme = removeScheme;
exports.hasScheme = hasScheme;


}).call(this, _M16);

(function(exports) {

var Parser = _M13.Parser, AST = _M13.AST;
var isLegacyScheme = _M16.isLegacyScheme, removeScheme = _M16.removeScheme;

var NODE_SCHEME = /^node:/i,
    URI_SCHEME = /^[a-z]+:/i;

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

function isAsyncType(type) {

    return type === "async" || type === "async-generator";
}

var PatternTreeNode = _esdown.class(function(__super) { return {

    constructor: function PatternTreeNode(name, init, skip) {

        this.name = name;
        this.initializer = init;
        this.children = [];
        this.target = "";
        this.skip = skip | 0;
        this.array = false;
        this.rest = false;
    }
} });

var RootNode = _esdown.class(AST.Node, function(__super) { return {

    constructor: function RootNode(root, end) {

        this.type = "Root";
        this.start = 0;
        this.end = end;
        this.root = root;
    }
} });

var Replacer = _esdown.class(function(__super) { return {

    replace: function(input, options) { var __this = this; if (options === void 0) options = {}; 

        var parser = new Parser,
            root = parser.parse(input, { module: options.module });

        this.input = input;
        this.parser = parser;
        this.exports = {};
        this.imports = {};
        this.dependencies = [];
        this.isStrict = false;
        this.uid = 0;

        var visit = function(node) {

            node.text = null;

            // Call pre-order traversal method
            if (__this[node.type + "Begin"])
                __this[node.type + "Begin"](node);

            var strict = __this.isStrict;

            // Set the strictness for implicitly strict nodes
            switch (node.type) {

                case "Module":
                case "ClassDeclaration":
                case "ClassExpresion":
                    __this.isStrict = true;
            }

            // Perform a depth-first traversal
            node.children().forEach(function(child) {

                child.parent = node;
                visit(child);
            });

            // Restore strictness
            __this.isStrict = strict;

            var text = null;

            // Call replacer
            if (__this[node.type])
                text = __this[node.type](node);

            if (text === null || text === void 0)
                text = __this.stringify(node);

            return node.text = __this.syncNewlines(node.start, node.end, text);
        };

        var output = visit(new RootNode(root, input.length)),
            head = "";

        this.dependencies.forEach(function(dep) {

            if (head) head += ", ";
            else head = "var ";

            var url = dep.url,
                legacyFlag = dep.legacy ? ", 1" : "";

            head += "" + (__this.imports[url]) + " = __load(" + (JSON.stringify(dep.url)) + "" + (legacyFlag) + ")";
        });

        if (head)
            head += "; ";

        output = head + output;

        var exports = Object.keys(this.exports);

        if (exports.length > 0) {

            output += "\n";
            output += exports.map(function(k) { return "exports." + (k) + " = " + (__this.exports[k]) + ";"; }).join("\n");
            output += "\n";
        }

        return output;
    },

    DoWhileStatement: function(node) {

        var text = this.stringify(node);

        if (text.slice(-1) !== ";")
            return text + ";";
    },

    ForOfStatement: function(node) {

        var iter = this.addTempVar(node, null, true),
            iterResult = this.addTempVar(node, null, true),
            context = this.parentFunction(node),
            decl = "",
            binding,
            head;

        if (node.async) {

            head = "for (var " + (iter) + " = _esdown.asyncIter(" + (node.right.text) + "), " + (iterResult) + "; ";
            head += "" + (iterResult) + " = " + (this.awaitYield(context, iter + ".next()")) + ", ";

        } else {

            head = "for (var " + (iter) + " = _esdown.iter(" + (node.right.text) + "), " + (iterResult) + "; ";
            head += "" + (iterResult) + " = " + (iter) + ".next(), ";
        }

        head += "!" + (iterResult) + ".done;";
        head = this.syncNewlines(node.left.start, node.right.end, head);
        head += this.input.slice(node.right.end, node.body.start);

        if (node.left.type === "VariableDeclaration") {

            decl = node.left.kind + " ";
            binding = node.left.declarations[0].pattern;

        } else {

            binding = this.unwrapParens(node.left);
        }

        var body = node.body.text;

        // Remove braces from block bodies
        if (node.body.type === "Block") body = body.slice(1, -1);
        else body += " ";

        var assign = this.isPattern(binding) ?
            this.translatePattern(binding, "" + (iterResult) + ".value").join(", ") :
            "" + (binding.text) + " = " + (iterResult) + ".value";

        var out = "" + (head) + "{ " + (decl) + "" + (assign) + "; " + (body) + "}";

        /*

        For-of loops are implicitly wrapped with try-finally, where the "return"
        is called upon the iterator (if it has such a method) when evaulation leaves
        the loop body.  For performance reasons, and because engines have not
        implemented "return" yet, we avoid this wrapper.

        out = `try { ${ out } } finally { ` +
            `if (${ iterResult } && !${ iterResult }.done && "return" in ${ iter }) ` +
                `${ iter }.return(); }`;

        */

        return out;
    },

    Module: function(node) {

        // NOTE: Strict directive is included with module wrapper

        var inserted = [],
            temps = this.tempVars(node);

        if (node.createThisBinding)
            inserted.push("var __this = this;");

        if (temps)
            inserted.push(temps);

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

    ArrayLiteral: function(node) {

        if (node.hasSpread)
            return "(" + this.spreadList(node.elements, true) + ")";
    },

    MethodDefinition: function(node) {

        switch (node.kind) {

            case "":
                return node.name.text + ": function(" +
                    this.joinList(node.params) + ") " +
                    node.body.text;

            case "async":
            case "async-generator":
                return node.name.text + ": " + this.asyncFunction(null, node.params, node.body.text, node.kind);

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

    ImportDeclaration: function(node) {

        var moduleSpec = this.modulePath(node.from),
            list = [];

        if (node.specifiers) {

            node.specifiers.forEach(function(spec) {

                var imported = spec.imported,
                    local = spec.local || imported;

                list.push({
                    start: spec.start,
                    end: spec.end,
                    text: local.text + " = " + moduleSpec + "." + imported.text
                });
            });
        }

        if (list.length === 0)
            return "";

        return "var " + this.joinList(list) + ";";
    },

    ImportDefaultDeclaration: function(node) {

        var moduleSpec = this.modulePath(node.from);
        return "var " + node.identifier.text + " = " + moduleSpec + "['default'];";
    },

    ExportDeclaration: function(node) { var __this = this; 

        var target = node.declaration,
            exports = this.exports,
            ident;

        // Exported declarations
        switch (target.type) {

            case "VariableDeclaration":

                target.declarations.forEach(function(decl) {

                    if (__this.isPattern(decl.pattern)) {

                        decl.pattern.patternTargets.forEach(function(x) { return exports[x] = x; });

                    } else {

                        ident = decl.pattern.text;
                        exports[ident] = ident;
                    }
                });

                return target.text + ";";

            case "FunctionDeclaration":
            case "ClassDeclaration":

                ident = target.identifier.text;
                exports[ident] = ident;
                return target.text;

            case "DefaultExport":

                switch (target.binding.type) {

                    case "ClassDeclaration":
                    case "FunctionDeclaration":
                        exports["default"] = target.binding.identifier.text;
                        return target.binding.text;
                }

                return "exports[\"default\"] = " + (target.binding.text) + ";";
        }

        var from = target.from,
            fromPath = from ? this.modulePath(from) : "",
            out = "";

        if (!target.specifiers) {

            out += "Object.keys(" + fromPath + ").forEach(function(k) { exports[k] = " + fromPath + "[k]; });";

        } else {

            target.specifiers.forEach(function(spec) {

                var local = spec.local.text,
                    exported = spec.exported ? spec.exported.text : local;

                exports[exported] = from ?
                    fromPath + "." + local :
                    local;
            });
        }

        return out;
    },

    CallExpression: function(node) {

        var callee = node.callee,
            args = node.arguments,
            spread = null,
            calleeText,
            argText;

        if (node.hasSpread)
            spread = this.spreadList(args, false);

        if (node.injectThisArg) {

            argText = node.injectThisArg;

            if (spread)
                argText = argText + ", " + spread;
            else if (args.length > 0)
                argText = argText + ", " + this.joinList(args);

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

        node.parent.hasSpread = true;
    },

    SuperExpression: function(node) {

        var proto = "__super",
            p = node.parent,
            elem = p;

        while (elem && elem.type !== "ClassElement")
            elem = elem.parent;

        if (elem && elem.static) {

            proto = "__csuper";
            elem.parent.hasStaticSuper = true;
        }

        if (p.type === "CallExpression") {

            // super(args);
            p.injectThisArg = "this";

            var m = this.parentFunction(p),
                name = ".constructor";

            if (m.type === "MethodDefinition") {

                name = m.name.type === "Identifier" ?
                    "." + m.name.text :
                    "[" + JSON.stringify(m.name.text) + "]";
            }

            return proto + name;

        } else {

            // super.foo...
            p.isSuperLookup = true;
        }

        var pp = this.parenParent(p);

        // super.foo(args);
        if (pp[0].type === "CallExpression" && pp[0].callee === pp[1])
            pp[0].injectThisArg = "this";

        return proto;
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

    VirtualPropertyExpression: function(node) {

        var pp = this.parenParent(node),
            p = pp[0],
            type = "get";

        switch (p.type) {

            case "CallExpression":
                if (p.callee === pp[1]) type = "call";
                break;

            case "AssignmentExpression":
                if (p.left === pp[1]) type = "set";
                break;

            case "PatternProperty":
            case "PatternElement":
                // References within assignment patterns are not currently supported
                return null;

            case "UnaryExpression":
                if (p.operator === "delete") type = "delete";
                break;
        }

        var temp;

        switch (type) {

            case "call":
                temp = this.addTempVar(p);
                p.injectThisArg = temp;
                return "" + (node.property.text) + "[Symbol.referenceGet](" + (temp) + " = " + (node.object.text) + ")";

            case "get":
                return "" + (node.property.text) + "[Symbol.referenceGet](" + (node.object.text) + ")";

            case "set":
                temp = this.addTempVar(p);

                p.assignWrap = [
                    "(" + (node.property.text) + "[Symbol.referenceSet](" + (node.object.text) + ", " + (temp) + " = ",
                    "), " + (temp) + ")"
                ];

                return null;

            case "delete":
                p.overrideDelete = true;
                return "" + (node.property.text) + "[Symbol.referenceDelete](" + (node.object.text) + ")";
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

        var text = node.kind === "async" ?
            this.asyncFunction(null, node.params, body, "async") :
            "function(" + this.joinList(node.params) + ") " + body;

        return this.wrapFunctionExpression(text, node);
    },

    ThisExpression: function(node) {

        var fn = this.parentFunction(node);

        if (fn.type === "ArrowFunction") {

            while (fn = this.parentFunction(fn)) {

                if (fn.type !== "ArrowFunction") {

                    fn.createThisBinding = true;
                    break;
                }
            }

            return "__this";
        }
    },

    UnaryExpression: function(node) {

        // VirtualPropertyExpression
        if (node.operator === "delete" && node.overrideDelete)
            return "!void " + node.expression.text;

        if (node.operator === "await")
            return this.awaitYield(this.parentFunction(node), node.expression.text);
    },

    YieldExpression: function(node) {

        // V8 circa Node 0.11.x does not support yield without expression
        if (!node.expression)
            return "yield void 0";

        // V8 circa Node 0.11.x does not access Symbol.iterator correctly
        if (node.delegate) {

            var fn = this.parentFunction(node),
                method = isAsyncType(fn.kind) ? "asyncIter" : "iter";

            node.expression.text = "_esdown." + (method) + "(" + (node.expression.text) + ")";
        }
    },

    FunctionDeclaration: function(node) {

        if (isAsyncType(node.kind))
            return this.asyncFunction(node.identifier, node.params, node.body.text, node.kind);
    },

    FunctionExpression: function(node) {

        if (isAsyncType(node.kind))
            return this.asyncFunction(node.identifier, node.params, node.body.text, node.kind);
    },

    ClassDeclaration: function(node) {

        var params = "__super";

        if (node.body.hasStaticSuper)
            params += ", __csuper";

        return "var " + node.identifier.text + " = _esdown.class(" +
            (node.base ? (node.base.text + ", ") : "") +
            "function(" + params + ") {" + this.strictDirective() + " return " +
            node.body.text + " });";
    },

    ClassExpression: function(node) {

        var before = "",
            after = "";

        if (node.identifier) {

            before = "function() { var " + node.identifier.text + " = ";
            after = "; return " + node.identifier.text + "; }()";
        }

        var params = "__super";

        if (node.body.hasStaticSuper)
            params += ", __csuper";

        return "(" + before +
            "_esdown.class(" +
            (node.base ? (node.base.text + ", ") : "") +
            "function(" + params + ") {" + this.strictDirective() + " return " +
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

            out = "(_esdown.callSite(" +
                "[" + lit.map(function(x) { return __this.rawToString(x.raw); }).join(", ") + "]";

            // Only output the raw array if it is different from the cooked array
            for (i = 0; i < lit.length; ++i) {

                if (lit[i].raw !== lit[i].value) {

                    out += ", [" + lit.map(function(x) { return JSON.stringify(x.raw); }).join(", ") + "]";
                    break;
                }
            }

            out += ")";

            if (sub.length > 0)
                out += ", " + sub.map(function(x) { return x.text; }).join(", ");

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

    CatchClause: function(node) {

        if (!this.isPattern(node.param))
            return null;

        var temp = this.addTempVar(node, null, true),
            assign = this.translatePattern(node.param, temp).join(", "),
            body = node.body.text.slice(1);

        return "catch (" + (temp) + ") { let " + (assign) + "; " + (body) + "";
    },

    VariableDeclarator: function(node) {

        if (!node.initializer || !this.isPattern(node.pattern))
            return null;

        var list = this.translatePattern(node.pattern, node.initializer.text);

        return list.join(", ");
    },

    AssignmentExpression: function(node) {

        // VirtualPropertyExpression
        if (node.assignWrap)
            return node.assignWrap[0] + node.right.text + node.assignWrap[1];

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

    parenParent: function(node) {

        var parent;

        for (; parent = node.parent; node = parent)
            if (parent.type !== "ParenExpression")
                break;

        return [parent, node];
    },

    unwrapParens: function(node) {

        while (node && node.type === "ParenExpression")
            node = node.expression;

        return node;
    },

    spreadList: function(elems, newArray) {

        var list = [],
            last = -1,
            i;

        for (i = 0; i < elems.length; ++i) {

            if (elems[i].type === "SpreadExpression") {

                if (last < i - 1)
                    list.push({ type: "s", args: this.joinList(elems.slice(last + 1, i)) });

                list.push({ type: "i", args: elems[i].expression.text });

                last = i;
            }
        }

        if (last < elems.length - 1)
            list.push({ type: "s", args: this.joinList(elems.slice(last + 1)) });

        var out = "(_esdown.spread()";

        for (i = 0; i < list.length; ++i)
            out += "." + (list[i].type) + "(" + (list[i].args) + ")";

        out += ".a)";

        return out;
    },

    translatePattern: function(node, base) { var __this = this; 

        function propGet(name) {

            return /^[\.\d'"]/.test(name) ?
                "[" + name + "]" :
                "." + name;
        }

        var outer = [],
            inner = [],
            targets = [];

        node.patternTargets = targets;

        var visit = function(tree, base) {

            var target = tree.target,
                dType = tree.array ? "arrayd" : "objd",
                str = "",
                temp;

            var access =
                tree.rest ? "" + (base) + ".rest(" + (tree.skip) + ", " + (tree.name) + ")" :
                tree.skip ? "" + (base) + ".at(" + (tree.skip) + ", " + (tree.name) + ")" :
                tree.name ? base + propGet(tree.name) :
                base;

            if (tree.initializer) {

                temp = __this.addTempVar(node);
                inner.push("" + (temp) + " = " + (access) + "");

                str = "" + (temp) + " === void 0 ? " + (tree.initializer) + " : " + (temp) + "";

                if (!tree.target)
                    str = "" + (temp) + " = _esdown." + (dType) + "(" + (str) + ")";

                inner.push(str);

            } else if (tree.target) {

                inner.push("" + (access) + "");

            } else {

                temp = __this.addTempVar(node);
                inner.push("" + (temp) + " = _esdown." + (dType) + "(" + (access) + ")");
            }

            if (tree.target) {

                targets.push(target);

                outer.push(inner.length === 1 ?
                    "" + (target) + " = " + (inner[0]) + "" :
                    "" + (target) + " = (" + (inner.join(", ")) + ")");

                inner.length = 0;
            }

            if (temp)
                base = temp;

            tree.children.forEach(function(c) { return visit(c, base); });
        };

        visit(this.createPatternTree(node), base);

        return outer;
    },

    createPatternTree: function(ast, parent) { var __this = this; 

        if (!parent)
            parent = new PatternTreeNode("", null);

        var child, init, skip = 1;

        switch (ast.type) {

            case "ArrayPattern":

                parent.array = true;

                ast.elements.forEach(function(e, i) {

                    if (!e) {

                        ++skip;
                        return;
                    }

                    init = e.initializer ? e.initializer.text : "";

                    child = new PatternTreeNode(String(i), init, skip);

                    if (e.type === "PatternRestElement")
                        child.rest = true;

                    parent.children.push(child);
                    __this.createPatternTree(e.pattern, child);

                    skip = 1;
                });

                break;

            case "ObjectPattern":

                ast.properties.forEach(function(p) {

                    init = p.initializer ? p.initializer.text : "";
                    child = new PatternTreeNode(p.name.text, init);

                    parent.children.push(child);
                    __this.createPatternTree(p.pattern || p.name, child);
                });

                break;

            default:

                parent.target = ast.text;
                break;
        }

        return parent;
    },

    asyncFunction: function(ident, params, body, kind) {

        var head = "function";

        if (ident)
            head += " " + ident.text;

        var outerParams = params.map(function(x, i) {

            var p = x.pattern || x.identifier;
            return p.type === "Identifier" ? p.value : "__$" + i;

        }).join(", ");

        var wrapper = kind === "async-generator" ? "asyncGen" : "async";

        return "" + (head) + "(" + (outerParams) + ") { " +
            "return _esdown." + (wrapper) + "(function*(" + (this.joinList(params)) + ") " +
            "" + (body) + ".apply(this, arguments)); }";
    },

    rawToString: function(raw) {

        raw = raw.replace(/([^\n])?\n/g, function(m, m1) { return m1 === "\\" ? m : (m1 || "") + "\\n\\\n"; });
        raw = raw.replace(/([^"])?"/g, function(m, m1) { return m1 === "\\" ? m : (m1 || "") + '\\"'; });

        return '"' + raw + '"';
    },

    isVarScope: function(node) {

        switch (node.type) {

            case "ArrowFunction":
            case "FunctionDeclaration":
            case "FunctionExpression":
            case "MethodDefinition":
            case "Script":
            case "Module":
                return true;
        }

        return false;
    },

    parentFunction: function(node) {

        for (var p = node.parent; p; p = p.parent)
            if (this.isVarScope(p))
                return p;

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
            this.identifyModule(node.value) :
            this.stringify(node);
    },

    identifyModule: function(url) {

        var legacy = false;

        url = url.trim();

        if (isLegacyScheme(url)) {

            url = removeScheme(url).trim();
            legacy = true;
        }

        if (typeof this.imports[url] !== "string") {

            this.imports[url] = "_M" + (this.uid++);
            this.dependencies.push({ url: url, legacy: legacy });
        }

        return this.imports[url];
    },

    stringify: function(node) {

        var offset = node.start,
            input = this.input,
            text = "";

        // Build text from child nodes
        node.children().forEach(function(child) {

            if (offset < child.start)
                text += input.slice(offset, child.start);

            text += child.text;
            offset = child.end;
        });

        if (offset < node.end)
            text += input.slice(offset, node.end);

        return text;
    },

    restParamVar: function(node) {

        var name = node.params[node.params.length - 1].identifier.value,
            pos = node.params.length - 1,
            temp = this.addTempVar(node, null, true);

        return "for (var " + (name) + " = [], " + (temp) + " = " + (pos) + "; " +
            "" + (temp) + " < arguments.length; " +
            "++" + (temp) + ") " + (name) + ".push(arguments[" + (temp) + "]);";

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
            return "_esdown.computed(" + (text || this.stringify(node)) + ", " + node.computedNames.join(", ") + ")";
    },

    functionInsert: function(node) { var __this = this; 

        var inserted = [];

        if (node.createThisBinding)
            inserted.push("var __this = this;");

        if (node.createRestBinding)
            inserted.push(this.restParamVar(node));

        node.params.forEach(function(param) {

            if (!param.pattern)
                return;

            var name = param.text;

            if (param.initializer)
                inserted.push("if (" + (name) + " === void 0) " + (name) + " = " + (param.initializer.text) + ";");

            if (__this.isPattern(param.pattern))
                inserted.push("var " +  __this.translatePattern(param.pattern, name).join(", ") + ";");
        });

        var temps = this.tempVars(node);

        // Add temp var declarations to the top of the insert
        if (temps)
            inserted.unshift(temps);

        return inserted.join(" ");
    },

    addTempVar: function(node, value, noDeclare) {

        var p = this.isVarScope(node) ? node : this.parentFunction(node);

        if (!p.tempVars)
            p.tempVars = [];

        var name = "__$" + p.tempVars.length;

        p.tempVars.push({ name: name, value: value, noDeclare: noDeclare });

        return name;
    },

    tempVars: function(node) {

        if (!node.tempVars)
            return "";

        var list = node.tempVars.filter(function(item) { return !item.noDeclare; });

        if (list.length === 0)
            return "";

        return "var " + list.map(function(item) {

            var out = item.name;

            if (typeof item.value === "string")
                out += " = " + item.value;

            return out;

        }).join(", ") + ";";
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

    awaitYield: function(context, text) {

        if (context.kind === "async-generator")
            text = "{ _esdown_await: (" + (text) + ") }";

        return "(yield " + (text) + ")";
    },

    wrapFunctionExpression: function(text, node) {

        for (var p = node.parent; p; p = p.parent) {

            if (this.isVarScope(p))
                break;

            if (p.type === "ExpressionStatement") {

                if (p.start === node.start)
                    return "(" + text + ")";

                break;
            }
        }

        return text;
    },

    joinList: function(list) {

        var input = this.input,
            offset = -1,
            text = "";

        list.forEach(function(child) {

            if (offset >= 0 && offset < child.start)
                text += input.slice(offset, child.start);

            text += child.text;
            offset = child.end;
        });

        return text;
    }, constructor: function Replacer() {}

} });

exports.Replacer = Replacer;


}).call(this, _M15);

(function(exports) {

var Runtime = _M17.Runtime;
var Replacer = _M15.Replacer;

var SIGNATURE = "/*=esdown=*/";

var WRAP_CALLEE = "(function(fn, deps, name) { " +

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

var WRAP_HEADER = "function(require, exports, module) { " +
    "'use strict'; " +
    "function __load(p, l) { " +
        "module.__es6 = !l; " +
        "var e = require(p); " +
        "if (e && e.constructor !== Object) e.default = e; " +
        "return e; " +
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

function translate(input, options) { if (options === void 0) options = {}; 

    input = sanitize(input);

    if (options.runtime) {

        input = "\n" +
            wrapRuntimeModule(Runtime.API) +
            wrapRuntimeModule(Runtime.ES6) +
            wrapRuntimeModule(Runtime.MapSet) +
            wrapRuntimeModule(Runtime.Promise) +
            input;
    }

    // Node modules are wrapped inside of a function expression, which allows
    // return statements
    if (options.functionContext)
        input = "(function(){" + input + "})";

    var replacer = options.replacer || new Replacer,
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
            replacer.dependencies.map(function(d) { return d.url; }),
            options.global);
    }

    return output;
}

function wrapModule(text, dep, global) {

    return SIGNATURE + WRAP_CALLEE + "(" +
        WRAP_HEADER + text + WRAP_FOOTER + ", " +
        JSON.stringify(dep) + ", " +
        JSON.stringify(global || "") +
    ");";
}

function isWrapped(text) {

    return text.indexOf(SIGNATURE) === 0;
}

exports.translate = translate;
exports.wrapModule = wrapModule;
exports.isWrapped = isWrapped;


}).call(this, _M8);

(function(exports) {

var Path = _M3;
var FS = _M2;

var NODE_PATH = typeof process !== "undefined" && process.env["NODE_PATH"] || "",
    NOT_PACKAGE = /^(?:\.{0,2}\/|[a-z]+:)/i,
    Module = module.constructor,
    packageRoots;

function isFile(path) {

    var stat;

    try { stat = FS.statSync(path) }
    catch (x) {}

    return stat && stat.isFile();
}

function isDirectory(path) {

    var stat;

    try { stat = FS.statSync(path) }
    catch (x) {}

    return stat && stat.isDirectory();
}

function getFolderEntry(dir) {

    var path;

    // Look for an ES entry point (default.js)
    path = Path.join(dir, "default.js");

    if (isFile(path))
        return { path: path };

    // Look for a legacy entry point (package.json or index.js)
    path = Module._findPath("./", [dir]);

    if (path)
        return { path: path, legacy: true };

    return null;
}

function locateModule(path, base) {

    if (isPackageSpecifier(path))
        return locatePackage(path, base);

    if (path.charAt(0) !== "." && path.charAt(0) !== "/")
        return { path: path };

    path = Path.resolve(base, path);

    if (isDirectory(path))
        return getFolderEntry(path);

    return { path: path };
}

function isPackageSpecifier(spec) {

    return !NOT_PACKAGE.test(spec);
}

function locatePackage(name, base) {

    if (NOT_PACKAGE.test(name))
        throw new Error("Not a package specifier");

    var pathInfo;

    if (!packageRoots)
        packageRoots = NODE_PATH.split(Path.delimiter).map(function(v) { return v.trim(); });

    var list = Module._nodeModulePaths(base).concat(packageRoots);

    list.some(function(root) {

        pathInfo = getFolderEntry(Path.resolve(root, name));

        if (pathInfo)
            return true;
    });

    if (!pathInfo)
        throw new Error("Package " + (name) + " could not be found.");

    return pathInfo;
}

exports.locateModule = locateModule;
exports.isPackageSpecifier = isPackageSpecifier;
exports.locatePackage = locatePackage;


}).call(this, _M14);

(function(exports) {

var FS = _M2;
var REPL = _M10;
var VM = _M11;
var Path = _M3;
var Util = _M12;

var Style = _M4.ConsoleStyle;
var parse = _M13.parse;
var translate = _M8.translate;
var isPackageSpecifier = _M14.isPackageSpecifier, locateModule = _M14.locateModule;

var Module = module.constructor;

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

    var moduleLoad = Module._load;

    Module.prototype.importSync = function(path) {

        if (/^node:/.test(path)) {

            path = path.slice(5);
            this.__es6 = false;

        } else {

            this.__es6 = true;
        }

        var e = this.require(path);
        if (e && e.constructor !== Object) e.default = e;
        return e;
    };

    Module._load = function(request, parent, isMain) {

        if (parent.__es6) {

            var loc = locateModule(request, Path.dirname(parent.filename));

            request = loc.path;

            if (loc.legacy)
                parent.__es6 = false;
        }

        var m = moduleLoad(request, parent, isMain);
        parent.__es6 = false;
        return m;
    };

    // Compile ES6 js files
    require.extensions[".js"] = function(module, filename) {

        var text, source;

        try {

            text = source = FS.readFileSync(filename, "utf8");

            // Only translate as a module if the source module is requesting
            // via import syntax
            var m = !!module.parent.__es6;

            text = translate(text, { wrap: m, module: m, functionContext: !m });

        } catch (e) {

            if (e instanceof SyntaxError)
                e = new SyntaxError(formatSyntaxError(e, filename));

            throw e;
        }

        return module._compile(text, filename);
    };
}

function runModule(path) {

    addExtension();

    if (isPackageSpecifier(path))
        path = "./" + path;

    var loc = locateModule(path, process.cwd());

    // "__load" is defined in the module wrapper and ensures that the
    // target is loaded as a module

    var m = __load(loc.path);

    if (m && typeof m.main === "function") {

        var result = m.main(process.argv);
        Promise.resolve(result).then(null, function(x) { return setTimeout(function($) { throw x }, 0); });
    }
}

function startREPL() {

    // Node 0.10.x pessimistically wraps all input in parens and then
    // re-evaluates function expressions as function declarations.  Since
    // Node is unaware of class declarations, this causes classes to
    // always be interpreted as expressions in the REPL.
    var removeParens = process.version.startsWith("v0.10.");

    addExtension();

    console.log("esdown " + (_esdown.version) + " (Node " + (process.version) + ")");

    var prompt = ">>> ", contPrompt = "... ";

    var repl = REPL.start({

        prompt: prompt,

        useGlobal: true,

        eval: function(input, context, filename, cb) { var __this = this; 

            var text, result, script, displayErrors = false;

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

                script = VM.createScript(text, { filename: filename, displayErrors: displayErrors });

                result = repl.useGlobal ?
                    script.runInThisContext({ displayErrors: displayErrors }) :
                    script.runInContext(context, { displayErrors: displayErrors });

            } catch (x) {

                return cb(x);
            }

            if (result instanceof Promise) {

                // Without displayPrompt, asynchronously calling the "eval"
                // callback results in no text being displayed on the screen.

                var token = {};

                Promise.race([

                    result,
                    new Promise(function(a) { return setTimeout(function($) { return a(token); }, 3000); }),
                ])
                .then(function(x) {

                    if (x === token)
                        return void cb(null, result);

                    __this.outputStream.write(Style.gray("(async) "));
                    cb(null, x);
                })
                .catch(function(err) { return cb(err, null); })
                .then(function($) { return __this.displayPrompt(); });

            } else {

                cb(null, result);
            }
        }
    });

    // Override displayPrompt so that ellipses are displayed for
    // cross-line continuations

    if (typeof repl.displayPrompt === "function" &&
        typeof repl._prompt === "string") {

        var displayPrompt = repl.displayPrompt;

        repl.displayPrompt = function(preserveCursor) {

            this._prompt = this.bufferedCommand ? contPrompt : prompt;
            return displayPrompt.call(this, preserveCursor);
        };
    }

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

    function translateAction(input, module) {

        var text;

        try {

            text = translate(input, { wrap: false, module: true });

        } catch (x) {

            text = x instanceof SyntaxError ?
                formatSyntaxError(x, "REPL") :
                x.toString();
        }

        console.log(text);
    }

    var commands = {

        "help": {

            help: "Show REPL commands",

            action: function() { var __this = this; 

                var list = Object.keys(this.commands).sort(),
                    len = list.reduce(function(n, key) { return Math.max(n, key.length); }, 0);

                list.forEach(function(key) {

                    var help = __this.commands[key].help || "",
                        pad = " ".repeat(4 + len - key.length);

                    __this.outputStream.write(key + pad + help + "\n");
                });

                this.displayPrompt();
            }

        },

        "translate": {

            help: "Translate an ES6 script to ES5 and show the result (esdown)",

            action: function(input) {

                translateAction(input, false);
                this.displayPrompt();
            }
        },

        "translateModule": {

            help: "Translate an ES6 module to ES5 and show the result (esdown)",

            action: function(input) {

                translateAction(input, true);
                this.displayPrompt();
            }
        },

        "parse": {

            help: "Parse a script and show the AST (esdown)",

            action: function(input) {

                parseAction(input, false);
                this.displayPrompt();
            }

        },

        "parseModule": {

            help: "Parse a module and show the AST (esdown)",

            action: function(input) {

                parseAction(input, true);
                this.displayPrompt();
            }

        },
    };

    if (typeof repl.defineCommand === "function")
        Object.keys(commands).forEach(function(key) { return repl.defineCommand(key, commands[key]); });
}

exports.formatSyntaxError = formatSyntaxError;
exports.runModule = runModule;
exports.startREPL = startREPL;


}).call(this, _M6);

(function(exports) {

var Path = _M3;
var readFile = _M5.readFile;
var isPackageSpecifier = _M14.isPackageSpecifier, locateModule = _M14.locateModule;
var translate = _M8.translate, wrapModule = _M8.wrapModule;
var Replacer = _M15.Replacer;
var isLegacyScheme = _M16.isLegacyScheme, removeScheme = _M16.removeScheme, hasScheme = _M16.hasScheme;


var Node = _esdown.class(function(__super) { return {

    constructor: function Node(path, name) {

        this.path = path;
        this.name = name;
        this.edges = new Set;
        this.output = null;
    }
} });

var GraphBuilder = _esdown.class(function(__super) { return {

    constructor: function GraphBuilder(root) {

        this.nodes = new Map;
        this.nextID = 1;
        this.root = this.add(root);
    },

    has: function(key) {

        return this.nodes.has(key);
    },

    add: function(key) {

        if (this.nodes.has(key))
            return this.nodes.get(key);

        var name = "_M" + (this.nextID++),
            node = new Node(key, name);

        this.nodes.set(key, node);
        return node;
    },

    sort: function(key) { var __this = this; if (key === void 0) key = this.root.path; 

        var visited = new Set,
            list = [];

        var visit = function(key) {

            if (visited.has(key))
                return;

            visited.add(key);
            var node = __this.nodes.get(key);
            node.edges.forEach(visit);
            list.push(node);
        };

        visit(key);

        return list;
    },

    process: function(key, input) { var __this = this; 

        if (!this.nodes.has(key))
            throw new Error("Node not found");

        var node = this.nodes.get(key);

        if (node.output !== null)
            throw new Error("Node already processed");

        var replacer = new Replacer,
            dir = Path.dirname(node.path);

        replacer.identifyModule = function(path) {

            // REVISIT:  Does not currently allow bundling of legacy modules
            path = locateModule(path, dir).path;
            node.edges.add(path);
            return __this.add(path).name;
        };

        node.output = translate(input, { replacer: replacer, module: true });

        return node;
    }

} });

function bundle(rootPath, options) { if (options === void 0) options = {}; 

    rootPath = Path.resolve(rootPath);

    var builder = new GraphBuilder(rootPath),
        visited = new Set,
        pending = 0,
        resolver,
        allFetched;

    allFetched = new Promise(function(resolve, reject) { return resolver = { resolve: resolve, reject: reject }; });

    function visit(path) {

        // Exit if module has already been processed
        if (visited.has(path))
            return;

        visited.add(path);
        pending += 1;

        readFile(path, { encoding: "utf8" }).then(function(code) {

            var node = builder.process(path, code);

            node.edges.forEach(function(path) {

                // If we want to optionally limit the scope of the bundle, we
                // will need to apply some kind of filter here.

                // Do not bundle any files that start with a scheme prefix
                if (!hasScheme(path))
                    visit(path);
            });

            pending -= 1;

            if (pending === 0)
                resolver.resolve(null);

        }).then(null, function(err) {

            if (err instanceof SyntaxError && "sourceText" in err)
                err.filename = path;

            resolver.reject(err);
        });
    }

    visit(rootPath);

    return allFetched.then(function($) {

        var nodes = builder.sort(),
            dependencies = [],
            output = "";

        var varList = nodes.map(function(node) {

            if (node.output === null) {

                var path = node.path,
                    legacy = "";

                if (isLegacyScheme(path)) {

                    path = removeScheme(node.path);
                    legacy = ", 1";
                }

                dependencies.push(path);

                return "" + (node.name) + " = __load(" + (JSON.stringify(path)) + "" + (legacy) + ")";
            }

            return "" + (node.name) + " = " + (node.path === rootPath ? "exports" : "{}") + "";

        }).join(", ");

        if (varList)
            output += "var " + varList + ";\n";

        nodes.filter(function(n) { return n.output !== null; }).forEach(function(node) {

            output +=
                "\n(function(exports) {\n\n" +
                node.output +
                "\n\n}).call(this, " + node.name + ");\n";
        });

        if (options.runtime)
            output = translate("", { runtime: true, module: true }) + "\n\n" + output;

        return wrapModule(output, dependencies, options.global);
    });
}

exports.bundle = bundle;


}).call(this, _M7);

(function(exports) {

var FS = _M2;
var Path = _M3;
var ConsoleCommand = _M4.ConsoleCommand;
var readFile = _M5.readFile, writeFile = _M5.writeFile;
var runModule = _M6.runModule, startREPL = _M6.startREPL, formatSyntaxError = _M6.formatSyntaxError;
var bundle = _M7.bundle;
var translate = _M8.translate;



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

        execute: function(input) {

            process.argv.splice(1, 1);

            if (input) runModule(input);
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

            var promise = null;

            if (params.bundle) {

                promise = bundle(params.input, {

                    global: params.global,
                    runtime: params.runtime
                });

            } else {

                promise = params.input ?
                    readFile(params.input, { encoding: "utf8" }) :
                    Promise.resolve("");

                promise = promise.then(function(text) {

                    return translate(text, {

                        global: params.global,
                        runtime: params.runtime,
                        wrap: true,
                        module: true
                    });
                });
            }

            promise.then(function(text) {

                if (params.output) {

                    var outPath = getOutPath(params.input, params.output);
                    return writeFile(outPath, text, "utf8");

                } else {

                    process.stdout.write(text + "\n");
                }

            }).then(null, function(x) {

                if (x instanceof SyntaxError) {

                    var filename;

                    if (!params.bundle)
                        filename = Path.resolve(params.input);

                    process.stdout.write("\nSyntax Error: " + (formatSyntaxError(x, filename)) + "\n");
                    return;
                }

                setTimeout(function($) { throw x }, 0);
            });
        }

    }).run();
}

exports.translate = translate;
exports.bundle = bundle;
exports.main = main;


}).call(this, _M1);


}, ["fs","path","repl","vm","util"], "esdown");