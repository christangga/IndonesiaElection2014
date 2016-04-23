// Construct a bounding box for this map that the user cannot
// move out of
var southWest = L.latLng(-11.82434, 93.03223),
    northEast = L.latLng(8.66792, 140.97656),
    bounds = L.latLngBounds(southWest, northEast);

var map = L.map('map', {
	maxBounds: bounds,
    maxZoom: 17,
    minZoom: 5
}).setView([-0.74705, 117.68555], 5);

map.createPane('labels');
map.getPane('labels').style.zIndex = 650;
map.getPane('labels').style.pointerEvents = 'none';

// Color for Jokowi and Prabowo
var JKcolor = 'red';
var PBcolor = 'yellow';

// L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
// 	maxZoom: 18,
// 	attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
// 		'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
// 		'Imagery © <a href="http://mapbox.com">Mapbox</a>',
// 	id: 'mapbox.light'
// }).addTo(map);

var positron = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
        attribution: '©OpenStreetMap, ©CartoDB'
}).addTo(map);


var positronLabels = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
        attribution: '©OpenStreetMap, ©CartoDB',
        pane: 'labels'
}).addTo(map);

// control that shows state info on hover
var info = L.control();

info.onAdd = function (map) {
	this._div = L.DomUtil.create('div', 'info');
	this.update();
	return this._div;
};

info.update = function (props) {
	this._div.innerHTML = '<h4>Provinsi</h4>' +  (props ?
		'<b>' + props.NAME_1 + '<br />Kota ' + props.NAME_2 + '</b>' + '<br /> Jokowi-JK:' + props.JOKOWI + ' ,Prabowo-Hatta: ' + props.PRABOWO
		: 'Hover over a state');
};

info.addTo(map);


// get color depending on population density value
function getColor(d) {
	var scale = chroma.scale([PBcolor, JKcolor]);
		return (scale(d).hex());
}

function getColor2(d) {
	return d > 1000 ? '#800026' :
	       d > 500  ? '#BD0026' :
	       d > 200  ? '#E31A1C' :
	       d > 100  ? '#FC4E2A' :
	       d > 50   ? '#FD8D3C' :
	       d > 20   ? '#FEB24C' :
	       d > 10   ? '#FED976' :
	                  '#FFEDA0';
}

function style(feature) {
	var percentage = ((feature.properties.JOKOWI) / (feature.properties.JOKOWI + feature.properties.PRABOWO));
	return {
		weight: 2,
		opacity: 1,
		color: 'white',
		dashArray: '3',
		fillOpacity: 0.7,
		fillColor: getColor(percentage)
	};
}

function highlightFeature(e) {
	var layer = e.target;

	layer.setStyle({
		weight: 2,
		color: '#666',
		dashArray: '',
		fillOpacity: 0.7
	});

	if (!L.Browser.ie && !L.Browser.opera) {
		layer.bringToFront();
	}

	info.update(layer.feature.properties);

	createPie(layer.feature.properties);
	// console.log(layer.feature.properties);
}

var geojsonProvinsi, geojsonKabupaten;

function resetHighlight(e) {
	geojsonKabupaten.resetStyle(e.target);
	geojsonProvinsi.resetStyle(e.target);
	info.update();
}

function zoomToFeature(e) {
	map.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
	layer.on({
		mouseover: highlightFeature,
		mouseout: resetHighlight,
		click: zoomToFeature
	});
}

function createPie(data) {
	var percentageJK = ((data.JOKOWI) / (data.JOKOWI + data.PRABOWO)) * 100;
	var percentagePB = ((data.PRABOWO) / (data.JOKOWI + data.PRABOWO)) * 100;
	// var new_data = {};
	// new_data['Jokowi-JK'] = percentageJK;
	// new_data['Prabowo-Hatta'] = percentagePB;
	// // console.log(new_data);
	// var data_fix = JSON.stringify(new_data);
	// console.log(data_fix);
	// var super_data = {
	// 	"Jokowi" : percentageJK,
	// 	"Prabowo" : percentagePB
	// }
	var the_data = [];
	the_data.push(['Jokowi',percentageJK]);
	the_data.push(['Prabowo',percentagePB]);

	var color = [JKcolor, PBcolor];

	$('#container').highcharts({
		colors: color,
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'pie'
        },
        title: {
            text: 'Perolehan Suara Jokowi vs Prabowo di ' + data.NAME_1
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
            // pointFormat: '{series.name}: <b></b>'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    // format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                },
                showInLegend: true
            }
        },
        series: [{
        	name: 'Persentase',
            // colorByPoint: true,
            data: the_data,
            dataLabels: {
			    color:'black',
			    distance: -40,
			    formatter: function () {
			        if(this.percentage!=0)  return Math.round(this.percentage)  + '%';
			    }
			}
	    }],
	});
	// }).setOptions({colors: ['red','yellow']});
}

map.on('zoomend', function() {
	// alert(map.getZoom());
	if(map.getZoom() >= 7){
		geojsonKabupaten.addTo(map);
		map.removeLayer(geojsonProvinsi);
	}else{
		geojsonProvinsi.addTo(map);
		map.removeLayer(geojsonKabupaten);
	}
});

geojsonProvinsi = L.geoJson(statesData, {
	style: style,
	onEachFeature: onEachFeature
}).addTo(map);


geojsonKabupaten = L.geoJson(dataKabupaten, {
	style: style,
	onEachFeature: onEachFeature
})

// var areas = L.layerGroup([geojsonProvinsi,geojsonKabupaten]);

// alert(map);
// geojsonProvinsi.addTo(map);

var overlayMaps = {
    "Provinsi": geojsonProvinsi,
    "Kabupaten":geojsonKabupaten
};

// L.control.layers( overlayMaps).addTo(map);

// map.attributionControl.addAttribution('Population data &copy; <a href="http://census.gov/">US Census Bureau</a>');


var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {

	var div = L.DomUtil.create('div', 'info legend'),
		grades = [0, 10, 20, 50, 100, 200, 500, 1000],
		labels = [],
		from, to;

	for (var i = 0; i < grades.length; i++) {
		from = grades[i];
		to = grades[i + 1];

		labels.push(
			'<i style="background:' + getColor(from + 1) + '"></i> ' +
			from + (to ? '&ndash;' + to : '+'));
	}

	div.innerHTML = labels.join('<br>');
	return div;
};

// legend.addTo(map);
