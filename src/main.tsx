import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// Global error handler to catch and filter out browser extension errors
window.addEventListener('error', (event) => {
  // Filter out browser extension errors that don't affect our application
  if (
    event.filename?.includes('contentscript') ||
    event.filename?.includes('extension') ||
    event.message?.includes('semver') ||
    event.message?.includes('backendManager')
  ) {
    // Suppress browser extension errors from showing in console
    event.preventDefault();
    return false;
  }
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  // Filter out browser extension promise rejections
  if (
    event.reason?.message?.includes('semver') ||
    event.reason?.message?.includes('backendManager') ||
    event.reason?.stack?.includes('contentscript')
  ) {
    // Suppress browser extension promise rejections
    event.preventDefault();
    return false;
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
