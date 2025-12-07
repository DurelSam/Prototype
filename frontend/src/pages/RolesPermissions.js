import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldAlt,
  faUserShield,
  faUserTie,
  faUser,
  faCheck,
  faTimes,
  faEdit,
  faSave,
  faUndo
} from '@fortawesome/free-solid-svg-icons';
import '../styles/RolesPermissions.css';

function RolesPermissions() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });

  // Permission categories and their individual permissions
  const permissionCategories = {
    'Dashboard': [
      { id: 'view_dashboard', name: 'View Dashboard' },
      { id: 'view_analytics', name: 'View Analytics' },
      { id: 'export_reports', name: 'Export Reports' }
    ],
    'Communications': [
      { id: 'view_communications', name: 'View Communications' },
      { id: 'send_email', name: 'Send Email' },
      { id: 'send_whatsapp', name: 'Send WhatsApp' },
      { id: 'delete_communications', name: 'Delete Communications' }
    ],
    'User Management': [
      { id: 'view_users', name: 'View Users' },
      { id: 'create_users', name: 'Create Users' },
      { id: 'edit_users', name: 'Edit Users' },
      { id: 'delete_users', name: 'Delete Users' },
      { id: 'assign_roles', name: 'Assign Roles' }
    ],
    'Integrations': [
      { id: 'view_integrations', name: 'View Integrations' },
      { id: 'manage_integrations', name: 'Manage Integrations' },
      { id: 'sync_integrations', name: 'Sync Integrations' }
    ],
    'Settings': [
      { id: 'view_settings', name: 'View Settings' },
      { id: 'edit_organization_settings', name: 'Edit Organization Settings' },
      { id: 'manage_automation_rules', name: 'Manage Automation Rules' },
      { id: 'manage_scheduled_reports', name: 'Manage Scheduled Reports' }
    ],
    'AI & Analysis': [
      { id: 'view_ai_analysis', name: 'View AI Analysis' },
      { id: 'request_ai_analysis', name: 'Request AI Analysis' },
      { id: 'configure_ai_settings', name: 'Configure AI Settings' }
    ]
  };

  useEffect(() => {
    // Mock data - Replace with actual API call
    const mockRoles = [
      {
        id: 1,
        name: 'SuperUser',
        displayName: 'Super User',
        description: 'Full system access with all permissions',
        icon: faShieldAlt,
        color: '#ef4444',
        userCount: 1,
        isSystem: true
      },
      {
        id: 2,
        name: 'UpperAdmin',
        displayName: 'Upper Admin',
        description: 'High-level administrative access',
        icon: faUserShield,
        color: '#f59e0b',
        userCount: 3,
        isSystem: true
      },
      {
        id: 3,
        name: 'Admin',
        displayName: 'Admin',
        description: 'Standard administrative access',
        icon: faUserTie,
        color: '#3b82f6',
        userCount: 8,
        isSystem: true
      },
      {
        id: 4,
        name: 'Employee',
        displayName: 'Employee',
        description: 'Basic user access',
        icon: faUser,
        color: '#10b981',
        userCount: 45,
        isSystem: true
      }
    ];

    // Mock permissions data
    const mockPermissions = {
      SuperUser: {
        view_dashboard: true,
        view_analytics: true,
        export_reports: true,
        view_communications: true,
        send_email: true,
        send_whatsapp: true,
        delete_communications: true,
        view_users: true,
        create_users: true,
        edit_users: true,
        delete_users: true,
        assign_roles: true,
        view_integrations: true,
        manage_integrations: true,
        sync_integrations: true,
        view_settings: true,
        edit_organization_settings: true,
        manage_automation_rules: true,
        manage_scheduled_reports: true,
        view_ai_analysis: true,
        request_ai_analysis: true,
        configure_ai_settings: true
      },
      UpperAdmin: {
        view_dashboard: true,
        view_analytics: true,
        export_reports: true,
        view_communications: true,
        send_email: true,
        send_whatsapp: true,
        delete_communications: true,
        view_users: true,
        create_users: true,
        edit_users: true,
        delete_users: false,
        assign_roles: true,
        view_integrations: true,
        manage_integrations: true,
        sync_integrations: true,
        view_settings: true,
        edit_organization_settings: true,
        manage_automation_rules: true,
        manage_scheduled_reports: true,
        view_ai_analysis: true,
        request_ai_analysis: true,
        configure_ai_settings: true
      },
      Admin: {
        view_dashboard: true,
        view_analytics: true,
        export_reports: true,
        view_communications: true,
        send_email: true,
        send_whatsapp: true,
        delete_communications: false,
        view_users: true,
        create_users: true,
        edit_users: true,
        delete_users: false,
        assign_roles: false,
        view_integrations: true,
        manage_integrations: false,
        sync_integrations: true,
        view_settings: true,
        edit_organization_settings: false,
        manage_automation_rules: false,
        manage_scheduled_reports: true,
        view_ai_analysis: true,
        request_ai_analysis: true,
        configure_ai_settings: false
      },
      Employee: {
        view_dashboard: true,
        view_analytics: false,
        export_reports: false,
        view_communications: true,
        send_email: true,
        send_whatsapp: true,
        delete_communications: false,
        view_users: false,
        create_users: false,
        edit_users: false,
        delete_users: false,
        assign_roles: false,
        view_integrations: false,
        manage_integrations: false,
        sync_integrations: false,
        view_settings: true,
        edit_organization_settings: false,
        manage_automation_rules: false,
        manage_scheduled_reports: false,
        view_ai_analysis: true,
        request_ai_analysis: false,
        configure_ai_settings: false
      }
    };

    setTimeout(() => {
      setRoles(mockRoles);
      setPermissions(mockPermissions);
      setLoading(false);
    }, 300);
  }, []);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setEditMode(false);
  };

  const handleEditToggle = () => {
    setEditMode(!editMode);
    if (editMode) {
      setMessage({ type: '', text: '' });
    }
  };

  const handlePermissionToggle = (permissionId) => {
    if (!editMode || !selectedRole) return;

    setPermissions(prev => ({
      ...prev,
      [selectedRole.name]: {
        ...prev[selectedRole.name],
        [permissionId]: !prev[selectedRole.name][permissionId]
      }
    }));
  };

  const handleSaveChanges = async () => {
    setMessage({ type: '', text: '' });

    try {
      // TODO: API call to save permissions
      await new Promise(resolve => setTimeout(resolve, 1000));

      setMessage({ type: 'success', text: 'Permissions updated successfully!' });
      setEditMode(false);

      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update permissions. Please try again.' });
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setMessage({ type: '', text: '' });
    // TODO: Reload permissions from server to discard changes
  };

  const countActivePermissions = (roleName) => {
    if (!permissions[roleName]) return 0;
    return Object.values(permissions[roleName]).filter(Boolean).length;
  };

  if (loading) {
    return (
      <div className="roles-permissions-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading roles and permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="roles-permissions-page">
      <div className="roles-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1 className="page-title">Roles & Permissions</h1>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="roles-container">
        {/* Roles List Sidebar */}
        <div className="roles-sidebar">
          <h2 className="sidebar-title">Roles</h2>
          <div className="roles-list">
            {roles.map(role => (
              <div
                key={role.id}
                className={`role-item ${selectedRole?.id === role.id ? 'active' : ''}`}
                onClick={() => handleRoleSelect(role)}
              >
                <div className="role-icon" style={{ color: role.color }}>
                  <FontAwesomeIcon icon={role.icon} />
                </div>
                <div className="role-info">
                  <h3 className="role-name">{role.displayName}</h3>
                  <p className="role-stats">
                    {role.userCount} {role.userCount === 1 ? 'user' : 'users'} • {countActivePermissions(role.name)} permissions
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Permissions Details */}
        <div className="permissions-content">
          {!selectedRole ? (
            <div className="empty-state">
              <div className="empty-icon">
                <FontAwesomeIcon icon={faShieldAlt} />
              </div>
              <h3>Select a Role</h3>
              <p>Choose a role from the list to view and manage its permissions</p>
            </div>
          ) : (
            <>
              <div className="permissions-header">
                <div className="role-details">
                  <div className="role-icon-large" style={{ color: selectedRole.color }}>
                    <FontAwesomeIcon icon={selectedRole.icon} />
                  </div>
                  <div>
                    <h2 className="role-title">{selectedRole.displayName}</h2>
                    <p className="role-description">{selectedRole.description}</p>
                    <div className="role-meta">
                      <span className="meta-item">
                        {selectedRole.userCount} {selectedRole.userCount === 1 ? 'user' : 'users'}
                      </span>
                      <span className="meta-separator">•</span>
                      <span className="meta-item">
                        {countActivePermissions(selectedRole.name)} active permissions
                      </span>
                      {selectedRole.isSystem && (
                        <>
                          <span className="meta-separator">•</span>
                          <span className="meta-item system-role">System Role</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="permissions-actions">
                  {!editMode ? (
                    <button className="edit-button" onClick={handleEditToggle}>
                      <FontAwesomeIcon icon={faEdit} /> Edit Permissions
                    </button>
                  ) : (
                    <>
                      <button className="cancel-button" onClick={handleCancelEdit}>
                        <FontAwesomeIcon icon={faUndo} /> Cancel
                      </button>
                      <button className="save-button" onClick={handleSaveChanges}>
                        <FontAwesomeIcon icon={faSave} /> Save Changes
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="permissions-grid">
                {Object.entries(permissionCategories).map(([category, perms]) => (
                  <div key={category} className="permission-category">
                    <h3 className="category-title">{category}</h3>
                    <div className="permissions-list">
                      {perms.map(permission => {
                        const isGranted = permissions[selectedRole.name]?.[permission.id] || false;
                        return (
                          <div
                            key={permission.id}
                            className={`permission-item ${isGranted ? 'granted' : 'denied'} ${editMode ? 'editable' : ''}`}
                            onClick={() => handlePermissionToggle(permission.id)}
                          >
                            <div className="permission-checkbox">
                              <div className={`checkbox ${isGranted ? 'checked' : ''}`}>
                                {isGranted && <FontAwesomeIcon icon={faCheck} />}
                              </div>
                            </div>
                            <div className="permission-details">
                              <span className="permission-name">{permission.name}</span>
                            </div>
                            <div className="permission-status">
                              {isGranted ? (
                                <span className="status-badge granted">
                                  <FontAwesomeIcon icon={faCheck} /> Granted
                                </span>
                              ) : (
                                <span className="status-badge denied">
                                  <FontAwesomeIcon icon={faTimes} /> Denied
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default RolesPermissions;
