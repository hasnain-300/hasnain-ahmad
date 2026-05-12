import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Github, 
  Linkedin, 
  Mail, 
  ExternalLink, 
  Code2, 
  Database, 
  Layout, 
  Terminal,
  ChevronDown,
  ChevronUp,
  Info,
  Send,
  User,
  Briefcase,
  Cpu,
  Home,
  Phone,
  Twitter,
  Sun,
  Moon,
  Facebook,
  Instagram,
  MessageCircle,
  Award,
  Coffee,
  Globe
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Project, Skill, Profile } from '../types';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

const SkillIcon = ({ icon, className }: { icon?: string, className?: string }) => {
  if (!icon) return null;

  const isUrl = icon.startsWith('http') || icon.startsWith('/');
  
  if (isUrl) {
    return (
      <img 
        src={icon || null} 
        alt="Skill Icon" 
        className={cn("w-5 h-5 object-contain", className)} 
        referrerPolicy="no-referrer"
      />
    );
  }

  // Try to find a Lucide icon
  const IconComponent = (LucideIcons as any)[icon];
  if (IconComponent) {
    return <IconComponent size={20} className={className} />;
  }

  // Fallback to a default icon if it's just a string that doesn't match
  return <LucideIcons.Globe size={20} className={className} />;
};

const ProjectCard = ({ project }: { project: Project }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div 
      layout
      className="group bg-[#F9FAFB] dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all flex flex-col h-fit"
    >
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="aspect-video overflow-hidden relative cursor-pointer"
      >
        <img 
          src={project.image || null} 
          alt={project.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
          referrerPolicy="no-referrer" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
          <span className="text-white font-bold text-sm flex items-center gap-2">
            <Info size={16} /> {isExpanded ? 'Click to show less' : 'Click to see more details'}
          </span>
        </div>
      </div>
      <div className="p-8 flex-1 flex flex-col">
        <h3 className="text-2xl font-bold mb-3 dark:text-white transition-colors">{project.title}</h3>
        
        <p className={cn(
          "text-slate-500 dark:text-slate-400 mb-6 leading-relaxed transition-all duration-300",
          !isExpanded && "line-clamp-2"
        )}>
          {project.description}
        </p>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pb-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Technologies</h4>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map(tag => (
                    <span key={tag} className="text-[10px] font-bold uppercase tracking-wider text-[#8B5CF6] bg-purple-50 dark:bg-purple-900/20 px-2.5 py-1.5 rounded-lg border border-purple-100/50 dark:border-purple-800/50">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-100 dark:border-slate-800/50">
          <div className="flex gap-4">
            <motion.a whileHover={{ y: -2 }} href={project.github} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#8B5CF6] transition-colors"><Github size={22} /></motion.a>
            <motion.a whileHover={{ y: -2 }} href={project.link} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#8B5CF6] transition-colors"><ExternalLink size={22} /></motion.a>
          </div>
          
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-[#8B5CF6] font-black uppercase tracking-widest text-[10px] bg-purple-50 dark:bg-purple-900/20 px-5 py-2.5 rounded-xl border border-purple-100/50 dark:border-purple-800/50 hover:bg-[#8B5CF6] hover:text-white transition-all shadow-sm active:scale-95"
          >
            {isExpanded ? 'Less' : 'Details'}
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default function Portfolio() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, skillsRes, profileRes] = await Promise.all([
          axios.get('/api/projects'),
          axios.get('/api/skills'),
          axios.get('/api/profile').catch(() => ({ data: null }))
        ]);
        setProjects(projectsRes.data);
        setSkills(skillsRes.data);
        if (profileRes.data && profileRes.data.name) {
          setProfile(profileRes.data);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post('/api/messages', contactForm);
      toast.success('Message sent successfully! I will get back to you soon.');
      setSubmitStatus('success');
      setContactForm({ name: '', email: '', message: '' });
    } catch (err) {
      toast.error('Failed to send message. Please try again later.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus('idle'), 3000);
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!profile && projects.length === 0 && skills.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Welcome to Your Portfolio</h1>
        <p className="text-slate-400 mb-8">It looks like you haven't set up your content yet.</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex min-h-screen font-sans transition-colors duration-300",
      theme === 'dark' ? "bg-slate-950 text-slate-50" : "bg-[#f5f5f5] text-slate-900"
    )}>
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-14 md:w-20 bg-[#8B5CF6] dark:bg-purple-900 flex flex-col items-center py-6 md:py-8 z-50 transition-all duration-300 shadow-xl">
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ 
            scale: 1.1, 
            rotate: 10,
            boxShadow: "0px 0px 20px rgba(139, 92, 246, 0.5)"
          }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-10 h-10 md:w-14 md:h-14 bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl flex items-center justify-center mb-12 md:mb-16 shadow-xl cursor-pointer border border-purple-100 dark:border-purple-900/30"
        >
          <span className="text-[#8B5CF6] text-xl md:text-3xl font-black tracking-tighter">
            {profile?.name ? profile.name.charAt(0).toUpperCase() : 'P'}
          </span>
        </motion.div>
        
        <nav className="flex flex-col gap-6 md:gap-8 text-white/70">
          <button onClick={() => scrollToSection('home')} className="hover:text-white transition-colors cursor-pointer"><Home size={20} className="md:w-6 md:h-6" /></button>
          <button onClick={() => scrollToSection('about')} className="hover:text-white transition-colors cursor-pointer"><User size={20} className="md:w-6 md:h-6" /></button>
          <button onClick={() => scrollToSection('skills')} className="hover:text-white transition-colors cursor-pointer"><Code2 size={20} className="md:w-6 md:h-6" /></button>
          <button onClick={() => scrollToSection('projects')} className="hover:text-white transition-colors cursor-pointer"><Briefcase size={20} className="md:w-6 md:h-6" /></button>
          <button onClick={() => scrollToSection('contact')} className="hover:text-white transition-colors cursor-pointer"><Phone size={20} className="md:w-6 md:h-6" /></button>
        </nav>

        <div className="mt-auto flex flex-col items-center gap-6">
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
          >
            {theme === 'light' ? <Moon size={18} className="md:w-5 md:h-5" /> : <Sun size={18} className="md:w-5 md:h-5" />}
          </button>
          <div className="text-white/70 hidden md:block">
            <ChevronDown size={24} className="animate-bounce" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 ml-14 md:ml-20 transition-all duration-300",
        theme === 'dark' ? "bg-slate-950" : "bg-[#f5f5f5]"
      )}>
        {/* Hero Section */}
        <section id="home" className="min-h-screen flex items-center justify-center px-6 md:px-20 py-16">
          <div className="max-w-6xl w-full flex flex-col md:flex-row items-center gap-12 md:gap-16">
            {/* Profile Image */}
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-3xl -z-10 translate-x-4 translate-y-4" />
              <div className="w-64 h-64 md:w-96 md:h-96 rounded-full overflow-hidden border-8 border-white dark:border-slate-800 shadow-2xl relative transition-all group">
                <img 
                  src={profile?.image || null} 
                  alt={profile?.name || "User"} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 rounded-full border-[12px] border-purple-500/10 pointer-events-none" />
              </div>
            </div>

            {/* Hero Text */}
            <div className="flex-1 text-center md:text-left">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                {profile?.name && (
                  <>
                    <p className="text-sm font-bold tracking-[0.2em] text-slate-800 dark:text-slate-400 mb-4 uppercase">Hi there! I'm</p>
                    <motion.h1 
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tighter uppercase"
                    >
                      <span className="text-[#8B5CF6] inline-block hover:scale-105 transition-transform cursor-default">
                        {profile.name.split(' ')[0]}
                      </span> 
                      <br className="md:hidden" />
                      <span className="text-slate-900 dark:text-white transition-colors inline-block hover:scale-105 transition-transform cursor-default ml-0 md:ml-4">
                        {profile.name.split(' ').slice(1).join(' ')}
                      </span>
                    </motion.h1>
                  </>
                )}
                <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-xl mb-10 leading-relaxed font-medium transition-colors">
                  {profile?.title && <>A <span className="text-[#8B5CF6] font-bold">{profile.title}</span> </>}
                  {profile?.bio}
                </p>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-12 md:mb-0">
                  <motion.button 
                    whileHover={{ scale: 1.05, boxShadow: "0px 0px 25px rgba(139, 92, 246, 0.5)" }}
                    whileTap={{ scale: 0.95 }}
                    animate={{ 
                      boxShadow: ["0px 0px 0px rgba(139, 92, 246, 0)", "0px 0px 20px rgba(139, 92, 246, 0.4)", "0px 0px 0px rgba(139, 92, 246, 0)"]
                    }}
                    transition={{ 
                      boxShadow: { repeat: Infinity, duration: 2, ease: "easeInOut" }
                    }}
                    onClick={() => scrollToSection('contact')}
                    className="px-12 py-4 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white font-black uppercase tracking-widest text-sm rounded-full transition-all shadow-xl shadow-purple-500/20"
                  >
                    Let's Talk
                  </motion.button>
                  <div className="flex flex-wrap gap-3">
                    {profile.linkedin && (
                      <motion.a 
                        whileHover={{ y: -3, scale: 1.1 }} 
                        href={profile.linkedin} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-[#8B5CF6] hover:border-[#8B5CF6] transition-all shadow-md"
                        title="LinkedIn"
                      >
                        <Linkedin size={22} />
                      </motion.a>
                    )}
                    {profile.github && (
                      <motion.a 
                        whileHover={{ y: -3, scale: 1.1 }} 
                        href={profile.github} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-[#8B5CF6] hover:border-[#8B5CF6] transition-all shadow-md"
                        title="GitHub"
                      >
                        <Github size={22} />
                      </motion.a>
                    )}
                    {profile.facebook && (
                      <motion.a 
                        whileHover={{ y: -3, scale: 1.1 }} 
                        href={profile.facebook} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-[#8B5CF6] hover:border-[#8B5CF6] transition-all shadow-md"
                        title="Facebook"
                      >
                        <Facebook size={22} />
                      </motion.a>
                    )}
                    {profile.instagram && (
                      <motion.a 
                        whileHover={{ y: -3, scale: 1.1 }} 
                        href={profile.instagram} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-[#8B5CF6] hover:border-[#8B5CF6] transition-all shadow-md"
                        title="Instagram"
                      >
                        <Instagram size={22} />
                      </motion.a>
                    )}
                    {profile.twitter && (
                      <motion.a 
                        whileHover={{ y: -3, scale: 1.1 }} 
                        href={profile.twitter} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-[#8B5CF6] hover:border-[#8B5CF6] transition-all shadow-md"
                        title="Twitter"
                      >
                        <Twitter size={22} />
                      </motion.a>
                    )}
                    {profile.whatsapp && (
                      <motion.a 
                        whileHover={{ y: -3, scale: 1.1 }} 
                        href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-[#8B5CF6] hover:border-[#8B5CF6] transition-all shadow-md"
                        title="WhatsApp"
                      >
                        <MessageCircle size={22} />
                      </motion.a>
                    )}
                    {profile.email && (
                      <motion.a 
                        whileHover={{ y: -3, scale: 1.1 }} 
                        href={`mailto:${profile.email}`} 
                        className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-[#8B5CF6] hover:border-[#8B5CF6] transition-all shadow-md"
                        title="Email"
                      >
                        <Mail size={22} />
                      </motion.a>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-24 px-8 md:px-20 pt-12 bg-[#eeeeee] dark:bg-slate-900/40 transition-colors">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl font-bold mb-8">About Me</h2>
                <div className="space-y-6 text-slate-600 dark:text-slate-400 text-lg leading-relaxed whitespace-pre-wrap">
                  <p>
                    {profile?.aboutText}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mt-10">
                  <div className="p-4 bg-[#F9FAFB] dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 transition-colors">
                    <Award className="text-[#8B5CF6] mb-2" size={24} />
                    <h4 className="font-bold text-slate-900 dark:text-white">Experience</h4>
                    <p className="text-sm text-slate-500">{profile?.experienceYears}</p>
                  </div>
                  <div className="p-4 bg-[#F9FAFB] dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 transition-colors">
                    <Coffee className="text-[#8B5CF6] mb-2" size={24} />
                    <h4 className="font-bold text-slate-900 dark:text-white">Projects</h4>
                    <p className="text-sm text-slate-500">{profile?.projectsCompleted}</p>
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4 pt-8">
                  {profile?.aboutImage1 && <img src={profile.aboutImage1 || null} className="rounded-3xl shadow-lg border-2 border-white dark:border-slate-800" referrerPolicy="no-referrer" />}
                  <div className="bg-[#8B5CF6] p-6 rounded-3xl text-white shadow-xl">
                    <Globe size={32} className="mb-4" />
                    <p className="font-bold text-xl uppercase tracking-wider">Global Reach</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-slate-900 dark:bg-slate-900/40 p-6 rounded-3xl text-white shadow-xl">
                    <h3 className="text-4xl font-bold mb-2">{profile?.clientSatisfaction}</h3>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Satisfaction Rate</p>
                  </div>
                  {profile?.aboutImage2 && <img src={profile.aboutImage2 || null} className="rounded-3xl shadow-lg border-2 border-white dark:border-slate-800" referrerPolicy="no-referrer" />}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Skills Section */}
        <section id="skills" className="py-24 px-8 md:px-20 pt-12 bg-[#f5f5f5] dark:bg-slate-950/40 transition-colors">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center md:text-left">Technical Arsenal</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { title: 'Frontend', icon: <Layout className="text-blue-500" />, items: skills.filter(s => s.category === 'Frontend') },
                { title: 'Backend', icon: <Terminal className="text-green-500" />, items: skills.filter(s => s.category === 'Backend') },
                { title: 'Database', icon: <Database className="text-purple-500" />, items: skills.filter(s => s.category === 'Database') },
                { title: 'Tools', icon: <Cpu className="text-orange-500" />, items: skills.filter(s => s.category === 'Tools') }
              ].map((cat, idx) => (
                <div key={idx} className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all">
                  <div className="mb-6">{cat.icon}</div>
                  <h3 className="text-xl font-bold mb-4">{cat.title}</h3>
                  <div className="flex flex-wrap gap-3">
                    {cat.items.map(skill => (
                      <span 
                        key={skill.id} 
                        className="group relative flex items-center gap-3 px-5 py-3 bg-[#F9FAFB] dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-slate-600 dark:text-slate-300 font-bold hover:border-purple-500/50 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm hover:shadow-md"
                      >
                        <SkillIcon icon={skill.icon} className="text-slate-400 group-hover:text-purple-500 transition-colors" />
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Projects Section */}
        <section id="projects" className="py-24 px-8 md:px-20 pt-12 bg-[#eeeeee] dark:bg-slate-900/40 transition-colors">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <h2 className="text-3xl font-bold mb-2">Featured Work</h2>
                <div className="w-20 h-1.5 bg-[#8B5CF6] rounded-full" />
              </div>
              <p className="text-slate-500 text-sm max-w-xs">A selection of my most recent and representative projects.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {projects.map(project => (
                <div key={project.id}>
                  <ProjectCard project={project} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-24 px-8 md:px-20 pt-12 bg-[#f5f5f5] dark:bg-slate-950/40 transition-colors">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Get In Touch</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-12 max-w-xl mx-auto transition-colors">
              I'm currently looking for new opportunities. Whether you have a question or just want to say hi, I'll try my best to get back to you!
            </p>
            <form onSubmit={handleContactSubmit} className="space-y-6 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input 
                  type="text" 
                  placeholder="Name" 
                  required
                  value={contactForm.name}
                  onChange={e => setContactForm({...contactForm, name: e.target.value})}
                  className="w-full px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-[#8B5CF6] transition-all dark:text-white"
                />
                <input 
                  type="email" 
                  placeholder="Email" 
                  required
                  value={contactForm.email}
                  onChange={e => setContactForm({...contactForm, email: e.target.value})}
                  className="w-full px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-[#8B5CF6] transition-all dark:text-white"
                />
              </div>
              <textarea 
                placeholder="Message" 
                rows={6} 
                required
                value={contactForm.message}
                onChange={e => setContactForm({...contactForm, message: e.target.value})}
                className="w-full px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-[#8B5CF6] transition-all resize-none dark:text-white"
              />
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-5 bg-[#8B5CF6] text-white font-bold rounded-2xl hover:bg-[#7C3AED] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
              >
                {isSubmitting ? 'Sending...' : submitStatus === 'success' ? 'Message Sent!' : 'Send Message'}
              </button>
            </form>
          </div>
        </section>

        <footer className="py-12 text-center text-slate-400 text-sm border-t border-slate-100 dark:border-slate-800 transition-colors">
          <p>© {new Date().getFullYear()} {profile?.name}. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}

