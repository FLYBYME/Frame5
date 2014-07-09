/**
 *
 *
 *
 */

function WebWorker() {
	Frame5.EventEmitter.call(this);
}

Frame5.inherits(WebWorker, Frame5.EventEmitter);

WebWorker.prototype.fake = function(main) {
	var self = this;
	
	Frame5.logger('Frame5 FAKE WebWorker init');
	
	var worker = this.worker = new Frame5.Module(function(data) {
		master.requestEvent(data, function(err, data) {
			if (err)
				master.write(err);
			else
				master.write(data);
		});
	}, 'worker');
	
	var master = this.rpc = new Frame5.Module(function(data) {
		worker.requestEvent(data, function(err, data) {
			if (err)
				worker.write(err);
			else
				worker.write(data);
		});
	}, 'master');

	this.exposeSystem(worker);

	Frame5.logger('Frame5 FAKE WebWorker ready');

	this.load = function(fn, cb) {
		fn(worker);
		cb();
	};

	master.once('ready', function() {
		self.emit('ready');
	});
	
	master.ready();

};

WebWorker.prototype.exposeSystem = function(worker) {
	worker.expose('system', {
		com : function(method, params) {
			var exposed = this;
			Frame5.invoke(method, params, function(err, data) {
				if (err) {
					exposed.error(err);
				} else {
					exposed.send(data);
				}
			});
		},
		sql : {
			Model : function(tableName, fields) {

				if (Frame5.sql[tableName]) {
					return this.send();
				}

				Frame5.sql.Model(tableName, fields);
				this.send();
			},
			init : function(shortName, version, displayName, maxSize) {
				if (Frame5.sql) {
					return this.send();
				}
				new Frame5.Sql(shortName, version, displayName, maxSize);
				this.send();
			}
		},
		modules : function(modules) {
			var exposed = this;
			Frame5.require(modules, function() {
				exposed.send();
			});
		},
		path : function(path) {
			Frame5.requirejs.config({
				baseUrl : path
			});
		}
	});

	Frame5.on('com', function(_rpc) {
		_rpc.once('ready', function(_rpc) {
			worker.ready();
		});
		_rpc.ready();
	});
	Frame5.connect();
};

WebWorker.prototype.invoke = function(method, params, callBack) {
	this.rpc.invoke(method, params, callBack);
};

WebWorker.prototype.process = function() {
	var rpc = this.rpc = new self.Frame5.Module(function(data) {
		self.postMessage(data);
	});

	self.addEventListener('message', function(e) {
		rpc.requestEvent(e.data, function(err, data) {
			if (err) {
				self.postMessage(err);
			} else {
				self.postMessage(data);
			}
		});
	}, false);

	this.exposeSystem(rpc);

};

WebWorker.prototype.expose = function(name, fn) {
	if (this.worker)
		this.worker.expose(name, fn);
	else {
		this.rpc.expose(name, fn);
	}
};

WebWorker.prototype.real = function() {
	var self = this;
	Frame5.logger('Frame5 REAL WebWorker init');

	var rpc = this.rpc = new Frame5.Module(function(data) {
		worker.postMessage(data);
	});
	
	rpc.expose('logger', function(msg) {
		Frame5.logger(msg, true);
	});
	
	var worker = new Worker('/frame5/worker');

	worker.addEventListener('message', function(e) {
		rpc.requestEvent(e.data, function(err, data) {
			if (err) {
				worker.postMessage(err);
			} else {
				worker.postMessage(data);
			}
		});
	}, false);

	rpc.on('ready', function() {
		self.emit('ready');
	});
	
	rpc.ready();
};

Frame5.logger('Frame5 WebWorker ready');

Frame5.extend({
	WebWorker : WebWorker
});
