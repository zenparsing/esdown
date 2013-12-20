import {} from "../runtime/Promise.js";

class BorgPromise extends Promise {

    then(onResolve, onReject) {

        if (typeof onResolve !== "function") onResolve = x => x;

        return super.then(x => {

            // NOTE: x is a non-promise
            return (x && typeof x.then === "function") ?
                x.then(onResolve, onReject) :
                onResolve(x);
            
        }, onReject);
    }
}

var p = Promise.resolve(0);
var q = Promise.resolve(p);
var r = BorgPromise.resolve(q);

var thenable = {

    then(onResolve, onReject) {
    
        console.log("thenable called.");
        
        Promise.resolve().then($=> {
            onResolve("thenable!");
        });
    }
};

r.then(x => thenable).then(x => console.log(x), err => console.log(err));

/*p.then(x => r).chain(console.log);*/

/*
Promise.__iterate(function*() {

    return p;
    
}()).then(x => console.log(x), x => setTimeout($=> { throw x }, 0));
*/
