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
    }
}
