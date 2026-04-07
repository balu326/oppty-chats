import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Sidebar from "./components/sidebar/Sidebar.jsx";
import ChatsLayout from "./components/chat/ChatsLayout.jsx";
import EmptyState from "./components/chat/EmptyState.jsx";
import ChatPage from "./components/chat/ChatPage.jsx";
import EmployeeLogin from "./pages/auth/EmployeeLogin.jsx";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard.jsx";
import MeetPage from "./pages/meet/MeetPage.jsx";
import SettingsPage from "./pages/settings/SettingsPage.jsx";
import BookmarksPage from "./pages/bookmarks/BookmarksPage.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import MessagePopupContainer from "./components/common/MessagePopup.jsx";
import "./App.css";

function isAuthenticated() {
  const raw = localStorage.getItem("employeeAuth");
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw);
    return parsed?.isAuthenticated === true;
  } catch {
    return false;
  }
}

function ProtectedApp() {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const isWorkspaceRoute = location.pathname.startsWith("/chats") || location.pathname.startsWith("/groups");

  return (
    <div className="app">
      <Sidebar />
      <main className={`main-content ${isWorkspaceRoute ? "main-content-workspace" : "main-content-scroll"}`}>
        <Routes>
          <Route path="/" element={<Navigate to="/chats" replace />} />
          <Route path="/chats" element={<ChatsLayout mode="dm" />}>
            <Route index element={<EmptyState />} />
            <Route path=":chatId" element={<ChatPage />} />
          </Route>
          <Route path="/groups" element={<ChatsLayout mode="group" />}>
            <Route index element={<EmptyState />} />
            <Route path=":chatId" element={<ChatPage />} />
          </Route>
          <Route path="/meet" element={<MeetPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/admin" element={<Navigate to="/superadmin" replace />} />
          <Route path="/superadmin" element={<SuperAdminDashboard />} />
          <Route path="*" element={<Navigate to="/chats" replace />} />
        </Routes>
      </main>
      <MessagePopupContainer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/login" element={<EmployeeLogin />} />
        <Route path="/*" element={<ProtectedApp />} />
      </Routes>
    </ThemeProvider>
  );
}
