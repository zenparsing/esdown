var A = _esdown.class(B, function(__, __super, __csuper) {{

    __({ constructor: function A() {
    
        __csuper.call(this);
    } });
    
    __({ set a(value) {} });
    
    __({ get b() {} });
    
    __({ bar: function(x, y) {
    
        __super.bar.call(this, x, y);
        __super["bar"].call(this, x, y);
        __super.foo.foo();
        
        (function(x) { __super.foo })
    } });
    
    __.static({ S: function() {} });
    
    __.static({ get T() {} });
    
    __.static({ "U": function() {} });
    
    __.static({ "Hello World": function() {} });
} });

var A = _esdown.class(function(__, __super, __csuper) {{

    __({ foo: function() {} }); __({ constructor: function A() {} });
} });

var A = _esdown.class(B, function(__, __super, __csuper) {{

    __({ constructor: function A() { __csuper.call(this) } });
    __.static({ f: function() { __csuper.call(this) } });
} });

var A = _esdown.class(B, function(__, __super, __csuper) {{ __({ constructor: function A() { __csuper.apply(this, arguments); } }); }

 });

((function() { var C = _esdown.class(function(__, __super, __csuper) {{ __({ constructor: function C() {} }); } }); return C; }()));

new (_esdown.class(function(__, __super, __csuper) {{ __({ constructor: function() {} }); } }));
