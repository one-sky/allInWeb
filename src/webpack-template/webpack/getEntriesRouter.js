const fs = require("fs");
const path = require("path");

// 判断是否main 公共入口
const isNeedPack = (() => {
  const needPackDir = ["main"];
  return P => needPackDir.some(item => P.includes(item));
})();

module.exports = function getEntriesRouter(
  { baseUrl, srcPath, distPath },
  ignoreNeedPack
) {
  const entries = {};
  let routers = [];
  const ROOT_PATH_LEN = path.resolve(baseUrl, srcPath).length + 1;

  function handleDir(dir) {
    // 同步判断是否目录
    if (fs.statSync(dir).isDirectory()) {
      const dirNames = fs.readdirSync(dir).map(item => path.resolve(dir, item));
      dirNames.forEach(item => {
        const STAT = fs.statSync(item);
        // windows 路径\  linux /
        // 定位到View.js 作为每个chunk的入口文件
        if (STAT.isFile() && /\/View.js$/.test(item)) {
          //   if (!ignoreNeedPack && !isNeedPack(item)) {
          //     return;
          //   }
          // windows 路径\  linux /
          const entryKey = item
            .slice(ROOT_PATH_LEN)
            .split("/")
            .slice(0, -1)
            .join("/");
          entries[entryKey] = item;
          const FILE_CONTENT = fs.readFileSync(item, "utf8");
          FILE_CONTENT.replace(
            /YOOGA.allPage\[['"](.+)['"]\]/g,
            (matchStr, $0) => {
              routers[$0] = `${path.resolve(baseUrl,distPath)}/${entryKey}.js`.replace(
                /\/+/g,
                "/"
              );
            }
          );
        } else if (STAT.isDirectory()) {
          handleDir(item);
        }
      });
    }
  }

  handleDir(srcPath);

  // 手动添加对main的支持
  routers = {
    main: `/${distPath}/main.js`.replace(/\/+/g, "/"),
    ...routers
  };
  return {
    entries,
    routers
  };
};
