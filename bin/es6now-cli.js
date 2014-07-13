#!/usr/bin/env node --harmony

var Path = require("path"),
    FS = require("fs"),
    dir = Path.dirname(FS.realpathSync(__filename));

require(Path.resolve(dir, "..", "build", "es6now.js")).main();
