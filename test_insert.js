// test2 insert
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
    describe('insert', function () {
        /// A batch document insert example, using safe mode to ensure document persistance on MongoDB
        it('A simple document insert example', function () {
          var db = new Db('test', new Server('locahost', 27017));
          // Fetch a collection to insert document into
          db.open(function(err, db) {
            var collection = db.collection("simple_document_insert_collection_no_safe");
            // Insert a single document
            collection.insert({hello:'world_no_safe'});

            // Wait for a second before finishing up, to ensure we have written the item to disk
            setTimeout(function() {

              // Fetch the document
              collection.findOne({hello:'world_no_safe'}, function(err, item) {
                assert.equal(null, err);
                assert.equal('world_no_safe', item.hello);
                db.close();
              })
            }, 100);
          });
        });

        /// A batch document insert example, using safe mode to ensure document persistance on MongoDB
        it('A batch document insert example', function () {
          var db = new Db('test', new Server('locahost', 27017));
          db.open(function(err, db) {
            // Fetch a collection to insert document into
            var collection = db.collection("batch_document_insert_collection_safe");
            // Insert a single document
            collection.insert([{hello:'world_safe1'}
              , {hello:'world_safe2'}], {w:1}, function(err, result) {
              assert.equal(null, err);

              // Fetch the document
              collection.findOne({hello:'world_safe2'}, function(err, item) {
                assert.equal(null, err);
                assert.equal('world_safe2', item.hello);
                db.close();
              })
            });
          });
        });

        /// Example of inserting a document containing functions
        it('Example of inserting a document containing functions', function () {
          var db = new Db('test', new Server('locahost', 27017));
          db.open(function(err, db) {
            // Fetch a collection to insert document into
            var collection = db.collection("simple_document_insert_with_function_safe");
            // Insert a single document
            collection.insert({hello:'world'
              , func:function() {}}, {w:1, serializeFunctions:true}, function(err, result) {
              assert.equal(null, err);

              // Fetch the document
              collection.findOne({hello:'world'}, function(err, item) {
                assert.equal(null, err);
                assert.ok(item.code, "function() {}");
                assert.equal("function () {}", item.code);
                db.close();
              })
            });
          });
        });
    });
});
