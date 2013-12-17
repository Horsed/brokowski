var request = require('request')
  , util = require('./util')
  , http = require('http')
  , express = require('express')
  , path = require('path');


exports.sub = function(port, name, broker) {
  return new SubscriberServer(port, name, broker);
};


function SubscriberServer() {
  this.monitoring = require('./monitoring');
};


SubscriberServer.prototype.start = function(port, name, broker) {
  this.port = port;
  this.name = name;
  this.broker = broker;
  var self = this;

  // configure server
  this.app = express();
  this.app.set('port', this.port || 3000);
  this.app.configure(function(){
    self.app.use(self.app.router);
  });
  this.app.configure('development', function(){
    self.app.use(express.errorHandler());
  });

  // event handlers
  this.getHandlers = {};
  this.postHandlers = {};
  this.putHandlers = {};
  this.deleteHandlers = {};

  // configure event handling routes
  this.app.get('/' + this.name + '/:event', function(req, res) {
    self.onDataComplete(req, res, function(data) {
      res.end();
      if(self.getHandlers[req.params['event']]) self.getHandlers[req.params['event']](data);
    });
  });

  this.app.post('/' + this.name + '/:event', function(req, res) {
    self.onDataComplete(req, res, function(data) {
      res.end();
      if(self.postHandlers[req.params['event']]) self.postHandlers[req.params['event']](data);
    });
  });

  this.app.put('/' + this.name + '/:event', function(req, res) {
    self.onDataComplete(req, res, function(data) {
      res.end();
      if(self.putHandlers[req.params['event']]) self.putHandlers[req.params['event']](data);
    });
  });

  this.app.delete('/' + this.name + '/:event', function(req, res) {
    self.onDataComplete(req, res, function(data) {
      res.end();
      if(self.deleteHandlers[req.params['event']]) self.deleteHandlers[req.params['event']](data);
    });
  });

  this.app.get('/monitoring/:check', this.monitoring.check);

  // run server
  this.restServer = http.createServer(this.app).listen(this.app.get('port'), function() {
    console.log('subscriber server \'' + self.name + '\' listening on port ' + self.app.get('port'));
  });
  return this;
};


SubscriberServer.prototype.close = function() {
  this.restServer.close();
  return this;
};


SubscriberServer.prototype.get = function(event, handler) {
  this.subscribe({event: event, method: 'GET', handler: handler});
  return this;
};


SubscriberServer.prototype.post = function(event, handler) {
  this.subscribe({event: event, method: 'POST', handler: handler});
  return this;
};


SubscriberServer.prototype.put = function(event, handler) {
  this.subscribe({event: event, method: 'PUT', handler: handler});
  return this;
};


SubscriberServer.prototype.delete = function(event, handler) {
  this.subscribe({event: event, method: 'DELETE', handler: handler});
  return this;
};


SubscriberServer.prototype.subscribe = function(options) {
  this[options.method.toLowerCase() + 'Handlers'][options.event] = options.handler;
  
  request.post({
    url: util.normalizeBrokerUrl(this.broker) + 'subscribe/' + options.event,
    json: {
      hostname: options.hostname || 'localhost',
      port: options.port || this.app.get('port'),
      path: options.path || '/' + this.name + '/' + options.event,
      method: options.method,
      roundRobin: options.roundRobin || true
    }
  }, function(err, res) {
    if(!res)
      throw new Error('Could not subscribe. Received a broken response from broker.');
    if(res.statusCode != 200)
      throw new Error('Could not subscribe. Response from broker was ' + res.statusCode);
  });

  return this;
};


SubscriberServer.prototype.resubscribe = function(options) {
  this[options.method.toLowerCase() + 'Handlers'][options.event] = options.handler;
  
  request.post({
    url: util.normalizeBrokerUrl(this.broker) + 'resubscribe/' + options.event,
    json: {
      hostname: options.hostname || 'localhost',
      port: options.port || this.app.get('port'),
      path: options.path || '/' + this.name + '/' + options.event,
      method: options.method,
      roundRobin: options.roundRobin || true
    }
  }, function(err, res) {
    if(!res)
      throw new Error('Could not subscribe. Received a broken response from broker.');
    if(res.statusCode != 200)
      throw new Error('Could not subscribe. Response from broker was ' + res.statusCode);
  });

  return this;
};


SubscriberServer.prototype.onDataComplete = function(req, res, cb) {
  var data='';

  req.setEncoding('utf8');

  req.on('data', function(chunk) {
    data += chunk;
  });

  req.on('end', function() {
    cb(JSON.parse(data));
  });
};