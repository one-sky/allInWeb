const Util = require("./util");

/**
 *
 * @param {*} table
 * @param {*} attrs
 * @param {*} condition example: condition = {id: 1,year: {lowOption: '>=', low:12, highOption: '<', high: 14}}, workType: ['前端工程师', 'python工程师']}
 * @param {*} callback
 * @param {*} keyMatch true：dataList中的key与表中字段名一致 false为key为驼峰式，表中为下划线分割（example：work_type)
 */
const update = async (
  table,
  attrs = {},
  condition = {},
  callback,
  keyMatch = true
) => {
  try {
    const connection = global.connection;
    if (!connection) {
      return valueList;
    }
    const _WHERE = Util.concatCondition(condition, keyMatch);
    const attrList = Object.entries(attrs).map(item => {
      item[0] = !keyMatch && Util.formatKey(item[0]);
      item.join("=");
    });
    if (attrList.length === 0) {
      return;
    }
    let sql = `UPDATE ${table} set ${attrList.join(",")}`;
    sql += condition ? ` WHERE ${_WHERE}` : "";
    console.log(sql);
    await connection.query(sql, (err, rows, fields) => {
      if (err) {
        console.log("UPDATE ERROR - ", err.message);
        return err;
      }
      callback && callback();
    });
    return rows;
  } catch (error) {
    console.log(error);
  } finally {
    return;
  }
};

module.exports = update;
