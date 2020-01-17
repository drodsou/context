
function createContext () {

  let ctx = {
    state : {}
    action : {},
    prop : {}
    beforeAction : {},
    afterAction : {},
    afterStateChange : {},
    logger : undefined,   // ({phase, actionName, actionArgs, result timestamp })=>{whatever}
    options : {
      undoSlots : 0,
      localStorageKey : null,
      lsAutoSave : false,
      lsAutoLoad : false,
    },
    // -- should not be 
    util : {}
    previousStates = [],  // {state, exitActionName, exitActionArgs }
  }

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


  // --- PREDEFINED ACTIONS

  ctx.action.undo = function () {
    if (!ctx.options.undoSlots) {
      // throw new Error(`global-state: cant't undo, it has been disabled in ctx.init() options`)
      console.warn(`@drodsou/context: asking for undo, but undo is disabled. Set undoSlots > 0 in .options or in 'init' to enable it.`);
    }

    if (ctx.previousStates.length <= 0) { 
      return false;   // no state change
    }

    let prevState = ctx.previousStates.pop();
    console.log(`Undoing action ${prevState.exitActionName}(${prevState.exitActionArgs.join(',')})`)
    ctx.state = JSON.parse(prevState.state);
    
  }


  ctx.action.loadFromLocalStorage = function (alternateLocalStorageKey, updateUI=true) {
    if (typeof localStorage === 'undefined') { return false }

    let lsKey = alternateLocalStorageKey || ctx.options.localStorageKey || priv.DEFAULT_LOCALSTORAGE_KEY;
    if (lsKey === priv.DEFAULT_LOCALSTORAGE_KEY) {
      console.warn(`@drodsou/context: loading from local storage but 'localStorageKey' was not provided in 'init', using default key`)
    }
    let lsState = localStorage.getItem(`${lsKey}_state`)
    if (lsState) {
      ctx.previousStates = [];
      ctx.state = {...ctx.state, ...JSON.parse(lsState) };
    }      
    
  }

  ctx.action.saveToLocalStorage = function (alternateLocalStorageKey) {
    if (typeof localStorage !== 'undefined') {
      let lsKey = alternateLocalStorageKey || ctx.options.localStorageKey || priv.DEFAULT_LOCALSTORAGE_KEY;
      if (lsKey === priv.DEFAULT_LOCALSTORAGE_KEY) {
        console.warn(`@drodsou/context: saving to local storage but 'localStorageKey' was not provided in 'init', using default key`)
      }
      localStorage.setItem(`${lsKey}_state`, JSON.stringify(ctx.state));
    }
    return false; // no state change
  }


  /**
   * Utility helper action when using react
   * @param r - react 'this' if in a class componente or [state,setState] from useState()
   */
  ctx.action.connectReact = function (r) {
    if (r.forceUpdate) {
      ctx.updateUI = r.forceUpdate.bind(r);
    } else {
      let [state,setState] = r;
      ctx.afterStateChange.updateUI = ()=> {
        setState( st=> st > 10000 ? 0 : (st || 0) +1 )
      };
    }
  }

  
  // --- PREDEFINED TRIGGERS

  ctx.afterStateChange.maybeAddUndoState = ({actionName, actionArgs})=>{
    // ...save undo state?
    if (ctx.options.undoSlots > 0) { 
      priv.addUndoState({actionName, actionArgs}); 
    }
  }

  ctx.afterStateChange.maybeSaveToLocalStorage = ({actionName, actionArgs})=>{
    // ...save undo state?
    if (ctx.options.lsAutoSave) { ctx.saveToLocalStorage(); }
  }


  // -- INIT FUNCTION

  /**
   * 
   */
  ctx.init = function () {

    ctx.action = new Proxy( ctx.action || {}, {
        get (actionsObj, actionName) {
          const actionFn = actionsObj[actionName];
          return function (...actionArgs) {
            
            // before action
            for (let [fnName, fn] of Object.entries(ctx.beforeAction)) {
              let continueAction = fn({actionName, actionArgs});
              if (ctx.logger) { ctx.logger({phase:`beforeAction:${fnName}`, result:`cancelAction ${cancelAction}`, actionName, actionArgs, timestamp: Date.now() })
              if (cancelAction === false) return;
            }

            // do action
            let stateChanged = actionFn.apply(this, actionArgs);
            if (ctx.logger) { ctx.logger({phase:'action', result:`stateChanged ${stateChanged}`, actionName, actionArgs, timestamp: Date.now() })
            
            
            // after action
            for (let [fnName, fn] of Object.entries(ctx.afterAction)) {
              if (ctx.logger) { ctx.logger({phase:`afterAction:${fnName}`, result:null, actionName, actionArgs, timestamp: Date.now() })
              fn({actionName, actionArgs});
            }

            // after state change
            if (stateChanged) {
              for (let [fnName, fn] of Object.entries(ctx.afterStateChange)) {
                if (ctx.logger) { ctx.logger({phase:`afterAction:${fnName}`, result:null, actionName, actionArgs, timestamp: Date.now() })
                fn({actionName, actionArgs});
              }
            }

          }
        }
    });

    if (ctx.options.lsAutoLoad) { ctx.action.loadFromLocalStorage(null, false) }

  } // init

}

module.exports = createContext;



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

