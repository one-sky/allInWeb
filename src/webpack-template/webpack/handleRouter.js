const fs = require("fs");
const getEntriesRouter = require("./getEntriesRouter");

// 处理打包结果，生成router.json
function handleRouter(compilation, config, extraChunks = {}) {
  const { routers } = getEntriesRouter(config, true);
  const assets = Object.keys(compilation.assets);
  const newRouter = {};

  Object.keys(routers).forEach(key => {
    const itemPath = routers[key];
    assets.forEach(item => {
      const newPath = `/${config.distPath}/${item}`.replace(/\/+/g, "/");
      const itemKey = item.replace(/\.[^.]+\.js$/, "");
      // 无用的 icon chunk
      if (itemKey.startsWith("icon")) {
        return;
      }
      // page的chunckName都是以views开头的，因此非views开头的为main/vendor或者dynamic import的chunkName
      // 并且排除 manifest 文件
      if (!itemKey.startsWith("views")) {
        newRouter[itemKey] = { path: `/webpack-template${newPath}` };
      }
      if (
        item.endsWith(".js") &&
        itemPath.split(".")[0] === newPath.split(".")[0]
      ) {
        newRouter[key] = {
          path: `/webpack-template${newPath}`
        };
      }
    });
  });

  Object.keys(extraChunks).forEach(key => {
    const item = extraChunks[key];
    const newPath = `/webpack-template${config.distPath}/${item}`.replace(
      /\/+/g,
      "/"
    );
    newRouter[key] = {
      path: newPath
    };
  });

  // 生成js文件
  fs.writeFileSync(
    "router.js.log",
    `
        (function(){
            router = ${JSON.stringify(newRouter, null, 4)};
        })();
    `
  );
}

module.exports = handleRouter;
