var global = _es6now.global;

var enqueueMicrotask = ($=> {

    var window = this.window,
        process = this.process,
        msgChannel = null,
        list = [];

    if (typeof setImmediate === "function") {

        return window ?
            window.setImmediate.bind(window) :
            setImmediate;

    } else if (process && typeof process.nextTick === "function") {

        return process.nextTick;

    } else if (window && window.MessageChannel) {

        msgChannel = new window.MessageChannel();
        msgChannel.port1.onmessage = $=> { if (list.length) list.shift()(); };

        return fn => {

            list.push(fn);
            msgChannel.port2.postMessage(0);
        };
    }

    return fn => setTimeout(fn, 0);

})();

// The following property names are used to simulate the internal data
// slots that are defined for Promise objects.

var $status = "Promise#status",
    $value = "Promise#value",
    $onResolve = "Promise#onResolve",
    $onReject = "Promise#onReject";

function isPromise(x) {

    return !!x && $status in Object(x);
}

function promiseDefer(ctor) {

    var d = {};

    d.promise = new ctor((resolve, reject) => {
        d.resolve = resolve;
        d.reject = reject;
    });

    return d;
}

function promiseChain(promise, onResolve, onReject) {

    if (typeof onResolve !== "function") onResolve = x => x;
    if (typeof onReject !== "function") onReject = e => { throw e };

    var deferred = promiseDefer(promise.constructor);

    if (typeof promise[$status] !== "string")
        throw new TypeError("Promise method called on a non-promise");

    switch (promise[$status]) {

        case "pending":
            promise[$onResolve].push([deferred, onResolve]);
            promise[$onReject].push([deferred, onReject]);
            break;

        case "resolved":
            promiseReact(deferred, onResolve, promise[$value]);
            break;

        case "rejected":
            promiseReact(deferred, onReject, promise[$value]);
            break;
    }

    return deferred.promise;
}

function promiseResolve(promise, x) {

    promiseDone(promise, "resolved", x, promise[$onResolve]);
}

function promiseReject(promise, x) {

    promiseDone(promise, "rejected", x, promise[$onReject]);
}

function promiseDone(promise, status, value, reactions) {

    if (promise[$status] !== "pending")
        return;

    promise[$status] = status;
    promise[$value] = value;
    promise[$onResolve] = promise[$onReject] = void 0;

    for (var i = 0; i < reactions.length; ++i)
        promiseReact(reactions[i][0], reactions[i][1], value);
}

function promiseUnwrap(deferred, x) {

    if (x === deferred.promise)
        throw new TypeError("Promise cannot wrap itself");

    if (isPromise(x))
        promiseChain(x, deferred.resolve, deferred.reject);
    else
        deferred.resolve(x);
}

function promiseReact(deferred, handler, x) {

    enqueueMicrotask($=> {

        try { promiseUnwrap(deferred, handler(x)) }
        catch(e) { try { deferred.reject(e) } catch (e) { } }
    });
}

class Promise {

    constructor(init) {

        if (typeof init !== "function")
            throw new TypeError("Promise constructor called without initializer");

        this[$value] = void 0;
        this[$status] = "pending";
        this[$onResolve] = [];
        this[$onReject] = [];

        var resolve = x => promiseResolve(this, x),
            reject = r => promiseReject(this, r);

        try { init(resolve, reject) } catch (x) { reject(x) }
    }

    chain(onResolve, onReject) {

        return promiseChain(this, onResolve, onReject);
    }

    then(onResolve, onReject) {

        if (typeof onResolve !== "function") onResolve = x => x;

        return promiseChain(this, x => {

            if (x && typeof x === "object") {

                var maybeThen = x.then;

                if (typeof maybeThen === "function")
                    return maybeThen.call(x, onResolve, onReject);
            }

            return onResolve(x);

        }, onReject);

    }

    catch(onReject) {

        return this.then(void 0, onReject);
    }

    static defer() {

        return promiseDefer(this);
    }

    static accept(x) {

        var d = promiseDefer(this);
        d.resolve(x);
        return d.promise;
    }

    static resolve(x) {

        if (isPromise(x))
            return x;

        var d = promiseDefer(this);
        d.resolve(x);
        return d.promise;
    }

    static reject(x) {

        var d = promiseDefer(this);
        d.reject(x);
        return d.promise;
    }

    static all(values) {

        var deferred = promiseDefer(this),
            resolutions = [],
            count = 0;

        try {

            for (var item of values)
                this.resolve(item).then(onResolve(count++), deferred.reject);

            if (count === 0)
                deferred.resolve(resolutions);

        } catch(x) { deferred.reject(x) }

        return deferred.promise;

        function onResolve(i) {

            return x => {

                resolutions[i] = x;

                if (--count === 0)
                    deferred.resolve(resolutions);
            };
        }
    }

    static race(values) {

        var deferred = promiseDefer(this);

        try {

            for (var item of values)
                this.resolve(item).then(deferred.resolve, deferred.reject);

        } catch(x) { deferred.reject(x) }

        return deferred.promise;
    }

}

if (!global.Promise)
    global.Promise = Promise;
