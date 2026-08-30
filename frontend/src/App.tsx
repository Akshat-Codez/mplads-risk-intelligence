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

const RoleBasedHome: React.FC = () => {
  // For the SIH MVP, all roles point to the unified data-aware Risk Intelligence Dashboard
  return <MinistryDashboard />;
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
            <Route path="/minister" element={<MinistryDashboard />} />
            <Route path="/ministry" element={<MinistryDashboard />} />
            <Route path="/state" element={<MinistryDashboard />} />
            <Route path="/district" element={<MinistryDashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/risk-intelligence" element={<RoleBasedHome />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/investigations" element={<Investigations />} />
            <Route path="/notifications" element={<Investigations />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/audit-trail" element={<AuditTrail />} />
            <Route path="/data-ingestion" element={<DataIngestion />} />
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
        </Routes>
      </Router>
    </AuthProvider>
  );
};
