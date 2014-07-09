Frame5.extend({
	config : {
		WebWorker : true
	},
	configure : function(config) {
		for (key in config) {
			if (Frame5.config[key])
				Frame5.config[key] = config[key];
		}
	}
});

