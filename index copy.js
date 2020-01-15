let g =  typeof window !== 'undefined' ? window : global;

if (!g.app) {

  let app = {
    previousStates : [],
  }
  g.app = app;
  
  let priv = {
    options : {}, // see app.init for defaults
    allActions : {},
    initialized : false,
    addUndoState : function() {
      if (priv.options.undo > 0) {
        app.previousStates.push(JSON.stringify(app.state));
        if (app.previousStates.length > priv.options.undo) {
          app.previousStates.shift();
        }
      }
    }
  }
  
  app.undo = function () {
    // if (!priv.options.undo) {
    //   throw new Error(`global-state: cant't undo, it has been disabled in app.init() options`)
    // }

    if (app.previousStates.length > 0) {
      app.state = JSON.parse(app.previousStates.pop());
      app.updateUI();
    }
  }

  app.load = function () {
    app.previousStates = [];
    if (typeof localStorage !== 'undefined') {
      let lsState = localStorage.getItem(`${app.UUID}_state`)
      if (lsState) {
        app.state = {...app.state, ...JSON.parse(lsState) };
        app.updateUI();
      }      
    }
  }

  app.save = function () {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`${app.UUID}_state`, JSON.stringify(app.state));
    }
  }

  app.connectReact = function (reactThis) {
    reactThis.state = 0;
    app.updateUI = ()=>reactThis.setState( (prevState)=>(
      prevState > 10000 ? 0 : prevState+1
    ));
  }

  app.updateUI = function () {};  // updated on app.init;

  app.action = function (action,props) {
    if (!Object.keys(priv.allActions).includes(action)) {
      throw new Error(`Unknown app.action "${action}"`);
    }

    // before action
    priv.addUndoState();
  
    // action
    priv.allActions[action](props);

    // after action
    if (priv.options.autoSave) {
      app.save();
    }
    app.updateUI();
  }
 
  app.init = function ({UUID,state,actions,undo,autoSave,custom}) {
    if (!priv.initialized) {
      app.UUID = UUID || 'app';
      app.state = state || {};
      priv.allActions = actions ||  {}
      priv.options.undo = undo || 10;
      priv.options.autoSave = autoSave || true;
      app.custom = custom || {}

      priv.initialized = true;
    }
  }

}

module.exports = {app: g.app};