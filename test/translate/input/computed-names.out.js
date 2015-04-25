(_esdown.computed({
    }, "x", { _: function() {} 
}));

(_esdown.computed({
    }, "x", { _: 1 ,
    }, "y", { }, { _: 2 
}));

var C = _esdown.class(function(__) {

    __({ constructor: function C() {} }); __(_esdown.computed({}, "x", { _: function() {} }));
    
    __.static(_esdown.computed({}, "x", { _: function() {} }));
 });