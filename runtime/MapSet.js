var HOP = Object.prototype.hasOwnProperty;

class MapIterator {

    constructor(data, kind) {
    
        this.data = data;
        this.current = 0;
        this.kind = kind;
    }

    next() {
    
        var array = Object.keys(this.data),
            length = array.length,
            index = this.current;
        
        if (index >= length) {
        
            this.current = Infinity;
            return { value: void 0, done: true };
        }
        
        this.current += 1;
        
        var key = array[index];
        
        switch (this.kind) {
        
            case "values":
                return { value: this.data[key], done: false };
            
            case "entries":
                return { value: [ key, this.data[key] ], done: false };
            
            default:
                return { value: key, done: false };
        }
    }
    
    [Symbol.iterator]() { return this }
}

class Map {

    constructor() {
    
        if (arguments.length > 0)
            throw new Error("Arguments to Map constructor are not supported");
        
        this._data = {};
    }
    
    clear() {
    
        this._data = {};
    }
    
    delete(key) {
        
        if (typeof key === "string" && HOP.call(this._data, key)) {
        
            delete this._data[key];
            return true;
        }
        
        return false;
    }
    
    forEach(fn) {
    
        var thisArg = arguments[1];
        
        if (typeof fn !== "function")
            throw new TypeError(fn + " is not a function");
        
        Object.keys(this._data).forEach(k => fn.call(thisArg, this._data[k], k, this));
    }
    
    get(key) {
    
        if (typeof key === "string" && HOP.call(this._data, key))
            return this._data[key];
        
        return void 0;
    }
    
    has(key) {
    
        return typeof key === "string" && HOP.call(this._data, key);
    }
    
    set(key, val) {
    
        if (typeof key !== "string")
            throw new Error("Map does not support non-string keys");
        
        this._data[key] = val;
    }
    
    get size() {
    
        return Object.keys(this._data).length;
    }
    
    keys() { return new MapIterator(this._data, "keys") }
    values() { return new MapIterator(this._data, "values") }
    entries() { return new MapIterator(this._data, "entries") }
    
    [Symbol.iterator]() { return new MapIterator(this._data, "entries") }
    
}

class Set {

    constructor() {
    
        if (arguments.length > 0)
            throw new Error("Arguments to Set constructor are not supported");
        
        this._data = {};
    }
    
    clear() {
    
        this._data = {};
    }
    
    delete(val) {
    
        if (typeof val === "string" && HOP.call(this._data, val)) {
        
            delete this._data[val];
            return true;
        }
        
        return false;
    }
    
    forEach(fn) {
    
        var thisArg = arguments[1];
        
        if (typeof fn !== "function")
            throw new TypeError(fn + " is not a function");
        
        Object.keys(this._data).forEach(k => fn.call(thisArg, this._data[k], k, this));
    }
    
    has(val) {
    
        return typeof val === "string" && HOP.call(this._data, val);
    }
    
    add(val) {
    
        if (typeof val !== "string")
            throw new Error("Set does not support non-string values");
        
        this._data[val] = val;
    }
    
    get size() {
    
        return Object.keys(this._data).length;
    }
    
    keys() { return new MapIterator(this._data, "keys") }
    values() { return new MapIterator(this._data, "values") }
    entries() { return new MapIterator(this._data, "entries") }
    
    [Symbol.iterator]() { return new MapIterator(this._data, "entries") }
    
}

if (this.Map === void 0 || !this.Map.prototype.forEach) {

    this.Map = Map;
    this.Set = Set;
}
