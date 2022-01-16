import { Fatal } from "@arcaelas/utils";

function getHashGenerate():string {
	return Math.round( Math.random() * 1e36 ).toString(36);
}

export class MongoCursor {
	results: any[];
	constructor(results: any[]) {
		this.results = results;
	}
	sort(options?: any): MongoCursor {
		function sort_by_fields(a: any, b: any) {
			for (let s in options) {
				if(a[s] > b[s])
					return options[s];
				if(a[s] < b[s])
					return -options[s];
			}
			return 0;
		}
		return new MongoCursor(this.results.sort(sort_by_fields));
	}
	toArray(callback: (err: Error | null, results: any[]) => any) {
		callback(null, this.results);
	}
	count(callback: (err: Error | null, count: number) => any) {
		if(callback)
			callback(null, this.results.length);
		return this.results.length;
	}
	limit(n: number): MongoCursor {
		this.results = this.results.slice(0, n);
		return this;
	}
	skip(n: number): MongoCursor {
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
export class QuerySelector {
	query_selectors: { [k: string]: Function } = {};
	constructor() {
		this.query_selectors = {
			'$gt': this.cr_gt,
			'$gte': this.cr_gte,
			'$lt': this.cr_lt,
			'$lte': this.cr_lte,
            '$in': this.cr_in,
			'$nin': this.cr_nin,
            '$and': this.cr_and,
			'$or': this.cr_or,
			'$not': this.cr_not,
			'$nor': this.cr_nor,
			'$exists': this.cr_exists,
			'$type': this.cr_noimp,
			'$mod': this.cr_noimp,
			'$regex': this.cr_noimp,
			'$where': this.cr_where,
			'$geoWithin': this.cr_noimp,
			'$geoIntersects': this.cr_noimp,
			'$near': this.cr_noimp,
			'$nearSphere': this.cr_noimp,
			'$all': this.cr_all,
			'$elemMatch': this.cr_elemMatch,
			'$size': this.cr_size,
			'$allArray': this.cr_noimp,
			'$elemMatchArray': this.cr_noimp,
			'$sizeArray': this.cr_noimp,
		};
	}
    run(x: any, criteria: any, field=''): any {
		let self: QuerySelector = this;
		if(typeof(criteria) == 'function')
			return this.cr_where(x, criteria);
		return Object.keys(criteria).every((c, i, keys) : boolean => {
            if( this.query_selectors[c]){
                let qs = this.query_selectors[c];
                if(x instanceof Array && !this.query_selectors[c+'Array'])
                    return x.some(xe=> this.run(xe, criteria));
                return qs.call(this, x, criteria[c]);
            }
            else if(c.indexOf('.') > 0) {
				let parent = c.split('.', 1)[0];
				let child = c.substring(parent.length+1);
				return self.run(x[parent], {
                    [child]: criteria[c]
                }, field+'.'+parent);
			}
            else if(typeof(criteria[c]) != 'object')
				return x[c] == criteria[c];
			return self.run(x[c], criteria[c], field+'.'+c);
		});
	}
    cr_gt(x: any,c: any): boolean {return x > c;}
	cr_gte(x: any,c: any): boolean {return x >= c;}
	cr_lt(x: any,c: any): boolean {return x < c;}
	cr_lte(x: any,c: any): boolean {return x <= c;}
	cr_in(x: never,a:[]): boolean {return a.indexOf(x) >= 0;}
	cr_nin(x: never,a:[]): boolean {return a.indexOf(x) == -1;}
	cr_not(x: any,c: any): boolean {return !this.cr_run(x, c); }
	cr_or(x:[], a:[]): boolean {return a.some(this.cr_run_array(x)); }
	cr_and(x:[], a:[]): boolean {return a.every(this.cr_run_array(x)); }
	cr_nor(x:[], a:[]): boolean {return !a.some(this.cr_run_array(x)); }
	cr_exists(x: boolean | number, c: number) : number | boolean {
        return c^Number(typeof x === 'undefined');
    }
	cr_where(x: any,c: any): boolean {
        if(typeof c!=='function') new Fatal("type/function");
		return c.call(x);
	}
	cr_every(cr: Function): (x: any,c: any, f:string)=> boolean {
		return function(x,c,f:string) {
			if(x[f] instanceof Array)
				return x[f].some((e: any,i: any,a: any)=> cr(a,c,i));
			else return cr(x,c,f);
		};
	}
	cr_all(x: any,a:[]): boolean {return a.every(function(e){return x.indexOf(e) >= 0;}); }
	cr_elemMatch(x: any,c: any): boolean {
		let self:QuerySelector = this;
		return x.some((element: any) : boolean => self.cr_run(element, c));
	}
	cr_size(x: any,c: any): boolean {return x.length == c; }
	cr_run(x: any,c: any): boolean {return this.run(x, c);}
	cr_run_array(x: any) {
		return (element: never) => this.cr_run(x, element);
	}
	cr_noimp(){ throw new Error("not implemented"); }
}
export class UpdateOperator {
	update_operators: any = {};
	inserting: boolean = false;// when update() creates a new document
	upsert: boolean = false; // update({query}, {document}, {upsert: true}) 
	constructor(options: Object = {}) {
		this.update_operators = {
			'$set': this.cr_set,
			'$inc': this.cr_inc,
			'$unset': this.cr_unset,
			'$rename': this.cr_rename,
			'$setOnInsert': this.cr_setOnInsert,
		};
		this.prepare(options);
	}
	prepare(options: any = {}): UpdateOperator {
		this.inserting = false;
		this.upsert = options.upsert;
		return this;
	}
	run(x: any, criteria: any, updater?: any) : any {
		let self = this;
		return Object.keys(criteria).forEach(c=>{
			if(this.update_operators[c])
				return this.run(x, criteria[c], this.update_operators[c] );
			return updater.call(self, x, criteria[c], c);
		});
	}
	cr_set(x: any,c: any,f:string) {x[f] = c;}
	cr_inc(x: any,c: any,f:string) {x[f] += c;}
	cr_unset(x: any,c: any,f:string) {delete x[f];}
	cr_rename(x: any,c: any,f:string) {x[c] = x[f]; delete x[f];}
	cr_setOnInsert(x: any,c: any,f:string) {if(this.upsert && this.inserting) x[f] = c;}
}

export class ProjectionOperator {
	projection_operators: any = {};
	constructor() {
		this.projection_operators = {
			'$': this.cr_first,
			'$elemMatch': this.cr_elemMatch,
			'$slice': this.cr_slice,
		};
	}
	run(x: any, criteria: any, updater?: any): any {
		return Object.keys(criteria).forEach(c=>{
			if(this.projection_operators[c]) 
				return this.run(x, criteria[c], this.projection_operators[c]);
			return updater.call(self, x, criteria[c], c);
		});
	}
	cr_slice(x: any,c: any,f:string){x[f]=c;}
	cr_first(x: any,c: any,f:string){x[f]+=c;}
	cr_elemMatch(x: any,c: any,f:string) {x[c]=x[f];delete x[f];}
}

export class MongoDbCollection {
	db: Db;
	records: any = [];
	index: string = '';
	collectionName: string;
	is_unique: boolean = false;
	query_selector:QuerySelector;
	update_operator:UpdateOperator;
	id_reference: Record<any, any> = {};
	indexed_reference: Record<any, any> = {};
	
	constructor(name: string, db: Db) {
		this.db = db;
		this.collectionName = name;
		this.query_selector = new QuerySelector();
		this.update_operator = new UpdateOperator();
	}
	insert(docs: object[], callback?: (err: Error | null, docs: []) => any): void;
	insert(docs: object[], options?: {}, callback?: (err: Error | null, docs: []) => any): void;
    insert(...props: any[]): any {
        let [ docs, options, callback ] = props;
		if(!options) options = {};
        if(typeof options==='function') callback = options, options = {};
		else if(!options) callback = null, options = {};
		if(docs instanceof Array)
			for(let d in docs)
				this.insertImpl(docs[d], options);
		else this.insertImpl(docs, options);
		if(typeof callback==='function') callback(null, this.records);
	}
	save(docs: [], options: Object, callback?: (err: Error | null, docs: []) => any) : any {
		return this.insert(docs, options, callback);
	}
	private insertImpl(docs: any, options: any) {
		if(options.serializeFunctions) {
			for(let d in docs)
				if(docs[d] instanceof Function)
					docs.code = ''+docs[d];
		}
		let pushed = false;
		if(this.is_unique) {
			let term = docs[this.index] ? docs[this.index] : "__undefined";
			let idx = this.records.length;
			if(this.indexed_reference[term]) {
				docs._id = this.indexed_reference[term].doc._id;
				idx = this.indexed_reference[term].idx;
				this.records[ this.indexed_reference[term].idx ] = docs;
				pushed = true;
			}
			this.indexed_reference[term] = {'doc': docs, 'idx': idx};
		}
		if(!docs._id) docs._id = getHashGenerate();
		if(!pushed) {
			this.records.push(docs);
			this.id_reference[docs._id] = docs._id;
		}
	}
	ensureIndex(selector: Object, options: any, callback: (err: Error | null, indexName: string) => any) : void {
		for(let s in selector)
			this.index = s;
		if(options && options.unique)
			this.is_unique = true;
		if(callback)
			callback(null, this.index);
	}
	rename(name: string, callback: (err: any, collection: MongoDbCollection) => any) {
		this.checkCollectionName(name);
		try {
			this.db.renameCollection(name, this);
		} catch(err) {
			if(callback) callback(err, this);
			else throw err;
			return;
		}
		callback(null, this);
	}
	checkCollectionName(collectionName: string) {
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
	  if(!!~collectionName.indexOf("\x00")) {
	    throw new Error("collection names cannot contain a null character");
	  }
	};
	count(callback: (err: Error | null, count: number) => any) {
		if(callback)
			callback(null, this.records.length);
		return this.records.length;
	}
	find(selector: object, options: object, callback:(err: Error | null, results: any) => any) : MongoCursor {
        let items: MongoCursor;
            options ||= {};
        try{
            let matches = !selector ? this.records: this.records.filter((x: any)=>this.query_selector.run(x, selector));
            if(Object.keys(options).length == 0)
                items = new MongoCursor(matches);
            items = new MongoCursor(matches.map((x: any)=>{
                let result: any = {};
                for (let s in options)
                    result[s] = x[s];
                return result;
            }));
        }
        catch(error: any){
            return callback.call(this, error, []);
        }
        return items;
	}
	findOne(selector: any, callback: (err: Error | null, item: any) => any) {
		for (let i in this.records) {
			let matched = true,
                x = this.records[i];
			for (let s in selector) {
				if(selector[s] == x[s]) continue;
				matched = false;
				break;
			}
			if(matched) {
				callback(null, x);
				return;
			}
		}
		callback(new Error("not found"), null);
	}
	update(selector: any, document: any, options: any, callback?:(err: Error | null, results: any) => any) {
		if(!options) options = {};
		let result = 0;
		this.update_operator.prepare(options);
		this.records.forEach((x: any) => {
			if(!this.query_selector.run(x, selector))
				return;
			this.update_operator.run(x, document);
			result++;
		});
		if(options.upsert && !result) {
			this.insert(selector); // wild :)
			this.update_operator.inserting = true;
			this.update_operator.run(selector, document);
			result++;
		}
		if(callback)
			callback(null, result);
	}
	remove(selector: any, options: any, callback: (err: Error | null, numberOfRemovedDocs: number) => any) {
		let removed = this.records.length;
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
	private removeImpl(selector: any) {
		const removeSelected = (x: any)=>{
			let left = this.query_selector.run(x, selector);
			if(!left && this.index) {
				delete this.indexed_reference[x[this.index]];
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
	opened: boolean = false;
	collections: { [id: string]: MongoDbCollection; };
	constructor(name: string, config: any, options: any=null) {
		this.opened = false;
		this.collections = {};
	}
	collection(name: string, callback?: (err: Error | null, collection: MongoDbCollection) => any) : MongoDbCollection {
		if(!this.opened)
			this.open();
		return this.createCollection(name, callback);
	}
	open(callback?: (err: Error | null, db: Db) => any) {
		this.opened = true;
		if(callback)
			callback(null, this);
	}
	createCollection(name: string, callback?: (err: Error | null, collection: MongoDbCollection) => any) : MongoDbCollection {
		let c = this.collections[name];
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
	public constructor(uri: string, callback?: (err: Error | null, db: Db) => any);
	public constructor(uri: string, options?: any, callback?: (err: Error | null, db: Db) => any);
	constructor(...props: any[]) {
        let [ uri, options, callback ] = props;
        callback ||= typeof options==='function' ? options : null;
        options = typeof options==='object'?options:{};
		this.db = new Db(uri,{},{});
        if(callback)
        callback.call(this, this, this.db);
	}
}

export function pure() {
	return {};
}
