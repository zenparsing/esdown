var __this = this; var __$0; function f(a) { var args = [].slice.call(arguments, 1); }
function f() { var __this = this; var args = [].slice.call(arguments, 0); (function(x) { return __this; }); }
(function() { var args = [].slice.call(arguments, 0); return __this.foo(args); });
x.apply(void 0, args);
x.apply(void 0, [a].concat(args));
(__$0 = x).y.apply(__$0, [a].concat(args));
