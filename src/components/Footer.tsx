import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-10 mt-auto relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800/50 via-slate-900 to-slate-900 pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-4 md:px-8 text-center space-y-6 relative z-10">
        <div className="flex justify-center items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-700 p-0.5">
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAMAAADDpiTIAAAAkFBMVEVHcEwOJTQTLD4NK0ELKT8QMkkeS2QnVnE0ZoIeSGEXP1gIITcJIzkMJz4QL0cRMkreWln8XFf8ZVzua2DUamiqWmB7TlldQ1E2PEsXNUsUOlMXP1gdRV4iTGUnU20sWXQxX3s1ZYI6boxAd5VFgJ9CTlNlZV2bdVy1lmKXi2a4gyrPjjT0fmTjmlHhsmnxxXWYlXY3AAAALHRSTlMABRYzU3CZy" alt="Logo" className="w-full h-full object-cover rounded-lg" />
          </div>
          <h2 className="text-xl font-bold text-white">متجر عين الحجل</h2>
        </div>
        <p className="text-sm font-medium text-slate-500 max-w-md mx-auto">
          المنصة الأولى محلياً للإعلانات والتجارة. صمم بحب لتسهيل التبادل التجاري في أمان وسرعة.
        </p>
        <div className="flex flex-wrap justify-center gap-6 text-sm font-semibold">
          <Link to="/" className="hover:text-amber-400 transition-colors">الرئيسية</Link>
          <Link to="/about" className="hover:text-amber-400 transition-colors">تفصيل الموقع</Link>
          <a href="#" className="hover:text-amber-400 transition-colors">الشروط والأحكام</a>
          <a href="#" className="hover:text-amber-400 transition-colors">تواصل معنا</a>
        </div>
        <div className="pt-6 border-t border-slate-800 flex flex-col md:flex-row justify-center items-center gap-2">
          <p className="text-sm font-bold text-slate-300">جميع الحقوق محفوظة لصالح الموقع &copy; 2026</p>
        </div>
      </div>
    </footer>
  );
}
