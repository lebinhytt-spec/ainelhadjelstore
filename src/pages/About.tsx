import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BackButton from "../components/BackButton";
import { Sparkles, Shield, Zap, HeartHandshake } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-accent/20" dir="rtl">
      <Navbar />
      
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-12">
        <div className="flex justify-end mb-8">
            <BackButton />
        </div>
        
        <div className="text-center space-y-6 mb-16 animate-in slide-in-from-bottom-8 duration-700">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight">
                عن <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-amber-500">متجر عين الحجل</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
                وجهتك الرقمية الأولى في المدينة. نحن نعيد صياغة مفهوم التسوق المحلي من خلال تكنولوجيا متطورة وتجربة مستخدم لا مثيل لها.
            </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 bg-rose-100 text-rose-500 rounded-2xl flex items-center justify-center mb-6">
                    <HeartHandshake className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">رؤيتنا</h2>
                <p className="text-slate-600 leading-relaxed font-medium">
                    نسعى لبناء مجتمع تجاري مترابط داخل المدينة، يجد فيه كل فرد ما يبحث عنه بسهولة، ويستطيع فيه كل بائع الوصول لعملائه المستهدفين بأقل مجهود وبأعلى كفاءة.
                </p>
            </div>
            
            <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 bg-amber-100 text-amber-500 rounded-2xl flex items-center justify-center mb-6">
                    <Sparkles className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">لماذا نحن؟</h2>
                <p className="text-slate-600 leading-relaxed font-medium">
                    لأننا نقدم تجربة محلية بهوية عالمية. وضعنا كل الاهتمام في التفاصيل لضمان راحتك وسهولة تصفحك، مستخدمين أحدث التقنيات وأسرعها.
                </p>
            </div>
        </div>

        <div className="bg-slate-900 rounded-[40px] p-8 md:p-12 text-white text-center relative overflow-hidden flex flex-col items-center">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent pointer-events-none"></div>
            <div className="relative z-10 space-y-8 max-w-3xl">
                <h2 className="text-3xl md:text-4xl font-black mb-6">تكنولوجيا توفر وقتك</h2>
                <div className="grid sm:grid-cols-2 gap-6 text-right" dir="rtl">
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                        <Zap className="w-8 h-8 text-amber-400 shrink-0" />
                        <div>
                            <h3 className="font-bold text-xl mb-2 text-white">سرعة البرق</h3>
                            <p className="text-slate-400 text-sm">صفحات محملة مسبقاً وصور محسّنة لضمان عدم ضياع أي ثانية من وقتك.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                        <Shield className="w-8 h-8 text-emerald-400 shrink-0" />
                        <div>
                            <h3 className="font-bold text-xl mb-2 text-white">بيئة آمنة</h3>
                            <p className="text-slate-400 text-sm">نظام تسجيل دخول موثوق من جوجل وإدارة حازمة للمحتوى لضمان جودة المنصة.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
