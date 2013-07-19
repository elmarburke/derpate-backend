/**
 * Module dependencies.
 */

var express = require('express'),
    http = require('http'),
    path = require('path'),
    Q = require('q'),
    couch = require('./couch'),
    importersGeometry = require('./importer/geometry'),
    routes = require('./routes'),
    admin = require('./routes/admin')
    geometryDbDoc = require('./designdocs/geometry')
;

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'hjs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.compress());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(require('less-middleware')({ src: __dirname + '/public' }));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

/*
 * Implement DBs
 */

var geometryDatabase = 'geometry';

couch.exists(geometryDatabase)
/*  .then(function(res) {
    if(res) {
      return couch.del(geometryDatabase);
    } else {
      return res;
    }
  })*/
  .then(function (exists) {
    if (!exists) {
      return couch.database.create(geometryDatabase)
          .then(function (exists) {
            console.log("db created");
            return couch.put(geometryDatabase+'/_design/geometry', geometryDbDoc['_design/geometry']);
          })
          .then(function (res) {
            console.log("_design created");
            return res.ok;
          })
          .then(function (ok) {
            console.log("going to import");
            return importersGeometry.start();
          })
          .fail(function (err) {
            console.error(err);
          });
      
    } else {
      return exists;
    }
  });

// create database sponsorship

couch.exists('sponsorship')
  .then(function (exists) {
    if(!exists) {
      return couch.database.create('sponsorship')
    }
  })

// Handle the Auth

var auth = express.basicAuth(function(user, pass) {
 return user === 'admin' && pass === 'moers';
});

// Routes

app.get('/', routes.index);
app.get('/mapFeatures', routes.mapFeatures);
app.get('/patewerden/:id', routes.pateWerden);
app.post('/patewerden/:id', routes.pateWerdenForm);

app.get('/admin', auth, admin.index);
app.get('/admin/sponsorship/:id', auth, admin.details);
app.get('/admin/sponsorship/:id/withdraw', auth, admin.withdraw);
app.get('/admin/sponsorship/:id/confirm', auth, admin.confirm);
app.get('/admin/sponsorship/:id/:rev/delete', auth, admin.delete);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
