import { spawn } from "node:child_process";

let ts = +new Date, args;

switch (process.argv.slice(-1)[0]) {

    case "runtime":
        args = "- ../esdown-runtime/default.js ../esdown-runtime/index.js";
        break;

    case "polyfill":
        args = "- ../esdown-polyfill/default.js ../esdown-polyfill/esdown-polyfill.js -b -g .";
        break;

    default:
        args = "- ../src/default.js ../build/esdown.js -b -R -g esdown";
        break;
}

process.stdout.write("Building esdown...");

let child = spawn(
    "esdown",
    args.split(/ /g),
    { stdio: "inherit", env: process.env, cwd: __dirname });

child.on("close", _=> process.stdout.write(`finished in ${ ((+new Date) - ts) / 1000 }s.\n`));
