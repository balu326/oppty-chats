import { useCallback, useEffect, useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

function getAuthUser() {
  try { return JSON.parse(localStorage.getItem("employeeAuth") || "{}"); } catch { return {}; }
}

function requestBrowserPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function showBrowserNotification(title, body, chatId) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const n = new Notification(title, {
    body,
    icon: "/opptylogo2.png",
    badge: "/opptylogo2.png",
    tag: chatId || "oppty",
    renotify: true,
  });
  n.onclick = () => {
    window.focus();
    if (chatId) window.location.hash = `/chats/${chatId}`;
    n.close();
  };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const prevIdsRef = useRef(new Set());

  const fetchNotifications = useCallback(async () => {
    const auth = getAuthUser();
    if (!auth?.token) return;
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);

        // Fire browser notifications for new ones
        const newOnes = (data.notifications || []).filter(
          (n) => !n.isRead && !prevIdsRef.current.has(n.id)
        );
        newOnes.forEach((n) => showBrowserNotification(n.title, n.body, n.chatId));
        (data.notifications || []).forEach((n) => prevIdsRef.current.add(n.id));
      }
    } catch { /* silent */ }
  }, []);

  const markAllRead = useCallback(async () => {
    const auth = getAuthUser();
    if (!auth?.token) return;
    await fetch(`${API_URL}/notifications`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  const markOneRead = useCallback(async (id) => {
    const auth = getAuthUser();
    if (!auth?.token) return;
    await fetch(`${API_URL}/notifications/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const deleteNotif = useCallback(async (id) => {
    const auth = getAuthUser();
    if (!auth?.token) return;
    await fetch(`${API_URL}/notifications/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  useEffect(() => {
    requestBrowserPermission();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return { notifications, unreadCount, loading, fetchNotifications, markAllRead, markOneRead, deleteNotif };
}
