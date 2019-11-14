const DB = require("../../node-mysqler");
async function main() {
  await DB.conn({
    host: "127.0.0.1",
    user: "root",
    password: "root",
    port: "3306",
    database: "TestDB",
    keyMatch: false // dataList中的key与表中字段名一致 false为key为驼峰式，表中为下划线分割（example：work_type)
  });
  let dataList = [
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
      price: 2222.0
    }
  ];
  await DB.insert("products", dataList, undefined, false);

  // SELECT id,title,img_url FROM products WHERE img_url like '%22%' and title in ('333','ccc')
  const fields = ['id', 'title', 'imgUrl'];
  let condition = {imgUrl: {lowOption: 'like', low:'%22%'}, title: ['333', 'ccc'] };
  dataList = await DB.select("products", fields, condition,undefined, false);
  console.log(dataList);

  condition = {id: dataList.length > 0 ? dataList[0].id : 1};
  let result = await DB.update("products", {imgUrl: 'http://bb1.com'}, condition,undefined, false);
  console.log(`affect rows ${result}`);

  result = await DB.delete("products", condition,undefined, false);
  console.log(`delete rows ${result}`);

  process.exit(0);
}
main();
