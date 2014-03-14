class C {

    *[Symbol.iterator]() {
    
        yield 1;
        yield 2;
        yield 3;
    }
}

export function main() {

    for (var x of new C)
        console.log(x);
}
