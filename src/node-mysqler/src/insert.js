const Util = require("./util");
/**
 *
 * @param {*} table
 * @param {*} dataList
 * @param {*} callback
 * @param {*} keyMatch true：dataList中的key与表中字段名一致 false为key为驼峰式，表中为下划线分割（example：work_type)
 */
const insert = (table, dataList = [], callback, keyMatch = true) => new Promise(( resolve, reject ) => {
  const connection = global.connection;
  try {
    if (!connection) {
      reject();
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
    const sql = `INSERT INTO ${table}(${fields}) VALUES ?`;
    console.log(sql);
    console.log(valueList);
    connection.query(sql, [valueList], (err, rows, fields) => {
      if (err) {
        console.log("INSERT ERROR - ", err.message);
        reject(err);
      }
      callback && callback();
      resolve(rows);
    });
  } catch (error) {
    console.log(error);
    reject(error);
  } finally {
    resolve();
  }
});

module.exports = insert;
