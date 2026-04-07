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

export default function MessageBubble({ message, onReply, onDelete, onReact, onSelect, isSelected, onDoubleClick, onBookmark }) {
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
          <button className="bubbleMenuItem" onClick={handleBookmark}>🔖 Bookmark</button>
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

        <div className={`bubble ${mine ? "mine" : "theirs"}`}>
          <AttachmentView attachment={message.attachment} />
          {message.text && typeof message.text === "string" && message.text.trim() && (
            <div className="bubbleText">{message.text}</div>
          )}
          {message.text && typeof message.text !== "string" && (
            <div className="bubbleText">{message.text}</div>
          )}
          <div className="bubbleMeta">
            {formatTime(message.createdAt)}
            {mine && <span className="readTick">{message.read ? "✓✓" : "✓"}</span>}
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
