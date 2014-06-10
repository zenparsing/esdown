function args() { return arguments }

export var tests = {

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

    }
    
};
