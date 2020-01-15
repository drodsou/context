
let ctx = {}

let priv = {
  DEFAULT_LOCALSTORAGE_KEY : 'default-drodsou-context-localStorageKey',
  addUndoState : function({actionName, actionArgs}) {
    ctx.previousStates.push({
      state: JSON.stringify(ctx.state), 
      exitActionName:actionName, 
      exitActionArgs:actionArgs,
      timestamp : Date.now()
    });
    if (ctx.previousStates.length > ctx.options.undoSlots) {
      ctx.previousStates.shift();
    }
  }
}

ctx.options = {}, // see ctx.init for defaults
ctx.options.localStorageKey = undefined;
ctx.previousStates = [];  // {state, exitActionName, exitActionArgs }

ctx.undo = function () {
  if (!ctx.options.undoSlots) {
    // throw new Error(`global-state: cant't undo, it has been disabled in ctx.init() options`)
    console.warn(`@drodsou/context: asking for undo, but undo is disabled. Set undoSlots > 0 in .options or in 'init' to enable it.`);
  }

  if (ctx.previousStates.length > 0) {
    let prevState = ctx.previousStates.pop();
    console.log(`Undoing action ${prevState.exitActionName}(${prevState.exitActionArgs.join(',')})`)
    ctx.state = JSON.parse(prevState.state);
    ctx.updateUI();
  }
}

ctx.loadFromLocalStorage = function (alternateLocalStorageKey, updateUI=true) {
  ctx.previousStates = [];
  if (typeof localStorage !== 'undefined') {
    let lsKey = alternateLocalStorageKey || ctx.options.localStorageKey || priv.DEFAULT_LOCALSTORAGE_KEY;
    if (lsKey === priv.DEFAULT_LOCALSTORAGE_KEY) {
      console.warn(`@drodsou/context: loading from local storage but 'localStorageKey' was not provided in 'init', using default key`)
    }
    let lsState = localStorage.getItem(`${lsKey}_state`)
    if (lsState) {
      ctx.state = {...ctx.state, ...JSON.parse(lsState) };
      if (updateUI) { ctx.updateUI(); }
    }      
  }
}

ctx.saveToLocalStorage = function (alternateLocalStorageKey) {
  if (typeof localStorage !== 'undefined') {
    let lsKey = alternateLocalStorageKey || ctx.options.localStorageKey || priv.DEFAULT_LOCALSTORAGE_KEY;
    if (lsKey === priv.DEFAULT_LOCALSTORAGE_KEY) {
      console.warn(`@drodsou/context: saving to local storage but 'localStorageKey' was not provided in 'init', using default key`)
    }
    localStorage.setItem(`${lsKey}_state`, JSON.stringify(ctx.state));
  }
}

/**
 * @param r - react 'this' if in a class componente or [state,setState] from useState()
 */
ctx.connectReact = function (r) {
  if (r.forceUpdate) {
    ctx.updateUI = r.forceUpdate.bind(r);
  } else {
    let [state,setState] = r;
    ctx.updateUI = ()=>setState( st=>(
      st > 10000 ? 0 : (st || 0) +1
    ));
  }
}

// should be updated on ctx.connectXXX functions;
ctx.updateUI = function() {
  console.warn(`@drodsou/context: updateUI() is not triggering any UI repaint. Use builtin functions .connectToXXX depending on your framework, or set your own updateUI.`);
};  

ctx.actions = undefined;
/**
 * 
 */
ctx.init = function ({state, actions, props, options, ...other}) {
  if (Object.keys(other).length > 0) {
    throw new Error (`@drodsou/context: unexpected parameter(s) detected in 'init': ${Object.keys(other).join(', ')}`);
  }

  let {undoSlots,localStorageKey,lsAutoSave,lsAutoLoad,
    beforeAction,afterAction, ...otherOptions
  } = options;
  if (Object.keys(otherOptions).length > 0) {
    throw new Error (`@drodsou/context: unexpected parameter(s) detected in 'init' options: ${Object.keys(otherOptions).join(', ')}`);
  }

  ctx.options.undoSlots = undoSlots || 0;
  ctx.options.localStorageKey = localStorageKey;
  ctx.options.lsAutoSave = lsAutoSave || false;
  ctx.options.lsAutoLoad = lsAutoLoad || false;
  ctx.options.beforeAction = beforeAction || [];
  ctx.options.afterAction = afterAction || [];


  ctx.state = state || {};  // never write here directly in the application, only in the actions's. Intentionally not RO for performance matters, see proxy coment at the end
  ctx.props = props || {};  // place for arbitrary data out of state

  ctx.actions = new Proxy( actions || {}, {
      get (actionsObj, actionName) {
        const actionFn = actionsObj[actionName];
        return function (...actionArgs) {
          // let actionArgsArr = Array.from(actionArgs);
          // before action
          // ...custom hooks
          ctx.options.beforeAction.forEach(f=>f({actionName, actionArgs}));
          // ...save undo state?
          if (ctx.options.undoSlots > 0) { 
            priv.addUndoState({actionName, actionArgs}); 
          }

          // DO ACTION
          result = actionFn.apply(this, actionArgs);
          
          // after action
          // ...custom hooks
          ctx.options.afterAction.forEach(f=>f({actionName, actionArgs}));
          // ...save?
          if (ctx.options.lsAutoSave) { ctx.saveToLocalStorage(); }
          ctx.updateUI();

          return result;
        }
      }
  });

  if (ctx.options.lsAutoLoad) { ctx.loadFromLocalStorage(null, false) }

}

module.exports = ctx;



// DISCARDED: return a read proxyfied read only object, but perfermance is like x30 slower
// see: https://jsperf.com/es6-harmony-proxy/6
// let protectedCtx = new Proxy(ctx, {
//   get(target, key) {
//     if (typeof target[key] === 'object' && target[key] !== null) {
//       return new Proxy(target[key], validator)
//     } else {
//       return target[key];
//     }
//   },

//   set() { 
//     throw new Error('Trying to change a read only object')
//   } 
// })

// module.exports = protectedCtx;

