// PRE-BUILD

import { bundle } from "../../src/Bundler.js";
import * as Path from "node:path";
import * as FS from "node:fs";
import { runTests } from "moon-unit";

const resolve = Path.resolve.bind(Path, __dirname);

runTests({

    "Bundling" (test) {

        return bundle(resolve("./root.js")).then(output => {

            let expected = FS.readFileSync(resolve("./expected.js"), { encoding: "utf8" }),
                ok = expected === output;

            test._("Bundled output matches expected output").assert(ok);

            if (ok) {

                try { FS.unlinkSync(resolve("./_out.js")) }
                catch (e) {}

            } else {

                FS.writeFileSync(resolve("./_out.js"), output);
            }

        });
    }

});
