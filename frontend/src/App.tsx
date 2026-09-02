import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/common/Sidebar';
import { Navbar } from './components/common/Navbar';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { MinisterDashboard } from './pages/minister/MinisterDashboard';
import { Dashboard as MinistryDashboard } from './pages/ministry/Dashboard';
import { StateDashboard } from './pages/state/StateDashboard';
import { DistrictDashboard } from './pages/district/DistrictDashboard';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { Vendors } from './pages/vendors/Vendors';
import { Investigations } from './pages/investigations/Investigations';
import { Analytics } from './pages/Analytics';
import { AuditTrail } from './pages/AuditTrail';
import { DataIngestion } from './pages/DataIngestion';
import { GISAnalytics } from './pages/GISAnalytics';
import { GeofenceInspector } from './pages/GeofenceInspector';

const RoleBasedHome: React.FC = () => {
  const { role } = useAuth();
  switch (role) {
    case 'MINISTER': return <MinisterDashboard />;
    case 'MINISTRY': return <MinistryDashboard />;
    case 'STATE': return <StateDashboard />;
    case 'DISTRICT': return <DistrictDashboard />;
    default: return <MinistryDashboard />;
  }
};

const ProtectedLayout: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<RoleBasedHome />} />
            <Route path="minister" element={<MinisterDashboard />} />
            <Route path="ministry" element={<MinistryDashboard />} />
            <Route path="state" element={<StateDashboard />} />
            <Route path="district" element={<DistrictDashboard />} />
            <Route path="gis-analytics" element={<GISAnalytics />} />
            <Route path="geofence-inspector" element={<GeofenceInspector />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="projects/:id/audit" element={<ProjectDetail />} />
            <Route path="projects/:id/inspection" element={<ProjectDetail />} />
            <Route path="risk-intelligence" element={<RoleBasedHome />} />
            <Route path="vendors" element={<Vendors />} />
            <Route path="investigations" element={<Investigations />} />
            <Route path="notifications" element={<Investigations />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="audit-trail" element={<AuditTrail />} />
            <Route path="data-ingestion" element={<DataIngestion />} />
            <Route path="*" element={<RoleBasedHome />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Protected Application Routes */}
          <Route path="/app/*" element={<ProtectedLayout />} />
          <Route path="/dashboard/*" element={<ProtectedLayout />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};
