var A = _esdown.class(function(__) {

    __({ constructor: function A() {

        this.x = 1;
    } });

    __({ set a(value) {} });

    __({ get b() {} });

    __.static({ S: function() {} });

    __.static({ get T() {} });

    __.static({ "U": function() {} });

    __.static({ "Hello World": function() {} });

    __({ foo: function() {} });
 });

((function() { var C = _esdown.class(function(__) { __({ constructor: function C() {} });  }); return C; }()));

new (_esdown.class(function(__) { __({ constructor: function() {} });  }));
