class Observable {

    constructor(start) {

        // The stream initializer must be a function
        if (typeof start !== "function")
            throw new TypeError("Observer definition is not a function");

        this._start = start;
    }

    observe(sink) {

        // The sink must be an object
        if (Object(sink) !== sink)
            throw new TypeError("Sink is not an object");

        var start = this._start,
            finished = false,
            cleanup;

        // Wrap the provided sink
        sink = _wrapSink(sink, _=> {

            finished = true;

            if (cleanup !== void 0)
                cleanup();
        });

        try {

            // Call the stream initializer.  The initializer will return a cleanup
            // function or undefined.
            cleanup = start.call(void 0, sink);

        } catch (e) {

            sink.throw(e);
        }

        // If the stream is already finished, then perform cleanup
        if (finished && cleanup !== void 0)
            cleanup();

        // Return a cancelation function
        return _=> { sink.return() };
    }

    /*

        Observer sinks are wrapped for the following reasons:

        - Ensures that the sink is not called after the stream is closed.
        - Ensures that the returned object has all three sink methods ("next", "throw", and "return").
        - Ensures that values are properly handled when the sink does not have "throw" or "return".
        - Ensures that returned methods can be called without a provided "this" value.
        - Ensures that cleanup is triggered when the stream is closed.

    */
    function _wrapSink(sink, cleanup) {

        var done = false;

        // Marks the stream as closed and triggers stream cleanup.  Exceptions
        // which occur during cleanup are propogated to the caller.
        function close() {

            if (!done) {

                done = true;
                cleanup();
            }
        }

        // Returns a "done" result
        function doneResult() {

            return { value: void 0, done: true };
        }

        // Sends a completion value to the sink
        function send(op, value) {

            // If the stream if closed, then return a "done" result
            if (done)
                return doneResult();

            var result;

            try {

                switch (op) {

                    case "next":

                        // Send the next value to the sink
                        result = sink.next(value);
                        break;

                    case "throw":

                        // If the sink does not support "throw", then throw value back to caller
                        if (!("throw" in sink))
                            throw value;

                        result = sink.throw(value);
                        break;

                    case "return":

                        // If the sink does not support "return", then close and return a done result
                        if (!("return" in sink))
                            return close(), doneResult();

                        result = sink.return(value);

                        // If the sink does not return a result, then assume that it is finished
                        if (!result)
                            result = doneResult();

                        break;

                }

            } catch (e) {

                // If the sink throws, then close the stream and throw error to caller
                close();
                throw e;
            }

            // If the sink is finished receiving data, then close the stream
            if (result && result.done)
                close();

            return result;
        }

        return {
            next(value) { return send("next", value) },
            throw(value) { return send("throw", value) },
            return(value) { return send("return", value) },
        };
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

                var value;

                try { value = fn(value) }
                catch (e) { return sink.throw(e) }

                return sink.next(value);
            },

            throw: sink.throw,
            return: sink.return,

        }));
    }

    [Symbol.asyncIterator]() {

        var pending = [], ready = [];

        function current() {

            if (pending.length > 0)
                return pending.shift();

            var d;
            ready.push(new Promise((resolve, reject) => d = { resolve, reject }));
            return d;
        }

        var cancel = this.observe({

            next(value) { current().resolve({ value, done: false }) },
            throw(value) { current().reject(value) },
            return(value) { current().resolve({ value, done: true }) },
        });

        return {

            next() {

                if (ready.length > 0)
                    return ready.shift();

                return new Promise((resolve, reject) => pending.push({ resolve, reject }));
            },

            throw(value) {

                return new Promise((resolve, reject) => {

                    cancel();
                    reject(value);
                });
            },

            return() {

                return new Promise(resolve => {

                    cancel();
                    resolve({ value: void 0, done: true });
                });
            },
        };
    }

}


if (!_esdown.global.Observable)
    _esdown.global.Observable = Observable;
