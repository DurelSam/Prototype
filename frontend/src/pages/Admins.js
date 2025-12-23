/* src/pages/Admins.js */
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEdit,
  faTrash,
  faUsers,
  faEnvelope,
  faToggleOn,
  faToggleOff,
  faSearch,
  faEye,
  faTimes,
  faInfoCircle,
  faUserShield,
  faCheckCircle,
  faEyeSlash,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import Pagination from "../components/Pagination";
import "../styles/AdminManagement.css";

// --- SUB-COMPONENT: Admin List Tab ---
const AdminListTab = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEmployeesModal, setShowEmployeesModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");

      const response = await axios.get(`${API_URL}/users/admins`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setAdmins(response.data.data);
      }
    } catch (err) {
      console.error("Error loading admins:", err);
      setError(err.response?.data?.message || "Error loading");
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.post(`${API_URL}/users/admins`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const { emailSent, temporaryPassword, emailError } = response.data.data;

        if (emailSent) {
          alert("✅ Admin created successfully! A welcome email has been sent.");
        } else {
          // Email non envoyé - afficher le mot de passe
          alert(
            `✅ Admin created successfully.\n\n` +
            `⚠️ WARNING: The email could not be sent.\n` +
            `Reason: ${emailError === 'UpperAdmin email not configured' ? 'You must configure your email in Integrations' : emailError}\n\n` +
            `📧 Email: ${response.data.data.admin.email}\n` +
            `🔑 Temporary password: ${temporaryPassword}\n\n` +
            `⚠️ Please share this information manually with the admin.`
          );
        }

        closeCreateModal();
        fetchAdmins();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error creating admin");
    }
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("authToken");
      const { password, ...updateData } = formData;

      const response = await axios.put(
        `${API_URL}/users/admins/${selectedAdmin._id}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert("Admin updated successfully!");
        setShowEditModal(false);
        resetForm();
        fetchAdmins();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error updating admin");
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    // Première confirmation
    if (
      !window.confirm(
        "⚠️ WARNING: Are you sure you want to delete this Admin? This action is irreversible."
      )
    ) {
      return;
    }

    // Demander la phrase de confirmation
    const confirmationPhrase = window.prompt(
      'To confirm deletion, please type exactly:\nDELETE ADMIN'
    );

    if (!confirmationPhrase) {
      return; // Utilisateur a annulé
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.delete(
        `${API_URL}/users/admins/${adminId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { confirmationPhrase: confirmationPhrase.trim() }
        }
      );

      if (response.data.success) {
        alert("✅ Admin deleted successfully!");
        fetchAdmins();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting admin");
    }
  };

  const handleToggleStatus = async (adminId) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.patch(
        `${API_URL}/users/admins/${adminId}/toggle-status`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert("Status changed successfully!");
        fetchAdmins();
      }
    } catch (err) {
      alert(
        err.response?.data?.message || "Error changing status"
      );
    }
  };

  const openCreateModal = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    resetForm();
    setShowCreateModal(true);
  };

  const closeCreateModal = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowCreateModal(false);
    resetForm();
  };

  const openEditModal = (admin) => {
    setSelectedAdmin(admin);
    setFormData({
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
    });
    setShowEditModal(true);
  };

  const openEmployeesModal = (admin) => {
    setSelectedAdmin(admin);
    setShowEmployeesModal(true);
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
    });
    setSelectedAdmin(null);
  };

  // Filter admins based on search and status
  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      admin.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "All" ||
      (filterStatus === "Active" && admin.isActive) ||
      (filterStatus === "Inactive" && !admin.isActive);

    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage);
  const totalItems = filteredAdmins.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAdmins = filteredAdmins.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading administrators...</p>
      </div>
    );
  }

  return (
    <div className="tab-content">
      {/* Action Bar */}
      <div className="action-bar">
        <button type="button" className="btn-create" onClick={openCreateModal}>
          <FontAwesomeIcon icon={faPlus} />
          <span>Create Admin</span>
        </button>
      </div>

      {/* Filters */}
      <div className="controls-section">
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="search-admin" className="filter-label">
              Search
            </label>
            <div className="input-with-icon">
              <FontAwesomeIcon icon={faSearch} className="input-icon" />
              <input
                id="search-admin"
                type="text"
                placeholder="Name, first name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="filter-input"
              />
            </div>
          </div>

          <div className="filter-group">
            <label htmlFor="filter-status" className="filter-label">
              Status
            </label>
            <select
              id="filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Admin List */}
      <div className="admin-list">
        {paginatedAdmins.length === 0 ? (
          <div className="empty-state">
            <p>No administrators found.</p>
          </div>
        ) : (
          paginatedAdmins.map((admin, index) => (
            <div
              key={admin._id}
              className={`admin-card admin-card-delay-${Math.min(index, 9)}`}
            >
              {/* Badge Icon */}
              <div className="admin-type-badge">
                <FontAwesomeIcon icon={faUserShield} />
              </div>

              {/* Content */}
              <div className="admin-content">
                <div className="admin-header">
                  <h3 className="admin-name">
                    {admin.firstName} {admin.lastName}
                  </h3>
                  <span
                    className={`status-badge ${
                      admin.isActive ? "active" : "inactive"
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={admin.isActive ? faCheckCircle : faTimesCircle}
                    />
                    <span>{admin.isActive ? "Active" : "Inactive"}</span>
                  </span>
                </div>

                <div className="admin-meta">
                  <div className="meta-item">
                    <FontAwesomeIcon icon={faEnvelope} className="meta-icon" />
                    <span>{admin.email}</span>
                  </div>
                  <div className="meta-item">
                    <FontAwesomeIcon icon={faUsers} className="meta-icon" />
                    <span>{admin.managedEmployeesCount || 0} Employee(s)</span>
                  </div>
                  {admin.hasConfiguredEmail && (
                    <div className="meta-item success">
                      <FontAwesomeIcon
                        icon={faCheckCircle}
                        className="meta-icon"
                      />
                      <span>Email configured</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="admin-actions">
                  <button
                    className="btn-action btn-action-view"
                    onClick={() => openEmployeesModal(admin)}
                    title="View Employees"
                  >
                    <FontAwesomeIcon icon={faEye} />
                    <span>Employees</span>
                  </button>
                  <button
                    className="btn-action btn-action-edit"
                    onClick={() => openEditModal(admin)}
                    title="Edit"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                    <span>Edit</span>
                  </button>
                  <button
                    className="btn-action btn-action-toggle"
                    onClick={() => handleToggleStatus(admin._id)}
                    title={admin.isActive ? "Deactivate" : "Activate"}
                  >
                    <FontAwesomeIcon
                      icon={admin.isActive ? faToggleOn : faToggleOff}
                    />
                  </button>
                  <button
                    className="btn-action btn-action-delete"
                    onClick={() => handleDeleteAdmin(admin._id)}
                    title="Delete"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        loading={loading}
      />

      {/* Modals */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeCreateModal(e);
            }
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-button"
              onClick={closeCreateModal}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>

            <h2>Create New Admin</h2>
            <p className="modal-subtitle">
              Create a new admin account for your organization
            </p>

            <form className="modal-form" onSubmit={handleCreateAdmin}>
              <div className="form-grid">
                <div className="form-group animate-entry delay-2">
                  <label htmlFor="create-firstName">First Name *</label>
                  <input
                    id="create-firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        firstName: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group animate-entry delay-3">
                  <label htmlFor="create-lastName">Last Name *</label>
                  <input
                    id="create-lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                  />
                </div>

                <div className="form-group form-group-full animate-entry delay-4">
                  <label htmlFor="create-email">Email *</label>
                  <input
                    id="create-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="info-banner animate-entry delay-5">
                <FontAwesomeIcon icon={faInfoCircle} />
                <span>
                  A secure password will be automatically generated and sent by email to this Admin.
                </span>
              </div>

              <div className="form-actions animate-entry delay-6">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={closeCreateModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-button"
              onClick={() => setShowEditModal(false)}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>

            <h2>Edit Admin</h2>
            <p className="modal-subtitle">
              Update administrator information
            </p>

            <form className="modal-form" onSubmit={handleUpdateAdmin}>
              <div className="form-grid">
                <div className="form-group animate-entry delay-2">
                  <label htmlFor="edit-firstName">First Name *</label>
                  <input
                    id="edit-firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                </div>

                <div className="form-group animate-entry delay-3">
                  <label htmlFor="edit-lastName">Last Name *</label>
                  <input
                    id="edit-lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                  />
                </div>

                <div className="form-group form-group-full animate-entry delay-4">
                  <label htmlFor="edit-email">Email *</label>
                  <input
                    id="edit-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-actions animate-entry delay-5">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEmployeesModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowEmployeesModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-button"
              onClick={() => setShowEmployeesModal(false)}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>

            <h2>
              Employees managed by {selectedAdmin?.firstName}{" "}
              {selectedAdmin?.lastName}
            </h2>
            <p className="modal-subtitle">
              List of employees under this administrator's supervision
            </p>

            <div className="modal-body animate-entry delay-2">
              {selectedAdmin?.managedEmployees &&
              selectedAdmin.managedEmployees.length > 0 ? (
                <div className="employees-list">
                  {selectedAdmin.managedEmployees.map((employee, index) => (
                    <div
                      key={employee._id}
                      className={`employee-item animate-entry delay-${Math.min(index + 3, 10)}`}
                    >
                      <div className="employee-avatar">
                        {employee.firstName?.[0]?.toUpperCase()}
                        {employee.lastName?.[0]?.toUpperCase()}
                      </div>
                      <div className="employee-info">
                        <h4 className="employee-name">
                          {employee.firstName} {employee.lastName}
                        </h4>
                        <p className="employee-email">{employee.email}</p>
                      </div>
                      <span
                        className={`status-badge ${
                          employee.isActive ? "active" : "inactive"
                        }`}
                      >
                        <FontAwesomeIcon
                          icon={
                            employee.isActive ? faCheckCircle : faTimesCircle
                          }
                        />
                        <span>{employee.isActive ? "Active" : "Inactive"}</span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No employees managed yet</p>
                </div>
              )}
            </div>

            <div className="form-actions animate-entry delay-3">
              <button
                className="btn-cancel"
                onClick={() => setShowEmployeesModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT: Admins Management ---
function Admins() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) {
    return (
      <div className="admin-management-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-management-page">
      <div className="admin-management-header">
        <h1 className="page-title">Admins Management</h1>
      </div>

      <AdminListTab />
    </div>
  );
}

export default Admins;
