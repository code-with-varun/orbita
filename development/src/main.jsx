import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Prepend VITE_API_BASE_URL from environment variables if defined
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
if (API_BASE) {
  const originalFetch = window.fetch;
  window.fetch = function (resource, config) {
    if (typeof resource === 'string' && resource.startsWith('/api')) {
      resource = `${API_BASE}${resource}`;
    }
    return originalFetch.call(this, resource, config);
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
