export let Runtime = {};

Runtime.API = 

`const VERSION = "0.9.6";

function globalObject() {

    try { return global.global } catch (x) {}
    try { return window.window } catch (x) {}
    return null;
}

let arraySlice = Array.prototype.slice,
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

    let names = Object.getOwnPropertyNames(obj);

    for (let i = 0; i < names.length; ++i)
        fn(names[i], Object.getOwnPropertyDescriptor(obj, names[i]));

    names = Object.getOwnPropertySymbols(obj);

    for (let i = 0; i < names.length; ++i)
        fn(names[i], Object.getOwnPropertyDescriptor(obj, names[i]));

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

// Installs methods into an object, merging "get" and "set" functions
function mergeMethods(from, to) {

    forEachDesc(from, (name, desc) => {

        if (desc.get || desc.set) {

            let prev = Object.getOwnPropertyDescriptor(to, name);

            if (prev) {

                desc.get = desc.get || prev.get;
                desc.set = desc.set || prev.set;
            }
        }

        desc.enumerable = false;
        Object.defineProperty(to, name, desc);
    });
}

// Builds a class
function buildClass(base, def) {

    let parent;

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

    // Create the prototype object
    let proto = Object.create(parent),
        statics = {},
        addMethods = obj => mergeMethods(obj, proto),
        addStatics = obj => mergeMethods(obj, statics);

    Object.assign(addMethods, {
        static: addStatics,
        super: parent,
        csuper: base || Function.prototype
    });

    // Generate method collections, closing over super bindings
    def(addMethods);

    if (!hasOwn.call(proto, "constructor"))
        throw new Error("No constructor specified");

    // Make constructor non-enumerable
    Object.defineProperty(proto, "constructor", {
        enumerable: false,
        writable: true,
        configurable: true
    });

    let ctor = proto.constructor;

    // Set constructor's prototype
    ctor.prototype = proto;

    // Set class "static" methods
    forEachDesc(statics, (name, desc) => Object.defineProperty(ctor, name, desc));

    // "Inherit" from base constructor
    if (base) inherit(ctor, base);

    return ctor;
}

Global._esdown = {

    version: VERSION,

    global: Global,

    class: buildClass,

    // Support for iterator protocol
    iter(obj) {

        if (obj[Symbol.iterator] !== void 0)
            return obj[Symbol.iterator]();

        if (Array.isArray(obj))
            return obj.values();

        return obj;
    },

    skipOne(iter) {

        iter.next();
        return iter;
    },

    asyncIter(obj) {

        if (obj[Symbol.asyncIterator] !== void 0)
            return obj[Symbol.asyncIterator]();

        let iter = { [Symbol.asyncIterator]() { return this } },
            inner = _esdown.iter(obj);

        ["next", "throw", "return"].forEach(name => {

            if (name in inner)
                iter[name] = value => Promise.resolve(inner[name](value));
        });

        return iter;
    },

    // Support for computed property names
    computed(obj) {

        let name, desc;

        for (let i = 1; i < arguments.length; ++i) {

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
    async(iter) {

        return new Promise((resolve, reject) => {

            resume("next", void 0);

            function resume(type, value) {

                try {

                    let result = iter[type](value);

                    if (result.done) {

                        resolve(result.value);

                    } else {

                        Promise.resolve(result.value).then(
                            x => resume("next", x),
                            x => resume("throw", x));
                    }

                } catch (x) { reject(x) }
            }
        });
    },

    // Support for async generators
    asyncGen(iter) {

        let observer = null,
            current = null,
            queue = [];

        return {

            next(val) { return enqueue("next", val) },
            throw(val) { return enqueue("throw", val) },
            return(val) { return enqueue("return", val) },
            [Symbol.asyncIterator]() { return this },

            observe(sink) {

                if (observer)
                    throw new Error("Already observing");

                return new Observable(sink => {

                    observer = sink;

                    if (!current)
                        next();

                    // TODO:  Should this be allowed?  If so, then what happens
                    // if next value is delivered and observer is now null?  Does
                    // the data get dropped?  That's what currently happens.
                    return _=> { observer = null };

                }).observe(sink);
            }
        };

        function enqueue(type, value) {

            if (observer)
                return Promise.reject(new Error("Cannot iterate in while observing"));

            return new Promise((resolve, reject) => {

                queue.push({ type, value, resolve, reject });

                if (!current)
                    next();
            });
        }

        function next() {

            if (queue.length > 0) {

                current = queue.shift();
                resume(current.type, current.value);

            } else {

                current = null;

                if (observer)
                    resume("next", void 0);
            }
        }

        function deliver(type, value) {

            if (current) {

                if (type === "throw")
                    current.reject(value);
                else
                    current.resolve({ value, done: (type === "return") });

            } else if (observer) {

                let obs = observer;

                if (type === "return" || type === "throw")
                    observer = null;

                // TODO:  What if observer throws?
                obs[type](value);
            }
        }

        function resume(type, value) {

            if (type === "return" && !(type in iter)) {

                // HACK: If the generator does not support the "return" method, then
                // emulate it (poorly) using throw.  (V8 circa 2015-02-13 does not support
                // generator.return.)
                type = "throw";
                value = { value, __return: true };
            }

            try {

                let result = iter[type](value);

                value = result.value;

                if (typeof value === "object" && "_esdown_await" in value) {

                    if (result.done)
                        throw new Error("Invalid async generator return");

                    Promise.resolve(value._esdown_await).then(
                        x => resume("next", x),
                        x => resume("throw", x));

                    return;

                } else {

                    type = result.done ? "return" : "next";
                }

            } catch (x) {

                if (x && x.__return === true) {

                    // HACK: Return-as-throw
                    type = "return";
                    value = x.value;

                } else {

                    type = "throw";
                    value = x;
                }
            }

            deliver(type, value);
            next();
        }
    },

    // Support for spread operations
    spread() {

        return {

            a: [],

            // Add items
            s() {

                for (let i = 0; i < arguments.length; ++i)
                    this.a.push(arguments[i]);

                return this;
            },

            // Add the contents of iterables
            i(list) {

                if (Array.isArray(list)) {

                    this.a.push.apply(this.a, list);

                } else {

                    for (let item of list)
                        this.a.push(item);
                }

                return this;
            }

        };
    },

    // Support for object destructuring
    objd(obj) {

        return toObject(obj);
    },

    // Support for array destructuring
    arrayd(obj) {

        if (Array.isArray(obj)) {

            return {

                at(skip, pos) { return obj[pos] },
                rest(skip, pos) { return obj.slice(pos) }
            };
        }

        let iter = _esdown.iter(toObject(obj));

        return {

            at(skip) {

                let r;

                while (skip--)
                    r = iter.next();

                return r.value;
            },

            rest(skip) {

                let a = [], r;

                while (--skip)
                    r = iter.next();

                while (r = iter.next(), !r.done)
                    a.push(r.value);

                return a;
            }
        };
    },

    // Support for private fields
    getPrivate(obj, key) {

        if (!key.has(Object(obj)))
            throw new TypeError;

        return key.get(obj);
    },

    setPrivate(obj, key, value) {

        if (!key.has(Object(obj)))
            throw new TypeError;

        return key.set(obj, value);
    }

};
`;

Runtime.Polyfill = 

`// === Polyfill Utilities ===

function eachKey(obj, fn) {

    let keys = Object.getOwnPropertyNames(obj);

    for (let i = 0; i < keys.length; ++i)
        fn(keys[i]);

    if (!Object.getOwnPropertySymbols)
        return;

    keys = Object.getOwnPropertySymbols(obj);

    for (let i = 0; i < keys.length; ++i)
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

    let n = +val;

    if (n === 0 || Number.isNaN(n))
        return n;

    return n < 0 ? -1 : 1;
};

function toInteger(val) {

    let n = +val;

    return n !== n /* n is NaN */ ? 0 :
        (n === 0 || !isFinite(n)) ? n :
        sign(n) * Math.floor(Math.abs(n));
}

function toLength(val) {

    let n = toInteger(val);
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

    let m = obj[Symbol.iterator];

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

let symbolCounter = 0,
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

    // Experimental async observation support
    observe: Symbol("observe")

});

// === Object ===

polyfill(Object, {

    is: sameValue,

    assign(target, source) {

        target = toObject(target);

        for (let i = 1; i < arguments.length; ++i) {

            source = arguments[i];

            if (source != null) // null or undefined
                Object.keys(source).forEach(key => target[key] = source[key]);
        }

        return target;
    },

    setPrototypeOf(object, proto) {

        // Least effort attempt
        object.__proto__ = proto;
    },

    getOwnPropertySymbols() {

        // If getOwnPropertySymbols is not supported, then just return an
        // empty array so that we can avoid feature testing
    }

});

// === Number ===

function isInteger(val) {

    return typeof val === "number" && isFinite(val) && toInteger(val) === val;
}

function epsilon() {

    // Calculate the difference between 1 and the smallest value greater than 1 that
    // is representable as a Number value

    let result;

    for (let next = 1; 1 + next !== 1; next = next / 2)
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

        let raw = callsite.raw,
            len = toLength(raw.length);

        if (len === 0)
            return "";

        let s = "", i = 0;

        while (true) {

            s += raw[i];
            if (i + 1 === len || i >= args.length) break;
            s += args[i++];
        }

        return s;
    },

    fromCodePoint(...points) {

        let out = [];

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
    let half = repeat(s, n / 2);
    return half + half;
}

class StringIterator {

    constructor(string) {

        this.string = string;
        this.current = 0;
    }

    next() {

        let s = this.string,
            i = this.current,
            len = s.length;

        if (i >= len) {

            this.current = Infinity;
            return { value: void 0, done: true };
        }

        let c = s.charCodeAt(i),
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

        let string = String(this);

        count = toInteger(count);

        if (count < 0 || count === Infinity)
            throw new RangeError("Invalid count value");

        return repeat(string, count);
    },

    startsWith(search) {

        assertThis(this, "String.prototype.startsWith");

        if (isRegExp(search))
            throw new TypeError("First argument to String.prototype.startsWith must not be a regular expression");

        let string = String(this);

        search = String(search);

        let pos = arguments.length > 1 ? arguments[1] : undefined,
            start = Math.max(toInteger(pos), 0);

        return string.slice(start, start + search.length) === search;
    },

    endsWith(search) {

        assertThis(this, "String.prototype.endsWith");

        if (isRegExp(search))
            throw new TypeError("First argument to String.prototype.endsWith must not be a regular expression");

        let string = String(this);

        search = String(search);

        let len = string.length,
            arg = arguments.length > 1 ? arguments[1] : undefined,
            pos = arg === undefined ? len : toInteger(arg),
            end = Math.min(Math.max(pos, 0), len);

        return string.slice(end - search.length, end) === search;
    },

    contains(search) {

        assertThis(this, "String.prototype.contains");

        let string = String(this),
            pos = arguments.length > 1 ? arguments[1] : undefined;

        // Somehow this trick makes method 100% compat with the spec
        return string.indexOf(search, pos) !== -1;
    },

    codePointAt(pos) {

        assertThis(this, "String.prototype.codePointAt");

        let string = String(this),
            len = string.length;

        pos = toInteger(pos);

        if (pos < 0 || pos >= len)
            return undefined;

        let a = string.charCodeAt(pos);

        if (a < 0xD800 || a > 0xDBFF || pos + 1 === len)
            return a;

        let b = string.charCodeAt(pos + 1);

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

        let length = toLength(this.array.length),
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

        let ctor = typeof this === "function" ? this : Array, // TODO: Always use "this"?
            map = arguments[1],
            thisArg = arguments[2],
            i = 0,
            out;

        if (map !== void 0 && typeof map !== "function")
            throw new TypeError(map + " is not a function");

        var getIter = iteratorMethod(list);

        if (getIter) {

            let iter = getIter.call(list),
                result;

            out = new ctor;

            while (result = iter.next(), !result.done) {

                out[i++] = map ? map.call(thisArg, result.value, i) : result.value;
                out.length = i;
            }

        } else {

            let len = toLength(list.length);

            out = new ctor(len);

            for (; i < len; ++i)
                out[i] = map ? map.call(thisArg, list[i], i) : list[i];

            out.length = len;
        }

        return out;
    },

    of(...items) {

        let ctor = typeof this === "function" ? this : Array; // TODO: Always use "this"?

        if (ctor === Array)
            return items;

        let len = items.length,
            out = new ctor(len);

        for (let i = 0; i < len; ++i)
            out[i] = items[i];

        out.length = len;

        return out;
    }

});

function arrayFind(obj, pred, thisArg, type) {

    let len = toLength(obj.length),
        val;

    if (typeof pred !== "function")
        throw new TypeError(pred + " is not a function");

    for (let i = 0; i < len; ++i) {

        val = obj[i];

        if (pred.call(thisArg, val, i, obj))
            return type === "value" ? val : i;
    }

    return type === "value" ? void 0 : -1;
}

polyfill(Array.prototype, {

    copyWithin(target, start) {

        let obj = toObject(this),
            len = toLength(obj.length),
            end = arguments[2];

        target = toInteger(target);
        start = toInteger(start);

        let to = target < 0 ? Math.max(len + target, 0) : Math.min(target, len),
            from = start < 0 ? Math.max(len + start, 0) : Math.min(start, len);

        end = end !== void 0 ? toInteger(end) : len;
        end = end < 0 ? Math.max(len + end, 0) : Math.min(end, len);

        let count = Math.min(end - from, len - to),
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

        let obj = toObject(this),
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

`let global = _esdown.global,
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

        let node = this.current;

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

    throw new TypeError("Map and Set keys must be strings or numbers in esdown");
}

class Map {

    constructor() {

        if (arguments.length > 0)
            throw new Error("Arguments to Map constructor are not supported in esdown");

        this._index = {};
        this._origin = new MapNode(ORIGIN);
    }

    clear() {

        for (let node = this._origin.next; node !== this._origin; node = node.next)
            node.key = REMOVED;

        this._index = {};
        this._origin = new MapNode(ORIGIN);
    }

    delete(key) {

        let h = hashKey(key),
            node = this._index[h];

        if (node) {

            node.remove();
            delete this._index[h];
            return true;
        }

        return false;
    }

    forEach(fn) {

        let thisArg = arguments[1];

        if (typeof fn !== "function")
            throw new TypeError(fn + " is not a function");

        for (let node = this._origin.next; node.key !== ORIGIN; node = node.next)
            if (node.key !== REMOVED)
                fn.call(thisArg, node.value, node.key, this);
    }

    get(key) {

        let h = hashKey(key),
            node = this._index[h];

        return node ? node.value : void 0;
    }

    has(key) {

        return hashKey(key) in this._index;
    }

    set(key, val) {

        let h = hashKey(key),
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
            throw new Error("Arguments to Set constructor are not supported in esdown");

        this._index = {};
        this._origin = new MapNode(ORIGIN);
    }

    add(key) { return mapSet.call(this, key, key) }

    [Symbol.iterator]() { return new MapIterator(this._origin.next, "entries") }

}

// Copy shared prototype members to Set
["clear", "delete", "forEach", "has", "size", "keys", "values", "entries"].forEach(k => {

    let d = Object.getOwnPropertyDescriptor(Map.prototype, k);
    Object.defineProperty(Set.prototype, k, d);
});

if (!global.Map || !global.Map.prototype.entries) {

    global.Map = Map;
    global.Set = Set;
}
`;

Runtime.Promise = 

`(function() { "use strict";

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
`;

Runtime.Observable = 

`class Observable {

    constructor(start) {

        // The stream initializer must be a function
        if (typeof start !== "function")
            throw new TypeError("Observer definition is not a function");

        this._start = start;
    }

    observe(sink) {

        if (typeof sink === "function")
            sink = { next: sink };

        // The sink must be an object
        if (Object(sink) !== sink)
            throw new TypeError("Sink is not an object");

        let start = this._start,
            finished = false,
            cleanup;

        // Wrap the provided sink
        sink = _wrapSink(sink, _=> {

            finished = true;

            if (cleanup !== void 0)
                cleanup();
        });

        try {

            // Call the stream initializer.  The initializer will return a cleanup
            // function or undefined.
            cleanup = start.call(void 0, sink);

        } catch (e) {

            sink.throw(e);
        }

        // If the stream is already finished, then perform cleanup
        if (finished && cleanup !== void 0)
            cleanup();

        // Return a cancelation function
        return sink.return;
    }

    /*

        Observer sinks are wrapped for the following reasons:

        - Ensures that the sink is not called after the stream is closed.
        - Ensures that the returned object has all three sink methods ("next", "throw", and "return").
        - Ensures that values are properly handled when the sink does not have "throw" or "return".
        - Ensures that returned methods can be called without a provided "this" value.
        - Ensures that cleanup is triggered when the stream is closed.

    */
    function _wrapSink(sink, cleanup) {

        let done = false;

        // Marks the stream as closed and triggers stream cleanup.  Exceptions
        // which occur during cleanup are propagated to the caller.
        function close() {

            if (!done) {

                done = true;
                cleanup();
            }
        }

        // Returns a "done" result
        function doneResult() {

            return { value: void 0, done: true };
        }

        // Sends a completion value to the sink
        function send(op, value) {

            // If the stream if closed, then return a "done" result
            if (done)
                return doneResult();

            let result;

            try {

                switch (op) {

                    case "next":

                        // Send the next value to the sink
                        result = sink.next(value);
                        break;

                    case "throw":

                        // If the sink does not support "throw", then throw value back to caller
                        if (!("throw" in sink))
                            throw value;

                        result = sink.throw(value);
                        break;

                    case "return":

                        // If the sink does not support "return", then close and return a done result
                        if (!("return" in sink))
                            return close(), doneResult();

                        result = sink.return(value);

                        // If the sink does not return a result, then assume that it is finished
                        if (!result)
                            result = doneResult();

                        break;

                }

            } catch (e) {

                // If the sink throws, then close the stream and throw error to caller
                close();
                throw e;
            }

            // If the sink is finished receiving data, then close the stream
            if (result && result.done)
                close();

            return result;
        }

        return {
            next(value) { return send("next", value) },
            throw(value) { return send("throw", value) },
            return(value) { return send("return", value) },
        };
    }

    forEach(fn) {

        return new Promise((resolve, reject) => {

            this.observe({

                next: fn,
                throw: reject,
                return: resolve,
            });
        });
    }

    map(fn) {

        if (typeof fn !== "function")
            throw new TypeError("Callback is not a function");

        return new this.constructor(sink => this.observe({

            next(value) {

                try { value = fn(value) }
                catch (e) { return sink.throw(e) }

                return sink.next(value);
            },

            throw: sink.throw,
            return: sink.return,

        }));
    }

    [Symbol.asyncIterator]() {

        let pending = [], ready = [];

        function current() {

            if (pending.length > 0)
                return pending.shift();

            let d;
            ready.push(new Promise((resolve, reject) => d = { resolve, reject }));
            return d;
        }

        let cancel = this.observe({

            next(value) { current().resolve({ value, done: false }) },
            throw(value) { current().reject(value) },
            return(value) { current().resolve({ value, done: true }) },
        });

        return {

            next() {

                if (ready.length > 0)
                    return ready.shift();

                return new Promise((resolve, reject) => pending.push({ resolve, reject }));
            },

            throw(value) {

                return new Promise((resolve, reject) => {

                    cancel();
                    reject(value);
                });
            },

            return() {

                return new Promise(resolve => {

                    cancel();
                    resolve({ value: void 0, done: true });
                });
            },
        };
    }

}


if (!_esdown.global.Observable)
    _esdown.global.Observable = Observable;
`;

