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
/*!******************************!*\
  !*** ./src/detector-exec.js ***!
  \******************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _back_toast__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @back/toast */ "../app-backend-core/lib/toast.js");


function sendMessage(message) {
  window.postMessage({
    key: '_vue-devtools-send-message',
    message
  });
}

function detect() {
  let delay = 1000;
  let detectRemainingTries = 10;

  function runDetect() {
    // Method 1: Check Nuxt.js
    const nuxtDetected = !!(window.__NUXT__ || window.$nuxt);

    if (nuxtDetected) {
      let Vue;

      if (window.$nuxt) {
        Vue = window.$nuxt.$root && window.$nuxt.$root.constructor;
      }

      sendMessage({
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
      sendMessage({
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

      sendMessage({
        devtoolsEnabled: Vue.config.devtools,
        vueDetected: true
      }, '*');
      return;
    }

    if (detectRemainingTries > 0) {
      detectRemainingTries--;
      setTimeout(() => {
        runDetect();
      }, delay);
      delay *= 5;
    }
  }

  setTimeout(() => {
    runDetect();
  }, 100);
} // inject the hook


if (document instanceof HTMLDocument) {
  detect();
  (0,_back_toast__WEBPACK_IMPORTED_MODULE_0__.installToast)();
}
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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O0lBQ0Q7O0lBRUQsSUFBSWIsb0JBQW9CLEdBQUcsQ0FBM0IsRUFBOEI7TUFDNUJBLG9CQUFvQjtNQUNwQnlCLFVBQVUsQ0FBQyxNQUFNO1FBQ2Z4QixTQUFTO01BQ1YsQ0FGUyxFQUVQRixLQUZPLENBQVY7TUFHQUEsS0FBSyxJQUFJLENBQVQ7SUFDRDtFQUNGOztFQUVEMEIsVUFBVSxDQUFDLE1BQU07SUFDZnhCLFNBQVM7RUFDVixDQUZTLEVBRVAsR0FGTyxDQUFWO0FBR0QsRUFFRDs7O0FBQ0EsSUFBSWUsUUFBUSxZQUFZVSxZQUF4QixFQUFzQztFQUNwQzVCLE1BQU07RUFDTlAseURBQVk7QUFDYixDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vc3JjL3RvYXN0LnRzIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi9zcmMvZGV0ZWN0b3ItZXhlYy5qcyJdLCJzb3VyY2VzQ29udGVudCI6W251bGwsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJpbXBvcnQgeyBpbnN0YWxsVG9hc3QgfSBmcm9tICdAYmFjay90b2FzdCdcblxuZnVuY3Rpb24gc2VuZE1lc3NhZ2UobWVzc2FnZSkge1xuICB3aW5kb3cucG9zdE1lc3NhZ2Uoe1xuICAgIGtleTogJ192dWUtZGV2dG9vbHMtc2VuZC1tZXNzYWdlJyxcbiAgICBtZXNzYWdlLFxuICB9KVxufVxuXG5mdW5jdGlvbiBkZXRlY3QoKSB7XG4gIGxldCBkZWxheSA9IDEwMDBcbiAgbGV0IGRldGVjdFJlbWFpbmluZ1RyaWVzID0gMTBcblxuICBmdW5jdGlvbiBydW5EZXRlY3QoKSB7XG4gICAgLy8gTWV0aG9kIDE6IENoZWNrIE51eHQuanNcbiAgICBjb25zdCBudXh0RGV0ZWN0ZWQgPSAhISh3aW5kb3cuX19OVVhUX18gfHwgd2luZG93LiRudXh0KVxuXG4gICAgaWYgKG51eHREZXRlY3RlZCkge1xuICAgICAgbGV0IFZ1ZVxuXG4gICAgICBpZiAod2luZG93LiRudXh0KSB7XG4gICAgICAgIFZ1ZSA9IHdpbmRvdy4kbnV4dC4kcm9vdCAmJiB3aW5kb3cuJG51eHQuJHJvb3QuY29uc3RydWN0b3JcbiAgICAgIH1cblxuICAgICAgc2VuZE1lc3NhZ2Uoe1xuICAgICAgICBkZXZ0b29sc0VuYWJsZWQ6ICgvKiBWdWUgMiAqLyBWdWUgJiYgVnVlLmNvbmZpZy5kZXZ0b29scylcbiAgICAgICAgfHwgKC8qIFZ1ZSAzLjIuMTQrICovIHdpbmRvdy5fX1ZVRV9ERVZUT09MU19HTE9CQUxfSE9PS19fICYmIHdpbmRvdy5fX1ZVRV9ERVZUT09MU19HTE9CQUxfSE9PS19fLmVuYWJsZWQpLFxuICAgICAgICB2dWVEZXRlY3RlZDogdHJ1ZSxcbiAgICAgICAgbnV4dERldGVjdGVkOiB0cnVlLFxuICAgICAgfSwgJyonKVxuXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICAvLyBNZXRob2QgMjogQ2hlY2sgIFZ1ZSAzXG4gICAgY29uc3QgdnVlRGV0ZWN0ZWQgPSAhISh3aW5kb3cuX19WVUVfXylcbiAgICBpZiAodnVlRGV0ZWN0ZWQpIHtcbiAgICAgIHNlbmRNZXNzYWdlKHtcbiAgICAgICAgZGV2dG9vbHNFbmFibGVkOiAvKiBWdWUgMy4yLjE0KyAqLyB3aW5kb3cuX19WVUVfREVWVE9PTFNfR0xPQkFMX0hPT0tfXyAmJiB3aW5kb3cuX19WVUVfREVWVE9PTFNfR0xPQkFMX0hPT0tfXy5lbmFibGVkLFxuICAgICAgICB2dWVEZXRlY3RlZDogdHJ1ZSxcbiAgICAgIH0sICcqJylcblxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gTWV0aG9kIDM6IFNjYW4gYWxsIGVsZW1lbnRzIGluc2lkZSBkb2N1bWVudFxuICAgIGNvbnN0IGFsbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyonKVxuICAgIGxldCBlbFxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYWxsLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYWxsW2ldLl9fdnVlX18pIHtcbiAgICAgICAgZWwgPSBhbGxbaV1cbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGVsKSB7XG4gICAgICBsZXQgVnVlID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGVsLl9fdnVlX18pLmNvbnN0cnVjdG9yXG4gICAgICB3aGlsZSAoVnVlLnN1cGVyKSB7XG4gICAgICAgIFZ1ZSA9IFZ1ZS5zdXBlclxuICAgICAgfVxuICAgICAgc2VuZE1lc3NhZ2Uoe1xuICAgICAgICBkZXZ0b29sc0VuYWJsZWQ6IFZ1ZS5jb25maWcuZGV2dG9vbHMsXG4gICAgICAgIHZ1ZURldGVjdGVkOiB0cnVlLFxuICAgICAgfSwgJyonKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgaWYgKGRldGVjdFJlbWFpbmluZ1RyaWVzID4gMCkge1xuICAgICAgZGV0ZWN0UmVtYWluaW5nVHJpZXMtLVxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHJ1bkRldGVjdCgpXG4gICAgICB9LCBkZWxheSlcbiAgICAgIGRlbGF5ICo9IDVcbiAgICB9XG4gIH1cblxuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICBydW5EZXRlY3QoKVxuICB9LCAxMDApXG59XG5cbi8vIGluamVjdCB0aGUgaG9va1xuaWYgKGRvY3VtZW50IGluc3RhbmNlb2YgSFRNTERvY3VtZW50KSB7XG4gIGRldGVjdCgpXG4gIGluc3RhbGxUb2FzdCgpXG59XG4iXSwibmFtZXMiOlsiaW5zdGFsbFRvYXN0IiwiZXhwb3J0cyIsInNlbmRNZXNzYWdlIiwibWVzc2FnZSIsIndpbmRvdyIsInBvc3RNZXNzYWdlIiwia2V5IiwiZGV0ZWN0IiwiZGVsYXkiLCJkZXRlY3RSZW1haW5pbmdUcmllcyIsInJ1bkRldGVjdCIsIm51eHREZXRlY3RlZCIsIl9fTlVYVF9fIiwiJG51eHQiLCJWdWUiLCIkcm9vdCIsImNvbnN0cnVjdG9yIiwiZGV2dG9vbHNFbmFibGVkIiwiY29uZmlnIiwiZGV2dG9vbHMiLCJfX1ZVRV9ERVZUT09MU19HTE9CQUxfSE9PS19fIiwiZW5hYmxlZCIsInZ1ZURldGVjdGVkIiwiX19WVUVfXyIsImFsbCIsImRvY3VtZW50IiwicXVlcnlTZWxlY3RvckFsbCIsImVsIiwiaSIsImxlbmd0aCIsIl9fdnVlX18iLCJPYmplY3QiLCJnZXRQcm90b3R5cGVPZiIsInN1cGVyIiwic2V0VGltZW91dCIsIkhUTUxEb2N1bWVudCJdLCJzb3VyY2VSb290IjoiIn0=