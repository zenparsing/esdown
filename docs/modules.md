## The es6now Module System ##

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
import { foo, C, bar, bazzer as boo } from "./my-module.js";
```

The following form can ben used to import everything from a module:

```js
import * as MyModule from "./my-module.js";
```

You can also provide a **default** export:

```js
export default function foo() {
    // Do something
}
```

Default exports can be imported using special syntax:

```js
import bar from "./foo-module.js"
```

Or they can be imported using the name "default":

```js
import { default as bar } from "./foo-module.js";
```

### Module Lookup Rules ###

Consider the following import declaration:

```js
import { x } from "foo";
```

This will import the export named "x" from the module at "foo".  But what does "foo" mean?

In **es6now** running on Node, the following rules apply:

**First**, `require` works the same way that it always does, except that non-module ES6
features are translated to ES5.  Importantly, the `require` function can't be used to load
ES6 modules.

```js
// No change to the behavior of require
var FS = require("fs");
var module = require("./something-relative");
```

**Second**, specifiers that begin with the following patterns are interpreted as URLs
and obey standard URL semantics.

- `./`
- `../`
- `/`
- `scheme:`

File extensions are not automatically appended.

```js
// Import "x" from the module at "some-file.js", relative to the current module
import { x } from "./some-file.js";
```

**Third**, if the module specifier does not match any of the patterns from the second
rule, then it is interpreted as a package name.  To locate packages, we use Node's
standard package lookup algorithm, which searches up the path tree for "node_modules"
folders. Because we use Node's package lookup algorithm, NPM can be used to transparently
install ES6 modules.

```js
// Uses Node's standard package lookup algorithm to find the package "esparse"
import { parse } from "esparse";
```

**Forth**, if the path resulting from the previous rules is a directory, then it will
attempt to load the file named **main.js** in that directory.

```js
// Imports "x" from "some-directory/main.js", relative to the current module, and only if
// "some-directory" is a directory.
import { x } from "./some-directory";
```

These rules are meant to work well across server and browser environments.

### Loading Old-Style Modules ###

You can import from old-style Node modules (including Node's built-in modules) using the
**node** URL scheme.

```js
// Import from Node's built-in modules
import { readFile } from "node:fs";

// Import from an old-style Node module using a package path
import { groupBy } from "node:underscore";

// Import from an old-style Node module using a relative path
import { breakdance } from "node:./old-school";
```

For URLs using the **node** scheme, the path is interpreted exactly like `require`.

If you are importing from an old-style module that overwrites the export object using
the `module.exports = function() {}` pattern, it will be available as the **default**
export.

```js
import mkdirp from "node:mkdirp";
```

### Loading New-Style Modules From Old-Style Modules ###

Old-style modules can import from new-style modules using the `importSync` method of
Node's `module` object.

```js
// Using an ES module from an old-style module
var newStyle = module.importSync("./new-style.js");
```

### Writing Interoperable Packages ###

It is possible to create packages which can be used as both old-style and new-style
modules.

To expose an old-style package to new-style modules, add a **main.js** file at the
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

To expose a new-style package to old-style clients, you can add an **index.js**
file at the package root which looks something like this:

```js
module.exports = module.importSync("./main.js");
```
