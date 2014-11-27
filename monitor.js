/**
 * Generates a summary for every subdetector by summing up the values of all PCs
 */
function getDetectorOverview(map) {
	console.log(map);
	
	var activePCs = getActivePCs();

	var data = {};
	data.labels = [];
	data.datasets = [];

	var numberOfDatasets = 0;

	var knownSources = {};
	var knownDatasets = {};
	for ( var host in map) {
		// if ($.inArray(host, activePCs) < 0) {
		// continue;
		// }
		var sourceNum = 0;
		for ( var source in map[host]) {
			if (!knownSources[source]) {
				data.labels.push(source);
				knownSources[source] = {};
			}
			for ( var key in map[host][source]) {
				if (!knownDatasets[key]) {
					knownDatasets[key] = numberOfDatasets++;

					data.datasets.push({
						'label' : key,
						'data' : []
					});
				}
				// sum[source][key] += map[host][source][key];

				var datasetID = knownDatasets[key];
				if (!data.datasets[datasetID].data[sourceNum]) {
					data.datasets[datasetID].data[sourceNum] = map[host][source][key];
				} else {
					data.datasets[datasetID].data[sourceNum] += map[host][source][key];
				}
			}
			sourceNum++;
		}
	}
	return data;
}
/**
 * Generates a summary for every PC by summing up the values of all subdetectors
 */
function getPcOverview(map) {
	var activePCs = getActivePCs();

	var data = {};
	data.labels = [];
	data.datasets = [];

	var numberOfDatasets = 0;

	var knownHosts = {};
	var knownDatasets = {};

	var hostNum = 0;
	for ( var host in map) {
		if (!knownHosts[host]) {
			data.labels.push(host);
			knownHosts[host] = {};
		}

		// if ($.inArray(host, activePCs) < 0) {
		// continue;
		// }
		for ( var source in map[host]) {
			for ( var key in map[host][source]) {
				if (!knownDatasets[key]) {
					knownDatasets[key] = numberOfDatasets++;

					data.datasets.push({
						'label' : key,
						'data' : []
					});
				}
				// sum[source][key] += map[host][source][key];

				var datasetID = knownDatasets[key];
				if (!data.datasets[datasetID].data[hostNum]) {
					data.datasets[datasetID].data[hostNum] = 0;
				} else {
					data.datasets[datasetID].data[hostNum] += map[host][source][key];
				}
			}
			hostNum++;
		}
	}
	return data;
}

function updatePcList(map) {
	var activePCs = getActivePCs();
	$('#activePCs').empty();

	for ( var host in map) {
		var selected = "";

		if ($.inArray(host, activePCs) > -1) {
			selected = 'selected="selected"';
		}

		$('#activePCs').append(
				'<option ' + selected + ' value="whatever">' + host
						+ '</option>');
	}
}

function onActivePcChange() {

}

function getActivePCs() {
	var activePCs = [];
	$('#activePCs :selected').each(function(i, selected) {
		activePCs[i] = $(selected).text();
	});
	return activePCs;
}

function drawOverviewChart(chartID, data) {
	var test = {
		labels : [],
		datasets : [ {
			label : "My First dataset",
			fillColor : "rgba(220,220,220,0.2)",
			strokeColor : "rgba(220,220,220,1)",
			pointColor : "rgba(220,220,220,1)",
			pointStrokeColor : "#fff",
			pointHighlightFill : "#fff",
			pointHighlightStroke : "rgba(220,220,220,1)",
			data : []
		}, {
			label : "My Second dataset",
			fillColor : "rgba(151,187,205,0.2)",
			strokeColor : "rgba(151,187,205,1)",
			pointColor : "rgba(151,187,205,1)",
			pointStrokeColor : "#fff",
			pointHighlightFill : "#fff",
			pointHighlightStroke : "rgba(151,187,205,1)",
			data : []
		} ]
	};

	console.log(test);
	console.log(data);

	var ctx = document.getElementById(chartID).getContext("2d");

	var myLineChart = new Chart(ctx).Bar(data, {
		bezierCurve : false,
	});
	return myLineChart;
}

function updateChart(chart, labels, values) {
//	chart.datasets[0].points[2].value = 50;
}

var detectorOverviewChart;
var pcOverviewChart;

function loadCharts() {
	$.ajax({
		url : "http://na62monitoring/farm/stats.json",
		beforeSend : function(xhr) {
			xhr.overrideMimeType("text/plain; charset=x-user-defined");
		}
	}).done(
			function(data) {
				var obj = jQuery.parseJSON(data);

				var detectorOverview = getDetectorOverview(obj.DetectorData)
				var pcOverview = getPcOverview(obj.DetectorData)
				// console.log(getDetectorOverview(obj.DetectorData));

				updatePcList(obj.DetectorData);

				if (!detectorOverviewChart) {
					detectorOverviewChart = drawOverviewChart(
							"sourceOverviewChart", detectorOverview);

					// $("#overviewTabsLegend").html(
					// detectorOverviewChart.generateLegend());
				} else {
					updateChart(detectorOverviewChart, labels, values);
				}

				if (!pcOverviewChart) {
					var labels = [];
					var values = [];
					for ( var host in pcOverview) {
						labels.push(host);
						values.push(pcOverview[host]["missingEvents"]);
					}
					pcOverviewChart = drawOverviewChart("pcOverviewChart",
							pcOverview);
				}
			});
}

function onLoad() {
	$('#activePCs').change(onActivePcChange);
	setInterval(loadCharts, 2000);
	loadCharts();
}