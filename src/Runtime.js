export var Runtime = {};

Runtime.API = 

`function globalObject() {

    try { return global.global } catch (x) {}
    try { return window.window } catch (x) {}
    return null;
}

var arraySlice = Array.prototype.slice,
    hasOwn = Object.prototype.hasOwnProperty,
    staticName = /^__static_/,
    Global = globalObject();

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

Global._es6now = {

    version: "0.8.9",

    global: Global,

    class: buildClass,

    // Support for iterator protocol
    iter(obj) {

        if (typeof Symbol !== "undefined" && Symbol.iterator && obj[Symbol.iterator] !== void 0)
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

        try {

            var iter = _es6now.iter(iterable),
                resolver,
                promise;

            promise = new Promise((resolve, reject) => resolver = { resolve, reject });
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

                if (result.done)
                    value.then(resolver.resolve, resolver.reject);
                else
                    value.then(x => resume("next", x), x => resume("throw", x));

            } catch (x) { resolver.reject(x) }
        }
    },

    // Support for async generators
    asyncGen(waitToken, iterable) {

        var iter = _es6now.iter(iterable),
            state = "paused",
            queue = [];

        return {

            next(val) { return enqueue("next", val) },
            throw(val) { return enqueue("throw", val) },
            return(val) { return enqueue("return", val) }
        };

        function enqueue(type, value) {

            var resolve, reject;
            var promise = new Promise((res, rej) => (resolve = res, reject = rej));

            queue.push({ type, value, resolve, reject });

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
                value = { value, __return: true };
            }

            try {

                var result = iter[type](value);

                if (result.value === waitToken) {

                    if (result.done)
                        throw new Error("Invalid async generator return");

                    result.value.value.then(
                        x => resume("next", x),
                        x => resume("throw", x));

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

`// === Polyfill Utilities ===

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
    global = _es6now.global;

function fakeSymbol() {

    return "__$" + Math.floor(Math.random() * 1e9) + "$" + (++symbolCounter) + "$__";
}

// NOTE:  As of Node 0.11.12, V8's Symbol implementation is a little wonky.
// There is no Object.getOwnPropertySymbols, so reflection doesn't seem to
// work like it should.  Furthermore, Node blows up when trying to inspect
// Symbol objects.  We expect to replace this override when V8's symbols
// catch up with the ES6 specification.

global.Symbol = fakeSymbol;

Symbol.iterator = Symbol("iterator");


// === Object ===

polyfill(Object, {

    is: sameValue,

    assign(target, source) {

        var error;

        target = toObject(target);

        for (var i = 1; i < arguments.length; ++i) {

            source = arguments[i];

            try { Object.keys(source).forEach(key => target[key] = source[key]) }
            catch (x) { error = error || x }
        }

        if (error)
            throw error;

        return target;
    },

    setPrototypeOf(object, proto) {

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
    isFinite(val) { return typeof val === "number" && isFinite(val) },
    isNaN(val) { return val !== val },
    isSafeInteger(val) { return isInteger(val) && Math.abs(val) <= Number.MAX_SAFE_INTEGER }

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
    },

    fromCodePoint(...points) {

        var out = [];

        points.forEach(next => {

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

        if (c >= 0xD800 && c <= 0xDBFF && i + 1 < s.length) {

            c = s.charCodeAt(i + 1);
            chars = (c < 0xDC00 || c > 0xDFFF) ? 1 : 2;
        }

        this.current += chars;

        return { value: s.slice(i, this.current), done: false };
    }

    [Symbol.iterator]() { return this }

}

polyfill(String.prototype, {

    repeat(count) {

        assertThis(this, "String.prototype.repeat");

        var string = String(this);

        count = toInteger(count);

        if (count < 0 || count === Infinity)
            throw new RangeError("Invalid count value");

        return repeat(string, count);
    },

    startsWith(search) {

        assertThis(this, "String.prototype.startsWith");

        if (isRegExp(search))
            throw new TypeError("First argument to String.prototype.startsWith must not be a regular expression");

        var string = String(this);

        search = String(search);

        var pos = arguments.length > 1 ? arguments[1] : undefined,
            start = Math.max(toInteger(pos), 0);

        return string.slice(start, start + search.length) === search;
    },

    endsWith(search) {

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

    contains(search) {

        assertThis(this, "String.prototype.contains");

        var string = String(this),
            pos = arguments.length > 1 ? arguments[1] : undefined;

        // Somehow this trick makes method 100% compat with the spec
        return string.indexOf(search, pos) !== -1;
    },

    codePointAt(pos) {

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

    [Symbol.iterator]() {

        assertThis(this, "String.prototype[Symbol.iterator]");
        return new StringIterator(this);
    }

});

// === Array ===

class ArrayIterator {

    constructor(array, kind) {

        this.array = array;
        this.current = 0;
        this.kind = kind;
    }

    next() {

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
    }

    [Symbol.iterator]() { return this }

}

polyfill(Array, {

    from(list) {

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

    of(...items) {

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

        if (i in obj) {

            val = obj[i];

            if (pred.call(thisArg, val, i, obj))
                return type === "value" ? val : i;
        }
    }

    return type === "value" ? void 0 : -1;
}

polyfill(Array.prototype, {

    copyWithin(target, start) {

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

    fill(value) {

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

    find(pred) {

        return arrayFind(toObject(this), pred, arguments[1], "value");
    },

    findIndex(pred) {

        return arrayFind(toObject(this), pred, arguments[1], "index");
    },

    values()  { return new ArrayIterator(this, "values") },

    entries() { return new ArrayIterator(this, "entries") },

    keys()    { return new ArrayIterator(this, "keys") },

    [Symbol.iterator]() { return this.values() }

});
`;

Runtime.MapSet = 

`var global = _es6now.global,
    ORIGIN = {},
    REMOVED = {};

class MapNode {

    constructor(key, val) {

        this.key = key;
        this.value = val;
        this.prev = this;
        this.next = this;
    }

    insert(next) {

        this.next = next;
        this.prev = next.prev;
        this.prev.next = this;
        this.next.prev = this;
    }

    remove() {

        this.prev.next = this.next;
        this.next.prev = this.prev;
        this.key = REMOVED;
    }

}

class MapIterator {

    constructor(node, kind) {

        this.current = node;
        this.kind = kind;
    }

    next() {

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
    }

    [Symbol.iterator]() { return this }
}

function hashKey(key) {

    switch (typeof key) {

        case "string": return "$" + key;
        case "number": return String(key);
    }

    throw new TypeError("Map and Set keys must be strings or numbers in es6now");
}

class Map {

    constructor() {

        if (arguments.length > 0)
            throw new Error("Arguments to Map constructor are not supported in es6now");

        this._index = {};
        this._origin = new MapNode(ORIGIN);
    }

    clear() {

        for (var node = this._origin.next; node !== this._origin; node = node.next)
            node.key = REMOVED;

        this._index = {};
        this._origin = new MapNode(ORIGIN);
    }

    delete(key) {

        var h = hashKey(key),
            node = this._index[h];

        if (node) {

            node.remove();
            delete this._index[h];
            return true;
        }

        return false;
    }

    forEach(fn) {

        var thisArg = arguments[1];

        if (typeof fn !== "function")
            throw new TypeError(fn + " is not a function");

        for (var node = this._origin.next; node.key !== ORIGIN; node = node.next)
            if (node.key !== REMOVED)
                fn.call(thisArg, node.value, node.key, this);
    }

    get(key) {

        var h = hashKey(key),
            node = this._index[h];

        return node ? node.value : void 0;
    }

    has(key) {

        return hashKey(key) in this._index;
    }

    set(key, val) {

        var h = hashKey(key),
            node = this._index[h];

        if (node) {

            node.value = val;
            return;
        }

        node = new MapNode(key, val);

        this._index[h] = node;
        node.insert(this._origin);
    }

    get size() {

        return Object.keys(this._index).length;
    }

    keys() { return new MapIterator(this._origin.next, "keys") }
    values() { return new MapIterator(this._origin.next, "values") }
    entries() { return new MapIterator(this._origin.next, "entries") }

    [Symbol.iterator]() { return new MapIterator(this._origin.next, "entries") }

}

var mapSet = Map.prototype.set;

class Set {

    constructor() {

        if (arguments.length > 0)
            throw new Error("Arguments to Set constructor are not supported in es6now");

        this._index = {};
        this._origin = new MapNode(ORIGIN);
    }

    add(key) { return mapSet.call(this, key, key) }

    [Symbol.iterator]() { return new MapIterator(this._origin.next, "entries") }

}

// Copy shared prototype members to Set
["clear", "delete", "forEach", "has", "size", "keys", "values", "entries"].forEach(k => {

    var d = Object.getOwnPropertyDescriptor(Map.prototype, k);
    Object.defineProperty(Set.prototype, k, d);
});

if (!global.Map || !global.Map.prototype.forEach) {

    global.Map = Map;
    global.Set = Set;
}
`;

Runtime.Promise = 

`var global = _es6now.global;

var enqueueMicrotask = ($=> {

    var window = global.window,
        process = global.process,
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

function isPromise(x) {

    return !!x && $status in Object(x);
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

        var deferred = promiseDefer(this),
            resolutions = [],
            count = 0;

        try {

            for (var item of values)
                this.resolve(item).then(onResolve(count++), deferred.reject);

            if (count === 0)
                deferred.resolve(resolutions);

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

        var deferred = promiseDefer(this);

        try {

            for (var item of values)
                this.resolve(item).then(deferred.resolve, deferred.reject);

        } catch(x) { deferred.reject(x) }

        return deferred.promise;
    }

}

if (!global.Promise)
    global.Promise = Promise;
`;

