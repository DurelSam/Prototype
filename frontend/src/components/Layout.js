import React from 'react';
import { Outlet } from 'react-router-dom';

function Layout() {
  return (
    <div style={styles.container}>
      {/* HEADER */}
      <header style={styles.header}>
        <h1>SaaS Multi-tenant Platform</h1>
      </header>

      <div style={styles.mainContent}>
        {/* SIDEBAR */}
        <aside style={styles.sidebar}>
          <nav style={styles.nav}>
            <a href="/dashboard" style={styles.navLink}>Dashboard</a>
            <a href="/communications" style={styles.navLink}>Communications</a>
            <a href="/users" style={styles.navLink}>Users</a>
            <a href="/analytics" style={styles.navLink}>Analytics</a>
            <a href="/integrations" style={styles.navLink}>Integrations</a>
            <a href="/subscription" style={styles.navLink}>Subscription</a>
            <a href="/settings" style={styles.navLink}>Settings</a>
          </nav>
        </aside>

        {/* CONTENU PRINCIPAL */}
        <main style={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  header: {
    backgroundColor: '#1f2937',
    color: '#fff',
    padding: '1rem 2rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  mainContent: {
    display: 'flex',
    flex: 1,
  },
  sidebar: {
    width: '250px',
    backgroundColor: '#f3f4f6',
    padding: '1.5rem 1rem',
    boxShadow: '2px 0 4px rgba(0,0,0,0.05)',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  navLink: {
    padding: '0.75rem 1rem',
    color: '#374151',
    textDecoration: 'none',
    borderRadius: '6px',
    transition: 'all 0.2s',
    fontSize: '14px',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: '2rem',
    backgroundColor: '#fff',
  },
};

export default Layout;
