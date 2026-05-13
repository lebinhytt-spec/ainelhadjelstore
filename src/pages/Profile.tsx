import React, { useState, useEffect } from 'react';
import { useAuth, ADMIN_EMAIL } from '../context/AuthContext';
import { db, storage } from '../lib/firebase';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useTheme } from '../context/ThemeContext';
import { User, ShieldCheck, Moon, Sun, Bell, LogOut, Camera, CheckCircle, ChevronLeft } from 'lucide-react';
import BackButton from '../components/BackButton';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';

export default function Profile() {
  const { user, logout, loading: authLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [storeLogo, setStoreLogo] = useState('');

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfileData(data);
            setDisplayName(data.displayName || '');
            setStoreLogo(data.storeLogo || data.photoURL || '');
          } else {
              // Initialize basic profile if not exists
              const initial = { 
                email: user.email, 
                displayName: user.displayName || '',
                photoURL: user.photoURL || '',
                isVerified: false, 
                notificationsEnabled: true,
                registrationDate: new Date().getTime() 
              };
              setProfileData(initial);
              setDisplayName(initial.displayName || '');
              setStoreLogo(initial.photoURL || '');
          }
        } catch (error) {
          console.error("Profile fetch error:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const saveProfile = async () => {
    if (!user) return;
    try {
        await setDoc(doc(db, 'users', user.uid), {
            displayName,
            storeLogo,
            photoURL: storeLogo || user.photoURL // fallback sync
        }, { merge: true });
        setProfileData({ ...profileData, displayName, storeLogo });
        setEditing(false);
        Swal.fire({ title: 'نجاح', text: 'تم تحديث بيانات المتجر بنجاح', icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    } catch (e) {
        Swal.fire('خطأ', 'تعذر حفظ التغييرات', 'error');
    }
  }

  const toggleNotifications = async () => {
    if (!user) return;
    const newVal = !profileData?.notificationsEnabled;
    setProfileData({ ...profileData, notificationsEnabled: newVal });
    await updateDoc(doc(db, 'users', user.uid), { notificationsEnabled: newVal });
    Swal.fire({ title: 'تم التحديث', text: newVal ? 'تم تفعيل التنبيهات' : 'تم تعطيل التنبيهات', icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
  };

  const requestVerification = async () => {
    if (profileData?.verificationStatus === 'pending') {
        Swal.fire('تنبيه', 'طلبك قيد المراجعة بالفعل', 'info');
        return;
    }

    const { isConfirmed } = await Swal.fire({
      title: 'طلب توثيق الحساب',
      text: 'هل ترغب في إرسال طلب لتوثيق حسابك بالشارة الزرقاء؟ سيقوم المدير بمراجعة حسابك ونشاطك وتوثيقه.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'إرسال الطلب',
      cancelButtonText: 'إلغاء'
    });

    if (isConfirmed) {
      setVerifying(true);
      try {
        await updateDoc(doc(db, 'users', user.uid), {
           verificationStatus: 'pending',
           verificationRequestedAt: new Date().getTime()
        });
        
        // Notify admin
        await addDoc(collection(db, 'reports'), {
            type: 'verification_request',
            userId: user.uid,
            userEmail: user.email,
            status: 'pending',
            createdAt: new Date().getTime()
        });

        setProfileData({ ...profileData, verificationStatus: 'pending' });
        Swal.fire('تم الإرسال', 'تم إرسال طلبك بنجاح للمدير للمراجعة', 'success');
      } catch (e) {
        Swal.fire('خطأ', 'فشل إرسال الطلب', 'error');
      } finally {
        setVerifying(false);
      }
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-20 text-center gap-4">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      <p className="text-muted-foreground animate-pulse font-medium">جاري المزامنة...</p>
    </div>
  );

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-8 my-20 text-center space-y-8 bg-card rounded-[32px] border shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto rotate-3 hover:rotate-0 transition-transform">
          <User size={48} className="text-primary" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">أهلاً بك في متجرنا</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">يرجى تسجيل الدخول للوصول إلى حسابك، إدارة إعلاناتك، والتواصل مع البائعين.</p>
        </div>
        <Link 
          to="/login"
          className="w-full flex items-center justify-center gap-3 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-lg"
        >
          <span>تسجيل الدخول / إنشاء حساب</span>
        </Link>
        <button 
          onClick={() => window.location.href = '/'}
          className="w-full py-4 text-slate-500 font-bold hover:text-primary transition-colors"
        >
          تصفح كزائر
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 py-8 space-y-8" dir="rtl">
      <div className="flex justify-between items-center bg-white dark:bg-slate-950 p-4 rounded-2xl border shadow-sm sticky top-0 z-50">
          <h2 className="text-xl font-bold">الملف الشخصي</h2>
          <BackButton />
      </div>
      <div className="text-center space-y-4">
        <div className="relative inline-block group">
          <div className="w-28 h-28 rounded-3xl bg-primary/10 flex items-center justify-center border-4 border-background shadow-xl overflow-hidden">
            {storeLogo ? (
                <img src={storeLogo} alt="p" className="w-full h-full object-cover" />
            ) : (
                <User size={56} className="text-primary" />
            )}
          </div>
          <button 
            onClick={() => setEditing(true)}
            className="absolute -bottom-2 -right-2 p-2.5 bg-primary text-primary-foreground rounded-xl shadow-lg hover:scale-110 transition-transform"
          >
            <Camera size={16} />
          </button>
        </div>
        
        {editing ? (
            <div className="space-y-4 max-w-sm mx-auto animate-in fade-in slide-in-from-top-4 duration-300">
                <input 
                    value={displayName} 
                    onChange={e => setDisplayName(e.target.value)} 
                    placeholder="اسم المتجر / البائع" 
                    className="w-full p-3 bg-white dark:bg-slate-900 border rounded-xl text-center font-bold"
                />
                <input 
                    value={storeLogo} 
                    onChange={e => setStoreLogo(e.target.value)} 
                    placeholder="رابط لوجو المتجر (URL)" 
                    className="w-full p-3 bg-white dark:bg-slate-900 border rounded-xl text-center text-xs"
                />
                <div className="flex gap-2">
                    <button onClick={saveProfile} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold">حفظ</button>
                    <button onClick={() => setEditing(false)} className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl font-bold">إلغاء</button>
                </div>
            </div>
        ) : (
            <div>
              <h1 className="text-3xl font-black flex items-center justify-center gap-2">
                {profileData?.displayName || user?.email?.split('@')[0]}
                {profileData?.isVerified && <ShieldCheck className="text-blue-500" fill="currentColor" />}
              </h1>
              <div className="flex flex-col items-center gap-1">
                <p className="text-muted-foreground font-medium">{user?.email}</p>
                {profileData?.registrationDate && (
                    <p className="text-xs text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full mt-1">
                        عضو منذ: {
                            profileData.registrationDate?.seconds 
                            ? new Date(profileData.registrationDate.seconds * 1000).toLocaleDateString('ar-EG')
                            : new Date(profileData.registrationDate).toLocaleDateString('ar-EG')
                        }
                    </p>
                )}
              </div>
            </div>
        )}
      </div>

      <div className="grid gap-4">
        <section className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
            <h2 className="font-bold flex items-center gap-2">
                <Bell size={18} />
                تنبيهات النظام
            </h2>
            <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                <span>تلقي إشعارات عند إضافة منتجات جديدة</span>
                <button 
                  onClick={toggleNotifications}
                  className={`w-12 h-6 rounded-full transition-colors relative ${profileData?.notificationsEnabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${profileData?.notificationsEnabled ? 'left-1' : 'left-7'}`} />
                </button>
            </div>
        </section>

        <section className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
            <h2 className="font-bold flex items-center gap-2">
                <Moon size={18} />
                المظهر العام
            </h2>
            <div className="grid grid-cols-3 gap-2">
                {['light', 'dark', 'system'].map((t) => (
                    <button
                        key={t}
                        onClick={() => setTheme(t as any)}
                        className={`py-2 px-3 rounded-xl border text-sm transition-all ${theme === t ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'}`}
                    >
                        {t === 'light' ? 'فاتح' : t === 'dark' ? 'داكن' : 'تلقائي'}
                    </button>
                ))}
            </div>
        </section>

        <section className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
            <h2 className="font-bold flex items-center gap-2">
                <ShieldCheck size={18} />
                توثيق الحساب
            </h2>
            {profileData?.isVerified ? (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center gap-3">
                    <CheckCircle />
                    <span>حسابك موثق بالشارة الزرقاء</span>
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">التوثيق يزيد من ثقة المشترين ويمنح إعلاناتك أولوية في الظهور.</p>
                    <button 
                        onClick={requestVerification}
                        disabled={profileData?.verificationStatus === 'pending'}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                    >
                        {profileData?.verificationStatus === 'pending' ? 'طلب التوثيق قيد المراجعة...' : 'طلب توثيق الحساب الآن'}
                    </button>
                </div>
            )}
        </section>

        <button 
            onClick={() => logout()}
            className="w-full py-4 text-destructive font-bold flex items-center justify-center gap-2 hover:bg-destructive/5 rounded-2xl transition-all"
        >
            <LogOut size={20} />
            تسجيل الخروج
        </button>
      </div>
    </div>
  );
}
