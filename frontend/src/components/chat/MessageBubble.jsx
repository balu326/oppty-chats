import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const REACTIONS = ["👍","❤️","😂","😮","😢","🙏"];

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function resolveUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/api\/?$/, "");
  return `${base}${url}`;
}

// Detect and parse meeting messages
function parseMeetMessage(text) {
  if (!text || !text.startsWith("📅 Meeting:")) return null;
  const lines = text.split("\n");
  const title = lines[0]?.replace("📅 Meeting:", "").trim();
  const time  = lines[1]?.replace("🕐", "").trim();
  const link  = lines[2]?.replace("🔗", "").trim();
  if (!title || !link) return null;
  return { title, time, link };
}

function MeetCard({ meet, mine }) {
  return (
    <div className="chatMeetCard">
      <div className="chatMeetCard__header">
        <svg viewBox="0 0 48 48" width="24" height="24" style={{ flexShrink: 0 }}>
          <path fill="#4285F4" d="M44 24c0-1.3-.1-2.5-.3-3.7H24v7h11.3c-.5 2.5-1.9 4.6-4 6v5h6.5C41.2 35 44 30 44 24z"/>
          <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.5-5c-1.8 1.2-4.1 1.9-7 1.9-5.4 0-9.9-3.6-11.5-8.5H5.8v5.2C9.1 39.8 16 44 24 44z"/>
          <path fill="#FBBC05" d="M12.5 27.5c-.4-1.2-.7-2.5-.7-3.8s.2-2.6.7-3.8v-5.2H5.8C4.6 17.1 4 20.5 4 24s.6 6.9 1.8 9.3l6.7-5.8z"/>
          <path fill="#EA4335" d="M24 12.5c3 0 5.7 1 7.8 3l5.8-5.8C34.1 6.5 29.4 4.5 24 4.5 16 4.5 9.1 8.7 5.8 15.2l6.7 5.2c1.6-4.9 6.1-7.9 11.5-7.9z"/>
        </svg>
        <div className="chatMeetCard__info">
          <div className="chatMeetCard__label">Google Meet</div>
          <div className="chatMeetCard__title">{meet.title}</div>
        </div>
      </div>
      {meet.time && (
        <div className="chatMeetCard__time">🕐 {meet.time}</div>
      )}
      <a
        href={meet.link}
        target="_blank"
        rel="noopener noreferrer"
        className="chatMeetCard__join"
        onClick={e => e.stopPropagation()}
      >
        Join Meeting ▶
      </a>
    </div>
  );
}

function AttachmentView({ attachment }) {
  if (!attachment) return null;
  const { type, url, fileName } = attachment;
  const src = resolveUrl(url);
  const isImage = type === "photo" || /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(url || "");
  const isVideo = type === "video" || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url || "");

  if (isImage) return (
    <div className="messageAttachment photo">
      <a href={src} target="_blank" rel="noopener noreferrer">
        <img src={src} alt={fileName || "image"} className="attachmentImage" onError={e => { e.target.style.display="none"; }} />
      </a>
    </div>
  );
  if (isVideo) return (
    <div className="messageAttachment video">
      <video controls className="attachmentVideo"><source src={src} /></video>
    </div>
  );
  if (type === "link") return (
    <div className="messageAttachment link">
      <a href={url} target="_blank" rel="noopener noreferrer" className="linkPreview">🔗 {url}</a>
    </div>
  );
  return (
    <div className="messageAttachment document">
      <a href={src} target="_blank" rel="noopener noreferrer" className="documentLink">📄 {fileName || "File"}</a>
    </div>
  );
}

export default function MessageBubble({ message, onReply, onDelete, onReact, onSelect, isSelected, onDoubleClick, onBookmark, onPin }) {
  const mine = message.sender === "me";
  const initial = (message.senderName || "?").slice(0, 1).toUpperCase();
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const bubbleRef = useRef(null);
  const menuRef = useRef(null);
  const longPressRef = useRef(null);
  const clickTimerRef = useRef(null);

  // Calculate smart menu position anchored to the bubble
  const openMenu = (e) => {
    if (bubbleRef.current) {
      const rect = bubbleRef.current.getBoundingClientRect();
      const menuH = 220; // estimated menu height
      const menuW = 180;
      // Prefer above the bubble; flip below if not enough space
      let top = rect.top - menuH - 8;
      if (top < 8) top = rect.bottom + 8;
      // Align right for mine, left for theirs; clamp to viewport
      let left = mine ? rect.right - menuW : rect.left;
      if (left + menuW > window.innerWidth - 8) left = window.innerWidth - menuW - 8;
      if (left < 8) left = 8;
      setMenuPos({ top, left });
    }
    setShowMenu(true);
  };

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
        setShowReactions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  // Long press for mobile
  const handleTouchStart = (e) => {
    longPressRef.current = setTimeout(() => openMenu(e), 500);
  };
  const handleTouchEnd = () => clearTimeout(longPressRef.current);

  // Resolve raw text regardless of whether it's a string or JSX element
  const getRawText = () => {
    if (typeof message.text === "string") return message.text;
    if (message.rawText && typeof message.rawText === "string") return message.rawText;
    return "";
  };

  const handleCopy = () => {
    const raw = getRawText();
    if (raw) {
      navigator.clipboard.writeText(raw).catch(() => {
        const el = document.createElement("textarea");
        el.value = raw;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      });
    }
    setShowMenu(false);
  };

  const handleDoubleClick = (e) => {
    e.preventDefault();
    clearTimeout(clickTimerRef.current);
    openMenu(e);
    onDoubleClick?.(message);
  };

  const handleReply = () => { onReply?.(message); setShowMenu(false); };
  const handleDelete = () => { onDelete?.(message.id); setShowMenu(false); };
  const handleReact = (emoji) => { onReact?.(message.id, emoji); setShowReactions(false); setShowMenu(false); };
  const handleSelect = () => { onSelect?.(String(message.id)); setShowMenu(false); };
  const handleBookmark = () => { onBookmark?.(message); setShowMenu(false); };
  const handlePin = () => { onPin?.(message); setShowMenu(false); };

  const reactions = message.reactions || {};
  const reactionEntries = Object.entries(reactions).filter(([, users]) => users?.length > 0);

  const contextMenu = showMenu && createPortal(
    <div
      ref={menuRef}
      className="bubbleMenuPortal"
      style={{ top: menuPos.top, left: menuPos.left }}
    >
      {!showReactions ? (
        <>
          <button className="bubbleMenuItem" onClick={() => setShowReactions(true)}>😊 React</button>
          <button className="bubbleMenuItem" onClick={handleReply}>↩ Reply</button>
          {(message.text || message.rawText) && (
            <button className="bubbleMenuItem" onClick={handleCopy}>📋 Copy</button>
          )}
          <button className="bubbleMenuItem" onClick={handleSelect}>☑ Select</button>
          <button className="bubbleMenuItem" onClick={handleBookmark}>💾 Save Message</button>
          <button className="bubbleMenuItem" onClick={handlePin}>
            {message.pinned ? "📌 Unpin" : "📌 Pin Message"}
          </button>
          {mine && (
            <button className="bubbleMenuItem danger" onClick={handleDelete}>🗑 Delete</button>
          )}
        </>
      ) : (
        <div className="reactionPicker">
          {REACTIONS.map(e => (
            <button key={e} className="reactionPickerBtn" onClick={() => handleReact(e)}>{e}</button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );

  return (
    <div
      className={`bubbleRow ${mine ? "mine" : "theirs"} ${isSelected ? "bubbleSelected" : ""}`}
      onContextMenu={e => { e.preventDefault(); openMenu(e); }}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {!mine && (
        <div className="bubbleSenderAvatar">
          {message.senderAvatar
            ? <img src={message.senderAvatar} alt={message.senderName} className="bubbleAvatarImg"
                onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} />
            : null}
          <span className="bubbleAvatarInitial" style={{ display: message.senderAvatar ? "none" : "flex" }}>
            {initial}
          </span>
        </div>
      )}

      <div className="bubbleContent" ref={bubbleRef}>
        {!mine && message.senderName && <div className="senderName">{message.senderName}</div>}

        {/* Reply preview */}
        {message.replyTo && (
          <div className={`replyPreview ${mine ? "mine" : "theirs"}`}>
            <div className="replyPreviewBar" />
            <div className="replyPreviewText">
              <span className="replyPreviewName">{message.replyTo.senderName || "Message"}</span>
              <span className="replyPreviewMsg">{message.replyTo.text || "📎 Attachment"}</span>
            </div>
          </div>
        )}

        <div className={`bubble ${mine ? "mine" : "theirs"} ${message.pinned ? "bubble--pinned" : ""}`}>
          <AttachmentView attachment={message.attachment} />
          {message.pinned && (
            <div className="pinnedIndicator">📌 Pinned</div>
          )}
          {message.text && typeof message.text === "string" && message.text.trim() && (() => {
            const meet = parseMeetMessage(message.text);
            if (meet) return <MeetCard meet={meet} mine={mine} />;
            return <div className="bubbleText">{message.text}</div>;
          })()}
          {message.text && typeof message.text !== "string" && (
            <div className="bubbleText">{message.text}</div>
          )}
          <div className="bubbleMeta">
            {formatTime(message.createdAt)}
            {mine && (
              <span className={`readTick ${message.isRead ? "readTick--blue" : ""}`}>
                <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
                  <path d="M1 5.5L4.5 9L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 5.5L9.5 9L15 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            )}
          </div>
        </div>

        {/* Reactions */}
        {reactionEntries.length > 0 && (
          <div className={`reactionRow ${mine ? "mine" : ""}`}>
            {reactionEntries.map(([emoji, users]) => (
              <button key={emoji} className="reactionChip" onClick={() => handleReact(emoji)}>
                {emoji} {users.length > 1 ? users.length : ""}
              </button>
            ))}
          </div>
        )}
      </div>

      {contextMenu}
    </div>
  );
}
