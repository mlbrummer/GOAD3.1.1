/*
 * Code written in this javascript document is a modification from the following code: http://bl.ocks.org/NPashaP/96447623ef4d342ee09b
 * @Author Mldubbelaar
 */
 
function dashboard(id, fData){
    var barColor = '#002080';
    function segColor(c){ return {"TPM High":"#0080ff", "TPM Low":"#999999","TPM":"#ffcc00"}[c]; }
    
    // compute total values that can be seen without hovering over the pie chart
    fData.forEach(function(d){d.total=d.TPMvals.TPM;});
    
    // function to handle histogram.
    function histoGram(fD){
    	// Adjusting 'b' will make sure that you have more space with the labels
        var hG={},    hGDim = {t: 60, r: 0, b: 85, l: 0};
        hGDim.w = 700 - hGDim.l - hGDim.r, 
        hGDim.h = 200 - hGDim.t - hGDim.b;
            
        var tip = d3.tip()
		  .attr('class', 'd3-tip')
		  .offset([-10, 0])
		  .html(function(d) {
		    return "<strong>TPM value : </strong>" + d[1]
		  });

        //create svg for histogram.
        var hGsvg = d3.select(id).append("svg")
            .attr("width", hGDim.w + hGDim.l + hGDim.r)
            .attr("height", hGDim.h + hGDim.t + hGDim.b).append("g")
            .attr("transform", "translate(" + hGDim.l + "," + hGDim.t + ")");

        hGsvg.call(tip);

        // create function for x-axis mapping.
        var x = d3.scale.ordinal().rangeRoundBands([0, hGDim.w], 0.1)
                .domain(fD.map(function(d) { return d[0]; }));

        // Add x-axis to the histogram svg.
        hGsvg.append("g").attr("class", "x axis")
        .attr("transform", "translate(0," + hGDim.h + ")")
//        .attr("transform", "rotate(-45 150,20)")
//        .call(d3.svg.axis().scale(x).orient("bottom"))
        .call(d3.svg.axis().scale(x))
        .selectAll("text")
//        .call(wrap, d3.scale.ordinal().rangeRoundBands([0, hGDim.w], 0.1))
        .call(wrap, 70)
//        .attr("y", 10)
//        .attr("x", 2)
//        .attr("dy", ".35em")
        .attr("transform", "rotate(45)")
        .style("font-size", "16px")
        .style("text-anchor", "start");

        // Create function for y-axis map.
        var y = d3.scale.linear().range([hGDim.h, 0])
                .domain([0, d3.max(fD, function(d) { return d[1]; })]);

        // Create bars for histogram to contain rectangles and freq labels.
        var bars = hGsvg.selectAll(".bar").data(fD).enter()
                .append("g").attr("class", "bar");
        
        //create the rectangles.
        bars.append("rect")
            // .attr("x", function(d) { return x(d[0]); })
            .attr("x", function(d) { return x(d[0]) + (x.rangeBand() - d3.min([x.rangeBand(), 100]))/2; })
            .attr("y", function(d) { return y(d[1]); })
            // .attr("width", x.rangeBand())
            .attr("width", d3.min([x.rangeBand(), 100]))
            .attr("height", function(d) { return hGDim.h - y(d[1]); })
            .style('fill',barColor)
            .on("mouseover",tip.show)
            .on("mouseout",tip.hide)

           	// .attr("width", d3.min([x1.rangeBand(), 100]))
	    	// .attr("x", function(d) { return x1(d.name) + (x1.rangeBand() - d3.min([x1.rangeBand(), 100]))/2; })
            
        //Create the frequency labels above the rectangles.
        bars.append("text").text(function(d){return parseFloat(d3.format(",")(d[1])).toFixed(2)})
            .attr("x", function(d) { return x(d[0])+x.rangeBand()/2; })
            .attr("y", function(d) { return y(d[1])-5; })
            .attr("text-anchor", "Middle");
        
        function mouseover(d){  // utility function to be called on mouseover.
            // filter for selected Gene.
            var st = fData.filter(function(s){ return s.Gene == d[0];})[0],
                nD = d3.keys(st.TPMvals).map(function(s){ return {type:s, TPMvals:st.TPMvals[s]};});
        }
        
        // create function to update the bars. This will be used by pie-chart.
        hG.update = function(nD, color){
            // update the domain of the y-axis map to reflect change in frequencies.
            y.domain([0, d3.max(nD, function(d) {return d[1]; })]);
            
            // Attach the new data to the bars.
            var bars = hGsvg.selectAll(".bar").data(nD);
            
            // transition the height and color of rectangles.
            bars.select("rect").transition().duration(500)
                .attr("y", function(d) {return y(d[1]); })
                .attr("height", function(d) { return hGDim.h - y(d[1]); })
                .style("fill", color);

            // transition the frequency labels location and change value.
            bars.select("text").transition().duration(500)
                .text(function(d){ return parseFloat(d3.format(",")(d[1])).toFixed(2)})
                .attr("y", function(d) {return y(d[1])-5; });            
        }        
        return hG;
    }
    
    // function to handle pieChart.
    function pieChart(pD){
        var pC ={},    pieDim ={w:250, h: 250};
        pieDim.r = Math.min(pieDim.w, pieDim.h) / 2;
                
        // create svg for pie chart.
        var piesvg = d3.select(id).append("svg")
            .attr("width", pieDim.w).attr("height", pieDim.h).append("g")
            .attr("transform", "translate("+pieDim.w/2+","+pieDim.h/2+")");
        
        // create function to draw the arcs of the pie slices.
        var arc = d3.svg.arc().outerRadius(pieDim.r - 10).innerRadius(0);

        // create a function to compute the pie slice angles.
        var pie = d3.layout.pie().sort(null).value(function(d) { return d.TPMvals; });

        // Draw the pie slices.
        piesvg.selectAll("path").data(pie(pD)).enter().append("path").attr("d", arc)
            .each(function(d) { this._current = d; })
            .style("fill", function(d) { return segColor(d.data.type); })
            .on("mouseover",mouseover).on("mouseout",mouseout);
    
        // Utility function to be called on mouseover a pie slice.
        function mouseover(d){
            // call the update function of histogram with new data.
            hG.update(fData.map(function(v){ 
            	return [v.Gene, v.TPMvals[d.data.type]];}),segColor(d.data.type));
        }
        //Utility function to be called on mouseout a pie slice.
        function mouseout(d){
            // call the update function of histogram with all data.
            hG.update(fData.map(function(v){
                return [v.Gene,v.total];}), barColor);
        }
        // Animating the pie-slice requiring a custom function which specifies
        // how the intermediate paths should be drawn.
        function arcTween(a) {
            var i = d3.interpolate(this._current, a);
            this._current = i(0);
            return function(t) { return arc(i(t));    };
        }    
        return pC;
    }
    
    // function to handle legend.
    function legend(lD){
        // var leg = {};
            
        // create table for legend.
        var legend = d3.select(id).append("table").attr('class','legend');
        
        // create one row per segment.
        var tr = legend.append("tbody").selectAll("tr").data(lD).enter().append("tr");
            
        // create the first column for each segment.
        tr.append("td").append("svg").attr("width", '16').attr("height", '16').append("rect")
            .attr("width", '16').attr("height", '16')
			.style("fill",function(d){ return segColor(d.type); });
            
        // create the second column for each segment.
        tr.append("td").text(function(d){ return d.type;});

    }
    
    // calculate total frequency by segment for all Gene.
    var tF = ["TPM High","TPM Low","TPM"].map(function(d){ 
        return {type:d, TPMvals: d3.sum(fData.map(function(t){ return t.TPMvals[d];}))}; 
    });    
    
    // calculate total frequency by Gene for all segment.
    var sF = fData.map(function(d){return [d.Gene,d.total];});

    var hG = histoGram(sF), // create the histogram.
        pC = pieChart(tF), // create the pie-chart.
        leg= legend(tF);  // create the legend.
}

//https://bl.ocks.org/mbostock/7555321
function wrap(text, width) {
	  text.each(function() {
	    var text = d3.select(this),
	        words = text.text().split(/\s+/).reverse(),
	        word,
	        line = [],
	        lineNumber = 0,
	        lineHeight = 1.1, // ems
	        y = text.attr("y"),
	        dy = parseFloat(text.attr("dy")),
	        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
	    while (word = words.pop()) {
	      line.push(word);
	      tspan.text(line.join(" "));
	      if (tspan.node().getComputedTextLength() > width) {
	        line.pop();
	        tspan.text(line.join(" "));
	        line = [word];
	        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
	      }
	    }
	  });
}