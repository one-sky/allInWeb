const mysql = require("mysql");
const conn = async config => {
  global.connection = await mysql.createConnection({ ...config });
  await connection.connect(err => {
    if (err) {
      console.log(`[query] - : ${err}`);
      return 0;
    }
    console.log("[connection connect] succeed!");
  });
  return 1;
};

const close = () => {
  if (!global.connection) {
    return;
  }
  global.connection.end(err => {
    if (err) {
      return;
    }
    console.log("[connection end] succeed!");
  });
};

module.exports = {
  conn,
  close
};
