// test4 update
/// http://mongodb.github.io/node-mongodb-native/api-generated/collection.html
var Db = require('./mongojs').Db,
    MongoClient = require('./mongojs').MongoClient,
    Server = require('./mongojs').Server,
    ReplSetServers = require('./mongojs').ReplSetServers,
    ObjectID = require('./mongojs').ObjectID,
    Binary = require('./mongojs').Binary,
    GridStore = require('./mongojs').GridStore,
    Grid = require('./mongojs').Grid,
    Code = require('./mongojs').Code,
    BSON = require('./mongojs').pure().BSON,
    assert = require('assert');

describe('collection', function () {
    describe('update', function () {
        /// A simple document increment example
        it('A simple document increment example', function () {
          var db = new Db('test', new Server('locahost', 27017));
          // Fetch a collection to insert document into
          db.open(function(err, db) {
            var collection = db.collection("simple_document_insert_collection_no_safe");
            // Insert a single document
            collection.insert([
              {hello:'world_safe1', a:10, b:1, c:50},
              {hello:'world_safe2', a:20, b:2, c:60},
            ]);
            collection.update({b:1}, {$inc:{a:3, c:-4}});

            // Fetch the document
              collection.find().toArray(function(err, results) {
              assert.equal(null, err);
              assert.equal(10+3, results[0].a);
              assert.equal(50-4, results[0].c);
              db.close();
            })
          });
        });

        /// setOnInsert shouldn't update to existing documents
        it("setOnInsert shouldn't update to existing documents", function () {
          var db = new Db('test', new Server('locahost', 27017));
          // Fetch a collection to insert document into
          db.open(function(err, db) {
            var collection = db.collection("simple_document_insert_collection_no_safe");
            // Insert a single document
            collection.insert([
              {hello:'world_safe1', a:10},
            ]);
            collection.update({}, {$setOnInsert:{a:20}, $set: { item: "apple" }}, {upsert:true});
            // Fetch the document
              collection.find().toArray(function(err, results) {
              assert.equal(null, err);
              assert.equal(10, results[0].a);
              assert.equal('apple', results[0].item);
              db.close();
            })
          });
        });

        /// setOnInsert shouldn't update to existing documents
        it("setOnInsert should update to newer documents", function () {
          var db = new Db('test', new Server('locahost', 27017));
          // Fetch a collection to insert document into
          db.open(function(err, db) {
            var collection = db.collection("simple_document_insert_collection_no_safe");
            // Insert a single document
            collection.insert([
              {hello:'world_safe1', a:10},
            ]);
            collection.update({hello:'world_safe2'}, {$setOnInsert:{a:20}}, {upsert:true});
            // Fetch the document
            collection.find({hello:'world_safe2'}).toArray(function(err, results) {
              assert.equal(null, err);
              assert.equal(20, results[0].a);
              db.close();
            })
          });
        });

    });
});
