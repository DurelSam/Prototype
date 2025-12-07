import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faEdit,
  faTrash,
  faEnvelope
} from '@fortawesome/free-solid-svg-icons';
import '../styles/UserManagement.css';

function UserManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'Employee',
    status: 'Active'
  });

  // Mock users data
  useEffect(() => {
    const mockUsers = [
      {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        role: 'Admin',
        status: 'Active',
        lastLogin: new Date('2024-12-03T10:30:00'),
        createdAt: new Date('2024-01-15')
      },
      {
        id: 2,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@company.com',
        role: 'Manager',
        status: 'Active',
        lastLogin: new Date('2024-12-02T14:20:00'),
        createdAt: new Date('2024-02-20')
      },
      {
        id: 3,
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike.johnson@company.com',
        role: 'Employee',
        status: 'Active',
        lastLogin: new Date('2024-12-01T09:15:00'),
        createdAt: new Date('2024-03-10')
      },
      {
        id: 4,
        firstName: 'Sarah',
        lastName: 'Williams',
        email: 'sarah.williams@company.com',
        role: 'Employee',
        status: 'Inactive',
        lastLogin: new Date('2024-11-20T16:45:00'),
        createdAt: new Date('2024-04-05')
      }
    ];

    setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 500);
  }, []);

  // Filter users based on search and filters
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'All' || u.role === filterRole;
    const matchesStatus = filterStatus === 'All' || u.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddUser = () => {
    setModalMode('add');
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: 'Employee',
      status: 'Active'
    });
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      status: user.status
    });
    setShowModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // TODO: API call to delete user
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUsers(users.filter(u => u.id !== userId));
      setMessage({ type: 'success', text: 'User deleted successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete user. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // TODO: API call to add/update user
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (modalMode === 'add') {
        const newUser = {
          id: users.length + 1,
          ...formData,
          lastLogin: null,
          createdAt: new Date()
        };
        setUsers([...users, newUser]);
        setMessage({ type: 'success', text: 'User added successfully! An invitation email has been sent.' });
      } else {
        setUsers(users.map(u =>
          u.id === selectedUser.id
            ? { ...u, ...formData }
            : u
        ));
        setMessage({ type: 'success', text: 'User updated successfully!' });
      }

      setShowModal(false);
      setSelectedUser(null);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save user. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvite = async (userId) => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // TODO: API call to resend invitation
      await new Promise(resolve => setTimeout(resolve, 1000));

      setMessage({ type: 'success', text: 'Invitation email sent successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send invitation. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return 'Never';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if current user is admin
  const isAdmin = user?.role === 'Admin';

  if (!isAdmin) {
    return (
      <div className="user-management-page">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
          <button onClick={() => navigate('/dashboard')} className="back-button">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-page">
      <div className="page-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1 className="page-title">User Management</h1>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="users-container">
        {/* Controls Section */}
        <div className="controls-section">
          <div className="left-controls">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filters">
              <div className="filter-group">
                <label>Role:</label>
                <select
                  className="filter-select"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="All">All Roles</option>
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Status:</label>
                <select
                  className="filter-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <button className="add-user-button" onClick={handleAddUser}>
            + Add User
          </button>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FontAwesomeIcon icon={faUsers} />
            </div>
            <h3>No Users Found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div className="user-info">
                          <div className="user-name">
                            {user.firstName} {user.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.status.toLowerCase()}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="date-cell">{formatDateTime(user.lastLogin)}</td>
                    <td className="date-cell">{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleEditUser(user)}
                          title="Edit user"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteUser(user.id)}
                          title="Delete user"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                        {!user.lastLogin && (
                          <button
                            className="action-btn invite-btn"
                            onClick={() => handleResendInvite(user.id)}
                            title="Resend invitation"
                          >
                            <FontAwesomeIcon icon={faEnvelope} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        <div className="users-summary">
          <div className="summary-item">
            <span className="summary-label">Total Users:</span>
            <span className="summary-value">{users.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Active:</span>
            <span className="summary-value">
              {users.filter(u => u.status === 'Active').length}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Inactive:</span>
            <span className="summary-value">
              {users.filter(u => u.status === 'Inactive').length}
            </span>
          </div>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'add' ? 'Add New User' : 'Edit User'}</h2>
              <button className="close-button" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleFormChange}
                    placeholder="John"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleFormChange}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="john.doe@company.com"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="role">Role</label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleFormChange}
                  >
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {modalMode === 'add' && (
                <div className="info-box">
                  <p>An invitation email will be sent to the user with instructions to set their password.</p>
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="submit-button" disabled={loading}>
                  {loading ? 'Saving...' : (modalMode === 'add' ? 'Add User' : 'Save Changes')}
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
