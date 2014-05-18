/**
 * 下午9:28
 * Phoenix Nemo <i at phoenixlzx dot com>
 *
 */

var util = require('util');

var request = require('request');
var cheerio = require('cheerio');
var async = require('async');


var options = {
    url: 'http://bt.ktxp.com/search.php?keyword=%E4%B8%80%E5%91%A8%E7%9A%84%E6%9C%8B%E5%8F%8B',
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

        var tableRows = $('tbody').children();
        for (tr in tableRows) {
            if (tableRows[tr].type === 'tag') {
                /*
                * tableRows[tr].children[1].attribs.title -> 發布日期
                * tableRows[tr].children[3] -> 新番連載..
                * tableRows[tr].children[5].children[0] -> 種子地址
                * tableRows[tr].children[5].children[1] -> 種子標題
                * tableRows[tr].children[7].children[0].data -> 種子大小
                * tableRows[tr].children[9].children[0].data -> 種子數量
                * tableRows[tr].children[11].children[0].data -> 下載次數
                * tableRows[tr].children[13].children[0].data -> 完成次數
                * tableRows[tr].children[15].children[0].children[0].data -> 字幕組
                * */
                // console.log(tableRolls[tr].children[5].children[1]);

                console.log(Object.keys(tableRows));

                console.log('字幕組: ' + tableRows[tr].children[15].children[0].children[0].data);
                console.log('發布日期: ' + tableRows[tr].children[1].attribs.title);
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
                    console.log('種子標題: ' + title);
                });

                console.log('文件大小: ' + tableRows[tr].children[7].children[0].data);

                console.log('種子: ' + tableRows[tr].children[9].children[0].data +
                        '\n下載: ' + tableRows[tr].children[11].children[0].data +
                        '\n完成: ' + tableRows[tr].children[13].children[0].data);

                console.log('\n---------------------------------------------\n');

            }
        }

/*
        $('tbody tr').each(function(i, elem) {
            // $(this).text();
            // console.log(i);
            elem.children.forEach(function(child) {
                if (child.type === 'tag') {
                    // parser for html tags
                    console.log('TAG <td>: ' + util.inspect(child.children));
                }

                console.log('----------- TAG END --------------')
            });
        });
        */
    }
});
