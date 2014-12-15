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

            var prev = Object.getOwnPropertyDescriptor(to, name);

            if (prev) {

                desc.get = desc.get || prev.get;
                desc.set = desc.set || prev.set;
            }
        }

        Object.defineProperty(to, name, desc);
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

    // Create the prototype object
    var proto = Object.create(parent),
        statics = {},
        addMethods = obj => mergeMethods(obj, proto),
        addStatics = obj => mergeMethods(obj, statics);

    addMethods.static = addStatics;

    // Generate method collections, closing over super bindings
    def(addMethods, parent, base || Function.prototype);

    if (!hasOwn.call(proto, "constructor"))
        throw new Error("No constructor specified");

    // Make constructor non-enumerable
    Object.defineProperty(proto, "constructor", {

        enumerable: false,
        writable: true,
        configurable: true
    });

    var ctor = proto.constructor;

    // Set constructor's prototype
    ctor.prototype = proto;

    // Set class "static" methods
    forEachDesc(statics, (name, desc) => Object.defineProperty(ctor, name, desc));

    // "Inherit" from base constructor
    if (base) inherit(ctor, base);

    return ctor;
}

Global._esdown = {

    version: "0.9.3",

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

    asyncIter(obj) {

        if (obj[Symbol.asyncIterator] !== void 0)
            return obj[Symbol.asyncIterator]();

        var iter = { [Symbol.asyncIterator]() { return this } },
            inner = _esdown.iter(obj);

        ["next", "throw", "return"].forEach(name => {

            if (name in inner)
                iter[name] = value => Promise.resolve(inner[name](value));
        });

        return iter;
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
    async(iter) {

        return new Promise((resolve, reject) => {

            resume("next", void 0);

            function resume(type, value) {

                try {

                    var result = iter[type](value);

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

        var current = null,
            queue = [];

        return {

            next(val) { return enqueue("next", val) },
            throw(val) { return enqueue("throw", val) },
            return(val) { return enqueue("return", val) },
            [Symbol.asyncIterator]() { return this }
        };

        function enqueue(type, value) {

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

                var result = iter[type](value),
                    value = result.value;

                if (typeof value === "object" && "_esdown_await" in value) {

                    if (result.done)
                        throw new Error("Invalid async generator return");

                    Promise.resolve(value._esdown_await).then(
                        x => resume("next", x),
                        x => resume("throw", x));

                    return;

                } else {

                    current.resolve(result);
                }

            } catch (x) {

                if (x && x.__return === true)
                    current.resolve({ value: x.value, done: true });
                else
                    current.reject(x);
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

        var iter = _esdown.iter(toObject(obj));

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
