const VERSION = "0.9.5";

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
