
function getHashGenerate():string {
	return Math.round( Math.random() * 1e36 ).toString(36);
}
// Cursor holds the query result and has some modifiers.
export class MongoCursor {
	results: any[];
	constructor(results: any[]) {
		this.results = results;
	}
	sort(options): MongoCursor {
		function sort_by_fields(a, b) {
			for (var s in options) {
				if(a[s] > b[s])
					return options[s];
				if(a[s] < b[s])
					return -options[s];
			}
			return 0;
		}
		return new MongoCursor(this.results.sort(sort_by_fields));
	}
	toArray(callback: (err, results: any[]) => any) {
		callback(null, this.results);
	}
	count(callback: (err, count: number) => any) {
		if(callback)
			callback(null, this.results.length);
		return this.results.length;
	}
	limit(n): MongoCursor {
		this.results = this.results.slice(0, n);
		return this;
	}
	skip(n): MongoCursor {
		this.results = this.results.slice(n);
		return this;
	}
	snapshot() {
		throw new Error("not implemented");
	}
	rewind() {
		throw new Error("not implemented");
	}
	nextObject() {
		throw new Error("not implemented");
	}
	each() {
		throw new Error("not implemented");
	}
}

// http://docs.mongodb.org/manual/reference/operator/query/
// QuerySelector has various selectors witch picks up the documents you hope from a collection. 
export class QuerySelector {
	query_selectors = {};
	constructor() {
		this.query_selectors = {
			// Comparison
			'$gt': this.cr_gt,
			'$gte': this.cr_gte,
			'$lt': this.cr_lt,
			'$lte': this.cr_lte,
//			'$gt': this.cr_every(this.cr_gt),
//			'$gte': this.cr_every(this.cr_gte),
//			'$lt': this.cr_every(this.cr_lt),
//			'$lte': this.cr_every(this.cr_lte),
			'$in': this.cr_in,
			'$nin': this.cr_nin,
			// Logical
			'$and': this.cr_and,
			'$or': this.cr_or,
			'$not': this.cr_not,
			'$nor': this.cr_nor,
			// Logical
			'$exists': this.cr_exists,
			'$type': this.cr_noimp,
			// Evaluation
			'$mod': this.cr_noimp,
			'$regex': this.cr_noimp,
			'$where': this.cr_where,
			// Geospatial
			'$geoWithin': this.cr_noimp,
			'$geoIntersects': this.cr_noimp,
			'$near': this.cr_noimp,
			'$nearSphere': this.cr_noimp,
			// Array
			'$all': this.cr_all,
			'$elemMatch': this.cr_elemMatch,
			'$size': this.cr_size,
			'$allArray': this.cr_noimp,
			'$elemMatchArray': this.cr_noimp,
			'$sizeArray': this.cr_noimp,
		};
	}
//	match_first = {};
	run(x, criteria, field='') {
		if(typeof(criteria) == 'function') {
			return this.cr_where(x, criteria);
		}
		var self = this;
		return Object.keys(criteria).every(function(c, i, keys) {
//console.log("keys:", x, c, criteria[c]);
			if(self.query_selectors[c]) {
				var qs = self.query_selectors[c];
				if(x instanceof Array && !self.query_selectors[c+'Array']) {
//console.log("some:", x, c, criteria[c]);
					return x.some(function(xe) {
						var result = self.run(xe, criteria);
//						if(result) self.match_first[field] = xe;
						return result;
					});
				}
				// {field: {$gt: threshold}
				return qs.call(self, x, criteria[c]);
			} else if(c.indexOf('.') > 0) {
				// {"parent.child": sub_criteria}
				var parent = c.split('.', 1)[0];
				var child = c.substring(parent.length+1);
				var sub_criteria = {};sub_criteria[child] = criteria[c];
				return self.run(x[parent], sub_criteria, field+'.'+parent);
			} else if(typeof(criteria[c]) != 'object') {
				// {a:10}
				return x[c] == criteria[c];
			}
			// {a:{$gt:10}}
			return self.run(x[c], criteria[c], field+'.'+c);
		});
	}
	// Comparison
	cr_gt(x,c):bool {return x > c;}
	cr_gte(x,c):bool {return x >= c;}
	cr_lt(x,c):bool {return x < c;}
	cr_lte(x,c):bool {return x <= c;}
	cr_in(x,a:Array):bool {return a.indexOf(x) >= 0;}
	cr_nin(x,a:Array):bool {return a.indexOf(x) == -1;}
	
	// Logical
	cr_and(x,a:Array):bool {return a.every(this.cr_run_array(x)); }
	cr_or(x,a:Array):bool {return a.some(this.cr_run_array(x)); }
	cr_not(x,c):bool {return !this.cr_run(x, c); }
	cr_nor(x,a:Array):bool {return !a.some(this.cr_run_array(x)); }
	
	// Element
	cr_exists(x,c):bool {return c ^ (x === undefined);}
	
	// Evaluation
	cr_where(x,c):bool {
		switch(typeof(c)) {
		case 'function':
			return c.call(x);
		case 'string':
			var obj = x;
			var func_eval = function(c) {return eval(c);};
			return func_eval.call(x, c);
		}
		return false;
	}
	
	// Array
	cr_every(cr): (x,c,f:string)=>string {
		return function(x,c,f:string) {
console.log("cr_every:",x,c,f);
			if(x[f] instanceof Array) {
				return x[f].some(function(e,i,a){
console.log("e:",a,i,f, cr(a,c,i));
					return cr(a,c,i);});
			} else {
				return cr(x,c,f);
			}
		};
	}
	cr_all(x,a:Array):bool {return a.every(function(e){return x.indexOf(e) >= 0;}); }
	cr_elemMatch(x,c):bool {
		var self:QuerySelector = this;
		return x.some(function(element, index, array) {return self.cr_run(element, c)});
	}
	cr_size(x,c):bool {return x.length == c; }
	
	// Virtual
	cr_run(x,c):bool {return this.run(x, c);}
	cr_run_array(x) {
		var self:QuerySelector = this;
		return function(element, index, array) {return self.cr_run(x, element)};
	}
	cr_noimp(){throw new Error("not implemented");}
}
// http://docs.mongodb.org/manual/reference/operator/query/
export class UpdateOperator {
	update_operators = {};
	inserting = false;// when update() creates a new document
	upsert = false; // update({query}, {document}, {upsert: true}) 
	constructor(options?) {
		this.update_operators = {
			// Fields
			'$inc': this.cr_inc,
			'$rename': this.cr_rename,
			'$setOnInsert': this.cr_setOnInsert,
			'$set': this.cr_set,
			'$unset': this.cr_unset,
		};
		this.prepare(options);
	}
	prepare(options?):UpdateOperator {
		if(!options) options={};
		this.upsert = options.upsert;
		this.inserting = false;
		return this;
	}
	run(x, criteria, updater?) {
		var self = this;
		return Object.keys(criteria).forEach(function(c, i, keys) {
			if(self.update_operators[c]) {
				// {field: {$gt: threshold}
				updater = self.update_operators[c];
				return self.run(x, criteria[c], updater);
			}
			// {$updater:{a:10}}
			return updater.call(self, x, criteria[c], c);
		});
	}
	// Fields
	cr_inc(x,c,f:string) {x[f] += c;}
	cr_rename(x,c,f:string) {x[c] = x[f]; delete x[f];}
	cr_setOnInsert(x,c,f:string) {if(this.upsert && this.inserting) x[f] = c;}
	cr_set(x,c,f:string) {x[f] = c;}
	cr_unset(x,c,f:string) {delete x[f];}
}

// http://docs.mongodb.org/manual/reference/operator/projection/
export class ProjectionOperator {
	projection_operators = {};
	constructor() {
		this.projection_operators = {
			// Fields
			'$': this.cr_first,
			'$elemMatch': this.cr_elemMatch,
			'$slice': this.cr_slice,
		};
	}
	run(x, criteria, updater?) {
		var self = this;
		return Object.keys(criteria).forEach(function(c, i, keys) {
			if(self.projection_operators[c]) {
				// {field: {$gt: threshold}
				updater = self.projection_operators[c];
				return self.run(x, criteria[c], updater);
			}
			// {$updater:{a:10}}
			return updater.call(self, x, criteria[c], c);
		});
	}
	// Fields
	cr_first(x,c,f:string) {x[f] += c;}
	cr_elemMatch(x,c,f:string) {x[c] = x[f]; delete x[f];}
	cr_slice(x,c,f:string) {x[f] = c;}
}


// http://mongodb.github.io/node-mongodb-native/api-generated/collection.html
export class MongoDbCollection {
	records = [];
	collectionName: string;
	index: string;
	indexed_reference = {};
	id_reference = {};
	is_unique: bool;
	db: Db;
	
	query_selector:QuerySelector;
	update_operator:UpdateOperator;
	
	constructor(name: string, db: Db) {
		this.collectionName = name;
		this.db = db;
		this.query_selector = new QuerySelector();
		this.update_operator = new UpdateOperator();
	}
	insert(docs);
	insert(docs, callback: (err, docs) => any);
	insert(docs, options: Object, callback: (err, docs) => any);
	
	insert(docs, options?, callback?: (err, docs) => any) {
		if(!options) {
			options = {};
		} else if(!callback) {
			callback = options;
			options = {};
		}
		// docs is a object or Array of objects [test2_2_insert.js]
		if(docs instanceof Array) {
			for(var d in docs) {
				this.insertImpl(docs[d], options);
			}
		}
		else {
			this.insertImpl(docs, options);
		}
		if(callback)
			callback(null, this.records);
	}
	save(docs, options: any, callback?: (err, docs) => any) {
		this.insert(docs, options, callback);
	}
	private insertImpl(docs, options: any) {
		if(options.serializeFunctions) {
			// tentative implement(for functions serializing) [test2_2_insert.js]
			for(var d in docs) {
				if(docs[d] instanceof Function)
					docs.code = ''+docs[d];
			}
		}
		var pushed = false;
		// unique indexed docs [test2_4_insert.js]
		if(this.is_unique) {
			var term = docs[this.index] ? docs[this.index] : "__undefined";
			// update index
			var idx = this.records.length;
			if(this.indexed_reference[term]) {
				docs._id = this.indexed_reference[term].doc._id;
				idx = this.indexed_reference[term].idx;
				
				this.records[this.indexed_reference[term].idx] = docs;
				pushed = true;
			}
			this.indexed_reference[term] = {'doc': docs, 'idx': idx};
		}
		if(!docs._id)
			docs._id = getHashGenerate();
		if(!pushed) {
			this.records.push(docs);
			this.id_reference[docs._id] = docs._id;
		}
	}
	
	ensureIndex(selector: Object, options: any, callback: (err, indexName: string) => any) {
		for(var s in selector) {
			this.index = s;
		}
		if(options && options.unique)
			this.is_unique = true;
		
		if(callback)
			callback(null, this.index);
	}
	
	rename(name, callback: (err, collection: MongoDbCollection) => any) {
		this.checkCollectionName(name);
		try {
			this.db.renameCollection(name, this);
		} catch(err) {
			if(callback)
				callback(err, this);
			else
				throw err;
			return;
		}
		callback(null, this);
	}
	
	checkCollectionName(collectionName) {
	  if('string' !== typeof collectionName) {
	    throw Error("collection name must be a String");
	  }

	  if(!collectionName || collectionName.indexOf('..') != -1) {
	    throw Error("collection names cannot be empty");
	  }

	  if(collectionName.indexOf('$') != -1 &&
	      collectionName.match(/((^\$cmd)|(oplog\.\$main))/) == null) {
	    throw Error("collection names must not contain '$'");
	  }

	  if(collectionName.match(/^\.|\.$/) != null) {
	    throw Error("collection names must not start or end with '.'");
	  }

	  // Validate that we are not passing 0x00 in the colletion name
	  if(!!~collectionName.indexOf("\x00")) {
	    throw new Error("collection names cannot contain a null character");
	  }
	};

	
	count(callback: (err, count: number) => any) {
		if(callback)
			callback(null, this.records.length);
		return this.records.length;
	}
	find(selector, options, callback:(err, results: any) => any) : MongoCursor {
		var self = this;
		var matches = !selector ? this.records: this.records.filter(function(x) {
			return self.query_selector.run(x, selector);
		});

		if(!options)
			options = {};
		if(Object.keys(options).length == 0)
			return new MongoCursor(matches);
		
		return new MongoCursor(matches.map(function(x) {
			var result = {};
			for (var s in options) {
				result[s] = x[s];
			}
			return result;
		}));
	}
	
	findOne(selector, callback: (err, item) => any) {
		for (var i in this.records) {
			var x = this.records[i];
			var matched = true;
			for (var s in selector) {
				if(selector[s] == x[s])
					continue;
				matched = false;
				break;
			}
			if(matched) {
				callback(null, x);
				return;
			}
		}
		callback("not found", null);
	}
	
	update(selector, document, options, callback?:(err, results: any) => any) {
		if(!options)
			options = {};
		var self = this;
		var result = 0;
		self.update_operator.prepare(options);
		this.records.forEach(function(x) {
			if(!self.query_selector.run(x, selector))
				return;
			self.update_operator.run(x, document);
			result++;
		});
		if(options.upsert && !result) {
			// ToDo: only set normal key:value
			this.insert(selector); // wild :)
			this.update_operator.inserting = true;
			this.update_operator.run(selector, document);
			result++;
		}
		if(callback)
			callback(null, result);
	}
	remove(selector, options: any, callback: (err, numberOfRemovedDocs: number) => any) {
		var removed = this.records.length;
		if(selector) {
			this.removeImpl(selector);
			removed -= this.records.length;
		} else {
			this.records = [];
			this.indexed_reference = {};
		}
		if(callback) {
			callback(null, removed);
		}
	}
	private removeImpl(selector) {
		var self = this;
		function removeSelected(x) {
			var left = self.query_selector.run(x, selector);
			if(!left && self.index) {
				delete self.indexed_reference[x[self.index]];
			}
			return !left;
		}
		this.records = this.records.filter(removeSelected);
	}
}

export class Server {
	uri: string;
	port: number;
	constructor(uri: string, port: number) {
		this.uri = uri;
		this.port = port;
	}
}

export class Db {
	opened: bool;
	collections: { [id: string]: MongoDbCollection; };
	constructor(name: string, config?: Object, options?: Object=null) {
		this.opened = false;
		this.collections = {};
	}
	collection(name: string, callback?: (err, collection: MongoDbCollection) => any) : MongoDbCollection {
		if(!this.opened)
			this.open();
		return this.createCollection(name, callback);
	}
	open(callback?: (err, db: Db) => any) {
//console.log(">>db opened.");
		this.opened = true;
		if(callback)
			callback(null, this);
	}
	createCollection(name: string, callback?: (err, collection: MongoDbCollection) => any) : MongoDbCollection {
		var c = this.collections[name];
		if(!c) {
			c = this.collections[name] = new MongoDbCollection(name, this);
		}
		if(callback)
			callback(null, c);
		return c;
	}
	renameCollection(name: string, collection: MongoDbCollection) {
		if(this.collections[name])
			throw new Error("doubled collection name with '"+name+"'");
		this.collections[name] = collection;
		delete this.collections[collection.collectionName];
		collection.collectionName = name;
	}
	close() {
//console.log(">>db closed.")
	}
}

export class MongoClient {
	db: Db;
	public static connect(uri: string, callback: (err, db: Db) => any);
	public static connect(uri: string, options: Object, callback: (err, db: Db) => any);
	
	static connect(uri: string, options: any, callback?: any):void {
		if(!callback) {
			callback = options;
			options = {};
		}
		this.db = new Db(uri);
		callback(null, this.db);
	}
}

export function pure() {
	return {};
}

// Copyright 2014 KATO Kanryu(k.kanryu@gmail.com)
//
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//       http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.
