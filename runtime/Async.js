this.es6now.async = function(iterable) {
    
    var iter = es6now.iterator(iterable),
        resolver,
        promise;
    
    promise = new Promise((resolve, reject) => resolver = { resolve, reject });
    resume(void 0, false);
    return promise;
    
    function resume(value, error) {
    
        if (error && !("throw" in iter))
            return resolver.reject(value);
        
        try {
        
            // Invoke the iterator/generator
            var result = error ? iter.throw(value) : iter.next(value),
                value = result.value,
                done = result.done;
            
            if (Promise.isPromise(value)) {
            
                // Recursively unwrap the result value?
                // value = value.chain(function unwrap(x) { return Promise.isPromise(x) ? x.chain(unwrap) : x });
                
                if (done) value.chain(resolver.resolve, resolver.reject);
                else      value.chain(x => resume(x, false), x => resume(x, true));
            
            } else if (done) {
                
                resolver.resolve(value);
                
            } else {
            
                resume(value, false);
            }
            
        } catch (x) { resolver.reject(x) }
        
    }
};
