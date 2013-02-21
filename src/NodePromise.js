module FS = "fs";

import Promise from "../../Promise/src/Promise.js";

var wrappedFS = {};

export class NodePromise extends Promise {

    constructor() {
    
        this.callback = (err, val) => {
        
            if (err) this.reject(err);
            else this.resolve(val);
        };
        
        super();
    }
    
    static get FS() { return wrappedFS; }
    
    // Wraps a standard Node async function with a promise
    // generating function
    static wrapFunction(obj, name) {
    
        return function() {
        
            var a = [].slice.call(arguments, 0),
                promise = new NodePromise;
            
            a.push(promise.callback);
            
            if (name) obj[name].apply(obj, a);
            else obj.apply(null, a);
            
            return promise.future;
        };
    }
     
}


// Add wrapped versions of FS async functions
Object.keys(FS).forEach(key => {

    if (typeof FS[key + "Sync"] === "function")
        wrappedFS[key] = NodePromise.wrapFunction(FS[key]);
});