import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ToastProvider';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Colis from './pages/Colis';
import Emails from './pages/Emails';
import Login from './pages/Login';
import Catalog from './pages/Catalog';
import CatalogManager from './pages/CatalogManager';
import Paniers from './pages/Paniers';
import Credentials from './pages/Credentials';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('malla_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <Router>
      <ToastProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/catalog" element={<Catalog />} />

          {/* Protected routes wrapped in Layout */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
          <Route path="/colis" element={<ProtectedRoute><Colis /></ProtectedRoute>} />
          <Route path="/emails" element={<ProtectedRoute><Emails /></ProtectedRoute>} />
          <Route path="/catalog-manager" element={<ProtectedRoute><CatalogManager /></ProtectedRoute>} />
          <Route path="/paniers" element={<ProtectedRoute><Paniers /></ProtectedRoute>} />
          <Route path="/credentials" element={<ProtectedRoute><Credentials /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </Router>
  );
}

export default App;
