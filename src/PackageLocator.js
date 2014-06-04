var Path = require("path"),
    FS = require("fs");

var PACKAGE_URI = /^package:/i,
    NODE_PATH = process.env["NODE_PATH"] || "",
    Module = module.constructor,
    packageRoots;

export function isPackageURI(uri) {

    return PACKAGE_URI.test(uri);
}

export function locatePackage(uri, base) {
    
    var name = uri.replace(PACKAGE_URI, ""),
        path;
    
    if (name === uri)
        throw new Error("Not a package URI");
    
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
