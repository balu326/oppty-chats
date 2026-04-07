import React from 'react';
import './TypingIndicator.css';

const TypingIndicator = ({ userName = 'Someone' }) => {
  return (
    <div className="typing-indicator-container">
      <div className="typing-indicator-avatar">
        {userName.charAt(0).toUpperCase()}
      </div>
      <div className="typing-indicator-bubble">
        <div className="typing-indicator-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      <span className="typing-indicator-text">{userName} is typing...</span>
    </div>
  );
};

export default TypingIndicator;
