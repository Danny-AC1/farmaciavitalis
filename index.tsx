import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initNotificationServiceWorker } from './services/nativeNotificationService';

// Initialize PWA Service Worker for Push Notifications and Offline Capabilities
if (typeof window !== 'undefined') {
  initNotificationServiceWorker();
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
