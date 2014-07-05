function args() { return arguments }

class Foo {

    constructor(length) {
    
        this.length = length;
    }
    
    static of(...args) {
    
        var f = new this(args.length);
        
        for (var i = 0; i < args.length; ++i)
            f[i] = args[i];
        
        return f;
    }
}

export var tests = {

    "from" (test) {
    
        var thisArg = {};
        
        test
        
        ._("function length property")
        .equals(Array.from.length, 1)
        
        ._("create correct array from iterable")
        .equals(Array.from(args(0, 1, 2)), [0, 1, 2])
        .equals(Array.from([null, undefined, 0.1248, -0, 0]), [null, undefined, 0.1248, -0, 0])
        .equals(Array.from([null, undefined, 0.1248, -0, 0].values()), [null, undefined, 0.1248, -0, 0])
        
        ._("handle empty iterables")
        .equals(Array.from(args()), [])
        
        ._("works with other constructors")
        .equals(Array.from.call(Foo, ["a", "b", "c"]), Foo.of("a", "b", "c"))
        
        ._("can be called without a this")
        .equals(Array.from.call(void 0, ["a", "b", "c"]), ["a", "b", "c"])
        
        ._("supports a map function")
        .equals(Array.from([1, 2, 3], x => x * 2), [2, 4, 6])
        
        ._("throws when second parameter is not a function")
        .throws($=> Array.from([], false), TypeError)
        .throws($=> Array.from([], true), TypeError)
        .throws($=> Array.from([], /a/g), TypeError)
        .throws($=> Array.from([], {}), TypeError)
        .throws($=> Array.from([], []), TypeError)
        .throws($=> Array.from([], ""), TypeError)
        .throws($=> Array.from([], 3), TypeError)
        
        ._("supports a this argument")
        .equals(Array.from([1, 2, 3], function(x) {
        
            test.equals(this, thisArg);
            return x * 2;
        
        }, thisArg), [2, 4, 6])
        
        ._("throws when first parameter is null or undefined")
        .throws($=> Array.from(), TypeError)
        .throws($=> Array.from(void 0), TypeError)
        .throws($=> Array.from(null), TypeError)
        
        ._("returns an empty array when given a non-iterable, non-array-like")
        .equals(Array.from(3), [])
        
        ._("fills holes with undefined")
        .equals(Array.from([0,,2]), [0, void 0, 2])
        
        ;
        
    },

    "of" (test) {
    
        test
        ._("function length property")
        .equals(Array.of.length, 0)
        ._("create an array from arguments")
        .equals(Array.of(1, null, void 0), [1, null, void 0])
        ._("can be called without this")
        .equals(Array.of.call(void 0, 0, 1), [0, 1])
        ;
    },

    "copyWithin" (test) {
        
        test
        
        ._("function length property")
        .equals(Array.prototype.copyWithin.length, 2)
        
        ._("works with 2 args")
        .equals([1, 2, 3, 4, 5].copyWithin(0, 3), [4, 5, 3, 4, 5])
        .equals([1, 2, 3, 4, 5].copyWithin(1, 3), [1, 4, 5, 4, 5])
        .equals([1, 2, 3, 4, 5].copyWithin(1, 2), [1, 3, 4, 5, 5])
        .equals([1, 2, 3, 4, 5].copyWithin(2, 2), [1, 2, 3, 4, 5])
        
        ._("works with 3 args")
        .equals([1, 2, 3, 4, 5].copyWithin(0, 3, 4), [4, 2, 3, 4, 5])
        .equals([1, 2, 3, 4, 5].copyWithin(1, 3, 4), [1, 4, 3, 4, 5])
        .equals([1, 2, 3, 4, 5].copyWithin(1, 2, 4), [1, 3, 4, 4, 5])
        
        ._("works with negative args")
        .equals([1, 2, 3, 4, 5].copyWithin(0, -2), [4, 5, 3, 4, 5])
        .equals([1, 2, 3, 4, 5].copyWithin(0, -2, -1), [4, 2, 3, 4, 5])
        .equals([1, 2, 3, 4, 5].copyWithin(-4, -3, -2), [1, 3, 3, 4, 5])
        .equals([1, 2, 3, 4, 5].copyWithin(-4, -3, -1), [1, 3, 4, 4, 5])
        .equals([1, 2, 3, 4, 5].copyWithin(-4, -3), [1, 3, 4, 5, 5])
        
        ._("works with array-likes")
        .equals(Array.prototype.copyWithin.call(args(1, 2, 3), -2, 0), args(1, 1, 2))
        
        ;
    },
    
    "fill" (test) {
    
        test
        
        ._("function length property")
        .equals(Array.prototype.fill.length, 1)
        
        ._("works with just a value")
        .equals([-1, -1, -1, -1, -1, -1].fill(-1), [-1, -1, -1, -1, -1, -1])
        
        ._("accepts a positive start index")
        .equals([1, 2, 3, 4, 5, 6].fill(-1, 3), [1, 2, 3, -1, -1, -1])
        
        ._("accepts a negative start index")
        .equals([1, 2, 3, 4, 5, 6].fill(-1, -3), [1, 2, 3, -1, -1, -1])
        
        ._("accepts a large start index")
        .equals([1, 2, 3, 4, 5, 6].fill(-1, 9), [1, 2, 3, 4, 5, 6])
        
        ;
    },
    
    "find" (test) {
    
        var list = [5, 10, 15, 20],
            thisArg = {};
        
        test
        
        ._("function length property")
        .equals(Array.prototype.find.length, 1)
        
        ._("find item by predicate")
        .equals(list.find(x => x === 15), 15)
        
        ._("returns undefined when nothing is found")
        .equals(list.find(x => x === "a"), void 0)
        
        ._("throws TypeError when a function predicate is not supplied")
        .throws($=> list.find(), TypeError)
        .throws($=> list.find(null), TypeError)
        .throws($=> list.find(12), TypeError)
        .throws($=> list.find("abc"), TypeError)
        
        ._("predicate is called with 3 arguments")
        .equals(list.find((val, pos, array) => {
        
            test
            .equals(list[pos], val)
            .equals(list, array);
            
            return false;
            
        }), void 0)
        
        ._("works with thisArg parameter")
        .equals([1].find(function() { test.equals(this, thisArg) }, thisArg), void 0)
        
        ._("works with array-likes")
        .equals(Array.prototype.find.call(args(1, 2, 3), x => x === 2), 2)
        
        ._("works with array-likes with a negative length")
        .equals(Array.prototype.find.call({ length: -1 }, $=> true), void 0)
        
        ._("holes are skipped")
        .equals([1, , void 0].find((val, pos) => {
        
            test.assert(pos !== 1);
            return val === void 0;
            
        }), void 0)
        
        ._("holes are skipped in array-likes")
        .equals(Array.prototype.find.call({ "0": 1, "2": void 0, length: 3 }, (val, pos) => {
        
            test.assert(pos !== 1);
            return val === void 0;
            
        }), void 0)
        
        ;
    },
    
    "findIndex" (test) {
    
        var list = [5, 10, 15, 20],
            thisArg = {};
        
        test
        
        ._("function length property")
        .equals(Array.prototype.findIndex.length, 1)
        
        ._("find item key by predicate")
        .equals(list.findIndex(x => x === 15), 2)
        
        ._("returns -1 when nothing is found")
        .equals(list.findIndex(x => x === "a"), -1)
        
        ._("throws TypeError when a function predicate is not supplied")
        .throws($=> list.findIndex(), TypeError)
        .throws($=> list.findIndex(null), TypeError)
        .throws($=> list.findIndex(12), TypeError)
        .throws($=> list.findIndex("abc"), TypeError)
        
        ._("predicate is called with 3 arguments")
        .equals(list.findIndex((val, pos, array) => {
        
            test
            .equals(list[pos], val)
            .equals(list, array);
            
            return false;
            
        }), -1)
        
        ._("works with thisArg parameter")
        .equals([1].findIndex(function() { test.equals(this, thisArg) }, thisArg), -1)
        
        ._("works with array-likes")
        .equals(Array.prototype.findIndex.call(args(1, 2, 3), x => x === 2), 1)
        
        ._("works with array-likes with a negative length")
        .equals(Array.prototype.findIndex.call({ length: -1 }, $=> true), -1)
        
        ._("holes are skipped")
        .equals([1, , void 0].findIndex((val, pos) => {
        
            test.assert(pos !== 1);
            return val === void 0;
            
        }), 2)
        
        ._("holes are skipped in array-likes")
        .equals(Array.prototype.findIndex.call({ "0": 1, "2": void 0, length: 3 }, (val, pos) => {
        
            test.assert(pos !== 1);
            return val === void 0;
            
        }), 2)
        
        ;

    },
    
    "keys" (test) {
    
        var list = [5, 10, 15, 20],
            keys = list.keys();
        
        test
        
        ._("returns correct value for each element")
        .equals(keys.next(), { value: 0, done: false })
        .equals(keys.next(), { value: 1, done: false })
        .equals(keys.next(), { value: 2, done: false })
        .equals(keys.next(), { value: 3, done: false })
        
        ._("sets done when iteration is complete")
        .equals(keys.next(), { value: void 0, done: true })
        
        ._("once done it must stay done")
        .equals((list.push(4), keys.next()), { value: void 0, done: true })
        
        ;
        
        keys = [1,,3].keys();
        
        test
        ._("does not skip holes")
        .equals(keys.next(), { value: 0, done: false })
        .equals(keys.next(), { value: 1, done: false })
        .equals(keys.next(), { value: 2, done: false })
        .equals(keys.next(), { value: void 0, done: true })
        ;
      
    },
    
    "values" (test) {
    
        var list = [5, 10, 15, 20],
            vals = list.values();
        
        test
        
        ._("returns correct value for each element")
        .equals(vals.next(), { value: 5, done: false })
        .equals(vals.next(), { value: 10, done: false })
        .equals(vals.next(), { value: 15, done: false })
        .equals(vals.next(), { value: 20, done: false })
        
        ._("sets done when iteration is complete")
        .equals(vals.next(), { value: void 0, done: true })
        
        ._("once done it must stay done")
        .equals((list.push(25), vals.next()), { value: void 0, done: true })
        
        ;
        
        vals = [1,,3].values();
        
        test
        ._("does not skip holes")
        .equals(vals.next(), { value: 1, done: false })
        .equals(vals.next(), { value: void 0, done: false })
        .equals(vals.next(), { value: 3, done: false })
        .equals(vals.next(), { value: void 0, done: true })
        ;
    },
    
    "entries" (test) {
    
        var list = [5, 10, 15, 20],
            ent = list.entries();
        
        test
        
        ._("returns correct value for each element")
        .equals(ent.next(), { value: [0, 5], done: false })
        .equals(ent.next(), { value: [1, 10], done: false })
        .equals(ent.next(), { value: [2, 15], done: false })
        .equals(ent.next(), { value: [3, 20], done: false })
        
        ._("sets done when iteration is complete")
        .equals(ent.next(), { value: void 0, done: true })
        
        ._("once done it must stay done")
        .equals((list.push(25), ent.next()), { value: void 0, done: true })
        
        ;
        
        ent = [1,,3].entries();
        
        test
        ._("does not skip holes")
        .equals(ent.next(), { value: [0, 1], done: false })
        .equals(ent.next(), { value: [1, void 0], done: false })
        .equals(ent.next(), { value: [2, 3], done: false })
        .equals(ent.next(), { value: void 0, done: true })
        ;
    }
    
};
