import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Communications from "./pages/Communications";
import CommunicationDetails from "./pages/CommunicationDetails";
import Settings from "./pages/Settings";
import Integrations from "./pages/Integrations";
import IntegrationsCallback from "./pages/IntegrationsCallback";
import Analytics from "./pages/Analytics";
import Subscription from "./pages/Subscription";
import ScheduledReports from "./pages/ScheduledReports";
import RolesPermissions from "./pages/RolesPermissions";
import AutomationRules from "./pages/AutomationRules";
import NotFound from "./pages/NotFound";
// SuperUser pages
import SuperUserDashboard from "./pages/SuperUserDashboard";
import AdminManagement from "./pages/AdminManagement";
import TenantManagement from "./pages/TenantManagement";
// RBAC pages
import Admins from "./pages/Admins";
import Employees from "./pages/Employees";
import "./App.css";

function HomeRedirect() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div className="loading-screen">Chargement...</div>;

  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Route par défaut */}
          <Route path="/" element={<HomeRedirect />} />

          {/* Routes Publiques */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Dashboard - Route protégée SANS Layout */}
          {/* <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} /> */}

          {/* GROUPE DE ROUTES PROTÉGÉES avec Layout (Sidebar + Header) */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/communications" element={<Communications />} />
            <Route
              path="/communications/:id"
              element={<CommunicationDetails />}
            />
            <Route path="/settings" element={<Settings />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/integrations/callback" element={<IntegrationsCallback />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/scheduled-reports" element={<ScheduledReports />} />
            <Route path="/roles-permissions" element={<RolesPermissions />} />
            <Route path="/automation-rules" element={<AutomationRules />} />

            {/* RBAC Routes */}
            <Route path="/admins" element={<Admins />} />
            <Route path="/employees" element={<Employees />} />

            {/* SuperUser Routes */}
            <Route path="/superuser/dashboard" element={<SuperUserDashboard />} />
            <Route path="/superuser/admins" element={<AdminManagement />} />
            <Route path="/superuser/tenants" element={<TenantManagement />} />
          </Route>

          {/* Gestion intelligente des 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
