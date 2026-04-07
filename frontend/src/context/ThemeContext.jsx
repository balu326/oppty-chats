import { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "oppty_theme_prefs";

function loadMode() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}").mode || "light";
  } catch {
    return "light";
  }
}

function applyTheme(mode) {
  const root = document.documentElement;
  const isDark = mode === "dark";

  root.setAttribute("data-theme", mode);

  if (isDark) {
    root.style.setProperty("--bg",                "#111b21");
    root.style.setProperty("--panel",             "#202c33");
    root.style.setProperty("--panel-2",           "#2a3942");
    root.style.setProperty("--border",            "#2a3942");
    root.style.setProperty("--text",              "#e9edef");
    root.style.setProperty("--text-secondary",    "#8696a0");
    root.style.setProperty("--text-muted",        "#667781");
    root.style.setProperty("--wa-header",         "#202c33");
    root.style.setProperty("--wa-chat-bg",        "#0d1117");
    root.style.setProperty("--wa-bubble-in",      "#202c33");
    root.style.setProperty("--wa-bubble-in-text", "#e9edef");
    root.style.setProperty("--wa-bubble-out",     "#005c4b");
    root.style.setProperty("--wa-bubble-out-text","#e9edef");
    root.style.setProperty("--wa-composer-bg",    "#202c33");
    root.style.setProperty("--wa-list-active",    "#2a3942");
    root.style.setProperty("--wa-list-hover",     "#2a3942");
  } else {
    root.style.setProperty("--bg",                "#f0f2f5");
    root.style.setProperty("--panel",             "#ffffff");
    root.style.setProperty("--panel-2",           "#f7f8fa");
    root.style.setProperty("--border",            "#e9edef");
    root.style.setProperty("--text",              "#111b21");
    root.style.setProperty("--text-secondary",    "#667781");
    root.style.setProperty("--text-muted",        "#8696a0");
    root.style.setProperty("--wa-header",         "#f0f2f5");
    root.style.setProperty("--wa-chat-bg",        "#efeae2");
    root.style.setProperty("--wa-bubble-in",      "#ffffff");
    root.style.setProperty("--wa-bubble-in-text", "#111b21");
    root.style.setProperty("--wa-bubble-out",     "#d9fdd3");
    root.style.setProperty("--wa-bubble-out-text","#111b21");
    root.style.setProperty("--wa-composer-bg",    "#f0f2f5");
    root.style.setProperty("--wa-list-active",    "#f0f2f5");
    root.style.setProperty("--wa-list-hover",     "#f5f6f6");
  }
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(loadMode);

  useEffect(() => { applyTheme(mode); }, [mode]);

  // Apply on first mount from persisted value
  useEffect(() => { applyTheme(loadMode()); }, []);

  const setMode = useCallback((m) => {
    setModeState(m);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode: m }));
  }, []);

  return (
    <ThemeContext.Provider value={{ prefs: { mode }, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
