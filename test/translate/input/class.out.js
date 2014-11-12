var A = _esdown.class(B, function(__super, __csuper) { return {

    constructor: function A() {
    
        __csuper.call(this);
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

var A = _esdown.class(function(__super, __csuper) { return {

    foo: function() {}, constructor: function A() {}
} });

var A = _esdown.class(B, function(__super, __csuper) { return {

    constructor: function A() { __csuper.call(this) },
    __static_0: { f: function() { __csuper.call(this) } }
} });

var A = _esdown.class(B, function(__super, __csuper) { return { constructor: function A() { __csuper.apply(this, arguments); } }

 });

((function() { var C = _esdown.class(function(__super, __csuper) { return { constructor: function C() {} } }); return C; }()));

new (_esdown.class(function(__super, __csuper) { return { constructor: function() {} } }));
