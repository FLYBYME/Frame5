Frame5.extend({
	connect : function() {
		if (this.com) {
			return this
		}
		if (Frame5.config.WebSocket && Frame5.browser.Features.WebSocket) {
			var w = this.com = new Frame5.WebSocket

			function newSession() {
				Frame5.xhr({
					url : '/frame5/socket'
				}).once('end', function(data) {
					if (!data.pass) {
						return newSession()
					}
					var id = data.id

					w.once('ready', function() {

						w.rpc.invoke('auth', [id], function(err) {
							if (err) {
								throw err.message
							}
							Frame5.emit('com', w.rpc)
						})
					})

					w.connect('ws://' + location.host + '/');

				})
			}

			newSession()
		} else {
			var w = this.com = new Frame5.Poll()
			w.once('ready', function() {
				Frame5.emit('com', w.rpc)
			})
			w.init()
		}
	},
	invoke : function(method, params, cb) {
		if (this.com) {
			this.com.rpc.invoke(method, params, cb)
		} else if (this.worker) {
			this.worker.rpc.invoke('system.com', [method, params], cb)
		} else {
			throw new Error('To use Frame5.invoke please inin the worker')
		}
	},
	Worker : function(process) {

		if (this.worker) {
			return this
		}

		var w = this.worker = new Frame5.WebWorker()

		w.once('ready', function() {
			console.log('on worker')
			Frame5.emit('worker', w.rpc)
		});
		if (process) {
			w.process()
		} else {

			if (Frame5.config.WebWorker && Frame5.browser.Features.WebWorker) {
				w.real()
			} else {
				w.fake()
			}
			return w
		}
	},
	Sql : function(name, version, bigName, size) {
		if (this.sql) {
			return this
		} else {
			this.sql = new Frame5.WebSql(name, version, bigName, size);
			return this
		}
	},
	init : function(cb) {
		var self = this
		this.once('worker', cb)
		this.Worker()
	}
})
