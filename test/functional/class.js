export var tests = {

    /* Disabled: requires subclassing
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
    }
    */
};
