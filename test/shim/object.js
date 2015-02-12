export var tests = {

    "is" (test) {

        test._("compares regular objects correctly");
        [null, undefined, [0], 5, 'str', { a: null }]
        .forEach(item => test.assert(Object.is(item, item)));

        test._("0 is not -0").assert(!Object.is(0, -0));
        test._("NaN is NaN").assert(Object.is(NaN, NaN));
    },

    "assign" (test) {

        var target;

        function Foo() { this.baz = true }
        Foo.prototype.bar = true;

        test

        ._("function length property")
        .equals(Object.assign.length, 2)

        ._("returns the target object")
        .equals(Object.assign(target = {}, { a: 1 }), target)

        ._("merges two objects")
        .equals(Object.assign({ a: 1 }, { b: 2 }), { a: 1, b: 2 })

        ._("merges three objects")
        .equals(Object.assign({ a: 1 }, { b: 2 }, { c: 3 }), { a: 1, b: 2, c: 3 })

        ._("only iterates over own keys")
        .equals(Object.assign({ a: 1 }, new Foo), { baz: true, a: 1 })

        ._("throws when target is not an object")
        .throws($=> Object.assign(null), TypeError)

        ._("skips null and undefined sources")
        .equals(Object.assign({ a: 1 }, null, void 0), { a: 1 })

        ._("allows source objects that are not objects")
        .equals(Object.assign({ a: 1 }, true), { a: 1 })

        ._("target is partially modified is error is thrown")
        .equals(target, { a: 1 })

        ;

    }

};
