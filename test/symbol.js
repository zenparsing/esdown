var sym = Symbol();

class C {

    *[Symbol.iterator]() {
    
        yield 1;
        yield 2;
        yield 3;
    }
    
    [sym]() {
    
        return "askdfj";
    }
}

export function main() {

    var c = new C;
    
    console.log(typeof Symbol.iterator);
    console.log(typeof C.prototype[Symbol.iterator]);

    var obj = {
    
        [Symbol.iterator]() {}
    };
    
    console.log(Object.getOwnPropertyDescriptor(obj, Symbol.iterator));
    
    for (var x of c)
        console.log(x);
}
