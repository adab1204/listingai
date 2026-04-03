// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage  from './pages/LandingPage';
import LoginPage    from './pages/LoginPage';
import SignupPage   from './pages/SignupPage';
import Dashboard    from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <>
      <div className="grain" aria-hidden="true" />
      <Routes>
        <Route path="/"        element={<LandingPage />} />
        <Route path="/login"   element={<LoginPage />} />
        <Route path="/signup"  element={<SignupPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
