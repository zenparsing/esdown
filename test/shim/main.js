// PRE-BUILD

import { runTests } from "package:moon-unit";

import "init.js";
import "../../runtime/ES6.js";
import "../../runtime/MapSet.js";
import "../../runtime/Promise.js";

import { tests as stringTests } from "string.js";
import { tests as objectTests } from "object.js";
import { tests as arrayTests } from "array.js";
import { tests as numberTests } from "number.js";
import { tests as mapTests } from "mapset.js";
import { tests as promiseTests } from "promise.js";

export function main(args) {
    
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

