import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
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
import EmailConfigurationGuard from "./EmailConfigurationGuard";
import "../styles/Layout.css";

function Layout() {
  // État pour savoir si la sidebar est réduite ou ouverte
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
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
    // Menu Users adapté au rôle
    ...(user?.role === "UpperAdmin"
      ? [{ path: "/admins", label: "Admins", icon: faUsers }]
      : user?.role === "Admin"
      ? [{ path: "/employees", label: "Employees", icon: faUsers }]
      : []), // Employee ne voit pas de menu Users
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
          {/* Left side - Toggle + Title grouped together */}
          <div className="header-left">
            <button className="sidebar-toggle" onClick={toggleSidebar}>
              <FontAwesomeIcon
                icon={isSidebarCollapsed ? faBars : faChevronLeft}
              />
            </button>
            <h1>SaaS Platform</h1>
          </div>

          {/* User Profile Section - Right side */}
          <div className="header-right">
            <div className="user-avatar">
              {user?.firstName?.[0]?.toUpperCase() ||
                user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email}
              </span>
              <span className="user-role">{user?.role}</span>
            </div>
            <button className="logout-button" onClick={handleLogout}>
              Déconnexion
            </button>
          </div>
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
          {/* Guard qui vérifie la configuration email, sauf pour la page d'intégrations */}
          {location.pathname === '/integrations' || location.pathname.startsWith('/integrations/') ? (
            <Outlet />
          ) : (
            <EmailConfigurationGuard>
              <Outlet />
            </EmailConfigurationGuard>
          )}
        </main>
      </div>
    </div>
  );
}

export default Layout;
