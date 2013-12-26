var global = this,
    HAS_OWN = Object.prototype.hasOwnProperty;

// TODO:  Not everything gets added with the same property attributes...

/*

== NOTES ==


ToUint32:  x >>> 0
ToInt32:  x | 0

*/

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
    }
});

// TODO Math?

addProps(Number, {

    EPSILON: $=> {
    
        var next, result;
        
        for (next = 1; 1 + next !== 1; next = next / 2)
            result = next;
        
        return result;
    }(),
    
    MAX_SAFE_INTEGER: 9007199254740992,
    
    MIN_SAFE_INTEGER: −9007199254740991,
    
    isInteger(val) {
    
        typeof val === "number" && val | 0 === val;
    },
    
    isSafeInteger(val) {
        // TODO
    }
});

addProps(Number.prototype, {

    clz() {
    
        var n = this >>> 0; // uint32
        // TODO:  Count leading bitwise zeros of n
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

addProps(Array.prototype, {

    copyWithin() {
        // TODO
    },
    
    keys() {
        // TODO
    },
    
    entries() {
        // TODO
    },
    
    fill() {
        // TODO
    },
    
    find() {
        // TODO
    },
    
    findIndex() {
        // TODO
    },
    
    values() {
        // TODO
    }
    
    // TODO:  ArrayIterator??
});

addProps(String, {

    raw() {
        // TODO
    }
});

addProps(String.prototype, {
    
    repeat(count) {
    
        // TODO
        return new Array(count + 1).join(this);
    },
    
    startsWith(search, start) {
    
        // TODO
        start = start >>> 0;
        return this.indexOf(search, start) === start;
    },
    
    endsWith(search, end) {
    
        // TODO
        return this.slice(-search.length) === search;
    },
    
    contains(search, pos) {
    
        // TODO
        return this.indexOf(search, pos >>> 0) !== -1;
    }
});

// TODO:  Should we even be going here?
if (typeof Reflect === "undefined") global.Reflect = {

    hasOwn(obj, name) { return HAS_OWN.call(obj, name); }
};
