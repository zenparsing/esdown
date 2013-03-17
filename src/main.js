import initialize from "Runtime.js";

// Initialize the runtime support library
initialize();

import "Program.js" as Program;

if (typeof require === "function" && 
    typeof module !== "undefined" && 
    module === require.main) {
    
    Program.run();
}