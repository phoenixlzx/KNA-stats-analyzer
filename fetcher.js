/**
 * 上午12:00
 * Phoenix Nemo <i at phoenixlzx dot com>
 *
 */

var fs = require('fs');

var request = require('request');
var cheerio = require('cheerio');
var async = require('async');

var config = require('./config');
/*
setInterval(function() {

    if (config.enable_ktxp) {
        fetchktxp();
    }

    if (config.enable_dmhy) {
        fetchdmhy();
    }

}, config.fetch_interval * 60 * 1000 || 30 * 60 * 1000);
*/
fetchktxp();

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

                parseKtxp(body, function(bangumiarray) {

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
    // Do nothing currently..
    console.log('Not implemented yet.');
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

function parseKtxp(body, callback) {

    var bangumiarray = [];

    var title = '';

    var $ = cheerio.load(body);

    var tableRows = $('tbody').children();

    var tasks = 0;

    for (tr in tableRows) {

        if (tableRows[tr].type === 'tag') {

            tasks++;

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

                bangumiarray.push({
                    source: 'KTXP',
                    team: tableRows[tr].children[15].children[0].children[0].data,
                    publishDate: tableRows[tr].children[1].attribs.title,
                    title: title,
                    fileSize: tableRows[tr].children[7].children[0].data,
                    torrents: tableRows[tr].children[9].children[0].data,
                    downloads: tableRows[tr].children[11].children[0].data,
                    finish: tableRows[tr].children[13].children[0].data
                });

            });

        }

        // Object.keys(tableRows) is an array ['0', '1', '2', ..., 'length'..] and its larger than tr amount - 1.
        if (tasks === Object.keys(tableRows).length - 3) {

            // console.log(tasks);
            return callback(bangumiarray);

        }

    }
}

function parseDmhy(body, callback) {

}

function save(bangumiarray, callback) {
    console.log(bangumiarray.length);
    callback();
}

function parseTable(table) {

}