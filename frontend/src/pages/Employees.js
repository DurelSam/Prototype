import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faEdit,
  faTrash,
  faEnvelope,
  faToggleOn,
  faToggleOff,
  faSearch,
  faComments,
} from '@fortawesome/free-solid-svg-icons';
import '../styles/AdminManagement.css';
import '../animations/dashboardAnimations.css';

function Employees() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/users/employees`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setEmployees(response.data.data);
      }
    } catch (err) {
      console.error('Error loading employees:', err);
      setError(err.response?.data?.message || 'Error loading');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/users/employees`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        const { emailSent, temporaryPassword, emailError } = response.data.data;

        if (emailSent) {
          alert('✅ Employee created successfully! A welcome email has been sent.');
        } else {
          // Email non envoyé - afficher le mot de passe
          alert(
            `✅ Employee created successfully.\n\n` +
            `⚠️ WARNING: The email could not be sent.\n` +
            `Reason: ${emailError === 'Admin email not configured' ? 'You must configure your email in Integrations' : emailError}\n\n` +
            `📧 Email: ${response.data.data.employee.email}\n` +
            `🔑 Temporary password: ${temporaryPassword}\n\n` +
            `⚠️ Please share this information manually with the employee.`
          );
        }

        setShowCreateModal(false);
        resetForm();
        fetchEmployees();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating employee');
    }
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      const { password, ...updateData } = formData; // Ne pas envoyer le mot de passe lors de l'édition

      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/users/employees/${selectedEmployee._id}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert('Employee updated successfully!');
        setShowEditModal(false);
        resetForm();
        fetchEmployees();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating employee');
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!window.confirm('Are you sure you want to delete this Employee?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/users/employees/${employeeId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert('Employee deleted successfully!');
        fetchEmployees();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting employee');
    }
  };

  const handleToggleStatus = async (employeeId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.patch(
        `${process.env.REACT_APP_API_URL}/users/employees/${employeeId}/toggle-status`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert('Status changed successfully!');
        fetchEmployees();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error changing status');
    }
  };

  const viewEmployeeCommunications = (employeeId) => {
    navigate(`/communications?userId=${employeeId}`);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
    });
    setSelectedEmployee(null);
  };

  // Filter employees based on search
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="admin-management-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-management-page">
      <div className="admin-management-container">
        <div className="page-header animate-entry delay-1">
          <h1>Employees Management</h1>
          <button className="btn-primary" onClick={openCreateModal}>
            <FontAwesomeIcon icon={faPlus} /> Create Employee
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Search */}
        <div className="filters animate-entry delay-2">
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Employees Grid */}
        <div className="admins-grid animate-entry delay-3">
          {filteredEmployees.length > 0 ? (
            filteredEmployees.map((employee) => (
              <div key={employee._id} className="admin-card">
                <div className="admin-card-header">
                  <h3>
                    {employee.firstName} {employee.lastName}
                  </h3>
                  <span
                    className={`status-badge ${
                      employee.isActive ? 'active' : 'inactive'
                    }`}
                  >
                    {employee.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="admin-card-body">
                  <p className="admin-email">
                    <FontAwesomeIcon icon={faEnvelope} /> {employee.email}
                  </p>
                  {employee.managedBy && (
                    <p className="admin-tenant">
                      <strong>Managed by:</strong> {employee.managedBy.firstName}{' '}
                      {employee.managedBy.lastName}
                    </p>
                  )}
                  {employee.hasConfiguredEmail && (
                    <p className="admin-email-configured">
                      ✓ Email configured
                    </p>
                  )}
                </div>

                <div className="admin-card-actions">
                  <button
                    className="btn-icon view"
                    onClick={() => viewEmployeeCommunications(employee._id)}
                    title="View Communications"
                  >
                    <FontAwesomeIcon icon={faComments} />
                  </button>

                  <button
                    className="btn-icon edit"
                    onClick={() => openEditModal(employee)}
                    title="Edit"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>

                  <button
                    className="btn-icon toggle"
                    onClick={() => handleToggleStatus(employee._id)}
                    title={employee.isActive ? 'Deactivate' : 'Activate'}
                  >
                    <FontAwesomeIcon
                      icon={employee.isActive ? faToggleOn : faToggleOff}
                    />
                  </button>

                  <button
                    className="btn-icon delete"
                    onClick={() => handleDeleteEmployee(employee._id)}
                    title="Delete"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="no-data">No employees found</p>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowCreateModal(false)}
          >
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create New Employee</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowCreateModal(false)}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateEmployee}>
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>

                <div className="alert-info">
                  <p>
                    A secure password will be automatically generated and sent by email to this Employee.
                  </p>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Create Employee
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowEditModal(false)}
          >
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Edit Employee</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowEditModal(false)}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleUpdateEmployee}>
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Employees;
