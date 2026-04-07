import React from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import "./SettingsPage.css";

export default function SettingsPage() {
  const { prefs, setMode } = useTheme();
  const isDark = prefs.mode === "dark";

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-subtitle">Manage your preferences</p>
      </div>

      <div className="settings-body">
        <section className="settings-section">
          <h2 className="settings-section-title">Appearance</h2>
          <div className="settings-card">
            <div className="settings-row">
              <div className="settings-row-info">
                <span className="settings-row-label">Theme</span>
                <span className="settings-row-desc">Switch between light and dark mode</span>
              </div>
              <div className="theme-toggle-group">
                <button
                  className={`theme-toggle-btn ${!isDark ? "active" : ""}`}
                  onClick={() => setMode("light")}
                >
                  ☀️ Light
                </button>
                <button
                  className={`theme-toggle-btn ${isDark ? "active" : ""}`}
                  onClick={() => setMode("dark")}
                >
                  🌙 Dark
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
