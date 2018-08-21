import React from 'react';

let currentState = {};
const reducers = [];
let dispatching = false;
const actionQueue = [];
let actionQueueEmpty = true;
const subscribers = [];
const end = {};
const configs = {
  stateProcessor(currentState, nextState) {
    return nextState;
  }
};

function notifyChange() {
  for (let subscriber of subscribers) {
    if (!actionQueueEmpty) {
      break;
    }
    subscriber(currentState);
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
      const length = value1.length;
      if (length !== value2.length) return false;
      for (let i = 0; i < length; i++) {
        if (value1[i] !== value2[i]) return false;
      }
      return true;
    }
    const value1Keys = Object.keys(value1);
    if (value1Keys.length !== Object.keys(value2).length) return false;
    for (let key of value1Keys) {
      if (value1[key] !== value2[key]) return false;
    }
    return true;
  }
  return false;
}

export function subscribe(subscriber) {
  subscribers.push(subscriber);
  return function() {
    const index = subscribers.indexOf(subscriber);
    if (index !== -1) {
      subscribers.splice(index, 1);
    }
  };
}

export function connect(
  stateToProps = (state, props) => props,
  dispatchToProps = props => undefined
) {
  function mapProps(props) {
    return stateToProps(currentState, props);
  }

  return function(Component) {
    const isStatelessComponent = !isClass(Component);
    return class ComponentWrapper extends React.Component {
      constructor(props) {
        super(props);
        this.mappedProps = mapProps(this.props);
        this.margeProps();
        this.unsubscribe = subscribe(() => {
          let nextMappedProps;
          try {
            nextMappedProps = mapProps(this.props);
          } catch (ex) {
            return;
          }
          if (shallowEqual(nextMappedProps, this.mappedProps)) return;
          this.mappedProps = nextMappedProps;
          this.margeProps();
          this.forceUpdate();
        });
      }

      margeProps() {
        this.finalProps = Object.assign(
          {},
          this.mappedProps,
          dispatchToProps(this.mappedProps)
        );
      }

      shouldComponentUpdate(nextProps) {
        const nextMappedProps = mapProps(nextProps);
        if (shallowEqual(nextMappedProps, this.mappedProps)) return false;
        this.mappedProps = nextMappedProps;
        this.margeProps();
        return true;
      }

      componentWillUnmount() {
        if (this.unsubscribe) {
          this.unsubscribe();
        }
      }
      render() {
        if (isStatelessComponent) {
          return Component(this.finalProps, this);
        }
        return React.createElement(Component, this.finalProps);
      }
    };
  };
}

function callReducer(reducer, state, action, payload) {
  let nextState = reducer(state, action, payload);

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
  return addRootReducer(
    (state, action, payload) =>
      action === forAction ? reducer(payload, state, action) : state
  );
}

function addReducerForMultipleActions(forActions, reducer) {
  return addRootReducer(
    (state, action, payload) =>
      forActions.indexOf(action) !== -1
        ? reducer(payload, state, action)
        : state
  );
}

export function reduce() {
  if (arguments.length === 1) {
    return addRootReducer(arguments[0]);
  }

  if (arguments.length === 2) {
    return addReducerForSingleAction(arguments[0], arguments[1]);
  }

  return addReducerForMultipleActions(
    [].slice.call(arguments, 0, arguments.length - 1),
    arguments[arguments.length - 1]
  );
}

function processActionQueue() {
  if (dispatching) return;
  dispatching = true;
  let nextState = currentState;
  while (actionQueue.length) {
    const queueItem = actionQueue.shift();
    for (let i = 0; i < reducers.length; i++) {
      nextState = callReducer(
        reducers[i],
        nextState,
        queueItem.action,
        queueItem.payload
      );
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
  actionQueue.push({ action, payload });
  actionQueueEmpty = false;
  processActionQueue();
}

export function action(type) {
  const reducer = typeof type === 'function' ? type : undefined;

  const dispatcher = function(payload) {
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

export function merge(state) {
  Object.assign(currentState, state);
}

export default {
  connect,
  reduce,
  action,
  merge,
  subscribe,
  configure,
  end
};