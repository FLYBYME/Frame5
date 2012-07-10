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
var http = require('http');

var Frame5 = require('frame5')

var app = express.createServer()


app.use(express.favicon())
app.use(express.logger('dev'))
app.use(express.cookieParser())

app.use(express.session({
	secret : 'my secret here'
}))


app.use(Frame5(app))


app.get('/test', function(req, res) {
	res.sendfile('./test.html')
})

app.listen(3000);

~~~



## The Client
~~~ html


<!DOCTYPE html>
<html>

	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<title>Frame5</title>
		
		<!--
		//
		//
		//
		-->
		
		<script src="http://code.jquery.com/jquery-1.7.1.min.js"></script>
		
		<!--
		//
		//
		//
		-->
		
		<script src="/frame5"></script>

		<!--
		//
		//
		//
		-->
	</head>

	<body>
	<script>
		console.log(Frame5);
	</script>
	</body>
</html>

~~~