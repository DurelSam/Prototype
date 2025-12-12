import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEye,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/TenantManagement.css";

function TenantManagement() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    companyName: "",
    subscriptionStatus: "Trial",
    slaHours: "24",
    language: "en",
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/superuser/tenants`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setTenants(response.data.data);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des tenants:", err);
      setError(
        err.response?.data?.message ||
          "Erreur lors de la récupération des tenants"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantDetails = async (tenantId) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/superuser/tenants/${tenantId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setSelectedTenant(response.data.data);
        setShowDetailsModal(true);
      }
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Erreur lors de la récupération des détails"
      );
    }
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/superuser/tenants`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert("Tenant créé avec succès!");
        setShowCreateModal(false);
        resetForm();
        fetchTenants();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de la création");
    }
  };

  const resetForm = () => {
    setFormData({
      companyName: "",
      subscriptionStatus: "Trial",
      slaHours: "24",
      language: "en",
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  // Filter tenants based on search and status
  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch = tenant.companyName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesStatus =
      !statusFilter || tenant.subscriptionStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="tenant-management">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="tenant-management">
      <div className="page-header">
        <h1>Tenant Management</h1>
        <button className="btn-primary" onClick={openCreateModal}>
          <FontAwesomeIcon icon={faPlus} /> Create New Tenant
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Filters */}
      <div className="filters">
        <div className="search-box">
          <FontAwesomeIcon icon={faSearch} />
          <input
            type="text"
            placeholder="Search by company name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Trial">Trial</option>
          <option value="Active">Active</option>
          <option value="Suspended">Suspended</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Tenants Table */}
      <div className="table-container">
        <table className="tenants-table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>UpperAdmin</th>
              <th>Users Count</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTenants.length > 0 ? (
              filteredTenants.map((tenant) => (
                <tr key={tenant._id}>
                  <td className="company-name">{tenant.companyName}</td>
                  <td>
                    {tenant.upperAdmin ? (
                      <span>
                        {tenant.upperAdmin.firstName}{" "}
                        {tenant.upperAdmin.lastName}
                        <br />
                        <small>{tenant.upperAdmin.email}</small>
                      </span>
                    ) : (
                      <span className="no-admin">No UpperAdmin</span>
                    )}
                  </td>
                  <td className="text-center">{tenant.userCount || 0}</td>
                  <td>
                    <span
                      className={`status-badge ${tenant.subscriptionStatus.toLowerCase()}`}
                    >
                      {tenant.subscriptionStatus}
                    </span>
                  </td>
                  <td>
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      className="btn-icon view"
                      onClick={() => fetchTenantDetails(tenant._id)}
                      title="View Details"
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-data">
                  Aucun tenant trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Tenant</h2>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateTenant}>
              <div className="form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Subscription Status *</label>
                <select
                  required
                  value={formData.subscriptionStatus}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subscriptionStatus: e.target.value,
                    })
                  }
                >
                  <option value="Trial">Trial</option>
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-group">
                <label>SLA Hours *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.slaHours}
                  onChange={(e) =>
                    setFormData({ ...formData, slaHours: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Language *</label>
                <select
                  required
                  value={formData.language}
                  onChange={(e) =>
                    setFormData({ ...formData, language: e.target.value })
                  }
                >
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="es">Español</option>
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
                  Create Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedTenant && (
        <div
          className="modal-overlay"
          onClick={() => setShowDetailsModal(false)}
        >
          <div className="modal large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedTenant.companyName} - Details</h2>
              <button
                className="modal-close"
                onClick={() => setShowDetailsModal(false)}
              >
                &times;
              </button>
            </div>

            <div className="tenant-details">
              {/* Tenant Info */}
              <div className="details-section">
                <h3>Tenant Information</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <strong>Subscription Status:</strong>
                    <span
                      className={`status-badge ${selectedTenant.subscriptionStatus.toLowerCase()}`}
                    >
                      {selectedTenant.subscriptionStatus}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>SLA Hours:</strong>
                    <span>{selectedTenant.settings?.slaHours || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Language:</strong>
                    <span>{selectedTenant.settings?.language || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Created:</strong>
                    <span>
                      {new Date(selectedTenant.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* UpperAdmin Info */}
              <div className="details-section">
                <h3>UpperAdmin</h3>
                {selectedTenant.upperAdmin ? (
                  <div className="details-grid">
                    <div className="detail-item">
                      <strong>Name:</strong>
                      <span>
                        {selectedTenant.upperAdmin.firstName}{" "}
                        {selectedTenant.upperAdmin.lastName}
                      </span>
                    </div>
                    <div className="detail-item">
                      <strong>Email:</strong>
                      <span>{selectedTenant.upperAdmin.email}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Status:</strong>
                      <span
                        className={`status-badge ${
                          selectedTenant.upperAdmin.isActive
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {selectedTenant.upperAdmin.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="no-data">No UpperAdmin assigned</p>
                )}
              </div>

              {/* Statistics */}
              <div className="details-section">
                <h3>Statistics</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <strong>Total Users:</strong>
                    <span>{selectedTenant.userCount || 0}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Total Communications:</strong>
                    <span>{selectedTenant.communicationCount || 0}</span>
                  </div>
                </div>
              </div>

              {/* Users List */}
              <div className="details-section">
                <h3>Users ({selectedTenant.users?.length || 0})</h3>
                {selectedTenant.users && selectedTenant.users.length > 0 ? (
                  <div className="users-list">
                    {selectedTenant.users.map((user) => (
                      <div key={user._id} className="user-item">
                        <div className="user-info">
                          <strong>
                            {user.firstName} {user.lastName}
                          </strong>
                          <span className="user-email">{user.email}</span>
                        </div>
                        <div className="user-meta">
                          <span className="role-badge">{user.role}</span>
                          <span
                            className={`status-badge ${
                              user.isActive ? "active" : "inactive"
                            }`}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">No users found</p>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TenantManagement;
