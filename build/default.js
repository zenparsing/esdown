import { spawn } from "node:child_process";

let ts = +new Date,
    args = "- ../src/default.js ../build/esdown.js -b -r -p -g esdown";

if (process.argv.slice(-1)[0] === "runtime")
    args = "- ../src/empty.js ../build/esdown-runtime.js -r -p --nowrap";

process.stdout.write("Building esdown...");

let child = spawn(
    "esdown",
    args.split(/ /g),
    { stdio: "inherit", env: process.env, cwd: __dirname });

child.on("close", _=> process.stdout.write(`finished in ${ ((+new Date) - ts) / 1000 }s.\n`));
