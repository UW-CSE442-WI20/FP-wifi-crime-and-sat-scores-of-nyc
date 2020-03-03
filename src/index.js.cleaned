import * as d3 from 'd3';
import * as d3ss from 'd3-simple-slider';
import $ from "jquery";
import geoData from './school_districts.json';
import scoresCsv from './scores.csv';
import sdCentersCsv from './school_district_centers.csv';

const schoolName = 'School Name';
const math = 'Average Score (SAT Math)';
const reading = 'Average Score (SAT Reading)';
const writing = 'Average Score (SAT Writing)';

// IMPORTED DATA STORAGE ///////////////////////////////////////////////////////
var scores = [] // Array of school objects with columns from scores csv
var districtGeos = new Map(); // Map of SD# to GeoOBJECT
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
var mapScaleFactor = 1.2; // Scale zoomed map to desired dimensions
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

// NARRATIVE VARIABLES /////////////////////////////////////////////////////////
var lowScoreDistricts = ["sd8", "sd12", "sd11", "sd29", "sd24", "sd19", "sd32", 
                  "sd16", "sd23", "sd17", "sd18", "sd21", "sd20", "sd9", "sd7"]
var tutorialActive = true;

////////////////////////////////////////////////////////////////////////////////

// Remap SD geo data to correct keys
for (var idx in geoData.features) {
  var sd = geoData.features[idx].properties.SchoolDist;
  if (sd === 10 && districtGeos.has(10)) { // Deal with 2x SD10 geoJSON entries
    districtGeos.set(sd + 'b', geoData.features[idx]);
  } else {
    districtGeos.set(sd, geoData.features[idx]);
  }
}

// MAP MOUSE EVENTS ////////////////////////////////////////////////////////////
let overviewMouseOver = function(d) { // Highlight SD on mouseover
  if (tutorialActive) { return; }
  d3.select(this) // Highlight overview target SD
      .transition()
      .duration(mouseTransDuration)
      .style('fill', mapHoverColor)
      .style('opacity', mapOpacity);
};

let overviewMouseLeave = function(d) { // Unhighlight SD on mouse leave
  if (tutorialActive) { return; }
  if (selected != this) { // Do not de-highlight selected SD
    d3.select(this) // De-highlight overview target SD
        .transition()
        .style('fill', mapFillColor)
        .duration(mouseTransDuration);
  }
};

let overviewMouseClick = function(d) { // De/select SD on mouse click
  if (tutorialActive) { return; }
  var unselect = this === selected;
  if (selected) { // Unselect selected SD if one exists
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
  }
}

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
var projection = d3.geoAlbers() // centered on NYC and scaled
    .center([0, nycLoc[0]])
    .rotate([nycLoc[1], 0])
    .translate([mapWidth/2, mapHeight/2])
    .scale([mapScale]);
var path = d3.geoPath().projection(projection);

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

map.selectAll('path') // Create map of NYC SDs
  .data(geoData.features)
  .enter()
  .append('path')
      .attr('d', path)
      .attr('stroke', mapStrokeColor)
      .attr('stroke-width', mapStrokeWidth)
      .attr('fill', mapFillColor)
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

d3.csv(scoresCsv).then(function(d) { // Add point to map for each school
  scores = d; // Save scores to global variable
  map.selectAll('circle')
    .data(d)
    .enter()
    .append('circle')
      .attr('cx', function(d) {
        return projection([d.Longitude, d.Latitude])[0];
      })
      .attr('cy', function(d) {
        return projection([d.Longitude, d.Latitude])[1];
      })
      .attr('r', pointRadius)
      .attr('class', function(d) {
        return 'School'
      })
      .attr('pointer-events', 'none')
      .style('fill', pointColor)
      .style('stroke', pointStrokeColor)
      .style('stroke-width', pointStrokeWidth)
      .style('opacity', pointOpacity);
});

///////// SCHOOL STATS /////////////
let updateStats = function(d) {
  // remove school information
  statBox.selectAll('text').remove();

  statBox.append('text')
  .attr('x', '1em')
  .attr('y', '1em')
  .attr('dy', "0.4em")
  .text(d[schoolName]);

  statBox.append('text')
  .attr('x', '2.5em')
  .attr('y', '3em')
  .attr('d', '0.5em')
  .text("Average Score (SAT Math): " + d[math]);

  statBox.append('text')
  .attr('x', '2.5em')
  .attr('y', '4.5em')
  .attr('d', '0.5em')
  .text("Average Score (SAT Reading): " + d[reading]);

  statBox.append('text')
  .attr('x', '2.5em')
  .attr('y', '6em')
  .attr('d', '0.5em')
  .text("Average Score (SAT Writing): " + d[writing]);
}

// DISTRICT STATS //////////////////////////////////////////////////////////////
var statBox = d3.select('#stats')
  .append('svg')
  .attr('width', mapZWidth)
  .attr('height', 110);

statBox.append('rect')
  .attr('x', 0)
  .attr('y', 0)
  .attr('height', 110)
  .attr('width', mapZWidth)
  .style('stroke', mapBorderColor)
  .style('fill', 'none')
  .style('stroke-width', mapBorderW);

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

// BUTTONS /////////////////////////////////////////////////////////////////////
$('#buttonFinish').on('click', function(event) { // Finished button
  tutorialActive = false;
  $('#flexRow').remove();
  $('#math').fadeIn(500, function() {
    $(this).show();
  });
  $('#mathText').fadeIn(500, function() {
    $(this).show();
  });
  $('#reading').fadeIn(500, function() {
    $(this).show();
  });
  $('#readingText').fadeIn(500, function() {
    $(this).show();
  });
  $('#writing').fadeIn(500, function() {
    $(this).show();
  });
  $('#writingText').fadeIn(500, function() {
    $(this).show();
  });

  mapZ.selectAll('text') // Remove narrative text
      .transition()
      .duration(200)
      .style('opacity', 0)
      .remove()

  map.selectAll("path") // Return overview map to default fill color
      .attr("fill", function(d) {
          return mapFillColor;
      });
});

// Adds trend for states that are below average
let preButton = function() {
  $('#math').hide();
  $('#mathText').hide();
  $('#reading').hide();
  $('#readingText').hide();
  $('#writing').hide();
  $('#writingText').hide();

  map.selectAll("path")
  .attr("fill", function(d) {
    if (lowScoreDistricts.indexOf(this.id) >= 0) {
      return 'red';
    } else {
      return mapFillColor;
    }
  });

  mapZ.append('text')
  .attr('x', '1em')
  .attr('y', '2em')
  .attr('d', '0.5em')
  .text("If you take the southern part of New York City as the ");

  mapZ.append('text')
  .attr('x', '1em')
  .attr('y', '3.2em')
  .attr('d', '0.5em')
  .text("center of interest and you start increasing the minimum");

  mapZ.append('text')
  .attr('x', '1em')
  .attr('y', '4.4em')
  .attr('d', '0.5em')
  .text("score of each subject, you notice that as we move away" );

  mapZ.append('text')
  .attr('x', '1em')
  .attr('y', '5.6em')
  .attr('d', '0.5em')
  .text("from the southern part, the schools' performance tends");

  mapZ.append('text')
  .attr('x', '1em')
  .attr('y', '6.8em')
  .attr('d', '0.5em')
  .text("to get better.");

  mapZ.append('text')
  .attr('x', '1em')
  .attr('y', '9.8em')
  .attr('d', '0.5em')
  .text("The districts highlighted red indicate the districts that");

  mapZ.append('text')
  .attr('x', '1em')
  .attr('y', '11em')
  .attr('d', '0.5em')
  .text("did not contain a single school that perfomed better than");

  mapZ.append('text')
  .attr('x', '1em')
  .attr('y', '12.2em')
  .attr('d', '0.5em')
  .text("the SAT national average for a particular subject.");

  mapZ.append('text')
  .attr('x', '1em')
  .attr('y', '15.2em')
  .attr('d', '0.5em')
  .text("You can use the sliders at the bottom to filter out");

  mapZ.append('text')
  .attr('x', '1em')
  .attr('y', '16.4em')
  .attr('d', '0.5em')
  .text("various schools depending on how they performed for");

  mapZ.append('text')
  .attr('x', '1em')
  .attr('y', '17.6em')
  .attr('d', '0.5em')
  .text("a given subject. Click on a district to zoom in.");  
}
preButton();
