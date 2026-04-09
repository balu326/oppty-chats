import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./NotificationPanel.css";

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TYPE_BADGE = {
  message: "💬",
  group:   "👥",
  mention: "🔔",
  system:  "ℹ️",
};

function NotifAvatar({ name, avatar, type }) {
  const [broken, setBroken] = useState(false);
  const initial = (name || "?").slice(0, 1).toUpperCase();

  return (
    <div className="notif-avatar">
      {avatar && !broken
        ? <img src={avatar} alt={name} onError={() => setBroken(true)} />
        : <span>{initial}</span>
      }
      <span className="notif-avatar-badge">{TYPE_BADGE[type] || "🔔"}</span>
    </div>
  );
}

export default function NotificationPanel({ notifications, unreadCount, onMarkAllRead, onMarkOne, onDelete, onClose }) {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [closing, setClosing] = useState(false);

  const close = () => {
    setClosing(true);
    setTimeout(onClose, 200);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) close();
    };
    // slight delay so the open click doesn't immediately close
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 100);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleClick = (notif) => {
    onMarkOne(notif.id);
    if (notif.chatId) navigate(`/chats/${notif.chatId}`);
    close();
  };

  return (
    <>
      <div className="notif-overlay" onClick={close} />
      <div className={`notif-panel ${closing ? "closing" : ""}`} ref={panelRef} role="dialog" aria-label="Notifications">

        {/* Header */}
        <div className="notif-panel-header">
          <button className="notif-back-btn" onClick={close} aria-label="Close">
            ←
          </button>
          <span className="notif-panel-title">Notifications</span>
          {unreadCount > 0 && (
            <span className="notif-header-count">{unreadCount > 99 ? "99+" : unreadCount}</span>
          )}
          {unreadCount > 0 && (
            <button className="notif-mark-all" onClick={onMarkAllRead}>
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="notif-list">
          {notifications.length === 0 ? (
            <div className="notif-empty">
              <span className="notif-empty-icon">🔔</span>
              <h3>All caught up</h3>
              <p>No notifications yet. Messages and mentions will appear here.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`notif-item ${!n.isRead ? "unread" : ""}`}
                onClick={() => handleClick(n)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleClick(n)}
              >
                <NotifAvatar name={n.senderName || n.title} avatar={n.senderAvatar} type={n.type} />

                <div className="notif-body">
                  <div className="notif-title">{n.title}</div>
                  {n.body && <div className="notif-text">{n.body}</div>}
                  <div className="notif-time">{timeAgo(n.createdAt)}</div>
                </div>

                <div className="notif-right">
                  {!n.isRead && <span className="notif-dot" />}
                  <button
                    className="notif-delete-btn"
                    onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}
                    aria-label="Dismiss"
                  >✕</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
