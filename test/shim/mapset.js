var mapData = [

    ["foo", "bar"],
    ["constructor", "zootsuit"],
    [1, {}],
    [NaN, "hello"],
    [Infinity, "world"]  
];

var missingKey = "missing";

function makeTests(factory) {

    var fresh = factory.fresh,
        empty = factory.empty,
        data = factory.data;

    return {

        "add" (test) {
    
            var set = empty();
            
            if (!set.add) {
            
                test._("no method").assert(true);
                return;
            }
        
            test._("inserts key into the set");
            data.forEach(([key, val]) => set.add(key, val));
            data.forEach(([key, val]) => test.assert(set.has(key)));
            
        },
    
        "clear" (test) {
    
            test._("all keys are removed after a clear");
        
            var map = fresh();
            map.clear();
            data.forEach(([key]) => test.assert(!map.has(key)));
        },
    
        "delete" (test) {
    
            test._("key is not found after delete");
        
            var map = fresh();
        
            data.forEach(([key]) => {
        
                var had = map.delete(key);
                test.assert(!map.has(key));
                test.assert(had);
            });
        
            test._("returns false if the key is not found");
            test.assert(!map.delete(missingKey));
        },
    
        "forEach" (test) {
    
            var map, out;
        
            test._("correctly iterates over keys");
        
            map = fresh(), out = [];
            map.forEach((val, key) => out.push([key, val]));
            test.equals(out, data);
        
            test._("deleting current item does not alter iteration");
        
            map = fresh(), out = [];
    
            map.forEach((val, key) => { 
    
                out.push([key, val]);
                map.delete(key);
            });
    
            test.equals(out, data);
        
            test._("deleting next item does not stop iteration");
        
            map = fresh(), out = [];
    
            map.forEach((val, key) => {
        
                if (out.length === 0)
                    map.delete(data[1][0]);
        
                out.push([key, val]);
            });
    
            test.equals(out, data.slice(0, 1).concat(data.slice(2)));
 
            test._("clearing stops iteration");
        
            map = fresh(), out = [];
    
            map.forEach((val, key) => {
    
                if (out.length === 0)
                    map.clear();
    
                out.push([key, val]);
            });
    
            test.equals(out, data.slice(0, 1));
        
            test._("added item is iterated over");
        
            map = fresh(), out = [];
        
            map.forEach((val, key) => {
        
                if (out.length === 0) {
                
                    if (map.set) map.set(missingKey, missingKey);
                    else map.add(missingKey);
                }
            
                out.push([key, val]);
            });
        
            test.equals(out, data.concat([ [missingKey, missingKey] ]));
        },
    
        "get" (test) {
    
            var map = fresh();
            
            if (!map.get) {
            
                test._("no method").assert(true);
                return;
            }
        
            test._("returns the value stored with the key");
            data.forEach(([key, val]) => test.equals(map.get(key), val));
        
            test._("returns undefined if the key is not found");
            test.equals(map.get(missingKey), void 0);
        },
    
        "has" (test) {
    
            var map = fresh();
            test._("returns true if the map contains the key");
            data.forEach(([key, val]) => test.assert(map.has(key)));
        
            test._("returns false if the map doesn't contain the key");
            test.assert(!map.has(missingKey));
        },
    
        "set" (test) {
    
            var map = empty();
            
            if (!map.set) {
            
                test._("no method").assert(true);
                return;
            }
        
            test._("inserts key into the map");
            data.forEach(([key, val]) => map.set(key, val));
            data.forEach(([key, val]) => test.equals(map.get(key), val));
        },
    
        "size" (test) {
    
            var map = fresh();
        
            test._("returns the number of elements in the map");
            test.equals(map.size, data.length);
            map.delete(data[0][0]);
            test.equals(map.size, data.length - 1);
            map.clear();
            test.equals(map.size, 0);
        },
    
        "iterators" (test) {
    
            var key, val, out;
        
            out = [];
        
            for ([key, val] of fresh())
                out.push([key, val]);
        
            test._("Symbol.iterator").equals(out, data);
        
            out = [];
        
            for (key of fresh().keys())
                out.push(key);
        
            test._("keys").equals(out, data.map(item => item[0]));
        
            out = [];
        
            for (val of fresh().values())
                out.push(val);
        
            test._("values").equals(out, data.map(item => item[1]));
        
            out = [];
        
            for ([key, val] of fresh().entries())
                out.push([key, val]);
        
            test._("entries").equals(out, data);
        
            test._("deleting current item does not alter iteration");
        
            var map, out;
        
            map = fresh(), out = [];
    
            for ([key, val] of map) {
        
                out.push([ key, val ]);
                map.delete(key);
            }
    
            test.equals(out, data);
        
            test._("deleting next item does not stop iteration");
        
            map = fresh(), out = [];
        
            for ([key, val] of map) {
        
                if (out.length === 0)
                    map.delete(data[1][0]);
        
                out.push([key, val]);
            }
    
            test.equals(out, data.slice(0, 1).concat(data.slice(2)));
        
            test._("clearing stops iteration");
        
            map = fresh(), out = [];
    
            for ([key, val] of map) {
    
                if (out.length === 0)
                    map.clear();
    
                out.push([key, val]);
            }
    
            test.equals(out, data.slice(0, 1));
        
            test._("added item is iterated over");
        
            map = fresh(), out = [];
        
            for ([key, val] of map) {
        
                if (out.length === 0) {
                
                    if (map.set) map.set(missingKey, missingKey);
                    else map.add(missingKey);
                }
            
                out.push([key, val]);
            }
        
            test.equals(out, data.concat([ [missingKey, missingKey] ]));
        }
        
    };
}

export var tests = {

    "Map": makeTests({ 
    
        data: mapData,
        
        empty() { return new Map },
    
        fresh() {
        
            var map = new Map;
            mapData.forEach(([key, val]) => map.set(key, val));
            return map;
        }
        
    }),
    
    "Set": makeTests({
     
        data: mapData.map(item => [item[0], item[0]]),
        
        empty() { return new Set },
    
        fresh() {
        
            var set = new Set;
            mapData.forEach(([key, val]) => set.add(key));
            return set;
        }
    })
};
