module FS = "fs";
module HTTP = "http";
module Path = "path";
module URL = "url";
module FFS = "FutureFS.js";

import Promise from "Promise.js";
import { translate, isWrapped } from "Translator.js";
import mimeTypes from "ServerMime.js";

var DEFAULT_PORT = 80,
    DEFAULT_ROOT = ".",
    JS_FILE = /\.js$/i;

export class Server {

    constructor(options) {
    
        options || (options = {});
    
        this.root = Path.resolve(options.root || DEFAULT_ROOT);
        this.port = options.port || DEFAULT_PORT;
        this.hostname = options.hostname || null;
        this.server = HTTP.createServer((request, response) => this.onRequest(request, response));
        this.active = false;
    }
    
    start(port, hostname) {
    
        if (this.active)
            throw new Error("Server is already listening");
        
        if (port)
            this.port = port;
        
        if (hostname)
            this.hostname = hostname;
        
        var promise = new Promise;
        this.server.listen(this.port, this.hostname, promise.callback);
        
        this.active = true;
        
        return promise.future;
    }
    
    stop() {
    
        var promise = new Promise;
        
        if (this.active) {
        
            this.active = false;
            this.server.close(ok => promise.resolve(null));
        
        } else {
        
            promise.resolve(null);
        }
        
        return promise.future;
    }
    
    onRequest(request, response) {
    
        if (request.method !== "GET" && request.method !== "HEAD")
            return this.error(405, response);
        
        var path = URL.parse(request.url).pathname;
        
        path = Path.join(this.root, path);
        
        if (path.indexOf(this.root) !== 0)
            return this.error(403, response);
        
        FFS.stat(path).then(stat => {
        
            if (stat.isDirectory())
                return this.streamDefault(path, response);
            
            if (stat.isFile()) {
            
                return JS_FILE.test(path) ? 
                    this.streamJS(path, response) : 
                    this.streamFile(path, stat.size, response);
            }
            
            return this.error(404, response);
            
        }, err => {
        
            return this.error(404, response);
            
        });
    }
    
    error(code, response) {
    
        response.writeHead(code, { "Content-Type": "text/plain" });
        response.write(HTTP.STATUS_CODES[code] + "\n")
        response.end();
    }
    
    streamDefault(path, response) {
    
        var files = [ "index.html", "index.htm", "default.html", "default.htm" ];
        
        var next = () => {
        
            if (files.length === 0)
                return this.error(404, response);
            
            var file = files.shift(),
                search = Path.join(path, file);
            
            FFS.stat(search).then(stat => {
            
                if (!stat.isFile())
                    return next();
                
                path = search;
                this.streamFile(path, stat.size, response);
                
            }, err => {
            
                return next();
            });
        };
        
        next();
    }
    
    streamJS(path, response) {
        
        FFS.readFile(path, "utf8").then(source => {
        
            if (!isWrapped(source)) {
            
                // TODO:  A better way to report errors?
                try { source = translate(source); } 
                catch (x) { source += "\n\n// " + x.message; }
            }
            
            response.writeHead(200, { "Content-Type": "text/javascript; charset=UTF-8" });
            response.end(source, "utf8");
        
        }, err => {
        
            this.error(500, err);
        });
    }
    
    streamFile(path, size, response) {
            
        var ext = Path.extname(path).slice(1).toLowerCase();
            
        var headers = { 
    
            // TODO: we should only append charset to certain types
            "Content-Type": (mimeTypes[ext] || mimeTypes["*"]) + "; charset=UTF-8",
            "Content-Length": size
        };
            
        var stream = FS.createReadStream(path, { 
        
            flags: "r", 
            mode: 438
        });
        
        stream.on("error", err => {
        
            this.error(500, response);
        });
        
        stream.on("data", data => {
        
            if (headers) {
            
                response.writeHead(200, headers);
                headers = null;
            }
        });
        
        stream.pipe(response);
    }
}