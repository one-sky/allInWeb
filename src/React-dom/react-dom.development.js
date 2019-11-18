/** @license React v16.11.0
 * setState: enqueueSetState -> enqueueUpdate -> scheduleWork (scheduleUpdateOnFiber)->
 * 同步   1. performSyncWorkOnRoot -> workLoopSync -> performUnitOfWork -> beginWork$$1 -> assignFiberPropertiesInDEV
 * 异步   2. schedulePendingInteractions -> workLoopSync -> performUnitOfWork -> beginWork$$1 -> assignFiberPropertiesInDEV
 */
"use strict";

// 非production环境下
if (process.env.NODE_ENV !== "production") {
  (function() {
    const React = require("react");
    const _assign = require("object-assign");
    const Scheduler = require("scheduler");
    const checkPropTypes = require("prop-types/checkPropTypes");
    const tracing = require("scheduler/tracing");

    /**
     * HTML nodeType values that represent the type of the node
     */
    const ELEMENT_NODE = 1;
    const TEXT_NODE = 3;
    const COMMENT_NODE = 8;
    const DOCUMENT_NODE = 9;
    const DOCUMENT_FRAGMENT_NODE = 11;

    let LegacyRoot = 0;
    let BatchedRoot = 1;
    let ConcurrentRoot = 2;

    var enableSchedulerTracing = true; // Only used in www builds.

    function requestCurrentTime() {
      if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
        // We're inside React, so it's fine to read the actual time.
        return msToExpirationTime(now());
      } // We're not inside React, so we may be in the middle of a browser event.

      if (currentEventTime !== NoWork) {
        // Use the same start time for all updates until we enter React again.
        return currentEventTime;
      } // This is the first update since React yielded. Compute a new start time.

      currentEventTime = msToExpirationTime(now());
      return currentEventTime;
    }
    const warningWithoutStack = function(condition, format) {
      for (
        var _len = arguments.length,
          args = new Array(_len > 2 ? _len - 2 : 0),
          _key = 2;
        _key < _len;
        _key++
      ) {
        args[_key - 2] = arguments[_key];
      }

      if (format === undefined) {
        throw new Error(
          "`warningWithoutStack(condition, format, ...args)` requires a warning " +
            "message argument"
        );
      }

      if (args.length > 8) {
        // Check before the condition to catch violations early.
        throw new Error(
          "warningWithoutStack() currently supports at most 8 arguments."
        );
      }

      if (condition) {
        return;
      }

      if (typeof console !== "undefined") {
        var argsWithFormat = args.map(function(item) {
          return "" + item;
        });
        argsWithFormat.unshift("Warning: " + format); // We intentionally don't use spread (or .apply) directly because it
        // breaks IE9: https://github.com/facebook/react/issues/13610

        Function.prototype.apply.call(console.error, console, argsWithFormat);
      }

      try {
        // --- Welcome to debugging React ---
        // This error was thrown as a convenience so that you can use this stack
        // to find the callsite that caused this warning to fire.
        var argIndex = 0;
        var message =
          "Warning: " +
          format.replace(/%s/g, function() {
            return args[argIndex++];
          });
        throw new Error(message);
      } catch (x) {}
    };

    // 校验node节点是否符合DOM element
    function isValidContainer(node) {
      return !!(
        node &&
        (node.nodeType === ELEMENT_NODE ||
          node.nodeType === DOCUMENT_NODE ||
          node.nodeType === DOCUMENT_FRAGMENT_NODE ||
          (node.nodeType === COMMENT_NODE &&
            node.nodeValue === " react-mount-point-unstable "))
      );
    }

    const topLevelUpdateWarnings = function(container) {
      if (
        container._reactRootContainer &&
        container.nodeType !== COMMENT_NODE
      ) {
        var hostInstance = findHostInstanceWithNoPortals(
          container._reactRootContainer._internalRoot.current
        );

        if (hostInstance) {
          !(hostInstance.parentNode === container)
            ? warningWithoutStack$1(
                false,
                "render(...): It looks like the React-rendered content of this " +
                  "container was removed without using React. This is not " +
                  "supported and will cause errors. Instead, call " +
                  "ReactDOM.unmountComponentAtNode to empty a container."
              )
            : void 0;
        }
      }

      var isRootRenderedBySomeReact = !!container._reactRootContainer;
      var rootEl = getReactRootElementInContainer(container);
      var hasNonRootReactChild = !!(rootEl && getInstanceFromNode$1(rootEl));
      !(!hasNonRootReactChild || isRootRenderedBySomeReact)
        ? warningWithoutStack$1(
            false,
            "render(...): Replacing React-rendered children with a new root " +
              "component. If you intended to update the children of this node, " +
              "you should instead have the existing children update their state " +
              "and render the new components instead of calling ReactDOM.render."
          )
        : void 0;
      !(
        container.nodeType !== ELEMENT_NODE ||
        !container.tagName ||
        container.tagName.toUpperCase() !== "BODY"
      )
        ? warningWithoutStack$1(
            false,
            "render(): Rendering components directly into document.body is " +
              "discouraged, since its children are often manipulated by third-party " +
              "scripts and browser extensions. This may lead to subtle " +
              "reconciliation issues. Try rendering into a container element created " +
              "for your app."
          )
        : void 0;
    };

    function getReactRootElementInContainer(container) {
      if (!container) {
        return null;
      }

      if (container.nodeType === DOCUMENT_NODE) {
        return container.documentElement;
      } else {
        return container.firstChild;
      }
    }

    function shouldHydrateDueToLegacyHeuristic(container) {
      const rootElement = getReactRootElementInContainer(container);
      return !!(
        rootElement &&
        rootElement.nodeType === ELEMENT_NODE &&
        rootElement.hasAttribute(ROOT_ATTRIBUTE_NAME)
      );
    }

    function FiberRootNode(containerInfo, tag, hydrate) {
      this.tag = tag;
      this.current = null;
      this.containerInfo = containerInfo;
      this.pendingChildren = null;
      this.pingCache = null;
      this.finishedExpirationTime = NoWork;
      this.finishedWork = null;
      this.timeoutHandle = noTimeout;
      this.context = null;
      this.pendingContext = null;
      this.hydrate = hydrate;
      this.firstBatch = null;
      this.callbackNode = null;
      this.callbackPriority = NoPriority;
      this.firstPendingTime = NoWork;
      this.firstSuspendedTime = NoWork;
      this.lastSuspendedTime = NoWork;
      this.nextKnownPendingLevel = NoWork;
      this.lastPingedTime = NoWork;
      this.lastExpiredTime = NoWork;

      if (enableSchedulerTracing) {
        this.interactionThreadID = tracing.unstable_getThreadID();
        this.memoizedInteractions = new Set();
        this.pendingInteractionMap = new Map();
      }

      if (enableSuspenseCallback) {
        this.hydrationCallbacks = null;
      }
    }

    function createHostRootFiber(tag) {
      let mode;

      if (tag === ConcurrentRoot) {
        mode = ConcurrentMode | BatchedMode | StrictMode;
      } else if (tag === BatchedRoot) {
        mode = BatchedMode | StrictMode;
      } else {
        mode = NoMode;
      }

      if (enableProfilerTimer && isDevToolsPresent) {
        // Always collect profile timings when DevTools are present.
        // This enables DevTools to start capturing timing at any point–
        // Without some nodes in the tree having empty base times.
        mode |= ProfileMode;
      }

      return createFiber(HostRoot, null, null, mode);
    }

    function createFiberRoot(containerInfo, tag, hydrate, hydrationCallbacks) {
      var root = new FiberRootNode(containerInfo, tag, hydrate);

      if (enableSuspenseCallback) {
        root.hydrationCallbacks = hydrationCallbacks;
      } // Cyclic construction. This cheats the type system right now because
      // stateNode is any.
      // 创建hostroot
      var uninitializedFiber = createHostRootFiber(tag);
      root.current = uninitializedFiber;
      uninitializedFiber.stateNode = root;
      return root;
    }

    function createContainer(containerInfo, tag, hydrate, hydrationCallbacks) {
      return createFiberRoot(containerInfo, tag, hydrate, hydrationCallbacks);
    }

    function updateContainer(element, container, parentComponent, callback) {
      var current$$1 = container.current;
      var currentTime = requestCurrentTime();
      // // $FlowExpectedError - jest isn't a global, and isn't recognized outside of tests
      // if ("undefined" !== typeof jest) {
      //   warnIfUnmockedScheduler(current$$1);
      //   warnIfNotScopedWithMatchingAct(current$$1);
      // }
      var suspenseConfig = requestCurrentSuspenseConfig();
      var expirationTime = computeExpirationForFiber(
        currentTime,
        current$$1,
        suspenseConfig
      );
      return updateContainerAtExpirationTime(
        element,
        container,
        parentComponent,
        expirationTime,
        suspenseConfig,
        callback
      );
    }

    function createRootImpl(container, tag, options) {
      // Tag is either LegacyRoot or Concurrent Root
      var hydrate = options != null && options.hydrate === true;
      var hydrationCallbacks =
        (options != null && options.hydrationOptions) || null;
      var root = createContainer(container, tag, hydrate, hydrationCallbacks);
      markContainerAsRoot(root.current, container);

      if (hydrate && tag !== LegacyRoot) {
        var doc =
          container.nodeType === DOCUMENT_NODE
            ? container
            : container.ownerDocument;
        eagerlyTrapReplayableEvents(doc);
      }

      return root;
    }

    function ReactSyncRoot(container, tag, options) {
      this._internalRoot = createRootImpl(container, tag, options);
    }

    ReactSyncRoot.prototype.render = function(children, callback) {
      var root = this._internalRoot;
      var work = new ReactWork();
      callback = callback === undefined ? null : callback;

      {
        warnOnInvalidCallback(callback, "render");
      }

      if (callback !== null) {
        work.then(callback);
      }

      updateContainer(children, root, null, work._onCommit);
      return work;
    };

    // 清除container的子元素
    // 创建ReactRoot对象
    function legacyCreateRootFromDOMContainer(container, forceHydrate) {
      // 第一次 shouldHydrateDueToLegacyHeuristic 返回false
      const shouldHydrate =
        forceHydrate || shouldHydrateDueToLegacyHeuristic(container); // First clear any existing content.

      // 第一次渲染，删除其余的所有节点
      if (!shouldHydrate) {
        var warned = false;
        var rootSibling;

        // 移除container的子元素
        while ((rootSibling = container.lastChild)) {
          {
            if (
              !warned &&
              rootSibling.nodeType === ELEMENT_NODE &&
              rootSibling.hasAttribute(ROOT_ATTRIBUTE_NAME)
            ) {
              warned = true;
              warningWithoutStack$1(
                false,
                "render(): Target node has markup rendered by React, but there " +
                  "are unrelated nodes as well. This is most commonly caused by " +
                  "white-space inserted around server-rendered markup."
              );
            }
          }

          container.removeChild(rootSibling);
        }
      }

      if (shouldHydrate && !forceHydrate && !warnedAboutHydrateAPI) {
        warnedAboutHydrateAPI = true;
        lowPriorityWarningWithoutStack$1(
          false,
          "render(): Calling ReactDOM.render() to hydrate server-rendered markup " +
            "will stop working in React v17. Replace the ReactDOM.render() call " +
            "with ReactDOM.hydrate() if you want React to attach to the server HTML."
        );
      }

      // 获取根节点对象
      return new ReactSyncRoot(
        container,
        LegacyRoot,
        shouldHydrate
          ? {
              hydrate: true
            }
          : undefined
      );
    }

    function legacyRenderSubtreeIntoContainer(
      parentComponent,
      children,
      container,
      forceHydrate, // 渲染标记 render时false
      callback
    ) {
      topLevelUpdateWarnings(container);
      warnOnInvalidCallback(callback === undefined ? null : callback, "render");

      var root = container._reactRootContainer;
      var fiberRoot;

      if (!root) {
        // 初始化挂载，获得React根容器对象
        root = container._reactRootContainer = legacyCreateRootFromDOMContainer(
          container,
          forceHydrate
        );
        fiberRoot = root._internalRoot;

        if (typeof callback === "function") {
          var originalCallback = callback;

          callback = function() {
            var instance = getPublicRootInstance(fiberRoot);
            originalCallback.call(instance);
          };
        } // Initial mount should not be batched.

        unbatchedUpdates(function() {
          updateContainer(children, fiberRoot, parentComponent, callback);
        });
      } else {
        fiberRoot = root._internalRoot;

        if (typeof callback === "function") {
          var _originalCallback = callback;

          callback = function() {
            var instance = getPublicRootInstance(fiberRoot);

            _originalCallback.call(instance);
          };
        } // Update

        updateContainer(children, fiberRoot, parentComponent, callback);
      }

      // 获取container的元素
      return getPublicRootInstance(fiberRoot);
    }

    const ReactDOM = {
      createPortal: createPortal$$1,
      findDOMNode: function(componentOrElement) {
        {
          var owner = ReactCurrentOwner.current;

          if (owner !== null && owner.stateNode !== null) {
            var warnedAboutRefsInRender =
              owner.stateNode._warnedAboutRefsInRender;
            !warnedAboutRefsInRender
              ? warningWithoutStack$1(
                  false,
                  "%s is accessing findDOMNode inside its render(). " +
                    "render() should be a pure function of props and state. It should " +
                    "never access something that requires stale data from the previous " +
                    "render, such as refs. Move this logic to componentDidMount and " +
                    "componentDidUpdate instead.",
                  getComponentName(owner.type) || "A component"
                )
              : void 0;
            owner.stateNode._warnedAboutRefsInRender = true;
          }
        }

        if (componentOrElement == null) {
          return null;
        }

        if (componentOrElement.nodeType === ELEMENT_NODE) {
          return componentOrElement;
        }

        {
          return findHostInstanceWithWarning(componentOrElement, "findDOMNode");
        }

        return findHostInstance(componentOrElement);
      },
      hydrate: function(element, container, callback) {
        (function() {
          if (!isValidContainer(container)) {
            {
              throw ReactError(Error("Target container is not a DOM element."));
            }
          }
        })();

        {
          !!container._reactHasBeenPassedToCreateRootDEV
            ? warningWithoutStack$1(
                false,
                "You are calling ReactDOM.hydrate() on a container that was previously " +
                  "passed to ReactDOM.%s(). This is not supported. " +
                  "Did you mean to call createRoot(container, {hydrate: true}).render(element)?",
                enableStableConcurrentModeAPIs
                  ? "createRoot"
                  : "unstable_createRoot"
              )
            : void 0;
        } // TODO: throw or warn if we couldn't hydrate?

        return legacyRenderSubtreeIntoContainer(
          null,
          element,
          container,
          true,
          callback
        );
      },
      render: function(element, container, callback) {
        (function() {
          if (!isValidContainer(container)) {
            {
              throw ReactError(Error("Target container is not a DOM element."));
            }
          }
        })();

        !!container._reactHasBeenPassedToCreateRootDEV
          ? warningWithoutStack(
              false,
              "You are calling ReactDOM.render() on a container that was previously " +
                "passed to ReactDOM.%s(). This is not supported. " +
                "Did you mean to call root.render(element)?",
              enableStableConcurrentModeAPIs
                ? "createRoot"
                : "unstable_createRoot"
            )
          : void 0;

        // 核心
        return legacyRenderSubtreeIntoContainer(
          null,
          element,
          container,
          false,
          callback
        );
      },
      unstable_renderSubtreeIntoContainer: function(
        parentComponent,
        element,
        containerNode,
        callback
      ) {
        (function() {
          if (!isValidContainer(containerNode)) {
            {
              throw ReactError(Error("Target container is not a DOM element."));
            }
          }
        })();

        (function() {
          if (!(parentComponent != null && has(parentComponent))) {
            {
              throw ReactError(
                Error("parentComponent must be a valid React Component")
              );
            }
          }
        })();

        return legacyRenderSubtreeIntoContainer(
          parentComponent,
          element,
          containerNode,
          false,
          callback
        );
      },
      unmountComponentAtNode: function(container) {
        (function() {
          if (!isValidContainer(container)) {
            {
              throw ReactError(
                Error(
                  "unmountComponentAtNode(...): Target container is not a DOM element."
                )
              );
            }
          }
        })();

        {
          !!container._reactHasBeenPassedToCreateRootDEV
            ? warningWithoutStack$1(
                false,
                "You are calling ReactDOM.unmountComponentAtNode() on a container that was previously " +
                  "passed to ReactDOM.%s(). This is not supported. Did you mean to call root.unmount()?",
                enableStableConcurrentModeAPIs
                  ? "createRoot"
                  : "unstable_createRoot"
              )
            : void 0;
        }

        if (container._reactRootContainer) {
          {
            var rootEl = getReactRootElementInContainer(container);
            var renderedByDifferentReact =
              rootEl && !getInstanceFromNode$1(rootEl);
            !!renderedByDifferentReact
              ? warningWithoutStack$1(
                  false,
                  "unmountComponentAtNode(): The node you're attempting to unmount " +
                    "was rendered by another copy of React."
                )
              : void 0;
          } // Unmount should not be batched.

          unbatchedUpdates(function() {
            legacyRenderSubtreeIntoContainer(
              null,
              null,
              container,
              false,
              function() {
                container._reactRootContainer = null;
              }
            );
          }); // If you call unmountComponentAtNode twice in quick succession, you'll
          // get `true` twice. That's probably fine?

          return true;
        } else {
          {
            var _rootEl = getReactRootElementInContainer(container);

            var hasNonRootReactChild = !!(
              _rootEl && getInstanceFromNode$1(_rootEl)
            ); // Check if the container itself is a React root node.

            var isContainerReactRoot =
              container.nodeType === ELEMENT_NODE &&
              isValidContainer(container.parentNode) &&
              !!container.parentNode._reactRootContainer;
            !!hasNonRootReactChild
              ? warningWithoutStack$1(
                  false,
                  "unmountComponentAtNode(): The node you're attempting to unmount " +
                    "was rendered by React and is not a top-level container. %s",
                  isContainerReactRoot
                    ? "You may have accidentally passed in a React root node instead " +
                        "of its container."
                    : "Instead, have the parent component update its state and " +
                        "rerender in order to remove this component."
                )
              : void 0;
          }

          return false;
        }
      },
      // Temporary alias since we already shipped React 16 RC with it.
      // TODO: remove in React 17.
      unstable_createPortal: function() {
        if (!didWarnAboutUnstableCreatePortal) {
          didWarnAboutUnstableCreatePortal = true;
          lowPriorityWarningWithoutStack$1(
            false,
            "The ReactDOM.unstable_createPortal() alias has been deprecated, " +
              "and will be removed in React 17+. Update your code to use " +
              "ReactDOM.createPortal() instead. It has the exact same API, " +
              'but without the "unstable_" prefix.'
          );
        }

        return createPortal$$1.apply(void 0, arguments);
      },
      unstable_batchedUpdates: batchedUpdates$1,
      // TODO remove this legacy method, unstable_discreteUpdates replaces it
      unstable_interactiveUpdates: function(fn, a, b, c) {
        flushDiscreteUpdates();
        return discreteUpdates$1(fn, a, b, c);
      },
      unstable_discreteUpdates: discreteUpdates$1,
      unstable_flushDiscreteUpdates: flushDiscreteUpdates,
      flushSync: flushSync,
      unstable_createRoot: createRoot,
      unstable_createSyncRoot: createSyncRoot,
      unstable_flushControlled: flushControlled,
      __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
        // Keep in sync with ReactDOMUnstableNativeDependencies.js
        // ReactTestUtils.js, and ReactTestUtilsAct.js. This is an array for better minification.
        Events: [
          getInstanceFromNode$1,
          getNodeFromInstance$1,
          getFiberCurrentPropsFromNode$1,
          injection.injectEventPluginsByName,
          eventNameDispatchConfigs,
          accumulateTwoPhaseDispatches,
          accumulateDirectDispatches,
          enqueueStateRestore,
          restoreStateIfNeeded,
          dispatchEvent,
          runEventsInBatch,
          flushPassiveEffects,
          IsThisRendererActing
        ]
      }
    };
  })();
}
