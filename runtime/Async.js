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
                value = Promise.resolve(result.value),
                done = result.done;
            
            if (result.done)
                value.chain(resolver.resolve, resolver.reject);
            else
                value.chain(x => resume(x, false), x => resume(x, true));
            
        } catch (x) { resolver.reject(x) }
        
    }
};
