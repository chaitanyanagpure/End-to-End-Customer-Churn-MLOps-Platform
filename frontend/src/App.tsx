import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PageContainer } from './components/layout/PageContainer';

// Public Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Protected Dashboard Pages
import { Dashboard } from './pages/Dashboard';
import { Predictions } from './pages/Predictions';
import { Datasets } from './pages/Datasets';
import { MLPipeline } from './pages/MLPipeline';
import { Experiments } from './pages/Experiments';
import { ModelRegistry } from './pages/ModelRegistry';
import { Monitoring } from './pages/Monitoring';
import { Reports } from './pages/Reports';
import { ActivityLogs } from './pages/ActivityLogs';
import { Settings } from './pages/Settings';

// Protected Route Guard Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { token, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-text-muted font-medium">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <PageContainer>{children}</PageContainer>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/predictions" element={<ProtectedRoute><Predictions /></ProtectedRoute>} />
      <Route path="/datasets" element={<ProtectedRoute><Datasets /></ProtectedRoute>} />
      <Route path="/pipeline" element={<ProtectedRoute><MLPipeline /></ProtectedRoute>} />
      <Route path="/experiments" element={<ProtectedRoute><Experiments /></ProtectedRoute>} />
      <Route path="/registry" element={<ProtectedRoute><ModelRegistry /></ProtectedRoute>} />
      <Route path="/monitoring" element={<ProtectedRoute adminOnly><Monitoring /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/logs" element={<ProtectedRoute adminOnly><ActivityLogs /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      {/* Fallback Catch-All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
