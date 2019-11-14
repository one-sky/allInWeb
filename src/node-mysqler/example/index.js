const DB = require("../../node-mysqler");
async function main() {
  const result = await DB.conn({
    host: "127.0.0.1",
    user: "root",
    password: "root",
    port: "3306",
    database: "TestDB"
  });
  if (!result) {
    return;
  }
  const dataList = [
    {
      picture: "1",
      imgUrl: "http://22.com",
      title: "333",
      price: 4444.0
    },
    {
      picture: "a",
      title: "ccc",
      imgUrl: "http://bb.com",
      price: 4444.0
    }
  ];
  console.log(await DB.insert("products", dataList, undefined, false));
  return;
}
main();
