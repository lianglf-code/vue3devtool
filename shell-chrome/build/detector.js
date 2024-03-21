/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!*************************!*\
  !*** ./src/detector.js ***!
  \*************************/
window.addEventListener('message', event => {
  if (event.data.key === '_vue-devtools-send-message') {
    chrome.runtime.sendMessage(event.data.message);
  }
}, false);
const script = document.createElement('script');
script.src = chrome.runtime.getURL('build/detector-exec.js');

script.onload = () => {
  script.remove();
};

(document.head || document.documentElement).appendChild(script);
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV0ZWN0b3IuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQUEsTUFBTSxDQUFDQyxnQkFBUCxDQUF3QixTQUF4QixFQUFvQ0MsS0FBRCxJQUFXO0VBQzVDLElBQUlBLEtBQUssQ0FBQ0MsSUFBTixDQUFXQyxHQUFYLEtBQW1CLDRCQUF2QixFQUFxRDtJQUNuREMsTUFBTSxDQUFDQyxPQUFQLENBQWVDLFdBQWYsQ0FBMkJMLEtBQUssQ0FBQ0MsSUFBTixDQUFXSyxPQUF0QztFQUNEO0FBQ0YsQ0FKRCxFQUlHLEtBSkg7QUFNQSxNQUFNQyxNQUFNLEdBQUdDLFFBQVEsQ0FBQ0MsYUFBVCxDQUF1QixRQUF2QixDQUFmO0FBQ0FGLE1BQU0sQ0FBQ0csR0FBUCxHQUFhUCxNQUFNLENBQUNDLE9BQVAsQ0FBZU8sTUFBZixDQUFzQix3QkFBdEIsQ0FBYjs7QUFDQUosTUFBTSxDQUFDSyxNQUFQLEdBQWdCLE1BQU07RUFDcEJMLE1BQU0sQ0FBQ00sTUFBUDtBQUNELENBRkQ7O0FBR0MsQ0FBQ0wsUUFBUSxDQUFDTSxJQUFULElBQWlCTixRQUFRLENBQUNPLGVBQTNCLEVBQTRDQyxXQUE1QyxDQUF3RFQsTUFBeEQsRSIsInNvdXJjZXMiOlsid2VicGFjazovL0B2dWUtZGV2dG9vbHMvc2hlbGwtY2hyb21lLy4vc3JjL2RldGVjdG9yLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgKGV2ZW50KSA9PiB7XG4gIGlmIChldmVudC5kYXRhLmtleSA9PT0gJ192dWUtZGV2dG9vbHMtc2VuZC1tZXNzYWdlJykge1xuICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKGV2ZW50LmRhdGEubWVzc2FnZSlcbiAgfVxufSwgZmFsc2UpXG5cbmNvbnN0IHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpXG5zY3JpcHQuc3JjID0gY2hyb21lLnJ1bnRpbWUuZ2V0VVJMKCdidWlsZC9kZXRlY3Rvci1leGVjLmpzJylcbnNjcmlwdC5vbmxvYWQgPSAoKSA9PiB7XG4gIHNjcmlwdC5yZW1vdmUoKVxufVxuOyhkb2N1bWVudC5oZWFkIHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCkuYXBwZW5kQ2hpbGQoc2NyaXB0KVxuIl0sIm5hbWVzIjpbIndpbmRvdyIsImFkZEV2ZW50TGlzdGVuZXIiLCJldmVudCIsImRhdGEiLCJrZXkiLCJjaHJvbWUiLCJydW50aW1lIiwic2VuZE1lc3NhZ2UiLCJtZXNzYWdlIiwic2NyaXB0IiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50Iiwic3JjIiwiZ2V0VVJMIiwib25sb2FkIiwicmVtb3ZlIiwiaGVhZCIsImRvY3VtZW50RWxlbWVudCIsImFwcGVuZENoaWxkIl0sInNvdXJjZVJvb3QiOiIifQ==