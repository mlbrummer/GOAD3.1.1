/*
 * Code written in this javascript document contains the functions that were used on GOAD
 * @Author Mldubbelaar
 */

// The function searchbar enables the search function within the datatable layout.
// It is an interactive way of filtering that checks the search term while typing.
function searchBar(inputName){
	$(inputName).keyup(function () {
    var rex = new RegExp($(this).val(), 'i');
	// All of the content within the table is hidden
	$('.searchable tr').hide();
	// Genes that match the regex pattern are shown
    $('.searchable tr').filter(function () {
        return rex.test($(this).text());
    }).show();
});
}

// The function downloaInnerHtml enables to download the content within a div
// The spaces are changed into the enters.
function downloadInnerHtml(filename, elId, mimeType) {
    var elHtml = document.getElementById(elId).innerHTML;
    elHtml = elHtml.split(' ').join('\r\n');    
    var link = document.createElement('a');
    mimeType = mimeType || 'text/plain';

    link.setAttribute('download', filename);
    link.setAttribute('href', 'data:' + mimeType + ';charset=utf-8,' + encodeURIComponent(elHtml));
    link.click(); 
}

// Returns all of the studies.
function returnStudies(){
	// All of the known studies are obtained. 
	$.get("/api/v2/base_GOADstudies?attrs=Unique_ID,GEOD_NR,Title,Author,Organism,Year,Research_link&num=10000").done(function(data){
		var data = data["items"];
		var tdstart = "<td>";
		var tdend = "</td>";
		uniqueTitle = [];
		uniqueStudies = [];
		// Each of the known studies is added into the variable uniqueStudies.
		$.each(data, function(i, item){
			if ($.inArray(data[i]["Title"], uniqueTitle)== -1) {
				uniqueTitle.push(data[i]["Title"]);
				uniqueStudies.push(
					"<tr class='studyTable' id='" + data[i]["GEOD_NR"] + "' >" 
					+ tdstart + data[i]["Title"] + tdend
					+ tdstart + data[i]["Author"] + tdend 
					+ tdstart + data[i]["Organism"] + tdend 
					+ tdstart + data[i]["Year"] + tdend 
					+ "</tr>" );
	 			}
			});
		// These studies are sorted alphabetically on the GEOD number.
		uniqueStudies.sort()
		// Studies are joined with <br/> and written into the div tableContent.
		$("#tableContent").html(uniqueStudies.join("<br/>"));
	});
	// The refresh button is hidden again.
	$("#refreshPublications").hide();
}

// This function is the main caller when the user goes back to the 'home layout'.
// Everything is resetted to the normal state, processes related to the analyses are stopped
function returnHome(){
	// The website is returned to the normal state when the returnHome function is called
	$("#accordion").show();
	$(function() {
	  $('#selectConditions').select2('data', null)
	})
	hideDE();
	hideQE();
	// Making sure that the following components are hidden or emptied.
	$(".alert-danger").hide();
	$("#materialInfo").hide();
	$("#publicationPart").hide();
	$("#contactInfo").hide();
	$("#genePart").hide();
	$("#DownloadQETable").hide();
	$("#noQEFound").remove();
	if ($("#refreshPublications").is(":visible") == true) {
		returnStudies();
		$("#refreshPublications").hide();
	} else {
		$("#refreshPublications").hide();
	}
//	$("#refreshPublications").hide();
	$("#dashboard").empty().hide();
	$("#TPMdiv").empty();
	// $("#DEdownloadButtons").hide();
	// If searchedCondition checks if the user used a sort on the tables.
	// If yes, the class added to sort is removed.
	if (searchedCondition === true) {
		obtainStudies();
		$("#publicationCard th").removeClass("sorttable_sorted");
		$("#publicationCard th").removeClass("sorttable_sorted_reverse");
	}
}

// The function obtainStudies obtains the studies from the database in MOLGENIS and presents it on the GOAD homepage.
function obtainStudies() {
	// The studies known in the studies database are collected
	$.get("/api/v2/base_GOADstudies?attrs=Unique_ID,GEOD_NR,Title,Author,Organism,Year,Research_link&num=10000").done(function(data){
		// The items within the data are collected and saved as variable data.
		var data = data["items"];
		var tdstart = "<td>";
		var tdend = "</td>";
		// For each element in the variable data
		$.each(data, function(i, item){
			// If the title is unknown in the variable uniqueTitle
			if ($.inArray(data[i]["Title"], uniqueTitle)== -1) {
				// The title of the given study is pushed to the variable uniqueTitle
				uniqueTitle.push(data[i]["Title"]);
				// The EGEOD number of the given study is pushed to the variable uniqueGEOD
				uniqueGEOD.push(data[i]["GEOD_NR"]);
				// Information like the GEOD number, title, author, organism and year are pushed to the
				// variable uniqueStudies in the form of a row of a table.
				uniqueStudies.push(
					"<tr class='studyTable' id='" + data[i]["GEOD_NR"] + "' >" 
					+ tdstart + data[i]["Title"] + tdend
					+ tdstart + data[i]["Author"] + tdend 
					+ tdstart + data[i]["Organism"] + tdend 
					+ tdstart + data[i]["Year"] + tdend 
					+ "</tr>" );
	 			}
			});
		// The uniqueStudies are sorted, leading to a table where the studies are sorted on the GEOD number.
		uniqueStudies.sort()
		// The sorted table is joined with <br/> and added to the div tableContent.
		$("#tableContent").html(uniqueStudies.join("<br/>"));
	});
}

// The function capitalizeEachWord is used to capitalize each word within the text.
function capitalizeEachWord(str) {
	// Each word ending with a space is used within the function.
	// This function makes sure that each word within the string is capitalized.
    return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

// hideDE hides all of the DE content on GOAD.
function hideDE(){
	// DE data is hidden.
	$("#selectBar").hide();
	$("#selectConditions").hide();
	$("#scatterplot").hide();
	$("#searchBar_DE").hide();
	$("#DETable").hide();
	$("#DownloadScatterplotButton").hide();
}

//hideQE hides all of the QE content on GOAD.
function hideQE(){
	// QE data is hidden.
	$("#QEsearch").hide();
	$("#QETable").hide();
	$("#QE_content").hide();
}

// obtainTPMofGenes obtaines all of the TPM values of a given study.
// It also enables the creation of the bargraph shown on the same page.
function obtainTPMofGenes(study, genes) {
	// This function is used to preprocess the data for the creation of the bar graph.
	var dict = {};
	// The gene is searched within the given study.
	$.get("/api/v2/base_TPM" + study + "?q=external_gene_name==" + genes).done(function(data){
		// The div with id "TPMdiv" is empied.
		$('#TPMdiv').empty();
		// The attributes are obtained from the meta data and the items are obtained.
		var attr = data.meta["attributes"];
		var data = data["items"];
		$.each(data, function(i, content){
			$.each(attr, function(t, types){
				if (t === 0) {
					// The gene name is obtained and written into the div with id "TPMdiv"
					$("#TPMdiv").html("<div id='geneName' class='row'><div class='col-md-6'><h2>"+data[i][attr[t]["name"]]+"</h2></div><div class='col-md-6 text-right' style='font-size:16px;margin-top: 40px;width:"+ $( ".jumbotron" ).width() +"'>Percentile</div></div>")
						if ($( window ).width() > "767" ) {
							$("#TPMdiv").html("<br/><br/><br/><div id='geneName' class='row'><div class='col-md-6 text-left'><h2>"+data[i][attr[t]["name"]]+"</h2></div><div class='col-md-6 text-right' style='font-size:16px;margin-top: 40px;width:"+ $( ".jumbotron" ).width() +"'>Percentile</div></div>")
						} else {
							$("#TPMdiv").html("<br/><br/><br/><div id='geneName' class='row'><div class='col-md-6 text-left'><h2>"+data[i][attr[t]["name"]]+"</h2></div></div>")

						}
					} else if (t % 4 === 1 && t !== 0) {
					// The cell type is obtained.
					if (attr[t]["name"].length > 4){
						// Cell type names with a length > 4 are capitalized.
						dict["Gene"] = capitalizeEachWord(attr[t]["name"].replace(/_/g, " "))
					} else {
						// Cell type names with a length < 4 are seen as an abbreviation and therefore written in uppercase.
						dict["Gene"] = attr[t]["name"].replace(/_/g, " ").toUpperCase()
					}
					// The 'normal' TPM value is added into the dict 'dict'.
					dict["TPM"] = data[i][attr[t]["name"]]
				} else if (t % 4 === 2 && t !== 0) {
					// Information on position 2 when performing t % 4 are saved as the low TPM values.
					dict["Low_TPM"] = data[i][attr[t]["name"]]
				} else if (t % 4 === 3 && t !== 0) {
					// Information on position 3 when performing t % 4 are saved as the high TPM values.
					dict["High_TPM"] = data[i][attr[t]["name"]]
				} else if (t % 4 === 0 && t != 0) {
					// Information on position 0 when performing t % 4 are saved as the percentiles.
					dict["Percentile"] = data[i][attr[t]["name"]]
					// All of the information is pushed to the array bargraphData
					bargraphData.push(dict)
					// The dict 'dict' is empied when in the end.
					if (t !== attr.length) {
						dict = {};
					} 
				}
			});
		});
		// The function createBarGraph is called to create the bargraph
		createBarGraph();
		$("g.tick").css("font-size", "16px")
		// The tab with the bargraph is opened when the bargraph is made.
		$('#QE_tabs a[href="#barGraph"]').tab('show')
		$("#DownloadQETable").show();
		// Emptying the array bargraphData in the end. 
		bargraphData = [];
		});
}


// The function render is a function from scatterD3.js
// It contains some small adjustments to work on the GOAD website.
function render(el, obj) {
	//var width = 600;
	//var height = 400;
	var width = $( "#scatterplot" ).width();
	var height = $( "#scatterplot" ).height();
	if (width < 0) width = 0;
    if (height < 0) height = 0;
    // Create root svg element
    var svg = d3.select(el).append("svg");
    svg
    .attr("width", width)
    .attr("height", height)
    .attr("class", "scatterD3")
    .append("style")
    .text(".scatterD3 {font: 10px sans-serif;}" +
    ".scatterD3 .axis line, .axis path { stroke: #000; fill: none; shape-rendering: CrispEdges;} " +
    ".scatterD3 .axis .tick line { stroke: #ddd;} " +
    ".scatterD3 .axis text { fill: #000; } " +
    ".scatterD3 .zeroline { stroke-width: 1; stroke: #444; stroke-dasharray: 5,5;} ");

    // Create tooltip content div
    var tooltip = d3.select(".scatterD3-tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body")
        .append("div")
        .style("visibility", "hidden")
        .attr("class", "scatterD3-tooltip");
    }

    // Create scatterD3 instance
    scatter = scatterD3().width(width).height(height).svg(svg);
	
    // Check if update or redraw
    var first_draw = (Object.keys(scatter.settings()).length === 0);
    var redraw = first_draw || !obj.settings.transitions;
    var svg = d3.select(el).select("svg").attr("id", "scatterD3-svg-" + obj.settings.html_id);
    scatter = scatter.svg(svg);

    // convert data to d3 format
    data = HTMLWidgets.dataframeToD3(obj.data);

    // If no transitions, remove chart and redraw it
    if (!obj.settings.transitions) {
        svg.selectAll("*:not(style)").remove();
    }

    // Complete draw
    if (redraw) {
        scatter = scatter.data(data, redraw);
        obj.settings.redraw = true;
        scatter = scatter.settings(obj.settings);
        // add controls handlers and global listeners for shiny apps
        scatter.add_controls_handlers();
        scatter.add_global_listeners();
        // draw chart
        d3.select(el)
          .call(scatter);
    }
    // Update only
    else {
        // Check what did change
        obj.settings.has_legend_changed = scatter.settings().has_legend != obj.settings.has_legend;
        obj.settings.has_labels_changed = scatter.settings().has_labels != obj.settings.has_labels;
        obj.settings.size_range_changed = scatter.settings().size_range != obj.settings.size_range;
        obj.settings.ellipses_changed = scatter.settings().ellipses != obj.settings.ellipses;
        function changed(varname) {
            return obj.settings.hashes[varname] != scatter.settings().hashes[varname];
        };
        obj.settings.x_changed = changed("x");
        obj.settings.y_changed = changed("y");
        obj.settings.lab_changed = changed("lab");
        obj.settings.legend_changed = changed("col_var") || changed("symbol_var") ||
                                      changed("size_var") || obj.settings.size_range_changed;
        obj.settings.data_changed = obj.settings.x_changed || obj.settings.y_changed ||
                                    obj.settings.lab_changed || obj.settings.legend_changed ||
                                    obj.settings.has_labels_changed || changed("ellipses_data") ||
                                    obj.settings.ellipses_changed;
        obj.settings.opacity_changed = changed("point_opacity");
        obj.settings.subset_changed = changed("key_var");
        scatter = scatter.settings(obj.settings);
        // Update data only if needed
        if (obj.settings.data_changed) scatter = scatter.data(data, redraw);
    }
}