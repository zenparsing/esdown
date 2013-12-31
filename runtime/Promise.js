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

function promiseUnwrap(defer, x) {

    if (x === defer.promise)
        throw new TypeError("Promise cannot wrap itself");
    
    if (isPromise(x))
        x.chain(defer.resolve, defer.reject);
    else
        defer.resolve(x);
}

function promiseReact(defer, handler, x) {

    enqueueMicrotask($=> {
    
        try { promiseUnwrap(defer, handler(x)) } 
        catch(e) { defer.reject(e) }
    });
}

class Promise {

    constructor(init) {
    
        if (typeof init !== "function")
            throw new TypeError("Promise constructor called without initializer");
        
        this[$value] = void 0;
        this[$status] = "pending";
        this[$onResolve] = [];
        this[$onReject] = [];
    
        var resolve = x => promiseResolve(this, x),
            reject = r => promiseReject(this, r);
        
        try { init(resolve, reject) } catch (x) { reject(x) }
    }
    
    chain(onResolve, onReject) {
    
        if (typeof onResolve !== "function") onResolve = x => x;
        if (typeof onReject !== "function") onReject = e => { throw e };

        var defer = this.constructor.defer();

        switch (this[$status]) {

            case undefined:
                throw new TypeError("Promise method called on a non-promise");
        
            case "pending":
                this[$onResolve].push([defer, onResolve]);
                this[$onReject].push([defer, onReject]);
                break;
    
            case "resolved":
                promiseReact(defer, onResolve, this[$value]);
                break;
        
            case "rejected":
                promiseReact(defer, onReject, this[$value]);
                break;
        }

        return defer.promise;
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
    
    static isPromise(x) {
        
        return isPromise(x);
    }
    
    static defer() {
    
        var d = {};

        d.promise = new this((resolve, reject) => {
            d.resolve = resolve;
            d.reject = reject;
        });

        return d;
    }
    
    static resolve(x) { 
    
        var d = this.defer();
        d.resolve(x);
        return d.promise;
    }
    
    static reject(x) { 
    
        var d = this.defer();
        d.reject(x);
        return d.promise;
    }
    
}

this.Promise = Promise;

