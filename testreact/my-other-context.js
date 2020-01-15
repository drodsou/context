import gc from '../context';

console.log('initialicing my-global-context')

gc.init({
  UUID:'uuid',
  state:{
    count:5
  }, 
  action:{
    inc(value) { gc.state.count += (value || 1); }
  }, 
  custom:{} 
})

export default gc;