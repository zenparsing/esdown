var A = _esdown.class(B, function(__) {

    __({ constructor: function A() {
    
        __.csuper.call(this);
    } });
    
    __({ set a(value) {} });
    
    __({ get b() {} });
    
    __({ bar: function(x, y) {
    
        __.super.bar.call(this, x, y);
        __.super["bar"].call(this, x, y);
        __.super.foo.foo();
        
        (function(x) { __.super.foo })
    } });
    
    __.static({ S: function() {} });
    
    __.static({ get T() {} });
    
    __.static({ "U": function() {} });
    
    __.static({ "Hello World": function() {} });
 });

var A = _esdown.class(function(__) {

    __({ foo: function() {} });; __({ constructor: function A() {} });
 });

var A = _esdown.class(B, function(__) {

    __({ constructor: function A() { __.csuper.call(this) } });
    __.static({ f: function() { __.csuper.call(this) } });
 });

var A = _esdown.class(B, function(__) { __({ constructor: function A() { __.csuper.apply(this, arguments); } });  });



((function() { var C = _esdown.class(function(__) { __({ constructor: function C() {} });  }); return C; }()));

new (_esdown.class(function(__) { __({ constructor: function() {} });  }));
