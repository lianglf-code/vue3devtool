/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!************************************!*\
  !*** ./src/devtools-background.js ***!
  \************************************/
// This is the devtools script, which is called when the user opens the
// Chrome devtool on a page. We check to see if we global hook has detected
// Vue presence on the page. If yes, create the Vue panel; otherwise poll
// for 10 seconds.
let created = false;
let checkCount = 0;
chrome.devtools.network.onNavigated.addListener(createPanelIfHasVue);
const checkVueInterval = setInterval(createPanelIfHasVue, 1000);
createPanelIfHasVue();

function createPanelIfHasVue() {
  if (created || checkCount++ > 10) {
    clearInterval(checkVueInterval);
    return;
  }

  chrome.devtools.inspectedWindow.eval('!!(window.__VUE_DEVTOOLS_GLOBAL_HOOK__.Vue || window.__VUE_DEVTOOLS_GLOBAL_HOOK__.apps.length)', function (hasVue) {
    if (!hasVue || created) {
      return;
    }

    clearInterval(checkVueInterval);
    created = true;
    chrome.devtools.panels.create('Vue', 'icons/128.png', 'devtools.html', panel => {
      // panel loaded
      panel.onShown.addListener(onPanelShown);
      panel.onHidden.addListener(onPanelHidden);
    });
  });
} // Manage panel visibility


function onPanelShown() {
  chrome.runtime.sendMessage('vue-panel-shown');
}

function onPanelHidden() {
  chrome.runtime.sendMessage('vue-panel-hidden');
}
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2dG9vbHMtYmFja2dyb3VuZC5qcyIsIm1hcHBpbmdzIjoiOzs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBRUEsSUFBSUEsT0FBTyxHQUFHLEtBQWQ7QUFDQSxJQUFJQyxVQUFVLEdBQUcsQ0FBakI7QUFFQUMsTUFBTSxDQUFDQyxRQUFQLENBQWdCQyxPQUFoQixDQUF3QkMsV0FBeEIsQ0FBb0NDLFdBQXBDLENBQWdEQyxtQkFBaEQ7QUFDQSxNQUFNQyxnQkFBZ0IsR0FBR0MsV0FBVyxDQUFDRixtQkFBRCxFQUFzQixJQUF0QixDQUFwQztBQUNBQSxtQkFBbUI7O0FBRW5CLFNBQVNBLG1CQUFULEdBQWdDO0FBQzlCLE1BQUlQLE9BQU8sSUFBSUMsVUFBVSxLQUFLLEVBQTlCLEVBQWtDO0FBQ2hDUyxJQUFBQSxhQUFhLENBQUNGLGdCQUFELENBQWI7QUFDQTtBQUNEOztBQUNETixFQUFBQSxNQUFNLENBQUNDLFFBQVAsQ0FBZ0JRLGVBQWhCLENBQWdDQyxJQUFoQyxDQUNFLGdHQURGLEVBRUUsVUFBVUMsTUFBVixFQUFrQjtBQUNoQixRQUFJLENBQUNBLE1BQUQsSUFBV2IsT0FBZixFQUF3QjtBQUN0QjtBQUNEOztBQUNEVSxJQUFBQSxhQUFhLENBQUNGLGdCQUFELENBQWI7QUFDQVIsSUFBQUEsT0FBTyxHQUFHLElBQVY7QUFDQUUsSUFBQUEsTUFBTSxDQUFDQyxRQUFQLENBQWdCVyxNQUFoQixDQUF1QkMsTUFBdkIsQ0FDRSxLQURGLEVBQ1MsZUFEVCxFQUMwQixlQUQxQixFQUVFQyxLQUFLLElBQUk7QUFDUDtBQUNBQSxNQUFBQSxLQUFLLENBQUNDLE9BQU4sQ0FBY1gsV0FBZCxDQUEwQlksWUFBMUI7QUFDQUYsTUFBQUEsS0FBSyxDQUFDRyxRQUFOLENBQWViLFdBQWYsQ0FBMkJjLGFBQTNCO0FBQ0QsS0FOSDtBQVFELEdBaEJIO0FBa0JELEVBRUQ7OztBQUVBLFNBQVNGLFlBQVQsR0FBeUI7QUFDdkJoQixFQUFBQSxNQUFNLENBQUNtQixPQUFQLENBQWVDLFdBQWYsQ0FBMkIsaUJBQTNCO0FBQ0Q7O0FBRUQsU0FBU0YsYUFBVCxHQUEwQjtBQUN4QmxCLEVBQUFBLE1BQU0sQ0FBQ21CLE9BQVAsQ0FBZUMsV0FBZixDQUEyQixrQkFBM0I7QUFDRCxDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi9zcmMvZGV2dG9vbHMtYmFja2dyb3VuZC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBUaGlzIGlzIHRoZSBkZXZ0b29scyBzY3JpcHQsIHdoaWNoIGlzIGNhbGxlZCB3aGVuIHRoZSB1c2VyIG9wZW5zIHRoZVxuLy8gQ2hyb21lIGRldnRvb2wgb24gYSBwYWdlLiBXZSBjaGVjayB0byBzZWUgaWYgd2UgZ2xvYmFsIGhvb2sgaGFzIGRldGVjdGVkXG4vLyBWdWUgcHJlc2VuY2Ugb24gdGhlIHBhZ2UuIElmIHllcywgY3JlYXRlIHRoZSBWdWUgcGFuZWw7IG90aGVyd2lzZSBwb2xsXG4vLyBmb3IgMTAgc2Vjb25kcy5cblxubGV0IGNyZWF0ZWQgPSBmYWxzZVxubGV0IGNoZWNrQ291bnQgPSAwXG5cbmNocm9tZS5kZXZ0b29scy5uZXR3b3JrLm9uTmF2aWdhdGVkLmFkZExpc3RlbmVyKGNyZWF0ZVBhbmVsSWZIYXNWdWUpXG5jb25zdCBjaGVja1Z1ZUludGVydmFsID0gc2V0SW50ZXJ2YWwoY3JlYXRlUGFuZWxJZkhhc1Z1ZSwgMTAwMClcbmNyZWF0ZVBhbmVsSWZIYXNWdWUoKVxuXG5mdW5jdGlvbiBjcmVhdGVQYW5lbElmSGFzVnVlICgpIHtcbiAgaWYgKGNyZWF0ZWQgfHwgY2hlY2tDb3VudCsrID4gMTApIHtcbiAgICBjbGVhckludGVydmFsKGNoZWNrVnVlSW50ZXJ2YWwpXG4gICAgcmV0dXJuXG4gIH1cbiAgY2hyb21lLmRldnRvb2xzLmluc3BlY3RlZFdpbmRvdy5ldmFsKFxuICAgICchISh3aW5kb3cuX19WVUVfREVWVE9PTFNfR0xPQkFMX0hPT0tfXy5WdWUgfHwgd2luZG93Ll9fVlVFX0RFVlRPT0xTX0dMT0JBTF9IT09LX18uYXBwcy5sZW5ndGgpJyxcbiAgICBmdW5jdGlvbiAoaGFzVnVlKSB7XG4gICAgICBpZiAoIWhhc1Z1ZSB8fCBjcmVhdGVkKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgY2xlYXJJbnRlcnZhbChjaGVja1Z1ZUludGVydmFsKVxuICAgICAgY3JlYXRlZCA9IHRydWVcbiAgICAgIGNocm9tZS5kZXZ0b29scy5wYW5lbHMuY3JlYXRlKFxuICAgICAgICAnVnVlJywgJ2ljb25zLzEyOC5wbmcnLCAnZGV2dG9vbHMuaHRtbCcsXG4gICAgICAgIHBhbmVsID0+IHtcbiAgICAgICAgICAvLyBwYW5lbCBsb2FkZWRcbiAgICAgICAgICBwYW5lbC5vblNob3duLmFkZExpc3RlbmVyKG9uUGFuZWxTaG93bilcbiAgICAgICAgICBwYW5lbC5vbkhpZGRlbi5hZGRMaXN0ZW5lcihvblBhbmVsSGlkZGVuKVxuICAgICAgICB9LFxuICAgICAgKVxuICAgIH0sXG4gIClcbn1cblxuLy8gTWFuYWdlIHBhbmVsIHZpc2liaWxpdHlcblxuZnVuY3Rpb24gb25QYW5lbFNob3duICgpIHtcbiAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoJ3Z1ZS1wYW5lbC1zaG93bicpXG59XG5cbmZ1bmN0aW9uIG9uUGFuZWxIaWRkZW4gKCkge1xuICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSgndnVlLXBhbmVsLWhpZGRlbicpXG59XG4iXSwibmFtZXMiOlsiY3JlYXRlZCIsImNoZWNrQ291bnQiLCJjaHJvbWUiLCJkZXZ0b29scyIsIm5ldHdvcmsiLCJvbk5hdmlnYXRlZCIsImFkZExpc3RlbmVyIiwiY3JlYXRlUGFuZWxJZkhhc1Z1ZSIsImNoZWNrVnVlSW50ZXJ2YWwiLCJzZXRJbnRlcnZhbCIsImNsZWFySW50ZXJ2YWwiLCJpbnNwZWN0ZWRXaW5kb3ciLCJldmFsIiwiaGFzVnVlIiwicGFuZWxzIiwiY3JlYXRlIiwicGFuZWwiLCJvblNob3duIiwib25QYW5lbFNob3duIiwib25IaWRkZW4iLCJvblBhbmVsSGlkZGVuIiwicnVudGltZSIsInNlbmRNZXNzYWdlIl0sInNvdXJjZVJvb3QiOiIifQ==