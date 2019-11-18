var tracing = require("scheduler/tracing");
var NESTED_UPDATE_LIMIT = 50;
var nestedUpdateCount = 0;
var rootWithNestedUpdates = null;
var NESTED_PASSIVE_UPDATE_LIMIT = 50;
var nestedPassiveUpdateCount = 0;
var NoContext = 0;
var BatchedContext = 1;
var EventContext = 2;
var DiscreteEventContext = 4;
var LegacyUnbatchedContext = 8;
var RenderContext = 16;
var CommitContext = 32;
var RootIncomplete = 0;
var RootFatalErrored = 1;
var RootErrored = 2;
var RootSuspended = 3;
var RootSuspendedWithDelay = 4;
var RootCompleted = 5;
var RootLocked = 6;

var ImmediatePriority = 99;
var UserBlockingPriority$2 = 98;
var NormalPriority = 97;
var LowPriority = 96;
var IdlePriority = 95; // NoPriority is the absence of priority. Also React-only.
var NoPriority = 90;

var FunctionComponent = 0;
var ClassComponent = 1;
var IndeterminateComponent = 2; // Before we know whether it is function or class
var HostRoot = 3; // 树的顶端节点root
var HostPortal = 4; // A subtree. Could be an entry point to a different renderer.
var HostComponent = 5;
var HostText = 6;
var Fragment = 7;
var Mode = 8;
var ContextConsumer = 9;
var ContextProvider = 10;
var ForwardRef = 11;
var Profiler = 12;
var SuspenseComponent = 13;
var MemoComponent = 14;
var SimpleMemoComponent = 15;
var LazyComponent = 16;
var IncompleteClassComponent = 17;
var DehydratedFragment = 18;
var SuspenseListComponent = 19;
var FundamentalComponent = 20;
var ScopeComponent = 21;

var workInProgressRoot = null;
var enableUserTimingAPI = true;
var enableSchedulerTracing = true;
var renderExpirationTime = NoWork;

var replayFailedUnitOfWorkWithInvokeGuardedCallback = true;

function checkForNestedUpdates() {
  if (nestedUpdateCount > NESTED_UPDATE_LIMIT) {
    nestedUpdateCount = 0;
    rootWithNestedUpdates = null;

    (function() {
      {
        {
          throw ReactError(
            Error(
              "Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops."
            )
          );
        }
      }
    })();
  }
  if (nestedPassiveUpdateCount > NESTED_PASSIVE_UPDATE_LIMIT) {
    nestedPassiveUpdateCount = 0;
    warning$1(
      false,
      "Maximum update depth exceeded. This can happen when a component " +
        "calls setState inside useEffect, but useEffect either doesn't " +
        "have a dependency array, or one of the dependencies changes on " +
        "every render."
    );
  }
}

function stopFinishedWorkLoopTimer() {
  var didCompleteRoot = true;
  stopWorkLoopTimer(interruptedBy, didCompleteRoot);
  interruptedBy = null;
}

function stopInterruptedWorkLoopTimer() {
  // TODO: Track which fiber caused the interruption.
  var didCompleteRoot = false;
  stopWorkLoopTimer(interruptedBy, didCompleteRoot);
  interruptedBy = null;
}
var interruptedBy = null;
function checkForInterruption(fiberThatReceivedUpdate, updateExpirationTime) {
  // 任务正在执行 && 异步任务已经执行 && 需要执行优先级更高的任务
  if (
    enableUserTimingAPI &&
    workInProgressRoot !== null &&
    updateExpirationTime > renderExpirationTime
  ) {
    // 新的update打断当前任务
    interruptedBy = fiberThatReceivedUpdate;
  }
}
// 利用FiberRoot的pendingInteractionMap属性获取指定expirationTime的pendingInteractions
// 获取schedule所需的update任务的集合，记录未调度的同步数量，检测这些任务是否会出错。
function scheduleInteractions(root, expirationTime, interactions) {
  if (!enableSchedulerTracing) {
    return;
  }

  if (interactions.size > 0) {
    // 获取FiberRoot的pendingInteractionMap属性
    var pendingInteractionMap = root.pendingInteractionMap;
    var pendingInteractions = pendingInteractionMap.get(expirationTime);

    if (pendingInteractions != null) {
      // 遍历并更新还未调度的同步任务的数量
      interactions.forEach(function(interaction) {
        if (!pendingInteractions.has(interaction)) {
          // Update the pending async work count for previously unscheduled interaction.
          interaction.__count++;
        }

        pendingInteractions.add(interaction);
      });
    } else {
      pendingInteractionMap.set(expirationTime, new Set(interactions)); // Update the pending async work count for the current interactions.

      interactions.forEach(function(interaction) {
        interaction.__count++;
      });
    }
    // 计算并得出线程的id
    var subscriber = tracing.__subscriberRef.current;

    if (subscriber !== null) {
      var threadID = computeThreadID(root, expirationTime);
      // 检测这些任务是否会报错
      subscriber.onWorkScheduled(interactions, threadID);
    }
  }
}

//跟踪update，并计数、检测是否会报错
function schedulePendingInteractions(root, expirationTime) {
  if (!enableSchedulerTracing) {
    return;
  }
  scheduleInteractions(root, expirationTime, tracing.__interactionsRef.current);
}

// 更新fiber的expirationTime
function markUpdateTimeFromFiberToRoot(fiber, expirationTime) {
  // 当前fiber的优先级是小于expirationTime的优先级的，现在要调高fiber的优先级
  if (fiber.expirationTime < expirationTime) {
    fiber.expirationTime = expirationTime;
  }

  var alternate = fiber.alternate;

  if (alternate !== null && alternate.expirationTime < expirationTime) {
    alternate.expirationTime = expirationTime;
  }
  // fiber的父节点
  var node = fiber.return;
  var root = null;

  // 最大父节点 or HostRoot即树的顶端节点root
  if (node === null && fiber.tag === HostRoot) {
    root = fiber.stateNode;
  } else {
    // 向上遍历父节点
    while (node !== null) {
      alternate = node.alternate;

      if (node.childExpirationTime < expirationTime) {
        node.childExpirationTime = expirationTime;

        if (
          alternate !== null &&
          alternate.childExpirationTime < expirationTime
        ) {
          alternate.childExpirationTime = expirationTime;
        }
      } else if (
        alternate !== null &&
        alternate.childExpirationTime < expirationTime
      ) {
        alternate.childExpirationTime = expirationTime;
      }
      // 如果找到顶端rootFiber，结束循环
      if (node.return === null && node.tag === HostRoot) {
        root = node.stateNode;
        break;
      }

      node = node.return;
    }
  }
  // 更新该rootFiber的最旧、最新的挂起时间
  if (root !== null) {
    if (workInProgressRoot === root) {
      // Received an update to a tree that's in the middle of rendering. Mark
      // that's unprocessed work on this root.
      markUnprocessedUpdateTime(expirationTime);

      if (workInProgressRootExitStatus === RootSuspendedWithDelay) {
        markRootSuspendedAtTime(root, renderExpirationTime);
      }
    } // Mark that the root has a pending update.

    markRootUpdatedAtTime(root, expirationTime);
  }

  return root;
}

function completeUnitOfWork(unitOfWork) {
  // Attempt to complete the current unit of work, then move to the next
  // sibling. If there are no more siblings, return to the parent fiber.
  workInProgress = unitOfWork;

  do {
    // The current, flushed, state of this fiber is the alternate. Ideally
    // nothing should rely on this, but relying on it here means that we don't
    // need an additional field on the work in progress.
    var current$$1 = workInProgress.alternate;
    var returnFiber = workInProgress.return; // Check if the work completed or if something threw.

    if ((workInProgress.effectTag & Incomplete) === NoEffect) {
      setCurrentFiber(workInProgress);
      var next = void 0;

      if (
        !enableProfilerTimer ||
        (workInProgress.mode & ProfileMode) === NoMode
      ) {
        next = completeWork(current$$1, workInProgress, renderExpirationTime);
      } else {
        startProfilerTimer(workInProgress);
        next = completeWork(current$$1, workInProgress, renderExpirationTime); // Update render duration assuming we didn't error.

        stopProfilerTimerIfRunningAndRecordDelta(workInProgress, false);
      }

      stopWorkTimer(workInProgress);
      resetCurrentFiber();
      resetChildExpirationTime(workInProgress);

      if (next !== null) {
        // Completing this fiber spawned new work. Work on that next.
        return next;
      }

      if (
        returnFiber !== null && // Do not append effects to parents if a sibling failed to complete
        (returnFiber.effectTag & Incomplete) === NoEffect
      ) {
        // Append all the effects of the subtree and this fiber onto the effect
        // list of the parent. The completion order of the children affects the
        // side-effect order.
        if (returnFiber.firstEffect === null) {
          returnFiber.firstEffect = workInProgress.firstEffect;
        }

        if (workInProgress.lastEffect !== null) {
          if (returnFiber.lastEffect !== null) {
            returnFiber.lastEffect.nextEffect = workInProgress.firstEffect;
          }

          returnFiber.lastEffect = workInProgress.lastEffect;
        } // If this fiber had side-effects, we append it AFTER the children's
        // side-effects. We can perform certain side-effects earlier if needed,
        // by doing multiple passes over the effect list. We don't want to
        // schedule our own side-effect on our own list because if end up
        // reusing children we'll schedule this effect onto itself since we're
        // at the end.

        var effectTag = workInProgress.effectTag; // Skip both NoWork and PerformedWork tags when creating the effect
        // list. PerformedWork effect is read by React DevTools but shouldn't be
        // committed.

        if (effectTag > PerformedWork) {
          if (returnFiber.lastEffect !== null) {
            returnFiber.lastEffect.nextEffect = workInProgress;
          } else {
            returnFiber.firstEffect = workInProgress;
          }

          returnFiber.lastEffect = workInProgress;
        }
      }
    } else {
      // This fiber did not complete because something threw. Pop values off
      // the stack without entering the complete phase. If this is a boundary,
      // capture values if possible.
      var _next = unwindWork(workInProgress, renderExpirationTime); // Because this fiber did not complete, don't reset its expiration time.

      if (
        enableProfilerTimer &&
        (workInProgress.mode & ProfileMode) !== NoMode
      ) {
        // Record the render duration for the fiber that errored.
        stopProfilerTimerIfRunningAndRecordDelta(workInProgress, false); // Include the time spent working on failed children before continuing.

        var actualDuration = workInProgress.actualDuration;
        var child = workInProgress.child;

        while (child !== null) {
          actualDuration += child.actualDuration;
          child = child.sibling;
        }

        workInProgress.actualDuration = actualDuration;
      }

      if (_next !== null) {
        // If completing this work spawned new work, do that next. We'll come
        // back here again.
        // Since we're restarting, remove anything that is not a host effect
        // from the effect tag.
        // TODO: The name stopFailedWorkTimer is misleading because Suspense
        // also captures and restarts.
        stopFailedWorkTimer(workInProgress);
        _next.effectTag &= HostEffectMask;
        return _next;
      }

      stopWorkTimer(workInProgress);

      if (returnFiber !== null) {
        // Mark the parent fiber as incomplete and clear its effect list.
        returnFiber.firstEffect = returnFiber.lastEffect = null;
        returnFiber.effectTag |= Incomplete;
      }
    }

    var siblingFiber = workInProgress.sibling;

    if (siblingFiber !== null) {
      // If there is more work to do in this returnFiber, do that next.
      return siblingFiber;
    } // Otherwise, return to the parent

    workInProgress = returnFiber;
  } while (workInProgress !== null); // We've reached the root.

  if (workInProgressRootExitStatus === RootIncomplete) {
    workInProgressRootExitStatus = RootCompleted;
  }

  return null;
}

var beginWork$$1;

if (true && replayFailedUnitOfWorkWithInvokeGuardedCallback) {
  var dummyFiber = null;

  beginWork$$1 = function(current$$1, unitOfWork, expirationTime) {
    // If a component throws an error, we replay it again in a synchronously
    // dispatched event, so that the debugger will treat it as an uncaught
    // error See ReactErrorUtils for more information.
    // Before entering the begin phase, copy the work-in-progress onto a dummy
    // fiber. If beginWork throws, we'll use this to reset the state.
    var originalWorkInProgressCopy = assignFiberPropertiesInDEV(
      dummyFiber,
      unitOfWork
    );

    try {
      return beginWork$1(current$$1, unitOfWork, expirationTime);
    } catch (originalError) {
      if (
        originalError !== null &&
        typeof originalError === "object" &&
        typeof originalError.then === "function"
      ) {
        // Don't replay promises. Treat everything else like an error.
        throw originalError;
      } // Keep this code in sync with renderRoot; any changes here must have
      // corresponding changes there.

      resetContextDependencies();
      resetHooks(); // Unwind the failed stack frame

      unwindInterruptedWork(unitOfWork); // Restore the original properties of the fiber.

      assignFiberPropertiesInDEV(unitOfWork, originalWorkInProgressCopy);

      if (enableProfilerTimer && unitOfWork.mode & ProfileMode) {
        // Reset the profiler timer.
        startProfilerTimer(unitOfWork);
      } // Run beginWork again.

      invokeGuardedCallback(
        null,
        beginWork$1,
        null,
        current$$1,
        unitOfWork,
        expirationTime
      );

      if (hasCaughtError()) {
        var replayError = clearCaughtError(); // `invokeGuardedCallback` sometimes sets an expando `_suppressLogging`.
        // Rethrow this error instead of the original one.

        throw replayError;
      } else {
        // This branch is reachable if the render phase is impure.
        throw originalError;
      }
    }
  };
} else {
  beginWork$$1 = beginWork$1;
}

function performUnitOfWork(unitOfWork) {
  var current$$1 = unitOfWork.alternate;
  startWorkTimer(unitOfWork);
  setCurrentFiber(unitOfWork);
  var next;

  if (enableProfilerTimer && (unitOfWork.mode & ProfileMode) !== NoMode) {
    startProfilerTimer(unitOfWork);
    next = beginWork$$1(current$$1, unitOfWork, renderExpirationTime);
    stopProfilerTimerIfRunningAndRecordDelta(unitOfWork, true);
  } else {
    // 遍历所有子级fiber，完成单元任务的处理，之后继续处理下一个任务
    next = beginWork$$1(current$$1, unitOfWork, renderExpirationTime);
  }

  resetCurrentFiber();
  // 执行中props放入上一次props
  unitOfWork.memoizedProps = unitOfWork.pendingProps;

  if (next === null) {
    // If this doesn't spawn new work, complete the current work.
    next = completeUnitOfWork(unitOfWork);
  }

  ReactCurrentOwner$2.current = null;
  return next;
}

// 循环执行workInProgress，返回next workInProgress, 直到workInProgress为null
function workLoopSync() {
  while (workInProgress !== null) {
    workInProgress = performUnitOfWork(workInProgress);
  }
}

function performSyncWorkOnRoot(root) {
  // Check if there's expired work on this root. Otherwise, render at Sync.
  var lastExpiredTime = root.lastExpiredTime;
  var expirationTime = lastExpiredTime !== NoWork ? lastExpiredTime : Sync;

  if (root.finishedExpirationTime === expirationTime) {
    // There's already a pending commit at this expiration time.
    // TODO: This is poorly factored. This case only exists for the
    // batch.commit() API.
    commitRoot(root);
  } else {
    (function() {
      if (
        !((executionContext & (RenderContext | CommitContext)) === NoContext)
      ) {
        {
          throw ReactError(Error("Should not already be working."));
        }
      }
    })();

    flushPassiveEffects(); // If the root or expiration time have changed, throw out the existing stack
    // and prepare a fresh one. Otherwise we'll continue where we left off.

    if (
      root !== workInProgressRoot ||
      expirationTime !== renderExpirationTime
    ) {
      prepareFreshStack(root, expirationTime);
      startWorkOnPendingInteractions(root, expirationTime);
    }

    // workInProgress 值不为 null 意味着该 fiber 对象上仍然有更新要执行
    if (workInProgress !== null) {
      var prevExecutionContext = executionContext;
      executionContext |= RenderContext;
      var prevDispatcher = pushDispatcher(root);
      var prevInteractions = pushInteractions(root);
      startWorkLoopTimer(workInProgress);

      do {
        try {
          workLoopSync();
          break;
        } catch (thrownValue) {
          handleError(root, thrownValue);
        }
      } while (true);

      resetContextDependencies();
      executionContext = prevExecutionContext;
      popDispatcher(prevDispatcher);

      if (enableSchedulerTracing) {
        popInteractions(prevInteractions);
      }

      if (workInProgressRootExitStatus === RootFatalErrored) {
        var fatalError = workInProgressRootFatalError;
        stopInterruptedWorkLoopTimer();
        prepareFreshStack(root, expirationTime);
        markRootSuspendedAtTime(root, expirationTime);
        ensureRootIsScheduled(root);
        throw fatalError;
      }

      if (workInProgress !== null) {
        // This is a sync render, so we should have finished the whole tree.
        (function() {
          {
            {
              throw ReactError(
                Error(
                  "Cannot commit an incomplete root. This error is likely caused by a bug in React. Please file an issue."
                )
              );
            }
          }
        })();
      } else {
        // We now have a consistent tree. Because this is a sync render, we
        // will commit it even if something suspended. The only exception is
        // if the root is locked (using the unstable_createBatch API).
        stopFinishedWorkLoopTimer();
        root.finishedWork = root.current.alternate;
        root.finishedExpirationTime = expirationTime;
        resolveLocksOnRoot(root, expirationTime);
        finishSyncRender(root, workInProgressRootExitStatus, expirationTime);
      } // Before exiting, make sure there's a callback scheduled for the next
      // pending level.

      ensureRootIsScheduled(root);
    }
  }

  return null;
}

function scheduleUpdateOnFiber(fiber, expirationTime) {
  // 判断是否是无限循环update 最大50个
  checkForNestedUpdates();
  // warnAboutInvalidUpdatesOnClassComponentsInDEV(fiber);
  // 找到rootFiber并遍历更新子节点的expirationTime
  var root = markUpdateTimeFromFiberToRoot(fiber, expirationTime);

  if (root === null) {
    warnAboutUpdateOnUnmountedFiberInDEV(fiber);
    return;
  }
  // 判断是否有高优先级任务打断当前正在执行的任务
  checkForInterruption(fiber, expirationTime);
  // 报告调度更新，测试环境用的，可不看
  //recordScheduleUpdate(); // TODO: computeExpirationForFiber also reads the priority. Pass the
  // priority as an argument to that function and this one.

  var priorityLevel = getCurrentPriorityLevel();

  // 同步
  if (expirationTime === Sync) {
    // 第一次渲染前
    if (
      // Check if we're inside unbatchedUpdates
      (executionContext & LegacyUnbatchedContext) !== NoContext && // Check if we're not already rendering
      (executionContext & (RenderContext | CommitContext)) === NoContext
    ) {
      // 跟踪同步执行update，并计数、检测它们是否会报错
      schedulePendingInteractions(root, expirationTime);

      // 执行
      performSyncWorkOnRoot(root);
    } else {
      // render后
      ensureRootIsScheduled(root);
      // 跟踪update，并计数、检测是否会报错
      schedulePendingInteractions(root, expirationTime);
      // 当前没有update时
      if (executionContext === NoContext) {
        // 刷新同步任务队列
        flushSyncCallbackQueue();
      }
    }
  } else {
    ensureRootIsScheduled(root);
    // 跟踪update，并计数、检测是否会报错
    schedulePendingInteractions(root, expirationTime);
  }

  if (
    (executionContext & DiscreteEventContext) !== NoContext && // Only updates at user-blocking priority or greater are considered
    // 只有在用户阻止优先级或更高优先级的更新才被视为离散，即使在离散事件中也是如此
    (priorityLevel === UserBlockingPriority$2 ||
      priorityLevel === ImmediatePriority)
  ) {
    // This is the result of a discrete event. Track the lowest priority
    // discrete update per root so we can flush them early, if needed.
    // 跟踪每个根的最低优先级离散更新
    if (rootsWithPendingDiscreteUpdates === null) {
      rootsWithPendingDiscreteUpdates = new Map([[root, expirationTime]]);
    } else {
      // 获取最新的DiscreteTime
      var lastDiscreteTime = rootsWithPendingDiscreteUpdates.get(root);
      // 更新DiscreteTime
      if (lastDiscreteTime === undefined || lastDiscreteTime > expirationTime) {
        rootsWithPendingDiscreteUpdates.set(root, expirationTime);
      }
    }
  }
}

module.exports = {
  scheduleWork: scheduleUpdateOnFiber
};
