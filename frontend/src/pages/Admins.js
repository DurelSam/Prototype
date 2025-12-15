import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
} from '@fortawesome/free-solid-svg-icons';
import '../styles/AdminManagement.css';
import '../animations/dashboardAnimations.css';

function Admins() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEmployeesModal, setShowEmployeesModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/users/admins`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setAdmins(response.data.data);
      }
    } catch (err) {
      console.error('Erreur chargement admins:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/users/admins`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert('Admin créé avec succès ! Un email de bienvenue a été envoyé.');
        setShowCreateModal(false);
        resetForm();
        fetchAdmins();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      const { password, ...updateData } = formData; // Ne pas envoyer le mot de passe lors de l'édition

      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/users/admins/${selectedAdmin._id}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert('Admin mis à jour avec succès !');
        setShowEditModal(false);
        resetForm();
        fetchAdmins();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet Admin ? Ses Employés seront transférés.')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/users/admins/${adminId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert('Admin supprimé avec succès !');
        fetchAdmins();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleToggleStatus = async (adminId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.patch(
        `${process.env.REACT_APP_API_URL}/users/admins/${adminId}/toggle-status`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert('Statut modifié avec succès !');
        fetchAdmins();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors du changement de statut');
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
      password: '',
    });
    setShowEditModal(true);
  };

  const openEmployeesModal = (admin) => {
    setSelectedAdmin(admin);
    setShowEmployeesModal(true);
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    });
    setSelectedAdmin(null);
  };

  // Filter admins based on search
  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      admin.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="admin-management-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-management-page">
      <div className="admin-management-container">
        <div className="page-header animate-entry delay-1">
          <h1>Gestion des Administrateurs</h1>
          <button className="btn-primary" onClick={openCreateModal}>
            <FontAwesomeIcon icon={faPlus} /> Créer un Admin
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Search */}
        <div className="filters animate-entry delay-2">
          <div className="search-box">
            <FontAwesomeIcon icon={faSearch} />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
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
                      admin.isActive ? 'active' : 'inactive'
                    }`}
                  >
                    {admin.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                <div className="admin-card-body">
                  <p className="admin-email">
                    <FontAwesomeIcon icon={faEnvelope} /> {admin.email}
                  </p>
                  <p className="admin-tenant">
                    <FontAwesomeIcon icon={faUsers} />{' '}
                    <strong>{admin.managedEmployeesCount || 0}</strong> Employé(s)
                  </p>
                  {admin.hasConfiguredEmail && (
                    <p className="admin-email-configured">
                      ✓ Email configuré
                    </p>
                  )}
                </div>

                <div className="admin-card-actions">
                  <button
                    className="btn-icon view"
                    onClick={() => openEmployeesModal(admin)}
                    title="Voir les Employés"
                  >
                    <FontAwesomeIcon icon={faEye} />
                  </button>

                  <button
                    className="btn-icon edit"
                    onClick={() => openEditModal(admin)}
                    title="Modifier"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>

                  <button
                    className="btn-icon toggle"
                    onClick={() => handleToggleStatus(admin._id)}
                    title={admin.isActive ? 'Désactiver' : 'Activer'}
                  >
                    <FontAwesomeIcon
                      icon={admin.isActive ? faToggleOn : faToggleOff}
                    />
                  </button>

                  <button
                    className="btn-icon delete"
                    onClick={() => handleDeleteAdmin(admin._id)}
                    title="Supprimer"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="no-data">Aucun Administrateur trouvé</p>
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
                <h2>Créer un nouvel Administrateur</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowCreateModal(false)}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateAdmin}>
                <div className="form-group">
                  <label>Prénom *</label>
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
                  <label>Nom *</label>
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
                  <label>Mot de passe *</label>
                  <input
                    type="password"
                    required
                    minLength="6"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                  <small>Minimum 6 caractères</small>
                </div>

                <div className="alert-info">
                  <p>
                    Un email de bienvenue sera automatiquement envoyé à cet Admin avec ses identifiants.
                  </p>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary">
                    Créer l'Admin
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
                <h2>Modifier l'Administrateur</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowEditModal(false)}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleUpdateAdmin}>
                <div className="form-group">
                  <label>Prénom *</label>
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
                  <label>Nom *</label>
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
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary">
                    Mettre à jour
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Employees Modal */}
        {showEmployeesModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowEmployeesModal(false)}
          >
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  Employés gérés par {selectedAdmin?.firstName}{' '}
                  {selectedAdmin?.lastName}
                </h2>
                <button
                  className="modal-close"
                  onClick={() => setShowEmployeesModal(false)}
                >
                  &times;
                </button>
              </div>

              <div className="modal-body">
                {selectedAdmin?.managedEmployees &&
                selectedAdmin.managedEmployees.length > 0 ? (
                  <div className="employees-list">
                    {selectedAdmin.managedEmployees.map((employee) => (
                      <div key={employee._id} className="employee-item">
                        <div className="employee-avatar">
                          {employee.firstName?.[0]?.toUpperCase()}
                          {employee.lastName?.[0]?.toUpperCase()}
                        </div>
                        <div className="employee-info">
                          <h4>
                            {employee.firstName} {employee.lastName}
                          </h4>
                          <p>{employee.email}</p>
                        </div>
                        <span
                          className={`status-badge ${
                            employee.isActive ? 'active' : 'inactive'
                          }`}
                        >
                          {employee.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">Aucun Employé géré pour le moment</p>
                )}
              </div>

              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setShowEmployeesModal(false)}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admins;
