import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// PWA: auto-update SW. Reload silently when a new version is ready.
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    // Re-check for updates every hour while the app is open.
    if (reg) {
      setInterval(
        () => {
          void reg.update();
        },
        60 * 60 * 1000,
      );
    }
  },
});
