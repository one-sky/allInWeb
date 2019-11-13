const conn = require("./conn");
const connection = conn();

/**
 *
 * @param {*} table
 * @param {*} condition example: condition = {id: 1,year: {low:12, high: 14},workType: ['前端工程师', 'python工程师']}
 * @param {*} keyMatch true：dataList中的key与表中字段名一致 false为key为驼峰式，表中为下划线分割（example：work_type)
 * @param {*} callback
 */

const deleteData = (table, condition, callback, keyMatch = true) => {
  var _WHERE = "";
  for (var k2 in where) {
    //多个筛选条件使用  _WHERE+=k2+"='"+where[k2]+"' AND ";
    _WHERE += k2 + "=" + where[k2];
  }
  const sql = `DELETE FROM ${table} WHERE ${_WHERE}`;
  connection.query(sql, callback);
};
