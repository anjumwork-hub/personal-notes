// ==============================================================================
// LAYER: Frontend Application Bootstrap Layer
// Description: Mounts the top-level React App component into the root DOM element.
// ==============================================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
