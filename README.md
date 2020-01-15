# @drodsou/context

Vanilla javascript alternative to Redux / React Global Context API to provide global state management / actions reducer / undo / localStorage state permanency with simplicity and performance

# why

Because Global Context API of React only allows you to useContext inside of a component, not an arbitrary module.

Also setState not being synchronous is a source of pain.

Here you have a plain object app.state, that you can export/import to JSON freely, manipulate however you need in your custom 'action' multiple times and only triggering uiupdate after all modifications are done.

Also after the action you know the state has synchronously changed so you can rely on it from anywhere else immediately.

If you dont like the inmutability concept, or find the automatic triggering when a piece of state changes like with mobx or Vue builtin reactivity, this is for you, small and easy to grasp source code.

And you can use this library with plain vanilla or any js framework.

# compatible with: 

Directly connectable with React rendering. Any other framework too definining updateUI() -see usage non react apps bellow

# installation

```
npm install @drodsou/context
```

# usage in your app

Create a file like the one in `testreact/my-app-context.js`

You can create many to have many independent contexts

## React apps

In your root React element:

```js
import app from './my-app-context'
// ... if Class: in constructor
app.connectReact(this);  // to update UI from state

// ... if Function:
import React, {useState} from 'react';
app.connectReact(useState());  // to update UI from state

```

## Non React apps
define `app.updateUI()` so it triggers an UI update. This function will be called automatically after every `app.actions.whatever()`

## Rest of modules, any framework
In any other component module:

```js
import app from './my-app-context';

app.state.whatever;  // get state
app.actions.doSomeAction(optActionProp); // change state
```

# built-in optional

1) saves to localStorage after every action (`autoSave` option)

2) saves previous app states, which you can go back with `app.undo()`(undoSlots option to limit number of undo states stored, 0 for none and improved performance)

3) beforeAction and afterAction hooks, eg for logging or whatever






