import { addProperties, toObject, toLength, toInteger } from "./Core.js";

export function polyfill() {

    function arrayFind(obj, pred, thisArg, type) {
        let len = toLength(obj.length);
        let val;

        if (typeof pred !== "function")
            throw new TypeError(pred + " is not a function");

        for (let i = 0; i < len; ++i) {
            val = obj[i];
            if (pred.call(thisArg, val, i, obj))
                return type === "value" ? val : i;
        }

        return type === "value" ? void 0 : -1;
    }

    function ArrayIterator(array, kind) {
        this.array = array;
        this.current = 0;
        this.kind = kind;
    }

    addProperties(ArrayIterator.prototype = {}, {

        next() {
            let length = toLength(this.array.length);
            let index = this.current;

            if (index >= length) {
                this.current = Infinity;
                return { value: void 0, done: true };
            }

            this.current += 1;

            switch (this.kind) {
                case "values":
                    return { value: this.array[index], done: false };
                case "entries":
                    return { value: [ index, this.array[index] ], done: false };
                default:
                    return { value: index, done: false };
            }
        },

        "@@iterator"() { return this },

    });

    addProperties(Array, {

        from(list) {
            list = toObject(list);

            let ctor = typeof this === "function" ? this : Array;
            let map = arguments[1];
            let thisArg = arguments[2];
            let i = 0;
            let out;

            if (map !== void 0 && typeof map !== "function")
                throw new TypeError(map + " is not a function");

            let getIter = list[Symbol.iterator];

            if (getIter) {
                let iter = getIter.call(list);
                let result;

                out = new ctor;

                while (result = iter.next(), !result.done) {
                    out[i++] = map ? map.call(thisArg, result.value, i) : result.value;
                    out.length = i;
                }
            } else {
                let len = toLength(list.length);

                out = new ctor(len);

                for (; i < len; ++i)
                    out[i] = map ? map.call(thisArg, list[i], i) : list[i];

                out.length = len;
            }

            return out;
        },

        of(...items) {
            let ctor = typeof this === "function" ? this : Array;
            if (ctor === Array)
                return items;

            let len = items.length;
            let out = new ctor(len);

            for (let i = 0; i < len; ++i)
                out[i] = items[i];

            out.length = len;
            return out;
        },

    });

    addProperties(Array.prototype, {

        copyWithin(target, start) {
            let obj = toObject(this);
            let len = toLength(obj.length);
            let end = arguments[2];

            target = toInteger(target);
            start = toInteger(start);

            let to = target < 0 ? Math.max(len + target, 0) : Math.min(target, len);
            let from = start < 0 ? Math.max(len + start, 0) : Math.min(start, len);

            end = end !== void 0 ? toInteger(end) : len;
            end = end < 0 ? Math.max(len + end, 0) : Math.min(end, len);

            let count = Math.min(end - from, len - to);
            let dir = 1;

            if (from < to && to < from + count) {
                dir = -1;
                from += count - 1;
                to += count - 1;
            }

            for (; count > 0; --count) {
                if (from in obj) obj[to] = obj[from];
                else delete obj[to];

                from += dir;
                to += dir;
            }

            return obj;
        },

        fill(value) {
            let obj = toObject(this);
            let len = toLength(obj.length);
            let start = toInteger(arguments[1]);
            let pos = start < 0 ? Math.max(len + start, 0) : Math.min(start, len);
            let end = arguments.length > 2 ? toInteger(arguments[2]) : len;

            end = end < 0 ? Math.max(len + end, 0) : Math.min(end, len);

            for (; pos < end; ++pos)
                obj[pos] = value;

            return obj;
        },

        find(pred) {
            return arrayFind(toObject(this), pred, arguments[1], "value");
        },

        findIndex(pred) {
            return arrayFind(toObject(this), pred, arguments[1], "index");
        },

        values()  { return new ArrayIterator(this, "values") },

        entries() { return new ArrayIterator(this, "entries") },

        keys()    { return new ArrayIterator(this, "keys") },

        "@@iterator"() { return this.values() },

    });

}
