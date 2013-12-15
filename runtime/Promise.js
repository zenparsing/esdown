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
    
    for (var i in reactions) 
        promiseReact(reactions[i][0], reactions[i][1], value);
        
    promise[$status] = status;
    promise[$value] = value;
    promise[$onResolve] = promise[$onReject] = void 0;
}

function promiseReact(deferred, handler, x) {

    queueTask($=> {
    
        try {
        
            var y = handler(x);
        
            if (y === deferred.promise)
                throw new TypeError;
            else if (isPromise(y))
                y.chain(deferred.resolve, deferred.reject);
            else
                deferred.resolve(y);
        
        } catch(e) { deferred.reject(e) }
    });
}

function promiseCoerce(constructor, x) {

    if (isPromise(x))
        return x;
    
    // [A+ compatibility]
    // if (!(x && "then" in Object(x))
    //    return x;
        
    if (!(x && "then" in Object(x) && typeof x.then === "function"))
        return x;
    
    var deferred = promiseDeferred(constructor);
      
    try { x.then(deferred.resolve, deferred.reject) } 
    catch(e) { deferred.reject(e) }
    
    return deferred.promise;
}

function promiseDeferred(constructor) {

    var result = {};

    result.promise = new constructor((resolve, reject) => {
        result.resolve = resolve;
        result.reject = reject;
    });

    return result;
}

class Promise {

    constructor(init) {
    
        this[$status] = "pending";
        this[$onResolve] = [];
        this[$onReject] = [];
    
        init(x => promiseResolve(this, x), r => promiseReject(this, r));
    }
    
    chain(onResolve, onReject) {

        // [A+ compatibility]
        // onResolve = onResolve || (x => x);
        // onReject = onReject || (e => { throw e });
    
        if (typeof onResolve !== "function") onResolve = x => x;
        if (typeof onReject !== "function") onReject = e => { throw e };
    
        var deferred = promiseDeferred(this.constructor);
    
        switch (this[$status]) {
    
            case undefined:
                throw new TypeError;
            
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
    
    catch(onReject) {

        // TODO: if !onReject, should it default to x => x?
        return this.chain(undefined, onReject)
    }

    then(onResolve, onReject) {

        // [A+ compatibility]
        // onResolve = onResolve || (x => x);
    
        if (typeof onResolve !== "function") onResolve = x => x;
    
        var constructor = this.constructor;
    
        return this.chain(x => {
    
            x = promiseCoerce(constructor, x);
        
            if (x === this)
                throw new TypeError;
        
            return isPromise(x) ?
                x.then(onResolve, onReject) :
                onResolve(x);
        
        }, onReject);
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

        if (!isPromise(x))
            return this.resolve(x);
    
        var result = promiseDeferred();
        x.chain(result.resolve, result.reject);
        return result.promise;
    }

    static all(values) {

        var deferred = promiseDeferred(this),
            count = 0,
            resolutions = [];
        
        for (var i in values) {
    
            ++count;
        
            this.cast(values[i]).chain(onResolve(i), r => {
        
                if (count > 0) { 
            
                    count = 0; 
                    deferred.reject(r);
                }
            });
        }
    
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
    }
    
    
    // Experimental
    static __iterate(iterable) {
    
        
    }

}

this.Promise = Promise;
