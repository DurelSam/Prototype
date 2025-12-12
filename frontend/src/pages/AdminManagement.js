import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEdit,
  faTrash,
  faKey,
  faToggleOn,
  faToggleOff,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/AdminManagement.css";
// Import des nouvelles animations
import "../animations/dashboardAnimations.css";

function AdminManagement() {
  const [upperAdmins, setUpperAdmins] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenantFilter, setSelectedTenantFilter] = useState("");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    tenant_id: "",
  });

  const [resetPasswordData, setResetPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");

      // Fetch UpperAdmins and Tenants in parallel
      const [adminsResponse, tenantsResponse] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/superuser/admins`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${process.env.REACT_APP_API_URL}/superuser/tenants`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (adminsResponse.data.success) {
        setUpperAdmins(adminsResponse.data.data);
      }

      if (tenantsResponse.data.success) {
        setTenants(tenantsResponse.data.data);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.response?.data?.message || "Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/superuser/admins`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert("UpperAdmin created successfully!");
        setShowCreateModal(false);
        resetForm();
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error during creation");
    }
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/superuser/admins/${selectedAdmin._id}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert("UpperAdmin updated successfully!");
        setShowEditModal(false);
        resetForm();
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error during update");
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm("Are you sure you want to delete this UpperAdmin?")) {
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/superuser/admins/${adminId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert("UpperAdmin deleted successfully!");
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error during deletion");
    }
  };

  const handleToggleStatus = async (adminId) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.patch(
        `${process.env.REACT_APP_API_URL}/superuser/admins/${adminId}/toggle-status`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert("Status changed successfully!");
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error changing status");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/superuser/admins/${selectedAdmin._id}/reset-password`,
        { newPassword: resetPasswordData.newPassword },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert("Password reset successfully!");
        setShowResetPasswordModal(false);
        setResetPasswordData({ newPassword: "", confirmPassword: "" });
      }
    } catch (err) {
      alert(err.response?.data?.message || "Error during reset");
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (admin) => {
    setSelectedAdmin(admin);
    setFormData({
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      tenant_id: admin.tenant_id._id,
    });
    setShowEditModal(true);
  };

  const openResetPasswordModal = (admin) => {
    setSelectedAdmin(admin);
    setResetPasswordData({ newPassword: "", confirmPassword: "" });
    setShowResetPasswordModal(true);
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      tenant_id: "",
    });
    setSelectedAdmin(null);
  };

  // Filter admins based on search and tenant filter
  const filteredAdmins = upperAdmins.filter((admin) => {
    const matchesSearch =
      admin.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTenant =
      !selectedTenantFilter || admin.tenant_id._id === selectedTenantFilter;

    return matchesSearch && matchesTenant;
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
          <h1>Admin Management</h1>
          <button className="btn-primary" onClick={openCreateModal}>
            <FontAwesomeIcon icon={faPlus} /> Add New UpperAdmin
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Filters */}
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

          <select
            className="filter-select"
            value={selectedTenantFilter}
            onChange={(e) => setSelectedTenantFilter(e.target.value)}
          >
            <option value="">All Tenants</option>
            {tenants.map((tenant) => (
              <option key={tenant._id} value={tenant._id}>
                {tenant.companyName}
              </option>
            ))}
          </select>
        </div>

        {/* Admins Grid */}
        <div className="admins-grid animate-entry delay-3">
          {filteredAdmins.length > 0 ? (
            filteredAdmins.map((admin) => (
              <div key={admin._id} className="admin-card">
                <div className="admin-card-header">
                  <h3>
                    {admin.firstName} {admin.lastName}
                  </h3>
                  <span
                    className={`status-badge ${
                      admin.isActive ? "active" : "inactive"
                    }`}
                  >
                    {admin.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="admin-card-body">
                  <p className="admin-email">{admin.email}</p>
                  <p className="admin-tenant">
                    <strong>Tenant:</strong>{" "}
                    {admin.tenant_id?.companyName || "N/A"}
                  </p>
                </div>

                <div className="admin-card-actions">
                  <button
                    className="btn-icon edit"
                    onClick={() => openEditModal(admin)}
                    title="Edit"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>

                  <button
                    className="btn-icon toggle"
                    onClick={() => handleToggleStatus(admin._id)}
                    title={admin.isActive ? "Deactivate" : "Activate"}
                  >
                    <FontAwesomeIcon
                      icon={admin.isActive ? faToggleOn : faToggleOff}
                    />
                  </button>

                  <button
                    className="btn-icon reset"
                    onClick={() => openResetPasswordModal(admin)}
                    title="Reset Password"
                  >
                    <FontAwesomeIcon icon={faKey} />
                  </button>

                  <button
                    className="btn-icon delete"
                    onClick={() => handleDeleteAdmin(admin._id)}
                    title="Delete"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="no-data">No UpperAdmin found</p>
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
                <h2>Create New UpperAdmin</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowCreateModal(false)}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateAdmin}>
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

                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    required
                    minLength="6"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Tenant *</label>
                  <select
                    required
                    value={formData.tenant_id}
                    onChange={(e) =>
                      setFormData({ ...formData, tenant_id: e.target.value })
                    }
                  >
                    <option value="">Select a tenant</option>
                    {tenants.map((tenant) => (
                      <option key={tenant._id} value={tenant._id}>
                        {tenant.companyName}
                      </option>
                    ))}
                  </select>
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
                    Create UpperAdmin
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
                <h2>Edit UpperAdmin</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowEditModal(false)}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleUpdateAdmin}>
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

                <div className="form-group">
                  <label>Tenant *</label>
                  <select
                    required
                    value={formData.tenant_id}
                    onChange={(e) =>
                      setFormData({ ...formData, tenant_id: e.target.value })
                    }
                  >
                    <option value="">Select a tenant</option>
                    {tenants.map((tenant) => (
                      <option key={tenant._id} value={tenant._id}>
                        {tenant.companyName}
                      </option>
                    ))}
                  </select>
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
                    Update UpperAdmin
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {showResetPasswordModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowResetPasswordModal(false)}
          >
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Reset Password</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowResetPasswordModal(false)}
                >
                  &times;
                </button>
              </div>

              <div className="modal-info">
                <p>
                  <strong>User:</strong> {selectedAdmin?.firstName}{" "}
                  {selectedAdmin?.lastName}
                </p>
                <p>
                  <strong>Email:</strong> {selectedAdmin?.email}
                </p>
              </div>

              <form onSubmit={handleResetPassword}>
                <div className="form-group">
                  <label>New Password *</label>
                  <input
                    type="password"
                    required
                    minLength="6"
                    value={resetPasswordData.newPassword}
                    onChange={(e) =>
                      setResetPasswordData({
                        ...resetPasswordData,
                        newPassword: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Confirm Password *</label>
                  <input
                    type="password"
                    required
                    minLength="6"
                    value={resetPasswordData.confirmPassword}
                    onChange={(e) =>
                      setResetPasswordData({
                        ...resetPasswordData,
                        confirmPassword: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowResetPasswordModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Reset Password
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

export default AdminManagement;
