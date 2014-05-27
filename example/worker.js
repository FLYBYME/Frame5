Frame5.define(['other'], function(other) {
	
	
	
	
	
	Frame5.worker.expose('test', function() {
		this.send({
			worker : true,
			other : other
		})
	})
})
