/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "../api/lib/esm/const.js":
/*!*******************************!*\
  !*** ../api/lib/esm/const.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "HOOK_SETUP": () => (/* binding */ HOOK_SETUP),
/* harmony export */   "HOOK_PLUGIN_SETTINGS_SET": () => (/* binding */ HOOK_PLUGIN_SETTINGS_SET)
/* harmony export */ });
const HOOK_SETUP = 'devtools-plugin:setup';
const HOOK_PLUGIN_SETTINGS_SET = 'plugin:settings:set';

/***/ }),

/***/ "../api/lib/esm/env.js":
/*!*****************************!*\
  !*** ../api/lib/esm/env.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getDevtoolsGlobalHook": () => (/* binding */ getDevtoolsGlobalHook),
/* harmony export */   "getTarget": () => (/* binding */ getTarget),
/* harmony export */   "isProxyAvailable": () => (/* binding */ isProxyAvailable)
/* harmony export */ });
function getDevtoolsGlobalHook() {
  return getTarget().__VUE_DEVTOOLS_GLOBAL_HOOK__;
}
function getTarget() {
  // @ts-ignore
  return typeof navigator !== 'undefined' && typeof window !== 'undefined' ? window : typeof __webpack_require__.g !== 'undefined' ? __webpack_require__.g : {};
}
const isProxyAvailable = typeof Proxy === 'function';

/***/ }),

/***/ "../api/lib/esm/index.js":
/*!*******************************!*\
  !*** ../api/lib/esm/index.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "setupDevtoolsPlugin": () => (/* binding */ setupDevtoolsPlugin)
/* harmony export */ });
/* harmony import */ var _env__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./env */ "../api/lib/esm/env.js");
/* harmony import */ var _const__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./const */ "../api/lib/esm/const.js");
/* harmony import */ var _proxy__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./proxy */ "../api/lib/esm/proxy.js");





function setupDevtoolsPlugin(pluginDescriptor, setupFn) {
  const target = (0,_env__WEBPACK_IMPORTED_MODULE_0__.getTarget)();
  const hook = (0,_env__WEBPACK_IMPORTED_MODULE_0__.getDevtoolsGlobalHook)();
  const enableProxy = _env__WEBPACK_IMPORTED_MODULE_0__.isProxyAvailable && pluginDescriptor.enableEarlyProxy;

  if (hook && (target.__VUE_DEVTOOLS_PLUGIN_API_AVAILABLE__ || !enableProxy)) {
    hook.emit(_const__WEBPACK_IMPORTED_MODULE_1__.HOOK_SETUP, pluginDescriptor, setupFn);
  } else {
    const proxy = enableProxy ? new _proxy__WEBPACK_IMPORTED_MODULE_2__.ApiProxy(pluginDescriptor, hook) : null;
    const list = target.__VUE_DEVTOOLS_PLUGINS__ = target.__VUE_DEVTOOLS_PLUGINS__ || [];
    list.push({
      pluginDescriptor,
      setupFn,
      proxy
    });
    if (proxy) setupFn(proxy.proxiedTarget);
  }
}

/***/ }),

/***/ "../api/lib/esm/proxy.js":
/*!*******************************!*\
  !*** ../api/lib/esm/proxy.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ApiProxy": () => (/* binding */ ApiProxy)
/* harmony export */ });
/* harmony import */ var _const__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./const */ "../api/lib/esm/const.js");

class ApiProxy {
  target;
  targetQueue;
  proxiedTarget;
  onQueue;
  proxiedOn;
  plugin;
  hook;
  fallbacks;

  constructor(plugin, hook) {
    this.target = null;
    this.targetQueue = [];
    this.onQueue = [];
    this.plugin = plugin;
    this.hook = hook;
    const defaultSettings = {};

    if (plugin.settings) {
      for (const id in plugin.settings) {
        const item = plugin.settings[id];
        defaultSettings[id] = item.defaultValue;
      }
    }

    const localSettingsSaveId = `__vue-devtools-plugin-settings__${plugin.id}`;
    let currentSettings = Object.assign({}, defaultSettings);

    try {
      const raw = localStorage.getItem(localSettingsSaveId);
      const data = JSON.parse(raw);
      Object.assign(currentSettings, data);
    } catch (e) {// noop
    }

    this.fallbacks = {
      getSettings() {
        return currentSettings;
      },

      setSettings(value) {
        try {
          localStorage.setItem(localSettingsSaveId, JSON.stringify(value));
        } catch (e) {// noop
        }

        currentSettings = value;
      }

    };

    if (hook) {
      hook.on(_const__WEBPACK_IMPORTED_MODULE_0__.HOOK_PLUGIN_SETTINGS_SET, (pluginId, value) => {
        if (pluginId === this.plugin.id) {
          this.fallbacks.setSettings(value);
        }
      });
    }

    this.proxiedOn = new Proxy({}, {
      get: (_target, prop) => {
        if (this.target) {
          return this.target.on[prop];
        } else {
          return (...args) => {
            this.onQueue.push({
              method: prop,
              args
            });
          };
        }
      }
    });
    this.proxiedTarget = new Proxy({}, {
      get: (_target, prop) => {
        if (this.target) {
          return this.target[prop];
        } else if (prop === 'on') {
          return this.proxiedOn;
        } else if (Object.keys(this.fallbacks).includes(prop)) {
          return (...args) => {
            this.targetQueue.push({
              method: prop,
              args,
              resolve: () => {}
            });
            return this.fallbacks[prop](...args);
          };
        } else {
          return (...args) => {
            return new Promise(resolve => {
              this.targetQueue.push({
                method: prop,
                args,
                resolve
              });
            });
          };
        }
      }
    });
  }

  async setRealTarget(target) {
    this.target = target;

    for (const item of this.onQueue) {
      this.target.on[item.method](...item.args);
    }

    for (const item of this.targetQueue) {
      item.resolve(await this.target[item.method](...item.args));
    }
  }

}

/***/ }),

/***/ "../app-backend-api/lib/api.js":
/*!*************************************!*\
  !*** ../app-backend-api/lib/api.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.DevtoolsPluginApiInstance = exports.DevtoolsApi = void 0;

const shared_utils_1 = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js");

const hooks_1 = __webpack_require__(/*! ./hooks */ "../app-backend-api/lib/hooks.js");

const pluginOn = [];

class DevtoolsApi {
  constructor(backend, ctx) {
    this.stateEditor = new shared_utils_1.StateEditor();
    this.backend = backend;
    this.ctx = ctx;
    this.bridge = ctx.bridge;
    this.on = new hooks_1.DevtoolsHookable(ctx);
  }

  async callHook(eventType, payload, ctx = this.ctx) {
    payload = await this.on.callHandlers(eventType, payload, ctx);

    for (const on of pluginOn) {
      payload = await on.callHandlers(eventType, payload, ctx);
    }

    return payload;
  }

  async transformCall(callName, ...args) {
    const payload = await this.callHook("transformCall"
    /* TRANSFORM_CALL */
    , {
      callName,
      inArgs: args,
      outArgs: args.slice()
    });
    return payload.outArgs;
  }

  async getAppRecordName(app, defaultName) {
    const payload = await this.callHook("getAppRecordName"
    /* GET_APP_RECORD_NAME */
    , {
      app,
      name: null
    });

    if (payload.name) {
      return payload.name;
    } else {
      return `App ${defaultName}`;
    }
  }

  async getAppRootInstance(app) {
    const payload = await this.callHook("getAppRootInstance"
    /* GET_APP_ROOT_INSTANCE */
    , {
      app,
      root: null
    });
    return payload.root;
  }

  async registerApplication(app) {
    await this.callHook("registerApplication"
    /* REGISTER_APPLICATION */
    , {
      app
    });
  }

  async walkComponentTree(instance, maxDepth = -1, filter = null) {
    const payload = await this.callHook("walkComponentTree"
    /* WALK_COMPONENT_TREE */
    , {
      componentInstance: instance,
      componentTreeData: null,
      maxDepth,
      filter
    });
    return payload.componentTreeData;
  }

  async visitComponentTree(instance, treeNode, filter = null, app) {
    const payload = await this.callHook("visitComponentTree"
    /* VISIT_COMPONENT_TREE */
    , {
      app,
      componentInstance: instance,
      treeNode,
      filter
    });
    return payload.treeNode;
  }

  async walkComponentParents(instance) {
    const payload = await this.callHook("walkComponentParents"
    /* WALK_COMPONENT_PARENTS */
    , {
      componentInstance: instance,
      parentInstances: []
    });
    return payload.parentInstances;
  }

  async inspectComponent(instance, app) {
    const payload = await this.callHook("inspectComponent"
    /* INSPECT_COMPONENT */
    , {
      app,
      componentInstance: instance,
      instanceData: null
    });
    return payload.instanceData;
  }

  async getComponentBounds(instance) {
    const payload = await this.callHook("getComponentBounds"
    /* GET_COMPONENT_BOUNDS */
    , {
      componentInstance: instance,
      bounds: null
    });
    return payload.bounds;
  }

  async getComponentName(instance) {
    const payload = await this.callHook("getComponentName"
    /* GET_COMPONENT_NAME */
    , {
      componentInstance: instance,
      name: null
    });
    return payload.name;
  }

  async getComponentInstances(app) {
    const payload = await this.callHook("getComponentInstances"
    /* GET_COMPONENT_INSTANCES */
    , {
      app,
      componentInstances: []
    });
    return payload.componentInstances;
  }

  async getElementComponent(element) {
    const payload = await this.callHook("getElementComponent"
    /* GET_ELEMENT_COMPONENT */
    , {
      element,
      componentInstance: null
    });
    return payload.componentInstance;
  }

  async getComponentRootElements(instance) {
    const payload = await this.callHook("getComponentRootElements"
    /* GET_COMPONENT_ROOT_ELEMENTS */
    , {
      componentInstance: instance,
      rootElements: []
    });
    return payload.rootElements;
  }

  async editComponentState(instance, dotPath, type, state, app) {
    const arrayPath = dotPath.split('.');
    const payload = await this.callHook("editComponentState"
    /* EDIT_COMPONENT_STATE */
    , {
      app,
      componentInstance: instance,
      path: arrayPath,
      type,
      state,
      set: (object, path = arrayPath, value = state.value, cb) => this.stateEditor.set(object, path, value, cb || this.stateEditor.createDefaultSetCallback(state))
    });
    return payload.componentInstance;
  }

  async getComponentDevtoolsOptions(instance) {
    const payload = await this.callHook("getAppDevtoolsOptions"
    /* GET_COMPONENT_DEVTOOLS_OPTIONS */
    , {
      componentInstance: instance,
      options: null
    });
    return payload.options || {};
  }

  async getComponentRenderCode(instance) {
    const payload = await this.callHook("getComponentRenderCode"
    /* GET_COMPONENT_RENDER_CODE */
    , {
      componentInstance: instance,
      code: null
    });
    return {
      code: payload.code
    };
  }

  async inspectTimelineEvent(eventData, app) {
    const payload = await this.callHook("inspectTimelineEvent"
    /* INSPECT_TIMELINE_EVENT */
    , {
      event: eventData.event,
      layerId: eventData.layerId,
      app,
      data: eventData.event.data,
      all: eventData.all
    });
    return payload.data;
  }

  async clearTimeline() {
    await this.callHook("timelineCleared"
    /* TIMELINE_CLEARED */
    , {});
  }

  async getInspectorTree(inspectorId, app, filter) {
    const payload = await this.callHook("getInspectorTree"
    /* GET_INSPECTOR_TREE */
    , {
      inspectorId,
      app,
      filter,
      rootNodes: []
    });
    return payload.rootNodes;
  }

  async getInspectorState(inspectorId, app, nodeId) {
    const payload = await this.callHook("getInspectorState"
    /* GET_INSPECTOR_STATE */
    , {
      inspectorId,
      app,
      nodeId,
      state: null
    });
    return payload.state;
  }

  async editInspectorState(inspectorId, app, nodeId, dotPath, type, state) {
    const arrayPath = dotPath.split('.');
    await this.callHook("editInspectorState"
    /* EDIT_INSPECTOR_STATE */
    , {
      inspectorId,
      app,
      nodeId,
      path: arrayPath,
      type,
      state,
      set: (object, path = arrayPath, value = state.value, cb) => this.stateEditor.set(object, path, value, cb || this.stateEditor.createDefaultSetCallback(state))
    });
  }

}

exports.DevtoolsApi = DevtoolsApi;

class DevtoolsPluginApiInstance {
  constructor(plugin, appRecord, ctx) {
    this.bridge = ctx.bridge;
    this.ctx = ctx;
    this.plugin = plugin;
    this.appRecord = appRecord;
    this.backendApi = appRecord.backend.api;
    this.defaultSettings = (0, shared_utils_1.getPluginDefaultSettings)(plugin.descriptor.settings);
    this.on = new hooks_1.DevtoolsHookable(ctx, plugin);
    pluginOn.push(this.on);
  } // Plugin API


  async notifyComponentUpdate(instance = null) {
    if (!this.enabled || !this.hasPermission(shared_utils_1.PluginPermission.COMPONENTS)) return;

    if (instance) {
      this.ctx.hook.emit(shared_utils_1.HookEvents.COMPONENT_UPDATED, ...(await this.backendApi.transformCall(shared_utils_1.HookEvents.COMPONENT_UPDATED, instance)));
    } else {
      this.ctx.hook.emit(shared_utils_1.HookEvents.COMPONENT_UPDATED);
    }
  }

  addTimelineLayer(options) {
    if (!this.enabled || !this.hasPermission(shared_utils_1.PluginPermission.TIMELINE)) return false;
    this.ctx.hook.emit(shared_utils_1.HookEvents.TIMELINE_LAYER_ADDED, options, this.plugin);
    return true;
  }

  addTimelineEvent(options) {
    if (!this.enabled || !this.hasPermission(shared_utils_1.PluginPermission.TIMELINE)) return false;
    this.ctx.hook.emit(shared_utils_1.HookEvents.TIMELINE_EVENT_ADDED, options, this.plugin);
    return true;
  }

  addInspector(options) {
    if (!this.enabled || !this.hasPermission(shared_utils_1.PluginPermission.CUSTOM_INSPECTOR)) return false;
    this.ctx.hook.emit(shared_utils_1.HookEvents.CUSTOM_INSPECTOR_ADD, options, this.plugin);
    return true;
  }

  sendInspectorTree(inspectorId) {
    if (!this.enabled || !this.hasPermission(shared_utils_1.PluginPermission.CUSTOM_INSPECTOR)) return false;
    this.ctx.hook.emit(shared_utils_1.HookEvents.CUSTOM_INSPECTOR_SEND_TREE, inspectorId, this.plugin);
    return true;
  }

  sendInspectorState(inspectorId) {
    if (!this.enabled || !this.hasPermission(shared_utils_1.PluginPermission.CUSTOM_INSPECTOR)) return false;
    this.ctx.hook.emit(shared_utils_1.HookEvents.CUSTOM_INSPECTOR_SEND_STATE, inspectorId, this.plugin);
    return true;
  }

  selectInspectorNode(inspectorId, nodeId) {
    if (!this.enabled || !this.hasPermission(shared_utils_1.PluginPermission.CUSTOM_INSPECTOR)) return false;
    this.ctx.hook.emit(shared_utils_1.HookEvents.CUSTOM_INSPECTOR_SELECT_NODE, inspectorId, nodeId, this.plugin);
    return true;
  }

  getComponentBounds(instance) {
    return this.backendApi.getComponentBounds(instance);
  }

  getComponentName(instance) {
    return this.backendApi.getComponentName(instance);
  }

  getComponentInstances(app) {
    return this.backendApi.getComponentInstances(app);
  }

  highlightElement(instance) {
    if (!this.enabled || !this.hasPermission(shared_utils_1.PluginPermission.COMPONENTS)) return false;
    this.ctx.hook.emit(shared_utils_1.HookEvents.COMPONENT_HIGHLIGHT, instance.__VUE_DEVTOOLS_UID__, this.plugin);
    return true;
  }

  unhighlightElement() {
    if (!this.enabled || !this.hasPermission(shared_utils_1.PluginPermission.COMPONENTS)) return false;
    this.ctx.hook.emit(shared_utils_1.HookEvents.COMPONENT_UNHIGHLIGHT, this.plugin);
    return true;
  }

  getSettings(pluginId) {
    return (0, shared_utils_1.getPluginSettings)(pluginId !== null && pluginId !== void 0 ? pluginId : this.plugin.descriptor.id, this.defaultSettings);
  }

  setSettings(value, pluginId) {
    (0, shared_utils_1.setPluginSettings)(pluginId !== null && pluginId !== void 0 ? pluginId : this.plugin.descriptor.id, value);
  }

  get enabled() {
    return (0, shared_utils_1.hasPluginPermission)(this.plugin.descriptor.id, shared_utils_1.PluginPermission.ENABLED);
  }

  hasPermission(permission) {
    return (0, shared_utils_1.hasPluginPermission)(this.plugin.descriptor.id, permission);
  }

}

exports.DevtoolsPluginApiInstance = DevtoolsPluginApiInstance;

/***/ }),

/***/ "../app-backend-api/lib/app-record.js":
/*!********************************************!*\
  !*** ../app-backend-api/lib/app-record.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));

/***/ }),

/***/ "../app-backend-api/lib/backend-context.js":
/*!*************************************************!*\
  !*** ../app-backend-api/lib/backend-context.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.createBackendContext = void 0;

function createBackendContext(options) {
  return {
    bridge: options.bridge,
    hook: options.hook,
    backends: [],
    appRecords: [],
    currentTab: null,
    currentAppRecord: null,
    currentInspectedComponentId: null,
    plugins: [],
    currentPlugin: null,
    timelineLayers: [],
    nextTimelineEventId: 0,
    timelineEventMap: new Map(),
    perfUniqueGroupId: 0,
    customInspectors: [],
    timelineMarkers: []
  };
}

exports.createBackendContext = createBackendContext;

/***/ }),

/***/ "../app-backend-api/lib/backend.js":
/*!*****************************************!*\
  !*** ../app-backend-api/lib/backend.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.createBackend = exports.defineBackend = exports.BuiltinBackendFeature = void 0;

const api_1 = __webpack_require__(/*! ./api */ "../app-backend-api/lib/api.js");

var BuiltinBackendFeature;

(function (BuiltinBackendFeature) {
  /**
   * @deprecated
   */
  BuiltinBackendFeature["FLUSH"] = "flush";
})(BuiltinBackendFeature = exports.BuiltinBackendFeature || (exports.BuiltinBackendFeature = {}));

function defineBackend(options) {
  return options;
}

exports.defineBackend = defineBackend;

function createBackend(options, ctx) {
  const backend = {
    options,
    api: null
  };
  backend.api = new api_1.DevtoolsApi(backend, ctx);
  options.setup(backend.api);
  return backend;
}

exports.createBackend = createBackend;

/***/ }),

/***/ "../app-backend-api/lib/global-hook.js":
/*!*********************************************!*\
  !*** ../app-backend-api/lib/global-hook.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

/* eslint-disable @typescript-eslint/ban-types */

Object.defineProperty(exports, "__esModule", ({
  value: true
}));

/***/ }),

/***/ "../app-backend-api/lib/hooks.js":
/*!***************************************!*\
  !*** ../app-backend-api/lib/hooks.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.DevtoolsHookable = void 0;

const shared_utils_1 = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js");

class DevtoolsHookable {
  constructor(ctx, plugin = null) {
    this.handlers = {};
    this.ctx = ctx;
    this.plugin = plugin;
  }

  hook(eventType, handler, pluginPermision = null) {
    const handlers = this.handlers[eventType] = this.handlers[eventType] || [];

    if (this.plugin) {
      const originalHandler = handler;

      handler = (...args) => {
        // Plugin permission
        if (!(0, shared_utils_1.hasPluginPermission)(this.plugin.descriptor.id, shared_utils_1.PluginPermission.ENABLED) || pluginPermision && !(0, shared_utils_1.hasPluginPermission)(this.plugin.descriptor.id, pluginPermision)) return; // App scope

        if (!this.plugin.descriptor.disableAppScope && this.ctx.currentAppRecord.options.app !== this.plugin.descriptor.app) return; // Plugin scope

        if (!this.plugin.descriptor.disablePluginScope && args[0].pluginId != null && args[0].pluginId !== this.plugin.descriptor.id) return;
        return originalHandler(...args);
      };
    }

    handlers.push({
      handler,
      plugin: this.ctx.currentPlugin
    });
  }

  async callHandlers(eventType, payload, ctx) {
    if (this.handlers[eventType]) {
      const handlers = this.handlers[eventType];

      for (let i = 0; i < handlers.length; i++) {
        const {
          handler,
          plugin
        } = handlers[i];

        try {
          await handler(payload, ctx);
        } catch (e) {
          console.error(`An error occurred in hook ${eventType}${plugin ? ` registered by plugin ${plugin.descriptor.id}` : ''}`);
          console.error(e);
        }
      }
    }

    return payload;
  }

  transformCall(handler) {
    this.hook("transformCall"
    /* TRANSFORM_CALL */
    , handler);
  }

  getAppRecordName(handler) {
    this.hook("getAppRecordName"
    /* GET_APP_RECORD_NAME */
    , handler);
  }

  getAppRootInstance(handler) {
    this.hook("getAppRootInstance"
    /* GET_APP_ROOT_INSTANCE */
    , handler);
  }

  registerApplication(handler) {
    this.hook("registerApplication"
    /* REGISTER_APPLICATION */
    , handler);
  }

  walkComponentTree(handler) {
    this.hook("walkComponentTree"
    /* WALK_COMPONENT_TREE */
    , handler, shared_utils_1.PluginPermission.COMPONENTS);
  }

  visitComponentTree(handler) {
    this.hook("visitComponentTree"
    /* VISIT_COMPONENT_TREE */
    , handler, shared_utils_1.PluginPermission.COMPONENTS);
  }

  walkComponentParents(handler) {
    this.hook("walkComponentParents"
    /* WALK_COMPONENT_PARENTS */
    , handler, shared_utils_1.PluginPermission.COMPONENTS);
  }

  inspectComponent(handler) {
    this.hook("inspectComponent"
    /* INSPECT_COMPONENT */
    , handler, shared_utils_1.PluginPermission.COMPONENTS);
  }

  getComponentBounds(handler) {
    this.hook("getComponentBounds"
    /* GET_COMPONENT_BOUNDS */
    , handler, shared_utils_1.PluginPermission.COMPONENTS);
  }

  getComponentName(handler) {
    this.hook("getComponentName"
    /* GET_COMPONENT_NAME */
    , handler, shared_utils_1.PluginPermission.COMPONENTS);
  }

  getComponentInstances(handler) {
    this.hook("getComponentInstances"
    /* GET_COMPONENT_INSTANCES */
    , handler, shared_utils_1.PluginPermission.COMPONENTS);
  }

  getElementComponent(handler) {
    this.hook("getElementComponent"
    /* GET_ELEMENT_COMPONENT */
    , handler, shared_utils_1.PluginPermission.COMPONENTS);
  }

  getComponentRootElements(handler) {
    this.hook("getComponentRootElements"
    /* GET_COMPONENT_ROOT_ELEMENTS */
    , handler, shared_utils_1.PluginPermission.COMPONENTS);
  }

  editComponentState(handler) {
    this.hook("editComponentState"
    /* EDIT_COMPONENT_STATE */
    , handler, shared_utils_1.PluginPermission.COMPONENTS);
  }

  getComponentDevtoolsOptions(handler) {
    this.hook("getAppDevtoolsOptions"
    /* GET_COMPONENT_DEVTOOLS_OPTIONS */
    , handler, shared_utils_1.PluginPermission.COMPONENTS);
  }

  getComponentRenderCode(handler) {
    this.hook("getComponentRenderCode"
    /* GET_COMPONENT_RENDER_CODE */
    , handler, shared_utils_1.PluginPermission.COMPONENTS);
  }

  inspectTimelineEvent(handler) {
    this.hook("inspectTimelineEvent"
    /* INSPECT_TIMELINE_EVENT */
    , handler, shared_utils_1.PluginPermission.TIMELINE);
  }

  timelineCleared(handler) {
    this.hook("timelineCleared"
    /* TIMELINE_CLEARED */
    , handler, shared_utils_1.PluginPermission.TIMELINE);
  }

  getInspectorTree(handler) {
    this.hook("getInspectorTree"
    /* GET_INSPECTOR_TREE */
    , handler, shared_utils_1.PluginPermission.CUSTOM_INSPECTOR);
  }

  getInspectorState(handler) {
    this.hook("getInspectorState"
    /* GET_INSPECTOR_STATE */
    , handler, shared_utils_1.PluginPermission.CUSTOM_INSPECTOR);
  }

  editInspectorState(handler) {
    this.hook("editInspectorState"
    /* EDIT_INSPECTOR_STATE */
    , handler, shared_utils_1.PluginPermission.CUSTOM_INSPECTOR);
  }

  setPluginSettings(handler) {
    this.hook("setPluginSettings"
    /* SET_PLUGIN_SETTINGS */
    , handler);
  }

}

exports.DevtoolsHookable = DevtoolsHookable;

/***/ }),

/***/ "../app-backend-api/lib/index.js":
/*!***************************************!*\
  !*** ../app-backend-api/lib/index.js ***!
  \***************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


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

__exportStar(__webpack_require__(/*! ./api */ "../app-backend-api/lib/api.js"), exports);

__exportStar(__webpack_require__(/*! ./app-record */ "../app-backend-api/lib/app-record.js"), exports);

__exportStar(__webpack_require__(/*! ./backend */ "../app-backend-api/lib/backend.js"), exports);

__exportStar(__webpack_require__(/*! ./backend-context */ "../app-backend-api/lib/backend-context.js"), exports);

__exportStar(__webpack_require__(/*! ./global-hook */ "../app-backend-api/lib/global-hook.js"), exports);

__exportStar(__webpack_require__(/*! ./hooks */ "../app-backend-api/lib/hooks.js"), exports);

__exportStar(__webpack_require__(/*! ./plugin */ "../app-backend-api/lib/plugin.js"), exports);

/***/ }),

/***/ "../app-backend-api/lib/plugin.js":
/*!****************************************!*\
  !*** ../app-backend-api/lib/plugin.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));

/***/ }),

/***/ "../app-backend-core/lib/app.js":
/*!**************************************!*\
  !*** ../app-backend-core/lib/app.js ***!
  \**************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports._legacy_getAndRegisterApps = exports.removeApp = exports.sendApps = exports.waitForAppsRegistration = exports.getAppRecord = exports.getAppRecordId = exports.mapAppRecord = exports.selectApp = exports.registerApp = void 0;

const shared_utils_1 = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js");

const speakingurl_1 = __importDefault(__webpack_require__(/*! speakingurl */ "../../node_modules/speakingurl/index.js"));

const queue_1 = __webpack_require__(/*! ./util/queue */ "../app-backend-core/lib/util/queue.js");

const scan_1 = __webpack_require__(/*! ./legacy/scan */ "../app-backend-core/lib/legacy/scan.js");

const timeline_1 = __webpack_require__(/*! ./timeline */ "../app-backend-core/lib/timeline.js");

const backend_1 = __webpack_require__(/*! ./backend */ "../app-backend-core/lib/backend.js");

const jobs = new queue_1.JobQueue();
let recordId = 0;
const appRecordPromises = new Map();

async function registerApp(options, ctx) {
  return jobs.queue(() => registerAppJob(options, ctx));
}

exports.registerApp = registerApp;

async function registerAppJob(options, ctx) {
  // Dedupe
  if (ctx.appRecords.find(a => a.options === options)) {
    return;
  } // Find correct backend


  const baseFrameworkVersion = parseInt(options.version.substr(0, options.version.indexOf('.')));

  for (let i = 0; i < backend_1.availableBackends.length; i++) {
    const backendOptions = backend_1.availableBackends[i];

    if (backendOptions.frameworkVersion === baseFrameworkVersion) {
      // Enable backend if it's not enabled
      const backend = (0, backend_1.getBackend)(backendOptions, ctx);
      await createAppRecord(options, backend, ctx);
      break;
    }
  }
}

async function createAppRecord(options, backend, ctx) {
  var _a;

  const rootInstance = await backend.api.getAppRootInstance(options.app);

  if (rootInstance) {
    if ((await backend.api.getComponentDevtoolsOptions(rootInstance)).hide) {
      return;
    }

    recordId++;
    const name = await backend.api.getAppRecordName(options.app, recordId.toString());
    const id = getAppRecordId(options.app, (0, speakingurl_1.default)(name));
    const [el] = await backend.api.getComponentRootElements(rootInstance);
    const record = {
      id,
      name,
      options,
      backend,
      lastInspectedComponentId: null,
      instanceMap: new Map(),
      rootInstance,
      perfGroupIds: new Map(),
      iframe: document !== el.ownerDocument ? el.ownerDocument.location.pathname : null,
      meta: (_a = options.meta) !== null && _a !== void 0 ? _a : {}
    };
    options.app.__VUE_DEVTOOLS_APP_RECORD__ = record;
    const rootId = `${record.id}:root`;
    record.instanceMap.set(rootId, record.rootInstance);
    record.rootInstance.__VUE_DEVTOOLS_UID__ = rootId; // Timeline

    (0, timeline_1.addBuiltinLayers)(record, ctx);
    ctx.appRecords.push(record);

    if (backend.options.setupApp) {
      backend.options.setupApp(backend.api, record);
    }

    await backend.api.registerApplication(options.app);
    ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_APP_ADD, {
      appRecord: mapAppRecord(record)
    });

    if (appRecordPromises.has(options.app)) {
      for (const r of appRecordPromises.get(options.app)) {
        await r(record);
      }
    } // Auto select first app


    if (ctx.currentAppRecord == null) {
      await selectApp(record, ctx);
    }
  } else {
    console.warn('[Vue devtools] No root instance found for app, it might have been unmounted', options.app);
  }
}

async function selectApp(record, ctx) {
  ctx.currentAppRecord = record;
  ctx.currentInspectedComponentId = record.lastInspectedComponentId;
  ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_APP_SELECTED, {
    id: record.id,
    lastInspectedComponentId: record.lastInspectedComponentId
  });
}

exports.selectApp = selectApp;

function mapAppRecord(record) {
  return {
    id: record.id,
    name: record.name,
    version: record.options.version,
    iframe: record.iframe
  };
}

exports.mapAppRecord = mapAppRecord;
const appIds = new Set();

function getAppRecordId(app, defaultId) {
  if (app.__VUE_DEVTOOLS_APP_RECORD_ID__ != null) {
    return app.__VUE_DEVTOOLS_APP_RECORD_ID__;
  }

  let id = defaultId !== null && defaultId !== void 0 ? defaultId : (recordId++).toString();

  if (defaultId && appIds.has(id)) {
    let count = 1;

    while (appIds.has(`${defaultId}:${count}`)) {
      count++;
    }

    id = `${defaultId}_${count}`;
  }

  appIds.add(id);
  app.__VUE_DEVTOOLS_APP_RECORD_ID__ = id;
  return id;
}

exports.getAppRecordId = getAppRecordId;

async function getAppRecord(app, ctx) {
  const record = ctx.appRecords.find(ar => ar.options.app === app);

  if (record) {
    return record;
  }

  return new Promise((resolve, reject) => {
    let resolvers = appRecordPromises.get(app);
    let timedOut = false;

    if (!resolvers) {
      resolvers = [];
      appRecordPromises.set(app, resolvers);
    }

    const fn = record => {
      if (!timedOut) {
        clearTimeout(timer);
        resolve(record);
      }
    };

    resolvers.push(fn);
    const timer = setTimeout(() => {
      timedOut = true;
      const index = resolvers.indexOf(fn);
      if (index !== -1) resolvers.splice(index, 1);

      if (shared_utils_1.SharedData.debugInfo) {
        // eslint-disable-next-line no-console
        console.log('Timed out waiting for app record', app);
      }

      reject(new Error(`Timed out getting app record for app`));
    }, 60000);
  });
}

exports.getAppRecord = getAppRecord;

function waitForAppsRegistration() {
  return jobs.queue(async () => {});
}

exports.waitForAppsRegistration = waitForAppsRegistration;

async function sendApps(ctx) {
  const appRecords = [];

  for (const appRecord of ctx.appRecords) {
    appRecords.push(appRecord);
  }

  ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_APP_LIST, {
    apps: appRecords.map(mapAppRecord)
  });
}

exports.sendApps = sendApps;

async function removeApp(app, ctx) {
  try {
    const appRecord = await getAppRecord(app, ctx);

    if (appRecord) {
      appIds.delete(appRecord.id);
      const index = ctx.appRecords.indexOf(appRecord);
      if (index !== -1) ctx.appRecords.splice(index, 1);
      (0, timeline_1.removeLayersForApp)(app, ctx);
      ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_APP_REMOVE, {
        id: appRecord.id
      });
    }
  } catch (e) {
    if (shared_utils_1.SharedData.debugInfo) {
      console.error(e);
    }
  }
}

exports.removeApp = removeApp; // eslint-disable-next-line camelcase

async function _legacy_getAndRegisterApps(Vue, ctx) {
  const apps = (0, scan_1.scan)();
  apps.forEach(app => {
    registerApp({
      app,
      types: {},
      version: Vue.version,
      meta: {
        Vue
      }
    }, ctx);
  });
}

exports._legacy_getAndRegisterApps = _legacy_getAndRegisterApps;

/***/ }),

/***/ "../app-backend-core/lib/backend.js":
/*!******************************************!*\
  !*** ../app-backend-core/lib/backend.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.getBackend = exports.availableBackends = void 0;

const app_backend_api_1 = __webpack_require__(/*! @vue-devtools/app-backend-api */ "../app-backend-api/lib/index.js");

const app_backend_vue1_1 = __webpack_require__(/*! @vue-devtools/app-backend-vue1 */ "../app-backend-vue1/lib/index.js");

const app_backend_vue2_1 = __webpack_require__(/*! @vue-devtools/app-backend-vue2 */ "../app-backend-vue2/lib/index.js");

const app_backend_vue3_1 = __webpack_require__(/*! @vue-devtools/app-backend-vue3 */ "../app-backend-vue3/lib/index.js");

const perf_1 = __webpack_require__(/*! ./perf */ "../app-backend-core/lib/perf.js");

exports.availableBackends = [app_backend_vue1_1.backend, app_backend_vue2_1.backend, app_backend_vue3_1.backend];
const enabledBackends = new Map();

function getBackend(backendOptions, ctx) {
  let backend;

  if (!enabledBackends.has(backendOptions)) {
    // Create backend
    backend = (0, app_backend_api_1.createBackend)(backendOptions, ctx);
    (0, perf_1.handleAddPerformanceTag)(backend, ctx);
    enabledBackends.set(backendOptions, backend);
    ctx.backends.push(backend);
  } else {
    backend = enabledBackends.get(backendOptions);
  }

  return backend;
}

exports.getBackend = getBackend;

/***/ }),

/***/ "../app-backend-core/lib/component-pick.js":
/*!*************************************************!*\
  !*** ../app-backend-core/lib/component-pick.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));

const shared_utils_1 = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js");

const highlighter_1 = __webpack_require__(/*! ./highlighter */ "../app-backend-core/lib/highlighter.js");

class ComponentPicker {
  constructor(ctx) {
    this.ctx = ctx;
    this.bindMethods();
  }
  /**
   * Adds event listeners for mouseover and mouseup
   */


  startSelecting() {
    if (!shared_utils_1.isBrowser) return;
    window.addEventListener('mouseover', this.elementMouseOver, true);
    window.addEventListener('click', this.elementClicked, true);
    window.addEventListener('mouseout', this.cancelEvent, true);
    window.addEventListener('mouseenter', this.cancelEvent, true);
    window.addEventListener('mouseleave', this.cancelEvent, true);
    window.addEventListener('mousedown', this.cancelEvent, true);
    window.addEventListener('mouseup', this.cancelEvent, true);
  }
  /**
   * Removes event listeners
   */


  stopSelecting() {
    if (!shared_utils_1.isBrowser) return;
    window.removeEventListener('mouseover', this.elementMouseOver, true);
    window.removeEventListener('click', this.elementClicked, true);
    window.removeEventListener('mouseout', this.cancelEvent, true);
    window.removeEventListener('mouseenter', this.cancelEvent, true);
    window.removeEventListener('mouseleave', this.cancelEvent, true);
    window.removeEventListener('mousedown', this.cancelEvent, true);
    window.removeEventListener('mouseup', this.cancelEvent, true);
    (0, highlighter_1.unHighlight)();
  }
  /**
   * Highlights a component on element mouse over
   */


  async elementMouseOver(e) {
    this.cancelEvent(e);
    const el = e.target;

    if (el) {
      await this.selectElementComponent(el);
    }

    (0, highlighter_1.unHighlight)();

    if (this.selectedInstance) {
      (0, highlighter_1.highlight)(this.selectedInstance, this.selectedBackend, this.ctx);
    }
  }

  async selectElementComponent(el) {
    for (const backend of this.ctx.backends) {
      const instance = await backend.api.getElementComponent(el);

      if (instance) {
        this.selectedInstance = instance;
        this.selectedBackend = backend;
        return;
      }
    }

    this.selectedInstance = null;
    this.selectedBackend = null;
  }
  /**
   * Selects an instance in the component view
   */


  async elementClicked(e) {
    this.cancelEvent(e);

    if (this.selectedInstance && this.selectedBackend) {
      const parentInstances = await this.selectedBackend.api.walkComponentParents(this.selectedInstance);
      this.ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_COMPONENT_PICK, {
        id: this.selectedInstance.__VUE_DEVTOOLS_UID__,
        parentIds: parentInstances.map(i => i.__VUE_DEVTOOLS_UID__)
      });
    } else {
      this.ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_COMPONENT_PICK_CANCELED, null);
    }

    this.stopSelecting();
  }
  /**
   * Cancel a mouse event
   */


  cancelEvent(e) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
  /**
   * Bind class methods to the class scope to avoid rebind for event listeners
   */


  bindMethods() {
    this.startSelecting = this.startSelecting.bind(this);
    this.stopSelecting = this.stopSelecting.bind(this);
    this.elementMouseOver = this.elementMouseOver.bind(this);
    this.elementClicked = this.elementClicked.bind(this);
  }

}

exports["default"] = ComponentPicker;

/***/ }),

/***/ "../app-backend-core/lib/component.js":
/*!********************************************!*\
  !*** ../app-backend-core/lib/component.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.getComponentInstance = exports.getComponentId = exports.editComponentState = exports.sendEmptyComponentData = exports.markSelectedInstance = exports.sendSelectedComponentData = exports.sendComponentTreeData = void 0;

const shared_utils_1 = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js");

const app_backend_api_1 = __webpack_require__(/*! @vue-devtools/app-backend-api */ "../app-backend-api/lib/index.js");

const app_1 = __webpack_require__(/*! ./app */ "../app-backend-core/lib/app.js");

const MAX_$VM = 10;
const $vmQueue = [];

async function sendComponentTreeData(appRecord, instanceId, filter = '', maxDepth = null, ctx) {
  if (!instanceId || appRecord !== ctx.currentAppRecord) return; // Flush will send all components in the tree
  // So we skip individiual tree updates

  if (instanceId !== '_root' && ctx.currentAppRecord.backend.options.features.includes(app_backend_api_1.BuiltinBackendFeature.FLUSH)) {
    return;
  }

  const instance = getComponentInstance(appRecord, instanceId, ctx);

  if (!instance) {
    ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_COMPONENT_TREE, {
      instanceId,
      treeData: null,
      notFound: true
    });
  } else {
    if (filter) filter = filter.toLowerCase();

    if (maxDepth == null) {
      maxDepth = instance === ctx.currentAppRecord.rootInstance ? 2 : 1;
    }

    const data = await appRecord.backend.api.walkComponentTree(instance, maxDepth, filter);
    const payload = {
      instanceId,
      treeData: (0, shared_utils_1.stringify)(data)
    };
    ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_COMPONENT_TREE, payload);
  }
}

exports.sendComponentTreeData = sendComponentTreeData;

async function sendSelectedComponentData(appRecord, instanceId, ctx) {
  if (!instanceId || appRecord !== ctx.currentAppRecord) return;
  const instance = getComponentInstance(appRecord, instanceId, ctx);

  if (!instance) {
    sendEmptyComponentData(instanceId, ctx);
  } else {
    // Expose instance on window
    if (typeof window !== 'undefined') {
      const win = window;
      win.$vm = instance; // $vm0, $vm1, $vm2, ...

      if ($vmQueue[0] !== instance) {
        if ($vmQueue.length >= MAX_$VM) {
          $vmQueue.pop();
        }

        for (let i = $vmQueue.length; i > 0; i--) {
          win[`$vm${i}`] = $vmQueue[i] = $vmQueue[i - 1];
        }

        win.$vm0 = $vmQueue[0] = instance;
      }
    }

    if (shared_utils_1.SharedData.debugInfo) {
      // eslint-disable-next-line no-console
      console.log('[DEBUG] inspect', instance);
    }

    const parentInstances = await appRecord.backend.api.walkComponentParents(instance);
    const payload = {
      instanceId,
      data: (0, shared_utils_1.stringify)(await appRecord.backend.api.inspectComponent(instance, ctx.currentAppRecord.options.app)),
      parentIds: parentInstances.map(i => i.__VUE_DEVTOOLS_UID__)
    };
    ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_COMPONENT_SELECTED_DATA, payload);
    markSelectedInstance(instanceId, ctx);
  }
}

exports.sendSelectedComponentData = sendSelectedComponentData;

function markSelectedInstance(instanceId, ctx) {
  ctx.currentInspectedComponentId = instanceId;
  ctx.currentAppRecord.lastInspectedComponentId = instanceId;
}

exports.markSelectedInstance = markSelectedInstance;

function sendEmptyComponentData(instanceId, ctx) {
  ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_COMPONENT_SELECTED_DATA, {
    instanceId,
    data: null
  });
}

exports.sendEmptyComponentData = sendEmptyComponentData;

async function editComponentState(instanceId, dotPath, type, state, ctx) {
  if (!instanceId) return;
  const instance = getComponentInstance(ctx.currentAppRecord, instanceId, ctx);

  if (instance) {
    if ('value' in state && state.value != null) {
      state.value = (0, shared_utils_1.parse)(state.value, true);
    }

    await ctx.currentAppRecord.backend.api.editComponentState(instance, dotPath, type, state, ctx.currentAppRecord.options.app);
    await sendSelectedComponentData(ctx.currentAppRecord, instanceId, ctx);
  }
}

exports.editComponentState = editComponentState;

async function getComponentId(app, uid, instance, ctx) {
  try {
    if (instance.__VUE_DEVTOOLS_UID__) return instance.__VUE_DEVTOOLS_UID__;
    const appRecord = await (0, app_1.getAppRecord)(app, ctx);
    if (!appRecord) return null;
    const isRoot = appRecord.rootInstance === instance;
    return `${appRecord.id}:${isRoot ? 'root' : uid}`;
  } catch (e) {
    if (shared_utils_1.SharedData.debugInfo) {
      console.error(e);
    }

    return null;
  }
}

exports.getComponentId = getComponentId;

function getComponentInstance(appRecord, instanceId, ctx) {
  if (instanceId === '_root') {
    instanceId = `${appRecord.id}:root`;
  }

  const instance = appRecord.instanceMap.get(instanceId);

  if (!instance && shared_utils_1.SharedData.debugInfo) {
    console.warn(`Instance uid=${instanceId} not found`);
  }

  return instance;
}

exports.getComponentInstance = getComponentInstance;

/***/ }),

/***/ "../app-backend-core/lib/global-hook.js":
/*!**********************************************!*\
  !*** ../app-backend-core/lib/global-hook.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.hook = void 0;

const shared_utils_1 = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js"); // hook should have been injected before this executes.


exports.hook = shared_utils_1.target.__VUE_DEVTOOLS_GLOBAL_HOOK__;

/***/ }),

/***/ "../app-backend-core/lib/highlighter.js":
/*!**********************************************!*\
  !*** ../app-backend-core/lib/highlighter.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.unHighlight = exports.highlight = void 0;

const shared_utils_1 = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js");

const queue_1 = __webpack_require__(/*! ./util/queue */ "../app-backend-core/lib/util/queue.js");

let overlay;
let overlayContent;
let currentInstance;

function createOverlay() {
  if (overlay || !shared_utils_1.isBrowser) return;
  overlay = document.createElement('div');
  overlay.style.backgroundColor = 'rgba(65, 184, 131, 0.35)';
  overlay.style.position = 'fixed';
  overlay.style.zIndex = '99999999999998';
  overlay.style.pointerEvents = 'none';
  overlay.style.borderRadius = '3px';
  overlayContent = document.createElement('div');
  overlayContent.style.position = 'fixed';
  overlayContent.style.zIndex = '99999999999999';
  overlayContent.style.pointerEvents = 'none';
  overlayContent.style.backgroundColor = 'white';
  overlayContent.style.fontFamily = 'monospace';
  overlayContent.style.fontSize = '11px';
  overlayContent.style.padding = '4px 8px';
  overlayContent.style.borderRadius = '3px';
  overlayContent.style.color = '#333';
  overlayContent.style.textAlign = 'center';
  overlayContent.style.border = 'rgba(65, 184, 131, 0.5) 1px solid';
  overlayContent.style.backgroundClip = 'padding-box';
} // Use a job queue to preserve highlight/unhighlight calls order
// This prevents "sticky" highlights that are not removed because highlight is async


const jobQueue = new queue_1.JobQueue();

async function highlight(instance, backend, ctx) {
  await jobQueue.queue(async () => {
    if (!instance) return;
    const bounds = await backend.api.getComponentBounds(instance);

    if (bounds) {
      createOverlay(); // Name

      const name = (await backend.api.getComponentName(instance)) || 'Anonymous';
      const pre = document.createElement('span');
      pre.style.opacity = '0.6';
      pre.innerText = '<';
      const text = document.createElement('span');
      text.style.fontWeight = 'bold';
      text.style.color = '#09ab56';
      text.innerText = name;
      const post = document.createElement('span');
      post.style.opacity = '0.6';
      post.innerText = '>'; // Size

      const size = document.createElement('span');
      size.style.opacity = '0.5';
      size.style.marginLeft = '6px';
      size.appendChild(document.createTextNode((Math.round(bounds.width * 100) / 100).toString()));
      const multiply = document.createElement('span');
      multiply.style.marginLeft = multiply.style.marginRight = '2px';
      multiply.innerText = '×';
      size.appendChild(multiply);
      size.appendChild(document.createTextNode((Math.round(bounds.height * 100) / 100).toString()));
      currentInstance = instance;
      await showOverlay(bounds, [pre, text, post, size]);
    }

    startUpdateTimer(backend, ctx);
  });
}

exports.highlight = highlight;

async function unHighlight() {
  await jobQueue.queue(async () => {
    var _a, _b;

    (_a = overlay === null || overlay === void 0 ? void 0 : overlay.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(overlay);
    (_b = overlayContent === null || overlayContent === void 0 ? void 0 : overlayContent.parentNode) === null || _b === void 0 ? void 0 : _b.removeChild(overlayContent);
    currentInstance = null;
    stopUpdateTimer();
  });
}

exports.unHighlight = unHighlight;

function showOverlay(bounds, children = null) {
  if (!shared_utils_1.isBrowser || !children.length) return;
  positionOverlay(bounds);
  document.body.appendChild(overlay);
  overlayContent.innerHTML = '';
  children.forEach(child => overlayContent.appendChild(child));
  document.body.appendChild(overlayContent);
  positionOverlayContent(bounds);
}

function positionOverlay({
  width = 0,
  height = 0,
  top = 0,
  left = 0
}) {
  overlay.style.width = Math.round(width) + 'px';
  overlay.style.height = Math.round(height) + 'px';
  overlay.style.left = Math.round(left) + 'px';
  overlay.style.top = Math.round(top) + 'px';
}

function positionOverlayContent({
  height = 0,
  top = 0,
  left = 0
}) {
  // Content position (prevents overflow)
  const contentWidth = overlayContent.offsetWidth;
  const contentHeight = overlayContent.offsetHeight;
  let contentLeft = left;

  if (contentLeft < 0) {
    contentLeft = 0;
  } else if (contentLeft + contentWidth > window.innerWidth) {
    contentLeft = window.innerWidth - contentWidth;
  }

  let contentTop = top - contentHeight - 2;

  if (contentTop < 0) {
    contentTop = top + height + 2;
  }

  if (contentTop < 0) {
    contentTop = 0;
  } else if (contentTop + contentHeight > window.innerHeight) {
    contentTop = window.innerHeight - contentHeight;
  }

  overlayContent.style.left = ~~contentLeft + 'px';
  overlayContent.style.top = ~~contentTop + 'px';
}

async function updateOverlay(backend, ctx) {
  if (currentInstance) {
    const bounds = await backend.api.getComponentBounds(currentInstance);

    if (bounds) {
      const sizeEl = overlayContent.children.item(3);
      const widthEl = sizeEl.childNodes[0];
      widthEl.textContent = (Math.round(bounds.width * 100) / 100).toString();
      const heightEl = sizeEl.childNodes[2];
      heightEl.textContent = (Math.round(bounds.height * 100) / 100).toString();
      positionOverlay(bounds);
      positionOverlayContent(bounds);
    }
  }
}

let updateTimer;

function startUpdateTimer(backend, ctx) {
  stopUpdateTimer();
  updateTimer = setInterval(() => {
    jobQueue.queue(async () => {
      await updateOverlay(backend, ctx);
    });
  }, 1000 / 30); // 30fps
}

function stopUpdateTimer() {
  clearInterval(updateTimer);
}

/***/ }),

/***/ "../app-backend-core/lib/index.js":
/*!****************************************!*\
  !*** ../app-backend-core/lib/index.js ***!
  \****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

var _a, _b;

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.initBackend = void 0;

const app_backend_api_1 = __webpack_require__(/*! @vue-devtools/app-backend-api */ "../app-backend-api/lib/index.js");

const shared_utils_1 = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js");

const debounce_1 = __importDefault(__webpack_require__(/*! lodash/debounce */ "../../node_modules/lodash/debounce.js"));

const global_hook_1 = __webpack_require__(/*! ./global-hook */ "../app-backend-core/lib/global-hook.js");

const subscriptions_1 = __webpack_require__(/*! ./util/subscriptions */ "../app-backend-core/lib/util/subscriptions.js");

const highlighter_1 = __webpack_require__(/*! ./highlighter */ "../app-backend-core/lib/highlighter.js");

const timeline_1 = __webpack_require__(/*! ./timeline */ "../app-backend-core/lib/timeline.js");

const component_pick_1 = __importDefault(__webpack_require__(/*! ./component-pick */ "../app-backend-core/lib/component-pick.js"));

const component_1 = __webpack_require__(/*! ./component */ "../app-backend-core/lib/component.js");

const plugin_1 = __webpack_require__(/*! ./plugin */ "../app-backend-core/lib/plugin.js");

const app_1 = __webpack_require__(/*! ./app */ "../app-backend-core/lib/app.js");

const inspector_1 = __webpack_require__(/*! ./inspector */ "../app-backend-core/lib/inspector.js");

const timeline_screenshot_1 = __webpack_require__(/*! ./timeline-screenshot */ "../app-backend-core/lib/timeline-screenshot.js");

const perf_1 = __webpack_require__(/*! ./perf */ "../app-backend-core/lib/perf.js");

const page_config_1 = __webpack_require__(/*! ./page-config */ "../app-backend-core/lib/page-config.js");

const timeline_marker_1 = __webpack_require__(/*! ./timeline-marker */ "../app-backend-core/lib/timeline-marker.js");

let ctx = (_a = shared_utils_1.target.__vdevtools_ctx) !== null && _a !== void 0 ? _a : null;
let connected = (_b = shared_utils_1.target.__vdevtools_connected) !== null && _b !== void 0 ? _b : false;

async function initBackend(bridge) {
  await (0, shared_utils_1.initSharedData)({
    bridge,
    persist: false
  });
  (0, page_config_1.initOnPageConfig)();

  if (!connected) {
    // connected = false
    ctx = shared_utils_1.target.__vdevtools_ctx = (0, app_backend_api_1.createBackendContext)({
      bridge,
      hook: global_hook_1.hook
    });

    if (global_hook_1.hook.Vue) {
      connect();
      (0, app_1._legacy_getAndRegisterApps)(global_hook_1.hook.Vue, ctx);
    } else {
      global_hook_1.hook.once(shared_utils_1.HookEvents.INIT, Vue => {
        (0, app_1._legacy_getAndRegisterApps)(Vue, ctx);
      });
    }

    global_hook_1.hook.on(shared_utils_1.HookEvents.APP_ADD, async app => {
      await (0, app_1.registerApp)(app, ctx); // Will init connect

      global_hook_1.hook.emit(shared_utils_1.HookEvents.INIT);
    }); // Add apps that already sent init

    if (global_hook_1.hook.apps.length) {
      global_hook_1.hook.apps.forEach(app => {
        (0, app_1.registerApp)(app, ctx);
        connect();
      });
    }
  } else {
    ctx.bridge = bridge;
    connectBridge();
  }
}

exports.initBackend = initBackend;

async function connect() {
  if (connected) {
    return;
  }

  connected = shared_utils_1.target.__vdevtools_connected = true;
  await (0, app_1.waitForAppsRegistration)();
  connectBridge();
  ctx.currentTab = shared_utils_1.BuiltinTabs.COMPONENTS; // Apps

  global_hook_1.hook.on(shared_utils_1.HookEvents.APP_UNMOUNT, app => {
    (0, app_1.removeApp)(app, ctx);
  }); // Components

  global_hook_1.hook.on(shared_utils_1.HookEvents.COMPONENT_UPDATED, async (app, uid, parentUid, component) => {
    try {
      let id;
      let appRecord;

      if (app && uid != null) {
        id = await (0, component_1.getComponentId)(app, uid, component, ctx);
        appRecord = await (0, app_1.getAppRecord)(app, ctx);
      } else {
        id = ctx.currentInspectedComponentId;
        appRecord = ctx.currentAppRecord;
      } // Update component inspector


      if (id && (0, subscriptions_1.isSubscribed)(shared_utils_1.BridgeSubscriptions.SELECTED_COMPONENT_DATA, sub => sub.payload.instanceId === id)) {
        (0, component_1.sendSelectedComponentData)(appRecord, id, ctx);
      } // Update tree (tags)


      if ((0, subscriptions_1.isSubscribed)(shared_utils_1.BridgeSubscriptions.COMPONENT_TREE, sub => sub.payload.instanceId === id)) {
        (0, component_1.sendComponentTreeData)(appRecord, id, appRecord.componentFilter, 0, ctx);
      }
    } catch (e) {
      if (shared_utils_1.SharedData.debugInfo) {
        console.error(e);
      }
    }
  });
  global_hook_1.hook.on(shared_utils_1.HookEvents.COMPONENT_ADDED, async (app, uid, parentUid, component) => {
    try {
      const id = await (0, component_1.getComponentId)(app, uid, component, ctx);
      const appRecord = await (0, app_1.getAppRecord)(app, ctx);

      if (component) {
        if (component.__VUE_DEVTOOLS_UID__ == null) {
          component.__VUE_DEVTOOLS_UID__ = id;
        }

        if (!appRecord.instanceMap.has(id)) {
          appRecord.instanceMap.set(id, component);
        }
      }

      if (parentUid != null) {
        const parentInstances = await appRecord.backend.api.walkComponentParents(component);

        if (parentInstances.length) {
          // Check two parents level to update `hasChildren
          for (let i = 0; i < 2 && i < parentInstances.length; i++) {
            const parentId = await (0, component_1.getComponentId)(app, parentUid, parentInstances[i], ctx);

            if ((0, subscriptions_1.isSubscribed)(shared_utils_1.BridgeSubscriptions.COMPONENT_TREE, sub => sub.payload.instanceId === parentId)) {
              requestAnimationFrame(() => {
                (0, component_1.sendComponentTreeData)(appRecord, parentId, appRecord.componentFilter, null, ctx);
              });
            }
          }
        }
      }

      if (ctx.currentInspectedComponentId === id) {
        (0, component_1.sendSelectedComponentData)(appRecord, id, ctx);
      }
    } catch (e) {
      if (shared_utils_1.SharedData.debugInfo) {
        console.error(e);
      }
    }
  });
  global_hook_1.hook.on(shared_utils_1.HookEvents.COMPONENT_REMOVED, async (app, uid, parentUid, component) => {
    try {
      const appRecord = await (0, app_1.getAppRecord)(app, ctx);

      if (parentUid != null) {
        const parentInstances = await appRecord.backend.api.walkComponentParents(component);

        if (parentInstances.length) {
          const parentId = await (0, component_1.getComponentId)(app, parentUid, parentInstances[0], ctx);

          if ((0, subscriptions_1.isSubscribed)(shared_utils_1.BridgeSubscriptions.COMPONENT_TREE, sub => sub.payload.instanceId === parentId)) {
            requestAnimationFrame(async () => {
              try {
                (0, component_1.sendComponentTreeData)(await (0, app_1.getAppRecord)(app, ctx), parentId, appRecord.componentFilter, null, ctx);
              } catch (e) {
                if (shared_utils_1.SharedData.debugInfo) {
                  console.error(e);
                }
              }
            });
          }
        }
      }

      const id = await (0, component_1.getComponentId)(app, uid, component, ctx);

      if ((0, subscriptions_1.isSubscribed)(shared_utils_1.BridgeSubscriptions.SELECTED_COMPONENT_DATA, sub => sub.payload.instanceId === id)) {
        (0, component_1.sendEmptyComponentData)(id, ctx);
      }

      appRecord.instanceMap.delete(id);
    } catch (e) {
      if (shared_utils_1.SharedData.debugInfo) {
        console.error(e);
      }
    }
  }); // Component perf

  global_hook_1.hook.on(shared_utils_1.HookEvents.PERFORMANCE_START, (app, uid, vm, type, time) => {
    (0, perf_1.performanceMarkStart)(app, uid, vm, type, time, ctx);
  });
  global_hook_1.hook.on(shared_utils_1.HookEvents.PERFORMANCE_END, (app, uid, vm, type, time) => {
    (0, perf_1.performanceMarkEnd)(app, uid, vm, type, time, ctx);
  }); // Highlighter

  global_hook_1.hook.on(shared_utils_1.HookEvents.COMPONENT_HIGHLIGHT, instanceId => {
    (0, highlighter_1.highlight)(ctx.currentAppRecord.instanceMap.get(instanceId), ctx.currentAppRecord.backend, ctx);
  });
  global_hook_1.hook.on(shared_utils_1.HookEvents.COMPONENT_UNHIGHLIGHT, () => {
    (0, highlighter_1.unHighlight)();
  }); // Timeline

  (0, timeline_1.setupTimeline)(ctx);
  global_hook_1.hook.on(shared_utils_1.HookEvents.TIMELINE_LAYER_ADDED, async (options, plugin) => {
    const appRecord = await (0, app_1.getAppRecord)(plugin.descriptor.app, ctx);
    ctx.timelineLayers.push({ ...options,
      appRecord,
      plugin,
      events: []
    });
    ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_TIMELINE_LAYER_ADD, {});
  });
  global_hook_1.hook.on(shared_utils_1.HookEvents.TIMELINE_EVENT_ADDED, async (options, plugin) => {
    await (0, timeline_1.addTimelineEvent)(options, plugin.descriptor.app, ctx);
  }); // Custom inspectors

  global_hook_1.hook.on(shared_utils_1.HookEvents.CUSTOM_INSPECTOR_ADD, async (options, plugin) => {
    const appRecord = await (0, app_1.getAppRecord)(plugin.descriptor.app, ctx);
    ctx.customInspectors.push({ ...options,
      appRecord,
      plugin,
      treeFilter: '',
      selectedNodeId: null
    });
    ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_CUSTOM_INSPECTOR_ADD, {});
  });
  global_hook_1.hook.on(shared_utils_1.HookEvents.CUSTOM_INSPECTOR_SEND_TREE, (inspectorId, plugin) => {
    const inspector = (0, inspector_1.getInspector)(inspectorId, plugin.descriptor.app, ctx);

    if (inspector) {
      (0, inspector_1.sendInspectorTree)(inspector, ctx);
    } else if (shared_utils_1.SharedData.debugInfo) {
      console.warn(`Inspector ${inspectorId} not found`);
    }
  });
  global_hook_1.hook.on(shared_utils_1.HookEvents.CUSTOM_INSPECTOR_SEND_STATE, (inspectorId, plugin) => {
    const inspector = (0, inspector_1.getInspector)(inspectorId, plugin.descriptor.app, ctx);

    if (inspector) {
      (0, inspector_1.sendInspectorState)(inspector, ctx);
    } else if (shared_utils_1.SharedData.debugInfo) {
      console.warn(`Inspector ${inspectorId} not found`);
    }
  });
  global_hook_1.hook.on(shared_utils_1.HookEvents.CUSTOM_INSPECTOR_SELECT_NODE, async (inspectorId, nodeId, plugin) => {
    const inspector = (0, inspector_1.getInspector)(inspectorId, plugin.descriptor.app, ctx);

    if (inspector) {
      await (0, inspector_1.selectInspectorNode)(inspector, nodeId, ctx);
    } else if (shared_utils_1.SharedData.debugInfo) {
      console.warn(`Inspector ${inspectorId} not found`);
    }
  }); // Plugins

  (0, plugin_1.addPreviouslyRegisteredPlugins)(ctx);
  (0, plugin_1.addQueuedPlugins)(ctx);
  global_hook_1.hook.on(shared_utils_1.HookEvents.SETUP_DEVTOOLS_PLUGIN, async (pluginDescriptor, setupFn) => {
    await (0, plugin_1.addPlugin)({
      pluginDescriptor,
      setupFn
    }, ctx);
  });
  shared_utils_1.target.__VUE_DEVTOOLS_PLUGIN_API_AVAILABLE__ = true; // Legacy flush

  const handleFlush = (0, debounce_1.default)(() => {
    var _a;

    if ((_a = ctx.currentAppRecord) === null || _a === void 0 ? void 0 : _a.backend.options.features.includes(app_backend_api_1.BuiltinBackendFeature.FLUSH)) {
      (0, component_1.sendComponentTreeData)(ctx.currentAppRecord, '_root', ctx.currentAppRecord.componentFilter, null, ctx);

      if (ctx.currentInspectedComponentId) {
        (0, component_1.sendSelectedComponentData)(ctx.currentAppRecord, ctx.currentInspectedComponentId, ctx);
      }
    }
  }, 500);
  global_hook_1.hook.off(shared_utils_1.HookEvents.FLUSH);
  global_hook_1.hook.on(shared_utils_1.HookEvents.FLUSH, handleFlush); // Connect done

  (0, timeline_marker_1.addTimelineMarker)({
    id: 'vue-devtools-init-backend',
    time: Date.now(),
    label: 'Vue Devtools connected',
    color: 0x41B883,
    all: true
  }, ctx);
}

function connectBridge() {
  // Subscriptions
  ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_SUBSCRIBE, ({
    type,
    payload
  }) => {
    (0, subscriptions_1.subscribe)(type, payload);
  });
  ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_UNSUBSCRIBE, ({
    type,
    payload
  }) => {
    (0, subscriptions_1.unsubscribe)(type, payload);
  }); // Tabs

  ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_TAB_SWITCH, async tab => {
    ctx.currentTab = tab;
    await (0, highlighter_1.unHighlight)();
  }); // Apps

  ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_APP_LIST, () => {
    (0, app_1.sendApps)(ctx);
  });
  ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_APP_SELECT, async id => {
    if (id == null) return;
    const record = ctx.appRecords.find(r => r.id === id);

    if (record) {
      await (0, app_1.selectApp)(record, ctx);
    } else if (shared_utils_1.SharedData.debugInfo) {
      console.warn(`App with id ${id} not found`);
    }
  }); // Components

  ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_COMPONENT_TREE, ({
    instanceId,
    filter
  }) => {
    ctx.currentAppRecord.componentFilter = filter;
    (0, component_1.sendComponentTreeData)(ctx.currentAppRecord, instanceId, filter, null, ctx);
    (0, subscriptions_1.subscribe)(shared_utils_1.BridgeSubscriptions.COMPONENT_TREE, {
      instanceId
    });
  });
  ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_COMPONENT_SELECTED_DATA, instanceId => {
    (0, component_1.sendSelectedComponentData)(ctx.currentAppRecord, instanceId, ctx);
  });
  ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_COMPONENT_EDIT_STATE, ({
    instanceId,
    dotPath,
    type,
    value,
    newKey,
    remove
  }) => {
    (0, component_1.editComponentState)(instanceId, dotPath, type, {
      value,
      newKey,
      remove
    }, ctx);
  });
  ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_COMPONENT_INSPECT_DOM, async ({
    instanceId
  }) => {
    const instance = (0, component_1.getComponentInstance)(ctx.currentAppRecord, instanceId, ctx);

    if (instance) {
      const [el] = await ctx.currentAppRecord.backend.api.getComponentRootElements(instance);

      if (el) {
        // @ts-ignore
        window.__VUE_DEVTOOLS_INSPECT_TARGET__ = el;
        ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_COMPONENT_INSPECT_DOM, null);
      }
    }
  });
  ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_COMPONENT_SCROLL_TO, async ({
    instanceId
  }) => {
    const instance = (0, component_1.getComponentInstance)(ctx.currentAppRecord, instanceId, ctx);

    if (instance) {
      const [el] = await ctx.currentAppRecord.backend.api.getComponentRootElements(instance);

      if (el) {
        if (typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
          });
        } else {
          // Handle nodes that don't implement scrollIntoView
          const bounds = await ctx.currentAppRecord.backend.api.getComponentBounds(instance);
          const scrollTarget = document.createElement('div');
          scrollTarget.style.position = 'absolute';
          scrollTarget.style.width = `${bounds.width}px`;
          scrollTarget.style.height = `${bounds.height}px`;
          scrollTarget.style.top = `${bounds.top}px`;
          scrollTarget.style.left = `${bounds.left}px`;
          document.body.appendChild(scrollTarget);
          scrollTarget.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
          });
          setTimeout(() => {
            document.body.removeChild(scrollTarget);
          }, 2000);
        }

        (0, highlighter_1.highlight)(instance, ctx.currentAppRecord.backend, ctx);
        setTimeout(() => {
          (0, highlighter_1.unHighlight)();
        }, 2000);
      }
    }
  });
  ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_COMPONENT_RENDER_CODE, async ({
    instanceId
  }) => {
    const instance = (0, component_1.getComponentInstance)(ctx.currentAppRecord, instanceId, ctx);

    if (instance) {
      const {
        code
      } = await ctx.currentAppRecord.backend.api.getComponentRenderCode(instance);
      ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_COMPONENT_RENDER_CODE, {
        instanceId,
        code
      });
    }
  });
  ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_CUSTOM_STATE_ACTION, async ({
    value,
    actionIndex
  }) => {
    const rawAction = value._custom.actions[actionIndex];
    const action = (0, shared_utils_1.revive)(rawAction === null || rawAction === void 0 ? void 0 : rawAction.action);

    if (action) {
      try {
        await action();
      } catch (e) {
        console.error(e);
      }
    } else {
      console.warn(`Couldn't revive action ${actionIndex} from`, value);
    }
  }); // Highlighter

  ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_COMPONENT_MOUSE_OVER, instanceId => {
    (0, highlighter_1.highlight)(ctx.currentAppRecord.instanceMap.get(instanceId), ctx.currentAppRecord.backend, ctx);
  });
  ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_COMPONENT_MOUSE_OUT, () => {
    (0, highlighter_1.unHighlight)();
  }); // Component picker

  const componentPicker = new component_pick_1.default(ctx);
  ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_COMPONENT_PICK, () => {
    componentPicker.startSelecting();
  });
  ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_COMPONENT_PICK_CANCELED, () => {
    componentPicker.stopSelecting();
  }); // Timeline

  ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_TIMELINE_LAYER_LIST, () => {
    (0, timeline_1.sendTimelineLayers)(ctx);
  });
  ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_TIMELINE_SHOW_SCREENSHOT, ({
    screenshot
  }) => {
    (0, timeline_screenshot_1.showScreenshot)(screenshot, ctx);
  });
  ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_TIMELINE_CLEAR, async () => {
    await (0, timeline_1.clearTimeline)(ctx);
  });
  ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_TIMELINE_EVENT_DATA, async ({
    id
  }) => {
    await (0, timeline_1.sendTimelineEventData)(id, ctx);
  });
  ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_TIMELINE_LAYER_LOAD_EVENTS, ({
    appId,
    layerId
  }) => {
    (0, timeline_1.sendTimelineLayerEvents)(appId, layerId, ctx);
  });
  ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_TIMELINE_LOAD_MARKERS, async () => {
    await (0, timeline_marker_1.sendTimelineMarkers)(ctx);
  }); // Custom inspectors

  ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_CUSTOM_INSPECTOR_LIST, () => {
    (0, inspector_1.sendCustomInspectors)(ctx);
  });
  ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_CUSTOM_INSPECTOR_TREE, async ({
    inspectorId,
    appId,
    treeFilter
  }) => {
    const inspector = await (0, inspector_1.getInspectorWithAppId)(inspectorId, appId, ctx);

    if (inspector) {
      inspector.treeFilter = treeFilter;
      (0, inspector_1.sendInspectorTree)(inspector, ctx);
    } else if (shared_utils_1.SharedData.debugInfo) {
      console.warn(`Inspector ${inspectorId} not found`);
    }
  });
  ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_CUSTOM_INSPECTOR_STATE, async ({
    inspectorId,
    appId,
    nodeId
  }) => {
    const inspector = await (0, inspector_1.getInspectorWithAppId)(inspectorId, appId, ctx);

    if (inspector) {
      inspector.selectedNodeId = nodeId;
      (0, inspector_1.sendInspectorState)(inspector, ctx);
    } else if (shared_utils_1.SharedData.debugInfo) {
      console.warn(`Inspector ${inspectorId} not found`);
    }
  });
  ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_CUSTOM_INSPECTOR_EDIT_STATE, async ({
    inspectorId,
    appId,
    nodeId,
    path,
    type,
    payload
  }) => {
    const inspector = await (0, inspector_1.getInspectorWithAppId)(inspectorId, appId, ctx);

    if (inspector) {
      await (0, inspector_1.editInspectorState)(inspector, nodeId, path, type, payload, ctx);
      inspector.selectedNodeId = nodeId;
      await (0, inspector_1.sendInspectorState)(inspector, ctx);
    } else if (shared_utils_1.SharedData.debugInfo) {
      console.warn(`Inspector ${inspectorId} not found`);
    }
  });
  ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_CUSTOM_INSPECTOR_ACTION, async ({
    inspectorId,
    appId,
    actionIndex
  }) => {
    const inspector = await (0, inspector_1.getInspectorWithAppId)(inspectorId, appId, ctx);

    if (inspector) {
      const action = inspector.actions[actionIndex];

      try {
        await action.action();
      } catch (e) {
        if (shared_utils_1.SharedData.debugInfo) {
          console.error(e);
        }
      }
    } else if (shared_utils_1.SharedData.debugInfo) {
      console.warn(`Inspector ${inspectorId} not found`);
    }
  }); // Misc

  ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_LOG, payload => {
    let value = payload.value;

    if (payload.serialized) {
      value = (0, shared_utils_1.parse)(value, payload.revive);
    } else if (payload.revive) {
      value = (0, shared_utils_1.revive)(value);
    } // eslint-disable-next-line no-console


    console[payload.level](value);
  }); // Plugins

  ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_DEVTOOLS_PLUGIN_LIST, async () => {
    await (0, plugin_1.sendPluginList)(ctx);
  });
  ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_DEVTOOLS_PLUGIN_SETTING_UPDATED, ({
    pluginId,
    key,
    newValue,
    oldValue
  }) => {
    const settings = (0, shared_utils_1.getPluginSettings)(pluginId);
    ctx.hook.emit(shared_utils_1.HookEvents.PLUGIN_SETTINGS_SET, pluginId, settings);
    ctx.currentAppRecord.backend.api.callHook("setPluginSettings"
    /* SET_PLUGIN_SETTINGS */
    , {
      app: ctx.currentAppRecord.options.app,
      pluginId,
      key,
      newValue,
      oldValue,
      settings
    });
  });
}

/***/ }),

/***/ "../app-backend-core/lib/inspector.js":
/*!********************************************!*\
  !*** ../app-backend-core/lib/inspector.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.selectInspectorNode = exports.sendCustomInspectors = exports.editInspectorState = exports.sendInspectorState = exports.sendInspectorTree = exports.getInspectorWithAppId = exports.getInspector = void 0;

const shared_utils_1 = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js");

function getInspector(inspectorId, app, ctx) {
  return ctx.customInspectors.find(i => i.id === inspectorId && i.appRecord.options.app === app);
}

exports.getInspector = getInspector;

async function getInspectorWithAppId(inspectorId, appId, ctx) {
  for (const i of ctx.customInspectors) {
    if (i.id === inspectorId && i.appRecord.id === appId) {
      return i;
    }
  }

  return null;
}

exports.getInspectorWithAppId = getInspectorWithAppId;

async function sendInspectorTree(inspector, ctx) {
  const rootNodes = await inspector.appRecord.backend.api.getInspectorTree(inspector.id, inspector.appRecord.options.app, inspector.treeFilter);
  ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_CUSTOM_INSPECTOR_TREE, {
    appId: inspector.appRecord.id,
    inspectorId: inspector.id,
    rootNodes
  });
}

exports.sendInspectorTree = sendInspectorTree;

async function sendInspectorState(inspector, ctx) {
  const state = inspector.selectedNodeId ? await inspector.appRecord.backend.api.getInspectorState(inspector.id, inspector.appRecord.options.app, inspector.selectedNodeId) : null;
  ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_CUSTOM_INSPECTOR_STATE, {
    appId: inspector.appRecord.id,
    inspectorId: inspector.id,
    state: (0, shared_utils_1.stringify)(state)
  });
}

exports.sendInspectorState = sendInspectorState;

async function editInspectorState(inspector, nodeId, dotPath, type, state, ctx) {
  await inspector.appRecord.backend.api.editInspectorState(inspector.id, inspector.appRecord.options.app, nodeId, dotPath, type, { ...state,
    value: state.value != null ? (0, shared_utils_1.parse)(state.value, true) : state.value
  });
}

exports.editInspectorState = editInspectorState;

async function sendCustomInspectors(ctx) {
  var _a;

  const inspectors = [];

  for (const i of ctx.customInspectors) {
    inspectors.push({
      id: i.id,
      appId: i.appRecord.id,
      pluginId: i.plugin.descriptor.id,
      label: i.label,
      icon: i.icon,
      treeFilterPlaceholder: i.treeFilterPlaceholder,
      stateFilterPlaceholder: i.stateFilterPlaceholder,
      noSelectionText: i.noSelectionText,
      actions: (_a = i.actions) === null || _a === void 0 ? void 0 : _a.map(a => ({
        icon: a.icon,
        tooltip: a.tooltip
      }))
    });
  }

  ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_CUSTOM_INSPECTOR_LIST, {
    inspectors
  });
}

exports.sendCustomInspectors = sendCustomInspectors;

async function selectInspectorNode(inspector, nodeId, ctx) {
  ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_CUSTOM_INSPECTOR_SELECT_NODE, {
    appId: inspector.appRecord.id,
    inspectorId: inspector.id,
    nodeId
  });
}

exports.selectInspectorNode = selectInspectorNode;

/***/ }),

/***/ "../app-backend-core/lib/legacy/scan.js":
/*!**********************************************!*\
  !*** ../app-backend-core/lib/legacy/scan.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.scan = void 0;

const shared_utils_1 = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js");

const rootInstances = [];
/**
 * Scan the page for root level Vue instances.
 */

function scan() {
  rootInstances.length = 0;
  let inFragment = false;
  let currentFragment = null; // eslint-disable-next-line no-inner-declarations

  function processInstance(instance) {
    if (instance) {
      if (rootInstances.indexOf(instance.$root) === -1) {
        instance = instance.$root;
      }

      if (instance._isFragment) {
        inFragment = true;
        currentFragment = instance;
      } // respect Vue.config.devtools option


      let baseVue = instance.constructor;

      while (baseVue.super) {
        baseVue = baseVue.super;
      }

      if (baseVue.config && baseVue.config.devtools) {
        rootInstances.push(instance);
      }

      return true;
    }
  }

  if (shared_utils_1.isBrowser) {
    const walkDocument = document => {
      walk(document, function (node) {
        if (inFragment) {
          if (node === currentFragment._fragmentEnd) {
            inFragment = false;
            currentFragment = null;
          }

          return true;
        }

        const instance = node.__vue__;
        return processInstance(instance);
      });
    };

    walkDocument(document);
    const iframes = document.querySelectorAll('iframe');

    for (const iframe of iframes) {
      try {
        walkDocument(iframe.contentDocument);
      } catch (e) {// Ignore
      }
    }
  } else {
    if (Array.isArray(shared_utils_1.target.__VUE_ROOT_INSTANCES__)) {
      shared_utils_1.target.__VUE_ROOT_INSTANCES__.map(processInstance);
    }
  }

  return rootInstances;
}

exports.scan = scan;
/**
 * DOM walk helper
 *
 * @param {NodeList} nodes
 * @param {Function} fn
 */

function walk(node, fn) {
  if (node.childNodes) {
    for (let i = 0, l = node.childNodes.length; i < l; i++) {
      const child = node.childNodes[i];
      const stop = fn(child);

      if (!stop) {
        walk(child, fn);
      }
    }
  } // also walk shadow DOM


  if (node.shadowRoot) {
    walk(node.shadowRoot, fn);
  }
}

/***/ }),

/***/ "../app-backend-core/lib/page-config.js":
/*!**********************************************!*\
  !*** ../app-backend-core/lib/page-config.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.initOnPageConfig = exports.getPageConfig = void 0;

const shared_utils_1 = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js");

let config = {};

function getPageConfig() {
  return config;
}

exports.getPageConfig = getPageConfig;

function initOnPageConfig() {
  // User project devtools config
  if (Object.hasOwnProperty.call(shared_utils_1.target, 'VUE_DEVTOOLS_CONFIG')) {
    config = shared_utils_1.SharedData.pageConfig = shared_utils_1.target.VUE_DEVTOOLS_CONFIG; // Open in editor

    if (Object.hasOwnProperty.call(config, 'openInEditorHost')) {
      shared_utils_1.SharedData.openInEditorHost = config.openInEditorHost;
    }
  }
}

exports.initOnPageConfig = initOnPageConfig;

/***/ }),

/***/ "../app-backend-core/lib/perf.js":
/*!***************************************!*\
  !*** ../app-backend-core/lib/perf.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.handleAddPerformanceTag = exports.performanceMarkEnd = exports.performanceMarkStart = void 0;

const shared_utils_1 = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js");

const timeline_1 = __webpack_require__(/*! ./timeline */ "../app-backend-core/lib/timeline.js");

const app_1 = __webpack_require__(/*! ./app */ "../app-backend-core/lib/app.js");

const component_1 = __webpack_require__(/*! ./component */ "../app-backend-core/lib/component.js");

const subscriptions_1 = __webpack_require__(/*! ./util/subscriptions */ "../app-backend-core/lib/util/subscriptions.js");

async function performanceMarkStart(app, uid, instance, type, time, ctx) {
  try {
    if (!shared_utils_1.SharedData.performanceMonitoringEnabled) return;
    const appRecord = await (0, app_1.getAppRecord)(app, ctx);
    const componentName = await appRecord.backend.api.getComponentName(instance);
    const groupId = ctx.perfUniqueGroupId++;
    const groupKey = `${uid}-${type}`;
    appRecord.perfGroupIds.set(groupKey, {
      groupId,
      time
    });
    await (0, timeline_1.addTimelineEvent)({
      layerId: 'performance',
      event: {
        time,
        data: {
          component: componentName,
          type,
          measure: 'start'
        },
        title: componentName,
        subtitle: type,
        groupId
      }
    }, app, ctx);
  } catch (e) {
    if (shared_utils_1.SharedData.debugInfo) {
      console.error(e);
    }
  }
}

exports.performanceMarkStart = performanceMarkStart;

async function performanceMarkEnd(app, uid, instance, type, time, ctx) {
  try {
    if (!shared_utils_1.SharedData.performanceMonitoringEnabled) return;
    const appRecord = await (0, app_1.getAppRecord)(app, ctx);
    const componentName = await appRecord.backend.api.getComponentName(instance);
    const groupKey = `${uid}-${type}`;
    const {
      groupId,
      time: startTime
    } = appRecord.perfGroupIds.get(groupKey);
    const duration = time - startTime;
    await (0, timeline_1.addTimelineEvent)({
      layerId: 'performance',
      event: {
        time,
        data: {
          component: componentName,
          type,
          measure: 'end',
          duration: {
            _custom: {
              type: 'Duration',
              value: duration,
              display: `${duration} ms`
            }
          }
        },
        title: componentName,
        subtitle: type,
        groupId
      }
    }, app, ctx); // Mark on component

    const tooSlow = duration > 10;

    if (tooSlow || instance.__VUE_DEVTOOLS_SLOW__) {
      let change = false;

      if (tooSlow && !instance.__VUE_DEVTOOLS_SLOW__) {
        instance.__VUE_DEVTOOLS_SLOW__ = {
          duration: null,
          measures: {}
        };
      }

      const data = instance.__VUE_DEVTOOLS_SLOW__;

      if (tooSlow && (data.duration == null || data.duration < duration)) {
        data.duration = duration;
        change = true;
      }

      if (data.measures[type] == null || data.measures[type] < duration) {
        data.measures[type] = duration;
        change = true;
      }

      if (change) {
        // Update component tree
        const id = await (0, component_1.getComponentId)(app, uid, instance, ctx);

        if ((0, subscriptions_1.isSubscribed)(shared_utils_1.BridgeSubscriptions.COMPONENT_TREE, sub => sub.payload.instanceId === id)) {
          requestAnimationFrame(() => {
            (0, component_1.sendComponentTreeData)(appRecord, id, ctx.currentAppRecord.componentFilter, null, ctx);
          });
        }
      }
    }
  } catch (e) {
    if (shared_utils_1.SharedData.debugInfo) {
      console.error(e);
    }
  }
}

exports.performanceMarkEnd = performanceMarkEnd;

function handleAddPerformanceTag(backend, ctx) {
  backend.api.on.visitComponentTree(payload => {
    if (payload.componentInstance.__VUE_DEVTOOLS_SLOW__) {
      const {
        duration,
        measures
      } = payload.componentInstance.__VUE_DEVTOOLS_SLOW__;
      let tooltip = '<div class="grid grid-cols-2 gap-2 font-mono text-xs">';

      for (const type in measures) {
        const d = measures[type];
        tooltip += `<div>${type}</div><div class="text-right text-black rounded px-1 ${d > 30 ? 'bg-red-400' : d > 10 ? 'bg-yellow-400' : 'bg-green-400'}">${d} ms</div>`;
      }

      tooltip += '</div>';
      payload.treeNode.tags.push({
        backgroundColor: duration > 30 ? 0xF87171 : 0xFBBF24,
        textColor: 0x000000,
        label: `${duration} ms`,
        tooltip
      });
    }
  });
}

exports.handleAddPerformanceTag = handleAddPerformanceTag;

/***/ }),

/***/ "../app-backend-core/lib/plugin.js":
/*!*****************************************!*\
  !*** ../app-backend-core/lib/plugin.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.serializePlugin = exports.sendPluginList = exports.addPreviouslyRegisteredPlugins = exports.addQueuedPlugins = exports.addPlugin = void 0;

const app_backend_api_1 = __webpack_require__(/*! @vue-devtools/app-backend-api */ "../app-backend-api/lib/index.js");

const shared_utils_1 = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js");

const app_1 = __webpack_require__(/*! ./app */ "../app-backend-core/lib/app.js");

async function addPlugin(pluginQueueItem, ctx) {
  const {
    pluginDescriptor,
    setupFn
  } = pluginQueueItem;
  const plugin = {
    descriptor: pluginDescriptor,
    setupFn,
    error: null
  };
  ctx.currentPlugin = plugin;

  try {
    const appRecord = await (0, app_1.getAppRecord)(plugin.descriptor.app, ctx);
    const api = new app_backend_api_1.DevtoolsPluginApiInstance(plugin, appRecord, ctx);

    if (pluginQueueItem.proxy) {
      await pluginQueueItem.proxy.setRealTarget(api);
    } else {
      setupFn(api);
    }
  } catch (e) {
    plugin.error = e;
    console.error(e);
  }

  ctx.currentPlugin = null;
  ctx.plugins.push(plugin);
  ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_DEVTOOLS_PLUGIN_ADD, {
    plugin: await serializePlugin(plugin)
  });
  const targetList = shared_utils_1.target.__VUE_DEVTOOLS_REGISTERED_PLUGINS__ = shared_utils_1.target.__VUE_DEVTOOLS_REGISTERED_PLUGINS__ || [];
  targetList.push({
    pluginDescriptor,
    setupFn
  });
}

exports.addPlugin = addPlugin;

async function addQueuedPlugins(ctx) {
  if (shared_utils_1.target.__VUE_DEVTOOLS_PLUGINS__ && Array.isArray(shared_utils_1.target.__VUE_DEVTOOLS_PLUGINS__)) {
    for (const queueItem of shared_utils_1.target.__VUE_DEVTOOLS_PLUGINS__) {
      await addPlugin(queueItem, ctx);
    }

    shared_utils_1.target.__VUE_DEVTOOLS_PLUGINS__ = null;
  }
}

exports.addQueuedPlugins = addQueuedPlugins;

async function addPreviouslyRegisteredPlugins(ctx) {
  if (shared_utils_1.target.__VUE_DEVTOOLS_REGISTERED_PLUGINS__ && Array.isArray(shared_utils_1.target.__VUE_DEVTOOLS_REGISTERED_PLUGINS__)) {
    for (const queueItem of shared_utils_1.target.__VUE_DEVTOOLS_REGISTERED_PLUGINS__) {
      await addPlugin(queueItem, ctx);
    }
  }
}

exports.addPreviouslyRegisteredPlugins = addPreviouslyRegisteredPlugins;

async function sendPluginList(ctx) {
  ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_DEVTOOLS_PLUGIN_LIST, {
    plugins: await Promise.all(ctx.plugins.map(p => serializePlugin(p)))
  });
}

exports.sendPluginList = sendPluginList;

async function serializePlugin(plugin) {
  return {
    id: plugin.descriptor.id,
    label: plugin.descriptor.label,
    appId: (0, app_1.getAppRecordId)(plugin.descriptor.app),
    packageName: plugin.descriptor.packageName,
    homepage: plugin.descriptor.homepage,
    logo: plugin.descriptor.logo,
    componentStateTypes: plugin.descriptor.componentStateTypes,
    settingsSchema: plugin.descriptor.settings
  };
}

exports.serializePlugin = serializePlugin;

/***/ }),

/***/ "../app-backend-core/lib/timeline-builtins.js":
/*!****************************************************!*\
  !*** ../app-backend-core/lib/timeline-builtins.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.builtinLayers = void 0;
exports.builtinLayers = [{
  id: 'mouse',
  label: 'Mouse',
  color: 0xA451AF,

  screenshotOverlayRender(event, {
    events
  }) {
    const samePositionEvent = events.find(e => e !== event && e.renderMeta.textEl && e.data.x === event.data.x && e.data.y === event.data.y);

    if (samePositionEvent) {
      const text = document.createElement('div');
      text.innerText = event.data.type;
      samePositionEvent.renderMeta.textEl.appendChild(text);
      return false;
    }

    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.left = `${event.data.x - 4}px`;
    div.style.top = `${event.data.y - 4}px`;
    div.style.width = '8px';
    div.style.height = '8px';
    div.style.borderRadius = '100%';
    div.style.backgroundColor = 'rgba(164, 81, 175, 0.5)';
    const text = document.createElement('div');
    text.innerText = event.data.type;
    text.style.color = '#541e5b';
    text.style.fontFamily = 'monospace';
    text.style.fontSize = '9px';
    text.style.position = 'absolute';
    text.style.left = '10px';
    text.style.top = '10px';
    text.style.padding = '1px';
    text.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    text.style.borderRadius = '3px';
    div.appendChild(text);
    event.renderMeta.textEl = text;
    return div;
  }

}, {
  id: 'keyboard',
  label: 'Keyboard',
  color: 0x8151AF
}, {
  id: 'component-event',
  label: 'Component events',
  color: 0x41B883,
  screenshotOverlayRender: (event, {
    events
  }) => {
    if (!event.meta.bounds || events.some(e => e !== event && e.layerId === event.layerId && e.renderMeta.drawn && (e.meta.componentId === event.meta.componentId || e.meta.bounds.left === event.meta.bounds.left && e.meta.bounds.top === event.meta.bounds.top && e.meta.bounds.width === event.meta.bounds.width && e.meta.bounds.height === event.meta.bounds.height))) {
      return false;
    }

    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.left = `${event.meta.bounds.left - 4}px`;
    div.style.top = `${event.meta.bounds.top - 4}px`;
    div.style.width = `${event.meta.bounds.width}px`;
    div.style.height = `${event.meta.bounds.height}px`;
    div.style.borderRadius = '8px';
    div.style.borderStyle = 'solid';
    div.style.borderWidth = '4px';
    div.style.borderColor = 'rgba(65, 184, 131, 0.5)';
    div.style.textAlign = 'center';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
    div.style.overflow = 'hidden';
    const text = document.createElement('div');
    text.style.color = '#267753';
    text.style.fontFamily = 'monospace';
    text.style.fontSize = '9px';
    text.style.padding = '1px';
    text.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    text.style.borderRadius = '3px';
    text.innerText = event.data.event;
    div.appendChild(text);
    event.renderMeta.drawn = true;
    return div;
  }
}, {
  id: 'performance',
  label: 'Performance',
  color: 0x41b86a,
  groupsOnly: true,
  skipScreenshots: true,
  ignoreNoDurationGroups: true
}];

/***/ }),

/***/ "../app-backend-core/lib/timeline-marker.js":
/*!**************************************************!*\
  !*** ../app-backend-core/lib/timeline-marker.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.sendTimelineMarkers = exports.addTimelineMarker = void 0;

const shared_utils_1 = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js");

async function addTimelineMarker(options, ctx) {
  var _a;

  if (!ctx.currentAppRecord) {
    options.all = true;
  }

  const marker = { ...options,
    appRecord: options.all ? null : ctx.currentAppRecord
  };
  ctx.timelineMarkers.push(marker);
  ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_TIMELINE_MARKER, {
    marker: await serializeMarker(marker),
    appId: (_a = ctx.currentAppRecord) === null || _a === void 0 ? void 0 : _a.id
  });
}

exports.addTimelineMarker = addTimelineMarker;

async function sendTimelineMarkers(ctx) {
  const markers = ctx.timelineMarkers.filter(marker => marker.all || marker.appRecord === ctx.currentAppRecord);
  const result = [];

  for (const marker of markers) {
    result.push(await serializeMarker(marker));
  }

  ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_TIMELINE_LOAD_MARKERS, {
    markers: result,
    appId: ctx.currentAppRecord.id
  });
}

exports.sendTimelineMarkers = sendTimelineMarkers;

async function serializeMarker(marker) {
  var _a;

  return {
    id: marker.id,
    appId: (_a = marker.appRecord) === null || _a === void 0 ? void 0 : _a.id,
    all: marker.all,
    time: marker.time,
    label: marker.label,
    color: marker.color
  };
}

/***/ }),

/***/ "../app-backend-core/lib/timeline-screenshot.js":
/*!******************************************************!*\
  !*** ../app-backend-core/lib/timeline-screenshot.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.showScreenshot = void 0;

const shared_utils_1 = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js");

const queue_1 = __webpack_require__(/*! ./util/queue */ "../app-backend-core/lib/util/queue.js");

const timeline_builtins_1 = __webpack_require__(/*! ./timeline-builtins */ "../app-backend-core/lib/timeline-builtins.js");

let overlay;
let image;
let container;
const jobQueue = new queue_1.JobQueue();

async function showScreenshot(screenshot, ctx) {
  await jobQueue.queue(async () => {
    if (screenshot) {
      if (!container) {
        createElements();
      }

      image.src = screenshot.image;
      image.style.visibility = screenshot.image ? 'visible' : 'hidden';
      clearContent();
      const events = screenshot.events.map(id => ctx.timelineEventMap.get(id)).filter(Boolean).map(eventData => ({
        layer: timeline_builtins_1.builtinLayers.concat(ctx.timelineLayers).find(layer => layer.id === eventData.layerId),
        event: { ...eventData.event,
          layerId: eventData.layerId,
          renderMeta: {}
        }
      }));
      const renderContext = {
        screenshot,
        events: events.map(({
          event
        }) => event),
        index: 0
      };

      for (let i = 0; i < events.length; i++) {
        const {
          layer,
          event
        } = events[i];

        if (layer.screenshotOverlayRender) {
          renderContext.index = i;

          try {
            const result = await layer.screenshotOverlayRender(event, renderContext);

            if (result !== false) {
              if (typeof result === 'string') {
                container.innerHTML += result;
              } else {
                container.appendChild(result);
              }
            }
          } catch (e) {
            if (shared_utils_1.SharedData.debugInfo) {
              console.error(e);
            }
          }
        }
      }

      showElement();
    } else {
      hideElement();
    }
  });
}

exports.showScreenshot = showScreenshot;

function createElements() {
  overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.zIndex = '9999999999999';
  overlay.style.pointerEvents = 'none';
  overlay.style.left = '0';
  overlay.style.top = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
  overlay.style.overflow = 'hidden';
  const imageBox = document.createElement('div');
  imageBox.style.position = 'relative';
  overlay.appendChild(imageBox);
  image = document.createElement('img');
  imageBox.appendChild(image);
  container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '0';
  container.style.top = '0';
  imageBox.appendChild(container);
  const style = document.createElement('style');
  style.innerHTML = '.__vuedevtools_no-scroll { overflow: hidden; }';
  document.head.appendChild(style);
}

function showElement() {
  if (!overlay.parentNode) {
    document.body.appendChild(overlay);
    document.body.classList.add('__vuedevtools_no-scroll');
  }
}

function hideElement() {
  if (overlay && overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
    document.body.classList.remove('__vuedevtools_no-scroll');
    clearContent();
  }
}

function clearContent() {
  while (container.firstChild) {
    container.removeChild(container.lastChild);
  }
}

/***/ }),

/***/ "../app-backend-core/lib/timeline.js":
/*!*******************************************!*\
  !*** ../app-backend-core/lib/timeline.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.sendTimelineLayerEvents = exports.removeLayersForApp = exports.sendTimelineEventData = exports.clearTimeline = exports.addTimelineEvent = exports.sendTimelineLayers = exports.addBuiltinLayers = exports.setupTimeline = void 0;

const shared_utils_1 = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js");

const global_hook_1 = __webpack_require__(/*! ./global-hook */ "../app-backend-core/lib/global-hook.js");

const app_1 = __webpack_require__(/*! ./app */ "../app-backend-core/lib/app.js");

const timeline_builtins_1 = __webpack_require__(/*! ./timeline-builtins */ "../app-backend-core/lib/timeline-builtins.js");

function setupTimeline(ctx) {
  setupBuiltinLayers(ctx);
}

exports.setupTimeline = setupTimeline;

function addBuiltinLayers(appRecord, ctx) {
  for (const layerDef of timeline_builtins_1.builtinLayers) {
    ctx.timelineLayers.push({ ...layerDef,
      appRecord,
      plugin: null,
      events: []
    });
  }
}

exports.addBuiltinLayers = addBuiltinLayers;

function setupBuiltinLayers(ctx) {
  ['mousedown', 'mouseup', 'click', 'dblclick'].forEach(eventType => {
    // @ts-ignore
    window.addEventListener(eventType, async event => {
      await addTimelineEvent({
        layerId: 'mouse',
        event: {
          time: Date.now(),
          data: {
            type: eventType,
            x: event.clientX,
            y: event.clientY
          },
          title: eventType
        }
      }, null, ctx);
    }, {
      capture: true,
      passive: true
    });
  });
  ['keyup', 'keydown', 'keypress'].forEach(eventType => {
    // @ts-ignore
    window.addEventListener(eventType, async event => {
      await addTimelineEvent({
        layerId: 'keyboard',
        event: {
          time: Date.now(),
          data: {
            type: eventType,
            key: event.key,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            altKey: event.altKey,
            metaKey: event.metaKey
          },
          title: event.key
        }
      }, null, ctx);
    }, {
      capture: true,
      passive: true
    });
  });
  global_hook_1.hook.on(shared_utils_1.HookEvents.COMPONENT_EMIT, async (app, instance, event, params) => {
    try {
      if (!shared_utils_1.SharedData.componentEventsEnabled) return;
      const appRecord = await (0, app_1.getAppRecord)(app, ctx);
      const componentId = `${appRecord.id}:${instance.uid}`;
      const componentDisplay = (await appRecord.backend.api.getComponentName(instance)) || '<i>Unknown Component</i>';
      await addTimelineEvent({
        layerId: 'component-event',
        event: {
          time: Date.now(),
          data: {
            component: {
              _custom: {
                type: 'component-definition',
                display: componentDisplay
              }
            },
            event,
            params
          },
          title: event,
          subtitle: `by ${componentDisplay}`,
          meta: {
            componentId,
            bounds: await appRecord.backend.api.getComponentBounds(instance)
          }
        }
      }, app, ctx);
    } catch (e) {
      if (shared_utils_1.SharedData.debugInfo) {
        console.error(e);
      }
    }
  });
}

async function sendTimelineLayers(ctx) {
  var _a, _b;

  const layers = [];

  for (const layer of ctx.timelineLayers) {
    try {
      layers.push({
        id: layer.id,
        label: layer.label,
        color: layer.color,
        appId: (_a = layer.appRecord) === null || _a === void 0 ? void 0 : _a.id,
        pluginId: (_b = layer.plugin) === null || _b === void 0 ? void 0 : _b.descriptor.id,
        groupsOnly: layer.groupsOnly,
        skipScreenshots: layer.skipScreenshots,
        ignoreNoDurationGroups: layer.ignoreNoDurationGroups
      });
    } catch (e) {
      if (shared_utils_1.SharedData.debugInfo) {
        console.error(e);
      }
    }
  }

  ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_TIMELINE_LAYER_LIST, {
    layers
  });
}

exports.sendTimelineLayers = sendTimelineLayers;

async function addTimelineEvent(options, app, ctx) {
  const appId = app ? (0, app_1.getAppRecordId)(app) : null;
  const isAllApps = options.all || !app || appId == null;
  const id = ctx.nextTimelineEventId++;
  const eventData = {
    id,
    ...options,
    all: isAllApps
  };
  ctx.timelineEventMap.set(eventData.id, eventData);
  ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_TIMELINE_EVENT, {
    appId: eventData.all ? 'all' : appId,
    layerId: eventData.layerId,
    event: mapTimelineEvent(eventData)
  });
  const layer = ctx.timelineLayers.find(l => {
    var _a;

    return (isAllApps || ((_a = l.appRecord) === null || _a === void 0 ? void 0 : _a.options.app) === app) && l.id === options.layerId;
  });

  if (layer) {
    layer.events.push(eventData);
  } else if (shared_utils_1.SharedData.debugInfo) {
    console.warn(`Timeline layer ${options.layerId} not found`);
  }
}

exports.addTimelineEvent = addTimelineEvent;

function mapTimelineEvent(eventData) {
  return {
    id: eventData.id,
    time: eventData.event.time,
    logType: eventData.event.logType,
    groupId: eventData.event.groupId,
    title: eventData.event.title,
    subtitle: eventData.event.subtitle
  };
}

async function clearTimeline(ctx) {
  ctx.timelineEventMap.clear();

  for (const layer of ctx.timelineLayers) {
    layer.events = [];
  }

  for (const backend of ctx.backends) {
    await backend.api.clearTimeline();
  }
}

exports.clearTimeline = clearTimeline;

async function sendTimelineEventData(id, ctx) {
  let data = null;
  const eventData = ctx.timelineEventMap.get(id);

  if (eventData) {
    data = await ctx.currentAppRecord.backend.api.inspectTimelineEvent(eventData, ctx.currentAppRecord.options.app);
    data = (0, shared_utils_1.stringify)(data);
  } else if (shared_utils_1.SharedData.debugInfo) {
    console.warn(`Event ${id} not found`, ctx.timelineEventMap.keys());
  }

  ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_TIMELINE_EVENT_DATA, {
    eventId: id,
    data
  });
}

exports.sendTimelineEventData = sendTimelineEventData;

function removeLayersForApp(app, ctx) {
  const layers = ctx.timelineLayers.filter(l => {
    var _a;

    return ((_a = l.appRecord) === null || _a === void 0 ? void 0 : _a.options.app) === app;
  });

  for (const layer of layers) {
    const index = ctx.timelineLayers.indexOf(layer);
    if (index !== -1) ctx.timelineLayers.splice(index, 1);

    for (const e of layer.events) {
      ctx.timelineEventMap.delete(e.id);
    }
  }
}

exports.removeLayersForApp = removeLayersForApp;

function sendTimelineLayerEvents(appId, layerId, ctx) {
  var _a;

  const app = (_a = ctx.appRecords.find(ar => ar.id === appId)) === null || _a === void 0 ? void 0 : _a.options.app;
  if (!app) return;
  const layer = ctx.timelineLayers.find(l => {
    var _a;

    return ((_a = l.appRecord) === null || _a === void 0 ? void 0 : _a.options.app) === app && l.id === layerId;
  });
  if (!layer) return;
  ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_TIMELINE_LAYER_LOAD_EVENTS, {
    appId,
    layerId,
    events: layer.events.map(e => mapTimelineEvent(e))
  });
}

exports.sendTimelineLayerEvents = sendTimelineLayerEvents;

/***/ }),

/***/ "../app-backend-core/lib/util/queue.js":
/*!*********************************************!*\
  !*** ../app-backend-core/lib/util/queue.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.JobQueue = void 0;

class JobQueue {
  constructor() {
    this.jobs = [];
  }

  queue(job) {
    return new Promise(resolve => {
      const onDone = () => {
        this.currentJob = null;
        const nextJob = this.jobs.shift();

        if (nextJob) {
          nextJob();
        }

        resolve();
      };

      const run = () => {
        this.currentJob = job;
        return job().then(onDone);
      };

      if (this.currentJob) {
        this.jobs.push(() => run());
      } else {
        run();
      }
    });
  }

}

exports.JobQueue = JobQueue;

/***/ }),

/***/ "../app-backend-core/lib/util/subscriptions.js":
/*!*****************************************************!*\
  !*** ../app-backend-core/lib/util/subscriptions.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.isSubscribed = exports.unsubscribe = exports.subscribe = void 0;
const activeSubs = new Map();

function getSubs(type) {
  let subs = activeSubs.get(type);

  if (!subs) {
    subs = [];
    activeSubs.set(type, subs);
  }

  return subs;
}

function subscribe(type, payload) {
  const rawPayload = getRawPayload(payload);
  getSubs(type).push({
    payload,
    rawPayload
  });
}

exports.subscribe = subscribe;

function unsubscribe(type, payload) {
  const rawPayload = getRawPayload(payload);
  const subs = getSubs(type);
  let index;

  while ((index = subs.findIndex(sub => sub.rawPayload === rawPayload)) !== -1) {
    subs.splice(index, 1);
  }
}

exports.unsubscribe = unsubscribe;

function getRawPayload(payload) {
  const data = Object.keys(payload).sort().reduce((acc, key) => {
    acc[key] = payload[key];
    return acc;
  }, {});
  return JSON.stringify(data);
}

function isSubscribed(type, predicate = () => true) {
  return getSubs(type).some(predicate);
}

exports.isSubscribed = isSubscribed;

/***/ }),

/***/ "../app-backend-vue1/lib/index.js":
/*!****************************************!*\
  !*** ../app-backend-vue1/lib/index.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.backend = void 0;

const app_backend_api_1 = __webpack_require__(/*! @vue-devtools/app-backend-api */ "../app-backend-api/lib/index.js");

exports.backend = (0, app_backend_api_1.defineBackend)({
  frameworkVersion: 1,
  features: [],

  setup(api) {// @TODO
  }

});

/***/ }),

/***/ "../app-backend-vue2/lib/components/data.js":
/*!**************************************************!*\
  !*** ../app-backend-vue2/lib/components/data.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.editState = exports.findInstanceOrVnode = exports.getInstanceName = exports.reduceStateList = exports.getCustomInstanceDetails = exports.getInstanceDetails = void 0;

const shared_utils_1 = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js");

const tree_1 = __webpack_require__(/*! ./tree */ "../app-backend-vue2/lib/components/tree.js");
/**
 * Get the detailed information of an inspected instance.
 */


function getInstanceDetails(instance) {
  var _a, _b;

  if (instance.__VUE_DEVTOOLS_FUNCTIONAL_LEGACY__) {
    const vnode = findInstanceOrVnode(instance.__VUE_DEVTOOLS_UID__);
    if (!vnode) return null;
    const fakeInstance = {
      $options: vnode.fnOptions,
      ...((_a = vnode.devtoolsMeta) === null || _a === void 0 ? void 0 : _a.renderContext.props)
    };

    if (!fakeInstance.$options.props && ((_b = vnode.devtoolsMeta) === null || _b === void 0 ? void 0 : _b.renderContext.props)) {
      fakeInstance.$options.props = Object.keys(vnode.devtoolsMeta.renderContext.props).reduce((obj, key) => {
        obj[key] = {};
        return obj;
      }, {});
    }

    const data = {
      id: instance.__VUE_DEVTOOLS_UID__,
      name: (0, shared_utils_1.getComponentName)(vnode.fnOptions),
      file: instance.type ? instance.type.__file : vnode.fnOptions.__file || null,
      state: getFunctionalInstanceState(fakeInstance),
      functional: true
    };
    return data;
  }

  const data = {
    id: instance.__VUE_DEVTOOLS_UID__,
    name: getInstanceName(instance),
    state: getInstanceState(instance),
    file: null
  };
  let i;

  if ((i = instance.$vnode) && (i = i.componentOptions) && (i = i.Ctor) && (i = i.options)) {
    data.file = i.__file || null;
  }

  return data;
}

exports.getInstanceDetails = getInstanceDetails;

function getInstanceState(instance) {
  return processProps(instance).concat(processState(instance), processRefs(instance), processComputed(instance), processInjected(instance), processRouteContext(instance), processVuexGetters(instance), processFirebaseBindings(instance), processObservables(instance), processAttrs(instance));
}

function getFunctionalInstanceState(instance) {
  return processProps(instance);
}

function getCustomInstanceDetails(instance) {
  const state = getInstanceState(instance);
  return {
    _custom: {
      type: 'component',
      id: instance.__VUE_DEVTOOLS_UID__,
      display: getInstanceName(instance),
      tooltip: 'Component instance',
      value: reduceStateList(state),
      fields: {
        abstract: true
      }
    }
  };
}

exports.getCustomInstanceDetails = getCustomInstanceDetails;

function reduceStateList(list) {
  if (!list.length) {
    return undefined;
  }

  return list.reduce((map, item) => {
    const key = item.type || 'data';
    const obj = map[key] = map[key] || {};
    obj[item.key] = item.value;
    return map;
  }, {});
}

exports.reduceStateList = reduceStateList;
/**
 * Get the appropriate display name for an instance.
 */

function getInstanceName(instance) {
  const name = (0, shared_utils_1.getComponentName)(instance.$options || instance.fnOptions || {});
  if (name) return name;
  return instance.$root === instance ? 'Root' : 'Anonymous Component';
}

exports.getInstanceName = getInstanceName;
/**
 * Process the props of an instance.
 * Make sure return a plain object because window.postMessage()
 * will throw an Error if the passed object contains Functions.
 */

function processProps(instance) {
  const props = instance.$options.props;
  const propsData = [];

  for (let key in props) {
    const prop = props[key];
    key = (0, shared_utils_1.camelize)(key);
    propsData.push({
      type: 'props',
      key,
      value: instance[key],
      meta: prop ? {
        type: prop.type ? getPropType(prop.type) : 'any',
        required: !!prop.required
      } : {
        type: 'invalid'
      },
      editable: shared_utils_1.SharedData.editableProps
    });
  }

  return propsData;
}

function processAttrs(instance) {
  return Object.entries(instance.$attrs || {}).map(([key, value]) => {
    return {
      type: '$attrs',
      key,
      value
    };
  });
}

const fnTypeRE = /^(?:function|class) (\w+)/;
/**
 * Convert prop type constructor to string.
 */

function getPropType(type) {
  if (Array.isArray(type)) {
    return type.map(t => getPropType(t)).join(' or ');
  }

  if (type == null) {
    return 'null';
  }

  const match = type.toString().match(fnTypeRE);
  return typeof type === 'function' ? match && match[1] || 'any' : 'any';
}
/**
 * Process state, filtering out props and "clean" the result
 * with a JSON dance. This removes functions which can cause
 * errors during structured clone used by window.postMessage.
 */


function processState(instance) {
  const props = instance.$options.props;
  const getters = instance.$options.vuex && instance.$options.vuex.getters;
  return Object.keys(instance._data).filter(key => !(props && key in props) && !(getters && key in getters)).map(key => ({
    key,
    type: 'data',
    value: instance._data[key],
    editable: true
  }));
}
/**
 * Process refs
 */


function processRefs(instance) {
  return Object.keys(instance.$refs).filter(key => instance.$refs[key]).map(key => (0, shared_utils_1.getCustomRefDetails)(instance, key, instance.$refs[key]));
}
/**
 * Process the computed properties of an instance.
 */


function processComputed(instance) {
  const computed = [];
  const defs = instance.$options.computed || {}; // use for...in here because if 'computed' is not defined
  // on component, computed properties will be placed in prototype
  // and Object.keys does not include
  // properties from object's prototype

  for (const key in defs) {
    const def = defs[key];
    const type = typeof def === 'function' && def.vuex ? 'vuex bindings' : 'computed'; // use try ... catch here because some computed properties may
    // throw error during its evaluation

    let computedProp = null;

    try {
      computedProp = {
        type,
        key,
        value: instance[key]
      };
    } catch (e) {
      computedProp = {
        type,
        key,
        value: e
      };
    }

    computed.push(computedProp);
  }

  return computed;
}
/**
 * Process Vuex getters.
 */


function processInjected(instance) {
  const injected = instance.$options.inject;

  if (injected) {
    return Object.keys(injected).map(key => {
      return {
        key,
        type: 'injected',
        value: instance[key]
      };
    });
  } else {
    return [];
  }
}
/**
 * Process possible vue-router $route context
 */


function processRouteContext(instance) {
  try {
    const route = instance.$route;

    if (route) {
      const {
        path,
        query,
        params
      } = route;
      const value = {
        path,
        query,
        params
      };
      if (route.fullPath) value.fullPath = route.fullPath;
      if (route.hash) value.hash = route.hash;
      if (route.name) value.name = route.name;
      if (route.meta) value.meta = route.meta;
      return [{
        key: '$route',
        type: 'route',
        value: {
          _custom: {
            type: 'router',
            abstract: true,
            value
          }
        }
      }];
    }
  } catch (e) {// Invalid $router
  }

  return [];
}
/**
 * Process Vuex getters.
 */


function processVuexGetters(instance) {
  const getters = instance.$options.vuex && instance.$options.vuex.getters;

  if (getters) {
    return Object.keys(getters).map(key => {
      return {
        type: 'vuex getters',
        key,
        value: instance[key]
      };
    });
  } else {
    return [];
  }
}
/**
 * Process Firebase bindings.
 */


function processFirebaseBindings(instance) {
  const refs = instance.$firebaseRefs;

  if (refs) {
    return Object.keys(refs).map(key => {
      return {
        type: 'firebase bindings',
        key,
        value: instance[key]
      };
    });
  } else {
    return [];
  }
}
/**
 * Process vue-rx observable bindings.
 */


function processObservables(instance) {
  const obs = instance.$observables;

  if (obs) {
    return Object.keys(obs).map(key => {
      return {
        type: 'observables',
        key,
        value: instance[key]
      };
    });
  } else {
    return [];
  }
}

function findInstanceOrVnode(id) {
  if (/:functional:/.test(id)) {
    const [refId] = id.split(':functional:');
    const map = tree_1.functionalVnodeMap.get(refId);
    return map && map[id];
  }

  return tree_1.instanceMap.get(id);
}

exports.findInstanceOrVnode = findInstanceOrVnode;

function editState({
  componentInstance,
  path,
  state,
  type
}, stateEditor) {
  if (!['data', 'props', 'computed', 'setup'].includes(type)) return;
  const data = stateEditor.has(componentInstance._props, path, !!state.newKey) ? componentInstance._props : componentInstance._data;
  stateEditor.set(data, path, state.value, stateEditor.createDefaultSetCallback(state));
}

exports.editState = editState;

/***/ }),

/***/ "../app-backend-vue2/lib/components/el.js":
/*!************************************************!*\
  !*** ../app-backend-vue2/lib/components/el.js ***!
  \************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.getRootElementsFromComponentInstance = exports.findRelatedComponent = exports.getInstanceOrVnodeRect = void 0;

const shared_utils_1 = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js");

function createRect() {
  const rect = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,

    get width() {
      return rect.right - rect.left;
    },

    get height() {
      return rect.bottom - rect.top;
    }

  };
  return rect;
}

function mergeRects(a, b) {
  if (!a.top || b.top < a.top) {
    a.top = b.top;
  }

  if (!a.bottom || b.bottom > a.bottom) {
    a.bottom = b.bottom;
  }

  if (!a.left || b.left < a.left) {
    a.left = b.left;
  }

  if (!a.right || b.right > a.right) {
    a.right = b.right;
  }

  return a;
}
/**
 * Get the client rect for an instance.
 */


function getInstanceOrVnodeRect(instance) {
  const el = instance.$el || instance.elm;

  if (!shared_utils_1.isBrowser) {
    // TODO: Find position from instance or a vnode (for functional components).
    return;
  }

  if (!(0, shared_utils_1.inDoc)(el)) {
    return;
  }

  if (instance._isFragment) {
    return addIframePosition(getLegacyFragmentRect(instance), getElWindow(instance.$root.$el));
  } else if (el.nodeType === 1) {
    return addIframePosition(el.getBoundingClientRect(), getElWindow(el));
  }
}

exports.getInstanceOrVnodeRect = getInstanceOrVnodeRect;
/**
 * Highlight a fragment instance.
 * Loop over its node range and determine its bounding box.
 */

function getLegacyFragmentRect({
  _fragmentStart,
  _fragmentEnd
}) {
  const rect = createRect();
  util().mapNodeRange(_fragmentStart, _fragmentEnd, function (node) {
    let childRect;

    if (node.nodeType === 1 || node.getBoundingClientRect) {
      childRect = node.getBoundingClientRect();
    } else if (node.nodeType === 3 && node.data.trim()) {
      childRect = getTextRect(node);
    }

    if (childRect) {
      mergeRects(rect, childRect);
    }
  });
  return rect;
}

let range;
/**
 * Get the bounding rect for a text node using a Range.
 */

function getTextRect(node) {
  if (!shared_utils_1.isBrowser) return;
  if (!range) range = document.createRange();
  range.selectNode(node);
  return range.getBoundingClientRect();
}
/**
 * Get Vue's util
 */


function util() {
  return shared_utils_1.target.__VUE_DEVTOOLS_GLOBAL_HOOK__.Vue.util;
}

function findRelatedComponent(el) {
  while (!el.__vue__ && el.parentElement) {
    el = el.parentElement;
  }

  return el.__vue__;
}

exports.findRelatedComponent = findRelatedComponent;

function getElWindow(el) {
  return el.ownerDocument.defaultView;
}

function addIframePosition(bounds, win) {
  if (win.__VUE_DEVTOOLS_IFRAME__) {
    const rect = mergeRects(createRect(), bounds);

    const iframeBounds = win.__VUE_DEVTOOLS_IFRAME__.getBoundingClientRect();

    rect.top += iframeBounds.top;
    rect.bottom += iframeBounds.top;
    rect.left += iframeBounds.left;
    rect.right += iframeBounds.left;

    if (win.parent) {
      return addIframePosition(rect, win.parent);
    }

    return rect;
  }

  return bounds;
}

function getRootElementsFromComponentInstance(instance) {
  if (instance._isFragment) {
    const list = [];
    const {
      _fragmentStart,
      _fragmentEnd
    } = instance;
    util().mapNodeRange(_fragmentStart, _fragmentEnd, node => {
      list.push(node);
    });
    return list;
  }

  return [instance.$el];
}

exports.getRootElementsFromComponentInstance = getRootElementsFromComponentInstance;

/***/ }),

/***/ "../app-backend-vue2/lib/components/tree.js":
/*!**************************************************!*\
  !*** ../app-backend-vue2/lib/components/tree.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.getComponentParents = exports.walkTree = exports.functionalVnodeMap = exports.instanceMap = void 0;

const shared_utils_1 = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js");

const el_1 = __webpack_require__(/*! ./el */ "../app-backend-vue2/lib/components/el.js");

const util_1 = __webpack_require__(/*! ./util */ "../app-backend-vue2/lib/components/util.js");

let appRecord;
let api;
const consoleBoundInstances = Array(5);
let filter = '';
const functionalIds = new Map(); // Dedupe instances
// Some instances may be both on a component and on a child abstract/functional component

const captureIds = new Map();

async function walkTree(instance, pFilter, api, ctx) {
  initCtx(api, ctx);
  filter = pFilter;
  functionalIds.clear();
  captureIds.clear();
  const result = flatten(await findQualifiedChildren(instance));
  return result;
}

exports.walkTree = walkTree;

function getComponentParents(instance, api, ctx) {
  initCtx(api, ctx);
  const captureIds = new Map();

  const captureId = vm => {
    const id = (0, util_1.getUniqueId)(vm);
    if (captureIds.has(id)) return;
    captureIds.set(id, undefined);
    mark(vm);
  };

  const parents = [];
  captureId(instance);
  let parent = instance;

  while (parent = parent.$parent) {
    captureId(parent);
    parents.push(parent);
  }

  return parents;
}

exports.getComponentParents = getComponentParents;

function initCtx(_api, ctx) {
  appRecord = ctx.currentAppRecord;
  api = _api;

  if (!appRecord.meta.instanceMap) {
    appRecord.meta.instanceMap = new Map();
  }

  exports.instanceMap = appRecord.meta.instanceMap;

  if (!appRecord.meta.functionalVnodeMap) {
    appRecord.meta.functionalVnodeMap = new Map();
  }

  exports.functionalVnodeMap = appRecord.meta.functionalVnodeMap;
}
/**
 * Iterate through an array of instances and flatten it into
 * an array of qualified instances. This is a depth-first
 * traversal - e.g. if an instance is not matched, we will
 * recursively go deeper until a qualified child is found.
 */


function findQualifiedChildrenFromList(instances) {
  instances = instances.filter(child => !(0, util_1.isBeingDestroyed)(child));
  return Promise.all(!filter ? instances.map(capture) : Array.prototype.concat.apply([], instances.map(findQualifiedChildren)));
}
/**
 * Find qualified children from a single instance.
 * If the instance itself is qualified, just return itself.
 * This is ok because [].concat works in both cases.
 */


async function findQualifiedChildren(instance) {
  if (isQualified(instance)) {
    return [await capture(instance)];
  } else {
    let children = await findQualifiedChildrenFromList(instance.$children); // Find functional components in recursively in non-functional vnodes.

    if (instance._vnode && instance._vnode.children) {
      const list = await Promise.all(flatten(instance._vnode.children.filter(child => !child.componentInstance).map(captureChild))); // Filter qualified children.

      const additionalChildren = list.filter(instance => isQualified(instance));
      children = children.concat(additionalChildren);
    }

    return children;
  }
}
/**
 * Get children from a component instance.
 */


function getInternalInstanceChildren(instance) {
  if (instance.$children) {
    return instance.$children;
  }

  return [];
}
/**
 * Check if an instance is qualified.
 */


function isQualified(instance) {
  const name = (0, shared_utils_1.classify)((0, util_1.getInstanceName)(instance)).toLowerCase();
  return name.indexOf(filter) > -1;
}

function flatten(items) {
  const r = items.reduce((acc, item) => {
    if (Array.isArray(item)) {
      let children = [];

      for (const i of item) {
        if (Array.isArray(i)) {
          children = children.concat(flatten(i));
        } else {
          children.push(i);
        }
      }

      acc.push(...children);
    } else if (item) {
      acc.push(item);
    }

    return acc;
  }, []);
  return r;
}

function captureChild(child) {
  if (child.fnContext && !child.componentInstance) {
    return capture(child);
  } else if (child.componentInstance) {
    if (!(0, util_1.isBeingDestroyed)(child.componentInstance)) return capture(child.componentInstance);
  } else if (child.children) {
    return Promise.all(flatten(child.children.map(captureChild)));
  }
}
/**
 * Capture the meta information of an instance. (recursive)
 */


async function capture(instance, index, list) {
  var _a, _b, _c, _d, _e, _f;

  if (instance.__VUE_DEVTOOLS_FUNCTIONAL_LEGACY__) {
    instance = instance.vnode;
  }

  if (instance.$options && instance.$options.abstract && instance._vnode && instance._vnode.componentInstance) {
    instance = instance._vnode.componentInstance;
  }

  if ((_b = (_a = instance.$options) === null || _a === void 0 ? void 0 : _a.devtools) === null || _b === void 0 ? void 0 : _b.hide) return; // Functional component.

  if (instance.fnContext && !instance.componentInstance) {
    const contextUid = instance.fnContext.__VUE_DEVTOOLS_UID__;
    let id = functionalIds.get(contextUid);

    if (id == null) {
      id = 0;
    } else {
      id++;
    }

    functionalIds.set(contextUid, id);
    const functionalId = contextUid + ':functional:' + id;
    markFunctional(functionalId, instance);
    const childrenPromise = instance.children ? instance.children.map(child => child.fnContext ? captureChild(child) : child.componentInstance ? capture(child.componentInstance) : undefined) // router-view has both fnContext and componentInstance on vnode.
    : instance.componentInstance ? [capture(instance.componentInstance)] : []; // await all childrenCapture to-be resolved

    const children = (await Promise.all(childrenPromise)).filter(Boolean);
    const treeNode = {
      uid: functionalId,
      id: functionalId,
      tags: [{
        label: 'functional',
        textColor: 0x555555,
        backgroundColor: 0xeeeeee
      }],
      name: (0, util_1.getInstanceName)(instance),
      renderKey: (0, util_1.getRenderKey)(instance.key),
      children,
      hasChildren: !!children.length,
      inactive: false,
      isFragment: false // TODO: Check what is it for.

    };
    return api.visitComponentTree(instance, treeNode, filter, (_c = appRecord === null || appRecord === void 0 ? void 0 : appRecord.options) === null || _c === void 0 ? void 0 : _c.app);
  } // instance._uid is not reliable in devtools as there
  // may be 2 roots with same _uid which causes unexpected
  // behaviour


  instance.__VUE_DEVTOOLS_UID__ = (0, util_1.getUniqueId)(instance); // Dedupe

  if (captureIds.has(instance.__VUE_DEVTOOLS_UID__)) {
    return;
  } else {
    captureIds.set(instance.__VUE_DEVTOOLS_UID__, undefined);
  }

  mark(instance);
  const name = (0, util_1.getInstanceName)(instance);
  const children = (await Promise.all((await getInternalInstanceChildren(instance)).filter(child => !(0, util_1.isBeingDestroyed)(child)).map(capture))).filter(Boolean);
  const ret = {
    uid: instance._uid,
    id: instance.__VUE_DEVTOOLS_UID__,
    name,
    renderKey: (0, util_1.getRenderKey)(instance.$vnode ? instance.$vnode.key : null),
    inactive: !!instance._inactive,
    isFragment: !!instance._isFragment,
    children,
    hasChildren: !!children.length,
    tags: [],
    meta: {}
  };

  if (instance._vnode && instance._vnode.children) {
    const vnodeChildren = await Promise.all(flatten(instance._vnode.children.map(captureChild)));
    ret.children = ret.children.concat(flatten(vnodeChildren).filter(Boolean));
    ret.hasChildren = !!ret.children.length;
  } // ensure correct ordering


  const rootElements = (0, el_1.getRootElementsFromComponentInstance)(instance);
  const firstElement = rootElements[0];

  if (firstElement === null || firstElement === void 0 ? void 0 : firstElement.parentElement) {
    const parentInstance = instance.$parent;
    const parentRootElements = parentInstance ? (0, el_1.getRootElementsFromComponentInstance)(parentInstance) : [];
    let el = firstElement;
    const indexList = [];

    do {
      indexList.push(Array.from(el.parentElement.childNodes).indexOf(el));
      el = el.parentElement;
    } while (el.parentElement && parentRootElements.length && !parentRootElements.includes(el));

    ret.domOrder = indexList.reverse();
  } else {
    ret.domOrder = [-1];
  } // check if instance is available in console


  const consoleId = consoleBoundInstances.indexOf(instance.__VUE_DEVTOOLS_UID__);
  ret.consoleId = consoleId > -1 ? '$vm' + consoleId : null; // check router view

  const isRouterView2 = (_e = (_d = instance.$vnode) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.routerView;

  if (instance._routerView || isRouterView2) {
    ret.isRouterView = true;

    if (!instance._inactive && instance.$route) {
      const matched = instance.$route.matched;
      const depth = isRouterView2 ? instance.$vnode.data.routerViewDepth : instance._routerView.depth;
      ret.meta.matchedRouteSegment = matched && matched[depth] && (isRouterView2 ? matched[depth].path : matched[depth].handler.path);
    }

    ret.tags.push({
      label: `router-view${ret.meta.matchedRouteSegment ? `: ${ret.meta.matchedRouteSegment}` : ''}`,
      textColor: 0x000000,
      backgroundColor: 0xff8344
    });
  }

  return api.visitComponentTree(instance, ret, filter, (_f = appRecord === null || appRecord === void 0 ? void 0 : appRecord.options) === null || _f === void 0 ? void 0 : _f.app);
}
/**
 * Mark an instance as captured and store it in the instance map.
 *
 * @param {Vue} instance
 */


function mark(instance) {
  const refId = instance.__VUE_DEVTOOLS_UID__;

  if (!exports.instanceMap.has(refId)) {
    exports.instanceMap.set(refId, instance);
    appRecord.instanceMap.set(refId, instance);
    instance.$on('hook:beforeDestroy', function () {
      exports.instanceMap.delete(refId);
    });
  }
}

function markFunctional(id, vnode) {
  const refId = vnode.fnContext.__VUE_DEVTOOLS_UID__;

  if (!exports.functionalVnodeMap.has(refId)) {
    exports.functionalVnodeMap.set(refId, {});
    vnode.fnContext.$on('hook:beforeDestroy', function () {
      exports.functionalVnodeMap.delete(refId);
    });
  }

  exports.functionalVnodeMap.get(refId)[id] = vnode;
  appRecord.instanceMap.set(id, {
    __VUE_DEVTOOLS_UID__: id,
    __VUE_DEVTOOLS_FUNCTIONAL_LEGACY__: true,
    vnode
  });
}

/***/ }),

/***/ "../app-backend-vue2/lib/components/util.js":
/*!**************************************************!*\
  !*** ../app-backend-vue2/lib/components/util.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.getUniqueId = exports.getRenderKey = exports.getInstanceName = exports.isBeingDestroyed = void 0;

const shared_utils_1 = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js");

function isBeingDestroyed(instance) {
  return instance._isBeingDestroyed;
}

exports.isBeingDestroyed = isBeingDestroyed;
/**
 * Get the appropriate display name for an instance.
 */

function getInstanceName(instance) {
  const name = (0, shared_utils_1.getComponentName)(instance.$options || instance.fnOptions || {});
  if (name) return name;
  return instance.$root === instance ? 'Root' : 'Anonymous Component';
}

exports.getInstanceName = getInstanceName;

function getRenderKey(value) {
  if (value == null) return;
  const type = typeof value;

  if (type === 'number') {
    return value.toString();
  } else if (type === 'string') {
    return `'${value}'`;
  } else if (Array.isArray(value)) {
    return 'Array';
  } else {
    return 'Object';
  }
}

exports.getRenderKey = getRenderKey;
/**
 * Returns a devtools unique id for instance.
 */

function getUniqueId(instance) {
  if (instance.__VUE_DEVTOOLS_UID__ != null) return instance.__VUE_DEVTOOLS_UID__;
  const rootVueId = instance.$root.__VUE_DEVTOOLS_APP_RECORD_ID__;
  return `${rootVueId}:${instance._uid}`;
}

exports.getUniqueId = getUniqueId;

/***/ }),

/***/ "../app-backend-vue2/lib/events.js":
/*!*****************************************!*\
  !*** ../app-backend-vue2/lib/events.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.wrapVueForEvents = void 0;

const shared_utils_1 = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js");

const internalRE = /^(?:pre-)?hook:/;

function wrap(app, Vue, method, ctx) {
  const original = Vue.prototype[method];

  if (original) {
    Vue.prototype[method] = function (...args) {
      const res = original.apply(this, args);
      logEvent(this, method, args[0], args.slice(1));
      return res;
    };
  }

  function logEvent(vm, type, eventName, payload) {
    // The string check is important for compat with 1.x where the first
    // argument may be an object instead of a string.
    // this also ensures the event is only logged for direct $emit (source)
    // instead of by $dispatch/$broadcast
    if (typeof eventName === 'string' && !internalRE.test(eventName)) {
      const instance = vm._self || vm;
      ctx.hook.emit(shared_utils_1.HookEvents.COMPONENT_EMIT, app, instance, eventName, payload);
    }
  }
}

function wrapVueForEvents(app, Vue, ctx) {
  ['$emit', '$broadcast', '$dispatch'].forEach(method => {
    wrap(app, Vue, method, ctx);
  });
}

exports.wrapVueForEvents = wrapVueForEvents;

/***/ }),

/***/ "../app-backend-vue2/lib/index.js":
/*!****************************************!*\
  !*** ../app-backend-vue2/lib/index.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.backend = void 0;

const app_backend_api_1 = __webpack_require__(/*! @vue-devtools/app-backend-api */ "../app-backend-api/lib/index.js");

const shared_utils_1 = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js");

const data_1 = __webpack_require__(/*! ./components/data */ "../app-backend-vue2/lib/components/data.js");

const el_1 = __webpack_require__(/*! ./components/el */ "../app-backend-vue2/lib/components/el.js");

const tree_1 = __webpack_require__(/*! ./components/tree */ "../app-backend-vue2/lib/components/tree.js");

const util_1 = __webpack_require__(/*! ./components/util */ "../app-backend-vue2/lib/components/util.js");

const events_1 = __webpack_require__(/*! ./events */ "../app-backend-vue2/lib/events.js");

const plugin_1 = __webpack_require__(/*! ./plugin */ "../app-backend-vue2/lib/plugin.js");

exports.backend = (0, app_backend_api_1.defineBackend)({
  frameworkVersion: 2,
  features: [app_backend_api_1.BuiltinBackendFeature.FLUSH],

  setup(api) {
    api.on.getAppRecordName(payload => {
      if (payload.app.name) {
        payload.name = payload.app.name;
      } else if (payload.app.$options.name) {
        payload.name = payload.app.$options.name;
      }
    });
    api.on.getAppRootInstance(payload => {
      payload.root = payload.app;
    });
    api.on.walkComponentTree(async (payload, ctx) => {
      payload.componentTreeData = await (0, tree_1.walkTree)(payload.componentInstance, payload.filter, api, ctx);
    });
    api.on.walkComponentParents((payload, ctx) => {
      payload.parentInstances = (0, tree_1.getComponentParents)(payload.componentInstance, api, ctx);
    });
    api.on.inspectComponent(payload => {
      injectToUtils();
      payload.instanceData = (0, data_1.getInstanceDetails)(payload.componentInstance);
    });
    api.on.getComponentBounds(payload => {
      payload.bounds = (0, el_1.getInstanceOrVnodeRect)(payload.componentInstance);
    });
    api.on.getComponentName(payload => {
      const instance = payload.componentInstance;
      payload.name = instance.fnContext ? (0, shared_utils_1.getComponentName)(instance.fnOptions) : (0, util_1.getInstanceName)(instance);
    });
    api.on.getElementComponent(payload => {
      payload.componentInstance = (0, el_1.findRelatedComponent)(payload.element);
    });
    api.on.editComponentState(payload => {
      (0, data_1.editState)(payload, api.stateEditor);
    });
    api.on.getComponentRootElements(payload => {
      payload.rootElements = (0, el_1.getRootElementsFromComponentInstance)(payload.componentInstance);
    });
    api.on.getComponentDevtoolsOptions(payload => {
      payload.options = payload.componentInstance.$options.devtools;
    });
    api.on.getComponentRenderCode(payload => {
      payload.code = payload.componentInstance.$options.render.toString();
    });
    api.on.getComponentInstances(() => {
      console.warn('on.getComponentInstances is not implemented for Vue 2');
    });
  },

  setupApp(api, appRecord) {
    const {
      Vue
    } = appRecord.options.meta;
    const app = appRecord.options.app; // State editor overrides

    api.stateEditor.createDefaultSetCallback = state => {
      return (obj, field, value) => {
        if (state.remove || state.newKey) Vue.delete(obj, field);
        if (!state.remove) Vue.set(obj, state.newKey || field, value);
      };
    }; // Utils


    injectToUtils();
    (0, events_1.wrapVueForEvents)(app, Vue, api.ctx); // Plugin

    (0, plugin_1.setupPlugin)(api, app, Vue);
  }

}); // @TODO refactor

function injectToUtils() {
  shared_utils_1.backendInjections.getCustomInstanceDetails = data_1.getCustomInstanceDetails;
  shared_utils_1.backendInjections.instanceMap = tree_1.instanceMap;

  shared_utils_1.backendInjections.isVueInstance = val => val._isVue;
}

/***/ }),

/***/ "../app-backend-vue2/lib/plugin.js":
/*!*****************************************!*\
  !*** ../app-backend-vue2/lib/plugin.js ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.setupPlugin = void 0;

const devtools_api_1 = __webpack_require__(/*! @vue/devtools-api */ "../api/lib/esm/index.js");

const shared_utils_1 = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js");

const clone_deep_1 = __importDefault(__webpack_require__(/*! clone-deep */ "../../node_modules/clone-deep/index.js"));

let actionId = 0;

function setupPlugin(api, app, Vue) {
  const ROUTER_INSPECTOR_ID = 'vue2-router-inspector';
  const ROUTER_CHANGES_LAYER_ID = 'vue2-router-changes';
  const VUEX_INSPECTOR_ID = 'vue2-vuex-inspector';
  const VUEX_MUTATIONS_ID = 'vue2-vuex-mutations';
  const VUEX_ACTIONS_ID = 'vue2-vuex-actions';
  (0, devtools_api_1.setupDevtoolsPlugin)({
    app,
    id: 'org.vuejs.vue2-internal',
    label: 'Vue 2',
    homepage: 'https://vuejs.org/',
    logo: 'https://vuejs.org/images/icons/favicon-96x96.png'
  }, api => {
    const hook = shared_utils_1.target.__VUE_DEVTOOLS_GLOBAL_HOOK__; // Vue Router

    if (app.$router) {
      const router = app.$router; // Inspector

      api.addInspector({
        id: ROUTER_INSPECTOR_ID,
        label: 'Routes',
        icon: 'book',
        treeFilterPlaceholder: 'Search routes'
      });
      api.on.getInspectorTree(payload => {
        if (payload.inspectorId === ROUTER_INSPECTOR_ID) {
          payload.rootNodes = router.options.routes.map(route => formatRouteNode(router, route, '', payload.filter)).filter(Boolean);
        }
      });
      api.on.getInspectorState(payload => {
        if (payload.inspectorId === ROUTER_INSPECTOR_ID) {
          const route = router.matcher.getRoutes().find(r => getPathId(r) === payload.nodeId);

          if (route) {
            payload.state = {
              options: formatRouteData(route)
            };
          }
        }
      }); // Timeline

      api.addTimelineLayer({
        id: ROUTER_CHANGES_LAYER_ID,
        label: 'Router Navigations',
        color: 0x40a8c4
      });
      router.afterEach((to, from) => {
        api.addTimelineEvent({
          layerId: ROUTER_CHANGES_LAYER_ID,
          event: {
            time: Date.now(),
            title: to.path,
            data: {
              from,
              to
            }
          }
        });
        api.sendInspectorTree(ROUTER_INSPECTOR_ID);
      });
    } // Vuex


    if (app.$store) {
      const store = app.$store;
      api.addInspector({
        id: VUEX_INSPECTOR_ID,
        label: 'Vuex',
        icon: 'storage',
        treeFilterPlaceholder: 'Filter stores...'
      });
      api.on.getInspectorTree(payload => {
        if (payload.inspectorId === VUEX_INSPECTOR_ID) {
          if (payload.filter) {
            const nodes = [];
            flattenStoreForInspectorTree(nodes, store._modules.root, payload.filter, '');
            payload.rootNodes = nodes;
          } else {
            payload.rootNodes = [formatStoreForInspectorTree(store._modules.root, '')];
          }
        }
      });
      api.on.getInspectorState(payload => {
        if (payload.inspectorId === VUEX_INSPECTOR_ID) {
          const modulePath = payload.nodeId;
          const module = getStoreModule(store._modules, modulePath); // Access the getters prop to init getters cache (which is lazy)
          // eslint-disable-next-line no-unused-expressions

          module.context.getters;
          payload.state = formatStoreForInspectorState(module, store._makeLocalGettersCache, modulePath);
        }
      });
      api.addTimelineLayer({
        id: VUEX_MUTATIONS_ID,
        label: 'Vuex Mutations',
        color: LIME_500
      });
      api.addTimelineLayer({
        id: VUEX_ACTIONS_ID,
        label: 'Vuex Actions',
        color: LIME_500
      });
      hook.on('vuex:mutation', (mutation, state) => {
        api.sendInspectorState(VUEX_INSPECTOR_ID);
        const data = {};

        if (mutation.payload) {
          data.payload = mutation.payload;
        }

        data.state = (0, clone_deep_1.default)(state);
        api.addTimelineEvent({
          layerId: VUEX_MUTATIONS_ID,
          event: {
            time: Date.now(),
            title: mutation.type,
            data
          }
        });
      });
      store.subscribeAction({
        before: (action, state) => {
          const data = {};

          if (action.payload) {
            data.payload = action.payload;
          }

          action._id = actionId++;
          action._time = Date.now();
          data.state = state;
          api.addTimelineEvent({
            layerId: VUEX_ACTIONS_ID,
            event: {
              time: action._time,
              title: action.type,
              groupId: action._id,
              subtitle: 'start',
              data
            }
          });
        },
        after: (action, state) => {
          const data = {};

          const duration = Date.now() - action._time;

          data.duration = {
            _custom: {
              type: 'duration',
              display: `${duration}ms`,
              tooltip: 'Action duration',
              value: duration
            }
          };

          if (action.payload) {
            data.payload = action.payload;
          }

          data.state = state;
          api.addTimelineEvent({
            layerId: VUEX_ACTIONS_ID,
            event: {
              time: Date.now(),
              title: action.type,
              groupId: action._id,
              subtitle: 'end',
              data
            }
          });
        }
      }, {
        prepend: true
      }); // Inspect getters on mutations

      api.on.inspectTimelineEvent(payload => {
        if (payload.layerId === VUEX_MUTATIONS_ID) {
          const getterKeys = Object.keys(store.getters);

          if (getterKeys.length) {
            const vm = new Vue({
              data: {
                $$state: payload.data.state
              },
              computed: store._vm.$options.computed
            });
            const originalVm = store._vm;
            store._vm = vm;
            const tree = transformPathsToObjectTree(store.getters);
            payload.data.getters = (0, clone_deep_1.default)(tree);
            store._vm = originalVm;
            vm.$destroy();
          }
        }
      });
    }
  });
}

exports.setupPlugin = setupPlugin;
/**
 * Extracted from tailwind palette
 */

const BLUE_600 = 0x2563eb;
const LIME_500 = 0x84cc16;
const CYAN_400 = 0x22d3ee;
const ORANGE_400 = 0xfb923c;
const WHITE = 0xffffff;
const DARK = 0x666666;

function formatRouteNode(router, route, parentPath, filter) {
  var _a, _b;

  const node = {
    id: parentPath + route.path,
    label: route.path,
    children: (_a = route.children) === null || _a === void 0 ? void 0 : _a.map(child => formatRouteNode(router, child, route.path, filter)).filter(Boolean),
    tags: []
  };
  if (filter && !node.id.includes(filter) && !((_b = node.children) === null || _b === void 0 ? void 0 : _b.length)) return null;

  if (route.name != null) {
    node.tags.push({
      label: String(route.name),
      textColor: 0,
      backgroundColor: CYAN_400
    });
  }

  if (route.alias != null) {
    node.tags.push({
      label: 'alias',
      textColor: 0,
      backgroundColor: ORANGE_400
    });
  }

  const currentPath = router.currentRoute.matched.reduce((p, m) => p + m.path, '');

  if (node.id === currentPath) {
    node.tags.push({
      label: 'active',
      textColor: WHITE,
      backgroundColor: BLUE_600
    });
  }

  if (route.redirect) {
    node.tags.push({
      label: 'redirect: ' + (typeof route.redirect === 'string' ? route.redirect : 'Object'),
      textColor: WHITE,
      backgroundColor: DARK
    });
  }

  return node;
}

function formatRouteData(route) {
  const data = [];
  data.push({
    key: 'path',
    value: route.path
  });

  if (route.redirect) {
    data.push({
      key: 'redirect',
      value: route.redirect
    });
  }

  if (route.alias) {
    data.push({
      key: 'alias',
      value: route.alias
    });
  }

  if (route.props) {
    data.push({
      key: 'props',
      value: route.props
    });
  }

  if (route.name && route.name != null) {
    data.push({
      key: 'name',
      value: route.name
    });
  }

  if (route.component) {
    const component = {}; // if (route.component.__file) {
    //   component.file = route.component.__file
    // }

    if (route.component.template) {
      component.template = route.component.template;
    }

    if (route.component.props) {
      component.props = route.component.props;
    }

    if (!(0, shared_utils_1.isEmptyObject)(component)) {
      data.push({
        key: 'component',
        value: component
      });
    }
  }

  return data;
}

function getPathId(routeMatcher) {
  let path = routeMatcher.path;

  if (routeMatcher.parent) {
    path = getPathId(routeMatcher.parent) + path;
  }

  return path;
}

const TAG_NAMESPACED = {
  label: 'namespaced',
  textColor: WHITE,
  backgroundColor: DARK
};

function formatStoreForInspectorTree(module, path) {
  return {
    id: path || 'root',
    // all modules end with a `/`, we want the last segment only
    // cart/ -> cart
    // nested/cart/ -> cart
    label: extractNameFromPath(path),
    tags: module.namespaced ? [TAG_NAMESPACED] : [],
    children: Object.keys(module._children).map(moduleName => formatStoreForInspectorTree(module._children[moduleName], path + moduleName + '/'))
  };
}

function flattenStoreForInspectorTree(result, module, filter, path) {
  if (path.includes(filter)) {
    result.push({
      id: path || 'root',
      label: path.endsWith('/') ? path.slice(0, path.length - 1) : path || 'Root',
      tags: module.namespaced ? [TAG_NAMESPACED] : []
    });
  }

  Object.keys(module._children).forEach(moduleName => {
    flattenStoreForInspectorTree(result, module._children[moduleName], filter, path + moduleName + '/');
  });
}

function extractNameFromPath(path) {
  return path && path !== 'root' ? path.split('/').slice(-2, -1)[0] : 'Root';
}

function formatStoreForInspectorState(module, getters, path) {
  getters = !module.namespaced || path === 'root' ? module.context.getters : getters[path];
  const gettersKeys = Object.keys(getters);
  const storeState = {
    state: Object.keys(module.state).map(key => ({
      key,
      editable: true,
      value: module.state[key]
    }))
  };

  if (gettersKeys.length) {
    const tree = transformPathsToObjectTree(getters);
    storeState.getters = Object.keys(tree).map(key => ({
      key: key.endsWith('/') ? extractNameFromPath(key) : key,
      editable: false,
      value: canThrow(() => tree[key])
    }));
  }

  return storeState;
}

function transformPathsToObjectTree(getters) {
  const result = {};
  Object.keys(getters).forEach(key => {
    const path = key.split('/');

    if (path.length > 1) {
      let target = result;
      const leafKey = path.pop();

      for (const p of path) {
        if (!target[p]) {
          target[p] = {
            _custom: {
              value: {},
              display: p,
              tooltip: 'Module',
              abstract: true
            }
          };
        }

        target = target[p]._custom.value;
      }

      target[leafKey] = canThrow(() => getters[key]);
    } else {
      result[key] = canThrow(() => getters[key]);
    }
  });
  return result;
}

function getStoreModule(moduleMap, path) {
  const names = path.split('/').filter(n => n);
  return names.reduce((module, moduleName, i) => {
    const child = module[moduleName];

    if (!child) {
      throw new Error(`Missing module "${moduleName}" for path "${path}".`);
    }

    return i === names.length - 1 ? child : child._children;
  }, path === 'root' ? moduleMap : moduleMap.root._children);
}

function canThrow(cb) {
  try {
    return cb();
  } catch (e) {
    return e;
  }
}

/***/ }),

/***/ "../app-backend-vue3/lib/components/data.js":
/*!**************************************************!*\
  !*** ../app-backend-vue3/lib/components/data.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.getCustomInstanceDetails = exports.editState = exports.getInstanceDetails = void 0;

const util_1 = __webpack_require__(/*! ./util */ "../app-backend-vue3/lib/components/util.js");

const shared_utils_1 = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js");

const util_2 = __webpack_require__(/*! ../util */ "../app-backend-vue3/lib/util.js");
/**
 * Get the detailed information of an inspected instance.
 */


function getInstanceDetails(instance, ctx) {
  var _a;

  return {
    id: (0, util_1.getUniqueComponentId)(instance, ctx),
    name: (0, util_1.getInstanceName)(instance),
    file: (_a = instance.type) === null || _a === void 0 ? void 0 : _a.__file,
    state: getInstanceState(instance)
  };
}

exports.getInstanceDetails = getInstanceDetails;

function getInstanceState(instance) {
  const mergedType = resolveMergedOptions(instance);
  return processProps(instance).concat(processState(instance), processSetupState(instance), processComputed(instance, mergedType), processAttrs(instance), processProvide(instance), processInject(instance, mergedType), processRefs(instance));
}
/**
 * Process the props of an instance.
 * Make sure return a plain object because window.postMessage()
 * will throw an Error if the passed object contains Functions.
 *
 * @param {Vue} instance
 * @return {Array}
 */


function processProps(instance) {
  const propsData = [];
  const propDefinitions = instance.type.props;

  for (let key in instance.props) {
    const propDefinition = propDefinitions ? propDefinitions[key] : null;
    key = (0, shared_utils_1.camelize)(key);
    propsData.push({
      type: 'props',
      key,
      value: (0, util_2.returnError)(() => instance.props[key]),
      meta: propDefinition ? {
        type: propDefinition.type ? getPropType(propDefinition.type) : 'any',
        required: !!propDefinition.required,
        ...(propDefinition.default != null ? {
          default: propDefinition.default.toString()
        } : {})
      } : {
        type: 'invalid'
      },
      editable: shared_utils_1.SharedData.editableProps
    });
  }

  return propsData;
}

const fnTypeRE = /^(?:function|class) (\w+)/;
/**
 * Convert prop type constructor to string.
 */

function getPropType(type) {
  if (Array.isArray(type)) {
    return type.map(t => getPropType(t)).join(' or ');
  }

  if (type == null) {
    return 'null';
  }

  const match = type.toString().match(fnTypeRE);
  return typeof type === 'function' ? match && match[1] || 'any' : 'any';
}
/**
 * Process state, filtering out props and "clean" the result
 * with a JSON dance. This removes functions which can cause
 * errors during structured clone used by window.postMessage.
 *
 * @param {Vue} instance
 * @return {Array}
 */


function processState(instance) {
  const type = instance.type;
  const props = type.props;
  const getters = type.vuex && type.vuex.getters;
  const computedDefs = type.computed;
  const data = { ...instance.data,
    ...instance.renderContext
  };
  return Object.keys(data).filter(key => !(props && key in props) && !(getters && key in getters) && !(computedDefs && key in computedDefs)).map(key => ({
    key,
    type: 'data',
    value: (0, util_2.returnError)(() => data[key]),
    editable: true
  }));
}

function processSetupState(instance) {
  const raw = instance.devtoolsRawSetupState || {};
  return Object.keys(instance.setupState).map(key => {
    var _a, _b, _c, _d;

    const value = (0, util_2.returnError)(() => instance.setupState[key]);
    const rawData = raw[key];
    let result;

    if (rawData) {
      const info = getSetupStateInfo(rawData);
      const objectType = info.computed ? 'Computed' : info.ref ? 'Ref' : info.reactive ? 'Reactive' : null;
      const isState = info.ref || info.computed || info.reactive;
      const isOther = typeof value === 'function' || typeof (value === null || value === void 0 ? void 0 : value.render) === 'function';
      const raw = ((_b = (_a = rawData.effect) === null || _a === void 0 ? void 0 : _a.raw) === null || _b === void 0 ? void 0 : _b.toString()) || ((_d = (_c = rawData.effect) === null || _c === void 0 ? void 0 : _c.fn) === null || _d === void 0 ? void 0 : _d.toString());
      result = { ...(objectType ? {
          objectType
        } : {}),
        ...(raw ? {
          raw
        } : {}),
        editable: isState && !info.readonly,
        type: isOther ? 'setup (other)' : 'setup'
      };
    } else {
      result = {
        type: 'setup'
      };
    }

    return {
      key,
      value,
      ...result
    };
  });
}

function isRef(raw) {
  return !!raw.__v_isRef;
}

function isComputed(raw) {
  return isRef(raw) && !!raw.effect;
}

function isReactive(raw) {
  return !!raw.__v_isReactive;
}

function isReadOnly(raw) {
  return !!raw.__v_isReadonly;
}

function getSetupStateInfo(raw) {
  return {
    ref: isRef(raw),
    computed: isComputed(raw),
    reactive: isReactive(raw),
    readonly: isReadOnly(raw)
  };
}
/**
 * Process the computed properties of an instance.
 *
 * @param {Vue} instance
 * @return {Array}
 */


function processComputed(instance, mergedType) {
  const type = mergedType;
  const computed = [];
  const defs = type.computed || {}; // use for...in here because if 'computed' is not defined
  // on component, computed properties will be placed in prototype
  // and Object.keys does not include
  // properties from object's prototype

  for (const key in defs) {
    const def = defs[key];
    const type = typeof def === 'function' && def.vuex ? 'vuex bindings' : 'computed';
    computed.push({
      type,
      key,
      value: (0, util_2.returnError)(() => instance.proxy[key]),
      editable: typeof def.set === 'function'
    });
  }

  return computed;
}

function processAttrs(instance) {
  return Object.keys(instance.attrs).map(key => ({
    type: 'attrs',
    key,
    value: (0, util_2.returnError)(() => instance.attrs[key])
  }));
}

function processProvide(instance) {
  return Object.keys(instance.provides).map(key => ({
    type: 'provided',
    key,
    value: (0, util_2.returnError)(() => instance.provides[key])
  }));
}

function processInject(instance, mergedType) {
  if (!(mergedType === null || mergedType === void 0 ? void 0 : mergedType.inject)) return [];
  let keys = [];

  if (Array.isArray(mergedType.inject)) {
    keys = mergedType.inject.map(key => ({
      key,
      originalKey: key
    }));
  } else {
    keys = Object.keys(mergedType.inject).map(key => {
      const value = mergedType.inject[key];
      let originalKey;

      if (typeof value === 'string') {
        originalKey = value;
      } else {
        originalKey = value.from;
      }

      return {
        key,
        originalKey
      };
    });
  }

  return keys.map(({
    key,
    originalKey
  }) => ({
    type: 'injected',
    key: originalKey && key !== originalKey ? `${originalKey} ➞ ${key}` : key,
    value: (0, util_2.returnError)(() => instance.ctx[key])
  }));
}

function processRefs(instance) {
  return Object.keys(instance.refs).map(key => ({
    type: 'refs',
    key,
    value: (0, util_2.returnError)(() => instance.refs[key])
  }));
}

function editState({
  componentInstance,
  path,
  state,
  type
}, stateEditor, ctx) {
  if (!['data', 'props', 'computed', 'setup'].includes(type)) return;
  let target;
  const targetPath = path.slice();

  if (Object.keys(componentInstance.props).includes(path[0])) {
    // Props
    target = componentInstance.props;
  } else if (componentInstance.devtoolsRawSetupState && Object.keys(componentInstance.devtoolsRawSetupState).includes(path[0])) {
    // Setup
    target = componentInstance.devtoolsRawSetupState;
    const currentValue = stateEditor.get(componentInstance.devtoolsRawSetupState, path);

    if (currentValue != null) {
      const info = getSetupStateInfo(currentValue);
      if (info.readonly) return;
    }
  } else {
    target = componentInstance.proxy;
  }

  if (target && targetPath) {
    stateEditor.set(target, targetPath, 'value' in state ? state.value : undefined, stateEditor.createDefaultSetCallback(state));
  }
}

exports.editState = editState;

function reduceStateList(list) {
  if (!list.length) {
    return undefined;
  }

  return list.reduce((map, item) => {
    const key = item.type || 'data';
    const obj = map[key] = map[key] || {};
    obj[item.key] = item.value;
    return map;
  }, {});
}

function getCustomInstanceDetails(instance) {
  if (instance._) instance = instance._;
  const state = getInstanceState(instance);
  return {
    _custom: {
      type: 'component',
      id: instance.__VUE_DEVTOOLS_UID__,
      display: (0, util_1.getInstanceName)(instance),
      tooltip: 'Component instance',
      value: reduceStateList(state),
      fields: {
        abstract: true
      }
    }
  };
}

exports.getCustomInstanceDetails = getCustomInstanceDetails;

function resolveMergedOptions(instance) {
  const raw = instance.type;
  const {
    mixins,
    extends: extendsOptions
  } = raw;
  const globalMixins = instance.appContext.mixins;
  if (!globalMixins.length && !mixins && !extendsOptions) return raw;
  const options = {};
  globalMixins.forEach(m => mergeOptions(options, m, instance));
  mergeOptions(options, raw, instance);
  return options;
}

function mergeOptions(to, from, instance) {
  if (typeof from === 'function') {
    from = from.options;
  }

  if (!from) return to;
  const {
    mixins,
    extends: extendsOptions
  } = from;
  extendsOptions && mergeOptions(to, extendsOptions, instance);
  mixins && mixins.forEach(m => mergeOptions(to, m, instance));

  for (const key of ['computed', 'inject']) {
    if (Object.prototype.hasOwnProperty.call(from, key)) {
      if (!to[key]) {
        to[key] = from[key];
      } else {
        Object.assign(to[key], from[key]);
      }
    }
  }

  return to;
}

/***/ }),

/***/ "../app-backend-vue3/lib/components/el.js":
/*!************************************************!*\
  !*** ../app-backend-vue3/lib/components/el.js ***!
  \************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.getInstanceOrVnodeRect = exports.getRootElementsFromComponentInstance = exports.getComponentInstanceFromElement = void 0;

const shared_utils_1 = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js");

const util_1 = __webpack_require__(/*! ./util */ "../app-backend-vue3/lib/components/util.js");

function getComponentInstanceFromElement(element) {
  return element.__vueParentComponent;
}

exports.getComponentInstanceFromElement = getComponentInstanceFromElement;

function getRootElementsFromComponentInstance(instance) {
  if ((0, util_1.isFragment)(instance)) {
    return getFragmentRootElements(instance.subTree);
  }

  return [instance.subTree.el];
}

exports.getRootElementsFromComponentInstance = getRootElementsFromComponentInstance;

function getFragmentRootElements(vnode) {
  if (!vnode.children) return [];
  const list = [];

  for (let i = 0, l = vnode.children.length; i < l; i++) {
    const childVnode = vnode.children[i];

    if (childVnode.component) {
      list.push(...getRootElementsFromComponentInstance(childVnode.component));
    } else if (childVnode.el) {
      list.push(childVnode.el);
    }
  }

  return list;
}
/**
 * Get the client rect for an instance.
 *
 * @param {Vue|Vnode} instance
 * @return {Object}
 */


function getInstanceOrVnodeRect(instance) {
  const el = instance.subTree.el;

  if (!shared_utils_1.isBrowser) {
    // @TODO: Find position from instance or a vnode (for functional components).
    return;
  }

  if (!(0, shared_utils_1.inDoc)(el)) {
    return;
  }

  if ((0, util_1.isFragment)(instance)) {
    return addIframePosition(getFragmentRect(instance.subTree), getElWindow(el));
  } else if (el.nodeType === 1) {
    return addIframePosition(el.getBoundingClientRect(), getElWindow(el));
  }
}

exports.getInstanceOrVnodeRect = getInstanceOrVnodeRect;

function createRect() {
  const rect = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,

    get width() {
      return rect.right - rect.left;
    },

    get height() {
      return rect.bottom - rect.top;
    }

  };
  return rect;
}

function mergeRects(a, b) {
  if (!a.top || b.top < a.top) {
    a.top = b.top;
  }

  if (!a.bottom || b.bottom > a.bottom) {
    a.bottom = b.bottom;
  }

  if (!a.left || b.left < a.left) {
    a.left = b.left;
  }

  if (!a.right || b.right > a.right) {
    a.right = b.right;
  }

  return a;
}

let range;
/**
 * Get the bounding rect for a text node using a Range.
 *
 * @param {Text} node
 * @return {Rect}
 */

function getTextRect(node) {
  if (!shared_utils_1.isBrowser) return;
  if (!range) range = document.createRange();
  range.selectNode(node);
  return range.getBoundingClientRect();
}

function getFragmentRect(vnode) {
  const rect = createRect();
  if (!vnode.children) return rect;

  for (let i = 0, l = vnode.children.length; i < l; i++) {
    const childVnode = vnode.children[i];
    let childRect;

    if (childVnode.component) {
      childRect = getInstanceOrVnodeRect(childVnode.component);
    } else if (childVnode.el) {
      const el = childVnode.el;

      if (el.nodeType === 1 || el.getBoundingClientRect) {
        childRect = el.getBoundingClientRect();
      } else if (el.nodeType === 3 && el.data.trim()) {
        childRect = getTextRect(el);
      }
    }

    if (childRect) {
      mergeRects(rect, childRect);
    }
  }

  return rect;
}

function getElWindow(el) {
  return el.ownerDocument.defaultView;
}

function addIframePosition(bounds, win) {
  if (win.__VUE_DEVTOOLS_IFRAME__) {
    const rect = mergeRects(createRect(), bounds);

    const iframeBounds = win.__VUE_DEVTOOLS_IFRAME__.getBoundingClientRect();

    rect.top += iframeBounds.top;
    rect.bottom += iframeBounds.top;
    rect.left += iframeBounds.left;
    rect.right += iframeBounds.left;

    if (win.parent) {
      return addIframePosition(rect, win.parent);
    }

    return rect;
  }

  return bounds;
}

/***/ }),

/***/ "../app-backend-vue3/lib/components/filter.js":
/*!****************************************************!*\
  !*** ../app-backend-vue3/lib/components/filter.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.ComponentFilter = void 0;

const shared_utils_1 = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js");

const util_1 = __webpack_require__(/*! ./util */ "../app-backend-vue3/lib/components/util.js");

class ComponentFilter {
  constructor(filter) {
    this.filter = filter || '';
  }
  /**
   * Check if an instance is qualified.
   *
   * @param {Vue|Vnode} instance
   * @return {Boolean}
   */


  isQualified(instance) {
    const name = (0, shared_utils_1.classify)((0, util_1.getInstanceName)(instance)).toLowerCase();
    return name.indexOf(this.filter) > -1;
  }

}

exports.ComponentFilter = ComponentFilter;

/***/ }),

/***/ "../app-backend-vue3/lib/components/tree.js":
/*!**************************************************!*\
  !*** ../app-backend-vue3/lib/components/tree.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.ComponentWalker = void 0;

const util_1 = __webpack_require__(/*! ./util */ "../app-backend-vue3/lib/components/util.js");

const filter_1 = __webpack_require__(/*! ./filter */ "../app-backend-vue3/lib/components/filter.js");

const el_1 = __webpack_require__(/*! ./el */ "../app-backend-vue3/lib/components/el.js");

class ComponentWalker {
  constructor(maxDepth, filter, api, ctx) {
    this.ctx = ctx;
    this.api = api;
    this.maxDepth = maxDepth;
    this.componentFilter = new filter_1.ComponentFilter(filter);
  }

  getComponentTree(instance) {
    this.captureIds = new Map();
    return this.findQualifiedChildren(instance, 0);
  }

  getComponentParents(instance) {
    this.captureIds = new Map();
    const parents = [];
    this.captureId(instance);
    let parent = instance;

    while (parent = parent.parent) {
      this.captureId(parent);
      parents.push(parent);
    }

    return parents;
  }
  /**
   * Find qualified children from a single instance.
   * If the instance itself is qualified, just return itself.
   * This is ok because [].concat works in both cases.
   *
   * @param {Vue|Vnode} instance
   * @return {Vue|Array}
   */


  async findQualifiedChildren(instance, depth) {
    var _a;

    if (this.componentFilter.isQualified(instance) && !((_a = instance.type.devtools) === null || _a === void 0 ? void 0 : _a.hide)) {
      return [await this.capture(instance, null, depth)];
    } else if (instance.subTree) {
      // TODO functional components
      return this.findQualifiedChildrenFromList(this.getInternalInstanceChildren(instance.subTree), depth);
    } else {
      return [];
    }
  }
  /**
   * Iterate through an array of instances and flatten it into
   * an array of qualified instances. This is a depth-first
   * traversal - e.g. if an instance is not matched, we will
   * recursively go deeper until a qualified child is found.
   *
   * @param {Array} instances
   * @return {Array}
   */


  async findQualifiedChildrenFromList(instances, depth) {
    instances = instances.filter(child => {
      var _a;

      return !(0, util_1.isBeingDestroyed)(child) && !((_a = child.type.devtools) === null || _a === void 0 ? void 0 : _a.hide);
    });

    if (!this.componentFilter.filter) {
      return Promise.all(instances.map((child, index, list) => this.capture(child, list, depth)));
    } else {
      return Array.prototype.concat.apply([], await Promise.all(instances.map(i => this.findQualifiedChildren(i, depth))));
    }
  }
  /**
   * Get children from a component instance.
   */


  getInternalInstanceChildren(subTree, suspense = null) {
    const list = [];

    if (subTree.component) {
      !suspense ? list.push(subTree.component) : list.push({ ...subTree.component,
        suspense
      });
    } else if (subTree.suspense) {
      const suspenseKey = !subTree.suspense.isInFallback ? 'suspense default' : 'suspense fallback';
      list.push(...this.getInternalInstanceChildren(subTree.suspense.activeBranch, { ...subTree.suspense,
        suspenseKey
      }));
    } else if (Array.isArray(subTree.children)) {
      subTree.children.forEach(childSubTree => {
        if (childSubTree.component) {
          !suspense ? list.push(childSubTree.component) : list.push({ ...childSubTree.component,
            suspense
          });
        } else {
          list.push(...this.getInternalInstanceChildren(childSubTree, suspense));
        }
      });
    }

    return list.filter(child => {
      var _a;

      return !(0, util_1.isBeingDestroyed)(child) && !((_a = child.type.devtools) === null || _a === void 0 ? void 0 : _a.hide);
    });
  }

  captureId(instance) {
    if (!instance) return null; // instance.uid is not reliable in devtools as there
    // may be 2 roots with same uid which causes unexpected
    // behaviour

    const id = instance.__VUE_DEVTOOLS_UID__ != null ? instance.__VUE_DEVTOOLS_UID__ : (0, util_1.getUniqueComponentId)(instance, this.ctx);
    instance.__VUE_DEVTOOLS_UID__ = id; // Dedupe

    if (this.captureIds.has(id)) {
      return;
    } else {
      this.captureIds.set(id, undefined);
    }

    this.mark(instance);
    return id;
  }
  /**
   * Capture the meta information of an instance. (recursive)
   *
   * @param {Vue} instance
   * @return {Object}
   */


  async capture(instance, list, depth) {
    var _a;

    const id = this.captureId(instance);
    const name = (0, util_1.getInstanceName)(instance);
    const children = this.getInternalInstanceChildren(instance.subTree).filter(child => !(0, util_1.isBeingDestroyed)(child));
    const parents = this.getComponentParents(instance) || [];
    const inactive = !!instance.isDeactivated || parents.some(parent => parent.isDeactivated);
    const treeNode = {
      uid: instance.uid,
      id,
      name,
      renderKey: (0, util_1.getRenderKey)(instance.vnode ? instance.vnode.key : null),
      inactive,
      hasChildren: !!children.length,
      children: [],
      isFragment: (0, util_1.isFragment)(instance),
      tags: []
    }; // capture children

    if (depth < this.maxDepth || instance.type.__isKeepAlive || parents.some(parent => parent.type.__isKeepAlive)) {
      treeNode.children = await Promise.all(children.map((child, index, list) => this.capture(child, list, depth + 1)).filter(Boolean));
    } // keep-alive


    if (instance.type.__isKeepAlive && instance.__v_cache) {
      const cachedComponents = Array.from(instance.__v_cache.values()).map(vnode => vnode.component).filter(Boolean);
      const childrenIds = children.map(child => child.__VUE_DEVTOOLS_UID__);

      for (const cachedChild of cachedComponents) {
        if (!childrenIds.includes(cachedChild.__VUE_DEVTOOLS_UID__)) {
          const node = await this.capture({ ...cachedChild,
            isDeactivated: true
          }, null, depth + 1);

          if (node) {
            treeNode.children.push(node);
          }
        }
      }
    } // ensure correct ordering


    const rootElements = (0, el_1.getRootElementsFromComponentInstance)(instance);
    const firstElement = rootElements[0];

    if (firstElement === null || firstElement === void 0 ? void 0 : firstElement.parentElement) {
      const parentInstance = instance.parent;
      const parentRootElements = parentInstance ? (0, el_1.getRootElementsFromComponentInstance)(parentInstance) : [];
      let el = firstElement;
      const indexList = [];

      do {
        indexList.push(Array.from(el.parentElement.childNodes).indexOf(el));
        el = el.parentElement;
      } while (el.parentElement && parentRootElements.length && !parentRootElements.includes(el));

      treeNode.domOrder = indexList.reverse();
    } else {
      treeNode.domOrder = [-1];
    }

    if ((_a = instance.suspense) === null || _a === void 0 ? void 0 : _a.suspenseKey) {
      treeNode.tags.push({
        label: instance.suspense.suspenseKey,
        backgroundColor: 0xe492e4,
        textColor: 0xffffff
      }); // update instanceMap

      this.mark(instance, true);
    }

    return this.api.visitComponentTree(instance, treeNode, this.componentFilter.filter, this.ctx.currentAppRecord.options.app);
  }
  /**
   * Mark an instance as captured and store it in the instance map.
   *
   * @param {Vue} instance
   */


  mark(instance, force = false) {
    const instanceMap = this.ctx.currentAppRecord.instanceMap;

    if (force || !instanceMap.has(instance.__VUE_DEVTOOLS_UID__)) {
      instanceMap.set(instance.__VUE_DEVTOOLS_UID__, instance);
    }
  }

}

exports.ComponentWalker = ComponentWalker;

/***/ }),

/***/ "../app-backend-vue3/lib/components/util.js":
/*!**************************************************!*\
  !*** ../app-backend-vue3/lib/components/util.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.getComponentInstances = exports.getRenderKey = exports.getUniqueComponentId = exports.getInstanceName = exports.isFragment = exports.getAppRecord = exports.isBeingDestroyed = void 0;

const shared_utils_1 = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js");

const util_1 = __webpack_require__(/*! ../util */ "../app-backend-vue3/lib/util.js");

function isBeingDestroyed(instance) {
  return instance._isBeingDestroyed || instance.isUnmounted;
}

exports.isBeingDestroyed = isBeingDestroyed;

function getAppRecord(instance) {
  if (instance.root) {
    return instance.appContext.app.__VUE_DEVTOOLS_APP_RECORD__;
  }
}

exports.getAppRecord = getAppRecord;

function isFragment(instance) {
  const appRecord = getAppRecord(instance);

  if (appRecord) {
    return appRecord.options.types.Fragment === instance.subTree.type;
  }
}

exports.isFragment = isFragment;
/**
 * Get the appropriate display name for an instance.
 *
 * @param {Vue} instance
 * @return {String}
 */

function getInstanceName(instance) {
  var _a, _b, _c;

  const name = getComponentTypeName(instance.type || {});
  if (name) return name;
  if (instance.root === instance) return 'Root';

  for (const key in (_b = (_a = instance.parent) === null || _a === void 0 ? void 0 : _a.type) === null || _b === void 0 ? void 0 : _b.components) {
    if (instance.parent.type.components[key] === instance.type) return saveComponentName(instance, key);
  }

  for (const key in (_c = instance.appContext) === null || _c === void 0 ? void 0 : _c.components) {
    if (instance.appContext.components[key] === instance.type) return saveComponentName(instance, key);
  }

  return 'Anonymous Component';
}

exports.getInstanceName = getInstanceName;

function saveComponentName(instance, key) {
  instance.type.__vdevtools_guessedName = key;
  return key;
}

function getComponentTypeName(options) {
  const name = options.name || options._componentTag || options.__vdevtools_guessedName;

  if (name) {
    return name;
  }

  const file = options.__file; // injected by vue-loader

  if (file) {
    return (0, shared_utils_1.classify)((0, util_1.basename)(file, '.vue'));
  }
}
/**
 * Returns a devtools unique id for instance.
 * @param {Vue} instance
 */


function getUniqueComponentId(instance, ctx) {
  const appId = instance.appContext.app.__VUE_DEVTOOLS_APP_RECORD_ID__;
  const instanceId = instance === instance.root ? 'root' : instance.uid;
  return `${appId}:${instanceId}`;
}

exports.getUniqueComponentId = getUniqueComponentId;

function getRenderKey(value) {
  if (value == null) return;
  const type = typeof value;

  if (type === 'number') {
    return value;
  } else if (type === 'string') {
    return `'${value}'`;
  } else if (Array.isArray(value)) {
    return 'Array';
  } else {
    return 'Object';
  }
}

exports.getRenderKey = getRenderKey;

function getComponentInstances(app) {
  const appRecord = app.__VUE_DEVTOOLS_APP_RECORD__;
  const appId = appRecord.id.toString();
  return [...appRecord.instanceMap].filter(([key]) => key.split(':')[0] === appId).map(([, instance]) => instance); // eslint-disable-line comma-spacing
}

exports.getComponentInstances = getComponentInstances;

/***/ }),

/***/ "../app-backend-vue3/lib/index.js":
/*!****************************************!*\
  !*** ../app-backend-vue3/lib/index.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.backend = void 0;

const app_backend_api_1 = __webpack_require__(/*! @vue-devtools/app-backend-api */ "../app-backend-api/lib/index.js");

const tree_1 = __webpack_require__(/*! ./components/tree */ "../app-backend-vue3/lib/components/tree.js");

const data_1 = __webpack_require__(/*! ./components/data */ "../app-backend-vue3/lib/components/data.js");

const util_1 = __webpack_require__(/*! ./components/util */ "../app-backend-vue3/lib/components/util.js");

const el_1 = __webpack_require__(/*! ./components/el */ "../app-backend-vue3/lib/components/el.js");

const shared_utils_1 = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js");

exports.backend = (0, app_backend_api_1.defineBackend)({
  frameworkVersion: 3,
  features: [],

  setup(api) {
    api.on.getAppRecordName(payload => {
      if (payload.app._component) {
        payload.name = payload.app._component.name;
      }
    });
    api.on.getAppRootInstance(payload => {
      var _a, _b, _c, _d;

      if (payload.app._instance) {
        payload.root = payload.app._instance;
      } else if ((_b = (_a = payload.app._container) === null || _a === void 0 ? void 0 : _a._vnode) === null || _b === void 0 ? void 0 : _b.component) {
        payload.root = (_d = (_c = payload.app._container) === null || _c === void 0 ? void 0 : _c._vnode) === null || _d === void 0 ? void 0 : _d.component;
      }
    });
    api.on.walkComponentTree(async (payload, ctx) => {
      const walker = new tree_1.ComponentWalker(payload.maxDepth, payload.filter, api, ctx);
      payload.componentTreeData = await walker.getComponentTree(payload.componentInstance);
    });
    api.on.walkComponentParents((payload, ctx) => {
      const walker = new tree_1.ComponentWalker(0, null, api, ctx);
      payload.parentInstances = walker.getComponentParents(payload.componentInstance);
    });
    api.on.inspectComponent((payload, ctx) => {
      // @TODO refactor
      shared_utils_1.backendInjections.getCustomInstanceDetails = data_1.getCustomInstanceDetails;
      shared_utils_1.backendInjections.instanceMap = ctx.currentAppRecord.instanceMap;

      shared_utils_1.backendInjections.isVueInstance = val => val._ && Object.keys(val._).includes('vnode');

      payload.instanceData = (0, data_1.getInstanceDetails)(payload.componentInstance, ctx);
    });
    api.on.getComponentName(payload => {
      payload.name = (0, util_1.getInstanceName)(payload.componentInstance);
    });
    api.on.getComponentBounds(payload => {
      payload.bounds = (0, el_1.getInstanceOrVnodeRect)(payload.componentInstance);
    });
    api.on.getElementComponent(payload => {
      payload.componentInstance = (0, el_1.getComponentInstanceFromElement)(payload.element);
    });
    api.on.getComponentInstances(payload => {
      payload.componentInstances = (0, util_1.getComponentInstances)(payload.app);
    });
    api.on.getComponentRootElements(payload => {
      payload.rootElements = (0, el_1.getRootElementsFromComponentInstance)(payload.componentInstance);
    });
    api.on.editComponentState((payload, ctx) => {
      (0, data_1.editState)(payload, api.stateEditor, ctx);
    });
    api.on.getComponentDevtoolsOptions(payload => {
      payload.options = payload.componentInstance.type.devtools;
    });
    api.on.getComponentRenderCode(payload => {
      payload.code = !(payload.componentInstance.type instanceof Function) ? payload.componentInstance.render.toString() : payload.componentInstance.type.toString();
    });
    api.on.transformCall(payload => {
      if (payload.callName === shared_utils_1.HookEvents.COMPONENT_UPDATED) {
        const component = payload.inArgs[0];
        payload.outArgs = [component.appContext.app, component.uid, component.parent ? component.parent.uid : undefined, component];
      }
    });

    api.stateEditor.isRef = value => !!value.__v_isRef;

    api.stateEditor.getRefValue = ref => ref.value;

    api.stateEditor.setRefValue = (ref, value) => {
      ref.value = value;
    };
  }

});

/***/ }),

/***/ "../app-backend-vue3/lib/util.js":
/*!***************************************!*\
  !*** ../app-backend-vue3/lib/util.js ***!
  \***************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.returnError = exports.basename = exports.flatten = void 0;

const path_1 = __importDefault(__webpack_require__(/*! path */ "../../node_modules/path-browserify/index.js"));

function flatten(items) {
  return items.reduce((acc, item) => {
    if (item instanceof Array) acc.push(...flatten(item));else if (item) acc.push(item);
    return acc;
  }, []);
}

exports.flatten = flatten; // Use a custom basename functions instead of the shimed version
// because it doesn't work on Windows

function basename(filename, ext) {
  return path_1.default.basename(filename.replace(/^[a-zA-Z]:/, '').replace(/\\/g, '/'), ext);
}

exports.basename = basename;

function returnError(cb) {
  try {
    return cb();
  } catch (e) {
    return e;
  }
}

exports.returnError = returnError;

/***/ }),

/***/ "../shared-utils/lib/backend.js":
/*!**************************************!*\
  !*** ../shared-utils/lib/backend.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


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

"use strict";


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

"use strict";


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

"use strict";


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

"use strict";


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

"use strict";


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

"use strict";


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

"use strict";


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

"use strict";


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

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));

/***/ }),

/***/ "../shared-utils/lib/storage.js":
/*!**************************************!*\
  !*** ../shared-utils/lib/storage.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


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

"use strict";


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

"use strict";


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

/***/ "../../node_modules/clone-deep/index.js":
/*!**********************************************!*\
  !*** ../../node_modules/clone-deep/index.js ***!
  \**********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


/**
 * Module dependenices
 */

const clone = __webpack_require__(/*! shallow-clone */ "../../node_modules/shallow-clone/index.js");
const typeOf = __webpack_require__(/*! kind-of */ "../../node_modules/kind-of/index.js");
const isPlainObject = __webpack_require__(/*! is-plain-object */ "../../node_modules/clone-deep/node_modules/is-plain-object/index.js");

function cloneDeep(val, instanceClone) {
  switch (typeOf(val)) {
    case 'object':
      return cloneObjectDeep(val, instanceClone);
    case 'array':
      return cloneArrayDeep(val, instanceClone);
    default: {
      return clone(val);
    }
  }
}

function cloneObjectDeep(val, instanceClone) {
  if (typeof instanceClone === 'function') {
    return instanceClone(val);
  }
  if (instanceClone || isPlainObject(val)) {
    const res = new val.constructor();
    for (let key in val) {
      res[key] = cloneDeep(val[key], instanceClone);
    }
    return res;
  }
  return val;
}

function cloneArrayDeep(val, instanceClone) {
  const res = new val.constructor(val.length);
  for (let i = 0; i < val.length; i++) {
    res[i] = cloneDeep(val[i], instanceClone);
  }
  return res;
}

/**
 * Expose `cloneDeep`
 */

module.exports = cloneDeep;


/***/ }),

/***/ "../../node_modules/clone-deep/node_modules/is-plain-object/index.js":
/*!***************************************************************************!*\
  !*** ../../node_modules/clone-deep/node_modules/is-plain-object/index.js ***!
  \***************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/*!
 * is-plain-object <https://github.com/jonschlinkert/is-plain-object>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */



var isObject = __webpack_require__(/*! isobject */ "../../node_modules/isobject/index.js");

function isObjectObject(o) {
  return isObject(o) === true
    && Object.prototype.toString.call(o) === '[object Object]';
}

module.exports = function isPlainObject(o) {
  var ctor,prot;

  if (isObjectObject(o) === false) return false;

  // If has modified constructor
  ctor = o.constructor;
  if (typeof ctor !== 'function') return false;

  // If has modified prototype
  prot = ctor.prototype;
  if (isObjectObject(prot) === false) return false;

  // If constructor does not have an Object-specific method
  if (prot.hasOwnProperty('isPrototypeOf') === false) {
    return false;
  }

  // Most likely a plain Object
  return true;
};


/***/ }),

/***/ "../../node_modules/events/events.js":
/*!*******************************************!*\
  !*** ../../node_modules/events/events.js ***!
  \*******************************************/
/***/ ((module) => {

"use strict";
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

/***/ "../../node_modules/isobject/index.js":
/*!********************************************!*\
  !*** ../../node_modules/isobject/index.js ***!
  \********************************************/
/***/ ((module) => {

"use strict";
/*!
 * isobject <https://github.com/jonschlinkert/isobject>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */



module.exports = function isObject(val) {
  return val != null && typeof val === 'object' && Array.isArray(val) === false;
};


/***/ }),

/***/ "../../node_modules/kind-of/index.js":
/*!*******************************************!*\
  !*** ../../node_modules/kind-of/index.js ***!
  \*******************************************/
/***/ ((module) => {

var toString = Object.prototype.toString;

module.exports = function kindOf(val) {
  if (val === void 0) return 'undefined';
  if (val === null) return 'null';

  var type = typeof val;
  if (type === 'boolean') return 'boolean';
  if (type === 'string') return 'string';
  if (type === 'number') return 'number';
  if (type === 'symbol') return 'symbol';
  if (type === 'function') {
    return isGeneratorFn(val) ? 'generatorfunction' : 'function';
  }

  if (isArray(val)) return 'array';
  if (isBuffer(val)) return 'buffer';
  if (isArguments(val)) return 'arguments';
  if (isDate(val)) return 'date';
  if (isError(val)) return 'error';
  if (isRegexp(val)) return 'regexp';

  switch (ctorName(val)) {
    case 'Symbol': return 'symbol';
    case 'Promise': return 'promise';

    // Set, Map, WeakSet, WeakMap
    case 'WeakMap': return 'weakmap';
    case 'WeakSet': return 'weakset';
    case 'Map': return 'map';
    case 'Set': return 'set';

    // 8-bit typed arrays
    case 'Int8Array': return 'int8array';
    case 'Uint8Array': return 'uint8array';
    case 'Uint8ClampedArray': return 'uint8clampedarray';

    // 16-bit typed arrays
    case 'Int16Array': return 'int16array';
    case 'Uint16Array': return 'uint16array';

    // 32-bit typed arrays
    case 'Int32Array': return 'int32array';
    case 'Uint32Array': return 'uint32array';
    case 'Float32Array': return 'float32array';
    case 'Float64Array': return 'float64array';
  }

  if (isGeneratorObj(val)) {
    return 'generator';
  }

  // Non-plain objects
  type = toString.call(val);
  switch (type) {
    case '[object Object]': return 'object';
    // iterators
    case '[object Map Iterator]': return 'mapiterator';
    case '[object Set Iterator]': return 'setiterator';
    case '[object String Iterator]': return 'stringiterator';
    case '[object Array Iterator]': return 'arrayiterator';
  }

  // other
  return type.slice(8, -1).toLowerCase().replace(/\s/g, '');
};

function ctorName(val) {
  return typeof val.constructor === 'function' ? val.constructor.name : null;
}

function isArray(val) {
  if (Array.isArray) return Array.isArray(val);
  return val instanceof Array;
}

function isError(val) {
  return val instanceof Error || (typeof val.message === 'string' && val.constructor && typeof val.constructor.stackTraceLimit === 'number');
}

function isDate(val) {
  if (val instanceof Date) return true;
  return typeof val.toDateString === 'function'
    && typeof val.getDate === 'function'
    && typeof val.setDate === 'function';
}

function isRegexp(val) {
  if (val instanceof RegExp) return true;
  return typeof val.flags === 'string'
    && typeof val.ignoreCase === 'boolean'
    && typeof val.multiline === 'boolean'
    && typeof val.global === 'boolean';
}

function isGeneratorFn(name, val) {
  return ctorName(name) === 'GeneratorFunction';
}

function isGeneratorObj(val) {
  return typeof val.throw === 'function'
    && typeof val.return === 'function'
    && typeof val.next === 'function';
}

function isArguments(val) {
  try {
    if (typeof val.length === 'number' && typeof val.callee === 'function') {
      return true;
    }
  } catch (err) {
    if (err.message.indexOf('callee') !== -1) {
      return true;
    }
  }
  return false;
}

/**
 * If you need to support Safari 5-7 (8-10 yr-old browser),
 * take a look at https://github.com/feross/is-buffer
 */

function isBuffer(val) {
  if (val.constructor && typeof val.constructor.isBuffer === 'function') {
    return val.constructor.isBuffer(val);
  }
  return false;
}


/***/ }),

/***/ "../../node_modules/lodash/_Symbol.js":
/*!********************************************!*\
  !*** ../../node_modules/lodash/_Symbol.js ***!
  \********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var root = __webpack_require__(/*! ./_root */ "../../node_modules/lodash/_root.js");

/** Built-in value references. */
var Symbol = root.Symbol;

module.exports = Symbol;


/***/ }),

/***/ "../../node_modules/lodash/_baseGetTag.js":
/*!************************************************!*\
  !*** ../../node_modules/lodash/_baseGetTag.js ***!
  \************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var Symbol = __webpack_require__(/*! ./_Symbol */ "../../node_modules/lodash/_Symbol.js"),
    getRawTag = __webpack_require__(/*! ./_getRawTag */ "../../node_modules/lodash/_getRawTag.js"),
    objectToString = __webpack_require__(/*! ./_objectToString */ "../../node_modules/lodash/_objectToString.js");

/** `Object#toString` result references. */
var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag && symToStringTag in Object(value))
    ? getRawTag(value)
    : objectToString(value);
}

module.exports = baseGetTag;


/***/ }),

/***/ "../../node_modules/lodash/_baseTrim.js":
/*!**********************************************!*\
  !*** ../../node_modules/lodash/_baseTrim.js ***!
  \**********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var trimmedEndIndex = __webpack_require__(/*! ./_trimmedEndIndex */ "../../node_modules/lodash/_trimmedEndIndex.js");

/** Used to match leading whitespace. */
var reTrimStart = /^\s+/;

/**
 * The base implementation of `_.trim`.
 *
 * @private
 * @param {string} string The string to trim.
 * @returns {string} Returns the trimmed string.
 */
function baseTrim(string) {
  return string
    ? string.slice(0, trimmedEndIndex(string) + 1).replace(reTrimStart, '')
    : string;
}

module.exports = baseTrim;


/***/ }),

/***/ "../../node_modules/lodash/_freeGlobal.js":
/*!************************************************!*\
  !*** ../../node_modules/lodash/_freeGlobal.js ***!
  \************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof __webpack_require__.g == 'object' && __webpack_require__.g && __webpack_require__.g.Object === Object && __webpack_require__.g;

module.exports = freeGlobal;


/***/ }),

/***/ "../../node_modules/lodash/_getRawTag.js":
/*!***********************************************!*\
  !*** ../../node_modules/lodash/_getRawTag.js ***!
  \***********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var Symbol = __webpack_require__(/*! ./_Symbol */ "../../node_modules/lodash/_Symbol.js");

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Built-in value references. */
var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

module.exports = getRawTag;


/***/ }),

/***/ "../../node_modules/lodash/_objectToString.js":
/*!****************************************************!*\
  !*** ../../node_modules/lodash/_objectToString.js ***!
  \****************************************************/
/***/ ((module) => {

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString.call(value);
}

module.exports = objectToString;


/***/ }),

/***/ "../../node_modules/lodash/_root.js":
/*!******************************************!*\
  !*** ../../node_modules/lodash/_root.js ***!
  \******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var freeGlobal = __webpack_require__(/*! ./_freeGlobal */ "../../node_modules/lodash/_freeGlobal.js");

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

module.exports = root;


/***/ }),

/***/ "../../node_modules/lodash/_trimmedEndIndex.js":
/*!*****************************************************!*\
  !*** ../../node_modules/lodash/_trimmedEndIndex.js ***!
  \*****************************************************/
/***/ ((module) => {

/** Used to match a single whitespace character. */
var reWhitespace = /\s/;

/**
 * Used by `_.trim` and `_.trimEnd` to get the index of the last non-whitespace
 * character of `string`.
 *
 * @private
 * @param {string} string The string to inspect.
 * @returns {number} Returns the index of the last non-whitespace character.
 */
function trimmedEndIndex(string) {
  var index = string.length;

  while (index-- && reWhitespace.test(string.charAt(index))) {}
  return index;
}

module.exports = trimmedEndIndex;


/***/ }),

/***/ "../../node_modules/lodash/debounce.js":
/*!*********************************************!*\
  !*** ../../node_modules/lodash/debounce.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isObject = __webpack_require__(/*! ./isObject */ "../../node_modules/lodash/isObject.js"),
    now = __webpack_require__(/*! ./now */ "../../node_modules/lodash/now.js"),
    toNumber = __webpack_require__(/*! ./toNumber */ "../../node_modules/lodash/toNumber.js");

/** Error message constants. */
var FUNC_ERROR_TEXT = 'Expected a function';

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max,
    nativeMin = Math.min;

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked. The debounced function comes with a `cancel` method to cancel
 * delayed `func` invocations and a `flush` method to immediately invoke them.
 * Provide `options` to indicate whether `func` should be invoked on the
 * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
 * with the last arguments provided to the debounced function. Subsequent
 * calls to the debounced function return the result of the last `func`
 * invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the debounced function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until to the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `_.debounce` and `_.throttle`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to debounce.
 * @param {number} [wait=0] The number of milliseconds to delay.
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=false]
 *  Specify invoking on the leading edge of the timeout.
 * @param {number} [options.maxWait]
 *  The maximum time `func` is allowed to be delayed before it's invoked.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // Avoid costly calculations while the window size is in flux.
 * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
 *
 * // Invoke `sendMail` when clicked, debouncing subsequent calls.
 * jQuery(element).on('click', _.debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * }));
 *
 * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
 * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
 * var source = new EventSource('/stream');
 * jQuery(source).on('message', debounced);
 *
 * // Cancel the trailing debounced invocation.
 * jQuery(window).on('popstate', debounced.cancel);
 */
function debounce(func, wait, options) {
  var lastArgs,
      lastThis,
      maxWait,
      result,
      timerId,
      lastCallTime,
      lastInvokeTime = 0,
      leading = false,
      maxing = false,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  wait = toNumber(wait) || 0;
  if (isObject(options)) {
    leading = !!options.leading;
    maxing = 'maxWait' in options;
    maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  function invokeFunc(time) {
    var args = lastArgs,
        thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time) {
    // Reset any `maxWait` timer.
    lastInvokeTime = time;
    // Start the timer for the trailing edge.
    timerId = setTimeout(timerExpired, wait);
    // Invoke the leading edge.
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime,
        timeWaiting = wait - timeSinceLastCall;

    return maxing
      ? nativeMin(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime;

    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
      (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
  }

  function timerExpired() {
    var time = now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    // Restart the timer.
    timerId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timerId = undefined;

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = undefined;
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(now());
  }

  function debounced() {
    var time = now(),
        isInvoking = shouldInvoke(time);

    lastArgs = arguments;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        // Handle invocations in a tight loop.
        clearTimeout(timerId);
        timerId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, wait);
    }
    return result;
  }
  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced;
}

module.exports = debounce;


/***/ }),

/***/ "../../node_modules/lodash/isObject.js":
/*!*********************************************!*\
  !*** ../../node_modules/lodash/isObject.js ***!
  \*********************************************/
/***/ ((module) => {

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

module.exports = isObject;


/***/ }),

/***/ "../../node_modules/lodash/isObjectLike.js":
/*!*************************************************!*\
  !*** ../../node_modules/lodash/isObjectLike.js ***!
  \*************************************************/
/***/ ((module) => {

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

module.exports = isObjectLike;


/***/ }),

/***/ "../../node_modules/lodash/isSymbol.js":
/*!*********************************************!*\
  !*** ../../node_modules/lodash/isSymbol.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseGetTag = __webpack_require__(/*! ./_baseGetTag */ "../../node_modules/lodash/_baseGetTag.js"),
    isObjectLike = __webpack_require__(/*! ./isObjectLike */ "../../node_modules/lodash/isObjectLike.js");

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && baseGetTag(value) == symbolTag);
}

module.exports = isSymbol;


/***/ }),

/***/ "../../node_modules/lodash/now.js":
/*!****************************************!*\
  !*** ../../node_modules/lodash/now.js ***!
  \****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var root = __webpack_require__(/*! ./_root */ "../../node_modules/lodash/_root.js");

/**
 * Gets the timestamp of the number of milliseconds that have elapsed since
 * the Unix epoch (1 January 1970 00:00:00 UTC).
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Date
 * @returns {number} Returns the timestamp.
 * @example
 *
 * _.defer(function(stamp) {
 *   console.log(_.now() - stamp);
 * }, _.now());
 * // => Logs the number of milliseconds it took for the deferred invocation.
 */
var now = function() {
  return root.Date.now();
};

module.exports = now;


/***/ }),

/***/ "../../node_modules/lodash/toNumber.js":
/*!*********************************************!*\
  !*** ../../node_modules/lodash/toNumber.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseTrim = __webpack_require__(/*! ./_baseTrim */ "../../node_modules/lodash/_baseTrim.js"),
    isObject = __webpack_require__(/*! ./isObject */ "../../node_modules/lodash/isObject.js"),
    isSymbol = __webpack_require__(/*! ./isSymbol */ "../../node_modules/lodash/isSymbol.js");

/** Used as references for various `Number` constants. */
var NAN = 0 / 0;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol(value)) {
    return NAN;
  }
  if (isObject(value)) {
    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
    value = isObject(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = baseTrim(value);
  var isBinary = reIsBinary.test(value);
  return (isBinary || reIsOctal.test(value))
    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex.test(value) ? NAN : +value);
}

module.exports = toNumber;


/***/ }),

/***/ "../../node_modules/path-browserify/index.js":
/*!***************************************************!*\
  !*** ../../node_modules/path-browserify/index.js ***!
  \***************************************************/
/***/ ((module) => {

"use strict";
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


/***/ }),

/***/ "../../node_modules/shallow-clone/index.js":
/*!*************************************************!*\
  !*** ../../node_modules/shallow-clone/index.js ***!
  \*************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/*!
 * shallow-clone <https://github.com/jonschlinkert/shallow-clone>
 *
 * Copyright (c) 2015-present, Jon Schlinkert.
 * Released under the MIT License.
 */



const valueOf = Symbol.prototype.valueOf;
const typeOf = __webpack_require__(/*! kind-of */ "../../node_modules/kind-of/index.js");

function clone(val, deep) {
  switch (typeOf(val)) {
    case 'array':
      return val.slice();
    case 'object':
      return Object.assign({}, val);
    case 'date':
      return new val.constructor(Number(val));
    case 'map':
      return new Map(val);
    case 'set':
      return new Set(val);
    case 'buffer':
      return cloneBuffer(val);
    case 'symbol':
      return cloneSymbol(val);
    case 'arraybuffer':
      return cloneArrayBuffer(val);
    case 'float32array':
    case 'float64array':
    case 'int16array':
    case 'int32array':
    case 'int8array':
    case 'uint16array':
    case 'uint32array':
    case 'uint8clampedarray':
    case 'uint8array':
      return cloneTypedArray(val);
    case 'regexp':
      return cloneRegExp(val);
    case 'error':
      return Object.create(val);
    default: {
      return val;
    }
  }
}

function cloneRegExp(val) {
  const flags = val.flags !== void 0 ? val.flags : (/\w+$/.exec(val) || void 0);
  const re = new val.constructor(val.source, flags);
  re.lastIndex = val.lastIndex;
  return re;
}

function cloneArrayBuffer(val) {
  const res = new val.constructor(val.byteLength);
  new Uint8Array(res).set(new Uint8Array(val));
  return res;
}

function cloneTypedArray(val, deep) {
  return new val.constructor(val.buffer, val.byteOffset, val.length);
}

function cloneBuffer(val) {
  const len = val.length;
  const buf = Buffer.allocUnsafe ? Buffer.allocUnsafe(len) : Buffer.from(len);
  val.copy(buf);
  return buf;
}

function cloneSymbol(val) {
  return valueOf ? Object(valueOf.call(val)) : {};
}

/**
 * Expose `clone`
 */

module.exports = clone;


/***/ }),

/***/ "../../node_modules/speakingurl/index.js":
/*!***********************************************!*\
  !*** ../../node_modules/speakingurl/index.js ***!
  \***********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(/*! ./lib/speakingurl */ "../../node_modules/speakingurl/lib/speakingurl.js");


/***/ }),

/***/ "../../node_modules/speakingurl/lib/speakingurl.js":
/*!*********************************************************!*\
  !*** ../../node_modules/speakingurl/lib/speakingurl.js ***!
  \*********************************************************/
/***/ (function(module, exports) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root) {
    'use strict';

    /**
     * charMap
     * @type {Object}
     */
    var charMap = {

        // latin
        'À': 'A',
        'Á': 'A',
        'Â': 'A',
        'Ã': 'A',
        'Ä': 'Ae',
        'Å': 'A',
        'Æ': 'AE',
        'Ç': 'C',
        'È': 'E',
        'É': 'E',
        'Ê': 'E',
        'Ë': 'E',
        'Ì': 'I',
        'Í': 'I',
        'Î': 'I',
        'Ï': 'I',
        'Ð': 'D',
        'Ñ': 'N',
        'Ò': 'O',
        'Ó': 'O',
        'Ô': 'O',
        'Õ': 'O',
        'Ö': 'Oe',
        'Ő': 'O',
        'Ø': 'O',
        'Ù': 'U',
        'Ú': 'U',
        'Û': 'U',
        'Ü': 'Ue',
        'Ű': 'U',
        'Ý': 'Y',
        'Þ': 'TH',
        'ß': 'ss',
        'à': 'a',
        'á': 'a',
        'â': 'a',
        'ã': 'a',
        'ä': 'ae',
        'å': 'a',
        'æ': 'ae',
        'ç': 'c',
        'è': 'e',
        'é': 'e',
        'ê': 'e',
        'ë': 'e',
        'ì': 'i',
        'í': 'i',
        'î': 'i',
        'ï': 'i',
        'ð': 'd',
        'ñ': 'n',
        'ò': 'o',
        'ó': 'o',
        'ô': 'o',
        'õ': 'o',
        'ö': 'oe',
        'ő': 'o',
        'ø': 'o',
        'ù': 'u',
        'ú': 'u',
        'û': 'u',
        'ü': 'ue',
        'ű': 'u',
        'ý': 'y',
        'þ': 'th',
        'ÿ': 'y',
        'ẞ': 'SS',

        // language specific

        // Arabic
        'ا': 'a',
        'أ': 'a',
        'إ': 'i',
        'آ': 'aa',
        'ؤ': 'u',
        'ئ': 'e',
        'ء': 'a',
        'ب': 'b',
        'ت': 't',
        'ث': 'th',
        'ج': 'j',
        'ح': 'h',
        'خ': 'kh',
        'د': 'd',
        'ذ': 'th',
        'ر': 'r',
        'ز': 'z',
        'س': 's',
        'ش': 'sh',
        'ص': 's',
        'ض': 'dh',
        'ط': 't',
        'ظ': 'z',
        'ع': 'a',
        'غ': 'gh',
        'ف': 'f',
        'ق': 'q',
        'ك': 'k',
        'ل': 'l',
        'م': 'm',
        'ن': 'n',
        'ه': 'h',
        'و': 'w',
        'ي': 'y',
        'ى': 'a',
        'ة': 'h',
        'ﻻ': 'la',
        'ﻷ': 'laa',
        'ﻹ': 'lai',
        'ﻵ': 'laa',

        // Persian additional characters than Arabic
        'گ': 'g',
        'چ': 'ch',
        'پ': 'p',
        'ژ': 'zh',
        'ک': 'k',
        'ی': 'y',

        // Arabic diactrics
        'َ': 'a',
        'ً': 'an',
        'ِ': 'e',
        'ٍ': 'en',
        'ُ': 'u',
        'ٌ': 'on',
        'ْ': '',

        // Arabic numbers
        '٠': '0',
        '١': '1',
        '٢': '2',
        '٣': '3',
        '٤': '4',
        '٥': '5',
        '٦': '6',
        '٧': '7',
        '٨': '8',
        '٩': '9',

        // Persian numbers
        '۰': '0',
        '۱': '1',
        '۲': '2',
        '۳': '3',
        '۴': '4',
        '۵': '5',
        '۶': '6',
        '۷': '7',
        '۸': '8',
        '۹': '9',

        // Burmese consonants
        'က': 'k',
        'ခ': 'kh',
        'ဂ': 'g',
        'ဃ': 'ga',
        'င': 'ng',
        'စ': 's',
        'ဆ': 'sa',
        'ဇ': 'z',
        'စျ': 'za',
        'ည': 'ny',
        'ဋ': 't',
        'ဌ': 'ta',
        'ဍ': 'd',
        'ဎ': 'da',
        'ဏ': 'na',
        'တ': 't',
        'ထ': 'ta',
        'ဒ': 'd',
        'ဓ': 'da',
        'န': 'n',
        'ပ': 'p',
        'ဖ': 'pa',
        'ဗ': 'b',
        'ဘ': 'ba',
        'မ': 'm',
        'ယ': 'y',
        'ရ': 'ya',
        'လ': 'l',
        'ဝ': 'w',
        'သ': 'th',
        'ဟ': 'h',
        'ဠ': 'la',
        'အ': 'a',
        // consonant character combos
        'ြ': 'y',
        'ျ': 'ya',
        'ွ': 'w',
        'ြွ': 'yw',
        'ျွ': 'ywa',
        'ှ': 'h',
        // independent vowels
        'ဧ': 'e',
        '၏': '-e',
        'ဣ': 'i',
        'ဤ': '-i',
        'ဉ': 'u',
        'ဦ': '-u',
        'ဩ': 'aw',
        'သြော': 'aw',
        'ဪ': 'aw',
        // numbers
        '၀': '0',
        '၁': '1',
        '၂': '2',
        '၃': '3',
        '၄': '4',
        '၅': '5',
        '၆': '6',
        '၇': '7',
        '၈': '8',
        '၉': '9',
        // virama and tone marks which are silent in transliteration
        '္': '',
        '့': '',
        'း': '',

        // Czech
        'č': 'c',
        'ď': 'd',
        'ě': 'e',
        'ň': 'n',
        'ř': 'r',
        'š': 's',
        'ť': 't',
        'ů': 'u',
        'ž': 'z',
        'Č': 'C',
        'Ď': 'D',
        'Ě': 'E',
        'Ň': 'N',
        'Ř': 'R',
        'Š': 'S',
        'Ť': 'T',
        'Ů': 'U',
        'Ž': 'Z',

        // Dhivehi
        'ހ': 'h',
        'ށ': 'sh',
        'ނ': 'n',
        'ރ': 'r',
        'ބ': 'b',
        'ޅ': 'lh',
        'ކ': 'k',
        'އ': 'a',
        'ވ': 'v',
        'މ': 'm',
        'ފ': 'f',
        'ދ': 'dh',
        'ތ': 'th',
        'ލ': 'l',
        'ގ': 'g',
        'ޏ': 'gn',
        'ސ': 's',
        'ޑ': 'd',
        'ޒ': 'z',
        'ޓ': 't',
        'ޔ': 'y',
        'ޕ': 'p',
        'ޖ': 'j',
        'ޗ': 'ch',
        'ޘ': 'tt',
        'ޙ': 'hh',
        'ޚ': 'kh',
        'ޛ': 'th',
        'ޜ': 'z',
        'ޝ': 'sh',
        'ޞ': 's',
        'ޟ': 'd',
        'ޠ': 't',
        'ޡ': 'z',
        'ޢ': 'a',
        'ޣ': 'gh',
        'ޤ': 'q',
        'ޥ': 'w',
        'ަ': 'a',
        'ާ': 'aa',
        'ި': 'i',
        'ީ': 'ee',
        'ު': 'u',
        'ޫ': 'oo',
        'ެ': 'e',
        'ޭ': 'ey',
        'ޮ': 'o',
        'ޯ': 'oa',
        'ް': '',

        // Georgian https://en.wikipedia.org/wiki/Romanization_of_Georgian
        // National system (2002)
        'ა': 'a',
        'ბ': 'b',
        'გ': 'g',
        'დ': 'd',
        'ე': 'e',
        'ვ': 'v',
        'ზ': 'z',
        'თ': 't',
        'ი': 'i',
        'კ': 'k',
        'ლ': 'l',
        'მ': 'm',
        'ნ': 'n',
        'ო': 'o',
        'პ': 'p',
        'ჟ': 'zh',
        'რ': 'r',
        'ს': 's',
        'ტ': 't',
        'უ': 'u',
        'ფ': 'p',
        'ქ': 'k',
        'ღ': 'gh',
        'ყ': 'q',
        'შ': 'sh',
        'ჩ': 'ch',
        'ც': 'ts',
        'ძ': 'dz',
        'წ': 'ts',
        'ჭ': 'ch',
        'ხ': 'kh',
        'ჯ': 'j',
        'ჰ': 'h',

        // Greek
        'α': 'a',
        'β': 'v',
        'γ': 'g',
        'δ': 'd',
        'ε': 'e',
        'ζ': 'z',
        'η': 'i',
        'θ': 'th',
        'ι': 'i',
        'κ': 'k',
        'λ': 'l',
        'μ': 'm',
        'ν': 'n',
        'ξ': 'ks',
        'ο': 'o',
        'π': 'p',
        'ρ': 'r',
        'σ': 's',
        'τ': 't',
        'υ': 'y',
        'φ': 'f',
        'χ': 'x',
        'ψ': 'ps',
        'ω': 'o',
        'ά': 'a',
        'έ': 'e',
        'ί': 'i',
        'ό': 'o',
        'ύ': 'y',
        'ή': 'i',
        'ώ': 'o',
        'ς': 's',
        'ϊ': 'i',
        'ΰ': 'y',
        'ϋ': 'y',
        'ΐ': 'i',
        'Α': 'A',
        'Β': 'B',
        'Γ': 'G',
        'Δ': 'D',
        'Ε': 'E',
        'Ζ': 'Z',
        'Η': 'I',
        'Θ': 'TH',
        'Ι': 'I',
        'Κ': 'K',
        'Λ': 'L',
        'Μ': 'M',
        'Ν': 'N',
        'Ξ': 'KS',
        'Ο': 'O',
        'Π': 'P',
        'Ρ': 'R',
        'Σ': 'S',
        'Τ': 'T',
        'Υ': 'Y',
        'Φ': 'F',
        'Χ': 'X',
        'Ψ': 'PS',
        'Ω': 'O',
        'Ά': 'A',
        'Έ': 'E',
        'Ί': 'I',
        'Ό': 'O',
        'Ύ': 'Y',
        'Ή': 'I',
        'Ώ': 'O',
        'Ϊ': 'I',
        'Ϋ': 'Y',

        // Latvian
        'ā': 'a',
        // 'č': 'c', // duplicate
        'ē': 'e',
        'ģ': 'g',
        'ī': 'i',
        'ķ': 'k',
        'ļ': 'l',
        'ņ': 'n',
        // 'š': 's', // duplicate
        'ū': 'u',
        // 'ž': 'z', // duplicate
        'Ā': 'A',
        // 'Č': 'C', // duplicate
        'Ē': 'E',
        'Ģ': 'G',
        'Ī': 'I',
        'Ķ': 'k',
        'Ļ': 'L',
        'Ņ': 'N',
        // 'Š': 'S', // duplicate
        'Ū': 'U',
        // 'Ž': 'Z', // duplicate

        // Macedonian
        'Ќ': 'Kj',
        'ќ': 'kj',
        'Љ': 'Lj',
        'љ': 'lj',
        'Њ': 'Nj',
        'њ': 'nj',
        'Тс': 'Ts',
        'тс': 'ts',

        // Polish
        'ą': 'a',
        'ć': 'c',
        'ę': 'e',
        'ł': 'l',
        'ń': 'n',
        // 'ó': 'o', // duplicate
        'ś': 's',
        'ź': 'z',
        'ż': 'z',
        'Ą': 'A',
        'Ć': 'C',
        'Ę': 'E',
        'Ł': 'L',
        'Ń': 'N',
        'Ś': 'S',
        'Ź': 'Z',
        'Ż': 'Z',

        // Ukranian
        'Є': 'Ye',
        'І': 'I',
        'Ї': 'Yi',
        'Ґ': 'G',
        'є': 'ye',
        'і': 'i',
        'ї': 'yi',
        'ґ': 'g',

        // Romanian
        'ă': 'a',
        'Ă': 'A',
        'ș': 's',
        'Ș': 'S',
        // 'ş': 's', // duplicate
        // 'Ş': 'S', // duplicate
        'ț': 't',
        'Ț': 'T',
        'ţ': 't',
        'Ţ': 'T',

        // Russian https://en.wikipedia.org/wiki/Romanization_of_Russian
        // ICAO

        'а': 'a',
        'б': 'b',
        'в': 'v',
        'г': 'g',
        'д': 'd',
        'е': 'e',
        'ё': 'yo',
        'ж': 'zh',
        'з': 'z',
        'и': 'i',
        'й': 'i',
        'к': 'k',
        'л': 'l',
        'м': 'm',
        'н': 'n',
        'о': 'o',
        'п': 'p',
        'р': 'r',
        'с': 's',
        'т': 't',
        'у': 'u',
        'ф': 'f',
        'х': 'kh',
        'ц': 'c',
        'ч': 'ch',
        'ш': 'sh',
        'щ': 'sh',
        'ъ': '',
        'ы': 'y',
        'ь': '',
        'э': 'e',
        'ю': 'yu',
        'я': 'ya',
        'А': 'A',
        'Б': 'B',
        'В': 'V',
        'Г': 'G',
        'Д': 'D',
        'Е': 'E',
        'Ё': 'Yo',
        'Ж': 'Zh',
        'З': 'Z',
        'И': 'I',
        'Й': 'I',
        'К': 'K',
        'Л': 'L',
        'М': 'M',
        'Н': 'N',
        'О': 'O',
        'П': 'P',
        'Р': 'R',
        'С': 'S',
        'Т': 'T',
        'У': 'U',
        'Ф': 'F',
        'Х': 'Kh',
        'Ц': 'C',
        'Ч': 'Ch',
        'Ш': 'Sh',
        'Щ': 'Sh',
        'Ъ': '',
        'Ы': 'Y',
        'Ь': '',
        'Э': 'E',
        'Ю': 'Yu',
        'Я': 'Ya',

        // Serbian
        'ђ': 'dj',
        'ј': 'j',
        // 'љ': 'lj',  // duplicate
        // 'њ': 'nj', // duplicate
        'ћ': 'c',
        'џ': 'dz',
        'Ђ': 'Dj',
        'Ј': 'j',
        // 'Љ': 'Lj', // duplicate
        // 'Њ': 'Nj', // duplicate
        'Ћ': 'C',
        'Џ': 'Dz',

        // Slovak
        'ľ': 'l',
        'ĺ': 'l',
        'ŕ': 'r',
        'Ľ': 'L',
        'Ĺ': 'L',
        'Ŕ': 'R',

        // Turkish
        'ş': 's',
        'Ş': 'S',
        'ı': 'i',
        'İ': 'I',
        // 'ç': 'c', // duplicate
        // 'Ç': 'C', // duplicate
        // 'ü': 'u', // duplicate, see langCharMap
        // 'Ü': 'U', // duplicate, see langCharMap
        // 'ö': 'o', // duplicate, see langCharMap
        // 'Ö': 'O', // duplicate, see langCharMap
        'ğ': 'g',
        'Ğ': 'G',

        // Vietnamese
        'ả': 'a',
        'Ả': 'A',
        'ẳ': 'a',
        'Ẳ': 'A',
        'ẩ': 'a',
        'Ẩ': 'A',
        'đ': 'd',
        'Đ': 'D',
        'ẹ': 'e',
        'Ẹ': 'E',
        'ẽ': 'e',
        'Ẽ': 'E',
        'ẻ': 'e',
        'Ẻ': 'E',
        'ế': 'e',
        'Ế': 'E',
        'ề': 'e',
        'Ề': 'E',
        'ệ': 'e',
        'Ệ': 'E',
        'ễ': 'e',
        'Ễ': 'E',
        'ể': 'e',
        'Ể': 'E',
        'ỏ': 'o',
        'ọ': 'o',
        'Ọ': 'o',
        'ố': 'o',
        'Ố': 'O',
        'ồ': 'o',
        'Ồ': 'O',
        'ổ': 'o',
        'Ổ': 'O',
        'ộ': 'o',
        'Ộ': 'O',
        'ỗ': 'o',
        'Ỗ': 'O',
        'ơ': 'o',
        'Ơ': 'O',
        'ớ': 'o',
        'Ớ': 'O',
        'ờ': 'o',
        'Ờ': 'O',
        'ợ': 'o',
        'Ợ': 'O',
        'ỡ': 'o',
        'Ỡ': 'O',
        'Ở': 'o',
        'ở': 'o',
        'ị': 'i',
        'Ị': 'I',
        'ĩ': 'i',
        'Ĩ': 'I',
        'ỉ': 'i',
        'Ỉ': 'i',
        'ủ': 'u',
        'Ủ': 'U',
        'ụ': 'u',
        'Ụ': 'U',
        'ũ': 'u',
        'Ũ': 'U',
        'ư': 'u',
        'Ư': 'U',
        'ứ': 'u',
        'Ứ': 'U',
        'ừ': 'u',
        'Ừ': 'U',
        'ự': 'u',
        'Ự': 'U',
        'ữ': 'u',
        'Ữ': 'U',
        'ử': 'u',
        'Ử': 'ư',
        'ỷ': 'y',
        'Ỷ': 'y',
        'ỳ': 'y',
        'Ỳ': 'Y',
        'ỵ': 'y',
        'Ỵ': 'Y',
        'ỹ': 'y',
        'Ỹ': 'Y',
        'ạ': 'a',
        'Ạ': 'A',
        'ấ': 'a',
        'Ấ': 'A',
        'ầ': 'a',
        'Ầ': 'A',
        'ậ': 'a',
        'Ậ': 'A',
        'ẫ': 'a',
        'Ẫ': 'A',
        // 'ă': 'a', // duplicate
        // 'Ă': 'A', // duplicate
        'ắ': 'a',
        'Ắ': 'A',
        'ằ': 'a',
        'Ằ': 'A',
        'ặ': 'a',
        'Ặ': 'A',
        'ẵ': 'a',
        'Ẵ': 'A',
        "⓪": "0",
        "①": "1",
        "②": "2",
        "③": "3",
        "④": "4",
        "⑤": "5",
        "⑥": "6",
        "⑦": "7",
        "⑧": "8",
        "⑨": "9",
        "⑩": "10",
        "⑪": "11",
        "⑫": "12",
        "⑬": "13",
        "⑭": "14",
        "⑮": "15",
        "⑯": "16",
        "⑰": "17",
        "⑱": "18",
        "⑲": "18",
        "⑳": "18",

        "⓵": "1",
        "⓶": "2",
        "⓷": "3",
        "⓸": "4",
        "⓹": "5",
        "⓺": "6",
        "⓻": "7",
        "⓼": "8",
        "⓽": "9",
        "⓾": "10",

        "⓿": "0",
        "⓫": "11",
        "⓬": "12",
        "⓭": "13",
        "⓮": "14",
        "⓯": "15",
        "⓰": "16",
        "⓱": "17",
        "⓲": "18",
        "⓳": "19",
        "⓴": "20",

        "Ⓐ": "A",
        "Ⓑ": "B",
        "Ⓒ": "C",
        "Ⓓ": "D",
        "Ⓔ": "E",
        "Ⓕ": "F",
        "Ⓖ": "G",
        "Ⓗ": "H",
        "Ⓘ": "I",
        "Ⓙ": "J",
        "Ⓚ": "K",
        "Ⓛ": "L",
        "Ⓜ": "M",
        "Ⓝ": "N",
        "Ⓞ": "O",
        "Ⓟ": "P",
        "Ⓠ": "Q",
        "Ⓡ": "R",
        "Ⓢ": "S",
        "Ⓣ": "T",
        "Ⓤ": "U",
        "Ⓥ": "V",
        "Ⓦ": "W",
        "Ⓧ": "X",
        "Ⓨ": "Y",
        "Ⓩ": "Z",

        "ⓐ": "a",
        "ⓑ": "b",
        "ⓒ": "c",
        "ⓓ": "d",
        "ⓔ": "e",
        "ⓕ": "f",
        "ⓖ": "g",
        "ⓗ": "h",
        "ⓘ": "i",
        "ⓙ": "j",
        "ⓚ": "k",
        "ⓛ": "l",
        "ⓜ": "m",
        "ⓝ": "n",
        "ⓞ": "o",
        "ⓟ": "p",
        "ⓠ": "q",
        "ⓡ": "r",
        "ⓢ": "s",
        "ⓣ": "t",
        "ⓤ": "u",
        "ⓦ": "v",
        "ⓥ": "w",
        "ⓧ": "x",
        "ⓨ": "y",
        "ⓩ": "z",

        // symbols
        '“': '"',
        '”': '"',
        '‘': "'",
        '’': "'",
        '∂': 'd',
        'ƒ': 'f',
        '™': '(TM)',
        '©': '(C)',
        'œ': 'oe',
        'Œ': 'OE',
        '®': '(R)',
        '†': '+',
        '℠': '(SM)',
        '…': '...',
        '˚': 'o',
        'º': 'o',
        'ª': 'a',
        '•': '*',
        '၊': ',',
        '။': '.',

        // currency
        '$': 'USD',
        '€': 'EUR',
        '₢': 'BRN',
        '₣': 'FRF',
        '£': 'GBP',
        '₤': 'ITL',
        '₦': 'NGN',
        '₧': 'ESP',
        '₩': 'KRW',
        '₪': 'ILS',
        '₫': 'VND',
        '₭': 'LAK',
        '₮': 'MNT',
        '₯': 'GRD',
        '₱': 'ARS',
        '₲': 'PYG',
        '₳': 'ARA',
        '₴': 'UAH',
        '₵': 'GHS',
        '¢': 'cent',
        '¥': 'CNY',
        '元': 'CNY',
        '円': 'YEN',
        '﷼': 'IRR',
        '₠': 'EWE',
        '฿': 'THB',
        '₨': 'INR',
        '₹': 'INR',
        '₰': 'PF',
        '₺': 'TRY',
        '؋': 'AFN',
        '₼': 'AZN',
        'лв': 'BGN',
        '៛': 'KHR',
        '₡': 'CRC',
        '₸': 'KZT',
        'ден': 'MKD',
        'zł': 'PLN',
        '₽': 'RUB',
        '₾': 'GEL'

    };

    /**
     * special look ahead character array
     * These characters form with consonants to become 'single'/consonant combo
     * @type [Array]
     */
    var lookAheadCharArray = [
        // burmese
        '်',

        // Dhivehi
        'ް'
    ];

    /**
     * diatricMap for languages where transliteration changes entirely as more diatrics are added
     * @type {Object}
     */
    var diatricMap = {
        // Burmese
        // dependent vowels
        'ာ': 'a',
        'ါ': 'a',
        'ေ': 'e',
        'ဲ': 'e',
        'ိ': 'i',
        'ီ': 'i',
        'ို': 'o',
        'ု': 'u',
        'ူ': 'u',
        'ေါင်': 'aung',
        'ော': 'aw',
        'ော်': 'aw',
        'ေါ': 'aw',
        'ေါ်': 'aw',
        '်': '်', // this is special case but the character will be converted to latin in the code
        'က်': 'et',
        'ိုက်': 'aik',
        'ောက်': 'auk',
        'င်': 'in',
        'ိုင်': 'aing',
        'ောင်': 'aung',
        'စ်': 'it',
        'ည်': 'i',
        'တ်': 'at',
        'ိတ်': 'eik',
        'ုတ်': 'ok',
        'ွတ်': 'ut',
        'ေတ်': 'it',
        'ဒ်': 'd',
        'ိုဒ်': 'ok',
        'ုဒ်': 'ait',
        'န်': 'an',
        'ာန်': 'an',
        'ိန်': 'ein',
        'ုန်': 'on',
        'ွန်': 'un',
        'ပ်': 'at',
        'ိပ်': 'eik',
        'ုပ်': 'ok',
        'ွပ်': 'ut',
        'န်ုပ်': 'nub',
        'မ်': 'an',
        'ိမ်': 'ein',
        'ုမ်': 'on',
        'ွမ်': 'un',
        'ယ်': 'e',
        'ိုလ်': 'ol',
        'ဉ်': 'in',
        'ံ': 'an',
        'ိံ': 'ein',
        'ုံ': 'on',

        // Dhivehi
        'ައް': 'ah',
        'ަށް': 'ah'
    };

    /**
     * langCharMap language specific characters translations
     * @type   {Object}
     */
    var langCharMap = {
        'en': {}, // default language

        'az': { // Azerbaijani
            'ç': 'c',
            'ə': 'e',
            'ğ': 'g',
            'ı': 'i',
            'ö': 'o',
            'ş': 's',
            'ü': 'u',
            'Ç': 'C',
            'Ə': 'E',
            'Ğ': 'G',
            'İ': 'I',
            'Ö': 'O',
            'Ş': 'S',
            'Ü': 'U'
        },

        'cs': { // Czech
            'č': 'c',
            'ď': 'd',
            'ě': 'e',
            'ň': 'n',
            'ř': 'r',
            'š': 's',
            'ť': 't',
            'ů': 'u',
            'ž': 'z',
            'Č': 'C',
            'Ď': 'D',
            'Ě': 'E',
            'Ň': 'N',
            'Ř': 'R',
            'Š': 'S',
            'Ť': 'T',
            'Ů': 'U',
            'Ž': 'Z'
        },

        'fi': { // Finnish
            // 'å': 'a', duplicate see charMap/latin
            // 'Å': 'A', duplicate see charMap/latin
            'ä': 'a', // ok
            'Ä': 'A', // ok
            'ö': 'o', // ok
            'Ö': 'O' // ok
        },

        'hu': { // Hungarian
            'ä': 'a', // ok
            'Ä': 'A', // ok
            // 'á': 'a', duplicate see charMap/latin
            // 'Á': 'A', duplicate see charMap/latin
            'ö': 'o', // ok
            'Ö': 'O', // ok
            // 'ő': 'o', duplicate see charMap/latin
            // 'Ő': 'O', duplicate see charMap/latin
            'ü': 'u',
            'Ü': 'U',
            'ű': 'u',
            'Ű': 'U'
        },

        'lt': { // Lithuanian
            'ą': 'a',
            'č': 'c',
            'ę': 'e',
            'ė': 'e',
            'į': 'i',
            'š': 's',
            'ų': 'u',
            'ū': 'u',
            'ž': 'z',
            'Ą': 'A',
            'Č': 'C',
            'Ę': 'E',
            'Ė': 'E',
            'Į': 'I',
            'Š': 'S',
            'Ų': 'U',
            'Ū': 'U'
        },

        'lv': { // Latvian
            'ā': 'a',
            'č': 'c',
            'ē': 'e',
            'ģ': 'g',
            'ī': 'i',
            'ķ': 'k',
            'ļ': 'l',
            'ņ': 'n',
            'š': 's',
            'ū': 'u',
            'ž': 'z',
            'Ā': 'A',
            'Č': 'C',
            'Ē': 'E',
            'Ģ': 'G',
            'Ī': 'i',
            'Ķ': 'k',
            'Ļ': 'L',
            'Ņ': 'N',
            'Š': 'S',
            'Ū': 'u',
            'Ž': 'Z'
        },

        'pl': { // Polish
            'ą': 'a',
            'ć': 'c',
            'ę': 'e',
            'ł': 'l',
            'ń': 'n',
            'ó': 'o',
            'ś': 's',
            'ź': 'z',
            'ż': 'z',
            'Ą': 'A',
            'Ć': 'C',
            'Ę': 'e',
            'Ł': 'L',
            'Ń': 'N',
            'Ó': 'O',
            'Ś': 'S',
            'Ź': 'Z',
            'Ż': 'Z'
        },

        'sv': { // Swedish
            // 'å': 'a', duplicate see charMap/latin
            // 'Å': 'A', duplicate see charMap/latin
            'ä': 'a', // ok
            'Ä': 'A', // ok
            'ö': 'o', // ok
            'Ö': 'O' // ok
        },

        'sk': { // Slovak
            'ä': 'a',
            'Ä': 'A'
        },

        'sr': { // Serbian
            'љ': 'lj',
            'њ': 'nj',
            'Љ': 'Lj',
            'Њ': 'Nj',
            'đ': 'dj',
            'Đ': 'Dj'
        },

        'tr': { // Turkish
            'Ü': 'U',
            'Ö': 'O',
            'ü': 'u',
            'ö': 'o'
        }
    };

    /**
     * symbolMap language specific symbol translations
     * translations must be transliterated already
     * @type   {Object}
     */
    var symbolMap = {
        'ar': {
            '∆': 'delta',
            '∞': 'la-nihaya',
            '♥': 'hob',
            '&': 'wa',
            '|': 'aw',
            '<': 'aqal-men',
            '>': 'akbar-men',
            '∑': 'majmou',
            '¤': 'omla'
        },

        'az': {},

        'ca': {
            '∆': 'delta',
            '∞': 'infinit',
            '♥': 'amor',
            '&': 'i',
            '|': 'o',
            '<': 'menys que',
            '>': 'mes que',
            '∑': 'suma dels',
            '¤': 'moneda'
        },

        'cs': {
            '∆': 'delta',
            '∞': 'nekonecno',
            '♥': 'laska',
            '&': 'a',
            '|': 'nebo',
            '<': 'mensi nez',
            '>': 'vetsi nez',
            '∑': 'soucet',
            '¤': 'mena'
        },

        'de': {
            '∆': 'delta',
            '∞': 'unendlich',
            '♥': 'Liebe',
            '&': 'und',
            '|': 'oder',
            '<': 'kleiner als',
            '>': 'groesser als',
            '∑': 'Summe von',
            '¤': 'Waehrung'
        },

        'dv': {
            '∆': 'delta',
            '∞': 'kolunulaa',
            '♥': 'loabi',
            '&': 'aai',
            '|': 'noonee',
            '<': 'ah vure kuda',
            '>': 'ah vure bodu',
            '∑': 'jumula',
            '¤': 'faisaa'
        },

        'en': {
            '∆': 'delta',
            '∞': 'infinity',
            '♥': 'love',
            '&': 'and',
            '|': 'or',
            '<': 'less than',
            '>': 'greater than',
            '∑': 'sum',
            '¤': 'currency'
        },

        'es': {
            '∆': 'delta',
            '∞': 'infinito',
            '♥': 'amor',
            '&': 'y',
            '|': 'u',
            '<': 'menos que',
            '>': 'mas que',
            '∑': 'suma de los',
            '¤': 'moneda'
        },

        'fa': {
            '∆': 'delta',
            '∞': 'bi-nahayat',
            '♥': 'eshgh',
            '&': 'va',
            '|': 'ya',
            '<': 'kamtar-az',
            '>': 'bishtar-az',
            '∑': 'majmooe',
            '¤': 'vahed'
        },

        'fi': {
            '∆': 'delta',
            '∞': 'aarettomyys',
            '♥': 'rakkaus',
            '&': 'ja',
            '|': 'tai',
            '<': 'pienempi kuin',
            '>': 'suurempi kuin',
            '∑': 'summa',
            '¤': 'valuutta'
        },

        'fr': {
            '∆': 'delta',
            '∞': 'infiniment',
            '♥': 'Amour',
            '&': 'et',
            '|': 'ou',
            '<': 'moins que',
            '>': 'superieure a',
            '∑': 'somme des',
            '¤': 'monnaie'
        },

        'ge': {
            '∆': 'delta',
            '∞': 'usasruloba',
            '♥': 'siqvaruli',
            '&': 'da',
            '|': 'an',
            '<': 'naklebi',
            '>': 'meti',
            '∑': 'jami',
            '¤': 'valuta'
        },

        'gr': {},

        'hu': {
            '∆': 'delta',
            '∞': 'vegtelen',
            '♥': 'szerelem',
            '&': 'es',
            '|': 'vagy',
            '<': 'kisebb mint',
            '>': 'nagyobb mint',
            '∑': 'szumma',
            '¤': 'penznem'
        },

        'it': {
            '∆': 'delta',
            '∞': 'infinito',
            '♥': 'amore',
            '&': 'e',
            '|': 'o',
            '<': 'minore di',
            '>': 'maggiore di',
            '∑': 'somma',
            '¤': 'moneta'
        },

        'lt': {
            '∆': 'delta',
            '∞': 'begalybe',
            '♥': 'meile',
            '&': 'ir',
            '|': 'ar',
            '<': 'maziau nei',
            '>': 'daugiau nei',
            '∑': 'suma',
            '¤': 'valiuta'
        },

        'lv': {
            '∆': 'delta',
            '∞': 'bezgaliba',
            '♥': 'milestiba',
            '&': 'un',
            '|': 'vai',
            '<': 'mazak neka',
            '>': 'lielaks neka',
            '∑': 'summa',
            '¤': 'valuta'
        },

        'my': {
            '∆': 'kwahkhyaet',
            '∞': 'asaonasme',
            '♥': 'akhyait',
            '&': 'nhin',
            '|': 'tho',
            '<': 'ngethaw',
            '>': 'kyithaw',
            '∑': 'paungld',
            '¤': 'ngwekye'
        },

        'mk': {},

        'nl': {
            '∆': 'delta',
            '∞': 'oneindig',
            '♥': 'liefde',
            '&': 'en',
            '|': 'of',
            '<': 'kleiner dan',
            '>': 'groter dan',
            '∑': 'som',
            '¤': 'valuta'
        },

        'pl': {
            '∆': 'delta',
            '∞': 'nieskonczonosc',
            '♥': 'milosc',
            '&': 'i',
            '|': 'lub',
            '<': 'mniejsze niz',
            '>': 'wieksze niz',
            '∑': 'suma',
            '¤': 'waluta'
        },

        'pt': {
            '∆': 'delta',
            '∞': 'infinito',
            '♥': 'amor',
            '&': 'e',
            '|': 'ou',
            '<': 'menor que',
            '>': 'maior que',
            '∑': 'soma',
            '¤': 'moeda'
        },

        'ro': {
            '∆': 'delta',
            '∞': 'infinit',
            '♥': 'dragoste',
            '&': 'si',
            '|': 'sau',
            '<': 'mai mic ca',
            '>': 'mai mare ca',
            '∑': 'suma',
            '¤': 'valuta'
        },

        'ru': {
            '∆': 'delta',
            '∞': 'beskonechno',
            '♥': 'lubov',
            '&': 'i',
            '|': 'ili',
            '<': 'menshe',
            '>': 'bolshe',
            '∑': 'summa',
            '¤': 'valjuta'
        },

        'sk': {
            '∆': 'delta',
            '∞': 'nekonecno',
            '♥': 'laska',
            '&': 'a',
            '|': 'alebo',
            '<': 'menej ako',
            '>': 'viac ako',
            '∑': 'sucet',
            '¤': 'mena'
        },

        'sr': {},

        'tr': {
            '∆': 'delta',
            '∞': 'sonsuzluk',
            '♥': 'ask',
            '&': 've',
            '|': 'veya',
            '<': 'kucuktur',
            '>': 'buyuktur',
            '∑': 'toplam',
            '¤': 'para birimi'
        },

        'uk': {
            '∆': 'delta',
            '∞': 'bezkinechnist',
            '♥': 'lubov',
            '&': 'i',
            '|': 'abo',
            '<': 'menshe',
            '>': 'bilshe',
            '∑': 'suma',
            '¤': 'valjuta'
        },

        'vn': {
            '∆': 'delta',
            '∞': 'vo cuc',
            '♥': 'yeu',
            '&': 'va',
            '|': 'hoac',
            '<': 'nho hon',
            '>': 'lon hon',
            '∑': 'tong',
            '¤': 'tien te'
        }
    };

    var uricChars = [';', '?', ':', '@', '&', '=', '+', '$', ',', '/'].join('');

    var uricNoSlashChars = [';', '?', ':', '@', '&', '=', '+', '$', ','].join('');

    var markChars = ['.', '!', '~', '*', "'", '(', ')'].join('');

    /**
     * getSlug
     * @param  {string} input input string
     * @param  {object|string} opts config object or separator string/char
     * @api    public
     * @return {string}  sluggified string
     */
    var getSlug = function getSlug(input, opts) {
        var separator = '-';
        var result = '';
        var diatricString = '';
        var convertSymbols = true;
        var customReplacements = {};
        var maintainCase;
        var titleCase;
        var truncate;
        var uricFlag;
        var uricNoSlashFlag;
        var markFlag;
        var symbol;
        var langChar;
        var lucky;
        var i;
        var ch;
        var l;
        var lastCharWasSymbol;
        var lastCharWasDiatric;
        var allowedChars = '';

        if (typeof input !== 'string') {
            return '';
        }

        if (typeof opts === 'string') {
            separator = opts;
        }

        symbol = symbolMap.en;
        langChar = langCharMap.en;

        if (typeof opts === 'object') {
            maintainCase = opts.maintainCase || false;
            customReplacements = (opts.custom && typeof opts.custom === 'object') ? opts.custom : customReplacements;
            truncate = (+opts.truncate > 1 && opts.truncate) || false;
            uricFlag = opts.uric || false;
            uricNoSlashFlag = opts.uricNoSlash || false;
            markFlag = opts.mark || false;
            convertSymbols = (opts.symbols === false || opts.lang === false) ? false : true;
            separator = opts.separator || separator;

            if (uricFlag) {
                allowedChars += uricChars;
            }

            if (uricNoSlashFlag) {
                allowedChars += uricNoSlashChars;
            }

            if (markFlag) {
                allowedChars += markChars;
            }

            symbol = (opts.lang && symbolMap[opts.lang] && convertSymbols) ?
                symbolMap[opts.lang] : (convertSymbols ? symbolMap.en : {});

            langChar = (opts.lang && langCharMap[opts.lang]) ?
                langCharMap[opts.lang] :
                opts.lang === false || opts.lang === true ? {} : langCharMap.en;

            // if titleCase config is an Array, rewrite to object format
            if (opts.titleCase && typeof opts.titleCase.length === 'number' && Array.prototype.toString.call(opts.titleCase)) {
                opts.titleCase.forEach(function (v) {
                    customReplacements[v + ''] = v + '';
                });

                titleCase = true;
            } else {
                titleCase = !!opts.titleCase;
            }

            // if custom config is an Array, rewrite to object format
            if (opts.custom && typeof opts.custom.length === 'number' && Array.prototype.toString.call(opts.custom)) {
                opts.custom.forEach(function (v) {
                    customReplacements[v + ''] = v + '';
                });
            }

            // custom replacements
            Object.keys(customReplacements).forEach(function (v) {
                var r;

                if (v.length > 1) {
                    r = new RegExp('\\b' + escapeChars(v) + '\\b', 'gi');
                } else {
                    r = new RegExp(escapeChars(v), 'gi');
                }

                input = input.replace(r, customReplacements[v]);
            });

            // add all custom replacement to allowed charlist
            for (ch in customReplacements) {
                allowedChars += ch;
            }
        }

        allowedChars += separator;

        // escape all necessary chars
        allowedChars = escapeChars(allowedChars);

        // trim whitespaces
        input = input.replace(/(^\s+|\s+$)/g, '');

        lastCharWasSymbol = false;
        lastCharWasDiatric = false;

        for (i = 0, l = input.length; i < l; i++) {
            ch = input[i];

            if (isReplacedCustomChar(ch, customReplacements)) {
                // don't convert a already converted char
                lastCharWasSymbol = false;
            } else if (langChar[ch]) {
                // process language specific diactrics chars conversion
                ch = lastCharWasSymbol && langChar[ch].match(/[A-Za-z0-9]/) ? ' ' + langChar[ch] : langChar[ch];

                lastCharWasSymbol = false;
            } else if (ch in charMap) {
                // the transliteration changes entirely when some special characters are added
                if (i + 1 < l && lookAheadCharArray.indexOf(input[i + 1]) >= 0) {
                    diatricString += ch;
                    ch = '';
                } else if (lastCharWasDiatric === true) {
                    ch = diatricMap[diatricString] + charMap[ch];
                    diatricString = '';
                } else {
                    // process diactrics chars
                    ch = lastCharWasSymbol && charMap[ch].match(/[A-Za-z0-9]/) ? ' ' + charMap[ch] : charMap[ch];
                }

                lastCharWasSymbol = false;
                lastCharWasDiatric = false;
            } else if (ch in diatricMap) {
                diatricString += ch;
                ch = '';
                // end of string, put the whole meaningful word
                if (i === l - 1) {
                    ch = diatricMap[diatricString];
                }
                lastCharWasDiatric = true;
            } else if (
                // process symbol chars
                symbol[ch] && !(uricFlag && uricChars
                    .indexOf(ch) !== -1) && !(uricNoSlashFlag && uricNoSlashChars
                    // .indexOf(ch) !== -1) && !(markFlag && markChars
                    .indexOf(ch) !== -1)) {
                ch = lastCharWasSymbol || result.substr(-1).match(/[A-Za-z0-9]/) ? separator + symbol[ch] : symbol[ch];
                ch += input[i + 1] !== void 0 && input[i + 1].match(/[A-Za-z0-9]/) ? separator : '';

                lastCharWasSymbol = true;
            } else {
                if (lastCharWasDiatric === true) {
                    ch = diatricMap[diatricString] + ch;
                    diatricString = '';
                    lastCharWasDiatric = false;
                } else if (lastCharWasSymbol && (/[A-Za-z0-9]/.test(ch) || result.substr(-1).match(/A-Za-z0-9]/))) {
                    // process latin chars
                    ch = ' ' + ch;
                }
                lastCharWasSymbol = false;
            }

            // add allowed chars
            result += ch.replace(new RegExp('[^\\w\\s' + allowedChars + '_-]', 'g'), separator);
        }

        if (titleCase) {
            result = result.replace(/(\w)(\S*)/g, function (_, i, r) {
                var j = i.toUpperCase() + (r !== null ? r : '');
                return (Object.keys(customReplacements).indexOf(j.toLowerCase()) < 0) ? j : j.toLowerCase();
            });
        }

        // eliminate duplicate separators
        // add separator
        // trim separators from start and end
        result = result.replace(/\s+/g, separator)
            .replace(new RegExp('\\' + separator + '+', 'g'), separator)
            .replace(new RegExp('(^\\' + separator + '+|\\' + separator + '+$)', 'g'), '');

        if (truncate && result.length > truncate) {
            lucky = result.charAt(truncate) === separator;
            result = result.slice(0, truncate);

            if (!lucky) {
                result = result.slice(0, result.lastIndexOf(separator));
            }
        }

        if (!maintainCase && !titleCase) {
            result = result.toLowerCase();
        }

        return result;
    };

    /**
     * createSlug curried(opts)(input)
     * @param   {object|string} opts config object or input string
     * @return  {Function} function getSlugWithConfig()
     **/
    var createSlug = function createSlug(opts) {

        /**
         * getSlugWithConfig
         * @param   {string} input string
         * @return  {string} slug string
         */
        return function getSlugWithConfig(input) {
            return getSlug(input, opts);
        };
    };

    /**
     * escape Chars
     * @param   {string} input string
     */
    var escapeChars = function escapeChars(input) {
        return input.replace(/[-\\^$*+?.()|[\]{}\/]/g, '\\$&');
    };

    /**
     * check if the char is an already converted char from custom list
     * @param   {char} ch character to check
     * @param   {object} customReplacements custom translation map
     */
    var isReplacedCustomChar = function (ch, customReplacements) {
        for (var c in customReplacements) {
            if (customReplacements[c] === ch) {
                return true;
            }
        }
    };

    if ( true && module.exports) {

        // export functions for use in Node
        module.exports = getSlug;
        module.exports.createSlug = createSlug;
    } else if (true) {

        // export function for use in AMD
        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = (function () {
            return getSlug;
        }).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
    } else {}
})(this);

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
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!************************!*\
  !*** ./src/backend.js ***!
  \************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _back__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @back */ "../app-backend-core/lib/index.js");
/* harmony import */ var _back__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_back__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _vue_devtools_shared_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @vue-devtools/shared-utils */ "../shared-utils/lib/index.js");
/* harmony import */ var _vue_devtools_shared_utils__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_vue_devtools_shared_utils__WEBPACK_IMPORTED_MODULE_1__);
// this is injected to the app page when the panel is activated.


window.addEventListener('message', handshake);

function sendListening() {
  window.postMessage({
    source: 'vue-devtools-backend-injection',
    payload: 'listening'
  }, '*');
}

sendListening();

function handshake(e) {
  if (e.data.source === 'vue-devtools-proxy' && e.data.payload === 'init') {
    window.removeEventListener('message', handshake);
    let listeners = [];
    const bridge = new _vue_devtools_shared_utils__WEBPACK_IMPORTED_MODULE_1__.Bridge({
      listen(fn) {
        const listener = evt => {
          if (evt.data.source === 'vue-devtools-proxy' && evt.data.payload) {
            fn(evt.data.payload);
          }
        };

        window.addEventListener('message', listener);
        listeners.push(listener);
      },

      send(data) {
        // if (process.env.NODE_ENV !== 'production') {
        //   console.log('[chrome] backend -> devtools', data)
        // }
        window.postMessage({
          source: 'vue-devtools-backend',
          payload: data
        }, '*');
      }

    });
    bridge.on('shutdown', () => {
      listeners.forEach(l => {
        window.removeEventListener('message', l);
      });
      listeners = [];
    });
    (0,_back__WEBPACK_IMPORTED_MODULE_0__.initBackend)(bridge);
  } else {
    sendListening();
  }
}
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRWE7O0FBRWI7QUFDQSxlQUFlLG1CQUFPLENBQUMsb0RBQVM7O0FBRWhDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2QkFBNkI7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOzs7Ozs7Ozs7OztBQ2xGQSxrSEFBNkM7Ozs7Ozs7Ozs7O0FDQTdDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsZ0JBQWdCO0FBQ2hCO0FBQ0E7QUFDQSxnQkFBZ0I7O0FBRWhCLGdCQUFnQjtBQUNoQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUzs7QUFFVCxnQkFBZ0I7QUFDaEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUzs7QUFFVCxnQkFBZ0I7QUFDaEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUzs7QUFFVCxnQkFBZ0I7QUFDaEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUzs7QUFFVCxnQkFBZ0I7QUFDaEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7O0FBRVQsZ0JBQWdCO0FBQ2hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUzs7QUFFVCxnQkFBZ0I7QUFDaEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUzs7QUFFVCxnQkFBZ0I7QUFDaEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUzs7QUFFVCxnQkFBZ0I7QUFDaEI7QUFDQTtBQUNBLFNBQVM7O0FBRVQsZ0JBQWdCO0FBQ2hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7O0FBRVQsZ0JBQWdCO0FBQ2hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxnQkFBZ0I7QUFDaEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUzs7QUFFVCxnQkFBZ0I7O0FBRWhCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUzs7QUFFVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7O0FBRVQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTOztBQUVUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUzs7QUFFVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7O0FBRVQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTOztBQUVUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUzs7QUFFVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7O0FBRVQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTOztBQUVUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUzs7QUFFVCxnQkFBZ0I7O0FBRWhCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUzs7QUFFVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7O0FBRVQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTOztBQUVUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUzs7QUFFVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7O0FBRVQsZ0JBQWdCOztBQUVoQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7O0FBRVQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTOztBQUVUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUzs7QUFFVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNB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QUEsTUFBTSxDQUFFQyxFQUFGLEVBQU07QUFDVixjQUFNQyxRQUFRLEdBQUdDLEdBQUcsSUFBSTtBQUN0QixjQUFJQSxHQUFHLENBQUNQLElBQUosQ0FBU0gsTUFBVCxLQUFvQixvQkFBcEIsSUFBNENVLEdBQUcsQ0FBQ1AsSUFBSixDQUFTRixPQUF6RCxFQUFrRTtBQUNoRU8sWUFBQUEsRUFBRSxDQUFDRSxHQUFHLENBQUNQLElBQUosQ0FBU0YsT0FBVixDQUFGO0FBQ0Q7QUFDRixTQUpEOztBQUtBTixRQUFBQSxNQUFNLENBQUNDLGdCQUFQLENBQXdCLFNBQXhCLEVBQW1DYSxRQUFuQztBQUNBSixRQUFBQSxTQUFTLENBQUNNLElBQVYsQ0FBZUYsUUFBZjtBQUNELE9BVHVCOztBQVV4QkcsTUFBQUEsSUFBSSxDQUFFVCxJQUFGLEVBQVE7QUFDVjtBQUNBO0FBQ0E7QUFDQVIsUUFBQUEsTUFBTSxDQUFDSSxXQUFQLENBQW1CO0FBQ2pCQyxVQUFBQSxNQUFNLEVBQUUsc0JBRFM7QUFFakJDLFVBQUFBLE9BQU8sRUFBRUU7QUFGUSxTQUFuQixFQUdHLEdBSEg7QUFJRDs7QUFsQnVCLEtBQVgsQ0FBZjtBQXFCQUcsSUFBQUEsTUFBTSxDQUFDTyxFQUFQLENBQVUsVUFBVixFQUFzQixNQUFNO0FBQzFCUixNQUFBQSxTQUFTLENBQUNTLE9BQVYsQ0FBa0JDLENBQUMsSUFBSTtBQUNyQnBCLFFBQUFBLE1BQU0sQ0FBQ1MsbUJBQVAsQ0FBMkIsU0FBM0IsRUFBc0NXLENBQXRDO0FBQ0QsT0FGRDtBQUdBVixNQUFBQSxTQUFTLEdBQUcsRUFBWjtBQUNELEtBTEQ7QUFPQVosSUFBQUEsa0RBQVcsQ0FBQ2EsTUFBRCxDQUFYO0FBQ0QsR0FqQ0QsTUFpQ087QUFDTFIsSUFBQUEsYUFBYTtBQUNkO0FBQ0YsQyIsInNvdXJjZXMiOlsid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uLy4uL3NyYy9jb25zdC50cyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi8uLi9zcmMvZW52LnRzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uLy4uL3NyYy9pbmRleC50cyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi8uLi9zcmMvcHJveHkudHMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vc3JjL2FwaS50cyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi9zcmMvYmFja2VuZC1jb250ZXh0LnRzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uL3NyYy9iYWNrZW5kLnRzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uL3NyYy9nbG9iYWwtaG9vay50cyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi9zcmMvaG9va3MudHMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vc3JjL2luZGV4LnRzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uL3NyYy9hcHAudHMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vc3JjL2NvbXBvbmVudC1waWNrLnRzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uL3NyYy9jb21wb25lbnQudHMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vc3JjL2hpZ2hsaWdodGVyLnRzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uL3NyYy9pbnNwZWN0b3IudHMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vLi4vc3JjL2xlZ2FjeS9zY2FuLnRzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uL3NyYy9wYWdlLWNvbmZpZy50cyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi9zcmMvcGVyZi50cyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi9zcmMvcGx1Z2luLnRzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uL3NyYy90aW1lbGluZS1idWlsdGlucy50cyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi9zcmMvdGltZWxpbmUtbWFya2VyLnRzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uL3NyYy90aW1lbGluZS1zY3JlZW5zaG90LnRzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uL3NyYy90aW1lbGluZS50cyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi8uLi9zcmMvdXRpbC9xdWV1ZS50cyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi8uLi9zcmMvdXRpbC9zdWJzY3JpcHRpb25zLnRzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uLy4uL3NyYy9jb21wb25lbnRzL2RhdGEudHMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vLi4vc3JjL2NvbXBvbmVudHMvZWwudHMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vLi4vc3JjL2NvbXBvbmVudHMvdHJlZS50cyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi8uLi9zcmMvY29tcG9uZW50cy91dGlsLnRzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uL3NyYy9ldmVudHMudHMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vLi4vc3JjL2NvbXBvbmVudHMvZmlsdGVyLnRzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uL3NyYy91dGlsLnRzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uL3NyYy9icmlkZ2UudHMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vc3JjL2NvbnN0cy50cyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi9zcmMvZWRpdC50cyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi9zcmMvZW52LnRzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uL3NyYy9wbHVnaW4tcGVybWlzc2lvbnMudHMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vc3JjL3BsdWdpbi1zZXR0aW5ncy50cyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi9zcmMvc2hhcmVkLWRhdGEudHMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vc3JjL3N0b3JhZ2UudHMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vc3JjL3RyYW5zZmVyLnRzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uLy4uL25vZGVfbW9kdWxlcy9jbG9uZS1kZWVwL2luZGV4LmpzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uLy4uL25vZGVfbW9kdWxlcy9jbG9uZS1kZWVwL25vZGVfbW9kdWxlcy9pcy1wbGFpbi1vYmplY3QvaW5kZXguanMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vLi4vbm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vLi4vbm9kZV9tb2R1bGVzL2lzb2JqZWN0L2luZGV4LmpzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uLy4uL25vZGVfbW9kdWxlcy9raW5kLW9mL2luZGV4LmpzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX1N5bWJvbC5qcyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19iYXNlR2V0VGFnLmpzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX2Jhc2VUcmltLmpzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX2ZyZWVHbG9iYWwuanMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fZ2V0UmF3VGFnLmpzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX29iamVjdFRvU3RyaW5nLmpzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX3Jvb3QuanMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fdHJpbW1lZEVuZEluZGV4LmpzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvZGVib3VuY2UuanMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9pc09iamVjdC5qcyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL2lzT2JqZWN0TGlrZS5qcyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL2lzU3ltYm9sLmpzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvbm93LmpzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvdG9OdW1iZXIuanMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vLi4vbm9kZV9tb2R1bGVzL3BhdGgtYnJvd3NlcmlmeS9pbmRleC5qcyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi8uLi9ub2RlX21vZHVsZXMvc2hhbGxvdy1jbG9uZS9pbmRleC5qcyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi8uLi9ub2RlX21vZHVsZXMvc3BlYWtpbmd1cmwvaW5kZXguanMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vLi4vbm9kZV9tb2R1bGVzL3NwZWFraW5ndXJsL2xpYi9zcGVha2luZ3VybC5qcyIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS93ZWJwYWNrL3J1bnRpbWUvY29tcGF0IGdldCBkZWZhdWx0IGV4cG9ydCIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvd2VicGFjay9ydW50aW1lL2dsb2JhbCIsIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi9zcmMvYmFja2VuZC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgSE9PS19TRVRVUCA9ICdkZXZ0b29scy1wbHVnaW46c2V0dXAnO1xyXG5leHBvcnQgY29uc3QgSE9PS19QTFVHSU5fU0VUVElOR1NfU0VUID0gJ3BsdWdpbjpzZXR0aW5nczpzZXQnO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1jb25zdC5qcy5tYXAiLCJleHBvcnQgZnVuY3Rpb24gZ2V0RGV2dG9vbHNHbG9iYWxIb29rKCkge1xyXG4gICAgcmV0dXJuIGdldFRhcmdldCgpLl9fVlVFX0RFVlRPT0xTX0dMT0JBTF9IT09LX187XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFRhcmdldCgpIHtcclxuICAgIC8vIEB0cy1pZ25vcmVcclxuICAgIHJldHVybiAodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgPyB3aW5kb3dcclxuICAgICAgICA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnXHJcbiAgICAgICAgICAgID8gZ2xvYmFsXHJcbiAgICAgICAgICAgIDoge307XHJcbn1cclxuZXhwb3J0IGNvbnN0IGlzUHJveHlBdmFpbGFibGUgPSB0eXBlb2YgUHJveHkgPT09ICdmdW5jdGlvbic7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWVudi5qcy5tYXAiLCJpbXBvcnQgeyBnZXRUYXJnZXQsIGdldERldnRvb2xzR2xvYmFsSG9vaywgaXNQcm94eUF2YWlsYWJsZSB9IGZyb20gJy4vZW52JztcclxuaW1wb3J0IHsgSE9PS19TRVRVUCB9IGZyb20gJy4vY29uc3QnO1xyXG5pbXBvcnQgeyBBcGlQcm94eSB9IGZyb20gJy4vcHJveHknO1xyXG5leHBvcnQgKiBmcm9tICcuL2FwaSc7XHJcbmV4cG9ydCAqIGZyb20gJy4vcGx1Z2luJztcclxuZXhwb3J0IGZ1bmN0aW9uIHNldHVwRGV2dG9vbHNQbHVnaW4ocGx1Z2luRGVzY3JpcHRvciwgc2V0dXBGbikge1xyXG4gICAgY29uc3QgdGFyZ2V0ID0gZ2V0VGFyZ2V0KCk7XHJcbiAgICBjb25zdCBob29rID0gZ2V0RGV2dG9vbHNHbG9iYWxIb29rKCk7XHJcbiAgICBjb25zdCBlbmFibGVQcm94eSA9IGlzUHJveHlBdmFpbGFibGUgJiYgcGx1Z2luRGVzY3JpcHRvci5lbmFibGVFYXJseVByb3h5O1xyXG4gICAgaWYgKGhvb2sgJiYgKHRhcmdldC5fX1ZVRV9ERVZUT09MU19QTFVHSU5fQVBJX0FWQUlMQUJMRV9fIHx8ICFlbmFibGVQcm94eSkpIHtcclxuICAgICAgICBob29rLmVtaXQoSE9PS19TRVRVUCwgcGx1Z2luRGVzY3JpcHRvciwgc2V0dXBGbik7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBjb25zdCBwcm94eSA9IGVuYWJsZVByb3h5ID8gbmV3IEFwaVByb3h5KHBsdWdpbkRlc2NyaXB0b3IsIGhvb2spIDogbnVsbDtcclxuICAgICAgICBjb25zdCBsaXN0ID0gdGFyZ2V0Ll9fVlVFX0RFVlRPT0xTX1BMVUdJTlNfXyA9IHRhcmdldC5fX1ZVRV9ERVZUT09MU19QTFVHSU5TX18gfHwgW107XHJcbiAgICAgICAgbGlzdC5wdXNoKHtcclxuICAgICAgICAgICAgcGx1Z2luRGVzY3JpcHRvcixcclxuICAgICAgICAgICAgc2V0dXBGbixcclxuICAgICAgICAgICAgcHJveHksXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaWYgKHByb3h5KVxyXG4gICAgICAgICAgICBzZXR1cEZuKHByb3h5LnByb3hpZWRUYXJnZXQpO1xyXG4gICAgfVxyXG59XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsImltcG9ydCB7IEhPT0tfUExVR0lOX1NFVFRJTkdTX1NFVCB9IGZyb20gJy4vY29uc3QnO1xyXG5leHBvcnQgY2xhc3MgQXBpUHJveHkge1xyXG4gICAgdGFyZ2V0O1xyXG4gICAgdGFyZ2V0UXVldWU7XHJcbiAgICBwcm94aWVkVGFyZ2V0O1xyXG4gICAgb25RdWV1ZTtcclxuICAgIHByb3hpZWRPbjtcclxuICAgIHBsdWdpbjtcclxuICAgIGhvb2s7XHJcbiAgICBmYWxsYmFja3M7XHJcbiAgICBjb25zdHJ1Y3RvcihwbHVnaW4sIGhvb2spIHtcclxuICAgICAgICB0aGlzLnRhcmdldCA9IG51bGw7XHJcbiAgICAgICAgdGhpcy50YXJnZXRRdWV1ZSA9IFtdO1xyXG4gICAgICAgIHRoaXMub25RdWV1ZSA9IFtdO1xyXG4gICAgICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xyXG4gICAgICAgIHRoaXMuaG9vayA9IGhvb2s7XHJcbiAgICAgICAgY29uc3QgZGVmYXVsdFNldHRpbmdzID0ge307XHJcbiAgICAgICAgaWYgKHBsdWdpbi5zZXR0aW5ncykge1xyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGlkIGluIHBsdWdpbi5zZXR0aW5ncykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbSA9IHBsdWdpbi5zZXR0aW5nc1tpZF07XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0U2V0dGluZ3NbaWRdID0gaXRlbS5kZWZhdWx0VmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbG9jYWxTZXR0aW5nc1NhdmVJZCA9IGBfX3Z1ZS1kZXZ0b29scy1wbHVnaW4tc2V0dGluZ3NfXyR7cGx1Z2luLmlkfWA7XHJcbiAgICAgICAgbGV0IGN1cnJlbnRTZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRTZXR0aW5ncyk7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmF3ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0obG9jYWxTZXR0aW5nc1NhdmVJZCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKHJhdyk7XHJcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oY3VycmVudFNldHRpbmdzLCBkYXRhKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgLy8gbm9vcFxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmZhbGxiYWNrcyA9IHtcclxuICAgICAgICAgICAgZ2V0U2V0dGluZ3MoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY3VycmVudFNldHRpbmdzO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzZXRTZXR0aW5ncyh2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShsb2NhbFNldHRpbmdzU2F2ZUlkLCBKU09OLnN0cmluZ2lmeSh2YWx1ZSkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBub29wXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjdXJyZW50U2V0dGluZ3MgPSB2YWx1ZTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9O1xyXG4gICAgICAgIGlmIChob29rKSB7XHJcbiAgICAgICAgICAgIGhvb2sub24oSE9PS19QTFVHSU5fU0VUVElOR1NfU0VULCAocGx1Z2luSWQsIHZhbHVlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAocGx1Z2luSWQgPT09IHRoaXMucGx1Z2luLmlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mYWxsYmFja3Muc2V0U2V0dGluZ3ModmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5wcm94aWVkT24gPSBuZXcgUHJveHkoe30sIHtcclxuICAgICAgICAgICAgZ2V0OiAoX3RhcmdldCwgcHJvcCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudGFyZ2V0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudGFyZ2V0Lm9uW3Byb3BdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICguLi5hcmdzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25RdWV1ZS5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogcHJvcCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5wcm94aWVkVGFyZ2V0ID0gbmV3IFByb3h5KHt9LCB7XHJcbiAgICAgICAgICAgIGdldDogKF90YXJnZXQsIHByb3ApID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRhcmdldCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRhcmdldFtwcm9wXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHByb3AgPT09ICdvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wcm94aWVkT247XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChPYmplY3Qua2V5cyh0aGlzLmZhbGxiYWNrcykuaW5jbHVkZXMocHJvcCkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKC4uLmFyZ3MpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50YXJnZXRRdWV1ZS5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogcHJvcCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlOiAoKSA9PiB7IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5mYWxsYmFja3NbcHJvcF0oLi4uYXJncyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoLi4uYXJncykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRhcmdldFF1ZXVlLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogcHJvcCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGFzeW5jIHNldFJlYWxUYXJnZXQodGFyZ2V0KSB7XHJcbiAgICAgICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XHJcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHRoaXMub25RdWV1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLnRhcmdldC5vbltpdGVtLm1ldGhvZF0oLi4uaXRlbS5hcmdzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHRoaXMudGFyZ2V0UXVldWUpIHtcclxuICAgICAgICAgICAgaXRlbS5yZXNvbHZlKGF3YWl0IHRoaXMudGFyZ2V0W2l0ZW0ubWV0aG9kXSguLi5pdGVtLmFyZ3MpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cHJveHkuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5EZXZ0b29sc1BsdWdpbkFwaUluc3RhbmNlID0gZXhwb3J0cy5EZXZ0b29sc0FwaSA9IHZvaWQgMDtcclxuY29uc3Qgc2hhcmVkX3V0aWxzXzEgPSByZXF1aXJlKFwiQHZ1ZS1kZXZ0b29scy9zaGFyZWQtdXRpbHNcIik7XHJcbmNvbnN0IGhvb2tzXzEgPSByZXF1aXJlKFwiLi9ob29rc1wiKTtcclxuY29uc3QgcGx1Z2luT24gPSBbXTtcclxuY2xhc3MgRGV2dG9vbHNBcGkge1xyXG4gICAgY29uc3RydWN0b3IoYmFja2VuZCwgY3R4KSB7XHJcbiAgICAgICAgdGhpcy5zdGF0ZUVkaXRvciA9IG5ldyBzaGFyZWRfdXRpbHNfMS5TdGF0ZUVkaXRvcigpO1xyXG4gICAgICAgIHRoaXMuYmFja2VuZCA9IGJhY2tlbmQ7XHJcbiAgICAgICAgdGhpcy5jdHggPSBjdHg7XHJcbiAgICAgICAgdGhpcy5icmlkZ2UgPSBjdHguYnJpZGdlO1xyXG4gICAgICAgIHRoaXMub24gPSBuZXcgaG9va3NfMS5EZXZ0b29sc0hvb2thYmxlKGN0eCk7XHJcbiAgICB9XHJcbiAgICBhc3luYyBjYWxsSG9vayhldmVudFR5cGUsIHBheWxvYWQsIGN0eCA9IHRoaXMuY3R4KSB7XHJcbiAgICAgICAgcGF5bG9hZCA9IGF3YWl0IHRoaXMub24uY2FsbEhhbmRsZXJzKGV2ZW50VHlwZSwgcGF5bG9hZCwgY3R4KTtcclxuICAgICAgICBmb3IgKGNvbnN0IG9uIG9mIHBsdWdpbk9uKSB7XHJcbiAgICAgICAgICAgIHBheWxvYWQgPSBhd2FpdCBvbi5jYWxsSGFuZGxlcnMoZXZlbnRUeXBlLCBwYXlsb2FkLCBjdHgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcGF5bG9hZDtcclxuICAgIH1cclxuICAgIGFzeW5jIHRyYW5zZm9ybUNhbGwoY2FsbE5hbWUsIC4uLmFyZ3MpIHtcclxuICAgICAgICBjb25zdCBwYXlsb2FkID0gYXdhaXQgdGhpcy5jYWxsSG9vayhcInRyYW5zZm9ybUNhbGxcIiAvKiBUUkFOU0ZPUk1fQ0FMTCAqLywge1xyXG4gICAgICAgICAgICBjYWxsTmFtZSxcclxuICAgICAgICAgICAgaW5BcmdzOiBhcmdzLFxyXG4gICAgICAgICAgICBvdXRBcmdzOiBhcmdzLnNsaWNlKCksXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHBheWxvYWQub3V0QXJncztcclxuICAgIH1cclxuICAgIGFzeW5jIGdldEFwcFJlY29yZE5hbWUoYXBwLCBkZWZhdWx0TmFtZSkge1xyXG4gICAgICAgIGNvbnN0IHBheWxvYWQgPSBhd2FpdCB0aGlzLmNhbGxIb29rKFwiZ2V0QXBwUmVjb3JkTmFtZVwiIC8qIEdFVF9BUFBfUkVDT1JEX05BTUUgKi8sIHtcclxuICAgICAgICAgICAgYXBwLFxyXG4gICAgICAgICAgICBuYW1lOiBudWxsLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGlmIChwYXlsb2FkLm5hbWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHBheWxvYWQubmFtZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBgQXBwICR7ZGVmYXVsdE5hbWV9YDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBhc3luYyBnZXRBcHBSb290SW5zdGFuY2UoYXBwKSB7XHJcbiAgICAgICAgY29uc3QgcGF5bG9hZCA9IGF3YWl0IHRoaXMuY2FsbEhvb2soXCJnZXRBcHBSb290SW5zdGFuY2VcIiAvKiBHRVRfQVBQX1JPT1RfSU5TVEFOQ0UgKi8sIHtcclxuICAgICAgICAgICAgYXBwLFxyXG4gICAgICAgICAgICByb290OiBudWxsLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBwYXlsb2FkLnJvb3Q7XHJcbiAgICB9XHJcbiAgICBhc3luYyByZWdpc3RlckFwcGxpY2F0aW9uKGFwcCkge1xyXG4gICAgICAgIGF3YWl0IHRoaXMuY2FsbEhvb2soXCJyZWdpc3RlckFwcGxpY2F0aW9uXCIgLyogUkVHSVNURVJfQVBQTElDQVRJT04gKi8sIHtcclxuICAgICAgICAgICAgYXBwLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgYXN5bmMgd2Fsa0NvbXBvbmVudFRyZWUoaW5zdGFuY2UsIG1heERlcHRoID0gLTEsIGZpbHRlciA9IG51bGwpIHtcclxuICAgICAgICBjb25zdCBwYXlsb2FkID0gYXdhaXQgdGhpcy5jYWxsSG9vayhcIndhbGtDb21wb25lbnRUcmVlXCIgLyogV0FMS19DT01QT05FTlRfVFJFRSAqLywge1xyXG4gICAgICAgICAgICBjb21wb25lbnRJbnN0YW5jZTogaW5zdGFuY2UsXHJcbiAgICAgICAgICAgIGNvbXBvbmVudFRyZWVEYXRhOiBudWxsLFxyXG4gICAgICAgICAgICBtYXhEZXB0aCxcclxuICAgICAgICAgICAgZmlsdGVyLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBwYXlsb2FkLmNvbXBvbmVudFRyZWVEYXRhO1xyXG4gICAgfVxyXG4gICAgYXN5bmMgdmlzaXRDb21wb25lbnRUcmVlKGluc3RhbmNlLCB0cmVlTm9kZSwgZmlsdGVyID0gbnVsbCwgYXBwKSB7XHJcbiAgICAgICAgY29uc3QgcGF5bG9hZCA9IGF3YWl0IHRoaXMuY2FsbEhvb2soXCJ2aXNpdENvbXBvbmVudFRyZWVcIiAvKiBWSVNJVF9DT01QT05FTlRfVFJFRSAqLywge1xyXG4gICAgICAgICAgICBhcHAsXHJcbiAgICAgICAgICAgIGNvbXBvbmVudEluc3RhbmNlOiBpbnN0YW5jZSxcclxuICAgICAgICAgICAgdHJlZU5vZGUsXHJcbiAgICAgICAgICAgIGZpbHRlcixcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gcGF5bG9hZC50cmVlTm9kZTtcclxuICAgIH1cclxuICAgIGFzeW5jIHdhbGtDb21wb25lbnRQYXJlbnRzKGluc3RhbmNlKSB7XHJcbiAgICAgICAgY29uc3QgcGF5bG9hZCA9IGF3YWl0IHRoaXMuY2FsbEhvb2soXCJ3YWxrQ29tcG9uZW50UGFyZW50c1wiIC8qIFdBTEtfQ09NUE9ORU5UX1BBUkVOVFMgKi8sIHtcclxuICAgICAgICAgICAgY29tcG9uZW50SW5zdGFuY2U6IGluc3RhbmNlLFxyXG4gICAgICAgICAgICBwYXJlbnRJbnN0YW5jZXM6IFtdLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBwYXlsb2FkLnBhcmVudEluc3RhbmNlcztcclxuICAgIH1cclxuICAgIGFzeW5jIGluc3BlY3RDb21wb25lbnQoaW5zdGFuY2UsIGFwcCkge1xyXG4gICAgICAgIGNvbnN0IHBheWxvYWQgPSBhd2FpdCB0aGlzLmNhbGxIb29rKFwiaW5zcGVjdENvbXBvbmVudFwiIC8qIElOU1BFQ1RfQ09NUE9ORU5UICovLCB7XHJcbiAgICAgICAgICAgIGFwcCxcclxuICAgICAgICAgICAgY29tcG9uZW50SW5zdGFuY2U6IGluc3RhbmNlLFxyXG4gICAgICAgICAgICBpbnN0YW5jZURhdGE6IG51bGwsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHBheWxvYWQuaW5zdGFuY2VEYXRhO1xyXG4gICAgfVxyXG4gICAgYXN5bmMgZ2V0Q29tcG9uZW50Qm91bmRzKGluc3RhbmNlKSB7XHJcbiAgICAgICAgY29uc3QgcGF5bG9hZCA9IGF3YWl0IHRoaXMuY2FsbEhvb2soXCJnZXRDb21wb25lbnRCb3VuZHNcIiAvKiBHRVRfQ09NUE9ORU5UX0JPVU5EUyAqLywge1xyXG4gICAgICAgICAgICBjb21wb25lbnRJbnN0YW5jZTogaW5zdGFuY2UsXHJcbiAgICAgICAgICAgIGJvdW5kczogbnVsbCxcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gcGF5bG9hZC5ib3VuZHM7XHJcbiAgICB9XHJcbiAgICBhc3luYyBnZXRDb21wb25lbnROYW1lKGluc3RhbmNlKSB7XHJcbiAgICAgICAgY29uc3QgcGF5bG9hZCA9IGF3YWl0IHRoaXMuY2FsbEhvb2soXCJnZXRDb21wb25lbnROYW1lXCIgLyogR0VUX0NPTVBPTkVOVF9OQU1FICovLCB7XHJcbiAgICAgICAgICAgIGNvbXBvbmVudEluc3RhbmNlOiBpbnN0YW5jZSxcclxuICAgICAgICAgICAgbmFtZTogbnVsbCxcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gcGF5bG9hZC5uYW1lO1xyXG4gICAgfVxyXG4gICAgYXN5bmMgZ2V0Q29tcG9uZW50SW5zdGFuY2VzKGFwcCkge1xyXG4gICAgICAgIGNvbnN0IHBheWxvYWQgPSBhd2FpdCB0aGlzLmNhbGxIb29rKFwiZ2V0Q29tcG9uZW50SW5zdGFuY2VzXCIgLyogR0VUX0NPTVBPTkVOVF9JTlNUQU5DRVMgKi8sIHtcclxuICAgICAgICAgICAgYXBwLFxyXG4gICAgICAgICAgICBjb21wb25lbnRJbnN0YW5jZXM6IFtdLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBwYXlsb2FkLmNvbXBvbmVudEluc3RhbmNlcztcclxuICAgIH1cclxuICAgIGFzeW5jIGdldEVsZW1lbnRDb21wb25lbnQoZWxlbWVudCkge1xyXG4gICAgICAgIGNvbnN0IHBheWxvYWQgPSBhd2FpdCB0aGlzLmNhbGxIb29rKFwiZ2V0RWxlbWVudENvbXBvbmVudFwiIC8qIEdFVF9FTEVNRU5UX0NPTVBPTkVOVCAqLywge1xyXG4gICAgICAgICAgICBlbGVtZW50LFxyXG4gICAgICAgICAgICBjb21wb25lbnRJbnN0YW5jZTogbnVsbCxcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gcGF5bG9hZC5jb21wb25lbnRJbnN0YW5jZTtcclxuICAgIH1cclxuICAgIGFzeW5jIGdldENvbXBvbmVudFJvb3RFbGVtZW50cyhpbnN0YW5jZSkge1xyXG4gICAgICAgIGNvbnN0IHBheWxvYWQgPSBhd2FpdCB0aGlzLmNhbGxIb29rKFwiZ2V0Q29tcG9uZW50Um9vdEVsZW1lbnRzXCIgLyogR0VUX0NPTVBPTkVOVF9ST09UX0VMRU1FTlRTICovLCB7XHJcbiAgICAgICAgICAgIGNvbXBvbmVudEluc3RhbmNlOiBpbnN0YW5jZSxcclxuICAgICAgICAgICAgcm9vdEVsZW1lbnRzOiBbXSxcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gcGF5bG9hZC5yb290RWxlbWVudHM7XHJcbiAgICB9XHJcbiAgICBhc3luYyBlZGl0Q29tcG9uZW50U3RhdGUoaW5zdGFuY2UsIGRvdFBhdGgsIHR5cGUsIHN0YXRlLCBhcHApIHtcclxuICAgICAgICBjb25zdCBhcnJheVBhdGggPSBkb3RQYXRoLnNwbGl0KCcuJyk7XHJcbiAgICAgICAgY29uc3QgcGF5bG9hZCA9IGF3YWl0IHRoaXMuY2FsbEhvb2soXCJlZGl0Q29tcG9uZW50U3RhdGVcIiAvKiBFRElUX0NPTVBPTkVOVF9TVEFURSAqLywge1xyXG4gICAgICAgICAgICBhcHAsXHJcbiAgICAgICAgICAgIGNvbXBvbmVudEluc3RhbmNlOiBpbnN0YW5jZSxcclxuICAgICAgICAgICAgcGF0aDogYXJyYXlQYXRoLFxyXG4gICAgICAgICAgICB0eXBlLFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgc2V0OiAob2JqZWN0LCBwYXRoID0gYXJyYXlQYXRoLCB2YWx1ZSA9IHN0YXRlLnZhbHVlLCBjYikgPT4gdGhpcy5zdGF0ZUVkaXRvci5zZXQob2JqZWN0LCBwYXRoLCB2YWx1ZSwgY2IgfHwgdGhpcy5zdGF0ZUVkaXRvci5jcmVhdGVEZWZhdWx0U2V0Q2FsbGJhY2soc3RhdGUpKSxcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gcGF5bG9hZC5jb21wb25lbnRJbnN0YW5jZTtcclxuICAgIH1cclxuICAgIGFzeW5jIGdldENvbXBvbmVudERldnRvb2xzT3B0aW9ucyhpbnN0YW5jZSkge1xyXG4gICAgICAgIGNvbnN0IHBheWxvYWQgPSBhd2FpdCB0aGlzLmNhbGxIb29rKFwiZ2V0QXBwRGV2dG9vbHNPcHRpb25zXCIgLyogR0VUX0NPTVBPTkVOVF9ERVZUT09MU19PUFRJT05TICovLCB7XHJcbiAgICAgICAgICAgIGNvbXBvbmVudEluc3RhbmNlOiBpbnN0YW5jZSxcclxuICAgICAgICAgICAgb3B0aW9uczogbnVsbCxcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gcGF5bG9hZC5vcHRpb25zIHx8IHt9O1xyXG4gICAgfVxyXG4gICAgYXN5bmMgZ2V0Q29tcG9uZW50UmVuZGVyQ29kZShpbnN0YW5jZSkge1xyXG4gICAgICAgIGNvbnN0IHBheWxvYWQgPSBhd2FpdCB0aGlzLmNhbGxIb29rKFwiZ2V0Q29tcG9uZW50UmVuZGVyQ29kZVwiIC8qIEdFVF9DT01QT05FTlRfUkVOREVSX0NPREUgKi8sIHtcclxuICAgICAgICAgICAgY29tcG9uZW50SW5zdGFuY2U6IGluc3RhbmNlLFxyXG4gICAgICAgICAgICBjb2RlOiBudWxsLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGNvZGU6IHBheWxvYWQuY29kZSxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgYXN5bmMgaW5zcGVjdFRpbWVsaW5lRXZlbnQoZXZlbnREYXRhLCBhcHApIHtcclxuICAgICAgICBjb25zdCBwYXlsb2FkID0gYXdhaXQgdGhpcy5jYWxsSG9vayhcImluc3BlY3RUaW1lbGluZUV2ZW50XCIgLyogSU5TUEVDVF9USU1FTElORV9FVkVOVCAqLywge1xyXG4gICAgICAgICAgICBldmVudDogZXZlbnREYXRhLmV2ZW50LFxyXG4gICAgICAgICAgICBsYXllcklkOiBldmVudERhdGEubGF5ZXJJZCxcclxuICAgICAgICAgICAgYXBwLFxyXG4gICAgICAgICAgICBkYXRhOiBldmVudERhdGEuZXZlbnQuZGF0YSxcclxuICAgICAgICAgICAgYWxsOiBldmVudERhdGEuYWxsLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBwYXlsb2FkLmRhdGE7XHJcbiAgICB9XHJcbiAgICBhc3luYyBjbGVhclRpbWVsaW5lKCkge1xyXG4gICAgICAgIGF3YWl0IHRoaXMuY2FsbEhvb2soXCJ0aW1lbGluZUNsZWFyZWRcIiAvKiBUSU1FTElORV9DTEVBUkVEICovLCB7fSk7XHJcbiAgICB9XHJcbiAgICBhc3luYyBnZXRJbnNwZWN0b3JUcmVlKGluc3BlY3RvcklkLCBhcHAsIGZpbHRlcikge1xyXG4gICAgICAgIGNvbnN0IHBheWxvYWQgPSBhd2FpdCB0aGlzLmNhbGxIb29rKFwiZ2V0SW5zcGVjdG9yVHJlZVwiIC8qIEdFVF9JTlNQRUNUT1JfVFJFRSAqLywge1xyXG4gICAgICAgICAgICBpbnNwZWN0b3JJZCxcclxuICAgICAgICAgICAgYXBwLFxyXG4gICAgICAgICAgICBmaWx0ZXIsXHJcbiAgICAgICAgICAgIHJvb3ROb2RlczogW10sXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHBheWxvYWQucm9vdE5vZGVzO1xyXG4gICAgfVxyXG4gICAgYXN5bmMgZ2V0SW5zcGVjdG9yU3RhdGUoaW5zcGVjdG9ySWQsIGFwcCwgbm9kZUlkKSB7XHJcbiAgICAgICAgY29uc3QgcGF5bG9hZCA9IGF3YWl0IHRoaXMuY2FsbEhvb2soXCJnZXRJbnNwZWN0b3JTdGF0ZVwiIC8qIEdFVF9JTlNQRUNUT1JfU1RBVEUgKi8sIHtcclxuICAgICAgICAgICAgaW5zcGVjdG9ySWQsXHJcbiAgICAgICAgICAgIGFwcCxcclxuICAgICAgICAgICAgbm9kZUlkLFxyXG4gICAgICAgICAgICBzdGF0ZTogbnVsbCxcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gcGF5bG9hZC5zdGF0ZTtcclxuICAgIH1cclxuICAgIGFzeW5jIGVkaXRJbnNwZWN0b3JTdGF0ZShpbnNwZWN0b3JJZCwgYXBwLCBub2RlSWQsIGRvdFBhdGgsIHR5cGUsIHN0YXRlKSB7XHJcbiAgICAgICAgY29uc3QgYXJyYXlQYXRoID0gZG90UGF0aC5zcGxpdCgnLicpO1xyXG4gICAgICAgIGF3YWl0IHRoaXMuY2FsbEhvb2soXCJlZGl0SW5zcGVjdG9yU3RhdGVcIiAvKiBFRElUX0lOU1BFQ1RPUl9TVEFURSAqLywge1xyXG4gICAgICAgICAgICBpbnNwZWN0b3JJZCxcclxuICAgICAgICAgICAgYXBwLFxyXG4gICAgICAgICAgICBub2RlSWQsXHJcbiAgICAgICAgICAgIHBhdGg6IGFycmF5UGF0aCxcclxuICAgICAgICAgICAgdHlwZSxcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIHNldDogKG9iamVjdCwgcGF0aCA9IGFycmF5UGF0aCwgdmFsdWUgPSBzdGF0ZS52YWx1ZSwgY2IpID0+IHRoaXMuc3RhdGVFZGl0b3Iuc2V0KG9iamVjdCwgcGF0aCwgdmFsdWUsIGNiIHx8IHRoaXMuc3RhdGVFZGl0b3IuY3JlYXRlRGVmYXVsdFNldENhbGxiYWNrKHN0YXRlKSksXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5EZXZ0b29sc0FwaSA9IERldnRvb2xzQXBpO1xyXG5jbGFzcyBEZXZ0b29sc1BsdWdpbkFwaUluc3RhbmNlIHtcclxuICAgIGNvbnN0cnVjdG9yKHBsdWdpbiwgYXBwUmVjb3JkLCBjdHgpIHtcclxuICAgICAgICB0aGlzLmJyaWRnZSA9IGN0eC5icmlkZ2U7XHJcbiAgICAgICAgdGhpcy5jdHggPSBjdHg7XHJcbiAgICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XHJcbiAgICAgICAgdGhpcy5hcHBSZWNvcmQgPSBhcHBSZWNvcmQ7XHJcbiAgICAgICAgdGhpcy5iYWNrZW5kQXBpID0gYXBwUmVjb3JkLmJhY2tlbmQuYXBpO1xyXG4gICAgICAgIHRoaXMuZGVmYXVsdFNldHRpbmdzID0gKDAsIHNoYXJlZF91dGlsc18xLmdldFBsdWdpbkRlZmF1bHRTZXR0aW5ncykocGx1Z2luLmRlc2NyaXB0b3Iuc2V0dGluZ3MpO1xyXG4gICAgICAgIHRoaXMub24gPSBuZXcgaG9va3NfMS5EZXZ0b29sc0hvb2thYmxlKGN0eCwgcGx1Z2luKTtcclxuICAgICAgICBwbHVnaW5Pbi5wdXNoKHRoaXMub24pO1xyXG4gICAgfVxyXG4gICAgLy8gUGx1Z2luIEFQSVxyXG4gICAgYXN5bmMgbm90aWZ5Q29tcG9uZW50VXBkYXRlKGluc3RhbmNlID0gbnVsbCkge1xyXG4gICAgICAgIGlmICghdGhpcy5lbmFibGVkIHx8ICF0aGlzLmhhc1Blcm1pc3Npb24oc2hhcmVkX3V0aWxzXzEuUGx1Z2luUGVybWlzc2lvbi5DT01QT05FTlRTKSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIGlmIChpbnN0YW5jZSkge1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5ob29rLmVtaXQoc2hhcmVkX3V0aWxzXzEuSG9va0V2ZW50cy5DT01QT05FTlRfVVBEQVRFRCwgLi4uYXdhaXQgdGhpcy5iYWNrZW5kQXBpLnRyYW5zZm9ybUNhbGwoc2hhcmVkX3V0aWxzXzEuSG9va0V2ZW50cy5DT01QT05FTlRfVVBEQVRFRCwgaW5zdGFuY2UpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4Lmhvb2suZW1pdChzaGFyZWRfdXRpbHNfMS5Ib29rRXZlbnRzLkNPTVBPTkVOVF9VUERBVEVEKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBhZGRUaW1lbGluZUxheWVyKG9wdGlvbnMpIHtcclxuICAgICAgICBpZiAoIXRoaXMuZW5hYmxlZCB8fCAhdGhpcy5oYXNQZXJtaXNzaW9uKHNoYXJlZF91dGlsc18xLlBsdWdpblBlcm1pc3Npb24uVElNRUxJTkUpKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5jdHguaG9vay5lbWl0KHNoYXJlZF91dGlsc18xLkhvb2tFdmVudHMuVElNRUxJTkVfTEFZRVJfQURERUQsIG9wdGlvbnMsIHRoaXMucGx1Z2luKTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIGFkZFRpbWVsaW5lRXZlbnQob3B0aW9ucykge1xyXG4gICAgICAgIGlmICghdGhpcy5lbmFibGVkIHx8ICF0aGlzLmhhc1Blcm1pc3Npb24oc2hhcmVkX3V0aWxzXzEuUGx1Z2luUGVybWlzc2lvbi5USU1FTElORSkpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB0aGlzLmN0eC5ob29rLmVtaXQoc2hhcmVkX3V0aWxzXzEuSG9va0V2ZW50cy5USU1FTElORV9FVkVOVF9BRERFRCwgb3B0aW9ucywgdGhpcy5wbHVnaW4pO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgYWRkSW5zcGVjdG9yKG9wdGlvbnMpIHtcclxuICAgICAgICBpZiAoIXRoaXMuZW5hYmxlZCB8fCAhdGhpcy5oYXNQZXJtaXNzaW9uKHNoYXJlZF91dGlsc18xLlBsdWdpblBlcm1pc3Npb24uQ1VTVE9NX0lOU1BFQ1RPUikpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB0aGlzLmN0eC5ob29rLmVtaXQoc2hhcmVkX3V0aWxzXzEuSG9va0V2ZW50cy5DVVNUT01fSU5TUEVDVE9SX0FERCwgb3B0aW9ucywgdGhpcy5wbHVnaW4pO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgc2VuZEluc3BlY3RvclRyZWUoaW5zcGVjdG9ySWQpIHtcclxuICAgICAgICBpZiAoIXRoaXMuZW5hYmxlZCB8fCAhdGhpcy5oYXNQZXJtaXNzaW9uKHNoYXJlZF91dGlsc18xLlBsdWdpblBlcm1pc3Npb24uQ1VTVE9NX0lOU1BFQ1RPUikpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB0aGlzLmN0eC5ob29rLmVtaXQoc2hhcmVkX3V0aWxzXzEuSG9va0V2ZW50cy5DVVNUT01fSU5TUEVDVE9SX1NFTkRfVFJFRSwgaW5zcGVjdG9ySWQsIHRoaXMucGx1Z2luKTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIHNlbmRJbnNwZWN0b3JTdGF0ZShpbnNwZWN0b3JJZCkge1xyXG4gICAgICAgIGlmICghdGhpcy5lbmFibGVkIHx8ICF0aGlzLmhhc1Blcm1pc3Npb24oc2hhcmVkX3V0aWxzXzEuUGx1Z2luUGVybWlzc2lvbi5DVVNUT01fSU5TUEVDVE9SKSlcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIHRoaXMuY3R4Lmhvb2suZW1pdChzaGFyZWRfdXRpbHNfMS5Ib29rRXZlbnRzLkNVU1RPTV9JTlNQRUNUT1JfU0VORF9TVEFURSwgaW5zcGVjdG9ySWQsIHRoaXMucGx1Z2luKTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIHNlbGVjdEluc3BlY3Rvck5vZGUoaW5zcGVjdG9ySWQsIG5vZGVJZCkge1xyXG4gICAgICAgIGlmICghdGhpcy5lbmFibGVkIHx8ICF0aGlzLmhhc1Blcm1pc3Npb24oc2hhcmVkX3V0aWxzXzEuUGx1Z2luUGVybWlzc2lvbi5DVVNUT01fSU5TUEVDVE9SKSlcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIHRoaXMuY3R4Lmhvb2suZW1pdChzaGFyZWRfdXRpbHNfMS5Ib29rRXZlbnRzLkNVU1RPTV9JTlNQRUNUT1JfU0VMRUNUX05PREUsIGluc3BlY3RvcklkLCBub2RlSWQsIHRoaXMucGx1Z2luKTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIGdldENvbXBvbmVudEJvdW5kcyhpbnN0YW5jZSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmJhY2tlbmRBcGkuZ2V0Q29tcG9uZW50Qm91bmRzKGluc3RhbmNlKTtcclxuICAgIH1cclxuICAgIGdldENvbXBvbmVudE5hbWUoaW5zdGFuY2UpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5iYWNrZW5kQXBpLmdldENvbXBvbmVudE5hbWUoaW5zdGFuY2UpO1xyXG4gICAgfVxyXG4gICAgZ2V0Q29tcG9uZW50SW5zdGFuY2VzKGFwcCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmJhY2tlbmRBcGkuZ2V0Q29tcG9uZW50SW5zdGFuY2VzKGFwcCk7XHJcbiAgICB9XHJcbiAgICBoaWdobGlnaHRFbGVtZW50KGluc3RhbmNlKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmVuYWJsZWQgfHwgIXRoaXMuaGFzUGVybWlzc2lvbihzaGFyZWRfdXRpbHNfMS5QbHVnaW5QZXJtaXNzaW9uLkNPTVBPTkVOVFMpKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5jdHguaG9vay5lbWl0KHNoYXJlZF91dGlsc18xLkhvb2tFdmVudHMuQ09NUE9ORU5UX0hJR0hMSUdIVCwgaW5zdGFuY2UuX19WVUVfREVWVE9PTFNfVUlEX18sIHRoaXMucGx1Z2luKTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIHVuaGlnaGxpZ2h0RWxlbWVudCgpIHtcclxuICAgICAgICBpZiAoIXRoaXMuZW5hYmxlZCB8fCAhdGhpcy5oYXNQZXJtaXNzaW9uKHNoYXJlZF91dGlsc18xLlBsdWdpblBlcm1pc3Npb24uQ09NUE9ORU5UUykpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB0aGlzLmN0eC5ob29rLmVtaXQoc2hhcmVkX3V0aWxzXzEuSG9va0V2ZW50cy5DT01QT05FTlRfVU5ISUdITElHSFQsIHRoaXMucGx1Z2luKTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIGdldFNldHRpbmdzKHBsdWdpbklkKSB7XHJcbiAgICAgICAgcmV0dXJuICgwLCBzaGFyZWRfdXRpbHNfMS5nZXRQbHVnaW5TZXR0aW5ncykocGx1Z2luSWQgIT09IG51bGwgJiYgcGx1Z2luSWQgIT09IHZvaWQgMCA/IHBsdWdpbklkIDogdGhpcy5wbHVnaW4uZGVzY3JpcHRvci5pZCwgdGhpcy5kZWZhdWx0U2V0dGluZ3MpO1xyXG4gICAgfVxyXG4gICAgc2V0U2V0dGluZ3ModmFsdWUsIHBsdWdpbklkKSB7XHJcbiAgICAgICAgKDAsIHNoYXJlZF91dGlsc18xLnNldFBsdWdpblNldHRpbmdzKShwbHVnaW5JZCAhPT0gbnVsbCAmJiBwbHVnaW5JZCAhPT0gdm9pZCAwID8gcGx1Z2luSWQgOiB0aGlzLnBsdWdpbi5kZXNjcmlwdG9yLmlkLCB2YWx1ZSk7XHJcbiAgICB9XHJcbiAgICBnZXQgZW5hYmxlZCgpIHtcclxuICAgICAgICByZXR1cm4gKDAsIHNoYXJlZF91dGlsc18xLmhhc1BsdWdpblBlcm1pc3Npb24pKHRoaXMucGx1Z2luLmRlc2NyaXB0b3IuaWQsIHNoYXJlZF91dGlsc18xLlBsdWdpblBlcm1pc3Npb24uRU5BQkxFRCk7XHJcbiAgICB9XHJcbiAgICBoYXNQZXJtaXNzaW9uKHBlcm1pc3Npb24pIHtcclxuICAgICAgICByZXR1cm4gKDAsIHNoYXJlZF91dGlsc18xLmhhc1BsdWdpblBlcm1pc3Npb24pKHRoaXMucGx1Z2luLmRlc2NyaXB0b3IuaWQsIHBlcm1pc3Npb24pO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuRGV2dG9vbHNQbHVnaW5BcGlJbnN0YW5jZSA9IERldnRvb2xzUGx1Z2luQXBpSW5zdGFuY2U7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwaS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLmNyZWF0ZUJhY2tlbmRDb250ZXh0ID0gdm9pZCAwO1xyXG5mdW5jdGlvbiBjcmVhdGVCYWNrZW5kQ29udGV4dChvcHRpb25zKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGJyaWRnZTogb3B0aW9ucy5icmlkZ2UsXHJcbiAgICAgICAgaG9vazogb3B0aW9ucy5ob29rLFxyXG4gICAgICAgIGJhY2tlbmRzOiBbXSxcclxuICAgICAgICBhcHBSZWNvcmRzOiBbXSxcclxuICAgICAgICBjdXJyZW50VGFiOiBudWxsLFxyXG4gICAgICAgIGN1cnJlbnRBcHBSZWNvcmQ6IG51bGwsXHJcbiAgICAgICAgY3VycmVudEluc3BlY3RlZENvbXBvbmVudElkOiBudWxsLFxyXG4gICAgICAgIHBsdWdpbnM6IFtdLFxyXG4gICAgICAgIGN1cnJlbnRQbHVnaW46IG51bGwsXHJcbiAgICAgICAgdGltZWxpbmVMYXllcnM6IFtdLFxyXG4gICAgICAgIG5leHRUaW1lbGluZUV2ZW50SWQ6IDAsXHJcbiAgICAgICAgdGltZWxpbmVFdmVudE1hcDogbmV3IE1hcCgpLFxyXG4gICAgICAgIHBlcmZVbmlxdWVHcm91cElkOiAwLFxyXG4gICAgICAgIGN1c3RvbUluc3BlY3RvcnM6IFtdLFxyXG4gICAgICAgIHRpbWVsaW5lTWFya2VyczogW10sXHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuY3JlYXRlQmFja2VuZENvbnRleHQgPSBjcmVhdGVCYWNrZW5kQ29udGV4dDtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YmFja2VuZC1jb250ZXh0LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuY3JlYXRlQmFja2VuZCA9IGV4cG9ydHMuZGVmaW5lQmFja2VuZCA9IGV4cG9ydHMuQnVpbHRpbkJhY2tlbmRGZWF0dXJlID0gdm9pZCAwO1xyXG5jb25zdCBhcGlfMSA9IHJlcXVpcmUoXCIuL2FwaVwiKTtcclxudmFyIEJ1aWx0aW5CYWNrZW5kRmVhdHVyZTtcclxuKGZ1bmN0aW9uIChCdWlsdGluQmFja2VuZEZlYXR1cmUpIHtcclxuICAgIC8qKlxyXG4gICAgICogQGRlcHJlY2F0ZWRcclxuICAgICAqL1xyXG4gICAgQnVpbHRpbkJhY2tlbmRGZWF0dXJlW1wiRkxVU0hcIl0gPSBcImZsdXNoXCI7XHJcbn0pKEJ1aWx0aW5CYWNrZW5kRmVhdHVyZSA9IGV4cG9ydHMuQnVpbHRpbkJhY2tlbmRGZWF0dXJlIHx8IChleHBvcnRzLkJ1aWx0aW5CYWNrZW5kRmVhdHVyZSA9IHt9KSk7XHJcbmZ1bmN0aW9uIGRlZmluZUJhY2tlbmQob3B0aW9ucykge1xyXG4gICAgcmV0dXJuIG9wdGlvbnM7XHJcbn1cclxuZXhwb3J0cy5kZWZpbmVCYWNrZW5kID0gZGVmaW5lQmFja2VuZDtcclxuZnVuY3Rpb24gY3JlYXRlQmFja2VuZChvcHRpb25zLCBjdHgpIHtcclxuICAgIGNvbnN0IGJhY2tlbmQgPSB7XHJcbiAgICAgICAgb3B0aW9ucyxcclxuICAgICAgICBhcGk6IG51bGwsXHJcbiAgICB9O1xyXG4gICAgYmFja2VuZC5hcGkgPSBuZXcgYXBpXzEuRGV2dG9vbHNBcGkoYmFja2VuZCwgY3R4KTtcclxuICAgIG9wdGlvbnMuc2V0dXAoYmFja2VuZC5hcGkpO1xyXG4gICAgcmV0dXJuIGJhY2tlbmQ7XHJcbn1cclxuZXhwb3J0cy5jcmVhdGVCYWNrZW5kID0gY3JlYXRlQmFja2VuZDtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YmFja2VuZC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L2Jhbi10eXBlcyAqL1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWdsb2JhbC1ob29rLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuRGV2dG9vbHNIb29rYWJsZSA9IHZvaWQgMDtcclxuY29uc3Qgc2hhcmVkX3V0aWxzXzEgPSByZXF1aXJlKFwiQHZ1ZS1kZXZ0b29scy9zaGFyZWQtdXRpbHNcIik7XHJcbmNsYXNzIERldnRvb2xzSG9va2FibGUge1xyXG4gICAgY29uc3RydWN0b3IoY3R4LCBwbHVnaW4gPSBudWxsKSB7XHJcbiAgICAgICAgdGhpcy5oYW5kbGVycyA9IHt9O1xyXG4gICAgICAgIHRoaXMuY3R4ID0gY3R4O1xyXG4gICAgICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xyXG4gICAgfVxyXG4gICAgaG9vayhldmVudFR5cGUsIGhhbmRsZXIsIHBsdWdpblBlcm1pc2lvbiA9IG51bGwpIHtcclxuICAgICAgICBjb25zdCBoYW5kbGVycyA9ICh0aGlzLmhhbmRsZXJzW2V2ZW50VHlwZV0gPSB0aGlzLmhhbmRsZXJzW2V2ZW50VHlwZV0gfHwgW10pO1xyXG4gICAgICAgIGlmICh0aGlzLnBsdWdpbikge1xyXG4gICAgICAgICAgICBjb25zdCBvcmlnaW5hbEhhbmRsZXIgPSBoYW5kbGVyO1xyXG4gICAgICAgICAgICBoYW5kbGVyID0gKC4uLmFyZ3MpID0+IHtcclxuICAgICAgICAgICAgICAgIC8vIFBsdWdpbiBwZXJtaXNzaW9uXHJcbiAgICAgICAgICAgICAgICBpZiAoISgwLCBzaGFyZWRfdXRpbHNfMS5oYXNQbHVnaW5QZXJtaXNzaW9uKSh0aGlzLnBsdWdpbi5kZXNjcmlwdG9yLmlkLCBzaGFyZWRfdXRpbHNfMS5QbHVnaW5QZXJtaXNzaW9uLkVOQUJMRUQpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgKHBsdWdpblBlcm1pc2lvbiAmJiAhKDAsIHNoYXJlZF91dGlsc18xLmhhc1BsdWdpblBlcm1pc3Npb24pKHRoaXMucGx1Z2luLmRlc2NyaXB0b3IuaWQsIHBsdWdpblBlcm1pc2lvbikpKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIC8vIEFwcCBzY29wZVxyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLnBsdWdpbi5kZXNjcmlwdG9yLmRpc2FibGVBcHBTY29wZSAmJlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3R4LmN1cnJlbnRBcHBSZWNvcmQub3B0aW9ucy5hcHAgIT09IHRoaXMucGx1Z2luLmRlc2NyaXB0b3IuYXBwKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIC8vIFBsdWdpbiBzY29wZVxyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLnBsdWdpbi5kZXNjcmlwdG9yLmRpc2FibGVQbHVnaW5TY29wZSAmJlxyXG4gICAgICAgICAgICAgICAgICAgIGFyZ3NbMF0ucGx1Z2luSWQgIT0gbnVsbCAmJiBhcmdzWzBdLnBsdWdpbklkICE9PSB0aGlzLnBsdWdpbi5kZXNjcmlwdG9yLmlkKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvcmlnaW5hbEhhbmRsZXIoLi4uYXJncyk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGhhbmRsZXJzLnB1c2goe1xyXG4gICAgICAgICAgICBoYW5kbGVyLFxyXG4gICAgICAgICAgICBwbHVnaW46IHRoaXMuY3R4LmN1cnJlbnRQbHVnaW4sXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBhc3luYyBjYWxsSGFuZGxlcnMoZXZlbnRUeXBlLCBwYXlsb2FkLCBjdHgpIHtcclxuICAgICAgICBpZiAodGhpcy5oYW5kbGVyc1tldmVudFR5cGVdKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGhhbmRsZXJzID0gdGhpcy5oYW5kbGVyc1tldmVudFR5cGVdO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhhbmRsZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB7IGhhbmRsZXIsIHBsdWdpbiB9ID0gaGFuZGxlcnNbaV07XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGhhbmRsZXIocGF5bG9hZCwgY3R4KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgQW4gZXJyb3Igb2NjdXJyZWQgaW4gaG9vayAke2V2ZW50VHlwZX0ke3BsdWdpbiA/IGAgcmVnaXN0ZXJlZCBieSBwbHVnaW4gJHtwbHVnaW4uZGVzY3JpcHRvci5pZH1gIDogJyd9YCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcGF5bG9hZDtcclxuICAgIH1cclxuICAgIHRyYW5zZm9ybUNhbGwoaGFuZGxlcikge1xyXG4gICAgICAgIHRoaXMuaG9vayhcInRyYW5zZm9ybUNhbGxcIiAvKiBUUkFOU0ZPUk1fQ0FMTCAqLywgaGFuZGxlcik7XHJcbiAgICB9XHJcbiAgICBnZXRBcHBSZWNvcmROYW1lKGhhbmRsZXIpIHtcclxuICAgICAgICB0aGlzLmhvb2soXCJnZXRBcHBSZWNvcmROYW1lXCIgLyogR0VUX0FQUF9SRUNPUkRfTkFNRSAqLywgaGFuZGxlcik7XHJcbiAgICB9XHJcbiAgICBnZXRBcHBSb290SW5zdGFuY2UoaGFuZGxlcikge1xyXG4gICAgICAgIHRoaXMuaG9vayhcImdldEFwcFJvb3RJbnN0YW5jZVwiIC8qIEdFVF9BUFBfUk9PVF9JTlNUQU5DRSAqLywgaGFuZGxlcik7XHJcbiAgICB9XHJcbiAgICByZWdpc3RlckFwcGxpY2F0aW9uKGhhbmRsZXIpIHtcclxuICAgICAgICB0aGlzLmhvb2soXCJyZWdpc3RlckFwcGxpY2F0aW9uXCIgLyogUkVHSVNURVJfQVBQTElDQVRJT04gKi8sIGhhbmRsZXIpO1xyXG4gICAgfVxyXG4gICAgd2Fsa0NvbXBvbmVudFRyZWUoaGFuZGxlcikge1xyXG4gICAgICAgIHRoaXMuaG9vayhcIndhbGtDb21wb25lbnRUcmVlXCIgLyogV0FMS19DT01QT05FTlRfVFJFRSAqLywgaGFuZGxlciwgc2hhcmVkX3V0aWxzXzEuUGx1Z2luUGVybWlzc2lvbi5DT01QT05FTlRTKTtcclxuICAgIH1cclxuICAgIHZpc2l0Q29tcG9uZW50VHJlZShoYW5kbGVyKSB7XHJcbiAgICAgICAgdGhpcy5ob29rKFwidmlzaXRDb21wb25lbnRUcmVlXCIgLyogVklTSVRfQ09NUE9ORU5UX1RSRUUgKi8sIGhhbmRsZXIsIHNoYXJlZF91dGlsc18xLlBsdWdpblBlcm1pc3Npb24uQ09NUE9ORU5UUyk7XHJcbiAgICB9XHJcbiAgICB3YWxrQ29tcG9uZW50UGFyZW50cyhoYW5kbGVyKSB7XHJcbiAgICAgICAgdGhpcy5ob29rKFwid2Fsa0NvbXBvbmVudFBhcmVudHNcIiAvKiBXQUxLX0NPTVBPTkVOVF9QQVJFTlRTICovLCBoYW5kbGVyLCBzaGFyZWRfdXRpbHNfMS5QbHVnaW5QZXJtaXNzaW9uLkNPTVBPTkVOVFMpO1xyXG4gICAgfVxyXG4gICAgaW5zcGVjdENvbXBvbmVudChoYW5kbGVyKSB7XHJcbiAgICAgICAgdGhpcy5ob29rKFwiaW5zcGVjdENvbXBvbmVudFwiIC8qIElOU1BFQ1RfQ09NUE9ORU5UICovLCBoYW5kbGVyLCBzaGFyZWRfdXRpbHNfMS5QbHVnaW5QZXJtaXNzaW9uLkNPTVBPTkVOVFMpO1xyXG4gICAgfVxyXG4gICAgZ2V0Q29tcG9uZW50Qm91bmRzKGhhbmRsZXIpIHtcclxuICAgICAgICB0aGlzLmhvb2soXCJnZXRDb21wb25lbnRCb3VuZHNcIiAvKiBHRVRfQ09NUE9ORU5UX0JPVU5EUyAqLywgaGFuZGxlciwgc2hhcmVkX3V0aWxzXzEuUGx1Z2luUGVybWlzc2lvbi5DT01QT05FTlRTKTtcclxuICAgIH1cclxuICAgIGdldENvbXBvbmVudE5hbWUoaGFuZGxlcikge1xyXG4gICAgICAgIHRoaXMuaG9vayhcImdldENvbXBvbmVudE5hbWVcIiAvKiBHRVRfQ09NUE9ORU5UX05BTUUgKi8sIGhhbmRsZXIsIHNoYXJlZF91dGlsc18xLlBsdWdpblBlcm1pc3Npb24uQ09NUE9ORU5UUyk7XHJcbiAgICB9XHJcbiAgICBnZXRDb21wb25lbnRJbnN0YW5jZXMoaGFuZGxlcikge1xyXG4gICAgICAgIHRoaXMuaG9vayhcImdldENvbXBvbmVudEluc3RhbmNlc1wiIC8qIEdFVF9DT01QT05FTlRfSU5TVEFOQ0VTICovLCBoYW5kbGVyLCBzaGFyZWRfdXRpbHNfMS5QbHVnaW5QZXJtaXNzaW9uLkNPTVBPTkVOVFMpO1xyXG4gICAgfVxyXG4gICAgZ2V0RWxlbWVudENvbXBvbmVudChoYW5kbGVyKSB7XHJcbiAgICAgICAgdGhpcy5ob29rKFwiZ2V0RWxlbWVudENvbXBvbmVudFwiIC8qIEdFVF9FTEVNRU5UX0NPTVBPTkVOVCAqLywgaGFuZGxlciwgc2hhcmVkX3V0aWxzXzEuUGx1Z2luUGVybWlzc2lvbi5DT01QT05FTlRTKTtcclxuICAgIH1cclxuICAgIGdldENvbXBvbmVudFJvb3RFbGVtZW50cyhoYW5kbGVyKSB7XHJcbiAgICAgICAgdGhpcy5ob29rKFwiZ2V0Q29tcG9uZW50Um9vdEVsZW1lbnRzXCIgLyogR0VUX0NPTVBPTkVOVF9ST09UX0VMRU1FTlRTICovLCBoYW5kbGVyLCBzaGFyZWRfdXRpbHNfMS5QbHVnaW5QZXJtaXNzaW9uLkNPTVBPTkVOVFMpO1xyXG4gICAgfVxyXG4gICAgZWRpdENvbXBvbmVudFN0YXRlKGhhbmRsZXIpIHtcclxuICAgICAgICB0aGlzLmhvb2soXCJlZGl0Q29tcG9uZW50U3RhdGVcIiAvKiBFRElUX0NPTVBPTkVOVF9TVEFURSAqLywgaGFuZGxlciwgc2hhcmVkX3V0aWxzXzEuUGx1Z2luUGVybWlzc2lvbi5DT01QT05FTlRTKTtcclxuICAgIH1cclxuICAgIGdldENvbXBvbmVudERldnRvb2xzT3B0aW9ucyhoYW5kbGVyKSB7XHJcbiAgICAgICAgdGhpcy5ob29rKFwiZ2V0QXBwRGV2dG9vbHNPcHRpb25zXCIgLyogR0VUX0NPTVBPTkVOVF9ERVZUT09MU19PUFRJT05TICovLCBoYW5kbGVyLCBzaGFyZWRfdXRpbHNfMS5QbHVnaW5QZXJtaXNzaW9uLkNPTVBPTkVOVFMpO1xyXG4gICAgfVxyXG4gICAgZ2V0Q29tcG9uZW50UmVuZGVyQ29kZShoYW5kbGVyKSB7XHJcbiAgICAgICAgdGhpcy5ob29rKFwiZ2V0Q29tcG9uZW50UmVuZGVyQ29kZVwiIC8qIEdFVF9DT01QT05FTlRfUkVOREVSX0NPREUgKi8sIGhhbmRsZXIsIHNoYXJlZF91dGlsc18xLlBsdWdpblBlcm1pc3Npb24uQ09NUE9ORU5UUyk7XHJcbiAgICB9XHJcbiAgICBpbnNwZWN0VGltZWxpbmVFdmVudChoYW5kbGVyKSB7XHJcbiAgICAgICAgdGhpcy5ob29rKFwiaW5zcGVjdFRpbWVsaW5lRXZlbnRcIiAvKiBJTlNQRUNUX1RJTUVMSU5FX0VWRU5UICovLCBoYW5kbGVyLCBzaGFyZWRfdXRpbHNfMS5QbHVnaW5QZXJtaXNzaW9uLlRJTUVMSU5FKTtcclxuICAgIH1cclxuICAgIHRpbWVsaW5lQ2xlYXJlZChoYW5kbGVyKSB7XHJcbiAgICAgICAgdGhpcy5ob29rKFwidGltZWxpbmVDbGVhcmVkXCIgLyogVElNRUxJTkVfQ0xFQVJFRCAqLywgaGFuZGxlciwgc2hhcmVkX3V0aWxzXzEuUGx1Z2luUGVybWlzc2lvbi5USU1FTElORSk7XHJcbiAgICB9XHJcbiAgICBnZXRJbnNwZWN0b3JUcmVlKGhhbmRsZXIpIHtcclxuICAgICAgICB0aGlzLmhvb2soXCJnZXRJbnNwZWN0b3JUcmVlXCIgLyogR0VUX0lOU1BFQ1RPUl9UUkVFICovLCBoYW5kbGVyLCBzaGFyZWRfdXRpbHNfMS5QbHVnaW5QZXJtaXNzaW9uLkNVU1RPTV9JTlNQRUNUT1IpO1xyXG4gICAgfVxyXG4gICAgZ2V0SW5zcGVjdG9yU3RhdGUoaGFuZGxlcikge1xyXG4gICAgICAgIHRoaXMuaG9vayhcImdldEluc3BlY3RvclN0YXRlXCIgLyogR0VUX0lOU1BFQ1RPUl9TVEFURSAqLywgaGFuZGxlciwgc2hhcmVkX3V0aWxzXzEuUGx1Z2luUGVybWlzc2lvbi5DVVNUT01fSU5TUEVDVE9SKTtcclxuICAgIH1cclxuICAgIGVkaXRJbnNwZWN0b3JTdGF0ZShoYW5kbGVyKSB7XHJcbiAgICAgICAgdGhpcy5ob29rKFwiZWRpdEluc3BlY3RvclN0YXRlXCIgLyogRURJVF9JTlNQRUNUT1JfU1RBVEUgKi8sIGhhbmRsZXIsIHNoYXJlZF91dGlsc18xLlBsdWdpblBlcm1pc3Npb24uQ1VTVE9NX0lOU1BFQ1RPUik7XHJcbiAgICB9XHJcbiAgICBzZXRQbHVnaW5TZXR0aW5ncyhoYW5kbGVyKSB7XHJcbiAgICAgICAgdGhpcy5ob29rKFwic2V0UGx1Z2luU2V0dGluZ3NcIiAvKiBTRVRfUExVR0lOX1NFVFRJTkdTICovLCBoYW5kbGVyKTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkRldnRvb2xzSG9va2FibGUgPSBEZXZ0b29sc0hvb2thYmxlO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1ob29rcy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIF9fY3JlYXRlQmluZGluZyA9ICh0aGlzICYmIHRoaXMuX19jcmVhdGVCaW5kaW5nKSB8fCAoT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xyXG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvLCBrMiwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbVtrXTsgfSB9KTtcclxufSkgOiAoZnVuY3Rpb24obywgbSwgaywgazIpIHtcclxuICAgIGlmIChrMiA9PT0gdW5kZWZpbmVkKSBrMiA9IGs7XHJcbiAgICBvW2syXSA9IG1ba107XHJcbn0pKTtcclxudmFyIF9fZXhwb3J0U3RhciA9ICh0aGlzICYmIHRoaXMuX19leHBvcnRTdGFyKSB8fCBmdW5jdGlvbihtLCBleHBvcnRzKSB7XHJcbiAgICBmb3IgKHZhciBwIGluIG0pIGlmIChwICE9PSBcImRlZmF1bHRcIiAmJiAhT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGV4cG9ydHMsIHApKSBfX2NyZWF0ZUJpbmRpbmcoZXhwb3J0cywgbSwgcCk7XHJcbn07XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL2FwaVwiKSwgZXhwb3J0cyk7XHJcbl9fZXhwb3J0U3RhcihyZXF1aXJlKFwiLi9hcHAtcmVjb3JkXCIpLCBleHBvcnRzKTtcclxuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL2JhY2tlbmRcIiksIGV4cG9ydHMpO1xyXG5fX2V4cG9ydFN0YXIocmVxdWlyZShcIi4vYmFja2VuZC1jb250ZXh0XCIpLCBleHBvcnRzKTtcclxuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL2dsb2JhbC1ob29rXCIpLCBleHBvcnRzKTtcclxuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL2hvb2tzXCIpLCBleHBvcnRzKTtcclxuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuL3BsdWdpblwiKSwgZXhwb3J0cyk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcclxuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xyXG59O1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuX2xlZ2FjeV9nZXRBbmRSZWdpc3RlckFwcHMgPSBleHBvcnRzLnJlbW92ZUFwcCA9IGV4cG9ydHMuc2VuZEFwcHMgPSBleHBvcnRzLndhaXRGb3JBcHBzUmVnaXN0cmF0aW9uID0gZXhwb3J0cy5nZXRBcHBSZWNvcmQgPSBleHBvcnRzLmdldEFwcFJlY29yZElkID0gZXhwb3J0cy5tYXBBcHBSZWNvcmQgPSBleHBvcnRzLnNlbGVjdEFwcCA9IGV4cG9ydHMucmVnaXN0ZXJBcHAgPSB2b2lkIDA7XHJcbmNvbnN0IHNoYXJlZF91dGlsc18xID0gcmVxdWlyZShcIkB2dWUtZGV2dG9vbHMvc2hhcmVkLXV0aWxzXCIpO1xyXG5jb25zdCBzcGVha2luZ3VybF8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJzcGVha2luZ3VybFwiKSk7XHJcbmNvbnN0IHF1ZXVlXzEgPSByZXF1aXJlKFwiLi91dGlsL3F1ZXVlXCIpO1xyXG5jb25zdCBzY2FuXzEgPSByZXF1aXJlKFwiLi9sZWdhY3kvc2NhblwiKTtcclxuY29uc3QgdGltZWxpbmVfMSA9IHJlcXVpcmUoXCIuL3RpbWVsaW5lXCIpO1xyXG5jb25zdCBiYWNrZW5kXzEgPSByZXF1aXJlKFwiLi9iYWNrZW5kXCIpO1xyXG5jb25zdCBqb2JzID0gbmV3IHF1ZXVlXzEuSm9iUXVldWUoKTtcclxubGV0IHJlY29yZElkID0gMDtcclxuY29uc3QgYXBwUmVjb3JkUHJvbWlzZXMgPSBuZXcgTWFwKCk7XHJcbmFzeW5jIGZ1bmN0aW9uIHJlZ2lzdGVyQXBwKG9wdGlvbnMsIGN0eCkge1xyXG4gICAgcmV0dXJuIGpvYnMucXVldWUoKCkgPT4gcmVnaXN0ZXJBcHBKb2Iob3B0aW9ucywgY3R4KSk7XHJcbn1cclxuZXhwb3J0cy5yZWdpc3RlckFwcCA9IHJlZ2lzdGVyQXBwO1xyXG5hc3luYyBmdW5jdGlvbiByZWdpc3RlckFwcEpvYihvcHRpb25zLCBjdHgpIHtcclxuICAgIC8vIERlZHVwZVxyXG4gICAgaWYgKGN0eC5hcHBSZWNvcmRzLmZpbmQoYSA9PiBhLm9wdGlvbnMgPT09IG9wdGlvbnMpKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgLy8gRmluZCBjb3JyZWN0IGJhY2tlbmRcclxuICAgIGNvbnN0IGJhc2VGcmFtZXdvcmtWZXJzaW9uID0gcGFyc2VJbnQob3B0aW9ucy52ZXJzaW9uLnN1YnN0cigwLCBvcHRpb25zLnZlcnNpb24uaW5kZXhPZignLicpKSk7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJhY2tlbmRfMS5hdmFpbGFibGVCYWNrZW5kcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGNvbnN0IGJhY2tlbmRPcHRpb25zID0gYmFja2VuZF8xLmF2YWlsYWJsZUJhY2tlbmRzW2ldO1xyXG4gICAgICAgIGlmIChiYWNrZW5kT3B0aW9ucy5mcmFtZXdvcmtWZXJzaW9uID09PSBiYXNlRnJhbWV3b3JrVmVyc2lvbikge1xyXG4gICAgICAgICAgICAvLyBFbmFibGUgYmFja2VuZCBpZiBpdCdzIG5vdCBlbmFibGVkXHJcbiAgICAgICAgICAgIGNvbnN0IGJhY2tlbmQgPSAoMCwgYmFja2VuZF8xLmdldEJhY2tlbmQpKGJhY2tlbmRPcHRpb25zLCBjdHgpO1xyXG4gICAgICAgICAgICBhd2FpdCBjcmVhdGVBcHBSZWNvcmQob3B0aW9ucywgYmFja2VuZCwgY3R4KTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUFwcFJlY29yZChvcHRpb25zLCBiYWNrZW5kLCBjdHgpIHtcclxuICAgIHZhciBfYTtcclxuICAgIGNvbnN0IHJvb3RJbnN0YW5jZSA9IGF3YWl0IGJhY2tlbmQuYXBpLmdldEFwcFJvb3RJbnN0YW5jZShvcHRpb25zLmFwcCk7XHJcbiAgICBpZiAocm9vdEluc3RhbmNlKSB7XHJcbiAgICAgICAgaWYgKChhd2FpdCBiYWNrZW5kLmFwaS5nZXRDb21wb25lbnREZXZ0b29sc09wdGlvbnMocm9vdEluc3RhbmNlKSkuaGlkZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJlY29yZElkKys7XHJcbiAgICAgICAgY29uc3QgbmFtZSA9IGF3YWl0IGJhY2tlbmQuYXBpLmdldEFwcFJlY29yZE5hbWUob3B0aW9ucy5hcHAsIHJlY29yZElkLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgIGNvbnN0IGlkID0gZ2V0QXBwUmVjb3JkSWQob3B0aW9ucy5hcHAsICgwLCBzcGVha2luZ3VybF8xLmRlZmF1bHQpKG5hbWUpKTtcclxuICAgICAgICBjb25zdCBbZWxdID0gYXdhaXQgYmFja2VuZC5hcGkuZ2V0Q29tcG9uZW50Um9vdEVsZW1lbnRzKHJvb3RJbnN0YW5jZSk7XHJcbiAgICAgICAgY29uc3QgcmVjb3JkID0ge1xyXG4gICAgICAgICAgICBpZCxcclxuICAgICAgICAgICAgbmFtZSxcclxuICAgICAgICAgICAgb3B0aW9ucyxcclxuICAgICAgICAgICAgYmFja2VuZCxcclxuICAgICAgICAgICAgbGFzdEluc3BlY3RlZENvbXBvbmVudElkOiBudWxsLFxyXG4gICAgICAgICAgICBpbnN0YW5jZU1hcDogbmV3IE1hcCgpLFxyXG4gICAgICAgICAgICByb290SW5zdGFuY2UsXHJcbiAgICAgICAgICAgIHBlcmZHcm91cElkczogbmV3IE1hcCgpLFxyXG4gICAgICAgICAgICBpZnJhbWU6IGRvY3VtZW50ICE9PSBlbC5vd25lckRvY3VtZW50ID8gZWwub3duZXJEb2N1bWVudC5sb2NhdGlvbi5wYXRobmFtZSA6IG51bGwsXHJcbiAgICAgICAgICAgIG1ldGE6IChfYSA9IG9wdGlvbnMubWV0YSkgIT09IG51bGwgJiYgX2EgIT09IHZvaWQgMCA/IF9hIDoge30sXHJcbiAgICAgICAgfTtcclxuICAgICAgICBvcHRpb25zLmFwcC5fX1ZVRV9ERVZUT09MU19BUFBfUkVDT1JEX18gPSByZWNvcmQ7XHJcbiAgICAgICAgY29uc3Qgcm9vdElkID0gYCR7cmVjb3JkLmlkfTpyb290YDtcclxuICAgICAgICByZWNvcmQuaW5zdGFuY2VNYXAuc2V0KHJvb3RJZCwgcmVjb3JkLnJvb3RJbnN0YW5jZSk7XHJcbiAgICAgICAgcmVjb3JkLnJvb3RJbnN0YW5jZS5fX1ZVRV9ERVZUT09MU19VSURfXyA9IHJvb3RJZDtcclxuICAgICAgICAvLyBUaW1lbGluZVxyXG4gICAgICAgICgwLCB0aW1lbGluZV8xLmFkZEJ1aWx0aW5MYXllcnMpKHJlY29yZCwgY3R4KTtcclxuICAgICAgICBjdHguYXBwUmVjb3Jkcy5wdXNoKHJlY29yZCk7XHJcbiAgICAgICAgaWYgKGJhY2tlbmQub3B0aW9ucy5zZXR1cEFwcCkge1xyXG4gICAgICAgICAgICBiYWNrZW5kLm9wdGlvbnMuc2V0dXBBcHAoYmFja2VuZC5hcGksIHJlY29yZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGF3YWl0IGJhY2tlbmQuYXBpLnJlZ2lzdGVyQXBwbGljYXRpb24ob3B0aW9ucy5hcHApO1xyXG4gICAgICAgIGN0eC5icmlkZ2Uuc2VuZChzaGFyZWRfdXRpbHNfMS5CcmlkZ2VFdmVudHMuVE9fRlJPTlRfQVBQX0FERCwge1xyXG4gICAgICAgICAgICBhcHBSZWNvcmQ6IG1hcEFwcFJlY29yZChyZWNvcmQpLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGlmIChhcHBSZWNvcmRQcm9taXNlcy5oYXMob3B0aW9ucy5hcHApKSB7XHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgciBvZiBhcHBSZWNvcmRQcm9taXNlcy5nZXQob3B0aW9ucy5hcHApKSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCByKHJlY29yZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gQXV0byBzZWxlY3QgZmlyc3QgYXBwXHJcbiAgICAgICAgaWYgKGN0eC5jdXJyZW50QXBwUmVjb3JkID09IG51bGwpIHtcclxuICAgICAgICAgICAgYXdhaXQgc2VsZWN0QXBwKHJlY29yZCwgY3R4KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBjb25zb2xlLndhcm4oJ1tWdWUgZGV2dG9vbHNdIE5vIHJvb3QgaW5zdGFuY2UgZm91bmQgZm9yIGFwcCwgaXQgbWlnaHQgaGF2ZSBiZWVuIHVubW91bnRlZCcsIG9wdGlvbnMuYXBwKTtcclxuICAgIH1cclxufVxyXG5hc3luYyBmdW5jdGlvbiBzZWxlY3RBcHAocmVjb3JkLCBjdHgpIHtcclxuICAgIGN0eC5jdXJyZW50QXBwUmVjb3JkID0gcmVjb3JkO1xyXG4gICAgY3R4LmN1cnJlbnRJbnNwZWN0ZWRDb21wb25lbnRJZCA9IHJlY29yZC5sYXN0SW5zcGVjdGVkQ29tcG9uZW50SWQ7XHJcbiAgICBjdHguYnJpZGdlLnNlbmQoc2hhcmVkX3V0aWxzXzEuQnJpZGdlRXZlbnRzLlRPX0ZST05UX0FQUF9TRUxFQ1RFRCwge1xyXG4gICAgICAgIGlkOiByZWNvcmQuaWQsXHJcbiAgICAgICAgbGFzdEluc3BlY3RlZENvbXBvbmVudElkOiByZWNvcmQubGFzdEluc3BlY3RlZENvbXBvbmVudElkLFxyXG4gICAgfSk7XHJcbn1cclxuZXhwb3J0cy5zZWxlY3RBcHAgPSBzZWxlY3RBcHA7XHJcbmZ1bmN0aW9uIG1hcEFwcFJlY29yZChyZWNvcmQpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgaWQ6IHJlY29yZC5pZCxcclxuICAgICAgICBuYW1lOiByZWNvcmQubmFtZSxcclxuICAgICAgICB2ZXJzaW9uOiByZWNvcmQub3B0aW9ucy52ZXJzaW9uLFxyXG4gICAgICAgIGlmcmFtZTogcmVjb3JkLmlmcmFtZSxcclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy5tYXBBcHBSZWNvcmQgPSBtYXBBcHBSZWNvcmQ7XHJcbmNvbnN0IGFwcElkcyA9IG5ldyBTZXQoKTtcclxuZnVuY3Rpb24gZ2V0QXBwUmVjb3JkSWQoYXBwLCBkZWZhdWx0SWQpIHtcclxuICAgIGlmIChhcHAuX19WVUVfREVWVE9PTFNfQVBQX1JFQ09SRF9JRF9fICE9IG51bGwpIHtcclxuICAgICAgICByZXR1cm4gYXBwLl9fVlVFX0RFVlRPT0xTX0FQUF9SRUNPUkRfSURfXztcclxuICAgIH1cclxuICAgIGxldCBpZCA9IGRlZmF1bHRJZCAhPT0gbnVsbCAmJiBkZWZhdWx0SWQgIT09IHZvaWQgMCA/IGRlZmF1bHRJZCA6IChyZWNvcmRJZCsrKS50b1N0cmluZygpO1xyXG4gICAgaWYgKGRlZmF1bHRJZCAmJiBhcHBJZHMuaGFzKGlkKSkge1xyXG4gICAgICAgIGxldCBjb3VudCA9IDE7XHJcbiAgICAgICAgd2hpbGUgKGFwcElkcy5oYXMoYCR7ZGVmYXVsdElkfToke2NvdW50fWApKSB7XHJcbiAgICAgICAgICAgIGNvdW50Kys7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlkID0gYCR7ZGVmYXVsdElkfV8ke2NvdW50fWA7XHJcbiAgICB9XHJcbiAgICBhcHBJZHMuYWRkKGlkKTtcclxuICAgIGFwcC5fX1ZVRV9ERVZUT09MU19BUFBfUkVDT1JEX0lEX18gPSBpZDtcclxuICAgIHJldHVybiBpZDtcclxufVxyXG5leHBvcnRzLmdldEFwcFJlY29yZElkID0gZ2V0QXBwUmVjb3JkSWQ7XHJcbmFzeW5jIGZ1bmN0aW9uIGdldEFwcFJlY29yZChhcHAsIGN0eCkge1xyXG4gICAgY29uc3QgcmVjb3JkID0gY3R4LmFwcFJlY29yZHMuZmluZChhciA9PiBhci5vcHRpb25zLmFwcCA9PT0gYXBwKTtcclxuICAgIGlmIChyZWNvcmQpIHtcclxuICAgICAgICByZXR1cm4gcmVjb3JkO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICBsZXQgcmVzb2x2ZXJzID0gYXBwUmVjb3JkUHJvbWlzZXMuZ2V0KGFwcCk7XHJcbiAgICAgICAgbGV0IHRpbWVkT3V0ID0gZmFsc2U7XHJcbiAgICAgICAgaWYgKCFyZXNvbHZlcnMpIHtcclxuICAgICAgICAgICAgcmVzb2x2ZXJzID0gW107XHJcbiAgICAgICAgICAgIGFwcFJlY29yZFByb21pc2VzLnNldChhcHAsIHJlc29sdmVycyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGZuID0gKHJlY29yZCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoIXRpbWVkT3V0KSB7XHJcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZWNvcmQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXNvbHZlcnMucHVzaChmbik7XHJcbiAgICAgICAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgdGltZWRPdXQgPSB0cnVlO1xyXG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHJlc29sdmVycy5pbmRleE9mKGZuKTtcclxuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSlcclxuICAgICAgICAgICAgICAgIHJlc29sdmVycy5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgICAgICAgICBpZiAoc2hhcmVkX3V0aWxzXzEuU2hhcmVkRGF0YS5kZWJ1Z0luZm8pIHtcclxuICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnVGltZWQgb3V0IHdhaXRpbmcgZm9yIGFwcCByZWNvcmQnLCBhcHApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoYFRpbWVkIG91dCBnZXR0aW5nIGFwcCByZWNvcmQgZm9yIGFwcGApKTtcclxuICAgICAgICB9LCA2MDAwMCk7XHJcbiAgICB9KTtcclxufVxyXG5leHBvcnRzLmdldEFwcFJlY29yZCA9IGdldEFwcFJlY29yZDtcclxuZnVuY3Rpb24gd2FpdEZvckFwcHNSZWdpc3RyYXRpb24oKSB7XHJcbiAgICByZXR1cm4gam9icy5xdWV1ZShhc3luYyAoKSA9PiB7IH0pO1xyXG59XHJcbmV4cG9ydHMud2FpdEZvckFwcHNSZWdpc3RyYXRpb24gPSB3YWl0Rm9yQXBwc1JlZ2lzdHJhdGlvbjtcclxuYXN5bmMgZnVuY3Rpb24gc2VuZEFwcHMoY3R4KSB7XHJcbiAgICBjb25zdCBhcHBSZWNvcmRzID0gW107XHJcbiAgICBmb3IgKGNvbnN0IGFwcFJlY29yZCBvZiBjdHguYXBwUmVjb3Jkcykge1xyXG4gICAgICAgIGFwcFJlY29yZHMucHVzaChhcHBSZWNvcmQpO1xyXG4gICAgfVxyXG4gICAgY3R4LmJyaWRnZS5zZW5kKHNoYXJlZF91dGlsc18xLkJyaWRnZUV2ZW50cy5UT19GUk9OVF9BUFBfTElTVCwge1xyXG4gICAgICAgIGFwcHM6IGFwcFJlY29yZHMubWFwKG1hcEFwcFJlY29yZCksXHJcbiAgICB9KTtcclxufVxyXG5leHBvcnRzLnNlbmRBcHBzID0gc2VuZEFwcHM7XHJcbmFzeW5jIGZ1bmN0aW9uIHJlbW92ZUFwcChhcHAsIGN0eCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBhcHBSZWNvcmQgPSBhd2FpdCBnZXRBcHBSZWNvcmQoYXBwLCBjdHgpO1xyXG4gICAgICAgIGlmIChhcHBSZWNvcmQpIHtcclxuICAgICAgICAgICAgYXBwSWRzLmRlbGV0ZShhcHBSZWNvcmQuaWQpO1xyXG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IGN0eC5hcHBSZWNvcmRzLmluZGV4T2YoYXBwUmVjb3JkKTtcclxuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSlcclxuICAgICAgICAgICAgICAgIGN0eC5hcHBSZWNvcmRzLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgICAgICgwLCB0aW1lbGluZV8xLnJlbW92ZUxheWVyc0ZvckFwcCkoYXBwLCBjdHgpO1xyXG4gICAgICAgICAgICBjdHguYnJpZGdlLnNlbmQoc2hhcmVkX3V0aWxzXzEuQnJpZGdlRXZlbnRzLlRPX0ZST05UX0FQUF9SRU1PVkUsIHsgaWQ6IGFwcFJlY29yZC5pZCB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgIGlmIChzaGFyZWRfdXRpbHNfMS5TaGFyZWREYXRhLmRlYnVnSW5mbykge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5leHBvcnRzLnJlbW92ZUFwcCA9IHJlbW92ZUFwcDtcclxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNhbWVsY2FzZVxyXG5hc3luYyBmdW5jdGlvbiBfbGVnYWN5X2dldEFuZFJlZ2lzdGVyQXBwcyhWdWUsIGN0eCkge1xyXG4gICAgY29uc3QgYXBwcyA9ICgwLCBzY2FuXzEuc2NhbikoKTtcclxuICAgIGFwcHMuZm9yRWFjaChhcHAgPT4ge1xyXG4gICAgICAgIHJlZ2lzdGVyQXBwKHtcclxuICAgICAgICAgICAgYXBwLFxyXG4gICAgICAgICAgICB0eXBlczoge30sXHJcbiAgICAgICAgICAgIHZlcnNpb246IFZ1ZS52ZXJzaW9uLFxyXG4gICAgICAgICAgICBtZXRhOiB7XHJcbiAgICAgICAgICAgICAgICBWdWUsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSwgY3R4KTtcclxuICAgIH0pO1xyXG59XHJcbmV4cG9ydHMuX2xlZ2FjeV9nZXRBbmRSZWdpc3RlckFwcHMgPSBfbGVnYWN5X2dldEFuZFJlZ2lzdGVyQXBwcztcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNvbnN0IHNoYXJlZF91dGlsc18xID0gcmVxdWlyZShcIkB2dWUtZGV2dG9vbHMvc2hhcmVkLXV0aWxzXCIpO1xyXG5jb25zdCBoaWdobGlnaHRlcl8xID0gcmVxdWlyZShcIi4vaGlnaGxpZ2h0ZXJcIik7XHJcbmNsYXNzIENvbXBvbmVudFBpY2tlciB7XHJcbiAgICBjb25zdHJ1Y3RvcihjdHgpIHtcclxuICAgICAgICB0aGlzLmN0eCA9IGN0eDtcclxuICAgICAgICB0aGlzLmJpbmRNZXRob2RzKCk7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIEFkZHMgZXZlbnQgbGlzdGVuZXJzIGZvciBtb3VzZW92ZXIgYW5kIG1vdXNldXBcclxuICAgICAqL1xyXG4gICAgc3RhcnRTZWxlY3RpbmcoKSB7XHJcbiAgICAgICAgaWYgKCFzaGFyZWRfdXRpbHNfMS5pc0Jyb3dzZXIpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJywgdGhpcy5lbGVtZW50TW91c2VPdmVyLCB0cnVlKTtcclxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmVsZW1lbnRDbGlja2VkLCB0cnVlKTtcclxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdXQnLCB0aGlzLmNhbmNlbEV2ZW50LCB0cnVlKTtcclxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VlbnRlcicsIHRoaXMuY2FuY2VsRXZlbnQsIHRydWUpO1xyXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5jYW5jZWxFdmVudCwgdHJ1ZSk7XHJcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuY2FuY2VsRXZlbnQsIHRydWUpO1xyXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5jYW5jZWxFdmVudCwgdHJ1ZSk7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIFJlbW92ZXMgZXZlbnQgbGlzdGVuZXJzXHJcbiAgICAgKi9cclxuICAgIHN0b3BTZWxlY3RpbmcoKSB7XHJcbiAgICAgICAgaWYgKCFzaGFyZWRfdXRpbHNfMS5pc0Jyb3dzZXIpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJywgdGhpcy5lbGVtZW50TW91c2VPdmVyLCB0cnVlKTtcclxuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmVsZW1lbnRDbGlja2VkLCB0cnVlKTtcclxuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2VvdXQnLCB0aGlzLmNhbmNlbEV2ZW50LCB0cnVlKTtcclxuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2VlbnRlcicsIHRoaXMuY2FuY2VsRXZlbnQsIHRydWUpO1xyXG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgdGhpcy5jYW5jZWxFdmVudCwgdHJ1ZSk7XHJcbiAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuY2FuY2VsRXZlbnQsIHRydWUpO1xyXG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5jYW5jZWxFdmVudCwgdHJ1ZSk7XHJcbiAgICAgICAgKDAsIGhpZ2hsaWdodGVyXzEudW5IaWdobGlnaHQpKCk7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIEhpZ2hsaWdodHMgYSBjb21wb25lbnQgb24gZWxlbWVudCBtb3VzZSBvdmVyXHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGVsZW1lbnRNb3VzZU92ZXIoZSkge1xyXG4gICAgICAgIHRoaXMuY2FuY2VsRXZlbnQoZSk7XHJcbiAgICAgICAgY29uc3QgZWwgPSBlLnRhcmdldDtcclxuICAgICAgICBpZiAoZWwpIHtcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5zZWxlY3RFbGVtZW50Q29tcG9uZW50KGVsKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgKDAsIGhpZ2hsaWdodGVyXzEudW5IaWdobGlnaHQpKCk7XHJcbiAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRJbnN0YW5jZSkge1xyXG4gICAgICAgICAgICAoMCwgaGlnaGxpZ2h0ZXJfMS5oaWdobGlnaHQpKHRoaXMuc2VsZWN0ZWRJbnN0YW5jZSwgdGhpcy5zZWxlY3RlZEJhY2tlbmQsIHRoaXMuY3R4KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBhc3luYyBzZWxlY3RFbGVtZW50Q29tcG9uZW50KGVsKSB7XHJcbiAgICAgICAgZm9yIChjb25zdCBiYWNrZW5kIG9mIHRoaXMuY3R4LmJhY2tlbmRzKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGluc3RhbmNlID0gYXdhaXQgYmFja2VuZC5hcGkuZ2V0RWxlbWVudENvbXBvbmVudChlbCk7XHJcbiAgICAgICAgICAgIGlmIChpbnN0YW5jZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZEluc3RhbmNlID0gaW5zdGFuY2U7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkQmFja2VuZCA9IGJhY2tlbmQ7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZEluc3RhbmNlID0gbnVsbDtcclxuICAgICAgICB0aGlzLnNlbGVjdGVkQmFja2VuZCA9IG51bGw7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIFNlbGVjdHMgYW4gaW5zdGFuY2UgaW4gdGhlIGNvbXBvbmVudCB2aWV3XHJcbiAgICAgKi9cclxuICAgIGFzeW5jIGVsZW1lbnRDbGlja2VkKGUpIHtcclxuICAgICAgICB0aGlzLmNhbmNlbEV2ZW50KGUpO1xyXG4gICAgICAgIGlmICh0aGlzLnNlbGVjdGVkSW5zdGFuY2UgJiYgdGhpcy5zZWxlY3RlZEJhY2tlbmQpIHtcclxuICAgICAgICAgICAgY29uc3QgcGFyZW50SW5zdGFuY2VzID0gYXdhaXQgdGhpcy5zZWxlY3RlZEJhY2tlbmQuYXBpLndhbGtDb21wb25lbnRQYXJlbnRzKHRoaXMuc2VsZWN0ZWRJbnN0YW5jZSk7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LmJyaWRnZS5zZW5kKHNoYXJlZF91dGlsc18xLkJyaWRnZUV2ZW50cy5UT19GUk9OVF9DT01QT05FTlRfUElDSywgeyBpZDogdGhpcy5zZWxlY3RlZEluc3RhbmNlLl9fVlVFX0RFVlRPT0xTX1VJRF9fLCBwYXJlbnRJZHM6IHBhcmVudEluc3RhbmNlcy5tYXAoaSA9PiBpLl9fVlVFX0RFVlRPT0xTX1VJRF9fKSB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LmJyaWRnZS5zZW5kKHNoYXJlZF91dGlsc18xLkJyaWRnZUV2ZW50cy5UT19GUk9OVF9DT01QT05FTlRfUElDS19DQU5DRUxFRCwgbnVsbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc3RvcFNlbGVjdGluZygpO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBDYW5jZWwgYSBtb3VzZSBldmVudFxyXG4gICAgICovXHJcbiAgICBjYW5jZWxFdmVudChlKSB7XHJcbiAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIEJpbmQgY2xhc3MgbWV0aG9kcyB0byB0aGUgY2xhc3Mgc2NvcGUgdG8gYXZvaWQgcmViaW5kIGZvciBldmVudCBsaXN0ZW5lcnNcclxuICAgICAqL1xyXG4gICAgYmluZE1ldGhvZHMoKSB7XHJcbiAgICAgICAgdGhpcy5zdGFydFNlbGVjdGluZyA9IHRoaXMuc3RhcnRTZWxlY3RpbmcuYmluZCh0aGlzKTtcclxuICAgICAgICB0aGlzLnN0b3BTZWxlY3RpbmcgPSB0aGlzLnN0b3BTZWxlY3RpbmcuYmluZCh0aGlzKTtcclxuICAgICAgICB0aGlzLmVsZW1lbnRNb3VzZU92ZXIgPSB0aGlzLmVsZW1lbnRNb3VzZU92ZXIuYmluZCh0aGlzKTtcclxuICAgICAgICB0aGlzLmVsZW1lbnRDbGlja2VkID0gdGhpcy5lbGVtZW50Q2xpY2tlZC5iaW5kKHRoaXMpO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IENvbXBvbmVudFBpY2tlcjtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y29tcG9uZW50LXBpY2suanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5nZXRDb21wb25lbnRJbnN0YW5jZSA9IGV4cG9ydHMuZ2V0Q29tcG9uZW50SWQgPSBleHBvcnRzLmVkaXRDb21wb25lbnRTdGF0ZSA9IGV4cG9ydHMuc2VuZEVtcHR5Q29tcG9uZW50RGF0YSA9IGV4cG9ydHMubWFya1NlbGVjdGVkSW5zdGFuY2UgPSBleHBvcnRzLnNlbmRTZWxlY3RlZENvbXBvbmVudERhdGEgPSBleHBvcnRzLnNlbmRDb21wb25lbnRUcmVlRGF0YSA9IHZvaWQgMDtcclxuY29uc3Qgc2hhcmVkX3V0aWxzXzEgPSByZXF1aXJlKFwiQHZ1ZS1kZXZ0b29scy9zaGFyZWQtdXRpbHNcIik7XHJcbmNvbnN0IGFwcF9iYWNrZW5kX2FwaV8xID0gcmVxdWlyZShcIkB2dWUtZGV2dG9vbHMvYXBwLWJhY2tlbmQtYXBpXCIpO1xyXG5jb25zdCBhcHBfMSA9IHJlcXVpcmUoXCIuL2FwcFwiKTtcclxuY29uc3QgTUFYXyRWTSA9IDEwO1xyXG5jb25zdCAkdm1RdWV1ZSA9IFtdO1xyXG5hc3luYyBmdW5jdGlvbiBzZW5kQ29tcG9uZW50VHJlZURhdGEoYXBwUmVjb3JkLCBpbnN0YW5jZUlkLCBmaWx0ZXIgPSAnJywgbWF4RGVwdGggPSBudWxsLCBjdHgpIHtcclxuICAgIGlmICghaW5zdGFuY2VJZCB8fCBhcHBSZWNvcmQgIT09IGN0eC5jdXJyZW50QXBwUmVjb3JkKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIC8vIEZsdXNoIHdpbGwgc2VuZCBhbGwgY29tcG9uZW50cyBpbiB0aGUgdHJlZVxyXG4gICAgLy8gU28gd2Ugc2tpcCBpbmRpdmlkaXVhbCB0cmVlIHVwZGF0ZXNcclxuICAgIGlmIChpbnN0YW5jZUlkICE9PSAnX3Jvb3QnICYmXHJcbiAgICAgICAgY3R4LmN1cnJlbnRBcHBSZWNvcmQuYmFja2VuZC5vcHRpb25zLmZlYXR1cmVzLmluY2x1ZGVzKGFwcF9iYWNrZW5kX2FwaV8xLkJ1aWx0aW5CYWNrZW5kRmVhdHVyZS5GTFVTSCkpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBjb25zdCBpbnN0YW5jZSA9IGdldENvbXBvbmVudEluc3RhbmNlKGFwcFJlY29yZCwgaW5zdGFuY2VJZCwgY3R4KTtcclxuICAgIGlmICghaW5zdGFuY2UpIHtcclxuICAgICAgICBjdHguYnJpZGdlLnNlbmQoc2hhcmVkX3V0aWxzXzEuQnJpZGdlRXZlbnRzLlRPX0ZST05UX0NPTVBPTkVOVF9UUkVFLCB7XHJcbiAgICAgICAgICAgIGluc3RhbmNlSWQsXHJcbiAgICAgICAgICAgIHRyZWVEYXRhOiBudWxsLFxyXG4gICAgICAgICAgICBub3RGb3VuZDogdHJ1ZSxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIGlmIChmaWx0ZXIpXHJcbiAgICAgICAgICAgIGZpbHRlciA9IGZpbHRlci50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgIGlmIChtYXhEZXB0aCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIG1heERlcHRoID0gaW5zdGFuY2UgPT09IGN0eC5jdXJyZW50QXBwUmVjb3JkLnJvb3RJbnN0YW5jZSA/IDIgOiAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgYXBwUmVjb3JkLmJhY2tlbmQuYXBpLndhbGtDb21wb25lbnRUcmVlKGluc3RhbmNlLCBtYXhEZXB0aCwgZmlsdGVyKTtcclxuICAgICAgICBjb25zdCBwYXlsb2FkID0ge1xyXG4gICAgICAgICAgICBpbnN0YW5jZUlkLFxyXG4gICAgICAgICAgICB0cmVlRGF0YTogKDAsIHNoYXJlZF91dGlsc18xLnN0cmluZ2lmeSkoZGF0YSksXHJcbiAgICAgICAgfTtcclxuICAgICAgICBjdHguYnJpZGdlLnNlbmQoc2hhcmVkX3V0aWxzXzEuQnJpZGdlRXZlbnRzLlRPX0ZST05UX0NPTVBPTkVOVF9UUkVFLCBwYXlsb2FkKTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLnNlbmRDb21wb25lbnRUcmVlRGF0YSA9IHNlbmRDb21wb25lbnRUcmVlRGF0YTtcclxuYXN5bmMgZnVuY3Rpb24gc2VuZFNlbGVjdGVkQ29tcG9uZW50RGF0YShhcHBSZWNvcmQsIGluc3RhbmNlSWQsIGN0eCkge1xyXG4gICAgaWYgKCFpbnN0YW5jZUlkIHx8IGFwcFJlY29yZCAhPT0gY3R4LmN1cnJlbnRBcHBSZWNvcmQpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgY29uc3QgaW5zdGFuY2UgPSBnZXRDb21wb25lbnRJbnN0YW5jZShhcHBSZWNvcmQsIGluc3RhbmNlSWQsIGN0eCk7XHJcbiAgICBpZiAoIWluc3RhbmNlKSB7XHJcbiAgICAgICAgc2VuZEVtcHR5Q29tcG9uZW50RGF0YShpbnN0YW5jZUlkLCBjdHgpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgLy8gRXhwb3NlIGluc3RhbmNlIG9uIHdpbmRvd1xyXG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICBjb25zdCB3aW4gPSB3aW5kb3c7XHJcbiAgICAgICAgICAgIHdpbi4kdm0gPSBpbnN0YW5jZTtcclxuICAgICAgICAgICAgLy8gJHZtMCwgJHZtMSwgJHZtMiwgLi4uXHJcbiAgICAgICAgICAgIGlmICgkdm1RdWV1ZVswXSAhPT0gaW5zdGFuY2UpIHtcclxuICAgICAgICAgICAgICAgIGlmICgkdm1RdWV1ZS5sZW5ndGggPj0gTUFYXyRWTSkge1xyXG4gICAgICAgICAgICAgICAgICAgICR2bVF1ZXVlLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9ICR2bVF1ZXVlLmxlbmd0aDsgaSA+IDA7IGktLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHdpbltgJHZtJHtpfWBdID0gJHZtUXVldWVbaV0gPSAkdm1RdWV1ZVtpIC0gMV07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB3aW4uJHZtMCA9ICR2bVF1ZXVlWzBdID0gaW5zdGFuY2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHNoYXJlZF91dGlsc18xLlNoYXJlZERhdGEuZGVidWdJbmZvKSB7XHJcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbREVCVUddIGluc3BlY3QnLCBpbnN0YW5jZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHBhcmVudEluc3RhbmNlcyA9IGF3YWl0IGFwcFJlY29yZC5iYWNrZW5kLmFwaS53YWxrQ29tcG9uZW50UGFyZW50cyhpbnN0YW5jZSk7XHJcbiAgICAgICAgY29uc3QgcGF5bG9hZCA9IHtcclxuICAgICAgICAgICAgaW5zdGFuY2VJZCxcclxuICAgICAgICAgICAgZGF0YTogKDAsIHNoYXJlZF91dGlsc18xLnN0cmluZ2lmeSkoYXdhaXQgYXBwUmVjb3JkLmJhY2tlbmQuYXBpLmluc3BlY3RDb21wb25lbnQoaW5zdGFuY2UsIGN0eC5jdXJyZW50QXBwUmVjb3JkLm9wdGlvbnMuYXBwKSksXHJcbiAgICAgICAgICAgIHBhcmVudElkczogcGFyZW50SW5zdGFuY2VzLm1hcChpID0+IGkuX19WVUVfREVWVE9PTFNfVUlEX18pLFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgY3R4LmJyaWRnZS5zZW5kKHNoYXJlZF91dGlsc18xLkJyaWRnZUV2ZW50cy5UT19GUk9OVF9DT01QT05FTlRfU0VMRUNURURfREFUQSwgcGF5bG9hZCk7XHJcbiAgICAgICAgbWFya1NlbGVjdGVkSW5zdGFuY2UoaW5zdGFuY2VJZCwgY3R4KTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLnNlbmRTZWxlY3RlZENvbXBvbmVudERhdGEgPSBzZW5kU2VsZWN0ZWRDb21wb25lbnREYXRhO1xyXG5mdW5jdGlvbiBtYXJrU2VsZWN0ZWRJbnN0YW5jZShpbnN0YW5jZUlkLCBjdHgpIHtcclxuICAgIGN0eC5jdXJyZW50SW5zcGVjdGVkQ29tcG9uZW50SWQgPSBpbnN0YW5jZUlkO1xyXG4gICAgY3R4LmN1cnJlbnRBcHBSZWNvcmQubGFzdEluc3BlY3RlZENvbXBvbmVudElkID0gaW5zdGFuY2VJZDtcclxufVxyXG5leHBvcnRzLm1hcmtTZWxlY3RlZEluc3RhbmNlID0gbWFya1NlbGVjdGVkSW5zdGFuY2U7XHJcbmZ1bmN0aW9uIHNlbmRFbXB0eUNvbXBvbmVudERhdGEoaW5zdGFuY2VJZCwgY3R4KSB7XHJcbiAgICBjdHguYnJpZGdlLnNlbmQoc2hhcmVkX3V0aWxzXzEuQnJpZGdlRXZlbnRzLlRPX0ZST05UX0NPTVBPTkVOVF9TRUxFQ1RFRF9EQVRBLCB7XHJcbiAgICAgICAgaW5zdGFuY2VJZCxcclxuICAgICAgICBkYXRhOiBudWxsLFxyXG4gICAgfSk7XHJcbn1cclxuZXhwb3J0cy5zZW5kRW1wdHlDb21wb25lbnREYXRhID0gc2VuZEVtcHR5Q29tcG9uZW50RGF0YTtcclxuYXN5bmMgZnVuY3Rpb24gZWRpdENvbXBvbmVudFN0YXRlKGluc3RhbmNlSWQsIGRvdFBhdGgsIHR5cGUsIHN0YXRlLCBjdHgpIHtcclxuICAgIGlmICghaW5zdGFuY2VJZClcclxuICAgICAgICByZXR1cm47XHJcbiAgICBjb25zdCBpbnN0YW5jZSA9IGdldENvbXBvbmVudEluc3RhbmNlKGN0eC5jdXJyZW50QXBwUmVjb3JkLCBpbnN0YW5jZUlkLCBjdHgpO1xyXG4gICAgaWYgKGluc3RhbmNlKSB7XHJcbiAgICAgICAgaWYgKCd2YWx1ZScgaW4gc3RhdGUgJiYgc3RhdGUudmFsdWUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBzdGF0ZS52YWx1ZSA9ICgwLCBzaGFyZWRfdXRpbHNfMS5wYXJzZSkoc3RhdGUudmFsdWUsIHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBhd2FpdCBjdHguY3VycmVudEFwcFJlY29yZC5iYWNrZW5kLmFwaS5lZGl0Q29tcG9uZW50U3RhdGUoaW5zdGFuY2UsIGRvdFBhdGgsIHR5cGUsIHN0YXRlLCBjdHguY3VycmVudEFwcFJlY29yZC5vcHRpb25zLmFwcCk7XHJcbiAgICAgICAgYXdhaXQgc2VuZFNlbGVjdGVkQ29tcG9uZW50RGF0YShjdHguY3VycmVudEFwcFJlY29yZCwgaW5zdGFuY2VJZCwgY3R4KTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLmVkaXRDb21wb25lbnRTdGF0ZSA9IGVkaXRDb21wb25lbnRTdGF0ZTtcclxuYXN5bmMgZnVuY3Rpb24gZ2V0Q29tcG9uZW50SWQoYXBwLCB1aWQsIGluc3RhbmNlLCBjdHgpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgaWYgKGluc3RhbmNlLl9fVlVFX0RFVlRPT0xTX1VJRF9fKVxyXG4gICAgICAgICAgICByZXR1cm4gaW5zdGFuY2UuX19WVUVfREVWVE9PTFNfVUlEX187XHJcbiAgICAgICAgY29uc3QgYXBwUmVjb3JkID0gYXdhaXQgKDAsIGFwcF8xLmdldEFwcFJlY29yZCkoYXBwLCBjdHgpO1xyXG4gICAgICAgIGlmICghYXBwUmVjb3JkKVxyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICBjb25zdCBpc1Jvb3QgPSBhcHBSZWNvcmQucm9vdEluc3RhbmNlID09PSBpbnN0YW5jZTtcclxuICAgICAgICByZXR1cm4gYCR7YXBwUmVjb3JkLmlkfToke2lzUm9vdCA/ICdyb290JyA6IHVpZH1gO1xyXG4gICAgfVxyXG4gICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICBpZiAoc2hhcmVkX3V0aWxzXzEuU2hhcmVkRGF0YS5kZWJ1Z0luZm8pIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5nZXRDb21wb25lbnRJZCA9IGdldENvbXBvbmVudElkO1xyXG5mdW5jdGlvbiBnZXRDb21wb25lbnRJbnN0YW5jZShhcHBSZWNvcmQsIGluc3RhbmNlSWQsIGN0eCkge1xyXG4gICAgaWYgKGluc3RhbmNlSWQgPT09ICdfcm9vdCcpIHtcclxuICAgICAgICBpbnN0YW5jZUlkID0gYCR7YXBwUmVjb3JkLmlkfTpyb290YDtcclxuICAgIH1cclxuICAgIGNvbnN0IGluc3RhbmNlID0gYXBwUmVjb3JkLmluc3RhbmNlTWFwLmdldChpbnN0YW5jZUlkKTtcclxuICAgIGlmICghaW5zdGFuY2UgJiYgc2hhcmVkX3V0aWxzXzEuU2hhcmVkRGF0YS5kZWJ1Z0luZm8pIHtcclxuICAgICAgICBjb25zb2xlLndhcm4oYEluc3RhbmNlIHVpZD0ke2luc3RhbmNlSWR9IG5vdCBmb3VuZGApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGluc3RhbmNlO1xyXG59XHJcbmV4cG9ydHMuZ2V0Q29tcG9uZW50SW5zdGFuY2UgPSBnZXRDb21wb25lbnRJbnN0YW5jZTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y29tcG9uZW50LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMudW5IaWdobGlnaHQgPSBleHBvcnRzLmhpZ2hsaWdodCA9IHZvaWQgMDtcclxuY29uc3Qgc2hhcmVkX3V0aWxzXzEgPSByZXF1aXJlKFwiQHZ1ZS1kZXZ0b29scy9zaGFyZWQtdXRpbHNcIik7XHJcbmNvbnN0IHF1ZXVlXzEgPSByZXF1aXJlKFwiLi91dGlsL3F1ZXVlXCIpO1xyXG5sZXQgb3ZlcmxheTtcclxubGV0IG92ZXJsYXlDb250ZW50O1xyXG5sZXQgY3VycmVudEluc3RhbmNlO1xyXG5mdW5jdGlvbiBjcmVhdGVPdmVybGF5KCkge1xyXG4gICAgaWYgKG92ZXJsYXkgfHwgIXNoYXJlZF91dGlsc18xLmlzQnJvd3NlcilcclxuICAgICAgICByZXR1cm47XHJcbiAgICBvdmVybGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICBvdmVybGF5LnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICdyZ2JhKDY1LCAxODQsIDEzMSwgMC4zNSknO1xyXG4gICAgb3ZlcmxheS5zdHlsZS5wb3NpdGlvbiA9ICdmaXhlZCc7XHJcbiAgICBvdmVybGF5LnN0eWxlLnpJbmRleCA9ICc5OTk5OTk5OTk5OTk5OCc7XHJcbiAgICBvdmVybGF5LnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnbm9uZSc7XHJcbiAgICBvdmVybGF5LnN0eWxlLmJvcmRlclJhZGl1cyA9ICczcHgnO1xyXG4gICAgb3ZlcmxheUNvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgIG92ZXJsYXlDb250ZW50LnN0eWxlLnBvc2l0aW9uID0gJ2ZpeGVkJztcclxuICAgIG92ZXJsYXlDb250ZW50LnN0eWxlLnpJbmRleCA9ICc5OTk5OTk5OTk5OTk5OSc7XHJcbiAgICBvdmVybGF5Q29udGVudC5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xyXG4gICAgb3ZlcmxheUNvbnRlbnQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJ3doaXRlJztcclxuICAgIG92ZXJsYXlDb250ZW50LnN0eWxlLmZvbnRGYW1pbHkgPSAnbW9ub3NwYWNlJztcclxuICAgIG92ZXJsYXlDb250ZW50LnN0eWxlLmZvbnRTaXplID0gJzExcHgnO1xyXG4gICAgb3ZlcmxheUNvbnRlbnQuc3R5bGUucGFkZGluZyA9ICc0cHggOHB4JztcclxuICAgIG92ZXJsYXlDb250ZW50LnN0eWxlLmJvcmRlclJhZGl1cyA9ICczcHgnO1xyXG4gICAgb3ZlcmxheUNvbnRlbnQuc3R5bGUuY29sb3IgPSAnIzMzMyc7XHJcbiAgICBvdmVybGF5Q29udGVudC5zdHlsZS50ZXh0QWxpZ24gPSAnY2VudGVyJztcclxuICAgIG92ZXJsYXlDb250ZW50LnN0eWxlLmJvcmRlciA9ICdyZ2JhKDY1LCAxODQsIDEzMSwgMC41KSAxcHggc29saWQnO1xyXG4gICAgb3ZlcmxheUNvbnRlbnQuc3R5bGUuYmFja2dyb3VuZENsaXAgPSAncGFkZGluZy1ib3gnO1xyXG59XHJcbi8vIFVzZSBhIGpvYiBxdWV1ZSB0byBwcmVzZXJ2ZSBoaWdobGlnaHQvdW5oaWdobGlnaHQgY2FsbHMgb3JkZXJcclxuLy8gVGhpcyBwcmV2ZW50cyBcInN0aWNreVwiIGhpZ2hsaWdodHMgdGhhdCBhcmUgbm90IHJlbW92ZWQgYmVjYXVzZSBoaWdobGlnaHQgaXMgYXN5bmNcclxuY29uc3Qgam9iUXVldWUgPSBuZXcgcXVldWVfMS5Kb2JRdWV1ZSgpO1xyXG5hc3luYyBmdW5jdGlvbiBoaWdobGlnaHQoaW5zdGFuY2UsIGJhY2tlbmQsIGN0eCkge1xyXG4gICAgYXdhaXQgam9iUXVldWUucXVldWUoYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgIGlmICghaW5zdGFuY2UpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICBjb25zdCBib3VuZHMgPSBhd2FpdCBiYWNrZW5kLmFwaS5nZXRDb21wb25lbnRCb3VuZHMoaW5zdGFuY2UpO1xyXG4gICAgICAgIGlmIChib3VuZHMpIHtcclxuICAgICAgICAgICAgY3JlYXRlT3ZlcmxheSgpO1xyXG4gICAgICAgICAgICAvLyBOYW1lXHJcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSAoYXdhaXQgYmFja2VuZC5hcGkuZ2V0Q29tcG9uZW50TmFtZShpbnN0YW5jZSkpIHx8ICdBbm9ueW1vdXMnO1xyXG4gICAgICAgICAgICBjb25zdCBwcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICAgICAgICAgIHByZS5zdHlsZS5vcGFjaXR5ID0gJzAuNic7XHJcbiAgICAgICAgICAgIHByZS5pbm5lclRleHQgPSAnPCc7XHJcbiAgICAgICAgICAgIGNvbnN0IHRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICAgICAgICAgIHRleHQuc3R5bGUuZm9udFdlaWdodCA9ICdib2xkJztcclxuICAgICAgICAgICAgdGV4dC5zdHlsZS5jb2xvciA9ICcjMDlhYjU2JztcclxuICAgICAgICAgICAgdGV4dC5pbm5lclRleHQgPSBuYW1lO1xyXG4gICAgICAgICAgICBjb25zdCBwb3N0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICAgICAgICBwb3N0LnN0eWxlLm9wYWNpdHkgPSAnMC42JztcclxuICAgICAgICAgICAgcG9zdC5pbm5lclRleHQgPSAnPic7XHJcbiAgICAgICAgICAgIC8vIFNpemVcclxuICAgICAgICAgICAgY29uc3Qgc2l6ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgICAgICAgICAgc2l6ZS5zdHlsZS5vcGFjaXR5ID0gJzAuNSc7XHJcbiAgICAgICAgICAgIHNpemUuc3R5bGUubWFyZ2luTGVmdCA9ICc2cHgnO1xyXG4gICAgICAgICAgICBzaXplLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKChNYXRoLnJvdW5kKGJvdW5kcy53aWR0aCAqIDEwMCkgLyAxMDApLnRvU3RyaW5nKCkpKTtcclxuICAgICAgICAgICAgY29uc3QgbXVsdGlwbHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICAgICAgICAgIG11bHRpcGx5LnN0eWxlLm1hcmdpbkxlZnQgPSBtdWx0aXBseS5zdHlsZS5tYXJnaW5SaWdodCA9ICcycHgnO1xyXG4gICAgICAgICAgICBtdWx0aXBseS5pbm5lclRleHQgPSAnw5cnO1xyXG4gICAgICAgICAgICBzaXplLmFwcGVuZENoaWxkKG11bHRpcGx5KTtcclxuICAgICAgICAgICAgc2l6ZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgoTWF0aC5yb3VuZChib3VuZHMuaGVpZ2h0ICogMTAwKSAvIDEwMCkudG9TdHJpbmcoKSkpO1xyXG4gICAgICAgICAgICBjdXJyZW50SW5zdGFuY2UgPSBpbnN0YW5jZTtcclxuICAgICAgICAgICAgYXdhaXQgc2hvd092ZXJsYXkoYm91bmRzLCBbcHJlLCB0ZXh0LCBwb3N0LCBzaXplXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN0YXJ0VXBkYXRlVGltZXIoYmFja2VuZCwgY3R4KTtcclxuICAgIH0pO1xyXG59XHJcbmV4cG9ydHMuaGlnaGxpZ2h0ID0gaGlnaGxpZ2h0O1xyXG5hc3luYyBmdW5jdGlvbiB1bkhpZ2hsaWdodCgpIHtcclxuICAgIGF3YWl0IGpvYlF1ZXVlLnF1ZXVlKGFzeW5jICgpID0+IHtcclxuICAgICAgICB2YXIgX2EsIF9iO1xyXG4gICAgICAgIChfYSA9IG92ZXJsYXkgPT09IG51bGwgfHwgb3ZlcmxheSA9PT0gdm9pZCAwID8gdm9pZCAwIDogb3ZlcmxheS5wYXJlbnROb2RlKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EucmVtb3ZlQ2hpbGQob3ZlcmxheSk7XHJcbiAgICAgICAgKF9iID0gb3ZlcmxheUNvbnRlbnQgPT09IG51bGwgfHwgb3ZlcmxheUNvbnRlbnQgPT09IHZvaWQgMCA/IHZvaWQgMCA6IG92ZXJsYXlDb250ZW50LnBhcmVudE5vZGUpID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi5yZW1vdmVDaGlsZChvdmVybGF5Q29udGVudCk7XHJcbiAgICAgICAgY3VycmVudEluc3RhbmNlID0gbnVsbDtcclxuICAgICAgICBzdG9wVXBkYXRlVGltZXIoKTtcclxuICAgIH0pO1xyXG59XHJcbmV4cG9ydHMudW5IaWdobGlnaHQgPSB1bkhpZ2hsaWdodDtcclxuZnVuY3Rpb24gc2hvd092ZXJsYXkoYm91bmRzLCBjaGlsZHJlbiA9IG51bGwpIHtcclxuICAgIGlmICghc2hhcmVkX3V0aWxzXzEuaXNCcm93c2VyIHx8ICFjaGlsZHJlbi5sZW5ndGgpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgcG9zaXRpb25PdmVybGF5KGJvdW5kcyk7XHJcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG92ZXJsYXkpO1xyXG4gICAgb3ZlcmxheUNvbnRlbnQuaW5uZXJIVE1MID0gJyc7XHJcbiAgICBjaGlsZHJlbi5mb3JFYWNoKGNoaWxkID0+IG92ZXJsYXlDb250ZW50LmFwcGVuZENoaWxkKGNoaWxkKSk7XHJcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG92ZXJsYXlDb250ZW50KTtcclxuICAgIHBvc2l0aW9uT3ZlcmxheUNvbnRlbnQoYm91bmRzKTtcclxufVxyXG5mdW5jdGlvbiBwb3NpdGlvbk92ZXJsYXkoeyB3aWR0aCA9IDAsIGhlaWdodCA9IDAsIHRvcCA9IDAsIGxlZnQgPSAwIH0pIHtcclxuICAgIG92ZXJsYXkuc3R5bGUud2lkdGggPSBNYXRoLnJvdW5kKHdpZHRoKSArICdweCc7XHJcbiAgICBvdmVybGF5LnN0eWxlLmhlaWdodCA9IE1hdGgucm91bmQoaGVpZ2h0KSArICdweCc7XHJcbiAgICBvdmVybGF5LnN0eWxlLmxlZnQgPSBNYXRoLnJvdW5kKGxlZnQpICsgJ3B4JztcclxuICAgIG92ZXJsYXkuc3R5bGUudG9wID0gTWF0aC5yb3VuZCh0b3ApICsgJ3B4JztcclxufVxyXG5mdW5jdGlvbiBwb3NpdGlvbk92ZXJsYXlDb250ZW50KHsgaGVpZ2h0ID0gMCwgdG9wID0gMCwgbGVmdCA9IDAgfSkge1xyXG4gICAgLy8gQ29udGVudCBwb3NpdGlvbiAocHJldmVudHMgb3ZlcmZsb3cpXHJcbiAgICBjb25zdCBjb250ZW50V2lkdGggPSBvdmVybGF5Q29udGVudC5vZmZzZXRXaWR0aDtcclxuICAgIGNvbnN0IGNvbnRlbnRIZWlnaHQgPSBvdmVybGF5Q29udGVudC5vZmZzZXRIZWlnaHQ7XHJcbiAgICBsZXQgY29udGVudExlZnQgPSBsZWZ0O1xyXG4gICAgaWYgKGNvbnRlbnRMZWZ0IDwgMCkge1xyXG4gICAgICAgIGNvbnRlbnRMZWZ0ID0gMDtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKGNvbnRlbnRMZWZ0ICsgY29udGVudFdpZHRoID4gd2luZG93LmlubmVyV2lkdGgpIHtcclxuICAgICAgICBjb250ZW50TGVmdCA9IHdpbmRvdy5pbm5lcldpZHRoIC0gY29udGVudFdpZHRoO1xyXG4gICAgfVxyXG4gICAgbGV0IGNvbnRlbnRUb3AgPSB0b3AgLSBjb250ZW50SGVpZ2h0IC0gMjtcclxuICAgIGlmIChjb250ZW50VG9wIDwgMCkge1xyXG4gICAgICAgIGNvbnRlbnRUb3AgPSB0b3AgKyBoZWlnaHQgKyAyO1xyXG4gICAgfVxyXG4gICAgaWYgKGNvbnRlbnRUb3AgPCAwKSB7XHJcbiAgICAgICAgY29udGVudFRvcCA9IDA7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChjb250ZW50VG9wICsgY29udGVudEhlaWdodCA+IHdpbmRvdy5pbm5lckhlaWdodCkge1xyXG4gICAgICAgIGNvbnRlbnRUb3AgPSB3aW5kb3cuaW5uZXJIZWlnaHQgLSBjb250ZW50SGVpZ2h0O1xyXG4gICAgfVxyXG4gICAgb3ZlcmxheUNvbnRlbnQuc3R5bGUubGVmdCA9IH5+Y29udGVudExlZnQgKyAncHgnO1xyXG4gICAgb3ZlcmxheUNvbnRlbnQuc3R5bGUudG9wID0gfn5jb250ZW50VG9wICsgJ3B4JztcclxufVxyXG5hc3luYyBmdW5jdGlvbiB1cGRhdGVPdmVybGF5KGJhY2tlbmQsIGN0eCkge1xyXG4gICAgaWYgKGN1cnJlbnRJbnN0YW5jZSkge1xyXG4gICAgICAgIGNvbnN0IGJvdW5kcyA9IGF3YWl0IGJhY2tlbmQuYXBpLmdldENvbXBvbmVudEJvdW5kcyhjdXJyZW50SW5zdGFuY2UpO1xyXG4gICAgICAgIGlmIChib3VuZHMpIHtcclxuICAgICAgICAgICAgY29uc3Qgc2l6ZUVsID0gb3ZlcmxheUNvbnRlbnQuY2hpbGRyZW4uaXRlbSgzKTtcclxuICAgICAgICAgICAgY29uc3Qgd2lkdGhFbCA9IHNpemVFbC5jaGlsZE5vZGVzWzBdO1xyXG4gICAgICAgICAgICB3aWR0aEVsLnRleHRDb250ZW50ID0gKE1hdGgucm91bmQoYm91bmRzLndpZHRoICogMTAwKSAvIDEwMCkudG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgY29uc3QgaGVpZ2h0RWwgPSBzaXplRWwuY2hpbGROb2Rlc1syXTtcclxuICAgICAgICAgICAgaGVpZ2h0RWwudGV4dENvbnRlbnQgPSAoTWF0aC5yb3VuZChib3VuZHMuaGVpZ2h0ICogMTAwKSAvIDEwMCkudG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgcG9zaXRpb25PdmVybGF5KGJvdW5kcyk7XHJcbiAgICAgICAgICAgIHBvc2l0aW9uT3ZlcmxheUNvbnRlbnQoYm91bmRzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxubGV0IHVwZGF0ZVRpbWVyO1xyXG5mdW5jdGlvbiBzdGFydFVwZGF0ZVRpbWVyKGJhY2tlbmQsIGN0eCkge1xyXG4gICAgc3RvcFVwZGF0ZVRpbWVyKCk7XHJcbiAgICB1cGRhdGVUaW1lciA9IHNldEludGVydmFsKCgpID0+IHtcclxuICAgICAgICBqb2JRdWV1ZS5xdWV1ZShhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgIGF3YWl0IHVwZGF0ZU92ZXJsYXkoYmFja2VuZCwgY3R4KTtcclxuICAgICAgICB9KTtcclxuICAgIH0sIDEwMDAgLyAzMCk7IC8vIDMwZnBzXHJcbn1cclxuZnVuY3Rpb24gc3RvcFVwZGF0ZVRpbWVyKCkge1xyXG4gICAgY2xlYXJJbnRlcnZhbCh1cGRhdGVUaW1lcik7XHJcbn1cclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aGlnaGxpZ2h0ZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5zZWxlY3RJbnNwZWN0b3JOb2RlID0gZXhwb3J0cy5zZW5kQ3VzdG9tSW5zcGVjdG9ycyA9IGV4cG9ydHMuZWRpdEluc3BlY3RvclN0YXRlID0gZXhwb3J0cy5zZW5kSW5zcGVjdG9yU3RhdGUgPSBleHBvcnRzLnNlbmRJbnNwZWN0b3JUcmVlID0gZXhwb3J0cy5nZXRJbnNwZWN0b3JXaXRoQXBwSWQgPSBleHBvcnRzLmdldEluc3BlY3RvciA9IHZvaWQgMDtcclxuY29uc3Qgc2hhcmVkX3V0aWxzXzEgPSByZXF1aXJlKFwiQHZ1ZS1kZXZ0b29scy9zaGFyZWQtdXRpbHNcIik7XHJcbmZ1bmN0aW9uIGdldEluc3BlY3RvcihpbnNwZWN0b3JJZCwgYXBwLCBjdHgpIHtcclxuICAgIHJldHVybiBjdHguY3VzdG9tSW5zcGVjdG9ycy5maW5kKGkgPT4gaS5pZCA9PT0gaW5zcGVjdG9ySWQgJiYgaS5hcHBSZWNvcmQub3B0aW9ucy5hcHAgPT09IGFwcCk7XHJcbn1cclxuZXhwb3J0cy5nZXRJbnNwZWN0b3IgPSBnZXRJbnNwZWN0b3I7XHJcbmFzeW5jIGZ1bmN0aW9uIGdldEluc3BlY3RvcldpdGhBcHBJZChpbnNwZWN0b3JJZCwgYXBwSWQsIGN0eCkge1xyXG4gICAgZm9yIChjb25zdCBpIG9mIGN0eC5jdXN0b21JbnNwZWN0b3JzKSB7XHJcbiAgICAgICAgaWYgKGkuaWQgPT09IGluc3BlY3RvcklkICYmIGkuYXBwUmVjb3JkLmlkID09PSBhcHBJZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gaTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbnVsbDtcclxufVxyXG5leHBvcnRzLmdldEluc3BlY3RvcldpdGhBcHBJZCA9IGdldEluc3BlY3RvcldpdGhBcHBJZDtcclxuYXN5bmMgZnVuY3Rpb24gc2VuZEluc3BlY3RvclRyZWUoaW5zcGVjdG9yLCBjdHgpIHtcclxuICAgIGNvbnN0IHJvb3ROb2RlcyA9IGF3YWl0IGluc3BlY3Rvci5hcHBSZWNvcmQuYmFja2VuZC5hcGkuZ2V0SW5zcGVjdG9yVHJlZShpbnNwZWN0b3IuaWQsIGluc3BlY3Rvci5hcHBSZWNvcmQub3B0aW9ucy5hcHAsIGluc3BlY3Rvci50cmVlRmlsdGVyKTtcclxuICAgIGN0eC5icmlkZ2Uuc2VuZChzaGFyZWRfdXRpbHNfMS5CcmlkZ2VFdmVudHMuVE9fRlJPTlRfQ1VTVE9NX0lOU1BFQ1RPUl9UUkVFLCB7XHJcbiAgICAgICAgYXBwSWQ6IGluc3BlY3Rvci5hcHBSZWNvcmQuaWQsXHJcbiAgICAgICAgaW5zcGVjdG9ySWQ6IGluc3BlY3Rvci5pZCxcclxuICAgICAgICByb290Tm9kZXMsXHJcbiAgICB9KTtcclxufVxyXG5leHBvcnRzLnNlbmRJbnNwZWN0b3JUcmVlID0gc2VuZEluc3BlY3RvclRyZWU7XHJcbmFzeW5jIGZ1bmN0aW9uIHNlbmRJbnNwZWN0b3JTdGF0ZShpbnNwZWN0b3IsIGN0eCkge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBpbnNwZWN0b3Iuc2VsZWN0ZWROb2RlSWQgPyBhd2FpdCBpbnNwZWN0b3IuYXBwUmVjb3JkLmJhY2tlbmQuYXBpLmdldEluc3BlY3RvclN0YXRlKGluc3BlY3Rvci5pZCwgaW5zcGVjdG9yLmFwcFJlY29yZC5vcHRpb25zLmFwcCwgaW5zcGVjdG9yLnNlbGVjdGVkTm9kZUlkKSA6IG51bGw7XHJcbiAgICBjdHguYnJpZGdlLnNlbmQoc2hhcmVkX3V0aWxzXzEuQnJpZGdlRXZlbnRzLlRPX0ZST05UX0NVU1RPTV9JTlNQRUNUT1JfU1RBVEUsIHtcclxuICAgICAgICBhcHBJZDogaW5zcGVjdG9yLmFwcFJlY29yZC5pZCxcclxuICAgICAgICBpbnNwZWN0b3JJZDogaW5zcGVjdG9yLmlkLFxyXG4gICAgICAgIHN0YXRlOiAoMCwgc2hhcmVkX3V0aWxzXzEuc3RyaW5naWZ5KShzdGF0ZSksXHJcbiAgICB9KTtcclxufVxyXG5leHBvcnRzLnNlbmRJbnNwZWN0b3JTdGF0ZSA9IHNlbmRJbnNwZWN0b3JTdGF0ZTtcclxuYXN5bmMgZnVuY3Rpb24gZWRpdEluc3BlY3RvclN0YXRlKGluc3BlY3Rvciwgbm9kZUlkLCBkb3RQYXRoLCB0eXBlLCBzdGF0ZSwgY3R4KSB7XHJcbiAgICBhd2FpdCBpbnNwZWN0b3IuYXBwUmVjb3JkLmJhY2tlbmQuYXBpLmVkaXRJbnNwZWN0b3JTdGF0ZShpbnNwZWN0b3IuaWQsIGluc3BlY3Rvci5hcHBSZWNvcmQub3B0aW9ucy5hcHAsIG5vZGVJZCwgZG90UGF0aCwgdHlwZSwge1xyXG4gICAgICAgIC4uLnN0YXRlLFxyXG4gICAgICAgIHZhbHVlOiBzdGF0ZS52YWx1ZSAhPSBudWxsID8gKDAsIHNoYXJlZF91dGlsc18xLnBhcnNlKShzdGF0ZS52YWx1ZSwgdHJ1ZSkgOiBzdGF0ZS52YWx1ZSxcclxuICAgIH0pO1xyXG59XHJcbmV4cG9ydHMuZWRpdEluc3BlY3RvclN0YXRlID0gZWRpdEluc3BlY3RvclN0YXRlO1xyXG5hc3luYyBmdW5jdGlvbiBzZW5kQ3VzdG9tSW5zcGVjdG9ycyhjdHgpIHtcclxuICAgIHZhciBfYTtcclxuICAgIGNvbnN0IGluc3BlY3RvcnMgPSBbXTtcclxuICAgIGZvciAoY29uc3QgaSBvZiBjdHguY3VzdG9tSW5zcGVjdG9ycykge1xyXG4gICAgICAgIGluc3BlY3RvcnMucHVzaCh7XHJcbiAgICAgICAgICAgIGlkOiBpLmlkLFxyXG4gICAgICAgICAgICBhcHBJZDogaS5hcHBSZWNvcmQuaWQsXHJcbiAgICAgICAgICAgIHBsdWdpbklkOiBpLnBsdWdpbi5kZXNjcmlwdG9yLmlkLFxyXG4gICAgICAgICAgICBsYWJlbDogaS5sYWJlbCxcclxuICAgICAgICAgICAgaWNvbjogaS5pY29uLFxyXG4gICAgICAgICAgICB0cmVlRmlsdGVyUGxhY2Vob2xkZXI6IGkudHJlZUZpbHRlclBsYWNlaG9sZGVyLFxyXG4gICAgICAgICAgICBzdGF0ZUZpbHRlclBsYWNlaG9sZGVyOiBpLnN0YXRlRmlsdGVyUGxhY2Vob2xkZXIsXHJcbiAgICAgICAgICAgIG5vU2VsZWN0aW9uVGV4dDogaS5ub1NlbGVjdGlvblRleHQsXHJcbiAgICAgICAgICAgIGFjdGlvbnM6IChfYSA9IGkuYWN0aW9ucykgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLm1hcChhID0+ICh7XHJcbiAgICAgICAgICAgICAgICBpY29uOiBhLmljb24sXHJcbiAgICAgICAgICAgICAgICB0b29sdGlwOiBhLnRvb2x0aXAsXHJcbiAgICAgICAgICAgIH0pKSxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGN0eC5icmlkZ2Uuc2VuZChzaGFyZWRfdXRpbHNfMS5CcmlkZ2VFdmVudHMuVE9fRlJPTlRfQ1VTVE9NX0lOU1BFQ1RPUl9MSVNULCB7XHJcbiAgICAgICAgaW5zcGVjdG9ycyxcclxuICAgIH0pO1xyXG59XHJcbmV4cG9ydHMuc2VuZEN1c3RvbUluc3BlY3RvcnMgPSBzZW5kQ3VzdG9tSW5zcGVjdG9ycztcclxuYXN5bmMgZnVuY3Rpb24gc2VsZWN0SW5zcGVjdG9yTm9kZShpbnNwZWN0b3IsIG5vZGVJZCwgY3R4KSB7XHJcbiAgICBjdHguYnJpZGdlLnNlbmQoc2hhcmVkX3V0aWxzXzEuQnJpZGdlRXZlbnRzLlRPX0ZST05UX0NVU1RPTV9JTlNQRUNUT1JfU0VMRUNUX05PREUsIHtcclxuICAgICAgICBhcHBJZDogaW5zcGVjdG9yLmFwcFJlY29yZC5pZCxcclxuICAgICAgICBpbnNwZWN0b3JJZDogaW5zcGVjdG9yLmlkLFxyXG4gICAgICAgIG5vZGVJZCxcclxuICAgIH0pO1xyXG59XHJcbmV4cG9ydHMuc2VsZWN0SW5zcGVjdG9yTm9kZSA9IHNlbGVjdEluc3BlY3Rvck5vZGU7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluc3BlY3Rvci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLnNjYW4gPSB2b2lkIDA7XHJcbmNvbnN0IHNoYXJlZF91dGlsc18xID0gcmVxdWlyZShcIkB2dWUtZGV2dG9vbHMvc2hhcmVkLXV0aWxzXCIpO1xyXG5jb25zdCByb290SW5zdGFuY2VzID0gW107XHJcbi8qKlxyXG4gKiBTY2FuIHRoZSBwYWdlIGZvciByb290IGxldmVsIFZ1ZSBpbnN0YW5jZXMuXHJcbiAqL1xyXG5mdW5jdGlvbiBzY2FuKCkge1xyXG4gICAgcm9vdEluc3RhbmNlcy5sZW5ndGggPSAwO1xyXG4gICAgbGV0IGluRnJhZ21lbnQgPSBmYWxzZTtcclxuICAgIGxldCBjdXJyZW50RnJhZ21lbnQgPSBudWxsO1xyXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWlubmVyLWRlY2xhcmF0aW9uc1xyXG4gICAgZnVuY3Rpb24gcHJvY2Vzc0luc3RhbmNlKGluc3RhbmNlKSB7XHJcbiAgICAgICAgaWYgKGluc3RhbmNlKSB7XHJcbiAgICAgICAgICAgIGlmIChyb290SW5zdGFuY2VzLmluZGV4T2YoaW5zdGFuY2UuJHJvb3QpID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgaW5zdGFuY2UgPSBpbnN0YW5jZS4kcm9vdDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoaW5zdGFuY2UuX2lzRnJhZ21lbnQpIHtcclxuICAgICAgICAgICAgICAgIGluRnJhZ21lbnQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgY3VycmVudEZyYWdtZW50ID0gaW5zdGFuY2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gcmVzcGVjdCBWdWUuY29uZmlnLmRldnRvb2xzIG9wdGlvblxyXG4gICAgICAgICAgICBsZXQgYmFzZVZ1ZSA9IGluc3RhbmNlLmNvbnN0cnVjdG9yO1xyXG4gICAgICAgICAgICB3aGlsZSAoYmFzZVZ1ZS5zdXBlcikge1xyXG4gICAgICAgICAgICAgICAgYmFzZVZ1ZSA9IGJhc2VWdWUuc3VwZXI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGJhc2VWdWUuY29uZmlnICYmIGJhc2VWdWUuY29uZmlnLmRldnRvb2xzKSB7XHJcbiAgICAgICAgICAgICAgICByb290SW5zdGFuY2VzLnB1c2goaW5zdGFuY2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmIChzaGFyZWRfdXRpbHNfMS5pc0Jyb3dzZXIpIHtcclxuICAgICAgICBjb25zdCB3YWxrRG9jdW1lbnQgPSBkb2N1bWVudCA9PiB7XHJcbiAgICAgICAgICAgIHdhbGsoZG9jdW1lbnQsIGZ1bmN0aW9uIChub2RlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaW5GcmFnbWVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlID09PSBjdXJyZW50RnJhZ21lbnQuX2ZyYWdtZW50RW5kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluRnJhZ21lbnQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudEZyYWdtZW50ID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpbnN0YW5jZSA9IG5vZGUuX192dWVfXztcclxuICAgICAgICAgICAgICAgIHJldHVybiBwcm9jZXNzSW5zdGFuY2UoaW5zdGFuY2UpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHdhbGtEb2N1bWVudChkb2N1bWVudCk7XHJcbiAgICAgICAgY29uc3QgaWZyYW1lcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2lmcmFtZScpO1xyXG4gICAgICAgIGZvciAoY29uc3QgaWZyYW1lIG9mIGlmcmFtZXMpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIHdhbGtEb2N1bWVudChpZnJhbWUuY29udGVudERvY3VtZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gSWdub3JlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzaGFyZWRfdXRpbHNfMS50YXJnZXQuX19WVUVfUk9PVF9JTlNUQU5DRVNfXykpIHtcclxuICAgICAgICAgICAgc2hhcmVkX3V0aWxzXzEudGFyZ2V0Ll9fVlVFX1JPT1RfSU5TVEFOQ0VTX18ubWFwKHByb2Nlc3NJbnN0YW5jZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJvb3RJbnN0YW5jZXM7XHJcbn1cclxuZXhwb3J0cy5zY2FuID0gc2NhbjtcclxuLyoqXHJcbiAqIERPTSB3YWxrIGhlbHBlclxyXG4gKlxyXG4gKiBAcGFyYW0ge05vZGVMaXN0fSBub2Rlc1xyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxyXG4gKi9cclxuZnVuY3Rpb24gd2Fsayhub2RlLCBmbikge1xyXG4gICAgaWYgKG5vZGUuY2hpbGROb2Rlcykge1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBsID0gbm9kZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCBjaGlsZCA9IG5vZGUuY2hpbGROb2Rlc1tpXTtcclxuICAgICAgICAgICAgY29uc3Qgc3RvcCA9IGZuKGNoaWxkKTtcclxuICAgICAgICAgICAgaWYgKCFzdG9wKSB7XHJcbiAgICAgICAgICAgICAgICB3YWxrKGNoaWxkLCBmbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBhbHNvIHdhbGsgc2hhZG93IERPTVxyXG4gICAgaWYgKG5vZGUuc2hhZG93Um9vdCkge1xyXG4gICAgICAgIHdhbGsobm9kZS5zaGFkb3dSb290LCBmbik7XHJcbiAgICB9XHJcbn1cclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c2Nhbi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLmluaXRPblBhZ2VDb25maWcgPSBleHBvcnRzLmdldFBhZ2VDb25maWcgPSB2b2lkIDA7XHJcbmNvbnN0IHNoYXJlZF91dGlsc18xID0gcmVxdWlyZShcIkB2dWUtZGV2dG9vbHMvc2hhcmVkLXV0aWxzXCIpO1xyXG5sZXQgY29uZmlnID0ge307XHJcbmZ1bmN0aW9uIGdldFBhZ2VDb25maWcoKSB7XHJcbiAgICByZXR1cm4gY29uZmlnO1xyXG59XHJcbmV4cG9ydHMuZ2V0UGFnZUNvbmZpZyA9IGdldFBhZ2VDb25maWc7XHJcbmZ1bmN0aW9uIGluaXRPblBhZ2VDb25maWcoKSB7XHJcbiAgICAvLyBVc2VyIHByb2plY3QgZGV2dG9vbHMgY29uZmlnXHJcbiAgICBpZiAoT2JqZWN0Lmhhc093blByb3BlcnR5LmNhbGwoc2hhcmVkX3V0aWxzXzEudGFyZ2V0LCAnVlVFX0RFVlRPT0xTX0NPTkZJRycpKSB7XHJcbiAgICAgICAgY29uZmlnID0gc2hhcmVkX3V0aWxzXzEuU2hhcmVkRGF0YS5wYWdlQ29uZmlnID0gc2hhcmVkX3V0aWxzXzEudGFyZ2V0LlZVRV9ERVZUT09MU19DT05GSUc7XHJcbiAgICAgICAgLy8gT3BlbiBpbiBlZGl0b3JcclxuICAgICAgICBpZiAoT2JqZWN0Lmhhc093blByb3BlcnR5LmNhbGwoY29uZmlnLCAnb3BlbkluRWRpdG9ySG9zdCcpKSB7XHJcbiAgICAgICAgICAgIHNoYXJlZF91dGlsc18xLlNoYXJlZERhdGEub3BlbkluRWRpdG9ySG9zdCA9IGNvbmZpZy5vcGVuSW5FZGl0b3JIb3N0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5leHBvcnRzLmluaXRPblBhZ2VDb25maWcgPSBpbml0T25QYWdlQ29uZmlnO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1wYWdlLWNvbmZpZy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLmhhbmRsZUFkZFBlcmZvcm1hbmNlVGFnID0gZXhwb3J0cy5wZXJmb3JtYW5jZU1hcmtFbmQgPSBleHBvcnRzLnBlcmZvcm1hbmNlTWFya1N0YXJ0ID0gdm9pZCAwO1xyXG5jb25zdCBzaGFyZWRfdXRpbHNfMSA9IHJlcXVpcmUoXCJAdnVlLWRldnRvb2xzL3NoYXJlZC11dGlsc1wiKTtcclxuY29uc3QgdGltZWxpbmVfMSA9IHJlcXVpcmUoXCIuL3RpbWVsaW5lXCIpO1xyXG5jb25zdCBhcHBfMSA9IHJlcXVpcmUoXCIuL2FwcFwiKTtcclxuY29uc3QgY29tcG9uZW50XzEgPSByZXF1aXJlKFwiLi9jb21wb25lbnRcIik7XHJcbmNvbnN0IHN1YnNjcmlwdGlvbnNfMSA9IHJlcXVpcmUoXCIuL3V0aWwvc3Vic2NyaXB0aW9uc1wiKTtcclxuYXN5bmMgZnVuY3Rpb24gcGVyZm9ybWFuY2VNYXJrU3RhcnQoYXBwLCB1aWQsIGluc3RhbmNlLCB0eXBlLCB0aW1lLCBjdHgpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgaWYgKCFzaGFyZWRfdXRpbHNfMS5TaGFyZWREYXRhLnBlcmZvcm1hbmNlTW9uaXRvcmluZ0VuYWJsZWQpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICBjb25zdCBhcHBSZWNvcmQgPSBhd2FpdCAoMCwgYXBwXzEuZ2V0QXBwUmVjb3JkKShhcHAsIGN0eCk7XHJcbiAgICAgICAgY29uc3QgY29tcG9uZW50TmFtZSA9IGF3YWl0IGFwcFJlY29yZC5iYWNrZW5kLmFwaS5nZXRDb21wb25lbnROYW1lKGluc3RhbmNlKTtcclxuICAgICAgICBjb25zdCBncm91cElkID0gY3R4LnBlcmZVbmlxdWVHcm91cElkKys7XHJcbiAgICAgICAgY29uc3QgZ3JvdXBLZXkgPSBgJHt1aWR9LSR7dHlwZX1gO1xyXG4gICAgICAgIGFwcFJlY29yZC5wZXJmR3JvdXBJZHMuc2V0KGdyb3VwS2V5LCB7IGdyb3VwSWQsIHRpbWUgfSk7XHJcbiAgICAgICAgYXdhaXQgKDAsIHRpbWVsaW5lXzEuYWRkVGltZWxpbmVFdmVudCkoe1xyXG4gICAgICAgICAgICBsYXllcklkOiAncGVyZm9ybWFuY2UnLFxyXG4gICAgICAgICAgICBldmVudDoge1xyXG4gICAgICAgICAgICAgICAgdGltZSxcclxuICAgICAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQ6IGNvbXBvbmVudE5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZSxcclxuICAgICAgICAgICAgICAgICAgICBtZWFzdXJlOiAnc3RhcnQnLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHRpdGxlOiBjb21wb25lbnROYW1lLFxyXG4gICAgICAgICAgICAgICAgc3VidGl0bGU6IHR5cGUsXHJcbiAgICAgICAgICAgICAgICBncm91cElkLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH0sIGFwcCwgY3R4KTtcclxuICAgIH1cclxuICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgaWYgKHNoYXJlZF91dGlsc18xLlNoYXJlZERhdGEuZGVidWdJbmZvKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMucGVyZm9ybWFuY2VNYXJrU3RhcnQgPSBwZXJmb3JtYW5jZU1hcmtTdGFydDtcclxuYXN5bmMgZnVuY3Rpb24gcGVyZm9ybWFuY2VNYXJrRW5kKGFwcCwgdWlkLCBpbnN0YW5jZSwgdHlwZSwgdGltZSwgY3R4KSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGlmICghc2hhcmVkX3V0aWxzXzEuU2hhcmVkRGF0YS5wZXJmb3JtYW5jZU1vbml0b3JpbmdFbmFibGVkKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgY29uc3QgYXBwUmVjb3JkID0gYXdhaXQgKDAsIGFwcF8xLmdldEFwcFJlY29yZCkoYXBwLCBjdHgpO1xyXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudE5hbWUgPSBhd2FpdCBhcHBSZWNvcmQuYmFja2VuZC5hcGkuZ2V0Q29tcG9uZW50TmFtZShpbnN0YW5jZSk7XHJcbiAgICAgICAgY29uc3QgZ3JvdXBLZXkgPSBgJHt1aWR9LSR7dHlwZX1gO1xyXG4gICAgICAgIGNvbnN0IHsgZ3JvdXBJZCwgdGltZTogc3RhcnRUaW1lIH0gPSBhcHBSZWNvcmQucGVyZkdyb3VwSWRzLmdldChncm91cEtleSk7XHJcbiAgICAgICAgY29uc3QgZHVyYXRpb24gPSB0aW1lIC0gc3RhcnRUaW1lO1xyXG4gICAgICAgIGF3YWl0ICgwLCB0aW1lbGluZV8xLmFkZFRpbWVsaW5lRXZlbnQpKHtcclxuICAgICAgICAgICAgbGF5ZXJJZDogJ3BlcmZvcm1hbmNlJyxcclxuICAgICAgICAgICAgZXZlbnQ6IHtcclxuICAgICAgICAgICAgICAgIHRpbWUsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50OiBjb21wb25lbnROYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgbWVhc3VyZTogJ2VuZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgZHVyYXRpb246IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgX2N1c3RvbToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ0R1cmF0aW9uJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBkdXJhdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6IGAke2R1cmF0aW9ufSBtc2AsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB0aXRsZTogY29tcG9uZW50TmFtZSxcclxuICAgICAgICAgICAgICAgIHN1YnRpdGxlOiB0eXBlLFxyXG4gICAgICAgICAgICAgICAgZ3JvdXBJZCxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9LCBhcHAsIGN0eCk7XHJcbiAgICAgICAgLy8gTWFyayBvbiBjb21wb25lbnRcclxuICAgICAgICBjb25zdCB0b29TbG93ID0gZHVyYXRpb24gPiAxMDtcclxuICAgICAgICBpZiAodG9vU2xvdyB8fCBpbnN0YW5jZS5fX1ZVRV9ERVZUT09MU19TTE9XX18pIHtcclxuICAgICAgICAgICAgbGV0IGNoYW5nZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICBpZiAodG9vU2xvdyAmJiAhaW5zdGFuY2UuX19WVUVfREVWVE9PTFNfU0xPV19fKSB7XHJcbiAgICAgICAgICAgICAgICBpbnN0YW5jZS5fX1ZVRV9ERVZUT09MU19TTE9XX18gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZHVyYXRpb246IG51bGwsXHJcbiAgICAgICAgICAgICAgICAgICAgbWVhc3VyZXM6IHt9LFxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBkYXRhID0gaW5zdGFuY2UuX19WVUVfREVWVE9PTFNfU0xPV19fO1xyXG4gICAgICAgICAgICBpZiAodG9vU2xvdyAmJiAoZGF0YS5kdXJhdGlvbiA9PSBudWxsIHx8IGRhdGEuZHVyYXRpb24gPCBkdXJhdGlvbikpIHtcclxuICAgICAgICAgICAgICAgIGRhdGEuZHVyYXRpb24gPSBkdXJhdGlvbjtcclxuICAgICAgICAgICAgICAgIGNoYW5nZSA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGRhdGEubWVhc3VyZXNbdHlwZV0gPT0gbnVsbCB8fCBkYXRhLm1lYXN1cmVzW3R5cGVdIDwgZHVyYXRpb24pIHtcclxuICAgICAgICAgICAgICAgIGRhdGEubWVhc3VyZXNbdHlwZV0gPSBkdXJhdGlvbjtcclxuICAgICAgICAgICAgICAgIGNoYW5nZSA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGNoYW5nZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gVXBkYXRlIGNvbXBvbmVudCB0cmVlXHJcbiAgICAgICAgICAgICAgICBjb25zdCBpZCA9IGF3YWl0ICgwLCBjb21wb25lbnRfMS5nZXRDb21wb25lbnRJZCkoYXBwLCB1aWQsIGluc3RhbmNlLCBjdHgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCgwLCBzdWJzY3JpcHRpb25zXzEuaXNTdWJzY3JpYmVkKShzaGFyZWRfdXRpbHNfMS5CcmlkZ2VTdWJzY3JpcHRpb25zLkNPTVBPTkVOVF9UUkVFLCBzdWIgPT4gc3ViLnBheWxvYWQuaW5zdGFuY2VJZCA9PT0gaWQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgKDAsIGNvbXBvbmVudF8xLnNlbmRDb21wb25lbnRUcmVlRGF0YSkoYXBwUmVjb3JkLCBpZCwgY3R4LmN1cnJlbnRBcHBSZWNvcmQuY29tcG9uZW50RmlsdGVyLCBudWxsLCBjdHgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICBpZiAoc2hhcmVkX3V0aWxzXzEuU2hhcmVkRGF0YS5kZWJ1Z0luZm8pIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5wZXJmb3JtYW5jZU1hcmtFbmQgPSBwZXJmb3JtYW5jZU1hcmtFbmQ7XHJcbmZ1bmN0aW9uIGhhbmRsZUFkZFBlcmZvcm1hbmNlVGFnKGJhY2tlbmQsIGN0eCkge1xyXG4gICAgYmFja2VuZC5hcGkub24udmlzaXRDb21wb25lbnRUcmVlKHBheWxvYWQgPT4ge1xyXG4gICAgICAgIGlmIChwYXlsb2FkLmNvbXBvbmVudEluc3RhbmNlLl9fVlVFX0RFVlRPT0xTX1NMT1dfXykge1xyXG4gICAgICAgICAgICBjb25zdCB7IGR1cmF0aW9uLCBtZWFzdXJlcyB9ID0gcGF5bG9hZC5jb21wb25lbnRJbnN0YW5jZS5fX1ZVRV9ERVZUT09MU19TTE9XX187XHJcbiAgICAgICAgICAgIGxldCB0b29sdGlwID0gJzxkaXYgY2xhc3M9XCJncmlkIGdyaWQtY29scy0yIGdhcC0yIGZvbnQtbW9ubyB0ZXh0LXhzXCI+JztcclxuICAgICAgICAgICAgZm9yIChjb25zdCB0eXBlIGluIG1lYXN1cmVzKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkID0gbWVhc3VyZXNbdHlwZV07XHJcbiAgICAgICAgICAgICAgICB0b29sdGlwICs9IGA8ZGl2PiR7dHlwZX08L2Rpdj48ZGl2IGNsYXNzPVwidGV4dC1yaWdodCB0ZXh0LWJsYWNrIHJvdW5kZWQgcHgtMSAke2QgPiAzMCA/ICdiZy1yZWQtNDAwJyA6IGQgPiAxMCA/ICdiZy15ZWxsb3ctNDAwJyA6ICdiZy1ncmVlbi00MDAnfVwiPiR7ZH0gbXM8L2Rpdj5gO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRvb2x0aXAgKz0gJzwvZGl2Pic7XHJcbiAgICAgICAgICAgIHBheWxvYWQudHJlZU5vZGUudGFncy5wdXNoKHtcclxuICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogZHVyYXRpb24gPiAzMCA/IDB4Rjg3MTcxIDogMHhGQkJGMjQsXHJcbiAgICAgICAgICAgICAgICB0ZXh0Q29sb3I6IDB4MDAwMDAwLFxyXG4gICAgICAgICAgICAgICAgbGFiZWw6IGAke2R1cmF0aW9ufSBtc2AsXHJcbiAgICAgICAgICAgICAgICB0b29sdGlwLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5leHBvcnRzLmhhbmRsZUFkZFBlcmZvcm1hbmNlVGFnID0gaGFuZGxlQWRkUGVyZm9ybWFuY2VUYWc7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXBlcmYuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5zZXJpYWxpemVQbHVnaW4gPSBleHBvcnRzLnNlbmRQbHVnaW5MaXN0ID0gZXhwb3J0cy5hZGRQcmV2aW91c2x5UmVnaXN0ZXJlZFBsdWdpbnMgPSBleHBvcnRzLmFkZFF1ZXVlZFBsdWdpbnMgPSBleHBvcnRzLmFkZFBsdWdpbiA9IHZvaWQgMDtcclxuY29uc3QgYXBwX2JhY2tlbmRfYXBpXzEgPSByZXF1aXJlKFwiQHZ1ZS1kZXZ0b29scy9hcHAtYmFja2VuZC1hcGlcIik7XHJcbmNvbnN0IHNoYXJlZF91dGlsc18xID0gcmVxdWlyZShcIkB2dWUtZGV2dG9vbHMvc2hhcmVkLXV0aWxzXCIpO1xyXG5jb25zdCBhcHBfMSA9IHJlcXVpcmUoXCIuL2FwcFwiKTtcclxuYXN5bmMgZnVuY3Rpb24gYWRkUGx1Z2luKHBsdWdpblF1ZXVlSXRlbSwgY3R4KSB7XHJcbiAgICBjb25zdCB7IHBsdWdpbkRlc2NyaXB0b3IsIHNldHVwRm4gfSA9IHBsdWdpblF1ZXVlSXRlbTtcclxuICAgIGNvbnN0IHBsdWdpbiA9IHtcclxuICAgICAgICBkZXNjcmlwdG9yOiBwbHVnaW5EZXNjcmlwdG9yLFxyXG4gICAgICAgIHNldHVwRm4sXHJcbiAgICAgICAgZXJyb3I6IG51bGwsXHJcbiAgICB9O1xyXG4gICAgY3R4LmN1cnJlbnRQbHVnaW4gPSBwbHVnaW47XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IGFwcFJlY29yZCA9IGF3YWl0ICgwLCBhcHBfMS5nZXRBcHBSZWNvcmQpKHBsdWdpbi5kZXNjcmlwdG9yLmFwcCwgY3R4KTtcclxuICAgICAgICBjb25zdCBhcGkgPSBuZXcgYXBwX2JhY2tlbmRfYXBpXzEuRGV2dG9vbHNQbHVnaW5BcGlJbnN0YW5jZShwbHVnaW4sIGFwcFJlY29yZCwgY3R4KTtcclxuICAgICAgICBpZiAocGx1Z2luUXVldWVJdGVtLnByb3h5KSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHBsdWdpblF1ZXVlSXRlbS5wcm94eS5zZXRSZWFsVGFyZ2V0KGFwaSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBzZXR1cEZuKGFwaSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICBwbHVnaW4uZXJyb3IgPSBlO1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICB9XHJcbiAgICBjdHguY3VycmVudFBsdWdpbiA9IG51bGw7XHJcbiAgICBjdHgucGx1Z2lucy5wdXNoKHBsdWdpbik7XHJcbiAgICBjdHguYnJpZGdlLnNlbmQoc2hhcmVkX3V0aWxzXzEuQnJpZGdlRXZlbnRzLlRPX0ZST05UX0RFVlRPT0xTX1BMVUdJTl9BREQsIHtcclxuICAgICAgICBwbHVnaW46IGF3YWl0IHNlcmlhbGl6ZVBsdWdpbihwbHVnaW4pLFxyXG4gICAgfSk7XHJcbiAgICBjb25zdCB0YXJnZXRMaXN0ID0gc2hhcmVkX3V0aWxzXzEudGFyZ2V0Ll9fVlVFX0RFVlRPT0xTX1JFR0lTVEVSRURfUExVR0lOU19fID0gc2hhcmVkX3V0aWxzXzEudGFyZ2V0Ll9fVlVFX0RFVlRPT0xTX1JFR0lTVEVSRURfUExVR0lOU19fIHx8IFtdO1xyXG4gICAgdGFyZ2V0TGlzdC5wdXNoKHtcclxuICAgICAgICBwbHVnaW5EZXNjcmlwdG9yLFxyXG4gICAgICAgIHNldHVwRm4sXHJcbiAgICB9KTtcclxufVxyXG5leHBvcnRzLmFkZFBsdWdpbiA9IGFkZFBsdWdpbjtcclxuYXN5bmMgZnVuY3Rpb24gYWRkUXVldWVkUGx1Z2lucyhjdHgpIHtcclxuICAgIGlmIChzaGFyZWRfdXRpbHNfMS50YXJnZXQuX19WVUVfREVWVE9PTFNfUExVR0lOU19fICYmIEFycmF5LmlzQXJyYXkoc2hhcmVkX3V0aWxzXzEudGFyZ2V0Ll9fVlVFX0RFVlRPT0xTX1BMVUdJTlNfXykpIHtcclxuICAgICAgICBmb3IgKGNvbnN0IHF1ZXVlSXRlbSBvZiBzaGFyZWRfdXRpbHNfMS50YXJnZXQuX19WVUVfREVWVE9PTFNfUExVR0lOU19fKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IGFkZFBsdWdpbihxdWV1ZUl0ZW0sIGN0eCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHNoYXJlZF91dGlsc18xLnRhcmdldC5fX1ZVRV9ERVZUT09MU19QTFVHSU5TX18gPSBudWxsO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuYWRkUXVldWVkUGx1Z2lucyA9IGFkZFF1ZXVlZFBsdWdpbnM7XHJcbmFzeW5jIGZ1bmN0aW9uIGFkZFByZXZpb3VzbHlSZWdpc3RlcmVkUGx1Z2lucyhjdHgpIHtcclxuICAgIGlmIChzaGFyZWRfdXRpbHNfMS50YXJnZXQuX19WVUVfREVWVE9PTFNfUkVHSVNURVJFRF9QTFVHSU5TX18gJiYgQXJyYXkuaXNBcnJheShzaGFyZWRfdXRpbHNfMS50YXJnZXQuX19WVUVfREVWVE9PTFNfUkVHSVNURVJFRF9QTFVHSU5TX18pKSB7XHJcbiAgICAgICAgZm9yIChjb25zdCBxdWV1ZUl0ZW0gb2Ygc2hhcmVkX3V0aWxzXzEudGFyZ2V0Ll9fVlVFX0RFVlRPT0xTX1JFR0lTVEVSRURfUExVR0lOU19fKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IGFkZFBsdWdpbihxdWV1ZUl0ZW0sIGN0eCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuYWRkUHJldmlvdXNseVJlZ2lzdGVyZWRQbHVnaW5zID0gYWRkUHJldmlvdXNseVJlZ2lzdGVyZWRQbHVnaW5zO1xyXG5hc3luYyBmdW5jdGlvbiBzZW5kUGx1Z2luTGlzdChjdHgpIHtcclxuICAgIGN0eC5icmlkZ2Uuc2VuZChzaGFyZWRfdXRpbHNfMS5CcmlkZ2VFdmVudHMuVE9fRlJPTlRfREVWVE9PTFNfUExVR0lOX0xJU1QsIHtcclxuICAgICAgICBwbHVnaW5zOiBhd2FpdCBQcm9taXNlLmFsbChjdHgucGx1Z2lucy5tYXAocCA9PiBzZXJpYWxpemVQbHVnaW4ocCkpKSxcclxuICAgIH0pO1xyXG59XHJcbmV4cG9ydHMuc2VuZFBsdWdpbkxpc3QgPSBzZW5kUGx1Z2luTGlzdDtcclxuYXN5bmMgZnVuY3Rpb24gc2VyaWFsaXplUGx1Z2luKHBsdWdpbikge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBpZDogcGx1Z2luLmRlc2NyaXB0b3IuaWQsXHJcbiAgICAgICAgbGFiZWw6IHBsdWdpbi5kZXNjcmlwdG9yLmxhYmVsLFxyXG4gICAgICAgIGFwcElkOiAoMCwgYXBwXzEuZ2V0QXBwUmVjb3JkSWQpKHBsdWdpbi5kZXNjcmlwdG9yLmFwcCksXHJcbiAgICAgICAgcGFja2FnZU5hbWU6IHBsdWdpbi5kZXNjcmlwdG9yLnBhY2thZ2VOYW1lLFxyXG4gICAgICAgIGhvbWVwYWdlOiBwbHVnaW4uZGVzY3JpcHRvci5ob21lcGFnZSxcclxuICAgICAgICBsb2dvOiBwbHVnaW4uZGVzY3JpcHRvci5sb2dvLFxyXG4gICAgICAgIGNvbXBvbmVudFN0YXRlVHlwZXM6IHBsdWdpbi5kZXNjcmlwdG9yLmNvbXBvbmVudFN0YXRlVHlwZXMsXHJcbiAgICAgICAgc2V0dGluZ3NTY2hlbWE6IHBsdWdpbi5kZXNjcmlwdG9yLnNldHRpbmdzLFxyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLnNlcmlhbGl6ZVBsdWdpbiA9IHNlcmlhbGl6ZVBsdWdpbjtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cGx1Z2luLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuYnVpbHRpbkxheWVycyA9IHZvaWQgMDtcclxuZXhwb3J0cy5idWlsdGluTGF5ZXJzID0gW1xyXG4gICAge1xyXG4gICAgICAgIGlkOiAnbW91c2UnLFxyXG4gICAgICAgIGxhYmVsOiAnTW91c2UnLFxyXG4gICAgICAgIGNvbG9yOiAweEE0NTFBRixcclxuICAgICAgICBzY3JlZW5zaG90T3ZlcmxheVJlbmRlcihldmVudCwgeyBldmVudHMgfSkge1xyXG4gICAgICAgICAgICBjb25zdCBzYW1lUG9zaXRpb25FdmVudCA9IGV2ZW50cy5maW5kKGUgPT4gZSAhPT0gZXZlbnQgJiYgZS5yZW5kZXJNZXRhLnRleHRFbCAmJiBlLmRhdGEueCA9PT0gZXZlbnQuZGF0YS54ICYmIGUuZGF0YS55ID09PSBldmVudC5kYXRhLnkpO1xyXG4gICAgICAgICAgICBpZiAoc2FtZVBvc2l0aW9uRXZlbnQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICAgICAgICAgIHRleHQuaW5uZXJUZXh0ID0gZXZlbnQuZGF0YS50eXBlO1xyXG4gICAgICAgICAgICAgICAgc2FtZVBvc2l0aW9uRXZlbnQucmVuZGVyTWV0YS50ZXh0RWwuYXBwZW5kQ2hpbGQodGV4dCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgICAgIGRpdi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XHJcbiAgICAgICAgICAgIGRpdi5zdHlsZS5sZWZ0ID0gYCR7ZXZlbnQuZGF0YS54IC0gNH1weGA7XHJcbiAgICAgICAgICAgIGRpdi5zdHlsZS50b3AgPSBgJHtldmVudC5kYXRhLnkgLSA0fXB4YDtcclxuICAgICAgICAgICAgZGl2LnN0eWxlLndpZHRoID0gJzhweCc7XHJcbiAgICAgICAgICAgIGRpdi5zdHlsZS5oZWlnaHQgPSAnOHB4JztcclxuICAgICAgICAgICAgZGl2LnN0eWxlLmJvcmRlclJhZGl1cyA9ICcxMDAlJztcclxuICAgICAgICAgICAgZGl2LnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICdyZ2JhKDE2NCwgODEsIDE3NSwgMC41KSc7XHJcbiAgICAgICAgICAgIGNvbnN0IHRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICAgICAgdGV4dC5pbm5lclRleHQgPSBldmVudC5kYXRhLnR5cGU7XHJcbiAgICAgICAgICAgIHRleHQuc3R5bGUuY29sb3IgPSAnIzU0MWU1Yic7XHJcbiAgICAgICAgICAgIHRleHQuc3R5bGUuZm9udEZhbWlseSA9ICdtb25vc3BhY2UnO1xyXG4gICAgICAgICAgICB0ZXh0LnN0eWxlLmZvbnRTaXplID0gJzlweCc7XHJcbiAgICAgICAgICAgIHRleHQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xyXG4gICAgICAgICAgICB0ZXh0LnN0eWxlLmxlZnQgPSAnMTBweCc7XHJcbiAgICAgICAgICAgIHRleHQuc3R5bGUudG9wID0gJzEwcHgnO1xyXG4gICAgICAgICAgICB0ZXh0LnN0eWxlLnBhZGRpbmcgPSAnMXB4JztcclxuICAgICAgICAgICAgdGV4dC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAncmdiYSgyNTUsIDI1NSwgMjU1LCAwLjkpJztcclxuICAgICAgICAgICAgdGV4dC5zdHlsZS5ib3JkZXJSYWRpdXMgPSAnM3B4JztcclxuICAgICAgICAgICAgZGl2LmFwcGVuZENoaWxkKHRleHQpO1xyXG4gICAgICAgICAgICBldmVudC5yZW5kZXJNZXRhLnRleHRFbCA9IHRleHQ7XHJcbiAgICAgICAgICAgIHJldHVybiBkaXY7XHJcbiAgICAgICAgfSxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgaWQ6ICdrZXlib2FyZCcsXHJcbiAgICAgICAgbGFiZWw6ICdLZXlib2FyZCcsXHJcbiAgICAgICAgY29sb3I6IDB4ODE1MUFGLFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBpZDogJ2NvbXBvbmVudC1ldmVudCcsXHJcbiAgICAgICAgbGFiZWw6ICdDb21wb25lbnQgZXZlbnRzJyxcclxuICAgICAgICBjb2xvcjogMHg0MUI4ODMsXHJcbiAgICAgICAgc2NyZWVuc2hvdE92ZXJsYXlSZW5kZXI6IChldmVudCwgeyBldmVudHMgfSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoIWV2ZW50Lm1ldGEuYm91bmRzIHx8IGV2ZW50cy5zb21lKGUgPT4gZSAhPT0gZXZlbnQgJiYgZS5sYXllcklkID09PSBldmVudC5sYXllcklkICYmIGUucmVuZGVyTWV0YS5kcmF3biAmJiAoZS5tZXRhLmNvbXBvbmVudElkID09PSBldmVudC5tZXRhLmNvbXBvbmVudElkIHx8IChlLm1ldGEuYm91bmRzLmxlZnQgPT09IGV2ZW50Lm1ldGEuYm91bmRzLmxlZnQgJiZcclxuICAgICAgICAgICAgICAgIGUubWV0YS5ib3VuZHMudG9wID09PSBldmVudC5tZXRhLmJvdW5kcy50b3AgJiZcclxuICAgICAgICAgICAgICAgIGUubWV0YS5ib3VuZHMud2lkdGggPT09IGV2ZW50Lm1ldGEuYm91bmRzLndpZHRoICYmXHJcbiAgICAgICAgICAgICAgICBlLm1ldGEuYm91bmRzLmhlaWdodCA9PT0gZXZlbnQubWV0YS5ib3VuZHMuaGVpZ2h0KSkpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgICAgIGRpdi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XHJcbiAgICAgICAgICAgIGRpdi5zdHlsZS5sZWZ0ID0gYCR7ZXZlbnQubWV0YS5ib3VuZHMubGVmdCAtIDR9cHhgO1xyXG4gICAgICAgICAgICBkaXYuc3R5bGUudG9wID0gYCR7ZXZlbnQubWV0YS5ib3VuZHMudG9wIC0gNH1weGA7XHJcbiAgICAgICAgICAgIGRpdi5zdHlsZS53aWR0aCA9IGAke2V2ZW50Lm1ldGEuYm91bmRzLndpZHRofXB4YDtcclxuICAgICAgICAgICAgZGl2LnN0eWxlLmhlaWdodCA9IGAke2V2ZW50Lm1ldGEuYm91bmRzLmhlaWdodH1weGA7XHJcbiAgICAgICAgICAgIGRpdi5zdHlsZS5ib3JkZXJSYWRpdXMgPSAnOHB4JztcclxuICAgICAgICAgICAgZGl2LnN0eWxlLmJvcmRlclN0eWxlID0gJ3NvbGlkJztcclxuICAgICAgICAgICAgZGl2LnN0eWxlLmJvcmRlcldpZHRoID0gJzRweCc7XHJcbiAgICAgICAgICAgIGRpdi5zdHlsZS5ib3JkZXJDb2xvciA9ICdyZ2JhKDY1LCAxODQsIDEzMSwgMC41KSc7XHJcbiAgICAgICAgICAgIGRpdi5zdHlsZS50ZXh0QWxpZ24gPSAnY2VudGVyJztcclxuICAgICAgICAgICAgZGl2LnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XHJcbiAgICAgICAgICAgIGRpdi5zdHlsZS5hbGlnbkl0ZW1zID0gJ2NlbnRlcic7XHJcbiAgICAgICAgICAgIGRpdi5zdHlsZS5qdXN0aWZ5Q29udGVudCA9ICdjZW50ZXInO1xyXG4gICAgICAgICAgICBkaXYuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcclxuICAgICAgICAgICAgY29uc3QgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgICAgICB0ZXh0LnN0eWxlLmNvbG9yID0gJyMyNjc3NTMnO1xyXG4gICAgICAgICAgICB0ZXh0LnN0eWxlLmZvbnRGYW1pbHkgPSAnbW9ub3NwYWNlJztcclxuICAgICAgICAgICAgdGV4dC5zdHlsZS5mb250U2l6ZSA9ICc5cHgnO1xyXG4gICAgICAgICAgICB0ZXh0LnN0eWxlLnBhZGRpbmcgPSAnMXB4JztcclxuICAgICAgICAgICAgdGV4dC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAncmdiYSgyNTUsIDI1NSwgMjU1LCAwLjkpJztcclxuICAgICAgICAgICAgdGV4dC5zdHlsZS5ib3JkZXJSYWRpdXMgPSAnM3B4JztcclxuICAgICAgICAgICAgdGV4dC5pbm5lclRleHQgPSBldmVudC5kYXRhLmV2ZW50O1xyXG4gICAgICAgICAgICBkaXYuYXBwZW5kQ2hpbGQodGV4dCk7XHJcbiAgICAgICAgICAgIGV2ZW50LnJlbmRlck1ldGEuZHJhd24gPSB0cnVlO1xyXG4gICAgICAgICAgICByZXR1cm4gZGl2O1xyXG4gICAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIGlkOiAncGVyZm9ybWFuY2UnLFxyXG4gICAgICAgIGxhYmVsOiAnUGVyZm9ybWFuY2UnLFxyXG4gICAgICAgIGNvbG9yOiAweDQxYjg2YSxcclxuICAgICAgICBncm91cHNPbmx5OiB0cnVlLFxyXG4gICAgICAgIHNraXBTY3JlZW5zaG90czogdHJ1ZSxcclxuICAgICAgICBpZ25vcmVOb0R1cmF0aW9uR3JvdXBzOiB0cnVlLFxyXG4gICAgfSxcclxuXTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dGltZWxpbmUtYnVpbHRpbnMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5zZW5kVGltZWxpbmVNYXJrZXJzID0gZXhwb3J0cy5hZGRUaW1lbGluZU1hcmtlciA9IHZvaWQgMDtcclxuY29uc3Qgc2hhcmVkX3V0aWxzXzEgPSByZXF1aXJlKFwiQHZ1ZS1kZXZ0b29scy9zaGFyZWQtdXRpbHNcIik7XHJcbmFzeW5jIGZ1bmN0aW9uIGFkZFRpbWVsaW5lTWFya2VyKG9wdGlvbnMsIGN0eCkge1xyXG4gICAgdmFyIF9hO1xyXG4gICAgaWYgKCFjdHguY3VycmVudEFwcFJlY29yZCkge1xyXG4gICAgICAgIG9wdGlvbnMuYWxsID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIGNvbnN0IG1hcmtlciA9IHtcclxuICAgICAgICAuLi5vcHRpb25zLFxyXG4gICAgICAgIGFwcFJlY29yZDogb3B0aW9ucy5hbGwgPyBudWxsIDogY3R4LmN1cnJlbnRBcHBSZWNvcmQsXHJcbiAgICB9O1xyXG4gICAgY3R4LnRpbWVsaW5lTWFya2Vycy5wdXNoKG1hcmtlcik7XHJcbiAgICBjdHguYnJpZGdlLnNlbmQoc2hhcmVkX3V0aWxzXzEuQnJpZGdlRXZlbnRzLlRPX0ZST05UX1RJTUVMSU5FX01BUktFUiwge1xyXG4gICAgICAgIG1hcmtlcjogYXdhaXQgc2VyaWFsaXplTWFya2VyKG1hcmtlciksXHJcbiAgICAgICAgYXBwSWQ6IChfYSA9IGN0eC5jdXJyZW50QXBwUmVjb3JkKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuaWQsXHJcbiAgICB9KTtcclxufVxyXG5leHBvcnRzLmFkZFRpbWVsaW5lTWFya2VyID0gYWRkVGltZWxpbmVNYXJrZXI7XHJcbmFzeW5jIGZ1bmN0aW9uIHNlbmRUaW1lbGluZU1hcmtlcnMoY3R4KSB7XHJcbiAgICBjb25zdCBtYXJrZXJzID0gY3R4LnRpbWVsaW5lTWFya2Vycy5maWx0ZXIobWFya2VyID0+IG1hcmtlci5hbGwgfHwgbWFya2VyLmFwcFJlY29yZCA9PT0gY3R4LmN1cnJlbnRBcHBSZWNvcmQpO1xyXG4gICAgY29uc3QgcmVzdWx0ID0gW107XHJcbiAgICBmb3IgKGNvbnN0IG1hcmtlciBvZiBtYXJrZXJzKSB7XHJcbiAgICAgICAgcmVzdWx0LnB1c2goYXdhaXQgc2VyaWFsaXplTWFya2VyKG1hcmtlcikpO1xyXG4gICAgfVxyXG4gICAgY3R4LmJyaWRnZS5zZW5kKHNoYXJlZF91dGlsc18xLkJyaWRnZUV2ZW50cy5UT19GUk9OVF9USU1FTElORV9MT0FEX01BUktFUlMsIHtcclxuICAgICAgICBtYXJrZXJzOiByZXN1bHQsXHJcbiAgICAgICAgYXBwSWQ6IGN0eC5jdXJyZW50QXBwUmVjb3JkLmlkLFxyXG4gICAgfSk7XHJcbn1cclxuZXhwb3J0cy5zZW5kVGltZWxpbmVNYXJrZXJzID0gc2VuZFRpbWVsaW5lTWFya2VycztcclxuYXN5bmMgZnVuY3Rpb24gc2VyaWFsaXplTWFya2VyKG1hcmtlcikge1xyXG4gICAgdmFyIF9hO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBpZDogbWFya2VyLmlkLFxyXG4gICAgICAgIGFwcElkOiAoX2EgPSBtYXJrZXIuYXBwUmVjb3JkKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuaWQsXHJcbiAgICAgICAgYWxsOiBtYXJrZXIuYWxsLFxyXG4gICAgICAgIHRpbWU6IG1hcmtlci50aW1lLFxyXG4gICAgICAgIGxhYmVsOiBtYXJrZXIubGFiZWwsXHJcbiAgICAgICAgY29sb3I6IG1hcmtlci5jb2xvcixcclxuICAgIH07XHJcbn1cclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dGltZWxpbmUtbWFya2VyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuc2hvd1NjcmVlbnNob3QgPSB2b2lkIDA7XHJcbmNvbnN0IHNoYXJlZF91dGlsc18xID0gcmVxdWlyZShcIkB2dWUtZGV2dG9vbHMvc2hhcmVkLXV0aWxzXCIpO1xyXG5jb25zdCBxdWV1ZV8xID0gcmVxdWlyZShcIi4vdXRpbC9xdWV1ZVwiKTtcclxuY29uc3QgdGltZWxpbmVfYnVpbHRpbnNfMSA9IHJlcXVpcmUoXCIuL3RpbWVsaW5lLWJ1aWx0aW5zXCIpO1xyXG5sZXQgb3ZlcmxheTtcclxubGV0IGltYWdlO1xyXG5sZXQgY29udGFpbmVyO1xyXG5jb25zdCBqb2JRdWV1ZSA9IG5ldyBxdWV1ZV8xLkpvYlF1ZXVlKCk7XHJcbmFzeW5jIGZ1bmN0aW9uIHNob3dTY3JlZW5zaG90KHNjcmVlbnNob3QsIGN0eCkge1xyXG4gICAgYXdhaXQgam9iUXVldWUucXVldWUoYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgIGlmIChzY3JlZW5zaG90KSB7XHJcbiAgICAgICAgICAgIGlmICghY29udGFpbmVyKSB7XHJcbiAgICAgICAgICAgICAgICBjcmVhdGVFbGVtZW50cygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGltYWdlLnNyYyA9IHNjcmVlbnNob3QuaW1hZ2U7XHJcbiAgICAgICAgICAgIGltYWdlLnN0eWxlLnZpc2liaWxpdHkgPSBzY3JlZW5zaG90LmltYWdlID8gJ3Zpc2libGUnIDogJ2hpZGRlbic7XHJcbiAgICAgICAgICAgIGNsZWFyQ29udGVudCgpO1xyXG4gICAgICAgICAgICBjb25zdCBldmVudHMgPSBzY3JlZW5zaG90LmV2ZW50cy5tYXAoaWQgPT4gY3R4LnRpbWVsaW5lRXZlbnRNYXAuZ2V0KGlkKSkuZmlsdGVyKEJvb2xlYW4pLm1hcChldmVudERhdGEgPT4gKHtcclxuICAgICAgICAgICAgICAgIGxheWVyOiB0aW1lbGluZV9idWlsdGluc18xLmJ1aWx0aW5MYXllcnMuY29uY2F0KGN0eC50aW1lbGluZUxheWVycykuZmluZChsYXllciA9PiBsYXllci5pZCA9PT0gZXZlbnREYXRhLmxheWVySWQpLFxyXG4gICAgICAgICAgICAgICAgZXZlbnQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAuLi5ldmVudERhdGEuZXZlbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXJJZDogZXZlbnREYXRhLmxheWVySWQsXHJcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyTWV0YToge30sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlbmRlckNvbnRleHQgPSB7XHJcbiAgICAgICAgICAgICAgICBzY3JlZW5zaG90LFxyXG4gICAgICAgICAgICAgICAgZXZlbnRzOiBldmVudHMubWFwKCh7IGV2ZW50IH0pID0+IGV2ZW50KSxcclxuICAgICAgICAgICAgICAgIGluZGV4OiAwLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGV2ZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeyBsYXllciwgZXZlbnQgfSA9IGV2ZW50c1tpXTtcclxuICAgICAgICAgICAgICAgIGlmIChsYXllci5zY3JlZW5zaG90T3ZlcmxheVJlbmRlcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlbmRlckNvbnRleHQuaW5kZXggPSBpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGxheWVyLnNjcmVlbnNob3RPdmVybGF5UmVuZGVyKGV2ZW50LCByZW5kZXJDb250ZXh0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdCAhPT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgKz0gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNoYXJlZF91dGlsc18xLlNoYXJlZERhdGEuZGVidWdJbmZvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHNob3dFbGVtZW50KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBoaWRlRWxlbWVudCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbmV4cG9ydHMuc2hvd1NjcmVlbnNob3QgPSBzaG93U2NyZWVuc2hvdDtcclxuZnVuY3Rpb24gY3JlYXRlRWxlbWVudHMoKSB7XHJcbiAgICBvdmVybGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICBvdmVybGF5LnN0eWxlLnBvc2l0aW9uID0gJ2ZpeGVkJztcclxuICAgIG92ZXJsYXkuc3R5bGUuekluZGV4ID0gJzk5OTk5OTk5OTk5OTknO1xyXG4gICAgb3ZlcmxheS5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xyXG4gICAgb3ZlcmxheS5zdHlsZS5sZWZ0ID0gJzAnO1xyXG4gICAgb3ZlcmxheS5zdHlsZS50b3AgPSAnMCc7XHJcbiAgICBvdmVybGF5LnN0eWxlLndpZHRoID0gJzEwMHZ3JztcclxuICAgIG92ZXJsYXkuc3R5bGUuaGVpZ2h0ID0gJzEwMHZoJztcclxuICAgIG92ZXJsYXkuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJ3JnYmEoMCwwLDAsMC41KSc7XHJcbiAgICBvdmVybGF5LnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XHJcbiAgICBjb25zdCBpbWFnZUJveCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgaW1hZ2VCb3guc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnO1xyXG4gICAgb3ZlcmxheS5hcHBlbmRDaGlsZChpbWFnZUJveCk7XHJcbiAgICBpbWFnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xyXG4gICAgaW1hZ2VCb3guYXBwZW5kQ2hpbGQoaW1hZ2UpO1xyXG4gICAgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICBjb250YWluZXIuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xyXG4gICAgY29udGFpbmVyLnN0eWxlLmxlZnQgPSAnMCc7XHJcbiAgICBjb250YWluZXIuc3R5bGUudG9wID0gJzAnO1xyXG4gICAgaW1hZ2VCb3guYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcclxuICAgIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcclxuICAgIHN0eWxlLmlubmVySFRNTCA9ICcuX192dWVkZXZ0b29sc19uby1zY3JvbGwgeyBvdmVyZmxvdzogaGlkZGVuOyB9JztcclxuICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xyXG59XHJcbmZ1bmN0aW9uIHNob3dFbGVtZW50KCkge1xyXG4gICAgaWYgKCFvdmVybGF5LnBhcmVudE5vZGUpIHtcclxuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG92ZXJsYXkpO1xyXG4gICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCgnX192dWVkZXZ0b29sc19uby1zY3JvbGwnKTtcclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiBoaWRlRWxlbWVudCgpIHtcclxuICAgIGlmIChvdmVybGF5ICYmIG92ZXJsYXkucGFyZW50Tm9kZSkge1xyXG4gICAgICAgIG92ZXJsYXkucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChvdmVybGF5KTtcclxuICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ19fdnVlZGV2dG9vbHNfbm8tc2Nyb2xsJyk7XHJcbiAgICAgICAgY2xlYXJDb250ZW50KCk7XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gY2xlYXJDb250ZW50KCkge1xyXG4gICAgd2hpbGUgKGNvbnRhaW5lci5maXJzdENoaWxkKSB7XHJcbiAgICAgICAgY29udGFpbmVyLnJlbW92ZUNoaWxkKGNvbnRhaW5lci5sYXN0Q2hpbGQpO1xyXG4gICAgfVxyXG59XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXRpbWVsaW5lLXNjcmVlbnNob3QuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5zZW5kVGltZWxpbmVMYXllckV2ZW50cyA9IGV4cG9ydHMucmVtb3ZlTGF5ZXJzRm9yQXBwID0gZXhwb3J0cy5zZW5kVGltZWxpbmVFdmVudERhdGEgPSBleHBvcnRzLmNsZWFyVGltZWxpbmUgPSBleHBvcnRzLmFkZFRpbWVsaW5lRXZlbnQgPSBleHBvcnRzLnNlbmRUaW1lbGluZUxheWVycyA9IGV4cG9ydHMuYWRkQnVpbHRpbkxheWVycyA9IGV4cG9ydHMuc2V0dXBUaW1lbGluZSA9IHZvaWQgMDtcclxuY29uc3Qgc2hhcmVkX3V0aWxzXzEgPSByZXF1aXJlKFwiQHZ1ZS1kZXZ0b29scy9zaGFyZWQtdXRpbHNcIik7XHJcbmNvbnN0IGdsb2JhbF9ob29rXzEgPSByZXF1aXJlKFwiLi9nbG9iYWwtaG9va1wiKTtcclxuY29uc3QgYXBwXzEgPSByZXF1aXJlKFwiLi9hcHBcIik7XHJcbmNvbnN0IHRpbWVsaW5lX2J1aWx0aW5zXzEgPSByZXF1aXJlKFwiLi90aW1lbGluZS1idWlsdGluc1wiKTtcclxuZnVuY3Rpb24gc2V0dXBUaW1lbGluZShjdHgpIHtcclxuICAgIHNldHVwQnVpbHRpbkxheWVycyhjdHgpO1xyXG59XHJcbmV4cG9ydHMuc2V0dXBUaW1lbGluZSA9IHNldHVwVGltZWxpbmU7XHJcbmZ1bmN0aW9uIGFkZEJ1aWx0aW5MYXllcnMoYXBwUmVjb3JkLCBjdHgpIHtcclxuICAgIGZvciAoY29uc3QgbGF5ZXJEZWYgb2YgdGltZWxpbmVfYnVpbHRpbnNfMS5idWlsdGluTGF5ZXJzKSB7XHJcbiAgICAgICAgY3R4LnRpbWVsaW5lTGF5ZXJzLnB1c2goe1xyXG4gICAgICAgICAgICAuLi5sYXllckRlZixcclxuICAgICAgICAgICAgYXBwUmVjb3JkLFxyXG4gICAgICAgICAgICBwbHVnaW46IG51bGwsXHJcbiAgICAgICAgICAgIGV2ZW50czogW10sXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5hZGRCdWlsdGluTGF5ZXJzID0gYWRkQnVpbHRpbkxheWVycztcclxuZnVuY3Rpb24gc2V0dXBCdWlsdGluTGF5ZXJzKGN0eCkge1xyXG4gICAgWydtb3VzZWRvd24nLCAnbW91c2V1cCcsICdjbGljaycsICdkYmxjbGljayddLmZvckVhY2goZXZlbnRUeXBlID0+IHtcclxuICAgICAgICAvLyBAdHMtaWdub3JlXHJcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCBhc3luYyAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgYXdhaXQgYWRkVGltZWxpbmVFdmVudCh7XHJcbiAgICAgICAgICAgICAgICBsYXllcklkOiAnbW91c2UnLFxyXG4gICAgICAgICAgICAgICAgZXZlbnQ6IHtcclxuICAgICAgICAgICAgICAgICAgICB0aW1lOiBEYXRlLm5vdygpLFxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogZXZlbnRUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB4OiBldmVudC5jbGllbnRYLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB5OiBldmVudC5jbGllbnRZLFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IGV2ZW50VHlwZSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sIG51bGwsIGN0eCk7XHJcbiAgICAgICAgfSwge1xyXG4gICAgICAgICAgICBjYXB0dXJlOiB0cnVlLFxyXG4gICAgICAgICAgICBwYXNzaXZlOiB0cnVlLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgICBbJ2tleXVwJywgJ2tleWRvd24nLCAna2V5cHJlc3MnXS5mb3JFYWNoKGV2ZW50VHlwZSA9PiB7XHJcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgYXN5bmMgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGF3YWl0IGFkZFRpbWVsaW5lRXZlbnQoe1xyXG4gICAgICAgICAgICAgICAgbGF5ZXJJZDogJ2tleWJvYXJkJyxcclxuICAgICAgICAgICAgICAgIGV2ZW50OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGltZTogRGF0ZS5ub3coKSxcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGV2ZW50VHlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAga2V5OiBldmVudC5rZXksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmxLZXk6IGV2ZW50LmN0cmxLZXksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNoaWZ0S2V5OiBldmVudC5zaGlmdEtleSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWx0S2V5OiBldmVudC5hbHRLZXksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFLZXk6IGV2ZW50Lm1ldGFLZXksXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogZXZlbnQua2V5LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSwgbnVsbCwgY3R4KTtcclxuICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgIGNhcHR1cmU6IHRydWUsXHJcbiAgICAgICAgICAgIHBhc3NpdmU6IHRydWUsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuICAgIGdsb2JhbF9ob29rXzEuaG9vay5vbihzaGFyZWRfdXRpbHNfMS5Ib29rRXZlbnRzLkNPTVBPTkVOVF9FTUlULCBhc3luYyAoYXBwLCBpbnN0YW5jZSwgZXZlbnQsIHBhcmFtcykgPT4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmICghc2hhcmVkX3V0aWxzXzEuU2hhcmVkRGF0YS5jb21wb25lbnRFdmVudHNFbmFibGVkKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICBjb25zdCBhcHBSZWNvcmQgPSBhd2FpdCAoMCwgYXBwXzEuZ2V0QXBwUmVjb3JkKShhcHAsIGN0eCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudElkID0gYCR7YXBwUmVjb3JkLmlkfToke2luc3RhbmNlLnVpZH1gO1xyXG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnREaXNwbGF5ID0gKGF3YWl0IGFwcFJlY29yZC5iYWNrZW5kLmFwaS5nZXRDb21wb25lbnROYW1lKGluc3RhbmNlKSkgfHwgJzxpPlVua25vd24gQ29tcG9uZW50PC9pPic7XHJcbiAgICAgICAgICAgIGF3YWl0IGFkZFRpbWVsaW5lRXZlbnQoe1xyXG4gICAgICAgICAgICAgICAgbGF5ZXJJZDogJ2NvbXBvbmVudC1ldmVudCcsXHJcbiAgICAgICAgICAgICAgICBldmVudDoge1xyXG4gICAgICAgICAgICAgICAgICAgIHRpbWU6IERhdGUubm93KCksXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9jdXN0b206IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnY29tcG9uZW50LWRlZmluaXRpb24nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6IGNvbXBvbmVudERpc3BsYXksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1zLFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IGV2ZW50LFxyXG4gICAgICAgICAgICAgICAgICAgIHN1YnRpdGxlOiBgYnkgJHtjb21wb25lbnREaXNwbGF5fWAsXHJcbiAgICAgICAgICAgICAgICAgICAgbWV0YToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRJZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYm91bmRzOiBhd2FpdCBhcHBSZWNvcmQuYmFja2VuZC5hcGkuZ2V0Q29tcG9uZW50Qm91bmRzKGluc3RhbmNlKSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSwgYXBwLCBjdHgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBpZiAoc2hhcmVkX3V0aWxzXzEuU2hhcmVkRGF0YS5kZWJ1Z0luZm8pIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5hc3luYyBmdW5jdGlvbiBzZW5kVGltZWxpbmVMYXllcnMoY3R4KSB7XHJcbiAgICB2YXIgX2EsIF9iO1xyXG4gICAgY29uc3QgbGF5ZXJzID0gW107XHJcbiAgICBmb3IgKGNvbnN0IGxheWVyIG9mIGN0eC50aW1lbGluZUxheWVycykge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGxheWVycy5wdXNoKHtcclxuICAgICAgICAgICAgICAgIGlkOiBsYXllci5pZCxcclxuICAgICAgICAgICAgICAgIGxhYmVsOiBsYXllci5sYWJlbCxcclxuICAgICAgICAgICAgICAgIGNvbG9yOiBsYXllci5jb2xvcixcclxuICAgICAgICAgICAgICAgIGFwcElkOiAoX2EgPSBsYXllci5hcHBSZWNvcmQpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5pZCxcclxuICAgICAgICAgICAgICAgIHBsdWdpbklkOiAoX2IgPSBsYXllci5wbHVnaW4pID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi5kZXNjcmlwdG9yLmlkLFxyXG4gICAgICAgICAgICAgICAgZ3JvdXBzT25seTogbGF5ZXIuZ3JvdXBzT25seSxcclxuICAgICAgICAgICAgICAgIHNraXBTY3JlZW5zaG90czogbGF5ZXIuc2tpcFNjcmVlbnNob3RzLFxyXG4gICAgICAgICAgICAgICAgaWdub3JlTm9EdXJhdGlvbkdyb3VwczogbGF5ZXIuaWdub3JlTm9EdXJhdGlvbkdyb3VwcyxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGlmIChzaGFyZWRfdXRpbHNfMS5TaGFyZWREYXRhLmRlYnVnSW5mbykge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGN0eC5icmlkZ2Uuc2VuZChzaGFyZWRfdXRpbHNfMS5CcmlkZ2VFdmVudHMuVE9fRlJPTlRfVElNRUxJTkVfTEFZRVJfTElTVCwge1xyXG4gICAgICAgIGxheWVycyxcclxuICAgIH0pO1xyXG59XHJcbmV4cG9ydHMuc2VuZFRpbWVsaW5lTGF5ZXJzID0gc2VuZFRpbWVsaW5lTGF5ZXJzO1xyXG5hc3luYyBmdW5jdGlvbiBhZGRUaW1lbGluZUV2ZW50KG9wdGlvbnMsIGFwcCwgY3R4KSB7XHJcbiAgICBjb25zdCBhcHBJZCA9IGFwcCA/ICgwLCBhcHBfMS5nZXRBcHBSZWNvcmRJZCkoYXBwKSA6IG51bGw7XHJcbiAgICBjb25zdCBpc0FsbEFwcHMgPSBvcHRpb25zLmFsbCB8fCAhYXBwIHx8IGFwcElkID09IG51bGw7XHJcbiAgICBjb25zdCBpZCA9IGN0eC5uZXh0VGltZWxpbmVFdmVudElkKys7XHJcbiAgICBjb25zdCBldmVudERhdGEgPSB7XHJcbiAgICAgICAgaWQsXHJcbiAgICAgICAgLi4ub3B0aW9ucyxcclxuICAgICAgICBhbGw6IGlzQWxsQXBwcyxcclxuICAgIH07XHJcbiAgICBjdHgudGltZWxpbmVFdmVudE1hcC5zZXQoZXZlbnREYXRhLmlkLCBldmVudERhdGEpO1xyXG4gICAgY3R4LmJyaWRnZS5zZW5kKHNoYXJlZF91dGlsc18xLkJyaWRnZUV2ZW50cy5UT19GUk9OVF9USU1FTElORV9FVkVOVCwge1xyXG4gICAgICAgIGFwcElkOiBldmVudERhdGEuYWxsID8gJ2FsbCcgOiBhcHBJZCxcclxuICAgICAgICBsYXllcklkOiBldmVudERhdGEubGF5ZXJJZCxcclxuICAgICAgICBldmVudDogbWFwVGltZWxpbmVFdmVudChldmVudERhdGEpLFxyXG4gICAgfSk7XHJcbiAgICBjb25zdCBsYXllciA9IGN0eC50aW1lbGluZUxheWVycy5maW5kKGwgPT4geyB2YXIgX2E7IHJldHVybiAoaXNBbGxBcHBzIHx8ICgoX2EgPSBsLmFwcFJlY29yZCkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLm9wdGlvbnMuYXBwKSA9PT0gYXBwKSAmJiBsLmlkID09PSBvcHRpb25zLmxheWVySWQ7IH0pO1xyXG4gICAgaWYgKGxheWVyKSB7XHJcbiAgICAgICAgbGF5ZXIuZXZlbnRzLnB1c2goZXZlbnREYXRhKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHNoYXJlZF91dGlsc18xLlNoYXJlZERhdGEuZGVidWdJbmZvKSB7XHJcbiAgICAgICAgY29uc29sZS53YXJuKGBUaW1lbGluZSBsYXllciAke29wdGlvbnMubGF5ZXJJZH0gbm90IGZvdW5kYCk7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5hZGRUaW1lbGluZUV2ZW50ID0gYWRkVGltZWxpbmVFdmVudDtcclxuZnVuY3Rpb24gbWFwVGltZWxpbmVFdmVudChldmVudERhdGEpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgaWQ6IGV2ZW50RGF0YS5pZCxcclxuICAgICAgICB0aW1lOiBldmVudERhdGEuZXZlbnQudGltZSxcclxuICAgICAgICBsb2dUeXBlOiBldmVudERhdGEuZXZlbnQubG9nVHlwZSxcclxuICAgICAgICBncm91cElkOiBldmVudERhdGEuZXZlbnQuZ3JvdXBJZCxcclxuICAgICAgICB0aXRsZTogZXZlbnREYXRhLmV2ZW50LnRpdGxlLFxyXG4gICAgICAgIHN1YnRpdGxlOiBldmVudERhdGEuZXZlbnQuc3VidGl0bGUsXHJcbiAgICB9O1xyXG59XHJcbmFzeW5jIGZ1bmN0aW9uIGNsZWFyVGltZWxpbmUoY3R4KSB7XHJcbiAgICBjdHgudGltZWxpbmVFdmVudE1hcC5jbGVhcigpO1xyXG4gICAgZm9yIChjb25zdCBsYXllciBvZiBjdHgudGltZWxpbmVMYXllcnMpIHtcclxuICAgICAgICBsYXllci5ldmVudHMgPSBbXTtcclxuICAgIH1cclxuICAgIGZvciAoY29uc3QgYmFja2VuZCBvZiBjdHguYmFja2VuZHMpIHtcclxuICAgICAgICBhd2FpdCBiYWNrZW5kLmFwaS5jbGVhclRpbWVsaW5lKCk7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5jbGVhclRpbWVsaW5lID0gY2xlYXJUaW1lbGluZTtcclxuYXN5bmMgZnVuY3Rpb24gc2VuZFRpbWVsaW5lRXZlbnREYXRhKGlkLCBjdHgpIHtcclxuICAgIGxldCBkYXRhID0gbnVsbDtcclxuICAgIGNvbnN0IGV2ZW50RGF0YSA9IGN0eC50aW1lbGluZUV2ZW50TWFwLmdldChpZCk7XHJcbiAgICBpZiAoZXZlbnREYXRhKSB7XHJcbiAgICAgICAgZGF0YSA9IGF3YWl0IGN0eC5jdXJyZW50QXBwUmVjb3JkLmJhY2tlbmQuYXBpLmluc3BlY3RUaW1lbGluZUV2ZW50KGV2ZW50RGF0YSwgY3R4LmN1cnJlbnRBcHBSZWNvcmQub3B0aW9ucy5hcHApO1xyXG4gICAgICAgIGRhdGEgPSAoMCwgc2hhcmVkX3V0aWxzXzEuc3RyaW5naWZ5KShkYXRhKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHNoYXJlZF91dGlsc18xLlNoYXJlZERhdGEuZGVidWdJbmZvKSB7XHJcbiAgICAgICAgY29uc29sZS53YXJuKGBFdmVudCAke2lkfSBub3QgZm91bmRgLCBjdHgudGltZWxpbmVFdmVudE1hcC5rZXlzKCkpO1xyXG4gICAgfVxyXG4gICAgY3R4LmJyaWRnZS5zZW5kKHNoYXJlZF91dGlsc18xLkJyaWRnZUV2ZW50cy5UT19GUk9OVF9USU1FTElORV9FVkVOVF9EQVRBLCB7XHJcbiAgICAgICAgZXZlbnRJZDogaWQsXHJcbiAgICAgICAgZGF0YSxcclxuICAgIH0pO1xyXG59XHJcbmV4cG9ydHMuc2VuZFRpbWVsaW5lRXZlbnREYXRhID0gc2VuZFRpbWVsaW5lRXZlbnREYXRhO1xyXG5mdW5jdGlvbiByZW1vdmVMYXllcnNGb3JBcHAoYXBwLCBjdHgpIHtcclxuICAgIGNvbnN0IGxheWVycyA9IGN0eC50aW1lbGluZUxheWVycy5maWx0ZXIobCA9PiB7IHZhciBfYTsgcmV0dXJuICgoX2EgPSBsLmFwcFJlY29yZCkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLm9wdGlvbnMuYXBwKSA9PT0gYXBwOyB9KTtcclxuICAgIGZvciAoY29uc3QgbGF5ZXIgb2YgbGF5ZXJzKSB7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSBjdHgudGltZWxpbmVMYXllcnMuaW5kZXhPZihsYXllcik7XHJcbiAgICAgICAgaWYgKGluZGV4ICE9PSAtMSlcclxuICAgICAgICAgICAgY3R4LnRpbWVsaW5lTGF5ZXJzLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgZm9yIChjb25zdCBlIG9mIGxheWVyLmV2ZW50cykge1xyXG4gICAgICAgICAgICBjdHgudGltZWxpbmVFdmVudE1hcC5kZWxldGUoZS5pZCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMucmVtb3ZlTGF5ZXJzRm9yQXBwID0gcmVtb3ZlTGF5ZXJzRm9yQXBwO1xyXG5mdW5jdGlvbiBzZW5kVGltZWxpbmVMYXllckV2ZW50cyhhcHBJZCwgbGF5ZXJJZCwgY3R4KSB7XHJcbiAgICB2YXIgX2E7XHJcbiAgICBjb25zdCBhcHAgPSAoX2EgPSBjdHguYXBwUmVjb3Jkcy5maW5kKGFyID0+IGFyLmlkID09PSBhcHBJZCkpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5vcHRpb25zLmFwcDtcclxuICAgIGlmICghYXBwKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIGNvbnN0IGxheWVyID0gY3R4LnRpbWVsaW5lTGF5ZXJzLmZpbmQobCA9PiB7IHZhciBfYTsgcmV0dXJuICgoX2EgPSBsLmFwcFJlY29yZCkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLm9wdGlvbnMuYXBwKSA9PT0gYXBwICYmIGwuaWQgPT09IGxheWVySWQ7IH0pO1xyXG4gICAgaWYgKCFsYXllcilcclxuICAgICAgICByZXR1cm47XHJcbiAgICBjdHguYnJpZGdlLnNlbmQoc2hhcmVkX3V0aWxzXzEuQnJpZGdlRXZlbnRzLlRPX0ZST05UX1RJTUVMSU5FX0xBWUVSX0xPQURfRVZFTlRTLCB7XHJcbiAgICAgICAgYXBwSWQsXHJcbiAgICAgICAgbGF5ZXJJZCxcclxuICAgICAgICBldmVudHM6IGxheWVyLmV2ZW50cy5tYXAoZSA9PiBtYXBUaW1lbGluZUV2ZW50KGUpKSxcclxuICAgIH0pO1xyXG59XHJcbmV4cG9ydHMuc2VuZFRpbWVsaW5lTGF5ZXJFdmVudHMgPSBzZW5kVGltZWxpbmVMYXllckV2ZW50cztcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dGltZWxpbmUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5Kb2JRdWV1ZSA9IHZvaWQgMDtcclxuY2xhc3MgSm9iUXVldWUge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5qb2JzID0gW107XHJcbiAgICB9XHJcbiAgICBxdWV1ZShqb2IpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IG9uRG9uZSA9ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudEpvYiA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBuZXh0Sm9iID0gdGhpcy5qb2JzLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgICAgICBpZiAobmV4dEpvYikge1xyXG4gICAgICAgICAgICAgICAgICAgIG5leHRKb2IoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgY29uc3QgcnVuID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50Sm9iID0gam9iO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGpvYigpLnRoZW4ob25Eb25lKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudEpvYikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5qb2JzLnB1c2goKCkgPT4gcnVuKCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcnVuKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkpvYlF1ZXVlID0gSm9iUXVldWU7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXF1ZXVlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuaXNTdWJzY3JpYmVkID0gZXhwb3J0cy51bnN1YnNjcmliZSA9IGV4cG9ydHMuc3Vic2NyaWJlID0gdm9pZCAwO1xyXG5jb25zdCBhY3RpdmVTdWJzID0gbmV3IE1hcCgpO1xyXG5mdW5jdGlvbiBnZXRTdWJzKHR5cGUpIHtcclxuICAgIGxldCBzdWJzID0gYWN0aXZlU3Vicy5nZXQodHlwZSk7XHJcbiAgICBpZiAoIXN1YnMpIHtcclxuICAgICAgICBzdWJzID0gW107XHJcbiAgICAgICAgYWN0aXZlU3Vicy5zZXQodHlwZSwgc3Vicyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gc3VicztcclxufVxyXG5mdW5jdGlvbiBzdWJzY3JpYmUodHlwZSwgcGF5bG9hZCkge1xyXG4gICAgY29uc3QgcmF3UGF5bG9hZCA9IGdldFJhd1BheWxvYWQocGF5bG9hZCk7XHJcbiAgICBnZXRTdWJzKHR5cGUpLnB1c2goe1xyXG4gICAgICAgIHBheWxvYWQsXHJcbiAgICAgICAgcmF3UGF5bG9hZCxcclxuICAgIH0pO1xyXG59XHJcbmV4cG9ydHMuc3Vic2NyaWJlID0gc3Vic2NyaWJlO1xyXG5mdW5jdGlvbiB1bnN1YnNjcmliZSh0eXBlLCBwYXlsb2FkKSB7XHJcbiAgICBjb25zdCByYXdQYXlsb2FkID0gZ2V0UmF3UGF5bG9hZChwYXlsb2FkKTtcclxuICAgIGNvbnN0IHN1YnMgPSBnZXRTdWJzKHR5cGUpO1xyXG4gICAgbGV0IGluZGV4O1xyXG4gICAgd2hpbGUgKChpbmRleCA9IHN1YnMuZmluZEluZGV4KHN1YiA9PiBzdWIucmF3UGF5bG9hZCA9PT0gcmF3UGF5bG9hZCkpICE9PSAtMSkge1xyXG4gICAgICAgIHN1YnMuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLnVuc3Vic2NyaWJlID0gdW5zdWJzY3JpYmU7XHJcbmZ1bmN0aW9uIGdldFJhd1BheWxvYWQocGF5bG9hZCkge1xyXG4gICAgY29uc3QgZGF0YSA9IE9iamVjdC5rZXlzKHBheWxvYWQpLnNvcnQoKS5yZWR1Y2UoKGFjYywga2V5KSA9PiB7XHJcbiAgICAgICAgYWNjW2tleV0gPSBwYXlsb2FkW2tleV07XHJcbiAgICAgICAgcmV0dXJuIGFjYztcclxuICAgIH0sIHt9KTtcclxuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShkYXRhKTtcclxufVxyXG5mdW5jdGlvbiBpc1N1YnNjcmliZWQodHlwZSwgcHJlZGljYXRlID0gKCkgPT4gdHJ1ZSkge1xyXG4gICAgcmV0dXJuIGdldFN1YnModHlwZSkuc29tZShwcmVkaWNhdGUpO1xyXG59XHJcbmV4cG9ydHMuaXNTdWJzY3JpYmVkID0gaXNTdWJzY3JpYmVkO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1zdWJzY3JpcHRpb25zLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuZWRpdFN0YXRlID0gZXhwb3J0cy5maW5kSW5zdGFuY2VPclZub2RlID0gZXhwb3J0cy5nZXRJbnN0YW5jZU5hbWUgPSBleHBvcnRzLnJlZHVjZVN0YXRlTGlzdCA9IGV4cG9ydHMuZ2V0Q3VzdG9tSW5zdGFuY2VEZXRhaWxzID0gZXhwb3J0cy5nZXRJbnN0YW5jZURldGFpbHMgPSB2b2lkIDA7XHJcbmNvbnN0IHNoYXJlZF91dGlsc18xID0gcmVxdWlyZShcIkB2dWUtZGV2dG9vbHMvc2hhcmVkLXV0aWxzXCIpO1xyXG5jb25zdCB0cmVlXzEgPSByZXF1aXJlKFwiLi90cmVlXCIpO1xyXG4vKipcclxuICogR2V0IHRoZSBkZXRhaWxlZCBpbmZvcm1hdGlvbiBvZiBhbiBpbnNwZWN0ZWQgaW5zdGFuY2UuXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRJbnN0YW5jZURldGFpbHMoaW5zdGFuY2UpIHtcclxuICAgIHZhciBfYSwgX2I7XHJcbiAgICBpZiAoaW5zdGFuY2UuX19WVUVfREVWVE9PTFNfRlVOQ1RJT05BTF9MRUdBQ1lfXykge1xyXG4gICAgICAgIGNvbnN0IHZub2RlID0gZmluZEluc3RhbmNlT3JWbm9kZShpbnN0YW5jZS5fX1ZVRV9ERVZUT09MU19VSURfXyk7XHJcbiAgICAgICAgaWYgKCF2bm9kZSlcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgY29uc3QgZmFrZUluc3RhbmNlID0ge1xyXG4gICAgICAgICAgICAkb3B0aW9uczogdm5vZGUuZm5PcHRpb25zLFxyXG4gICAgICAgICAgICAuLi4oKF9hID0gdm5vZGUuZGV2dG9vbHNNZXRhKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EucmVuZGVyQ29udGV4dC5wcm9wcyksXHJcbiAgICAgICAgfTtcclxuICAgICAgICBpZiAoIWZha2VJbnN0YW5jZS4kb3B0aW9ucy5wcm9wcyAmJiAoKF9iID0gdm5vZGUuZGV2dG9vbHNNZXRhKSA9PT0gbnVsbCB8fCBfYiA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2IucmVuZGVyQ29udGV4dC5wcm9wcykpIHtcclxuICAgICAgICAgICAgZmFrZUluc3RhbmNlLiRvcHRpb25zLnByb3BzID0gT2JqZWN0LmtleXModm5vZGUuZGV2dG9vbHNNZXRhLnJlbmRlckNvbnRleHQucHJvcHMpLnJlZHVjZSgob2JqLCBrZXkpID0+IHtcclxuICAgICAgICAgICAgICAgIG9ialtrZXldID0ge307XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgICAgICAgICB9LCB7fSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGlkOiBpbnN0YW5jZS5fX1ZVRV9ERVZUT09MU19VSURfXyxcclxuICAgICAgICAgICAgbmFtZTogKDAsIHNoYXJlZF91dGlsc18xLmdldENvbXBvbmVudE5hbWUpKHZub2RlLmZuT3B0aW9ucyksXHJcbiAgICAgICAgICAgIGZpbGU6IGluc3RhbmNlLnR5cGUgPyBpbnN0YW5jZS50eXBlLl9fZmlsZSA6IHZub2RlLmZuT3B0aW9ucy5fX2ZpbGUgfHwgbnVsbCxcclxuICAgICAgICAgICAgc3RhdGU6IGdldEZ1bmN0aW9uYWxJbnN0YW5jZVN0YXRlKGZha2VJbnN0YW5jZSksXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uYWw6IHRydWUsXHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gZGF0YTtcclxuICAgIH1cclxuICAgIGNvbnN0IGRhdGEgPSB7XHJcbiAgICAgICAgaWQ6IGluc3RhbmNlLl9fVlVFX0RFVlRPT0xTX1VJRF9fLFxyXG4gICAgICAgIG5hbWU6IGdldEluc3RhbmNlTmFtZShpbnN0YW5jZSksXHJcbiAgICAgICAgc3RhdGU6IGdldEluc3RhbmNlU3RhdGUoaW5zdGFuY2UpLFxyXG4gICAgICAgIGZpbGU6IG51bGwsXHJcbiAgICB9O1xyXG4gICAgbGV0IGk7XHJcbiAgICBpZiAoKGkgPSBpbnN0YW5jZS4kdm5vZGUpICYmIChpID0gaS5jb21wb25lbnRPcHRpb25zKSAmJiAoaSA9IGkuQ3RvcikgJiYgKGkgPSBpLm9wdGlvbnMpKSB7XHJcbiAgICAgICAgZGF0YS5maWxlID0gaS5fX2ZpbGUgfHwgbnVsbDtcclxuICAgIH1cclxuICAgIHJldHVybiBkYXRhO1xyXG59XHJcbmV4cG9ydHMuZ2V0SW5zdGFuY2VEZXRhaWxzID0gZ2V0SW5zdGFuY2VEZXRhaWxzO1xyXG5mdW5jdGlvbiBnZXRJbnN0YW5jZVN0YXRlKGluc3RhbmNlKSB7XHJcbiAgICByZXR1cm4gcHJvY2Vzc1Byb3BzKGluc3RhbmNlKS5jb25jYXQocHJvY2Vzc1N0YXRlKGluc3RhbmNlKSwgcHJvY2Vzc1JlZnMoaW5zdGFuY2UpLCBwcm9jZXNzQ29tcHV0ZWQoaW5zdGFuY2UpLCBwcm9jZXNzSW5qZWN0ZWQoaW5zdGFuY2UpLCBwcm9jZXNzUm91dGVDb250ZXh0KGluc3RhbmNlKSwgcHJvY2Vzc1Z1ZXhHZXR0ZXJzKGluc3RhbmNlKSwgcHJvY2Vzc0ZpcmViYXNlQmluZGluZ3MoaW5zdGFuY2UpLCBwcm9jZXNzT2JzZXJ2YWJsZXMoaW5zdGFuY2UpLCBwcm9jZXNzQXR0cnMoaW5zdGFuY2UpKTtcclxufVxyXG5mdW5jdGlvbiBnZXRGdW5jdGlvbmFsSW5zdGFuY2VTdGF0ZShpbnN0YW5jZSkge1xyXG4gICAgcmV0dXJuIHByb2Nlc3NQcm9wcyhpbnN0YW5jZSk7XHJcbn1cclxuZnVuY3Rpb24gZ2V0Q3VzdG9tSW5zdGFuY2VEZXRhaWxzKGluc3RhbmNlKSB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGdldEluc3RhbmNlU3RhdGUoaW5zdGFuY2UpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBfY3VzdG9tOiB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdjb21wb25lbnQnLFxyXG4gICAgICAgICAgICBpZDogaW5zdGFuY2UuX19WVUVfREVWVE9PTFNfVUlEX18sXHJcbiAgICAgICAgICAgIGRpc3BsYXk6IGdldEluc3RhbmNlTmFtZShpbnN0YW5jZSksXHJcbiAgICAgICAgICAgIHRvb2x0aXA6ICdDb21wb25lbnQgaW5zdGFuY2UnLFxyXG4gICAgICAgICAgICB2YWx1ZTogcmVkdWNlU3RhdGVMaXN0KHN0YXRlKSxcclxuICAgICAgICAgICAgZmllbGRzOiB7XHJcbiAgICAgICAgICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLmdldEN1c3RvbUluc3RhbmNlRGV0YWlscyA9IGdldEN1c3RvbUluc3RhbmNlRGV0YWlscztcclxuZnVuY3Rpb24gcmVkdWNlU3RhdGVMaXN0KGxpc3QpIHtcclxuICAgIGlmICghbGlzdC5sZW5ndGgpIHtcclxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGxpc3QucmVkdWNlKChtYXAsIGl0ZW0pID0+IHtcclxuICAgICAgICBjb25zdCBrZXkgPSBpdGVtLnR5cGUgfHwgJ2RhdGEnO1xyXG4gICAgICAgIGNvbnN0IG9iaiA9IG1hcFtrZXldID0gbWFwW2tleV0gfHwge307XHJcbiAgICAgICAgb2JqW2l0ZW0ua2V5XSA9IGl0ZW0udmFsdWU7XHJcbiAgICAgICAgcmV0dXJuIG1hcDtcclxuICAgIH0sIHt9KTtcclxufVxyXG5leHBvcnRzLnJlZHVjZVN0YXRlTGlzdCA9IHJlZHVjZVN0YXRlTGlzdDtcclxuLyoqXHJcbiAqIEdldCB0aGUgYXBwcm9wcmlhdGUgZGlzcGxheSBuYW1lIGZvciBhbiBpbnN0YW5jZS5cclxuICovXHJcbmZ1bmN0aW9uIGdldEluc3RhbmNlTmFtZShpbnN0YW5jZSkge1xyXG4gICAgY29uc3QgbmFtZSA9ICgwLCBzaGFyZWRfdXRpbHNfMS5nZXRDb21wb25lbnROYW1lKShpbnN0YW5jZS4kb3B0aW9ucyB8fCBpbnN0YW5jZS5mbk9wdGlvbnMgfHwge30pO1xyXG4gICAgaWYgKG5hbWUpXHJcbiAgICAgICAgcmV0dXJuIG5hbWU7XHJcbiAgICByZXR1cm4gaW5zdGFuY2UuJHJvb3QgPT09IGluc3RhbmNlXHJcbiAgICAgICAgPyAnUm9vdCdcclxuICAgICAgICA6ICdBbm9ueW1vdXMgQ29tcG9uZW50JztcclxufVxyXG5leHBvcnRzLmdldEluc3RhbmNlTmFtZSA9IGdldEluc3RhbmNlTmFtZTtcclxuLyoqXHJcbiAqIFByb2Nlc3MgdGhlIHByb3BzIG9mIGFuIGluc3RhbmNlLlxyXG4gKiBNYWtlIHN1cmUgcmV0dXJuIGEgcGxhaW4gb2JqZWN0IGJlY2F1c2Ugd2luZG93LnBvc3RNZXNzYWdlKClcclxuICogd2lsbCB0aHJvdyBhbiBFcnJvciBpZiB0aGUgcGFzc2VkIG9iamVjdCBjb250YWlucyBGdW5jdGlvbnMuXHJcbiAqL1xyXG5mdW5jdGlvbiBwcm9jZXNzUHJvcHMoaW5zdGFuY2UpIHtcclxuICAgIGNvbnN0IHByb3BzID0gaW5zdGFuY2UuJG9wdGlvbnMucHJvcHM7XHJcbiAgICBjb25zdCBwcm9wc0RhdGEgPSBbXTtcclxuICAgIGZvciAobGV0IGtleSBpbiBwcm9wcykge1xyXG4gICAgICAgIGNvbnN0IHByb3AgPSBwcm9wc1trZXldO1xyXG4gICAgICAgIGtleSA9ICgwLCBzaGFyZWRfdXRpbHNfMS5jYW1lbGl6ZSkoa2V5KTtcclxuICAgICAgICBwcm9wc0RhdGEucHVzaCh7XHJcbiAgICAgICAgICAgIHR5cGU6ICdwcm9wcycsXHJcbiAgICAgICAgICAgIGtleSxcclxuICAgICAgICAgICAgdmFsdWU6IGluc3RhbmNlW2tleV0sXHJcbiAgICAgICAgICAgIG1ldGE6IHByb3BcclxuICAgICAgICAgICAgICAgID8ge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IHByb3AudHlwZSA/IGdldFByb3BUeXBlKHByb3AudHlwZSkgOiAnYW55JyxcclxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogISFwcm9wLnJlcXVpcmVkLFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2ludmFsaWQnLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZWRpdGFibGU6IHNoYXJlZF91dGlsc18xLlNoYXJlZERhdGEuZWRpdGFibGVQcm9wcyxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIHJldHVybiBwcm9wc0RhdGE7XHJcbn1cclxuZnVuY3Rpb24gcHJvY2Vzc0F0dHJzKGluc3RhbmNlKSB7XHJcbiAgICByZXR1cm4gT2JqZWN0LmVudHJpZXMoaW5zdGFuY2UuJGF0dHJzIHx8IHt9KS5tYXAoKFtrZXksIHZhbHVlXSkgPT4ge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHR5cGU6ICckYXR0cnMnLFxyXG4gICAgICAgICAgICBrZXksXHJcbiAgICAgICAgICAgIHZhbHVlLFxyXG4gICAgICAgIH07XHJcbiAgICB9KTtcclxufVxyXG5jb25zdCBmblR5cGVSRSA9IC9eKD86ZnVuY3Rpb258Y2xhc3MpIChcXHcrKS87XHJcbi8qKlxyXG4gKiBDb252ZXJ0IHByb3AgdHlwZSBjb25zdHJ1Y3RvciB0byBzdHJpbmcuXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRQcm9wVHlwZSh0eXBlKSB7XHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh0eXBlKSkge1xyXG4gICAgICAgIHJldHVybiB0eXBlLm1hcCh0ID0+IGdldFByb3BUeXBlKHQpKS5qb2luKCcgb3IgJyk7XHJcbiAgICB9XHJcbiAgICBpZiAodHlwZSA9PSBudWxsKSB7XHJcbiAgICAgICAgcmV0dXJuICdudWxsJztcclxuICAgIH1cclxuICAgIGNvbnN0IG1hdGNoID0gdHlwZS50b1N0cmluZygpLm1hdGNoKGZuVHlwZVJFKTtcclxuICAgIHJldHVybiB0eXBlb2YgdHlwZSA9PT0gJ2Z1bmN0aW9uJ1xyXG4gICAgICAgID8gKG1hdGNoICYmIG1hdGNoWzFdKSB8fCAnYW55J1xyXG4gICAgICAgIDogJ2FueSc7XHJcbn1cclxuLyoqXHJcbiAqIFByb2Nlc3Mgc3RhdGUsIGZpbHRlcmluZyBvdXQgcHJvcHMgYW5kIFwiY2xlYW5cIiB0aGUgcmVzdWx0XHJcbiAqIHdpdGggYSBKU09OIGRhbmNlLiBUaGlzIHJlbW92ZXMgZnVuY3Rpb25zIHdoaWNoIGNhbiBjYXVzZVxyXG4gKiBlcnJvcnMgZHVyaW5nIHN0cnVjdHVyZWQgY2xvbmUgdXNlZCBieSB3aW5kb3cucG9zdE1lc3NhZ2UuXHJcbiAqL1xyXG5mdW5jdGlvbiBwcm9jZXNzU3RhdGUoaW5zdGFuY2UpIHtcclxuICAgIGNvbnN0IHByb3BzID0gaW5zdGFuY2UuJG9wdGlvbnMucHJvcHM7XHJcbiAgICBjb25zdCBnZXR0ZXJzID0gaW5zdGFuY2UuJG9wdGlvbnMudnVleCAmJlxyXG4gICAgICAgIGluc3RhbmNlLiRvcHRpb25zLnZ1ZXguZ2V0dGVycztcclxuICAgIHJldHVybiBPYmplY3Qua2V5cyhpbnN0YW5jZS5fZGF0YSlcclxuICAgICAgICAuZmlsdGVyKGtleSA9PiAoIShwcm9wcyAmJiBrZXkgaW4gcHJvcHMpICYmXHJcbiAgICAgICAgIShnZXR0ZXJzICYmIGtleSBpbiBnZXR0ZXJzKSkpXHJcbiAgICAgICAgLm1hcChrZXkgPT4gKHtcclxuICAgICAgICBrZXksXHJcbiAgICAgICAgdHlwZTogJ2RhdGEnLFxyXG4gICAgICAgIHZhbHVlOiBpbnN0YW5jZS5fZGF0YVtrZXldLFxyXG4gICAgICAgIGVkaXRhYmxlOiB0cnVlLFxyXG4gICAgfSkpO1xyXG59XHJcbi8qKlxyXG4gKiBQcm9jZXNzIHJlZnNcclxuICovXHJcbmZ1bmN0aW9uIHByb2Nlc3NSZWZzKGluc3RhbmNlKSB7XHJcbiAgICByZXR1cm4gT2JqZWN0LmtleXMoaW5zdGFuY2UuJHJlZnMpXHJcbiAgICAgICAgLmZpbHRlcihrZXkgPT4gaW5zdGFuY2UuJHJlZnNba2V5XSlcclxuICAgICAgICAubWFwKGtleSA9PiAoMCwgc2hhcmVkX3V0aWxzXzEuZ2V0Q3VzdG9tUmVmRGV0YWlscykoaW5zdGFuY2UsIGtleSwgaW5zdGFuY2UuJHJlZnNba2V5XSkpO1xyXG59XHJcbi8qKlxyXG4gKiBQcm9jZXNzIHRoZSBjb21wdXRlZCBwcm9wZXJ0aWVzIG9mIGFuIGluc3RhbmNlLlxyXG4gKi9cclxuZnVuY3Rpb24gcHJvY2Vzc0NvbXB1dGVkKGluc3RhbmNlKSB7XHJcbiAgICBjb25zdCBjb21wdXRlZCA9IFtdO1xyXG4gICAgY29uc3QgZGVmcyA9IGluc3RhbmNlLiRvcHRpb25zLmNvbXB1dGVkIHx8IHt9O1xyXG4gICAgLy8gdXNlIGZvci4uLmluIGhlcmUgYmVjYXVzZSBpZiAnY29tcHV0ZWQnIGlzIG5vdCBkZWZpbmVkXHJcbiAgICAvLyBvbiBjb21wb25lbnQsIGNvbXB1dGVkIHByb3BlcnRpZXMgd2lsbCBiZSBwbGFjZWQgaW4gcHJvdG90eXBlXHJcbiAgICAvLyBhbmQgT2JqZWN0LmtleXMgZG9lcyBub3QgaW5jbHVkZVxyXG4gICAgLy8gcHJvcGVydGllcyBmcm9tIG9iamVjdCdzIHByb3RvdHlwZVxyXG4gICAgZm9yIChjb25zdCBrZXkgaW4gZGVmcykge1xyXG4gICAgICAgIGNvbnN0IGRlZiA9IGRlZnNba2V5XTtcclxuICAgICAgICBjb25zdCB0eXBlID0gdHlwZW9mIGRlZiA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWYudnVleFxyXG4gICAgICAgICAgICA/ICd2dWV4IGJpbmRpbmdzJ1xyXG4gICAgICAgICAgICA6ICdjb21wdXRlZCc7XHJcbiAgICAgICAgLy8gdXNlIHRyeSAuLi4gY2F0Y2ggaGVyZSBiZWNhdXNlIHNvbWUgY29tcHV0ZWQgcHJvcGVydGllcyBtYXlcclxuICAgICAgICAvLyB0aHJvdyBlcnJvciBkdXJpbmcgaXRzIGV2YWx1YXRpb25cclxuICAgICAgICBsZXQgY29tcHV0ZWRQcm9wID0gbnVsbDtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb21wdXRlZFByb3AgPSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlLFxyXG4gICAgICAgICAgICAgICAga2V5LFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IGluc3RhbmNlW2tleV0sXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGNvbXB1dGVkUHJvcCA9IHtcclxuICAgICAgICAgICAgICAgIHR5cGUsXHJcbiAgICAgICAgICAgICAgICBrZXksXHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogZSxcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29tcHV0ZWQucHVzaChjb21wdXRlZFByb3ApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGNvbXB1dGVkO1xyXG59XHJcbi8qKlxyXG4gKiBQcm9jZXNzIFZ1ZXggZ2V0dGVycy5cclxuICovXHJcbmZ1bmN0aW9uIHByb2Nlc3NJbmplY3RlZChpbnN0YW5jZSkge1xyXG4gICAgY29uc3QgaW5qZWN0ZWQgPSBpbnN0YW5jZS4kb3B0aW9ucy5pbmplY3Q7XHJcbiAgICBpZiAoaW5qZWN0ZWQpIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMoaW5qZWN0ZWQpLm1hcChrZXkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAga2V5LFxyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2luamVjdGVkJyxcclxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnN0YW5jZVtrZXldLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG59XHJcbi8qKlxyXG4gKiBQcm9jZXNzIHBvc3NpYmxlIHZ1ZS1yb3V0ZXIgJHJvdXRlIGNvbnRleHRcclxuICovXHJcbmZ1bmN0aW9uIHByb2Nlc3NSb3V0ZUNvbnRleHQoaW5zdGFuY2UpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3Qgcm91dGUgPSBpbnN0YW5jZS4kcm91dGU7XHJcbiAgICAgICAgaWYgKHJvdXRlKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgcGF0aCwgcXVlcnksIHBhcmFtcyB9ID0gcm91dGU7XHJcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0geyBwYXRoLCBxdWVyeSwgcGFyYW1zIH07XHJcbiAgICAgICAgICAgIGlmIChyb3V0ZS5mdWxsUGF0aClcclxuICAgICAgICAgICAgICAgIHZhbHVlLmZ1bGxQYXRoID0gcm91dGUuZnVsbFBhdGg7XHJcbiAgICAgICAgICAgIGlmIChyb3V0ZS5oYXNoKVxyXG4gICAgICAgICAgICAgICAgdmFsdWUuaGFzaCA9IHJvdXRlLmhhc2g7XHJcbiAgICAgICAgICAgIGlmIChyb3V0ZS5uYW1lKVxyXG4gICAgICAgICAgICAgICAgdmFsdWUubmFtZSA9IHJvdXRlLm5hbWU7XHJcbiAgICAgICAgICAgIGlmIChyb3V0ZS5tZXRhKVxyXG4gICAgICAgICAgICAgICAgdmFsdWUubWV0YSA9IHJvdXRlLm1ldGE7XHJcbiAgICAgICAgICAgIHJldHVybiBbe1xyXG4gICAgICAgICAgICAgICAgICAgIGtleTogJyRyb3V0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3JvdXRlJyxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBfY3VzdG9tOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAncm91dGVyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFic3RyYWN0OiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIH1dO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgLy8gSW52YWxpZCAkcm91dGVyXHJcbiAgICB9XHJcbiAgICByZXR1cm4gW107XHJcbn1cclxuLyoqXHJcbiAqIFByb2Nlc3MgVnVleCBnZXR0ZXJzLlxyXG4gKi9cclxuZnVuY3Rpb24gcHJvY2Vzc1Z1ZXhHZXR0ZXJzKGluc3RhbmNlKSB7XHJcbiAgICBjb25zdCBnZXR0ZXJzID0gaW5zdGFuY2UuJG9wdGlvbnMudnVleCAmJlxyXG4gICAgICAgIGluc3RhbmNlLiRvcHRpb25zLnZ1ZXguZ2V0dGVycztcclxuICAgIGlmIChnZXR0ZXJzKSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKGdldHRlcnMpLm1hcChrZXkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3Z1ZXggZ2V0dGVycycsXHJcbiAgICAgICAgICAgICAgICBrZXksXHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5zdGFuY2Vba2V5XSxcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxufVxyXG4vKipcclxuICogUHJvY2VzcyBGaXJlYmFzZSBiaW5kaW5ncy5cclxuICovXHJcbmZ1bmN0aW9uIHByb2Nlc3NGaXJlYmFzZUJpbmRpbmdzKGluc3RhbmNlKSB7XHJcbiAgICBjb25zdCByZWZzID0gaW5zdGFuY2UuJGZpcmViYXNlUmVmcztcclxuICAgIGlmIChyZWZzKSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHJlZnMpLm1hcChrZXkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2ZpcmViYXNlIGJpbmRpbmdzJyxcclxuICAgICAgICAgICAgICAgIGtleSxcclxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnN0YW5jZVtrZXldLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG59XHJcbi8qKlxyXG4gKiBQcm9jZXNzIHZ1ZS1yeCBvYnNlcnZhYmxlIGJpbmRpbmdzLlxyXG4gKi9cclxuZnVuY3Rpb24gcHJvY2Vzc09ic2VydmFibGVzKGluc3RhbmNlKSB7XHJcbiAgICBjb25zdCBvYnMgPSBpbnN0YW5jZS4kb2JzZXJ2YWJsZXM7XHJcbiAgICBpZiAob2JzKSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKG9icykubWFwKGtleSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnb2JzZXJ2YWJsZXMnLFxyXG4gICAgICAgICAgICAgICAga2V5LFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IGluc3RhbmNlW2tleV0sXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICByZXR1cm4gW107XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gZmluZEluc3RhbmNlT3JWbm9kZShpZCkge1xyXG4gICAgaWYgKC86ZnVuY3Rpb25hbDovLnRlc3QoaWQpKSB7XHJcbiAgICAgICAgY29uc3QgW3JlZklkXSA9IGlkLnNwbGl0KCc6ZnVuY3Rpb25hbDonKTtcclxuICAgICAgICBjb25zdCBtYXAgPSB0cmVlXzEuZnVuY3Rpb25hbFZub2RlTWFwLmdldChyZWZJZCk7XHJcbiAgICAgICAgcmV0dXJuIG1hcCAmJiBtYXBbaWRdO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRyZWVfMS5pbnN0YW5jZU1hcC5nZXQoaWQpO1xyXG59XHJcbmV4cG9ydHMuZmluZEluc3RhbmNlT3JWbm9kZSA9IGZpbmRJbnN0YW5jZU9yVm5vZGU7XHJcbmZ1bmN0aW9uIGVkaXRTdGF0ZSh7IGNvbXBvbmVudEluc3RhbmNlLCBwYXRoLCBzdGF0ZSwgdHlwZSB9LCBzdGF0ZUVkaXRvcikge1xyXG4gICAgaWYgKCFbJ2RhdGEnLCAncHJvcHMnLCAnY29tcHV0ZWQnLCAnc2V0dXAnXS5pbmNsdWRlcyh0eXBlKSlcclxuICAgICAgICByZXR1cm47XHJcbiAgICBjb25zdCBkYXRhID0gc3RhdGVFZGl0b3IuaGFzKGNvbXBvbmVudEluc3RhbmNlLl9wcm9wcywgcGF0aCwgISFzdGF0ZS5uZXdLZXkpXHJcbiAgICAgICAgPyBjb21wb25lbnRJbnN0YW5jZS5fcHJvcHNcclxuICAgICAgICA6IGNvbXBvbmVudEluc3RhbmNlLl9kYXRhO1xyXG4gICAgc3RhdGVFZGl0b3Iuc2V0KGRhdGEsIHBhdGgsIHN0YXRlLnZhbHVlLCBzdGF0ZUVkaXRvci5jcmVhdGVEZWZhdWx0U2V0Q2FsbGJhY2soc3RhdGUpKTtcclxufVxyXG5leHBvcnRzLmVkaXRTdGF0ZSA9IGVkaXRTdGF0ZTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLmdldFJvb3RFbGVtZW50c0Zyb21Db21wb25lbnRJbnN0YW5jZSA9IGV4cG9ydHMuZmluZFJlbGF0ZWRDb21wb25lbnQgPSBleHBvcnRzLmdldEluc3RhbmNlT3JWbm9kZVJlY3QgPSB2b2lkIDA7XHJcbmNvbnN0IHNoYXJlZF91dGlsc18xID0gcmVxdWlyZShcIkB2dWUtZGV2dG9vbHMvc2hhcmVkLXV0aWxzXCIpO1xyXG5mdW5jdGlvbiBjcmVhdGVSZWN0KCkge1xyXG4gICAgY29uc3QgcmVjdCA9IHtcclxuICAgICAgICB0b3A6IDAsXHJcbiAgICAgICAgYm90dG9tOiAwLFxyXG4gICAgICAgIGxlZnQ6IDAsXHJcbiAgICAgICAgcmlnaHQ6IDAsXHJcbiAgICAgICAgZ2V0IHdpZHRoKCkgeyByZXR1cm4gcmVjdC5yaWdodCAtIHJlY3QubGVmdDsgfSxcclxuICAgICAgICBnZXQgaGVpZ2h0KCkgeyByZXR1cm4gcmVjdC5ib3R0b20gLSByZWN0LnRvcDsgfSxcclxuICAgIH07XHJcbiAgICByZXR1cm4gcmVjdDtcclxufVxyXG5mdW5jdGlvbiBtZXJnZVJlY3RzKGEsIGIpIHtcclxuICAgIGlmICghYS50b3AgfHwgYi50b3AgPCBhLnRvcCkge1xyXG4gICAgICAgIGEudG9wID0gYi50b3A7XHJcbiAgICB9XHJcbiAgICBpZiAoIWEuYm90dG9tIHx8IGIuYm90dG9tID4gYS5ib3R0b20pIHtcclxuICAgICAgICBhLmJvdHRvbSA9IGIuYm90dG9tO1xyXG4gICAgfVxyXG4gICAgaWYgKCFhLmxlZnQgfHwgYi5sZWZ0IDwgYS5sZWZ0KSB7XHJcbiAgICAgICAgYS5sZWZ0ID0gYi5sZWZ0O1xyXG4gICAgfVxyXG4gICAgaWYgKCFhLnJpZ2h0IHx8IGIucmlnaHQgPiBhLnJpZ2h0KSB7XHJcbiAgICAgICAgYS5yaWdodCA9IGIucmlnaHQ7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYTtcclxufVxyXG4vKipcclxuICogR2V0IHRoZSBjbGllbnQgcmVjdCBmb3IgYW4gaW5zdGFuY2UuXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRJbnN0YW5jZU9yVm5vZGVSZWN0KGluc3RhbmNlKSB7XHJcbiAgICBjb25zdCBlbCA9IGluc3RhbmNlLiRlbCB8fCBpbnN0YW5jZS5lbG07XHJcbiAgICBpZiAoIXNoYXJlZF91dGlsc18xLmlzQnJvd3Nlcikge1xyXG4gICAgICAgIC8vIFRPRE86IEZpbmQgcG9zaXRpb24gZnJvbSBpbnN0YW5jZSBvciBhIHZub2RlIChmb3IgZnVuY3Rpb25hbCBjb21wb25lbnRzKS5cclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBpZiAoISgwLCBzaGFyZWRfdXRpbHNfMS5pbkRvYykoZWwpKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaWYgKGluc3RhbmNlLl9pc0ZyYWdtZW50KSB7XHJcbiAgICAgICAgcmV0dXJuIGFkZElmcmFtZVBvc2l0aW9uKGdldExlZ2FjeUZyYWdtZW50UmVjdChpbnN0YW5jZSksIGdldEVsV2luZG93KGluc3RhbmNlLiRyb290LiRlbCkpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoZWwubm9kZVR5cGUgPT09IDEpIHtcclxuICAgICAgICByZXR1cm4gYWRkSWZyYW1lUG9zaXRpb24oZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksIGdldEVsV2luZG93KGVsKSk7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5nZXRJbnN0YW5jZU9yVm5vZGVSZWN0ID0gZ2V0SW5zdGFuY2VPclZub2RlUmVjdDtcclxuLyoqXHJcbiAqIEhpZ2hsaWdodCBhIGZyYWdtZW50IGluc3RhbmNlLlxyXG4gKiBMb29wIG92ZXIgaXRzIG5vZGUgcmFuZ2UgYW5kIGRldGVybWluZSBpdHMgYm91bmRpbmcgYm94LlxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0TGVnYWN5RnJhZ21lbnRSZWN0KHsgX2ZyYWdtZW50U3RhcnQsIF9mcmFnbWVudEVuZCB9KSB7XHJcbiAgICBjb25zdCByZWN0ID0gY3JlYXRlUmVjdCgpO1xyXG4gICAgdXRpbCgpLm1hcE5vZGVSYW5nZShfZnJhZ21lbnRTdGFydCwgX2ZyYWdtZW50RW5kLCBmdW5jdGlvbiAobm9kZSkge1xyXG4gICAgICAgIGxldCBjaGlsZFJlY3Q7XHJcbiAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDEgfHwgbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QpIHtcclxuICAgICAgICAgICAgY2hpbGRSZWN0ID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMyAmJiBub2RlLmRhdGEudHJpbSgpKSB7XHJcbiAgICAgICAgICAgIGNoaWxkUmVjdCA9IGdldFRleHRSZWN0KG5vZGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoY2hpbGRSZWN0KSB7XHJcbiAgICAgICAgICAgIG1lcmdlUmVjdHMocmVjdCwgY2hpbGRSZWN0KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHJldHVybiByZWN0O1xyXG59XHJcbmxldCByYW5nZTtcclxuLyoqXHJcbiAqIEdldCB0aGUgYm91bmRpbmcgcmVjdCBmb3IgYSB0ZXh0IG5vZGUgdXNpbmcgYSBSYW5nZS5cclxuICovXHJcbmZ1bmN0aW9uIGdldFRleHRSZWN0KG5vZGUpIHtcclxuICAgIGlmICghc2hhcmVkX3V0aWxzXzEuaXNCcm93c2VyKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIGlmICghcmFuZ2UpXHJcbiAgICAgICAgcmFuZ2UgPSBkb2N1bWVudC5jcmVhdGVSYW5nZSgpO1xyXG4gICAgcmFuZ2Uuc2VsZWN0Tm9kZShub2RlKTtcclxuICAgIHJldHVybiByYW5nZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxufVxyXG4vKipcclxuICogR2V0IFZ1ZSdzIHV0aWxcclxuICovXHJcbmZ1bmN0aW9uIHV0aWwoKSB7XHJcbiAgICByZXR1cm4gc2hhcmVkX3V0aWxzXzEudGFyZ2V0Ll9fVlVFX0RFVlRPT0xTX0dMT0JBTF9IT09LX18uVnVlLnV0aWw7XHJcbn1cclxuZnVuY3Rpb24gZmluZFJlbGF0ZWRDb21wb25lbnQoZWwpIHtcclxuICAgIHdoaWxlICghZWwuX192dWVfXyAmJiBlbC5wYXJlbnRFbGVtZW50KSB7XHJcbiAgICAgICAgZWwgPSBlbC5wYXJlbnRFbGVtZW50O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGVsLl9fdnVlX187XHJcbn1cclxuZXhwb3J0cy5maW5kUmVsYXRlZENvbXBvbmVudCA9IGZpbmRSZWxhdGVkQ29tcG9uZW50O1xyXG5mdW5jdGlvbiBnZXRFbFdpbmRvdyhlbCkge1xyXG4gICAgcmV0dXJuIGVsLm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXc7XHJcbn1cclxuZnVuY3Rpb24gYWRkSWZyYW1lUG9zaXRpb24oYm91bmRzLCB3aW4pIHtcclxuICAgIGlmICh3aW4uX19WVUVfREVWVE9PTFNfSUZSQU1FX18pIHtcclxuICAgICAgICBjb25zdCByZWN0ID0gbWVyZ2VSZWN0cyhjcmVhdGVSZWN0KCksIGJvdW5kcyk7XHJcbiAgICAgICAgY29uc3QgaWZyYW1lQm91bmRzID0gd2luLl9fVlVFX0RFVlRPT0xTX0lGUkFNRV9fLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgICAgIHJlY3QudG9wICs9IGlmcmFtZUJvdW5kcy50b3A7XHJcbiAgICAgICAgcmVjdC5ib3R0b20gKz0gaWZyYW1lQm91bmRzLnRvcDtcclxuICAgICAgICByZWN0LmxlZnQgKz0gaWZyYW1lQm91bmRzLmxlZnQ7XHJcbiAgICAgICAgcmVjdC5yaWdodCArPSBpZnJhbWVCb3VuZHMubGVmdDtcclxuICAgICAgICBpZiAod2luLnBhcmVudCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYWRkSWZyYW1lUG9zaXRpb24ocmVjdCwgd2luLnBhcmVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZWN0O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGJvdW5kcztcclxufVxyXG5mdW5jdGlvbiBnZXRSb290RWxlbWVudHNGcm9tQ29tcG9uZW50SW5zdGFuY2UoaW5zdGFuY2UpIHtcclxuICAgIGlmIChpbnN0YW5jZS5faXNGcmFnbWVudCkge1xyXG4gICAgICAgIGNvbnN0IGxpc3QgPSBbXTtcclxuICAgICAgICBjb25zdCB7IF9mcmFnbWVudFN0YXJ0LCBfZnJhZ21lbnRFbmQgfSA9IGluc3RhbmNlO1xyXG4gICAgICAgIHV0aWwoKS5tYXBOb2RlUmFuZ2UoX2ZyYWdtZW50U3RhcnQsIF9mcmFnbWVudEVuZCwgbm9kZSA9PiB7XHJcbiAgICAgICAgICAgIGxpc3QucHVzaChub2RlKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gbGlzdDtcclxuICAgIH1cclxuICAgIHJldHVybiBbaW5zdGFuY2UuJGVsXTtcclxufVxyXG5leHBvcnRzLmdldFJvb3RFbGVtZW50c0Zyb21Db21wb25lbnRJbnN0YW5jZSA9IGdldFJvb3RFbGVtZW50c0Zyb21Db21wb25lbnRJbnN0YW5jZTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZWwuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5nZXRDb21wb25lbnRQYXJlbnRzID0gZXhwb3J0cy53YWxrVHJlZSA9IGV4cG9ydHMuZnVuY3Rpb25hbFZub2RlTWFwID0gZXhwb3J0cy5pbnN0YW5jZU1hcCA9IHZvaWQgMDtcclxuY29uc3Qgc2hhcmVkX3V0aWxzXzEgPSByZXF1aXJlKFwiQHZ1ZS1kZXZ0b29scy9zaGFyZWQtdXRpbHNcIik7XHJcbmNvbnN0IGVsXzEgPSByZXF1aXJlKFwiLi9lbFwiKTtcclxuY29uc3QgdXRpbF8xID0gcmVxdWlyZShcIi4vdXRpbFwiKTtcclxubGV0IGFwcFJlY29yZDtcclxubGV0IGFwaTtcclxuY29uc3QgY29uc29sZUJvdW5kSW5zdGFuY2VzID0gQXJyYXkoNSk7XHJcbmxldCBmaWx0ZXIgPSAnJztcclxuY29uc3QgZnVuY3Rpb25hbElkcyA9IG5ldyBNYXAoKTtcclxuLy8gRGVkdXBlIGluc3RhbmNlc1xyXG4vLyBTb21lIGluc3RhbmNlcyBtYXkgYmUgYm90aCBvbiBhIGNvbXBvbmVudCBhbmQgb24gYSBjaGlsZCBhYnN0cmFjdC9mdW5jdGlvbmFsIGNvbXBvbmVudFxyXG5jb25zdCBjYXB0dXJlSWRzID0gbmV3IE1hcCgpO1xyXG5hc3luYyBmdW5jdGlvbiB3YWxrVHJlZShpbnN0YW5jZSwgcEZpbHRlciwgYXBpLCBjdHgpIHtcclxuICAgIGluaXRDdHgoYXBpLCBjdHgpO1xyXG4gICAgZmlsdGVyID0gcEZpbHRlcjtcclxuICAgIGZ1bmN0aW9uYWxJZHMuY2xlYXIoKTtcclxuICAgIGNhcHR1cmVJZHMuY2xlYXIoKTtcclxuICAgIGNvbnN0IHJlc3VsdCA9IGZsYXR0ZW4oYXdhaXQgZmluZFF1YWxpZmllZENoaWxkcmVuKGluc3RhbmNlKSk7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcbmV4cG9ydHMud2Fsa1RyZWUgPSB3YWxrVHJlZTtcclxuZnVuY3Rpb24gZ2V0Q29tcG9uZW50UGFyZW50cyhpbnN0YW5jZSwgYXBpLCBjdHgpIHtcclxuICAgIGluaXRDdHgoYXBpLCBjdHgpO1xyXG4gICAgY29uc3QgY2FwdHVyZUlkcyA9IG5ldyBNYXAoKTtcclxuICAgIGNvbnN0IGNhcHR1cmVJZCA9IHZtID0+IHtcclxuICAgICAgICBjb25zdCBpZCA9ICgwLCB1dGlsXzEuZ2V0VW5pcXVlSWQpKHZtKTtcclxuICAgICAgICBpZiAoY2FwdHVyZUlkcy5oYXMoaWQpKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgY2FwdHVyZUlkcy5zZXQoaWQsIHVuZGVmaW5lZCk7XHJcbiAgICAgICAgbWFyayh2bSk7XHJcbiAgICB9O1xyXG4gICAgY29uc3QgcGFyZW50cyA9IFtdO1xyXG4gICAgY2FwdHVyZUlkKGluc3RhbmNlKTtcclxuICAgIGxldCBwYXJlbnQgPSBpbnN0YW5jZTtcclxuICAgIHdoaWxlICgocGFyZW50ID0gcGFyZW50LiRwYXJlbnQpKSB7XHJcbiAgICAgICAgY2FwdHVyZUlkKHBhcmVudCk7XHJcbiAgICAgICAgcGFyZW50cy5wdXNoKHBhcmVudCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcGFyZW50cztcclxufVxyXG5leHBvcnRzLmdldENvbXBvbmVudFBhcmVudHMgPSBnZXRDb21wb25lbnRQYXJlbnRzO1xyXG5mdW5jdGlvbiBpbml0Q3R4KF9hcGksIGN0eCkge1xyXG4gICAgYXBwUmVjb3JkID0gY3R4LmN1cnJlbnRBcHBSZWNvcmQ7XHJcbiAgICBhcGkgPSBfYXBpO1xyXG4gICAgaWYgKCFhcHBSZWNvcmQubWV0YS5pbnN0YW5jZU1hcCkge1xyXG4gICAgICAgIGFwcFJlY29yZC5tZXRhLmluc3RhbmNlTWFwID0gbmV3IE1hcCgpO1xyXG4gICAgfVxyXG4gICAgZXhwb3J0cy5pbnN0YW5jZU1hcCA9IGFwcFJlY29yZC5tZXRhLmluc3RhbmNlTWFwO1xyXG4gICAgaWYgKCFhcHBSZWNvcmQubWV0YS5mdW5jdGlvbmFsVm5vZGVNYXApIHtcclxuICAgICAgICBhcHBSZWNvcmQubWV0YS5mdW5jdGlvbmFsVm5vZGVNYXAgPSBuZXcgTWFwKCk7XHJcbiAgICB9XHJcbiAgICBleHBvcnRzLmZ1bmN0aW9uYWxWbm9kZU1hcCA9IGFwcFJlY29yZC5tZXRhLmZ1bmN0aW9uYWxWbm9kZU1hcDtcclxufVxyXG4vKipcclxuICogSXRlcmF0ZSB0aHJvdWdoIGFuIGFycmF5IG9mIGluc3RhbmNlcyBhbmQgZmxhdHRlbiBpdCBpbnRvXHJcbiAqIGFuIGFycmF5IG9mIHF1YWxpZmllZCBpbnN0YW5jZXMuIFRoaXMgaXMgYSBkZXB0aC1maXJzdFxyXG4gKiB0cmF2ZXJzYWwgLSBlLmcuIGlmIGFuIGluc3RhbmNlIGlzIG5vdCBtYXRjaGVkLCB3ZSB3aWxsXHJcbiAqIHJlY3Vyc2l2ZWx5IGdvIGRlZXBlciB1bnRpbCBhIHF1YWxpZmllZCBjaGlsZCBpcyBmb3VuZC5cclxuICovXHJcbmZ1bmN0aW9uIGZpbmRRdWFsaWZpZWRDaGlsZHJlbkZyb21MaXN0KGluc3RhbmNlcykge1xyXG4gICAgaW5zdGFuY2VzID0gaW5zdGFuY2VzXHJcbiAgICAgICAgLmZpbHRlcihjaGlsZCA9PiAhKDAsIHV0aWxfMS5pc0JlaW5nRGVzdHJveWVkKShjaGlsZCkpO1xyXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKCFmaWx0ZXJcclxuICAgICAgICA/IGluc3RhbmNlcy5tYXAoY2FwdHVyZSlcclxuICAgICAgICA6IEFycmF5LnByb3RvdHlwZS5jb25jYXQuYXBwbHkoW10sIGluc3RhbmNlcy5tYXAoZmluZFF1YWxpZmllZENoaWxkcmVuKSkpO1xyXG59XHJcbi8qKlxyXG4gKiBGaW5kIHF1YWxpZmllZCBjaGlsZHJlbiBmcm9tIGEgc2luZ2xlIGluc3RhbmNlLlxyXG4gKiBJZiB0aGUgaW5zdGFuY2UgaXRzZWxmIGlzIHF1YWxpZmllZCwganVzdCByZXR1cm4gaXRzZWxmLlxyXG4gKiBUaGlzIGlzIG9rIGJlY2F1c2UgW10uY29uY2F0IHdvcmtzIGluIGJvdGggY2FzZXMuXHJcbiAqL1xyXG5hc3luYyBmdW5jdGlvbiBmaW5kUXVhbGlmaWVkQ2hpbGRyZW4oaW5zdGFuY2UpIHtcclxuICAgIGlmIChpc1F1YWxpZmllZChpbnN0YW5jZSkpIHtcclxuICAgICAgICByZXR1cm4gW2F3YWl0IGNhcHR1cmUoaW5zdGFuY2UpXTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIGxldCBjaGlsZHJlbiA9IGF3YWl0IGZpbmRRdWFsaWZpZWRDaGlsZHJlbkZyb21MaXN0KGluc3RhbmNlLiRjaGlsZHJlbik7XHJcbiAgICAgICAgLy8gRmluZCBmdW5jdGlvbmFsIGNvbXBvbmVudHMgaW4gcmVjdXJzaXZlbHkgaW4gbm9uLWZ1bmN0aW9uYWwgdm5vZGVzLlxyXG4gICAgICAgIGlmIChpbnN0YW5jZS5fdm5vZGUgJiYgaW5zdGFuY2UuX3Zub2RlLmNoaWxkcmVuKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGxpc3QgPSBhd2FpdCBQcm9taXNlLmFsbChmbGF0dGVuKGluc3RhbmNlLl92bm9kZS5jaGlsZHJlbi5maWx0ZXIoY2hpbGQgPT4gIWNoaWxkLmNvbXBvbmVudEluc3RhbmNlKS5tYXAoY2FwdHVyZUNoaWxkKSkpO1xyXG4gICAgICAgICAgICAvLyBGaWx0ZXIgcXVhbGlmaWVkIGNoaWxkcmVuLlxyXG4gICAgICAgICAgICBjb25zdCBhZGRpdGlvbmFsQ2hpbGRyZW4gPSBsaXN0LmZpbHRlcihpbnN0YW5jZSA9PiBpc1F1YWxpZmllZChpbnN0YW5jZSkpO1xyXG4gICAgICAgICAgICBjaGlsZHJlbiA9IGNoaWxkcmVuLmNvbmNhdChhZGRpdGlvbmFsQ2hpbGRyZW4pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY2hpbGRyZW47XHJcbiAgICB9XHJcbn1cclxuLyoqXHJcbiAqIEdldCBjaGlsZHJlbiBmcm9tIGEgY29tcG9uZW50IGluc3RhbmNlLlxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0SW50ZXJuYWxJbnN0YW5jZUNoaWxkcmVuKGluc3RhbmNlKSB7XHJcbiAgICBpZiAoaW5zdGFuY2UuJGNoaWxkcmVuKSB7XHJcbiAgICAgICAgcmV0dXJuIGluc3RhbmNlLiRjaGlsZHJlbjtcclxuICAgIH1cclxuICAgIHJldHVybiBbXTtcclxufVxyXG4vKipcclxuICogQ2hlY2sgaWYgYW4gaW5zdGFuY2UgaXMgcXVhbGlmaWVkLlxyXG4gKi9cclxuZnVuY3Rpb24gaXNRdWFsaWZpZWQoaW5zdGFuY2UpIHtcclxuICAgIGNvbnN0IG5hbWUgPSAoMCwgc2hhcmVkX3V0aWxzXzEuY2xhc3NpZnkpKCgwLCB1dGlsXzEuZ2V0SW5zdGFuY2VOYW1lKShpbnN0YW5jZSkpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICByZXR1cm4gbmFtZS5pbmRleE9mKGZpbHRlcikgPiAtMTtcclxufVxyXG5mdW5jdGlvbiBmbGF0dGVuKGl0ZW1zKSB7XHJcbiAgICBjb25zdCByID0gaXRlbXMucmVkdWNlKChhY2MsIGl0ZW0pID0+IHtcclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShpdGVtKSkge1xyXG4gICAgICAgICAgICBsZXQgY2hpbGRyZW4gPSBbXTtcclxuICAgICAgICAgICAgZm9yIChjb25zdCBpIG9mIGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW4gPSBjaGlsZHJlbi5jb25jYXQoZmxhdHRlbihpKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbi5wdXNoKGkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGFjYy5wdXNoKC4uLmNoaWxkcmVuKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoaXRlbSkge1xyXG4gICAgICAgICAgICBhY2MucHVzaChpdGVtKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFjYztcclxuICAgIH0sIFtdKTtcclxuICAgIHJldHVybiByO1xyXG59XHJcbmZ1bmN0aW9uIGNhcHR1cmVDaGlsZChjaGlsZCkge1xyXG4gICAgaWYgKGNoaWxkLmZuQ29udGV4dCAmJiAhY2hpbGQuY29tcG9uZW50SW5zdGFuY2UpIHtcclxuICAgICAgICByZXR1cm4gY2FwdHVyZShjaGlsZCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChjaGlsZC5jb21wb25lbnRJbnN0YW5jZSkge1xyXG4gICAgICAgIGlmICghKDAsIHV0aWxfMS5pc0JlaW5nRGVzdHJveWVkKShjaGlsZC5jb21wb25lbnRJbnN0YW5jZSkpXHJcbiAgICAgICAgICAgIHJldHVybiBjYXB0dXJlKGNoaWxkLmNvbXBvbmVudEluc3RhbmNlKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKGNoaWxkLmNoaWxkcmVuKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKGZsYXR0ZW4oY2hpbGQuY2hpbGRyZW4ubWFwKGNhcHR1cmVDaGlsZCkpKTtcclxuICAgIH1cclxufVxyXG4vKipcclxuICogQ2FwdHVyZSB0aGUgbWV0YSBpbmZvcm1hdGlvbiBvZiBhbiBpbnN0YW5jZS4gKHJlY3Vyc2l2ZSlcclxuICovXHJcbmFzeW5jIGZ1bmN0aW9uIGNhcHR1cmUoaW5zdGFuY2UsIGluZGV4LCBsaXN0KSB7XHJcbiAgICB2YXIgX2EsIF9iLCBfYywgX2QsIF9lLCBfZjtcclxuICAgIGlmIChpbnN0YW5jZS5fX1ZVRV9ERVZUT09MU19GVU5DVElPTkFMX0xFR0FDWV9fKSB7XHJcbiAgICAgICAgaW5zdGFuY2UgPSBpbnN0YW5jZS52bm9kZTtcclxuICAgIH1cclxuICAgIGlmIChpbnN0YW5jZS4kb3B0aW9ucyAmJiBpbnN0YW5jZS4kb3B0aW9ucy5hYnN0cmFjdCAmJiBpbnN0YW5jZS5fdm5vZGUgJiYgaW5zdGFuY2UuX3Zub2RlLmNvbXBvbmVudEluc3RhbmNlKSB7XHJcbiAgICAgICAgaW5zdGFuY2UgPSBpbnN0YW5jZS5fdm5vZGUuY29tcG9uZW50SW5zdGFuY2U7XHJcbiAgICB9XHJcbiAgICBpZiAoKF9iID0gKF9hID0gaW5zdGFuY2UuJG9wdGlvbnMpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5kZXZ0b29scykgPT09IG51bGwgfHwgX2IgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9iLmhpZGUpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgLy8gRnVuY3Rpb25hbCBjb21wb25lbnQuXHJcbiAgICBpZiAoaW5zdGFuY2UuZm5Db250ZXh0ICYmICFpbnN0YW5jZS5jb21wb25lbnRJbnN0YW5jZSkge1xyXG4gICAgICAgIGNvbnN0IGNvbnRleHRVaWQgPSBpbnN0YW5jZS5mbkNvbnRleHQuX19WVUVfREVWVE9PTFNfVUlEX187XHJcbiAgICAgICAgbGV0IGlkID0gZnVuY3Rpb25hbElkcy5nZXQoY29udGV4dFVpZCk7XHJcbiAgICAgICAgaWYgKGlkID09IG51bGwpIHtcclxuICAgICAgICAgICAgaWQgPSAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgaWQrKztcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb25hbElkcy5zZXQoY29udGV4dFVpZCwgaWQpO1xyXG4gICAgICAgIGNvbnN0IGZ1bmN0aW9uYWxJZCA9IGNvbnRleHRVaWQgKyAnOmZ1bmN0aW9uYWw6JyArIGlkO1xyXG4gICAgICAgIG1hcmtGdW5jdGlvbmFsKGZ1bmN0aW9uYWxJZCwgaW5zdGFuY2UpO1xyXG4gICAgICAgIGNvbnN0IGNoaWxkcmVuUHJvbWlzZSA9IChpbnN0YW5jZS5jaGlsZHJlblxyXG4gICAgICAgICAgICA/IGluc3RhbmNlLmNoaWxkcmVuLm1hcChjaGlsZCA9PiBjaGlsZC5mbkNvbnRleHRcclxuICAgICAgICAgICAgICAgID8gY2FwdHVyZUNoaWxkKGNoaWxkKVxyXG4gICAgICAgICAgICAgICAgOiBjaGlsZC5jb21wb25lbnRJbnN0YW5jZVxyXG4gICAgICAgICAgICAgICAgICAgID8gY2FwdHVyZShjaGlsZC5jb21wb25lbnRJbnN0YW5jZSlcclxuICAgICAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgLy8gcm91dGVyLXZpZXcgaGFzIGJvdGggZm5Db250ZXh0IGFuZCBjb21wb25lbnRJbnN0YW5jZSBvbiB2bm9kZS5cclxuICAgICAgICAgICAgOiBpbnN0YW5jZS5jb21wb25lbnRJbnN0YW5jZSA/IFtjYXB0dXJlKGluc3RhbmNlLmNvbXBvbmVudEluc3RhbmNlKV0gOiBbXSk7XHJcbiAgICAgICAgLy8gYXdhaXQgYWxsIGNoaWxkcmVuQ2FwdHVyZSB0by1iZSByZXNvbHZlZFxyXG4gICAgICAgIGNvbnN0IGNoaWxkcmVuID0gKGF3YWl0IFByb21pc2UuYWxsKGNoaWxkcmVuUHJvbWlzZSkpLmZpbHRlcihCb29sZWFuKTtcclxuICAgICAgICBjb25zdCB0cmVlTm9kZSA9IHtcclxuICAgICAgICAgICAgdWlkOiBmdW5jdGlvbmFsSWQsXHJcbiAgICAgICAgICAgIGlkOiBmdW5jdGlvbmFsSWQsXHJcbiAgICAgICAgICAgIHRhZ3M6IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ2Z1bmN0aW9uYWwnLFxyXG4gICAgICAgICAgICAgICAgICAgIHRleHRDb2xvcjogMHg1NTU1NTUsXHJcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAweGVlZWVlZSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIG5hbWU6ICgwLCB1dGlsXzEuZ2V0SW5zdGFuY2VOYW1lKShpbnN0YW5jZSksXHJcbiAgICAgICAgICAgIHJlbmRlcktleTogKDAsIHV0aWxfMS5nZXRSZW5kZXJLZXkpKGluc3RhbmNlLmtleSksXHJcbiAgICAgICAgICAgIGNoaWxkcmVuLFxyXG4gICAgICAgICAgICBoYXNDaGlsZHJlbjogISFjaGlsZHJlbi5sZW5ndGgsXHJcbiAgICAgICAgICAgIGluYWN0aXZlOiBmYWxzZSxcclxuICAgICAgICAgICAgaXNGcmFnbWVudDogZmFsc2UsIC8vIFRPRE86IENoZWNrIHdoYXQgaXMgaXQgZm9yLlxyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIGFwaS52aXNpdENvbXBvbmVudFRyZWUoaW5zdGFuY2UsIHRyZWVOb2RlLCBmaWx0ZXIsIChfYyA9IGFwcFJlY29yZCA9PT0gbnVsbCB8fCBhcHBSZWNvcmQgPT09IHZvaWQgMCA/IHZvaWQgMCA6IGFwcFJlY29yZC5vcHRpb25zKSA9PT0gbnVsbCB8fCBfYyA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2MuYXBwKTtcclxuICAgIH1cclxuICAgIC8vIGluc3RhbmNlLl91aWQgaXMgbm90IHJlbGlhYmxlIGluIGRldnRvb2xzIGFzIHRoZXJlXHJcbiAgICAvLyBtYXkgYmUgMiByb290cyB3aXRoIHNhbWUgX3VpZCB3aGljaCBjYXVzZXMgdW5leHBlY3RlZFxyXG4gICAgLy8gYmVoYXZpb3VyXHJcbiAgICBpbnN0YW5jZS5fX1ZVRV9ERVZUT09MU19VSURfXyA9ICgwLCB1dGlsXzEuZ2V0VW5pcXVlSWQpKGluc3RhbmNlKTtcclxuICAgIC8vIERlZHVwZVxyXG4gICAgaWYgKGNhcHR1cmVJZHMuaGFzKGluc3RhbmNlLl9fVlVFX0RFVlRPT0xTX1VJRF9fKSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIGNhcHR1cmVJZHMuc2V0KGluc3RhbmNlLl9fVlVFX0RFVlRPT0xTX1VJRF9fLCB1bmRlZmluZWQpO1xyXG4gICAgfVxyXG4gICAgbWFyayhpbnN0YW5jZSk7XHJcbiAgICBjb25zdCBuYW1lID0gKDAsIHV0aWxfMS5nZXRJbnN0YW5jZU5hbWUpKGluc3RhbmNlKTtcclxuICAgIGNvbnN0IGNoaWxkcmVuID0gKGF3YWl0IFByb21pc2UuYWxsKChhd2FpdCBnZXRJbnRlcm5hbEluc3RhbmNlQ2hpbGRyZW4oaW5zdGFuY2UpKVxyXG4gICAgICAgIC5maWx0ZXIoY2hpbGQgPT4gISgwLCB1dGlsXzEuaXNCZWluZ0Rlc3Ryb3llZCkoY2hpbGQpKVxyXG4gICAgICAgIC5tYXAoY2FwdHVyZSkpKS5maWx0ZXIoQm9vbGVhbik7XHJcbiAgICBjb25zdCByZXQgPSB7XHJcbiAgICAgICAgdWlkOiBpbnN0YW5jZS5fdWlkLFxyXG4gICAgICAgIGlkOiBpbnN0YW5jZS5fX1ZVRV9ERVZUT09MU19VSURfXyxcclxuICAgICAgICBuYW1lLFxyXG4gICAgICAgIHJlbmRlcktleTogKDAsIHV0aWxfMS5nZXRSZW5kZXJLZXkpKGluc3RhbmNlLiR2bm9kZSA/IGluc3RhbmNlLiR2bm9kZS5rZXkgOiBudWxsKSxcclxuICAgICAgICBpbmFjdGl2ZTogISFpbnN0YW5jZS5faW5hY3RpdmUsXHJcbiAgICAgICAgaXNGcmFnbWVudDogISFpbnN0YW5jZS5faXNGcmFnbWVudCxcclxuICAgICAgICBjaGlsZHJlbixcclxuICAgICAgICBoYXNDaGlsZHJlbjogISFjaGlsZHJlbi5sZW5ndGgsXHJcbiAgICAgICAgdGFnczogW10sXHJcbiAgICAgICAgbWV0YToge30sXHJcbiAgICB9O1xyXG4gICAgaWYgKGluc3RhbmNlLl92bm9kZSAmJiBpbnN0YW5jZS5fdm5vZGUuY2hpbGRyZW4pIHtcclxuICAgICAgICBjb25zdCB2bm9kZUNoaWxkcmVuID0gYXdhaXQgUHJvbWlzZS5hbGwoZmxhdHRlbihpbnN0YW5jZS5fdm5vZGUuY2hpbGRyZW4ubWFwKGNhcHR1cmVDaGlsZCkpKTtcclxuICAgICAgICByZXQuY2hpbGRyZW4gPSByZXQuY2hpbGRyZW4uY29uY2F0KGZsYXR0ZW4odm5vZGVDaGlsZHJlbikuZmlsdGVyKEJvb2xlYW4pKTtcclxuICAgICAgICByZXQuaGFzQ2hpbGRyZW4gPSAhIXJldC5jaGlsZHJlbi5sZW5ndGg7XHJcbiAgICB9XHJcbiAgICAvLyBlbnN1cmUgY29ycmVjdCBvcmRlcmluZ1xyXG4gICAgY29uc3Qgcm9vdEVsZW1lbnRzID0gKDAsIGVsXzEuZ2V0Um9vdEVsZW1lbnRzRnJvbUNvbXBvbmVudEluc3RhbmNlKShpbnN0YW5jZSk7XHJcbiAgICBjb25zdCBmaXJzdEVsZW1lbnQgPSByb290RWxlbWVudHNbMF07XHJcbiAgICBpZiAoZmlyc3RFbGVtZW50ID09PSBudWxsIHx8IGZpcnN0RWxlbWVudCA9PT0gdm9pZCAwID8gdm9pZCAwIDogZmlyc3RFbGVtZW50LnBhcmVudEVsZW1lbnQpIHtcclxuICAgICAgICBjb25zdCBwYXJlbnRJbnN0YW5jZSA9IGluc3RhbmNlLiRwYXJlbnQ7XHJcbiAgICAgICAgY29uc3QgcGFyZW50Um9vdEVsZW1lbnRzID0gcGFyZW50SW5zdGFuY2UgPyAoMCwgZWxfMS5nZXRSb290RWxlbWVudHNGcm9tQ29tcG9uZW50SW5zdGFuY2UpKHBhcmVudEluc3RhbmNlKSA6IFtdO1xyXG4gICAgICAgIGxldCBlbCA9IGZpcnN0RWxlbWVudDtcclxuICAgICAgICBjb25zdCBpbmRleExpc3QgPSBbXTtcclxuICAgICAgICBkbyB7XHJcbiAgICAgICAgICAgIGluZGV4TGlzdC5wdXNoKEFycmF5LmZyb20oZWwucGFyZW50RWxlbWVudC5jaGlsZE5vZGVzKS5pbmRleE9mKGVsKSk7XHJcbiAgICAgICAgICAgIGVsID0gZWwucGFyZW50RWxlbWVudDtcclxuICAgICAgICB9IHdoaWxlIChlbC5wYXJlbnRFbGVtZW50ICYmIHBhcmVudFJvb3RFbGVtZW50cy5sZW5ndGggJiYgIXBhcmVudFJvb3RFbGVtZW50cy5pbmNsdWRlcyhlbCkpO1xyXG4gICAgICAgIHJldC5kb21PcmRlciA9IGluZGV4TGlzdC5yZXZlcnNlKCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICByZXQuZG9tT3JkZXIgPSBbLTFdO1xyXG4gICAgfVxyXG4gICAgLy8gY2hlY2sgaWYgaW5zdGFuY2UgaXMgYXZhaWxhYmxlIGluIGNvbnNvbGVcclxuICAgIGNvbnN0IGNvbnNvbGVJZCA9IGNvbnNvbGVCb3VuZEluc3RhbmNlcy5pbmRleE9mKGluc3RhbmNlLl9fVlVFX0RFVlRPT0xTX1VJRF9fKTtcclxuICAgIHJldC5jb25zb2xlSWQgPSBjb25zb2xlSWQgPiAtMSA/ICckdm0nICsgY29uc29sZUlkIDogbnVsbDtcclxuICAgIC8vIGNoZWNrIHJvdXRlciB2aWV3XHJcbiAgICBjb25zdCBpc1JvdXRlclZpZXcyID0gKF9lID0gKF9kID0gaW5zdGFuY2UuJHZub2RlKSA9PT0gbnVsbCB8fCBfZCA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2QuZGF0YSkgPT09IG51bGwgfHwgX2UgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9lLnJvdXRlclZpZXc7XHJcbiAgICBpZiAoaW5zdGFuY2UuX3JvdXRlclZpZXcgfHwgaXNSb3V0ZXJWaWV3Mikge1xyXG4gICAgICAgIHJldC5pc1JvdXRlclZpZXcgPSB0cnVlO1xyXG4gICAgICAgIGlmICghaW5zdGFuY2UuX2luYWN0aXZlICYmIGluc3RhbmNlLiRyb3V0ZSkge1xyXG4gICAgICAgICAgICBjb25zdCBtYXRjaGVkID0gaW5zdGFuY2UuJHJvdXRlLm1hdGNoZWQ7XHJcbiAgICAgICAgICAgIGNvbnN0IGRlcHRoID0gaXNSb3V0ZXJWaWV3MlxyXG4gICAgICAgICAgICAgICAgPyBpbnN0YW5jZS4kdm5vZGUuZGF0YS5yb3V0ZXJWaWV3RGVwdGhcclxuICAgICAgICAgICAgICAgIDogaW5zdGFuY2UuX3JvdXRlclZpZXcuZGVwdGg7XHJcbiAgICAgICAgICAgIHJldC5tZXRhLm1hdGNoZWRSb3V0ZVNlZ21lbnQgPVxyXG4gICAgICAgICAgICAgICAgbWF0Y2hlZCAmJlxyXG4gICAgICAgICAgICAgICAgICAgIG1hdGNoZWRbZGVwdGhdICYmXHJcbiAgICAgICAgICAgICAgICAgICAgKGlzUm91dGVyVmlldzIgPyBtYXRjaGVkW2RlcHRoXS5wYXRoIDogbWF0Y2hlZFtkZXB0aF0uaGFuZGxlci5wYXRoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0LnRhZ3MucHVzaCh7XHJcbiAgICAgICAgICAgIGxhYmVsOiBgcm91dGVyLXZpZXcke3JldC5tZXRhLm1hdGNoZWRSb3V0ZVNlZ21lbnQgPyBgOiAke3JldC5tZXRhLm1hdGNoZWRSb3V0ZVNlZ21lbnR9YCA6ICcnfWAsXHJcbiAgICAgICAgICAgIHRleHRDb2xvcjogMHgwMDAwMDAsXHJcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogMHhmZjgzNDQsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYXBpLnZpc2l0Q29tcG9uZW50VHJlZShpbnN0YW5jZSwgcmV0LCBmaWx0ZXIsIChfZiA9IGFwcFJlY29yZCA9PT0gbnVsbCB8fCBhcHBSZWNvcmQgPT09IHZvaWQgMCA/IHZvaWQgMCA6IGFwcFJlY29yZC5vcHRpb25zKSA9PT0gbnVsbCB8fCBfZiA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2YuYXBwKTtcclxufVxyXG4vKipcclxuICogTWFyayBhbiBpbnN0YW5jZSBhcyBjYXB0dXJlZCBhbmQgc3RvcmUgaXQgaW4gdGhlIGluc3RhbmNlIG1hcC5cclxuICpcclxuICogQHBhcmFtIHtWdWV9IGluc3RhbmNlXHJcbiAqL1xyXG5mdW5jdGlvbiBtYXJrKGluc3RhbmNlKSB7XHJcbiAgICBjb25zdCByZWZJZCA9IGluc3RhbmNlLl9fVlVFX0RFVlRPT0xTX1VJRF9fO1xyXG4gICAgaWYgKCFleHBvcnRzLmluc3RhbmNlTWFwLmhhcyhyZWZJZCkpIHtcclxuICAgICAgICBleHBvcnRzLmluc3RhbmNlTWFwLnNldChyZWZJZCwgaW5zdGFuY2UpO1xyXG4gICAgICAgIGFwcFJlY29yZC5pbnN0YW5jZU1hcC5zZXQocmVmSWQsIGluc3RhbmNlKTtcclxuICAgICAgICBpbnN0YW5jZS4kb24oJ2hvb2s6YmVmb3JlRGVzdHJveScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZXhwb3J0cy5pbnN0YW5jZU1hcC5kZWxldGUocmVmSWQpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcbmZ1bmN0aW9uIG1hcmtGdW5jdGlvbmFsKGlkLCB2bm9kZSkge1xyXG4gICAgY29uc3QgcmVmSWQgPSB2bm9kZS5mbkNvbnRleHQuX19WVUVfREVWVE9PTFNfVUlEX187XHJcbiAgICBpZiAoIWV4cG9ydHMuZnVuY3Rpb25hbFZub2RlTWFwLmhhcyhyZWZJZCkpIHtcclxuICAgICAgICBleHBvcnRzLmZ1bmN0aW9uYWxWbm9kZU1hcC5zZXQocmVmSWQsIHt9KTtcclxuICAgICAgICB2bm9kZS5mbkNvbnRleHQuJG9uKCdob29rOmJlZm9yZURlc3Ryb3knLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGV4cG9ydHMuZnVuY3Rpb25hbFZub2RlTWFwLmRlbGV0ZShyZWZJZCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBleHBvcnRzLmZ1bmN0aW9uYWxWbm9kZU1hcC5nZXQocmVmSWQpW2lkXSA9IHZub2RlO1xyXG4gICAgYXBwUmVjb3JkLmluc3RhbmNlTWFwLnNldChpZCwge1xyXG4gICAgICAgIF9fVlVFX0RFVlRPT0xTX1VJRF9fOiBpZCxcclxuICAgICAgICBfX1ZVRV9ERVZUT09MU19GVU5DVElPTkFMX0xFR0FDWV9fOiB0cnVlLFxyXG4gICAgICAgIHZub2RlLFxyXG4gICAgfSk7XHJcbn1cclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dHJlZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLmdldFVuaXF1ZUlkID0gZXhwb3J0cy5nZXRSZW5kZXJLZXkgPSBleHBvcnRzLmdldEluc3RhbmNlTmFtZSA9IGV4cG9ydHMuaXNCZWluZ0Rlc3Ryb3llZCA9IHZvaWQgMDtcclxuY29uc3Qgc2hhcmVkX3V0aWxzXzEgPSByZXF1aXJlKFwiQHZ1ZS1kZXZ0b29scy9zaGFyZWQtdXRpbHNcIik7XHJcbmZ1bmN0aW9uIGlzQmVpbmdEZXN0cm95ZWQoaW5zdGFuY2UpIHtcclxuICAgIHJldHVybiBpbnN0YW5jZS5faXNCZWluZ0Rlc3Ryb3llZDtcclxufVxyXG5leHBvcnRzLmlzQmVpbmdEZXN0cm95ZWQgPSBpc0JlaW5nRGVzdHJveWVkO1xyXG4vKipcclxuICogR2V0IHRoZSBhcHByb3ByaWF0ZSBkaXNwbGF5IG5hbWUgZm9yIGFuIGluc3RhbmNlLlxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0SW5zdGFuY2VOYW1lKGluc3RhbmNlKSB7XHJcbiAgICBjb25zdCBuYW1lID0gKDAsIHNoYXJlZF91dGlsc18xLmdldENvbXBvbmVudE5hbWUpKGluc3RhbmNlLiRvcHRpb25zIHx8IGluc3RhbmNlLmZuT3B0aW9ucyB8fCB7fSk7XHJcbiAgICBpZiAobmFtZSlcclxuICAgICAgICByZXR1cm4gbmFtZTtcclxuICAgIHJldHVybiBpbnN0YW5jZS4kcm9vdCA9PT0gaW5zdGFuY2VcclxuICAgICAgICA/ICdSb290J1xyXG4gICAgICAgIDogJ0Fub255bW91cyBDb21wb25lbnQnO1xyXG59XHJcbmV4cG9ydHMuZ2V0SW5zdGFuY2VOYW1lID0gZ2V0SW5zdGFuY2VOYW1lO1xyXG5mdW5jdGlvbiBnZXRSZW5kZXJLZXkodmFsdWUpIHtcclxuICAgIGlmICh2YWx1ZSA9PSBudWxsKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIGNvbnN0IHR5cGUgPSB0eXBlb2YgdmFsdWU7XHJcbiAgICBpZiAodHlwZSA9PT0gJ251bWJlcicpIHtcclxuICAgICAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHR5cGUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgcmV0dXJuIGAnJHt2YWx1ZX0nYDtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XHJcbiAgICAgICAgcmV0dXJuICdBcnJheSc7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICByZXR1cm4gJ09iamVjdCc7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5nZXRSZW5kZXJLZXkgPSBnZXRSZW5kZXJLZXk7XHJcbi8qKlxyXG4gKiBSZXR1cm5zIGEgZGV2dG9vbHMgdW5pcXVlIGlkIGZvciBpbnN0YW5jZS5cclxuICovXHJcbmZ1bmN0aW9uIGdldFVuaXF1ZUlkKGluc3RhbmNlKSB7XHJcbiAgICBpZiAoaW5zdGFuY2UuX19WVUVfREVWVE9PTFNfVUlEX18gIT0gbnVsbClcclxuICAgICAgICByZXR1cm4gaW5zdGFuY2UuX19WVUVfREVWVE9PTFNfVUlEX187XHJcbiAgICBjb25zdCByb290VnVlSWQgPSBpbnN0YW5jZS4kcm9vdC5fX1ZVRV9ERVZUT09MU19BUFBfUkVDT1JEX0lEX187XHJcbiAgICByZXR1cm4gYCR7cm9vdFZ1ZUlkfToke2luc3RhbmNlLl91aWR9YDtcclxufVxyXG5leHBvcnRzLmdldFVuaXF1ZUlkID0gZ2V0VW5pcXVlSWQ7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXV0aWwuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy53cmFwVnVlRm9yRXZlbnRzID0gdm9pZCAwO1xyXG5jb25zdCBzaGFyZWRfdXRpbHNfMSA9IHJlcXVpcmUoXCJAdnVlLWRldnRvb2xzL3NoYXJlZC11dGlsc1wiKTtcclxuY29uc3QgaW50ZXJuYWxSRSA9IC9eKD86cHJlLSk/aG9vazovO1xyXG5mdW5jdGlvbiB3cmFwKGFwcCwgVnVlLCBtZXRob2QsIGN0eCkge1xyXG4gICAgY29uc3Qgb3JpZ2luYWwgPSBWdWUucHJvdG90eXBlW21ldGhvZF07XHJcbiAgICBpZiAob3JpZ2luYWwpIHtcclxuICAgICAgICBWdWUucHJvdG90eXBlW21ldGhvZF0gPSBmdW5jdGlvbiAoLi4uYXJncykge1xyXG4gICAgICAgICAgICBjb25zdCByZXMgPSBvcmlnaW5hbC5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgICAgICAgICAgbG9nRXZlbnQodGhpcywgbWV0aG9kLCBhcmdzWzBdLCBhcmdzLnNsaWNlKDEpKTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlcztcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gbG9nRXZlbnQodm0sIHR5cGUsIGV2ZW50TmFtZSwgcGF5bG9hZCkge1xyXG4gICAgICAgIC8vIFRoZSBzdHJpbmcgY2hlY2sgaXMgaW1wb3J0YW50IGZvciBjb21wYXQgd2l0aCAxLnggd2hlcmUgdGhlIGZpcnN0XHJcbiAgICAgICAgLy8gYXJndW1lbnQgbWF5IGJlIGFuIG9iamVjdCBpbnN0ZWFkIG9mIGEgc3RyaW5nLlxyXG4gICAgICAgIC8vIHRoaXMgYWxzbyBlbnN1cmVzIHRoZSBldmVudCBpcyBvbmx5IGxvZ2dlZCBmb3IgZGlyZWN0ICRlbWl0IChzb3VyY2UpXHJcbiAgICAgICAgLy8gaW5zdGVhZCBvZiBieSAkZGlzcGF0Y2gvJGJyb2FkY2FzdFxyXG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnROYW1lID09PSAnc3RyaW5nJyAmJiAhaW50ZXJuYWxSRS50ZXN0KGV2ZW50TmFtZSkpIHtcclxuICAgICAgICAgICAgY29uc3QgaW5zdGFuY2UgPSB2bS5fc2VsZiB8fCB2bTtcclxuICAgICAgICAgICAgY3R4Lmhvb2suZW1pdChzaGFyZWRfdXRpbHNfMS5Ib29rRXZlbnRzLkNPTVBPTkVOVF9FTUlULCBhcHAsIGluc3RhbmNlLCBldmVudE5hbWUsIHBheWxvYWQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiB3cmFwVnVlRm9yRXZlbnRzKGFwcCwgVnVlLCBjdHgpIHtcclxuICAgIFsnJGVtaXQnLCAnJGJyb2FkY2FzdCcsICckZGlzcGF0Y2gnXS5mb3JFYWNoKG1ldGhvZCA9PiB7XHJcbiAgICAgICAgd3JhcChhcHAsIFZ1ZSwgbWV0aG9kLCBjdHgpO1xyXG4gICAgfSk7XHJcbn1cclxuZXhwb3J0cy53cmFwVnVlRm9yRXZlbnRzID0gd3JhcFZ1ZUZvckV2ZW50cztcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZXZlbnRzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuQ29tcG9uZW50RmlsdGVyID0gdm9pZCAwO1xyXG5jb25zdCBzaGFyZWRfdXRpbHNfMSA9IHJlcXVpcmUoXCJAdnVlLWRldnRvb2xzL3NoYXJlZC11dGlsc1wiKTtcclxuY29uc3QgdXRpbF8xID0gcmVxdWlyZShcIi4vdXRpbFwiKTtcclxuY2xhc3MgQ29tcG9uZW50RmlsdGVyIHtcclxuICAgIGNvbnN0cnVjdG9yKGZpbHRlcikge1xyXG4gICAgICAgIHRoaXMuZmlsdGVyID0gZmlsdGVyIHx8ICcnO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGVjayBpZiBhbiBpbnN0YW5jZSBpcyBxdWFsaWZpZWQuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtWdWV8Vm5vZGV9IGluc3RhbmNlXHJcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxyXG4gICAgICovXHJcbiAgICBpc1F1YWxpZmllZChpbnN0YW5jZSkge1xyXG4gICAgICAgIGNvbnN0IG5hbWUgPSAoMCwgc2hhcmVkX3V0aWxzXzEuY2xhc3NpZnkpKCgwLCB1dGlsXzEuZ2V0SW5zdGFuY2VOYW1lKShpbnN0YW5jZSkpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgcmV0dXJuIG5hbWUuaW5kZXhPZih0aGlzLmZpbHRlcikgPiAtMTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLkNvbXBvbmVudEZpbHRlciA9IENvbXBvbmVudEZpbHRlcjtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZmlsdGVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcclxuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xyXG59O1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMucmV0dXJuRXJyb3IgPSBleHBvcnRzLmJhc2VuYW1lID0gZXhwb3J0cy5mbGF0dGVuID0gdm9pZCAwO1xyXG5jb25zdCBwYXRoXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcInBhdGhcIikpO1xyXG5mdW5jdGlvbiBmbGF0dGVuKGl0ZW1zKSB7XHJcbiAgICByZXR1cm4gaXRlbXMucmVkdWNlKChhY2MsIGl0ZW0pID0+IHtcclxuICAgICAgICBpZiAoaXRlbSBpbnN0YW5jZW9mIEFycmF5KVxyXG4gICAgICAgICAgICBhY2MucHVzaCguLi5mbGF0dGVuKGl0ZW0pKTtcclxuICAgICAgICBlbHNlIGlmIChpdGVtKVxyXG4gICAgICAgICAgICBhY2MucHVzaChpdGVtKTtcclxuICAgICAgICByZXR1cm4gYWNjO1xyXG4gICAgfSwgW10pO1xyXG59XHJcbmV4cG9ydHMuZmxhdHRlbiA9IGZsYXR0ZW47XHJcbi8vIFVzZSBhIGN1c3RvbSBiYXNlbmFtZSBmdW5jdGlvbnMgaW5zdGVhZCBvZiB0aGUgc2hpbWVkIHZlcnNpb25cclxuLy8gYmVjYXVzZSBpdCBkb2Vzbid0IHdvcmsgb24gV2luZG93c1xyXG5mdW5jdGlvbiBiYXNlbmFtZShmaWxlbmFtZSwgZXh0KSB7XHJcbiAgICByZXR1cm4gcGF0aF8xLmRlZmF1bHQuYmFzZW5hbWUoZmlsZW5hbWUucmVwbGFjZSgvXlthLXpBLVpdOi8sICcnKS5yZXBsYWNlKC9cXFxcL2csICcvJyksIGV4dCk7XHJcbn1cclxuZXhwb3J0cy5iYXNlbmFtZSA9IGJhc2VuYW1lO1xyXG5mdW5jdGlvbiByZXR1cm5FcnJvcihjYikge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICByZXR1cm4gY2IoKTtcclxuICAgIH1cclxuICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgcmV0dXJuIGU7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5yZXR1cm5FcnJvciA9IHJldHVybkVycm9yO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD11dGlsLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuQnJpZGdlID0gdm9pZCAwO1xyXG5jb25zdCBldmVudHNfMSA9IHJlcXVpcmUoXCJldmVudHNcIik7XHJcbmNvbnN0IEJBVENIX0RVUkFUSU9OID0gMTAwO1xyXG5jbGFzcyBCcmlkZ2UgZXh0ZW5kcyBldmVudHNfMS5FdmVudEVtaXR0ZXIge1xyXG4gICAgY29uc3RydWN0b3Iod2FsbCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5zZXRNYXhMaXN0ZW5lcnMoSW5maW5pdHkpO1xyXG4gICAgICAgIHRoaXMud2FsbCA9IHdhbGw7XHJcbiAgICAgICAgd2FsbC5saXN0ZW4obWVzc2FnZXMgPT4ge1xyXG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShtZXNzYWdlcykpIHtcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2VzLmZvckVhY2gobWVzc2FnZSA9PiB0aGlzLl9lbWl0KG1lc3NhZ2UpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2VtaXQobWVzc2FnZXMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5fYmF0Y2hpbmdRdWV1ZSA9IFtdO1xyXG4gICAgICAgIHRoaXMuX3NlbmRpbmdRdWV1ZSA9IFtdO1xyXG4gICAgICAgIHRoaXMuX3JlY2VpdmluZ1F1ZXVlID0gW107XHJcbiAgICAgICAgdGhpcy5fc2VuZGluZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuX3RpbWUgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgc2VuZChldmVudCwgcGF5bG9hZCkge1xyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHBheWxvYWQpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGxhc3RJbmRleCA9IHBheWxvYWQubGVuZ3RoIC0gMTtcclxuICAgICAgICAgICAgcGF5bG9hZC5mb3JFYWNoKChjaHVuaywgaW5kZXgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3NlbmQoe1xyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LFxyXG4gICAgICAgICAgICAgICAgICAgIF9jaHVuazogY2h1bmssXHJcbiAgICAgICAgICAgICAgICAgICAgbGFzdDogaW5kZXggPT09IGxhc3RJbmRleCxcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy5fZmx1c2goKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5fdGltZSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLl9zZW5kKFt7IGV2ZW50LCBwYXlsb2FkIH1dKTtcclxuICAgICAgICAgICAgdGhpcy5fdGltZSA9IERhdGUubm93KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl9iYXRjaGluZ1F1ZXVlLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgZXZlbnQsXHJcbiAgICAgICAgICAgICAgICBwYXlsb2FkLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcclxuICAgICAgICAgICAgaWYgKG5vdyAtIHRoaXMuX3RpbWUgPiBCQVRDSF9EVVJBVElPTikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fZmx1c2goKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3RpbWVyID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLl9mbHVzaCgpLCBCQVRDSF9EVVJBVElPTik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIExvZyBhIG1lc3NhZ2UgdG8gdGhlIGRldnRvb2xzIGJhY2tncm91bmQgcGFnZS5cclxuICAgICAqL1xyXG4gICAgbG9nKG1lc3NhZ2UpIHtcclxuICAgICAgICB0aGlzLnNlbmQoJ2xvZycsIG1lc3NhZ2UpO1xyXG4gICAgfVxyXG4gICAgX2ZsdXNoKCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9iYXRjaGluZ1F1ZXVlLmxlbmd0aClcclxuICAgICAgICAgICAgdGhpcy5fc2VuZCh0aGlzLl9iYXRjaGluZ1F1ZXVlKTtcclxuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5fdGltZXIpO1xyXG4gICAgICAgIHRoaXMuX2JhdGNoaW5nUXVldWUgPSBbXTtcclxuICAgICAgICB0aGlzLl90aW1lID0gbnVsbDtcclxuICAgIH1cclxuICAgIC8vIEBUT0RPIHR5cGVzXHJcbiAgICBfZW1pdChtZXNzYWdlKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBtZXNzYWdlID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICB0aGlzLmVtaXQobWVzc2FnZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKG1lc3NhZ2UuX2NodW5rKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlY2VpdmluZ1F1ZXVlLnB1c2gobWVzc2FnZS5fY2h1bmspO1xyXG4gICAgICAgICAgICBpZiAobWVzc2FnZS5sYXN0KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQobWVzc2FnZS5ldmVudCwgdGhpcy5fcmVjZWl2aW5nUXVldWUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVjZWl2aW5nUXVldWUgPSBbXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChtZXNzYWdlLmV2ZW50KSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW1pdChtZXNzYWdlLmV2ZW50LCBtZXNzYWdlLnBheWxvYWQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIEBUT0RPIHR5cGVzXHJcbiAgICBfc2VuZChtZXNzYWdlcykge1xyXG4gICAgICAgIHRoaXMuX3NlbmRpbmdRdWV1ZS5wdXNoKG1lc3NhZ2VzKTtcclxuICAgICAgICB0aGlzLl9uZXh0U2VuZCgpO1xyXG4gICAgfVxyXG4gICAgX25leHRTZW5kKCkge1xyXG4gICAgICAgIGlmICghdGhpcy5fc2VuZGluZ1F1ZXVlLmxlbmd0aCB8fCB0aGlzLl9zZW5kaW5nKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgdGhpcy5fc2VuZGluZyA9IHRydWU7XHJcbiAgICAgICAgY29uc3QgbWVzc2FnZXMgPSB0aGlzLl9zZW5kaW5nUXVldWUuc2hpZnQoKTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB0aGlzLndhbGwuc2VuZChtZXNzYWdlcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgaWYgKGVyci5tZXNzYWdlID09PSAnTWVzc2FnZSBsZW5ndGggZXhjZWVkZWQgbWF4aW11bSBhbGxvd2VkIGxlbmd0aC4nKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9zZW5kaW5nUXVldWUuc3BsaWNlKDAsIDAsIG1lc3NhZ2VzLm1hcChtZXNzYWdlID0+IFttZXNzYWdlXSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX3NlbmRpbmcgPSBmYWxzZTtcclxuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4gdGhpcy5fbmV4dFNlbmQoKSk7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5CcmlkZ2UgPSBCcmlkZ2U7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWJyaWRnZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLkhvb2tFdmVudHMgPSBleHBvcnRzLkJyaWRnZVN1YnNjcmlwdGlvbnMgPSBleHBvcnRzLkJyaWRnZUV2ZW50cyA9IGV4cG9ydHMuQnVpbHRpblRhYnMgPSB2b2lkIDA7XHJcbnZhciBCdWlsdGluVGFicztcclxuKGZ1bmN0aW9uIChCdWlsdGluVGFicykge1xyXG4gICAgQnVpbHRpblRhYnNbXCJDT01QT05FTlRTXCJdID0gXCJjb21wb25lbnRzXCI7XHJcbiAgICBCdWlsdGluVGFic1tcIlRJTUVMSU5FXCJdID0gXCJ0aW1lbGluZVwiO1xyXG4gICAgQnVpbHRpblRhYnNbXCJQTFVHSU5TXCJdID0gXCJwbHVnaW5zXCI7XHJcbiAgICBCdWlsdGluVGFic1tcIlNFVFRJTkdTXCJdID0gXCJzZXR0aW5nc1wiO1xyXG59KShCdWlsdGluVGFicyA9IGV4cG9ydHMuQnVpbHRpblRhYnMgfHwgKGV4cG9ydHMuQnVpbHRpblRhYnMgPSB7fSkpO1xyXG52YXIgQnJpZGdlRXZlbnRzO1xyXG4oZnVuY3Rpb24gKEJyaWRnZUV2ZW50cykge1xyXG4gICAgLy8gTWlzY1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19TVUJTQ1JJQkVcIl0gPSBcImI6c3Vic2NyaWJlXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX1VOU1VCU0NSSUJFXCJdID0gXCJiOnVuc3Vic2NyaWJlXCI7XHJcbiAgICAvKiogQmFja2VuZCBpcyByZWFkeSAqL1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fRlJPTlRfUkVBRFlcIl0gPSBcImY6cmVhZHlcIjtcclxuICAgIC8qKiBEaXNwbGF5cyB0aGUgXCJkZXRlY3RlZCBWdWVcIiBjb25zb2xlIGxvZyAqL1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19MT0dfREVURUNURURfVlVFXCJdID0gXCJiOmxvZy1kZXRlY3RlZC12dWVcIjtcclxuICAgIC8qKiBGb3JjZSByZWZyZXNoICovXHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX1JFRlJFU0hcIl0gPSBcImI6cmVmcmVzaFwiO1xyXG4gICAgLyoqIFRhYiB3YXMgc3dpdGNoZWQgKi9cclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfVEFCX1NXSVRDSFwiXSA9IFwiYjp0YWI6c3dpdGNoXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX0xPR1wiXSA9IFwiYjpsb2dcIjtcclxuICAgIC8vIEFwcHNcclxuICAgIC8qKiBBcHAgd2FzIHJlZ2lzdGVyZWQgKi9cclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0ZST05UX0FQUF9BRERcIl0gPSBcImY6YXBwOmFkZFwiO1xyXG4gICAgLyoqIEdldCBhcHAgbGlzdCAqL1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19BUFBfTElTVFwiXSA9IFwiYjphcHA6bGlzdFwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fRlJPTlRfQVBQX0xJU1RcIl0gPSBcImY6YXBwOmxpc3RcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0ZST05UX0FQUF9SRU1PVkVcIl0gPSBcImY6YXBwOnJlbW92ZVwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19BUFBfU0VMRUNUXCJdID0gXCJiOmFwcDpzZWxlY3RcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0ZST05UX0FQUF9TRUxFQ1RFRFwiXSA9IFwiZjphcHA6c2VsZWN0ZWRcIjtcclxuICAgIC8vIENvbXBvbmVudHNcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfQ09NUE9ORU5UX1RSRUVcIl0gPSBcImI6Y29tcG9uZW50OnRyZWVcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0ZST05UX0NPTVBPTkVOVF9UUkVFXCJdID0gXCJmOmNvbXBvbmVudDp0cmVlXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX0NPTVBPTkVOVF9TRUxFQ1RFRF9EQVRBXCJdID0gXCJiOmNvbXBvbmVudDpzZWxlY3RlZC1kYXRhXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19GUk9OVF9DT01QT05FTlRfU0VMRUNURURfREFUQVwiXSA9IFwiZjpjb21wb25lbnQ6c2VsZWN0ZWQtZGF0YVwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19DT01QT05FTlRfRVhQQU5EXCJdID0gXCJiOmNvbXBvbmVudDpleHBhbmRcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0ZST05UX0NPTVBPTkVOVF9FWFBBTkRcIl0gPSBcImY6Y29tcG9uZW50OmV4cGFuZFwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19DT01QT05FTlRfU0NST0xMX1RPXCJdID0gXCJiOmNvbXBvbmVudDpzY3JvbGwtdG9cIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfQ09NUE9ORU5UX0ZJTFRFUlwiXSA9IFwiYjpjb21wb25lbnQ6ZmlsdGVyXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX0NPTVBPTkVOVF9NT1VTRV9PVkVSXCJdID0gXCJiOmNvbXBvbmVudDptb3VzZS1vdmVyXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX0NPTVBPTkVOVF9NT1VTRV9PVVRcIl0gPSBcImI6Y29tcG9uZW50Om1vdXNlLW91dFwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19DT01QT05FTlRfQ09OVEVYVF9NRU5VX1RBUkdFVFwiXSA9IFwiYjpjb21wb25lbnQ6Y29udGV4dC1tZW51LXRhcmdldFwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19DT01QT05FTlRfRURJVF9TVEFURVwiXSA9IFwiYjpjb21wb25lbnQ6ZWRpdC1zdGF0ZVwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19DT01QT05FTlRfUElDS1wiXSA9IFwiYjpjb21wb25lbnQ6cGlja1wiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fRlJPTlRfQ09NUE9ORU5UX1BJQ0tcIl0gPSBcImY6Y29tcG9uZW50OnBpY2tcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfQ09NUE9ORU5UX1BJQ0tfQ0FOQ0VMRURcIl0gPSBcImI6Y29tcG9uZW50OnBpY2stY2FuY2VsZWRcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0ZST05UX0NPTVBPTkVOVF9QSUNLX0NBTkNFTEVEXCJdID0gXCJmOmNvbXBvbmVudDpwaWNrLWNhbmNlbGVkXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX0NPTVBPTkVOVF9JTlNQRUNUX0RPTVwiXSA9IFwiYjpjb21wb25lbnQ6aW5zcGVjdC1kb21cIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0ZST05UX0NPTVBPTkVOVF9JTlNQRUNUX0RPTVwiXSA9IFwiZjpjb21wb25lbnQ6aW5zcGVjdC1kb21cIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfQ09NUE9ORU5UX1JFTkRFUl9DT0RFXCJdID0gXCJiOmNvbXBvbmVudDpyZW5kZXItY29kZVwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fRlJPTlRfQ09NUE9ORU5UX1JFTkRFUl9DT0RFXCJdID0gXCJmOmNvbXBvbmVudDpyZW5kZXItY29kZVwiO1xyXG4gICAgLy8gVGltZWxpbmVcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0ZST05UX1RJTUVMSU5FX0VWRU5UXCJdID0gXCJmOnRpbWVsaW5lOmV2ZW50XCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX1RJTUVMSU5FX0xBWUVSX0xJU1RcIl0gPSBcImI6dGltZWxpbmU6bGF5ZXItbGlzdFwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fRlJPTlRfVElNRUxJTkVfTEFZRVJfTElTVFwiXSA9IFwiZjp0aW1lbGluZTpsYXllci1saXN0XCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19GUk9OVF9USU1FTElORV9MQVlFUl9BRERcIl0gPSBcImY6dGltZWxpbmU6bGF5ZXItYWRkXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX1RJTUVMSU5FX1NIT1dfU0NSRUVOU0hPVFwiXSA9IFwiYjp0aW1lbGluZTpzaG93LXNjcmVlbnNob3RcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfVElNRUxJTkVfQ0xFQVJcIl0gPSBcImI6dGltZWxpbmU6Y2xlYXJcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfVElNRUxJTkVfRVZFTlRfREFUQVwiXSA9IFwiYjp0aW1lbGluZTpldmVudC1kYXRhXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19GUk9OVF9USU1FTElORV9FVkVOVF9EQVRBXCJdID0gXCJmOnRpbWVsaW5lOmV2ZW50LWRhdGFcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfVElNRUxJTkVfTEFZRVJfTE9BRF9FVkVOVFNcIl0gPSBcImI6dGltZWxpbmU6bGF5ZXItbG9hZC1ldmVudHNcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0ZST05UX1RJTUVMSU5FX0xBWUVSX0xPQURfRVZFTlRTXCJdID0gXCJmOnRpbWVsaW5lOmxheWVyLWxvYWQtZXZlbnRzXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX1RJTUVMSU5FX0xPQURfTUFSS0VSU1wiXSA9IFwiYjp0aW1lbGluZTpsb2FkLW1hcmtlcnNcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0ZST05UX1RJTUVMSU5FX0xPQURfTUFSS0VSU1wiXSA9IFwiZjp0aW1lbGluZTpsb2FkLW1hcmtlcnNcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0ZST05UX1RJTUVMSU5FX01BUktFUlwiXSA9IFwiZjp0aW1lbGluZTptYXJrZXJcIjtcclxuICAgIC8vIFBsdWdpbnNcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfREVWVE9PTFNfUExVR0lOX0xJU1RcIl0gPSBcImI6ZGV2dG9vbHMtcGx1Z2luOmxpc3RcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0ZST05UX0RFVlRPT0xTX1BMVUdJTl9MSVNUXCJdID0gXCJmOmRldnRvb2xzLXBsdWdpbjpsaXN0XCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19GUk9OVF9ERVZUT09MU19QTFVHSU5fQUREXCJdID0gXCJmOmRldnRvb2xzLXBsdWdpbjphZGRcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfREVWVE9PTFNfUExVR0lOX1NFVFRJTkdfVVBEQVRFRFwiXSA9IFwiYjpkZXZ0b29scy1wbHVnaW46c2V0dGluZy11cGRhdGVkXCI7XHJcbiAgICAvLyBDdXN0b20gaW5zcGVjdG9yc1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19DVVNUT01fSU5TUEVDVE9SX0xJU1RcIl0gPSBcImI6Y3VzdG9tLWluc3BlY3RvcjpsaXN0XCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19GUk9OVF9DVVNUT01fSU5TUEVDVE9SX0xJU1RcIl0gPSBcImY6Y3VzdG9tLWluc3BlY3RvcjpsaXN0XCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19GUk9OVF9DVVNUT01fSU5TUEVDVE9SX0FERFwiXSA9IFwiZjpjdXN0b20taW5zcGVjdG9yOmFkZFwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fQkFDS19DVVNUT01fSU5TUEVDVE9SX1RSRUVcIl0gPSBcImI6Y3VzdG9tLWluc3BlY3Rvcjp0cmVlXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19GUk9OVF9DVVNUT01fSU5TUEVDVE9SX1RSRUVcIl0gPSBcImY6Y3VzdG9tLWluc3BlY3Rvcjp0cmVlXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX0NVU1RPTV9JTlNQRUNUT1JfU1RBVEVcIl0gPSBcImI6Y3VzdG9tLWluc3BlY3RvcjpzdGF0ZVwiO1xyXG4gICAgQnJpZGdlRXZlbnRzW1wiVE9fRlJPTlRfQ1VTVE9NX0lOU1BFQ1RPUl9TVEFURVwiXSA9IFwiZjpjdXN0b20taW5zcGVjdG9yOnN0YXRlXCI7XHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX0NVU1RPTV9JTlNQRUNUT1JfRURJVF9TVEFURVwiXSA9IFwiYjpjdXN0b20taW5zcGVjdG9yOmVkaXQtc3RhdGVcIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0JBQ0tfQ1VTVE9NX0lOU1BFQ1RPUl9BQ1RJT05cIl0gPSBcImI6Y3VzdG9tLWluc3BlY3RvcjphY3Rpb25cIjtcclxuICAgIEJyaWRnZUV2ZW50c1tcIlRPX0ZST05UX0NVU1RPTV9JTlNQRUNUT1JfU0VMRUNUX05PREVcIl0gPSBcImY6Y3VzdG9tLWluc3BlY3RvcjpzZWxlY3Qtbm9kZVwiO1xyXG4gICAgLy8gQ3VzdG9tIHN0YXRlXHJcbiAgICBCcmlkZ2VFdmVudHNbXCJUT19CQUNLX0NVU1RPTV9TVEFURV9BQ1RJT05cIl0gPSBcImI6Y3VzdG9tLXN0YXRlOmFjdGlvblwiO1xyXG59KShCcmlkZ2VFdmVudHMgPSBleHBvcnRzLkJyaWRnZUV2ZW50cyB8fCAoZXhwb3J0cy5CcmlkZ2VFdmVudHMgPSB7fSkpO1xyXG52YXIgQnJpZGdlU3Vic2NyaXB0aW9ucztcclxuKGZ1bmN0aW9uIChCcmlkZ2VTdWJzY3JpcHRpb25zKSB7XHJcbiAgICBCcmlkZ2VTdWJzY3JpcHRpb25zW1wiU0VMRUNURURfQ09NUE9ORU5UX0RBVEFcIl0gPSBcImNvbXBvbmVudDpzZWxlY3RlZC1kYXRhXCI7XHJcbiAgICBCcmlkZ2VTdWJzY3JpcHRpb25zW1wiQ09NUE9ORU5UX1RSRUVcIl0gPSBcImNvbXBvbmVudDp0cmVlXCI7XHJcbn0pKEJyaWRnZVN1YnNjcmlwdGlvbnMgPSBleHBvcnRzLkJyaWRnZVN1YnNjcmlwdGlvbnMgfHwgKGV4cG9ydHMuQnJpZGdlU3Vic2NyaXB0aW9ucyA9IHt9KSk7XHJcbnZhciBIb29rRXZlbnRzO1xyXG4oZnVuY3Rpb24gKEhvb2tFdmVudHMpIHtcclxuICAgIEhvb2tFdmVudHNbXCJJTklUXCJdID0gXCJpbml0XCI7XHJcbiAgICBIb29rRXZlbnRzW1wiQVBQX0lOSVRcIl0gPSBcImFwcDppbml0XCI7XHJcbiAgICBIb29rRXZlbnRzW1wiQVBQX0FERFwiXSA9IFwiYXBwOmFkZFwiO1xyXG4gICAgSG9va0V2ZW50c1tcIkFQUF9VTk1PVU5UXCJdID0gXCJhcHA6dW5tb3VudFwiO1xyXG4gICAgSG9va0V2ZW50c1tcIkNPTVBPTkVOVF9VUERBVEVEXCJdID0gXCJjb21wb25lbnQ6dXBkYXRlZFwiO1xyXG4gICAgSG9va0V2ZW50c1tcIkNPTVBPTkVOVF9BRERFRFwiXSA9IFwiY29tcG9uZW50OmFkZGVkXCI7XHJcbiAgICBIb29rRXZlbnRzW1wiQ09NUE9ORU5UX1JFTU9WRURcIl0gPSBcImNvbXBvbmVudDpyZW1vdmVkXCI7XHJcbiAgICBIb29rRXZlbnRzW1wiQ09NUE9ORU5UX0VNSVRcIl0gPSBcImNvbXBvbmVudDplbWl0XCI7XHJcbiAgICBIb29rRXZlbnRzW1wiQ09NUE9ORU5UX0hJR0hMSUdIVFwiXSA9IFwiY29tcG9uZW50OmhpZ2hsaWdodFwiO1xyXG4gICAgSG9va0V2ZW50c1tcIkNPTVBPTkVOVF9VTkhJR0hMSUdIVFwiXSA9IFwiY29tcG9uZW50OnVuaGlnaGxpZ2h0XCI7XHJcbiAgICBIb29rRXZlbnRzW1wiU0VUVVBfREVWVE9PTFNfUExVR0lOXCJdID0gXCJkZXZ0b29scy1wbHVnaW46c2V0dXBcIjtcclxuICAgIEhvb2tFdmVudHNbXCJUSU1FTElORV9MQVlFUl9BRERFRFwiXSA9IFwidGltZWxpbmU6bGF5ZXItYWRkZWRcIjtcclxuICAgIEhvb2tFdmVudHNbXCJUSU1FTElORV9FVkVOVF9BRERFRFwiXSA9IFwidGltZWxpbmU6ZXZlbnQtYWRkZWRcIjtcclxuICAgIEhvb2tFdmVudHNbXCJDVVNUT01fSU5TUEVDVE9SX0FERFwiXSA9IFwiY3VzdG9tLWluc3BlY3RvcjphZGRcIjtcclxuICAgIEhvb2tFdmVudHNbXCJDVVNUT01fSU5TUEVDVE9SX1NFTkRfVFJFRVwiXSA9IFwiY3VzdG9tLWluc3BlY3RvcjpzZW5kLXRyZWVcIjtcclxuICAgIEhvb2tFdmVudHNbXCJDVVNUT01fSU5TUEVDVE9SX1NFTkRfU1RBVEVcIl0gPSBcImN1c3RvbS1pbnNwZWN0b3I6c2VuZC1zdGF0ZVwiO1xyXG4gICAgSG9va0V2ZW50c1tcIkNVU1RPTV9JTlNQRUNUT1JfU0VMRUNUX05PREVcIl0gPSBcImN1c3RvbS1pbnNwZWN0b3I6c2VsZWN0LW5vZGVcIjtcclxuICAgIEhvb2tFdmVudHNbXCJQRVJGT1JNQU5DRV9TVEFSVFwiXSA9IFwicGVyZjpzdGFydFwiO1xyXG4gICAgSG9va0V2ZW50c1tcIlBFUkZPUk1BTkNFX0VORFwiXSA9IFwicGVyZjplbmRcIjtcclxuICAgIEhvb2tFdmVudHNbXCJQTFVHSU5fU0VUVElOR1NfU0VUXCJdID0gXCJwbHVnaW46c2V0dGluZ3M6c2V0XCI7XHJcbiAgICAvKipcclxuICAgICAqIEBkZXByZWNhdGVkXHJcbiAgICAgKi9cclxuICAgIEhvb2tFdmVudHNbXCJGTFVTSFwiXSA9IFwiZmx1c2hcIjtcclxufSkoSG9va0V2ZW50cyA9IGV4cG9ydHMuSG9va0V2ZW50cyB8fCAoZXhwb3J0cy5Ib29rRXZlbnRzID0ge30pKTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y29uc3RzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuU3RhdGVFZGl0b3IgPSB2b2lkIDA7XHJcbmNsYXNzIFN0YXRlRWRpdG9yIHtcclxuICAgIHNldChvYmplY3QsIHBhdGgsIHZhbHVlLCBjYiA9IG51bGwpIHtcclxuICAgICAgICBjb25zdCBzZWN0aW9ucyA9IEFycmF5LmlzQXJyYXkocGF0aCkgPyBwYXRoIDogcGF0aC5zcGxpdCgnLicpO1xyXG4gICAgICAgIHdoaWxlIChzZWN0aW9ucy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgIG9iamVjdCA9IG9iamVjdFtzZWN0aW9ucy5zaGlmdCgpXTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuaXNSZWYob2JqZWN0KSkge1xyXG4gICAgICAgICAgICAgICAgb2JqZWN0ID0gdGhpcy5nZXRSZWZWYWx1ZShvYmplY3QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGZpZWxkID0gc2VjdGlvbnNbMF07XHJcbiAgICAgICAgaWYgKGNiKSB7XHJcbiAgICAgICAgICAgIGNiKG9iamVjdCwgZmllbGQsIHZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5pc1JlZihvYmplY3RbZmllbGRdKSkge1xyXG4gICAgICAgICAgICB0aGlzLnNldFJlZlZhbHVlKG9iamVjdFtmaWVsZF0sIHZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIG9iamVjdFtmaWVsZF0gPSB2YWx1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBnZXQob2JqZWN0LCBwYXRoKSB7XHJcbiAgICAgICAgY29uc3Qgc2VjdGlvbnMgPSBBcnJheS5pc0FycmF5KHBhdGgpID8gcGF0aCA6IHBhdGguc3BsaXQoJy4nKTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlY3Rpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIG9iamVjdCA9IG9iamVjdFtzZWN0aW9uc1tpXV07XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzUmVmKG9iamVjdCkpIHtcclxuICAgICAgICAgICAgICAgIG9iamVjdCA9IHRoaXMuZ2V0UmVmVmFsdWUob2JqZWN0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIW9iamVjdCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gb2JqZWN0O1xyXG4gICAgfVxyXG4gICAgaGFzKG9iamVjdCwgcGF0aCwgcGFyZW50ID0gZmFsc2UpIHtcclxuICAgICAgICBpZiAodHlwZW9mIG9iamVjdCA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBzZWN0aW9ucyA9IEFycmF5LmlzQXJyYXkocGF0aCkgPyBwYXRoLnNsaWNlKCkgOiBwYXRoLnNwbGl0KCcuJyk7XHJcbiAgICAgICAgY29uc3Qgc2l6ZSA9ICFwYXJlbnQgPyAxIDogMjtcclxuICAgICAgICB3aGlsZSAob2JqZWN0ICYmIHNlY3Rpb25zLmxlbmd0aCA+IHNpemUpIHtcclxuICAgICAgICAgICAgb2JqZWN0ID0gb2JqZWN0W3NlY3Rpb25zLnNoaWZ0KCldO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5pc1JlZihvYmplY3QpKSB7XHJcbiAgICAgICAgICAgICAgICBvYmplY3QgPSB0aGlzLmdldFJlZlZhbHVlKG9iamVjdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG9iamVjdCAhPSBudWxsICYmIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHNlY3Rpb25zWzBdKTtcclxuICAgIH1cclxuICAgIGNyZWF0ZURlZmF1bHRTZXRDYWxsYmFjayhzdGF0ZSkge1xyXG4gICAgICAgIHJldHVybiAob2JqLCBmaWVsZCwgdmFsdWUpID0+IHtcclxuICAgICAgICAgICAgaWYgKHN0YXRlLnJlbW92ZSB8fCBzdGF0ZS5uZXdLZXkpIHtcclxuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9iaikpIHtcclxuICAgICAgICAgICAgICAgICAgICBvYmouc3BsaWNlKGZpZWxkLCAxKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBvYmpbZmllbGRdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghc3RhdGUucmVtb3ZlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBvYmpbc3RhdGUubmV3S2V5IHx8IGZpZWxkXTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzUmVmKHRhcmdldCkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFJlZlZhbHVlKHRhcmdldCwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2JqW3N0YXRlLm5ld0tleSB8fCBmaWVsZF0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICBpc1JlZihyZWYpIHtcclxuICAgICAgICAvLyBUbyBpbXBsZW1lbnQgaW4gc3ViY2xhc3NcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICBzZXRSZWZWYWx1ZShyZWYsIHZhbHVlKSB7XHJcbiAgICAgICAgLy8gVG8gaW1wbGVtZW50IGluIHN1YmNsYXNzXHJcbiAgICB9XHJcbiAgICBnZXRSZWZWYWx1ZShyZWYpIHtcclxuICAgICAgICAvLyBUbyBpbXBsZW1lbnQgaW4gc3ViY2xhc3NcclxuICAgICAgICByZXR1cm4gcmVmO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuU3RhdGVFZGl0b3IgPSBTdGF0ZUVkaXRvcjtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZWRpdC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLmluaXRFbnYgPSBleHBvcnRzLmtleXMgPSBleHBvcnRzLmlzTGludXggPSBleHBvcnRzLmlzTWFjID0gZXhwb3J0cy5pc1dpbmRvd3MgPSBleHBvcnRzLmlzRmlyZWZveCA9IGV4cG9ydHMuaXNDaHJvbWUgPSBleHBvcnRzLnRhcmdldCA9IGV4cG9ydHMuaXNCcm93c2VyID0gdm9pZCAwO1xyXG5leHBvcnRzLmlzQnJvd3NlciA9IHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnO1xyXG5leHBvcnRzLnRhcmdldCA9IGV4cG9ydHMuaXNCcm93c2VyXHJcbiAgICA/IHdpbmRvd1xyXG4gICAgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJ1xyXG4gICAgICAgID8gZ2xvYmFsXHJcbiAgICAgICAgOiB7fTtcclxuZXhwb3J0cy5pc0Nocm9tZSA9IHR5cGVvZiBleHBvcnRzLnRhcmdldC5jaHJvbWUgIT09ICd1bmRlZmluZWQnICYmICEhZXhwb3J0cy50YXJnZXQuY2hyb21lLmRldnRvb2xzO1xyXG5leHBvcnRzLmlzRmlyZWZveCA9IGV4cG9ydHMuaXNCcm93c2VyICYmIG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignRmlyZWZveCcpID4gLTE7XHJcbmV4cG9ydHMuaXNXaW5kb3dzID0gZXhwb3J0cy5pc0Jyb3dzZXIgJiYgbmF2aWdhdG9yLnBsYXRmb3JtLmluZGV4T2YoJ1dpbicpID09PSAwO1xyXG5leHBvcnRzLmlzTWFjID0gZXhwb3J0cy5pc0Jyb3dzZXIgJiYgbmF2aWdhdG9yLnBsYXRmb3JtID09PSAnTWFjSW50ZWwnO1xyXG5leHBvcnRzLmlzTGludXggPSBleHBvcnRzLmlzQnJvd3NlciAmJiBuYXZpZ2F0b3IucGxhdGZvcm0uaW5kZXhPZignTGludXgnKSA9PT0gMDtcclxuZXhwb3J0cy5rZXlzID0ge1xyXG4gICAgY3RybDogZXhwb3J0cy5pc01hYyA/ICcmIzg5ODQ7JyA6ICdDdHJsJyxcclxuICAgIHNoaWZ0OiAnU2hpZnQnLFxyXG4gICAgYWx0OiBleHBvcnRzLmlzTWFjID8gJyYjODk5NzsnIDogJ0FsdCcsXHJcbiAgICBkZWw6ICdEZWwnLFxyXG4gICAgZW50ZXI6ICdFbnRlcicsXHJcbiAgICBlc2M6ICdFc2MnLFxyXG59O1xyXG5mdW5jdGlvbiBpbml0RW52KFZ1ZSkge1xyXG4gICAgaWYgKFZ1ZS5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkoJyRpc0Nocm9tZScpKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKFZ1ZS5wcm90b3R5cGUsIHtcclxuICAgICAgICAkaXNDaHJvbWU6IHsgZ2V0OiAoKSA9PiBleHBvcnRzLmlzQ2hyb21lIH0sXHJcbiAgICAgICAgJGlzRmlyZWZveDogeyBnZXQ6ICgpID0+IGV4cG9ydHMuaXNGaXJlZm94IH0sXHJcbiAgICAgICAgJGlzV2luZG93czogeyBnZXQ6ICgpID0+IGV4cG9ydHMuaXNXaW5kb3dzIH0sXHJcbiAgICAgICAgJGlzTWFjOiB7IGdldDogKCkgPT4gZXhwb3J0cy5pc01hYyB9LFxyXG4gICAgICAgICRpc0xpbnV4OiB7IGdldDogKCkgPT4gZXhwb3J0cy5pc0xpbnV4IH0sXHJcbiAgICAgICAgJGtleXM6IHsgZ2V0OiAoKSA9PiBleHBvcnRzLmtleXMgfSxcclxuICAgIH0pO1xyXG4gICAgaWYgKGV4cG9ydHMuaXNXaW5kb3dzKVxyXG4gICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCgncGxhdGZvcm0td2luZG93cycpO1xyXG4gICAgaWYgKGV4cG9ydHMuaXNNYWMpXHJcbiAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdwbGF0Zm9ybS1tYWMnKTtcclxuICAgIGlmIChleHBvcnRzLmlzTGludXgpXHJcbiAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdwbGF0Zm9ybS1saW51eCcpO1xyXG59XHJcbmV4cG9ydHMuaW5pdEVudiA9IGluaXRFbnY7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWVudi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLnNldFBsdWdpblBlcm1pc3Npb24gPSBleHBvcnRzLmhhc1BsdWdpblBlcm1pc3Npb24gPSBleHBvcnRzLlBsdWdpblBlcm1pc3Npb24gPSB2b2lkIDA7XHJcbmNvbnN0IHNoYXJlZF9kYXRhXzEgPSByZXF1aXJlKFwiLi9zaGFyZWQtZGF0YVwiKTtcclxudmFyIFBsdWdpblBlcm1pc3Npb247XHJcbihmdW5jdGlvbiAoUGx1Z2luUGVybWlzc2lvbikge1xyXG4gICAgUGx1Z2luUGVybWlzc2lvbltcIkVOQUJMRURcIl0gPSBcImVuYWJsZWRcIjtcclxuICAgIFBsdWdpblBlcm1pc3Npb25bXCJDT01QT05FTlRTXCJdID0gXCJjb21wb25lbnRzXCI7XHJcbiAgICBQbHVnaW5QZXJtaXNzaW9uW1wiQ1VTVE9NX0lOU1BFQ1RPUlwiXSA9IFwiY3VzdG9tLWluc3BlY3RvclwiO1xyXG4gICAgUGx1Z2luUGVybWlzc2lvbltcIlRJTUVMSU5FXCJdID0gXCJ0aW1lbGluZVwiO1xyXG59KShQbHVnaW5QZXJtaXNzaW9uID0gZXhwb3J0cy5QbHVnaW5QZXJtaXNzaW9uIHx8IChleHBvcnRzLlBsdWdpblBlcm1pc3Npb24gPSB7fSkpO1xyXG5mdW5jdGlvbiBoYXNQbHVnaW5QZXJtaXNzaW9uKHBsdWdpbklkLCBwZXJtaXNzaW9uKSB7XHJcbiAgICBjb25zdCByZXN1bHQgPSBzaGFyZWRfZGF0YV8xLlNoYXJlZERhdGEucGx1Z2luUGVybWlzc2lvbnNbYCR7cGx1Z2luSWR9OiR7cGVybWlzc2lvbn1gXTtcclxuICAgIGlmIChyZXN1bHQgPT0gbnVsbClcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIHJldHVybiAhIXJlc3VsdDtcclxufVxyXG5leHBvcnRzLmhhc1BsdWdpblBlcm1pc3Npb24gPSBoYXNQbHVnaW5QZXJtaXNzaW9uO1xyXG5mdW5jdGlvbiBzZXRQbHVnaW5QZXJtaXNzaW9uKHBsdWdpbklkLCBwZXJtaXNzaW9uLCBhY3RpdmUpIHtcclxuICAgIHNoYXJlZF9kYXRhXzEuU2hhcmVkRGF0YS5wbHVnaW5QZXJtaXNzaW9ucyA9IHtcclxuICAgICAgICAuLi5zaGFyZWRfZGF0YV8xLlNoYXJlZERhdGEucGx1Z2luUGVybWlzc2lvbnMsXHJcbiAgICAgICAgW2Ake3BsdWdpbklkfToke3Blcm1pc3Npb259YF06IGFjdGl2ZSxcclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy5zZXRQbHVnaW5QZXJtaXNzaW9uID0gc2V0UGx1Z2luUGVybWlzc2lvbjtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cGx1Z2luLXBlcm1pc3Npb25zLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuZ2V0UGx1Z2luRGVmYXVsdFNldHRpbmdzID0gZXhwb3J0cy5zZXRQbHVnaW5TZXR0aW5ncyA9IGV4cG9ydHMuZ2V0UGx1Z2luU2V0dGluZ3MgPSB2b2lkIDA7XHJcbmNvbnN0IHNoYXJlZF9kYXRhXzEgPSByZXF1aXJlKFwiLi9zaGFyZWQtZGF0YVwiKTtcclxuZnVuY3Rpb24gZ2V0UGx1Z2luU2V0dGluZ3MocGx1Z2luSWQsIGRlZmF1bHRTZXR0aW5ncykge1xyXG4gICAgdmFyIF9hO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICAuLi5kZWZhdWx0U2V0dGluZ3MgIT09IG51bGwgJiYgZGVmYXVsdFNldHRpbmdzICE9PSB2b2lkIDAgPyBkZWZhdWx0U2V0dGluZ3MgOiB7fSxcclxuICAgICAgICAuLi4oX2EgPSBzaGFyZWRfZGF0YV8xLlNoYXJlZERhdGEucGx1Z2luU2V0dGluZ3NbcGx1Z2luSWRdKSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiB7fSxcclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy5nZXRQbHVnaW5TZXR0aW5ncyA9IGdldFBsdWdpblNldHRpbmdzO1xyXG5mdW5jdGlvbiBzZXRQbHVnaW5TZXR0aW5ncyhwbHVnaW5JZCwgc2V0dGluZ3MpIHtcclxuICAgIHNoYXJlZF9kYXRhXzEuU2hhcmVkRGF0YS5wbHVnaW5TZXR0aW5ncyA9IHtcclxuICAgICAgICAuLi5zaGFyZWRfZGF0YV8xLlNoYXJlZERhdGEucGx1Z2luU2V0dGluZ3MsXHJcbiAgICAgICAgW3BsdWdpbklkXTogc2V0dGluZ3MsXHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuc2V0UGx1Z2luU2V0dGluZ3MgPSBzZXRQbHVnaW5TZXR0aW5ncztcclxuZnVuY3Rpb24gZ2V0UGx1Z2luRGVmYXVsdFNldHRpbmdzKHNjaGVtYSkge1xyXG4gICAgY29uc3QgcmVzdWx0ID0ge307XHJcbiAgICBpZiAoc2NoZW1hKSB7XHJcbiAgICAgICAgZm9yIChjb25zdCBpZCBpbiBzY2hlbWEpIHtcclxuICAgICAgICAgICAgY29uc3QgaXRlbSA9IHNjaGVtYVtpZF07XHJcbiAgICAgICAgICAgIHJlc3VsdFtpZF0gPSBpdGVtLmRlZmF1bHRWYWx1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcbmV4cG9ydHMuZ2V0UGx1Z2luRGVmYXVsdFNldHRpbmdzID0gZ2V0UGx1Z2luRGVmYXVsdFNldHRpbmdzO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1wbHVnaW4tc2V0dGluZ3MuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5TaGFyZWREYXRhID0gZXhwb3J0cy53YXRjaFNoYXJlZERhdGEgPSBleHBvcnRzLmRlc3Ryb3lTaGFyZWREYXRhID0gZXhwb3J0cy5vblNoYXJlZERhdGFJbml0ID0gZXhwb3J0cy5pbml0U2hhcmVkRGF0YSA9IHZvaWQgMDtcclxuY29uc3Qgc3RvcmFnZV8xID0gcmVxdWlyZShcIi4vc3RvcmFnZVwiKTtcclxuY29uc3QgZW52XzEgPSByZXF1aXJlKFwiLi9lbnZcIik7XHJcbi8vIEluaXRpYWwgc3RhdGVcclxuY29uc3QgaW50ZXJuYWxTaGFyZWREYXRhID0ge1xyXG4gICAgb3BlbkluRWRpdG9ySG9zdDogJy8nLFxyXG4gICAgY29tcG9uZW50TmFtZVN0eWxlOiAnY2xhc3MnLFxyXG4gICAgdGhlbWU6ICdhdXRvJyxcclxuICAgIGRpc3BsYXlEZW5zaXR5OiAnbG93JyxcclxuICAgIHRpbWVGb3JtYXQ6ICdkZWZhdWx0JyxcclxuICAgIHJlY29yZFZ1ZXg6IHRydWUsXHJcbiAgICBjYWNoZVZ1ZXhTbmFwc2hvdHNFdmVyeTogNTAsXHJcbiAgICBjYWNoZVZ1ZXhTbmFwc2hvdHNMaW1pdDogMTAsXHJcbiAgICBzbmFwc2hvdExvYWRpbmc6IGZhbHNlLFxyXG4gICAgY29tcG9uZW50RXZlbnRzRW5hYmxlZDogdHJ1ZSxcclxuICAgIHBlcmZvcm1hbmNlTW9uaXRvcmluZ0VuYWJsZWQ6IHRydWUsXHJcbiAgICBlZGl0YWJsZVByb3BzOiBmYWxzZSxcclxuICAgIGxvZ0RldGVjdGVkOiB0cnVlLFxyXG4gICAgdnVleE5ld0JhY2tlbmQ6IGZhbHNlLFxyXG4gICAgdnVleEF1dG9sb2FkOiBmYWxzZSxcclxuICAgIHZ1ZXhHcm91cEdldHRlcnNCeU1vZHVsZTogdHJ1ZSxcclxuICAgIHNob3dNZW51U2Nyb2xsVGlwOiB0cnVlLFxyXG4gICAgdGltZWxpbmVUaW1lR3JpZDogdHJ1ZSxcclxuICAgIHRpbWVsaW5lU2NyZWVuc2hvdHM6IHRydWUsXHJcbiAgICBtZW51U3RlcFNjcm9sbGluZzogZW52XzEuaXNNYWMsXHJcbiAgICBwbHVnaW5QZXJtaXNzaW9uczoge30sXHJcbiAgICBwbHVnaW5TZXR0aW5nczoge30sXHJcbiAgICBwYWdlQ29uZmlnOiB7fSxcclxuICAgIGRlYnVnSW5mbzogZmFsc2UsXHJcbn07XHJcbmNvbnN0IHBlcnNpc3RlZCA9IFtcclxuICAgICdjb21wb25lbnROYW1lU3R5bGUnLFxyXG4gICAgJ3RoZW1lJyxcclxuICAgICdkaXNwbGF5RGVuc2l0eScsXHJcbiAgICAncmVjb3JkVnVleCcsXHJcbiAgICAnZWRpdGFibGVQcm9wcycsXHJcbiAgICAnbG9nRGV0ZWN0ZWQnLFxyXG4gICAgJ3Z1ZXhOZXdCYWNrZW5kJyxcclxuICAgICd2dWV4QXV0b2xvYWQnLFxyXG4gICAgJ3Z1ZXhHcm91cEdldHRlcnNCeU1vZHVsZScsXHJcbiAgICAndGltZUZvcm1hdCcsXHJcbiAgICAnc2hvd01lbnVTY3JvbGxUaXAnLFxyXG4gICAgJ3RpbWVsaW5lVGltZUdyaWQnLFxyXG4gICAgJ3RpbWVsaW5lU2NyZWVuc2hvdHMnLFxyXG4gICAgJ21lbnVTdGVwU2Nyb2xsaW5nJyxcclxuICAgICdwbHVnaW5QZXJtaXNzaW9ucycsXHJcbiAgICAncGx1Z2luU2V0dGluZ3MnLFxyXG4gICAgJ3BlcmZvcm1hbmNlTW9uaXRvcmluZ0VuYWJsZWQnLFxyXG4gICAgJ2NvbXBvbmVudEV2ZW50c0VuYWJsZWQnLFxyXG4gICAgJ2RlYnVnSW5mbycsXHJcbl07XHJcbmNvbnN0IHN0b3JhZ2VWZXJzaW9uID0gJzYuMC4wLWFscGhhLjEnO1xyXG4vLyAtLS0tIElOVEVSTkFMUyAtLS0tIC8vXHJcbmxldCBicmlkZ2U7XHJcbi8vIExpc3Qgb2YgZmllbGRzIHRvIHBlcnNpc3QgdG8gc3RvcmFnZSAoZGlzYWJsZWQgaWYgJ2ZhbHNlJylcclxuLy8gVGhpcyBzaG91bGQgYmUgdW5pcXVlIHRvIGVhY2ggc2hhcmVkIGRhdGEgY2xpZW50IHRvIHByZXZlbnQgY29uZmxpY3RzXHJcbmxldCBwZXJzaXN0ID0gZmFsc2U7XHJcbmxldCBkYXRhO1xyXG5sZXQgaW5pdFJldHJ5SW50ZXJ2YWw7XHJcbmxldCBpbml0UmV0cnlDb3VudCA9IDA7XHJcbmNvbnN0IGluaXRDYnMgPSBbXTtcclxuZnVuY3Rpb24gaW5pdFNoYXJlZERhdGEocGFyYW1zKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAvLyBNYW5kYXRvcnkgcGFyYW1zXHJcbiAgICAgICAgYnJpZGdlID0gcGFyYW1zLmJyaWRnZTtcclxuICAgICAgICBwZXJzaXN0ID0gISFwYXJhbXMucGVyc2lzdDtcclxuICAgICAgICBpZiAocGVyc2lzdCkge1xyXG4gICAgICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbc2hhcmVkIGRhdGFdIE1hc3RlciBpbml0IGluIHByb2dyZXNzLi4uJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gTG9hZCBwZXJzaXN0ZWQgZmllbGRzXHJcbiAgICAgICAgICAgIHBlcnNpc3RlZC5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9ICgwLCBzdG9yYWdlXzEuZ2V0U3RvcmFnZSkoYHZ1ZS1kZXZ0b29scy0ke3N0b3JhZ2VWZXJzaW9ufTpzaGFyZWQtZGF0YToke2tleX1gKTtcclxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGludGVybmFsU2hhcmVkRGF0YVtrZXldID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBicmlkZ2Uub24oJ3NoYXJlZC1kYXRhOmxvYWQnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAvLyBTZW5kIGFsbCBmaWVsZHNcclxuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGludGVybmFsU2hhcmVkRGF0YSkuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbmRWYWx1ZShrZXksIGludGVybmFsU2hhcmVkRGF0YVtrZXldKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgYnJpZGdlLnNlbmQoJ3NoYXJlZC1kYXRhOmxvYWQtY29tcGxldGUnKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGJyaWRnZS5vbignc2hhcmVkLWRhdGE6aW5pdC1jb21wbGV0ZScsICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW3NoYXJlZCBkYXRhXSBNYXN0ZXIgaW5pdCBjb21wbGV0ZScpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbml0UmV0cnlJbnRlcnZhbCk7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBicmlkZ2Uuc2VuZCgnc2hhcmVkLWRhdGE6bWFzdGVyLWluaXQtd2FpdGluZycpO1xyXG4gICAgICAgICAgICAvLyBJbiBjYXNlIGJhY2tlbmQgaW5pdCBpcyBleGVjdXRlZCBhZnRlciBmcm9udGVuZFxyXG4gICAgICAgICAgICBicmlkZ2Uub24oJ3NoYXJlZC1kYXRhOm1pbmlvbi1pbml0LXdhaXRpbmcnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBicmlkZ2Uuc2VuZCgnc2hhcmVkLWRhdGE6bWFzdGVyLWluaXQtd2FpdGluZycpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgaW5pdFJldHJ5Q291bnQgPSAwO1xyXG4gICAgICAgICAgICBjbGVhckludGVydmFsKGluaXRSZXRyeUludGVydmFsKTtcclxuICAgICAgICAgICAgaW5pdFJldHJ5SW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tzaGFyZWQgZGF0YV0gTWFzdGVyIGluaXQgcmV0cnlpbmcuLi4nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyaWRnZS5zZW5kKCdzaGFyZWQtZGF0YTptYXN0ZXItaW5pdC13YWl0aW5nJyk7XHJcbiAgICAgICAgICAgICAgICBpbml0UmV0cnlDb3VudCsrO1xyXG4gICAgICAgICAgICAgICAgaWYgKGluaXRSZXRyeUNvdW50ID4gMzApIHtcclxuICAgICAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKGluaXRSZXRyeUludGVydmFsKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbc2hhcmVkIGRhdGFdIE1hc3RlciBpbml0IGZhaWxlZCcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCAyMDAwKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tzaGFyZWQgZGF0YV0gTWluaW9uIGluaXQgaW4gcHJvZ3Jlc3MuLi4nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBicmlkZ2Uub24oJ3NoYXJlZC1kYXRhOm1hc3Rlci1pbml0LXdhaXRpbmcnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tzaGFyZWQgZGF0YV0gTWluaW9uIGxvYWRpbmcgZGF0YS4uLicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gTG9hZCBhbGwgcGVyc2lzdGVkIHNoYXJlZCBkYXRhXHJcbiAgICAgICAgICAgICAgICBicmlkZ2Uuc2VuZCgnc2hhcmVkLWRhdGE6bG9hZCcpO1xyXG4gICAgICAgICAgICAgICAgYnJpZGdlLm9uY2UoJ3NoYXJlZC1kYXRhOmxvYWQtY29tcGxldGUnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tzaGFyZWQgZGF0YV0gTWluaW9uIGluaXQgY29tcGxldGUnKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJpZGdlLnNlbmQoJ3NoYXJlZC1kYXRhOmluaXQtY29tcGxldGUnKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGJyaWRnZS5zZW5kKCdzaGFyZWQtZGF0YTptaW5pb24taW5pdC13YWl0aW5nJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIC4uLmludGVybmFsU2hhcmVkRGF0YSxcclxuICAgICAgICB9O1xyXG4gICAgICAgIGlmIChwYXJhbXMuVnVlKSB7XHJcbiAgICAgICAgICAgIGRhdGEgPSBwYXJhbXMuVnVlLm9ic2VydmFibGUoZGF0YSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIFVwZGF0ZSB2YWx1ZSBmcm9tIG90aGVyIHNoYXJlZCBkYXRhIGNsaWVudHNcclxuICAgICAgICBicmlkZ2Uub24oJ3NoYXJlZC1kYXRhOnNldCcsICh7IGtleSwgdmFsdWUgfSkgPT4ge1xyXG4gICAgICAgICAgICBzZXRWYWx1ZShrZXksIHZhbHVlKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBpbml0Q2JzLmZvckVhY2goY2IgPT4gY2IoKSk7XHJcbiAgICB9KTtcclxufVxyXG5leHBvcnRzLmluaXRTaGFyZWREYXRhID0gaW5pdFNoYXJlZERhdGE7XHJcbmZ1bmN0aW9uIG9uU2hhcmVkRGF0YUluaXQoY2IpIHtcclxuICAgIGluaXRDYnMucHVzaChjYik7XHJcbiAgICByZXR1cm4gKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gaW5pdENicy5pbmRleE9mKGNiKTtcclxuICAgICAgICBpZiAoaW5kZXggIT09IC0xKVxyXG4gICAgICAgICAgICBpbml0Q2JzLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMub25TaGFyZWREYXRhSW5pdCA9IG9uU2hhcmVkRGF0YUluaXQ7XHJcbmZ1bmN0aW9uIGRlc3Ryb3lTaGFyZWREYXRhKCkge1xyXG4gICAgYnJpZGdlLnJlbW92ZUFsbExpc3RlbmVycygnc2hhcmVkLWRhdGE6c2V0Jyk7XHJcbiAgICB3YXRjaGVycyA9IHt9O1xyXG59XHJcbmV4cG9ydHMuZGVzdHJveVNoYXJlZERhdGEgPSBkZXN0cm95U2hhcmVkRGF0YTtcclxubGV0IHdhdGNoZXJzID0ge307XHJcbmZ1bmN0aW9uIHNldFZhbHVlKGtleSwgdmFsdWUpIHtcclxuICAgIC8vIFN0b3JhZ2VcclxuICAgIGlmIChwZXJzaXN0ICYmIHBlcnNpc3RlZC5pbmNsdWRlcyhrZXkpKSB7XHJcbiAgICAgICAgKDAsIHN0b3JhZ2VfMS5zZXRTdG9yYWdlKShgdnVlLWRldnRvb2xzLSR7c3RvcmFnZVZlcnNpb259OnNoYXJlZC1kYXRhOiR7a2V5fWAsIHZhbHVlKTtcclxuICAgIH1cclxuICAgIGNvbnN0IG9sZFZhbHVlID0gZGF0YVtrZXldO1xyXG4gICAgZGF0YVtrZXldID0gdmFsdWU7XHJcbiAgICBjb25zdCBoYW5kbGVycyA9IHdhdGNoZXJzW2tleV07XHJcbiAgICBpZiAoaGFuZGxlcnMpIHtcclxuICAgICAgICBoYW5kbGVycy5mb3JFYWNoKGggPT4gaCh2YWx1ZSwgb2xkVmFsdWUpKTtcclxuICAgIH1cclxuICAgIC8vIFZhbGlkYXRlIFByb3h5IHNldCB0cmFwXHJcbiAgICByZXR1cm4gdHJ1ZTtcclxufVxyXG5mdW5jdGlvbiBzZW5kVmFsdWUoa2V5LCB2YWx1ZSkge1xyXG4gICAgYnJpZGdlICYmIGJyaWRnZS5zZW5kKCdzaGFyZWQtZGF0YTpzZXQnLCB7XHJcbiAgICAgICAga2V5LFxyXG4gICAgICAgIHZhbHVlLFxyXG4gICAgfSk7XHJcbn1cclxuZnVuY3Rpb24gd2F0Y2hTaGFyZWREYXRhKHByb3AsIGhhbmRsZXIpIHtcclxuICAgIGNvbnN0IGxpc3QgPSB3YXRjaGVyc1twcm9wXSB8fCAod2F0Y2hlcnNbcHJvcF0gPSBbXSk7XHJcbiAgICBsaXN0LnB1c2goaGFuZGxlcik7XHJcbiAgICByZXR1cm4gKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gbGlzdC5pbmRleE9mKGhhbmRsZXIpO1xyXG4gICAgICAgIGlmIChpbmRleCAhPT0gLTEpXHJcbiAgICAgICAgICAgIGxpc3Quc3BsaWNlKGluZGV4LCAxKTtcclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy53YXRjaFNoYXJlZERhdGEgPSB3YXRjaFNoYXJlZERhdGE7XHJcbmNvbnN0IHByb3h5ID0ge307XHJcbk9iamVjdC5rZXlzKGludGVybmFsU2hhcmVkRGF0YSkuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3h5LCBrZXksIHtcclxuICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxyXG4gICAgICAgIGdldDogKCkgPT4gZGF0YVtrZXldLFxyXG4gICAgICAgIHNldDogKHZhbHVlKSA9PiB7XHJcbiAgICAgICAgICAgIHNlbmRWYWx1ZShrZXksIHZhbHVlKTtcclxuICAgICAgICAgICAgc2V0VmFsdWUoa2V5LCB2YWx1ZSk7XHJcbiAgICAgICAgfSxcclxuICAgIH0pO1xyXG59KTtcclxuZXhwb3J0cy5TaGFyZWREYXRhID0gcHJveHk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNoYXJlZC1kYXRhLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuY2xlYXJTdG9yYWdlID0gZXhwb3J0cy5yZW1vdmVTdG9yYWdlID0gZXhwb3J0cy5zZXRTdG9yYWdlID0gZXhwb3J0cy5nZXRTdG9yYWdlID0gZXhwb3J0cy5pbml0U3RvcmFnZSA9IHZvaWQgMDtcclxuY29uc3QgZW52XzEgPSByZXF1aXJlKFwiLi9lbnZcIik7XHJcbi8vIElmIHdlIGNhbiwgd2UgdXNlIHRoZSBicm93c2VyIGV4dGVuc2lvbiBBUEkgdG8gc3RvcmUgZGF0YVxyXG4vLyBpdCdzIGFzeW5jIHRob3VnaCwgc28gd2Ugc3luY2hyb25pemUgY2hhbmdlcyBmcm9tIGFuIGludGVybWVkaWF0ZVxyXG4vLyBzdG9yYWdlRGF0YSBvYmplY3RcclxuY29uc3QgdXNlU3RvcmFnZSA9IHR5cGVvZiBlbnZfMS50YXJnZXQuY2hyb21lICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgZW52XzEudGFyZ2V0LmNocm9tZS5zdG9yYWdlICE9PSAndW5kZWZpbmVkJztcclxubGV0IHN0b3JhZ2VEYXRhID0gbnVsbDtcclxuZnVuY3Rpb24gaW5pdFN0b3JhZ2UoKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICBpZiAodXNlU3RvcmFnZSkge1xyXG4gICAgICAgICAgICBlbnZfMS50YXJnZXQuY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KG51bGwsIHJlc3VsdCA9PiB7XHJcbiAgICAgICAgICAgICAgICBzdG9yYWdlRGF0YSA9IHJlc3VsdDtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBzdG9yYWdlRGF0YSA9IHt9O1xyXG4gICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuZXhwb3J0cy5pbml0U3RvcmFnZSA9IGluaXRTdG9yYWdlO1xyXG5mdW5jdGlvbiBnZXRTdG9yYWdlKGtleSwgZGVmYXVsdFZhbHVlID0gbnVsbCkge1xyXG4gICAgY2hlY2tTdG9yYWdlKCk7XHJcbiAgICBpZiAodXNlU3RvcmFnZSkge1xyXG4gICAgICAgIHJldHVybiBnZXREZWZhdWx0VmFsdWUoc3RvcmFnZURhdGFba2V5XSwgZGVmYXVsdFZhbHVlKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHJldHVybiBnZXREZWZhdWx0VmFsdWUoSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpKSwgZGVmYXVsdFZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGUpIHsgfVxyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuZ2V0U3RvcmFnZSA9IGdldFN0b3JhZ2U7XHJcbmZ1bmN0aW9uIHNldFN0b3JhZ2Uoa2V5LCB2YWwpIHtcclxuICAgIGNoZWNrU3RvcmFnZSgpO1xyXG4gICAgaWYgKHVzZVN0b3JhZ2UpIHtcclxuICAgICAgICBzdG9yYWdlRGF0YVtrZXldID0gdmFsO1xyXG4gICAgICAgIGVudl8xLnRhcmdldC5jaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeyBba2V5XTogdmFsIH0pO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBKU09OLnN0cmluZ2lmeSh2YWwpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGUpIHsgfVxyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuc2V0U3RvcmFnZSA9IHNldFN0b3JhZ2U7XHJcbmZ1bmN0aW9uIHJlbW92ZVN0b3JhZ2Uoa2V5KSB7XHJcbiAgICBjaGVja1N0b3JhZ2UoKTtcclxuICAgIGlmICh1c2VTdG9yYWdlKSB7XHJcbiAgICAgICAgZGVsZXRlIHN0b3JhZ2VEYXRhW2tleV07XHJcbiAgICAgICAgZW52XzEudGFyZ2V0LmNocm9tZS5zdG9yYWdlLmxvY2FsLnJlbW92ZShba2V5XSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCAoZSkgeyB9XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5yZW1vdmVTdG9yYWdlID0gcmVtb3ZlU3RvcmFnZTtcclxuZnVuY3Rpb24gY2xlYXJTdG9yYWdlKCkge1xyXG4gICAgY2hlY2tTdG9yYWdlKCk7XHJcbiAgICBpZiAodXNlU3RvcmFnZSkge1xyXG4gICAgICAgIHN0b3JhZ2VEYXRhID0ge307XHJcbiAgICAgICAgZW52XzEudGFyZ2V0LmNocm9tZS5zdG9yYWdlLmxvY2FsLmNsZWFyKCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2UuY2xlYXIoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGUpIHsgfVxyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuY2xlYXJTdG9yYWdlID0gY2xlYXJTdG9yYWdlO1xyXG5mdW5jdGlvbiBjaGVja1N0b3JhZ2UoKSB7XHJcbiAgICBpZiAoIXN0b3JhZ2VEYXRhKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTdG9yYWdlIHdhc25cXCd0IGluaXRpYWxpemVkIHdpdGggXFwnaW5pdCgpXFwnJyk7XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gZ2V0RGVmYXVsdFZhbHVlKHZhbHVlLCBkZWZhdWx0VmFsdWUpIHtcclxuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XHJcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcclxuICAgIH1cclxuICAgIHJldHVybiB2YWx1ZTtcclxufVxyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1zdG9yYWdlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuc3RyaW5naWZ5U3RyaWN0Q2lyY3VsYXJBdXRvQ2h1bmtzID0gZXhwb3J0cy5wYXJzZUNpcmN1bGFyQXV0b0NodW5rcyA9IGV4cG9ydHMuc3RyaW5naWZ5Q2lyY3VsYXJBdXRvQ2h1bmtzID0gdm9pZCAwO1xyXG5jb25zdCBNQVhfU0VSSUFMSVpFRF9TSVpFID0gNTEyICogMTAyNDsgLy8gMU1CXHJcbmZ1bmN0aW9uIGVuY29kZShkYXRhLCByZXBsYWNlciwgbGlzdCwgc2Vlbikge1xyXG4gICAgbGV0IHN0b3JlZCwga2V5LCB2YWx1ZSwgaSwgbDtcclxuICAgIGNvbnN0IHNlZW5JbmRleCA9IHNlZW4uZ2V0KGRhdGEpO1xyXG4gICAgaWYgKHNlZW5JbmRleCAhPSBudWxsKSB7XHJcbiAgICAgICAgcmV0dXJuIHNlZW5JbmRleDtcclxuICAgIH1cclxuICAgIGNvbnN0IGluZGV4ID0gbGlzdC5sZW5ndGg7XHJcbiAgICBjb25zdCBwcm90byA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChkYXRhKTtcclxuICAgIGlmIChwcm90byA9PT0gJ1tvYmplY3QgT2JqZWN0XScpIHtcclxuICAgICAgICBzdG9yZWQgPSB7fTtcclxuICAgICAgICBzZWVuLnNldChkYXRhLCBpbmRleCk7XHJcbiAgICAgICAgbGlzdC5wdXNoKHN0b3JlZCk7XHJcbiAgICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGRhdGEpO1xyXG4gICAgICAgIGZvciAoaSA9IDAsIGwgPSBrZXlzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgICAgICBrZXkgPSBrZXlzW2ldO1xyXG4gICAgICAgICAgICB2YWx1ZSA9IGRhdGFba2V5XTtcclxuICAgICAgICAgICAgaWYgKHJlcGxhY2VyKVxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSByZXBsYWNlci5jYWxsKGRhdGEsIGtleSwgdmFsdWUpO1xyXG4gICAgICAgICAgICBzdG9yZWRba2V5XSA9IGVuY29kZSh2YWx1ZSwgcmVwbGFjZXIsIGxpc3QsIHNlZW4pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHByb3RvID09PSAnW29iamVjdCBBcnJheV0nKSB7XHJcbiAgICAgICAgc3RvcmVkID0gW107XHJcbiAgICAgICAgc2Vlbi5zZXQoZGF0YSwgaW5kZXgpO1xyXG4gICAgICAgIGxpc3QucHVzaChzdG9yZWQpO1xyXG4gICAgICAgIGZvciAoaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgICAgICB2YWx1ZSA9IGRhdGFbaV07XHJcbiAgICAgICAgICAgIGlmIChyZXBsYWNlcilcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gcmVwbGFjZXIuY2FsbChkYXRhLCBpLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgIHN0b3JlZFtpXSA9IGVuY29kZSh2YWx1ZSwgcmVwbGFjZXIsIGxpc3QsIHNlZW4pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIGxpc3QucHVzaChkYXRhKTtcclxuICAgIH1cclxuICAgIHJldHVybiBpbmRleDtcclxufVxyXG5mdW5jdGlvbiBkZWNvZGUobGlzdCwgcmV2aXZlcikge1xyXG4gICAgbGV0IGkgPSBsaXN0Lmxlbmd0aDtcclxuICAgIGxldCBqLCBrLCBkYXRhLCBrZXksIHZhbHVlLCBwcm90bztcclxuICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICBkYXRhID0gbGlzdFtpXTtcclxuICAgICAgICBwcm90byA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChkYXRhKTtcclxuICAgICAgICBpZiAocHJvdG8gPT09ICdbb2JqZWN0IE9iamVjdF0nKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhkYXRhKTtcclxuICAgICAgICAgICAgZm9yIChqID0gMCwgayA9IGtleXMubGVuZ3RoOyBqIDwgazsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICBrZXkgPSBrZXlzW2pdO1xyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBsaXN0W2RhdGFba2V5XV07XHJcbiAgICAgICAgICAgICAgICBpZiAocmV2aXZlcilcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHJldml2ZXIuY2FsbChkYXRhLCBrZXksIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIGRhdGFba2V5XSA9IHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHByb3RvID09PSAnW29iamVjdCBBcnJheV0nKSB7XHJcbiAgICAgICAgICAgIGZvciAoaiA9IDAsIGsgPSBkYXRhLmxlbmd0aDsgaiA8IGs7IGorKykge1xyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBsaXN0W2RhdGFbal1dO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJldml2ZXIpXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSByZXZpdmVyLmNhbGwoZGF0YSwgaiwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgZGF0YVtqXSA9IHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbmZ1bmN0aW9uIHN0cmluZ2lmeUNpcmN1bGFyQXV0b0NodW5rcyhkYXRhLCByZXBsYWNlciA9IG51bGwsIHNwYWNlID0gbnVsbCkge1xyXG4gICAgbGV0IHJlc3VsdDtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgcmVzdWx0ID0gYXJndW1lbnRzLmxlbmd0aCA9PT0gMVxyXG4gICAgICAgICAgICA/IEpTT04uc3RyaW5naWZ5KGRhdGEpXHJcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcclxuICAgICAgICAgICAgOiBKU09OLnN0cmluZ2lmeShkYXRhLCByZXBsYWNlciwgc3BhY2UpO1xyXG4gICAgfVxyXG4gICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICByZXN1bHQgPSBzdHJpbmdpZnlTdHJpY3RDaXJjdWxhckF1dG9DaHVua3MoZGF0YSwgcmVwbGFjZXIsIHNwYWNlKTtcclxuICAgIH1cclxuICAgIGlmIChyZXN1bHQubGVuZ3RoID4gTUFYX1NFUklBTElaRURfU0laRSkge1xyXG4gICAgICAgIGNvbnN0IGNodW5rQ291bnQgPSBNYXRoLmNlaWwocmVzdWx0Lmxlbmd0aCAvIE1BWF9TRVJJQUxJWkVEX1NJWkUpO1xyXG4gICAgICAgIGNvbnN0IGNodW5rcyA9IFtdO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2h1bmtDb3VudDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNodW5rcy5wdXNoKHJlc3VsdC5zbGljZShpICogTUFYX1NFUklBTElaRURfU0laRSwgKGkgKyAxKSAqIE1BWF9TRVJJQUxJWkVEX1NJWkUpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGNodW5rcztcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn1cclxuZXhwb3J0cy5zdHJpbmdpZnlDaXJjdWxhckF1dG9DaHVua3MgPSBzdHJpbmdpZnlDaXJjdWxhckF1dG9DaHVua3M7XHJcbmZ1bmN0aW9uIHBhcnNlQ2lyY3VsYXJBdXRvQ2h1bmtzKGRhdGEsIHJldml2ZXIgPSBudWxsKSB7XHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheShkYXRhKSkge1xyXG4gICAgICAgIGRhdGEgPSBkYXRhLmpvaW4oJycpO1xyXG4gICAgfVxyXG4gICAgY29uc3QgaGFzQ2lyY3VsYXIgPSAvXlxccy8udGVzdChkYXRhKTtcclxuICAgIGlmICghaGFzQ2lyY3VsYXIpIHtcclxuICAgICAgICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA9PT0gMVxyXG4gICAgICAgICAgICA/IEpTT04ucGFyc2UoZGF0YSlcclxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICA6IEpTT04ucGFyc2UoZGF0YSwgcmV2aXZlcik7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBjb25zdCBsaXN0ID0gSlNPTi5wYXJzZShkYXRhKTtcclxuICAgICAgICBkZWNvZGUobGlzdCwgcmV2aXZlcik7XHJcbiAgICAgICAgcmV0dXJuIGxpc3RbMF07XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5wYXJzZUNpcmN1bGFyQXV0b0NodW5rcyA9IHBhcnNlQ2lyY3VsYXJBdXRvQ2h1bmtzO1xyXG5mdW5jdGlvbiBzdHJpbmdpZnlTdHJpY3RDaXJjdWxhckF1dG9DaHVua3MoZGF0YSwgcmVwbGFjZXIgPSBudWxsLCBzcGFjZSA9IG51bGwpIHtcclxuICAgIGNvbnN0IGxpc3QgPSBbXTtcclxuICAgIGVuY29kZShkYXRhLCByZXBsYWNlciwgbGlzdCwgbmV3IE1hcCgpKTtcclxuICAgIHJldHVybiBzcGFjZVxyXG4gICAgICAgID8gJyAnICsgSlNPTi5zdHJpbmdpZnkobGlzdCwgbnVsbCwgc3BhY2UpXHJcbiAgICAgICAgOiAnICcgKyBKU09OLnN0cmluZ2lmeShsaXN0KTtcclxufVxyXG5leHBvcnRzLnN0cmluZ2lmeVN0cmljdENpcmN1bGFyQXV0b0NodW5rcyA9IHN0cmluZ2lmeVN0cmljdENpcmN1bGFyQXV0b0NodW5rcztcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dHJhbnNmZXIuanMubWFwIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmljZXNcbiAqL1xuXG5jb25zdCBjbG9uZSA9IHJlcXVpcmUoJ3NoYWxsb3ctY2xvbmUnKTtcbmNvbnN0IHR5cGVPZiA9IHJlcXVpcmUoJ2tpbmQtb2YnKTtcbmNvbnN0IGlzUGxhaW5PYmplY3QgPSByZXF1aXJlKCdpcy1wbGFpbi1vYmplY3QnKTtcblxuZnVuY3Rpb24gY2xvbmVEZWVwKHZhbCwgaW5zdGFuY2VDbG9uZSkge1xuICBzd2l0Y2ggKHR5cGVPZih2YWwpKSB7XG4gICAgY2FzZSAnb2JqZWN0JzpcbiAgICAgIHJldHVybiBjbG9uZU9iamVjdERlZXAodmFsLCBpbnN0YW5jZUNsb25lKTtcbiAgICBjYXNlICdhcnJheSc6XG4gICAgICByZXR1cm4gY2xvbmVBcnJheURlZXAodmFsLCBpbnN0YW5jZUNsb25lKTtcbiAgICBkZWZhdWx0OiB7XG4gICAgICByZXR1cm4gY2xvbmUodmFsKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gY2xvbmVPYmplY3REZWVwKHZhbCwgaW5zdGFuY2VDbG9uZSkge1xuICBpZiAodHlwZW9mIGluc3RhbmNlQ2xvbmUgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gaW5zdGFuY2VDbG9uZSh2YWwpO1xuICB9XG4gIGlmIChpbnN0YW5jZUNsb25lIHx8IGlzUGxhaW5PYmplY3QodmFsKSkge1xuICAgIGNvbnN0IHJlcyA9IG5ldyB2YWwuY29uc3RydWN0b3IoKTtcbiAgICBmb3IgKGxldCBrZXkgaW4gdmFsKSB7XG4gICAgICByZXNba2V5XSA9IGNsb25lRGVlcCh2YWxba2V5XSwgaW5zdGFuY2VDbG9uZSk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG4gIH1cbiAgcmV0dXJuIHZhbDtcbn1cblxuZnVuY3Rpb24gY2xvbmVBcnJheURlZXAodmFsLCBpbnN0YW5jZUNsb25lKSB7XG4gIGNvbnN0IHJlcyA9IG5ldyB2YWwuY29uc3RydWN0b3IodmFsLmxlbmd0aCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB7XG4gICAgcmVzW2ldID0gY2xvbmVEZWVwKHZhbFtpXSwgaW5zdGFuY2VDbG9uZSk7XG4gIH1cbiAgcmV0dXJuIHJlcztcbn1cblxuLyoqXG4gKiBFeHBvc2UgYGNsb25lRGVlcGBcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsb25lRGVlcDtcbiIsIi8qIVxuICogaXMtcGxhaW4tb2JqZWN0IDxodHRwczovL2dpdGh1Yi5jb20vam9uc2NobGlua2VydC9pcy1wbGFpbi1vYmplY3Q+XG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LTIwMTcsIEpvbiBTY2hsaW5rZXJ0LlxuICogUmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnaXNvYmplY3QnKTtcblxuZnVuY3Rpb24gaXNPYmplY3RPYmplY3Qobykge1xuICByZXR1cm4gaXNPYmplY3QobykgPT09IHRydWVcbiAgICAmJiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobykgPT09ICdbb2JqZWN0IE9iamVjdF0nO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzUGxhaW5PYmplY3Qobykge1xuICB2YXIgY3Rvcixwcm90O1xuXG4gIGlmIChpc09iamVjdE9iamVjdChvKSA9PT0gZmFsc2UpIHJldHVybiBmYWxzZTtcblxuICAvLyBJZiBoYXMgbW9kaWZpZWQgY29uc3RydWN0b3JcbiAgY3RvciA9IG8uY29uc3RydWN0b3I7XG4gIGlmICh0eXBlb2YgY3RvciAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuIGZhbHNlO1xuXG4gIC8vIElmIGhhcyBtb2RpZmllZCBwcm90b3R5cGVcbiAgcHJvdCA9IGN0b3IucHJvdG90eXBlO1xuICBpZiAoaXNPYmplY3RPYmplY3QocHJvdCkgPT09IGZhbHNlKSByZXR1cm4gZmFsc2U7XG5cbiAgLy8gSWYgY29uc3RydWN0b3IgZG9lcyBub3QgaGF2ZSBhbiBPYmplY3Qtc3BlY2lmaWMgbWV0aG9kXG4gIGlmIChwcm90Lmhhc093blByb3BlcnR5KCdpc1Byb3RvdHlwZU9mJykgPT09IGZhbHNlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gTW9zdCBsaWtlbHkgYSBwbGFpbiBPYmplY3RcbiAgcmV0dXJuIHRydWU7XG59O1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFIgPSB0eXBlb2YgUmVmbGVjdCA9PT0gJ29iamVjdCcgPyBSZWZsZWN0IDogbnVsbFxudmFyIFJlZmxlY3RBcHBseSA9IFIgJiYgdHlwZW9mIFIuYXBwbHkgPT09ICdmdW5jdGlvbidcbiAgPyBSLmFwcGx5XG4gIDogZnVuY3Rpb24gUmVmbGVjdEFwcGx5KHRhcmdldCwgcmVjZWl2ZXIsIGFyZ3MpIHtcbiAgICByZXR1cm4gRnVuY3Rpb24ucHJvdG90eXBlLmFwcGx5LmNhbGwodGFyZ2V0LCByZWNlaXZlciwgYXJncyk7XG4gIH1cblxudmFyIFJlZmxlY3RPd25LZXlzXG5pZiAoUiAmJiB0eXBlb2YgUi5vd25LZXlzID09PSAnZnVuY3Rpb24nKSB7XG4gIFJlZmxlY3RPd25LZXlzID0gUi5vd25LZXlzXG59IGVsc2UgaWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMpIHtcbiAgUmVmbGVjdE93bktleXMgPSBmdW5jdGlvbiBSZWZsZWN0T3duS2V5cyh0YXJnZXQpIHtcbiAgICByZXR1cm4gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGFyZ2V0KVxuICAgICAgLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKHRhcmdldCkpO1xuICB9O1xufSBlbHNlIHtcbiAgUmVmbGVjdE93bktleXMgPSBmdW5jdGlvbiBSZWZsZWN0T3duS2V5cyh0YXJnZXQpIHtcbiAgICByZXR1cm4gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGFyZ2V0KTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gUHJvY2Vzc0VtaXRXYXJuaW5nKHdhcm5pbmcpIHtcbiAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS53YXJuKSBjb25zb2xlLndhcm4od2FybmluZyk7XG59XG5cbnZhciBOdW1iZXJJc05hTiA9IE51bWJlci5pc05hTiB8fCBmdW5jdGlvbiBOdW1iZXJJc05hTih2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgIT09IHZhbHVlO1xufVxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIEV2ZW50RW1pdHRlci5pbml0LmNhbGwodGhpcyk7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcbm1vZHVsZS5leHBvcnRzLm9uY2UgPSBvbmNlO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjEwLnhcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50c0NvdW50ID0gMDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnMgYXJlXG4vLyBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxudmFyIGRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuZnVuY3Rpb24gY2hlY2tMaXN0ZW5lcihsaXN0ZW5lcikge1xuICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwibGlzdGVuZXJcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgRnVuY3Rpb24uIFJlY2VpdmVkIHR5cGUgJyArIHR5cGVvZiBsaXN0ZW5lcik7XG4gIH1cbn1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KEV2ZW50RW1pdHRlciwgJ2RlZmF1bHRNYXhMaXN0ZW5lcnMnLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gIH0sXG4gIHNldDogZnVuY3Rpb24oYXJnKSB7XG4gICAgaWYgKHR5cGVvZiBhcmcgIT09ICdudW1iZXInIHx8IGFyZyA8IDAgfHwgTnVtYmVySXNOYU4oYXJnKSkge1xuICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RoZSB2YWx1ZSBvZiBcImRlZmF1bHRNYXhMaXN0ZW5lcnNcIiBpcyBvdXQgb2YgcmFuZ2UuIEl0IG11c3QgYmUgYSBub24tbmVnYXRpdmUgbnVtYmVyLiBSZWNlaXZlZCAnICsgYXJnICsgJy4nKTtcbiAgICB9XG4gICAgZGVmYXVsdE1heExpc3RlbmVycyA9IGFyZztcbiAgfVxufSk7XG5cbkV2ZW50RW1pdHRlci5pbml0ID0gZnVuY3Rpb24oKSB7XG5cbiAgaWYgKHRoaXMuX2V2ZW50cyA9PT0gdW5kZWZpbmVkIHx8XG4gICAgICB0aGlzLl9ldmVudHMgPT09IE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKS5fZXZlbnRzKSB7XG4gICAgdGhpcy5fZXZlbnRzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICB0aGlzLl9ldmVudHNDb3VudCA9IDA7XG4gIH1cblxuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufTtcblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24gc2V0TWF4TGlzdGVuZXJzKG4pIHtcbiAgaWYgKHR5cGVvZiBuICE9PSAnbnVtYmVyJyB8fCBuIDwgMCB8fCBOdW1iZXJJc05hTihuKSkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdUaGUgdmFsdWUgb2YgXCJuXCIgaXMgb3V0IG9mIHJhbmdlLiBJdCBtdXN0IGJlIGEgbm9uLW5lZ2F0aXZlIG51bWJlci4gUmVjZWl2ZWQgJyArIG4gKyAnLicpO1xuICB9XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuZnVuY3Rpb24gX2dldE1heExpc3RlbmVycyh0aGF0KSB7XG4gIGlmICh0aGF0Ll9tYXhMaXN0ZW5lcnMgPT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gIHJldHVybiB0aGF0Ll9tYXhMaXN0ZW5lcnM7XG59XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZ2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24gZ2V0TWF4TGlzdGVuZXJzKCkge1xuICByZXR1cm4gX2dldE1heExpc3RlbmVycyh0aGlzKTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQodHlwZSkge1xuICB2YXIgYXJncyA9IFtdO1xuICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgYXJncy5wdXNoKGFyZ3VtZW50c1tpXSk7XG4gIHZhciBkb0Vycm9yID0gKHR5cGUgPT09ICdlcnJvcicpO1xuXG4gIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHM7XG4gIGlmIChldmVudHMgIT09IHVuZGVmaW5lZClcbiAgICBkb0Vycm9yID0gKGRvRXJyb3IgJiYgZXZlbnRzLmVycm9yID09PSB1bmRlZmluZWQpO1xuICBlbHNlIGlmICghZG9FcnJvcilcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAoZG9FcnJvcikge1xuICAgIHZhciBlcjtcbiAgICBpZiAoYXJncy5sZW5ndGggPiAwKVxuICAgICAgZXIgPSBhcmdzWzBdO1xuICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAvLyBOb3RlOiBUaGUgY29tbWVudHMgb24gdGhlIGB0aHJvd2AgbGluZXMgYXJlIGludGVudGlvbmFsLCB0aGV5IHNob3dcbiAgICAgIC8vIHVwIGluIE5vZGUncyBvdXRwdXQgaWYgdGhpcyByZXN1bHRzIGluIGFuIHVuaGFuZGxlZCBleGNlcHRpb24uXG4gICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICB9XG4gICAgLy8gQXQgbGVhc3QgZ2l2ZSBzb21lIGtpbmQgb2YgY29udGV4dCB0byB0aGUgdXNlclxuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoJ1VuaGFuZGxlZCBlcnJvci4nICsgKGVyID8gJyAoJyArIGVyLm1lc3NhZ2UgKyAnKScgOiAnJykpO1xuICAgIGVyci5jb250ZXh0ID0gZXI7XG4gICAgdGhyb3cgZXJyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICB9XG5cbiAgdmFyIGhhbmRsZXIgPSBldmVudHNbdHlwZV07XG5cbiAgaWYgKGhhbmRsZXIgPT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKHR5cGVvZiBoYW5kbGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgUmVmbGVjdEFwcGx5KGhhbmRsZXIsIHRoaXMsIGFyZ3MpO1xuICB9IGVsc2Uge1xuICAgIHZhciBsZW4gPSBoYW5kbGVyLmxlbmd0aDtcbiAgICB2YXIgbGlzdGVuZXJzID0gYXJyYXlDbG9uZShoYW5kbGVyLCBsZW4pO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpXG4gICAgICBSZWZsZWN0QXBwbHkobGlzdGVuZXJzW2ldLCB0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuZnVuY3Rpb24gX2FkZExpc3RlbmVyKHRhcmdldCwgdHlwZSwgbGlzdGVuZXIsIHByZXBlbmQpIHtcbiAgdmFyIG07XG4gIHZhciBldmVudHM7XG4gIHZhciBleGlzdGluZztcblxuICBjaGVja0xpc3RlbmVyKGxpc3RlbmVyKTtcblxuICBldmVudHMgPSB0YXJnZXQuX2V2ZW50cztcbiAgaWYgKGV2ZW50cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZXZlbnRzID0gdGFyZ2V0Ll9ldmVudHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHRhcmdldC5fZXZlbnRzQ291bnQgPSAwO1xuICB9IGVsc2Uge1xuICAgIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gICAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICAgIGlmIChldmVudHMubmV3TGlzdGVuZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGFyZ2V0LmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyID8gbGlzdGVuZXIubGlzdGVuZXIgOiBsaXN0ZW5lcik7XG5cbiAgICAgIC8vIFJlLWFzc2lnbiBgZXZlbnRzYCBiZWNhdXNlIGEgbmV3TGlzdGVuZXIgaGFuZGxlciBjb3VsZCBoYXZlIGNhdXNlZCB0aGVcbiAgICAgIC8vIHRoaXMuX2V2ZW50cyB0byBiZSBhc3NpZ25lZCB0byBhIG5ldyBvYmplY3RcbiAgICAgIGV2ZW50cyA9IHRhcmdldC5fZXZlbnRzO1xuICAgIH1cbiAgICBleGlzdGluZyA9IGV2ZW50c1t0eXBlXTtcbiAgfVxuXG4gIGlmIChleGlzdGluZyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgZXhpc3RpbmcgPSBldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgICArK3RhcmdldC5fZXZlbnRzQ291bnQ7XG4gIH0gZWxzZSB7XG4gICAgaWYgKHR5cGVvZiBleGlzdGluZyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgICBleGlzdGluZyA9IGV2ZW50c1t0eXBlXSA9XG4gICAgICAgIHByZXBlbmQgPyBbbGlzdGVuZXIsIGV4aXN0aW5nXSA6IFtleGlzdGluZywgbGlzdGVuZXJdO1xuICAgICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIH0gZWxzZSBpZiAocHJlcGVuZCkge1xuICAgICAgZXhpc3RpbmcudW5zaGlmdChsaXN0ZW5lcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4aXN0aW5nLnB1c2gobGlzdGVuZXIpO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gICAgbSA9IF9nZXRNYXhMaXN0ZW5lcnModGFyZ2V0KTtcbiAgICBpZiAobSA+IDAgJiYgZXhpc3RpbmcubGVuZ3RoID4gbSAmJiAhZXhpc3Rpbmcud2FybmVkKSB7XG4gICAgICBleGlzdGluZy53YXJuZWQgPSB0cnVlO1xuICAgICAgLy8gTm8gZXJyb3IgY29kZSBmb3IgdGhpcyBzaW5jZSBpdCBpcyBhIFdhcm5pbmdcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1yZXN0cmljdGVkLXN5bnRheFxuICAgICAgdmFyIHcgPSBuZXcgRXJyb3IoJ1Bvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgbGVhayBkZXRlY3RlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGV4aXN0aW5nLmxlbmd0aCArICcgJyArIFN0cmluZyh0eXBlKSArICcgbGlzdGVuZXJzICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAnYWRkZWQuIFVzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAnaW5jcmVhc2UgbGltaXQnKTtcbiAgICAgIHcubmFtZSA9ICdNYXhMaXN0ZW5lcnNFeGNlZWRlZFdhcm5pbmcnO1xuICAgICAgdy5lbWl0dGVyID0gdGFyZ2V0O1xuICAgICAgdy50eXBlID0gdHlwZTtcbiAgICAgIHcuY291bnQgPSBleGlzdGluZy5sZW5ndGg7XG4gICAgICBQcm9jZXNzRW1pdFdhcm5pbmcodyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRhcmdldDtcbn1cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uIGFkZExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHJldHVybiBfYWRkTGlzdGVuZXIodGhpcywgdHlwZSwgbGlzdGVuZXIsIGZhbHNlKTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnByZXBlbmRMaXN0ZW5lciA9XG4gICAgZnVuY3Rpb24gcHJlcGVuZExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyKSB7XG4gICAgICByZXR1cm4gX2FkZExpc3RlbmVyKHRoaXMsIHR5cGUsIGxpc3RlbmVyLCB0cnVlKTtcbiAgICB9O1xuXG5mdW5jdGlvbiBvbmNlV3JhcHBlcigpIHtcbiAgaWYgKCF0aGlzLmZpcmVkKSB7XG4gICAgdGhpcy50YXJnZXQucmVtb3ZlTGlzdGVuZXIodGhpcy50eXBlLCB0aGlzLndyYXBGbik7XG4gICAgdGhpcy5maXJlZCA9IHRydWU7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICByZXR1cm4gdGhpcy5saXN0ZW5lci5jYWxsKHRoaXMudGFyZ2V0KTtcbiAgICByZXR1cm4gdGhpcy5saXN0ZW5lci5hcHBseSh0aGlzLnRhcmdldCwgYXJndW1lbnRzKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfb25jZVdyYXAodGFyZ2V0LCB0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgc3RhdGUgPSB7IGZpcmVkOiBmYWxzZSwgd3JhcEZuOiB1bmRlZmluZWQsIHRhcmdldDogdGFyZ2V0LCB0eXBlOiB0eXBlLCBsaXN0ZW5lcjogbGlzdGVuZXIgfTtcbiAgdmFyIHdyYXBwZWQgPSBvbmNlV3JhcHBlci5iaW5kKHN0YXRlKTtcbiAgd3JhcHBlZC5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICBzdGF0ZS53cmFwRm4gPSB3cmFwcGVkO1xuICByZXR1cm4gd3JhcHBlZDtcbn1cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24gb25jZSh0eXBlLCBsaXN0ZW5lcikge1xuICBjaGVja0xpc3RlbmVyKGxpc3RlbmVyKTtcbiAgdGhpcy5vbih0eXBlLCBfb25jZVdyYXAodGhpcywgdHlwZSwgbGlzdGVuZXIpKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnByZXBlbmRPbmNlTGlzdGVuZXIgPVxuICAgIGZ1bmN0aW9uIHByZXBlbmRPbmNlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIpIHtcbiAgICAgIGNoZWNrTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgICAgdGhpcy5wcmVwZW5kTGlzdGVuZXIodHlwZSwgX29uY2VXcmFwKHRoaXMsIHR5cGUsIGxpc3RlbmVyKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4vLyBFbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWYgYW5kIG9ubHkgaWYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9XG4gICAgZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIpIHtcbiAgICAgIHZhciBsaXN0LCBldmVudHMsIHBvc2l0aW9uLCBpLCBvcmlnaW5hbExpc3RlbmVyO1xuXG4gICAgICBjaGVja0xpc3RlbmVyKGxpc3RlbmVyKTtcblxuICAgICAgZXZlbnRzID0gdGhpcy5fZXZlbnRzO1xuICAgICAgaWYgKGV2ZW50cyA9PT0gdW5kZWZpbmVkKVxuICAgICAgICByZXR1cm4gdGhpcztcblxuICAgICAgbGlzdCA9IGV2ZW50c1t0eXBlXTtcbiAgICAgIGlmIChsaXN0ID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHwgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKC0tdGhpcy5fZXZlbnRzQ291bnQgPT09IDApXG4gICAgICAgICAgdGhpcy5fZXZlbnRzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgZGVsZXRlIGV2ZW50c1t0eXBlXTtcbiAgICAgICAgICBpZiAoZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3QubGlzdGVuZXIgfHwgbGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBsaXN0ICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHBvc2l0aW9uID0gLTE7XG5cbiAgICAgICAgZm9yIChpID0gbGlzdC5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fCBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikge1xuICAgICAgICAgICAgb3JpZ2luYWxMaXN0ZW5lciA9IGxpc3RbaV0ubGlzdGVuZXI7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgICAgIGlmIChwb3NpdGlvbiA9PT0gMClcbiAgICAgICAgICBsaXN0LnNoaWZ0KCk7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHNwbGljZU9uZShsaXN0LCBwb3NpdGlvbik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpXG4gICAgICAgICAgZXZlbnRzW3R5cGVdID0gbGlzdFswXTtcblxuICAgICAgICBpZiAoZXZlbnRzLnJlbW92ZUxpc3RlbmVyICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIG9yaWdpbmFsTGlzdGVuZXIgfHwgbGlzdGVuZXIpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID1cbiAgICBmdW5jdGlvbiByZW1vdmVBbGxMaXN0ZW5lcnModHlwZSkge1xuICAgICAgdmFyIGxpc3RlbmVycywgZXZlbnRzLCBpO1xuXG4gICAgICBldmVudHMgPSB0aGlzLl9ldmVudHM7XG4gICAgICBpZiAoZXZlbnRzID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gICAgICBpZiAoZXZlbnRzLnJlbW92ZUxpc3RlbmVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICB0aGlzLl9ldmVudHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgICAgIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudHNbdHlwZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGlmICgtLXRoaXMuX2V2ZW50c0NvdW50ID09PSAwKVxuICAgICAgICAgICAgdGhpcy5fZXZlbnRzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBkZWxldGUgZXZlbnRzW3R5cGVdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuXG4gICAgICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMoZXZlbnRzKTtcbiAgICAgICAgdmFyIGtleTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICBrZXkgPSBrZXlzW2ldO1xuICAgICAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgICAgIHRoaXMuX2V2ZW50cyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgICAgIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG5cbiAgICAgIGxpc3RlbmVycyA9IGV2ZW50c1t0eXBlXTtcblxuICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lcnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICAgICAgfSBlbHNlIGlmIChsaXN0ZW5lcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBMSUZPIG9yZGVyXG4gICAgICAgIGZvciAoaSA9IGxpc3RlbmVycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG5mdW5jdGlvbiBfbGlzdGVuZXJzKHRhcmdldCwgdHlwZSwgdW53cmFwKSB7XG4gIHZhciBldmVudHMgPSB0YXJnZXQuX2V2ZW50cztcblxuICBpZiAoZXZlbnRzID09PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIFtdO1xuXG4gIHZhciBldmxpc3RlbmVyID0gZXZlbnRzW3R5cGVdO1xuICBpZiAoZXZsaXN0ZW5lciA9PT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiBbXTtcblxuICBpZiAodHlwZW9mIGV2bGlzdGVuZXIgPT09ICdmdW5jdGlvbicpXG4gICAgcmV0dXJuIHVud3JhcCA/IFtldmxpc3RlbmVyLmxpc3RlbmVyIHx8IGV2bGlzdGVuZXJdIDogW2V2bGlzdGVuZXJdO1xuXG4gIHJldHVybiB1bndyYXAgP1xuICAgIHVud3JhcExpc3RlbmVycyhldmxpc3RlbmVyKSA6IGFycmF5Q2xvbmUoZXZsaXN0ZW5lciwgZXZsaXN0ZW5lci5sZW5ndGgpO1xufVxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uIGxpc3RlbmVycyh0eXBlKSB7XG4gIHJldHVybiBfbGlzdGVuZXJzKHRoaXMsIHR5cGUsIHRydWUpO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yYXdMaXN0ZW5lcnMgPSBmdW5jdGlvbiByYXdMaXN0ZW5lcnModHlwZSkge1xuICByZXR1cm4gX2xpc3RlbmVycyh0aGlzLCB0eXBlLCBmYWxzZSk7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgaWYgKHR5cGVvZiBlbWl0dGVyLmxpc3RlbmVyQ291bnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZW1pdHRlci5saXN0ZW5lckNvdW50KHR5cGUpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBsaXN0ZW5lckNvdW50LmNhbGwoZW1pdHRlciwgdHlwZSk7XG4gIH1cbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJDb3VudCA9IGxpc3RlbmVyQ291bnQ7XG5mdW5jdGlvbiBsaXN0ZW5lckNvdW50KHR5cGUpIHtcbiAgdmFyIGV2ZW50cyA9IHRoaXMuX2V2ZW50cztcblxuICBpZiAoZXZlbnRzICE9PSB1bmRlZmluZWQpIHtcbiAgICB2YXIgZXZsaXN0ZW5lciA9IGV2ZW50c1t0eXBlXTtcblxuICAgIGlmICh0eXBlb2YgZXZsaXN0ZW5lciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIDE7XG4gICAgfSBlbHNlIGlmIChldmxpc3RlbmVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBldmxpc3RlbmVyLmxlbmd0aDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gMDtcbn1cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5ldmVudE5hbWVzID0gZnVuY3Rpb24gZXZlbnROYW1lcygpIHtcbiAgcmV0dXJuIHRoaXMuX2V2ZW50c0NvdW50ID4gMCA/IFJlZmxlY3RPd25LZXlzKHRoaXMuX2V2ZW50cykgOiBbXTtcbn07XG5cbmZ1bmN0aW9uIGFycmF5Q2xvbmUoYXJyLCBuKSB7XG4gIHZhciBjb3B5ID0gbmV3IEFycmF5KG4pO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IG47ICsraSlcbiAgICBjb3B5W2ldID0gYXJyW2ldO1xuICByZXR1cm4gY29weTtcbn1cblxuZnVuY3Rpb24gc3BsaWNlT25lKGxpc3QsIGluZGV4KSB7XG4gIGZvciAoOyBpbmRleCArIDEgPCBsaXN0Lmxlbmd0aDsgaW5kZXgrKylcbiAgICBsaXN0W2luZGV4XSA9IGxpc3RbaW5kZXggKyAxXTtcbiAgbGlzdC5wb3AoKTtcbn1cblxuZnVuY3Rpb24gdW53cmFwTGlzdGVuZXJzKGFycikge1xuICB2YXIgcmV0ID0gbmV3IEFycmF5KGFyci5sZW5ndGgpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHJldC5sZW5ndGg7ICsraSkge1xuICAgIHJldFtpXSA9IGFycltpXS5saXN0ZW5lciB8fCBhcnJbaV07XG4gIH1cbiAgcmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gb25jZShlbWl0dGVyLCBuYW1lKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgZnVuY3Rpb24gZXJyb3JMaXN0ZW5lcihlcnIpIHtcbiAgICAgIGVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIobmFtZSwgcmVzb2x2ZXIpO1xuICAgICAgcmVqZWN0KGVycik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVzb2x2ZXIoKSB7XG4gICAgICBpZiAodHlwZW9mIGVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgZW1pdHRlci5yZW1vdmVMaXN0ZW5lcignZXJyb3InLCBlcnJvckxpc3RlbmVyKTtcbiAgICAgIH1cbiAgICAgIHJlc29sdmUoW10uc2xpY2UuY2FsbChhcmd1bWVudHMpKTtcbiAgICB9O1xuXG4gICAgZXZlbnRUYXJnZXRBZ25vc3RpY0FkZExpc3RlbmVyKGVtaXR0ZXIsIG5hbWUsIHJlc29sdmVyLCB7IG9uY2U6IHRydWUgfSk7XG4gICAgaWYgKG5hbWUgIT09ICdlcnJvcicpIHtcbiAgICAgIGFkZEVycm9ySGFuZGxlcklmRXZlbnRFbWl0dGVyKGVtaXR0ZXIsIGVycm9yTGlzdGVuZXIsIHsgb25jZTogdHJ1ZSB9KTtcbiAgICB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBhZGRFcnJvckhhbmRsZXJJZkV2ZW50RW1pdHRlcihlbWl0dGVyLCBoYW5kbGVyLCBmbGFncykge1xuICBpZiAodHlwZW9mIGVtaXR0ZXIub24gPT09ICdmdW5jdGlvbicpIHtcbiAgICBldmVudFRhcmdldEFnbm9zdGljQWRkTGlzdGVuZXIoZW1pdHRlciwgJ2Vycm9yJywgaGFuZGxlciwgZmxhZ3MpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGV2ZW50VGFyZ2V0QWdub3N0aWNBZGRMaXN0ZW5lcihlbWl0dGVyLCBuYW1lLCBsaXN0ZW5lciwgZmxhZ3MpIHtcbiAgaWYgKHR5cGVvZiBlbWl0dGVyLm9uID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaWYgKGZsYWdzLm9uY2UpIHtcbiAgICAgIGVtaXR0ZXIub25jZShuYW1lLCBsaXN0ZW5lcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVtaXR0ZXIub24obmFtZSwgbGlzdGVuZXIpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlb2YgZW1pdHRlci5hZGRFdmVudExpc3RlbmVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gRXZlbnRUYXJnZXQgZG9lcyBub3QgaGF2ZSBgZXJyb3JgIGV2ZW50IHNlbWFudGljcyBsaWtlIE5vZGVcbiAgICAvLyBFdmVudEVtaXR0ZXJzLCB3ZSBkbyBub3QgbGlzdGVuIGZvciBgZXJyb3JgIGV2ZW50cyBoZXJlLlxuICAgIGVtaXR0ZXIuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBmdW5jdGlvbiB3cmFwTGlzdGVuZXIoYXJnKSB7XG4gICAgICAvLyBJRSBkb2VzIG5vdCBoYXZlIGJ1aWx0aW4gYHsgb25jZTogdHJ1ZSB9YCBzdXBwb3J0IHNvIHdlXG4gICAgICAvLyBoYXZlIHRvIGRvIGl0IG1hbnVhbGx5LlxuICAgICAgaWYgKGZsYWdzLm9uY2UpIHtcbiAgICAgICAgZW1pdHRlci5yZW1vdmVFdmVudExpc3RlbmVyKG5hbWUsIHdyYXBMaXN0ZW5lcik7XG4gICAgICB9XG4gICAgICBsaXN0ZW5lcihhcmcpO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBcImVtaXR0ZXJcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgRXZlbnRFbWl0dGVyLiBSZWNlaXZlZCB0eXBlICcgKyB0eXBlb2YgZW1pdHRlcik7XG4gIH1cbn1cbiIsIi8qIVxuICogaXNvYmplY3QgPGh0dHBzOi8vZ2l0aHViLmNvbS9qb25zY2hsaW5rZXJ0L2lzb2JqZWN0PlxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNC0yMDE3LCBKb24gU2NobGlua2VydC5cbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNPYmplY3QodmFsKSB7XG4gIHJldHVybiB2YWwgIT0gbnVsbCAmJiB0eXBlb2YgdmFsID09PSAnb2JqZWN0JyAmJiBBcnJheS5pc0FycmF5KHZhbCkgPT09IGZhbHNlO1xufTtcbiIsInZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ga2luZE9mKHZhbCkge1xuICBpZiAodmFsID09PSB2b2lkIDApIHJldHVybiAndW5kZWZpbmVkJztcbiAgaWYgKHZhbCA9PT0gbnVsbCkgcmV0dXJuICdudWxsJztcblxuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWw7XG4gIGlmICh0eXBlID09PSAnYm9vbGVhbicpIHJldHVybiAnYm9vbGVhbic7XG4gIGlmICh0eXBlID09PSAnc3RyaW5nJykgcmV0dXJuICdzdHJpbmcnO1xuICBpZiAodHlwZSA9PT0gJ251bWJlcicpIHJldHVybiAnbnVtYmVyJztcbiAgaWYgKHR5cGUgPT09ICdzeW1ib2wnKSByZXR1cm4gJ3N5bWJvbCc7XG4gIGlmICh0eXBlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGlzR2VuZXJhdG9yRm4odmFsKSA/ICdnZW5lcmF0b3JmdW5jdGlvbicgOiAnZnVuY3Rpb24nO1xuICB9XG5cbiAgaWYgKGlzQXJyYXkodmFsKSkgcmV0dXJuICdhcnJheSc7XG4gIGlmIChpc0J1ZmZlcih2YWwpKSByZXR1cm4gJ2J1ZmZlcic7XG4gIGlmIChpc0FyZ3VtZW50cyh2YWwpKSByZXR1cm4gJ2FyZ3VtZW50cyc7XG4gIGlmIChpc0RhdGUodmFsKSkgcmV0dXJuICdkYXRlJztcbiAgaWYgKGlzRXJyb3IodmFsKSkgcmV0dXJuICdlcnJvcic7XG4gIGlmIChpc1JlZ2V4cCh2YWwpKSByZXR1cm4gJ3JlZ2V4cCc7XG5cbiAgc3dpdGNoIChjdG9yTmFtZSh2YWwpKSB7XG4gICAgY2FzZSAnU3ltYm9sJzogcmV0dXJuICdzeW1ib2wnO1xuICAgIGNhc2UgJ1Byb21pc2UnOiByZXR1cm4gJ3Byb21pc2UnO1xuXG4gICAgLy8gU2V0LCBNYXAsIFdlYWtTZXQsIFdlYWtNYXBcbiAgICBjYXNlICdXZWFrTWFwJzogcmV0dXJuICd3ZWFrbWFwJztcbiAgICBjYXNlICdXZWFrU2V0JzogcmV0dXJuICd3ZWFrc2V0JztcbiAgICBjYXNlICdNYXAnOiByZXR1cm4gJ21hcCc7XG4gICAgY2FzZSAnU2V0JzogcmV0dXJuICdzZXQnO1xuXG4gICAgLy8gOC1iaXQgdHlwZWQgYXJyYXlzXG4gICAgY2FzZSAnSW50OEFycmF5JzogcmV0dXJuICdpbnQ4YXJyYXknO1xuICAgIGNhc2UgJ1VpbnQ4QXJyYXknOiByZXR1cm4gJ3VpbnQ4YXJyYXknO1xuICAgIGNhc2UgJ1VpbnQ4Q2xhbXBlZEFycmF5JzogcmV0dXJuICd1aW50OGNsYW1wZWRhcnJheSc7XG5cbiAgICAvLyAxNi1iaXQgdHlwZWQgYXJyYXlzXG4gICAgY2FzZSAnSW50MTZBcnJheSc6IHJldHVybiAnaW50MTZhcnJheSc7XG4gICAgY2FzZSAnVWludDE2QXJyYXknOiByZXR1cm4gJ3VpbnQxNmFycmF5JztcblxuICAgIC8vIDMyLWJpdCB0eXBlZCBhcnJheXNcbiAgICBjYXNlICdJbnQzMkFycmF5JzogcmV0dXJuICdpbnQzMmFycmF5JztcbiAgICBjYXNlICdVaW50MzJBcnJheSc6IHJldHVybiAndWludDMyYXJyYXknO1xuICAgIGNhc2UgJ0Zsb2F0MzJBcnJheSc6IHJldHVybiAnZmxvYXQzMmFycmF5JztcbiAgICBjYXNlICdGbG9hdDY0QXJyYXknOiByZXR1cm4gJ2Zsb2F0NjRhcnJheSc7XG4gIH1cblxuICBpZiAoaXNHZW5lcmF0b3JPYmoodmFsKSkge1xuICAgIHJldHVybiAnZ2VuZXJhdG9yJztcbiAgfVxuXG4gIC8vIE5vbi1wbGFpbiBvYmplY3RzXG4gIHR5cGUgPSB0b1N0cmluZy5jYWxsKHZhbCk7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ1tvYmplY3QgT2JqZWN0XSc6IHJldHVybiAnb2JqZWN0JztcbiAgICAvLyBpdGVyYXRvcnNcbiAgICBjYXNlICdbb2JqZWN0IE1hcCBJdGVyYXRvcl0nOiByZXR1cm4gJ21hcGl0ZXJhdG9yJztcbiAgICBjYXNlICdbb2JqZWN0IFNldCBJdGVyYXRvcl0nOiByZXR1cm4gJ3NldGl0ZXJhdG9yJztcbiAgICBjYXNlICdbb2JqZWN0IFN0cmluZyBJdGVyYXRvcl0nOiByZXR1cm4gJ3N0cmluZ2l0ZXJhdG9yJztcbiAgICBjYXNlICdbb2JqZWN0IEFycmF5IEl0ZXJhdG9yXSc6IHJldHVybiAnYXJyYXlpdGVyYXRvcic7XG4gIH1cblxuICAvLyBvdGhlclxuICByZXR1cm4gdHlwZS5zbGljZSg4LCAtMSkudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMvZywgJycpO1xufTtcblxuZnVuY3Rpb24gY3Rvck5hbWUodmFsKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsLmNvbnN0cnVjdG9yID09PSAnZnVuY3Rpb24nID8gdmFsLmNvbnN0cnVjdG9yLm5hbWUgOiBudWxsO1xufVxuXG5mdW5jdGlvbiBpc0FycmF5KHZhbCkge1xuICBpZiAoQXJyYXkuaXNBcnJheSkgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsKTtcbiAgcmV0dXJuIHZhbCBpbnN0YW5jZW9mIEFycmF5O1xufVxuXG5mdW5jdGlvbiBpc0Vycm9yKHZhbCkge1xuICByZXR1cm4gdmFsIGluc3RhbmNlb2YgRXJyb3IgfHwgKHR5cGVvZiB2YWwubWVzc2FnZSA9PT0gJ3N0cmluZycgJiYgdmFsLmNvbnN0cnVjdG9yICYmIHR5cGVvZiB2YWwuY29uc3RydWN0b3Iuc3RhY2tUcmFjZUxpbWl0ID09PSAnbnVtYmVyJyk7XG59XG5cbmZ1bmN0aW9uIGlzRGF0ZSh2YWwpIHtcbiAgaWYgKHZhbCBpbnN0YW5jZW9mIERhdGUpIHJldHVybiB0cnVlO1xuICByZXR1cm4gdHlwZW9mIHZhbC50b0RhdGVTdHJpbmcgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgdmFsLmdldERhdGUgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgdmFsLnNldERhdGUgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzUmVnZXhwKHZhbCkge1xuICBpZiAodmFsIGluc3RhbmNlb2YgUmVnRXhwKSByZXR1cm4gdHJ1ZTtcbiAgcmV0dXJuIHR5cGVvZiB2YWwuZmxhZ3MgPT09ICdzdHJpbmcnXG4gICAgJiYgdHlwZW9mIHZhbC5pZ25vcmVDYXNlID09PSAnYm9vbGVhbidcbiAgICAmJiB0eXBlb2YgdmFsLm11bHRpbGluZSA9PT0gJ2Jvb2xlYW4nXG4gICAgJiYgdHlwZW9mIHZhbC5nbG9iYWwgPT09ICdib29sZWFuJztcbn1cblxuZnVuY3Rpb24gaXNHZW5lcmF0b3JGbihuYW1lLCB2YWwpIHtcbiAgcmV0dXJuIGN0b3JOYW1lKG5hbWUpID09PSAnR2VuZXJhdG9yRnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc0dlbmVyYXRvck9iaih2YWwpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWwudGhyb3cgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgdmFsLnJldHVybiA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiB2YWwubmV4dCA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNBcmd1bWVudHModmFsKSB7XG4gIHRyeSB7XG4gICAgaWYgKHR5cGVvZiB2YWwubGVuZ3RoID09PSAnbnVtYmVyJyAmJiB0eXBlb2YgdmFsLmNhbGxlZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoZXJyLm1lc3NhZ2UuaW5kZXhPZignY2FsbGVlJykgIT09IC0xKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIElmIHlvdSBuZWVkIHRvIHN1cHBvcnQgU2FmYXJpIDUtNyAoOC0xMCB5ci1vbGQgYnJvd3NlciksXG4gKiB0YWtlIGEgbG9vayBhdCBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2lzLWJ1ZmZlclxuICovXG5cbmZ1bmN0aW9uIGlzQnVmZmVyKHZhbCkge1xuICBpZiAodmFsLmNvbnN0cnVjdG9yICYmIHR5cGVvZiB2YWwuY29uc3RydWN0b3IuaXNCdWZmZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gdmFsLmNvbnN0cnVjdG9yLmlzQnVmZmVyKHZhbCk7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuIiwidmFyIHJvb3QgPSByZXF1aXJlKCcuL19yb290Jyk7XG5cbi8qKiBCdWlsdC1pbiB2YWx1ZSByZWZlcmVuY2VzLiAqL1xudmFyIFN5bWJvbCA9IHJvb3QuU3ltYm9sO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN5bWJvbDtcbiIsInZhciBTeW1ib2wgPSByZXF1aXJlKCcuL19TeW1ib2wnKSxcbiAgICBnZXRSYXdUYWcgPSByZXF1aXJlKCcuL19nZXRSYXdUYWcnKSxcbiAgICBvYmplY3RUb1N0cmluZyA9IHJlcXVpcmUoJy4vX29iamVjdFRvU3RyaW5nJyk7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBudWxsVGFnID0gJ1tvYmplY3QgTnVsbF0nLFxuICAgIHVuZGVmaW5lZFRhZyA9ICdbb2JqZWN0IFVuZGVmaW5lZF0nO1xuXG4vKiogQnVpbHQtaW4gdmFsdWUgcmVmZXJlbmNlcy4gKi9cbnZhciBzeW1Ub1N0cmluZ1RhZyA9IFN5bWJvbCA/IFN5bWJvbC50b1N0cmluZ1RhZyA6IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgZ2V0VGFnYCB3aXRob3V0IGZhbGxiYWNrcyBmb3IgYnVnZ3kgZW52aXJvbm1lbnRzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBxdWVyeS5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIGB0b1N0cmluZ1RhZ2AuXG4gKi9cbmZ1bmN0aW9uIGJhc2VHZXRUYWcodmFsdWUpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZFRhZyA6IG51bGxUYWc7XG4gIH1cbiAgcmV0dXJuIChzeW1Ub1N0cmluZ1RhZyAmJiBzeW1Ub1N0cmluZ1RhZyBpbiBPYmplY3QodmFsdWUpKVxuICAgID8gZ2V0UmF3VGFnKHZhbHVlKVxuICAgIDogb2JqZWN0VG9TdHJpbmcodmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VHZXRUYWc7XG4iLCJ2YXIgdHJpbW1lZEVuZEluZGV4ID0gcmVxdWlyZSgnLi9fdHJpbW1lZEVuZEluZGV4Jyk7XG5cbi8qKiBVc2VkIHRvIG1hdGNoIGxlYWRpbmcgd2hpdGVzcGFjZS4gKi9cbnZhciByZVRyaW1TdGFydCA9IC9eXFxzKy87XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8udHJpbWAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgVGhlIHN0cmluZyB0byB0cmltLlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgdHJpbW1lZCBzdHJpbmcuXG4gKi9cbmZ1bmN0aW9uIGJhc2VUcmltKHN0cmluZykge1xuICByZXR1cm4gc3RyaW5nXG4gICAgPyBzdHJpbmcuc2xpY2UoMCwgdHJpbW1lZEVuZEluZGV4KHN0cmluZykgKyAxKS5yZXBsYWNlKHJlVHJpbVN0YXJ0LCAnJylcbiAgICA6IHN0cmluZztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlVHJpbTtcbiIsIi8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgZ2xvYmFsYCBmcm9tIE5vZGUuanMuICovXG52YXIgZnJlZUdsb2JhbCA9IHR5cGVvZiBnbG9iYWwgPT0gJ29iamVjdCcgJiYgZ2xvYmFsICYmIGdsb2JhbC5PYmplY3QgPT09IE9iamVjdCAmJiBnbG9iYWw7XG5cbm1vZHVsZS5leHBvcnRzID0gZnJlZUdsb2JhbDtcbiIsInZhciBTeW1ib2wgPSByZXF1aXJlKCcuL19TeW1ib2wnKTtcblxuLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlXG4gKiBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNy4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAqIG9mIHZhbHVlcy5cbiAqL1xudmFyIG5hdGl2ZU9iamVjdFRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbi8qKiBCdWlsdC1pbiB2YWx1ZSByZWZlcmVuY2VzLiAqL1xudmFyIHN5bVRvU3RyaW5nVGFnID0gU3ltYm9sID8gU3ltYm9sLnRvU3RyaW5nVGFnIDogdW5kZWZpbmVkO1xuXG4vKipcbiAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgYmFzZUdldFRhZ2Agd2hpY2ggaWdub3JlcyBgU3ltYm9sLnRvU3RyaW5nVGFnYCB2YWx1ZXMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHF1ZXJ5LlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgcmF3IGB0b1N0cmluZ1RhZ2AuXG4gKi9cbmZ1bmN0aW9uIGdldFJhd1RhZyh2YWx1ZSkge1xuICB2YXIgaXNPd24gPSBoYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCBzeW1Ub1N0cmluZ1RhZyksXG4gICAgICB0YWcgPSB2YWx1ZVtzeW1Ub1N0cmluZ1RhZ107XG5cbiAgdHJ5IHtcbiAgICB2YWx1ZVtzeW1Ub1N0cmluZ1RhZ10gPSB1bmRlZmluZWQ7XG4gICAgdmFyIHVubWFza2VkID0gdHJ1ZTtcbiAgfSBjYXRjaCAoZSkge31cblxuICB2YXIgcmVzdWx0ID0gbmF0aXZlT2JqZWN0VG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIGlmICh1bm1hc2tlZCkge1xuICAgIGlmIChpc093bikge1xuICAgICAgdmFsdWVbc3ltVG9TdHJpbmdUYWddID0gdGFnO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWxldGUgdmFsdWVbc3ltVG9TdHJpbmdUYWddO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdldFJhd1RhZztcbiIsIi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHRoZVxuICogW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzcuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBuYXRpdmVPYmplY3RUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYSBzdHJpbmcgdXNpbmcgYE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmdgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjb252ZXJ0LlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgY29udmVydGVkIHN0cmluZy5cbiAqL1xuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcodmFsdWUpIHtcbiAgcmV0dXJuIG5hdGl2ZU9iamVjdFRvU3RyaW5nLmNhbGwodmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG9iamVjdFRvU3RyaW5nO1xuIiwidmFyIGZyZWVHbG9iYWwgPSByZXF1aXJlKCcuL19mcmVlR2xvYmFsJyk7XG5cbi8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgc2VsZmAuICovXG52YXIgZnJlZVNlbGYgPSB0eXBlb2Ygc2VsZiA9PSAnb2JqZWN0JyAmJiBzZWxmICYmIHNlbGYuT2JqZWN0ID09PSBPYmplY3QgJiYgc2VsZjtcblxuLyoqIFVzZWQgYXMgYSByZWZlcmVuY2UgdG8gdGhlIGdsb2JhbCBvYmplY3QuICovXG52YXIgcm9vdCA9IGZyZWVHbG9iYWwgfHwgZnJlZVNlbGYgfHwgRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcblxubW9kdWxlLmV4cG9ydHMgPSByb290O1xuIiwiLyoqIFVzZWQgdG8gbWF0Y2ggYSBzaW5nbGUgd2hpdGVzcGFjZSBjaGFyYWN0ZXIuICovXG52YXIgcmVXaGl0ZXNwYWNlID0gL1xccy87XG5cbi8qKlxuICogVXNlZCBieSBgXy50cmltYCBhbmQgYF8udHJpbUVuZGAgdG8gZ2V0IHRoZSBpbmRleCBvZiB0aGUgbGFzdCBub24td2hpdGVzcGFjZVxuICogY2hhcmFjdGVyIG9mIGBzdHJpbmdgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFRoZSBzdHJpbmcgdG8gaW5zcGVjdC5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIGluZGV4IG9mIHRoZSBsYXN0IG5vbi13aGl0ZXNwYWNlIGNoYXJhY3Rlci5cbiAqL1xuZnVuY3Rpb24gdHJpbW1lZEVuZEluZGV4KHN0cmluZykge1xuICB2YXIgaW5kZXggPSBzdHJpbmcubGVuZ3RoO1xuXG4gIHdoaWxlIChpbmRleC0tICYmIHJlV2hpdGVzcGFjZS50ZXN0KHN0cmluZy5jaGFyQXQoaW5kZXgpKSkge31cbiAgcmV0dXJuIGluZGV4O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRyaW1tZWRFbmRJbmRleDtcbiIsInZhciBpc09iamVjdCA9IHJlcXVpcmUoJy4vaXNPYmplY3QnKSxcbiAgICBub3cgPSByZXF1aXJlKCcuL25vdycpLFxuICAgIHRvTnVtYmVyID0gcmVxdWlyZSgnLi90b051bWJlcicpO1xuXG4vKiogRXJyb3IgbWVzc2FnZSBjb25zdGFudHMuICovXG52YXIgRlVOQ19FUlJPUl9URVhUID0gJ0V4cGVjdGVkIGEgZnVuY3Rpb24nO1xuXG4vKiBCdWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcyBmb3IgdGhvc2Ugd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMuICovXG52YXIgbmF0aXZlTWF4ID0gTWF0aC5tYXgsXG4gICAgbmF0aXZlTWluID0gTWF0aC5taW47XG5cbi8qKlxuICogQ3JlYXRlcyBhIGRlYm91bmNlZCBmdW5jdGlvbiB0aGF0IGRlbGF5cyBpbnZva2luZyBgZnVuY2AgdW50aWwgYWZ0ZXIgYHdhaXRgXG4gKiBtaWxsaXNlY29uZHMgaGF2ZSBlbGFwc2VkIHNpbmNlIHRoZSBsYXN0IHRpbWUgdGhlIGRlYm91bmNlZCBmdW5jdGlvbiB3YXNcbiAqIGludm9rZWQuIFRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gY29tZXMgd2l0aCBhIGBjYW5jZWxgIG1ldGhvZCB0byBjYW5jZWxcbiAqIGRlbGF5ZWQgYGZ1bmNgIGludm9jYXRpb25zIGFuZCBhIGBmbHVzaGAgbWV0aG9kIHRvIGltbWVkaWF0ZWx5IGludm9rZSB0aGVtLlxuICogUHJvdmlkZSBgb3B0aW9uc2AgdG8gaW5kaWNhdGUgd2hldGhlciBgZnVuY2Agc2hvdWxkIGJlIGludm9rZWQgb24gdGhlXG4gKiBsZWFkaW5nIGFuZC9vciB0cmFpbGluZyBlZGdlIG9mIHRoZSBgd2FpdGAgdGltZW91dC4gVGhlIGBmdW5jYCBpcyBpbnZva2VkXG4gKiB3aXRoIHRoZSBsYXN0IGFyZ3VtZW50cyBwcm92aWRlZCB0byB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uLiBTdWJzZXF1ZW50XG4gKiBjYWxscyB0byB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uIHJldHVybiB0aGUgcmVzdWx0IG9mIHRoZSBsYXN0IGBmdW5jYFxuICogaW52b2NhdGlvbi5cbiAqXG4gKiAqKk5vdGU6KiogSWYgYGxlYWRpbmdgIGFuZCBgdHJhaWxpbmdgIG9wdGlvbnMgYXJlIGB0cnVlYCwgYGZ1bmNgIGlzXG4gKiBpbnZva2VkIG9uIHRoZSB0cmFpbGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0IG9ubHkgaWYgdGhlIGRlYm91bmNlZCBmdW5jdGlvblxuICogaXMgaW52b2tlZCBtb3JlIHRoYW4gb25jZSBkdXJpbmcgdGhlIGB3YWl0YCB0aW1lb3V0LlxuICpcbiAqIElmIGB3YWl0YCBpcyBgMGAgYW5kIGBsZWFkaW5nYCBpcyBgZmFsc2VgLCBgZnVuY2AgaW52b2NhdGlvbiBpcyBkZWZlcnJlZFxuICogdW50aWwgdG8gdGhlIG5leHQgdGljaywgc2ltaWxhciB0byBgc2V0VGltZW91dGAgd2l0aCBhIHRpbWVvdXQgb2YgYDBgLlxuICpcbiAqIFNlZSBbRGF2aWQgQ29yYmFjaG8ncyBhcnRpY2xlXShodHRwczovL2Nzcy10cmlja3MuY29tL2RlYm91bmNpbmctdGhyb3R0bGluZy1leHBsYWluZWQtZXhhbXBsZXMvKVxuICogZm9yIGRldGFpbHMgb3ZlciB0aGUgZGlmZmVyZW5jZXMgYmV0d2VlbiBgXy5kZWJvdW5jZWAgYW5kIGBfLnRocm90dGxlYC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGRlYm91bmNlLlxuICogQHBhcmFtIHtudW1iZXJ9IFt3YWl0PTBdIFRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIGRlbGF5LlxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XSBUaGUgb3B0aW9ucyBvYmplY3QuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmxlYWRpbmc9ZmFsc2VdXG4gKiAgU3BlY2lmeSBpbnZva2luZyBvbiB0aGUgbGVhZGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLm1heFdhaXRdXG4gKiAgVGhlIG1heGltdW0gdGltZSBgZnVuY2AgaXMgYWxsb3dlZCB0byBiZSBkZWxheWVkIGJlZm9yZSBpdCdzIGludm9rZWQuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnRyYWlsaW5nPXRydWVdXG4gKiAgU3BlY2lmeSBpbnZva2luZyBvbiB0aGUgdHJhaWxpbmcgZWRnZSBvZiB0aGUgdGltZW91dC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGRlYm91bmNlZCBmdW5jdGlvbi5cbiAqIEBleGFtcGxlXG4gKlxuICogLy8gQXZvaWQgY29zdGx5IGNhbGN1bGF0aW9ucyB3aGlsZSB0aGUgd2luZG93IHNpemUgaXMgaW4gZmx1eC5cbiAqIGpRdWVyeSh3aW5kb3cpLm9uKCdyZXNpemUnLCBfLmRlYm91bmNlKGNhbGN1bGF0ZUxheW91dCwgMTUwKSk7XG4gKlxuICogLy8gSW52b2tlIGBzZW5kTWFpbGAgd2hlbiBjbGlja2VkLCBkZWJvdW5jaW5nIHN1YnNlcXVlbnQgY2FsbHMuXG4gKiBqUXVlcnkoZWxlbWVudCkub24oJ2NsaWNrJywgXy5kZWJvdW5jZShzZW5kTWFpbCwgMzAwLCB7XG4gKiAgICdsZWFkaW5nJzogdHJ1ZSxcbiAqICAgJ3RyYWlsaW5nJzogZmFsc2VcbiAqIH0pKTtcbiAqXG4gKiAvLyBFbnN1cmUgYGJhdGNoTG9nYCBpcyBpbnZva2VkIG9uY2UgYWZ0ZXIgMSBzZWNvbmQgb2YgZGVib3VuY2VkIGNhbGxzLlxuICogdmFyIGRlYm91bmNlZCA9IF8uZGVib3VuY2UoYmF0Y2hMb2csIDI1MCwgeyAnbWF4V2FpdCc6IDEwMDAgfSk7XG4gKiB2YXIgc291cmNlID0gbmV3IEV2ZW50U291cmNlKCcvc3RyZWFtJyk7XG4gKiBqUXVlcnkoc291cmNlKS5vbignbWVzc2FnZScsIGRlYm91bmNlZCk7XG4gKlxuICogLy8gQ2FuY2VsIHRoZSB0cmFpbGluZyBkZWJvdW5jZWQgaW52b2NhdGlvbi5cbiAqIGpRdWVyeSh3aW5kb3cpLm9uKCdwb3BzdGF0ZScsIGRlYm91bmNlZC5jYW5jZWwpO1xuICovXG5mdW5jdGlvbiBkZWJvdW5jZShmdW5jLCB3YWl0LCBvcHRpb25zKSB7XG4gIHZhciBsYXN0QXJncyxcbiAgICAgIGxhc3RUaGlzLFxuICAgICAgbWF4V2FpdCxcbiAgICAgIHJlc3VsdCxcbiAgICAgIHRpbWVySWQsXG4gICAgICBsYXN0Q2FsbFRpbWUsXG4gICAgICBsYXN0SW52b2tlVGltZSA9IDAsXG4gICAgICBsZWFkaW5nID0gZmFsc2UsXG4gICAgICBtYXhpbmcgPSBmYWxzZSxcbiAgICAgIHRyYWlsaW5nID0gdHJ1ZTtcblxuICBpZiAodHlwZW9mIGZ1bmMgIT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoRlVOQ19FUlJPUl9URVhUKTtcbiAgfVxuICB3YWl0ID0gdG9OdW1iZXIod2FpdCkgfHwgMDtcbiAgaWYgKGlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgbGVhZGluZyA9ICEhb3B0aW9ucy5sZWFkaW5nO1xuICAgIG1heGluZyA9ICdtYXhXYWl0JyBpbiBvcHRpb25zO1xuICAgIG1heFdhaXQgPSBtYXhpbmcgPyBuYXRpdmVNYXgodG9OdW1iZXIob3B0aW9ucy5tYXhXYWl0KSB8fCAwLCB3YWl0KSA6IG1heFdhaXQ7XG4gICAgdHJhaWxpbmcgPSAndHJhaWxpbmcnIGluIG9wdGlvbnMgPyAhIW9wdGlvbnMudHJhaWxpbmcgOiB0cmFpbGluZztcbiAgfVxuXG4gIGZ1bmN0aW9uIGludm9rZUZ1bmModGltZSkge1xuICAgIHZhciBhcmdzID0gbGFzdEFyZ3MsXG4gICAgICAgIHRoaXNBcmcgPSBsYXN0VGhpcztcblxuICAgIGxhc3RBcmdzID0gbGFzdFRoaXMgPSB1bmRlZmluZWQ7XG4gICAgbGFzdEludm9rZVRpbWUgPSB0aW1lO1xuICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpc0FyZywgYXJncyk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGxlYWRpbmdFZGdlKHRpbWUpIHtcbiAgICAvLyBSZXNldCBhbnkgYG1heFdhaXRgIHRpbWVyLlxuICAgIGxhc3RJbnZva2VUaW1lID0gdGltZTtcbiAgICAvLyBTdGFydCB0aGUgdGltZXIgZm9yIHRoZSB0cmFpbGluZyBlZGdlLlxuICAgIHRpbWVySWQgPSBzZXRUaW1lb3V0KHRpbWVyRXhwaXJlZCwgd2FpdCk7XG4gICAgLy8gSW52b2tlIHRoZSBsZWFkaW5nIGVkZ2UuXG4gICAgcmV0dXJuIGxlYWRpbmcgPyBpbnZva2VGdW5jKHRpbWUpIDogcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtYWluaW5nV2FpdCh0aW1lKSB7XG4gICAgdmFyIHRpbWVTaW5jZUxhc3RDYWxsID0gdGltZSAtIGxhc3RDYWxsVGltZSxcbiAgICAgICAgdGltZVNpbmNlTGFzdEludm9rZSA9IHRpbWUgLSBsYXN0SW52b2tlVGltZSxcbiAgICAgICAgdGltZVdhaXRpbmcgPSB3YWl0IC0gdGltZVNpbmNlTGFzdENhbGw7XG5cbiAgICByZXR1cm4gbWF4aW5nXG4gICAgICA/IG5hdGl2ZU1pbih0aW1lV2FpdGluZywgbWF4V2FpdCAtIHRpbWVTaW5jZUxhc3RJbnZva2UpXG4gICAgICA6IHRpbWVXYWl0aW5nO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvdWxkSW52b2tlKHRpbWUpIHtcbiAgICB2YXIgdGltZVNpbmNlTGFzdENhbGwgPSB0aW1lIC0gbGFzdENhbGxUaW1lLFxuICAgICAgICB0aW1lU2luY2VMYXN0SW52b2tlID0gdGltZSAtIGxhc3RJbnZva2VUaW1lO1xuXG4gICAgLy8gRWl0aGVyIHRoaXMgaXMgdGhlIGZpcnN0IGNhbGwsIGFjdGl2aXR5IGhhcyBzdG9wcGVkIGFuZCB3ZSdyZSBhdCB0aGVcbiAgICAvLyB0cmFpbGluZyBlZGdlLCB0aGUgc3lzdGVtIHRpbWUgaGFzIGdvbmUgYmFja3dhcmRzIGFuZCB3ZSdyZSB0cmVhdGluZ1xuICAgIC8vIGl0IGFzIHRoZSB0cmFpbGluZyBlZGdlLCBvciB3ZSd2ZSBoaXQgdGhlIGBtYXhXYWl0YCBsaW1pdC5cbiAgICByZXR1cm4gKGxhc3RDYWxsVGltZSA9PT0gdW5kZWZpbmVkIHx8ICh0aW1lU2luY2VMYXN0Q2FsbCA+PSB3YWl0KSB8fFxuICAgICAgKHRpbWVTaW5jZUxhc3RDYWxsIDwgMCkgfHwgKG1heGluZyAmJiB0aW1lU2luY2VMYXN0SW52b2tlID49IG1heFdhaXQpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRpbWVyRXhwaXJlZCgpIHtcbiAgICB2YXIgdGltZSA9IG5vdygpO1xuICAgIGlmIChzaG91bGRJbnZva2UodGltZSkpIHtcbiAgICAgIHJldHVybiB0cmFpbGluZ0VkZ2UodGltZSk7XG4gICAgfVxuICAgIC8vIFJlc3RhcnQgdGhlIHRpbWVyLlxuICAgIHRpbWVySWQgPSBzZXRUaW1lb3V0KHRpbWVyRXhwaXJlZCwgcmVtYWluaW5nV2FpdCh0aW1lKSk7XG4gIH1cblxuICBmdW5jdGlvbiB0cmFpbGluZ0VkZ2UodGltZSkge1xuICAgIHRpbWVySWQgPSB1bmRlZmluZWQ7XG5cbiAgICAvLyBPbmx5IGludm9rZSBpZiB3ZSBoYXZlIGBsYXN0QXJnc2Agd2hpY2ggbWVhbnMgYGZ1bmNgIGhhcyBiZWVuXG4gICAgLy8gZGVib3VuY2VkIGF0IGxlYXN0IG9uY2UuXG4gICAgaWYgKHRyYWlsaW5nICYmIGxhc3RBcmdzKSB7XG4gICAgICByZXR1cm4gaW52b2tlRnVuYyh0aW1lKTtcbiAgICB9XG4gICAgbGFzdEFyZ3MgPSBsYXN0VGhpcyA9IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gY2FuY2VsKCkge1xuICAgIGlmICh0aW1lcklkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lcklkKTtcbiAgICB9XG4gICAgbGFzdEludm9rZVRpbWUgPSAwO1xuICAgIGxhc3RBcmdzID0gbGFzdENhbGxUaW1lID0gbGFzdFRoaXMgPSB0aW1lcklkID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgZnVuY3Rpb24gZmx1c2goKSB7XG4gICAgcmV0dXJuIHRpbWVySWQgPT09IHVuZGVmaW5lZCA/IHJlc3VsdCA6IHRyYWlsaW5nRWRnZShub3coKSk7XG4gIH1cblxuICBmdW5jdGlvbiBkZWJvdW5jZWQoKSB7XG4gICAgdmFyIHRpbWUgPSBub3coKSxcbiAgICAgICAgaXNJbnZva2luZyA9IHNob3VsZEludm9rZSh0aW1lKTtcblxuICAgIGxhc3RBcmdzID0gYXJndW1lbnRzO1xuICAgIGxhc3RUaGlzID0gdGhpcztcbiAgICBsYXN0Q2FsbFRpbWUgPSB0aW1lO1xuXG4gICAgaWYgKGlzSW52b2tpbmcpIHtcbiAgICAgIGlmICh0aW1lcklkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGxlYWRpbmdFZGdlKGxhc3RDYWxsVGltZSk7XG4gICAgICB9XG4gICAgICBpZiAobWF4aW5nKSB7XG4gICAgICAgIC8vIEhhbmRsZSBpbnZvY2F0aW9ucyBpbiBhIHRpZ2h0IGxvb3AuXG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lcklkKTtcbiAgICAgICAgdGltZXJJZCA9IHNldFRpbWVvdXQodGltZXJFeHBpcmVkLCB3YWl0KTtcbiAgICAgICAgcmV0dXJuIGludm9rZUZ1bmMobGFzdENhbGxUaW1lKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRpbWVySWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGltZXJJZCA9IHNldFRpbWVvdXQodGltZXJFeHBpcmVkLCB3YWl0KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBkZWJvdW5jZWQuY2FuY2VsID0gY2FuY2VsO1xuICBkZWJvdW5jZWQuZmx1c2ggPSBmbHVzaDtcbiAgcmV0dXJuIGRlYm91bmNlZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBkZWJvdW5jZTtcbiIsIi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgdGhlXG4gKiBbbGFuZ3VhZ2UgdHlwZV0oaHR0cDovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzcuMC8jc2VjLWVjbWFzY3JpcHQtbGFuZ3VhZ2UtdHlwZXMpXG4gKiBvZiBgT2JqZWN0YC4gKGUuZy4gYXJyYXlzLCBmdW5jdGlvbnMsIG9iamVjdHMsIHJlZ2V4ZXMsIGBuZXcgTnVtYmVyKDApYCwgYW5kIGBuZXcgU3RyaW5nKCcnKWApXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYW4gb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNPYmplY3Qoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KF8ubm9vcCk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChudWxsKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xuICByZXR1cm4gdmFsdWUgIT0gbnVsbCAmJiAodHlwZSA9PSAnb2JqZWN0JyB8fCB0eXBlID09ICdmdW5jdGlvbicpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzT2JqZWN0O1xuIiwiLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZS4gQSB2YWx1ZSBpcyBvYmplY3QtbGlrZSBpZiBpdCdzIG5vdCBgbnVsbGBcbiAqIGFuZCBoYXMgYSBgdHlwZW9mYCByZXN1bHQgb2YgXCJvYmplY3RcIi5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZSwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZSh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdExpa2UoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShfLm5vb3ApO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShudWxsKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0TGlrZSh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgIT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNPYmplY3RMaWtlO1xuIiwidmFyIGJhc2VHZXRUYWcgPSByZXF1aXJlKCcuL19iYXNlR2V0VGFnJyksXG4gICAgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi9pc09iamVjdExpa2UnKTtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIHN5bWJvbFRhZyA9ICdbb2JqZWN0IFN5bWJvbF0nO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYSBgU3ltYm9sYCBwcmltaXRpdmUgb3Igb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgc3ltYm9sLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNTeW1ib2woU3ltYm9sLml0ZXJhdG9yKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzU3ltYm9sKCdhYmMnKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzU3ltYm9sKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ3N5bWJvbCcgfHxcbiAgICAoaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBiYXNlR2V0VGFnKHZhbHVlKSA9PSBzeW1ib2xUYWcpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzU3ltYm9sO1xuIiwidmFyIHJvb3QgPSByZXF1aXJlKCcuL19yb290Jyk7XG5cbi8qKlxuICogR2V0cyB0aGUgdGltZXN0YW1wIG9mIHRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRoYXQgaGF2ZSBlbGFwc2VkIHNpbmNlXG4gKiB0aGUgVW5peCBlcG9jaCAoMSBKYW51YXJ5IDE5NzAgMDA6MDA6MDAgVVRDKS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDIuNC4wXG4gKiBAY2F0ZWdvcnkgRGF0ZVxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgdGltZXN0YW1wLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmRlZmVyKGZ1bmN0aW9uKHN0YW1wKSB7XG4gKiAgIGNvbnNvbGUubG9nKF8ubm93KCkgLSBzdGFtcCk7XG4gKiB9LCBfLm5vdygpKTtcbiAqIC8vID0+IExvZ3MgdGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgaXQgdG9vayBmb3IgdGhlIGRlZmVycmVkIGludm9jYXRpb24uXG4gKi9cbnZhciBub3cgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHJvb3QuRGF0ZS5ub3coKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gbm93O1xuIiwidmFyIGJhc2VUcmltID0gcmVxdWlyZSgnLi9fYmFzZVRyaW0nKSxcbiAgICBpc09iamVjdCA9IHJlcXVpcmUoJy4vaXNPYmplY3QnKSxcbiAgICBpc1N5bWJvbCA9IHJlcXVpcmUoJy4vaXNTeW1ib2wnKTtcblxuLyoqIFVzZWQgYXMgcmVmZXJlbmNlcyBmb3IgdmFyaW91cyBgTnVtYmVyYCBjb25zdGFudHMuICovXG52YXIgTkFOID0gMCAvIDA7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBiYWQgc2lnbmVkIGhleGFkZWNpbWFsIHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc0JhZEhleCA9IC9eWy0rXTB4WzAtOWEtZl0rJC9pO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgYmluYXJ5IHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc0JpbmFyeSA9IC9eMGJbMDFdKyQvaTtcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IG9jdGFsIHN0cmluZyB2YWx1ZXMuICovXG52YXIgcmVJc09jdGFsID0gL14wb1swLTddKyQvaTtcblxuLyoqIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIHdpdGhvdXQgYSBkZXBlbmRlbmN5IG9uIGByb290YC4gKi9cbnZhciBmcmVlUGFyc2VJbnQgPSBwYXJzZUludDtcblxuLyoqXG4gKiBDb252ZXJ0cyBgdmFsdWVgIHRvIGEgbnVtYmVyLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBwcm9jZXNzLlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgbnVtYmVyLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLnRvTnVtYmVyKDMuMik7XG4gKiAvLyA9PiAzLjJcbiAqXG4gKiBfLnRvTnVtYmVyKE51bWJlci5NSU5fVkFMVUUpO1xuICogLy8gPT4gNWUtMzI0XG4gKlxuICogXy50b051bWJlcihJbmZpbml0eSk7XG4gKiAvLyA9PiBJbmZpbml0eVxuICpcbiAqIF8udG9OdW1iZXIoJzMuMicpO1xuICogLy8gPT4gMy4yXG4gKi9cbmZ1bmN0aW9uIHRvTnVtYmVyKHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgaWYgKGlzU3ltYm9sKHZhbHVlKSkge1xuICAgIHJldHVybiBOQU47XG4gIH1cbiAgaWYgKGlzT2JqZWN0KHZhbHVlKSkge1xuICAgIHZhciBvdGhlciA9IHR5cGVvZiB2YWx1ZS52YWx1ZU9mID09ICdmdW5jdGlvbicgPyB2YWx1ZS52YWx1ZU9mKCkgOiB2YWx1ZTtcbiAgICB2YWx1ZSA9IGlzT2JqZWN0KG90aGVyKSA/IChvdGhlciArICcnKSA6IG90aGVyO1xuICB9XG4gIGlmICh0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09IDAgPyB2YWx1ZSA6ICt2YWx1ZTtcbiAgfVxuICB2YWx1ZSA9IGJhc2VUcmltKHZhbHVlKTtcbiAgdmFyIGlzQmluYXJ5ID0gcmVJc0JpbmFyeS50ZXN0KHZhbHVlKTtcbiAgcmV0dXJuIChpc0JpbmFyeSB8fCByZUlzT2N0YWwudGVzdCh2YWx1ZSkpXG4gICAgPyBmcmVlUGFyc2VJbnQodmFsdWUuc2xpY2UoMiksIGlzQmluYXJ5ID8gMiA6IDgpXG4gICAgOiAocmVJc0JhZEhleC50ZXN0KHZhbHVlKSA/IE5BTiA6ICt2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdG9OdW1iZXI7XG4iLCIvLyAncGF0aCcgbW9kdWxlIGV4dHJhY3RlZCBmcm9tIE5vZGUuanMgdjguMTEuMSAob25seSB0aGUgcG9zaXggcGFydClcbi8vIHRyYW5zcGxpdGVkIHdpdGggQmFiZWxcblxuLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gYXNzZXJ0UGF0aChwYXRoKSB7XG4gIGlmICh0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdQYXRoIG11c3QgYmUgYSBzdHJpbmcuIFJlY2VpdmVkICcgKyBKU09OLnN0cmluZ2lmeShwYXRoKSk7XG4gIH1cbn1cblxuLy8gUmVzb2x2ZXMgLiBhbmQgLi4gZWxlbWVudHMgaW4gYSBwYXRoIHdpdGggZGlyZWN0b3J5IG5hbWVzXG5mdW5jdGlvbiBub3JtYWxpemVTdHJpbmdQb3NpeChwYXRoLCBhbGxvd0Fib3ZlUm9vdCkge1xuICB2YXIgcmVzID0gJyc7XG4gIHZhciBsYXN0U2VnbWVudExlbmd0aCA9IDA7XG4gIHZhciBsYXN0U2xhc2ggPSAtMTtcbiAgdmFyIGRvdHMgPSAwO1xuICB2YXIgY29kZTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPD0gcGF0aC5sZW5ndGg7ICsraSkge1xuICAgIGlmIChpIDwgcGF0aC5sZW5ndGgpXG4gICAgICBjb2RlID0gcGF0aC5jaGFyQ29kZUF0KGkpO1xuICAgIGVsc2UgaWYgKGNvZGUgPT09IDQ3IC8qLyovKVxuICAgICAgYnJlYWs7XG4gICAgZWxzZVxuICAgICAgY29kZSA9IDQ3IC8qLyovO1xuICAgIGlmIChjb2RlID09PSA0NyAvKi8qLykge1xuICAgICAgaWYgKGxhc3RTbGFzaCA9PT0gaSAtIDEgfHwgZG90cyA9PT0gMSkge1xuICAgICAgICAvLyBOT09QXG4gICAgICB9IGVsc2UgaWYgKGxhc3RTbGFzaCAhPT0gaSAtIDEgJiYgZG90cyA9PT0gMikge1xuICAgICAgICBpZiAocmVzLmxlbmd0aCA8IDIgfHwgbGFzdFNlZ21lbnRMZW5ndGggIT09IDIgfHwgcmVzLmNoYXJDb2RlQXQocmVzLmxlbmd0aCAtIDEpICE9PSA0NiAvKi4qLyB8fCByZXMuY2hhckNvZGVBdChyZXMubGVuZ3RoIC0gMikgIT09IDQ2IC8qLiovKSB7XG4gICAgICAgICAgaWYgKHJlcy5sZW5ndGggPiAyKSB7XG4gICAgICAgICAgICB2YXIgbGFzdFNsYXNoSW5kZXggPSByZXMubGFzdEluZGV4T2YoJy8nKTtcbiAgICAgICAgICAgIGlmIChsYXN0U2xhc2hJbmRleCAhPT0gcmVzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgaWYgKGxhc3RTbGFzaEluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHJlcyA9ICcnO1xuICAgICAgICAgICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoID0gMDtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXMgPSByZXMuc2xpY2UoMCwgbGFzdFNsYXNoSW5kZXgpO1xuICAgICAgICAgICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoID0gcmVzLmxlbmd0aCAtIDEgLSByZXMubGFzdEluZGV4T2YoJy8nKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBsYXN0U2xhc2ggPSBpO1xuICAgICAgICAgICAgICBkb3RzID0gMDtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChyZXMubGVuZ3RoID09PSAyIHx8IHJlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHJlcyA9ICcnO1xuICAgICAgICAgICAgbGFzdFNlZ21lbnRMZW5ndGggPSAwO1xuICAgICAgICAgICAgbGFzdFNsYXNoID0gaTtcbiAgICAgICAgICAgIGRvdHMgPSAwO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChhbGxvd0Fib3ZlUm9vdCkge1xuICAgICAgICAgIGlmIChyZXMubGVuZ3RoID4gMClcbiAgICAgICAgICAgIHJlcyArPSAnLy4uJztcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXMgPSAnLi4nO1xuICAgICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoID0gMjtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHJlcy5sZW5ndGggPiAwKVxuICAgICAgICAgIHJlcyArPSAnLycgKyBwYXRoLnNsaWNlKGxhc3RTbGFzaCArIDEsIGkpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmVzID0gcGF0aC5zbGljZShsYXN0U2xhc2ggKyAxLCBpKTtcbiAgICAgICAgbGFzdFNlZ21lbnRMZW5ndGggPSBpIC0gbGFzdFNsYXNoIC0gMTtcbiAgICAgIH1cbiAgICAgIGxhc3RTbGFzaCA9IGk7XG4gICAgICBkb3RzID0gMDtcbiAgICB9IGVsc2UgaWYgKGNvZGUgPT09IDQ2IC8qLiovICYmIGRvdHMgIT09IC0xKSB7XG4gICAgICArK2RvdHM7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRvdHMgPSAtMTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlcztcbn1cblxuZnVuY3Rpb24gX2Zvcm1hdChzZXAsIHBhdGhPYmplY3QpIHtcbiAgdmFyIGRpciA9IHBhdGhPYmplY3QuZGlyIHx8IHBhdGhPYmplY3Qucm9vdDtcbiAgdmFyIGJhc2UgPSBwYXRoT2JqZWN0LmJhc2UgfHwgKHBhdGhPYmplY3QubmFtZSB8fCAnJykgKyAocGF0aE9iamVjdC5leHQgfHwgJycpO1xuICBpZiAoIWRpcikge1xuICAgIHJldHVybiBiYXNlO1xuICB9XG4gIGlmIChkaXIgPT09IHBhdGhPYmplY3Qucm9vdCkge1xuICAgIHJldHVybiBkaXIgKyBiYXNlO1xuICB9XG4gIHJldHVybiBkaXIgKyBzZXAgKyBiYXNlO1xufVxuXG52YXIgcG9zaXggPSB7XG4gIC8vIHBhdGgucmVzb2x2ZShbZnJvbSAuLi5dLCB0bylcbiAgcmVzb2x2ZTogZnVuY3Rpb24gcmVzb2x2ZSgpIHtcbiAgICB2YXIgcmVzb2x2ZWRQYXRoID0gJyc7XG4gICAgdmFyIHJlc29sdmVkQWJzb2x1dGUgPSBmYWxzZTtcbiAgICB2YXIgY3dkO1xuXG4gICAgZm9yICh2YXIgaSA9IGFyZ3VtZW50cy5sZW5ndGggLSAxOyBpID49IC0xICYmICFyZXNvbHZlZEFic29sdXRlOyBpLS0pIHtcbiAgICAgIHZhciBwYXRoO1xuICAgICAgaWYgKGkgPj0gMClcbiAgICAgICAgcGF0aCA9IGFyZ3VtZW50c1tpXTtcbiAgICAgIGVsc2Uge1xuICAgICAgICBpZiAoY3dkID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgY3dkID0gcHJvY2Vzcy5jd2QoKTtcbiAgICAgICAgcGF0aCA9IGN3ZDtcbiAgICAgIH1cblxuICAgICAgYXNzZXJ0UGF0aChwYXRoKTtcblxuICAgICAgLy8gU2tpcCBlbXB0eSBlbnRyaWVzXG4gICAgICBpZiAocGF0aC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIHJlc29sdmVkUGF0aCA9IHBhdGggKyAnLycgKyByZXNvbHZlZFBhdGg7XG4gICAgICByZXNvbHZlZEFic29sdXRlID0gcGF0aC5jaGFyQ29kZUF0KDApID09PSA0NyAvKi8qLztcbiAgICB9XG5cbiAgICAvLyBBdCB0aGlzIHBvaW50IHRoZSBwYXRoIHNob3VsZCBiZSByZXNvbHZlZCB0byBhIGZ1bGwgYWJzb2x1dGUgcGF0aCwgYnV0XG4gICAgLy8gaGFuZGxlIHJlbGF0aXZlIHBhdGhzIHRvIGJlIHNhZmUgKG1pZ2h0IGhhcHBlbiB3aGVuIHByb2Nlc3MuY3dkKCkgZmFpbHMpXG5cbiAgICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcbiAgICByZXNvbHZlZFBhdGggPSBub3JtYWxpemVTdHJpbmdQb3NpeChyZXNvbHZlZFBhdGgsICFyZXNvbHZlZEFic29sdXRlKTtcblxuICAgIGlmIChyZXNvbHZlZEFic29sdXRlKSB7XG4gICAgICBpZiAocmVzb2x2ZWRQYXRoLmxlbmd0aCA+IDApXG4gICAgICAgIHJldHVybiAnLycgKyByZXNvbHZlZFBhdGg7XG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiAnLyc7XG4gICAgfSBlbHNlIGlmIChyZXNvbHZlZFBhdGgubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuIHJlc29sdmVkUGF0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICcuJztcbiAgICB9XG4gIH0sXG5cbiAgbm9ybWFsaXplOiBmdW5jdGlvbiBub3JtYWxpemUocGF0aCkge1xuICAgIGFzc2VydFBhdGgocGF0aCk7XG5cbiAgICBpZiAocGF0aC5sZW5ndGggPT09IDApIHJldHVybiAnLic7XG5cbiAgICB2YXIgaXNBYnNvbHV0ZSA9IHBhdGguY2hhckNvZGVBdCgwKSA9PT0gNDcgLyovKi87XG4gICAgdmFyIHRyYWlsaW5nU2VwYXJhdG9yID0gcGF0aC5jaGFyQ29kZUF0KHBhdGgubGVuZ3RoIC0gMSkgPT09IDQ3IC8qLyovO1xuXG4gICAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gICAgcGF0aCA9IG5vcm1hbGl6ZVN0cmluZ1Bvc2l4KHBhdGgsICFpc0Fic29sdXRlKTtcblxuICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gMCAmJiAhaXNBYnNvbHV0ZSkgcGF0aCA9ICcuJztcbiAgICBpZiAocGF0aC5sZW5ndGggPiAwICYmIHRyYWlsaW5nU2VwYXJhdG9yKSBwYXRoICs9ICcvJztcblxuICAgIGlmIChpc0Fic29sdXRlKSByZXR1cm4gJy8nICsgcGF0aDtcbiAgICByZXR1cm4gcGF0aDtcbiAgfSxcblxuICBpc0Fic29sdXRlOiBmdW5jdGlvbiBpc0Fic29sdXRlKHBhdGgpIHtcbiAgICBhc3NlcnRQYXRoKHBhdGgpO1xuICAgIHJldHVybiBwYXRoLmxlbmd0aCA+IDAgJiYgcGF0aC5jaGFyQ29kZUF0KDApID09PSA0NyAvKi8qLztcbiAgfSxcblxuICBqb2luOiBmdW5jdGlvbiBqb2luKCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgcmV0dXJuICcuJztcbiAgICB2YXIgam9pbmVkO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgKytpKSB7XG4gICAgICB2YXIgYXJnID0gYXJndW1lbnRzW2ldO1xuICAgICAgYXNzZXJ0UGF0aChhcmcpO1xuICAgICAgaWYgKGFyZy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGlmIChqb2luZWQgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICBqb2luZWQgPSBhcmc7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBqb2luZWQgKz0gJy8nICsgYXJnO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoam9pbmVkID09PSB1bmRlZmluZWQpXG4gICAgICByZXR1cm4gJy4nO1xuICAgIHJldHVybiBwb3NpeC5ub3JtYWxpemUoam9pbmVkKTtcbiAgfSxcblxuICByZWxhdGl2ZTogZnVuY3Rpb24gcmVsYXRpdmUoZnJvbSwgdG8pIHtcbiAgICBhc3NlcnRQYXRoKGZyb20pO1xuICAgIGFzc2VydFBhdGgodG8pO1xuXG4gICAgaWYgKGZyb20gPT09IHRvKSByZXR1cm4gJyc7XG5cbiAgICBmcm9tID0gcG9zaXgucmVzb2x2ZShmcm9tKTtcbiAgICB0byA9IHBvc2l4LnJlc29sdmUodG8pO1xuXG4gICAgaWYgKGZyb20gPT09IHRvKSByZXR1cm4gJyc7XG5cbiAgICAvLyBUcmltIGFueSBsZWFkaW5nIGJhY2tzbGFzaGVzXG4gICAgdmFyIGZyb21TdGFydCA9IDE7XG4gICAgZm9yICg7IGZyb21TdGFydCA8IGZyb20ubGVuZ3RoOyArK2Zyb21TdGFydCkge1xuICAgICAgaWYgKGZyb20uY2hhckNvZGVBdChmcm9tU3RhcnQpICE9PSA0NyAvKi8qLylcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHZhciBmcm9tRW5kID0gZnJvbS5sZW5ndGg7XG4gICAgdmFyIGZyb21MZW4gPSBmcm9tRW5kIC0gZnJvbVN0YXJ0O1xuXG4gICAgLy8gVHJpbSBhbnkgbGVhZGluZyBiYWNrc2xhc2hlc1xuICAgIHZhciB0b1N0YXJ0ID0gMTtcbiAgICBmb3IgKDsgdG9TdGFydCA8IHRvLmxlbmd0aDsgKyt0b1N0YXJ0KSB7XG4gICAgICBpZiAodG8uY2hhckNvZGVBdCh0b1N0YXJ0KSAhPT0gNDcgLyovKi8pXG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICB2YXIgdG9FbmQgPSB0by5sZW5ndGg7XG4gICAgdmFyIHRvTGVuID0gdG9FbmQgLSB0b1N0YXJ0O1xuXG4gICAgLy8gQ29tcGFyZSBwYXRocyB0byBmaW5kIHRoZSBsb25nZXN0IGNvbW1vbiBwYXRoIGZyb20gcm9vdFxuICAgIHZhciBsZW5ndGggPSBmcm9tTGVuIDwgdG9MZW4gPyBmcm9tTGVuIDogdG9MZW47XG4gICAgdmFyIGxhc3RDb21tb25TZXAgPSAtMTtcbiAgICB2YXIgaSA9IDA7XG4gICAgZm9yICg7IGkgPD0gbGVuZ3RoOyArK2kpIHtcbiAgICAgIGlmIChpID09PSBsZW5ndGgpIHtcbiAgICAgICAgaWYgKHRvTGVuID4gbGVuZ3RoKSB7XG4gICAgICAgICAgaWYgKHRvLmNoYXJDb2RlQXQodG9TdGFydCArIGkpID09PSA0NyAvKi8qLykge1xuICAgICAgICAgICAgLy8gV2UgZ2V0IGhlcmUgaWYgYGZyb21gIGlzIHRoZSBleGFjdCBiYXNlIHBhdGggZm9yIGB0b2AuXG4gICAgICAgICAgICAvLyBGb3IgZXhhbXBsZTogZnJvbT0nL2Zvby9iYXInOyB0bz0nL2Zvby9iYXIvYmF6J1xuICAgICAgICAgICAgcmV0dXJuIHRvLnNsaWNlKHRvU3RhcnQgKyBpICsgMSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChpID09PSAwKSB7XG4gICAgICAgICAgICAvLyBXZSBnZXQgaGVyZSBpZiBgZnJvbWAgaXMgdGhlIHJvb3RcbiAgICAgICAgICAgIC8vIEZvciBleGFtcGxlOiBmcm9tPScvJzsgdG89Jy9mb28nXG4gICAgICAgICAgICByZXR1cm4gdG8uc2xpY2UodG9TdGFydCArIGkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChmcm9tTGVuID4gbGVuZ3RoKSB7XG4gICAgICAgICAgaWYgKGZyb20uY2hhckNvZGVBdChmcm9tU3RhcnQgKyBpKSA9PT0gNDcgLyovKi8pIHtcbiAgICAgICAgICAgIC8vIFdlIGdldCBoZXJlIGlmIGB0b2AgaXMgdGhlIGV4YWN0IGJhc2UgcGF0aCBmb3IgYGZyb21gLlxuICAgICAgICAgICAgLy8gRm9yIGV4YW1wbGU6IGZyb209Jy9mb28vYmFyL2Jheic7IHRvPScvZm9vL2JhcidcbiAgICAgICAgICAgIGxhc3RDb21tb25TZXAgPSBpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoaSA9PT0gMCkge1xuICAgICAgICAgICAgLy8gV2UgZ2V0IGhlcmUgaWYgYHRvYCBpcyB0aGUgcm9vdC5cbiAgICAgICAgICAgIC8vIEZvciBleGFtcGxlOiBmcm9tPScvZm9vJzsgdG89Jy8nXG4gICAgICAgICAgICBsYXN0Q29tbW9uU2VwID0gMDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICB2YXIgZnJvbUNvZGUgPSBmcm9tLmNoYXJDb2RlQXQoZnJvbVN0YXJ0ICsgaSk7XG4gICAgICB2YXIgdG9Db2RlID0gdG8uY2hhckNvZGVBdCh0b1N0YXJ0ICsgaSk7XG4gICAgICBpZiAoZnJvbUNvZGUgIT09IHRvQ29kZSlcbiAgICAgICAgYnJlYWs7XG4gICAgICBlbHNlIGlmIChmcm9tQ29kZSA9PT0gNDcgLyovKi8pXG4gICAgICAgIGxhc3RDb21tb25TZXAgPSBpO1xuICAgIH1cblxuICAgIHZhciBvdXQgPSAnJztcbiAgICAvLyBHZW5lcmF0ZSB0aGUgcmVsYXRpdmUgcGF0aCBiYXNlZCBvbiB0aGUgcGF0aCBkaWZmZXJlbmNlIGJldHdlZW4gYHRvYFxuICAgIC8vIGFuZCBgZnJvbWBcbiAgICBmb3IgKGkgPSBmcm9tU3RhcnQgKyBsYXN0Q29tbW9uU2VwICsgMTsgaSA8PSBmcm9tRW5kOyArK2kpIHtcbiAgICAgIGlmIChpID09PSBmcm9tRW5kIHx8IGZyb20uY2hhckNvZGVBdChpKSA9PT0gNDcgLyovKi8pIHtcbiAgICAgICAgaWYgKG91dC5sZW5ndGggPT09IDApXG4gICAgICAgICAgb3V0ICs9ICcuLic7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBvdXQgKz0gJy8uLic7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTGFzdGx5LCBhcHBlbmQgdGhlIHJlc3Qgb2YgdGhlIGRlc3RpbmF0aW9uIChgdG9gKSBwYXRoIHRoYXQgY29tZXMgYWZ0ZXJcbiAgICAvLyB0aGUgY29tbW9uIHBhdGggcGFydHNcbiAgICBpZiAob3V0Lmxlbmd0aCA+IDApXG4gICAgICByZXR1cm4gb3V0ICsgdG8uc2xpY2UodG9TdGFydCArIGxhc3RDb21tb25TZXApO1xuICAgIGVsc2Uge1xuICAgICAgdG9TdGFydCArPSBsYXN0Q29tbW9uU2VwO1xuICAgICAgaWYgKHRvLmNoYXJDb2RlQXQodG9TdGFydCkgPT09IDQ3IC8qLyovKVxuICAgICAgICArK3RvU3RhcnQ7XG4gICAgICByZXR1cm4gdG8uc2xpY2UodG9TdGFydCk7XG4gICAgfVxuICB9LFxuXG4gIF9tYWtlTG9uZzogZnVuY3Rpb24gX21ha2VMb25nKHBhdGgpIHtcbiAgICByZXR1cm4gcGF0aDtcbiAgfSxcblxuICBkaXJuYW1lOiBmdW5jdGlvbiBkaXJuYW1lKHBhdGgpIHtcbiAgICBhc3NlcnRQYXRoKHBhdGgpO1xuICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gMCkgcmV0dXJuICcuJztcbiAgICB2YXIgY29kZSA9IHBhdGguY2hhckNvZGVBdCgwKTtcbiAgICB2YXIgaGFzUm9vdCA9IGNvZGUgPT09IDQ3IC8qLyovO1xuICAgIHZhciBlbmQgPSAtMTtcbiAgICB2YXIgbWF0Y2hlZFNsYXNoID0gdHJ1ZTtcbiAgICBmb3IgKHZhciBpID0gcGF0aC5sZW5ndGggLSAxOyBpID49IDE7IC0taSkge1xuICAgICAgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcbiAgICAgIGlmIChjb2RlID09PSA0NyAvKi8qLykge1xuICAgICAgICAgIGlmICghbWF0Y2hlZFNsYXNoKSB7XG4gICAgICAgICAgICBlbmQgPSBpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBXZSBzYXcgdGhlIGZpcnN0IG5vbi1wYXRoIHNlcGFyYXRvclxuICAgICAgICBtYXRjaGVkU2xhc2ggPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZW5kID09PSAtMSkgcmV0dXJuIGhhc1Jvb3QgPyAnLycgOiAnLic7XG4gICAgaWYgKGhhc1Jvb3QgJiYgZW5kID09PSAxKSByZXR1cm4gJy8vJztcbiAgICByZXR1cm4gcGF0aC5zbGljZSgwLCBlbmQpO1xuICB9LFxuXG4gIGJhc2VuYW1lOiBmdW5jdGlvbiBiYXNlbmFtZShwYXRoLCBleHQpIHtcbiAgICBpZiAoZXh0ICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGV4dCAhPT0gJ3N0cmluZycpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wiZXh0XCIgYXJndW1lbnQgbXVzdCBiZSBhIHN0cmluZycpO1xuICAgIGFzc2VydFBhdGgocGF0aCk7XG5cbiAgICB2YXIgc3RhcnQgPSAwO1xuICAgIHZhciBlbmQgPSAtMTtcbiAgICB2YXIgbWF0Y2hlZFNsYXNoID0gdHJ1ZTtcbiAgICB2YXIgaTtcblxuICAgIGlmIChleHQgIT09IHVuZGVmaW5lZCAmJiBleHQubGVuZ3RoID4gMCAmJiBleHQubGVuZ3RoIDw9IHBhdGgubGVuZ3RoKSB7XG4gICAgICBpZiAoZXh0Lmxlbmd0aCA9PT0gcGF0aC5sZW5ndGggJiYgZXh0ID09PSBwYXRoKSByZXR1cm4gJyc7XG4gICAgICB2YXIgZXh0SWR4ID0gZXh0Lmxlbmd0aCAtIDE7XG4gICAgICB2YXIgZmlyc3ROb25TbGFzaEVuZCA9IC0xO1xuICAgICAgZm9yIChpID0gcGF0aC5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICB2YXIgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcbiAgICAgICAgaWYgKGNvZGUgPT09IDQ3IC8qLyovKSB7XG4gICAgICAgICAgICAvLyBJZiB3ZSByZWFjaGVkIGEgcGF0aCBzZXBhcmF0b3IgdGhhdCB3YXMgbm90IHBhcnQgb2YgYSBzZXQgb2YgcGF0aFxuICAgICAgICAgICAgLy8gc2VwYXJhdG9ycyBhdCB0aGUgZW5kIG9mIHRoZSBzdHJpbmcsIHN0b3Agbm93XG4gICAgICAgICAgICBpZiAoIW1hdGNoZWRTbGFzaCkge1xuICAgICAgICAgICAgICBzdGFydCA9IGkgKyAxO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChmaXJzdE5vblNsYXNoRW5kID09PSAtMSkge1xuICAgICAgICAgICAgLy8gV2Ugc2F3IHRoZSBmaXJzdCBub24tcGF0aCBzZXBhcmF0b3IsIHJlbWVtYmVyIHRoaXMgaW5kZXggaW4gY2FzZVxuICAgICAgICAgICAgLy8gd2UgbmVlZCBpdCBpZiB0aGUgZXh0ZW5zaW9uIGVuZHMgdXAgbm90IG1hdGNoaW5nXG4gICAgICAgICAgICBtYXRjaGVkU2xhc2ggPSBmYWxzZTtcbiAgICAgICAgICAgIGZpcnN0Tm9uU2xhc2hFbmQgPSBpICsgMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGV4dElkeCA+PSAwKSB7XG4gICAgICAgICAgICAvLyBUcnkgdG8gbWF0Y2ggdGhlIGV4cGxpY2l0IGV4dGVuc2lvblxuICAgICAgICAgICAgaWYgKGNvZGUgPT09IGV4dC5jaGFyQ29kZUF0KGV4dElkeCkpIHtcbiAgICAgICAgICAgICAgaWYgKC0tZXh0SWR4ID09PSAtMSkge1xuICAgICAgICAgICAgICAgIC8vIFdlIG1hdGNoZWQgdGhlIGV4dGVuc2lvbiwgc28gbWFyayB0aGlzIGFzIHRoZSBlbmQgb2Ygb3VyIHBhdGhcbiAgICAgICAgICAgICAgICAvLyBjb21wb25lbnRcbiAgICAgICAgICAgICAgICBlbmQgPSBpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBFeHRlbnNpb24gZG9lcyBub3QgbWF0Y2gsIHNvIG91ciByZXN1bHQgaXMgdGhlIGVudGlyZSBwYXRoXG4gICAgICAgICAgICAgIC8vIGNvbXBvbmVudFxuICAgICAgICAgICAgICBleHRJZHggPSAtMTtcbiAgICAgICAgICAgICAgZW5kID0gZmlyc3ROb25TbGFzaEVuZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHN0YXJ0ID09PSBlbmQpIGVuZCA9IGZpcnN0Tm9uU2xhc2hFbmQ7ZWxzZSBpZiAoZW5kID09PSAtMSkgZW5kID0gcGF0aC5sZW5ndGg7XG4gICAgICByZXR1cm4gcGF0aC5zbGljZShzdGFydCwgZW5kKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChpID0gcGF0aC5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICBpZiAocGF0aC5jaGFyQ29kZUF0KGkpID09PSA0NyAvKi8qLykge1xuICAgICAgICAgICAgLy8gSWYgd2UgcmVhY2hlZCBhIHBhdGggc2VwYXJhdG9yIHRoYXQgd2FzIG5vdCBwYXJ0IG9mIGEgc2V0IG9mIHBhdGhcbiAgICAgICAgICAgIC8vIHNlcGFyYXRvcnMgYXQgdGhlIGVuZCBvZiB0aGUgc3RyaW5nLCBzdG9wIG5vd1xuICAgICAgICAgICAgaWYgKCFtYXRjaGVkU2xhc2gpIHtcbiAgICAgICAgICAgICAgc3RhcnQgPSBpICsgMTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChlbmQgPT09IC0xKSB7XG4gICAgICAgICAgLy8gV2Ugc2F3IHRoZSBmaXJzdCBub24tcGF0aCBzZXBhcmF0b3IsIG1hcmsgdGhpcyBhcyB0aGUgZW5kIG9mIG91clxuICAgICAgICAgIC8vIHBhdGggY29tcG9uZW50XG4gICAgICAgICAgbWF0Y2hlZFNsYXNoID0gZmFsc2U7XG4gICAgICAgICAgZW5kID0gaSArIDE7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGVuZCA9PT0gLTEpIHJldHVybiAnJztcbiAgICAgIHJldHVybiBwYXRoLnNsaWNlKHN0YXJ0LCBlbmQpO1xuICAgIH1cbiAgfSxcblxuICBleHRuYW1lOiBmdW5jdGlvbiBleHRuYW1lKHBhdGgpIHtcbiAgICBhc3NlcnRQYXRoKHBhdGgpO1xuICAgIHZhciBzdGFydERvdCA9IC0xO1xuICAgIHZhciBzdGFydFBhcnQgPSAwO1xuICAgIHZhciBlbmQgPSAtMTtcbiAgICB2YXIgbWF0Y2hlZFNsYXNoID0gdHJ1ZTtcbiAgICAvLyBUcmFjayB0aGUgc3RhdGUgb2YgY2hhcmFjdGVycyAoaWYgYW55KSB3ZSBzZWUgYmVmb3JlIG91ciBmaXJzdCBkb3QgYW5kXG4gICAgLy8gYWZ0ZXIgYW55IHBhdGggc2VwYXJhdG9yIHdlIGZpbmRcbiAgICB2YXIgcHJlRG90U3RhdGUgPSAwO1xuICAgIGZvciAodmFyIGkgPSBwYXRoLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICB2YXIgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcbiAgICAgIGlmIChjb2RlID09PSA0NyAvKi8qLykge1xuICAgICAgICAgIC8vIElmIHdlIHJlYWNoZWQgYSBwYXRoIHNlcGFyYXRvciB0aGF0IHdhcyBub3QgcGFydCBvZiBhIHNldCBvZiBwYXRoXG4gICAgICAgICAgLy8gc2VwYXJhdG9ycyBhdCB0aGUgZW5kIG9mIHRoZSBzdHJpbmcsIHN0b3Agbm93XG4gICAgICAgICAgaWYgKCFtYXRjaGVkU2xhc2gpIHtcbiAgICAgICAgICAgIHN0YXJ0UGFydCA9IGkgKyAxO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICBpZiAoZW5kID09PSAtMSkge1xuICAgICAgICAvLyBXZSBzYXcgdGhlIGZpcnN0IG5vbi1wYXRoIHNlcGFyYXRvciwgbWFyayB0aGlzIGFzIHRoZSBlbmQgb2Ygb3VyXG4gICAgICAgIC8vIGV4dGVuc2lvblxuICAgICAgICBtYXRjaGVkU2xhc2ggPSBmYWxzZTtcbiAgICAgICAgZW5kID0gaSArIDE7XG4gICAgICB9XG4gICAgICBpZiAoY29kZSA9PT0gNDYgLyouKi8pIHtcbiAgICAgICAgICAvLyBJZiB0aGlzIGlzIG91ciBmaXJzdCBkb3QsIG1hcmsgaXQgYXMgdGhlIHN0YXJ0IG9mIG91ciBleHRlbnNpb25cbiAgICAgICAgICBpZiAoc3RhcnREb3QgPT09IC0xKVxuICAgICAgICAgICAgc3RhcnREb3QgPSBpO1xuICAgICAgICAgIGVsc2UgaWYgKHByZURvdFN0YXRlICE9PSAxKVxuICAgICAgICAgICAgcHJlRG90U3RhdGUgPSAxO1xuICAgICAgfSBlbHNlIGlmIChzdGFydERvdCAhPT0gLTEpIHtcbiAgICAgICAgLy8gV2Ugc2F3IGEgbm9uLWRvdCBhbmQgbm9uLXBhdGggc2VwYXJhdG9yIGJlZm9yZSBvdXIgZG90LCBzbyB3ZSBzaG91bGRcbiAgICAgICAgLy8gaGF2ZSBhIGdvb2QgY2hhbmNlIGF0IGhhdmluZyBhIG5vbi1lbXB0eSBleHRlbnNpb25cbiAgICAgICAgcHJlRG90U3RhdGUgPSAtMTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoc3RhcnREb3QgPT09IC0xIHx8IGVuZCA9PT0gLTEgfHxcbiAgICAgICAgLy8gV2Ugc2F3IGEgbm9uLWRvdCBjaGFyYWN0ZXIgaW1tZWRpYXRlbHkgYmVmb3JlIHRoZSBkb3RcbiAgICAgICAgcHJlRG90U3RhdGUgPT09IDAgfHxcbiAgICAgICAgLy8gVGhlIChyaWdodC1tb3N0KSB0cmltbWVkIHBhdGggY29tcG9uZW50IGlzIGV4YWN0bHkgJy4uJ1xuICAgICAgICBwcmVEb3RTdGF0ZSA9PT0gMSAmJiBzdGFydERvdCA9PT0gZW5kIC0gMSAmJiBzdGFydERvdCA9PT0gc3RhcnRQYXJ0ICsgMSkge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICByZXR1cm4gcGF0aC5zbGljZShzdGFydERvdCwgZW5kKTtcbiAgfSxcblxuICBmb3JtYXQ6IGZ1bmN0aW9uIGZvcm1hdChwYXRoT2JqZWN0KSB7XG4gICAgaWYgKHBhdGhPYmplY3QgPT09IG51bGwgfHwgdHlwZW9mIHBhdGhPYmplY3QgIT09ICdvYmplY3QnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJwYXRoT2JqZWN0XCIgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIE9iamVjdC4gUmVjZWl2ZWQgdHlwZSAnICsgdHlwZW9mIHBhdGhPYmplY3QpO1xuICAgIH1cbiAgICByZXR1cm4gX2Zvcm1hdCgnLycsIHBhdGhPYmplY3QpO1xuICB9LFxuXG4gIHBhcnNlOiBmdW5jdGlvbiBwYXJzZShwYXRoKSB7XG4gICAgYXNzZXJ0UGF0aChwYXRoKTtcblxuICAgIHZhciByZXQgPSB7IHJvb3Q6ICcnLCBkaXI6ICcnLCBiYXNlOiAnJywgZXh0OiAnJywgbmFtZTogJycgfTtcbiAgICBpZiAocGF0aC5sZW5ndGggPT09IDApIHJldHVybiByZXQ7XG4gICAgdmFyIGNvZGUgPSBwYXRoLmNoYXJDb2RlQXQoMCk7XG4gICAgdmFyIGlzQWJzb2x1dGUgPSBjb2RlID09PSA0NyAvKi8qLztcbiAgICB2YXIgc3RhcnQ7XG4gICAgaWYgKGlzQWJzb2x1dGUpIHtcbiAgICAgIHJldC5yb290ID0gJy8nO1xuICAgICAgc3RhcnQgPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdGFydCA9IDA7XG4gICAgfVxuICAgIHZhciBzdGFydERvdCA9IC0xO1xuICAgIHZhciBzdGFydFBhcnQgPSAwO1xuICAgIHZhciBlbmQgPSAtMTtcbiAgICB2YXIgbWF0Y2hlZFNsYXNoID0gdHJ1ZTtcbiAgICB2YXIgaSA9IHBhdGgubGVuZ3RoIC0gMTtcblxuICAgIC8vIFRyYWNrIHRoZSBzdGF0ZSBvZiBjaGFyYWN0ZXJzIChpZiBhbnkpIHdlIHNlZSBiZWZvcmUgb3VyIGZpcnN0IGRvdCBhbmRcbiAgICAvLyBhZnRlciBhbnkgcGF0aCBzZXBhcmF0b3Igd2UgZmluZFxuICAgIHZhciBwcmVEb3RTdGF0ZSA9IDA7XG5cbiAgICAvLyBHZXQgbm9uLWRpciBpbmZvXG4gICAgZm9yICg7IGkgPj0gc3RhcnQ7IC0taSkge1xuICAgICAgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcbiAgICAgIGlmIChjb2RlID09PSA0NyAvKi8qLykge1xuICAgICAgICAgIC8vIElmIHdlIHJlYWNoZWQgYSBwYXRoIHNlcGFyYXRvciB0aGF0IHdhcyBub3QgcGFydCBvZiBhIHNldCBvZiBwYXRoXG4gICAgICAgICAgLy8gc2VwYXJhdG9ycyBhdCB0aGUgZW5kIG9mIHRoZSBzdHJpbmcsIHN0b3Agbm93XG4gICAgICAgICAgaWYgKCFtYXRjaGVkU2xhc2gpIHtcbiAgICAgICAgICAgIHN0YXJ0UGFydCA9IGkgKyAxO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICBpZiAoZW5kID09PSAtMSkge1xuICAgICAgICAvLyBXZSBzYXcgdGhlIGZpcnN0IG5vbi1wYXRoIHNlcGFyYXRvciwgbWFyayB0aGlzIGFzIHRoZSBlbmQgb2Ygb3VyXG4gICAgICAgIC8vIGV4dGVuc2lvblxuICAgICAgICBtYXRjaGVkU2xhc2ggPSBmYWxzZTtcbiAgICAgICAgZW5kID0gaSArIDE7XG4gICAgICB9XG4gICAgICBpZiAoY29kZSA9PT0gNDYgLyouKi8pIHtcbiAgICAgICAgICAvLyBJZiB0aGlzIGlzIG91ciBmaXJzdCBkb3QsIG1hcmsgaXQgYXMgdGhlIHN0YXJ0IG9mIG91ciBleHRlbnNpb25cbiAgICAgICAgICBpZiAoc3RhcnREb3QgPT09IC0xKSBzdGFydERvdCA9IGk7ZWxzZSBpZiAocHJlRG90U3RhdGUgIT09IDEpIHByZURvdFN0YXRlID0gMTtcbiAgICAgICAgfSBlbHNlIGlmIChzdGFydERvdCAhPT0gLTEpIHtcbiAgICAgICAgLy8gV2Ugc2F3IGEgbm9uLWRvdCBhbmQgbm9uLXBhdGggc2VwYXJhdG9yIGJlZm9yZSBvdXIgZG90LCBzbyB3ZSBzaG91bGRcbiAgICAgICAgLy8gaGF2ZSBhIGdvb2QgY2hhbmNlIGF0IGhhdmluZyBhIG5vbi1lbXB0eSBleHRlbnNpb25cbiAgICAgICAgcHJlRG90U3RhdGUgPSAtMTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoc3RhcnREb3QgPT09IC0xIHx8IGVuZCA9PT0gLTEgfHxcbiAgICAvLyBXZSBzYXcgYSBub24tZG90IGNoYXJhY3RlciBpbW1lZGlhdGVseSBiZWZvcmUgdGhlIGRvdFxuICAgIHByZURvdFN0YXRlID09PSAwIHx8XG4gICAgLy8gVGhlIChyaWdodC1tb3N0KSB0cmltbWVkIHBhdGggY29tcG9uZW50IGlzIGV4YWN0bHkgJy4uJ1xuICAgIHByZURvdFN0YXRlID09PSAxICYmIHN0YXJ0RG90ID09PSBlbmQgLSAxICYmIHN0YXJ0RG90ID09PSBzdGFydFBhcnQgKyAxKSB7XG4gICAgICBpZiAoZW5kICE9PSAtMSkge1xuICAgICAgICBpZiAoc3RhcnRQYXJ0ID09PSAwICYmIGlzQWJzb2x1dGUpIHJldC5iYXNlID0gcmV0Lm5hbWUgPSBwYXRoLnNsaWNlKDEsIGVuZCk7ZWxzZSByZXQuYmFzZSA9IHJldC5uYW1lID0gcGF0aC5zbGljZShzdGFydFBhcnQsIGVuZCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChzdGFydFBhcnQgPT09IDAgJiYgaXNBYnNvbHV0ZSkge1xuICAgICAgICByZXQubmFtZSA9IHBhdGguc2xpY2UoMSwgc3RhcnREb3QpO1xuICAgICAgICByZXQuYmFzZSA9IHBhdGguc2xpY2UoMSwgZW5kKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldC5uYW1lID0gcGF0aC5zbGljZShzdGFydFBhcnQsIHN0YXJ0RG90KTtcbiAgICAgICAgcmV0LmJhc2UgPSBwYXRoLnNsaWNlKHN0YXJ0UGFydCwgZW5kKTtcbiAgICAgIH1cbiAgICAgIHJldC5leHQgPSBwYXRoLnNsaWNlKHN0YXJ0RG90LCBlbmQpO1xuICAgIH1cblxuICAgIGlmIChzdGFydFBhcnQgPiAwKSByZXQuZGlyID0gcGF0aC5zbGljZSgwLCBzdGFydFBhcnQgLSAxKTtlbHNlIGlmIChpc0Fic29sdXRlKSByZXQuZGlyID0gJy8nO1xuXG4gICAgcmV0dXJuIHJldDtcbiAgfSxcblxuICBzZXA6ICcvJyxcbiAgZGVsaW1pdGVyOiAnOicsXG4gIHdpbjMyOiBudWxsLFxuICBwb3NpeDogbnVsbFxufTtcblxucG9zaXgucG9zaXggPSBwb3NpeDtcblxubW9kdWxlLmV4cG9ydHMgPSBwb3NpeDtcbiIsIi8qIVxuICogc2hhbGxvdy1jbG9uZSA8aHR0cHM6Ly9naXRodWIuY29tL2pvbnNjaGxpbmtlcnQvc2hhbGxvdy1jbG9uZT5cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgSm9uIFNjaGxpbmtlcnQuXG4gKiBSZWxlYXNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCB2YWx1ZU9mID0gU3ltYm9sLnByb3RvdHlwZS52YWx1ZU9mO1xuY29uc3QgdHlwZU9mID0gcmVxdWlyZSgna2luZC1vZicpO1xuXG5mdW5jdGlvbiBjbG9uZSh2YWwsIGRlZXApIHtcbiAgc3dpdGNoICh0eXBlT2YodmFsKSkge1xuICAgIGNhc2UgJ2FycmF5JzpcbiAgICAgIHJldHVybiB2YWwuc2xpY2UoKTtcbiAgICBjYXNlICdvYmplY3QnOlxuICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHZhbCk7XG4gICAgY2FzZSAnZGF0ZSc6XG4gICAgICByZXR1cm4gbmV3IHZhbC5jb25zdHJ1Y3RvcihOdW1iZXIodmFsKSk7XG4gICAgY2FzZSAnbWFwJzpcbiAgICAgIHJldHVybiBuZXcgTWFwKHZhbCk7XG4gICAgY2FzZSAnc2V0JzpcbiAgICAgIHJldHVybiBuZXcgU2V0KHZhbCk7XG4gICAgY2FzZSAnYnVmZmVyJzpcbiAgICAgIHJldHVybiBjbG9uZUJ1ZmZlcih2YWwpO1xuICAgIGNhc2UgJ3N5bWJvbCc6XG4gICAgICByZXR1cm4gY2xvbmVTeW1ib2wodmFsKTtcbiAgICBjYXNlICdhcnJheWJ1ZmZlcic6XG4gICAgICByZXR1cm4gY2xvbmVBcnJheUJ1ZmZlcih2YWwpO1xuICAgIGNhc2UgJ2Zsb2F0MzJhcnJheSc6XG4gICAgY2FzZSAnZmxvYXQ2NGFycmF5JzpcbiAgICBjYXNlICdpbnQxNmFycmF5JzpcbiAgICBjYXNlICdpbnQzMmFycmF5JzpcbiAgICBjYXNlICdpbnQ4YXJyYXknOlxuICAgIGNhc2UgJ3VpbnQxNmFycmF5JzpcbiAgICBjYXNlICd1aW50MzJhcnJheSc6XG4gICAgY2FzZSAndWludDhjbGFtcGVkYXJyYXknOlxuICAgIGNhc2UgJ3VpbnQ4YXJyYXknOlxuICAgICAgcmV0dXJuIGNsb25lVHlwZWRBcnJheSh2YWwpO1xuICAgIGNhc2UgJ3JlZ2V4cCc6XG4gICAgICByZXR1cm4gY2xvbmVSZWdFeHAodmFsKTtcbiAgICBjYXNlICdlcnJvcic6XG4gICAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZSh2YWwpO1xuICAgIGRlZmF1bHQ6IHtcbiAgICAgIHJldHVybiB2YWw7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGNsb25lUmVnRXhwKHZhbCkge1xuICBjb25zdCBmbGFncyA9IHZhbC5mbGFncyAhPT0gdm9pZCAwID8gdmFsLmZsYWdzIDogKC9cXHcrJC8uZXhlYyh2YWwpIHx8IHZvaWQgMCk7XG4gIGNvbnN0IHJlID0gbmV3IHZhbC5jb25zdHJ1Y3Rvcih2YWwuc291cmNlLCBmbGFncyk7XG4gIHJlLmxhc3RJbmRleCA9IHZhbC5sYXN0SW5kZXg7XG4gIHJldHVybiByZTtcbn1cblxuZnVuY3Rpb24gY2xvbmVBcnJheUJ1ZmZlcih2YWwpIHtcbiAgY29uc3QgcmVzID0gbmV3IHZhbC5jb25zdHJ1Y3Rvcih2YWwuYnl0ZUxlbmd0aCk7XG4gIG5ldyBVaW50OEFycmF5KHJlcykuc2V0KG5ldyBVaW50OEFycmF5KHZhbCkpO1xuICByZXR1cm4gcmVzO1xufVxuXG5mdW5jdGlvbiBjbG9uZVR5cGVkQXJyYXkodmFsLCBkZWVwKSB7XG4gIHJldHVybiBuZXcgdmFsLmNvbnN0cnVjdG9yKHZhbC5idWZmZXIsIHZhbC5ieXRlT2Zmc2V0LCB2YWwubGVuZ3RoKTtcbn1cblxuZnVuY3Rpb24gY2xvbmVCdWZmZXIodmFsKSB7XG4gIGNvbnN0IGxlbiA9IHZhbC5sZW5ndGg7XG4gIGNvbnN0IGJ1ZiA9IEJ1ZmZlci5hbGxvY1Vuc2FmZSA/IEJ1ZmZlci5hbGxvY1Vuc2FmZShsZW4pIDogQnVmZmVyLmZyb20obGVuKTtcbiAgdmFsLmNvcHkoYnVmKTtcbiAgcmV0dXJuIGJ1Zjtcbn1cblxuZnVuY3Rpb24gY2xvbmVTeW1ib2wodmFsKSB7XG4gIHJldHVybiB2YWx1ZU9mID8gT2JqZWN0KHZhbHVlT2YuY2FsbCh2YWwpKSA6IHt9O1xufVxuXG4vKipcbiAqIEV4cG9zZSBgY2xvbmVgXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBjbG9uZTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9saWIvc3BlYWtpbmd1cmwnKTtcbiIsIihmdW5jdGlvbiAocm9vdCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8qKlxuICAgICAqIGNoYXJNYXBcbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqL1xuICAgIHZhciBjaGFyTWFwID0ge1xuXG4gICAgICAgIC8vIGxhdGluXG4gICAgICAgICfDgCc6ICdBJyxcbiAgICAgICAgJ8OBJzogJ0EnLFxuICAgICAgICAnw4InOiAnQScsXG4gICAgICAgICfDgyc6ICdBJyxcbiAgICAgICAgJ8OEJzogJ0FlJyxcbiAgICAgICAgJ8OFJzogJ0EnLFxuICAgICAgICAnw4YnOiAnQUUnLFxuICAgICAgICAnw4cnOiAnQycsXG4gICAgICAgICfDiCc6ICdFJyxcbiAgICAgICAgJ8OJJzogJ0UnLFxuICAgICAgICAnw4onOiAnRScsXG4gICAgICAgICfDiyc6ICdFJyxcbiAgICAgICAgJ8OMJzogJ0knLFxuICAgICAgICAnw40nOiAnSScsXG4gICAgICAgICfDjic6ICdJJyxcbiAgICAgICAgJ8OPJzogJ0knLFxuICAgICAgICAnw5AnOiAnRCcsXG4gICAgICAgICfDkSc6ICdOJyxcbiAgICAgICAgJ8OSJzogJ08nLFxuICAgICAgICAnw5MnOiAnTycsXG4gICAgICAgICfDlCc6ICdPJyxcbiAgICAgICAgJ8OVJzogJ08nLFxuICAgICAgICAnw5YnOiAnT2UnLFxuICAgICAgICAnxZAnOiAnTycsXG4gICAgICAgICfDmCc6ICdPJyxcbiAgICAgICAgJ8OZJzogJ1UnLFxuICAgICAgICAnw5onOiAnVScsXG4gICAgICAgICfDmyc6ICdVJyxcbiAgICAgICAgJ8OcJzogJ1VlJyxcbiAgICAgICAgJ8WwJzogJ1UnLFxuICAgICAgICAnw50nOiAnWScsXG4gICAgICAgICfDnic6ICdUSCcsXG4gICAgICAgICfDnyc6ICdzcycsXG4gICAgICAgICfDoCc6ICdhJyxcbiAgICAgICAgJ8OhJzogJ2EnLFxuICAgICAgICAnw6InOiAnYScsXG4gICAgICAgICfDoyc6ICdhJyxcbiAgICAgICAgJ8OkJzogJ2FlJyxcbiAgICAgICAgJ8OlJzogJ2EnLFxuICAgICAgICAnw6YnOiAnYWUnLFxuICAgICAgICAnw6cnOiAnYycsXG4gICAgICAgICfDqCc6ICdlJyxcbiAgICAgICAgJ8OpJzogJ2UnLFxuICAgICAgICAnw6onOiAnZScsXG4gICAgICAgICfDqyc6ICdlJyxcbiAgICAgICAgJ8OsJzogJ2knLFxuICAgICAgICAnw60nOiAnaScsXG4gICAgICAgICfDric6ICdpJyxcbiAgICAgICAgJ8OvJzogJ2knLFxuICAgICAgICAnw7AnOiAnZCcsXG4gICAgICAgICfDsSc6ICduJyxcbiAgICAgICAgJ8OyJzogJ28nLFxuICAgICAgICAnw7MnOiAnbycsXG4gICAgICAgICfDtCc6ICdvJyxcbiAgICAgICAgJ8O1JzogJ28nLFxuICAgICAgICAnw7YnOiAnb2UnLFxuICAgICAgICAnxZEnOiAnbycsXG4gICAgICAgICfDuCc6ICdvJyxcbiAgICAgICAgJ8O5JzogJ3UnLFxuICAgICAgICAnw7onOiAndScsXG4gICAgICAgICfDuyc6ICd1JyxcbiAgICAgICAgJ8O8JzogJ3VlJyxcbiAgICAgICAgJ8WxJzogJ3UnLFxuICAgICAgICAnw70nOiAneScsXG4gICAgICAgICfDvic6ICd0aCcsXG4gICAgICAgICfDvyc6ICd5JyxcbiAgICAgICAgJ+G6nic6ICdTUycsXG5cbiAgICAgICAgLy8gbGFuZ3VhZ2Ugc3BlY2lmaWNcblxuICAgICAgICAvLyBBcmFiaWNcbiAgICAgICAgJ9inJzogJ2EnLFxuICAgICAgICAn2KMnOiAnYScsXG4gICAgICAgICfYpSc6ICdpJyxcbiAgICAgICAgJ9iiJzogJ2FhJyxcbiAgICAgICAgJ9ikJzogJ3UnLFxuICAgICAgICAn2KYnOiAnZScsXG4gICAgICAgICfYoSc6ICdhJyxcbiAgICAgICAgJ9ioJzogJ2InLFxuICAgICAgICAn2KonOiAndCcsXG4gICAgICAgICfYqyc6ICd0aCcsXG4gICAgICAgICfYrCc6ICdqJyxcbiAgICAgICAgJ9itJzogJ2gnLFxuICAgICAgICAn2K4nOiAna2gnLFxuICAgICAgICAn2K8nOiAnZCcsXG4gICAgICAgICfYsCc6ICd0aCcsXG4gICAgICAgICfYsSc6ICdyJyxcbiAgICAgICAgJ9iyJzogJ3onLFxuICAgICAgICAn2LMnOiAncycsXG4gICAgICAgICfYtCc6ICdzaCcsXG4gICAgICAgICfYtSc6ICdzJyxcbiAgICAgICAgJ9i2JzogJ2RoJyxcbiAgICAgICAgJ9i3JzogJ3QnLFxuICAgICAgICAn2LgnOiAneicsXG4gICAgICAgICfYuSc6ICdhJyxcbiAgICAgICAgJ9i6JzogJ2doJyxcbiAgICAgICAgJ9mBJzogJ2YnLFxuICAgICAgICAn2YInOiAncScsXG4gICAgICAgICfZgyc6ICdrJyxcbiAgICAgICAgJ9mEJzogJ2wnLFxuICAgICAgICAn2YUnOiAnbScsXG4gICAgICAgICfZhic6ICduJyxcbiAgICAgICAgJ9mHJzogJ2gnLFxuICAgICAgICAn2YgnOiAndycsXG4gICAgICAgICfZiic6ICd5JyxcbiAgICAgICAgJ9mJJzogJ2EnLFxuICAgICAgICAn2KknOiAnaCcsXG4gICAgICAgICfvu7snOiAnbGEnLFxuICAgICAgICAn77u3JzogJ2xhYScsXG4gICAgICAgICfvu7knOiAnbGFpJyxcbiAgICAgICAgJ++7tSc6ICdsYWEnLFxuXG4gICAgICAgIC8vIFBlcnNpYW4gYWRkaXRpb25hbCBjaGFyYWN0ZXJzIHRoYW4gQXJhYmljXG4gICAgICAgICfaryc6ICdnJyxcbiAgICAgICAgJ9qGJzogJ2NoJyxcbiAgICAgICAgJ9m+JzogJ3AnLFxuICAgICAgICAn2pgnOiAnemgnLFxuICAgICAgICAn2qknOiAnaycsXG4gICAgICAgICfbjCc6ICd5JyxcblxuICAgICAgICAvLyBBcmFiaWMgZGlhY3RyaWNzXG4gICAgICAgICfZjic6ICdhJyxcbiAgICAgICAgJ9mLJzogJ2FuJyxcbiAgICAgICAgJ9mQJzogJ2UnLFxuICAgICAgICAn2Y0nOiAnZW4nLFxuICAgICAgICAn2Y8nOiAndScsXG4gICAgICAgICfZjCc6ICdvbicsXG4gICAgICAgICfZkic6ICcnLFxuXG4gICAgICAgIC8vIEFyYWJpYyBudW1iZXJzXG4gICAgICAgICfZoCc6ICcwJyxcbiAgICAgICAgJ9mhJzogJzEnLFxuICAgICAgICAn2aInOiAnMicsXG4gICAgICAgICfZoyc6ICczJyxcbiAgICAgICAgJ9mkJzogJzQnLFxuICAgICAgICAn2aUnOiAnNScsXG4gICAgICAgICfZpic6ICc2JyxcbiAgICAgICAgJ9mnJzogJzcnLFxuICAgICAgICAn2agnOiAnOCcsXG4gICAgICAgICfZqSc6ICc5JyxcblxuICAgICAgICAvLyBQZXJzaWFuIG51bWJlcnNcbiAgICAgICAgJ9uwJzogJzAnLFxuICAgICAgICAn27EnOiAnMScsXG4gICAgICAgICfbsic6ICcyJyxcbiAgICAgICAgJ9uzJzogJzMnLFxuICAgICAgICAn27QnOiAnNCcsXG4gICAgICAgICfbtSc6ICc1JyxcbiAgICAgICAgJ9u2JzogJzYnLFxuICAgICAgICAn27cnOiAnNycsXG4gICAgICAgICfbuCc6ICc4JyxcbiAgICAgICAgJ9u5JzogJzknLFxuXG4gICAgICAgIC8vIEJ1cm1lc2UgY29uc29uYW50c1xuICAgICAgICAn4YCAJzogJ2snLFxuICAgICAgICAn4YCBJzogJ2toJyxcbiAgICAgICAgJ+GAgic6ICdnJyxcbiAgICAgICAgJ+GAgyc6ICdnYScsXG4gICAgICAgICfhgIQnOiAnbmcnLFxuICAgICAgICAn4YCFJzogJ3MnLFxuICAgICAgICAn4YCGJzogJ3NhJyxcbiAgICAgICAgJ+GAhyc6ICd6JyxcbiAgICAgICAgJ+GAheGAuyc6ICd6YScsXG4gICAgICAgICfhgIonOiAnbnknLFxuICAgICAgICAn4YCLJzogJ3QnLFxuICAgICAgICAn4YCMJzogJ3RhJyxcbiAgICAgICAgJ+GAjSc6ICdkJyxcbiAgICAgICAgJ+GAjic6ICdkYScsXG4gICAgICAgICfhgI8nOiAnbmEnLFxuICAgICAgICAn4YCQJzogJ3QnLFxuICAgICAgICAn4YCRJzogJ3RhJyxcbiAgICAgICAgJ+GAkic6ICdkJyxcbiAgICAgICAgJ+GAkyc6ICdkYScsXG4gICAgICAgICfhgJQnOiAnbicsXG4gICAgICAgICfhgJUnOiAncCcsXG4gICAgICAgICfhgJYnOiAncGEnLFxuICAgICAgICAn4YCXJzogJ2InLFxuICAgICAgICAn4YCYJzogJ2JhJyxcbiAgICAgICAgJ+GAmSc6ICdtJyxcbiAgICAgICAgJ+GAmic6ICd5JyxcbiAgICAgICAgJ+GAmyc6ICd5YScsXG4gICAgICAgICfhgJwnOiAnbCcsXG4gICAgICAgICfhgJ0nOiAndycsXG4gICAgICAgICfhgJ4nOiAndGgnLFxuICAgICAgICAn4YCfJzogJ2gnLFxuICAgICAgICAn4YCgJzogJ2xhJyxcbiAgICAgICAgJ+GAoSc6ICdhJyxcbiAgICAgICAgLy8gY29uc29uYW50IGNoYXJhY3RlciBjb21ib3NcbiAgICAgICAgJ+GAvCc6ICd5JyxcbiAgICAgICAgJ+GAuyc6ICd5YScsXG4gICAgICAgICfhgL0nOiAndycsXG4gICAgICAgICfhgLzhgL0nOiAneXcnLFxuICAgICAgICAn4YC74YC9JzogJ3l3YScsXG4gICAgICAgICfhgL4nOiAnaCcsXG4gICAgICAgIC8vIGluZGVwZW5kZW50IHZvd2Vsc1xuICAgICAgICAn4YCnJzogJ2UnLFxuICAgICAgICAn4YGPJzogJy1lJyxcbiAgICAgICAgJ+GAoyc6ICdpJyxcbiAgICAgICAgJ+GApCc6ICctaScsXG4gICAgICAgICfhgIknOiAndScsXG4gICAgICAgICfhgKYnOiAnLXUnLFxuICAgICAgICAn4YCpJzogJ2F3JyxcbiAgICAgICAgJ+GAnuGAvOGAseGArCc6ICdhdycsXG4gICAgICAgICfhgKonOiAnYXcnLFxuICAgICAgICAvLyBudW1iZXJzXG4gICAgICAgICfhgYAnOiAnMCcsXG4gICAgICAgICfhgYEnOiAnMScsXG4gICAgICAgICfhgYInOiAnMicsXG4gICAgICAgICfhgYMnOiAnMycsXG4gICAgICAgICfhgYQnOiAnNCcsXG4gICAgICAgICfhgYUnOiAnNScsXG4gICAgICAgICfhgYYnOiAnNicsXG4gICAgICAgICfhgYcnOiAnNycsXG4gICAgICAgICfhgYgnOiAnOCcsXG4gICAgICAgICfhgYknOiAnOScsXG4gICAgICAgIC8vIHZpcmFtYSBhbmQgdG9uZSBtYXJrcyB3aGljaCBhcmUgc2lsZW50IGluIHRyYW5zbGl0ZXJhdGlvblxuICAgICAgICAn4YC5JzogJycsXG4gICAgICAgICfhgLcnOiAnJyxcbiAgICAgICAgJ+GAuCc6ICcnLFxuXG4gICAgICAgIC8vIEN6ZWNoXG4gICAgICAgICfEjSc6ICdjJyxcbiAgICAgICAgJ8SPJzogJ2QnLFxuICAgICAgICAnxJsnOiAnZScsXG4gICAgICAgICfFiCc6ICduJyxcbiAgICAgICAgJ8WZJzogJ3InLFxuICAgICAgICAnxaEnOiAncycsXG4gICAgICAgICfFpSc6ICd0JyxcbiAgICAgICAgJ8WvJzogJ3UnLFxuICAgICAgICAnxb4nOiAneicsXG4gICAgICAgICfEjCc6ICdDJyxcbiAgICAgICAgJ8SOJzogJ0QnLFxuICAgICAgICAnxJonOiAnRScsXG4gICAgICAgICfFhyc6ICdOJyxcbiAgICAgICAgJ8WYJzogJ1InLFxuICAgICAgICAnxaAnOiAnUycsXG4gICAgICAgICfFpCc6ICdUJyxcbiAgICAgICAgJ8WuJzogJ1UnLFxuICAgICAgICAnxb0nOiAnWicsXG5cbiAgICAgICAgLy8gRGhpdmVoaVxuICAgICAgICAn3oAnOiAnaCcsXG4gICAgICAgICfegSc6ICdzaCcsXG4gICAgICAgICfegic6ICduJyxcbiAgICAgICAgJ96DJzogJ3InLFxuICAgICAgICAn3oQnOiAnYicsXG4gICAgICAgICfehSc6ICdsaCcsXG4gICAgICAgICfehic6ICdrJyxcbiAgICAgICAgJ96HJzogJ2EnLFxuICAgICAgICAn3ognOiAndicsXG4gICAgICAgICfeiSc6ICdtJyxcbiAgICAgICAgJ96KJzogJ2YnLFxuICAgICAgICAn3osnOiAnZGgnLFxuICAgICAgICAn3ownOiAndGgnLFxuICAgICAgICAn3o0nOiAnbCcsXG4gICAgICAgICfejic6ICdnJyxcbiAgICAgICAgJ96PJzogJ2duJyxcbiAgICAgICAgJ96QJzogJ3MnLFxuICAgICAgICAn3pEnOiAnZCcsXG4gICAgICAgICfekic6ICd6JyxcbiAgICAgICAgJ96TJzogJ3QnLFxuICAgICAgICAn3pQnOiAneScsXG4gICAgICAgICfelSc6ICdwJyxcbiAgICAgICAgJ96WJzogJ2onLFxuICAgICAgICAn3pcnOiAnY2gnLFxuICAgICAgICAn3pgnOiAndHQnLFxuICAgICAgICAn3pknOiAnaGgnLFxuICAgICAgICAn3ponOiAna2gnLFxuICAgICAgICAn3psnOiAndGgnLFxuICAgICAgICAn3pwnOiAneicsXG4gICAgICAgICfenSc6ICdzaCcsXG4gICAgICAgICfenic6ICdzJyxcbiAgICAgICAgJ96fJzogJ2QnLFxuICAgICAgICAn3qAnOiAndCcsXG4gICAgICAgICfeoSc6ICd6JyxcbiAgICAgICAgJ96iJzogJ2EnLFxuICAgICAgICAn3qMnOiAnZ2gnLFxuICAgICAgICAn3qQnOiAncScsXG4gICAgICAgICfepSc6ICd3JyxcbiAgICAgICAgJ96mJzogJ2EnLFxuICAgICAgICAn3qcnOiAnYWEnLFxuICAgICAgICAn3qgnOiAnaScsXG4gICAgICAgICfeqSc6ICdlZScsXG4gICAgICAgICfeqic6ICd1JyxcbiAgICAgICAgJ96rJzogJ29vJyxcbiAgICAgICAgJ96sJzogJ2UnLFxuICAgICAgICAn3q0nOiAnZXknLFxuICAgICAgICAn3q4nOiAnbycsXG4gICAgICAgICferyc6ICdvYScsXG4gICAgICAgICfesCc6ICcnLFxuXG4gICAgICAgIC8vIEdlb3JnaWFuIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1JvbWFuaXphdGlvbl9vZl9HZW9yZ2lhblxuICAgICAgICAvLyBOYXRpb25hbCBzeXN0ZW0gKDIwMDIpXG4gICAgICAgICfhg5AnOiAnYScsXG4gICAgICAgICfhg5EnOiAnYicsXG4gICAgICAgICfhg5InOiAnZycsXG4gICAgICAgICfhg5MnOiAnZCcsXG4gICAgICAgICfhg5QnOiAnZScsXG4gICAgICAgICfhg5UnOiAndicsXG4gICAgICAgICfhg5YnOiAneicsXG4gICAgICAgICfhg5cnOiAndCcsXG4gICAgICAgICfhg5gnOiAnaScsXG4gICAgICAgICfhg5knOiAnaycsXG4gICAgICAgICfhg5onOiAnbCcsXG4gICAgICAgICfhg5snOiAnbScsXG4gICAgICAgICfhg5wnOiAnbicsXG4gICAgICAgICfhg50nOiAnbycsXG4gICAgICAgICfhg54nOiAncCcsXG4gICAgICAgICfhg58nOiAnemgnLFxuICAgICAgICAn4YOgJzogJ3InLFxuICAgICAgICAn4YOhJzogJ3MnLFxuICAgICAgICAn4YOiJzogJ3QnLFxuICAgICAgICAn4YOjJzogJ3UnLFxuICAgICAgICAn4YOkJzogJ3AnLFxuICAgICAgICAn4YOlJzogJ2snLFxuICAgICAgICAn4YOmJzogJ2doJyxcbiAgICAgICAgJ+GDpyc6ICdxJyxcbiAgICAgICAgJ+GDqCc6ICdzaCcsXG4gICAgICAgICfhg6knOiAnY2gnLFxuICAgICAgICAn4YOqJzogJ3RzJyxcbiAgICAgICAgJ+GDqyc6ICdkeicsXG4gICAgICAgICfhg6wnOiAndHMnLFxuICAgICAgICAn4YOtJzogJ2NoJyxcbiAgICAgICAgJ+GDric6ICdraCcsXG4gICAgICAgICfhg68nOiAnaicsXG4gICAgICAgICfhg7AnOiAnaCcsXG5cbiAgICAgICAgLy8gR3JlZWtcbiAgICAgICAgJ86xJzogJ2EnLFxuICAgICAgICAnzrInOiAndicsXG4gICAgICAgICfOsyc6ICdnJyxcbiAgICAgICAgJ860JzogJ2QnLFxuICAgICAgICAnzrUnOiAnZScsXG4gICAgICAgICfOtic6ICd6JyxcbiAgICAgICAgJ863JzogJ2knLFxuICAgICAgICAnzrgnOiAndGgnLFxuICAgICAgICAnzrknOiAnaScsXG4gICAgICAgICfOuic6ICdrJyxcbiAgICAgICAgJ867JzogJ2wnLFxuICAgICAgICAnzrwnOiAnbScsXG4gICAgICAgICfOvSc6ICduJyxcbiAgICAgICAgJ86+JzogJ2tzJyxcbiAgICAgICAgJ86/JzogJ28nLFxuICAgICAgICAnz4AnOiAncCcsXG4gICAgICAgICfPgSc6ICdyJyxcbiAgICAgICAgJ8+DJzogJ3MnLFxuICAgICAgICAnz4QnOiAndCcsXG4gICAgICAgICfPhSc6ICd5JyxcbiAgICAgICAgJ8+GJzogJ2YnLFxuICAgICAgICAnz4cnOiAneCcsXG4gICAgICAgICfPiCc6ICdwcycsXG4gICAgICAgICfPiSc6ICdvJyxcbiAgICAgICAgJ86sJzogJ2EnLFxuICAgICAgICAnzq0nOiAnZScsXG4gICAgICAgICfOryc6ICdpJyxcbiAgICAgICAgJ8+MJzogJ28nLFxuICAgICAgICAnz40nOiAneScsXG4gICAgICAgICfOric6ICdpJyxcbiAgICAgICAgJ8+OJzogJ28nLFxuICAgICAgICAnz4InOiAncycsXG4gICAgICAgICfPiic6ICdpJyxcbiAgICAgICAgJ86wJzogJ3knLFxuICAgICAgICAnz4snOiAneScsXG4gICAgICAgICfOkCc6ICdpJyxcbiAgICAgICAgJ86RJzogJ0EnLFxuICAgICAgICAnzpInOiAnQicsXG4gICAgICAgICfOkyc6ICdHJyxcbiAgICAgICAgJ86UJzogJ0QnLFxuICAgICAgICAnzpUnOiAnRScsXG4gICAgICAgICfOlic6ICdaJyxcbiAgICAgICAgJ86XJzogJ0knLFxuICAgICAgICAnzpgnOiAnVEgnLFxuICAgICAgICAnzpknOiAnSScsXG4gICAgICAgICfOmic6ICdLJyxcbiAgICAgICAgJ86bJzogJ0wnLFxuICAgICAgICAnzpwnOiAnTScsXG4gICAgICAgICfOnSc6ICdOJyxcbiAgICAgICAgJ86eJzogJ0tTJyxcbiAgICAgICAgJ86fJzogJ08nLFxuICAgICAgICAnzqAnOiAnUCcsXG4gICAgICAgICfOoSc6ICdSJyxcbiAgICAgICAgJ86jJzogJ1MnLFxuICAgICAgICAnzqQnOiAnVCcsXG4gICAgICAgICfOpSc6ICdZJyxcbiAgICAgICAgJ86mJzogJ0YnLFxuICAgICAgICAnzqcnOiAnWCcsXG4gICAgICAgICfOqCc6ICdQUycsXG4gICAgICAgICfOqSc6ICdPJyxcbiAgICAgICAgJ86GJzogJ0EnLFxuICAgICAgICAnzognOiAnRScsXG4gICAgICAgICfOiic6ICdJJyxcbiAgICAgICAgJ86MJzogJ08nLFxuICAgICAgICAnzo4nOiAnWScsXG4gICAgICAgICfOiSc6ICdJJyxcbiAgICAgICAgJ86PJzogJ08nLFxuICAgICAgICAnzqonOiAnSScsXG4gICAgICAgICfOqyc6ICdZJyxcblxuICAgICAgICAvLyBMYXR2aWFuXG4gICAgICAgICfEgSc6ICdhJyxcbiAgICAgICAgLy8gJ8SNJzogJ2MnLCAvLyBkdXBsaWNhdGVcbiAgICAgICAgJ8STJzogJ2UnLFxuICAgICAgICAnxKMnOiAnZycsXG4gICAgICAgICfEqyc6ICdpJyxcbiAgICAgICAgJ8S3JzogJ2snLFxuICAgICAgICAnxLwnOiAnbCcsXG4gICAgICAgICfFhic6ICduJyxcbiAgICAgICAgLy8gJ8WhJzogJ3MnLCAvLyBkdXBsaWNhdGVcbiAgICAgICAgJ8WrJzogJ3UnLFxuICAgICAgICAvLyAnxb4nOiAneicsIC8vIGR1cGxpY2F0ZVxuICAgICAgICAnxIAnOiAnQScsXG4gICAgICAgIC8vICfEjCc6ICdDJywgLy8gZHVwbGljYXRlXG4gICAgICAgICfEkic6ICdFJyxcbiAgICAgICAgJ8SiJzogJ0cnLFxuICAgICAgICAnxKonOiAnSScsXG4gICAgICAgICfEtic6ICdrJyxcbiAgICAgICAgJ8S7JzogJ0wnLFxuICAgICAgICAnxYUnOiAnTicsXG4gICAgICAgIC8vICfFoCc6ICdTJywgLy8gZHVwbGljYXRlXG4gICAgICAgICfFqic6ICdVJyxcbiAgICAgICAgLy8gJ8W9JzogJ1onLCAvLyBkdXBsaWNhdGVcblxuICAgICAgICAvLyBNYWNlZG9uaWFuXG4gICAgICAgICfQjCc6ICdLaicsXG4gICAgICAgICfRnCc6ICdraicsXG4gICAgICAgICfQiSc6ICdMaicsXG4gICAgICAgICfRmSc6ICdsaicsXG4gICAgICAgICfQiic6ICdOaicsXG4gICAgICAgICfRmic6ICduaicsXG4gICAgICAgICfQotGBJzogJ1RzJyxcbiAgICAgICAgJ9GC0YEnOiAndHMnLFxuXG4gICAgICAgIC8vIFBvbGlzaFxuICAgICAgICAnxIUnOiAnYScsXG4gICAgICAgICfEhyc6ICdjJyxcbiAgICAgICAgJ8SZJzogJ2UnLFxuICAgICAgICAnxYInOiAnbCcsXG4gICAgICAgICfFhCc6ICduJyxcbiAgICAgICAgLy8gJ8OzJzogJ28nLCAvLyBkdXBsaWNhdGVcbiAgICAgICAgJ8WbJzogJ3MnLFxuICAgICAgICAnxbonOiAneicsXG4gICAgICAgICfFvCc6ICd6JyxcbiAgICAgICAgJ8SEJzogJ0EnLFxuICAgICAgICAnxIYnOiAnQycsXG4gICAgICAgICfEmCc6ICdFJyxcbiAgICAgICAgJ8WBJzogJ0wnLFxuICAgICAgICAnxYMnOiAnTicsXG4gICAgICAgICfFmic6ICdTJyxcbiAgICAgICAgJ8W5JzogJ1onLFxuICAgICAgICAnxbsnOiAnWicsXG5cbiAgICAgICAgLy8gVWtyYW5pYW5cbiAgICAgICAgJ9CEJzogJ1llJyxcbiAgICAgICAgJ9CGJzogJ0knLFxuICAgICAgICAn0IcnOiAnWWknLFxuICAgICAgICAn0pAnOiAnRycsXG4gICAgICAgICfRlCc6ICd5ZScsXG4gICAgICAgICfRlic6ICdpJyxcbiAgICAgICAgJ9GXJzogJ3lpJyxcbiAgICAgICAgJ9KRJzogJ2cnLFxuXG4gICAgICAgIC8vIFJvbWFuaWFuXG4gICAgICAgICfEgyc6ICdhJyxcbiAgICAgICAgJ8SCJzogJ0EnLFxuICAgICAgICAnyJknOiAncycsXG4gICAgICAgICfImCc6ICdTJyxcbiAgICAgICAgLy8gJ8WfJzogJ3MnLCAvLyBkdXBsaWNhdGVcbiAgICAgICAgLy8gJ8WeJzogJ1MnLCAvLyBkdXBsaWNhdGVcbiAgICAgICAgJ8ibJzogJ3QnLFxuICAgICAgICAnyJonOiAnVCcsXG4gICAgICAgICfFoyc6ICd0JyxcbiAgICAgICAgJ8WiJzogJ1QnLFxuXG4gICAgICAgIC8vIFJ1c3NpYW4gaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvUm9tYW5pemF0aW9uX29mX1J1c3NpYW5cbiAgICAgICAgLy8gSUNBT1xuXG4gICAgICAgICfQsCc6ICdhJyxcbiAgICAgICAgJ9CxJzogJ2InLFxuICAgICAgICAn0LInOiAndicsXG4gICAgICAgICfQsyc6ICdnJyxcbiAgICAgICAgJ9C0JzogJ2QnLFxuICAgICAgICAn0LUnOiAnZScsXG4gICAgICAgICfRkSc6ICd5bycsXG4gICAgICAgICfQtic6ICd6aCcsXG4gICAgICAgICfQtyc6ICd6JyxcbiAgICAgICAgJ9C4JzogJ2knLFxuICAgICAgICAn0LknOiAnaScsXG4gICAgICAgICfQuic6ICdrJyxcbiAgICAgICAgJ9C7JzogJ2wnLFxuICAgICAgICAn0LwnOiAnbScsXG4gICAgICAgICfQvSc6ICduJyxcbiAgICAgICAgJ9C+JzogJ28nLFxuICAgICAgICAn0L8nOiAncCcsXG4gICAgICAgICfRgCc6ICdyJyxcbiAgICAgICAgJ9GBJzogJ3MnLFxuICAgICAgICAn0YInOiAndCcsXG4gICAgICAgICfRgyc6ICd1JyxcbiAgICAgICAgJ9GEJzogJ2YnLFxuICAgICAgICAn0YUnOiAna2gnLFxuICAgICAgICAn0YYnOiAnYycsXG4gICAgICAgICfRhyc6ICdjaCcsXG4gICAgICAgICfRiCc6ICdzaCcsXG4gICAgICAgICfRiSc6ICdzaCcsXG4gICAgICAgICfRiic6ICcnLFxuICAgICAgICAn0YsnOiAneScsXG4gICAgICAgICfRjCc6ICcnLFxuICAgICAgICAn0Y0nOiAnZScsXG4gICAgICAgICfRjic6ICd5dScsXG4gICAgICAgICfRjyc6ICd5YScsXG4gICAgICAgICfQkCc6ICdBJyxcbiAgICAgICAgJ9CRJzogJ0InLFxuICAgICAgICAn0JInOiAnVicsXG4gICAgICAgICfQkyc6ICdHJyxcbiAgICAgICAgJ9CUJzogJ0QnLFxuICAgICAgICAn0JUnOiAnRScsXG4gICAgICAgICfQgSc6ICdZbycsXG4gICAgICAgICfQlic6ICdaaCcsXG4gICAgICAgICfQlyc6ICdaJyxcbiAgICAgICAgJ9CYJzogJ0knLFxuICAgICAgICAn0JknOiAnSScsXG4gICAgICAgICfQmic6ICdLJyxcbiAgICAgICAgJ9CbJzogJ0wnLFxuICAgICAgICAn0JwnOiAnTScsXG4gICAgICAgICfQnSc6ICdOJyxcbiAgICAgICAgJ9CeJzogJ08nLFxuICAgICAgICAn0J8nOiAnUCcsXG4gICAgICAgICfQoCc6ICdSJyxcbiAgICAgICAgJ9ChJzogJ1MnLFxuICAgICAgICAn0KInOiAnVCcsXG4gICAgICAgICfQoyc6ICdVJyxcbiAgICAgICAgJ9CkJzogJ0YnLFxuICAgICAgICAn0KUnOiAnS2gnLFxuICAgICAgICAn0KYnOiAnQycsXG4gICAgICAgICfQpyc6ICdDaCcsXG4gICAgICAgICfQqCc6ICdTaCcsXG4gICAgICAgICfQqSc6ICdTaCcsXG4gICAgICAgICfQqic6ICcnLFxuICAgICAgICAn0KsnOiAnWScsXG4gICAgICAgICfQrCc6ICcnLFxuICAgICAgICAn0K0nOiAnRScsXG4gICAgICAgICfQric6ICdZdScsXG4gICAgICAgICfQryc6ICdZYScsXG5cbiAgICAgICAgLy8gU2VyYmlhblxuICAgICAgICAn0ZInOiAnZGonLFxuICAgICAgICAn0ZgnOiAnaicsXG4gICAgICAgIC8vICfRmSc6ICdsaicsICAvLyBkdXBsaWNhdGVcbiAgICAgICAgLy8gJ9GaJzogJ25qJywgLy8gZHVwbGljYXRlXG4gICAgICAgICfRmyc6ICdjJyxcbiAgICAgICAgJ9GfJzogJ2R6JyxcbiAgICAgICAgJ9CCJzogJ0RqJyxcbiAgICAgICAgJ9CIJzogJ2onLFxuICAgICAgICAvLyAn0IknOiAnTGonLCAvLyBkdXBsaWNhdGVcbiAgICAgICAgLy8gJ9CKJzogJ05qJywgLy8gZHVwbGljYXRlXG4gICAgICAgICfQiyc6ICdDJyxcbiAgICAgICAgJ9CPJzogJ0R6JyxcblxuICAgICAgICAvLyBTbG92YWtcbiAgICAgICAgJ8S+JzogJ2wnLFxuICAgICAgICAnxLonOiAnbCcsXG4gICAgICAgICfFlSc6ICdyJyxcbiAgICAgICAgJ8S9JzogJ0wnLFxuICAgICAgICAnxLknOiAnTCcsXG4gICAgICAgICfFlCc6ICdSJyxcblxuICAgICAgICAvLyBUdXJraXNoXG4gICAgICAgICfFnyc6ICdzJyxcbiAgICAgICAgJ8WeJzogJ1MnLFxuICAgICAgICAnxLEnOiAnaScsXG4gICAgICAgICfEsCc6ICdJJyxcbiAgICAgICAgLy8gJ8OnJzogJ2MnLCAvLyBkdXBsaWNhdGVcbiAgICAgICAgLy8gJ8OHJzogJ0MnLCAvLyBkdXBsaWNhdGVcbiAgICAgICAgLy8gJ8O8JzogJ3UnLCAvLyBkdXBsaWNhdGUsIHNlZSBsYW5nQ2hhck1hcFxuICAgICAgICAvLyAnw5wnOiAnVScsIC8vIGR1cGxpY2F0ZSwgc2VlIGxhbmdDaGFyTWFwXG4gICAgICAgIC8vICfDtic6ICdvJywgLy8gZHVwbGljYXRlLCBzZWUgbGFuZ0NoYXJNYXBcbiAgICAgICAgLy8gJ8OWJzogJ08nLCAvLyBkdXBsaWNhdGUsIHNlZSBsYW5nQ2hhck1hcFxuICAgICAgICAnxJ8nOiAnZycsXG4gICAgICAgICfEnic6ICdHJyxcblxuICAgICAgICAvLyBWaWV0bmFtZXNlXG4gICAgICAgICfhuqMnOiAnYScsXG4gICAgICAgICfhuqInOiAnQScsXG4gICAgICAgICfhurMnOiAnYScsXG4gICAgICAgICfhurInOiAnQScsXG4gICAgICAgICfhuqknOiAnYScsXG4gICAgICAgICfhuqgnOiAnQScsXG4gICAgICAgICfEkSc6ICdkJyxcbiAgICAgICAgJ8SQJzogJ0QnLFxuICAgICAgICAn4bq5JzogJ2UnLFxuICAgICAgICAn4bq4JzogJ0UnLFxuICAgICAgICAn4bq9JzogJ2UnLFxuICAgICAgICAn4bq8JzogJ0UnLFxuICAgICAgICAn4bq7JzogJ2UnLFxuICAgICAgICAn4bq6JzogJ0UnLFxuICAgICAgICAn4bq/JzogJ2UnLFxuICAgICAgICAn4bq+JzogJ0UnLFxuICAgICAgICAn4buBJzogJ2UnLFxuICAgICAgICAn4buAJzogJ0UnLFxuICAgICAgICAn4buHJzogJ2UnLFxuICAgICAgICAn4buGJzogJ0UnLFxuICAgICAgICAn4buFJzogJ2UnLFxuICAgICAgICAn4buEJzogJ0UnLFxuICAgICAgICAn4buDJzogJ2UnLFxuICAgICAgICAn4buCJzogJ0UnLFxuICAgICAgICAn4buPJzogJ28nLFxuICAgICAgICAn4buNJzogJ28nLFxuICAgICAgICAn4buMJzogJ28nLFxuICAgICAgICAn4buRJzogJ28nLFxuICAgICAgICAn4buQJzogJ08nLFxuICAgICAgICAn4buTJzogJ28nLFxuICAgICAgICAn4buSJzogJ08nLFxuICAgICAgICAn4buVJzogJ28nLFxuICAgICAgICAn4buUJzogJ08nLFxuICAgICAgICAn4buZJzogJ28nLFxuICAgICAgICAn4buYJzogJ08nLFxuICAgICAgICAn4buXJzogJ28nLFxuICAgICAgICAn4buWJzogJ08nLFxuICAgICAgICAnxqEnOiAnbycsXG4gICAgICAgICfGoCc6ICdPJyxcbiAgICAgICAgJ+G7myc6ICdvJyxcbiAgICAgICAgJ+G7mic6ICdPJyxcbiAgICAgICAgJ+G7nSc6ICdvJyxcbiAgICAgICAgJ+G7nCc6ICdPJyxcbiAgICAgICAgJ+G7oyc6ICdvJyxcbiAgICAgICAgJ+G7oic6ICdPJyxcbiAgICAgICAgJ+G7oSc6ICdvJyxcbiAgICAgICAgJ+G7oCc6ICdPJyxcbiAgICAgICAgJ+G7nic6ICdvJyxcbiAgICAgICAgJ+G7nyc6ICdvJyxcbiAgICAgICAgJ+G7iyc6ICdpJyxcbiAgICAgICAgJ+G7iic6ICdJJyxcbiAgICAgICAgJ8SpJzogJ2knLFxuICAgICAgICAnxKgnOiAnSScsXG4gICAgICAgICfhu4knOiAnaScsXG4gICAgICAgICfhu4gnOiAnaScsXG4gICAgICAgICfhu6cnOiAndScsXG4gICAgICAgICfhu6YnOiAnVScsXG4gICAgICAgICfhu6UnOiAndScsXG4gICAgICAgICfhu6QnOiAnVScsXG4gICAgICAgICfFqSc6ICd1JyxcbiAgICAgICAgJ8WoJzogJ1UnLFxuICAgICAgICAnxrAnOiAndScsXG4gICAgICAgICfGryc6ICdVJyxcbiAgICAgICAgJ+G7qSc6ICd1JyxcbiAgICAgICAgJ+G7qCc6ICdVJyxcbiAgICAgICAgJ+G7qyc6ICd1JyxcbiAgICAgICAgJ+G7qic6ICdVJyxcbiAgICAgICAgJ+G7sSc6ICd1JyxcbiAgICAgICAgJ+G7sCc6ICdVJyxcbiAgICAgICAgJ+G7ryc6ICd1JyxcbiAgICAgICAgJ+G7ric6ICdVJyxcbiAgICAgICAgJ+G7rSc6ICd1JyxcbiAgICAgICAgJ+G7rCc6ICfGsCcsXG4gICAgICAgICfhu7cnOiAneScsXG4gICAgICAgICfhu7YnOiAneScsXG4gICAgICAgICfhu7MnOiAneScsXG4gICAgICAgICfhu7InOiAnWScsXG4gICAgICAgICfhu7UnOiAneScsXG4gICAgICAgICfhu7QnOiAnWScsXG4gICAgICAgICfhu7knOiAneScsXG4gICAgICAgICfhu7gnOiAnWScsXG4gICAgICAgICfhuqEnOiAnYScsXG4gICAgICAgICfhuqAnOiAnQScsXG4gICAgICAgICfhuqUnOiAnYScsXG4gICAgICAgICfhuqQnOiAnQScsXG4gICAgICAgICfhuqcnOiAnYScsXG4gICAgICAgICfhuqYnOiAnQScsXG4gICAgICAgICfhuq0nOiAnYScsXG4gICAgICAgICfhuqwnOiAnQScsXG4gICAgICAgICfhuqsnOiAnYScsXG4gICAgICAgICfhuqonOiAnQScsXG4gICAgICAgIC8vICfEgyc6ICdhJywgLy8gZHVwbGljYXRlXG4gICAgICAgIC8vICfEgic6ICdBJywgLy8gZHVwbGljYXRlXG4gICAgICAgICfhuq8nOiAnYScsXG4gICAgICAgICfhuq4nOiAnQScsXG4gICAgICAgICfhurEnOiAnYScsXG4gICAgICAgICfhurAnOiAnQScsXG4gICAgICAgICfhurcnOiAnYScsXG4gICAgICAgICfhurYnOiAnQScsXG4gICAgICAgICfhurUnOiAnYScsXG4gICAgICAgICfhurQnOiAnQScsXG4gICAgICAgIFwi4pOqXCI6IFwiMFwiLFxuICAgICAgICBcIuKRoFwiOiBcIjFcIixcbiAgICAgICAgXCLikaFcIjogXCIyXCIsXG4gICAgICAgIFwi4pGiXCI6IFwiM1wiLFxuICAgICAgICBcIuKRo1wiOiBcIjRcIixcbiAgICAgICAgXCLikaRcIjogXCI1XCIsXG4gICAgICAgIFwi4pGlXCI6IFwiNlwiLFxuICAgICAgICBcIuKRplwiOiBcIjdcIixcbiAgICAgICAgXCLikadcIjogXCI4XCIsXG4gICAgICAgIFwi4pGoXCI6IFwiOVwiLFxuICAgICAgICBcIuKRqVwiOiBcIjEwXCIsXG4gICAgICAgIFwi4pGqXCI6IFwiMTFcIixcbiAgICAgICAgXCLikatcIjogXCIxMlwiLFxuICAgICAgICBcIuKRrFwiOiBcIjEzXCIsXG4gICAgICAgIFwi4pGtXCI6IFwiMTRcIixcbiAgICAgICAgXCLika5cIjogXCIxNVwiLFxuICAgICAgICBcIuKRr1wiOiBcIjE2XCIsXG4gICAgICAgIFwi4pGwXCI6IFwiMTdcIixcbiAgICAgICAgXCLikbFcIjogXCIxOFwiLFxuICAgICAgICBcIuKRslwiOiBcIjE4XCIsXG4gICAgICAgIFwi4pGzXCI6IFwiMThcIixcblxuICAgICAgICBcIuKTtVwiOiBcIjFcIixcbiAgICAgICAgXCLik7ZcIjogXCIyXCIsXG4gICAgICAgIFwi4pO3XCI6IFwiM1wiLFxuICAgICAgICBcIuKTuFwiOiBcIjRcIixcbiAgICAgICAgXCLik7lcIjogXCI1XCIsXG4gICAgICAgIFwi4pO6XCI6IFwiNlwiLFxuICAgICAgICBcIuKTu1wiOiBcIjdcIixcbiAgICAgICAgXCLik7xcIjogXCI4XCIsXG4gICAgICAgIFwi4pO9XCI6IFwiOVwiLFxuICAgICAgICBcIuKTvlwiOiBcIjEwXCIsXG5cbiAgICAgICAgXCLik79cIjogXCIwXCIsXG4gICAgICAgIFwi4pOrXCI6IFwiMTFcIixcbiAgICAgICAgXCLik6xcIjogXCIxMlwiLFxuICAgICAgICBcIuKTrVwiOiBcIjEzXCIsXG4gICAgICAgIFwi4pOuXCI6IFwiMTRcIixcbiAgICAgICAgXCLik69cIjogXCIxNVwiLFxuICAgICAgICBcIuKTsFwiOiBcIjE2XCIsXG4gICAgICAgIFwi4pOxXCI6IFwiMTdcIixcbiAgICAgICAgXCLik7JcIjogXCIxOFwiLFxuICAgICAgICBcIuKTs1wiOiBcIjE5XCIsXG4gICAgICAgIFwi4pO0XCI6IFwiMjBcIixcblxuICAgICAgICBcIuKStlwiOiBcIkFcIixcbiAgICAgICAgXCLikrdcIjogXCJCXCIsXG4gICAgICAgIFwi4pK4XCI6IFwiQ1wiLFxuICAgICAgICBcIuKSuVwiOiBcIkRcIixcbiAgICAgICAgXCLikrpcIjogXCJFXCIsXG4gICAgICAgIFwi4pK7XCI6IFwiRlwiLFxuICAgICAgICBcIuKSvFwiOiBcIkdcIixcbiAgICAgICAgXCLikr1cIjogXCJIXCIsXG4gICAgICAgIFwi4pK+XCI6IFwiSVwiLFxuICAgICAgICBcIuKSv1wiOiBcIkpcIixcbiAgICAgICAgXCLik4BcIjogXCJLXCIsXG4gICAgICAgIFwi4pOBXCI6IFwiTFwiLFxuICAgICAgICBcIuKTglwiOiBcIk1cIixcbiAgICAgICAgXCLik4NcIjogXCJOXCIsXG4gICAgICAgIFwi4pOEXCI6IFwiT1wiLFxuICAgICAgICBcIuKThVwiOiBcIlBcIixcbiAgICAgICAgXCLik4ZcIjogXCJRXCIsXG4gICAgICAgIFwi4pOHXCI6IFwiUlwiLFxuICAgICAgICBcIuKTiFwiOiBcIlNcIixcbiAgICAgICAgXCLik4lcIjogXCJUXCIsXG4gICAgICAgIFwi4pOKXCI6IFwiVVwiLFxuICAgICAgICBcIuKTi1wiOiBcIlZcIixcbiAgICAgICAgXCLik4xcIjogXCJXXCIsXG4gICAgICAgIFwi4pONXCI6IFwiWFwiLFxuICAgICAgICBcIuKTjlwiOiBcIllcIixcbiAgICAgICAgXCLik49cIjogXCJaXCIsXG5cbiAgICAgICAgXCLik5BcIjogXCJhXCIsXG4gICAgICAgIFwi4pORXCI6IFwiYlwiLFxuICAgICAgICBcIuKTklwiOiBcImNcIixcbiAgICAgICAgXCLik5NcIjogXCJkXCIsXG4gICAgICAgIFwi4pOUXCI6IFwiZVwiLFxuICAgICAgICBcIuKTlVwiOiBcImZcIixcbiAgICAgICAgXCLik5ZcIjogXCJnXCIsXG4gICAgICAgIFwi4pOXXCI6IFwiaFwiLFxuICAgICAgICBcIuKTmFwiOiBcImlcIixcbiAgICAgICAgXCLik5lcIjogXCJqXCIsXG4gICAgICAgIFwi4pOaXCI6IFwia1wiLFxuICAgICAgICBcIuKTm1wiOiBcImxcIixcbiAgICAgICAgXCLik5xcIjogXCJtXCIsXG4gICAgICAgIFwi4pOdXCI6IFwiblwiLFxuICAgICAgICBcIuKTnlwiOiBcIm9cIixcbiAgICAgICAgXCLik59cIjogXCJwXCIsXG4gICAgICAgIFwi4pOgXCI6IFwicVwiLFxuICAgICAgICBcIuKToVwiOiBcInJcIixcbiAgICAgICAgXCLik6JcIjogXCJzXCIsXG4gICAgICAgIFwi4pOjXCI6IFwidFwiLFxuICAgICAgICBcIuKTpFwiOiBcInVcIixcbiAgICAgICAgXCLik6ZcIjogXCJ2XCIsXG4gICAgICAgIFwi4pOlXCI6IFwid1wiLFxuICAgICAgICBcIuKTp1wiOiBcInhcIixcbiAgICAgICAgXCLik6hcIjogXCJ5XCIsXG4gICAgICAgIFwi4pOpXCI6IFwielwiLFxuXG4gICAgICAgIC8vIHN5bWJvbHNcbiAgICAgICAgJ+KAnCc6ICdcIicsXG4gICAgICAgICfigJ0nOiAnXCInLFxuICAgICAgICAn4oCYJzogXCInXCIsXG4gICAgICAgICfigJknOiBcIidcIixcbiAgICAgICAgJ+KIgic6ICdkJyxcbiAgICAgICAgJ8aSJzogJ2YnLFxuICAgICAgICAn4oSiJzogJyhUTSknLFxuICAgICAgICAnwqknOiAnKEMpJyxcbiAgICAgICAgJ8WTJzogJ29lJyxcbiAgICAgICAgJ8WSJzogJ09FJyxcbiAgICAgICAgJ8KuJzogJyhSKScsXG4gICAgICAgICfigKAnOiAnKycsXG4gICAgICAgICfihKAnOiAnKFNNKScsXG4gICAgICAgICfigKYnOiAnLi4uJyxcbiAgICAgICAgJ8uaJzogJ28nLFxuICAgICAgICAnwronOiAnbycsXG4gICAgICAgICfCqic6ICdhJyxcbiAgICAgICAgJ+KAoic6ICcqJyxcbiAgICAgICAgJ+GBiic6ICcsJyxcbiAgICAgICAgJ+GBiyc6ICcuJyxcblxuICAgICAgICAvLyBjdXJyZW5jeVxuICAgICAgICAnJCc6ICdVU0QnLFxuICAgICAgICAn4oKsJzogJ0VVUicsXG4gICAgICAgICfigqInOiAnQlJOJyxcbiAgICAgICAgJ+KCoyc6ICdGUkYnLFxuICAgICAgICAnwqMnOiAnR0JQJyxcbiAgICAgICAgJ+KCpCc6ICdJVEwnLFxuICAgICAgICAn4oKmJzogJ05HTicsXG4gICAgICAgICfigqcnOiAnRVNQJyxcbiAgICAgICAgJ+KCqSc6ICdLUlcnLFxuICAgICAgICAn4oKqJzogJ0lMUycsXG4gICAgICAgICfigqsnOiAnVk5EJyxcbiAgICAgICAgJ+KCrSc6ICdMQUsnLFxuICAgICAgICAn4oKuJzogJ01OVCcsXG4gICAgICAgICfigq8nOiAnR1JEJyxcbiAgICAgICAgJ+KCsSc6ICdBUlMnLFxuICAgICAgICAn4oKyJzogJ1BZRycsXG4gICAgICAgICfigrMnOiAnQVJBJyxcbiAgICAgICAgJ+KCtCc6ICdVQUgnLFxuICAgICAgICAn4oK1JzogJ0dIUycsXG4gICAgICAgICfCoic6ICdjZW50JyxcbiAgICAgICAgJ8KlJzogJ0NOWScsXG4gICAgICAgICflhYMnOiAnQ05ZJyxcbiAgICAgICAgJ+WGhic6ICdZRU4nLFxuICAgICAgICAn77e8JzogJ0lSUicsXG4gICAgICAgICfigqAnOiAnRVdFJyxcbiAgICAgICAgJ+C4vyc6ICdUSEInLFxuICAgICAgICAn4oKoJzogJ0lOUicsXG4gICAgICAgICfigrknOiAnSU5SJyxcbiAgICAgICAgJ+KCsCc6ICdQRicsXG4gICAgICAgICfigronOiAnVFJZJyxcbiAgICAgICAgJ9iLJzogJ0FGTicsXG4gICAgICAgICfigrwnOiAnQVpOJyxcbiAgICAgICAgJ9C70LInOiAnQkdOJyxcbiAgICAgICAgJ+Gfmyc6ICdLSFInLFxuICAgICAgICAn4oKhJzogJ0NSQycsXG4gICAgICAgICfigrgnOiAnS1pUJyxcbiAgICAgICAgJ9C00LXQvSc6ICdNS0QnLFxuICAgICAgICAnesWCJzogJ1BMTicsXG4gICAgICAgICfigr0nOiAnUlVCJyxcbiAgICAgICAgJ+KCvic6ICdHRUwnXG5cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogc3BlY2lhbCBsb29rIGFoZWFkIGNoYXJhY3RlciBhcnJheVxuICAgICAqIFRoZXNlIGNoYXJhY3RlcnMgZm9ybSB3aXRoIGNvbnNvbmFudHMgdG8gYmVjb21lICdzaW5nbGUnL2NvbnNvbmFudCBjb21ib1xuICAgICAqIEB0eXBlIFtBcnJheV1cbiAgICAgKi9cbiAgICB2YXIgbG9va0FoZWFkQ2hhckFycmF5ID0gW1xuICAgICAgICAvLyBidXJtZXNlXG4gICAgICAgICfhgLonLFxuXG4gICAgICAgIC8vIERoaXZlaGlcbiAgICAgICAgJ96wJ1xuICAgIF07XG5cbiAgICAvKipcbiAgICAgKiBkaWF0cmljTWFwIGZvciBsYW5ndWFnZXMgd2hlcmUgdHJhbnNsaXRlcmF0aW9uIGNoYW5nZXMgZW50aXJlbHkgYXMgbW9yZSBkaWF0cmljcyBhcmUgYWRkZWRcbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqL1xuICAgIHZhciBkaWF0cmljTWFwID0ge1xuICAgICAgICAvLyBCdXJtZXNlXG4gICAgICAgIC8vIGRlcGVuZGVudCB2b3dlbHNcbiAgICAgICAgJ+GArCc6ICdhJyxcbiAgICAgICAgJ+GAqyc6ICdhJyxcbiAgICAgICAgJ+GAsSc6ICdlJyxcbiAgICAgICAgJ+GAsic6ICdlJyxcbiAgICAgICAgJ+GArSc6ICdpJyxcbiAgICAgICAgJ+GAric6ICdpJyxcbiAgICAgICAgJ+GAreGAryc6ICdvJyxcbiAgICAgICAgJ+GAryc6ICd1JyxcbiAgICAgICAgJ+GAsCc6ICd1JyxcbiAgICAgICAgJ+GAseGAq+GAhOGAuic6ICdhdW5nJyxcbiAgICAgICAgJ+GAseGArCc6ICdhdycsXG4gICAgICAgICfhgLHhgKzhgLonOiAnYXcnLFxuICAgICAgICAn4YCx4YCrJzogJ2F3JyxcbiAgICAgICAgJ+GAseGAq+GAuic6ICdhdycsXG4gICAgICAgICfhgLonOiAn4YC6JywgLy8gdGhpcyBpcyBzcGVjaWFsIGNhc2UgYnV0IHRoZSBjaGFyYWN0ZXIgd2lsbCBiZSBjb252ZXJ0ZWQgdG8gbGF0aW4gaW4gdGhlIGNvZGVcbiAgICAgICAgJ+GAgOGAuic6ICdldCcsXG4gICAgICAgICfhgK3hgK/hgIDhgLonOiAnYWlrJyxcbiAgICAgICAgJ+GAseGArOGAgOGAuic6ICdhdWsnLFxuICAgICAgICAn4YCE4YC6JzogJ2luJyxcbiAgICAgICAgJ+GAreGAr+GAhOGAuic6ICdhaW5nJyxcbiAgICAgICAgJ+GAseGArOGAhOGAuic6ICdhdW5nJyxcbiAgICAgICAgJ+GAheGAuic6ICdpdCcsXG4gICAgICAgICfhgIrhgLonOiAnaScsXG4gICAgICAgICfhgJDhgLonOiAnYXQnLFxuICAgICAgICAn4YCt4YCQ4YC6JzogJ2VpaycsXG4gICAgICAgICfhgK/hgJDhgLonOiAnb2snLFxuICAgICAgICAn4YC94YCQ4YC6JzogJ3V0JyxcbiAgICAgICAgJ+GAseGAkOGAuic6ICdpdCcsXG4gICAgICAgICfhgJLhgLonOiAnZCcsXG4gICAgICAgICfhgK3hgK/hgJLhgLonOiAnb2snLFxuICAgICAgICAn4YCv4YCS4YC6JzogJ2FpdCcsXG4gICAgICAgICfhgJThgLonOiAnYW4nLFxuICAgICAgICAn4YCs4YCU4YC6JzogJ2FuJyxcbiAgICAgICAgJ+GAreGAlOGAuic6ICdlaW4nLFxuICAgICAgICAn4YCv4YCU4YC6JzogJ29uJyxcbiAgICAgICAgJ+GAveGAlOGAuic6ICd1bicsXG4gICAgICAgICfhgJXhgLonOiAnYXQnLFxuICAgICAgICAn4YCt4YCV4YC6JzogJ2VpaycsXG4gICAgICAgICfhgK/hgJXhgLonOiAnb2snLFxuICAgICAgICAn4YC94YCV4YC6JzogJ3V0JyxcbiAgICAgICAgJ+GAlOGAuuGAr+GAleGAuic6ICdudWInLFxuICAgICAgICAn4YCZ4YC6JzogJ2FuJyxcbiAgICAgICAgJ+GAreGAmeGAuic6ICdlaW4nLFxuICAgICAgICAn4YCv4YCZ4YC6JzogJ29uJyxcbiAgICAgICAgJ+GAveGAmeGAuic6ICd1bicsXG4gICAgICAgICfhgJrhgLonOiAnZScsXG4gICAgICAgICfhgK3hgK/hgJzhgLonOiAnb2wnLFxuICAgICAgICAn4YCJ4YC6JzogJ2luJyxcbiAgICAgICAgJ+GAtic6ICdhbicsXG4gICAgICAgICfhgK3hgLYnOiAnZWluJyxcbiAgICAgICAgJ+GAr+GAtic6ICdvbicsXG5cbiAgICAgICAgLy8gRGhpdmVoaVxuICAgICAgICAn3qbeh96wJzogJ2FoJyxcbiAgICAgICAgJ96m3oHesCc6ICdhaCdcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogbGFuZ0NoYXJNYXAgbGFuZ3VhZ2Ugc3BlY2lmaWMgY2hhcmFjdGVycyB0cmFuc2xhdGlvbnNcbiAgICAgKiBAdHlwZSAgIHtPYmplY3R9XG4gICAgICovXG4gICAgdmFyIGxhbmdDaGFyTWFwID0ge1xuICAgICAgICAnZW4nOiB7fSwgLy8gZGVmYXVsdCBsYW5ndWFnZVxuXG4gICAgICAgICdheic6IHsgLy8gQXplcmJhaWphbmlcbiAgICAgICAgICAgICfDpyc6ICdjJyxcbiAgICAgICAgICAgICfJmSc6ICdlJyxcbiAgICAgICAgICAgICfEnyc6ICdnJyxcbiAgICAgICAgICAgICfEsSc6ICdpJyxcbiAgICAgICAgICAgICfDtic6ICdvJyxcbiAgICAgICAgICAgICfFnyc6ICdzJyxcbiAgICAgICAgICAgICfDvCc6ICd1JyxcbiAgICAgICAgICAgICfDhyc6ICdDJyxcbiAgICAgICAgICAgICfGjyc6ICdFJyxcbiAgICAgICAgICAgICfEnic6ICdHJyxcbiAgICAgICAgICAgICfEsCc6ICdJJyxcbiAgICAgICAgICAgICfDlic6ICdPJyxcbiAgICAgICAgICAgICfFnic6ICdTJyxcbiAgICAgICAgICAgICfDnCc6ICdVJ1xuICAgICAgICB9LFxuXG4gICAgICAgICdjcyc6IHsgLy8gQ3plY2hcbiAgICAgICAgICAgICfEjSc6ICdjJyxcbiAgICAgICAgICAgICfEjyc6ICdkJyxcbiAgICAgICAgICAgICfEmyc6ICdlJyxcbiAgICAgICAgICAgICfFiCc6ICduJyxcbiAgICAgICAgICAgICfFmSc6ICdyJyxcbiAgICAgICAgICAgICfFoSc6ICdzJyxcbiAgICAgICAgICAgICfFpSc6ICd0JyxcbiAgICAgICAgICAgICfFryc6ICd1JyxcbiAgICAgICAgICAgICfFvic6ICd6JyxcbiAgICAgICAgICAgICfEjCc6ICdDJyxcbiAgICAgICAgICAgICfEjic6ICdEJyxcbiAgICAgICAgICAgICfEmic6ICdFJyxcbiAgICAgICAgICAgICfFhyc6ICdOJyxcbiAgICAgICAgICAgICfFmCc6ICdSJyxcbiAgICAgICAgICAgICfFoCc6ICdTJyxcbiAgICAgICAgICAgICfFpCc6ICdUJyxcbiAgICAgICAgICAgICfFric6ICdVJyxcbiAgICAgICAgICAgICfFvSc6ICdaJ1xuICAgICAgICB9LFxuXG4gICAgICAgICdmaSc6IHsgLy8gRmlubmlzaFxuICAgICAgICAgICAgLy8gJ8OlJzogJ2EnLCBkdXBsaWNhdGUgc2VlIGNoYXJNYXAvbGF0aW5cbiAgICAgICAgICAgIC8vICfDhSc6ICdBJywgZHVwbGljYXRlIHNlZSBjaGFyTWFwL2xhdGluXG4gICAgICAgICAgICAnw6QnOiAnYScsIC8vIG9rXG4gICAgICAgICAgICAnw4QnOiAnQScsIC8vIG9rXG4gICAgICAgICAgICAnw7YnOiAnbycsIC8vIG9rXG4gICAgICAgICAgICAnw5YnOiAnTycgLy8gb2tcbiAgICAgICAgfSxcblxuICAgICAgICAnaHUnOiB7IC8vIEh1bmdhcmlhblxuICAgICAgICAgICAgJ8OkJzogJ2EnLCAvLyBva1xuICAgICAgICAgICAgJ8OEJzogJ0EnLCAvLyBva1xuICAgICAgICAgICAgLy8gJ8OhJzogJ2EnLCBkdXBsaWNhdGUgc2VlIGNoYXJNYXAvbGF0aW5cbiAgICAgICAgICAgIC8vICfDgSc6ICdBJywgZHVwbGljYXRlIHNlZSBjaGFyTWFwL2xhdGluXG4gICAgICAgICAgICAnw7YnOiAnbycsIC8vIG9rXG4gICAgICAgICAgICAnw5YnOiAnTycsIC8vIG9rXG4gICAgICAgICAgICAvLyAnxZEnOiAnbycsIGR1cGxpY2F0ZSBzZWUgY2hhck1hcC9sYXRpblxuICAgICAgICAgICAgLy8gJ8WQJzogJ08nLCBkdXBsaWNhdGUgc2VlIGNoYXJNYXAvbGF0aW5cbiAgICAgICAgICAgICfDvCc6ICd1JyxcbiAgICAgICAgICAgICfDnCc6ICdVJyxcbiAgICAgICAgICAgICfFsSc6ICd1JyxcbiAgICAgICAgICAgICfFsCc6ICdVJ1xuICAgICAgICB9LFxuXG4gICAgICAgICdsdCc6IHsgLy8gTGl0aHVhbmlhblxuICAgICAgICAgICAgJ8SFJzogJ2EnLFxuICAgICAgICAgICAgJ8SNJzogJ2MnLFxuICAgICAgICAgICAgJ8SZJzogJ2UnLFxuICAgICAgICAgICAgJ8SXJzogJ2UnLFxuICAgICAgICAgICAgJ8SvJzogJ2knLFxuICAgICAgICAgICAgJ8WhJzogJ3MnLFxuICAgICAgICAgICAgJ8WzJzogJ3UnLFxuICAgICAgICAgICAgJ8WrJzogJ3UnLFxuICAgICAgICAgICAgJ8W+JzogJ3onLFxuICAgICAgICAgICAgJ8SEJzogJ0EnLFxuICAgICAgICAgICAgJ8SMJzogJ0MnLFxuICAgICAgICAgICAgJ8SYJzogJ0UnLFxuICAgICAgICAgICAgJ8SWJzogJ0UnLFxuICAgICAgICAgICAgJ8SuJzogJ0knLFxuICAgICAgICAgICAgJ8WgJzogJ1MnLFxuICAgICAgICAgICAgJ8WyJzogJ1UnLFxuICAgICAgICAgICAgJ8WqJzogJ1UnXG4gICAgICAgIH0sXG5cbiAgICAgICAgJ2x2JzogeyAvLyBMYXR2aWFuXG4gICAgICAgICAgICAnxIEnOiAnYScsXG4gICAgICAgICAgICAnxI0nOiAnYycsXG4gICAgICAgICAgICAnxJMnOiAnZScsXG4gICAgICAgICAgICAnxKMnOiAnZycsXG4gICAgICAgICAgICAnxKsnOiAnaScsXG4gICAgICAgICAgICAnxLcnOiAnaycsXG4gICAgICAgICAgICAnxLwnOiAnbCcsXG4gICAgICAgICAgICAnxYYnOiAnbicsXG4gICAgICAgICAgICAnxaEnOiAncycsXG4gICAgICAgICAgICAnxasnOiAndScsXG4gICAgICAgICAgICAnxb4nOiAneicsXG4gICAgICAgICAgICAnxIAnOiAnQScsXG4gICAgICAgICAgICAnxIwnOiAnQycsXG4gICAgICAgICAgICAnxJInOiAnRScsXG4gICAgICAgICAgICAnxKInOiAnRycsXG4gICAgICAgICAgICAnxKonOiAnaScsXG4gICAgICAgICAgICAnxLYnOiAnaycsXG4gICAgICAgICAgICAnxLsnOiAnTCcsXG4gICAgICAgICAgICAnxYUnOiAnTicsXG4gICAgICAgICAgICAnxaAnOiAnUycsXG4gICAgICAgICAgICAnxaonOiAndScsXG4gICAgICAgICAgICAnxb0nOiAnWidcbiAgICAgICAgfSxcblxuICAgICAgICAncGwnOiB7IC8vIFBvbGlzaFxuICAgICAgICAgICAgJ8SFJzogJ2EnLFxuICAgICAgICAgICAgJ8SHJzogJ2MnLFxuICAgICAgICAgICAgJ8SZJzogJ2UnLFxuICAgICAgICAgICAgJ8WCJzogJ2wnLFxuICAgICAgICAgICAgJ8WEJzogJ24nLFxuICAgICAgICAgICAgJ8OzJzogJ28nLFxuICAgICAgICAgICAgJ8WbJzogJ3MnLFxuICAgICAgICAgICAgJ8W6JzogJ3onLFxuICAgICAgICAgICAgJ8W8JzogJ3onLFxuICAgICAgICAgICAgJ8SEJzogJ0EnLFxuICAgICAgICAgICAgJ8SGJzogJ0MnLFxuICAgICAgICAgICAgJ8SYJzogJ2UnLFxuICAgICAgICAgICAgJ8WBJzogJ0wnLFxuICAgICAgICAgICAgJ8WDJzogJ04nLFxuICAgICAgICAgICAgJ8OTJzogJ08nLFxuICAgICAgICAgICAgJ8WaJzogJ1MnLFxuICAgICAgICAgICAgJ8W5JzogJ1onLFxuICAgICAgICAgICAgJ8W7JzogJ1onXG4gICAgICAgIH0sXG5cbiAgICAgICAgJ3N2JzogeyAvLyBTd2VkaXNoXG4gICAgICAgICAgICAvLyAnw6UnOiAnYScsIGR1cGxpY2F0ZSBzZWUgY2hhck1hcC9sYXRpblxuICAgICAgICAgICAgLy8gJ8OFJzogJ0EnLCBkdXBsaWNhdGUgc2VlIGNoYXJNYXAvbGF0aW5cbiAgICAgICAgICAgICfDpCc6ICdhJywgLy8gb2tcbiAgICAgICAgICAgICfDhCc6ICdBJywgLy8gb2tcbiAgICAgICAgICAgICfDtic6ICdvJywgLy8gb2tcbiAgICAgICAgICAgICfDlic6ICdPJyAvLyBva1xuICAgICAgICB9LFxuXG4gICAgICAgICdzayc6IHsgLy8gU2xvdmFrXG4gICAgICAgICAgICAnw6QnOiAnYScsXG4gICAgICAgICAgICAnw4QnOiAnQSdcbiAgICAgICAgfSxcblxuICAgICAgICAnc3InOiB7IC8vIFNlcmJpYW5cbiAgICAgICAgICAgICfRmSc6ICdsaicsXG4gICAgICAgICAgICAn0ZonOiAnbmonLFxuICAgICAgICAgICAgJ9CJJzogJ0xqJyxcbiAgICAgICAgICAgICfQiic6ICdOaicsXG4gICAgICAgICAgICAnxJEnOiAnZGonLFxuICAgICAgICAgICAgJ8SQJzogJ0RqJ1xuICAgICAgICB9LFxuXG4gICAgICAgICd0cic6IHsgLy8gVHVya2lzaFxuICAgICAgICAgICAgJ8OcJzogJ1UnLFxuICAgICAgICAgICAgJ8OWJzogJ08nLFxuICAgICAgICAgICAgJ8O8JzogJ3UnLFxuICAgICAgICAgICAgJ8O2JzogJ28nXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogc3ltYm9sTWFwIGxhbmd1YWdlIHNwZWNpZmljIHN5bWJvbCB0cmFuc2xhdGlvbnNcbiAgICAgKiB0cmFuc2xhdGlvbnMgbXVzdCBiZSB0cmFuc2xpdGVyYXRlZCBhbHJlYWR5XG4gICAgICogQHR5cGUgICB7T2JqZWN0fVxuICAgICAqL1xuICAgIHZhciBzeW1ib2xNYXAgPSB7XG4gICAgICAgICdhcic6IHtcbiAgICAgICAgICAgICfiiIYnOiAnZGVsdGEnLFxuICAgICAgICAgICAgJ+KInic6ICdsYS1uaWhheWEnLFxuICAgICAgICAgICAgJ+KZpSc6ICdob2InLFxuICAgICAgICAgICAgJyYnOiAnd2EnLFxuICAgICAgICAgICAgJ3wnOiAnYXcnLFxuICAgICAgICAgICAgJzwnOiAnYXFhbC1tZW4nLFxuICAgICAgICAgICAgJz4nOiAnYWtiYXItbWVuJyxcbiAgICAgICAgICAgICfiiJEnOiAnbWFqbW91JyxcbiAgICAgICAgICAgICfCpCc6ICdvbWxhJ1xuICAgICAgICB9LFxuXG4gICAgICAgICdheic6IHt9LFxuXG4gICAgICAgICdjYSc6IHtcbiAgICAgICAgICAgICfiiIYnOiAnZGVsdGEnLFxuICAgICAgICAgICAgJ+KInic6ICdpbmZpbml0JyxcbiAgICAgICAgICAgICfimaUnOiAnYW1vcicsXG4gICAgICAgICAgICAnJic6ICdpJyxcbiAgICAgICAgICAgICd8JzogJ28nLFxuICAgICAgICAgICAgJzwnOiAnbWVueXMgcXVlJyxcbiAgICAgICAgICAgICc+JzogJ21lcyBxdWUnLFxuICAgICAgICAgICAgJ+KIkSc6ICdzdW1hIGRlbHMnLFxuICAgICAgICAgICAgJ8KkJzogJ21vbmVkYSdcbiAgICAgICAgfSxcblxuICAgICAgICAnY3MnOiB7XG4gICAgICAgICAgICAn4oiGJzogJ2RlbHRhJyxcbiAgICAgICAgICAgICfiiJ4nOiAnbmVrb25lY25vJyxcbiAgICAgICAgICAgICfimaUnOiAnbGFza2EnLFxuICAgICAgICAgICAgJyYnOiAnYScsXG4gICAgICAgICAgICAnfCc6ICduZWJvJyxcbiAgICAgICAgICAgICc8JzogJ21lbnNpIG5leicsXG4gICAgICAgICAgICAnPic6ICd2ZXRzaSBuZXonLFxuICAgICAgICAgICAgJ+KIkSc6ICdzb3VjZXQnLFxuICAgICAgICAgICAgJ8KkJzogJ21lbmEnXG4gICAgICAgIH0sXG5cbiAgICAgICAgJ2RlJzoge1xuICAgICAgICAgICAgJ+KIhic6ICdkZWx0YScsXG4gICAgICAgICAgICAn4oieJzogJ3VuZW5kbGljaCcsXG4gICAgICAgICAgICAn4pmlJzogJ0xpZWJlJyxcbiAgICAgICAgICAgICcmJzogJ3VuZCcsXG4gICAgICAgICAgICAnfCc6ICdvZGVyJyxcbiAgICAgICAgICAgICc8JzogJ2tsZWluZXIgYWxzJyxcbiAgICAgICAgICAgICc+JzogJ2dyb2Vzc2VyIGFscycsXG4gICAgICAgICAgICAn4oiRJzogJ1N1bW1lIHZvbicsXG4gICAgICAgICAgICAnwqQnOiAnV2FlaHJ1bmcnXG4gICAgICAgIH0sXG5cbiAgICAgICAgJ2R2Jzoge1xuICAgICAgICAgICAgJ+KIhic6ICdkZWx0YScsXG4gICAgICAgICAgICAn4oieJzogJ2tvbHVudWxhYScsXG4gICAgICAgICAgICAn4pmlJzogJ2xvYWJpJyxcbiAgICAgICAgICAgICcmJzogJ2FhaScsXG4gICAgICAgICAgICAnfCc6ICdub29uZWUnLFxuICAgICAgICAgICAgJzwnOiAnYWggdnVyZSBrdWRhJyxcbiAgICAgICAgICAgICc+JzogJ2FoIHZ1cmUgYm9kdScsXG4gICAgICAgICAgICAn4oiRJzogJ2p1bXVsYScsXG4gICAgICAgICAgICAnwqQnOiAnZmFpc2FhJ1xuICAgICAgICB9LFxuXG4gICAgICAgICdlbic6IHtcbiAgICAgICAgICAgICfiiIYnOiAnZGVsdGEnLFxuICAgICAgICAgICAgJ+KInic6ICdpbmZpbml0eScsXG4gICAgICAgICAgICAn4pmlJzogJ2xvdmUnLFxuICAgICAgICAgICAgJyYnOiAnYW5kJyxcbiAgICAgICAgICAgICd8JzogJ29yJyxcbiAgICAgICAgICAgICc8JzogJ2xlc3MgdGhhbicsXG4gICAgICAgICAgICAnPic6ICdncmVhdGVyIHRoYW4nLFxuICAgICAgICAgICAgJ+KIkSc6ICdzdW0nLFxuICAgICAgICAgICAgJ8KkJzogJ2N1cnJlbmN5J1xuICAgICAgICB9LFxuXG4gICAgICAgICdlcyc6IHtcbiAgICAgICAgICAgICfiiIYnOiAnZGVsdGEnLFxuICAgICAgICAgICAgJ+KInic6ICdpbmZpbml0bycsXG4gICAgICAgICAgICAn4pmlJzogJ2Ftb3InLFxuICAgICAgICAgICAgJyYnOiAneScsXG4gICAgICAgICAgICAnfCc6ICd1JyxcbiAgICAgICAgICAgICc8JzogJ21lbm9zIHF1ZScsXG4gICAgICAgICAgICAnPic6ICdtYXMgcXVlJyxcbiAgICAgICAgICAgICfiiJEnOiAnc3VtYSBkZSBsb3MnLFxuICAgICAgICAgICAgJ8KkJzogJ21vbmVkYSdcbiAgICAgICAgfSxcblxuICAgICAgICAnZmEnOiB7XG4gICAgICAgICAgICAn4oiGJzogJ2RlbHRhJyxcbiAgICAgICAgICAgICfiiJ4nOiAnYmktbmFoYXlhdCcsXG4gICAgICAgICAgICAn4pmlJzogJ2VzaGdoJyxcbiAgICAgICAgICAgICcmJzogJ3ZhJyxcbiAgICAgICAgICAgICd8JzogJ3lhJyxcbiAgICAgICAgICAgICc8JzogJ2thbXRhci1heicsXG4gICAgICAgICAgICAnPic6ICdiaXNodGFyLWF6JyxcbiAgICAgICAgICAgICfiiJEnOiAnbWFqbW9vZScsXG4gICAgICAgICAgICAnwqQnOiAndmFoZWQnXG4gICAgICAgIH0sXG5cbiAgICAgICAgJ2ZpJzoge1xuICAgICAgICAgICAgJ+KIhic6ICdkZWx0YScsXG4gICAgICAgICAgICAn4oieJzogJ2FhcmV0dG9teXlzJyxcbiAgICAgICAgICAgICfimaUnOiAncmFra2F1cycsXG4gICAgICAgICAgICAnJic6ICdqYScsXG4gICAgICAgICAgICAnfCc6ICd0YWknLFxuICAgICAgICAgICAgJzwnOiAncGllbmVtcGkga3VpbicsXG4gICAgICAgICAgICAnPic6ICdzdXVyZW1waSBrdWluJyxcbiAgICAgICAgICAgICfiiJEnOiAnc3VtbWEnLFxuICAgICAgICAgICAgJ8KkJzogJ3ZhbHV1dHRhJ1xuICAgICAgICB9LFxuXG4gICAgICAgICdmcic6IHtcbiAgICAgICAgICAgICfiiIYnOiAnZGVsdGEnLFxuICAgICAgICAgICAgJ+KInic6ICdpbmZpbmltZW50JyxcbiAgICAgICAgICAgICfimaUnOiAnQW1vdXInLFxuICAgICAgICAgICAgJyYnOiAnZXQnLFxuICAgICAgICAgICAgJ3wnOiAnb3UnLFxuICAgICAgICAgICAgJzwnOiAnbW9pbnMgcXVlJyxcbiAgICAgICAgICAgICc+JzogJ3N1cGVyaWV1cmUgYScsXG4gICAgICAgICAgICAn4oiRJzogJ3NvbW1lIGRlcycsXG4gICAgICAgICAgICAnwqQnOiAnbW9ubmFpZSdcbiAgICAgICAgfSxcblxuICAgICAgICAnZ2UnOiB7XG4gICAgICAgICAgICAn4oiGJzogJ2RlbHRhJyxcbiAgICAgICAgICAgICfiiJ4nOiAndXNhc3J1bG9iYScsXG4gICAgICAgICAgICAn4pmlJzogJ3NpcXZhcnVsaScsXG4gICAgICAgICAgICAnJic6ICdkYScsXG4gICAgICAgICAgICAnfCc6ICdhbicsXG4gICAgICAgICAgICAnPCc6ICduYWtsZWJpJyxcbiAgICAgICAgICAgICc+JzogJ21ldGknLFxuICAgICAgICAgICAgJ+KIkSc6ICdqYW1pJyxcbiAgICAgICAgICAgICfCpCc6ICd2YWx1dGEnXG4gICAgICAgIH0sXG5cbiAgICAgICAgJ2dyJzoge30sXG5cbiAgICAgICAgJ2h1Jzoge1xuICAgICAgICAgICAgJ+KIhic6ICdkZWx0YScsXG4gICAgICAgICAgICAn4oieJzogJ3ZlZ3RlbGVuJyxcbiAgICAgICAgICAgICfimaUnOiAnc3plcmVsZW0nLFxuICAgICAgICAgICAgJyYnOiAnZXMnLFxuICAgICAgICAgICAgJ3wnOiAndmFneScsXG4gICAgICAgICAgICAnPCc6ICdraXNlYmIgbWludCcsXG4gICAgICAgICAgICAnPic6ICduYWd5b2JiIG1pbnQnLFxuICAgICAgICAgICAgJ+KIkSc6ICdzenVtbWEnLFxuICAgICAgICAgICAgJ8KkJzogJ3BlbnpuZW0nXG4gICAgICAgIH0sXG5cbiAgICAgICAgJ2l0Jzoge1xuICAgICAgICAgICAgJ+KIhic6ICdkZWx0YScsXG4gICAgICAgICAgICAn4oieJzogJ2luZmluaXRvJyxcbiAgICAgICAgICAgICfimaUnOiAnYW1vcmUnLFxuICAgICAgICAgICAgJyYnOiAnZScsXG4gICAgICAgICAgICAnfCc6ICdvJyxcbiAgICAgICAgICAgICc8JzogJ21pbm9yZSBkaScsXG4gICAgICAgICAgICAnPic6ICdtYWdnaW9yZSBkaScsXG4gICAgICAgICAgICAn4oiRJzogJ3NvbW1hJyxcbiAgICAgICAgICAgICfCpCc6ICdtb25ldGEnXG4gICAgICAgIH0sXG5cbiAgICAgICAgJ2x0Jzoge1xuICAgICAgICAgICAgJ+KIhic6ICdkZWx0YScsXG4gICAgICAgICAgICAn4oieJzogJ2JlZ2FseWJlJyxcbiAgICAgICAgICAgICfimaUnOiAnbWVpbGUnLFxuICAgICAgICAgICAgJyYnOiAnaXInLFxuICAgICAgICAgICAgJ3wnOiAnYXInLFxuICAgICAgICAgICAgJzwnOiAnbWF6aWF1IG5laScsXG4gICAgICAgICAgICAnPic6ICdkYXVnaWF1IG5laScsXG4gICAgICAgICAgICAn4oiRJzogJ3N1bWEnLFxuICAgICAgICAgICAgJ8KkJzogJ3ZhbGl1dGEnXG4gICAgICAgIH0sXG5cbiAgICAgICAgJ2x2Jzoge1xuICAgICAgICAgICAgJ+KIhic6ICdkZWx0YScsXG4gICAgICAgICAgICAn4oieJzogJ2JlemdhbGliYScsXG4gICAgICAgICAgICAn4pmlJzogJ21pbGVzdGliYScsXG4gICAgICAgICAgICAnJic6ICd1bicsXG4gICAgICAgICAgICAnfCc6ICd2YWknLFxuICAgICAgICAgICAgJzwnOiAnbWF6YWsgbmVrYScsXG4gICAgICAgICAgICAnPic6ICdsaWVsYWtzIG5la2EnLFxuICAgICAgICAgICAgJ+KIkSc6ICdzdW1tYScsXG4gICAgICAgICAgICAnwqQnOiAndmFsdXRhJ1xuICAgICAgICB9LFxuXG4gICAgICAgICdteSc6IHtcbiAgICAgICAgICAgICfiiIYnOiAna3dhaGtoeWFldCcsXG4gICAgICAgICAgICAn4oieJzogJ2FzYW9uYXNtZScsXG4gICAgICAgICAgICAn4pmlJzogJ2FraHlhaXQnLFxuICAgICAgICAgICAgJyYnOiAnbmhpbicsXG4gICAgICAgICAgICAnfCc6ICd0aG8nLFxuICAgICAgICAgICAgJzwnOiAnbmdldGhhdycsXG4gICAgICAgICAgICAnPic6ICdreWl0aGF3JyxcbiAgICAgICAgICAgICfiiJEnOiAncGF1bmdsZCcsXG4gICAgICAgICAgICAnwqQnOiAnbmd3ZWt5ZSdcbiAgICAgICAgfSxcblxuICAgICAgICAnbWsnOiB7fSxcblxuICAgICAgICAnbmwnOiB7XG4gICAgICAgICAgICAn4oiGJzogJ2RlbHRhJyxcbiAgICAgICAgICAgICfiiJ4nOiAnb25laW5kaWcnLFxuICAgICAgICAgICAgJ+KZpSc6ICdsaWVmZGUnLFxuICAgICAgICAgICAgJyYnOiAnZW4nLFxuICAgICAgICAgICAgJ3wnOiAnb2YnLFxuICAgICAgICAgICAgJzwnOiAna2xlaW5lciBkYW4nLFxuICAgICAgICAgICAgJz4nOiAnZ3JvdGVyIGRhbicsXG4gICAgICAgICAgICAn4oiRJzogJ3NvbScsXG4gICAgICAgICAgICAnwqQnOiAndmFsdXRhJ1xuICAgICAgICB9LFxuXG4gICAgICAgICdwbCc6IHtcbiAgICAgICAgICAgICfiiIYnOiAnZGVsdGEnLFxuICAgICAgICAgICAgJ+KInic6ICduaWVza29uY3pvbm9zYycsXG4gICAgICAgICAgICAn4pmlJzogJ21pbG9zYycsXG4gICAgICAgICAgICAnJic6ICdpJyxcbiAgICAgICAgICAgICd8JzogJ2x1YicsXG4gICAgICAgICAgICAnPCc6ICdtbmllanN6ZSBuaXonLFxuICAgICAgICAgICAgJz4nOiAnd2lla3N6ZSBuaXonLFxuICAgICAgICAgICAgJ+KIkSc6ICdzdW1hJyxcbiAgICAgICAgICAgICfCpCc6ICd3YWx1dGEnXG4gICAgICAgIH0sXG5cbiAgICAgICAgJ3B0Jzoge1xuICAgICAgICAgICAgJ+KIhic6ICdkZWx0YScsXG4gICAgICAgICAgICAn4oieJzogJ2luZmluaXRvJyxcbiAgICAgICAgICAgICfimaUnOiAnYW1vcicsXG4gICAgICAgICAgICAnJic6ICdlJyxcbiAgICAgICAgICAgICd8JzogJ291JyxcbiAgICAgICAgICAgICc8JzogJ21lbm9yIHF1ZScsXG4gICAgICAgICAgICAnPic6ICdtYWlvciBxdWUnLFxuICAgICAgICAgICAgJ+KIkSc6ICdzb21hJyxcbiAgICAgICAgICAgICfCpCc6ICdtb2VkYSdcbiAgICAgICAgfSxcblxuICAgICAgICAncm8nOiB7XG4gICAgICAgICAgICAn4oiGJzogJ2RlbHRhJyxcbiAgICAgICAgICAgICfiiJ4nOiAnaW5maW5pdCcsXG4gICAgICAgICAgICAn4pmlJzogJ2RyYWdvc3RlJyxcbiAgICAgICAgICAgICcmJzogJ3NpJyxcbiAgICAgICAgICAgICd8JzogJ3NhdScsXG4gICAgICAgICAgICAnPCc6ICdtYWkgbWljIGNhJyxcbiAgICAgICAgICAgICc+JzogJ21haSBtYXJlIGNhJyxcbiAgICAgICAgICAgICfiiJEnOiAnc3VtYScsXG4gICAgICAgICAgICAnwqQnOiAndmFsdXRhJ1xuICAgICAgICB9LFxuXG4gICAgICAgICdydSc6IHtcbiAgICAgICAgICAgICfiiIYnOiAnZGVsdGEnLFxuICAgICAgICAgICAgJ+KInic6ICdiZXNrb25lY2hubycsXG4gICAgICAgICAgICAn4pmlJzogJ2x1Ym92JyxcbiAgICAgICAgICAgICcmJzogJ2knLFxuICAgICAgICAgICAgJ3wnOiAnaWxpJyxcbiAgICAgICAgICAgICc8JzogJ21lbnNoZScsXG4gICAgICAgICAgICAnPic6ICdib2xzaGUnLFxuICAgICAgICAgICAgJ+KIkSc6ICdzdW1tYScsXG4gICAgICAgICAgICAnwqQnOiAndmFsanV0YSdcbiAgICAgICAgfSxcblxuICAgICAgICAnc2snOiB7XG4gICAgICAgICAgICAn4oiGJzogJ2RlbHRhJyxcbiAgICAgICAgICAgICfiiJ4nOiAnbmVrb25lY25vJyxcbiAgICAgICAgICAgICfimaUnOiAnbGFza2EnLFxuICAgICAgICAgICAgJyYnOiAnYScsXG4gICAgICAgICAgICAnfCc6ICdhbGVibycsXG4gICAgICAgICAgICAnPCc6ICdtZW5laiBha28nLFxuICAgICAgICAgICAgJz4nOiAndmlhYyBha28nLFxuICAgICAgICAgICAgJ+KIkSc6ICdzdWNldCcsXG4gICAgICAgICAgICAnwqQnOiAnbWVuYSdcbiAgICAgICAgfSxcblxuICAgICAgICAnc3InOiB7fSxcblxuICAgICAgICAndHInOiB7XG4gICAgICAgICAgICAn4oiGJzogJ2RlbHRhJyxcbiAgICAgICAgICAgICfiiJ4nOiAnc29uc3V6bHVrJyxcbiAgICAgICAgICAgICfimaUnOiAnYXNrJyxcbiAgICAgICAgICAgICcmJzogJ3ZlJyxcbiAgICAgICAgICAgICd8JzogJ3ZleWEnLFxuICAgICAgICAgICAgJzwnOiAna3VjdWt0dXInLFxuICAgICAgICAgICAgJz4nOiAnYnV5dWt0dXInLFxuICAgICAgICAgICAgJ+KIkSc6ICd0b3BsYW0nLFxuICAgICAgICAgICAgJ8KkJzogJ3BhcmEgYmlyaW1pJ1xuICAgICAgICB9LFxuXG4gICAgICAgICd1ayc6IHtcbiAgICAgICAgICAgICfiiIYnOiAnZGVsdGEnLFxuICAgICAgICAgICAgJ+KInic6ICdiZXpraW5lY2huaXN0JyxcbiAgICAgICAgICAgICfimaUnOiAnbHVib3YnLFxuICAgICAgICAgICAgJyYnOiAnaScsXG4gICAgICAgICAgICAnfCc6ICdhYm8nLFxuICAgICAgICAgICAgJzwnOiAnbWVuc2hlJyxcbiAgICAgICAgICAgICc+JzogJ2JpbHNoZScsXG4gICAgICAgICAgICAn4oiRJzogJ3N1bWEnLFxuICAgICAgICAgICAgJ8KkJzogJ3ZhbGp1dGEnXG4gICAgICAgIH0sXG5cbiAgICAgICAgJ3ZuJzoge1xuICAgICAgICAgICAgJ+KIhic6ICdkZWx0YScsXG4gICAgICAgICAgICAn4oieJzogJ3ZvIGN1YycsXG4gICAgICAgICAgICAn4pmlJzogJ3lldScsXG4gICAgICAgICAgICAnJic6ICd2YScsXG4gICAgICAgICAgICAnfCc6ICdob2FjJyxcbiAgICAgICAgICAgICc8JzogJ25obyBob24nLFxuICAgICAgICAgICAgJz4nOiAnbG9uIGhvbicsXG4gICAgICAgICAgICAn4oiRJzogJ3RvbmcnLFxuICAgICAgICAgICAgJ8KkJzogJ3RpZW4gdGUnXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIHVyaWNDaGFycyA9IFsnOycsICc/JywgJzonLCAnQCcsICcmJywgJz0nLCAnKycsICckJywgJywnLCAnLyddLmpvaW4oJycpO1xuXG4gICAgdmFyIHVyaWNOb1NsYXNoQ2hhcnMgPSBbJzsnLCAnPycsICc6JywgJ0AnLCAnJicsICc9JywgJysnLCAnJCcsICcsJ10uam9pbignJyk7XG5cbiAgICB2YXIgbWFya0NoYXJzID0gWycuJywgJyEnLCAnficsICcqJywgXCInXCIsICcoJywgJyknXS5qb2luKCcnKTtcblxuICAgIC8qKlxuICAgICAqIGdldFNsdWdcbiAgICAgKiBAcGFyYW0gIHtzdHJpbmd9IGlucHV0IGlucHV0IHN0cmluZ1xuICAgICAqIEBwYXJhbSAge29iamVjdHxzdHJpbmd9IG9wdHMgY29uZmlnIG9iamVjdCBvciBzZXBhcmF0b3Igc3RyaW5nL2NoYXJcbiAgICAgKiBAYXBpICAgIHB1YmxpY1xuICAgICAqIEByZXR1cm4ge3N0cmluZ30gIHNsdWdnaWZpZWQgc3RyaW5nXG4gICAgICovXG4gICAgdmFyIGdldFNsdWcgPSBmdW5jdGlvbiBnZXRTbHVnKGlucHV0LCBvcHRzKSB7XG4gICAgICAgIHZhciBzZXBhcmF0b3IgPSAnLSc7XG4gICAgICAgIHZhciByZXN1bHQgPSAnJztcbiAgICAgICAgdmFyIGRpYXRyaWNTdHJpbmcgPSAnJztcbiAgICAgICAgdmFyIGNvbnZlcnRTeW1ib2xzID0gdHJ1ZTtcbiAgICAgICAgdmFyIGN1c3RvbVJlcGxhY2VtZW50cyA9IHt9O1xuICAgICAgICB2YXIgbWFpbnRhaW5DYXNlO1xuICAgICAgICB2YXIgdGl0bGVDYXNlO1xuICAgICAgICB2YXIgdHJ1bmNhdGU7XG4gICAgICAgIHZhciB1cmljRmxhZztcbiAgICAgICAgdmFyIHVyaWNOb1NsYXNoRmxhZztcbiAgICAgICAgdmFyIG1hcmtGbGFnO1xuICAgICAgICB2YXIgc3ltYm9sO1xuICAgICAgICB2YXIgbGFuZ0NoYXI7XG4gICAgICAgIHZhciBsdWNreTtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIHZhciBjaDtcbiAgICAgICAgdmFyIGw7XG4gICAgICAgIHZhciBsYXN0Q2hhcldhc1N5bWJvbDtcbiAgICAgICAgdmFyIGxhc3RDaGFyV2FzRGlhdHJpYztcbiAgICAgICAgdmFyIGFsbG93ZWRDaGFycyA9ICcnO1xuXG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIG9wdHMgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBzZXBhcmF0b3IgPSBvcHRzO1xuICAgICAgICB9XG5cbiAgICAgICAgc3ltYm9sID0gc3ltYm9sTWFwLmVuO1xuICAgICAgICBsYW5nQ2hhciA9IGxhbmdDaGFyTWFwLmVuO1xuXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIG1haW50YWluQ2FzZSA9IG9wdHMubWFpbnRhaW5DYXNlIHx8IGZhbHNlO1xuICAgICAgICAgICAgY3VzdG9tUmVwbGFjZW1lbnRzID0gKG9wdHMuY3VzdG9tICYmIHR5cGVvZiBvcHRzLmN1c3RvbSA9PT0gJ29iamVjdCcpID8gb3B0cy5jdXN0b20gOiBjdXN0b21SZXBsYWNlbWVudHM7XG4gICAgICAgICAgICB0cnVuY2F0ZSA9ICgrb3B0cy50cnVuY2F0ZSA+IDEgJiYgb3B0cy50cnVuY2F0ZSkgfHwgZmFsc2U7XG4gICAgICAgICAgICB1cmljRmxhZyA9IG9wdHMudXJpYyB8fCBmYWxzZTtcbiAgICAgICAgICAgIHVyaWNOb1NsYXNoRmxhZyA9IG9wdHMudXJpY05vU2xhc2ggfHwgZmFsc2U7XG4gICAgICAgICAgICBtYXJrRmxhZyA9IG9wdHMubWFyayB8fCBmYWxzZTtcbiAgICAgICAgICAgIGNvbnZlcnRTeW1ib2xzID0gKG9wdHMuc3ltYm9scyA9PT0gZmFsc2UgfHwgb3B0cy5sYW5nID09PSBmYWxzZSkgPyBmYWxzZSA6IHRydWU7XG4gICAgICAgICAgICBzZXBhcmF0b3IgPSBvcHRzLnNlcGFyYXRvciB8fCBzZXBhcmF0b3I7XG5cbiAgICAgICAgICAgIGlmICh1cmljRmxhZykge1xuICAgICAgICAgICAgICAgIGFsbG93ZWRDaGFycyArPSB1cmljQ2hhcnM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh1cmljTm9TbGFzaEZsYWcpIHtcbiAgICAgICAgICAgICAgICBhbGxvd2VkQ2hhcnMgKz0gdXJpY05vU2xhc2hDaGFycztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG1hcmtGbGFnKSB7XG4gICAgICAgICAgICAgICAgYWxsb3dlZENoYXJzICs9IG1hcmtDaGFycztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3ltYm9sID0gKG9wdHMubGFuZyAmJiBzeW1ib2xNYXBbb3B0cy5sYW5nXSAmJiBjb252ZXJ0U3ltYm9scykgP1xuICAgICAgICAgICAgICAgIHN5bWJvbE1hcFtvcHRzLmxhbmddIDogKGNvbnZlcnRTeW1ib2xzID8gc3ltYm9sTWFwLmVuIDoge30pO1xuXG4gICAgICAgICAgICBsYW5nQ2hhciA9IChvcHRzLmxhbmcgJiYgbGFuZ0NoYXJNYXBbb3B0cy5sYW5nXSkgP1xuICAgICAgICAgICAgICAgIGxhbmdDaGFyTWFwW29wdHMubGFuZ10gOlxuICAgICAgICAgICAgICAgIG9wdHMubGFuZyA9PT0gZmFsc2UgfHwgb3B0cy5sYW5nID09PSB0cnVlID8ge30gOiBsYW5nQ2hhck1hcC5lbjtcblxuICAgICAgICAgICAgLy8gaWYgdGl0bGVDYXNlIGNvbmZpZyBpcyBhbiBBcnJheSwgcmV3cml0ZSB0byBvYmplY3QgZm9ybWF0XG4gICAgICAgICAgICBpZiAob3B0cy50aXRsZUNhc2UgJiYgdHlwZW9mIG9wdHMudGl0bGVDYXNlLmxlbmd0aCA9PT0gJ251bWJlcicgJiYgQXJyYXkucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob3B0cy50aXRsZUNhc2UpKSB7XG4gICAgICAgICAgICAgICAgb3B0cy50aXRsZUNhc2UuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgICAgICBjdXN0b21SZXBsYWNlbWVudHNbdiArICcnXSA9IHYgKyAnJztcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHRpdGxlQ2FzZSA9IHRydWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRpdGxlQ2FzZSA9ICEhb3B0cy50aXRsZUNhc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGlmIGN1c3RvbSBjb25maWcgaXMgYW4gQXJyYXksIHJld3JpdGUgdG8gb2JqZWN0IGZvcm1hdFxuICAgICAgICAgICAgaWYgKG9wdHMuY3VzdG9tICYmIHR5cGVvZiBvcHRzLmN1c3RvbS5sZW5ndGggPT09ICdudW1iZXInICYmIEFycmF5LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9wdHMuY3VzdG9tKSkge1xuICAgICAgICAgICAgICAgIG9wdHMuY3VzdG9tLmZvckVhY2goZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgICAgICAgICAgY3VzdG9tUmVwbGFjZW1lbnRzW3YgKyAnJ10gPSB2ICsgJyc7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGN1c3RvbSByZXBsYWNlbWVudHNcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGN1c3RvbVJlcGxhY2VtZW50cykuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgIHZhciByO1xuXG4gICAgICAgICAgICAgICAgaWYgKHYubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICByID0gbmV3IFJlZ0V4cCgnXFxcXGInICsgZXNjYXBlQ2hhcnModikgKyAnXFxcXGInLCAnZ2knKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByID0gbmV3IFJlZ0V4cChlc2NhcGVDaGFycyh2KSwgJ2dpJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaW5wdXQgPSBpbnB1dC5yZXBsYWNlKHIsIGN1c3RvbVJlcGxhY2VtZW50c1t2XSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gYWRkIGFsbCBjdXN0b20gcmVwbGFjZW1lbnQgdG8gYWxsb3dlZCBjaGFybGlzdFxuICAgICAgICAgICAgZm9yIChjaCBpbiBjdXN0b21SZXBsYWNlbWVudHMpIHtcbiAgICAgICAgICAgICAgICBhbGxvd2VkQ2hhcnMgKz0gY2g7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBhbGxvd2VkQ2hhcnMgKz0gc2VwYXJhdG9yO1xuXG4gICAgICAgIC8vIGVzY2FwZSBhbGwgbmVjZXNzYXJ5IGNoYXJzXG4gICAgICAgIGFsbG93ZWRDaGFycyA9IGVzY2FwZUNoYXJzKGFsbG93ZWRDaGFycyk7XG5cbiAgICAgICAgLy8gdHJpbSB3aGl0ZXNwYWNlc1xuICAgICAgICBpbnB1dCA9IGlucHV0LnJlcGxhY2UoLyheXFxzK3xcXHMrJCkvZywgJycpO1xuXG4gICAgICAgIGxhc3RDaGFyV2FzU3ltYm9sID0gZmFsc2U7XG4gICAgICAgIGxhc3RDaGFyV2FzRGlhdHJpYyA9IGZhbHNlO1xuXG4gICAgICAgIGZvciAoaSA9IDAsIGwgPSBpbnB1dC5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIGNoID0gaW5wdXRbaV07XG5cbiAgICAgICAgICAgIGlmIChpc1JlcGxhY2VkQ3VzdG9tQ2hhcihjaCwgY3VzdG9tUmVwbGFjZW1lbnRzKSkge1xuICAgICAgICAgICAgICAgIC8vIGRvbid0IGNvbnZlcnQgYSBhbHJlYWR5IGNvbnZlcnRlZCBjaGFyXG4gICAgICAgICAgICAgICAgbGFzdENoYXJXYXNTeW1ib2wgPSBmYWxzZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobGFuZ0NoYXJbY2hdKSB7XG4gICAgICAgICAgICAgICAgLy8gcHJvY2VzcyBsYW5ndWFnZSBzcGVjaWZpYyBkaWFjdHJpY3MgY2hhcnMgY29udmVyc2lvblxuICAgICAgICAgICAgICAgIGNoID0gbGFzdENoYXJXYXNTeW1ib2wgJiYgbGFuZ0NoYXJbY2hdLm1hdGNoKC9bQS1aYS16MC05XS8pID8gJyAnICsgbGFuZ0NoYXJbY2hdIDogbGFuZ0NoYXJbY2hdO1xuXG4gICAgICAgICAgICAgICAgbGFzdENoYXJXYXNTeW1ib2wgPSBmYWxzZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggaW4gY2hhck1hcCkge1xuICAgICAgICAgICAgICAgIC8vIHRoZSB0cmFuc2xpdGVyYXRpb24gY2hhbmdlcyBlbnRpcmVseSB3aGVuIHNvbWUgc3BlY2lhbCBjaGFyYWN0ZXJzIGFyZSBhZGRlZFxuICAgICAgICAgICAgICAgIGlmIChpICsgMSA8IGwgJiYgbG9va0FoZWFkQ2hhckFycmF5LmluZGV4T2YoaW5wdXRbaSArIDFdKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGRpYXRyaWNTdHJpbmcgKz0gY2g7XG4gICAgICAgICAgICAgICAgICAgIGNoID0gJyc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChsYXN0Q2hhcldhc0RpYXRyaWMgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2ggPSBkaWF0cmljTWFwW2RpYXRyaWNTdHJpbmddICsgY2hhck1hcFtjaF07XG4gICAgICAgICAgICAgICAgICAgIGRpYXRyaWNTdHJpbmcgPSAnJztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBwcm9jZXNzIGRpYWN0cmljcyBjaGFyc1xuICAgICAgICAgICAgICAgICAgICBjaCA9IGxhc3RDaGFyV2FzU3ltYm9sICYmIGNoYXJNYXBbY2hdLm1hdGNoKC9bQS1aYS16MC05XS8pID8gJyAnICsgY2hhck1hcFtjaF0gOiBjaGFyTWFwW2NoXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBsYXN0Q2hhcldhc1N5bWJvbCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGxhc3RDaGFyV2FzRGlhdHJpYyA9IGZhbHNlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjaCBpbiBkaWF0cmljTWFwKSB7XG4gICAgICAgICAgICAgICAgZGlhdHJpY1N0cmluZyArPSBjaDtcbiAgICAgICAgICAgICAgICBjaCA9ICcnO1xuICAgICAgICAgICAgICAgIC8vIGVuZCBvZiBzdHJpbmcsIHB1dCB0aGUgd2hvbGUgbWVhbmluZ2Z1bCB3b3JkXG4gICAgICAgICAgICAgICAgaWYgKGkgPT09IGwgLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNoID0gZGlhdHJpY01hcFtkaWF0cmljU3RyaW5nXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGFzdENoYXJXYXNEaWF0cmljID0gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgICAgLy8gcHJvY2VzcyBzeW1ib2wgY2hhcnNcbiAgICAgICAgICAgICAgICBzeW1ib2xbY2hdICYmICEodXJpY0ZsYWcgJiYgdXJpY0NoYXJzXG4gICAgICAgICAgICAgICAgICAgIC5pbmRleE9mKGNoKSAhPT0gLTEpICYmICEodXJpY05vU2xhc2hGbGFnICYmIHVyaWNOb1NsYXNoQ2hhcnNcbiAgICAgICAgICAgICAgICAgICAgLy8gLmluZGV4T2YoY2gpICE9PSAtMSkgJiYgIShtYXJrRmxhZyAmJiBtYXJrQ2hhcnNcbiAgICAgICAgICAgICAgICAgICAgLmluZGV4T2YoY2gpICE9PSAtMSkpIHtcbiAgICAgICAgICAgICAgICBjaCA9IGxhc3RDaGFyV2FzU3ltYm9sIHx8IHJlc3VsdC5zdWJzdHIoLTEpLm1hdGNoKC9bQS1aYS16MC05XS8pID8gc2VwYXJhdG9yICsgc3ltYm9sW2NoXSA6IHN5bWJvbFtjaF07XG4gICAgICAgICAgICAgICAgY2ggKz0gaW5wdXRbaSArIDFdICE9PSB2b2lkIDAgJiYgaW5wdXRbaSArIDFdLm1hdGNoKC9bQS1aYS16MC05XS8pID8gc2VwYXJhdG9yIDogJyc7XG5cbiAgICAgICAgICAgICAgICBsYXN0Q2hhcldhc1N5bWJvbCA9IHRydWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChsYXN0Q2hhcldhc0RpYXRyaWMgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2ggPSBkaWF0cmljTWFwW2RpYXRyaWNTdHJpbmddICsgY2g7XG4gICAgICAgICAgICAgICAgICAgIGRpYXRyaWNTdHJpbmcgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgbGFzdENoYXJXYXNEaWF0cmljID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChsYXN0Q2hhcldhc1N5bWJvbCAmJiAoL1tBLVphLXowLTldLy50ZXN0KGNoKSB8fCByZXN1bHQuc3Vic3RyKC0xKS5tYXRjaCgvQS1aYS16MC05XS8pKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBwcm9jZXNzIGxhdGluIGNoYXJzXG4gICAgICAgICAgICAgICAgICAgIGNoID0gJyAnICsgY2g7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxhc3RDaGFyV2FzU3ltYm9sID0gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGFkZCBhbGxvd2VkIGNoYXJzXG4gICAgICAgICAgICByZXN1bHQgKz0gY2gucmVwbGFjZShuZXcgUmVnRXhwKCdbXlxcXFx3XFxcXHMnICsgYWxsb3dlZENoYXJzICsgJ18tXScsICdnJyksIHNlcGFyYXRvcik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGl0bGVDYXNlKSB7XG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQucmVwbGFjZSgvKFxcdykoXFxTKikvZywgZnVuY3Rpb24gKF8sIGksIHIpIHtcbiAgICAgICAgICAgICAgICB2YXIgaiA9IGkudG9VcHBlckNhc2UoKSArIChyICE9PSBudWxsID8gciA6ICcnKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gKE9iamVjdC5rZXlzKGN1c3RvbVJlcGxhY2VtZW50cykuaW5kZXhPZihqLnRvTG93ZXJDYXNlKCkpIDwgMCkgPyBqIDogai50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBlbGltaW5hdGUgZHVwbGljYXRlIHNlcGFyYXRvcnNcbiAgICAgICAgLy8gYWRkIHNlcGFyYXRvclxuICAgICAgICAvLyB0cmltIHNlcGFyYXRvcnMgZnJvbSBzdGFydCBhbmQgZW5kXG4gICAgICAgIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKC9cXHMrL2csIHNlcGFyYXRvcilcbiAgICAgICAgICAgIC5yZXBsYWNlKG5ldyBSZWdFeHAoJ1xcXFwnICsgc2VwYXJhdG9yICsgJysnLCAnZycpLCBzZXBhcmF0b3IpXG4gICAgICAgICAgICAucmVwbGFjZShuZXcgUmVnRXhwKCcoXlxcXFwnICsgc2VwYXJhdG9yICsgJyt8XFxcXCcgKyBzZXBhcmF0b3IgKyAnKyQpJywgJ2cnKSwgJycpO1xuXG4gICAgICAgIGlmICh0cnVuY2F0ZSAmJiByZXN1bHQubGVuZ3RoID4gdHJ1bmNhdGUpIHtcbiAgICAgICAgICAgIGx1Y2t5ID0gcmVzdWx0LmNoYXJBdCh0cnVuY2F0ZSkgPT09IHNlcGFyYXRvcjtcbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5zbGljZSgwLCB0cnVuY2F0ZSk7XG5cbiAgICAgICAgICAgIGlmICghbHVja3kpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSByZXN1bHQuc2xpY2UoMCwgcmVzdWx0Lmxhc3RJbmRleE9mKHNlcGFyYXRvcikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFtYWludGFpbkNhc2UgJiYgIXRpdGxlQ2FzZSkge1xuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBjcmVhdGVTbHVnIGN1cnJpZWQob3B0cykoaW5wdXQpXG4gICAgICogQHBhcmFtICAge29iamVjdHxzdHJpbmd9IG9wdHMgY29uZmlnIG9iamVjdCBvciBpbnB1dCBzdHJpbmdcbiAgICAgKiBAcmV0dXJuICB7RnVuY3Rpb259IGZ1bmN0aW9uIGdldFNsdWdXaXRoQ29uZmlnKClcbiAgICAgKiovXG4gICAgdmFyIGNyZWF0ZVNsdWcgPSBmdW5jdGlvbiBjcmVhdGVTbHVnKG9wdHMpIHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogZ2V0U2x1Z1dpdGhDb25maWdcbiAgICAgICAgICogQHBhcmFtICAge3N0cmluZ30gaW5wdXQgc3RyaW5nXG4gICAgICAgICAqIEByZXR1cm4gIHtzdHJpbmd9IHNsdWcgc3RyaW5nXG4gICAgICAgICAqL1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gZ2V0U2x1Z1dpdGhDb25maWcoaW5wdXQpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRTbHVnKGlucHV0LCBvcHRzKTtcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogZXNjYXBlIENoYXJzXG4gICAgICogQHBhcmFtICAge3N0cmluZ30gaW5wdXQgc3RyaW5nXG4gICAgICovXG4gICAgdmFyIGVzY2FwZUNoYXJzID0gZnVuY3Rpb24gZXNjYXBlQ2hhcnMoaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIGlucHV0LnJlcGxhY2UoL1stXFxcXF4kKis/LigpfFtcXF17fVxcL10vZywgJ1xcXFwkJicpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBjaGVjayBpZiB0aGUgY2hhciBpcyBhbiBhbHJlYWR5IGNvbnZlcnRlZCBjaGFyIGZyb20gY3VzdG9tIGxpc3RcbiAgICAgKiBAcGFyYW0gICB7Y2hhcn0gY2ggY2hhcmFjdGVyIHRvIGNoZWNrXG4gICAgICogQHBhcmFtICAge29iamVjdH0gY3VzdG9tUmVwbGFjZW1lbnRzIGN1c3RvbSB0cmFuc2xhdGlvbiBtYXBcbiAgICAgKi9cbiAgICB2YXIgaXNSZXBsYWNlZEN1c3RvbUNoYXIgPSBmdW5jdGlvbiAoY2gsIGN1c3RvbVJlcGxhY2VtZW50cykge1xuICAgICAgICBmb3IgKHZhciBjIGluIGN1c3RvbVJlcGxhY2VtZW50cykge1xuICAgICAgICAgICAgaWYgKGN1c3RvbVJlcGxhY2VtZW50c1tjXSA9PT0gY2gpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblxuICAgICAgICAvLyBleHBvcnQgZnVuY3Rpb25zIGZvciB1c2UgaW4gTm9kZVxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGdldFNsdWc7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzLmNyZWF0ZVNsdWcgPSBjcmVhdGVTbHVnO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSAhPT0gJ3VuZGVmaW5lZCcgJiYgZGVmaW5lLmFtZCkge1xuXG4gICAgICAgIC8vIGV4cG9ydCBmdW5jdGlvbiBmb3IgdXNlIGluIEFNRFxuICAgICAgICBkZWZpbmUoW10sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRTbHVnO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuXG4gICAgICAgIC8vIGRvbid0IG92ZXJ3cml0ZSBnbG9iYWwgaWYgZXhpc3RzXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAocm9vdC5nZXRTbHVnIHx8IHJvb3QuY3JlYXRlU2x1Zykge1xuICAgICAgICAgICAgICAgIHRocm93ICdzcGVha2luZ3VybDogZ2xvYmFscyBleGlzdHMgLyhnZXRTbHVnfGNyZWF0ZVNsdWcpLyc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJvb3QuZ2V0U2x1ZyA9IGdldFNsdWc7XG4gICAgICAgICAgICAgICAgcm9vdC5jcmVhdGVTbHVnID0gY3JlYXRlU2x1ZztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICB9XG59KSh0aGlzKTsiLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbl9fd2VicGFja19yZXF1aXJlX18ubiA9IChtb2R1bGUpID0+IHtcblx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG5cdFx0KCkgPT4gKG1vZHVsZVsnZGVmYXVsdCddKSA6XG5cdFx0KCkgPT4gKG1vZHVsZSk7XG5cdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsIHsgYTogZ2V0dGVyIH0pO1xuXHRyZXR1cm4gZ2V0dGVyO1xufTsiLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmcgPSAoZnVuY3Rpb24oKSB7XG5cdGlmICh0eXBlb2YgZ2xvYmFsVGhpcyA9PT0gJ29iamVjdCcpIHJldHVybiBnbG9iYWxUaGlzO1xuXHR0cnkge1xuXHRcdHJldHVybiB0aGlzIHx8IG5ldyBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0aWYgKHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnKSByZXR1cm4gd2luZG93O1xuXHR9XG59KSgpOyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCIvLyB0aGlzIGlzIGluamVjdGVkIHRvIHRoZSBhcHAgcGFnZSB3aGVuIHRoZSBwYW5lbCBpcyBhY3RpdmF0ZWQuXG5cbmltcG9ydCB7IGluaXRCYWNrZW5kIH0gZnJvbSAnQGJhY2snXG5pbXBvcnQgeyBCcmlkZ2UgfSBmcm9tICdAdnVlLWRldnRvb2xzL3NoYXJlZC11dGlscydcblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBoYW5kc2hha2UpXG5cbmZ1bmN0aW9uIHNlbmRMaXN0ZW5pbmcgKCkge1xuICB3aW5kb3cucG9zdE1lc3NhZ2Uoe1xuICAgIHNvdXJjZTogJ3Z1ZS1kZXZ0b29scy1iYWNrZW5kLWluamVjdGlvbicsXG4gICAgcGF5bG9hZDogJ2xpc3RlbmluZycsXG4gIH0sICcqJylcbn1cbnNlbmRMaXN0ZW5pbmcoKVxuXG5mdW5jdGlvbiBoYW5kc2hha2UgKGUpIHtcbiAgaWYgKGUuZGF0YS5zb3VyY2UgPT09ICd2dWUtZGV2dG9vbHMtcHJveHknICYmIGUuZGF0YS5wYXlsb2FkID09PSAnaW5pdCcpIHtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGhhbmRzaGFrZSlcblxuICAgIGxldCBsaXN0ZW5lcnMgPSBbXVxuICAgIGNvbnN0IGJyaWRnZSA9IG5ldyBCcmlkZ2Uoe1xuICAgICAgbGlzdGVuIChmbikge1xuICAgICAgICBjb25zdCBsaXN0ZW5lciA9IGV2dCA9PiB7XG4gICAgICAgICAgaWYgKGV2dC5kYXRhLnNvdXJjZSA9PT0gJ3Z1ZS1kZXZ0b29scy1wcm94eScgJiYgZXZ0LmRhdGEucGF5bG9hZCkge1xuICAgICAgICAgICAgZm4oZXZ0LmRhdGEucGF5bG9hZClcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBsaXN0ZW5lcilcbiAgICAgICAgbGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpXG4gICAgICB9LFxuICAgICAgc2VuZCAoZGF0YSkge1xuICAgICAgICAvLyBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICAvLyAgIGNvbnNvbGUubG9nKCdbY2hyb21lXSBiYWNrZW5kIC0+IGRldnRvb2xzJywgZGF0YSlcbiAgICAgICAgLy8gfVxuICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgIHNvdXJjZTogJ3Z1ZS1kZXZ0b29scy1iYWNrZW5kJyxcbiAgICAgICAgICBwYXlsb2FkOiBkYXRhLFxuICAgICAgICB9LCAnKicpXG4gICAgICB9LFxuICAgIH0pXG5cbiAgICBicmlkZ2Uub24oJ3NodXRkb3duJywgKCkgPT4ge1xuICAgICAgbGlzdGVuZXJzLmZvckVhY2gobCA9PiB7XG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgbClcbiAgICAgIH0pXG4gICAgICBsaXN0ZW5lcnMgPSBbXVxuICAgIH0pXG5cbiAgICBpbml0QmFja2VuZChicmlkZ2UpXG4gIH0gZWxzZSB7XG4gICAgc2VuZExpc3RlbmluZygpXG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJpbml0QmFja2VuZCIsIkJyaWRnZSIsIndpbmRvdyIsImFkZEV2ZW50TGlzdGVuZXIiLCJoYW5kc2hha2UiLCJzZW5kTGlzdGVuaW5nIiwicG9zdE1lc3NhZ2UiLCJzb3VyY2UiLCJwYXlsb2FkIiwiZSIsImRhdGEiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwibGlzdGVuZXJzIiwiYnJpZGdlIiwibGlzdGVuIiwiZm4iLCJsaXN0ZW5lciIsImV2dCIsInB1c2giLCJzZW5kIiwib24iLCJmb3JFYWNoIiwibCJdLCJzb3VyY2VSb290IjoiIn0=