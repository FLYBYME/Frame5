Frame5.define(['other'], function(other) {

	Frame5.requirePath('/')

	Frame5.requireWorker(['worker'])

	var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

	function pad(n) {
		return n < 10 ? '0' + n.toString(10) : n.toString(10);
	}

	function timestamp() {
		var d = new Date();
		return [d.getDate(), months[d.getMonth()], [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds()), (d.getTime() + "").substr(-4, 4)].join(':')].join(' ');
	};
	Frame5.Sql('home', '1.0', 'home site', 2 * 1024 * 1024);

	var chat_log = Frame5.sql.Model('chat_log', {
		name : 'TEXT',
		msg : 'TEXT',
		time : 'TEXT'
	});
	if (localStorage.name) {
		var name = localStorage.name
	} else {

		var name = prompt("Please enter your name", "Harry Potter");
	}
	chat_log.find('', {

	}, function(err, data) {
		for (var i = 0; i < data.length; i++) {

			log(data[i].time, data[i].msg, data[i].name);
		};
		logpanel.append("<p>-----------</p>");
		scrollToBottom();
	})
	$("#message").focus();

	var logpanel = $("#log");

	function sendmsg() {
		var msg = $("#message").val();

		Frame5.invoke('chat.msg', [msg, name], function() {
			$("#message").val("");
		})
	};
	$(window).bind("focus", function() {

		$("#message").focus();
	});
	$("#sendbtn").bind("click", function() {
		sendmsg();

	});

	$("#message").bind("keydown", function(e) {
		if (e.which == 13) {
			sendmsg();
		}
	})
	function scrollToBottom() {
		window.scrollBy(0, document.body.scrollHeight - document.body.scrollTop);
	};

	function log(time, data, userName) {
		logpanel.append("<p>" + time + ' <strong>' + userName + '</strong>' + ': ' + data + "</p>");
		scrollToBottom();
	};

	Frame5.expose('chat', {
		msg : function(msg, userName) {
			var time = timestamp()
			var self = this
			chat_log.insert({
				time : time,
				msg : msg,
				name : userName
			}, function(err, data) {
				log(time, msg, userName);
				self.send()
			})
		}
	})
});
