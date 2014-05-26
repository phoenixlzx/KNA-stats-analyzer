/**
 * 上午12:00
 * Phoenix Nemo <i at phoenixlzx dot com>
 *
 */

var fs = require('fs');

var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var MongoClient = require('mongodb').MongoClient;

var config = require('./config');


setInterval(function() {

    if (config.enable_ktxp) {
        fetchktxp();
    }

    if (config.enable_dmhy) {
        fetchdmhy();
    }

}, config.fetch_interval * 60 * 1000 || 30 * 60 * 1000);


function fetchktxp() {

    var updateTime = new Date().getTime();

    console.log('極影數據更新進程觸發。當前時間: ' + new Date(updateTime));

    parseUrlList('./bangumi-ktxp.list', function(err, urls) {
        if (err) throw err;

        async.each(urls, function(url, callback) {

            fetch(url, function(err, body) {
                if (err) {
                    console.log('獲取數據出錯，錯誤響應: ' + err);
                    return callback();
                }

                console.log('成功獲取數據，URL: ' + url);

                parseKtxp(body, updateTime, function(bangumiarray) {

                    save(bangumiarray, function(err) {
                        if (err) {
                            return console.log('保存到數據庫時出錯: ' + err + '\nURL: ' + url);
                        }

                        console.log('數據保存成功，URL: ' + url);

                        callback();
                    });

                });

            });
        }, function() {
            console.log(new Date(updateTime) + ' 啓動的數據更新任務已完成。')
        });
    });
}

function fetchdmhy() {

    var updateTime = new Date().getTime();

    console.log('動漫花園數據更新進程觸發。當前時間: ' + new Date(updateTime));

    parseUrlList('./bangumi-dmhy.list', function(err, urls) {
        if (err) throw err;

        async.each(urls, function(url, callback) {

            fetch(url, function(err, body) {
                if (err) {
                    console.log('獲取數據出錯，錯誤響應: ' + err);
                    return callback();
                }

                console.log('成功獲取數據，URL: ' + url);

                parseDmhy(body, updateTime, function(bangumiarray) {

                    save(bangumiarray, function(err) {
                        if (err) {
                            return console.log('保存到數據庫時出錯: ' + err + '\nURL: ' + url);
                        }

                        console.log('數據保存成功，URL: ' + url);

                        callback();
                    });

                });

            });
        }, function() {
            console.log(new Date(updateTime) + ' 啓動的數據更新任務已完成。')
        });
    });

}

function parseUrlList(file, callback) {

    var urls = [];

    fs.readFile(file, 'utf8', function(err, data) {

        var links = data.split("\n");

        async.eachSeries(links, function(url, cb) {

            if (url.indexOf("#") === 0 || (!url)) {
                // ignore comment and empty lines.
                cb();
            } else {
                urls.push(url);
                cb();
            }
        }, function(err) {
            if (err) {
                return callback(err, null);
            }
            callback(null, urls);
        });
    });
}

function fetch(url, callback) {

    var options = {
        url: url,
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 7.1; Trident/5.0)'
        },
        timeout: 100000
    };

    request(options, function (error, response, body) {

        console.log('正在獲取數據，URL: ' + url);

        if (!error && response.statusCode == 200) {
            // console.log('成功獲取數據，URL: ' + url);
            callback(null, body);
        } else {
            // console.log('獲取數據出錯，錯誤響應: ' + response.statusCode);
            callback(response.statusCode, null);
        }
    });

}

function parseKtxp(body, taskTime, callback) {

    var bangumiarray = [];

    var title = '';

    var $ = cheerio.load(body);

    var tableRows = $('tbody').children();

    var tasks = Object.keys(tableRows).length - 3;

    for (tr in tableRows) {

        if (tableRows[tr].type === 'tag') {

            var titletag = tableRows[tr].children[5].children[1];

            title = '';

            async.eachSeries(titletag.children, function(tmp, cb) {

                if (tmp.type === 'text') {
                    title += tmp.data;
                    // console.log(tmp.data);
                } else if (tmp.type === 'tag' && tmp.name === 'span') {
                    // handle keyword span
                    title += tmp.children[0].data;
                    // console.log(tmp.children);
                }

                cb();

            }, function() {
	      
	        tasks--;

                bangumiarray.push({
                    source: 'KTXP',
                    team: tableRows[tr].children[15].children[0].children[0].data,
                    publishDate: tableRows[tr].children[1].attribs.title,
                    title: title,
                    fileSize: tableRows[tr].children[7].children[0].data,
                    torrents: tableRows[tr].children[9].children[0].data,
                    downloads: tableRows[tr].children[11].children[0].data,
                    finish: tableRows[tr].children[13].children[0].data,
                    taskTime: taskTime,
                    titleIndex: title.split('')
                });

                // Object.keys(tableRows) is an array ['0', '1', '2', ..., 'length'..] and its larger than tr amount - 1.
                if (tasks === 0) {

                    // console.log(tasks);
                    return callback(bangumiarray);

                }

            });

        }

    }
}

function parseDmhy(body, taskTime, callback) {

    var bangumiarray = [];

    var title = '';

    var $ = cheerio.load(body);

    var tableRows = $('body>div>div>div.main>div.clear.table>div.clear>table>tbody').children();

    var tasks = 0;

    // get valid bangumi length
    for (tr in tableRows) {
        if (tableRows[tr].type === 'tag' && tableRows[tr].children[3].children[1].children[1].children[0].data === '動畫') {
            tasks++;
        }
    }

    for (tr in tableRows) {

        if (tableRows[tr].type === 'tag' && tableRows[tr].children[3].children[1].children[1].children[0].data === '動畫') {

            var team = tableRows[tr].children[5].children[1].children[1].attribs.class !== 'keyword'?
                tableRows[tr].children[5].children[1].children[1].children[0].data.replace(/[\f\n\r\t\v]*/g, ''):'(未填寫)';

            var titletag = tableRows[tr].children[5];

            title = '';

            async.eachSeries(titletag.children, function(tmp, cb) {

                if (tmp.type === 'tag' && tmp.name === 'a') {

                    tmp.children.forEach(function(child) {

                        if (child.type === 'text') {

                            title += child.data.replace(/[\f\n\r\t\v]*/g, '');

                        } else if (child.type === 'tag' && child.name === 'span') {

                            title += child.children[0].data.replace(/[\f\n\r\t\v]*/g, '');
                        }
                    });

                }

                cb();

            }, function() {
	      
	        tasks--;

                bangumiarray.push({
                    source: 'DMHY',
                    team: team,
                    publishDate: tableRows[tr].children[1].children[1].children[0].data,
                    title: title,
                    fileSize: tableRows[tr].children[9].children[0].data,
                    torrents: tableRows[tr].children[11].children[0].children[0].data,
                    downloads: tableRows[tr].children[13].children[0].children[0].data,
                    finish: tableRows[tr].children[15].children[0].data,
                    taskTime: taskTime,
                    titleIndex: title.split('')
                });

                if (tasks === 0) {

                    return callback(bangumiarray);

                }

            });

        }

    }

}

function save(bangumiarray, callback) {
    // console.log(bangumiarray);
    // save document array to database.

    MongoClient.connect(config.mongodb, { db: { native_parser: true, w : 1 } }, function(err, db) {
        if (err) {
            throw err;
        }

        var collection = db.collection('bangumistats');

        collection.insert(bangumiarray, {

            safe: true

        }, function(err) {

            if (err) {

                return callback(err);

            }

            collection.ensureIndex({
                source: 1,
                team: 1,
                taskTime: 1,
                titleIndex: 1
            }, function(err) {

                if (err) {
                    return callback(err);
                }

                callback();

            });

        });

    });

}
