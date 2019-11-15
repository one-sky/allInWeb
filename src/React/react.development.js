/** @license React v16.11.0
 */
"use strict";

// React 利用嵌套的JS对象表示DOM

// React.createElement
// |=ReactElement.createElement(type, config, children)
//     |-ReactElement(type,..., props)

// 非production环境下
if (process.env.NODE_ENV !== "production") {
  (function() {
    const _assign = require("object-assign");
    const checkPropTypes = require("prop-types/checkPropTypes");

    const hasOwnProperty = Object.prototype.hasOwnProperty;

    // 如果支持Symbol 则创建，否则用数字代替
    const hasSymbol = typeof Symbol === "function" && Symbol.for;
    const REACT_ELEMENT_TYPE = hasSymbol ? Symbol.for("react.element") : 0xeac7;
    const REACT_PORTAL_TYPE = hasSymbol ? Symbol.for("react.portal") : 0xeaca;
    const REACT_FRAGMENT_TYPE = hasSymbol
      ? Symbol.for("react.fragment")
      : 0xeacb;
    const REACT_STRICT_MODE_TYPE = hasSymbol
      ? Symbol.for("react.strict_mode")
      : 0xeacc;
    const REACT_PROFILER_TYPE = hasSymbol
      ? Symbol.for("react.profiler")
      : 0xead2;
    const REACT_PROVIDER_TYPE = hasSymbol
      ? Symbol.for("react.provider")
      : 0xeacd;
    const REACT_CONTEXT_TYPE = hasSymbol ? Symbol.for("react.context") : 0xeace; // TODO: We don't use AsyncMode or ConcurrentMode anymore. They were temporary

    // 需要从config中单独抽取出来的属性
    const RESERVED_PROPS = {
      key: true,
      ref: true,
      __self: true,
      __source: true
    };

    // 实际上这个current初始时是null，类型可以是Fiber或null
    const ReactCurrentOwner = {
      /**
       * @internal
       * @type {ReactComponent}
       */
      current: null
    };

    const POOL_SIZE = 10;
    const traverseContextPool = [];

    const ReactElement = function(type, key, ref, self, source, owner, props) {
      const element = {
        $$typeof: REACT_ELEMENT_TYPE, //唯一标识类似于唯一ID 根据这个找到DOM对象
        type: type,
        key: key, // 开发者添加的唯一标识
        ref: ref,
        props: props,
        _owner: owner
      };
      element._store = {};
      Object.defineProperty(element._store, "validated", {
        configurable: false,
        enumerable: false,
        writable: true,
        value: false
      });
      Object.defineProperty(element, "_self", {
        configurable: false,
        enumerable: false,
        writable: false,
        value: self
      });
      Object.defineProperty(element, "_source", {
        configurable: false,
        enumerable: false,
        writable: false,
        value: source
      });
      if (Object.freeze) {
        // 不允许修改props 和 element
        Object.freeze(element.props);
        Object.freeze(element);
      }
      return element;
    };

    function getWrappedName(outerType, innerType, wrapperName) {
      var functionName = innerType.displayName || innerType.name || "";
      return (
        outerType.displayName ||
        (functionName !== ""
          ? wrapperName + "(" + functionName + ")"
          : wrapperName)
      );
    }

    function refineResolvedLazyComponent(lazyComponent) {
      return lazyComponent._status === Resolved ? lazyComponent._result : null;
    }

    function getComponentName(type) {
      if (type == null) {
        // Host root, text node or just invalid type.
        return null;
      }
      if (typeof type.tag === "number") {
        warningWithoutStack(
          false,
          "Received an unexpected object in getComponentName(). " +
            "This is likely a bug in React. Please file an issue."
        );
      }
      if (typeof type === "function") {
        return type.displayName || type.name || null;
      }

      if (typeof type === "string") {
        return type;
      }

      switch (type) {
        case REACT_FRAGMENT_TYPE:
          return "Fragment";

        case REACT_PORTAL_TYPE:
          return "Portal";

        case REACT_PROFILER_TYPE:
          return "Profiler";

        case REACT_STRICT_MODE_TYPE:
          return "StrictMode";

        case REACT_SUSPENSE_TYPE:
          return "Suspense";

        case REACT_SUSPENSE_LIST_TYPE:
          return "SuspenseList";
      }

      if (typeof type === "object") {
        switch (type.$$typeof) {
          case REACT_CONTEXT_TYPE:
            return "Context.Consumer";

          case REACT_PROVIDER_TYPE:
            return "Context.Provider";

          case REACT_FORWARD_REF_TYPE:
            return getWrappedName(type, type.render, "ForwardRef");

          case REACT_MEMO_TYPE:
            return getComponentName(type.type);

          case REACT_LAZY_TYPE: {
            var thenable = type;
            var resolvedThenable = refineResolvedLazyComponent(thenable);

            if (resolvedThenable) {
              return getComponentName(resolvedThenable);
            }

            break;
          }
        }
      }

      return null;
    }

    // 校验是否react element
    function isValidElement(object) {
      return (
        typeof object === "object" &&
        object !== null &&
        object.$$typeof === REACT_ELEMENT_TYPE
      );
    }

    // 校验是否react element的type
    function isValidElementType(type) {
      return (
        typeof type === "string" ||
        typeof type === "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
        type === REACT_FRAGMENT_TYPE ||
        type === REACT_CONCURRENT_MODE_TYPE ||
        type === REACT_PROFILER_TYPE ||
        type === REACT_STRICT_MODE_TYPE ||
        type === REACT_SUSPENSE_TYPE ||
        type === REACT_SUSPENSE_LIST_TYPE ||
        (typeof type === "object" &&
          type !== null &&
          (type.$$typeof === REACT_LAZY_TYPE ||
            type.$$typeof === REACT_MEMO_TYPE ||
            type.$$typeof === REACT_PROVIDER_TYPE ||
            type.$$typeof === REACT_CONTEXT_TYPE ||
            type.$$typeof === REACT_FORWARD_REF_TYPE ||
            type.$$typeof === REACT_FUNDAMENTAL_TYPE ||
            type.$$typeof === REACT_RESPONDER_TYPE ||
            type.$$typeof === REACT_SCOPE_TYPE))
      );
    }

    function getDeclarationErrorAddendum() {
      if (ReactCurrentOwner.current) {
        const name = getComponentName(ReactCurrentOwner.current.type);

        if (name) {
          return "\n\nCheck the render method of `" + name + "`.";
        }
      }

      return "";
    }

    function getSourceInfoErrorAddendum(source) {
      if (source !== undefined) {
        var fileName = source.fileName.replace(/^.*[\\\/]/, "");
        var lineNumber = source.lineNumber;
        return "\n\nCheck your code at " + fileName + ":" + lineNumber + ".";
      }

      return "";
    }

    function getSourceInfoErrorAddendumForProps(elementProps) {
      if (elementProps !== null && elementProps !== undefined) {
        return getSourceInfoErrorAddendum(elementProps.__source);
      }

      return "";
    }

    /**
     * React.createElement("h1", {ref="h1", className: "main"}, "Hello React!");
     * 接收参数使用ES6剩余参数
     * @param {*} type h1
     * @param {*} config {ref="h1", className: "main"}
     * @param {*} children "Hello React!"
     */
    function createElement(type, config, ...children) {
      var props = {};
      var key = null;
      var ref = null;
      var self = null;
      var source = null;

      // config 中的ref key __self __source取出来，其他参数放到props中
      if (config != null) {
        if (hasValidRef(config)) {
          ref = config.ref;
        }
        if (hasValidKey(config)) {
          key = "" + config.key;
        }

        self = config.__self === undefined ? null : config.__self;
        source = config.__source === undefined ? null : config.__source; // Remaining properties are added to a new props object

        // 剩余参数放到props
        for (let propName in config) {
          if (
            hasOwnProperty.call(config, propName) &&
            !RESERVED_PROPS.hasOwnProperty(propName)
          ) {
            props[propName] = config[propName];
          }
        }
      }

      if (children.length === 1) {
        props.children = children[0];
      } else if (children.length > 1) {
        if (Object.freeze) {
          Object.freeze(children);
        }
        props.children = children;
      }

      // defaultProps的值也放到props里面
      if (type && type.defaultProps) {
        const { defaultProps } = type;

        for (let propName in defaultProps) {
          if (props[propName] === undefined) {
            props[propName] = defaultProps[propName];
          }
        }
      }

      if (key || ref) {
        const displayName =
          typeof type === "function"
            ? type.displayName || type.name || "Unknown"
            : type;

        if (key) {
          defineKeyPropWarningGetter(props, displayName);
        }

        if (ref) {
          defineRefPropWarningGetter(props, displayName);
        }
      }

      return ReactElement(
        type,
        key,
        ref,
        self,
        source,
        ReactCurrentOwner.current,
        props
      );
    }

    // 有校验element与element.type的createElement
    function createElementWithValidation(type, props, children) {
      var validType = isValidElementType(type); // We warn in this case but don't throw. We expect the element creation to
      // succeed and there will likely be errors in render.

      if (!validType) {
        let info = "";

        if (
          type === undefined ||
          (typeof type === "object" &&
            type !== null &&
            Object.keys(type).length === 0)
        ) {
          info +=
            " You likely forgot to export your component from the file " +
            "it's defined in, or you might have mixed up default and named imports.";
        }

        var sourceInfo = getSourceInfoErrorAddendumForProps(props);

        if (sourceInfo) {
          info += sourceInfo;
        } else {
          info += getDeclarationErrorAddendum();
        }

        var typeString;

        if (type === null) {
          typeString = "null";
        } else if (Array.isArray(type)) {
          typeString = "array";
        } else if (type !== undefined && type.$$typeof === REACT_ELEMENT_TYPE) {
          typeString = "<" + (getComponentName(type.type) || "Unknown") + " />";
          info =
            " Did you accidentally export a JSX literal instead of a component?";
        } else {
          typeString = typeof type;
        }

        warning$1(
          false,
          "React.createElement: type is invalid -- expected a string (for " +
            "built-in components) or a class/function (for composite " +
            "components) but got: %s.%s",
          typeString,
          info
        );
      }

      var element = createElement.apply(this, arguments); // The result can be nullish if a mock or a custom function is used.
      // TODO: Drop this when these are no longer allowed as the type argument.

      if (element == null) {
        return element;
      } // Skip key warning if the type isn't valid since our key validation logic
      // doesn't expect a non-string/function type and can throw confusing errors.
      // We don't want exception behavior to differ between dev and prod.
      // (Rendering will throw with a helpful message and as soon as the type is
      // fixed, the key warnings will appear.)

      if (validType) {
        for (var i = 2; i < arguments.length; i++) {
          validateChildKeys(arguments[i], type);
        }
      }

      if (type === REACT_FRAGMENT_TYPE) {
        validateFragmentProps(element);
      } else {
        validatePropTypes(element);
      }

      return element;
    }

    /**
     * 校验config上是否有合法的自身ref属性以及是否是合法的键值对
     * @param {*} config
     */
    function hasValidRef(config) {
      // 排除原型链上的ref
      // TODO ???
      // if (hasOwnProperty.call(config, "ref")) {
      let { get: getter } = Object.getOwnPropertyDescriptor(config, "ref");
      if (getter && getter.isReactWarning) {
        return false;
      }
      // }

      return config.ref !== undefined;
    }

    /**
     * 与ref校验相似
     * @param {*} config
     */
    function hasValidKey(config) {
      // TODO ???
      // if (hasOwnProperty.call(config, 'key')) {
      let { get: getter } = Object.getOwnPropertyDescriptor(config, "key");
      if (getter && getter.isReactWarning) {
        return false;
      }
      // }
      return config.key !== undefined;
    }

    function defineKeyPropWarningGetter(props, displayName) {
      const warnAboutAccessingKey = function() {
        if (!specialPropKeyWarningShown) {
          specialPropKeyWarningShown = true;
          warningWithoutStack(
            false,
            "%s: `key` is not a prop. Trying to access it will result " +
              "in `undefined` being returned. If you need to access the same " +
              "value within the child component, you should pass it as a different " +
              "prop. (https://fb.me/react-special-props)",
            displayName
          );
        }
      };

      warnAboutAccessingKey.isReactWarning = true;
      Object.defineProperty(props, "key", {
        get: warnAboutAccessingKey,
        configurable: true
      });
    }

    function defineRefPropWarningGetter(props, displayName) {
      const warnAboutAccessingRef = function() {
        if (!specialPropRefWarningShown) {
          specialPropRefWarningShown = true;
          warningWithoutStack(
            false,
            "%s: `ref` is not a prop. Trying to access it will result " +
              "in `undefined` being returned. If you need to access the same " +
              "value within the child component, you should pass it as a different " +
              "prop. (https://fb.me/react-special-props)",
            displayName
          );
        }
      };

      warnAboutAccessingRef.isReactWarning = true;
      Object.defineProperty(props, "ref", {
        get: warnAboutAccessingRef,
        configurable: true
      });
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

    const emptyObject = {};
    Object.freeze(emptyObject);

    function Component(props, context, updater) {
      this.props = props;
      this.context = context; // If a component has string refs, we will assign a different object later.

      this.refs = emptyObject;

      this.updater = updater || ReactNoopUpdateQueue;
    }

    Component.prototype.isReactComponent = {};

    Component.prototype.setState = function(partialState, callback) {
      // typeof null === "object"
      if (
        !(
          (
            typeof partialState === "object" ||
            typeof partialState === "function"
          ) // || partialState == null
        )
      ) {
        {
          throw Error(
            "setState(...): takes an object of state variables to update or a function which returns an object of state variables."
          );
        }
      }

      this.updater.enqueueSetState(this, partialState, callback, "setState");
    };

    Component.prototype.forceUpdate = function(callback) {
      this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
    };

    function ComponentDummy() {}
    // ComponentDummy可以访问Component上的setState和forceUpdate
    ComponentDummy.prototype = Component.prototype;

    function PureComponent(props, context, updater) {
      this.props = props;
      this.context = context; // If a component has string refs, we will assign a different object later.

      this.refs = emptyObject;
      this.updater = updater || ReactNoopUpdateQueue;
    }

    //将Component的方法拷贝到pureComponentPrototype上
    // ComponentDummy实例而不直接使用Component实例，不继承Component的contructor，可以减少一些内存使用
    const pureComponentPrototype = (PureComponent.prototype = new ComponentDummy());
    pureComponentPrototype.constructor = PureComponent; // Avoid an extra prototype jump for these methods.

    // 为了避免多一次原型链查找
    _assign(pureComponentPrototype, Component.prototype);

    pureComponentPrototype.isPureReactComponent = true;

    function traverseAllChildrenImpl(
      children,
      nameSoFar,
      callback,
      traverseContext
    ) {
      var type = typeof children;

      if (type === "undefined" || type === "boolean") {
        // All of the above are perceived as null.
        children = null;
      }

      var invokeCallback = false;

      if (children === null) {
        invokeCallback = true;
      } else {
        switch (type) {
          case "string":
          case "number":
            invokeCallback = true;
            break;

          case "object":
            switch (children.$$typeof) {
              case REACT_ELEMENT_TYPE:
              case REACT_PORTAL_TYPE:
                invokeCallback = true;
            }
        }
      }

      if (invokeCallback) {
        callback(
          traverseContext,
          children, // If it's the only child, treat the name as if it was wrapped in an array
          // so that it's consistent if the number of children grows.
          nameSoFar === ""
            ? SEPARATOR + getComponentKey(children, 0)
            : nameSoFar
        );
        return 1;
      }

      var child;
      var nextName;
      var subtreeCount = 0; // Count of children found in the current subtree.

      var nextNamePrefix =
        nameSoFar === "" ? SEPARATOR : nameSoFar + SUBSEPARATOR;

      if (Array.isArray(children)) {
        for (var i = 0; i < children.length; i++) {
          child = children[i];
          nextName = nextNamePrefix + getComponentKey(child, i);
          subtreeCount += traverseAllChildrenImpl(
            child,
            nextName,
            callback,
            traverseContext
          );
        }
      } else {
        var iteratorFn = getIteratorFn(children);

        if (typeof iteratorFn === "function") {
          {
            // Warn about using Maps as children
            if (iteratorFn === children.entries) {
              !didWarnAboutMaps
                ? warning$1(
                    false,
                    "Using Maps as children is unsupported and will likely yield " +
                      "unexpected results. Convert it to a sequence/iterable of keyed " +
                      "ReactElements instead."
                  )
                : void 0;
              didWarnAboutMaps = true;
            }
          }

          var iterator = iteratorFn.call(children);
          var step;
          var ii = 0;

          while (!(step = iterator.next()).done) {
            child = step.value;
            nextName = nextNamePrefix + getComponentKey(child, ii++);
            subtreeCount += traverseAllChildrenImpl(
              child,
              nextName,
              callback,
              traverseContext
            );
          }
        } else if (type === "object") {
          var addendum = "";

          {
            addendum =
              " If you meant to render a collection of children, use an array " +
              "instead." +
              ReactDebugCurrentFrame.getStackAddendum();
          }

          var childrenString = "" + children;

          {
            {
              throw Error(
                "Objects are not valid as a React child (found: " +
                  (childrenString === "[object Object]"
                    ? "object with keys {" +
                      Object.keys(children).join(", ") +
                      "}"
                    : childrenString) +
                  ")." +
                  addendum
              );
            }
          }
        }
      }

      return subtreeCount;
    }

    function traverseAllChildren(children, callback, traverseContext) {
      if (children == null) {
        return 0;
      }

      return traverseAllChildrenImpl(children, "", callback, traverseContext);
    }

    const userProvidedKeyEscapeRegex = /\/+/g;

    // 转义
    function escapeUserProvidedKey(text) {
      return ("" + text).replace(userProvidedKeyEscapeRegex, "$&/");
    }

    function getPooledTraverseContext(
      mapResult,
      keyPrefix,
      mapFunction,
      mapContext
    ) {
      if (traverseContextPool.length) {
        let traverseContext = traverseContextPool.pop();
        traverseContext.result = mapResult;
        traverseContext.keyPrefix = keyPrefix;
        traverseContext.func = mapFunction;
        traverseContext.context = mapContext;
        traverseContext.count = 0;
        return traverseContext;
      } else {
        return {
          result: mapResult,
          keyPrefix: keyPrefix,
          func: mapFunction,
          context: mapContext,
          count: 0
        };
      }
    }

    function mapIntoWithKeyPrefixInternal(
      children,
      array,
      prefix,
      func,
      context
    ) {
      let escapedPrefix = "";

      if (prefix != null) {
        escapedPrefix = escapeUserProvidedKey(prefix) + "/";
      }

      const traverseContext = getPooledTraverseContext(
        array,
        escapedPrefix,
        func,
        context
      );
      traverseAllChildren(children, mapSingleChildIntoContext, traverseContext);
      releaseTraverseContext(traverseContext);
    }

    function mapChildren(children, func, context) {
      if (children == null) {
        return children;
      }

      const result = [];
      mapIntoWithKeyPrefixInternal(children, result, null, func, context);
      return result;
    }

    const React = {
      // this.props.children 可以是任何类型的
      // 封装一个React.Children 用于处理 this.props.children 不透明数据结构的实用方法
      Children: {
        map: mapChildren,
        forEach: forEachChildren,
        count: countChildren,
        toArray: toArray,
        only: onlyChild
      },
      Component: Component,
      PureComponent: PureComponent,
      Fragment: REACT_FRAGMENT_TYPE,
      Profiler: REACT_PROFILER_TYPE,
      StrictMode: REACT_STRICT_MODE_TYPE,
      Suspense: REACT_SUSPENSE_TYPE,
      createElement: createElementWithValidation,
      isValidElement: isValidElement,
      version: ReactVersion
    };

    Object.freeze({
      react: React
    });
    module.exports = react;
  })();
}
