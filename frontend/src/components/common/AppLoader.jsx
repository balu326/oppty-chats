import React from "react";
import companyLogo from "../../assets/opptylogo.png";
import "./AppLoader.css";

export default function AppLoader({
  title = "Signing you in...",
  subtitle = "Preparing your workspace",
}) {
  return (
    <div className="al-overlay">
      <div className="al-bg" />

      <div className="al-box">
        {/* Logo card */}
        <div className="al-card">
          <div className="al-ring al-ring-1" />
          <div className="al-ring al-ring-2" />
          <div className="al-ring al-ring-3" />
          <div className="al-logo-wrap">
            <img src={companyLogo} alt="Oppty" className="al-logo" />
          </div>
        </div>

        {/* Dots */}
        <div className="al-dots">
          <span /><span /><span />
        </div>

        <h3 className="al-title">{title}</h3>
        <p className="al-subtitle">{subtitle}</p>
      </div>
    </div>
  );
}
