export function parse(argv, params) {

    var pos = Object.keys(params),
        values = {},
        shorts = {},
        required = [],
        param,
        value,
        name,
        i,
        a;
    
    // Create short-to-long mapping
    pos.forEach(name => {
    
        var p = params[name];
        
        if (p.short)
            shorts[p.short] = name;
        
        if (p.required)
            required.push(name);
    });
    
    // For each command line arg...
    for (i = 0; i < argv.length; ++i) {
    
        a = argv[i];
        param = null;
        value = null;
        name = "";
        
        if (a[0] === "-") {
        
            if (a.slice(0, 2) === "--") {
            
                // Long named parameter
                param = params[name = a.slice(2)];
            
            } else {
            
                // Short named parameter
                param = params[name = shorts[a.slice(1)]];
            }
            
            // Verify parameter exists
            if (!param)
                throw new Error("Invalid command line option: " + a);
            
            if (param.flag) {
            
                value = true;
            
            } else {
            
                // Get parameter value
                value = argv[++i] || "";
                
                if (typeof value !== "string" || value[0] === "-")
                    throw new Error("No value provided for option " + a);
            }
            
        } else {
        
            // Positional parameter
            do { param = params[name = pos.shift()]; } 
            while (param && !param.positional);
            
            value = a;
        }
        
        if (param)
            values[name] = value;
    }
    
    required.forEach(name => {
    
        if (values[name] === undefined)
            throw new Error("Missing required option: --" + name);
    });
    
    return values;
}

function fail(msg) {

    console.log(msg);
    process.exit(1);
}

export function runCommand(command, options) {
    
    options || (options = {});
    
    var argv = options.args || process.argv.slice(2),
        error = options.error || command.error || fail,
        params = {};
    
    try {
    
        params = parse(argv, command.params || {});
        return command.execute(params);
    
    } catch (err) {
    
        return error(err, params);
    }
}

export function run(config) {

    var error = config.error || fail,
        argv = process.argv.slice(2),
        action = argv[0] || "*",
        command;
    
    if (!action)
        return error("No action specified.", {});
    
    command = config[action];
    
    if (!command) {
    
        if (config["*"]) {
        
            argv.unshift(command);
            command = config["*"];

        } else {
        
            return error("Invalid command: " + action, {});
        }
    }
    
    return runCommand(command, {
    
        args: argv.slice(1),
        error: config.error 
    });
}

/*

Example: 

parse(process.argv.slice(2), {

    "verbose": {
    
        short: "v",
        flag: true
    },
    
    "input": {
    
        short: "i",
        positional: true,
        required: true
    },
    
    "output": {
    
        short: "o",
        positional: true
    },
    
    "recursive": {
    
        short: "r",
        flag: false
    }
});

*/
