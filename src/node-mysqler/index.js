const { conn, close } = require("./src/conn");
const INSERT = require("./src/insert");
const DELETE = require("./src/delete");
const UPDATE = require("./src/update");
const SELECT = require("./src/select");

exports.conn = conn;
exports.close = close;
exports.insert = INSERT;
exports.delete = DELETE;
exports.update = UPDATE;
exports.select = SELECT;
