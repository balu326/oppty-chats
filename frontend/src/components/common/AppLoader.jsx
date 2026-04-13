import React from "react";
import companyLogo from "../../assets/opptylogo.png";
import "./AppLoader.css";

export default function AppLoader({
  title = "Signing you in...",
  subtitle = "Preparing your workspace",
}) {
  return (
    <div className="al-overlay">
      <div className="al-content">
        <img src={companyLogo} alt="Oppty" className="al-logo" />
        <div className="al-bar">
          <div className="al-bar-fill" />
        </div>
        <p className="al-subtitle">{subtitle}</p>
      </div>
    </div>
  );
}
