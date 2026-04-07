import React, { useEffect, useRef } from "react";
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

const TYPE_ICON = {
  message: "💬",
  group:   "👥",
  mention: "🔔",
  system:  "ℹ️",
};

export default function NotificationPanel({ notifications, unreadCount, onMarkAllRead, onMarkOne, onDelete, onClose }) {
  const navigate = useNavigate();
  const panelRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleClick = (notif) => {
    onMarkOne(notif.id);
    if (notif.chatId) {
      navigate(`/chats/${notif.chatId}`);
    }
    onClose();
  };

  return (
    <div className="notif-panel" ref={panelRef} role="dialog" aria-label="Notifications">
      <div className="notif-panel-header">
        <span className="notif-panel-title">Notifications</span>
        <div className="notif-panel-actions">
          {unreadCount > 0 && (
            <button className="notif-mark-all" onClick={onMarkAllRead}>Mark all read</button>
          )}
          <button className="notif-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
      </div>

      <div className="notif-list">
        {notifications.length === 0 ? (
          <div className="notif-empty">
            <span className="notif-empty-icon">🔔</span>
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`notif-item ${!n.isRead ? "unread" : ""}`}
              onClick={() => handleClick(n)}
            >
              <span className="notif-type-icon">{TYPE_ICON[n.type] || "🔔"}</span>
              <div className="notif-body">
                <div className="notif-title">{n.title}</div>
                {n.body && <div className="notif-text">{n.body}</div>}
                <div className="notif-time">{timeAgo(n.createdAt)}</div>
              </div>
              {!n.isRead && <span className="notif-dot" />}
              <button
                className="notif-delete-btn"
                onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}
                aria-label="Dismiss"
              >✕</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
