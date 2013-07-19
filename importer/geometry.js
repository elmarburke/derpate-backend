var Q = require('q')
  , iconv = require('iconv-lite')
  , couch = require('../couch')
;

var generateGeoJsonFromShapefile = function (filename) {
  var exec     = require('child_process').exec
    , fs       = require('fs')
    , deferred = Q.defer()
    , path     = "shapes"
    , filepath = path + "/" + filename
  ;
  
  fs.exists(filepath + ".json", function (exists) {
    if(!exists) {
      var cmd = "ogr2ogr -f 'GeoJSON' " + filepath + ".json " + filepath + ".shp"
      var child = exec(cmd, function(err, stdout, stderr) {
        if (err !== null) {
          console.log('exec error: ' + err);
          deferred.reject(err);
        }
        deferred.resolve();
      })
    } else {
      deferred.resolve()
    }
  })
  return deferred.promise;
}

var readGeoJson = function (filename) {
  var fs       = require('fs')
    , deferred = Q.defer()
    , path     = "shapes"
    , filepath = path + "/" + filename + ".json"
  ;
  fs.readFile(filepath, function (err, data) {
    if (err !== null) {
      console.log("error");
      deferred.reject(err);
    }
    data = iconv.decode(data, "latin1");
    data = JSON.parse(data);
    deferred.resolve(data);
  });
  return deferred.promise;
}

var writeGeoJsonToCouch = function (geoJson) {
  var deferred = Q.defer();
  
  var bulk_docs = {
    docs: geoJson.features
  }
  
  couch.post('geometry/_bulk_docs', bulk_docs)
    .then(function (res) {
      return deferred.resolve(res)
    })
    .fail(function (err) {
      console.error("Upload failed: \n", err)
    })
  return deferred.promise;
}

module.exports.start = function () {
  Q.all([
    generateGeoJsonFromShapefile("Flaechen"),
    generateGeoJsonFromShapefile("Punkte")
  ]).then(function () {
    return Q.all([
      readGeoJson("Flaechen"),
      readGeoJson("Punkte")
    ])
  }).then(function (results) {
    console.log("writing to couchdb", typeof results, results[0].type);
    return Q.all([
      writeGeoJsonToCouch(results[0]),
      writeGeoJsonToCouch(results[1])
    ]);
    
  }).then(function (results) {
    console.log("Saved to Couch");
  }).fail(function (err) {
    console.error("Error during import: ", err);
  })
}