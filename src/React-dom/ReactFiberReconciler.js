var NoEffect =0;
var PerformedWork =1; // You can change the rest (and add more).

var Placement =2;
var Update =4;
var PlacementAndUpdate =6;
var Deletion =8;
var ContentReset =16;
var Callback =32;
var DidCapture =64;
var Ref =128;
var Snapshot =256;
var Passive =512;
var Hydrating =1024;
var HydratingAndUpdate =1028; // Passive & Update & Callback & Ref & Snapshot

var LifecycleEffectMask =932; // Union of all host effects

var HostEffectMask =2047;
var Incomplete =2048;
var ShouldCapture =4096;
var reconcileChildFibers = ChildReconciler(true);
var mountChildFibers = ChildReconciler(false);
var UpdateState = 0;
var ReplaceState = 1;
var ForceUpdate = 2;

var current = null;
var phase = null;
function resetCurrentFiber() {
  {
    ReactDebugCurrentFrame.getCurrentStack = null;
    current = null;
    phase = null;
  }
}
function setCurrentFiber(fiber) {
  {
    ReactDebugCurrentFrame.getCurrentStack = getCurrentFiberStackInDev;
    current = fiber;
    phase = null;
  }
}
function setCurrentPhase(lifeCyclePhase) {
  {
    phase = lifeCyclePhase;
  }
}
var hasForceUpdate = false;
function checkHasForceUpdateAfterProcessing() {
  return hasForceUpdate;
}
function checkShouldComponentUpdate(workInProgress, ctor, oldProps, newProps, oldState, newState, nextContext) {
  var instance = workInProgress.stateNode;

  if (typeof instance.shouldComponentUpdate === 'function') {
    startPhaseTimer(workInProgress, 'shouldComponentUpdate');
    var shouldUpdate = instance.shouldComponentUpdate(newProps, newState, nextContext);
    stopPhaseTimer();

    {
      !(shouldUpdate !== undefined) ? warningWithoutStack$1(false, '%s.shouldComponentUpdate(): Returned undefined instead of a ' + 'boolean value. Make sure to return true or false.', getComponentName(ctor) || 'Component') : void 0;
    }

    return shouldUpdate;
  }

  if (ctor.prototype && ctor.prototype.isPureReactComponent) {
    return !shallowEqual(oldProps, newProps) || !shallowEqual(oldState, newState);
  }

  return true;
}
function mountClassInstance(workInProgress, ctor, newProps, renderExpirationTime) {
  {
    checkClassInstance(workInProgress, ctor, newProps);
  }

  var instance = workInProgress.stateNode;
  instance.props = newProps;
  instance.state = workInProgress.memoizedState;
  instance.refs = emptyRefsObject;
  var contextType = ctor.contextType;

  if (typeof contextType === 'object' && contextType !== null) {
    instance.context = readContext(contextType);
  } else if (disableLegacyContext) {
    instance.context = emptyContextObject;
  } else {
    var unmaskedContext = getUnmaskedContext(workInProgress, ctor, true);
    instance.context = getMaskedContext(workInProgress, unmaskedContext);
  }

  {
    if (instance.state === newProps) {
      var componentName = getComponentName(ctor) || 'Component';

      if (!didWarnAboutDirectlyAssigningPropsToState.has(componentName)) {
        didWarnAboutDirectlyAssigningPropsToState.add(componentName);
        warningWithoutStack$1(false, '%s: It is not recommended to assign props directly to state ' + "because updates to props won't be reflected in state. " + 'In most cases, it is better to use props directly.', componentName);
      }
    }

    if (workInProgress.mode & StrictMode) {
      ReactStrictModeWarnings.recordLegacyContextWarning(workInProgress, instance);
    }

    if (warnAboutDeprecatedLifecycles) {
      ReactStrictModeWarnings.recordUnsafeLifecycleWarnings(workInProgress, instance);
    }
  }

  var updateQueue = workInProgress.updateQueue;

  if (updateQueue !== null) {
    processUpdateQueue(workInProgress, updateQueue, newProps, instance, renderExpirationTime);
    instance.state = workInProgress.memoizedState;
  }

  var getDerivedStateFromProps = ctor.getDerivedStateFromProps;

  if (typeof getDerivedStateFromProps === 'function') {
    applyDerivedStateFromProps(workInProgress, ctor, getDerivedStateFromProps, newProps);
    instance.state = workInProgress.memoizedState;
  } // In order to support react-lifecycles-compat polyfilled components,
  // Unsafe lifecycles should not be invoked for components using the new APIs.


  if (typeof ctor.getDerivedStateFromProps !== 'function' && typeof instance.getSnapshotBeforeUpdate !== 'function' && (typeof instance.UNSAFE_componentWillMount === 'function' || typeof instance.componentWillMount === 'function')) {
    callComponentWillMount(workInProgress, instance); // If we had additional state updates during this life-cycle, let's
    // process them now.

    updateQueue = workInProgress.updateQueue;

    if (updateQueue !== null) {
      processUpdateQueue(workInProgress, updateQueue, newProps, instance, renderExpirationTime);
      instance.state = workInProgress.memoizedState;
    }
  }

  if (typeof instance.componentDidMount === 'function') {
    workInProgress.effectTag |= Update;
  }
}

function resumeMountClassInstance(workInProgress, ctor, newProps, renderExpirationTime) {
  var instance = workInProgress.stateNode;
  var oldProps = workInProgress.memoizedProps;
  instance.props = oldProps;
  var oldContext = instance.context;
  var contextType = ctor.contextType;
  var nextContext = emptyContextObject;

  if (typeof contextType === 'object' && contextType !== null) {
    nextContext = readContext(contextType);
  } else if (!disableLegacyContext) {
    var nextLegacyUnmaskedContext = getUnmaskedContext(workInProgress, ctor, true);
    nextContext = getMaskedContext(workInProgress, nextLegacyUnmaskedContext);
  }

  var getDerivedStateFromProps = ctor.getDerivedStateFromProps;
  var hasNewLifecycles = typeof getDerivedStateFromProps === 'function' || typeof instance.getSnapshotBeforeUpdate === 'function'; // Note: During these life-cycles, instance.props/instance.state are what
  // ever the previously attempted to render - not the "current". However,
  // during componentDidUpdate we pass the "current" props.
  // In order to support react-lifecycles-compat polyfilled components,
  // Unsafe lifecycles should not be invoked for components using the new APIs.

  if (!hasNewLifecycles && (typeof instance.UNSAFE_componentWillReceiveProps === 'function' || typeof instance.componentWillReceiveProps === 'function')) {
    if (oldProps !== newProps || oldContext !== nextContext) {
      callComponentWillReceiveProps(workInProgress, instance, newProps, nextContext);
    }
  }

  resetHasForceUpdateBeforeProcessing();
  var oldState = workInProgress.memoizedState;
  var newState = instance.state = oldState;
  var updateQueue = workInProgress.updateQueue;

  if (updateQueue !== null) {
    processUpdateQueue(workInProgress, updateQueue, newProps, instance, renderExpirationTime);
    newState = workInProgress.memoizedState;
  }

  if (oldProps === newProps && oldState === newState && !hasContextChanged() && !checkHasForceUpdateAfterProcessing()) {
    // If an update was already in progress, we should schedule an Update
    // effect even though we're bailing out, so that cWU/cDU are called.
    if (typeof instance.componentDidMount === 'function') {
      workInProgress.effectTag |= Update;
    }

    return false;
  }

  if (typeof getDerivedStateFromProps === 'function') {
    applyDerivedStateFromProps(workInProgress, ctor, getDerivedStateFromProps, newProps);
    newState = workInProgress.memoizedState;
  }

  var shouldUpdate = checkHasForceUpdateAfterProcessing() || checkShouldComponentUpdate(workInProgress, ctor, oldProps, newProps, oldState, newState, nextContext);

  if (shouldUpdate) {
    // In order to support react-lifecycles-compat polyfilled components,
    // Unsafe lifecycles should not be invoked for components using the new APIs.
    if (!hasNewLifecycles && (typeof instance.UNSAFE_componentWillMount === 'function' || typeof instance.componentWillMount === 'function')) {
      startstartPhaseTimer(workInProgress, 'componentWillMount');

      if (typeof instance.componentWillMount === 'function') {
        instance.componentWillMount();
      }

      if (typeof instance.UNSAFE_componentWillMount === 'function') {
        instance.UNSAFE_componentWillMount();
      }

      stopPhaseTimer();
    }

    if (typeof instance.componentDidMount === 'function') {
      workInProgress.effectTag |= Update;
    }
  } else { // 跳过startPhaseTimer
    // If an update was already in progress, we should schedule an Update
    // effect even though we're bailing out, so that cWU/cDU are called.
    if (typeof instance.componentDidMount === 'function') {
      workInProgress.effectTag |= Update;
    } // If shouldComponentUpdate returned false, we should still update the
    // memoized state to indicate that this work can be reused.


    workInProgress.memoizedProps = newProps;
    workInProgress.memoizedState = newState;
  } // Update the existing instance's state, props, and context pointers even
  // if shouldComponentUpdate returns false.


  instance.props = newProps;
  instance.state = newState;
  instance.context = nextContext;
  return shouldUpdate;
} // Invokes the update life-cycles and returns false if it shouldn't rerender.

// 获取实例
function updateClassInstance(current, workInProgress, ctor, newProps, renderExpirationTime) {
  var instance = workInProgress.stateNode;
  var oldProps = workInProgress.memoizedProps;
  instance.props = workInProgress.type === workInProgress.elementType ? oldProps : resolveDefaultProps(workInProgress.type, oldProps);
  var oldContext = instance.context;
  var contextType = ctor.contextType;
  var nextContext = emptyContextObject;

  if (typeof contextType === 'object' && contextType !== null) {
    nextContext = readContext(contextType);
  } else if (!disableLegacyContext) {
    var nextUnmaskedContext = getUnmaskedContext(workInProgress, ctor, true);
    nextContext = getMaskedContext(workInProgress, nextUnmaskedContext);
  }

  var getDerivedStateFromProps = ctor.getDerivedStateFromProps;
  var hasNewLifecycles = typeof getDerivedStateFromProps === 'function' || typeof instance.getSnapshotBeforeUpdate === 'function'; // Note: During these life-cycles, instance.props/instance.state are what
  // ever the previously attempted to render - not the "current". However,
  // during componentDidUpdate we pass the "current" props.
  // In order to support react-lifecycles-compat polyfilled components,
  // Unsafe lifecycles should not be invoked for components using the new APIs.

  if (!hasNewLifecycles && (typeof instance.UNSAFE_componentWillReceiveProps === 'function' || typeof instance.componentWillReceiveProps === 'function')) {
    if (oldProps !== newProps || oldContext !== nextContext) {
      callComponentWillReceiveProps(workInProgress, instance, newProps, nextContext);
    }
  }

  resetHasForceUpdateBeforeProcessing();
  var oldState = workInProgress.memoizedState;
  var newState = instance.state = oldState;
  var updateQueue = workInProgress.updateQueue;

  if (updateQueue !== null) {
    processUpdateQueue(workInProgress, updateQueue, newProps, instance, renderExpirationTime);
    newState = workInProgress.memoizedState;
  }

  if (oldProps === newProps && oldState === newState && !hasContextChanged() && !checkHasForceUpdateAfterProcessing()) {
    // If an update was already in progress, we should schedule an Update
    // effect even though we're bailing out, so that cWU/cDU are called.
    if (typeof instance.componentDidUpdate === 'function') {
      if (oldProps !== current.memoizedProps || oldState !== current.memoizedState) {
        workInProgress.effectTag |= Update;
      }
    }

    if (typeof instance.getSnapshotBeforeUpdate === 'function') {
      if (oldProps !== current.memoizedProps || oldState !== current.memoizedState) {
        workInProgress.effectTag |= Snapshot;
      }
    }

    return false;
  }

  if (typeof getDerivedStateFromProps === 'function') {
    applyDerivedStateFromProps(workInProgress, ctor, getDerivedStateFromProps, newProps);
    newState = workInProgress.memoizedState;
  }

  // 是否更新 forceUpdate | shouldComponentUpdate
  var shouldUpdate = checkHasForceUpdateAfterProcessing() || checkShouldComponentUpdate(workInProgress, ctor, oldProps, newProps, oldState, newState, nextContext);

  if (shouldUpdate) {
    // In order to support react-lifecycles-compat polyfilled components,
    // Unsafe lifecycles should not be invoked for components using the new APIs.
    if (!hasNewLifecycles && (typeof instance.UNSAFE_componentWillUpdate === 'function' || typeof instance.componentWillUpdate === 'function')) {
      startPhaseTimer(workInProgress, 'componentWillUpdate');

      if (typeof instance.componentWillUpdate === 'function') {
        instance.componentWillUpdate(newProps, newState, nextContext);
      }

      if (typeof instance.UNSAFE_componentWillUpdate === 'function') {
        instance.UNSAFE_componentWillUpdate(newProps, newState, nextContext);
      }

      stopPhaseTimer();
    }

    if (typeof instance.componentDidUpdate === 'function') {
      workInProgress.effectTag |= Update;
    }

    if (typeof instance.getSnapshotBeforeUpdate === 'function') {
      workInProgress.effectTag |= Snapshot;
    }
  } else {
    // If an update was already in progress, we should schedule an Update
    // effect even though we're bailing out, so that cWU/cDU are called.
    if (typeof instance.componentDidUpdate === 'function') {
      if (oldProps !== current.memoizedProps || oldState !== current.memoizedState) {
        workInProgress.effectTag |= Update;
      }
    }

    if (typeof instance.getSnapshotBeforeUpdate === 'function') {
      if (oldProps !== current.memoizedProps || oldState !== current.memoizedState) {
        workInProgress.effectTag |= Snapshot;
      }
    } // If shouldComponentUpdate returned false, we should still update the
    // memoized props/state to indicate that this work can be reused.


    workInProgress.memoizedProps = newProps;
    workInProgress.memoizedState = newState;
  } // Update the existing instance's state, props, and context pointers even
  // if shouldComponentUpdate returns false.


  instance.props = newProps;
  instance.state = newState;
  instance.context = nextContext;
  return shouldUpdate;
}

function ChildReconciler(shouldTrackSideEffects) {
  function deleteChild(returnFiber, childToDelete) {
    if (!shouldTrackSideEffects) {
      // Noop.
      return;
    } // Deletions are added in reversed order so we add it to the front.
    // At this point, the return fiber's effect list is empty except for
    // deletions, so we can just append the deletion to the list. The remaining
    // effects aren't added until the complete phase. Once we implement
    // resuming, this may not be true.


    var last = returnFiber.lastEffect;

    if (last !== null) {
      last.nextEffect = childToDelete;
      returnFiber.lastEffect = childToDelete;
    } else {
      returnFiber.firstEffect = returnFiber.lastEffect = childToDelete;
    }

    childToDelete.nextEffect = null;
    childToDelete.effectTag = Deletion;
  }

  function deleteRemainingChildren(returnFiber, currentFirstChild) {
    if (!shouldTrackSideEffects) {
      // Noop.
      return null;
    } // TODO: For the shouldClone case, this could be micro-optimized a bit by
    // assuming that after the first child we've already added everything.


    var childToDelete = currentFirstChild;

    while (childToDelete !== null) {
      deleteChild(returnFiber, childToDelete);
      childToDelete = childToDelete.sibling;
    }

    return null;
  }

  function mapRemainingChildren(returnFiber, currentFirstChild) {
    // Add the remaining children to a temporary map so that we can find them by
    // keys quickly. Implicit (null) keys get added to this set with their index
    // instead.
    var existingChildren = new Map();
    var existingChild = currentFirstChild;

    while (existingChild !== null) {
      if (existingChild.key !== null) {
        existingChildren.set(existingChild.key, existingChild);
      } else {
        existingChildren.set(existingChild.index, existingChild);
      }

      existingChild = existingChild.sibling;
    }

    return existingChildren;
  }

  function useFiber(fiber, pendingProps, expirationTime) {
    // We currently set sibling to null and index to 0 here because it is easy
    // to forget to do before returning it. E.g. for the single child case.
    var clone = createWorkInProgress(fiber, pendingProps, expirationTime);
    clone.index = 0;
    clone.sibling = null;
    return clone;
  }

  function placeChild(newFiber, lastPlacedIndex, newIndex) {
    newFiber.index = newIndex;

    if (!shouldTrackSideEffects) {
      // Noop.
      return lastPlacedIndex;
    }

    var current$$1 = newFiber.alternate;

    if (current$$1 !== null) {
      var oldIndex = current$$1.index;

      if (oldIndex < lastPlacedIndex) {
        // This is a move.
        newFiber.effectTag = Placement;
        return lastPlacedIndex;
      } else {
        // This item can stay in place.
        return oldIndex;
      }
    } else {
      // This is an insertion.
      newFiber.effectTag = Placement;
      return lastPlacedIndex;
    }
  }

  function placeSingleChild(newFiber) {
    // This is simpler for the single child case. We only need to do a
    // placement for inserting new children.
    if (shouldTrackSideEffects && newFiber.alternate === null) {
      newFiber.effectTag = Placement;
    }

    return newFiber;
  }

  function updateTextNode(returnFiber, current$$1, textContent, expirationTime) {
    if (current$$1 === null || current$$1.tag !== HostText) {
      // Insert
      var created = createFiberFromText(textContent, returnFiber.mode, expirationTime);
      created.return = returnFiber;
      return created;
    } else {
      // Update
      var existing = useFiber(current$$1, textContent, expirationTime);
      existing.return = returnFiber;
      return existing;
    }
  }

  function updateElement(returnFiber, current$$1, element, expirationTime) {
    if (current$$1 !== null && (current$$1.elementType === element.type || ( // Keep this check inline so it only runs on the false path:
    isCompatibleFamilyForHotReloading(current$$1, element)))) {
      // Move based on index
      var existing = useFiber(current$$1, element.props, expirationTime);
      existing.ref = coerceRef(returnFiber, current$$1, element);
      existing.return = returnFiber;

      {
        existing._debugSource = element._source;
        existing._debugOwner = element._owner;
      }

      return existing;
    } else {
      // Insert
      var created = createFiberFromElement(element, returnFiber.mode, expirationTime);
      created.ref = coerceRef(returnFiber, current$$1, element);
      created.return = returnFiber;
      return created;
    }
  }

  function updatePortal(returnFiber, current$$1, portal, expirationTime) {
    if (current$$1 === null || current$$1.tag !== HostPortal || current$$1.stateNode.containerInfo !== portal.containerInfo || current$$1.stateNode.implementation !== portal.implementation) {
      // Insert
      var created = createFiberFromPortal(portal, returnFiber.mode, expirationTime);
      created.return = returnFiber;
      return created;
    } else {
      // Update
      var existing = useFiber(current$$1, portal.children || [], expirationTime);
      existing.return = returnFiber;
      return existing;
    }
  }

  function updateFragment(returnFiber, current$$1, fragment, expirationTime, key) {
    if (current$$1 === null || current$$1.tag !== Fragment) {
      // Insert
      var created = createFiberFromFragment(fragment, returnFiber.mode, expirationTime, key);
      created.return = returnFiber;
      return created;
    } else {
      // Update
      var existing = useFiber(current$$1, fragment, expirationTime);
      existing.return = returnFiber;
      return existing;
    }
  }

  function createChild(returnFiber, newChild, expirationTime) {
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      // Text nodes don't have keys. If the previous node is implicitly keyed
      // we can continue to replace it without aborting even if it is not a text
      // node.
      var created = createFiberFromText('' + newChild, returnFiber.mode, expirationTime);
      created.return = returnFiber;
      return created;
    }

    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          {
            var _created = createFiberFromElement(newChild, returnFiber.mode, expirationTime);

            _created.ref = coerceRef(returnFiber, null, newChild);
            _created.return = returnFiber;
            return _created;
          }

        case REACT_PORTAL_TYPE:
          {
            var _created2 = createFiberFromPortal(newChild, returnFiber.mode, expirationTime);

            _created2.return = returnFiber;
            return _created2;
          }
      }

      if (isArray(newChild) || getIteratorFn(newChild)) {
        var _created3 = createFiberFromFragment(newChild, returnFiber.mode, expirationTime, null);

        _created3.return = returnFiber;
        return _created3;
      }

      throwOnInvalidObjectType(returnFiber, newChild);
    }

    {
      if (typeof newChild === 'function') {
        warnOnFunctionType();
      }
    }

    return null;
  }

  function updateSlot(returnFiber, oldFiber, newChild, expirationTime) {
    // Update the fiber if the keys match, otherwise return null.
    var key = oldFiber !== null ? oldFiber.key : null;

    if (typeof newChild === 'string' || typeof newChild === 'number') {
      // Text nodes don't have keys. If the previous node is implicitly keyed
      // we can continue to replace it without aborting even if it is not a text
      // node.
      if (key !== null) {
        return null;
      }

      return updateTextNode(returnFiber, oldFiber, '' + newChild, expirationTime);
    }

    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          {
            if (newChild.key === key) {
              if (newChild.type === REACT_FRAGMENT_TYPE) {
                return updateFragment(returnFiber, oldFiber, newChild.props.children, expirationTime, key);
              }

              return updateElement(returnFiber, oldFiber, newChild, expirationTime);
            } else {
              return null;
            }
          }

        case REACT_PORTAL_TYPE:
          {
            if (newChild.key === key) {
              return updatePortal(returnFiber, oldFiber, newChild, expirationTime);
            } else {
              return null;
            }
          }
      }

      if (isArray(newChild) || getIteratorFn(newChild)) {
        if (key !== null) {
          return null;
        }

        return updateFragment(returnFiber, oldFiber, newChild, expirationTime, null);
      }

      throwOnInvalidObjectType(returnFiber, newChild);
    }

    {
      if (typeof newChild === 'function') {
        warnOnFunctionType();
      }
    }

    return null;
  }

  function updateFromMap(existingChildren, returnFiber, newIdx, newChild, expirationTime) {
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      // Text nodes don't have keys, so we neither have to check the old nor
      // new node for the key. If both are text nodes, they match.
      var matchedFiber = existingChildren.get(newIdx) || null;
      return updateTextNode(returnFiber, matchedFiber, '' + newChild, expirationTime);
    }

    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          {
            var _matchedFiber = existingChildren.get(newChild.key === null ? newIdx : newChild.key) || null;

            if (newChild.type === REACT_FRAGMENT_TYPE) {
              return updateFragment(returnFiber, _matchedFiber, newChild.props.children, expirationTime, newChild.key);
            }

            return updateElement(returnFiber, _matchedFiber, newChild, expirationTime);
          }

        case REACT_PORTAL_TYPE:
          {
            var _matchedFiber2 = existingChildren.get(newChild.key === null ? newIdx : newChild.key) || null;

            return updatePortal(returnFiber, _matchedFiber2, newChild, expirationTime);
          }
      }

      if (isArray(newChild) || getIteratorFn(newChild)) {
        var _matchedFiber3 = existingChildren.get(newIdx) || null;

        return updateFragment(returnFiber, _matchedFiber3, newChild, expirationTime, null);
      }

      throwOnInvalidObjectType(returnFiber, newChild);
    }

    {
      if (typeof newChild === 'function') {
        warnOnFunctionType();
      }
    }

    return null;
  }

  function warnOnInvalidKey(child, knownKeys) {
    {
      if (typeof child !== 'object' || child === null) {
        return knownKeys;
      }

      switch (child.$$typeof) {
        case REACT_ELEMENT_TYPE:
        case REACT_PORTAL_TYPE:
          warnForMissingKey(child);
          var key = child.key;

          if (typeof key !== 'string') {
            break;
          }

          if (knownKeys === null) {
            knownKeys = new Set();
            knownKeys.add(key);
            break;
          }

          if (!knownKeys.has(key)) {
            knownKeys.add(key);
            break;
          }

          warning$1(false, 'Encountered two children with the same key, `%s`. ' + 'Keys should be unique so that components maintain their identity ' + 'across updates. Non-unique keys may cause children to be ' + 'duplicated and/or omitted — the behavior is unsupported and ' + 'could change in a future version.', key);
          break;

        default:
          break;
      }
    }

    return knownKeys;
  }

  function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren, expirationTime) {
    var resultingFirstChild = null;
    var previousNewFiber = null;
    var oldFiber = currentFirstChild;
    var lastPlacedIndex = 0;
    var newIdx = 0;
    var nextOldFiber = null;

    for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
      if (oldFiber.index > newIdx) {
        nextOldFiber = oldFiber;
        oldFiber = null;
      } else {
        nextOldFiber = oldFiber.sibling;
      }

      var newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx], expirationTime);

      if (newFiber === null) {
        // TODO: This breaks on empty slots like null children. That's
        // unfortunate because it triggers the slow path all the time. We need
        // a better way to communicate whether this was a miss or null,
        // boolean, undefined, etc.
        if (oldFiber === null) {
          oldFiber = nextOldFiber;
        }

        break;
      }

      if (shouldTrackSideEffects) {
        if (oldFiber && newFiber.alternate === null) {
          // We matched the slot, but we didn't reuse the existing fiber, so we
          // need to delete the existing child.
          deleteChild(returnFiber, oldFiber);
        }
      }

      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);

      if (previousNewFiber === null) {
        // TODO: Move out of the loop. This only happens for the first run.
        resultingFirstChild = newFiber;
      } else {
        // TODO: Defer siblings if we're not at the right index for this slot.
        // I.e. if we had null values before, then we want to defer this
        // for each null value. However, we also don't want to call updateSlot
        // with the previous one.
        previousNewFiber.sibling = newFiber;
      }

      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }

    if (newIdx === newChildren.length) {
      // We've reached the end of the new children. We can delete the rest.
      deleteRemainingChildren(returnFiber, oldFiber);
      return resultingFirstChild;
    }

    if (oldFiber === null) {
      // If we don't have any more existing children we can choose a fast path
      // since the rest will all be insertions.
      for (; newIdx < newChildren.length; newIdx++) {
        var _newFiber = createChild(returnFiber, newChildren[newIdx], expirationTime);

        if (_newFiber === null) {
          continue;
        }

        lastPlacedIndex = placeChild(_newFiber, lastPlacedIndex, newIdx);

        if (previousNewFiber === null) {
          // TODO: Move out of the loop. This only happens for the first run.
          resultingFirstChild = _newFiber;
        } else {
          previousNewFiber.sibling = _newFiber;
        }

        previousNewFiber = _newFiber;
      }

      return resultingFirstChild;
    } // Add all children to a key map for quick lookups.


    var existingChildren = mapRemainingChildren(returnFiber, oldFiber); // Keep scanning and use the map to restore deleted items as moves.

    for (; newIdx < newChildren.length; newIdx++) {
      var _newFiber2 = updateFromMap(existingChildren, returnFiber, newIdx, newChildren[newIdx], expirationTime);

      if (_newFiber2 !== null) {
        if (shouldTrackSideEffects) {
          if (_newFiber2.alternate !== null) {
            // The new fiber is a work in progress, but if there exists a
            // current, that means that we reused the fiber. We need to delete
            // it from the child list so that we don't add it to the deletion
            // list.
            existingChildren.delete(_newFiber2.key === null ? newIdx : _newFiber2.key);
          }
        }

        lastPlacedIndex = placeChild(_newFiber2, lastPlacedIndex, newIdx);

        if (previousNewFiber === null) {
          resultingFirstChild = _newFiber2;
        } else {
          previousNewFiber.sibling = _newFiber2;
        }

        previousNewFiber = _newFiber2;
      }
    }

    if (shouldTrackSideEffects) {
      // Any existing children that weren't consumed above were deleted. We need
      // to add them to the deletion list.
      existingChildren.forEach(function (child) {
        return deleteChild(returnFiber, child);
      });
    }

    return resultingFirstChild;
  }

  function reconcileChildrenIterator(returnFiber, currentFirstChild, newChildrenIterable, expirationTime) {
    // This is the same implementation as reconcileChildrenArray(),
    // but using the iterator instead.
    var iteratorFn = getIteratorFn(newChildrenIterable);

    (function () {
      if (!(typeof iteratorFn === 'function')) {
        {
          throw ReactError(Error("An object is not an iterable. This error is likely caused by a bug in React. Please file an issue."));
        }
      }
    })();

    {
      // We don't support rendering Generators because it's a mutation.
      // See https://github.com/facebook/react/issues/12995
      if (typeof Symbol === 'function' && // $FlowFixMe Flow doesn't know about toStringTag
      newChildrenIterable[Symbol.toStringTag] === 'Generator') {
        !didWarnAboutGenerators ? warning$1(false, 'Using Generators as children is unsupported and will likely yield ' + 'unexpected results because enumerating a generator mutates it. ' + 'You may convert it to an array with `Array.from()` or the ' + '`[...spread]` operator before rendering. Keep in mind ' + 'you might need to polyfill these features for older browsers.') : void 0;
        didWarnAboutGenerators = true;
      } // Warn about using Maps as children


      if (newChildrenIterable.entries === iteratorFn) {
        !didWarnAboutMaps ? warning$1(false, 'Using Maps as children is unsupported and will likely yield ' + 'unexpected results. Convert it to a sequence/iterable of keyed ' + 'ReactElements instead.') : void 0;
        didWarnAboutMaps = true;
      } // First, validate keys.
      // We'll get a different iterator later for the main pass.


      var _newChildren = iteratorFn.call(newChildrenIterable);

      if (_newChildren) {
        var knownKeys = null;

        var _step = _newChildren.next();

        for (; !_step.done; _step = _newChildren.next()) {
          var child = _step.value;
          knownKeys = warnOnInvalidKey(child, knownKeys);
        }
      }
    }

    var newChildren = iteratorFn.call(newChildrenIterable);

    (function () {
      if (!(newChildren != null)) {
        {
          throw ReactError(Error("An iterable object provided no iterator."));
        }
      }
    })();

    var resultingFirstChild = null;
    var previousNewFiber = null;
    var oldFiber = currentFirstChild;
    var lastPlacedIndex = 0;
    var newIdx = 0;
    var nextOldFiber = null;
    var step = newChildren.next();

    for (; oldFiber !== null && !step.done; newIdx++, step = newChildren.next()) {
      if (oldFiber.index > newIdx) {
        nextOldFiber = oldFiber;
        oldFiber = null;
      } else {
        nextOldFiber = oldFiber.sibling;
      }

      var newFiber = updateSlot(returnFiber, oldFiber, step.value, expirationTime);

      if (newFiber === null) {
        // TODO: This breaks on empty slots like null children. That's
        // unfortunate because it triggers the slow path all the time. We need
        // a better way to communicate whether this was a miss or null,
        // boolean, undefined, etc.
        if (oldFiber === null) {
          oldFiber = nextOldFiber;
        }

        break;
      }

      if (shouldTrackSideEffects) {
        if (oldFiber && newFiber.alternate === null) {
          // We matched the slot, but we didn't reuse the existing fiber, so we
          // need to delete the existing child.
          deleteChild(returnFiber, oldFiber);
        }
      }

      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);

      if (previousNewFiber === null) {
        // TODO: Move out of the loop. This only happens for the first run.
        resultingFirstChild = newFiber;
      } else {
        // TODO: Defer siblings if we're not at the right index for this slot.
        // I.e. if we had null values before, then we want to defer this
        // for each null value. However, we also don't want to call updateSlot
        // with the previous one.
        previousNewFiber.sibling = newFiber;
      }

      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }

    if (step.done) {
      // We've reached the end of the new children. We can delete the rest.
      deleteRemainingChildren(returnFiber, oldFiber);
      return resultingFirstChild;
    }

    if (oldFiber === null) {
      // If we don't have any more existing children we can choose a fast path
      // since the rest will all be insertions.
      for (; !step.done; newIdx++, step = newChildren.next()) {
        var _newFiber3 = createChild(returnFiber, step.value, expirationTime);

        if (_newFiber3 === null) {
          continue;
        }

        lastPlacedIndex = placeChild(_newFiber3, lastPlacedIndex, newIdx);

        if (previousNewFiber === null) {
          // TODO: Move out of the loop. This only happens for the first run.
          resultingFirstChild = _newFiber3;
        } else {
          previousNewFiber.sibling = _newFiber3;
        }

        previousNewFiber = _newFiber3;
      }

      return resultingFirstChild;
    } // Add all children to a key map for quick lookups.


    var existingChildren = mapRemainingChildren(returnFiber, oldFiber); // Keep scanning and use the map to restore deleted items as moves.

    for (; !step.done; newIdx++, step = newChildren.next()) {
      var _newFiber4 = updateFromMap(existingChildren, returnFiber, newIdx, step.value, expirationTime);

      if (_newFiber4 !== null) {
        if (shouldTrackSideEffects) {
          if (_newFiber4.alternate !== null) {
            // The new fiber is a work in progress, but if there exists a
            // current, that means that we reused the fiber. We need to delete
            // it from the child list so that we don't add it to the deletion
            // list.
            existingChildren.delete(_newFiber4.key === null ? newIdx : _newFiber4.key);
          }
        }

        lastPlacedIndex = placeChild(_newFiber4, lastPlacedIndex, newIdx);

        if (previousNewFiber === null) {
          resultingFirstChild = _newFiber4;
        } else {
          previousNewFiber.sibling = _newFiber4;
        }

        previousNewFiber = _newFiber4;
      }
    }

    if (shouldTrackSideEffects) {
      // Any existing children that weren't consumed above were deleted. We need
      // to add them to the deletion list.
      existingChildren.forEach(function (child) {
        return deleteChild(returnFiber, child);
      });
    }

    return resultingFirstChild;
  }

  function reconcileSingleTextNode(returnFiber, currentFirstChild, textContent, expirationTime) {
    // There's no need to check for keys on text nodes since we don't have a
    // way to define them.
    if (currentFirstChild !== null && currentFirstChild.tag === HostText) {
      // We already have an existing node so let's just update it and delete
      // the rest.
      deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
      var existing = useFiber(currentFirstChild, textContent, expirationTime);
      existing.return = returnFiber;
      return existing;
    } // The existing first child is not a text node so we need to create one
    // and delete the existing ones.


    deleteRemainingChildren(returnFiber, currentFirstChild);
    var created = createFiberFromText(textContent, returnFiber.mode, expirationTime);
    created.return = returnFiber;
    return created;
  }

  function reconcileSingleElement(returnFiber, currentFirstChild, element, expirationTime) {
    var key = element.key;
    var child = currentFirstChild;

    while (child !== null) {
      // TODO: If key === null and child.key === null, then this only applies to
      // the first item in the list.
      if (child.key === key) {
        if (child.tag === Fragment ? element.type === REACT_FRAGMENT_TYPE : child.elementType === element.type || ( // Keep this check inline so it only runs on the false path:
        isCompatibleFamilyForHotReloading(child, element))) {
          deleteRemainingChildren(returnFiber, child.sibling);
          var existing = useFiber(child, element.type === REACT_FRAGMENT_TYPE ? element.props.children : element.props, expirationTime);
          existing.ref = coerceRef(returnFiber, child, element);
          existing.return = returnFiber;

          {
            existing._debugSource = element._source;
            existing._debugOwner = element._owner;
          }

          return existing;
        } else {
          deleteRemainingChildren(returnFiber, child);
          break;
        }
      } else {
        deleteChild(returnFiber, child);
      }

      child = child.sibling;
    }

    if (element.type === REACT_FRAGMENT_TYPE) {
      var created = createFiberFromFragment(element.props.children, returnFiber.mode, expirationTime, element.key);
      created.return = returnFiber;
      return created;
    } else {
      var _created4 = createFiberFromElement(element, returnFiber.mode, expirationTime);

      _created4.ref = coerceRef(returnFiber, currentFirstChild, element);
      _created4.return = returnFiber;
      return _created4;
    }
  }

  function reconcileSinglePortal(returnFiber, currentFirstChild, portal, expirationTime) {
    var key = portal.key;
    var child = currentFirstChild;

    while (child !== null) {
      // TODO: If key === null and child.key === null, then this only applies to
      // the first item in the list.
      if (child.key === key) {
        if (child.tag === HostPortal && child.stateNode.containerInfo === portal.containerInfo && child.stateNode.implementation === portal.implementation) {
          deleteRemainingChildren(returnFiber, child.sibling);
          var existing = useFiber(child, portal.children || [], expirationTime);
          existing.return = returnFiber;
          return existing;
        } else {
          deleteRemainingChildren(returnFiber, child);
          break;
        }
      } else {
        deleteChild(returnFiber, child);
      }

      child = child.sibling;
    }

    var created = createFiberFromPortal(portal, returnFiber.mode, expirationTime);
    created.return = returnFiber;
    return created;
  } // This API will tag the children with the side-effect of the reconciliation
  // itself. They will be added to the side-effect list as we pass through the
  // children and the parent.

  // virtul dom diff
  function reconcileChildFibers(returnFiber, currentFirstChild, newChild, expirationTime) {
    // This function is not recursive.
    // If the top level item is an array, we treat it as a set of children,
    // not as a fragment. Nested arrays on the other hand will be treated as
    // fragment nodes. Recursion happens at the normal flow.
    // Handle top level unkeyed fragments as if they were arrays.
    // This leads to an ambiguity between <>{[...]}</> and <>...</>.
    // We treat the ambiguous cases above the same.
    var isUnkeyedTopLevelFragment = typeof newChild === 'object' && newChild !== null && newChild.type === REACT_FRAGMENT_TYPE && newChild.key === null;

    if (isUnkeyedTopLevelFragment) {
      newChild = newChild.props.children;
    } // Handle object types


    var isObject = typeof newChild === 'object' && newChild !== null;

    if (isObject) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(reconcileSingleElement(returnFiber, currentFirstChild, newChild, expirationTime));

        case REACT_PORTAL_TYPE:
          return placeSingleChild(reconcileSinglePortal(returnFiber, currentFirstChild, newChild, expirationTime));
      }
    }

    if (typeof newChild === 'string' || typeof newChild === 'number') {
      return placeSingleChild(reconcileSingleTextNode(returnFiber, currentFirstChild, '' + newChild, expirationTime));
    }

    if (isArray(newChild)) {
      return reconcileChildrenArray(returnFiber, currentFirstChild, newChild, expirationTime);
    }

    if (getIteratorFn(newChild)) {
      return reconcileChildrenIterator(returnFiber, currentFirstChild, newChild, expirationTime);
    }

    if (isObject) {
      throwOnInvalidObjectType(returnFiber, newChild);
    }

    {
      if (typeof newChild === 'function') {
        warnOnFunctionType();
      }
    }

    if (typeof newChild === 'undefined' && !isUnkeyedTopLevelFragment) {
      // If the new child is undefined, and the return fiber is a composite
      // component, throw an error. If Fiber return types are disabled,
      // we already threw above.
      switch (returnFiber.tag) {
        case ClassComponent:
          {
            {
              var instance = returnFiber.stateNode;

              if (instance.render._isMockFunction) {
                // We allow auto-mocks to proceed as if they're returning null.
                break;
              }
            }
          }
        // Intentionally fall through to the next case, which handles both
        // functions and classes
        // eslint-disable-next-lined no-fallthrough

        case FunctionComponent:
          {
            var Component = returnFiber.type;

            (function () {
              {
                {
                  throw ReactError(Error((Component.displayName || Component.name || 'Component') + "(...): Nothing was returned from render. This usually means a return statement is missing. Or, to render nothing, return null."));
                }
              }
            })();
          }
      }
    } // Remaining cases are all treated as empty.


    return deleteRemainingChildren(returnFiber, currentFirstChild);
  }

  return reconcileChildFibers;
}

function forceUnmountCurrentAndReconcile(current$$1, workInProgress, nextChildren, renderExpirationTime) {
  // This function is fork of reconcileChildren. It's used in cases where we
  // want to reconcile without matching against the existing set. This has the
  // effect of all current children being unmounted; even if the type and key
  // are the same, the old child is unmounted and a new child is created.
  //
  // To do this, we're going to go through the reconcile algorithm twice. In
  // the first pass, we schedule a deletion for all the current children by
  // passing null.
  workInProgress.child = reconcileChildFibers(workInProgress, current$$1.child, null, renderExpirationTime); // In the second pass, we mount the new children. The trick here is that we
  // pass null in place of where we usually pass the current child set. This has
  // the effect of remounting all children regardless of whether their their
  // identity matches.

  workInProgress.child = reconcileChildFibers(workInProgress, null, nextChildren, renderExpirationTime);
}

function updateForwardRef(current$$1, workInProgress, Component, nextProps, renderExpirationTime) {
  // TODO: current can be non-null here even if the component
  // hasn't yet mounted. This happens after the first render suspends.
  // We'll need to figure out if this is fine or can cause issues.
  {
    if (workInProgress.type !== workInProgress.elementType) {
      // Lazy component props can't be validated in createElement
      // because they're only guaranteed to be resolved here.
      var innerPropTypes = Component.propTypes;

      if (innerPropTypes) {
        checkPropTypes(innerPropTypes, nextProps, // Resolved props
        'prop', getComponentName(Component), getCurrentFiberStackInDev);
      }
    }
  }

  var render = Component.render;
  var ref = workInProgress.ref; // The rest is a fork of updateFunctionComponent

  var nextChildren;
  prepareToReadContext(workInProgress, renderExpirationTime);

  {
    ReactCurrentOwner$3.current = workInProgress;
    setCurrentPhase('render');
    nextChildren = renderWithHooks(current$$1, workInProgress, render, nextProps, ref, renderExpirationTime);

    if (debugRenderPhaseSideEffects || debugRenderPhaseSideEffectsForStrictMode && workInProgress.mode & StrictMode) {
      // Only double-render components with Hooks
      if (workInProgress.memoizedState !== null) {
        nextChildren = renderWithHooks(current$$1, workInProgress, render, nextProps, ref, renderExpirationTime);
      }
    }

    setCurrentPhase(null);
  }

  if (current$$1 !== null && !didReceiveUpdate) {
    bailoutHooks(current$$1, workInProgress, renderExpirationTime);
    return bailoutOnAlreadyFinishedWork(current$$1, workInProgress, renderExpirationTime);
  } // React DevTools reads this flag.


  workInProgress.effectTag |= PerformedWork;
  reconcileChildren(current$$1, workInProgress, nextChildren, renderExpirationTime);
  return workInProgress.child;
}

function updateMemoComponent(current$$1, workInProgress, Component, nextProps, updateExpirationTime, renderExpirationTime) {
  if (current$$1 === null) {
    var type = Component.type;

    if (isSimpleFunctionComponent(type) && Component.compare === null && // SimpleMemoComponent codepath doesn't resolve outer props either.
    Component.defaultProps === undefined) {
      var resolvedType = type;

      {
        resolvedType = resolveFunctionForHotReloading(type);
      } // If this is a plain function component without default props,
      // and with only the default shallow comparison, we upgrade it
      // to a SimpleMemoComponent to allow fast path updates.


      workInProgress.tag = SimpleMemoComponent;
      workInProgress.type = resolvedType;

      {
        validateFunctionComponentInDev(workInProgress, type);
      }

      return updateSimpleMemoComponent(current$$1, workInProgress, resolvedType, nextProps, updateExpirationTime, renderExpirationTime);
    }

    {
      var innerPropTypes = type.propTypes;

      if (innerPropTypes) {
        // Inner memo component props aren't currently validated in createElement.
        // We could move it there, but we'd still need this for lazy code path.
        checkPropTypes(innerPropTypes, nextProps, // Resolved props
        'prop', getComponentName(type), getCurrentFiberStackInDev);
      }
    }

    var child = createFiberFromTypeAndProps(Component.type, null, nextProps, null, workInProgress.mode, renderExpirationTime);
    child.ref = workInProgress.ref;
    child.return = workInProgress;
    workInProgress.child = child;
    return child;
  }

  {
    var _type = Component.type;
    var _innerPropTypes = _type.propTypes;

    if (_innerPropTypes) {
      // Inner memo component props aren't currently validated in createElement.
      // We could move it there, but we'd still need this for lazy code path.
      checkPropTypes(_innerPropTypes, nextProps, // Resolved props
      'prop', getComponentName(_type), getCurrentFiberStackInDev);
    }
  }

  var currentChild = current$$1.child; // This is always exactly one child

  if (updateExpirationTime < renderExpirationTime) {
    // This will be the props with resolved defaultProps,
    // unlike current.memoizedProps which will be the unresolved ones.
    var prevProps = currentChild.memoizedProps; // Default to shallow comparison

    var compare = Component.compare;
    compare = compare !== null ? compare : shallowEqual;

    if (compare(prevProps, nextProps) && current$$1.ref === workInProgress.ref) {
      return bailoutOnAlreadyFinishedWork(current$$1, workInProgress, renderExpirationTime);
    }
  } // React DevTools reads this flag.


  workInProgress.effectTag |= PerformedWork;
  var newChild = createWorkInProgress(currentChild, nextProps, renderExpirationTime);
  newChild.ref = workInProgress.ref;
  newChild.return = workInProgress;
  workInProgress.child = newChild;
  return newChild;
}

function updateSimpleMemoComponent(current$$1, workInProgress, Component, nextProps, updateExpirationTime, renderExpirationTime) {
  // TODO: current can be non-null here even if the component
  // hasn't yet mounted. This happens when the inner render suspends.
  // We'll need to figure out if this is fine or can cause issues.
  {
    if (workInProgress.type !== workInProgress.elementType) {
      // Lazy component props can't be validated in createElement
      // because they're only guaranteed to be resolved here.
      var outerMemoType = workInProgress.elementType;

      if (outerMemoType.$$typeof === REACT_LAZY_TYPE) {
        // We warn when you define propTypes on lazy()
        // so let's just skip over it to find memo() outer wrapper.
        // Inner props for memo are validated later.
        outerMemoType = refineResolvedLazyComponent(outerMemoType);
      }

      var outerPropTypes = outerMemoType && outerMemoType.propTypes;

      if (outerPropTypes) {
        checkPropTypes(outerPropTypes, nextProps, // Resolved (SimpleMemoComponent has no defaultProps)
        'prop', getComponentName(outerMemoType), getCurrentFiberStackInDev);
      } // Inner propTypes will be validated in the function component path.

    }
  }

  if (current$$1 !== null) {
    var prevProps = current$$1.memoizedProps;

    if (shallowEqual(prevProps, nextProps) && current$$1.ref === workInProgress.ref && ( // Prevent bailout if the implementation changed due to hot reload:
    workInProgress.type === current$$1.type)) {
      didReceiveUpdate = false;

      if (updateExpirationTime < renderExpirationTime) {
        return bailoutOnAlreadyFinishedWork(current$$1, workInProgress, renderExpirationTime);
      }
    }
  }

  return updateFunctionComponent(current$$1, workInProgress, Component, nextProps, renderExpirationTime);
}

// shouldUpdate: true,调用组件的render，返回children，然后对children进行dom diff
function finishClassComponent(current$$1, workInProgress, Component, shouldUpdate, hasContext, renderExpirationTime) {
  // Refs should update even if shouldComponentUpdate returns false
  markRef(current$$1, workInProgress);
  var didCaptureError = (workInProgress.effectTag & DidCapture) !== NoEffect;

  if (!shouldUpdate && !didCaptureError) {
    // Context providers should defer to sCU for rendering
    if (hasContext) {
      invalidateContextProvider(workInProgress, Component, false);
    }

    return bailoutOnAlreadyFinishedWork(current$$1, workInProgress, renderExpirationTime);
  }

  var instance = workInProgress.stateNode; // Rerender

  ReactCurrentOwner$3.current = workInProgress;
  var nextChildren;

  if (didCaptureError && typeof Component.getDerivedStateFromError !== 'function') {
    // If we captured an error, but getDerivedStateFrom catch is not defined,
    // unmount all the children. componentDidCatch will schedule an update to
    // re-render a fallback. This is temporary until we migrate everyone to
    // the new API.
    // TODO: Warn in a future release.
    nextChildren = null;

    if (enableProfilerTimer) {
      stopProfilerTimerIfRunning(workInProgress);
    }
  } else {
    {
      setCurrentPhase('render');
      nextChildren = instance.render();

      if (debugRenderPhaseSideEffects || debugRenderPhaseSideEffectsForStrictMode && workInProgress.mode & StrictMode) {
        instance.render();
      }

      setCurrentPhase(null);
    }
  } // React DevTools reads this flag.


  workInProgress.effectTag |= PerformedWork;

  if (current$$1 !== null && didCaptureError) {
    // If we're recovering from an error, reconcile without reusing any of
    // the existing children. Conceptually, the normal children and the children
    // that are shown on error are two different sets, so we shouldn't reuse
    // normal children even if their identities match.
    forceUnmountCurrentAndReconcile(current$$1, workInProgress, nextChildren, renderExpirationTime);
  } else {
    // virtul dom diff
    reconcileChildren(current$$1, workInProgress, nextChildren, renderExpirationTime);
  } // Memoize state using the values we just used to render.
  // TODO: Restructure so we never read values from the instance.


  workInProgress.memoizedState = instance.state; // The context might have changed so we need to recalculate it.

  if (hasContext) {
    invalidateContextProvider(workInProgress, Component, true);
  }

  return workInProgress.child;
}


function updateClassComponent(current$$1, workInProgress, Component, nextProps, renderExpirationTime) {
  {
    if (workInProgress.type !== workInProgress.elementType) {
      // Lazy component props can't be validated in createElement
      // because they're only guaranteed to be resolved here.
      var innerPropTypes = Component.propTypes;

      if (innerPropTypes) {
        checkPropTypes(innerPropTypes, nextProps, // Resolved props
        'prop', getComponentName(Component), getCurrentFiberStackInDev);
      }
    }
  } // Push context providers early to prevent context stack mismatches.
  // During mounting we don't know the child context yet as the instance doesn't exist.
  // We will invalidate the child context in finishClassComponent() right after rendering.


  var hasContext;

  if (isContextProvider(Component)) {
    hasContext = true;
    pushContextProvider(workInProgress);
  } else {
    hasContext = false;
  }

  prepareToReadContext(workInProgress, renderExpirationTime);
  var instance = workInProgress.stateNode;
  var shouldUpdate;
  if (instance === null) {
    // 首次渲染
    if (current$$1 !== null) {
      current$$1.alternate = null;
      workInProgress.alternate = null; // Since this is conceptually a new fiber, schedule a Placement effect

      workInProgress.effectTag |= Placement;
    } // In the initial pass we might need to construct the instance.


    constructClassInstance(workInProgress, Component, nextProps, renderExpirationTime);
    mountClassInstance(workInProgress, Component, nextProps, renderExpirationTime);
    shouldUpdate = true;
  } else if (current$$1 === null) { // 工作恢复继续
    // In a resume, we'll already have an instance we can reuse.
    shouldUpdate = resumeMountClassInstance(workInProgress, Component, nextProps, renderExpirationTime);
  } else { // 更新
    shouldUpdate = updateClassInstance(current$$1, workInProgress, Component, nextProps, renderExpirationTime);
  }

  // 下一个待执行任务
  var nextUnitOfWork = finishClassComponent(current$$1, workInProgress, Component, shouldUpdate, hasContext, renderExpirationTime);
  return nextUnitOfWork;
}


function updateFragment(current$$1, workInProgress, renderExpirationTime) {
  var nextChildren = workInProgress.pendingProps;
  reconcileChildren(current$$1, workInProgress, nextChildren, renderExpirationTime);
  return workInProgress.child;
}

function updateMode(current$$1, workInProgress, renderExpirationTime) {
  var nextChildren = workInProgress.pendingProps.children;
  reconcileChildren(current$$1, workInProgress, nextChildren, renderExpirationTime);
  return workInProgress.child;
}

function updateProfiler(current$$1, workInProgress, renderExpirationTime) {
  if (enableProfilerTimer) {
    workInProgress.effectTag |= Update;
  }

  var nextProps = workInProgress.pendingProps;
  var nextChildren = nextProps.children;
  reconcileChildren(current$$1, workInProgress, nextChildren, renderExpirationTime);
  return workInProgress.child;
}

function markRef(current$$1, workInProgress) {
  var ref = workInProgress.ref;

  if (current$$1 === null && ref !== null || current$$1 !== null && current$$1.ref !== ref) {
    // Schedule a Ref effect
    workInProgress.effectTag |= Ref;
  }
}

function updateFunctionComponent(current$$1, workInProgress, Component, nextProps, renderExpirationTime) {
  {
    if (workInProgress.type !== workInProgress.elementType) {
      // Lazy component props can't be validated in createElement
      // because they're only guaranteed to be resolved here.
      var innerPropTypes = Component.propTypes;

      if (innerPropTypes) {
        checkPropTypes(innerPropTypes, nextProps, // Resolved props
        'prop', getComponentName(Component), getCurrentFiberStackInDev);
      }
    }
  }

  var context;

  if (!disableLegacyContext) {
    var unmaskedContext = getUnmaskedContext(workInProgress, Component, true);
    context = getMaskedContext(workInProgress, unmaskedContext);
  }

  var nextChildren;
  prepareToReadContext(workInProgress, renderExpirationTime);

  {
    ReactCurrentOwner$3.current = workInProgress;
    setCurrentPhase('render');
    nextChildren = renderWithHooks(current$$1, workInProgress, Component, nextProps, context, renderExpirationTime);

    if (debugRenderPhaseSideEffects || debugRenderPhaseSideEffectsForStrictMode && workInProgress.mode & StrictMode) {
      // Only double-render components with Hooks
      if (workInProgress.memoizedState !== null) {
        nextChildren = renderWithHooks(current$$1, workInProgress, Component, nextProps, context, renderExpirationTime);
      }
    }

    setCurrentPhase(null);
  }

  if (current$$1 !== null && !didReceiveUpdate) {
    bailoutHooks(current$$1, workInProgress, renderExpirationTime);
    return bailoutOnAlreadyFinishedWork(current$$1, workInProgress, renderExpirationTime);
  } // React DevTools reads this flag.


  workInProgress.effectTag |= PerformedWork;
  reconcileChildren(current$$1, workInProgress, nextChildren, renderExpirationTime);
  return workInProgress.child;
}
// virtul dom diff
function reconcileChildren(current$$1, workInProgress, nextChildren, renderExpirationTime) {
  if (current$$1 === null) {
    // If this is a fresh new component that hasn't been rendered yet, we
    // won't update its child set by applying minimal side-effects. Instead,
    // we will add them all to the child before it gets rendered. That means
    // we can optimize this reconciliation pass by not tracking side-effects.
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren, renderExpirationTime);
  } else {
    // If the current child is the same as the work in progress, it means that
    // we haven't yet started any work on these children. Therefore, we use
    // the clone algorithm to create a copy of all the current children.
    // If we had any progressed work already, that is invalid at this point so
    // let's throw it out.
    workInProgress.child = reconcileChildFibers(workInProgress, current$$1.child, nextChildren, renderExpirationTime);
  }
}

function updateHostRoot(current$$1, workInProgress, renderExpirationTime) {
  pushHostRootContext(workInProgress);
  var updateQueue = workInProgress.updateQueue;

  (function () {
    if (!(updateQueue !== null)) {
      {
        throw ReactError(Error("If the root does not have an updateQueue, we should have already bailed out. This error is likely caused by a bug in React. Please file an issue."));
      }
    }
  })();

  var nextProps = workInProgress.pendingProps;
  var prevState = workInProgress.memoizedState;
  var prevChildren = prevState !== null ? prevState.element : null;
  processUpdateQueue(workInProgress, updateQueue, nextProps, null, renderExpirationTime);
  var nextState = workInProgress.memoizedState; // Caution: React DevTools currently depends on this property
  // being called "element".

  var nextChildren = nextState.element;

  if (nextChildren === prevChildren) {
    // If the state is the same as before, that's a bailout because we had
    // no work that expires at this time.
    resetHydrationState();
    return bailoutOnAlreadyFinishedWork(current$$1, workInProgress, renderExpirationTime);
  }

  var root = workInProgress.stateNode;

  if (root.hydrate && enterHydrationState(workInProgress)) {
    // If we don't have any current children this might be the first pass.
    // We always try to hydrate. If this isn't a hydration pass there won't
    // be any children to hydrate which is effectively the same thing as
    // not hydrating.
    var child = mountChildFibers(workInProgress, null, nextChildren, renderExpirationTime);
    workInProgress.child = child;
    var node = child;

    while (node) {
      // Mark each child as hydrating. This is a fast path to know whether this
      // tree is part of a hydrating tree. This is used to determine if a child
      // node has fully mounted yet, and for scheduling event replaying.
      // Conceptually this is similar to Placement in that a new subtree is
      // inserted into the React tree here. It just happens to not need DOM
      // mutations because it already exists.
      node.effectTag = node.effectTag & ~Placement | Hydrating;
      node = node.sibling;
    }
  } else {
    // Otherwise reset hydration state in case we aborted and resumed another
    // root.
    reconcileChildren(current$$1, workInProgress, nextChildren, renderExpirationTime);
    resetHydrationState();
  }

  return workInProgress.child;
}

function updateHostComponent(current$$1, workInProgress, renderExpirationTime) {
  pushHostContext(workInProgress);

  if (current$$1 === null) {
    tryToClaimNextHydratableInstance(workInProgress);
  }

  var type = workInProgress.type;
  var nextProps = workInProgress.pendingProps;
  var prevProps = current$$1 !== null ? current$$1.memoizedProps : null;
  var nextChildren = nextProps.children;
  var isDirectTextChild = shouldSetTextContent(type, nextProps);

  if (isDirectTextChild) {
    // We special case a direct text child of a host node. This is a common
    // case. We won't handle it as a reified child. We will instead handle
    // this in the host environment that also have access to this prop. That
    // avoids allocating another HostText fiber and traversing it.
    nextChildren = null;
  } else if (prevProps !== null && shouldSetTextContent(type, prevProps)) {
    // If we're switching from a direct text child to a normal child, or to
    // empty, we need to schedule the text content to be reset.
    workInProgress.effectTag |= ContentReset;
  }

  markRef(current$$1, workInProgress); // Check the host config to see if the children are offscreen/hidden.

  if (workInProgress.mode & ConcurrentMode && renderExpirationTime !== Never && shouldDeprioritizeSubtree(type, nextProps)) {
    if (enableSchedulerTracing) {
      markSpawnedWork(Never);
    } // Schedule this fiber to re-render at offscreen priority. Then bailout.


    workInProgress.expirationTime = workInProgress.childExpirationTime = Never;
    return null;
  }

  reconcileChildren(current$$1, workInProgress, nextChildren, renderExpirationTime);
  return workInProgress.child;
}

function updateHostText(current$$1, workInProgress) {
  if (current$$1 === null) {
    tryToClaimNextHydratableInstance(workInProgress);
  } // Nothing to do here. This is terminal. We'll do the completion step
  // immediately after.


  return null;
}

function mountLazyComponent(_current, workInProgress, elementType, updateExpirationTime, renderExpirationTime) {
  if (_current !== null) {
    // An lazy component only mounts if it suspended inside a non-
    // concurrent tree, in an inconsistent state. We want to treat it like
    // a new mount, even though an empty version of it already committed.
    // Disconnect the alternate pointers.
    _current.alternate = null;
    workInProgress.alternate = null; // Since this is conceptually a new fiber, schedule a Placement effect

    workInProgress.effectTag |= Placement;
  }

  var props = workInProgress.pendingProps; // We can't start a User Timing measurement with correct label yet.
  // Cancel and resume right after we know the tag.

  cancelWorkTimer(workInProgress);
  var Component = readLazyComponentType(elementType); // Store the unwrapped component in the type.

  workInProgress.type = Component;
  var resolvedTag = workInProgress.tag = resolveLazyComponentTag(Component);
  startWorkTimer(workInProgress);
  var resolvedProps = resolveDefaultProps(Component, props);
  var child;

  switch (resolvedTag) {
    case FunctionComponent:
      {
        {
          validateFunctionComponentInDev(workInProgress, Component);
          workInProgress.type = Component = resolveFunctionForHotReloading(Component);
        }

        child = updateFunctionComponent(null, workInProgress, Component, resolvedProps, renderExpirationTime);
        break;
      }

    case ClassComponent:
      {
        {
          workInProgress.type = Component = resolveClassForHotReloading(Component);
        }

        child = updateClassComponent(null, workInProgress, Component, resolvedProps, renderExpirationTime);
        break;
      }

    case ForwardRef:
      {
        {
          workInProgress.type = Component = resolveForwardRefForHotReloading(Component);
        }

        child = updateForwardRef(null, workInProgress, Component, resolvedProps, renderExpirationTime);
        break;
      }

    case MemoComponent:
      {
        {
          if (workInProgress.type !== workInProgress.elementType) {
            var outerPropTypes = Component.propTypes;

            if (outerPropTypes) {
              checkPropTypes(outerPropTypes, resolvedProps, // Resolved for outer only
              'prop', getComponentName(Component), getCurrentFiberStackInDev);
            }
          }
        }

        child = updateMemoComponent(null, workInProgress, Component, resolveDefaultProps(Component.type, resolvedProps), // The inner type can have defaults too
        updateExpirationTime, renderExpirationTime);
        break;
      }

    default:
      {
        var hint = '';

        {
          if (Component !== null && typeof Component === 'object' && Component.$$typeof === REACT_LAZY_TYPE) {
            hint = ' Did you wrap a component in React.lazy() more than once?';
          }
        } // This message intentionally doesn't mention ForwardRef or MemoComponent
        // because the fact that it's a separate type of work is an
        // implementation detail.


        (function () {
          {
            {
              throw ReactError(Error("Element type is invalid. Received a promise that resolves to: " + Component + ". Lazy element type must resolve to a class or function." + hint));
            }
          }
        })();
      }
  }

  return child;
}

function mountIncompleteClassComponent(_current, workInProgress, Component, nextProps, renderExpirationTime) {
  if (_current !== null) {
    // An incomplete component only mounts if it suspended inside a non-
    // concurrent tree, in an inconsistent state. We want to treat it like
    // a new mount, even though an empty version of it already committed.
    // Disconnect the alternate pointers.
    _current.alternate = null;
    workInProgress.alternate = null; // Since this is conceptually a new fiber, schedule a Placement effect

    workInProgress.effectTag |= Placement;
  } // Promote the fiber to a class and try rendering again.


  workInProgress.tag = ClassComponent; // The rest of this function is a fork of `updateClassComponent`
  // Push context providers early to prevent context stack mismatches.
  // During mounting we don't know the child context yet as the instance doesn't exist.
  // We will invalidate the child context in finishClassComponent() right after rendering.

  var hasContext;

  if (isContextProvider(Component)) {
    hasContext = true;
    pushContextProvider(workInProgress);
  } else {
    hasContext = false;
  }

  prepareToReadContext(workInProgress, renderExpirationTime);
  constructClassInstance(workInProgress, Component, nextProps, renderExpirationTime);
  mountClassInstance(workInProgress, Component, nextProps, renderExpirationTime);
  return finishClassComponent(null, workInProgress, Component, true, hasContext, renderExpirationTime);
}

function applyDerivedStateFromProps(workInProgress, ctor, getDerivedStateFromProps, nextProps) {
  var prevState = workInProgress.memoizedState;

  // {
  //   if (debugRenderPhaseSideEffects || debugRenderPhaseSideEffectsForStrictMode && workInProgress.mode & StrictMode) {
  //     // Invoke the function an extra time to help detect side-effects.
  //     getDerivedStateFromProps(nextProps, prevState);
  //   }
  // }

  // 获取改变的state
  var partialState = getDerivedStateFromProps(nextProps, prevState);
  // {
  //   warnOnUndefinedDerivedState(ctor, partialState);
  // } // Merge the partial state and the previous state.
  var memoizedState = partialState === null || partialState === undefined ? prevState : _assign({}, prevState, partialState);
  // 一旦更新队列为空，将派生状态保留在基础状态当中
  workInProgress.memoizedState = memoizedState; // Once the update queue is empty, persist the derived state onto the
  // base state.

  var updateQueue = workInProgress.updateQueue;

  if (updateQueue !== null && workInProgress.expirationTime === NoWork) {
    updateQueue.baseState = memoizedState;
  }
}

function mountIndeterminateComponent(_current, workInProgress, Component, renderExpirationTime) {
  if (_current !== null) {
    // An indeterminate component only mounts if it suspended inside a non-
    // concurrent tree, in an inconsistent state. We want to treat it like
    // a new mount, even though an empty version of it already committed.
    // Disconnect the alternate pointers.
    _current.alternate = null;
    workInProgress.alternate = null; // Since this is conceptually a new fiber, schedule a Placement effect

    workInProgress.effectTag |= Placement;
  }

  var props = workInProgress.pendingProps;
  var context;

  if (!disableLegacyContext) {
    var unmaskedContext = getUnmaskedContext(workInProgress, Component, false);
    context = getMaskedContext(workInProgress, unmaskedContext);
  }

  prepareToReadContext(workInProgress, renderExpirationTime);
  var value;

  // {
  //   if (Component.prototype && typeof Component.prototype.render === 'function') {
  //     var componentName = getComponentName(Component) || 'Unknown';

  //     if (!didWarnAboutBadClass[componentName]) {
  //       warningWithoutStack$1(false, "The <%s /> component appears to have a render method, but doesn't extend React.Component. " + 'This is likely to cause errors. Change %s to extend React.Component instead.', componentName, componentName);
  //       didWarnAboutBadClass[componentName] = true;
  //     }
  //   }

  //   if (workInProgress.mode & StrictMode) {
  //     ReactStrictModeWarnings.recordLegacyContextWarning(workInProgress, null);
  //   }

  //   ReactCurrentOwner$3.current = workInProgress;
  //   value = renderWithHooks(null, workInProgress, Component, props, context, renderExpirationTime);
  // } // React DevTools reads this flag.


  workInProgress.effectTag |= PerformedWork;

  if (typeof value === 'object' && value !== null && typeof value.render === 'function' && value.$$typeof === undefined) {
    {
      var _componentName = getComponentName(Component) || 'Unknown';

      if (!didWarnAboutModulePatternComponent[_componentName]) {
        warningWithoutStack$1(false, 'The <%s /> component appears to be a function component that returns a class instance. ' + 'Change %s to a class that extends React.Component instead. ' + "If you can't use a class try assigning the prototype on the function as a workaround. " + "`%s.prototype = React.Component.prototype`. Don't use an arrow function since it " + 'cannot be called with `new` by React.', _componentName, _componentName, _componentName);
        didWarnAboutModulePatternComponent[_componentName] = true;
      }
    } // Proceed under the assumption that this is a class instance


    workInProgress.tag = ClassComponent; // Throw out any hooks that were used.

    resetHooks(); // Push context providers early to prevent context stack mismatches.
    // During mounting we don't know the child context yet as the instance doesn't exist.
    // We will invalidate the child context in finishClassComponent() right after rendering.

    var hasContext = false;

    if (isContextProvider(Component)) {
      hasContext = true;
      pushContextProvider(workInProgress);
    } else {
      hasContext = false;
    }

    workInProgress.memoizedState = value.state !== null && value.state !== undefined ? value.state : null;
    var getDerivedStateFromProps = Component.getDerivedStateFromProps;

    if (typeof getDerivedStateFromProps === 'function') {
      applyDerivedStateFromProps(workInProgress, Component, getDerivedStateFromProps, props);
    }

    adoptClassInstance(workInProgress, value);
    mountClassInstance(workInProgress, Component, props, renderExpirationTime);
    return finishClassComponent(null, workInProgress, Component, true, hasContext, renderExpirationTime);
  } else {
    // Proceed under the assumption that this is a function component
    workInProgress.tag = FunctionComponent;

    {
      if (disableLegacyContext && Component.contextTypes) {
        warningWithoutStack$1(false, '%s uses the legacy contextTypes API which is no longer supported. ' + 'Use React.createContext() with React.useContext() instead.', getComponentName(Component) || 'Unknown');
      }

      if (debugRenderPhaseSideEffects || debugRenderPhaseSideEffectsForStrictMode && workInProgress.mode & StrictMode) {
        // Only double-render components with Hooks
        if (workInProgress.memoizedState !== null) {
          value = renderWithHooks(null, workInProgress, Component, props, context, renderExpirationTime);
        }
      }
    }

    reconcileChildren(null, workInProgress, value, renderExpirationTime);

    // {
    //   validateFunctionComponentInDev(workInProgress, Component);
    // }

    return workInProgress.child;
  }
}