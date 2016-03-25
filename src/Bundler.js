import * as Path from "node:path";
import { readFile, writeFile } from "./AsyncFS.js";
import { isPackageSpecifier, isNodeModule, locateModule } from "./Locator.js";
import { translate, wrapModule } from "./Translator.js";
import { isLegacyScheme, addLegacyScheme, removeScheme, hasScheme } from "./Schema.js";

const BUNDLE_INIT =
"var __M; " +
"(function(a) { " +
    "var list = Array(a.length / 2); " +

    "__M = function(i) { " +
        "var m = list[i], f, e, ee; " +
        "if (typeof m !== 'function') return m.exports; " +
        "f = m; " +
        "m = { exports: i ? {} : exports }; " +
        "f(list[i] = m, e = m.exports); " +
        "ee = m.exports; " +
        "if (ee && ee !== e && !('default' in ee)) " +
            "ee['default'] = ee; " +
        "return ee; " +
    "}; " +

    "for (var i = 0; i < a.length; i += 2) { " +
        "var j = Math.abs(a[i]); " +
        "list[j] = a[i + 1]; " +
        "if (a[i] >= 0) __M(j); " +
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

        if (isNodeModule(key))
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

        if (Path.extname(node.path) === ".json")
            input = "module.exports = " + input + ";";

        node.output = translate(input, {

            identifyModule: path => `__M(${ this.addEdge(node, path, false).id })`,

            replaceRequire: path => {

                let n = this.addEdge(node, path, true);
                return n ? `__M(${ n.id })` : null;
            },

            module: !node.legacy,
            functionContext: node.legacy,
            noWrap: true,
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

        output = BUNDLE_INIT + `([\n${ output }]);\n`;

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
