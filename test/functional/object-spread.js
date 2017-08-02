export const tests = {

  'object spread' (test) {
    test.equals(
      { a: 1, b: 2, ...{ c: 3, d: 4 }, e: 5 },
      { a: 1, b: 2, c: 3, d: 4, e: 5 });
  },

};
