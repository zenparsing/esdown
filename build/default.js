import { spawn } from "node:child_process";

spawn(
    "esdown",
    "- ../src/default.js ../build/esdown.js -b -r -g esdown".split(/ /g),
    { stdio: "inherit", cwd: __dirname });
