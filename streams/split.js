var _ = typeof Frame5 === 'object'

if (!_) {

	/***
	 * Node modules
	 */

	var EventEmitter = require('events').EventEmitter;
	var Stream = require('stream');
	var inherits = require('util').inherits;
	//
	exports = module.exports = {}
} else {

	var EventEmitter = Frame5.EventEmitter;
	var Stream = Frame5.Stream;
	var inherits = Frame5.inherits;
	var exports = {}
}

/**
 *
 */
var Read = exports.Read = function() {
	Stream.call(this);
	this.buffer = []

	this.readable = this.writable = true;

}
/***
 * Make it an event
 */
inherits(Read, Stream);

/**
 *
 */
Read.prototype.write = function(str) {
	////console.log('split.Read', str)
	if (str.indexOf('\n') > -1) {

		var message = this.buffer.join('');
		var data = str.split('\n');
		message += data.shift();

		this.buffer = [];

		this.emit('data', message);

		data = data.join('\n');

		if (data.length) {
			this.write(data);
		}
	} else {
		this.buffer.push(str);
	}
}
/**
 *
 */
Read.prototype.end = function(str) {
	if (str) {
		this.write(str)
	}
	this.emit('end')
};

/**
 *
 */
var Write = exports.Write = function() {
	Stream.call(this);
	this.buffer = []

	this.readable = this.writable = true;

}
/***
 * Make it an event
 */
inherits(Write, Stream);

/**
 *
 */
Write.prototype.write = function(str) {
	////console.log('split.Write', str)
	this.emit('data', str + '\n')
}
/**
 *
 */
Write.prototype.end = function(str) {
	if (str) {
		this.write(str)
	}
	this.emit('end')
};
if (_) {
	Frame5.pipes = Frame5.pipes || {}
	Frame5.extend(Frame5.pipes.split = {}, exports)
}