const http = require('http');
const path = require('path');
const webpack = require('webpack');
const express = require('express');
const cors = require('cors');
const middleware = require('webpack-dev-middleware');

const CONFIG = require('./webpack.config');

const app = new express();
const compiler = webpack(CONFIG);
// 显示编译进度
compiler.apply(new webpack.ProgressPlugin());

// 发送cookie
app.use(cors({credentials: true}));

// 配置运行时打包
const instance = middleware(compiler, {
    publicPath: '/webpack-template/dist/'
});

app.use(instance);

// 静态资源
app.use(express.static(path.resolve(__dirname, '../')));

app.get('/favicon.ico', (req, res) => {
    res.json({});
});

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, './index.html'));
});
http.createServer(app).listen(3000, '0.0.0.0');
// app.listen(3000);