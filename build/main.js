require("child_process").spawn(
    "es6now", 
    "- ../src/main.js es6now.js -b -r".split(/ /g), 
    { stdio: "inherit", cwd: __dirname });
