var A = _es6now.Class(B, function(__super) { return {

    constructor: function A() {
    
        __super.constructor.call(this);
    },
    
    set a(value) {},
    
    get b() {},
    
    bar: function(x, y) {
    
        __super.bar.call(this, x, y);
        __super["bar"].call(this, x, y);
        __super.foo.foo();
        
        (function(x) { __super.foo })
    },
    
    __static_0: { S: function() {} },
    
    __static_1: { get T() {} },
    
    __static_2: { "U": function() {} },
    
    __static_3: { "Hello World": function() {} }
} });

var A = _es6now.Class(function(__super) { return {

    foo: function() {}, constructor: function A() {}
} });

var A = _es6now.Class(B, function(__super) { return {

    constructor: function A() { __super.constructor.call(this) }
} });

var A = _es6now.Class(B, function(__super) { return { constructor: function A() { var c = __super.constructor; if (c) return c.apply(this, arguments); } }

 });

((function() { var C = _es6now.Class(function(__super) { return { constructor: function C() {} } }); return C; }()));

new (_es6now.Class(function(__super) { return { constructor: function() {} } }));
