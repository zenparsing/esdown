function eachKey(obj, fn) {

    var keys = Object.getOwnPropertyNames(obj),
        i;
    
    for (i = 0; i < keys.length; ++i)
        fn(keys[i]);
    
    if (!Object.getOwnPropertySymbols)
        return;
    
    keys = Object.getOwnPropertySymbols(obj);
    
    for (i = 0; i < keys.length; ++i)
        fn(names[i]);
}

function addMethods(obj, methods) {

    eachKey(methods, key => {
    
        if (key in obj)
            return;
        
        Object.defineProperty(obj, key, {
        
            value: methods[key],
            configurable: true,
            enumerable: false,
            writable: true
        });
    });
}


export function main() {

    console.log(es6now.iterator);
    
    for (var x of [1, 2, 3])
        console.log(x);
    
    for (var x of g())
        console.log(x);
    
    function* g() {
        yield 1;
        yield 2;
        yield 3;
    }
}