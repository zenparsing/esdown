var global = this, 
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

    // Support for iterator protocol
    iterator(obj) {

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

    // Support for rest parameters
    rest(args, pos) {

        return arraySlice.call(args, pos);
    },

    // Support for tagged templates
    templateSite(values, raw) {

        values.raw = raw || values;
        return values;
    },

    // Throws an error if the argument is not an object
    obj(obj) {

        if (!obj || typeof obj !== "object")
            throw new TypeError();
    
        return obj;
    },

    // Support for async functions
    async(iterable) {
    
        var iter = _es6now.iterator(iterable),
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
                    value.chain(resolver.resolve, resolver.reject);
                else
                    value.chain(x => resume(x, false), x => resume(x, true));
            
            } catch (x) { resolver.reject(x) }
        
        }
    },
    
    Class: Class
};
