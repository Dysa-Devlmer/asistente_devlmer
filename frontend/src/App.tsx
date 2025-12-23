/**
 * Main App Component
 * Application routing and layout
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { POSLogin } from './pages/pos/POSLogin';
import { POSMain } from './pages/pos/POSMain';
import { useAuthStore } from './store/authStore';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/pos/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/pos" replace />} />

        {/* POS Routes */}
        <Route path="/pos/login" element={<POSLogin />} />
        <Route
          path="/pos"
          element={
            <ProtectedRoute>
              <POSMain />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/pos" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
