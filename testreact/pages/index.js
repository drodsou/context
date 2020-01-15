import React, {useState} from 'react';

import gc from '../my-app-context';

import Comp1 from '../components/Comp1';
import Comp1b from '../components/Comp1';
import Comp2 from '../components/Comp2';

export default function Index ({children, ...other}) {
  gc.connectReact(useState());

  /*DEBUG*/;(typeof window === 'undefined' ? global : window).gc = gc;

  return (
    <>
      <h1>Index</h1>
      <Comp1 value={1} />
      <Comp1b value={2}/>
      <Comp2 value={3} />
      <hr />
      <button onClick={gc.undo}>undo </button>
     
    </>
  )
}