## Overview ##

**es6now** is an ES6 to ES5 compiler, written in ES6.  It will allow you to
write programs using next-generation Javascript features without having to 
wait for Node or browsers to fully implement ES6.

**es6now** can also be used as a runtime environment for executing ES6 programs
on top of Node.

For more information:

- The [Feature Guide](docs/features.md) describes the ES6 features that you can use with
**es6now**.
- The [Module Guide](docs/modules.md) describes the ES6 module system implemented in 
**es6now**.

## Instructions ##

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

## API ##

**es6now** can also be used as a library.  First, install locally with NPM:

    npm install es6now

### translate(input, options = {}) ###

Translates ES6 code to ES5.  The following options are defined:

- **module**: (Boolean) If `true`, parse the input as a module.  Otherwise, parse the input
  as a script.  The default is `false`.
- **runtime**:  (Boolean) If `true`, include the **es6now** runtime library in the output.
  The default is `false`.
- **wrap**:  (Boolean) If `true`, wrap the output in boilerplate which will ensure compatibility
  with Node and AMD modules.  The default is `false`.
- **global**:  (String) If specified, the name of the global variable which will be used to
  expose the module if it is loaded as a plain script in the browser.

Example:

```js
var es6now = require("es6now");

var output = es6now.translate("class C { foo() {} }", {
    module: true,
    wrap: true
});
```
