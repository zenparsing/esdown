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

// The following property names are used to simulate the internal data
// slots that are defined for Promise objects.

var $status = "Promise#status",
    $value = "Promise#value",
    $onResolve = "Promise#onResolve",
    $onReject = "Promise#onReject";

// The following property name is used to simulate the built-in symbol @@isPromise
var $$isPromise = "@@isPromise";

function isPromise(x) { 

    return !!x && $$isPromise in Object(x);
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

        var deferred = this.constructor.defer();

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
        
        /*
        
        return this.chain(x => {
        
            if (isPromise(x))
                return x.then(onResolve, onReject);
            
            return onResolve(x);
            
        }, onReject);
        
        */
        
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
    
    static cast(x) {

        if (x instanceof this)
            return x;

        var deferred = this.defer();
        promiseUnwrap(deferred, x);
        return deferred.promise;
    }

    static all(values) {

        var deferred = this.defer(),
            count = 0,
            resolutions;
        
        for (var i = 0; i < values.length; ++i) {
        
            count += 1;
            this.cast(values[i]).then(onResolve(i), onReject);
        }
        
        resolutions = new Array(count);
    
        if (count === 0) 
            deferred.resolve(resolutions);
        
        return deferred.promise;
    
        function onResolve(i) {
    
            return x => {
        
                resolutions[i] = x;
            
                if (--count === 0)
                    deferred.resolve(resolutions);
            };
        }
        
        function onReject(r) {
        
            if (count > 0) { 
        
                count = 0; 
                deferred.reject(r);
            }
        }
    }
    
}

Promise.prototype[$$isPromise] = true;

this.Promise = Promise;
