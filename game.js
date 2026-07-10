(function (global) {
  'use strict';

  var Game = {};

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
  }
  global.Game = Game;
})(typeof window !== 'undefined' ? window : globalThis);
