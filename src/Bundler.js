import * as Path from "node:path";
import { readFile, writeFile } from "./AsyncFS.js";
import { isPackageSpecifier, locateModule } from "./Locator.js";
import { translate, wrapModule } from "./Translator.js";
import { isLegacyScheme, removeScheme, hasScheme } from "./Schema.js";


class Node {

    constructor(path, name) {

        this.path = path;
        this.name = name;
        this.edges = new Set;
        this.output = null;
    }
}

class GraphBuilder {

    constructor(root) {

        this.nodes = new Map;
        this.nextID = 1;
        this.root = this.add(root);
    }

    has(key) {

        return this.nodes.has(key);
    }

    add(key) {

        if (this.nodes.has(key))
            return this.nodes.get(key);

        let name = "_M" + (this.nextID++),
            node = new Node(key, name);

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
            node.edges.forEach(visit);
            list.push(node);
        };

        visit(key);

        return list;
    }

    process(key, input) {

        if (!this.nodes.has(key))
            throw new Error("Node not found");

        let node = this.nodes.get(key);

        if (node.output !== null)
            throw new Error("Node already processed");

        let dir = Path.dirname(node.path);

        let identifyModule = path => {

            path = locateModule(path, dir).path;
            node.edges.add(path);
            return this.add(path).name;
        };

        node.output = translate(input, { identifyModule, module: true });

        return node;
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

    function visit(path) {

        // Exit if module has already been processed
        if (visited.has(path))
            return;

        visited.add(path);
        pending += 1;

        readFile(path, { encoding: "utf8" }).then(code => {

            let node = builder.process(path, code);

            node.edges.forEach(path => {

                // If we want to optionally limit the scope of the bundle, we
                // will need to apply some kind of filter here.

                // Do not bundle any files that start with a scheme prefix
                if (!hasScheme(path))
                    visit(path);
            });

            pending -= 1;

            if (pending === 0)
                resolver.resolve(null);

        }).then(null, err => {

            if (err instanceof SyntaxError && "sourceText" in err)
                err.filename = path;

            resolver.reject(err);
        });
    }

    visit(rootPath);

    return allFetched.then($=> {

        let nodes = builder.sort(),
            imports = [],
            varList = [],
            output = "";

        nodes.forEach(node => {

            if (node.output === null)
                imports.push({ url: node.path, identifier: node.name });
            else
                varList.push(`${ node.name } = ${ node.path === rootPath ? "exports" : "{}" }`);
        });

        if (varList.length > 0)
            output += "var " + varList.join(",") + ";\n";

        nodes.filter(n => n.output !== null).forEach(node => {

            output +=
                "\n(function(exports) {\n\n" +
                node.output +
                "\n\n})(" + node.name + ");\n";
        });

        // TODO:  If options.runtime is not specified, then "_esdown" won't be defined.
        // We need to be able to add the "esdown-runtime" import if needed.  Does
        // translate need to return an object?  How can we get translate to tell us
        // whether the runtime was required or not?  A callback, perhaps?

        if (options.runtime || options.polyfill) {

            output = translate("", {

                runtime: options.runtime,
                polyfill: options.polyfill,
                module: true,

            }) + "\n\n" + output;
        }

        output = wrapModule(output, imports, { global: options.global });

        if (options.output)
            return writeFile(Path.resolve(options.output), output, "utf8").then(_=> "");

        return output;
    });
}
