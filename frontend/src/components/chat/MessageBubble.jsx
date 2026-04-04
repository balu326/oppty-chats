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

    const resolveUrl = (url) => {
      if (!url) return "";
      if (url.startsWith("http")) return url; // already absolute
      return `${assetBaseUrl}${url}`;
    };

    switch (type) {
      case 'photo':
        return (
          <div className="messageAttachment photo">
            <img src={resolveUrl(url)} alt={fileName || "photo"} className="attachmentImage" />
          </div>
        );
      
      case 'video':
        return (
          <div className="messageAttachment video">
            <video controls className="attachmentVideo">
              <source src={resolveUrl(url)} />
              Your browser does not support the video tag.
            </video>
          </div>
        );
      
      case 'link':
        return (
          <div className="messageAttachment link">
            <a href={url} target="_blank" rel="noopener noreferrer" className="linkPreview">
              <span>🔗</span>
              <span>{url}</span>
            </a>
          </div>
        );
      
      case 'document':
      default:
        return (
          <div className="messageAttachment document">
            <a href={resolveUrl(url)} download className="documentLink">
              <span>📄</span>
              <span>{fileName}</span>
            </a>
          </div>
        );
    }
  };

  return (
    <div className={`bubbleRow ${mine ? "mine" : "theirs"}`}>
      {!mine && (
        <div className="bubbleSenderAvatar">
          {message.senderAvatar
            ? <img src={message.senderAvatar} alt={message.senderName} className="bubbleAvatarImg" />
            : <span className="bubbleAvatarInitial">{initial}</span>
          }
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
