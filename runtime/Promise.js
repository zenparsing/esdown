var enqueueMicrotask = ($=> {

    var window = this.window,
        process = this.process,
        msgChannel = null,
        list = [];
    
    if (typeof setImmediate === "function") {
    
        return window ?
            window.setImmediate.bind(window) :
            setImmediate;
    
    } else if (process && typeof process.nextTick === "function") {
    
        return process.nextTick;
        
    } else if (window && window.MessageChannel) {
        
        msgChannel = new window.MessageChannel();
        msgChannel.port1.onmessage = $=> { if (list.length) list.shift()(); };
    
        return fn => {
        
            list.push(fn);
            msgChannel.port2.postMessage(0);
        };
    }
    
    return fn => setTimeout(fn, 0);

})();


var $status = "Promise#status",
    $value = "Promise#value",
    $onResolve = "Promise#onResolve",
    $onReject = "Promise#onReject";

function isPromise(x) { 

    return !!x && $status in Object(x);
}

function promiseResolve(promise, x) {
    
    promiseDone(promise, "resolved", x, promise[$onResolve]);
}

function promiseReject(promise, x) {
    
    promiseDone(promise, "rejected", x, promise[$onReject]);
}

function promiseDone(promise, status, value, reactions) {

    if (promise[$status] !== "pending") 
        return;
        
    promise[$status] = status;
    promise[$value] = value;
    promise[$onResolve] = promise[$onReject] = void 0;
    
    for (var i = 0; i < reactions.length; ++i) 
        promiseReact(reactions[i][0], reactions[i][1], value);
}

function promiseUnwrap(deferred, x) {

    if (x === deferred.promise)
        throw new TypeError("Promise cannot wrap itself");
    
    if (isPromise(x))
        x.chain(deferred.resolve, deferred.reject);
    else
        deferred.resolve(x);
}

function promiseReact(deferred, handler, x) {

    enqueueMicrotask($=> {
    
        try { promiseUnwrap(deferred, handler(x)) } 
        catch(e) { deferred.reject(e) }
    });
}

function getDeferred(constructor) {

    var result = {};

    result.promise = new constructor((resolve, reject) => {
        result.resolve = resolve;
        result.reject = reject;
    });

    return result;
}

class Promise {

    constructor(init) {
    
        if (typeof init !== "function")
            throw new TypeError("Promise constructor called without initializer");
        
        this[$status] = "pending";
        this[$onResolve] = [];
        this[$onReject] = [];
    
        init(x => promiseResolve(this, x), r => promiseReject(this, r));
    }
    
    chain(onResolve, onReject) {
    
        if (typeof onResolve !== "function") onResolve = x => x;
        if (typeof onReject !== "function") onReject = e => { throw e };

        var deferred = getDeferred(this.constructor);

        switch (this[$status]) {

            case undefined:
                throw new TypeError("Promise method called on a non-promise");
        
            case "pending":
                this[$onResolve].push([deferred, onResolve]);
                this[$onReject].push([deferred, onReject]);
                break;
    
            case "resolved":
                promiseReact(deferred, onResolve, this[$value]);
                break;
        
            case "rejected":
                promiseReact(deferred, onReject, this[$value]);
                break;
        }

        return deferred.promise;
    }
    
    then(onResolve, onReject) {

        if (typeof onResolve !== "function") onResolve = x => x;
    
        return this.chain(x => {
    
            if (x && typeof x === "object") {
            
                var maybeThen = x.then;
                
                if (typeof maybeThen === "function")
                    return maybeThen.call(x, onResolve, onReject);
            }
            
            return onResolve(x);
        
        }, onReject);
    }
    
    static resolve(x) { 
    
        return new this(resolve => resolve(x));
    }
    
    static reject(x) { 
    
        return new this((resolve, reject) => reject(x));
    }
    
    static isPromise(x) {
        
        return isPromise(x);
    }
    
}

this.Promise = Promise;
