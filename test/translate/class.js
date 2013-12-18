class A extends B {

    constructor() {
    
        super();
    }
    
    set a(value) {}
    
    get b(value) {}
    
    bar(x, y) {
    
        super.bar(x, y);
        super["bar"](x, y);
        super.foo.foo();
        
        x => { super.foo }
    }
    
    static S() {}
    
    static get T() {}
    
    static "U"() {}
}

class A {

    foo() {}
}

class A extends B {

    constructor() { super() }
}

class A extends B {

}

(class C {});

new class {};
