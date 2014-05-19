module.exports = {

    // 抓取極影數據
    enable_ktxp: true,
    // 抓取花園數據
    enable_dmhy: true,

    // 抓取間隔分鍾數，默認30分鍾
    fetch_interval: 30,

    // MongoDB 數據庫地址
    mongodb: 'mongodb://127.0.0.1:27017/stats'
};