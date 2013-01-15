module ES5 = "Runtime.ES5.js";

var global = this;

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

export function emulate() {

    ES5.emulate();
    
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
    
    if (typeof Map === "undefined") global.Map = () => {
    
        function Map() {
        
        }
        
        return Map;
        
    }();
    
    if (typeof Set === "undefined") global.Set = () => {
    
        function Set() {
        
        }
        
        return Set;
        
    }();
    
}


