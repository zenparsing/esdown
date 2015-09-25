import { bundle } from "../../src/Bundler.js";
import * as Path from "node:path";

bundle(Path.resolve(__dirname, "./root.js")).then(output => {

    console.log(output);

}, err => {

    console.log(err.stack);

});
