var hasStrict = (function() { return this===null; }).call(null);

function testObjectCoercible(test, fn) {

    if (!hasStrict)
        return;
    
    test
    .throws($=> fn.call(void 0), TypeError)
    .throws($=> fn.call(null), TypeError)
    .throws($=> fn.apply(void 0), TypeError)
    .throws($=> fn.apply(null), TypeError);
}

export var tests = {

    "repeat" (test) {
    
        var repeat = "".repeat;
        
        test._("throws a TypeError when called on null or undefined");
        testObjectCoercible(test, repeat);
        
        test._("throws a RangeError when negative or infinite")
        .throws($=> "test".repeat(-1), RangeError)
        .throws($=> "test".repeat(Infinity), RangeError)
        ;
        
        test._("coerces to an integer")
        .equals("test".repeat(null), "")
        .equals("test".repeat(false), "")
        .equals("test".repeat(""), "")
        .equals("test".repeat(NaN), "")
        .equals("test".repeat({}), "")
        .equals("test".repeat([]), "")
        .equals("test".repeat({ valueOf() { return 2 } }), "testtest")
        ;
        
        var d = new Date;
        
        test
        ._("works with strings").equals("test".repeat(3), "testtesttest")
        ._("works with integers").equals(repeat.call(2, 3), "222")
        ._("works with booleans").equals(repeat.call(true, 3), "truetruetrue")
        ._("works with dates").equals(repeat.call(d, 3), [d, d, d].join(""))
        ;
        
    },
    
    "startsWith" (test) {
    
        var startsWith = "".startsWith;
        
        test._("throws a TypeError when called on null or undefined");
        testObjectCoercible(test, startsWith);
        
        test._("should be truthy if and only if correct")
        .assert("test".startsWith("te"))
        .assert(!"test".startsWith("st"))
        .assert(!"".startsWith("/"))
        .assert(!"#".startsWith("/"))
        .assert(!"##".startsWith("///"))
        .assert("abc".startsWith("abc"))
        .assert("abcd".startsWith("abc"))
        .assert("abc".startsWith("a"))
        .assert(!"abc".startsWith("abcd"))
        .assert(!"abc".startsWith("bcde"))
        .assert(!"abc".startsWith("b"))
        .assert("abc".startsWith("abc", 0))
        .assert(!"abc".startsWith("bc", 0))
        .assert("abc".startsWith("bc", 1))
        .assert(!"abc".startsWith("c", 1))
        .assert(!"abc".startsWith("abc", 1))
        .assert("abc".startsWith("c", 2))
        .assert(!"abc".startsWith("d", 2))
        .assert(!"abc".startsWith("dcd", 2))
        .assert(!"abc".startsWith("a", 42))
        .assert(!"abc".startsWith("a", Infinity))
        .assert("abc".startsWith("a", NaN))
        .assert(!"abc".startsWith("b", NaN))
        .assert("abc".startsWith("ab", -43))
        .assert("ab".startsWith("a", -Infinity))
        .assert(!"abc".startsWith("bc", -42))
        .assert(!"abc".startsWith("bc", -Infinity))
        ;

        var obj, gotStr = false, gotPos = false;
        
        obj = {
        
            toString() { return "abc"; },
            startsWith: startsWith
        };
        
        test.assert(obj.startsWith("abc"));
        test.assert(!obj.startsWith("bc"));

        obj = {
        
            toString() {
          
                test.assert(!gotPos);
                gotStr = true;
                return "xyz";
            },
            
            startsWith: startsWith
        };
        
        var idx = {
        
            valueOf() {

                test.assert(gotStr);
                gotPos = true;
                return 42;
            }
        };
        
        obj.startsWith("elephant", idx);
        test.assert(gotPos);
        
        test._("coerces first argument to a string")
        .assert("abcd".startsWith({ toString() { return "ab" } }))
        .assert(!"abcd".startsWith({ toString() { return "foo" } }))
        ;
        
        test._("regex argument not allowed")
        .throws($=> "abc".startsWith(/a/), TypeError)
        .throws($=> "abc".startsWith(new RegExp("a")), TypeError)
        ;
    }
    
};
