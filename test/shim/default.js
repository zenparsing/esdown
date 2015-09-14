// PRE-BUILD

import { runTests } from "moon-unit";

import { polyfill, global } from "../../esdown-polyfill";

import { tests as stringTests } from "./string.js";
import { tests as objectTests } from "./object.js";
import { tests as arrayTests } from "./array.js";
import { tests as numberTests } from "./number.js";
import { tests as mapTests } from "./mapset.js";
import { tests as promiseTests } from "./promise.js";

export function main(args) {

    pulverize();
    polyfill();

    return runTests({

        "ES6 Shims": {

            "Object": objectTests,
            "String": stringTests,
            "Array": arrayTests,
            "Number": numberTests,
            "Map and Set": mapTests,
            "Promise": promiseTests
        }

    });
}

function pulverize() {

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

    delete global.Map;
    delete global.Set;
    delete global.Promise;
    delete global.WeakMap;

}
