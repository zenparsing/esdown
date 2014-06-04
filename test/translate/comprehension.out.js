(function() { var __$0, __$1;  var __array = []; __$0 = _es6now.iter(array); for (var x; __$1 = __$0.next(), x = __$1.value, !__$1.done;) __array.push(x); return __array; }).call(this);
(function() { var __$0, __$1;  var __array = []; __$0 = _es6now.iter(array); for (var x; __$1 = __$0.next(), x = __$1.value, !__$1.done;) if (x > 3) __array.push(x.foo); return __array; }).call(this);
(function() { var __$0, __$1, __$2, __$3;  var __array = []; __$2 = _es6now.iter(array); for (var x; __$3 = __$2.next(), x = __$3.value, !__$3.done;) __$0 = _es6now.iter(x.foo); for (var y; __$1 = __$0.next(), y = __$1.value, !__$1.done;) if (y.bar > 3) __array.push(y); return __array; }).call(this);

(function*() { var __$0, __$1;  __$0 = _es6now.iter(array); for (var x; __$1 = __$0.next(), x = __$1.value, !__$1.done;) yield (x); }).call(this);
(function*() { var __$0, __$1;  __$0 = _es6now.iter(array); for (var x; __$1 = __$0.next(), x = __$1.value, !__$1.done;) if (x > 3) yield (x.foo); }).call(this);
(function*() { var __$0, __$1, __$2, __$3;  __$2 = _es6now.iter(array); for (var x; __$3 = __$2.next(), x = __$3.value, !__$3.done;) __$0 = _es6now.iter(x.foo); for (var y; __$1 = __$0.next(), y = __$1.value, !__$1.done;) if (y.bar > 3) yield (y); }).call(this);
