const puppeteer = require("puppeteer");
const mysql = require("mysql");

// 定义需要爬取的网页数量
const TOTAL_PAGE = 2;
// 爬虫url
const URL =
  "https://list.tmall.com/search_product.htm?q=%CD%E2%CC%D7&type=p&vmarket=&spm=a211oj.0.a2227oh.d100&from=..pc_1_searchbutton";
// 数据库连接信息
const DB = {
  host: "127.0.0.1",
  user: "root",
  password: "root",
  port: "3306"
};

// 格式化的进度输出 用来显示当前爬取的进度
const formatProgress = current => {
  const percent = (current / TOTAL_PAGE) * 100;
  const done = (current / TOTAL_PAGE) * 40;
  const left = 40 - done;
  const str = `当前进度：[${"".padStart(done, "=")}${"".padStart(
    left,
    "-"
  )}]   ${percent}%`;
  return str;
};

async function main() {
  // { headless: false }
  const browser = await puppeteer.launch();
  const connection = mysql.createConnection({ ...DB });
  connection.connect(err => {
    if (err) {
      console.log(`[query] - : ${err}`);
      return;
    }
    console.log("[connection connect] succeed!");
  });
  try {
    const page = await browser.newPage();
    // 监听页面内部的console消息
    // page.on('console', msg => {
    //     if (typeof msg === 'object') {
    //         console.dir(msg);
    //     } else {
    //         console.log(msg);
    //     }
    // });
    console.log("服务正常启动");
    await page.goto(URL, {
      timeout: 0
    });
    // await page.evaluate('() =>{ Object.defineProperties(navigator,{ webdriver:{ get: () => false } }) }');
    // await asyncio.sleep(100);
    console.log("页面初次加载完毕");
    connection.query("CREATE database if not exists `TestDB`;", err => {
      if (err) {
        console.log(`[query] - : ${err}`);
        return;
      }
      console.log(`CREATE DATABASE SUCCESS!`);
    });
    connection.query("use `TestDB`;");
    connection.query(
      "create table if not exists `products`(`id` int PRIMARY KEY AUTO_INCREMENT, `picture` nchar(255),`link` nchar(255), `title` nchar(128), `price` decimal(12,2)) ;",
      err => {
        if (err) {
          console.log(`[query] - : ${err}`);
          return;
        }
        console.log(`CREATE TABLE SUCCESS!`);
      }
    );
    const handleData = async () => {
      const list = await page.evaluate(() => {
        let writeDataList = [];
        // 商品列表
        const itemList = document.querySelectorAll("#J_ItemList .product");
        for (const item of itemList) {
          // let writeData = [
          //     'picture',
          //     'link',
          //     'title',
          //     'price'
          // ];
          let writeData = [];
          // 图片地址
          const img = item.querySelector(".productImg>img");
          // 解决图片懒加载问题
          writeData.push(
            img.dataset && img.dataset.ksLazyload
              ? `https:${img.dataset.ksLazyload}`
              : img.src
          );
          // 商品链接
          const link = item.querySelector(".productTitle>a");
          writeData.push(link.href);

          // 商品标题
          const title = item.querySelector(".productTitle>a");
          writeData.push(title.innerText);

          // 商品价格
          const price = item.querySelector(".productPrice>em");
          writeData.push(parseFloat(price.title));

          writeDataList.push(writeData);
        }
        return writeDataList;
      });
      // 得到数据批量写入mysql
      const sql =
        "INSERT INTO PRODUCTS(`picture`,`link`,`title`, `price`) VALUES ?";
      await connection.query(sql, [list], (err, rows, fields) => {
        if (err) {
          console.log("INSERT ERROR - ", err.message);
          return;
        }
        console.log("INSERT SUCCESS!");
      });
    };
    for (let i = 1; i <= TOTAL_PAGE; i++) {
      const submit = await page.$(".ui-page-s-next");
      // 模拟点击事件跳转下一页
      await submit.click();
      // 等待页面2.5s加载完毕，Puppeteer默认的请求超时是30s,超时报错
      await page.waitFor(4000);
      // 清除当前的控制台信息
      // console.clear();
      // 打印当前的爬取进度
      console.log(formatProgress(i));
      console.log("页面数据加载完毕");

      await handleData();
      // 避免频繁获取，当成机器人弹出验证码
      await page.waitFor(4000);
    }
    console.log("服务正常结束");
  } catch (error) {
    // 打印错误消息
    console.log(error);
  } finally {
    connection.end(err => {
      if (err) {
        return;
      }
      console.log("[connection end] succeed!");
    });
    await browser.close();
    // 最后要退出进程
    process.exit(0);
  }
}
main();
