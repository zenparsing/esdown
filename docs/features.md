# Feature Guide #

## Supported ES6 Features ##

The following ES6 language features are supported by **es6now**:

### Modules ###

Modules allow you to structure your code in separate files.  Read the
[Module Guide](modules.md) for more information.

### Arrow Fuctions ###

[Arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/arrow_functions)
are a more concise way to to write function expressions.  Arrow functions close over
the parent function's `this` variable.

```js
paths.forEach(path => {
    FS.readFile(path).then(data => {
        // do something with the data
    });
});

numbers.map(number => number + 43);
```

### Classes ###

Classes are syntactic sugar for creating object-oriented abstractions in Javascript.

```js
class C {

    // "constructor" initializes the new object
    constructor() {
        this.snakesOnPlane = 3;
    }

    // "static" methods are attached to the constructor function
    static foo() {
        return "foo";
    }
}

// Inheritance is supported via standard Javascript prototype chains
class D extends C {

    constructor() {
        super();
        this.bearsOnPlane = 2;
    }
}
```

### Template Strings ###

Template strings are strings with super-powers.

```js
// Template strings support interpolation
var name = "Zen";
console.log(`hello, ${ name }`); // "hello, Zen"

// Template strings can span multiple lines
var embeddedText = `
at the age old pond
a frog leaps into water
a deep resonance
`;

// You can customize the processing with tagged template strings
console.log(String.raw`\u0064`); // "\\u0064"
```

### Spread ###

Spread syntax allows you to inject arrays into function calls and
array literals.

```js
var array = [1, 2, 3];

// Spreading into a function call
f(...array);

// Spreading into an array literal
var longer = [0, ...array, 4]; // [0, 1, 2, 3, 4]
```

### Rest Arguments ###

Rest arguments allow you to pull out the "rest" of the arguments to a function
as an array.

```js
function f(a, ...args) {

    console.log(f);
    console.log(args);
}

f(1, 2, 3, 4);

// >>> 1
// >>> [2, 3, 4]
```

### Default Arguments ###

You can now assign a default to a function parameter.  The default will be used if the
argument is not supplied, or if the argument's value is `undefined`.

```js
function f(a = "foo") {
    return a;
}

f(); // "foo"
f(undefined); // "foo"
f("bar"); // "bar"
```

### Destructuring ###

With destructuring syntax, you can "unpack" values from arrays, iterables, and objects.

Array destructuring:

```js
var array = [1, 2, 3];

// Unpacking an array
var [a, b] = array;
console.log(a, b); // 1, 2

// Assignment forms also work:
array = [3, 4];
[a, b] = array;
console.log(a, b); // 3, 4

// Unpacking the "rest"
var rest;
array = [1, 2, 3, 4, 5];
[a, b, ...rest] = array;
console.log(a, b, rest); // 1, 2, [3, 4, 5]

// Providing default values
[a, b = 43] = [1];
console.log(a, b); // 1, 43
```

Object destructuring:

```js
// Unpacking an object
var obj = { a: 1, b: 2, c: 3 };
var { a, b, c: cc } = obj;
console.log(a, b, cc); // 1, 2, 3

// Assignment forms also work (but might need parenthesis!)
({ a, b }) = obj;
console.log(a, b); // 1, 2
```

Destructuring within function parameter lists:

```js
function f({ foo, bar }) {
    console.log(foo, bar);
}

f({ foo: "foo", bar: "bar" });

// Logs:
// >>> "foo", "bar"
```

### Computed Properties ###

Computed properties allow you to use a dynamic property names in an object literal.

```js
var name = "es6now";
var obj = {
    [name]: "The best ES6->ES5 compiler on the market"
};
```

### Shorthand Properties ###

You can leave off the property value in an object literal if it's a varialbe name:

```js
var a = "foo";
var obj = { a };
console.log(a); // { "a": "foo" }
```

### Object Literal Methods ###

Methods are a shorter way to assign a function to an object literal property.

```js
var obj = {

    doSomething() {
        // Do something
    }
};
```

### For-Of Statements ###

For-of statments loop over *iterators*.

```js
var list = [1, 2, 3];

for (var item of list)
    console.log(item);

// Logs:
// >>> 1
// >>> 2
// >>> 3

var map = new Map();
map.set("foo", 1);
map.set("bar", 2);

for (var key of map.keys())
    console.log(key);

// Logs:
// >>> "foo"
// >>> "bar"
```

### Iterators ###

Custom iterators can be defined for any object using `Symbol.iterator`:

```js
class C {
    constructor() {
       this.list = [1, 2, 3];
    }
    
    [Symbol.iterator]() {
        // Delegate to the list's iterator
        return this.list[Symbol.iterator]();
    }
}

var c = new C();

for (var item of c)
    console.log(item);

// Logs:
// >>> 1
// >>> 2
// >>> 3
```

### Comprehensions ###

*Warning: this feature might be removed from ES6*

Comprehensions provide a concise way to iterate over some collections.

Array comprehensions:

```js
var input = [1, 2, 3];
var array = [for x of input x * 2];
console.log(array); // [2, 4, 6]
```

### Map and Set ###

**[Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)** and 
**[Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)** 
are new built-in standard library collection classes.

*Limitation: es6now only supports strings and numbers as keys within Map and Set.*

### Promise ###

A **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** represents the result of an asynchronous action.

### Other Library Extensions ###

**Object**:
- Object.assign
- [Object.is](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is)

**String**:
- [String.fromCodePoint](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/fromCodePoint)
- [String.prototype.codePointAt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/codePointAt)
- [String.prototype.contains](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/contains)
- [String.prototype.startsWith](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith)
- [String.prototype.endsWith](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith)
- [String.prototype.repeat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/repeat)

**Array**:
- Array.from
- [Array.of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/of)
- Array.prototype.copyWithin
- [Array.prototype.fill](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fill)
- [Array.prototype.find](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find)
- [Array.prototype.findIndex](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex)
- [Array.prototype.entries](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/entries)
- [Array.prototype.keys](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/keys)
- [Array.prototype.values](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/values)

**Other**:
- [Number Extensions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

## ES6 Features Not Translated ##

The following ES6 features are not translated by **es6now**.  You can still use these
features if your JS engine supports them.

- Block-scoped variables (let and const)
- Generators
- Math polyfills
- Proxies
- Reflect namespace
- Dynamic module loading
