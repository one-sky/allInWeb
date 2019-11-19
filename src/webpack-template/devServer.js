// const http = require('http');
const path = require('path');
const webpack = require('webpack');
const Koa = require('koa');
const cors = require('@koa/cors');
const server = require('koa-static');
const { devMiddleware } = require('koa-webpack-middleware');

const CONFIG = require('./webpack.config');

const app = new Koa();
const compiler = webpack(CONFIG);
// 显示编译进度
compiler.apply(new webpack.ProgressPlugin());

// 发送cookie
app.use(cors({credentials: true}));

// 配置运行时打包
const instance = devMiddleware(compiler, {
    publicPath: CONFIG.output.path
});

app.use(instance);

// 静态资源
app.use(server(path.resolve(__dirname, '../')));

// app.get('/favicon.ico', (req, res) => {
//     res.json({});
// });

// app.get('*', (req, res) => {
//     res.sendFile(path.resolve(__dirname, './index.html'));
// });

// http.createServer(app.callback()).listen(3000);
app.listen(3000);