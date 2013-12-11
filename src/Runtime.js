export var Class = 

`var HOP = Object.prototype.hasOwnProperty,
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
`;

export var ES5 = 

`/*

Provides basic support for methods added in EcmaScript 5 for EcmaScript 4 browsers.
The intent is not to create 100% spec-compatible replacements, but to allow the use
of basic ES5 functionality with predictable results.  There are features in ES5 that
require an ES5 engine (freezing an object, for instance).  If you plan to write for 
legacy engines, then don't rely on those features.

*/

var global = this,
    OP = Object.prototype,
    HOP = OP.hasOwnProperty,
    slice = Array.prototype.slice,
    TRIM_S = /^\s+/,
    TRIM_E = /\s+$/,
    FALSE = function() { return false; },
    TRUE = function() { return true; },
    identity = function(o) { return o; },
    defGet = OP.__defineGetter__,
    defSet = OP.__defineSetter__,
    keys = Object.keys || es4Keys,
    ENUM_BUG = !function() { var o = { constructor: 1 }; for (var i in o) return i = true; }(),
    ENUM_BUG_KEYS = [ "toString", "toLocaleString", "valueOf", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "constructor" ],
    ERR_REDUCE = "Reduce of empty array with no initial value";

// Returns the internal class of an object
function getClass(o) {

    if (o === null || o === undefined) return "Object";
    return OP.toString.call(o).slice("[object ".length, -1);
}

// Returns an array of keys defined on the object
function es4Keys(o) {

    var a = [], i;
    
    for (i in o)
        if (HOP.call(o, i))
            a.push(i);
    
    if (ENUM_BUG) 
        for (i = 0; i < ENUM_BUG_KEYS.length; ++i)
            if (HOP.call(o, ENUM_BUG_KEYS[i]))
                a.push(ENUM_BUG_KEYS[i]);
    
    return a;
}

// Sets a collection of keys, if the property is not already set
function addKeys(o, p) {

    for (var i = 0, a = keys(p), k; i < a.length; ++i) {
    
        k = a[i];
        
        if (o[k] === undefined) 
            o[k] = p[k];
    }
    
    return o;
}


// In IE8, defineProperty and getOwnPropertyDescriptor only work on DOM objects
// and are therefore useless - so bury them.
try { (Object.defineProperty || FALSE)({}, "-", { value: 0 }); }
catch (x) { Object.defineProperty = undefined; };

try { (Object.getOwnPropertyDescriptor || FALSE)({}, "-"); }
catch (x) { Object.getOwnPropertyDescriptor = undefined; }

// In IE < 9 [].slice does not work properly when the start or end arguments are undefined.
try { [0].slice(0, undefined)[0][0]; }
catch (x) {

    Array.prototype.slice = function(s, e) {
    
        s = s || 0;
        return (e === undefined ? slice.call(this, s) : slice.call(this, s, e));
    };
}

// ES5 Object functions
addKeys(Object, {

    create(o, p) {
    
        var n;
        
        if (o === null) {
        
            n = { "__proto__": o };
        
        } else {
        
            var f = function() {};
            f.prototype = o;
            n = new f;
        }
        
        if (p !== undefined)
            Object.defineProperties(n, p);
        
        return n;
    },
    
    keys: keys,
    
    getOwnPropertyDescriptor(o, p) {
    
        if (!HOP.call(o, p))
            return undefined;
        
        return { 
            value: o[p], 
            writable: true, 
            configurable: true, 
            enumerable: OP.propertyIsEnumerable.call(o, p)
        };
    },
    
    defineProperty(o, n, p) {
    
        var msg = "Accessor properties are not supported.";
        
        if ("get" in p) {
        
            if (defGet) defGet(n, p.get);
            else throw new Error(msg);
        }
        
        if ("set" in p) {
        
            if (defSet) defSet(n, p.set);
            else throw new Error(msg);
        }
        
        if ("value" in p)
            o[n] = p.value;
        
        return o;
    },
    
    defineProperties(o, d) {
    
        Object.keys(d).forEach(function(k) { Object.defineProperty(o, k, d[k]); });
        return o;
    },
    
    getPrototypeOf(o) {
    
        var p = o.__proto__ || o.constructor.prototype;
        return p;
    },
    
    /*
    
    getOwnPropertyNames is buggy since there is no way to get non-enumerable 
    ES3 properties.
    
    */
    
    getOwnProperyNames: keys,
    
    freeze: identity,
    seal: identity,
    preventExtensions: identity,
    isFrozen: FALSE,
    isSealed: FALSE,
    isExtensible: TRUE
    
});


// Add ES5 String extras
addKeys(String.prototype, {

    trim() { return this.replace(TRIM_S, "").replace(TRIM_E, ""); }
});


// Add ES5 Array extras
addKeys(Array, {

    isArray(obj) { return getClass(obj) === "Array"; }
});


addKeys(Array.prototype, {

    indexOf(v, i) {
    
        var len = this.length >>> 0;
        
        i = i || 0;
        if (i < 0) i = Math.max(len + i, 0);
        
        for (; i < len; ++i)
            if (this[i] === v)
                return i;
        
        return -1;
    },
    
    lastIndexOf(v, i) {
    
        var len = this.length >>> 0;
        
        i = Math.min(i || 0, len - 1);
        if (i < 0) i = len + i;
        
        for (; i >= 0; --i)
            if (this[i] === v)
                return i;
        
        return -1;
    },
    
    every(fn, self) {
    
        var r = true;
        
        for (var i = 0, len = this.length >>> 0; i < len; ++i)
            if (i in this && !(r = fn.call(self, this[i], i, this)))
                break;
        
        return !!r;
    },
    
    some(fn, self) {
    
        var r = false;
        
        for (var i = 0, len = this.length >>> 0; i < len; ++i)
            if (i in this && (r = fn.call(self, this[i], i, this)))
                break;
        
        return !!r;
    },
    
    forEach(fn, self) {
    
        for (var i = 0, len = this.length >>> 0; i < len; ++i)
            if (i in this)
                fn.call(self, this[i], i, this);
    },
    
    map(fn, self) {
    
        var a = [];
        
        for (var i = 0, len = this.length >>> 0; i < len; ++i)
            if (i in this)
                a[i] = fn.call(self, this[i], i, this);
        
        return a;
    },
    
    filter(fn, self) {
    
        var a = [];
        
        for (var i = 0, len = this.length >>> 0; i < len; ++i)
            if (i in this && fn.call(self, this[i], i, this))
                a.push(this[i]);
        
        return a;
    },
    
    reduce(fn) {
    
        var len = this.length >>> 0,
            i = 0, 
            some = false,
            ini = (arguments.length > 1),
            val = (ini ? arguments[1] : this[i++]);
        
        for (; i < len; ++i) {
        
            if (i in this) {
            
                some = true;
                val = fn(val, this[i], i, this);
            }
        }
        
        if (!some && !ini)
            throw new TypeError(ERR_REDUCE);
        
        return val;
    },
    
    reduceRight(fn) {
    
        var len = this.length >>> 0,
            i = len - 1,
            some = false,
            ini = (arguments.length > 1),
            val = (ini || i < 0  ? arguments[1] : this[i--]);
        
        for (; i >= 0; --i) {
        
            if (i in this) {
            
                some = true;
                val = fn(val, this[i], i, this);
            }
        }
        
        if (!some && !ini)
            throw new TypeError(ERR_REDUCE);
        
        return val;
    }
});

// Add ES5 Function extras
addKeys(Function.prototype, {

    bind(self) {
    
        var f = this,
            args = slice.call(arguments, 1),
            noargs = (args.length === 0);
        
        bound.prototype = f.prototype;
        return bound;
        
        function bound() {
        
            return f.apply(
                this instanceof bound ? this : self, 
                noargs ? arguments : args.concat(slice.call(arguments, 0)));
        }
    }
});

// Add ES5 Date extras
addKeys(Date, {

    now() { return (new Date()).getTime(); }
});

// Add ES5 Date extras
addKeys(Date.prototype, {

    toISOString() {
    
        function pad(s) {
        
            if ((s = "" + s).length === 1) s = "0" + s;
            return s;
        }
        
        return this.getUTCFullYear() + "-" +
            pad(this.getUTCMonth() + 1, 2) + "-" +
            pad(this.getUTCDate(), 2) + "T" +
            pad(this.getUTCHours(), 2) + ":" +
            pad(this.getUTCMinutes(), 2) + ":" +
            pad(this.getUTCSeconds(), 2) + "Z";
    },
    
    toJSON() {
    
        return this.toISOString();
    }
});

// Add ISO support to Date.parse
if (Date.parse(new Date(0).toISOString()) !== 0) !function() {

    /*
    
    In ES5 the Date constructor will also parse ISO dates, but overwritting 
    the Date function itself is too far.  Note that new Date(isoDateString)
    is not backward-compatible.  Use the following instead:
    
    new Date(Date.parse(dateString));
    
    1: +/- year
    2: month
    3: day
    4: hour
    5: minute
    6: second
    7: fraction
    8: +/- tz hour
    9: tz minute
    
    */
    
    var isoRE = /^(?:((?:[+-]\d{2})?\d{4})(?:-(\d{2})(?:-(\d{2}))?)?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{3})?)?)?(?:Z|([-+]\d{2}):(\d{2}))?$/,
        dateParse = Date.parse;

    Date.parse = function(s) {
    
        var t, m, hasDate, i, offset;
        
        if (!isNaN(t = dateParse(s)))
            return t;
        
        if (s && (m = isoRE.exec(s))) {
        
            hasDate = m[1] !== undefined;
            
            // Convert matches to numbers (month and day default to 1)
            for (i = 1; i <= 9; ++i)
                m[i] = Number(m[i] || (i <= 3 ? 1 : 0));
            
            // Calculate ms directly if no date is provided
            if (!hasDate)
                return ((m[4] * 60 + m[5]) * 60 + m[6]) * 1000 + m[7];
            
            // Convert month to zero-indexed
            m[2] -= 1;
            
            // Get TZ offset
            offset = (m[8] * 60 + m[9]) * 60 * 1000;
            
            // Remove full match from array
            m.shift();
            
            t = Date.UTC.apply(this, m) + offset;
        }
        
        return t;
    };
            
}();
`;

export var ES6 = 

`var global = this,
    HAS_OWN = Object.prototype.hasOwnProperty;

function addProps(obj, props) {

    Object.keys(props).forEach(k => {
    
        if (typeof obj[k] !== "undefined")
            return;
        
        Object.defineProperty(obj, k, {
        
            value: props[k],
            configurable: true,
            enumerable: false,
            writable: true
        });
    });
}

addProps(Object, {

    is(a, b) {
    
        // TODO
    },
    
    assign(target, source) {
    
        Object.keys(source).forEach(k => target[k] = source[k]);
        return target;
    },
    
    mixin(target, source) {
    
        Object.getOwnPropertyNames(source).forEach(name => {
        
            var desc = Object.getOwnPropertyDescriptor(source, name);
            Object.defineProperty(target, name, desc);
        });
        
        return target;
    }
});

addProps(Number, {

    EPSILON: Number.EPSILON || (function() {
    
        var next, result;
        
        for (next = 1; 1 + next !== 1; next = next / 2)
            result = next;
        
        return result;
    }()),
    
    MAX_INTEGER: 9007199254740992,
    
    isFinite(val) {
        
        return typeof val === "number" && isFinite(val);
    },
    
    isNaN(val) {
    
        return typeof val === "number" && isNaN(val);
    },
    
    isInteger(val) {
    
        typeof val === "number" && val | 0 === val;
    },
    
    toInteger(val) {
        
        return val | 0;
    }
});

addProps(Array, {

    from(arg) {
        // TODO
    },
    
    of() {
        // ?
    }

});

addProps(String.prototype, {
    
    repeat(count) {
    
        return new Array(count + 1).join(this);
    },
    
    startsWith(search, start) {
    
        return this.indexOf(search, start) === start;
    },
    
    endsWith(search, end) {
    
        return this.slice(-search.length) === search;
    },
    
    contains(search, pos) {
    
        return this.indexOf(search, pos) !== -1;
    }
});

if (typeof Reflect === "undefined") global.Reflect = {

    hasOwn(obj, name) { return HAS_OWN.call(obj, name); }
};
`;

export var Promise = 

`var queueTask = ($=> {

    var window = this.window,
        msgChannel = null,
        list = [];
    
    if (typeof setImmediate === "function") {
    
        return window ?
            window.setImmediate.bind(window) :
            setImmediate;
   
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


var $status = "Promise#status",
    $value = "Promise#value",
    $onResolve = "Promise#onResolve",
    $onReject = "Promise#onReject";

function isPromise(x) { 

    return x && $status in Object(x);
}

function Promise(init) {

    this[$status] = "pending";
    this[$onResolve] = [];
    this[$onReject] = [];
    
    init(x => promiseResolve(this, x), r => promiseReject(this, r));
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
    
    for (var i in reactions) 
        promiseReact(reactions[i][0], reactions[i][1], value);
        
    promise[$status] = status;
    promise[$value] = value;
    promise[$onResolve] = promise[$onReject] = void 0;
}

function promiseReact(deferred, handler, x) {

    queueTask($=> {
    
        try {
        
            var y = handler(x);
        
            if (y === deferred.promise)
                throw new TypeError;
            else if (isPromise(y))
                y.chain(deferred.resolve, deferred.reject);
            else
                deferred.resolve(y);
        
        } catch(e) { deferred.reject(e) }
    });
}

Promise.resolve = function(x) {

    return new this(resolve => resolve(x));
};

Promise.reject = function(r) {

    return new this((resolve, reject) => reject(r));
};

Promise.deferred = function() {

    var result = {};
    
    result.promise = new this((resolve, reject) => {
        result.resolve = resolve;
        result.reject = reject;
    });
    
    return result;
};

Promise.prototype.chain = function(onResolve, onReject) {

    // [A+ compatibility]
    // onResolve = onResolve || (x => x);
    // onReject = onReject || (e => { throw e });
    
    if (typeof onResolve !== "function") onResolve = x => x;
    if (typeof onReject !== "function") onReject = e => { throw e };
    
    var deferred = Promise.deferred.call(this.constructor);
    
    switch (this[$status]) {
    
        case undefined:
            throw new TypeError;
            
        case "pending":
            this[$onResolve].push([deferred, onResolve]);
            this[$onReject].push([deferred, onReject]);
            break;
        
        case "resolved":
            promiseReact(deferred, onResolve, this[$value]);
            break;
            
        case "rejected":
            promiseReact(deferred, onReject, this[$value]);
            break;
    }
    
    return deferred.promise;
};

Promise.prototype.catch = function(onReject) {

    // TODO: if !onReject, should it default to x => x?
    return this.chain(undefined, onReject)
};

Promise.prototype.then = function(onResolve, onReject) {

    // [A+ compatibility]
    // onResolve = onResolve || (x => x);
    
    if (typeof onResolve !== "function") onResolve = x => x;
    
    var constructor = this.constructor;
    
    return this.chain(x => {
    
        x = promiseCoerce(constructor, x);
        
        if (x === this)
            throw new TypeError;
        
        return isPromise(x) ?
            x.then(onResolve, onReject) :
            onResolve(x);
        
    }, onReject);
};

function promiseCoerce(constructor, x) {

    if (isPromise(x))
        return x;
    
    // [A+ compatibility]
    // if (!(x && "then" in Object(x))
    //    return x;
        
    if (!(x && "then" in Object(x) && typeof x.then === "function"))
        return x;
    
    var deferred = constructor.deferred();
      
    try { x.then(deferred.resolve, deferred.reject) } 
    catch(e) { deferred.reject(e) }
    
    return deferred.promise;
}

Promise.cast = function(x) {

    if (x instanceof this)
        return x;

    if (!isPromise(x))
        return this.resolve(x);
    
    var result = this.deferred();
    x.chain(result.resolve, result.reject);
    return result.promise;
};

Promise.all = function(values) {

    var deferred = this.deferred(),
        count = 0,
        resolutions = [];
        
    for (var i in values) {
    
        ++count;
        
        this.cast(values[i]).chain(onResolve(i), r => {
        
            if (count > 0) { 
            
                count = 0; 
                deferred.reject(r);
            }
        });
    }
    
    if (count === 0) 
        deferred.resolve(resolutions);
        
    return deferred.promise;
    
    function onResolve(i) {
    
        return x => {
        
            resolutions[i] = x;
            
            if (--count === 0)
                deferred.resolve(resolutions);
        };
    }
};

this.Promise = Promise;
`;

