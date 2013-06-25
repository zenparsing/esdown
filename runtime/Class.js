var HOP = Object.prototype.hasOwnProperty,
    STATIC = /^__static_/;

// Returns true if the object has the specified property
function hasOwn(obj, name) {

    return HOP.call(obj, name);
}

// Returns true if the object has the specified property in
// its prototype chain
function has(obj, name) {

    for (; obj; obj = Object.getPrototypeOf(obj))
        if (HOP.call(obj, name))
            return true;
    
    return false;
}

// Iterates over the descriptors for each own property of an object
function forEachDesc(obj, fn) {

    var names = Object.getOwnPropertyNames(obj);
    
    for (var i = 0, name; i < names.length; ++i)
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

function defineMethods(to, from, classMethods) {

    forEachDesc(from, (name, desc) => {
    
        if (STATIC.test(name) === classMethods)
            Object.defineProperty(to, classMethods ? name.replace(STATIC, "") : name, desc);
    });
    
    return to;
}

function Class(base, def) {

    function constructor() { 
    
        if (parent && parent.constructor)
            parent.constructor.apply(this, arguments);
    }
    
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
        throw new TypeError();
    
    // Generate the method collection, closing over "super"
    var props = def(parent);
    
    // Get constructor
    if (hasOwn(props, "constructor"))
        constructor = props.constructor;
    
    // Make constructor non-enumerable and assign a default
    // if none is provided
    Object.defineProperty(props, "constructor", {
    
        enumerable: false,
        writable: true,
        configurable: true,
        value: constructor
    });
    
    // Create prototype object
    var proto = defineMethods(Object.create(parent), props, false);
    
    // Set constructor's prototype
    constructor.prototype = proto;
    
    // Set class "static" methods
    defineMethods(constructor, props, true);
    
    // "Inherit" from base constructor
    if (base) inherit(constructor, base);
    
    return constructor;
}

this.__class = Class;
