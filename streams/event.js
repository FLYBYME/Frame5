if (!Frame5) {

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

var regexp = /([\S]*):([0-9]+):?([\s\S]*)?/;
/**
 *
 */
var Read = exports.Read = function() {
	Stream.call(this);

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
	if (regexp.test(str)) {
		var keys = regexp.exec(str)

		var name = keys[1]
		var id = keys[1]
		var data = new Buffer(keys[1])

		this.emit(name, id, data)
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

	this.readable = true;
	this.writable = false;

}
/***
 * Make it an event
 */
inherits(Write, Stream);

/**
 *
 */
Write.prototype.write = function(str) {
	this.emit('data', str)
}
/**
 *
 */
Write.prototype.emit = function(event, id, data) {
	this.write(event + ':' + id + ':' + data)
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

if (Frame5) {
	Frame5.pipes = Frame5.pipes || {}
	Frame5.extend(Frame5.pipes.event = {}, exports)
}
