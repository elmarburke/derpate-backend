var couch = require('../couch')
  , Q = require("q")
  , layout = require("../layout")
;
  
/*
 * GET / home page.
 */

exports.index = function (req, res){
    layout.renderWithLayoutAndSend('index', {
      title: 'Der Pate'
    }, res);
};

/*
 * GET mapFeatures
 */

exports.mapFeatures = function (req, res) {
  var bbox = req.query.bbox;
  
  couch.get('geometry/_design/geometry/_spatial/points', {
    bbox: bbox
  }).then(function (data) {
    var geojson = data.rows.map(function (row) {
      return row.value;
    });
    return geojson;
  }).then(function (geojson) {
    return res.jsonp(geojson);
  }).fail(function (e) {
    console.error(e);
  })
  
}

/*
 * GET patewerden
 */

exports.pateWerden = function (req, res) {
  var id = req.params.id;
  
  // First, get the doc from the couch
  
  couch.get('geometry/' + id)
  .then(function (data) {
    if (data.properties.taken) {
      return layout.renderWithLayoutAndSend('element_taken', data, res);
    } else {
      return layout.renderWithLayoutAndSend('element_take', data, res);
    }
  });
};

exports.pateWerdenForm = function (req, res) {
  var id = req.params.id;
  var sponsorship = req.body;
  sponsorship.date = (new Date()).toISOString();
  sponsorship.confirmed = false;
  
  couch.get('geometry/' + id)
  .then(function (element) {
    
    // check if element is taken
    if (element.properties.taken) {
      
      // Element is taken, show error message (should not happen)
      return res.render('element_taken', element);
      
    } else {
      
      sponsorship.belongsTo = sponsorship._id;
      delete sponsorship._id;
      
      // Make entry in db sponsorship
      couch.get('sponsorship/_design/sponsorship/_view/sortedByGeometryId', {
        key: sponsorship.belongsTo
      })
      .then(function (result) {
        return result.rows.length > 0;
      })
      .then(function (exists) {
        if (exists) {
          // there is already an entry with this geometry id. This should not happen!
          return layout.renderWithLayoutAndSend('element_taken', {}, res);
        }
        // so, the geometry looks like ok. first, write to the sponsorship db.
        element.properties.taken = true;
        return Q.all([
          couch.post('sponsorship/', sponsorship),
          couch.put('geometry/' + id, element)
          ])
          .then(function (data) {
          return layout.renderWithLayoutAndSend('element_take_confirmation', data, res);
        });
      })
      .catch(function (error) {
        console.error("Error: ", error)
      });
      
    }
  });
};