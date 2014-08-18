import * as Path from "node:path";
import * as FS from "node:fs";

var NODE_PATH = process.env["NODE_PATH"] || "",
    NOT_PACKAGE = /^(?:\.{0,2}\/|[a-z]+:)/i,
    Module = module.constructor,
    packageRoots;

function isFile(path) {

    var stat;

    try { stat = FS.statSync(path) }
    catch (x) {}

    return stat && stat.isFile();
}

function isDirectory(path) {

    var stat;

    try { stat = FS.statSync(path) }
    catch (x) {}

    return stat && stat.isDirectory();
}

export function locateModule(path, base) {

    if (isPackageSpecifier(path))
        return locatePackage(path, base);

    if (path.charAt(0) !== "." && path.charAt(0) !== "/")
        return path;

    path = Path.resolve(base, path);

    if (isDirectory(path))
        path = Path.join(path, "default.js");

    return path;
}

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

        path = Path.resolve(root, name, "default.js");
        return isFile(path);
    });

    if (found)
        return path;

    throw new Error(`Package ${name} could not be found.`);
}
