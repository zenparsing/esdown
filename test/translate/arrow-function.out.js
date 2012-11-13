var __this = this; (function(ident) { "use strict"; return "abc"; });

(function() { "use strict"; return "abc"; });

(function() { "use strict"; return +new Date(); });

(function(a, b, c) { "use strict"; return 123 + 456; });

(function(ident) { "use strict";

    console.log("hello");
});

(function(a, b, c) { "use strict";

    console.log("world");
});

(function() { "use strict"; (function() { "use strict";}) });

(function(ident) { "use strict"; return __this; });

(function() { "use strict";

    var x = function() { return this; };
});

(function() { "use strict";

    function x() { return this; };
});

(function() { "use strict";

    (function() { "use strict"; return __this; });
});

(function(ident) { "use strict"; return __this.method(); });