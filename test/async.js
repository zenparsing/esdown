import { AsyncFS } from "package:zen-bits";

export function main() {

    async gen() {
    
        return await AsyncFS.readFile(__filename, { encoding: "utf8" });
    }
    
    async asap() {
    
        console.log(new Date >>> 0);
        await 0;
        console.log(new Date >>> 0);
    }
    
    asap();
    console.log("asap done");
    
    return Promise.resolve().then(x => console.log(await gen()));
}
