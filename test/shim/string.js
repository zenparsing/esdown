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

    "raw" (test) {

        var callSite = {};

        callSite.raw = [ "The total is ", " ($", " with tax)" ];

        test._("works with an array")
        .equals(String.raw(callSite, 10, 11), "The total is 10 ($11 with tax)")
        .equals(String.raw(callSite, "{total}", "{total * 1.01}"), "The total is {total} (${total * 1.01} with tax)");

        callSite.raw = { 0: "The total is ", 1: " ($", 2: " with tax)", length: 3 };

        test._("works with an object")
        .equals(String.raw(callSite, 10, 11), "The total is 10 ($11 with tax)")
        .equals(String.raw(callSite, "{total}", "{total * 1.01}"), "The total is {total} (${total * 1.01} with tax)");

        callSite.raw = [ "The total is ", " ($", " with tax)" ];
        test._("fewer substitutions")
        .equals(String.raw(callSite, 10), "The total is 10 ($");

        callSite.raw = {};
        test._("empty callsite returns empty string")
        .equals(String.raw(callSite, "{total}", "{total * 1.01}"), "")
        .equals(String.raw(callSite), "");

    },

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

            toString() { return "abc" },
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

            startsWith
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
    },

    "endsWith" (test) {

        var endsWith = "".endsWith;

        test._("throws a TypeError when called on null or undefined");
        testObjectCoercible(test, endsWith);

        test._("should be truthy if and only if correct")
        .assert("test".endsWith("st"))
        .assert(!"test".endsWith("te"))
        .assert(!"".endsWith("/"))
        .assert(!"#".endsWith("/"))
        .assert(!"##".endsWith("///"))
        .assert("abc".endsWith("abc"))
        .assert("abcd".endsWith("bcd"))
        .assert("abc".endsWith("c"))
        .assert(!"abc".endsWith("abcd"))
        .assert(!"abc".endsWith("bbc"))
        .assert(!"abc".endsWith("b"))
        .assert("abc".endsWith("abc", 3))
        .assert("abc".endsWith("bc", 3))
        .assert("abc".endsWith("a", 1))
        .assert(!"abc".endsWith("abc", 1))
        .assert("abc".endsWith("b", 2))
        .assert(!"abc".endsWith("d", 2))
        .assert(!"abc".endsWith("dcd", 2))
        .assert(!"abc".endsWith("a", 42))
        .assert("abc".endsWith("bc", Infinity))
        .assert(!"abc".endsWith("a", Infinity))
        .assert("abc".endsWith("bc", undefined))
        .assert(!"abc".endsWith("bc", -43))
        .assert(!"abc".endsWith("bc", -Infinity))
        .assert(!"abc".endsWith("bc", NaN))
        ;

        if (hasStrict) {

            test._("throws when called with null or undefined")
            .throws($=> "".endsWith.call(null, "ull"), TypeError)
            .throws($=> "".endsWith.call(void 0, "ned"), TypeError)
            ;
        }

        var obj = {

            toString() { return "abc" },
            endsWith
        };

        test
        ._("can be called on a non-string")
        .assert(obj.endsWith("abc"))
        .assert(!obj.endsWith("ab"))
        ;

        var gotPos = false, gotStr = false;

        obj.toString = $=> {

            test.assert(!gotPos);
            gotStr = true;
            return "xyz";
        };

        var index = {

            valueOf() {

                test.assert(gotStr);
                gotPos = true;
                return 42;
            }
        };

        obj.endsWith("elephant", index);
        test.assert(gotPos);

        test

        ._("coerces first argument to a string")
        .assert("abcd".endsWith({ toString() { return "cd" } }))
        .assert(!"abcd".endsWith({ toString() { return "foo" } }))

        ._("regex argument not allowed")
        .throws($=> "abcd".endsWith(/abc/), TypeError)
        .throws($=> "abcd".endsWith(new RegExp("abc")), TypeError)

        ._("handles negative and zero positions correctly")
        .assert(!"abcd".endsWith("bcd", 0))
        .assert(!"abcd".endsWith("bcd", -2))
        .assert(!"abcd".endsWith("b", -2))
        .assert(!"abcd".endsWith("ab", -2))

        ;
    },

    "includes" (test) {

        var includes = "".includes;

        test._("throws a TypeError when called on null or undefined");
        testObjectCoercible(test, includes);

        test._("should be truthy if and only if correct")
        .assert("test".includes("es"))
        .assert("abc".includes("a"))
        .assert("abc".includes("b"))
        .assert("abc".includes("abc"))
        .assert("abc".includes("bc"))
        .assert(!"abc".includes("d"))
        .assert(!"abc".includes("abcd"))
        .assert(!"abc".includes("ac"))
        .assert("abc".includes("abc", 0))
        .assert("abc".includes("bc", 0))
        .assert(!"abc".includes("de", 0))
        .assert("abc".includes("bc", 1))
        .assert("abc".includes("c", 1))
        .assert(!"abc".includes("a", 1))
        .assert(!"abc".includes("abc", 1))
        .assert("abc".includes("c", 2))
        .assert(!"abc".includes("d", 2))
        .assert(!"abc".includes("dcd, 2"))
        .assert(!"abc".includes("a", 42))
        .assert(!"abc".includes("a", Infinity))
        .assert("abc".includes("ab", -43))
        .assert(!"abc".includes("cd", -42))
        .assert("abc".includes("ab", -Infinity))
        .assert(!"abc".includes("cd", -Infinity))
        .assert("abc".includes("ab", NaN))
        .assert(!"abc".includes("cd", NaN))

        ;

        var obj = {

            toString() { return "abc" },
            includes
        };

        test
        ._("can be called on a non-string")
        .assert(obj.includes("abc"))
        .assert(!obj.includes("cd"))
        ;

        var gotPos = false, gotStr = false;

        obj.toString = $=> {

            test.assert(!gotPos);
            gotStr = true;
            return "xyz";
        };

        var index = {

            valueOf() {

                test.assert(gotStr);
                gotPos = true;
                return 42;
            }
        };

        obj.includes("elephant", index);
        test.assert(gotPos);
    },

    "codePointAt" (test) {

        test._("throws a TypeError when called on null or undefined");
        testObjectCoercible(test, "".codePointAt);

        test

        ._("works with ascii")
        .equals("abc".codePointAt(0), 97)
        .equals("abc".codePointAt(1), 98)
        .equals("abc".codePointAt(2), 99)

        ._("works with unicode")
        .equals("\u2500".codePointAt(0), 0x2500)
        .equals("\ud800\udc00".codePointAt(0), 0x10000)
        .equals("\udbff\udfff".codePointAt(0), 0x10ffff)
        .equals("\ud800\udc00\udbff\udfff".codePointAt(0), 0x10000)
        .equals("\ud800\udc00\udbff\udfff".codePointAt(1), 0xdc00)
        .equals("\ud800\udc00\udbff\udfff".codePointAt(2), 0x10ffff)
        .equals("\ud800\udc00\udbff\udfff".codePointAt(3), 0xdfff)

        ._("returns undefined when position is negative or too large")
        .equals("abc".codePointAt(-1), void 0)
        .equals("abc".codePointAt("abc".length), void 0)

        ;
    },

    "fromCodePoint" (test) {

        test._("throws RangeError for invalid cod points");

        ["abc", {}, -1, 0x10FFFF + 1]
        .forEach(val => test.throws($=> String.fromCodePont(val)), RangeError);

        test

        ._("returns the empty string with no args")
        .equals(String.fromCodePoint(), "")

        ._("has a length of zero")
        .equals(String.fromCodePoint.length, 0)

        ;

        test._("returns the correct string for valid code points");

        ($=> {

            var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789…?!",
                list = [];

            for (var i = 0; i < chars.length; ++i) {

                list.push(chars.charCodeAt(i));
                test.equals(String.fromCodePoint(chars.charCodeAt(i)), chars.charAt(i));
            }

            test.equals(String.fromCodePoint.apply(String, list), chars);

        })();

        test
        ._("works with unicode")
        .equals(String.fromCodePoint(0x2500), "\u2500")
        .equals(String.fromCodePoint(0x010000), "\ud800\udc00")
        .equals(String.fromCodePoint(0x10FFFF), "\udbff\udfff")
        ;
    },

    "@@iterator" (test) {

        test

        ._("works with ascii strings")
        .equals(Array.from(Object("abc")), ["a", "b", "c"])

        ._("works with surrogate characters")
        .equals(
            Array.from(Object("\u2500\ud800\udc00\udbff\udfff\ud800")),
            ["\u2500", "\ud800\udc00", "\udbff\udfff", "\ud800" ]
        )
        ;

    }

};
