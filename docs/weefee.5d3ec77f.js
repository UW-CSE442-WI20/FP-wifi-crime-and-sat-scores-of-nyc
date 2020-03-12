// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"k0pM":[function(require,module,exports) {
module.exports = "https://uw-cse442-wi20.github.io/FP-wifi-crime-and-sat-scores-of-nyc/weefee.bd7ba5f7.csv";
},{}],"qDJ0":[function(require,module,exports) {
"use strict";

var _weefee = _interopRequireDefault(require("./weefee.csv"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var XSTART = 0;
var YSPACING_SCALE = 160;
var YSPACING_OFFSET = 100;
var RAW_CIRCLE_ADJUSTMENT = 2.5;
var PROCESSED_CIRCLE_ADJUSTMENT = 16;
var TEXT_RAW_CIRCLE_DIST = 230;
var SVG_WIDTH = 350;
var SVG_HEIGHT = 800; // Make left side SVG Container

var svg3 = d3.select("#viz2").append("svg").attr("width", 320).attr("height", SVG_HEIGHT).attr("transform", "translate(0,0)"); // todo: try deleting this see if anything changes

var svg4 = d3.select("#viz2").append("svg").attr("width", SVG_WIDTH).attr("height", SVG_HEIGHT).attr("id", "right-circles2");
var mapping = {
  "Brooklyn": 0,
  "Manhattan": 0,
  "Bronx": 0,
  "Queens": 0,
  "Staten Island": 0
};
var areas = {
  "Brooklyn": 69.5,
  "Manhattan": 22.8,
  "Bronx": 42.5,
  "Queens": 108.1,
  "Staten Island": 58.69
};
var colors = ["firebrick", "orange", "gold", "green", "steelblue"];
d3.csv(_weefee.default).then(function (data) {
  data.forEach(function (d) {
    if (d.BoroName in mapping) {
      mapping[d.BoroName]++;
    }
  }); // Add the SVG Text Element to the svgContainer

  var text = svg3.selectAll(".labels").data(d3.entries(mapping)).enter().append("text").attr("x", XSTART).attr("y", function (d, i) {
    return i * YSPACING_SCALE + YSPACING_OFFSET;
  }).text(function (d) {
    return d.key.toUpperCase();
  });
  var nodes3 = svg3.append("g").attr("class", "nodes").selectAll("circle").data(d3.entries(mapping)).enter() // Add one g element for each data node here.
  .append("g") // Position the g element like the circle element used to be.
  .attr("transform", function (d, i) {
    // Set d.x and d.y here so that other elements can use it. d is 
    // expected to be an object here.
    d.x = XSTART + TEXT_RAW_CIRCLE_DIST;
    d.y = i * YSPACING_SCALE + YSPACING_OFFSET;
    return "translate(" + d.x + "," + d.y + ")";
  }); // Add a circle element to the previously added g element.

  nodes3.append("circle").attr("class", "node").attr("r", function (d) {
    return Math.sqrt(d.value) * RAW_CIRCLE_ADJUSTMENT;
  }).style("fill", function (d, i) {
    return colors[i];
  }).append("svg:title").text(function (d) {
    return d.key + ": " + d.value + " wifi hotspots";
  }); // Add a text element to the previously added g element.

  nodes3.append("text").attr("text-anchor", "middle").text(function (d) {
    return Math.round(d.value);
  });
  var nodes4 = svg4.append("g").attr("class", "nodes").selectAll("circle").data(d3.entries(mapping)).enter() // Add one g element for each data node here.
  .append("g") // Position the g element like the circle element used to be.
  .attr("transform", function (d, i) {
    // Set d.x and d.y here so that other elements can use it. d is 
    // expected to be an object here.
    d.x = XSTART + TEXT_RAW_CIRCLE_DIST;
    d.y = i * YSPACING_SCALE + YSPACING_OFFSET;
    return "translate(" + d.x + "," + d.y + ")";
  }); // Add a circle element to the previously added g element.

  nodes4.append("circle").attr("class", "node").attr("r", function (d) {
    return Math.sqrt(d.value / areas[d.key]) * PROCESSED_CIRCLE_ADJUSTMENT;
  }).style("fill", function (d, i) {
    return colors[i];
  }).append("svg:title").text(function (d) {
    return d.key + ": " + Math.round(d.value / areas[d.key]) + " wifi hotspots per square mile";
  }); // Add a text element to the previously added g element.

  nodes4.append("text").attr("text-anchor", "middle").text(function (d) {
    return Math.round(d.value / areas[d.key]);
  });
});
$("#right-circles2").hide();
$(".right-circle-title2").hide();
$(".reveal-text2").hide();
$(".reveal-btn2").click(function () {
  $("#right-circles2").slideToggle(700);
  $(".right-circle-title2").slideToggle(700);
  $(".reveal-text2").slideToggle(700);
});
},{"./weefee.csv":"k0pM"}]},{},["qDJ0"], null)
//# sourceMappingURL=https://uw-cse442-wi20.github.io/FP-wifi-crime-and-sat-scores-of-nyc/weefee.5d3ec77f.js.map