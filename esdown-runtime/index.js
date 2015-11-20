/*=esdown=*/'use strict'; var VERSION = "1.0.3";

var GLOBAL = (function() {

    try { return global.global } catch (x) {}
    try { return self.self } catch (x) {}
    return null;
})();

var ownNames = Object.getOwnPropertyNames,
      ownSymbols = Object.getOwnPropertySymbols,
      getDesc = Object.getOwnPropertyDescriptor,
      defineProp = Object.defineProperty;

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

    function fulfill(type, value) {

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

    function awaitValue(result) {

        var value = result.value;

        if (typeof value === "object" && "_esdown_await" in value) {

            if (result.done)
                throw new Error("Invalid async generator return");

            return value._esdown_await;
        }

        return null;
    }

    function resume(type, value) {

        // HACK: If the generator does not support the "return" method, then
        // emulate it (poorly) using throw.  (V8 circa 2015-02-13 does not support
        // generator.return.)
        if (type === "return" && !(type in iter)) {

            type = "throw";
            value = { value: value, __return: true };
        }

        try {

            var result$1 = iter[type](value),
                awaited$0 = awaitValue(result$1);

            if (awaited$0) {

                Promise.resolve(awaited$0).then(
                    function(x) { return resume("next", x); },
                    function(x) { return resume("throw", x); });

            } else {

                Promise.resolve(result$1.value).then(
                    function(x) { return fulfill(result$1.done ? "return" : "normal", x); },
                    function(x) { return fulfill("throw", x); });
            }

        } catch (x) {

            // HACK: Return-as-throw
            if (x && x.__return === true)
                return fulfill("return", x.value);

            fulfill("throw", x);
        }
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
        },
    };
}










exports.makeClass = makeClass;
exports.computed = computed;
exports.asyncFunction = asyncFunction;
exports.asyncIterator = asyncIterator;
exports.asyncGenerator = asyncGenerator;
exports.spread = spread;
exports.objd = objd;
exports.arrayd = arrayd;
exports.class = makeClass;
exports.version = VERSION;
exports.global = GLOBAL;
exports.async = asyncFunction;
exports.asyncGen = asyncGenerator;
exports.asyncIter = asyncIterator;
