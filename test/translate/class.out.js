var A = __class(B, function(__super) { return {

    constructor: function A() {
    
        __super("constructor").call(this);
    },
    
    set a(value) {},
    
    get b(value) {},
    
    bar: function(x, y) {
    
        __super("bar").call(this, x, y);
        __super("bar").call(this, x, y);
        __super("foo").foo();
        
        (function(x) { __super("foo") })
    },
    
    __static_S: function() {},
    
    get __static_T() {},
    
    __static_U: function() {}
} });

var A = __class(function(__super) { return {

    foo: function() {}, constructor: function A() { var c = __super("constructor"); if (c) return c.apply(this, arguments); }
} });

var A = __class(B, function(__super) { return {

    constructor: function A() { __super("constructor").call(this) }
} });

var A = __class(B, function(__super) { return { constructor: function A() { var c = __super("constructor"); if (c) return c.apply(this, arguments); } }

 });

(((function() { var C = __class(function(__super) { return { constructor: function C() { var c = __super("constructor"); if (c) return c.apply(this, arguments); } } }); return C; })()));

new (__class(function(__super) { return { constructor: function() { var c = __super("constructor"); if (c) return c.apply(this, arguments); } } }));
