import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { ChatProvider } from "./context/ChatContext.jsx";
import "./debug-env.js"; // Debug environment variables

// Log environment info at startup
console.log('🚀 App Starting...');
console.log('Environment Mode:', import.meta.env.MODE);
console.log('Base URL:', import.meta.env.BASE_URL);
if (import.meta.env.VITE_API_URL) {
  console.log('✅ API URL:', import.meta.env.VITE_API_URL);
} else {
  console.warn('⚠️ VITE_API_URL not set - will use fallback');
}

ReactDOM.createRoot(document.getElementById("root")).render(
  // ✅ Removed StrictMode - it causes double event firing in development
  <BrowserRouter>
    <ChatProvider>
      <App />
    </ChatProvider>
  </BrowserRouter>
);