import { File } from "package:afs";

export function main() {

    async function gen() {
    
        return await File.readText(__filename);
    }
    
    async function asap() {
    
        console.log(new Date >>> 0);
        await 0;
        console.log(new Date >>> 0);
    }
    
    asap();
    console.log("asap done");
    
    return Promise.resolve().then(x => console.log(await gen()));
}
