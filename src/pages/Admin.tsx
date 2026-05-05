import { useEffect, useState, ChangeEvent } from "react";
import { collection, onSnapshot, orderBy, query, doc, deleteDoc, updateDoc, addDoc, where, collectionGroup, getDoc, setDoc } from "firebase/firestore";
import { db, storage } from "../lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import { ArrowRight, PlusCircle, Trash2, CheckCircle, XCircle, Crown, Database, MonitorPlay, AlertTriangle, Settings } from "lucide-react";

export default function Admin() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [ads, setAds] = useState<any[]>([]);
  const [vipRequests, setVipRequests] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, loading, navigate]);

  const [users, setUsers] = useState<any[]>([]);
  const [activeMenu, setActiveMenu] = useState<'dashboard'|'ads'|'vip'|'reports'|'products'|'appSettings'>('dashboard');
  const [appLink, setAppLink] = useState('');
  const [uploadingApk, setUploadingApk] = useState(false);
  const [apkProgress, setApkProgress] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;

    const unsubSettings = onSnapshot(doc(db, "global_settings", "app"), (docSnap) => {
      if (docSnap.exists()) {
        setAppLink(docSnap.data().downloadLink || '');
      }
    });

    const unsubAds = onSnapshot(query(collection(db, "global_ads"), orderBy("date", "desc")), (snap) => {
      const data: any[] = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setAds(data);
    });

    const unsubVip = onSnapshot(query(collection(db, "vip_requests"), where("status", "==", "pending")), (snap) => {
      const data: any[] = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setVipRequests(data);
    });

    const unsubProds = onSnapshot(query(collection(db, "products"), orderBy("date", "desc")), (snap) => {
      const data: any[] = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setProducts(data);
    });

    const unsubReports = onSnapshot(query(collectionGroup(db, "reports")), (snap) => {
      const data: any[] = [];
      snap.forEach(d => {
        // extract product id from ref path: products/PROD_ID/reports/REP_ID
        const pathSegments = d.ref.path.split('/');
        const productId = pathSegments.length > 2 ? pathSegments[pathSegments.length - 3] : '';
        data.push({ id: d.id, productId, ...d.data() });
      });
      data.sort((a, b) => b.date - a.date);
      setReports(data);
    });

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      const data: any[] = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setUsers(data);
    });

    return () => {
      unsubSettings();
      unsubAds();
      unsubVip();
      unsubProds();
      unsubReports();
      unsubUsers();
    };
  }, [isAdmin]);

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          <p className="font-bold text-slate-400">جاري التحميل...</p>
      </div>
    );
  }

  const handleCreateAd = async () => {
    const { value: form } = await Swal.fire({
      title: 'إضافة إعلان جديد',
      html: `
        <div class="flex flex-col gap-3">
            <select id="ad-pos" class="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-accent text-right" dir="rtl">
                <option value="popup">إعلان منبثق (Popup Splash) 🚀</option>
                <option value="top">أعلى الصفحة</option>
                <option value="in_feed">وسط المنتجات</option>
                <option value="bottom">أسفل الصفحة</option>
            </select>
            <textarea id="ad-code" class="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-accent text-left min-h-[150px] font-mono text-sm" placeholder="<script>...</script>" dir="ltr"></textarea>
            <input id="ad-note" class="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-accent text-right" placeholder="اسم الإعلان (مثال: بنر 1)">
        </div>
      `,
      confirmButtonText: 'حفظ الإعلان',
      showCancelButton: true,
      cancelButtonText: 'إلغاء',
      preConfirm: () => ({ 
          pos: (document.getElementById('ad-pos') as HTMLSelectElement).value, 
          code: (document.getElementById('ad-code') as HTMLTextAreaElement).value, 
          note: (document.getElementById('ad-note') as HTMLInputElement).value || 'إعلان' 
      })
    });

    if (form && form.code) {
      await addDoc(collection(db, "global_ads"), {
          position: form.pos,
          code: form.code,
          note: form.note,
          date: new Date().getTime()
      });
      Swal.fire('نجاح', 'تمت إضافة الإعلان بنجاح', 'success');
    }
  };

  const handleApproveVIP = async (productId: string, requestId: string, reqUser: string) => {
    const { value: days } = await Swal.fire({ 
        title: 'مدة التثبيت (أيام)', 
        input: 'number', 
        inputValue: 7,
        confirmButtonText: 'تفعيل',
        showCancelButton: true,
        cancelButtonText: 'إلغاء'
    });
    
    if (days) {
        const exp = new Date().getTime() + (Number(days) * 24 * 60 * 60 * 1000);
        await updateDoc(doc(db, "products", productId), { featuredUntil: exp });
        await updateDoc(doc(db, "vip_requests", requestId), { status: "approved" });
        await addDoc(collection(db, "notifications"), {
            user: reqUser,
            title: "تم تفعيل حساب VIP",
            body: "تم الموافقة على طلبك بنجاح.",
            date: new Date().getTime(),
            read: false
        });
        Swal.fire('تم', 'تم تفعيل الـ VIP للمنتج', 'success');
    }
  };

  const handleRejectVIP = async (requestId: string, reqUser: string) => {
      await updateDoc(doc(db, "vip_requests", requestId), { status: "rejected" });
      await addDoc(collection(db, "notifications"), {
          user: reqUser,
          title: "معذرة، تمت مراجعة طلبك",
          body: "لم يتم الموافقة على طلب الـ VIP الخاص بك.",
          date: new Date().getTime(),
          read: false
      });
  };

  const handleResolveReport = async (productId: string, reportId: string, action: 'delete_product' | 'dismiss', userToNotify: string) => {
    if (action === 'delete_product') {
        const confirmed = await Swal.fire({ title: 'حذف المنتج المخالف؟', icon: 'warning', showCancelButton: true });
        if (confirmed.isConfirmed) {
            await deleteDoc(doc(db, "products", productId));
            Swal.fire('تم', 'تم حذف المنتج من المنصة', 'success');
            // Notify reporter
            await addDoc(collection(db, "notifications"), {
                user: userToNotify,
                title: "تمت مراجعة بلاغك",
                body: "تم تأكيد البلاغ وتم حذف المنتج المخالف. شكراً لمساهمتك معنا.",
                date: new Date().getTime(),
                read: false
            });
        }
    } else {
        await deleteDoc(doc(db, `products/${productId}/reports/${reportId}`));
        Swal.fire('تم', 'تم تجاهل البلاغ والمحافظة على المنتج', 'info');
        await addDoc(collection(db, "notifications"), {
            user: userToNotify,
            title: "تمت مراجعة بلاغك",
            body: "قمنا بمراجعة البلاغ ووجدنا أن المنتج لا يخالف شروطنا. شكراً لاهتمامك.",
            date: new Date().getTime(),
            read: false
        });
    }
  };

  const handleDeleteItem = async (col: string, id: string) => {
      const result = await Swal.fire({
          title: 'هل أنت متأكد؟',
          text: "لن تتمكن من استعادة هذا العنصر!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#ef4444',
          cancelButtonColor: '#64748b',
          confirmButtonText: 'نعم، احذفه!',
          cancelButtonText: 'إلغاء'
      });
      if (result.isConfirmed) {
          await deleteDoc(doc(db, col, id));
          Swal.fire('تم الحذف!', 'تم حذف العنصر بنجاح.', 'success');
      }
  };

  const handleSaveAppSetting = async () => {
    try {
      await setDoc(doc(db, "global_settings", "app"), { downloadLink: appLink }, { merge: true });
      Swal.fire('نجاح', 'تم حفظ رابط التطبيق بنجاح', 'success');
    } catch (error) {
      console.error(error);
      Swal.fire('خطأ', 'حدث خطأ أثناء حفظ الإعدادات', 'error');
    }
  };

  const handleApkUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.apk')) {
        Swal.fire('صيغة غير مدعومة', 'الرجاء رفع ملف بصيغة APK', 'error');
        return;
    }

    const storageRef = ref(storage, `app_builds/app_${Date.now()}.apk`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploadingApk(true);
    setApkProgress(0);

    uploadTask.on(
        "state_changed",
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setApkProgress(progress);
        },
        (error) => {
            console.error(error);
            Swal.fire('خطأ', 'فشل في رفع الملف', 'error');
            setUploadingApk(false);
        },
        async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setAppLink(downloadURL);
            setUploadingApk(false);
            Swal.fire('نجاح', 'تم رفع التطبيق بنجاح. لا تنسى الضغط على "حفظ الرابط".', 'success');
        }
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col md:flex-row" dir="rtl">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-800 border-b md:border-b-0 md:border-l border-slate-700 flex flex-col sticky top-0 md:h-screen z-50 shadow-xl">
        <div className="p-6 border-b border-slate-700">
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <MonitorPlay className="text-accent" />
                Admin <span className="text-accent">Panel</span>
            </h1>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible">
            <button 
                onClick={() => setActiveMenu('dashboard')}
                className={`flex-none md:w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeMenu === 'dashboard' ? 'bg-gradient-to-r from-accent to-orange-500 text-white shadow-lg shadow-accent/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
                <MonitorPlay className="w-5 h-5" /> لوحة القيادة
            </button>
            <button 
                onClick={() => setActiveMenu('ads')}
                className={`flex-none md:w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeMenu === 'ads' ? 'bg-slate-700 border border-slate-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
                <MonitorPlay className="w-5 h-5" /> الإعلانات
            </button>
            <button 
                onClick={() => setActiveMenu('vip')}
                className={`flex-none md:w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeMenu === 'vip' ? 'bg-amber-500 border border-amber-400 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
                <div className="flex items-center gap-3"><Crown className="w-5 h-5" /> طلبات VIP</div>
                {vipRequests.length > 0 && <span className="bg-slate-900 text-amber-400 text-xs px-2 py-0.5 rounded-full">{vipRequests.length}</span>}
            </button>
            <button 
                onClick={() => setActiveMenu('reports')}
                className={`flex-none md:w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeMenu === 'reports' ? 'bg-rose-500 border border-rose-400 text-white shadow-lg shadow-rose-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
                <div className="flex items-center gap-3"><AlertTriangle className="w-5 h-5" /> البلاغات</div>
                {reports.length > 0 && <span className="bg-white text-rose-500 text-xs px-2 py-0.5 rounded-full">{reports.length}</span>}
            </button>
            <button 
                onClick={() => setActiveMenu('products')}
                className={`flex-none md:w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeMenu === 'products' ? 'bg-emerald-500 border border-emerald-400 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
                <Database className="w-5 h-5" /> إحصائيات المنتجات
            </button>
            <button 
                onClick={() => setActiveMenu('appSettings')}
                className={`flex-none md:w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeMenu === 'appSettings' ? 'bg-blue-600 border border-blue-500 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
                <Settings className="w-5 h-5" /> إعدادات التطبيق
            </button>
        </div>
        <div className="p-4 border-t border-slate-700 mt-auto hidden md:block">
            <Link to="/" className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-3 rounded-lg font-bold transition text-white">
                <ArrowRight className="w-4 h-4" /> العودة للمتجر
            </Link>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto space-y-10 pb-20">
        
        {/* Dashboard Overview */}
        {activeMenu === 'dashboard' && (
        <section className="animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-3xl font-black flex items-center gap-2 text-white mb-8">
                <MonitorPlay className="w-8 h-8 text-accent" /> لوحة القيادة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex items-center gap-5">
                    <div className="bg-accent/10 p-4 rounded-xl text-accent"><Database className="w-8 h-8" /></div>
                    <div>
                        <h3 className="text-slate-400 font-bold mb-1">إجمالي المنتجات</h3>
                        <p className="text-3xl font-black text-white">{products.length}</p>
                    </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex items-center gap-5">
                    <div className="bg-blue-500/10 p-4 rounded-xl text-blue-500"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg></div>
                    <div>
                        <h3 className="text-slate-400 font-bold mb-1">المستخدمين المسجلين</h3>
                        <p className="text-3xl font-black text-white">{users.length}</p>
                    </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex items-center gap-5">
                    <div className="bg-amber-500/10 p-4 rounded-xl text-amber-500"><Crown className="w-8 h-8" /></div>
                    <div>
                        <h3 className="text-slate-400 font-bold mb-1">طلبات VIP جديدة</h3>
                        <p className="text-3xl font-black text-white">{vipRequests.length}</p>
                    </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex items-center gap-5">
                    <div className="bg-rose-500/10 p-4 rounded-xl text-rose-500"><AlertTriangle className="w-8 h-8" /></div>
                    <div>
                        <h3 className="text-slate-400 font-bold mb-1">بلاغات معلقة</h3>
                        <p className="text-3xl font-black text-white">{reports.length}</p>
                    </div>
                </div>
            </div>
            
            <div className="mt-10 grid gap-6 lg:grid-cols-2">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-4 border-b border-slate-700 pb-3">أحدث المنتجات</h3>
                    <div className="space-y-4">
                        {products.slice(0, 5).map(p => (
                            <div key={p.id} className="flex gap-4 items-center">
                                <img src={(p.images && p.images.length > 0) ? p.images[0] : (p.img || 'https://via.placeholder.com/100')} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-200 line-clamp-1">{p.title}</h4>
                                    <p className="text-sm text-slate-500">{p.price} دج</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-4 border-b border-slate-700 pb-3">أحدث الأعضاء</h3>
                    <div className="space-y-4">
                        {users.sort((a,b) => (b.registrationDate || 0) - (a.registrationDate || 0)).slice(0, 5).map(u => (
                            <div key={u.id} className="flex gap-4 items-center">
                                <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-xl font-bold text-accent uppercase">
                                    {u.name ? u.name[0] : u.id[0]}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <h4 className="font-bold text-slate-200 line-clamp-1">{u.name || 'بدون اسم'}</h4>
                                    <p className="text-sm text-slate-500 truncate">{u.id}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
        )}

        {/* Ads Manager */}
        {activeMenu === 'ads' && (
        <section className="bg-slate-800 p-6 rounded-[20px] border border-accent/30 shadow-lg shadow-accent/5 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-accent">
                        <MonitorPlay className="w-6 h-6" /> إدارة الإعلانات
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">أضف أي عدد من الإعلانات، سيتم توزيعها تلقائياً.</p>
                </div>
                <button onClick={handleCreateAd} className="bg-accent text-white px-5 py-2.5 rounded-xl font-bold hover:bg-orange-600 transition flex items-center gap-2 shadow-lg shadow-accent/20">
                    <PlusCircle className="w-5 h-5" />
                    إضافة إعلان
                </button>
            </div>
            
            <div className="grid gap-4">
                {ads.length === 0 ? <p className="text-slate-500 text-center py-4">لا توجد إعلانات مسجلة.</p> : null}
                {ads.map(ad => (
                    <div key={ad.id} className="bg-slate-700/50 p-4 rounded-xl flex justify-between items-center border border-slate-600">
                        <div>
                            <strong className="text-amber-400 text-lg block">{ad.note}</strong>
                            <span className="text-slate-400 text-sm bg-slate-800 px-2 py-1 rounded-md mt-1 inline-block">المكان: {ad.position === 'top' ? 'أعلىال صفحة' : ad.position === 'bottom' ? 'أسفل الصفحة' : 'وسط المنتجات'}</span>
                        </div>
                        <button onClick={() => handleDeleteItem('global_ads', ad.id)} className="p-3 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500 hover:text-white transition">
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                ))}
            </div>
        </section>
        )}

        {/* VIP Requests */}
        {activeMenu === 'vip' && (
        <section className="animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-amber-400 mb-6">
                <Crown className="w-6 h-6" /> طلبات الترقية (VIP) المعلقة
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {vipRequests.length === 0 ? <p className="text-slate-500 col-span-full">لا توجد طلبات معلقة.</p> : null}
                {vipRequests.map(req => (
                    <div key={req.id} className="bg-slate-800 p-5 rounded-[15px] border-r-4 border-amber-400 border-y border-l border-slate-700 shadow-md">
                        <p className="text-slate-300 mb-1">المستخدم:</p>
                        <p className="font-bold text-white truncate" title={req.user}>{req.user}</p>
                        
                        <p className="text-slate-300 mt-3 mb-1">الهاتف:</p>
                        <p className="font-bold text-emerald-400 text-xl tracking-wider">{req.phone}</p>

                        <div className="flex gap-2 mt-5">
                            <button onClick={() => handleApproveVIP(req.productId, req.id, req.user)} className="flex-1 bg-emerald-500 text-white py-2 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-emerald-600 transition">
                                <CheckCircle className="w-4 h-4" /> تفعيل
                            </button>
                            <button onClick={() => handleRejectVIP(req.id, req.user)} className="flex-none bg-slate-700 text-slate-300 px-4 rounded-lg font-bold hover:bg-rose-500 hover:text-white transition flex items-center justify-center">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
        )}

        {/* Reports */}
        {activeMenu === 'reports' && (
        <section className="animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-rose-500 mb-6">
                <AlertTriangle className="w-6 h-6" /> المنتجات المبلغ عنها
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {reports.length === 0 ? <p className="text-slate-500 col-span-full">لا توجد بلاغات.</p> : null}
                {reports.map(rep => (
                    <div key={rep.id} className="bg-slate-800 p-5 rounded-[15px] border-r-4 border-rose-500 border-y border-l border-slate-700 shadow-md">
                        <p className="text-slate-300 mb-1">صاحب البلاغ:</p>
                        <p className="font-bold text-white truncate" title={rep.user}>{rep.user}</p>
                        
                        <p className="text-slate-300 mt-3 mb-1">تفاصيل البلاغ:</p>
                        <p className="font-bold text-rose-400 mb-1">{rep.type || 'بلاغ عام'}</p>
                        <p className="font-medium text-slate-100 bg-slate-900/50 p-2 rounded-lg text-sm">{rep.reason}</p>

                        <div className="flex gap-2 mt-5">
                            <button onClick={() => handleResolveReport(rep.productId, rep.id, 'delete_product', rep.user)} className="flex-1 bg-rose-500 text-white py-2 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-rose-600 transition">
                                <Trash2 className="w-4 h-4" /> حذف المنتج
                            </button>
                            <button onClick={() => handleResolveReport(rep.productId, rep.id, 'dismiss', rep.user)} className="flex-none bg-slate-700 text-slate-300 px-4 rounded-lg font-bold hover:bg-slate-600 transition flex items-center justify-center" title="تجاهل البلاغ">
                                تجاهل
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
        )}

        {/* God Mode - All Products */}
        {activeMenu === 'products' && (
        <section className="animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-emerald-500 mb-6">
                <Database className="w-6 h-6" /> جميع المنتجات (وضع المدير)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {products.length === 0 ? <p className="text-slate-500 col-span-full">لا توجد منتجات بالموقع.</p> : null}
                {products.map(p => (
                    <div key={p.id} className="bg-slate-800 rounded-xl overflow-hidden border border-emerald-500/30 flex flex-col group relative">
                        <img src={(p.images && p.images.length > 0) ? p.images[0] : (p.img || 'https://via.placeholder.com/200')} className="w-full h-32 object-cover opacity-80 group-hover:opacity-100 transition" alt="prod" />
                        <div className="p-3 flex-1 flex flex-col">
                            <h3 className="font-bold text-sm text-white line-clamp-1 mb-1">{p.title}</h3>
                            <p className="text-xs text-slate-400 truncate flex-1">{p.user}</p>
                            <button onClick={() => handleDeleteItem('products', p.id)} className="w-full mt-3 bg-emerald-500 text-white text-xs py-2 rounded-md font-bold flex justify-center items-center gap-1 hover:bg-emerald-600 transition">
                                <Trash2 className="w-3 h-3" /> حذف نهائي
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
        )}

        {/* App Settings */}
        {activeMenu === 'appSettings' && (
        <section className="bg-slate-800 p-6 rounded-[20px] border border-blue-500/30 shadow-lg shadow-blue-500/5 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-blue-500">
                        <Settings className="w-6 h-6" /> إعدادات التطبيق
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">تحديث رابط تحميل التطبيق للأندرويد.</p>
                </div>
            </div>
            
            <div className="grid gap-4 max-w-2xl">
                <div className="bg-slate-700/50 p-6 rounded-xl border border-slate-600">
                    <label className="block text-slate-300 font-bold mb-3">رابط تحميل التطبيق (APK)</label>
                    <input 
                        type="url" 
                        value={appLink}
                        onChange={(e) => setAppLink(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-slate-900 border border-slate-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 transition text-left mb-4"
                        dir="ltr"
                    />
                    
                    <div className="border-t border-slate-600 pt-4 mt-2">
                        <label className="block text-slate-300 font-bold mb-3">أو قم برفع ملف التطبيق مباشرة</label>
                        <input 
                            type="file" 
                            accept=".apk"
                            onChange={handleApkUpload}
                            disabled={uploadingApk}
                            className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition"
                        />
                        {uploadingApk && (
                            <div className="mt-4">
                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>جاري الرفع...</span>
                                    <span>{Math.round(apkProgress)}%</span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${apkProgress}%` }}></div>
                                </div>
                            </div>
                        )}
                    </div>

                    <p className="text-xs text-slate-400 mt-6">اترك الحقل فارغاً إذا كنت لا تريد إظهار زر تحميل التطبيق في الموقع.</p>
                    
                    <div className="mt-4">
                        <button 
                            onClick={handleSaveAppSetting} 
                            disabled={uploadingApk}
                            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition w-full sm:w-auto disabled:opacity-50"
                        >
                            حفظ الرابط
                        </button>
                    </div>
                </div>
            </div>
        </section>
        )}

      </main>
    </div>
  );
}
