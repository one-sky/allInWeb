const conn = config => {
  const connection = mysql.createConnection({ ...config });
  return connection;
};

module.exports = conn;
