function get(key) {
  return key._reactInternalFiber;
}
function has(key) {
  return key._reactInternalFiber !== undefined;
}
function set(key, value) {
  key._reactInternalFiber = value;
}

function createUpdateQueue(baseState) {
  var queue = {
    baseState: baseState,
    firstUpdate: null,
    lastUpdate: null,
    firstCapturedUpdate: null,
    lastCapturedUpdate: null,
    firstEffect: null,
    lastEffect: null,
    firstCapturedEffect: null,
    lastCapturedEffect: null
  };
  return queue;
}

function cloneUpdateQueue(currentQueue) {
  var queue = {
    baseState: currentQueue.baseState,
    firstUpdate: currentQueue.firstUpdate,
    lastUpdate: currentQueue.lastUpdate,
    // TODO: With resuming, if we bail out and resuse the child tree, we should
    // keep these effects.
    firstCapturedUpdate: null,
    lastCapturedUpdate: null,
    firstEffect: null,
    lastEffect: null,
    firstCapturedEffect: null,
    lastCapturedEffect: null
  };
  return queue;
}

function createUpdate(expirationTime, suspenseConfig) {
  var update = {
    expirationTime: expirationTime,
    suspenseConfig: suspenseConfig,
    tag: UpdateState,
    payload: null,
    callback: null,
    next: null,
    nextEffect: null,
    priority: getCurrentPriorityLevel()
  };
  return update;
}

function appendUpdateToQueue(queue, update) {
  // Append the update to the end of the list.
  if (queue.lastUpdate === null) {
    // Queue is empty
    queue.firstUpdate = queue.lastUpdate = update;
  } else {
    // 放入队列尾部，lastUpdate指向update
    queue.lastUpdate.next = update;
    queue.lastUpdate = update;
  }
}

function enqueueUpdate(fiber, update) {
  // fiber.alternate.updateQueue 为放入待修改队列
  // fiber.updateQueue 原始队列，用于参照
  var alternate = fiber.alternate;
  var queue1;
  var queue2;

  // 初始化 queue1 queue2
  if (alternate === null) {
    // There's only one fiber.
    queue1 = fiber.updateQueue;
    queue2 = null;

    if (queue1 === null) {
      // 缓存的之前组件state对象, 便于恢复
      queue1 = fiber.updateQueue = createUpdateQueue(fiber.memoizedState);
    }
  } else {
    // There are two owners.
    queue1 = fiber.updateQueue;
    queue2 = alternate.updateQueue;

    if (queue1 === null) {
      if (queue2 === null) {
        // Neither fiber has an update queue. Create new ones.
        queue1 = fiber.updateQueue = createUpdateQueue(fiber.memoizedState);
        queue2 = alternate.updateQueue = createUpdateQueue(
          alternate.memoizedState
        );
      } else {
        // Only one fiber has an update queue. Clone to create a new one.
        queue1 = fiber.updateQueue = cloneUpdateQueue(queue2);
      }
    } else {
      if (queue2 === null) {
        // Only one fiber has an update queue. Clone to create a new one.
        queue2 = alternate.updateQueue = cloneUpdateQueue(queue1);
      } else {
        // Both owners have an update queue.
      }
    }
  }

  if (queue2 === null || queue1 === queue2) {
    // There's only a single queue.
    appendUpdateToQueue(queue1, update);
  } else {
    // queue2已经有修改，与queue1不是“同一”队列
    if (queue1.lastUpdate === null || queue2.lastUpdate === null) {
      appendUpdateToQueue(queue1, update);
      appendUpdateToQueue(queue2, update);
    } else {
      // Both queues are non-empty. The last update is the same in both lists,
      // because of structural sharing. So, only append to one of the lists.
      appendUpdateToQueue(queue1, update); // But we still need to update the `lastUpdate` pointer of queue2.

      queue2.lastUpdate = update;
    }
  }
  // if (
  //   fiber.tag === ClassComponent &&
  //   (currentlyProcessingQueue === queue1 ||
  //     (queue2 !== null && currentlyProcessingQueue === queue2)) &&
  //   !didWarnUpdateInsideUpdate
  // ) {
  //   warningWithoutStack$1(
  //     false,
  //     "An update (setState, replaceState, or forceUpdate) was scheduled " +
  //       "from inside an update function. Update functions should be pure, " +
  //       "with zero side-effects. Consider using componentDidUpdate or a " +
  //       "callback."
  //   );
  //   didWarnUpdateInsideUpdate = true;
  // }
}

const classComponentUpdater = {
  isMounted: isMounted,
  // payload:partialState
  enqueueSetState: function(inst, payload, callback) {
    var fiber = get(inst);
    // 获得优先级
    var currentTime = requestCurrentTime();
    var suspenseConfig = requestCurrentSuspenseConfig();
    var expirationTime = computeExpirationForFiber(
      currentTime,
      fiber,
      suspenseConfig
    );
    // 将一次setState作为一个update
    var update = createUpdate(expirationTime, suspenseConfig);
    update.payload = payload;

    if (callback !== undefined && callback !== null) {
      {
        warnOnInvalidCallback$1(callback, "setState");
      }

      update.callback = callback;
    }

    // 将组件的update放入fiber的updateQueue中
    enqueueUpdate(fiber, update);
    // 正式开始任务调度
    scheduleWork(fiber, expirationTime);
  },
  enqueueReplaceState: function(inst, payload, callback) {
    var fiber = get(inst);
    var currentTime = requestCurrentTime();
    var suspenseConfig = requestCurrentSuspenseConfig();
    var expirationTime = computeExpirationForFiber(
      currentTime,
      fiber,
      suspenseConfig
    );
    var update = createUpdate(expirationTime, suspenseConfig);
    update.tag = ReplaceState;
    update.payload = payload;

    if (callback !== undefined && callback !== null) {
      {
        warnOnInvalidCallback$1(callback, "replaceState");
      }

      update.callback = callback;
    }

    enqueueUpdate(fiber, update);
    scheduleWork(fiber, expirationTime);
  },
  enqueueForceUpdate: function(inst, callback) {
    var fiber = get(inst);
    var currentTime = requestCurrentTime();
    var suspenseConfig = requestCurrentSuspenseConfig();
    var expirationTime = computeExpirationForFiber(
      currentTime,
      fiber,
      suspenseConfig
    );
    var update = createUpdate(expirationTime, suspenseConfig);
    update.tag = ForceUpdate;

    if (callback !== undefined && callback !== null) {
      {
        warnOnInvalidCallback$1(callback, "forceUpdate");
      }

      update.callback = callback;
    }

    enqueueUpdate(fiber, update);
    scheduleWork(fiber, expirationTime);
  }
};
