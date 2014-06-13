ident => "abc";

() => "abc";

() => +new Date();

(a, b, c) => 123 + 456;

ident => {

    console.log("hello");
};

(a, b, c) => {

    console.log("world");
};

() => { () => {} };

ident => this;

() => {

    var x = function() { return this; };
};

() => {

    function x() { return this; };
};

() => {

    () => this;
};

ident => this.method();

var identity = obj => obj;