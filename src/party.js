require("babel-core/register");
require("babel-polyfill");

import partycsv from "./party_in_nyc.csv";

const XSTART = 0;
const YSPACING_SCALE = 160;
const YSPACING_OFFSET = 100;
const RAW_CIRCLE_ADJUSTMENT = 4;
const PROCESSED_CIRCLE_ADJUSTMENT = 1.75;
const TEXT_RAW_CIRCLE_DIST = 230;
const RIGHT_CIRCLES_X = 150;

const SVG_WIDTH = 350;
const SVG_HEIGHT = 800;

const CIRCLE_FILL = "steelblue";

// Make left side SVG Container
var svg = d3.select("#viz")
                    .append("svg")
                    .attr("width", SVG_WIDTH)
                    .attr("height", SVG_HEIGHT)
                    .attr("transform", "translate(0,0)"); // todo: try deleting this see if anything changes

var svg2 = d3.select("#viz")
                    .append("svg")
                    .attr("width", SVG_WIDTH)
                    .attr("height", SVG_HEIGHT)
                    .attr("id", "right-circles");

// this is to allow the map to update with correct counts
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
                    
var mapping = {"BROOKLYN": 0, "MANHATTAN": 0, "BRONX": 0, "QUEENS": 0, "STATEN ISLAND": 0};              

// this gets it done
// async function calc() {
    d3.csv(partycsv).then(function(data){

        for (let step = 0; step < 5; step++) {
            var boroughCategory = data[step].Borough2;
            var count = data[step].Incidents;
            mapping[boroughCategory] = count;
        }
        
        console.log(mapping);

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
            .style("fill", CIRCLE_FILL)
            .attr("r", function(d){
                return Math.sqrt(d.value) / RAW_CIRCLE_ADJUSTMENT;
            })
            .attr("cx", XSTART + TEXT_RAW_CIRCLE_DIST)
            .attr("cy", function (d, i) {
                return i * YSPACING_SCALE + YSPACING_OFFSET;
            })
            .append("svg:title")
            .text(function(d) {
                return d.key + ": " + d.value + " noise complaints"
            });

        // square mileage
        var areas = {"BROOKLYN": 69.5, "MANHATTAN": 22.8, "BRONX": 42.5, "QUEENS": 108.1, "STATEN ISLAND": 58.69};  

        // add right circles, land area taken into consideration
        // divide each circle area by land area and resize
        svg2.selectAll(".borough")
            .data(d3.entries(mapping))
            .enter()
            .append("circle")
            .style("stroke", "gray")
            .style("fill", CIRCLE_FILL)
            .attr("r", function(d){
                return Math.sqrt(d.value / areas[d.key]) * PROCESSED_CIRCLE_ADJUSTMENT;
            })
            .attr("cx", RIGHT_CIRCLES_X)
            .attr("cy", function (d, i) {
                return i * YSPACING_SCALE + YSPACING_OFFSET;
            })
            .append("svg:title")
            .text(function(d) {
                return d.key + ": " + Math.round(d.value / areas[d.key]) + " noise complaints per square mile"
            });

    });
    


    // must sleep!! zzzzzz....
    // await sleep(2000);

    

// calc();

$("#right-circles").hide();
$(".right-circle-title").hide();
$(".reveal-text").hide();

$(".reveal-btn").click(function() {
    
    $("#right-circles").slideToggle(700);

    $(".right-circle-title").slideToggle(700);

    $(".reveal-text").slideToggle(700);
});







