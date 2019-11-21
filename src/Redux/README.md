# 仅拷贝 redux/src 文件夹

# redux 处理一个 state 管理的仓库，集中管理 state 的 store，因而注重 state 的一致性（因为可能有并发对 store 的同一 state 修改等） 状态修改均由纯函数完成

- isDispatching 锁住 dispatch，一次 dispatch 完成后允许下一个 dispatch
- isSubscribed 锁住 listener 的 unsubscribe，避免重复卸载 listener
- subscribe 与 unsubscribe 不能 dispatch 时候执行，确保 state 变化；subscribe 与 unsubscribe，在拷贝出的 nextListeners 中放入取出 listenr，防止 dispatch 在通知 listeners，出现混乱

* action state 修改的申请 一个简单对象，必须有 type 属性
* reducer(state=initialState, action) 对 store 中的 state 处理 返回处理的 state，redux 会将修改后的 state 赋给 Store 中的 currentState
* dispatch(action) action 为简单对象，触发 reducer，修改 currentState，并遍历 listeners，触发订阅者事件
* subscribe(function) 注册一个订阅者，传入接收消息处理方法， 允许多次注册订阅者
* unsubscribe，采用闭包形式，每个 subscribe(function) 返回 unsunscribe 方法，用于卸载该 listener

# index

- **DO_NOT_USE**ActionTypes 帮助开发者检查不允许使用 redux 自带的 action 的类型，以防出现错误
- createStore store 的创建、管理、订阅
- combineReducers 合并 reducer 返回一个函数代理所有符合 reducer 规则的 reducers 代理
- compose 多个函数连接起来
- applyMiddleware 对 store.dispatch 进行改造,增强功能，但不改变接口 所有中间件组成一个数组，依次执行,再执行 dispatch reducer
- bindActionCreators 对 action{key：function}类型返回 dispatch 的数组对象{key：dispatch}

## createStore

./src/createStore.js

```
<!-- reducer: function -->
<!-- preloadedState: function时实际是enhancer;enhancer:function | undefined
不允许真实的preloadedState为function -->
<!-- 不允许传入多个enhancer，需合并 -->

createStore(reducer, preloadedState, enhancer)

```

preloadedState 可能为 undefined，即 currentState 为 undefined，因而创建的时候触发 dispatch,init

```
// 将reducer中的state作为currentState，初始state
 dispatch({ type: ActionTypes.INIT });
```

调用 createStore 后返回常用：

- dispatch 锁住 isDispatching -> 触发 action -> 释放 isDispatching -> 通知订阅者（由于 subscribe 与 unscribe 是在拷贝出的 nextListeners 上操作，需要取到 nextListeners 赋值给 currentListeners
- subscribe 订阅事件，并返回 unsubscribe 事件，subscribe 与 unsubscribe 不能 dispatch 时候执行，确保 state 变化；subscribe 与 unsubscribe，在拷贝出的 nextListeners 中放入取出 listenr，防止 dispatch 在通知 listeners，出现混乱在 currentListeners 上浅拷贝出 nextListeners，放入 listener，防止 dispatch 在通知 listeners，出现混乱
- getState 在没有 dispatch 的时候获取 state，直接返回 currentState

## combineReducers

./src/combineReducers.js

```
// reducers: obejct
combineReducers(reducers);
```

1. 过滤掉 reducers 中属性非 function 的 reducer 存入 finalReducers 数组
2. 返回一个代理所有 reducer 的方法
3. 当 dispatch 触发，调用 reducer 时：一个 action 依次遍历传入 finalReducer，获取修改后的 state

## applyMiddleware

./src/applyMiddleware.js

```
let middlewares = [loggerMiddleware, thunkMiddleware, ...others];
let store = applyMiddleware(middlewares)(createStore)(reducer, initialState);
```

1. 传入 middlewares ，返回一个 enhancer
2. 传入 createStore，创建 store
3. 定义中间件 api，允许通过中间件访问 store 的 getState 和 dispatch
4. 改造 middlewares，存入 chain
5. 对 chain 进行 compose 整合，传入 store.dispatch，返回一个 新的 dispatch 覆盖 store.dispatch
6. 此时，创建的 store 的 dispatch 已更新
