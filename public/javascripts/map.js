$(document).ready(function(){
/*
 * Lets do maps
 */

// read cookies (if there are any) and set map center to this

var lat = docCookies.getItem('lat') || 51.4465
  , lng = docCookies.getItem('lng') || 6.6367
  , zoom = docCookies.getItem('zoom') || 14
;


var map = L.map('map').setView([lat, lng], zoom);

/* 
 * Layer
 */

L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, Imagery <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
  maxZoom: 18
}).addTo(map);

var jsonLayer = {},
    featureRequest = {};
/*
 * Icons
 */

var MapIcon = L.Icon.extend({
	options: {
		iconUrl: '/images/mapicons/tree_free.png',
		iconSize: [32, 37],
		iconAnchor: [16, 37],
		popupAnchor: [0,-37]
	}
});

var treeFreeIcon = MapIcon.extend({
	options: {
		iconUrl: 'images/mapicons/tree_free.png'
	}
});

var treeTakenIcon = MapIcon.extend({
	options: {
		iconUrl: 'images/mapicons/tree_used.png'
	 }
});

var flowerFreeIcon = MapIcon.extend({
	options: {
		iconUrl: 'images/mapicons/flower_free.png'
	}
});

var flowerTakenIcon = MapIcon.extend({
	options: {
		iconUrl: 'images/mapicons/flower_used.png'
	}
});

/*
 * geoJSON-Functions
 */

var geoJsonIds = [];

var popupPre = Hogan.compile( $('#map-popup').html() );

var onEachFeature = function (feature, layer) {
  
  // Bind Popup
  if (feature.properties) {
    var output = feature.properties;
    output._id = feature._id;
    
    feature.properties.taken = feature.properties.taken || false;
    var content = popupPre.render(feature);
    content += "<pre>" + JSON.stringify(output, null, 4) + "</pre>"
    var popup = new L.Popup()
    .setContent(content);
    
    layer.bindPopup(popup);
  }
  
  // add id to array
  geoJsonIds.push(feature._id);
};

var filter = function (feature, layer) {
  var index = geoJsonIds.indexOf(feature._id);
  if (index < 0) {
    return true;
  } else {
    return false;
  }
};

var pointToLayer = function (feature, latlng) {
	var icon = {};
	if (feature.properties.LANGNAME === 'Einzelbaum') {
		if(feature.properties.taken) {
			icon = new treeTakenIcon();
		} else {
			icon = new treeFreeIcon();
		}
	} else if (feature.properties.LANGNAME === 'Pflanzkübel') {
		if (feature.properties.taken) {
			icon = new flowerTakenIcon();
		} else {
			icon = new flowerFreeIcon();
		}
	} else {
		icon = new L.Icon.Default();
	}
	return L.marker(latlng, {
		icon: icon 
	});
};

var loadGeoJson = function (e) {
  var bbox = map.getBounds().toBBoxString();
  
  if (map.getZoom() >= 16) {
    if (featureRequest.abort)
      featureRequest.abort();
  
    featureRequest = jQuery.getJSON("/mapFeatures/", {
      bbox: bbox
    }, function (json) {
      
      if (!(window.jsonLayer && window.jsonLayer.toGeoJSON)) {
        window.jsonLayer = L.geoJson(json, {
          onEachFeature: onEachFeature,
          filter: filter,
          pointToLayer: pointToLayer
        }).addTo(map);
      } else {
        window.jsonLayer.addData(json);
      }
      
    })
  } else {
    if (typeof window.jsonLayer === "object") {
      map.removeLayer(window.jsonLayer);
      window.jsonLayer = null;
    }
  }
};

/*
 * Write position to cookie
 */

latLngZoomToCookie = function (e) {
  var lat = map.getCenter().lat
    , lng = map.getCenter().lng
    , zoom = map.getZoom()
  ;
  
  docCookies.setItem('lat', lat);
  docCookies.setItem('lng', lng);
  docCookies.setItem('zoom', zoom);
}


/*
 * Events
 */

map.on('moveend', loadGeoJson);
map.on('moveend', latLngZoomToCookie);

loadGeoJson();

})