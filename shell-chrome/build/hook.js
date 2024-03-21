/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!*********************!*\
  !*** ./src/hook.js ***!
  \*********************/
const script = document.createElement('script');
script.src = chrome.runtime.getURL('build/hook-exec.js');

script.onload = () => {
  script.remove();
};

(document.head || document.documentElement).appendChild(script);
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9vay5qcyIsIm1hcHBpbmdzIjoiOzs7OztBQUFBLE1BQU1BLE1BQU0sR0FBR0MsUUFBUSxDQUFDQyxhQUFULENBQXVCLFFBQXZCLENBQWY7QUFDQUYsTUFBTSxDQUFDRyxHQUFQLEdBQWFDLE1BQU0sQ0FBQ0MsT0FBUCxDQUFlQyxNQUFmLENBQXNCLG9CQUF0QixDQUFiOztBQUNBTixNQUFNLENBQUNPLE1BQVAsR0FBZ0IsTUFBTTtFQUNwQlAsTUFBTSxDQUFDUSxNQUFQO0FBQ0QsQ0FGRDs7QUFHQyxDQUFDUCxRQUFRLENBQUNRLElBQVQsSUFBaUJSLFFBQVEsQ0FBQ1MsZUFBM0IsRUFBNENDLFdBQTVDLENBQXdEWCxNQUF4RCxFIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi9zcmMvaG9vay5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKVxuc2NyaXB0LnNyYyA9IGNocm9tZS5ydW50aW1lLmdldFVSTCgnYnVpbGQvaG9vay1leGVjLmpzJylcbnNjcmlwdC5vbmxvYWQgPSAoKSA9PiB7XG4gIHNjcmlwdC5yZW1vdmUoKVxufVxuOyhkb2N1bWVudC5oZWFkIHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCkuYXBwZW5kQ2hpbGQoc2NyaXB0KVxuIl0sIm5hbWVzIjpbInNjcmlwdCIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsInNyYyIsImNocm9tZSIsInJ1bnRpbWUiLCJnZXRVUkwiLCJvbmxvYWQiLCJyZW1vdmUiLCJoZWFkIiwiZG9jdW1lbnRFbGVtZW50IiwiYXBwZW5kQ2hpbGQiXSwic291cmNlUm9vdCI6IiJ9