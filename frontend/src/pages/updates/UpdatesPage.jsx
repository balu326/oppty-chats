import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./UpdatesPage.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

function getAuthUser() {
  try { return JSON.parse(localStorage.getItem("employeeAuth") || "{}"); } catch { return {}; }
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatMeetTime(iso) {
  return new Date(iso).toLocaleString([], {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

function isPast(iso) { return iso && new Date(iso) < new Date(); }

export default function UpdatesPage() {
  const navigate = useNavigate();
  const auth = getAuthUser();

  const [notifications, setNotifications] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchAll = useCallback(async () => {
    if (!auth?.token) return;
    setLoading(true);
    try {
      const [nr, mr, br] = await Promise.all([
        fetch(`${API_URL}/notifications`, { headers: { Authorization: `Bearer ${auth.token}` } }),
        fetch(`${API_URL}/meetings`,      { headers: { Authorization: `Bearer ${auth.token}` } }),
        fetch(`${API_URL}/bookmarks`,     { headers: { Authorization: `Bearer ${auth.token}` } }),
      ]);
      const [nd, md, bd] = await Promise.all([nr.json(), mr.json(), br.json()]);
      if (nd.success) { setNotifications(nd.notifications || []); setUnreadCount(nd.unreadCount || 0); }
      if (md.success) setMeetings(md.meetings || []);
      if (bd.success) setBookmarks(bd.bookmarks || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [auth?.token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const markAllRead = async () => {
    await fetch(`${API_URL}/notifications`, { method: "PATCH", headers: { Authorization: `Bearer ${auth.token}` } });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const deleteNotif = async (id) => {
    await fetch(`${API_URL}/notifications/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${auth.token}` } });
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const deleteBookmark = async (id) => {
    await fetch(`${API_URL}/bookmarks/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${auth.token}` } });
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  const upcoming = meetings.filter(m => !isPast(m.scheduledAt)).slice(0, 5);
  const todayNotifs = notifications.slice(0, 10);

  return (
    <div className="updates-page">
      <div className="updates-header">
        <h1>Today's Updates</h1>
        <p>{new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</p>
      </div>

      {loading ? (
        <div className="updates-loading">
          <div className="loadingDots"><span/><span/><span/></div>
          Loading…
        </div>
      ) : (
        <div className="updates-body">

          {/* ── Notifications ── */}
          <section className="updates-section">
            <div className="updates-section-header">
              <div className="updates-section-title">
                🔔 Notifications
                {unreadCount > 0 && <span className="updates-badge">{unreadCount}</span>}
              </div>
              {unreadCount > 0 && (
                <button className="updates-action-btn" onClick={markAllRead}>Mark all read</button>
              )}
            </div>

            {todayNotifs.length === 0 ? (
              <div className="updates-empty">No notifications</div>
            ) : (
              <div className="updates-list">
                {todayNotifs.map(n => (
                  <div
                    key={n.id}
                    className={`updates-item ${!n.isRead ? "updates-item--unread" : ""}`}
                    onClick={() => { if (n.chatId) navigate(`/chats/${n.chatId}`); }}
                  >
                    <div className="updates-item-avatar">
                      {(n.senderName || "?")[0].toUpperCase()}
                    </div>
                    <div className="updates-item-body">
                      <div className="updates-item-title">{n.title}</div>
                      {n.body && <div className="updates-item-text">{n.body}</div>}
                      <div className="updates-item-time">{timeAgo(n.createdAt)}</div>
                    </div>
                    {!n.isRead && <span className="updates-unread-dot" />}
                    <button className="updates-delete-btn" onClick={e => { e.stopPropagation(); deleteNotif(n.id); }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Upcoming Meetings ── */}
          <section className="updates-section">
            <div className="updates-section-header">
              <div className="updates-section-title">📅 Upcoming Meetings</div>
              <button className="updates-action-btn" onClick={() => navigate("/meet")}>View all</button>
            </div>

            {upcoming.length === 0 ? (
              <div className="updates-empty">No upcoming meetings</div>
            ) : (
              <div className="updates-list">
                {upcoming.map(m => (
                  <div key={m.id} className="updates-item updates-meet-item">
                    <div className="updates-meet-icon">
                      <svg viewBox="0 0 48 48" width="22" height="22">
                        <path fill="#4285F4" d="M44 24c0-1.3-.1-2.5-.3-3.7H24v7h11.3c-.5 2.5-1.9 4.6-4 6v5h6.5C41.2 35 44 30 44 24z"/>
                        <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.5-5c-1.8 1.2-4.1 1.9-7 1.9-5.4 0-9.9-3.6-11.5-8.5H5.8v5.2C9.1 39.8 16 44 24 44z"/>
                        <path fill="#FBBC05" d="M12.5 27.5c-.4-1.2-.7-2.5-.7-3.8s.2-2.6.7-3.8v-5.2H5.8C4.6 17.1 4 20.5 4 24s.6 6.9 1.8 9.3l6.7-5.8z"/>
                        <path fill="#EA4335" d="M24 12.5c3 0 5.7 1 7.8 3l5.8-5.8C34.1 6.5 29.4 4.5 24 4.5 16 4.5 9.1 8.7 5.8 15.2l6.7 5.2c1.6-4.9 6.1-7.9 11.5-7.9z"/>
                      </svg>
                    </div>
                    <div className="updates-item-body">
                      <div className="updates-item-title">{m.title}</div>
                      <div className="updates-item-text">{formatMeetTime(m.scheduledAt)}</div>
                      <div className="updates-item-text">By {m.createdBy?.name || "You"}</div>
                    </div>
                    <a href={m.meet_link} target="_blank" rel="noopener noreferrer" className="updates-join-btn">
                      Join
                    </a>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Bookmarks ── */}
          <section className="updates-section">
            <div className="updates-section-header">
              <div className="updates-section-title">🔖 Saved Messages</div>
            </div>

            {bookmarks.length === 0 ? (
              <div className="updates-empty">No saved messages</div>
            ) : (
              <div className="updates-list">
                {bookmarks.slice(0, 8).map(b => (
                  <div
                    key={b.id}
                    className="updates-item"
                    onClick={() => { if (b.chatId) navigate(`/chats/${b.chatId}`); }}
                  >
                    <div className="updates-item-avatar updates-item-avatar--bookmark">🔖</div>
                    <div className="updates-item-body">
                      <div className="updates-item-title">{b.senderName}</div>
                      <div className="updates-item-text">{b.text || "📎 Attachment"}</div>
                      <div className="updates-item-time">{timeAgo(b.messageCreatedAt)}</div>
                    </div>
                    <button className="updates-delete-btn" onClick={e => { e.stopPropagation(); deleteBookmark(b.id); }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      )}
    </div>
  );
}
