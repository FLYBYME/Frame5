var express = require('express');
var http = require('http');

var Frame5 = require('./frame5');

var frame5 = new Frame5()

var app = express.createServer();

app.use(express.bodyParser());
app.use(express.cookieParser('shhhh, very secret'));
app.use(express.session({
	secret : "string",
	cookie : {
		maxAge : 600000000000
	}
}));

app.use(express.static(__dirname + '/tests'));

app.server = app.listen(3000)


app.use(frame5.use(app));


app.get('/test', function(req, res) {
	res.send('test');
});
