import React from "react";

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({ message }) {
  const mine = message.sender === "me";
  const initial = (message.senderName || "?").slice(0, 1).toUpperCase();

  const renderAttachment = () => {
    if (!message.attachment) return null;

    const { type, url, fileName } = message.attachment;
    const assetBaseUrl = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/api\/?$/, "");

    const resolveUrl = (u) => {
      if (!u) return "";
      if (u.startsWith("http")) return u;
      return `${assetBaseUrl}${u}`;
    };

    const resolvedUrl = resolveUrl(url);

    // Detect image by extension if type is wrong
    const isImage = type === "photo" ||
      /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(url || "");
    const isVideo = type === "video" ||
      /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url || "");

    if (isImage) {
      return (
        <div className="messageAttachment photo">
          <a href={resolvedUrl} target="_blank" rel="noopener noreferrer">
            <img
              src={resolvedUrl}
              alt={fileName || "image"}
              className="attachmentImage"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          </a>
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="messageAttachment video">
          <video controls className="attachmentVideo">
            <source src={resolvedUrl} />
          </video>
        </div>
      );
    }

    if (type === "link") {
      return (
        <div className="messageAttachment link">
          <a href={url} target="_blank" rel="noopener noreferrer" className="linkPreview">
            <span>🔗</span>
            <span>{url}</span>
          </a>
        </div>
      );
    }

    // document / fallback
    return (
      <div className="messageAttachment document">
        <a href={resolvedUrl} target="_blank" rel="noopener noreferrer" className="documentLink">
          <span>📄</span>
          <span>{fileName || "File"}</span>
        </a>
      </div>
    );
  };

  return (
    <div className={`bubbleRow ${mine ? "mine" : "theirs"}`}>
      {!mine && (
        <div className="bubbleSenderAvatar">
          {message.senderAvatar
            ? <img
                src={message.senderAvatar}
                alt={message.senderName}
                className="bubbleAvatarImg"
                onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
              />
            : null}
          <span
            className="bubbleAvatarInitial"
            style={{ display: message.senderAvatar ? "none" : "flex" }}
          >
            {initial}
          </span>
        </div>
      )}
      <div className="bubbleContent">
        {!mine && message.senderName && (
          <div className="senderName">{message.senderName}</div>
        )}
        <div className={`bubble ${mine ? "mine" : "theirs"}`}>
          {renderAttachment()}
          {message.text && message.text.trim() && (
            <div className="bubbleText">{message.text}</div>
          )}
          <div className="bubbleMeta">{formatTime(message.createdAt)}</div>
        </div>
      </div>
    </div>
  );
}
