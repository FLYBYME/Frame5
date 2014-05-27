/************
 *
 *
 */

var Exposed = function(data, id, cb) {
	//
	this.id = data.id;
	this.method = data.method;
	this.params = data.params;
	this.from = data.from;
	this.callBack = cb;

	//
	this.result = {};
	this.err = {};
	this.hasSent = false;

};

Exposed.prototype.send = Exposed.prototype.end = function(data) {

	if (this.hasSent) {
		throw new Error('should not sent twice.');
	}

	if ( typeof data === 'object') {
		for (var key in data) {
			this.set(key, data[key]);
		}
	} else if (arguments.length >= 1) {
		this.set(arguments[0], arguments[1]);
	}
	if (this.err['code'])
		this.callBack({
			to : this.from,
			id : this.id,
			result : this.result,
			error : this.err['code'] ? this.err : null

		});
	else {
		this.callBack(null, {
			to : this.from,
			id : this.id,
			result : this.result,
			error : this.err['code'] ? this.err : null

		});
	}
	Frame5.logger('RPC ' + this.method + ' ID:' + this.id.split('-')[0] + ' FROM:' + this.from.split('-')[0] + ' call finished');
	this.hasSent = true;
	return this;
};
Exposed.prototype.add = Exposed.prototype.set = function(key, val) {
	this.result[key] = val;
	return this;
};
Exposed.prototype.get = function(key) {
	return this.result[key];
};
Exposed.prototype.error = function(msg, code) {
	this.err = {
		
		message : msg.stack ? msg.stack : msg,
		code : code || 1000,
		method : this.method,
		params : this.params
	};
	return this.send();
};

/**
 *
 */

/**
 * RPC-JSON style calls for partition.io
 * Originally taken from rpc-socket
 *
 * @param {Object} initialized peer
 *
 * @return {Object}
 */
var RpcModule = function(write, name) {

	var self = this;

	Frame5.EventEmitter.call(this);
	this.write = function(data) {
		write(data)
	}
	this.name = name;
	this.vows = {}
	this.id = Frame5.uuid()
	this.functions = {};
	this.counter = 0;

	this.on('request', this.requestEvent);

	var weReady = false;
	var theyeReady = false;

	this.expose('ready', function() {
		theyeReady = true;
		if (weReady && theyeReady) {
			self.emit('ready');
		}
		this.send();
	});

	this.ready = function() {
		weReady = true;
		self.invoke('ready', [], function() {
			if (weReady && theyeReady) {
				self.emit('ready');
				weReady = true
			}
		});
	};
	this.expose('list', function() {
		var list = [];
		for (var key in self.functions) {
			this.set(key, 'function');
		}
		this.set('Array', Object.keys(self.functions));
		this.send();
	});

}
/***
 * Make it an event
 */
Frame5.inherits(RpcModule, Frame5.EventEmitter);

/***
 * Write to the peer
 */
RpcModule.prototype.write = function(data) {

	//this.stream.send(data);

};
/***
 * Write to the peer
 */
RpcModule.prototype.handler = function(handler, exsosed, params) {
	setTimeout(function() {
		handler.apply(exsosed, params);
	}, 0)
};

/***
 * Expose modules to every peer
 * @param {String} Base name to the module
 * @param {Object|Function} The module. Can be a function for the
 * module to have onlt one method, or an Object for mulit methods.
 */
RpcModule.prototype.expose = function(mod, object) {
	if ( typeof (object) === 'object') {
		var funcs = [];
		var keys = Object.keys(object);
		for (var i = keys.length - 1; i >= 0; i--) {

			var funcObj = object[keys[i]];
			var funcName = keys[i]
			if ( typeof (funcObj) == 'function') {

				this.functions[mod + '.' + funcName] = funcObj;
				funcs.push(funcName);
			} else if ( typeof (funcObj) == 'object') {
				this.expose(mod + '.' + funcName, funcObj);
			}
		}

		//util.log(this.id.split('-')[0] + ' exposing module : ' + mod + ' [funs: ' + funcs.join(', ') + ']');
	} else if ( typeof (object) == 'function') {
		this.functions[mod] = object;
		//util.log(this.id.split('-')[0] + ' exposing ' + mod);
	}

	return this;
};
/***
 * Request event entry point for data
 */
RpcModule.prototype.requestEvent = function(data, cb) {
	////console.log(cb)

	if (!cb) {
		cb = this.write
	}

	if ((data.hasOwnProperty('result') || data.hasOwnProperty('error') ) && data.hasOwnProperty('id') && this.vows.hasOwnProperty(data.id)) {
		var vow = this.runVows(data);
		return this.handler(vow.handler, vow.exsosed, vow.params);
	}
	if (data.hasOwnProperty('error'))
		return;

	if (!data.hasOwnProperty('id'))
		return cb(this.runError(32600, null));

	if (!(data.hasOwnProperty('method') && typeof (data.method) === 'string'))
		return cb(this.runError(32600, data.id));

	if (!data.hasOwnProperty('params') && Array.isArray(data.params))
		return cb(this.runError(32602, data.id));

	if (!this.functions.hasOwnProperty(data.method))
		return cb(this.runError(32601, data.id));

	var result = this.runExpose(data, cb);

	Frame5.logger('RPC ' + data.method + ' ID:' + data.id.split('-')[0] + ' FROM:' + data.from.split('-')[0] + ' call start');
	return this.handler(result.handler, result.exsosed, result.params);
};
/***
 * Ready for the exposed methods to be called
 */
RpcModule.prototype.runExpose = function(data, cb) {

	var exsosed = new Exposed(data, this.id, cb);

	var handler = this.functions[data.method];

	this.counter++;

	return {
		params : data.params,
		handler : handler,
		exsosed : exsosed
	};
};
/***
 * We have a request return so deal with it.
 */
RpcModule.prototype.runVows = function(data) {

	var vow = this.vows[data.id];

	//
	delete this.vows[data.id];
	//
	return {
		params : [data.error, data.result, data.id],
		handler : vow.callBack,
		exsosed : this
	};
};
/***
 * An error so just return it.
 */
RpcModule.prototype.runError = function(code, id) {
	switch (code) {
		case 32700:
			return {
				'result' : null,
				'error' : {
					'message' : 'Parse error',
					'code' : code
				},
				'id' : id
			};
		case 32600:
			return {
				'result' : null,
				'error' : {
					'message' : 'Invalid Request',
					'code' : code
				},
				'id' : id
			};
		case 32601:
			return {
				'result' : null,
				'error' : {
					'message' : 'Method not found.',
					'code' : code
				},
				'id' : id
			};
		case 32602:
			return {
				'result' : null,
				'error' : {
					'message' : 'Invalid params.',
					'code' : code
				},
				'id' : id
			};
		case 32603:
			return {
				'result' : null,
				'error' : {
					'message' : 'Internal error.',
					'code' : code
				},
				'id' : id
			};
		default:
			return {
				'result' : null,
				'error' : {
					'message' : 'Server error.',
					'code' : 32000
				},
				'id' : id
			};
	}
};
/***
 * Invoke a method on the remote peer.
 */
RpcModule.prototype.invoke = function(method, params, callBack) {
	var id = Frame5.uuid();
	this.vows[id] = {
		method : method,
		params : params,
		callBack : callBack
	};

	this.counter++;
	this.write({
		id : id,
		method : method,
		params : params,
		from : this.id
	});
	return this;
};

Frame5.extend({
	Module : RpcModule
})
Frame5.logger('Frame5 RPC Module ready');
