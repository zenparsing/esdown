var data = [

    ["foo", "bar"],
    ["constructor", "zootsuit"],
    [1, {}],
    [NaN, "hello"],
    [Infinity, "world"]
    
];


export var tests = {
    
    "construct" (test) {
    
        var map = new Map;
        
        data.forEach(([key, val]) => map.set(key, val));
        
        var i = 0;
        
        map.forEach((val, key) => { 
        
            test
            .equals(key, data[i][0])
            .equals(val, data[i][1])
            ;
            
            ++i;
        });
    }
};
