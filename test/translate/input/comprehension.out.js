(function() { var __array = []; for (var __$0 = _es6now.iter(array), __$1; __$1 = __$0.next(), !__$1.done;) { var x = __$1.value; __array.push(x); } return __array; }).call(this);
(function() { var __array = []; for (var __$0 = _es6now.iter(array), __$1; __$1 = __$0.next(), !__$1.done;) { var x = __$1.value; if (x > 3) __array.push(x.foo); } return __array; }).call(this);
(function() { var __array = []; for (var __$2 = _es6now.iter(array), __$3; __$3 = __$2.next(), !__$3.done;) { var x = __$3.value; for (var __$0 = _es6now.iter(x.foo), __$1; __$1 = __$0.next(), !__$1.done;) { var y = __$1.value; if (y.bar > 3) __array.push(y); } } return __array; }).call(this);

(function*() { for (var __$0 = _es6now.iter(array), __$1; __$1 = __$0.next(), !__$1.done;) { var x = __$1.value; yield (x); } }).call(this);
(function*() { for (var __$0 = _es6now.iter(array), __$1; __$1 = __$0.next(), !__$1.done;) { var x = __$1.value; if (x > 3) yield (x.foo); } }).call(this);
(function*() { for (var __$2 = _es6now.iter(array), __$3; __$3 = __$2.next(), !__$3.done;) { var x = __$3.value; for (var __$0 = _es6now.iter(x.foo), __$1; __$1 = __$0.next(), !__$1.done;) { var y = __$1.value; if (y.bar > 3) yield (y); } } }).call(this);
