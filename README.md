## Overview ##

**es6now** is an ES6 to ES3/5 compiler.  It will translate some ECMAScript 6 
features, fairly accurately, for use in Node and browsers.  The emphasis 
here is not on completeness.  The goal is to take advantage of important 
ES6  features  while still  retaining  transparent debuggability,  using 
straightforward source transformations.

## Instructions ##

*You'll need Node.js 0.11 or later for async functions.*

Install globally with NPM (you may need to `sudo` this):

    npm install -g es6now

Start a REPL by running it without any arguments:

    es6now

Execute a module by adding a path:

    es6now main.js

Translate a module by using a hyphen:

    es6now - src/main.js build/es6now.js -b -r

    --input, -i  (1)    The file to translate.
    --output, -o (2)    The file to write to. If not set, then the output
                        will be written to the console.
    --bundle, -b        If present, module dependencies will be bundled 
                        together in the output.
    --runtime, -r       If present, the es6now runtime code will be bundled 
                        with the output.
    --global, -g        If specified, the name of the global variable to 
                        dump this module's exports into, if the resulting
                        script is not executed within any module system.
