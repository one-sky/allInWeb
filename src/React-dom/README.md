# setState
  更新任务两个阶段：
  * Reconciliation Phase 找出Diff Fiber Tree 可以被打断
  * Commit Phase 提交的更新的渲染，不能被打断
  调用 React.updater.enqueueSetState，而React.updater是一个抽象方法，由React-dom.classComponentUpdater注入React.updater
    -> 关注 React-dom.classComponentUpdater.enqueueSetState
  
  ## Reconciliation Phase
  一个组件的更新可以对应多个Fiber (Tree)，Fiber.alternate.updateQueue记录ReactElement的state变化队列
  Fiber在update的时候，会从原来的Fiber（current）clone出一个新的Fiber（alternate）。两个Fiber diff出的变化（side effect）记录在alternate上。所以一个组件在更新时最多会有两个Fiber与其对应，在更新结束后alternate会取代之前的current的成为新的current节点。
  * enqueueSetState方法
    1. 计算 Fiber 的expirationTime
    2. 调用 createUpdate 创建一个update update.tag标记state更新类型
    3. 调用 enqueueUpdate 将update放入fiber的updateQueue中
    4. 调用 scheduleWork 开始任务调度
    
    * scheduleWork（实际为scheduleUpdateOnFiber） 方法
      1. 调用 checkForNestedUpdates 检查是否无限循环（最大允许50个update）
      2. 调用 markUpdateTimeFromFiberToRoot 找到RootFiber并遍历更新子节点的expirationTime
      3. 同步/异步操作
        * 同步
          1. 调用 schedulePendingInteractions ，再调用 scheduleInteractions 利用FiberRoot的pendingInteractionMap属性获取指定expirationTime的pendingInteractions 获取schedule所需的update任务的集合，记录未调度的同步数量，检测这些任务是否会出错。
          2. 调用 performSyncWorkOnRoot 
            1. 调用 prepareFreshStack FiberRoot放到workInProgress 
            2. 调用 workLoopSync 循环读取workInProgress 直到workInProgress为null
            3. 进行单项任务处理，并返回下一项：调用 performUnitOfWork -> beginWork$$1 -> -> beginWork$1 -> updateXXX/mountXXX
            * updateXXX/mountXXX
              1. 调用 updateClassInstance/resumeMountClassInstance -> applyDerivedStateFromProps 更新workInProgress updateClassInstance/resumeMountClassInstance返回 shouldUpdate
              2. 调用 finishClassComponent -> reconcileChildren/forceUnmountCurrentAndReconcile -> reconcileChildFibers/mountChildFibers -> reconcileChildrenXXX(dom比较 删除节点标记Deletion，不删除)  返回下一个任务
   
   ## Commit
    1. commitRoot
    2. commitRootImpl


# render
  * legacyRenderSubtreeIntoContainer
  * legacyCreateRootFromDOMContainer 清除dom容器元素的子元素,获得FierbRoot
  * updateContainer 创建更新container
  * updateContainerAtExpirationTime 到过期时间，就更新container，过期时间单位为 10ms
  * scheduleRootUpdate 更新Root
  * 调用setState的处理逻辑

# PureComponent 与Component
  在调用setState时，执行到beginWork$1 -> updateClassComponent
  1. updateClassComponent 首次渲染、工作恢复继续、更新
    * current$$1 !== null 执行 constructClassInstance、mountClassInstance、 shouldUpdate = true
    * current$$1 === null shouldUpdate = resumeMountClassInstance(...)
    * shouldUpdate = updateClassInstance(...)
  2. updateClassInstance/resumeMountClassInstance 方法中
    shouldUpdate = checkHasForceUpdateAfterProcessing() || checkShouldComponentUpdate(...);
