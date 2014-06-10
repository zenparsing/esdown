import { runTests } from "package:moon-unit";

import "init.js";
import "../../runtime/ES6.js";

import { tests as stringTests } from "string.js";
import { tests as objectTests } from "object.js";
import { tests as arrayTests } from "array.js";

export function main(args) {
    
    return runTests({
        
        "ES6 Shims": {
        
            "Object": objectTests,
            "String": stringTests,
            "Array": arrayTests
        }
        
    });
    
}

