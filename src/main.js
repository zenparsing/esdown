import initialize from "Runtime.js";

// Initialize the runtime support library
initialize();

module Program = "Program.js";

if (typeof require === "function" && 
    typeof module !== "undefined" && 
    module === require.main) {
    
    Program.run();
}