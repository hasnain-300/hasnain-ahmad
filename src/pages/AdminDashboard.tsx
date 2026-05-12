import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Link, useLocation, Navigate, useParams } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Cpu, 
  MessageSquare, 
  LogOut, 
  Plus, 
  Trash2, 
  ExternalLink,
  Github,
  Linkedin,
  Twitter,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  Calendar,
  ChevronRight,
  Mail,
  User,
  Save,
  Edit,
  Facebook,
  Instagram,
  MessageCircle,
  Files
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Project, Skill, Message, Profile } from '../types';
import { cn } from '../lib/utils';

const isValidUrl = (url: string) => {
  if (!url || url.trim() === '') return true;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { part1, part2 } = useParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const api = React.useMemo(() => {
    const instance = axios.create();
    
    instance.interceptors.request.use((config) => {
      const storedToken = localStorage.getItem('adminToken');
      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
      return config;
    });

    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('adminToken');
          toast.error('Session expired.');
          navigate('/');
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [api]);

  const fetchData = async () => {
    try {
      const [p, s, m, prof] = await Promise.all([
        axios.get('/api/projects'),
        axios.get('/api/skills'),
        api.get('/api/messages'),
        axios.get('/api/profile').catch(() => ({ data: null }))
      ]);
      setProjects(p.data);
      setSkills(s.data);
      setMessages(m.data);
      setProfile(prof.data);
    } catch (err: any) {
      if (err.response?.status !== 401) {
        console.error('Fetch error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  const navItems = [
    { name: 'Profile', path: `/admin/${part1}/${part2}/dashboard/profile`, icon: User },
    { name: 'About', path: `/admin/${part1}/${part2}/dashboard/about`, icon: Files },
    { name: 'Projects', path: `/admin/${part1}/${part2}/dashboard/projects`, icon: Briefcase },
    { name: 'Skills', path: `/admin/${part1}/${part2}/dashboard/skills`, icon: Cpu },
    { name: 'Messages', path: `/admin/${part1}/${part2}/dashboard/messages`, icon: MessageSquare },
  ];

  const goToWebsite = () => {
    navigate('/');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F9FAFB] dark:bg-slate-950 transition-colors">
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-5 right-5 z-[60]">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-3.5 bg-purple-600 text-white rounded-2xl shadow-xl shadow-purple-500/40 active:scale-95 transition-all"
        >
          {isSidebarOpen ? <X size={24} /> : <LayoutDashboard size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-500 ease-in-out transform lg:relative lg:translate-x-0 shadow-2xl lg:shadow-none",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <motion.div 
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-purple-500/20 flex-shrink-0"
              >
                <span className="font-black text-2xl">{profile?.name ? profile.name.charAt(0).toUpperCase() : 'A'}</span>
              </motion.div>
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white truncate">Admin Panel</span>
                <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase">Management</span>
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
          <nav className="space-y-1.5">
            {navItems.map(item => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group relative overflow-hidden",
                  location.pathname === item.path 
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" 
                    : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <item.icon size={22} className={cn(
                  "transition-colors z-10",
                  location.pathname === item.path ? "text-white" : "group-hover:text-purple-500"
                )} />
                <span className="font-bold z-10">{item.name}</span>
                {location.pathname === item.path && (
                  <motion.div 
                    layoutId="active-pill"
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-3">
          <div className="h-px bg-slate-100 dark:bg-slate-800 mb-6" />
          <button 
            onClick={goToWebsite}
            className="flex items-center gap-4 px-4 py-3.5 w-full text-slate-400 hover:text-purple-600 hover:bg-purple-500/10 rounded-2xl transition-all font-semibold"
          >
            <ExternalLink size={22} />
            <span>View Site</span>
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3.5 w-full text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all font-semibold"
          >
            <LogOut size={22} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-4 md:p-8 lg:p-12 overflow-y-auto scroll-smooth">
        <div className="max-w-6xl mx-auto space-y-12 pb-20">
          {/* Dashboard Header Bar */}
          <div className="lg:hidden h-16 w-full mb-4 flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white font-black text-lg">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <h1 className="font-bold text-lg dark:text-white">Admin Dashboard</h1>
            </div>
          </div>
          
          <Routes>
            <Route path="/" element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<ProfileManager profile={profile} onUpdate={fetchData} api={api} />} />
            <Route path="about" element={<AboutManager profile={profile} onUpdate={fetchData} api={api} />} />
            <Route path="projects" element={<ProjectsManager projects={projects} onUpdate={fetchData} api={api} />} />
            <Route path="skills" element={<SkillsManager skills={skills} onUpdate={fetchData} api={api} />} />
            <Route path="messages" element={<MessagesManager messages={messages} onUpdate={fetchData} api={api} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function ProfileManager({ profile, onUpdate, api }: { profile: Profile | null, onUpdate: () => void, api: any }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Profile>({
    name: profile?.name || '',
    title: profile?.title || '',
    bio: profile?.bio || '',
    aboutText: profile?.aboutText || '',
    experienceYears: profile?.experienceYears || '',
    projectsCompleted: profile?.projectsCompleted || '',
    clientSatisfaction: profile?.clientSatisfaction || '',
    aboutImage1: profile?.aboutImage1 || '',
    aboutImage2: profile?.aboutImage2 || '',
    image: profile?.image || '',
    github: profile?.github || '',
    linkedin: profile?.linkedin || '',
    email: profile?.email || '',
    twitter: profile?.twitter || '',
    facebook: profile?.facebook || '',
    instagram: profile?.instagram || '',
    whatsapp: profile?.whatsapp || ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        ...formData,
        ...profile
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const urlFields = [
      { key: 'github', label: 'GitHub' },
      { key: 'linkedin', label: 'LinkedIn' },
      { key: 'twitter', label: 'Twitter' },
      { key: 'facebook', label: 'Facebook' },
      { key: 'instagram', label: 'Instagram' }
    ];

    for (const field of urlFields) {
      const val = formData[field.key as keyof typeof formData];
      if (val && !isValidUrl(val)) {
        toast.error(`Invalid URL for ${field.label}`);
        return;
      }
    }

    try {
      // Sanitize payload: remove _id, __v, and timestamp fields if they exist
      const { _id, __v, createdAt, updatedAt, ...sanitizedData } = formData as any;
      await api.post('/api/profile', sanitizedData);
      toast.success('Profile updated successfully!');
      setShowForm(false);
      onUpdate();
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Profile Settings</h2>
          <p className="text-slate-500 mt-2">Manage your hero section and social links</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-purple-500/20 active:scale-95"
          >
            <Edit size={24} /> Edit Profile
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -50, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -50, height: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 md:p-12 shadow-sm mb-10">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white font-medium"
                      placeholder="Your Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Professional Title</label>
                    <input 
                      type="text" 
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white font-medium"
                      placeholder="Software Engineer"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Bio / Introduction</label>
                  <textarea 
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    required
                    rows={4}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white resize-none font-medium text-lg leading-relaxed"
                    placeholder="Tell something about yourself..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Profile Image URL</label>
                  <input 
                    type="text" 
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white font-medium"
                    placeholder="https://..."
                  />
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-8" />
                
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Social Links</h3>
                  <p className="text-sm text-slate-500">Provide at least one platform link (<span className="text-red-500">*</span>)</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">GitHub Profile</label>
                    <input 
                      type="text" 
                      value={formData.github}
                      onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white font-medium"
                      placeholder="https://github.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">LinkedIn Profile</label>
                    <input 
                      type="text" 
                      value={formData.linkedin}
                      onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white font-medium"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Facebook Profile</label>
                    <input 
                      type="text" 
                      value={formData.facebook}
                      onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white font-medium"
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Instagram Profile</label>
                    <input 
                      type="text" 
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white font-medium"
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Twitter / X Profile</label>
                    <input 
                      type="text" 
                      value={formData.twitter}
                      onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white font-medium"
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">WhatsApp Number</label>
                    <input 
                      type="text" 
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white font-medium"
                      placeholder="+8801..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white font-medium"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="flex gap-4 justify-end pt-6">
                  <button 
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-10 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-purple-500/20 active:scale-95"
                  >
                    <Save size={20} /> Save
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showForm && profile && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 md:p-12 shadow-sm flex flex-col md:flex-row gap-8 items-center">
          <img src={formData.image || "https://picsum.photos/seed/placeholder/800/800"} alt="Preview" className="w-32 h-32 rounded-full object-cover border-4 border-purple-500/20 shadow-xl" />
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <h3 className="text-2xl font-black dark:text-white">{formData.name}</h3>
              <p className="text-purple-600 font-bold">{formData.title}</p>
            </div>
            <p className="text-slate-500 dark:text-slate-400 line-clamp-2 max-w-2xl">{formData.bio}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              {formData.github && <Github size={18} className="text-slate-400" />}
              {formData.linkedin && <Linkedin size={18} className="text-slate-400" />}
              {formData.facebook && <Facebook size={18} className="text-slate-400" />}
              {formData.instagram && <Instagram size={18} className="text-slate-400" />}
              {formData.twitter && <Twitter size={18} className="text-slate-400" />}
              {formData.whatsapp && <MessageCircle size={18} className="text-slate-400" />}
              {formData.email && <Mail size={18} className="text-slate-400" />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AboutManager({ profile, onUpdate, api }: { profile: Profile | null, onUpdate: () => void, api: any }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Profile>(profile || {
    name: '', title: '', bio: '', aboutText: '', experienceYears: '',
    projectsCompleted: '', clientSatisfaction: '', aboutImage1: '',
    aboutImage2: '', image: '', github: '', linkedin: '', email: '',
    twitter: '', facebook: '', instagram: '', whatsapp: ''
  });

  useEffect(() => {
    if (profile) setFormData(profile);
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { _id, __v, createdAt, updatedAt, ...sanitizedData } = formData as any;
      await api.post('/api/profile', sanitizedData);
      toast.success('About section updated successfully!');
      setShowForm(false);
      onUpdate();
    } catch (err) {
      toast.error('Failed to update About section');
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">About Section</h2>
          <p className="text-slate-500 mt-2">Manage your detailed story, stats, and gallery images</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-purple-500/20 active:scale-95"
          >
            <Edit size={24} /> Edit About
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -50, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -50, height: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 md:p-12 shadow-sm mb-10">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Detailed About Me Text</label>
                  <textarea 
                    value={formData.aboutText}
                    onChange={(e) => setFormData({ ...formData, aboutText: e.target.value })}
                    required
                    rows={8}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white resize-none font-medium text-lg leading-relaxed"
                    placeholder="Your detailed journey and story..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Experience Years</label>
                    <input 
                      type="text" 
                      value={formData.experienceYears}
                      onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white font-medium"
                      placeholder="e.g. 5+ Years"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Projects Completed</label>
                    <input 
                      type="text" 
                      value={formData.projectsCompleted}
                      onChange={(e) => setFormData({ ...formData, projectsCompleted: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white font-medium"
                      placeholder="e.g. 50+"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Satisfaction Rate</label>
                    <input 
                      type="text" 
                      value={formData.clientSatisfaction}
                      onChange={(e) => setFormData({ ...formData, clientSatisfaction: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white font-medium"
                      placeholder="e.g. 100%"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Gallery Image 1 URL</label>
                    <input 
                      type="text" 
                      value={formData.aboutImage1}
                      onChange={(e) => setFormData({ ...formData, aboutImage1: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white font-medium"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Gallery Image 2 URL</label>
                    <input 
                      type="text" 
                      value={formData.aboutImage2}
                      onChange={(e) => setFormData({ ...formData, aboutImage2: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white font-medium"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="flex gap-4 justify-end pt-6">
                  <button type="button" onClick={() => setShowForm(false)} className="px-10 py-4 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all">Cancel</button>
                  <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-purple-500/20"><Save size={20} /> Save</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showForm && profile && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 md:p-12 shadow-sm space-y-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-black dark:text-white">Story Preview</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-4xl leading-relaxed whitespace-pre-wrap">{formData.aboutText}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Experience</p>
              <h4 className="text-3xl font-black text-purple-600">{formData.experienceYears}</h4>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Projects</p>
              <h4 className="text-3xl font-black text-purple-600">{formData.projectsCompleted}</h4>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Satisfaction</p>
              <h4 className="text-3xl font-black text-purple-600">{formData.clientSatisfaction}</h4>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 max-w-2xl">
            {formData.aboutImage1 && <img src={formData.aboutImage1 || null} alt="Gallery 1" className="w-full h-48 object-cover rounded-3xl border-2 border-slate-100 dark:border-slate-800 shadow-sm" />}
            {formData.aboutImage2 && <img src={formData.aboutImage2 || null} alt="Gallery 2" className="w-full h-48 object-cover rounded-3xl border-2 border-slate-100 dark:border-slate-800 shadow-sm" />}
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectsManager({ projects, onUpdate, api }: { projects: Project[], onUpdate: () => void, api: any }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    tags: '',
    link: '',
    github: ''
  });

  const handleOpenForm = (project?: Project) => {
    if (project) {
      setEditingId(project.id);
      setFormData({
        title: project.title,
        description: project.description,
        image: project.image,
        tags: Array.isArray(project.tags) ? project.tags.join(', ') : '',
        link: project.link,
        github: project.github
      });
    } else {
      setEditingId(null);
      setFormData({ title: '', description: '', image: '', tags: '', link: '', github: '' });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.image && !isValidUrl(formData.image)) {
      toast.error('Invalid Thumbnail URL');
      return;
    }
    if (formData.link && !isValidUrl(formData.link)) {
      toast.error('Invalid Live Application URL');
      return;
    }
    if (formData.github && !isValidUrl(formData.github)) {
      toast.error('Invalid Source Code URL');
      return;
    }

    const payload = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t !== '')
    };

    try {
      if (editingId) {
        await api.put(`/api/projects/${editingId}`, payload);
        toast.success('Project updated successfully!');
      } else {
        await api.post('/api/projects', payload);
        toast.success('Project added successfully!');
      }
      setFormData({ title: '', description: '', image: '', tags: '', link: '', github: '' });
      setShowForm(false);
      onUpdate();
    } catch (err) {
      toast.error(editingId ? 'Failed to update project' : 'Failed to add project');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/projects/${id}`);
      toast.success('Project deleted successfully');
      onUpdate();
    } catch (err) {
      toast.error('Failed to delete project');
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Portfolio Projects</h2>
          <p className="text-slate-500 mt-2">Manage and showcase your best work</p>
        </div>
        <button 
          onClick={() => handleOpenForm()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-purple-500/20 active:scale-95"
        >
          <Plus size={24} /> New Project
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xl"
              onClick={() => setShowForm(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-10 rounded-[2.5rem] w-full max-w-2xl shadow-2xl relative z-[10000] transition-colors max-h-[90vh] overflow-y-auto"
            >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{editingId ? 'Edit Project' : 'Create Project'}</h3>
              <button 
                onClick={() => setShowForm(false)} 
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-slate-500 ml-1">Project Title</label>
                <input 
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all dark:text-white"
                  placeholder="e.g. E-Commerce Platform"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-slate-500 ml-1">Detailed Description</label>
                <textarea 
                  required
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none h-32 resize-none transition-all dark:text-white"
                  placeholder="Tell us about the project goal and your role..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 ml-1">Thumbnail URL</label>
                <input 
                  value={formData.image}
                  onChange={e => setFormData({...formData, image: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all dark:text-white"
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 ml-1">Technology Stack</label>
                <input 
                  value={formData.tags}
                  onChange={e => setFormData({...formData, tags: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all dark:text-white"
                  placeholder="React, Tailwind, Node.js"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 ml-1">Live Application URL</label>
                <input 
                  value={formData.link}
                  type="url"
                  onChange={e => setFormData({...formData, link: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 ml-1">Source Code URL</label>
                <input 
                  value={formData.github}
                  type="url"
                  onChange={e => setFormData({...formData, github: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all dark:text-white"
                />
              </div>
              <button 
                type="submit" 
                className="md:col-span-2 mt-6 py-5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-purple-500/20 active:scale-95"
              >
                {editingId ? 'Update Project' : 'Publish Project'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 md:gap-8">
        {projects.map(project => (
          <div key={project.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden transition-all hover:shadow-2xl hover:shadow-purple-500/5 hover:-translate-y-1 flex flex-col h-full">
            <div className="aspect-video relative overflow-hidden bg-slate-100 dark:bg-slate-950">
              <img 
                src={project.image || `https://picsum.photos/seed/${project.id}/600/400`} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                referrerPolicy="no-referrer" 
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <button 
                  onClick={() => handleOpenForm(project)} 
                  className="w-10 h-10 flex items-center justify-center bg-white/95 dark:bg-slate-900/95 text-purple-500 rounded-xl backdrop-blur-sm lg:opacity-0 lg:group-hover:opacity-100 transition-all shadow-lg active:scale-90"
                >
                  <Edit size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(project.id)} 
                  className="w-10 h-10 flex items-center justify-center bg-white/95 dark:bg-slate-900/95 text-red-500 rounded-xl backdrop-blur-sm lg:opacity-0 lg:group-hover:opacity-100 transition-all shadow-lg active:scale-90"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div className="p-6 md:p-8 flex flex-col flex-1">
              <div className="flex flex-wrap gap-2 mb-4">
                {Array.isArray(project.tags) ? project.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-lg">
                    {tag}
                  </span>
                )) : null}
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-purple-600 transition-colors line-clamp-1">{project.title}</h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 mb-auto leading-relaxed">{project.description}</p>
              
              <div className="flex items-center justify-between pt-6 mt-8 border-t border-slate-100 dark:border-slate-800 transition-colors">
                <div className="flex gap-4">
                  <a href={project.github} target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90">
                    <Github size={18} />
                  </a>
                  <a href={project.link} target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90">
                    <ExternalLink size={18} />
                  </a>
                </div>
                <div className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest">
                  ID: {project.id.slice(-6).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillsManager({ skills, onUpdate, api }: { skills: Skill[], onUpdate: () => void, api: any }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentSkill, setCurrentSkill] = useState({ 
    name: '', 
    category: 'Frontend' as Skill['category'],
    icon: ''
  });

  const handleOpenForm = (skill?: Skill) => {
    if (skill) {
      setEditingId(skill.id);
      setCurrentSkill({ 
        name: skill.name, 
        category: skill.category,
        icon: skill.icon || ''
      });
    } else {
      setEditingId(null);
      setCurrentSkill({ name: '', category: 'Frontend', icon: '' });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/skills/${editingId}`, currentSkill);
        toast.success('Skill updated successfully!');
      } else {
        await api.post('/api/skills', currentSkill);
        toast.success('Skill added successfully!');
      }
      setCurrentSkill({ name: '', category: 'Frontend', icon: '' });
      setShowForm(false);
      onUpdate();
    } catch (err) {
      toast.error(editingId ? 'Failed to update skill' : 'Failed to add skill');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/skills/${id}`);
      onUpdate();
      toast.success('Skill deleted successfully');
    } catch (err) {
      toast.error('Failed to delete skill');
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Technical Arsenal</h2>
          <p className="text-slate-500 mt-2">Add or remove skills from your repertoire</p>
        </div>
        <button 
          onClick={() => handleOpenForm()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-purple-500/20 active:scale-95"
        >
          <Plus size={24} /> New Skill
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xl"
              onClick={() => setShowForm(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 md:p-10 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative z-[10000] transition-colors"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{editingId ? 'Edit Skill' : 'Add New Skill'}</h3>
                <button 
                  onClick={() => setShowForm(false)} 
                  className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Skill Name</label>
                  <input 
                    required
                    value={currentSkill.name}
                    onChange={e => setCurrentSkill({...currentSkill, name: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all dark:text-white font-bold"
                    placeholder="e.g. React.js"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Icon URL / Class Name</label>
                  <input 
                    value={currentSkill.icon}
                    onChange={e => setCurrentSkill({...currentSkill, icon: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all dark:text-white font-bold"
                    placeholder="e.g. https://... or lucide-react name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Category</label>
                  <div className="relative">
                    <select 
                      value={currentSkill.category}
                      onChange={e => setCurrentSkill({...currentSkill, category: e.target.value as any})}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all dark:text-white font-bold cursor-pointer appearance-none"
                    >
                      <option>Frontend</option>
                      <option>Backend</option>
                      <option>Database</option>
                      <option>Tools</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronRight size={18} className="rotate-90" />
                    </div>
                  </div>
                </div>
                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-5 rounded-2xl font-bold transition-all shadow-xl shadow-purple-500/20 active:scale-95 flex items-center justify-center gap-2 mt-4">
                  {editingId ? <Edit size={20} /> : <Plus size={20} />} {editingId ? 'Update Skill' : 'Add to Arsenal'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {['Frontend', 'Backend', 'Database', 'Tools'].map(cat => (
          <div key={cat} className="space-y-6">
            <h4 className="font-bold text-slate-400 uppercase tracking-[0.2em] text-[10px] ml-1">{cat}</h4>
            <div className="space-y-3">
              {skills.filter(s => s.category === cat).map(skill => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={skill.id} 
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-5 py-4 rounded-2xl flex items-center justify-between group transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/5"
                >
                  <span className="font-bold text-slate-700 dark:text-slate-200">{skill.name}</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenForm(skill)} 
                      className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(skill.id)} 
                      className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
              {skills.filter(s => s.category === cat).length === 0 && (
                <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl opacity-40">
                  <p className="text-xs">No entries</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MessagesManager({ messages, onUpdate, api }: { messages: Message[], onUpdate: () => void, api: any }) {
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await api.delete(`/api/messages/${id}`);
      toast.success('Message deleted successfully');
      if (selectedMessage?.id === id) setSelectedMessage(null);
      onUpdate();
    } catch (err) {
      toast.error('Failed to delete message');
    }
  };

  const sortedMessages = [...messages].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Inquiry Inbox</h2>
          <p className="text-slate-500 mt-2">Personal messages from your portfolio visitors</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button 
            onClick={() => setSortOrder('newest')}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              sortOrder === 'newest' 
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" 
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            )}
          >
            Newest
          </button>
          <button 
            onClick={() => setSortOrder('oldest')}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              sortOrder === 'oldest' 
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" 
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            )}
          >
            Oldest
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {sortedMessages.length > 0 ? sortedMessages.map((msg, idx) => (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.03 }}
            key={msg.id} 
            onClick={() => setSelectedMessage(msg)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] flex items-center justify-between gap-6 transition-all hover:shadow-2xl hover:shadow-purple-500/5 hover:-translate-x-1 cursor-pointer group"
          >
            <div className="flex items-center gap-6 min-w-0">
              <div className="w-14 h-14 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl shadow-purple-500/20 group-hover:scale-110 transition-transform flex-shrink-0">
                {msg.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-bold text-lg text-slate-900 dark:text-white truncate">{msg.name}</h4>
                  <span className="text-[10px] font-black tracking-widest text-slate-300 dark:text-slate-700 uppercase whitespace-nowrap hidden sm:inline">
                    {new Date(msg.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm truncate max-w-lg">
                  {msg.message}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-slate-300 group-hover:text-purple-500 transition-colors">
              <button 
                onClick={(e) => handleDelete(msg.id, e)}
                className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={18} />
              </button>
              <ChevronRight size={24} />
            </div>
          </motion.div>
        )) : (
          <div className="py-32 flex flex-col items-center justify-center border-4 border-dashed border-slate-100 dark:border-slate-900 rounded-[3rem] text-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center text-slate-200 dark:text-slate-800">
              <MessageSquare size={40} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-400">Your inbox is empty</p>
              <p className="text-slate-500">Wait for your first inquiry to appear here.</p>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedMessage && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xl"
              onClick={() => setSelectedMessage(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 md:p-12 rounded-[2.5rem] w-full max-w-2xl shadow-2xl relative z-[10000] transition-colors max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-10">
                <div className="flex items-center gap-6">
                  <div className="w-15 h-15 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white font-black text-3xl shadow-2xl shadow-purple-500/30">
                    {selectedMessage.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
                      {selectedMessage.name}
                    </h3>
                    <div className="flex items-center gap-3 text-purple-600 dark:text-purple-400 font-bold text-sm">
                      <Mail size={16} />
                      <a href={`mailto:${selectedMessage.email}`} className="hover:underline">
                        {selectedMessage.email}
                      </a>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleDelete(selectedMessage.id)}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all active:scale-90"
                  >
                    <Trash2 size={24} />
                  </button>
                  <button 
                    onClick={() => setSelectedMessage(null)} 
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-3 text-[10px] font-black tracking-[0.2em] text-slate-400 bg-slate-50 dark:bg-slate-950 px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 uppercase w-fit">
                  <Calendar size={14} className="text-purple-500" />
                  Received on {new Date(selectedMessage.date).toLocaleDateString(undefined, { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>

                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-purple-500 to-indigo-600 rounded-full opacity-50" />
                  <div className="pl-10">
                    <h5 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 ml-1">Message Content</h5>
                    <p className="text-slate-600 dark:text-slate-300 text-xl leading-relaxed font-medium">
                      {selectedMessage.message}
                    </p>
                  </div>
                </div>

                <div className="pt-10 border-t border-slate-100 dark:border-slate-800/50 flex justify-between items-center">
                  <span className="text-[5px] font-black tracking-[0.3em] text-slate-300 dark:text-slate-700 uppercase">
                    ID: {selectedMessage.id.toUpperCase()}
                  </span>
                  <button 
                    onClick={() => setSelectedMessage(null)}
                    className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:scale-105 transition-all shadow-xl active:scale-95"
                  >
                    Close View
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
