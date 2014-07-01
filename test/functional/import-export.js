import { a, b, c, C, F } from "import-export-from.js";

export var tests = {

    "imports and exports" (test) {
    
        test
        
        ._("exported variables")
        .equals(a, "export-a")
        .equals(b, "export-b")
        .equals(c, "export-c")
        
        ._("functions")
        .equals(F(), "export-F")
        
        ._("classes")
        .equals(C.x(), "export-C")
        
        ;
    },

};
