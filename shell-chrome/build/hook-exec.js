/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "../app-backend-core/lib/hook.js":
/*!***************************************!*\
  !*** ../app-backend-core/lib/hook.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, exports) => {

 // this script is injected into every page.

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.installHook = void 0;
/**
 * Install the hook on window, which is an event emitter.
 * Note because Chrome content scripts cannot directly modify the window object,
 * we are evaling this function by inserting a script tag. That's why we have
 * to inline the whole event emitter implementation here.
 *
 * @param {Window|global} target
 */

function installHook(target, isIframe = false) {
  const devtoolsVersion = '6.0';
  let listeners = {};

  function injectIframeHook(iframe) {
    if (iframe.__vdevtools__injected) {
      return;
    }

    try {
      iframe.__vdevtools__injected = true;

      const inject = () => {
        try {
          iframe.contentWindow.__VUE_DEVTOOLS_IFRAME__ = iframe;
          const script = iframe.contentDocument.createElement('script');
          script.textContent = `;(${installHook.toString()})(window, true)`;
          iframe.contentDocument.documentElement.appendChild(script);
          script.parentNode.removeChild(script);
        } catch (e) {// Ignore
        }
      };

      inject();
      iframe.addEventListener('load', () => inject());
    } catch (e) {// Ignore
    }
  }

  let iframeChecks = 0;

  function injectToIframes() {
    if (typeof window === 'undefined') {
      return;
    }

    const iframes = document.querySelectorAll('iframe:not([data-vue-devtools-ignore])');

    for (const iframe of iframes) {
      injectIframeHook(iframe);
    }
  }

  injectToIframes();
  const iframeTimer = setInterval(() => {
    injectToIframes();
    iframeChecks++;

    if (iframeChecks >= 5) {
      clearInterval(iframeTimer);
    }
  }, 1000);

  if (Object.prototype.hasOwnProperty.call(target, '__VUE_DEVTOOLS_GLOBAL_HOOK__')) {
    if (target.__VUE_DEVTOOLS_GLOBAL_HOOK__.devtoolsVersion !== devtoolsVersion) {
      console.error(`Another version of Vue Devtools seems to be installed. Please enable only one version at a time.`);
    }

    return;
  }

  let hook;

  if (isIframe) {
    const sendToParent = cb => {
      try {
        const hook = window.parent.__VUE_DEVTOOLS_GLOBAL_HOOK__;

        if (hook) {
          return cb(hook);
        } else {
          console.warn('[Vue Devtools] No hook in parent window');
        }
      } catch (e) {
        console.warn('[Vue Devtools] Failed to send message to parent window', e);
      }
    };

    hook = {
      devtoolsVersion,

      // eslint-disable-next-line accessor-pairs
      set Vue(value) {
        sendToParent(hook => {
          hook.Vue = value;
        });
      },

      // eslint-disable-next-line accessor-pairs
      set enabled(value) {
        sendToParent(hook => {
          hook.enabled = value;
        });
      },

      on(event, fn) {
        sendToParent(hook => hook.on(event, fn));
      },

      once(event, fn) {
        sendToParent(hook => hook.once(event, fn));
      },

      off(event, fn) {
        sendToParent(hook => hook.off(event, fn));
      },

      emit(event, ...args) {
        sendToParent(hook => hook.emit(event, ...args));
      },

      cleanupBuffer(matchArg) {
        var _a;

        return (_a = sendToParent(hook => hook.cleanupBuffer(matchArg))) !== null && _a !== void 0 ? _a : false;
      }

    };
  } else {
    hook = {
      devtoolsVersion,
      Vue: null,
      enabled: undefined,
      _buffer: [],
      _bufferMap: new Map(),
      _bufferToRemove: new Map(),
      store: null,
      initialState: null,
      storeModules: null,
      flushStoreModules: null,
      apps: [],

      _replayBuffer(event) {
        const buffer = this._buffer;
        this._buffer = [];

        this._bufferMap.clear();

        this._bufferToRemove.clear();

        for (let i = 0, l = buffer.length; i < l; i++) {
          const allArgs = buffer[i].slice(1);
          allArgs[0] === event // eslint-disable-next-line prefer-spread
          ? this.emit.apply(this, allArgs) : this._buffer.push(buffer[i]);
        }
      },

      on(event, fn) {
        const $event = `$${event}`;

        if (listeners[$event]) {
          listeners[$event].push(fn);
        } else {
          listeners[$event] = [fn];

          this._replayBuffer(event);
        }
      },

      once(event, fn) {
        const on = (...args) => {
          this.off(event, on);
          return fn.apply(this, args);
        };

        this.on(event, on);
      },

      off(event, fn) {
        event = `$${event}`;

        if (!arguments.length) {
          listeners = {};
        } else {
          const cbs = listeners[event];

          if (cbs) {
            if (!fn) {
              listeners[event] = null;
            } else {
              for (let i = 0, l = cbs.length; i < l; i++) {
                const cb = cbs[i];

                if (cb === fn || cb.fn === fn) {
                  cbs.splice(i, 1);
                  break;
                }
              }
            }
          }
        }
      },

      emit(event, ...args) {
        const $event = `$${event}`;
        let cbs = listeners[$event];

        if (cbs) {
          cbs = cbs.slice();

          for (let i = 0, l = cbs.length; i < l; i++) {
            try {
              const result = cbs[i].apply(this, args);

              if (typeof (result === null || result === void 0 ? void 0 : result.catch) === 'function') {
                result.catch(e => {
                  console.error(`[Hook] Error in async event handler for ${event} with args:`, args);
                  console.error(e);
                });
              }
            } catch (e) {
              console.error(`[Hook] Error in event handler for ${event} with args:`, args);
              console.error(e);
            }
          }
        } else {
          const buffered = [Date.now(), event, ...args];

          this._buffer.push(buffered);

          for (let i = 2; i < args.length; i++) {
            if (typeof args[i] === 'object' && args[i]) {
              // Save by component instance  (3rd, 4th or 5th arg)
              this._bufferMap.set(args[i], buffered);

              break;
            }
          }
        }
      },

      /**
       * Remove buffered events with any argument that is equal to the given value.
       * @param matchArg Given value to match.
       */
      cleanupBuffer(matchArg) {
        const inBuffer = this._bufferMap.has(matchArg);

        if (inBuffer) {
          // Mark event for removal
          this._bufferToRemove.set(this._bufferMap.get(matchArg), true);
        }

        return inBuffer;
      },

      _cleanupBuffer() {
        const now = Date.now(); // Clear buffer events that are older than 10 seconds or marked for removal

        this._buffer = this._buffer.filter(args => !this._bufferToRemove.has(args) && now - args[0] < 10000);

        this._bufferToRemove.clear();

        this._bufferMap.clear();
      }

    };
    setInterval(() => {
      hook._cleanupBuffer();
    }, 10000);
    hook.once('init', Vue => {
      hook.Vue = Vue;

      if (Vue) {
        Vue.prototype.$inspect = function () {
          const fn = target.__VUE_DEVTOOLS_INSPECT__;
          fn && fn(this);
        };
      }
    });
    hook.on('app:init', (app, version, types) => {
      const appRecord = {
        app,
        version,
        types
      };
      hook.apps.push(appRecord);
      hook.emit('app:add', appRecord);
    });
    hook.once('vuex:init', store => {
      hook.store = store;
      hook.initialState = clone(store.state);
      const origReplaceState = store.replaceState.bind(store);

      store.replaceState = state => {
        hook.initialState = clone(state);
        origReplaceState(state);
      }; // Dynamic modules


      let origRegister, origUnregister;

      if (store.registerModule) {
        hook.storeModules = [];
        origRegister = store.registerModule.bind(store);

        store.registerModule = (path, module, options) => {
          if (typeof path === 'string') {
            path = [path];
          }

          hook.storeModules.push({
            path,
            module,
            options
          });
          origRegister(path, module, options);

          if (true) {
            // eslint-disable-next-line no-console
            console.log('early register module', path, module, options);
          }
        };

        origUnregister = store.unregisterModule.bind(store);

        store.unregisterModule = path => {
          if (typeof path === 'string') {
            path = [path];
          }

          const key = path.join('/');
          const index = hook.storeModules.findIndex(m => m.path.join('/') === key);

          if (index !== -1) {
            hook.storeModules.splice(index, 1);
          }

          origUnregister(path);

          if (true) {
            // eslint-disable-next-line no-console
            console.log('early unregister module', path);
          }
        };
      }

      hook.flushStoreModules = () => {
        store.replaceState = origReplaceState;

        if (store.registerModule) {
          store.registerModule = origRegister;
          store.unregisterModule = origUnregister;
        }

        return hook.storeModules || [];
      };
    });
  }

  Object.defineProperty(target, '__VUE_DEVTOOLS_GLOBAL_HOOK__', {
    get() {
      return hook;
    }

  }); // Handle apps initialized before hook injection

  if (target.__VUE_DEVTOOLS_HOOK_REPLAY__) {
    try {
      target.__VUE_DEVTOOLS_HOOK_REPLAY__.forEach(cb => cb(hook));

      target.__VUE_DEVTOOLS_HOOK_REPLAY__ = [];
    } catch (e) {
      console.error('[vue-devtools] Error during hook replay', e);
    }
  } // Clone deep utility for cloning initial state of the store
  // Forked from https://github.com/planttheidea/fast-copy
  // Last update: 2019-10-30
  // ⚠️ Don't forget to update `./hook.js`
  // utils


  const {
    toString: toStringFunction
  } = Function.prototype;
  const {
    create,
    defineProperty,
    getOwnPropertyDescriptor,
    getOwnPropertyNames,
    getOwnPropertySymbols,
    getPrototypeOf
  } = Object;
  const {
    hasOwnProperty,
    propertyIsEnumerable
  } = Object.prototype;
  /**
   * @enum
   *
   * @const {object} SUPPORTS
   *
   * @property {boolean} SYMBOL_PROPERTIES are symbol properties supported
   * @property {boolean} WEAKSET is WeakSet supported
   */

  const SUPPORTS = {
    SYMBOL_PROPERTIES: typeof getOwnPropertySymbols === 'function',
    WEAKSET: typeof WeakSet === 'function'
  };
  /**
   * @function createCache
   *
   * @description
   * get a new cache object to prevent circular references
   *
   * @returns the new cache object
   */

  const createCache = () => {
    if (SUPPORTS.WEAKSET) {
      return new WeakSet();
    }

    const object = create({
      add: value => object._values.push(value),
      has: value => !!~object._values.indexOf(value)
    });
    object._values = [];
    return object;
  };
  /**
   * @function getCleanClone
   *
   * @description
   * get an empty version of the object with the same prototype it has
   *
   * @param object the object to build a clean clone from
   * @param realm the realm the object resides in
   * @returns the empty cloned object
   */


  const getCleanClone = (object, realm) => {
    if (!object.constructor) {
      return create(null);
    } // eslint-disable-next-line no-proto, no-restricted-properties


    const prototype = object.__proto__ || getPrototypeOf(object);

    if (object.constructor === realm.Object) {
      return prototype === realm.Object.prototype ? {} : create(prototype);
    }

    if (~toStringFunction.call(object.constructor).indexOf('[native code]')) {
      try {
        return new object.constructor();
      } catch (e) {// Error
      }
    }

    return create(prototype);
  };
  /**
   * @function getObjectCloneLoose
   *
   * @description
   * get a copy of the object based on loose rules, meaning all enumerable keys
   * and symbols are copied, but property descriptors are not considered
   *
   * @param object the object to clone
   * @param realm the realm the object resides in
   * @param handleCopy the function that handles copying the object
   * @returns the copied object
   */


  const getObjectCloneLoose = (object, realm, handleCopy, cache) => {
    const clone = getCleanClone(object, realm);

    for (const key in object) {
      if (hasOwnProperty.call(object, key)) {
        clone[key] = handleCopy(object[key], cache);
      }
    }

    if (SUPPORTS.SYMBOL_PROPERTIES) {
      const symbols = getOwnPropertySymbols(object);

      if (symbols.length) {
        for (let index = 0, symbol; index < symbols.length; index++) {
          symbol = symbols[index];

          if (propertyIsEnumerable.call(object, symbol)) {
            clone[symbol] = handleCopy(object[symbol], cache);
          }
        }
      }
    }

    return clone;
  };
  /**
   * @function getObjectCloneStrict
   *
   * @description
   * get a copy of the object based on strict rules, meaning all keys and symbols
   * are copied based on the original property descriptors
   *
   * @param object the object to clone
   * @param realm the realm the object resides in
   * @param handleCopy the function that handles copying the object
   * @returns the copied object
   */


  const getObjectCloneStrict = (object, realm, handleCopy, cache) => {
    const clone = getCleanClone(object, realm);
    const properties = SUPPORTS.SYMBOL_PROPERTIES ? [].concat(getOwnPropertyNames(object), getOwnPropertySymbols(object)) : getOwnPropertyNames(object);

    if (properties.length) {
      for (let index = 0, property, descriptor; index < properties.length; index++) {
        property = properties[index];

        if (property !== 'callee' && property !== 'caller') {
          descriptor = getOwnPropertyDescriptor(object, property);
          descriptor.value = handleCopy(object[property], cache);
          defineProperty(clone, property, descriptor);
        }
      }
    }

    return clone;
  };
  /**
   * @function getRegExpFlags
   *
   * @description
   * get the flags to apply to the copied regexp
   *
   * @param regExp the regexp to get the flags of
   * @returns the flags for the regexp
   */


  const getRegExpFlags = regExp => {
    let flags = '';

    if (regExp.global) {
      flags += 'g';
    }

    if (regExp.ignoreCase) {
      flags += 'i';
    }

    if (regExp.multiline) {
      flags += 'm';
    }

    if (regExp.unicode) {
      flags += 'u';
    }

    if (regExp.sticky) {
      flags += 'y';
    }

    return flags;
  };

  const {
    isArray
  } = Array;

  const GLOBAL_THIS = (() => {
    // eslint-disable-next-line no-restricted-globals
    if (typeof self !== 'undefined') {
      // eslint-disable-next-line no-restricted-globals
      return self;
    }

    if (typeof window !== 'undefined') {
      return window;
    }

    if (typeof globalThis !== 'undefined') {
      return globalThis;
    }

    if (console && console.error) {
      console.error('Unable to locate global object, returning "this".');
    }
  })();
  /**
   * @function clone
   *
   * @description
   * copy an object deeply as much as possible
   *
   * If `strict` is applied, then all properties (including non-enumerable ones)
   * are copied with their original property descriptors on both objects and arrays.
   *
   * The object is compared to the global constructors in the `realm` provided,
   * and the native constructor is always used to ensure that extensions of native
   * objects (allows in ES2015+) are maintained.
   *
   * @param object the object to copy
   * @param [options] the options for copying with
   * @param [options.isStrict] should the copy be strict
   * @param [options.realm] the realm (this) object the object is copied from
   * @returns the copied object
   */


  function clone(object, options = null) {
    // manually coalesced instead of default parameters for performance
    const isStrict = !!(options && options.isStrict);
    const realm = options && options.realm || GLOBAL_THIS;
    const getObjectClone = isStrict ? getObjectCloneStrict : getObjectCloneLoose;
    /**
     * @function handleCopy
     *
     * @description
     * copy the object recursively based on its type
     *
     * @param object the object to copy
     * @returns the copied object
     */

    const handleCopy = (object, cache) => {
      if (!object || typeof object !== 'object' || cache.has(object)) {
        return object;
      } // DOM objects


      if (typeof HTMLElement !== 'undefined' && object instanceof HTMLElement) {
        return object.cloneNode(false);
      }

      const Constructor = object.constructor; // plain objects

      if (Constructor === realm.Object) {
        cache.add(object);
        return getObjectClone(object, realm, handleCopy, cache);
      }

      let clone; // arrays

      if (isArray(object)) {
        cache.add(object); // if strict, include non-standard properties

        if (isStrict) {
          return getObjectCloneStrict(object, realm, handleCopy, cache);
        }

        clone = new Constructor();

        for (let index = 0; index < object.length; index++) {
          clone[index] = handleCopy(object[index], cache);
        }

        return clone;
      } // dates


      if (object instanceof realm.Date) {
        return new Constructor(object.getTime());
      } // regexps


      if (object instanceof realm.RegExp) {
        clone = new Constructor(object.source, object.flags || getRegExpFlags(object));
        clone.lastIndex = object.lastIndex;
        return clone;
      } // maps


      if (realm.Map && object instanceof realm.Map) {
        cache.add(object);
        clone = new Constructor();
        object.forEach((value, key) => {
          clone.set(key, handleCopy(value, cache));
        });
        return clone;
      } // sets


      if (realm.Set && object instanceof realm.Set) {
        cache.add(object);
        clone = new Constructor();
        object.forEach(value => {
          clone.add(handleCopy(value, cache));
        });
        return clone;
      } // buffers (node-only)


      if (realm.Buffer && realm.Buffer.isBuffer(object)) {
        clone = realm.Buffer.allocUnsafe ? realm.Buffer.allocUnsafe(object.length) : new Constructor(object.length);
        object.copy(clone);
        return clone;
      } // arraybuffers / dataviews


      if (realm.ArrayBuffer) {
        // dataviews
        if (realm.ArrayBuffer.isView(object)) {
          return new Constructor(object.buffer.slice(0));
        } // arraybuffers


        if (object instanceof realm.ArrayBuffer) {
          return object.slice(0);
        }
      } // if the object cannot / should not be cloned, don't


      if ( // promise-like
      hasOwnProperty.call(object, 'then') && typeof object.then === 'function' // errors
      || object instanceof Error // weakmaps
      || realm.WeakMap && object instanceof realm.WeakMap // weaksets
      || realm.WeakSet && object instanceof realm.WeakSet) {
        return object;
      }

      cache.add(object); // assume anything left is a custom constructor

      return getObjectClone(object, realm, handleCopy, cache);
    };

    return handleCopy(object, createCache());
  }
}

exports.installHook = installHook;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!**************************!*\
  !*** ./src/hook-exec.js ***!
  \**************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _back_hook__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @back/hook */ "../app-backend-core/lib/hook.js");

(0,_back_hook__WEBPACK_IMPORTED_MODULE_0__.installHook)(window);
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9vay1leGVjLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Q0FBQTs7Ozs7O0FBRUE7Ozs7Ozs7OztBQVFBLFNBQWdCQSxXQUFoQixDQUE0QkMsTUFBNUIsRUFBb0NDLFFBQVEsR0FBRyxLQUEvQyxFQUFvRDtFQUNsRCxNQUFNQyxlQUFlLEdBQUcsS0FBeEI7RUFDQSxJQUFJQyxTQUFTLEdBQUcsRUFBaEI7O0VBRUEsU0FBU0MsZ0JBQVQsQ0FBMEJDLE1BQTFCLEVBQWdDO0lBQzlCLElBQUtBLE1BQWMsQ0FBQ0MscUJBQXBCLEVBQTJDO01BQ3pDO0lBQ0Q7O0lBQ0QsSUFBSTtNQUNERCxNQUFjLENBQUNDLHFCQUFmLEdBQXVDLElBQXZDOztNQUNELE1BQU1DLE1BQU0sR0FBRyxNQUFLO1FBQ2xCLElBQUk7VUFDREYsTUFBTSxDQUFDRyxhQUFQLENBQTZCQyx1QkFBN0IsR0FBdURKLE1BQXZEO1VBQ0QsTUFBTUssTUFBTSxHQUFHTCxNQUFNLENBQUNNLGVBQVAsQ0FBdUJDLGFBQXZCLENBQXFDLFFBQXJDLENBQWY7VUFDQUYsTUFBTSxDQUFDRyxXQUFQLEdBQXFCLEtBQUtkLFdBQVcsQ0FBQ2UsUUFBWixFQUFzQixpQkFBaEQ7VUFDQVQsTUFBTSxDQUFDTSxlQUFQLENBQXVCSSxlQUF2QixDQUF1Q0MsV0FBdkMsQ0FBbUROLE1BQW5EO1VBQ0FBLE1BQU0sQ0FBQ08sVUFBUCxDQUFrQkMsV0FBbEIsQ0FBOEJSLE1BQTlCO1FBQ0QsQ0FORCxDQU9BLE9BQU9TLENBQVAsRUFBVSxDQUNSO1FBQ0Q7TUFDRixDQVhEOztNQVlBWixNQUFNO01BQ05GLE1BQU0sQ0FBQ2UsZ0JBQVAsQ0FBd0IsTUFBeEIsRUFBZ0MsTUFBTWIsTUFBTSxFQUE1QztJQUNELENBaEJELENBaUJBLE9BQU9ZLENBQVAsRUFBVSxDQUNSO0lBQ0Q7RUFDRjs7RUFFRCxJQUFJRSxZQUFZLEdBQUcsQ0FBbkI7O0VBQ0EsU0FBU0MsZUFBVCxHQUF3QjtJQUN0QixJQUFJLE9BQU9DLE1BQVAsS0FBa0IsV0FBdEIsRUFBbUM7TUFDakM7SUFDRDs7SUFFRCxNQUFNQyxPQUFPLEdBQUdDLFFBQVEsQ0FBQ0MsZ0JBQVQsQ0FBNkMsd0NBQTdDLENBQWhCOztJQUNBLEtBQUssTUFBTXJCLE1BQVgsSUFBcUJtQixPQUFyQixFQUE4QjtNQUM1QnBCLGdCQUFnQixDQUFDQyxNQUFELENBQWhCO0lBQ0Q7RUFDRjs7RUFDRGlCLGVBQWU7RUFDZixNQUFNSyxXQUFXLEdBQUdDLFdBQVcsQ0FBQyxNQUFLO0lBQ25DTixlQUFlO0lBQ2ZELFlBQVk7O0lBQ1osSUFBSUEsWUFBWSxJQUFJLENBQXBCLEVBQXVCO01BQ3JCUSxhQUFhLENBQUNGLFdBQUQsQ0FBYjtJQUNEO0VBQ0YsQ0FOOEIsRUFNNUIsSUFONEIsQ0FBL0I7O0VBUUEsSUFBSUcsTUFBTSxDQUFDQyxTQUFQLENBQWlCQyxjQUFqQixDQUFnQ0MsSUFBaEMsQ0FBcUNqQyxNQUFyQyxFQUE2Qyw4QkFBN0MsQ0FBSixFQUFrRjtJQUNoRixJQUFJQSxNQUFNLENBQUNrQyw0QkFBUCxDQUFvQ2hDLGVBQXBDLEtBQXdEQSxlQUE1RCxFQUE2RTtNQUMzRWlDLE9BQU8sQ0FBQ0MsS0FBUixDQUFjLGtHQUFkO0lBQ0Q7O0lBQ0Q7RUFDRDs7RUFFRCxJQUFJQyxJQUFKOztFQUVBLElBQUlwQyxRQUFKLEVBQWM7SUFDWixNQUFNcUMsWUFBWSxHQUFJQyxFQUFELElBQU87TUFDMUIsSUFBSTtRQUNGLE1BQU1GLElBQUksR0FBSWQsTUFBTSxDQUFDaUIsTUFBUCxDQUFzQk4sNEJBQXBDOztRQUNBLElBQUlHLElBQUosRUFBVTtVQUNSLE9BQU9FLEVBQUUsQ0FBQ0YsSUFBRCxDQUFUO1FBQ0QsQ0FGRCxNQUdLO1VBQ0hGLE9BQU8sQ0FBQ00sSUFBUixDQUFhLHlDQUFiO1FBQ0Q7TUFDRixDQVJELENBU0EsT0FBT3RCLENBQVAsRUFBVTtRQUNSZ0IsT0FBTyxDQUFDTSxJQUFSLENBQWEsd0RBQWIsRUFBdUV0QixDQUF2RTtNQUNEO0lBQ0YsQ0FiRDs7SUFlQWtCLElBQUksR0FBRztNQUNMbkMsZUFESzs7TUFFTDtNQUNBLElBQUl3QyxHQUFKLENBQVFDLEtBQVIsRUFBYTtRQUNYTCxZQUFZLENBQUVELElBQUQsSUFBUztVQUNwQkEsSUFBSSxDQUFDSyxHQUFMLEdBQVdDLEtBQVg7UUFDRCxDQUZXLENBQVo7TUFHRCxDQVBJOztNQVNMO01BQ0EsSUFBSUMsT0FBSixDQUFZRCxLQUFaLEVBQWlCO1FBQ2ZMLFlBQVksQ0FBRUQsSUFBRCxJQUFTO1VBQ3BCQSxJQUFJLENBQUNPLE9BQUwsR0FBZUQsS0FBZjtRQUNELENBRlcsQ0FBWjtNQUdELENBZEk7O01BZ0JMRSxFQUFFLENBQUNDLEtBQUQsRUFBUUMsRUFBUixFQUFVO1FBQ1ZULFlBQVksQ0FBQ0QsSUFBSSxJQUFJQSxJQUFJLENBQUNRLEVBQUwsQ0FBUUMsS0FBUixFQUFlQyxFQUFmLENBQVQsQ0FBWjtNQUNELENBbEJJOztNQW9CTEMsSUFBSSxDQUFDRixLQUFELEVBQVFDLEVBQVIsRUFBVTtRQUNaVCxZQUFZLENBQUNELElBQUksSUFBSUEsSUFBSSxDQUFDVyxJQUFMLENBQVVGLEtBQVYsRUFBaUJDLEVBQWpCLENBQVQsQ0FBWjtNQUNELENBdEJJOztNQXdCTEUsR0FBRyxDQUFDSCxLQUFELEVBQVFDLEVBQVIsRUFBVTtRQUNYVCxZQUFZLENBQUNELElBQUksSUFBSUEsSUFBSSxDQUFDWSxHQUFMLENBQVNILEtBQVQsRUFBZ0JDLEVBQWhCLENBQVQsQ0FBWjtNQUNELENBMUJJOztNQTRCTEcsSUFBSSxDQUFDSixLQUFELEVBQVEsR0FBR0ssSUFBWCxFQUFlO1FBQ2pCYixZQUFZLENBQUNELElBQUksSUFBSUEsSUFBSSxDQUFDYSxJQUFMLENBQVVKLEtBQVYsRUFBaUIsR0FBR0ssSUFBcEIsQ0FBVCxDQUFaO01BQ0QsQ0E5Qkk7O01BZ0NMQyxhQUFhLENBQUNDLFFBQUQsRUFBUzs7O1FBQ3BCLE9BQU8sa0JBQVksQ0FBQ2hCLElBQUksSUFBSUEsSUFBSSxDQUFDZSxhQUFMLENBQW1CQyxRQUFuQixDQUFULENBQVosTUFBa0QsSUFBbEQsSUFBa0RDLGFBQWxELEdBQWtEQSxFQUFsRCxHQUFzRCxLQUE3RDtNQUNEOztJQWxDSSxDQUFQO0VBb0NELENBcERELE1BcURLO0lBQ0hqQixJQUFJLEdBQUc7TUFDTG5DLGVBREs7TUFFTHdDLEdBQUcsRUFBRSxJQUZBO01BR0xFLE9BQU8sRUFBRVcsU0FISjtNQUlMQyxPQUFPLEVBQUUsRUFKSjtNQUtMQyxVQUFVLEVBQUUsSUFBSUMsR0FBSixFQUxQO01BTUxDLGVBQWUsRUFBRSxJQUFJRCxHQUFKLEVBTlo7TUFPTEUsS0FBSyxFQUFFLElBUEY7TUFRTEMsWUFBWSxFQUFFLElBUlQ7TUFTTEMsWUFBWSxFQUFFLElBVFQ7TUFVTEMsaUJBQWlCLEVBQUUsSUFWZDtNQVdMQyxJQUFJLEVBQUUsRUFYRDs7TUFhTEMsYUFBYSxDQUFDbkIsS0FBRCxFQUFNO1FBQ2pCLE1BQU1vQixNQUFNLEdBQUcsS0FBS1YsT0FBcEI7UUFDQSxLQUFLQSxPQUFMLEdBQWUsRUFBZjs7UUFDQSxLQUFLQyxVQUFMLENBQWdCVSxLQUFoQjs7UUFDQSxLQUFLUixlQUFMLENBQXFCUSxLQUFyQjs7UUFFQSxLQUFLLElBQUlDLENBQUMsR0FBRyxDQUFSLEVBQVdDLENBQUMsR0FBR0gsTUFBTSxDQUFDSSxNQUEzQixFQUFtQ0YsQ0FBQyxHQUFHQyxDQUF2QyxFQUEwQ0QsQ0FBQyxFQUEzQyxFQUErQztVQUM3QyxNQUFNRyxPQUFPLEdBQUdMLE1BQU0sQ0FBQ0UsQ0FBRCxDQUFOLENBQVVJLEtBQVYsQ0FBZ0IsQ0FBaEIsQ0FBaEI7VUFDQUQsT0FBTyxDQUFDLENBQUQsQ0FBUCxLQUFlekIsS0FBZixDQUNFO1VBREYsRUFFSSxLQUFLSSxJQUFMLENBQVV1QixLQUFWLENBQWdCLElBQWhCLEVBQXNCRixPQUF0QixDQUZKLEdBR0ksS0FBS2YsT0FBTCxDQUFha0IsSUFBYixDQUFrQlIsTUFBTSxDQUFDRSxDQUFELENBQXhCLENBSEo7UUFJRDtNQUNGLENBMUJJOztNQTRCTHZCLEVBQUUsQ0FBQ0MsS0FBRCxFQUFRQyxFQUFSLEVBQVU7UUFDVixNQUFNNEIsTUFBTSxHQUFHLElBQUk3QixLQUFLLEVBQXhCOztRQUNBLElBQUkzQyxTQUFTLENBQUN3RSxNQUFELENBQWIsRUFBdUI7VUFDckJ4RSxTQUFTLENBQUN3RSxNQUFELENBQVQsQ0FBa0JELElBQWxCLENBQXVCM0IsRUFBdkI7UUFDRCxDQUZELE1BR0s7VUFDSDVDLFNBQVMsQ0FBQ3dFLE1BQUQsQ0FBVCxHQUFvQixDQUFDNUIsRUFBRCxDQUFwQjs7VUFDQSxLQUFLa0IsYUFBTCxDQUFtQm5CLEtBQW5CO1FBQ0Q7TUFDRixDQXJDSTs7TUF1Q0xFLElBQUksQ0FBQ0YsS0FBRCxFQUFRQyxFQUFSLEVBQVU7UUFDWixNQUFNRixFQUFFLEdBQUcsQ0FBQyxHQUFHTSxJQUFKLEtBQVk7VUFDckIsS0FBS0YsR0FBTCxDQUFTSCxLQUFULEVBQWdCRCxFQUFoQjtVQUNBLE9BQU9FLEVBQUUsQ0FBQzBCLEtBQUgsQ0FBUyxJQUFULEVBQWV0QixJQUFmLENBQVA7UUFDRCxDQUhEOztRQUlBLEtBQUtOLEVBQUwsQ0FBUUMsS0FBUixFQUFlRCxFQUFmO01BQ0QsQ0E3Q0k7O01BK0NMSSxHQUFHLENBQUNILEtBQUQsRUFBUUMsRUFBUixFQUFVO1FBQ1hELEtBQUssR0FBRyxJQUFJQSxLQUFLLEVBQWpCOztRQUNBLElBQUksQ0FBQzhCLFNBQVMsQ0FBQ04sTUFBZixFQUF1QjtVQUNyQm5FLFNBQVMsR0FBRyxFQUFaO1FBQ0QsQ0FGRCxNQUdLO1VBQ0gsTUFBTTBFLEdBQUcsR0FBRzFFLFNBQVMsQ0FBQzJDLEtBQUQsQ0FBckI7O1VBQ0EsSUFBSStCLEdBQUosRUFBUztZQUNQLElBQUksQ0FBQzlCLEVBQUwsRUFBUztjQUNQNUMsU0FBUyxDQUFDMkMsS0FBRCxDQUFULEdBQW1CLElBQW5CO1lBQ0QsQ0FGRCxNQUdLO2NBQ0gsS0FBSyxJQUFJc0IsQ0FBQyxHQUFHLENBQVIsRUFBV0MsQ0FBQyxHQUFHUSxHQUFHLENBQUNQLE1BQXhCLEVBQWdDRixDQUFDLEdBQUdDLENBQXBDLEVBQXVDRCxDQUFDLEVBQXhDLEVBQTRDO2dCQUMxQyxNQUFNN0IsRUFBRSxHQUFHc0MsR0FBRyxDQUFDVCxDQUFELENBQWQ7O2dCQUNBLElBQUk3QixFQUFFLEtBQUtRLEVBQVAsSUFBYVIsRUFBRSxDQUFDUSxFQUFILEtBQVVBLEVBQTNCLEVBQStCO2tCQUM3QjhCLEdBQUcsQ0FBQ0MsTUFBSixDQUFXVixDQUFYLEVBQWMsQ0FBZDtrQkFDQTtnQkFDRDtjQUNGO1lBQ0Y7VUFDRjtRQUNGO01BQ0YsQ0FyRUk7O01BdUVMbEIsSUFBSSxDQUFDSixLQUFELEVBQVEsR0FBR0ssSUFBWCxFQUFlO1FBQ2pCLE1BQU13QixNQUFNLEdBQUcsSUFBSTdCLEtBQUssRUFBeEI7UUFDQSxJQUFJK0IsR0FBRyxHQUFHMUUsU0FBUyxDQUFDd0UsTUFBRCxDQUFuQjs7UUFDQSxJQUFJRSxHQUFKLEVBQVM7VUFDUEEsR0FBRyxHQUFHQSxHQUFHLENBQUNMLEtBQUosRUFBTjs7VUFDQSxLQUFLLElBQUlKLENBQUMsR0FBRyxDQUFSLEVBQVdDLENBQUMsR0FBR1EsR0FBRyxDQUFDUCxNQUF4QixFQUFnQ0YsQ0FBQyxHQUFHQyxDQUFwQyxFQUF1Q0QsQ0FBQyxFQUF4QyxFQUE0QztZQUMxQyxJQUFJO2NBQ0YsTUFBTVcsTUFBTSxHQUFHRixHQUFHLENBQUNULENBQUQsQ0FBSCxDQUFPSyxLQUFQLENBQWEsSUFBYixFQUFtQnRCLElBQW5CLENBQWY7O2NBQ0EsSUFBSSxRQUFPNEIsTUFBTSxTQUFOLFVBQU0sV0FBTixHQUFNLE1BQU4sU0FBTSxDQUFFQyxLQUFmLE1BQXlCLFVBQTdCLEVBQXlDO2dCQUN2Q0QsTUFBTSxDQUFDQyxLQUFQLENBQWM3RCxDQUFELElBQU07a0JBQ2pCZ0IsT0FBTyxDQUFDQyxLQUFSLENBQWMsMkNBQTJDVSxLQUFLLGFBQTlELEVBQTZFSyxJQUE3RTtrQkFDQWhCLE9BQU8sQ0FBQ0MsS0FBUixDQUFjakIsQ0FBZDtnQkFDRCxDQUhEO2NBSUQ7WUFDRixDQVJELENBU0EsT0FBT0EsQ0FBUCxFQUFVO2NBQ1JnQixPQUFPLENBQUNDLEtBQVIsQ0FBYyxxQ0FBcUNVLEtBQUssYUFBeEQsRUFBdUVLLElBQXZFO2NBQ0FoQixPQUFPLENBQUNDLEtBQVIsQ0FBY2pCLENBQWQ7WUFDRDtVQUNGO1FBQ0YsQ0FqQkQsTUFrQks7VUFDSCxNQUFNOEQsUUFBUSxHQUFHLENBQUNDLElBQUksQ0FBQ0MsR0FBTCxFQUFELEVBQWFyQyxLQUFiLEVBQW9CLEdBQUdLLElBQXZCLENBQWpCOztVQUNBLEtBQUtLLE9BQUwsQ0FBYWtCLElBQWIsQ0FBa0JPLFFBQWxCOztVQUVBLEtBQUssSUFBSWIsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR2pCLElBQUksQ0FBQ21CLE1BQXpCLEVBQWlDRixDQUFDLEVBQWxDLEVBQXNDO1lBQ3BDLElBQUksT0FBT2pCLElBQUksQ0FBQ2lCLENBQUQsQ0FBWCxLQUFtQixRQUFuQixJQUErQmpCLElBQUksQ0FBQ2lCLENBQUQsQ0FBdkMsRUFBNEM7Y0FDMUM7Y0FDQSxLQUFLWCxVQUFMLENBQWdCMkIsR0FBaEIsQ0FBb0JqQyxJQUFJLENBQUNpQixDQUFELENBQXhCLEVBQTZCYSxRQUE3Qjs7Y0FDQTtZQUNEO1VBQ0Y7UUFDRjtNQUNGLENBeEdJOztNQTBHTDs7OztNQUlBN0IsYUFBYSxDQUFDQyxRQUFELEVBQVM7UUFDcEIsTUFBTWdDLFFBQVEsR0FBRyxLQUFLNUIsVUFBTCxDQUFnQjZCLEdBQWhCLENBQW9CakMsUUFBcEIsQ0FBakI7O1FBQ0EsSUFBSWdDLFFBQUosRUFBYztVQUNaO1VBQ0EsS0FBSzFCLGVBQUwsQ0FBcUJ5QixHQUFyQixDQUF5QixLQUFLM0IsVUFBTCxDQUFnQjhCLEdBQWhCLENBQW9CbEMsUUFBcEIsQ0FBekIsRUFBd0QsSUFBeEQ7UUFDRDs7UUFDRCxPQUFPZ0MsUUFBUDtNQUNELENBckhJOztNQXVITEcsY0FBYztRQUNaLE1BQU1MLEdBQUcsR0FBR0QsSUFBSSxDQUFDQyxHQUFMLEVBQVosQ0FEWSxDQUVaOztRQUNBLEtBQUszQixPQUFMLEdBQWUsS0FBS0EsT0FBTCxDQUFhaUMsTUFBYixDQUFvQnRDLElBQUksSUFBSSxDQUFDLEtBQUtRLGVBQUwsQ0FBcUIyQixHQUFyQixDQUF5Qm5DLElBQXpCLENBQUQsSUFBbUNnQyxHQUFHLEdBQUdoQyxJQUFJLENBQUMsQ0FBRCxDQUFWLEdBQWdCLEtBQS9FLENBQWY7O1FBQ0EsS0FBS1EsZUFBTCxDQUFxQlEsS0FBckI7O1FBQ0EsS0FBS1YsVUFBTCxDQUFnQlUsS0FBaEI7TUFDRDs7SUE3SEksQ0FBUDtJQWdJQXZDLFdBQVcsQ0FBQyxNQUFLO01BQ2ZTLElBQUksQ0FBQ21ELGNBQUw7SUFDRCxDQUZVLEVBRVIsS0FGUSxDQUFYO0lBSUFuRCxJQUFJLENBQUNXLElBQUwsQ0FBVSxNQUFWLEVBQW1CTixHQUFELElBQVE7TUFDeEJMLElBQUksQ0FBQ0ssR0FBTCxHQUFXQSxHQUFYOztNQUVBLElBQUlBLEdBQUosRUFBUztRQUNQQSxHQUFHLENBQUNYLFNBQUosQ0FBYzJELFFBQWQsR0FBeUI7VUFDdkIsTUFBTTNDLEVBQUUsR0FBRy9DLE1BQU0sQ0FBQzJGLHdCQUFsQjtVQUNBNUMsRUFBRSxJQUFJQSxFQUFFLENBQUMsSUFBRCxDQUFSO1FBQ0QsQ0FIRDtNQUlEO0lBQ0YsQ0FURDtJQVdBVixJQUFJLENBQUNRLEVBQUwsQ0FBUSxVQUFSLEVBQW9CLENBQUMrQyxHQUFELEVBQU1DLE9BQU4sRUFBZUMsS0FBZixLQUF3QjtNQUMxQyxNQUFNQyxTQUFTLEdBQUc7UUFDaEJILEdBRGdCO1FBRWhCQyxPQUZnQjtRQUdoQkM7TUFIZ0IsQ0FBbEI7TUFLQXpELElBQUksQ0FBQzJCLElBQUwsQ0FBVVUsSUFBVixDQUFlcUIsU0FBZjtNQUNBMUQsSUFBSSxDQUFDYSxJQUFMLENBQVUsU0FBVixFQUFxQjZDLFNBQXJCO0lBQ0QsQ0FSRDtJQVVBMUQsSUFBSSxDQUFDVyxJQUFMLENBQVUsV0FBVixFQUF3QlksS0FBRCxJQUFVO01BQy9CdkIsSUFBSSxDQUFDdUIsS0FBTCxHQUFhQSxLQUFiO01BQ0F2QixJQUFJLENBQUN3QixZQUFMLEdBQW9CbUMsS0FBSyxDQUFDcEMsS0FBSyxDQUFDcUMsS0FBUCxDQUF6QjtNQUNBLE1BQU1DLGdCQUFnQixHQUFHdEMsS0FBSyxDQUFDdUMsWUFBTixDQUFtQkMsSUFBbkIsQ0FBd0J4QyxLQUF4QixDQUF6Qjs7TUFDQUEsS0FBSyxDQUFDdUMsWUFBTixHQUFzQkYsS0FBRCxJQUFVO1FBQzdCNUQsSUFBSSxDQUFDd0IsWUFBTCxHQUFvQm1DLEtBQUssQ0FBQ0MsS0FBRCxDQUF6QjtRQUNBQyxnQkFBZ0IsQ0FBQ0QsS0FBRCxDQUFoQjtNQUNELENBSEQsQ0FKK0IsQ0FRL0I7OztNQUNBLElBQUlJLFlBQUosRUFBa0JDLGNBQWxCOztNQUNBLElBQUkxQyxLQUFLLENBQUMyQyxjQUFWLEVBQTBCO1FBQ3hCbEUsSUFBSSxDQUFDeUIsWUFBTCxHQUFvQixFQUFwQjtRQUNBdUMsWUFBWSxHQUFHekMsS0FBSyxDQUFDMkMsY0FBTixDQUFxQkgsSUFBckIsQ0FBMEJ4QyxLQUExQixDQUFmOztRQUNBQSxLQUFLLENBQUMyQyxjQUFOLEdBQXVCLENBQUNDLElBQUQsRUFBT0MsTUFBUCxFQUFlQyxPQUFmLEtBQTBCO1VBQy9DLElBQUksT0FBT0YsSUFBUCxLQUFnQixRQUFwQixFQUE4QjtZQUM1QkEsSUFBSSxHQUFHLENBQUNBLElBQUQsQ0FBUDtVQUNEOztVQUNEbkUsSUFBSSxDQUFDeUIsWUFBTCxDQUFrQlksSUFBbEIsQ0FBdUI7WUFBRThCLElBQUY7WUFBUUMsTUFBUjtZQUFnQkM7VUFBaEIsQ0FBdkI7VUFDQUwsWUFBWSxDQUFDRyxJQUFELEVBQU9DLE1BQVAsRUFBZUMsT0FBZixDQUFaOztVQUNBLElBQUlDLElBQUosRUFBMkM7WUFDekM7WUFDQXhFLE9BQU8sQ0FBQzJFLEdBQVIsQ0FBWSx1QkFBWixFQUFxQ04sSUFBckMsRUFBMkNDLE1BQTNDLEVBQW1EQyxPQUFuRDtVQUNEO1FBQ0YsQ0FWRDs7UUFXQUosY0FBYyxHQUFHMUMsS0FBSyxDQUFDbUQsZ0JBQU4sQ0FBdUJYLElBQXZCLENBQTRCeEMsS0FBNUIsQ0FBakI7O1FBQ0FBLEtBQUssQ0FBQ21ELGdCQUFOLEdBQTBCUCxJQUFELElBQVM7VUFDaEMsSUFBSSxPQUFPQSxJQUFQLEtBQWdCLFFBQXBCLEVBQThCO1lBQzVCQSxJQUFJLEdBQUcsQ0FBQ0EsSUFBRCxDQUFQO1VBQ0Q7O1VBQ0QsTUFBTVEsR0FBRyxHQUFHUixJQUFJLENBQUNTLElBQUwsQ0FBVSxHQUFWLENBQVo7VUFDQSxNQUFNQyxLQUFLLEdBQUc3RSxJQUFJLENBQUN5QixZQUFMLENBQWtCcUQsU0FBbEIsQ0FBNEJDLENBQUMsSUFBSUEsQ0FBQyxDQUFDWixJQUFGLENBQU9TLElBQVAsQ0FBWSxHQUFaLE1BQXFCRCxHQUF0RCxDQUFkOztVQUNBLElBQUlFLEtBQUssS0FBSyxDQUFDLENBQWYsRUFBa0I7WUFDaEI3RSxJQUFJLENBQUN5QixZQUFMLENBQWtCZ0IsTUFBbEIsQ0FBeUJvQyxLQUF6QixFQUFnQyxDQUFoQztVQUNEOztVQUNEWixjQUFjLENBQUNFLElBQUQsQ0FBZDs7VUFDQSxJQUFJRyxJQUFKLEVBQTJDO1lBQ3pDO1lBQ0F4RSxPQUFPLENBQUMyRSxHQUFSLENBQVkseUJBQVosRUFBdUNOLElBQXZDO1VBQ0Q7UUFDRixDQWREO01BZUQ7O01BQ0RuRSxJQUFJLENBQUMwQixpQkFBTCxHQUF5QixNQUFLO1FBQzVCSCxLQUFLLENBQUN1QyxZQUFOLEdBQXFCRCxnQkFBckI7O1FBQ0EsSUFBSXRDLEtBQUssQ0FBQzJDLGNBQVYsRUFBMEI7VUFDeEIzQyxLQUFLLENBQUMyQyxjQUFOLEdBQXVCRixZQUF2QjtVQUNBekMsS0FBSyxDQUFDbUQsZ0JBQU4sR0FBeUJULGNBQXpCO1FBQ0Q7O1FBQ0QsT0FBT2pFLElBQUksQ0FBQ3lCLFlBQUwsSUFBcUIsRUFBNUI7TUFDRCxDQVBEO0lBUUQsQ0FqREQ7RUFrREQ7O0VBRURoQyxNQUFNLENBQUN1RixjQUFQLENBQXNCckgsTUFBdEIsRUFBOEIsOEJBQTlCLEVBQThEO0lBQzVEdUYsR0FBRztNQUNELE9BQU9sRCxJQUFQO0lBQ0Q7O0VBSDJELENBQTlELEVBOVRrRCxDQW9VbEQ7O0VBQ0EsSUFBSXJDLE1BQU0sQ0FBQ3NILDRCQUFYLEVBQXlDO0lBQ3ZDLElBQUk7TUFDRnRILE1BQU0sQ0FBQ3NILDRCQUFQLENBQW9DQyxPQUFwQyxDQUE0Q2hGLEVBQUUsSUFBSUEsRUFBRSxDQUFDRixJQUFELENBQXBEOztNQUNBckMsTUFBTSxDQUFDc0gsNEJBQVAsR0FBc0MsRUFBdEM7SUFDRCxDQUhELENBSUEsT0FBT25HLENBQVAsRUFBVTtNQUNSZ0IsT0FBTyxDQUFDQyxLQUFSLENBQWMseUNBQWQsRUFBeURqQixDQUF6RDtJQUNEO0VBQ0YsQ0E3VWlELENBK1VsRDtFQUNBO0VBQ0E7RUFDQTtFQUVBOzs7RUFDQSxNQUFNO0lBQUVMLFFBQVEsRUFBRTBHO0VBQVosSUFBaUNDLFFBQVEsQ0FBQzFGLFNBQWhEO0VBQ0EsTUFBTTtJQUNKMkYsTUFESTtJQUVKTCxjQUZJO0lBR0pNLHdCQUhJO0lBSUpDLG1CQUpJO0lBS0pDLHFCQUxJO0lBTUpDO0VBTkksSUFPRmhHLE1BUEo7RUFRQSxNQUFNO0lBQUVFLGNBQUY7SUFBa0IrRjtFQUFsQixJQUEyQ2pHLE1BQU0sQ0FBQ0MsU0FBeEQ7RUFFQTs7Ozs7Ozs7O0VBUUEsTUFBTWlHLFFBQVEsR0FBRztJQUNmQyxpQkFBaUIsRUFBRSxPQUFPSixxQkFBUCxLQUFpQyxVQURyQztJQUVmSyxPQUFPLEVBQUUsT0FBT0MsT0FBUCxLQUFtQjtFQUZiLENBQWpCO0VBS0E7Ozs7Ozs7OztFQVFBLE1BQU1DLFdBQVcsR0FBRyxNQUFLO0lBQ3ZCLElBQUlKLFFBQVEsQ0FBQ0UsT0FBYixFQUFzQjtNQUNwQixPQUFPLElBQUlDLE9BQUosRUFBUDtJQUNEOztJQUVELE1BQU1FLE1BQU0sR0FBR1gsTUFBTSxDQUFDO01BQ3BCWSxHQUFHLEVBQUUzRixLQUFLLElBQUkwRixNQUFNLENBQUNFLE9BQVAsQ0FBZTdELElBQWYsQ0FBb0IvQixLQUFwQixDQURNO01BRXBCMkMsR0FBRyxFQUFFM0MsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDMEYsTUFBTSxDQUFDRSxPQUFQLENBQWVDLE9BQWYsQ0FBdUI3RixLQUF2QjtJQUZHLENBQUQsQ0FBckI7SUFLQTBGLE1BQU0sQ0FBQ0UsT0FBUCxHQUFpQixFQUFqQjtJQUVBLE9BQU9GLE1BQVA7RUFDRCxDQWJEO0VBZUE7Ozs7Ozs7Ozs7OztFQVVBLE1BQU1JLGFBQWEsR0FBRyxDQUFDSixNQUFELEVBQVNLLEtBQVQsS0FBa0I7SUFDdEMsSUFBSSxDQUFDTCxNQUFNLENBQUNNLFdBQVosRUFBeUI7TUFDdkIsT0FBT2pCLE1BQU0sQ0FBQyxJQUFELENBQWI7SUFDRCxDQUhxQyxDQUt0Qzs7O0lBQ0EsTUFBTTNGLFNBQVMsR0FBR3NHLE1BQU0sQ0FBQ08sU0FBUCxJQUFvQmQsY0FBYyxDQUFDTyxNQUFELENBQXBEOztJQUVBLElBQUlBLE1BQU0sQ0FBQ00sV0FBUCxLQUF1QkQsS0FBSyxDQUFDNUcsTUFBakMsRUFBeUM7TUFDdkMsT0FBT0MsU0FBUyxLQUFLMkcsS0FBSyxDQUFDNUcsTUFBTixDQUFhQyxTQUEzQixHQUF1QyxFQUF2QyxHQUE0QzJGLE1BQU0sQ0FBQzNGLFNBQUQsQ0FBekQ7SUFDRDs7SUFFRCxJQUFJLENBQUN5RixnQkFBZ0IsQ0FBQ3ZGLElBQWpCLENBQXNCb0csTUFBTSxDQUFDTSxXQUE3QixFQUEwQ0gsT0FBMUMsQ0FBa0QsZUFBbEQsQ0FBTCxFQUF5RTtNQUN2RSxJQUFJO1FBQ0YsT0FBTyxJQUFJSCxNQUFNLENBQUNNLFdBQVgsRUFBUDtNQUNELENBRkQsQ0FHQSxPQUFPeEgsQ0FBUCxFQUFVLENBQ1I7TUFDRDtJQUNGOztJQUVELE9BQU91RyxNQUFNLENBQUMzRixTQUFELENBQWI7RUFDRCxDQXRCRDtFQXdCQTs7Ozs7Ozs7Ozs7Ozs7RUFZQSxNQUFNOEcsbUJBQW1CLEdBQUcsQ0FDMUJSLE1BRDBCLEVBRTFCSyxLQUYwQixFQUcxQkksVUFIMEIsRUFJMUJDLEtBSjBCLEtBS3hCO0lBQ0YsTUFBTS9DLEtBQUssR0FBR3lDLGFBQWEsQ0FBQ0osTUFBRCxFQUFTSyxLQUFULENBQTNCOztJQUVBLEtBQUssTUFBTTFCLEdBQVgsSUFBa0JxQixNQUFsQixFQUEwQjtNQUN4QixJQUFJckcsY0FBYyxDQUFDQyxJQUFmLENBQW9Cb0csTUFBcEIsRUFBNEJyQixHQUE1QixDQUFKLEVBQXNDO1FBQ3BDaEIsS0FBSyxDQUFDZ0IsR0FBRCxDQUFMLEdBQWE4QixVQUFVLENBQUNULE1BQU0sQ0FBQ3JCLEdBQUQsQ0FBUCxFQUFjK0IsS0FBZCxDQUF2QjtNQUNEO0lBQ0Y7O0lBRUQsSUFBSWYsUUFBUSxDQUFDQyxpQkFBYixFQUFnQztNQUM5QixNQUFNZSxPQUFPLEdBQUduQixxQkFBcUIsQ0FBQ1EsTUFBRCxDQUFyQzs7TUFFQSxJQUFJVyxPQUFPLENBQUMxRSxNQUFaLEVBQW9CO1FBQ2xCLEtBQUssSUFBSTRDLEtBQUssR0FBRyxDQUFaLEVBQWUrQixNQUFwQixFQUE0Qi9CLEtBQUssR0FBRzhCLE9BQU8sQ0FBQzFFLE1BQTVDLEVBQW9ENEMsS0FBSyxFQUF6RCxFQUE2RDtVQUMzRCtCLE1BQU0sR0FBR0QsT0FBTyxDQUFDOUIsS0FBRCxDQUFoQjs7VUFFQSxJQUFJYSxvQkFBb0IsQ0FBQzlGLElBQXJCLENBQTBCb0csTUFBMUIsRUFBa0NZLE1BQWxDLENBQUosRUFBK0M7WUFDN0NqRCxLQUFLLENBQUNpRCxNQUFELENBQUwsR0FBZ0JILFVBQVUsQ0FBQ1QsTUFBTSxDQUFDWSxNQUFELENBQVAsRUFBaUJGLEtBQWpCLENBQTFCO1VBQ0Q7UUFDRjtNQUNGO0lBQ0Y7O0lBRUQsT0FBTy9DLEtBQVA7RUFDRCxDQTdCRDtFQStCQTs7Ozs7Ozs7Ozs7Ozs7RUFZQSxNQUFNa0Qsb0JBQW9CLEdBQUcsQ0FDM0JiLE1BRDJCLEVBRTNCSyxLQUYyQixFQUczQkksVUFIMkIsRUFJM0JDLEtBSjJCLEtBS3pCO0lBQ0YsTUFBTS9DLEtBQUssR0FBR3lDLGFBQWEsQ0FBQ0osTUFBRCxFQUFTSyxLQUFULENBQTNCO0lBRUEsTUFBTVMsVUFBVSxHQUFHbkIsUUFBUSxDQUFDQyxpQkFBVCxHQUNmLEdBQUdtQixNQUFILENBQVV4QixtQkFBbUIsQ0FBQ1MsTUFBRCxDQUE3QixFQUF1Q1IscUJBQXFCLENBQUNRLE1BQUQsQ0FBNUQsQ0FEZSxHQUVmVCxtQkFBbUIsQ0FBQ1MsTUFBRCxDQUZ2Qjs7SUFJQSxJQUFJYyxVQUFVLENBQUM3RSxNQUFmLEVBQXVCO01BQ3JCLEtBQ0UsSUFBSTRDLEtBQUssR0FBRyxDQUFaLEVBQWVtQyxRQUFmLEVBQXlCQyxVQUQzQixFQUVFcEMsS0FBSyxHQUFHaUMsVUFBVSxDQUFDN0UsTUFGckIsRUFHRTRDLEtBQUssRUFIUCxFQUlFO1FBQ0FtQyxRQUFRLEdBQUdGLFVBQVUsQ0FBQ2pDLEtBQUQsQ0FBckI7O1FBRUEsSUFBSW1DLFFBQVEsS0FBSyxRQUFiLElBQXlCQSxRQUFRLEtBQUssUUFBMUMsRUFBb0Q7VUFDbERDLFVBQVUsR0FBRzNCLHdCQUF3QixDQUFDVSxNQUFELEVBQVNnQixRQUFULENBQXJDO1VBRUFDLFVBQVUsQ0FBQzNHLEtBQVgsR0FBbUJtRyxVQUFVLENBQUNULE1BQU0sQ0FBQ2dCLFFBQUQsQ0FBUCxFQUFtQk4sS0FBbkIsQ0FBN0I7VUFFQTFCLGNBQWMsQ0FBQ3JCLEtBQUQsRUFBUXFELFFBQVIsRUFBa0JDLFVBQWxCLENBQWQ7UUFDRDtNQUNGO0lBQ0Y7O0lBRUQsT0FBT3RELEtBQVA7RUFDRCxDQS9CRDtFQWlDQTs7Ozs7Ozs7Ozs7RUFTQSxNQUFNdUQsY0FBYyxHQUFJQyxNQUFELElBQVc7SUFDaEMsSUFBSUMsS0FBSyxHQUFHLEVBQVo7O0lBRUEsSUFBSUQsTUFBTSxDQUFDRSxNQUFYLEVBQW1CO01BQ2pCRCxLQUFLLElBQUksR0FBVDtJQUNEOztJQUVELElBQUlELE1BQU0sQ0FBQ0csVUFBWCxFQUF1QjtNQUNyQkYsS0FBSyxJQUFJLEdBQVQ7SUFDRDs7SUFFRCxJQUFJRCxNQUFNLENBQUNJLFNBQVgsRUFBc0I7TUFDcEJILEtBQUssSUFBSSxHQUFUO0lBQ0Q7O0lBRUQsSUFBSUQsTUFBTSxDQUFDSyxPQUFYLEVBQW9CO01BQ2xCSixLQUFLLElBQUksR0FBVDtJQUNEOztJQUVELElBQUlELE1BQU0sQ0FBQ00sTUFBWCxFQUFtQjtNQUNqQkwsS0FBSyxJQUFJLEdBQVQ7SUFDRDs7SUFFRCxPQUFPQSxLQUFQO0VBQ0QsQ0F4QkQ7O0VBMEJBLE1BQU07SUFBRU07RUFBRixJQUFjQyxLQUFwQjs7RUFFQSxNQUFNQyxXQUFXLEdBQUcsQ0FBQyxNQUFLO0lBQ3hCO0lBQ0EsSUFBSSxPQUFPQyxJQUFQLEtBQWdCLFdBQXBCLEVBQWlDO01BQy9CO01BQ0EsT0FBT0EsSUFBUDtJQUNEOztJQUVELElBQUksT0FBTzNJLE1BQVAsS0FBa0IsV0FBdEIsRUFBbUM7TUFDakMsT0FBT0EsTUFBUDtJQUNEOztJQUVELElBQUksT0FBTzRJLFVBQVAsS0FBc0IsV0FBMUIsRUFBdUM7TUFDckMsT0FBT0EsVUFBUDtJQUNEOztJQUVELElBQUloSSxPQUFPLElBQUlBLE9BQU8sQ0FBQ0MsS0FBdkIsRUFBOEI7TUFDNUJELE9BQU8sQ0FBQ0MsS0FBUixDQUFjLG1EQUFkO0lBQ0Q7RUFDRixDQWxCbUIsR0FBcEI7RUFvQkE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQW1CQSxTQUFTNEQsS0FBVCxDQUFlcUMsTUFBZixFQUF1QjNCLE9BQU8sR0FBRyxJQUFqQyxFQUFxQztJQUNuQztJQUNBLE1BQU0wRCxRQUFRLEdBQUcsQ0FBQyxFQUFFMUQsT0FBTyxJQUFJQSxPQUFPLENBQUMwRCxRQUFyQixDQUFsQjtJQUNBLE1BQU0xQixLQUFLLEdBQUloQyxPQUFPLElBQUlBLE9BQU8sQ0FBQ2dDLEtBQXBCLElBQThCdUIsV0FBNUM7SUFFQSxNQUFNSSxjQUFjLEdBQUdELFFBQVEsR0FDM0JsQixvQkFEMkIsR0FFM0JMLG1CQUZKO0lBSUE7Ozs7Ozs7Ozs7SUFTQSxNQUFNQyxVQUFVLEdBQUcsQ0FDakJULE1BRGlCLEVBRWpCVSxLQUZpQixLQUdmO01BQ0YsSUFBSSxDQUFDVixNQUFELElBQVcsT0FBT0EsTUFBUCxLQUFrQixRQUE3QixJQUF5Q1UsS0FBSyxDQUFDekQsR0FBTixDQUFVK0MsTUFBVixDQUE3QyxFQUFnRTtRQUM5RCxPQUFPQSxNQUFQO01BQ0QsQ0FIQyxDQUtGOzs7TUFDQSxJQUFJLE9BQU9pQyxXQUFQLEtBQXVCLFdBQXZCLElBQXNDakMsTUFBTSxZQUFZaUMsV0FBNUQsRUFBeUU7UUFDdkUsT0FBT2pDLE1BQU0sQ0FBQ2tDLFNBQVAsQ0FBaUIsS0FBakIsQ0FBUDtNQUNEOztNQUVELE1BQU1DLFdBQVcsR0FBR25DLE1BQU0sQ0FBQ00sV0FBM0IsQ0FWRSxDQVlGOztNQUNBLElBQUk2QixXQUFXLEtBQUs5QixLQUFLLENBQUM1RyxNQUExQixFQUFrQztRQUNoQ2lILEtBQUssQ0FBQ1QsR0FBTixDQUFVRCxNQUFWO1FBRUEsT0FBT2dDLGNBQWMsQ0FBQ2hDLE1BQUQsRUFBU0ssS0FBVCxFQUFnQkksVUFBaEIsRUFBNEJDLEtBQTVCLENBQXJCO01BQ0Q7O01BRUQsSUFBSS9DLEtBQUosQ0FuQkUsQ0FxQkY7O01BQ0EsSUFBSStELE9BQU8sQ0FBQzFCLE1BQUQsQ0FBWCxFQUFxQjtRQUNuQlUsS0FBSyxDQUFDVCxHQUFOLENBQVVELE1BQVYsRUFEbUIsQ0FHbkI7O1FBQ0EsSUFBSStCLFFBQUosRUFBYztVQUNaLE9BQU9sQixvQkFBb0IsQ0FBQ2IsTUFBRCxFQUFTSyxLQUFULEVBQWdCSSxVQUFoQixFQUE0QkMsS0FBNUIsQ0FBM0I7UUFDRDs7UUFFRC9DLEtBQUssR0FBRyxJQUFJd0UsV0FBSixFQUFSOztRQUVBLEtBQUssSUFBSXRELEtBQUssR0FBRyxDQUFqQixFQUFvQkEsS0FBSyxHQUFHbUIsTUFBTSxDQUFDL0QsTUFBbkMsRUFBMkM0QyxLQUFLLEVBQWhELEVBQW9EO1VBQ2xEbEIsS0FBSyxDQUFDa0IsS0FBRCxDQUFMLEdBQWU0QixVQUFVLENBQUNULE1BQU0sQ0FBQ25CLEtBQUQsQ0FBUCxFQUFnQjZCLEtBQWhCLENBQXpCO1FBQ0Q7O1FBRUQsT0FBTy9DLEtBQVA7TUFDRCxDQXJDQyxDQXVDRjs7O01BQ0EsSUFBSXFDLE1BQU0sWUFBWUssS0FBSyxDQUFDeEQsSUFBNUIsRUFBa0M7UUFDaEMsT0FBTyxJQUFJc0YsV0FBSixDQUFnQm5DLE1BQU0sQ0FBQ29DLE9BQVAsRUFBaEIsQ0FBUDtNQUNELENBMUNDLENBNENGOzs7TUFDQSxJQUFJcEMsTUFBTSxZQUFZSyxLQUFLLENBQUNnQyxNQUE1QixFQUFvQztRQUNsQzFFLEtBQUssR0FBRyxJQUFJd0UsV0FBSixDQUNObkMsTUFBTSxDQUFDc0MsTUFERCxFQUVOdEMsTUFBTSxDQUFDb0IsS0FBUCxJQUFnQkYsY0FBYyxDQUFDbEIsTUFBRCxDQUZ4QixDQUFSO1FBS0FyQyxLQUFLLENBQUM0RSxTQUFOLEdBQWtCdkMsTUFBTSxDQUFDdUMsU0FBekI7UUFFQSxPQUFPNUUsS0FBUDtNQUNELENBdERDLENBd0RGOzs7TUFDQSxJQUFJMEMsS0FBSyxDQUFDaEYsR0FBTixJQUFhMkUsTUFBTSxZQUFZSyxLQUFLLENBQUNoRixHQUF6QyxFQUE4QztRQUM1Q3FGLEtBQUssQ0FBQ1QsR0FBTixDQUFVRCxNQUFWO1FBRUFyQyxLQUFLLEdBQUcsSUFBSXdFLFdBQUosRUFBUjtRQUVBbkMsTUFBTSxDQUFDZCxPQUFQLENBQWUsQ0FBQzVFLEtBQUQsRUFBUXFFLEdBQVIsS0FBZTtVQUM1QmhCLEtBQUssQ0FBQ1osR0FBTixDQUFVNEIsR0FBVixFQUFlOEIsVUFBVSxDQUFDbkcsS0FBRCxFQUFRb0csS0FBUixDQUF6QjtRQUNELENBRkQ7UUFJQSxPQUFPL0MsS0FBUDtNQUNELENBbkVDLENBcUVGOzs7TUFDQSxJQUFJMEMsS0FBSyxDQUFDbUMsR0FBTixJQUFheEMsTUFBTSxZQUFZSyxLQUFLLENBQUNtQyxHQUF6QyxFQUE4QztRQUM1QzlCLEtBQUssQ0FBQ1QsR0FBTixDQUFVRCxNQUFWO1FBRUFyQyxLQUFLLEdBQUcsSUFBSXdFLFdBQUosRUFBUjtRQUVBbkMsTUFBTSxDQUFDZCxPQUFQLENBQWdCNUUsS0FBRCxJQUFVO1VBQ3ZCcUQsS0FBSyxDQUFDc0MsR0FBTixDQUFVUSxVQUFVLENBQUNuRyxLQUFELEVBQVFvRyxLQUFSLENBQXBCO1FBQ0QsQ0FGRDtRQUlBLE9BQU8vQyxLQUFQO01BQ0QsQ0FoRkMsQ0FrRkY7OztNQUNBLElBQUkwQyxLQUFLLENBQUNvQyxNQUFOLElBQWdCcEMsS0FBSyxDQUFDb0MsTUFBTixDQUFhQyxRQUFiLENBQXNCMUMsTUFBdEIsQ0FBcEIsRUFBbUQ7UUFDakRyQyxLQUFLLEdBQUcwQyxLQUFLLENBQUNvQyxNQUFOLENBQWFFLFdBQWIsR0FDSnRDLEtBQUssQ0FBQ29DLE1BQU4sQ0FBYUUsV0FBYixDQUF5QjNDLE1BQU0sQ0FBQy9ELE1BQWhDLENBREksR0FFSixJQUFJa0csV0FBSixDQUFnQm5DLE1BQU0sQ0FBQy9ELE1BQXZCLENBRko7UUFJQStELE1BQU0sQ0FBQzRDLElBQVAsQ0FBWWpGLEtBQVo7UUFFQSxPQUFPQSxLQUFQO01BQ0QsQ0EzRkMsQ0E2RkY7OztNQUNBLElBQUkwQyxLQUFLLENBQUN3QyxXQUFWLEVBQXVCO1FBQ3JCO1FBQ0EsSUFBSXhDLEtBQUssQ0FBQ3dDLFdBQU4sQ0FBa0JDLE1BQWxCLENBQXlCOUMsTUFBekIsQ0FBSixFQUFzQztVQUNwQyxPQUFPLElBQUltQyxXQUFKLENBQWdCbkMsTUFBTSxDQUFDbkUsTUFBUCxDQUFjTSxLQUFkLENBQW9CLENBQXBCLENBQWhCLENBQVA7UUFDRCxDQUpvQixDQU1yQjs7O1FBQ0EsSUFBSTZELE1BQU0sWUFBWUssS0FBSyxDQUFDd0MsV0FBNUIsRUFBeUM7VUFDdkMsT0FBTzdDLE1BQU0sQ0FBQzdELEtBQVAsQ0FBYSxDQUFiLENBQVA7UUFDRDtNQUNGLENBeEdDLENBMEdGOzs7TUFDQSxLQUNFO01BQ0N4QyxjQUFjLENBQUNDLElBQWYsQ0FBb0JvRyxNQUFwQixFQUE0QixNQUE1QixLQUF1QyxPQUFPQSxNQUFNLENBQUMrQyxJQUFkLEtBQXVCLFVBQS9ELENBQ0E7TUFEQSxHQUVHL0MsTUFBTSxZQUFZZ0QsS0FGckIsQ0FHQTtNQUhBLEdBSUkzQyxLQUFLLENBQUM0QyxPQUFOLElBQWlCakQsTUFBTSxZQUFZSyxLQUFLLENBQUM0QyxPQUo3QyxDQUtBO01BTEEsR0FNSTVDLEtBQUssQ0FBQ1AsT0FBTixJQUFpQkUsTUFBTSxZQUFZSyxLQUFLLENBQUNQLE9BUi9DLEVBU0U7UUFDQSxPQUFPRSxNQUFQO01BQ0Q7O01BRURVLEtBQUssQ0FBQ1QsR0FBTixDQUFVRCxNQUFWLEVBeEhFLENBMEhGOztNQUNBLE9BQU9nQyxjQUFjLENBQUNoQyxNQUFELEVBQVNLLEtBQVQsRUFBZ0JJLFVBQWhCLEVBQTRCQyxLQUE1QixDQUFyQjtJQUNELENBL0hEOztJQWlJQSxPQUFPRCxVQUFVLENBQUNULE1BQUQsRUFBU0QsV0FBVyxFQUFwQixDQUFqQjtFQUNEO0FBQ0Y7O0FBL3RCRG1ELG1CQUFBQTs7Ozs7O1VDVkE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7V0N0QkE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdEOzs7Ozs7Ozs7Ozs7QUNOQTtBQUVBeEwsdURBQVcsQ0FBQ3dCLE1BQUQsQ0FBWCxDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vc3JjL2hvb2sudHMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uL3NyYy9ob29rLWV4ZWMuanMiXSwic291cmNlc0NvbnRlbnQiOltudWxsLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiaW1wb3J0IHsgaW5zdGFsbEhvb2sgfSBmcm9tICdAYmFjay9ob29rJ1xuXG5pbnN0YWxsSG9vayh3aW5kb3cpXG4iXSwibmFtZXMiOlsiaW5zdGFsbEhvb2siLCJ0YXJnZXQiLCJpc0lmcmFtZSIsImRldnRvb2xzVmVyc2lvbiIsImxpc3RlbmVycyIsImluamVjdElmcmFtZUhvb2siLCJpZnJhbWUiLCJfX3ZkZXZ0b29sc19faW5qZWN0ZWQiLCJpbmplY3QiLCJjb250ZW50V2luZG93IiwiX19WVUVfREVWVE9PTFNfSUZSQU1FX18iLCJzY3JpcHQiLCJjb250ZW50RG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwidGV4dENvbnRlbnQiLCJ0b1N0cmluZyIsImRvY3VtZW50RWxlbWVudCIsImFwcGVuZENoaWxkIiwicGFyZW50Tm9kZSIsInJlbW92ZUNoaWxkIiwiZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJpZnJhbWVDaGVja3MiLCJpbmplY3RUb0lmcmFtZXMiLCJ3aW5kb3ciLCJpZnJhbWVzIiwiZG9jdW1lbnQiLCJxdWVyeVNlbGVjdG9yQWxsIiwiaWZyYW1lVGltZXIiLCJzZXRJbnRlcnZhbCIsImNsZWFySW50ZXJ2YWwiLCJPYmplY3QiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJfX1ZVRV9ERVZUT09MU19HTE9CQUxfSE9PS19fIiwiY29uc29sZSIsImVycm9yIiwiaG9vayIsInNlbmRUb1BhcmVudCIsImNiIiwicGFyZW50Iiwid2FybiIsIlZ1ZSIsInZhbHVlIiwiZW5hYmxlZCIsIm9uIiwiZXZlbnQiLCJmbiIsIm9uY2UiLCJvZmYiLCJlbWl0IiwiYXJncyIsImNsZWFudXBCdWZmZXIiLCJtYXRjaEFyZyIsIl9hIiwidW5kZWZpbmVkIiwiX2J1ZmZlciIsIl9idWZmZXJNYXAiLCJNYXAiLCJfYnVmZmVyVG9SZW1vdmUiLCJzdG9yZSIsImluaXRpYWxTdGF0ZSIsInN0b3JlTW9kdWxlcyIsImZsdXNoU3RvcmVNb2R1bGVzIiwiYXBwcyIsIl9yZXBsYXlCdWZmZXIiLCJidWZmZXIiLCJjbGVhciIsImkiLCJsIiwibGVuZ3RoIiwiYWxsQXJncyIsInNsaWNlIiwiYXBwbHkiLCJwdXNoIiwiJGV2ZW50IiwiYXJndW1lbnRzIiwiY2JzIiwic3BsaWNlIiwicmVzdWx0IiwiY2F0Y2giLCJidWZmZXJlZCIsIkRhdGUiLCJub3ciLCJzZXQiLCJpbkJ1ZmZlciIsImhhcyIsImdldCIsIl9jbGVhbnVwQnVmZmVyIiwiZmlsdGVyIiwiJGluc3BlY3QiLCJfX1ZVRV9ERVZUT09MU19JTlNQRUNUX18iLCJhcHAiLCJ2ZXJzaW9uIiwidHlwZXMiLCJhcHBSZWNvcmQiLCJjbG9uZSIsInN0YXRlIiwib3JpZ1JlcGxhY2VTdGF0ZSIsInJlcGxhY2VTdGF0ZSIsImJpbmQiLCJvcmlnUmVnaXN0ZXIiLCJvcmlnVW5yZWdpc3RlciIsInJlZ2lzdGVyTW9kdWxlIiwicGF0aCIsIm1vZHVsZSIsIm9wdGlvbnMiLCJwcm9jZXNzIiwiZW52IiwiTk9ERV9FTlYiLCJsb2ciLCJ1bnJlZ2lzdGVyTW9kdWxlIiwia2V5Iiwiam9pbiIsImluZGV4IiwiZmluZEluZGV4IiwibSIsImRlZmluZVByb3BlcnR5IiwiX19WVUVfREVWVE9PTFNfSE9PS19SRVBMQVlfXyIsImZvckVhY2giLCJ0b1N0cmluZ0Z1bmN0aW9uIiwiRnVuY3Rpb24iLCJjcmVhdGUiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJnZXRPd25Qcm9wZXJ0eU5hbWVzIiwiZ2V0T3duUHJvcGVydHlTeW1ib2xzIiwiZ2V0UHJvdG90eXBlT2YiLCJwcm9wZXJ0eUlzRW51bWVyYWJsZSIsIlNVUFBPUlRTIiwiU1lNQk9MX1BST1BFUlRJRVMiLCJXRUFLU0VUIiwiV2Vha1NldCIsImNyZWF0ZUNhY2hlIiwib2JqZWN0IiwiYWRkIiwiX3ZhbHVlcyIsImluZGV4T2YiLCJnZXRDbGVhbkNsb25lIiwicmVhbG0iLCJjb25zdHJ1Y3RvciIsIl9fcHJvdG9fXyIsImdldE9iamVjdENsb25lTG9vc2UiLCJoYW5kbGVDb3B5IiwiY2FjaGUiLCJzeW1ib2xzIiwic3ltYm9sIiwiZ2V0T2JqZWN0Q2xvbmVTdHJpY3QiLCJwcm9wZXJ0aWVzIiwiY29uY2F0IiwicHJvcGVydHkiLCJkZXNjcmlwdG9yIiwiZ2V0UmVnRXhwRmxhZ3MiLCJyZWdFeHAiLCJmbGFncyIsImdsb2JhbCIsImlnbm9yZUNhc2UiLCJtdWx0aWxpbmUiLCJ1bmljb2RlIiwic3RpY2t5IiwiaXNBcnJheSIsIkFycmF5IiwiR0xPQkFMX1RISVMiLCJzZWxmIiwiZ2xvYmFsVGhpcyIsImlzU3RyaWN0IiwiZ2V0T2JqZWN0Q2xvbmUiLCJIVE1MRWxlbWVudCIsImNsb25lTm9kZSIsIkNvbnN0cnVjdG9yIiwiZ2V0VGltZSIsIlJlZ0V4cCIsInNvdXJjZSIsImxhc3RJbmRleCIsIlNldCIsIkJ1ZmZlciIsImlzQnVmZmVyIiwiYWxsb2NVbnNhZmUiLCJjb3B5IiwiQXJyYXlCdWZmZXIiLCJpc1ZpZXciLCJ0aGVuIiwiRXJyb3IiLCJXZWFrTWFwIiwiZXhwb3J0cyJdLCJzb3VyY2VSb290IjoiIn0=