var url = require('url');
var regexp = /^\/([^\/]+)\/?([^\/]+)?$/
exports = module.exports = function static(app) {
	var parts = []
	return function static(req, res, next) {

		var exec = regexp.exec(req.url)

		if (exec && exec[1] === 'frame5') {

			if (req.query.parts) {
				if (Array.isArray(req.query.parts)) {

					for (var i = 0; i < req.query.parts.length; i++) {
						
						if (!!~parts.indexOf(req.query.parts[i])) {

						}
					};

				}
			} else {
				next()
			}

			if (!!~parts.indexOf('a')) {

			}
		} else {
			next()
		}

	};
};
