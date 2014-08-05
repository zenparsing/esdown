// Pulverize ES6 library features provided by the environment for testing

delete Object.is;
delete Object.assign;
delete Object.setPrototypeOf;

// V8 throws an error when attempting to delete these properties
try { delete Number.EPSILON } catch (x) {}
try { delete Number.MAX_SAFE_INTEGER } catch (x) {}
try { delete Number.MIN_SAFE_INTEGER } catch (x) {}

delete Math.sign;

delete Number.isInteger;
delete Number.isFinite;
delete Number.isNaN;
delete Number.isSafeInteger;

delete String.raw;
delete String.fromCodePoint;
delete String.prototype.repeat;
delete String.prototype.startsWith;
delete String.prototype.endsWith;
delete String.prototype.contains;
delete String.prototype.codePointAt;
delete String.prototype[Symbol.iterator];

delete Array.from;
delete Array.of;
delete Array.prototype.copyWithin;
delete Array.prototype.fill;
delete Array.prototype.find;
delete Array.prototype.findIndex;
delete Array.prototype.values;
delete Array.prototype.entries;
delete Array.prototype.keys;
delete Array.prototype[Symbol.iterator];

delete _es6now.global.Map;
delete _es6now.global.Promise;
