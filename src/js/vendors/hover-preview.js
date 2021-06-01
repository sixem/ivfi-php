/*!
 * hover-preview-js v2.0.5-custom - Adds hoverable video and image previews to elements in Vanilla JS.
 * Copyright emy (sixem) (c) 2021 [https://github.com/sixem/hover-preview-js]
 * Build: 2021-05-22 (3248ff3a18272d8610a8)
 * License: MIT
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["hoverPreview"] = factory();
	else
		root["hoverPreview"] = factory();
})(window, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// CONCATENATED MODULE: ./utils.js


function getLeft(left, eWidth, offsetX) {
  if (left) {
    if (window.innerWidth - offsetX - 20 > eWidth) {
      return offsetX + 20;
    } else if (window.innerWidth > eWidth) {
      return window.innerWidth - eWidth;
    }
  } else {
    if (eWidth < offsetX - 20) {
      return offsetX - eWidth - 20;
    } else {
      return 0;
    }
  }

  return 0;
}

function getTop(offset, dimensions) {
  var wHeight = window.innerHeight;

  if (dimensions.y >= wHeight) {
    return 0;
  }

  var percentage = offset.y / wHeight * 100;
  percentage = percentage > 100 ? 100 : percentage;
  return wHeight / 100 * percentage - dimensions.y / 100 * percentage;
}

function move(left, element, data) {
  var offset = data.offset,
      dimensions = data.dimensions;
  element.style['left'] = getLeft(left, element.clientWidth, offset.x) + 'px';
  element.style['top'] = getTop(offset, dimensions) + 'px';
  return false;
}

function getMove() {
  if (window.requestAnimationFrame) {
    return function (left, element, data) {
      window.requestAnimationFrame(function () {
        move(left, element, data);
      });
    };
  }

  return function (left, element, data) {
    move(left, element, data);
  };
}
function getType() {
  if (this.data.force) {
    this.data.extension = this.data.force.extension;
    return this.data.force.type;
  }

  this.data.extension = this.data.src.split('.').pop().toLowerCase();

  if (['jpg', 'jpeg', 'gif', 'png', 'ico', 'svg', 'bmp', 'webp'].includes(this.data.extension)) {
    return 0;
  } else if (['webm', 'mp4', 'ogg', 'ogv'].includes(this.data.extension)) {
    return 1;
  }

  return null;
}
function createContainer() {
  var container = document.createElement('div');
  container.className = 'preview-container';
  var styles = {
    'pointer-events': 'none',
    'position': 'fixed',
    'visibility': 'hidden',
    'z-index': '9999',
    'top': '-9999px',
    'left': '-9999px',
    'max-width': '100vw',
    'max-height': '100vh'
  };
  Object.keys(styles).forEach(function (key) {
    container.style[key] = styles[key];
  });
  return container;
}

function encodeUrl(input) {
  return this.options.encodeAll ? encodeURI(input).replace('#', '%23').replace('?', '%3F') : encodeURI(input);
}

function loadImage(src, callback) {
  var img = document.createElement('img'),
      _this = this;

  img.style['max-width'] = 'inherit';
  img.style['max-height'] = 'inherit';
  img.src = encodeUrl.call(_this, src);
  _this.timers.load = setInterval(function () {
    var w = img.naturalWidth,
        h = img.naturalHeight;

    if (w && h) {
      clearInterval(_this.timers.load);
      callback(img, [w, h]);
    }
  }, 30);
}
function loadVideo(src, callback) {
  var video = document.createElement('video'),
      source = video.appendChild(document.createElement('source'));
  ['muted', 'loop', 'autoplay'].forEach(function (key) {
    video[key] = true;
  });
  source.type = 'video/' + (this.data.extension === 'ogv' ? 'ogg' : this.data.extension);
  source.src = encodeUrl.call(this, src);
  video.style['max-width'] = 'inherit';
  video.style['max-height'] = 'inherit';

  video.onloadedmetadata = function () {
    callback(video, [this.videoWidth, this.videoHeight]);
  };
}
// CONCATENATED MODULE: ./events.js




function setOffset(e) {
  this.data.offset = {
    x: e.clientX,
    y: e.clientY
  };
}

function onEnter(e) {
  var target = e.target; // get source

  if (Object.prototype.hasOwnProperty.call(this.options, 'source') && this.options.source) {
    this.data.src = this.options.source;
  } else {
    if (target.hasAttribute('data-src')) {
      this.data.src = target.getAttribute('data-src');
    } else if (target.hasAttribute('src')) {
      this.data.src = target.getAttribute('src');
    } else if (target.hasAttribute('href')) {
      this.data.src = target.getAttribute('href');
    }
  }

  if (this.data.src === null) {
    throw Error('No valid source value found.');
  } // get source type


  this.data.type = getType.call(this); // if valid source type

  if (this.data.type != null) {
    var _this = this; // whether the cursor is on the left or ride side of the viewport


    this.data.left = this.data.offset.x <= window.innerWidth / 2; // create preview container

    var container = createContainer();
    document.body.prepend(container); // change cursor style if option is set

    if (this.options.cursor && this.data.cursor === null) {
      this.data.cursor = target.style.cursor;
      target.style.cursor = 'progress';
    } // handle image type


    if (this.data.type === 0 || this.data.type === 1) {
      // wait for media to show its dimensions
      (this.data.type === 0 ? loadImage : loadVideo).call(this, this.data.src, function (e, dimensions) {
        container.appendChild(e);
        _this.data.container = container;
        _this.data.dimensions = {
          x: dimensions[0],
          y: dimensions[1]
        };
        _this.loaded = true;
        update.call(_this);
        container.style['visibility'] = 'visible'; // media is loaded, revert loading cursor

        if (_this.options.cursor) {
          target.style.cursor = _this.data.cursor ? _this.data.cursor : '';
        }
      });
    }
  }
}

function update() {
  this.updater(this.data.left, this.data.container, {
    dimensions: this.data.dimensions,
    offset: {
      x: this.data.offset.x,
      y: this.data.offset.y
    }
  });
}

function mousemove(e) {
  setOffset.call(this, e);

  if (!this.loaded) {
    return false;
  }

  update.call(this);
}
function mouseenter(e) {
  setOffset.call(this, e);

  var _this = this;

  if (this.options.delay && this.options.delay > 0) {
    this.timers.delay = setTimeout(function () {
      onEnter.call(_this, e);
    }, this.options.delay);
  } else {
    onEnter.call(_this, e);
  }
} // destroy preview container

function mouseleave(e) {
  if (this.options.cursor && e.target.style.cursor === 'progress') {
    e.target.style.cursor = this.data.cursor ? this.data.cursor : '';
    this.data.cursor = null;
  }

  var container = document.querySelector('.preview-container');

  if (container) {
    container.remove();
  }

  clearTimeout(this.timers.delay);
  clearInterval(this.timers.load);
  this.loaded = false;
}
// CONCATENATED MODULE: ./hover-preview.js


function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }



var defaults = {
  delay: 75,
  encodeAll: false,
  cursor: true,
  force: null
};

var hoverPreview = /*#__PURE__*/function () {
  function hoverPreview(element) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, hoverPreview);

    if (!element) {
      throw Error('No element were passed.');
    }

    this.element = element;
    this.options = options;
    setup.call(this);
  }

  _createClass(hoverPreview, [{
    key: "reload",
    value: function reload() {
      this.destroy();
      setup.call(this);
    }
  }, {
    key: "destroy",
    value: function destroy() {
      var events = this.events;
      this.handle.removeEventListener('mouseenter', events.mouseenter, false);
      this.handle.removeEventListener('mouseleave', events.mouseleave, false);
      this.handle.removeEventListener('mousemove', events.mousemove, false);
    }
  }]);

  return hoverPreview;
}();

function setup() {
  // set options and data
  this.options = _objectSpread(_objectSpread({}, defaults), this.options);
  this.data = {
    cursor: null,
    left: null,
    src: null,
    type: null,
    offset: null,
    dimensions: null,
    force: null
  };

  if (this.options.force) {
    this.data.force = this.options.force;
  }

  this.timers = {
    load: null,
    delay: null
  }; // set handle

  this.handle = this.element; // move function

  this.updater = getMove();
  this.events = {
    mouseenter: mouseenter.bind(this),
    mouseleave: mouseleave.bind(this),
    mousemove: mousemove.bind(this)
  }; // add events

  this.handle.addEventListener('mouseenter', this.events.mouseenter, false);
  this.handle.addEventListener('mouseleave', this.events.mouseleave, false);
  this.handle.addEventListener('mousemove', this.events.mousemove, false);
} // export default


/* harmony default export */ var hover_preview = (function (element, options) {
  return new hoverPreview(element, options);
});
// CONCATENATED MODULE: ./index.js

/* harmony default export */ var index = __webpack_exports__["default"] = (hover_preview);

/***/ })
/******/ ])["default"];
});