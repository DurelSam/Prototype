import React, { useState } from 'react';
import axios from 'axios';

function TestConnection() {
  const [backendStatus, setBackendStatus] = useState('');
  const [dbStatus, setDbStatus] = useState('');
  const [dbDetails, setDbDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testBackendConnection = async () => {
    setLoading(true);
    setError('');
    setBackendStatus('');
    setDbStatus('');
    setDbDetails(null);

    try {
      // Test 1: Backend Health Check
      const healthResponse = await axios.get('http://localhost:5000/api/health');
      setBackendStatus(`✅ Backend: ${healthResponse.data.message}`);

      // Test 2: MongoDB Connection
      const dbResponse = await axios.get('http://localhost:5000/api/test-db');
      setDbStatus(`✅ MongoDB: ${dbResponse.data.message}`);
      setDbDetails(dbResponse.data);

      console.log('Backend Health:', healthResponse.data);
      console.log('Database Test:', dbResponse.data);

    } catch (err) {
      if (err.response) {
        // Erreur de réponse du serveur
        setError(`❌ Erreur: ${err.response.data.message || err.message}`);
      } else if (err.request) {
        // Pas de réponse du serveur
        setError('❌ Impossible de joindre le backend. Vérifiez qu\'il est démarré.');
      } else {
        setError(`❌ Erreur: ${err.message}`);
      }
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🔬 Test de Connexion Complète</h2>
      <p style={styles.subtitle}>Vérifiez la connexion Backend + MongoDB Atlas</p>

      <button
        onClick={testBackendConnection}
        disabled={loading}
        style={{
          ...styles.button,
          opacity: loading ? 0.6 : 1,
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? '⏳ Test en cours...' : '🚀 Lancer le test complet'}
      </button>

      {backendStatus && (
        <div style={styles.success}>
          {backendStatus}
        </div>
      )}

      {dbStatus && (
        <div style={styles.success}>
          {dbStatus}
        </div>
      )}

      {dbDetails && (
        <div style={styles.details}>
          <h3 style={styles.detailsTitle}>📊 Détails de la connexion MongoDB</h3>
          <div style={styles.detailsGrid}>
            <div style={styles.detailItem}>
              <strong>Host:</strong> {dbDetails.database?.host}
            </div>
            <div style={styles.detailItem}>
              <strong>Base de données:</strong> {dbDetails.database?.name}
            </div>
            <div style={styles.detailItem}>
              <strong>État:</strong> {dbDetails.database?.state}
            </div>
            <div style={styles.detailItem}>
              <strong>Collections:</strong> {dbDetails.database?.collections}
            </div>
            <div style={styles.detailItem}>
              <strong>Test Écriture:</strong> {dbDetails.test?.created ? '✅' : '❌'}
            </div>
            <div style={styles.detailItem}>
              <strong>Test Lecture:</strong> {dbDetails.test?.read ? '✅' : '❌'}
            </div>
            <div style={styles.detailItem}>
              <strong>Test Suppression:</strong> {dbDetails.test?.deleted ? '✅' : '❌'}
            </div>
            <div style={styles.detailItem}>
              <strong>Temps de réponse:</strong> {dbDetails.test?.responseTime}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={styles.error}>
          {error}
          <div style={styles.errorHints}>
            <p style={styles.hintTitle}>💡 Vérifications:</p>
            <ul style={styles.hintList}>
              <li>Le backend est démarré sur http://localhost:5000</li>
              <li>Le mot de passe MongoDB est configuré dans backend/.env</li>
              <li>Votre IP est autorisée dans MongoDB Atlas Network Access</li>
            </ul>
          </div>
        </div>
      )}

      <div style={styles.info}>
        <p><strong>🔧 Configuration:</strong></p>
        <p>Backend URL: http://localhost:5000</p>
        <p>API URL: http://localhost:5000/api</p>
        <p>MongoDB: Atlas Cloud (Cluster0)</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '700px',
    margin: '50px auto',
    padding: '30px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontFamily: 'Arial, sans-serif',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  title: {
    textAlign: 'center',
    color: '#1f2937',
    marginBottom: '5px',
    fontSize: '24px'
  },
  subtitle: {
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: '25px',
    fontSize: '14px'
  },
  button: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '20px',
    transition: 'all 0.3s'
  },
  success: {
    padding: '15px',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    borderRadius: '8px',
    marginBottom: '15px',
    fontWeight: 'bold',
    border: '2px solid #10b981'
  },
  details: {
    padding: '20px',
    backgroundColor: '#f0f9ff',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '2px solid #3b82f6'
  },
  detailsTitle: {
    color: '#1e40af',
    marginTop: 0,
    marginBottom: '15px',
    fontSize: '18px'
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  detailItem: {
    padding: '10px',
    backgroundColor: 'white',
    borderRadius: '6px',
    fontSize: '14px',
    border: '1px solid #bfdbfe'
  },
  error: {
    padding: '20px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '2px solid #ef4444'
  },
  errorHints: {
    marginTop: '15px',
    padding: '15px',
    backgroundColor: '#fef2f2',
    borderRadius: '6px'
  },
  hintTitle: {
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#7f1d1d'
  },
  hintList: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: '14px',
    lineHeight: '1.8'
  },
  info: {
    padding: '15px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#4b5563',
    lineHeight: '1.8'
  }
};

export default TestConnection;
