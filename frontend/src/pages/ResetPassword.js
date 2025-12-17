import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faEye, faEyeSlash, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import backgroundImage from '../login-background-image.jpg';
import '../styles/Login.css';
import '../styles/ForgotPassword.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!password || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Rediriger vers login après 3 secondes
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.message || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Erreur reset password:', error);
      setError('Erreur de connexion au serveur. Veuillez réessayer.');
    }

    setLoading(false);
  };

  return (
    <div className="login-page">
      <img src={backgroundImage} alt="Background" className="login-image" />
      <div className="login-wrapper">
        <form className="login-form forgot-password-form" onSubmit={handleSubmit}>
          <div className="login-header">
            <h1>SaaS Communications</h1>
            <h2>Nouveau mot de passe</h2>
            <p>Choisissez un nouveau mot de passe sécurisé</p>
          </div>

          {success && (
            <div className="success-message">
              <FontAwesomeIcon icon={faCheckCircle} className="success-icon" />
              <p>
                <strong>Mot de passe réinitialisé !</strong>
              </p>
              <p>
                Votre mot de passe a été modifié avec succès.
              </p>
              <p className="redirect-info">
                Redirection vers la page de connexion...
              </p>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          {!success && (
            <>
              <div className="input-group">
                <label htmlFor="password">
                  <FontAwesomeIcon icon={faLock} className="input-label-icon" />
                  Nouveau mot de passe
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 caractères"
                    required
                    disabled={loading}
                    minLength="6"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="confirmPassword">
                  <FontAwesomeIcon icon={faLock} className="input-label-icon" />
                  Confirmer le mot de passe
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Retapez votre mot de passe"
                    required
                    disabled={loading}
                    minLength="6"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex="-1"
                  >
                    <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Réinitialisation en cours...' : 'Réinitialiser le mot de passe'}
              </button>
            </>
          )}

          <div className="login-footer">
            {success ? (
              <Link to="/login">Se connecter maintenant</Link>
            ) : (
              <Link to="/login">Retour à la connexion</Link>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
