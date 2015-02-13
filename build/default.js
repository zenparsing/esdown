import { spawn } from "node:child_process";

let ts = +new Date;

process.stdout.write("Building esdown...");

let child = spawn(
    "esdown",
    "- ../src/default.js ../build/esdown.js -b -r -g esdown".split(/ /g),
    { stdio: "inherit", env: process.env, cwd: __dirname });

child.on("close", _=> process.stdout.write(`finished in ${ ((+new Date) - ts) / 1000 }s.\n`));
