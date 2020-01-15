import React from 'react';
import gc from '../my-app-context';

export default function Component ({value, children, ...other}) {
  return (
    <>
      <button onClick={ ()=>gc.actions.inc(value) } style={{cursor:'pointer'}}>
        COMP1: Add {value} to {gc.state.count}
      </button>
    </>
  )
}