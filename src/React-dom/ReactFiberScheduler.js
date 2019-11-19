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
var workInProgress = null;
var renderExpirationTime = NoWork;
var workInProgressRootExitStatus = RootIncomplete;

var workInProgressRootFatalError = null;
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

function markUnprocessedUpdateTime(expirationTime) {
  if (expirationTime > workInProgressRootNextUnprocessedUpdateTime) {
    workInProgressRootNextUnprocessedUpdateTime = expirationTime;
  }
}

function markRootSuspendedAtTime(root, expirationTime) {
  var firstSuspendedTime = root.firstSuspendedTime;
  var lastSuspendedTime = root.lastSuspendedTime;

  if (firstSuspendedTime < expirationTime) {
    root.firstSuspendedTime = expirationTime;
  }

  if (lastSuspendedTime > expirationTime || firstSuspendedTime === NoWork) {
    root.lastSuspendedTime = expirationTime;
  }

  if (expirationTime <= root.lastPingedTime) {
    root.lastPingedTime = NoWork;
  }

  if (expirationTime <= root.lastExpiredTime) {
    root.lastExpiredTime = NoWork;
  }
}

function markRootUpdatedAtTime(root, expirationTime) {
  // Update the range of pending times
  var firstPendingTime = root.firstPendingTime;

  if (expirationTime > firstPendingTime) {
    root.firstPendingTime = expirationTime;
  } // Update the range of suspended times. Treat everything lower priority or
  // equal to this update as unsuspended.

  var firstSuspendedTime = root.firstSuspendedTime;

  if (firstSuspendedTime !== NoWork) {
    if (expirationTime >= firstSuspendedTime) {
      // The entire suspended range is now unsuspended.
      root.firstSuspendedTime = root.lastSuspendedTime = root.nextKnownPendingLevel = NoWork;
    } else if (expirationTime >= root.lastSuspendedTime) {
      root.lastSuspendedTime = expirationTime + 1;
    } // This is a pending level. Check if it's higher priority than the next
    // known pending level.

    if (expirationTime > root.nextKnownPendingLevel) {
      root.nextKnownPendingLevel = expirationTime;
    }
  }
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
      // 如果找到顶端FiberRoot，结束循环
      if (node.return === null && node.tag === HostRoot) {
        root = node.stateNode;
        break;
      }

      node = node.return;
    }
  }
  // 更新该FiberRoot的最旧、最新的挂起时间
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

function beginWork$1(current$$1, workInProgress, renderExpirationTime) {
  var updateExpirationTime = workInProgress.expirationTime;

  if (current$$1 !== null) {
    var oldProps = current$$1.memoizedProps;
    var newProps = workInProgress.pendingProps;

    if (
      oldProps !== newProps ||
      hasContextChanged() || // Force a re-render if the implementation changed due to hot reload:
      workInProgress.type !== current$$1.type
    ) {
      // If props or context changed, mark the fiber as having performed work.
      // This may be unset if the props are determined to be equal later (memo).
      didReceiveUpdate = true;
    } else if (updateExpirationTime < renderExpirationTime) {
      didReceiveUpdate = false; // This fiber does not have any pending work. Bailout without entering
      // the begin phase. There's still some bookkeeping we that needs to be done
      // in this optimized path, mostly pushing stuff onto the stack.

      switch (workInProgress.tag) {
        case HostRoot:
          pushHostRootContext(workInProgress);
          resetHydrationState();
          break;

        case HostComponent:
          pushHostContext(workInProgress);

          if (
            workInProgress.mode & ConcurrentMode &&
            renderExpirationTime !== Never &&
            shouldDeprioritizeSubtree(workInProgress.type, newProps)
          ) {
            if (enableSchedulerTracing) {
              markSpawnedWork(Never);
            } // Schedule this fiber to re-render at offscreen priority. Then bailout.

            workInProgress.expirationTime = workInProgress.childExpirationTime = Never;
            return null;
          }

          break;

        case ClassComponent: {
          var Component = workInProgress.type;

          if (isContextProvider(Component)) {
            pushContextProvider(workInProgress);
          }

          break;
        }

        case HostPortal:
          pushHostContainer(
            workInProgress,
            workInProgress.stateNode.containerInfo
          );
          break;

        case ContextProvider: {
          var newValue = workInProgress.memoizedProps.value;
          pushProvider(workInProgress, newValue);
          break;
        }

        case Profiler:
          if (enableProfilerTimer) {
            workInProgress.effectTag |= Update;
          }

          break;

        case SuspenseComponent: {
          var state = workInProgress.memoizedState;

          if (state !== null) {
            if (enableSuspenseServerRenderer) {
              if (state.dehydrated !== null) {
                pushSuspenseContext(
                  workInProgress,
                  setDefaultShallowSuspenseContext(suspenseStackCursor.current)
                ); // We know that this component will suspend again because if it has
                // been unsuspended it has committed as a resolved Suspense component.
                // If it needs to be retried, it should have work scheduled on it.

                workInProgress.effectTag |= DidCapture;
                break;
              }
            } // If this boundary is currently timed out, we need to decide
            // whether to retry the primary children, or to skip over it and
            // go straight to the fallback. Check the priority of the primary
            // child fragment.

            var primaryChildFragment = workInProgress.child;
            var primaryChildExpirationTime =
              primaryChildFragment.childExpirationTime;

            if (
              primaryChildExpirationTime !== NoWork &&
              primaryChildExpirationTime >= renderExpirationTime
            ) {
              // The primary children have pending work. Use the normal path
              // to attempt to render the primary children again.
              return updateSuspenseComponent(
                current$$1,
                workInProgress,
                renderExpirationTime
              );
            } else {
              pushSuspenseContext(
                workInProgress,
                setDefaultShallowSuspenseContext(suspenseStackCursor.current)
              ); // The primary children do not have pending work with sufficient
              // priority. Bailout.

              var child = bailoutOnAlreadyFinishedWork(
                current$$1,
                workInProgress,
                renderExpirationTime
              );

              if (child !== null) {
                // The fallback children have pending work. Skip over the
                // primary children and work on the fallback.
                return child.sibling;
              } else {
                return null;
              }
            }
          } else {
            pushSuspenseContext(
              workInProgress,
              setDefaultShallowSuspenseContext(suspenseStackCursor.current)
            );
          }

          break;
        }

        case SuspenseListComponent: {
          var didSuspendBefore =
            (current$$1.effectTag & DidCapture) !== NoEffect;
          var hasChildWork =
            workInProgress.childExpirationTime >= renderExpirationTime;

          if (didSuspendBefore) {
            if (hasChildWork) {
              // If something was in fallback state last time, and we have all the
              // same children then we're still in progressive loading state.
              // Something might get unblocked by state updates or retries in the
              // tree which will affect the tail. So we need to use the normal
              // path to compute the correct tail.
              return updateSuspenseListComponent(
                current$$1,
                workInProgress,
                renderExpirationTime
              );
            } // If none of the children had any work, that means that none of
            // them got retried so they'll still be blocked in the same way
            // as before. We can fast bail out.

            workInProgress.effectTag |= DidCapture;
          } // If nothing suspended before and we're rendering the same children,
          // then the tail doesn't matter. Anything new that suspends will work
          // in the "together" mode, so we can continue from the state we had.

          var renderState = workInProgress.memoizedState;

          if (renderState !== null) {
            // Reset to the "together" mode in case we've started a different
            // update in the past but didn't complete it.
            renderState.rendering = null;
            renderState.tail = null;
          }

          pushSuspenseContext(workInProgress, suspenseStackCursor.current);

          if (hasChildWork) {
            break;
          } else {
            // If none of the children had any work, that means that none of
            // them got retried so they'll still be blocked in the same way
            // as before. We can fast bail out.
            return null;
          }
        }
      }

      return bailoutOnAlreadyFinishedWork(
        current$$1,
        workInProgress,
        renderExpirationTime
      );
    } else {
      // An update was scheduled on this fiber, but there are no new props
      // nor legacy context. Set this to false. If an update queue or context
      // consumer produces a changed value, it will set this to true. Otherwise,
      // the component will assume the children have not changed and bail out.
      didReceiveUpdate = false;
    }
  } else {
    didReceiveUpdate = false;
  } // Before entering the begin phase, clear the expiration time.

  workInProgress.expirationTime = NoWork;

  switch (workInProgress.tag) {
    case IndeterminateComponent: {
      return mountIndeterminateComponent(
        current$$1,
        workInProgress,
        workInProgress.type,
        renderExpirationTime
      );
    }

    case LazyComponent: {
      var elementType = workInProgress.elementType;
      return mountLazyComponent(
        current$$1,
        workInProgress,
        elementType,
        updateExpirationTime,
        renderExpirationTime
      );
    }

    case FunctionComponent: {
      var _Component = workInProgress.type;
      var unresolvedProps = workInProgress.pendingProps;
      var resolvedProps =
        workInProgress.elementType === _Component
          ? unresolvedProps
          : resolveDefaultProps(_Component, unresolvedProps);
      return updateFunctionComponent(
        current$$1,
        workInProgress,
        _Component,
        resolvedProps,
        renderExpirationTime
      );
    }

    case ClassComponent: {
      var _Component2 = workInProgress.type;
      var _unresolvedProps = workInProgress.pendingProps;

      var _resolvedProps =
        workInProgress.elementType === _Component2
          ? _unresolvedProps
          : resolveDefaultProps(_Component2, _unresolvedProps);

      return updateClassComponent(
        current$$1,
        workInProgress,
        _Component2,
        _resolvedProps,
        renderExpirationTime
      );
    }

    case HostRoot:
      return updateHostRoot(current$$1, workInProgress, renderExpirationTime);

    case HostComponent:
      return updateHostComponent(
        current$$1,
        workInProgress,
        renderExpirationTime
      );

    case HostText:
      return updateHostText(current$$1, workInProgress);

    case SuspenseComponent:
      return updateSuspenseComponent(
        current$$1,
        workInProgress,
        renderExpirationTime
      );

    case HostPortal:
      return updatePortalComponent(
        current$$1,
        workInProgress,
        renderExpirationTime
      );

    case ForwardRef: {
      var type = workInProgress.type;
      var _unresolvedProps2 = workInProgress.pendingProps;

      var _resolvedProps2 =
        workInProgress.elementType === type
          ? _unresolvedProps2
          : resolveDefaultProps(type, _unresolvedProps2);

      return updateForwardRef(
        current$$1,
        workInProgress,
        type,
        _resolvedProps2,
        renderExpirationTime
      );
    }

    case Fragment:
      return updateFragment(current$$1, workInProgress, renderExpirationTime);

    case Mode:
      return updateMode(current$$1, workInProgress, renderExpirationTime);

    case Profiler:
      return updateProfiler(current$$1, workInProgress, renderExpirationTime);

    case ContextProvider:
      return updateContextProvider(
        current$$1,
        workInProgress,
        renderExpirationTime
      );

    case ContextConsumer:
      return updateContextConsumer(
        current$$1,
        workInProgress,
        renderExpirationTime
      );

    case MemoComponent: {
      var _type2 = workInProgress.type;
      var _unresolvedProps3 = workInProgress.pendingProps; // Resolve outer props first, then resolve inner props.

      var _resolvedProps3 = resolveDefaultProps(_type2, _unresolvedProps3);

      {
        if (workInProgress.type !== workInProgress.elementType) {
          var outerPropTypes = _type2.propTypes;

          if (outerPropTypes) {
            checkPropTypes(
              outerPropTypes,
              _resolvedProps3, // Resolved for outer only
              "prop",
              getComponentName(_type2),
              getCurrentFiberStackInDev
            );
          }
        }
      }

      _resolvedProps3 = resolveDefaultProps(_type2.type, _resolvedProps3);
      return updateMemoComponent(
        current$$1,
        workInProgress,
        _type2,
        _resolvedProps3,
        updateExpirationTime,
        renderExpirationTime
      );
    }

    case SimpleMemoComponent: {
      return updateSimpleMemoComponent(
        current$$1,
        workInProgress,
        workInProgress.type,
        workInProgress.pendingProps,
        updateExpirationTime,
        renderExpirationTime
      );
    }

    case IncompleteClassComponent: {
      var _Component3 = workInProgress.type;
      var _unresolvedProps4 = workInProgress.pendingProps;

      var _resolvedProps4 =
        workInProgress.elementType === _Component3
          ? _unresolvedProps4
          : resolveDefaultProps(_Component3, _unresolvedProps4);

      return mountIncompleteClassComponent(
        current$$1,
        workInProgress,
        _Component3,
        _resolvedProps4,
        renderExpirationTime
      );
    }

    case SuspenseListComponent: {
      return updateSuspenseListComponent(
        current$$1,
        workInProgress,
        renderExpirationTime
      );
    }

    case FundamentalComponent: {
      if (enableFundamentalAPI) {
        return updateFundamentalComponent$1(
          current$$1,
          workInProgress,
          renderExpirationTime
        );
      }

      break;
    }

    case ScopeComponent: {
      if (enableScopeAPI) {
        return updateScopeComponent(
          current$$1,
          workInProgress,
          renderExpirationTime
        );
      }

      break;
    }
  }

  (function() {
    {
      {
        throw ReactError(
          Error(
            "Unknown unit of work tag (" +
              workInProgress.tag +
              "). This error is likely caused by a bug in React. Please file an issue."
          )
        );
      }
    }
  })();
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

function unwindInterruptedWork(interruptedWork) {
  switch (interruptedWork.tag) {
    case ClassComponent: {
      var childContextTypes = interruptedWork.type.childContextTypes;

      if (childContextTypes !== null && childContextTypes !== undefined) {
        popContext(interruptedWork);
      }

      break;
    }

    case HostRoot: {
      popHostContainer(interruptedWork);
      popTopLevelContextObject(interruptedWork);
      break;
    }

    case HostComponent: {
      popHostContext(interruptedWork);
      break;
    }

    case HostPortal:
      popHostContainer(interruptedWork);
      break;

    case SuspenseComponent:
      popSuspenseContext(interruptedWork);
      break;

    case SuspenseListComponent:
      popSuspenseContext(interruptedWork);
      break;

    case ContextProvider:
      popProvider(interruptedWork);
      break;

    default:
      break;
  }
}
var scheduleTimeout = typeof setTimeout === "function" ? setTimeout : undefined;
var cancelTimeout =
  typeof clearTimeout === "function" ? clearTimeout : undefined;
var noTimeout = -1;
function prepareFreshStack(root, expirationTime) {
  root.finishedWork = null;
  root.finishedExpirationTime = NoWork;
  var timeoutHandle = root.timeoutHandle;

  if (timeoutHandle !== noTimeout) {
    // The root previous suspended and scheduled a timeout to commit a fallback
    // state. Now that we have additional work, cancel the timeout.
    root.timeoutHandle = noTimeout; // $FlowFixMe Complains noTimeout is not a TimeoutID, despite the check above

    cancelTimeout(timeoutHandle);
  }

  if (workInProgress !== null) {
    var interruptedWork = workInProgress.return;

    while (interruptedWork !== null) {
      unwindInterruptedWork(interruptedWork);
      interruptedWork = interruptedWork.return;
    }
  }

  workInProgressRoot = root;
  workInProgress = createWorkInProgress(root.current, null, expirationTime);
  renderExpirationTime = expirationTime;
  workInProgressRootExitStatus = RootIncomplete;
  workInProgressRootFatalError = null;
  workInProgressRootLatestProcessedExpirationTime = Sync;
  workInProgressRootLatestSuspenseTimeout = Sync;
  workInProgressRootCanSuspendUsingConfig = null;
  workInProgressRootNextUnprocessedUpdateTime = NoWork;
  workInProgressRootHasPendingPing = false;

  if (enableSchedulerTracing) {
    spawnedWorkDuringRender = null;
  }

  // {
  //   ReactStrictModeWarnings.discardPendingWarnings();
  //   componentsThatTriggeredHighPriSuspend = null;
  // }
}

// 绑定currentFiber
function startWorkLoopTimer(nextUnitOfWork) {
  if (enableUserTimingAPI) {
    currentFiber = nextUnitOfWork;

    if (!supportsUserTiming) {
      return;
    }

    commitCountInCurrentWorkLoop = 0; // This is top level call.
    // Any other measurements are performed within.

    beginMark("(React Tree Reconciliation)"); // Resume any measurements that were in progress during the last loop.

    resumeTimers();
  }
}

function ensureRootIsScheduled(root) {
  var lastExpiredTime = root.lastExpiredTime;

  if (lastExpiredTime !== NoWork) {
    // Special case: Expired work should flush synchronously.
    root.callbackExpirationTime = Sync;
    root.callbackPriority = ImmediatePriority;
    root.callbackNode = scheduleSyncCallback(
      performSyncWorkOnRoot.bind(null, root)
    );
    return;
  }

  var expirationTime = getNextRootExpirationTimeToWorkOn(root);
  var existingCallbackNode = root.callbackNode;

  if (expirationTime === NoWork) {
    // There's nothing to work on.
    if (existingCallbackNode !== null) {
      root.callbackNode = null;
      root.callbackExpirationTime = NoWork;
      root.callbackPriority = NoPriority;
    }

    return;
  } // TODO: If this is an update, we already read the current time. Pass the
  // time as an argument.

  var currentTime = requestCurrentTime();
  var priorityLevel = inferPriorityFromExpirationTime(
    currentTime,
    expirationTime
  ); // If there's an existing render task, confirm it has the correct priority and
  // expiration time. Otherwise, we'll cancel it and schedule a new one.

  if (existingCallbackNode !== null) {
    var existingCallbackPriority = root.callbackPriority;
    var existingCallbackExpirationTime = root.callbackExpirationTime;

    if (
      // Callback must have the exact same expiration time.
      existingCallbackExpirationTime === expirationTime && // Callback must have greater or equal priority.
      existingCallbackPriority >= priorityLevel
    ) {
      // Existing callback is sufficient.
      return;
    } // Need to schedule a new task.
    // TODO: Instead of scheduling a new task, we should be able to change the
    // priority of the existing one.

    cancelCallback(existingCallbackNode);
  }

  root.callbackExpirationTime = expirationTime;
  root.callbackPriority = priorityLevel;
  var callbackNode;

  if (expirationTime === Sync) {
    // Sync React callbacks are scheduled on a special internal queue
    callbackNode = scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
  } else if (disableSchedulerTimeoutBasedOnReactExpirationTime) {
    callbackNode = scheduleCallback(
      priorityLevel,
      performConcurrentWorkOnRoot.bind(null, root)
    );
  } else {
    callbackNode = scheduleCallback(
      priorityLevel,
      performConcurrentWorkOnRoot.bind(null, root), // Compute a task timeout based on the expiration time. This also affects
      // ordering because tasks are processed in timeout order.
      {
        timeout: expirationTimeToMs(expirationTime) - now()
      }
    );
  }

  root.callbackNode = callbackNode;
} // This is the entry point for every concurrent task, i.e. anything that
// goes through Scheduler.

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
      // 重置调度队列 获得workInProgress
      prepareFreshStack(root, expirationTime);
      // 将调度优先级高的interaction加入到interactions中,新的高优先级的节点开始调度
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
      // 如果仍有正在进程里的任务
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
  // 找到FiberRoot并遍历更新子节点的expirationTime
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
