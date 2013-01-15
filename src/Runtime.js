import Class from "Runtime.Class.js";
import emulate from "Runtime.ES6.js";

var initialized = false,
    global = this;

export function initialize() {

    if (initialized)
        return;
    
    emulate();
    
    global.es6now = {
    
        Class: Class
    };
    
    initialized = true;
}
