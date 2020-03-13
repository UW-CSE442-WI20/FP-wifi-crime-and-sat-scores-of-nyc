import * as d3 from 'd3';
import * as d3ss from 'd3-simple-slider';
import $ from "jquery";
import fullpage from 'fullpage.js';
import geoData from './school_districts.json';
import scoresCsv from './scores.csv';
import sdCentersCsv from './school_district_centers.csv';
import sdScoreAvgsCsv from './district_score_avgs.csv';
import sdDataCsv from './districtData.csv'
import noiseCsv from './party_in_nyc.csv'
import districtpartycsv from "./districtNoise.csv";
import districtweefeecsv from "./districtWifi.csv";

const schoolName = 'School Name';
const math = 'Average Score (SAT Math)';
const reading = 'Average Score (SAT Reading)';
const writing = 'Average Score (SAT Writing)';

var fullPageInstance = new fullpage('#fullpage', {
  sectionsColor:['white', 'white', 'white', 'white', 'white', 'white'],
  anchors:['firstPage', 'secondPage', 'thirdPage', 'fourthPage', 'fifthPage', 'sixthPage'],
  navigation: true,
  scrollBar: true
});

// HELPER METHODS //////////////////////////////////////////////////////////////
/* Generates a scale for given domain with range [0, 1].
domain: [minValue, maxValue]
*/
let createScale = function(domain) {
  return d3.scaleLinear().domain([domain[1], domain[0]]).range([0, 1]);
}

///////// COLOR SCHEMES & SCALES // see: https://github.com/d3/d3-scale-chromatic /////
var schemeIncome = d3.interpolateBlues;
var domainIncome = [150000, 1];
var scaleIncome = createScale(domainIncome)

var schemeCrime = d3.interpolateGreens;
var domainCrime = [3000, 1];
var scaleCrime = createScale(domainCrime)

var schemeAsian = d3.interpolateYlOrBr;
var domainAsian = [100, 1];
var scaleAsian = createScale(domainAsian)

var schemeBlack = d3.interpolateGreys;
var domainBlack = [100, 1];
var scaleBlack = createScale(domainBlack)

var schemeHispanic = d3.interpolateOrRd;
var domainHispanic = [100, 1];
var scaleHispanic = createScale(domainHispanic)

var schemeWhite = d3.interpolateBuGn;
var domainWhite = [100, 1];
var scaleWhite = createScale(domainWhite)

var schemeWifi = d3.interpolatePuRd;
var domainWifi = [120, 0];
var scaleWifi = createScale(domainWifi);

var schemeNoise = d3.interpolatePurples;
var domainNoise = [4200, 0];
var scaleNoise = createScale(domainNoise);

// var schemeSat = d3.interpolateGnBu;
// var domainSat = [1600, 1000];
// var scaleSat = createScale(domainSat);

var scaleW = 400;
var scaleH = 50;
var defaultTicks = 5;

// MAPPING VARIABLES
var columns = ["Mean Income", "Mean Sat Score", 
"Percentage Asian", "Percentage Black", "Percentage Hispanic", 
"Percentage White", "Crimes", "Noise", "Wifi"]
var short_names = ['income', 'score', 'asian', 'black', 'hispanic',
    'white', 'crimes', 'noise', 'wifi'];
var alias = new Map(); // Map{feature_name: alias}
var maps = new Map(); // Map{feature: Map{sd#: value}}

d3.csv(sdDataCsv).then(function(data) {
  for (var i = 0; i < columns.length; i++) {
    alias.set(short_names[i], columns[i])
    maps.set(columns[i], new Map())
  }

  data.forEach(function(row) { // Create map for each feature
    var sd = +row.District;
    for (var i = 0; i < columns.length; i++) {
      var column = columns[i];
      if (!isNaN(sd)) {
        maps.get(column).set(sd, +row[column]);
      }
      // maps.get(column).set(sd, row[column]);
    }
  });
});

var currentData = null;
var currentScheme = schemeIncome;
var currentScale = scaleIncome;

/* Creates a color legend.
div: div id string
id: unique id to give legend
gradientName: gradient id string
scheme: scheme that takes in value within domain [0, 1] and outputs a color
domain: [minValue, maxValue]
*/
let generateLegend = function(svg, gradientName, w, h, scheme, domain, ticks) {
  var legend = svg.append("defs")
    .append("svg:linearGradient")
    .attr("id", gradientName)
    .attr("x1", "0%")
    .attr("y1", "100%")
    .attr("x2", "100%")
    .attr("y2", "100%")
    .attr("spreadMethod", "pad");
  legend.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", scheme(0))
    .attr("stop-opacity", 1);
  legend.append("stop")
    .attr("offset", "33%")
    .attr("stop-color", scheme(.33))
    .attr("stop-opacity", 1);
  legend.append("stop")
    .attr("offset", "66%")
    .attr("stop-color", scheme(.66))
    .attr("stop-opacity", 1);
  legend.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", scheme(1))
    .attr("stop-opacity", 1);
  svg.append("rect")
    .attr("width", w)
    .attr("height", h - 30)
    .style("fill", "url(#" + gradientName + ")")
    .attr("transform", "translate(0,10)");
  var y = d3.scaleLinear()
    .range([w, 0])
    .domain(domain);
  var yAxis = d3.axisBottom()
    .scale(y)
    .ticks(ticks);
  svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(0,30)")
    .call(yAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("axis title");
}

/* Generates a projection.
width/height: width/height of SVG to draw map on
scale: scale of map
  NOTE: Unfortunately, you will need to experiment with the scale factor in
        order to find a correct sizing for the map. Inputting desired
        map width/height is not supported due to how I determined
        lat/lng values of each SD.
*/
let createProjection = function(width, height, scale) {
  var projection = d3.geoAlbers() // centered on NYC and scaled
    .center([0, nycLoc[0]])
    .rotate([nycLoc[1], 0])
    .translate([width/2, height/2])
    .scale([scale]);
  return projection;
}

/* Generates the large map at end of webpage.
id: string id to give to map
scheme: scheme that takes in value within domain [0, 1] and outputs a color
scale: D3.scale generated with min, max values as domain and [0, 1] as range
projection: see createProjection()
data: map {sd#: aggregation_value}
*/
let generateLargeMap = function(svg, projection, scheme, scale, data) {
  var path = d3.geoPath().projection(projection);

  svg.selectAll('path') // Create map of NYC SDs
    .data(geoData.features)
    .enter()
    .append('path')
        .attr('id', 'currentPath')
        .attr('d', path)
        .attr('stroke', mapStrokeColor)
        .attr('stroke-width', mapStrokeWidth)
        .attr('fill', function(d) {
          var sd = d.properties.SchoolDist
          var value = data.get(sd);
          return scheme(scale(value));
        })
        .attr('class', function(d) {
          return 'District'
        })
        .attr('id', function(d) {
          return 'sd' + d.properties.SchoolDist;
        })
        .style('opacity', mapOpacity)
        .on('mouseover', overviewMouseOver)
        .on('mouseleave', overviewMouseLeave)
        .on('click', overviewMouseClick);
}

/* Plots points on an SVG map.
svg: SVG to plot points on
projection: see createProjection()
data: array of objects, required fields: Latitude, Longitude
name: 'class' name String to be assigned to each point */
let plotPoints = function(svg, projection, data, name, radius, fill, 
  stroke, strokeWidth, opacity) {
    svg.selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
      .attr('cx', function(d) {
        return projection([d.Longitude, d.Latitude])[0];
      })
      .attr('cy', function(d) {
        return projection([d.Longitude, d.Latitude])[1];
      })
      .attr('r', radius)
      .attr('class', function(d) {
        return name
      })
      .attr('pointer-events', 'none')
      .style('fill', fill)
      .style('stroke', stroke)
      .style('stroke-width', strokeWidth)
      .style('opacity', opacity);
  }

// IMPORTED DATA STORAGE ///////////////////////////////////////////////////////
var scores = [] // Array of school objects with columns from scores csv
var districtGeos = new Map(); // Map of SD# to GeoOBJECT
var avgScores = [] // Array of SD objects with score avgs columns
var nycLoc = [40.7128, 73.9660]; // [lat, lon]
var centers = []; // Array of SD objects with columns {id, lat, lon, zoom}

// OVERVIEW MAP VARIABLES //////////////////////////////////////////////////////
var mapWidth = 600;
var mapHeight = 600;
var mapScale = 75000;  // map zoom
var mapBorderW = 2;
var mapBorderColor = 'black';
var mapStrokeColor = 'black';
var mapStrokeWidth = 0.5;
var mapFillColor = 'steelblue';
var mapOpacity = 0.8;

var pointRadius = 2.5;
var pointColor = '#ff6600';
var pointStrokeColor = 'black'
var pointStrokeWidth = 0.7;
var pointOpacity = 1;

// ZOOMED MAP VARIABLES ////////////////////////////////////////////////////////
var mapScaleFactor = 1.0; // Scale zoomed map to desired dimensions
var mapZWidth = 350 * mapScaleFactor; // DO NOT CHANGE
var mapZHeight = 350 * mapScaleFactor; // DO NOT CHANGE
var mapZStrokeWidth = 2;
var mapZFillColor = mapFillColor;
var zPointRadius = 6;
var zPointColor = '#ff6600';
var zPointStrokeColor = 'black'
var zPointStrokeWidth = 1;
var zPointOpacity = 1;
var mapZStartSD = null; // Load SD on zoomed map at start; null to deactivate

// MOUSE EVENT VARIABLES ///////////////////////////////////////////////////////
var selected = null; // Selected SD
var mapHoverColor = '#2b506e';
var selectedStrokeWidth = 1.6;
var selectedFillColor = '#2b506e';
var mouseTransDuration = 100; // warning: can be glitchy w/ quick mouseovers

var zSelected = null; // Selected school
var zHoverColor = '#b04600';
var zHoverRadius = 8;
var zSelectedStrokeWidth = 2;
var zSelectedPointRadius = 8;
var zSelectedFillColor = '#b04600';

// SLIDER VARIABLES ////////////////////////////////////////////////////////////
var rangeMath = [200, 800];
var rangeReading = [200, 800];
var rangeWriting = [200, 800];
var sliderWidth = 500;
var sliderHeight = 75;

// START FUNCTIONS /////////////////////////////////////////////////////////////
// Remap SD geo data to correct keys
for (var idx in geoData.features) {
  var sd = geoData.features[idx].properties.SchoolDist;
  if (sd === 10 && districtGeos.has(10)) { // Deal with 2x SD10 geoJSON entries
    districtGeos.set(sd + 'b', geoData.features[idx]);
  } else {
    districtGeos.set(sd, geoData.features[idx]);
  }
}
// Load in average scores for each SD
d3.csv(sdScoreAvgsCsv).then(function(d) {
    avgScores = d;
});

// MAP MOUSE EVENTS ////////////////////////////////////////////////////////////
let overviewMouseOver = function(d) { // Highlight SD on mouseover
  d3.select(this) // Highlight overview target SD
      .transition()
      .duration(mouseTransDuration)
      .attr('stroke-width', selectedStrokeWidth * 0.75)
};

let overviewMouseLeave = function(d) { // Unhighlight SD on mouse leave
  if (selected != this) { // Do not de-highlight selected SD
    d3.select(this) // De-highlight overview target SD
        .transition()
        .duration(mouseTransDuration)
        .attr('stroke-width', mapStrokeWidth)
  }
};

let overviewMouseClick = function(d) { //De/select SD on mouse click
  var unselect = this === selected;
  if (selected) { // Unselect selected SD if one exists
    statBox.selectAll('text').remove();
    d3.select(selected)
        .transition()
        .attr('stroke-width', mapStrokeWidth)
        .duration(mouseTransDuration);
    mapZ.selectAll('path').remove();
    mapZ.selectAll('circle').remove();
    statBox.selectAll('text').remove();
    selected = null;
  }
  var districtName;
  if (d && selected !== this && !unselect) { // Select target SD
    statBox.selectAll('text').remove();
    zSelected = null;
    d3.select(this)
        .transition()
        .style('opacity', 1)
        .attr('stroke-width', selectedStrokeWidth)
        .duration(mouseTransDuration);
    selected = this;
    updateZMap(+this.id.substring(2), currentData, currentScheme, currentScale); // Update zoomed map
    updateDistrictStats(+this.id.substring(2)); // Update text box
  }

  districtName = this.id.substring(2);

  // BOX PLOT //////////////////////////////////////////////////////////////////
  var sat_all = [];
  d3.csv(scoresCsv).then(function(data){
    data.forEach(function(d){
      if (d.District === districtName)
      {        
          sat_all.push(parseFloat(d["Average Score (SAT Math)"]) + parseFloat(d["Average Score (SAT Reading)"]) + parseFloat(d["Average Score (SAT Writing)"]));
      }
      //console.log(d3.geoContains(cool, [parseFloat(d.Longitude), parseFloat(d.Latitude)]));
    });

    if (sat_all.length === 0) // This is for if the empty area is selected.
      sat_all.push(0);

    sat_all.sort(function(a, b){return a-b});
    console.log(sat_all); ////
    // Find q1, median and q3
    var q1_all = d3.quantile(sat_all, .25);
    var median_all = d3.quantile(sat_all, .5);
    var q3_all = d3.quantile(sat_all, .75);
    var interQuantileRange_all = q3_all - q1_all;
    var min_all = q1_all - 1.5 * interQuantileRange_all;
    var max_all = q1_all + 1.5 * interQuantileRange_all;

    // Updated plots
    //svg.selectAll("toto").remove(); // can comment this line without any effect.
    //svg.selectAll("rect").remove();
    //svg.select("rect").remove();
    //svg.selectAll("line").remove();

    // Add the y axis
    //svg.call(d3.axisTop(x));
    var center = 40;
    var height = 40;
    var offset = 40;
    // Add the main line
    svg
    .select("#h")
      .transition()
      .attr("y1", center)
      .attr("y2", center)
      .attr("x1", x(min_all) + offset)
      .attr("x2", x(max_all) + offset)
      .attr("stroke", "black")
    // Show the box
    svg
    .select("#changed")
      .transition()
      .attr("y", center - height/2)
      .attr("x", x(q1_all) + offset)
      .attr("height", height)
      .attr("width", (x(q3_all)-x(q1_all)) )
      .attr("stroke", "black")
      .style("fill", "#69b3a2")
    // show median, min and max horizontal lines
    // svg
    // .selectAll("toto")
    // .data([min_all, median_all, max_all])
    // .enter()
    // .append("line")
    //   .attr("y1", center-height/2)
    //   .attr("y2", center+height/2)
    //   .attr("x1", function(d){ return(x(d) + offset)} )
    //   .attr("x2", function(d){ return(x(d) + offset)} )
    //   .attr("stroke", "black");
    svg
    .select("#i")
      .transition()
      .attr("y1", center-height/2)
      .attr("y2", center+height/2)
      .attr("x1", x(min_all) + offset)
      .attr("x2", x(min_all) + offset)
      .attr("stroke", "black")
    svg
    .select("#j")
      .transition()
      .attr("y1", center-height/2)
      .attr("y2", center+height/2)
      .attr("x1", x(median_all) + offset)
      .attr("x2", x(median_all) + offset)
      .attr("stroke", "black")
    svg
    .select("#k")
      .transition()
      .attr("y1", center-height/2)
      .attr("y2", center+height/2)
      .attr("x1", x(max_all) + offset)
      .attr("x2", x(max_all) + offset)
      .attr("stroke", "black")

  });
  // svg.select("#changed").remove();
  // svg.select("#h").remove();
  // svg.select("#i").remove();
  // svg.select("#j").remove();
  // svg.select("#k").remove();
}

// SECTION FOR BOX PLOT ////////////////////////////////////////////////////////
var mapZWidthOriginal = 350 * 1.2;

var svg = d3.select("#chart1")
    .append("svg")
      .attr("width", mapZWidthOriginal + 75)
      .attr("height", 130)
      .attr('x', 0)
      .attr('y', 0)
      .attr("transform",
            "translate(" + 2 + "," + 2 + ")");

svg.append('rect')
  .attr('x', 0)
  .attr('y', 0)
  .attr('height', 130)
  .attr('width', mapZWidthOriginal + 75) // 420
  .style('stroke', mapBorderColor)
  .style('fill', 'none')
  .style('stroke-width', mapBorderW);

// axis for box plot
var x = d3.scaleLinear()
  .domain([600,2000])
  .range([0, 420]);
  //.attr("transform", "translate(0, 250)");

svg.append("g")
     .attr("transform", "translate(40, 100)")
     .call(d3.axisTop(x));

svg
.append("line")
  .attr("id", "h")
 
svg
.append("rect")
  .attr("id", "changed")
 
svg
.append("line")
  .attr("id", "i")

svg
.append("line")
  .attr("id", "j")

svg
.append("line")
  .attr("id", "k")

// ZOOMED MAP MOUSE EVENTS /////////////////////////////////////////////////////
let zMouseOver = function(d) { // Highlight school on mouseover
  if (!zSelected) {
    updateStats(d);
  }
  d3.select(this) // Highlight target school
      .transition()
      .duration(mouseTransDuration)
      .attr('r', zHoverRadius)
      .style('fill', zHoverColor);
}

let zMouseLeave = function(d) { // Unhighlight school on mouse leave
  if (!zSelected) {
    statBox.selectAll('text').remove();
  }
  if (zSelected != this) { // Do not de-highlight selected school
    d3.select(this) // De-highlight target school
        .transition()
        .duration(mouseTransDuration)
        .attr('r', zPointRadius)
        .style('fill', zPointColor)
  }
}

let zMouseClick = function(d) { // De/select school on mouse click
  var unselect = this === zSelected;
  if (zSelected) { // Unselect selected school if one exists
    statBox.selectAll('text').remove();
    d3.select(zSelected)
        .transition()
        .duration(mouseTransDuration)
        .attr('r', zPointRadius)
        .style('fill', zPointColor)
        .style('stroke-width', zPointStrokeWidth);
    zSelected = null;
  }
  if (d && d.type != 'Feature' && zSelected !== this && !unselect) {
    d3.select(this) // Select target school not already selected
        .transition()
        .duration(mouseTransDuration)
        .style('fill', zSelectedFillColor)
        .style('stroke-width', zSelectedStrokeWidth)
        .attr('r', zSelectedPointRadius);
    zSelected = this;
    updateStats(d);
  }
}

// OVERVIEW MAP ////////////////////////////////////////////////////////////////
/* Map creation method:
svg: SVG to create map on
projection: see createProjection()
heat: true for heat map, false for points
hsl: array of format [hue, saturation, min_lightness, max_lightness]
domain: [minValue, maxValue] for data
data: if a heat map, map {sd#: aggregation_value}
sd_events: mouse event on each school district */
let createMap = function(svg, projection, heat, hsl, domain, data,
  sd_mouseOver, sd_mouseLeave, sd_mouseClick) {

  var path = d3.geoPath().projection(projection)

  var minValue = Infinity
  var maxValue = -Infinity
  var lightnessScale = null
  if (heat) { // Heat map: get min/max agg values, create HSL scale
    // for (var sd = 1; sd <= 32; sd++) {
    //   var value = data.get(sd)
    //   minValue = value < minValue ? value : minValue;
    //   maxValue = value > maxValue ? value : maxValue;
    // }
    lightnessScale = d3.scaleLinear()
        .domain([domain[0], domain[1]])
        .range([hsl[2], hsl[3]]);
  }

  svg.selectAll('path') // Create map of NYC SDs
    .data(geoData.features)
    .enter()
    .append('path')
        .attr('d', path)
        .attr('stroke', mapStrokeColor)
        .attr('stroke-width', mapStrokeWidth)
        .attr('fill', function(d) {
          if (heat) {
            return d3.hcl(hsl[0], hsl[1], 
              lightnessScale(data.get(d.properties.SchoolDist)))
          } else {
            return mapFillColor;
          }
        })
        .attr('class', function(d) {
          return 'District'
        })
        .attr('id', function(d) {
          return 'sd' + d.properties.SchoolDist;
        })
        .style('opacity', mapOpacity)
        .on('mouseover', sd_mouseOver)
        .on('mouseleave', sd_mouseLeave)
        .on('click', sd_mouseClick);
}

// Draw overview map OR HEAT MAP EXAMPLE
d3.csv(scoresCsv).then(function(d) {  // Parse scores and create map
  // DEMONSTRATION FLAGS ///////////////////////////////////////////////////////
  const HEAT_EXAMPLE = 1
  const BOTH_HEAT_AND_POINTS = 0 // HEAT_EXAMPLE must be enabled for this
  const SMALLER_MAP = 0
  // DEMONSTRATION FLAGS ///////////////////////////////////////////////////////

  var TEST_WIDTH = mapWidth  // Default values
  var TEST_HEIGHT = mapHeight
  var TEST_SCALE = mapScale
  if (SMALLER_MAP) {
    TEST_WIDTH = mapWidth * 0.5
    TEST_HEIGHT = mapHeight * 0.5
    TEST_SCALE = mapScale * 0.5
  }


  scores = d; // Save scores to global variable

/////////////////////////////////////

//   if (HEAT_EXAMPLE) { // HEAT MAP EXAMPLE
//     var heatExampleData =new Map() // map {sd#: sd# * 10}
//     for (var i = 1; i <= 32; i++) {
//     }
//     // Heat map example: array of {sd: sd_id, value: sd_id * 10} passed in
//     createMap(map, projection, 1, [124,100,75,0], [0, 320], heatExampleData,
//       null, null, null);
//     // Can also plot points on the heat map if desired
//     if (BOTH_HEAT_AND_POINTS) {
//       plotPoints(map, projection, scores, 'school', pointRadius, pointColor, 
//         pointStrokeColor, pointStrokeWidth, pointOpacity);
//     }
//   } else { // ORIGINAL MAP PLOTTING SCHOOL POINTS
//     createMap(map, projection, 0, null, null, scores,
//       overviewMouseOver, overviewMouseLeave, overviewMouseClick);
//     plotPoints(map, projection, scores, 'school', pointRadius, pointColor, 
//       pointStrokeColor, pointStrokeWidth, pointOpacity);
//   }
});

// ZOOMED MAP //////////////////////////////////////////////////////////////////
var zProjection = d3.geoAlbers()
    .translate([mapZWidth/2, mapZHeight/2])
var zPath = d3.geoPath().projection(zProjection);

var mapZ = d3.select('#map-zoomed') // Create zoomed map
  .append('svg')
    .attr('width', mapZWidth)
    .attr('height', mapZHeight);
mapZ.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('height', mapZWidth)
    .attr('width', mapZHeight)
    .attr('pointer-events', 'all')
    .style('stroke', mapBorderColor)
    .style('fill', 'none')
    .style('stroke-width', 0)
    .on('click', zMouseClick);

// Load in csv of SD center lat/long coords, set zoomed map to mapZStartSD
d3.csv(sdCentersCsv).then(function(d) {
  centers = d; // Save center coords to global variable
  if (mapZStartSD) {
    updateZMap(mapZStartSD, data, scheme, scale); // Update zoomed map to start SD
  }
});

// Updates zoomed map to target SD
let updateZMap = function(sd, data, scheme, scale) {
  // console.log('DISTRICT ' + sd + ' SELECTED');
  mapZ.selectAll('path').remove(); // Remove previous SD
  mapZ.selectAll('circle').remove();
  var center = [+centers[sd - 1].lat, +centers[sd - 1].lon]; // target SD coords

  zProjection.center([0, center[0]]) // Update path generator to target SD
      .rotate([center[1], 0])
      .scale(+centers[sd - 1].zoom * mapScaleFactor);
  zPath = d3.geoPath().projection(zProjection);

  mapZ.append('path') // Draw target SD on zoomed map
      .datum(districtGeos.get(sd))
      .attr('d', zPath)
      .attr('stroke', mapStrokeColor)
      .attr('stroke-width', mapZStrokeWidth)
      .attr('fill', function(d) {
        var sd = d.properties.SchoolDist
        var value = data.get(sd);
        return scheme(scale(value));
        // return schemeSat(scaleSat(+avgScores[d.properties.SchoolDist - 1]['total_avg']))
      })
      .attr('class', function(d) {
        return 'District'
      })
      .style('opacity', mapOpacity)
      .on('click', zMouseClick);
  if (sd === 10) { // Deal with double SD10 geoJSON entries
    mapZ.append('path')
    .datum(districtGeos.get('10b'))
    .attr('d', zPath)
    .attr('stroke', mapStrokeColor)
    .attr('stroke-width', mapZStrokeWidth)
    .attr('fill', mapZFillColor)
    .attr('class', function(d) {
      return 'District'
    })
    .style('opacity', mapOpacity);
  }

  mapZ.selectAll('circle') // Add point to zMap for each school in target SD
  .data(scores)
  .enter()
  .append('circle')
    .filter(function(d) { // Filter schools only in target SD and slider ranges
      var inSd = +d.District === sd;
      if (sd === 10) {  // deal with double SD10 geoJSON entries
        inSd = inSd || d.District === '10b'; 
      }
      return inSd;
    })
    .attr('cx', function(d) {
      return zProjection([d.Longitude, d.Latitude])[0];
    })
    .attr('cy', function(d) {
      return zProjection([d.Longitude, d.Latitude])[1];
    })
    .attr('r', zPointRadius)
    .attr('class', function(d) {
      return 'School'
    })
    .style('fill', zPointColor)
    .style('stroke', zPointStrokeColor)
    .style('stroke-width', zPointStrokeWidth)
    .style('opacity', zPointOpacity)
    .on('mouseover', zMouseOver)
    .on('mouseleave', zMouseLeave)
    .on('click', zMouseClick)
  .append('title') // Tooltip: {SchoolName: avgMath/avgReading/avgWriting}
    .text(function(d) {
      return d[schoolName] + ' Averages: ' + d[math] + ' Math/' + 
              d[reading] + ' Reading/' + d[writing] +' Writing';
    });
  filterMapPoints(mapZ, rangeMath, rangeReading, rangeWriting);
}

// Filter zoomed map points according to slider filters
let filterMapPoints = function(targetMap, rangeMath, rangeReading, rangeWriting) {
  targetMap.selectAll('circle') // Hide all points out of range
      .filter(function(d) {
        return !(inRange(d[math], rangeMath) && inRange(d[reading], rangeReading) 
                && inRange(d[writing], rangeWriting));
      })
      .style('opacity', 0);
  targetMap.selectAll('circle') // Show all points in range
      .filter(function(d) {
        return inRange(d[math], rangeMath) && inRange(d[reading], rangeReading) 
                && inRange(d[writing], rangeWriting);
      })
      .style('opacity', 1);
}

let inRange = function(value, range) { // True if range[0] <= value <= range[1]
  return value >= range[0] && value <= range[1]; 
}

// STAT BOX//// ////////////////////////////////////////////////////////////////
var statBox = d3.select('#stats') // Create stat box
  .append('svg')
  .attr('width', mapZWidthOriginal + 73)
  .attr('height', 110);
statBox.append('rect')
  .attr('x', 0)
  .attr('y', 0)
  .attr('height', 110)
  .attr('width', mapZWidthOriginal + 73)
  .style('stroke', mapBorderColor)
  .style('fill', 'none')
  .style('stroke-width', mapBorderW);

let updateDistrictStats = function(district) {
  statBox.selectAll('text').remove();
  var sd = avgScores[district - 1];

  statBox.append('text')
  .attr('x', '1em')
  .attr('y', '1em')
  .attr('dy', "0.4em")
  .attr('text-decoration', 'underline')
  .attr('font-size', '18px')
  .style('fill', mapFillColor)
  .text("District #" + district + " (" + sd.borough + ")");

  statBox.append('text')
    .attr('x', '2em')
    .attr('y', '4.5em')
    .attr('d', '0.5em')
    .text('Average Total Score: ' + (+sd.math_avg + +sd.read_avg + +sd.write_avg))
    .style('fill', 'red');

  statBox.append('text')
  .attr('x', '16em')
  .attr('y', '3em')
  .attr('d', '0.5em')
  .text("Average Math Score: " + sd.math_avg);

  statBox.append('text')
  .attr('x', '16em')
  .attr('y', '4.5em')
  .attr('d', '0.5em')
  .text("Average Reading Score: " + sd.read_avg);

  statBox.append('text')
  .attr('x', '16em')
  .attr('y', '6em')
  .attr('d', '0.5em')
  .text("Average Writing Score: " + sd.write_avg);
}

let updateStats = function(d) {
  // remove school information
  statBox.selectAll('text').remove();

  statBox.append('text')
  .attr('x', '1em')
  .attr('y', '1em')
  .attr('dy', "0.4em")
  .attr('text-decoration', 'underline')
  .attr('font-size', '15px')
  .style('fill', '#b04600')
  .text(d[schoolName]);

  statBox.append('text')
    .attr('x', '2em')
    .attr('y', '3em')
    .attr('d', '0.5em')
    .text('Average total score: ' + (+d[math] + +d[reading] + +d[writing]));
  statBox.append('text')
    .attr('x', '2em')
    .attr('y', '4.5em')
    .attr('d', '0.5em')
    .text('Number of students: ' + d['Student Enrollment']);
  statBox.append('text')
    .attr('x', '2em')
    .attr('y', '6em')
    .attr('d', '0.5em')
    .text('Students tested: ' + d['Percent Tested']);

  statBox.append('text')
    .attr('x', '16em')
    .attr('y', '3em')
    .attr('d', '0.5em')
    .text("Average Math Score: " + d[math]);

  statBox.append('text')
    .attr('x', '16em')
    .attr('y', '4.5em')
    .attr('d', '0.5em')
    .text("Average Reading Score: " + d[reading]);

  statBox.append('text')
    .attr('x', '16em')
    .attr('y', '6em')
    .attr('d', '0.5em')
    .text("Average Writing Score: " + d[writing]);
}

// SMALL MAPS /////////////////////////////////////////////////////////////////
/*
id: div id
heat_data: heat data if heat map
heat: 1 if heat map
hsl: color scheme if heat map
domain: [minValue, maxValue] for data
point_data: point data if points
points: 1 if points
name: name to give to points
*/
let createSection = function(id, heat_data, heat, hsl, domain, point_data, points, name) {
  var map = d3.select(id)
  .append('svg')
    .attr('width', SMALL_MAP_WIDTH)
    .attr('height', SMALL_MAP_HEIGHT)
  var projection = createProjection(SMALL_MAP_WIDTH, SMALL_MAP_HEIGHT, SMALL_MAP_SCALE)
  createMap(map, projection, heat, hsl, domain, heat_data, null, null, null);
  if (points) {
    plotPoints(map, projection, point_data, name, pointRadius, pointColor,
      pointStrokeColor, pointStrokeWidth, pointOpacity);
  }
}

var SMALL_MAP_SCALE_FACTOR = .5
var SMALL_MAP_WIDTH = mapWidth * SMALL_MAP_SCALE_FACTOR
var SMALL_MAP_HEIGHT = mapHeight * SMALL_MAP_SCALE_FACTOR
var SMALL_MAP_SCALE = mapScale * SMALL_MAP_SCALE_FACTOR
var HSL = [197,100,100,0]

d3.csv(sdDataCsv).then(function(data) {
  // BUILDING DEFAULT MAPS ////////////////////////////////////////////////////////////////////////
  var largeMapPro = createProjection(mapWidth, mapHeight, mapScale);

  var map = d3.select('#map') // Create Map SVG element
    .append('svg')
    .attr('width', mapWidth)
    .attr('height', mapHeight);
  map.append('rect') // Create border on Map
    .attr('x', 0)
    .attr('y', 0)
    .attr('height', mapHeight)
    .attr('width', mapWidth)
    .attr('pointer-events', 'all')
    .style('stroke', mapBorderColor)
    .style('fill', 'none')
    .style('stroke-width', mapBorderW)
    .on('click', overviewMouseClick); // Allow background click to deselect

  var legend = d3.select('#legend') // Create Map SVG element
  .append('svg')
  .attr("width", scaleW)
  .attr("height", scaleH);

  generateLargeMap(map, largeMapPro, schemeIncome, scaleIncome, maps.get(alias.get('income')));
  generateLegend(legend, 'gradient-income', scaleW, scaleH, schemeIncome, domainIncome, defaultTicks);
  currentData = maps.get(alias.get('income'));

  plotPoints(map, largeMapPro, scores, 'school', pointRadius, pointColor,
            pointStrokeColor, pointStrokeWidth, pointOpacity);

  // RADIO BUTTON FUNCTIONALITY /////////////////////////////////////////////////////////////////
  $('#incomeButton').on('click', function(event) {
    d3.select('#map').selectAll('path').remove();
    d3.select('#map').selectAll('circle').remove();
    d3.select('#legend').selectAll('defs').remove();
    d3.select('#legend').selectAll('g').remove();
    generateLargeMap(map, largeMapPro, schemeIncome, scaleIncome, maps.get(alias.get('income')));
    generateLegend(legend, 'gradient-income', scaleW, scaleH, schemeIncome, domainIncome, defaultTicks);
    plotPoints(map, largeMapPro, scores, 'school', pointRadius, pointColor,
    pointStrokeColor, pointStrokeWidth, pointOpacity);
    currentData = maps.get(alias.get('income'));
    currentScheme = schemeIncome;
    currentScale = scaleIncome;
  });

  $('#arrestsButton').on('click', function(event) {
    d3.select('#map').selectAll('path').remove();
    d3.select('#map').selectAll('circle').remove();
    d3.select('#legend').selectAll('defs').remove();
    d3.select('#legend').selectAll('g').remove();
    generateLargeMap(map, largeMapPro, schemeCrime, scaleCrime, maps.get(alias.get('crimes')));
    generateLegend(legend, 'gradient-crime', scaleW, scaleH, schemeCrime, domainCrime, defaultTicks);
    plotPoints(map, largeMapPro, scores, 'school', pointRadius, pointColor,
            pointStrokeColor, pointStrokeWidth, pointOpacity);
    currentData = maps.get(alias.get('crimes'));
    currentScheme = schemeCrime;
    currentScale = scaleCrime;
  });

  $('#asianButton').on('click', function(event) {
    d3.select('#map').selectAll('path').remove();
    d3.select('#map').selectAll('circle').remove();
    d3.select('#legend').selectAll('defs').remove();
    d3.select('#legend').selectAll('g').remove();
    generateLargeMap(map, largeMapPro, schemeAsian, scaleAsian, maps.get(alias.get('asian')));
    generateLegend(legend, 'gradient-ethAsian', scaleW, scaleH, schemeAsian, domainAsian, defaultTicks);
    plotPoints(map, largeMapPro, scores, 'school', pointRadius, pointColor,
    pointStrokeColor, pointStrokeWidth, pointOpacity);
    currentData = maps.get(alias.get('asian'));
    currentScheme = schemeAsian;
    currentScale = scaleAsian;
  });

  $('#blackButton').on('click', function(event) {
    d3.select('#map').selectAll('path').remove();
    d3.select('#map').selectAll('circle').remove();
    d3.select('#legend').selectAll('defs').remove();
    d3.select('#legend').selectAll('g').remove();
    generateLargeMap(map, largeMapPro, schemeBlack, scaleBlack, maps.get(alias.get('black')));
    generateLegend(legend, 'gradient-ethBlack', scaleW, scaleH, schemeBlack, domainBlack, defaultTicks);
    plotPoints(map, largeMapPro, scores, 'school', pointRadius, pointColor,
    pointStrokeColor, pointStrokeWidth, pointOpacity);
    currentData = maps.get(alias.get('black'));
    currentScheme = schemeBlack;
    currentScale = scaleBlack;
  });

  $('#hispanicButton').on('click', function(event) {
    d3.select('#map').selectAll('path').remove();
    d3.select('#map').selectAll('circle').remove();
    d3.select('#legend').selectAll('defs').remove();
    d3.select('#legend').selectAll('g').remove();
    generateLargeMap(map, largeMapPro, schemeHispanic, scaleHispanic, maps.get(alias.get('hispanic')));
    generateLegend(legend, 'gradient-ethHispanic', scaleW, scaleH, schemeHispanic, domainHispanic, defaultTicks);
    plotPoints(map, largeMapPro, scores, 'school', pointRadius, pointColor,
    pointStrokeColor, pointStrokeWidth, pointOpacity);
    currentData = maps.get(alias.get('hispanic'));
    currentScheme = schemeHispanic;
    currentScale = scaleHispanic;
  });

  $('#whiteButton').on('click', function(event) {
    d3.select('#map').selectAll('path').remove();
    d3.select('#map').selectAll('circle').remove();
    d3.select('#legend').selectAll('defs').remove();
    d3.select('#legend').selectAll('g').remove();
    generateLargeMap(map, largeMapPro, schemeWhite, scaleWhite, maps.get(alias.get('white')));
    generateLegend(legend, 'gradient-ethWhite', scaleW, scaleH, schemeWhite, domainWhite, defaultTicks);
    plotPoints(map, largeMapPro, scores, 'school', pointRadius, pointColor,
    pointStrokeColor, pointStrokeWidth, pointOpacity);
    currentData = maps.get(alias.get('white'));
    currentScheme = schemeWhite;
    currentScale = scaleWhite;
  });

  $('#wifiButton').on('click', function(event) {
    d3.select('#map').selectAll('path').remove();
    d3.select('#map').selectAll('circle').remove();
    d3.select('#legend').selectAll('defs').remove();
    d3.select('#legend').selectAll('g').remove();
    generateLargeMap(map, largeMapPro, schemeWifi, scaleWifi, maps.get(alias.get('wifi')));
    generateLegend(legend, 'gradient-wifi', scaleW, scaleH, schemeWifi, domainWifi, defaultTicks);
    plotPoints(map, largeMapPro, scores, 'school', pointRadius, pointColor,
    pointStrokeColor, pointStrokeWidth, pointOpacity);
    currentData = maps.get(alias.get('wifi'));
    currentScheme = schemeWifi;
    currentScale = scaleWifi;
  });

  $('#noiseButton').on('click', function(event) {
    d3.select('#map').selectAll('path').remove();
    d3.select('#map').selectAll('circle').remove();
    d3.select('#legend').selectAll('defs').remove();
    d3.select('#legend').selectAll('g').remove();
    generateLargeMap(map, largeMapPro, schemeNoise, scaleNoise, maps.get(alias.get('noise')));
    generateLegend(legend, 'gradient-noise', scaleW, scaleH, schemeNoise, domainNoise, defaultTicks);
    plotPoints(map, largeMapPro, scores, 'school', pointRadius, pointColor,
    pointStrokeColor, pointStrokeWidth, pointOpacity);
    currentData = maps.get(alias.get('noise'));
    currentScheme = schemeNoise;
    currentScale = scaleNoise;
  });

  // SLIDER ELEMENTS //////////////////////////////////////////////////////////////
  let createSlider = function() { // Create slider helper
    return d3ss.sliderBottom()
        .width(300)
        .ticks(8)
        .min(0)
        .max(800)
        .default([200, 800])
        .fill('#2196f3');
  }

  let createSliderSvg = function(id) { // Create slider svg helper
    return d3.select(id)
        .append('svg')
        .attr('width', sliderWidth)
        .attr('height', sliderHeight)
        .append('g')
        .attr('transform', 'translate(30,30)');
  }

  var sliderRangeMath = createSlider(); // Create math slider
  sliderRangeMath.on('onchange', val => {
    rangeMath = val;
    filterMapPoints(map, rangeMath, rangeReading, rangeWriting);
    filterMapPoints(mapZ, rangeMath, rangeReading, rangeWriting);
  });
  var gRangeMath = createSliderSvg('#math');
  gRangeMath.call(sliderRangeMath);

  var sliderRangeReading = createSlider(); // Create reading slider
  sliderRangeReading.on('onchange', val => {
    rangeReading = val;
    filterMapPoints(map, rangeMath, rangeReading, rangeWriting);
    filterMapPoints(mapZ, rangeMath, rangeReading, rangeWriting);
  });
  var gRangeReading = createSliderSvg('#reading');
  gRangeReading.call(sliderRangeReading);

  var sliderRangeWriting = createSlider(); // Create writing slider
  sliderRangeWriting.on('onchange', val => {
    rangeWriting = val;
    console.log(rangeWriting);
    filterMapPoints(map, rangeMath, rangeReading, rangeWriting);
    filterMapPoints(mapZ, rangeMath, rangeReading, rangeWriting);
  });
  var gRangeWriting = createSliderSvg('#writing');
  gRangeWriting.call(sliderRangeWriting);
  

  // CREATING SMALL MAPS
  createSection('#map-eth-white', maps.get(alias.get('white')), 1, HSL,
    [0, 100], null, 0, null);
  createSection('#map-eth-black', maps.get(alias.get('black')), 1, HSL,
    [0, 100], null, 0, null);
  createSection('#map-eth-hispanic', maps.get(alias.get('hispanic')), 1, HSL,
    [0, 100], null, 0, null);
  createSection('#map-eth-asian', maps.get(alias.get('asian')), 1, HSL,
    [0, 100], null, 0, null);

  createSection('#map-wifi', maps.get(alias.get('wifi')), 1, HSL,
    [0, 100], null, 0, null);
   createSection('#map-noise', maps.get(alias.get('noise')), 1, HSL,
    [0, 5000], null, 0, null);
  createSection('#map-crime', maps.get(alias.get('crimes')), 1, HSL,
    [0, 3000], null, 0, null);
  createSection('#map-income', maps.get(alias.get('income')), 1, HSL,
    [0, 150000], null, 0, null);


  // party map
  d3.csv(districtpartycsv).then(function (data) {
      var partyMap = new Map();
      data.forEach(function(d) {
          partyMap.set(parseInt(d.District), parseInt(d.Noise));
      })
  
      createSection("#party-map", partyMap, 1, HSL, [0, 4200], null, 0, null)
  })

  $("#party-map").hide();

  $(".reveal-btn").click(function() {
    $("#party-map").slideToggle(700);

    var img = $("#boroughMapImg")[0];

    if (img.style["visibility"] === "visible") {
      $("#boroughMapImg").css({opacity: 1.0}).animate({opacity: 0}, 700);
      img.style["visibility"] = "hidden";
    } else if (img.style["visibility"] === "hidden") {
      console.log("changing to visible");
      img.style["visibility"] = "visible";
      $("#boroughMapImg").css({opacity: 0}).animate({opacity: 1.0}, 700);
    }

  });

  // wifi map
  d3.csv(districtweefeecsv).then(function (data) {
    var partyMap = new Map();
    data.forEach(function(d) {
        partyMap.set(parseInt(d.District), parseInt(d.Wifi));
    })

    createSection("#weefee-map", partyMap, 1, HSL, [0, 120], null, 0, null)
  })

  $("#weefee-map").hide();

  $(".reveal-btn2").click(function() {
    $("#weefee-map").slideToggle(700);

    var img = $("#boroughMapImg2")[0];

    if (img.style["visibility"] === "visible") {
      $("#boroughMapImg2").css({opacity: 1.0}).animate({opacity: 0}, 700);
      img.style["visibility"] = "hidden";
    } else if (img.style["visibility"] === "hidden") {
      console.log("changing to visible");
      img.style["visibility"] = "visible";
      $("#boroughMapImg2").css({opacity: 0}).animate({opacity: 1.0}, 700);
    }

  });
});