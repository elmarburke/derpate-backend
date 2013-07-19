var Q = require("q")
  , couchr = require('couchr')
  , config = require('./config').couch
  , baseurl = 'http://'+config.username+':'+config.password+'@'+config.host+':'+config.port+'/'
  , realBaseurl = 'http://'+config.host+':'+config.port+'/'
;

module.exports = {
  'database': {
    create: function (database) {
      var deferred = Q.defer();
      
      couchr.put(baseurl + database, function(err, res) {
        if(err) {
          // An error
          deferred.reject(err);
        } else if(res.ok !== null) {
          deferred.resolve(res.ok)
        }
      });
      
      return deferred.promise;
    }
  },
  
  get: function (url, params) {
    var deferred = Q.defer();
    params = params || {};
    couchr.get(baseurl + url, params, function(err, res) {
      if(err) {
        // An error
        deferred.reject(err);
        console.log(err);
      } else {
        deferred.resolve(res);
      }
    })
    return deferred.promise;
  },
  
  post: function (url, data) {
    var deferred = Q.defer();
    data = data || {};
    couchr.post(baseurl + url, data, function(err, res) {
      if(err) {
        // An error
        deferred.reject(err);
      } else if(res.ok !== null) {
        deferred.resolve(res);
      }
    });
    return deferred.promise;
  },
  
  put: function (url, data) {
    var deferred = Q.defer();
    data = data || {};
    
    couchr.put(baseurl + url, data, function(err, res) {
      if(err) {
        // An error
        deferred.reject(err);
      } else if(res.ok !== null) {
        deferred.resolve(res)
      }
    })
    return deferred.promise;
  },
  
  del: function (url, data) {
    var deferred = Q.defer();
    data = data || {};
    console.log("DEL", url)
    couchr.del(baseurl + url, data, function(err, res) {
      if(err) {
        // An error
        deferred.reject(err);
      } else if(res.ok !== null) {
        deferred.resolve(res)
      }
    })
    return deferred.promise;
  },
  
  head: function (url) {
    var deferred = Q.defer();
    couchr.head(baseurl + url, function(err, res) {
      if(err) {
        // An error
        deferred.reject(err);
      } else if(res.ok !== null) {
        deferred.resolve(res)
      }
    })
    return deferred.promise;
  },
  
  
  /* Costum methods */
  exists: function (database) {
    var deferred = Q.defer();
    couchr.get(baseurl + database, function(err, data) {
      if(err && err.error !== "not_found") {
        // An error happend
        return deferred.reject(err);
      }
      
      if(data.error === "not_found") {
        // DB does not exist
        deferred.resolve(false)
      } else {
        // its there, baby
        deferred.resolve(true)
      }
    });
    
    return deferred.promise;
  }
}