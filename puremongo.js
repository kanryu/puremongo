function getHashGenerate() {
    return Math.round(Math.random() * 1e+36).toString(36);
}
var MongoCursor = (function () {
    function MongoCursor(results) {
        this.results = results;
    }
    MongoCursor.prototype.sort = function (options) {
        function sort_by_fields(a, b) {
            for(var s in options) {
                if(a[s] > b[s]) {
                    return options[s];
                }
                if(a[s] < b[s]) {
                    return -options[s];
                }
            }
            return 0;
        }
        return new MongoCursor(this.results.sort(sort_by_fields));
    };
    MongoCursor.prototype.toArray = function (callback) {
        callback(null, this.results);
    };
    MongoCursor.prototype.count = function (callback) {
        if(callback) {
            callback(null, this.results.length);
        }
        return this.results.length;
    };
    MongoCursor.prototype.limit = function (n) {
        this.results = this.results.slice(0, n);
        return this;
    };
    MongoCursor.prototype.skip = function (n) {
        this.results = this.results.slice(n);
        return this;
    };
    MongoCursor.prototype.snapshot = function () {
        throw new Error("not implemented");
    };
    MongoCursor.prototype.rewind = function () {
        throw new Error("not implemented");
    };
    MongoCursor.prototype.nextObject = function () {
        throw new Error("not implemented");
    };
    MongoCursor.prototype.each = function () {
        throw new Error("not implemented");
    };
    return MongoCursor;
})();
exports.MongoCursor = MongoCursor;
var QuerySelector = (function () {
    function QuerySelector() {
        this.query_selectors = {
        };
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
            '$sizeArray': this.cr_noimp
        };
    }
    QuerySelector.prototype.run = function (x, criteria, field) {
        if (typeof field === "undefined") { field = ''; }
        if(typeof (criteria) == 'function') {
            return this.cr_where(x, criteria);
        }
        var self = this;
        return Object.keys(criteria).every(function (c, i, keys) {
            if(self.query_selectors[c]) {
                var qs = self.query_selectors[c];
                if(x instanceof Array && !self.query_selectors[c + 'Array']) {
                    return x.some(function (xe) {
                        var result = self.run(xe, criteria);
                        return result;
                    });
                }
                return qs.call(self, x, criteria[c]);
            } else {
                if(c.indexOf('.') > 0) {
                    var parent = c.split('.', 1)[0];
                    var child = c.substring(parent.length + 1);
                    var sub_criteria = {
                    };
                    sub_criteria[child] = criteria[c];
                    return self.run(x[parent], sub_criteria, field + '.' + parent);
                } else {
                    if(typeof (criteria[c]) != 'object') {
                        return x[c] == criteria[c];
                    }
                }
            }
            return self.run(x[c], criteria[c], field + '.' + c);
        });
    };
    QuerySelector.prototype.cr_gt = function (x, c) {
        return x > c;
    };
    QuerySelector.prototype.cr_gte = function (x, c) {
        return x >= c;
    };
    QuerySelector.prototype.cr_lt = function (x, c) {
        return x < c;
    };
    QuerySelector.prototype.cr_lte = function (x, c) {
        return x <= c;
    };
    QuerySelector.prototype.cr_in = function (x, a) {
        return a.indexOf(x) >= 0;
    };
    QuerySelector.prototype.cr_nin = function (x, a) {
        return a.indexOf(x) == -1;
    };
    QuerySelector.prototype.cr_and = function (x, a) {
        return a.every(this.cr_run_array(x));
    };
    QuerySelector.prototype.cr_or = function (x, a) {
        return a.some(this.cr_run_array(x));
    };
    QuerySelector.prototype.cr_not = function (x, c) {
        return !this.cr_run(x, c);
    };
    QuerySelector.prototype.cr_nor = function (x, a) {
        return !a.some(this.cr_run_array(x));
    };
    QuerySelector.prototype.cr_exists = function (x, c) {
        return c ^ (x === undefined);
    };
    QuerySelector.prototype.cr_where = function (x, c) {
        switch(typeof (c)) {
            case 'function': {
                return c.call(x);

            }
            case 'string': {
                var obj = x;
                var func_eval = function (c) {
                    return eval(c);
                };
                return func_eval.call(x, c);

            }
        }
        return false;
    };
    QuerySelector.prototype.cr_every = function (cr) {
        return function (x, c, f) {
            console.log("cr_every:", x, c, f);
            if(x[f] instanceof Array) {
                return x[f].some(function (e, i, a) {
                    console.log("e:", a, i, f, cr(a, c, i));
                    return cr(a, c, i);
                });
            } else {
                return cr(x, c, f);
            }
        }
    };
    QuerySelector.prototype.cr_all = function (x, a) {
        return a.every(function (e) {
            return x.indexOf(e) >= 0;
        });
    };
    QuerySelector.prototype.cr_elemMatch = function (x, c) {
        var self = this;
        return x.some(function (element, index, array) {
            return self.cr_run(element, c);
        });
    };
    QuerySelector.prototype.cr_size = function (x, c) {
        return x.length == c;
    };
    QuerySelector.prototype.cr_run = function (x, c) {
        return this.run(x, c);
    };
    QuerySelector.prototype.cr_run_array = function (x) {
        var self = this;
        return function (element, index, array) {
            return self.cr_run(x, element);
        }
    };
    QuerySelector.prototype.cr_noimp = function () {
        throw new Error("not implemented");
    };
    return QuerySelector;
})();
exports.QuerySelector = QuerySelector;
var UpdateOperator = (function () {
    function UpdateOperator(options) {
        this.update_operators = {
        };
        this.inserting = false;
        this.upsert = false;
        this.update_operators = {
            '$inc': this.cr_inc,
            '$rename': this.cr_rename,
            '$setOnInsert': this.cr_setOnInsert,
            '$set': this.cr_set,
            '$unset': this.cr_unset
        };
        this.prepare(options);
    }
    UpdateOperator.prototype.prepare = function (options) {
        if(!options) {
            options = {
            };
        }
        this.upsert = options.upsert;
        this.inserting = false;
        return this;
    };
    UpdateOperator.prototype.run = function (x, criteria, updater) {
        var self = this;
        return Object.keys(criteria).forEach(function (c, i, keys) {
            if(self.update_operators[c]) {
                updater = self.update_operators[c];
                return self.run(x, criteria[c], updater);
            }
            return updater.call(self, x, criteria[c], c);
        });
    };
    UpdateOperator.prototype.cr_inc = function (x, c, f) {
        x[f] += c;
    };
    UpdateOperator.prototype.cr_rename = function (x, c, f) {
        x[c] = x[f];
        delete x[f];
    };
    UpdateOperator.prototype.cr_setOnInsert = function (x, c, f) {
        if(this.upsert && this.inserting) {
            x[f] = c;
        }
    };
    UpdateOperator.prototype.cr_set = function (x, c, f) {
        x[f] = c;
    };
    UpdateOperator.prototype.cr_unset = function (x, c, f) {
        delete x[f];
    };
    return UpdateOperator;
})();
exports.UpdateOperator = UpdateOperator;
var ProjectionOperator = (function () {
    function ProjectionOperator() {
        this.projection_operators = {
        };
        this.projection_operators = {
            '$': this.cr_first,
            '$elemMatch': this.cr_elemMatch,
            '$slice': this.cr_slice
        };
    }
    ProjectionOperator.prototype.run = function (x, criteria, updater) {
        var self = this;
        return Object.keys(criteria).forEach(function (c, i, keys) {
            if(self.projection_operators[c]) {
                updater = self.projection_operators[c];
                return self.run(x, criteria[c], updater);
            }
            return updater.call(self, x, criteria[c], c);
        });
    };
    ProjectionOperator.prototype.cr_first = function (x, c, f) {
        x[f] += c;
    };
    ProjectionOperator.prototype.cr_elemMatch = function (x, c, f) {
        x[c] = x[f];
        delete x[f];
    };
    ProjectionOperator.prototype.cr_slice = function (x, c, f) {
        x[f] = c;
    };
    return ProjectionOperator;
})();
exports.ProjectionOperator = ProjectionOperator;
var MongoDbCollection = (function () {
    function MongoDbCollection(name, db) {
        this.records = [];
        this.indexed_reference = {
        };
        this.id_reference = {
        };
        this.collectionName = name;
        this.db = db;
        this.query_selector = new QuerySelector();
        this.update_operator = new UpdateOperator();
    }
    MongoDbCollection.prototype.insert = function (docs, options, callback) {
        if(!options) {
            options = {
            };
        } else {
            if(!callback) {
                callback = options;
                options = {
                };
            }
        }
        if(docs instanceof Array) {
            for(var d in docs) {
                this.insertImpl(docs[d], options);
            }
        } else {
            this.insertImpl(docs, options);
        }
        if(callback) {
            callback(null, this.records);
        }
    };
    MongoDbCollection.prototype.save = function (docs, options, callback) {
        this.insert(docs, options, callback);
    };
    MongoDbCollection.prototype.insertImpl = function (docs, options) {
        if(options.serializeFunctions) {
            for(var d in docs) {
                if(docs[d] instanceof Function) {
                    docs.code = '' + docs[d];
                }
            }
        }
        var pushed = false;
        if(this.is_unique) {
            var term = docs[this.index] ? docs[this.index] : "__undefined";
            var idx = this.records.length;
            if(this.indexed_reference[term]) {
                docs._id = this.indexed_reference[term].doc._id;
                idx = this.indexed_reference[term].idx;
                this.records[this.indexed_reference[term].idx] = docs;
                pushed = true;
            }
            this.indexed_reference[term] = {
                'doc': docs,
                'idx': idx
            };
        }
        if(!docs._id) {
            docs._id = getHashGenerate();
        }
        if(!pushed) {
            this.records.push(docs);
            this.id_reference[docs._id] = docs._id;
        }
    };
    MongoDbCollection.prototype.ensureIndex = function (selector, options, callback) {
        for(var s in selector) {
            this.index = s;
        }
        if(options && options.unique) {
            this.is_unique = true;
        }
        if(callback) {
            callback(null, this.index);
        }
    };
    MongoDbCollection.prototype.rename = function (name, callback) {
        this.checkCollectionName(name);
        try  {
            this.db.renameCollection(name, this);
        } catch (err) {
            if(callback) {
                callback(err, this);
            } else {
                throw err;
            }
            return;
        }
        callback(null, this);
    };
    MongoDbCollection.prototype.checkCollectionName = function (collectionName) {
        if('string' !== typeof collectionName) {
            throw Error("collection name must be a String");
        }
        if(!collectionName || collectionName.indexOf('..') != -1) {
            throw Error("collection names cannot be empty");
        }
        if(collectionName.indexOf('$') != -1 && collectionName.match(/((^\$cmd)|(oplog\.\$main))/) == null) {
            throw Error("collection names must not contain '$'");
        }
        if(collectionName.match(/^\.|\.$/) != null) {
            throw Error("collection names must not start or end with '.'");
        }
        if(!!~collectionName.indexOf("\x00")) {
            throw new Error("collection names cannot contain a null character");
        }
    };
    MongoDbCollection.prototype.count = function (callback) {
        if(callback) {
            callback(null, this.records.length);
        }
        return this.records.length;
    };
    MongoDbCollection.prototype.find = function (selector, options, callback) {
        var self = this;
        var matches = !selector ? this.records : this.records.filter(function (x) {
            return self.query_selector.run(x, selector);
        });
        if(!options) {
            options = {
            };
        }
        if(Object.keys(options).length == 0) {
            return new MongoCursor(matches);
        }
        return new MongoCursor(matches.map(function (x) {
            var result = {
            };
            for(var s in options) {
                result[s] = x[s];
            }
            return result;
        }));
    };
    MongoDbCollection.prototype.findOne = function (selector, callback) {
        for(var i in this.records) {
            var x = this.records[i];
            var matched = true;
            for(var s in selector) {
                if(selector[s] == x[s]) {
                    continue;
                }
                matched = false;
                break;
            }
            if(matched) {
                callback(null, x);
                return;
            }
        }
        callback("not found", null);
    };
    MongoDbCollection.prototype.update = function (selector, document, options, callback) {
        if(!options) {
            options = {
            };
        }
        var self = this;
        var result = 0;
        self.update_operator.prepare(options);
        this.records.forEach(function (x) {
            if(!self.query_selector.run(x, selector)) {
                return;
            }
            self.update_operator.run(x, document);
            result++;
        });
        if(options.upsert && !result) {
            this.insert(selector);
            this.update_operator.inserting = true;
            this.update_operator.run(selector, document);
            result++;
        }
        if(callback) {
            callback(null, result);
        }
    };
    MongoDbCollection.prototype.remove = function (selector, options, callback) {
        var removed = this.records.length;
        if(selector) {
            this.removeImpl(selector);
            removed -= this.records.length;
        } else {
            this.records = [];
            this.indexed_reference = {
            };
        }
        if(callback) {
            callback(null, removed);
        }
    };
    MongoDbCollection.prototype.removeImpl = function (selector) {
        var self = this;
        function removeSelected(x) {
            var left = self.query_selector.run(x, selector);
            if(!left && self.index) {
                delete self.indexed_reference[x[self.index]];
            }
            return !left;
        }
        this.records = this.records.filter(removeSelected);
    };
    return MongoDbCollection;
})();
exports.MongoDbCollection = MongoDbCollection;
var Server = (function () {
    function Server(uri, port) {
        this.uri = uri;
        this.port = port;
    }
    return Server;
})();
exports.Server = Server;
var Db = (function () {
    function Db(name, config, options) {
        if (typeof options === "undefined") { options = null; }
        this.opened = false;
        this.collections = {
        };
    }
    Db.prototype.collection = function (name, callback) {
        if(!this.opened) {
            this.open();
        }
        return this.createCollection(name, callback);
    };
    Db.prototype.open = function (callback) {
        this.opened = true;
        if(callback) {
            callback(null, this);
        }
    };
    Db.prototype.createCollection = function (name, callback) {
        var c = this.collections[name];
        if(!c) {
            c = this.collections[name] = new MongoDbCollection(name, this);
        }
        if(callback) {
            callback(null, c);
        }
        return c;
    };
    Db.prototype.renameCollection = function (name, collection) {
        if(this.collections[name]) {
            throw new Error("doubled collection name with '" + name + "'");
        }
        this.collections[name] = collection;
        delete this.collections[collection.collectionName];
        collection.collectionName = name;
    };
    Db.prototype.close = function () {
    };
    return Db;
})();
exports.Db = Db;
var MongoClient = (function () {
    function MongoClient() { }
    MongoClient.connect = function connect(uri, options, callback) {
        if(!callback) {
            callback = options;
            options = {
            };
        }
        this.db = new Db(uri);
        callback(null, this.db);
    }
    return MongoClient;
})();
exports.MongoClient = MongoClient;
function pure() {
    return {
    };
}
exports.pure = pure;
