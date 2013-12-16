import {} from "../runtime/Promise.js";
import { AsyncFS } from "package:zen-bits";

export function main() {

    /*
    function* gen() {
        
        var x = yield AsyncFS.readFile(__filename, { encoding: "utf8" });
        
        return x;
    }
    
    return Promise.__iterate(gen()).then(x => console.log(x));
    */
    
    async gen() {
    
        return await AsyncFS.readFile(__filename, { encoding: "utf8" });
    }
    
    return Promise.resolve().then(x => console.log(await gen()));
    
    return gen().then(x => console.log(x));
}
