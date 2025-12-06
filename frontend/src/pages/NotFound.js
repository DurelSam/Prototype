import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>404</h1>
      <p style={styles.subtitle}>Page non trouvée</p>
      <p style={styles.description}>
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <Link to="/dashboard" style={styles.button}>
        Retour au Dashboard
      </Link>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    padding: '2rem',
    textAlign: 'center',
  },
  title: {
    fontSize: '6rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '1rem',
  },
  subtitle: {
    fontSize: '2rem',
    color: '#4b5563',
    marginBottom: '1rem',
  },
  description: {
    fontSize: '1rem',
    color: '#6b7280',
    marginBottom: '2rem',
  },
  button: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3b82f6',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'background-color 0.2s',
  },
};

export default NotFound;
