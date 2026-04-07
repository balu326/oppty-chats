import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MessagePopup.css";

// Global queue so multiple popups can stack
let addPopupFn = null;

export function triggerMessagePopup(popup) {
  addPopupFn?.(popup);
}

export default function MessagePopupContainer() {
  const [popups, setPopups] = useState([]);
  const navigate = useNavigate();

  // Register the global trigger
  useEffect(() => {
    addPopupFn = (popup) => {
      const id = Date.now() + Math.random();
      setPopups((prev) => [...prev.slice(-2), { ...popup, id }]); // max 3 stacked
    };
    return () => { addPopupFn = null; };
  }, []);

  const dismiss = (id) => setPopups((prev) => prev.filter((p) => p.id !== id));

  const handleClick = (popup) => {
    dismiss(popup.id);
    if (popup.chatId) navigate(`/chats/${popup.chatId}`);
  };

  return (
    <div className="msg-popup-stack">
      {popups.map((p) => (
        <MessagePopup
          key={p.id}
          popup={p}
          onDismiss={() => dismiss(p.id)}
          onClick={() => handleClick(p)}
        />
      ))}
    </div>
  );
}

function MessagePopup({ popup, onDismiss, onClick }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef(null);

  const close = () => {
    setExiting(true);
    setTimeout(onDismiss, 320);
  };

  useEffect(() => {
    timerRef.current = setTimeout(close, 5000);
    return () => clearTimeout(timerRef.current);
  }, []);

  const initial = (popup.senderName || "?").slice(0, 1).toUpperCase();

  return (
    <div
      className={`msg-popup ${exiting ? "msg-popup-exit" : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <div className="msg-popup-avatar">
        {popup.senderAvatar
          ? <img src={popup.senderAvatar} alt={popup.senderName} />
          : <span>{initial}</span>}
      </div>
      <div className="msg-popup-body">
        <div className="msg-popup-name">{popup.senderName}</div>
        <div className="msg-popup-text">{popup.text || "📎 Attachment"}</div>
      </div>
      <button
        className="msg-popup-close"
        onClick={(e) => { e.stopPropagation(); close(); }}
        aria-label="Dismiss"
      >✕</button>
    </div>
  );
}
