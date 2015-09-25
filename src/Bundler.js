import * as Path from "node:path";
import { readFile, writeFile } from "./AsyncFS.js";
import { isPackageSpecifier, locateModule } from "./Locator.js";
import { translate, wrapModule } from "./Translator.js";
import { isLegacyScheme, addLegacyScheme, removeScheme, hasScheme } from "./Schema.js";

const NODE_INTERNAL_MODULE = new RegExp("^(?:" + [

    "assert", "buffer", "child_process", "cluster", "console", "constants", "crypto",
    "dgram", "dns", "domain", "events", "freelist", "fs", "http", "https", "module",
    "net", "os", "path", "process", "punycode", "querystring", "readline", "repl",
    "smalloc", "stream", "string_decoder", "sys", "timers", "tls", "tty", "url", "util",
    "v8", "vm", "zlib",

].join("|") + ")$");

const BUNDLE_INIT =
"var _M; " +
"(function(a) { " +
    "var list = Array(a.length / 2); " +

    "_M = function require(i) { " +
        "var m = list[i], f, e; " +
        "if (typeof m !== 'function') return m.exports; " +
        "f = m; " +
        "m = !i ? module : { exports: {} }; " +
        "e = m.exports; " +
        "f(list[i] = m, e); " +
        "if (m.exports !== e && !('default' in m.exports)) " +
            "m.exports['default'] = m.exports; " +
        "return m.exports; " +
    "}; " +

    "for (var i = 0; i < a.length; i += 2) { " +
        "var j = Math.abs(a[i]); " +
        "list[j] = a[i + 1]; " +
        "if (a[i] >= 0) _M(j); " +
    "} " +
"})";

class Node {

    constructor(path, id) {

        this.path = path;
        this.id = id;
        this.edges = new Map;
        this.output = null;
        this.runtime = false;
        this.legacy = false;
        this.importCount = 0;
        this.ignore = false;
    }
}

class GraphBuilder {

    constructor(root) {

        this.nodes = new Map;
        this.nextID = 0;
        this.root = this.add(root);
    }

    has(key) {

        return this.nodes.has(key);
    }

    get(key) {

        return this.nodes.get(key);
    }

    add(key) {

        if (this.nodes.has(key))
            return this.nodes.get(key);

        let node = new Node(key, this.nextID++);
        this.nodes.set(key, node);
        return node;
    }

    sort(key = this.root.path) {

        let visited = new Set,
            list = [];

        let visit = key => {

            if (visited.has(key))
                return;

            visited.add(key);
            let node = this.nodes.get(key);
            node.edges.forEach((node, key) => visit(key));
            list.push(node);
        };

        visit(key);

        return list;
    }

    addEdge(node, spec, fromRequire) {

        let key = spec,
            legacy = false,
            ignore = false;

        if (fromRequire) {

            legacy = true;

        } else if (isLegacyScheme(spec)) {

            legacy = true;
            key = removeScheme(spec);
        }

        if (legacy && NODE_INTERNAL_MODULE.test(key))
            ignore = true;

        if (ignore && fromRequire)
            return null;

        if (!ignore) {

            let pathInfo = locateModule(key, node.base, legacy);
            key = pathInfo.path;
            legacy = pathInfo.legacy;
        }

        let target = this.nodes.get(key);

        if (target) {

            if (target.legacy !== legacy)
                throw new Error(`Module '${ key }' referenced as both legacy and non-legacy`);

        } else {

            target = this.add(key);
            target.legacy = legacy;
            target.ignore = ignore;
        }

        if (!fromRequire)
            target.importCount++;

        node.edges.set(key, target);
        return target;
    }

    process(node, input) {

        if (node.output !== null)
            throw new Error("Node already processed");

        let result = {};

        node.base = Path.dirname(node.path);

        node.output = translate(input, {

            identifyModule: path => `_M(${ this.addEdge(node, path, false).id })`,

            replaceRequire: path => {

                let n = this.addEdge(node, path, true);
                return n ? `_M(${ n.id })` : null;
            },

            module: !node.legacy,

            result,

        });

        node.runtime = result.runtime.length > 0;
    }

}

export function bundle(rootPath, options = {}) {

    rootPath = Path.resolve(rootPath);

    let builder = new GraphBuilder(rootPath),
        visited = new Set,
        pending = 0,
        resolver,
        allFetched;

    allFetched = new Promise((resolve, reject) => resolver = { resolve, reject });

    function visit(node) {

        let path = node.path;

        // Exit if module has already been processed or should be ignored
        if (node.ignore || visited.has(path))
            return;

        visited.add(path);
        pending += 1;

        readFile(path, { encoding: "utf8" }).then(code => {

            builder.process(node, code);
            node.edges.forEach(visit);

            pending -= 1;

            if (pending === 0)
                resolver.resolve(null);

        }).then(null, err => {

            if (err instanceof SyntaxError && "sourceText" in err)
                err.filename = path;

            resolver.reject(err);
        });
    }

    visit(builder.root);

    return allFetched.then(_=> {

        let needsRuntime = false;

        let output = builder.sort().map(node => {

            if (node.runtime)
                needsRuntime = true;

            let id = node.id;

            if (node.importCount === 0)
                id = -id;

            let init = node.output === null ?
                `function(m) { m.exports = require(${ JSON.stringify(node.path) }) }` :
                `function(module, exports) {\n\n${ node.output }\n\n}`;

            return `${ id }, ${ init }`;

        }).join(",\n");

        output = BUNDLE_INIT + `([\n${ output }]);`;

        output = wrapModule(output, [], {

            global: options.global,
            runtime: needsRuntime,
            polyfill: options.polyfill,
        });

        if (options.output)
            return writeFile(Path.resolve(options.output), output, "utf8").then(_=> "");

        return output;
    });
}
