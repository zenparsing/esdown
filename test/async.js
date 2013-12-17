import { AsyncFS } from "package:zen-bits";

export function main() {

    async gen() {
    
        return await AsyncFS.readFile(__filename, { encoding: "utf8" });
    }
    
    return Promise.resolve().then(x => console.log(await gen()));
}
