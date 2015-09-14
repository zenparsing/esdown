import {

    addProperties,
    toLength,
    toInteger,
    sameValue,
    assertThis,
    isRegExp,

} from "./Core.js";

// Repeat a string by "squaring"
function repeat(s, n) {

    if (n < 1) return "";
    if (n % 2) return repeat(s, n - 1) + s;
    let half = repeat(s, n / 2);
    return half + half;
}

function StringIterator(string) {

    this.string = string;
    this.current = 0;
}

addProperties(StringIterator.prototype = {}, {

    next() {

        let s = this.string,
            i = this.current,
            len = s.length;

        if (i >= len) {

            this.current = Infinity;
            return { value: void 0, done: true };
        }

        let c = s.charCodeAt(i),
            chars = 1;

        if (c >= 0xD800 && c <= 0xDBFF && i + 1 < s.length) {

            c = s.charCodeAt(i + 1);
            chars = (c < 0xDC00 || c > 0xDFFF) ? 1 : 2;
        }

        this.current += chars;

        return { value: s.slice(i, this.current), done: false };
    },

    "@@iterator"() { return this },

});

export function polyfill() {

    addProperties(String, {

        raw(callsite, ...args) {

            let raw = callsite.raw,
                len = toLength(raw.length);

            if (len === 0)
                return "";

            let s = "", i = 0;

            while (true) {

                s += raw[i];
                if (i + 1 === len || i >= args.length) break;
                s += args[i++];
            }

            return s;
        },

        fromCodePoint(...points) {

            let out = [];

            points.forEach(next => {

                next = Number(next);

                if (!sameValue(next, toInteger(next)) || next < 0 || next > 0x10ffff)
                    throw new RangeError("Invalid code point " + next);

                if (next < 0x10000) {

                    out.push(String.fromCharCode(next));

                } else {

                    next -= 0x10000;
                    out.push(String.fromCharCode((next >> 10) + 0xD800));
                    out.push(String.fromCharCode((next % 0x400) + 0xDC00));
                }
            });

            return out.join("");
        }

    });

    addProperties(String.prototype, {

        repeat(count) {

            assertThis(this, "String.prototype.repeat");

            let string = String(this);

            count = toInteger(count);

            if (count < 0 || count === Infinity)
                throw new RangeError("Invalid count value");

            return repeat(string, count);
        },

        startsWith(search) {

            assertThis(this, "String.prototype.startsWith");

            if (isRegExp(search))
                throw new TypeError("First argument to String.prototype.startsWith must not be a regular expression");

            let string = String(this);

            search = String(search);

            let pos = arguments.length > 1 ? arguments[1] : undefined,
                start = Math.max(toInteger(pos), 0);

            return string.slice(start, start + search.length) === search;
        },

        endsWith(search) {

            assertThis(this, "String.prototype.endsWith");

            if (isRegExp(search))
                throw new TypeError("First argument to String.prototype.endsWith must not be a regular expression");

            let string = String(this);

            search = String(search);

            let len = string.length,
                arg = arguments.length > 1 ? arguments[1] : undefined,
                pos = arg === undefined ? len : toInteger(arg),
                end = Math.min(Math.max(pos, 0), len);

            return string.slice(end - search.length, end) === search;
        },

        contains(search) {

            assertThis(this, "String.prototype.contains");

            let string = String(this),
                pos = arguments.length > 1 ? arguments[1] : undefined;

            // Somehow this trick makes method 100% compat with the spec
            return string.indexOf(search, pos) !== -1;
        },

        codePointAt(pos) {

            assertThis(this, "String.prototype.codePointAt");

            let string = String(this),
                len = string.length;

            pos = toInteger(pos);

            if (pos < 0 || pos >= len)
                return undefined;

            let a = string.charCodeAt(pos);

            if (a < 0xD800 || a > 0xDBFF || pos + 1 === len)
                return a;

            let b = string.charCodeAt(pos + 1);

            if (b < 0xDC00 || b > 0xDFFF)
                return a;

            return ((a - 0xD800) * 1024) + (b - 0xDC00) + 0x10000;
        },

        "@@iterator"() {

            assertThis(this, "String.prototype[Symbol.iterator]");
            return new StringIterator(this);
        },

    });

}
