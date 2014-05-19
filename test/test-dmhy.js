/**
 * 下午1:08
 * Phoenix Nemo <i at phoenixlzx dot com>
 *
 */

var util = require('util');

var request = require('request');
var cheerio = require('cheerio');
var async = require('async');


var options = {
    url: 'http://127.0.0.1/dmhy-test.html',
    headers: {
        'User-Agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0; Trident/4.0)' // User agent of IE
    },
    timeout: 100000
};

var title = '';

request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        // console.log(body);
        // load whole page
        var $ = cheerio.load(body);

        var tableRows = $('body>div>div>div.main>div.clear.table>div.clear>table>tbody').children();

        console.log(tableRows);

        /*
        * tableRows[tr].children[1].children[1].children[0].data -> 發布日期
        * tableRows[tr].children[3].children[1].children[1].children[0].data -> 分類
        * tableRows[tr].children[5].children[1].children[1].children[0].data -> 字幕組
        * tableRows[tr].children[5].children[n] [] -> 標題
        * tableRows[tr].children[7].children[0].children[0].data -> 下載鏈接
        * tableRows[tr].children[9].children[0].data -> 文件大小
        * tableRows[tr].children[11].children[0].children[0].data -> 種子
        * tableRows[tr].children[13].children[0].children[0].data -> 下載
        * tableRows[tr].children[15].children[0].data -> 完成
        *
        * */
        // remove all \n\r\t's replace(/[\f\n\r\t\v]*/g, '')

        for (tr in tableRows) {

            if (tableRows[tr].type === 'tag' && tableRows[tr].children[3].children[1].children[1].children[0].data === '動畫') {

                // console.log('\n\n------------------------------\n');

                console.log(Object.keys(tableRows).length)


                var team = tableRows[tr].children[5].children[1].children[1].attribs.class !== 'keyword'?
                tableRows[tr].children[5].children[1].children[1].children[0].data.replace(/[\f\n\r\t\v]*/g, ''):'(未填寫)';

                // console.log('分類: ' + tableRows[tr].children[3].children[1].children[1].children[0].data);
                // console.log('字幕組: ' + team);

                var titletag = tableRows[tr].children[5];

                // console.log('\n============\n');
                title = '';
                async.eachSeries(titletag.children, function(tmp, cb) {
                    // console.log(tmp);
                    if (tmp.type === 'tag' && tmp.name === 'a') {
                        // title += tmp.data;
                        // console.log(tmp.children);

                        tmp.children.forEach(function(child) {
                            // console.log(child);
                            // console.log('\n---------------\n');
                            if (child.type === 'text') {
                                // console.log(tmp.children[0].data.replace(/[\f\n\r\t\v]*/g, ''));
                                title += child.data.replace(/[\f\n\r\t\v]*/g, '');

                            } else if (child.type === 'tag' && child.name === 'span') {
                                // console.log(tmp.data);
                                title += child.children[0].data.replace(/[\f\n\r\t\v]*/g, '');
                            }
                        });

                    }
                    cb();
                }, function() {
                    // console.log('種子標題: ' + title);
                });

                // console.log('發布日期: ' + tableRows[tr].children[1].children[1].children[0].data );
                // console.log('文件大小: ' + tableRows[tr].children[9].children[0].data);
                // console.log('種子: ' + tableRows[tr].children[11].children[0].children[0].data);
                // console.log('下載: ' + tableRows[tr].children[13].children[0].children[0].data);
                // console.log('完成: ' + tableRows[tr].children[15].children[0].data);

            }

        }

    }
});
