/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "../app-backend-core/lib/toast.js":
/*!****************************************!*\
  !*** ../app-backend-core/lib/toast.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.installToast = void 0;

function installToast() {// @TODO
}

exports.installToast = installToast;

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
/*!*************************!*\
  !*** ./src/detector.js ***!
  \*************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _back_toast__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @back/toast */ "../app-backend-core/lib/toast.js");
/* harmony import */ var _vue_devtools_shared_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js");
/* harmony import */ var _vue_devtools_shared_utils__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_vue_devtools_shared_utils__WEBPACK_IMPORTED_MODULE_1__);


window.addEventListener('message', e => {
  if (e.source === window && e.data.vueDetected) {
    chrome.runtime.sendMessage(e.data);
  }
});

function detect(win) {
  setTimeout(() => {
    // Method 1: Check Nuxt.js
    const nuxtDetected = !!(window.__NUXT__ || window.$nuxt);

    if (nuxtDetected) {
      let Vue;

      if (window.$nuxt) {
        Vue = window.$nuxt.$root && window.$nuxt.$root.constructor;
      }

      win.postMessage({
        devtoolsEnabled:
        /* Vue 2 */
        Vue && Vue.config.devtools ||
        /* Vue 3.2.14+ */
        window.__VUE_DEVTOOLS_GLOBAL_HOOK__ && window.__VUE_DEVTOOLS_GLOBAL_HOOK__.enabled,
        vueDetected: true,
        nuxtDetected: true
      }, '*');
      return;
    } // Method 2: Check  Vue 3


    const vueDetected = !!window.__VUE__;

    if (vueDetected) {
      win.postMessage({
        devtoolsEnabled:
        /* Vue 3.2.14+ */
        window.__VUE_DEVTOOLS_GLOBAL_HOOK__ && window.__VUE_DEVTOOLS_GLOBAL_HOOK__.enabled,
        vueDetected: true
      }, '*');
      return;
    } // Method 3: Scan all elements inside document


    const all = document.querySelectorAll('*');
    let el;

    for (let i = 0; i < all.length; i++) {
      if (all[i].__vue__) {
        el = all[i];
        break;
      }
    }

    if (el) {
      let Vue = Object.getPrototypeOf(el.__vue__).constructor;

      while (Vue.super) {
        Vue = Vue.super;
      }

      win.postMessage({
        devtoolsEnabled: Vue.config.devtools,
        vueDetected: true
      }, '*');
    }
  }, 100);
} // inject the hook


if (document instanceof HTMLDocument) {
  installScript(detect);
  installScript(_back_toast__WEBPACK_IMPORTED_MODULE_0__.installToast);
}

function installScript(fn) {
  const source = ';(' + fn.toString() + ')(window)';

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV0ZWN0b3IuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxTQUFnQixZQUFoQixHQUE0QixDQUMxQjtBQUNEOztBQUZEOzs7Ozs7Ozs7Ozs7Ozs7O0FDQWEsNEJBQW9CO0FBQy9CLGFBQVcsRUFBRSxJQUFJLEdBQUosRUFEa0I7QUFFL0IsZUFBYSxFQUFHLE1BQU0sS0FGUztBQUcvQiwwQkFBd0IsRUFBRyxPQUFPLEVBQVA7QUFISSxDQUFwQjs7QUFNYixTQUFnQixjQUFoQixHQUE4QjtBQUM1QixTQUFPLDBCQUFrQixXQUF6QjtBQUNEOztBQUZEOztBQUlBLFNBQWdCLHdCQUFoQixDQUEwQyxRQUExQyxFQUFrRDtBQUNoRCxTQUFPLDBCQUFrQix3QkFBbEIsQ0FBMkMsUUFBM0MsQ0FBUDtBQUNEOztBQUZEOztBQUlBLFNBQWdCLGFBQWhCLENBQStCLEtBQS9CLEVBQW9DO0FBQ2xDLFNBQU8sMEJBQWtCLGFBQWxCLENBQWdDLEtBQWhDLENBQVA7QUFDRDs7QUFGRCx1Q0FJQTs7QUFDQSxTQUFnQixzQkFBaEIsQ0FBd0MsTUFBeEMsRUFBOEM7QUFDNUMsU0FBTztBQUNMLFdBQU8sRUFBRTtBQUNQLFVBQUksRUFBRSxRQURDO0FBRVAsYUFBTyxFQUFFLFdBRkY7QUFHUCxXQUFLLEVBQUU7QUFDTCxlQUFPLEVBQUUsTUFBTSxDQUFDLE9BRFg7QUFFTCxvQkFBWSxFQUFFLE1BQU0sQ0FBQztBQUZoQixPQUhBO0FBT1AsWUFBTSxFQUFFO0FBQ04sZ0JBQVEsRUFBRTtBQURKO0FBUEQ7QUFESixHQUFQO0FBYUQ7O0FBZEQseURBZ0JBOztBQUNBLFNBQWdCLHFCQUFoQixDQUF1QyxLQUF2QyxFQUE0QztBQUMxQyxTQUFPO0FBQ0wsV0FBTyxFQUFFO0FBQ1AsVUFBSSxFQUFFLE9BREM7QUFFUCxhQUFPLEVBQUUsT0FGRjtBQUdQLFdBQUssRUFBRTtBQUNMLGFBQUssRUFBRSxLQUFLLENBQUMsS0FEUjtBQUVMLGVBQU8sRUFBRSxpQkFBaUIsQ0FBQyxLQUFEO0FBRnJCLE9BSEE7QUFPUCxZQUFNLEVBQUU7QUFDTixnQkFBUSxFQUFFO0FBREo7QUFQRDtBQURKLEdBQVA7QUFhRDs7QUFkRCx1REFnQkE7O0FBQ0EsU0FBZ0IsaUJBQWhCLENBQW1DLEtBQW5DLEVBQXdDO0FBQ3RDLFFBQU0sT0FBTyxHQUFHLEVBQWhCO0FBRUEsUUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLE9BQU4sSUFBaUIsRUFBckM7QUFDQSxRQUFNLElBQUksR0FBRyxNQUFNLENBQUMsSUFBUCxDQUFZLFdBQVosQ0FBYjs7QUFDQSxPQUFLLElBQUksQ0FBQyxHQUFHLENBQWIsRUFBZ0IsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUF6QixFQUFpQyxDQUFDLEVBQWxDLEVBQXNDO0FBQ3BDLFVBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFELENBQWhCO0FBQ0EsVUFBTSxDQUFDLGNBQVAsQ0FBc0IsT0FBdEIsRUFBK0IsR0FBL0IsRUFBb0M7QUFDbEMsZ0JBQVUsRUFBRSxJQURzQjtBQUVsQyxTQUFHLEVBQUUsTUFBSztBQUNSLFlBQUk7QUFDRixpQkFBTyxXQUFXLENBQUMsR0FBRCxDQUFsQjtBQUNELFNBRkQsQ0FFRSxPQUFPLENBQVAsRUFBVTtBQUNWLGlCQUFPLENBQVA7QUFDRDtBQUNGO0FBUmlDLEtBQXBDO0FBVUQ7O0FBRUQsU0FBTyxPQUFQO0FBQ0Q7O0FBcEJEOzs7Ozs7Ozs7Ozs7Ozs7OztBQ3JEQTs7QUFFQSxNQUFNLGNBQWMsR0FBRyxHQUF2Qjs7QUFFQSxNQUFhLE1BQWIsU0FBNEIscUJBQTVCLENBQXdDO0FBU3RDLGNBQWEsSUFBYixFQUFpQjtBQUNmO0FBQ0EsU0FBSyxlQUFMLENBQXFCLFFBQXJCO0FBQ0EsU0FBSyxJQUFMLEdBQVksSUFBWjtBQUNBLFFBQUksQ0FBQyxNQUFMLENBQVksUUFBUSxJQUFHO0FBQ3JCLFVBQUksS0FBSyxDQUFDLE9BQU4sQ0FBYyxRQUFkLENBQUosRUFBNkI7QUFDM0IsZ0JBQVEsQ0FBQyxPQUFULENBQWlCLE9BQU8sSUFBSSxLQUFLLEtBQUwsQ0FBVyxPQUFYLENBQTVCO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsYUFBSyxLQUFMLENBQVcsUUFBWDtBQUNEO0FBQ0YsS0FORDtBQU9BLFNBQUssY0FBTCxHQUFzQixFQUF0QjtBQUNBLFNBQUssYUFBTCxHQUFxQixFQUFyQjtBQUNBLFNBQUssZUFBTCxHQUF1QixFQUF2QjtBQUNBLFNBQUssUUFBTCxHQUFnQixLQUFoQjtBQUNBLFNBQUssS0FBTCxHQUFhLElBQWI7QUFDRDs7QUFFRCxNQUFJLENBQUUsS0FBRixFQUFpQixPQUFqQixFQUE4QjtBQUNoQyxRQUFJLEtBQUssQ0FBQyxPQUFOLENBQWMsT0FBZCxDQUFKLEVBQTRCO0FBQzFCLFlBQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxNQUFSLEdBQWlCLENBQW5DO0FBQ0EsYUFBTyxDQUFDLE9BQVIsQ0FBZ0IsQ0FBQyxLQUFELEVBQVEsS0FBUixLQUFpQjtBQUMvQixhQUFLLEtBQUwsQ0FBVztBQUNULGVBRFM7QUFFVCxnQkFBTSxFQUFFLEtBRkM7QUFHVCxjQUFJLEVBQUUsS0FBSyxLQUFLO0FBSFAsU0FBWDtBQUtELE9BTkQ7O0FBT0EsV0FBSyxNQUFMO0FBQ0QsS0FWRCxNQVVPLElBQUksS0FBSyxLQUFMLEtBQWUsSUFBbkIsRUFBeUI7QUFDOUIsV0FBSyxLQUFMLENBQVcsQ0FBQztBQUFFLGFBQUY7QUFBUztBQUFULE9BQUQsQ0FBWDs7QUFDQSxXQUFLLEtBQUwsR0FBYSxJQUFJLENBQUMsR0FBTCxFQUFiO0FBQ0QsS0FITSxNQUdBO0FBQ0wsV0FBSyxjQUFMLENBQW9CLElBQXBCLENBQXlCO0FBQ3ZCLGFBRHVCO0FBRXZCO0FBRnVCLE9BQXpCOztBQUtBLFlBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFMLEVBQVo7O0FBQ0EsVUFBSSxHQUFHLEdBQUcsS0FBSyxLQUFYLEdBQW1CLGNBQXZCLEVBQXVDO0FBQ3JDLGFBQUssTUFBTDtBQUNELE9BRkQsTUFFTztBQUNMLGFBQUssTUFBTCxHQUFjLFVBQVUsQ0FBQyxNQUFNLEtBQUssTUFBTCxFQUFQLEVBQXNCLGNBQXRCLENBQXhCO0FBQ0Q7QUFDRjtBQUNGO0FBRUQ7O0FBRUc7OztBQUVILEtBQUcsQ0FBRSxPQUFGLEVBQWlCO0FBQ2xCLFNBQUssSUFBTCxDQUFVLEtBQVYsRUFBaUIsT0FBakI7QUFDRDs7QUFFRCxRQUFNO0FBQ0osUUFBSSxLQUFLLGNBQUwsQ0FBb0IsTUFBeEIsRUFBZ0MsS0FBSyxLQUFMLENBQVcsS0FBSyxjQUFoQjtBQUNoQyxnQkFBWSxDQUFDLEtBQUssTUFBTixDQUFaO0FBQ0EsU0FBSyxjQUFMLEdBQXNCLEVBQXRCO0FBQ0EsU0FBSyxLQUFMLEdBQWEsSUFBYjtBQUNELEdBckVxQyxDQXVFdEM7OztBQUNBLE9BQUssQ0FBRSxPQUFGLEVBQVM7QUFDWixRQUFJLE9BQU8sT0FBUCxLQUFtQixRQUF2QixFQUFpQztBQUMvQixXQUFLLElBQUwsQ0FBVSxPQUFWO0FBQ0QsS0FGRCxNQUVPLElBQUksT0FBTyxDQUFDLE1BQVosRUFBb0I7QUFDekIsV0FBSyxlQUFMLENBQXFCLElBQXJCLENBQTBCLE9BQU8sQ0FBQyxNQUFsQzs7QUFDQSxVQUFJLE9BQU8sQ0FBQyxJQUFaLEVBQWtCO0FBQ2hCLGFBQUssSUFBTCxDQUFVLE9BQU8sQ0FBQyxLQUFsQixFQUF5QixLQUFLLGVBQTlCO0FBQ0EsYUFBSyxlQUFMLEdBQXVCLEVBQXZCO0FBQ0Q7QUFDRixLQU5NLE1BTUEsSUFBSSxPQUFPLENBQUMsS0FBWixFQUFtQjtBQUN4QixXQUFLLElBQUwsQ0FBVSxPQUFPLENBQUMsS0FBbEIsRUFBeUIsT0FBTyxDQUFDLE9BQWpDO0FBQ0Q7QUFDRixHQXBGcUMsQ0FzRnRDOzs7QUFDQSxPQUFLLENBQUUsUUFBRixFQUFVO0FBQ2IsU0FBSyxhQUFMLENBQW1CLElBQW5CLENBQXdCLFFBQXhCOztBQUNBLFNBQUssU0FBTDtBQUNEOztBQUVELFdBQVM7QUFDUCxRQUFJLENBQUMsS0FBSyxhQUFMLENBQW1CLE1BQXBCLElBQThCLEtBQUssUUFBdkMsRUFBaUQ7QUFDakQsU0FBSyxRQUFMLEdBQWdCLElBQWhCOztBQUNBLFVBQU0sUUFBUSxHQUFHLEtBQUssYUFBTCxDQUFtQixLQUFuQixFQUFqQjs7QUFDQSxRQUFJO0FBQ0YsV0FBSyxJQUFMLENBQVUsSUFBVixDQUFlLFFBQWY7QUFDRCxLQUZELENBRUUsT0FBTyxHQUFQLEVBQVk7QUFDWixVQUFJLEdBQUcsQ0FBQyxPQUFKLEtBQWdCLGlEQUFwQixFQUF1RTtBQUNyRSxhQUFLLGFBQUwsQ0FBbUIsTUFBbkIsQ0FBMEIsQ0FBMUIsRUFBNkIsQ0FBN0IsRUFBZ0MsUUFBUSxDQUFDLEdBQVQsQ0FBYSxPQUFPLElBQUksQ0FBQyxPQUFELENBQXhCLENBQWhDO0FBQ0Q7QUFDRjs7QUFDRCxTQUFLLFFBQUwsR0FBZ0IsS0FBaEI7QUFDQSx5QkFBcUIsQ0FBQyxNQUFNLEtBQUssU0FBTCxFQUFQLENBQXJCO0FBQ0Q7O0FBekdxQzs7QUFBeEM7Ozs7Ozs7Ozs7Ozs7Ozs7QUNKQSxJQUFZLFdBQVo7O0FBQUEsV0FBWSxXQUFaLEVBQXVCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0QsQ0FMRCxFQUFZLFdBQVcsR0FBWCw4Q0FBVyxFQUFYLENBQVo7O0FBT0EsSUFBWSxZQUFaOztBQUFBLFdBQVksWUFBWixFQUF3QjtBQUN0QjtBQUNBO0FBQ0E7QUFDQTs7QUFDQTtBQUNBOztBQUNBO0FBQ0E7O0FBQ0E7QUFDQTs7QUFDQTtBQUNBLHdDQVpzQixDQWN0Qjs7QUFDQTs7QUFDQTtBQUNBOztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkRBdEJzQixDQXdCdEI7O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2RUE1Q3NCLENBOEN0Qjs7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpRUEzRHNCLENBNkR0Qjs7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnR0FqRXNCLENBbUV0Qjs7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyRkE3RXNCLENBK0V0Qjs7QUFDQTtBQUNELENBakZELEVBQVksWUFBWSxHQUFaLGdEQUFZLEVBQVosQ0FBWjs7QUFtRkEsSUFBWSxtQkFBWjs7QUFBQSxXQUFZLG1CQUFaLEVBQStCO0FBQzdCO0FBQ0E7QUFDRCxDQUhELEVBQVksbUJBQW1CLEdBQW5CLDhEQUFtQixFQUFuQixDQUFaOztBQUtBLElBQVksVUFBWjs7QUFBQSxXQUFZLFVBQVosRUFBc0I7QUFDcEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVHOztBQUNIO0FBQ0QsQ0F6QkQsRUFBWSxVQUFVLEdBQVYsNENBQVUsRUFBVixDQUFaOzs7Ozs7Ozs7Ozs7Ozs7OztBQzdGQSxNQUFhLFdBQWIsQ0FBd0I7QUFDdEIsS0FBRyxDQUFFLE1BQUYsRUFBVSxJQUFWLEVBQWdCLEtBQWhCLEVBQXVCLEVBQUUsR0FBRyxJQUE1QixFQUFnQztBQUNqQyxVQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsT0FBTixDQUFjLElBQWQsSUFBc0IsSUFBdEIsR0FBNkIsSUFBSSxDQUFDLEtBQUwsQ0FBVyxHQUFYLENBQTlDOztBQUNBLFdBQU8sUUFBUSxDQUFDLE1BQVQsR0FBa0IsQ0FBekIsRUFBNEI7QUFDMUIsWUFBTSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBVCxFQUFELENBQWY7O0FBQ0EsVUFBSSxLQUFLLEtBQUwsQ0FBVyxNQUFYLENBQUosRUFBd0I7QUFDdEIsY0FBTSxHQUFHLEtBQUssV0FBTCxDQUFpQixNQUFqQixDQUFUO0FBQ0Q7QUFDRjs7QUFDRCxVQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsQ0FBRCxDQUF0Qjs7QUFDQSxRQUFJLEVBQUosRUFBUTtBQUNOLFFBQUUsQ0FBQyxNQUFELEVBQVMsS0FBVCxFQUFnQixLQUFoQixDQUFGO0FBQ0QsS0FGRCxNQUVPLElBQUksS0FBSyxLQUFMLENBQVcsTUFBTSxDQUFDLEtBQUQsQ0FBakIsQ0FBSixFQUErQjtBQUNwQyxXQUFLLFdBQUwsQ0FBaUIsTUFBTSxDQUFDLEtBQUQsQ0FBdkIsRUFBZ0MsS0FBaEM7QUFDRCxLQUZNLE1BRUE7QUFDTCxZQUFNLENBQUMsS0FBRCxDQUFOLEdBQWdCLEtBQWhCO0FBQ0Q7QUFDRjs7QUFFRCxLQUFHLENBQUUsTUFBRixFQUFVLElBQVYsRUFBYztBQUNmLFVBQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxPQUFOLENBQWMsSUFBZCxJQUFzQixJQUF0QixHQUE2QixJQUFJLENBQUMsS0FBTCxDQUFXLEdBQVgsQ0FBOUM7O0FBQ0EsU0FBSyxJQUFJLENBQUMsR0FBRyxDQUFiLEVBQWdCLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBN0IsRUFBcUMsQ0FBQyxFQUF0QyxFQUEwQztBQUN4QyxZQUFNLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFELENBQVQsQ0FBZjs7QUFDQSxVQUFJLEtBQUssS0FBTCxDQUFXLE1BQVgsQ0FBSixFQUF3QjtBQUN0QixjQUFNLEdBQUcsS0FBSyxXQUFMLENBQWlCLE1BQWpCLENBQVQ7QUFDRDs7QUFDRCxVQUFJLENBQUMsTUFBTCxFQUFhO0FBQ1gsZUFBTyxTQUFQO0FBQ0Q7QUFDRjs7QUFDRCxXQUFPLE1BQVA7QUFDRDs7QUFFRCxLQUFHLENBQUUsTUFBRixFQUFVLElBQVYsRUFBZ0IsTUFBTSxHQUFHLEtBQXpCLEVBQThCO0FBQy9CLFFBQUksT0FBTyxNQUFQLEtBQWtCLFdBQXRCLEVBQW1DO0FBQ2pDLGFBQU8sS0FBUDtBQUNEOztBQUVELFVBQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxPQUFOLENBQWMsSUFBZCxJQUFzQixJQUFJLENBQUMsS0FBTCxFQUF0QixHQUFxQyxJQUFJLENBQUMsS0FBTCxDQUFXLEdBQVgsQ0FBdEQ7QUFDQSxVQUFNLElBQUksR0FBRyxDQUFDLE1BQUQsR0FBVSxDQUFWLEdBQWMsQ0FBM0I7O0FBQ0EsV0FBTyxNQUFNLElBQUksUUFBUSxDQUFDLE1BQVQsR0FBa0IsSUFBbkMsRUFBeUM7QUFDdkMsWUFBTSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBVCxFQUFELENBQWY7O0FBQ0EsVUFBSSxLQUFLLEtBQUwsQ0FBVyxNQUFYLENBQUosRUFBd0I7QUFDdEIsY0FBTSxHQUFHLEtBQUssV0FBTCxDQUFpQixNQUFqQixDQUFUO0FBQ0Q7QUFDRjs7QUFDRCxXQUFPLE1BQU0sSUFBSSxJQUFWLElBQWtCLE1BQU0sQ0FBQyxTQUFQLENBQWlCLGNBQWpCLENBQWdDLElBQWhDLENBQXFDLE1BQXJDLEVBQTZDLFFBQVEsQ0FBQyxDQUFELENBQXJELENBQXpCO0FBQ0Q7O0FBRUQsMEJBQXdCLENBQUUsS0FBRixFQUF5QjtBQUMvQyxXQUFPLENBQUMsR0FBRCxFQUFNLEtBQU4sRUFBYSxLQUFiLEtBQXNCO0FBQzNCLFVBQUksS0FBSyxDQUFDLE1BQU4sSUFBZ0IsS0FBSyxDQUFDLE1BQTFCLEVBQWtDO0FBQ2hDLFlBQUksS0FBSyxDQUFDLE9BQU4sQ0FBYyxHQUFkLENBQUosRUFBd0I7QUFDdEIsYUFBRyxDQUFDLE1BQUosQ0FBVyxLQUFYLEVBQWtCLENBQWxCO0FBQ0QsU0FGRCxNQUVPO0FBQ0wsaUJBQU8sR0FBRyxDQUFDLEtBQUQsQ0FBVjtBQUNEO0FBQ0Y7O0FBQ0QsVUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFYLEVBQW1CO0FBQ2pCLGNBQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTixJQUFnQixLQUFqQixDQUFsQjs7QUFDQSxZQUFJLEtBQUssS0FBTCxDQUFXLE1BQVgsQ0FBSixFQUF3QjtBQUN0QixlQUFLLFdBQUwsQ0FBaUIsTUFBakIsRUFBeUIsS0FBekI7QUFDRCxTQUZELE1BRU87QUFDTCxhQUFHLENBQUMsS0FBSyxDQUFDLE1BQU4sSUFBZ0IsS0FBakIsQ0FBSCxHQUE2QixLQUE3QjtBQUNEO0FBQ0Y7QUFDRixLQWhCRDtBQWlCRDs7QUFFRCxPQUFLLENBQUUsR0FBRixFQUFVO0FBQ2I7QUFDQSxXQUFPLEtBQVA7QUFDRDs7QUFFRCxhQUFXLENBQUUsR0FBRixFQUFXLEtBQVgsRUFBcUIsQ0FDOUI7QUFDRDs7QUFFRCxhQUFXLENBQUUsR0FBRixFQUFVO0FBQ25CO0FBQ0EsV0FBTyxHQUFQO0FBQ0Q7O0FBakZxQjs7QUFBeEI7Ozs7Ozs7Ozs7Ozs7Ozs7QUNGYSxvQkFBWSxPQUFPLFNBQVAsS0FBcUIsV0FBakM7QUFDQSxpQkFBYyxvQkFDdkIsTUFEdUIsR0FFdkIsT0FBTyxxQkFBUCxLQUFrQixXQUFsQixHQUNFLHFCQURGLEdBRUUsRUFKTztBQUtBLG1CQUFXLE9BQU8sZUFBTyxNQUFkLEtBQXlCLFdBQXpCLElBQXdDLENBQUMsQ0FBQyxlQUFPLE1BQVAsQ0FBYyxRQUFuRTtBQUNBLG9CQUFZLHFCQUFhLFNBQVMsQ0FBQyxTQUFWLENBQW9CLE9BQXBCLENBQTRCLFNBQTVCLElBQXlDLENBQUMsQ0FBbkU7QUFDQSxvQkFBWSxxQkFBYSxTQUFTLENBQUMsUUFBVixDQUFtQixPQUFuQixDQUEyQixLQUEzQixNQUFzQyxDQUEvRDtBQUNBLGdCQUFRLHFCQUFhLFNBQVMsQ0FBQyxRQUFWLEtBQXVCLFVBQTVDO0FBQ0Esa0JBQVUscUJBQWEsU0FBUyxDQUFDLFFBQVYsQ0FBbUIsT0FBbkIsQ0FBMkIsT0FBM0IsTUFBd0MsQ0FBL0Q7QUFDQSxlQUFPO0FBQ2xCLE1BQUksRUFBRSxnQkFBUSxTQUFSLEdBQW9CLE1BRFI7QUFFbEIsT0FBSyxFQUFFLE9BRlc7QUFHbEIsS0FBRyxFQUFFLGdCQUFRLFNBQVIsR0FBb0IsS0FIUDtBQUlsQixLQUFHLEVBQUUsS0FKYTtBQUtsQixPQUFLLEVBQUUsT0FMVztBQU1sQixLQUFHLEVBQUU7QUFOYSxDQUFQOztBQVNiLFNBQWdCLE9BQWhCLENBQXlCLEdBQXpCLEVBQTRCO0FBQzFCLE1BQUksR0FBRyxDQUFDLFNBQUosQ0FBYyxjQUFkLENBQTZCLFdBQTdCLENBQUosRUFBK0M7QUFFL0MsUUFBTSxDQUFDLGdCQUFQLENBQXdCLEdBQUcsQ0FBQyxTQUE1QixFQUF1QztBQUNyQyxhQUFTLEVBQUU7QUFBRSxTQUFHLEVBQUUsTUFBTTtBQUFiLEtBRDBCO0FBRXJDLGNBQVUsRUFBRTtBQUFFLFNBQUcsRUFBRSxNQUFNO0FBQWIsS0FGeUI7QUFHckMsY0FBVSxFQUFFO0FBQUUsU0FBRyxFQUFFLE1BQU07QUFBYixLQUh5QjtBQUlyQyxVQUFNLEVBQUU7QUFBRSxTQUFHLEVBQUUsTUFBTTtBQUFiLEtBSjZCO0FBS3JDLFlBQVEsRUFBRTtBQUFFLFNBQUcsRUFBRSxNQUFNO0FBQWIsS0FMMkI7QUFNckMsU0FBSyxFQUFFO0FBQUUsU0FBRyxFQUFFLE1BQU07QUFBYjtBQU44QixHQUF2QztBQVNBLE1BQUksaUJBQUosRUFBZSxRQUFRLENBQUMsSUFBVCxDQUFjLFNBQWQsQ0FBd0IsR0FBeEIsQ0FBNEIsa0JBQTVCO0FBQ2YsTUFBSSxhQUFKLEVBQVcsUUFBUSxDQUFDLElBQVQsQ0FBYyxTQUFkLENBQXdCLEdBQXhCLENBQTRCLGNBQTVCO0FBQ1gsTUFBSSxlQUFKLEVBQWEsUUFBUSxDQUFDLElBQVQsQ0FBYyxTQUFkLENBQXdCLEdBQXhCLENBQTRCLGdCQUE1QjtBQUNkOztBQWZEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNwQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDWEE7O0FBRUEsSUFBWSxnQkFBWjs7QUFBQSxXQUFZLGdCQUFaLEVBQTRCO0FBQzFCO0FBQ0E7QUFDQTtBQUNBO0FBQ0QsQ0FMRCxFQUFZLGdCQUFnQixHQUFoQix3REFBZ0IsRUFBaEIsQ0FBWjs7QUFPQSxTQUFnQixtQkFBaEIsQ0FBcUMsUUFBckMsRUFBdUQsVUFBdkQsRUFBbUY7QUFDakYsUUFBTSxNQUFNLEdBQUcseUJBQVcsaUJBQVgsQ0FBNkIsR0FBRyxRQUFRLElBQUksVUFBVSxFQUF0RCxDQUFmO0FBQ0EsTUFBSSxNQUFNLElBQUksSUFBZCxFQUFvQixPQUFPLElBQVA7QUFDcEIsU0FBTyxDQUFDLENBQUMsTUFBVDtBQUNEOztBQUpEOztBQU1BLFNBQWdCLG1CQUFoQixDQUFxQyxRQUFyQyxFQUF1RCxVQUF2RCxFQUFxRixNQUFyRixFQUFvRztBQUNsRywyQkFBVyxpQkFBWCxHQUErQixFQUM3QixHQUFHLHlCQUFXLGlCQURlO0FBRTdCLEtBQUMsR0FBRyxRQUFRLElBQUksVUFBVSxFQUExQixHQUErQjtBQUZGLEdBQS9CO0FBSUQ7O0FBTEQ7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDZkE7O0FBR0EsU0FBZ0IsaUJBQWhCLENBQWdGLFFBQWhGLEVBQWtHLGVBQWxHLEVBQTZIOzs7QUFDM0gsU0FBTyxFQUNMLElBQUcsZUFBZSxTQUFmLG1CQUFlLFdBQWYscUJBQW1CLEVBQXRCLENBREs7QUFFTCxRQUFHLCtCQUFXLGNBQVgsQ0FBMEIsUUFBMUIsT0FBbUMsSUFBbkMsSUFBbUMsYUFBbkMsR0FBbUMsRUFBbkMsR0FBdUMsRUFBMUM7QUFGSyxHQUFQO0FBSUQ7O0FBTEQ7O0FBT0EsU0FBZ0IsaUJBQWhCLENBQWdGLFFBQWhGLEVBQWtHLFFBQWxHLEVBQXFIO0FBQ25ILDJCQUFXLGNBQVgsR0FBNEIsRUFDMUIsR0FBRyx5QkFBVyxjQURZO0FBRTFCLEtBQUMsUUFBRCxHQUFZO0FBRmMsR0FBNUI7QUFJRDs7QUFMRDs7QUFPQSxTQUFnQix3QkFBaEIsQ0FBdUYsTUFBdkYsRUFBaUk7QUFDL0gsUUFBTSxNQUFNLEdBQXdCLEVBQXBDOztBQUNBLE1BQUksTUFBSixFQUFZO0FBQ1YsU0FBSyxNQUFNLEVBQVgsSUFBaUIsTUFBakIsRUFBeUI7QUFDdkIsWUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLEVBQUQsQ0FBbkI7QUFDQSxZQUFNLENBQUMsRUFBRCxDQUFOLEdBQWEsSUFBSSxDQUFDLFlBQWxCO0FBQ0Q7QUFDRjs7QUFDRCxTQUFPLE1BQVA7QUFDRDs7QUFURDs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNqQkE7O0FBRUEsOEVBRUE7OztBQUNBLE1BQU0sa0JBQWtCLEdBQUc7QUFDekIsa0JBQWdCLEVBQUUsR0FETztBQUV6QixvQkFBa0IsRUFBRSxPQUZLO0FBR3pCLE9BQUssRUFBRSxNQUhrQjtBQUl6QixnQkFBYyxFQUFFLEtBSlM7QUFLekIsWUFBVSxFQUFFLFNBTGE7QUFNekIsWUFBVSxFQUFFLElBTmE7QUFPekIseUJBQXVCLEVBQUUsRUFQQTtBQVF6Qix5QkFBdUIsRUFBRSxFQVJBO0FBU3pCLGlCQUFlLEVBQUUsS0FUUTtBQVV6Qix3QkFBc0IsRUFBRSxJQVZDO0FBV3pCLDhCQUE0QixFQUFFLElBWEw7QUFZekIsZUFBYSxFQUFFLEtBWlU7QUFhekIsYUFBVyxFQUFFLElBYlk7QUFjekIsZ0JBQWMsRUFBRSxLQWRTO0FBZXpCLGNBQVksRUFBRSxLQWZXO0FBZ0J6QiwwQkFBd0IsRUFBRSxJQWhCRDtBQWlCekIsbUJBQWlCLEVBQUUsSUFqQk07QUFrQnpCLGtCQUFnQixFQUFFLElBbEJPO0FBbUJ6QixxQkFBbUIsRUFBRSxJQW5CSTtBQW9CekIsbUJBQWlCLEVBQUUsV0FwQk07QUFxQnpCLG1CQUFpQixFQUFFLEVBckJNO0FBc0J6QixnQkFBYyxFQUFFLEVBdEJTO0FBdUJ6QixZQUFVLEVBQUUsRUF2QmE7QUF3QnpCLFdBQVMsRUFBRTtBQXhCYyxDQUEzQjtBQTJCQSxNQUFNLFNBQVMsR0FBRyxDQUNoQixvQkFEZ0IsRUFFaEIsT0FGZ0IsRUFHaEIsZ0JBSGdCLEVBSWhCLFlBSmdCLEVBS2hCLGVBTGdCLEVBTWhCLGFBTmdCLEVBT2hCLGdCQVBnQixFQVFoQixjQVJnQixFQVNoQiwwQkFUZ0IsRUFVaEIsWUFWZ0IsRUFXaEIsbUJBWGdCLEVBWWhCLGtCQVpnQixFQWFoQixxQkFiZ0IsRUFjaEIsbUJBZGdCLEVBZWhCLG1CQWZnQixFQWdCaEIsZ0JBaEJnQixFQWlCaEIsOEJBakJnQixFQWtCaEIsd0JBbEJnQixFQW1CaEIsV0FuQmdCLENBQWxCO0FBc0JBLE1BQU0sY0FBYyxHQUFHLGVBQXZCLEVBRUE7O0FBRUEsSUFBSSxNQUFKLEVBQ0E7QUFDQTs7QUFDQSxJQUFJLE9BQU8sR0FBRyxLQUFkO0FBQ0EsSUFBSSxJQUFKO0FBRUEsSUFBSSxpQkFBSjtBQUNBLElBQUksY0FBYyxHQUFHLENBQXJCO0FBUUEsTUFBTSxPQUFPLEdBQUcsRUFBaEI7O0FBRUEsU0FBZ0IsY0FBaEIsQ0FBZ0MsTUFBaEMsRUFBd0Q7QUFDdEQsU0FBTyxJQUFJLE9BQUosQ0FBYSxPQUFELElBQVk7QUFDN0I7QUFDQSxVQUFNLEdBQUcsTUFBTSxDQUFDLE1BQWhCO0FBQ0EsV0FBTyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBbkI7O0FBRUEsUUFBSSxPQUFKLEVBQWE7QUFDWCxVQUFJLElBQUosRUFBMkM7QUFDekM7QUFDQSxlQUFPLENBQUMsR0FBUixDQUFZLDBDQUFaO0FBQ0QsT0FKVSxDQUtYOzs7QUFDQSxlQUFTLENBQUMsT0FBVixDQUFrQixHQUFHLElBQUc7QUFDdEIsY0FBTSxLQUFLLEdBQUcsMEJBQVcsZ0JBQWdCLGNBQWMsZ0JBQWdCLEdBQUcsRUFBNUQsQ0FBZDs7QUFDQSxZQUFJLEtBQUssS0FBSyxJQUFkLEVBQW9CO0FBQ2xCLDRCQUFrQixDQUFDLEdBQUQsQ0FBbEIsR0FBMEIsS0FBMUI7QUFDRDtBQUNGLE9BTEQ7QUFNQSxZQUFNLENBQUMsRUFBUCxDQUFVLGtCQUFWLEVBQThCLE1BQUs7QUFDakM7QUFDQSxjQUFNLENBQUMsSUFBUCxDQUFZLGtCQUFaLEVBQWdDLE9BQWhDLENBQXdDLEdBQUcsSUFBRztBQUM1QyxtQkFBUyxDQUFDLEdBQUQsRUFBTSxrQkFBa0IsQ0FBQyxHQUFELENBQXhCLENBQVQ7QUFDRCxTQUZEO0FBR0EsY0FBTSxDQUFDLElBQVAsQ0FBWSwyQkFBWjtBQUNELE9BTkQ7QUFPQSxZQUFNLENBQUMsRUFBUCxDQUFVLDJCQUFWLEVBQXVDLE1BQUs7QUFDMUMsWUFBSSxJQUFKLEVBQTJDO0FBQ3pDO0FBQ0EsaUJBQU8sQ0FBQyxHQUFSLENBQVksb0NBQVo7QUFDRDs7QUFDRCxxQkFBYSxDQUFDLGlCQUFELENBQWI7QUFDQSxlQUFPO0FBQ1IsT0FQRDtBQVNBLFlBQU0sQ0FBQyxJQUFQLENBQVksaUNBQVosRUE1QlcsQ0E2Qlg7O0FBQ0EsWUFBTSxDQUFDLEVBQVAsQ0FBVSxpQ0FBVixFQUE2QyxNQUFLO0FBQ2hELGNBQU0sQ0FBQyxJQUFQLENBQVksaUNBQVo7QUFDRCxPQUZEO0FBSUEsb0JBQWMsR0FBRyxDQUFqQjtBQUNBLG1CQUFhLENBQUMsaUJBQUQsQ0FBYjtBQUNBLHVCQUFpQixHQUFHLFdBQVcsQ0FBQyxNQUFLO0FBQ25DLFlBQUksSUFBSixFQUEyQztBQUN6QztBQUNBLGlCQUFPLENBQUMsR0FBUixDQUFZLHVDQUFaO0FBQ0Q7O0FBQ0QsY0FBTSxDQUFDLElBQVAsQ0FBWSxpQ0FBWjtBQUNBLHNCQUFjOztBQUNkLFlBQUksY0FBYyxHQUFHLEVBQXJCLEVBQXlCO0FBQ3ZCLHVCQUFhLENBQUMsaUJBQUQsQ0FBYjtBQUNBLGlCQUFPLENBQUMsS0FBUixDQUFjLGtDQUFkO0FBQ0Q7QUFDRixPQVg4QixFQVc1QixJQVg0QixDQUEvQjtBQVlELEtBaERELE1BZ0RPO0FBQ0wsVUFBSSxJQUFKLEVBQTJDO0FBQ3pDO0FBQ0EsZUFBTyxDQUFDLEdBQVIsQ0FBWSwwQ0FBWjtBQUNEOztBQUNELFlBQU0sQ0FBQyxFQUFQLENBQVUsaUNBQVYsRUFBNkMsTUFBSztBQUNoRCxZQUFJLElBQUosRUFBMkM7QUFDekM7QUFDQSxpQkFBTyxDQUFDLEdBQVIsQ0FBWSxzQ0FBWjtBQUNELFNBSitDLENBS2hEOzs7QUFDQSxjQUFNLENBQUMsSUFBUCxDQUFZLGtCQUFaO0FBQ0EsY0FBTSxDQUFDLElBQVAsQ0FBWSwyQkFBWixFQUF5QyxNQUFLO0FBQzVDLGNBQUksSUFBSixFQUEyQztBQUN6QztBQUNBLG1CQUFPLENBQUMsR0FBUixDQUFZLG9DQUFaO0FBQ0Q7O0FBQ0QsZ0JBQU0sQ0FBQyxJQUFQLENBQVksMkJBQVo7QUFDQSxpQkFBTztBQUNSLFNBUEQ7QUFRRCxPQWZEO0FBZ0JBLFlBQU0sQ0FBQyxJQUFQLENBQVksaUNBQVo7QUFDRDs7QUFFRCxRQUFJLEdBQUcsRUFDTCxHQUFHO0FBREUsS0FBUDs7QUFJQSxRQUFJLE1BQU0sQ0FBQyxHQUFYLEVBQWdCO0FBQ2QsVUFBSSxHQUFHLE1BQU0sQ0FBQyxHQUFQLENBQVcsVUFBWCxDQUFzQixJQUF0QixDQUFQO0FBQ0QsS0FuRjRCLENBcUY3Qjs7O0FBQ0EsVUFBTSxDQUFDLEVBQVAsQ0FBVSxpQkFBVixFQUE2QixDQUFDO0FBQUUsU0FBRjtBQUFPO0FBQVAsS0FBRCxLQUFtQjtBQUM5QyxjQUFRLENBQUMsR0FBRCxFQUFNLEtBQU4sQ0FBUjtBQUNELEtBRkQ7QUFJQSxXQUFPLENBQUMsT0FBUixDQUFnQixFQUFFLElBQUksRUFBRSxFQUF4QjtBQUNELEdBM0ZNLENBQVA7QUE0RkQ7O0FBN0ZEOztBQStGQSxTQUFnQixnQkFBaEIsQ0FBa0MsRUFBbEMsRUFBb0M7QUFDbEMsU0FBTyxDQUFDLElBQVIsQ0FBYSxFQUFiO0FBQ0EsU0FBTyxNQUFLO0FBQ1YsVUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLE9BQVIsQ0FBZ0IsRUFBaEIsQ0FBZDtBQUNBLFFBQUksS0FBSyxLQUFLLENBQUMsQ0FBZixFQUFrQixPQUFPLENBQUMsTUFBUixDQUFlLEtBQWYsRUFBc0IsQ0FBdEI7QUFDbkIsR0FIRDtBQUlEOztBQU5EOztBQVFBLFNBQWdCLGlCQUFoQixHQUFpQztBQUMvQixRQUFNLENBQUMsa0JBQVAsQ0FBMEIsaUJBQTFCO0FBQ0EsVUFBUSxHQUFHLEVBQVg7QUFDRDs7QUFIRDtBQUtBLElBQUksUUFBUSxHQUFHLEVBQWY7O0FBRUEsU0FBUyxRQUFULENBQW1CLEdBQW5CLEVBQWdDLEtBQWhDLEVBQTBDO0FBQ3hDO0FBQ0EsTUFBSSxPQUFPLElBQUksU0FBUyxDQUFDLFFBQVYsQ0FBbUIsR0FBbkIsQ0FBZixFQUF3QztBQUN0Qyw4QkFBVyxnQkFBZ0IsY0FBYyxnQkFBZ0IsR0FBRyxFQUE1RCxFQUFnRSxLQUFoRTtBQUNEOztBQUNELFFBQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFELENBQXJCO0FBQ0EsTUFBSSxDQUFDLEdBQUQsQ0FBSixHQUFZLEtBQVo7QUFDQSxRQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsR0FBRCxDQUF6Qjs7QUFDQSxNQUFJLFFBQUosRUFBYztBQUNaLFlBQVEsQ0FBQyxPQUFULENBQWlCLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBRCxFQUFRLFFBQVIsQ0FBdkI7QUFDRCxHQVZ1QyxDQVd4Qzs7O0FBQ0EsU0FBTyxJQUFQO0FBQ0Q7O0FBRUQsU0FBUyxTQUFULENBQW9CLEdBQXBCLEVBQWlDLEtBQWpDLEVBQTJDO0FBQ3pDLFFBQU0sSUFBSSxNQUFNLENBQUMsSUFBUCxDQUFZLGlCQUFaLEVBQStCO0FBQ3ZDLE9BRHVDO0FBRXZDO0FBRnVDLEdBQS9CLENBQVY7QUFJRDs7QUFFRCxTQUFnQixlQUFoQixDQUFpQyxJQUFqQyxFQUF1QyxPQUF2QyxFQUE4QztBQUM1QyxRQUFNLElBQUksR0FBRyxRQUFRLENBQUMsSUFBRCxDQUFSLEtBQW1CLFFBQVEsQ0FBQyxJQUFELENBQVIsR0FBaUIsRUFBcEMsQ0FBYjtBQUNBLE1BQUksQ0FBQyxJQUFMLENBQVUsT0FBVjtBQUNBLFNBQU8sTUFBSztBQUNWLFVBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFMLENBQWEsT0FBYixDQUFkO0FBQ0EsUUFBSSxLQUFLLEtBQUssQ0FBQyxDQUFmLEVBQWtCLElBQUksQ0FBQyxNQUFMLENBQVksS0FBWixFQUFtQixDQUFuQjtBQUNuQixHQUhEO0FBSUQ7O0FBUEQ7QUFTQSxNQUFNLEtBQUssR0FBdUMsRUFBbEQ7QUFDQSxNQUFNLENBQUMsSUFBUCxDQUFZLGtCQUFaLEVBQWdDLE9BQWhDLENBQXdDLEdBQUcsSUFBRztBQUM1QyxRQUFNLENBQUMsY0FBUCxDQUFzQixLQUF0QixFQUE2QixHQUE3QixFQUFrQztBQUNoQyxnQkFBWSxFQUFFLEtBRGtCO0FBRWhDLE9BQUcsRUFBRSxNQUFNLElBQUksQ0FBQyxHQUFELENBRmlCO0FBR2hDLE9BQUcsRUFBRyxLQUFELElBQVU7QUFDYixlQUFTLENBQUMsR0FBRCxFQUFNLEtBQU4sQ0FBVDtBQUNBLGNBQVEsQ0FBQyxHQUFELEVBQU0sS0FBTixDQUFSO0FBQ0Q7QUFOK0IsR0FBbEM7QUFRRCxDQVREO0FBV2EscUJBQWEsS0FBYjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ3BPYiw4RUFFQTtBQUNBO0FBQ0E7OztBQUNBLE1BQU0sVUFBVSxHQUFHLE9BQU8sYUFBTyxNQUFkLEtBQXlCLFdBQXpCLElBQXdDLE9BQU8sYUFBTyxNQUFQLENBQWMsT0FBckIsS0FBaUMsV0FBNUY7QUFFQSxJQUFJLFdBQVcsR0FBRyxJQUFsQjs7QUFFQSxTQUFnQixXQUFoQixHQUEyQjtBQUN6QixTQUFPLElBQUksT0FBSixDQUFhLE9BQUQsSUFBWTtBQUM3QixRQUFJLFVBQUosRUFBZ0I7QUFDZCxtQkFBTyxNQUFQLENBQWMsT0FBZCxDQUFzQixLQUF0QixDQUE0QixHQUE1QixDQUFnQyxJQUFoQyxFQUFzQyxNQUFNLElBQUc7QUFDN0MsbUJBQVcsR0FBRyxNQUFkO0FBQ0EsZUFBTztBQUNSLE9BSEQ7QUFJRCxLQUxELE1BS087QUFDTCxpQkFBVyxHQUFHLEVBQWQ7QUFDQSxhQUFPO0FBQ1I7QUFDRixHQVZNLENBQVA7QUFXRDs7QUFaRDs7QUFjQSxTQUFnQixVQUFoQixDQUE0QixHQUE1QixFQUF5QyxlQUFvQixJQUE3RCxFQUFpRTtBQUMvRCxjQUFZOztBQUNaLE1BQUksVUFBSixFQUFnQjtBQUNkLFdBQU8sZUFBZSxDQUFDLFdBQVcsQ0FBQyxHQUFELENBQVosRUFBbUIsWUFBbkIsQ0FBdEI7QUFDRCxHQUZELE1BRU87QUFDTCxRQUFJO0FBQ0YsYUFBTyxlQUFlLENBQUMsSUFBSSxDQUFDLEtBQUwsQ0FBVyxZQUFZLENBQUMsT0FBYixDQUFxQixHQUFyQixDQUFYLENBQUQsRUFBd0MsWUFBeEMsQ0FBdEI7QUFDRCxLQUZELENBRUUsT0FBTyxDQUFQLEVBQVUsQ0FBRTtBQUNmO0FBQ0Y7O0FBVEQ7O0FBV0EsU0FBZ0IsVUFBaEIsQ0FBNEIsR0FBNUIsRUFBeUMsR0FBekMsRUFBaUQ7QUFDL0MsY0FBWTs7QUFDWixNQUFJLFVBQUosRUFBZ0I7QUFDZCxlQUFXLENBQUMsR0FBRCxDQUFYLEdBQW1CLEdBQW5CO0FBQ0EsaUJBQU8sTUFBUCxDQUFjLE9BQWQsQ0FBc0IsS0FBdEIsQ0FBNEIsR0FBNUIsQ0FBZ0M7QUFBRSxPQUFDLEdBQUQsR0FBTztBQUFULEtBQWhDO0FBQ0QsR0FIRCxNQUdPO0FBQ0wsUUFBSTtBQUNGLGtCQUFZLENBQUMsT0FBYixDQUFxQixHQUFyQixFQUEwQixJQUFJLENBQUMsU0FBTCxDQUFlLEdBQWYsQ0FBMUI7QUFDRCxLQUZELENBRUUsT0FBTyxDQUFQLEVBQVUsQ0FBRTtBQUNmO0FBQ0Y7O0FBVkQ7O0FBWUEsU0FBZ0IsYUFBaEIsQ0FBK0IsR0FBL0IsRUFBMEM7QUFDeEMsY0FBWTs7QUFDWixNQUFJLFVBQUosRUFBZ0I7QUFDZCxXQUFPLFdBQVcsQ0FBQyxHQUFELENBQWxCO0FBQ0EsaUJBQU8sTUFBUCxDQUFjLE9BQWQsQ0FBc0IsS0FBdEIsQ0FBNEIsTUFBNUIsQ0FBbUMsQ0FBQyxHQUFELENBQW5DO0FBQ0QsR0FIRCxNQUdPO0FBQ0wsUUFBSTtBQUNGLGtCQUFZLENBQUMsVUFBYixDQUF3QixHQUF4QjtBQUNELEtBRkQsQ0FFRSxPQUFPLENBQVAsRUFBVSxDQUFFO0FBQ2Y7QUFDRjs7QUFWRDs7QUFZQSxTQUFnQixZQUFoQixHQUE0QjtBQUMxQixjQUFZOztBQUNaLE1BQUksVUFBSixFQUFnQjtBQUNkLGVBQVcsR0FBRyxFQUFkO0FBQ0EsaUJBQU8sTUFBUCxDQUFjLE9BQWQsQ0FBc0IsS0FBdEIsQ0FBNEIsS0FBNUI7QUFDRCxHQUhELE1BR087QUFDTCxRQUFJO0FBQ0Ysa0JBQVksQ0FBQyxLQUFiO0FBQ0QsS0FGRCxDQUVFLE9BQU8sQ0FBUCxFQUFVLENBQUU7QUFDZjtBQUNGOztBQVZEOztBQVlBLFNBQVMsWUFBVCxHQUFxQjtBQUNuQixNQUFJLENBQUMsV0FBTCxFQUFrQjtBQUNoQixVQUFNLElBQUksS0FBSixDQUFVLDZDQUFWLENBQU47QUFDRDtBQUNGOztBQUVELFNBQVMsZUFBVCxDQUEwQixLQUExQixFQUFpQyxZQUFqQyxFQUE2QztBQUMzQyxNQUFJLEtBQUssSUFBSSxJQUFiLEVBQW1CO0FBQ2pCLFdBQU8sWUFBUDtBQUNEOztBQUNELFNBQU8sS0FBUDtBQUNEOzs7Ozs7Ozs7Ozs7Ozs7O0FDakZELE1BQU0sbUJBQW1CLEdBQUcsTUFBTSxJQUFsQyxFQUF1Qzs7QUFFdkMsU0FBUyxNQUFULENBQWlCLElBQWpCLEVBQXVCLFFBQXZCLEVBQWlDLElBQWpDLEVBQXVDLElBQXZDLEVBQTJDO0FBQ3pDLE1BQUksTUFBSixFQUFZLEdBQVosRUFBaUIsS0FBakIsRUFBd0IsQ0FBeEIsRUFBMkIsQ0FBM0I7QUFDQSxRQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBTCxDQUFTLElBQVQsQ0FBbEI7O0FBQ0EsTUFBSSxTQUFTLElBQUksSUFBakIsRUFBdUI7QUFDckIsV0FBTyxTQUFQO0FBQ0Q7O0FBQ0QsUUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQW5CO0FBQ0EsUUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFNBQVAsQ0FBaUIsUUFBakIsQ0FBMEIsSUFBMUIsQ0FBK0IsSUFBL0IsQ0FBZDs7QUFDQSxNQUFJLEtBQUssS0FBSyxpQkFBZCxFQUFpQztBQUMvQixVQUFNLEdBQUcsRUFBVDtBQUNBLFFBQUksQ0FBQyxHQUFMLENBQVMsSUFBVCxFQUFlLEtBQWY7QUFDQSxRQUFJLENBQUMsSUFBTCxDQUFVLE1BQVY7QUFDQSxVQUFNLElBQUksR0FBRyxNQUFNLENBQUMsSUFBUCxDQUFZLElBQVosQ0FBYjs7QUFDQSxTQUFLLENBQUMsR0FBRyxDQUFKLEVBQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFyQixFQUE2QixDQUFDLEdBQUcsQ0FBakMsRUFBb0MsQ0FBQyxFQUFyQyxFQUF5QztBQUN2QyxTQUFHLEdBQUcsSUFBSSxDQUFDLENBQUQsQ0FBVjtBQUNBLFdBQUssR0FBRyxJQUFJLENBQUMsR0FBRCxDQUFaO0FBQ0EsVUFBSSxRQUFKLEVBQWMsS0FBSyxHQUFHLFFBQVEsQ0FBQyxJQUFULENBQWMsSUFBZCxFQUFvQixHQUFwQixFQUF5QixLQUF6QixDQUFSO0FBQ2QsWUFBTSxDQUFDLEdBQUQsQ0FBTixHQUFjLE1BQU0sQ0FBQyxLQUFELEVBQVEsUUFBUixFQUFrQixJQUFsQixFQUF3QixJQUF4QixDQUFwQjtBQUNEO0FBQ0YsR0FYRCxNQVdPLElBQUksS0FBSyxLQUFLLGdCQUFkLEVBQWdDO0FBQ3JDLFVBQU0sR0FBRyxFQUFUO0FBQ0EsUUFBSSxDQUFDLEdBQUwsQ0FBUyxJQUFULEVBQWUsS0FBZjtBQUNBLFFBQUksQ0FBQyxJQUFMLENBQVUsTUFBVjs7QUFDQSxTQUFLLENBQUMsR0FBRyxDQUFKLEVBQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFyQixFQUE2QixDQUFDLEdBQUcsQ0FBakMsRUFBb0MsQ0FBQyxFQUFyQyxFQUF5QztBQUN2QyxXQUFLLEdBQUcsSUFBSSxDQUFDLENBQUQsQ0FBWjtBQUNBLFVBQUksUUFBSixFQUFjLEtBQUssR0FBRyxRQUFRLENBQUMsSUFBVCxDQUFjLElBQWQsRUFBb0IsQ0FBcEIsRUFBdUIsS0FBdkIsQ0FBUjtBQUNkLFlBQU0sQ0FBQyxDQUFELENBQU4sR0FBWSxNQUFNLENBQUMsS0FBRCxFQUFRLFFBQVIsRUFBa0IsSUFBbEIsRUFBd0IsSUFBeEIsQ0FBbEI7QUFDRDtBQUNGLEdBVE0sTUFTQTtBQUNMLFFBQUksQ0FBQyxJQUFMLENBQVUsSUFBVjtBQUNEOztBQUNELFNBQU8sS0FBUDtBQUNEOztBQUVELFNBQVMsTUFBVCxDQUFpQixJQUFqQixFQUF1QixPQUF2QixFQUE4QjtBQUM1QixNQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBYjtBQUNBLE1BQUksQ0FBSixFQUFPLENBQVAsRUFBVSxJQUFWLEVBQWdCLEdBQWhCLEVBQXFCLEtBQXJCLEVBQTRCLEtBQTVCOztBQUNBLFNBQU8sQ0FBQyxFQUFSLEVBQVk7QUFDVixRQUFJLEdBQUcsSUFBSSxDQUFDLENBQUQsQ0FBWDtBQUNBLFNBQUssR0FBRyxNQUFNLENBQUMsU0FBUCxDQUFpQixRQUFqQixDQUEwQixJQUExQixDQUErQixJQUEvQixDQUFSOztBQUNBLFFBQUksS0FBSyxLQUFLLGlCQUFkLEVBQWlDO0FBQy9CLFlBQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFQLENBQVksSUFBWixDQUFiOztBQUNBLFdBQUssQ0FBQyxHQUFHLENBQUosRUFBTyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQXJCLEVBQTZCLENBQUMsR0FBRyxDQUFqQyxFQUFvQyxDQUFDLEVBQXJDLEVBQXlDO0FBQ3ZDLFdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBRCxDQUFWO0FBQ0EsYUFBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRCxDQUFMLENBQVo7QUFDQSxZQUFJLE9BQUosRUFBYSxLQUFLLEdBQUcsT0FBTyxDQUFDLElBQVIsQ0FBYSxJQUFiLEVBQW1CLEdBQW5CLEVBQXdCLEtBQXhCLENBQVI7QUFDYixZQUFJLENBQUMsR0FBRCxDQUFKLEdBQVksS0FBWjtBQUNEO0FBQ0YsS0FSRCxNQVFPLElBQUksS0FBSyxLQUFLLGdCQUFkLEVBQWdDO0FBQ3JDLFdBQUssQ0FBQyxHQUFHLENBQUosRUFBTyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQXJCLEVBQTZCLENBQUMsR0FBRyxDQUFqQyxFQUFvQyxDQUFDLEVBQXJDLEVBQXlDO0FBQ3ZDLGFBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUQsQ0FBTCxDQUFaO0FBQ0EsWUFBSSxPQUFKLEVBQWEsS0FBSyxHQUFHLE9BQU8sQ0FBQyxJQUFSLENBQWEsSUFBYixFQUFtQixDQUFuQixFQUFzQixLQUF0QixDQUFSO0FBQ2IsWUFBSSxDQUFDLENBQUQsQ0FBSixHQUFVLEtBQVY7QUFDRDtBQUNGO0FBQ0Y7QUFDRjs7QUFFRCxTQUFnQiwyQkFBaEIsQ0FBNkMsSUFBN0MsRUFBd0QsV0FBd0QsSUFBaEgsRUFBc0gsUUFBZ0IsSUFBdEksRUFBMEk7QUFDeEksTUFBSSxNQUFKOztBQUNBLE1BQUk7QUFDRixVQUFNLEdBQUcsU0FBUyxDQUFDLE1BQVYsS0FBcUIsQ0FBckIsR0FDTCxJQUFJLENBQUMsU0FBTCxDQUFlLElBQWYsQ0FESyxDQUVQO0FBRk8sTUFHTCxJQUFJLENBQUMsU0FBTCxDQUFlLElBQWYsRUFBcUIsUUFBckIsRUFBK0IsS0FBL0IsQ0FISjtBQUlELEdBTEQsQ0FLRSxPQUFPLENBQVAsRUFBVTtBQUNWLFVBQU0sR0FBRyxpQ0FBaUMsQ0FBQyxJQUFELEVBQU8sUUFBUCxFQUFpQixLQUFqQixDQUExQztBQUNEOztBQUNELE1BQUksTUFBTSxDQUFDLE1BQVAsR0FBZ0IsbUJBQXBCLEVBQXlDO0FBQ3ZDLFVBQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFMLENBQVUsTUFBTSxDQUFDLE1BQVAsR0FBZ0IsbUJBQTFCLENBQW5CO0FBQ0EsVUFBTSxNQUFNLEdBQUcsRUFBZjs7QUFDQSxTQUFLLElBQUksQ0FBQyxHQUFHLENBQWIsRUFBZ0IsQ0FBQyxHQUFHLFVBQXBCLEVBQWdDLENBQUMsRUFBakMsRUFBcUM7QUFDbkMsWUFBTSxDQUFDLElBQVAsQ0FBWSxNQUFNLENBQUMsS0FBUCxDQUFhLENBQUMsR0FBRyxtQkFBakIsRUFBc0MsQ0FBQyxDQUFDLEdBQUcsQ0FBTCxJQUFVLG1CQUFoRCxDQUFaO0FBQ0Q7O0FBQ0QsV0FBTyxNQUFQO0FBQ0Q7O0FBQ0QsU0FBTyxNQUFQO0FBQ0Q7O0FBbkJEOztBQXFCQSxTQUFnQix1QkFBaEIsQ0FBeUMsSUFBekMsRUFBb0QsVUFBdUQsSUFBM0csRUFBK0c7QUFDN0csTUFBSSxLQUFLLENBQUMsT0FBTixDQUFjLElBQWQsQ0FBSixFQUF5QjtBQUN2QixRQUFJLEdBQUcsSUFBSSxDQUFDLElBQUwsQ0FBVSxFQUFWLENBQVA7QUFDRDs7QUFDRCxRQUFNLFdBQVcsR0FBRyxNQUFNLElBQU4sQ0FBVyxJQUFYLENBQXBCOztBQUNBLE1BQUksQ0FBQyxXQUFMLEVBQWtCO0FBQ2hCLFdBQU8sU0FBUyxDQUFDLE1BQVYsS0FBcUIsQ0FBckIsR0FDSCxJQUFJLENBQUMsS0FBTCxDQUFXLElBQVgsQ0FERyxDQUVMO0FBRkssTUFHSCxJQUFJLENBQUMsS0FBTCxDQUFXLElBQVgsRUFBaUIsT0FBakIsQ0FISjtBQUlELEdBTEQsTUFLTztBQUNMLFVBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBWCxDQUFiO0FBQ0EsVUFBTSxDQUFDLElBQUQsRUFBTyxPQUFQLENBQU47QUFDQSxXQUFPLElBQUksQ0FBQyxDQUFELENBQVg7QUFDRDtBQUNGOztBQWZEOztBQWlCQSxTQUFnQixpQ0FBaEIsQ0FBbUQsSUFBbkQsRUFBOEQsV0FBd0QsSUFBdEgsRUFBNEgsUUFBZ0IsSUFBNUksRUFBZ0o7QUFDOUksUUFBTSxJQUFJLEdBQUcsRUFBYjtBQUNBLFFBQU0sQ0FBQyxJQUFELEVBQU8sUUFBUCxFQUFpQixJQUFqQixFQUF1QixJQUFJLEdBQUosRUFBdkIsQ0FBTjtBQUNBLFNBQU8sS0FBSyxHQUNSLE1BQU0sSUFBSSxDQUFDLFNBQUwsQ0FBZSxJQUFmLEVBQXFCLElBQXJCLEVBQTJCLEtBQTNCLENBREUsR0FFUixNQUFNLElBQUksQ0FBQyxTQUFMLENBQWUsSUFBZixDQUZWO0FBR0Q7O0FBTkQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDbEdBOztBQUVBOztBQUNBOztBQU9BOztBQUNBOztBQUVBLFNBQVMsTUFBVCxDQUFpQixFQUFqQixFQUFtQjtBQUNqQixRQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBUCxDQUFjLElBQWQsQ0FBZDtBQUNBLFNBQU8sU0FBUyxRQUFULENBQW1CLEdBQW5CLEVBQXNCO0FBQzNCLFVBQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxHQUFELENBQWpCO0FBQ0EsV0FBTyxHQUFHLEtBQUssS0FBSyxDQUFDLEdBQUQsQ0FBTCxHQUFhLEVBQUUsQ0FBQyxHQUFELENBQXBCLENBQVY7QUFDRCxHQUhEO0FBSUQ7O0FBRUQsTUFBTSxVQUFVLEdBQUcsa0JBQW5CO0FBQ2EsbUJBQVcsTUFBTSxDQUFFLEdBQUQsSUFBUTtBQUNyQyxTQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBSixDQUFZLFVBQVosRUFBd0IsT0FBeEIsQ0FBZDtBQUNELENBRjZCLENBQWpCO0FBSWIsTUFBTSxVQUFVLEdBQUcsUUFBbkI7QUFDYSxtQkFBVyxNQUFNLENBQUUsR0FBRCxJQUFRO0FBQ3JDLFNBQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFKLENBQVksVUFBWixFQUF3QixPQUF4QixDQUFkO0FBQ0QsQ0FGNkIsQ0FBakI7QUFJYixNQUFNLFVBQVUsR0FBRyxvQkFBbkI7QUFDYSxtQkFBVyxNQUFNLENBQUUsR0FBRCxJQUFRO0FBQ3JDLFNBQU8sR0FBRyxJQUFJLEdBQUcsQ0FDZCxPQURXLENBQ0gsVUFERyxFQUNTLENBQUMsQ0FBRCxFQUFJLGtCQUFKLEVBQXdCLGVBQXhCLEtBQTJDO0FBQzlELFdBQU8sR0FBRyxrQkFBa0IsSUFBSSxlQUFlLEVBQS9DO0FBQ0QsR0FIVyxFQUlYLFdBSlcsRUFBZDtBQUtELENBTjZCLENBQWpCOztBQVFiLFNBQVMsT0FBVCxDQUFrQixDQUFsQixFQUFxQixDQUFyQixFQUFzQjtBQUNwQixTQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsV0FBRixFQUFILEdBQXFCLEVBQTdCO0FBQ0Q7O0FBRUQsU0FBZ0IsdUJBQWhCLENBQXlDLFlBQXpDLEVBQXVELEtBQUssR0FBRyxPQUEvRCxFQUFzRTtBQUNwRSxVQUFRLEtBQVI7QUFDRSxTQUFLLE9BQUw7QUFDRSxhQUFPLHNCQUFTLFlBQVQsQ0FBUDs7QUFDRixTQUFLLE9BQUw7QUFDRSxhQUFPLHNCQUFTLFlBQVQsQ0FBUDs7QUFDRixTQUFLLFVBQUw7QUFDQTtBQUNFLGFBQU8sWUFBUDtBQVBKO0FBU0Q7O0FBVkQ7O0FBWUEsU0FBZ0IsS0FBaEIsQ0FBdUIsSUFBdkIsRUFBMkI7QUFDekIsTUFBSSxDQUFDLElBQUwsRUFBVyxPQUFPLEtBQVA7QUFDWCxRQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsYUFBTCxDQUFtQixlQUEvQjtBQUNBLFFBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFwQjtBQUNBLFNBQU8sR0FBRyxLQUFLLElBQVIsSUFDTCxHQUFHLEtBQUssTUFESCxJQUVMLENBQUMsRUFBRSxNQUFNLElBQUksTUFBTSxDQUFDLFFBQVAsS0FBb0IsQ0FBOUIsSUFBb0MsR0FBRyxDQUFDLFFBQUosQ0FBYSxNQUFiLENBQXRDLENBRkg7QUFHRDs7QUFQRDtBQVNBOztBQUVHOztBQUVVLG9CQUFZLDJCQUFaO0FBQ0EsbUJBQVcsMEJBQVg7QUFDQSw0QkFBb0IsbUNBQXBCO0FBQ0EsY0FBTSxxQkFBTjtBQUVBLHlCQUFpQjtBQUM1QixNQUFJLEVBQUUsSUFEc0I7QUFFNUIsT0FBSyxFQUFFLEtBRnFCO0FBRzVCLFdBQVMsRUFBRSxpQkFIaUI7QUFJNUIsTUFBSSxFQUFFLElBSnNCO0FBSzVCLGVBQWEseUJBTGU7QUFNNUIsVUFBUSxFQUFFLGdCQU5rQjtBQU81QixLQUFHLEVBQUU7QUFQdUIsQ0FBakI7QUFVQSwwQkFBa0IsS0FBbEI7QUFDQSx5QkFBaUIsSUFBakI7O0FBRWIsU0FBZ0Isb0JBQWhCLENBQXNDLEtBQXRDLEVBQTJDO0FBQ3pDLE1BQUksS0FBSyxLQUFLLElBQWQsRUFBb0I7QUFDbEIsV0FBTyxNQUFQO0FBQ0QsR0FGRCxNQUVPLElBQUksS0FBSyxLQUFLLGlCQUFkLEVBQXlCO0FBQzlCLFdBQU8sV0FBUDtBQUNELEdBRk0sTUFFQSxJQUFJLEtBQUssS0FBSyxXQUFkLEVBQW1CO0FBQ3hCLFdBQU8sS0FBUDtBQUNELEdBRk0sTUFFQSxJQUFJLEtBQUssS0FBSyxnQkFBZCxFQUF3QjtBQUM3QixXQUFPLFVBQVA7QUFDRCxHQUZNLE1BRUEsSUFBSSxLQUFLLEtBQUsseUJBQWQsRUFBaUM7QUFDdEMsV0FBTyxXQUFQO0FBQ0Q7O0FBQ0QsU0FBTyxLQUFQO0FBQ0Q7O0FBYkQ7QUFlQTs7Ozs7O0FBTUc7O0FBQ0gsTUFBTSxXQUFOLENBQWlCO0FBR2Y7QUFDRSxTQUFLLEdBQUwsR0FBVyxJQUFJLEdBQUosRUFBWDtBQUNEO0FBRUQ7Ozs7QUFJRzs7O0FBQ0gsT0FBSyxDQUFrQixJQUFsQixFQUErQixPQUEvQixFQUFnRTtBQUNuRSxVQUFNLE1BQU0sR0FBWSxLQUFLLEdBQUwsQ0FBUyxHQUFULENBQWEsSUFBYixDQUF4Qjs7QUFDQSxRQUFJLE1BQUosRUFBWTtBQUNWLGFBQU8sTUFBUDtBQUNELEtBRkQsTUFFTztBQUNMLFlBQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxJQUFELENBQXRCO0FBQ0EsV0FBSyxHQUFMLENBQVMsR0FBVCxDQUFhLElBQWIsRUFBbUIsTUFBbkI7QUFDQSxhQUFPLE1BQVA7QUFDRDtBQUNGOztBQUVELE9BQUs7QUFDSCxTQUFLLEdBQUwsQ0FBUyxLQUFUO0FBQ0Q7O0FBekJjOztBQTRCakIsTUFBTSxXQUFXLEdBQUcsSUFBSSxXQUFKLEVBQXBCOztBQUVBLE1BQU0sV0FBTixDQUFpQjtBQU1mLGNBQWEsT0FBYixFQUE0QjtBQUMxQixTQUFLLE9BQUwsR0FBZSxPQUFmO0FBQ0EsU0FBSyxHQUFMLEdBQVcsSUFBSSxHQUFKLEVBQVg7QUFDQSxTQUFLLEtBQUwsR0FBYSxDQUFiO0FBQ0EsU0FBSyxJQUFMLEdBQVksQ0FBWjtBQUNEOztBQUVELE9BQUssQ0FBRSxLQUFGLEVBQVk7QUFDZixVQUFNLFlBQVksR0FBRyxLQUFLLEtBQTFCO0FBQ0EsU0FBSyxHQUFMLENBQVMsR0FBVCxDQUFhLFlBQWIsRUFBMkIsS0FBM0I7QUFDQSxTQUFLLElBQUw7O0FBQ0EsUUFBSSxLQUFLLElBQUwsR0FBWSxLQUFLLE9BQXJCLEVBQThCO0FBQzVCLFdBQUssR0FBTCxDQUFTLE1BQVQsQ0FBZ0IsWUFBWSxHQUFHLEtBQUssSUFBcEM7QUFDQSxXQUFLLElBQUw7QUFDRDs7QUFDRCxTQUFLLEtBQUw7QUFDQSxXQUFPLFlBQVA7QUFDRDs7QUFFRCxNQUFJLENBQUUsRUFBRixFQUFZO0FBQ2QsV0FBTyxLQUFLLEdBQUwsQ0FBUyxHQUFULENBQWEsRUFBYixDQUFQO0FBQ0Q7O0FBM0JjOztBQThCakIsTUFBTSxXQUFXLEdBQUcsSUFBSSxXQUFKLENBQWdCLElBQWhCLENBQXBCOztBQUVBLFNBQWdCLFNBQWhCLENBQTJCLElBQTNCLEVBQStCO0FBQzdCO0FBQ0EsYUFBVyxDQUFDLEtBQVo7QUFDQSxTQUFPLDRDQUE0QixJQUE1QixFQUFrQyxRQUFsQyxDQUFQO0FBQ0Q7O0FBSkQ7O0FBTUEsU0FBUyxRQUFULENBQW1CLEdBQW5CLEVBQXNCO0FBQ3BCO0FBQ0EsUUFBTSxHQUFHLEdBQUcsS0FBSyxHQUFMLENBQVo7QUFDQSxRQUFNLElBQUksR0FBRyxPQUFPLEdBQXBCOztBQUNBLE1BQUksS0FBSyxDQUFDLE9BQU4sQ0FBYyxHQUFkLENBQUosRUFBd0I7QUFDdEIsVUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQWQ7O0FBQ0EsUUFBSSxDQUFDLEdBQUcsc0JBQVIsRUFBd0I7QUFDdEIsYUFBTztBQUNMLGdCQUFRLEVBQUUsSUFETDtBQUVMLGNBQU0sRUFBRSxDQUZIO0FBR0wsYUFBSyxFQUFFLEdBQUcsQ0FBQyxLQUFKLENBQVUsQ0FBVixFQUFhLHNCQUFiO0FBSEYsT0FBUDtBQUtEOztBQUNELFdBQU8sR0FBUDtBQUNELEdBVkQsTUFVTyxJQUFJLE9BQU8sR0FBUCxLQUFlLFFBQW5CLEVBQTZCO0FBQ2xDLFFBQUksR0FBRyxDQUFDLE1BQUosR0FBYSx1QkFBakIsRUFBa0M7QUFDaEMsYUFBTyxHQUFHLENBQUMsTUFBSixDQUFXLENBQVgsRUFBYyx1QkFBZCxJQUFpQyxRQUFTLEdBQUcsQ0FBQyxNQUFPLGdCQUE1RDtBQUNELEtBRkQsTUFFTztBQUNMLGFBQU8sR0FBUDtBQUNEO0FBQ0YsR0FOTSxNQU1BLElBQUksSUFBSSxLQUFLLFdBQWIsRUFBMEI7QUFDL0IsV0FBTyxpQkFBUDtBQUNELEdBRk0sTUFFQSxJQUFJLEdBQUcsS0FBSyxRQUFaLEVBQXNCO0FBQzNCLFdBQU8sZ0JBQVA7QUFDRCxHQUZNLE1BRUEsSUFBSSxHQUFHLEtBQUssQ0FBQyxRQUFiLEVBQXVCO0FBQzVCLFdBQU8seUJBQVA7QUFDRCxHQUZNLE1BRUEsSUFBSSxJQUFJLEtBQUssVUFBYixFQUF5QjtBQUM5QixXQUFPLHdCQUF3QixDQUFDLEdBQUQsQ0FBL0I7QUFDRCxHQUZNLE1BRUEsSUFBSSxJQUFJLEtBQUssUUFBYixFQUF1QjtBQUM1QixXQUFPLGtCQUFrQixNQUFNLENBQUMsU0FBUCxDQUFpQixRQUFqQixDQUEwQixJQUExQixDQUErQixHQUEvQixDQUFtQyxHQUE1RDtBQUNELEdBRk0sTUFFQSxJQUFJLEdBQUcsS0FBSyxJQUFSLElBQWdCLElBQUksS0FBSyxRQUE3QixFQUF1QztBQUM1QyxVQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsU0FBUCxDQUFpQixRQUFqQixDQUEwQixJQUExQixDQUErQixHQUEvQixDQUFkOztBQUNBLFFBQUksS0FBSyxLQUFLLGNBQWQsRUFBOEI7QUFDNUIsYUFBTyxXQUFXLENBQUMsS0FBWixDQUFrQixHQUFsQixFQUF1QixNQUFNLG1CQUFtQixDQUFDLEdBQUQsQ0FBaEQsQ0FBUDtBQUNELEtBRkQsTUFFTyxJQUFJLEtBQUssS0FBSyxjQUFkLEVBQThCO0FBQ25DLGFBQU8sV0FBVyxDQUFDLEtBQVosQ0FBa0IsR0FBbEIsRUFBdUIsTUFBTSxtQkFBbUIsQ0FBQyxHQUFELENBQWhELENBQVA7QUFDRCxLQUZNLE1BRUEsSUFBSSxLQUFLLEtBQUssaUJBQWQsRUFBaUM7QUFDdEM7QUFDQSxhQUFPLGtCQUFrQixNQUFNLENBQUMsU0FBUCxDQUFpQixRQUFqQixDQUEwQixJQUExQixDQUErQixHQUEvQixDQUFtQyxHQUE1RDtBQUNELEtBSE0sTUFHQSxJQUFJLEtBQUssS0FBSyxlQUFkLEVBQStCO0FBQ3BDLGFBQU8sZ0JBQWdCLElBQUksQ0FBQyxTQUFMLENBQWUsUUFBZixDQUF3QixJQUF4QixDQUE2QixHQUE3QixDQUFpQyxHQUF4RDtBQUNELEtBRk0sTUFFQSxJQUFJLEtBQUssS0FBSyxnQkFBZCxFQUFnQztBQUNyQyxhQUFPLGlCQUFpQixHQUFHLENBQUMsT0FBTyxLQUFLLEdBQUcsQ0FBQyxLQUFLLEdBQWpEO0FBQ0QsS0FGTSxNQUVBLElBQUksR0FBRyxDQUFDLEtBQUosSUFBYSxHQUFHLENBQUMsR0FBckIsRUFBMEI7QUFDL0IsYUFBTyxXQUFXLENBQUMsS0FBWixDQUFrQixHQUFsQixFQUF1QixNQUFNLHFDQUFzQixHQUF0QixDQUE3QixDQUFQO0FBQ0QsS0FGTSxNQUVBLElBQUksR0FBRyxDQUFDLFdBQUosSUFBbUIsR0FBRyxDQUFDLFdBQUosQ0FBZ0IsSUFBaEIsS0FBeUIsV0FBaEQsRUFBNkQ7QUFDbEUsYUFBTyxXQUFXLENBQUMsS0FBWixDQUFrQixHQUFsQixFQUF1QixNQUFNLHNDQUF1QixHQUF2QixDQUE3QixDQUFQO0FBQ0QsS0FGTSxNQUVBLElBQUksNkJBQWMsR0FBZCxDQUFKLEVBQXdCO0FBQzdCLGFBQU8sV0FBVyxDQUFDLEtBQVosQ0FBa0IsR0FBbEIsRUFBdUIsTUFBTSx3Q0FBeUIsR0FBekIsQ0FBN0IsQ0FBUDtBQUNELEtBRk0sTUFFQSxJQUFJLE9BQU8sR0FBRyxDQUFDLE1BQVgsS0FBc0IsVUFBMUIsRUFBc0M7QUFDM0MsYUFBTyxXQUFXLENBQUMsS0FBWixDQUFrQixHQUFsQixFQUF1QixNQUFNLG1DQUFtQyxDQUFDLEdBQUQsQ0FBaEUsQ0FBUDtBQUNELEtBRk0sTUFFQSxJQUFJLEdBQUcsQ0FBQyxXQUFKLElBQW1CLEdBQUcsQ0FBQyxXQUFKLENBQWdCLElBQWhCLEtBQXlCLE9BQWhELEVBQXlEO0FBQzlELGFBQU8sa0JBQWtCLEdBQUcsQ0FBQyxHQUFHLElBQWhDO0FBQ0QsS0FGTSxNQUVBLElBQUksR0FBRyxZQUFZLFdBQW5CLEVBQWdDO0FBQ3JDLGFBQU8sV0FBVyxDQUFDLEtBQVosQ0FBa0IsR0FBbEIsRUFBdUIsTUFBTSwyQkFBMkIsQ0FBQyxHQUFELENBQXhELENBQVA7QUFDRDtBQUNGLEdBMUJNLE1BMEJBLElBQUksTUFBTSxDQUFDLEtBQVAsQ0FBYSxHQUFiLENBQUosRUFBdUI7QUFDNUIsV0FBTyxXQUFQO0FBQ0Q7O0FBQ0QsU0FBTyxRQUFRLENBQUMsR0FBRCxDQUFmO0FBQ0Q7O0FBRUQsU0FBZ0IsbUJBQWhCLENBQXFDLEdBQXJDLEVBQXdDO0FBQ3RDLFFBQU0sSUFBSSxHQUFHLEVBQWI7QUFDQSxLQUFHLENBQUMsT0FBSixDQUNFLENBQUMsS0FBRCxFQUFRLEdBQVIsS0FBZ0IsSUFBSSxDQUFDLElBQUwsQ0FBVTtBQUN4QixPQUR3QjtBQUV4QjtBQUZ3QixHQUFWLENBRGxCO0FBTUEsU0FBTztBQUNMLFdBQU8sRUFBRTtBQUNQLFVBQUksRUFBRSxLQURDO0FBRVAsYUFBTyxFQUFFLEtBRkY7QUFHUCxXQUFLLEVBQUUsSUFIQTtBQUlQLGNBQVEsRUFBRSxJQUpIO0FBS1AsWUFBTSxFQUFFO0FBQ04sZ0JBQVEsRUFBRTtBQURKO0FBTEQ7QUFESixHQUFQO0FBV0Q7O0FBbkJEOztBQXFCQSxTQUFnQixTQUFoQixDQUEyQixHQUEzQixFQUE4QjtBQUM1QixRQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUosRUFBZjtBQUNBLFFBQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxPQUFKLENBQVksS0FBekI7O0FBQ0EsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFiLEVBQWdCLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBekIsRUFBaUMsQ0FBQyxFQUFsQyxFQUFzQztBQUNwQyxVQUFNO0FBQUUsU0FBRjtBQUFPO0FBQVAsUUFBaUIsSUFBSSxDQUFDLENBQUQsQ0FBM0I7QUFDQSxVQUFNLENBQUMsR0FBUCxDQUFXLEdBQVgsRUFBZ0IsTUFBTSxDQUFDLEtBQUQsQ0FBdEI7QUFDRDs7QUFDRCxTQUFPLE1BQVA7QUFDRDs7QUFSRDs7QUFVQSxTQUFnQixtQkFBaEIsQ0FBcUMsR0FBckMsRUFBd0M7QUFDdEMsUUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQU4sQ0FBVyxHQUFYLENBQWI7QUFDQSxTQUFPO0FBQ0wsV0FBTyxFQUFFO0FBQ1AsVUFBSSxFQUFFLEtBREM7QUFFUCxhQUFPLEVBQUUsT0FBTyxJQUFJLENBQUMsTUFBTSxHQUZwQjtBQUdQLFdBQUssRUFBRSxJQUhBO0FBSVAsY0FBUSxFQUFFO0FBSkg7QUFESixHQUFQO0FBUUQ7O0FBVkQ7O0FBWUEsU0FBZ0IsU0FBaEIsQ0FBMkIsR0FBM0IsRUFBOEI7QUFDNUIsUUFBTSxNQUFNLEdBQUcsSUFBSSxHQUFKLEVBQWY7QUFDQSxRQUFNLElBQUksR0FBRyxHQUFHLENBQUMsT0FBSixDQUFZLEtBQXpCOztBQUNBLE9BQUssSUFBSSxDQUFDLEdBQUcsQ0FBYixFQUFnQixDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQXpCLEVBQWlDLENBQUMsRUFBbEMsRUFBc0M7QUFDcEMsVUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUQsQ0FBbEI7QUFDQSxVQUFNLENBQUMsR0FBUCxDQUFXLE1BQU0sQ0FBQyxLQUFELENBQWpCO0FBQ0Q7O0FBQ0QsU0FBTyxNQUFQO0FBQ0Q7O0FBUkQsK0JBVUE7QUFDQTs7QUFDQSxTQUFTLFFBQVQsQ0FBbUIsUUFBbkIsRUFBNkIsR0FBN0IsRUFBZ0M7QUFDOUIsU0FBTyxlQUFLLFFBQUwsQ0FDTCxRQUFRLENBQUMsT0FBVCxDQUFpQixZQUFqQixFQUErQixFQUEvQixFQUFtQyxPQUFuQyxDQUEyQyxLQUEzQyxFQUFrRCxHQUFsRCxDQURLLEVBRUwsR0FGSyxDQUFQO0FBSUQ7O0FBRUQsU0FBZ0IsZ0JBQWhCLENBQWtDLE9BQWxDLEVBQXlDO0FBQ3ZDLFFBQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxXQUFSLElBQXVCLE9BQU8sQ0FBQyxJQUEvQixJQUF1QyxPQUFPLENBQUMsYUFBNUQ7O0FBQ0EsTUFBSSxJQUFKLEVBQVU7QUFDUixXQUFPLElBQVA7QUFDRDs7QUFDRCxRQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBckIsQ0FMdUMsQ0FLWDs7QUFDNUIsTUFBSSxJQUFKLEVBQVU7QUFDUixXQUFPLHNCQUFTLFFBQVEsQ0FBQyxJQUFELEVBQU8sTUFBUCxDQUFqQixDQUFQO0FBQ0Q7QUFDRjs7QUFURDs7QUFXQSxTQUFnQixtQ0FBaEIsQ0FBcUQsR0FBckQsRUFBd0Q7QUFDdEQsTUFBSSxPQUFPLEdBQUcsZ0JBQWdCLENBQUMsR0FBRCxDQUE5Qjs7QUFDQSxNQUFJLE9BQUosRUFBYTtBQUNYLFFBQUksR0FBRyxDQUFDLElBQUosSUFBWSxHQUFHLENBQUMsTUFBcEIsRUFBNEI7QUFDMUIsYUFBTyxJQUFJLFdBQVcsR0FBRyxDQUFDLE1BQU0sVUFBaEM7QUFDRDtBQUNGLEdBSkQsTUFJTztBQUNMLFdBQU8sR0FBRywwQkFBVjtBQUNEOztBQUNELFNBQU87QUFDTCxXQUFPLEVBQUU7QUFDUCxVQUFJLEVBQUUsc0JBREM7QUFFUCxhQUZPO0FBR1AsYUFBTyxFQUFFLHNCQUhGO0FBSVAsVUFBRyxHQUFHLENBQUMsTUFBSixHQUNDO0FBQ0UsWUFBSSxFQUFFLEdBQUcsQ0FBQztBQURaLE9BREQsR0FJQyxFQUpKO0FBSk87QUFESixHQUFQO0FBWUQ7O0FBckJELG1GQXVCQTs7QUFDQSxTQUFnQix3QkFBaEIsQ0FBMEMsSUFBMUMsRUFBd0Q7QUFDdEQsTUFBSSxNQUFNLEdBQUcsRUFBYjtBQUNBLE1BQUksT0FBTyxHQUFHLElBQWQ7O0FBQ0EsTUFBSTtBQUNGLFVBQU0sR0FBRyxRQUFRLENBQUMsU0FBVCxDQUFtQixRQUFuQixDQUE0QixJQUE1QixDQUFpQyxJQUFqQyxDQUFUO0FBQ0EsV0FBTyxHQUFHLE1BQU0sQ0FBQyxTQUFQLENBQWlCLEtBQWpCLENBQXVCLElBQXZCLENBQTRCLE1BQTVCLEVBQW9DLGNBQXBDLENBQVY7QUFDRCxHQUhELENBR0UsT0FBTyxDQUFQLEVBQVUsQ0FDVjtBQUNELEdBUnFELENBU3REOzs7QUFDQSxRQUFNLEtBQUssR0FBRyxPQUFPLElBQUksT0FBTyxDQUFDLENBQUQsQ0FBaEM7QUFDQSxRQUFNLElBQUksR0FBRyxPQUFPLEtBQVAsS0FBaUIsUUFBakIsR0FDVCxJQUFJLEtBQUssQ0FBQyxNQUFOLENBQWEsQ0FBYixFQUFnQixLQUFLLENBQUMsTUFBTixHQUFlLENBQS9CLEVBQWtDLEtBQWxDLENBQXdDLEdBQXhDLEVBQTZDLEdBQTdDLENBQWlELENBQUMsSUFBSSxDQUFDLENBQUMsSUFBRixFQUF0RCxFQUFnRSxJQUFoRSxDQUFxRSxJQUFyRSxDQUEwRSxHQURyRSxHQUVULEtBRko7QUFHQSxRQUFNLElBQUksR0FBRyxPQUFPLElBQUksQ0FBQyxJQUFaLEtBQXFCLFFBQXJCLEdBQWdDLElBQUksQ0FBQyxJQUFyQyxHQUE0QyxFQUF6RDtBQUNBLFNBQU87QUFDTCxXQUFPLEVBQUU7QUFDUCxVQUFJLEVBQUUsVUFEQztBQUVQLGFBQU8sRUFBRSxrQkFBa0IsTUFBTSxDQUFDLElBQUQsQ0FBTSxHQUFHLElBQUksRUFGdkM7QUFHUCxlQUFTLEVBQUUsV0FBVyxDQUFDLEtBQVosQ0FBa0IsSUFBbEI7QUFISjtBQURKLEdBQVA7QUFPRDs7QUF0QkQ7O0FBd0JBLFNBQWdCLDJCQUFoQixDQUE2QyxLQUE3QyxFQUErRDtBQUM3RCxNQUFJO0FBQ0YsV0FBTztBQUNMLGFBQU8sRUFBRTtBQUNQLFlBQUksRUFBRSxhQURDO0FBRVAsZUFBTyxFQUFFLG1FQUFtRSxLQUFLLENBQUMsT0FBTixDQUFjLFdBQWQsRUFBMkIsNkNBRmhHO0FBR1AsYUFBSyxFQUFFLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxVQUFQLENBSHBCO0FBSVAsZUFBTyxFQUFFLENBQ1A7QUFDRSxjQUFJLEVBQUUsT0FEUjtBQUVFLGlCQUFPLEVBQUUsd0JBRlg7QUFHRSxnQkFBTSxFQUFFLE1BQUs7QUFDWDtBQUNBLG1CQUFPLENBQUMsR0FBUixDQUFZLEtBQVo7QUFDRDtBQU5ILFNBRE87QUFKRjtBQURKLEtBQVA7QUFpQkQsR0FsQkQsQ0FrQkUsT0FBTyxDQUFQLEVBQVU7QUFDVixXQUFPO0FBQ0wsYUFBTyxFQUFFO0FBQ1AsWUFBSSxFQUFFLGFBREM7QUFFUCxlQUFPLEVBQUUsK0JBQStCLE1BQU0sQ0FBQyxLQUFELENBQU87QUFGOUM7QUFESixLQUFQO0FBTUQ7QUFDRjs7QUEzQkQ7O0FBNkJBLFNBQVMsb0JBQVQsQ0FBK0IsR0FBL0IsRUFBZ0Q7QUFDOUMsUUFBTSxNQUFNLEdBQVEsRUFBcEI7QUFDQSxRQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBZDs7QUFDQSxPQUFLLElBQUksQ0FBQyxHQUFHLENBQWIsRUFBZ0IsQ0FBQyxHQUFHLENBQXBCLEVBQXVCLENBQUMsRUFBeEIsRUFBNEI7QUFDMUIsVUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUosQ0FBUyxDQUFULENBQWI7QUFDQSxVQUFNLENBQUMsSUFBSSxDQUFDLElBQU4sQ0FBTixHQUFvQixJQUFJLENBQUMsS0FBekI7QUFDRDs7QUFDRCxTQUFPLE1BQVA7QUFDRDs7QUFFRCxTQUFnQixtQkFBaEIsQ0FBcUMsUUFBckMsRUFBK0MsR0FBL0MsRUFBb0QsR0FBcEQsRUFBdUQ7QUFDckQsTUFBSSxLQUFKOztBQUNBLE1BQUksS0FBSyxDQUFDLE9BQU4sQ0FBYyxHQUFkLENBQUosRUFBd0I7QUFDdEIsU0FBSyxHQUFHLEdBQUcsQ0FBQyxHQUFKLENBQVMsQ0FBRCxJQUFPLG1CQUFtQixDQUFDLFFBQUQsRUFBVyxHQUFYLEVBQWdCLENBQWhCLENBQWxDLEVBQXNELEdBQXRELENBQTBELElBQUksSUFBSSxJQUFJLENBQUMsS0FBdkUsQ0FBUjtBQUNELEdBRkQsTUFFTztBQUNMLFFBQUksSUFBSjs7QUFDQSxRQUFJLEdBQUcsQ0FBQyxNQUFSLEVBQWdCO0FBQ2QsVUFBSSxHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxRQUFMLENBQXZCO0FBQ0QsS0FGRCxNQUVPO0FBQ0wsVUFBSSxHQUFHLEdBQUcsQ0FBQyxPQUFKLENBQVksV0FBWixFQUFQO0FBQ0Q7O0FBRUQsU0FBSyxHQUFHO0FBQ04sYUFBTyxFQUFFO0FBQ1AsZUFBTyxFQUFFLE9BQU8sSUFBSSxFQUFYLElBQ04sR0FBRyxDQUFDLEVBQUosR0FBUyx3Q0FBd0MsR0FBRyxDQUFDLEVBQUUsR0FBdkQsR0FBNkQsRUFEdkQsS0FFTixHQUFHLENBQUMsU0FBSixHQUFnQiwyQ0FBMkMsR0FBRyxDQUFDLFNBQVMsR0FBeEUsR0FBOEUsRUFGeEUsSUFFOEUsTUFIaEY7QUFJUCxXQUFHLEVBQUUsUUFBUSxDQUFDLG9CQUpQO0FBS1AsWUFBSSxFQUFFO0FBTEM7QUFESCxLQUFSO0FBU0Q7O0FBQ0QsU0FBTztBQUNMLFFBQUksRUFBRSxPQUREO0FBRUwsT0FBRyxFQUFFLEdBRkE7QUFHTCxTQUhLO0FBSUwsWUFBUSxFQUFFO0FBSkwsR0FBUDtBQU1EOztBQTVCRDs7QUE4QkEsU0FBZ0IsS0FBaEIsQ0FBdUIsSUFBdkIsRUFBa0MsTUFBTSxHQUFHLEtBQTNDLEVBQWdEO0FBQzlDLFNBQU8sTUFBTSxHQUNULHdDQUF3QixJQUF4QixFQUE4QixPQUE5QixDQURTLEdBRVQsd0NBQXdCLElBQXhCLENBRko7QUFHRDs7QUFKRDtBQU1BLE1BQU0sYUFBYSxHQUFHLHdDQUF0QjtBQUNBLE1BQU0sUUFBUSxHQUFHLG9DQUFqQjs7QUFFQSxTQUFTLE9BQVQsQ0FBa0IsR0FBbEIsRUFBdUIsR0FBdkIsRUFBMEI7QUFDeEIsU0FBTyxNQUFNLENBQUMsR0FBRCxDQUFiO0FBQ0Q7O0FBRUQsU0FBZ0IsTUFBaEIsQ0FBd0IsR0FBeEIsRUFBMkI7QUFDekIsTUFBSSxHQUFHLEtBQUssaUJBQVosRUFBdUI7QUFDckIsV0FBTyxTQUFQO0FBQ0QsR0FGRCxNQUVPLElBQUksR0FBRyxLQUFLLGdCQUFaLEVBQXNCO0FBQzNCLFdBQU8sUUFBUDtBQUNELEdBRk0sTUFFQSxJQUFJLEdBQUcsS0FBSyx5QkFBWixFQUErQjtBQUNwQyxXQUFPLENBQUMsUUFBUjtBQUNELEdBRk0sTUFFQSxJQUFJLEdBQUcsS0FBSyxXQUFaLEVBQWlCO0FBQ3RCLFdBQU8sR0FBUDtBQUNELEdBRk0sTUFFQSxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBZixFQUF3QjtBQUM3QixVQUFNO0FBQUUsYUFBTyxFQUFFO0FBQVgsUUFBbUMsR0FBekM7O0FBQ0EsUUFBSSxNQUFNLENBQUMsSUFBUCxLQUFnQixXQUFwQixFQUFpQztBQUMvQixhQUFPLGdDQUFpQixHQUFqQixDQUFxQixNQUFNLENBQUMsRUFBNUIsQ0FBUDtBQUNELEtBRkQsTUFFTyxJQUFJLE1BQU0sQ0FBQyxJQUFQLEtBQWdCLEtBQXBCLEVBQTJCO0FBQ2hDLGFBQU8sU0FBUyxDQUFDLEdBQUQsQ0FBaEI7QUFDRCxLQUZNLE1BRUEsSUFBSSxNQUFNLENBQUMsSUFBUCxLQUFnQixLQUFwQixFQUEyQjtBQUNoQyxhQUFPLFNBQVMsQ0FBQyxHQUFELENBQWhCO0FBQ0QsS0FGTSxNQUVBLElBQUksTUFBTSxDQUFDLFNBQVgsRUFBc0I7QUFDM0IsYUFBTyxXQUFXLENBQUMsSUFBWixDQUFpQixNQUFNLENBQUMsU0FBeEIsQ0FBUDtBQUNELEtBRk0sTUFFQTtBQUNMLGFBQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFSLENBQWI7QUFDRDtBQUNGLEdBYk0sTUFhQSxJQUFJLFFBQVEsQ0FBQyxJQUFULENBQWMsR0FBZCxDQUFKLEVBQXdCO0FBQzdCLFVBQU0sR0FBRyxNQUFILElBQWEsUUFBUSxDQUFDLElBQVQsQ0FBYyxHQUFkLENBQW5CO0FBQ0EsV0FBTyxNQUFNLENBQUMsR0FBUCxDQUFXLE1BQVgsQ0FBUDtBQUNELEdBSE0sTUFHQSxJQUFJLGFBQWEsQ0FBQyxJQUFkLENBQW1CLEdBQW5CLENBQUosRUFBNkI7QUFDbEMsVUFBTSxHQUFHLElBQUgsRUFBUyxNQUFULEdBQWtCLE9BQWxCLElBQTZCLGFBQWEsQ0FBQyxJQUFkLENBQW1CLEdBQW5CLENBQW5DO0FBQ0EsVUFBTSxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBRCxDQUFWLENBQWlCLE1BQWpCLENBQWY7O0FBQ0EsUUFBSSxJQUFJLEtBQUssT0FBVCxJQUFvQixPQUF4QixFQUFpQztBQUMvQixZQUFNLENBQUMsS0FBUCxHQUFlLE9BQWY7QUFDRDs7QUFDRCxXQUFPLE1BQVA7QUFDRCxHQVBNLE1BT0E7QUFDTCxXQUFPLEdBQVA7QUFDRDtBQUNGOztBQW5DRDtBQXFDQTs7Ozs7OztBQU9HOztBQUVILFNBQVMsUUFBVCxDQUFtQixJQUFuQixFQUF1QjtBQUNyQixNQUNFLENBQUMsV0FBVyxDQUFDLElBQUQsQ0FBWixJQUNBLENBQUMsS0FBSyxDQUFDLE9BQU4sQ0FBYyxJQUFkLENBREQsSUFFQSxDQUFDLGFBQWEsQ0FBQyxJQUFELENBSGhCLEVBSUU7QUFDQTtBQUNBO0FBQ0EsV0FBTyxNQUFNLENBQUMsU0FBUCxDQUFpQixRQUFqQixDQUEwQixJQUExQixDQUErQixJQUEvQixDQUFQO0FBQ0QsR0FSRCxNQVFPO0FBQ0wsV0FBTyxJQUFQO0FBQ0Q7QUFDRjs7QUFFRCxTQUFnQixhQUFoQixDQUErQixHQUEvQixFQUFrQztBQUNoQyxTQUFPLE1BQU0sQ0FBQyxTQUFQLENBQWlCLFFBQWpCLENBQTBCLElBQTFCLENBQStCLEdBQS9CLE1BQXdDLGlCQUEvQztBQUNEOztBQUZEOztBQUlBLFNBQVMsV0FBVCxDQUFzQixJQUF0QixFQUEwQjtBQUN4QixNQUFJLElBQUksSUFBSSxJQUFaLEVBQWtCO0FBQ2hCLFdBQU8sSUFBUDtBQUNEOztBQUNELFFBQU0sSUFBSSxHQUFHLE9BQU8sSUFBcEI7QUFDQSxTQUNFLElBQUksS0FBSyxRQUFULElBQ0EsSUFBSSxLQUFLLFFBRFQsSUFFQSxJQUFJLEtBQUssU0FIWDtBQUtEO0FBRUQ7Ozs7O0FBS0c7OztBQUNILFNBQWdCLGtCQUFoQixDQUFvQyxHQUFwQyxFQUF5QyxVQUF6QyxFQUFtRDtBQUNqRCxRQUFNLElBQUksR0FBRyxJQUFJLEdBQUosRUFBYjtBQUNBLFFBQU0sTUFBTSxHQUFHLG9CQUFvQixDQUFDLEdBQUQsRUFBTSxVQUFVLENBQUMsV0FBWCxFQUFOLEVBQWdDLElBQWhDLEVBQXNDLENBQXRDLENBQW5DO0FBQ0EsTUFBSSxDQUFDLEtBQUw7QUFDQSxTQUFPLE1BQVA7QUFDRDs7QUFMRDtBQU9BLE1BQU0sZ0JBQWdCLEdBQUcsRUFBekI7QUFFQTs7Ozs7OztBQU9HOztBQUNILFNBQVMsb0JBQVQsQ0FBK0IsR0FBL0IsRUFBb0MsVUFBcEMsRUFBZ0QsSUFBaEQsRUFBc0QsS0FBdEQsRUFBMkQ7QUFDekQsTUFBSSxLQUFLLEdBQUcsZ0JBQVosRUFBOEI7QUFDNUIsV0FBTyxLQUFQO0FBQ0Q7O0FBQ0QsTUFBSSxLQUFLLEdBQUcsS0FBWjtBQUNBLFFBQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFQLENBQVksR0FBWixDQUFiO0FBQ0EsTUFBSSxHQUFKLEVBQVMsS0FBVDs7QUFDQSxPQUFLLElBQUksQ0FBQyxHQUFHLENBQWIsRUFBZ0IsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUF6QixFQUFpQyxDQUFDLEVBQWxDLEVBQXNDO0FBQ3BDLE9BQUcsR0FBRyxJQUFJLENBQUMsQ0FBRCxDQUFWO0FBQ0EsU0FBSyxHQUFHLEdBQUcsQ0FBQyxHQUFELENBQVg7QUFDQSxTQUFLLEdBQUcsbUJBQW1CLENBQUMsVUFBRCxFQUFhLEdBQWIsRUFBa0IsS0FBbEIsRUFBeUIsSUFBekIsRUFBK0IsS0FBSyxHQUFHLENBQXZDLENBQTNCOztBQUNBLFFBQUksS0FBSixFQUFXO0FBQ1Q7QUFDRDtBQUNGOztBQUNELFNBQU8sS0FBUDtBQUNEO0FBRUQ7Ozs7Ozs7QUFPRzs7O0FBQ0gsU0FBUyxtQkFBVCxDQUE4QixLQUE5QixFQUFxQyxVQUFyQyxFQUFpRCxJQUFqRCxFQUF1RCxLQUF2RCxFQUE0RDtBQUMxRCxNQUFJLEtBQUssR0FBRyxnQkFBWixFQUE4QjtBQUM1QixXQUFPLEtBQVA7QUFDRDs7QUFDRCxNQUFJLEtBQUssR0FBRyxLQUFaO0FBQ0EsTUFBSSxLQUFKOztBQUNBLE9BQUssSUFBSSxDQUFDLEdBQUcsQ0FBYixFQUFnQixDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQTFCLEVBQWtDLENBQUMsRUFBbkMsRUFBdUM7QUFDckMsU0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFELENBQWI7QUFDQSxTQUFLLEdBQUcsbUJBQW1CLENBQUMsVUFBRCxFQUFhLElBQWIsRUFBbUIsS0FBbkIsRUFBMEIsSUFBMUIsRUFBZ0MsS0FBSyxHQUFHLENBQXhDLENBQTNCOztBQUNBLFFBQUksS0FBSixFQUFXO0FBQ1Q7QUFDRDtBQUNGOztBQUNELFNBQU8sS0FBUDtBQUNEO0FBRUQ7Ozs7Ozs7O0FBUUc7OztBQUNILFNBQVMsbUJBQVQsQ0FBOEIsVUFBOUIsRUFBMEMsR0FBMUMsRUFBK0MsS0FBL0MsRUFBc0QsSUFBdEQsRUFBNEQsS0FBNUQsRUFBaUU7QUFDL0QsTUFBSSxLQUFLLEdBQUcsS0FBWjtBQUNBLE1BQUksTUFBSjs7QUFDQSxNQUFJLEdBQUcsS0FBSyxTQUFaLEVBQXVCO0FBQ3JCLE9BQUcsR0FBRyxLQUFLLENBQUMsT0FBWjtBQUNBLFNBQUssR0FBRyxLQUFLLENBQUMsS0FBZDtBQUNEOztBQUNELEdBQUMsTUFBTSxHQUFHLG9CQUFvQixDQUFDLEtBQUQsQ0FBOUIsTUFBMkMsS0FBSyxHQUFHLE1BQW5EOztBQUNBLE1BQUksR0FBRyxJQUFJLE9BQU8sQ0FBQyxHQUFELEVBQU0sVUFBTixDQUFsQixFQUFxQztBQUNuQyxTQUFLLEdBQUcsSUFBUjtBQUNBLFFBQUksQ0FBQyxHQUFMLENBQVMsS0FBVCxFQUFnQixJQUFoQjtBQUNELEdBSEQsTUFHTyxJQUFJLElBQUksQ0FBQyxHQUFMLENBQVMsS0FBVCxDQUFKLEVBQXFCO0FBQzFCLFNBQUssR0FBRyxJQUFJLENBQUMsR0FBTCxDQUFTLEtBQVQsQ0FBUjtBQUNELEdBRk0sTUFFQSxJQUFJLEtBQUssQ0FBQyxPQUFOLENBQWMsS0FBZCxDQUFKLEVBQTBCO0FBQy9CLFFBQUksQ0FBQyxHQUFMLENBQVMsS0FBVCxFQUFnQixJQUFoQjtBQUNBLFNBQUssR0FBRyxtQkFBbUIsQ0FBQyxLQUFELEVBQVEsVUFBUixFQUFvQixJQUFwQixFQUEwQixLQUExQixDQUEzQjtBQUNBLFFBQUksQ0FBQyxHQUFMLENBQVMsS0FBVCxFQUFnQixLQUFoQjtBQUNELEdBSk0sTUFJQSxJQUFJLGFBQWEsQ0FBQyxLQUFELENBQWpCLEVBQTBCO0FBQy9CLFFBQUksQ0FBQyxHQUFMLENBQVMsS0FBVCxFQUFnQixJQUFoQjtBQUNBLFNBQUssR0FBRyxvQkFBb0IsQ0FBQyxLQUFELEVBQVEsVUFBUixFQUFvQixJQUFwQixFQUEwQixLQUExQixDQUE1QjtBQUNBLFFBQUksQ0FBQyxHQUFMLENBQVMsS0FBVCxFQUFnQixLQUFoQjtBQUNELEdBSk0sTUFJQSxJQUFJLE9BQU8sQ0FBQyxLQUFELEVBQVEsVUFBUixDQUFYLEVBQWdDO0FBQ3JDLFNBQUssR0FBRyxJQUFSO0FBQ0EsUUFBSSxDQUFDLEdBQUwsQ0FBUyxLQUFULEVBQWdCLElBQWhCO0FBQ0Q7O0FBQ0QsU0FBTyxLQUFQO0FBQ0Q7QUFFRDs7Ozs7QUFLRzs7O0FBQ0gsU0FBUyxPQUFULENBQWtCLEtBQWxCLEVBQXlCLFVBQXpCLEVBQW1DO0FBQ2pDLFNBQU8sQ0FBQyxLQUFLLEtBQU4sRUFBYSxXQUFiLEdBQTJCLE9BQTNCLENBQW1DLFVBQW5DLE1BQW1ELENBQUMsQ0FBM0Q7QUFDRDs7QUFFRCxTQUFnQixTQUFoQixDQUEyQixLQUEzQixFQUFnQztBQUM5QixTQUFPLEtBQUssSUFBSSxLQUFLLENBQUMsS0FBTixHQUFjLElBQWQsQ0FBbUIsQ0FBQyxDQUFELEVBQUksQ0FBSixLQUFTO0FBQzFDLFFBQUksQ0FBQyxDQUFDLEdBQUYsR0FBUSxDQUFDLENBQUMsR0FBZCxFQUFtQixPQUFPLENBQUMsQ0FBUjtBQUNuQixRQUFJLENBQUMsQ0FBQyxHQUFGLEdBQVEsQ0FBQyxDQUFDLEdBQWQsRUFBbUIsT0FBTyxDQUFQO0FBQ25CLFdBQU8sQ0FBUDtBQUNELEdBSmUsQ0FBaEI7QUFLRDs7QUFORDs7QUFRQSxTQUFnQixTQUFoQixDQUEyQixNQUEzQixFQUFtQyxJQUFuQyxFQUF1QztBQUNyQyxRQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsT0FBTixDQUFjLElBQWQsSUFBc0IsSUFBdEIsR0FBNkIsSUFBSSxDQUFDLEtBQUwsQ0FBVyxHQUFYLENBQTlDOztBQUNBLE9BQUssSUFBSSxDQUFDLEdBQUcsQ0FBYixFQUFnQixDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQTdCLEVBQXFDLENBQUMsRUFBdEMsRUFBMEM7QUFDeEMsVUFBTSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBRCxDQUFULENBQWY7O0FBQ0EsUUFBSSxDQUFDLE1BQUwsRUFBYTtBQUNYLGFBQU8sU0FBUDtBQUNEO0FBQ0Y7O0FBQ0QsU0FBTyxNQUFQO0FBQ0Q7O0FBVEQ7O0FBV0EsU0FBZ0IsVUFBaEIsQ0FBNEIsRUFBNUIsRUFBOEI7QUFDNUIsSUFBRSxDQUFDLEtBQUg7QUFDQSxJQUFFLENBQUMsaUJBQUgsQ0FBcUIsQ0FBckIsRUFBd0IsRUFBRSxDQUFDLEtBQUgsQ0FBUyxNQUFqQztBQUNEOztBQUhEOztBQUtBLFNBQWdCLFlBQWhCLENBQThCLElBQTlCLEVBQWtDO0FBQ2hDO0FBQ0EsUUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQUwsQ0FBYSxLQUFiLEVBQW9CLE1BQXBCLENBQWpCO0FBQ0EsUUFBTSxHQUFHLEdBQUcsVUFBVSx5QkFBVyxnQkFBZ0IseUJBQXlCLFNBQVMsQ0FBQyxJQUFELENBQU07OzBCQUVqRSxRQUFROzt1Q0FFSyxRQUFROzs7Ozs7Ozs7QUFTMUMsS0FiSDs7QUFjQSxNQUFJLGNBQUosRUFBYztBQUNaLGlCQUFPLE1BQVAsQ0FBYyxRQUFkLENBQXVCLGVBQXZCLENBQXVDLElBQXZDLENBQTRDLEdBQTVDO0FBQ0QsR0FGRCxNQUVPO0FBQ0w7QUFDQSxRQUFJLENBQUMsR0FBRCxDQUFKO0FBQ0Q7QUFDRjs7QUF2QkQ7QUF5QkEsTUFBTSxHQUFHLEdBQUc7QUFDVixPQUFLLE1BREs7QUFFVixPQUFLLE1BRks7QUFHVixPQUFLLFFBSEs7QUFJVixPQUFLO0FBSkssQ0FBWjs7QUFPQSxTQUFnQixNQUFoQixDQUF3QixDQUF4QixFQUF5QjtBQUN2QixTQUFPLENBQUMsQ0FBQyxPQUFGLENBQVUsU0FBVixFQUFxQixVQUFyQixDQUFQO0FBQ0Q7O0FBRkQ7O0FBSUEsU0FBUyxVQUFULENBQXFCLENBQXJCLEVBQXNCO0FBQ3BCLFNBQU8sR0FBRyxDQUFDLENBQUQsQ0FBSCxJQUFVLENBQWpCO0FBQ0Q7O0FBRUQsU0FBZ0IsZUFBaEIsQ0FBaUMsS0FBakMsRUFBc0M7QUFDcEMsTUFBSSxPQUFPLFFBQVAsS0FBb0IsV0FBeEIsRUFBcUM7QUFDckMsUUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsVUFBdkIsQ0FBdEI7QUFDQSxlQUFhLENBQUMsV0FBZCxHQUE0QixTQUFTLENBQUMsS0FBRCxDQUFyQztBQUNBLFVBQVEsQ0FBQyxJQUFULENBQWMsV0FBZCxDQUEwQixhQUExQjtBQUNBLGVBQWEsQ0FBQyxNQUFkO0FBQ0EsVUFBUSxDQUFDLFdBQVQsQ0FBcUIsTUFBckI7QUFDQSxVQUFRLENBQUMsSUFBVCxDQUFjLFdBQWQsQ0FBMEIsYUFBMUI7QUFDRDs7QUFSRDs7QUFVQSxTQUFnQixhQUFoQixDQUErQixHQUEvQixFQUFrQztBQUNoQyxTQUFPLEdBQUcsS0FBSyxpQkFBUixJQUFxQixDQUFDLEdBQXRCLElBQTZCLE1BQU0sQ0FBQyxJQUFQLENBQVksR0FBWixFQUFpQixNQUFqQixLQUE0QixDQUFoRTtBQUNEOztBQUZEOzs7Ozs7Ozs7O0FDaHNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVhOztBQUViO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxFQUFFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQSxFQUFFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQjs7QUFFbkI7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQzs7QUFFRDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxrQkFBa0Isc0JBQXNCO0FBQ3hDOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGVBQWU7QUFDZjs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBLG9CQUFvQixTQUFTO0FBQzdCO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxnQkFBZ0I7QUFDaEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7O0FBRUEsa0NBQWtDLFFBQVE7QUFDMUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFD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QXFCdkMsTUFBckI7QUFDQXVCLElBQUFBLFFBQVEsQ0FBQ2lCLGVBQVQsQ0FBeUJDLFdBQXpCLENBQXFDSixNQUFyQztBQUNBQSxJQUFBQSxNQUFNLENBQUNLLFVBQVAsQ0FBa0JDLFdBQWxCLENBQThCTixNQUE5QjtBQUNEO0FBQ0YsQyIsInNvdXJjZXMiOlsid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uL3NyYy90b2FzdC50cyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi9zcmMvYmFja2VuZC50cyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi9zcmMvYnJpZGdlLnRzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uL3NyYy9jb25zdHMudHMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vc3JjL2VkaXQudHMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vc3JjL2Vudi50cyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi9zcmMvaW5kZXgudHMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vc3JjL3BsdWdpbi1wZXJtaXNzaW9ucy50cyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi9zcmMvcGx1Z2luLXNldHRpbmdzLnRzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uL3NyYy9zaGFyZWQtZGF0YS50cyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi9zcmMvc3RvcmFnZS50cyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi9zcmMvdHJhbnNmZXIudHMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vc3JjL3V0aWwudHMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vLi4vbm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vLi4vbm9kZV9tb2R1bGVzL3BhdGgtYnJvd3NlcmlmeS9pbmRleC5qcyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS93ZWJwYWNrL3J1bnRpbWUvY29tcGF0IGdldCBkZWZhdWx0IGV4cG9ydCIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvd2VicGFjay9ydW50aW1lL2dsb2JhbCIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi9zcmMvZGV0ZWN0b3IuanMiXSwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5pbnN0YWxsVG9hc3QgPSB2b2lkIDA7XHJcbmZ1bmN0aW9uIGluc3RhbGxUb2FzdCgpIHtcclxuICAgIC8vIEBUT0RPXHJcbn1cclxuZXhwb3J0cy5pbnN0YWxsVG9hc3QgPSBpbnN0YWxsVG9hc3Q7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXRvYXN0LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuZ2V0Q2F0Y2hlZEdldHRlcnMgPSBleHBvcnRzLmdldEN1c3RvbVN0b3JlRGV0YWlscyA9IGV4cG9ydHMuZ2V0Q3VzdG9tUm91dGVyRGV0YWlscyA9IGV4cG9ydHMuaXNWdWVJbnN0YW5jZSA9IGV4cG9ydHMuZ2V0Q3VzdG9tSW5zdGFuY2VEZXRhaWxzID0gZXhwb3J0cy5nZXRJbnN0YW5jZU1hcCA9IGV4cG9ydHMuYmFja2VuZEluamVjdGlvbnMgPSB2b2lkIDA7XHJcbmV4cG9ydHMuYmFja2VuZEluamVjdGlvbnMgPSB7XHJcbiAgICBpbnN0YW5jZU1hcDogbmV3IE1hcCgpLFxyXG4gICAgaXNWdWVJbnN0YW5jZTogKCgpID0+IGZhbHNlKSxcclxuICAgIGdldEN1c3RvbUluc3RhbmNlRGV0YWlsczogKCgpID0+ICh7fSkpLFxyXG59O1xyXG5mdW5jdGlvbiBnZXRJbnN0YW5jZU1hcCgpIHtcclxuICAgIHJldHVybiBleHBvcnRzLmJhY2tlbmRJbmplY3Rpb25zLmluc3RhbmNlTWFwO1xyXG59XHJcbmV4cG9ydHMuZ2V0SW5zdGFuY2VNYXAgPSBnZXRJbnN0YW5jZU1hcDtcclxuZnVuY3Rpb24gZ2V0Q3VzdG9tSW5zdGFuY2VEZXRhaWxzKGluc3RhbmNlKSB7XHJcbiAgICByZXR1cm4gZXhwb3J0cy5iYWNrZW5kSW5qZWN0aW9ucy5nZXRDdXN0b21JbnN0YW5jZURldGFpbHMoaW5zdGFuY2UpO1xyXG59XHJcbmV4cG9ydHMuZ2V0Q3VzdG9tSW5zdGFuY2VEZXRhaWxzID0gZ2V0Q3VzdG9tSW5zdGFuY2VEZXRhaWxzO1xyXG5mdW5jdGlvbiBpc1Z1ZUluc3RhbmNlKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gZXhwb3J0cy5iYWNrZW5kSW5qZWN0aW9ucy5pc1Z1ZUluc3RhbmNlKHZhbHVlKTtcclxufVxyXG5leHBvcnRzLmlzVnVlSW5zdGFuY2UgPSBpc1Z1ZUluc3RhbmNlO1xyXG4vLyBAVE9ETyByZWZhY3RvclxyXG5mdW5jdGlvbiBnZXRDdXN0b21Sb3V0ZXJEZXRhaWxzKHJvdXRlcikge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBfY3VzdG9tOiB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdyb3V0ZXInLFxyXG4gICAgICAgICAgICBkaXNwbGF5OiAnVnVlUm91dGVyJyxcclxuICAgICAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IHJvdXRlci5vcHRpb25zLFxyXG4gICAgICAgICAgICAgICAgY3VycmVudFJvdXRlOiByb3V0ZXIuY3VycmVudFJvdXRlLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBmaWVsZHM6IHtcclxuICAgICAgICAgICAgICAgIGFic3RyYWN0OiB0cnVlLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuZ2V0Q3VzdG9tUm91dGVyRGV0YWlscyA9IGdldEN1c3RvbVJvdXRlckRldGFpbHM7XHJcbi8vIEBUT0RPIHJlZmFjdG9yXHJcbmZ1bmN0aW9uIGdldEN1c3RvbVN0b3JlRGV0YWlscyhzdG9yZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBfY3VzdG9tOiB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdzdG9yZScsXHJcbiAgICAgICAgICAgIGRpc3BsYXk6ICdTdG9yZScsXHJcbiAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICBzdGF0ZTogc3RvcmUuc3RhdGUsXHJcbiAgICAgICAgICAgICAgICBnZXR0ZXJzOiBnZXRDYXRjaGVkR2V0dGVycyhzdG9yZSksXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGZpZWxkczoge1xyXG4gICAgICAgICAgICAgICAgYWJzdHJhY3Q6IHRydWUsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy5nZXRDdXN0b21TdG9yZURldGFpbHMgPSBnZXRDdXN0b21TdG9yZURldGFpbHM7XHJcbi8vIEBUT0RPIHJlZmFjdG9yXHJcbmZ1bmN0aW9uIGdldENhdGNoZWRHZXR0ZXJzKHN0b3JlKSB7XHJcbiAgICBjb25zdCBnZXR0ZXJzID0ge307XHJcbiAgICBjb25zdCBvcmlnR2V0dGVycyA9IHN0b3JlLmdldHRlcnMgfHwge307XHJcbiAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMob3JpZ0dldHRlcnMpO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgY29uc3Qga2V5ID0ga2V5c1tpXTtcclxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZ2V0dGVycywga2V5LCB7XHJcbiAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgICAgIGdldDogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3JpZ0dldHRlcnNba2V5XTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZ2V0dGVycztcclxufVxyXG5leHBvcnRzLmdldENhdGNoZWRHZXR0ZXJzID0gZ2V0Q2F0Y2hlZEdldHRlcnM7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWJhY2tlbmQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5CcmlkZ2UgPSB2b2lkIDA7XHJcbmNvbnN0IGV2ZW50c18xID0gcmVxdWlyZShcImV2ZW50c1wiKTtcclxuY29uc3QgQkFUQ0hfRFVSQVRJT04gPSAxMDA7XHJcbmNsYXNzIEJyaWRnZSBleHRlbmRzIGV2ZW50c18xLkV2ZW50RW1pdHRlciB7XHJcbiAgICBjb25zdHJ1Y3Rvcih3YWxsKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLnNldE1heExpc3RlbmVycyhJbmZpbml0eSk7XHJcbiAgICAgICAgdGhpcy53YWxsID0gd2FsbDtcclxuICAgICAgICB3YWxsLmxpc3RlbihtZXNzYWdlcyA9PiB7XHJcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG1lc3NhZ2VzKSkge1xyXG4gICAgICAgICAgICAgICAgbWVzc2FnZXMuZm9yRWFjaChtZXNzYWdlID0+IHRoaXMuX2VtaXQobWVzc2FnZSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fZW1pdChtZXNzYWdlcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLl9iYXRjaGluZ1F1ZXVlID0gW107XHJcbiAgICAgICAgdGhpcy5fc2VuZGluZ1F1ZXVlID0gW107XHJcbiAgICAgICAgdGhpcy5fcmVjZWl2aW5nUXVldWUgPSBbXTtcclxuICAgICAgICB0aGlzLl9zZW5kaW5nID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5fdGltZSA9IG51bGw7XHJcbiAgICB9XHJcbiAgICBzZW5kKGV2ZW50LCBwYXlsb2FkKSB7XHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocGF5bG9hZCkpIHtcclxuICAgICAgICAgICAgY29uc3QgbGFzdEluZGV4ID0gcGF5bG9hZC5sZW5ndGggLSAxO1xyXG4gICAgICAgICAgICBwYXlsb2FkLmZvckVhY2goKGNodW5rLCBpbmRleCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fc2VuZCh7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgX2NodW5rOiBjaHVuayxcclxuICAgICAgICAgICAgICAgICAgICBsYXN0OiBpbmRleCA9PT0gbGFzdEluZGV4LFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLl9mbHVzaCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh0aGlzLl90aW1lID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3NlbmQoW3sgZXZlbnQsIHBheWxvYWQgfV0pO1xyXG4gICAgICAgICAgICB0aGlzLl90aW1lID0gRGF0ZS5ub3coKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2JhdGNoaW5nUXVldWUucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBldmVudCxcclxuICAgICAgICAgICAgICAgIHBheWxvYWQsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgICAgICBpZiAobm93IC0gdGhpcy5fdGltZSA+IEJBVENIX0RVUkFUSU9OKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9mbHVzaCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX2ZsdXNoKCksIEJBVENIX0RVUkFUSU9OKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogTG9nIGEgbWVzc2FnZSB0byB0aGUgZGV2dG9vbHMgYmFja2dyb3VuZCBwYWdlLlxyXG4gICAgICovXHJcbiAgICBsb2cobWVzc2FnZSkge1xyXG4gICAgICAgIHRoaXMuc2VuZCgnbG9nJywgbWVzc2FnZSk7XHJcbiAgICB9XHJcbiAgICBfZmx1c2goKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2JhdGNoaW5nUXVldWUubGVuZ3RoKVxyXG4gICAgICAgICAgICB0aGlzLl9zZW5kKHRoaXMuX2JhdGNoaW5nUXVldWUpO1xyXG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl90aW1lcik7XHJcbiAgICAgICAgdGhpcy5fYmF0Y2hpbmdRdWV1ZSA9IFtdO1xyXG4gICAgICAgIHRoaXMuX3RpbWUgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgLy8gQFRPRE8gdHlwZXNcclxuICAgIF9lbWl0KG1lc3NhZ2UpIHtcclxuICAgICAgICBpZiAodHlwZW9mIG1lc3NhZ2UgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW1pdChtZXNzYWdlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAobWVzc2FnZS5fY2h1bmspIHtcclxuICAgICAgICAgICAgdGhpcy5fcmVjZWl2aW5nUXVldWUucHVzaChtZXNzYWdlLl9jaHVuayk7XHJcbiAgICAgICAgICAgIGlmIChtZXNzYWdlLmxhc3QpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdChtZXNzYWdlLmV2ZW50LCB0aGlzLl9yZWNlaXZpbmdRdWV1ZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9yZWNlaXZpbmdRdWV1ZSA9IFtdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKG1lc3NhZ2UuZXZlbnQpIHtcclxuICAgICAgICAgICAgdGhpcy5lbWl0KG1lc3NhZ2UuZXZlbnQsIG1lc3NhZ2UucGF5bG9hZCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gQFRPRE8gdHlwZXNcclxuICAgIF9zZW5kKG1lc3NhZ2VzKSB7XHJcbiAgICAgICAgdGhpcy5fc2VuZGluZ1F1ZXVlLnB1c2gobWVzc2FnZXMpO1xyXG4gICAgICAgIHRoaXMuX25leHRTZW5kKCk7XHJcbiAgICB9XHJcbiAgICBfbmV4dFNlbmQoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9zZW5kaW5nUXVldWUubGVuZ3RoIHx8IHRoaXMuX3NlbmRpbmcpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB0aGlzLl9zZW5kaW5nID0gdHJ1ZTtcclxuICAgICAgICBjb25zdCBtZXNzYWdlcyA9IHRoaXMuX3NlbmRpbmdRdWV1ZS5zaGlmdCgpO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHRoaXMud2FsbC5zZW5kKG1lc3NhZ2VzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBpZiAoZXJyLm1lc3NhZ2UgPT09ICdNZXNzYWdlIGxlbmd0aCBleGNlZWRlZCBtYXhpbXVtIGFsbG93ZWQgbGVuZ3RoLicpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3NlbmRpbmdRdWV1ZS5zcGxpY2UoMCwgMCwgbWVzc2FnZXMubWFwKG1lc3NhZ2UgPT4gW21lc3NhZ2VdKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fc2VuZGluZyA9IGZhbHNlO1xyXG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB0aGlzLl9uZXh0U2VuZCgpKTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkJyaWRnZSA9IEJyaWRnZTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YnJpZGdlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuSG9va0V2ZW50cyA9IGV4cG9ydHMuQnJpZGdlU3Vic2NyaXB0aW9ucyA9IGV4cG9ydHMuQnJpZGdlRXZlbnRzID0gZXhwb3J0cy5CdWlsdGluVGFicyA9IHZvaWQgMDtcclxudmFyIEJ1aWx0aW5UYWJzO1xyXG4oZnVuY3Rpb24gKEJ1aWx0aW5UYWJzKSB7XHJcbiAgICBCdWlsdGluVGFic1tcIkNPTVBPTkVOVFNcIl0gPSBcImNvbXBvbmVudHNcIjtcclxuICAgIEJ1aWx0aW5UYWJzW1wiVElNRUxJTkVcIl0gPSBcInRpbWVsaW5lXCI7XHJcbiAgICBCdWlsdGluVGFic1tcIlBMVUdJTlNcIl0gPSBcInBsdWdpbnNcIjtcclxuICAgIEJ1aWx0aW5UYWJzW1wiU0VUVElOR1NcIl0gPSBcInNldHRpbmdzXCI7XHJcbn0pKEJ1aWx0aW5UYWJzID0gZXhwb3J0cy5CdWlsdGluVGFicyB8fCAoZXhwb3J0cy5CdWlsdGluVGFicyA9IHt9KSk7XHJcbnZhciBCcmlkZ2VFdmVudHM7XHJcbihmdW5jdGlvbiAoQnJpZGdlRXZlbnRzKSB7XHJcbiAgICAvLyBNaXNjXHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX1NVQlNDUklCRVwiXSA9IFwiYjpzdWJzY3JpYmVcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfVU5TVUJTQ1JJQkVcIl0gPSBcImI6dW5zdWJzY3JpYmVcIjtcclxuICAgIC8qKiBCYWNrZW5kIGlzIHJlYWR5ICovXHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19GUk9OVF9SRUFEWVwiXSA9IFwiZjpyZWFkeVwiO1xyXG4gICAgLyoqIERpc3BsYXlzIHRoZSBcImRldGVjdGVkIFZ1ZVwiIGNvbnNvbGUgbG9nICovXHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX0xPR19ERVRFQ1RFRF9WVUVcIl0gPSBcImI6bG9nLWRldGVjdGVkLXZ1ZVwiO1xyXG4gICAgLyoqIEZvcmNlIHJlZnJlc2ggKi9cclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfUkVGUkVTSFwiXSA9IFwiYjpyZWZyZXNoXCI7XHJcbiAgICAvKiogVGFiIHdhcyBzd2l0Y2hlZCAqL1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19UQUJfU1dJVENIXCJdID0gXCJiOnRhYjpzd2l0Y2hcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfTE9HXCJdID0gXCJiOmxvZ1wiO1xyXG4gICAgLy8gQXBwc1xyXG4gICAgLyoqIEFwcCB3YXMgcmVnaXN0ZXJlZCAqL1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fRlJPTlRfQVBQX0FERFwiXSA9IFwiZjphcHA6YWRkXCI7XHJcbiAgICAvKiogR2V0IGFwcCBsaXN0ICovXHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX0FQUF9MSVNUXCJdID0gXCJiOmFwcDpsaXN0XCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19GUk9OVF9BUFBfTElTVFwiXSA9IFwiZjphcHA6bGlzdFwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fRlJPTlRfQVBQX1JFTU9WRVwiXSA9IFwiZjphcHA6cmVtb3ZlXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX0FQUF9TRUxFQ1RcIl0gPSBcImI6YXBwOnNlbGVjdFwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fRlJPTlRfQVBQX1NFTEVDVEVEXCJdID0gXCJmOmFwcDpzZWxlY3RlZFwiO1xyXG4gICAgLy8gQ29tcG9uZW50c1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19DT01QT05FTlRfVFJFRVwiXSA9IFwiYjpjb21wb25lbnQ6dHJlZVwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fRlJPTlRfQ09NUE9ORU5UX1RSRUVcIl0gPSBcImY6Y29tcG9uZW50OnRyZWVcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfQ09NUE9ORU5UX1NFTEVDVEVEX0RBVEFcIl0gPSBcImI6Y29tcG9uZW50OnNlbGVjdGVkLWRhdGFcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0ZST05UX0NPTVBPTkVOVF9TRUxFQ1RFRF9EQVRBXCJdID0gXCJmOmNvbXBvbmVudDpzZWxlY3RlZC1kYXRhXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX0NPTVBPTkVOVF9FWFBBTkRcIl0gPSBcImI6Y29tcG9uZW50OmV4cGFuZFwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fRlJPTlRfQ09NUE9ORU5UX0VYUEFORFwiXSA9IFwiZjpjb21wb25lbnQ6ZXhwYW5kXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX0NPTVBPTkVOVF9TQ1JPTExfVE9cIl0gPSBcImI6Y29tcG9uZW50OnNjcm9sbC10b1wiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19DT01QT05FTlRfRklMVEVSXCJdID0gXCJiOmNvbXBvbmVudDpmaWx0ZXJcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfQ09NUE9ORU5UX01PVVNFX09WRVJcIl0gPSBcImI6Y29tcG9uZW50Om1vdXNlLW92ZXJcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfQ09NUE9ORU5UX01PVVNFX09VVFwiXSA9IFwiYjpjb21wb25lbnQ6bW91c2Utb3V0XCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX0NPTVBPTkVOVF9DT05URVhUX01FTlVfVEFSR0VUXCJdID0gXCJiOmNvbXBvbmVudDpjb250ZXh0LW1lbnUtdGFyZ2V0XCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX0NPTVBPTkVOVF9FRElUX1NUQVRFXCJdID0gXCJiOmNvbXBvbmVudDplZGl0LXN0YXRlXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX0NPTVBPTkVOVF9QSUNLXCJdID0gXCJiOmNvbXBvbmVudDpwaWNrXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19GUk9OVF9DT01QT05FTlRfUElDS1wiXSA9IFwiZjpjb21wb25lbnQ6cGlja1wiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19DT01QT05FTlRfUElDS19DQU5DRUxFRFwiXSA9IFwiYjpjb21wb25lbnQ6cGljay1jYW5jZWxlZFwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fRlJPTlRfQ09NUE9ORU5UX1BJQ0tfQ0FOQ0VMRURcIl0gPSBcImY6Y29tcG9uZW50OnBpY2stY2FuY2VsZWRcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfQ09NUE9ORU5UX0lOU1BFQ1RfRE9NXCJdID0gXCJiOmNvbXBvbmVudDppbnNwZWN0LWRvbVwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fRlJPTlRfQ09NUE9ORU5UX0lOU1BFQ1RfRE9NXCJdID0gXCJmOmNvbXBvbmVudDppbnNwZWN0LWRvbVwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19DT01QT05FTlRfUkVOREVSX0NPREVcIl0gPSBcImI6Y29tcG9uZW50OnJlbmRlci1jb2RlXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19GUk9OVF9DT01QT05FTlRfUkVOREVSX0NPREVcIl0gPSBcImY6Y29tcG9uZW50OnJlbmRlci1jb2RlXCI7XHJcbiAgICAvLyBUaW1lbGluZVxyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fRlJPTlRfVElNRUxJTkVfRVZFTlRcIl0gPSBcImY6dGltZWxpbmU6ZXZlbnRcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfVElNRUxJTkVfTEFZRVJfTElTVFwiXSA9IFwiYjp0aW1lbGluZTpsYXllci1saXN0XCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19GUk9OVF9USU1FTElORV9MQVlFUl9MSVNUXCJdID0gXCJmOnRpbWVsaW5lOmxheWVyLWxpc3RcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0ZST05UX1RJTUVMSU5FX0xBWUVSX0FERFwiXSA9IFwiZjp0aW1lbGluZTpsYXllci1hZGRcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfVElNRUxJTkVfU0hPV19TQ1JFRU5TSE9UXCJdID0gXCJiOnRpbWVsaW5lOnNob3ctc2NyZWVuc2hvdFwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19USU1FTElORV9DTEVBUlwiXSA9IFwiYjp0aW1lbGluZTpjbGVhclwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19USU1FTElORV9FVkVOVF9EQVRBXCJdID0gXCJiOnRpbWVsaW5lOmV2ZW50LWRhdGFcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0ZST05UX1RJTUVMSU5FX0VWRU5UX0RBVEFcIl0gPSBcImY6dGltZWxpbmU6ZXZlbnQtZGF0YVwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19USU1FTElORV9MQVlFUl9MT0FEX0VWRU5UU1wiXSA9IFwiYjp0aW1lbGluZTpsYXllci1sb2FkLWV2ZW50c1wiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fRlJPTlRfVElNRUxJTkVfTEFZRVJfTE9BRF9FVkVOVFNcIl0gPSBcImY6dGltZWxpbmU6bGF5ZXItbG9hZC1ldmVudHNcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfVElNRUxJTkVfTE9BRF9NQVJLRVJTXCJdID0gXCJiOnRpbWVsaW5lOmxvYWQtbWFya2Vyc1wiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fRlJPTlRfVElNRUxJTkVfTE9BRF9NQVJLRVJTXCJdID0gXCJmOnRpbWVsaW5lOmxvYWQtbWFya2Vyc1wiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fRlJPTlRfVElNRUxJTkVfTUFSS0VSXCJdID0gXCJmOnRpbWVsaW5lOm1hcmtlclwiO1xyXG4gICAgLy8gUGx1Z2luc1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19ERVZUT09MU19QTFVHSU5fTElTVFwiXSA9IFwiYjpkZXZ0b29scy1wbHVnaW46bGlzdFwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fRlJPTlRfREVWVE9PTFNfUExVR0lOX0xJU1RcIl0gPSBcImY6ZGV2dG9vbHMtcGx1Z2luOmxpc3RcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0ZST05UX0RFVlRPT0xTX1BMVUdJTl9BRERcIl0gPSBcImY6ZGV2dG9vbHMtcGx1Z2luOmFkZFwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19ERVZUT09MU19QTFVHSU5fU0VUVElOR19VUERBVEVEXCJdID0gXCJiOmRldnRvb2xzLXBsdWdpbjpzZXR0aW5nLXVwZGF0ZWRcIjtcclxuICAgIC8vIEN1c3RvbSBpbnNwZWN0b3JzXHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX0NVU1RPTV9JTlNQRUNUT1JfTElTVFwiXSA9IFwiYjpjdXN0b20taW5zcGVjdG9yOmxpc3RcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0ZST05UX0NVU1RPTV9JTlNQRUNUT1JfTElTVFwiXSA9IFwiZjpjdXN0b20taW5zcGVjdG9yOmxpc3RcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0ZST05UX0NVU1RPTV9JTlNQRUNUT1JfQUREXCJdID0gXCJmOmN1c3RvbS1pbnNwZWN0b3I6YWRkXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX0NVU1RPTV9JTlNQRUNUT1JfVFJFRVwiXSA9IFwiYjpjdXN0b20taW5zcGVjdG9yOnRyZWVcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0ZST05UX0NVU1RPTV9JTlNQRUNUT1JfVFJFRVwiXSA9IFwiZjpjdXN0b20taW5zcGVjdG9yOnRyZWVcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfQ1VTVE9NX0lOU1BFQ1RPUl9TVEFURVwiXSA9IFwiYjpjdXN0b20taW5zcGVjdG9yOnN0YXRlXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19GUk9OVF9DVVNUT01fSU5TUEVDVE9SX1NUQVRFXCJdID0gXCJmOmN1c3RvbS1pbnNwZWN0b3I6c3RhdGVcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfQ1VTVE9NX0lOU1BFQ1RPUl9FRElUX1NUQVRFXCJdID0gXCJiOmN1c3RvbS1pbnNwZWN0b3I6ZWRpdC1zdGF0ZVwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19DVVNUT01fSU5TUEVDVE9SX0FDVElPTlwiXSA9IFwiYjpjdXN0b20taW5zcGVjdG9yOmFjdGlvblwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fRlJPTlRfQ1VTVE9NX0lOU1BFQ1RPUl9TRUxFQ1RfTk9ERVwiXSA9IFwiZjpjdXN0b20taW5zcGVjdG9yOnNlbGVjdC1ub2RlXCI7XHJcbiAgICAvLyBDdXN0b20gc3RhdGVcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfQ1VTVE9NX1NUQVRFX0FDVElPTlwiXSA9IFwiYjpjdXN0b20tc3RhdGU6YWN0aW9uXCI7XHJcbn0pKEJyaWRnZUV2ZW50cyA9IGV4cG9ydHMuQnJpZGdlRXZlbnRzIHx8IChleHBvcnRzLkJyaWRnZUV2ZW50cyA9IHt9KSk7XHJcbnZhciBCcmlkZ2VTdWJzY3JpcHRpb25zO1xyXG4oZnVuY3Rpb24gKEJyaWRnZVN1YnNjcmlwdGlvbnMpIHtcclxuICAgIEJyaWRnZVN1YnNjcmlwdGlvbnNbXCJTRUxFQ1RFRF9DT01QT05FTlRfREFUQVwiXSA9IFwiY29tcG9uZW50OnNlbGVjdGVkLWRhdGFcIjtcclxuICAgIEJyaWRnZVN1YnNjcmlwdGlvbnNbXCJDT01QT05FTlRfVFJFRVwiXSA9IFwiY29tcG9uZW50OnRyZWVcIjtcclxufSkoQnJpZGdlU3Vic2NyaXB0aW9ucyA9IGV4cG9ydHMuQnJpZGdlU3Vic2NyaXB0aW9ucyB8fCAoZXhwb3J0cy5CcmlkZ2VTdWJzY3JpcHRpb25zID0ge30pKTtcclxudmFyIEhvb2tFdmVudHM7XHJcbihmdW5jdGlvbiAoSG9va0V2ZW50cykge1xyXG4gICAgSG9va0V2ZW50c1tcIklOSVRcIl0gPSBcImluaXRcIjtcclxuICAgIEhvb2tFdmVudHNbXCJBUFBfSU5JVFwiXSA9IFwiYXBwOmluaXRcIjtcclxuICAgIEhvb2tFdmVudHNbXCJBUFBfQUREXCJdID0gXCJhcHA6YWRkXCI7XHJcbiAgICBIb29rRXZlbnRzW1wiQVBQX1VOTU9VTlRcIl0gPSBcImFwcDp1bm1vdW50XCI7XHJcbiAgICBIb29rRXZlbnRzW1wiQ09NUE9ORU5UX1VQREFURURcIl0gPSBcImNvbXBvbmVudDp1cGRhdGVkXCI7XHJcbiAgICBIb29rRXZlbnRzW1wiQ09NUE9ORU5UX0FEREVEXCJdID0gXCJjb21wb25lbnQ6YWRkZWRcIjtcclxuICAgIEhvb2tFdmVudHNbXCJDT01QT05FTlRfUkVNT1ZFRFwiXSA9IFwiY29tcG9uZW50OnJlbW92ZWRcIjtcclxuICAgIEhvb2tFdmVudHNbXCJDT01QT05FTlRfRU1JVFwiXSA9IFwiY29tcG9uZW50OmVtaXRcIjtcclxuICAgIEhvb2tFdmVudHNbXCJDT01QT05FTlRfSElHSExJR0hUXCJdID0gXCJjb21wb25lbnQ6aGlnaGxpZ2h0XCI7XHJcbiAgICBIb29rRXZlbnRzW1wiQ09NUE9ORU5UX1VOSElHSExJR0hUXCJdID0gXCJjb21wb25lbnQ6dW5oaWdobGlnaHRcIjtcclxuICAgIEhvb2tFdmVudHNbXCJTRVRVUF9ERVZUT09MU19QTFVHSU5cIl0gPSBcImRldnRvb2xzLXBsdWdpbjpzZXR1cFwiO1xyXG4gICAgSG9va0V2ZW50c1tcIlRJTUVMSU5FX0xBWUVSX0FEREVEXCJdID0gXCJ0aW1lbGluZTpsYXllci1hZGRlZFwiO1xyXG4gICAgSG9va0V2ZW50c1tcIlRJTUVMSU5FX0VWRU5UX0FEREVEXCJdID0gXCJ0aW1lbGluZTpldmVudC1hZGRlZFwiO1xyXG4gICAgSG9va0V2ZW50c1tcIkNVU1RPTV9JTlNQRUNUT1JfQUREXCJdID0gXCJjdXN0b20taW5zcGVjdG9yOmFkZFwiO1xyXG4gICAgSG9va0V2ZW50c1tcIkNVU1RPTV9JTlNQRUNUT1JfU0VORF9UUkVFXCJdID0gXCJjdXN0b20taW5zcGVjdG9yOnNlbmQtdHJlZVwiO1xyXG4gICAgSG9va0V2ZW50c1tcIkNVU1RPTV9JTlNQRUNUT1JfU0VORF9TVEFURVwiXSA9IFwiY3VzdG9tLWluc3BlY3RvcjpzZW5kLXN0YXRlXCI7XHJcbiAgICBIb29rRXZlbnRzW1wiQ1VTVE9NX0lOU1BFQ1RPUl9TRUxFQ1RfTk9ERVwiXSA9IFwiY3VzdG9tLWluc3BlY3RvcjpzZWxlY3Qtbm9kZVwiO1xyXG4gICAgSG9va0V2ZW50c1tcIlBFUkZPUk1BTkNFX1NUQVJUXCJdID0gXCJwZXJmOnN0YXJ0XCI7XHJcbiAgICBIb29rRXZlbnRzW1wiUEVSRk9STUFOQ0VfRU5EXCJdID0gXCJwZXJmOmVuZFwiO1xyXG4gICAgSG9va0V2ZW50c1tcIlBMVUdJTl9TRVRUSU5HU19TRVRcIl0gPSBcInBsdWdpbjpzZXR0aW5nczpzZXRcIjtcclxuICAgIC8qKlxyXG4gICAgICogQGRlcHJlY2F0ZWRcclxuICAgICAqL1xyXG4gICAgSG9va0V2ZW50c1tcIkZMVVNIXCJdID0gXCJmbHVzaFwiO1xyXG59KShIb29rRXZlbnRzID0gZXhwb3J0cy5Ib29rRXZlbnRzIHx8IChleHBvcnRzLkhvb2tFdmVudHMgPSB7fSkpO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1jb25zdHMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5TdGF0ZUVkaXRvciA9IHZvaWQgMDtcclxuY2xhc3MgU3RhdGVFZGl0b3Ige1xyXG4gICAgc2V0KG9iamVjdCwgcGF0aCwgdmFsdWUsIGNiID0gbnVsbCkge1xyXG4gICAgICAgIGNvbnN0IHNlY3Rpb25zID0gQXJyYXkuaXNBcnJheShwYXRoKSA/IHBhdGggOiBwYXRoLnNwbGl0KCcuJyk7XHJcbiAgICAgICAgd2hpbGUgKHNlY3Rpb25zLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgb2JqZWN0ID0gb2JqZWN0W3NlY3Rpb25zLnNoaWZ0KCldO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5pc1JlZihvYmplY3QpKSB7XHJcbiAgICAgICAgICAgICAgICBvYmplY3QgPSB0aGlzLmdldFJlZlZhbHVlKG9iamVjdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgZmllbGQgPSBzZWN0aW9uc1swXTtcclxuICAgICAgICBpZiAoY2IpIHtcclxuICAgICAgICAgICAgY2Iob2JqZWN0LCBmaWVsZCwgdmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh0aGlzLmlzUmVmKG9iamVjdFtmaWVsZF0pKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0UmVmVmFsdWUob2JqZWN0W2ZpZWxkXSwgdmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgb2JqZWN0W2ZpZWxkXSA9IHZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGdldChvYmplY3QsIHBhdGgpIHtcclxuICAgICAgICBjb25zdCBzZWN0aW9ucyA9IEFycmF5LmlzQXJyYXkocGF0aCkgPyBwYXRoIDogcGF0aC5zcGxpdCgnLicpO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VjdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgb2JqZWN0ID0gb2JqZWN0W3NlY3Rpb25zW2ldXTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuaXNSZWYob2JqZWN0KSkge1xyXG4gICAgICAgICAgICAgICAgb2JqZWN0ID0gdGhpcy5nZXRSZWZWYWx1ZShvYmplY3QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghb2JqZWN0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBvYmplY3Q7XHJcbiAgICB9XHJcbiAgICBoYXMob2JqZWN0LCBwYXRoLCBwYXJlbnQgPSBmYWxzZSkge1xyXG4gICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0ID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHNlY3Rpb25zID0gQXJyYXkuaXNBcnJheShwYXRoKSA/IHBhdGguc2xpY2UoKSA6IHBhdGguc3BsaXQoJy4nKTtcclxuICAgICAgICBjb25zdCBzaXplID0gIXBhcmVudCA/IDEgOiAyO1xyXG4gICAgICAgIHdoaWxlIChvYmplY3QgJiYgc2VjdGlvbnMubGVuZ3RoID4gc2l6ZSkge1xyXG4gICAgICAgICAgICBvYmplY3QgPSBvYmplY3Rbc2VjdGlvbnMuc2hpZnQoKV07XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzUmVmKG9iamVjdCkpIHtcclxuICAgICAgICAgICAgICAgIG9iamVjdCA9IHRoaXMuZ2V0UmVmVmFsdWUob2JqZWN0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gb2JqZWN0ICE9IG51bGwgJiYgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgc2VjdGlvbnNbMF0pO1xyXG4gICAgfVxyXG4gICAgY3JlYXRlRGVmYXVsdFNldENhbGxiYWNrKHN0YXRlKSB7XHJcbiAgICAgICAgcmV0dXJuIChvYmosIGZpZWxkLCB2YWx1ZSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoc3RhdGUucmVtb3ZlIHx8IHN0YXRlLm5ld0tleSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob2JqKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9iai5zcGxpY2UoZmllbGQsIDEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG9ialtmaWVsZF07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCFzdGF0ZS5yZW1vdmUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IG9ialtzdGF0ZS5uZXdLZXkgfHwgZmllbGRdO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNSZWYodGFyZ2V0KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0UmVmVmFsdWUodGFyZ2V0LCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBvYmpbc3RhdGUubmV3S2V5IHx8IGZpZWxkXSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIGlzUmVmKHJlZikge1xyXG4gICAgICAgIC8vIFRvIGltcGxlbWVudCBpbiBzdWJjbGFzc1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHNldFJlZlZhbHVlKHJlZiwgdmFsdWUpIHtcclxuICAgICAgICAvLyBUbyBpbXBsZW1lbnQgaW4gc3ViY2xhc3NcclxuICAgIH1cclxuICAgIGdldFJlZlZhbHVlKHJlZikge1xyXG4gICAgICAgIC8vIFRvIGltcGxlbWVudCBpbiBzdWJjbGFzc1xyXG4gICAgICAgIHJldHVybiByZWY7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5TdGF0ZUVkaXRvciA9IFN0YXRlRWRpdG9yO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1lZGl0LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuaW5pdEVudiA9IGV4cG9ydHMua2V5cyA9IGV4cG9ydHMuaXNMaW51eCA9IGV4cG9ydHMuaXNNYWMgPSBleHBvcnRzLmlzV2luZG93cyA9IGV4cG9ydHMuaXNGaXJlZm94ID0gZXhwb3J0cy5pc0Nocm9tZSA9IGV4cG9ydHMudGFyZ2V0ID0gZXhwb3J0cy5pc0Jyb3dzZXIgPSB2b2lkIDA7XHJcbmV4cG9ydHMuaXNCcm93c2VyID0gdHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCc7XHJcbmV4cG9ydHMudGFyZ2V0ID0gZXhwb3J0cy5pc0Jyb3dzZXJcclxuICAgID8gd2luZG93XHJcbiAgICA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnXHJcbiAgICAgICAgPyBnbG9iYWxcclxuICAgICAgICA6IHt9O1xyXG5leHBvcnRzLmlzQ2hyb21lID0gdHlwZW9mIGV4cG9ydHMudGFyZ2V0LmNocm9tZSAhPT0gJ3VuZGVmaW5lZCcgJiYgISFleHBvcnRzLnRhcmdldC5jaHJvbWUuZGV2dG9vbHM7XHJcbmV4cG9ydHMuaXNGaXJlZm94ID0gZXhwb3J0cy5pc0Jyb3dzZXIgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdGaXJlZm94JykgPiAtMTtcclxuZXhwb3J0cy5pc1dpbmRvd3MgPSBleHBvcnRzLmlzQnJvd3NlciAmJiBuYXZpZ2F0b3IucGxhdGZvcm0uaW5kZXhPZignV2luJykgPT09IDA7XHJcbmV4cG9ydHMuaXNNYWMgPSBleHBvcnRzLmlzQnJvd3NlciAmJiBuYXZpZ2F0b3IucGxhdGZvcm0gPT09ICdNYWNJbnRlbCc7XHJcbmV4cG9ydHMuaXNMaW51eCA9IGV4cG9ydHMuaXNCcm93c2VyICYmIG5hdmlnYXRvci5wbGF0Zm9ybS5pbmRleE9mKCdMaW51eCcpID09PSAwO1xyXG5leHBvcnRzLmtleXMgPSB7XHJcbiAgICBjdHJsOiBleHBvcnRzLmlzTWFjID8gJyYjODk4NDsnIDogJ0N0cmwnLFxyXG4gICAgc2hpZnQ6ICdTaGlmdCcsXHJcbiAgICBhbHQ6IGV4cG9ydHMuaXNNYWMgPyAnJiM4OTk3OycgOiAnQWx0JyxcclxuICAgIGRlbDogJ0RlbCcsXHJcbiAgICBlbnRlcjogJ0VudGVyJyxcclxuICAgIGVzYzogJ0VzYycsXHJcbn07XHJcbmZ1bmN0aW9uIGluaXRFbnYoVnVlKSB7XHJcbiAgICBpZiAoVnVlLnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSgnJGlzQ2hyb21lJykpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoVnVlLnByb3RvdHlwZSwge1xyXG4gICAgICAgICRpc0Nocm9tZTogeyBnZXQ6ICgpID0+IGV4cG9ydHMuaXNDaHJvbWUgfSxcclxuICAgICAgICAkaXNGaXJlZm94OiB7IGdldDogKCkgPT4gZXhwb3J0cy5pc0ZpcmVmb3ggfSxcclxuICAgICAgICAkaXNXaW5kb3dzOiB7IGdldDogKCkgPT4gZXhwb3J0cy5pc1dpbmRvd3MgfSxcclxuICAgICAgICAkaXNNYWM6IHsgZ2V0OiAoKSA9PiBleHBvcnRzLmlzTWFjIH0sXHJcbiAgICAgICAgJGlzTGludXg6IHsgZ2V0OiAoKSA9PiBleHBvcnRzLmlzTGludXggfSxcclxuICAgICAgICAka2V5czogeyBnZXQ6ICgpID0+IGV4cG9ydHMua2V5cyB9LFxyXG4gICAgfSk7XHJcbiAgICBpZiAoZXhwb3J0cy5pc1dpbmRvd3MpXHJcbiAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdwbGF0Zm9ybS13aW5kb3dzJyk7XHJcbiAgICBpZiAoZXhwb3J0cy5pc01hYylcclxuICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ3BsYXRmb3JtLW1hYycpO1xyXG4gICAgaWYgKGV4cG9ydHMuaXNMaW51eClcclxuICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ3BsYXRmb3JtLWxpbnV4Jyk7XHJcbn1cclxuZXhwb3J0cy5pbml0RW52ID0gaW5pdEVudjtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZW52LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgX19jcmVhdGVCaW5kaW5nID0gKHRoaXMgJiYgdGhpcy5fX2NyZWF0ZUJpbmRpbmcpIHx8IChPYmplY3QuY3JlYXRlID8gKGZ1bmN0aW9uKG8sIG0sIGssIGsyKSB7XHJcbiAgICBpZiAoazIgPT09IHVuZGVmaW5lZCkgazIgPSBrO1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG8sIGsyLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24oKSB7IHJldHVybiBtW2tdOyB9IH0pO1xyXG59KSA6IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xyXG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgIG9bazJdID0gbVtrXTtcclxufSkpO1xyXG52YXIgX19leHBvcnRTdGFyID0gKHRoaXMgJiYgdGhpcy5fX2V4cG9ydFN0YXIpIHx8IGZ1bmN0aW9uKG0sIGV4cG9ydHMpIHtcclxuICAgIGZvciAodmFyIHAgaW4gbSkgaWYgKHAgIT09IFwiZGVmYXVsdFwiICYmICFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoZXhwb3J0cywgcCkpIF9fY3JlYXRlQmluZGluZyhleHBvcnRzLCBtLCBwKTtcclxufTtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vYmFja2VuZFwiKSwgZXhwb3J0cyk7XHJcbl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9icmlkZ2VcIiksIGV4cG9ydHMpO1xyXG5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vY29uc3RzXCIpLCBleHBvcnRzKTtcclxuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL2VkaXRcIiksIGV4cG9ydHMpO1xyXG5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vZW52XCIpLCBleHBvcnRzKTtcclxuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL3BsdWdpbi1wZXJtaXNzaW9uc1wiKSwgZXhwb3J0cyk7XHJcbl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9wbHVnaW4tc2V0dGluZ3NcIiksIGV4cG9ydHMpO1xyXG5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vc2hhcmVkLWRhdGFcIiksIGV4cG9ydHMpO1xyXG5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vc2hlbGxcIiksIGV4cG9ydHMpO1xyXG5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vc3RvcmFnZVwiKSwgZXhwb3J0cyk7XHJcbl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi90cmFuc2ZlclwiKSwgZXhwb3J0cyk7XHJcbl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi91dGlsXCIpLCBleHBvcnRzKTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5zZXRQbHVnaW5QZXJtaXNzaW9uID0gZXhwb3J0cy5oYXNQbHVnaW5QZXJtaXNzaW9uID0gZXhwb3J0cy5QbHVnaW5QZXJtaXNzaW9uID0gdm9pZCAwO1xyXG5jb25zdCBzaGFyZWRfZGF0YV8xID0gcmVxdWlyZShcIi4vc2hhcmVkLWRhdGFcIik7XHJcbnZhciBQbHVnaW5QZXJtaXNzaW9uO1xyXG4oZnVuY3Rpb24gKFBsdWdpblBlcm1pc3Npb24pIHtcclxuICAgIFBsdWdpblBlcm1pc3Npb25bXCJFTkFCTEVEXCJdID0gXCJlbmFibGVkXCI7XHJcbiAgICBQbHVnaW5QZXJtaXNzaW9uW1wiQ09NUE9ORU5UU1wiXSA9IFwiY29tcG9uZW50c1wiO1xyXG4gICAgUGx1Z2luUGVybWlzc2lvbltcIkNVU1RPTV9JTlNQRUNUT1JcIl0gPSBcImN1c3RvbS1pbnNwZWN0b3JcIjtcclxuICAgIFBsdWdpblBlcm1pc3Npb25bXCJUSU1FTElORVwiXSA9IFwidGltZWxpbmVcIjtcclxufSkoUGx1Z2luUGVybWlzc2lvbiA9IGV4cG9ydHMuUGx1Z2luUGVybWlzc2lvbiB8fCAoZXhwb3J0cy5QbHVnaW5QZXJtaXNzaW9uID0ge30pKTtcclxuZnVuY3Rpb24gaGFzUGx1Z2luUGVybWlzc2lvbihwbHVnaW5JZCwgcGVybWlzc2lvbikge1xyXG4gICAgY29uc3QgcmVzdWx0ID0gc2hhcmVkX2RhdGFfMS5TaGFyZWREYXRhLnBsdWdpblBlcm1pc3Npb25zW2Ake3BsdWdpbklkfToke3Blcm1pc3Npb259YF07XHJcbiAgICBpZiAocmVzdWx0ID09IG51bGwpXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICByZXR1cm4gISFyZXN1bHQ7XHJcbn1cclxuZXhwb3J0cy5oYXNQbHVnaW5QZXJtaXNzaW9uID0gaGFzUGx1Z2luUGVybWlzc2lvbjtcclxuZnVuY3Rpb24gc2V0UGx1Z2luUGVybWlzc2lvbihwbHVnaW5JZCwgcGVybWlzc2lvbiwgYWN0aXZlKSB7XHJcbiAgICBzaGFyZWRfZGF0YV8xLlNoYXJlZERhdGEucGx1Z2luUGVybWlzc2lvbnMgPSB7XHJcbiAgICAgICAgLi4uc2hhcmVkX2RhdGFfMS5TaGFyZWREYXRhLnBsdWdpblBlcm1pc3Npb25zLFxyXG4gICAgICAgIFtgJHtwbHVnaW5JZH06JHtwZXJtaXNzaW9ufWBdOiBhY3RpdmUsXHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuc2V0UGx1Z2luUGVybWlzc2lvbiA9IHNldFBsdWdpblBlcm1pc3Npb247XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXBsdWdpbi1wZXJtaXNzaW9ucy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLmdldFBsdWdpbkRlZmF1bHRTZXR0aW5ncyA9IGV4cG9ydHMuc2V0UGx1Z2luU2V0dGluZ3MgPSBleHBvcnRzLmdldFBsdWdpblNldHRpbmdzID0gdm9pZCAwO1xyXG5jb25zdCBzaGFyZWRfZGF0YV8xID0gcmVxdWlyZShcIi4vc2hhcmVkLWRhdGFcIik7XHJcbmZ1bmN0aW9uIGdldFBsdWdpblNldHRpbmdzKHBsdWdpbklkLCBkZWZhdWx0U2V0dGluZ3MpIHtcclxuICAgIHZhciBfYTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgLi4uZGVmYXVsdFNldHRpbmdzICE9PSBudWxsICYmIGRlZmF1bHRTZXR0aW5ncyAhPT0gdm9pZCAwID8gZGVmYXVsdFNldHRpbmdzIDoge30sXHJcbiAgICAgICAgLi4uKF9hID0gc2hhcmVkX2RhdGFfMS5TaGFyZWREYXRhLnBsdWdpblNldHRpbmdzW3BsdWdpbklkXSkgIT09IG51bGwgJiYgX2EgIT09IHZvaWQgMCA/IF9hIDoge30sXHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuZ2V0UGx1Z2luU2V0dGluZ3MgPSBnZXRQbHVnaW5TZXR0aW5ncztcclxuZnVuY3Rpb24gc2V0UGx1Z2luU2V0dGluZ3MocGx1Z2luSWQsIHNldHRpbmdzKSB7XHJcbiAgICBzaGFyZWRfZGF0YV8xLlNoYXJlZERhdGEucGx1Z2luU2V0dGluZ3MgPSB7XHJcbiAgICAgICAgLi4uc2hhcmVkX2RhdGFfMS5TaGFyZWREYXRhLnBsdWdpblNldHRpbmdzLFxyXG4gICAgICAgIFtwbHVnaW5JZF06IHNldHRpbmdzLFxyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLnNldFBsdWdpblNldHRpbmdzID0gc2V0UGx1Z2luU2V0dGluZ3M7XHJcbmZ1bmN0aW9uIGdldFBsdWdpbkRlZmF1bHRTZXR0aW5ncyhzY2hlbWEpIHtcclxuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xyXG4gICAgaWYgKHNjaGVtYSkge1xyXG4gICAgICAgIGZvciAoY29uc3QgaWQgaW4gc2NoZW1hKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSBzY2hlbWFbaWRdO1xyXG4gICAgICAgICAgICByZXN1bHRbaWRdID0gaXRlbS5kZWZhdWx0VmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5leHBvcnRzLmdldFBsdWdpbkRlZmF1bHRTZXR0aW5ncyA9IGdldFBsdWdpbkRlZmF1bHRTZXR0aW5ncztcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cGx1Z2luLXNldHRpbmdzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuU2hhcmVkRGF0YSA9IGV4cG9ydHMud2F0Y2hTaGFyZWREYXRhID0gZXhwb3J0cy5kZXN0cm95U2hhcmVkRGF0YSA9IGV4cG9ydHMub25TaGFyZWREYXRhSW5pdCA9IGV4cG9ydHMuaW5pdFNoYXJlZERhdGEgPSB2b2lkIDA7XHJcbmNvbnN0IHN0b3JhZ2VfMSA9IHJlcXVpcmUoXCIuL3N0b3JhZ2VcIik7XHJcbmNvbnN0IGVudl8xID0gcmVxdWlyZShcIi4vZW52XCIpO1xyXG4vLyBJbml0aWFsIHN0YXRlXHJcbmNvbnN0IGludGVybmFsU2hhcmVkRGF0YSA9IHtcclxuICAgIG9wZW5JbkVkaXRvckhvc3Q6ICcvJyxcclxuICAgIGNvbXBvbmVudE5hbWVTdHlsZTogJ2NsYXNzJyxcclxuICAgIHRoZW1lOiAnYXV0bycsXHJcbiAgICBkaXNwbGF5RGVuc2l0eTogJ2xvdycsXHJcbiAgICB0aW1lRm9ybWF0OiAnZGVmYXVsdCcsXHJcbiAgICByZWNvcmRWdWV4OiB0cnVlLFxyXG4gICAgY2FjaGVWdWV4U25hcHNob3RzRXZlcnk6IDUwLFxyXG4gICAgY2FjaGVWdWV4U25hcHNob3RzTGltaXQ6IDEwLFxyXG4gICAgc25hcHNob3RMb2FkaW5nOiBmYWxzZSxcclxuICAgIGNvbXBvbmVudEV2ZW50c0VuYWJsZWQ6IHRydWUsXHJcbiAgICBwZXJmb3JtYW5jZU1vbml0b3JpbmdFbmFibGVkOiB0cnVlLFxyXG4gICAgZWRpdGFibGVQcm9wczogZmFsc2UsXHJcbiAgICBsb2dEZXRlY3RlZDogdHJ1ZSxcclxuICAgIHZ1ZXhOZXdCYWNrZW5kOiBmYWxzZSxcclxuICAgIHZ1ZXhBdXRvbG9hZDogZmFsc2UsXHJcbiAgICB2dWV4R3JvdXBHZXR0ZXJzQnlNb2R1bGU6IHRydWUsXHJcbiAgICBzaG93TWVudVNjcm9sbFRpcDogdHJ1ZSxcclxuICAgIHRpbWVsaW5lVGltZUdyaWQ6IHRydWUsXHJcbiAgICB0aW1lbGluZVNjcmVlbnNob3RzOiB0cnVlLFxyXG4gICAgbWVudVN0ZXBTY3JvbGxpbmc6IGVudl8xLmlzTWFjLFxyXG4gICAgcGx1Z2luUGVybWlzc2lvbnM6IHt9LFxyXG4gICAgcGx1Z2luU2V0dGluZ3M6IHt9LFxyXG4gICAgcGFnZUNvbmZpZzoge30sXHJcbiAgICBkZWJ1Z0luZm86IGZhbHNlLFxyXG59O1xyXG5jb25zdCBwZXJzaXN0ZWQgPSBbXHJcbiAgICAnY29tcG9uZW50TmFtZVN0eWxlJyxcclxuICAgICd0aGVtZScsXHJcbiAgICAnZGlzcGxheURlbnNpdHknLFxyXG4gICAgJ3JlY29yZFZ1ZXgnLFxyXG4gICAgJ2VkaXRhYmxlUHJvcHMnLFxyXG4gICAgJ2xvZ0RldGVjdGVkJyxcclxuICAgICd2dWV4TmV3QmFja2VuZCcsXHJcbiAgICAndnVleEF1dG9sb2FkJyxcclxuICAgICd2dWV4R3JvdXBHZXR0ZXJzQnlNb2R1bGUnLFxyXG4gICAgJ3RpbWVGb3JtYXQnLFxyXG4gICAgJ3Nob3dNZW51U2Nyb2xsVGlwJyxcclxuICAgICd0aW1lbGluZVRpbWVHcmlkJyxcclxuICAgICd0aW1lbGluZVNjcmVlbnNob3RzJyxcclxuICAgICdtZW51U3RlcFNjcm9sbGluZycsXHJcbiAgICAncGx1Z2luUGVybWlzc2lvbnMnLFxyXG4gICAgJ3BsdWdpblNldHRpbmdzJyxcclxuICAgICdwZXJmb3JtYW5jZU1vbml0b3JpbmdFbmFibGVkJyxcclxuICAgICdjb21wb25lbnRFdmVudHNFbmFibGVkJyxcclxuICAgICdkZWJ1Z0luZm8nLFxyXG5dO1xyXG5jb25zdCBzdG9yYWdlVmVyc2lvbiA9ICc2LjAuMC1hbHBoYS4xJztcclxuLy8gLS0tLSBJTlRFUk5BTFMgLS0tLSAvL1xyXG5sZXQgYnJpZGdlO1xyXG4vLyBMaXN0IG9mIGZpZWxkcyB0byBwZXJzaXN0IHRvIHN0b3JhZ2UgKGRpc2FibGVkIGlmICdmYWxzZScpXHJcbi8vIFRoaXMgc2hvdWxkIGJlIHVuaXF1ZSB0byBlYWNoIHNoYXJlZCBkYXRhIGNsaWVudCB0byBwcmV2ZW50IGNvbmZsaWN0c1xyXG5sZXQgcGVyc2lzdCA9IGZhbHNlO1xyXG5sZXQgZGF0YTtcclxubGV0IGluaXRSZXRyeUludGVydmFsO1xyXG5sZXQgaW5pdFJldHJ5Q291bnQgPSAwO1xyXG5jb25zdCBpbml0Q2JzID0gW107XHJcbmZ1bmN0aW9uIGluaXRTaGFyZWREYXRhKHBhcmFtcykge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgLy8gTWFuZGF0b3J5IHBhcmFtc1xyXG4gICAgICAgIGJyaWRnZSA9IHBhcmFtcy5icmlkZ2U7XHJcbiAgICAgICAgcGVyc2lzdCA9ICEhcGFyYW1zLnBlcnNpc3Q7XHJcbiAgICAgICAgaWYgKHBlcnNpc3QpIHtcclxuICAgICAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcclxuICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW3NoYXJlZCBkYXRhXSBNYXN0ZXIgaW5pdCBpbiBwcm9ncmVzcy4uLicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIExvYWQgcGVyc2lzdGVkIGZpZWxkc1xyXG4gICAgICAgICAgICBwZXJzaXN0ZWQuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSAoMCwgc3RvcmFnZV8xLmdldFN0b3JhZ2UpKGB2dWUtZGV2dG9vbHMtJHtzdG9yYWdlVmVyc2lvbn06c2hhcmVkLWRhdGE6JHtrZXl9YCk7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgIT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBpbnRlcm5hbFNoYXJlZERhdGFba2V5XSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgYnJpZGdlLm9uKCdzaGFyZWQtZGF0YTpsb2FkJywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgLy8gU2VuZCBhbGwgZmllbGRzXHJcbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhpbnRlcm5hbFNoYXJlZERhdGEpLmZvckVhY2goa2V5ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBzZW5kVmFsdWUoa2V5LCBpbnRlcm5hbFNoYXJlZERhdGFba2V5XSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGJyaWRnZS5zZW5kKCdzaGFyZWQtZGF0YTpsb2FkLWNvbXBsZXRlJyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBicmlkZ2Uub24oJ3NoYXJlZC1kYXRhOmluaXQtY29tcGxldGUnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tzaGFyZWQgZGF0YV0gTWFzdGVyIGluaXQgY29tcGxldGUnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW5pdFJldHJ5SW50ZXJ2YWwpO1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgYnJpZGdlLnNlbmQoJ3NoYXJlZC1kYXRhOm1hc3Rlci1pbml0LXdhaXRpbmcnKTtcclxuICAgICAgICAgICAgLy8gSW4gY2FzZSBiYWNrZW5kIGluaXQgaXMgZXhlY3V0ZWQgYWZ0ZXIgZnJvbnRlbmRcclxuICAgICAgICAgICAgYnJpZGdlLm9uKCdzaGFyZWQtZGF0YTptaW5pb24taW5pdC13YWl0aW5nJywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgYnJpZGdlLnNlbmQoJ3NoYXJlZC1kYXRhOm1hc3Rlci1pbml0LXdhaXRpbmcnKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGluaXRSZXRyeUNvdW50ID0gMDtcclxuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbml0UmV0cnlJbnRlcnZhbCk7XHJcbiAgICAgICAgICAgIGluaXRSZXRyeUludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbc2hhcmVkIGRhdGFdIE1hc3RlciBpbml0IHJldHJ5aW5nLi4uJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmlkZ2Uuc2VuZCgnc2hhcmVkLWRhdGE6bWFzdGVyLWluaXQtd2FpdGluZycpO1xyXG4gICAgICAgICAgICAgICAgaW5pdFJldHJ5Q291bnQrKztcclxuICAgICAgICAgICAgICAgIGlmIChpbml0UmV0cnlDb3VudCA+IDMwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbml0UmV0cnlJbnRlcnZhbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW3NoYXJlZCBkYXRhXSBNYXN0ZXIgaW5pdCBmYWlsZWQnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSwgMjAwMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbc2hhcmVkIGRhdGFdIE1pbmlvbiBpbml0IGluIHByb2dyZXNzLi4uJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYnJpZGdlLm9uKCdzaGFyZWQtZGF0YTptYXN0ZXItaW5pdC13YWl0aW5nJywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbc2hhcmVkIGRhdGFdIE1pbmlvbiBsb2FkaW5nIGRhdGEuLi4nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIExvYWQgYWxsIHBlcnNpc3RlZCBzaGFyZWQgZGF0YVxyXG4gICAgICAgICAgICAgICAgYnJpZGdlLnNlbmQoJ3NoYXJlZC1kYXRhOmxvYWQnKTtcclxuICAgICAgICAgICAgICAgIGJyaWRnZS5vbmNlKCdzaGFyZWQtZGF0YTpsb2FkLWNvbXBsZXRlJywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbc2hhcmVkIGRhdGFdIE1pbmlvbiBpbml0IGNvbXBsZXRlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJyaWRnZS5zZW5kKCdzaGFyZWQtZGF0YTppbml0LWNvbXBsZXRlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBicmlkZ2Uuc2VuZCgnc2hhcmVkLWRhdGE6bWluaW9uLWluaXQtd2FpdGluZycpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBkYXRhID0ge1xyXG4gICAgICAgICAgICAuLi5pbnRlcm5hbFNoYXJlZERhdGEsXHJcbiAgICAgICAgfTtcclxuICAgICAgICBpZiAocGFyYW1zLlZ1ZSkge1xyXG4gICAgICAgICAgICBkYXRhID0gcGFyYW1zLlZ1ZS5vYnNlcnZhYmxlKGRhdGEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBVcGRhdGUgdmFsdWUgZnJvbSBvdGhlciBzaGFyZWQgZGF0YSBjbGllbnRzXHJcbiAgICAgICAgYnJpZGdlLm9uKCdzaGFyZWQtZGF0YTpzZXQnLCAoeyBrZXksIHZhbHVlIH0pID0+IHtcclxuICAgICAgICAgICAgc2V0VmFsdWUoa2V5LCB2YWx1ZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaW5pdENicy5mb3JFYWNoKGNiID0+IGNiKCkpO1xyXG4gICAgfSk7XHJcbn1cclxuZXhwb3J0cy5pbml0U2hhcmVkRGF0YSA9IGluaXRTaGFyZWREYXRhO1xyXG5mdW5jdGlvbiBvblNoYXJlZERhdGFJbml0KGNiKSB7XHJcbiAgICBpbml0Q2JzLnB1c2goY2IpO1xyXG4gICAgcmV0dXJuICgpID0+IHtcclxuICAgICAgICBjb25zdCBpbmRleCA9IGluaXRDYnMuaW5kZXhPZihjYik7XHJcbiAgICAgICAgaWYgKGluZGV4ICE9PSAtMSlcclxuICAgICAgICAgICAgaW5pdENicy5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLm9uU2hhcmVkRGF0YUluaXQgPSBvblNoYXJlZERhdGFJbml0O1xyXG5mdW5jdGlvbiBkZXN0cm95U2hhcmVkRGF0YSgpIHtcclxuICAgIGJyaWRnZS5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3NoYXJlZC1kYXRhOnNldCcpO1xyXG4gICAgd2F0Y2hlcnMgPSB7fTtcclxufVxyXG5leHBvcnRzLmRlc3Ryb3lTaGFyZWREYXRhID0gZGVzdHJveVNoYXJlZERhdGE7XHJcbmxldCB3YXRjaGVycyA9IHt9O1xyXG5mdW5jdGlvbiBzZXRWYWx1ZShrZXksIHZhbHVlKSB7XHJcbiAgICAvLyBTdG9yYWdlXHJcbiAgICBpZiAocGVyc2lzdCAmJiBwZXJzaXN0ZWQuaW5jbHVkZXMoa2V5KSkge1xyXG4gICAgICAgICgwLCBzdG9yYWdlXzEuc2V0U3RvcmFnZSkoYHZ1ZS1kZXZ0b29scy0ke3N0b3JhZ2VWZXJzaW9ufTpzaGFyZWQtZGF0YToke2tleX1gLCB2YWx1ZSk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBvbGRWYWx1ZSA9IGRhdGFba2V5XTtcclxuICAgIGRhdGFba2V5XSA9IHZhbHVlO1xyXG4gICAgY29uc3QgaGFuZGxlcnMgPSB3YXRjaGVyc1trZXldO1xyXG4gICAgaWYgKGhhbmRsZXJzKSB7XHJcbiAgICAgICAgaGFuZGxlcnMuZm9yRWFjaChoID0+IGgodmFsdWUsIG9sZFZhbHVlKSk7XHJcbiAgICB9XHJcbiAgICAvLyBWYWxpZGF0ZSBQcm94eSBzZXQgdHJhcFxyXG4gICAgcmV0dXJuIHRydWU7XHJcbn1cclxuZnVuY3Rpb24gc2VuZFZhbHVlKGtleSwgdmFsdWUpIHtcclxuICAgIGJyaWRnZSAmJiBicmlkZ2Uuc2VuZCgnc2hhcmVkLWRhdGE6c2V0Jywge1xyXG4gICAgICAgIGtleSxcclxuICAgICAgICB2YWx1ZSxcclxuICAgIH0pO1xyXG59XHJcbmZ1bmN0aW9uIHdhdGNoU2hhcmVkRGF0YShwcm9wLCBoYW5kbGVyKSB7XHJcbiAgICBjb25zdCBsaXN0ID0gd2F0Y2hlcnNbcHJvcF0gfHwgKHdhdGNoZXJzW3Byb3BdID0gW10pO1xyXG4gICAgbGlzdC5wdXNoKGhhbmRsZXIpO1xyXG4gICAgcmV0dXJuICgpID0+IHtcclxuICAgICAgICBjb25zdCBpbmRleCA9IGxpc3QuaW5kZXhPZihoYW5kbGVyKTtcclxuICAgICAgICBpZiAoaW5kZXggIT09IC0xKVxyXG4gICAgICAgICAgICBsaXN0LnNwbGljZShpbmRleCwgMSk7XHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMud2F0Y2hTaGFyZWREYXRhID0gd2F0Y2hTaGFyZWREYXRhO1xyXG5jb25zdCBwcm94eSA9IHt9O1xyXG5PYmplY3Qua2V5cyhpbnRlcm5hbFNoYXJlZERhdGEpLmZvckVhY2goa2V5ID0+IHtcclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm94eSwga2V5LCB7XHJcbiAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcclxuICAgICAgICBnZXQ6ICgpID0+IGRhdGFba2V5XSxcclxuICAgICAgICBzZXQ6ICh2YWx1ZSkgPT4ge1xyXG4gICAgICAgICAgICBzZW5kVmFsdWUoa2V5LCB2YWx1ZSk7XHJcbiAgICAgICAgICAgIHNldFZhbHVlKGtleSwgdmFsdWUpO1xyXG4gICAgICAgIH0sXHJcbiAgICB9KTtcclxufSk7XHJcbmV4cG9ydHMuU2hhcmVkRGF0YSA9IHByb3h5O1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1zaGFyZWQtZGF0YS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLmNsZWFyU3RvcmFnZSA9IGV4cG9ydHMucmVtb3ZlU3RvcmFnZSA9IGV4cG9ydHMuc2V0U3RvcmFnZSA9IGV4cG9ydHMuZ2V0U3RvcmFnZSA9IGV4cG9ydHMuaW5pdFN0b3JhZ2UgPSB2b2lkIDA7XHJcbmNvbnN0IGVudl8xID0gcmVxdWlyZShcIi4vZW52XCIpO1xyXG4vLyBJZiB3ZSBjYW4sIHdlIHVzZSB0aGUgYnJvd3NlciBleHRlbnNpb24gQVBJIHRvIHN0b3JlIGRhdGFcclxuLy8gaXQncyBhc3luYyB0aG91Z2gsIHNvIHdlIHN5bmNocm9uaXplIGNoYW5nZXMgZnJvbSBhbiBpbnRlcm1lZGlhdGVcclxuLy8gc3RvcmFnZURhdGEgb2JqZWN0XHJcbmNvbnN0IHVzZVN0b3JhZ2UgPSB0eXBlb2YgZW52XzEudGFyZ2V0LmNocm9tZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIGVudl8xLnRhcmdldC5jaHJvbWUuc3RvcmFnZSAhPT0gJ3VuZGVmaW5lZCc7XHJcbmxldCBzdG9yYWdlRGF0YSA9IG51bGw7XHJcbmZ1bmN0aW9uIGluaXRTdG9yYWdlKCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgaWYgKHVzZVN0b3JhZ2UpIHtcclxuICAgICAgICAgICAgZW52XzEudGFyZ2V0LmNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChudWxsLCByZXN1bHQgPT4ge1xyXG4gICAgICAgICAgICAgICAgc3RvcmFnZURhdGEgPSByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgc3RvcmFnZURhdGEgPSB7fTtcclxuICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbmV4cG9ydHMuaW5pdFN0b3JhZ2UgPSBpbml0U3RvcmFnZTtcclxuZnVuY3Rpb24gZ2V0U3RvcmFnZShrZXksIGRlZmF1bHRWYWx1ZSA9IG51bGwpIHtcclxuICAgIGNoZWNrU3RvcmFnZSgpO1xyXG4gICAgaWYgKHVzZVN0b3JhZ2UpIHtcclxuICAgICAgICByZXR1cm4gZ2V0RGVmYXVsdFZhbHVlKHN0b3JhZ2VEYXRhW2tleV0sIGRlZmF1bHRWYWx1ZSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICByZXR1cm4gZ2V0RGVmYXVsdFZhbHVlKEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSksIGRlZmF1bHRWYWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlKSB7IH1cclxuICAgIH1cclxufVxyXG5leHBvcnRzLmdldFN0b3JhZ2UgPSBnZXRTdG9yYWdlO1xyXG5mdW5jdGlvbiBzZXRTdG9yYWdlKGtleSwgdmFsKSB7XHJcbiAgICBjaGVja1N0b3JhZ2UoKTtcclxuICAgIGlmICh1c2VTdG9yYWdlKSB7XHJcbiAgICAgICAgc3RvcmFnZURhdGFba2V5XSA9IHZhbDtcclxuICAgICAgICBlbnZfMS50YXJnZXQuY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsgW2tleV06IHZhbCB9KTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgSlNPTi5zdHJpbmdpZnkodmFsKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlKSB7IH1cclxuICAgIH1cclxufVxyXG5leHBvcnRzLnNldFN0b3JhZ2UgPSBzZXRTdG9yYWdlO1xyXG5mdW5jdGlvbiByZW1vdmVTdG9yYWdlKGtleSkge1xyXG4gICAgY2hlY2tTdG9yYWdlKCk7XHJcbiAgICBpZiAodXNlU3RvcmFnZSkge1xyXG4gICAgICAgIGRlbGV0ZSBzdG9yYWdlRGF0YVtrZXldO1xyXG4gICAgICAgIGVudl8xLnRhcmdldC5jaHJvbWUuc3RvcmFnZS5sb2NhbC5yZW1vdmUoW2tleV0pO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oa2V5KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGUpIHsgfVxyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMucmVtb3ZlU3RvcmFnZSA9IHJlbW92ZVN0b3JhZ2U7XHJcbmZ1bmN0aW9uIGNsZWFyU3RvcmFnZSgpIHtcclxuICAgIGNoZWNrU3RvcmFnZSgpO1xyXG4gICAgaWYgKHVzZVN0b3JhZ2UpIHtcclxuICAgICAgICBzdG9yYWdlRGF0YSA9IHt9O1xyXG4gICAgICAgIGVudl8xLnRhcmdldC5jaHJvbWUuc3RvcmFnZS5sb2NhbC5jbGVhcigpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLmNsZWFyKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlKSB7IH1cclxuICAgIH1cclxufVxyXG5leHBvcnRzLmNsZWFyU3RvcmFnZSA9IGNsZWFyU3RvcmFnZTtcclxuZnVuY3Rpb24gY2hlY2tTdG9yYWdlKCkge1xyXG4gICAgaWYgKCFzdG9yYWdlRGF0YSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU3RvcmFnZSB3YXNuXFwndCBpbml0aWFsaXplZCB3aXRoIFxcJ2luaXQoKVxcJycpO1xyXG4gICAgfVxyXG59XHJcbmZ1bmN0aW9uIGdldERlZmF1bHRWYWx1ZSh2YWx1ZSwgZGVmYXVsdFZhbHVlKSB7XHJcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xyXG4gICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmFsdWU7XHJcbn1cclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c3RvcmFnZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLnN0cmluZ2lmeVN0cmljdENpcmN1bGFyQXV0b0NodW5rcyA9IGV4cG9ydHMucGFyc2VDaXJjdWxhckF1dG9DaHVua3MgPSBleHBvcnRzLnN0cmluZ2lmeUNpcmN1bGFyQXV0b0NodW5rcyA9IHZvaWQgMDtcclxuY29uc3QgTUFYX1NFUklBTElaRURfU0laRSA9IDUxMiAqIDEwMjQ7IC8vIDFNQlxyXG5mdW5jdGlvbiBlbmNvZGUoZGF0YSwgcmVwbGFjZXIsIGxpc3QsIHNlZW4pIHtcclxuICAgIGxldCBzdG9yZWQsIGtleSwgdmFsdWUsIGksIGw7XHJcbiAgICBjb25zdCBzZWVuSW5kZXggPSBzZWVuLmdldChkYXRhKTtcclxuICAgIGlmIChzZWVuSW5kZXggIT0gbnVsbCkge1xyXG4gICAgICAgIHJldHVybiBzZWVuSW5kZXg7XHJcbiAgICB9XHJcbiAgICBjb25zdCBpbmRleCA9IGxpc3QubGVuZ3RoO1xyXG4gICAgY29uc3QgcHJvdG8gPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZGF0YSk7XHJcbiAgICBpZiAocHJvdG8gPT09ICdbb2JqZWN0IE9iamVjdF0nKSB7XHJcbiAgICAgICAgc3RvcmVkID0ge307XHJcbiAgICAgICAgc2Vlbi5zZXQoZGF0YSwgaW5kZXgpO1xyXG4gICAgICAgIGxpc3QucHVzaChzdG9yZWQpO1xyXG4gICAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhkYXRhKTtcclxuICAgICAgICBmb3IgKGkgPSAwLCBsID0ga2V5cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICAgICAga2V5ID0ga2V5c1tpXTtcclxuICAgICAgICAgICAgdmFsdWUgPSBkYXRhW2tleV07XHJcbiAgICAgICAgICAgIGlmIChyZXBsYWNlcilcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gcmVwbGFjZXIuY2FsbChkYXRhLCBrZXksIHZhbHVlKTtcclxuICAgICAgICAgICAgc3RvcmVkW2tleV0gPSBlbmNvZGUodmFsdWUsIHJlcGxhY2VyLCBsaXN0LCBzZWVuKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChwcm90byA9PT0gJ1tvYmplY3QgQXJyYXldJykge1xyXG4gICAgICAgIHN0b3JlZCA9IFtdO1xyXG4gICAgICAgIHNlZW4uc2V0KGRhdGEsIGluZGV4KTtcclxuICAgICAgICBsaXN0LnB1c2goc3RvcmVkKTtcclxuICAgICAgICBmb3IgKGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICAgICAgdmFsdWUgPSBkYXRhW2ldO1xyXG4gICAgICAgICAgICBpZiAocmVwbGFjZXIpXHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHJlcGxhY2VyLmNhbGwoZGF0YSwgaSwgdmFsdWUpO1xyXG4gICAgICAgICAgICBzdG9yZWRbaV0gPSBlbmNvZGUodmFsdWUsIHJlcGxhY2VyLCBsaXN0LCBzZWVuKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBsaXN0LnB1c2goZGF0YSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gaW5kZXg7XHJcbn1cclxuZnVuY3Rpb24gZGVjb2RlKGxpc3QsIHJldml2ZXIpIHtcclxuICAgIGxldCBpID0gbGlzdC5sZW5ndGg7XHJcbiAgICBsZXQgaiwgaywgZGF0YSwga2V5LCB2YWx1ZSwgcHJvdG87XHJcbiAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgZGF0YSA9IGxpc3RbaV07XHJcbiAgICAgICAgcHJvdG8gPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZGF0YSk7XHJcbiAgICAgICAgaWYgKHByb3RvID09PSAnW29iamVjdCBPYmplY3RdJykge1xyXG4gICAgICAgICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoZGF0YSk7XHJcbiAgICAgICAgICAgIGZvciAoaiA9IDAsIGsgPSBrZXlzLmxlbmd0aDsgaiA8IGs7IGorKykge1xyXG4gICAgICAgICAgICAgICAga2V5ID0ga2V5c1tqXTtcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gbGlzdFtkYXRhW2tleV1dO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJldml2ZXIpXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSByZXZpdmVyLmNhbGwoZGF0YSwga2V5LCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICBkYXRhW2tleV0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChwcm90byA9PT0gJ1tvYmplY3QgQXJyYXldJykge1xyXG4gICAgICAgICAgICBmb3IgKGogPSAwLCBrID0gZGF0YS5sZW5ndGg7IGogPCBrOyBqKyspIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gbGlzdFtkYXRhW2pdXTtcclxuICAgICAgICAgICAgICAgIGlmIChyZXZpdmVyKVxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gcmV2aXZlci5jYWxsKGRhdGEsIGosIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIGRhdGFbal0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiBzdHJpbmdpZnlDaXJjdWxhckF1dG9DaHVua3MoZGF0YSwgcmVwbGFjZXIgPSBudWxsLCBzcGFjZSA9IG51bGwpIHtcclxuICAgIGxldCByZXN1bHQ7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHJlc3VsdCA9IGFyZ3VtZW50cy5sZW5ndGggPT09IDFcclxuICAgICAgICAgICAgPyBKU09OLnN0cmluZ2lmeShkYXRhKVxyXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXHJcbiAgICAgICAgICAgIDogSlNPTi5zdHJpbmdpZnkoZGF0YSwgcmVwbGFjZXIsIHNwYWNlKTtcclxuICAgIH1cclxuICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgcmVzdWx0ID0gc3RyaW5naWZ5U3RyaWN0Q2lyY3VsYXJBdXRvQ2h1bmtzKGRhdGEsIHJlcGxhY2VyLCBzcGFjZSk7XHJcbiAgICB9XHJcbiAgICBpZiAocmVzdWx0Lmxlbmd0aCA+IE1BWF9TRVJJQUxJWkVEX1NJWkUpIHtcclxuICAgICAgICBjb25zdCBjaHVua0NvdW50ID0gTWF0aC5jZWlsKHJlc3VsdC5sZW5ndGggLyBNQVhfU0VSSUFMSVpFRF9TSVpFKTtcclxuICAgICAgICBjb25zdCBjaHVua3MgPSBbXTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNodW5rQ291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICBjaHVua3MucHVzaChyZXN1bHQuc2xpY2UoaSAqIE1BWF9TRVJJQUxJWkVEX1NJWkUsIChpICsgMSkgKiBNQVhfU0VSSUFMSVpFRF9TSVpFKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBjaHVua3M7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcbmV4cG9ydHMuc3RyaW5naWZ5Q2lyY3VsYXJBdXRvQ2h1bmtzID0gc3RyaW5naWZ5Q2lyY3VsYXJBdXRvQ2h1bmtzO1xyXG5mdW5jdGlvbiBwYXJzZUNpcmN1bGFyQXV0b0NodW5rcyhkYXRhLCByZXZpdmVyID0gbnVsbCkge1xyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZGF0YSkpIHtcclxuICAgICAgICBkYXRhID0gZGF0YS5qb2luKCcnKTtcclxuICAgIH1cclxuICAgIGNvbnN0IGhhc0NpcmN1bGFyID0gL15cXHMvLnRlc3QoZGF0YSk7XHJcbiAgICBpZiAoIWhhc0NpcmN1bGFyKSB7XHJcbiAgICAgICAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGggPT09IDFcclxuICAgICAgICAgICAgPyBKU09OLnBhcnNlKGRhdGEpXHJcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcclxuICAgICAgICAgICAgOiBKU09OLnBhcnNlKGRhdGEsIHJldml2ZXIpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgY29uc3QgbGlzdCA9IEpTT04ucGFyc2UoZGF0YSk7XHJcbiAgICAgICAgZGVjb2RlKGxpc3QsIHJldml2ZXIpO1xyXG4gICAgICAgIHJldHVybiBsaXN0WzBdO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMucGFyc2VDaXJjdWxhckF1dG9DaHVua3MgPSBwYXJzZUNpcmN1bGFyQXV0b0NodW5rcztcclxuZnVuY3Rpb24gc3RyaW5naWZ5U3RyaWN0Q2lyY3VsYXJBdXRvQ2h1bmtzKGRhdGEsIHJlcGxhY2VyID0gbnVsbCwgc3BhY2UgPSBudWxsKSB7XHJcbiAgICBjb25zdCBsaXN0ID0gW107XHJcbiAgICBlbmNvZGUoZGF0YSwgcmVwbGFjZXIsIGxpc3QsIG5ldyBNYXAoKSk7XHJcbiAgICByZXR1cm4gc3BhY2VcclxuICAgICAgICA/ICcgJyArIEpTT04uc3RyaW5naWZ5KGxpc3QsIG51bGwsIHNwYWNlKVxyXG4gICAgICAgIDogJyAnICsgSlNPTi5zdHJpbmdpZnkobGlzdCk7XHJcbn1cclxuZXhwb3J0cy5zdHJpbmdpZnlTdHJpY3RDaXJjdWxhckF1dG9DaHVua3MgPSBzdHJpbmdpZnlTdHJpY3RDaXJjdWxhckF1dG9DaHVua3M7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXRyYW5zZmVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcclxuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xyXG59O1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuaXNFbXB0eU9iamVjdCA9IGV4cG9ydHMuY29weVRvQ2xpcGJvYXJkID0gZXhwb3J0cy5lc2NhcGUgPSBleHBvcnRzLm9wZW5JbkVkaXRvciA9IGV4cG9ydHMuZm9jdXNJbnB1dCA9IGV4cG9ydHMuc2ltcGxlR2V0ID0gZXhwb3J0cy5zb3J0QnlLZXkgPSBleHBvcnRzLnNlYXJjaERlZXBJbk9iamVjdCA9IGV4cG9ydHMuaXNQbGFpbk9iamVjdCA9IGV4cG9ydHMucmV2aXZlID0gZXhwb3J0cy5wYXJzZSA9IGV4cG9ydHMuZ2V0Q3VzdG9tUmVmRGV0YWlscyA9IGV4cG9ydHMuZ2V0Q3VzdG9tSFRNTEVsZW1lbnREZXRhaWxzID0gZXhwb3J0cy5nZXRDdXN0b21GdW5jdGlvbkRldGFpbHMgPSBleHBvcnRzLmdldEN1c3RvbUNvbXBvbmVudERlZmluaXRpb25EZXRhaWxzID0gZXhwb3J0cy5nZXRDb21wb25lbnROYW1lID0gZXhwb3J0cy5yZXZpdmVTZXQgPSBleHBvcnRzLmdldEN1c3RvbVNldERldGFpbHMgPSBleHBvcnRzLnJldml2ZU1hcCA9IGV4cG9ydHMuZ2V0Q3VzdG9tTWFwRGV0YWlscyA9IGV4cG9ydHMuc3RyaW5naWZ5ID0gZXhwb3J0cy5zcGVjaWFsVG9rZW5Ub1N0cmluZyA9IGV4cG9ydHMuTUFYX0FSUkFZX1NJWkUgPSBleHBvcnRzLk1BWF9TVFJJTkdfU0laRSA9IGV4cG9ydHMuU1BFQ0lBTF9UT0tFTlMgPSBleHBvcnRzLk5BTiA9IGV4cG9ydHMuTkVHQVRJVkVfSU5GSU5JVFkgPSBleHBvcnRzLklORklOSVRZID0gZXhwb3J0cy5VTkRFRklORUQgPSBleHBvcnRzLmluRG9jID0gZXhwb3J0cy5nZXRDb21wb25lbnREaXNwbGF5TmFtZSA9IGV4cG9ydHMua2ViYWJpemUgPSBleHBvcnRzLmNhbWVsaXplID0gZXhwb3J0cy5jbGFzc2lmeSA9IHZvaWQgMDtcclxuY29uc3QgcGF0aF8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJwYXRoXCIpKTtcclxuY29uc3QgdHJhbnNmZXJfMSA9IHJlcXVpcmUoXCIuL3RyYW5zZmVyXCIpO1xyXG5jb25zdCBiYWNrZW5kXzEgPSByZXF1aXJlKFwiLi9iYWNrZW5kXCIpO1xyXG5jb25zdCBzaGFyZWRfZGF0YV8xID0gcmVxdWlyZShcIi4vc2hhcmVkLWRhdGFcIik7XHJcbmNvbnN0IGVudl8xID0gcmVxdWlyZShcIi4vZW52XCIpO1xyXG5mdW5jdGlvbiBjYWNoZWQoZm4pIHtcclxuICAgIGNvbnN0IGNhY2hlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcclxuICAgIHJldHVybiBmdW5jdGlvbiBjYWNoZWRGbihzdHIpIHtcclxuICAgICAgICBjb25zdCBoaXQgPSBjYWNoZVtzdHJdO1xyXG4gICAgICAgIHJldHVybiBoaXQgfHwgKGNhY2hlW3N0cl0gPSBmbihzdHIpKTtcclxuICAgIH07XHJcbn1cclxuY29uc3QgY2xhc3NpZnlSRSA9IC8oPzpefFstXy9dKShcXHcpL2c7XHJcbmV4cG9ydHMuY2xhc3NpZnkgPSBjYWNoZWQoKHN0cikgPT4ge1xyXG4gICAgcmV0dXJuIHN0ciAmJiBzdHIucmVwbGFjZShjbGFzc2lmeVJFLCB0b1VwcGVyKTtcclxufSk7XHJcbmNvbnN0IGNhbWVsaXplUkUgPSAvLShcXHcpL2c7XHJcbmV4cG9ydHMuY2FtZWxpemUgPSBjYWNoZWQoKHN0cikgPT4ge1xyXG4gICAgcmV0dXJuIHN0ciAmJiBzdHIucmVwbGFjZShjYW1lbGl6ZVJFLCB0b1VwcGVyKTtcclxufSk7XHJcbmNvbnN0IGtlYmFiaXplUkUgPSAvKFthLXowLTldKShbQS1aXSkvZztcclxuZXhwb3J0cy5rZWJhYml6ZSA9IGNhY2hlZCgoc3RyKSA9PiB7XHJcbiAgICByZXR1cm4gc3RyICYmIHN0clxyXG4gICAgICAgIC5yZXBsYWNlKGtlYmFiaXplUkUsIChfLCBsb3dlckNhc2VDaGFyYWN0ZXIsIHVwcGVyQ2FzZUxldHRlcikgPT4ge1xyXG4gICAgICAgIHJldHVybiBgJHtsb3dlckNhc2VDaGFyYWN0ZXJ9LSR7dXBwZXJDYXNlTGV0dGVyfWA7XHJcbiAgICB9KVxyXG4gICAgICAgIC50b0xvd2VyQ2FzZSgpO1xyXG59KTtcclxuZnVuY3Rpb24gdG9VcHBlcihfLCBjKSB7XHJcbiAgICByZXR1cm4gYyA/IGMudG9VcHBlckNhc2UoKSA6ICcnO1xyXG59XHJcbmZ1bmN0aW9uIGdldENvbXBvbmVudERpc3BsYXlOYW1lKG9yaWdpbmFsTmFtZSwgc3R5bGUgPSAnY2xhc3MnKSB7XHJcbiAgICBzd2l0Y2ggKHN0eWxlKSB7XHJcbiAgICAgICAgY2FzZSAnY2xhc3MnOlxyXG4gICAgICAgICAgICByZXR1cm4gKDAsIGV4cG9ydHMuY2xhc3NpZnkpKG9yaWdpbmFsTmFtZSk7XHJcbiAgICAgICAgY2FzZSAna2ViYWInOlxyXG4gICAgICAgICAgICByZXR1cm4gKDAsIGV4cG9ydHMua2ViYWJpemUpKG9yaWdpbmFsTmFtZSk7XHJcbiAgICAgICAgY2FzZSAnb3JpZ2luYWwnOlxyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHJldHVybiBvcmlnaW5hbE5hbWU7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5nZXRDb21wb25lbnREaXNwbGF5TmFtZSA9IGdldENvbXBvbmVudERpc3BsYXlOYW1lO1xyXG5mdW5jdGlvbiBpbkRvYyhub2RlKSB7XHJcbiAgICBpZiAoIW5vZGUpXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgY29uc3QgZG9jID0gbm9kZS5vd25lckRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcclxuICAgIGNvbnN0IHBhcmVudCA9IG5vZGUucGFyZW50Tm9kZTtcclxuICAgIHJldHVybiBkb2MgPT09IG5vZGUgfHxcclxuICAgICAgICBkb2MgPT09IHBhcmVudCB8fFxyXG4gICAgICAgICEhKHBhcmVudCAmJiBwYXJlbnQubm9kZVR5cGUgPT09IDEgJiYgKGRvYy5jb250YWlucyhwYXJlbnQpKSk7XHJcbn1cclxuZXhwb3J0cy5pbkRvYyA9IGluRG9jO1xyXG4vKipcclxuICogU3RyaW5naWZ5L3BhcnNlIGRhdGEgdXNpbmcgQ2lyY3VsYXJKU09OLlxyXG4gKi9cclxuZXhwb3J0cy5VTkRFRklORUQgPSAnX192dWVfZGV2dG9vbF91bmRlZmluZWRfXyc7XHJcbmV4cG9ydHMuSU5GSU5JVFkgPSAnX192dWVfZGV2dG9vbF9pbmZpbml0eV9fJztcclxuZXhwb3J0cy5ORUdBVElWRV9JTkZJTklUWSA9ICdfX3Z1ZV9kZXZ0b29sX25lZ2F0aXZlX2luZmluaXR5X18nO1xyXG5leHBvcnRzLk5BTiA9ICdfX3Z1ZV9kZXZ0b29sX25hbl9fJztcclxuZXhwb3J0cy5TUEVDSUFMX1RPS0VOUyA9IHtcclxuICAgIHRydWU6IHRydWUsXHJcbiAgICBmYWxzZTogZmFsc2UsXHJcbiAgICB1bmRlZmluZWQ6IGV4cG9ydHMuVU5ERUZJTkVELFxyXG4gICAgbnVsbDogbnVsbCxcclxuICAgICctSW5maW5pdHknOiBleHBvcnRzLk5FR0FUSVZFX0lORklOSVRZLFxyXG4gICAgSW5maW5pdHk6IGV4cG9ydHMuSU5GSU5JVFksXHJcbiAgICBOYU46IGV4cG9ydHMuTkFOLFxyXG59O1xyXG5leHBvcnRzLk1BWF9TVFJJTkdfU0laRSA9IDEwMDAwO1xyXG5leHBvcnRzLk1BWF9BUlJBWV9TSVpFID0gNTAwMDtcclxuZnVuY3Rpb24gc3BlY2lhbFRva2VuVG9TdHJpbmcodmFsdWUpIHtcclxuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xyXG4gICAgICAgIHJldHVybiAnbnVsbCc7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh2YWx1ZSA9PT0gZXhwb3J0cy5VTkRFRklORUQpIHtcclxuICAgICAgICByZXR1cm4gJ3VuZGVmaW5lZCc7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh2YWx1ZSA9PT0gZXhwb3J0cy5OQU4pIHtcclxuICAgICAgICByZXR1cm4gJ05hTic7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh2YWx1ZSA9PT0gZXhwb3J0cy5JTkZJTklUWSkge1xyXG4gICAgICAgIHJldHVybiAnSW5maW5pdHknO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodmFsdWUgPT09IGV4cG9ydHMuTkVHQVRJVkVfSU5GSU5JVFkpIHtcclxuICAgICAgICByZXR1cm4gJy1JbmZpbml0eSc7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn1cclxuZXhwb3J0cy5zcGVjaWFsVG9rZW5Ub1N0cmluZyA9IHNwZWNpYWxUb2tlblRvU3RyaW5nO1xyXG4vKipcclxuICogTmVlZGVkIHRvIHByZXZlbnQgc3RhY2sgb3ZlcmZsb3dcclxuICogd2hpbGUgcmVwbGFjaW5nIGNvbXBsZXggb2JqZWN0c1xyXG4gKiBsaWtlIGNvbXBvbmVudHMgYmVjYXVzZSB3ZSBjcmVhdGVcclxuICogbmV3IG9iamVjdHMgd2l0aCB0aGUgQ3VzdG9tVmFsdWUgQVBJXHJcbiAqICguaS5lIGB7IF9jdXN0b206IHsgLi4uIH0gfWApXHJcbiAqL1xyXG5jbGFzcyBFbmNvZGVDYWNoZSB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLm1hcCA9IG5ldyBNYXAoKTtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyBhIHJlc3VsdCB1bmlxdWUgdG8gZWFjaCBpbnB1dCBkYXRhXHJcbiAgICAgKiBAcGFyYW0geyp9IGRhdGEgSW5wdXQgZGF0YVxyXG4gICAgICogQHBhcmFtIHsqfSBmYWN0b3J5IEZ1bmN0aW9uIHVzZWQgdG8gY3JlYXRlIHRoZSB1bmlxdWUgcmVzdWx0XHJcbiAgICAgKi9cclxuICAgIGNhY2hlKGRhdGEsIGZhY3RvcnkpIHtcclxuICAgICAgICBjb25zdCBjYWNoZWQgPSB0aGlzLm1hcC5nZXQoZGF0YSk7XHJcbiAgICAgICAgaWYgKGNhY2hlZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gZmFjdG9yeShkYXRhKTtcclxuICAgICAgICAgICAgdGhpcy5tYXAuc2V0KGRhdGEsIHJlc3VsdCk7XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgY2xlYXIoKSB7XHJcbiAgICAgICAgdGhpcy5tYXAuY2xlYXIoKTtcclxuICAgIH1cclxufVxyXG5jb25zdCBlbmNvZGVDYWNoZSA9IG5ldyBFbmNvZGVDYWNoZSgpO1xyXG5jbGFzcyBSZXZpdmVDYWNoZSB7XHJcbiAgICBjb25zdHJ1Y3RvcihtYXhTaXplKSB7XHJcbiAgICAgICAgdGhpcy5tYXhTaXplID0gbWF4U2l6ZTtcclxuICAgICAgICB0aGlzLm1hcCA9IG5ldyBNYXAoKTtcclxuICAgICAgICB0aGlzLmluZGV4ID0gMDtcclxuICAgICAgICB0aGlzLnNpemUgPSAwO1xyXG4gICAgfVxyXG4gICAgY2FjaGUodmFsdWUpIHtcclxuICAgICAgICBjb25zdCBjdXJyZW50SW5kZXggPSB0aGlzLmluZGV4O1xyXG4gICAgICAgIHRoaXMubWFwLnNldChjdXJyZW50SW5kZXgsIHZhbHVlKTtcclxuICAgICAgICB0aGlzLnNpemUrKztcclxuICAgICAgICBpZiAodGhpcy5zaXplID4gdGhpcy5tYXhTaXplKSB7XHJcbiAgICAgICAgICAgIHRoaXMubWFwLmRlbGV0ZShjdXJyZW50SW5kZXggLSB0aGlzLnNpemUpO1xyXG4gICAgICAgICAgICB0aGlzLnNpemUtLTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5pbmRleCsrO1xyXG4gICAgICAgIHJldHVybiBjdXJyZW50SW5kZXg7XHJcbiAgICB9XHJcbiAgICByZWFkKGlkKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubWFwLmdldChpZCk7XHJcbiAgICB9XHJcbn1cclxuY29uc3QgcmV2aXZlQ2FjaGUgPSBuZXcgUmV2aXZlQ2FjaGUoMTAwMCk7XHJcbmZ1bmN0aW9uIHN0cmluZ2lmeShkYXRhKSB7XHJcbiAgICAvLyBDcmVhdGUgYSBmcmVzaCBjYWNoZSBmb3IgZWFjaCBzZXJpYWxpemF0aW9uXHJcbiAgICBlbmNvZGVDYWNoZS5jbGVhcigpO1xyXG4gICAgcmV0dXJuICgwLCB0cmFuc2Zlcl8xLnN0cmluZ2lmeUNpcmN1bGFyQXV0b0NodW5rcykoZGF0YSwgcmVwbGFjZXIpO1xyXG59XHJcbmV4cG9ydHMuc3RyaW5naWZ5ID0gc3RyaW5naWZ5O1xyXG5mdW5jdGlvbiByZXBsYWNlcihrZXkpIHtcclxuICAgIC8vIEB0cy1pZ25vcmVcclxuICAgIGNvbnN0IHZhbCA9IHRoaXNba2V5XTtcclxuICAgIGNvbnN0IHR5cGUgPSB0eXBlb2YgdmFsO1xyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsKSkge1xyXG4gICAgICAgIGNvbnN0IGwgPSB2YWwubGVuZ3RoO1xyXG4gICAgICAgIGlmIChsID4gZXhwb3J0cy5NQVhfQVJSQVlfU0laRSkge1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgX2lzQXJyYXk6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBsZW5ndGg6IGwsXHJcbiAgICAgICAgICAgICAgICBpdGVtczogdmFsLnNsaWNlKDAsIGV4cG9ydHMuTUFYX0FSUkFZX1NJWkUpLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdmFsO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICBpZiAodmFsLmxlbmd0aCA+IGV4cG9ydHMuTUFYX1NUUklOR19TSVpFKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWwuc3Vic3RyKDAsIGV4cG9ydHMuTUFYX1NUUklOR19TSVpFKSArIGAuLi4gKCR7KHZhbC5sZW5ndGgpfSB0b3RhbCBsZW5ndGgpYDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodHlwZSA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICByZXR1cm4gZXhwb3J0cy5VTkRFRklORUQ7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh2YWwgPT09IEluZmluaXR5KSB7XHJcbiAgICAgICAgcmV0dXJuIGV4cG9ydHMuSU5GSU5JVFk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh2YWwgPT09IC1JbmZpbml0eSkge1xyXG4gICAgICAgIHJldHVybiBleHBvcnRzLk5FR0FUSVZFX0lORklOSVRZO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodHlwZSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIHJldHVybiBnZXRDdXN0b21GdW5jdGlvbkRldGFpbHModmFsKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHR5cGUgPT09ICdzeW1ib2wnKSB7XHJcbiAgICAgICAgcmV0dXJuIGBbbmF0aXZlIFN5bWJvbCAke1N5bWJvbC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWwpfV1gO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodmFsICE9PSBudWxsICYmIHR5cGUgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgY29uc3QgcHJvdG8gPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsKTtcclxuICAgICAgICBpZiAocHJvdG8gPT09ICdbb2JqZWN0IE1hcF0nKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbmNvZGVDYWNoZS5jYWNoZSh2YWwsICgpID0+IGdldEN1c3RvbU1hcERldGFpbHModmFsKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHByb3RvID09PSAnW29iamVjdCBTZXRdJykge1xyXG4gICAgICAgICAgICByZXR1cm4gZW5jb2RlQ2FjaGUuY2FjaGUodmFsLCAoKSA9PiBnZXRDdXN0b21TZXREZXRhaWxzKHZhbCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChwcm90byA9PT0gJ1tvYmplY3QgUmVnRXhwXScpIHtcclxuICAgICAgICAgICAgLy8gc3BlY2lhbCBoYW5kbGluZyBvZiBuYXRpdmUgdHlwZVxyXG4gICAgICAgICAgICByZXR1cm4gYFtuYXRpdmUgUmVnRXhwICR7UmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbCl9XWA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHByb3RvID09PSAnW29iamVjdCBEYXRlXScpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGBbbmF0aXZlIERhdGUgJHtEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbCl9XWA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHByb3RvID09PSAnW29iamVjdCBFcnJvcl0nKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBgW25hdGl2ZSBFcnJvciAke3ZhbC5tZXNzYWdlfTw+JHt2YWwuc3RhY2t9XWA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHZhbC5zdGF0ZSAmJiB2YWwuX3ZtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbmNvZGVDYWNoZS5jYWNoZSh2YWwsICgpID0+ICgwLCBiYWNrZW5kXzEuZ2V0Q3VzdG9tU3RvcmVEZXRhaWxzKSh2YWwpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAodmFsLmNvbnN0cnVjdG9yICYmIHZhbC5jb25zdHJ1Y3Rvci5uYW1lID09PSAnVnVlUm91dGVyJykge1xyXG4gICAgICAgICAgICByZXR1cm4gZW5jb2RlQ2FjaGUuY2FjaGUodmFsLCAoKSA9PiAoMCwgYmFja2VuZF8xLmdldEN1c3RvbVJvdXRlckRldGFpbHMpKHZhbCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICgoMCwgYmFja2VuZF8xLmlzVnVlSW5zdGFuY2UpKHZhbCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVuY29kZUNhY2hlLmNhY2hlKHZhbCwgKCkgPT4gKDAsIGJhY2tlbmRfMS5nZXRDdXN0b21JbnN0YW5jZURldGFpbHMpKHZhbCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh0eXBlb2YgdmFsLnJlbmRlciA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICByZXR1cm4gZW5jb2RlQ2FjaGUuY2FjaGUodmFsLCAoKSA9PiBnZXRDdXN0b21Db21wb25lbnREZWZpbml0aW9uRGV0YWlscyh2YWwpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAodmFsLmNvbnN0cnVjdG9yICYmIHZhbC5jb25zdHJ1Y3Rvci5uYW1lID09PSAnVk5vZGUnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBgW25hdGl2ZSBWTm9kZSA8JHt2YWwudGFnfT5dYDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAodmFsIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVuY29kZUNhY2hlLmNhY2hlKHZhbCwgKCkgPT4gZ2V0Q3VzdG9tSFRNTEVsZW1lbnREZXRhaWxzKHZhbCkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2UgaWYgKE51bWJlci5pc05hTih2YWwpKSB7XHJcbiAgICAgICAgcmV0dXJuIGV4cG9ydHMuTkFOO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHNhbml0aXplKHZhbCk7XHJcbn1cclxuZnVuY3Rpb24gZ2V0Q3VzdG9tTWFwRGV0YWlscyh2YWwpIHtcclxuICAgIGNvbnN0IGxpc3QgPSBbXTtcclxuICAgIHZhbC5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiBsaXN0LnB1c2goe1xyXG4gICAgICAgIGtleSxcclxuICAgICAgICB2YWx1ZSxcclxuICAgIH0pKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgX2N1c3RvbToge1xyXG4gICAgICAgICAgICB0eXBlOiAnbWFwJyxcclxuICAgICAgICAgICAgZGlzcGxheTogJ01hcCcsXHJcbiAgICAgICAgICAgIHZhbHVlOiBsaXN0LFxyXG4gICAgICAgICAgICByZWFkT25seTogdHJ1ZSxcclxuICAgICAgICAgICAgZmllbGRzOiB7XHJcbiAgICAgICAgICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLmdldEN1c3RvbU1hcERldGFpbHMgPSBnZXRDdXN0b21NYXBEZXRhaWxzO1xyXG5mdW5jdGlvbiByZXZpdmVNYXAodmFsKSB7XHJcbiAgICBjb25zdCByZXN1bHQgPSBuZXcgTWFwKCk7XHJcbiAgICBjb25zdCBsaXN0ID0gdmFsLl9jdXN0b20udmFsdWU7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBjb25zdCB7IGtleSwgdmFsdWUgfSA9IGxpc3RbaV07XHJcbiAgICAgICAgcmVzdWx0LnNldChrZXksIHJldml2ZSh2YWx1ZSkpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5leHBvcnRzLnJldml2ZU1hcCA9IHJldml2ZU1hcDtcclxuZnVuY3Rpb24gZ2V0Q3VzdG9tU2V0RGV0YWlscyh2YWwpIHtcclxuICAgIGNvbnN0IGxpc3QgPSBBcnJheS5mcm9tKHZhbCk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIF9jdXN0b206IHtcclxuICAgICAgICAgICAgdHlwZTogJ3NldCcsXHJcbiAgICAgICAgICAgIGRpc3BsYXk6IGBTZXRbJHtsaXN0Lmxlbmd0aH1dYCxcclxuICAgICAgICAgICAgdmFsdWU6IGxpc3QsXHJcbiAgICAgICAgICAgIHJlYWRPbmx5OiB0cnVlLFxyXG4gICAgICAgIH0sXHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuZ2V0Q3VzdG9tU2V0RGV0YWlscyA9IGdldEN1c3RvbVNldERldGFpbHM7XHJcbmZ1bmN0aW9uIHJldml2ZVNldCh2YWwpIHtcclxuICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBTZXQoKTtcclxuICAgIGNvbnN0IGxpc3QgPSB2YWwuX2N1c3RvbS52YWx1ZTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gbGlzdFtpXTtcclxuICAgICAgICByZXN1bHQuYWRkKHJldml2ZSh2YWx1ZSkpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5leHBvcnRzLnJldml2ZVNldCA9IHJldml2ZVNldDtcclxuLy8gVXNlIGEgY3VzdG9tIGJhc2VuYW1lIGZ1bmN0aW9ucyBpbnN0ZWFkIG9mIHRoZSBzaGltZWQgdmVyc2lvblxyXG4vLyBiZWNhdXNlIGl0IGRvZXNuJ3Qgd29yayBvbiBXaW5kb3dzXHJcbmZ1bmN0aW9uIGJhc2VuYW1lKGZpbGVuYW1lLCBleHQpIHtcclxuICAgIHJldHVybiBwYXRoXzEuZGVmYXVsdC5iYXNlbmFtZShmaWxlbmFtZS5yZXBsYWNlKC9eW2EtekEtWl06LywgJycpLnJlcGxhY2UoL1xcXFwvZywgJy8nKSwgZXh0KTtcclxufVxyXG5mdW5jdGlvbiBnZXRDb21wb25lbnROYW1lKG9wdGlvbnMpIHtcclxuICAgIGNvbnN0IG5hbWUgPSBvcHRpb25zLmRpc3BsYXlOYW1lIHx8IG9wdGlvbnMubmFtZSB8fCBvcHRpb25zLl9jb21wb25lbnRUYWc7XHJcbiAgICBpZiAobmFtZSkge1xyXG4gICAgICAgIHJldHVybiBuYW1lO1xyXG4gICAgfVxyXG4gICAgY29uc3QgZmlsZSA9IG9wdGlvbnMuX19maWxlOyAvLyBpbmplY3RlZCBieSB2dWUtbG9hZGVyXHJcbiAgICBpZiAoZmlsZSkge1xyXG4gICAgICAgIHJldHVybiAoMCwgZXhwb3J0cy5jbGFzc2lmeSkoYmFzZW5hbWUoZmlsZSwgJy52dWUnKSk7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5nZXRDb21wb25lbnROYW1lID0gZ2V0Q29tcG9uZW50TmFtZTtcclxuZnVuY3Rpb24gZ2V0Q3VzdG9tQ29tcG9uZW50RGVmaW5pdGlvbkRldGFpbHMoZGVmKSB7XHJcbiAgICBsZXQgZGlzcGxheSA9IGdldENvbXBvbmVudE5hbWUoZGVmKTtcclxuICAgIGlmIChkaXNwbGF5KSB7XHJcbiAgICAgICAgaWYgKGRlZi5uYW1lICYmIGRlZi5fX2ZpbGUpIHtcclxuICAgICAgICAgICAgZGlzcGxheSArPSBgIDxzcGFuPigke2RlZi5fX2ZpbGV9KTwvc3Bhbj5gO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIGRpc3BsYXkgPSAnPGk+VW5rbm93biBDb21wb25lbnQ8L2k+JztcclxuICAgIH1cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgX2N1c3RvbToge1xyXG4gICAgICAgICAgICB0eXBlOiAnY29tcG9uZW50LWRlZmluaXRpb24nLFxyXG4gICAgICAgICAgICBkaXNwbGF5LFxyXG4gICAgICAgICAgICB0b29sdGlwOiAnQ29tcG9uZW50IGRlZmluaXRpb24nLFxyXG4gICAgICAgICAgICAuLi5kZWYuX19maWxlXHJcbiAgICAgICAgICAgICAgICA/IHtcclxuICAgICAgICAgICAgICAgICAgICBmaWxlOiBkZWYuX19maWxlLFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgOiB7fSxcclxuICAgICAgICB9LFxyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLmdldEN1c3RvbUNvbXBvbmVudERlZmluaXRpb25EZXRhaWxzID0gZ2V0Q3VzdG9tQ29tcG9uZW50RGVmaW5pdGlvbkRldGFpbHM7XHJcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvYmFuLXR5cGVzXHJcbmZ1bmN0aW9uIGdldEN1c3RvbUZ1bmN0aW9uRGV0YWlscyhmdW5jKSB7XHJcbiAgICBsZXQgc3RyaW5nID0gJyc7XHJcbiAgICBsZXQgbWF0Y2hlcyA9IG51bGw7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHN0cmluZyA9IEZ1bmN0aW9uLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGZ1bmMpO1xyXG4gICAgICAgIG1hdGNoZXMgPSBTdHJpbmcucHJvdG90eXBlLm1hdGNoLmNhbGwoc3RyaW5nLCAvXFwoW1xcc1xcU10qP1xcKS8pO1xyXG4gICAgfVxyXG4gICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAvLyBGdW5jIGlzIHByb2JhYmx5IGEgUHJveHksIHdoaWNoIGNhbiBicmVhayBGdW5jdGlvbi5wcm90b3R5cGUudG9TdHJpbmcoKVxyXG4gICAgfVxyXG4gICAgLy8gVHJpbSBhbnkgZXhjZXNzIHdoaXRlc3BhY2UgZnJvbSB0aGUgYXJndW1lbnQgc3RyaW5nXHJcbiAgICBjb25zdCBtYXRjaCA9IG1hdGNoZXMgJiYgbWF0Y2hlc1swXTtcclxuICAgIGNvbnN0IGFyZ3MgPSB0eXBlb2YgbWF0Y2ggPT09ICdzdHJpbmcnXHJcbiAgICAgICAgPyBgKCR7bWF0Y2guc3Vic3RyKDEsIG1hdGNoLmxlbmd0aCAtIDIpLnNwbGl0KCcsJykubWFwKGEgPT4gYS50cmltKCkpLmpvaW4oJywgJyl9KWBcclxuICAgICAgICA6ICcoPyknO1xyXG4gICAgY29uc3QgbmFtZSA9IHR5cGVvZiBmdW5jLm5hbWUgPT09ICdzdHJpbmcnID8gZnVuYy5uYW1lIDogJyc7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIF9jdXN0b206IHtcclxuICAgICAgICAgICAgdHlwZTogJ2Z1bmN0aW9uJyxcclxuICAgICAgICAgICAgZGlzcGxheTogYDxzcGFuPmY8L3NwYW4+ICR7ZXNjYXBlKG5hbWUpfSR7YXJnc31gLFxyXG4gICAgICAgICAgICBfcmV2aXZlSWQ6IHJldml2ZUNhY2hlLmNhY2hlKGZ1bmMpLFxyXG4gICAgICAgIH0sXHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuZ2V0Q3VzdG9tRnVuY3Rpb25EZXRhaWxzID0gZ2V0Q3VzdG9tRnVuY3Rpb25EZXRhaWxzO1xyXG5mdW5jdGlvbiBnZXRDdXN0b21IVE1MRWxlbWVudERldGFpbHModmFsdWUpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgX2N1c3RvbToge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ0hUTUxFbGVtZW50JyxcclxuICAgICAgICAgICAgICAgIGRpc3BsYXk6IGA8c3BhbiBjbGFzcz1cIm9wYWNpdHktMzBcIj4mbHQ7PC9zcGFuPjxzcGFuIGNsYXNzPVwidGV4dC1ibHVlLTUwMFwiPiR7dmFsdWUudGFnTmFtZS50b0xvd2VyQ2FzZSgpfTwvc3Bhbj48c3BhbiBjbGFzcz1cIm9wYWNpdHktMzBcIj4mZ3Q7PC9zcGFuPmAsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogbmFtZWROb2RlTWFwVG9PYmplY3QodmFsdWUuYXR0cmlidXRlcyksXHJcbiAgICAgICAgICAgICAgICBhY3Rpb25zOiBbXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpY29uOiAnaW5wdXQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0b29sdGlwOiAnTG9nIGVsZW1lbnQgdG8gY29uc29sZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBfY3VzdG9tOiB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnSFRNTEVsZW1lbnQnLFxyXG4gICAgICAgICAgICAgICAgZGlzcGxheTogYDxzcGFuIGNsYXNzPVwidGV4dC1ibHVlLTUwMFwiPiR7U3RyaW5nKHZhbHVlKX08L3NwYW4+YCxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuZ2V0Q3VzdG9tSFRNTEVsZW1lbnREZXRhaWxzID0gZ2V0Q3VzdG9tSFRNTEVsZW1lbnREZXRhaWxzO1xyXG5mdW5jdGlvbiBuYW1lZE5vZGVNYXBUb09iamVjdChtYXApIHtcclxuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xyXG4gICAgY29uc3QgbCA9IG1hcC5sZW5ndGg7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgIGNvbnN0IG5vZGUgPSBtYXAuaXRlbShpKTtcclxuICAgICAgICByZXN1bHRbbm9kZS5uYW1lXSA9IG5vZGUudmFsdWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcbmZ1bmN0aW9uIGdldEN1c3RvbVJlZkRldGFpbHMoaW5zdGFuY2UsIGtleSwgcmVmKSB7XHJcbiAgICBsZXQgdmFsdWU7XHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheShyZWYpKSB7XHJcbiAgICAgICAgdmFsdWUgPSByZWYubWFwKChyKSA9PiBnZXRDdXN0b21SZWZEZXRhaWxzKGluc3RhbmNlLCBrZXksIHIpKS5tYXAoZGF0YSA9PiBkYXRhLnZhbHVlKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIGxldCBuYW1lO1xyXG4gICAgICAgIGlmIChyZWYuX2lzVnVlKSB7XHJcbiAgICAgICAgICAgIG5hbWUgPSBnZXRDb21wb25lbnROYW1lKHJlZi4kb3B0aW9ucyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBuYW1lID0gcmVmLnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFsdWUgPSB7XHJcbiAgICAgICAgICAgIF9jdXN0b206IHtcclxuICAgICAgICAgICAgICAgIGRpc3BsYXk6IGAmbHQ7JHtuYW1lfWAgK1xyXG4gICAgICAgICAgICAgICAgICAgIChyZWYuaWQgPyBgIDxzcGFuIGNsYXNzPVwiYXR0ci10aXRsZVwiPmlkPC9zcGFuPj1cIiR7cmVmLmlkfVwiYCA6ICcnKSArXHJcbiAgICAgICAgICAgICAgICAgICAgKHJlZi5jbGFzc05hbWUgPyBgIDxzcGFuIGNsYXNzPVwiYXR0ci10aXRsZVwiPmNsYXNzPC9zcGFuPj1cIiR7cmVmLmNsYXNzTmFtZX1cImAgOiAnJykgKyAnJmd0OycsXHJcbiAgICAgICAgICAgICAgICB1aWQ6IGluc3RhbmNlLl9fVlVFX0RFVlRPT0xTX1VJRF9fLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3JlZmVyZW5jZScsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdHlwZTogJyRyZWZzJyxcclxuICAgICAgICBrZXk6IGtleSxcclxuICAgICAgICB2YWx1ZSxcclxuICAgICAgICBlZGl0YWJsZTogZmFsc2UsXHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuZ2V0Q3VzdG9tUmVmRGV0YWlscyA9IGdldEN1c3RvbVJlZkRldGFpbHM7XHJcbmZ1bmN0aW9uIHBhcnNlKGRhdGEsIHJldml2ZSA9IGZhbHNlKSB7XHJcbiAgICByZXR1cm4gcmV2aXZlXHJcbiAgICAgICAgPyAoMCwgdHJhbnNmZXJfMS5wYXJzZUNpcmN1bGFyQXV0b0NodW5rcykoZGF0YSwgcmV2aXZlcilcclxuICAgICAgICA6ICgwLCB0cmFuc2Zlcl8xLnBhcnNlQ2lyY3VsYXJBdXRvQ2h1bmtzKShkYXRhKTtcclxufVxyXG5leHBvcnRzLnBhcnNlID0gcGFyc2U7XHJcbmNvbnN0IHNwZWNpYWxUeXBlUkUgPSAvXlxcW25hdGl2ZSAoXFx3KykgKC4qPykoPD4oKC58XFxzKSopKT9cXF0kLztcclxuY29uc3Qgc3ltYm9sUkUgPSAvXlxcW25hdGl2ZSBTeW1ib2wgU3ltYm9sXFwoKC4qKVxcKVxcXSQvO1xyXG5mdW5jdGlvbiByZXZpdmVyKGtleSwgdmFsKSB7XHJcbiAgICByZXR1cm4gcmV2aXZlKHZhbCk7XHJcbn1cclxuZnVuY3Rpb24gcmV2aXZlKHZhbCkge1xyXG4gICAgaWYgKHZhbCA9PT0gZXhwb3J0cy5VTkRFRklORUQpIHtcclxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodmFsID09PSBleHBvcnRzLklORklOSVRZKSB7XHJcbiAgICAgICAgcmV0dXJuIEluZmluaXR5O1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodmFsID09PSBleHBvcnRzLk5FR0FUSVZFX0lORklOSVRZKSB7XHJcbiAgICAgICAgcmV0dXJuIC1JbmZpbml0eTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHZhbCA9PT0gZXhwb3J0cy5OQU4pIHtcclxuICAgICAgICByZXR1cm4gTmFOO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodmFsICYmIHZhbC5fY3VzdG9tKSB7XHJcbiAgICAgICAgY29uc3QgeyBfY3VzdG9tOiBjdXN0b20gfSA9IHZhbDtcclxuICAgICAgICBpZiAoY3VzdG9tLnR5cGUgPT09ICdjb21wb25lbnQnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAoMCwgYmFja2VuZF8xLmdldEluc3RhbmNlTWFwKSgpLmdldChjdXN0b20uaWQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChjdXN0b20udHlwZSA9PT0gJ21hcCcpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJldml2ZU1hcCh2YWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChjdXN0b20udHlwZSA9PT0gJ3NldCcpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJldml2ZVNldCh2YWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChjdXN0b20uX3Jldml2ZUlkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZXZpdmVDYWNoZS5yZWFkKGN1c3RvbS5fcmV2aXZlSWQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJldml2ZShjdXN0b20udmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHN5bWJvbFJFLnRlc3QodmFsKSkge1xyXG4gICAgICAgIGNvbnN0IFssIHN0cmluZ10gPSBzeW1ib2xSRS5leGVjKHZhbCk7XHJcbiAgICAgICAgcmV0dXJuIFN5bWJvbC5mb3Ioc3RyaW5nKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHNwZWNpYWxUeXBlUkUudGVzdCh2YWwpKSB7XHJcbiAgICAgICAgY29uc3QgWywgdHlwZSwgc3RyaW5nLCAsIGRldGFpbHNdID0gc3BlY2lhbFR5cGVSRS5leGVjKHZhbCk7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gbmV3IHdpbmRvd1t0eXBlXShzdHJpbmcpO1xyXG4gICAgICAgIGlmICh0eXBlID09PSAnRXJyb3InICYmIGRldGFpbHMpIHtcclxuICAgICAgICAgICAgcmVzdWx0LnN0YWNrID0gZGV0YWlscztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHJldHVybiB2YWw7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5yZXZpdmUgPSByZXZpdmU7XHJcbi8qKlxyXG4gKiBTYW5pdGl6ZSBkYXRhIHRvIGJlIHBvc3RlZCB0byB0aGUgb3RoZXIgc2lkZS5cclxuICogU2luY2UgdGhlIG1lc3NhZ2UgcG9zdGVkIGlzIHNlbnQgd2l0aCBzdHJ1Y3R1cmVkIGNsb25lLFxyXG4gKiB3ZSBuZWVkIHRvIGZpbHRlciBvdXQgYW55IHR5cGVzIHRoYXQgbWlnaHQgY2F1c2UgYW4gZXJyb3IuXHJcbiAqXHJcbiAqIEBwYXJhbSB7Kn0gZGF0YVxyXG4gKiBAcmV0dXJuIHsqfVxyXG4gKi9cclxuZnVuY3Rpb24gc2FuaXRpemUoZGF0YSkge1xyXG4gICAgaWYgKCFpc1ByaW1pdGl2ZShkYXRhKSAmJlxyXG4gICAgICAgICFBcnJheS5pc0FycmF5KGRhdGEpICYmXHJcbiAgICAgICAgIWlzUGxhaW5PYmplY3QoZGF0YSkpIHtcclxuICAgICAgICAvLyBoYW5kbGUgdHlwZXMgdGhhdCB3aWxsIHByb2JhYmx5IGNhdXNlIGlzc3VlcyBpblxyXG4gICAgICAgIC8vIHRoZSBzdHJ1Y3R1cmVkIGNsb25lXHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChkYXRhKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgfVxyXG59XHJcbmZ1bmN0aW9uIGlzUGxhaW5PYmplY3Qob2JqKSB7XHJcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IE9iamVjdF0nO1xyXG59XHJcbmV4cG9ydHMuaXNQbGFpbk9iamVjdCA9IGlzUGxhaW5PYmplY3Q7XHJcbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGRhdGEpIHtcclxuICAgIGlmIChkYXRhID09IG51bGwpIHtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIGNvbnN0IHR5cGUgPSB0eXBlb2YgZGF0YTtcclxuICAgIHJldHVybiAodHlwZSA9PT0gJ3N0cmluZycgfHxcclxuICAgICAgICB0eXBlID09PSAnbnVtYmVyJyB8fFxyXG4gICAgICAgIHR5cGUgPT09ICdib29sZWFuJyk7XHJcbn1cclxuLyoqXHJcbiAqIFNlYXJjaGVzIGEga2V5IG9yIHZhbHVlIGluIHRoZSBvYmplY3QsIHdpdGggYSBtYXhpbXVtIGRlZXBuZXNzXHJcbiAqIEBwYXJhbSB7Kn0gb2JqIFNlYXJjaCB0YXJnZXRcclxuICogQHBhcmFtIHtzdHJpbmd9IHNlYXJjaFRlcm0gU2VhcmNoIHN0cmluZ1xyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gU2VhcmNoIG1hdGNoXHJcbiAqL1xyXG5mdW5jdGlvbiBzZWFyY2hEZWVwSW5PYmplY3Qob2JqLCBzZWFyY2hUZXJtKSB7XHJcbiAgICBjb25zdCBzZWVuID0gbmV3IE1hcCgpO1xyXG4gICAgY29uc3QgcmVzdWx0ID0gaW50ZXJuYWxTZWFyY2hPYmplY3Qob2JqLCBzZWFyY2hUZXJtLnRvTG93ZXJDYXNlKCksIHNlZW4sIDApO1xyXG4gICAgc2Vlbi5jbGVhcigpO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5leHBvcnRzLnNlYXJjaERlZXBJbk9iamVjdCA9IHNlYXJjaERlZXBJbk9iamVjdDtcclxuY29uc3QgU0VBUkNIX01BWF9ERVBUSCA9IDEwO1xyXG4vKipcclxuICogRXhlY3V0ZXMgYSBzZWFyY2ggb24gZWFjaCBmaWVsZCBvZiB0aGUgcHJvdmlkZWQgb2JqZWN0XHJcbiAqIEBwYXJhbSB7Kn0gb2JqIFNlYXJjaCB0YXJnZXRcclxuICogQHBhcmFtIHtzdHJpbmd9IHNlYXJjaFRlcm0gU2VhcmNoIHN0cmluZ1xyXG4gKiBAcGFyYW0ge01hcDxhbnksYm9vbGVhbj59IHNlZW4gTWFwIGNvbnRhaW5pbmcgdGhlIHNlYXJjaCByZXN1bHQgdG8gcHJldmVudCBzdGFjayBvdmVyZmxvdyBieSB3YWxraW5nIG9uIHRoZSBzYW1lIG9iamVjdCBtdWx0aXBsZSB0aW1lc1xyXG4gKiBAcGFyYW0ge251bWJlcn0gZGVwdGggRGVlcCBzZWFyY2ggZGVwdGggbGV2ZWwsIHdoaWNoIGlzIGNhcHBlZCB0byBwcmV2ZW50IHBlcmZvcm1hbmNlIGlzc3Vlc1xyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gU2VhcmNoIG1hdGNoXHJcbiAqL1xyXG5mdW5jdGlvbiBpbnRlcm5hbFNlYXJjaE9iamVjdChvYmosIHNlYXJjaFRlcm0sIHNlZW4sIGRlcHRoKSB7XHJcbiAgICBpZiAoZGVwdGggPiBTRUFSQ0hfTUFYX0RFUFRIKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgbGV0IG1hdGNoID0gZmFsc2U7XHJcbiAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMob2JqKTtcclxuICAgIGxldCBrZXksIHZhbHVlO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAga2V5ID0ga2V5c1tpXTtcclxuICAgICAgICB2YWx1ZSA9IG9ialtrZXldO1xyXG4gICAgICAgIG1hdGNoID0gaW50ZXJuYWxTZWFyY2hDaGVjayhzZWFyY2hUZXJtLCBrZXksIHZhbHVlLCBzZWVuLCBkZXB0aCArIDEpO1xyXG4gICAgICAgIGlmIChtYXRjaCkge1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbWF0Y2g7XHJcbn1cclxuLyoqXHJcbiAqIEV4ZWN1dGVzIGEgc2VhcmNoIG9uIGVhY2ggdmFsdWUgb2YgdGhlIHByb3ZpZGVkIGFycmF5XHJcbiAqIEBwYXJhbSB7Kn0gYXJyYXkgU2VhcmNoIHRhcmdldFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gc2VhcmNoVGVybSBTZWFyY2ggc3RyaW5nXHJcbiAqIEBwYXJhbSB7TWFwPGFueSxib29sZWFuPn0gc2VlbiBNYXAgY29udGFpbmluZyB0aGUgc2VhcmNoIHJlc3VsdCB0byBwcmV2ZW50IHN0YWNrIG92ZXJmbG93IGJ5IHdhbGtpbmcgb24gdGhlIHNhbWUgb2JqZWN0IG11bHRpcGxlIHRpbWVzXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBkZXB0aCBEZWVwIHNlYXJjaCBkZXB0aCBsZXZlbCwgd2hpY2ggaXMgY2FwcGVkIHRvIHByZXZlbnQgcGVyZm9ybWFuY2UgaXNzdWVzXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSBTZWFyY2ggbWF0Y2hcclxuICovXHJcbmZ1bmN0aW9uIGludGVybmFsU2VhcmNoQXJyYXkoYXJyYXksIHNlYXJjaFRlcm0sIHNlZW4sIGRlcHRoKSB7XHJcbiAgICBpZiAoZGVwdGggPiBTRUFSQ0hfTUFYX0RFUFRIKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgbGV0IG1hdGNoID0gZmFsc2U7XHJcbiAgICBsZXQgdmFsdWU7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFsdWUgPSBhcnJheVtpXTtcclxuICAgICAgICBtYXRjaCA9IGludGVybmFsU2VhcmNoQ2hlY2soc2VhcmNoVGVybSwgbnVsbCwgdmFsdWUsIHNlZW4sIGRlcHRoICsgMSk7XHJcbiAgICAgICAgaWYgKG1hdGNoKSB7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBtYXRjaDtcclxufVxyXG4vKipcclxuICogQ2hlY2tzIGlmIHRoZSBwcm92aWRlZCBmaWVsZCBtYXRjaGVzIHRoZSBzZWFyY2ggdGVybXNcclxuICogQHBhcmFtIHtzdHJpbmd9IHNlYXJjaFRlcm0gU2VhcmNoIHN0cmluZ1xyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IEZpZWxkIGtleSAobnVsbCBpZiBmcm9tIGFycmF5KVxyXG4gKiBAcGFyYW0geyp9IHZhbHVlIEZpZWxkIHZhbHVlXHJcbiAqIEBwYXJhbSB7TWFwPGFueSxib29sZWFuPn0gc2VlbiBNYXAgY29udGFpbmluZyB0aGUgc2VhcmNoIHJlc3VsdCB0byBwcmV2ZW50IHN0YWNrIG92ZXJmbG93IGJ5IHdhbGtpbmcgb24gdGhlIHNhbWUgb2JqZWN0IG11bHRpcGxlIHRpbWVzXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBkZXB0aCBEZWVwIHNlYXJjaCBkZXB0aCBsZXZlbCwgd2hpY2ggaXMgY2FwcGVkIHRvIHByZXZlbnQgcGVyZm9ybWFuY2UgaXNzdWVzXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSBTZWFyY2ggbWF0Y2hcclxuICovXHJcbmZ1bmN0aW9uIGludGVybmFsU2VhcmNoQ2hlY2soc2VhcmNoVGVybSwga2V5LCB2YWx1ZSwgc2VlbiwgZGVwdGgpIHtcclxuICAgIGxldCBtYXRjaCA9IGZhbHNlO1xyXG4gICAgbGV0IHJlc3VsdDtcclxuICAgIGlmIChrZXkgPT09ICdfY3VzdG9tJykge1xyXG4gICAgICAgIGtleSA9IHZhbHVlLmRpc3BsYXk7XHJcbiAgICAgICAgdmFsdWUgPSB2YWx1ZS52YWx1ZTtcclxuICAgIH1cclxuICAgIChyZXN1bHQgPSBzcGVjaWFsVG9rZW5Ub1N0cmluZyh2YWx1ZSkpICYmICh2YWx1ZSA9IHJlc3VsdCk7XHJcbiAgICBpZiAoa2V5ICYmIGNvbXBhcmUoa2V5LCBzZWFyY2hUZXJtKSkge1xyXG4gICAgICAgIG1hdGNoID0gdHJ1ZTtcclxuICAgICAgICBzZWVuLnNldCh2YWx1ZSwgdHJ1ZSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChzZWVuLmhhcyh2YWx1ZSkpIHtcclxuICAgICAgICBtYXRjaCA9IHNlZW4uZ2V0KHZhbHVlKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XHJcbiAgICAgICAgc2Vlbi5zZXQodmFsdWUsIG51bGwpO1xyXG4gICAgICAgIG1hdGNoID0gaW50ZXJuYWxTZWFyY2hBcnJheSh2YWx1ZSwgc2VhcmNoVGVybSwgc2VlbiwgZGVwdGgpO1xyXG4gICAgICAgIHNlZW4uc2V0KHZhbHVlLCBtYXRjaCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChpc1BsYWluT2JqZWN0KHZhbHVlKSkge1xyXG4gICAgICAgIHNlZW4uc2V0KHZhbHVlLCBudWxsKTtcclxuICAgICAgICBtYXRjaCA9IGludGVybmFsU2VhcmNoT2JqZWN0KHZhbHVlLCBzZWFyY2hUZXJtLCBzZWVuLCBkZXB0aCk7XHJcbiAgICAgICAgc2Vlbi5zZXQodmFsdWUsIG1hdGNoKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKGNvbXBhcmUodmFsdWUsIHNlYXJjaFRlcm0pKSB7XHJcbiAgICAgICAgbWF0Y2ggPSB0cnVlO1xyXG4gICAgICAgIHNlZW4uc2V0KHZhbHVlLCB0cnVlKTtcclxuICAgIH1cclxuICAgIHJldHVybiBtYXRjaDtcclxufVxyXG4vKipcclxuICogQ29tcGFyZXMgdHdvIHZhbHVlc1xyXG4gKiBAcGFyYW0geyp9IHZhbHVlIE1peGVkIHR5cGUgdmFsdWUgdGhhdCB3aWxsIGJlIGNhc3QgdG8gc3RyaW5nXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzZWFyY2hUZXJtIFNlYXJjaCBzdHJpbmdcclxuICogQHJldHVybnMge2Jvb2xlYW59IFNlYXJjaCBtYXRjaFxyXG4gKi9cclxuZnVuY3Rpb24gY29tcGFyZSh2YWx1ZSwgc2VhcmNoVGVybSkge1xyXG4gICAgcmV0dXJuICgnJyArIHZhbHVlKS50b0xvd2VyQ2FzZSgpLmluZGV4T2Yoc2VhcmNoVGVybSkgIT09IC0xO1xyXG59XHJcbmZ1bmN0aW9uIHNvcnRCeUtleShzdGF0ZSkge1xyXG4gICAgcmV0dXJuIHN0YXRlICYmIHN0YXRlLnNsaWNlKCkuc29ydCgoYSwgYikgPT4ge1xyXG4gICAgICAgIGlmIChhLmtleSA8IGIua2V5KVxyXG4gICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgaWYgKGEua2V5ID4gYi5rZXkpXHJcbiAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgIHJldHVybiAwO1xyXG4gICAgfSk7XHJcbn1cclxuZXhwb3J0cy5zb3J0QnlLZXkgPSBzb3J0QnlLZXk7XHJcbmZ1bmN0aW9uIHNpbXBsZUdldChvYmplY3QsIHBhdGgpIHtcclxuICAgIGNvbnN0IHNlY3Rpb25zID0gQXJyYXkuaXNBcnJheShwYXRoKSA/IHBhdGggOiBwYXRoLnNwbGl0KCcuJyk7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlY3Rpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgb2JqZWN0ID0gb2JqZWN0W3NlY3Rpb25zW2ldXTtcclxuICAgICAgICBpZiAoIW9iamVjdCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBvYmplY3Q7XHJcbn1cclxuZXhwb3J0cy5zaW1wbGVHZXQgPSBzaW1wbGVHZXQ7XHJcbmZ1bmN0aW9uIGZvY3VzSW5wdXQoZWwpIHtcclxuICAgIGVsLmZvY3VzKCk7XHJcbiAgICBlbC5zZXRTZWxlY3Rpb25SYW5nZSgwLCBlbC52YWx1ZS5sZW5ndGgpO1xyXG59XHJcbmV4cG9ydHMuZm9jdXNJbnB1dCA9IGZvY3VzSW5wdXQ7XHJcbmZ1bmN0aW9uIG9wZW5JbkVkaXRvcihmaWxlKSB7XHJcbiAgICAvLyBDb25zb2xlIGRpc3BsYXlcclxuICAgIGNvbnN0IGZpbGVOYW1lID0gZmlsZS5yZXBsYWNlKC9cXFxcL2csICdcXFxcXFxcXCcpO1xyXG4gICAgY29uc3Qgc3JjID0gYGZldGNoKCcke3NoYXJlZF9kYXRhXzEuU2hhcmVkRGF0YS5vcGVuSW5FZGl0b3JIb3N0fV9fb3Blbi1pbi1lZGl0b3I/ZmlsZT0ke2VuY29kZVVSSShmaWxlKX0nKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICBpZiAocmVzcG9uc2Uub2spIHtcbiAgICAgIGNvbnNvbGUubG9nKCdGaWxlICR7ZmlsZU5hbWV9IG9wZW5lZCBpbiBlZGl0b3InKVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBtc2cgPSAnT3BlbmluZyBjb21wb25lbnQgJHtmaWxlTmFtZX0gZmFpbGVkJ1xuICAgICAgY29uc3QgdGFyZ2V0ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHt9XG4gICAgICBpZiAodGFyZ2V0Ll9fVlVFX0RFVlRPT0xTX1RPQVNUX18pIHtcbiAgICAgICAgdGFyZ2V0Ll9fVlVFX0RFVlRPT0xTX1RPQVNUX18obXNnLCAnZXJyb3InKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coJyVjJyArIG1zZywgJ2NvbG9yOnJlZCcpXG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZygnQ2hlY2sgdGhlIHNldHVwIG9mIHlvdXIgcHJvamVjdCwgc2VlIGh0dHBzOi8vZGV2dG9vbHMudnVlanMub3JnL2d1aWRlL29wZW4taW4tZWRpdG9yLmh0bWwnKVxuICAgIH1cbiAgfSlgO1xyXG4gICAgaWYgKGVudl8xLmlzQ2hyb21lKSB7XHJcbiAgICAgICAgZW52XzEudGFyZ2V0LmNocm9tZS5kZXZ0b29scy5pbnNwZWN0ZWRXaW5kb3cuZXZhbChzcmMpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWV2YWxcclxuICAgICAgICBldmFsKHNyYyk7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5vcGVuSW5FZGl0b3IgPSBvcGVuSW5FZGl0b3I7XHJcbmNvbnN0IEVTQyA9IHtcclxuICAgICc8JzogJyZsdDsnLFxyXG4gICAgJz4nOiAnJmd0OycsXHJcbiAgICAnXCInOiAnJnF1b3Q7JyxcclxuICAgICcmJzogJyZhbXA7JyxcclxufTtcclxuZnVuY3Rpb24gZXNjYXBlKHMpIHtcclxuICAgIHJldHVybiBzLnJlcGxhY2UoL1s8PlwiJl0vZywgZXNjYXBlQ2hhcik7XHJcbn1cclxuZXhwb3J0cy5lc2NhcGUgPSBlc2NhcGU7XHJcbmZ1bmN0aW9uIGVzY2FwZUNoYXIoYSkge1xyXG4gICAgcmV0dXJuIEVTQ1thXSB8fCBhO1xyXG59XHJcbmZ1bmN0aW9uIGNvcHlUb0NsaXBib2FyZChzdGF0ZSkge1xyXG4gICAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgY29uc3QgZHVtbXlUZXh0QXJlYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RleHRhcmVhJyk7XHJcbiAgICBkdW1teVRleHRBcmVhLnRleHRDb250ZW50ID0gc3RyaW5naWZ5KHN0YXRlKTtcclxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZHVtbXlUZXh0QXJlYSk7XHJcbiAgICBkdW1teVRleHRBcmVhLnNlbGVjdCgpO1xyXG4gICAgZG9jdW1lbnQuZXhlY0NvbW1hbmQoJ2NvcHknKTtcclxuICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoZHVtbXlUZXh0QXJlYSk7XHJcbn1cclxuZXhwb3J0cy5jb3B5VG9DbGlwYm9hcmQgPSBjb3B5VG9DbGlwYm9hcmQ7XHJcbmZ1bmN0aW9uIGlzRW1wdHlPYmplY3Qob2JqKSB7XHJcbiAgICByZXR1cm4gb2JqID09PSBleHBvcnRzLlVOREVGSU5FRCB8fCAhb2JqIHx8IE9iamVjdC5rZXlzKG9iaikubGVuZ3RoID09PSAwO1xyXG59XHJcbmV4cG9ydHMuaXNFbXB0eU9iamVjdCA9IGlzRW1wdHlPYmplY3Q7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXV0aWwuanMubWFwIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFIgPSB0eXBlb2YgUmVmbGVjdCA9PT0gJ29iamVjdCcgPyBSZWZsZWN0IDogbnVsbFxudmFyIFJlZmxlY3RBcHBseSA9IFIgJiYgdHlwZW9mIFIuYXBwbHkgPT09ICdmdW5jdGlvbidcbiAgPyBSLmFwcGx5XG4gIDogZnVuY3Rpb24gUmVmbGVjdEFwcGx5KHRhcmdldCwgcmVjZWl2ZXIsIGFyZ3MpIHtcbiAgICByZXR1cm4gRnVuY3Rpb24ucHJvdG90eXBlLmFwcGx5LmNhbGwodGFyZ2V0LCByZWNlaXZlciwgYXJncyk7XG4gIH1cblxudmFyIFJlZmxlY3RPd25LZXlzXG5pZiAoUiAmJiB0eXBlb2YgUi5vd25LZXlzID09PSAnZnVuY3Rpb24nKSB7XG4gIFJlZmxlY3RPd25LZXlzID0gUi5vd25LZXlzXG59IGVsc2UgaWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMpIHtcbiAgUmVmbGVjdE93bktleXMgPSBmdW5jdGlvbiBSZWZsZWN0T3duS2V5cyh0YXJnZXQpIHtcbiAgICByZXR1cm4gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGFyZ2V0KVxuICAgICAgLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKHRhcmdldCkpO1xuICB9O1xufSBlbHNlIHtcbiAgUmVmbGVjdE93bktleXMgPSBmdW5jdGlvbiBSZWZsZWN0T3duS2V5cyh0YXJnZXQpIHtcbiAgICByZXR1cm4gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGFyZ2V0KTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gUHJvY2Vzc0VtaXRXYXJuaW5nKHdhcm5pbmcpIHtcbiAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS53YXJuKSBjb25zb2xlLndhcm4od2FybmluZyk7XG59XG5cbnZhciBOdW1iZXJJc05hTiA9IE51bWJlci5pc05hTiB8fCBmdW5jdGlvbiBOdW1iZXJJc05hTih2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgIT09IHZhbHVlO1xufVxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIEV2ZW50RW1pdHRlci5pbml0LmNhbGwodGhpcyk7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcbm1vZHVsZS5leHBvcnRzLm9uY2UgPSBvbmNlO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjEwLnhcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50c0NvdW50ID0gMDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnMgYXJlXG4vLyBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxudmFyIGRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuZnVuY3Rpb24gY2hlY2tMaXN0ZW5lcihsaXN0ZW5lcikge1xuICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwibGlzdGVuZXJcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgRnVuY3Rpb24uIFJlY2VpdmVkIHR5cGUgJyArIHR5cGVvZiBsaXN0ZW5lcik7XG4gIH1cbn1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KEV2ZW50RW1pdHRlciwgJ2RlZmF1bHRNYXhMaXN0ZW5lcnMnLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gIH0sXG4gIHNldDogZnVuY3Rpb24oYXJnKSB7XG4gICAgaWYgKHR5cGVvZiBhcmcgIT09ICdudW1iZXInIHx8IGFyZyA8IDAgfHwgTnVtYmVySXNOYU4oYXJnKSkge1xuICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RoZSB2YWx1ZSBvZiBcImRlZmF1bHRNYXhMaXN0ZW5lcnNcIiBpcyBvdXQgb2YgcmFuZ2UuIEl0IG11c3QgYmUgYSBub24tbmVnYXRpdmUgbnVtYmVyLiBSZWNlaXZlZCAnICsgYXJnICsgJy4nKTtcbiAgICB9XG4gICAgZGVmYXVsdE1heExpc3RlbmVycyA9IGFyZztcbiAgfVxufSk7XG5cbkV2ZW50RW1pdHRlci5pbml0ID0gZnVuY3Rpb24oKSB7XG5cbiAgaWYgKHRoaXMuX2V2ZW50cyA9PT0gdW5kZWZpbmVkIHx8XG4gICAgICB0aGlzLl9ldmVudHMgPT09IE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKS5fZXZlbnRzKSB7XG4gICAgdGhpcy5fZXZlbnRzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICB0aGlzLl9ldmVudHNDb3VudCA9IDA7XG4gIH1cblxuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufTtcblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24gc2V0TWF4TGlzdGVuZXJzKG4pIHtcbiAgaWYgKHR5cGVvZiBuICE9PSAnbnVtYmVyJyB8fCBuIDwgMCB8fCBOdW1iZXJJc05hTihuKSkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdUaGUgdmFsdWUgb2YgXCJuXCIgaXMgb3V0IG9mIHJhbmdlLiBJdCBtdXN0IGJlIGEgbm9uLW5lZ2F0aXZlIG51bWJlci4gUmVjZWl2ZWQgJyArIG4gKyAnLicpO1xuICB9XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuZnVuY3Rpb24gX2dldE1heExpc3RlbmVycyh0aGF0KSB7XG4gIGlmICh0aGF0Ll9tYXhMaXN0ZW5lcnMgPT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gIHJldHVybiB0aGF0Ll9tYXhMaXN0ZW5lcnM7XG59XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZ2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24gZ2V0TWF4TGlzdGVuZXJzKCkge1xuICByZXR1cm4gX2dldE1heExpc3RlbmVycyh0aGlzKTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQodHlwZSkge1xuICB2YXIgYXJncyA9IFtdO1xuICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgYXJncy5wdXNoKGFyZ3VtZW50c1tpXSk7XG4gIHZhciBkb0Vycm9yID0gKHR5cGUgPT09ICdlcnJvcicpO1xuXG4gIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHM7XG4gIGlmIChldmVudHMgIT09IHVuZGVmaW5lZClcbiAgICBkb0Vycm9yID0gKGRvRXJyb3IgJiYgZXZlbnRzLmVycm9yID09PSB1bmRlZmluZWQpO1xuICBlbHNlIGlmICghZG9FcnJvcilcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAoZG9FcnJvcikge1xuICAgIHZhciBlcjtcbiAgICBpZiAoYXJncy5sZW5ndGggPiAwKVxuICAgICAgZXIgPSBhcmdzWzBdO1xuICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAvLyBOb3RlOiBUaGUgY29tbWVudHMgb24gdGhlIGB0aHJvd2AgbGluZXMgYXJlIGludGVudGlvbmFsLCB0aGV5IHNob3dcbiAgICAgIC8vIHVwIGluIE5vZGUncyBvdXRwdXQgaWYgdGhpcyByZXN1bHRzIGluIGFuIHVuaGFuZGxlZCBleGNlcHRpb24uXG4gICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICB9XG4gICAgLy8gQXQgbGVhc3QgZ2l2ZSBzb21lIGtpbmQgb2YgY29udGV4dCB0byB0aGUgdXNlclxuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoJ1VuaGFuZGxlZCBlcnJvci4nICsgKGVyID8gJyAoJyArIGVyLm1lc3NhZ2UgKyAnKScgOiAnJykpO1xuICAgIGVyci5jb250ZXh0ID0gZXI7XG4gICAgdGhyb3cgZXJyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICB9XG5cbiAgdmFyIGhhbmRsZXIgPSBldmVudHNbdHlwZV07XG5cbiAgaWYgKGhhbmRsZXIgPT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKHR5cGVvZiBoYW5kbGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgUmVmbGVjdEFwcGx5KGhhbmRsZXIsIHRoaXMsIGFyZ3MpO1xuICB9IGVsc2Uge1xuICAgIHZhciBsZW4gPSBoYW5kbGVyLmxlbmd0aDtcbiAgICB2YXIgbGlzdGVuZXJzID0gYXJyYXlDbG9uZShoYW5kbGVyLCBsZW4pO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpXG4gICAgICBSZWZsZWN0QXBwbHkobGlzdGVuZXJzW2ldLCB0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuZnVuY3Rpb24gX2FkZExpc3RlbmVyKHRhcmdldCwgdHlwZSwgbGlzdGVuZXIsIHByZXBlbmQpIHtcbiAgdmFyIG07XG4gIHZhciBldmVudHM7XG4gIHZhciBleGlzdGluZztcblxuICBjaGVja0xpc3RlbmVyKGxpc3RlbmVyKTtcblxuICBldmVudHMgPSB0YXJnZXQuX2V2ZW50cztcbiAgaWYgKGV2ZW50cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZXZlbnRzID0gdGFyZ2V0Ll9ldmVudHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHRhcmdldC5fZXZlbnRzQ291bnQgPSAwO1xuICB9IGVsc2Uge1xuICAgIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gICAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICAgIGlmIChldmVudHMubmV3TGlzdGVuZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGFyZ2V0LmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyID8gbGlzdGVuZXIubGlzdGVuZXIgOiBsaXN0ZW5lcik7XG5cbiAgICAgIC8vIFJlLWFzc2lnbiBgZXZlbnRzYCBiZWNhdXNlIGEgbmV3TGlzdGVuZXIgaGFuZGxlciBjb3VsZCBoYXZlIGNhdXNlZCB0aGVcbiAgICAgIC8vIHRoaXMuX2V2ZW50cyB0byBiZSBhc3NpZ25lZCB0byBhIG5ldyBvYmplY3RcbiAgICAgIGV2ZW50cyA9IHRhcmdldC5fZXZlbnRzO1xuICAgIH1cbiAgICBleGlzdGluZyA9IGV2ZW50c1t0eXBlXTtcbiAgfVxuXG4gIGlmIChleGlzdGluZyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgZXhpc3RpbmcgPSBldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgICArK3RhcmdldC5fZXZlbnRzQ291bnQ7XG4gIH0gZWxzZSB7XG4gICAgaWYgKHR5cGVvZiBleGlzdGluZyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgICBleGlzdGluZyA9IGV2ZW50c1t0eXBlXSA9XG4gICAgICAgIHByZXBlbmQgPyBbbGlzdGVuZXIsIGV4aXN0aW5nXSA6IFtleGlzdGluZywgbGlzdGVuZXJdO1xuICAgICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIH0gZWxzZSBpZiAocHJlcGVuZCkge1xuICAgICAgZXhpc3RpbmcudW5zaGlmdChsaXN0ZW5lcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4aXN0aW5nLnB1c2gobGlzdGVuZXIpO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gICAgbSA9IF9nZXRNYXhMaXN0ZW5lcnModGFyZ2V0KTtcbiAgICBpZiAobSA+IDAgJiYgZXhpc3RpbmcubGVuZ3RoID4gbSAmJiAhZXhpc3Rpbmcud2FybmVkKSB7XG4gICAgICBleGlzdGluZy53YXJuZWQgPSB0cnVlO1xuICAgICAgLy8gTm8gZXJyb3IgY29kZSBmb3IgdGhpcyBzaW5jZSBpdCBpcyBhIFdhcm5pbmdcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1yZXN0cmljdGVkLXN5bnRheFxuICAgICAgdmFyIHcgPSBuZXcgRXJyb3IoJ1Bvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgbGVhayBkZXRlY3RlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGV4aXN0aW5nLmxlbmd0aCArICcgJyArIFN0cmluZyh0eXBlKSArICcgbGlzdGVuZXJzICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAnYWRkZWQuIFVzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAnaW5jcmVhc2UgbGltaXQnKTtcbiAgICAgIHcubmFtZSA9ICdNYXhMaXN0ZW5lcnNFeGNlZWRlZFdhcm5pbmcnO1xuICAgICAgdy5lbWl0dGVyID0gdGFyZ2V0O1xuICAgICAgdy50eXBlID0gdHlwZTtcbiAgICAgIHcuY291bnQgPSBleGlzdGluZy5sZW5ndGg7XG4gICAgICBQcm9jZXNzRW1pdFdhcm5pbmcodyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRhcmdldDtcbn1cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uIGFkZExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHJldHVybiBfYWRkTGlzdGVuZXIodGhpcywgdHlwZSwgbGlzdGVuZXIsIGZhbHNlKTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnByZXBlbmRMaXN0ZW5lciA9XG4gICAgZnVuY3Rpb24gcHJlcGVuZExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyKSB7XG4gICAgICByZXR1cm4gX2FkZExpc3RlbmVyKHRoaXMsIHR5cGUsIGxpc3RlbmVyLCB0cnVlKTtcbiAgICB9O1xuXG5mdW5jdGlvbiBvbmNlV3JhcHBlcigpIHtcbiAgaWYgKCF0aGlzLmZpcmVkKSB7XG4gICAgdGhpcy50YXJnZXQucmVtb3ZlTGlzdGVuZXIodGhpcy50eXBlLCB0aGlzLndyYXBGbik7XG4gICAgdGhpcy5maXJlZCA9IHRydWU7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICByZXR1cm4gdGhpcy5saXN0ZW5lci5jYWxsKHRoaXMudGFyZ2V0KTtcbiAgICByZXR1cm4gdGhpcy5saXN0ZW5lci5hcHBseSh0aGlzLnRhcmdldCwgYXJndW1lbnRzKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfb25jZVdyYXAodGFyZ2V0LCB0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgc3RhdGUgPSB7IGZpcmVkOiBmYWxzZSwgd3JhcEZuOiB1bmRlZmluZWQsIHRhcmdldDogdGFyZ2V0LCB0eXBlOiB0eXBlLCBsaXN0ZW5lcjogbGlzdGVuZXIgfTtcbiAgdmFyIHdyYXBwZWQgPSBvbmNlV3JhcHBlci5iaW5kKHN0YXRlKTtcbiAgd3JhcHBlZC5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICBzdGF0ZS53cmFwRm4gPSB3cmFwcGVkO1xuICByZXR1cm4gd3JhcHBlZDtcbn1cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24gb25jZSh0eXBlLCBsaXN0ZW5lcikge1xuICBjaGVja0xpc3RlbmVyKGxpc3RlbmVyKTtcbiAgdGhpcy5vbih0eXBlLCBfb25jZVdyYXAodGhpcywgdHlwZSwgbGlzdGVuZXIpKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnByZXBlbmRPbmNlTGlzdGVuZXIgPVxuICAgIGZ1bmN0aW9uIHByZXBlbmRPbmNlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIpIHtcbiAgICAgIGNoZWNrTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgICAgdGhpcy5wcmVwZW5kTGlzdGVuZXIodHlwZSwgX29uY2VXcmFwKHRoaXMsIHR5cGUsIGxpc3RlbmVyKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4vLyBFbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWYgYW5kIG9ubHkgaWYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9XG4gICAgZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIpIHtcbiAgICAgIHZhciBsaXN0LCBldmVudHMsIHBvc2l0aW9uLCBpLCBvcmlnaW5hbExpc3RlbmVyO1xuXG4gICAgICBjaGVja0xpc3RlbmVyKGxpc3RlbmVyKTtcblxuICAgICAgZXZlbnRzID0gdGhpcy5fZXZlbnRzO1xuICAgICAgaWYgKGV2ZW50cyA9PT0gdW5kZWZpbmVkKVxuICAgICAgICByZXR1cm4gdGhpcztcblxuICAgICAgbGlzdCA9IGV2ZW50c1t0eXBlXTtcbiAgICAgIGlmIChsaXN0ID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHwgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKC0tdGhpcy5fZXZlbnRzQ291bnQgPT09IDApXG4gICAgICAgICAgdGhpcy5fZXZlbnRzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgZGVsZXRlIGV2ZW50c1t0eXBlXTtcbiAgICAgICAgICBpZiAoZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3QubGlzdGVuZXIgfHwgbGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBsaXN0ICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHBvc2l0aW9uID0gLTE7XG5cbiAgICAgICAgZm9yIChpID0gbGlzdC5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fCBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikge1xuICAgICAgICAgICAgb3JpZ2luYWxMaXN0ZW5lciA9IGxpc3RbaV0ubGlzdGVuZXI7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgICAgIGlmIChwb3NpdGlvbiA9PT0gMClcbiAgICAgICAgICBsaXN0LnNoaWZ0KCk7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHNwbGljZU9uZShsaXN0LCBwb3NpdGlvbik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpXG4gICAgICAgICAgZXZlbnRzW3R5cGVdID0gbGlzdFswXTtcblxuICAgICAgICBpZiAoZXZlbnRzLnJlbW92ZUxpc3RlbmVyICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIG9yaWdpbmFsTGlzdGVuZXIgfHwgbGlzdGVuZXIpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID1cbiAgICBmdW5jdGlvbiByZW1vdmVBbGxMaXN0ZW5lcnModHlwZSkge1xuICAgICAgdmFyIGxpc3RlbmVycywgZXZlbnRzLCBpO1xuXG4gICAgICBldmVudHMgPSB0aGlzLl9ldmVudHM7XG4gICAgICBpZiAoZXZlbnRzID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gICAgICBpZiAoZXZlbnRzLnJlbW92ZUxpc3RlbmVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICB0aGlzLl9ldmVudHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgICAgIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudHNbdHlwZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGlmICgtLXRoaXMuX2V2ZW50c0NvdW50ID09PSAwKVxuICAgICAgICAgICAgdGhpcy5fZXZlbnRzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBkZWxldGUgZXZlbnRzW3R5cGVdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuXG4gICAgICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMoZXZlbnRzKTtcbiAgICAgICAgdmFyIGtleTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICBrZXkgPSBrZXlzW2ldO1xuICAgICAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgICAgIHRoaXMuX2V2ZW50cyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgICAgIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG5cbiAgICAgIGxpc3RlbmVycyA9IGV2ZW50c1t0eXBlXTtcblxuICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lcnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICAgICAgfSBlbHNlIGlmIChsaXN0ZW5lcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBMSUZPIG9yZGVyXG4gICAgICAgIGZvciAoaSA9IGxpc3RlbmVycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG5mdW5jdGlvbiBfbGlzdGVuZXJzKHRhcmdldCwgdHlwZSwgdW53cmFwKSB7XG4gIHZhciBldmVudHMgPSB0YXJnZXQuX2V2ZW50cztcblxuICBpZiAoZXZlbnRzID09PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIFtdO1xuXG4gIHZhciBldmxpc3RlbmVyID0gZXZlbnRzW3R5cGVdO1xuICBpZiAoZXZsaXN0ZW5lciA9PT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiBbXTtcblxuICBpZiAodHlwZW9mIGV2bGlzdGVuZXIgPT09ICdmdW5jdGlvbicpXG4gICAgcmV0dXJuIHVud3JhcCA/IFtldmxpc3RlbmVyLmxpc3RlbmVyIHx8IGV2bGlzdGVuZXJdIDogW2V2bGlzdGVuZXJdO1xuXG4gIHJldHVybiB1bndyYXAgP1xuICAgIHVud3JhcExpc3RlbmVycyhldmxpc3RlbmVyKSA6IGFycmF5Q2xvbmUoZXZsaXN0ZW5lciwgZXZsaXN0ZW5lci5sZW5ndGgpO1xufVxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uIGxpc3RlbmVycyh0eXBlKSB7XG4gIHJldHVybiBfbGlzdGVuZXJzKHRoaXMsIHR5cGUsIHRydWUpO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yYXdMaXN0ZW5lcnMgPSBmdW5jdGlvbiByYXdMaXN0ZW5lcnModHlwZSkge1xuICByZXR1cm4gX2xpc3RlbmVycyh0aGlzLCB0eXBlLCBmYWxzZSk7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgaWYgKHR5cGVvZiBlbWl0dGVyLmxpc3RlbmVyQ291bnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZW1pdHRlci5saXN0ZW5lckNvdW50KHR5cGUpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBsaXN0ZW5lckNvdW50LmNhbGwoZW1pdHRlciwgdHlwZSk7XG4gIH1cbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJDb3VudCA9IGxpc3RlbmVyQ291bnQ7XG5mdW5jdGlvbiBsaXN0ZW5lckNvdW50KHR5cGUpIHtcbiAgdmFyIGV2ZW50cyA9IHRoaXMuX2V2ZW50cztcblxuICBpZiAoZXZlbnRzICE9PSB1bmRlZmluZWQpIHtcbiAgICB2YXIgZXZsaXN0ZW5lciA9IGV2ZW50c1t0eXBlXTtcblxuICAgIGlmICh0eXBlb2YgZXZsaXN0ZW5lciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIDE7XG4gICAgfSBlbHNlIGlmIChldmxpc3RlbmVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBldmxpc3RlbmVyLmxlbmd0aDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gMDtcbn1cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5ldmVudE5hbWVzID0gZnVuY3Rpb24gZXZlbnROYW1lcygpIHtcbiAgcmV0dXJuIHRoaXMuX2V2ZW50c0NvdW50ID4gMCA/IFJlZmxlY3RPd25LZXlzKHRoaXMuX2V2ZW50cykgOiBbXTtcbn07XG5cbmZ1bmN0aW9uIGFycmF5Q2xvbmUoYXJyLCBuKSB7XG4gIHZhciBjb3B5ID0gbmV3IEFycmF5KG4pO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IG47ICsraSlcbiAgICBjb3B5W2ldID0gYXJyW2ldO1xuICByZXR1cm4gY29weTtcbn1cblxuZnVuY3Rpb24gc3BsaWNlT25lKGxpc3QsIGluZGV4KSB7XG4gIGZvciAoOyBpbmRleCArIDEgPCBsaXN0Lmxlbmd0aDsgaW5kZXgrKylcbiAgICBsaXN0W2luZGV4XSA9IGxpc3RbaW5kZXggKyAxXTtcbiAgbGlzdC5wb3AoKTtcbn1cblxuZnVuY3Rpb24gdW53cmFwTGlzdGVuZXJzKGFycikge1xuICB2YXIgcmV0ID0gbmV3IEFycmF5KGFyci5sZW5ndGgpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHJldC5sZW5ndGg7ICsraSkge1xuICAgIHJldFtpXSA9IGFycltpXS5saXN0ZW5lciB8fCBhcnJbaV07XG4gIH1cbiAgcmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gb25jZShlbWl0dGVyLCBuYW1lKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgZnVuY3Rpb24gZXJyb3JMaXN0ZW5lcihlcnIpIHtcbiAgICAgIGVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIobmFtZSwgcmVzb2x2ZXIpO1xuICAgICAgcmVqZWN0KGVycik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVzb2x2ZXIoKSB7XG4gICAgICBpZiAodHlwZW9mIGVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgZW1pdHRlci5yZW1vdmVMaXN0ZW5lcignZXJyb3InLCBlcnJvckxpc3RlbmVyKTtcbiAgICAgIH1cbiAgICAgIHJlc29sdmUoW10uc2xpY2UuY2FsbChhcmd1bWVudHMpKTtcbiAgICB9O1xuXG4gICAgZXZlbnRUYXJnZXRBZ25vc3RpY0FkZExpc3RlbmVyKGVtaXR0ZXIsIG5hbWUsIHJlc29sdmVyLCB7IG9uY2U6IHRydWUgfSk7XG4gICAgaWYgKG5hbWUgIT09ICdlcnJvcicpIHtcbiAgICAgIGFkZEVycm9ySGFuZGxlcklmRXZlbnRFbWl0dGVyKGVtaXR0ZXIsIGVycm9yTGlzdGVuZXIsIHsgb25jZTogdHJ1ZSB9KTtcbiAgICB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBhZGRFcnJvckhhbmRsZXJJZkV2ZW50RW1pdHRlcihlbWl0dGVyLCBoYW5kbGVyLCBmbGFncykge1xuICBpZiAodHlwZW9mIGVtaXR0ZXIub24gPT09ICdmdW5jdGlvbicpIHtcbiAgICBldmVudFRhcmdldEFnbm9zdGljQWRkTGlzdGVuZXIoZW1pdHRlciwgJ2Vycm9yJywgaGFuZGxlciwgZmxhZ3MpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGV2ZW50VGFyZ2V0QWdub3N0aWNBZGRMaXN0ZW5lcihlbWl0dGVyLCBuYW1lLCBsaXN0ZW5lciwgZmxhZ3MpIHtcbiAgaWYgKHR5cGVvZiBlbWl0dGVyLm9uID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaWYgKGZsYWdzLm9uY2UpIHtcbiAgICAgIGVtaXR0ZXIub25jZShuYW1lLCBsaXN0ZW5lcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVtaXR0ZXIub24obmFtZSwgbGlzdGVuZXIpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlb2YgZW1pdHRlci5hZGRFdmVudExpc3RlbmVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gRXZlbnRUYXJnZXQgZG9lcyBub3QgaGF2ZSBgZXJyb3JgIGV2ZW50IHNlbWFudGljcyBsaWtlIE5vZGVcbiAgICAvLyBFdmVudEVtaXR0ZXJzLCB3ZSBkbyBub3QgbGlzdGVuIGZvciBgZXJyb3JgIGV2ZW50cyBoZXJlLlxuICAgIGVtaXR0ZXIuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBmdW5jdGlvbiB3cmFwTGlzdGVuZXIoYXJnKSB7XG4gICAgICAvLyBJRSBkb2VzIG5vdCBoYXZlIGJ1aWx0aW4gYHsgb25jZTogdHJ1ZSB9YCBzdXBwb3J0IHNvIHdlXG4gICAgICAvLyBoYXZlIHRvIGRvIGl0IG1hbnVhbGx5LlxuICAgICAgaWYgKGZsYWdzLm9uY2UpIHtcbiAgICAgICAgZW1pdHRlci5yZW1vdmVFdmVudExpc3RlbmVyKG5hbWUsIHdyYXBMaXN0ZW5lcik7XG4gICAgICB9XG4gICAgICBsaXN0ZW5lcihhcmcpO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBcImVtaXR0ZXJcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgRXZlbnRFbWl0dGVyLiBSZWNlaXZlZCB0eXBlICcgKyB0eXBlb2YgZW1pdHRlcik7XG4gIH1cbn1cbiIsIi8vICdwYXRoJyBtb2R1bGUgZXh0cmFjdGVkIGZyb20gTm9kZS5qcyB2OC4xMS4xIChvbmx5IHRoZSBwb3NpeCBwYXJ0KVxuLy8gdHJhbnNwbGl0ZWQgd2l0aCBCYWJlbFxuXG4vLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBhc3NlcnRQYXRoKHBhdGgpIHtcbiAgaWYgKHR5cGVvZiBwYXRoICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1BhdGggbXVzdCBiZSBhIHN0cmluZy4gUmVjZWl2ZWQgJyArIEpTT04uc3RyaW5naWZ5KHBhdGgpKTtcbiAgfVxufVxuXG4vLyBSZXNvbHZlcyAuIGFuZCAuLiBlbGVtZW50cyBpbiBhIHBhdGggd2l0aCBkaXJlY3RvcnkgbmFtZXNcbmZ1bmN0aW9uIG5vcm1hbGl6ZVN0cmluZ1Bvc2l4KHBhdGgsIGFsbG93QWJvdmVSb290KSB7XG4gIHZhciByZXMgPSAnJztcbiAgdmFyIGxhc3RTZWdtZW50TGVuZ3RoID0gMDtcbiAgdmFyIGxhc3RTbGFzaCA9IC0xO1xuICB2YXIgZG90cyA9IDA7XG4gIHZhciBjb2RlO1xuICBmb3IgKHZhciBpID0gMDsgaSA8PSBwYXRoLmxlbmd0aDsgKytpKSB7XG4gICAgaWYgKGkgPCBwYXRoLmxlbmd0aClcbiAgICAgIGNvZGUgPSBwYXRoLmNoYXJDb2RlQXQoaSk7XG4gICAgZWxzZSBpZiAoY29kZSA9PT0gNDcgLyovKi8pXG4gICAgICBicmVhaztcbiAgICBlbHNlXG4gICAgICBjb2RlID0gNDcgLyovKi87XG4gICAgaWYgKGNvZGUgPT09IDQ3IC8qLyovKSB7XG4gICAgICBpZiAobGFzdFNsYXNoID09PSBpIC0gMSB8fCBkb3RzID09PSAxKSB7XG4gICAgICAgIC8vIE5PT1BcbiAgICAgIH0gZWxzZSBpZiAobGFzdFNsYXNoICE9PSBpIC0gMSAmJiBkb3RzID09PSAyKSB7XG4gICAgICAgIGlmIChyZXMubGVuZ3RoIDwgMiB8fCBsYXN0U2VnbWVudExlbmd0aCAhPT0gMiB8fCByZXMuY2hhckNvZGVBdChyZXMubGVuZ3RoIC0gMSkgIT09IDQ2IC8qLiovIHx8IHJlcy5jaGFyQ29kZUF0KHJlcy5sZW5ndGggLSAyKSAhPT0gNDYgLyouKi8pIHtcbiAgICAgICAgICBpZiAocmVzLmxlbmd0aCA+IDIpIHtcbiAgICAgICAgICAgIHZhciBsYXN0U2xhc2hJbmRleCA9IHJlcy5sYXN0SW5kZXhPZignLycpO1xuICAgICAgICAgICAgaWYgKGxhc3RTbGFzaEluZGV4ICE9PSByZXMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICBpZiAobGFzdFNsYXNoSW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmVzID0gJyc7XG4gICAgICAgICAgICAgICAgbGFzdFNlZ21lbnRMZW5ndGggPSAwO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlcyA9IHJlcy5zbGljZSgwLCBsYXN0U2xhc2hJbmRleCk7XG4gICAgICAgICAgICAgICAgbGFzdFNlZ21lbnRMZW5ndGggPSByZXMubGVuZ3RoIC0gMSAtIHJlcy5sYXN0SW5kZXhPZignLycpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGxhc3RTbGFzaCA9IGk7XG4gICAgICAgICAgICAgIGRvdHMgPSAwO1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHJlcy5sZW5ndGggPT09IDIgfHwgcmVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgcmVzID0gJyc7XG4gICAgICAgICAgICBsYXN0U2VnbWVudExlbmd0aCA9IDA7XG4gICAgICAgICAgICBsYXN0U2xhc2ggPSBpO1xuICAgICAgICAgICAgZG90cyA9IDA7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFsbG93QWJvdmVSb290KSB7XG4gICAgICAgICAgaWYgKHJlcy5sZW5ndGggPiAwKVxuICAgICAgICAgICAgcmVzICs9ICcvLi4nO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJlcyA9ICcuLic7XG4gICAgICAgICAgbGFzdFNlZ21lbnRMZW5ndGggPSAyO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAocmVzLmxlbmd0aCA+IDApXG4gICAgICAgICAgcmVzICs9ICcvJyArIHBhdGguc2xpY2UobGFzdFNsYXNoICsgMSwgaSk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXMgPSBwYXRoLnNsaWNlKGxhc3RTbGFzaCArIDEsIGkpO1xuICAgICAgICBsYXN0U2VnbWVudExlbmd0aCA9IGkgLSBsYXN0U2xhc2ggLSAxO1xuICAgICAgfVxuICAgICAgbGFzdFNsYXNoID0gaTtcbiAgICAgIGRvdHMgPSAwO1xuICAgIH0gZWxzZSBpZiAoY29kZSA9PT0gNDYgLyouKi8gJiYgZG90cyAhPT0gLTEpIHtcbiAgICAgICsrZG90cztcbiAgICB9IGVsc2Uge1xuICAgICAgZG90cyA9IC0xO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzO1xufVxuXG5mdW5jdGlvbiBfZm9ybWF0KHNlcCwgcGF0aE9iamVjdCkge1xuICB2YXIgZGlyID0gcGF0aE9iamVjdC5kaXIgfHwgcGF0aE9iamVjdC5yb290O1xuICB2YXIgYmFzZSA9IHBhdGhPYmplY3QuYmFzZSB8fCAocGF0aE9iamVjdC5uYW1lIHx8ICcnKSArIChwYXRoT2JqZWN0LmV4dCB8fCAnJyk7XG4gIGlmICghZGlyKSB7XG4gICAgcmV0dXJuIGJhc2U7XG4gIH1cbiAgaWYgKGRpciA9PT0gcGF0aE9iamVjdC5yb290KSB7XG4gICAgcmV0dXJuIGRpciArIGJhc2U7XG4gIH1cbiAgcmV0dXJuIGRpciArIHNlcCArIGJhc2U7XG59XG5cbnZhciBwb3NpeCA9IHtcbiAgLy8gcGF0aC5yZXNvbHZlKFtmcm9tIC4uLl0sIHRvKVxuICByZXNvbHZlOiBmdW5jdGlvbiByZXNvbHZlKCkge1xuICAgIHZhciByZXNvbHZlZFBhdGggPSAnJztcbiAgICB2YXIgcmVzb2x2ZWRBYnNvbHV0ZSA9IGZhbHNlO1xuICAgIHZhciBjd2Q7XG5cbiAgICBmb3IgKHZhciBpID0gYXJndW1lbnRzLmxlbmd0aCAtIDE7IGkgPj0gLTEgJiYgIXJlc29sdmVkQWJzb2x1dGU7IGktLSkge1xuICAgICAgdmFyIHBhdGg7XG4gICAgICBpZiAoaSA+PSAwKVxuICAgICAgICBwYXRoID0gYXJndW1lbnRzW2ldO1xuICAgICAgZWxzZSB7XG4gICAgICAgIGlmIChjd2QgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICBjd2QgPSBwcm9jZXNzLmN3ZCgpO1xuICAgICAgICBwYXRoID0gY3dkO1xuICAgICAgfVxuXG4gICAgICBhc3NlcnRQYXRoKHBhdGgpO1xuXG4gICAgICAvLyBTa2lwIGVtcHR5IGVudHJpZXNcbiAgICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgcmVzb2x2ZWRQYXRoID0gcGF0aCArICcvJyArIHJlc29sdmVkUGF0aDtcbiAgICAgIHJlc29sdmVkQWJzb2x1dGUgPSBwYXRoLmNoYXJDb2RlQXQoMCkgPT09IDQ3IC8qLyovO1xuICAgIH1cblxuICAgIC8vIEF0IHRoaXMgcG9pbnQgdGhlIHBhdGggc2hvdWxkIGJlIHJlc29sdmVkIHRvIGEgZnVsbCBhYnNvbHV0ZSBwYXRoLCBidXRcbiAgICAvLyBoYW5kbGUgcmVsYXRpdmUgcGF0aHMgdG8gYmUgc2FmZSAobWlnaHQgaGFwcGVuIHdoZW4gcHJvY2Vzcy5jd2QoKSBmYWlscylcblxuICAgIC8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxuICAgIHJlc29sdmVkUGF0aCA9IG5vcm1hbGl6ZVN0cmluZ1Bvc2l4KHJlc29sdmVkUGF0aCwgIXJlc29sdmVkQWJzb2x1dGUpO1xuXG4gICAgaWYgKHJlc29sdmVkQWJzb2x1dGUpIHtcbiAgICAgIGlmIChyZXNvbHZlZFBhdGgubGVuZ3RoID4gMClcbiAgICAgICAgcmV0dXJuICcvJyArIHJlc29sdmVkUGF0aDtcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuICcvJztcbiAgICB9IGVsc2UgaWYgKHJlc29sdmVkUGF0aC5sZW5ndGggPiAwKSB7XG4gICAgICByZXR1cm4gcmVzb2x2ZWRQYXRoO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJy4nO1xuICAgIH1cbiAgfSxcblxuICBub3JtYWxpemU6IGZ1bmN0aW9uIG5vcm1hbGl6ZShwYXRoKSB7XG4gICAgYXNzZXJ0UGF0aChwYXRoKTtcblxuICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gMCkgcmV0dXJuICcuJztcblxuICAgIHZhciBpc0Fic29sdXRlID0gcGF0aC5jaGFyQ29kZUF0KDApID09PSA0NyAvKi8qLztcbiAgICB2YXIgdHJhaWxpbmdTZXBhcmF0b3IgPSBwYXRoLmNoYXJDb2RlQXQocGF0aC5sZW5ndGggLSAxKSA9PT0gNDcgLyovKi87XG5cbiAgICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcbiAgICBwYXRoID0gbm9ybWFsaXplU3RyaW5nUG9zaXgocGF0aCwgIWlzQWJzb2x1dGUpO1xuXG4gICAgaWYgKHBhdGgubGVuZ3RoID09PSAwICYmICFpc0Fic29sdXRlKSBwYXRoID0gJy4nO1xuICAgIGlmIChwYXRoLmxlbmd0aCA+IDAgJiYgdHJhaWxpbmdTZXBhcmF0b3IpIHBhdGggKz0gJy8nO1xuXG4gICAgaWYgKGlzQWJzb2x1dGUpIHJldHVybiAnLycgKyBwYXRoO1xuICAgIHJldHVybiBwYXRoO1xuICB9LFxuXG4gIGlzQWJzb2x1dGU6IGZ1bmN0aW9uIGlzQWJzb2x1dGUocGF0aCkge1xuICAgIGFzc2VydFBhdGgocGF0aCk7XG4gICAgcmV0dXJuIHBhdGgubGVuZ3RoID4gMCAmJiBwYXRoLmNoYXJDb2RlQXQoMCkgPT09IDQ3IC8qLyovO1xuICB9LFxuXG4gIGpvaW46IGZ1bmN0aW9uIGpvaW4oKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICByZXR1cm4gJy4nO1xuICAgIHZhciBqb2luZWQ7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyArK2kpIHtcbiAgICAgIHZhciBhcmcgPSBhcmd1bWVudHNbaV07XG4gICAgICBhc3NlcnRQYXRoKGFyZyk7XG4gICAgICBpZiAoYXJnLmxlbmd0aCA+IDApIHtcbiAgICAgICAgaWYgKGpvaW5lZCA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgIGpvaW5lZCA9IGFyZztcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGpvaW5lZCArPSAnLycgKyBhcmc7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChqb2luZWQgPT09IHVuZGVmaW5lZClcbiAgICAgIHJldHVybiAnLic7XG4gICAgcmV0dXJuIHBvc2l4Lm5vcm1hbGl6ZShqb2luZWQpO1xuICB9LFxuXG4gIHJlbGF0aXZlOiBmdW5jdGlvbiByZWxhdGl2ZShmcm9tLCB0bykge1xuICAgIGFzc2VydFBhdGgoZnJvbSk7XG4gICAgYXNzZXJ0UGF0aCh0byk7XG5cbiAgICBpZiAoZnJvbSA9PT0gdG8pIHJldHVybiAnJztcblxuICAgIGZyb20gPSBwb3NpeC5yZXNvbHZlKGZyb20pO1xuICAgIHRvID0gcG9zaXgucmVzb2x2ZSh0byk7XG5cbiAgICBpZiAoZnJvbSA9PT0gdG8pIHJldHVybiAnJztcblxuICAgIC8vIFRyaW0gYW55IGxlYWRpbmcgYmFja3NsYXNoZXNcbiAgICB2YXIgZnJvbVN0YXJ0ID0gMTtcbiAgICBmb3IgKDsgZnJvbVN0YXJ0IDwgZnJvbS5sZW5ndGg7ICsrZnJvbVN0YXJ0KSB7XG4gICAgICBpZiAoZnJvbS5jaGFyQ29kZUF0KGZyb21TdGFydCkgIT09IDQ3IC8qLyovKVxuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgdmFyIGZyb21FbmQgPSBmcm9tLmxlbmd0aDtcbiAgICB2YXIgZnJvbUxlbiA9IGZyb21FbmQgLSBmcm9tU3RhcnQ7XG5cbiAgICAvLyBUcmltIGFueSBsZWFkaW5nIGJhY2tzbGFzaGVzXG4gICAgdmFyIHRvU3RhcnQgPSAxO1xuICAgIGZvciAoOyB0b1N0YXJ0IDwgdG8ubGVuZ3RoOyArK3RvU3RhcnQpIHtcbiAgICAgIGlmICh0by5jaGFyQ29kZUF0KHRvU3RhcnQpICE9PSA0NyAvKi8qLylcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHZhciB0b0VuZCA9IHRvLmxlbmd0aDtcbiAgICB2YXIgdG9MZW4gPSB0b0VuZCAtIHRvU3RhcnQ7XG5cbiAgICAvLyBDb21wYXJlIHBhdGhzIHRvIGZpbmQgdGhlIGxvbmdlc3QgY29tbW9uIHBhdGggZnJvbSByb290XG4gICAgdmFyIGxlbmd0aCA9IGZyb21MZW4gPCB0b0xlbiA/IGZyb21MZW4gOiB0b0xlbjtcbiAgICB2YXIgbGFzdENvbW1vblNlcCA9IC0xO1xuICAgIHZhciBpID0gMDtcbiAgICBmb3IgKDsgaSA8PSBsZW5ndGg7ICsraSkge1xuICAgICAgaWYgKGkgPT09IGxlbmd0aCkge1xuICAgICAgICBpZiAodG9MZW4gPiBsZW5ndGgpIHtcbiAgICAgICAgICBpZiAodG8uY2hhckNvZGVBdCh0b1N0YXJ0ICsgaSkgPT09IDQ3IC8qLyovKSB7XG4gICAgICAgICAgICAvLyBXZSBnZXQgaGVyZSBpZiBgZnJvbWAgaXMgdGhlIGV4YWN0IGJhc2UgcGF0aCBmb3IgYHRvYC5cbiAgICAgICAgICAgIC8vIEZvciBleGFtcGxlOiBmcm9tPScvZm9vL2Jhcic7IHRvPScvZm9vL2Jhci9iYXonXG4gICAgICAgICAgICByZXR1cm4gdG8uc2xpY2UodG9TdGFydCArIGkgKyAxKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGkgPT09IDApIHtcbiAgICAgICAgICAgIC8vIFdlIGdldCBoZXJlIGlmIGBmcm9tYCBpcyB0aGUgcm9vdFxuICAgICAgICAgICAgLy8gRm9yIGV4YW1wbGU6IGZyb209Jy8nOyB0bz0nL2ZvbydcbiAgICAgICAgICAgIHJldHVybiB0by5zbGljZSh0b1N0YXJ0ICsgaSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGZyb21MZW4gPiBsZW5ndGgpIHtcbiAgICAgICAgICBpZiAoZnJvbS5jaGFyQ29kZUF0KGZyb21TdGFydCArIGkpID09PSA0NyAvKi8qLykge1xuICAgICAgICAgICAgLy8gV2UgZ2V0IGhlcmUgaWYgYHRvYCBpcyB0aGUgZXhhY3QgYmFzZSBwYXRoIGZvciBgZnJvbWAuXG4gICAgICAgICAgICAvLyBGb3IgZXhhbXBsZTogZnJvbT0nL2Zvby9iYXIvYmF6JzsgdG89Jy9mb28vYmFyJ1xuICAgICAgICAgICAgbGFzdENvbW1vblNlcCA9IGk7XG4gICAgICAgICAgfSBlbHNlIGlmIChpID09PSAwKSB7XG4gICAgICAgICAgICAvLyBXZSBnZXQgaGVyZSBpZiBgdG9gIGlzIHRoZSByb290LlxuICAgICAgICAgICAgLy8gRm9yIGV4YW1wbGU6IGZyb209Jy9mb28nOyB0bz0nLydcbiAgICAgICAgICAgIGxhc3RDb21tb25TZXAgPSAwO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHZhciBmcm9tQ29kZSA9IGZyb20uY2hhckNvZGVBdChmcm9tU3RhcnQgKyBpKTtcbiAgICAgIHZhciB0b0NvZGUgPSB0by5jaGFyQ29kZUF0KHRvU3RhcnQgKyBpKTtcbiAgICAgIGlmIChmcm9tQ29kZSAhPT0gdG9Db2RlKVxuICAgICAgICBicmVhaztcbiAgICAgIGVsc2UgaWYgKGZyb21Db2RlID09PSA0NyAvKi8qLylcbiAgICAgICAgbGFzdENvbW1vblNlcCA9IGk7XG4gICAgfVxuXG4gICAgdmFyIG91dCA9ICcnO1xuICAgIC8vIEdlbmVyYXRlIHRoZSByZWxhdGl2ZSBwYXRoIGJhc2VkIG9uIHRoZSBwYXRoIGRpZmZlcmVuY2UgYmV0d2VlbiBgdG9gXG4gICAgLy8gYW5kIGBmcm9tYFxuICAgIGZvciAoaSA9IGZyb21TdGFydCArIGxhc3RDb21tb25TZXAgKyAxOyBpIDw9IGZyb21FbmQ7ICsraSkge1xuICAgICAgaWYgKGkgPT09IGZyb21FbmQgfHwgZnJvbS5jaGFyQ29kZUF0KGkpID09PSA0NyAvKi8qLykge1xuICAgICAgICBpZiAob3V0Lmxlbmd0aCA9PT0gMClcbiAgICAgICAgICBvdXQgKz0gJy4uJztcbiAgICAgICAgZWxzZVxuICAgICAgICAgIG91dCArPSAnLy4uJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBMYXN0bHksIGFwcGVuZCB0aGUgcmVzdCBvZiB0aGUgZGVzdGluYXRpb24gKGB0b2ApIHBhdGggdGhhdCBjb21lcyBhZnRlclxuICAgIC8vIHRoZSBjb21tb24gcGF0aCBwYXJ0c1xuICAgIGlmIChvdXQubGVuZ3RoID4gMClcbiAgICAgIHJldHVybiBvdXQgKyB0by5zbGljZSh0b1N0YXJ0ICsgbGFzdENvbW1vblNlcCk7XG4gICAgZWxzZSB7XG4gICAgICB0b1N0YXJ0ICs9IGxhc3RDb21tb25TZXA7XG4gICAgICBpZiAodG8uY2hhckNvZGVBdCh0b1N0YXJ0KSA9PT0gNDcgLyovKi8pXG4gICAgICAgICsrdG9TdGFydDtcbiAgICAgIHJldHVybiB0by5zbGljZSh0b1N0YXJ0KTtcbiAgICB9XG4gIH0sXG5cbiAgX21ha2VMb25nOiBmdW5jdGlvbiBfbWFrZUxvbmcocGF0aCkge1xuICAgIHJldHVybiBwYXRoO1xuICB9LFxuXG4gIGRpcm5hbWU6IGZ1bmN0aW9uIGRpcm5hbWUocGF0aCkge1xuICAgIGFzc2VydFBhdGgocGF0aCk7XG4gICAgaWYgKHBhdGgubGVuZ3RoID09PSAwKSByZXR1cm4gJy4nO1xuICAgIHZhciBjb2RlID0gcGF0aC5jaGFyQ29kZUF0KDApO1xuICAgIHZhciBoYXNSb290ID0gY29kZSA9PT0gNDcgLyovKi87XG4gICAgdmFyIGVuZCA9IC0xO1xuICAgIHZhciBtYXRjaGVkU2xhc2ggPSB0cnVlO1xuICAgIGZvciAodmFyIGkgPSBwYXRoLmxlbmd0aCAtIDE7IGkgPj0gMTsgLS1pKSB7XG4gICAgICBjb2RlID0gcGF0aC5jaGFyQ29kZUF0KGkpO1xuICAgICAgaWYgKGNvZGUgPT09IDQ3IC8qLyovKSB7XG4gICAgICAgICAgaWYgKCFtYXRjaGVkU2xhc2gpIHtcbiAgICAgICAgICAgIGVuZCA9IGk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFdlIHNhdyB0aGUgZmlyc3Qgbm9uLXBhdGggc2VwYXJhdG9yXG4gICAgICAgIG1hdGNoZWRTbGFzaCA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChlbmQgPT09IC0xKSByZXR1cm4gaGFzUm9vdCA/ICcvJyA6ICcuJztcbiAgICBpZiAoaGFzUm9vdCAmJiBlbmQgPT09IDEpIHJldHVybiAnLy8nO1xuICAgIHJldHVybiBwYXRoLnNsaWNlKDAsIGVuZCk7XG4gIH0sXG5cbiAgYmFzZW5hbWU6IGZ1bmN0aW9uIGJhc2VuYW1lKHBhdGgsIGV4dCkge1xuICAgIGlmIChleHQgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgZXh0ICE9PSAnc3RyaW5nJykgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJleHRcIiBhcmd1bWVudCBtdXN0IGJlIGEgc3RyaW5nJyk7XG4gICAgYXNzZXJ0UGF0aChwYXRoKTtcblxuICAgIHZhciBzdGFydCA9IDA7XG4gICAgdmFyIGVuZCA9IC0xO1xuICAgIHZhciBtYXRjaGVkU2xhc2ggPSB0cnVlO1xuICAgIHZhciBpO1xuXG4gICAgaWYgKGV4dCAhPT0gdW5kZWZpbmVkICYmIGV4dC5sZW5ndGggPiAwICYmIGV4dC5sZW5ndGggPD0gcGF0aC5sZW5ndGgpIHtcbiAgICAgIGlmIChleHQubGVuZ3RoID09PSBwYXRoLmxlbmd0aCAmJiBleHQgPT09IHBhdGgpIHJldHVybiAnJztcbiAgICAgIHZhciBleHRJZHggPSBleHQubGVuZ3RoIC0gMTtcbiAgICAgIHZhciBmaXJzdE5vblNsYXNoRW5kID0gLTE7XG4gICAgICBmb3IgKGkgPSBwYXRoLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgIHZhciBjb2RlID0gcGF0aC5jaGFyQ29kZUF0KGkpO1xuICAgICAgICBpZiAoY29kZSA9PT0gNDcgLyovKi8pIHtcbiAgICAgICAgICAgIC8vIElmIHdlIHJlYWNoZWQgYSBwYXRoIHNlcGFyYXRvciB0aGF0IHdhcyBub3QgcGFydCBvZiBhIHNldCBvZiBwYXRoXG4gICAgICAgICAgICAvLyBzZXBhcmF0b3JzIGF0IHRoZSBlbmQgb2YgdGhlIHN0cmluZywgc3RvcCBub3dcbiAgICAgICAgICAgIGlmICghbWF0Y2hlZFNsYXNoKSB7XG4gICAgICAgICAgICAgIHN0YXJ0ID0gaSArIDE7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKGZpcnN0Tm9uU2xhc2hFbmQgPT09IC0xKSB7XG4gICAgICAgICAgICAvLyBXZSBzYXcgdGhlIGZpcnN0IG5vbi1wYXRoIHNlcGFyYXRvciwgcmVtZW1iZXIgdGhpcyBpbmRleCBpbiBjYXNlXG4gICAgICAgICAgICAvLyB3ZSBuZWVkIGl0IGlmIHRoZSBleHRlbnNpb24gZW5kcyB1cCBub3QgbWF0Y2hpbmdcbiAgICAgICAgICAgIG1hdGNoZWRTbGFzaCA9IGZhbHNlO1xuICAgICAgICAgICAgZmlyc3ROb25TbGFzaEVuZCA9IGkgKyAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZXh0SWR4ID49IDApIHtcbiAgICAgICAgICAgIC8vIFRyeSB0byBtYXRjaCB0aGUgZXhwbGljaXQgZXh0ZW5zaW9uXG4gICAgICAgICAgICBpZiAoY29kZSA9PT0gZXh0LmNoYXJDb2RlQXQoZXh0SWR4KSkge1xuICAgICAgICAgICAgICBpZiAoLS1leHRJZHggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgLy8gV2UgbWF0Y2hlZCB0aGUgZXh0ZW5zaW9uLCBzbyBtYXJrIHRoaXMgYXMgdGhlIGVuZCBvZiBvdXIgcGF0aFxuICAgICAgICAgICAgICAgIC8vIGNvbXBvbmVudFxuICAgICAgICAgICAgICAgIGVuZCA9IGk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIEV4dGVuc2lvbiBkb2VzIG5vdCBtYXRjaCwgc28gb3VyIHJlc3VsdCBpcyB0aGUgZW50aXJlIHBhdGhcbiAgICAgICAgICAgICAgLy8gY29tcG9uZW50XG4gICAgICAgICAgICAgIGV4dElkeCA9IC0xO1xuICAgICAgICAgICAgICBlbmQgPSBmaXJzdE5vblNsYXNoRW5kO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoc3RhcnQgPT09IGVuZCkgZW5kID0gZmlyc3ROb25TbGFzaEVuZDtlbHNlIGlmIChlbmQgPT09IC0xKSBlbmQgPSBwYXRoLmxlbmd0aDtcbiAgICAgIHJldHVybiBwYXRoLnNsaWNlKHN0YXJ0LCBlbmQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGkgPSBwYXRoLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgIGlmIChwYXRoLmNoYXJDb2RlQXQoaSkgPT09IDQ3IC8qLyovKSB7XG4gICAgICAgICAgICAvLyBJZiB3ZSByZWFjaGVkIGEgcGF0aCBzZXBhcmF0b3IgdGhhdCB3YXMgbm90IHBhcnQgb2YgYSBzZXQgb2YgcGF0aFxuICAgICAgICAgICAgLy8gc2VwYXJhdG9ycyBhdCB0aGUgZW5kIG9mIHRoZSBzdHJpbmcsIHN0b3Agbm93XG4gICAgICAgICAgICBpZiAoIW1hdGNoZWRTbGFzaCkge1xuICAgICAgICAgICAgICBzdGFydCA9IGkgKyAxO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKGVuZCA9PT0gLTEpIHtcbiAgICAgICAgICAvLyBXZSBzYXcgdGhlIGZpcnN0IG5vbi1wYXRoIHNlcGFyYXRvciwgbWFyayB0aGlzIGFzIHRoZSBlbmQgb2Ygb3VyXG4gICAgICAgICAgLy8gcGF0aCBjb21wb25lbnRcbiAgICAgICAgICBtYXRjaGVkU2xhc2ggPSBmYWxzZTtcbiAgICAgICAgICBlbmQgPSBpICsgMTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoZW5kID09PSAtMSkgcmV0dXJuICcnO1xuICAgICAgcmV0dXJuIHBhdGguc2xpY2Uoc3RhcnQsIGVuZCk7XG4gICAgfVxuICB9LFxuXG4gIGV4dG5hbWU6IGZ1bmN0aW9uIGV4dG5hbWUocGF0aCkge1xuICAgIGFzc2VydFBhdGgocGF0aCk7XG4gICAgdmFyIHN0YXJ0RG90ID0gLTE7XG4gICAgdmFyIHN0YXJ0UGFydCA9IDA7XG4gICAgdmFyIGVuZCA9IC0xO1xuICAgIHZhciBtYXRjaGVkU2xhc2ggPSB0cnVlO1xuICAgIC8vIFRyYWNrIHRoZSBzdGF0ZSBvZiBjaGFyYWN0ZXJzIChpZiBhbnkpIHdlIHNlZSBiZWZvcmUgb3VyIGZpcnN0IGRvdCBhbmRcbiAgICAvLyBhZnRlciBhbnkgcGF0aCBzZXBhcmF0b3Igd2UgZmluZFxuICAgIHZhciBwcmVEb3RTdGF0ZSA9IDA7XG4gICAgZm9yICh2YXIgaSA9IHBhdGgubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgIHZhciBjb2RlID0gcGF0aC5jaGFyQ29kZUF0KGkpO1xuICAgICAgaWYgKGNvZGUgPT09IDQ3IC8qLyovKSB7XG4gICAgICAgICAgLy8gSWYgd2UgcmVhY2hlZCBhIHBhdGggc2VwYXJhdG9yIHRoYXQgd2FzIG5vdCBwYXJ0IG9mIGEgc2V0IG9mIHBhdGhcbiAgICAgICAgICAvLyBzZXBhcmF0b3JzIGF0IHRoZSBlbmQgb2YgdGhlIHN0cmluZywgc3RvcCBub3dcbiAgICAgICAgICBpZiAoIW1hdGNoZWRTbGFzaCkge1xuICAgICAgICAgICAgc3RhcnRQYXJ0ID0gaSArIDE7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgIGlmIChlbmQgPT09IC0xKSB7XG4gICAgICAgIC8vIFdlIHNhdyB0aGUgZmlyc3Qgbm9uLXBhdGggc2VwYXJhdG9yLCBtYXJrIHRoaXMgYXMgdGhlIGVuZCBvZiBvdXJcbiAgICAgICAgLy8gZXh0ZW5zaW9uXG4gICAgICAgIG1hdGNoZWRTbGFzaCA9IGZhbHNlO1xuICAgICAgICBlbmQgPSBpICsgMTtcbiAgICAgIH1cbiAgICAgIGlmIChjb2RlID09PSA0NiAvKi4qLykge1xuICAgICAgICAgIC8vIElmIHRoaXMgaXMgb3VyIGZpcnN0IGRvdCwgbWFyayBpdCBhcyB0aGUgc3RhcnQgb2Ygb3VyIGV4dGVuc2lvblxuICAgICAgICAgIGlmIChzdGFydERvdCA9PT0gLTEpXG4gICAgICAgICAgICBzdGFydERvdCA9IGk7XG4gICAgICAgICAgZWxzZSBpZiAocHJlRG90U3RhdGUgIT09IDEpXG4gICAgICAgICAgICBwcmVEb3RTdGF0ZSA9IDE7XG4gICAgICB9IGVsc2UgaWYgKHN0YXJ0RG90ICE9PSAtMSkge1xuICAgICAgICAvLyBXZSBzYXcgYSBub24tZG90IGFuZCBub24tcGF0aCBzZXBhcmF0b3IgYmVmb3JlIG91ciBkb3QsIHNvIHdlIHNob3VsZFxuICAgICAgICAvLyBoYXZlIGEgZ29vZCBjaGFuY2UgYXQgaGF2aW5nIGEgbm9uLWVtcHR5IGV4dGVuc2lvblxuICAgICAgICBwcmVEb3RTdGF0ZSA9IC0xO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdGFydERvdCA9PT0gLTEgfHwgZW5kID09PSAtMSB8fFxuICAgICAgICAvLyBXZSBzYXcgYSBub24tZG90IGNoYXJhY3RlciBpbW1lZGlhdGVseSBiZWZvcmUgdGhlIGRvdFxuICAgICAgICBwcmVEb3RTdGF0ZSA9PT0gMCB8fFxuICAgICAgICAvLyBUaGUgKHJpZ2h0LW1vc3QpIHRyaW1tZWQgcGF0aCBjb21wb25lbnQgaXMgZXhhY3RseSAnLi4nXG4gICAgICAgIHByZURvdFN0YXRlID09PSAxICYmIHN0YXJ0RG90ID09PSBlbmQgLSAxICYmIHN0YXJ0RG90ID09PSBzdGFydFBhcnQgKyAxKSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuICAgIHJldHVybiBwYXRoLnNsaWNlKHN0YXJ0RG90LCBlbmQpO1xuICB9LFxuXG4gIGZvcm1hdDogZnVuY3Rpb24gZm9ybWF0KHBhdGhPYmplY3QpIHtcbiAgICBpZiAocGF0aE9iamVjdCA9PT0gbnVsbCB8fCB0eXBlb2YgcGF0aE9iamVjdCAhPT0gJ29iamVjdCcpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBcInBhdGhPYmplY3RcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgT2JqZWN0LiBSZWNlaXZlZCB0eXBlICcgKyB0eXBlb2YgcGF0aE9iamVjdCk7XG4gICAgfVxuICAgIHJldHVybiBfZm9ybWF0KCcvJywgcGF0aE9iamVjdCk7XG4gIH0sXG5cbiAgcGFyc2U6IGZ1bmN0aW9uIHBhcnNlKHBhdGgpIHtcbiAgICBhc3NlcnRQYXRoKHBhdGgpO1xuXG4gICAgdmFyIHJldCA9IHsgcm9vdDogJycsIGRpcjogJycsIGJhc2U6ICcnLCBleHQ6ICcnLCBuYW1lOiAnJyB9O1xuICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHJldDtcbiAgICB2YXIgY29kZSA9IHBhdGguY2hhckNvZGVBdCgwKTtcbiAgICB2YXIgaXNBYnNvbHV0ZSA9IGNvZGUgPT09IDQ3IC8qLyovO1xuICAgIHZhciBzdGFydDtcbiAgICBpZiAoaXNBYnNvbHV0ZSkge1xuICAgICAgcmV0LnJvb3QgPSAnLyc7XG4gICAgICBzdGFydCA9IDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0YXJ0ID0gMDtcbiAgICB9XG4gICAgdmFyIHN0YXJ0RG90ID0gLTE7XG4gICAgdmFyIHN0YXJ0UGFydCA9IDA7XG4gICAgdmFyIGVuZCA9IC0xO1xuICAgIHZhciBtYXRjaGVkU2xhc2ggPSB0cnVlO1xuICAgIHZhciBpID0gcGF0aC5sZW5ndGggLSAxO1xuXG4gICAgLy8gVHJhY2sgdGhlIHN0YXRlIG9mIGNoYXJhY3RlcnMgKGlmIGFueSkgd2Ugc2VlIGJlZm9yZSBvdXIgZmlyc3QgZG90IGFuZFxuICAgIC8vIGFmdGVyIGFueSBwYXRoIHNlcGFyYXRvciB3ZSBmaW5kXG4gICAgdmFyIHByZURvdFN0YXRlID0gMDtcblxuICAgIC8vIEdldCBub24tZGlyIGluZm9cbiAgICBmb3IgKDsgaSA+PSBzdGFydDsgLS1pKSB7XG4gICAgICBjb2RlID0gcGF0aC5jaGFyQ29kZUF0KGkpO1xuICAgICAgaWYgKGNvZGUgPT09IDQ3IC8qLyovKSB7XG4gICAgICAgICAgLy8gSWYgd2UgcmVhY2hlZCBhIHBhdGggc2VwYXJhdG9yIHRoYXQgd2FzIG5vdCBwYXJ0IG9mIGEgc2V0IG9mIHBhdGhcbiAgICAgICAgICAvLyBzZXBhcmF0b3JzIGF0IHRoZSBlbmQgb2YgdGhlIHN0cmluZywgc3RvcCBub3dcbiAgICAgICAgICBpZiAoIW1hdGNoZWRTbGFzaCkge1xuICAgICAgICAgICAgc3RhcnRQYXJ0ID0gaSArIDE7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgIGlmIChlbmQgPT09IC0xKSB7XG4gICAgICAgIC8vIFdlIHNhdyB0aGUgZmlyc3Qgbm9uLXBhdGggc2VwYXJhdG9yLCBtYXJrIHRoaXMgYXMgdGhlIGVuZCBvZiBvdXJcbiAgICAgICAgLy8gZXh0ZW5zaW9uXG4gICAgICAgIG1hdGNoZWRTbGFzaCA9IGZhbHNlO1xuICAgICAgICBlbmQgPSBpICsgMTtcbiAgICAgIH1cbiAgICAgIGlmIChjb2RlID09PSA0NiAvKi4qLykge1xuICAgICAgICAgIC8vIElmIHRoaXMgaXMgb3VyIGZpcnN0IGRvdCwgbWFyayBpdCBhcyB0aGUgc3RhcnQgb2Ygb3VyIGV4dGVuc2lvblxuICAgICAgICAgIGlmIChzdGFydERvdCA9PT0gLTEpIHN0YXJ0RG90ID0gaTtlbHNlIGlmIChwcmVEb3RTdGF0ZSAhPT0gMSkgcHJlRG90U3RhdGUgPSAxO1xuICAgICAgICB9IGVsc2UgaWYgKHN0YXJ0RG90ICE9PSAtMSkge1xuICAgICAgICAvLyBXZSBzYXcgYSBub24tZG90IGFuZCBub24tcGF0aCBzZXBhcmF0b3IgYmVmb3JlIG91ciBkb3QsIHNvIHdlIHNob3VsZFxuICAgICAgICAvLyBoYXZlIGEgZ29vZCBjaGFuY2UgYXQgaGF2aW5nIGEgbm9uLWVtcHR5IGV4dGVuc2lvblxuICAgICAgICBwcmVEb3RTdGF0ZSA9IC0xO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdGFydERvdCA9PT0gLTEgfHwgZW5kID09PSAtMSB8fFxuICAgIC8vIFdlIHNhdyBhIG5vbi1kb3QgY2hhcmFjdGVyIGltbWVkaWF0ZWx5IGJlZm9yZSB0aGUgZG90XG4gICAgcHJlRG90U3RhdGUgPT09IDAgfHxcbiAgICAvLyBUaGUgKHJpZ2h0LW1vc3QpIHRyaW1tZWQgcGF0aCBjb21wb25lbnQgaXMgZXhhY3RseSAnLi4nXG4gICAgcHJlRG90U3RhdGUgPT09IDEgJiYgc3RhcnREb3QgPT09IGVuZCAtIDEgJiYgc3RhcnREb3QgPT09IHN0YXJ0UGFydCArIDEpIHtcbiAgICAgIGlmIChlbmQgIT09IC0xKSB7XG4gICAgICAgIGlmIChzdGFydFBhcnQgPT09IDAgJiYgaXNBYnNvbHV0ZSkgcmV0LmJhc2UgPSByZXQubmFtZSA9IHBhdGguc2xpY2UoMSwgZW5kKTtlbHNlIHJldC5iYXNlID0gcmV0Lm5hbWUgPSBwYXRoLnNsaWNlKHN0YXJ0UGFydCwgZW5kKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHN0YXJ0UGFydCA9PT0gMCAmJiBpc0Fic29sdXRlKSB7XG4gICAgICAgIHJldC5uYW1lID0gcGF0aC5zbGljZSgxLCBzdGFydERvdCk7XG4gICAgICAgIHJldC5iYXNlID0gcGF0aC5zbGljZSgxLCBlbmQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0Lm5hbWUgPSBwYXRoLnNsaWNlKHN0YXJ0UGFydCwgc3RhcnREb3QpO1xuICAgICAgICByZXQuYmFzZSA9IHBhdGguc2xpY2Uoc3RhcnRQYXJ0LCBlbmQpO1xuICAgICAgfVxuICAgICAgcmV0LmV4dCA9IHBhdGguc2xpY2Uoc3RhcnREb3QsIGVuZCk7XG4gICAgfVxuXG4gICAgaWYgKHN0YXJ0UGFydCA+IDApIHJldC5kaXIgPSBwYXRoLnNsaWNlKDAsIHN0YXJ0UGFydCAtIDEpO2Vsc2UgaWYgKGlzQWJzb2x1dGUpIHJldC5kaXIgPSAnLyc7XG5cbiAgICByZXR1cm4gcmV0O1xuICB9LFxuXG4gIHNlcDogJy8nLFxuICBkZWxpbWl0ZXI6ICc6JyxcbiAgd2luMzI6IG51bGwsXG4gIHBvc2l4OiBudWxsXG59O1xuXG5wb3NpeC5wb3NpeCA9IHBvc2l4O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHBvc2l4O1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSAobW9kdWxlKSA9PiB7XG5cdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuXHRcdCgpID0+IChtb2R1bGVbJ2RlZmF1bHQnXSkgOlxuXHRcdCgpID0+IChtb2R1bGUpO1xuXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCB7IGE6IGdldHRlciB9KTtcblx0cmV0dXJuIGdldHRlcjtcbn07IiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5nID0gKGZ1bmN0aW9uKCkge1xuXHRpZiAodHlwZW9mIGdsb2JhbFRoaXMgPT09ICdvYmplY3QnKSByZXR1cm4gZ2xvYmFsVGhpcztcblx0dHJ5IHtcblx0XHRyZXR1cm4gdGhpcyB8fCBuZXcgRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdGlmICh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JykgcmV0dXJuIHdpbmRvdztcblx0fVxufSkoKTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiaW1wb3J0IHsgaW5zdGFsbFRvYXN0IH0gZnJvbSAnQGJhY2svdG9hc3QnXG5pbXBvcnQgeyBpc0ZpcmVmb3ggfSBmcm9tICdAdnVlLWRldnRvb2xzL3NoYXJlZC11dGlscydcblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBlID0+IHtcbiAgaWYgKGUuc291cmNlID09PSB3aW5kb3cgJiYgZS5kYXRhLnZ1ZURldGVjdGVkKSB7XG4gICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoZS5kYXRhKVxuICB9XG59KVxuXG5mdW5jdGlvbiBkZXRlY3QgKHdpbikge1xuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAvLyBNZXRob2QgMTogQ2hlY2sgTnV4dC5qc1xuICAgIGNvbnN0IG51eHREZXRlY3RlZCA9ICEhKHdpbmRvdy5fX05VWFRfXyB8fCB3aW5kb3cuJG51eHQpXG5cbiAgICBpZiAobnV4dERldGVjdGVkKSB7XG4gICAgICBsZXQgVnVlXG5cbiAgICAgIGlmICh3aW5kb3cuJG51eHQpIHtcbiAgICAgICAgVnVlID0gd2luZG93LiRudXh0LiRyb290ICYmIHdpbmRvdy4kbnV4dC4kcm9vdC5jb25zdHJ1Y3RvclxuICAgICAgfVxuXG4gICAgICB3aW4ucG9zdE1lc3NhZ2Uoe1xuICAgICAgICBkZXZ0b29sc0VuYWJsZWQ6ICgvKiBWdWUgMiAqLyBWdWUgJiYgVnVlLmNvbmZpZy5kZXZ0b29scykgfHxcbiAgICAgICAgICAoLyogVnVlIDMuMi4xNCsgKi8gd2luZG93Ll9fVlVFX0RFVlRPT0xTX0dMT0JBTF9IT09LX18gJiYgd2luZG93Ll9fVlVFX0RFVlRPT0xTX0dMT0JBTF9IT09LX18uZW5hYmxlZCksXG4gICAgICAgIHZ1ZURldGVjdGVkOiB0cnVlLFxuICAgICAgICBudXh0RGV0ZWN0ZWQ6IHRydWUsXG4gICAgICB9LCAnKicpXG5cbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIC8vIE1ldGhvZCAyOiBDaGVjayAgVnVlIDNcbiAgICBjb25zdCB2dWVEZXRlY3RlZCA9ICEhKHdpbmRvdy5fX1ZVRV9fKVxuICAgIGlmICh2dWVEZXRlY3RlZCkge1xuICAgICAgd2luLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgZGV2dG9vbHNFbmFibGVkOiAvKiBWdWUgMy4yLjE0KyAqLyB3aW5kb3cuX19WVUVfREVWVE9PTFNfR0xPQkFMX0hPT0tfXyAmJiB3aW5kb3cuX19WVUVfREVWVE9PTFNfR0xPQkFMX0hPT0tfXy5lbmFibGVkLFxuICAgICAgICB2dWVEZXRlY3RlZDogdHJ1ZSxcbiAgICAgIH0sICcqJylcblxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gTWV0aG9kIDM6IFNjYW4gYWxsIGVsZW1lbnRzIGluc2lkZSBkb2N1bWVudFxuICAgIGNvbnN0IGFsbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyonKVxuICAgIGxldCBlbFxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYWxsLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYWxsW2ldLl9fdnVlX18pIHtcbiAgICAgICAgZWwgPSBhbGxbaV1cbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGVsKSB7XG4gICAgICBsZXQgVnVlID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGVsLl9fdnVlX18pLmNvbnN0cnVjdG9yXG4gICAgICB3aGlsZSAoVnVlLnN1cGVyKSB7XG4gICAgICAgIFZ1ZSA9IFZ1ZS5zdXBlclxuICAgICAgfVxuICAgICAgd2luLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgZGV2dG9vbHNFbmFibGVkOiBWdWUuY29uZmlnLmRldnRvb2xzLFxuICAgICAgICB2dWVEZXRlY3RlZDogdHJ1ZSxcbiAgICAgIH0sICcqJylcbiAgICB9XG4gIH0sIDEwMClcbn1cblxuLy8gaW5qZWN0IHRoZSBob29rXG5pZiAoZG9jdW1lbnQgaW5zdGFuY2VvZiBIVE1MRG9jdW1lbnQpIHtcbiAgaW5zdGFsbFNjcmlwdChkZXRlY3QpXG4gIGluc3RhbGxTY3JpcHQoaW5zdGFsbFRvYXN0KVxufVxuXG5mdW5jdGlvbiBpbnN0YWxsU2NyaXB0IChmbikge1xuICBjb25zdCBzb3VyY2UgPSAnOygnICsgZm4udG9TdHJpbmcoKSArICcpKHdpbmRvdyknXG5cbiAgaWYgKGlzRmlyZWZveCkge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1ldmFsXG4gICAgd2luZG93LmV2YWwoc291cmNlKSAvLyBpbiBGaXJlZm94LCB0aGlzIGV2YWx1YXRlcyBvbiB0aGUgY29udGVudCB3aW5kb3dcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKVxuICAgIHNjcmlwdC50ZXh0Q29udGVudCA9IHNvdXJjZVxuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5hcHBlbmRDaGlsZChzY3JpcHQpXG4gICAgc2NyaXB0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0KVxuICB9XG59XG4iXSwibmFtZXMiOlsiaW5zdGFsbFRvYXN0IiwiaXNGaXJlZm94Iiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsImUiLCJzb3VyY2UiLCJkYXRhIiwidnVlRGV0ZWN0ZWQiLCJjaHJvbWUiLCJydW50aW1lIiwic2VuZE1lc3NhZ2UiLCJkZXRlY3QiLCJ3aW4iLCJzZXRUaW1lb3V0IiwibnV4dERldGVjdGVkIiwiX19OVVhUX18iLCIkbnV4dCIsIlZ1ZSIsIiRyb290IiwiY29uc3RydWN0b3IiLCJwb3N0TWVzc2FnZSIsImRldnRvb2xzRW5hYmxlZCIsImNvbmZpZyIsImRldnRvb2xzIiwiX19WVUVfREVWVE9PTFNfR0xPQkFMX0hPT0tfXyIsImVuYWJsZWQiLCJfX1ZVRV9fIiwiYWxsIiwiZG9jdW1lbnQiLCJxdWVyeVNlbGVjdG9yQWxsIiwiZWwiLCJpIiwibGVuZ3RoIiwiX192dWVfXyIsIk9iamVjdCIsImdldFByb3RvdHlwZU9mIiwic3VwZXIiLCJIVE1MRG9jdW1lbnQiLCJpbnN0YWxsU2NyaXB0IiwiZm4iLCJ0b1N0cmluZyIsImV2YWwiLCJzY3JpcHQiLCJjcmVhdGVFbGVtZW50IiwidGV4dENvbnRlbnQiLCJkb2N1bWVudEVsZW1lbnQiLCJhcHBlbmRDaGlsZCIsInBhcmVudE5vZGUiLCJyZW1vdmVDaGlsZCJdLCJzb3VyY2VSb290IjoiIn0=