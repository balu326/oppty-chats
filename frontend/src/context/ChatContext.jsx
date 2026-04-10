// @refresh reset
import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { getAuthUser } from "../utils/auth.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const STORAGE_KEY = "oppty_chat_v1";
const READ_STORAGE_KEY = "oppty_chat_read_v1";

function loadReadTimestamps() {
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveReadTimestamps(map) {
  try { localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(map)); } catch {}
}

function buildDmChatId(userA, userB) {
  return `dm_${[String(userA), String(userB)].sort().join("_")}`;
}

function getEntityId(value) {
  return value?._id || value?.id || value;
}

function normalizeBackendMessage(message, currentEmployeeId) {
  const senderId = String(getEntityId(message.sender) || "");
  const createdAt = message.createdAt || message.created_at || new Date().toISOString();

  return {
    id: String(message._id || message.id || uid()),
    chatId: String(message.chatId || message.chat_id || ""),
    sender: senderId && String(currentEmployeeId) === senderId ? "me" : "other",
    text: message.text || "",
    createdAt: new Date(createdAt).getTime(),
    senderName: message.sender?.name || "Unknown",
    senderAvatar: message.sender?.avatarUrl || null,
    attachment: message.attachment || null,
    isRead: message.isRead || message.is_read || false,
  };
}

// localStorage functions for persistence
function loadChats() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveChats(chats) {
  try {
    // Only persist chat metadata, never messages (avoids stale/duplicate message issues)
    const withoutMessages = chats.map(({ messages, isLoadingMessages, ...rest }) => rest);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(withoutMessages));
  } catch { /* silent */ }
}

function uid() {
  return crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function handleAuthError(response) {
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem("employeeAuth");
    window.location.href = "/login";
    return true;
  }
  return false;
}

async function loadEmployeesFromBackend() {
  try {
    const authUser = getAuthUser();
    if (!authUser?.token) return [];

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
    const response = await fetch(`${API_URL}/auth/employees`, {
      headers: {
        Authorization: `Bearer ${authUser.token}`,
      },
    });
    if (handleAuthError(response)) return [];
    const data = await response.json();
    
    if (data.success && Array.isArray(data.employees)) {
      return data.employees.map((emp) => ({
        id: String(emp._id || emp.id),
        kind: "dm",
        name: emp.name,
        avatarUrl: emp.avatarUrl || `https://i.pravatar.cc/100?u=${encodeURIComponent(emp.email)}`,
        isOnline: false,
        lastSeen: "last seen recently",
        about: "Hey there! I am using Oppty Chats.",
        contact: emp.email,
        blocked: false,
        messages: [],
        employeeId: String(emp._id || emp.id),
        role: emp.role,
        canCreateGroups: Boolean(emp.canCreateGroups),
      }));
    }
    return [];
  } catch (error) {
    console.error("Failed to load employees from backend:", error);
    return [];
  }
}

async function loadGroupsFromBackend() {
  try {
    const authUser = getAuthUser();
    if (!authUser?.token) return [];

    const response = await fetch(`${API_URL}/groups`, {
      headers: {
        Authorization: `Bearer ${authUser.token}`,
      },
    });
    if (handleAuthError(response)) return [];
    const data = await response.json();

    if (data.success && Array.isArray(data.groups)) {
      return data.groups.map((group) => ({
        id: String(group._id || group.id),
        kind: "group",
        name: group.name,
        avatarUrl: `https://i.pravatar.cc/100?u=${encodeURIComponent(`group-${group._id || group.id}`)}`,
        isOnline: false,
        lastSeen: "",
        about: group.description || "Official team discussion group.",
        contact: group.name,
        blocked: false,
        isAdmin: true,
        members: Array.isArray(group.members)
          ? group.members.map((member) => ({
              id: String(member._id || member.id),
              name: member.name,
              email: member.email,
              role: member.role || "employee",
            }))
          : [],
        messages: [],
        isLoadingMessages: false,
        canManageGroup: Boolean(group.canManage),
        adminsOnly: Boolean(group.adminsOnly),
      }));
    }

    return [];
  } catch (error) {
    console.error("Failed to load groups from backend:", error);
    return [];
  }
}

async function initializeChats() {
  const persisted = loadChats();
  const merged = normalizeAndMerge(persisted);
  const authUser = getAuthUser();

  if (!authUser?.employeeId || !authUser?.token) {
    saveChats(merged);
    return merged;
  }

  const [employees, groups] = await Promise.all([
    loadEmployeesFromBackend(),
    loadGroupsFromBackend(),
  ]);

  const mergedById = new Map(merged.map((chat) => [String(chat.id), chat]));

  const employeeChats = employees
    .filter((chat) => String(chat.employeeId) !== String(authUser.employeeId))
    .map((chat) => {
      const conversationId = buildDmChatId(authUser.employeeId, chat.employeeId);
      const existing = mergedById.get(String(conversationId));

      return {
        ...existing,
        ...chat,
        id: conversationId,
        messages: [],
        isLoadingMessages: false,
      };
    });

  const groupChats = groups.map((chat) => {
    const existing = mergedById.get(String(chat.id));

    return {
      ...existing,
      ...chat,
      messages: [],
      isLoadingMessages: false,
    };
  });

  const serverChats = [...employeeChats, ...groupChats];

  if (serverChats.length === 0) {
    saveChats(merged);
    return merged;
  }

  saveChats(serverChats);
  return serverChats;
}

const seed = [
  {
    id: "1",
    kind: "dm",
    name: "Elena@oppty",
    avatarUrl: "https://i.pravatar.cc/100?img=5",
    isOnline: true,
    lastSeen: "",
    about: "Hey there! I am using Oppty Chats.",
    contact: "elena@oppty.com",
    blocked: false,
    messages: [
      {
        id: uid(),
        chatId: "1",
        sender: "them",
        text: "Here are all the files. Let me know once you’ve had a look.",
        createdAt: Date.now() - 1000 * 60 * 55,
      },
    ],
  },
  {
    id: "2",
    kind: "dm",
    name: "Dhamodhar@oppty",
    avatarUrl: "https://i.pravatar.cc/100?img=12",
    isOnline: false,
    lastSeen: "last seen today at 10:21",
    about: "Hey there! I am using Oppty Chats.",
    contact: "Not available",
    blocked: false,
    messages: [
      {
        id: uid(),
        chatId: "2",
        sender: "them",
        text: "Video call later?",
        createdAt: Date.now() - 1000 * 60 * 180,
      },
      {
        id: uid(),
        chatId: "2",
        sender: "me",
        text: "Sure—send a time.",
        createdAt: Date.now() - 1000 * 60 * 175,
      },
    ],
  },
  {
    id: "g1",
    kind: "group",
    name: "Oppty Team",
    avatarUrl: "https://i.pravatar.cc/100?img=20",
    isOnline: false,
    lastSeen: "",
    about: "Official team discussion group.",
    contact: "opptyteam@oppty.com",
    isAdmin: true,
    blocked: false,
    members: [
      { id: "emp-1", name: "Employee One", email: "employee@oppty.com" },
      { id: "emp-3", name: "Maya", email: "maya@oppty.com" },
    ],
    messages: [
      {
        id: uid(),
        chatId: "g1",
        sender: "them",
        text: "Welcome to Oppty Team group!",
        createdAt: Date.now() - 1000 * 60 * 300,
      },
    ],
  },
];

function normalizeAndMerge(persisted) {
  if (!Array.isArray(persisted)) return seed;

  const persistedNormalized = persisted.map((c) => ({
    ...c,
    id:
      c.kind === "dm" && typeof c.id === "string" && /^\d+_\d+$/.test(c.id)
        ? `dm_${c.id}`
        : c.id,
    kind: c.kind ?? "dm",
    about: c.about ?? "Hey there! I am using Oppty Chats.",
    contact: c.contact ?? "Not available",
    isAdmin: c.isAdmin ?? false,
    blocked: c.blocked ?? false,
    members: Array.isArray(c.members) ? c.members : [],
    messages: Array.isArray(c.messages) ? c.messages : [],
  }));

  const byId = new Map(persistedNormalized.map((c) => [c.id, c]));
  for (const s of seed) {
    if (!byId.has(s.id)) byId.set(s.id, s);
  }

  return Array.from(byId.values());
}

const ChatContext = createContext(null);

function isSystemAdmin() {
  const auth = getAuthUser();
  return auth?.role === "superadmin";
}

function reducer(state, action) {
  switch (action.type) {
    case "INIT": {
      const uniqueChatsMap = new Map();
      action.chats.forEach(chat => {
        if (!uniqueChatsMap.has(chat.id)) uniqueChatsMap.set(chat.id, chat);
      });
      return { chats: Array.from(uniqueChatsMap.values()) };
    }

    case "RESET":
      saveChats(seed);
      return { chats: seed };

    case "SEND": {
      const text = action.text.trim();
      if (!text) return state;

      const target = state.chats.find((c) => c.id === action.chatId);
      if (!target || target.blocked) return state;

      const isDuplicate = target.messages.some(m =>
        m.text.trim() === text.trim() && (Date.now() - m.createdAt) < 5000
      );
      if (isDuplicate) return state;

      const tempId = `temp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const msg = {
        id: tempId,
        chatId: action.chatId,
        sender: "me",
        text,
        createdAt: Date.now(),
        tempId,
        replyTo: action.replyTo || null,
      };

      const chats = state.chats.map((c) =>
        c.id === action.chatId ? { ...c, messages: [...c.messages, msg] } : c
      );

      const updated = chats.find((c) => c.id === action.chatId);
      const rest = chats.filter((c) => c.id !== action.chatId);
      const next = updated ? [updated, ...rest] : chats;

      saveChats(next);

      window.lastMessageSentTime = Date.now();
      window.lastMessageSentChatId = action.chatId;

      const authUser = getAuthUser();
      if (authUser?.employeeId) {
        fetch(`${API_URL}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authUser.token}`,
          },
          body: JSON.stringify({
            chatId: action.chatId,
            senderId: authUser.employeeId,
            text: text
          }),
          cache: 'no-cache'
        })
        .then(res => res.json())
        .catch(err => console.error('Backend save failed:', err));
      }

      return { chats: next };
    }

    case "RECEIVE_MESSAGE": {
      const incomingMessage = action.message;
      if (!incomingMessage?.chatId) return state;

      const next = state.chats.map((chat) => {
        if (String(chat.id) !== String(incomingMessage.chatId)) return chat;

        // Already have this exact ID
        const alreadyExists = (chat.messages || []).some(
          (message) => String(message.id) === String(incomingMessage.id)
        );
        if (alreadyExists) return chat;

        // Remove optimistic/temp duplicates: same sender + same text + within 10s
        const filtered = (chat.messages || []).filter((message) => {
          const isTemp = String(message.id).startsWith("temp_") || String(message.tempId || "").startsWith("temp_");
          const sameSender = message.sender === incomingMessage.sender;
          const sameText = (message.text || "").trim() === (incomingMessage.text || "").trim();
          const closeInTime = Math.abs((message.createdAt || 0) - (incomingMessage.createdAt || 0)) < 10000;
          // Drop temp messages that match the confirmed backend message
          if (isTemp && sameSender && sameText && closeInTime) return false;
          return true;
        });

        return {
          ...chat,
          messages: [...filtered, incomingMessage].sort((a, b) => a.createdAt - b.createdAt),
        };
      });

      saveChats(next);
      return { chats: next };
    }

    case "UPDATE_CHAT_NAME": {
      const name = action.name.trim();
      if (!name) return state;

      const next = state.chats.map((chat) => {
        if (String(chat.id) !== String(action.chatId)) return chat;

        if (isSystemAdmin()) return { ...chat, name };
        if (chat.kind === "group" && !chat.canManageGroup) return chat;

        return { ...chat, name };
      });

      saveChats(next);
      return { chats: next };
    }

    case "ADD_CONTACT": {
      const name = action.payload.name.trim();
      if (!name) return state;
      const authUser = getAuthUser();
      const backendEmployeeId = action.payload.employeeId;
      const chatId =
        authUser?.employeeId && backendEmployeeId
          ? buildDmChatId(authUser.employeeId, backendEmployeeId)
          : uid();

      const newChat = {
        id: chatId,
        kind: "dm",
        name,
        avatarUrl:
          action.payload.avatarUrl ||
          `https://i.pravatar.cc/100?u=${encodeURIComponent(name + Date.now())}`,
        isOnline: false,
        lastSeen: "last seen recently",
        about: "Hey there! I am using Oppty Chats.",
        contact: action.payload.contact?.trim() || "Not available",
        blocked: false,
        messages: [],
        employeeId: backendEmployeeId || null,
        role: action.payload.role || "employee",
      };

      const remainingChats = state.chats.filter((chat) => String(chat.id) !== String(newChat.id));
      const next = [newChat, ...remainingChats];
      saveChats(next);
      return { chats: next };
    }

    case "ADD_GROUP": {
      const name = action.payload.name.trim();
      if (!name) return state;

      const newGroup = {
        id: action.payload.id || uid(),
        kind: "group",
        name,
        avatarUrl:
          action.payload.avatarUrl ||
          `https://i.pravatar.cc/100?u=${encodeURIComponent("group_" + name + Date.now())}`,
        isOnline: false,
        lastSeen: "",
        about: action.payload.about?.trim() || "New group created in Oppty Chats.",
        contact: action.payload.contact?.trim() || "Not available",
        isAdmin: true,
        blocked: false,
        members: [],
        messages: [],
        canManageGroup: true,
      };

      const remainingChats = state.chats.filter((chat) => String(chat.id) !== String(newGroup.id));
      const next = [newGroup, ...remainingChats];
      saveChats(next);
      return { chats: next };
    }

    case "DELETE_CHAT": {
      if (!isSystemAdmin()) return state;
      const next = state.chats.filter((chat) => String(chat.id) !== String(action.chatId));
      saveChats(next);
      return { chats: next };
    }

    case "LOAD_MESSAGES": {
      const { chatId, messages } = action.payload;

      const chats = state.chats.map((chat) => {
        if (chat.id !== chatId) return chat;

        const employeeId = chat.employeeId || (chat.kind === "dm" ? chat.id : null);

        // Deduplicate: backend messages are source of truth.
        // Remove any local message (optimistic or temp) that matches a backend message
        // by same text + sender + close timestamp (within 10s).
        const backendIds = new Set(messages.map(m => String(m.id)));

        const pendingOptimistic = chat.messages.filter(m => {
          // Keep if it already has a real backend ID
          if (backendIds.has(String(m.id))) return false;
          // Drop if it matches a backend message by content (optimistic duplicate)
          const matchesBackend = messages.some(bm =>
            bm.sender === m.sender &&
            (bm.text || "").trim() === (m.text || "").trim() &&
            Math.abs((bm.createdAt || 0) - (m.createdAt || 0)) < 10000
          );
          return !matchesBackend;
        });

        const merged = [...messages, ...pendingOptimistic]
          .sort((a, b) => a.createdAt - b.createdAt);

        return { ...chat, employeeId, messages: merged, isLoadingMessages: false };
      });

      saveChats(chats);
      return { chats };
    }

    case "DELETE_MESSAGE": {
      const next = state.chats.map((chat) => {
        if (String(chat.id) !== String(action.chatId)) return chat;
        return { ...chat, messages: chat.messages.filter(m => String(m.id) !== String(action.msgId)) };
      });
      saveChats(next);
      return { chats: next };
    }

    case "PIN_MESSAGE": {
      const next = state.chats.map((chat) => {
        if (String(chat.id) !== String(action.chatId)) return chat;
        return {
          ...chat,
          messages: chat.messages.map(m =>
            String(m.id) === String(action.msgId)
              ? { ...m, pinned: !m.pinned }
              : m
          ),
        };
      });
      saveChats(next);
      return { chats: next };
    }

    case "MARK_MESSAGES_READ": {
      // Mark all messages in a chat as read
      const next = state.chats.map((chat) => {
        if (String(chat.id) !== String(action.chatId)) return chat;
        return {
          ...chat,
          messages: chat.messages.map((m) =>
            m.sender === "me" ? { ...m, isRead: true } : m
          ),
        };
      });
      return { chats: next };
    }

    case "SET_ONLINE": {
      // Update online status for a chat (DM)
      const next = state.chats.map((chat) => {
        if (String(chat.employeeId) !== String(action.employeeId)) return chat;
        return { ...chat, isOnline: action.isOnline, lastSeen: action.isOnline ? "" : "last seen recently" };
      });
      return { chats: next };
    }

    case "TOGGLE_BLOCK_CHAT": {
      if (!isSystemAdmin()) return state;
      const next = state.chats.map((chat) =>
        String(chat.id) === String(action.chatId)
          ? { ...chat, blocked: !chat.blocked }
          : chat
      );
      saveChats(next);
      return { chats: next };
    }

    case "ADD_GROUP_MEMBER": {
      const next = state.chats.map((chat) => {
        if (String(chat.id) !== String(action.chatId) || chat.kind !== "group") return chat;

        const exists = (chat.members || []).some(
          (member) => String(member.id) === String(action.member.id)
        );
        if (exists) return chat;

        return {
          ...chat,
          members: [...(chat.members || []), action.member],
        };
      });

      saveChats(next);
      return { chats: next };
    }

    case "REMOVE_GROUP_MEMBER": {
      const next = state.chats.map((chat) => {
        if (String(chat.id) !== String(action.chatId) || chat.kind !== "group") return chat;

        return {
          ...chat,
          members: (chat.members || []).filter(
            (member) => String(member.id) !== String(action.memberId)
          ),
        };
      });

      saveChats(next);
      return { chats: next };
    }

    default:
      return state;
  }
}

export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { chats: [] }); // Start with EMPTY data
  const [loading, setLoading] = useState(true);
  const [readTimestamps, setReadTimestamps] = useState(loadReadTimestamps);

  // Initialize chats with employees from backend on mount
  useEffect(() => {
    const init = async () => {
      try {
        const authUser = getAuthUser();

        if (!authUser?.employeeId) {
          dispatch({ type: "INIT", chats: seed });
          setLoading(false);
          return;
        }

        const chats = await initializeChats();

        if (Array.isArray(chats) && chats.length > 0) {
          dispatch({ type: "INIT", chats });
        } else {
          dispatch({ type: "INIT", chats: seed });
        }
      } catch (error) {
        console.error("Failed to initialize chats:", error);
        dispatch({ type: "INIT", chats: seed });
      } finally {
        setLoading(false);
      }
    };

    init();
    // Poll periodically so new employees/groups show up without a refresh.
    const pollInterval = setInterval(async () => {
      try {
        const authUser = getAuthUser();
        if (!authUser?.employeeId) return;

        const chats = await initializeChats();
        if (Array.isArray(chats) && chats.length > 0) {
          dispatch({ type: "INIT", chats });
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 30000);
    
    return () => clearInterval(pollInterval);
  }, []);

  const api = useMemo(
    () => {
      const getUnreadCount = (chatId) => {
        const chat = state.chats.find((c) => String(c.id) === String(chatId));
        if (!chat?.messages?.length) return 0;
        const lastRead = readTimestamps[String(chatId)] || 0;
        return chat.messages.filter(
          (m) => m.sender !== "me" && (m.createdAt || 0) > lastRead
        ).length;
      };

      const markRead = (chatId) => {
        const updated = { ...readTimestamps, [String(chatId)]: Date.now() };
        setReadTimestamps(updated);
        saveReadTimestamps(updated);
      };

      return {
      chats: state.chats,
      loading: loading,
      getChatById: (id) => state.chats.find((c) => String(c.id) === String(id)),
      getUnreadCount,
      markRead,
      sendMessage: (chatId, text, replyTo = null) => dispatch({ type: "SEND", chatId, text, replyTo }),
      deleteMessage: (chatId, msgId) => dispatch({ type: "DELETE_MESSAGE", chatId, msgId }),
      pinMessage: (chatId, msgId) => dispatch({ type: "PIN_MESSAGE", chatId, msgId }),
      updateChatName: (chatId, name) =>
        dispatch({ type: "UPDATE_CHAT_NAME", chatId, name }),
      addContact: (payload) => dispatch({ type: "ADD_CONTACT", payload }),
      addGroup: (payload) => dispatch({ type: "ADD_GROUP", payload }),
      deleteChat: (chatId) => dispatch({ type: "DELETE_CHAT", chatId }),
      toggleBlockChat: (chatId) => dispatch({ type: "TOGGLE_BLOCK_CHAT", chatId }),
      addGroupMember: async (chatId, member) => {
        const authUser = getAuthUser();
        if (!authUser?.token || !authUser?.employeeId) return;

        const response = await fetch(`${API_URL}/groups/${chatId}/members/${member.id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authUser.token}`,
          },
        });
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || "Failed to add employee to group");
        }

        dispatch({ type: "ADD_GROUP_MEMBER", chatId, member });
      },
      removeGroupMember: async (chatId, memberId) => {
        const authUser = getAuthUser();
        if (!authUser?.token || !authUser?.employeeId) return;

        const response = await fetch(`${API_URL}/groups/${chatId}/members/${memberId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authUser.token}`,
          },
        });
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || "Failed to remove employee from group");
        }

        dispatch({ type: "REMOVE_GROUP_MEMBER", chatId, memberId });
      },
      loadMessages: (chatId, messages) => dispatch({ type: "LOAD_MESSAGES", payload: { chatId, messages } }),
      markMessagesRead: (chatId) => dispatch({ type: "MARK_MESSAGES_READ", chatId }),
      setOnline: (employeeId, isOnline) => dispatch({ type: "SET_ONLINE", employeeId, isOnline }),
      receiveMessage: (message) => {
        const normalized = normalizeBackendMessage(message, getAuthUser()?.employeeId);
        // Show popup only for messages from others (not sent by me)
        if (normalized.sender !== "me" && normalized.text) {
          import("../components/common/MessagePopup.jsx").then(({ triggerMessagePopup }) => {
            triggerMessagePopup({
              senderName: normalized.senderName || "Someone",
              senderAvatar: normalized.senderAvatar || null,
              text: normalized.text,
              chatId: normalized.chatId,
            });
          });
        }
        dispatch({ type: "RECEIVE_MESSAGE", message: normalized });
      },
      resetChats: () => dispatch({ type: "RESET" }),
      isAdmin: isSystemAdmin(),
    };
    },
    [state.chats, loading, readTimestamps]
  );

  return <ChatContext.Provider value={api}>{children}</ChatContext.Provider>;
}

export function useChats() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChats must be used inside ChatProvider");
  return ctx;
}
