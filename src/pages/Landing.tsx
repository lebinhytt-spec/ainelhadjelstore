import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Download, Smartphone, Globe, Package, Zap, Shield, Sparkles, ChevronLeft, Code2, Calendar, CheckCircle2, Star, Users, Briefcase, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Landing() {
  const [appLink, setAppLink] = useState("");
  const [githubRepo, setGithubRepo] = useState("google/gson");
  const [githubReleases, setGithubReleases] = useState<any[]>([]);
  const [loadingReleases, setLoadingReleases] = useState(true);
  const [appLogoUrl, setAppLogoUrl] = useState("");
  
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "global_settings", "app"), (snap) => {
      if (snap.exists()) {
          const data = snap.data();
          const repo = data.githubRepo || "lebinhytt-spec/ainelhadjelstore";
          setGithubRepo(repo);
          setAppLogoUrl(data.appLogoUrl || "");
          fetchReleases(repo);
      }
    });

    const fetchReleases = async (repo: string) => {
        try {
            const res = await fetch(`https://api.github.com/repos/${repo}/releases`); 
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                setGithubReleases(data.slice(0, 3));
                
                // Automatically find the APK in the latest release
                const latest = data[0];
                const apkAsset = latest.assets?.find((asset: any) => asset.name.endsWith('.apk'));
                if (apkAsset) {
                    setAppLink(apkAsset.browser_download_url);
                } else {
                    setAppLink(latest.html_url);
                }
            }
        } catch (e) {
            console.error("Failed to fetch releases", e);
        } finally {
            setLoadingReleases(false);
        }
    };

    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden" dir="rtl">
      {/* فيديو الخلفية - سيظهر بمجرد وضع ملف bg-video.mp4 في مجلد public */}
      <div className="absolute top-0 left-0 w-full h-[100vh] overflow-hidden z-0">
         <video 
            autoPlay 
            muted 
            loop 
            playsInline
            className="w-full h-full object-cover opacity-30 dark:opacity-40 scale-105"
         >
            <source src="/bg-video.mp4" type="video/mp4" />
         </video>
         <div className="absolute inset-0 bg-gradient-to-b from-slate-50/10 via-slate-50/60 to-slate-50 dark:from-slate-950/10 dark:via-slate-950/60 dark:to-slate-950" />
      </div>

      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none opacity-30 dark:opacity-20 z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800">
         <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <Link to="/" className="text-2xl sm:text-3xl font-black tracking-tighter flex items-center gap-2">
                {appLogoUrl ? (
                    <img src={appLogoUrl} alt="Logo" className="h-10 sm:h-12 w-auto object-contain" />
                ) : (
                    <>
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/25">
                            <ShoppingBag size={24} />
                        </div>
                        <span>عين الحجل <span className="text-primary italic">STORE</span></span>
                    </>
                )}
            </Link>
            <div className="hidden md:flex items-center gap-8 font-bold text-sm">
                <a href="#features" className="hover:text-primary transition-colors">المميزات</a>
                <a href="#github" className="hover:text-primary transition-colors">الإصدارات</a>
                <a href="#faq" className="hover:text-primary transition-colors">الأسئلة الشائعة</a>
            </div>
            <Link to="/login" className="bg-primary text-white px-8 py-3 rounded-2xl font-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 text-sm">
                ابدأ رحلتك الآن
            </Link>
         </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8 relative z-10"
            >
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-indigo-500/10 text-primary px-5 py-2.5 rounded-full font-black text-sm border border-primary/10"
                >
                    <Sparkles size={18} className="animate-spin-slow" />
                    <span>أكبر تجمع تجاري في المسيلة</span>
                </motion.div>
                <h1 className="text-6xl lg:text-8xl font-black leading-[1.1] tracking-tight">
                    بيتك، سيارتك، <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary to-indigo-500">بضغطة زر</span>
                </h1>
                <p className="text-xl text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-xl">
                    انضم لأكثر من ١٠,٠٠٠ مستخدم نشط في سوق عين الحجل. بع، اشترِ، وتواصل مباشرة مع أهلك وجيرانك في بيئة آمنة وسريعة.
                </p>
                <div className="flex flex-wrap gap-4 pt-6">
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => appLink && window.open(appLink)}
                        className="flex items-center gap-4 bg-slate-950 dark:bg-white text-white dark:text-slate-900 px-10 py-5 rounded-[24px] font-black text-xl transition-all shadow-2xl shadow-slate-900/40"
                    >
                        <div className="bg-primary p-2 rounded-xl text-white">
                            <Smartphone size={28} />
                        </div>
                        <div className="text-right">
                            <div className="text-xs opacity-70 font-bold uppercase tracking-wider">تحميل التطبيق</div>
                            <div>Android APK</div>
                        </div>
                    </motion.button>
                    <Link to="/login" className="flex items-center gap-3 border-2 border-slate-200 dark:border-slate-800 px-10 py-5 rounded-[24px] font-black text-xl transition-all hover:bg-slate-100 dark:hover:bg-slate-900 hover:border-transparent">
                        <Globe size={28} className="text-primary" />
                        <span>نسخة المتصفح</span>
                    </Link>
                </div>
                
                <div className="flex items-center gap-6 pt-8">
                    <div className="flex -space-x-4 space-x-reverse">
                        {[1,2,3,4].map(i => (
                            <img key={i} src={`https://i.pravatar.cc/100?img=${i+10}`} className="w-12 h-12 rounded-full border-4 border-white dark:border-slate-950 object-cover shadow-sm" />
                        ))}
                        <div className="w-12 h-12 rounded-full border-4 border-white dark:border-slate-950 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black">+4k</div>
                    </div>
                    <div className="text-sm font-bold text-slate-500">
                        <span className="text-slate-900 dark:text-white block">ثقة مضمونة</span>
                        آلاف التعاملات اليومية الناجحة
                    </div>
                </div>
            </motion.div>
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative"
            >
                <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full scale-125 animate-pulse"></div>
                <div className="relative z-10 glass rounded-[60px] p-4 border-8 border-white/50 dark:border-slate-800/50 shadow-3xl">
                    <img 
                        src="https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&q=80&w=1000" 
                        alt="App Preview" 
                        className="rounded-[40px] shadow-2xl"
                    />
                    <div className="absolute -bottom-10 -right-10 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl border dark:border-slate-800 flex items-center gap-4 animate-bounce-slow">
                         <div className="w-12 h-12 bg-green-500/10 text-green-600 rounded-2xl flex items-center justify-center">
                             <CheckCircle2 size={28} />
                         </div>
                         <div>
                             <div className="font-black text-lg">تم بيع المنتج!</div>
                             <div className="text-sm text-slate-500 font-bold">منذ دقيقتين</div>
                         </div>
                    </div>
                </div>
            </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
                { label: 'مستخدم نشط', val: '+10,000', color: 'text-blue-500' },
                { label: 'إعلان يومي', val: '+500', color: 'text-emerald-500' },
                { label: 'تقييم إيجابي', val: '4.9/5', color: 'text-amber-500' },
                { label: 'عملية بيع', val: '+25,000', color: 'text-rose-500' },
            ].map((stat, i) => (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="text-center"
                >
                    <div className={`text-4xl lg:text-6xl font-black mb-2 ${stat.color}`}>{stat.val}</div>
                    <div className="text-slate-500 font-black text-sm uppercase tracking-widest">{stat.label}</div>
                </motion.div>
            ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
                <h2 className="text-4xl lg:text-6xl font-black tracking-tight">واجهة ذكية، <span className="text-primary">تجربة خرافية</span></h2>
                <p className="text-xl text-slate-500 font-medium leading-relaxed">لقد قمنا ببناء كل زاوية في التطبيق لتكون الأسرع والأكثر أماناً في المنطقة.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
                {[
                    { 
                        icon: <Zap className="text-amber-500" />, 
                        title: 'أداء صاروخي', 
                        desc: 'تكنولوجيا متطورة تضمن لك تصفح آلاف الصور والفيديوهات دون أي تأخير.',
                        bg: 'bg-amber-500/10'
                    },
                    { 
                        icon: <Shield className="text-primary" />, 
                        title: 'توثيق الحسابات', 
                        desc: 'نظام توثيق يدوي (Blue Badge) يضمن لك التعامل مع أشخاص حقيقيين فقط.',
                        bg: 'bg-primary/10'
                    },
                    { 
                        icon: <Package className="text-emerald-500" />, 
                        title: 'إدارة متكاملة', 
                        desc: 'لوحة تحكم خاصة بك لإدارة إعلاناتك، متابعة الإحصائيات، والدردشة مع المشترين.',
                        bg: 'bg-emerald-500/10'
                    },
                ].map((f, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="group bg-white dark:bg-slate-900 p-10 rounded-[48px] border border-slate-100 dark:border-slate-800 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500"
                    >
                        <div className={`w-20 h-20 ${f.bg} rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                            {f.icon}
                        </div>
                        <h3 className="text-2xl font-black mb-6">{f.title}</h3>
                        <p className="text-slate-500 dark:text-slate-400 font-medium leading-[1.8] text-lg">{f.desc}</p>
                    </motion.div>
                ))}
            </div>
        </div>
      </section>

      {/* GitHub Releases Section */}
      <section id="github" className="py-32 px-6 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
            <Code2 className="w-full h-full scale-150 rotate-12" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-20">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full font-bold text-sm">
                        <Code2 size={20} />
                        <span>مستودع الأكواد المفتوح</span>
                    </div>
                    <h2 className="text-4xl lg:text-6xl font-black">سجل التطوير <br/><span className="text-primary italic">والإصدارات</span></h2>
                </div>
                <p className="text-slate-400 max-w-md font-medium text-lg">نحن نطور التطبيق باستمرار. يمكنك هنا متابعة أحدث الإصدارات وتحميلها مباشرة من GitHub.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {loadingReleases ? (
                    [1,2,3].map(i => <div key={i} className="h-64 bg-white/5 rounded-3xl animate-pulse" />)
                ) : (
                    githubReleases.map((release, i) => (
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={release.id} 
                            className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[40px] hover:bg-white/10 transition-colors group"
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex items-center gap-2">
                                    <div className="bg-primary px-4 py-1.5 rounded-xl font-black text-sm">v{release.tag_name}</div>
                                    {i === 0 && (new Date(release.published_at).getTime() > new Date().getTime() - (7 * 24 * 60 * 60 * 1000)) && (
                                        <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">تحديث جديد!</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-slate-400 text-sm font-bold">
                                    <Calendar size={16} />
                                    {new Date(release.published_at).toLocaleDateString('ar-EG')}
                                </div>
                            </div>
                            <h4 className="text-2xl font-black mb-4 group-hover:text-primary transition-colors">{release.name || 'إصدار جديد'}</h4>
                            <div className="text-slate-400 text-sm font-medium mb-8 overflow-hidden h-20 line-clamp-3">
                                {release.body ? release.body.split('\n')[0] : 'هذا الإصدار يتضمن تحسينات عامة على أداء التطبيق.'}
                            </div>
                            <button 
                                onClick={() => window.open(release.html_url)}
                                className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-white transition-all shadow-xl"
                            >
                                <Download size={20} />
                                تحميل الإصدار
                            </button>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-slate-100 dark:border-slate-800 text-center relative overflow-hidden">
         <div className="max-w-7xl mx-auto px-6 space-y-12">
            <div className="text-2xl sm:text-4xl font-black tracking-tighter">
                عين الحجل <span className="text-primary italic">STORE</span>
            </div>
            <div className="flex flex-wrap justify-center gap-8 font-black text-slate-400 text-sm uppercase tracking-widest">
                <a href="#" className="hover:text-primary">الرئيسية</a>
                <a href="#" className="hover:text-primary">الشروط</a>
                <a href="#" className="hover:text-primary">الخصوصية</a>
                <a href="#" className="hover:text-primary">اتصل بنا</a>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent w-full" />
            <p className="text-slate-400 font-bold flex items-center justify-center gap-2">
                تم التطوير بكل ❤️ من أجل عين الحجل
                <span className="text-xs opacity-50 font-mono">v1.2.0</span>
            </p>
         </div>
      </footer>
    </div>
  );
}
