function doneResult() {

    return { value: void 0, done: true };
}

class Subscription {

    constructor(sink) {

        this.done = false;
        this.cleanup = void 0;
        this.sink = sink;
    }

    close() {

        this.done = true;

        if (this.cleanup)
            this.cleanup.call(void 0);
    }

    resume(value) {

        // If the stream if closed, then return a "done" result
        if (this.done)
            return doneResult();

        let result;

        try {

            // Send the next value to the sink
            result = this.sink.next(value);

        } catch (x) {

            this.close();
            throw x;
        }

        // Cleanup if sink is closed
        if (result && result.done)
            this.close();
    }

    resumeAbrupt(value, type) {

        // If the stream if closed, then return a "done" result
        if (this.done)
            return doneResult();

        let result;

        try {

            if (type === "throw") {

                this.done = true;

                // If the sink does not support "throw", then throw value back to caller
                if (!("throw" in this.sink))
                    throw value;

                result = this.sink.throw(value);

            } else { // Assert: type === "return"

                this.done = true;

                // If the sink does not support "return", then ignore the value
                if ("return" in this.sink)
                    result = this.sink.return(value);

                // If the sink does not return a result, then assume that it is finished
                if (!result)
                    result = doneResult();
            }

        } catch (x) {

            // If the sink throws, then close the stream and throw error to caller
            this.cleanup();
            throw x;
        }

        // If the sink is finished receiving data, then close the stream
        if (result && result.done)
            this.close();

        return result;
    }
}

class Observable {

    constructor(start) {

        // The stream initializer must be a function
        if (typeof start !== "function")
            throw new TypeError("Observer definition is not a function");

        this._start = start;
    }

    subscribe(sink) {

        // The sink must be an object
        if (Object(sink) !== sink)
            throw new TypeError("Sink is not an object");

        let subscription = new Subscription(sink);

        // Call the stream initializer.  The initializer will return a cleanup
        // function or undefined.
        subscription.cleanup = this._start.call(void 0,
            x => subscription.resume(x),
            x => subscription.resumeAbrupt(x, "throw"),
            x => subscription.resumeAbrupt(x, "return"));

        // If the stream is already finished, then perform cleanup
        if (subscription.done && subscription.cleanup !== void 0)
            subscription.cleanup.call(void 0);

        // Return a cancelation function
        return _=> { subscription.resumeAbrupt(void 0, "return") };
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

        let cancel = this.observe({

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

            this.observe({

                next: fn,
                throw: reject,
                return: resolve,
            });
        });
    }

    map(fn) {

        if (typeof fn !== "function")
            throw new TypeError("Callback is not a function");

        return new this.constructor(sink => this.observe({

            next(value) {

                try { value = fn(value) }
                catch (e) { return sink.throw(e) }

                return sink.next(value);
            },

            throw: sink.throw,

            return: sink.return,

        }));
    }

}

if (!_esdown.global.Observable)
    _esdown.global.Observable = Observable;
