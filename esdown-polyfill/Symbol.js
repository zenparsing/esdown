import { addProperties } from "./Core.js";

let symbolCounter = 0;

function fakeSymbol() {

    return "__$" + Math.floor(Math.random() * 1e9) + "$" + (++symbolCounter) + "$__";
}

export function polyfill(global) {

    if (!global.Symbol)
        global.Symbol = fakeSymbol;

    addProperties(Symbol, {

        iterator: Symbol("iterator"),

        species: Symbol("species"),

        // Experimental async iterator support
        asyncIterator: Symbol("asyncIterator"),

    });

}
