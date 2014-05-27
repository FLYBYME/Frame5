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
var jsp = require("uglify-js").parser;
var pro = require("uglify-js").uglify;

var IO = require('socket.io');

/***
 * uuid
 */
var json = require('../streams/json');

var split = require('../streams/split');
var uuid = require('./utils').uuid;

var Module = require('./rpc');

var Frame5 = module.exports = function(app) {
	events.EventEmitter.call(this);
	this.app = app;
	this.init()
}
//
util.inherits(Frame5, events.EventEmitter);
//
Frame5.prototype.init = function() {
	this.app.use(function(req, res, next) {

		var _url = url.parse(req.url, true);
		if (_url.pathname === '/frame5') {
			build(req, res, ['events', 'socket.io', 'core', 'browser', 'config', 'stream', 'xhr', 'rpc', 'worker', 'io', 'web-sql', 'tmpl', 'init', 'require']);
		} else if (_url.pathname === '/frame5/worker') {
			fs.readFile(__dirname + '/../client/worker-process.js', function(err, data) {
				if (err)
					throw err;
				res.setHeader("Content-Type", "application/javascript");
				res.end(data)
			});
		} else {
			next();
		}

	});

	this.app.once('listening', this.initSocket.bind(this));
};
//
Frame5.prototype.initSocket = function() {
	var self = this;
	var app = this.app;

	var io = this.io = IO.listen(app);

	var sockets = {};

	io.sockets.on('connection', function(socket) {
		var isAilve = true;
		var module = new Module(function(data) {
			socket.emit('rpc', data);
		});
		module.socket = socket;
		module.broadcast = function(method, params, cb) {
			var j = 0
			var k = 0
			var d = []
			for (var id in sockets) {
				j++
				(function(m) {
					m.invoke(method, params, function(err, data) {
						k++
						d.push({
							error : err,
							data : data
						});
						if (k === j) {
							cb(null, d)
						}
					});
				})(sockets[id]);
			}
			if (j == 0) {
				cb()
			}
		};
		sockets[module.id] = module;

		socket.on('disconnect', function() {
			module.emit('exit');
			;
			delete sockets[module.id];
		});
		socket.on('rpc', function(data) {
			module.requestEvent(data, function write(err, result) {
				if (err)
					socket.emit('rpc', err);
				else
					socket.emit('rpc', result);
			});
		});
		self.emit('rpc', module);
	});
	io.configure(function() {
		//io.set("transports", ["xhr-polling"]);
		//io.set("polling duration", 50);
		io.set('log level', 0);
	});
	this.emit('listening');
};

var start = '(function($, Frame5){\n\n';
var end = '\n\n})(this, this.Frame5);\n\n';

function build(req, res, files) {
	var text = '';
	text += start;

	function loop(text) {

		var name = files.shift();
		if (name) {

			fs.readFile(__dirname + '/../client/' + name + '.js', function(err, data) {
				if (err)
					throw err;
				//console.log(name)
				if (name === 'stream') {
					text += start;
					text += data;
					text += end;
					streams(text, function(err, text) {

						loop(text);
					});
				} else {

					text += start;
					text += data;
					text += end;
					loop(text);
				}
			});
		} else {

			text += end;
			res.setHeader("Content-Type", "application/javascript");
			if (false) {
				var ast = jsp.parse(text);
				ast = pro.ast_mangle(ast);
				ast = pro.ast_squeeze(ast);
				var final_code = pro.gen_code(ast);
				res.end(final_code)
			} else {
				res.end(text)

			}
		}
	}

	loop(text);
}

function streams(text, cb) {
	var files = ['split', 'event', 'json'];
	function loop() {

		var name = files.shift()
		if (name) {

			fs.readFile(__dirname + '/../streams/' + name + '.js', function(err, data) {
				if (err)
					throw err;
				text += start;
				text += data;
				text += end;
				loop();
			});
		} else {
			cb(null, text);
		}
	}

	loop();
}