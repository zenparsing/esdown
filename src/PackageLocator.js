var Path = require("path"),
    FS = require("fs");

var NODE_PATH = process.env["NODE_PATH"] || "",
    NOT_PACKAGE = /^(?:\.{0,2}\/|[a-z]+:)/,
    Module = module.constructor,
    packageRoots;

export function isPackageSpecifier(spec) {

    return !NOT_PACKAGE.test(spec);
}

export function locatePackage(name, base) {

    if (NOT_PACKAGE.test(name))
        throw new Error("Not a package specifier");

    var path;

    if (!packageRoots)
        packageRoots = NODE_PATH.split(Path.delimiter).map(v => v.trim());

    var list = Module._nodeModulePaths(base).concat(packageRoots);

    var found = list.some(root => {

        var stat = null;

        path = Path.join(Path.resolve(root, name), "main.js");

        try { stat = FS.statSync(path); }
        catch (x) {}

        return stat && stat.isFile();
    });

    if (found)
        return path;

    throw new Error(`Package ${name} could not be found.`);
}
