export function A() {}
export var X;

function B() {}
export B;

function C() {}
export { C };
export { D: C };
export { E: A.B };

export * from Z;
export * from "Z.js";