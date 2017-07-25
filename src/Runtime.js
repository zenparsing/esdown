export let Runtime = {};

Runtime.API = 

`var VERSION = "1.1.21";

var GLOBAL = (function() {
    try { return global.global } catch (x) {}
    try { return self.self } catch (x) {}
    return null;
})();

var ownNames = Object.getOwnPropertyNames;
var ownSymbols = Object.getOwnPropertySymbols;
var getDesc = Object.getOwnPropertyDescriptor;
var defineProp = Object.defineProperty;

function toObject(val) {
    if (val == null) // null or undefined
        throw new TypeError(val + " is not an object");

    return Object(val);
}

// Iterates over the descriptors for each own property of an object
function forEachDesc(obj, fn) {
    ownNames(obj).forEach(function(name) { return fn(name, getDesc(obj, name)); });
    if (ownSymbols) ownSymbols(obj).forEach(function(name) { return fn(name, getDesc(obj, name)); });
}

// Installs a property into an object, merging "get" and "set" functions
function mergeProp(target, name, desc, enumerable) {
    if (desc.get || desc.set) {
        var d$0 = { configurable: true };
        if (desc.get) d$0.get = desc.get;
        if (desc.set) d$0.set = desc.set;
        desc = d$0;
    }

    desc.enumerable = enumerable;
    defineProp(target, name, desc);
}

// Installs properties on an object, merging "get" and "set" functions
function mergeProps(target, source, enumerable) {
    forEachDesc(source, function(name, desc) { return mergeProp(target, name, desc, enumerable); });
}

// Builds a class
function makeClass(def) {
    var parent = Object.prototype,
        proto = Object.create(parent),
        statics = {};

    def(function(obj) { return mergeProps(proto, obj, false); },
        function(obj) { return mergeProps(statics, obj, false); });

    var ctor = proto.constructor;
    ctor.prototype = proto;

    // Set class "static" methods
    forEachDesc(statics, function(name, desc) { return defineProp(ctor, name, desc); });

    return ctor;
}

// Support for computed property names
function computed(target) {
    for (var i$0 = 1; i$0 < arguments.length; i$0 += 3) {
        var desc$0 = getDesc(arguments[i$0 + 1], "_");
        mergeProp(target, arguments[i$0], desc$0, true);
        if (i$0 + 2 < arguments.length)
            mergeProps(target, arguments[i$0 + 2], true);
    }
    return target;
}

// Support for async functions
function asyncFunction(iter) {
    return new Promise(function(resolve, reject) {
        resume("next", void 0);
        function resume(type, value) {
            try {
                var result$0 = iter[type](value);
                if (result$0.done) {
                    resolve(result$0.value);
                } else {
                    Promise.resolve(result$0.value).then(
                        function(x) { return resume("next", x); },
                        function(x) { return resume("throw", x); });
                }
            } catch (x) { reject(x) }
        }
    });
}

// Support for for-await
function asyncIterator(obj) {
    var method = obj[Symbol.asyncIterator] || obj[Symbol.iterator];
    return method.call(obj);
}

// Support for async generators
function asyncGenerator(iter) {
    var front = null, back = null;
    var aIter = {
        next: function(val) { return send("next", val) },
        throw: function(val) { return send("throw", val) },
        return: function(val) { return send("return", val) },
    };

    aIter[Symbol.asyncIterator] = function() { return this };
    return aIter;

    function send(type, value) {
        return new Promise(function(resolve, reject) {
            var x = { type: type, value: value, resolve: resolve, reject: reject, next: null };
            if (back) {
                // If list is not empty, then push onto the end
                back = back.next = x;
            } else {
                // Create new list and resume generator
                front = back = x;
                resume(type, value);
            }
        });
    }

    function settle(type, value) {
        switch (type) {
            case "return":
                front.resolve({ value: value, done: true });
                break;
            case "throw":
                front.reject(value);
                break;
            default:
                front.resolve({ value: value, done: false });
                break;
        }

        front = front.next;
        if (front) resume(front.type, front.value);
        else back = null;
    }

    function resume(type, value) {
        try {
            var result$1 = iter[type](value);
            value = result$1.value;
            if (value && typeof value === "object" && "_esdown_await" in value) {
                if (result$1.done)
                    throw new Error("Invalid async generator return");

                Promise.resolve(value._esdown_await).then(
                    function(x) { return resume("next", x); },
                    function(x) { return resume("throw", x); });
            } else {
                settle(result$1.done ? "return" : "normal", result$1.value);
            }

        } catch (x) { settle("throw", x) }
    }
}

// Support for spread operations
function spread(initial) {
    return {
        a: initial || [],
        // Add items
        s: function() {
            for (var i$1 = 0; i$1 < arguments.length; ++i$1)
                this.a.push(arguments[i$1]);
            return this;
        },
        // Add the contents of iterables
        i: function(list) {
            if (Array.isArray(list)) {
                this.a.push.apply(this.a, list);
            } else {
                for (var __$0 = (list)[Symbol.iterator](), __$1; __$1 = __$0.next(), !__$1.done;)
                    { var item$0 = __$1.value; this.a.push(item$0); }
            }
            return this;
        },
    };
}

// Support for object destructuring
function objd(obj) {
    return toObject(obj);
}

// Support for array destructuring
function arrayd(obj) {
    if (Array.isArray(obj)) {
        return {
            at: function(skip, pos) { return obj[pos] },
            rest: function(skip, pos) { return obj.slice(pos) },
        };
    }

    var iter = toObject(obj)[Symbol.iterator]();

    return {
        at: function(skip) {
            var r;
            while (skip--) r = iter.next();
            return r.value;
        },
        rest: function(skip) {
            var a = [], r;
            while (--skip) r = iter.next();
            while (r = iter.next(), !r.done) a.push(r.value);
            return a;
        },
    };
}










exports.computed = computed;
exports.spread = spread;
exports.objd = objd;
exports.arrayd = arrayd;
exports.class = makeClass;
exports.version = VERSION;
exports.global = GLOBAL;
exports.async = asyncFunction;
exports.asyncGen = asyncGenerator;
exports.asyncIter = asyncIterator;
`;

Runtime.Polyfill = 

`var __M; (function(a) { var list = Array(a.length / 2); __M = function(i, es) { var m = list[i], f, e; if (typeof m === 'function') { f = m; m = i ? { exports: {} } : module; f(list[i] = m, m.exports); e = m.exports; m.__es = Object(e) !== e || e.constructor === Object ? e : Object.create(e, { 'default': { value: e } }); } return es ? m.__es : m.exports; }; for (var i = 0; i < a.length; i += 2) { var j = Math.abs(a[i]); list[j] = a[i + 1]; if (a[i] >= 0) __M(j); } })([
2, function(module, exports) {

'use strict'; var Global = (function() {
    try { return global.global } catch (x) {}
    try { return self.self } catch (x) {}
    return null;
})();



function transformKey(k) {
    if (k.slice(0, 2) === "@@")
        k = Symbol[k.slice(2)];

    return k;
}

function addProperties(target, methods) {
    Object.keys(methods).forEach(function(k) {
        var desc = Object.getOwnPropertyDescriptor(methods, k);
        desc.enumerable = false;

        k = transformKey(k);
        if (k in target)
            return;

        Object.defineProperty(target, k, desc);
    });
}

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

function assertThis(val, name) {
    if (val == null)
        throw new TypeError(name + " called on null or undefined");
}

exports.global = Global;
exports.addProperties = addProperties;
exports.toInteger = toInteger;
exports.toLength = toLength;
exports.sameValue = sameValue;
exports.isRegExp = isRegExp;
exports.toObject = toObject;
exports.assertThis = assertThis;


},
3, function(module, exports) {

'use strict'; var addProperties = __M(2, 1).addProperties;


function polyfill(global) {
    var symbolCounter = 0;

    function fakeSymbol() {
        return "__$" + Math.floor(Math.random() * 1e9) + "$" + (++symbolCounter) + "$__";
    }

    if (!global.Symbol)
        global.Symbol = fakeSymbol;

    addProperties(Symbol, {
        iterator: Symbol("iterator"),
        species: Symbol("species"),
        // Experimental async iterator support
        asyncIterator: Symbol("asyncIterator"),
    });
}

exports.polyfill = polyfill;


},
4, function(module, exports) {

'use strict'; var addProperties = __M(2, 1).addProperties, toObject = __M(2, 1).toObject, toLength = __M(2, 1).toLength, toInteger = __M(2, 1).toInteger;

function polyfill() {

    function arrayFind(obj, pred, thisArg, type) {
        var len = toLength(obj.length);
        var val;

        if (typeof pred !== "function")
            throw new TypeError(pred + " is not a function");

        for (var i$0 = 0; i$0 < len; ++i$0) {
            val = obj[i$0];
            if (pred.call(thisArg, val, i$0, obj))
                return type === "value" ? val : i$0;
        }

        return type === "value" ? void 0 : -1;
    }

    function ArrayIterator(array, kind) {
        this.array = array;
        this.current = 0;
        this.kind = kind;
    }

    addProperties(ArrayIterator.prototype = {}, {

        next: function() {
            var length = toLength(this.array.length);
            var index = this.current;

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

        "@@iterator": function() { return this },

    });

    addProperties(Array, {

        from: function(list) {
            list = toObject(list);

            var ctor = typeof this === "function" ? this : Array;
            var map = arguments[1];
            var thisArg = arguments[2];
            var i = 0;
            var out;

            if (map !== void 0 && typeof map !== "function")
                throw new TypeError(map + " is not a function");

            var getIter = list[Symbol.iterator];

            if (getIter) {
                var iter$0 = getIter.call(list);
                var result$0;

                out = new ctor;

                while (result$0 = iter$0.next(), !result$0.done) {
                    out[i++] = map ? map.call(thisArg, result$0.value, i) : result$0.value;
                    out.length = i;
                }
            } else {
                var len$0 = toLength(list.length);

                out = new ctor(len$0);

                for (; i < len$0; ++i)
                    out[i] = map ? map.call(thisArg, list[i], i) : list[i];

                out.length = len$0;
            }

            return out;
        },

        of: function() { for (var items = [], __$0 = 0; __$0 < arguments.length; ++__$0) items.push(arguments[__$0]); 
            var ctor = typeof this === "function" ? this : Array;
            if (ctor === Array)
                return items;

            var len = items.length;
            var out = new ctor(len);

            for (var i$1 = 0; i$1 < len; ++i$1)
                out[i$1] = items[i$1];

            out.length = len;
            return out;
        },

    });

    addProperties(Array.prototype, {

        copyWithin: function(target, start) {
            var obj = toObject(this);
            var len = toLength(obj.length);
            var end = arguments[2];

            target = toInteger(target);
            start = toInteger(start);

            var to = target < 0 ? Math.max(len + target, 0) : Math.min(target, len);
            var from = start < 0 ? Math.max(len + start, 0) : Math.min(start, len);

            end = end !== void 0 ? toInteger(end) : len;
            end = end < 0 ? Math.max(len + end, 0) : Math.min(end, len);

            var count = Math.min(end - from, len - to);
            var dir = 1;

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
            var obj = toObject(this);
            var len = toLength(obj.length);
            var start = toInteger(arguments[1]);
            var pos = start < 0 ? Math.max(len + start, 0) : Math.min(start, len);
            var end = arguments.length > 2 ? toInteger(arguments[2]) : len;

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

        "@@iterator": function() { return this.values() },

    });

}

exports.polyfill = polyfill;


},
5, function(module, exports) {

'use strict'; var addProperties = __M(2, 1).addProperties;

function polyfill(global) {

    var ORIGIN = {};
    var REMOVED = {};

    function MapNode(key, val) {
        this.key = key;
        this.value = val;
        this.prev = this;
        this.next = this;
    }

    addProperties(MapNode.prototype, {

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
        },

    });

    function MapIterator(node, kind) {
        this.current = node;
        this.kind = kind;
    }

    addProperties(MapIterator.prototype = {}, {

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

        "@@iterator": function() { return this },

    });

    function hashKey(key) {
        switch (typeof key) {
            case "string": return "$" + key;
            case "number": return String(key);
        }

        throw new TypeError("Map and Set keys must be strings or numbers in esdown");
    }

    function Map() {
        if (arguments.length > 0)
            throw new Error("Arguments to Map constructor are not supported in esdown");

        this._index = {};
        this._origin = new MapNode(ORIGIN);
    }

    addProperties(Map.prototype, {

        clear: function() {
            for (var node$0 = this._origin.next; node$0 !== this._origin; node$0 = node$0.next)
                node$0.key = REMOVED;

            this._index = {};
            this._origin = new MapNode(ORIGIN);
        },

        delete: function(key) {
            var h = hashKey(key);
            var node = this._index[h];

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

            for (var node$1 = this._origin.next; node$1.key !== ORIGIN; node$1 = node$1.next)
                if (node$1.key !== REMOVED)
                    fn.call(thisArg, node$1.value, node$1.key, this);
        },

        get: function(key) {
            var h = hashKey(key);
            var node = this._index[h];

            return node ? node.value : void 0;
        },

        has: function(key) {
            return hashKey(key) in this._index;
        },

        set: function(key, val) {
            var h = hashKey(key);
            var node = this._index[h];

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

        "@@iterator": function() { return new MapIterator(this._origin.next, "entries") },

    });

    var mapSet = Map.prototype.set;

    function Set() {
        if (arguments.length > 0)
            throw new Error("Arguments to Set constructor are not supported in esdown");

        this._index = {};
        this._origin = new MapNode(ORIGIN);
    }

    addProperties(Set.prototype, {
        add: function(key) { return mapSet.call(this, key, key) },
        "@@iterator": function() { return new MapIterator(this._origin.next, "entries") },
    });

    // Copy shared prototype members to Set
    ["clear", "delete", "forEach", "has", "size", "keys", "values", "entries"].forEach(function(k) {
        var d = Object.getOwnPropertyDescriptor(Map.prototype, k);
        Object.defineProperty(Set.prototype, k, d);
    });

    if (!global.Map || !global.Map.prototype.entries) {
        global.Map = Map;
        global.Set = Set;
    }
}

exports.polyfill = polyfill;


},
6, function(module, exports) {

'use strict'; var toInteger = __M(2, 1).toInteger, addProperties = __M(2, 1).addProperties;

function polyfill() {

    function isInteger(val) {
        return typeof val === "number" && isFinite(val) && toInteger(val) === val;
    }

    function epsilon() {
        // Calculate the difference between 1 and the smallest value greater than 1 that
        // is representable as a Number value
        var result;
        for (var next$0 = 1; 1 + next$0 !== 1; next$0 = next$0 / 2) result = next$0;
        return result;
    }

    addProperties(Number, {
        EPSILON: epsilon(),
        MAX_SAFE_INTEGER: 9007199254740991,
        MIN_SAFE_INTEGER: -9007199254740991,
        parseInt: parseInt,
        parseFloat: parseFloat,
        isInteger: isInteger,
        isFinite: function(val) { return typeof val === "number" && isFinite(val) },
        isNaN: function(val) { return val !== val },
        isSafeInteger: function(val) { return isInteger(val) && Math.abs(val) <= Number.MAX_SAFE_INTEGER },
    });
}

exports.polyfill = polyfill;


},
7, function(module, exports) {

'use strict'; var addProperties = __M(2, 1).addProperties, toObject = __M(2, 1).toObject, sameValue = __M(2, 1).sameValue;

function polyfill() {
    addProperties(Object, {

        is: sameValue,

        assign: function(target, source) {
            target = toObject(target);

            for (var i$0 = 1; i$0 < arguments.length; ++i$0) {
                source = arguments[i$0];
                if (source != null) // null or undefined
                    Object.keys(source).forEach(function(key) { return target[key] = source[key]; });
            }

            return target;
        },

        setPrototypeOf: function(object, proto) {
            // Least effort attempt
            object.__proto__ = proto;
        },

        getOwnPropertySymbols: function() {
            return [];
        },

    });
}

exports.polyfill = polyfill;


},
8, function(module, exports) {

'use strict'; var addProperties = __M(2, 1).addProperties, global = __M(2, 1).global;

var runLater = (function(_) {

    // Node
    if (global.process && typeof process.version === "string") {
        return global.setImmediate ?
            function(fn) { setImmediate(fn) } :
            function(fn) { process.nextTick(fn) };
    }

    // Newish Browsers
    var Observer = global.MutationObserver || global.WebKitMutationObserver;

    if (Observer) {
        var div$0 = document.createElement("div");
        var queuedFn$0 = null;

        var observer$0 = new Observer(function(_) {
            var fn = queuedFn$0;
            queuedFn$0 = null;
            fn();
        });

        observer$0.observe(div$0, { attributes: true });

        return function(fn) {
            if (queuedFn$0 !== null)
                throw new Error("Only one function can be queued at a time");

            queuedFn$0 = fn;
            div$0.classList.toggle("x");
        };
    }

    // Fallback
    return function(fn) { setTimeout(fn, 0) };
})();

var taskQueue = null;

function flushQueue() {
    var q = taskQueue;
    taskQueue = null;

    for (var i$0 = 0; i$0 < q.length; ++i$0)
        q[i$0]();
}

function enqueueMicrotask(fn) {
    // fn must not throw
    if (!taskQueue) {
        taskQueue = [];
        runLater(flushQueue);
    }

    taskQueue.push(fn);
}

function polyfill() {
    var OPTIMIZED = {};
    var PENDING = 0;
    var RESOLVED = +1;
    var REJECTED = -1;

    function idResolveHandler(x) { return x }
    function idRejectHandler(r) { throw r }
    function noopResolver() {}

    function Promise(resolver) { var __this = this; 
        this._status = PENDING;

        // Optimized case to avoid creating an uneccessary closure.  Creator assumes
        // responsibility for setting initial state.
        if (resolver === OPTIMIZED)
            return;

        if (typeof resolver !== "function")
            throw new TypeError("Resolver is not a function");

        this._onResolve = [];
        this._onReject = [];

        try { resolver(function(x) { resolvePromise(__this, x) }, function(r) { rejectPromise(__this, r) }) }
        catch (e) { rejectPromise(this, e) }
    }

    function chain(promise, onResolve, onReject) { if (onResolve === void 0) onResolve = idResolveHandler; if (onReject === void 0) onReject = idRejectHandler; 
        var deferred = makeDeferred(promise.constructor);

        switch (promise._status) {
            case PENDING:
                promise._onResolve.push(onResolve, deferred);
                promise._onReject.push(onReject, deferred);
                break;
            case RESOLVED:
                enqueueHandlers(promise._value, [onResolve, deferred], RESOLVED);
                break;
            case REJECTED:
                enqueueHandlers(promise._value, [onReject, deferred], REJECTED);
                break;
        }

        return deferred.promise;
    }

    function resolvePromise(promise, x) {
        completePromise(promise, RESOLVED, x, promise._onResolve);
    }

    function rejectPromise(promise, r) {
        completePromise(promise, REJECTED, r, promise._onReject);
    }

    function completePromise(promise, status, value, queue) {
        if (promise._status === PENDING) {
            promise._status = status;
            promise._value = value;
            enqueueHandlers(value, queue, status);
        }
    }

    function coerce(constructor, x) {
        if (!isPromise(x) && Object(x) === x) {
            var then$0;

            try { then$0 = x.then }
            catch(r) { return makeRejected(constructor, r) }

            if (typeof then$0 === "function") {
                var deferred$0 = makeDeferred(constructor);

                try { then$0.call(x, deferred$0.resolve, deferred$0.reject) }
                catch(r) { deferred$0.reject(r) }

                return deferred$0.promise;
            }
        }

        return x;
    }

    function enqueueHandlers(value, tasks, status) {
        enqueueMicrotask(function(_) {
            for (var i$1 = 0; i$1 < tasks.length; i$1 += 2)
                runHandler(value, tasks[i$1], tasks[i$1 + 1]);
        });
    }

    function runHandler(value, handler, deferred) {
        try {
            var result$0 = handler(value);
            if (result$0 === deferred.promise)
                throw new TypeError("Promise cycle");
            else if (isPromise(result$0))
                chain(result$0, deferred.resolve, deferred.reject);
            else
                deferred.resolve(result$0);
        } catch (e) {
            try { deferred.reject(e) }
            catch (e) { }
        }
    }

    function isPromise(x) {
        try { return x._status !== void 0 }
        catch (e) { return false }
    }

    function makeDeferred(constructor) {
        if (constructor === Promise) {
            var promise$0 = new Promise(OPTIMIZED);
            promise$0._onResolve = [];
            promise$0._onReject = [];

            return {
                promise: promise$0,
                resolve: function(x) { resolvePromise(promise$0, x) },
                reject: function(r) { rejectPromise(promise$0, r) },
            };
        } else {
            var result$1 = {};
            result$1.promise = new constructor(function(resolve, reject) {
                result$1.resolve = resolve;
                result$1.reject = reject;
            });

            return result$1;
        }
    }

    function makeRejected(constructor, r) {
        if (constructor === Promise) {
            var promise$1 = new Promise(OPTIMIZED);
            promise$1._status = REJECTED;
            promise$1._value = r;
            return promise$1;
        }

        return new constructor(function(resolve, reject) { return reject(r); });
    }

    function iterate(values, fn) {
        if (typeof Symbol !== "function" || !Symbol.iterator) {
            if (!Array.isArray(values))
                throw new TypeError("Invalid argument");

            values.forEach(fn);
        }

        var i = 0;

        for (var __$0 = (values)[Symbol.iterator](), __$1; __$1 = __$0.next(), !__$1.done;)
            { var x$0 = __$1.value; fn(x$0, i++); }
    }

    addProperties(Promise.prototype, {

        then: function(onResolve, onReject) { var __this = this; 
            onResolve = typeof onResolve === "function" ? onResolve : idResolveHandler;
            onReject = typeof onReject === "function" ? onReject : idRejectHandler;

            var constructor = this.constructor;

            return chain(this, function(x) {
                x = coerce(constructor, x);
                return x === __this ? onReject(new TypeError("Promise cycle")) :
                    isPromise(x) ? x.then(onResolve, onReject) :
                    onResolve(x);
            }, onReject);
        },

        catch: function(onReject) {
            return this.then(void 0, onReject);
        },

    });

    addProperties(Promise, {

        reject: function(e) {
            return makeRejected(this, e);
        },

        resolve: function(x) {
            return isPromise(x) ? x : new this(function(resolve) { return resolve(x); });
        },

        all: function(values) { var __this = this; 
            var deferred = makeDeferred(this);
            var resolutions = [];
            var count = 0;

            try {
                iterate(values, function(x, i) {
                    count++;
                    __this.resolve(x).then(function(value) {
                        resolutions[i] = value;
                        if (--count === 0)
                            deferred.resolve(resolutions);
                    }, deferred.reject);
                });

                if (count === 0)
                    deferred.resolve(resolutions);
            } catch (e) {
                deferred.reject(e);
            }

            return deferred.promise;
        },

        race: function(values) { var __this = this; 
            var deferred = makeDeferred(this);
            try {
                iterate(values, function(x) { return __this.resolve(x).then(
                    deferred.resolve,
                    deferred.reject); });
            } catch (e) {
                deferred.reject(e);
            }

            return deferred.promise;
        },

    });

    if (!global.Promise)
        global.Promise = Promise;
}

exports.polyfill = polyfill;


},
9, function(module, exports) {

'use strict'; var addProperties = __M(2, 1).addProperties,
    toLength = __M(2, 1).toLength,
    toInteger = __M(2, 1).toInteger,
    sameValue = __M(2, 1).sameValue,
    assertThis = __M(2, 1).assertThis,
    isRegExp = __M(2, 1).isRegExp;




function polyfill() {

    // Repeat a string by "squaring"
    function repeat(s, n) {
        if (n < 1) return "";
        if (n % 2) return repeat(s, n - 1) + s;
        var half = repeat(s, n / 2);
        return half + half;
    }

    function StringIterator(string) {
        this.string = string;
        this.current = 0;
    }

    addProperties(StringIterator.prototype = {}, {

        next: function() {
            var s = this.string;
            var i = this.current;
            var len = s.length;

            if (i >= len) {
                this.current = Infinity;
                return { value: void 0, done: true };
            }

            var c = s.charCodeAt(i);
            var chars = 1;

            if (c >= 0xD800 && c <= 0xDBFF && i + 1 < s.length) {
                c = s.charCodeAt(i + 1);
                chars = (c < 0xDC00 || c > 0xDFFF) ? 1 : 2;
            }

            this.current += chars;

            return { value: s.slice(i, this.current), done: false };
        },

        "@@iterator": function() { return this },

    });

    addProperties(String, {

        raw: function(callsite) { for (var args = [], __$0 = 1; __$0 < arguments.length; ++__$0) args.push(arguments[__$0]); 
            var raw = callsite.raw;
            var len = toLength(raw.length);

            if (len === 0)
                return "";

            var s = "";
            var i = 0;

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
        },

    });

    addProperties(String.prototype, {

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

            search = String(search);

            var string = String(this);
            var pos = arguments.length > 1 ? arguments[1] : undefined;
            var start = Math.max(toInteger(pos), 0);

            return string.slice(start, start + search.length) === search;
        },

        endsWith: function(search) {
            assertThis(this, "String.prototype.endsWith");

            if (isRegExp(search))
                throw new TypeError("First argument to String.prototype.endsWith must not be a regular expression");

            search = String(search);

            var string = String(this);
            var len = string.length;
            var arg = arguments.length > 1 ? arguments[1] : undefined;
            var pos = arg === undefined ? len : toInteger(arg);
            var end = Math.min(Math.max(pos, 0), len);

            return string.slice(end - search.length, end) === search;
        },

        includes: function(search) {
            assertThis(this, "String.prototype.includes");

            var string = String(this);
            var pos = arguments.length > 1 ? arguments[1] : undefined;

            // Somehow this trick makes method 100% compat with the spec
            return string.indexOf(search, pos) !== -1;
        },

        codePointAt: function(pos) {
            assertThis(this, "String.prototype.codePointAt");

            var string = String(this);
            var len = string.length;

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

        "@@iterator": function() {
            assertThis(this, "String.prototype[Symbol.iterator]");
            return new StringIterator(this);
        },

    });

}

exports.polyfill = polyfill;


},
1, function(module, exports) {

'use strict'; var global = __M(2, 1).global;

var symbols = __M(3, 1);
var array = __M(4, 1);
var mapset = __M(5, 1);
var number = __M(6, 1);
var object = __M(7, 1);
var promise = __M(8, 1);
var string = __M(9, 1);



function polyfill() {
    [symbols, array, mapset, number, object, promise, string]
        .forEach(function(m) { return m.polyfill(global); });
}

exports.global = global;
exports.polyfill = polyfill;


},
0, function(module, exports) {

'use strict'; var polyfill = __M(1, 1).polyfill;

polyfill();


}]);
`;

