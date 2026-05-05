import { Link, useNavigate } from "react-router-dom";
import { Search, UserCircle, LogOut, ShieldCheck, Bell, Trash2, Settings } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useAd } from "../context/AdContext";
import { auth, db } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { signOut } from "firebase/auth";
import { useState, useEffect } from "react";
import { useNotificationStore } from "../store/useNotificationStore";
import { useAuthModal } from "../hooks/useAuthModal";

const MySwal = withReactContent(Swal);

interface NavbarProps {
  onSearch?: (term: string) => void;
}

export default function Navbar({ onSearch }: NavbarProps) {
  const { user, isAdmin } = useAuth();
  const { withAd } = useAd();
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const { openAuthModal } = useAuthModal();

  const { init, notifications, unreadCount, loading: loadingNotifs, prefs, markAllAsRead, clearNotifications, updatePrefs } = useNotificationStore();

  useEffect(() => {
    const t = setTimeout(() => {
      if (onSearch) onSearch(localSearch);
    }, 500); 
    return () => clearTimeout(t);
  }, [localSearch, onSearch]);

  useEffect(() => {
    if (user && user.email) {
      const unsub = init(user.email);
      return unsub;
    }
  }, [user, init]);

  const handlePrefs = async () => {
      setShowNotifications(false);
      const { value: form } = await Swal.fire({
        title: 'إعدادات الإشعارات',
        html: `
          <div class="flex flex-col gap-3 text-right" dir="rtl">
            <label class="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer">
              <input type="checkbox" id="pref-admin" ${prefs.admin !== false ? 'checked' : ''} class="w-5 h-5 accent-accent" />
              <span class="font-bold text-slate-700">إشعارات الحساب (حالة الـ VIP، مراجعة البلاغات)</span>
            </label>
            <label class="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer">
              <input type="checkbox" id="pref-comments" ${prefs.comments !== false ? 'checked' : ''} class="w-5 h-5 accent-accent" />
              <span class="font-bold text-slate-700">التفاعل (تعليقات وردود على إعلاناتك)</span>
            </label>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'حفظ التغييرات',
        cancelButtonText: 'إلغاء',
        confirmButtonColor: '#10b981',
        preConfirm: () => {
          return {
            admin: (document.getElementById('pref-admin') as HTMLInputElement).checked,
            comments: (document.getElementById('pref-comments') as HTMLInputElement).checked
          }
        }
      });
  
      if (form && user && user.email) {
        updatePrefs(form, user.email);
        await setDoc(doc(db, "user_prefs", user.email), form, { merge: true });
        Swal.fire('تم الحفظ', 'تم تحديث إعدادات الإشعارات بنجاح', 'success');
      }
  };

  const handleAuth = () => {
      openAuthModal();
  };

  return (
    <nav className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.05)] border-b border-white/20 px-4 md:px-8 py-3 flex flex-wrap lg:flex-nowrap justify-between items-center gap-4 transition-all duration-300">
      <Link to="/" className="flex items-center gap-3 no-underline group order-1">
        <h1 className="font-display font-black text-xl md:text-2xl text-primary m-0 tracking-tight transition-transform group-hover:scale-105">
          Aïn El Hadjel <span className="text-accent bg-accent/10 px-2 py-0.5 rounded-lg ml-1">Store</span>
        </h1>
      </Link>

      <div className="w-full lg:flex-1 lg:max-w-2xl order-3 lg:order-2 relative">
        {onSearch ? (
          <>
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="ابحث عن سيارات، عقارات، هواتف..." 
              className="w-full pl-4 pr-11 py-3.5 bg-slate-100/50 hover:bg-slate-100 border-2 border-transparent rounded-2xl focus:bg-white focus:border-accent focus:outline-none transition-all duration-300 focus:shadow-[0_0_0_4px_rgba(255,102,0,0.1)] text-slate-800 font-medium placeholder:text-slate-400"
            />
          </>
        ) : (
          <div className="hidden lg:block w-full"></div>
        )}
      </div>

      <div className="flex items-center gap-3 order-2 lg:order-3">
        {user ? (
          <>
            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) markAllAsRead();
                }}
                className="relative p-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-slate-100 rounded-full"></span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute top-12 left-0 sm:right-0 sm:left-auto w-80 bg-white shadow-2xl rounded-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        الإشعارات
                        <button onClick={handlePrefs} className="text-slate-400 hover:text-accent transition" title="إعدادات الإشعارات">
                            <Settings className="w-4 h-4" />
                        </button>
                    </h3>
                    {notifications.length > 0 && (
                      <button onClick={clearNotifications} className="text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-50 px-2 py-1 rounded">مسح الكل</button>
                    )}
                  </div>
                  {loadingNotifs && (
                    <div className="w-full h-1 bg-slate-100 overflow-hidden relative">
                      <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-accent animate-[pulse_1s_ease-in-out_infinite] rounded"></div>
                    </div>
                  )}
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-6 text-center text-slate-500 text-sm font-medium">لا توجد إشعارات حالياً</p>
                    ) : (
                      notifications.map((n: any) => (
                        <div key={n.id} className={`p-4 border-b last:border-0 border-slate-50 ${!n.read ? 'bg-accent/5' : 'bg-white'}`}>
                          <h4 className={`text-sm mb-1 ${!n.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>{n.title}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">{n.body}</p>
                          <span className="text-[10px] text-slate-400 mt-2 block" dir="ltr">{new Date(n.date).toLocaleDateString('ar-DZ')}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {isAdmin && (
              <button 
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 bg-amber-400 text-slate-900 px-4 py-2 rounded-lg font-bold hover:bg-amber-500 transition"
              >
                <ShieldCheck className="w-5 h-5" />
                <span className="hidden sm:inline">الإدارة</span>
              </button>
            )}
            <button 
              onClick={() => signOut(auth)}
              className="flex items-center justify-center bg-slate-100 text-slate-800 p-2.5 rounded-lg hover:bg-slate-200 transition"
              title="تسجيل الخروج"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </>
        ) : (
          <button 
            onClick={() => withAd(() => handleAuth())}
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg font-bold hover:bg-slate-800 transition shadow-md shadow-primary/20"
          >
            <UserCircle className="w-5 h-5" />
            <span>دخول</span>
          </button>
        )}
      </div>
    </nav>
  );
}
