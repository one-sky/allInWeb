// 获取类似这样的y.b.p.8.p.h随机数
// Number.prototype.toString(radix),radix基数，2进制、10进制、16进制等 2<=redix<=36
// INIT 用于获取传入reducer的默认返回值
const randomString = () =>
  Math.random()
    .toString(36)
    .substring(7)
    .split("")
    .join(".");

const ActionTypes = {
  INIT: `@@redux/INIT${randomString()}`,
  REPLACE: `@@redux/REPLACE${randomString()}`,
  PROBE_UNKNOWN_ACTION: () => `@@redux/PROBE_UNKNOWN_ACTION${randomString()}`
};

export default ActionTypes;
