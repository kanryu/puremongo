## MongoJS - a pure JavaScript DataBase
 

### Questions and Bug Reports

 * e-mail: k.kanryu@gmail.com
 * twitter: @junzabroP

## Install

Just use mongojs.js! :)


## Live Examples
<a href="https://runnable.com/node-mongodb-native" target="_blank"><img src="https://runnable.com/external/styles/assets/runnablebtn.png" style="width:67px;height:25px;"></a>

## Introduction

This is a pure JavaScript clone for MongoDB. This API similar to at https://github.com/mongodb/node-mongodb-native .

A simple example of inserting a document.

```javascript
  //var MongoClient = require('mongodb').MongoClient
  //  , format = require('util').format;
  var MongoClient = require('mongojs').MongoClient
    , format = require('util').format;

  MongoClient.connect('mongodb://127.0.0.1:27017/test', function(err, db) {
    if(err) throw err;

    var collection = db.collection('test_insert');
    collection.insert({a:2}, function(err, docs) {
      
      collection.count(function(err, count) {
        console.log(format("count = %s", count));
      });

      // Locate all the entries using find
      collection.find().toArray(function(err, results) {
        console.dir(results);
        // Let's close the db
        db.close();
      });
    });
  })
```

## Data types

To store and retrieve the non-JSON MongoDb primitives ([ObjectID](http://www.mongodb.org/display/DOCS/Object+IDs), Long, Binary, [Timestamp](http://www.mongodb.org/display/DOCS/Timestamp+data+type), [DBRef](http://www.mongodb.org/display/DOCS/Database+References#DatabaseReferences-DBRef), Code).

In particular, every document has a unique `_id` which can be almost any type, and by default a 12-byte ObjectID is created. ObjectIDs can be represented as 24-digit hexadecimal strings, but you must convert the string back into an ObjectID before you can use it in the database. For example:

```javascript
  // Get the objectID type
  var ObjectID = require('mongodb').ObjectID;

  var idString = '4e4e1638c85e808431000003';
  collection.findOne({_id: new ObjectID(idString)}, console.log)  // ok
  collection.findOne({_id: idString}, console.log)  // wrong! callback gets undefined
```

Here are the constructors the non-Javascript BSON primitive types:

```javascript
  // Fetch the library
  var mongo = require('mongodb');
  // Create new instances of BSON types
  new mongo.Long(numberString)
  new mongo.ObjectID(hexString)
  new mongo.Timestamp()  // the actual unique number is generated on insert.
  new mongo.DBRef(collectionName, id, dbName)
  new mongo.Binary(buffer)  // takes a string or Buffer
  new mongo.Code(code, [context])
  new mongo.Symbol(string)
  new mongo.MinKey()
  new mongo.MaxKey()
  new mongo.Double(number)	// Force double storage
```

### The C/C++ bson parser/serializer

If you are running a version of this library has the C/C++ parser compiled, to enable the driver to use the C/C++ bson parser pass it the option native_parser:true like below

```javascript
  // using native_parser:
  MongoClient.connect('mongodb://127.0.0.1:27017/test'
    , {db: {native_parser: true}}, function(err, db) {})
```

The C++ parser uses the js objects both for serialization and deserialization.

## GitHub information

The source code is available at http://github.com/kanryu6/mongojs
You can either clone the repository or download a tarball of the latest release.

Once you have the source you can test the driver by running

    $ make test

in the main directory. You will need to have a mongo instance running on localhost for the integration tests to pass.

### Find

The find method is actually a factory method to create
Cursor objects. A Cursor lazily uses the connection the first time
you call `nextObject`, `each`, or `toArray`.

The basic operation on a cursor is the `nextObject` method
that fetches the next matching document from the database. The convenience
methods `each` and `toArray` call `nextObject` until the cursor is exhausted.

Signatures:

```javascript
  var cursor = collection.find(query, [fields], options);
  cursor.sort(fields).limit(n).skip(m).

  //cursor.nextObject(function(err, doc) {});
  //cursor.each(function(err, doc) {});
  cursor.toArray(function(err, docs) {});

  //cursor.rewind()  // reset the cursor to its initial state.
```

Useful chainable methods of cursor. These can optionally be options of `find` instead of method calls:

  * `.sort({field1: -1, field2: 1})` descending by field1, then ascending by field2.

Other options of `find`:

* `fields` the fields to fetch (to avoid transferring the entire document)
* `tailable` if true, makes the cursor [tailable](http://www.mongodb.org/display/DOCS/Tailable+Cursors).
* `batchSize` The number of the subset of results to request the database
to return for every request. This should initially be greater than 1 otherwise
the database will automatically close the cursor. The batch size can be set to 1
with `batchSize(n, function(err){})` after performing the initial query to the database.

For information on how to create queries, see the
[MongoDB section on querying](http://www.mongodb.org/display/DOCS/Querying).

```javascript
  var MongoClient = require('mongodb').MongoClient
    , format = require('util').format;    

  MongoClient.connect('mongodb://127.0.0.1:27017/test', function(err, db) {
    if(err) throw err;

    var collection = db
      .collection('test')
      .find({})
      .toArray(function(err, docs) {
        console.dir(docs);
    });
  });
```

### Insert

Signature:

```javascript
  collection.insert(docs, options, [callback]);
```

where `docs` can be a single document or an array of documents.

Useful options:

* `safe:true` Should always set if you have a callback.

See also: [MongoDB docs for insert](http://www.mongodb.org/display/DOCS/Inserting).

```javascript
  var MongoClient = require('mongodb').MongoClient
    , format = require('util').format;    

  MongoClient.connect('mongodb://127.0.0.1:27017/test', function(err, db) {
    if(err) throw err;
    
    db.collection('test').insert({hello: 'world'}, {w:1}, function(err, objects) {
      if (err) console.warn(err.message);
      if (err && err.message.indexOf('E11000 ') !== -1) {
        // this _id was already inserted in the database
      }
    });
  });
```

Note that there's no reason to pass a callback to the insert or update commands
unless you use the `safe:true` option. If you don't specify `safe:true`, then
your callback will be called immediately.

### Update: update and insert (upsert)

The update operation will update the first document that matches your query
(or all documents that match if you use `multi:true`).
If `safe:true`, `upsert` is not set, and no documents match, your callback will return 0 documents updated.

See the [MongoDB docs](http://www.mongodb.org/display/DOCS/Updating) for
the modifier (`$inc`, `$set`, `$push`, etc.) formats.

Signature:

```javascript
  collection.update(criteria, objNew, options, [callback]);
```

Useful options:

* `safe:true` Should always set if you have a callback.
* `multi:true` If set, all matching documents are updated, not just the first.
* `upsert:true` Atomically inserts the document if no documents matched.

Example for `update`:

```javascript
  var MongoClient = require('mongodb').MongoClient
    , format = require('util').format;    

  MongoClient.connect('mongodb://127.0.0.1:27017/test', function(err, db) {
    if(err) throw err;

    db.collection('test').update({hi: 'here'}, {$set: {hi: 'there'}}, {w:1}, function(err) {
      if (err) console.warn(err.message);
      else console.log('successfully updated');
    });
  });
```


### Save

The `save` method is a shorthand for upsert if the document contains an
`_id`, or an insert if there is no `_id`.

## Tests
$ mocha test_**.js

## License

 Copyright 2014 KATO Kanryu

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
