export var tests = {

    "static super" (test) {
    
        class C {
        
            static f() { return "c" }
        }
        
        class D extends C {
        
            static f() { return super() + "d" }
        }
        
        var Cx = class C { static f() { return "c" } };
        var Dx = class D extends Cx { static f() { return super() + "d" } };
        
        test._("super() within a static method calls the base constructor method")
        .equals(D.f(), "cd")
        .equals(Dx.f(), "cd")
        ;
    }
};
