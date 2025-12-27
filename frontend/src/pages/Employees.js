/* src/pages/Employees.js */
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEdit,
  faTrash,
  faEnvelope,
  faToggleOn,
  faToggleOff,
  faSearch,
  faEye,
  faTimes,
  faInfoCircle,
  faCheckCircle,
  faTimesCircle,
  faUser,
  faComments,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import Pagination from "../components/Pagination";
import { useNavigate } from "react-router-dom";
import "../styles/AdminManagement.css";

// --- SUB-COMPONENT: Employee List Tab ---
const EmployeeListTab = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [creating, setCreating] = useState(false);

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

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");

      const response = await axios.get(`${API_URL}/users/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setEmployees(response.data.data);
      }
    } catch (err) {
      console.error("Error loading employees:", err);
      setError(err.response?.data?.message || "Error loading");
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      const token = localStorage.getItem("authToken");
      const response = await axios.post(`${API_URL}/users/employees`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const { emailSent, temporaryPassword, emailError } = response.data.data;

        if (emailSent) {
          alert("✅ Employee created successfully! A welcome email has been sent.");
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

        closeCreateModal();
        fetchEmployees();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error creating employee");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("authToken");
      const { password, ...updateData } = formData;

      const response = await axios.put(
        `${API_URL}/users/employees/${selectedEmployee._id}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert("Employee updated successfully!");
        setShowEditModal(false);
        resetForm();
        fetchEmployees();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error updating employee");
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    // Première confirmation
    if (
      !window.confirm(
        "⚠️ WARNING: Are you sure you want to delete this Employee? This action is irreversible."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.delete(
        `${API_URL}/users/employees/${employeeId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert("✅ Employee deleted successfully!");
        fetchEmployees();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting employee");
    }
  };

  const handleToggleStatus = async (employeeId) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.patch(
        `${API_URL}/users/employees/${employeeId}/toggle-status`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert("Status changed successfully!");
        fetchEmployees();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error changing status");
    }
  };

  const viewEmployeeCommunications = (employeeId) => {
    navigate(`/communications?userId=${employeeId}`);
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
      firstName: "",
      lastName: "",
      email: "",
    });
    setSelectedEmployee(null);
  };

  // Filter employees based on search and status
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "All" ||
      (filterStatus === "Active" && employee.isActive) ||
      (filterStatus === "Inactive" && !employee.isActive);

    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const totalItems = filteredEmployees.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(
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
        <p className="loading-text">Loading employees...</p>
      </div>
    );
  }

  return (
    <div className="tab-content">
      {/* Action Bar */}
      <div className="action-bar">
        <button type="button" className="btn-create" onClick={openCreateModal}>
          <FontAwesomeIcon icon={faPlus} />
          <span>Create Employee</span>
        </button>
      </div>

      {/* Filters */}
      <div className="controls-section">
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="search-employee" className="filter-label">
              Search
            </label>
            <div className="input-with-icon">
              <FontAwesomeIcon icon={faSearch} className="input-icon" />
              <input
                id="search-employee"
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

      {/* Employee List */}
      <div className="admin-list">
        {paginatedEmployees.length === 0 ? (
          <div className="empty-state">
            <p>No employees found.</p>
          </div>
        ) : (
          paginatedEmployees.map((employee, index) => (
            <div
              key={employee._id}
              className={`admin-card admin-card-delay-${Math.min(index, 9)}`}
            >
              {/* Badge Icon */}
              <div className="admin-type-badge">
                <FontAwesomeIcon icon={faUser} />
              </div>

              {/* Content */}
              <div className="admin-content">
                <div className="admin-header">
                  <h3 className="admin-name">
                    {employee.firstName} {employee.lastName}
                  </h3>
                  <span
                    className={`status-badge ${
                      employee.isActive ? "active" : "inactive"
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={employee.isActive ? faCheckCircle : faTimesCircle}
                    />
                    <span>{employee.isActive ? "Active" : "Inactive"}</span>
                  </span>
                </div>

                <div className="admin-meta">
                  <div className="meta-item">
                    <FontAwesomeIcon icon={faEnvelope} className="meta-icon" />
                    <span>{employee.email}</span>
                  </div>
                  {employee.hasConfiguredEmail && (
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
                    onClick={() => viewEmployeeCommunications(employee._id)}
                    title="View Communications"
                  >
                    <FontAwesomeIcon icon={faComments} />
                    <span>Communications</span>
                  </button>
                  <button
                    className="btn-action btn-action-edit"
                    onClick={() => openEditModal(employee)}
                    title="Edit"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                    <span>Edit</span>
                  </button>
                  <button
                    className="btn-action btn-action-toggle"
                    onClick={() => handleToggleStatus(employee._id)}
                    title={employee.isActive ? "Deactivate" : "Activate"}
                  >
                    <FontAwesomeIcon
                      icon={employee.isActive ? faToggleOn : faToggleOff}
                    />
                  </button>
                  <button
                    className="btn-action btn-action-delete"
                    onClick={() => handleDeleteEmployee(employee._id)}
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

            <h2>Create New Employee</h2>
            <p className="modal-subtitle">
              Create a new employee account for your organization
            </p>

            <form className="modal-form" onSubmit={handleCreateEmployee}>
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
                  A secure password will be automatically generated and sent by email to this Employee.
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
                <button type="submit" className="btn-submit" disabled={creating}>
                  {creating ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      <span style={{ marginLeft: 8 }}>Creating...</span>
                    </>
                  ) : (
                    "Create Employee"
                  )}
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

            <h2>Edit Employee</h2>
            <p className="modal-subtitle">
              Update employee information
            </p>

            <form className="modal-form" onSubmit={handleUpdateEmployee}>
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
    </div>
  );
};

// --- MAIN COMPONENT: Employees Management ---
function Employees() {
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
        <h1 className="page-title">Employees Management</h1>
      </div>

      <EmployeeListTab />
    </div>
  );
}

export default Employees;
