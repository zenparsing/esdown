module X {

    export function A() {}
    export var X;
}

import { A } from X;

export { A as Z };
