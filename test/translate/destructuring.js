[a, b] = foo;
[a] = foo;
([a]) = foo;

({ a, b: c }) = foo;
({ a: [b, c] }) = foo;

var [a, b] = foo,
    { c, c: d } = foo;

function f([a, b] = c) {}
function f({a, b: c} = d) {}

([a, b]) => {}
([a, b], ...args) => foo
