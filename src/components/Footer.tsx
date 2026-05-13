import { Link } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

export default function Footer() {
  const isMobileApp = Capacitor.isNativePlatform();

  if (isMobileApp) return null;

  return (
    <footer className="bg-slate-900 text-slate-400 py-10 mt-auto relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800/50 via-slate-900 to-slate-900 pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-4 md:px-8 text-center space-y-6 relative z-10">
        <p className="text-sm font-medium text-slate-500 max-w-md mx-auto">
          المنصة الأولى محلياً للإعلانات والتجارة. صمم بحب لتسهيل التبادل التجاري في أمان وسرعة.
        </p>
        <div className="flex flex-wrap justify-center gap-6 text-sm font-semibold">
          <Link to="/" className="hover:text-amber-400 transition-colors">الرئيسية</Link>
          <Link to="/about" className="hover:text-amber-400 transition-colors">تفصيل الموقع</Link>
          <a href="#" className="hover:text-amber-400 transition-colors">الشروط والأحكام</a>
          <a href="#" className="hover:text-amber-400 transition-colors">تواصل معنا</a>
        </div>
        <div className="flex justify-center gap-4 pt-4">
           <button 
             onClick={() => {
                // We'll use a direct link if known or just inform
                window.open('http://ainelhadjelstore.kesug.com/app.apk', '_blank');
             }}
             className="bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2 rounded-xl flex items-center gap-2 transition-all group"
           >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor"><path d="M17.523 15.3414L18.6309 17.2604C18.7291 17.4304 18.6707 17.6477 18.5007 17.7459C18.3307 17.8441 18.1134 17.7857 18.0152 17.6157L16.8924 15.671C15.5396 16.2081 14.1165 16.5 12 16.5C9.8835 16.5 8.4604 16.2081 7.1076 15.671L5.9848 17.6157C5.8866 17.7857 5.6693 17.8441 5.4993 17.7459C5.3293 17.6477 5.2709 17.4304 5.3691 17.2604L6.477 15.3414C3.8055 13.882 2 11.2312 2 8.16667H22C22 11.2312 20.1945 13.882 17.523 15.3414ZM8 12C8.55228 12 9 11.5523 9 11C9 10.4477 8.55228 10 8 10C7.44772 10 7 10.4477 7 11C7 11.5523 7.44772 12 8 12ZM16 12C16.5523 12 17 11.5523 17 11C17 10.4477 16.5523 10 16 10C15.4477 10 15 10.4477 15 11C15 11.5523 15.4477 12 16 12Z"/></svg>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">تحميل مباشر</p>
                <p className="text-sm text-white font-black">APK للأندرويد</p>
              </div>
           </button>
        </div>
        <div className="pt-6 border-t border-slate-800 flex flex-col md:flex-row justify-center items-center gap-2">
          <p className="text-sm font-bold text-slate-300">جميع الحقوق محفوظة لصالح الموقع &copy; 2026</p>
        </div>
      </div>
    </footer>
  );
}
