function getDeferred(constructor) {

    var result = {};

    result.promise = new constructor((resolve, reject) => {
        result.resolve = resolve;
        result.reject = reject;
    });

    return result;
}

function promiseWhen(constructor, x) {

    if (Promise.isPromise(x))
        return x.chain(x => promiseWhen(constructor, x));
    
    var deferred = getDeferred(constructor);
    deferred.resolve(x);
    return deferred.promise;
}

function promiseIterate(iterable) {
    
    // TODO:  Use System.iterator
    var iter = iterable;
    
    var constructor = Promise,
        deferred = getDeferred(constructor);
    
    function resume(value, error) {
    
        if (error && !("throw" in iter))
            return deferred.reject(value);
        
        try {
        
            // Invoke the iterator/generator
            var result = error ? iter.throw(value) : iter.next(value);
            
            // Recursively unwrap the result value
            var promise = promiseWhen(constructor, result.value);
            
            if (result.done)
                promise.chain(deferred.resolve, deferred.reject);
            else
                promise.chain(x => resume(x, false), x => resume(x, true));
            
        } catch (x) {
        
            deferred.reject(x);
        }
    }
    
    resume(void 0, false);
    
    return deferred.promise;
}

this.__async = promiseIterate;
