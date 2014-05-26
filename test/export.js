/**
 * 下午12:05
 * Phoenix Nemo <i at phoenixlzx dot com>
 * License MIT | http://opensource.org/licenses/MIT
 */


var query = '魔劣720';

var fs = require('fs');

var MongoClient = require('mongodb').MongoClient;

var async = require('async');

var config = require('../config');

var data = '# 数据来源\t字幕组\t发布日期\t标题\t种子\t下载\t完成\t抓取时间\n';

console.log('querying for ' + query);

MongoClient.connect(config.mongodb, { db: { native_parser: true, w : 1 } }, function(err, db) {
    if (err) {
        throw err;
    }

    var collection = db.collection('bangumistats');



    collection.find({
        titleIndex: {
            $all: query.split('')
        }
    }).toArray(function(err, docs) {
        if (err) throw err;
        var i = 0;
        async.eachSeries(docs, function(doc, cb) {

           console.log('Processing: ' + doc.title + ', Task time: ' + read(doc.taskTime));

            if (!doc.title) {
                return cb();
            }

            data += doc.source + '\t' + doc.team + '\t' + doc.publishDate + '\t' + doc.title + '\t' +
                doc.torrents + '\t' + doc.downloads + '\t' + doc.finish + '\t' + read(doc.taskTime) + '\n';

            if (i % 200 === 0) {

                fs.appendFile('./exports_data.txt', data, function (err) {
                    if (err) throw err;
                    data = '';
                    console.log('Data exporting step ' + i);
                    i++;
                    cb();
                });

            } else {

                i++;
                cb();

            }

        }, function() {
            console.log('Data exported.');
            process.exit(0);
        });

    });

});

function read(unixtime) {
    var time = new Date(unixtime);

    return time.getFullYear() + '-' + (time.getMonth() + 1) + '-' + time.getDate() + ' ' +
        time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds();
}