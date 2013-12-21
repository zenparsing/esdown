var queueTask = ($=> {

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

    return x && $status in Object(x);
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
        throw new TypeError;
    
    if (isPromise(x))
        promiseChain(x, deferred.resolve, deferred.reject);
    else
        deferred.resolve(x);
}

function promiseReact(deferred, handler, x) {

    queueTask($=> {
    
        try { promiseUnwrap(deferred, handler(x)) } 
        catch(e) { deferred.reject(e) }
    });
}

function promiseChain(promise, onResolve, onReject) {

    if (typeof onResolve !== "function") onResolve = x => x;
    if (typeof onReject !== "function") onReject = e => { throw e };

    var deferred = getDeferred(promise.constructor);

    switch (promise[$status]) {

        case undefined:
            throw new TypeError;
        
        case "pending":
            promise[$onResolve].push([deferred, onResolve]);
            promise[$onReject].push([deferred, onReject]);
            break;
    
        case "resolved":
            promiseReact(deferred, onResolve, promise[$value]);
            break;
        
        case "rejected":
            promiseReact(deferred, onReject, promise[$value]);
            break;
    }

    return deferred.promise;
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
            throw new TypeError("Promise constructor called without resolver");
        
        this[$status] = "pending";
        this[$onResolve] = [];
        this[$onReject] = [];
    
        init(x => promiseResolve(this, x), r => promiseReject(this, r));
    }
    
    // Experimental
    __chain(onResolve, onReject) {
    
        return promiseChain(this, onResolve, onReject);
    }

    then(onResolve, onReject) {

        if (typeof onResolve !== "function") onResolve = x => x;
    
        return promiseChain(this, x => {
    
            if (x === this)
                throw new TypeError;
            
            return isPromise(x) ? 
                x.then(onResolve, onReject) : 
                onResolve(x);
        
        }, onReject);
    }
    
    catch(onReject) {

        return this.then(undefined, onReject)
    }
    
    static resolve(x) { 
    
        return new this(resolve => resolve(x));
    }
    
    static reject(x) { 
    
        return new this((resolve, reject) => reject(x));
    }
    
    static cast(x) {

        if (x instanceof this)
            return x;

        var deferred = getDeferred(this);
        promiseUnwrap(deferred, x);
        return deferred.promise;
    }

    static all(values) {

        var deferred = getDeferred(this),
            count = 0,
            resolutions = [];
        
        for (var i = 0; i < values.length; ++i)
            ++count, this.cast(values[i]).then(onResolve(i), onReject);
    
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
    
    static race(values) {
    
        var deferred = getDeferred(this),
            done = false;
            
        for (var i = 0; i < values.length; i++)
            this.cast(values[i]).then(onResolve, onReject);
            
        return deferred.promise;
        
        function onResolve(x) {
        
            if (!done) {
                
                done = true;
                deferred.resolve(x);
            }
        }
        
        function onReject(r) {
        
            if (!done) {
            
                done = true;
                deferred.reject(r);
            }
        }
    }
    
    // Experimental
    static __iterate(iterable) {
    
        // TODO:  Use System.iterator
        var iter = iterable;
        
        var deferred = getDeferred(this),
            constructor = this;
        
        function resume(value, error) {
        
            if (error && !("throw" in iter))
                return deferred.reject(value);
            
            try {
            
                var result = error ? iter.throw(value) : iter.next(value),
                    promise = constructor.cast(result.value);
                
                if (result.done)
                    promiseChain(promise, deferred.resolve, deferred.reject);
                else
                    promiseChain(promise, x => resume(x, false), x => resume(x, true));
                
            } catch (x) {
            
                deferred.reject(x);
            }
        }
        
        resume(void 0, false);
        
        return deferred.promise;
    }

}

this.Promise = Promise;
