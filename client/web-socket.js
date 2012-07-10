function WebSocketRpc() {
	Frame5.EventEmitter.call(this)

}

Frame5.inherits(WebSocketRpc, Frame5.EventEmitter)

WebSocketRpc.prototype.connect = function(url) {
	if (this.conn) {
		return this;
	} else {
		var self = this
		var conn = this.conn = new WebSocket(url);

		if (this.rpc) {
			var rpc = this.rpc
			rpc.write = onJson
		} else {

			var rpc = this.rpc = new Frame5.Module(onJson);
		}
		function onJson(data) {
			jsonWrite.write(data)
		}

		function onRead(data) {
			rpc.requestEvent(data, function(err, data) {
				if (err)
					jsonWrite.write(err)
				else
					jsonWrite.write(data)
			})
		}

		function onWrite(message) {
			conn.send(message)
		}

		function clean() {
			Frame5.logger("WebSocket clean");
			delete self.conn

			jsonRead.removeListener('data', onRead);
			splitWrite.removeListener('data', onWrite);
			rpc.write = function() {

			}
		}


		conn.onerror = clean;

		conn.onclose = clean;

		conn.onopen = function() {
			Frame5.logger("WebSocket opened");
			self.emit('ready')
		};
		var jsonRead = new Frame5.pipes.json.Read()
		var splitRead = new Frame5.pipes.split.Read()

		splitRead.pipe(jsonRead);

		var jsonWrite = new Frame5.pipes.json.Write()
		var splitWrite = new Frame5.pipes.split.Write()

		jsonWrite.pipe(splitWrite)

		jsonRead.on('data', onRead);
		splitWrite.on('data', onWrite);

		conn.onmessage = function(evt) {

			splitRead.write(evt.data)
		};

	}
}
Frame5.extend({
	WebSocket : WebSocketRpc
})
