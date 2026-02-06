// main.tsx - Application entry point

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Apply initial theme before React mounts
const savedTheme = localStorage.getItem('theme') || 'system';
if (savedTheme === 'dark' || (savedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
