import {} from "../runtime/Promise.js";

var p = Promise.resolve(0);
var q = Promise.resolve(p);
var r = Promise.resolve(q);

/*p.then(x => r).chain(console.log);*/

Promise.__iterate(function*() {

    return p;
    
}()).chain(console.log, x => setTimeout($=> { throw x }, 0));
