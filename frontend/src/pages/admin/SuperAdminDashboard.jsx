import React, { useEffect, useMemo, useRef, useState } from "react";
import "./SuperAdminDashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const TABS = [
  { id: "overview",  label: "Overview",  mobile: "Home"   },
  { id: "monitor",   label: "Monitor",   mobile: "Chats"  },
  { id: "employees", label: "Employees", mobile: "People" },
  { id: "groups",    label: "Groups",    mobile: "Groups" },
];

function formatDate(v)     { return v ? new Date(v).toLocaleDateString()  : "-"; }
function formatDateTime(v) { return v ? new Date(v).toLocaleString()      : "-"; }
function formatTime(v)     { return v ? new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""; }
function preview(m)        { return (m.content || m.text || "").trim() || (m.attachment ? "📎 Attachment" : "No content"); }

function EmptyState({ eyebrow, title, text }) {
  return (
    <section className="superAdminEmptyState">
      <span className="superAdminEyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </section>
  );
}

// ── Chat Monitor Component ──────────────────────────────────────────────────
function ChatMonitor({ messages, employees, groups, token }) {
  const [selectedConv, setSelectedConv] = useState(null);
  const [convMessages, setConvMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [search, setSearch] = useState("");
  const endRef = useRef(null);

  // Build conversation list from all messages
  const conversations = useMemo(() => {
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
        map.set(cid, { cid, name, isGroup, lastMsg: msg, count: 0 });
      }
      map.get(cid).lastMsg = msg;
      map.get(cid).count += 1;
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastMsg?.createdAt || 0) - new Date(a.lastMsg?.createdAt || 0)
    );
  }, [messages, employees, groups]);

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    return conversations.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [conversations, search]);

  const loadConvMessages = async (conv) => {
    setSelectedConv(conv);
    setLoadingMsgs(true);
    try {
      const res = await fetch(`${API_URL}/messages/${encodeURIComponent(conv.cid)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setConvMessages(data.messages || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMsgs(false);
    }
  };

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [convMessages]);

  return (
    <div className="monitorShell">
      {/* Left: conversation list */}
      <div className="monitorList">
        <div className="monitorListHeader">
          <span className="monitorListTitle">All Conversations</span>
          <span className="monitorBadge">{conversations.length}</span>
        </div>
        <input
          className="monitorSearch"
          placeholder="Search conversations…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="monitorConvList">
          {filtered.map((conv) => (
            <button
              key={conv.cid}
              className={`monitorConvRow ${selectedConv?.cid === conv.cid ? "active" : ""}`}
              onClick={() => loadConvMessages(conv)}
            >
              <div className="monitorConvAvatar">
                {conv.isGroup ? "👥" : conv.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="monitorConvBody">
                <div className="monitorConvTop">
                  <span className="monitorConvName">{conv.name}</span>
                  <span className="monitorConvTime">{formatTime(conv.lastMsg?.createdAt)}</span>
                </div>
                <div className="monitorConvPreview">
                  <span>{conv.lastMsg?.sender?.name && `${conv.lastMsg.sender.name}: `}{preview(conv.lastMsg)}</span>
                  <span className="monitorConvCount">{conv.count}</span>
                </div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && <div className="monitorEmpty">No conversations found</div>}
        </div>
      </div>

      {/* Right: message view */}
      <div className="monitorChat">
        {!selectedConv ? (
          <div className="monitorChatEmpty">
            <div className="monitorChatEmptyIcon">👁</div>
            <div className="monitorChatEmptyTitle">Select a conversation to monitor</div>
            <div className="monitorChatEmptyText">View-only mode — messages cannot be sent</div>
          </div>
        ) : (
          <>
            <div className="monitorChatHeader">
              <div className="monitorChatHeaderAvatar">
                {selectedConv.isGroup ? "👥" : selectedConv.name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div className="monitorChatHeaderName">{selectedConv.name}</div>
                <div className="monitorChatHeaderMeta">
                  {selectedConv.isGroup ? "Group chat" : "Direct message"} · {convMessages.length} messages · read-only
                </div>
              </div>
              <span className="monitorReadOnlyBadge">👁 Monitor</span>
            </div>

            <div className="monitorMessages">
              {loadingMsgs ? (
                <div className="monitorLoading">Loading messages…</div>
              ) : convMessages.length === 0 ? (
                <div className="monitorLoading">No messages yet</div>
              ) : (
                convMessages.map((msg) => {
                  const assetBase = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/api\/?$/, "");
                  const resolveUrl = (u) => {
                    if (!u) return "";
                    if (u.startsWith("http")) return u.replace("http://", "https://");
                    return `${assetBase}${u}`;
                  };
                  const att = msg.attachment;
                  return (
                    <div key={msg._id || msg.id} className="monitorMsgRow">
                      <div className="monitorMsgAvatar">
                        {msg.sender?.avatarUrl
                          ? <img src={msg.sender.avatarUrl} alt={msg.sender.name} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}} onError={e=>e.target.style.display="none"} />
                          : (msg.sender?.name || "?").slice(0, 1).toUpperCase()
                        }
                      </div>
                      <div className="monitorMsgBody">
                        <div className="monitorMsgMeta">
                          <span className="monitorMsgSender">{msg.sender?.name || "Unknown"}</span>
                          <span className="monitorMsgTime">{formatDateTime(msg.createdAt)}</span>
                        </div>
                        {msg.text && <div className="monitorMsgText">{msg.text}</div>}
                        {att?.type === "photo" && (
                          <a href={resolveUrl(att.url)} target="_blank" rel="noopener noreferrer">
                            <img
                              src={resolveUrl(att.url)}
                              alt="photo"
                              className="monitorMsgImg"
                              onError={e => { e.target.style.display="none"; }}
                            />
                          </a>
                        )}
                        {att?.type === "video" && (
                          <video controls className="monitorMsgVideo">
                            <source src={resolveUrl(att.url)} />
                          </video>
                        )}
                        {att?.type === "document" && (
                          <a href={resolveUrl(att.url)} target="_blank" rel="noopener noreferrer" className="monitorMsgFile">
                            📄 {att.fileName || "File"}
                          </a>
                        )}
                        {att?.type === "link" && (
                          <a href={att.url} target="_blank" rel="noopener noreferrer" className="monitorMsgLink">
                            🔗 {att.url}
                          </a>
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
    if (currentEmployee?.role !== "superadmin") { setError("Access denied."); return; }
    fetchAllData();
  }, []);

  const stats = useMemo(() => [
    { label: "Employees", value: employees.length, tone: "peach" },
    { label: "Groups",    value: groups.length,    tone: "sky"   },
    { label: "Messages",  value: messages.length,  tone: "mint"  },
    { label: "Super Admins", value: employees.filter((e) => e.role === "superadmin").length, tone: "gold" },
  ], [employees, groups, messages]);

  const fetchAllData = async () => {
    try { await Promise.all([fetchGroups(), fetchEmployees(), fetchMessages()]); }
    finally { setLoading(false); }
  };

  const fetchGroups = async () => {
    try {
      const r = await fetch(`${API_URL}/groups`, { headers: { Authorization: `Bearer ${currentEmployee.token}` } });
      const d = await r.json();
      if (d.success) setGroups(d.groups);
    } catch (e) { console.error(e); }
  };

  const fetchEmployees = async () => {
    try {
      const r = await fetch(`${API_URL}/auth/employees`, { headers: { Authorization: `Bearer ${currentEmployee.token}` } });
      const d = await r.json();
      if (d.success) setEmployees(d.employees);
    } catch (e) { console.error(e); }
  };

  const fetchMessages = async () => {
    try {
      const r = await fetch(`${API_URL}/auth/all-messages`, { headers: { Authorization: `Bearer ${currentEmployee.token}` } });
      const d = await r.json();
      if (d.success) setMessages(d.messages);
    } catch (e) { console.error(e); }
  };

  const handleAddEmployee = async (event) => {
    event.preventDefault(); setError(""); setSuccessMsg("");
    if (!newEmployee.name.trim() || !newEmployee.email.trim() || !newEmployee.password.trim()) { setError("All fields required"); return; }
    if (newEmployee.password.length < 6) { setError("Password min 6 chars"); return; }
    try {
      const r = await fetch(`${API_URL}/auth/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${currentEmployee.token}` },
        body: JSON.stringify({ name: newEmployee.name.trim(), email: newEmployee.email.toLowerCase().trim(), password: newEmployee.password, role: newEmployee.role, canCreateGroups: newEmployee.canCreateGroups }),
      });
      const d = await r.json();
      if (!d.success) { setError(d.message || "Failed"); return; }
      setSuccessMsg("Employee created!"); setNewEmployee({ name: "", email: "", password: "", role: "employee", canCreateGroups: false });
      setShowAddEmployeeModal(false); fetchEmployees(); setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e) { setError("Failed to create employee"); }
  };

  const handleCreateGroup = async (event) => {
    event.preventDefault(); setError(""); setSuccessMsg("");
    if (!newGroup.name.trim()) { setError("Group name required"); return; }
    try {
      const r = await fetch(`${API_URL}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${currentEmployee.token}` },
        body: JSON.stringify({ name: newGroup.name.trim(), description: newGroup.description.trim() }),
      });
      const d = await r.json();
      if (!d.success) { setError(d.message || "Failed"); return; }
      setSuccessMsg("Group created!"); setNewGroup({ name: "", description: "" });
      setShowCreateGroupModal(false); fetchGroups(); setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e) { setError("Failed to create group"); }
  };

  const handleToggleAdminsOnly = async (group) => {
    try {
      const r = await fetch(`${API_URL}/groups/${group._id}/admins-only`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${currentEmployee.token}` },
        body: JSON.stringify({ adminsOnly: !group.adminsOnly }),
      });
      const d = await r.json();
      if (d.success) { setSuccessMsg(`Updated`); fetchGroups(); setTimeout(() => setSuccessMsg(""), 3000); }
    } catch (e) { setError("Failed"); }
  };

  const handleAddMemberToGroup = async (groupId, employeeId) => {
    if (!employeeId) return;
    try {
      const r = await fetch(`${API_URL}/groups/${groupId}/members/${employeeId}`, { method: "PUT", headers: { Authorization: `Bearer ${currentEmployee.token}` } });
      const d = await r.json();
      if (d.success) { setSuccessMsg("Member added"); fetchGroups(); setTimeout(() => setSuccessMsg(""), 3000); }
    } catch (e) { setError("Failed"); }
  };

  const handleRemoveMemberFromGroup = async (groupId, employeeId) => {
    try {
      const r = await fetch(`${API_URL}/groups/${groupId}/members/${employeeId}`, { method: "DELETE", headers: { Authorization: `Bearer ${currentEmployee.token}` } });
      const d = await r.json();
      if (d.success) { setSuccessMsg("Member removed"); fetchGroups(); setTimeout(() => setSuccessMsg(""), 3000); }
    } catch (e) { setError("Failed"); }
  };

  if (currentEmployee?.role !== "superadmin") return <div className="superAdminPage"><div className="superAdminShell"><EmptyState eyebrow="Restricted" title="Super admin only" text="Sign in with a super admin account." /></div></div>;
  if (loading) return <div className="superAdminPage"><div className="superAdminShell"><EmptyState eyebrow="Loading" title="Preparing control room" text="Fetching data…" /></div></div>;

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
                <p>Monitor all chats and manage the workspace.</p>
              </div>
            </div>
            <div className="superAdminActions">
              <button className="superAdminBtn primary" onClick={() => setShowAddEmployeeModal(true)}>Add Employee</button>
              <button className="superAdminBtn secondary" onClick={() => setShowCreateGroupModal(true)}>Create Group</button>
            </div>
          </div>
          <div className="superAdminStatsGrid">
            {stats.map((s) => (
              <article key={s.label} className={`superAdminStatCard ${s.tone}`}>
                <span>{s.label}</span><strong>{s.value}</strong>
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
                  {messages.slice(0, 6).map((msg) => (
                    <div key={msg._id} className="superAdminFeedItem">
                      <div className="superAdminAvatar">{(msg.sender?.name || "?").slice(0, 1).toUpperCase()}</div>
                      <div>
                        <strong>{msg.sender?.name || "Unknown"}</strong>
                        <p>{preview(msg)}</p>
                        <small>{formatDateTime(msg.timestamp || msg.createdAt)}</small>
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
                  <div className="superAdminMiniCard"><span>Total chats</span><strong>{messages.length > 0 ? new Set(messages.map(m => m.chatId)).size : 0}</strong></div>
                </div>
              </article>
            </div>
          )}

          {activeTab === "monitor" && (
            <ChatMonitor
              messages={messages}
              employees={employees}
              groups={groups}
              token={currentEmployee.token}
            />
          )}

          {activeTab === "employees" && (
            <div className="superAdminGrid">
              {employees.map((emp) => (
                <article key={emp._id} className="superAdminCard">
                  <div className="superAdminCardHeader">
                    <div className="superAdminAvatar">{emp.name?.slice(0, 1).toUpperCase()}</div>
                    <div><h3>{emp.name}</h3><p>{emp.email}</p></div>
                  </div>
                  <div className="superAdminPills">
                    <span className={`pill ${emp.role}`}>{emp.role}</span>
                    <span className="pill neutral">{emp.group?.name || "No group"}</span>
                  </div>
                  <small>Joined {formatDate(emp.createdAt)}</small>
                </article>
              ))}
            </div>
          )}

          {activeTab === "groups" && (
            <div className="superAdminStack">
              {groups.map((group) => (
                <article key={group._id} className="superAdminCard">
                  <div className="superAdminCardHeader split">
                    <div><span className="superAdminCardEyebrow">Group</span><h3>{group.name}</h3></div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <span className="pill neutral">{group.members?.length || 0} members</span>
                      <span className={`pill ${group.adminsOnly ? "admin" : "neutral"}`}>{group.adminsOnly ? "🔒 Admins only" : "💬 All members"}</span>
                    </div>
                  </div>
                  <p>{group.description || "No description."}</p>
                  <small>Created by {group.createdBy?.name || "Super Admin"} on {formatDate(group.createdAt)}</small>
                  <div className="superAdminPills wrap" style={{ marginTop: "10px" }}>
                    {(group.members || []).map((m) => (
                      <span key={m._id} className={`pill ${m.role === "admin" || m.role === "superadmin" ? "admin" : "light"}`} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {m.name}
                        <button style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: "12px" }} onClick={() => handleRemoveMemberFromGroup(group._id, m._id)}>✕</button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
                    <select id={`add-${group._id}`} className="superAdminSelect" defaultValue="">
                      <option value="" disabled>Add member…</option>
                      {employees.filter((e) => !(group.members || []).find((m) => m._id === e._id)).map((e) => (
                        <option key={e._id} value={e._id}>{e.name} ({e.role})</option>
                      ))}
                    </select>
                    <button className="superAdminBtn ghost" onClick={() => { const s = document.getElementById(`add-${group._id}`); if (s?.value) handleAddMemberToGroup(group._id, s.value); }}>Add</button>
                    <button className={`superAdminBtn ${group.adminsOnly ? "secondary" : "ghost"}`} onClick={() => handleToggleAdminsOnly(group)}>
                      {group.adminsOnly ? "Allow all" : "Restrict to admins"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {showAddEmployeeModal && (
          <div className="superAdminModalOverlay" onClick={() => setShowAddEmployeeModal(false)}>
            <div className="superAdminModal" onClick={(e) => e.stopPropagation()}>
              <div className="superAdminModalHeader">
                <div><span className="superAdminCardEyebrow">Create</span><h2>Add Employee</h2></div>
                <button className="superAdminClose" onClick={() => setShowAddEmployeeModal(false)}>✕</button>
              </div>
              <form className="superAdminForm" onSubmit={handleAddEmployee}>
                <label><span>Full Name</span><input type="text" value={newEmployee.name} onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })} required /></label>
                <label><span>Email</span><input type="email" value={newEmployee.email} onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })} required /></label>
                <label><span>Password</span><input type="password" value={newEmployee.password} onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })} minLength={6} required /></label>
                <label><span>Role</span><select value={newEmployee.role} onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}><option value="employee">Employee</option><option value="admin">Admin</option><option value="superadmin">Super Admin</option></select></label>
                <label><span>Access</span><div><input type="checkbox" checked={newEmployee.canCreateGroups} onChange={(e) => setNewEmployee({ ...newEmployee, canCreateGroups: e.target.checked })} /> Allow creating groups</div></label>
                <div className="superAdminModalActions">
                  <button type="button" className="superAdminBtn ghost" onClick={() => setShowAddEmployeeModal(false)}>Cancel</button>
                  <button type="submit" className="superAdminBtn primary">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showCreateGroupModal && (
          <div className="superAdminModalOverlay" onClick={() => setShowCreateGroupModal(false)}>
            <div className="superAdminModal" onClick={(e) => e.stopPropagation()}>
              <div className="superAdminModalHeader">
                <div><span className="superAdminCardEyebrow">Create</span><h2>New Group</h2></div>
                <button className="superAdminClose" onClick={() => setShowCreateGroupModal(false)}>✕</button>
              </div>
              <form className="superAdminForm" onSubmit={handleCreateGroup}>
                <label><span>Group Name</span><input type="text" value={newGroup.name} onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })} required /></label>
                <label><span>Description</span><textarea rows="3" value={newGroup.description} onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })} /></label>
                <div className="superAdminModalActions">
                  <button type="button" className="superAdminBtn ghost" onClick={() => setShowCreateGroupModal(false)}>Cancel</button>
                  <button type="submit" className="superAdminBtn secondary">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

