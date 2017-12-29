/**
 * videojs-vtt-thumbnails
 * @version 0.0.3
 * @copyright 2017 Chris Boustead <chris@forgemotion.com>
 * @license MIT
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('video.js')) :
	typeof define === 'function' && define.amd ? define(['video.js'], factory) :
	(global.videojsVttThumbnails = factory(global.videojs));
}(this, (function (videojs) { 'use strict';

videojs = videojs && videojs.hasOwnProperty('default') ? videojs['default'] : videojs;

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

var win;

if (typeof window !== "undefined") {
    win = window;
} else if (typeof commonjsGlobal !== "undefined") {
    win = commonjsGlobal;
} else if (typeof self !== "undefined"){
    win = self;
} else {
    win = {};
}

var window_1 = win;

var empty = {};


var empty$1 = Object.freeze({
	default: empty
});

var minDoc = ( empty$1 && empty ) || empty$1;

var topLevel = typeof commonjsGlobal !== 'undefined' ? commonjsGlobal :
    typeof window !== 'undefined' ? window : {};


var doccy;

if (typeof document !== 'undefined') {
    doccy = document;
} else {
    doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }
}

var document_1 = doccy;

var version = "0.0.3";

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

// Default options for the plugin.
var defaults = {};
var Xhr = videojs.xhr;

// Cross-compatibility for Video.js 5 and 6.
var registerPlugin = videojs.registerPlugin || videojs.plugin;

/**
 * VTT Thumbnails class.
 *
 * This class performs all functions related to displaying the vtt
 * thumbnails.
 */

var VttThumbnailsPlugin = function () {

  /**
   * Plugin class constructor, called by videojs on
   * ready event.
   *
   * @function  constructor
   * @param    {Player} player
   *           A Video.js player object.
   *
   * @param    {Object} [options={}]
   *           A plain object containing options for the plugin.
   */
  function VttThumbnailsPlugin(player, options) {
    classCallCheck(this, VttThumbnailsPlugin);

    this.player = player;
    this.options = options;
    this.initializeThumbnails();
    return this;
  }

  VttThumbnailsPlugin.prototype.src = function src(source) {
    this.resetPlugin();
    this.options.src = source;
    this.initializeThumbnails();
  };

  VttThumbnailsPlugin.prototype.detach = function detach() {
    this.resetPlugin();
  };

  VttThumbnailsPlugin.prototype.resetPlugin = function resetPlugin() {
    var _this = this;

    this.progressBar.removeEventListener('mouseenter', function () {
      return _this.onBarMouseenter();
    });
    this.progressBar.removeEventListener('mouseleave', function () {
      return _this.onBarMouseleave();
    });
    this.progressBar.removeEventListener('mousemove', this.onBarMousemove);
    delete this.progressBar;
    delete this.vttData;
    delete this.thumbnailHolder;
    delete this.lastStyle;
  };

  /**
   * Bootstrap the plugin.
   */


  VttThumbnailsPlugin.prototype.initializeThumbnails = function initializeThumbnails() {
    var _this2 = this;

    if (!this.options.src) {
      return;
    }
    var baseUrl = this.getBaseUrl();
    var url = this.getFullyQualifiedUrl(this.options.src, baseUrl);

    this.getVttFile(url).then(function (data) {
      _this2.vttData = _this2.processVtt(data);
      _this2.setupThumbnailElement();
    });
  };

  /**
   * Builds a base URL should we require one.
   *
   * @return {string}
   *         The current browser base url
   */


  VttThumbnailsPlugin.prototype.getBaseUrl = function getBaseUrl() {
    return [window_1.location.protocol, '//', window_1.location.hostname, window_1.location.port ? ':' + window_1.location.port : '', window_1.location.pathname].join('').split(/([^\/]*)$/gi).shift();
  };

  /**
   * Grabs the contents of the VTT file.
   *
   * @param {string} url
   *        The url of vtt file to load.
   * @return {Promise}
   *         Resolve with the vtt file content
   */


  VttThumbnailsPlugin.prototype.getVttFile = function getVttFile(url) {
    var _this3 = this;

    return new Promise(function (resolve, reject) {
      var req = new Xhr();

      req.data = {
        resolve: resolve
      };
      req.addEventListener('load', _this3.vttFileLoaded);
      req.open('GET', url);
      req.send();
    });
  };

  /**
   * Callback for loaded VTT file.
   */


  VttThumbnailsPlugin.prototype.vttFileLoaded = function vttFileLoaded() {
    this.data.resolve(this.responseText);
  };

  VttThumbnailsPlugin.prototype.setupThumbnailElement = function setupThumbnailElement(data) {
    var _this4 = this;

    var mouseDisplay = this.player.$('.vjs-mouse-display');
    var thumbHolder = document_1.createElement('div');

    thumbHolder.setAttribute('class', 'vjs-vtt-thumbnail-display');

    this.progressBar = this.player.$('.vjs-progress-control');
    this.progressBar.appendChild(thumbHolder);
    this.thumbnailHolder = thumbHolder;
    mouseDisplay.classList.add('vjs-hidden');

    this.progressBar.addEventListener('mouseenter', function () {
      return _this4.onBarMouseenter();
    });
    this.progressBar.addEventListener('mouseleave', function () {
      return _this4.onBarMouseleave();
    });
  };

  VttThumbnailsPlugin.prototype.onBarMouseenter = function onBarMouseenter() {
    var _this5 = this;

    this.mouseMoveCallback = function (e) {
      _this5.onBarMousemove(e);
    };
    this.progressBar.addEventListener('mousemove', this.mouseMoveCallback);
    this.showThumbnailHolder();
  };

  VttThumbnailsPlugin.prototype.onBarMouseleave = function onBarMouseleave() {
    this.progressBar.removeEventListener('mousemove', this.mouseMoveCallback);
    this.hideThumbnailHolder();
  };

  VttThumbnailsPlugin.prototype.onBarMousemove = function onBarMousemove(event) {
    this.updateThumbnailStyle(videojs.dom.getPointerPosition(this.progressBar, event).x, this.progressBar.offsetWidth);
  };

  VttThumbnailsPlugin.prototype.getStyleForTime = function getStyleForTime(time) {
    for (var i = 0; i < this.vttData.length; ++i) {
      var item = this.vttData[i];

      if (time >= item.start && time < item.end) {
        return item.css;
      }
    }
  };

  VttThumbnailsPlugin.prototype.showThumbnailHolder = function showThumbnailHolder() {
    this.thumbnailHolder.style.opacity = '1';
  };

  VttThumbnailsPlugin.prototype.hideThumbnailHolder = function hideThumbnailHolder() {
    this.thumbnailHolder.style.opacity = '0';
  };

  VttThumbnailsPlugin.prototype.updateThumbnailStyle = function updateThumbnailStyle(percent, width) {
    var duration = this.player.duration();
    var time = percent * duration;
    var currentStyle = this.getStyleForTime(time);

    if (!currentStyle) {
      return this.hideThumbnailHolder();
    }
    var xPos = percent * width;

    this.thumbnailHolder.style.transform = 'translateX(' + xPos + 'px)';
    this.thumbnailHolder.style.marginLeft = '-' + Math.floor(currentStyle.width) / 2 + 'px';

    if (this.lastStyle && this.lastStyle === currentStyle) {
      return;
    }
    this.lastStyle = currentStyle;

    for (var style in currentStyle) {
      if (currentStyle.hasOwnProperty(style)) {
        this.thumbnailHolder.style[style] = currentStyle[style];
      }
    }
  };

  VttThumbnailsPlugin.prototype.processVtt = function processVtt(data) {
    var _this6 = this;

    var processedVtts = [];
    var vttDefinitions = data.split(/[\r\n][\r\n]/i);

    vttDefinitions.forEach(function (vttDef) {
      if (vttDef.match(new RegExp('([0-9]{2}:)?([0-9]{2}:)?' + '[0-9]{2}(.[0-9]{3})?( ?--> ?)' + '([0-9]{2}:)?([0-9]{2}:)?' + '[0-9]{2}(.[0-9]{3})?[\r\n]{1}.*', 'gi'))) {
        var vttDefSplit = vttDef.split(/[\r\n]/i);
        var vttTiming = vttDefSplit[0];
        var vttTimingSplit = vttTiming.split(/ ?--> ?/i);
        var vttTimeStart = vttTimingSplit[0];
        var vttTimeEnd = vttTimingSplit[1];
        var vttImageDef = vttDefSplit[1];
        var vttCssDef = _this6.getVttCss(vttImageDef);

        processedVtts.push({
          start: _this6.getSecondsFromTimestamp(vttTimeStart),
          end: _this6.getSecondsFromTimestamp(vttTimeEnd),
          css: vttCssDef
        });
      }
    });
    return processedVtts;
  };

  VttThumbnailsPlugin.prototype.getFullyQualifiedUrl = function getFullyQualifiedUrl(path, base) {
    if (path.indexOf('//') >= 0) {
      // We have a fully qualified path.
      return path;
    }
    if (base.indexOf('//') === 0) {
      // We don't have a fully qualified path, but need to
      // be careful with trimming.
      return [base.replace(/\/$/gi, ''), this.trim(path, '/')].join('/');
    }
    if (base.indexOf('//') > 0) {
      // We don't have a fully qualified path, and should
      // trim both sides of base and path.
      return [this.trim(base, '/'), this.trim(path, '/')].join('/');
    }

    // If all else fails.
    return path;
  };

  VttThumbnailsPlugin.prototype.getPropsFromDef = function getPropsFromDef(def) {
    var imageDefSplit = def.split(/#xywh=/i);
    var imageUrl = imageDefSplit[0];
    var imageCoords = imageDefSplit[1];
    var splitCoords = imageCoords.match(/[0-9]+/gi);

    return {
      x: splitCoords[0],
      y: splitCoords[1],
      w: splitCoords[2],
      h: splitCoords[3],
      image: imageUrl
    };
  };

  VttThumbnailsPlugin.prototype.getVttCss = function getVttCss(vttImageDef) {

    var cssObj = {};

    // If there isn't a protocol, use the VTT source URL.
    var baseSplit = void 0;

    if (this.options.src.indexOf('//') >= 0) {
      baseSplit = this.options.src.split(/([^\/]*)$/gi).shift();
    } else {
      baseSplit = this.getBaseUrl() + this.options.src.split(/([^\/]*)$/gi).shift();
    }

    vttImageDef = this.getFullyQualifiedUrl(vttImageDef, baseSplit);

    if (!vttImageDef.match(/#xywh=/i)) {
      cssObj.background = 'url("' + vttImageDef + '")';
      return cssObj;
    }

    var imageProps = this.getPropsFromDef(vttImageDef);

    cssObj.background = 'url("' + imageProps.image + '") no-repeat -' + imageProps.x + 'px -' + imageProps.y + 'px';
    cssObj.width = imageProps.w + 'px';
    cssObj.height = imageProps.h + 'px';

    return cssObj;
  };

  VttThumbnailsPlugin.prototype.doconstructTimestamp = function doconstructTimestamp(timestamp) {
    var splitStampMilliseconds = timestamp.split('.');
    var timeParts = splitStampMilliseconds[0];
    var timePartsSplit = timeParts.split(':');

    return {
      milliseconds: parseInt(splitStampMilliseconds[1], 10) || 0,
      seconds: parseInt(timePartsSplit.pop(), 10) || 0,
      minutes: parseInt(timePartsSplit.pop(), 10) || 0,
      hours: parseInt(timePartsSplit.pop(), 10) || 0
    };
  };

  VttThumbnailsPlugin.prototype.getSecondsFromTimestamp = function getSecondsFromTimestamp(timestamp) {
    var timestampParts = this.doconstructTimestamp(timestamp);

    return parseInt(timestampParts.hours * (60 * 60) + timestampParts.minutes * 60 + timestampParts.seconds + timestampParts.milliseconds * 1000, 10);
  };

  VttThumbnailsPlugin.prototype.trim = function trim(str, charlist) {
    var whitespace = [' ', '\n', '\r', '\t', '\f', '\x0b', '\xa0', '\u2000', '\u2001', '\u2002', '\u2003', '\u2004', '\u2005', '\u2006', '\u2007', '\u2008', '\u2009', '\u200A', '\u200B', '\u2028', '\u2029', '\u3000'].join('');

    var l = 0;
    var i = 0;

    str += '';
    if (charlist) {
      whitespace = (charlist + '').replace(/([[\]().?/*{}+$^:])/g, '$1');
    }

    for (i = 0, l = str.length; i < l; i++) {
      if (whitespace.indexOf(str.charAt(i)) === -1) {
        str = str.substring(i);
        break;
      }
    }
    l = str.length;
    for (i = l - 1; i >= 0; i--) {
      if (whitespace.indexOf(str.charAt(i)) === -1) {
        str = str.substring(0, i + 1);
        break;
      }
    }
    return whitespace.indexOf(str.charAt(0)) === -1 ? str : '';
  };

  return VttThumbnailsPlugin;
}();

/**
 * Function to invoke when the player is ready.
 *
 * This is a great place for your plugin to initialize itself. When this
 * function is called, the player will have its DOM and child components
 * in place.
 *
 * @function onPlayerReady
 * @param    {Player} player
 *           A Video.js player object.
 *
 * @param    {Object} [options={}]
 *           A plain object containing options for the plugin.
 */


var onPlayerReady = function onPlayerReady(player, options) {
  player.addClass('vjs-vtt-thumbnails');
  player.vttThumbnails = new VttThumbnailsPlugin(player, options);
};

/**
 * A video.js plugin.
 *
 * In the plugin function, the value of `this` is a video.js `Player`
 * instance. You cannot rely on the player being in a "ready" state here,
 * depending on how the plugin is invoked. This may or may not be important
 * to you; if not, remove the wait for "ready"!
 *
 * @function vttThumbnails
 * @param    {Object} [options={}]
 *           An object of options left to the plugin author to define.
 */
var vttThumbnails = function vttThumbnails(options) {
  var _this7 = this;

  this.ready(function () {
    onPlayerReady(_this7, videojs.mergeOptions(defaults, options));
  });
};

// Register the plugin with video.js.
registerPlugin('vttThumbnails', vttThumbnails);

// Include the version number.
vttThumbnails.VERSION = version;

return vttThumbnails;

})));
