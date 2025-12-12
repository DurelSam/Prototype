import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartPie,
  faComments,
  faUsers,
  faChartLine,
  faPlug,
  faCreditCard,
  faCog,
  faBars,
  faChevronLeft,
  faUserShield,
  faBuilding,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";
import "../styles/Layout.css";

function Layout() {
  // État pour savoir si la sidebar est réduite ou ouverte
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Menu différent selon le rôle
  const isSuperUser = user?.role === "SuperUser";

  // Menu SuperUser
  const superUserNavItems = [
    { path: "/superuser/dashboard", label: "Dashboard", icon: faChartPie },
    { path: "/superuser/admins", label: "Admin Management", icon: faUserShield },
    { path: "/superuser/tenants", label: "Tenant Management", icon: faBuilding },
    { path: "/settings", label: "Settings", icon: faCog },
  ];

  // Menu Normal (tous les autres rôles)
  const normalNavItems = [
    { path: "/dashboard", label: "Dashboard", icon: faChartPie },
    { path: "/communications", label: "Communications", icon: faComments },
    { path: "/users", label: "Users", icon: faUsers },
    { path: "/analytics", label: "Analytics", icon: faChartLine },
    { path: "/integrations", label: "Integrations", icon: faPlug },
    { path: "/subscription", label: "Subscription", icon: faCreditCard },
    { path: "/settings", label: "Settings", icon: faCog },
  ];

  // Sélectionner le bon menu
  const navItems = isSuperUser ? superUserNavItems : normalNavItems;

  return (
    <div
      className={`app-container ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
    >
      {/* HEADER */}
      <header className="app-header">
        <div className="header-content">
          {/* Bouton Toggle intégré au Header ou au début de la sidebar visuellement */}
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <FontAwesomeIcon
              icon={isSidebarCollapsed ? faBars : faChevronLeft}
            />
          </button>
          <h1>SaaS Platform</h1>
        </div>
      </header>

      <div className="main-content">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <nav className="nav">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${
                  location.pathname === item.path ? "active" : ""
                }`}
              >
                <div className="nav-icon">
                  <FontAwesomeIcon icon={item.icon} />
                </div>
                <span className="nav-text">{item.label}</span>

                {/* Tooltip pour le mode réduit */}
                {isSidebarCollapsed && (
                  <div className="nav-tooltip">{item.label}</div>
                )}
              </Link>
            ))}
          </nav>
        </aside>

        {/* CONTENU PRINCIPAL */}
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
