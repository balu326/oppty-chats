import React, { useEffect, useRef, useState } from "react";

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

export default function MessageBubble({ message, onReply, onDelete, onReact, onSelect, isSelected }) {
  const mine = message.sender === "me";
  const initial = (message.senderName || "?").slice(0, 1).toUpperCase();
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const menuRef = useRef(null);
  const longPressRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu && !showReactions) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
        setShowReactions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu, showReactions]);

  // Long press for mobile
  const handleTouchStart = () => {
    longPressRef.current = setTimeout(() => setShowMenu(true), 500);
  };
  const handleTouchEnd = () => {
    clearTimeout(longPressRef.current);
  };

  const handleCopy = () => {
    if (message.text && typeof message.text === "string") {
      navigator.clipboard.writeText(message.text);
    }
    setShowMenu(false);
  };

  const handleReply = () => {
    onReply?.(message);
    setShowMenu(false);
  };

  const handleDelete = () => {
    onDelete?.(message.id);
    setShowMenu(false);
  };

  const handleReact = (emoji) => {
    onReact?.(message.id, emoji);
    setShowReactions(false);
    setShowMenu(false);
  };

  const handleSelect = () => {
    onSelect?.(String(message.id));
    setShowMenu(false);
  };

  const reactions = message.reactions || {};
  const reactionEntries = Object.entries(reactions).filter(([, users]) => users?.length > 0);

  return (
    <div
      className={`bubbleRow ${mine ? "mine" : "theirs"} ${isSelected ? "bubbleSelected" : ""}`}
      onContextMenu={e => { e.preventDefault(); setShowMenu(true); }}
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

      <div className="bubbleContent" ref={menuRef}>
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

        {/* Context menu */}
        {showMenu && (
          <div className={`bubbleMenu ${mine ? "mine" : "theirs"}`}>
            {!showReactions ? (
              <>
                <button className="bubbleMenuItem" onClick={() => setShowReactions(true)}>😊 React</button>
                <button className="bubbleMenuItem" onClick={handleReply}>↩ Reply</button>
                {message.text && typeof message.text === "string" && (
                  <button className="bubbleMenuItem" onClick={handleCopy}>📋 Copy</button>
                )}
                <button className="bubbleMenuItem" onClick={handleSelect}>☑ Select</button>
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
          </div>
        )}
      </div>
    </div>
  );
}
