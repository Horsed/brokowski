var assert = require('assert')
  , should = require('should')
  , http = require('http')
  , jsonBody = require('body/json')
  , connect = require('connect')
  , request = require('request');

describe('[testSubscriber.js] Subscriber', function() {

  it('should subscribe at broker', function(done) {
    var broker = connect().use(function(req, res) {
      req.url.should.equal('/subscribe/myevent');
      done();
    });

    http.createServer(broker).listen(5999);

    var subscriber = require('../rest/subscriber.js').sub().start(6000, 'myservice', 'http://localhost:5999')

    subscriber.subscribe({
      event: 'myevent',
      method: 'GET'
    });
  });

  it('should subscribe to GET event', function(done) {
    var broker = connect().use(function(req, res) {
      jsonBody(req, res, function(err, body) {
        assert.equal(body.method, 'GET');
        done();
      });
    });

    http.createServer(broker).listen(6001);

    var subscriber = require('../rest/subscriber.js').sub().start(6002, 'myservice', 'http://localhost:6001')

    subscriber.get('myevent', function() { /*empty handler*/ });
  });

  it('should subscribe to POST event', function(done) {
    var broker = connect().use(function(req, res) {
      jsonBody(req, res, function(err, body) {
        assert.equal(body.method, 'POST');
        done();
      });
    });

    http.createServer(broker).listen(6003);

    var subscriber = require('../rest/subscriber.js').sub().start(6004, 'myservice', 'http://localhost:6003')

    subscriber.post('myevent', function() { /*empty handler*/ });
  });

  it('should subscribe to PUT event', function(done) {
    var broker = connect().use(function(req, res) {
      jsonBody(req, res, function(err, body) {
        assert.equal(body.method, 'PUT');
        done();
      });
    });

    http.createServer(broker).listen(6005);

    var subscriber = require('../rest/subscriber.js').sub().start(6006, 'myservice', 'http://localhost:6005')

    subscriber.put('myevent', function() { /*empty handler*/ });
  });

  it('should subscribe to DELETE event', function(done) {
    var broker = connect().use(function(req, res) {
      jsonBody(req, res, function(err, body) {
        assert.equal(body.method, 'DELETE');
        done();
      });
    });

    http.createServer(broker).listen(6007);

    var subscriber = require('../rest/subscriber.js').sub().start(6008, 'myservice', 'http://localhost:6007')

    subscriber.delete('myevent', function() { /*empty handler*/ });
  });

  it('should handle GET event and response 200', function(done) {
    var broker = connect().use(function(req, res) {});
    http.createServer(broker).listen(6009);

    var subscriber = require('../rest/subscriber.js').sub().start(6010, 'myservice', 'http://localhost:6009')
    subscriber.get('myevent', function(data) {
      assert.ok(data.stuff);
      done();
    });

    request.get({url: 'http://localhost:6010/myservice/myevent', json: {stuff: true}}, function (err, res, body) {
      assert.equal(res.statusCode, 200);
    });
  });

  it('should handle POST event and response 200', function(done) {
    var broker = connect().use(function(req, res) {});
    http.createServer(broker).listen(6011);

    var subscriber = require('../rest/subscriber.js').sub().start(6012, 'myservice', 'http://localhost:6011')
    subscriber.post('myevent', function(data) {
      assert.ok(data.stuff);
      done();
    });

    request.post({url: 'http://localhost:6012/myservice/myevent', json: {stuff: true}}, function (err, res, body) {
      assert.equal(res.statusCode, 200);
    });
  });

  it('should handle PUT event and response 200', function(done) {
    var broker = connect().use(function(req, res) {});
    http.createServer(broker).listen(6013);

    var subscriber = require('../rest/subscriber.js').sub().start(6014, 'myservice', 'http://localhost:6013')
    subscriber.put('myevent', function(data) {
      assert.ok(data.stuff);
      done();
    });

    request.put({url: 'http://localhost:6014/myservice/myevent', json: {stuff: true}}, function (err, res, body) {
      assert.equal(res.statusCode, 200);
    });
  });

  it('should handle DELETE event and response 200', function(done) {
    http.createServer(connect().use(function(req, res) {})).listen(6015);

    var subscriber = require('../rest/subscriber.js').sub().start(6016, 'myservice', 'http://localhost:6015')
    subscriber.delete('myevent', function(data) {
      assert.ok(data.stuff);
      done();
    });

    request.del({url: 'http://localhost:6016/myservice/myevent', json: {stuff: true}}, function (err, res, body) {
      assert.equal(res.statusCode, 200);
    });
  });

  it('should subscribe with default options', function(done) {
    var broker = connect().use(function(req, res) {
      jsonBody(req, res, function(err, body) {
        assert.equal(body.hostname, 'localhost');
        assert.equal(body.port, 6018);
        assert.equal(body.path, '/myservice/myevent');
        assert.equal(body.roundRobin, true);
        done();
      });
    });

    http.createServer(broker).listen(6017);

    var subscriber = require('../rest/subscriber.js').sub().start(6018, 'myservice', 'http://localhost:6017')

    subscriber.delete('myevent', function() { /*empty handler*/ });
  });

});