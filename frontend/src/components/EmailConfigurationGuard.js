import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope,
  faExclamationTriangle,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import '../styles/EmailConfigurationGuard.css';

/**
 * Composant qui vérifie si l'utilisateur a configuré son email
 * et est vérifié (pour UpperAdmin)
 * Redirige automatiquement vers /integrations si non configuré
 */
function EmailConfigurationGuard({ children }) {
  const { user, canAccessPlatform, emailVerified, hasConfiguredEmail, isUpperAdmin } = useAuth();
  const navigate = useNavigate();

  // ✅ REDIRECTION AUTOMATIQUE (HOOK doit être appelé AVANT tout return conditionnel)
  React.useEffect(() => {
    if (!canAccessPlatform) {
      navigate('/integrations', { replace: true });
    }
  }, [canAccessPlatform, navigate]);

  // Si l'utilisateur peut accéder à la plateforme, afficher le contenu normalement
  if (canAccessPlatform) {
    return <>{children}</>;
  }

  // Afficher un loader pendant la redirection
  return (
    <div className="email-config-guard">
      <div className="config-guard-overlay"></div>
      <div className="config-guard-modal">
        <div className="config-guard-header">
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            className="config-guard-icon warning"
          />
          <h2>Configuration requise</h2>
        </div>
        <div className="config-guard-body">
          <p>Redirection vers la page de configuration...</p>
        </div>
      </div>
    </div>
  );

  // ANCIEN CODE BLOQUANT (conservé en commentaire si besoin)
  /*
  const handleConfigureEmail = () => {
    navigate('/integrations');
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    window.location.href = '/login';
  };

  */
}

export default EmailConfigurationGuard;
