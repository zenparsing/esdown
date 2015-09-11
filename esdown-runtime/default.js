const VERSION = "0.9.13";

const GLOBAL = (function() {

    try { return global.global } catch (x) {}
    try { return self.self } catch (x) {}
    return null;
})();

function toObject(val) {

    if (val == null)
        throw new TypeError(val + " is not an object");

    return Object(val);
}

// Iterates over the descriptors for each own property of an object
function forEachDesc(obj, fn) {

    let names = Object.getOwnPropertyNames(obj);

    for (let i = 0; i < names.length; ++i)
        fn(names[i], Object.getOwnPropertyDescriptor(obj, names[i]));

    let getSymbols = Object.getOwnPropertySymbols;

    if (getSymbols) {

        names = getSymbols(obj);

        for (let i = 0; i < names.length; ++i)
            fn(names[i], Object.getOwnPropertyDescriptor(obj, names[i]));
    }

    return obj;
}

// Installs a property into an object, merging "get" and "set" functions
function mergeProperty(target, name, desc, enumerable) {

    if (desc.get || desc.set) {

        let d = { configurable: true };
        if (desc.get) d.get = desc.get;
        if (desc.set) d.set = desc.set;
        desc = d;
    }

    desc.enumerable = enumerable;
    Object.defineProperty(target, name, desc);
}

// Installs properties on an object, merging "get" and "set" functions
function mergeProperties(target, source, enumerable) {

    forEachDesc(source, (name, desc) => mergeProperty(target, name, desc, enumerable));
}

// Builds a class
export function makeClass(base, def) {

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
        statics = {};

    function __(target, obj) {

        if (!obj) mergeProperties(proto, target, false);
        else mergeProperties(target, obj, false);
    }

    __.static = obj => mergeProperties(statics, obj, false);
    __.super = parent;
    __.csuper = base || Function.prototype;

    // Generate method collections, closing over super bindings
    def(__);

    let ctor = proto.constructor;

    // Set constructor's prototype
    ctor.prototype = proto;

    // Set class "static" methods
    forEachDesc(statics, (name, desc) => Object.defineProperty(ctor, name, desc));

    // Inherit from base constructor
    if (base && ctor.__proto__)
        Object.setPrototypeOf(ctor, base);

    return ctor;
}

// Support for computed property names
export function computed(target) {

    for (let i = 1; i < arguments.length; i += 3) {

        let desc = Object.getOwnPropertyDescriptor(arguments[i + 1], "_");
        mergeProperty(target, arguments[i], desc, true);

        if (i + 2 < arguments.length)
            mergeProperties(target, arguments[i + 2], true);
    }

    return target;
}

// Support for async functions
export function asyncFunction(iter) {

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
}

// Support for async generators
export function asyncGenerator(iter) {

    let front = null, back = null;

    let aIter = {

        next(val) { return send("next", val) },
        throw(val) { return send("throw", val) },
        return(val) { return send("return", val) },
    };

    aIter[Symbol.asyncIterator] = function() { return this };
    return aIter;

    function send(type, value) {

        return new Promise((resolve, reject) => {

            let x = { type, value, resolve, reject, next: null };

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
                front.resolve({ value, done: true });
                break;

            case "throw":
                front.reject(value);
                break;

            default:
                front.resolve({ value, done: false });
                break;
        }

        front = front.next;

        if (front) resume(front.type, front.value);
        else back = null;
    }

    function awaitValue(result) {

        let value = result.value;

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
            value = { value, __return: true };
        }

        try {

            let result = iter[type](value),
                awaited = awaitValue(result);

            if (awaited) {

                Promise.resolve(awaited).then(
                    x => resume("next", x),
                    x => resume("throw", x));

            } else {

                Promise.resolve(result.value).then(
                    x => fulfill(result.done ? "return" : "normal", x),
                    x => fulfill("throw", x));
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
export function spread(initial) {

    return {

        a: initial || [],

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
}

// Support for object destructuring
export function objd(obj) {

    return toObject(obj);
}

// Support for array destructuring
export function arrayd(obj) {

    if (Array.isArray(obj)) {

        return {

            at(skip, pos) { return obj[pos] },
            rest(skip, pos) { return obj.slice(pos) }
        };
    }

    let iter = toObject(obj)[Symbol.iterator]();

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
}

export {
    makeClass as class,
    VERSION as version,
    GLOBAL as global,
    asyncFunction as async,
    asyncGenerator as asyncGen,
};
