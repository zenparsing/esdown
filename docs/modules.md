## The es6now Module System ##

*Warning: The ES6 module system is still under active development.*

### Overview and Syntax ###

In ES6, modules are static, compile-time collections of named exports.  There are several 
ways to export things from a module.

```js
// Exporting a function declaration
export function foo() {}

// Exporting a class declaration
export class C {}

// Exporting variables
export var bar = "bar";

// Exporting and renaming
function baz() { }
export { baz as bazzer };
```

Those named exports can be imported by another module.

```js
import { foo, C, bar, bazzer as boo } from "my-module.js";
```

### Module Lookup Rules ###

Consider the following import declaration:

```js
import { x } from "foo";
```

This will import the export named "x" from the module at "foo".  But what does "foo" mean?
The ES6 specification dodges this question, so we're on our own.

In **es6now** running on Node, the following rules apply:

**First**, `require` works the same way that it always does, except that non-module ES6 
features are translated to ES5.

```js
// No change to the behavior of require
var FS = require("fs");
var module = require("./something-relative"); 
```

**Second**, specifiers are always valid URLs (or URIs, if you prefer that term) and obey 
standard URL semantics.  Relative paths work just like they do on the web.

```js
// Import "x" from the module at "some-file.js", relative to the current module
import { x } from "some-file.js";
```

**Third**, if the module URL begins with a scheme named "package", we use Node's standard 
package lookup algorithm, which searches up the path tree for ".node_modules" folders. Because 
we use Node's package lookup algorithm, NPM can be used to transparently install ES6 modules.

```js
// Uses Node's standard package lookup algorithm to find the package "esparse"
import { parse } from "package:esparse";
```

**Forth**, if the resulting path is a directory, then it will attempt to load the file 
named "main.js" in that directory.

```js
// Imports "x" from "some-directory/main.js", relative to the current module, and only if
// "some-directory" is a directory.
import { x } from "some-directory";
```

These rules are meant to work well across server and browser environments.

### Interoperability Between Old-Style and New-Style Modules ###

It is possible to create packages which can be used as both old-style and new-style
modules.

In order to expose an old-style package to ES modules, add a **main.js** file at the
package root which looks something like this:

```js
// Load the package as an old-style module
var oldStyle = require("./");

// Export items from that variable
export var 
    foo = oldStyle.foo,
    bar = oldStyle.bar;

// For old-style modules which use the "module.exports = " idiom:
export var baz = oldStyle;
```

In order to expose a new-style module to old-style clients, you can add a **index.js**
file at the package root which looks something like this:

```js
module.exports = require("module:main.js");
```

When the argument to `require` begins with "module:", **es6now** will load the target
as an ES6 module.
