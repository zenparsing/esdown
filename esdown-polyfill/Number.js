import { toInteger, addProperties } from './Core.js';

export function polyfill() {
  function isInteger(val) {
    return typeof val === 'number' && isFinite(val) && toInteger(val) === val;
  }

  function epsilon() {
    // Calculate the difference between 1 and the smallest value greater than 1 that
    // is representable as a Number value
    let result;
    for (let next = 1; 1 + next !== 1; next = next / 2) result = next;
    return result;
  }

  addProperties(Number, {
    EPSILON: epsilon(),
    MAX_SAFE_INTEGER: 9007199254740991,
    MIN_SAFE_INTEGER: -9007199254740991,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isInteger: isInteger,
    isFinite(val) { return typeof val === 'number' && isFinite(val); },
    isNaN(val) { return val !== val; },
    isSafeInteger(val) { return isInteger(val) && Math.abs(val) <= Number.MAX_SAFE_INTEGER; },
  });
}
