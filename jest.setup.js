// Use CommonJS require instead of import
require('@testing-library/jest-dom');

// Setup DOM environment for testing
global.MutationObserver = class {
  constructor(callback) {}
  disconnect() {}
  observe(element, initObject) {}
};

// Mock window methods that might not be available in Jest's JSDOM environment
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

// Mock CustomEvent if needed
if (typeof window.CustomEvent !== 'function') {
  window.CustomEvent = function(event, params) {
    params = params || { bubbles: false, cancelable: false, detail: null };
    const evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return evt;
  };
}