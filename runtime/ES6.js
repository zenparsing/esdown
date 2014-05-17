var global = this, 
    arraySlice = Array.prototype.slice,
    toString = Object.prototype.toString;

// === Symbols ===

var symbolCounter = 0;

function fakeSymbol() {

    return "__$" + Math.floor(Math.random() * 1e9) + "$" + (++symbolCounter) + "$__";
}

// NOTE:  As of Node 0.11.12, V8's Symbol implementation is a little wonky.
// There is no Object.getOwnPropertySymbols, so reflection doesn't seem to
// work like it should.  Furthermore, Node blows up when trying to inspect
// Symbol objects.  We expect to replace this override when V8's symbols
// catch up with the ES6 specification.

this.Symbol = fakeSymbol;

Symbol.iterator = Symbol("iterator");

// Support for iterator protocol
this.es6now.iterator = function(obj) {

    if (global.Symbol && Symbol.iterator && obj[Symbol.iterator] !== void 0)
        return obj[Symbol.iterator]();
    
    if (Array.isArray(obj))
        return obj.values();
    
    return obj;
};

// Support for computed property names
this.es6now.computed = function(obj) {

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
};

// Support for rest parameters
this.es6now.rest = function(args, pos) {

    return arraySlice.call(args, pos);
};

// Support for tagged templates
this.es6now.templateSite = function(values, raw) {

    values.raw = raw || values;
    return values;
};

function eachKey(obj, fn) {

    var keys = Object.getOwnPropertyNames(obj),
        i;
    
    for (i = 0; i < keys.length; ++i)
        fn(keys[i]);
    
    if (!Object.getOwnPropertySymbols)
        return;
    
    keys = Object.getOwnPropertySymbols(obj);
    
    for (i = 0; i < keys.length; ++i)
        fn(keys[i]);
}

function addMethods(obj, methods) {

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


// === Object ===

addMethods(Object, {

    is(left, right) {
    
        if (left === right)
            return left !== 0 || 1 / left === 1 / right;
        
        return left !== left && right !== right;
    },
    
    // TODO: Multiple sources
    assign(target, source) {
    
        Object.keys(source).forEach(key => target[key] = source[key]);
        return target;
    }
    
});

// === Number ===

addMethods(Number, {

    EPSILON: ($=> {
    
        var next, result;
        
        for (next = 1; 1 + next !== 1; next = next / 2)
            result = next;
        
        return result;
        
    })(),
    
    MAX_SAFE_INTEGER: 9007199254740992,
    
    MIN_SAFE_INTEGER: -9007199254740991,
    
    isInteger(val) { return typeof val === "number" && val | 0 === val },
    
    isFinite(val) { return typeof val === "number" && global.isFinite(val) },
    
    isNaN(val) { return val !== val },
    
    isSafeInteger(val) { return Number.isInteger(val) && Math.abs(val) <= Number.MAX_SAFE_INTEGER }
    
});

// === String === 

addMethods(String, {

    raw(callsite, ...args) {
    
        var raw = callsite.raw,
            len = raw.length >>> 0;
        
        if (len === 0)
            return "";
            
        var s = "", i = 0;
        
        while (true) {
        
            s += raw[i];
        
            if (i + 1 === len)
                return s;
        
            s += args[i++];
        }
    }
    
    // TODO:  fromCodePoint
    
});

addMethods(String.prototype, {
    
    repeat(count) {
    
        if (this == null)
            throw TypeError();
        
        var n = count ? Number(count) : 0;
        
        if (isNaN(n))
            n = 0;
        
        // Account for out-of-bounds indices
        if (n < 0 || n == Infinity)
            throw RangeError();
        
        if (n == 0)
            return "";
            
        var result = "";
        
        while (n--)
            result += this;
        
        return result;
    },
    
    startsWith(search) {
    
        var string = String(this);
        
        if (this == null || toString.call(search) == "[object RegExp]")
            throw TypeError();
            
        var stringLength = this.length,
            searchString = String(search),
            searchLength = searchString.length,
            position = arguments.length > 1 ? arguments[1] : undefined,
            pos = position ? Number(position) : 0;
            
        if (isNaN(pos))
            pos = 0;
        
        var start = Math.min(Math.max(pos, 0), stringLength);
        
        return this.indexOf(searchString, pos) == start;
    },
    
    endsWith(search) {
    
        if (this == null || toString.call(search) == '[object RegExp]')
            throw TypeError();
        
        var stringLength = this.length,
            searchString = String(search),
            searchLength = searchString.length,
            pos = stringLength;
        
        if (arguments.length > 1) {
        
            var position = arguments[1];
        
            if (position !== undefined) {
        
                pos = position ? Number(position) : 0;
                
                if (isNaN(pos))
                    pos = 0;
            }
        }
        
        var end = Math.min(Math.max(pos, 0), stringLength),
            start = end - searchLength;
        
        if (start < 0)
            return false;
            
        return this.lastIndexOf(searchString, start) == start;
    },
    
    contains(search) {
    
        if (this == null)
            throw TypeError();
            
        var stringLength = this.length,
            searchString = String(search),
            searchLength = searchString.length,
            position = arguments.length > 1 ? arguments[1] : undefined,
            pos = position ? Number(position) : 0;
        
        if (isNaN(pos))
            pos = 0;
            
        var start = Math.min(Math.max(pos, 0), stringLength);
        
        return this.indexOf(string, searchString, pos) != -1;
    }
    
    // TODO: codePointAt
    
});

// === Array ===

class ArrayIterator {

    constructor(array, kind) {
    
        this.array = array;
        this.current = 0;
        this.kind = kind;
    }
    
    next() {
    
        var length = this.array.length >>> 0,
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

addMethods(Array.prototype, {

    values()  { return new ArrayIterator(this, "values") },
    entries() { return new ArrayIterator(this, "entries") },
    keys()    { return new ArrayIterator(this, "keys") },
    [Symbol.iterator]() { return this.values() }
});
