/**
 * 下午12:28
 * Phoenix Nemo <i at phoenixlzx dot com>
 * License MIT | http://opensource.org/licenses/MIT
 */

var MongoClient = require('mongodb').MongoClient;

var config = require('../config');

MongoClient.connect(config.mongodb, { db: { native_parser: true, w : 1 } }, function(err, db) {

    // update old data with new title index

    if(err) {
        throw err;
    }

    var collection = db.collection('bangumistats');

    // get all docs

    var cursor = collection.find({});

    cursor.forEach(function(doc) {
        console.log('Processing: ' + doc.title);
        collection.update({
            _id: doc._id
        }, {
            $set: {
                titleIndex: doc.titleIndex.join().replace(/,/g, ' ').split('').clean(" ")
            }
        }, function(err) {
            if (err) throw err;
            collection.ensureIndex({
                titleIndex: 1
            }, function(err, doc) {
                if (err) throw err;
                console.log('update operation success.');
            });
        });
    });

});

Array.prototype.clean = function (deleteValue) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == deleteValue) {
            this.splice(i, 1);
            i--;
        }
    }
    return this;
};