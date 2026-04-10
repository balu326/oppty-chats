import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { ChatProvider } from "./context/ChatContext.jsx";

// Fix iOS Safari viewport height — sets --vh CSS variable to real inner height
function setVh() {
  document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
}
setVh();
window.addEventListener("resize", setVh);
window.addEventListener("orientationchange", () => setTimeout(setVh, 200));
// Re-run after page fully loads (handles PWA standalone mode)
window.addEventListener("load", () => setTimeout(setVh, 100));

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ChatProvider>
      <App />
    </ChatProvider>
  </BrowserRouter>
);