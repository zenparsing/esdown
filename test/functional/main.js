// POST-BUILD

import { runTests } from "package:moon-unit";
import { tests as classTests } from "class.js";
import { tests as destructuringTests } from "destructuring.js";

export function main() {

    return runTests({
    
        "Classes": classTests,
        "Destructuring": destructuringTests
    });
}
