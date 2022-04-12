$(document).ready(function() {
    doWork();
    $("#filter").on("click", function() {
        doWork();
    });
});

function doWork() {
    var time = $("#time").val();

    var url = `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_${time}.geojson`;
    var url2 = 'static/data/plates.json';
    requestD3(url, url2);

    // clear out the old map 
  $("#map-container").empty();
  $("#map-container").append('<div id="map" style="height:900px"></div>');

}

function requestD3(url, url2) {
    d3.json(url).then(function(data) {
        d3.json(url2).then(function(plate) {
        console.log(data);
        console.log(plate);
        createMap(data, plate);
    });
})};

function onEachFeature(earthquake, layer) {
    if (earthquake.features) {
        layer.bindPopup(`<h3>${earthquake.properties.place } at depth ${(earthquake.geometry.coordinates[2])}</h3><hr><p>${new Date(earthquake.properties.time)}</p >`);
    }
}

function createMap(data, plate) {
    var earthquakes = data.features
    
    // Create the base layers.
    var dark_layer = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox/dark-v10',
        accessToken: API_KEY
    });

    var light_layer = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox/light-v10',
        accessToken: API_KEY
    });

    var street_layer = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox/streets-v11',
        accessToken: API_KEY
    });

    var outdoors_layer = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox/outdoors-v11',
        accessToken: API_KEY
    });

    // Create an overlays object.
    var earthquakeLayer = L.geoJSON(earthquakes, {
        onEachFeature: onEachFeature
    });

    var plates = plate.features
    var plateLayer = L.geoJson(plates, {
        onEachFeature: onEachFeature
    });

    // Create circles overlay 
    var circles = [];
    for (let i= 0; i < earthquakes.length; i++) {
        let earthquake = earthquakes[i];
        let circle_color = getColor(earthquake.geometry.coordinates[2]);
        let circle = L.circle([earthquake.geometry.coordinates[1], earthquake.geometry.coordinates[0]], {
            color: circle_color,
            fillColor: circle_color,
            fillOpacity: 0.8,
            radius: getRadius(earthquake.properties.mag)
        }).bindPopup(`<h3>${earthquake.properties.place}</h3><hr><p>${new Date(earthquake.properties.time)}</p>`);
        circles.push(circle);
    }

    var circleLayer = L.layerGroup(circles); 

    // Overlays toggling
    var baseMaps = {
        "Dark": dark_layer,
        "Light": light_layer,
        "Street": street_layer,
        "Outdoors": outdoors_layer
    }
    var overlayMaps = {
        Earthquake: earthquakeLayer,
        Markers: earthquakeLayer,
        Circles: circleLayer,
        Plates: plateLayer
    };
    
    var myMap= L.map("map", {
        center: [
            37.09, -95.71
        ],
        zoom: 3,
        layers: [outdoors_layer, circleLayer, plateLayer]
    });

    L.control.layers(baseMaps, overlayMaps).addTo(myMap);

    var legend = L.control({position: "bottomleft"});
        legend.onAdd = function() {
        var div= L.DomUtil.create('div', 'info legend');
        var labels = ["90<", "70-89", "50-69", "30-59", "10-29", "<9"];
        var colors = ["red", "firebrick", "orange", "yellow", "gold", "lightgreen", "green"];
        for (let i=0; i< labels.length; i++) {
            let label= labels[i];
            let color = colors[i];
            let html = `<i style='background:${color}'></i>${label}<br>`;
            div.innerHTML += html;
        }
        return div;
    };
    legend.addTo(myMap);
}

function getRadius(magnitude) {
    return magnitude * 20000
}

function getColor(depth) {
    let color = 'red';
    if (depth >= 90) {
        color = "firebrick";
    } else if (depth >= 70) {
        color = "orange";
    } else if (depth >= 50) {
        color = "yellow";
    } else if (depth >= 30) {
        color = "gold";
    } else if (depth >= 10) {
        color = "lightgreen";
    } else {
        color = "green";
    }
    return (color);
}
 
