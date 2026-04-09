import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MessagePopup.css";
import { registerToast } from "./toast.js";

// ── Browser push notification permission ──────────────────────────────────────
function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function sendBrowserNotification({ senderName, text, senderAvatar, chatId, onClickCb }) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (document.visibilityState === "visible") return; // only when tab is hidden

  const n = new Notification(senderName, {
    body: text || "📎 Attachment",
    icon: senderAvatar || "/favicon.svg",
    badge: "/favicon.svg",
    tag: `chat-${chatId}`,   // replaces previous notification for same chat
    renotify: true,
  });

  n.onclick = () => {
    window.focus();
    onClickCb?.();
    n.close();
  };
}

// ── Global queue ──────────────────────────────────────────────────────────────
let addPopupFn = null;
let addToastFn = null;

export function triggerMessagePopup(popup) {
  addPopupFn?.(popup);
}

export function triggerToast(message, type = "info") {
  addToastFn?.(message, type);
}

// ── Container ─────────────────────────────────────────────────────────────────
export default function MessagePopupContainer() {
  const [popups, setPopups] = useState([]);
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    addPopupFn = (popup) => {
      const id = Date.now() + Math.random();
      setPopups((prev) => [...prev.slice(-2), { ...popup, id }]);
      sendBrowserNotification({
        ...popup,
        onClickCb: () => popup.chatId && navigate(`/chats/${popup.chatId}`),
      });
    };
    addToastFn = (message, type) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
    };
    registerToast(addToastFn);
    return () => { addPopupFn = null; addToastFn = null; };
  }, [navigate]);

  const dismiss = (id) => setPopups((prev) => prev.filter((p) => p.id !== id));
  const dismissToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const handleClick = (popup) => {
    dismiss(popup.id);
    if (popup.chatId) navigate(`/chats/${popup.chatId}`);
  };

  return (
    <>
      <div className="msg-popup-stack">
        {popups.map((p) => (
          <MessagePopup key={p.id} popup={p} onDismiss={() => dismiss(p.id)} onClick={() => handleClick(p)} />
        ))}
      </div>
      <div className="toast-stack">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
        ))}
      </div>
    </>
  );
}

// ── Single popup ──────────────────────────────────────────────────────────────
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
      aria-label={`New message from ${popup.senderName}`}
    >
      <div className="msg-popup-avatar">
        {popup.senderAvatar
          ? <img src={popup.senderAvatar} alt={popup.senderName} />
          : <span>{initial}</span>}
      </div>

      <div className="msg-popup-body">
        <div className="msg-popup-app">Oppty Connect</div>
        <div className="msg-popup-name">{popup.senderName}</div>
        <div className="msg-popup-text">{popup.text || "📎 Attachment"}</div>
      </div>

      <button
        className="msg-popup-close"
        onClick={(e) => { e.stopPropagation(); close(); }}
        aria-label="Dismiss notification"
      >✕</button>

      {/* Auto-dismiss progress bar */}
      <div className="msg-popup-progress" />
    </div>
  );
}

// ── Toast item ────────────────────────────────────────────────────────────────
function ToastItem({ toast, onDismiss }) {
  const [exiting, setExiting] = useState(false);

  const close = () => { setExiting(true); setTimeout(onDismiss, 280); };

  useEffect(() => {
    const t = setTimeout(close, 3500);
    return () => clearTimeout(t);
  }, []);

  const icons = { success: "✓", error: "✕", warning: "⚠", info: "ℹ" };
  const icon = icons[toast.type] || "ℹ";

  return (
    <div className={`toast-item toast-item--${toast.type} ${exiting ? "toast-item--exit" : ""}`}>
      <span className="toast-item-icon">{icon}</span>
      <span className="toast-item-msg">{toast.message}</span>
      <button className="toast-item-close" onClick={close}>✕</button>
    </div>
  );
}
