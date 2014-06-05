module AsyncFS from "AsyncFS.js";

import { parse } from "package:esparse";
import { Dictionary, NameSet } from "Dictionary.js";
import { locatePackage } from "PackageLocator.js";

var Path = require("path");

var EXTERNAL_URL = /[a-z][a-z]+:/i;

export function analyze(ast, resolvePath) {

    if (typeof ast === "string")
        ast = parse(ast, { module: true });
    
    var edges = new Dictionary,
        identifiers = new NameSet;
    
    visit(ast, true);
    
    return { edges, identifiers };
    
    function visit(node, topLevel) {
        
        switch (node.type) {
        
            case "ExportsList":
            case "ImportDeclaration":
            case "ImportDefaultDeclaration":
            case "ModuleImport":
                
                addEdge(node.from);
                break;
            
            case "Identifier":
            
                if (node.context === "declaration" && topLevel)
                    identifiers.add(node.value);
                
                break;
            
            // TODO: Add generator, block (let, const, function in block)?
            case "ClassExpression":
            case "ClassBody":
            case "FunctionExpression":
            case "FormalParameter":
            case "FunctionBody":
            
                topLevel = false;
                break;
                
        }
        
        node.children().forEach(child => visit(child, topLevel));
    }
    
    function addEdge(spec) {
    
        if (!spec || spec.type !== "StringLiteral")
            return;
        
        var path = resolvePath(spec.value);
        
        if (path) {
        
            if (edges.has(path))
                edges.get(path).push(spec);
            else
                edges.set(path, [spec]);
        }
    }
    
}

function identFromPath(path) {

    // TODO: Make this unicode friendly.  Can we export some
    // functions or patterns from the parser to help?
    
    var name = Path.basename(path);
    
    // Remove the file extension
    name = name.replace(/\..*$/i, "");
    
    // Replace dashes
    name = name.replace(/-(\S?)/g, (m, m1) => m1 ? m1.toUpperCase() : "");
    
    // Replace any other non-ident chars with _
    name = name.replace(/[^a-z0-9$_]+/ig, "_");
    
    // Make sure the name doesn't start with a number
    name = name.replace(/^[0-9]+/, "");
    
    return name;
}

export function createBundle(rootPath) {
    
    rootPath = Path.resolve(rootPath);
    
    var nodes = new Dictionary,
        nodeNames = new NameSet,
        sort = [],
        pending = 0,
        resolver,
        allFetched;
    
    allFetched = new Promise((resolve, reject) => resolver = { resolve, reject });
    
    function visit(path) {

        if (nodes.has(path))
            return;
        
        nodes.set(path, null);
        pending += 1;
        
        var dir = Path.dirname(path);
        
        AsyncFS.readFile(path, { encoding: "utf8" }).then(code => {
    
            var node = analyze(code, p => {
            
                try { p = locatePackage(p, dir) }
                catch (x) {}
                
                return EXTERNAL_URL.test(p) ? null : Path.resolve(dir, p);
            });
            
            nodes.set(path, node);
            node.path = path;
            node.source = code;
            node.visited = false;
            node.inEdges = new NameSet;
            node.name = "";
            
            node.edges.keys().forEach(visit);
            
            pending -= 1;
            
            if (pending === 0)
                resolver.resolve(null);
        
        }).then(null, err => {
        
            if (err instanceof SyntaxError && "sourceText" in err)
                err.filename = path;
            
            resolver.reject(err);
            
        });
    }
    
    function traverse(path, from) {
    
        var node = nodes.get(path);
        
        if (from)
            node.inEdges.add(from);
        
        if (node.visited)
            return;
        
        node.visited = true;
        node.edges.forEach((val, key) => traverse(key, path));   
        sort.push(path);
    }
    
    function assignNames() {
    
        nodes.forEach(node => {
        
            var name = identFromPath(node.path),
                identifiers = new NameSet;
            
            // Build list of top-level identifiers in referencing modules
            node.inEdges.forEach(key => {
            
                nodes.get(key).identifiers.forEach(k => identifiers.add(k));
            });
        
            // Resolve naming conflicts IMPROVE
            while (identifiers.has(name) || nodeNames.has(name))
                name += "_";
        
            nodeNames.add(node.name = name);
        });
    }
    
    function getModifiedSource(node) {
    
        var offset = 0,
            source = "",
            ranges = [];
        
        // Build list of ranges to replace
        node.edges.forEach((val, key) => {
        
            var ref = nodes.get(key);
            
            val.forEach(range => {
            
                ranges.push({ start: range.start, end: range.end, name: ref.name });
            });
        });
        
        // Sort the list of ranges in order of appearance
        ranges.sort((a, b) => a.start - b.start);
        
        // Build modified source with replace subranges
        ranges.forEach(range => {
        
            source += node.source.slice(offset, range.start);
            source += range.name;
            
            offset = range.end;
        });
        
        source += node.source.slice(offset);
        
        return source;
    }
    
    visit(rootPath);
    
    return allFetched.then($=> {
    
        traverse(rootPath, null);
        assignNames();
        
        var out = "";
        
        sort.forEach(path => {
        
            var node = nodes.get(path);
            
            out += "module " + node.name + " {\n\n";
            out += getModifiedSource(node);
            out += "\n\n}\n\n";
        });
        
        out += "export * from " + nodes.get(rootPath).name + ";\n";
        
        return out;
    });
}
