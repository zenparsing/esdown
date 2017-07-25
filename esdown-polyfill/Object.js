import { addProperties, toObject, sameValue } from "./Core.js";

export function polyfill() {
    addProperties(Object, {

        is: sameValue,

        assign(target, source) {
            target = toObject(target);

            for (let i = 1; i < arguments.length; ++i) {
                source = arguments[i];
                if (source != null) // null or undefined
                    Object.keys(source).forEach(key => target[key] = source[key]);
            }

            return target;
        },

        setPrototypeOf(object, proto) {
            // Least effort attempt
            object.__proto__ = proto;
        },

        getOwnPropertySymbols() {
            return [];
        },

    });
}
