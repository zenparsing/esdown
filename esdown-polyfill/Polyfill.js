import { global } from "./Core.js";

import * as symbols from "./Symbol.js";
import * as array from "./Array.js";
import * as mapset from "./MapSet.js";
import * as number from "./Number.js";
import * as object from "./Object.js";
import * as promise from "./Promise.js";
import * as string from "./String.js";

export { global };

export function polyfill() {
    [symbols, array, mapset, number, object, promise, string]
        .forEach(m => m.polyfill(global));
}
