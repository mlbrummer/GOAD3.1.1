/*
 * Code written in this javascript document is a modification from the following code: https://bl.ocks.org/mbostock/3887051
 * @Author Mldubbelaar
 */

function createBarGraph(){
	// The size of the bar graph is defined.
	var margin = {top: 0, right: 20, bottom: 85, left: 50},
		width = ($("#QE_content").width() * 0.85) - margin.left - margin.right,
	    height = 500 - margin.top - margin.bottom;

	var x0 = d3.scale.ordinal()
	    .rangeRoundBands([0, width*0.83], .1);

	var x1 = d3.scale.ordinal();

	var y = d3.scale.linear()
	    .range([height, 0]);
	
	// Colors for the columns is defined.
	var color = d3.scale.ordinal()
		.domain([
			"Not expressed",
			"Not significantly expressed",
			  "90-100 percentile: very low expression",
			  "80-90 percentile: low expression",
			  "70-80 percentile: low expression",
			  "60-70 percentile: low expression",
			  "50-60 percentile: moderate expression",
			  "40-50 percentile: moderate expression",
			  "30-40 percentile: moderate expression",
			  "20-30 percentile: moderately high expression",
			  "10-20 percentile: moderately high expression",
			  "5-10 percentile: high expression",
			  "0-5 percentile: very high expression"
	  			])
	    .range([
	    	"#cccccc",		//Grey	 
	    	"#666666", 		//Dark Grey	
	    	"#000000", 		//Black	 
	    	"#3333cc", 		//Midnightblue	 
	    	"#000099", 		//Darkblue
	    	"#0000ff", 		//Blue
	    	"#33ccff", 		//Darkturqoise
	    	"#66ffff", 		//Turqoise
	    	"#66ff33", 		//Green
	    	"#ccff33", 		//Greenyellow 
	    	"#ffff00", 		//Yellow
	    	"#ff6600",		//Orange
	    	"#ff0000", 		//Red	 		
				]); 

	// X axis is defined.
	var xAxis = d3.svg.axis()
	    .scale(x0)
	    .tickSize(0, 0)
	    .orient("bottom");

	// Y axis is defined.
	var yAxis = d3.svg.axis()
	    .scale(y)
	    .orient("left")
	    .tickFormat(d3.format(".2s"));

	// The tooltip is defined.
	var tip = d3.tip()
	  .attr('class', 'd3-tip')
	  .offset([-10, 0])
	  .html(function(d) {
	  	if (d.Percentile[":"] === undefined) {
	  		var percentileInfo = d.Percentile.split(": ");
	  		return "TPM value : " + d.TPM + "<br/>TPM Low value : " + d.Low_TPM +"<br/>TPM High value : " + d.High_TPM + "<br/><br/>" + capitalizeEachWord(d.Percentile)
	  	} else {
	  		return "TPM value : " + d.TPM + "<br/>TPM Low value : " + d.Low_TPM +"<br/>TPM High value : " + d.High_TPM + "<br/><br/>" + capitalizeEachWord(percentileInfo[1])
	  	}
	})

	// The svg is drawn and added into the div with the id "TPMdiv"
	var svg = d3.select("#TPMdiv").append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	    .attr("class", "tpmValsPlot")
	  	.append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	  // The type of information shown (also in the legend) are defined.
	  svg.call(tip);
	  
	  // Defining the tpmTypes (these types will be drawn).
	  var tpmTypes = ["TPM"];
	  // var tpmTypes = ["Percentile"];
	  var percentileTypes = [
		  "Not expressed",
		  "Not significantly expressed",
		  "90-100 percentile: very low expression",
		  "80-90 percentile: low expression",
		  "70-80 percentile: low expression",
		  "60-70 percentile: low expression",
		  "50-60 percentile: moderate expression",
		  "40-50 percentile: moderate expression",
		  "30-40 percentile: moderate expression",
		  "20-30 percentile: moderately high expression",
		  "10-20 percentile: moderately high expression",
		  "5-10 percentile: high expression",
		  "0-5 percentile: very high expression"];


	  // The tpmVals are obtained.
	  bargraphData.forEach(function(d) {
	    d.tpmVal = tpmTypes.map(function(name) { return {name: name, value: +d[name]}; });
	  });

	  x0.domain(bargraphData.map(function(d) { return d.Gene; }));
	  x1.domain(tpmTypes).rangeRoundBands([0, x0.rangeBand()]);
	  y.domain([0, d3.max(bargraphData, function(d) { return d3.max(d.tpmVal, function(d) { return d.value; }); })]);

	  // Adds the X axis to the svg.
	  svg.append("g")
	      .attr("class", "x axis")
	      .attr("transform", "translate(0," + height + ")")
	      .call(xAxis)
	      .selectAll("text")
//        .call(wrap, d3.scale.ordinal().rangeRoundBands([0, hGDim.w], 0.1))
	        .call(wrap, 70)
//	        .attr("y", 10)
//	        .attr("x", 2)
//	        .attr("dy", ".35em")
	        .attr("transform", "rotate(-45)")
	        .style("font-size", "16px")
	        .style("text-anchor", "end");

	  // Adds the Y axis to the svg.
	  svg.append("g")
	      .attr("class", "y axis")
	      .call(yAxis)
	      .append("text")
	      .attr("transform", "rotate(-90)")
	      .attr("y", 6)
	      .attr("dy", ".71em")
	      .style("text-anchor", "end")
	      .text("TPM value")
//        .call(wrap, d3.scale.ordinal().rangeRoundBands([0, hGDim.w], 0.1))
//	      .call(wrap, 70)
	      .style("font-size", "16px");
//        .attr("y", 10)
//        .attr("x", 2)
//        .attr("dy", ".35em")

	  // Defines state (used to draw all of the bars).
	  var state = svg.selectAll(".state")
	      .data(bargraphData)
	      .enter().append("g")
	      .attr("class", "state")
	      .attr("transform", function(d) { return "translate(" + x0(d.Gene) + ",0)"; })
	      .attr("fill", function(d) { return color(d.Percentile); })
	      .on('mouseover', tip.show)
	      .on('mouseout', tip.hide);

	  // Adds each bar to the bargraph.
	  state.selectAll("rect")
	      .data(function(d) { return d.tpmVal; })
	      .enter().append("rect")
	      // .attr("width", x1.rangeBand())
	      .attr("width", d3.min([x1.rangeBand(), 50]))
	      // .attr("x", function(d) { return x1(d.name); })
	      .attr("x", function(d) { return x1(d.name) + (x1.rangeBand() - d3.min([x1.rangeBand(), 50]))/2; })
	      .attr("y", function(d) { return y(d.value); })
	      .attr("height", function(d) { return height - y(d.value); })
	      // .attr("fill", function(d) { return color(d.Percentile); });

	  // Adds the legend to the svg.
	  var legend = svg.selectAll(".legend")
	      // .data(tpmTypes.slice().reverse())
	      .data(percentileTypes.slice().reverse())
	      .enter().append("g")
	      .attr("class", "legend")
	      .style("font-size", "16px")
	      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

	  // Adds the color to the legend.
	  legend.append("rect")
//	      .attr("x", width)
	  	  .attr("x", width-83)
	      .attr("width", 18)
	      .attr("height", 18)
	      .style("fill", color);

	  // Adds the names of the legend.
	  legend.append("text")
//	      .attr("x", width - 4)
	  	  .attr("x", width - 63)
	      .attr("y", 9)
	      .attr("dy", ".35em")
//	      .style("text-anchor", "end")
	      .style("text-anchor", "start")
	      .text(function(d) {
	      	if (d[":"] === undefined) {
	      		if (/percentile/i.test(d)) {
	      			var percentileNumber = d.split(" percentile: ");
		  			return capitalizeEachWord(percentileNumber[0]);
	      		} else if (d ==="Not expressed") {
			  			return capitalizeEachWord("Not Expr");
			  	} else {
			  			return capitalizeEachWord("Not Sign");
			  		}
//	  			var percentileNumber = d.split(" percentile: ");
//	  			return capitalizeEachWord(percentileNumber[0]);
		  	}
		  });
}