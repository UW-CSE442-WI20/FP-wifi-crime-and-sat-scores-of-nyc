import * as d3 from 'd3';
import * as d3ss from 'd3-simple-slider';
import $ from "jquery";
import geoData from './school_districts.json';
import scoresCsv from './scores.csv';
import sdCentersCsv from './school_district_centers.csv';
import sdScoreAvgsCsv from './district_score_avgs.csv';
import districtData from './districtData.csv';
import eth from './roundEth.csv';
import work from './grad.csv';


var mapZWidth = 350 * 1.2;



// SECTION FOR GRADUATION RATE VS SCORE SCATTER PLOT
var svg_grad = d3.select("#vizIntro")
    .append("svg")
      .attr("width", mapZWidth + 250)
      .attr("height", 400) // 300
      .attr('x', 0)
      .attr('y', 0)
      .attr("transform",
            "translate(" + 10 + "," + 10 + ")");

// svg_grad.append('rect')  // This is for the box contour.
//   .attr('x', 0)
//   .attr('y', 0)
//   .attr('height', 300)
//   .attr('width', mapZWidth + 150) // 420
//   .style('stroke', 'black')
//   .style('fill', 'none')
//   .style('stroke-width', 2);

var xg = d3.scaleLinear()
  .domain([50, 100])
  .range([0, 550]);

var yg = d3.scaleLinear()
    .domain([1000, 1600]) 
    .range([250, 0]); 

svg_grad.append("g")
     .attr("transform", "translate(80, 310)")
     .call(d3.axisBottom(xg));

svg_grad.append("g")
     .attr("transform", "translate(80, 60)")
     .call(d3.axisLeft(yg));

svg_grad.append("text")
          .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
          .attr("transform", "translate("+ (70/2) +","+(300/2)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
          .text("SAT Score");

svg_grad.append("text")
          .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
          .attr("transform", "translate("+ (570/2) +","+(350)+")")  // text is drawn off the screen top left, move down and out and rotate
          .text("Graduation Rate (%)");



d3.csv(work).then(function(data){

   var tooltip = d3.select("#vizIntro").append("div")
                  .attr("class", "tooltip")
                  .style('border', '1px solid steelblue')
                  .style("opacity", 0);

    var rounding = function(number){
      return Math.round(number * 10) / 10;
    }

    var tipMouseover = function(d) {
      console.log("Show");
      var html  = "District : " + d.District + "<br/>" +
                  "Graduation Rate : " + rounding(d.Grad_Rate) + "%" + "</span> <br/>" +     // Can make the K bold.
                  "<b>" + "</b> Average SAT score : <b/>" + d.SAT + "</b>";

      tooltip.html(html)
          .style("left", xg(d.Grad_Rate) + 80 - 40 + "px")
          .style("top", yg(d.SAT) - 30 + "px")
        .transition()
          .duration(100) // ms
          .style("opacity", .9) // started as 0!

    };


    // tooltip mouseout event handler
    var tipMouseout = function(d) {
        console.log("out");
        tooltip.transition()
            .duration(100) // ms
            .style("opacity", 0); // don't care about position!
    };


   // Regression Line mouseover event handler
   var regMouseover = function(d) {
    console.log("Show");
    var html  = "Slope : 8.6732" + "<br/>" +
                "Intercept : 645.8" + "<br/>";    // Can make the K bold.
               

    tooltip.html(html)
        .style("left", xg(95) + 80 - 40 + "px")
        .style("top", yg(1400) - 30 + "px")
      .transition()
        .duration(100) // ms
        .style("opacity", .9) // started as 0!

    };


    // // Regression Line mouseout event handler
    var regMouseout = function(d) {
        console.log("out");
        tooltip.transition()
            .duration(100) // ms
            .style("opacity", 0); // don't care about position!
    };






  svg_grad.selectAll(".dot")
        .data(data)
      .enter().append("circle")
        .attr("class", "dot")
        .attr("r", 5.5) // radius size, could map to another data dimension
        .attr("cx", function(d) { return xg( d.Grad_Rate ) + 80; })     // x position. 40 is the offset.
        .attr("cy", function(d) { return yg( d.SAT ) + 60; })  // y position. 60 is the offset.
        .style("fill", "#008080")
        .on("mouseover", tipMouseover)
        .on("mouseout", tipMouseout);

  svg_grad.append("line")
    .style("stroke", "blue")  // colour the line
    .style("stroke-width", 3)
    .style("opacity", 0.5)
    .attr("id", "reg")
    .attr("x1", xg(52) + 70)     // x position of the first end of the line
    .attr("y1", yg(1096) + 60)      // y position of the first end of the line
    .attr("x2", xg(93) + 70)     // x position of the second end of the line
    .attr("y2", yg(1452) + 60)
    .on("mouseover", regMouseover)
    .on("mouseout", regMouseout);

  


});










// SECTION FOR INCOME VS SCORE LINE CHART

var svg_income = d3.select("#vizIntro2")
    .append("svg")
      .attr("width", mapZWidth + 400)
      .attr("height", 400) // 300
      .attr('x', 0)
      .attr('y', 0)
      .attr("transform",
            "translate(" + 10 + "," + 10 + ")");

// svg_income.append('rect')  // This is for the box contour.
//   .attr('x', 0)
//   .attr('y', 0)
//   .attr('height', 300)
//   .attr('width', mapZWidth + 150) // 420
//   .style('stroke', 'black')
//   .style('fill', 'none')
//   .style('stroke-width', 2);


var numberOfDistrict = 33;

var x = d3.scaleLinear()
  .domain([20000, 150000])
  .range([0, 550]);

var y = d3.scaleLinear()
    .domain([1000, 1600]) 
    .range([200, 0]); 

svg_income.append("g")
     .attr("transform", "translate(70, 230)")
     .call(d3.axisBottom(x));

svg_income.append("g")
     .attr("transform", "translate(70, 30)")
     .call(d3.axisLeft(y));


svg_income.append("text")
          .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
          .attr("transform", "translate("+ (60/2) +","+(250/2)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
          .text("SAT Score");

svg_income.append("text")
          .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
          .attr("transform", "translate("+ (570/2) +","+(300-30)+")")  // text is drawn off the screen top left, move down and out and rotate
          .text("District Income ($)");





// SECTION FOR BAR CHART

// var svg_bar = d3.select("#map")
//     .append("svg")
//       .attr("width", mapZWidth + 150)
//       .attr("height", 300)
//       .attr('x', 0)
//       .attr('y', 0)
//       .attr("transform",
//             "translate(" + 10 + "," + 10 + ")");

// svg_bar.append('rect')  // This is for the box contour.
//   .attr('x', 0)
//   .attr('y', 0)
//   .attr('height', 300)
//   .attr('width', mapZWidth + 150) // 420
//   .style('stroke', 'black')
//   .style('fill', 'none')
//   .style('stroke-width', 2);









d3.csv(districtData).then(function(data){
	var data_income = [];
    data.forEach(function(d){
      //console.log(d["Mean Income"]);
      data_income.push([parseFloat(d["Mean Income"]), parseFloat(d["Mean Sat Score"]), d["District"]]);
      //data_income.push({"x":parseFloat(d["Mean Income"]), "y":parseFloat(d["Mean Sat Score"]), "name":d["District"]});
     
    });
    data_income.sort(function(a, b){return a[0] - b[0];});
    console.log(data_income[0][0]);

    var line1 = d3.line()
      .x(function(d) { return x(d[0]) + 70; }) // set the x values for the line generator
      .y(function(d) { return y(d[1]) + 30; }) // set the y values for the line generator 
      .curve(d3.curveCardinal);
    var path = svg_income.append("path")
      //.datum(data_income) // 10. Binds data to the line 
      .attr("class", "line") // Assign a class for styling 
      .attr("d", line1(data_income)) // 11. Calls the line generator 
      .attr("stroke", "#D8D8D8")
      .style('stroke-width', 3)
      .attr("fill", "none");

    // Create anaimation for line chart.
    // Variable to Hold Total Length
    var totalLength = path.node().getTotalLength();

    // Set Properties of Dash Array and Dash Offset and initiate Transition
    // path
    //   .on('mouseover', function (d, i) {
    //       d3.select(this).transition()
    //            .duration('50')
    //            .attr('opacity', '.3');
    //       //console.log("Over");
    //   })
    //   .on('mouseout', function (d, i) {
    //       d3.select(this).transition()
    //            .duration('50')
    //            .attr('opacity', '1');
    //       //console.log("Out");
    //   })

    path
      .attr("stroke-dasharray", totalLength + " " + totalLength)
      .attr("stroke-dashoffset", totalLength)
      .transition() // Call Transition Method
      .duration(2000) // Set Duration timing (ms)
      .ease(d3.easeLinear) // Set Easing option
      .attr("stroke-dashoffset", 0) // Set final value of dash-offset for transition

    var tooltip = d3.select("#vizIntro2").append("div")
                  .attr("class", "tooltip")
                  .style('border', '1px solid steelblue')
                  .style("opacity", 0);

    var rounding = function(number){
    	return Math.round((number / 1000) * 10) / 10;
    }

    var tipMouseover = function(d) {
    	console.log("Show");
      var html  = "District : " + d[2] + "<br/>" +
                  "average income : " + rounding(d[0]) + "K USD" + "</span> <br/>" +     // Can make the K bold.
                  "<b>" + "</b> average SAT score : <b/>" + Math.round(d[1]) + "</b>";

      tooltip.html(html)
          .style("left", x(d[0]) + 70 + "px")
          .style("top", y(d[1]) - 30 + "px")
        .transition()
          .duration(100) // ms
          .style("opacity", .9) // started as 0!

    };


    // tooltip mouseout event handler
	  var tipMouseout = function(d) {
	  		console.log("out");
	      tooltip.transition()
	          .duration(100) // ms
	          .style("opacity", 0); // don't care about position!
	  };




    svg_income.selectAll(".dot")
        .data(data_income)
      .enter().append("circle")
        .attr("class", "dot")
        .attr("r", 5.5) // radius size, could map to another data dimension
        .attr("cx", function(d) { return x( d[0] ) + 70; })     // x position. 40 is the offset.
        .attr("cy", function(d) { return y( d[1] ) + 30; })  // y position. 60 is the offset.
        .style("fill", "#008080")
        .on("mouseover", tipMouseover)
        .on("mouseout", tipMouseout);


    // Check box to show the regressional line.

    var update = function () {
    	console.log("yes");
    	 if (d3.select("#CheckBoxIncome").property("checked"))
    	 {
    	 	svg_income.append("line")
        	.style("stroke", "blue")  // colour the line
          .style("stroke-width", 3)
          .style("opacity", 0.5)
        	.attr("id", "reg")
        	.attr("x1", x(25000) + 70)     // x position of the first end of the line
        	.attr("y1", y(1206) + 30)      // y position of the first end of the line
        	.attr("x2", x(140000) + 70)     // x position of the second end of the line
        	.attr("y2", y(1402) + 30);  

        svg_income.append("text")
          .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
          .attr("transform", "translate("+ (x(140000) + 70) +","+(y(1402))+")")  // text is drawn off the screen top left, move down and out and rotate
          .attr("id", "tt")
          .text("Slope : 0.00169, Intercept : 1165");



    	 }
    	 else{
    	 	svg_income.select("#reg").remove();
        svg_income.select("#tt").remove();
    	 }

    	
    };


    d3.select("#CheckBoxIncome").property("disabled", false);
    d3.select("#CheckBoxIncome").on("change", update);
		update();




});




//// SECTION FOR BAR CHART
// d3.csv(eth).then(function(data){
// 	// THIS IS FOR ETHNICITY BAR CHART
//     // List of subgroups = header of the csv files = soil condition here
//     var subgroups = data.columns.slice(2);

//     // List of groups = species here = value of the first column called group -> I show them on the X axis
//     var groups = d3.map(data, function(d){return(d.MaxValue)}).keys();

//     // Add X axis
//     var xb = d3.scaleBand()
//         .domain(groups)
//         .range([0, 420])
//         .padding([0.2])
//     svg_bar.append("g")
//       .attr("transform", "translate(40, 210)")
//       .call(d3.axisBottom(xb).tickSizeOuter(0));

//     // Add Y axis
//     var yb = d3.scaleLinear()
//       .domain([0, 100])
//       .range([ 150, 0 ]);
//     svg_bar.append("g")
//       .attr("transform", "translate(40, 60)")
//       .call(d3.axisLeft(yb));


//     // color palette = one color per subgroup
//     var color = d3.scaleOrdinal()
//       .domain(subgroups)
//       .range(['#e41a1c','#377eb8','#4daf4a', '#ffa500'])


//     //stack the data? --> stack per subgroup
//     var stackedData = d3.stack()
//       .keys(subgroups)
//       (data)


//     svg_bar.append("g")
//     .selectAll("g")
//     // Enter in the stack data = loop key per key = group per group
//     .data(stackedData)
//     .enter().append("g")
//       .attr("fill", function(d) { return color(d.key); })
//       .selectAll("rect")
//       // enter a second time = loop subgroup per subgroup to add all rectangles
//       .data(function(d) { return d; })
//       .enter().append("rect")
//         .attr("x", function(d) { return xb(d.data.MaxValue) + 35; })
//         .attr("y", function(d) { return yb(d[1]) + 60; })
//         .attr("height", function(d) { return yb(d[0]) - yb(d[1]); })
//         .attr("width", xb.bandwidth()) //xb.bandwidth()




// });



//// SECTION FOR INTERACTIVE AND SORTABLE BAR CHART


var width_t =  mapZWidth + 300; // mapZWidth == 420.
var height_t = 550;
var svg_t = d3.select("#viz3")
    .append("svg")
      .attr("width", width_t + 100) 
      .attr("height", height_t)
      .attr('x', 0)
      .attr('y', 0)
      .attr("transform",
            "translate(" + 10 + "," + 10 + ")");

// svg_t.append('rect')  // This is for the box contour.
//   .attr('x', 0)
//   .attr('y', 0)
//   .attr('height', height_t)
//   .attr('width', width_t) 
//   .style('stroke', 'black')
//   .style('fill', 'none')
//   .style('stroke-width', 2);


var xt = d3.scaleBand()
        .range([0, width_t - 80])
        .padding([0.2]);

var yt = d3.scaleLinear()
    .rangeRound([250, 0]);

var color = d3.scaleOrdinal()
    .range(["9ac6a3",'#7ea8e2','#cc94c5', '#dca684']);  // '#e41a1c','#377eb8','#4daf4a', '#ffa500'
    // "#98abc5", "#8a89a6", "#7b6888", "#6b486b"
    // '#e41a1c','#377eb8','#4daf4a', '#ffa500'


svg_t.append("text")
       .attr("transform", "translate("+ (width_t/2) +","+(height_t - 90)+")")  // text is drawn off the screen top left, move down and out and rotate
       .style("text-anchor", "middle")
       .text("Score Range");

svg_t.append("text")
       .attr("transform", "translate("+ (25) +","+(height_t/2)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
       .style("text-anchor", "middle")
       .text("Proportion(%)");



var active_link = "0"; //to control legend selections and hover
var legendClicked; //to control legend selections
var legendClassArray = []; //store legend classes to select bars in plotSingle()
var legendClassArray_orig = []; //orig (with spaces)
var sortDescending; //if true, bars are sorted by height in descending order
var restoreXFlag = false; //restore order of bars back to original


//disable sort checkbox
d3.select("label")             
  .select("input")
  .property("disabled", true)
  .property("checked", false); 


d3.csv(eth).then(function(data){

	var subgroups = data.columns.slice(2);
	var groups = d3.map(data, function(d){return(d.MaxValue)}).keys();
	
	// Axis
	xt.domain(groups);
	yt.domain([0, 100]);


  svg_t.append("g")
    .attr("id", "xAxis")
    .attr("transform", "translate(60, 410)")
    .call(d3.axisBottom(xt)) // .tickSizeOuter(0)
    // .append("text")
    //    .attr("transform", "translate("+ (570/2) +","+(500)+")")  // text is drawn off the screen top left, move down and out and rotate
    //    .style("text-anchor", "middle")
    //    .text("Score Range");


	svg_t.append("g")
	  .attr("transform", "translate(60, 160)")
      .call(d3.axisLeft(yt))
	  // .append("text")
   //     .attr("transform", "translate("+ (50) +","+(125)+")")  // text is drawn off the screen top left, move down and out and rotate
   //     .style("text-anchor", "middle")
	  //    .text("Proportion(%)");
	
	// This is used to rearrange the x axis.
	var xAxis = d3.axisBottom(xt);



	var color = d3.scaleOrdinal()
      .domain(subgroups)
      .range(["#9ac6a3",'#7ea8e2','#cc94c5', '#dca684']);


    var asian_y = [];
    var asian_height = [];
    data.forEach(function(d) {
    	asian_y.push(yt(d["Asian Perc"]));
    	asian_height.push(yt(0) - yt(d["Asian Perc"]));
    	//console.log(yt(0) - yt(d["Asian Perc"]));
    var myScore = d.MaxValue; //add to stock code
    var y0 = 0;
	    //d.ages = color.domain().map(function(name) { return {name: name, y0: y0, y1: y0 += +d[name]}; });
	    d.Scores = color.domain().map(function(name){  // need the var or not ?
	      
	      return { 
	        myScore:myScore, 
	        name: name, 
	        y0: y0, 
	        y1: y0 += +d[name], 
	        value: d[name],
	        y_corrected: 0
	      };

	    });

	    d.total = d.Scores[d.Scores.length - 1].y1;   

    });
   


  	//Sort totals in ascending order
	data.sort(function(a, b) { return a.total - b.total; });  

	


    var score = svg_t.selectAll(".score") // Create and select a placeholder for (.score)
      .data(data)
    .enter().append("g")
      .attr("class", "g")
      .attr("transform", function(d) { return "translate(" + "0" + ",0)"; });
    //console.log(score);
      //.attr("transform", function(d) { return "translate(" + x(d.State) + ",0)"; })

   var height_diff = 0;  //height discrepancy when calculating h based on data vs y(d.y0) - y(d.y1)
   score.selectAll("rect")
   	.data(function(d) {
      	// console.log("Scores");
      	// console.log(d.Scores);
       return d.Scores; 
     })
    .enter()
    .append("rect")
      .attr("width", xt.bandwidth())
      .attr("y", function(d) {
        height_diff = height_diff + yt(d.y0) - yt(d.y1) - (yt(0) - yt(d.value));  //height_diff + yt(d.y0) - yt(d.y1) - (yt(0) - yt(d.value))
        d.y_corrected = yt(d.y1) + height_diff;                                   // OK
        //console.log(yt(d.y1));
        //d.y_corrected = y_corrected //store in d for later use in restorePlot()

        if (d.name === "Hispanic Perc") height_diff = 0; //reset for next d.myScore
        //console.log(d.y_corrected);
        return d.y_corrected + 60 + 100;    // 160 is the offset.
        // return y(d.y1);  //orig, but not accurate  
      })
      .attr("x",function(d) { //add to stock code
          return xt(d.myScore) + 60; // 50 is the offest.
        })
      .attr("height", function(d) {       
        //return y(d.y0) - y(d.y1); //heights calculated based on stacked values (inaccurate)
       	// console.log("Height");
        // console.log(yt(0) - yt(d.value));
        return yt(0) - yt(d.value); 
      })								 
      .attr("class", function(d) {        
        var classLabel = d.name.replace(/\s/g, ''); //remove spaces
        return "bars class" + classLabel;
      })
      .style("fill", function(d) { 
      	//console.log("name");
      	//console.log(d.name);
      	return color(d.name); 
      });

		

      score.selectAll("rect")
       .on("mouseover", function(d){

          var delta = d.y1 - d.y0;
          var xPos = parseFloat(d3.select(this).attr("x"));
          var yPos = parseFloat(d3.select(this).attr("y"));
          var height = parseFloat(d3.select(this).attr("height"));

          d3.select(this).attr("stroke","blue").attr("stroke-width",0.8);
          //console.log(d.name);
          svg_t.append("text")
          .attr("x",xPos)
          .attr("y",yPos +height/2)
          .attr("class",".tooltip")
          .attr("id", "textShow")
          .text(d.name +": "+ d.value + "%");  // delta
          //console.log(svg_t.select("text"));
          
       })
       .on("mouseout",function(){
       		console.log("Leave");
          svg_t.select("#textShow").remove(); //.tooltip
          d3.select(this).attr("stroke","pink").attr("stroke-width",0.2);
                                
        })



    var legend = svg_t.selectAll(".legend")
      .data(color.domain().slice().reverse())
    .enter().append("g")
      .attr("class", function (d) {
        legendClassArray.push(d.replace(/\s/g, '')); //remove spaces
        legendClassArray_orig.push(d); //remove spaces
        return "legend";
      })
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    //reverse order to match order in which bars are stacked    
    legendClassArray = legendClassArray.reverse();
    legendClassArray_orig = legendClassArray_orig.reverse();

    var sortBy;
    var width = 420;
    legend.append("rect")
      .attr("x", width + 250)
      .attr("y", 25)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", color)
      .attr("id", function (d, i) {
        return "id" + d.replace(/\s/g, '');
      })
      .on("mouseover",function(){        

        if (active_link === "0") d3.select(this).style("cursor", "pointer");
        else {
          if (active_link.split("class").pop() === this.id.split("id").pop()) {
            d3.select(this).style("cursor", "pointer");
          } else d3.select(this).style("cursor", "auto");
        }
      })
      .on("click",function(d){        

        if (active_link === "0") { //nothing selected, turn on this selection
          d3.select(this)           
            .style("stroke", "black")
            .style("stroke-width", 2);

            active_link = this.id.split("id").pop();
            plotSingle(this);

            //gray out the others
            for (i = 0; i < legendClassArray.length; i++) {
              if (legendClassArray[i] != active_link) {
                d3.select("#id" + legendClassArray[i])
                  .style("opacity", 0.5);
              } else sortBy = i; //save index for sorting in change()
            }

            //enable sort checkbox
            d3.select("#CheckBoxBar").property("disabled", false) // input is not a class 
            d3.select("#CheckBoxBar").style("color", "black")
            //sort the bars if checkbox is clicked            
            d3.select("#CheckBoxBar").on("change", change);  
           
        } else { //deactivate
          if (active_link === this.id.split("id").pop()) {//active square selected; turn it OFF
            d3.select(this)           
              .style("stroke", "none");
            
            //restore remaining boxes to normal opacity
            for (var i = 0; i < legendClassArray.length; i++) {              
                d3.select("#id" + legendClassArray[i])
                  .style("opacity", 1);
            }

            
            if (d3.select("label").select("input").property("checked")) {              
              restoreXFlag = true;
            }
            
            //disable sort checkbox
            d3.select("#CheckBoxBar")
              .style("color", "#D8D8D8")
              .property("disabled", true)
              .property("checked", false);   


            //sort bars back to original positions if necessary
            change();     // change();       

            // y translate selected category bars back to original y posn
            restorePlot(d);

            active_link = "0"; //reset
          }

        } //end active_link check
                          
                                
      });



	  legend.append("text")
		  .attr("x", width + 230)
		  .attr("y", 35)
		  .attr("dy", ".35em")
		  .style("text-anchor", "end")
		  .text(function(d) { return d; });


	  // restore graph after a single selection
	  function restorePlot(d) {
	    d3.selectAll(".bars:not(.class" + d.replace(/\s/g, '') + ")") //class_keep
	          .transition()
	          .duration(1000)
	          .delay(function() {
	            if (restoreXFlag) return 400;
	            else return 750;
	          })
	          .attr("width", xt.bandwidth()) //restore bar width //
	          .style("opacity", 1);

	    //translate bars back up to original y-posn
	    d3.selectAll(".class" + d.replace(/\s/g, ''))    // Create and select a class.
	      .attr("x", function(d) { return xt(d.myScore) + 60; })
	      .transition()
	      .duration(1000)
	      .delay(function () {
	        if (restoreXFlag) return 400; //bars have to be restored to orig posn
	        else return 0;
	      })
	      .attr("y", function(d) {
	        //return y(d.y1); //not exactly correct since not based on raw data value
	        return d.y_corrected + 160; 
	      });

	    //reset
	    restoreXFlag = false;
	    
	  }




	 // plot only a single legend selection
	  function plotSingle(d) {
	    //console.log(d)  
	    var class_keep = d.id.split("id").pop();
	    var idx = legendClassArray.indexOf(class_keep); 
	    
	    d3.selectAll(".bars:not(.class" + class_keep + ")") //not //".bars:not(.class" + class_keep + ")"  //"bars class" + class_keep
	          .transition()
	          .duration(1000)
	          .attr("width", 0) // use because svg has no zindex to hide bars so can't select visible bar underneath
	          .style("opacity", 0);


	    //lower the bars to start on x-axis  
	    d3.selectAll(".bars.class" + class_keep) //not //".bars:not(.class" + class_keep + ")"  //"bars class" + class_keep
	          .transition()
	          .duration(1000)
	          //.attr("y", 0);
	          .attr("y", function(d){
	        
			      var i = (d.myScore - 999) / 100;
			      var h_keep = yt(0) - yt(d.value);
			      var h_shift = h_keep - asian_height[i];
			      var y_new = asian_y[i] - h_shift;
			      
			      return y_new + 160;

		        });
	   
	    
	   
	  }



	  //adapted change() fn in http://bl.ocks.org/mbostock/3885705
	  function change() {
	  	// this.checked
	  	
	    if (d3.select("#CheckBoxBar").property("checked")) sortDescending = true;
	    else sortDescending = false;

	    var colName = legendClassArray_orig[sortBy];

	    // maybe need to change x to xt
	    var x0 = xt.domain(data.sort(sortDescending
	        ? function(a, b) { console.log(a); return a[colName] - b[colName]; }
	        : function(a, b) { return a["MaxValue"] - b["MaxValue"]; })  //return b.total - a.total;
	        .map(function(d,i) { 
	        	//console.log(d.MaxValue);
	        	return d.MaxValue; 
	        }))   // d.State
	        .copy();
	    // score
	    score.selectAll(".class" + active_link)
	         .sort(function(a, b) { 
	         	//console.log("myScore");
	         	//console.log(a.myScore);
	            return x0(a.myScore) - x0(b.myScore); 
	          });

	    var transition = svg_t.transition().duration(750), delay = function(d, i) { return i * 20; };
 
	    //sort bars
	    transition.selectAll(".class" + active_link)
	      .delay(delay)
	      .attr("x", function(d) {      
	        return x0(d.myScore) + 60; // 60 is the offset. 
	      });      

	   

	    console.log("Before sorting");
	    console.log(groups);
	    groups = groups.sort(function(a, b) { 
	         	//console.log("myScore");
	         	//console.log(a.myScore);
	            return x0(a) - x0(b); 
	          }); 

	    console.log("After sorting");
	    console.log(groups);

	    xt.domain(groups);

	    svg_t.select("#xAxis")
	    	.transition()
	    	.duration(1000)
	    	.call(d3.axisBottom(xt))

	 

	  }




});

























































