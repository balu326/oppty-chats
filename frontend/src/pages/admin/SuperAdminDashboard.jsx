import React, { useState, useEffect } from "react";
import "./SuperAdminDashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function SuperAdminDashboard() {
  const [groups, setGroups] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee"
  });
  
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: ""
  });

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

  const fetchAllData = async () => {
    try {
      await Promise.all([fetchGroups(), fetchEmployees(), fetchMessages()]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch(`${API_URL}/groups`);
      const data = await response.json();
      if (data.success) setGroups(data.groups);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/employees`, {
        headers: {
          'Authorization': `Bearer ${currentEmployee.token}`,
          'employee-id': currentEmployee.employeeId
        }
      });
      const data = await response.json();
      if (data.success) {
        setEmployees(data.employees);
        console.log('✅ Employees fetched:', data.employees.length);
      } else {
        console.error('❌ Failed to fetch employees:', data.message);
        setError(data.message || 'Failed to load employees');
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      setError('Network error while fetching employees');
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/all-messages`, {
        headers: {
          'Authorization': `Bearer ${currentEmployee.token}`,
          'employee-id': currentEmployee.employeeId
        }
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
        console.log('✅ Messages fetched:', data.messages.length);
      } else {
        console.error('❌ Failed to fetch messages:', data.message);
        setError(data.message || 'Failed to load messages');
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setError('Network error while fetching messages');
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const { name, email, password, role } = newEmployee;

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Name, email, and password are required");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/employees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password: password,
          role: role
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccessMsg("Employee created successfully!");
        setNewEmployee({ name: "", email: "", password: "", role: "employee" });
        setShowAddEmployeeModal(false);
        fetchEmployees();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setError(data.message || "Failed to create employee");
      }
    } catch (error) {
      console.error("Create employee error:", error);
      setError("Failed to create employee");
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
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
          "Authorization": `Bearer ${currentEmployee.token}`,
          "employee-id": currentEmployee.employeeId
        },
        body: JSON.stringify({
          name: newGroup.name.trim(),
          description: newGroup.description.trim()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccessMsg("Group created successfully!");
        setNewGroup({ name: "", description: "" });
        setShowCreateGroupModal(false);
        fetchGroups();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setError(data.message || "Failed to create group");
      }
    } catch (error) {
      console.error("Create group error:", error);
      setError("Failed to create group");
    }
  };

  if (currentEmployee?.role !== "superadmin") {
    return (
      <div className="super-admin-dashboard">
        <div className="access-denied">
          <h1>🔒 Access Denied</h1>
          <p>Only Super Administrators can access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="super-admin-dashboard">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="super-admin-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1><img src="/opptylogo2.png" alt="Oppty Logo" className="superadmin-logo" /> 🛡️ Super Admin Dashboard</h1>
          <p>Complete system control and monitoring</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddEmployeeModal(true)}
          >
            + Add Employee
          </button>
          <button 
            className="btn btn-success"
            onClick={() => setShowCreateGroupModal(true)}
          >
            + Create Group
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="tabs">
        <button 
          className={`tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📊 Overview
        </button>
        <button 
          className={`tab ${activeTab === "employees" ? "active" : ""}`}
          onClick={() => setActiveTab("employees")}
        >
          👥 Employees
        </button>
        <button 
          className={`tab ${activeTab === "groups" ? "active" : ""}`}
          onClick={() => setActiveTab("groups")}
        >
          📁 Groups
        </button>
        <button 
          className={`tab ${activeTab === "messages" ? "active" : ""}`}
          onClick={() => setActiveTab("messages")}
        >
          💬 All Messages
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "overview" && (
          <div className="overview-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>{employees.length}</h3>
                  <p>Total Employees</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📁</div>
                <div className="stat-info">
                  <h3>{groups.length}</h3>
                  <p>Total Groups</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💬</div>
                <div className="stat-info">
                  <h3>{messages.length}</h3>
                  <p>Total Messages</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👑</div>
                <div className="stat-info">
                  <h3>{employees.filter(e => e.role === "superadmin").length}</h3>
                  <p>Super Admins</p>
                </div>
              </div>
            </div>

            <div className="recent-activity">
              <h2>Recent Messages</h2>
              {messages.slice(0, 5).map((msg) => (
                <div key={msg._id} className="message-preview">
                  <div className="message-sender">{msg.sender?.name || "Unknown"}</div>
                  <div className="message-text">{msg.text}</div>
                  <div className="message-time">{new Date(msg.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "employees" && (
          <div className="employees-tab">
            <h2>All Employees ({employees.length})</h2>
            <div className="employees-table">
              <table>
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
                  {employees.map((emp) => (
                    <tr key={emp._id}>
                      <td>{emp.name}</td>
                      <td>{emp.email}</td>
                      <td>
                        <span className={`badge badge-${emp.role}`}>
                          {emp.role}
                        </span>
                      </td>
                      <td>{emp.group?.name || "-"}</td>
                      <td>{new Date(emp.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "groups" && (
          <div className="groups-tab">
            <h2>All Groups ({groups.length})</h2>
            <div className="groups-list">
              {groups.map((group) => (
                <div key={group._id} className="group-item">
                  <div className="group-info">
                    <h3>{group.name}</h3>
                    <p>{group.description}</p>
                    <div className="group-meta">
                      <span>👥 {group.members?.length || 0} members</span>
                      <span>Created by {group.createdBy?.name || "Admin"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "messages" && (
          <div className="messages-tab">
            <h2>All Messages ({messages.length})</h2>
            <div className="messages-list">
              {messages.map((msg) => (
                <div key={msg._id} className="message-item">
                  <div className="message-header">
                    <strong>{msg.sender?.name || "Unknown"}</strong>
                    <span className="message-role">{msg.sender?.role}</span>
                    <span className="message-date">{new Date(msg.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="message-body">{msg.text}</div>
                  <div className="message-footer">Chat ID: {msg.chatId}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddEmployeeModal && (
        <div className="modal-overlay" onClick={() => setShowAddEmployeeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Employee</h2>
              <button className="modal-close" onClick={() => setShowAddEmployeeModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleAddEmployee}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                  placeholder="Enter employee name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={newEmployee.password}
                  onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})}
                  placeholder="Enter password (min 6 characters)"
                  minLength={6}
                  required
                />
              </div>

              <div className="form-group">
                <label>Role *</label>
                <select
                  value={newEmployee.role}
                  onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #bdbdbd', borderRadius: '6px', fontSize: '1rem' }}
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddEmployeeModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="modal-overlay" onClick={() => setShowCreateGroupModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Group</h2>
              <button className="modal-close" onClick={() => setShowCreateGroupModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label>Group Name *</label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                  placeholder="Enter group name"
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                  placeholder="Enter group description (optional)"
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateGroupModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success">
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
