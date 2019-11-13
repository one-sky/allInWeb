const formatKey = (fields = '') => {
    fields = fields.replace(/[A-Z]/g, x => {
        return `_${x.toLowerCase()}`;
    });
    return fields;
}

const concatCondition = (condition = {}, keyMatch) => {
    let _WHERE = [];
    for (let key in condition) {
        const val = condition[key];
        //处理驼峰式key与数据库 ‘_’分隔 字段名匹配
        key = !keyMatch && formatKey(key);
        switch (Object.prototype.toString.call(val).split(" ")[1].slice(0,-1).toLowerCase()){
            case 'array': // in enum[]
                _WHERE.push(`${key} in [${val.join(',')}]`);
                return;
            case 'object': // 区间 或者 not in enum 或者 <>单值
                let tmp = `${key} ${val.lowOption} ${val.low}`;
                tmp += val.highOption ? `${val.highOption} ${high}` : '';
                _WHERE.push(tmp);
                return;
            default:
                _WHERE.push(`${key} = ${val}`);
                return;
        }
    }
    return _WHERE.join(' and ');
}

module.exports = {
    formatKey,
    concatCondition
} 