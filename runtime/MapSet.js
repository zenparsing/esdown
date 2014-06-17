var global = this,
    ORIGIN = {}, 
    REMOVED = {};

class MapNode {

    constructor(key, val) {
    
        this.key = key;
        this.value = val;
        this.prev = this;
        this.next = this;
    }
    
    insert(next) {
    
        this.next = next;
        this.prev = next.prev;
        this.prev.next = this;
        this.next.prev = this;
    }
    
    remove() {
    
        this.prev.next = this.next;
        this.next.prev = this.prev;
        this.key = REMOVED;
    }

}

class MapIterator {

    constructor(node, kind) {
    
        this.current = node;
        this.kind = kind;
    }

    next() {
        
        var node = this.current;
        
        while (node.key === REMOVED)
            node = this.current = this.current.next;
        
        if (node.key === ORIGIN)
            return { value: void 0, done: true };
        
        this.current = this.current.next;
        
        switch (this.kind) {
        
            case "values":
                return { value: node.value, done: false };
            
            case "entries":
                return { value: [ node.key, node.value ], done: false };
            
            default:
                return { value: node.key, done: false };
        }
    }
    
    [Symbol.iterator]() { return this }
}

function hashKey(key) {

    switch (typeof key) {
    
        case "string": return "$" + key;
        case "number": return String(key);
    }
    
    throw new TypeError("Map and Set keys must be strings or numbers in es6now");
}

class Map {

    constructor() {
    
        if (arguments.length > 0)
            throw new Error("Arguments to Map constructor are not supported in es6now");
        
        this._index = {};
        this._origin = new MapNode(ORIGIN);
    }
    
    clear() {
        
        for (var node = this._origin.next; node !== this._origin; node = node.next)
            node.key = REMOVED;
        
        this._index = {};
        this._origin = new MapNode(ORIGIN);
    }
    
    delete(key) {
        
        var h = hashKey(key), 
            node = this._index[h];
        
        if (node) {
        
            node.remove();
            delete this._index[h];
            return true;
        }
        
        return false;
    }
    
    forEach(fn) {
    
        var thisArg = arguments[1];
        
        if (typeof fn !== "function")
            throw new TypeError(fn + " is not a function");
        
        for (var node = this._origin.next; node.key !== ORIGIN; node = node.next)
            if (node.key !== REMOVED)
                fn.call(thisArg, node.value, node.key, this);
    }
    
    get(key) {
    
        var h = hashKey(key), 
            node = this._index[h];
        
        return node ? node.value : void 0;
    }
    
    has(key) {
    
        return hashKey(key) in this._index;
    }
    
    set(key, val) {
    
        var h = hashKey(key),
            node = this._index[h];
        
        if (node) {
        
            node.value = val;
            return;
        }

        node = new MapNode(key, val);
        
        this._index[h] = node;
        node.insert(this._origin);
    }
    
    get size() {
    
        return Object.keys(this._index).length;
    }
    
    keys() { return new MapIterator(this._origin.next, "keys") }
    values() { return new MapIterator(this._origin.next, "values") }
    entries() { return new MapIterator(this._origin.next, "entries") }
    
    [Symbol.iterator]() { return new MapIterator(this._origin.next, "entries") }
    
}

var mapSet = Map.prototype.set;

class Set {

    constructor() {
    
        if (arguments.length > 0)
            throw new Error("Arguments to Set constructor are not supported in es6now");
        
        this._index = {};
        this._origin = new MapNode(ORIGIN);
    }
    
    add(key) { return mapSet.call(this, key, key) }
    
    [Symbol.iterator]() { return new MapIterator(this._origin.next, "entries") }
    
}

// Copy shared prototype members to Set
["clear", "delete", "forEach", "has", "size", "keys", "values", "entries"].forEach(k => {

    var d = Object.getOwnPropertyDescriptor(Map.prototype, k);
    Object.defineProperty(Set.prototype, k, d);
});

if (global._testES6Shims || this.Map === void 0 || !this.Map.prototype.forEach) {

    this.Map = Map;
    this.Set = Set;
}
