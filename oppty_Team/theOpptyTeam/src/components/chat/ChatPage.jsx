import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useChats } from "../../context/ChatContext.jsx";
import { useMediaQuery } from "../../hooks/useMediaQuery.js";
import { employeeDB } from "../../data/employees";
import { getAuthUser } from "../../utils/auth.js";
import MessageBubble from "./MessageBubble.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function formatDay(ts) {
  return new Date(ts).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightText({ text, query }) {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
  const parts = String(text).split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={`${part}-${index}`} className="chatSearchHighlight">
        {part}
      </mark>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    )
  );
}

export default function ChatPage() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery("(min-width: 900px)");

  const {
    getChatById,
    sendMessage,
    updateChatName,
    deleteChat,
    toggleBlockChat,
    addGroupMember,
    removeGroupMember,
    loadMessages,
    isAdmin,
    loading,
    chats,
  } = useChats();

  // Define ALL state hooks FIRST before any conditions
  const [text, setText] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const documentInputRef = useRef(null);

  // Refs to prevent duplicate message sends
  const lastMessageSentRef = useRef({ text: '', timestamp: 0 });
  const lastMessageSentTimeRef = useRef(0); // Track when we last sent
  const isSendingRef = useRef(false); // Mutex lock to prevent concurrent sends

  // Define ALL refs NEXT
  const endRef = useRef(null);
  const optionsRef = useRef(null);
  const searchInputRef = useRef(null);
  const editNameInputRef = useRef(null);
  const messageRefs = useRef({});

  // NOW get chat after hooks
  const chat = chatId ? getChatById(chatId) : null;

  console.log('🎯 Chat selected:', { 
    chatId, 
    chatExists: !!chat, 
    chatName: chat?.name,
    chatKind: chat?.kind,
    employeeId: chat?.employeeId,
    messageCount: chat?.messages?.length 
  });

  // Define ALL callbacks BEFORE any conditional returns
  const onSend = useCallback(() => {
    // CRITICAL: Mutex lock - prevent concurrent sends
    if (isSendingRef.current) {
      console.log('⛔ BLOCKED: Already sending a message');
      return;
    }
    
    const v = text.trim();
    if (!v || !chat || chat.blocked || isSending) return;
    
    // Prevent sending same message within 3 seconds (increased from 2)
    const timeSinceLastMessage = Date.now() - lastMessageSentRef.current.timestamp;
    if (lastMessageSentRef.current.text === v && timeSinceLastMessage < 3000) {
      console.log('⚠️ Preventing duplicate send:', { 
        text: v, 
        lastSent: lastMessageSentRef.current.text,
        timeDiff: timeSinceLastMessage 
      });
      return;
    }
    
    console.log('🚀 onSend called:', { text: v, chatId: chat.id });
    
    // Set mutex lock
    isSendingRef.current = true;
    setIsSending(true);
    
    // Update last sent ref IMMEDIATELY
    lastMessageSentRef.current = { text: v, timestamp: Date.now() };
    lastMessageSentTimeRef.current = Date.now(); // Track when we sent
    
    sendMessage(chat.id, v);
    setText("");
    
    // Release lock after delay
    setTimeout(() => {
      isSendingRef.current = false;
      setIsSending(false);
      console.log('🔓 Released send lock');
    }, 1000); // 1 second lock
  }, [text, chat, chat?.id, chat?.blocked, isSending, sendMessage, setText]);

  const canSend = text.trim().length > 0;
  const canEditName =
    isAdmin || chat?.kind !== "group" || chat?.isAdmin === true;

  const availableEmployees = useMemo(() => {
    if (!chat || chat.kind !== "group") return [];
    const memberIds = new Set((chat.members || []).map((m) => String(m.id)));
    return employeeDB.filter((emp) => !memberIds.has(String(emp.id)));
  }, [chat]);

  // Scroll to bottom when messages change
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatId, chat?.messages?.length]);

  // Always reload messages from backend when chatId changes or component mount
  const lastLoadedChatIdRef = useRef(null);
  const lastLoadTimeRef = useRef(0);
  
  useEffect(() => {
    // Clear last message sent ref when switching chats
    if (chatId !== lastLoadedChatIdRef.current) {
      lastMessageSentRef.current = { text: '', timestamp: 0 };
      console.log('🔄 Cleared last message ref for new chat');
    }
    
    console.log('🔍 Checking chat object:', { 
      chatId, 
      chatExists: !!chat, 
      hasEmployeeId: !!chat?.employeeId,
      employeeId: chat?.employeeId,
      chatKind: chat?.kind,
      fullChat: chat,
      messageCount: chat?.messages?.length,
      lastLoadedChatId: lastLoadedChatIdRef.current,
      timeSinceLastLoad: Date.now() - lastLoadTimeRef.current
    });
    
    if (!chatId || !chat?.employeeId) {
      console.log('⚠️ Skipping message load - no chatId or employeeId', { chatId, hasEmployeeId: !!chat?.employeeId });
      return;
    }
    
    // Prevent loading same chat twice within 10 seconds (increased from 5)
    const timeSinceLastLoad = Date.now() - lastLoadTimeRef.current;
    if (lastLoadedChatIdRef.current === chatId && timeSinceLastLoad < 10000) {
      console.log('⏭️ Skipping - already loaded this chat recently (within 10s)');
      return;
    }
    
    // Prevent duplicate loading
    if (chat.isLoadingMessages) {
      console.log('⏭️ Already loading messages for this chat');
      return;
    }
    
    // Don't reload if we already have messages and this is the same chat
    // This is the key fix - once loaded, don't reload unless chat changes
    if (lastLoadedChatIdRef.current === chatId && chat.messages && chat.messages.length > 0) {
      console.log('⏭️ Already loaded messages for this chat, keeping existing:', chat.messages.length);
      return;
    }
    
    // CRITICAL: Don't reload if we just sent a message (within last 3 seconds)
    // This prevents the duplicate where optimistic + backend load both add the same message
    const timeSinceLastSend = Date.now() - (window.lastMessageSentTime || 0);
    const isSameChat = window.lastMessageSentChatId === chatId;
    
    if (timeSinceLastSend < 3000 && timeSinceLastSend > 0 && isSameChat) {
      console.log('⏭️ Skipping message load - just sent a message', timeSinceLastSend, 'ms ago');
      return;
    }
    
    // Debounce to prevent rapid reloading when switching chats or adding new users
    const loadFromBackend = async () => {
      setLoadingMessages(true);
      try {
        const authUser = getAuthUser();
        const myEmployeeId = authUser?.employeeId;
        
        console.log('🔵 Loading messages for chat:', chatId, 'user:', myEmployeeId);
        
        // Fetch messages for this specific user
        const response = await fetch(`${API_URL}/messages/${chatId}?userId=${myEmployeeId}`);
        const data = await response.json();
        
        console.log('🟢 Loaded messages from backend:', data.messages?.length || 0);
        
        if (data.success && Array.isArray(data.messages)) {
          // Convert backend messages to frontend format
          const backendMessages = data.messages.map(msg => {
            const senderId = msg.sender?._id?.toString() || msg.sender?.toString() || msg.sender;
            const isMyMessage = String(senderId) === String(myEmployeeId);
            
            return {
              id: msg._id,
              chatId: msg.chatId,
              sender: isMyMessage ? 'me' : 'other',
              text: msg.text,
              createdAt: new Date(msg.createdAt).getTime(),
              senderName: msg.sender?.name || 'Unknown'
            };
          });
          
          console.log('💾 Processed messages:', backendMessages.length);
          
          // Update tracking refs BEFORE calling loadMessages
          lastLoadedChatIdRef.current = chatId;
          lastLoadTimeRef.current = Date.now();
          
          // Use context function to load messages
          loadMessages(chatId, backendMessages);
        }
      } catch (error) {
        console.error('❌ Failed to load messages from backend:', error);
      } finally {
        setLoadingMessages(false);
      }
    };
    
    // Small delay to ensure chat is loaded first and prevent rapid fire requests
    const timer = setTimeout(() => {
      console.log('⏱️ Debounced message load starting...');
      loadFromBackend();
    }, 300);
    
    return () => {
      clearTimeout(timer);
      console.log('🧹 Cleanup: cancelled previous message load');
    };
  }, [chatId, chat?.employeeId, chat?.messages?.length]); // Also depend on message count

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (isEditingName) editNameInputRef.current?.focus();
  }, [isEditingName]);

  // Click outside and keyboard event handlers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setShowOptionsMenu(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowOptionsMenu(false);
        setShowChatInfo(false);
        setIsEditingName(false);

        if (searchOpen) {
          setSearchOpen(false);
          setSearchTerm("");
          setActiveSearchIndex(0);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [searchOpen]);

  // Calculate matched messages for search
  const matchedMessages = useMemo(() => {
    if (!chat?.messages?.length || !searchTerm.trim()) return [];
    return chat.messages.filter((m) =>
      m.text?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [chat, searchTerm]);

  // Search navigation reset
  useEffect(() => {
    if (!matchedMessages.length) {
      setActiveSearchIndex(0);
      return;
    }
    if (activeSearchIndex >= matchedMessages.length) {
      setActiveSearchIndex(0);
    }
  }, [matchedMessages, activeSearchIndex]);

  // Search result scroll into view
  useEffect(() => {
    if (!matchedMessages.length) return;
    const currentMatch = matchedMessages[activeSearchIndex];
    const node = messageRefs.current[currentMatch.id];
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeSearchIndex, matchedMessages]);

  // Group messages by day - with duplicate prevention
  const groups = useMemo(() => {
    if (!chat?.messages?.length) return [];
    
    console.log('📦 Grouping messages:', { 
      totalMessages: chat.messages.length,
      messageIds: chat.messages.map(m => ({ id: m.id, text: m.text.substring(0, 20), createdAt: m.createdAt }))
    });
    
    // Remove duplicates by message ID before grouping
    const uniqueMessageMap = new Map();
    chat.messages.forEach(msg => {
      // Keep the first occurrence of each message ID
      if (!uniqueMessageMap.has(msg.id)) {
        uniqueMessageMap.set(msg.id, msg);
      } else {
        console.warn('⚠️ Duplicate message ID detected:', {
          id: msg.id,
          text: msg.text.substring(0, 30),
          existingMsg: uniqueMessageMap.get(msg.id)
        });
      }
    });
    
    console.log('✅ Unique messages after deduplication:', uniqueMessageMap.size);
    
    const map = new Map();
    for (const m of uniqueMessageMap.values()) {
      const day = formatDay(m.createdAt);
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(m);
    }

    return Array.from(map.entries()).map(([day, messages]) => ({ day, messages }));
  }, [chat?.messages]); // Only depend on messages, not entire chat object

  // NOW show loading/error states AFTER all hooks
  if (loading) {
    return (
      <div className="chatEmpty">
        <div className="muted">Loading...</div>
      </div>
    );
  }

  if (chatId && !chat) {
    return (
      <div className="chatEmpty">
        <div className="muted">Loading chat...</div>
        <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>This may take a moment</div>
      </div>
    );
  }

  if (!chat) {
    console.error('Chat not found:', chatId, 'Available chats:', chats?.length || 0);
    return (
      <div className="chatEmpty">
        <div className="muted">Chat not found: {chatId}</div>
        <div style={{ fontSize: '12px', marginTop: '8px' }}>
          Please select a contact from the sidebar
        </div>
      </div>
    );
  }

  const handleOpenSearch = () => {
    setSearchOpen(true);
    setShowOptionsMenu(false);
  };

  const handleCloseSearch = () => {
    setSearchOpen(false);
    setSearchTerm("");
    setActiveSearchIndex(0);
  };

  const handleNextMatch = () => {
    if (!matchedMessages.length) return;
    setActiveSearchIndex((prev) => (prev + 1) % matchedMessages.length);
  };

  const handlePrevMatch = () => {
    if (!matchedMessages.length) return;
    setActiveSearchIndex((prev) =>
      prev === 0 ? matchedMessages.length - 1 : prev - 1
    );
  };

  const handleToggleOptions = () => {
    setShowOptionsMenu((prev) => !prev);
  };

  const handleScrollToLatest = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowOptionsMenu(false);
  };

  const handleOpenChatInfo = () => {
    setShowChatInfo(true);
    setShowOptionsMenu(false);
    setEditedName(chat.name || "");
    setIsEditingName(false);
  };

  const handleCloseChatInfo = () => {
    setShowChatInfo(false);
    setIsEditingName(false);
    setEditedName(chat.name || "");
    setSelectedMemberId("");
  };

  const handleStartEditName = () => {
    if (!canEditName) return;
    setEditedName(chat.name || "");
    setIsEditingName(true);
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditedName(chat.name || "");
  };

  const handleSaveEditName = () => {
    const trimmed = editedName.trim();
    if (!trimmed || !canEditName) return;
    updateChatName(chat.id, trimmed);
    setIsEditingName(false);
  };

  const handleDeleteChat = () => {
    if (!isAdmin) return;
    deleteChat(chat.id);
    setShowOptionsMenu(false);
    setShowChatInfo(false);
    navigate(chat.kind === "group" ? "/groups" : "/chats");
  };

  const handleToggleBlock = () => {
    if (!isAdmin) return;
    toggleBlockChat(chat.id);
    setShowOptionsMenu(false);
  };

  const handleAddMember = () => {
    if (!isAdmin || chat.kind !== "group" || !selectedMemberId) return;

    const employee = employeeDB.find((emp) => String(emp.id) === String(selectedMemberId));
    if (!employee) return;

    addGroupMember(chat.id, {
      id: employee.id,
      name: employee.name,
      email: employee.email,
    });

    setSelectedMemberId("");
  };

  const handleRemoveMember = (memberId) => {
    if (!isAdmin || chat.kind !== "group") return;
    removeGroupMember(chat.id, memberId);
  };

  const handleAttachClick = () => {
    setShowAttachMenu(!showAttachMenu);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleSendFile(file);
    }
    e.target.value = '';
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleSendFile(file);
    }
    e.target.value = '';
  };

  const handleDocumentSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleSendFile(file);
    }
    e.target.value = '';
  };

  const handleSendFile = async (file) => {
    if (!chat || chat.blocked) return;

    // Check file size (max 10MB for now)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File is too large. Maximum size is 10MB.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatId', chat.id);
    formData.append('senderId', getAuthUser()?.employeeId);

    try {
      setIsSending(true);
      const response = await fetch(`${API_URL}/messages/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthUser()?.token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ File uploaded successfully:', data.message);
        setShowAttachMenu(false);
      } else {
        console.error('❌ Upload failed:', data.message);
        alert('Failed to upload file: ' + data.message);
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      alert('Error uploading file');
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenLinkModal = () => {
    setShowLinkModal(true);
    setShowAttachMenu(false);
  };

  const handleSendLink = () => {
    if (!linkUrl.trim() || !chat || chat.blocked) return;

    // Basic URL validation
    let url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    try {
      new URL(url);
    } catch (e) {
      alert('Please enter a valid URL');
      return;
    }

    // Send the link using the backend endpoint
    fetch(`${API_URL}/messages/link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthUser()?.token}`
      },
      body: JSON.stringify({
        chatId: chat.id,
        senderId: getAuthUser()?.employeeId,
        url: url
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        console.log('✅ Link sent successfully:', data.message);
        // Reload messages to show the new link message
        loadMessages(chat.id, [...(chat.messages || []), {
          id: data.message._id,
          chatId: chat.id,
          sender: 'me',
          text: data.message.text,
          attachment: data.message.attachment,
          createdAt: new Date(data.message.createdAt).getTime()
        }]);
      }
    })
    .catch(error => {
      console.error('❌ Error sending link:', error);
      alert('Failed to send link');
    });
    
    setLinkUrl('');
    setShowLinkModal(false);
    setShowAttachMenu(false);
  };

  const handleTakePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Create a video element to capture the photo
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
      
      // Capture frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      
      // Convert to blob
      canvas.toBlob(async (blob) => {
        const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
        await handleSendFile(file);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      }, 'image/jpeg');
    } catch (error) {
      console.error('❌ Camera error:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  return (
    <div className="chat">
      <header className="chatHeader">
        {!isDesktop && (
          <button
            className="iconBtn"
            onClick={() => navigate("..", { relative: "path" })}
            aria-label="Back"
          >
            ←
          </button>
        )}

        <button
          type="button"
          className="chatProfileTrigger"
          onClick={handleOpenChatInfo}
          aria-label="Open profile info"
          title="View profile"
        >
          <img className="avatar" src={chat.avatarUrl} alt={chat.name} />
        </button>

        <button
          type="button"
          className="chatHeaderIdentity"
          onClick={handleOpenChatInfo}
          aria-label="Open profile information"
          title="View profile"
        >
          <div className="chatHeaderText">
            <div className="chatHeaderName">{chat.name}</div>
            <div className="chatHeaderMeta">
              {chat.blocked
                ? "blocked by admin"
                : chat.isOnline
                ? "online"
                : chat.lastSeen
                ? chat.lastSeen
                : "offline"}
            </div>
          </div>
        </button>

        <div className="chatHeaderActions" ref={optionsRef}>
          <button
            className="iconBtn"
            aria-label="Search in chat"
            title="Search in chat"
            onClick={handleOpenSearch}
          >
            ⌕
          </button>

          <button
            className="iconBtn"
            aria-label="More options"
            title="More options"
            onClick={handleToggleOptions}
          >
            ⋯
          </button>

          {showOptionsMenu && (
            <div className="chatOptionsMenu">
              <button type="button" className="chatOptionsItem" onClick={handleOpenChatInfo}>
                View chat info
              </button>

              <button type="button" className="chatOptionsItem" onClick={handleCloseSearch}>
                Clear search
              </button>

              <button type="button" className="chatOptionsItem" onClick={handleScrollToLatest}>
                Scroll to latest
              </button>

              {isAdmin && (
                <>
                  <button type="button" className="chatOptionsItem" onClick={handleToggleBlock}>
                    {chat.blocked ? "Unblock" : "Block"}{" "}
                    {chat.kind === "group" ? "group" : "contact"}
                  </button>

                  <button
                    type="button"
                    className="chatOptionsItem chatOptionsItemDanger"
                    onClick={handleDeleteChat}
                  >
                    Delete {chat.kind === "group" ? "group" : "chat"}
                  </button>
                </>
              )}

              <button
                type="button"
                className="chatOptionsItem"
                onClick={() => setShowOptionsMenu(false)}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </header>

      {searchOpen && (
        <div className="chatSearchBar">
          <input
            ref={searchInputRef}
            type="text"
            className="chatSearchInput"
            placeholder="Search in this chat"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setActiveSearchIndex(0);
            }}
          />

          <div className="chatSearchMeta">
            <span className="chatSearchCount">
              {matchedMessages.length
                ? `${activeSearchIndex + 1}/${matchedMessages.length}`
                : "0/0"}
            </span>

            <button
              type="button"
              className="iconBtn"
              onClick={handlePrevMatch}
              disabled={!matchedMessages.length}
              title="Previous"
            >
              ↑
            </button>

            <button
              type="button"
              className="iconBtn"
              onClick={handleNextMatch}
              disabled={!matchedMessages.length}
              title="Next"
            >
              ↓
            </button>

            <button
              type="button"
              className="iconBtn"
              onClick={handleCloseSearch}
              title="Close search"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {showChatInfo && (
        <div className="chatInfoOverlay" onClick={handleCloseChatInfo}>
          <aside
            className="chatInfoDrawer"
            onClick={(e) => e.stopPropagation()}
            aria-label="Chat profile information"
          >
            <div className="chatInfoDrawerHeader">
              <button
                type="button"
                className="iconBtn"
                onClick={handleCloseChatInfo}
                aria-label="Close profile info"
              >
                ←
              </button>
              <div className="chatInfoDrawerTitle">
                {chat.kind === "group" ? "Group info" : "Contact info"}
              </div>
            </div>

            <div className="chatInfoHero">
              <img className="chatInfoHeroAvatar" src={chat.avatarUrl} alt={chat.name} />

              {!isEditingName ? (
                <>
                  <div className="chatInfoHeroName">{chat.name}</div>
                  <div className="chatInfoHeroStatus">
                    {chat.blocked
                      ? "Blocked by admin"
                      : chat.isOnline
                      ? "online"
                      : chat.lastSeen
                      ? chat.lastSeen
                      : "offline"}
                  </div>

                  {canEditName && (
                    <button
                      type="button"
                      className="chatEditNameBtn"
                      onClick={handleStartEditName}
                    >
                      Edit name
                    </button>
                  )}
                </>
              ) : (
                <div className="chatEditNameBox">
                  <input
                    ref={editNameInputRef}
                    type="text"
                    className="chatEditNameInput"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Enter name"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEditName();
                    }}
                  />

                  <div className="chatEditNameActions">
                    <button
                      type="button"
                      className="popup-btn popup-btn-secondary"
                      onClick={handleCancelEditName}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="popup-btn popup-btn-danger"
                      onClick={handleSaveEditName}
                      disabled={!editedName.trim()}
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="chatInfoSection">
              <div className="chatInfoCardRow">
                <span className="chatInfoLabel">About</span>
                <strong className="chatInfoValue">
                  {chat.about || "Hey there! I am using Oppty Chats."}
                </strong>
              </div>

              <div className="chatInfoCardRow">
                <span className="chatInfoLabel">
                  {chat.kind === "group" ? "Group contact" : "Phone / Email"}
                </span>
                <strong className="chatInfoValue">
                  {chat.contact || chat.email || "Not available"}
                </strong>
              </div>

              {chat.kind === "group" && (
                <div className="chatInfoCardRow">
                  <span className="chatInfoLabel">Employees in Group</span>

                  <div className="groupMembersList">
                    {chat.members?.length ? (
                      chat.members.map((member) => (
                        <div key={member.id} className="groupMemberItem">
                          <div className="groupMemberInfo">
                            <strong>{member.name}</strong>
                            <span>{member.email}</span>
                          </div>

                          {isAdmin && (
                            <button
                              type="button"
                              className="groupMemberRemoveBtn"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <span className="muted">No employees added yet.</span>
                    )}
                  </div>
                </div>
              )}

              {isAdmin && chat.kind === "group" && (
                <div className="chatInfoCardRow">
                  <span className="chatInfoLabel">Add Employee</span>

                  <div className="groupAddMemberBox">
                    <select
                      className="groupMemberSelect"
                      value={selectedMemberId}
                      onChange={(e) => setSelectedMemberId(e.target.value)}
                    >
                      <option value="">Select employee</option>
                      {availableEmployees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.email})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      className="popup-btn popup-btn-danger"
                      onClick={handleAddMember}
                      disabled={!selectedMemberId}
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              {isAdmin && (
                <div className="chatInfoAdminActions">
                  <button
                    type="button"
                    className="popup-btn popup-btn-secondary"
                    onClick={handleToggleBlock}
                  >
                    {chat.blocked ? "Unblock" : "Block"}{" "}
                    {chat.kind === "group" ? "Group" : "Contact"}
                  </button>

                  <button
                    type="button"
                    className="popup-btn popup-btn-danger"
                    onClick={handleDeleteChat}
                  >
                    Delete {chat.kind === "group" ? "Group" : "Chat"}
                  </button>
                </div>
              )}
            </div>

            <div className="chatInfoDrawerActions">
              <button
                type="button"
                className="popup-btn popup-btn-secondary"
                onClick={handleCloseChatInfo}
              >
                Close
              </button>
            </div>
          </aside>
        </div>
      )}

      <section className="messages" aria-label="Messages">
        {loadingMessages && (
          <div className="loadingMessages">Loading messages...</div>
        )}
        
        {/* Debug: Log chat messages */}
        {console.log('📋 Chat messages for rendering:', { 
          chatId: chat?.id, 
          messageCount: chat?.messages?.length,
          hasGroups: groups.length > 0,
          groups: groups 
        })}
        
        {groups.map((g) => (
          <div key={g.day}>
            <div className="dayChip">{g.day}</div>

            {g.messages
              .filter((m) =>
                searchTerm.trim()
                  ? m.text?.toLowerCase().includes(searchTerm.toLowerCase())
                  : true
              )
              .map((m) => {
                const isMatched =
                  searchTerm.trim() &&
                  m.text?.toLowerCase().includes(searchTerm.toLowerCase());
                const matchedIndex = matchedMessages.findIndex((item) => item.id === m.id);
                const isActiveMatched = matchedIndex === activeSearchIndex;

                return (
                  <div
                    key={m.id}
                    ref={(el) => {
                      messageRefs.current[m.id] = el;
                    }}
                    className={isActiveMatched ? "chatMatchedMessageActive" : ""}
                  >
                    <MessageBubble
                      message={{
                        ...m,
                        text: isMatched ? (
                          <HighlightText text={m.text} query={searchTerm} />
                        ) : (
                          m.text
                        ),
                      }}
                    />
                  </div>
                );
              })}
          </div>
        ))}
        <div ref={endRef} />
      </section>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="link-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Share a Link</h2>
              <button className="modal-close" onClick={() => setShowLinkModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <label>Paste or type the URL:</label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                autoFocus
              />
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => setShowLinkModal(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-btn"
                onClick={handleSendLink}
              >
                Send Link
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="composer">
        <div className="composerLeft">
          <button
            type="button"
            className="attachBtn"
            aria-label="Add attachment"
            title="Add attachment"
            onClick={handleAttachClick}
          >
            <svg className="attachIcon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>

          {showAttachMenu && (
            <div className="attachMenu">
              <button 
                type="button" 
                className="attachMenuItem"
                onClick={() => fileInputRef.current?.click()}
              >
                📷 Photo
              </button>
              <button 
                type="button" 
                className="attachMenuItem"
                onClick={() => videoInputRef.current?.click()}
              >
                🎥 Video
              </button>
              <button 
                type="button" 
                className="attachMenuItem"
                onClick={handleTakePhoto}
              >
                📸 Take Photo
              </button>
              <button 
                type="button" 
                className="attachMenuItem"
                onClick={handleOpenLinkModal}
              >
                🔗 Link
              </button>
              <button 
                type="button" 
                className="attachMenuItem"
                onClick={() => documentInputRef.current?.click()}
              >
                📁 Any File
              </button>
            </div>
          )}

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            onChange={handleVideoSelect}
          />
          <input
            ref={documentInputRef}
            type="file"
            accept="*/*"
            style={{ display: 'none' }}
            onChange={handleDocumentSelect}
          />
        </div>

        <textarea
          className="composerInput"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={chat.blocked ? "This chat is blocked by admin" : "Type a message"}
          rows={1}
          disabled={chat.blocked}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.stopPropagation();
              onSend();
            }
          }}
        />

        <button
          type="button"
          className="sendBtn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSend();
          }}
          aria-label="Send"
          title="Send"
          disabled={!canSend || chat.blocked || isSending}
        >
          <svg className="sendIcon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </footer>
    </div>
  );
}