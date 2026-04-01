import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useChats } from "../../context/ChatContext.jsx";
import profileImg from "../../assets/profiledp.jpeg";
import AppLoader from "../common/AppLoader.jsx";
import companyLogo from "../../assets/opptylogo.png";
import "./Sidebar.css";

function ChatsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
      />
    </svg>
  );
}

function GroupsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.67 0-8 1.34-8 4v2h12v-2c0-2.66-5.33-4-4-4zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.95v2h7v-2c0-2.66-5.33-4-8-4z"
      />
    </svg>
  );
}

function NewChatIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"
      />
    </svg>
  );
}

const ICON_BY_ID = {
  chats: <ChatsIcon />,
  groups: <GroupsIcon />,
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
  const { addContact, addGroup } = useChats();

  const authUser = getAuthUser();
  const isAdminUser = authUser?.role === "admin";
  const isSuperAdminUser = authUser?.role === "superadmin";

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
    bio: isAdminUser
      ? "Administrator access enabled for complete dashboard control."
      : "Passionate about building beautiful chat experiences.",
    photo: profileImg,
  });

  const [draftName, setDraftName] = useState(profile.name);
  const [draftPhoto, setDraftPhoto] = useState(profile.photo);

  const popupRef = useRef(null);
  const profileBtnRef = useRef(null);
  const fileInputRef = useRef(null);

  const createPopupRef = useRef(null);
  const createBtnRef = useRef(null);

  const navItems = [
    { id: "chats", to: "/chats", badge: "99+" },
    { id: "groups", to: "/groups", dot: true },
  ];

  const adminNavItems = [
    { id: "admin", to: "/admin", label: "Admin Panel" },
  ];

  const saveAuthUser = (updatedFields) => {
    const current = getAuthUser();
    if (!current) return;

    const updated = {
      ...current,
      ...updatedFields,
    };

    localStorage.setItem("employeeAuth", JSON.stringify(updated));
  };

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
    setDraftPhoto(profile.photo);
  };

  const handleBackToMenu = () => {
    setIsEditingProfile(false);
    setIsViewingProfile(false);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setDraftName(profile.name);
    setDraftPhoto(profile.photo);
  };

  const handleSaveProfile = () => {
    const trimmedName = draftName.trim();
    if (!trimmedName) return;

    const updatedProfile = {
      ...profile,
      name: trimmedName,
      photo: draftPhoto,
    };

    setProfile(updatedProfile);
    saveAuthUser({
      name: trimmedName,
      photo: draftPhoto,
    });

    setIsEditingProfile(false);
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
    const objectUrl = URL.createObjectURL(file);
    setDraftPhoto(objectUrl);
  };

  const handleToggleCreatePopup = () => {
    if (!isAdminUser) return;
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
    if (!isAdminUser) return;

    const name = newContactName.trim();
    const email = newContactEmail.trim();
    const password = newContactPassword.trim();

    if (!name || !email || !password) {
      alert('Please fill in all fields: name, email, and password');
      return;
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
        });
        
        // Reset form and close popup
        setNewContactName("");
        setNewContactEmail("");
        setNewContactPassword("");
        handleCloseCreatePopup();
        navigate("/chats");
        alert(`Employee "${name}" created successfully! They can now login with their email and password.`);
      } else {
        alert(data.message || 'Failed to create employee');
      }
    } catch (error) {
      console.error('Create employee error:', error);
      alert('Failed to create employee. Please try again.');
    }
  };

  const handleCreateGroup = () => {
    if (!isAdminUser) return;

    const name = newGroupName.trim();
    if (!name) return;

    addGroup({
      name,
      about: newGroupAbout,
    });

    handleCloseCreatePopup();
    navigate("/groups");
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
              {item.badge && <span className="sidebar-badge">{item.badge}</span>}
              {item.dot && <span className="sidebar-dot" />}
            </NavLink>
          ))}

          {isAdminUser && (
            <>
              <div className="sidebar-divider" />

              {/* Admin Navigation */}
              <NavLink
                to="/admin"
                className={({ isActive }) => `sidebar-item admin-nav-item ${isActive ? "active" : ""}`}
                aria-label="Admin Dashboard"
                title="Admin Dashboard"
              >
                <span className="sidebar-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.4 0 2.8 1.1 2.8 2.5V11c.6 0 1.2.6 1.2 1.2v3.5c0 .7-.6 1.3-1.2 1.3H9.2c-.6 0-1.2-.6-1.2-1.3v-3.5c0-.6.6-1.2 1.2-1.2V9.5C9.2 8.1 10.6 7 12 7zm0 1c-.8 0-1.5.7-1.5 1.5V11h3V9.5c0-.8-.7-1.5-1.5-1.5zM12 13c-.8 0-1.5.7-1.5 1.5v1h3v-1c0-.8-.7-1.5-1.5-1.5z"/>
                  </svg>
                </span>
                <span className="sidebar-label">Admin Panel</span>
              </NavLink>
            </>
          )}

          {isSuperAdminUser && (
            <>
              <div className="sidebar-divider" />

              {/* Super Admin Navigation */}
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
                <span className="sidebar-label">Super Admin</span>
              </NavLink>

              <div className="sidebar-create-wrapper">
                <button
                  ref={createBtnRef}
                  type="button"
                  className="sidebar-item sidebar-create-btn"
                  aria-label="New chat"
                  title="New chat"
                  onClick={handleToggleCreatePopup}
                >
                  <span className="sidebar-icon">
                    <NewChatIcon />
                  </span>
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
                          <button
                            type="button"
                            className="create-menu-btn"
                            onClick={() => setCreateMode("contact")}
                          >
                            Add New Contact
                          </button>

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

                    {createMode === "contact" && (
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
            </>
          )}
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-profile-wrapper">
            <button
              ref={profileBtnRef}
              type="button"
              className={`sidebar-profile ${isAdminUser ? "sidebar-admin-badge" : ""}`}
              aria-label="profile"
              title={isAdminUser ? "Admin Profile" : "Profile"}
              onClick={handleTogglePopup}
            >
              {isAdminUser ? (
                <span className="sidebar-admin-text">AD</span>
              ) : (
                <img src={profile.photo} alt="User" className="sidebar-profile-img" />
              )}
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
                      {isAdminUser ? (
                        <div className="profile-popup-admin-avatar">AD</div>
                      ) : (
                        <img src={profile.photo} alt="User" className="profile-popup-avatar" />
                      )}

                      <div className="profile-popup-user">
                        <h4>{isAdminUser ? `${profile.name} (Admin)` : profile.name}</h4>
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
                      {isAdminUser ? (
                        <div className="profile-popup-admin-avatar profile-popup-admin-avatar-large">
                          AD
                        </div>
                      ) : (
                        <img
                          src={profile.photo}
                          alt="User"
                          className="profile-popup-avatar profile-popup-avatar-large"
                        />
                      )}

                      <div className="profile-popup-user">
                        <h4>{isAdminUser ? `${profile.name} (Admin)` : profile.name}</h4>
                        <p>{profile.email}</p>
                      </div>
                    </div>

                    <div className="profile-view-details">
                      <div className="profile-detail-card">
                        <span className="profile-detail-label">Phone</span>
                        <span className="profile-detail-value">{profile.phone}</span>
                      </div>

                      <div className="profile-detail-card">
                        <span className="profile-detail-label">Bio</span>
                        <span className="profile-detail-value">{profile.bio}</span>
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
                      {isAdminUser ? (
                        <div className="profile-popup-admin-avatar">AD</div>
                      ) : (
                        <img src={draftPhoto} alt="Preview" className="profile-popup-avatar" />
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

                      {!isAdminUser && (
                        <div className="profile-input-group">
                          <span className="profile-input-label">Photo</span>
                          <div className="profile-edit-actions">
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
                          disabled={!draftName.trim()}
                        >
                          Save
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