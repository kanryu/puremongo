## PureMongo - a pure JavaScript clone for MongoDB
 

### Questions and Bug Reports

 * e-mail: k.kanryu@gmail.com
 * twitter: @junzabroP

## Install

Just use puremongo.js! :)


## Live Examples
<a href="https://runnable.com/node-mongodb-native" target="_blank"><img src="https://runnable.com/external/styles/assets/runnablebtn.png" style="width:67px;height:25px;"></a>

## Introduction

This is a pure JavaScript clone for MongoDB. This API is similar to at https://github.com/mongodb/node-mongodb-native .

You can run the DB on node.js, on Common.js, even on web browsers.

A simple example of inserting a document.

```javascript
  //var MongoClient = require('mongodb').MongoClient
  //  , format = require('util').format;
  var MongoClient = require('./puremongo').MongoClient
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

Currently, puremongo doesn't have any function as a network server, only in-process working.


## GitHub information

The source code is available at http://github.com/kanryu/puremongo
You can either clone the repository or download a tarball of the latest release.

### Find

The find method is actually a factory method to create
Cursor objects. A Cursor lazily uses the connection the first time
you call `toArray`.

The basic operation on a cursor is the `nextObject` method
that fetches the next matching document from the database. The convenience
methods `each` and `toArray` call `nextObject` until the cursor is exhausted.

Signatures:

```javascript
  var cursor = collection.find(query, [fields], options);
  cursor.sort(fields).limit(n).skip(m);

  cursor.toArray(function(err, docs) {});
```

Useful chainable methods of cursor. These can optionally be options of `find` instead of method calls:

  * `.limit(n).skip(m)` to control paging.
  * `.sort(fields)` Order by the given fields. There are several equivalent syntaxes:
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
```shellscript
  $ mocha test_*.js
```

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
