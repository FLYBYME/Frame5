# Frame5 - HTML5 Framework

Moew coming soon!

Links
======
Main
	[frame5.info - Home](http://frame5.info)
	[heroku.com - Home](http://heroku.com)
Other
	[zeptojs.com](http://zeptojs.com)
	[jquery.com](http://jquery.com)


How to use
======


## The Server
~~~ js
var express = require('express');
var http = require('http');

var Frame5 = require('./lib')

var app = express.createServer()

app.use(Frame5(app))

app.use(express.favicon())
app.use(express.logger('dev'))
app.use(express.static('public'))
app.use(express.directory('public'))
app.use(express.cookieParser())

app.use(express.session({
	secret : 'my secret here'
}))
app.get('/test', function(req, res) {
	res.send('test')
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

	</body>
</html>

~~~