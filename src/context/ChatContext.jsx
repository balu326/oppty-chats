// @refresh reset
import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { getAuthUser } from "../utils/auth.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const STORAGE_KEY = "opty_chat_v1"; // Deprecated - kept for backwards compatibility

function uid() {
  return crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

// Deprecated - no longer using localStorage
// function loadChats() { ... }
// function saveChats(chats) { ... }

async function loadEmployeesFromBackend() {
  try {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const response = await fetch(`${API_URL}/auth/employees`);
    const data = await response.json();
    
    if (data.success && Array.isArray(data.employees)) {
      return data.employees.map((emp) => ({
        id: emp._id,
        kind: "dm",
        name: emp.name,
        avatarUrl: `https://i.pravatar.cc/100?u=${encodeURIComponent(emp.email)}`,
        isOnline: false,
        lastSeen: "last seen recently",
        about: "Hey there! I am using Oppty Chats.",
        contact: emp.email,
        blocked: false,
        messages: [],
        employeeId: emp._id,
        role: emp.role
      }));
    }
    return [];
  } catch (error) {
    console.error("Failed to load employees from backend:", error);
    return [];
  }
}

async function initializeChats() {
  // Load persisted chats
  const persisted = loadChats();
  let merged = normalizeAndMerge(persisted);
  
  // Load employees from backend
  const employees = await loadEmployeesFromBackend();
  
  // Merge employees into chats (avoid duplicates)
  const existingIds = new Set(merged.map(c => c.id));
  const newEmployees = employees.filter(emp => !existingIds.has(emp.id));
  
  // Add new employees to chats
  const allChats = [...newEmployees, ...merged];
  
  saveChats(allChats);
  return allChats;
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
  return auth?.role === "admin" || auth?.role === "superadmin";
}

function reducer(state, action) {
  switch (action.type) {
    case "INIT": {
      // Remove duplicate chats by ID before initializing
      const uniqueChatsMap = new Map();
      action.chats.forEach(chat => {
        if (!uniqueChatsMap.has(chat.id)) {
          uniqueChatsMap.set(chat.id, chat);
        } else {
          console.log('⚠️ Duplicate chat detected during INIT, keeping first:', chat.id);
        }
      });
      const uniqueChats = Array.from(uniqueChatsMap.values());
      
      console.log('📥 INIT: Processed', action.chats.length, 'chats, removed', (action.chats.length - uniqueChats.length), 'duplicates');
      
      return { chats: uniqueChats };
    }

    case "RESET":
      saveChats(seed);
      return { chats: seed };

    case "SEND": {
      const text = action.text.trim();
      if (!text) return state;

      console.log('\n📤 ========== SEND MESSAGE START ==========');
      console.log('📤 Chat ID:', action.chatId);
      console.log('📤 Message text:', text);

      const target = state.chats.find((c) => c.id === action.chatId);
      if (!target || target.blocked) {
        console.log('❌ Chat not found or blocked');
        return state;
      }

      console.log('📤 Current messages in chat:', target.messages.length);
      
      // Prevent duplicate messages - check ALL recent messages (not just last 10)
      const recentMessages = target.messages.filter(m => 
        (Date.now() - m.createdAt) < 5000  // Check all messages from last 5 seconds
      );
      
      const isDuplicate = recentMessages.some(m => {
        const sameText = m.text.trim() === text.trim();
        const timeDiff = Date.now() - m.createdAt;
        console.log('🔍 Checking for duplicate:', {
          existingText: m.text.substring(0, 30),
          newText: text.substring(0, 30),
          sameText,
          timeDiffMs: timeDiff,
          withinThreshold: timeDiff < 5000 // 5 seconds threshold
        });
        return sameText && timeDiff < 5000;  // 5 second tolerance
      });
      
      if (isDuplicate) {
        console.log('⚠️ DUPLICATE DETECTED - Skipping message');
        console.log('⚠️ This prevents the message from being added to state AND backend');
        return state;
      }

      const msg = {
        id: uid(),
        chatId: action.chatId,
        sender: "me",
        text,
        createdAt: Date.now(),
        tempId: `temp_${Date.now()}`
      };

      console.log('✨ Created new message:', {
        id: msg.id,
        tempId: msg.tempId,
        text: msg.text.substring(0, 30)
      });

      // ✅ OPTIMISTIC UPDATE: Add message immediately for instant UI feedback
      const chats = state.chats.map((c) =>
        c.id === action.chatId ? { ...c, messages: [...c.messages, msg] } : c
      );

      const updated = chats.find((c) => c.id === action.chatId);
      const rest = chats.filter((c) => c.id !== action.chatId);
      const next = updated ? [updated, ...rest] : chats;

      console.log('✅ Message added to state OPTIMISTICALLY. New count:', updated?.messages?.length || 0);
      console.log('📤 ========== SEND MESSAGE END ==========\n');
      
      // 🕐 MARK THIS CHAT AS "JUST SENT" - prevents immediate reload
      // Store in a global ref or window property since we can't access refs from context
      window.lastMessageSentTime = Date.now();
      window.lastMessageSentChatId = action.chatId;
      
      // Save to backend ONLY if not a duplicate
      const authUser = getAuthUser();
      if (authUser?.employeeId) {
        console.log('🌐 Sending to backend...');
        fetch(`${API_URL}/messages`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            // Add a unique header to help backend detect duplicates
            'X-Request-ID': msg.id,
            'X-Message-Text': text.trim(),
            'X-Sender-ID': authUser.employeeId
          },
          body: JSON.stringify({
            chatId: action.chatId,
            senderId: authUser.employeeId,
            text: text
          }),
          // Add cache control to prevent browser caching
          cache: 'no-cache'
        })
        .then(res => res.json())
        .then(data => {
          console.log('✅ Backend saved successfully:', data);
          if (data.isDuplicate) {
            console.log('ℹ️ Backend detected duplicate, message already exists');
          }
          // ✅ DON'T trigger reload here - let polling handle it naturally
        })
        .catch(err => console.error('❌ Backend save failed:', err));
      } else {
        console.log('⚠️ No authenticated user, skipping backend save');
      }
      
      return { chats: next };
    }

    case "UPDATE_CHAT_NAME": {
      const name = action.name.trim();
      if (!name) return state;

      const next = state.chats.map((chat) => {
        if (String(chat.id) !== String(action.chatId)) return chat;

        if (isSystemAdmin()) return { ...chat, name };
        if (chat.kind === "group" && !chat.isAdmin) return chat;

        return { ...chat, name };
      });

      saveChats(next);
      return { chats: next };
    }

    case "ADD_CONTACT": {
      const name = action.payload.name.trim();
      if (!name) return state;

      const newChat = {
        id: uid(),
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
      };

      const next = [newChat, ...state.chats];
      saveChats(next);
      return { chats: next };
    }

    case "ADD_GROUP": {
      const name = action.payload.name.trim();
      if (!name) return state;

      const newGroup = {
        id: uid(),
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
      };

      const next = [newGroup, ...state.chats];
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
      // Load messages from backend for a specific chat
      const { chatId, messages } = action.payload;
      
      console.log('\n📥 ========== LOAD_MESSAGES START ==========');
      console.log('📥 Chat ID:', chatId);
      console.log('📥 Backend messages count:', messages.length);
      
      const chats = state.chats.map((chat) => {
        if (chat.id !== chatId) return chat;
        
        console.log('\n🗂️ Processing chat:', chat.name);
        console.log('🗂️ Current local messages count:', chat.messages.length);
        
        // Ensure employeeId is set for DM chats
        const employeeId = chat.employeeId || (chat.kind === "dm" ? chat.id : null);
        
        // ✅ CRITICAL FIX: Use ONLY backend messages as source of truth
        // Don't merge with local messages - this causes duplicates
        // Backend has all messages, so just use those directly
        
        console.log('📊 Replacing local messages with backend messages');
        console.log('📊 Local had:', chat.messages.length, 'Backend has:', messages.length);
        
        // Remove any pending/local messages that match backend messages by text+time
        // This prevents duplicates when optimistic updates exist
        const backendMessageTexts = new Set(messages.map(m => 
          `${m.text.trim()}_${Math.floor(m.createdAt / 5000)}` // Round to 5 second buckets
        ));
        
        const filteredLocalMessages = chat.messages.filter(localMsg => {
          const key = `${localMsg.text.trim()}_${Math.floor(localMsg.createdAt / 5000)}`;
          const isInBackend = backendMessageTexts.has(key);
          
          if (isInBackend) {
            console.log('⏭️ Removing optimistic duplicate:', localMsg.text);
            return false;
          }
          return true;
        });
        
        console.log('📊 Filtered out', chat.messages.length - filteredLocalMessages.length, 'duplicates');
        
        return {
          ...chat,
          employeeId,
          messages: [...filteredLocalMessages, ...messages].sort((a, b) => a.createdAt - b.createdAt),
          isLoadingMessages: false
        };
      });
      
      console.log('📥 ========== LOAD_MESSAGES END ==========\n');
      
      return { chats };
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
      if (!isSystemAdmin()) return state;

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
      if (!isSystemAdmin()) return state;

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
  const [backendError, setBackendError] = useState(null);

  // Initialize chats with employees from backend on mount
  useEffect(() => {
    const init = async () => {
      try {
        const authUser = getAuthUser();
        
        if (!authUser?.employeeId) {
          console.log('No authenticated user found, using seed data');
          // Load seed data for unauthenticated users
          dispatch({ type: "INIT", chats: seed });
          setLoading(false);
          return;
        }
        
        console.log('👤 Loading employees for user:', authUser.employeeId);
        
        // ALWAYS load ALL employees from backend (fresh data)
        const response = await fetch(`${API_URL}/auth/employees`);
        const data = await response.json();
        
        console.log('✅ Loaded employees:', data.employees?.length || 0);
        
        if (data.success && Array.isArray(data.employees)) {
          // Filter out current user and convert to chat format
          const employeeChats = data.employees
            .filter(emp => emp._id !== authUser.employeeId)
            .map((emp) => {
              // Create conversation ID by sorting both participant IDs
              const sortedIds = [authUser.employeeId, emp._id].sort();
              const convId = `${sortedIds[0]}_${sortedIds[1]}`;
              
              return {
                id: convId,  // Use conversation ID instead of just employee ID
                kind: "dm",
                name: emp.name,
                avatarUrl: `https://i.pravatar.cc/100?u=${encodeURIComponent(emp.email)}`,
                isOnline: false,
                lastSeen: "last seen recently",
                about: "Hey there! I am using Oppty Chats.",
                contact: emp.email,
                blocked: false,
                messages: [],
                employeeId: emp._id,  // ✅ Still need this for message loading!
                role: emp.role,
                isLoadingMessages: false
              };
            });

          console.log('💬 Setting employee chats:', employeeChats.length);
          console.log('🔗 Conversation IDs created:', employeeChats.map(c => ({ name: c.name, id: c.id })));
          dispatch({ type: "INIT", chats: employeeChats });
          setBackendError(null);
        } else {
          console.warn('Backend returned no employees, using seed data');
          dispatch({ type: "INIT", chats: seed });
        }
      } catch (error) {
        console.error("Failed to initialize chats from backend, using seed data:", error);
        dispatch({ type: "INIT", chats: seed });
      } finally {
        setLoading(false);
      }
    };
    
    init();
    
    // Poll for new employees every 10 seconds (but don't reload if already loaded)
    const pollInterval = setInterval(async () => {
      try {
        const authUser = getAuthUser();
        if (!authUser?.employeeId) return;
        
        const response = await fetch(`${API_URL}/auth/employees`);
        const data = await response.json();
        
        if (data.success && Array.isArray(data.employees)) {
          // Check if employee count changed significantly
          const newEmployeeCount = data.employees.filter(emp => emp._id !== authUser.employeeId).length;
          
          console.log('🔄 Polling: Current employee count:', newEmployeeCount, 'vs state chats:', state.chats.length);
          
          // Only reload if count increased by at least 1 (not just different)
          // AND we're not currently loading
          if (newEmployeeCount > state.chats.length + 1) {
            console.log('🆕 Significant new employee(s) detected, reloading...');
            await init();
          } else {
            console.log('⏭️ No significant change, skipping reload');
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 10000); // Check every 10 seconds (increased from 5)
    
    return () => clearInterval(pollInterval);
  }, [state.chats.length]); // Re-create interval if chat count changes

  const api = useMemo(
    () => ({
      chats: state.chats,
      loading: loading,
      getChatById: (id) => state.chats.find((c) => String(c.id) === String(id)),
      sendMessage: (chatId, text) => dispatch({ type: "SEND", chatId, text }),
      updateChatName: (chatId, name) =>
        dispatch({ type: "UPDATE_CHAT_NAME", chatId, name }),
      addContact: (payload) => dispatch({ type: "ADD_CONTACT", payload }),
      addGroup: (payload) => dispatch({ type: "ADD_GROUP", payload }),
      deleteChat: (chatId) => dispatch({ type: "DELETE_CHAT", chatId }),
      toggleBlockChat: (chatId) => dispatch({ type: "TOGGLE_BLOCK_CHAT", chatId }),
      addGroupMember: (chatId, member) =>
        dispatch({ type: "ADD_GROUP_MEMBER", chatId, member }),
      removeGroupMember: (chatId, memberId) =>
        dispatch({ type: "REMOVE_GROUP_MEMBER", chatId, memberId }),
      loadMessages: (chatId, messages) => dispatch({ type: "LOAD_MESSAGES", payload: { chatId, messages } }),
      resetChats: () => dispatch({ type: "RESET" }),
      isAdmin: isSystemAdmin(),
    }),
    [state.chats, loading]
  );

  return <ChatContext.Provider value={api}>{children}</ChatContext.Provider>;
}

export function useChats() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChats must be used inside ChatProvider");
  return ctx;
}