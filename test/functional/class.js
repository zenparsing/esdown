export var tests = {

    "static super" (test) {

        class C {

            static f() { return "c" }
        }

        class D extends C {

            static f() { return super.f() + "d" }
        }

        var Cx = class C { static f() { return "c" } };
        var Dx = class D extends Cx { static f() { return super.f() + "d" } };

        test._("super.method() within a static method calls the base constructor method")
        .equals(D.f(), "cd")
        .equals(Dx.f(), "cd")
        ;
    },

    "static accessors" (test) {

        var x = 1;

        class C {

            static get x() { return x }
            static set x(value) { x = value }
        }

        test._("static accessors are properly defined on the constructor")
        .equals(C.x, 1)
        .equals((C.x = 2, C.x), 2)
        ;

        class D extends C {

            static get x() { return 5 }
        }

        /* TODO
        test._("static inherited accessors are properly defined on the constructor")
        .equals(D.x, 5)
        .equals((D.x = 0, x), 0)
        ;
        */
    }
};
