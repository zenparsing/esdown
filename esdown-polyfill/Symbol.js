import { addProperties } from './Core.js';


export function polyfill(global) {
  let symbolCounter = 0;

  function fakeSymbol() {
    return '__$' + Math.floor(Math.random() * 1e9) + '$' + (++symbolCounter) + '$__';
  }

  if (!global.Symbol)
    global.Symbol = fakeSymbol;

  addProperties(Symbol, {
    iterator: Symbol('iterator'),
    species: Symbol('species'),
    asyncIterator: Symbol('asyncIterator'),
  });
}
