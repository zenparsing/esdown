var Path = require("path"),
    FS = require("fs");

var PACKAGE_URI = /^package:/i,
    JS_PACKAGE_ROOT = process.env["JS_PACKAGE_ROOT"] || "",
    packageRoots;

export function isPackageURI(uri) {

    return PACKAGE_URI.test(uri);
}

export function locatePackage(uri) {
    
    var name = uri.replace(PACKAGE_URI, ""),
        path;
    
    if (name === uri)
        throw new Error("Not a package URI.");
    
    if (!packageRoots)
        packageRoots = JS_PACKAGE_ROOT.split(/;/g).map(v => v.trim());
    
    var found = packageRoots.some(root => {
    
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