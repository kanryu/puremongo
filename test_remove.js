// test3 remove
/// http://mongodb.github.io/node-mongodb-native/api-generated/collection.html
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
    describe('remove', function () {
        /// An example removing all documents in a collection not using safe mode
        it('A simple document insert example', function () {
          var db = new Db('test', new Server('locahost', 27017));
          // Fetch a collection to insert document into
          db.open(function(err, db) {
            // Fetch a collection to insert document into
            db.collection("remove_all_documents_no_safe", function(err, collection) {

              // Insert a bunch of documents
              collection.insert([{a:1}, {b:2}], {w:1}, function(err, result) {
                assert.equal(null, err);

                // Remove all the document
                collection.remove();

                // Fetch all results
                collection.find().toArray(function(err, items) {
                  assert.equal(null, err);
                  assert.equal(0, items.length);
                  db.close();
                });
              });
            });
          });
        });
        
        /// An example removing all documents in a collection not using safe mode
        it('A simple document insert example', function () {
          var db = new Db('test', new Server('locahost', 27017));
          // Fetch a collection to insert document into
          db.open(function(err, db) {
            // Fetch a collection to insert document into
            db.collection("remove_all_documents_no_safe", function(err, collection) {

              // Insert a bunch of documents
            collection.insert([
              {hello:'world_safe1', a:10},
              {hello:'world_safe2', a:20},
            ], {w:1}, function(err, result) {
                assert.equal(null, err);

                // Remove all the document
                collection.remove({a:{$lt:15}});

                // Fetch all results
                collection.find().toArray(function(err, items) {
                  assert.equal(null, err);
                  assert.equal(1, items.length);
                  assert.equal('world_safe2', items[0].hello);
                  db.close();
                });
              });
            });
          });
        });
    });
});
