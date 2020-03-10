import weefee from "./weefee.csv";

const XSTART = 0;

const YSPACING_SCALE = 160;
const YSPACING_OFFSET = 100;

const RAW_CIRCLE_ADJUSTMENT = 2.5;
const PROCESSED_CIRCLE_ADJUSTMENT = 16;

const TEXT_RAW_CIRCLE_DIST = 230;

const SVG_WIDTH = 350;
const SVG_HEIGHT = 800;

// Make left side SVG Container
var svg3 = d3.select("#viz2")
                    .append("svg")
                    .attr("width", 320)
                    .attr("height", SVG_HEIGHT)
                    .attr("transform", "translate(0,0)"); // todo: try deleting this see if anything changes

var svg4 = d3.select("#viz2")
                    .append("svg")
                    .attr("width", SVG_WIDTH)
                    .attr("height", SVG_HEIGHT)
                    .attr("id", "right-circles2");
                    
var mapping = {"Brooklyn": 0, "Manhattan": 0, "Bronx": 0, "Queens": 0, "Staten Island": 0};
var areas = {"Brooklyn": 69.5, "Manhattan": 22.8, "Bronx": 42.5, "Queens": 108.1, "Staten Island": 58.69};  
var colors = ["firebrick", "orange", "gold", "green", "steelblue"];

d3.csv(weefee).then(function(data) {

    data.forEach(function(d) {
        if (d.BoroName in mapping) {
            mapping[d.BoroName]++;
        }
    });

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
            return d.key.toUpperCase();
        });

    var nodes3 = svg3.append("g")
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
    nodes3.append("circle")
        .attr("class", "node")
        .attr("r", function(d) {
            return Math.sqrt(d.value) * RAW_CIRCLE_ADJUSTMENT;
        })
        .style("fill", function(d, i) {
            return colors[i];
        })
        .append("svg:title")
        .text(function(d) {
            return d.key + ": " + d.value + " wifi hotspots"
        });

    // Add a text element to the previously added g element.
    nodes3.append("text")
        .attr("text-anchor", "middle")
        .text(function(d) {
            return Math.round(d.value);
        });

    var nodes4 = svg4.append("g")
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
    nodes4.append("circle")
        .attr("class", "node")
        .attr("r", function(d) {
            return Math.sqrt(d.value / areas[d.key]) * PROCESSED_CIRCLE_ADJUSTMENT;
        })
        .style("fill", function(d, i) {
            return colors[i];
        })
        .append("svg:title")
        .text(function(d) {
            return d.key + ": " + Math.round(d.value / areas[d.key]) + " wifi hotspots per square mile";
        });

    // Add a text element to the previously added g element.
    nodes4.append("text")
        .attr("text-anchor", "middle")
        .text(function(d) {
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