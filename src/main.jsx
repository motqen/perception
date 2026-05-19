import React from 'react';
import ReactDom from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './i18n'; // import i18n config
import { HashRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

ReactDom.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);
