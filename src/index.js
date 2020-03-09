import * as d3 from 'd3';
import * as d3ss from 'd3-simple-slider';
import $ from "jquery";
import geoData from './school_districts.json';
import scoresCsv from './scores.csv';
import sdCentersCsv from './school_district_centers.csv';
import sdScoreAvgsCsv from './district_score_avgs.csv';

const schoolName = 'School Name';
const math = 'Average Score (SAT Math)';
const reading = 'Average Score (SAT Reading)';
const writing = 'Average Score (SAT Writing)';

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
var mapOpacity = 0.9;
var pointRadius = 2.5;
var pointColor = '#ff6600';
var pointStrokeColor = 'black'
var pointStrokeWidth = 0.7;
var pointOpacity = 1;

// ZOOMED MAP VARIABLES ////////////////////////////////////////////////////////
var mapScaleFactor = 1.35; // Scale zoomed map to desired dimensions
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
      .style('fill', mapHoverColor)
      .style('opacity', mapOpacity);
};

let overviewMouseLeave = function(d) { // Unhighlight SD on mouse leave
  if (selected != this) { // Do not de-highlight selected SD
    d3.select(this) // De-highlight overview target SD
        .transition()
        .style('fill', mapFillColor)
        .duration(mouseTransDuration);
  }
};

let overviewMouseClick = function(d) { //De/select SD on mouse click
  var unselect = this === selected;
  if (selected) { // Unselect selected SD if one exists
    statBox.selectAll('text').remove();
    d3.select(selected)
        .transition()
        .style('fill', mapFillColor)
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
        .style('fill', selectedFillColor)
        .attr('stroke-width', selectedStrokeWidth)
        .duration(mouseTransDuration);
    selected = this;
    updateZMap(+this.id.substring(2)); // Update zoomed map
    updateDistrictStats(+this.id.substring(2)); // Update text box
  }

  districtName = this.id.substring(2);
  console.log("This is name");
  console.log(districtName);


  // This is for Box Plot
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


// SECTION FOR BOX PLOT ////////////////////////////

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
data: if a heat map, map {sd#: aggregation_value}
sd_events: mouse event on each school district */
let createMap = function(svg, projection, heat, hsl, data,
  sd_mouseOver, sd_mouseLeave, sd_mouseClick) {

  var path = d3.geoPath().projection(projection)

  var minValue = 0.0
  var maxValue = 0.0
  var lightnessScale = null
  if (heat) { // Heat map: get min/max agg values, create HSL scale
    for (var sd = 1; sd <= 32; sd++) {
      var value = data.get(sd)
      minValue = value < minValue ? value : minValue;
      maxValue = value > maxValue ? value : maxValue;
    }
    lightnessScale = d3.scaleLinear()
        .domain([minValue, maxValue])
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

/* Helper method to plot points on a SVG map.
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

/* Helper method to create projection.
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

  var map = d3.select('#map') // Create Map SVG element
    .append('svg')
      .attr('width', TEST_WIDTH)
      .attr('height', TEST_HEIGHT);
  map.append('rect') // Create border on Map
      .attr('x', 0)
      .attr('y', 0)
      .attr('height', TEST_HEIGHT)
      .attr('width', TEST_WIDTH)
      .attr('pointer-events', 'all')
      .style('stroke', mapBorderColor)
      .style('fill', 'none')
      .style('stroke-width', mapBorderW)
      .on('click', overviewMouseClick); // Allow background click to deselect

  var projection = createProjection(TEST_WIDTH, TEST_HEIGHT, TEST_SCALE)

  if (HEAT_EXAMPLE) { // HEAT MAP EXAMPLE
    var heatExampleData =new Map() // map {sd#: sd# * 10}
    for (var i = 1; i <= 32; i++) {
      heatExampleData.set(i, i*10)
    }
    // Heat map example: array of {sd: sd_id, value: sd_id * 10} passed in
    createMap(map, projection, 1, [124,100,75,0], heatExampleData,
      null, null, null);
    // Can also plot points on the heat map if desired
    if (BOTH_HEAT_AND_POINTS) {
      plotPoints(map, projection, scores, 'school', pointRadius, pointColor, 
        pointStrokeColor, pointStrokeWidth, pointOpacity);
    }
  } else { // ORIGINAL MAP PLOTTING SCHOOL POINTS
    createMap(map, projection, 0, null, scores,
      overviewMouseOver, overviewMouseLeave, overviewMouseClick);
    plotPoints(map, projection, scores, 'school', pointRadius, pointColor, 
      pointStrokeColor, pointStrokeWidth, pointOpacity);
  }
});

// OLD CODE TO CREATE MAP ////////////////////////////////////////////////////////////////
// var projection = d3.geoAlbers() // centered on NYC and scaled
//     .center([0, nycLoc[0]])
//     .rotate([nycLoc[1], 0])
//     .translate([mapWidth/2, mapHeight/2])
//     .scale([mapScale]);
// var path = d3.geoPath().projection(projection);

// var map = d3.select('#map') // Create Map SVG element
//   .append('svg')
//     .attr('width', mapWidth)
//     .attr('height', mapHeight);
// map.append('rect') // Create border on Map
//     .attr('x', 0)
//     .attr('y', 0)
//     .attr('height', mapHeight)
//     .attr('width', mapWidth)
//     .attr('pointer-events', 'all')
//     .style('stroke', mapBorderColor)
//     .style('fill', 'none')
//     .style('stroke-width', mapBorderW)
//     .on('click', overviewMouseClick); // Allow background click to deselect

// map.selectAll('path') // Create map of NYC SDs
//   .data(geoData.features)
//   .enter()
//   .append('path')
//       .attr('d', path)
//       .attr('stroke', mapStrokeColor)
//       .attr('stroke-width', mapStrokeWidth)
//       .attr('fill', mapFillColor)
//       .attr('class', function(d) {
//         return 'District'
//       })
//       .attr('id', function(d) {
//         return 'sd' + d.properties.SchoolDist;
//       })
//       .style('opacity', mapOpacity)
//       .on('mouseover', overviewMouseOver)
//       .on('mouseleave', overviewMouseLeave)
//       .on('click', overviewMouseClick);

// d3.csv(scoresCsv).then(function(d) { // Add point to map for each school
//   console.log(d)
//   scores = d; // Save scores to global variable
//   map.selectAll('circle')
//     .data(d)
//     .enter()
//     .append('circle')
//       .attr('cx', function(d) {
//         return projection([d.Longitude, d.Latitude])[0];
//       })
//       .attr('cy', function(d) {
//         return projection([d.Longitude, d.Latitude])[1];
//       })
//       .attr('r', pointRadius)
//       .attr('class', function(d) {
//         return 'School'
//       })
//       .attr('pointer-events', 'none')
//       .style('fill', pointColor)
//       .style('stroke', pointStrokeColor)
//       .style('stroke-width', pointStrokeWidth)
//       .style('opacity', pointOpacity);
// });
////////////////////////////////////////////////////////////////////////////////

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
    .style('stroke-width', mapBorderW)
    .on('click', zMouseClick);

// Load in csv of SD center lat/long coords, set zoomed map to mapZStartSD
d3.csv(sdCentersCsv).then(function(d) {
  centers = d; // Save center coords to global variable
  if (mapZStartSD) {
    updateZMap(mapZStartSD); // Update zoomed map to start SD
  }
});

// Updates zoomed map to target SD
let updateZMap = function(sd) {
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
      .attr('fill', mapZFillColor)
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

// SLIDER ELEMENT //////////////////////////////////////////////////////////////
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
  filterMapPoints(map, rangeMath, rangeReading, rangeWriting);
  filterMapPoints(mapZ, rangeMath, rangeReading, rangeWriting);
});
var gRangeWriting = createSliderSvg('#writing');
gRangeWriting.call(sliderRangeWriting);

// RADIO BUTTON FUNCTIONALITY

$('#wifiButton').on('click', function(event) {
  console.log("wifi button clicked");
});

$('#noiseButton').on('click', function(event) {
  console.log("noise clicked");
});

$('#incomeButton').on('click', function(event) {
  console.log("income clicked");
});

$('#arrestsButton').on('click', function(event) {
  console.log("arrests clicked");
});