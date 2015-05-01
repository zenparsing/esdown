class Sink {

    constructor(observer) {

        this.done = false;
        this.cleanup = undefined;
        this.observer = observer;
    }

    close() {

        this.done = true;

        if (this.cleanup)
            this.cleanup.call(undefined);
    }

    next(value) {

        // If the stream if closed, then return a "done" result
        if (this.done)
            return { done: true };

        let result;

        try {

            // Send the next value to the sink
            result = this.observer.next(value);

        } catch (e) {

            // If the observer throws, then close the stream and rethrow the error
            this.close();
            throw e;
        }

        // Cleanup if sink is closed
        if (result && result.done)
            this.close();

        return result;
    }

    throw(value) {

        // If the stream is closed, throw the error to the caller
        if (this.done)
            throw value;

        this.done = true;

        try {

            // If the sink does not support "throw", then throw the error to the caller
            if (!("throw" in this.observer))
                throw value;

            return this.observer.throw(value);

        } finally {

            this.close();
        }
    }

    return(value) {

        // If the stream is closed, then return a done result
        if (this.done)
            return { done: true };

        this.done = true;

        try {

            // If the sink does not support "return", then return a done result
            if (!("return" in this.observer))
                return { done: true };

            return this.observer.return(value);

        } finally {

            this.close();
        }
    }
}

class Observable {

    constructor(start) {

        // The stream initializer must be a function
        if (typeof start !== "function")
            throw new TypeError("Observer definition is not a function");

        this._start = start;
    }

    subscribe(observer) {

        // The sink must be an object
        if (Object(observer) !== observer)
            throw new TypeError("Observer is not an object");

        let sink = new Sink(observer);

        try {

            // Call the stream initializer.  The initializer will return a cleanup
            // function or undefined.
            sink.cleanup = this._start.call(undefined,
                x => sink.next(x),
                x => sink.throw(x),
                x => sink.return(x));

        } catch (e) {

            // If an error occurs during the initializer, then send an error
            // to the sink
            sink.throw(e);
        }

        // If the stream is already finished, then perform cleanup
        if (sink.done && sink.cleanup !== undefined)
            sink.cleanup.call(undefined);

        // Return a cancelation function
        return _=> { sink.return() };
    }

    async *[Symbol.asyncIterator]() {

        let ready = [], pending = [];

        function send(x) {

            if (pending.length > 0) pending.shift()(x);
            else ready.push(x);
        }

        function next() {

            return ready.length > 0 ?
                ready.shift() :
                new Promise(resolve => pending.push(resolve));
        }

        let cancel = this.subscribe({

            next(value) { send({ type: "next", value }) },
            throw(value) { send({ type: "throw", value }) },
            return(value) { send({ type: "return", value }) },
        });

        try {

            while (true) {

                let result = await next();

                if (result.type == "return") return result.value;
                else if (result.type === "throw") throw result.value;
                else yield result.value;
            }

        } finally {

            cancel();
        }
    }

    forEach(fn) {

        return new Promise((resolve, reject) => {

            this.subscribe({

                next: fn,
                throw: reject,
                return: resolve,
            });
        });
    }

    map(fn) {

        if (typeof fn !== "function")
            throw new TypeError("Callback is not a function");

        return new this.constructor((push, error, close) => this.subscribe({

            next(value) {

                try { value = fn(value) }
                catch (e) { return error(e) }

                return push(value);
            },

            throw: error,
            return: close,

        }));
    }

}

if (!_esdown.global.Observable)
    _esdown.global.Observable = Observable;
