var url = require('url')
var http = require('http');
var qs = require('querystring');
var events = require('events');
var path = require('path');
var util = require('util');
var fs = require('fs');
var WebSocketServer = require('ws').Server
var cookie = require('cookie')
var connect = require('connect')

/***
 * uuid
 */
var json = require('./streams/json');

var split = require('./streams/split');
var uuid = require('../lib/utils').uuid;
var Module = require('../lib/rpc');
var app = require('../app')

/***
 * btn api client
 */
var Session = function(key) {
	events.EventEmitter.call(this);
	var self = this;

	this.id = uuid()
	this.gone = false
	this.last = new Date()
	this.timmer = 0
	this.buffer = [];
	this.issession = [];
	var rpc = this.rpc = new Module(this.write.bind(this))
	this.cbs = [];

}
/***
 * Make it an event
 */
util.inherits(Session, events.EventEmitter);

Session.prototype.clean = function() {

	this.buffer = [];
	this.rpc.emit('exit')
}
Session.prototype.loopCb = function() {

	var buffer = this.buffer
	var buff = []

	while (this.buffer.length) {
		buff.push(buffer.shift())
	}
	return buff
}

Session.prototype.send = function(request) {
	if (request.sent) {
		return
	}
	clearTimeout(request.timmer)
	request.sent = true
	request.cb(null, this.loopCb())
}

Session.prototype.write = function(data) {
	if (!data)
		return;
	var self = this;
	var message = {
		time : Date.now(),
		data : data
	}

	this.buffer.push(message);

	while (this.cbs.length > 0) {
		this.send(this.cbs.shift())
	}

}
Session.prototype.query = function(since, cb) {
	var self = this;

	this.last = new Date();

	clearTimeout(this.timmer);

	this.timmer = setTimeout(function() {
		self.gone = true;
		self.emit('gone');
	}, 10 * 1000);

	if (self.gone) {
		self.gone = false;
		self.emit('back');
	}

	var buff = this.loopCb()

	if (buff.length === 0) {
		(function(cbs) {
			var message = {
				cb : cb,
				sent : false,
				timmer : setTimeout(function() {
					if (!message.sent) {
						cb(null, [])
						cbs.splice(cbs.indexOf(message), 1)
					}
				}, 5000)
			}
			cbs.push(message)
		})(this.cbs)
		return;
	}
	cb(null, buff);
}
Session.prototype.onData = function(data) {
	var self = this
	function write(err, result) {
		if (err)
			self.write(err)
		else
			self.write(result)
	}

	for (var i = 0; i < data.data.length; i++) {
		self.rpc.requestEvent(data.data[i], write)
	};
}
exports = module.exports = function() {
	events.EventEmitter.call(this)
	this.sessions = {}
	this.modules = []
}
/***
 * Make it an event
 */
util.inherits(exports, events.EventEmitter);

exports.prototype.broadcast = function(method, params, id, cb) {
	var sessions = this.sessions
	if ( typeof id === 'function') {
		cb = id;
		id = ''
	}
	var ids = []
	var data = []

	for (var key in sessions) {

		(function(key, session) {
			//console.log(session)
			if (key !== id && !session.gone) {
				ids.push(key)
				session.rpc.invoke(method, params, function(err, d) {
					data.push({
						err : err,
						data : d
					})
					ids.splice(ids.indexOf(key), 1)
					//console.log(ids)
					if (ids.length === 0) {

						cb(null, data)
					}
				})
			}
		})(key, sessions[key])
	};
}

exports.prototype.use = function(app) {
	var pending = {}
	var server = new WebSocketServer({
		server : app.server
	});
	server.addListener("listening", function() {
		//console.log("Listening for connections.");
	});
	server.addListener("connection", function(conn) {

		var jsonRead = new json.Read()
		var splitRead = new split.Read()
		splitRead.pipe(jsonRead);
		var jsonWrite = new json.Write()
		var splitWrite = new split.Write()
		jsonWrite.pipe(splitWrite)

		var rpc = new Module(function(data) {
			jsonWrite.write(data)
		});

		jsonRead.on('data', function(data) {
			rpc.requestEvent(data, function(err, data) {
				if (err)
					jsonWrite.write(err)
				else
					jsonWrite.write(data)
			})
		});

		splitWrite.on('data', function(message) {
			conn.send(message)
		})
		conn.addListener("message", function(message) {
			splitRead.write(message);
		});
		rpc.expose('modules', function(name) {
			var exposed = this;
			fs.readFile(__dirname + '/client/worker/' + name + '.js', function(err, data) {
				if (err)
					throw err;
				exposed.send({
					fn : data.toString('utf8')
				})
			});

		})
		rpc.expose('auth', function(id) {
			//console.log(pending)
			if (pending[id]) {
				delete pending[id]

				sessions[id].rpc = rpc;

				self.emit('new', sessions[id]);
				delete rpc.functions['auth'];
				this.send()
			} else {
				this.error('bad userid')
			}
		})
	});

	var self = this;
	var sessions = this.sessions
	return function(req, res, next) {
		var _url = url.parse(req.url, true)
		if (_url.pathname === '/frame5') {
			build(req, res, ['events', 'core', 'browser', 'config', 'stream', 'xhr', 'rpc', 'worker', 'long-poll', 'web-socket', 'web-sql', 'tmpl', 'init'])
		} else if (_url.pathname === '/frame5/worker') {
			res.sendfile(__dirname + '/client/worker-process.js')
		} else if (_url.pathname === '/frame5/new') {

			if (req.session.Session && self.sessions[req.session.Session]) {
				self.sessions[req.session.Session].clean()
				delete self.sessions[req.session.Session]
				delete req.session.Session;
				return res.json({
					pass : false
				});
			}

			var session = new Session();
			req.session.Session = session.id;
			self.sessions[session.id] = session;

			self.emit('new', session);
			res.json({
				pass : true,
				id : session.id
			});

		} else if (_url.pathname === '/frame5/socket') {
			if (req.session.Session && self.sessions[req.session.Session]) {
				self.sessions[req.session.Session].clean()
				delete self.sessions[req.session.Session]
				delete req.session.Session;
				return res.json({
					pass : false
				});
			}

			var session = new Session();
			req.session.Session = session.id;
			self.sessions[session.id] = session;

			self.emit('new', session);

			pending[session.id] = true
			res.json({
				pass : true,
				id : session.id
			});
		} else if (_url.pathname === '/frame5/send') {
			if (self.sessions[req.session.Session]) {

				self.sessions[req.session.Session].onData(req.body);

				res.json({
					pass : true
				});
			} else {
				res.json({
					pass : false
				});
			}
		} else if (_url.pathname === '/frame5/recv') {
			if (self.sessions[req.session.Session]) {
				self.sessions[req.session.Session].query(parseInt(_url.query.since, 10), function(err, data) {
					res.json(data);
				});
			} else {
				res.json({
					pass : false
				});
			}
		} else {
			next();
		}
	}
}
/*
 *
 *
 */

var start = '(function($, Frame5){';
var end = '})(this, this.Frame5);';

function build(req, res, files) {
	var text = '';
	text += start

	function loop(text) {

		var name = files.shift()
		if (name) {

			fs.readFile(__dirname + '/client/' + name + '.js', function(err, data) {
				if (err)
					throw err;
				//console.log(name)
				if (name === 'stream') {
					text += start
					text += data
					text += end
					streams(text, function(err, text) {

						loop(text)
					})
				} else {

					text += start
					text += data
					text += end
					loop(text)
				}
			});
		} else {

			text += end
			res.end(text)
		}
	}

	loop(text)
}

function streams(text, cb) {
	var files = ['split', 'event', 'json']
	function loop() {

		var name = files.shift()
		if (name) {

			fs.readFile(__dirname + '/streams/' + name + '.js', function(err, data) {
				if (err)
					throw err;
				text += start
				text += data
				text += end
				loop()
			});
		} else {
			cb(null, text)
		}
	}

	loop()
}
