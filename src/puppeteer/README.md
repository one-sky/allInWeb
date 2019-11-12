# 基于Puppeteer + mysql 的天猫爬虫

## 项目说明
  项目运行需本地配置好mysql，可爬取出指定页数的天猫商品图片、名称、链接、价格

## 处理逻辑
  1. 数据库连接
  2. db不存在时 create TestDB
  3. table不存在时 create products
  4. 处理每一页数据
  5. 模拟触发点击下一页
  6. 信息存入数据库

## 本地环境搭建
```bash
  # 拉取项目
  git clone
  # 安装依赖puppeteer
  npm i puppeteer
  # 安装依赖mysql
  npm i mysql
  # 切换到该目录下运行
  node index 
```
  
## 可修改参数
  * TOTAL_PAGE 爬虫页数
  * URL 爬虫路由
  * DB 数据库连接信息

## 存入数据
  products(id, picture,link,title,price)
  
## Tips
  * 解决图片懒加载获取到的真实img url
  * 采用一页数据批量存入mysql
  * 避免频繁获取，当成机器人弹出验证码，采用延时2.5s
