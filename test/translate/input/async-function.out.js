function f(a, b, c) { try { return _es6now.async(function*(a, b, c) {

    (yield 0);
}.apply(this, arguments)); } catch (x) { return Promise.reject(x); } }

({ f: function() { try { return _es6now.async(function*() { (yield 0); }.apply(this, arguments)); } catch (x) { return Promise.reject(x); } } });

(function(x) { try { return _es6now.async(function*(x) { return (yield y); }.apply(this, arguments)); } catch (x) { return Promise.reject(x); } });