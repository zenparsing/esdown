export var tests = {

    "assignment" (test) {
    
        var array = [1, 2], a, b;
        
        test
        ._("assignment expression evaluates to RHS")
        .assert(([a, b] = array) === array);
    },

    "array patterns" (test) {
    
        var array = [1, 2], a, b;
        
        [a, b] = array;
        test._("assignment").equals([a, b], array);
        
        var [c, d] = array;
        test._("declaration").equals([c, d], array);
        
        [a, ,b] = [1, 2, 3];
        test._("holes").equals([a, b], [1, 3]);
        
        var [e, ...args] = [1, 2, 3, 4];
        test._("rest").equals(e, 1).equals(args, [2, 3, 4]);
        
        [,,, ...args] = [1, 2, 3, 4, 5, 6, 7];
        test.equals(args, [4, 5, 6, 7]);
    }
};
