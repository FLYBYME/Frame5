function a(rpc) {
	rpc.expose('tmpl', {
		tmpl : function(name, html) {
			Frame5.tmpl.tmpl(name, data.html);
			this.send();
		},
		template : function(name, data) {
			this.send({
				html : Frame5.tmpl.template(name, data)
			});
		}
	});
}
