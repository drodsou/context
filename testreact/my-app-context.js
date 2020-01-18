import createContext from '../context';

let ctx = createContext();

ctx.state = { // you should not change this directly outside actions... but you can
  count:5
};

// cant do ctx.actions = {...} but can do this
// also of course you can also do ctx.actions.inc = ...
Object.assign(ctx.actions, {
  inc : (value)=> { ctx.state.count += (value || 1); }
})


ctx.props = {
  doubleCount : ()=>ctx.state.count*2,
  stateValidation : {
    countInRange : ()=>ctx.state.count <= 10,
  }
}

// TODO are you sure not to ctx.beforeAction.xx format?
// ctx.beforeAction.logBefore = ({actionName,actionArgs})=>{ console.log(`- before action ${actionName}(${actionArgs.join(',')}) done`) }
// ctx.afterAction.logAfter = ({actionName,actionArgs})=>{ console.log(`- after action ${actionName}(${actionArgs.join(',')}) done`) }
// ctx.afterStateChange.logAfterState = ({actionName,actionArgs})=>{ console.log(`- after state change, action ${actionName}(${actionArgs.join(',')}) done`) }
ctx.beforeAction.dummyBeforeAction = ()=>{};
ctx.afterAction.dummyAfterAction = ()=>{};
ctx.afterStateChange.dummyAfterStateChange = ()=>{};
ctx.logger = true;

ctx.undoSlots = 5;


export default ctx;