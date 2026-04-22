import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Portfolio from './pages/Portfolio';
import AdminLogin from './pages/AdminLogin';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/AdminDashboard';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import { cn } from './lib/utils';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('adminToken');
  // Redirect to home if not authenticated to avoid leaking login path
  if (!token) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AdminLoginWrapper = () => {
  const { secretKey } = useParams();
  const secret = import.meta.env.VITE_ADMIN_ACCESS_SECRET;
  
  if (secretKey === secret) {
    return <AdminLogin />;
  }
  
  return <Navigate to="/" replace />;
};

const AdminForgotPasswordWrapper = () => {
  const { secretKey } = useParams();
  const secret = import.meta.env.VITE_ADMIN_ACCESS_SECRET;
  
  if (secretKey === secret) {
    return <ForgotPassword />;
  }
  
  return <Navigate to="/" replace />;
};

const ResetPasswordWrapper = () => {
  const { secretKey } = useParams();
  const secret = import.meta.env.VITE_ADMIN_ACCESS_SECRET;
  
  if (secretKey === secret) {
    return <ResetPassword />;
  }
  
  return <Navigate to="/" replace />;
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const { theme } = useTheme();
  
  return (
    <Router>
      <div className={cn(
        "min-h-screen transition-colors duration-300",
        theme === 'dark' ? "dark" : ""
      )}>
        <Toaster position="top-center" reverseOrder={false} />
        <Routes>
          <Route path="/" element={<Portfolio />} />
          
          {/* Universal Admin Route Trap - Redirects guessable routes to home */}
          <Route path="/admin" element={<Navigate to="/" replace />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/admin/login" element={<Navigate to="/" replace />} />
          <Route path="/admin/forgot-password" element={<Navigate to="/" replace />} />
          <Route path="/admin/reset-password" element={<Navigate to="/" replace />} />
          
          <Route path="/admin/login/:secretKey" element={<AdminLoginWrapper />} />
          <Route path="/admin/forgot-password/:secretKey" element={<AdminForgotPasswordWrapper />} />
          <Route path="/admin/reset-password/:token/:secretKey" element={<ResetPasswordWrapper />} />
          <Route 
            path="/admin/dashboard/*" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Catch-all route to prevent any broken links from showing anything other than portfolio */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}
