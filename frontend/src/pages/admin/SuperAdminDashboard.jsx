import React, { useEffect, useMemo, useRef, useState } from "react";
import "./SuperAdminDashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

function formatDate(v)     { return v ? new Date(v).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : "-"; }
function formatDateTime(v) { return v ? new Date(v).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"; }
function formatTime(v)     { return v ? new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""; }
function preview(m)        { return (m.content || m.text || "").trim() || (m.attachment ? "📎 Attachment" : ""); }

// ── Chat Monitor ──────────────────────────────────────────────────────────────
function ChatMonitor({ messages, employees, groups, token }) {
  const [selectedEmp, setSelectedEmp] = useState(null); // filter by employee
  const [selectedConv, setSelectedConv] = useState(null);
  const [convMessages, setConvMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [empSearch, setEmpSearch] = useState("");
  const [convSearch, setConvSearch] = useState("");
  const endRef = useRef(null);

  // All conversations from messages
  const allConversations = useMemo(() => {
    const map = new Map();
    messages.forEach((msg) => {
      const cid = msg.chatId || msg.chat_id || "";
      if (!map.has(cid)) {
        const isGroup = !cid.startsWith("dm_");
        let name = cid;
        if (isGroup) {
          const grp = groups.find((g) => String(g._id) === String(cid));
          name = grp ? grp.name : `Group ${cid}`;
        } else {
          const parts = cid.replace("dm_", "").split("_");
          const empNames = parts.map((id) => {
            const e = employees.find((emp) => String(emp._id) === String(id));
            return e ? e.name : `User ${id}`;
          });
          name = empNames.join(" ↔ ");
        }
        map.set(cid, { cid, name, isGroup, lastMsg: msg, count: 0, participants: [] });
      }
      const conv = map.get(cid);
      conv.lastMsg = msg;
      conv.count += 1;
      // Track participant IDs
      if (msg.sender?._id && !conv.participants.includes(String(msg.sender._id))) {
        conv.participants.push(String(msg.sender._id));
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastMsg?.createdAt || 0) - new Date(a.lastMsg?.createdAt || 0)
    );
  }, [messages, employees, groups]);

  // Filter conversations by selected employee
  const filteredConvs = useMemo(() => {
    let list = allConversations;
    if (selectedEmp) {
      list = list.filter(c =>
        c.participants.includes(String(selectedEmp._id)) ||
        c.cid.includes(String(selectedEmp._id))
      );
    }
    if (convSearch.trim()) {
      list = list.filter(c => c.name.toLowerCase().includes(convSearch.toLowerCase()));
    }
    return list;
  }, [allConversations, selectedEmp, convSearch]);

  // Filter employees
  const filteredEmps = useMemo(() => {
    if (!empSearch.trim()) return employees;
    return employees.filter(e => e.name.toLowerCase().includes(empSearch.toLowerCase()));
  }, [employees, empSearch]);

  const loadConvMessages = async (conv) => {
    setSelectedConv(conv);
    setLoadingMsgs(true);
    try {
      const res = await fetch(`${API_URL}/messages/${encodeURIComponent(conv.cid)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setConvMessages(data.messages || []);
    } catch (e) { console.error(e); }
    finally { setLoadingMsgs(false); }
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convMessages]);

  // When employee changes, clear selected conv
  useEffect(() => {
    setSelectedConv(null);
    setConvMessages([]);
    setConvSearch("");
  }, [selectedEmp]);

  const resolveUrl = (u) => {
    if (!u) return "";
    if (u.startsWith("http")) return u.replace(/^http:\/\//i, "https://");
    const base = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/api\/?$/, "");
    return `${base}${u.startsWith("/") ? "" : "/"}${u}`;
  };

  return (
    <div className="hub-monitor">

      {/* Column 1 — Employee list */}
      <div className="hub-emp-panel">
        <div className="hub-conv-header">
          <span>Employees</span>
          <span className="hub-count-badge">{employees.length}</span>
        </div>
        <input
          className="hub-search"
          placeholder="Search employee…"
          value={empSearch}
          onChange={e => setEmpSearch(e.target.value)}
        />
        <div className="hub-conv-scroll">
          {/* "All" option */}
          <button
            className={`hub-conv-row ${!selectedEmp ? "active" : ""}`}
            onClick={() => setSelectedEmp(null)}
          >
            <div className="hub-conv-avatar" style={{ background: "#e0e0e0", color: "#555", fontSize: 18 }}>👥</div>
            <div className="hub-conv-body">
              <div className="hub-conv-top">
                <span className="hub-conv-name">All Conversations</span>
                <span className="hub-conv-time">{allConversations.length}</span>
              </div>
              <div className="hub-conv-preview">Show all chats</div>
            </div>
          </button>

          {filteredEmps.map(emp => {
            const empConvCount = allConversations.filter(c =>
              c.participants.includes(String(emp._id)) || c.cid.includes(String(emp._id))
            ).length;
            return (
              <button
                key={emp._id}
                className={`hub-conv-row ${selectedEmp?._id === emp._id ? "active" : ""}`}
                onClick={() => setSelectedEmp(emp)}
              >
                <div className="hub-conv-avatar">
                  {emp.avatarUrl
                    ? <img src={emp.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} onError={e => e.target.style.display = "none"} />
                    : emp.name?.[0]?.toUpperCase()
                  }
                </div>
                <div className="hub-conv-body">
                  <div className="hub-conv-top">
                    <span className="hub-conv-name">{emp.name}</span>
                    {empConvCount > 0 && <span className="hub-count-badge" style={{ fontSize: 10 }}>{empConvCount}</span>}
                  </div>
                  <div className="hub-conv-preview">
                    <span className={`hub-role hub-role--${emp.role}`} style={{ fontSize: 11, padding: "1px 6px" }}>{emp.role}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Column 2 — Conversation list */}
      <div className="hub-conv-list">
        <div className="hub-conv-header">
          <span>{selectedEmp ? `${selectedEmp.name}'s Chats` : "All Chats"}</span>
          <span className="hub-count-badge">{filteredConvs.length}</span>
        </div>
        <input
          className="hub-search"
          placeholder="Search chats…"
          value={convSearch}
          onChange={e => setConvSearch(e.target.value)}
        />
        <div className="hub-conv-scroll">
          {filteredConvs.map((conv) => (
            <button
              key={conv.cid}
              className={`hub-conv-row ${selectedConv?.cid === conv.cid ? "active" : ""}`}
              onClick={() => loadConvMessages(conv)}
            >
              <div className="hub-conv-avatar">
                {conv.isGroup ? "👥" : conv.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="hub-conv-body">
                <div className="hub-conv-top">
                  <span className="hub-conv-name">{conv.name}</span>
                  <span className="hub-conv-time">{formatTime(conv.lastMsg?.createdAt)}</span>
                </div>
                <div className="hub-conv-preview">
                  {conv.lastMsg?.sender?.name && <span className="hub-conv-sender">{conv.lastMsg.sender.name}: </span>}
                  {preview(conv.lastMsg)}
                </div>
              </div>
            </button>
          ))}
          {filteredConvs.length === 0 && (
            <div className="hub-empty-small">
              {selectedEmp ? `No chats for ${selectedEmp.name}` : "No conversations"}
            </div>
          )}
        </div>
      </div>

      {/* Column 3 — Message view */}
      <div className="hub-msg-view">
        {!selectedConv ? (
          <div className="hub-msg-empty">
            <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
            <div style={{ fontWeight: 600, color: "#333" }}>
              {selectedEmp ? `Select a chat from ${selectedEmp.name}` : "Select a conversation"}
            </div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>View-only mode</div>
          </div>
        ) : (
          <>
            <div className="hub-msg-header">
              <div className="hub-conv-avatar">{selectedConv.isGroup ? "👥" : selectedConv.name.slice(0, 1).toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{selectedConv.name}</div>
                <div style={{ fontSize: 12, color: "#888" }}>
                  {selectedConv.isGroup ? "Group" : "DM"} · {convMessages.length} messages · read-only
                </div>
              </div>
              <span className="hub-readonly-badge">👁 Monitor</span>
            </div>
            <div className="hub-messages">
              {loadingMsgs ? (
                <div className="hub-loading">Loading…</div>
              ) : convMessages.length === 0 ? (
                <div className="hub-loading">No messages yet</div>
              ) : (
                convMessages.map((msg) => {
                  const att = msg.attachment;
                  return (
                    <div key={msg._id || msg.id} className="hub-msg-row">
                      <div className="hub-msg-avatar">
                        {msg.sender?.avatarUrl
                          ? <img src={msg.sender.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} onError={e => e.target.style.display = "none"} />
                          : (msg.sender?.name || "?")[0].toUpperCase()
                        }
                      </div>
                      <div className="hub-msg-body">
                        <div className="hub-msg-meta">
                          <span className="hub-msg-sender">{msg.sender?.name || "Unknown"}</span>
                          <span className="hub-msg-time">{formatDateTime(msg.createdAt)}</span>
                        </div>
                        {msg.text && <div className="hub-msg-text">{msg.text}</div>}
                        {att?.type === "photo" && (
                          <a href={resolveUrl(att.url)} target="_blank" rel="noopener noreferrer">
                            <img
                              src={resolveUrl(att.url)}
                              alt="photo"
                              className="hub-msg-img"
                              onError={e => {
                                e.target.style.display = "none";
                                e.target.nextSibling && (e.target.nextSibling.style.display = "inline-flex");
                              }}
                            />
                            <span className="hub-msg-file" style={{ display: "none" }}>📷 Photo (unavailable)</span>
                          </a>
                        )}
                        {att?.type === "video" && (
                          <video controls className="hub-msg-video"><source src={resolveUrl(att.url)} /></video>
                        )}
                        {att?.type === "document" && (
                          <a href={resolveUrl(att.url)} target="_blank" rel="noopener noreferrer" className="hub-msg-file">📄 {att.fileName || "File"}</a>
                        )}
                        {att?.type === "link" && (
                          <a href={att.url} target="_blank" rel="noopener noreferrer" className="hub-msg-file">🔗 {att.url}</a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const [groups, setGroups] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState("monitor");
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: "", email: "", password: "", role: "employee", canCreateGroups: false });
  const [newGroup, setNewGroup] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const auth = JSON.parse(localStorage.getItem("employeeAuth") || "{}");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (auth?.role !== "superadmin") return;
    Promise.all([
      fetch(`${API_URL}/groups`,            { headers: { Authorization: `Bearer ${auth.token}` } }).then(r => r.json()).then(d => d.success && setGroups(d.groups)),
      fetch(`${API_URL}/auth/employees`,    { headers: { Authorization: `Bearer ${auth.token}` } }).then(r => r.json()).then(d => d.success && setEmployees(d.employees)),
      fetch(`${API_URL}/auth/all-messages`, { headers: { Authorization: `Bearer ${auth.token}` } }).then(r => r.json()).then(d => d.success && setMessages(d.messages)),
    ]).finally(() => setLoading(false));
  }, []);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const r = await fetch(`${API_URL}/auth/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ ...newEmployee, name: newEmployee.name.trim(), email: newEmployee.email.toLowerCase().trim() }),
      });
      const d = await r.json();
      if (!d.success) { showToast(d.message || "Failed", "error"); return; }
      showToast("Employee created!");
      setNewEmployee({ name: "", email: "", password: "", role: "employee", canCreateGroups: false });
      setShowAddEmployee(false);
      fetch(`${API_URL}/auth/employees`, { headers: { Authorization: `Bearer ${auth.token}` } }).then(r => r.json()).then(d => d.success && setEmployees(d.employees));
    } catch { showToast("Failed", "error"); }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const r = await fetch(`${API_URL}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ name: newGroup.name.trim(), description: newGroup.description.trim() }),
      });
      const d = await r.json();
      if (!d.success) { showToast(d.message || "Failed", "error"); return; }
      showToast("Group created!");
      setNewGroup({ name: "", description: "" });
      setShowCreateGroup(false);
      fetch(`${API_URL}/groups`, { headers: { Authorization: `Bearer ${auth.token}` } }).then(r => r.json()).then(d => d.success && setGroups(d.groups));
    } catch { showToast("Failed", "error"); }
  };

  const handleToggleAdminsOnly = async (group) => {
    const r = await fetch(`${API_URL}/groups/${group._id}/admins-only`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({ adminsOnly: !group.adminsOnly }),
    });
    const d = await r.json();
    if (d.success) { showToast("Updated"); fetch(`${API_URL}/groups`, { headers: { Authorization: `Bearer ${auth.token}` } }).then(r => r.json()).then(d => d.success && setGroups(d.groups)); }
  };

  const handleAddMember = async (groupId, employeeId) => {
    if (!employeeId) return;
    const r = await fetch(`${API_URL}/groups/${groupId}/members/${employeeId}`, { method: "PUT", headers: { Authorization: `Bearer ${auth.token}` } });
    const d = await r.json();
    if (d.success) { showToast("Member added"); fetch(`${API_URL}/groups`, { headers: { Authorization: `Bearer ${auth.token}` } }).then(r => r.json()).then(d => d.success && setGroups(d.groups)); }
  };

  const handleRemoveMember = async (groupId, employeeId) => {
    const r = await fetch(`${API_URL}/groups/${groupId}/members/${employeeId}`, { method: "DELETE", headers: { Authorization: `Bearer ${auth.token}` } });
    const d = await r.json();
    if (d.success) { showToast("Removed"); fetch(`${API_URL}/groups`, { headers: { Authorization: `Bearer ${auth.token}` } }).then(r => r.json()).then(d => d.success && setGroups(d.groups)); }
  };

  if (auth?.role !== "superadmin") return <div className="hub-page"><div className="hub-empty">Access denied.</div></div>;
  if (loading) return <div className="hub-page"><div className="hub-empty">Loading…</div></div>;

  return (
    <div className="hub-page">
      {/* Toast */}
      {toast && <div className={`hub-toast hub-toast--${toast.type}`}>{toast.msg}</div>}

      {/* Header */}
      <div className="hub-header">
        <div>
          <h1 className="hub-title">Admin Hub</h1>
          <p className="hub-subtitle">{employees.length} employees · {groups.length} groups · {messages.length} messages</p>
        </div>
        <div className="hub-header-actions">
          <button className="hub-btn hub-btn--primary" onClick={() => setShowAddEmployee(true)}>+ Employee</button>
          <button className="hub-btn hub-btn--secondary" onClick={() => setShowCreateGroup(true)}>+ Group</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="hub-tabs">
        {[
          { id: "monitor",   label: "💬 Monitor" },
          { id: "employees", label: "👤 Employees" },
          { id: "groups",    label: "👥 Groups" },
        ].map(t => (
          <button key={t.id} className={`hub-tab ${activeTab === t.id ? "active" : ""}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="hub-content">

        {/* Monitor */}
        {activeTab === "monitor" && (
          <ChatMonitor messages={messages} employees={employees} groups={groups} token={auth.token} />
        )}

        {/* Employees */}
        {activeTab === "employees" && (
          <div className="hub-table-wrap">
            <table className="hub-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Group</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp._id}>
                    <td>
                      <div className="hub-emp-name">
                        <div className="hub-emp-avatar">
                          {emp.avatarUrl
                            ? <img src={emp.avatarUrl} alt="" onError={e => e.target.style.display = "none"} />
                            : emp.name?.[0]?.toUpperCase()
                          }
                        </div>
                        {emp.name}
                      </div>
                    </td>
                    <td>{emp.email}</td>
                    <td><span className={`hub-role hub-role--${emp.role}`}>{emp.role}</span></td>
                    <td>{emp.group?.name || <span style={{ color: "#bbb" }}>—</span>}</td>
                    <td>{formatDate(emp.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Groups */}
        {activeTab === "groups" && (
          <div className="hub-groups">
            {groups.map(group => (
              <div key={group._id} className="hub-group-card">
                <div className="hub-group-header">
                  <div>
                    <div className="hub-group-name">{group.name}</div>
                    <div className="hub-group-meta">{group.members?.length || 0} members · Created by {group.createdBy?.name || "Admin"} · {formatDate(group.createdAt)}</div>
                    {group.description && <div className="hub-group-desc">{group.description}</div>}
                  </div>
                  <button
                    className={`hub-btn ${group.adminsOnly ? "hub-btn--secondary" : "hub-btn--ghost"}`}
                    onClick={() => handleToggleAdminsOnly(group)}
                  >
                    {group.adminsOnly ? "🔒 Admins only" : "💬 All members"}
                  </button>
                </div>

                {/* Members */}
                <div className="hub-members">
                  {(group.members || []).map(m => (
                    <span key={m._id} className="hub-member-chip">
                      {m.name}
                      <button onClick={() => handleRemoveMember(group._id, m._id)}>✕</button>
                    </span>
                  ))}
                </div>

                {/* Add member */}
                <div className="hub-add-member">
                  <select id={`sel-${group._id}`} className="hub-select" defaultValue="">
                    <option value="" disabled>Add member…</option>
                    {employees.filter(e => !(group.members || []).find(m => m._id === e._id)).map(e => (
                      <option key={e._id} value={e._id}>{e.name}</option>
                    ))}
                  </select>
                  <button className="hub-btn hub-btn--primary" onClick={() => {
                    const s = document.getElementById(`sel-${group._id}`);
                    if (s?.value) handleAddMember(group._id, s.value);
                  }}>Add</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <div className="hub-overlay" onClick={() => setShowAddEmployee(false)}>
          <div className="hub-modal" onClick={e => e.stopPropagation()}>
            <div className="hub-modal-header">
              <h2>Add Employee</h2>
              <button className="hub-modal-close" onClick={() => setShowAddEmployee(false)}>✕</button>
            </div>
            <form className="hub-form" onSubmit={handleAddEmployee}>
              <div className="hub-field"><label>Full Name</label><input type="text" value={newEmployee.name} onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })} required /></div>
              <div className="hub-field"><label>Email</label><input type="email" value={newEmployee.email} onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })} required /></div>
              <div className="hub-field"><label>Password</label><input type="password" value={newEmployee.password} onChange={e => setNewEmployee({ ...newEmployee, password: e.target.value })} minLength={6} required /></div>
              <div className="hub-field"><label>Role</label>
                <select value={newEmployee.role} onChange={e => setNewEmployee({ ...newEmployee, role: e.target.value })}>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
              <label className="hub-checkbox"><input type="checkbox" checked={newEmployee.canCreateGroups} onChange={e => setNewEmployee({ ...newEmployee, canCreateGroups: e.target.checked })} /> Allow creating groups</label>
              <div className="hub-modal-actions">
                <button type="button" className="hub-btn hub-btn--ghost" onClick={() => setShowAddEmployee(false)}>Cancel</button>
                <button type="submit" className="hub-btn hub-btn--primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="hub-overlay" onClick={() => setShowCreateGroup(false)}>
          <div className="hub-modal" onClick={e => e.stopPropagation()}>
            <div className="hub-modal-header">
              <h2>Create Group</h2>
              <button className="hub-modal-close" onClick={() => setShowCreateGroup(false)}>✕</button>
            </div>
            <form className="hub-form" onSubmit={handleCreateGroup}>
              <div className="hub-field"><label>Group Name</label><input type="text" value={newGroup.name} onChange={e => setNewGroup({ ...newGroup, name: e.target.value })} required /></div>
              <div className="hub-field"><label>Description</label><textarea rows={3} value={newGroup.description} onChange={e => setNewGroup({ ...newGroup, description: e.target.value })} /></div>
              <div className="hub-modal-actions">
                <button type="button" className="hub-btn hub-btn--ghost" onClick={() => setShowCreateGroup(false)}>Cancel</button>
                <button type="submit" className="hub-btn hub-btn--primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
