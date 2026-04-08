import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useChats } from "../../context/ChatContext.jsx";
import { useMediaQuery } from "../../hooks/useMediaQuery.js";
import { getAuthUser } from "../../utils/auth.js";
import MessageBubble from "./MessageBubble.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const QUICK_EMOJIS = ["😀", "😂", "😍", "🔥", "👍", "🎉", "🙏", "💡", "🚀", "❤️"];

function normalizeMessage(msg, myEmployeeId) {
  const senderId = msg.sender?._id?.toString() || msg.sender?.id?.toString() || msg.sender?.toString() || "";
  const createdAt = msg.createdAt || msg.created_at || new Date().toISOString();

  return {
    id: msg._id || msg.id,
    chatId: msg.chatId || msg.chat_id,
    sender: String(senderId) === String(myEmployeeId) ? "me" : "other",
    text: msg.text || "",
    createdAt: new Date(createdAt).getTime(),
    senderName: msg.sender?.name || "Unknown",
    senderAvatar: msg.sender?.avatarUrl || null,
    attachment: msg.attachment || null,
  };
}

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
    deleteMessage,
    updateChatName,
    deleteChat,
    toggleBlockChat,
    addGroupMember,
    removeGroupMember,
    loadMessages,
    receiveMessage,
    markRead,
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
  const [contactInfo, setContactInfo] = useState(null); // fetched from backend
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showEmojiTray, setShowEmojiTray] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [websocketAvailable, setWebsocketAvailable] = useState(true);
  // Selection & forward state
  const [selectedMsgs, setSelectedMsgs] = useState(new Set());
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardTargetId, setForwardTargetId] = useState("");
  // Reply state
  const [replyTo, setReplyTo] = useState(null);
  // Reactions — stored in localStorage, keyed by chatId
  const [reactionsMap, setReactionsMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`reactions_${chatId}`) || "{}"); } catch { return {}; }
  });
  // Typing indicator
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const documentInputRef = useRef(null);

  // Refs to prevent duplicate message sends
  const lastMessageSentRef = useRef({ text: '', timestamp: 0 });
  const lastMessageSentTimeRef = useRef(0); // Track when we last sent
  const isSendingRef = useRef(false); // Mutex lock to prevent concurrent sends
  const receiveMessageRef = useRef(receiveMessage);

  // Define ALL refs NEXT
  const endRef = useRef(null);
  const optionsRef = useRef(null);
  const searchInputRef = useRef(null);
  const editNameInputRef = useRef(null);
  const messageRefs = useRef({});

  // NOW get chat after hooks
  const chat = chatId ? getChatById(chatId) : null;

  // Auth/role checks — needed before onSend callback
  const authUserForChat = getAuthUser();
  const isSuperAdmin = authUserForChat?.role === "superadmin";
  const isAdminRole = authUserForChat?.role === "admin" || authUserForChat?.role === "superadmin";
  const groupAdminsOnly = chat?.kind === "group" && chat?.adminsOnly === true;
  const blockedByAdminsOnly = groupAdminsOnly && !isAdminRole;

  // Define ALL callbacks BEFORE any conditional returns
  const onSend = useCallback(() => {
    // CRITICAL: Mutex lock - prevent concurrent sends
    if (isSendingRef.current) {
      return;
    }
    
    const v = text.trim();
    if (!v || !chat || chat.blocked || blockedByAdminsOnly || isSending) return;
    
    // Prevent sending same message within 3 seconds
    const timeSinceLastMessage = Date.now() - lastMessageSentRef.current.timestamp;
    if (lastMessageSentRef.current.text === v && timeSinceLastMessage < 3000) {
      return;
    }
    
    // Set mutex lock
    isSendingRef.current = true;
    setIsSending(true);
    
    // Update last sent ref IMMEDIATELY
    lastMessageSentRef.current = { text: v, timestamp: Date.now() };
    lastMessageSentTimeRef.current = Date.now();
    
    sendMessage(chat.id, v, replyTo);
    setText("");
    setReplyTo(null);
    
    // Release lock after delay
    setTimeout(() => {
      isSendingRef.current = false;
      setIsSending(false);
    }, 1000);
  }, [text, chat, chat?.id, chat?.blocked, isSending, sendMessage, setText]);

  const canSend = text.trim().length > 0;
  const canManageGroup = isSuperAdmin;
  const canEditName = isSuperAdmin || chat?.kind !== "group";

  const availableEmployees = useMemo(() => {
    if (!chat || chat.kind !== "group") return [];
    const memberIds = new Set((chat.members || []).map((m) => String(m.id)));
    return chats
      .filter((candidate) => candidate.kind === "dm" && candidate.employeeId)
      .map((candidate) => ({
        id: candidate.employeeId,
        name: candidate.name,
        email: candidate.contact || candidate.email || "",
      }))
      .filter((emp) => !memberIds.has(String(emp.id)));
  }, [chat, chats]);

  // Scroll to bottom when messages change
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatId, chat?.messages?.length]);

  // Mark chat as read when opened or new messages arrive
  useEffect(() => {
    if (chatId) markRead(chatId);
  }, [chatId, chat?.messages?.length]);

  // Reset reactions when chat changes
  useEffect(() => {
    try {
      setReactionsMap(JSON.parse(localStorage.getItem(`reactions_${chatId}`) || "{}"));
    } catch { setReactionsMap({}); }
  }, [chatId]);

  // Always reload messages from backend when chatId changes or component mount
  const lastLoadedChatIdRef = useRef(null);
  const lastLoadTimeRef = useRef(0);
  
  useEffect(() => {
    // Clear last message sent ref when switching chats
    if (chatId !== lastLoadedChatIdRef.current) {
      lastMessageSentRef.current = { text: '', timestamp: 0 };
    }

    if (!chatId || !chat) return;

    // Prevent loading same chat twice within 10 seconds
    const timeSinceLastLoad = Date.now() - lastLoadTimeRef.current;
    if (lastLoadedChatIdRef.current === chatId && timeSinceLastLoad < 10000) return;

    if (chat.isLoadingMessages) return;

    if (lastLoadedChatIdRef.current === chatId && chat.messages && chat.messages.length > 0) return;

    const timeSinceLastSend = Date.now() - (window.lastMessageSentTime || 0);
    const isSameChat = window.lastMessageSentChatId === chatId;
    if (timeSinceLastSend < 3000 && timeSinceLastSend > 0 && isSameChat) return;

    const loadFromBackend = async () => {
      setLoadingMessages(true);
      try {
        const authUser = getAuthUser();
        const myEmployeeId = authUser?.employeeId;
        const query = chat.kind === "dm" && myEmployeeId ? `?userId=${myEmployeeId}` : "";
        const response = await fetch(`${API_URL}/messages/${chatId}${query}`);
        const data = await response.json();

        if (data.success && Array.isArray(data.messages)) {
          const backendMessages = data.messages.map((msg) => normalizeMessage(msg, myEmployeeId));
          lastLoadedChatIdRef.current = chatId;
          lastLoadTimeRef.current = Date.now();
          loadMessages(chatId, backendMessages);
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setLoadingMessages(false);
      }
    };

    const timer = setTimeout(loadFromBackend, 300);
    return () => clearTimeout(timer);
  }, [chatId, chat?.kind, chat?.messages?.length]);

  useEffect(() => {
    receiveMessageRef.current = receiveMessage;
  }, [receiveMessage]);

  useEffect(() => {
    const authUser = getAuthUser();
    if (!chat?.id || !authUser?.token) return undefined;

    const socketBaseUrl = API_URL.replace(/\/api$/, "").replace(/^http/, "ws");
    const socket = new WebSocket(
      `${socketBaseUrl}/ws/chat/${encodeURIComponent(chat.id)}/?token=${encodeURIComponent(authUser.token)}`
    );
    let opened = false;

    socket.onopen = () => {
      opened = true;
      setWebsocketAvailable(true);
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        receiveMessageRef.current(payload);
      } catch (error) {
        console.error("WebSocket message parse error:", error);
      }
    };

    socket.onerror = (error) => {
      if (!opened) {
        setWebsocketAvailable(false);
      }
    };

    return () => {
      socket.close();
    };
  }, [chat?.id]);

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

    const uniqueMessageMap = new Map();
    chat.messages.forEach(msg => {
      if (!uniqueMessageMap.has(msg.id)) {
        uniqueMessageMap.set(msg.id, msg);
      }
    });

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
    setContactInfo(null);

    // Fetch full employee profile for DM chats
    if (chat.kind === "dm" && chat.employeeId) {
      const auth = getAuthUser();
      fetch(`${API_URL}/auth/employees`, {
        headers: { Authorization: `Bearer ${auth?.token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success && Array.isArray(data.employees)) {
            const emp = data.employees.find(
              (e) => String(e._id || e.id) === String(chat.employeeId)
            );
            if (emp) setContactInfo(emp);
          }
        })
        .catch(() => {});
    }
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
    if (!isSuperAdmin) return;
    deleteChat(chat.id);
    setShowOptionsMenu(false);
    setShowChatInfo(false);
    navigate(chat.kind === "group" ? "/groups" : "/chats");
  };

  const handleToggleBlock = () => {
    if (!isSuperAdmin) return;
    toggleBlockChat(chat.id);
    setShowOptionsMenu(false);
  };

  const handleAddMember = () => {
    if (!canManageGroup || chat.kind !== "group" || !selectedMemberId) return;
    const employee = availableEmployees.find((emp) => String(emp.id) === String(selectedMemberId));
    if (!employee) return;

    addGroupMember(chat.id, {
      id: employee.id,
      name: employee.name,
      email: employee.email,
    })
      .then(() => setSelectedMemberId(""))
      .catch((error) => {
        console.error("Add member error:", error);
        alert(error.message || "Failed to add employee to group");
      });
  };

  const handleRemoveMember = (memberId) => {
    if (!canManageGroup || chat.kind !== "group") return;
    removeGroupMember(chat.id, memberId).catch((error) => {
      console.error("Remove member error:", error);
      alert(error.message || "Failed to remove employee from group");
    });
  };

  const handleAttachClick = () => {
    setShowEmojiTray(false);
    setShowAttachMenu(!showAttachMenu);
  };

  const handleEmojiInsert = (emoji) => {
    setText((current) => `${current}${emoji}`);
    setShowEmojiTray(false);
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
        receiveMessage(data.message);
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
    } catch {
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
        receiveMessage(data.message);
      }
    })
    .catch(error => {
      console.error('Error sending link:', error);
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

  const toggleSelectMsg = (id) => {
    setSelectedMsgs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedMsgs(new Set());

  const handleForward = () => {
    if (selectedMsgs.size === 0 || !forwardTargetId) {
      alert('Please select a chat to forward to');
      return;
    }

    const texts = [...selectedMsgs].map(id => {
      for (const g of groups) {
        const m = g.messages.find(msg => String(msg.id) === String(id));
        if (m) {
          if (typeof m.text === "string") return m.text;
          if (m.rawText && typeof m.rawText === "string") return m.rawText;
          return String(m.text ?? "");
        }
      }
      return "";
    }).filter(Boolean);

    if (texts.length === 0) {
      alert('No valid messages to forward');
      return;
    }

    texts.forEach((text, index) => {
      setTimeout(() => {
        sendMessage(forwardTargetId, `↪ ${text}`);
      }, index * 300);
    });

    setTimeout(() => {
      setShowForwardModal(false);
      clearSelection();
    }, 500);
  };

  const handleDeleteMessage = (msgId) => {
    deleteMessage(chatId, msgId);
  };

  const handleBookmark = async (message) => {
    const auth = getAuthUser();
    if (!auth?.token || !message?.id) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/bookmarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ messageId: message.id }),
      });
    } catch { /* silent */ }
  };

  const handleReact = (msgId, emoji) => {
    const key = `reactions_${chatId}`;
    const stored = JSON.parse(localStorage.getItem(key) || "{}");
    const userId = getAuthUser()?.employeeId || "me";
    const msgKey = String(msgId);
    if (!stored[msgKey]) stored[msgKey] = {};
    if (!stored[msgKey][emoji]) stored[msgKey][emoji] = [];
    const idx = stored[msgKey][emoji].indexOf(userId);
    if (idx >= 0) stored[msgKey][emoji].splice(idx, 1);
    else stored[msgKey][emoji].push(userId);
    localStorage.setItem(key, JSON.stringify(stored));
    setReactionsMap({ ...stored });
  };

  const getReactions = (msgId) => reactionsMap[String(msgId)] || {};

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
                : chat.kind === "group" && chat.adminsOnly
                ? "🔒 admins only · " + (chat.members?.length || 0) + " members"
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
              <button type="button" className="chatOptionsItem" onClick={() => { setSelectedMsgs(new Set()); setShowOptionsMenu(false); if (groups.flatMap(g=>g.messages).length > 0) toggleSelectMsg(String(groups[0]?.messages[0]?.id)); }}>
                Select messages
              </button>
              <button type="button" className="chatOptionsItem" onClick={handleCloseSearch}>
                Clear search
              </button>

              <button type="button" className="chatOptionsItem" onClick={handleScrollToLatest}>
                Scroll to latest
              </button>

              {isSuperAdmin && (
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
          <aside className="chatInfoDrawer" onClick={(e) => e.stopPropagation()} aria-label="Contact info">

            {/* Header */}
            <div className="chatInfoDrawerHeader">
              <span className="chatInfoDrawerTitle">
                {chat.kind === "group" ? "Group info" : "Contact info"}
              </span>
              <button type="button" className="iconBtn" onClick={handleCloseChatInfo} aria-label="Close">✕</button>
            </div>

            {/* Hero */}
            <div className="chatInfoHero">
              <div className="chatInfoAvatarWrap">
                {chat.avatarUrl ? (
                  <img className="chatInfoHeroAvatar" src={chat.avatarUrl} alt={chat.name}
                    onError={(e) => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} />
                ) : null}
                <div className="chatInfoHeroInitials" style={{ display: chat.avatarUrl ? "none" : "flex" }}>
                  {(chat.name || "?").slice(0, 2).toUpperCase()}
                </div>
              </div>

              <div className="chatInfoHeroName">{chat.name}</div>
              <div className="chatInfoHeroRole">
                {contactInfo?.role
                  ? contactInfo.role.charAt(0).toUpperCase() + contactInfo.role.slice(1)
                  : chat.kind === "group"
                  ? `${chat.members?.length || 0} members`
                  : chat.contact || ""}
              </div>

              {/* Action buttons */}
              <div className="chatInfoActions">
                <button type="button" className="chatInfoActionBtn" onClick={handleCloseChatInfo}>
                  <span className="chatInfoActionIcon">💬</span>
                  <span>Chat</span>
                </button>
                {isSuperAdmin && (
                  <button type="button" className="chatInfoActionBtn danger" onClick={handleToggleBlock}>
                    <span className="chatInfoActionIcon">{chat.blocked ? "🔓" : "🚫"}</span>
                    <span>{chat.blocked ? "Unblock" : "Block"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Info rows */}
            <div className="chatInfoSection">

              {/* Phone */}
              {(contactInfo?.phone || chat.kind === "dm") && (
                <div className="chatInfoRow">
                  <span className="chatInfoRowIcon">📞</span>
                  <div className="chatInfoRowBody">
                    <div className="chatInfoRowValue">{contactInfo?.phone || "Not set"}</div>
                    <div className="chatInfoRowLabel">Phone</div>
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="chatInfoRow">
                <span className="chatInfoRowIcon">✉️</span>
                <div className="chatInfoRowBody">
                  <div className="chatInfoRowValue">{contactInfo?.email || chat.contact || "Not available"}</div>
                  <div className="chatInfoRowLabel">Email</div>
                </div>
              </div>

              {/* Bio */}
              {contactInfo?.bio && (
                <div className="chatInfoRow">
                  <span className="chatInfoRowIcon">ℹ️</span>
                  <div className="chatInfoRowBody">
                    <div className="chatInfoRowValue">{contactInfo.bio}</div>
                    <div className="chatInfoRowLabel">About</div>
                  </div>
                </div>
              )}

              {/* Group members */}
              {chat.kind === "group" && (
                <div className="chatInfoGroupSection">
                  <div className="chatInfoGroupTitle">{chat.members?.length || 0} Members</div>
                  {(chat.members || []).map((member) => (
                    <div key={member.id} className="chatInfoMemberRow">
                      <div className="chatInfoMemberAvatar">
                        {(member.name || "?").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="chatInfoMemberInfo">
                        <div className="chatInfoMemberName">{member.name}</div>
                        <div className="chatInfoMemberRole">{member.role || "employee"}</div>
                      </div>
                      {canManageGroup && (
                        <button type="button" className="chatInfoMemberRemove" onClick={() => handleRemoveMember(member.id)}>✕</button>
                      )}
                    </div>
                  ))}

                  {canManageGroup && (
                    <div className="chatInfoAddMember">
                      <select className="groupMemberSelect" value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)}>
                        <option value="">Add member…</option>
                        {availableEmployees.map((emp) => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                      </select>
                      <button type="button" className="chatInfoAddBtn" onClick={handleAddMember} disabled={!selectedMemberId}>Add</button>
                    </div>
                  )}
                </div>
              )}

              {/* Admin danger zone */}
              {isSuperAdmin && (
                <button type="button" className="chatInfoDeleteBtn" onClick={handleDeleteChat}>
                  🗑 Delete {chat.kind === "group" ? "group" : "chat"}
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      <section className="messages" aria-label="Messages">
        {loadingMessages && (
          <div className="loadingMessages">Loading messages...</div>
        )}
        {!websocketAvailable && (
          <div className="loadingMessages">Live updates unavailable. Using refresh polling.</div>
        )}

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
                const isSelected = selectedMsgs.has(String(m.id));

                return (
                  <div
                    key={m.id}
                    ref={(el) => { messageRefs.current[m.id] = el; }}
                    className={`msgSelectRow ${isActiveMatched ? "chatMatchedMessageActive" : ""} ${isSelected ? "msgSelected" : ""}`}
                    onClick={() => selectedMsgs.size > 0 && toggleSelectMsg(String(m.id))}
                  >
                    {selectedMsgs.size > 0 && (
                      <input
                        type="checkbox"
                        className="msgCheckbox"
                        checked={isSelected}
                        onChange={() => toggleSelectMsg(String(m.id))}
                        onClick={e => e.stopPropagation()}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <MessageBubble
                        message={{
                          ...m,
                          reactions: getReactions(m.id),
                          text: isMatched ? (
                            <HighlightText text={m.text} query={searchTerm} />
                          ) : m.text,
                          rawText: typeof m.text === "string" ? m.text : m.rawText,
                        }}
                        isSelected={isSelected}
                        onReply={setReplyTo}
                        onDelete={handleDeleteMessage}
                        onReact={handleReact}
                        onSelect={() => toggleSelectMsg(String(m.id))}
                        onBookmark={handleBookmark}
                      />
                    </div>
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

      {blockedByAdminsOnly && (
        <div className="adminsOnlyBanner">
          🔒 Only admins can send messages in this group
        </div>
      )}

      {/* Selection toolbar */}
      {selectedMsgs.size > 0 && (
        <div className="selectionToolbar">
          <button className="selToolBtn" onClick={clearSelection}>✕ Cancel</button>
          <span className="selToolCount">{selectedMsgs.size} selected</span>
          <button className="selToolBtn primary" onClick={() => setShowForwardModal(true)}>↪ Forward</button>
        </div>
      )}

      {/* Forward modal */}
      {showForwardModal && (
        <div className="meetModalOverlay" onClick={() => setShowForwardModal(false)}>
          <div className="meetModal meetModalSm" onClick={e => e.stopPropagation()}>
            <div className="meetModalHeader">
              <div className="meetModalHeaderLeft"><span>↪</span><h2>Forward to</h2></div>
              <button className="meetModalClose" onClick={() => setShowForwardModal(false)}>✕</button>
            </div>
            <div style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
              <select
                className="groupMemberSelect"
                value={forwardTargetId}
                onChange={e => setForwardTargetId(e.target.value)}
                style={{ height: 44, fontSize: 14 }}
              >
                <option value="">Select a chat…</option>
                {chats.filter(c => c.id !== chatId).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button className="meetBtn meetBtnOutline" onClick={() => setShowForwardModal(false)}>Cancel</button>
                <button className="meetBtn meetBtnPrimary" onClick={handleForward} disabled={!forwardTargetId}>Forward</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reply bar */}
      {replyTo && (
        <div className="replyBar">
          <div className="replyBarContent">
            <div className="replyBarLine" />
            <div>
              <div className="replyBarName">{replyTo.senderName || "Message"}</div>
              <div className="replyBarText">{typeof replyTo.text === "string" ? replyTo.text.slice(0, 80) : "📎 Attachment"}</div>
            </div>
          </div>
          <button className="replyBarClose" onClick={() => setReplyTo(null)}>✕</button>
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

        <div className="composerCenter">
          <button
            type="button"
            className="emojiBtn"
            aria-label="Add emoji"
            title="Add emoji"
            onClick={() => {
              setShowAttachMenu(false);
              setShowEmojiTray((current) => !current);
            }}
          >
            🙂
          </button>

          {showEmojiTray && (
            <div className="emojiTray">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="emojiChip"
                  onClick={() => handleEmojiInsert(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <textarea
            className="composerInput"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              chat.blocked
                ? "This chat is blocked by admin"
                : blockedByAdminsOnly
                ? "Only admins can send messages in this group"
                : "Write a message"
            }
            rows={1}
            disabled={chat.blocked || blockedByAdminsOnly}
            onFocus={() => {
              setShowAttachMenu(false);
              setShowEmojiTray(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                onSend();
              }
            }}
          />
        </div>

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
          disabled={!canSend || chat.blocked || blockedByAdminsOnly || isSending}
        >
          <svg className="sendIcon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </footer>
    </div>
  );
}
