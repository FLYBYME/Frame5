function Io() {
	Frame5.EventEmitter.call(this);
}

Frame5.inherits(Io, Frame5.EventEmitter);

Io.prototype.connect = function(url) {
	if (this.conn) {
		return this;
	} else {
		var self = this;
		var conn = this.conn = io.connect('');

		var rpc = this.rpc = new Frame5.Module(function(data) {
			conn.emit('rpc', data);
		});

		function onRead(data) {
			rpc.requestEvent(data, function(err, data) {
				if (err)
					conn.emit('rpc', err);
				else
					conn.emit('rpc', data);
			});
		};

		conn.on('rpc', onRead);

		conn.socket.on('error', function(reason) {
			console.error('Unable to connect Socket.IO', reason);
		});

		conn.on('connect', function() {
			self.emit('ready');
			Frame5.emit('com', rpc);
		});
		conn.on('disconnect', function() {
			self.emit('exit');
			rpc.emit('exit');
		});
	}
};
Frame5.extend({
	Io : Io
});
