/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!***************************!*\
  !*** ./src/background.js ***!
  \***************************/
// the background script runs all the time and serves as a central message
// hub for each vue devtools (panel + proxy + backend) instance.
const ports = {};
chrome.runtime.onConnect.addListener(port => {
  let tab;
  let name;

  if (isNumeric(port.name)) {
    tab = port.name;
    name = 'devtools';
    installProxy(+port.name);
  } else {
    tab = port.sender.tab.id;
    name = 'backend';
  }

  if (!ports[tab]) {
    ports[tab] = {
      devtools: null,
      backend: null
    };
  }

  ports[tab][name] = port;

  if (ports[tab].devtools && ports[tab].backend) {
    doublePipe(tab, ports[tab].devtools, ports[tab].backend);
  }
});

function isNumeric(str) {
  return +str + '' === str;
}

function installProxy(tabId) {
  chrome.tabs.executeScript(tabId, {
    file: '/build/proxy.js'
  }, function (res) {
    if (!res) {
      ports[tabId].devtools.postMessage('proxy-fail');
    } else {
      if (true) {
        // eslint-disable-next-line no-console
        console.log('injected proxy to tab ' + tabId);
      }
    }
  });
}

function doublePipe(id, one, two) {
  one.onMessage.addListener(lOne);

  function lOne(message) {
    if (message.event === 'log') {
      // eslint-disable-next-line no-console
      return console.log('tab ' + id, message.payload);
    }

    if (true) {
      // eslint-disable-next-line no-console
      console.log('%cdevtools -> backend', 'color:#888;', message);
    }

    two.postMessage(message);
  }

  two.onMessage.addListener(lTwo);

  function lTwo(message) {
    if (message.event === 'log') {
      // eslint-disable-next-line no-console
      return console.log('tab ' + id, message.payload);
    }

    if (true) {
      // eslint-disable-next-line no-console
      console.log('%cbackend -> devtools', 'color:#888;', message);
    }

    one.postMessage(message);
  }

  function shutdown() {
    if (true) {
      // eslint-disable-next-line no-console
      console.log('tab ' + id + ' disconnected.');
    }

    one.onMessage.removeListener(lOne);
    two.onMessage.removeListener(lTwo);
    one.disconnect();
    two.disconnect();
    ports[id] = null;
  }

  one.onDisconnect.addListener(shutdown);
  two.onDisconnect.addListener(shutdown);

  if (true) {
    // eslint-disable-next-line no-console
    console.log('tab ' + id + ' connected.');
  }
}

chrome.runtime.onMessage.addListener((req, sender) => {
  if (sender.tab && req.vueDetected) {
    const suffix = req.nuxtDetected ? '.nuxt' : '';
    chrome.browserAction.setIcon({
      tabId: sender.tab.id,
      path: {
        16: `icons/16${suffix}.png`,
        48: `icons/48${suffix}.png`,
        128: `icons/128${suffix}.png`
      }
    });
    chrome.browserAction.setPopup({
      tabId: sender.tab.id,
      popup: req.devtoolsEnabled ? `popups/enabled${suffix}.html` : `popups/disabled${suffix}.html`
    });
  }

  if (req.action === 'vue-take-screenshot' && sender.envType === 'devtools_child') {
    browser.tabs.captureVisibleTab({
      format: 'png'
    }).then(dataUrl => {
      browser.runtime.sendMessage({
        action: 'vue-screenshot-result',
        id: req.id,
        dataUrl
      });
    });
  }
});
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUZrQjtBQUcxQjRDLFFBQUFBO0FBSDBCLE9BQTVCO0FBS0QsS0FSRDtBQVNEO0FBQ0YsQ0E3QkQsRSIsInNvdXJjZXMiOlsid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4vc3JjL2JhY2tncm91bmQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gdGhlIGJhY2tncm91bmQgc2NyaXB0IHJ1bnMgYWxsIHRoZSB0aW1lIGFuZCBzZXJ2ZXMgYXMgYSBjZW50cmFsIG1lc3NhZ2Vcbi8vIGh1YiBmb3IgZWFjaCB2dWUgZGV2dG9vbHMgKHBhbmVsICsgcHJveHkgKyBiYWNrZW5kKSBpbnN0YW5jZS5cblxuY29uc3QgcG9ydHMgPSB7fVxuXG5jaHJvbWUucnVudGltZS5vbkNvbm5lY3QuYWRkTGlzdGVuZXIocG9ydCA9PiB7XG4gIGxldCB0YWJcbiAgbGV0IG5hbWVcbiAgaWYgKGlzTnVtZXJpYyhwb3J0Lm5hbWUpKSB7XG4gICAgdGFiID0gcG9ydC5uYW1lXG4gICAgbmFtZSA9ICdkZXZ0b29scydcbiAgICBpbnN0YWxsUHJveHkoK3BvcnQubmFtZSlcbiAgfSBlbHNlIHtcbiAgICB0YWIgPSBwb3J0LnNlbmRlci50YWIuaWRcbiAgICBuYW1lID0gJ2JhY2tlbmQnXG4gIH1cblxuICBpZiAoIXBvcnRzW3RhYl0pIHtcbiAgICBwb3J0c1t0YWJdID0ge1xuICAgICAgZGV2dG9vbHM6IG51bGwsXG4gICAgICBiYWNrZW5kOiBudWxsLFxuICAgIH1cbiAgfVxuICBwb3J0c1t0YWJdW25hbWVdID0gcG9ydFxuXG4gIGlmIChwb3J0c1t0YWJdLmRldnRvb2xzICYmIHBvcnRzW3RhYl0uYmFja2VuZCkge1xuICAgIGRvdWJsZVBpcGUodGFiLCBwb3J0c1t0YWJdLmRldnRvb2xzLCBwb3J0c1t0YWJdLmJhY2tlbmQpXG4gIH1cbn0pXG5cbmZ1bmN0aW9uIGlzTnVtZXJpYyAoc3RyKSB7XG4gIHJldHVybiArc3RyICsgJycgPT09IHN0clxufVxuXG5mdW5jdGlvbiBpbnN0YWxsUHJveHkgKHRhYklkKSB7XG4gIGNocm9tZS50YWJzLmV4ZWN1dGVTY3JpcHQodGFiSWQsIHtcbiAgICBmaWxlOiAnL2J1aWxkL3Byb3h5LmpzJyxcbiAgfSwgZnVuY3Rpb24gKHJlcykge1xuICAgIGlmICghcmVzKSB7XG4gICAgICBwb3J0c1t0YWJJZF0uZGV2dG9vbHMucG9zdE1lc3NhZ2UoJ3Byb3h5LWZhaWwnKVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgICBjb25zb2xlLmxvZygnaW5qZWN0ZWQgcHJveHkgdG8gdGFiICcgKyB0YWJJZClcbiAgICAgIH1cbiAgICB9XG4gIH0pXG59XG5cbmZ1bmN0aW9uIGRvdWJsZVBpcGUgKGlkLCBvbmUsIHR3bykge1xuICBvbmUub25NZXNzYWdlLmFkZExpc3RlbmVyKGxPbmUpXG4gIGZ1bmN0aW9uIGxPbmUgKG1lc3NhZ2UpIHtcbiAgICBpZiAobWVzc2FnZS5ldmVudCA9PT0gJ2xvZycpIHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICByZXR1cm4gY29uc29sZS5sb2coJ3RhYiAnICsgaWQsIG1lc3NhZ2UucGF5bG9hZClcbiAgICB9XG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICBjb25zb2xlLmxvZygnJWNkZXZ0b29scyAtPiBiYWNrZW5kJywgJ2NvbG9yOiM4ODg7JywgbWVzc2FnZSlcbiAgICB9XG4gICAgdHdvLnBvc3RNZXNzYWdlKG1lc3NhZ2UpXG4gIH1cbiAgdHdvLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcihsVHdvKVxuICBmdW5jdGlvbiBsVHdvIChtZXNzYWdlKSB7XG4gICAgaWYgKG1lc3NhZ2UuZXZlbnQgPT09ICdsb2cnKSB7XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgcmV0dXJuIGNvbnNvbGUubG9nKCd0YWIgJyArIGlkLCBtZXNzYWdlLnBheWxvYWQpXG4gICAgfVxuICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgY29uc29sZS5sb2coJyVjYmFja2VuZCAtPiBkZXZ0b29scycsICdjb2xvcjojODg4OycsIG1lc3NhZ2UpXG4gICAgfVxuICAgIG9uZS5wb3N0TWVzc2FnZShtZXNzYWdlKVxuICB9XG4gIGZ1bmN0aW9uIHNodXRkb3duICgpIHtcbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICAgIGNvbnNvbGUubG9nKCd0YWIgJyArIGlkICsgJyBkaXNjb25uZWN0ZWQuJylcbiAgICB9XG4gICAgb25lLm9uTWVzc2FnZS5yZW1vdmVMaXN0ZW5lcihsT25lKVxuICAgIHR3by5vbk1lc3NhZ2UucmVtb3ZlTGlzdGVuZXIobFR3bylcbiAgICBvbmUuZGlzY29ubmVjdCgpXG4gICAgdHdvLmRpc2Nvbm5lY3QoKVxuICAgIHBvcnRzW2lkXSA9IG51bGxcbiAgfVxuICBvbmUub25EaXNjb25uZWN0LmFkZExpc3RlbmVyKHNodXRkb3duKVxuICB0d28ub25EaXNjb25uZWN0LmFkZExpc3RlbmVyKHNodXRkb3duKVxuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgY29uc29sZS5sb2coJ3RhYiAnICsgaWQgKyAnIGNvbm5lY3RlZC4nKVxuICB9XG59XG5cbmNocm9tZS5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcigocmVxLCBzZW5kZXIpID0+IHtcbiAgaWYgKHNlbmRlci50YWIgJiYgcmVxLnZ1ZURldGVjdGVkKSB7XG4gICAgY29uc3Qgc3VmZml4ID0gcmVxLm51eHREZXRlY3RlZCA/ICcubnV4dCcgOiAnJ1xuXG4gICAgY2hyb21lLmJyb3dzZXJBY3Rpb24uc2V0SWNvbih7XG4gICAgICB0YWJJZDogc2VuZGVyLnRhYi5pZCxcbiAgICAgIHBhdGg6IHtcbiAgICAgICAgMTY6IGBpY29ucy8xNiR7c3VmZml4fS5wbmdgLFxuICAgICAgICA0ODogYGljb25zLzQ4JHtzdWZmaXh9LnBuZ2AsXG4gICAgICAgIDEyODogYGljb25zLzEyOCR7c3VmZml4fS5wbmdgLFxuICAgICAgfSxcbiAgICB9KVxuICAgIGNocm9tZS5icm93c2VyQWN0aW9uLnNldFBvcHVwKHtcbiAgICAgIHRhYklkOiBzZW5kZXIudGFiLmlkLFxuICAgICAgcG9wdXA6IHJlcS5kZXZ0b29sc0VuYWJsZWQgPyBgcG9wdXBzL2VuYWJsZWQke3N1ZmZpeH0uaHRtbGAgOiBgcG9wdXBzL2Rpc2FibGVkJHtzdWZmaXh9Lmh0bWxgLFxuICAgIH0pXG4gIH1cblxuICBpZiAocmVxLmFjdGlvbiA9PT0gJ3Z1ZS10YWtlLXNjcmVlbnNob3QnICYmIHNlbmRlci5lbnZUeXBlID09PSAnZGV2dG9vbHNfY2hpbGQnKSB7XG4gICAgYnJvd3Nlci50YWJzLmNhcHR1cmVWaXNpYmxlVGFiKHtcbiAgICAgIGZvcm1hdDogJ3BuZycsXG4gICAgfSkudGhlbihkYXRhVXJsID0+IHtcbiAgICAgIGJyb3dzZXIucnVudGltZS5zZW5kTWVzc2FnZSh7XG4gICAgICAgIGFjdGlvbjogJ3Z1ZS1zY3JlZW5zaG90LXJlc3VsdCcsXG4gICAgICAgIGlkOiByZXEuaWQsXG4gICAgICAgIGRhdGFVcmwsXG4gICAgICB9KVxuICAgIH0pXG4gIH1cbn0pXG4iXSwibmFtZXMiOlsicG9ydHMiLCJjaHJvbWUiLCJydW50aW1lIiwib25Db25uZWN0IiwiYWRkTGlzdGVuZXIiLCJwb3J0IiwidGFiIiwibmFtZSIsImlzTnVtZXJpYyIsImluc3RhbGxQcm94eSIsInNlbmRlciIsImlkIiwiZGV2dG9vbHMiLCJiYWNrZW5kIiwiZG91YmxlUGlwZSIsInN0ciIsInRhYklkIiwidGFicyIsImV4ZWN1dGVTY3JpcHQiLCJmaWxlIiwicmVzIiwicG9zdE1lc3NhZ2UiLCJwcm9jZXNzIiwiZW52IiwiTk9ERV9FTlYiLCJjb25zb2xlIiwibG9nIiwib25lIiwidHdvIiwib25NZXNzYWdlIiwibE9uZSIsIm1lc3NhZ2UiLCJldmVudCIsInBheWxvYWQiLCJsVHdvIiwic2h1dGRvd24iLCJyZW1vdmVMaXN0ZW5lciIsImRpc2Nvbm5lY3QiLCJvbkRpc2Nvbm5lY3QiLCJyZXEiLCJ2dWVEZXRlY3RlZCIsInN1ZmZpeCIsIm51eHREZXRlY3RlZCIsImJyb3dzZXJBY3Rpb24iLCJzZXRJY29uIiwicGF0aCIsInNldFBvcHVwIiwicG9wdXAiLCJkZXZ0b29sc0VuYWJsZWQiLCJhY3Rpb24iLCJlbnZUeXBlIiwiYnJvd3NlciIsImNhcHR1cmVWaXNpYmxlVGFiIiwiZm9ybWF0IiwidGhlbiIsImRhdGFVcmwiLCJzZW5kTWVzc2FnZSJdLCJzb3VyY2VSb290IjoiIn0=