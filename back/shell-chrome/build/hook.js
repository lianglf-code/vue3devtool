/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "../app-backend-core/lib/hook.js":
/*!***************************************!*\
  !*** ../app-backend-core/lib/hook.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

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
  let listeners = {};

  function injectIframeHook(iframe) {
    if (iframe.__vdevtools__injected) return;

    try {
      iframe.__vdevtools__injected = true;

      const inject = () => {
        try {
          iframe.contentWindow.__VUE_DEVTOOLS_IFRAME__ = iframe;
          const script = iframe.contentDocument.createElement('script');
          script.textContent = ';(' + installHook.toString() + ')(window, true)';
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
  if (Object.prototype.hasOwnProperty.call(target, '__VUE_DEVTOOLS_GLOBAL_HOOK__')) return;
  let hook;

  if (isIframe) {
    const sendToParent = cb => {
      try {
        const hook = window.parent.__VUE_DEVTOOLS_GLOBAL_HOOK__;

        if (hook) {
          cb(hook);
        } else {
          console.warn('[Vue Devtools] No hook in parent window');
        }
      } catch (e) {
        console.warn('[Vue Devtools] Failed to send message to parend window', e);
      }
    };

    hook = {
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
      }

    };
  } else {
    hook = {
      Vue: null,
      enabled: undefined,
      _buffer: [],
      store: null,
      initialState: null,
      storeModules: null,
      flushStoreModules: null,
      apps: [],

      _replayBuffer(event) {
        const buffer = this._buffer;
        this._buffer = [];

        for (let i = 0, l = buffer.length; i < l; i++) {
          const allArgs = buffer[i];
          allArgs[0] === event // eslint-disable-next-line prefer-spread
          ? this.emit.apply(this, allArgs) : this._buffer.push(allArgs);
        }
      },

      on(event, fn) {
        const $event = '$' + event;

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
          fn.apply(this, args);
        };

        this.on(event, on);
      },

      off(event, fn) {
        event = '$' + event;

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
        const $event = '$' + event;
        let cbs = listeners[$event];

        if (cbs) {
          cbs = cbs.slice();

          for (let i = 0, l = cbs.length; i < l; i++) {
            cbs[i].apply(this, args);
          }
        } else {
          this._buffer.push([event, ...args]);
        }
      }

    };
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
          if (typeof path === 'string') path = [path];
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
          if (typeof path === 'string') path = [path];
          const key = path.join('/');
          const index = hook.storeModules.findIndex(m => m.path.join('/') === key);
          if (index !== -1) hook.storeModules.splice(index, 1);
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
   * @const {Object} SUPPORTS
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
    } // eslint-disable-next-line no-proto


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
    if (typeof self !== 'undefined') {
      return self;
    }

    if (typeof window !== 'undefined') {
      return window;
    }

    if (typeof __webpack_require__.g !== 'undefined') {
      return __webpack_require__.g;
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


      if (object instanceof HTMLElement) {
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
      hasOwnProperty.call(object, 'then') && typeof object.then === 'function' || // errors
      object instanceof Error || // weakmaps
      realm.WeakMap && object instanceof realm.WeakMap || // weaksets
      realm.WeakSet && object instanceof realm.WeakSet) {
        return object;
      }

      cache.add(object); // assume anything left is a custom constructor

      return getObjectClone(object, realm, handleCopy, cache);
    };

    return handleCopy(object, createCache());
  }
}

exports.installHook = installHook;

/***/ }),

/***/ "../shared-utils/lib/backend.js":
/*!**************************************!*\
  !*** ../shared-utils/lib/backend.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.getCatchedGetters = exports.getCustomStoreDetails = exports.getCustomRouterDetails = exports.isVueInstance = exports.getCustomInstanceDetails = exports.getInstanceMap = exports.backendInjections = void 0;
exports.backendInjections = {
  instanceMap: new Map(),
  isVueInstance: () => false,
  getCustomInstanceDetails: () => ({})
};

function getInstanceMap() {
  return exports.backendInjections.instanceMap;
}

exports.getInstanceMap = getInstanceMap;

function getCustomInstanceDetails(instance) {
  return exports.backendInjections.getCustomInstanceDetails(instance);
}

exports.getCustomInstanceDetails = getCustomInstanceDetails;

function isVueInstance(value) {
  return exports.backendInjections.isVueInstance(value);
}

exports.isVueInstance = isVueInstance; // @TODO refactor

function getCustomRouterDetails(router) {
  return {
    _custom: {
      type: 'router',
      display: 'VueRouter',
      value: {
        options: router.options,
        currentRoute: router.currentRoute
      },
      fields: {
        abstract: true
      }
    }
  };
}

exports.getCustomRouterDetails = getCustomRouterDetails; // @TODO refactor

function getCustomStoreDetails(store) {
  return {
    _custom: {
      type: 'store',
      display: 'Store',
      value: {
        state: store.state,
        getters: getCatchedGetters(store)
      },
      fields: {
        abstract: true
      }
    }
  };
}

exports.getCustomStoreDetails = getCustomStoreDetails; // @TODO refactor

function getCatchedGetters(store) {
  const getters = {};
  const origGetters = store.getters || {};
  const keys = Object.keys(origGetters);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    Object.defineProperty(getters, key, {
      enumerable: true,
      get: () => {
        try {
          return origGetters[key];
        } catch (e) {
          return e;
        }
      }
    });
  }

  return getters;
}

exports.getCatchedGetters = getCatchedGetters;

/***/ }),

/***/ "../shared-utils/lib/bridge.js":
/*!*************************************!*\
  !*** ../shared-utils/lib/bridge.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.Bridge = void 0;

const events_1 = __webpack_require__(/*! events */ "../../node_modules/events/events.js");

const BATCH_DURATION = 100;

class Bridge extends events_1.EventEmitter {
  constructor(wall) {
    super();
    this.setMaxListeners(Infinity);
    this.wall = wall;
    wall.listen(messages => {
      if (Array.isArray(messages)) {
        messages.forEach(message => this._emit(message));
      } else {
        this._emit(messages);
      }
    });
    this._batchingQueue = [];
    this._sendingQueue = [];
    this._receivingQueue = [];
    this._sending = false;
    this._time = null;
  }

  send(event, payload) {
    if (Array.isArray(payload)) {
      const lastIndex = payload.length - 1;
      payload.forEach((chunk, index) => {
        this._send({
          event,
          _chunk: chunk,
          last: index === lastIndex
        });
      });

      this._flush();
    } else if (this._time === null) {
      this._send([{
        event,
        payload
      }]);

      this._time = Date.now();
    } else {
      this._batchingQueue.push({
        event,
        payload
      });

      const now = Date.now();

      if (now - this._time > BATCH_DURATION) {
        this._flush();
      } else {
        this._timer = setTimeout(() => this._flush(), BATCH_DURATION);
      }
    }
  }
  /**
   * Log a message to the devtools background page.
   */


  log(message) {
    this.send('log', message);
  }

  _flush() {
    if (this._batchingQueue.length) this._send(this._batchingQueue);
    clearTimeout(this._timer);
    this._batchingQueue = [];
    this._time = null;
  } // @TODO types


  _emit(message) {
    if (typeof message === 'string') {
      this.emit(message);
    } else if (message._chunk) {
      this._receivingQueue.push(message._chunk);

      if (message.last) {
        this.emit(message.event, this._receivingQueue);
        this._receivingQueue = [];
      }
    } else if (message.event) {
      this.emit(message.event, message.payload);
    }
  } // @TODO types


  _send(messages) {
    this._sendingQueue.push(messages);

    this._nextSend();
  }

  _nextSend() {
    if (!this._sendingQueue.length || this._sending) return;
    this._sending = true;

    const messages = this._sendingQueue.shift();

    try {
      this.wall.send(messages);
    } catch (err) {
      if (err.message === 'Message length exceeded maximum allowed length.') {
        this._sendingQueue.splice(0, 0, messages.map(message => [message]));
      }
    }

    this._sending = false;
    requestAnimationFrame(() => this._nextSend());
  }

}

exports.Bridge = Bridge;

/***/ }),

/***/ "../shared-utils/lib/consts.js":
/*!*************************************!*\
  !*** ../shared-utils/lib/consts.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.HookEvents = exports.BridgeSubscriptions = exports.BridgeEvents = exports.BuiltinTabs = void 0;
var BuiltinTabs;

(function (BuiltinTabs) {
  BuiltinTabs["COMPONENTS"] = "components";
  BuiltinTabs["TIMELINE"] = "timeline";
  BuiltinTabs["PLUGINS"] = "plugins";
  BuiltinTabs["SETTINGS"] = "settings";
})(BuiltinTabs = exports.BuiltinTabs || (exports.BuiltinTabs = {}));

var BridgeEvents;

(function (BridgeEvents) {
  // Misc
  BridgeEvents["TO_BACK_SUBSCRIBE"] = "b:subscribe";
  BridgeEvents["TO_BACK_UNSUBSCRIBE"] = "b:unsubscribe";
  /** Backend is ready */

  BridgeEvents["TO_FRONT_READY"] = "f:ready";
  /** Displays the "detected Vue" console log */

  BridgeEvents["TO_BACK_LOG_DETECTED_VUE"] = "b:log-detected-vue";
  /** Force refresh */

  BridgeEvents["TO_BACK_REFRESH"] = "b:refresh";
  /** Tab was switched */

  BridgeEvents["TO_BACK_TAB_SWITCH"] = "b:tab:switch";
  BridgeEvents["TO_BACK_LOG"] = "b:log"; // Apps

  /** App was registered */

  BridgeEvents["TO_FRONT_APP_ADD"] = "f:app:add";
  /** Get app list */

  BridgeEvents["TO_BACK_APP_LIST"] = "b:app:list";
  BridgeEvents["TO_FRONT_APP_LIST"] = "f:app:list";
  BridgeEvents["TO_FRONT_APP_REMOVE"] = "f:app:remove";
  BridgeEvents["TO_BACK_APP_SELECT"] = "b:app:select";
  BridgeEvents["TO_FRONT_APP_SELECTED"] = "f:app:selected"; // Components

  BridgeEvents["TO_BACK_COMPONENT_TREE"] = "b:component:tree";
  BridgeEvents["TO_FRONT_COMPONENT_TREE"] = "f:component:tree";
  BridgeEvents["TO_BACK_COMPONENT_SELECTED_DATA"] = "b:component:selected-data";
  BridgeEvents["TO_FRONT_COMPONENT_SELECTED_DATA"] = "f:component:selected-data";
  BridgeEvents["TO_BACK_COMPONENT_EXPAND"] = "b:component:expand";
  BridgeEvents["TO_FRONT_COMPONENT_EXPAND"] = "f:component:expand";
  BridgeEvents["TO_BACK_COMPONENT_SCROLL_TO"] = "b:component:scroll-to";
  BridgeEvents["TO_BACK_COMPONENT_FILTER"] = "b:component:filter";
  BridgeEvents["TO_BACK_COMPONENT_MOUSE_OVER"] = "b:component:mouse-over";
  BridgeEvents["TO_BACK_COMPONENT_MOUSE_OUT"] = "b:component:mouse-out";
  BridgeEvents["TO_BACK_COMPONENT_CONTEXT_MENU_TARGET"] = "b:component:context-menu-target";
  BridgeEvents["TO_BACK_COMPONENT_EDIT_STATE"] = "b:component:edit-state";
  BridgeEvents["TO_BACK_COMPONENT_PICK"] = "b:component:pick";
  BridgeEvents["TO_FRONT_COMPONENT_PICK"] = "f:component:pick";
  BridgeEvents["TO_BACK_COMPONENT_PICK_CANCELED"] = "b:component:pick-canceled";
  BridgeEvents["TO_FRONT_COMPONENT_PICK_CANCELED"] = "f:component:pick-canceled";
  BridgeEvents["TO_BACK_COMPONENT_INSPECT_DOM"] = "b:component:inspect-dom";
  BridgeEvents["TO_FRONT_COMPONENT_INSPECT_DOM"] = "f:component:inspect-dom";
  BridgeEvents["TO_BACK_COMPONENT_RENDER_CODE"] = "b:component:render-code";
  BridgeEvents["TO_FRONT_COMPONENT_RENDER_CODE"] = "f:component:render-code"; // Timeline

  BridgeEvents["TO_FRONT_TIMELINE_EVENT"] = "f:timeline:event";
  BridgeEvents["TO_BACK_TIMELINE_LAYER_LIST"] = "b:timeline:layer-list";
  BridgeEvents["TO_FRONT_TIMELINE_LAYER_LIST"] = "f:timeline:layer-list";
  BridgeEvents["TO_FRONT_TIMELINE_LAYER_ADD"] = "f:timeline:layer-add";
  BridgeEvents["TO_BACK_TIMELINE_SHOW_SCREENSHOT"] = "b:timeline:show-screenshot";
  BridgeEvents["TO_BACK_TIMELINE_CLEAR"] = "b:timeline:clear";
  BridgeEvents["TO_BACK_TIMELINE_EVENT_DATA"] = "b:timeline:event-data";
  BridgeEvents["TO_FRONT_TIMELINE_EVENT_DATA"] = "f:timeline:event-data";
  BridgeEvents["TO_BACK_TIMELINE_LAYER_LOAD_EVENTS"] = "b:timeline:layer-load-events";
  BridgeEvents["TO_FRONT_TIMELINE_LAYER_LOAD_EVENTS"] = "f:timeline:layer-load-events";
  BridgeEvents["TO_BACK_TIMELINE_LOAD_MARKERS"] = "b:timeline:load-markers";
  BridgeEvents["TO_FRONT_TIMELINE_LOAD_MARKERS"] = "f:timeline:load-markers";
  BridgeEvents["TO_FRONT_TIMELINE_MARKER"] = "f:timeline:marker"; // Plugins

  BridgeEvents["TO_BACK_DEVTOOLS_PLUGIN_LIST"] = "b:devtools-plugin:list";
  BridgeEvents["TO_FRONT_DEVTOOLS_PLUGIN_LIST"] = "f:devtools-plugin:list";
  BridgeEvents["TO_FRONT_DEVTOOLS_PLUGIN_ADD"] = "f:devtools-plugin:add";
  BridgeEvents["TO_BACK_DEVTOOLS_PLUGIN_SETTING_UPDATED"] = "b:devtools-plugin:setting-updated"; // Custom inspectors

  BridgeEvents["TO_BACK_CUSTOM_INSPECTOR_LIST"] = "b:custom-inspector:list";
  BridgeEvents["TO_FRONT_CUSTOM_INSPECTOR_LIST"] = "f:custom-inspector:list";
  BridgeEvents["TO_FRONT_CUSTOM_INSPECTOR_ADD"] = "f:custom-inspector:add";
  BridgeEvents["TO_BACK_CUSTOM_INSPECTOR_TREE"] = "b:custom-inspector:tree";
  BridgeEvents["TO_FRONT_CUSTOM_INSPECTOR_TREE"] = "f:custom-inspector:tree";
  BridgeEvents["TO_BACK_CUSTOM_INSPECTOR_STATE"] = "b:custom-inspector:state";
  BridgeEvents["TO_FRONT_CUSTOM_INSPECTOR_STATE"] = "f:custom-inspector:state";
  BridgeEvents["TO_BACK_CUSTOM_INSPECTOR_EDIT_STATE"] = "b:custom-inspector:edit-state";
  BridgeEvents["TO_BACK_CUSTOM_INSPECTOR_ACTION"] = "b:custom-inspector:action";
  BridgeEvents["TO_FRONT_CUSTOM_INSPECTOR_SELECT_NODE"] = "f:custom-inspector:select-node"; // Custom state

  BridgeEvents["TO_BACK_CUSTOM_STATE_ACTION"] = "b:custom-state:action";
})(BridgeEvents = exports.BridgeEvents || (exports.BridgeEvents = {}));

var BridgeSubscriptions;

(function (BridgeSubscriptions) {
  BridgeSubscriptions["SELECTED_COMPONENT_DATA"] = "component:selected-data";
  BridgeSubscriptions["COMPONENT_TREE"] = "component:tree";
})(BridgeSubscriptions = exports.BridgeSubscriptions || (exports.BridgeSubscriptions = {}));

var HookEvents;

(function (HookEvents) {
  HookEvents["INIT"] = "init";
  HookEvents["APP_INIT"] = "app:init";
  HookEvents["APP_ADD"] = "app:add";
  HookEvents["APP_UNMOUNT"] = "app:unmount";
  HookEvents["COMPONENT_UPDATED"] = "component:updated";
  HookEvents["COMPONENT_ADDED"] = "component:added";
  HookEvents["COMPONENT_REMOVED"] = "component:removed";
  HookEvents["COMPONENT_EMIT"] = "component:emit";
  HookEvents["COMPONENT_HIGHLIGHT"] = "component:highlight";
  HookEvents["COMPONENT_UNHIGHLIGHT"] = "component:unhighlight";
  HookEvents["SETUP_DEVTOOLS_PLUGIN"] = "devtools-plugin:setup";
  HookEvents["TIMELINE_LAYER_ADDED"] = "timeline:layer-added";
  HookEvents["TIMELINE_EVENT_ADDED"] = "timeline:event-added";
  HookEvents["CUSTOM_INSPECTOR_ADD"] = "custom-inspector:add";
  HookEvents["CUSTOM_INSPECTOR_SEND_TREE"] = "custom-inspector:send-tree";
  HookEvents["CUSTOM_INSPECTOR_SEND_STATE"] = "custom-inspector:send-state";
  HookEvents["CUSTOM_INSPECTOR_SELECT_NODE"] = "custom-inspector:select-node";
  HookEvents["PERFORMANCE_START"] = "perf:start";
  HookEvents["PERFORMANCE_END"] = "perf:end";
  HookEvents["PLUGIN_SETTINGS_SET"] = "plugin:settings:set";
  /**
   * @deprecated
   */

  HookEvents["FLUSH"] = "flush";
})(HookEvents = exports.HookEvents || (exports.HookEvents = {}));

/***/ }),

/***/ "../shared-utils/lib/edit.js":
/*!***********************************!*\
  !*** ../shared-utils/lib/edit.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.StateEditor = void 0;

class StateEditor {
  set(object, path, value, cb = null) {
    const sections = Array.isArray(path) ? path : path.split('.');

    while (sections.length > 1) {
      object = object[sections.shift()];

      if (this.isRef(object)) {
        object = this.getRefValue(object);
      }
    }

    const field = sections[0];

    if (cb) {
      cb(object, field, value);
    } else if (this.isRef(object[field])) {
      this.setRefValue(object[field], value);
    } else {
      object[field] = value;
    }
  }

  get(object, path) {
    const sections = Array.isArray(path) ? path : path.split('.');

    for (let i = 0; i < sections.length; i++) {
      object = object[sections[i]];

      if (this.isRef(object)) {
        object = this.getRefValue(object);
      }

      if (!object) {
        return undefined;
      }
    }

    return object;
  }

  has(object, path, parent = false) {
    if (typeof object === 'undefined') {
      return false;
    }

    const sections = Array.isArray(path) ? path.slice() : path.split('.');
    const size = !parent ? 1 : 2;

    while (object && sections.length > size) {
      object = object[sections.shift()];

      if (this.isRef(object)) {
        object = this.getRefValue(object);
      }
    }

    return object != null && Object.prototype.hasOwnProperty.call(object, sections[0]);
  }

  createDefaultSetCallback(state) {
    return (obj, field, value) => {
      if (state.remove || state.newKey) {
        if (Array.isArray(obj)) {
          obj.splice(field, 1);
        } else {
          delete obj[field];
        }
      }

      if (!state.remove) {
        const target = obj[state.newKey || field];

        if (this.isRef(target)) {
          this.setRefValue(target, value);
        } else {
          obj[state.newKey || field] = value;
        }
      }
    };
  }

  isRef(ref) {
    // To implement in subclass
    return false;
  }

  setRefValue(ref, value) {// To implement in subclass
  }

  getRefValue(ref) {
    // To implement in subclass
    return ref;
  }

}

exports.StateEditor = StateEditor;

/***/ }),

/***/ "../shared-utils/lib/env.js":
/*!**********************************!*\
  !*** ../shared-utils/lib/env.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.initEnv = exports.keys = exports.isLinux = exports.isMac = exports.isWindows = exports.isFirefox = exports.isChrome = exports.target = exports.isBrowser = void 0;
exports.isBrowser = typeof navigator !== 'undefined';
exports.target = exports.isBrowser ? window : typeof __webpack_require__.g !== 'undefined' ? __webpack_require__.g : {};
exports.isChrome = typeof exports.target.chrome !== 'undefined' && !!exports.target.chrome.devtools;
exports.isFirefox = exports.isBrowser && navigator.userAgent.indexOf('Firefox') > -1;
exports.isWindows = exports.isBrowser && navigator.platform.indexOf('Win') === 0;
exports.isMac = exports.isBrowser && navigator.platform === 'MacIntel';
exports.isLinux = exports.isBrowser && navigator.platform.indexOf('Linux') === 0;
exports.keys = {
  ctrl: exports.isMac ? '&#8984;' : 'Ctrl',
  shift: 'Shift',
  alt: exports.isMac ? '&#8997;' : 'Alt',
  del: 'Del',
  enter: 'Enter',
  esc: 'Esc'
};

function initEnv(Vue) {
  if (Vue.prototype.hasOwnProperty('$isChrome')) return;
  Object.defineProperties(Vue.prototype, {
    $isChrome: {
      get: () => exports.isChrome
    },
    $isFirefox: {
      get: () => exports.isFirefox
    },
    $isWindows: {
      get: () => exports.isWindows
    },
    $isMac: {
      get: () => exports.isMac
    },
    $isLinux: {
      get: () => exports.isLinux
    },
    $keys: {
      get: () => exports.keys
    }
  });
  if (exports.isWindows) document.body.classList.add('platform-windows');
  if (exports.isMac) document.body.classList.add('platform-mac');
  if (exports.isLinux) document.body.classList.add('platform-linux');
}

exports.initEnv = initEnv;

/***/ }),

/***/ "../shared-utils/lib/index.js":
/*!************************************!*\
  !*** ../shared-utils/lib/index.js ***!
  \************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {



var __createBinding = this && this.__createBinding || (Object.create ? function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  Object.defineProperty(o, k2, {
    enumerable: true,
    get: function () {
      return m[k];
    }
  });
} : function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
});

var __exportStar = this && this.__exportStar || function (m, exports) {
  for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};

Object.defineProperty(exports, "__esModule", ({
  value: true
}));

__exportStar(__webpack_require__(/*! ./backend */ "../shared-utils/lib/backend.js"), exports);

__exportStar(__webpack_require__(/*! ./bridge */ "../shared-utils/lib/bridge.js"), exports);

__exportStar(__webpack_require__(/*! ./consts */ "../shared-utils/lib/consts.js"), exports);

__exportStar(__webpack_require__(/*! ./edit */ "../shared-utils/lib/edit.js"), exports);

__exportStar(__webpack_require__(/*! ./env */ "../shared-utils/lib/env.js"), exports);

__exportStar(__webpack_require__(/*! ./plugin-permissions */ "../shared-utils/lib/plugin-permissions.js"), exports);

__exportStar(__webpack_require__(/*! ./plugin-settings */ "../shared-utils/lib/plugin-settings.js"), exports);

__exportStar(__webpack_require__(/*! ./shared-data */ "../shared-utils/lib/shared-data.js"), exports);

__exportStar(__webpack_require__(/*! ./shell */ "../shared-utils/lib/shell.js"), exports);

__exportStar(__webpack_require__(/*! ./storage */ "../shared-utils/lib/storage.js"), exports);

__exportStar(__webpack_require__(/*! ./transfer */ "../shared-utils/lib/transfer.js"), exports);

__exportStar(__webpack_require__(/*! ./util */ "../shared-utils/lib/util.js"), exports);

/***/ }),

/***/ "../shared-utils/lib/plugin-permissions.js":
/*!*************************************************!*\
  !*** ../shared-utils/lib/plugin-permissions.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.setPluginPermission = exports.hasPluginPermission = exports.PluginPermission = void 0;

const shared_data_1 = __webpack_require__(/*! ./shared-data */ "../shared-utils/lib/shared-data.js");

var PluginPermission;

(function (PluginPermission) {
  PluginPermission["ENABLED"] = "enabled";
  PluginPermission["COMPONENTS"] = "components";
  PluginPermission["CUSTOM_INSPECTOR"] = "custom-inspector";
  PluginPermission["TIMELINE"] = "timeline";
})(PluginPermission = exports.PluginPermission || (exports.PluginPermission = {}));

function hasPluginPermission(pluginId, permission) {
  const result = shared_data_1.SharedData.pluginPermissions[`${pluginId}:${permission}`];
  if (result == null) return true;
  return !!result;
}

exports.hasPluginPermission = hasPluginPermission;

function setPluginPermission(pluginId, permission, active) {
  shared_data_1.SharedData.pluginPermissions = { ...shared_data_1.SharedData.pluginPermissions,
    [`${pluginId}:${permission}`]: active
  };
}

exports.setPluginPermission = setPluginPermission;

/***/ }),

/***/ "../shared-utils/lib/plugin-settings.js":
/*!**********************************************!*\
  !*** ../shared-utils/lib/plugin-settings.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.getPluginDefaultSettings = exports.setPluginSettings = exports.getPluginSettings = void 0;

const shared_data_1 = __webpack_require__(/*! ./shared-data */ "../shared-utils/lib/shared-data.js");

function getPluginSettings(pluginId, defaultSettings) {
  var _a;

  return { ...(defaultSettings !== null && defaultSettings !== void 0 ? defaultSettings : {}),
    ...((_a = shared_data_1.SharedData.pluginSettings[pluginId]) !== null && _a !== void 0 ? _a : {})
  };
}

exports.getPluginSettings = getPluginSettings;

function setPluginSettings(pluginId, settings) {
  shared_data_1.SharedData.pluginSettings = { ...shared_data_1.SharedData.pluginSettings,
    [pluginId]: settings
  };
}

exports.setPluginSettings = setPluginSettings;

function getPluginDefaultSettings(schema) {
  const result = {};

  if (schema) {
    for (const id in schema) {
      const item = schema[id];
      result[id] = item.defaultValue;
    }
  }

  return result;
}

exports.getPluginDefaultSettings = getPluginDefaultSettings;

/***/ }),

/***/ "../shared-utils/lib/shared-data.js":
/*!******************************************!*\
  !*** ../shared-utils/lib/shared-data.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.SharedData = exports.watchSharedData = exports.destroySharedData = exports.onSharedDataInit = exports.initSharedData = void 0;

const storage_1 = __webpack_require__(/*! ./storage */ "../shared-utils/lib/storage.js");

const env_1 = __webpack_require__(/*! ./env */ "../shared-utils/lib/env.js"); // Initial state


const internalSharedData = {
  openInEditorHost: '/',
  componentNameStyle: 'class',
  theme: 'auto',
  displayDensity: 'low',
  timeFormat: 'default',
  recordVuex: true,
  cacheVuexSnapshotsEvery: 50,
  cacheVuexSnapshotsLimit: 10,
  snapshotLoading: false,
  componentEventsEnabled: true,
  performanceMonitoringEnabled: true,
  editableProps: false,
  logDetected: true,
  vuexNewBackend: false,
  vuexAutoload: false,
  vuexGroupGettersByModule: true,
  showMenuScrollTip: true,
  timelineTimeGrid: true,
  timelineScreenshots: true,
  menuStepScrolling: env_1.isMac,
  pluginPermissions: {},
  pluginSettings: {},
  pageConfig: {},
  debugInfo: false
};
const persisted = ['componentNameStyle', 'theme', 'displayDensity', 'recordVuex', 'editableProps', 'logDetected', 'vuexNewBackend', 'vuexAutoload', 'vuexGroupGettersByModule', 'timeFormat', 'showMenuScrollTip', 'timelineTimeGrid', 'timelineScreenshots', 'menuStepScrolling', 'pluginPermissions', 'pluginSettings', 'performanceMonitoringEnabled', 'componentEventsEnabled', 'debugInfo'];
const storageVersion = '6.0.0-alpha.1'; // ---- INTERNALS ---- //

let bridge; // List of fields to persist to storage (disabled if 'false')
// This should be unique to each shared data client to prevent conflicts

let persist = false;
let data;
let initRetryInterval;
let initRetryCount = 0;
const initCbs = [];

function initSharedData(params) {
  return new Promise(resolve => {
    // Mandatory params
    bridge = params.bridge;
    persist = !!params.persist;

    if (persist) {
      if (true) {
        // eslint-disable-next-line no-console
        console.log('[shared data] Master init in progress...');
      } // Load persisted fields


      persisted.forEach(key => {
        const value = (0, storage_1.getStorage)(`vue-devtools-${storageVersion}:shared-data:${key}`);

        if (value !== null) {
          internalSharedData[key] = value;
        }
      });
      bridge.on('shared-data:load', () => {
        // Send all fields
        Object.keys(internalSharedData).forEach(key => {
          sendValue(key, internalSharedData[key]);
        });
        bridge.send('shared-data:load-complete');
      });
      bridge.on('shared-data:init-complete', () => {
        if (true) {
          // eslint-disable-next-line no-console
          console.log('[shared data] Master init complete');
        }

        clearInterval(initRetryInterval);
        resolve();
      });
      bridge.send('shared-data:master-init-waiting'); // In case backend init is executed after frontend

      bridge.on('shared-data:minion-init-waiting', () => {
        bridge.send('shared-data:master-init-waiting');
      });
      initRetryCount = 0;
      clearInterval(initRetryInterval);
      initRetryInterval = setInterval(() => {
        if (true) {
          // eslint-disable-next-line no-console
          console.log('[shared data] Master init retrying...');
        }

        bridge.send('shared-data:master-init-waiting');
        initRetryCount++;

        if (initRetryCount > 30) {
          clearInterval(initRetryInterval);
          console.error('[shared data] Master init failed');
        }
      }, 2000);
    } else {
      if (true) {
        // eslint-disable-next-line no-console
        console.log('[shared data] Minion init in progress...');
      }

      bridge.on('shared-data:master-init-waiting', () => {
        if (true) {
          // eslint-disable-next-line no-console
          console.log('[shared data] Minion loading data...');
        } // Load all persisted shared data


        bridge.send('shared-data:load');
        bridge.once('shared-data:load-complete', () => {
          if (true) {
            // eslint-disable-next-line no-console
            console.log('[shared data] Minion init complete');
          }

          bridge.send('shared-data:init-complete');
          resolve();
        });
      });
      bridge.send('shared-data:minion-init-waiting');
    }

    data = { ...internalSharedData
    };

    if (params.Vue) {
      data = params.Vue.observable(data);
    } // Update value from other shared data clients


    bridge.on('shared-data:set', ({
      key,
      value
    }) => {
      setValue(key, value);
    });
    initCbs.forEach(cb => cb());
  });
}

exports.initSharedData = initSharedData;

function onSharedDataInit(cb) {
  initCbs.push(cb);
  return () => {
    const index = initCbs.indexOf(cb);
    if (index !== -1) initCbs.splice(index, 1);
  };
}

exports.onSharedDataInit = onSharedDataInit;

function destroySharedData() {
  bridge.removeAllListeners('shared-data:set');
  watchers = {};
}

exports.destroySharedData = destroySharedData;
let watchers = {};

function setValue(key, value) {
  // Storage
  if (persist && persisted.includes(key)) {
    (0, storage_1.setStorage)(`vue-devtools-${storageVersion}:shared-data:${key}`, value);
  }

  const oldValue = data[key];
  data[key] = value;
  const handlers = watchers[key];

  if (handlers) {
    handlers.forEach(h => h(value, oldValue));
  } // Validate Proxy set trap


  return true;
}

function sendValue(key, value) {
  bridge && bridge.send('shared-data:set', {
    key,
    value
  });
}

function watchSharedData(prop, handler) {
  const list = watchers[prop] || (watchers[prop] = []);
  list.push(handler);
  return () => {
    const index = list.indexOf(handler);
    if (index !== -1) list.splice(index, 1);
  };
}

exports.watchSharedData = watchSharedData;
const proxy = {};
Object.keys(internalSharedData).forEach(key => {
  Object.defineProperty(proxy, key, {
    configurable: false,
    get: () => data[key],
    set: value => {
      sendValue(key, value);
      setValue(key, value);
    }
  });
});
exports.SharedData = proxy;

/***/ }),

/***/ "../shared-utils/lib/shell.js":
/*!************************************!*\
  !*** ../shared-utils/lib/shell.js ***!
  \************************************/
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));

/***/ }),

/***/ "../shared-utils/lib/storage.js":
/*!**************************************!*\
  !*** ../shared-utils/lib/storage.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.clearStorage = exports.removeStorage = exports.setStorage = exports.getStorage = exports.initStorage = void 0;

const env_1 = __webpack_require__(/*! ./env */ "../shared-utils/lib/env.js"); // If we can, we use the browser extension API to store data
// it's async though, so we synchronize changes from an intermediate
// storageData object


const useStorage = typeof env_1.target.chrome !== 'undefined' && typeof env_1.target.chrome.storage !== 'undefined';
let storageData = null;

function initStorage() {
  return new Promise(resolve => {
    if (useStorage) {
      env_1.target.chrome.storage.local.get(null, result => {
        storageData = result;
        resolve();
      });
    } else {
      storageData = {};
      resolve();
    }
  });
}

exports.initStorage = initStorage;

function getStorage(key, defaultValue = null) {
  checkStorage();

  if (useStorage) {
    return getDefaultValue(storageData[key], defaultValue);
  } else {
    try {
      return getDefaultValue(JSON.parse(localStorage.getItem(key)), defaultValue);
    } catch (e) {}
  }
}

exports.getStorage = getStorage;

function setStorage(key, val) {
  checkStorage();

  if (useStorage) {
    storageData[key] = val;
    env_1.target.chrome.storage.local.set({
      [key]: val
    });
  } else {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }
}

exports.setStorage = setStorage;

function removeStorage(key) {
  checkStorage();

  if (useStorage) {
    delete storageData[key];
    env_1.target.chrome.storage.local.remove([key]);
  } else {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  }
}

exports.removeStorage = removeStorage;

function clearStorage() {
  checkStorage();

  if (useStorage) {
    storageData = {};
    env_1.target.chrome.storage.local.clear();
  } else {
    try {
      localStorage.clear();
    } catch (e) {}
  }
}

exports.clearStorage = clearStorage;

function checkStorage() {
  if (!storageData) {
    throw new Error('Storage wasn\'t initialized with \'init()\'');
  }
}

function getDefaultValue(value, defaultValue) {
  if (value == null) {
    return defaultValue;
  }

  return value;
}

/***/ }),

/***/ "../shared-utils/lib/transfer.js":
/*!***************************************!*\
  !*** ../shared-utils/lib/transfer.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.stringifyStrictCircularAutoChunks = exports.parseCircularAutoChunks = exports.stringifyCircularAutoChunks = void 0;
const MAX_SERIALIZED_SIZE = 512 * 1024; // 1MB

function encode(data, replacer, list, seen) {
  let stored, key, value, i, l;
  const seenIndex = seen.get(data);

  if (seenIndex != null) {
    return seenIndex;
  }

  const index = list.length;
  const proto = Object.prototype.toString.call(data);

  if (proto === '[object Object]') {
    stored = {};
    seen.set(data, index);
    list.push(stored);
    const keys = Object.keys(data);

    for (i = 0, l = keys.length; i < l; i++) {
      key = keys[i];
      value = data[key];
      if (replacer) value = replacer.call(data, key, value);
      stored[key] = encode(value, replacer, list, seen);
    }
  } else if (proto === '[object Array]') {
    stored = [];
    seen.set(data, index);
    list.push(stored);

    for (i = 0, l = data.length; i < l; i++) {
      value = data[i];
      if (replacer) value = replacer.call(data, i, value);
      stored[i] = encode(value, replacer, list, seen);
    }
  } else {
    list.push(data);
  }

  return index;
}

function decode(list, reviver) {
  let i = list.length;
  let j, k, data, key, value, proto;

  while (i--) {
    data = list[i];
    proto = Object.prototype.toString.call(data);

    if (proto === '[object Object]') {
      const keys = Object.keys(data);

      for (j = 0, k = keys.length; j < k; j++) {
        key = keys[j];
        value = list[data[key]];
        if (reviver) value = reviver.call(data, key, value);
        data[key] = value;
      }
    } else if (proto === '[object Array]') {
      for (j = 0, k = data.length; j < k; j++) {
        value = list[data[j]];
        if (reviver) value = reviver.call(data, j, value);
        data[j] = value;
      }
    }
  }
}

function stringifyCircularAutoChunks(data, replacer = null, space = null) {
  let result;

  try {
    result = arguments.length === 1 ? JSON.stringify(data) // @ts-ignore
    : JSON.stringify(data, replacer, space);
  } catch (e) {
    result = stringifyStrictCircularAutoChunks(data, replacer, space);
  }

  if (result.length > MAX_SERIALIZED_SIZE) {
    const chunkCount = Math.ceil(result.length / MAX_SERIALIZED_SIZE);
    const chunks = [];

    for (let i = 0; i < chunkCount; i++) {
      chunks.push(result.slice(i * MAX_SERIALIZED_SIZE, (i + 1) * MAX_SERIALIZED_SIZE));
    }

    return chunks;
  }

  return result;
}

exports.stringifyCircularAutoChunks = stringifyCircularAutoChunks;

function parseCircularAutoChunks(data, reviver = null) {
  if (Array.isArray(data)) {
    data = data.join('');
  }

  const hasCircular = /^\s/.test(data);

  if (!hasCircular) {
    return arguments.length === 1 ? JSON.parse(data) // @ts-ignore
    : JSON.parse(data, reviver);
  } else {
    const list = JSON.parse(data);
    decode(list, reviver);
    return list[0];
  }
}

exports.parseCircularAutoChunks = parseCircularAutoChunks;

function stringifyStrictCircularAutoChunks(data, replacer = null, space = null) {
  const list = [];
  encode(data, replacer, list, new Map());
  return space ? ' ' + JSON.stringify(list, null, space) : ' ' + JSON.stringify(list);
}

exports.stringifyStrictCircularAutoChunks = stringifyStrictCircularAutoChunks;

/***/ }),

/***/ "../shared-utils/lib/util.js":
/*!***********************************!*\
  !*** ../shared-utils/lib/util.js ***!
  \***********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {



var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.isEmptyObject = exports.copyToClipboard = exports.escape = exports.openInEditor = exports.focusInput = exports.simpleGet = exports.sortByKey = exports.searchDeepInObject = exports.isPlainObject = exports.revive = exports.parse = exports.getCustomRefDetails = exports.getCustomHTMLElementDetails = exports.getCustomFunctionDetails = exports.getCustomComponentDefinitionDetails = exports.getComponentName = exports.reviveSet = exports.getCustomSetDetails = exports.reviveMap = exports.getCustomMapDetails = exports.stringify = exports.specialTokenToString = exports.MAX_ARRAY_SIZE = exports.MAX_STRING_SIZE = exports.SPECIAL_TOKENS = exports.NAN = exports.NEGATIVE_INFINITY = exports.INFINITY = exports.UNDEFINED = exports.inDoc = exports.getComponentDisplayName = exports.kebabize = exports.camelize = exports.classify = void 0;

const path_1 = __importDefault(__webpack_require__(/*! path */ "../../node_modules/path-browserify/index.js"));

const transfer_1 = __webpack_require__(/*! ./transfer */ "../shared-utils/lib/transfer.js");

const backend_1 = __webpack_require__(/*! ./backend */ "../shared-utils/lib/backend.js");

const shared_data_1 = __webpack_require__(/*! ./shared-data */ "../shared-utils/lib/shared-data.js");

const env_1 = __webpack_require__(/*! ./env */ "../shared-utils/lib/env.js");

function cached(fn) {
  const cache = Object.create(null);
  return function cachedFn(str) {
    const hit = cache[str];
    return hit || (cache[str] = fn(str));
  };
}

const classifyRE = /(?:^|[-_/])(\w)/g;
exports.classify = cached(str => {
  return str && str.replace(classifyRE, toUpper);
});
const camelizeRE = /-(\w)/g;
exports.camelize = cached(str => {
  return str && str.replace(camelizeRE, toUpper);
});
const kebabizeRE = /([a-z0-9])([A-Z])/g;
exports.kebabize = cached(str => {
  return str && str.replace(kebabizeRE, (_, lowerCaseCharacter, upperCaseLetter) => {
    return `${lowerCaseCharacter}-${upperCaseLetter}`;
  }).toLowerCase();
});

function toUpper(_, c) {
  return c ? c.toUpperCase() : '';
}

function getComponentDisplayName(originalName, style = 'class') {
  switch (style) {
    case 'class':
      return (0, exports.classify)(originalName);

    case 'kebab':
      return (0, exports.kebabize)(originalName);

    case 'original':
    default:
      return originalName;
  }
}

exports.getComponentDisplayName = getComponentDisplayName;

function inDoc(node) {
  if (!node) return false;
  const doc = node.ownerDocument.documentElement;
  const parent = node.parentNode;
  return doc === node || doc === parent || !!(parent && parent.nodeType === 1 && doc.contains(parent));
}

exports.inDoc = inDoc;
/**
 * Stringify/parse data using CircularJSON.
 */

exports.UNDEFINED = '__vue_devtool_undefined__';
exports.INFINITY = '__vue_devtool_infinity__';
exports.NEGATIVE_INFINITY = '__vue_devtool_negative_infinity__';
exports.NAN = '__vue_devtool_nan__';
exports.SPECIAL_TOKENS = {
  true: true,
  false: false,
  undefined: exports.UNDEFINED,
  null: null,
  '-Infinity': exports.NEGATIVE_INFINITY,
  Infinity: exports.INFINITY,
  NaN: exports.NAN
};
exports.MAX_STRING_SIZE = 10000;
exports.MAX_ARRAY_SIZE = 5000;

function specialTokenToString(value) {
  if (value === null) {
    return 'null';
  } else if (value === exports.UNDEFINED) {
    return 'undefined';
  } else if (value === exports.NAN) {
    return 'NaN';
  } else if (value === exports.INFINITY) {
    return 'Infinity';
  } else if (value === exports.NEGATIVE_INFINITY) {
    return '-Infinity';
  }

  return false;
}

exports.specialTokenToString = specialTokenToString;
/**
 * Needed to prevent stack overflow
 * while replacing complex objects
 * like components because we create
 * new objects with the CustomValue API
 * (.i.e `{ _custom: { ... } }`)
 */

class EncodeCache {
  constructor() {
    this.map = new Map();
  }
  /**
   * Returns a result unique to each input data
   * @param {*} data Input data
   * @param {*} factory Function used to create the unique result
   */


  cache(data, factory) {
    const cached = this.map.get(data);

    if (cached) {
      return cached;
    } else {
      const result = factory(data);
      this.map.set(data, result);
      return result;
    }
  }

  clear() {
    this.map.clear();
  }

}

const encodeCache = new EncodeCache();

class ReviveCache {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.map = new Map();
    this.index = 0;
    this.size = 0;
  }

  cache(value) {
    const currentIndex = this.index;
    this.map.set(currentIndex, value);
    this.size++;

    if (this.size > this.maxSize) {
      this.map.delete(currentIndex - this.size);
      this.size--;
    }

    this.index++;
    return currentIndex;
  }

  read(id) {
    return this.map.get(id);
  }

}

const reviveCache = new ReviveCache(1000);

function stringify(data) {
  // Create a fresh cache for each serialization
  encodeCache.clear();
  return (0, transfer_1.stringifyCircularAutoChunks)(data, replacer);
}

exports.stringify = stringify;

function replacer(key) {
  // @ts-ignore
  const val = this[key];
  const type = typeof val;

  if (Array.isArray(val)) {
    const l = val.length;

    if (l > exports.MAX_ARRAY_SIZE) {
      return {
        _isArray: true,
        length: l,
        items: val.slice(0, exports.MAX_ARRAY_SIZE)
      };
    }

    return val;
  } else if (typeof val === 'string') {
    if (val.length > exports.MAX_STRING_SIZE) {
      return val.substr(0, exports.MAX_STRING_SIZE) + `... (${val.length} total length)`;
    } else {
      return val;
    }
  } else if (type === 'undefined') {
    return exports.UNDEFINED;
  } else if (val === Infinity) {
    return exports.INFINITY;
  } else if (val === -Infinity) {
    return exports.NEGATIVE_INFINITY;
  } else if (type === 'function') {
    return getCustomFunctionDetails(val);
  } else if (type === 'symbol') {
    return `[native Symbol ${Symbol.prototype.toString.call(val)}]`;
  } else if (val !== null && type === 'object') {
    const proto = Object.prototype.toString.call(val);

    if (proto === '[object Map]') {
      return encodeCache.cache(val, () => getCustomMapDetails(val));
    } else if (proto === '[object Set]') {
      return encodeCache.cache(val, () => getCustomSetDetails(val));
    } else if (proto === '[object RegExp]') {
      // special handling of native type
      return `[native RegExp ${RegExp.prototype.toString.call(val)}]`;
    } else if (proto === '[object Date]') {
      return `[native Date ${Date.prototype.toString.call(val)}]`;
    } else if (proto === '[object Error]') {
      return `[native Error ${val.message}<>${val.stack}]`;
    } else if (val.state && val._vm) {
      return encodeCache.cache(val, () => (0, backend_1.getCustomStoreDetails)(val));
    } else if (val.constructor && val.constructor.name === 'VueRouter') {
      return encodeCache.cache(val, () => (0, backend_1.getCustomRouterDetails)(val));
    } else if ((0, backend_1.isVueInstance)(val)) {
      return encodeCache.cache(val, () => (0, backend_1.getCustomInstanceDetails)(val));
    } else if (typeof val.render === 'function') {
      return encodeCache.cache(val, () => getCustomComponentDefinitionDetails(val));
    } else if (val.constructor && val.constructor.name === 'VNode') {
      return `[native VNode <${val.tag}>]`;
    } else if (val instanceof HTMLElement) {
      return encodeCache.cache(val, () => getCustomHTMLElementDetails(val));
    }
  } else if (Number.isNaN(val)) {
    return exports.NAN;
  }

  return sanitize(val);
}

function getCustomMapDetails(val) {
  const list = [];
  val.forEach((value, key) => list.push({
    key,
    value
  }));
  return {
    _custom: {
      type: 'map',
      display: 'Map',
      value: list,
      readOnly: true,
      fields: {
        abstract: true
      }
    }
  };
}

exports.getCustomMapDetails = getCustomMapDetails;

function reviveMap(val) {
  const result = new Map();
  const list = val._custom.value;

  for (let i = 0; i < list.length; i++) {
    const {
      key,
      value
    } = list[i];
    result.set(key, revive(value));
  }

  return result;
}

exports.reviveMap = reviveMap;

function getCustomSetDetails(val) {
  const list = Array.from(val);
  return {
    _custom: {
      type: 'set',
      display: `Set[${list.length}]`,
      value: list,
      readOnly: true
    }
  };
}

exports.getCustomSetDetails = getCustomSetDetails;

function reviveSet(val) {
  const result = new Set();
  const list = val._custom.value;

  for (let i = 0; i < list.length; i++) {
    const value = list[i];
    result.add(revive(value));
  }

  return result;
}

exports.reviveSet = reviveSet; // Use a custom basename functions instead of the shimed version
// because it doesn't work on Windows

function basename(filename, ext) {
  return path_1.default.basename(filename.replace(/^[a-zA-Z]:/, '').replace(/\\/g, '/'), ext);
}

function getComponentName(options) {
  const name = options.displayName || options.name || options._componentTag;

  if (name) {
    return name;
  }

  const file = options.__file; // injected by vue-loader

  if (file) {
    return (0, exports.classify)(basename(file, '.vue'));
  }
}

exports.getComponentName = getComponentName;

function getCustomComponentDefinitionDetails(def) {
  let display = getComponentName(def);

  if (display) {
    if (def.name && def.__file) {
      display += ` <span>(${def.__file})</span>`;
    }
  } else {
    display = '<i>Unknown Component</i>';
  }

  return {
    _custom: {
      type: 'component-definition',
      display,
      tooltip: 'Component definition',
      ...(def.__file ? {
        file: def.__file
      } : {})
    }
  };
}

exports.getCustomComponentDefinitionDetails = getCustomComponentDefinitionDetails; // eslint-disable-next-line @typescript-eslint/ban-types

function getCustomFunctionDetails(func) {
  let string = '';
  let matches = null;

  try {
    string = Function.prototype.toString.call(func);
    matches = String.prototype.match.call(string, /\([\s\S]*?\)/);
  } catch (e) {// Func is probably a Proxy, which can break Function.prototype.toString()
  } // Trim any excess whitespace from the argument string


  const match = matches && matches[0];
  const args = typeof match === 'string' ? `(${match.substr(1, match.length - 2).split(',').map(a => a.trim()).join(', ')})` : '(?)';
  const name = typeof func.name === 'string' ? func.name : '';
  return {
    _custom: {
      type: 'function',
      display: `<span>f</span> ${escape(name)}${args}`,
      _reviveId: reviveCache.cache(func)
    }
  };
}

exports.getCustomFunctionDetails = getCustomFunctionDetails;

function getCustomHTMLElementDetails(value) {
  try {
    return {
      _custom: {
        type: 'HTMLElement',
        display: `<span class="opacity-30">&lt;</span><span class="text-blue-500">${value.tagName.toLowerCase()}</span><span class="opacity-30">&gt;</span>`,
        value: namedNodeMapToObject(value.attributes),
        actions: [{
          icon: 'input',
          tooltip: 'Log element to console',
          action: () => {
            // eslint-disable-next-line no-console
            console.log(value);
          }
        }]
      }
    };
  } catch (e) {
    return {
      _custom: {
        type: 'HTMLElement',
        display: `<span class="text-blue-500">${String(value)}</span>`
      }
    };
  }
}

exports.getCustomHTMLElementDetails = getCustomHTMLElementDetails;

function namedNodeMapToObject(map) {
  const result = {};
  const l = map.length;

  for (let i = 0; i < l; i++) {
    const node = map.item(i);
    result[node.name] = node.value;
  }

  return result;
}

function getCustomRefDetails(instance, key, ref) {
  let value;

  if (Array.isArray(ref)) {
    value = ref.map(r => getCustomRefDetails(instance, key, r)).map(data => data.value);
  } else {
    let name;

    if (ref._isVue) {
      name = getComponentName(ref.$options);
    } else {
      name = ref.tagName.toLowerCase();
    }

    value = {
      _custom: {
        display: `&lt;${name}` + (ref.id ? ` <span class="attr-title">id</span>="${ref.id}"` : '') + (ref.className ? ` <span class="attr-title">class</span>="${ref.className}"` : '') + '&gt;',
        uid: instance.__VUE_DEVTOOLS_UID__,
        type: 'reference'
      }
    };
  }

  return {
    type: '$refs',
    key: key,
    value,
    editable: false
  };
}

exports.getCustomRefDetails = getCustomRefDetails;

function parse(data, revive = false) {
  return revive ? (0, transfer_1.parseCircularAutoChunks)(data, reviver) : (0, transfer_1.parseCircularAutoChunks)(data);
}

exports.parse = parse;
const specialTypeRE = /^\[native (\w+) (.*?)(<>((.|\s)*))?\]$/;
const symbolRE = /^\[native Symbol Symbol\((.*)\)\]$/;

function reviver(key, val) {
  return revive(val);
}

function revive(val) {
  if (val === exports.UNDEFINED) {
    return undefined;
  } else if (val === exports.INFINITY) {
    return Infinity;
  } else if (val === exports.NEGATIVE_INFINITY) {
    return -Infinity;
  } else if (val === exports.NAN) {
    return NaN;
  } else if (val && val._custom) {
    const {
      _custom: custom
    } = val;

    if (custom.type === 'component') {
      return (0, backend_1.getInstanceMap)().get(custom.id);
    } else if (custom.type === 'map') {
      return reviveMap(val);
    } else if (custom.type === 'set') {
      return reviveSet(val);
    } else if (custom._reviveId) {
      return reviveCache.read(custom._reviveId);
    } else {
      return revive(custom.value);
    }
  } else if (symbolRE.test(val)) {
    const [, string] = symbolRE.exec(val);
    return Symbol.for(string);
  } else if (specialTypeRE.test(val)) {
    const [, type, string,, details] = specialTypeRE.exec(val);
    const result = new window[type](string);

    if (type === 'Error' && details) {
      result.stack = details;
    }

    return result;
  } else {
    return val;
  }
}

exports.revive = revive;
/**
 * Sanitize data to be posted to the other side.
 * Since the message posted is sent with structured clone,
 * we need to filter out any types that might cause an error.
 *
 * @param {*} data
 * @return {*}
 */

function sanitize(data) {
  if (!isPrimitive(data) && !Array.isArray(data) && !isPlainObject(data)) {
    // handle types that will probably cause issues in
    // the structured clone
    return Object.prototype.toString.call(data);
  } else {
    return data;
  }
}

function isPlainObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}

exports.isPlainObject = isPlainObject;

function isPrimitive(data) {
  if (data == null) {
    return true;
  }

  const type = typeof data;
  return type === 'string' || type === 'number' || type === 'boolean';
}
/**
 * Searches a key or value in the object, with a maximum deepness
 * @param {*} obj Search target
 * @param {string} searchTerm Search string
 * @returns {boolean} Search match
 */


function searchDeepInObject(obj, searchTerm) {
  const seen = new Map();
  const result = internalSearchObject(obj, searchTerm.toLowerCase(), seen, 0);
  seen.clear();
  return result;
}

exports.searchDeepInObject = searchDeepInObject;
const SEARCH_MAX_DEPTH = 10;
/**
 * Executes a search on each field of the provided object
 * @param {*} obj Search target
 * @param {string} searchTerm Search string
 * @param {Map<any,boolean>} seen Map containing the search result to prevent stack overflow by walking on the same object multiple times
 * @param {number} depth Deep search depth level, which is capped to prevent performance issues
 * @returns {boolean} Search match
 */

function internalSearchObject(obj, searchTerm, seen, depth) {
  if (depth > SEARCH_MAX_DEPTH) {
    return false;
  }

  let match = false;
  const keys = Object.keys(obj);
  let key, value;

  for (let i = 0; i < keys.length; i++) {
    key = keys[i];
    value = obj[key];
    match = internalSearchCheck(searchTerm, key, value, seen, depth + 1);

    if (match) {
      break;
    }
  }

  return match;
}
/**
 * Executes a search on each value of the provided array
 * @param {*} array Search target
 * @param {string} searchTerm Search string
 * @param {Map<any,boolean>} seen Map containing the search result to prevent stack overflow by walking on the same object multiple times
 * @param {number} depth Deep search depth level, which is capped to prevent performance issues
 * @returns {boolean} Search match
 */


function internalSearchArray(array, searchTerm, seen, depth) {
  if (depth > SEARCH_MAX_DEPTH) {
    return false;
  }

  let match = false;
  let value;

  for (let i = 0; i < array.length; i++) {
    value = array[i];
    match = internalSearchCheck(searchTerm, null, value, seen, depth + 1);

    if (match) {
      break;
    }
  }

  return match;
}
/**
 * Checks if the provided field matches the search terms
 * @param {string} searchTerm Search string
 * @param {string} key Field key (null if from array)
 * @param {*} value Field value
 * @param {Map<any,boolean>} seen Map containing the search result to prevent stack overflow by walking on the same object multiple times
 * @param {number} depth Deep search depth level, which is capped to prevent performance issues
 * @returns {boolean} Search match
 */


function internalSearchCheck(searchTerm, key, value, seen, depth) {
  let match = false;
  let result;

  if (key === '_custom') {
    key = value.display;
    value = value.value;
  }

  (result = specialTokenToString(value)) && (value = result);

  if (key && compare(key, searchTerm)) {
    match = true;
    seen.set(value, true);
  } else if (seen.has(value)) {
    match = seen.get(value);
  } else if (Array.isArray(value)) {
    seen.set(value, null);
    match = internalSearchArray(value, searchTerm, seen, depth);
    seen.set(value, match);
  } else if (isPlainObject(value)) {
    seen.set(value, null);
    match = internalSearchObject(value, searchTerm, seen, depth);
    seen.set(value, match);
  } else if (compare(value, searchTerm)) {
    match = true;
    seen.set(value, true);
  }

  return match;
}
/**
 * Compares two values
 * @param {*} value Mixed type value that will be cast to string
 * @param {string} searchTerm Search string
 * @returns {boolean} Search match
 */


function compare(value, searchTerm) {
  return ('' + value).toLowerCase().indexOf(searchTerm) !== -1;
}

function sortByKey(state) {
  return state && state.slice().sort((a, b) => {
    if (a.key < b.key) return -1;
    if (a.key > b.key) return 1;
    return 0;
  });
}

exports.sortByKey = sortByKey;

function simpleGet(object, path) {
  const sections = Array.isArray(path) ? path : path.split('.');

  for (let i = 0; i < sections.length; i++) {
    object = object[sections[i]];

    if (!object) {
      return undefined;
    }
  }

  return object;
}

exports.simpleGet = simpleGet;

function focusInput(el) {
  el.focus();
  el.setSelectionRange(0, el.value.length);
}

exports.focusInput = focusInput;

function openInEditor(file) {
  // Console display
  const fileName = file.replace(/\\/g, '\\\\');
  const src = `fetch('${shared_data_1.SharedData.openInEditorHost}__open-in-editor?file=${encodeURI(file)}').then(response => {
    if (response.ok) {
      console.log('File ${fileName} opened in editor')
    } else {
      const msg = 'Opening component ${fileName} failed'
      const target = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : {}
      if (target.__VUE_DEVTOOLS_TOAST__) {
        target.__VUE_DEVTOOLS_TOAST__(msg, 'error')
      } else {
        console.log('%c' + msg, 'color:red')
      }
      console.log('Check the setup of your project, see https://devtools.vuejs.org/guide/open-in-editor.html')
    }
  })`;

  if (env_1.isChrome) {
    env_1.target.chrome.devtools.inspectedWindow.eval(src);
  } else {
    // eslint-disable-next-line no-eval
    eval(src);
  }
}

exports.openInEditor = openInEditor;
const ESC = {
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '&': '&amp;'
};

function escape(s) {
  return s.replace(/[<>"&]/g, escapeChar);
}

exports.escape = escape;

function escapeChar(a) {
  return ESC[a] || a;
}

function copyToClipboard(state) {
  if (typeof document === 'undefined') return;
  const dummyTextArea = document.createElement('textarea');
  dummyTextArea.textContent = stringify(state);
  document.body.appendChild(dummyTextArea);
  dummyTextArea.select();
  document.execCommand('copy');
  document.body.removeChild(dummyTextArea);
}

exports.copyToClipboard = copyToClipboard;

function isEmptyObject(obj) {
  return obj === exports.UNDEFINED || !obj || Object.keys(obj).length === 0;
}

exports.isEmptyObject = isEmptyObject;

/***/ }),

/***/ "../../node_modules/events/events.js":
/*!*******************************************!*\
  !*** ../../node_modules/events/events.js ***!
  \*******************************************/
/***/ ((module) => {

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



var R = typeof Reflect === 'object' ? Reflect : null
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  }

var ReflectOwnKeys
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
}

function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;
module.exports.once = once;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  checkListener(listener);

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = _getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0)
      return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      checkListener(listener);
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      checkListener(listener);

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function once(emitter, name) {
  return new Promise(function (resolve, reject) {
    function errorListener(err) {
      emitter.removeListener(name, resolver);
      reject(err);
    }

    function resolver() {
      if (typeof emitter.removeListener === 'function') {
        emitter.removeListener('error', errorListener);
      }
      resolve([].slice.call(arguments));
    };

    eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
    if (name !== 'error') {
      addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
    }
  });
}

function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
  if (typeof emitter.on === 'function') {
    eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
  }
}

function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  if (typeof emitter.on === 'function') {
    if (flags.once) {
      emitter.once(name, listener);
    } else {
      emitter.on(name, listener);
    }
  } else if (typeof emitter.addEventListener === 'function') {
    // EventTarget does not have `error` event semantics like Node
    // EventEmitters, we do not listen for `error` events here.
    emitter.addEventListener(name, function wrapListener(arg) {
      // IE does not have builtin `{ once: true }` support so we
      // have to do it manually.
      if (flags.once) {
        emitter.removeEventListener(name, wrapListener);
      }
      listener(arg);
    });
  } else {
    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
  }
}


/***/ }),

/***/ "../../node_modules/path-browserify/index.js":
/*!***************************************************!*\
  !*** ../../node_modules/path-browserify/index.js ***!
  \***************************************************/
/***/ ((module) => {

// 'path' module extracted from Node.js v8.11.1 (only the posix part)
// transplited with Babel

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



function assertPath(path) {
  if (typeof path !== 'string') {
    throw new TypeError('Path must be a string. Received ' + JSON.stringify(path));
  }
}

// Resolves . and .. elements in a path with directory names
function normalizeStringPosix(path, allowAboveRoot) {
  var res = '';
  var lastSegmentLength = 0;
  var lastSlash = -1;
  var dots = 0;
  var code;
  for (var i = 0; i <= path.length; ++i) {
    if (i < path.length)
      code = path.charCodeAt(i);
    else if (code === 47 /*/*/)
      break;
    else
      code = 47 /*/*/;
    if (code === 47 /*/*/) {
      if (lastSlash === i - 1 || dots === 1) {
        // NOOP
      } else if (lastSlash !== i - 1 && dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 /*.*/ || res.charCodeAt(res.length - 2) !== 46 /*.*/) {
          if (res.length > 2) {
            var lastSlashIndex = res.lastIndexOf('/');
            if (lastSlashIndex !== res.length - 1) {
              if (lastSlashIndex === -1) {
                res = '';
                lastSegmentLength = 0;
              } else {
                res = res.slice(0, lastSlashIndex);
                lastSegmentLength = res.length - 1 - res.lastIndexOf('/');
              }
              lastSlash = i;
              dots = 0;
              continue;
            }
          } else if (res.length === 2 || res.length === 1) {
            res = '';
            lastSegmentLength = 0;
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0)
            res += '/..';
          else
            res = '..';
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0)
          res += '/' + path.slice(lastSlash + 1, i);
        else
          res = path.slice(lastSlash + 1, i);
        lastSegmentLength = i - lastSlash - 1;
      }
      lastSlash = i;
      dots = 0;
    } else if (code === 46 /*.*/ && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}

function _format(sep, pathObject) {
  var dir = pathObject.dir || pathObject.root;
  var base = pathObject.base || (pathObject.name || '') + (pathObject.ext || '');
  if (!dir) {
    return base;
  }
  if (dir === pathObject.root) {
    return dir + base;
  }
  return dir + sep + base;
}

var posix = {
  // path.resolve([from ...], to)
  resolve: function resolve() {
    var resolvedPath = '';
    var resolvedAbsolute = false;
    var cwd;

    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path;
      if (i >= 0)
        path = arguments[i];
      else {
        if (cwd === undefined)
          cwd = process.cwd();
        path = cwd;
      }

      assertPath(path);

      // Skip empty entries
      if (path.length === 0) {
        continue;
      }

      resolvedPath = path + '/' + resolvedPath;
      resolvedAbsolute = path.charCodeAt(0) === 47 /*/*/;
    }

    // At this point the path should be resolved to a full absolute path, but
    // handle relative paths to be safe (might happen when process.cwd() fails)

    // Normalize the path
    resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);

    if (resolvedAbsolute) {
      if (resolvedPath.length > 0)
        return '/' + resolvedPath;
      else
        return '/';
    } else if (resolvedPath.length > 0) {
      return resolvedPath;
    } else {
      return '.';
    }
  },

  normalize: function normalize(path) {
    assertPath(path);

    if (path.length === 0) return '.';

    var isAbsolute = path.charCodeAt(0) === 47 /*/*/;
    var trailingSeparator = path.charCodeAt(path.length - 1) === 47 /*/*/;

    // Normalize the path
    path = normalizeStringPosix(path, !isAbsolute);

    if (path.length === 0 && !isAbsolute) path = '.';
    if (path.length > 0 && trailingSeparator) path += '/';

    if (isAbsolute) return '/' + path;
    return path;
  },

  isAbsolute: function isAbsolute(path) {
    assertPath(path);
    return path.length > 0 && path.charCodeAt(0) === 47 /*/*/;
  },

  join: function join() {
    if (arguments.length === 0)
      return '.';
    var joined;
    for (var i = 0; i < arguments.length; ++i) {
      var arg = arguments[i];
      assertPath(arg);
      if (arg.length > 0) {
        if (joined === undefined)
          joined = arg;
        else
          joined += '/' + arg;
      }
    }
    if (joined === undefined)
      return '.';
    return posix.normalize(joined);
  },

  relative: function relative(from, to) {
    assertPath(from);
    assertPath(to);

    if (from === to) return '';

    from = posix.resolve(from);
    to = posix.resolve(to);

    if (from === to) return '';

    // Trim any leading backslashes
    var fromStart = 1;
    for (; fromStart < from.length; ++fromStart) {
      if (from.charCodeAt(fromStart) !== 47 /*/*/)
        break;
    }
    var fromEnd = from.length;
    var fromLen = fromEnd - fromStart;

    // Trim any leading backslashes
    var toStart = 1;
    for (; toStart < to.length; ++toStart) {
      if (to.charCodeAt(toStart) !== 47 /*/*/)
        break;
    }
    var toEnd = to.length;
    var toLen = toEnd - toStart;

    // Compare paths to find the longest common path from root
    var length = fromLen < toLen ? fromLen : toLen;
    var lastCommonSep = -1;
    var i = 0;
    for (; i <= length; ++i) {
      if (i === length) {
        if (toLen > length) {
          if (to.charCodeAt(toStart + i) === 47 /*/*/) {
            // We get here if `from` is the exact base path for `to`.
            // For example: from='/foo/bar'; to='/foo/bar/baz'
            return to.slice(toStart + i + 1);
          } else if (i === 0) {
            // We get here if `from` is the root
            // For example: from='/'; to='/foo'
            return to.slice(toStart + i);
          }
        } else if (fromLen > length) {
          if (from.charCodeAt(fromStart + i) === 47 /*/*/) {
            // We get here if `to` is the exact base path for `from`.
            // For example: from='/foo/bar/baz'; to='/foo/bar'
            lastCommonSep = i;
          } else if (i === 0) {
            // We get here if `to` is the root.
            // For example: from='/foo'; to='/'
            lastCommonSep = 0;
          }
        }
        break;
      }
      var fromCode = from.charCodeAt(fromStart + i);
      var toCode = to.charCodeAt(toStart + i);
      if (fromCode !== toCode)
        break;
      else if (fromCode === 47 /*/*/)
        lastCommonSep = i;
    }

    var out = '';
    // Generate the relative path based on the path difference between `to`
    // and `from`
    for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
      if (i === fromEnd || from.charCodeAt(i) === 47 /*/*/) {
        if (out.length === 0)
          out += '..';
        else
          out += '/..';
      }
    }

    // Lastly, append the rest of the destination (`to`) path that comes after
    // the common path parts
    if (out.length > 0)
      return out + to.slice(toStart + lastCommonSep);
    else {
      toStart += lastCommonSep;
      if (to.charCodeAt(toStart) === 47 /*/*/)
        ++toStart;
      return to.slice(toStart);
    }
  },

  _makeLong: function _makeLong(path) {
    return path;
  },

  dirname: function dirname(path) {
    assertPath(path);
    if (path.length === 0) return '.';
    var code = path.charCodeAt(0);
    var hasRoot = code === 47 /*/*/;
    var end = -1;
    var matchedSlash = true;
    for (var i = path.length - 1; i >= 1; --i) {
      code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          if (!matchedSlash) {
            end = i;
            break;
          }
        } else {
        // We saw the first non-path separator
        matchedSlash = false;
      }
    }

    if (end === -1) return hasRoot ? '/' : '.';
    if (hasRoot && end === 1) return '//';
    return path.slice(0, end);
  },

  basename: function basename(path, ext) {
    if (ext !== undefined && typeof ext !== 'string') throw new TypeError('"ext" argument must be a string');
    assertPath(path);

    var start = 0;
    var end = -1;
    var matchedSlash = true;
    var i;

    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
      if (ext.length === path.length && ext === path) return '';
      var extIdx = ext.length - 1;
      var firstNonSlashEnd = -1;
      for (i = path.length - 1; i >= 0; --i) {
        var code = path.charCodeAt(i);
        if (code === 47 /*/*/) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else {
          if (firstNonSlashEnd === -1) {
            // We saw the first non-path separator, remember this index in case
            // we need it if the extension ends up not matching
            matchedSlash = false;
            firstNonSlashEnd = i + 1;
          }
          if (extIdx >= 0) {
            // Try to match the explicit extension
            if (code === ext.charCodeAt(extIdx)) {
              if (--extIdx === -1) {
                // We matched the extension, so mark this as the end of our path
                // component
                end = i;
              }
            } else {
              // Extension does not match, so our result is the entire path
              // component
              extIdx = -1;
              end = firstNonSlashEnd;
            }
          }
        }
      }

      if (start === end) end = firstNonSlashEnd;else if (end === -1) end = path.length;
      return path.slice(start, end);
    } else {
      for (i = path.length - 1; i >= 0; --i) {
        if (path.charCodeAt(i) === 47 /*/*/) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else if (end === -1) {
          // We saw the first non-path separator, mark this as the end of our
          // path component
          matchedSlash = false;
          end = i + 1;
        }
      }

      if (end === -1) return '';
      return path.slice(start, end);
    }
  },

  extname: function extname(path) {
    assertPath(path);
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0;
    for (var i = path.length - 1; i >= 0; --i) {
      var code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46 /*.*/) {
          // If this is our first dot, mark it as the start of our extension
          if (startDot === -1)
            startDot = i;
          else if (preDotState !== 1)
            preDotState = 1;
      } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1;
      }
    }

    if (startDot === -1 || end === -1 ||
        // We saw a non-dot character immediately before the dot
        preDotState === 0 ||
        // The (right-most) trimmed path component is exactly '..'
        preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      return '';
    }
    return path.slice(startDot, end);
  },

  format: function format(pathObject) {
    if (pathObject === null || typeof pathObject !== 'object') {
      throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
    }
    return _format('/', pathObject);
  },

  parse: function parse(path) {
    assertPath(path);

    var ret = { root: '', dir: '', base: '', ext: '', name: '' };
    if (path.length === 0) return ret;
    var code = path.charCodeAt(0);
    var isAbsolute = code === 47 /*/*/;
    var start;
    if (isAbsolute) {
      ret.root = '/';
      start = 1;
    } else {
      start = 0;
    }
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    var i = path.length - 1;

    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0;

    // Get non-dir info
    for (; i >= start; --i) {
      code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46 /*.*/) {
          // If this is our first dot, mark it as the start of our extension
          if (startDot === -1) startDot = i;else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1;
      }
    }

    if (startDot === -1 || end === -1 ||
    // We saw a non-dot character immediately before the dot
    preDotState === 0 ||
    // The (right-most) trimmed path component is exactly '..'
    preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      if (end !== -1) {
        if (startPart === 0 && isAbsolute) ret.base = ret.name = path.slice(1, end);else ret.base = ret.name = path.slice(startPart, end);
      }
    } else {
      if (startPart === 0 && isAbsolute) {
        ret.name = path.slice(1, startDot);
        ret.base = path.slice(1, end);
      } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
      }
      ret.ext = path.slice(startDot, end);
    }

    if (startPart > 0) ret.dir = path.slice(0, startPart - 1);else if (isAbsolute) ret.dir = '/';

    return ret;
  },

  sep: '/',
  delimiter: ':',
  win32: null,
  posix: null
};

posix.posix = posix;

module.exports = posix;


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
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
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
/*!*********************!*\
  !*** ./src/hook.js ***!
  \*********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _back_hook__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @back/hook */ "../app-backend-core/lib/hook.js");
/* harmony import */ var _vue_devtools_shared_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js");
/* harmony import */ var _vue_devtools_shared_utils__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_vue_devtools_shared_utils__WEBPACK_IMPORTED_MODULE_1__);
// This script is injected into every page.

 // inject the hook

if (document instanceof HTMLDocument) {
  const source = ';(' + _back_hook__WEBPACK_IMPORTED_MODULE_0__.installHook.toString() + ')(window)';

  if (_vue_devtools_shared_utils__WEBPACK_IMPORTED_MODULE_1__.isFirefox) {
    // eslint-disable-next-line no-eval
    window.eval(source); // in Firefox, this evaluates on the content window
  } else {
    const script = document.createElement('script');
    script.textContent = source;
    document.documentElement.appendChild(script);
    script.parentNode.removeChild(script);
  }
}
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQSxNQUFNO0FBQ047QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQVE7QUFDUjs7QUFFQSxrQ0FBa0MsUUFBUTtBQUMxQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLGlCQUFpQjtBQUNyQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtB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Q0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7OztXQ3RCQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EsaUNBQWlDLFdBQVc7V0FDNUM7V0FDQTs7Ozs7V0NQQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLHlDQUF5Qyx3Q0FBd0M7V0FDakY7V0FDQTtXQUNBOzs7OztXQ1BBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EsR0FBRztXQUNIO1dBQ0E7V0FDQSxDQUFDOzs7OztXQ1BEOzs7OztXQ0FBO1dBQ0E7V0FDQTtXQUNBLHVEQUF1RCxpQkFBaUI7V0FDeEU7V0FDQSxnREFBZ0QsYUFBYTtXQUM3RDs7Ozs7Ozs7Ozs7Ozs7QUNOQTtBQUNBO0NBR0E7O0FBQ0EsSUFBSUUsUUFBUSxZQUFZQyxZQUF4QixFQUFzQztBQUNwQyxRQUFNQyxNQUFNLEdBQUcsT0FBT0osNERBQUEsRUFBUCxHQUFnQyxXQUEvQzs7QUFFQSxNQUFJQyxpRUFBSixFQUFlO0FBQ2I7QUFDQUssSUFBQUEsTUFBTSxDQUFDQyxJQUFQLENBQVlILE1BQVosRUFGYSxDQUVPO0FBQ3JCLEdBSEQsTUFHTztBQUNMLFVBQU1JLE1BQU0sR0FBR04sUUFBUSxDQUFDTyxhQUFULENBQXVCLFFBQXZCLENBQWY7QUFDQUQsSUFBQUEsTUFBTSxDQUFDRSxXQUFQLEdBQXFCTixNQUFyQjtBQUNBRixJQUFBQSxRQUFRLENBQUNTLGVBQVQsQ0FBeUJDLFdBQXpCLENBQXFDSixNQUFyQztBQUNBQSxJQUFBQSxNQUFNLENBQUNLLFVBQVAsQ0FBa0JDLFdBQWxCLENBQThCTixNQUE5QjtBQUNEO0FBQ0YsQyIsInNvdXJjZXMiOlsid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uL3NyYy9ob29rLnRzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uL3NyYy9iYWNrZW5kLnRzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uL3NyYy9icmlkZ2UudHMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vc3JjL2NvbnN0cy50cyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi9zcmMvZWRpdC50cyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi9zcmMvZW52LnRzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uL3NyYy9pbmRleC50cyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi9zcmMvcGx1Z2luLXBlcm1pc3Npb25zLnRzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uL3NyYy9wbHVnaW4tc2V0dGluZ3MudHMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vc3JjL3NoYXJlZC1kYXRhLnRzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uL3NyYy9zdG9yYWdlLnRzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uL3NyYy90cmFuc2Zlci50cyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi9zcmMvdXRpbC50cyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi8uLi9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi8uLi9ub2RlX21vZHVsZXMvcGF0aC1icm93c2VyaWZ5L2luZGV4LmpzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lL3dlYnBhY2svcnVudGltZS9jb21wYXQgZ2V0IGRlZmF1bHQgZXhwb3J0Iiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS93ZWJwYWNrL3J1bnRpbWUvZ2xvYmFsIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uL3NyYy9ob29rLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xyXG4vLyB0aGlzIHNjcmlwdCBpcyBpbmplY3RlZCBpbnRvIGV2ZXJ5IHBhZ2UuXHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5pbnN0YWxsSG9vayA9IHZvaWQgMDtcclxuLyoqXHJcbiAqIEluc3RhbGwgdGhlIGhvb2sgb24gd2luZG93LCB3aGljaCBpcyBhbiBldmVudCBlbWl0dGVyLlxyXG4gKiBOb3RlIGJlY2F1c2UgQ2hyb21lIGNvbnRlbnQgc2NyaXB0cyBjYW5ub3QgZGlyZWN0bHkgbW9kaWZ5IHRoZSB3aW5kb3cgb2JqZWN0LFxyXG4gKiB3ZSBhcmUgZXZhbGluZyB0aGlzIGZ1bmN0aW9uIGJ5IGluc2VydGluZyBhIHNjcmlwdCB0YWcuIFRoYXQncyB3aHkgd2UgaGF2ZVxyXG4gKiB0byBpbmxpbmUgdGhlIHdob2xlIGV2ZW50IGVtaXR0ZXIgaW1wbGVtZW50YXRpb24gaGVyZS5cclxuICpcclxuICogQHBhcmFtIHtXaW5kb3d8Z2xvYmFsfSB0YXJnZXRcclxuICovXHJcbmZ1bmN0aW9uIGluc3RhbGxIb29rKHRhcmdldCwgaXNJZnJhbWUgPSBmYWxzZSkge1xyXG4gICAgbGV0IGxpc3RlbmVycyA9IHt9O1xyXG4gICAgZnVuY3Rpb24gaW5qZWN0SWZyYW1lSG9vayhpZnJhbWUpIHtcclxuICAgICAgICBpZiAoaWZyYW1lLl9fdmRldnRvb2xzX19pbmplY3RlZClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmcmFtZS5fX3ZkZXZ0b29sc19faW5qZWN0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICBjb25zdCBpbmplY3QgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmcmFtZS5jb250ZW50V2luZG93Ll9fVlVFX0RFVlRPT0xTX0lGUkFNRV9fID0gaWZyYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNjcmlwdCA9IGlmcmFtZS5jb250ZW50RG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgc2NyaXB0LnRleHRDb250ZW50ID0gJzsoJyArIGluc3RhbGxIb29rLnRvU3RyaW5nKCkgKyAnKSh3aW5kb3csIHRydWUpJztcclxuICAgICAgICAgICAgICAgICAgICBpZnJhbWUuY29udGVudERvY3VtZW50LmRvY3VtZW50RWxlbWVudC5hcHBlbmRDaGlsZChzY3JpcHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNjcmlwdC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHNjcmlwdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIElnbm9yZVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBpbmplY3QoKTtcclxuICAgICAgICAgICAgaWZyYW1lLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCAoKSA9PiBpbmplY3QoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIC8vIElnbm9yZVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGxldCBpZnJhbWVDaGVja3MgPSAwO1xyXG4gICAgZnVuY3Rpb24gaW5qZWN0VG9JZnJhbWVzKCkge1xyXG4gICAgICAgIGNvbnN0IGlmcmFtZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdpZnJhbWU6bm90KFtkYXRhLXZ1ZS1kZXZ0b29scy1pZ25vcmVdKScpO1xyXG4gICAgICAgIGZvciAoY29uc3QgaWZyYW1lIG9mIGlmcmFtZXMpIHtcclxuICAgICAgICAgICAgaW5qZWN0SWZyYW1lSG9vayhpZnJhbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGluamVjdFRvSWZyYW1lcygpO1xyXG4gICAgY29uc3QgaWZyYW1lVGltZXIgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XHJcbiAgICAgICAgaW5qZWN0VG9JZnJhbWVzKCk7XHJcbiAgICAgICAgaWZyYW1lQ2hlY2tzKys7XHJcbiAgICAgICAgaWYgKGlmcmFtZUNoZWNrcyA+PSA1KSB7XHJcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaWZyYW1lVGltZXIpO1xyXG4gICAgICAgIH1cclxuICAgIH0sIDEwMDApO1xyXG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh0YXJnZXQsICdfX1ZVRV9ERVZUT09MU19HTE9CQUxfSE9PS19fJykpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgbGV0IGhvb2s7XHJcbiAgICBpZiAoaXNJZnJhbWUpIHtcclxuICAgICAgICBjb25zdCBzZW5kVG9QYXJlbnQgPSBjYiA9PiB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBob29rID0gd2luZG93LnBhcmVudC5fX1ZVRV9ERVZUT09MU19HTE9CQUxfSE9PS19fO1xyXG4gICAgICAgICAgICAgICAgaWYgKGhvb2spIHtcclxuICAgICAgICAgICAgICAgICAgICBjYihob29rKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW1Z1ZSBEZXZ0b29sc10gTm8gaG9vayBpbiBwYXJlbnQgd2luZG93Jyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignW1Z1ZSBEZXZ0b29sc10gRmFpbGVkIHRvIHNlbmQgbWVzc2FnZSB0byBwYXJlbmQgd2luZG93JywgZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIGhvb2sgPSB7XHJcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBhY2Nlc3Nvci1wYWlyc1xyXG4gICAgICAgICAgICBzZXQgVnVlKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICBzZW5kVG9QYXJlbnQoaG9vayA9PiB7IGhvb2suVnVlID0gdmFsdWU7IH0pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgYWNjZXNzb3ItcGFpcnNcclxuICAgICAgICAgICAgc2V0IGVuYWJsZWQodmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIHNlbmRUb1BhcmVudChob29rID0+IHsgaG9vay5lbmFibGVkID0gdmFsdWU7IH0pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBvbihldmVudCwgZm4pIHtcclxuICAgICAgICAgICAgICAgIHNlbmRUb1BhcmVudChob29rID0+IGhvb2sub24oZXZlbnQsIGZuKSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG9uY2UoZXZlbnQsIGZuKSB7XHJcbiAgICAgICAgICAgICAgICBzZW5kVG9QYXJlbnQoaG9vayA9PiBob29rLm9uY2UoZXZlbnQsIGZuKSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG9mZihldmVudCwgZm4pIHtcclxuICAgICAgICAgICAgICAgIHNlbmRUb1BhcmVudChob29rID0+IGhvb2sub2ZmKGV2ZW50LCBmbikpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlbWl0KGV2ZW50LCAuLi5hcmdzKSB7XHJcbiAgICAgICAgICAgICAgICBzZW5kVG9QYXJlbnQoaG9vayA9PiBob29rLmVtaXQoZXZlbnQsIC4uLmFyZ3MpKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgaG9vayA9IHtcclxuICAgICAgICAgICAgVnVlOiBudWxsLFxyXG4gICAgICAgICAgICBlbmFibGVkOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIF9idWZmZXI6IFtdLFxyXG4gICAgICAgICAgICBzdG9yZTogbnVsbCxcclxuICAgICAgICAgICAgaW5pdGlhbFN0YXRlOiBudWxsLFxyXG4gICAgICAgICAgICBzdG9yZU1vZHVsZXM6IG51bGwsXHJcbiAgICAgICAgICAgIGZsdXNoU3RvcmVNb2R1bGVzOiBudWxsLFxyXG4gICAgICAgICAgICBhcHBzOiBbXSxcclxuICAgICAgICAgICAgX3JlcGxheUJ1ZmZlcihldmVudCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYnVmZmVyID0gdGhpcy5fYnVmZmVyO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fYnVmZmVyID0gW107XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMCwgbCA9IGJ1ZmZlci5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhbGxBcmdzID0gYnVmZmVyW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIGFsbEFyZ3NbMF0gPT09IGV2ZW50XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBwcmVmZXItc3ByZWFkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgID8gdGhpcy5lbWl0LmFwcGx5KHRoaXMsIGFsbEFyZ3MpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDogdGhpcy5fYnVmZmVyLnB1c2goYWxsQXJncyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG9uKGV2ZW50LCBmbikge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgJGV2ZW50ID0gJyQnICsgZXZlbnQ7XHJcbiAgICAgICAgICAgICAgICBpZiAobGlzdGVuZXJzWyRldmVudF0pIHtcclxuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnNbJGV2ZW50XS5wdXNoKGZuKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyc1skZXZlbnRdID0gW2ZuXTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZXBsYXlCdWZmZXIoZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBvbmNlKGV2ZW50LCBmbikge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgb24gPSAoLi4uYXJncykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub2ZmKGV2ZW50LCBvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgZm4uYXBwbHkodGhpcywgYXJncyk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbihldmVudCwgb24pO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBvZmYoZXZlbnQsIGZuKSB7XHJcbiAgICAgICAgICAgICAgICBldmVudCA9ICckJyArIGV2ZW50O1xyXG4gICAgICAgICAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzID0ge307XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjYnMgPSBsaXN0ZW5lcnNbZXZlbnRdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjYnMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFmbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzW2V2ZW50XSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMCwgbCA9IGNicy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjYiA9IGNic1tpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2IgPT09IGZuIHx8IGNiLmZuID09PSBmbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYnMuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVtaXQoZXZlbnQsIC4uLmFyZ3MpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0ICRldmVudCA9ICckJyArIGV2ZW50O1xyXG4gICAgICAgICAgICAgICAgbGV0IGNicyA9IGxpc3RlbmVyc1skZXZlbnRdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNicykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNicyA9IGNicy5zbGljZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwLCBsID0gY2JzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYnNbaV0uYXBwbHkodGhpcywgYXJncyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnVmZmVyLnB1c2goW2V2ZW50LCAuLi5hcmdzXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfTtcclxuICAgICAgICBob29rLm9uY2UoJ2luaXQnLCBWdWUgPT4ge1xyXG4gICAgICAgICAgICBob29rLlZ1ZSA9IFZ1ZTtcclxuICAgICAgICAgICAgaWYgKFZ1ZSkge1xyXG4gICAgICAgICAgICAgICAgVnVlLnByb3RvdHlwZS4kaW5zcGVjdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmbiA9IHRhcmdldC5fX1ZVRV9ERVZUT09MU19JTlNQRUNUX187XHJcbiAgICAgICAgICAgICAgICAgICAgZm4gJiYgZm4odGhpcyk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaG9vay5vbignYXBwOmluaXQnLCAoYXBwLCB2ZXJzaW9uLCB0eXBlcykgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBhcHBSZWNvcmQgPSB7XHJcbiAgICAgICAgICAgICAgICBhcHAsXHJcbiAgICAgICAgICAgICAgICB2ZXJzaW9uLFxyXG4gICAgICAgICAgICAgICAgdHlwZXMsXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGhvb2suYXBwcy5wdXNoKGFwcFJlY29yZCk7XHJcbiAgICAgICAgICAgIGhvb2suZW1pdCgnYXBwOmFkZCcsIGFwcFJlY29yZCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaG9vay5vbmNlKCd2dWV4OmluaXQnLCBzdG9yZSA9PiB7XHJcbiAgICAgICAgICAgIGhvb2suc3RvcmUgPSBzdG9yZTtcclxuICAgICAgICAgICAgaG9vay5pbml0aWFsU3RhdGUgPSBjbG9uZShzdG9yZS5zdGF0ZSk7XHJcbiAgICAgICAgICAgIGNvbnN0IG9yaWdSZXBsYWNlU3RhdGUgPSBzdG9yZS5yZXBsYWNlU3RhdGUuYmluZChzdG9yZSk7XHJcbiAgICAgICAgICAgIHN0b3JlLnJlcGxhY2VTdGF0ZSA9IHN0YXRlID0+IHtcclxuICAgICAgICAgICAgICAgIGhvb2suaW5pdGlhbFN0YXRlID0gY2xvbmUoc3RhdGUpO1xyXG4gICAgICAgICAgICAgICAgb3JpZ1JlcGxhY2VTdGF0ZShzdGF0ZSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8vIER5bmFtaWMgbW9kdWxlc1xyXG4gICAgICAgICAgICBsZXQgb3JpZ1JlZ2lzdGVyLCBvcmlnVW5yZWdpc3RlcjtcclxuICAgICAgICAgICAgaWYgKHN0b3JlLnJlZ2lzdGVyTW9kdWxlKSB7XHJcbiAgICAgICAgICAgICAgICBob29rLnN0b3JlTW9kdWxlcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgb3JpZ1JlZ2lzdGVyID0gc3RvcmUucmVnaXN0ZXJNb2R1bGUuYmluZChzdG9yZSk7XHJcbiAgICAgICAgICAgICAgICBzdG9yZS5yZWdpc3Rlck1vZHVsZSA9IChwYXRoLCBtb2R1bGUsIG9wdGlvbnMpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHBhdGggPT09ICdzdHJpbmcnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoID0gW3BhdGhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGhvb2suc3RvcmVNb2R1bGVzLnB1c2goeyBwYXRoLCBtb2R1bGUsIG9wdGlvbnMgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgb3JpZ1JlZ2lzdGVyKHBhdGgsIG1vZHVsZSwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2Vhcmx5IHJlZ2lzdGVyIG1vZHVsZScsIHBhdGgsIG1vZHVsZSwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIG9yaWdVbnJlZ2lzdGVyID0gc3RvcmUudW5yZWdpc3Rlck1vZHVsZS5iaW5kKHN0b3JlKTtcclxuICAgICAgICAgICAgICAgIHN0b3JlLnVucmVnaXN0ZXJNb2R1bGUgPSAocGF0aCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcGF0aCA9PT0gJ3N0cmluZycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGggPSBbcGF0aF07XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5ID0gcGF0aC5qb2luKCcvJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBob29rLnN0b3JlTW9kdWxlcy5maW5kSW5kZXgobSA9PiBtLnBhdGguam9pbignLycpID09PSBrZXkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhvb2suc3RvcmVNb2R1bGVzLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgb3JpZ1VucmVnaXN0ZXIocGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2Vhcmx5IHVucmVnaXN0ZXIgbW9kdWxlJywgcGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBob29rLmZsdXNoU3RvcmVNb2R1bGVzID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgc3RvcmUucmVwbGFjZVN0YXRlID0gb3JpZ1JlcGxhY2VTdGF0ZTtcclxuICAgICAgICAgICAgICAgIGlmIChzdG9yZS5yZWdpc3Rlck1vZHVsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0b3JlLnJlZ2lzdGVyTW9kdWxlID0gb3JpZ1JlZ2lzdGVyO1xyXG4gICAgICAgICAgICAgICAgICAgIHN0b3JlLnVucmVnaXN0ZXJNb2R1bGUgPSBvcmlnVW5yZWdpc3RlcjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBob29rLnN0b3JlTW9kdWxlcyB8fCBbXTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsICdfX1ZVRV9ERVZUT09MU19HTE9CQUxfSE9PS19fJywge1xyXG4gICAgICAgIGdldCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGhvb2s7XHJcbiAgICAgICAgfSxcclxuICAgIH0pO1xyXG4gICAgLy8gSGFuZGxlIGFwcHMgaW5pdGlhbGl6ZWQgYmVmb3JlIGhvb2sgaW5qZWN0aW9uXHJcbiAgICBpZiAodGFyZ2V0Ll9fVlVFX0RFVlRPT0xTX0hPT0tfUkVQTEFZX18pIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB0YXJnZXQuX19WVUVfREVWVE9PTFNfSE9PS19SRVBMQVlfXy5mb3JFYWNoKGNiID0+IGNiKGhvb2spKTtcclxuICAgICAgICAgICAgdGFyZ2V0Ll9fVlVFX0RFVlRPT0xTX0hPT0tfUkVQTEFZX18gPSBbXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW3Z1ZS1kZXZ0b29sc10gRXJyb3IgZHVyaW5nIGhvb2sgcmVwbGF5JywgZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gQ2xvbmUgZGVlcCB1dGlsaXR5IGZvciBjbG9uaW5nIGluaXRpYWwgc3RhdGUgb2YgdGhlIHN0b3JlXHJcbiAgICAvLyBGb3JrZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vcGxhbnR0aGVpZGVhL2Zhc3QtY29weVxyXG4gICAgLy8gTGFzdCB1cGRhdGU6IDIwMTktMTAtMzBcclxuICAgIC8vIOKaoO+4jyBEb24ndCBmb3JnZXQgdG8gdXBkYXRlIGAuL2hvb2suanNgXHJcbiAgICAvLyB1dGlsc1xyXG4gICAgY29uc3QgeyB0b1N0cmluZzogdG9TdHJpbmdGdW5jdGlvbiB9ID0gRnVuY3Rpb24ucHJvdG90eXBlO1xyXG4gICAgY29uc3QgeyBjcmVhdGUsIGRlZmluZVByb3BlcnR5LCBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IsIGdldE93blByb3BlcnR5TmFtZXMsIGdldE93blByb3BlcnR5U3ltYm9scywgZ2V0UHJvdG90eXBlT2YsIH0gPSBPYmplY3Q7XHJcbiAgICBjb25zdCB7IGhhc093blByb3BlcnR5LCBwcm9wZXJ0eUlzRW51bWVyYWJsZSB9ID0gT2JqZWN0LnByb3RvdHlwZTtcclxuICAgIC8qKlxyXG4gICAgICogQGVudW1cclxuICAgICAqXHJcbiAgICAgKiBAY29uc3Qge09iamVjdH0gU1VQUE9SVFNcclxuICAgICAqXHJcbiAgICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IFNZTUJPTF9QUk9QRVJUSUVTIGFyZSBzeW1ib2wgcHJvcGVydGllcyBzdXBwb3J0ZWRcclxuICAgICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gV0VBS1NFVCBpcyBXZWFrU2V0IHN1cHBvcnRlZFxyXG4gICAgICovXHJcbiAgICBjb25zdCBTVVBQT1JUUyA9IHtcclxuICAgICAgICBTWU1CT0xfUFJPUEVSVElFUzogdHlwZW9mIGdldE93blByb3BlcnR5U3ltYm9scyA9PT0gJ2Z1bmN0aW9uJyxcclxuICAgICAgICBXRUFLU0VUOiB0eXBlb2YgV2Vha1NldCA9PT0gJ2Z1bmN0aW9uJyxcclxuICAgIH07XHJcbiAgICAvKipcclxuICAgICAqIEBmdW5jdGlvbiBjcmVhdGVDYWNoZVxyXG4gICAgICpcclxuICAgICAqIEBkZXNjcmlwdGlvblxyXG4gICAgICogZ2V0IGEgbmV3IGNhY2hlIG9iamVjdCB0byBwcmV2ZW50IGNpcmN1bGFyIHJlZmVyZW5jZXNcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB0aGUgbmV3IGNhY2hlIG9iamVjdFxyXG4gICAgICovXHJcbiAgICBjb25zdCBjcmVhdGVDYWNoZSA9ICgpID0+IHtcclxuICAgICAgICBpZiAoU1VQUE9SVFMuV0VBS1NFVCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFdlYWtTZXQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3Qgb2JqZWN0ID0gY3JlYXRlKHtcclxuICAgICAgICAgICAgYWRkOiAodmFsdWUpID0+IG9iamVjdC5fdmFsdWVzLnB1c2godmFsdWUpLFxyXG4gICAgICAgICAgICBoYXM6ICh2YWx1ZSkgPT4gISF+b2JqZWN0Ll92YWx1ZXMuaW5kZXhPZih2YWx1ZSksXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgb2JqZWN0Ll92YWx1ZXMgPSBbXTtcclxuICAgICAgICByZXR1cm4gb2JqZWN0O1xyXG4gICAgfTtcclxuICAgIC8qKlxyXG4gICAgICogQGZ1bmN0aW9uIGdldENsZWFuQ2xvbmVcclxuICAgICAqXHJcbiAgICAgKiBAZGVzY3JpcHRpb25cclxuICAgICAqIGdldCBhbiBlbXB0eSB2ZXJzaW9uIG9mIHRoZSBvYmplY3Qgd2l0aCB0aGUgc2FtZSBwcm90b3R5cGUgaXQgaGFzXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIG9iamVjdCB0aGUgb2JqZWN0IHRvIGJ1aWxkIGEgY2xlYW4gY2xvbmUgZnJvbVxyXG4gICAgICogQHBhcmFtIHJlYWxtIHRoZSByZWFsbSB0aGUgb2JqZWN0IHJlc2lkZXMgaW5cclxuICAgICAqIEByZXR1cm5zIHRoZSBlbXB0eSBjbG9uZWQgb2JqZWN0XHJcbiAgICAgKi9cclxuICAgIGNvbnN0IGdldENsZWFuQ2xvbmUgPSAob2JqZWN0LCByZWFsbSkgPT4ge1xyXG4gICAgICAgIGlmICghb2JqZWN0LmNvbnN0cnVjdG9yKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjcmVhdGUobnVsbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wcm90b1xyXG4gICAgICAgIGNvbnN0IHByb3RvdHlwZSA9IG9iamVjdC5fX3Byb3RvX18gfHwgZ2V0UHJvdG90eXBlT2Yob2JqZWN0KTtcclxuICAgICAgICBpZiAob2JqZWN0LmNvbnN0cnVjdG9yID09PSByZWFsbS5PYmplY3QpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHByb3RvdHlwZSA9PT0gcmVhbG0uT2JqZWN0LnByb3RvdHlwZSA/IHt9IDogY3JlYXRlKHByb3RvdHlwZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh+dG9TdHJpbmdGdW5jdGlvbi5jYWxsKG9iamVjdC5jb25zdHJ1Y3RvcikuaW5kZXhPZignW25hdGl2ZSBjb2RlXScpKSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IG9iamVjdC5jb25zdHJ1Y3RvcigpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBFcnJvclxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBjcmVhdGUocHJvdG90eXBlKTtcclxuICAgIH07XHJcbiAgICAvKipcclxuICAgICAqIEBmdW5jdGlvbiBnZXRPYmplY3RDbG9uZUxvb3NlXHJcbiAgICAgKlxyXG4gICAgICogQGRlc2NyaXB0aW9uXHJcbiAgICAgKiBnZXQgYSBjb3B5IG9mIHRoZSBvYmplY3QgYmFzZWQgb24gbG9vc2UgcnVsZXMsIG1lYW5pbmcgYWxsIGVudW1lcmFibGUga2V5c1xyXG4gICAgICogYW5kIHN5bWJvbHMgYXJlIGNvcGllZCwgYnV0IHByb3BlcnR5IGRlc2NyaXB0b3JzIGFyZSBub3QgY29uc2lkZXJlZFxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBvYmplY3QgdGhlIG9iamVjdCB0byBjbG9uZVxyXG4gICAgICogQHBhcmFtIHJlYWxtIHRoZSByZWFsbSB0aGUgb2JqZWN0IHJlc2lkZXMgaW5cclxuICAgICAqIEBwYXJhbSBoYW5kbGVDb3B5IHRoZSBmdW5jdGlvbiB0aGF0IGhhbmRsZXMgY29weWluZyB0aGUgb2JqZWN0XHJcbiAgICAgKiBAcmV0dXJucyB0aGUgY29waWVkIG9iamVjdFxyXG4gICAgICovXHJcbiAgICBjb25zdCBnZXRPYmplY3RDbG9uZUxvb3NlID0gKG9iamVjdCwgcmVhbG0sIGhhbmRsZUNvcHksIGNhY2hlKSA9PiB7XHJcbiAgICAgICAgY29uc3QgY2xvbmUgPSBnZXRDbGVhbkNsb25lKG9iamVjdCwgcmVhbG0pO1xyXG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIG9iamVjdCkge1xyXG4gICAgICAgICAgICBpZiAoaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGtleSkpIHtcclxuICAgICAgICAgICAgICAgIGNsb25lW2tleV0gPSBoYW5kbGVDb3B5KG9iamVjdFtrZXldLCBjYWNoZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKFNVUFBPUlRTLlNZTUJPTF9QUk9QRVJUSUVTKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHN5bWJvbHMgPSBnZXRPd25Qcm9wZXJ0eVN5bWJvbHMob2JqZWN0KTtcclxuICAgICAgICAgICAgaWYgKHN5bWJvbHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpbmRleCA9IDAsIHN5bWJvbDsgaW5kZXggPCBzeW1ib2xzLmxlbmd0aDsgaW5kZXgrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHN5bWJvbCA9IHN5bWJvbHNbaW5kZXhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKG9iamVjdCwgc3ltYm9sKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbG9uZVtzeW1ib2xdID0gaGFuZGxlQ29weShvYmplY3Rbc3ltYm9sXSwgY2FjaGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY2xvbmU7XHJcbiAgICB9O1xyXG4gICAgLyoqXHJcbiAgICAgKiBAZnVuY3Rpb24gZ2V0T2JqZWN0Q2xvbmVTdHJpY3RcclxuICAgICAqXHJcbiAgICAgKiBAZGVzY3JpcHRpb25cclxuICAgICAqIGdldCBhIGNvcHkgb2YgdGhlIG9iamVjdCBiYXNlZCBvbiBzdHJpY3QgcnVsZXMsIG1lYW5pbmcgYWxsIGtleXMgYW5kIHN5bWJvbHNcclxuICAgICAqIGFyZSBjb3BpZWQgYmFzZWQgb24gdGhlIG9yaWdpbmFsIHByb3BlcnR5IGRlc2NyaXB0b3JzXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIG9iamVjdCB0aGUgb2JqZWN0IHRvIGNsb25lXHJcbiAgICAgKiBAcGFyYW0gcmVhbG0gdGhlIHJlYWxtIHRoZSBvYmplY3QgcmVzaWRlcyBpblxyXG4gICAgICogQHBhcmFtIGhhbmRsZUNvcHkgdGhlIGZ1bmN0aW9uIHRoYXQgaGFuZGxlcyBjb3B5aW5nIHRoZSBvYmplY3RcclxuICAgICAqIEByZXR1cm5zIHRoZSBjb3BpZWQgb2JqZWN0XHJcbiAgICAgKi9cclxuICAgIGNvbnN0IGdldE9iamVjdENsb25lU3RyaWN0ID0gKG9iamVjdCwgcmVhbG0sIGhhbmRsZUNvcHksIGNhY2hlKSA9PiB7XHJcbiAgICAgICAgY29uc3QgY2xvbmUgPSBnZXRDbGVhbkNsb25lKG9iamVjdCwgcmVhbG0pO1xyXG4gICAgICAgIGNvbnN0IHByb3BlcnRpZXMgPSBTVVBQT1JUUy5TWU1CT0xfUFJPUEVSVElFU1xyXG4gICAgICAgICAgICA/IFtdLmNvbmNhdChnZXRPd25Qcm9wZXJ0eU5hbWVzKG9iamVjdCksIGdldE93blByb3BlcnR5U3ltYm9scyhvYmplY3QpKVxyXG4gICAgICAgICAgICA6IGdldE93blByb3BlcnR5TmFtZXMob2JqZWN0KTtcclxuICAgICAgICBpZiAocHJvcGVydGllcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaW5kZXggPSAwLCBwcm9wZXJ0eSwgZGVzY3JpcHRvcjsgaW5kZXggPCBwcm9wZXJ0aWVzLmxlbmd0aDsgaW5kZXgrKykge1xyXG4gICAgICAgICAgICAgICAgcHJvcGVydHkgPSBwcm9wZXJ0aWVzW2luZGV4XTtcclxuICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0eSAhPT0gJ2NhbGxlZScgJiYgcHJvcGVydHkgIT09ICdjYWxsZXInKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRvciA9IGdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmplY3QsIHByb3BlcnR5KTtcclxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdG9yLnZhbHVlID0gaGFuZGxlQ29weShvYmplY3RbcHJvcGVydHldLCBjYWNoZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkoY2xvbmUsIHByb3BlcnR5LCBkZXNjcmlwdG9yKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY2xvbmU7XHJcbiAgICB9O1xyXG4gICAgLyoqXHJcbiAgICAgKiBAZnVuY3Rpb24gZ2V0UmVnRXhwRmxhZ3NcclxuICAgICAqXHJcbiAgICAgKiBAZGVzY3JpcHRpb25cclxuICAgICAqIGdldCB0aGUgZmxhZ3MgdG8gYXBwbHkgdG8gdGhlIGNvcGllZCByZWdleHBcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gcmVnRXhwIHRoZSByZWdleHAgdG8gZ2V0IHRoZSBmbGFncyBvZlxyXG4gICAgICogQHJldHVybnMgdGhlIGZsYWdzIGZvciB0aGUgcmVnZXhwXHJcbiAgICAgKi9cclxuICAgIGNvbnN0IGdldFJlZ0V4cEZsYWdzID0gKHJlZ0V4cCkgPT4ge1xyXG4gICAgICAgIGxldCBmbGFncyA9ICcnO1xyXG4gICAgICAgIGlmIChyZWdFeHAuZ2xvYmFsKSB7XHJcbiAgICAgICAgICAgIGZsYWdzICs9ICdnJztcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHJlZ0V4cC5pZ25vcmVDYXNlKSB7XHJcbiAgICAgICAgICAgIGZsYWdzICs9ICdpJztcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHJlZ0V4cC5tdWx0aWxpbmUpIHtcclxuICAgICAgICAgICAgZmxhZ3MgKz0gJ20nO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocmVnRXhwLnVuaWNvZGUpIHtcclxuICAgICAgICAgICAgZmxhZ3MgKz0gJ3UnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocmVnRXhwLnN0aWNreSkge1xyXG4gICAgICAgICAgICBmbGFncyArPSAneSc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmbGFncztcclxuICAgIH07XHJcbiAgICBjb25zdCB7IGlzQXJyYXkgfSA9IEFycmF5O1xyXG4gICAgY29uc3QgR0xPQkFMX1RISVMgPSAoKCkgPT4ge1xyXG4gICAgICAgIGlmICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNlbGY7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICByZXR1cm4gd2luZG93O1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGdsb2JhbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdVbmFibGUgdG8gbG9jYXRlIGdsb2JhbCBvYmplY3QsIHJldHVybmluZyBcInRoaXNcIi4nKTtcclxuICAgICAgICB9XHJcbiAgICB9KSgpO1xyXG4gICAgLyoqXHJcbiAgICAgKiBAZnVuY3Rpb24gY2xvbmVcclxuICAgICAqXHJcbiAgICAgKiBAZGVzY3JpcHRpb25cclxuICAgICAqIGNvcHkgYW4gb2JqZWN0IGRlZXBseSBhcyBtdWNoIGFzIHBvc3NpYmxlXHJcbiAgICAgKlxyXG4gICAgICogSWYgYHN0cmljdGAgaXMgYXBwbGllZCwgdGhlbiBhbGwgcHJvcGVydGllcyAoaW5jbHVkaW5nIG5vbi1lbnVtZXJhYmxlIG9uZXMpXHJcbiAgICAgKiBhcmUgY29waWVkIHdpdGggdGhlaXIgb3JpZ2luYWwgcHJvcGVydHkgZGVzY3JpcHRvcnMgb24gYm90aCBvYmplY3RzIGFuZCBhcnJheXMuXHJcbiAgICAgKlxyXG4gICAgICogVGhlIG9iamVjdCBpcyBjb21wYXJlZCB0byB0aGUgZ2xvYmFsIGNvbnN0cnVjdG9ycyBpbiB0aGUgYHJlYWxtYCBwcm92aWRlZCxcclxuICAgICAqIGFuZCB0aGUgbmF0aXZlIGNvbnN0cnVjdG9yIGlzIGFsd2F5cyB1c2VkIHRvIGVuc3VyZSB0aGF0IGV4dGVuc2lvbnMgb2YgbmF0aXZlXHJcbiAgICAgKiBvYmplY3RzIChhbGxvd3MgaW4gRVMyMDE1KykgYXJlIG1haW50YWluZWQuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIG9iamVjdCB0aGUgb2JqZWN0IHRvIGNvcHlcclxuICAgICAqIEBwYXJhbSBbb3B0aW9uc10gdGhlIG9wdGlvbnMgZm9yIGNvcHlpbmcgd2l0aFxyXG4gICAgICogQHBhcmFtIFtvcHRpb25zLmlzU3RyaWN0XSBzaG91bGQgdGhlIGNvcHkgYmUgc3RyaWN0XHJcbiAgICAgKiBAcGFyYW0gW29wdGlvbnMucmVhbG1dIHRoZSByZWFsbSAodGhpcykgb2JqZWN0IHRoZSBvYmplY3QgaXMgY29waWVkIGZyb21cclxuICAgICAqIEByZXR1cm5zIHRoZSBjb3BpZWQgb2JqZWN0XHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGNsb25lKG9iamVjdCwgb3B0aW9ucyA9IG51bGwpIHtcclxuICAgICAgICAvLyBtYW51YWxseSBjb2FsZXNjZWQgaW5zdGVhZCBvZiBkZWZhdWx0IHBhcmFtZXRlcnMgZm9yIHBlcmZvcm1hbmNlXHJcbiAgICAgICAgY29uc3QgaXNTdHJpY3QgPSAhIShvcHRpb25zICYmIG9wdGlvbnMuaXNTdHJpY3QpO1xyXG4gICAgICAgIGNvbnN0IHJlYWxtID0gKG9wdGlvbnMgJiYgb3B0aW9ucy5yZWFsbSkgfHwgR0xPQkFMX1RISVM7XHJcbiAgICAgICAgY29uc3QgZ2V0T2JqZWN0Q2xvbmUgPSBpc1N0cmljdFxyXG4gICAgICAgICAgICA/IGdldE9iamVjdENsb25lU3RyaWN0XHJcbiAgICAgICAgICAgIDogZ2V0T2JqZWN0Q2xvbmVMb29zZTtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAZnVuY3Rpb24gaGFuZGxlQ29weVxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQGRlc2NyaXB0aW9uXHJcbiAgICAgICAgICogY29weSB0aGUgb2JqZWN0IHJlY3Vyc2l2ZWx5IGJhc2VkIG9uIGl0cyB0eXBlXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcGFyYW0gb2JqZWN0IHRoZSBvYmplY3QgdG8gY29weVxyXG4gICAgICAgICAqIEByZXR1cm5zIHRoZSBjb3BpZWQgb2JqZWN0XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgY29uc3QgaGFuZGxlQ29weSA9IChvYmplY3QsIGNhY2hlKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghb2JqZWN0IHx8IHR5cGVvZiBvYmplY3QgIT09ICdvYmplY3QnIHx8IGNhY2hlLmhhcyhvYmplY3QpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb2JqZWN0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIERPTSBvYmplY3RzXHJcbiAgICAgICAgICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9iamVjdC5jbG9uZU5vZGUoZmFsc2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IENvbnN0cnVjdG9yID0gb2JqZWN0LmNvbnN0cnVjdG9yO1xyXG4gICAgICAgICAgICAvLyBwbGFpbiBvYmplY3RzXHJcbiAgICAgICAgICAgIGlmIChDb25zdHJ1Y3RvciA9PT0gcmVhbG0uT2JqZWN0KSB7XHJcbiAgICAgICAgICAgICAgICBjYWNoZS5hZGQob2JqZWN0KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBnZXRPYmplY3RDbG9uZShvYmplY3QsIHJlYWxtLCBoYW5kbGVDb3B5LCBjYWNoZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbGV0IGNsb25lO1xyXG4gICAgICAgICAgICAvLyBhcnJheXNcclxuICAgICAgICAgICAgaWYgKGlzQXJyYXkob2JqZWN0KSkge1xyXG4gICAgICAgICAgICAgICAgY2FjaGUuYWRkKG9iamVjdCk7XHJcbiAgICAgICAgICAgICAgICAvLyBpZiBzdHJpY3QsIGluY2x1ZGUgbm9uLXN0YW5kYXJkIHByb3BlcnRpZXNcclxuICAgICAgICAgICAgICAgIGlmIChpc1N0cmljdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBnZXRPYmplY3RDbG9uZVN0cmljdChvYmplY3QsIHJlYWxtLCBoYW5kbGVDb3B5LCBjYWNoZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjbG9uZSA9IG5ldyBDb25zdHJ1Y3RvcigpO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IG9iamVjdC5sZW5ndGg7IGluZGV4KyspIHtcclxuICAgICAgICAgICAgICAgICAgICBjbG9uZVtpbmRleF0gPSBoYW5kbGVDb3B5KG9iamVjdFtpbmRleF0sIGNhY2hlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBjbG9uZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBkYXRlc1xyXG4gICAgICAgICAgICBpZiAob2JqZWN0IGluc3RhbmNlb2YgcmVhbG0uRGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBDb25zdHJ1Y3RvcihvYmplY3QuZ2V0VGltZSgpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyByZWdleHBzXHJcbiAgICAgICAgICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiByZWFsbS5SZWdFeHApIHtcclxuICAgICAgICAgICAgICAgIGNsb25lID0gbmV3IENvbnN0cnVjdG9yKG9iamVjdC5zb3VyY2UsIG9iamVjdC5mbGFncyB8fCBnZXRSZWdFeHBGbGFncyhvYmplY3QpKTtcclxuICAgICAgICAgICAgICAgIGNsb25lLmxhc3RJbmRleCA9IG9iamVjdC5sYXN0SW5kZXg7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY2xvbmU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gbWFwc1xyXG4gICAgICAgICAgICBpZiAocmVhbG0uTWFwICYmIG9iamVjdCBpbnN0YW5jZW9mIHJlYWxtLk1hcCkge1xyXG4gICAgICAgICAgICAgICAgY2FjaGUuYWRkKG9iamVjdCk7XHJcbiAgICAgICAgICAgICAgICBjbG9uZSA9IG5ldyBDb25zdHJ1Y3RvcigpO1xyXG4gICAgICAgICAgICAgICAgb2JqZWN0LmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjbG9uZS5zZXQoa2V5LCBoYW5kbGVDb3B5KHZhbHVlLCBjYWNoZSkpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY2xvbmU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gc2V0c1xyXG4gICAgICAgICAgICBpZiAocmVhbG0uU2V0ICYmIG9iamVjdCBpbnN0YW5jZW9mIHJlYWxtLlNldCkge1xyXG4gICAgICAgICAgICAgICAgY2FjaGUuYWRkKG9iamVjdCk7XHJcbiAgICAgICAgICAgICAgICBjbG9uZSA9IG5ldyBDb25zdHJ1Y3RvcigpO1xyXG4gICAgICAgICAgICAgICAgb2JqZWN0LmZvckVhY2goKHZhbHVlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xvbmUuYWRkKGhhbmRsZUNvcHkodmFsdWUsIGNhY2hlKSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjbG9uZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBidWZmZXJzIChub2RlLW9ubHkpXHJcbiAgICAgICAgICAgIGlmIChyZWFsbS5CdWZmZXIgJiYgcmVhbG0uQnVmZmVyLmlzQnVmZmVyKG9iamVjdCkpIHtcclxuICAgICAgICAgICAgICAgIGNsb25lID0gcmVhbG0uQnVmZmVyLmFsbG9jVW5zYWZlXHJcbiAgICAgICAgICAgICAgICAgICAgPyByZWFsbS5CdWZmZXIuYWxsb2NVbnNhZmUob2JqZWN0Lmxlbmd0aClcclxuICAgICAgICAgICAgICAgICAgICA6IG5ldyBDb25zdHJ1Y3RvcihvYmplY3QubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIG9iamVjdC5jb3B5KGNsb25lKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjbG9uZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBhcnJheWJ1ZmZlcnMgLyBkYXRhdmlld3NcclxuICAgICAgICAgICAgaWYgKHJlYWxtLkFycmF5QnVmZmVyKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBkYXRhdmlld3NcclxuICAgICAgICAgICAgICAgIGlmIChyZWFsbS5BcnJheUJ1ZmZlci5pc1ZpZXcob2JqZWN0KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQ29uc3RydWN0b3Iob2JqZWN0LmJ1ZmZlci5zbGljZSgwKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBhcnJheWJ1ZmZlcnNcclxuICAgICAgICAgICAgICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiByZWFsbS5BcnJheUJ1ZmZlcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvYmplY3Quc2xpY2UoMCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gaWYgdGhlIG9iamVjdCBjYW5ub3QgLyBzaG91bGQgbm90IGJlIGNsb25lZCwgZG9uJ3RcclxuICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAvLyBwcm9taXNlLWxpa2VcclxuICAgICAgICAgICAgKGhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCAndGhlbicpICYmIHR5cGVvZiBvYmplY3QudGhlbiA9PT0gJ2Z1bmN0aW9uJykgfHxcclxuICAgICAgICAgICAgICAgIC8vIGVycm9yc1xyXG4gICAgICAgICAgICAgICAgb2JqZWN0IGluc3RhbmNlb2YgRXJyb3IgfHxcclxuICAgICAgICAgICAgICAgIC8vIHdlYWttYXBzXHJcbiAgICAgICAgICAgICAgICAocmVhbG0uV2Vha01hcCAmJiBvYmplY3QgaW5zdGFuY2VvZiByZWFsbS5XZWFrTWFwKSB8fFxyXG4gICAgICAgICAgICAgICAgLy8gd2Vha3NldHNcclxuICAgICAgICAgICAgICAgIChyZWFsbS5XZWFrU2V0ICYmIG9iamVjdCBpbnN0YW5jZW9mIHJlYWxtLldlYWtTZXQpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb2JqZWN0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhY2hlLmFkZChvYmplY3QpO1xyXG4gICAgICAgICAgICAvLyBhc3N1bWUgYW55dGhpbmcgbGVmdCBpcyBhIGN1c3RvbSBjb25zdHJ1Y3RvclxyXG4gICAgICAgICAgICByZXR1cm4gZ2V0T2JqZWN0Q2xvbmUob2JqZWN0LCByZWFsbSwgaGFuZGxlQ29weSwgY2FjaGUpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIGhhbmRsZUNvcHkob2JqZWN0LCBjcmVhdGVDYWNoZSgpKTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLmluc3RhbGxIb29rID0gaW5zdGFsbEhvb2s7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWhvb2suanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5nZXRDYXRjaGVkR2V0dGVycyA9IGV4cG9ydHMuZ2V0Q3VzdG9tU3RvcmVEZXRhaWxzID0gZXhwb3J0cy5nZXRDdXN0b21Sb3V0ZXJEZXRhaWxzID0gZXhwb3J0cy5pc1Z1ZUluc3RhbmNlID0gZXhwb3J0cy5nZXRDdXN0b21JbnN0YW5jZURldGFpbHMgPSBleHBvcnRzLmdldEluc3RhbmNlTWFwID0gZXhwb3J0cy5iYWNrZW5kSW5qZWN0aW9ucyA9IHZvaWQgMDtcclxuZXhwb3J0cy5iYWNrZW5kSW5qZWN0aW9ucyA9IHtcclxuICAgIGluc3RhbmNlTWFwOiBuZXcgTWFwKCksXHJcbiAgICBpc1Z1ZUluc3RhbmNlOiAoKCkgPT4gZmFsc2UpLFxyXG4gICAgZ2V0Q3VzdG9tSW5zdGFuY2VEZXRhaWxzOiAoKCkgPT4gKHt9KSksXHJcbn07XHJcbmZ1bmN0aW9uIGdldEluc3RhbmNlTWFwKCkge1xyXG4gICAgcmV0dXJuIGV4cG9ydHMuYmFja2VuZEluamVjdGlvbnMuaW5zdGFuY2VNYXA7XHJcbn1cclxuZXhwb3J0cy5nZXRJbnN0YW5jZU1hcCA9IGdldEluc3RhbmNlTWFwO1xyXG5mdW5jdGlvbiBnZXRDdXN0b21JbnN0YW5jZURldGFpbHMoaW5zdGFuY2UpIHtcclxuICAgIHJldHVybiBleHBvcnRzLmJhY2tlbmRJbmplY3Rpb25zLmdldEN1c3RvbUluc3RhbmNlRGV0YWlscyhpbnN0YW5jZSk7XHJcbn1cclxuZXhwb3J0cy5nZXRDdXN0b21JbnN0YW5jZURldGFpbHMgPSBnZXRDdXN0b21JbnN0YW5jZURldGFpbHM7XHJcbmZ1bmN0aW9uIGlzVnVlSW5zdGFuY2UodmFsdWUpIHtcclxuICAgIHJldHVybiBleHBvcnRzLmJhY2tlbmRJbmplY3Rpb25zLmlzVnVlSW5zdGFuY2UodmFsdWUpO1xyXG59XHJcbmV4cG9ydHMuaXNWdWVJbnN0YW5jZSA9IGlzVnVlSW5zdGFuY2U7XHJcbi8vIEBUT0RPIHJlZmFjdG9yXHJcbmZ1bmN0aW9uIGdldEN1c3RvbVJvdXRlckRldGFpbHMocm91dGVyKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIF9jdXN0b206IHtcclxuICAgICAgICAgICAgdHlwZTogJ3JvdXRlcicsXHJcbiAgICAgICAgICAgIGRpc3BsYXk6ICdWdWVSb3V0ZXInLFxyXG4gICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgb3B0aW9uczogcm91dGVyLm9wdGlvbnMsXHJcbiAgICAgICAgICAgICAgICBjdXJyZW50Um91dGU6IHJvdXRlci5jdXJyZW50Um91dGUsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGZpZWxkczoge1xyXG4gICAgICAgICAgICAgICAgYWJzdHJhY3Q6IHRydWUsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy5nZXRDdXN0b21Sb3V0ZXJEZXRhaWxzID0gZ2V0Q3VzdG9tUm91dGVyRGV0YWlscztcclxuLy8gQFRPRE8gcmVmYWN0b3JcclxuZnVuY3Rpb24gZ2V0Q3VzdG9tU3RvcmVEZXRhaWxzKHN0b3JlKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIF9jdXN0b206IHtcclxuICAgICAgICAgICAgdHlwZTogJ3N0b3JlJyxcclxuICAgICAgICAgICAgZGlzcGxheTogJ1N0b3JlJyxcclxuICAgICAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgICAgIHN0YXRlOiBzdG9yZS5zdGF0ZSxcclxuICAgICAgICAgICAgICAgIGdldHRlcnM6IGdldENhdGNoZWRHZXR0ZXJzKHN0b3JlKSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZmllbGRzOiB7XHJcbiAgICAgICAgICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLmdldEN1c3RvbVN0b3JlRGV0YWlscyA9IGdldEN1c3RvbVN0b3JlRGV0YWlscztcclxuLy8gQFRPRE8gcmVmYWN0b3JcclxuZnVuY3Rpb24gZ2V0Q2F0Y2hlZEdldHRlcnMoc3RvcmUpIHtcclxuICAgIGNvbnN0IGdldHRlcnMgPSB7fTtcclxuICAgIGNvbnN0IG9yaWdHZXR0ZXJzID0gc3RvcmUuZ2V0dGVycyB8fCB7fTtcclxuICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhvcmlnR2V0dGVycyk7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBjb25zdCBrZXkgPSBrZXlzW2ldO1xyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShnZXR0ZXJzLCBrZXksIHtcclxuICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgZ2V0OiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvcmlnR2V0dGVyc1trZXldO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIHJldHVybiBnZXR0ZXJzO1xyXG59XHJcbmV4cG9ydHMuZ2V0Q2F0Y2hlZEdldHRlcnMgPSBnZXRDYXRjaGVkR2V0dGVycztcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YmFja2VuZC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLkJyaWRnZSA9IHZvaWQgMDtcclxuY29uc3QgZXZlbnRzXzEgPSByZXF1aXJlKFwiZXZlbnRzXCIpO1xyXG5jb25zdCBCQVRDSF9EVVJBVElPTiA9IDEwMDtcclxuY2xhc3MgQnJpZGdlIGV4dGVuZHMgZXZlbnRzXzEuRXZlbnRFbWl0dGVyIHtcclxuICAgIGNvbnN0cnVjdG9yKHdhbGwpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMuc2V0TWF4TGlzdGVuZXJzKEluZmluaXR5KTtcclxuICAgICAgICB0aGlzLndhbGwgPSB3YWxsO1xyXG4gICAgICAgIHdhbGwubGlzdGVuKG1lc3NhZ2VzID0+IHtcclxuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkobWVzc2FnZXMpKSB7XHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlcy5mb3JFYWNoKG1lc3NhZ2UgPT4gdGhpcy5fZW1pdChtZXNzYWdlKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9lbWl0KG1lc3NhZ2VzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuX2JhdGNoaW5nUXVldWUgPSBbXTtcclxuICAgICAgICB0aGlzLl9zZW5kaW5nUXVldWUgPSBbXTtcclxuICAgICAgICB0aGlzLl9yZWNlaXZpbmdRdWV1ZSA9IFtdO1xyXG4gICAgICAgIHRoaXMuX3NlbmRpbmcgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLl90aW1lID0gbnVsbDtcclxuICAgIH1cclxuICAgIHNlbmQoZXZlbnQsIHBheWxvYWQpIHtcclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShwYXlsb2FkKSkge1xyXG4gICAgICAgICAgICBjb25zdCBsYXN0SW5kZXggPSBwYXlsb2FkLmxlbmd0aCAtIDE7XHJcbiAgICAgICAgICAgIHBheWxvYWQuZm9yRWFjaCgoY2h1bmssIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zZW5kKHtcclxuICAgICAgICAgICAgICAgICAgICBldmVudCxcclxuICAgICAgICAgICAgICAgICAgICBfY2h1bms6IGNodW5rLFxyXG4gICAgICAgICAgICAgICAgICAgIGxhc3Q6IGluZGV4ID09PSBsYXN0SW5kZXgsXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZsdXNoKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuX3RpbWUgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5fc2VuZChbeyBldmVudCwgcGF5bG9hZCB9XSk7XHJcbiAgICAgICAgICAgIHRoaXMuX3RpbWUgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fYmF0Y2hpbmdRdWV1ZS5wdXNoKHtcclxuICAgICAgICAgICAgICAgIGV2ZW50LFxyXG4gICAgICAgICAgICAgICAgcGF5bG9hZCxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XHJcbiAgICAgICAgICAgIGlmIChub3cgLSB0aGlzLl90aW1lID4gQkFUQ0hfRFVSQVRJT04pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2ZsdXNoKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl90aW1lciA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fZmx1c2goKSwgQkFUQ0hfRFVSQVRJT04pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBMb2cgYSBtZXNzYWdlIHRvIHRoZSBkZXZ0b29scyBiYWNrZ3JvdW5kIHBhZ2UuXHJcbiAgICAgKi9cclxuICAgIGxvZyhtZXNzYWdlKSB7XHJcbiAgICAgICAgdGhpcy5zZW5kKCdsb2cnLCBtZXNzYWdlKTtcclxuICAgIH1cclxuICAgIF9mbHVzaCgpIHtcclxuICAgICAgICBpZiAodGhpcy5fYmF0Y2hpbmdRdWV1ZS5sZW5ndGgpXHJcbiAgICAgICAgICAgIHRoaXMuX3NlbmQodGhpcy5fYmF0Y2hpbmdRdWV1ZSk7XHJcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3RpbWVyKTtcclxuICAgICAgICB0aGlzLl9iYXRjaGluZ1F1ZXVlID0gW107XHJcbiAgICAgICAgdGhpcy5fdGltZSA9IG51bGw7XHJcbiAgICB9XHJcbiAgICAvLyBAVE9ETyB0eXBlc1xyXG4gICAgX2VtaXQobWVzc2FnZSkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgbWVzc2FnZSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgdGhpcy5lbWl0KG1lc3NhZ2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChtZXNzYWdlLl9jaHVuaykge1xyXG4gICAgICAgICAgICB0aGlzLl9yZWNlaXZpbmdRdWV1ZS5wdXNoKG1lc3NhZ2UuX2NodW5rKTtcclxuICAgICAgICAgICAgaWYgKG1lc3NhZ2UubGFzdCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KG1lc3NhZ2UuZXZlbnQsIHRoaXMuX3JlY2VpdmluZ1F1ZXVlKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3JlY2VpdmluZ1F1ZXVlID0gW107XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAobWVzc2FnZS5ldmVudCkge1xyXG4gICAgICAgICAgICB0aGlzLmVtaXQobWVzc2FnZS5ldmVudCwgbWVzc2FnZS5wYXlsb2FkKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBAVE9ETyB0eXBlc1xyXG4gICAgX3NlbmQobWVzc2FnZXMpIHtcclxuICAgICAgICB0aGlzLl9zZW5kaW5nUXVldWUucHVzaChtZXNzYWdlcyk7XHJcbiAgICAgICAgdGhpcy5fbmV4dFNlbmQoKTtcclxuICAgIH1cclxuICAgIF9uZXh0U2VuZCgpIHtcclxuICAgICAgICBpZiAoIXRoaXMuX3NlbmRpbmdRdWV1ZS5sZW5ndGggfHwgdGhpcy5fc2VuZGluZylcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuX3NlbmRpbmcgPSB0cnVlO1xyXG4gICAgICAgIGNvbnN0IG1lc3NhZ2VzID0gdGhpcy5fc2VuZGluZ1F1ZXVlLnNoaWZ0KCk7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdGhpcy53YWxsLnNlbmQobWVzc2FnZXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIGlmIChlcnIubWVzc2FnZSA9PT0gJ01lc3NhZ2UgbGVuZ3RoIGV4Y2VlZGVkIG1heGltdW0gYWxsb3dlZCBsZW5ndGguJykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fc2VuZGluZ1F1ZXVlLnNwbGljZSgwLCAwLCBtZXNzYWdlcy5tYXAobWVzc2FnZSA9PiBbbWVzc2FnZV0pKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9zZW5kaW5nID0gZmFsc2U7XHJcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHRoaXMuX25leHRTZW5kKCkpO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuQnJpZGdlID0gQnJpZGdlO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1icmlkZ2UuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5Ib29rRXZlbnRzID0gZXhwb3J0cy5CcmlkZ2VTdWJzY3JpcHRpb25zID0gZXhwb3J0cy5CcmlkZ2VFdmVudHMgPSBleHBvcnRzLkJ1aWx0aW5UYWJzID0gdm9pZCAwO1xyXG52YXIgQnVpbHRpblRhYnM7XHJcbihmdW5jdGlvbiAoQnVpbHRpblRhYnMpIHtcclxuICAgIEJ1aWx0aW5UYWJzW1wiQ09NUE9ORU5UU1wiXSA9IFwiY29tcG9uZW50c1wiO1xyXG4gICAgQnVpbHRpblRhYnNbXCJUSU1FTElORVwiXSA9IFwidGltZWxpbmVcIjtcclxuICAgIEJ1aWx0aW5UYWJzW1wiUExVR0lOU1wiXSA9IFwicGx1Z2luc1wiO1xyXG4gICAgQnVpbHRpblRhYnNbXCJTRVRUSU5HU1wiXSA9IFwic2V0dGluZ3NcIjtcclxufSkoQnVpbHRpblRhYnMgPSBleHBvcnRzLkJ1aWx0aW5UYWJzIHx8IChleHBvcnRzLkJ1aWx0aW5UYWJzID0ge30pKTtcclxudmFyIEJyaWRnZUV2ZW50cztcclxuKGZ1bmN0aW9uIChCcmlkZ2VFdmVudHMpIHtcclxuICAgIC8vIE1pc2NcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfU1VCU0NSSUJFXCJdID0gXCJiOnN1YnNjcmliZVwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19VTlNVQlNDUklCRVwiXSA9IFwiYjp1bnN1YnNjcmliZVwiO1xyXG4gICAgLyoqIEJhY2tlbmQgaXMgcmVhZHkgKi9cclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0ZST05UX1JFQURZXCJdID0gXCJmOnJlYWR5XCI7XHJcbiAgICAvKiogRGlzcGxheXMgdGhlIFwiZGV0ZWN0ZWQgVnVlXCIgY29uc29sZSBsb2cgKi9cclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfTE9HX0RFVEVDVEVEX1ZVRVwiXSA9IFwiYjpsb2ctZGV0ZWN0ZWQtdnVlXCI7XHJcbiAgICAvKiogRm9yY2UgcmVmcmVzaCAqL1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19SRUZSRVNIXCJdID0gXCJiOnJlZnJlc2hcIjtcclxuICAgIC8qKiBUYWIgd2FzIHN3aXRjaGVkICovXHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX1RBQl9TV0lUQ0hcIl0gPSBcImI6dGFiOnN3aXRjaFwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19MT0dcIl0gPSBcImI6bG9nXCI7XHJcbiAgICAvLyBBcHBzXHJcbiAgICAvKiogQXBwIHdhcyByZWdpc3RlcmVkICovXHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19GUk9OVF9BUFBfQUREXCJdID0gXCJmOmFwcDphZGRcIjtcclxuICAgIC8qKiBHZXQgYXBwIGxpc3QgKi9cclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfQVBQX0xJU1RcIl0gPSBcImI6YXBwOmxpc3RcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0ZST05UX0FQUF9MSVNUXCJdID0gXCJmOmFwcDpsaXN0XCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19GUk9OVF9BUFBfUkVNT1ZFXCJdID0gXCJmOmFwcDpyZW1vdmVcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfQVBQX1NFTEVDVFwiXSA9IFwiYjphcHA6c2VsZWN0XCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19GUk9OVF9BUFBfU0VMRUNURURcIl0gPSBcImY6YXBwOnNlbGVjdGVkXCI7XHJcbiAgICAvLyBDb21wb25lbnRzXHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX0NPTVBPTkVOVF9UUkVFXCJdID0gXCJiOmNvbXBvbmVudDp0cmVlXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19GUk9OVF9DT01QT05FTlRfVFJFRVwiXSA9IFwiZjpjb21wb25lbnQ6dHJlZVwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19DT01QT05FTlRfU0VMRUNURURfREFUQVwiXSA9IFwiYjpjb21wb25lbnQ6c2VsZWN0ZWQtZGF0YVwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fRlJPTlRfQ09NUE9ORU5UX1NFTEVDVEVEX0RBVEFcIl0gPSBcImY6Y29tcG9uZW50OnNlbGVjdGVkLWRhdGFcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfQ09NUE9ORU5UX0VYUEFORFwiXSA9IFwiYjpjb21wb25lbnQ6ZXhwYW5kXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19GUk9OVF9DT01QT05FTlRfRVhQQU5EXCJdID0gXCJmOmNvbXBvbmVudDpleHBhbmRcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfQ09NUE9ORU5UX1NDUk9MTF9UT1wiXSA9IFwiYjpjb21wb25lbnQ6c2Nyb2xsLXRvXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX0NPTVBPTkVOVF9GSUxURVJcIl0gPSBcImI6Y29tcG9uZW50OmZpbHRlclwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19DT01QT05FTlRfTU9VU0VfT1ZFUlwiXSA9IFwiYjpjb21wb25lbnQ6bW91c2Utb3ZlclwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19DT01QT05FTlRfTU9VU0VfT1VUXCJdID0gXCJiOmNvbXBvbmVudDptb3VzZS1vdXRcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfQ09NUE9ORU5UX0NPTlRFWFRfTUVOVV9UQVJHRVRcIl0gPSBcImI6Y29tcG9uZW50OmNvbnRleHQtbWVudS10YXJnZXRcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfQ09NUE9ORU5UX0VESVRfU1RBVEVcIl0gPSBcImI6Y29tcG9uZW50OmVkaXQtc3RhdGVcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfQ09NUE9ORU5UX1BJQ0tcIl0gPSBcImI6Y29tcG9uZW50OnBpY2tcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0ZST05UX0NPTVBPTkVOVF9QSUNLXCJdID0gXCJmOmNvbXBvbmVudDpwaWNrXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX0NPTVBPTkVOVF9QSUNLX0NBTkNFTEVEXCJdID0gXCJiOmNvbXBvbmVudDpwaWNrLWNhbmNlbGVkXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19GUk9OVF9DT01QT05FTlRfUElDS19DQU5DRUxFRFwiXSA9IFwiZjpjb21wb25lbnQ6cGljay1jYW5jZWxlZFwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19DT01QT05FTlRfSU5TUEVDVF9ET01cIl0gPSBcImI6Y29tcG9uZW50Omluc3BlY3QtZG9tXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19GUk9OVF9DT01QT05FTlRfSU5TUEVDVF9ET01cIl0gPSBcImY6Y29tcG9uZW50Omluc3BlY3QtZG9tXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX0NPTVBPTkVOVF9SRU5ERVJfQ09ERVwiXSA9IFwiYjpjb21wb25lbnQ6cmVuZGVyLWNvZGVcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0ZST05UX0NPTVBPTkVOVF9SRU5ERVJfQ09ERVwiXSA9IFwiZjpjb21wb25lbnQ6cmVuZGVyLWNvZGVcIjtcclxuICAgIC8vIFRpbWVsaW5lXHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19GUk9OVF9USU1FTElORV9FVkVOVFwiXSA9IFwiZjp0aW1lbGluZTpldmVudFwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19USU1FTElORV9MQVlFUl9MSVNUXCJdID0gXCJiOnRpbWVsaW5lOmxheWVyLWxpc3RcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0ZST05UX1RJTUVMSU5FX0xBWUVSX0xJU1RcIl0gPSBcImY6dGltZWxpbmU6bGF5ZXItbGlzdFwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fRlJPTlRfVElNRUxJTkVfTEFZRVJfQUREXCJdID0gXCJmOnRpbWVsaW5lOmxheWVyLWFkZFwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19USU1FTElORV9TSE9XX1NDUkVFTlNIT1RcIl0gPSBcImI6dGltZWxpbmU6c2hvdy1zY3JlZW5zaG90XCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX1RJTUVMSU5FX0NMRUFSXCJdID0gXCJiOnRpbWVsaW5lOmNsZWFyXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX1RJTUVMSU5FX0VWRU5UX0RBVEFcIl0gPSBcImI6dGltZWxpbmU6ZXZlbnQtZGF0YVwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fRlJPTlRfVElNRUxJTkVfRVZFTlRfREFUQVwiXSA9IFwiZjp0aW1lbGluZTpldmVudC1kYXRhXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX1RJTUVMSU5FX0xBWUVSX0xPQURfRVZFTlRTXCJdID0gXCJiOnRpbWVsaW5lOmxheWVyLWxvYWQtZXZlbnRzXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19GUk9OVF9USU1FTElORV9MQVlFUl9MT0FEX0VWRU5UU1wiXSA9IFwiZjp0aW1lbGluZTpsYXllci1sb2FkLWV2ZW50c1wiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19USU1FTElORV9MT0FEX01BUktFUlNcIl0gPSBcImI6dGltZWxpbmU6bG9hZC1tYXJrZXJzXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19GUk9OVF9USU1FTElORV9MT0FEX01BUktFUlNcIl0gPSBcImY6dGltZWxpbmU6bG9hZC1tYXJrZXJzXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19GUk9OVF9USU1FTElORV9NQVJLRVJcIl0gPSBcImY6dGltZWxpbmU6bWFya2VyXCI7XHJcbiAgICAvLyBQbHVnaW5zXHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX0RFVlRPT0xTX1BMVUdJTl9MSVNUXCJdID0gXCJiOmRldnRvb2xzLXBsdWdpbjpsaXN0XCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19GUk9OVF9ERVZUT09MU19QTFVHSU5fTElTVFwiXSA9IFwiZjpkZXZ0b29scy1wbHVnaW46bGlzdFwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fRlJPTlRfREVWVE9PTFNfUExVR0lOX0FERFwiXSA9IFwiZjpkZXZ0b29scy1wbHVnaW46YWRkXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX0RFVlRPT0xTX1BMVUdJTl9TRVRUSU5HX1VQREFURURcIl0gPSBcImI6ZGV2dG9vbHMtcGx1Z2luOnNldHRpbmctdXBkYXRlZFwiO1xyXG4gICAgLy8gQ3VzdG9tIGluc3BlY3RvcnNcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfQ1VTVE9NX0lOU1BFQ1RPUl9MSVNUXCJdID0gXCJiOmN1c3RvbS1pbnNwZWN0b3I6bGlzdFwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fRlJPTlRfQ1VTVE9NX0lOU1BFQ1RPUl9MSVNUXCJdID0gXCJmOmN1c3RvbS1pbnNwZWN0b3I6bGlzdFwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fRlJPTlRfQ1VTVE9NX0lOU1BFQ1RPUl9BRERcIl0gPSBcImY6Y3VzdG9tLWluc3BlY3RvcjphZGRcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfQ1VTVE9NX0lOU1BFQ1RPUl9UUkVFXCJdID0gXCJiOmN1c3RvbS1pbnNwZWN0b3I6dHJlZVwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fRlJPTlRfQ1VTVE9NX0lOU1BFQ1RPUl9UUkVFXCJdID0gXCJmOmN1c3RvbS1pbnNwZWN0b3I6dHJlZVwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19DVVNUT01fSU5TUEVDVE9SX1NUQVRFXCJdID0gXCJiOmN1c3RvbS1pbnNwZWN0b3I6c3RhdGVcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0ZST05UX0NVU1RPTV9JTlNQRUNUT1JfU1RBVEVcIl0gPSBcImY6Y3VzdG9tLWluc3BlY3RvcjpzdGF0ZVwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19DVVNUT01fSU5TUEVDVE9SX0VESVRfU1RBVEVcIl0gPSBcImI6Y3VzdG9tLWluc3BlY3RvcjplZGl0LXN0YXRlXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX0NVU1RPTV9JTlNQRUNUT1JfQUNUSU9OXCJdID0gXCJiOmN1c3RvbS1pbnNwZWN0b3I6YWN0aW9uXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19GUk9OVF9DVVNUT01fSU5TUEVDVE9SX1NFTEVDVF9OT0RFXCJdID0gXCJmOmN1c3RvbS1pbnNwZWN0b3I6c2VsZWN0LW5vZGVcIjtcclxuICAgIC8vIEN1c3RvbSBzdGF0ZVxyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19DVVNUT01fU1RBVEVfQUNUSU9OXCJdID0gXCJiOmN1c3RvbS1zdGF0ZTphY3Rpb25cIjtcclxufSkoQnJpZGdlRXZlbnRzID0gZXhwb3J0cy5CcmlkZ2VFdmVudHMgfHwgKGV4cG9ydHMuQnJpZGdlRXZlbnRzID0ge30pKTtcclxudmFyIEJyaWRnZVN1YnNjcmlwdGlvbnM7XHJcbihmdW5jdGlvbiAoQnJpZGdlU3Vic2NyaXB0aW9ucykge1xyXG4gICAgQnJpZGdlU3Vic2NyaXB0aW9uc1tcIlNFTEVDVEVEX0NPTVBPTkVOVF9EQVRBXCJdID0gXCJjb21wb25lbnQ6c2VsZWN0ZWQtZGF0YVwiO1xyXG4gICAgQnJpZGdlU3Vic2NyaXB0aW9uc1tcIkNPTVBPTkVOVF9UUkVFXCJdID0gXCJjb21wb25lbnQ6dHJlZVwiO1xyXG59KShCcmlkZ2VTdWJzY3JpcHRpb25zID0gZXhwb3J0cy5CcmlkZ2VTdWJzY3JpcHRpb25zIHx8IChleHBvcnRzLkJyaWRnZVN1YnNjcmlwdGlvbnMgPSB7fSkpO1xyXG52YXIgSG9va0V2ZW50cztcclxuKGZ1bmN0aW9uIChIb29rRXZlbnRzKSB7XHJcbiAgICBIb29rRXZlbnRzW1wiSU5JVFwiXSA9IFwiaW5pdFwiO1xyXG4gICAgSG9va0V2ZW50c1tcIkFQUF9JTklUXCJdID0gXCJhcHA6aW5pdFwiO1xyXG4gICAgSG9va0V2ZW50c1tcIkFQUF9BRERcIl0gPSBcImFwcDphZGRcIjtcclxuICAgIEhvb2tFdmVudHNbXCJBUFBfVU5NT1VOVFwiXSA9IFwiYXBwOnVubW91bnRcIjtcclxuICAgIEhvb2tFdmVudHNbXCJDT01QT05FTlRfVVBEQVRFRFwiXSA9IFwiY29tcG9uZW50OnVwZGF0ZWRcIjtcclxuICAgIEhvb2tFdmVudHNbXCJDT01QT05FTlRfQURERURcIl0gPSBcImNvbXBvbmVudDphZGRlZFwiO1xyXG4gICAgSG9va0V2ZW50c1tcIkNPTVBPTkVOVF9SRU1PVkVEXCJdID0gXCJjb21wb25lbnQ6cmVtb3ZlZFwiO1xyXG4gICAgSG9va0V2ZW50c1tcIkNPTVBPTkVOVF9FTUlUXCJdID0gXCJjb21wb25lbnQ6ZW1pdFwiO1xyXG4gICAgSG9va0V2ZW50c1tcIkNPTVBPTkVOVF9ISUdITElHSFRcIl0gPSBcImNvbXBvbmVudDpoaWdobGlnaHRcIjtcclxuICAgIEhvb2tFdmVudHNbXCJDT01QT05FTlRfVU5ISUdITElHSFRcIl0gPSBcImNvbXBvbmVudDp1bmhpZ2hsaWdodFwiO1xyXG4gICAgSG9va0V2ZW50c1tcIlNFVFVQX0RFVlRPT0xTX1BMVUdJTlwiXSA9IFwiZGV2dG9vbHMtcGx1Z2luOnNldHVwXCI7XHJcbiAgICBIb29rRXZlbnRzW1wiVElNRUxJTkVfTEFZRVJfQURERURcIl0gPSBcInRpbWVsaW5lOmxheWVyLWFkZGVkXCI7XHJcbiAgICBIb29rRXZlbnRzW1wiVElNRUxJTkVfRVZFTlRfQURERURcIl0gPSBcInRpbWVsaW5lOmV2ZW50LWFkZGVkXCI7XHJcbiAgICBIb29rRXZlbnRzW1wiQ1VTVE9NX0lOU1BFQ1RPUl9BRERcIl0gPSBcImN1c3RvbS1pbnNwZWN0b3I6YWRkXCI7XHJcbiAgICBIb29rRXZlbnRzW1wiQ1VTVE9NX0lOU1BFQ1RPUl9TRU5EX1RSRUVcIl0gPSBcImN1c3RvbS1pbnNwZWN0b3I6c2VuZC10cmVlXCI7XHJcbiAgICBIb29rRXZlbnRzW1wiQ1VTVE9NX0lOU1BFQ1RPUl9TRU5EX1NUQVRFXCJdID0gXCJjdXN0b20taW5zcGVjdG9yOnNlbmQtc3RhdGVcIjtcclxuICAgIEhvb2tFdmVudHNbXCJDVVNUT01fSU5TUEVDVE9SX1NFTEVDVF9OT0RFXCJdID0gXCJjdXN0b20taW5zcGVjdG9yOnNlbGVjdC1ub2RlXCI7XHJcbiAgICBIb29rRXZlbnRzW1wiUEVSRk9STUFOQ0VfU1RBUlRcIl0gPSBcInBlcmY6c3RhcnRcIjtcclxuICAgIEhvb2tFdmVudHNbXCJQRVJGT1JNQU5DRV9FTkRcIl0gPSBcInBlcmY6ZW5kXCI7XHJcbiAgICBIb29rRXZlbnRzW1wiUExVR0lOX1NFVFRJTkdTX1NFVFwiXSA9IFwicGx1Z2luOnNldHRpbmdzOnNldFwiO1xyXG4gICAgLyoqXHJcbiAgICAgKiBAZGVwcmVjYXRlZFxyXG4gICAgICovXHJcbiAgICBIb29rRXZlbnRzW1wiRkxVU0hcIl0gPSBcImZsdXNoXCI7XHJcbn0pKEhvb2tFdmVudHMgPSBleHBvcnRzLkhvb2tFdmVudHMgfHwgKGV4cG9ydHMuSG9va0V2ZW50cyA9IHt9KSk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWNvbnN0cy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLlN0YXRlRWRpdG9yID0gdm9pZCAwO1xyXG5jbGFzcyBTdGF0ZUVkaXRvciB7XHJcbiAgICBzZXQob2JqZWN0LCBwYXRoLCB2YWx1ZSwgY2IgPSBudWxsKSB7XHJcbiAgICAgICAgY29uc3Qgc2VjdGlvbnMgPSBBcnJheS5pc0FycmF5KHBhdGgpID8gcGF0aCA6IHBhdGguc3BsaXQoJy4nKTtcclxuICAgICAgICB3aGlsZSAoc2VjdGlvbnMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICBvYmplY3QgPSBvYmplY3Rbc2VjdGlvbnMuc2hpZnQoKV07XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzUmVmKG9iamVjdCkpIHtcclxuICAgICAgICAgICAgICAgIG9iamVjdCA9IHRoaXMuZ2V0UmVmVmFsdWUob2JqZWN0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBmaWVsZCA9IHNlY3Rpb25zWzBdO1xyXG4gICAgICAgIGlmIChjYikge1xyXG4gICAgICAgICAgICBjYihvYmplY3QsIGZpZWxkLCB2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuaXNSZWYob2JqZWN0W2ZpZWxkXSkpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRSZWZWYWx1ZShvYmplY3RbZmllbGRdLCB2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBvYmplY3RbZmllbGRdID0gdmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZ2V0KG9iamVjdCwgcGF0aCkge1xyXG4gICAgICAgIGNvbnN0IHNlY3Rpb25zID0gQXJyYXkuaXNBcnJheShwYXRoKSA/IHBhdGggOiBwYXRoLnNwbGl0KCcuJyk7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWN0aW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBvYmplY3QgPSBvYmplY3Rbc2VjdGlvbnNbaV1dO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5pc1JlZihvYmplY3QpKSB7XHJcbiAgICAgICAgICAgICAgICBvYmplY3QgPSB0aGlzLmdldFJlZlZhbHVlKG9iamVjdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCFvYmplY3QpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG9iamVjdDtcclxuICAgIH1cclxuICAgIGhhcyhvYmplY3QsIHBhdGgsIHBhcmVudCA9IGZhbHNlKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvYmplY3QgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3Qgc2VjdGlvbnMgPSBBcnJheS5pc0FycmF5KHBhdGgpID8gcGF0aC5zbGljZSgpIDogcGF0aC5zcGxpdCgnLicpO1xyXG4gICAgICAgIGNvbnN0IHNpemUgPSAhcGFyZW50ID8gMSA6IDI7XHJcbiAgICAgICAgd2hpbGUgKG9iamVjdCAmJiBzZWN0aW9ucy5sZW5ndGggPiBzaXplKSB7XHJcbiAgICAgICAgICAgIG9iamVjdCA9IG9iamVjdFtzZWN0aW9ucy5zaGlmdCgpXTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuaXNSZWYob2JqZWN0KSkge1xyXG4gICAgICAgICAgICAgICAgb2JqZWN0ID0gdGhpcy5nZXRSZWZWYWx1ZShvYmplY3QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBvYmplY3QgIT0gbnVsbCAmJiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBzZWN0aW9uc1swXSk7XHJcbiAgICB9XHJcbiAgICBjcmVhdGVEZWZhdWx0U2V0Q2FsbGJhY2soc3RhdGUpIHtcclxuICAgICAgICByZXR1cm4gKG9iaiwgZmllbGQsIHZhbHVlKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChzdGF0ZS5yZW1vdmUgfHwgc3RhdGUubmV3S2V5KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvYmopKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2JqLnNwbGljZShmaWVsZCwgMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgb2JqW2ZpZWxkXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXN0YXRlLnJlbW92ZSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gb2JqW3N0YXRlLm5ld0tleSB8fCBmaWVsZF07XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pc1JlZih0YXJnZXQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRSZWZWYWx1ZSh0YXJnZXQsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIG9ialtzdGF0ZS5uZXdLZXkgfHwgZmllbGRdID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgaXNSZWYocmVmKSB7XHJcbiAgICAgICAgLy8gVG8gaW1wbGVtZW50IGluIHN1YmNsYXNzXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgc2V0UmVmVmFsdWUocmVmLCB2YWx1ZSkge1xyXG4gICAgICAgIC8vIFRvIGltcGxlbWVudCBpbiBzdWJjbGFzc1xyXG4gICAgfVxyXG4gICAgZ2V0UmVmVmFsdWUocmVmKSB7XHJcbiAgICAgICAgLy8gVG8gaW1wbGVtZW50IGluIHN1YmNsYXNzXHJcbiAgICAgICAgcmV0dXJuIHJlZjtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLlN0YXRlRWRpdG9yID0gU3RhdGVFZGl0b3I7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWVkaXQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5pbml0RW52ID0gZXhwb3J0cy5rZXlzID0gZXhwb3J0cy5pc0xpbnV4ID0gZXhwb3J0cy5pc01hYyA9IGV4cG9ydHMuaXNXaW5kb3dzID0gZXhwb3J0cy5pc0ZpcmVmb3ggPSBleHBvcnRzLmlzQ2hyb21lID0gZXhwb3J0cy50YXJnZXQgPSBleHBvcnRzLmlzQnJvd3NlciA9IHZvaWQgMDtcclxuZXhwb3J0cy5pc0Jyb3dzZXIgPSB0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJztcclxuZXhwb3J0cy50YXJnZXQgPSBleHBvcnRzLmlzQnJvd3NlclxyXG4gICAgPyB3aW5kb3dcclxuICAgIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCdcclxuICAgICAgICA/IGdsb2JhbFxyXG4gICAgICAgIDoge307XHJcbmV4cG9ydHMuaXNDaHJvbWUgPSB0eXBlb2YgZXhwb3J0cy50YXJnZXQuY2hyb21lICE9PSAndW5kZWZpbmVkJyAmJiAhIWV4cG9ydHMudGFyZ2V0LmNocm9tZS5kZXZ0b29scztcclxuZXhwb3J0cy5pc0ZpcmVmb3ggPSBleHBvcnRzLmlzQnJvd3NlciAmJiBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ0ZpcmVmb3gnKSA+IC0xO1xyXG5leHBvcnRzLmlzV2luZG93cyA9IGV4cG9ydHMuaXNCcm93c2VyICYmIG5hdmlnYXRvci5wbGF0Zm9ybS5pbmRleE9mKCdXaW4nKSA9PT0gMDtcclxuZXhwb3J0cy5pc01hYyA9IGV4cG9ydHMuaXNCcm93c2VyICYmIG5hdmlnYXRvci5wbGF0Zm9ybSA9PT0gJ01hY0ludGVsJztcclxuZXhwb3J0cy5pc0xpbnV4ID0gZXhwb3J0cy5pc0Jyb3dzZXIgJiYgbmF2aWdhdG9yLnBsYXRmb3JtLmluZGV4T2YoJ0xpbnV4JykgPT09IDA7XHJcbmV4cG9ydHMua2V5cyA9IHtcclxuICAgIGN0cmw6IGV4cG9ydHMuaXNNYWMgPyAnJiM4OTg0OycgOiAnQ3RybCcsXHJcbiAgICBzaGlmdDogJ1NoaWZ0JyxcclxuICAgIGFsdDogZXhwb3J0cy5pc01hYyA/ICcmIzg5OTc7JyA6ICdBbHQnLFxyXG4gICAgZGVsOiAnRGVsJyxcclxuICAgIGVudGVyOiAnRW50ZXInLFxyXG4gICAgZXNjOiAnRXNjJyxcclxufTtcclxuZnVuY3Rpb24gaW5pdEVudihWdWUpIHtcclxuICAgIGlmIChWdWUucHJvdG90eXBlLmhhc093blByb3BlcnR5KCckaXNDaHJvbWUnKSlcclxuICAgICAgICByZXR1cm47XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhWdWUucHJvdG90eXBlLCB7XHJcbiAgICAgICAgJGlzQ2hyb21lOiB7IGdldDogKCkgPT4gZXhwb3J0cy5pc0Nocm9tZSB9LFxyXG4gICAgICAgICRpc0ZpcmVmb3g6IHsgZ2V0OiAoKSA9PiBleHBvcnRzLmlzRmlyZWZveCB9LFxyXG4gICAgICAgICRpc1dpbmRvd3M6IHsgZ2V0OiAoKSA9PiBleHBvcnRzLmlzV2luZG93cyB9LFxyXG4gICAgICAgICRpc01hYzogeyBnZXQ6ICgpID0+IGV4cG9ydHMuaXNNYWMgfSxcclxuICAgICAgICAkaXNMaW51eDogeyBnZXQ6ICgpID0+IGV4cG9ydHMuaXNMaW51eCB9LFxyXG4gICAgICAgICRrZXlzOiB7IGdldDogKCkgPT4gZXhwb3J0cy5rZXlzIH0sXHJcbiAgICB9KTtcclxuICAgIGlmIChleHBvcnRzLmlzV2luZG93cylcclxuICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ3BsYXRmb3JtLXdpbmRvd3MnKTtcclxuICAgIGlmIChleHBvcnRzLmlzTWFjKVxyXG4gICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCgncGxhdGZvcm0tbWFjJyk7XHJcbiAgICBpZiAoZXhwb3J0cy5pc0xpbnV4KVxyXG4gICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCgncGxhdGZvcm0tbGludXgnKTtcclxufVxyXG5leHBvcnRzLmluaXRFbnYgPSBpbml0RW52O1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1lbnYuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBfX2NyZWF0ZUJpbmRpbmcgPSAodGhpcyAmJiB0aGlzLl9fY3JlYXRlQmluZGluZykgfHwgKE9iamVjdC5jcmVhdGUgPyAoZnVuY3Rpb24obywgbSwgaywgazIpIHtcclxuICAgIGlmIChrMiA9PT0gdW5kZWZpbmVkKSBrMiA9IGs7XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgazIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIG1ba107IH0gfSk7XHJcbn0pIDogKGZ1bmN0aW9uKG8sIG0sIGssIGsyKSB7XHJcbiAgICBpZiAoazIgPT09IHVuZGVmaW5lZCkgazIgPSBrO1xyXG4gICAgb1trMl0gPSBtW2tdO1xyXG59KSk7XHJcbnZhciBfX2V4cG9ydFN0YXIgPSAodGhpcyAmJiB0aGlzLl9fZXhwb3J0U3RhcikgfHwgZnVuY3Rpb24obSwgZXhwb3J0cykge1xyXG4gICAgZm9yICh2YXIgcCBpbiBtKSBpZiAocCAhPT0gXCJkZWZhdWx0XCIgJiYgIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChleHBvcnRzLCBwKSkgX19jcmVhdGVCaW5kaW5nKGV4cG9ydHMsIG0sIHApO1xyXG59O1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9iYWNrZW5kXCIpLCBleHBvcnRzKTtcclxuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL2JyaWRnZVwiKSwgZXhwb3J0cyk7XHJcbl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9jb25zdHNcIiksIGV4cG9ydHMpO1xyXG5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vZWRpdFwiKSwgZXhwb3J0cyk7XHJcbl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9lbnZcIiksIGV4cG9ydHMpO1xyXG5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vcGx1Z2luLXBlcm1pc3Npb25zXCIpLCBleHBvcnRzKTtcclxuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL3BsdWdpbi1zZXR0aW5nc1wiKSwgZXhwb3J0cyk7XHJcbl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9zaGFyZWQtZGF0YVwiKSwgZXhwb3J0cyk7XHJcbl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9zaGVsbFwiKSwgZXhwb3J0cyk7XHJcbl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9zdG9yYWdlXCIpLCBleHBvcnRzKTtcclxuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL3RyYW5zZmVyXCIpLCBleHBvcnRzKTtcclxuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL3V0aWxcIiksIGV4cG9ydHMpO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLnNldFBsdWdpblBlcm1pc3Npb24gPSBleHBvcnRzLmhhc1BsdWdpblBlcm1pc3Npb24gPSBleHBvcnRzLlBsdWdpblBlcm1pc3Npb24gPSB2b2lkIDA7XHJcbmNvbnN0IHNoYXJlZF9kYXRhXzEgPSByZXF1aXJlKFwiLi9zaGFyZWQtZGF0YVwiKTtcclxudmFyIFBsdWdpblBlcm1pc3Npb247XHJcbihmdW5jdGlvbiAoUGx1Z2luUGVybWlzc2lvbikge1xyXG4gICAgUGx1Z2luUGVybWlzc2lvbltcIkVOQUJMRURcIl0gPSBcImVuYWJsZWRcIjtcclxuICAgIFBsdWdpblBlcm1pc3Npb25bXCJDT01QT05FTlRTXCJdID0gXCJjb21wb25lbnRzXCI7XHJcbiAgICBQbHVnaW5QZXJtaXNzaW9uW1wiQ1VTVE9NX0lOU1BFQ1RPUlwiXSA9IFwiY3VzdG9tLWluc3BlY3RvclwiO1xyXG4gICAgUGx1Z2luUGVybWlzc2lvbltcIlRJTUVMSU5FXCJdID0gXCJ0aW1lbGluZVwiO1xyXG59KShQbHVnaW5QZXJtaXNzaW9uID0gZXhwb3J0cy5QbHVnaW5QZXJtaXNzaW9uIHx8IChleHBvcnRzLlBsdWdpblBlcm1pc3Npb24gPSB7fSkpO1xyXG5mdW5jdGlvbiBoYXNQbHVnaW5QZXJtaXNzaW9uKHBsdWdpbklkLCBwZXJtaXNzaW9uKSB7XHJcbiAgICBjb25zdCByZXN1bHQgPSBzaGFyZWRfZGF0YV8xLlNoYXJlZERhdGEucGx1Z2luUGVybWlzc2lvbnNbYCR7cGx1Z2luSWR9OiR7cGVybWlzc2lvbn1gXTtcclxuICAgIGlmIChyZXN1bHQgPT0gbnVsbClcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIHJldHVybiAhIXJlc3VsdDtcclxufVxyXG5leHBvcnRzLmhhc1BsdWdpblBlcm1pc3Npb24gPSBoYXNQbHVnaW5QZXJtaXNzaW9uO1xyXG5mdW5jdGlvbiBzZXRQbHVnaW5QZXJtaXNzaW9uKHBsdWdpbklkLCBwZXJtaXNzaW9uLCBhY3RpdmUpIHtcclxuICAgIHNoYXJlZF9kYXRhXzEuU2hhcmVkRGF0YS5wbHVnaW5QZXJtaXNzaW9ucyA9IHtcclxuICAgICAgICAuLi5zaGFyZWRfZGF0YV8xLlNoYXJlZERhdGEucGx1Z2luUGVybWlzc2lvbnMsXHJcbiAgICAgICAgW2Ake3BsdWdpbklkfToke3Blcm1pc3Npb259YF06IGFjdGl2ZSxcclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy5zZXRQbHVnaW5QZXJtaXNzaW9uID0gc2V0UGx1Z2luUGVybWlzc2lvbjtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cGx1Z2luLXBlcm1pc3Npb25zLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuZ2V0UGx1Z2luRGVmYXVsdFNldHRpbmdzID0gZXhwb3J0cy5zZXRQbHVnaW5TZXR0aW5ncyA9IGV4cG9ydHMuZ2V0UGx1Z2luU2V0dGluZ3MgPSB2b2lkIDA7XHJcbmNvbnN0IHNoYXJlZF9kYXRhXzEgPSByZXF1aXJlKFwiLi9zaGFyZWQtZGF0YVwiKTtcclxuZnVuY3Rpb24gZ2V0UGx1Z2luU2V0dGluZ3MocGx1Z2luSWQsIGRlZmF1bHRTZXR0aW5ncykge1xyXG4gICAgdmFyIF9hO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICAuLi5kZWZhdWx0U2V0dGluZ3MgIT09IG51bGwgJiYgZGVmYXVsdFNldHRpbmdzICE9PSB2b2lkIDAgPyBkZWZhdWx0U2V0dGluZ3MgOiB7fSxcclxuICAgICAgICAuLi4oX2EgPSBzaGFyZWRfZGF0YV8xLlNoYXJlZERhdGEucGx1Z2luU2V0dGluZ3NbcGx1Z2luSWRdKSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiB7fSxcclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy5nZXRQbHVnaW5TZXR0aW5ncyA9IGdldFBsdWdpblNldHRpbmdzO1xyXG5mdW5jdGlvbiBzZXRQbHVnaW5TZXR0aW5ncyhwbHVnaW5JZCwgc2V0dGluZ3MpIHtcclxuICAgIHNoYXJlZF9kYXRhXzEuU2hhcmVkRGF0YS5wbHVnaW5TZXR0aW5ncyA9IHtcclxuICAgICAgICAuLi5zaGFyZWRfZGF0YV8xLlNoYXJlZERhdGEucGx1Z2luU2V0dGluZ3MsXHJcbiAgICAgICAgW3BsdWdpbklkXTogc2V0dGluZ3MsXHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuc2V0UGx1Z2luU2V0dGluZ3MgPSBzZXRQbHVnaW5TZXR0aW5ncztcclxuZnVuY3Rpb24gZ2V0UGx1Z2luRGVmYXVsdFNldHRpbmdzKHNjaGVtYSkge1xyXG4gICAgY29uc3QgcmVzdWx0ID0ge307XHJcbiAgICBpZiAoc2NoZW1hKSB7XHJcbiAgICAgICAgZm9yIChjb25zdCBpZCBpbiBzY2hlbWEpIHtcclxuICAgICAgICAgICAgY29uc3QgaXRlbSA9IHNjaGVtYVtpZF07XHJcbiAgICAgICAgICAgIHJlc3VsdFtpZF0gPSBpdGVtLmRlZmF1bHRWYWx1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcbmV4cG9ydHMuZ2V0UGx1Z2luRGVmYXVsdFNldHRpbmdzID0gZ2V0UGx1Z2luRGVmYXVsdFNldHRpbmdzO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1wbHVnaW4tc2V0dGluZ3MuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5TaGFyZWREYXRhID0gZXhwb3J0cy53YXRjaFNoYXJlZERhdGEgPSBleHBvcnRzLmRlc3Ryb3lTaGFyZWREYXRhID0gZXhwb3J0cy5vblNoYXJlZERhdGFJbml0ID0gZXhwb3J0cy5pbml0U2hhcmVkRGF0YSA9IHZvaWQgMDtcclxuY29uc3Qgc3RvcmFnZV8xID0gcmVxdWlyZShcIi4vc3RvcmFnZVwiKTtcclxuY29uc3QgZW52XzEgPSByZXF1aXJlKFwiLi9lbnZcIik7XHJcbi8vIEluaXRpYWwgc3RhdGVcclxuY29uc3QgaW50ZXJuYWxTaGFyZWREYXRhID0ge1xyXG4gICAgb3BlbkluRWRpdG9ySG9zdDogJy8nLFxyXG4gICAgY29tcG9uZW50TmFtZVN0eWxlOiAnY2xhc3MnLFxyXG4gICAgdGhlbWU6ICdhdXRvJyxcclxuICAgIGRpc3BsYXlEZW5zaXR5OiAnbG93JyxcclxuICAgIHRpbWVGb3JtYXQ6ICdkZWZhdWx0JyxcclxuICAgIHJlY29yZFZ1ZXg6IHRydWUsXHJcbiAgICBjYWNoZVZ1ZXhTbmFwc2hvdHNFdmVyeTogNTAsXHJcbiAgICBjYWNoZVZ1ZXhTbmFwc2hvdHNMaW1pdDogMTAsXHJcbiAgICBzbmFwc2hvdExvYWRpbmc6IGZhbHNlLFxyXG4gICAgY29tcG9uZW50RXZlbnRzRW5hYmxlZDogdHJ1ZSxcclxuICAgIHBlcmZvcm1hbmNlTW9uaXRvcmluZ0VuYWJsZWQ6IHRydWUsXHJcbiAgICBlZGl0YWJsZVByb3BzOiBmYWxzZSxcclxuICAgIGxvZ0RldGVjdGVkOiB0cnVlLFxyXG4gICAgdnVleE5ld0JhY2tlbmQ6IGZhbHNlLFxyXG4gICAgdnVleEF1dG9sb2FkOiBmYWxzZSxcclxuICAgIHZ1ZXhHcm91cEdldHRlcnNCeU1vZHVsZTogdHJ1ZSxcclxuICAgIHNob3dNZW51U2Nyb2xsVGlwOiB0cnVlLFxyXG4gICAgdGltZWxpbmVUaW1lR3JpZDogdHJ1ZSxcclxuICAgIHRpbWVsaW5lU2NyZWVuc2hvdHM6IHRydWUsXHJcbiAgICBtZW51U3RlcFNjcm9sbGluZzogZW52XzEuaXNNYWMsXHJcbiAgICBwbHVnaW5QZXJtaXNzaW9uczoge30sXHJcbiAgICBwbHVnaW5TZXR0aW5nczoge30sXHJcbiAgICBwYWdlQ29uZmlnOiB7fSxcclxuICAgIGRlYnVnSW5mbzogZmFsc2UsXHJcbn07XHJcbmNvbnN0IHBlcnNpc3RlZCA9IFtcclxuICAgICdjb21wb25lbnROYW1lU3R5bGUnLFxyXG4gICAgJ3RoZW1lJyxcclxuICAgICdkaXNwbGF5RGVuc2l0eScsXHJcbiAgICAncmVjb3JkVnVleCcsXHJcbiAgICAnZWRpdGFibGVQcm9wcycsXHJcbiAgICAnbG9nRGV0ZWN0ZWQnLFxyXG4gICAgJ3Z1ZXhOZXdCYWNrZW5kJyxcclxuICAgICd2dWV4QXV0b2xvYWQnLFxyXG4gICAgJ3Z1ZXhHcm91cEdldHRlcnNCeU1vZHVsZScsXHJcbiAgICAndGltZUZvcm1hdCcsXHJcbiAgICAnc2hvd01lbnVTY3JvbGxUaXAnLFxyXG4gICAgJ3RpbWVsaW5lVGltZUdyaWQnLFxyXG4gICAgJ3RpbWVsaW5lU2NyZWVuc2hvdHMnLFxyXG4gICAgJ21lbnVTdGVwU2Nyb2xsaW5nJyxcclxuICAgICdwbHVnaW5QZXJtaXNzaW9ucycsXHJcbiAgICAncGx1Z2luU2V0dGluZ3MnLFxyXG4gICAgJ3BlcmZvcm1hbmNlTW9uaXRvcmluZ0VuYWJsZWQnLFxyXG4gICAgJ2NvbXBvbmVudEV2ZW50c0VuYWJsZWQnLFxyXG4gICAgJ2RlYnVnSW5mbycsXHJcbl07XHJcbmNvbnN0IHN0b3JhZ2VWZXJzaW9uID0gJzYuMC4wLWFscGhhLjEnO1xyXG4vLyAtLS0tIElOVEVSTkFMUyAtLS0tIC8vXHJcbmxldCBicmlkZ2U7XHJcbi8vIExpc3Qgb2YgZmllbGRzIHRvIHBlcnNpc3QgdG8gc3RvcmFnZSAoZGlzYWJsZWQgaWYgJ2ZhbHNlJylcclxuLy8gVGhpcyBzaG91bGQgYmUgdW5pcXVlIHRvIGVhY2ggc2hhcmVkIGRhdGEgY2xpZW50IHRvIHByZXZlbnQgY29uZmxpY3RzXHJcbmxldCBwZXJzaXN0ID0gZmFsc2U7XHJcbmxldCBkYXRhO1xyXG5sZXQgaW5pdFJldHJ5SW50ZXJ2YWw7XHJcbmxldCBpbml0UmV0cnlDb3VudCA9IDA7XHJcbmNvbnN0IGluaXRDYnMgPSBbXTtcclxuZnVuY3Rpb24gaW5pdFNoYXJlZERhdGEocGFyYW1zKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAvLyBNYW5kYXRvcnkgcGFyYW1zXHJcbiAgICAgICAgYnJpZGdlID0gcGFyYW1zLmJyaWRnZTtcclxuICAgICAgICBwZXJzaXN0ID0gISFwYXJhbXMucGVyc2lzdDtcclxuICAgICAgICBpZiAocGVyc2lzdCkge1xyXG4gICAgICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbc2hhcmVkIGRhdGFdIE1hc3RlciBpbml0IGluIHByb2dyZXNzLi4uJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gTG9hZCBwZXJzaXN0ZWQgZmllbGRzXHJcbiAgICAgICAgICAgIHBlcnNpc3RlZC5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9ICgwLCBzdG9yYWdlXzEuZ2V0U3RvcmFnZSkoYHZ1ZS1kZXZ0b29scy0ke3N0b3JhZ2VWZXJzaW9ufTpzaGFyZWQtZGF0YToke2tleX1gKTtcclxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGludGVybmFsU2hhcmVkRGF0YVtrZXldID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBicmlkZ2Uub24oJ3NoYXJlZC1kYXRhOmxvYWQnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAvLyBTZW5kIGFsbCBmaWVsZHNcclxuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGludGVybmFsU2hhcmVkRGF0YSkuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbmRWYWx1ZShrZXksIGludGVybmFsU2hhcmVkRGF0YVtrZXldKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgYnJpZGdlLnNlbmQoJ3NoYXJlZC1kYXRhOmxvYWQtY29tcGxldGUnKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGJyaWRnZS5vbignc2hhcmVkLWRhdGE6aW5pdC1jb21wbGV0ZScsICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW3NoYXJlZCBkYXRhXSBNYXN0ZXIgaW5pdCBjb21wbGV0ZScpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbml0UmV0cnlJbnRlcnZhbCk7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBicmlkZ2Uuc2VuZCgnc2hhcmVkLWRhdGE6bWFzdGVyLWluaXQtd2FpdGluZycpO1xyXG4gICAgICAgICAgICAvLyBJbiBjYXNlIGJhY2tlbmQgaW5pdCBpcyBleGVjdXRlZCBhZnRlciBmcm9udGVuZFxyXG4gICAgICAgICAgICBicmlkZ2Uub24oJ3NoYXJlZC1kYXRhOm1pbmlvbi1pbml0LXdhaXRpbmcnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBicmlkZ2Uuc2VuZCgnc2hhcmVkLWRhdGE6bWFzdGVyLWluaXQtd2FpdGluZycpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgaW5pdFJldHJ5Q291bnQgPSAwO1xyXG4gICAgICAgICAgICBjbGVhckludGVydmFsKGluaXRSZXRyeUludGVydmFsKTtcclxuICAgICAgICAgICAgaW5pdFJldHJ5SW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tzaGFyZWQgZGF0YV0gTWFzdGVyIGluaXQgcmV0cnlpbmcuLi4nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyaWRnZS5zZW5kKCdzaGFyZWQtZGF0YTptYXN0ZXItaW5pdC13YWl0aW5nJyk7XHJcbiAgICAgICAgICAgICAgICBpbml0UmV0cnlDb3VudCsrO1xyXG4gICAgICAgICAgICAgICAgaWYgKGluaXRSZXRyeUNvdW50ID4gMzApIHtcclxuICAgICAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKGluaXRSZXRyeUludGVydmFsKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbc2hhcmVkIGRhdGFdIE1hc3RlciBpbml0IGZhaWxlZCcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCAyMDAwKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tzaGFyZWQgZGF0YV0gTWluaW9uIGluaXQgaW4gcHJvZ3Jlc3MuLi4nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBicmlkZ2Uub24oJ3NoYXJlZC1kYXRhOm1hc3Rlci1pbml0LXdhaXRpbmcnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tzaGFyZWQgZGF0YV0gTWluaW9uIGxvYWRpbmcgZGF0YS4uLicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gTG9hZCBhbGwgcGVyc2lzdGVkIHNoYXJlZCBkYXRhXHJcbiAgICAgICAgICAgICAgICBicmlkZ2Uuc2VuZCgnc2hhcmVkLWRhdGE6bG9hZCcpO1xyXG4gICAgICAgICAgICAgICAgYnJpZGdlLm9uY2UoJ3NoYXJlZC1kYXRhOmxvYWQtY29tcGxldGUnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tzaGFyZWQgZGF0YV0gTWluaW9uIGluaXQgY29tcGxldGUnKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJpZGdlLnNlbmQoJ3NoYXJlZC1kYXRhOmluaXQtY29tcGxldGUnKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGJyaWRnZS5zZW5kKCdzaGFyZWQtZGF0YTptaW5pb24taW5pdC13YWl0aW5nJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIC4uLmludGVybmFsU2hhcmVkRGF0YSxcclxuICAgICAgICB9O1xyXG4gICAgICAgIGlmIChwYXJhbXMuVnVlKSB7XHJcbiAgICAgICAgICAgIGRhdGEgPSBwYXJhbXMuVnVlLm9ic2VydmFibGUoZGF0YSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIFVwZGF0ZSB2YWx1ZSBmcm9tIG90aGVyIHNoYXJlZCBkYXRhIGNsaWVudHNcclxuICAgICAgICBicmlkZ2Uub24oJ3NoYXJlZC1kYXRhOnNldCcsICh7IGtleSwgdmFsdWUgfSkgPT4ge1xyXG4gICAgICAgICAgICBzZXRWYWx1ZShrZXksIHZhbHVlKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBpbml0Q2JzLmZvckVhY2goY2IgPT4gY2IoKSk7XHJcbiAgICB9KTtcclxufVxyXG5leHBvcnRzLmluaXRTaGFyZWREYXRhID0gaW5pdFNoYXJlZERhdGE7XHJcbmZ1bmN0aW9uIG9uU2hhcmVkRGF0YUluaXQoY2IpIHtcclxuICAgIGluaXRDYnMucHVzaChjYik7XHJcbiAgICByZXR1cm4gKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gaW5pdENicy5pbmRleE9mKGNiKTtcclxuICAgICAgICBpZiAoaW5kZXggIT09IC0xKVxyXG4gICAgICAgICAgICBpbml0Q2JzLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMub25TaGFyZWREYXRhSW5pdCA9IG9uU2hhcmVkRGF0YUluaXQ7XHJcbmZ1bmN0aW9uIGRlc3Ryb3lTaGFyZWREYXRhKCkge1xyXG4gICAgYnJpZGdlLnJlbW92ZUFsbExpc3RlbmVycygnc2hhcmVkLWRhdGE6c2V0Jyk7XHJcbiAgICB3YXRjaGVycyA9IHt9O1xyXG59XHJcbmV4cG9ydHMuZGVzdHJveVNoYXJlZERhdGEgPSBkZXN0cm95U2hhcmVkRGF0YTtcclxubGV0IHdhdGNoZXJzID0ge307XHJcbmZ1bmN0aW9uIHNldFZhbHVlKGtleSwgdmFsdWUpIHtcclxuICAgIC8vIFN0b3JhZ2VcclxuICAgIGlmIChwZXJzaXN0ICYmIHBlcnNpc3RlZC5pbmNsdWRlcyhrZXkpKSB7XHJcbiAgICAgICAgKDAsIHN0b3JhZ2VfMS5zZXRTdG9yYWdlKShgdnVlLWRldnRvb2xzLSR7c3RvcmFnZVZlcnNpb259OnNoYXJlZC1kYXRhOiR7a2V5fWAsIHZhbHVlKTtcclxuICAgIH1cclxuICAgIGNvbnN0IG9sZFZhbHVlID0gZGF0YVtrZXldO1xyXG4gICAgZGF0YVtrZXldID0gdmFsdWU7XHJcbiAgICBjb25zdCBoYW5kbGVycyA9IHdhdGNoZXJzW2tleV07XHJcbiAgICBpZiAoaGFuZGxlcnMpIHtcclxuICAgICAgICBoYW5kbGVycy5mb3JFYWNoKGggPT4gaCh2YWx1ZSwgb2xkVmFsdWUpKTtcclxuICAgIH1cclxuICAgIC8vIFZhbGlkYXRlIFByb3h5IHNldCB0cmFwXHJcbiAgICByZXR1cm4gdHJ1ZTtcclxufVxyXG5mdW5jdGlvbiBzZW5kVmFsdWUoa2V5LCB2YWx1ZSkge1xyXG4gICAgYnJpZGdlICYmIGJyaWRnZS5zZW5kKCdzaGFyZWQtZGF0YTpzZXQnLCB7XHJcbiAgICAgICAga2V5LFxyXG4gICAgICAgIHZhbHVlLFxyXG4gICAgfSk7XHJcbn1cclxuZnVuY3Rpb24gd2F0Y2hTaGFyZWREYXRhKHByb3AsIGhhbmRsZXIpIHtcclxuICAgIGNvbnN0IGxpc3QgPSB3YXRjaGVyc1twcm9wXSB8fCAod2F0Y2hlcnNbcHJvcF0gPSBbXSk7XHJcbiAgICBsaXN0LnB1c2goaGFuZGxlcik7XHJcbiAgICByZXR1cm4gKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gbGlzdC5pbmRleE9mKGhhbmRsZXIpO1xyXG4gICAgICAgIGlmIChpbmRleCAhPT0gLTEpXHJcbiAgICAgICAgICAgIGxpc3Quc3BsaWNlKGluZGV4LCAxKTtcclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy53YXRjaFNoYXJlZERhdGEgPSB3YXRjaFNoYXJlZERhdGE7XHJcbmNvbnN0IHByb3h5ID0ge307XHJcbk9iamVjdC5rZXlzKGludGVybmFsU2hhcmVkRGF0YSkuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3h5LCBrZXksIHtcclxuICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxyXG4gICAgICAgIGdldDogKCkgPT4gZGF0YVtrZXldLFxyXG4gICAgICAgIHNldDogKHZhbHVlKSA9PiB7XHJcbiAgICAgICAgICAgIHNlbmRWYWx1ZShrZXksIHZhbHVlKTtcclxuICAgICAgICAgICAgc2V0VmFsdWUoa2V5LCB2YWx1ZSk7XHJcbiAgICAgICAgfSxcclxuICAgIH0pO1xyXG59KTtcclxuZXhwb3J0cy5TaGFyZWREYXRhID0gcHJveHk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNoYXJlZC1kYXRhLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuY2xlYXJTdG9yYWdlID0gZXhwb3J0cy5yZW1vdmVTdG9yYWdlID0gZXhwb3J0cy5zZXRTdG9yYWdlID0gZXhwb3J0cy5nZXRTdG9yYWdlID0gZXhwb3J0cy5pbml0U3RvcmFnZSA9IHZvaWQgMDtcclxuY29uc3QgZW52XzEgPSByZXF1aXJlKFwiLi9lbnZcIik7XHJcbi8vIElmIHdlIGNhbiwgd2UgdXNlIHRoZSBicm93c2VyIGV4dGVuc2lvbiBBUEkgdG8gc3RvcmUgZGF0YVxyXG4vLyBpdCdzIGFzeW5jIHRob3VnaCwgc28gd2Ugc3luY2hyb25pemUgY2hhbmdlcyBmcm9tIGFuIGludGVybWVkaWF0ZVxyXG4vLyBzdG9yYWdlRGF0YSBvYmplY3RcclxuY29uc3QgdXNlU3RvcmFnZSA9IHR5cGVvZiBlbnZfMS50YXJnZXQuY2hyb21lICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgZW52XzEudGFyZ2V0LmNocm9tZS5zdG9yYWdlICE9PSAndW5kZWZpbmVkJztcclxubGV0IHN0b3JhZ2VEYXRhID0gbnVsbDtcclxuZnVuY3Rpb24gaW5pdFN0b3JhZ2UoKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICBpZiAodXNlU3RvcmFnZSkge1xyXG4gICAgICAgICAgICBlbnZfMS50YXJnZXQuY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KG51bGwsIHJlc3VsdCA9PiB7XHJcbiAgICAgICAgICAgICAgICBzdG9yYWdlRGF0YSA9IHJlc3VsdDtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBzdG9yYWdlRGF0YSA9IHt9O1xyXG4gICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuZXhwb3J0cy5pbml0U3RvcmFnZSA9IGluaXRTdG9yYWdlO1xyXG5mdW5jdGlvbiBnZXRTdG9yYWdlKGtleSwgZGVmYXVsdFZhbHVlID0gbnVsbCkge1xyXG4gICAgY2hlY2tTdG9yYWdlKCk7XHJcbiAgICBpZiAodXNlU3RvcmFnZSkge1xyXG4gICAgICAgIHJldHVybiBnZXREZWZhdWx0VmFsdWUoc3RvcmFnZURhdGFba2V5XSwgZGVmYXVsdFZhbHVlKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHJldHVybiBnZXREZWZhdWx0VmFsdWUoSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpKSwgZGVmYXVsdFZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGUpIHsgfVxyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuZ2V0U3RvcmFnZSA9IGdldFN0b3JhZ2U7XHJcbmZ1bmN0aW9uIHNldFN0b3JhZ2Uoa2V5LCB2YWwpIHtcclxuICAgIGNoZWNrU3RvcmFnZSgpO1xyXG4gICAgaWYgKHVzZVN0b3JhZ2UpIHtcclxuICAgICAgICBzdG9yYWdlRGF0YVtrZXldID0gdmFsO1xyXG4gICAgICAgIGVudl8xLnRhcmdldC5jaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeyBba2V5XTogdmFsIH0pO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBKU09OLnN0cmluZ2lmeSh2YWwpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGUpIHsgfVxyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuc2V0U3RvcmFnZSA9IHNldFN0b3JhZ2U7XHJcbmZ1bmN0aW9uIHJlbW92ZVN0b3JhZ2Uoa2V5KSB7XHJcbiAgICBjaGVja1N0b3JhZ2UoKTtcclxuICAgIGlmICh1c2VTdG9yYWdlKSB7XHJcbiAgICAgICAgZGVsZXRlIHN0b3JhZ2VEYXRhW2tleV07XHJcbiAgICAgICAgZW52XzEudGFyZ2V0LmNocm9tZS5zdG9yYWdlLmxvY2FsLnJlbW92ZShba2V5XSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCAoZSkgeyB9XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5yZW1vdmVTdG9yYWdlID0gcmVtb3ZlU3RvcmFnZTtcclxuZnVuY3Rpb24gY2xlYXJTdG9yYWdlKCkge1xyXG4gICAgY2hlY2tTdG9yYWdlKCk7XHJcbiAgICBpZiAodXNlU3RvcmFnZSkge1xyXG4gICAgICAgIHN0b3JhZ2VEYXRhID0ge307XHJcbiAgICAgICAgZW52XzEudGFyZ2V0LmNocm9tZS5zdG9yYWdlLmxvY2FsLmNsZWFyKCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2UuY2xlYXIoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGUpIHsgfVxyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuY2xlYXJTdG9yYWdlID0gY2xlYXJTdG9yYWdlO1xyXG5mdW5jdGlvbiBjaGVja1N0b3JhZ2UoKSB7XHJcbiAgICBpZiAoIXN0b3JhZ2VEYXRhKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTdG9yYWdlIHdhc25cXCd0IGluaXRpYWxpemVkIHdpdGggXFwnaW5pdCgpXFwnJyk7XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gZ2V0RGVmYXVsdFZhbHVlKHZhbHVlLCBkZWZhdWx0VmFsdWUpIHtcclxuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XHJcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcclxuICAgIH1cclxuICAgIHJldHVybiB2YWx1ZTtcclxufVxyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1zdG9yYWdlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuc3RyaW5naWZ5U3RyaWN0Q2lyY3VsYXJBdXRvQ2h1bmtzID0gZXhwb3J0cy5wYXJzZUNpcmN1bGFyQXV0b0NodW5rcyA9IGV4cG9ydHMuc3RyaW5naWZ5Q2lyY3VsYXJBdXRvQ2h1bmtzID0gdm9pZCAwO1xyXG5jb25zdCBNQVhfU0VSSUFMSVpFRF9TSVpFID0gNTEyICogMTAyNDsgLy8gMU1CXHJcbmZ1bmN0aW9uIGVuY29kZShkYXRhLCByZXBsYWNlciwgbGlzdCwgc2Vlbikge1xyXG4gICAgbGV0IHN0b3JlZCwga2V5LCB2YWx1ZSwgaSwgbDtcclxuICAgIGNvbnN0IHNlZW5JbmRleCA9IHNlZW4uZ2V0KGRhdGEpO1xyXG4gICAgaWYgKHNlZW5JbmRleCAhPSBudWxsKSB7XHJcbiAgICAgICAgcmV0dXJuIHNlZW5JbmRleDtcclxuICAgIH1cclxuICAgIGNvbnN0IGluZGV4ID0gbGlzdC5sZW5ndGg7XHJcbiAgICBjb25zdCBwcm90byA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChkYXRhKTtcclxuICAgIGlmIChwcm90byA9PT0gJ1tvYmplY3QgT2JqZWN0XScpIHtcclxuICAgICAgICBzdG9yZWQgPSB7fTtcclxuICAgICAgICBzZWVuLnNldChkYXRhLCBpbmRleCk7XHJcbiAgICAgICAgbGlzdC5wdXNoKHN0b3JlZCk7XHJcbiAgICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGRhdGEpO1xyXG4gICAgICAgIGZvciAoaSA9IDAsIGwgPSBrZXlzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgICAgICBrZXkgPSBrZXlzW2ldO1xyXG4gICAgICAgICAgICB2YWx1ZSA9IGRhdGFba2V5XTtcclxuICAgICAgICAgICAgaWYgKHJlcGxhY2VyKVxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSByZXBsYWNlci5jYWxsKGRhdGEsIGtleSwgdmFsdWUpO1xyXG4gICAgICAgICAgICBzdG9yZWRba2V5XSA9IGVuY29kZSh2YWx1ZSwgcmVwbGFjZXIsIGxpc3QsIHNlZW4pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHByb3RvID09PSAnW29iamVjdCBBcnJheV0nKSB7XHJcbiAgICAgICAgc3RvcmVkID0gW107XHJcbiAgICAgICAgc2Vlbi5zZXQoZGF0YSwgaW5kZXgpO1xyXG4gICAgICAgIGxpc3QucHVzaChzdG9yZWQpO1xyXG4gICAgICAgIGZvciAoaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgICAgICB2YWx1ZSA9IGRhdGFbaV07XHJcbiAgICAgICAgICAgIGlmIChyZXBsYWNlcilcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gcmVwbGFjZXIuY2FsbChkYXRhLCBpLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgIHN0b3JlZFtpXSA9IGVuY29kZSh2YWx1ZSwgcmVwbGFjZXIsIGxpc3QsIHNlZW4pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIGxpc3QucHVzaChkYXRhKTtcclxuICAgIH1cclxuICAgIHJldHVybiBpbmRleDtcclxufVxyXG5mdW5jdGlvbiBkZWNvZGUobGlzdCwgcmV2aXZlcikge1xyXG4gICAgbGV0IGkgPSBsaXN0Lmxlbmd0aDtcclxuICAgIGxldCBqLCBrLCBkYXRhLCBrZXksIHZhbHVlLCBwcm90bztcclxuICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICBkYXRhID0gbGlzdFtpXTtcclxuICAgICAgICBwcm90byA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChkYXRhKTtcclxuICAgICAgICBpZiAocHJvdG8gPT09ICdbb2JqZWN0IE9iamVjdF0nKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhkYXRhKTtcclxuICAgICAgICAgICAgZm9yIChqID0gMCwgayA9IGtleXMubGVuZ3RoOyBqIDwgazsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICBrZXkgPSBrZXlzW2pdO1xyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBsaXN0W2RhdGFba2V5XV07XHJcbiAgICAgICAgICAgICAgICBpZiAocmV2aXZlcilcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHJldml2ZXIuY2FsbChkYXRhLCBrZXksIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIGRhdGFba2V5XSA9IHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHByb3RvID09PSAnW29iamVjdCBBcnJheV0nKSB7XHJcbiAgICAgICAgICAgIGZvciAoaiA9IDAsIGsgPSBkYXRhLmxlbmd0aDsgaiA8IGs7IGorKykge1xyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBsaXN0W2RhdGFbal1dO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJldml2ZXIpXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSByZXZpdmVyLmNhbGwoZGF0YSwgaiwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgZGF0YVtqXSA9IHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbmZ1bmN0aW9uIHN0cmluZ2lmeUNpcmN1bGFyQXV0b0NodW5rcyhkYXRhLCByZXBsYWNlciA9IG51bGwsIHNwYWNlID0gbnVsbCkge1xyXG4gICAgbGV0IHJlc3VsdDtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgcmVzdWx0ID0gYXJndW1lbnRzLmxlbmd0aCA9PT0gMVxyXG4gICAgICAgICAgICA/IEpTT04uc3RyaW5naWZ5KGRhdGEpXHJcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcclxuICAgICAgICAgICAgOiBKU09OLnN0cmluZ2lmeShkYXRhLCByZXBsYWNlciwgc3BhY2UpO1xyXG4gICAgfVxyXG4gICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICByZXN1bHQgPSBzdHJpbmdpZnlTdHJpY3RDaXJjdWxhckF1dG9DaHVua3MoZGF0YSwgcmVwbGFjZXIsIHNwYWNlKTtcclxuICAgIH1cclxuICAgIGlmIChyZXN1bHQubGVuZ3RoID4gTUFYX1NFUklBTElaRURfU0laRSkge1xyXG4gICAgICAgIGNvbnN0IGNodW5rQ291bnQgPSBNYXRoLmNlaWwocmVzdWx0Lmxlbmd0aCAvIE1BWF9TRVJJQUxJWkVEX1NJWkUpO1xyXG4gICAgICAgIGNvbnN0IGNodW5rcyA9IFtdO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2h1bmtDb3VudDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNodW5rcy5wdXNoKHJlc3VsdC5zbGljZShpICogTUFYX1NFUklBTElaRURfU0laRSwgKGkgKyAxKSAqIE1BWF9TRVJJQUxJWkVEX1NJWkUpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGNodW5rcztcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn1cclxuZXhwb3J0cy5zdHJpbmdpZnlDaXJjdWxhckF1dG9DaHVua3MgPSBzdHJpbmdpZnlDaXJjdWxhckF1dG9DaHVua3M7XHJcbmZ1bmN0aW9uIHBhcnNlQ2lyY3VsYXJBdXRvQ2h1bmtzKGRhdGEsIHJldml2ZXIgPSBudWxsKSB7XHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheShkYXRhKSkge1xyXG4gICAgICAgIGRhdGEgPSBkYXRhLmpvaW4oJycpO1xyXG4gICAgfVxyXG4gICAgY29uc3QgaGFzQ2lyY3VsYXIgPSAvXlxccy8udGVzdChkYXRhKTtcclxuICAgIGlmICghaGFzQ2lyY3VsYXIpIHtcclxuICAgICAgICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA9PT0gMVxyXG4gICAgICAgICAgICA/IEpTT04ucGFyc2UoZGF0YSlcclxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICA6IEpTT04ucGFyc2UoZGF0YSwgcmV2aXZlcik7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBjb25zdCBsaXN0ID0gSlNPTi5wYXJzZShkYXRhKTtcclxuICAgICAgICBkZWNvZGUobGlzdCwgcmV2aXZlcik7XHJcbiAgICAgICAgcmV0dXJuIGxpc3RbMF07XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5wYXJzZUNpcmN1bGFyQXV0b0NodW5rcyA9IHBhcnNlQ2lyY3VsYXJBdXRvQ2h1bmtzO1xyXG5mdW5jdGlvbiBzdHJpbmdpZnlTdHJpY3RDaXJjdWxhckF1dG9DaHVua3MoZGF0YSwgcmVwbGFjZXIgPSBudWxsLCBzcGFjZSA9IG51bGwpIHtcclxuICAgIGNvbnN0IGxpc3QgPSBbXTtcclxuICAgIGVuY29kZShkYXRhLCByZXBsYWNlciwgbGlzdCwgbmV3IE1hcCgpKTtcclxuICAgIHJldHVybiBzcGFjZVxyXG4gICAgICAgID8gJyAnICsgSlNPTi5zdHJpbmdpZnkobGlzdCwgbnVsbCwgc3BhY2UpXHJcbiAgICAgICAgOiAnICcgKyBKU09OLnN0cmluZ2lmeShsaXN0KTtcclxufVxyXG5leHBvcnRzLnN0cmluZ2lmeVN0cmljdENpcmN1bGFyQXV0b0NodW5rcyA9IHN0cmluZ2lmeVN0cmljdENpcmN1bGFyQXV0b0NodW5rcztcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dHJhbnNmZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xyXG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XHJcbn07XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5pc0VtcHR5T2JqZWN0ID0gZXhwb3J0cy5jb3B5VG9DbGlwYm9hcmQgPSBleHBvcnRzLmVzY2FwZSA9IGV4cG9ydHMub3BlbkluRWRpdG9yID0gZXhwb3J0cy5mb2N1c0lucHV0ID0gZXhwb3J0cy5zaW1wbGVHZXQgPSBleHBvcnRzLnNvcnRCeUtleSA9IGV4cG9ydHMuc2VhcmNoRGVlcEluT2JqZWN0ID0gZXhwb3J0cy5pc1BsYWluT2JqZWN0ID0gZXhwb3J0cy5yZXZpdmUgPSBleHBvcnRzLnBhcnNlID0gZXhwb3J0cy5nZXRDdXN0b21SZWZEZXRhaWxzID0gZXhwb3J0cy5nZXRDdXN0b21IVE1MRWxlbWVudERldGFpbHMgPSBleHBvcnRzLmdldEN1c3RvbUZ1bmN0aW9uRGV0YWlscyA9IGV4cG9ydHMuZ2V0Q3VzdG9tQ29tcG9uZW50RGVmaW5pdGlvbkRldGFpbHMgPSBleHBvcnRzLmdldENvbXBvbmVudE5hbWUgPSBleHBvcnRzLnJldml2ZVNldCA9IGV4cG9ydHMuZ2V0Q3VzdG9tU2V0RGV0YWlscyA9IGV4cG9ydHMucmV2aXZlTWFwID0gZXhwb3J0cy5nZXRDdXN0b21NYXBEZXRhaWxzID0gZXhwb3J0cy5zdHJpbmdpZnkgPSBleHBvcnRzLnNwZWNpYWxUb2tlblRvU3RyaW5nID0gZXhwb3J0cy5NQVhfQVJSQVlfU0laRSA9IGV4cG9ydHMuTUFYX1NUUklOR19TSVpFID0gZXhwb3J0cy5TUEVDSUFMX1RPS0VOUyA9IGV4cG9ydHMuTkFOID0gZXhwb3J0cy5ORUdBVElWRV9JTkZJTklUWSA9IGV4cG9ydHMuSU5GSU5JVFkgPSBleHBvcnRzLlVOREVGSU5FRCA9IGV4cG9ydHMuaW5Eb2MgPSBleHBvcnRzLmdldENvbXBvbmVudERpc3BsYXlOYW1lID0gZXhwb3J0cy5rZWJhYml6ZSA9IGV4cG9ydHMuY2FtZWxpemUgPSBleHBvcnRzLmNsYXNzaWZ5ID0gdm9pZCAwO1xyXG5jb25zdCBwYXRoXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcInBhdGhcIikpO1xyXG5jb25zdCB0cmFuc2Zlcl8xID0gcmVxdWlyZShcIi4vdHJhbnNmZXJcIik7XHJcbmNvbnN0IGJhY2tlbmRfMSA9IHJlcXVpcmUoXCIuL2JhY2tlbmRcIik7XHJcbmNvbnN0IHNoYXJlZF9kYXRhXzEgPSByZXF1aXJlKFwiLi9zaGFyZWQtZGF0YVwiKTtcclxuY29uc3QgZW52XzEgPSByZXF1aXJlKFwiLi9lbnZcIik7XHJcbmZ1bmN0aW9uIGNhY2hlZChmbikge1xyXG4gICAgY29uc3QgY2FjaGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIGNhY2hlZEZuKHN0cikge1xyXG4gICAgICAgIGNvbnN0IGhpdCA9IGNhY2hlW3N0cl07XHJcbiAgICAgICAgcmV0dXJuIGhpdCB8fCAoY2FjaGVbc3RyXSA9IGZuKHN0cikpO1xyXG4gICAgfTtcclxufVxyXG5jb25zdCBjbGFzc2lmeVJFID0gLyg/Ol58Wy1fL10pKFxcdykvZztcclxuZXhwb3J0cy5jbGFzc2lmeSA9IGNhY2hlZCgoc3RyKSA9PiB7XHJcbiAgICByZXR1cm4gc3RyICYmIHN0ci5yZXBsYWNlKGNsYXNzaWZ5UkUsIHRvVXBwZXIpO1xyXG59KTtcclxuY29uc3QgY2FtZWxpemVSRSA9IC8tKFxcdykvZztcclxuZXhwb3J0cy5jYW1lbGl6ZSA9IGNhY2hlZCgoc3RyKSA9PiB7XHJcbiAgICByZXR1cm4gc3RyICYmIHN0ci5yZXBsYWNlKGNhbWVsaXplUkUsIHRvVXBwZXIpO1xyXG59KTtcclxuY29uc3Qga2ViYWJpemVSRSA9IC8oW2EtejAtOV0pKFtBLVpdKS9nO1xyXG5leHBvcnRzLmtlYmFiaXplID0gY2FjaGVkKChzdHIpID0+IHtcclxuICAgIHJldHVybiBzdHIgJiYgc3RyXHJcbiAgICAgICAgLnJlcGxhY2Uoa2ViYWJpemVSRSwgKF8sIGxvd2VyQ2FzZUNoYXJhY3RlciwgdXBwZXJDYXNlTGV0dGVyKSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIGAke2xvd2VyQ2FzZUNoYXJhY3Rlcn0tJHt1cHBlckNhc2VMZXR0ZXJ9YDtcclxuICAgIH0pXHJcbiAgICAgICAgLnRvTG93ZXJDYXNlKCk7XHJcbn0pO1xyXG5mdW5jdGlvbiB0b1VwcGVyKF8sIGMpIHtcclxuICAgIHJldHVybiBjID8gYy50b1VwcGVyQ2FzZSgpIDogJyc7XHJcbn1cclxuZnVuY3Rpb24gZ2V0Q29tcG9uZW50RGlzcGxheU5hbWUob3JpZ2luYWxOYW1lLCBzdHlsZSA9ICdjbGFzcycpIHtcclxuICAgIHN3aXRjaCAoc3R5bGUpIHtcclxuICAgICAgICBjYXNlICdjbGFzcyc6XHJcbiAgICAgICAgICAgIHJldHVybiAoMCwgZXhwb3J0cy5jbGFzc2lmeSkob3JpZ2luYWxOYW1lKTtcclxuICAgICAgICBjYXNlICdrZWJhYic6XHJcbiAgICAgICAgICAgIHJldHVybiAoMCwgZXhwb3J0cy5rZWJhYml6ZSkob3JpZ2luYWxOYW1lKTtcclxuICAgICAgICBjYXNlICdvcmlnaW5hbCc6XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgcmV0dXJuIG9yaWdpbmFsTmFtZTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLmdldENvbXBvbmVudERpc3BsYXlOYW1lID0gZ2V0Q29tcG9uZW50RGlzcGxheU5hbWU7XHJcbmZ1bmN0aW9uIGluRG9jKG5vZGUpIHtcclxuICAgIGlmICghbm9kZSlcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICBjb25zdCBkb2MgPSBub2RlLm93bmVyRG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xyXG4gICAgY29uc3QgcGFyZW50ID0gbm9kZS5wYXJlbnROb2RlO1xyXG4gICAgcmV0dXJuIGRvYyA9PT0gbm9kZSB8fFxyXG4gICAgICAgIGRvYyA9PT0gcGFyZW50IHx8XHJcbiAgICAgICAgISEocGFyZW50ICYmIHBhcmVudC5ub2RlVHlwZSA9PT0gMSAmJiAoZG9jLmNvbnRhaW5zKHBhcmVudCkpKTtcclxufVxyXG5leHBvcnRzLmluRG9jID0gaW5Eb2M7XHJcbi8qKlxyXG4gKiBTdHJpbmdpZnkvcGFyc2UgZGF0YSB1c2luZyBDaXJjdWxhckpTT04uXHJcbiAqL1xyXG5leHBvcnRzLlVOREVGSU5FRCA9ICdfX3Z1ZV9kZXZ0b29sX3VuZGVmaW5lZF9fJztcclxuZXhwb3J0cy5JTkZJTklUWSA9ICdfX3Z1ZV9kZXZ0b29sX2luZmluaXR5X18nO1xyXG5leHBvcnRzLk5FR0FUSVZFX0lORklOSVRZID0gJ19fdnVlX2RldnRvb2xfbmVnYXRpdmVfaW5maW5pdHlfXyc7XHJcbmV4cG9ydHMuTkFOID0gJ19fdnVlX2RldnRvb2xfbmFuX18nO1xyXG5leHBvcnRzLlNQRUNJQUxfVE9LRU5TID0ge1xyXG4gICAgdHJ1ZTogdHJ1ZSxcclxuICAgIGZhbHNlOiBmYWxzZSxcclxuICAgIHVuZGVmaW5lZDogZXhwb3J0cy5VTkRFRklORUQsXHJcbiAgICBudWxsOiBudWxsLFxyXG4gICAgJy1JbmZpbml0eSc6IGV4cG9ydHMuTkVHQVRJVkVfSU5GSU5JVFksXHJcbiAgICBJbmZpbml0eTogZXhwb3J0cy5JTkZJTklUWSxcclxuICAgIE5hTjogZXhwb3J0cy5OQU4sXHJcbn07XHJcbmV4cG9ydHMuTUFYX1NUUklOR19TSVpFID0gMTAwMDA7XHJcbmV4cG9ydHMuTUFYX0FSUkFZX1NJWkUgPSA1MDAwO1xyXG5mdW5jdGlvbiBzcGVjaWFsVG9rZW5Ub1N0cmluZyh2YWx1ZSkge1xyXG4gICAgaWYgKHZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgcmV0dXJuICdudWxsJztcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHZhbHVlID09PSBleHBvcnRzLlVOREVGSU5FRCkge1xyXG4gICAgICAgIHJldHVybiAndW5kZWZpbmVkJztcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHZhbHVlID09PSBleHBvcnRzLk5BTikge1xyXG4gICAgICAgIHJldHVybiAnTmFOJztcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHZhbHVlID09PSBleHBvcnRzLklORklOSVRZKSB7XHJcbiAgICAgICAgcmV0dXJuICdJbmZpbml0eSc7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh2YWx1ZSA9PT0gZXhwb3J0cy5ORUdBVElWRV9JTkZJTklUWSkge1xyXG4gICAgICAgIHJldHVybiAnLUluZmluaXR5JztcclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxufVxyXG5leHBvcnRzLnNwZWNpYWxUb2tlblRvU3RyaW5nID0gc3BlY2lhbFRva2VuVG9TdHJpbmc7XHJcbi8qKlxyXG4gKiBOZWVkZWQgdG8gcHJldmVudCBzdGFjayBvdmVyZmxvd1xyXG4gKiB3aGlsZSByZXBsYWNpbmcgY29tcGxleCBvYmplY3RzXHJcbiAqIGxpa2UgY29tcG9uZW50cyBiZWNhdXNlIHdlIGNyZWF0ZVxyXG4gKiBuZXcgb2JqZWN0cyB3aXRoIHRoZSBDdXN0b21WYWx1ZSBBUElcclxuICogKC5pLmUgYHsgX2N1c3RvbTogeyAuLi4gfSB9YClcclxuICovXHJcbmNsYXNzIEVuY29kZUNhY2hlIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMubWFwID0gbmV3IE1hcCgpO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIGEgcmVzdWx0IHVuaXF1ZSB0byBlYWNoIGlucHV0IGRhdGFcclxuICAgICAqIEBwYXJhbSB7Kn0gZGF0YSBJbnB1dCBkYXRhXHJcbiAgICAgKiBAcGFyYW0geyp9IGZhY3RvcnkgRnVuY3Rpb24gdXNlZCB0byBjcmVhdGUgdGhlIHVuaXF1ZSByZXN1bHRcclxuICAgICAqL1xyXG4gICAgY2FjaGUoZGF0YSwgZmFjdG9yeSkge1xyXG4gICAgICAgIGNvbnN0IGNhY2hlZCA9IHRoaXMubWFwLmdldChkYXRhKTtcclxuICAgICAgICBpZiAoY2FjaGVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBmYWN0b3J5KGRhdGEpO1xyXG4gICAgICAgICAgICB0aGlzLm1hcC5zZXQoZGF0YSwgcmVzdWx0KTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBjbGVhcigpIHtcclxuICAgICAgICB0aGlzLm1hcC5jbGVhcigpO1xyXG4gICAgfVxyXG59XHJcbmNvbnN0IGVuY29kZUNhY2hlID0gbmV3IEVuY29kZUNhY2hlKCk7XHJcbmNsYXNzIFJldml2ZUNhY2hlIHtcclxuICAgIGNvbnN0cnVjdG9yKG1heFNpemUpIHtcclxuICAgICAgICB0aGlzLm1heFNpemUgPSBtYXhTaXplO1xyXG4gICAgICAgIHRoaXMubWFwID0gbmV3IE1hcCgpO1xyXG4gICAgICAgIHRoaXMuaW5kZXggPSAwO1xyXG4gICAgICAgIHRoaXMuc2l6ZSA9IDA7XHJcbiAgICB9XHJcbiAgICBjYWNoZSh2YWx1ZSkge1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbnRJbmRleCA9IHRoaXMuaW5kZXg7XHJcbiAgICAgICAgdGhpcy5tYXAuc2V0KGN1cnJlbnRJbmRleCwgdmFsdWUpO1xyXG4gICAgICAgIHRoaXMuc2l6ZSsrO1xyXG4gICAgICAgIGlmICh0aGlzLnNpemUgPiB0aGlzLm1heFNpemUpIHtcclxuICAgICAgICAgICAgdGhpcy5tYXAuZGVsZXRlKGN1cnJlbnRJbmRleCAtIHRoaXMuc2l6ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuc2l6ZS0tO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmluZGV4Kys7XHJcbiAgICAgICAgcmV0dXJuIGN1cnJlbnRJbmRleDtcclxuICAgIH1cclxuICAgIHJlYWQoaWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5tYXAuZ2V0KGlkKTtcclxuICAgIH1cclxufVxyXG5jb25zdCByZXZpdmVDYWNoZSA9IG5ldyBSZXZpdmVDYWNoZSgxMDAwKTtcclxuZnVuY3Rpb24gc3RyaW5naWZ5KGRhdGEpIHtcclxuICAgIC8vIENyZWF0ZSBhIGZyZXNoIGNhY2hlIGZvciBlYWNoIHNlcmlhbGl6YXRpb25cclxuICAgIGVuY29kZUNhY2hlLmNsZWFyKCk7XHJcbiAgICByZXR1cm4gKDAsIHRyYW5zZmVyXzEuc3RyaW5naWZ5Q2lyY3VsYXJBdXRvQ2h1bmtzKShkYXRhLCByZXBsYWNlcik7XHJcbn1cclxuZXhwb3J0cy5zdHJpbmdpZnkgPSBzdHJpbmdpZnk7XHJcbmZ1bmN0aW9uIHJlcGxhY2VyKGtleSkge1xyXG4gICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgY29uc3QgdmFsID0gdGhpc1trZXldO1xyXG4gICAgY29uc3QgdHlwZSA9IHR5cGVvZiB2YWw7XHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWwpKSB7XHJcbiAgICAgICAgY29uc3QgbCA9IHZhbC5sZW5ndGg7XHJcbiAgICAgICAgaWYgKGwgPiBleHBvcnRzLk1BWF9BUlJBWV9TSVpFKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBfaXNBcnJheTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIGxlbmd0aDogbCxcclxuICAgICAgICAgICAgICAgIGl0ZW1zOiB2YWwuc2xpY2UoMCwgZXhwb3J0cy5NQVhfQVJSQVlfU0laRSksXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB2YWw7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgIGlmICh2YWwubGVuZ3RoID4gZXhwb3J0cy5NQVhfU1RSSU5HX1NJWkUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbC5zdWJzdHIoMCwgZXhwb3J0cy5NQVhfU1RSSU5HX1NJWkUpICsgYC4uLiAoJHsodmFsLmxlbmd0aCl9IHRvdGFsIGxlbmd0aClgO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0eXBlID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIHJldHVybiBleHBvcnRzLlVOREVGSU5FRDtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHZhbCA9PT0gSW5maW5pdHkpIHtcclxuICAgICAgICByZXR1cm4gZXhwb3J0cy5JTkZJTklUWTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHZhbCA9PT0gLUluZmluaXR5KSB7XHJcbiAgICAgICAgcmV0dXJuIGV4cG9ydHMuTkVHQVRJVkVfSU5GSU5JVFk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0eXBlID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgcmV0dXJuIGdldEN1c3RvbUZ1bmN0aW9uRGV0YWlscyh2YWwpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodHlwZSA9PT0gJ3N5bWJvbCcpIHtcclxuICAgICAgICByZXR1cm4gYFtuYXRpdmUgU3ltYm9sICR7U3ltYm9sLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbCl9XWA7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh2YWwgIT09IG51bGwgJiYgdHlwZSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICBjb25zdCBwcm90byA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWwpO1xyXG4gICAgICAgIGlmIChwcm90byA9PT0gJ1tvYmplY3QgTWFwXScpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVuY29kZUNhY2hlLmNhY2hlKHZhbCwgKCkgPT4gZ2V0Q3VzdG9tTWFwRGV0YWlscyh2YWwpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAocHJvdG8gPT09ICdbb2JqZWN0IFNldF0nKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbmNvZGVDYWNoZS5jYWNoZSh2YWwsICgpID0+IGdldEN1c3RvbVNldERldGFpbHModmFsKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHByb3RvID09PSAnW29iamVjdCBSZWdFeHBdJykge1xyXG4gICAgICAgICAgICAvLyBzcGVjaWFsIGhhbmRsaW5nIG9mIG5hdGl2ZSB0eXBlXHJcbiAgICAgICAgICAgIHJldHVybiBgW25hdGl2ZSBSZWdFeHAgJHtSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsKX1dYDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAocHJvdG8gPT09ICdbb2JqZWN0IERhdGVdJykge1xyXG4gICAgICAgICAgICByZXR1cm4gYFtuYXRpdmUgRGF0ZSAke0RhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsKX1dYDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAocHJvdG8gPT09ICdbb2JqZWN0IEVycm9yXScpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGBbbmF0aXZlIEVycm9yICR7dmFsLm1lc3NhZ2V9PD4ke3ZhbC5zdGFja31dYDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAodmFsLnN0YXRlICYmIHZhbC5fdm0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVuY29kZUNhY2hlLmNhY2hlKHZhbCwgKCkgPT4gKDAsIGJhY2tlbmRfMS5nZXRDdXN0b21TdG9yZURldGFpbHMpKHZhbCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh2YWwuY29uc3RydWN0b3IgJiYgdmFsLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdWdWVSb3V0ZXInKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbmNvZGVDYWNoZS5jYWNoZSh2YWwsICgpID0+ICgwLCBiYWNrZW5kXzEuZ2V0Q3VzdG9tUm91dGVyRGV0YWlscykodmFsKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCgwLCBiYWNrZW5kXzEuaXNWdWVJbnN0YW5jZSkodmFsKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZW5jb2RlQ2FjaGUuY2FjaGUodmFsLCAoKSA9PiAoMCwgYmFja2VuZF8xLmdldEN1c3RvbUluc3RhbmNlRGV0YWlscykodmFsKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHR5cGVvZiB2YWwucmVuZGVyID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbmNvZGVDYWNoZS5jYWNoZSh2YWwsICgpID0+IGdldEN1c3RvbUNvbXBvbmVudERlZmluaXRpb25EZXRhaWxzKHZhbCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh2YWwuY29uc3RydWN0b3IgJiYgdmFsLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdWTm9kZScpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGBbbmF0aXZlIFZOb2RlIDwke3ZhbC50YWd9Pl1gO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh2YWwgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZW5jb2RlQ2FjaGUuY2FjaGUodmFsLCAoKSA9PiBnZXRDdXN0b21IVE1MRWxlbWVudERldGFpbHModmFsKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoTnVtYmVyLmlzTmFOKHZhbCkpIHtcclxuICAgICAgICByZXR1cm4gZXhwb3J0cy5OQU47XHJcbiAgICB9XHJcbiAgICByZXR1cm4gc2FuaXRpemUodmFsKTtcclxufVxyXG5mdW5jdGlvbiBnZXRDdXN0b21NYXBEZXRhaWxzKHZhbCkge1xyXG4gICAgY29uc3QgbGlzdCA9IFtdO1xyXG4gICAgdmFsLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IGxpc3QucHVzaCh7XHJcbiAgICAgICAga2V5LFxyXG4gICAgICAgIHZhbHVlLFxyXG4gICAgfSkpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBfY3VzdG9tOiB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdtYXAnLFxyXG4gICAgICAgICAgICBkaXNwbGF5OiAnTWFwJyxcclxuICAgICAgICAgICAgdmFsdWU6IGxpc3QsXHJcbiAgICAgICAgICAgIHJlYWRPbmx5OiB0cnVlLFxyXG4gICAgICAgICAgICBmaWVsZHM6IHtcclxuICAgICAgICAgICAgICAgIGFic3RyYWN0OiB0cnVlLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuZ2V0Q3VzdG9tTWFwRGV0YWlscyA9IGdldEN1c3RvbU1hcERldGFpbHM7XHJcbmZ1bmN0aW9uIHJldml2ZU1hcCh2YWwpIHtcclxuICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBNYXAoKTtcclxuICAgIGNvbnN0IGxpc3QgPSB2YWwuX2N1c3RvbS52YWx1ZTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGNvbnN0IHsga2V5LCB2YWx1ZSB9ID0gbGlzdFtpXTtcclxuICAgICAgICByZXN1bHQuc2V0KGtleSwgcmV2aXZlKHZhbHVlKSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcbmV4cG9ydHMucmV2aXZlTWFwID0gcmV2aXZlTWFwO1xyXG5mdW5jdGlvbiBnZXRDdXN0b21TZXREZXRhaWxzKHZhbCkge1xyXG4gICAgY29uc3QgbGlzdCA9IEFycmF5LmZyb20odmFsKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgX2N1c3RvbToge1xyXG4gICAgICAgICAgICB0eXBlOiAnc2V0JyxcclxuICAgICAgICAgICAgZGlzcGxheTogYFNldFske2xpc3QubGVuZ3RofV1gLFxyXG4gICAgICAgICAgICB2YWx1ZTogbGlzdCxcclxuICAgICAgICAgICAgcmVhZE9ubHk6IHRydWUsXHJcbiAgICAgICAgfSxcclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy5nZXRDdXN0b21TZXREZXRhaWxzID0gZ2V0Q3VzdG9tU2V0RGV0YWlscztcclxuZnVuY3Rpb24gcmV2aXZlU2V0KHZhbCkge1xyXG4gICAgY29uc3QgcmVzdWx0ID0gbmV3IFNldCgpO1xyXG4gICAgY29uc3QgbGlzdCA9IHZhbC5fY3VzdG9tLnZhbHVlO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSBsaXN0W2ldO1xyXG4gICAgICAgIHJlc3VsdC5hZGQocmV2aXZlKHZhbHVlKSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcbmV4cG9ydHMucmV2aXZlU2V0ID0gcmV2aXZlU2V0O1xyXG4vLyBVc2UgYSBjdXN0b20gYmFzZW5hbWUgZnVuY3Rpb25zIGluc3RlYWQgb2YgdGhlIHNoaW1lZCB2ZXJzaW9uXHJcbi8vIGJlY2F1c2UgaXQgZG9lc24ndCB3b3JrIG9uIFdpbmRvd3NcclxuZnVuY3Rpb24gYmFzZW5hbWUoZmlsZW5hbWUsIGV4dCkge1xyXG4gICAgcmV0dXJuIHBhdGhfMS5kZWZhdWx0LmJhc2VuYW1lKGZpbGVuYW1lLnJlcGxhY2UoL15bYS16QS1aXTovLCAnJykucmVwbGFjZSgvXFxcXC9nLCAnLycpLCBleHQpO1xyXG59XHJcbmZ1bmN0aW9uIGdldENvbXBvbmVudE5hbWUob3B0aW9ucykge1xyXG4gICAgY29uc3QgbmFtZSA9IG9wdGlvbnMuZGlzcGxheU5hbWUgfHwgb3B0aW9ucy5uYW1lIHx8IG9wdGlvbnMuX2NvbXBvbmVudFRhZztcclxuICAgIGlmIChuYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuIG5hbWU7XHJcbiAgICB9XHJcbiAgICBjb25zdCBmaWxlID0gb3B0aW9ucy5fX2ZpbGU7IC8vIGluamVjdGVkIGJ5IHZ1ZS1sb2FkZXJcclxuICAgIGlmIChmaWxlKSB7XHJcbiAgICAgICAgcmV0dXJuICgwLCBleHBvcnRzLmNsYXNzaWZ5KShiYXNlbmFtZShmaWxlLCAnLnZ1ZScpKTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLmdldENvbXBvbmVudE5hbWUgPSBnZXRDb21wb25lbnROYW1lO1xyXG5mdW5jdGlvbiBnZXRDdXN0b21Db21wb25lbnREZWZpbml0aW9uRGV0YWlscyhkZWYpIHtcclxuICAgIGxldCBkaXNwbGF5ID0gZ2V0Q29tcG9uZW50TmFtZShkZWYpO1xyXG4gICAgaWYgKGRpc3BsYXkpIHtcclxuICAgICAgICBpZiAoZGVmLm5hbWUgJiYgZGVmLl9fZmlsZSkge1xyXG4gICAgICAgICAgICBkaXNwbGF5ICs9IGAgPHNwYW4+KCR7ZGVmLl9fZmlsZX0pPC9zcGFuPmA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgZGlzcGxheSA9ICc8aT5Vbmtub3duIENvbXBvbmVudDwvaT4nO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBfY3VzdG9tOiB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdjb21wb25lbnQtZGVmaW5pdGlvbicsXHJcbiAgICAgICAgICAgIGRpc3BsYXksXHJcbiAgICAgICAgICAgIHRvb2x0aXA6ICdDb21wb25lbnQgZGVmaW5pdGlvbicsXHJcbiAgICAgICAgICAgIC4uLmRlZi5fX2ZpbGVcclxuICAgICAgICAgICAgICAgID8ge1xyXG4gICAgICAgICAgICAgICAgICAgIGZpbGU6IGRlZi5fX2ZpbGUsXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICA6IHt9LFxyXG4gICAgICAgIH0sXHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuZ2V0Q3VzdG9tQ29tcG9uZW50RGVmaW5pdGlvbkRldGFpbHMgPSBnZXRDdXN0b21Db21wb25lbnREZWZpbml0aW9uRGV0YWlscztcclxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9iYW4tdHlwZXNcclxuZnVuY3Rpb24gZ2V0Q3VzdG9tRnVuY3Rpb25EZXRhaWxzKGZ1bmMpIHtcclxuICAgIGxldCBzdHJpbmcgPSAnJztcclxuICAgIGxldCBtYXRjaGVzID0gbnVsbDtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgc3RyaW5nID0gRnVuY3Rpb24ucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZnVuYyk7XHJcbiAgICAgICAgbWF0Y2hlcyA9IFN0cmluZy5wcm90b3R5cGUubWF0Y2guY2FsbChzdHJpbmcsIC9cXChbXFxzXFxTXSo/XFwpLyk7XHJcbiAgICB9XHJcbiAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgIC8vIEZ1bmMgaXMgcHJvYmFibHkgYSBQcm94eSwgd2hpY2ggY2FuIGJyZWFrIEZ1bmN0aW9uLnByb3RvdHlwZS50b1N0cmluZygpXHJcbiAgICB9XHJcbiAgICAvLyBUcmltIGFueSBleGNlc3Mgd2hpdGVzcGFjZSBmcm9tIHRoZSBhcmd1bWVudCBzdHJpbmdcclxuICAgIGNvbnN0IG1hdGNoID0gbWF0Y2hlcyAmJiBtYXRjaGVzWzBdO1xyXG4gICAgY29uc3QgYXJncyA9IHR5cGVvZiBtYXRjaCA9PT0gJ3N0cmluZydcclxuICAgICAgICA/IGAoJHttYXRjaC5zdWJzdHIoMSwgbWF0Y2gubGVuZ3RoIC0gMikuc3BsaXQoJywnKS5tYXAoYSA9PiBhLnRyaW0oKSkuam9pbignLCAnKX0pYFxyXG4gICAgICAgIDogJyg/KSc7XHJcbiAgICBjb25zdCBuYW1lID0gdHlwZW9mIGZ1bmMubmFtZSA9PT0gJ3N0cmluZycgPyBmdW5jLm5hbWUgOiAnJztcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgX2N1c3RvbToge1xyXG4gICAgICAgICAgICB0eXBlOiAnZnVuY3Rpb24nLFxyXG4gICAgICAgICAgICBkaXNwbGF5OiBgPHNwYW4+Zjwvc3Bhbj4gJHtlc2NhcGUobmFtZSl9JHthcmdzfWAsXHJcbiAgICAgICAgICAgIF9yZXZpdmVJZDogcmV2aXZlQ2FjaGUuY2FjaGUoZnVuYyksXHJcbiAgICAgICAgfSxcclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy5nZXRDdXN0b21GdW5jdGlvbkRldGFpbHMgPSBnZXRDdXN0b21GdW5jdGlvbkRldGFpbHM7XHJcbmZ1bmN0aW9uIGdldEN1c3RvbUhUTUxFbGVtZW50RGV0YWlscyh2YWx1ZSkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBfY3VzdG9tOiB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnSFRNTEVsZW1lbnQnLFxyXG4gICAgICAgICAgICAgICAgZGlzcGxheTogYDxzcGFuIGNsYXNzPVwib3BhY2l0eS0zMFwiPiZsdDs8L3NwYW4+PHNwYW4gY2xhc3M9XCJ0ZXh0LWJsdWUtNTAwXCI+JHt2YWx1ZS50YWdOYW1lLnRvTG93ZXJDYXNlKCl9PC9zcGFuPjxzcGFuIGNsYXNzPVwib3BhY2l0eS0zMFwiPiZndDs8L3NwYW4+YCxcclxuICAgICAgICAgICAgICAgIHZhbHVlOiBuYW1lZE5vZGVNYXBUb09iamVjdCh2YWx1ZS5hdHRyaWJ1dGVzKSxcclxuICAgICAgICAgICAgICAgIGFjdGlvbnM6IFtcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGljb246ICdpbnB1dCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvb2x0aXA6ICdMb2cgZWxlbWVudCB0byBjb25zb2xlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2codmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIF9jdXN0b206IHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdIVE1MRWxlbWVudCcsXHJcbiAgICAgICAgICAgICAgICBkaXNwbGF5OiBgPHNwYW4gY2xhc3M9XCJ0ZXh0LWJsdWUtNTAwXCI+JHtTdHJpbmcodmFsdWUpfTwvc3Bhbj5gLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5nZXRDdXN0b21IVE1MRWxlbWVudERldGFpbHMgPSBnZXRDdXN0b21IVE1MRWxlbWVudERldGFpbHM7XHJcbmZ1bmN0aW9uIG5hbWVkTm9kZU1hcFRvT2JqZWN0KG1hcCkge1xyXG4gICAgY29uc3QgcmVzdWx0ID0ge307XHJcbiAgICBjb25zdCBsID0gbWFwLmxlbmd0aDtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgY29uc3Qgbm9kZSA9IG1hcC5pdGVtKGkpO1xyXG4gICAgICAgIHJlc3VsdFtub2RlLm5hbWVdID0gbm9kZS52YWx1ZTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn1cclxuZnVuY3Rpb24gZ2V0Q3VzdG9tUmVmRGV0YWlscyhpbnN0YW5jZSwga2V5LCByZWYpIHtcclxuICAgIGxldCB2YWx1ZTtcclxuICAgIGlmIChBcnJheS5pc0FycmF5KHJlZikpIHtcclxuICAgICAgICB2YWx1ZSA9IHJlZi5tYXAoKHIpID0+IGdldEN1c3RvbVJlZkRldGFpbHMoaW5zdGFuY2UsIGtleSwgcikpLm1hcChkYXRhID0+IGRhdGEudmFsdWUpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgbGV0IG5hbWU7XHJcbiAgICAgICAgaWYgKHJlZi5faXNWdWUpIHtcclxuICAgICAgICAgICAgbmFtZSA9IGdldENvbXBvbmVudE5hbWUocmVmLiRvcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIG5hbWUgPSByZWYudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YWx1ZSA9IHtcclxuICAgICAgICAgICAgX2N1c3RvbToge1xyXG4gICAgICAgICAgICAgICAgZGlzcGxheTogYCZsdDske25hbWV9YCArXHJcbiAgICAgICAgICAgICAgICAgICAgKHJlZi5pZCA/IGAgPHNwYW4gY2xhc3M9XCJhdHRyLXRpdGxlXCI+aWQ8L3NwYW4+PVwiJHtyZWYuaWR9XCJgIDogJycpICtcclxuICAgICAgICAgICAgICAgICAgICAocmVmLmNsYXNzTmFtZSA/IGAgPHNwYW4gY2xhc3M9XCJhdHRyLXRpdGxlXCI+Y2xhc3M8L3NwYW4+PVwiJHtyZWYuY2xhc3NOYW1lfVwiYCA6ICcnKSArICcmZ3Q7JyxcclxuICAgICAgICAgICAgICAgIHVpZDogaW5zdGFuY2UuX19WVUVfREVWVE9PTFNfVUlEX18sXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAncmVmZXJlbmNlJyxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB0eXBlOiAnJHJlZnMnLFxyXG4gICAgICAgIGtleToga2V5LFxyXG4gICAgICAgIHZhbHVlLFxyXG4gICAgICAgIGVkaXRhYmxlOiBmYWxzZSxcclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy5nZXRDdXN0b21SZWZEZXRhaWxzID0gZ2V0Q3VzdG9tUmVmRGV0YWlscztcclxuZnVuY3Rpb24gcGFyc2UoZGF0YSwgcmV2aXZlID0gZmFsc2UpIHtcclxuICAgIHJldHVybiByZXZpdmVcclxuICAgICAgICA/ICgwLCB0cmFuc2Zlcl8xLnBhcnNlQ2lyY3VsYXJBdXRvQ2h1bmtzKShkYXRhLCByZXZpdmVyKVxyXG4gICAgICAgIDogKDAsIHRyYW5zZmVyXzEucGFyc2VDaXJjdWxhckF1dG9DaHVua3MpKGRhdGEpO1xyXG59XHJcbmV4cG9ydHMucGFyc2UgPSBwYXJzZTtcclxuY29uc3Qgc3BlY2lhbFR5cGVSRSA9IC9eXFxbbmF0aXZlIChcXHcrKSAoLio/KSg8PigoLnxcXHMpKikpP1xcXSQvO1xyXG5jb25zdCBzeW1ib2xSRSA9IC9eXFxbbmF0aXZlIFN5bWJvbCBTeW1ib2xcXCgoLiopXFwpXFxdJC87XHJcbmZ1bmN0aW9uIHJldml2ZXIoa2V5LCB2YWwpIHtcclxuICAgIHJldHVybiByZXZpdmUodmFsKTtcclxufVxyXG5mdW5jdGlvbiByZXZpdmUodmFsKSB7XHJcbiAgICBpZiAodmFsID09PSBleHBvcnRzLlVOREVGSU5FRCkge1xyXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh2YWwgPT09IGV4cG9ydHMuSU5GSU5JVFkpIHtcclxuICAgICAgICByZXR1cm4gSW5maW5pdHk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh2YWwgPT09IGV4cG9ydHMuTkVHQVRJVkVfSU5GSU5JVFkpIHtcclxuICAgICAgICByZXR1cm4gLUluZmluaXR5O1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodmFsID09PSBleHBvcnRzLk5BTikge1xyXG4gICAgICAgIHJldHVybiBOYU47XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh2YWwgJiYgdmFsLl9jdXN0b20pIHtcclxuICAgICAgICBjb25zdCB7IF9jdXN0b206IGN1c3RvbSB9ID0gdmFsO1xyXG4gICAgICAgIGlmIChjdXN0b20udHlwZSA9PT0gJ2NvbXBvbmVudCcpIHtcclxuICAgICAgICAgICAgcmV0dXJuICgwLCBiYWNrZW5kXzEuZ2V0SW5zdGFuY2VNYXApKCkuZ2V0KGN1c3RvbS5pZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGN1c3RvbS50eXBlID09PSAnbWFwJykge1xyXG4gICAgICAgICAgICByZXR1cm4gcmV2aXZlTWFwKHZhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGN1c3RvbS50eXBlID09PSAnc2V0Jykge1xyXG4gICAgICAgICAgICByZXR1cm4gcmV2aXZlU2V0KHZhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGN1c3RvbS5fcmV2aXZlSWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJldml2ZUNhY2hlLnJlYWQoY3VzdG9tLl9yZXZpdmVJZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gcmV2aXZlKGN1c3RvbS52YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoc3ltYm9sUkUudGVzdCh2YWwpKSB7XHJcbiAgICAgICAgY29uc3QgWywgc3RyaW5nXSA9IHN5bWJvbFJFLmV4ZWModmFsKTtcclxuICAgICAgICByZXR1cm4gU3ltYm9sLmZvcihzdHJpbmcpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoc3BlY2lhbFR5cGVSRS50ZXN0KHZhbCkpIHtcclxuICAgICAgICBjb25zdCBbLCB0eXBlLCBzdHJpbmcsICwgZGV0YWlsc10gPSBzcGVjaWFsVHlwZVJFLmV4ZWModmFsKTtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgd2luZG93W3R5cGVdKHN0cmluZyk7XHJcbiAgICAgICAgaWYgKHR5cGUgPT09ICdFcnJvcicgJiYgZGV0YWlscykge1xyXG4gICAgICAgICAgICByZXN1bHQuc3RhY2sgPSBkZXRhaWxzO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHZhbDtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLnJldml2ZSA9IHJldml2ZTtcclxuLyoqXHJcbiAqIFNhbml0aXplIGRhdGEgdG8gYmUgcG9zdGVkIHRvIHRoZSBvdGhlciBzaWRlLlxyXG4gKiBTaW5jZSB0aGUgbWVzc2FnZSBwb3N0ZWQgaXMgc2VudCB3aXRoIHN0cnVjdHVyZWQgY2xvbmUsXHJcbiAqIHdlIG5lZWQgdG8gZmlsdGVyIG91dCBhbnkgdHlwZXMgdGhhdCBtaWdodCBjYXVzZSBhbiBlcnJvci5cclxuICpcclxuICogQHBhcmFtIHsqfSBkYXRhXHJcbiAqIEByZXR1cm4geyp9XHJcbiAqL1xyXG5mdW5jdGlvbiBzYW5pdGl6ZShkYXRhKSB7XHJcbiAgICBpZiAoIWlzUHJpbWl0aXZlKGRhdGEpICYmXHJcbiAgICAgICAgIUFycmF5LmlzQXJyYXkoZGF0YSkgJiZcclxuICAgICAgICAhaXNQbGFpbk9iamVjdChkYXRhKSkge1xyXG4gICAgICAgIC8vIGhhbmRsZSB0eXBlcyB0aGF0IHdpbGwgcHJvYmFibHkgY2F1c2UgaXNzdWVzIGluXHJcbiAgICAgICAgLy8gdGhlIHN0cnVjdHVyZWQgY2xvbmVcclxuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGRhdGEpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIGRhdGE7XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gaXNQbGFpbk9iamVjdChvYmopIHtcclxuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgT2JqZWN0XSc7XHJcbn1cclxuZXhwb3J0cy5pc1BsYWluT2JqZWN0ID0gaXNQbGFpbk9iamVjdDtcclxuZnVuY3Rpb24gaXNQcmltaXRpdmUoZGF0YSkge1xyXG4gICAgaWYgKGRhdGEgPT0gbnVsbCkge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgY29uc3QgdHlwZSA9IHR5cGVvZiBkYXRhO1xyXG4gICAgcmV0dXJuICh0eXBlID09PSAnc3RyaW5nJyB8fFxyXG4gICAgICAgIHR5cGUgPT09ICdudW1iZXInIHx8XHJcbiAgICAgICAgdHlwZSA9PT0gJ2Jvb2xlYW4nKTtcclxufVxyXG4vKipcclxuICogU2VhcmNoZXMgYSBrZXkgb3IgdmFsdWUgaW4gdGhlIG9iamVjdCwgd2l0aCBhIG1heGltdW0gZGVlcG5lc3NcclxuICogQHBhcmFtIHsqfSBvYmogU2VhcmNoIHRhcmdldFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gc2VhcmNoVGVybSBTZWFyY2ggc3RyaW5nXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSBTZWFyY2ggbWF0Y2hcclxuICovXHJcbmZ1bmN0aW9uIHNlYXJjaERlZXBJbk9iamVjdChvYmosIHNlYXJjaFRlcm0pIHtcclxuICAgIGNvbnN0IHNlZW4gPSBuZXcgTWFwKCk7XHJcbiAgICBjb25zdCByZXN1bHQgPSBpbnRlcm5hbFNlYXJjaE9iamVjdChvYmosIHNlYXJjaFRlcm0udG9Mb3dlckNhc2UoKSwgc2VlbiwgMCk7XHJcbiAgICBzZWVuLmNsZWFyKCk7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcbmV4cG9ydHMuc2VhcmNoRGVlcEluT2JqZWN0ID0gc2VhcmNoRGVlcEluT2JqZWN0O1xyXG5jb25zdCBTRUFSQ0hfTUFYX0RFUFRIID0gMTA7XHJcbi8qKlxyXG4gKiBFeGVjdXRlcyBhIHNlYXJjaCBvbiBlYWNoIGZpZWxkIG9mIHRoZSBwcm92aWRlZCBvYmplY3RcclxuICogQHBhcmFtIHsqfSBvYmogU2VhcmNoIHRhcmdldFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gc2VhcmNoVGVybSBTZWFyY2ggc3RyaW5nXHJcbiAqIEBwYXJhbSB7TWFwPGFueSxib29sZWFuPn0gc2VlbiBNYXAgY29udGFpbmluZyB0aGUgc2VhcmNoIHJlc3VsdCB0byBwcmV2ZW50IHN0YWNrIG92ZXJmbG93IGJ5IHdhbGtpbmcgb24gdGhlIHNhbWUgb2JqZWN0IG11bHRpcGxlIHRpbWVzXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBkZXB0aCBEZWVwIHNlYXJjaCBkZXB0aCBsZXZlbCwgd2hpY2ggaXMgY2FwcGVkIHRvIHByZXZlbnQgcGVyZm9ybWFuY2UgaXNzdWVzXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSBTZWFyY2ggbWF0Y2hcclxuICovXHJcbmZ1bmN0aW9uIGludGVybmFsU2VhcmNoT2JqZWN0KG9iaiwgc2VhcmNoVGVybSwgc2VlbiwgZGVwdGgpIHtcclxuICAgIGlmIChkZXB0aCA+IFNFQVJDSF9NQVhfREVQVEgpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICBsZXQgbWF0Y2ggPSBmYWxzZTtcclxuICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhvYmopO1xyXG4gICAgbGV0IGtleSwgdmFsdWU7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBrZXkgPSBrZXlzW2ldO1xyXG4gICAgICAgIHZhbHVlID0gb2JqW2tleV07XHJcbiAgICAgICAgbWF0Y2ggPSBpbnRlcm5hbFNlYXJjaENoZWNrKHNlYXJjaFRlcm0sIGtleSwgdmFsdWUsIHNlZW4sIGRlcHRoICsgMSk7XHJcbiAgICAgICAgaWYgKG1hdGNoKSB7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBtYXRjaDtcclxufVxyXG4vKipcclxuICogRXhlY3V0ZXMgYSBzZWFyY2ggb24gZWFjaCB2YWx1ZSBvZiB0aGUgcHJvdmlkZWQgYXJyYXlcclxuICogQHBhcmFtIHsqfSBhcnJheSBTZWFyY2ggdGFyZ2V0XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzZWFyY2hUZXJtIFNlYXJjaCBzdHJpbmdcclxuICogQHBhcmFtIHtNYXA8YW55LGJvb2xlYW4+fSBzZWVuIE1hcCBjb250YWluaW5nIHRoZSBzZWFyY2ggcmVzdWx0IHRvIHByZXZlbnQgc3RhY2sgb3ZlcmZsb3cgYnkgd2Fsa2luZyBvbiB0aGUgc2FtZSBvYmplY3QgbXVsdGlwbGUgdGltZXNcclxuICogQHBhcmFtIHtudW1iZXJ9IGRlcHRoIERlZXAgc2VhcmNoIGRlcHRoIGxldmVsLCB3aGljaCBpcyBjYXBwZWQgdG8gcHJldmVudCBwZXJmb3JtYW5jZSBpc3N1ZXNcclxuICogQHJldHVybnMge2Jvb2xlYW59IFNlYXJjaCBtYXRjaFxyXG4gKi9cclxuZnVuY3Rpb24gaW50ZXJuYWxTZWFyY2hBcnJheShhcnJheSwgc2VhcmNoVGVybSwgc2VlbiwgZGVwdGgpIHtcclxuICAgIGlmIChkZXB0aCA+IFNFQVJDSF9NQVhfREVQVEgpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICBsZXQgbWF0Y2ggPSBmYWxzZTtcclxuICAgIGxldCB2YWx1ZTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB2YWx1ZSA9IGFycmF5W2ldO1xyXG4gICAgICAgIG1hdGNoID0gaW50ZXJuYWxTZWFyY2hDaGVjayhzZWFyY2hUZXJtLCBudWxsLCB2YWx1ZSwgc2VlbiwgZGVwdGggKyAxKTtcclxuICAgICAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG1hdGNoO1xyXG59XHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgdGhlIHByb3ZpZGVkIGZpZWxkIG1hdGNoZXMgdGhlIHNlYXJjaCB0ZXJtc1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gc2VhcmNoVGVybSBTZWFyY2ggc3RyaW5nXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgRmllbGQga2V5IChudWxsIGlmIGZyb20gYXJyYXkpXHJcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgRmllbGQgdmFsdWVcclxuICogQHBhcmFtIHtNYXA8YW55LGJvb2xlYW4+fSBzZWVuIE1hcCBjb250YWluaW5nIHRoZSBzZWFyY2ggcmVzdWx0IHRvIHByZXZlbnQgc3RhY2sgb3ZlcmZsb3cgYnkgd2Fsa2luZyBvbiB0aGUgc2FtZSBvYmplY3QgbXVsdGlwbGUgdGltZXNcclxuICogQHBhcmFtIHtudW1iZXJ9IGRlcHRoIERlZXAgc2VhcmNoIGRlcHRoIGxldmVsLCB3aGljaCBpcyBjYXBwZWQgdG8gcHJldmVudCBwZXJmb3JtYW5jZSBpc3N1ZXNcclxuICogQHJldHVybnMge2Jvb2xlYW59IFNlYXJjaCBtYXRjaFxyXG4gKi9cclxuZnVuY3Rpb24gaW50ZXJuYWxTZWFyY2hDaGVjayhzZWFyY2hUZXJtLCBrZXksIHZhbHVlLCBzZWVuLCBkZXB0aCkge1xyXG4gICAgbGV0IG1hdGNoID0gZmFsc2U7XHJcbiAgICBsZXQgcmVzdWx0O1xyXG4gICAgaWYgKGtleSA9PT0gJ19jdXN0b20nKSB7XHJcbiAgICAgICAga2V5ID0gdmFsdWUuZGlzcGxheTtcclxuICAgICAgICB2YWx1ZSA9IHZhbHVlLnZhbHVlO1xyXG4gICAgfVxyXG4gICAgKHJlc3VsdCA9IHNwZWNpYWxUb2tlblRvU3RyaW5nKHZhbHVlKSkgJiYgKHZhbHVlID0gcmVzdWx0KTtcclxuICAgIGlmIChrZXkgJiYgY29tcGFyZShrZXksIHNlYXJjaFRlcm0pKSB7XHJcbiAgICAgICAgbWF0Y2ggPSB0cnVlO1xyXG4gICAgICAgIHNlZW4uc2V0KHZhbHVlLCB0cnVlKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHNlZW4uaGFzKHZhbHVlKSkge1xyXG4gICAgICAgIG1hdGNoID0gc2Vlbi5nZXQodmFsdWUpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICBzZWVuLnNldCh2YWx1ZSwgbnVsbCk7XHJcbiAgICAgICAgbWF0Y2ggPSBpbnRlcm5hbFNlYXJjaEFycmF5KHZhbHVlLCBzZWFyY2hUZXJtLCBzZWVuLCBkZXB0aCk7XHJcbiAgICAgICAgc2Vlbi5zZXQodmFsdWUsIG1hdGNoKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKGlzUGxhaW5PYmplY3QodmFsdWUpKSB7XHJcbiAgICAgICAgc2Vlbi5zZXQodmFsdWUsIG51bGwpO1xyXG4gICAgICAgIG1hdGNoID0gaW50ZXJuYWxTZWFyY2hPYmplY3QodmFsdWUsIHNlYXJjaFRlcm0sIHNlZW4sIGRlcHRoKTtcclxuICAgICAgICBzZWVuLnNldCh2YWx1ZSwgbWF0Y2gpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoY29tcGFyZSh2YWx1ZSwgc2VhcmNoVGVybSkpIHtcclxuICAgICAgICBtYXRjaCA9IHRydWU7XHJcbiAgICAgICAgc2Vlbi5zZXQodmFsdWUsIHRydWUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG1hdGNoO1xyXG59XHJcbi8qKlxyXG4gKiBDb21wYXJlcyB0d28gdmFsdWVzXHJcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgTWl4ZWQgdHlwZSB2YWx1ZSB0aGF0IHdpbGwgYmUgY2FzdCB0byBzdHJpbmdcclxuICogQHBhcmFtIHtzdHJpbmd9IHNlYXJjaFRlcm0gU2VhcmNoIHN0cmluZ1xyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gU2VhcmNoIG1hdGNoXHJcbiAqL1xyXG5mdW5jdGlvbiBjb21wYXJlKHZhbHVlLCBzZWFyY2hUZXJtKSB7XHJcbiAgICByZXR1cm4gKCcnICsgdmFsdWUpLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihzZWFyY2hUZXJtKSAhPT0gLTE7XHJcbn1cclxuZnVuY3Rpb24gc29ydEJ5S2V5KHN0YXRlKSB7XHJcbiAgICByZXR1cm4gc3RhdGUgJiYgc3RhdGUuc2xpY2UoKS5zb3J0KChhLCBiKSA9PiB7XHJcbiAgICAgICAgaWYgKGEua2V5IDwgYi5rZXkpXHJcbiAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICBpZiAoYS5rZXkgPiBiLmtleSlcclxuICAgICAgICAgICAgcmV0dXJuIDE7XHJcbiAgICAgICAgcmV0dXJuIDA7XHJcbiAgICB9KTtcclxufVxyXG5leHBvcnRzLnNvcnRCeUtleSA9IHNvcnRCeUtleTtcclxuZnVuY3Rpb24gc2ltcGxlR2V0KG9iamVjdCwgcGF0aCkge1xyXG4gICAgY29uc3Qgc2VjdGlvbnMgPSBBcnJheS5pc0FycmF5KHBhdGgpID8gcGF0aCA6IHBhdGguc3BsaXQoJy4nKTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VjdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBvYmplY3QgPSBvYmplY3Rbc2VjdGlvbnNbaV1dO1xyXG4gICAgICAgIGlmICghb2JqZWN0KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG9iamVjdDtcclxufVxyXG5leHBvcnRzLnNpbXBsZUdldCA9IHNpbXBsZUdldDtcclxuZnVuY3Rpb24gZm9jdXNJbnB1dChlbCkge1xyXG4gICAgZWwuZm9jdXMoKTtcclxuICAgIGVsLnNldFNlbGVjdGlvblJhbmdlKDAsIGVsLnZhbHVlLmxlbmd0aCk7XHJcbn1cclxuZXhwb3J0cy5mb2N1c0lucHV0ID0gZm9jdXNJbnB1dDtcclxuZnVuY3Rpb24gb3BlbkluRWRpdG9yKGZpbGUpIHtcclxuICAgIC8vIENvbnNvbGUgZGlzcGxheVxyXG4gICAgY29uc3QgZmlsZU5hbWUgPSBmaWxlLnJlcGxhY2UoL1xcXFwvZywgJ1xcXFxcXFxcJyk7XHJcbiAgICBjb25zdCBzcmMgPSBgZmV0Y2goJyR7c2hhcmVkX2RhdGFfMS5TaGFyZWREYXRhLm9wZW5JbkVkaXRvckhvc3R9X19vcGVuLWluLWVkaXRvcj9maWxlPSR7ZW5jb2RlVVJJKGZpbGUpfScpLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgIGlmIChyZXNwb25zZS5vaykge1xuICAgICAgY29uc29sZS5sb2coJ0ZpbGUgJHtmaWxlTmFtZX0gb3BlbmVkIGluIGVkaXRvcicpXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IG1zZyA9ICdPcGVuaW5nIGNvbXBvbmVudCAke2ZpbGVOYW1lfSBmYWlsZWQnXG4gICAgICBjb25zdCB0YXJnZXQgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDoge31cbiAgICAgIGlmICh0YXJnZXQuX19WVUVfREVWVE9PTFNfVE9BU1RfXykge1xuICAgICAgICB0YXJnZXQuX19WVUVfREVWVE9PTFNfVE9BU1RfXyhtc2csICdlcnJvcicpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZygnJWMnICsgbXNnLCAnY29sb3I6cmVkJylcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKCdDaGVjayB0aGUgc2V0dXAgb2YgeW91ciBwcm9qZWN0LCBzZWUgaHR0cHM6Ly9kZXZ0b29scy52dWVqcy5vcmcvZ3VpZGUvb3Blbi1pbi1lZGl0b3IuaHRtbCcpXG4gICAgfVxuICB9KWA7XHJcbiAgICBpZiAoZW52XzEuaXNDaHJvbWUpIHtcclxuICAgICAgICBlbnZfMS50YXJnZXQuY2hyb21lLmRldnRvb2xzLmluc3BlY3RlZFdpbmRvdy5ldmFsKHNyYyk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tZXZhbFxyXG4gICAgICAgIGV2YWwoc3JjKTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLm9wZW5JbkVkaXRvciA9IG9wZW5JbkVkaXRvcjtcclxuY29uc3QgRVNDID0ge1xyXG4gICAgJzwnOiAnJmx0OycsXHJcbiAgICAnPic6ICcmZ3Q7JyxcclxuICAgICdcIic6ICcmcXVvdDsnLFxyXG4gICAgJyYnOiAnJmFtcDsnLFxyXG59O1xyXG5mdW5jdGlvbiBlc2NhcGUocykge1xyXG4gICAgcmV0dXJuIHMucmVwbGFjZSgvWzw+XCImXS9nLCBlc2NhcGVDaGFyKTtcclxufVxyXG5leHBvcnRzLmVzY2FwZSA9IGVzY2FwZTtcclxuZnVuY3Rpb24gZXNjYXBlQ2hhcihhKSB7XHJcbiAgICByZXR1cm4gRVNDW2FdIHx8IGE7XHJcbn1cclxuZnVuY3Rpb24gY29weVRvQ2xpcGJvYXJkKHN0YXRlKSB7XHJcbiAgICBpZiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJylcclxuICAgICAgICByZXR1cm47XHJcbiAgICBjb25zdCBkdW1teVRleHRBcmVhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGV4dGFyZWEnKTtcclxuICAgIGR1bW15VGV4dEFyZWEudGV4dENvbnRlbnQgPSBzdHJpbmdpZnkoc3RhdGUpO1xyXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChkdW1teVRleHRBcmVhKTtcclxuICAgIGR1bW15VGV4dEFyZWEuc2VsZWN0KCk7XHJcbiAgICBkb2N1bWVudC5leGVjQ29tbWFuZCgnY29weScpO1xyXG4gICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChkdW1teVRleHRBcmVhKTtcclxufVxyXG5leHBvcnRzLmNvcHlUb0NsaXBib2FyZCA9IGNvcHlUb0NsaXBib2FyZDtcclxuZnVuY3Rpb24gaXNFbXB0eU9iamVjdChvYmopIHtcclxuICAgIHJldHVybiBvYmogPT09IGV4cG9ydHMuVU5ERUZJTkVEIHx8ICFvYmogfHwgT2JqZWN0LmtleXMob2JqKS5sZW5ndGggPT09IDA7XHJcbn1cclxuZXhwb3J0cy5pc0VtcHR5T2JqZWN0ID0gaXNFbXB0eU9iamVjdDtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dXRpbC5qcy5tYXAiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUiA9IHR5cGVvZiBSZWZsZWN0ID09PSAnb2JqZWN0JyA/IFJlZmxlY3QgOiBudWxsXG52YXIgUmVmbGVjdEFwcGx5ID0gUiAmJiB0eXBlb2YgUi5hcHBseSA9PT0gJ2Z1bmN0aW9uJ1xuICA/IFIuYXBwbHlcbiAgOiBmdW5jdGlvbiBSZWZsZWN0QXBwbHkodGFyZ2V0LCByZWNlaXZlciwgYXJncykge1xuICAgIHJldHVybiBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHkuY2FsbCh0YXJnZXQsIHJlY2VpdmVyLCBhcmdzKTtcbiAgfVxuXG52YXIgUmVmbGVjdE93bktleXNcbmlmIChSICYmIHR5cGVvZiBSLm93bktleXMgPT09ICdmdW5jdGlvbicpIHtcbiAgUmVmbGVjdE93bktleXMgPSBSLm93bktleXNcbn0gZWxzZSBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scykge1xuICBSZWZsZWN0T3duS2V5cyA9IGZ1bmN0aW9uIFJlZmxlY3RPd25LZXlzKHRhcmdldCkge1xuICAgIHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0YXJnZXQpXG4gICAgICAuY29uY2F0KE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHModGFyZ2V0KSk7XG4gIH07XG59IGVsc2Uge1xuICBSZWZsZWN0T3duS2V5cyA9IGZ1bmN0aW9uIFJlZmxlY3RPd25LZXlzKHRhcmdldCkge1xuICAgIHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0YXJnZXQpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBQcm9jZXNzRW1pdFdhcm5pbmcod2FybmluZykge1xuICBpZiAoY29uc29sZSAmJiBjb25zb2xlLndhcm4pIGNvbnNvbGUud2Fybih3YXJuaW5nKTtcbn1cblxudmFyIE51bWJlcklzTmFOID0gTnVtYmVyLmlzTmFOIHx8IGZ1bmN0aW9uIE51bWJlcklzTmFOKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSAhPT0gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgRXZlbnRFbWl0dGVyLmluaXQuY2FsbCh0aGlzKTtcbn1cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xubW9kdWxlLmV4cG9ydHMub25jZSA9IG9uY2U7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzQ291bnQgPSAwO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG52YXIgZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG5mdW5jdGlvbiBjaGVja0xpc3RlbmVyKGxpc3RlbmVyKSB7XG4gIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJsaXN0ZW5lclwiIGFyZ3VtZW50IG11c3QgYmUgb2YgdHlwZSBGdW5jdGlvbi4gUmVjZWl2ZWQgdHlwZSAnICsgdHlwZW9mIGxpc3RlbmVyKTtcbiAgfVxufVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoRXZlbnRFbWl0dGVyLCAnZGVmYXVsdE1heExpc3RlbmVycycsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZGVmYXVsdE1heExpc3RlbmVycztcbiAgfSxcbiAgc2V0OiBmdW5jdGlvbihhcmcpIHtcbiAgICBpZiAodHlwZW9mIGFyZyAhPT0gJ251bWJlcicgfHwgYXJnIDwgMCB8fCBOdW1iZXJJc05hTihhcmcpKSB7XG4gICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVGhlIHZhbHVlIG9mIFwiZGVmYXVsdE1heExpc3RlbmVyc1wiIGlzIG91dCBvZiByYW5nZS4gSXQgbXVzdCBiZSBhIG5vbi1uZWdhdGl2ZSBudW1iZXIuIFJlY2VpdmVkICcgKyBhcmcgKyAnLicpO1xuICAgIH1cbiAgICBkZWZhdWx0TWF4TGlzdGVuZXJzID0gYXJnO1xuICB9XG59KTtcblxuRXZlbnRFbWl0dGVyLmluaXQgPSBmdW5jdGlvbigpIHtcblxuICBpZiAodGhpcy5fZXZlbnRzID09PSB1bmRlZmluZWQgfHxcbiAgICAgIHRoaXMuX2V2ZW50cyA9PT0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHRoaXMpLl9ldmVudHMpIHtcbiAgICB0aGlzLl9ldmVudHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbiAgfVxuXG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59O1xuXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbiBzZXRNYXhMaXN0ZW5lcnMobikge1xuICBpZiAodHlwZW9mIG4gIT09ICdudW1iZXInIHx8IG4gPCAwIHx8IE51bWJlcklzTmFOKG4pKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RoZSB2YWx1ZSBvZiBcIm5cIiBpcyBvdXQgb2YgcmFuZ2UuIEl0IG11c3QgYmUgYSBub24tbmVnYXRpdmUgbnVtYmVyLiBSZWNlaXZlZCAnICsgbiArICcuJyk7XG4gIH1cbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5mdW5jdGlvbiBfZ2V0TWF4TGlzdGVuZXJzKHRoYXQpIHtcbiAgaWYgKHRoYXQuX21heExpc3RlbmVycyA9PT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgcmV0dXJuIHRoYXQuX21heExpc3RlbmVycztcbn1cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5nZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbiBnZXRNYXhMaXN0ZW5lcnMoKSB7XG4gIHJldHVybiBfZ2V0TWF4TGlzdGVuZXJzKHRoaXMpO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gZW1pdCh0eXBlKSB7XG4gIHZhciBhcmdzID0gW107XG4gIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSBhcmdzLnB1c2goYXJndW1lbnRzW2ldKTtcbiAgdmFyIGRvRXJyb3IgPSAodHlwZSA9PT0gJ2Vycm9yJyk7XG5cbiAgdmFyIGV2ZW50cyA9IHRoaXMuX2V2ZW50cztcbiAgaWYgKGV2ZW50cyAhPT0gdW5kZWZpbmVkKVxuICAgIGRvRXJyb3IgPSAoZG9FcnJvciAmJiBldmVudHMuZXJyb3IgPT09IHVuZGVmaW5lZCk7XG4gIGVsc2UgaWYgKCFkb0Vycm9yKVxuICAgIHJldHVybiBmYWxzZTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmIChkb0Vycm9yKSB7XG4gICAgdmFyIGVyO1xuICAgIGlmIChhcmdzLmxlbmd0aCA+IDApXG4gICAgICBlciA9IGFyZ3NbMF07XG4gICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgIC8vIE5vdGU6IFRoZSBjb21tZW50cyBvbiB0aGUgYHRocm93YCBsaW5lcyBhcmUgaW50ZW50aW9uYWwsIHRoZXkgc2hvd1xuICAgICAgLy8gdXAgaW4gTm9kZSdzIG91dHB1dCBpZiB0aGlzIHJlc3VsdHMgaW4gYW4gdW5oYW5kbGVkIGV4Y2VwdGlvbi5cbiAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgIH1cbiAgICAvLyBBdCBsZWFzdCBnaXZlIHNvbWUga2luZCBvZiBjb250ZXh0IHRvIHRoZSB1c2VyXG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcignVW5oYW5kbGVkIGVycm9yLicgKyAoZXIgPyAnICgnICsgZXIubWVzc2FnZSArICcpJyA6ICcnKSk7XG4gICAgZXJyLmNvbnRleHQgPSBlcjtcbiAgICB0aHJvdyBlcnI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gIH1cblxuICB2YXIgaGFuZGxlciA9IGV2ZW50c1t0eXBlXTtcblxuICBpZiAoaGFuZGxlciA9PT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAodHlwZW9mIGhhbmRsZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICBSZWZsZWN0QXBwbHkoaGFuZGxlciwgdGhpcywgYXJncyk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGxlbiA9IGhhbmRsZXIubGVuZ3RoO1xuICAgIHZhciBsaXN0ZW5lcnMgPSBhcnJheUNsb25lKGhhbmRsZXIsIGxlbik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSlcbiAgICAgIFJlZmxlY3RBcHBseShsaXN0ZW5lcnNbaV0sIHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5mdW5jdGlvbiBfYWRkTGlzdGVuZXIodGFyZ2V0LCB0eXBlLCBsaXN0ZW5lciwgcHJlcGVuZCkge1xuICB2YXIgbTtcbiAgdmFyIGV2ZW50cztcbiAgdmFyIGV4aXN0aW5nO1xuXG4gIGNoZWNrTGlzdGVuZXIobGlzdGVuZXIpO1xuXG4gIGV2ZW50cyA9IHRhcmdldC5fZXZlbnRzO1xuICBpZiAoZXZlbnRzID09PSB1bmRlZmluZWQpIHtcbiAgICBldmVudHMgPSB0YXJnZXQuX2V2ZW50cyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgdGFyZ2V0Ll9ldmVudHNDb3VudCA9IDA7XG4gIH0gZWxzZSB7XG4gICAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gICAgaWYgKGV2ZW50cy5uZXdMaXN0ZW5lciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0YXJnZXQuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgPyBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICAgICAgLy8gUmUtYXNzaWduIGBldmVudHNgIGJlY2F1c2UgYSBuZXdMaXN0ZW5lciBoYW5kbGVyIGNvdWxkIGhhdmUgY2F1c2VkIHRoZVxuICAgICAgLy8gdGhpcy5fZXZlbnRzIHRvIGJlIGFzc2lnbmVkIHRvIGEgbmV3IG9iamVjdFxuICAgICAgZXZlbnRzID0gdGFyZ2V0Ll9ldmVudHM7XG4gICAgfVxuICAgIGV4aXN0aW5nID0gZXZlbnRzW3R5cGVdO1xuICB9XG5cbiAgaWYgKGV4aXN0aW5nID09PSB1bmRlZmluZWQpIHtcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICBleGlzdGluZyA9IGV2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICAgICsrdGFyZ2V0Ll9ldmVudHNDb3VudDtcbiAgfSBlbHNlIHtcbiAgICBpZiAodHlwZW9mIGV4aXN0aW5nID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICAgIGV4aXN0aW5nID0gZXZlbnRzW3R5cGVdID1cbiAgICAgICAgcHJlcGVuZCA/IFtsaXN0ZW5lciwgZXhpc3RpbmddIDogW2V4aXN0aW5nLCBsaXN0ZW5lcl07XG4gICAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgfSBlbHNlIGlmIChwcmVwZW5kKSB7XG4gICAgICBleGlzdGluZy51bnNoaWZ0KGxpc3RlbmVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXhpc3RpbmcucHVzaChsaXN0ZW5lcik7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgICBtID0gX2dldE1heExpc3RlbmVycyh0YXJnZXQpO1xuICAgIGlmIChtID4gMCAmJiBleGlzdGluZy5sZW5ndGggPiBtICYmICFleGlzdGluZy53YXJuZWQpIHtcbiAgICAgIGV4aXN0aW5nLndhcm5lZCA9IHRydWU7XG4gICAgICAvLyBObyBlcnJvciBjb2RlIGZvciB0aGlzIHNpbmNlIGl0IGlzIGEgV2FybmluZ1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXJlc3RyaWN0ZWQtc3ludGF4XG4gICAgICB2YXIgdyA9IG5ldyBFcnJvcignUG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSBsZWFrIGRldGVjdGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZXhpc3RpbmcubGVuZ3RoICsgJyAnICsgU3RyaW5nKHR5cGUpICsgJyBsaXN0ZW5lcnMgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICdhZGRlZC4gVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICdpbmNyZWFzZSBsaW1pdCcpO1xuICAgICAgdy5uYW1lID0gJ01heExpc3RlbmVyc0V4Y2VlZGVkV2FybmluZyc7XG4gICAgICB3LmVtaXR0ZXIgPSB0YXJnZXQ7XG4gICAgICB3LnR5cGUgPSB0eXBlO1xuICAgICAgdy5jb3VudCA9IGV4aXN0aW5nLmxlbmd0aDtcbiAgICAgIFByb2Nlc3NFbWl0V2FybmluZyh3KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGFyZ2V0O1xufVxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24gYWRkTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIpIHtcbiAgcmV0dXJuIF9hZGRMaXN0ZW5lcih0aGlzLCB0eXBlLCBsaXN0ZW5lciwgZmFsc2UpO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucHJlcGVuZExpc3RlbmVyID1cbiAgICBmdW5jdGlvbiBwcmVwZW5kTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIpIHtcbiAgICAgIHJldHVybiBfYWRkTGlzdGVuZXIodGhpcywgdHlwZSwgbGlzdGVuZXIsIHRydWUpO1xuICAgIH07XG5cbmZ1bmN0aW9uIG9uY2VXcmFwcGVyKCkge1xuICBpZiAoIXRoaXMuZmlyZWQpIHtcbiAgICB0aGlzLnRhcmdldC5yZW1vdmVMaXN0ZW5lcih0aGlzLnR5cGUsIHRoaXMud3JhcEZuKTtcbiAgICB0aGlzLmZpcmVkID0gdHJ1ZTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHJldHVybiB0aGlzLmxpc3RlbmVyLmNhbGwodGhpcy50YXJnZXQpO1xuICAgIHJldHVybiB0aGlzLmxpc3RlbmVyLmFwcGx5KHRoaXMudGFyZ2V0LCBhcmd1bWVudHMpO1xuICB9XG59XG5cbmZ1bmN0aW9uIF9vbmNlV3JhcCh0YXJnZXQsIHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBzdGF0ZSA9IHsgZmlyZWQ6IGZhbHNlLCB3cmFwRm46IHVuZGVmaW5lZCwgdGFyZ2V0OiB0YXJnZXQsIHR5cGU6IHR5cGUsIGxpc3RlbmVyOiBsaXN0ZW5lciB9O1xuICB2YXIgd3JhcHBlZCA9IG9uY2VXcmFwcGVyLmJpbmQoc3RhdGUpO1xuICB3cmFwcGVkLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHN0YXRlLndyYXBGbiA9IHdyYXBwZWQ7XG4gIHJldHVybiB3cmFwcGVkO1xufVxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbiBvbmNlKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGNoZWNrTGlzdGVuZXIobGlzdGVuZXIpO1xuICB0aGlzLm9uKHR5cGUsIF9vbmNlV3JhcCh0aGlzLCB0eXBlLCBsaXN0ZW5lcikpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucHJlcGVuZE9uY2VMaXN0ZW5lciA9XG4gICAgZnVuY3Rpb24gcHJlcGVuZE9uY2VMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcikge1xuICAgICAgY2hlY2tMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgICB0aGlzLnByZXBlbmRMaXN0ZW5lcih0eXBlLCBfb25jZVdyYXAodGhpcywgdHlwZSwgbGlzdGVuZXIpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbi8vIEVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZiBhbmQgb25seSBpZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID1cbiAgICBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcikge1xuICAgICAgdmFyIGxpc3QsIGV2ZW50cywgcG9zaXRpb24sIGksIG9yaWdpbmFsTGlzdGVuZXI7XG5cbiAgICAgIGNoZWNrTGlzdGVuZXIobGlzdGVuZXIpO1xuXG4gICAgICBldmVudHMgPSB0aGlzLl9ldmVudHM7XG4gICAgICBpZiAoZXZlbnRzID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgICBsaXN0ID0gZXZlbnRzW3R5cGVdO1xuICAgICAgaWYgKGxpc3QgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICAgIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fCBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikge1xuICAgICAgICBpZiAoLS10aGlzLl9ldmVudHNDb3VudCA9PT0gMClcbiAgICAgICAgICB0aGlzLl9ldmVudHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBkZWxldGUgZXZlbnRzW3R5cGVdO1xuICAgICAgICAgIGlmIChldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdC5saXN0ZW5lciB8fCBsaXN0ZW5lcik7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGxpc3QgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcG9zaXRpb24gPSAtMTtcblxuICAgICAgICBmb3IgKGkgPSBsaXN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8IGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSB7XG4gICAgICAgICAgICBvcmlnaW5hbExpc3RlbmVyID0gbGlzdFtpXS5saXN0ZW5lcjtcbiAgICAgICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICAgICAgaWYgKHBvc2l0aW9uID09PSAwKVxuICAgICAgICAgIGxpc3Quc2hpZnQoKTtcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgc3BsaWNlT25lKGxpc3QsIHBvc2l0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSlcbiAgICAgICAgICBldmVudHNbdHlwZV0gPSBsaXN0WzBdO1xuXG4gICAgICAgIGlmIChldmVudHMucmVtb3ZlTGlzdGVuZXIgIT09IHVuZGVmaW5lZClcbiAgICAgICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgb3JpZ2luYWxMaXN0ZW5lciB8fCBsaXN0ZW5lcik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub2ZmID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPVxuICAgIGZ1bmN0aW9uIHJlbW92ZUFsbExpc3RlbmVycyh0eXBlKSB7XG4gICAgICB2YXIgbGlzdGVuZXJzLCBldmVudHMsIGk7XG5cbiAgICAgIGV2ZW50cyA9IHRoaXMuX2V2ZW50cztcbiAgICAgIGlmIChldmVudHMgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICAgIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgICAgIGlmIChldmVudHMucmVtb3ZlTGlzdGVuZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIHRoaXMuX2V2ZW50cyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgICAgICAgdGhpcy5fZXZlbnRzQ291bnQgPSAwO1xuICAgICAgICB9IGVsc2UgaWYgKGV2ZW50c1t0eXBlXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgaWYgKC0tdGhpcy5fZXZlbnRzQ291bnQgPT09IDApXG4gICAgICAgICAgICB0aGlzLl9ldmVudHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGRlbGV0ZSBldmVudHNbdHlwZV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG5cbiAgICAgIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhldmVudHMpO1xuICAgICAgICB2YXIga2V5O1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgIGtleSA9IGtleXNbaV07XG4gICAgICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICAgICAgdGhpcy5fZXZlbnRzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgICAgdGhpcy5fZXZlbnRzQ291bnQgPSAwO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgbGlzdGVuZXJzID0gZXZlbnRzW3R5cGVdO1xuXG4gICAgICBpZiAodHlwZW9mIGxpc3RlbmVycyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gICAgICB9IGVsc2UgaWYgKGxpc3RlbmVycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIExJRk8gb3JkZXJcbiAgICAgICAgZm9yIChpID0gbGlzdGVuZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbmZ1bmN0aW9uIF9saXN0ZW5lcnModGFyZ2V0LCB0eXBlLCB1bndyYXApIHtcbiAgdmFyIGV2ZW50cyA9IHRhcmdldC5fZXZlbnRzO1xuXG4gIGlmIChldmVudHMgPT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gW107XG5cbiAgdmFyIGV2bGlzdGVuZXIgPSBldmVudHNbdHlwZV07XG4gIGlmIChldmxpc3RlbmVyID09PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIFtdO1xuXG4gIGlmICh0eXBlb2YgZXZsaXN0ZW5lciA9PT0gJ2Z1bmN0aW9uJylcbiAgICByZXR1cm4gdW53cmFwID8gW2V2bGlzdGVuZXIubGlzdGVuZXIgfHwgZXZsaXN0ZW5lcl0gOiBbZXZsaXN0ZW5lcl07XG5cbiAgcmV0dXJuIHVud3JhcCA/XG4gICAgdW53cmFwTGlzdGVuZXJzKGV2bGlzdGVuZXIpIDogYXJyYXlDbG9uZShldmxpc3RlbmVyLCBldmxpc3RlbmVyLmxlbmd0aCk7XG59XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24gbGlzdGVuZXJzKHR5cGUpIHtcbiAgcmV0dXJuIF9saXN0ZW5lcnModGhpcywgdHlwZSwgdHJ1ZSk7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJhd0xpc3RlbmVycyA9IGZ1bmN0aW9uIHJhd0xpc3RlbmVycyh0eXBlKSB7XG4gIHJldHVybiBfbGlzdGVuZXJzKHRoaXMsIHR5cGUsIGZhbHNlKTtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICBpZiAodHlwZW9mIGVtaXR0ZXIubGlzdGVuZXJDb3VudCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBlbWl0dGVyLmxpc3RlbmVyQ291bnQodHlwZSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGxpc3RlbmVyQ291bnQuY2FsbChlbWl0dGVyLCB0eXBlKTtcbiAgfVxufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lckNvdW50ID0gbGlzdGVuZXJDb3VudDtcbmZ1bmN0aW9uIGxpc3RlbmVyQ291bnQodHlwZSkge1xuICB2YXIgZXZlbnRzID0gdGhpcy5fZXZlbnRzO1xuXG4gIGlmIChldmVudHMgIT09IHVuZGVmaW5lZCkge1xuICAgIHZhciBldmxpc3RlbmVyID0gZXZlbnRzW3R5cGVdO1xuXG4gICAgaWYgKHR5cGVvZiBldmxpc3RlbmVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gMTtcbiAgICB9IGVsc2UgaWYgKGV2bGlzdGVuZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIGV2bGlzdGVuZXIubGVuZ3RoO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiAwO1xufVxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmV2ZW50TmFtZXMgPSBmdW5jdGlvbiBldmVudE5hbWVzKCkge1xuICByZXR1cm4gdGhpcy5fZXZlbnRzQ291bnQgPiAwID8gUmVmbGVjdE93bktleXModGhpcy5fZXZlbnRzKSA6IFtdO1xufTtcblxuZnVuY3Rpb24gYXJyYXlDbG9uZShhcnIsIG4pIHtcbiAgdmFyIGNvcHkgPSBuZXcgQXJyYXkobik7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKVxuICAgIGNvcHlbaV0gPSBhcnJbaV07XG4gIHJldHVybiBjb3B5O1xufVxuXG5mdW5jdGlvbiBzcGxpY2VPbmUobGlzdCwgaW5kZXgpIHtcbiAgZm9yICg7IGluZGV4ICsgMSA8IGxpc3QubGVuZ3RoOyBpbmRleCsrKVxuICAgIGxpc3RbaW5kZXhdID0gbGlzdFtpbmRleCArIDFdO1xuICBsaXN0LnBvcCgpO1xufVxuXG5mdW5jdGlvbiB1bndyYXBMaXN0ZW5lcnMoYXJyKSB7XG4gIHZhciByZXQgPSBuZXcgQXJyYXkoYXJyLmxlbmd0aCk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcmV0Lmxlbmd0aDsgKytpKSB7XG4gICAgcmV0W2ldID0gYXJyW2ldLmxpc3RlbmVyIHx8IGFycltpXTtcbiAgfVxuICByZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBvbmNlKGVtaXR0ZXIsIG5hbWUpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICBmdW5jdGlvbiBlcnJvckxpc3RlbmVyKGVycikge1xuICAgICAgZW1pdHRlci5yZW1vdmVMaXN0ZW5lcihuYW1lLCByZXNvbHZlcik7XG4gICAgICByZWplY3QoZXJyKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXNvbHZlcigpIHtcbiAgICAgIGlmICh0eXBlb2YgZW1pdHRlci5yZW1vdmVMaXN0ZW5lciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBlbWl0dGVyLnJlbW92ZUxpc3RlbmVyKCdlcnJvcicsIGVycm9yTGlzdGVuZXIpO1xuICAgICAgfVxuICAgICAgcmVzb2x2ZShbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykpO1xuICAgIH07XG5cbiAgICBldmVudFRhcmdldEFnbm9zdGljQWRkTGlzdGVuZXIoZW1pdHRlciwgbmFtZSwgcmVzb2x2ZXIsIHsgb25jZTogdHJ1ZSB9KTtcbiAgICBpZiAobmFtZSAhPT0gJ2Vycm9yJykge1xuICAgICAgYWRkRXJyb3JIYW5kbGVySWZFdmVudEVtaXR0ZXIoZW1pdHRlciwgZXJyb3JMaXN0ZW5lciwgeyBvbmNlOiB0cnVlIH0pO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGFkZEVycm9ySGFuZGxlcklmRXZlbnRFbWl0dGVyKGVtaXR0ZXIsIGhhbmRsZXIsIGZsYWdzKSB7XG4gIGlmICh0eXBlb2YgZW1pdHRlci5vbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGV2ZW50VGFyZ2V0QWdub3N0aWNBZGRMaXN0ZW5lcihlbWl0dGVyLCAnZXJyb3InLCBoYW5kbGVyLCBmbGFncyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZXZlbnRUYXJnZXRBZ25vc3RpY0FkZExpc3RlbmVyKGVtaXR0ZXIsIG5hbWUsIGxpc3RlbmVyLCBmbGFncykge1xuICBpZiAodHlwZW9mIGVtaXR0ZXIub24gPT09ICdmdW5jdGlvbicpIHtcbiAgICBpZiAoZmxhZ3Mub25jZSkge1xuICAgICAgZW1pdHRlci5vbmNlKG5hbWUsIGxpc3RlbmVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZW1pdHRlci5vbihuYW1lLCBsaXN0ZW5lcik7XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiBlbWl0dGVyLmFkZEV2ZW50TGlzdGVuZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyBFdmVudFRhcmdldCBkb2VzIG5vdCBoYXZlIGBlcnJvcmAgZXZlbnQgc2VtYW50aWNzIGxpa2UgTm9kZVxuICAgIC8vIEV2ZW50RW1pdHRlcnMsIHdlIGRvIG5vdCBsaXN0ZW4gZm9yIGBlcnJvcmAgZXZlbnRzIGhlcmUuXG4gICAgZW1pdHRlci5hZGRFdmVudExpc3RlbmVyKG5hbWUsIGZ1bmN0aW9uIHdyYXBMaXN0ZW5lcihhcmcpIHtcbiAgICAgIC8vIElFIGRvZXMgbm90IGhhdmUgYnVpbHRpbiBgeyBvbmNlOiB0cnVlIH1gIHN1cHBvcnQgc28gd2VcbiAgICAgIC8vIGhhdmUgdG8gZG8gaXQgbWFudWFsbHkuXG4gICAgICBpZiAoZmxhZ3Mub25jZSkge1xuICAgICAgICBlbWl0dGVyLnJlbW92ZUV2ZW50TGlzdGVuZXIobmFtZSwgd3JhcExpc3RlbmVyKTtcbiAgICAgIH1cbiAgICAgIGxpc3RlbmVyKGFyZyk7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwiZW1pdHRlclwiIGFyZ3VtZW50IG11c3QgYmUgb2YgdHlwZSBFdmVudEVtaXR0ZXIuIFJlY2VpdmVkIHR5cGUgJyArIHR5cGVvZiBlbWl0dGVyKTtcbiAgfVxufVxuIiwiLy8gJ3BhdGgnIG1vZHVsZSBleHRyYWN0ZWQgZnJvbSBOb2RlLmpzIHY4LjExLjEgKG9ubHkgdGhlIHBvc2l4IHBhcnQpXG4vLyB0cmFuc3BsaXRlZCB3aXRoIEJhYmVsXG5cbi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGFzc2VydFBhdGgocGF0aCkge1xuICBpZiAodHlwZW9mIHBhdGggIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignUGF0aCBtdXN0IGJlIGEgc3RyaW5nLiBSZWNlaXZlZCAnICsgSlNPTi5zdHJpbmdpZnkocGF0aCkpO1xuICB9XG59XG5cbi8vIFJlc29sdmVzIC4gYW5kIC4uIGVsZW1lbnRzIGluIGEgcGF0aCB3aXRoIGRpcmVjdG9yeSBuYW1lc1xuZnVuY3Rpb24gbm9ybWFsaXplU3RyaW5nUG9zaXgocGF0aCwgYWxsb3dBYm92ZVJvb3QpIHtcbiAgdmFyIHJlcyA9ICcnO1xuICB2YXIgbGFzdFNlZ21lbnRMZW5ndGggPSAwO1xuICB2YXIgbGFzdFNsYXNoID0gLTE7XG4gIHZhciBkb3RzID0gMDtcbiAgdmFyIGNvZGU7XG4gIGZvciAodmFyIGkgPSAwOyBpIDw9IHBhdGgubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoaSA8IHBhdGgubGVuZ3RoKVxuICAgICAgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcbiAgICBlbHNlIGlmIChjb2RlID09PSA0NyAvKi8qLylcbiAgICAgIGJyZWFrO1xuICAgIGVsc2VcbiAgICAgIGNvZGUgPSA0NyAvKi8qLztcbiAgICBpZiAoY29kZSA9PT0gNDcgLyovKi8pIHtcbiAgICAgIGlmIChsYXN0U2xhc2ggPT09IGkgLSAxIHx8IGRvdHMgPT09IDEpIHtcbiAgICAgICAgLy8gTk9PUFxuICAgICAgfSBlbHNlIGlmIChsYXN0U2xhc2ggIT09IGkgLSAxICYmIGRvdHMgPT09IDIpIHtcbiAgICAgICAgaWYgKHJlcy5sZW5ndGggPCAyIHx8IGxhc3RTZWdtZW50TGVuZ3RoICE9PSAyIHx8IHJlcy5jaGFyQ29kZUF0KHJlcy5sZW5ndGggLSAxKSAhPT0gNDYgLyouKi8gfHwgcmVzLmNoYXJDb2RlQXQocmVzLmxlbmd0aCAtIDIpICE9PSA0NiAvKi4qLykge1xuICAgICAgICAgIGlmIChyZXMubGVuZ3RoID4gMikge1xuICAgICAgICAgICAgdmFyIGxhc3RTbGFzaEluZGV4ID0gcmVzLmxhc3RJbmRleE9mKCcvJyk7XG4gICAgICAgICAgICBpZiAobGFzdFNsYXNoSW5kZXggIT09IHJlcy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgIGlmIChsYXN0U2xhc2hJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXMgPSAnJztcbiAgICAgICAgICAgICAgICBsYXN0U2VnbWVudExlbmd0aCA9IDA7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzID0gcmVzLnNsaWNlKDAsIGxhc3RTbGFzaEluZGV4KTtcbiAgICAgICAgICAgICAgICBsYXN0U2VnbWVudExlbmd0aCA9IHJlcy5sZW5ndGggLSAxIC0gcmVzLmxhc3RJbmRleE9mKCcvJyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgbGFzdFNsYXNoID0gaTtcbiAgICAgICAgICAgICAgZG90cyA9IDA7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAocmVzLmxlbmd0aCA9PT0gMiB8fCByZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICByZXMgPSAnJztcbiAgICAgICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoID0gMDtcbiAgICAgICAgICAgIGxhc3RTbGFzaCA9IGk7XG4gICAgICAgICAgICBkb3RzID0gMDtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoYWxsb3dBYm92ZVJvb3QpIHtcbiAgICAgICAgICBpZiAocmVzLmxlbmd0aCA+IDApXG4gICAgICAgICAgICByZXMgKz0gJy8uLic7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVzID0gJy4uJztcbiAgICAgICAgICBsYXN0U2VnbWVudExlbmd0aCA9IDI7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChyZXMubGVuZ3RoID4gMClcbiAgICAgICAgICByZXMgKz0gJy8nICsgcGF0aC5zbGljZShsYXN0U2xhc2ggKyAxLCBpKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJlcyA9IHBhdGguc2xpY2UobGFzdFNsYXNoICsgMSwgaSk7XG4gICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoID0gaSAtIGxhc3RTbGFzaCAtIDE7XG4gICAgICB9XG4gICAgICBsYXN0U2xhc2ggPSBpO1xuICAgICAgZG90cyA9IDA7XG4gICAgfSBlbHNlIGlmIChjb2RlID09PSA0NiAvKi4qLyAmJiBkb3RzICE9PSAtMSkge1xuICAgICAgKytkb3RzO1xuICAgIH0gZWxzZSB7XG4gICAgICBkb3RzID0gLTE7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXM7XG59XG5cbmZ1bmN0aW9uIF9mb3JtYXQoc2VwLCBwYXRoT2JqZWN0KSB7XG4gIHZhciBkaXIgPSBwYXRoT2JqZWN0LmRpciB8fCBwYXRoT2JqZWN0LnJvb3Q7XG4gIHZhciBiYXNlID0gcGF0aE9iamVjdC5iYXNlIHx8IChwYXRoT2JqZWN0Lm5hbWUgfHwgJycpICsgKHBhdGhPYmplY3QuZXh0IHx8ICcnKTtcbiAgaWYgKCFkaXIpIHtcbiAgICByZXR1cm4gYmFzZTtcbiAgfVxuICBpZiAoZGlyID09PSBwYXRoT2JqZWN0LnJvb3QpIHtcbiAgICByZXR1cm4gZGlyICsgYmFzZTtcbiAgfVxuICByZXR1cm4gZGlyICsgc2VwICsgYmFzZTtcbn1cblxudmFyIHBvc2l4ID0ge1xuICAvLyBwYXRoLnJlc29sdmUoW2Zyb20gLi4uXSwgdG8pXG4gIHJlc29sdmU6IGZ1bmN0aW9uIHJlc29sdmUoKSB7XG4gICAgdmFyIHJlc29sdmVkUGF0aCA9ICcnO1xuICAgIHZhciByZXNvbHZlZEFic29sdXRlID0gZmFsc2U7XG4gICAgdmFyIGN3ZDtcblxuICAgIGZvciAodmFyIGkgPSBhcmd1bWVudHMubGVuZ3RoIC0gMTsgaSA+PSAtMSAmJiAhcmVzb2x2ZWRBYnNvbHV0ZTsgaS0tKSB7XG4gICAgICB2YXIgcGF0aDtcbiAgICAgIGlmIChpID49IDApXG4gICAgICAgIHBhdGggPSBhcmd1bWVudHNbaV07XG4gICAgICBlbHNlIHtcbiAgICAgICAgaWYgKGN3ZCA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgIGN3ZCA9IHByb2Nlc3MuY3dkKCk7XG4gICAgICAgIHBhdGggPSBjd2Q7XG4gICAgICB9XG5cbiAgICAgIGFzc2VydFBhdGgocGF0aCk7XG5cbiAgICAgIC8vIFNraXAgZW1wdHkgZW50cmllc1xuICAgICAgaWYgKHBhdGgubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICByZXNvbHZlZFBhdGggPSBwYXRoICsgJy8nICsgcmVzb2x2ZWRQYXRoO1xuICAgICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IHBhdGguY2hhckNvZGVBdCgwKSA9PT0gNDcgLyovKi87XG4gICAgfVxuXG4gICAgLy8gQXQgdGhpcyBwb2ludCB0aGUgcGF0aCBzaG91bGQgYmUgcmVzb2x2ZWQgdG8gYSBmdWxsIGFic29sdXRlIHBhdGgsIGJ1dFxuICAgIC8vIGhhbmRsZSByZWxhdGl2ZSBwYXRocyB0byBiZSBzYWZlIChtaWdodCBoYXBwZW4gd2hlbiBwcm9jZXNzLmN3ZCgpIGZhaWxzKVxuXG4gICAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gICAgcmVzb2x2ZWRQYXRoID0gbm9ybWFsaXplU3RyaW5nUG9zaXgocmVzb2x2ZWRQYXRoLCAhcmVzb2x2ZWRBYnNvbHV0ZSk7XG5cbiAgICBpZiAocmVzb2x2ZWRBYnNvbHV0ZSkge1xuICAgICAgaWYgKHJlc29sdmVkUGF0aC5sZW5ndGggPiAwKVxuICAgICAgICByZXR1cm4gJy8nICsgcmVzb2x2ZWRQYXRoO1xuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gJy8nO1xuICAgIH0gZWxzZSBpZiAocmVzb2x2ZWRQYXRoLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybiByZXNvbHZlZFBhdGg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAnLic7XG4gICAgfVxuICB9LFxuXG4gIG5vcm1hbGl6ZTogZnVuY3Rpb24gbm9ybWFsaXplKHBhdGgpIHtcbiAgICBhc3NlcnRQYXRoKHBhdGgpO1xuXG4gICAgaWYgKHBhdGgubGVuZ3RoID09PSAwKSByZXR1cm4gJy4nO1xuXG4gICAgdmFyIGlzQWJzb2x1dGUgPSBwYXRoLmNoYXJDb2RlQXQoMCkgPT09IDQ3IC8qLyovO1xuICAgIHZhciB0cmFpbGluZ1NlcGFyYXRvciA9IHBhdGguY2hhckNvZGVBdChwYXRoLmxlbmd0aCAtIDEpID09PSA0NyAvKi8qLztcblxuICAgIC8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxuICAgIHBhdGggPSBub3JtYWxpemVTdHJpbmdQb3NpeChwYXRoLCAhaXNBYnNvbHV0ZSk7XG5cbiAgICBpZiAocGF0aC5sZW5ndGggPT09IDAgJiYgIWlzQWJzb2x1dGUpIHBhdGggPSAnLic7XG4gICAgaWYgKHBhdGgubGVuZ3RoID4gMCAmJiB0cmFpbGluZ1NlcGFyYXRvcikgcGF0aCArPSAnLyc7XG5cbiAgICBpZiAoaXNBYnNvbHV0ZSkgcmV0dXJuICcvJyArIHBhdGg7XG4gICAgcmV0dXJuIHBhdGg7XG4gIH0sXG5cbiAgaXNBYnNvbHV0ZTogZnVuY3Rpb24gaXNBYnNvbHV0ZShwYXRoKSB7XG4gICAgYXNzZXJ0UGF0aChwYXRoKTtcbiAgICByZXR1cm4gcGF0aC5sZW5ndGggPiAwICYmIHBhdGguY2hhckNvZGVBdCgwKSA9PT0gNDcgLyovKi87XG4gIH0sXG5cbiAgam9pbjogZnVuY3Rpb24gam9pbigpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHJldHVybiAnLic7XG4gICAgdmFyIGpvaW5lZDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7ICsraSkge1xuICAgICAgdmFyIGFyZyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgIGFzc2VydFBhdGgoYXJnKTtcbiAgICAgIGlmIChhcmcubGVuZ3RoID4gMCkge1xuICAgICAgICBpZiAoam9pbmVkID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgam9pbmVkID0gYXJnO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgam9pbmVkICs9ICcvJyArIGFyZztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGpvaW5lZCA9PT0gdW5kZWZpbmVkKVxuICAgICAgcmV0dXJuICcuJztcbiAgICByZXR1cm4gcG9zaXgubm9ybWFsaXplKGpvaW5lZCk7XG4gIH0sXG5cbiAgcmVsYXRpdmU6IGZ1bmN0aW9uIHJlbGF0aXZlKGZyb20sIHRvKSB7XG4gICAgYXNzZXJ0UGF0aChmcm9tKTtcbiAgICBhc3NlcnRQYXRoKHRvKTtcblxuICAgIGlmIChmcm9tID09PSB0bykgcmV0dXJuICcnO1xuXG4gICAgZnJvbSA9IHBvc2l4LnJlc29sdmUoZnJvbSk7XG4gICAgdG8gPSBwb3NpeC5yZXNvbHZlKHRvKTtcblxuICAgIGlmIChmcm9tID09PSB0bykgcmV0dXJuICcnO1xuXG4gICAgLy8gVHJpbSBhbnkgbGVhZGluZyBiYWNrc2xhc2hlc1xuICAgIHZhciBmcm9tU3RhcnQgPSAxO1xuICAgIGZvciAoOyBmcm9tU3RhcnQgPCBmcm9tLmxlbmd0aDsgKytmcm9tU3RhcnQpIHtcbiAgICAgIGlmIChmcm9tLmNoYXJDb2RlQXQoZnJvbVN0YXJ0KSAhPT0gNDcgLyovKi8pXG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICB2YXIgZnJvbUVuZCA9IGZyb20ubGVuZ3RoO1xuICAgIHZhciBmcm9tTGVuID0gZnJvbUVuZCAtIGZyb21TdGFydDtcblxuICAgIC8vIFRyaW0gYW55IGxlYWRpbmcgYmFja3NsYXNoZXNcbiAgICB2YXIgdG9TdGFydCA9IDE7XG4gICAgZm9yICg7IHRvU3RhcnQgPCB0by5sZW5ndGg7ICsrdG9TdGFydCkge1xuICAgICAgaWYgKHRvLmNoYXJDb2RlQXQodG9TdGFydCkgIT09IDQ3IC8qLyovKVxuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgdmFyIHRvRW5kID0gdG8ubGVuZ3RoO1xuICAgIHZhciB0b0xlbiA9IHRvRW5kIC0gdG9TdGFydDtcblxuICAgIC8vIENvbXBhcmUgcGF0aHMgdG8gZmluZCB0aGUgbG9uZ2VzdCBjb21tb24gcGF0aCBmcm9tIHJvb3RcbiAgICB2YXIgbGVuZ3RoID0gZnJvbUxlbiA8IHRvTGVuID8gZnJvbUxlbiA6IHRvTGVuO1xuICAgIHZhciBsYXN0Q29tbW9uU2VwID0gLTE7XG4gICAgdmFyIGkgPSAwO1xuICAgIGZvciAoOyBpIDw9IGxlbmd0aDsgKytpKSB7XG4gICAgICBpZiAoaSA9PT0gbGVuZ3RoKSB7XG4gICAgICAgIGlmICh0b0xlbiA+IGxlbmd0aCkge1xuICAgICAgICAgIGlmICh0by5jaGFyQ29kZUF0KHRvU3RhcnQgKyBpKSA9PT0gNDcgLyovKi8pIHtcbiAgICAgICAgICAgIC8vIFdlIGdldCBoZXJlIGlmIGBmcm9tYCBpcyB0aGUgZXhhY3QgYmFzZSBwYXRoIGZvciBgdG9gLlxuICAgICAgICAgICAgLy8gRm9yIGV4YW1wbGU6IGZyb209Jy9mb28vYmFyJzsgdG89Jy9mb28vYmFyL2JheidcbiAgICAgICAgICAgIHJldHVybiB0by5zbGljZSh0b1N0YXJ0ICsgaSArIDEpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoaSA9PT0gMCkge1xuICAgICAgICAgICAgLy8gV2UgZ2V0IGhlcmUgaWYgYGZyb21gIGlzIHRoZSByb290XG4gICAgICAgICAgICAvLyBGb3IgZXhhbXBsZTogZnJvbT0nLyc7IHRvPScvZm9vJ1xuICAgICAgICAgICAgcmV0dXJuIHRvLnNsaWNlKHRvU3RhcnQgKyBpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoZnJvbUxlbiA+IGxlbmd0aCkge1xuICAgICAgICAgIGlmIChmcm9tLmNoYXJDb2RlQXQoZnJvbVN0YXJ0ICsgaSkgPT09IDQ3IC8qLyovKSB7XG4gICAgICAgICAgICAvLyBXZSBnZXQgaGVyZSBpZiBgdG9gIGlzIHRoZSBleGFjdCBiYXNlIHBhdGggZm9yIGBmcm9tYC5cbiAgICAgICAgICAgIC8vIEZvciBleGFtcGxlOiBmcm9tPScvZm9vL2Jhci9iYXonOyB0bz0nL2Zvby9iYXInXG4gICAgICAgICAgICBsYXN0Q29tbW9uU2VwID0gaTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGkgPT09IDApIHtcbiAgICAgICAgICAgIC8vIFdlIGdldCBoZXJlIGlmIGB0b2AgaXMgdGhlIHJvb3QuXG4gICAgICAgICAgICAvLyBGb3IgZXhhbXBsZTogZnJvbT0nL2Zvbyc7IHRvPScvJ1xuICAgICAgICAgICAgbGFzdENvbW1vblNlcCA9IDA7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgdmFyIGZyb21Db2RlID0gZnJvbS5jaGFyQ29kZUF0KGZyb21TdGFydCArIGkpO1xuICAgICAgdmFyIHRvQ29kZSA9IHRvLmNoYXJDb2RlQXQodG9TdGFydCArIGkpO1xuICAgICAgaWYgKGZyb21Db2RlICE9PSB0b0NvZGUpXG4gICAgICAgIGJyZWFrO1xuICAgICAgZWxzZSBpZiAoZnJvbUNvZGUgPT09IDQ3IC8qLyovKVxuICAgICAgICBsYXN0Q29tbW9uU2VwID0gaTtcbiAgICB9XG5cbiAgICB2YXIgb3V0ID0gJyc7XG4gICAgLy8gR2VuZXJhdGUgdGhlIHJlbGF0aXZlIHBhdGggYmFzZWQgb24gdGhlIHBhdGggZGlmZmVyZW5jZSBiZXR3ZWVuIGB0b2BcbiAgICAvLyBhbmQgYGZyb21gXG4gICAgZm9yIChpID0gZnJvbVN0YXJ0ICsgbGFzdENvbW1vblNlcCArIDE7IGkgPD0gZnJvbUVuZDsgKytpKSB7XG4gICAgICBpZiAoaSA9PT0gZnJvbUVuZCB8fCBmcm9tLmNoYXJDb2RlQXQoaSkgPT09IDQ3IC8qLyovKSB7XG4gICAgICAgIGlmIChvdXQubGVuZ3RoID09PSAwKVxuICAgICAgICAgIG91dCArPSAnLi4nO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgb3V0ICs9ICcvLi4nO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIExhc3RseSwgYXBwZW5kIHRoZSByZXN0IG9mIHRoZSBkZXN0aW5hdGlvbiAoYHRvYCkgcGF0aCB0aGF0IGNvbWVzIGFmdGVyXG4gICAgLy8gdGhlIGNvbW1vbiBwYXRoIHBhcnRzXG4gICAgaWYgKG91dC5sZW5ndGggPiAwKVxuICAgICAgcmV0dXJuIG91dCArIHRvLnNsaWNlKHRvU3RhcnQgKyBsYXN0Q29tbW9uU2VwKTtcbiAgICBlbHNlIHtcbiAgICAgIHRvU3RhcnQgKz0gbGFzdENvbW1vblNlcDtcbiAgICAgIGlmICh0by5jaGFyQ29kZUF0KHRvU3RhcnQpID09PSA0NyAvKi8qLylcbiAgICAgICAgKyt0b1N0YXJ0O1xuICAgICAgcmV0dXJuIHRvLnNsaWNlKHRvU3RhcnQpO1xuICAgIH1cbiAgfSxcblxuICBfbWFrZUxvbmc6IGZ1bmN0aW9uIF9tYWtlTG9uZyhwYXRoKSB7XG4gICAgcmV0dXJuIHBhdGg7XG4gIH0sXG5cbiAgZGlybmFtZTogZnVuY3Rpb24gZGlybmFtZShwYXRoKSB7XG4gICAgYXNzZXJ0UGF0aChwYXRoKTtcbiAgICBpZiAocGF0aC5sZW5ndGggPT09IDApIHJldHVybiAnLic7XG4gICAgdmFyIGNvZGUgPSBwYXRoLmNoYXJDb2RlQXQoMCk7XG4gICAgdmFyIGhhc1Jvb3QgPSBjb2RlID09PSA0NyAvKi8qLztcbiAgICB2YXIgZW5kID0gLTE7XG4gICAgdmFyIG1hdGNoZWRTbGFzaCA9IHRydWU7XG4gICAgZm9yICh2YXIgaSA9IHBhdGgubGVuZ3RoIC0gMTsgaSA+PSAxOyAtLWkpIHtcbiAgICAgIGNvZGUgPSBwYXRoLmNoYXJDb2RlQXQoaSk7XG4gICAgICBpZiAoY29kZSA9PT0gNDcgLyovKi8pIHtcbiAgICAgICAgICBpZiAoIW1hdGNoZWRTbGFzaCkge1xuICAgICAgICAgICAgZW5kID0gaTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gV2Ugc2F3IHRoZSBmaXJzdCBub24tcGF0aCBzZXBhcmF0b3JcbiAgICAgICAgbWF0Y2hlZFNsYXNoID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGVuZCA9PT0gLTEpIHJldHVybiBoYXNSb290ID8gJy8nIDogJy4nO1xuICAgIGlmIChoYXNSb290ICYmIGVuZCA9PT0gMSkgcmV0dXJuICcvLyc7XG4gICAgcmV0dXJuIHBhdGguc2xpY2UoMCwgZW5kKTtcbiAgfSxcblxuICBiYXNlbmFtZTogZnVuY3Rpb24gYmFzZW5hbWUocGF0aCwgZXh0KSB7XG4gICAgaWYgKGV4dCAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBleHQgIT09ICdzdHJpbmcnKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImV4dFwiIGFyZ3VtZW50IG11c3QgYmUgYSBzdHJpbmcnKTtcbiAgICBhc3NlcnRQYXRoKHBhdGgpO1xuXG4gICAgdmFyIHN0YXJ0ID0gMDtcbiAgICB2YXIgZW5kID0gLTE7XG4gICAgdmFyIG1hdGNoZWRTbGFzaCA9IHRydWU7XG4gICAgdmFyIGk7XG5cbiAgICBpZiAoZXh0ICE9PSB1bmRlZmluZWQgJiYgZXh0Lmxlbmd0aCA+IDAgJiYgZXh0Lmxlbmd0aCA8PSBwYXRoLmxlbmd0aCkge1xuICAgICAgaWYgKGV4dC5sZW5ndGggPT09IHBhdGgubGVuZ3RoICYmIGV4dCA9PT0gcGF0aCkgcmV0dXJuICcnO1xuICAgICAgdmFyIGV4dElkeCA9IGV4dC5sZW5ndGggLSAxO1xuICAgICAgdmFyIGZpcnN0Tm9uU2xhc2hFbmQgPSAtMTtcbiAgICAgIGZvciAoaSA9IHBhdGgubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgdmFyIGNvZGUgPSBwYXRoLmNoYXJDb2RlQXQoaSk7XG4gICAgICAgIGlmIChjb2RlID09PSA0NyAvKi8qLykge1xuICAgICAgICAgICAgLy8gSWYgd2UgcmVhY2hlZCBhIHBhdGggc2VwYXJhdG9yIHRoYXQgd2FzIG5vdCBwYXJ0IG9mIGEgc2V0IG9mIHBhdGhcbiAgICAgICAgICAgIC8vIHNlcGFyYXRvcnMgYXQgdGhlIGVuZCBvZiB0aGUgc3RyaW5nLCBzdG9wIG5vd1xuICAgICAgICAgICAgaWYgKCFtYXRjaGVkU2xhc2gpIHtcbiAgICAgICAgICAgICAgc3RhcnQgPSBpICsgMTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoZmlyc3ROb25TbGFzaEVuZCA9PT0gLTEpIHtcbiAgICAgICAgICAgIC8vIFdlIHNhdyB0aGUgZmlyc3Qgbm9uLXBhdGggc2VwYXJhdG9yLCByZW1lbWJlciB0aGlzIGluZGV4IGluIGNhc2VcbiAgICAgICAgICAgIC8vIHdlIG5lZWQgaXQgaWYgdGhlIGV4dGVuc2lvbiBlbmRzIHVwIG5vdCBtYXRjaGluZ1xuICAgICAgICAgICAgbWF0Y2hlZFNsYXNoID0gZmFsc2U7XG4gICAgICAgICAgICBmaXJzdE5vblNsYXNoRW5kID0gaSArIDE7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChleHRJZHggPj0gMCkge1xuICAgICAgICAgICAgLy8gVHJ5IHRvIG1hdGNoIHRoZSBleHBsaWNpdCBleHRlbnNpb25cbiAgICAgICAgICAgIGlmIChjb2RlID09PSBleHQuY2hhckNvZGVBdChleHRJZHgpKSB7XG4gICAgICAgICAgICAgIGlmICgtLWV4dElkeCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAvLyBXZSBtYXRjaGVkIHRoZSBleHRlbnNpb24sIHNvIG1hcmsgdGhpcyBhcyB0aGUgZW5kIG9mIG91ciBwYXRoXG4gICAgICAgICAgICAgICAgLy8gY29tcG9uZW50XG4gICAgICAgICAgICAgICAgZW5kID0gaTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgLy8gRXh0ZW5zaW9uIGRvZXMgbm90IG1hdGNoLCBzbyBvdXIgcmVzdWx0IGlzIHRoZSBlbnRpcmUgcGF0aFxuICAgICAgICAgICAgICAvLyBjb21wb25lbnRcbiAgICAgICAgICAgICAgZXh0SWR4ID0gLTE7XG4gICAgICAgICAgICAgIGVuZCA9IGZpcnN0Tm9uU2xhc2hFbmQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChzdGFydCA9PT0gZW5kKSBlbmQgPSBmaXJzdE5vblNsYXNoRW5kO2Vsc2UgaWYgKGVuZCA9PT0gLTEpIGVuZCA9IHBhdGgubGVuZ3RoO1xuICAgICAgcmV0dXJuIHBhdGguc2xpY2Uoc3RhcnQsIGVuZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAoaSA9IHBhdGgubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgaWYgKHBhdGguY2hhckNvZGVBdChpKSA9PT0gNDcgLyovKi8pIHtcbiAgICAgICAgICAgIC8vIElmIHdlIHJlYWNoZWQgYSBwYXRoIHNlcGFyYXRvciB0aGF0IHdhcyBub3QgcGFydCBvZiBhIHNldCBvZiBwYXRoXG4gICAgICAgICAgICAvLyBzZXBhcmF0b3JzIGF0IHRoZSBlbmQgb2YgdGhlIHN0cmluZywgc3RvcCBub3dcbiAgICAgICAgICAgIGlmICghbWF0Y2hlZFNsYXNoKSB7XG4gICAgICAgICAgICAgIHN0YXJ0ID0gaSArIDE7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoZW5kID09PSAtMSkge1xuICAgICAgICAgIC8vIFdlIHNhdyB0aGUgZmlyc3Qgbm9uLXBhdGggc2VwYXJhdG9yLCBtYXJrIHRoaXMgYXMgdGhlIGVuZCBvZiBvdXJcbiAgICAgICAgICAvLyBwYXRoIGNvbXBvbmVudFxuICAgICAgICAgIG1hdGNoZWRTbGFzaCA9IGZhbHNlO1xuICAgICAgICAgIGVuZCA9IGkgKyAxO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChlbmQgPT09IC0xKSByZXR1cm4gJyc7XG4gICAgICByZXR1cm4gcGF0aC5zbGljZShzdGFydCwgZW5kKTtcbiAgICB9XG4gIH0sXG5cbiAgZXh0bmFtZTogZnVuY3Rpb24gZXh0bmFtZShwYXRoKSB7XG4gICAgYXNzZXJ0UGF0aChwYXRoKTtcbiAgICB2YXIgc3RhcnREb3QgPSAtMTtcbiAgICB2YXIgc3RhcnRQYXJ0ID0gMDtcbiAgICB2YXIgZW5kID0gLTE7XG4gICAgdmFyIG1hdGNoZWRTbGFzaCA9IHRydWU7XG4gICAgLy8gVHJhY2sgdGhlIHN0YXRlIG9mIGNoYXJhY3RlcnMgKGlmIGFueSkgd2Ugc2VlIGJlZm9yZSBvdXIgZmlyc3QgZG90IGFuZFxuICAgIC8vIGFmdGVyIGFueSBwYXRoIHNlcGFyYXRvciB3ZSBmaW5kXG4gICAgdmFyIHByZURvdFN0YXRlID0gMDtcbiAgICBmb3IgKHZhciBpID0gcGF0aC5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgdmFyIGNvZGUgPSBwYXRoLmNoYXJDb2RlQXQoaSk7XG4gICAgICBpZiAoY29kZSA9PT0gNDcgLyovKi8pIHtcbiAgICAgICAgICAvLyBJZiB3ZSByZWFjaGVkIGEgcGF0aCBzZXBhcmF0b3IgdGhhdCB3YXMgbm90IHBhcnQgb2YgYSBzZXQgb2YgcGF0aFxuICAgICAgICAgIC8vIHNlcGFyYXRvcnMgYXQgdGhlIGVuZCBvZiB0aGUgc3RyaW5nLCBzdG9wIG5vd1xuICAgICAgICAgIGlmICghbWF0Y2hlZFNsYXNoKSB7XG4gICAgICAgICAgICBzdGFydFBhcnQgPSBpICsgMTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgaWYgKGVuZCA9PT0gLTEpIHtcbiAgICAgICAgLy8gV2Ugc2F3IHRoZSBmaXJzdCBub24tcGF0aCBzZXBhcmF0b3IsIG1hcmsgdGhpcyBhcyB0aGUgZW5kIG9mIG91clxuICAgICAgICAvLyBleHRlbnNpb25cbiAgICAgICAgbWF0Y2hlZFNsYXNoID0gZmFsc2U7XG4gICAgICAgIGVuZCA9IGkgKyAxO1xuICAgICAgfVxuICAgICAgaWYgKGNvZGUgPT09IDQ2IC8qLiovKSB7XG4gICAgICAgICAgLy8gSWYgdGhpcyBpcyBvdXIgZmlyc3QgZG90LCBtYXJrIGl0IGFzIHRoZSBzdGFydCBvZiBvdXIgZXh0ZW5zaW9uXG4gICAgICAgICAgaWYgKHN0YXJ0RG90ID09PSAtMSlcbiAgICAgICAgICAgIHN0YXJ0RG90ID0gaTtcbiAgICAgICAgICBlbHNlIGlmIChwcmVEb3RTdGF0ZSAhPT0gMSlcbiAgICAgICAgICAgIHByZURvdFN0YXRlID0gMTtcbiAgICAgIH0gZWxzZSBpZiAoc3RhcnREb3QgIT09IC0xKSB7XG4gICAgICAgIC8vIFdlIHNhdyBhIG5vbi1kb3QgYW5kIG5vbi1wYXRoIHNlcGFyYXRvciBiZWZvcmUgb3VyIGRvdCwgc28gd2Ugc2hvdWxkXG4gICAgICAgIC8vIGhhdmUgYSBnb29kIGNoYW5jZSBhdCBoYXZpbmcgYSBub24tZW1wdHkgZXh0ZW5zaW9uXG4gICAgICAgIHByZURvdFN0YXRlID0gLTE7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHN0YXJ0RG90ID09PSAtMSB8fCBlbmQgPT09IC0xIHx8XG4gICAgICAgIC8vIFdlIHNhdyBhIG5vbi1kb3QgY2hhcmFjdGVyIGltbWVkaWF0ZWx5IGJlZm9yZSB0aGUgZG90XG4gICAgICAgIHByZURvdFN0YXRlID09PSAwIHx8XG4gICAgICAgIC8vIFRoZSAocmlnaHQtbW9zdCkgdHJpbW1lZCBwYXRoIGNvbXBvbmVudCBpcyBleGFjdGx5ICcuLidcbiAgICAgICAgcHJlRG90U3RhdGUgPT09IDEgJiYgc3RhcnREb3QgPT09IGVuZCAtIDEgJiYgc3RhcnREb3QgPT09IHN0YXJ0UGFydCArIDEpIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG4gICAgcmV0dXJuIHBhdGguc2xpY2Uoc3RhcnREb3QsIGVuZCk7XG4gIH0sXG5cbiAgZm9ybWF0OiBmdW5jdGlvbiBmb3JtYXQocGF0aE9iamVjdCkge1xuICAgIGlmIChwYXRoT2JqZWN0ID09PSBudWxsIHx8IHR5cGVvZiBwYXRoT2JqZWN0ICE9PSAnb2JqZWN0Jykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwicGF0aE9iamVjdFwiIGFyZ3VtZW50IG11c3QgYmUgb2YgdHlwZSBPYmplY3QuIFJlY2VpdmVkIHR5cGUgJyArIHR5cGVvZiBwYXRoT2JqZWN0KTtcbiAgICB9XG4gICAgcmV0dXJuIF9mb3JtYXQoJy8nLCBwYXRoT2JqZWN0KTtcbiAgfSxcblxuICBwYXJzZTogZnVuY3Rpb24gcGFyc2UocGF0aCkge1xuICAgIGFzc2VydFBhdGgocGF0aCk7XG5cbiAgICB2YXIgcmV0ID0geyByb290OiAnJywgZGlyOiAnJywgYmFzZTogJycsIGV4dDogJycsIG5hbWU6ICcnIH07XG4gICAgaWYgKHBhdGgubGVuZ3RoID09PSAwKSByZXR1cm4gcmV0O1xuICAgIHZhciBjb2RlID0gcGF0aC5jaGFyQ29kZUF0KDApO1xuICAgIHZhciBpc0Fic29sdXRlID0gY29kZSA9PT0gNDcgLyovKi87XG4gICAgdmFyIHN0YXJ0O1xuICAgIGlmIChpc0Fic29sdXRlKSB7XG4gICAgICByZXQucm9vdCA9ICcvJztcbiAgICAgIHN0YXJ0ID0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RhcnQgPSAwO1xuICAgIH1cbiAgICB2YXIgc3RhcnREb3QgPSAtMTtcbiAgICB2YXIgc3RhcnRQYXJ0ID0gMDtcbiAgICB2YXIgZW5kID0gLTE7XG4gICAgdmFyIG1hdGNoZWRTbGFzaCA9IHRydWU7XG4gICAgdmFyIGkgPSBwYXRoLmxlbmd0aCAtIDE7XG5cbiAgICAvLyBUcmFjayB0aGUgc3RhdGUgb2YgY2hhcmFjdGVycyAoaWYgYW55KSB3ZSBzZWUgYmVmb3JlIG91ciBmaXJzdCBkb3QgYW5kXG4gICAgLy8gYWZ0ZXIgYW55IHBhdGggc2VwYXJhdG9yIHdlIGZpbmRcbiAgICB2YXIgcHJlRG90U3RhdGUgPSAwO1xuXG4gICAgLy8gR2V0IG5vbi1kaXIgaW5mb1xuICAgIGZvciAoOyBpID49IHN0YXJ0OyAtLWkpIHtcbiAgICAgIGNvZGUgPSBwYXRoLmNoYXJDb2RlQXQoaSk7XG4gICAgICBpZiAoY29kZSA9PT0gNDcgLyovKi8pIHtcbiAgICAgICAgICAvLyBJZiB3ZSByZWFjaGVkIGEgcGF0aCBzZXBhcmF0b3IgdGhhdCB3YXMgbm90IHBhcnQgb2YgYSBzZXQgb2YgcGF0aFxuICAgICAgICAgIC8vIHNlcGFyYXRvcnMgYXQgdGhlIGVuZCBvZiB0aGUgc3RyaW5nLCBzdG9wIG5vd1xuICAgICAgICAgIGlmICghbWF0Y2hlZFNsYXNoKSB7XG4gICAgICAgICAgICBzdGFydFBhcnQgPSBpICsgMTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgaWYgKGVuZCA9PT0gLTEpIHtcbiAgICAgICAgLy8gV2Ugc2F3IHRoZSBmaXJzdCBub24tcGF0aCBzZXBhcmF0b3IsIG1hcmsgdGhpcyBhcyB0aGUgZW5kIG9mIG91clxuICAgICAgICAvLyBleHRlbnNpb25cbiAgICAgICAgbWF0Y2hlZFNsYXNoID0gZmFsc2U7XG4gICAgICAgIGVuZCA9IGkgKyAxO1xuICAgICAgfVxuICAgICAgaWYgKGNvZGUgPT09IDQ2IC8qLiovKSB7XG4gICAgICAgICAgLy8gSWYgdGhpcyBpcyBvdXIgZmlyc3QgZG90LCBtYXJrIGl0IGFzIHRoZSBzdGFydCBvZiBvdXIgZXh0ZW5zaW9uXG4gICAgICAgICAgaWYgKHN0YXJ0RG90ID09PSAtMSkgc3RhcnREb3QgPSBpO2Vsc2UgaWYgKHByZURvdFN0YXRlICE9PSAxKSBwcmVEb3RTdGF0ZSA9IDE7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RhcnREb3QgIT09IC0xKSB7XG4gICAgICAgIC8vIFdlIHNhdyBhIG5vbi1kb3QgYW5kIG5vbi1wYXRoIHNlcGFyYXRvciBiZWZvcmUgb3VyIGRvdCwgc28gd2Ugc2hvdWxkXG4gICAgICAgIC8vIGhhdmUgYSBnb29kIGNoYW5jZSBhdCBoYXZpbmcgYSBub24tZW1wdHkgZXh0ZW5zaW9uXG4gICAgICAgIHByZURvdFN0YXRlID0gLTE7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHN0YXJ0RG90ID09PSAtMSB8fCBlbmQgPT09IC0xIHx8XG4gICAgLy8gV2Ugc2F3IGEgbm9uLWRvdCBjaGFyYWN0ZXIgaW1tZWRpYXRlbHkgYmVmb3JlIHRoZSBkb3RcbiAgICBwcmVEb3RTdGF0ZSA9PT0gMCB8fFxuICAgIC8vIFRoZSAocmlnaHQtbW9zdCkgdHJpbW1lZCBwYXRoIGNvbXBvbmVudCBpcyBleGFjdGx5ICcuLidcbiAgICBwcmVEb3RTdGF0ZSA9PT0gMSAmJiBzdGFydERvdCA9PT0gZW5kIC0gMSAmJiBzdGFydERvdCA9PT0gc3RhcnRQYXJ0ICsgMSkge1xuICAgICAgaWYgKGVuZCAhPT0gLTEpIHtcbiAgICAgICAgaWYgKHN0YXJ0UGFydCA9PT0gMCAmJiBpc0Fic29sdXRlKSByZXQuYmFzZSA9IHJldC5uYW1lID0gcGF0aC5zbGljZSgxLCBlbmQpO2Vsc2UgcmV0LmJhc2UgPSByZXQubmFtZSA9IHBhdGguc2xpY2Uoc3RhcnRQYXJ0LCBlbmQpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoc3RhcnRQYXJ0ID09PSAwICYmIGlzQWJzb2x1dGUpIHtcbiAgICAgICAgcmV0Lm5hbWUgPSBwYXRoLnNsaWNlKDEsIHN0YXJ0RG90KTtcbiAgICAgICAgcmV0LmJhc2UgPSBwYXRoLnNsaWNlKDEsIGVuZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXQubmFtZSA9IHBhdGguc2xpY2Uoc3RhcnRQYXJ0LCBzdGFydERvdCk7XG4gICAgICAgIHJldC5iYXNlID0gcGF0aC5zbGljZShzdGFydFBhcnQsIGVuZCk7XG4gICAgICB9XG4gICAgICByZXQuZXh0ID0gcGF0aC5zbGljZShzdGFydERvdCwgZW5kKTtcbiAgICB9XG5cbiAgICBpZiAoc3RhcnRQYXJ0ID4gMCkgcmV0LmRpciA9IHBhdGguc2xpY2UoMCwgc3RhcnRQYXJ0IC0gMSk7ZWxzZSBpZiAoaXNBYnNvbHV0ZSkgcmV0LmRpciA9ICcvJztcblxuICAgIHJldHVybiByZXQ7XG4gIH0sXG5cbiAgc2VwOiAnLycsXG4gIGRlbGltaXRlcjogJzonLFxuICB3aW4zMjogbnVsbCxcbiAgcG9zaXg6IG51bGxcbn07XG5cbnBvc2l4LnBvc2l4ID0gcG9zaXg7XG5cbm1vZHVsZS5leHBvcnRzID0gcG9zaXg7XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbl9fd2VicGFja19yZXF1aXJlX18ubiA9IChtb2R1bGUpID0+IHtcblx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG5cdFx0KCkgPT4gKG1vZHVsZVsnZGVmYXVsdCddKSA6XG5cdFx0KCkgPT4gKG1vZHVsZSk7XG5cdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsIHsgYTogZ2V0dGVyIH0pO1xuXHRyZXR1cm4gZ2V0dGVyO1xufTsiLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmcgPSAoZnVuY3Rpb24oKSB7XG5cdGlmICh0eXBlb2YgZ2xvYmFsVGhpcyA9PT0gJ29iamVjdCcpIHJldHVybiBnbG9iYWxUaGlzO1xuXHR0cnkge1xuXHRcdHJldHVybiB0aGlzIHx8IG5ldyBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0aWYgKHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnKSByZXR1cm4gd2luZG93O1xuXHR9XG59KSgpOyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCIvLyBUaGlzIHNjcmlwdCBpcyBpbmplY3RlZCBpbnRvIGV2ZXJ5IHBhZ2UuXG5pbXBvcnQgeyBpbnN0YWxsSG9vayB9IGZyb20gJ0BiYWNrL2hvb2snXG5pbXBvcnQgeyBpc0ZpcmVmb3ggfSBmcm9tICdAdnVlLWRldnRvb2xzL3NoYXJlZC11dGlscydcblxuLy8gaW5qZWN0IHRoZSBob29rXG5pZiAoZG9jdW1lbnQgaW5zdGFuY2VvZiBIVE1MRG9jdW1lbnQpIHtcbiAgY29uc3Qgc291cmNlID0gJzsoJyArIGluc3RhbGxIb29rLnRvU3RyaW5nKCkgKyAnKSh3aW5kb3cpJ1xuXG4gIGlmIChpc0ZpcmVmb3gpIHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tZXZhbFxuICAgIHdpbmRvdy5ldmFsKHNvdXJjZSkgLy8gaW4gRmlyZWZveCwgdGhpcyBldmFsdWF0ZXMgb24gdGhlIGNvbnRlbnQgd2luZG93XG4gIH0gZWxzZSB7XG4gICAgY29uc3Qgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0JylcbiAgICBzY3JpcHQudGV4dENvbnRlbnQgPSBzb3VyY2VcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuYXBwZW5kQ2hpbGQoc2NyaXB0KVxuICAgIHNjcmlwdC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHNjcmlwdClcbiAgfVxufVxuIl0sIm5hbWVzIjpbImluc3RhbGxIb29rIiwiaXNGaXJlZm94IiwiZG9jdW1lbnQiLCJIVE1MRG9jdW1lbnQiLCJzb3VyY2UiLCJ0b1N0cmluZyIsIndpbmRvdyIsImV2YWwiLCJzY3JpcHQiLCJjcmVhdGVFbGVtZW50IiwidGV4dENvbnRlbnQiLCJkb2N1bWVudEVsZW1lbnQiLCJhcHBlbmRDaGlsZCIsInBhcmVudE5vZGUiLCJyZW1vdmVDaGlsZCJdLCJzb3VyY2VSb290IjoiIn0=