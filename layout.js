var Q = require("q");

// this function will built the template in views/template.hjs 
// around the rendered page

exports.render = render = function (viewName, data, res) {
  var deferred = Q.defer();
  
  data = data || {};
  
  res.render(viewName, data, function (err, html) {
    if(err) {
      return deferred.reject(err);
    }
    
    return deferred.resolve(html);
  })
  
  return deferred.promise;
}

exports.renderWithLayout = renderWithLayout = function (viewName, data, res) {
  return render(viewName, data, res)
  .then(function (html) {
    return render('layout', {
      content: html
    }, res);
  })
  .then(function (html) {
    return html;
  })
}

exports.renderWithLayoutAndSend = function (viewName, data, res) {
  return renderWithLayout(viewName, data, res)
  .then(function (html) {
    res.send(html);
  })
}