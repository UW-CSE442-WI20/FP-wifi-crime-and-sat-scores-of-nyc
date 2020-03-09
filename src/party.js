require("babel-core/register");
require("babel-polyfill");

import partycsv from "./party_in_nyc.csv";

const XSTART = 10;
const YSPACING_SCALE = 160;
const YSPACING_OFFSET = 100;
const RAW_CIRCLE_ADJUSTMENT = 4;
const PROCESSED_CIRCLE_ADJUSTMENT = 1.2;
const TEXT_RAW_CIRCLE_DIST = 230;
const TEXT_PROCESSED_CIRCLE_DIST = 430;

const SVG_WIDTH = 600;
const SVG_HEIGHT = 800;

// Make an SVG Container
var svg = d3.select("#viz")
                    .append("svg")
                    .attr("width", SVG_WIDTH)
                    .attr("height", SVG_HEIGHT)
                    .append("g")
                    .attr("transform", "translate(0,0)"); // todo: try deleting this see if anything changes

// this is to allow the map to update with correct counts
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
                    
var mapping = {"BROOKLYN": 0, "MANHATTAN": 0, "BRONX": 0, "QUEENS": 0, "STATEN ISLAND": 0};              

// this gets it done
async function calc() {
    d3.csv(partycsv).then(function(data){
        data.forEach(function(d){
            if (Object.keys(mapping).includes(d.Borough)) {
                mapping[d.Borough]++;
            }
        })
    });

    // must sleep!! zzzzzz....
    await sleep(600);

    // Add the SVG Text Element to the svgContainer
    var text = svg.selectAll(".labels")
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

    // Add left circles (land area not in consideration)
    svg.selectAll(".borough")
        .data(d3.entries(mapping))
        .enter()
        .append("circle")
        .style("stroke", "gray")
        .style("fill", "black")
        .attr("r", function(d){
            return Math.sqrt(d.value) / RAW_CIRCLE_ADJUSTMENT;
        })
        .attr("cx", XSTART + TEXT_RAW_CIRCLE_DIST)
        .attr("cy", function (d, i) {
            return i * YSPACING_SCALE + YSPACING_OFFSET;
        });

    // square mileage
    var areas = {"BROOKLYN": 69.5, "MANHATTAN": 22.8, "BRONX": 42.5, "QUEENS": 108.1, "STATEN ISLAND": 58.69};  

    // add right circles, land area taken into consideration
    // divide each circle area by land area and resize
    svg.selectAll(".borough")
        .data(d3.entries(mapping))
        .enter()
        .append("circle")
        .style("stroke", "gray")
        .style("fill", "black")
        .attr("r", function(d){
            return Math.sqrt(d.value / areas[d.key]) * PROCESSED_CIRCLE_ADJUSTMENT;
        })
        .attr("cx", XSTART + TEXT_PROCESSED_CIRCLE_DIST)
        .attr("cy", function (d, i) {
            return i * YSPACING_SCALE + YSPACING_OFFSET;
        });


    // //Add SVG Text Element Attributes
    // var textLabels = text
    //              .attr("x", function(d) { return d.cx; })
    //              .attr("y", function(d) { return d.cy; })
    //              .text( function (d) { return "( " + d.cx + ", " + d.cy +" )"; })
    //              .attr("font-family", "sans-serif")
    //              .attr("font-size", "20px")
    //              .attr("fill", "red");
}

calc();







