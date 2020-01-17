import createContext from '../context';


let state = { // you should not change this directly outside actions... but you can
  count:5
};

let action = {
  inc : (value)=> { ctx.state.count += (value || 1); }
}

let prop = {
  doubleCount : ()=>ctx.state.count*2,
  stateValidation : {
    countInRange : ()=>ctx.state.count <= 10,
  }
}

// TODO are you sure not to ctx.beforeAction.xx format?
let beforeAction
{logBefore = (actionName,actionArgs)=>{ console.log(`action ${actionName}(${actionArgs.join(',')}) done`}
ctx.afterAction.logAfter = (actionName,actionArgs)=>{ console.log(`action ${actionName}(${actionArgs.join(',')}) done`}

ctx.options = {
  undoSlots: 5,    // 0 to disable undo, better for performance
  localStorageKey: undefined,
  lsAutoLoad: undefined,
  lsAutoSave: undefined,
}

ctx.init(); // Important!

// TODO: move to this fomat, so it also does init
let ctx = createContext(
  state, action:action, beforeAction, afterAction, options, prop .... //TODO then this

);

export default ctx;