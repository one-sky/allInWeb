
const path = require('path');
const webpack = require('webpack');
const WebpackOnBuildPlugin = require('on-build-webpack');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const WebpackPwaManifest = require('darmody-webpack-pwa-manifest');

const handleRouter = require('./webpack/handleRouter'); // 处理打包结果生成路由文件
const getEntriesRouter = require('./webpack/getEntriesRouter'); // 获取文件入口与路由
const notify = require('./webpack/notify'); // 打包消息通知
require('colors');

// 获取配置
const CONFIG = (() => {
    return {
        srcPath: './src',
        env: process.env.NODE_ENV,
        sourceMap: process.env.SOURCE_MAP ==='sourceMap', // 是否使用sourceMap
        isDev: process.env.NODE_ENV === 'dev', // 开发环境
        distPath: '/dist'
    };
})();

CONFIG.isDev && console.log(`本地打包得到的文件大小并不是真实文件大小，因为其中包含了source-map，目前只在本地开发时开启source-map`.red);
console.log(JSON.stringify(CONFIG, null, 4));

// 获取entries 为加快打包速度，部分打包只打包main
const { entries } = getEntriesRouter(CONFIG);
// 正式环境公共代码hash减少更新，避免重复构建
const filename = CONFIG.isDev ? '[name].[hash:9].js' : '[name].[chunkhash:9].js';


module.exports = {
    cache: true,
    watch: false,
    mode: CONFIG.isDev ? 'development' : 'production',
    entry: {...entries, vendor: ['react', 'react-dom', 'prop-types']},
    output: {
        path: path.resolve(__dirname,CONFIG.distPath),
        filename,
        chunkFilename: '[name].[chunkhash:9].js'
    },
    externals: {
        // 不想引入的自定宜库
        // import A from 'a'
        // a: 'A'
    },
    resolve: {
        alias: {
            components: path.resolve(__dirname, './src/components'),
            module: path.resolve(__dirname, './src/module'),
        },
        extensions: ['.js']
    },
    module: {
        rules: [
            {
               test:/\.js$/,
               use: [{
                   loader: 'babel-loader',
                   options: {
                       cacheDirectory: true,
                       plugins: ["react-css-modules", {
                            context: path.resolve(__dirname, ".src"),
                            'exclude': path.resolve(__dirname, 'src/main/css'),
                            filetypes: {
                                '.less': {
                                    syntax: 'postcss-less'
                                }
                            },
                            "generateScopedName": "[local]--[hash:base64:5]" 
                        }]
                   }
               }] 
            },
            {
                test: '/\.css$/',
                use: ['style-loader','css-loader'],
            },
            {
                test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
                loader: 'url-loader',
            }
        ]
    },
    target: 'web',
    devtool: CONFIG.sourceMap && 'cheap-module-eval-source-map',
    context: __dirname,
    performance: {
        hints:false   
    },
    optimization: {
        moduleIds: 'hashed', // 避免module新增或删除，moduleId改变，缓存失效
        namedChunks: true,
        namedModules: true,
        splitChunks: {
            name: 'vendor',
            cacheGroups: {
                vendor: {
                    chunks: 'initial',
                    name: 'vendor',
                    test: 'vendor',
                    enforce: true
                },
            }
        },
        runtimeChunk: {
            name: 'manifest'
        },
    },
    plugins:[
        new CaseSensitivePathsPlugin(), // 对于文件名，mac上默认不敏感、linux敏感，这里敏感
        new webpack.ProvidePlugin({
            React: 'react',
            ReactDOM: 'react-dom',
        }),
        // 开发环境 打包前清空
        new CleanWebpackPlugin(),
        // 打包结束
        new WebpackOnBuildPlugin((stats) => {
            const { compilation } = stats;
            const { errors } = compilation;

            handleRouter(compilation, CONFIG);
            if (errors.length > 0) {
                const error = errors[0];
                notify(error.name, error.message, true);
            } else {
                const warningNumber = compilation.warnings.length;
                let message = `takes ${stats.endTime - stats.startTime} ms`;
                if (warningNumber > 0) {
                    message += `,with ${warningNumber} warning(s)`;
                }
                notify('webpack building done', message);
            }

        }),
        new WebpackPwaManifest({
            name: 'xx',
            short_name: 'xx',
            description: 'xx',
            background_color: '#000000',
            theme_color: '#000000',
            display: 'standalone',
            start_url: '/',
            fingerprints: true,
        })
    ]
}