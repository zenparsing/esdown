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
