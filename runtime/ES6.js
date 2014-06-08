var global = this, 
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

function polyfill(obj, methods) {

    eachKey(methods, key => {
    
        if (key in obj && !global._testES6Shims)
            return;
        
        var desc = {
        
            value: methods[key],
            configurable: true,
            enumerable: false,
            writable: true
        };
        
        try { Object.defineProperty(obj, key, desc) }
        catch (x) { }
        
    });
}

function toInteger(val) {

    var n = +val;
    
    return (Number.isNaN(n)) ? 0 :
        (n === 0 || !Number.isFinite(n)) ? n :
        Math.sign(n) * Math.floor(Math.abs(n));
}

function toLength(val) {

    var n = toInteger(val);
    return n < 0 ? 0 : Math.min(n, Number.MAX_SAFE_INTEGER);
}

// === Object ===

polyfill(Object, {

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

polyfill(Number, {

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

polyfill(String, {

    raw(callsite, ...args) {
    
        var raw = callsite.raw,
            len = toLength(raw.length);
        
        if (len === 0)
            return "";
            
        var s = "", i = 0;
        
        while (true) {
        
            s += raw[i];
            if (i + 1 === len || i >= args.length) break;
            s += args[i++];
        }
        
        return s;
    }
    
    // TODO:  fromCodePoint
    
});

// Repeat a string by "squaring"
function repeat(s, n) {

    if (n < 1) return "";
    if (n % 2) return repeat(s, n - 1) + s;
    var half = repeat(s, n / 2);
    return half + half;
}

polyfill(String.prototype, {
    
    repeat(count) {
    
        if (this == null)
            throw TypeError();
        
        var string = String(this);
        
        count = toInteger(count);
        
        if (count < 0 || count === Infinity)
            throw new RangeError();
        
        return repeat(string, count);
    },
    
    startsWith(search) {
    
        var string = String(this);
        
        if (this == null || toString.call(search) == "[object RegExp]")
            throw TypeError();
        
        search = String(search);
        
        var pos = arguments.length > 1 ? arguments[1] : undefined,
            start = Math.max(toInteger(pos), 0);
        
        return string.slice(start, start + search.length) === search;
    },
    
    endsWith(search) {
    
        var string = String(this);
        
        if (this == null || toString.call(search) == '[object RegExp]')
            throw TypeError();
        
        search = String(search);
        
        var len = string.length,
            arg = arguments.length > 1 ? arguments[1] : undefined,
            pos = arg === undefined ? len : toInteger(arg),
            end = Math.min(Math.max(pos, 0), len);
        
        return string.slice(end - search.length, end) === search;
    },
    
    contains(search) {
    
        var pos = arguments.length > 1 ? arguments[1] : undefined;
        
        // Somehow this trick makes method 100% compat with the spec.
        return stringIndexOf.call(this, search, pos) !== -1;
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

polyfill(Array.prototype, {

    values()  { return new ArrayIterator(this, "values") },
    entries() { return new ArrayIterator(this, "entries") },
    keys()    { return new ArrayIterator(this, "keys") },
    [Symbol.iterator]() { return this.values() }
    
});
