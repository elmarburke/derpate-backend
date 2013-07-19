var Q = require("q")
  , couch = require('../couch')
  , layout = require("../layout")
;

/*
 * GET Dashboard.
 */

exports.index = function (req, res) {
  sponsorships()
  .then(function(names) {
    layout.renderWithLayoutAndSend('admin/index', {
      title: 'Dashboard',
      names: names,
      debug: JSON.stringify(names, null, 4)
    }, res);
  })
};

exports.details = function (req, res) {
  var id = req.params.id;
  // Get the sponsorship doc from db
  couch.get('sponsorship/' + id)
  .then(function (sponsorship) {
    // Now fetch the geometry that belongs to the sponsorship
    return couch.get('geometry/' + sponsorship.belongsTo)
    .then(function (geometry) {
      // Merge the sponsorship object with the geometry
      sponsorship.geometry = geometry;
      sponsorship.geometryString = JSON.stringify(geometry);
      return sponsorship;
    });
  })
  .then(function (data) {
    data.debug = JSON.stringify(data, null, 4);
    return layout.renderWithLayoutAndSend('admin/details', data, res);
  })
};

exports.confirm = function (req, res) {
  var id = req.params.id;
  
  couch.get('sponsorship/' + id)
  .then(function (data) {
    data.confirmed = true;
    data.confirmedAt = (new Date()).toISOString();
    return data;
  })
  .then(function (data) {
    return couch.put('sponsorship/' + id, data);
  })
  .then(function (data) {
    res.redirect('/admin/sponsorship/' + id)
  })
}

exports.withdraw = function (req, res) {
  var id = req.params.id;
  
  couch.get('sponsorship/' + id)
  .then(function (data) {
    data.confirmed = false;
    data.withdrawAt = (new Date()).toISOString();
    return data;
  })
  .then(function (data) {
    return couch.put('sponsorship/' + id, data);
  })
  .then(function (data) {
    res.redirect('/admin/sponsorship/' + id)
  })
}

exports.delete = function (req, res) {
  var id = req.params.id
    , rev = req.params.rev
  ;
  
  couch.get('sponsorship/' + id)
  .then(function (data) {
    couch.del('sponsorship/' + id, {
      rev: rev
    });
    
    couch.get('geometry/' + data.belongsTo)
    .then(function (geometry) {
      geometry.properties.taken = false;
      return geometry
    })
    .then(function (geometry) {
      return couch.put('geometry/' + id, geometry);
    })
    .then(function (geometry) {
      res.redirect('/admin')
    })
    .catch(function (e) {
      console.error("ERROR IN DELETING AN OBJECT: ", e);
    })
    
  })
  
  
}

sponsorships = function (type) {
  return couch.get('sponsorship/_design/sponsorship/_view/byName')
  .then(function (data) {
    names = data.rows;
    return names;
  })
}