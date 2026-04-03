import React, { useEffect, useMemo, useState } from "react";
import "./SuperAdminDashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const TABS = [
  { id: "overview", label: "Overview", mobile: "Home" },
  { id: "employees", label: "Employees", mobile: "People" },
  { id: "groups", label: "Groups", mobile: "Groups" },
  { id: "messages", label: "Messages", mobile: "Feed" },
];

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "-";
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : "-";
}

function preview(message) {
  return (message.content || message.text || "No content").trim() || "No content";
}

function EmptyState({ eyebrow, title, text }) {
  return (
    <section className="superAdminEmptyState">
      <span className="superAdminEyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </section>
  );
}

export default function SuperAdminDashboard() {
  const [groups, setGroups] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: "", email: "", password: "", role: "employee", canCreateGroups: false });
  const [newGroup, setNewGroup] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const currentEmployee = JSON.parse(localStorage.getItem("employeeAuth") || "{}");

  useEffect(() => {
    if (currentEmployee?.role !== "superadmin") {
      setError("Access denied. Super Admin only.");
      return;
    }
    fetchAllData();
  }, []);

  const stats = useMemo(
    () => [
      { label: "Employees", value: employees.length, tone: "peach" },
      { label: "Groups", value: groups.length, tone: "sky" },
      { label: "Messages", value: messages.length, tone: "mint" },
      { label: "Super Admins", value: employees.filter((employee) => employee.role === "superadmin").length, tone: "gold" },
    ],
    [employees, groups, messages]
  );

  const fetchAllData = async () => {
    try {
      await Promise.all([fetchGroups(), fetchEmployees(), fetchMessages()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch(`${API_URL}/groups`, {
        headers: { Authorization: `Bearer ${currentEmployee.token}` },
      });
      const data = await response.json();
      if (data.success) setGroups(data.groups);
    } catch (fetchError) {
      console.error("Error fetching groups:", fetchError);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/employees`, {
        headers: { Authorization: `Bearer ${currentEmployee.token}` },
      });
      const data = await response.json();
      if (data.success) setEmployees(data.employees);
      else setError(data.message || "Failed to load employees");
    } catch (fetchError) {
      console.error("Error fetching employees:", fetchError);
      setError("Network error while fetching employees");
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/all-messages`, {
        headers: { Authorization: `Bearer ${currentEmployee.token}` },
      });
      const data = await response.json();
      if (data.success) setMessages(data.messages);
      else setError(data.message || "Failed to load messages");
    } catch (fetchError) {
      console.error("Error fetching messages:", fetchError);
      setError("Network error while fetching messages");
    }
  };

  const handleAddEmployee = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!newEmployee.name.trim() || !newEmployee.email.trim() || !newEmployee.password.trim()) {
      setError("Name, email, and password are required");
      return;
    }
    if (newEmployee.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/employees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentEmployee.token}`,
        },
        body: JSON.stringify({
          name: newEmployee.name.trim(),
          email: newEmployee.email.toLowerCase().trim(),
          password: newEmployee.password,
          role: newEmployee.role,
          canCreateGroups: newEmployee.canCreateGroups,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        setError(data.message || "Failed to create employee");
        return;
      }
      setSuccessMsg("Employee created successfully!");
      setNewEmployee({ name: "", email: "", password: "", role: "employee", canCreateGroups: false });
      setShowAddEmployeeModal(false);
      fetchEmployees();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (createError) {
      console.error("Create employee error:", createError);
      setError("Failed to create employee");
    }
  };

  const handleCreateGroup = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!newGroup.name.trim()) {
      setError("Group name is required");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentEmployee.token}`,
        },
        body: JSON.stringify({
          name: newGroup.name.trim(),
          description: newGroup.description.trim(),
        }),
      });
      const data = await response.json();
      if (!data.success) {
        setError(data.message || "Failed to create group");
        return;
      }
      setSuccessMsg("Group created successfully!");
      setNewGroup({ name: "", description: "" });
      setShowCreateGroupModal(false);
      fetchGroups();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (createError) {
      console.error("Create group error:", createError);
      setError("Failed to create group");
    }
  };

  const handleToggleAdminsOnly = async (group) => {
    try {
      const response = await fetch(`${API_URL}/groups/${group._id}/admins-only`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentEmployee.token}`,
        },
        body: JSON.stringify({ adminsOnly: !group.adminsOnly }),
      });
      const data = await response.json();
      if (!data.success) {
        setError(data.message || "Failed to update group");
        return;
      }
      setSuccessMsg(`"${group.name}" is now ${!group.adminsOnly ? "admins-only" : "open to all members"}`);
      fetchGroups();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError("Failed to update group setting");
    }
  };

  const handleAddMemberToGroup = async (groupId, employeeId) => {
    if (!employeeId) return;
    try {
      const response = await fetch(`${API_URL}/groups/${groupId}/members/${employeeId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${currentEmployee.token}` },
      });
      const data = await response.json();
      if (!data.success) { setError(data.message || "Failed to add member"); return; }
      setSuccessMsg("Member added to group");
      fetchGroups();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError("Failed to add member");
    }
  };

  const handleRemoveMemberFromGroup = async (groupId, employeeId) => {
    try {
      const response = await fetch(`${API_URL}/groups/${groupId}/members/${employeeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${currentEmployee.token}` },
      });
      const data = await response.json();
      if (!data.success) { setError(data.message || "Failed to remove member"); return; }
      setSuccessMsg("Member removed from group");
      fetchGroups();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError("Failed to remove member");
    }
  };

  if (currentEmployee?.role !== "superadmin") {
    return <div className="superAdminPage"><div className="superAdminShell"><EmptyState eyebrow="Restricted" title="Super admin access only" text="Sign in with a super admin account to manage the workspace." /></div></div>;
  }

  if (loading) {
    return <div className="superAdminPage"><div className="superAdminShell"><EmptyState eyebrow="Loading" title="Preparing your control room" text="Fetching employees, groups, and messages." /></div></div>;
  }

  return (
    <div className="superAdminPage">
      <div className="superAdminShell">
        <section className="superAdminHero">
          <div className="superAdminHeroTop">
            <div className="superAdminIdentity">
              <div className="superAdminLogoBadge">
                <img src="/opptylogo2.png" alt="Oppty" className="superAdminLogo" />
              </div>
              <div>
                <span className="superAdminEyebrow">Workspace Control</span>
                <h1>Super Admin Hub</h1>
                <p>Manage the workspace in a mobile-first control room that feels like the chat app.</p>
              </div>
            </div>
            <div className="superAdminActions">
              <button className="superAdminBtn primary" onClick={() => setShowAddEmployeeModal(true)}>Add Employee</button>
              <button className="superAdminBtn secondary" onClick={() => setShowCreateGroupModal(true)}>Create Group</button>
            </div>
          </div>

          <div className="superAdminStatsGrid">
            {stats.map((stat) => (
              <article key={stat.label} className={`superAdminStatCard ${stat.tone}`}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </article>
            ))}
          </div>
        </section>

        {error && <div className="superAdminAlert error">{error}</div>}
        {successMsg && <div className="superAdminAlert success">{successMsg}</div>}

        <nav className="superAdminTabs">
          {TABS.map((tab) => (
            <button key={tab.id} className={`superAdminTab ${activeTab === tab.id ? "active" : ""}`} onClick={() => setActiveTab(tab.id)}>
              <span className="desktopLabel">{tab.label}</span>
              <span className="mobileLabel">{tab.mobile}</span>
            </button>
          ))}
        </nav>

        <section className="superAdminPanel">
          {activeTab === "overview" && (
            <div className="superAdminOverview">
              <article className="superAdminCard superAdminHighlight">
                <span className="superAdminCardEyebrow">Recent Messages</span>
                <h2>Live workspace pulse</h2>
                <div className="superAdminFeed">
                  {messages.slice(0, 6).map((message) => (
                    <div key={message._id} className="superAdminFeedItem">
                      <div className="superAdminAvatar">{(message.sender?.name || "?").slice(0, 1).toUpperCase()}</div>
                      <div>
                        <strong>{message.sender?.name || "Unknown"}</strong>
                        <p>{preview(message)}</p>
                        <small>{formatDateTime(message.timestamp || message.createdAt)}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
              <article className="superAdminCard">
                <span className="superAdminCardEyebrow">Snapshot</span>
                <h2>Quick status</h2>
                <div className="superAdminMiniGrid">
                  <div className="superAdminMiniCard"><span>Last employee</span><strong>{employees[employees.length - 1]?.name || "None"}</strong></div>
                  <div className="superAdminMiniCard"><span>Largest focus</span><strong>{messages.length > groups.length ? "Messages" : "Groups"}</strong></div>
                </div>
              </article>
            </div>
          )}

          {activeTab === "employees" && (
            <div className="superAdminGrid">
              {employees.map((employee) => (
                <article key={employee._id} className="superAdminCard">
                  <div className="superAdminCardHeader">
                    <div className="superAdminAvatar">{employee.name?.slice(0, 1).toUpperCase()}</div>
                    <div>
                      <h3>{employee.name}</h3>
                      <p>{employee.email}</p>
                    </div>
                  </div>
                  <div className="superAdminPills">
                    <span className={`pill ${employee.role}`}>{employee.role}</span>
                    <span className="pill neutral">{employee.group?.name || "No group"}</span>
                  </div>
                  <small>Joined {formatDate(employee.createdAt)}</small>
                </article>
              ))}
            </div>
          )}

          {activeTab === "groups" && (
            <div className="superAdminStack">
              {groups.map((group) => (
                <article key={group._id} className="superAdminCard">
                  <div className="superAdminCardHeader split">
                    <div>
                      <span className="superAdminCardEyebrow">Group</span>
                      <h3>{group.name}</h3>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                      <span className="pill neutral">{group.members?.length || 0} members</span>
                      <span className={`pill ${group.adminsOnly ? "admin" : "neutral"}`}>
                        {group.adminsOnly ? "🔒 Admins only" : "💬 All members"}
                      </span>
                    </div>
                  </div>
                  <p>{group.description || "No description added yet."}</p>
                  <small>Created by {group.createdBy?.name || "Super Admin"} on {formatDate(group.createdAt)}</small>

                  {/* Members list */}
                  <div className="superAdminPills wrap" style={{ marginTop: "10px" }}>
                    {(group.members || []).map((member) => (
                      <span key={member._id} className={`pill ${member.role === "admin" || member.role === "superadmin" ? "admin" : "light"}`}
                        style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {member.name}
                        <button
                          style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: "12px", padding: "0 2px" }}
                          onClick={() => handleRemoveMemberFromGroup(group._id, member._id)}
                          title="Remove"
                        >✕</button>
                      </span>
                    ))}
                  </div>

                  {/* Add member */}
                  <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
                    <select
                      id={`add-member-${group._id}`}
                      className="superAdminSelect"
                      defaultValue=""
                    >
                      <option value="" disabled>Add member…</option>
                      {employees
                        .filter((emp) => !(group.members || []).find((m) => m._id === emp._id))
                        .map((emp) => (
                          <option key={emp._id} value={emp._id}>
                            {emp.name} ({emp.role})
                          </option>
                        ))}
                    </select>
                    <button
                      className="superAdminBtn ghost"
                      onClick={() => {
                        const sel = document.getElementById(`add-member-${group._id}`);
                        if (sel?.value) handleAddMemberToGroup(group._id, sel.value);
                      }}
                    >
                      Add
                    </button>
                    <button
                      className={`superAdminBtn ${group.adminsOnly ? "secondary" : "ghost"}`}
                      onClick={() => handleToggleAdminsOnly(group)}
                    >
                      {group.adminsOnly ? "Allow all members" : "Restrict to admins"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {activeTab === "messages" && (
            <div className="superAdminStack">
              {messages.map((message) => (
                <article key={message._id} className="superAdminCard">
                  <div className="superAdminCardHeader split">
                    <div>
                      <h3>{message.sender?.name || "Unknown"}</h3>
                      <p>{message.receiver?.name ? `to ${message.receiver.name}` : "to group thread"}</p>
                    </div>
                    <small>{formatDateTime(message.timestamp || message.createdAt)}</small>
                  </div>
                  <p>{preview(message)}</p>
                  <small>{message.chatId}</small>
                </article>
              ))}
            </div>
          )}
        </section>

        {showAddEmployeeModal && (
          <div className="superAdminModalOverlay" onClick={() => setShowAddEmployeeModal(false)}>
            <div className="superAdminModal" onClick={(event) => event.stopPropagation()}>
              <div className="superAdminModalHeader">
                <div>
                  <span className="superAdminCardEyebrow">Create</span>
                  <h2>Add Employee</h2>
                </div>
                <button className="superAdminClose" onClick={() => setShowAddEmployeeModal(false)}>x</button>
              </div>
              <form className="superAdminForm" onSubmit={handleAddEmployee}>
                <label><span>Full Name</span><input type="text" value={newEmployee.name} onChange={(event) => setNewEmployee({ ...newEmployee, name: event.target.value })} required /></label>
                <label><span>Email Address</span><input type="email" value={newEmployee.email} onChange={(event) => setNewEmployee({ ...newEmployee, email: event.target.value })} required /></label>
                <label><span>Password</span><input type="password" value={newEmployee.password} onChange={(event) => setNewEmployee({ ...newEmployee, password: event.target.value })} minLength={6} required /></label>
                <label><span>Role</span><select value={newEmployee.role} onChange={(event) => setNewEmployee({ ...newEmployee, role: event.target.value })}><option value="employee">Employee</option><option value="admin">Admin</option><option value="superadmin">Super Admin</option></select></label>
                <label><span>Access</span><div><input type="checkbox" checked={newEmployee.canCreateGroups} onChange={(event) => setNewEmployee({ ...newEmployee, canCreateGroups: event.target.checked })} /> Allow this user to create groups</div></label>
                <div className="superAdminModalActions">
                  <button type="button" className="superAdminBtn ghost" onClick={() => setShowAddEmployeeModal(false)}>Cancel</button>
                  <button type="submit" className="superAdminBtn primary">Save Employee</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showCreateGroupModal && (
          <div className="superAdminModalOverlay" onClick={() => setShowCreateGroupModal(false)}>
            <div className="superAdminModal" onClick={(event) => event.stopPropagation()}>
              <div className="superAdminModalHeader">
                <div>
                  <span className="superAdminCardEyebrow">Create</span>
                  <h2>New Group</h2>
                </div>
                <button className="superAdminClose" onClick={() => setShowCreateGroupModal(false)}>x</button>
              </div>
              <form className="superAdminForm" onSubmit={handleCreateGroup}>
                <label><span>Group Name</span><input type="text" value={newGroup.name} onChange={(event) => setNewGroup({ ...newGroup, name: event.target.value })} required /></label>
                <label><span>Description</span><textarea rows="4" value={newGroup.description} onChange={(event) => setNewGroup({ ...newGroup, description: event.target.value })} /></label>
                <div className="superAdminModalActions">
                  <button type="button" className="superAdminBtn ghost" onClick={() => setShowCreateGroupModal(false)}>Cancel</button>
                  <button type="submit" className="superAdminBtn secondary">Save Group</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
