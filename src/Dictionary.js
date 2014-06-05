var HAS = Object.prototype.hasOwnProperty;

export class Dictionary {

    constructor() {
    
        this._map = {};
    }
    
    get(key) {
    
        if (HAS.call(this._map, key))
            return this._map[key];
    }
    
    set(key, value) {
    
        this._map[key] = value;
        return this;
    }
    
    has(key) {
    
        return HAS.call(this._map, key);
    }
    
    delete(key) {
    
        if (!HAS.call(this._map, key))
            return false;
        
        delete this._map[key];
        return true;
    }
    
    clear() {
    
        this._map = {};
    }
    
    keys() {
    
        return Object.keys(this._map);
    }
    
    values() {
    
        return Object.keys(this._map).map(key => this._map[key]);
    }
    
    forEach(fn, thisArg) {
    
        var keys = this.keys(), i;
        
        for (i = 0; i < keys.length; ++i)
            fn.call(thisArg, this._map[keys[i]], keys[i], this);
    }
}

export class NameSet {

    constructor() {
    
        this._map = new Dictionary;
    }
    
    has(key) {
    
        return this._map.has(key);
    }
    
    add(key) {
    
        this._map.set(key, key);
        return this;
    }
    
    delete(key) {
    
        return this._map.delete(key);
    }
    
    clear() {
    
        this._map.clear();
    }
    
    keys() {
    
        return this._map.keys();
    }
    
    values() {
    
        return this._map.keys();
    }
    
    forEach(fn, thisArg) {
    
        this._map.forEach((value, key) => fn.call(thisArg, value, key, this));
    }
}
