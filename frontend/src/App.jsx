import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import CoursesPage from './pages/CoursesPage';
import EnrollmentsPage from './pages/EnrollmentsPage';
import AttendancePage from './pages/AttendancePage';
import MarksPage from './pages/MarksPage';
import ReportsPage from './pages/ReportsPage';
import NotificationsPage from './pages/NotificationsPage';

const ProtectedLayout = ({ children }) => {
  const { user, loading } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar isMobileOpen={isMobileOpen} toggleMobile={() => setIsMobileOpen(!isMobileOpen)} />
      <div className="main-content">
        <TopBar toggleMobile={() => setIsMobileOpen(!isMobileOpen)} />
        <main className="page-wrapper">{children}</main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route
            path="/"
            element={
              <ProtectedLayout>
                <DashboardPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedLayout>
                <StudentsPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/courses"
            element={
              <ProtectedLayout>
                <CoursesPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/enrollments"
            element={
              <ProtectedLayout>
                <EnrollmentsPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedLayout>
                <AttendancePage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/marks"
            element={
              <ProtectedLayout>
                <MarksPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedLayout>
                <ReportsPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedLayout>
                <NotificationsPage />
              </ProtectedLayout>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
