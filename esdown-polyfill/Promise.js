import { addProperties, global } from "./Core.js";

const runLater = (_=> {

    // Node
    if (global.process && typeof process.version === "string") {
        return global.setImmediate ?
            fn => { setImmediate(fn) } :
            fn => { process.nextTick(fn) };
    }

    // Newish Browsers
    let Observer = global.MutationObserver || global.WebKitMutationObserver;

    if (Observer) {
        let div = document.createElement("div");
        let queuedFn = null;

        let observer = new Observer(_=> {
            let fn = queuedFn;
            queuedFn = null;
            fn();
        });

        observer.observe(div, { attributes: true });

        return fn => {
            if (queuedFn !== null)
                throw new Error("Only one function can be queued at a time");

            queuedFn = fn;
            div.classList.toggle("x");
        };
    }

    // Fallback
    return fn => { setTimeout(fn, 0) };
})();

let taskQueue = null;

function flushQueue() {
    let q = taskQueue;
    taskQueue = null;

    for (let i = 0; i < q.length; ++i)
        q[i]();
}

function enqueueMicrotask(fn) {
    // fn must not throw
    if (!taskQueue) {
        taskQueue = [];
        runLater(flushQueue);
    }

    taskQueue.push(fn);
}

export function polyfill() {
    const OPTIMIZED = {};
    const PENDING = 0;
    const RESOLVED = +1;
    const REJECTED = -1;

    function idResolveHandler(x) { return x }
    function idRejectHandler(r) { throw r }
    function noopResolver() {}

    function Promise(resolver) {
        this._status = PENDING;

        // Optimized case to avoid creating an uneccessary closure.  Creator assumes
        // responsibility for setting initial state.
        if (resolver === OPTIMIZED)
            return;

        if (typeof resolver !== "function")
            throw new TypeError("Resolver is not a function");

        this._onResolve = [];
        this._onReject = [];

        try { resolver(x => { resolvePromise(this, x) }, r => { rejectPromise(this, r) }) }
        catch (e) { rejectPromise(this, e) }
    }

    function chain(promise, onResolve = idResolveHandler, onReject = idRejectHandler) {
        let deferred = makeDeferred(promise.constructor);

        switch (promise._status) {
            case PENDING:
                promise._onResolve.push(onResolve, deferred);
                promise._onReject.push(onReject, deferred);
                break;
            case RESOLVED:
                enqueueHandlers(promise._value, [onResolve, deferred], RESOLVED);
                break;
            case REJECTED:
                enqueueHandlers(promise._value, [onReject, deferred], REJECTED);
                break;
        }

        return deferred.promise;
    }

    function resolvePromise(promise, x) {
        completePromise(promise, RESOLVED, x, promise._onResolve);
    }

    function rejectPromise(promise, r) {
        completePromise(promise, REJECTED, r, promise._onReject);
    }

    function completePromise(promise, status, value, queue) {
        if (promise._status === PENDING) {
            promise._status = status;
            promise._value = value;
            enqueueHandlers(value, queue, status);
        }
    }

    function coerce(constructor, x) {
        if (!isPromise(x) && Object(x) === x) {
            let then;

            try { then = x.then }
            catch(r) { return makeRejected(constructor, r) }

            if (typeof then === "function") {
                let deferred = makeDeferred(constructor);

                try { then.call(x, deferred.resolve, deferred.reject) }
                catch(r) { deferred.reject(r) }

                return deferred.promise;
            }
        }

        return x;
    }

    function enqueueHandlers(value, tasks, status) {
        enqueueMicrotask(_=> {
            for (let i = 0; i < tasks.length; i += 2)
                runHandler(value, tasks[i], tasks[i + 1]);
        });
    }

    function runHandler(value, handler, deferred) {
        try {
            let result = handler(value);
            if (result === deferred.promise)
                throw new TypeError("Promise cycle");
            else if (isPromise(result))
                chain(result, deferred.resolve, deferred.reject);
            else
                deferred.resolve(result);
        } catch (e) {
            try { deferred.reject(e) }
            catch (e) { }
        }
    }

    function isPromise(x) {
        try { return x._status !== void 0 }
        catch (e) { return false }
    }

    function makeDeferred(constructor) {
        if (constructor === Promise) {
            let promise = new Promise(OPTIMIZED);
            promise._onResolve = [];
            promise._onReject = [];

            return {
                promise: promise,
                resolve: x => { resolvePromise(promise, x) },
                reject: r => { rejectPromise(promise, r) },
            };
        } else {
            let result = {};
            result.promise = new constructor((resolve, reject) => {
                result.resolve = resolve;
                result.reject = reject;
            });

            return result;
        }
    }

    function makeRejected(constructor, r) {
        if (constructor === Promise) {
            let promise = new Promise(OPTIMIZED);
            promise._status = REJECTED;
            promise._value = r;
            return promise;
        }

        return new constructor((resolve, reject) => reject(r));
    }

    function iterate(values, fn) {
        if (typeof Symbol !== "function" || !Symbol.iterator) {
            if (!Array.isArray(values))
                throw new TypeError("Invalid argument");

            values.forEach(fn);
        }

        let i = 0;

        for (let x of values)
            fn(x, i++);
    }

    addProperties(Promise.prototype, {

        then(onResolve, onReject) {
            onResolve = typeof onResolve === "function" ? onResolve : idResolveHandler;
            onReject = typeof onReject === "function" ? onReject : idRejectHandler;

            let constructor = this.constructor;

            return chain(this, x => {
                x = coerce(constructor, x);
                return x === this ? onReject(new TypeError("Promise cycle")) :
                    isPromise(x) ? x.then(onResolve, onReject) :
                    onResolve(x);
            }, onReject);
        },

        catch(onReject) {
            return this.then(void 0, onReject);
        },

    });

    addProperties(Promise, {

        reject(e) {
            return makeRejected(this, e);
        },

        resolve(x) {
            return isPromise(x) ? x : new this(resolve => resolve(x));
        },

        all(values) {
            let deferred = makeDeferred(this);
            let resolutions = [];
            let count = 0;

            try {
                iterate(values, (x, i) => {
                    count++;
                    this.resolve(x).then(value => {
                        resolutions[i] = value;
                        if (--count === 0)
                            deferred.resolve(resolutions);
                    }, deferred.reject);
                });

                if (count === 0)
                    deferred.resolve(resolutions);
            } catch (e) {
                deferred.reject(e);
            }

            return deferred.promise;
        },

        race(values) {
            let deferred = makeDeferred(this);
            try {
                iterate(values, x => this.resolve(x).then(
                    deferred.resolve,
                    deferred.reject));
            } catch (e) {
                deferred.reject(e);
            }

            return deferred.promise;
        },

    });

    if (!global.Promise)
        global.Promise = Promise;
}
