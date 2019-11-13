const conn = require("./conn");
const Util = require("./util");
const connection = conn();

/**
 *
 * @param {*} table
 * @param {*} dataList
 * @param {*} callback
 * @param {*} keyMatch true：dataList中的key与表中字段名一致 false为key为驼峰式，表中为下划线分割（example：work_type)
 */
const insert = async (table, dataList = [], callback, keyMatch = true) => {
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
  await connection.query(sql, [valueList], (err, rows, fields) => {
    if (err) {
      console.log("INSERT ERROR - ", err.message);
      return;
    }
    callback && callback();
  });
  return;
};

module.exports = insert;
