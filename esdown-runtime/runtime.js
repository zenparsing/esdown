const VERSION = "1.0.5";

const GLOBAL = (function() {

    try { return global.global } catch (x) {}
    try { return self.self } catch (x) {}
    return null;
})();

const ownNames = Object.getOwnPropertyNames,
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

    ownNames(obj).forEach(name => fn(name, getDesc(obj, name)));
    if (ownSymbols) ownSymbols(obj).forEach(name => fn(name, getDesc(obj, name)));
}

// Installs a property into an object, merging "get" and "set" functions
function mergeProp(target, name, desc, enumerable) {

    if (desc.get || desc.set) {

        let d = { configurable: true };
        if (desc.get) d.get = desc.get;
        if (desc.set) d.set = desc.set;
        desc = d;
    }

    desc.enumerable = enumerable;
    defineProp(target, name, desc);
}

// Installs properties on an object, merging "get" and "set" functions
function mergeProps(target, source, enumerable) {

    forEachDesc(source, (name, desc) => mergeProp(target, name, desc, enumerable));
}

// Builds a class
function makeClass(def) {

    let parent = Object.prototype,
        proto = Object.create(parent),
        statics = {};

    def(obj => mergeProps(proto, obj, false),
        obj => mergeProps(statics, obj, false));

    let ctor = proto.constructor;
    ctor.prototype = proto;

    // Set class "static" methods
    forEachDesc(statics, (name, desc) => defineProp(ctor, name, desc));

    return ctor;
}

// Support for computed property names
export function computed(target) {

    for (let i = 1; i < arguments.length; i += 3) {

        let desc = getDesc(arguments[i + 1], "_");
        mergeProp(target, arguments[i], desc, true);

        if (i + 2 < arguments.length)
            mergeProps(target, arguments[i + 2], true);
    }

    return target;
}

// Support for async functions
function asyncFunction(iter) {

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

// Support for for-await
function asyncIterator(obj) {

    let method = obj[Symbol.asyncIterator] || obj[Symbol.iterator];
    return method.call(obj);
}

// Support for async generators
function asyncGenerator(iter) {

    let current = null;

    let aIter = {

        next(val) { return send("next", val) },
        throw(val) { return send("throw", val) },
        return(val) { return send("return", val) },
    };

    aIter[Symbol.asyncIterator] = function() { return this };
    return aIter;

    function send(type, value) {

        return new Promise((resolve, reject) => {

            if (current)
                throw new Error("Async generator in progress");

            current = { resolve, reject };
            resume(type, value);
        });
    }

    function fulfill(type, value) {

        switch (type) {

            case "return":
                current.resolve({ value, done: true });
                break;

            case "throw":
                current.reject(value);
                break;

            default:
                current.resolve({ value, done: false });
                break;
        }

        current = null;
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

            let result = iter[type](value);
            value = result.value;

            if (value && typeof value === "object" && "_esdown_await" in value) {

                if (result.done)
                    throw new Error("Invalid async generator return");

                Promise.resolve(value._esdown_await).then(
                    x => resume("next", x),
                    x => resume("throw", x));

            } else {

                Promise.resolve(value).then(
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
        },

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
            rest(skip, pos) { return obj.slice(pos) },
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
        },
    };
}

export {
    makeClass as class,
    VERSION as version,
    GLOBAL as global,
    asyncFunction as async,
    asyncGenerator as asyncGen,
    asyncIterator as asyncIter,
};
