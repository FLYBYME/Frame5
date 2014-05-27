/****
 *
 *
 */
var Poll = function(f) {
	Frame5.EventEmitter.call(this);
	var self = this;
	var buff = this.buffer = []
	this.isSending = false
	this.isReciving = false
	this.isClsoed = false
	this.time = Date.now()
	this.rpc = new Frame5.Module(function(data) {
		self.send(data)
	})
	this.rpc.on('ready', function() {
		Frame5.emit('rpc', self.rpc)
	});

}

Frame5.inherits(Poll, Frame5.EventEmitter);

Poll.prototype.init = function() {
	var self = this;
	Frame5.xhr({
		url : '/frame5/new'
	}).on('end', function(data) {
		if (!data.pass) {
			return self.init()
		}

		self.recv()
		self.send()
		self.emit('ready')
	})
}
Poll.prototype.close = function() {
	this.isClsoed = true
}
Poll.prototype.open = function() {
	this.isClsoed = false
	this.recv()
	this.send()
}
Poll.prototype.send = function(data) {
	if (data) {
		this.buffer.push(data)
	}

	if (this.isClsoed)
		return;

	if (this.isSending)
		return;
	if (!this.buffer.length) {
		return;
	}
	this.isSending = true;
	var buff = [];

	while (this.buffer.length && buff.length < 100) {
		buff.push(this.buffer.shift())
	};
	var self = this;
	Frame5.xhr({
		url : '/frame5/send',
		data : {
			data : buff
		},
		method : 'post'
	}).on('end', function(data) {
		self.time = Date.now()
		self.isSending = false
		self.send()
	})
}

Poll.prototype.bench = function() {
	if (!this.isBenching) {
		this.isBenching = true;
		var self = this;
		function batch(j, cb) {
			var now = new Date
			var k = 0

			function fb() {
				k++;
				if (k <= j) {

					var then = new Date

					console.log('took ' + (then - now) + '/ms to do ' + j + 'requests')

					return cb()
				}
				self.rpc.invoke('list', [], fb)
			}

			for (var i = 0; i <= j; i++) {
				self.rpc.invoke('list', [], fb)
			};
		}

		function cb() {

			batch(1000, cb)
		}

		batch(1000, cb)
		batch(1000, cb)
	}

}

Poll.prototype.recv = function() {
	if (this.isClsoed)
		return;
	if (this.isReciving)
		return;
	this.isReciving = true
	var self = this;
	var err = false
	Frame5.xhr({
		url : '/frame5/recv?since=' + self.time
	}).on('error', function(error) {
		console.log(error)
		err = true
	}).on('end', function(data) {
		function write(err, data) {
			if (err) {
				self.send(err)
			} else {
				self.send(data)
			}

		}

		for (var i = 0; i < data.length; i++) {
			self.rpc.requestEvent(data[i].data, write)
		};

		self.isReciving = false
		if (err) {
			setTimeout(function() {

				self.recv()
			}, 5000)
		} else {

			self.recv()
		}
	})
}
Frame5.logger('Frame5 logn-poll ready');
Frame5.extend({
	Poll : Poll
})