'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.subscribe = subscribe;
exports.connect = connect;
exports.reduce = reduce;
exports.action = action;
exports.merge = merge;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var currentState = {};
var reducers = [];
var dispatching = false;
var actionQueue = [];
var actionQueueEmpty = true;
var subscribers = [];
var end = {};
var configs = {
  stateProcessor: function stateProcessor(currentState, nextState) {
    return nextState;
  }
};

function notifyChange() {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = subscribers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var subscriber = _step.value;

      if (!actionQueueEmpty) {
        break;
      }
      subscriber(currentState);
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
}

function isClass(v) {
  return typeof v === 'function' && /^\s*class\s+/.test(v.toString());
}

function configure(newConfigs) {
  Object.assign(configs, newConfigs);
}

function shallowEqual(value1, value2) {
  if (value1 === value2) return true;
  if (value1 instanceof Date && value2 instanceof Date) {
    return value1.getTime() === value2.getTime();
  }
  if (value1 && value2) {
    if (Array.isArray(value1)) {
      var length = value1.length;
      if (length !== value2.length) return false;
      for (var i = 0; i < length; i++) {
        if (value1[i] !== value2[i]) return false;
      }
      return true;
    }
    var value1Keys = Object.keys(value1);
    if (value1Keys.length !== Object.keys(value2).length) return false;
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = value1Keys[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var key = _step2.value;

        if (value1[key] !== value2[key]) return false;
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    return true;
  }
  return false;
}

function subscribe(subscriber) {
  subscribers.push(subscriber);
  return function () {
    var index = subscribers.indexOf(subscriber);
    if (index !== -1) {
      subscribers.splice(index, 1);
    }
  };
}

function connect() {
  var stateToProps = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function (state, props) {
    return props;
  };
  var dispatchToProps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function (props) {
    return undefined;
  };

  function mapProps(props) {
    return stateToProps(currentState, props);
  }

  return function (Component) {
    var isStatelessComponent = !isClass(Component);
    return function (_React$Component) {
      _inherits(ComponentWrapper, _React$Component);

      function ComponentWrapper(props) {
        _classCallCheck(this, ComponentWrapper);

        var _this = _possibleConstructorReturn(this, (ComponentWrapper.__proto__ || Object.getPrototypeOf(ComponentWrapper)).call(this, props));

        _this.mappedProps = mapProps(_this.props);
        _this.margeProps();
        _this.unsubscribe = subscribe(function () {
          var nextMappedProps = void 0;
          try {
            nextMappedProps = mapProps(_this.props);
          } catch (ex) {
            return;
          }
          if (shallowEqual(nextMappedProps, _this.mappedProps)) return;
          _this.mappedProps = nextMappedProps;
          _this.margeProps();
          _this.forceUpdate();
        });
        return _this;
      }

      _createClass(ComponentWrapper, [{
        key: 'margeProps',
        value: function margeProps() {
          this.finalProps = Object.assign({}, this.mappedProps, dispatchToProps(this.mappedProps));
        }
      }, {
        key: 'shouldComponentUpdate',
        value: function shouldComponentUpdate(nextProps) {
          var nextMappedProps = mapProps(nextProps);
          if (shallowEqual(nextMappedProps, this.mappedProps)) return false;
          this.mappedProps = nextMappedProps;
          this.margeProps();
          return true;
        }
      }, {
        key: 'componentWillUnmount',
        value: function componentWillUnmount() {
          if (this.unsubscribe) {
            this.unsubscribe();
          }
        }
      }, {
        key: 'render',
        value: function render() {
          if (isStatelessComponent) {
            return Component(this.finalProps, this);
          }
          return _react2.default.createElement(Component, this.finalProps);
        }
      }]);

      return ComponentWrapper;
    }(_react2.default.Component);
  };
}

function callReducer(reducer, state, action, payload) {
  var nextState = reducer(state, action, payload);

  if (nextState === end) return end;

  if (nextState === null || nextState === undefined) {
    nextState = state;
  }

  if (state !== nextState) {
    nextState = configs.stateProcessor(state, nextState);
  }

  return nextState;
}

function addRootReducer(reducer) {
  reducers.push(reducer);
}

function addReducerForSingleAction(forAction, reducer) {
  return addRootReducer(function (state, action, payload) {
    return action === forAction ? reducer(payload, state, action) : state;
  });
}

function addReducerForMultipleActions(forActions, reducer) {
  return addRootReducer(function (state, action, payload) {
    return forActions.indexOf(action) !== -1 ? reducer(payload, state, action) : state;
  });
}

function reduce() {
  if (arguments.length === 1) {
    return addRootReducer(arguments[0]);
  }

  if (arguments.length === 2) {
    return addReducerForSingleAction(arguments[0], arguments[1]);
  }

  return addReducerForMultipleActions([].slice.call(arguments, 0, arguments.length - 1), arguments[arguments.length - 1]);
}

function processActionQueue() {
  if (dispatching) return;
  dispatching = true;
  var nextState = currentState;
  while (actionQueue.length) {
    var queueItem = actionQueue.shift();
    for (var i = 0; i < reducers.length; i++) {
      nextState = callReducer(reducers[i], nextState, queueItem.action, queueItem.payload);
      if (nextState === end) break;
    }

    if (nextState === end) {
      actionQueue.length = 0;
      break;
    }
  }

  actionQueueEmpty = true;
  if (nextState === end) return;
  if (nextState !== currentState) {
    currentState = nextState;
    notifyChange();
  }

  dispatching = false;

  if (!actionQueueEmpty) {
    processActionQueue();
  }
}

function dispatch(action, payload) {
  actionQueue.push({ action: action, payload: payload });
  actionQueueEmpty = false;
  processActionQueue();
}

function action(type) {
  var reducer = typeof type === 'function' ? type : undefined;

  var dispatcher = function dispatcher(payload) {
    dispatch(type, payload);
  };

  if (type === undefined) {
    type = dispatcher;
  }

  // register reducer for this action type
  if (reducer) {
    addReducerForSingleAction(type, reducer);
  }

  return dispatcher;
}

function merge(state) {
  Object.assign(currentState, state);
}

exports.default = {
  connect: connect,
  reduce: reduce,
  action: action,
  merge: merge,
  subscribe: subscribe,
  configure: configure,
  end: end
};
//# sourceMappingURL=index.js.map