## The es6now Module System ##

*Warning: The ES6 module system is still under active development.*

### Overview and Syntax ###

In ES6, modules are a static, compile-time collection of named exports.  A module is
a collection of exports which each have a name.  There are several ways to export things
from a module.

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
import { foo, C, bar, bazzer } from "my-module.js";
```

### Module Lookup Rules ###

Consider the following import declaration:

```js
import { x } from "foo";
```

This will import the export named "x" from the module at "foo".  But what does "foo" mean?  The 
ES6 specification dodges this question, so we're on our own.

In **es6now** running on Node, the following rules apply:

**First**, `require` works the same way that it always does, except that non-module ES6 features 
are translated to ES5.

```js
// No change to the behavior of require
var FS = require("fs");
var module = require("./something-relative"); 
```

**Second**, specifiers are always valid URLs (or URIs, if you prefer that term) and obey standard
URL semantics.  Relative paths work just like they do on the web.

```js
// Import "x" from the module at "some-file.js", relative to the current module
import { x } from "some-file.js";
```

**Third**, if the module URL begins with a scheme named "package", we use Node's standard package
lookup algorithm, which searches up the path tree for ".node_modules" folders.

```js
// Uses Node's standard package lookup algorithm to find the package "esparse"
import { parse } from "package:esparse";
```

**Forth**, if the resulting path is a directory, then it will attempt to load the file named "main.js"
in that directory.

```js
// Imports "x" from "some-directory/main.js", relative to the current module, and only if
// "some-directory" is a directory.
import { x } from "some-directory";
```

These rules are meant to work well across server and browser environments.