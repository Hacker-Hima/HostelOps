import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// User / Student pages
import UserDashboard from './pages/user/UserDashboard';
import MyAssets from './pages/user/MyAssets';
import RequestAsset from './pages/user/RequestAsset';
import ReportIssue from './pages/user/ReportIssue';
import UserHistory from './pages/user/UserHistory';
import UserProfile from './pages/user/UserProfile';
import StudentSettings from './pages/user/StudentSettings';

// Technician pages
import TechnicianDashboard from './pages/technician/TechnicianDashboard';
import MaintenanceTasks from './pages/technician/MaintenanceTasks';
import InspectAsset from './pages/technician/InspectAsset';
import TechnicianReportDamage from './pages/technician/TechnicianReportDamage';
import MaintenanceHistory from './pages/technician/MaintenanceHistory';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageAssets from './pages/admin/ManageAssets';
import AdminRequests from './pages/admin/AdminRequests';
import AdminDamageReports from './pages/admin/AdminDamageReports';
import ManageUsers from './pages/admin/ManageUsers';
import AssetHistoryView from './pages/admin/AssetHistoryView';
import AdminSettings from './pages/admin/AdminSettings';

// UI Showcase
import LoadingPage from './pages/LoadingPage';

// Layout wrapper for authenticated app
const AppLayout = ({ children }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['student', 'user']}>
                <AppLayout>
                  <UserDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-assets"
            element={
              <ProtectedRoute allowedRoles={['student', 'user']}>
                <AppLayout>
                  <MyAssets />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/request-asset"
            element={
              <ProtectedRoute allowedRoles={['student', 'user']}>
                <AppLayout>
                  <RequestAsset />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/report-issue"
            element={
              <ProtectedRoute allowedRoles={['student', 'user']}>
                <AppLayout>
                  <ReportIssue />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute allowedRoles={['student', 'user']}>
                <AppLayout>
                  <UserHistory />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['student', 'user', 'technician', 'staff', 'admin']}>
                <AppLayout>
                  <UserProfile />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={['student', 'user', 'technician', 'staff', 'admin']}>
                <AppLayout>
                  <StudentSettings />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/settings"
            element={<Navigate to="/settings" replace />}
          />

          {/* Technician / Staff Protected Routes */}
          <Route
            path="/technician/dashboard"
            element={
              <ProtectedRoute allowedRoles={['technician', 'staff', 'admin']}>
                <AppLayout>
                  <TechnicianDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/technician/tasks"
            element={
              <ProtectedRoute allowedRoles={['technician', 'staff', 'admin']}>
                <AppLayout>
                  <MaintenanceTasks />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/technician/inspect"
            element={
              <ProtectedRoute allowedRoles={['technician', 'staff', 'admin']}>
                <AppLayout>
                  <InspectAsset />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/technician/report-damage"
            element={
              <ProtectedRoute allowedRoles={['technician', 'staff', 'admin']}>
                <AppLayout>
                  <TechnicianReportDamage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/technician/history"
            element={
              <ProtectedRoute allowedRoles={['technician', 'staff', 'admin']}>
                <AppLayout>
                  <MaintenanceHistory />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <AdminDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/assets"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <ManageAssets />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/requests"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <AdminRequests />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/damage-reports"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <AdminDamageReports />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <ManageUsers />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/history"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <AssetHistoryView />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <UserProfile />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <AdminSettings />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Standalone Loading UI Showcase */}
          <Route path="/loading" element={<LoadingPage />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  </LanguageProvider>
  );
}

export default App;
