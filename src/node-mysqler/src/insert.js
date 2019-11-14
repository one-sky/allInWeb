const Util = require("./util");
/**
 *
 * @param {*} table
 * @param {*} dataList
 * @param {*} callback
 * @param {*} keyMatch true：dataList中的key与表中字段名一致 false为key为驼峰式，表中为下划线分割（example：work_type)
 */
const insert = async (table, dataList = [], callback, keyMatch = true) => {
  const connection = global.connection;
  try {
    if (!connection) {
      return;
    }
    let fields = []; // 存放key的数组
    let valueList = []; //存放insert数据的数组 [[],[]]
    // 获取key数组 以及value数组，排除dataList对象数组 key无序
    dataList.forEach((item, index) => {
      if (index === 0) {
        fields = Object.keys(item);
      }
      valueList.push(fields.map(i => item[i]));
    });
    // 将key为类似workType转化为work_type
    fields = fields.join(",");
    fields = !keyMatch && Util.formatKey(fields);
    const sql = `INSERT INTO ${table}(${fields}) VALUES(?)`;
    console.log(sql);
    console.log(valueList);
    await connection.query(sql, valueList, (err, rows, fields) => {
      if (err) {
        console.log("INSERT ERROR - ", err.message);
        return err;
      }
      callback && callback();
      return rows;
    });
  } catch (error) {
    console.log(error);
  } finally {
    return;
  }
};

module.exports = insert;
