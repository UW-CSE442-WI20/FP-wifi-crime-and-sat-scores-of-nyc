import partycsv from "./party_in_nyc.csv";

const XSTART = 0;
const X_ON_LEFT_CIRCLES = 220;
const X_ON_RIGHT_CIRCLES = 140;

const YSPACING_SCALE = 160;
const YSPACING_OFFSET = 100;

const RAW_CIRCLE_ADJUSTMENT = 4;
const PROCESSED_CIRCLE_ADJUSTMENT = 1.75;

const TEXT_RAW_CIRCLE_DIST = 230;
const RIGHT_CIRCLES_X = 150;

const SVG_WIDTH = 350;
const SVG_HEIGHT = 800;

// Make left side SVG Container
var svg3 = d3.select("#viz2")
                    .append("svg")
                    .attr("width", SVG_WIDTH)
                    .attr("height", SVG_HEIGHT)
                    .attr("transform", "translate(0,0)"); // todo: try deleting this see if anything changes

var svg4 = d3.select("#viz2")
                    .append("svg")
                    .attr("width", SVG_WIDTH)
                    .attr("height", SVG_HEIGHT)
                    .attr("id", "right-circles2");
                    
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
    var text = svg3.selectAll(".labels")
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
    svg3.selectAll(".borough")
        .data(d3.entries(mapping))
        .enter()
        .append("circle")
        .style("fill", function(d, i) {
            return colors[i];
        })
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

    // left circle counts
    var text = svg3.selectAll(".labels")
    .data(d3.entries(mapping))
    .enter()
    .append("text")
    .attr("x", X_ON_LEFT_CIRCLES)
    .attr("y", function(d, i) {
        return i * YSPACING_SCALE + YSPACING_OFFSET + 5;
    })
    .text(function(d){
        return Math.round(d.value / 1000) + "k";
    });

    // add right circles, land area taken into consideration
    // divide each circle area by land area and resize
    svg4.selectAll(".borough")
        .data(d3.entries(mapping))
        .enter()
        .append("circle")
        .style("fill", function(d, i) {
            return colors[i];
        })
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

    // right circle counts
    svg4.selectAll(".labels")
        .data(d3.entries(mapping))
        .enter()
        .append("text")
        .attr("x", X_ON_RIGHT_CIRCLES)
        .attr("y", function(d, i) {
            return i * YSPACING_SCALE + YSPACING_OFFSET + 5;
        })
        .text(function(d, i){
            return Math.round(d.value / areas[d.key]);
        });


});

$("#right-circles2").hide();
$(".right-circle-title2").hide();
$(".reveal-text2").hide();

$(".reveal-btn2").click(function() {
    $("#right-circles2").slideToggle(700);
    $(".right-circle-title2").slideToggle(700);
    $(".reveal-text2").slideToggle(700);
});