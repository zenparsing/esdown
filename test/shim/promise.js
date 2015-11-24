function delayed(value, ms) {

    return new Promise(resolve => setTimeout(_=> resolve(value), ms));
}

function either(p) {

    return p.then(x => x, x => x);
}

export var tests = {

    "all": {

        "fulfills if passed an array of mixed fulfilled promises and values" (test) {

            var list = [0, Promise.resolve(1), 2, Promise.resolve(3)];

            return either(Promise.all(list)).then(x => {

                test.assert(Array.isArray(x));
                test.equals(x, [0, 1, 2, 3]);
            });
        },

        "fulfills if passed an iterable of mixed fulfilled promises and values" (test) {

            var iter = [0, Promise.resolve(1), 2, Promise.resolve(3)][Symbol.iterator]();

            return either(Promise.all(iter)).then(x => {

                test.assert(Array.isArray(x));
                test.equals(x, [0, 1, 2, 3]);
            });
        },

    },

    "race": {

        "fulfills if all promises are settled and the ordinally-first is fulfilled" (test) {

            var list = [Promise.resolve(1), Promise.reject(2), Promise.resolve(3)];
            return either(Promise.race(list)).then(x => test.equals(x, 1));
        },

        "fulfills if given a iterable" (test) {

            var list = [Promise.resolve(1), Promise.reject(2), Promise.resolve(3)],
                iter = list[Symbol.iterator]();
            return either(Promise.race(iter)).then(x => test.equals(x, 1));
        },

        "rejects if all promises are settled and the ordinally-first is rejected" (test) {

            var list = [Promise.reject(1), Promise.reject(2), Promise.resolve(3)];
            return either(Promise.race(list)).then(x => test.equals(x, 1));
        },

        "settles in the same way as the first promise to settle" (test) {

            var p2 = delayed(2, 200);
            var p1 = delayed(1, 1000);
            var p3 = delayed(3, 500);
            var list = [p1, p2, p3];

            return either(Promise.race(list)).then(x => test.equals(x, 2));
        },

        "never settles when given an empty iterable" (test) {

            var iterable = [];
            var settled = false;

            either(Promise.race(iterable)).then(_=> settled = true);
            return delayed(null, 300).then(_=> test.assert(!settled));
        },

        "rejects with a TypeError if given a non-iterable" (test) {

            var notIterable = {};

            return Promise.race(notIterable).then(
                _=> test.assert(false),
                reason => test.assert(reason instanceof TypeError)
            );
        },

    }

};
