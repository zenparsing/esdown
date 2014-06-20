export var tests = {

    "static super" (test) {
    
        class C {
        
            static f() { return "c" }
        }
        
        class D extends C {
        
            static f() { return super() + "d" }
        }
        
        test._("super() within a static method calls the base constructor method")
        .equals(D.f(), "cd");
    }
};
