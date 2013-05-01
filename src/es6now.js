import "Runtime.js" as Runtime;
import "Program.js" as Program;

if (typeof require === "function" && 
    typeof module !== "undefined" && 
    module === require.main) {
    
    Program.run();
}