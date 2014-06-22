// POST-BUILD

import { runTests } from "package:moon-unit";
import { tests as classTests } from "class.js";
import { tests as destructuringTests } from "destructuring.js";
import { tests as templateTests } from "templates.js";
import { tests as restTests } from "rest-spread.js";
import { tests as defaultTests } from "default-params.js";

export function main() {

    return runTests({
    
        "Classes": classTests,
        "Destructuring": destructuringTests,
        "Templates": templateTests,
        "Rest and Spread": restTests,
        "Default Params": defaultTests,
        
    });
}
