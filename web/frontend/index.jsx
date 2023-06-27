import ReactDOM from "react-dom";

import App from "./App";

import React from 'react';


import {Router} from './src/foundation';



const rootEl = document.getElementById('root');
const render = (Component) => {
  ReactDOM.render(
      <Component />,
    rootEl,
  );
};

render(Router);
if (module.hot) module.hot.accept();
