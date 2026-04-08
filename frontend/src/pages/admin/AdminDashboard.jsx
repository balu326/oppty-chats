import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export default function AdminDashboard() {
  const [groups, setGroups] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    canCreateGroups: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Get current employee info
  const currentEmployee = JSON.parse(localStorage.getItem("employeeAuth") || "{}");

  useEffect(() => {
    if (currentEmployee?.role !== "admin") {
      setError("Access denied. Admin only.");
      return;
    }
    fetchGroups();
    fetchEmployees();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await fetch(`${API_URL}/groups`, {
        headers: { Authorization: `Bearer ${currentEmployee.token}` },
      });
      const data = await response.json();
      if (data.success) setGroups(data.groups);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/employees`, {
        headers: { Authorization: `Bearer ${currentEmployee.token}` },
      });
      const data = await response.json();
      if (data.success) setEmployees(data.employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!newGroupName.trim()) {
      setError("Group name is required");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentEmployee.token}`,
        },
        body: JSON.stringify({
          name: newGroupName.trim(),
          description: newGroupDesc.trim()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccessMsg("Group created successfully!");
        setNewGroupName("");
        setNewGroupDesc("");
        setShowCreateModal(false);
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
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentEmployee.token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password: password,
          role: role,
          canCreateGroups: newEmployee.canCreateGroups,
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccessMsg("Employee created successfully!");
        setNewEmployee({ name: "", email: "", password: "", role: "employee", canCreateGroups: false });
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

  const handleToggleGroupAccess = async (employee) => {
    try {
      const response = await fetch(`${API_URL}/auth/employees/${employee._id}/permissions`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentEmployee.token}`,
        },
        body: JSON.stringify({
          canCreateGroups: !employee.canCreateGroups,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccessMsg(`${employee.name} ${data.employee.canCreateGroups ? "can now create groups" : "can no longer create groups"}`);
        fetchEmployees();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setError(data.message || "Failed to update employee access");
      }
    } catch (toggleError) {
      console.error("Toggle group access error:", toggleError);
      setError("Failed to update employee access");
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!confirm("Are you sure? This will remove all members from the group.")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/groups/${groupId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${currentEmployee.token}`,
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccessMsg("Group deleted successfully!");
        fetchGroups();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setError(data.message || "Failed to delete group");
      }
    } catch (error) {
      console.error("Delete group error:", error);
      setError("Failed to delete group");
    }
  };

  const handleAddToGroup = async (groupId, employeeId) => {
    try {
      const response = await fetch(`${API_URL}/groups/${groupId}/members/${employeeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentEmployee.token}`,
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccessMsg("Employee added to group!");
        fetchGroups();
        fetchEmployees();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setError(data.message || "Failed to add employee");
      }
    } catch (error) {
      console.error("Add to group error:", error);
      setError("Failed to add employee to group");
    }
  };

  const handleRemoveFromGroup = async (groupId, employeeId) => {
    try {
      const response = await fetch(`${API_URL}/groups/${groupId}/members/${employeeId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${currentEmployee.token}`,
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccessMsg("Employee removed from group!");
        fetchGroups();
        fetchEmployees();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setError(data.message || "Failed to remove employee");
      }
    } catch (error) {
      console.error("Remove from group error:", error);
      setError("Failed to remove employee from group");
    }
  };

  if (currentEmployee?.role !== "admin") {
    return (
      <div className="admin-dashboard">
        <div className="admin-error">
          <h1>Access Denied</h1>
          <p>Only administrators can access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-brand">
          <img src="/opptylogo2.png" alt="Oppty Logo" className="admin-logo" />
          <h1>Admin Dashboard - Group Management</h1>
        </div>
        <div className="admin-actions">
          <button 
            className="add-employee-btn"
            onClick={() => setShowAddEmployeeModal(true)}
          >
            + Add Employee
          </button>
          <button 
            className="create-group-btn"
            onClick={() => setShowCreateModal(true)}
          >
            + Create New Group
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMsg && <div className="success-message">{successMsg}</div>}

      <div className="admin-content">
        {/* Groups Section */}
        <div className="groups-section">
          <h2>All Groups</h2>
          {groups.length === 0 ? (
            <p className="no-data">No groups created yet.</p>
          ) : (
            <div className="groups-list">
              {groups.map((group) => (
                <div key={group._id} className="group-card">
                  <div className="group-header">
                    <div>
                      <h3>{group.name}</h3>
                      {group.description && <p className="group-desc">{group.description}</p>}
                      <p className="group-meta">
                        Created by {group.createdBy?.name || "Admin"} • 
                        {group.members?.length || 0} members
                      </p>
                    </div>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteGroup(group._id)}
                    >
                      Delete Group
                    </button>
                  </div>

                  {/* Group Members */}
                  {group.members && group.members.length > 0 && (
                    <div className="group-members">
                      <h4>Members:</h4>
                      <div className="members-list">
                        {group.members.map((member) => (
                          <div key={member._id} className="member-item">
                            <span>{member.name} ({member.email})</span>
                            <button 
                              className="remove-btn"
                              onClick={() => handleRemoveFromGroup(group._id, member._id)}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Member Dropdown */}
                  <div className="add-member-section">
                    <select 
                      id={`add-member-${group._id}`}
                      className="member-select"
                      defaultValue=""
                    >
                      <option value="" disabled>Select employee</option>
                      {employees
                        .filter(emp => !group.members?.find(m => m._id === emp._id))
                        .map((emp) => (
                          <option key={emp._id} value={emp._id}>
                            {emp.name} ({emp.email})
                          </option>
                        ))
                      }
                    </select>
                    <button 
                      className="add-btn"
                      onClick={() => {
                        const select = document.getElementById(`add-member-${group._id}`);
                        if (select.value) {
                          handleAddToGroup(group._id, select.value);
                        }
                      }}
                    >
                      Add Member
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Employees Section */}
        <div className="employees-section">
          <h2>All Employees</h2>
          {employees.length === 0 ? (
            <p className="no-data">No employees found.</p>
          ) : (
            <div className="employees-list">
              {employees.map((emp) => (
                <div key={emp._id} className="employee-card">
                  <div className="emp-info">
                    <h4>{emp.name}</h4>
                    <p>{emp.email}</p>
                    <p className="emp-role">{emp.role}</p>
                    <p className="emp-group">{emp.canCreateGroups ? "Can create groups" : "Group creation disabled"}</p>
                    {emp.group && typeof emp.group === 'object' && (
                      <p className="emp-group">Member of: {emp.group.name}</p>
                    )}
                  </div>
                  {emp.role === "employee" && (
                    <button className="add-btn" onClick={() => handleToggleGroupAccess(emp)}>
                      {emp.canCreateGroups ? "Remove Group Access" : "Give Group Access"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Group</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label>Group Name *</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="Enter group description (optional)"
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  autoFocus
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
                </select>
              </div>

              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="checkbox"
                    checked={newEmployee.canCreateGroups}
                    onChange={(e) => setNewEmployee({ ...newEmployee, canCreateGroups: e.target.checked })}
                  />
                  Allow this user to create groups
                </label>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    setShowAddEmployeeModal(false);
                    setNewEmployee({ name: "", email: "", password: "", role: "employee", canCreateGroups: false });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Create Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
