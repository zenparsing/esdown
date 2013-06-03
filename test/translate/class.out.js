var A = __class(B, function(__super) { return {

    constructor: function() {
    
        __super.constructor.call(this);
    },
    
    set a(value) {},
    
    get b(value) {},
    
    bar: function(x, y) {
    
        __super.bar.call(this, x, y);
        __super["bar"].call(this, x, y);
        __super.foo.foo();
    },
    
    __static_S: function() {},
    
    get __static_T() {}
}});

((function() { var C = __class(function(__super) { return{}}); return C; })());
