import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./BookmarksPage.css";

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
  return new Date(iso).toLocaleDateString();
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const fetchBookmarks = useCallback(async () => {
    const auth = getAuthUser();
    if (!auth?.token) return;
    try {
      const res = await fetch(`${API_URL}/bookmarks`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      const data = await res.json();
      if (data.success) setBookmarks(data.bookmarks || []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookmarks(); }, [fetchBookmarks]);

  const handleDelete = async (id) => {
    const auth = getAuthUser();
    await fetch(`${API_URL}/bookmarks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleOpen = (chatId) => {
    if (chatId) navigate(`/chats/${chatId}`);
  };

  const filtered = bookmarks.filter((b) =>
    !search || (b.text || "").toLowerCase().includes(search.toLowerCase()) ||
    (b.senderName || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bookmarks-page">
      <div className="bookmarks-header">
        <h1 className="bookmarks-title">🔖 Bookmarks</h1>
        <p className="bookmarks-subtitle">{bookmarks.length} saved message{bookmarks.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="bookmarks-search-wrap">
        <input
          className="bookmarks-search"
          placeholder="Search bookmarks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="bookmarks-loading">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bookmarks-empty">
          <span className="bookmarks-empty-icon">🔖</span>
          <p>{search ? "No results found" : "No bookmarks yet"}</p>
          <span className="bookmarks-empty-hint">
            {!search && "Right-click or long-press any message and choose Bookmark"}
          </span>
        </div>
      ) : (
        <div className="bookmarks-list">
          {filtered.map((b) => (
            <div key={b.id} className="bookmark-card" onClick={() => handleOpen(b.chatId)}>
              <div className="bookmark-card-top">
                <span className="bookmark-sender">{b.senderName}</span>
                <span className="bookmark-time">{timeAgo(b.messageCreatedAt)}</span>
              </div>
              {b.text && <div className="bookmark-text">{b.text}</div>}
              {b.attachment && (
                <div className="bookmark-attachment">
                  {b.attachment.type === "photo" ? "📷 Photo" :
                   b.attachment.type === "video" ? "🎥 Video" :
                   b.attachment.type === "link"  ? `🔗 ${b.attachment.url}` :
                   `📄 ${b.attachment.fileName || "File"}`}
                </div>
              )}
              {b.note && <div className="bookmark-note">📝 {b.note}</div>}
              <button
                className="bookmark-delete-btn"
                onClick={(e) => { e.stopPropagation(); handleDelete(b.id); }}
                aria-label="Remove bookmark"
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
