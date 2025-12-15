import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import backgroundImage from '../login-background-image.jpg';
import '../styles/Login.css';

function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    companyName: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.email || !formData.password || !formData.companyName || !formData.firstName || !formData.lastName) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const { confirmPassword, ...userData } = formData;

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Inscription réussie ! Un email de vérification a été envoyé à votre adresse. Veuillez vérifier votre boîte mail.');
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
          companyName: ''
        });
        // Redirection vers login après 3 secondes
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.message || 'Erreur lors de l\'inscription');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur inscription:', error);
    }

    setLoading(false);
  };

  return (
    <div className="login-page">
      <img src={backgroundImage} alt="Background" className="login-image" />
      <div className="login-wrapper">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-header">
            <h1>SaaS Communications</h1>
            <h2>Créer votre compte</h2>
            <p>Inscription en tant que propriétaire d'entreprise (UpperAdmin)</p>
          </div>

          <div className="input-group">
            <label htmlFor="companyName">Nom de l'entreprise *</label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Ma Société"
              required
            />
          </div>

          <div className="input-row">
            <div className="input-group">
              <label htmlFor="firstName">Prénom *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Jean"
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="lastName">Nom *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Dupont"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="email">Adresse email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="votre@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Mot de passe *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirmer le mot de passe *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
          </div>

          {success && (
            <div className="success-message" style={{backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '5px', marginBottom: '15px'}}>
              {success}
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Inscription en cours...' : 'S\'inscrire'}
          </button>

          <div className="login-footer">
            <p>
              Vous avez déjà un compte ? <Link to="/login">Se connecter</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
