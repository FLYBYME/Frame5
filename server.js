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
