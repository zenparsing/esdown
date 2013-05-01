import "npm:fs" as FS;

import Promise from "Promise.js";

// Wraps a standard Node async function with a promise
// generating function
function wrap(obj, name) {

	return function() {
	
		var a = [].slice.call(arguments, 0),
			promise = new Promise;
		
		a.push((err, data) => {
		
			if (err) promise.reject(err);
			else promise.resolve(data);
		});
		
		if (name) obj[name].apply(obj, a);
    	else obj.apply(null, a);
		
		return promise.future;
	};
}

export var 
    exists = wrap(FS.exists),
    readFile = wrap(FS.readFile),
    close = wrap(FS.close),
    open = wrap(FS.open),
    read = wrap(FS.read),
    write = wrap(FS.write),
    rename = wrap(FS.rename),
    truncate = wrap(FS.truncate),
    rmdir = wrap(FS.rmdir),
    fsync = wrap(FS.fsync),
    mkdir = wrap(FS.mkdir),
    sendfile = wrap(FS.sendfile),
    readdir = wrap(FS.readdir),
    fstat = wrap(FS.fstat),
    lstat = wrap(FS.lstat),
    stat = wrap(FS.stat),
    readlink = wrap(FS.readlink),
    symlink = wrap(FS.symlink),
    link = wrap(FS.link),
    unlink = wrap(FS.unlink),
    fchmod = wrap(FS.fchmod),
    lchmod = wrap(FS.lchmod),
    chmod = wrap(FS.chmod),
    lchown = wrap(FS.lchown),
    fchown = wrap(FS.fchown),
    chown = wrap(FS.chown),
    utimes = wrap(FS.utimes),
    futimes = wrap(FS.futimes),
    writeFile = wrap(FS.writeFile),
    appendFile = wrap(FS.appendFile),
    realpath = wrap(FS.realpath)
;
