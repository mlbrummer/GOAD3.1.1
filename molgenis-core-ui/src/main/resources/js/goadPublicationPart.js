/*
 * Code written in this javascript document is used to perform features of the publication part of GOAD.
 * @Author Mldubbelaar
 */


$(document).ready(function () {
	
	//-------------------------------------------------//
	//Global functions of the publication part of GOAD.//
	//-------------------------------------------------//
	
	// When clicking upon a study within the studyTable.
	$("body").on("click", ".studyTable", function(){
		$("#DownloadScatterplot").hide();
		// Creates a tooltip when hovering on the studyTable	
		$('.studyTable').tooltip(); 
	
		// The information of the given studies are obtained.
		var uniqueConditions = [];
		var studyConditions = [];
		var studyInformation = [];
		$.get("/api/v2/base_GOADstudies?q=GEOD_NR=="+$(this).attr("id")).done(function(data){
			var data = data["items"];
			// The variables studyTitle and GEODOnPage are cleared.
			var studyTitle = [];
			GEODOnPage = [];
			organismOnPage = [];
			// For each known sample the data is obtained.
			$.each(data, function(i, item){
				// The data is saved when the sample is not known yet.
				if ($.inArray(data[i]["Tissue"] + " " + data[i]["Celltype"] + " " + data[i]["Strain"] + " " + data[i]["Age"], uniqueConditions) === -1 ){
					uniqueConditions.push(data[i]["Tissue"] + " " + data[i]["Celltype"] + " " + data[i]["Strain"] + " " + data[i]["Age"]);
					// Variable sampleInfo is made to make sure that one sample is noted as option.	
					var sampleInfo = data[i]["Tissue"] + " " + data[i]["Celltype"] + " " + data[i]["Strain"] + " " + data[i]["Age"];
					// Information is pushed to the variable studyConditions.
					studyConditions.push('<option value="' + data[i]["SRA"] + '">' + capitalizeEachWord(sampleInfo.replace(/ undefined/g, "")) + '</option>');
				}
				// The code below is used to show global information like the title, author and publication year above the QE/DE part.
				// Only if the title is not yet known in studyTitle, this information is added to the variable studyInformation.
				if ($.inArray(data[i]["Title"], studyTitle)== -1) {
					studyTitle.push(data[i]["Title"]);
					studyInformation.push(
						"<b>Title:</b> " + data[i]["Title"] + "<br/>"
						+ "<b>Author:</b> " + data[i]["Author"] + "<br/>"
						+ "<b>Publication year:</b> " + data[i]["Year"]);
					// The GEOD number is pushed so it can be used for calling the R API's.
					GEODOnPage.push(data[i]["GEOD_NR"]);
					organismOnPage.push(data[i]["Organism"]);
 			}});
		// Conditions are sorted alphabetically.
		studyConditions.sort();
		// The different conditions are added into the select selectConditions.
		$("#selectConditions").html(studyConditions);
		// Global information is added into the div informationStudy.
		$("#informationStudy").html(studyInformation);
		});
		// The according showing the studies is hidden and the publicationPart with the options QE and DE is shown.
		$("#accordion").hide();
		$(".row.DE").hide();
		$("#publicationPart").show();
	});

	//---------------------------------------------//
	//DE functions of the publication part of GOAD.//
	//---------------------------------------------//

	//When clicking upon the DE button.
	$("body").on("click", ".DEbutton", function(){
		// QE content that might be visible is hidden.
		$("#analysis_info").hide();
		$("#QE_content").hide();
		$("#searchBar_QE").hide();
		$("#submitQEbutton").hide();
		// The select2 bar is shown.
		$("#s2id_selectConditions").show();
		$("#selectBar").show();
		// Makes sure that there are two conditions chosen within the select bar.
		if ($('#selectConditions option').size() !== 1) {
			$("#selectBar").toggle();
			$("#selectConditions").select2({
				placeholder: "Select two conditions",
				maximumSelectionSize:2,
				allowClear: true
			});
		} else {
		//An error is raised when none or one condition is chosen.
			$("#selectBarMessage").show();
		}
		hideQE();
		$("#s2id_selectConditions").show();
		$("#selectBar").show();
	});

	$("body").on("click", "#submitDEbutton", function(){
		// The table-scroll is emptied when clicking the DE submit button
		// and the for-control is reset.
		// The modal that holds the loading bar is hidden.
		$('#loaderModal').modal('show');
		$("#NoDEGMessage").hide();
		$("#firstCondition").remove();
		$(".table-scroll").empty();
		$(".form-control").trigger("reset");
		$("#DETable").empty();
		$("#DEcontent").hide();
		$("#searchBar_DE").hide();
		$("#DETableContent").hide();
		$("#scatterplot").empty();
		$(".row.DE").hide();
		$("#DownloadScatterplot").hide();
		
		// When there are two conditions chosen the API for the scatterplot and the DE table is called.
		var count = $("#selectConditions :selected").length;
		var firstCondition = "";
		
		if (count === 2) {
			var tableContent = [];
			// The following attribute is changed for the loading bar shown during the analysis.
			$("#progressLoading").attr('aria-valuenow', 10).css('width',"10%");
			$.get("/api/v2/base_"+GEODOnPage[0].replace(/-/g,'')+"Targets?q=SRA=="+$("#selectConditions").val()[1]).done(
					function(data){ 
						var data = data["items"];
						firstCondition = data[0]["Description"];
//						$(".row.DE").append("<div id='firstCondition' class='col-md-6 text-center DE'><b>"+ data[0]["Description"].replace(/-|_/g,' ') + "</b></div>")
//						$("<div id='firstCondition' DE'><b>"+ data[0]["Description"].replace(/-|_/g,' ') + "</b></div>").append("#scatterplot")

					});
	
			if ($( window ).width() < "768" ) {
				$( "<div class='text-center'>Please perform the analysis on a bigger screen to obtain the scatterplot</div><br/><br/>" ).appendTo( "#scatterplot" );
			} else {
				$.get("/scripts/DEScatterPlot/run?entityName=base_"+GEODOnPage[0].replace(/-/g,'')+"&condition1="+$("#selectConditions").val()[0]+"&condition2="+$("#selectConditions").val()[1]+"&targetFile=base_"+GEODOnPage[0].replace(/-/g,'')+"Targets&organism="+organismOnPage[0].replace(/ /g, "+")).done(
					function(data){
						// The necessary information from the scatterD3 plot is obtained
			   			var regexData = /(\<div id="htmlwidget_container"\>\n[A-z0-9 \n\<\=\"\-\:\;\>\/\!\.]+)\<script type="application\/json" data-for="htmlwidget.+\>(\{.+\})/g;
						match = regexData.exec(data);
						if (match !== null) {
							var obj = JSON.parse(match[2]);	
							// The necessary information for the scatterplot is written to the div scatterplot.
							$("#scatterplot").html(match[1]);
							// The render function creates the interactive scatterplot.
							render('#scatterplot', obj.x);
							// The extra div that is created by the render function is removed.
							$('div[id^="htmlwidget"]').remove()
							// The column name which is used for the legend is replaced by 'p-value'.
							$('text.color-legend-label').text('FDR P-value')
							$("<div id='firstCondition' class='col-md-10 text-center DE text-center'><b>"+ firstCondition.replace(/-|_/g,' ') + "</b></div>").appendTo("#scatterplot")
							$("#DownloadScatterplot").show();
							// The following attribute is changed for the loading bar shown during the analysis.
							$("#progressLoading").attr('aria-valuenow', 100).css('width',"100%");
							// The modal that holds the loading bar is hidden.
							$('#loaderModal').modal('hide');
						} else {
							$("<div>There where not enough differentially expressed genes found to generate the scatterplot.</div>").appendTo("#scatterplot")
						}
					})
			}

			$.get("/scripts/DEtable/run?entityName=base_"+GEODOnPage[0].replace(/-/g,'')+"&condition1="+$("#selectConditions").val()[0]+"&condition2="+$("#selectConditions").val()[1]+"&targetFile=base_"+GEODOnPage[0].replace(/-/g,'')+"Targets&organism="+organismOnPage[0].replace(/ /g, "+")).done(
					function(data){
						if (data.startsWith('Login success[1] "No differentially expressed genes where found')) {
							$("#NoDEGMessage").show();
						} else {
							// The DE table is added to the div DETable.
							$("#DETable").append(
									'<table id="countTable" class="table table-striped table-hover table-condensed table-responsive header-fixed sortable">' +
										'<thead><tr><th>Genesymbol</th><th>LogFC</th><th>FDR</th></tr></thead>' +
										'<tbody id="DEcontent" class="searchable"></tbody>' +
									'</table>');
							// The data information obtained from the API is splitted by new lines and spaces.
							var stringArray = data.split(/[ ,\n"]+/);
							// Starting from the 5th element the data is saved into the variable tableContent.
							tableContent = stringArray.slice(4,stringArray.length)
							var counter = 0;
							var stringToAppend = '';
							// For each element within the variable tableContent
							$.each(tableContent, function(i, content){
								if (counter ===0){
									// The beginning of the row for the table is made starting with the first element.
									stringToAppend += '<tr><td>'+content+'</td>';
									counter += 1;
								} else if (counter < 2){
									// Adding elements. 
									stringToAppend += '<td>'+content+'</td>';
									counter += 1;
								} else {
									// The last element end to row and appends the information to the div DEcontent.
									stringToAppend += '<td>'+parseFloat(content).toFixed(7)+'</td></tr>';
									$('#DEcontent').append(stringToAppend);
									stringToAppend = '';
									counter = 0;
								};

							});
							// Shows all of the necessary content used for the DE analysis.
							$("#DETable").show();
							$("#DEcontent").show();
							$("#searchBar_DE").show()
							$("#DETableContent").show();
							$("#scatterplot").show();
							$(".row.DE").show();
							//$("#DownloadScatterplotButton").show();
							searchBar("#DEsearch");	
							// The following attribute is changed for the loading bar shown during the analysis.
							$("#progressLoading").attr('aria-valuenow', 60).css('width',"60%");
				}
				});
			//if ($("#scatterplot").html() === "") {
				//	$("<div>There where not enough differentially expressed genes found to generate the scatterplot.</div>").appendTo("#scatterplot")
				//}
				
			} else {
				// An error is given when there is only one condition to choose from.
				$("#errorLengthForSubmit").show();
				$('#errorLengthForSubmit').delay(3000).fadeOut('slow');
			}
//		$("#progressLoading").attr('aria-valuenow', 100).css('width',"100%");
//		if ($("#progressLoading").attr('aria-valuenow') === "100") {
//			$('#loaderModal').modal('hide');
//		}
//		$('#loaderModal').modal('hide');
		});
	
	//---------------------------------------------//
	//QE functions of the publication part of GOAD.//
	//---------------------------------------------//
	
	// When clicking upon the submit QE button
	$("body").on("click", ".QEbutton", function(){
		// The table-scroll is emptied when clicking the DE submit button
		// and the for-control is reset.
		$(".table-scroll").empty();
		$(".form-control").trigger("reset");
		var attrNames = [];
		var availableGenes = [];
		// Creating a table that is shown on the website.
		var tableContent = '<table id=tpmTable" class="table table-striped table-hover table-condensed table-responsive header-fixed"><thead><tr>';
//		http://localhost:8080/api/v2/TPM_EGEOD000000?start=10001&num=10000
		var firstGenes = $.get("/api/v2/base_TPM"+GEODOnPage[0].replace(/-/g,'')+"?start=1&num=10000");
		var secondGenes = $.get("/api/v2/base_TPM"+GEODOnPage[0].replace(/-/g,'')+"?start=10001&num=10000");
		var thirdGenes = $.get("/api/v2/base_TPM"+GEODOnPage[0].replace(/-/g,'')+"?start=20001&num=10000");
		$.merge(firstGenes, secondGenes, thirdGenes).done(function(data){
		//$.get("/api/v2/base_TPM"+GEODOnPage[0].replace(/-/g,'')+"?start=1&num=10000").done(function(data){
			// Attributes from the meta data is obtained to determine the different cell types that are known.
			var attr = data.meta["attributes"];
			var data = data["items"];
			//$("#hiddenQEtext").append("\"");
			$.each(attr, function(t, types){
				// The name of the cell type is obtained.
				if (attr[t]["name"] == "External Gene Name") {}
				if(!(attr[t]["name"].endsWith("low") || attr[t]["name"].endsWith("high") || attr[t]["name"].endsWith("percentile"))){
					attrNames.push(attr[t]["name"]);
					if (attr[t]["name"].length < 4){
						// Cell types with a length of 4 are seen as an abbreviation and therefore written in uppercase.
						tableContent += '<th>'+ attr[t]["name"].replace(/_/g, " ").toUpperCase()+'</th>';
						$("#hiddenQEtext").append(attr[t]["name"].toUpperCase()+",");
					} else {
						// The rest of the cell type names are capitalized.
						tableContent += '<th>'+ capitalizeEachWord(attr[t]["name"].replace(/_/g, " "))+'</th>';
						$("#hiddenQEtext").append(capitalizeEachWord(attr[t]["name"])+ ",");
					}
				}
			 });
			// The rest of the header of the table is added together with the body.
			$("#hiddenQEtext").append("\ ");
			tableContent += '</tr></thead><tbody id="tpmContent" class="table searchable"></tbody></table>'
			// This information is added into the div with the id "QETable"
			$("#QETable").append(tableContent);
			
			var stringToAppend = '';
			$.each(data, function(i, content){
				if (i === 0) {
					// The line below is used to create a bargraph of the first found gene on the website (bar graph part).
					obtainTPMofGenes(GEODOnPage[0].replace(/-/g,''), content["external_gene_name"])
				}
				// These genes are saved into the array availableGenes, where it can be used with the search function.
				availableGenes.push(content["external_gene_name"]);
				// For each cell type name.
				$.each(attrNames, function(n, names){
					if (n === 0) {
						// The name of the cell type is added as the first column and identifier of the row.
						stringToAppend += '<tr class="TpmVals" id="'+ data[i][names] +'"><td><b>' + data[i][names] + '</b></td>';
						$("#hiddenQEtext").append(data[i][names]+",");
					} else if (n === attrNames.length - 1) {
						// The last item is added and the row is closed.
						$("#hiddenQEtext").append(parseFloat(data[i][names]).toFixed(3)+"\ ");
						stringToAppend += '<td>' + parseFloat(data[i][names]).toFixed(3) + '</td></tr>';
						// Information is added onto the div with id "tpmContent".
						$('#tpmContent').append(stringToAppend);
						// The string is emptied again.
						stringToAppend = '';
					} else {
						// All items in between the first and last column are added.
						$("#hiddenQEtext").append(parseFloat(data[i][names]).toFixed(3)+",");
						stringToAppend += '<td>'+ parseFloat(data[i][names]).toFixed(3) +'</td>';
					}
				});
			});
			// The autocomplete function of the searchbar for both the bar graph as the table is defined.
			$(".genelist").autocomplete({
				minLength:2,   
               	delay:0,
				source: availableGenes, 
				});
			// Shows all of the necessary content used for the QE analysis.
			$("#selectBar").hide();
			$("#analysis_info").hide();
			$("#DETableContent").hide();
			$("#firstCondition").hide();
			$("#QETable").show();
			$("#QE_content").show();
			$("#searchBar_QE").show();
			$("#QEsearch").show();
			$(".row.DE").show();
			$("#DownloadQE").show();
			$("#selectBarQE").show();
			searchBar("#QEsearch");
			});
		hideDE();
	});

	// When clicking on a gene within the TPM matrix, the corresponding bargraph of the gene is displayed.
	$("body").on("click", ".TpmVals", function(){
		// The TPM values are obtained when a gene is clicked within the TPM matrix.
		// In the end showing the interactive bargraph of the gene.
		obtainTPMofGenes(GEODOnPage[0].replace(/-/g,''), $(this).attr("id"));
		});

	$("body").on("click", "#searchGeneBarGraph", function(){
		// The right gene annotation is used when selecting either mouse or human with the gene searchbar.
		// This annotation is used to obtain the gene.
		if (organismOnPage[0] === "Homo sapiens") {
			obtainTPMofGenes(GEODOnPage[0].replace(/-/g,''), $("#geneBarGraph").val().toUpperCase());
		} else if (organismOnPage[0] === "Mus musculus") {
			obtainTPMofGenes(GEODOnPage[0].replace(/-/g,''), capitalizeEachWord($("#geneBarGraph").val()));
		}
	});

	// The function searchbar enables the search function within the datatable layout.
	// It is an interactive way of filtering that checks the search term while typing.
	$("body").on("click", "#searchGeneTable", function(){
		// The pattern given in the search bar is used to match the beginning of genes 
		var rex = new ("^"+$("#geneTableQE").val(), 'i');
		// All of the content within the table is hidden
		$('.searchable tr').hide();
		// Genes that match the regex pattern are shown
		$('.searchable tr').filter(function () {
			return rex.test($(this).text());
		}).show();

	});
	
});