import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import MemberDashboard from './pages/MemberDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import MembersPage from './pages/MembersPage';
import EquipmentPage from './pages/EquipmentPage';
import InstructorsPage from './pages/InstructorsPage';
import PlansPage from './pages/PlansPage';
import MemberPlansPage from './pages/MemberPlansPage';
import PaymentsPage from './pages/PaymentsPage';
import AttendancePage from './pages/AttendancePage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Placeholder components for routing
const PlaceholderPage = ({ title }) => (
  <div className="neon-card" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <h1 style={{ color: 'var(--text-muted)', fontSize: '2rem' }}>{title} Module Coming Soon</h1>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Member Protected Routes (No Sidebar layout for now) */}
          <Route
            path="/member-dashboard"
            element={
              <ProtectedRoute allowedRoles={['member']}>
                <MemberDashboard />
              </ProtectedRoute>
            }
          />

          {/* Instructor Protected Routes */}
          <Route
            path="/instructor-dashboard"
            element={
              <ProtectedRoute allowedRoles={['instructor']}>
                <InstructorDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="instructors" element={<InstructorsPage />} />
            <Route path="plans" element={<PlansPage />} />
            <Route path="member-plans" element={<MemberPlansPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="equipment" element={<EquipmentPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
