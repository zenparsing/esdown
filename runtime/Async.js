function unwrap(x) {
    
    return Promise.isPromise(x) ? x.chain(unwrap) : x;
}

function iterate(iterable) {
    
    // TODO: Use "iterable" interface to get an iterator
    // var iter = iterable[Symbol.iterator]
    
    var iter = iterable;
    
    var deferred = Promise.defer();
    resume(void 0, false);
    return deferred.promise;
    
    function resume(value, error) {
    
        if (error && !("throw" in iter))
            return deferred.reject(value);
        
        try {
        
            // Invoke the iterator/generator
            var result = error ? iter.throw(value) : iter.next(value),
                value = result.value,
                done = result.done;
            
            if (Promise.isPromise(value)) {
            
                // Recursively unwrap the result value
                value = value.chain(unwrap);
                
                if (done)
                    value.chain(deferred.resolve, deferred.reject);
                else
                    value.chain(x => resume(x, false), x => resume(x, true));
            
            } else if (done) {
                
                deferred.resolve(value);
                
            } else {
            
                resume(value, false);
            }
            
        } catch (x) {
        
            deferred.reject(x);
        }
    }
}

this.es6now.async = iterate;
