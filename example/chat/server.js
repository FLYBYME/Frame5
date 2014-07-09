var express = require('express');
var Frame5 = require('../../');

var app = express.createServer(express.static(__dirname));

var f5 = new Frame5(app);

f5.on('rpc', function(rpc) {
	rpc.expose('chat', {
		msg : function(msg, name) {
			var self = this;
			rpc.broadcast('chat.msg', [msg, name], function() {
				self.send();
			});
		}
	});
	rpc.ready();
});

app.listen(8080);
