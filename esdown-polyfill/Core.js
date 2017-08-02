const Global = (function() {
  try { return global.global; } catch (x) {}
  try { return self.self; } catch (x) {}
  return null;
})();

export { Global as global };

function transformKey(k) {
  if (k.slice(0, 2) === '@@')
    k = Symbol[k.slice(2)];

  return k;
}

export function addProperties(target, methods) {
  Object.keys(methods).forEach(k => {
    let desc = Object.getOwnPropertyDescriptor(methods, k);
    desc.enumerable = false;

    k = transformKey(k);
    if (k in target)
      return;

    Object.defineProperty(target, k, desc);
  });
}

const sign = Math.sign || function(val) {
  let n = +val;

  if (n === 0 || Number.isNaN(n))
    return n;

  return n < 0 ? -1 : 1;
};

export function toInteger(val) {
  let n = +val;

  return n !== n /* n is NaN */ ? 0 :
    (n === 0 || !isFinite(n)) ? n :
      sign(n) * Math.floor(Math.abs(n));
}

export function toLength(val) {
  let n = toInteger(val);
  return n < 0 ? 0 : Math.min(n, Number.MAX_SAFE_INTEGER);
}

export function sameValue(left, right) {
  if (left === right)
    return left !== 0 || 1 / left === 1 / right;

  return left !== left && right !== right;
}

export function isRegExp(val) {
  return Object.prototype.toString.call(val) === '[object RegExp]';
}

export function toObject(val) {
  if (val == null)
    throw new TypeError(val + ' is not an object');

  return Object(val);
}

export function assertThis(val, name) {
  if (val == null)
    throw new TypeError(name + ' called on null or undefined');
}
