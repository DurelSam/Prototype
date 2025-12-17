import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faEnvelope, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import backgroundImage from '../login-background-image.jpg';
import '../styles/Login.css';
import '../styles/ForgotPassword.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Veuillez entrer votre adresse email');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setEmail(''); // Clear form
      } else {
        setError(data.message || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Erreur forgot password:', error);
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
            <h2>Mot de passe oublié</h2>
            <p>Entrez votre email pour réinitialiser votre mot de passe</p>
          </div>

          {success && (
            <div className="success-message">
              <FontAwesomeIcon icon={faCheckCircle} className="success-icon" />
              <p>
                <strong>Email envoyé !</strong>
              </p>
              <p>
                Si un compte existe avec cet email, vous recevrez un lien de
                réinitialisation dans quelques minutes.
              </p>
              <p className="check-spam">
                Pensez à vérifier vos spams si vous ne recevez rien.
              </p>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          {!success && (
            <>
              <div className="input-group">
                <label htmlFor="email">
                  <FontAwesomeIcon icon={faEnvelope} className="input-label-icon" />
                  Adresse email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  disabled={loading}
                />
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
              </button>
            </>
          )}

          <div className="login-footer">
            <Link to="/login" className="back-link">
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Retour à la connexion</span>
            </Link>
            {!success && (
              <>
                <span className="separator">|</span>
                <Link to="/register">Créer un compte</Link>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;
