# Frame5 - HTML5 Framework

Frame5 is an attempt creating an HTML5 framework. Under the umbrella 
standard HTML5 a lot of technological are at play. Frame5's goal is 
to bring together as many of the specs as it can.




Wish List
======

## Have
* [Web SQL Database](http://www.w3.org/TR/webdatabase/)
* [Web Worker](http://www.whatwg.org/specs/web-apps/current-work/multipage/workers.html)
* [Web sockets](http://www.whatwg.org/specs/web-apps/current-work/multipage/network.html)

## Need
* [Indexed Database API](http://www.w3.org/TR/IndexedDB/)
* [Web Storage](http://www.w3.org/TR/webstorage/)
* [Canvas Element](http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html)

Links
======
Main
* [frame5.info - Home](http://frame5.info)
* [heroku.com - Home](http://heroku.com)
Other
* [zeptojs.com](http://zeptojs.com)
* [jquery.com](http://jquery.com)


How to use
======


## The Server
Install with NPM
~~~
npm install frame5
~~~


~~~ js
var express = require('express');
var Frame5 = require('../');

var app = module.exports = express.createServer(express.static(__dirname));

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
~~~



## The Client
~~~ html


<!DOCTYPE html>
<html>

	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<title>Frame5</title>
		<script src="http://code.jquery.com/jquery-1.7.1.min.js"></script>
		<script src="/frame5"></script>
	</head>

	<body>
	<script>
		console.log(Frame5);
	</script>
	</body>
</html>

~~~

Versioning
----------

Releases will be numbered with the follow format:

`<major>.<minor>.<patch>`

And constructed with the following guidelines:

* Breaking backward compatibility bumps the major (and resets the minor and patch)
* New additions without breaking backward compatibility bumps the minor (and resets the patch)
* Bug fixes and misc changes bumps the patch

For more information on SemVer, please visit http://semver.org/.

