module Runtime from "Runtime.js";
module Program from "Program.js";

if (typeof require === "function" && 
    typeof module !== "undefined" && 
    module === require.main) {
    
    Program.run();
}