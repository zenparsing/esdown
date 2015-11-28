/*=esdown=*/'use strict'; var __M; (function(a) { var list = Array(a.length / 2); __M = function(i) { var m = list[i], f, e, ee; if (typeof m !== 'function') return m.exports; f = m; m = { exports: i ? {} : exports }; f(list[i] = m, e = m.exports); ee = m.exports; if (ee && ee !== e && !('default' in ee)) ee['default'] = ee; return ee; }; for (var i = 0; i < a.length; i += 2) { var j = Math.abs(a[i]); list[j] = a[i + 1]; if (a[i] >= 0) __M(j); } })([
1, function(m) { m.exports = require("fs") },
2, function(module, exports) {

// pkg2/main.js


},
-5, function(module, exports) {

// b.js
module.exports = { b: "b" };


},
-3, function(module, exports) {

// a.js (legacy)
console.log("before b");
var b = __M(5);
exports.a = "a";
console.log(b.b);


},
-4, function(module, exports) {

// pkg1/index.js


},
0, function(module, exports) {

// root.js
var FS = __M(1);
var pkg2 = __M(2);

console.log("before a");
var a = __M(3);
console.log(a.a);

require("fs");
__M(4);


}]);
