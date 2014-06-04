(function() { var __$0, __$1;  var __array = []; for (var x, __$2 = _es6now.iter(array); __$1 = __$2.next(), x = __$1.value, !__$1.done;) __array.push(x); return __array; }).call(this);
(function() { var __$0, __$1;  var __array = []; for (var x, __$2 = _es6now.iter(array); __$1 = __$2.next(), x = __$1.value, !__$1.done;) if (x > 3) __array.push(x.foo); return __array; }).call(this);
(function() { var __$0, __$1, __$3, __$4;  var __array = []; for (var x, __$5 = _es6now.iter(array); __$4 = __$5.next(), x = __$4.value, !__$4.done;) for (var y, __$2 = _es6now.iter(x.foo); __$1 = __$2.next(), y = __$1.value, !__$1.done;) if (y.bar > 3) __array.push(y); return __array; }).call(this);

(function*() { var __$0, __$1;  for (var x, __$2 = _es6now.iter(array); __$1 = __$2.next(), x = __$1.value, !__$1.done;) yield (x); }).call(this);
(function*() { var __$0, __$1;  for (var x, __$2 = _es6now.iter(array); __$1 = __$2.next(), x = __$1.value, !__$1.done;) if (x > 3) yield (x.foo); }).call(this);
(function*() { var __$0, __$1, __$3, __$4;  for (var x, __$5 = _es6now.iter(array); __$4 = __$5.next(), x = __$4.value, !__$4.done;) for (var y, __$2 = _es6now.iter(x.foo); __$1 = __$2.next(), y = __$1.value, !__$1.done;) if (y.bar > 3) yield (y); }).call(this);
