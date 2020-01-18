
function createContext () {

  // --- BASE CONTEXT STRUCTURE
  let ctx = {
    state : {},
    actions : {},  // redefined bellow as undeletable proxy
    props : {},
    undoSlots : 0,
    beforeAction : {},
    afterAction : {},
    afterStateChange : {},
    logger : undefined,   // ({phase, actionName, actionArgs, result timestamp })=>{whatever}
    // -- should not be updated by user normally
    previousStates : [],  // {state, exitActionName, exitActionArgs }
    util : {},
  }

  // proxy to track actions calls and allow undo
  // TODO: run tests on how this can impact perfermance compared to redux style dispatch strings
  // anyway this guarantees ability to faster state modifications specially with undoSlots = 0
  // as its a direct object modifications
  // for high actions throught put we could use a .props function that throttles input so it sends 
  // the action from there.
  let actionsProxy = new Proxy( {}, {
    get (actionsObj, actionName) {
      const actionFn = actionsObj[actionName];
      if (!actionFn) {
        throw new Error(`@drodsou/context: unknown action '${actionName}'`);
      }
      return function (...actionArgs) {
        actionArgs = Array.from(actionArgs);
        
        // before action
        for (let [fnName, fn] of Object.entries(ctx.beforeAction)) {
          let continueAction = fn({actionName, actionArgs});
          priv.logger({actionName, actionArgs, phase:`1-done beforeAction.${fnName}`, result:`continueAction ${continueAction}`, timestamp: Date.now() });
          if (continueAction === false) return;
        }

        // do action
        let stateChanged = actionFn.apply(this, actionArgs);
        priv.logger({actionName, actionArgs, phase:`2-done action`, result:`stateChanged ${stateChanged}`, timestamp: Date.now() }); 
                
        // after action
        for (let [fnName, fn] of Object.entries(ctx.afterAction)) {
          fn({actionName, actionArgs});
          priv.logger({actionName, actionArgs, phase:`3-done afterAction.${fnName}`, result:null, timestamp: Date.now() }); 
        }

        // after state change
        // by default all actions are suposed to change state, unless they return `false` boolean value
        if (stateChanged !== false) {
          for (let [fnName, fn] of Object.entries(ctx.afterStateChange)) {
            fn({actionName, actionArgs});
            priv.logger({actionName, actionArgs, phase:`4-done afterStateChange.${fnName}`, result:null, timestamp: Date.now() });
          }
        }
      }
    }
  });

  // actual 'actions' property creation
  Object.defineProperty(ctx, 'actions', {
    value: actionsProxy,
    writable: false,      // cant substitute the entire object
    configurable: false,  // cant delete 
  });


  // --- PRIVATE

  let priv = {
    addUndoState : function({actionName, actionArgs}) {
      ctx.previousStates.push({
        state: JSON.stringify(ctx.state), 
        exitActionName:actionName, 
        exitActionArgs:actionArgs,
        timestamp : Date.now()
      });
      if (ctx.previousStates.length > ctx.undoSlots) {
        ctx.previousStates.shift();
      }
    },
    loggerLastPhase : '4', 
    logger : (props) => {
      if (!ctx.logger) { return }
      if (typeof ctx.logger === 'function') { ctx.logger(props) }
      else {
        // default logger
        let newAction = props.phase[0] < priv.loggerLastPhase;
        priv.loggerLastPhase = props.phase[0];
        if (newAction) {
          // console.log(`@drodsou/context.logger:\n• ACTION: %c${props.actionName} (${props.actionArgs.map(e=>typeof e==='function'?'fn':e).join('__')})`
          let args = props.actionArgs
            .map(arg=>JSON.stringify(arg, (k,v)=>typeof v==='function'?'function':v ))
            .join(', ');
          console.log(`@drodsou/context.logger:\n• ACTION: %c${props.actionName} (${args})`
            , 'color:magenta' );
        }
        console.log(
          `  PHASE: %c${props.phase} %cRESULT: ${props.result} TIMESTAMP: ${props.timestamp}`
          , `color:${props.phase.startsWith('2-')?'white':'white'}`, 'color:white'
          //`color:magenta`, 'color:white'
        );
          // Object.entries(props).map( ([k,v])=>k+': '+v).join(', ')
        
      }
    }

  }

  // --- PREDEFINED ACTIONS

  ctx.actions.undo = function () {
    if (!ctx.undoSlots) {
      console.warn(`@drodsou/context: asking for undo, but undo is disabled. Set .undoSlots > 0 to enable it.`);
    }

    if (ctx.previousStates.length <= 0) { 
      return false;   // no state change
    }

    let prevState = ctx.previousStates.pop();
    console.log(`Undoing action ${prevState.exitActionName}(${prevState.exitActionArgs.join(',')})`)
    ctx.state = JSON.parse(prevState.state);
    
  }

  ctx.actions.lsLoadState = function (lsKey) {
    let lsState = localStorage.getItem(`${lsKey}_state`)
    if (lsState) {
      ctx.previousStates = [];
      ctx.state = {...ctx.state, ...JSON.parse(lsState) };
    }      
  }

  ctx.actions.lsSaveState = function (lsKey) {
    localStorage.setItem(`${lsKey}_state`, JSON.stringify(ctx.state));
    return false; // no state change
  }

  // --- UTILITIES

  /**
   * Utility helper action when using react, to force rerender when state changes
   * @param r - react 'this' if in a class componente or [state,setState] from useState()
   */
  ctx.util.connectReact = function (r) {
    if (r.forceUpdate) {
      // class this
      ctx.afterStateChange.updateUI = ()=>r.forceUpdate();
    } else {
      // function useState()
      let [state,setState] = r;
      if (state === undefined) {
        // only first time
        ctx.afterStateChange.updateUI = ()=> {
          setState( st=> st > 10000 ? 0 : (st || 0) +1 )
        };
      }
    }
    return false;
  }

  
  // --- PREDEFINED TRIGGERS

  ctx.afterStateChange.maybeAddUndoState = ({actionName, actionArgs})=>{
    // ...save undo state?
    if (ctx.undoSlots > 0) { 
      priv.addUndoState({actionName, actionArgs}); 
    }
  }

  return ctx;
} // createContext()

module.exports = createContext;


// DISCARDED: return a read proxyfied read only 'state' object, but perfermance is like x30 slower
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

