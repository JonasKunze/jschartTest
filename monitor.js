var barCollors = [ "151,187,205", "250,180,180", "151,205,150" ]
/**
 * Generates a summary for every PC or every SourceID by summing up the values
 * of all subdetectors
 * 
 * @param sumLevel
 *            The level in the map used for the sum. If 1 all sources will be
 *            summed (PC overview), if 2 all hosts are summed (detector
 *            overview)
 */
function getOverviewData(map, sumLevel, sourceID) {
	var activePCs = getSelections("activePCs");
	var activeSources = getSelections("activeSources");

	var datasetNames = {}; // keyset of all datasets (not array to make
	// datasets uinique)
	var sum = {};
	var sumKey = "";

	if (sumLevel == 3) {
		var datasetName = "ReceivedSubIDs";
		datasetNames[datasetName] = 1;
		for ( var host in map) {
			var subDetectorData = map[host][sourceID]
			if (subDetectorData) {
				for ( var subID in subDetectorData) {
					if (!sum[subID]) {
						sum[subID] = {};
						sum[subID][datasetName] = subDetectorData[subID];
					} else {
						sum[subID][datasetName] += subDetectorData[subID];
					}
				}
			}
		}
	} else {
		for ( var host in map) {
			if (!activePCs[host]) {
				continue;
			}
			if (sumLevel == 1 && !sum[host]) {
				sum[host] = {};
				sumKey = host;
			}
			for ( var source in map[host]) {
				if (!activeSources[source]) {
					continue;
				}
				if ((sumLevel == 2)) {
					if(!sum[source]){
						sum[source] = {};
					}
					sumKey = source;
				}
				for ( var key in map[host][source]) {
					if (!sum[sumKey][key]) {
						sum[sumKey][key] = map[host][source][key];
						datasetNames[key] = 1;
					} else {
						sum[sumKey][key] += map[host][source][key];
					}
				}
			}
		}
	}

	var chartData = {};
	chartData.labels = [];
	chartData.datasets = [];

	/*
	 * Find maximum values
	 */
	var scaleFactors = {};
	for ( var dataset in datasetNames) {
		scaleFactors[dataset] = 0;
		for ( var label in sum) {
			if (sum[label][dataset] > scaleFactors[dataset]) {
				scaleFactors[dataset] = sum[label][dataset];
			}
		}
	}
	/*
	 * Calculate scale factors for every dataset and store labels
	 */
	for ( var dataset in datasetNames) {
		scaleFactors[dataset] = scaleValue(scaleFactors[dataset]);
	}

	for ( var label in sum) {
		chartData.labels.push(label);
	}

	var datasetNum = 0;
	for ( var dataset in datasetNames) {
		var data = [];
		var scale = scaleFactors[dataset];
		for ( var label in sum) {
			data.push(sum[label][dataset] / scale['factor']);
		}

		chartData.datasets.push({
			'label' : dataset
					+ (scale['prefix'] ? ' [' + scale['prefix'] + ']' : ''),
			'data' : data,
			fillColor : "rgba(" + barCollors[datasetNum] + ",0.5)",
			strokeColor : "rgba(" + barCollors[datasetNum] + ",1)",
			pointColor : "rgba(" + barCollors[datasetNum] + ",1)",
			pointStrokeColor : "#fff",
			pointHighlightFill : "#fff",
			pointHighlightStroke : "rgba(" + barCollors[datasetNum++] + ",1)",
		});
	}

//	console.log(scaleFactors);
//	console.log(sum);
//	console.log(chartData);
//	console.log("########");
	return chartData;
}

function scaleValue(value) {
	var magnitude = 10;
	var potenz = Math.floor(Math.log(value) / Math.log(magnitude));
	var prefixList = [ "", "k", "M", "G", "T", "P" ];
	return {
		'factor' : Math.pow(magnitude, potenz),
		'prefix' : /* prefixList[potenz] */"10E" + potenz
	};
}

function updatePcList(map) {
	var activePCs = getSelections("activePCs");
	$('#activePCs').empty();

	for ( var host in map) {
		var selected = "";

		if (activePCs[host] != false) {
			selected = 'selected="selected"';
		}

		$('#activePCs').append(
				'<option ' + selected + ' value="whatever">' + host
						+ '</option>');
	}
}

function updateSourceList(map) {
	var activeSources = getSelections("activeSources");
	$('#activeSources').empty();

	var addedSources = {};
	for ( var host in map) {
		for ( var source in map[host]) {
			if (addedSources[source]) {
				continue;
			}
			addedSources[source] = true;

			var selected = "";

			if (activeSources[source] != false) {
				selected = 'selected="selected"';
			}

			$('#activeSources').append(
					'<option ' + selected + ' value="whatever">' + source
							+ '</option>');
		}
	}
}

function onActivePcChange() {

}

function getSelections(selectID) {
	var activePCs = {};
	$('#' + selectID + ' > option').each(function() {
		activePCs[$(this).text()] = this.selected;
	});

	return activePCs;
}

function drawOverviewChart(chartID, data) {
	var chartWrapper = $("#" + chartID);
	chartWrapper.html("").html(
			'<canvas id="' + chartID + '-chart" width="' + chartWrapper.width()
					+ '" height="' + chartWrapper.height() + '"></canvas>');

	var ctx = document.getElementById(chartID + "-chart").getContext("2d");

	var myLineChart = new Chart(ctx)
			.Bar(
					data,
					{
						bezierCurve : false,
						legendTemplate : '<ul class="tc-chart-js-legend"><% for (var i=0; i<datasets.length; i++){%><li><span style="background-color:<%=datasets[i].fillColor%>"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>'
					});

	myLineChart.id = chartID;
	return myLineChart;
}

function updateChart(chart, data) {
	if (chart.datasets.length != data.datasets.length) {
		console.log("redrawing chart because dataset length changed");
		return drawOverviewChart(chart.id, data);
	}

	for (set = 0; set < data.datasets.length; set++) {
		var delta = data.datasets[set].data.length
				- chart.datasets[set].bars.length;
		if (delta != 0) {
			console
					.log("redrawing chart because number of data points changed");
			return drawOverviewChart(chart.id, data);
		}
	}

	for (set = 0; set < data.datasets.length; set++) {
		for (p = 0; p < data.datasets[set].data.length; p++) {
			chart.datasets[set].bars[p].value = data.datasets[set].data[p];
		}
	}

	chart.update();

	return chart;
}

var detectorOverviewChart;
var pcOverviewChart;
var activeOverviewChart;

var unfinishedEventChart;
var selectedSourceID = -1;

function loadPcOverview() {
	$.ajax({
		url : "http://na62monitoring/farm/stats.json",
		beforeSend : function(xhr) {
			xhr.overrideMimeType("text/plain; charset=x-user-defined");
		}
	}).done(function(data) {
		var obj = jQuery.parseJSON(data);
		updatePcList(obj.DetectorData);
		updateSourceList(obj.DetectorData);

		drawUnfinishedEventChart(obj.UnfinishedEventData);

		var pcOverview = getOverviewData(obj.DetectorData, 1);

		if (pcOverview['labels'].length == 0) {
			return;
		}

		if (!pcOverviewChart) {
			pcOverviewChart = drawOverviewChart("pcOverviewChart", pcOverview);
		} else {
			pcOverviewChart = updateChart(pcOverviewChart, pcOverview);
		}
		$("#pcOverviewChartLegend").html(pcOverviewChart.generateLegend());
		activeOverviewChart = pcOverviewChart;
	});
}

function loadDetectorOverview() {
	$.ajax({
		url : "http://na62monitoring/farm/stats.json",
		beforeSend : function(xhr) {
			xhr.overrideMimeType("text/plain; charset=x-user-defined");
		}
	}).done(
			function(data) {
				var obj = jQuery.parseJSON(data);
				updatePcList(obj.DetectorData);
				updateSourceList(obj.DetectorData);

				drawUnfinishedEventChart(obj.UnfinishedEventData);

				var detectorOverview = getOverviewData(obj.DetectorData, 2);

				if (detectorOverview['labels'].length == 0) {
					return;
				}

				if (!detectorOverviewChart) {
					detectorOverviewChart = drawOverviewChart(
							"sourceOverviewChart", detectorOverview);
				} else {
					detectorOverviewChart = updateChart(detectorOverviewChart,
							detectorOverview);
				}
				$("#sourceOverviewChartLegend").html(
						detectorOverviewChart.generateLegend());
				activeOverviewChart = detectorOverviewChart;
				$('#sourceOverviewChart').click(function(evt) {
					var activeBars = detectorOverviewChart.getBarsAtEvent(evt);
					selectedSourceID = activeBars[0]['label'];
					if (!selectedSourceID && selectedSourceID != 0) {
						selectedSourceID = -1;
					} else {
						console.log("Selected sourceID " + selectedSourceID);
						loadDetectorOverview();
					}
				});
			});
}

function drawUnfinishedEventChart(subdetectorData) {
	if (selectedSourceID == -1) {
		if (unfinishedEventChart) {
			unfinishedEventChart.clear();
		}
		return;
	}

	var data = getOverviewData(subdetectorData, 3, selectedSourceID);
	if (data['labels'].length == 0) {
		return;
	}

	unfinishedEventChart = drawOverviewChart("unfinishedEventChart", data);
	if (!unfinishedEventChart) {
		unfinishedEventChart = drawOverviewChart("unfinishedEventChart", data);
		// $("#sourceOverviewChartLegend").html(
		// unfinishedEventChart.generateLegend());
	} else {
		unfinishedEventChart = updateChart(unfinishedEventChart, data);
	}
}

function loadCharts() {
	if (!$('#updateCheckbox').prop('checked')) {
		return;
	}

	if (activeOverviewChart == detectorOverviewChart) {
		loadDetectorOverview();
	}
	if (activeOverviewChart == pcOverviewChart) {
		loadPcOverview();
	}

}

function onLoad() {
	$("#subdetectorTabs").tabs();

	$('#overviewTabs').tabs({
		beforeActivate : function(event, ui) {
			var selectedTabID = ui.newPanel.attr('id');

			if (selectedTabID == "sourceOverview") {
				loadDetectorOverview();
			} else if (selectedTabID == "pcOverview") {
				loadPcOverview();
			} else {
				activeOverviewChart = {};
			}
		}
	});
	loadDetectorOverview();

	// $('#activePCs').change(onActivePcChange);
	setInterval(loadCharts, 1000);
}