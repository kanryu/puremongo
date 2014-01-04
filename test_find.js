// test2 insert
/// http://mongodb.github.io/node-mongodb-native/api-generated/collection.html
// type 'mocha test_find.js'
var Db = require('./puremongo').Db,
    MongoClient = require('./puremongo').MongoClient,
    Server = require('./puremongo').Server,
    ReplSetServers = require('./puremongo').ReplSetServers,
    ObjectID = require('./puremongo').ObjectID,
    Binary = require('./puremongo').Binary,
    GridStore = require('./puremongo').GridStore,
    Grid = require('./puremongo').Grid,
    Code = require('./puremongo').Code,
    BSON = require('./puremongo').pure().BSON,
    assert = require('assert');

describe('collection', function () {
    describe('find', function () {
        /// fields enumerated find example
        it('fields enumerated find example', function () {
          var db = new Db('test', new Server('locahost', 27017));
          db.open(function(err, db) {
            // Fetch a collection to insert document into
            var collection = db.collection("find_collection_safe");
            // Insert a single document
            collection.insert([
              {hello:'world_safe1', a:10}], {w:1}, function(err, result) {
              assert.equal(null, err);

              // Fetch the document
              collection.find({}, {a:1}).toArray(function(err, results) {
                assert.equal(null, err);
                assert.equal(10, results[0].a);
                assert.equal(undefined, results[0].hello);
                db.close();
              })
            });
          });
        });
        
        /// find with a condition example
        it('find with a condition example', function () {
          var db = new Db('test', new Server('locahost', 27017));
          db.open(function(err, db) {
            // Fetch a collection to insert document into
            var collection = db.collection("find_collection_safe2");
            // Insert a single document
            collection.insert([
              {hello:'world_safe1', a:10},
              {hello:'world_safe2', a:20}], {w:1}, function(err, result) {
              assert.equal(null, err);

              // Fetch the document
              collection.find({a:20}, {}).toArray(function(err, results) {
                assert.equal(null, err);
                assert.equal(20, results[0].a);
                assert.equal('world_safe2', results[0].hello);
                db.close();
              })
            });
          });
        });
        
        /// find with the conditions example
        it('find with the conditions example', function () {
          var db = new Db('test', new Server('locahost', 27017));
          db.open(function(err, db) {
            // Fetch a collection to insert document into
            var collection = db.collection("find_collection_safe2");
            // Insert a single document
            collection.insert([
              {hello:'world_safe1', a:10},
              {hello:'world_safe2', a:20}], {w:1}, function(err, result) {
              assert.equal(null, err);

              // Fetch the document
              collection.find({a:20, hello: 'world_safe2'}, {}).toArray(function(err, results) {
                assert.equal(null, err);
                assert.equal(20, results[0].a);
                assert.equal('world_safe2', results[0].hello);
                db.close();
              })
            });
          });
        });
        
        /// find docs and sorting example
        it('find docs and sorting example', function () {
          var db = new Db('test', new Server('locahost', 27017));
          db.open(function(err, db) {
            // Fetch a collection to insert document into
            var collection = db.collection("find_collection_safe3");
            // Insert a single document
            collection.insert([
              {hello:'world_safe2', a:20},
              {hello:'world_safe1', a:10}], {w:1}, function(err, result) {
              assert.equal(null, err);

              // Fetch the document
              collection.find().sort({a:1}).toArray(function(err, results) {
                assert.equal(null, err);
                assert.equal(10, results[0].a);
                assert.equal('world_safe1', results[0].hello);
                db.close();
              })
            });
          });
        });
        
        /// find docs when [field > threshold]
        it('find docs when [field > threshold]', function () {
          var db = new Db('test', new Server('locahost', 27017));
          db.open(function(err, db) {
            // Fetch a collection to insert document into
            var collection = db.collection("find_collection_safe4");
            // Insert a single document
            collection.insert([
              {hello:'world_safe2', a:20},
              {hello:'world_safe1', a:10}], {w:1}, function(err, result) {
              assert.equal(null, err);

              // Fetch the document
              collection.find({a:{$gt:15}}).toArray(function(err, results) {
                assert.equal(null, err);
                assert.equal(20, results[0].a);
                assert.equal('world_safe2', results[0].hello);
                db.close();
              })
            });
          });
        });

        /// find docs when [field in (list)]
        it('find docs when [field in (list)]', function () {
          var db = new Db('test', new Server('locahost', 27017));
          db.open(function(err, db) {
            // Fetch a collection to insert document into
            var collection = db.collection("find_collection_safe4");
            // Insert a single document
            collection.insert([
              {hello:'world_safe2', a:20},
              {hello:'world_safe1', a:10}], {w:1}, function(err, result) {
              assert.equal(null, err);

              // Fetch the document
              collection.find({a:{$in:[15, 20, 25]}}).toArray(function(err, results) {
                assert.equal(null, err);
                assert.equal(20, results[0].a);
                assert.equal('world_safe2', results[0].hello);
                db.close();
              })
            });
          });
        });
        /// find docs when A and B
        it('find docs when A and B', function () {
          var db = new Db('test', new Server('locahost', 27017));
          db.open(function(err, db) {
            // Fetch a collection to insert document into
            var collection = db.collection("find_collection_safe4");
            // Insert a single document
            collection.insert([
              {hello:'world_safe2', a:20},
              {hello:'world_safe1', a:10}], {w:1}, function(err, result) {
              assert.equal(null, err);

              // Fetch the document
              collection.find({$and: [{a:20}, {hello: 'world_safe2'}]}).toArray(function(err, results) {
                assert.equal(null, err);
                assert.equal(20, results[0].a);
                assert.equal('world_safe2', results[0].hello);
                db.close();
              })
            });
          });
        });

        /// find docs only exists A
        it('find docs only exists A', function () {
          var db = new Db('test', new Server('locahost', 27017));
          db.open(function(err, db) {
            // Fetch a collection to insert document into
            var collection = db.collection("find_collection_safe4");
            // Insert a single document
            collection.insert([
              {hello:'world_safe1', a:10},
              {hello:'world_safe2', a:null},
              {hello:'world_safe3'},
            ], {w:1}, function(err, result) {
              assert.equal(null, err);

              // Fetch the document
              collection.find({a:{$exists:true}}).toArray(function(err, results) {
                assert.equal(null, err);
                assert.equal(2, results.length);
                assert.equal('world_safe1', results[0].hello);
                db.close();
              })
            });
          });
        });

        /// find docs only not exists A
        it('find docs only not exists A', function () {
          var db = new Db('test', new Server('locahost', 27017));
          db.open(function(err, db) {
            // Fetch a collection to insert document into
            var collection = db.collection("find_collection_safe4");
            // Insert a single document
            collection.insert([
              {hello:'world_safe1', a:10},
              {hello:'world_safe2', a:null},
              {hello:'world_safe3'},
            ], {w:1}, function(err, result) {
              assert.equal(null, err);

              // Fetch the document
              collection.find({a:{$exists:false}}).toArray(function(err, results) {
                assert.equal(null, err);
                assert.equal(1, results.length);
                assert.equal('world_safe3', results[0].hello);
                db.close();
              })
            });
          });
        });

        /// find docs where function()
        it('find docs where function()', function () {
          var db = new Db('test', new Server('locahost', 27017));
          db.open(function(err, db) {
            // Fetch a collection to insert document into
            var collection = db.collection("find_collection_safe4");
            // Insert a single document
            collection.insert([
              {hello:'world_safe1', a:10},
              {hello:'world_safe2', a:20},
            ], {w:1}, function(err, result) {
              assert.equal(null, err);

              // Fetch the document
              collection.find({$where:function(){return this.a > 15}}).toArray(function(err, results) {
                assert.equal(null, err);
                assert.equal('world_safe2', results[0].hello);
                db.close();
              })
            });
          });
        });

        /// find docs where "this.a"
        it('find docs where "this.a"', function () {
          var db = new Db('test', new Server('locahost', 27017));
          db.open(function(err, db) {
            // Fetch a collection to insert document into
            var collection = db.collection("find_collection_safe4");
            // Insert a single document
            collection.insert([
              {hello:'world_safe1', a:10},
              {hello:'world_safe2', a:20},
            ], {w:1}, function(err, result) {
              assert.equal(null, err);

              // Fetch the document
              collection.find({$where:"this.a > 15"}).toArray(function(err, results) {
                assert.equal(null, err);
                assert.equal('world_safe2', results[0].hello);
                db.close();
              })
            });
          });
        });
        
        /// find docs where "obj.a"
        it('find docs where "obj.a"', function () {
          var db = new Db('test', new Server('locahost', 27017));
          db.open(function(err, db) {
            // Fetch a collection to insert document into
            var collection = db.collection("find_collection_safe4");
            // Insert a single document
            collection.insert([
              {hello:'world_safe1', a:10},
              {hello:'world_safe2', a:20},
            ], {w:1}, function(err, result) {
              assert.equal(null, err);

              // Fetch the document
              collection.find({$where:"obj.a > 15"}).toArray(function(err, results) {
                assert.equal(null, err);
                assert.equal('world_safe2', results[0].hello);
                db.close();
              })
            });
          });
        });

        /// find docs function() directly
        it('find docs function() directly', function () {
          var db = new Db('test', new Server('locahost', 27017));
          db.open(function(err, db) {
            // Fetch a collection to insert document into
            var collection = db.collection("find_collection_safe4");
            // Insert a single document
            collection.insert([
              {hello:'world_safe1', a:10},
              {hello:'world_safe2', a:20},
            ], {w:1}, function(err, result) {
              assert.equal(null, err);

              // Fetch the document
              collection.find(function(){return this.a > 15}).toArray(function(err, results) {
                assert.equal(null, err);
                assert.equal('world_safe2', results[0].hello);
                db.close();
              })
            });
          });
        });

        /// find docs when Array contains [A,B,C]
        it('find docs when Array contains [A,B,C]', function () {
          var db = new Db('test', new Server('locahost', 27017));
          db.open(function(err, db) {
            // Fetch a collection to insert document into
            var collection = db.collection("find_collection_safe4");
            // Insert a single document
            collection.insert([
              {hello:'world_safe1', a:[1, 2, 3, 10, 20]},
              {hello:'world_safe2', a:[20, 10, 30]},
              {hello:'world_safe3', a:[20, 30, 40]},
            ], {w:1}, function(err, result) {
              assert.equal(null, err);

              // Fetch the document
              collection.find({a:{$all:[10, 20]}}).toArray(function(err, results) {
                assert.equal(null, err);
                assert.equal(2, results.length);
                assert.equal('world_safe1', results[0].hello);
                db.close();
              })
            });
          });
        });

        /// find docs when Array contains [A,B,C]
        it('find docs when $elemMatch of Array', function () {
          var db = new Db('test', new Server('locahost', 27017));
          db.open(function(err, db) {
            // Fetch a collection to insert document into
            var collection = db.collection("find_collection_safe4");
            // Insert a single document
            collection.insert([
              {hello:'world_safe1', a:[{b:10}, {b:20}]},
              {hello:'world_safe2', a:[{c:10}]},
              {hello:'world_safe3', a:[{b:30}]},
            ], {w:1}, function(err, result) {
              assert.equal(null, err);

              // Fetch the document
              collection.find({a:{$elemMatch:{b:{$lt:15}}}}).toArray(function(err, results) {
                assert.equal(null, err);
                assert.equal(1, results.length);
                assert.equal('world_safe1', results[0].hello);
                db.close();
              })
            });
          });
        });

        /// find docs when Array of size = A
        it('find docs when Array of size = A', function () {
          var db = new Db('test', new Server('locahost', 27017));
          db.open(function(err, db) {
            // Fetch a collection to insert document into
            var collection = db.collection("find_collection_safe4");
            // Insert a single document
            collection.insert([
              {hello:'world_safe1', a:[1, 2, 3, 10, 20]},
              {hello:'world_safe2', a:[20, 10, 30]},
              {hello:'world_safe3', a:[20, 30, 40]},
            ], {w:1}, function(err, result) {
              assert.equal(null, err);

              // Fetch the document
              collection.find({a:{$size:5}}).toArray(function(err, results) {
                assert.equal(null, err);
                assert.equal(1, results.length);
                assert.equal('world_safe1', results[0].hello);
                db.close();
              })
            });
          });
        });

        /// find docs when A.B = C
        it('find docs when A.B = C', function () {
          var db = new Db('test', new Server('locahost', 27017));
          db.open(function(err, db) {
            // Fetch a collection to insert document into
            var collection = db.collection("find_collection_safe4");
            // Insert a single document
            collection.insert([
              {hello:'world_safe1', a:{b:10}},
              {hello:'world_safe2', a:{c:10}},
              {hello:'world_safe3', a:{b:30}},
            ], {w:1}, function(err, result) {
              assert.equal(null, err);

              // Fetch the document
              collection.find({"a.b":10}).toArray(function(err, results) {
                assert.equal(null, err);
                assert.equal(1, results.length);
                assert.equal('world_safe1', results[0].hello);
                db.close();
              })
            });
          });
        });

        /// find operators check for not implemented options
        it('find operators check for not implemented options', function () {
          var db = new Db('test', new Server('locahost', 27017));
          db.open(function(err, db) {
            // Fetch a collection to insert document into
            var collection = db.collection("find_collection_safe4");
            // Insert a single document
            collection.insert([
              {hello:'world_safe1', a:{b:10}},
              {hello:'world_safe2', a:{c:10}},
              {hello:'world_safe3', a:{b:30}},
            ], {w:1}, function(err, result) {
              assert.equal(null, err);

              // Fetch the document
              assert.throws(function(){collection.find({$type:{a:10}});}, "not implemented");
              assert.throws(function(){collection.find({$mod:{a:10}});}, "not implemented");
              assert.throws(function(){collection.find({$regex:{hello:"d"}});}, "not implemented");
              assert.throws(function(){collection.find({$geoWithin:{a:10}});}, "not implemented");
              assert.throws(function(){collection.find({$geoIntersects:{a:10}});}, "not implemented");
              assert.throws(function(){collection.find({$near:{a:10}});}, "not implemented");
              assert.throws(function(){collection.find({$nearSphere:{a:10}});}, "not implemented");
              assert.throws(function(){collection.find().snapshot();}, "not implemented");
              assert.throws(function(){collection.find().snapshot();}, "not implemented");
              assert.throws(function(){collection.find().rewind();}, "not implemented");
              assert.throws(function(){collection.find().nextObject();}, "not implemented");
              assert.throws(function(){collection.find().each();}, "not implemented");
            });
          });
        });

    });
});
