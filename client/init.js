Frame5.extend({
	connect : function() {
		if (this.com) {
			return this
		}
		var w = this.com = new Frame5.Io
		w.connect()

	},
	invoke : function(method, params, cb) {
		if (this.com) {
			this.com.rpc.invoke(method, params, cb)
		} else if (this.worker) {
			this.worker.rpc.invoke('system.com', [method, params], cb)
		} else {
			throw new Error('To use Frame5.invoke please init the worker')
		}
	},
	expose : function(a, b) {
		if (this.com) {
			this.com.rpc.expose(a, b)
		} else if (this.worker) {
			this.worker.rpc.expose(a, b)
		} else {
			throw new Error('To use Frame5.invoke please init the worker')
		}
	},
	Worker : function(process) {

		var w = this.worker = new Frame5.WebWorker()

		w.once('ready', function() {
			console.log('on worker')
			Frame5.emit('worker', w.rpc)
		});

		if (process === true) {
			w.process()
		} else {

			if (Frame5.config.WebWorker && Frame5.browser.Features.WebWorker) {
				w.real(process)
			} else {
				w.fake(process)
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
	init : function(main) {
		this.ready(function() {

			Frame5.connect()
			Frame5.once('worker', function() {
				Frame5.require([main])
			})
			Frame5.Worker()
		})
	},
	_requirePath : '/',
	requirePath : function(path, cb) {
		Frame5.requirejs.config({
			baseUrl : path
		});
		this.worker.invoke('system.path', [path], function() {
			cb && cb()
		})
	},
	requireWorker : function(modules, cb) {
		if (!Array.isArray(modules))
			throw new Error('Frame5.requireWorker requires an array of modules to load')

		this.worker.invoke('system.modules', [modules], function() {
			cb && cb()
		})
	}
})
