import React from 'react';
import gc from '../my-app-context';

export default function Component ({value, children, ...other}) {
  return (
    <>
      <button onClick={e=>gc.actions.inc(value) } style={{cursor:'pointer'}}>
        COMP2: Add {value} to {gc.state.count}
      </button>
    </>
  )
}