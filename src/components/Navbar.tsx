import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Swal from 'sweetalert2';
import { 
    Search, Menu, X, Bell, Moon, Sun, 
    MessageCircle, User, LogOut, ShieldCheck, Home as HomeIcon,
    ChevronLeft, Download
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar({ onSearch }: { onSearch?: (val: string) => void }) {
  const { user, logout, isAdmin } = useAuth();
  const { isDark, setTheme, theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [appLink, setAppLink] = useState("");
  const [appLogoUrl, setAppLogoUrl] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "global_settings", "app"), (snap) => {
      if (snap.exists()) {
          setAppLink(snap.data().downloadLink || "");
          setAppLogoUrl(snap.data().appLogoUrl || "");
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user) {
      const unsub = onSnapshot(collection(db, 'notifications'), (snap) => {
        const all: any[] = [];
        snap.forEach(d => all.push({ id: d.id, ...d.data() }));
        const data = all.filter(n => n.user === user.email)
                         .sort((a, b) => (b.date || 0) - (a.date || 0))
                         .slice(0, 10);
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.read).length);
      });
      return () => unsub();
    }
  }, [user]);

  const navLinks = [
    { title: 'الرئيسية', path: '/', icon: <HomeIcon size={20} /> },
    { title: 'الدردشة', path: '/chat', icon: <MessageCircle size={20} /> },
    { title: 'حسابي', path: '/profile', icon: <User size={20} /> },
  ];

  return (
    <nav className="sticky top-0 z-[100] glass border-b shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          {appLogoUrl ? (
            <img src={appLogoUrl} alt="Logo" className="h-10 sm:h-12 w-auto object-contain" />
          ) : (
            <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-white flex items-center">
              Ain El Hadjel <span className="text-primary ml-1">STORE</span>
            </span>
          )}
        </Link>

        {/* Search Bar - Desktop */}
        <div className="hidden md:flex flex-1 max-w-xl relative group mx-4">
          <input 
            onChange={(e) => onSearch?.(e.target.value)}
            placeholder="ابحث عن سيارات، عقارات، هواتف..."
            className="w-full bg-slate-100 dark:bg-slate-800 border-none h-11 px-6 rounded-2xl outline-none transition-all text-sm text-right"
            dir="rtl"
          />
          <Search className="absolute left-4 top-3 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
            
            <button 
                onClick={() => {
                    if (appLink) window.open(appLink, '_blank');
                    else Swal.fire('تنبيه', 'رابط التحميل غير متوفر حالياً', 'info');
                }}
                className="hidden sm:flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-all"
            >
                <Download size={18} />
                <span>تحميل التطبيق</span>
            </button>

            {user && isAdmin && (
                <Link to="/admin" className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 hover:scale-105 transition-all">
                    <ShieldCheck size={18} />
                    <span>الإدارة</span>
                </Link>
            )}

            {user && (
                <div className="relative">
                  <button 
                      onClick={() => setIsNotifOpen(!isNotifOpen)}
                      className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors text-slate-600 dark:text-slate-300 relative"
                  >
                      <Bell size={20} />
                      {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">{unreadCount}</span>}
                  </button>

                  <AnimatePresence>
                    {isNotifOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute left-0 mt-2 w-[320px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden"
                          dir="rtl"
                        >
                          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="font-black text-slate-900 dark:text-white">الإشعارات</h3>
                            <button onClick={() => setIsNotifOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                          </div>
                          <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length > 0 ? (
                              notifications.map((n) => (
                                <div key={n.id} className={`p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}>
                                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{n.text}</p>
                                  <span className="text-[10px] text-slate-400 mt-1 block">
                                    {new Date(n.date).toLocaleString('ar-EG')}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="p-8 text-center text-slate-400">
                                <Bell size={32} className="mx-auto mb-2 opacity-20" />
                                <p className="text-sm">لا توجد إشعارات حالياً</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
            )}

            {!user ? (
                <Link 
                    to="/login" 
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors text-slate-600 dark:text-slate-300 font-bold text-sm"
                >
                    <User size={18} />
                    <span>دخول</span>
                </Link>
            ) : (
                <div className="flex items-center gap-2">
                    <Link 
                        to="/profile"
                        className="w-10 h-10 rounded-xl overflow-hidden border-2 border-transparent hover:border-primary transition-all shadow-sm"
                    >
                        <img 
                          src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}`} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                    </Link>
                    <button 
                        onClick={() => logout()}
                        className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-rose-100 hover:text-rose-600 transition-colors text-slate-600 dark:text-slate-300"
                        title="تسجيل الخروج"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            )}
            
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
            >
                {isMenuOpen ? <X /> : <Menu />}
            </button>
        </div>

      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="lg:hidden bg-card border-t overflow-hidden"
          >
            <div className="p-4 space-y-2">
                <div className="flex flex-1 relative mb-4">
                    <Search className="absolute right-3 top-3 text-muted-foreground" size={18} />
                    <input 
                        onChange={(e) => onSearch?.(e.target.value)}
                        placeholder="ابحث هنا..."
                        className="w-full bg-muted h-11 px-10 rounded-xl outline-none"
                    />
                </div>
                {navLinks.map((link) => (
                    <Link 
                        key={link.path}
                        to={link.path}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${location.pathname === link.path ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-accent text-muted-foreground'}`}
                    >
                        {link.icon}
                        {link.title}
                    </Link>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function Sparkles(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
  );
}
