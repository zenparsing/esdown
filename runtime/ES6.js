var global = this,
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
    }
});

// TODO Math

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
