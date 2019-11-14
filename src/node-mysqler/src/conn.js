const mysql = require("mysql");
const conn = config => new Promise(( resolve, reject ) => {
  global.connection = mysql.createConnection({ ...config });
  global.connection.connect(err => {
    if (err) {
      console.log(`[query] - : ${err}`);
      reject(err);
    }
    console.log("[connection connect] succeed!");
    resolve();
  });
  return;
});

const close = () => {
  if (!global.connection) {
    return;
  }
  global.connection.end(err => {
    if (err) {
      // process.exit(0);
    }
    console.log("[connection end] succeed!");
  });
};

module.exports = {
  conn,
  close
};
