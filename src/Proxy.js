module HTTP from "node:http";
module URL from "node:url";
module AFS from "AsyncFS.js";

import { ModuleInstaller } from "ModuleInstaller.js";
import { translate, isWrapped } from "Translator.js";
import { Promise } from "Promise.js";


export class Proxy {

    constructor(options) {
    
        options || (options = {});
    
        this.port = options.port || DEFAULT_PORT;
        this.hostname = options.hostname || null;
        this.server = HTTP.createServer((request, response) => this.onRequest(request, response));
        this.installer = new ModuleInstaller();
        this.active = false;
    }
    
    start(port, hostname) {
    
        if (this.active)
            throw new Error("Server is already listening");
        
        if (port)
            this.port = port;
        
        if (hostname)
            this.hostname = hostname;
        
        var promise = new Promise(resolver => {
        
            this.server.listen(this.port, this.hostname, ok => resolver.resolve(null));
            this.active = true;
        });
        
        return promise;
    }
    
    stop() {
    
        if (!this.active)
            throw new Error("Server is not currently listening.");
        
        return new Promise(resolver => {
        
            this.active = false;
            this.server.close(ok => resolver.resolve(null));
        });
    }
    
    onRequest(request, response) {
    
        if (request.method !== "GET" && request.method !== "HEAD")
            return this.error(405, response);
        
        var installer = this.installer,
            query = URL.parse(request.url, true).query,
            target = query.url,
            path;
        
        if (!target)
            return this.error(405, response);
        
        path = installer.localPath(target);
        
        AFS.exists(path).then(exists => {
        
            return exists ? null : installer.install(target);
            
        }).then(val => {
        
            return AFS.readFile(path, "utf8").then(source => {
        
                if (!isWrapped(source)) {
            
                    // TODO:  A better way to report errors?
                    try { source = translate(source); } 
                    catch (x) { source += "\n\n// " + x.message; }
                }
            
                response.writeHead(200, { "Content-Type": "text/javascript; charset=UTF-8" });
                response.end(source, "utf8");
        
            });
            
        }).catch(err => {
        
            this.error(500, response);
        });
    }
    
    error(code, response) {
    
        response.writeHead(code, { "Content-Type": "text/plain" });
        response.write(HTTP.STATUS_CODES[code] + "\n")
        response.end();
    }
}