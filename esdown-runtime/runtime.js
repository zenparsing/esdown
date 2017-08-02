const VERSION = '1.2.1';

const GLOBAL = (function() {
  try { return global.global; } catch (x) {}
  try { return self.self; } catch (x) {}
  return null;
})();

const ownNames = Object.getOwnPropertyNames;
const hasOwn = Object.prototype.hasOwnProperty;
const ownSymbols = Object.getOwnPropertySymbols;
const getDesc = Object.getOwnPropertyDescriptor;
const defineProp = Object.defineProperty;

function toObject(val) {
  if (val == null) // null or undefined
    throw new TypeError(val + ' is not an object');

  return Object(val);
}

// Iterates over the descriptors for each own property of an object
function forEachDesc(obj, fn) {
  ownNames(obj).forEach(name => fn(name, getDesc(obj, name)));
  if (ownSymbols) ownSymbols(obj).forEach(name => fn(name, getDesc(obj, name)));
}

// Installs a property into an object, merging 'get' and 'set' functions
function mergeProp(target, name, desc, enumerable) {
  if (desc.get || desc.set) {
    let d = { configurable: true };
    if (desc.get) d.get = desc.get;
    if (desc.set) d.set = desc.set;
    desc = d;
  }

  desc.enumerable = enumerable;
  defineProp(target, name, desc);
}

// Installs properties on an object, merging 'get' and 'set' functions
function mergeProps(target, source, enumerable) {
  forEachDesc(source, (name, desc) => mergeProp(target, name, desc, enumerable));
}

// Builds a class
function makeClass(def) {
  let parent = Object.prototype;
  let proto = Object.create(parent);
  let statics = {};

  def(
    obj => mergeProps(proto, obj, false),
    obj => mergeProps(statics, obj, false)
  );

  let ctor = proto.constructor;
  ctor.prototype = proto;

  // Set class 'static' methods
  forEachDesc(statics, (name, desc) => defineProp(ctor, name, desc));

  return ctor;
}

// Support for computed property names and spread properties
export function obj(target) {
  return {
    obj: target,
    p(props) {
      mergeProps(target, props, true);
      return this;
    },
    c(name, props) {
      let desc = getDesc(props, '_');
      mergeProp(target, name, getDesc(props, '_'), true);
      return this;
    },
    s(props) {
      for (let name in props._) {
        hasOwn.call(props._, name) && defineProp(target, name, {
          enumerable: true,
          configurable: true,
          writable: true,
          value: props._[name],
        });
      }
      return this;
    },
  };
}

// Support for async functions
function asyncFunction(iter) {
  return new Promise((resolve, reject) => {
    resume('next', undefined);
    function resume(type, value) {
      try {
        let result = iter[type](value);
        if (result.done) {
          resolve(result.value);
        } else {
          Promise.resolve(result.value).then(
            x => resume('next', x),
            x => resume('throw', x));
        }
      } catch (x) {
        reject(x);
      }
    }
  });
}

// Support for for-await
function asyncIterator(obj) {
  let method = obj[Symbol.asyncIterator] || obj[Symbol.iterator];
  return method.call(obj);
}

// Support for async generators
function asyncGenerator(iter) {
  let front = null;
  let back = null;

  let aIter = {
    next(val) { return send('next', val); },
    throw(val) { return send('throw', val); },
    return(val) { return send('return', val); },
  };

  aIter[Symbol.asyncIterator] = function() { return this; };

  return aIter;

  function send(type, value) {
    return new Promise((resolve, reject) => {
      let x = { type, value, resolve, reject, next: null };
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
        front.resolve({ value, done: true });
        break;
      case 'throw':
        front.reject(value);
        break;
      default:
        front.resolve({ value, done: false });
        break;
    }

    front = front.next;

    if (front) resume(front.type, front.value);
    else back = null;
  }

  function resume(type, value) {
    try {
      let result = iter[type](value);
      value = result.value;

      if (value && typeof value === 'object' && '_esdown_await' in value) {
        if (result.done)
          throw new Error('Invalid async generator return');

        Promise.resolve(value._esdown_await).then(
          x => resume('next', x),
          x => resume('throw', x));
      } else {
        settle(result.done ? 'return' : 'normal', result.value);
      }
    } catch (x) {
      settle('throw', x);
    }
  }
}

// Support for spread operations
export function spread(initial) {
  return {
    a: initial || [],
    // Add items
    s() {
      for (let i = 0; i < arguments.length; ++i)
        this.a.push(arguments[i]);
      return this;
    },
    // Add the contents of iterables
    i(list) {
      if (Array.isArray(list)) {
        this.a.push.apply(this.a, list);
      } else {
        for (let item of list)
          this.a.push(item);
      }
      return this;
    },
  };
}

// Support for object destructuring
export function objd(obj) {
  return toObject(obj);
}

// Support for array destructuring
export function arrayd(obj) {
  if (Array.isArray(obj)) {
    return {
      at(skip, pos) { return obj[pos]; },
      rest(skip, pos) { return obj.slice(pos); },
    };
  }

  let iter = toObject(obj)[Symbol.iterator]();

  return {
    at(skip) {
      let r;
      while (skip--) r = iter.next();
      return r.value;
    },
    rest(skip) {
      let a = [];
      let r;
      while (--skip) r = iter.next();
      while (r = iter.next(), !r.done) a.push(r.value);
      return a;
    },
  };
}

export {
  makeClass as class,
  VERSION as version,
  GLOBAL as global,
  asyncFunction as async,
  asyncGenerator as asyncGen,
  asyncIterator as asyncIter,
};
