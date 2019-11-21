import compose from "./compose";

/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store. This is handy for a variety of tasks, such as expressing
 * asynchronous actions in a concise manner, or logging every action payload.
 *
 * See `redux-thunk` package as an example of the Redux middleware.
 *
 * Because middleware is potentially asynchronous, this should be the first
 * store enhancer in the composition chain.
 *
 * Note that each middleware will be given the `dispatch` and `getState` functions
 * as named arguments.
 *
 * @param {...Function} middlewares The middleware chain to be applied.
 * @returns {Function} A store enhancer applying the middleware.
 */
export default function applyMiddleware(...middlewares) {
  // 返回一个enhancer
  return createStore => (...args) => {
    // 创建一个store
    const store = createStore(...args);
    let dispatch = () => {
      throw new Error(
        "Dispatching while constructing your middleware is not allowed. " +
          "Other middleware would not be applied to this dispatch."
      );
    };

    // 定义中间件api，通过中间件访问store的getState和dispatch
    const middlewareAPI = {
      getState: store.getState,
      dispatch: (...args) => dispatch(...args)
    };
    // 中间件传入 getState、dispatch
    // 如thunkMiddleware
    // function createThunkMiddleware(extraArgument) {
    //   return ({ dispatch, getState }) => next => action => {
    //     if (typeof action === 'function') {
    //       return action(dispatch, getState, extraArgument);
    //     }
    //     return next(action);
    //   };
    // }
    // const thunk = createThunkMiddleware();
    // thunk.withExtraArgument = createThunkMiddleware;
    // export default thunk;

    // 返回的是
    // return next => action => {
    //     if (typeof action === 'function') {
    //       return action(dispatch, getState, extraArgument);
    //     }
    //     return next(action);
    //   };

    const chain = middlewares.map(middleware => middleware(middlewareAPI));
    // compose合并新中间件数组 并传入dispatch
    dispatch = compose(...chain)(store.dispatch);

    return {
      ...store,
      dispatch
    };
  };
}
