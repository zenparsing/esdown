export let Runtime = {};

Runtime.API = 

`var VERSION = '1.2.2';

var GLOBAL = (function() {
  try { return global.global; } catch (x) {}
  try { return self.self; } catch (x) {}
  return null;
})();

var ownNames = Object.getOwnPropertyNames;
var hasOwn = Object.prototype.hasOwnProperty;
var ownSymbols = Object.getOwnPropertySymbols;
var getDesc = Object.getOwnPropertyDescriptor;
var defineProp = Object.defineProperty;

function toObject(val) {
  if (val == null) // null or undefined
    throw new TypeError(val + ' is not an object');

  return Object(val);
}

// Iterates over the descriptors for each own property of an object
function forEachDesc(obj, fn) {
  ownNames(obj).forEach(function(name) { return fn(name, getDesc(obj, name)); });
  if (ownSymbols) ownSymbols(obj).forEach(function(name) { return fn(name, getDesc(obj, name)); });
}

// Installs a property into an object, merging 'get' and 'set' functions
function mergeProp(target, name, desc, enumerable) {
  if (desc.get || desc.set) {
    var d$0 = { configurable: true };
    if (desc.get) d$0.get = desc.get;
    if (desc.set) d$0.set = desc.set;
    desc = d$0;
  }

  desc.enumerable = enumerable;
  defineProp(target, name, desc);
}

// Installs properties on an object, merging 'get' and 'set' functions
function mergeProps(target, source, enumerable) {
  forEachDesc(source, function(name, desc) { return mergeProp(target, name, desc, enumerable); });
}

// Builds a class
function makeClass(def) {
  var parent = Object.prototype;
  var proto = Object.create(parent);
  var statics = {};

  def(
    function(obj) { return mergeProps(proto, obj, false); },
    function(obj) { return mergeProps(statics, obj, false); }
  );

  var ctor = proto.constructor;
  ctor.prototype = proto;

  // Set class 'static' methods
  forEachDesc(statics, function(name, desc) { return defineProp(ctor, name, desc); });

  return ctor;
}

// Support for computed property names and spread properties
function obj(target) {
  return {
    obj: target,
    p: function(props) {
      mergeProps(target, props, true);
      return this;
    },
    c: function(name, props) {
      var desc = getDesc(props, '_');
      mergeProp(target, name, getDesc(props, '_'), true);
      return this;
    },
    s: function(props) {
      for (var name$0 in props._) {
        hasOwn.call(props._, name$0) && defineProp(target, name$0, {
          enumerable: true,
          configurable: true,
          writable: true,
          value: props._[name$0],
        });
      }
      return this;
    },
  };
}

// Support for async functions
function asyncFunction(iter) {
  return new Promise(function(resolve, reject) {
    resume('next', undefined);
    function resume(type, value) {
      try {
        var result$0 = iter[type](value);
        if (result$0.done) {
          resolve(result$0.value);
        } else {
          Promise.resolve(result$0.value).then(
            function(x) { return resume('next', x); },
            function(x) { return resume('throw', x); });
        }
      } catch (x) {
        reject(x);
      }
    }
  });
}

// Support for for-await
function asyncIterator(obj) {
  var method = obj[Symbol.asyncIterator] || obj[Symbol.iterator];
  return method.call(obj);
}

// Support for async generators
function asyncGenerator(iter) {
  var front = null;
  var back = null;

  var aIter = {
    next: function(val) { return send('next', val); },
    throw: function(val) { return send('throw', val); },
    return: function(val) { return send('return', val); },
  };

  aIter[Symbol.asyncIterator] = function() { return this; };

  return aIter;

  function send(type, value) {
    return new Promise(function(resolve, reject) {
      var x = { type: type, value: value, resolve: resolve, reject: reject, next: null };
      if (back) {
        // If list is not empty, then push onto the end
        back = back.next = x;
      } else {
        // Create new list and resume generator
        front = back = x;
        resume(type, value);
      }
    });
  }

  function settle(type, value) {
    switch (type) {
      case 'return':
        front.resolve({ value: value, done: true });
        break;
      case 'throw':
        front.reject(value);
        break;
      default:
        front.resolve({ value: value, done: false });
        break;
    }

    front = front.next;

    if (front) resume(front.type, front.value);
    else back = null;
  }

  function resume(type, value) {
    try {
      var result$1 = iter[type](value);
      value = result$1.value;

      if (value && typeof value === 'object' && '_esdown_await' in value) {
        if (result$1.done)
          throw new Error('Invalid async generator return');

        Promise.resolve(value._esdown_await).then(
          function(x) { return resume('next', x); },
          function(x) { return resume('throw', x); });
      } else {
        settle(result$1.done ? 'return' : 'normal', result$1.value);
      }
    } catch (x) {
      settle('throw', x);
    }
  }
}

// Support for spread operations
function spread(initial) {
  return {
    a: initial || [],
    // Add items
    s: function() {
      for (var i$0 = 0; i$0 < arguments.length; ++i$0)
        this.a.push(arguments[i$0]);
      return this;
    },
    // Add the contents of iterables
    i: function(list) {
      if (Array.isArray(list)) {
        this.a.push.apply(this.a, list);
      } else {
        for (var __$0 = (list)[Symbol.iterator](), __$1; __$1 = __$0.next(), !__$1.done;)
          { var item$0 = __$1.value; this.a.push(item$0); }
      }
      return this;
    },
  };
}

// Support for object destructuring
function objd(obj) {
  return toObject(obj);
}

// Support for array destructuring
function arrayd(obj) {
  if (Array.isArray(obj)) {
    return {
      at: function(skip, pos) { return obj[pos]; },
      rest: function(skip, pos) { return obj.slice(pos); },
    };
  }

  var iter = toObject(obj)[Symbol.iterator]();

  return {
    at: function(skip) {
      var r;
      while (skip--) r = iter.next();
      return r.value;
    },
    rest: function(skip) {
      var a = [];
      var r;
      while (--skip) r = iter.next();
      while (r = iter.next(), !r.done) a.push(r.value);
      return a;
    },
  };
}










exports.obj = obj;
exports.spread = spread;
exports.objd = objd;
exports.arrayd = arrayd;
exports.class = makeClass;
exports.version = VERSION;
exports.global = GLOBAL;
exports.async = asyncFunction;
exports.asyncGen = asyncGenerator;
exports.asyncIter = asyncIterator;
`;

