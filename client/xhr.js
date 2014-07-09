Frame5.extend({
	xhr : function(options) {

		var request = new Frame5.EventEmitter();

		if (!options.url) {

			setTimeout(function() {
				request.emit('error', new Error('options.url is needed.'))
			}, 1)
			return request;
		}

		var req = new XMLHttpRequest();
		request.xhr = req
		var method = options.method || 'get';
		var url = options.url;
		var async = ( typeof options.async != 'undefined' ? options.async : true);

		var params = (options.data && method.toLowerCase() === 'post') ? (function() {
			try {
				return JSON.stringify(options.data)
			} catch(err) {
				return JSON.stringify({})
			}
		})() : null;
		//
		var headers = options.headers || {};
		req.queryString = params;
		req.open(method, url, async);
		//
		req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

		if (method.toLowerCase() == 'post')
			req.setRequestHeader('Content-Type', 'application/json');

		for (key in headers) {
			if (headers.hasOwnProperty(key)) {
				req.setRequestHeader(key, headers[key]);
			}
		}
		req.onabort = req.onerror = function() {
			console.log('onerror')
			request.emit('error')
		};
		function hdl() {
			if (req.readyState == 4) {

				if ((/^[20]/).test(req.status)) {
					request.responseText = req.responseText;
					request.status = req.status;

					var json;
					try {
						json = JSON.parse(req.responseText)
					} catch(err) {
						return request.emit('error', err, req)
					}
					request.emit('end', json, req)

				}
				if ((/^[45]/).test(req.status))
					request.emit('error', req.responseText, req)
				if (req.status === 0)
					request.emit('abort', options, req)
			}
		}

		if (async) {
			req.onreadystatechange = hdl;
		}
		req.send(params);
		if (!async)
			hdl();
		return request;
	}
});

Frame5.logger('Frame5 XHR ready'); 