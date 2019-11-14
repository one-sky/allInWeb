const Util = require("./util");

/**
 *
 * @param {*} table
 * @param {*} fields
 * @param {*} condition example: condition = {id: 1,year: {lowOption: '>=', low:12, highOption: '<', high: 14}}, workType: ['前端工程师', 'python工程师']}
 * @param {*} callback
 * @param {*} keyMatch true：dataList中的key与表中字段名一致 false为key为驼峰式，表中为下划线分割（example：work_type)
 */
const select = (table, fields, condition, callback, keyMatch = true) => new Promise(( resolve, reject ) => {
  let valueList = []; //存放select到的数组 [{},{}]
  try {
    const connection = global.connection;
    if (!connection) {
      reject();
    }
    if (fields && fields instanceof Array) {
      fields = fields.join(",");
      fields = !keyMatch && Util.formatKey(fields);
    } else {
      fields = "*";
    }
    const _WHERE = Util.concatCondition(condition, keyMatch);
    let sql = `SELECT ${fields} FROM ${table}`;
    sql += condition ? ` WHERE ${_WHERE}` : "";
    console.log(sql);
    connection.query(sql, (err, results, fields) => {
      if (err) {
        console.log("SELECT ERROR - ", err.message);
        reject(err);
      }
      valueList = JSON.stringify(results);
      valueList = JSON.parse(valueList);
      valueList = valueList.map(item =>
        Object.fromEntries(
          Object.keys(item).map(i => [Util.formatKeyToObject(i), item[i]])
        )
      );
      callback && callback();
      resolve(valueList);
    });
  } catch (error) {
    console.log(error);
    reject(error);
  }
});

module.exports = select;