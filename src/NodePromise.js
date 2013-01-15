module FS = "fs";

import Promise from "../../Promise/src/Promise.js";

export class NodePromise extends Promise {

    constructor() {
    
        this.callback = (err, val) => {
        
            if (err) this.reject(err);
            else this.resolve(val);
        };
        
        super();
    }
}

// Wraps a standard Node async function with a promise
// generating function
function wrap(obj, name) {

	return function() {
	
		var a = [].slice.call(arguments, 0),
			promise = new NodePromise;
		
		a.push(promise.callback);
		
		if (name) obj[name].apply(obj, a);
    	else obj.apply(null, a);
		
		return promise.future;
	};
}

NodePromise.when = Promise.when;
NodePromise.wrapFunction = wrap;
NodePromise.FS = {};

// Add wrapped versions of FS async functions
Object.keys(FS).forEach(key => {

    if (typeof FS[key + "Sync"] === "function")
        NodePromise.FS[key] = wrap(FS[key]);
});