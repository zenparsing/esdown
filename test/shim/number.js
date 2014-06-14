var integers = [5295, -5295, -9007199254740991, 9007199254740991, 0, -0];
var nonIntegers = [-9007199254741992, 9007199254741992, 5.9];
var infinities = [Infinity, -Infinity];
var nonNumbers = [void 0, true, null, {}, [], "str"];

export var tests = {

    "constants" (test) {
    
        test
        ._("max safe integer")
        .equals(Number.MAX_SAFE_INTEGER, Math.pow(2, 53) - 1)
        ._("min safe integer")
        .equals(Number.MIN_SAFE_INTEGER, -Math.pow(2, 53) + 1)
        ._("epsilon")
        .equals(Number.EPSILON, 2.2204460492503130808472633361816e-16)
        ;
    },
    
    "parseInt" (test) {
    
        test
        ._("works on integer strings")
        .equals(Number.parseInt("601"), 601)
        ;
    },
    
    "parseFloat" (test) {
    
        test
        ._("works on decimal strings")
        .equals(Number.parseFloat("5.5"), 5.5)
        ;
    },
    
    "isFinite" (test) {
    
        test._("integers");
        integers.forEach(x => test.assert(Number.isFinite(x)));
        
        test._("infinities");
        infinities.forEach(x => test.assert(!Number.isFinite(x)));
        
        test._("non numbers");
        nonNumbers.forEach(x => test.assert(!Number.isFinite(x)));
        
        test._("NaN").assert(!Number.isFinite(NaN));
        
        test
        ._("no type conversion is applied")
        .assert(!Number.isFinite({ valueOf() { return 3 }, toString() { return "3" } }))
        ;
        
    },
    
    "isInteger" (test) {
    
        test._("integers");
        integers.forEach(x => test.assert(Number.isInteger(x)));
        [4, 4.0, 1801439850948].forEach(x => test.assert(Number.isInteger(x)));
        
        test._("non integers");
        [
            false,
            true,
            null,
            undefined,
            '',
            'str',
            function() {},
            { valueOf() { return 3 } },
            { valueOf() { return 0/0 } },
            { valueOf() { throw 17 } },
            { toString() { throw 17 } },
            { valueOf() { throw 17 }, toString() { throw 42 } },
            /a/g,
            {}
            
        ].forEach(x => test.assert(!Number.isInteger(x)));
        
        test._("NaN").assert(!Number.isInteger(NaN));
        
        test._("infinities");
        infinities.forEach(x => test.assert(!Number.isInteger(x)));
        
        test
        ._("larger than max safe int")
        .assert(Number.isInteger(Math.pow(2, 54)))
        ._("less than min safe int")
        .assert(Number.isInteger(-Math.pow(2, 54)))
        ;
        
    },
    
    "isSafeInteger" (test) {
    
        test._("integers");
        integers.forEach(x => test.assert(Number.isSafeInteger(x)));
        [4, 4.0, 1801439850948].forEach(x => test.assert(Number.isSafeInteger(x)));
        
        test._("non integers");
        [
            false,
            true,
            null,
            undefined,
            '',
            'str',
            function() {},
            { valueOf() { return 3 } },
            { valueOf() { return 0/0 } },
            { valueOf() { throw 17 } },
            { toString() { throw 17 } },
            { valueOf() { throw 17 }, toString() { throw 42 } },
            /a/g,
            {}
            
        ].forEach(x => test.assert(!Number.isSafeInteger(x)));
        
        test._("NaN").assert(!Number.isSafeInteger(NaN));
        
        test._("infinities");
        infinities.forEach(x => test.assert(!Number.isSafeInteger(x)));
        
        test
        ._("larger than max safe int")
        .assert(!Number.isSafeInteger(Math.pow(2, 54)))
        ._("less than min safe int")
        .assert(!Number.isSafeInteger(-Math.pow(2, 54)))
        ;
        
    },
    
    "isNaN" (test) {
    
        test._("true for NaN").assert(Number.isNaN(NaN));
    
        test._("false for everything other than NaN");
        integers.forEach(x => test.assert(!Number.isNaN(x)));
        nonIntegers.forEach(x => test.assert(!Number.isNaN(x)));
        nonNumbers.forEach(x => test.assert(!Number.isNaN(x)));
        infinities.forEach(x => test.assert(!Number.isNaN(x)));
        test.assert(!Number.isNaN({ valueOf() { return NaN }, toString() { return "abc" } }));
        
    }
    
};
