# Fluxez

Flux architecture for React app. Fast and easy to apply

## Samples

### Create actions

```js
import flux from "fluxez";

export const Increase = flux.actionn();
export const Decrease = flux.actionn();
```

### Create a reducer

```js
import flux from "fluxez";
import { Increase, Decrease } from "./actions";

flux.reduce((state, action, by = 1) => {
  if (action === Increase) {
    return {
      ...state,
      counter: state.counter + by
    };
  }

  if (action === Decrease) {
    return {
      ...state,
      counter: state.counter - by
    };
  }
  return state;
});
```

### Init store state

```js
import flux from "fluxez";
import { Increase, Decrease } from "./actions";

flux.merge({
  counter: 0
});
```

### Create a view

```jsx
import flux from "fluxez";
import { Increase, Decrease } from "./actions";

const CounterHOC = flux.connect(state => ({
    counter: state.counter
}));

cosnt Counter = CounterHOC(props => {
    return (
        <div>
            <h1>{props.counter}</1>
            <button onClick={Increase}>Increase</button>
            <button onClick={() => Decrease(2)}>Decrease by 2</button>
        </div>
    );
});
```

## Advanced Usages

### Change state processor

```js
import flux from "fluxez";
import update from "immhelper";

// using update method of immhelper for updating state
flux.configure({
  stateProcessor: update
});

// so reducer becomes
flux.reduce((state, action, by = 1) => {
  if (action === Increase) {
    // return update specs for immhelper
    return {
      // x is current value of counter
      counter: [x => x + by]
    };
  }

  if (action === Decrease) {
    // return update specs for immhelper
    return {
      // x is current value of counter
      counter: [x => x - by]
    };
  }
  return state;
});
```

### Put logic inside action

It easy for centralizing your logic per Action

```js
import flux from "fluxez";

export const Increase = flux.action((by = 1, state) => {
  return {
    ...state,
    counter: state.counter + by
  };
});
```

### Create reducer for single action

```js
import flux from "fluxez";
import { Increase } from "./actions";
flux.reduce(Increase, (payload, state, action) => {
  // reducer logic here
});
```

### Create reducer for multiple actions

```js
import flux from "fluxez";
import { Increase, Decrease } from "./actions";
flux.reduce(Increase, Decrease, (payload, state, action) => {
  // reducer logic here
});
```

### Code splitting

You can define action / reducer anytime and anywhere. It good for dynamic module importing

#### todo module

```js
import flux from "fluxez";
// todo state
flux.merge({
  todos: {},
  todoIds: []
});
const AddTodo = flux.action(payload => {
  // add action logic here
});
const RemoveTodo = flux.action(payload => {
  // remove action logic here
});
```

#### profile module

```js
import flux from "fluxez";
// profile state
flux.merge({
  profile: {}
});
const UpdateProfile = flux.action(payload => {
  // update profile action logic here
});
```
