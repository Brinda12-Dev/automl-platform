// ═══════════════════════════════════════════════════
// APP.JSX — Routeur principal de l'application
// ═══════════════════════════════════════════════════
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import axios from 'axios';
import HomePage     from './pages/HomePage';
import TrainPage    from './pages/TrainPage';
import PredictPage  from './pages/PredictPage';
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage  from './pages/ProfilePage';  // ← NOUVEAU
import { isSessionValid, getToken, clearSession } from './services/auth';
import './App.css';

const queryClient = new QueryClient();

function TokenChecker() {
  useEffect(() => {
    const token = getToken();
    if (token) {
      axios.get('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {
        clearSession();
        window.location.href = '/login';
      });
    }
  }, []);
  return null;
}

function ProtectedRoute({ children }) {
  const location = useLocation();
  if (!isSessionValid()) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={{
        token: {
          colorPrimary: '#2563EB',
          borderRadius: 8,
          fontFamily: 'Inter, system-ui, sans-serif',
        }
      }}>
        <BrowserRouter>
          <TokenChecker />
          <Routes>
            {/* ── Routes publiques ── */}
            <Route path="/"         element={<HomePage />} />
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* ── Routes protégées ── */}
            <Route path="/train" element={
              <ProtectedRoute><TrainPage /></ProtectedRoute>
            }/>
            <Route path="/predict" element={
              <ProtectedRoute><PredictPage /></ProtectedRoute>
            }/>
            <Route path="/profile" element={           // ← NOUVEAU
              <ProtectedRoute><ProfilePage /></ProtectedRoute>
            }/>
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
}