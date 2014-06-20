// POST-BUILD

import { runTests } from "package:moon-unit";
import { tests as classTests } from "class.js";

export function main() {

    runTests({
    
        "Classes": classTests
    });
}
