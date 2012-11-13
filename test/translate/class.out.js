var A = es6now.Class(B, function(__super) { return {

    constructor: function() {
    
        __super.call(this);
    },
    
    set a(value) {},
    
    get b(value) {},
    
    bar: function(x, y) {
    
        __super.prototype.bar.call(this, x, y);
        __super.prototype["bar"].call(this, x, y);
        __super.prototype.foo.foo();
    }
}});
