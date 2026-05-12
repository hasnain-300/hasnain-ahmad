import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import Portfolio from './pages/Portfolio';
import AdminDashboard from './pages/AdminDashboard';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Toaster, toast } from 'react-hot-toast';
import { cn } from './lib/utils';
import axios from 'axios';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('adminToken');
  if (!token) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const MagicLinkHandler = () => {
  const { part1, part2 } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const login = async () => {
      const secret = `${part1}/${part2}`;
      try {
        const response = await axios.post('/api/auth/magic-login', { secret });
        localStorage.setItem('adminToken', response.data.token);
        toast.success('Admin access granted');
        navigate(`/admin/${part1}/${part2}/dashboard`);
      } catch (error) {
        toast.error('Invalid access link');
        navigate('/');
      }
    };
    login();
  }, [part1, part2, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-white text-xl animate-pulse">Authenticating...</div>
    </div>
  );
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
          
          <Route path="/admin/:part1/:part2" element={<MagicLinkHandler />} />
          <Route 
            path="/admin/:part1/:part2/dashboard/*" 
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
