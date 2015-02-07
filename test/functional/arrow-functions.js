export var tests = {

    "lexical this" (test) {

        function f() {

            var a = _=> this;
            return a();
        }

        var obj = {};

        test._("This value is lexically scoped")
        .equals(f.call(obj), obj);
    },

    "lexical arguments" (test) {

        function f() {

            var a = _=> arguments;
            return Array.from(a("a", "b", "c"));
        }

        test._("The arguments object is lexically scoped")
        .equals(f(1, 2, 3), [1, 2, 3]);
    }

};
