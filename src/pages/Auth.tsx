import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, UserPlus, LogIn, ArrowRight } from 'lucide-react';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';
import BackButton from '../components/BackButton';

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { emailLogin, emailRegister } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await emailLogin(email, password);
      } else {
        await emailRegister(email, password, name);
      }
      Swal.fire({
        title: 'نجاح',
        text: mode === 'login' ? 'تم تسجيل الدخول بنجاح' : 'تم إنشاء الحساب بنجاح',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      navigate('/');
    } catch (error: any) {
      Swal.fire('خطأ', error.message || 'حدث خطأ ما', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative" dir="rtl">
      <div className="absolute top-6 right-6">
        <BackButton />
      </div>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-2xl shadow-primary/5 border border-slate-100 dark:border-slate-800"
      >
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="text-2xl font-black text-blue-600 dark:text-white mb-6">
             Ain El Hadjel <span className="text-primary ml-1">STORE</span>
          </Link>
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
             {mode === 'login' ? <LogIn size={32} /> : <UserPlus size={32} />}
          </div>
          <h2 className="text-2xl font-black">
            {mode === 'login' ? 'تجسل الدخول' : 'إنشاء حساب جديد'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">
            {mode === 'login' ? 'أهلاً بك مجدداً في متجرنا' : 'انضم إلينا اليوم وابدأ البيع والشراء'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 px-1">الاسم الكامل</label>
              <div className="relative">
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl pr-10 outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="محمد علي..."
                />
                <User className="absolute right-3 top-3.5 text-slate-400" size={18} />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 px-1">البريد الإلكتروني</label>
            <div className="relative">
              <input 
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl pr-10 outline-none focus:ring-2 focus:ring-primary/20 text-left"
                dir="ltr"
                placeholder="email@example.com"
              />
              <Mail className="absolute right-3 top-3.5 text-slate-400" size={18} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 px-1">كلمة المرور</label>
            <div className="relative">
              <input 
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl pr-10 outline-none focus:ring-2 focus:ring-primary/20 text-left"
                dir="ltr"
                placeholder="••••••••"
              />
              <Lock className="absolute right-3 top-3.5 text-slate-400" size={18} />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-primary text-white rounded-xl font-black text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'جاري التحميل...' : (mode === 'login' ? 'دخول' : 'إنشاء الحساب')}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">
                {mode === 'login' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
                <button 
                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                    className="text-primary font-black ml-2 hover:underline"
                >
                    {mode === 'login' ? 'سجل الآن' : 'سجل دخولك'}
                </button>
            </p>
        </div>

        <Link to="/" className="block mt-6 text-center text-slate-400 text-sm hover:text-primary transition-colors flex items-center justify-center gap-1">
            <span>تصفح كزائر</span>
            <ArrowRight size={14} />
        </Link>
      </motion.div>
    </div>
  );
}
