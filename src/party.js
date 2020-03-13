require("babel-core/register");
require("babel-polyfill");

import partycsv from "./party_in_nyc.csv";

const XSTART = 0;

const YSPACING_SCALE = 100;
const YSPACING_OFFSET = 100;

const RAW_CIRCLE_ADJUSTMENT = 4;
const PROCESSED_CIRCLE_ADJUSTMENT = 1.75;

const TEXT_RAW_CIRCLE_DIST = 230;

const SVG_WIDTH = 350;
const SVG_HEIGHT = 800;

// Make left side SVG Container
var svg = d3.select("#viz")
    .append("svg")
    .attr("width", 300)
    .attr("height", SVG_HEIGHT)
    .attr("transform", "translate(0,0)"); // todo: try deleting this see if anything changes

var svg2 = d3.select("#viz")
    .append("svg")
    .attr("width", SVG_WIDTH)
    .attr("height", SVG_HEIGHT)
    .attr("id", "right-circles");
                    
var mapping = {"BROOKLYN": 0, "MANHATTAN": 0, "BRONX": 0, "QUEENS": 0, "STATEN ISLAND": 0};
var areas = {"BROOKLYN": 69.5, "MANHATTAN": 22.8, "BRONX": 42.5, "QUEENS": 108.1, "STATEN ISLAND": 58.69};  
var colors = ["firebrick", "orange", "gold", "green", "steelblue"];

d3.csv(partycsv).then(function(data){

    for (let step = 0; step < 5; step++) {
        var boroughCategory = data[step].Borough2;
        var count = data[step].Incidents;
        mapping[boroughCategory] = count;
    }

    // Add the SVG Text Element to the svgContainer
    svg.selectAll(".labels")
        .data(d3.entries(mapping))
        .enter()
        .append("text")
        .attr("x", XSTART)
        .attr("y", function(d, i) {
            return i * YSPACING_SCALE + YSPACING_OFFSET;
        })
        .text(function(d){
            return d.key;
        });

    var nodes = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(d3.entries(mapping))
        .enter()
        // Add one g element for each data node here.
        .append("g")
        // Position the g element like the circle element used to be.
        .attr("transform", function(d, i) {
            // Set d.x and d.y here so that other elements can use it. d is 
            // expected to be an object here.
            d.x = XSTART + TEXT_RAW_CIRCLE_DIST;
            d.y = i * YSPACING_SCALE + YSPACING_OFFSET
            return "translate(" + d.x + "," + d.y + ")"; 
        });

    // Add a circle element to the previously added g element.
    nodes.append("circle")
        .attr("class", "node")
        .attr("r", function(d) {
            return Math.sqrt(d.value) / RAW_CIRCLE_ADJUSTMENT;
        })
        .style("fill", function(d, i) {
            return colors[i];
        })
        .append("svg:title")
        .text(function(d) {
            return d.key + ": " + d.value + " noise complaints"
        });

    // Add a text element to the previously added g element.
    nodes.append("text")
        .attr("text-anchor", "middle")
        .text(function(d) {
            return Math.round(d.value / 1000) + "k";
        });

    var nodes2 = svg2.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(d3.entries(mapping))
        .enter()
        // Add one g element for each data node here.
        .append("g")
        // Position the g element like the circle element used to be.
        .attr("transform", function(d, i) {
        // Set d.x and d.y here so that other elements can use it. d is 
        // expected to be an object here.
         d.x = XSTART + TEXT_RAW_CIRCLE_DIST;
         d.y = i * YSPACING_SCALE + YSPACING_OFFSET
         return "translate(" + d.x + "," + d.y + ")"; 
        });

    // Add a circle element to the previously added g element.
    nodes2.append("circle")
        .attr("class", "node")
        .attr("r", function(d) {
            return Math.sqrt(d.value / areas[d.key]) * PROCESSED_CIRCLE_ADJUSTMENT;
        })
        .style("fill", function(d, i) {
            return colors[i];
        })
        .append("svg:title")
        .text(function(d) {
            return d.key + ": " + Math.round(d.value / areas[d.key]) + " noise complaints per square mile";
        });

    // Add a text element to the previously added g element.
    nodes2.append("text")
        .attr("text-anchor", "middle")
        .text(function(d) {
            return Math.round(d.value / areas[d.key]);
        });

});

$("#right-circles").hide();
$(".right-circle-title").hide();
$(".reveal-text").hide();

$(".reveal-btn").click(function() {
    $("#right-circles").slideToggle(700);
    $(".right-circle-title").slideToggle(700);
    $(".reveal-text").slideToggle(700);
});



// var svg5 = d3.select("#party-map")
//     .append("svg")
//     .attr("width", 400)
//     .attr("height", 400);

//     let proj = createProjection(400, 400, 1);

// createMap(svg5, proj, true, [3, 4, 0, 1], [0, 60000], rip, x, y, z);





