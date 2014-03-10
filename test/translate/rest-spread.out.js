var __this = this; var __spread; function f(a) { var args = [].slice.call(arguments, 1); }
function f() { var __this = this; var args = [].slice.call(arguments, 0); (function(x) { return __this; }); }
(function() { var args = [].slice.call(arguments, 0); return __this.foo(args); });
x.apply(void 0, args);
x.apply(void 0, [a].concat(args));
(__spread = x).y.apply(__spread, [a].concat(args));
