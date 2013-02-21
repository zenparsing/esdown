var HOP = {}.hasOwnProperty,
    STATIC = /^__static_/;

function copyMethods(to, from, classMethods) {

    var keys = Object.keys(from),
        isStatic,
        desc,
        k,
        i;
    
    for (i = 0; i < keys.length; ++i) {
    
        k = keys[i];
        desc = Object.getOwnPropertyDescriptor(from, k);
        
        if (STATIC.test(k) === classMethods)
            Object.defineProperty(to, classMethods ? k.replace(STATIC, "") : k, desc);
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
	proto = copyMethods(Object.create(parent), props, false);
	
	// Get constructor method
	if (HOP.call(props, "constructor")) constructor = props.constructor;
	else proto.constructor = constructor;
	
	// Set constructor's prototype
	constructor.prototype = proto;
	
	// "Inherit" class methods
	if (base) copyMethods(constructor, base, false);
	
	// Set class "static" methods
	copyMethods(constructor, props, true);
	
	return constructor;
}

