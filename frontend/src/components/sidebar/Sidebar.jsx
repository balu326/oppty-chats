import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useChats } from "../../context/ChatContext.jsx";
import AppLoader from "../common/AppLoader.jsx";
import companyLogo from "../../assets/opptylogo.png";
import NotificationPanel from "../notifications/NotificationPanel.jsx";
import { useNotifications } from "../../hooks/useNotifications.js";
import { triggerToast } from "../common/MessagePopup.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import "./Sidebar.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

function ProfileAvatar({ photo, name, size = 36 }) {
  const [broken, setBroken] = React.useState(false);
  const initial = (name || "U").slice(0, 1).toUpperCase();

  // Reset broken state when photo URL changes
  React.useEffect(() => { setBroken(false); }, [photo]);

  if (!photo || broken) {
    return (
      <span
        className="sidebar-initials-avatar"
        style={{ width: size, height: size, fontSize: size * 0.42 }}
      >
        {initial}
      </span>
    );
  }

  return (
    <img
      src={photo}
      alt={name || "User"}
      className="sidebar-profile-img"
      style={{ width: size, height: size }}
      onError={() => setBroken(true)}
    />
  );
}

function ChatsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
      />
    </svg>
  );
}

function GroupsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
      />
    </svg>
  );
}

function NewChatIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
      />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"
      />
    </svg>
  );
}

const ICON_BY_ID = {
  chats: <ChatsIcon />,
  groups: <GroupsIcon />,
  updates: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path fill="currentColor" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
    </svg>
  ),
  meet: (
    <svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true">
      <path fill="#4285F4" d="M44 24c0-1.3-.1-2.5-.3-3.7H24v7h11.3c-.5 2.5-1.9 4.6-4 6v5h6.5C41.2 35 44 30 44 24z"/>
      <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.5-5c-1.8 1.2-4.1 1.9-7 1.9-5.4 0-9.9-3.6-11.5-8.5H5.8v5.2C9.1 39.8 16 44 24 44z"/>
      <path fill="#FBBC05" d="M12.5 27.5c-.4-1.2-.7-2.5-.7-3.8s.2-2.6.7-3.8v-5.2H5.8C4.6 17.1 4 20.5 4 24s.6 6.9 1.8 9.3l6.7-5.8z"/>
      <path fill="#EA4335" d="M24 12.5c3 0 5.7 1 7.8 3l5.8-5.8C34.1 6.5 29.4 4.5 24 4.5 16 4.5 9.1 8.7 5.8 15.2l6.7 5.2c1.6-4.9 6.1-7.9 11.5-7.9z"/>
    </svg>
  ),
  bookmarks: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path fill="currentColor" d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
    </svg>
  ),
};

function getAuthUser() {
  try {
    const raw = localStorage.getItem("employeeAuth");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Sidebar({ isChatOpen }) {
  const navigate = useNavigate();
  const { addContact, addGroup, chats, getUnreadCount } = useChats();
  const { notifications, unreadCount: notifUnread, markAllRead, markOneRead, deleteNotif } = useNotifications();
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const { prefs, setMode } = useTheme();
  const isDark = prefs.mode === "dark";

  const totalDmUnread = chats
    .filter((c) => c.kind === "dm")
    .reduce((sum, c) => sum + getUnreadCount(c.id), 0);

  const totalGroupUnread = chats
    .filter((c) => c.kind === "group")
    .reduce((sum, c) => sum + getUnreadCount(c.id), 0);

  const authUser = getAuthUser();
  const isSuperAdminUser = authUser?.role === "superadmin";
  const canCreateGroups = isSuperAdminUser;

  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isViewingProfile, setIsViewingProfile] = useState(false);

  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [createMode, setCreateMode] = useState("menu");

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [newContactName, setNewContactName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactPassword, setNewContactPassword] = useState("");

  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupAbout, setNewGroupAbout] = useState("");

  const [profile, setProfile] = useState({
    name: authUser?.name || "Your Name",
    email: authUser?.email || "yourmail@example.com",
    phone: "+91 9876543210",
    bio: isSuperAdminUser
      ? "Super Administrator — full workspace control."
      : "Hey there! I am using Oppty Chats.",
    photo: authUser?.avatarUrl || null,
  });

  const [draftName, setDraftName] = useState(profile.name);
  const [draftPhone, setDraftPhone] = useState(profile.phone);
  const [draftBio, setDraftBio] = useState(profile.bio);
  const [draftPhoto, setDraftPhoto] = useState(profile.photo);
  const [draftFile, setDraftFile] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const popupRef = useRef(null);
  const profileBtnRef = useRef(null);
  const fileInputRef = useRef(null);
  const createPopupRef = useRef(null);
  const createBtnRef = useRef(null);

  const saveAuthUser = (updatedFields) => {
    const current = getAuthUser();
    if (!current) return;
    localStorage.setItem("employeeAuth", JSON.stringify({ ...current, ...updatedFields }));
  };

  // Load profile from backend on mount
  useEffect(() => {
    const currentAuth = getAuthUser();
    if (!currentAuth?.token) return;
    fetch(`${API_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${currentAuth.token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.employee) {
          const emp = data.employee;
          const updated = {
            name: emp.name || "",
            email: emp.email || "",
            phone: emp.phone || "",
            bio: emp.bio || "",
            photo: emp.avatarUrl || null,
          };
          setProfile(updated);
          setDraftName(updated.name);
          setDraftPhone(updated.phone);
          setDraftBio(updated.bio);
          setDraftPhoto(updated.photo);
          saveAuthUser({ name: updated.name, avatarUrl: updated.photo });
        }
      })
      .catch((err) => console.error("Profile load failed:", err));
  }, []);

  const navItems = [
    { id: "chats",   to: "/chats",   unread: totalDmUnread },
    { id: "groups",  to: "/groups",  unread: totalGroupUnread },
    { id: "updates", to: "/updates", unread: notifUnread },
  ];

  const adminNavItems = [
    { id: "admin", to: "/admin", label: "Admin Panel" },
  ];

  const handleTogglePopup = () => {
    setShowProfilePopup((prev) => !prev);
    setShowCreatePopup(false);
    setShowLogoutConfirm(false);
    setIsEditingProfile(false);
    setIsViewingProfile(false);
    setDraftName(profile.name);
    setDraftPhoto(profile.photo);
  };

  const handleClosePopup = () => {
    setShowProfilePopup(false);
    setShowLogoutConfirm(false);
    setIsEditingProfile(false);
    setIsViewingProfile(false);
    setDraftName(profile.name);
    setDraftPhoto(profile.photo);
  };

  const handleViewProfile = () => {
    setIsViewingProfile(true);
    setIsEditingProfile(false);
  };

  const handleStartEdit = () => {
    setIsEditingProfile(true);
    setIsViewingProfile(false);
    setDraftName(profile.name);
    setDraftPhone(profile.phone);
    setDraftBio(profile.bio);
    setDraftPhoto(profile.photo);
    setDraftFile(null);
  };

  const handleBackToMenu = () => {
    setIsEditingProfile(false);
    setIsViewingProfile(false);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setDraftName(profile.name);
    setDraftPhone(profile.phone);
    setDraftBio(profile.bio);
    setDraftPhoto(profile.photo);
    setDraftFile(null);
  };

  const handleSaveProfile = async () => {
    const trimmedName = draftName.trim();
    if (!trimmedName) return;
    setIsSavingProfile(true);

    try {
      const currentAuth = getAuthUser();
      if (!currentAuth?.token) { console.error("No token"); return; }

      const formData = new FormData();
      formData.append("name", trimmedName);
      formData.append("phone", (draftPhone || "").trim());
      formData.append("bio", (draftBio || "").trim());
      if (draftFile) {
        formData.append("avatar", draftFile);
      }

      const res = await fetch(`${API_URL}/auth/profile`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${currentAuth.token}` },
        body: formData,
      });

      const data = await res.json();

      if (data.success && data.employee) {
        const emp = data.employee;
        const updated = {
          name: emp.name,
          email: emp.email || profile.email,
          phone: emp.phone || "",
          bio: emp.bio || "",
          photo: emp.avatarUrl || profile.photo,
        };
        setProfile(updated);
        setDraftPhoto(updated.photo);
        saveAuthUser({ name: updated.name, avatarUrl: updated.photo });
      }
    } catch (err) {
      console.error("Profile save failed:", err);
    } finally {
      setIsSavingProfile(false);
      setDraftFile(null);
      setIsEditingProfile(false);
    }
  };

  const handleOpenLogoutConfirm = () => {
    setShowLogoutConfirm(true);
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleConfirmLogout = () => {
    setIsLoggingOut(true);
    setShowLogoutConfirm(false);
    setShowProfilePopup(false);

    setTimeout(() => {
  localStorage.removeItem("employeeAuth");
  window.location.href = "/login";
}, 1600);
  };

  const handlePhotoButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setDraftFile(file);
    const objectUrl = URL.createObjectURL(file);
    setDraftPhoto(objectUrl);
  };

  const handleToggleCreatePopup = () => {
    if (!canCreateGroups) return;
    setShowCreatePopup((prev) => !prev);
    setShowProfilePopup(false);
    setShowLogoutConfirm(false);
    setCreateMode("menu");
  };

  const handleCloseCreatePopup = () => {
    setShowCreatePopup(false);
    setCreateMode("menu");
    setNewContactName("");
    setNewContactEmail("");
    setNewGroupName("");
    setNewGroupAbout("");
  };

  const handleCreateContact = async () => {
    if (!isSuperAdminUser) return;

    const name = newContactName.trim();
    const email = newContactEmail.trim();
    const password = newContactPassword.trim();

    if (!name || !email || !password) {
      triggerToast("Please fill in all fields: name, email, and password", "warning");
      return;
    }

    if (password.length < 6) {
      triggerToast("Password must be at least 6 characters", "warning");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authUser?.token}`,
        },
        body: JSON.stringify({
          name: name,
          email: email.toLowerCase(),
          password: password,
          role: 'employee'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Add to contacts list
        addContact({
          name,
          contact: email,
          employeeId: data.employee?.id,
          role: data.employee?.role,
        });
        
        // Reset form and close popup
        setNewContactName("");
        setNewContactEmail("");
        setNewContactPassword("");
        handleCloseCreatePopup();
        navigate("/chats");
        triggerToast(`Employee "${name}" created successfully!`, "success");
      } else {
        triggerToast(data.message || "Failed to create employee", "error");
      }
    } catch (error) {
      console.error('Create employee error:', error);
      triggerToast("Failed to create employee. Please try again.", "error");
    }
  };

  const handleCreateGroup = () => {
    if (!canCreateGroups || !authUser?.token) return;

    const name = newGroupName.trim();
    if (!name) return;

    fetch(`${API_URL}/groups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authUser.token}`,
      },
      body: JSON.stringify({
        name,
        description: newGroupAbout.trim(),
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.success) {
          throw new Error(data.message || "Failed to create group");
        }

        addGroup({
          id: data.group?._id,
          name: data.group?.name || name,
          about: data.group?.description || newGroupAbout,
        });

        handleCloseCreatePopup();
        navigate("/groups");
      })
      .catch((error) => {
        console.error("Create group error:", error);
        triggerToast(error.message || "Failed to create group", "error");
      });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedOutsideProfile =
        showProfilePopup &&
        popupRef.current &&
        !popupRef.current.contains(event.target) &&
        profileBtnRef.current &&
        !profileBtnRef.current.contains(event.target);

      const clickedOutsideCreate =
        showCreatePopup &&
        createPopupRef.current &&
        !createPopupRef.current.contains(event.target) &&
        createBtnRef.current &&
        !createBtnRef.current.contains(event.target);

      if (clickedOutsideProfile) handleClosePopup();
      if (clickedOutsideCreate) handleCloseCreatePopup();
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        handleClosePopup();
        handleCloseCreatePopup();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showProfilePopup, showCreatePopup, profile]);

  return (
    <>
      <aside className={`sidebar ${isChatOpen ? "sidebar-hidden-mobile" : ""}`}>
        <div className="sidebar-top">
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.to}
              className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
              aria-label={item.id}
              title={item.id}
            >
              <span className="sidebar-icon">{ICON_BY_ID[item.id]}</span>
              <span className="sidebar-item-label">{item.id.charAt(0).toUpperCase() + item.id.slice(1)}</span>
              {item.unread > 0 && (
                <span className="sidebar-badge">{item.unread > 99 ? "99+" : item.unread}</span>
              )}
            </NavLink>
          ))}

          {isSuperAdminUser && (
            <>
              <div className="sidebar-divider" />
              <NavLink
                to="/superadmin"
                className={({ isActive }) => `sidebar-item super-admin-nav-item ${isActive ? "active" : ""}`}
                aria-label="Super Admin Dashboard"
                title="Super Admin Dashboard"
              >
                <span className="sidebar-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                  </svg>
                </span>
                <span className="sidebar-item-label">Hub</span>
              </NavLink>
            </>
          )}

          {canCreateGroups && (
            <div className="sidebar-create-wrapper">
              <button
                ref={createBtnRef}
                type="button"
                className="sidebar-item sidebar-create-btn"
                aria-label="Create"
                title="Create"
                onClick={handleToggleCreatePopup}
              >
                <span className="sidebar-icon">
                  <NewChatIcon />
                </span>
                <span className="sidebar-item-label">New</span>
              </button>

              {showCreatePopup && (
                <div
                  ref={createPopupRef}
                  className="create-popup"
                  role="dialog"
                  aria-label="Create new chat or group"
                >
                  {createMode === "menu" && (
                    <>
                      <div className="create-popup-title">Start something new</div>

                      <div className="create-popup-menu">
                        {isSuperAdminUser && (
                          <button
                            type="button"
                            className="create-menu-btn"
                            onClick={() => setCreateMode("contact")}
                          >
                            Add New Employee
                          </button>
                        )}

                        <button
                          type="button"
                          className="create-menu-btn"
                          onClick={() => setCreateMode("group")}
                        >
                          Create New Group
                        </button>
                      </div>
                    </>
                  )}

                  {createMode === "contact" && isSuperAdminUser && (
                    <>
                      <div className="create-popup-title">Add New Employee</div>

                      <div className="create-form">
                        <label className="profile-input-group">
                          <span className="profile-input-label">Full Name</span>
                          <input
                            type="text"
                            className="profile-input"
                            value={newContactName}
                            onChange={(e) => setNewContactName(e.target.value)}
                            placeholder="Enter employee name"
                          />
                        </label>

                        <label className="profile-input-group">
                          <span className="profile-input-label">Email Address</span>
                          <input
                            type="email"
                            className="profile-input"
                            value={newContactEmail}
                            onChange={(e) => setNewContactEmail(e.target.value)}
                            placeholder="Enter email address"
                          />
                        </label>

                        <label className="profile-input-group">
                          <span className="profile-input-label">Password (min 6 characters)</span>
                          <input
                            type="password"
                            className="profile-input"
                            value={newContactPassword}
                            onChange={(e) => setNewContactPassword(e.target.value)}
                            placeholder="Enter password"
                            minLength={6}
                          />
                        </label>

                        <div className="profile-popup-actions">
                          <button
                            type="button"
                            className="popup-btn popup-btn-secondary"
                            onClick={() => setCreateMode("menu")}
                          >
                            Back
                          </button>
                          <button
                            type="button"
                            className="popup-btn popup-btn-danger"
                            onClick={handleCreateContact}
                            disabled={!newContactName.trim() || !newContactEmail.trim() || !newContactPassword.trim()}
                          >
                            Create Employee
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {createMode === "group" && (
                    <>
                      <div className="create-popup-title">Create New Group</div>

                      <div className="create-form">
                        <label className="profile-input-group">
                          <span className="profile-input-label">Group Name</span>
                          <input
                            type="text"
                            className="profile-input"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="Enter group name"
                          />
                        </label>

                        <label className="profile-input-group">
                          <span className="profile-input-label">About Group</span>
                          <input
                            type="text"
                            className="profile-input"
                            value={newGroupAbout}
                            onChange={(e) => setNewGroupAbout(e.target.value)}
                            placeholder="Write something about the group"
                          />
                        </label>

                        <div className="profile-popup-actions">
                          <button
                            type="button"
                            className="popup-btn popup-btn-secondary"
                            onClick={() => setCreateMode("menu")}
                          >
                            Back
                          </button>
                          <button
                            type="button"
                            className="popup-btn popup-btn-danger"
                            onClick={handleCreateGroup}
                            disabled={!newGroupName.trim()}
                          >
                            Create
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="sidebar-bottom">
          {/* Theme toggle */}
          <button
            type="button"
            className="sidebar-item sidebar-theme-btn"
            onClick={() => setMode(isDark ? "light" : "dark")}
            aria-label="Toggle theme"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className="sidebar-icon" style={{ fontSize: 20 }}>
              {isDark ? "☀️" : "🌙"}
            </span>
            <span className="sidebar-item-label">{isDark ? "Light" : "Dark"}</span>
          </button>

          <div className="sidebar-profile-wrapper">
            <button
              ref={profileBtnRef}
              type="button"
              className={`sidebar-profile ${isSuperAdminUser ? "sidebar-admin-badge" : ""}`}
              aria-label="profile"
              title={isSuperAdminUser ? "Admin Profile" : "Profile"}
              onClick={handleTogglePopup}
            >
              {isSuperAdminUser ? (
                <span className="sidebar-admin-text">AD</span>
              ) : (
                <ProfileAvatar photo={profile.photo} name={profile.name} size={36} />
              )}
              <span className="sidebar-item-label">Profile</span>
            </button>

            {showProfilePopup && (
              <div
                ref={popupRef}
                className="profile-popup profile-popup--expanded"
                role="dialog"
                aria-label="Profile options"
              >
                {!isEditingProfile && !isViewingProfile && !showLogoutConfirm && (
                  <>
                    <div className="profile-popup-header">
                      {isSuperAdminUser ? (
                        <div className="profile-popup-admin-avatar">AD</div>
                      ) : (
                        <ProfileAvatar photo={profile.photo} name={profile.name} size={46} />
                      )}
                      <div className="profile-popup-user">
                        <h4>{isSuperAdminUser ? `${profile.name} (Admin)` : profile.name}</h4>
                        <p>{profile.email}</p>
                      </div>
                    </div>

                    <div className="profile-popup-menu">
                      <button type="button" className="profile-menu-btn" onClick={handleViewProfile}>
                        View Profile
                      </button>

                      <button type="button" className="profile-menu-btn" onClick={handleStartEdit}>
                        Edit Name / Photo
                      </button>

                      <button
                        type="button"
                        className="profile-menu-btn profile-menu-btn-danger"
                        onClick={handleOpenLogoutConfirm}
                      >
                        Logout
                      </button>
                    </div>
                  </>
                )}

                {showLogoutConfirm && (
                  <div className="logout-confirm-box">
                    <div className="logout-confirm-icon">⎋</div>
                    <h4 className="logout-confirm-title">Confirm Logout</h4>
                    <p className="logout-confirm-text">
                      Are you sure you want to logout from your account?
                    </p>

                    <div className="profile-popup-actions">
                      <button
                        type="button"
                        className="popup-btn popup-btn-secondary"
                        onClick={handleCancelLogout}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="popup-btn popup-btn-danger"
                        onClick={handleConfirmLogout}
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}

                {isViewingProfile && !showLogoutConfirm && (
                  <>
                    <div className="profile-popup-header">
                      {isSuperAdminUser ? (
                        <div className="profile-popup-admin-avatar profile-popup-admin-avatar-large">AD</div>
                      ) : (
                        <ProfileAvatar photo={profile.photo} name={profile.name} size={58} />
                      )}

                      <div className="profile-popup-user">
                        <h4>{isSuperAdminUser ? `${profile.name} (Admin)` : profile.name}</h4>
                        <p>{profile.email}</p>
                      </div>
                    </div>

                    <div className="profile-view-details">
                      <div className="profile-detail-card">
                        <span className="profile-detail-label">Phone</span>
                        <span className="profile-detail-value">{profile.phone || "Not set"}</span>
                      </div>

                      <div className="profile-detail-card">
                        <span className="profile-detail-label">Bio</span>
                        <span className="profile-detail-value">{profile.bio || "Not set"}</span>
                      </div>
                    </div>

                    <div className="profile-popup-actions">
                      <button
                        type="button"
                        className="popup-btn popup-btn-secondary"
                        onClick={handleBackToMenu}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        className="popup-btn popup-btn-danger"
                        onClick={handleStartEdit}
                      >
                        Edit Profile
                      </button>
                    </div>
                  </>
                )}

                {isEditingProfile && !showLogoutConfirm && (
                  <>
                    <div className="profile-popup-header">
                      {isSuperAdminUser ? (
                        <div className="profile-popup-admin-avatar">AD</div>
                      ) : (
                        <ProfileAvatar photo={draftPhoto} name={draftName} size={46} />
                      )}

                      <div className="profile-popup-user">
                        <h4>Edit Profile</h4>
                        <p>Update your name and photo</p>
                      </div>
                    </div>

                    <div className="profile-edit-form">
                      <label className="profile-input-group">
                        <span className="profile-input-label">Name</span>
                        <input
                          type="text"
                          className="profile-input"
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          placeholder="Enter your name"
                        />
                      </label>

                      <label className="profile-input-group">
                        <span className="profile-input-label">Phone</span>
                        <input
                          type="text"
                          className="profile-input"
                          value={draftPhone}
                          onChange={(e) => setDraftPhone(e.target.value)}
                          placeholder="Enter your phone number"
                        />
                      </label>

                      <label className="profile-input-group">
                        <span className="profile-input-label">Bio</span>
                        <input
                          type="text"
                          className="profile-input"
                          value={draftBio}
                          onChange={(e) => setDraftBio(e.target.value)}
                          placeholder="Write something about yourself"
                        />
                      </label>

                      {!isSuperAdminUser && (
                        <div className="profile-input-group">
                          <span className="profile-input-label">Photo</span>
                          <div className="profile-photo-preview">
                            <img src={draftPhoto} alt="Preview" className="profile-photo-thumb" />
                            <button
                              type="button"
                              className="popup-btn popup-btn-secondary"
                              onClick={handlePhotoButtonClick}
                            >
                              Choose Photo
                            </button>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              className="profile-file-input"
                              onChange={handlePhotoChange}
                            />
                          </div>
                        </div>
                      )}

                      <div className="profile-popup-actions">
                        <button
                          type="button"
                          className="popup-btn popup-btn-secondary"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="popup-btn popup-btn-danger"
                          onClick={handleSaveProfile}
                          disabled={!draftName.trim() || isSavingProfile}
                        >
                          {isSavingProfile ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      {isLoggingOut && (
  <AppLoader
    title="Signing you out..."
    subtitle="Securing your session and redirecting"
  />
)}
    </>
  );
}
