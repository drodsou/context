import ctx from '../context';

console.log('initialicing my-app-context')

ctx.init({
  state:{ // you should not change this directly outside actions... but you can
    count:5
  }, 
  actions:{
    inc(value) { ctx.state.count += (value || 1); }
  }, 
  props:{}, // derived state methods or any other arbitrary thing
  options: {
    undoSlots: 5, // 0 to disable undo, better for performance
    localStorageKey: undefined,
    lsAutoLoad: undefined,
    lsAutoSave: undefined,
    beforeAction: [
      // ({actionName,actionArgs})=>console.log('before1',actionName,actionArgs.join(',')),
    ],
    afterAction: [
    ]
  }
})

export default ctx;