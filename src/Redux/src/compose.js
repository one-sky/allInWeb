/**
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for
 * the resulting composite function.
 *
 * @param {...Function} funcs
 * @returns {Function}  A function obtained by composing the argument functions
 * from right to left. For example, compose(f, g, h) is identical to doing
 * (...args) => f(g(h(...args))).
 */

// 从右到左执行整合函数的链式
// const a = fn1(fn2(fn3(fn4(x)))) -> const a = compose(fn1,fn2,fn3,fn4)(x)
export default function compose(...funcs) {
  // 传什么就返回什么
  if (funcs.length === 0) {
    return arg => arg;
  }

  if (funcs.length === 1) {
    return funcs[0];
  }
  // 当前元素执行完返回的值传入total，依次计算得到最后的function，从右到左执行
  return funcs.reduce((a, b) => (...args) => a(b(...args)));
}
