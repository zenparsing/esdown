import * as Path from "node:path";
import * as FS from "node:fs";

const NODE_PATH = typeof process !== "undefined" && process.env["NODE_PATH"] || "",
      NOT_PACKAGE = /^(?:\.{0,2}\/|[a-z]+:)/i;

let Module = module.constructor,
    packageRoots;

function isFile(path) {

    let stat;

    try { stat = FS.statSync(path) }
    catch (x) {}

    return stat && stat.isFile();
}

function isDirectory(path) {

    let stat;

    try { stat = FS.statSync(path) }
    catch (x) {}

    return stat && stat.isDirectory();
}

function getFolderEntry(dir) {

    let path;

    // Look for an ES entry point (default.js)
    path = Path.join(dir, "default.js");

    if (isFile(path))
        return { path };

    // Look for a legacy entry point (package.json or index.js)
    path = Module._findPath("./", [dir]);

    if (path)
        return { path, legacy: true };

    return null;
}

export function locateModule(path, base) {

    if (isPackageSpecifier(path))
        return locatePackage(path, base);

    if (path.charAt(0) !== "." && path.charAt(0) !== "/")
        return { path };

    path = Path.resolve(base, path);

    if (isDirectory(path))
        return getFolderEntry(path);

    return { path };
}

export function isPackageSpecifier(spec) {

    return !NOT_PACKAGE.test(spec);
}

export function locatePackage(name, base) {

    if (NOT_PACKAGE.test(name))
        throw new Error("Not a package specifier");

    let pathInfo;

    if (!packageRoots)
        packageRoots = NODE_PATH.split(Path.delimiter).map(v => v.trim());

    let list = Module._nodeModulePaths(base).concat(packageRoots);

    list.some(root => {

        pathInfo = getFolderEntry(Path.resolve(root, name));

        if (pathInfo)
            return true;
    });

    if (!pathInfo)
        throw new Error(`Package ${ name } could not be found.`);

    return pathInfo;
}
