const Util = require("./util");

/**
 *
 * @param {*} table
 * @param {*} condition example: condition = {id: 1,year: {lowOption: '>=', low:12, highOption: '<', high: 14}}, workType: ['前端工程师', 'python工程师']}
 * @param {*} keyMatch true：dataList中的key与表中字段名一致 false为key为驼峰式，表中为下划线分割（example：work_type)
 * @param {*} callback
 */

const deleteData = (table, condition = {}, callback, keyMatch = true) => new Promise(( resolve, reject ) => {
  try {
    const connection = global.connection;
    if (!connection) {
      reject();
    }
    let _WHERE = Util.concatCondition(condition, keyMatch);
    let sql = `DELETE FROM ${table}`;
    sql += condition ? ` WHERE ${_WHERE}` : "";
    console.log(sql);
    connection.query(sql, (err, rows, fields) => {
      if (err) {
        console.log("DELETE ERROR - ", err.message);
        reject(err);
      }
      callback && callback();
      resolve(rows.affectedRows);
    });
  } catch (error) {
    console.log(error);
    reject(error);
  }
});

module.exports = deleteData;
