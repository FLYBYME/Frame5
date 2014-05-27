var mapObj = function(obj, target) {
	target || ( target = obj);
	var key, keys = [], vals = [], newObj = {}, v;
	for (key in target) {
		if (Object.hasOwnProperty.call(target, key) && obj[key] !== undefined) {
			v = newObj[key] = obj[key];
			keys.push(key);

			if (target[key] === 'JSON')
				v = JSON.stringify(v);
			vals.push(v);
		}
	}
	return {
		keys : keys,
		values : vals,
		obj : newObj
	};
};

var WebSql = function(shortName, version, displayName, maxSize) {
	try {
		this.db = openDatabase(shortName, version, displayName, maxSize);

		if (Frame5.worker) {
			Frame5.worker.invoke('syste.sql.init', [shortName, version, displayName, maxSize], Frame5.nope)
		}
	} catch(e) {
		console.log(e);
	}
};

function Model(tableName, fields, db) {
	this.tableName = tableName;
	this.fields = fields;
	this.db = db
	var columns = []
	for (var name in fields) {
		columns.push("`" + name + "` " + fields[name]);
	}
	var sql = "CREATE TABLE IF NOT EXISTS `" + tableName + "` (" + columns.join(", ") + ")";

	this.execute(sql, [], Frame5.nope, Frame5.nope);

	if (Frame5.worker) {
		Frame5.worker.invoke('syste.sql.Model', [tableName, fields], Frame5.nope)
	}

};
Model.prototype.execute = function(f, b, g) {
	this.db.transaction(function(k) {
		k.executeSql(f, b, function(f, a) {

			var h = [];
			if (0 < a.rows.length)
				for (var d = 0, b = a.rows.length; d < b; d++) {
					var i = a.rows.item(d), j = {}, e;
					for (e in i) {
						var c = i[e];
						j[e] = "" !== c && !isNaN(c) ? Number(c) : c
					}
					h.push(j)
				}
			g(null, h)
		}, function(b, a) {
			g(a)
		})
	})
};
Model.prototype.insert = function(obj, cb) {
	var data = mapObj(obj, this.fields);

	var val = [];

	var keys = data.keys.map(function(k) {
		val.push('?');
		return "`" + k + "`";
	});

	var sql = "INSERT INTO `" + this.tableName + "` (" + keys.join(", ") + ") VALUES (" + val.join(", ") + ")";
	//console.log(sql)
	this.execute(sql, data.values, cb);
}

Model.prototype.find = function(keys, conditions, cb) {

	var self = this
	var con = [];
	var vals = [];
	for (var k in conditions) {
		con.push(k + ' = ?');
		vals.push(conditions[k])
	}
	if (keys === '')
		keys = '*';
	if (con.length) {
		var sql = "SELECT " + keys + " FROM `" + this.tableName + "` WHERE " + con.join(" ");
	} else {
		var sql = "SELECT " + keys + " FROM `" + this.tableName + "` " + con.join(" ");
	}

	this.execute(sql, vals, cb);
}

Model.prototype.findLimit = function(keys, conditions, from, to, cb) {

	var self = this
	var con = [];
	var vals = [];
	for (var k in conditions) {
		con.push(k + ' = ?');
		vals.push(conditions[k])
	}
	if (keys === '')
		keys = '*';
	if (con.length) {
		var sql = "SELECT " + keys + " FROM `" + this.tableName + "` WHERE " + con.join(" ");
	} else {
		var sql = "SELECT " + keys + " FROM `" + this.tableName + "` " + con.join(" ");
	}
	sql += '  LIMIT ' + from + ', ' + to
	this.execute(sql, vals, cb);
}

Model.prototype.update = function(where, obj, cb) {
	var data = mapObj(obj, this.fields);
	var set = [];
	data.keys.forEach(function(k, i) {
		set.push("`" + k + "` = ?");
	});
	var _where = []
	for (var key in where) {
		_where.push(key + '="' + where[key] + '"')
	}
	var sql = "UPDATE `" + this.tableName + "` SET " + set.join(", ") + " WHERE " + _where.join(' AND ');
	this.execute(sql, data.values, cb);
}

Model.prototype.all = function(cb) {
	this.find('*', {}, cb);
}

Model.prototype.remove = function(where, cb) {
	var _where = []
	for (var key in where) {
		_where.push(key + '="' + where[key] + '"')
	}
	var sql = "DELETE FROM `" + this.tableName + "` WHERE " + _where.join(' AND ');
	this.execute(sql, [], cb);
}

Model.prototype.drop = function(cb) {
	var sql = "DELETE FROM `" + this.tableName + "` ";
	this.execute(sql, [], cb);
}
/**
 *
 *
 *
 *
 *
 */
WebSql.prototype.Model = function(tableName, fields) {
	var model = new Model(tableName, fields, this.db)

	this[tableName] = model
	return model

}

Frame5.extend({
	WebSql : WebSql
})