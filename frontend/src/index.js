import React from 'react';

import ReactDOM from 'react-dom/client';

import './index.css';

import App from './App';

import reportWebVitals from './reportWebVitals';

import {
  OrchestrationProvider
} from "./context/OrchestrationContext";

const root =
  ReactDOM.createRoot(
    document.getElementById('root')
  );

root.render(

  <React.StrictMode>

    <OrchestrationProvider>

      <App />

    </OrchestrationProvider>

  </React.StrictMode>
);

reportWebVitals();