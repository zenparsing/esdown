var HOP = {}.hasOwnProperty;

function copyMethods(to, from) {

    var keys = Object.keys(from),
        desc,
        k,
        i;
    
    for (i = 0; i < keys.length; ++i) {
    
        k = keys[i];
        desc = Object.getOwnPropertyDescriptor(from, k);
        
        Object.defineProperty(to, k, desc);
    }
    
    return to;
}

export function Class(base, def) {

    function constructor() { 
    
        if (parent && parent.constructor)
            parent.constructor.apply(this, arguments);
    }
    
	var parent = null,
	    proto,
	    props;
	
	if (base) {
	
        if (typeof base === "function") {
        
            parent = base.prototype;
            
        } else {
        
            parent = base;
            base = null;
        }
	}
	
	// Generate the method collection, closing over "super"
	props = def(parent);
	
	// Create prototype object
	proto = copyMethods(Object.create(parent), props);
	
	// Get constructor method
	if (HOP.call(props, "constructor")) constructor = props.constructor;
	else proto.constructor = constructor;
	
	// Set constructor's prototype
	constructor.prototype = proto;
	
	// TODO:  Class-side inheritance?
	
	return constructor;
}

