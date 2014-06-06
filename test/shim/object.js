export var tests = {

    "is" (test) {
    
        test._("compares regular objects correctly");
        [null, undefined, [0], 5, 'str', { a: null }]
        .forEach(item => test.assert(Object.is(item, item)));
        
        test._("0 is not -0").assert(!Object.is(0, -0));
        test._("NaN is NaN").assert(Object.is(NaN, NaN));
    }
    
};
