
require('colors');

// 获取配置
const CONIFG = (() => {
    return {
        srcPath: './src',
        env: process.env.NODE_ENV,
        sourceMap: process.env.SOURCE_MAP ==='sourceMap', // 是否使用sourceMap
        isDev: process.env.NODE_ENV === 'dev', // 开发环境
        isLocal: !!process.env.LOCAL, // 本地开发
        distPath: '/dist'
    };
})();

CONFIG.isDev && console.log(`本地打包得到的文件大小并不是真实文件大小，因为其中包含了source-map，目前只在本地开发时开启source-map`.red);
console.log(JSON.stringify(CONFIG, null, 4));

// 获取entries 为加快打包速度，部分打包只打包main
const { entries } = getEntriesRouter(CONFIG);
module.exports = {
    cache: false,
    mode,
    entry,
    ouput,
    externals,
    resolve,
    module: {
        rules: []
    },
    target,
    devtool,
    context,
    performance,
    optimization,
    plugins:[]
}