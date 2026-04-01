import React from "react";

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({ message }) {
  const mine = message.sender === "me";

  console.log('💬 MessageBubble RENDER:', { 
    sender: message.sender, 
    isMine: mine,
    text: message.text?.substring(0, 30),
    hasAttachment: !!message.attachment,
    attachmentType: message.attachment?.type,
    className: `bubbleRow ${mine ? "mine" : "theirs"}`
  });

  const renderAttachment = () => {
    if (!message.attachment) return null;

    const { type, url, fileName } = message.attachment;
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

    switch (type) {
      case 'photo':
        return (
          <div className="messageAttachment photo">
            <img src={`${apiUrl}${url}`} alt={fileName} className="attachmentImage" />
          </div>
        );
      
      case 'video':
        return (
          <div className="messageAttachment video">
            <video controls className="attachmentVideo">
              <source src={`${apiUrl}${url}`} />
              Your browser does not support the video tag.
            </video>
          </div>
        );
      
      case 'link':
        return (
          <div className="messageAttachment link">
            <a href={url} target="_blank" rel="noopener noreferrer" className="linkPreview">
              🔗 {url}
            </a>
          </div>
        );
      
      case 'document':
      default:
        return (
          <div className="messageAttachment document">
            <a href={`${apiUrl}${url}`} download className="documentLink">
              📄 {fileName}
            </a>
          </div>
        );
    }
  };

  return (
    <div className={`bubbleRow ${mine ? "mine" : "theirs"}`}>
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
  );
}