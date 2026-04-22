import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Lock, User, Mail, ShieldCheck, Loader2, KeyRound, ArrowRight, ShieldAlert, Info } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

type Step = 'checking' | 'login' | 'otp' | 'register' | 'success';

export default function AdminLogin() {
  const { secretKey } = useParams();
  const [step, setStep] = useState<Step>('checking');
  const [identifier, setIdentifier] = useState(''); // username or email
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const res = await axios.get('/api/auth/check-admin', {
        headers: { 'x-admin-secret': secretKey }
      });
      if (res.data.adminExists) {
        setStep('login');
      } else {
        setStep('register');
      }
    } catch (err) {
      setError('System connection error. Please try again.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/auth/register', { username, email, password }, {
        headers: { 'x-admin-secret': secretKey }
      });
      toast.success(res.data.message || 'Registration successful!');
      setMessage(res.data.message);
      setStep('success');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/auth/login-request', { identifier, password }, {
        headers: { 'x-admin-secret': secretKey }
      });
      toast.success('Security code sent to your email!');
      setMessage(res.data.message);
      setStep('otp');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login request failed';
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/auth/login-verify', { identifier, otp }, {
        headers: { 'x-admin-secret': secretKey }
      });
      localStorage.setItem('adminToken', res.data.token);
      toast.success('Access Granted! Welcome to Dashboard.');
      navigate('/admin/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'OTP verification failed';
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-purple-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-purple-600/10 border border-purple-500/20 text-purple-500 mb-6 shadow-xl shadow-purple-500/10"
          >
            {step === 'register' ? <Lock size={40} /> : step === 'otp' ? <ShieldCheck size={40} /> : <User size={40} />}
          </motion.div>
          <h1 className="text-4xl font-black dark:text-white transition-colors tracking-tight">
            {step === 'register' ? 'Set Up Admin' : step === 'otp' ? 'Verification' : 'Admin Login'}
          </h1>
          <p className="text-slate-500 mt-3 font-medium">
            {step === 'register' 
              ? 'Create the primary administrator account' 
              : step === 'otp' 
                ? 'Enter the 8-digit code sent to your email' 
                : 'Secure access to your professional portfolio'
            }
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 md:p-10 rounded-[2.5rem] shadow-2xl space-y-6 transition-all">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold rounded-2xl flex items-center gap-3"
              >
                <ShieldAlert size={20} />
                {error}
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-6"
              >
                <div className="text-purple-600 font-bold text-lg">{message}</div>
                <p className="text-slate-500 text-sm">A verification link has been sent. Please check your inbox and verify your email before logging in.</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full py-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 transition-all shadow-xl shadow-purple-500/20"
                >
                  Go to Login
                </button>
              </motion.div>
            )}

            {step === 'register' && (
              <motion.form 
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleRegister} 
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Username</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" required
                      value={username} onChange={e => setUsername(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:border-purple-500 outline-none transition-all dark:text-white font-bold"
                      placeholder="Admin name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" required
                      value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:border-purple-500 outline-none transition-all dark:text-white font-bold"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Secure Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="password" required
                      value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:border-purple-500 outline-none transition-all dark:text-white font-bold"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <button 
                  type="submit" disabled={loading}
                  className="w-full py-5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black uppercase tracking-widest text-sm rounded-2xl transition-all flex items-center justify-center gap-3 shadow-2xl shadow-purple-500/20 active:scale-95"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <>Create Account <ArrowRight size={18}/></>}
                </button>
              </motion.form>
            )}

            {step === 'login' && (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleLoginRequest} 
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Username or Email</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" required
                      value={identifier} onChange={e => setIdentifier(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:border-purple-500 outline-none transition-all dark:text-white font-bold"
                      placeholder="Username / Email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="password" required
                      value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:border-purple-500 outline-none transition-all dark:text-white font-bold"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="flex justify-end px-1">
                    <Link 
                      to={`/admin/forgot-password/${import.meta.env.VITE_ADMIN_ACCESS_SECRET}`} 
                      className="text-sm font-bold text-slate-400 hover:text-purple-500 transition-colors"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                </div>
                <button 
                  type="submit" disabled={loading}
                  className="w-full py-5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black uppercase tracking-widest text-sm rounded-2xl transition-all flex items-center justify-center gap-3 shadow-2xl shadow-purple-500/20 active:scale-95"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <>Continue <ArrowRight size={18}/></>}
                </button>
              </motion.form>
            )}

            {step === 'otp' && (
              <motion.form 
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleLoginVerify} 
                className="space-y-8"
              >
                <div className="text-center py-4">
                  <p className="text-sm text-slate-500 mb-6 bg-purple-50 dark:bg-purple-900/10 p-4 rounded-2xl border border-purple-100 dark:border-purple-800/20">
                    {message}
                  </p>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">8-Digit Security Code</label>
                    <input 
                      type="text" required
                      maxLength={8}
                      value={otp} onChange={e => setOtp(e.target.value)}
                      className="w-full text-center text-2xl font-black tracking-[0.5em] py-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:border-purple-500 outline-none transition-all dark:text-white"
                      placeholder="********"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <button 
                    type="submit" disabled={loading}
                    className="w-full py-5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black uppercase tracking-widest text-sm rounded-2xl transition-all flex items-center justify-center gap-3 shadow-2xl shadow-purple-500/20 active:scale-95"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <>Verify <ShieldCheck size={20}/></>}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setStep('login')}
                    className="w-full py-4 text-slate-400 hover:text-slate-600 font-bold text-sm"
                  >
                    Back to Login
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
