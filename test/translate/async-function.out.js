function f(__0, __1, __2) { try { return Promise.__iterate(function*(a, b, c) {

    (yield 0);
}.apply(this, arguments)); } catch (x) { return Promise.reject(x); } }

({ f: function() { try { return Promise.__iterate(function*() { (yield 0); }.apply(this, arguments)); } catch (x) { return Promise.reject(x); } } });

(function(__0) { try { return Promise.__iterate(function*(x) { return (yield y); }.apply(this, arguments)); } catch (x) { return Promise.reject(x); } });