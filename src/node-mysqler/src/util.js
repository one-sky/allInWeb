const addQuotaByType = value => typeof value === 'number' ? value : `'${value}'`;

const formatKey = (fields = "") => {
  fields = fields.replace(/[A-Z]/g, x => {
    return `_${x.toLowerCase()}`;
  });
  return fields;
};

const formatKeyToObject = (fields = "") => {
  fields = fields.replace(/_[a-z]/g, x => {
    return `${x.slice(1).toUpperCase()}`;
  });
  return fields;
};

const concatCondition = (condition = {}, keyMatch) => {
  let _WHERE = [];
  for (let key in condition) {
    const val = condition[key];
    //处理驼峰式key与数据库 ‘_’分隔 字段名匹配
    key = !keyMatch && formatKey(key);
    switch (
      Object.prototype.toString
        .call(val)
        .split(" ")[1]
        .slice(0, -1)
        .toLowerCase()
    ) {
      case "array": // in enum[]
        _WHERE.push(`${key} in ('${val.join("','")}')`);
        break;
      case "object": // 区间 或者 not in enum 或者 <>单值
        let tmp = `${key} ${val.lowOption} ${addQuotaByType(val.low)}`;
        tmp += !!val.highOption ? `${val.highOption} ${addQuotaByType(val.high)}` : '';
        _WHERE.push(tmp);
        break;
      default:
        _WHERE.push(`${key} = ${val}`);
    }
  }
  return _WHERE.join(" and ");
};

module.exports = {
  addQuotaByType,
  formatKey,
  formatKeyToObject,
  concatCondition
};
