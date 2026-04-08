import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { ChatProvider } from "./context/ChatContext.jsx";
import "./debug-env.js";

ReactDOM.createRoot(document.getElementById("root")).render(
  // ✅ Removed StrictMode - it causes double event firing in development
  <BrowserRouter>
    <ChatProvider>
      <App />
    </ChatProvider>
  </BrowserRouter>
);