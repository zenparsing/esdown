var HTTP = require("http"),
    FS = require("fs"),
    Path = require("path"),
    URL = require("url");
    
var Translator = require("./Translator.js"),
    mimeTypes = require("./ServerMime.js").mimeTypes;

var DEFAULT_PORT = 8080,
    DEFAULT_ROOT = ".",
    JS_FILE = /\.js$/i;
    
function listen(options) {

    options || (options = {});
    
    var root = Path.resolve(options.root || DEFAULT_ROOT),
        port = options.port || DEFAULT_PORT,
        server = HTTP.createServer(respond);
    
    server.listen(port);
    
    return { port: port, root: root };
    
    function respond(request, response) {
    
        if (request.method !== "GET" && request.method !== "HEAD")
            return error(405, request, response);
        
        var path = URL.parse(request.url).pathname;
        
        path = Path.join(root, path);
        
        if (path.indexOf(root) !== 0)
            return error(403);
        
        FS.stat(path, function(err, stat) {
        
            if (stat && stat.isDirectory() && path.slice(-1) === "/")
                return streamDefault();
            
            if (stat && stat.isFile())
                return JS_FILE.test(path) ? streamJS() : streamFile(stat);
            
            return error(404);
        });
        
        function error(code) {
        
            response.writeHead(code, { "Content-Type": "text/plain" });
            response.write(HTTP.STATUS_CODES[code] + "\n")
            response.end();
        }
        
        function streamDefault() {
        
            var files = [ "index.html", "index.htm", "default.html", "default.htm" ];
            
            function next() {
            
                if (files.length === 0)
                    return error(404);
                
                var file = files.shift(),
                    search = Path.join(path, file);
                
                FS.stat(search, function(err, stat) {
                
                    if (!stat || !stat.isFile())
                        return next();
                    
                    path = search;
                    streamFile(stat);
                });
            }
            
            next();
        }
        
        function streamJS() {
        
            FS.readFile(path, "utf8", function(err, source) {
            
                if (err)
                    return error(500, err);
                
                if (!Translator.isWrapped(source)) {
                    
                    try { source = Translator.translate(source); } 
                    catch (x) { source += "\n\n// " + x.message; }
                }
                
                response.writeHead(200, { "Content-Type": "text/javascript; charset=UTF-8" });
                response.end(source, "utf8");
            });
        }
        
        function streamFile(stat) {
            
            var ext = Path.extname(path).slice(1).toLowerCase();
                
            var headers = { 
        
                // TODO: we should only append charset to certain types
                "Content-Type": (mimeTypes[ext] || mimeTypes["*"]) + "; charset=UTF-8",
                "Content-Length": stat.size
            };
                
            var stream = FS.createReadStream(path, { 
            
                flags: "r", 
                mode: 438
            });
            
            stream.on("error", function(err) {
            
                error(500, err);
            });
            
            stream.on("data", function(data) {
            
                if (headers) {
                
                    response.writeHead(200, headers);
                    headers = null;
                }
            });
            
            stream.pipe(response);
        }
    }
}

exports.listen = listen;