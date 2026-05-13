import { useEffect, useState, ChangeEvent } from "react";
import { collection, onSnapshot, orderBy, query, doc, deleteDoc, updateDoc, addDoc, where, collectionGroup, setDoc } from "firebase/firestore";
import { db, storage } from "../lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import { ArrowRight, PlusCircle, Trash2, CheckCircle, XCircle, Crown, Database, MonitorPlay, AlertTriangle, Settings, Download, ShieldCheck, Image as ImageIcon, ChevronRight, Smartphone } from "lucide-react";
import BackButton from "../components/BackButton";

export default function Admin() {
  const { isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  
  const [ads, setAds] = useState<any[]>([]);
  const [vipRequests, setVipRequests] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [carouselAds, setCarouselAds] = useState<any[]>([]);
  const [activeMenu, setActiveMenu] = useState<'dashboard'|'ads'|'carousel'|'vip'|'reports'|'products'|'appSettings'|'verifications'>('dashboard');
  
  const [appLink, setAppLink] = useState('');
  const [appVersionCode, setAppVersionCode] = useState<number>(1);
  const [forceUpdate, setForceUpdate] = useState<boolean>(false);
  const [releaseNotes, setReleaseNotes] = useState<string>('');
  const [uploadingApk, setUploadingApk] = useState(false);
  const [apkProgress, setApkProgress] = useState(0);
  const [downloadCount, setDownloadCount] = useState<number>(0);
  const [admobAppId, setAdmobAppId] = useState('');
  const [admobAdUnitId, setAdmobAdUnitId] = useState('');
  const [githubRepo, setGithubRepo] = useState('google/gson');
  const [appLogoUrl, setAppLogoUrl] = useState('');

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;

    const unsubStats = onSnapshot(doc(db, "global_settings", "stats"), (docSnap) => {
      if (docSnap.exists()) {
        setDownloadCount(docSnap.data().appDownloads || 0);
      }
    });

    const unsubSettings = onSnapshot(doc(db, "global_settings", "app"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAppLink(data.downloadLink || '');
        setAppVersionCode(data.versionCode || 1);
        setForceUpdate(data.forceUpdate || false);
        setReleaseNotes(data.releaseNotes || '');
        setAdmobAppId(data.admobAppId || '');
        setAdmobAdUnitId(data.admobAdUnitId || '');
        setGithubRepo(data.githubRepo || 'lebinhytt-spec/ainelhadjelstore');
        setAppLogoUrl(data.appLogoUrl || '');
      }
    });

    const unsubAds = onSnapshot(collection(db, "global_ads"), (snap) => {
      const data: any[] = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.date || 0) - (a.date || 0));
      setAds(data);
    });

    const unsubVip = onSnapshot(query(collection(db, "vip_requests"), where("status", "==", "pending")), (snap) => {
      const data: any[] = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.date || 0) - (a.date || 0));
      setVipRequests(data);
    });

    const unsubProds = onSnapshot(collection(db, "products"), (snap) => {
      const data: any[] = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.date || 0) - (a.date || 0));
      setProducts(data);
    });

    const unsubReports = onSnapshot(query(collectionGroup(db, "reports")), (snap) => {
      const data: any[] = [];
      snap.forEach(d => {
        const pathSegments = d.ref.path.split('/');
        const productId = pathSegments.length > 2 ? pathSegments[pathSegments.length - 3] : '';
        data.push({ id: d.id, productId, ...d.data() });
      });
      data.sort((a, b) => (b.date || 0) - (a.date || 0));
      setReports(data.filter(r => r.type !== 'verification_request'));
      setVerifications(data.filter(r => r.type === 'verification_request'));
    });

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      const data: any[] = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setUsers(data);
    });

    const unsubCarousel = onSnapshot(query(collection(db, "carousel_ads"), orderBy("order", "asc")), (snap) => {
      const data: any[] = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setCarouselAds(data);
    });

    return () => {
      unsubStats();
      unsubSettings();
      unsubAds();
      unsubVip();
      unsubProds();
      unsubReports();
      unsubUsers();
      unsubCarousel();
    };
  }, [isAdmin]);

  const handleVerifyUser = async (userId: string, requestId: string, status: 'approved' | 'rejected') => {
      try {
          await updateDoc(doc(db, 'users', userId), {
              isVerified: status === 'approved',
              verificationStatus: status
          });
          // Remove the request
          await deleteDoc(doc(db, "reports", requestId)); // In a real app, you'd archive it
          
          await addDoc(collection(db, "notifications"), {
              user: userId, // Assuming userId is the email or we need to look it up
              title: status === 'approved' ? "تم توثيق حسابك!" : "معذرة، رُفض طلب التوثيق",
              body: status === 'approved' ? "مبروك! حصلت على الشارة الزرقاء لزيادة الثقة." : "لم نستطع توثيق حسابك بناءً على المستندات المرفوعة.",
              date: new Date().getTime(),
              read: false
          });

          Swal.fire('تم', `تم ${status === 'approved' ? 'توثيق' : 'رفض'} المستخدم`, 'success');
      } catch (e) {
          Swal.fire('خطأ', 'فشل تحديث الحالة', 'error');
      }
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          <p className="font-bold text-slate-400">جاري التحميل...</p>
      </div>
    );
  }

  // ... (keeping other handlers same as they were in the original file)
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

  const handleApproveVIP = async (product: any, requestId: string, reqUser: string) => {
    const productId = product.id;
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

  const handleCreateCarouselAd = async () => {
    const { value: form } = await Swal.fire({
      title: 'إضافة إعلان سلايدر جديد',
      html: `
        <div class="flex flex-col gap-3 text-right" dir="rtl">
            <input id="cad-title" class="w-full p-3 border border-slate-300 rounded-lg" placeholder="عنوان الإعلان">
            <textarea id="cad-desc" class="w-full p-3 border border-slate-300 rounded-lg" placeholder="وصف قصير"></textarea>
            <input id="cad-img" class="w-full p-3 border border-slate-300 rounded-lg" placeholder="رابط الصورة (URL)">
            <input id="cad-link" class="w-full p-3 border border-slate-300 rounded-lg" placeholder="رابط التوجه (اختياري)">
            <input id="cad-order" type="number" class="w-full p-3 border border-slate-300 rounded-lg" placeholder="الترتيب (1, 2, 3...)">
        </div>
      `,
      confirmButtonText: 'حفظ الحين',
      showCancelButton: true,
      preConfirm: () => ({
        title: (document.getElementById('cad-title') as HTMLInputElement).value,
        description: (document.getElementById('cad-desc') as HTMLTextAreaElement).value,
        imageUrl: (document.getElementById('cad-img') as HTMLInputElement).value,
        link: (document.getElementById('cad-link') as HTMLInputElement).value,
        order: Number((document.getElementById('cad-order') as HTMLInputElement).value) || 0
      })
    });

    if (form && form.imageUrl && form.title) {
      await addDoc(collection(db, "carousel_ads"), form);
      Swal.fire('نجاح', 'تمت إضافة الإعلان للسلايدر', 'success');
    }
  };

  const handleResolveReport = async (productId: string, reportId: string, action: 'delete_product' | 'dismiss', userToNotify: string) => {
    if (action === 'delete_product') {
        const confirmed = await Swal.fire({ title: 'حذف المنتج المخالف؟', icon: 'warning', showCancelButton: true });
        if (confirmed.isConfirmed) {
            await deleteDoc(doc(db, "products", productId));
            Swal.fire('تم', 'تم حذف المنتج من المنصة', 'success');
            await addDoc(collection(db, "notifications"), {
                user: userToNotify,
                title: "تمت مراجعة بلاغك",
                body: "تم تأكيد البلاغ وتم حذف المنتج المخالف. شكراً لمساهمتك معنا.",
                date: new Date().getTime(),
                read: false
            });
        }
    } else {
        // deleteDoc(doc(db, `products/${productId}/reports/${reportId}`)); // Simplified for demo
        Swal.fire('تم', 'تم تجاهل البلاغ والمحافظة على المنتج', 'info');
    }
  };

  const handleDeleteItem = async (col: string, id: string) => {
      const result = await Swal.fire({
          title: 'هل أنت متأكد؟',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'نعم، احذفه!'
      });
      if (result.isConfirmed) {
          await deleteDoc(doc(db, col, id));
          Swal.fire('تم الحذف!', '', 'success');
      }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col md:flex-row" dir="rtl">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-800 border-b md:border-b-0 md:border-l border-slate-700 flex flex-col sticky top-0 md:h-screen z-50 shadow-xl">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <MonitorPlay className="text-accent" />
                Admin
            </h1>
            <BackButton className="md:hidden" />
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible">
            <button onClick={() => setActiveMenu('dashboard')} className={`flex-none md:w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeMenu === 'dashboard' ? 'bg-accent text-white' : 'text-slate-400 hover:text-white'}`}>لوحة القيادة</button>
            <button onClick={() => setActiveMenu('carousel')} className={`flex-none md:w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeMenu === 'carousel' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}>سلايدر الواجهة</button>
            <button onClick={() => setActiveMenu('ads')} className={`flex-none md:w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeMenu === 'ads' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>إعلانات (Code)</button>
            <button onClick={() => setActiveMenu('verifications')} className={`flex-none md:w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeMenu === 'verifications' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                <div className="flex items-center gap-2"><ShieldCheck size={18} /> التوثيق</div>
                {verifications.length > 0 && <span className="bg-white text-blue-600 text-xs px-2 py-0.5 rounded-full">{verifications.length}</span>}
            </button>
            <button onClick={() => setActiveMenu('vip')} className={`flex-none md:w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeMenu === 'vip' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white'}`}>
                 طلبات VIP {vipRequests.length > 0 && <span>({vipRequests.length})</span>}
            </button>
            <button onClick={() => setActiveMenu('reports')} className={`flex-none md:w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeMenu === 'reports' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'}`}>
                البلاغات {reports.length > 0 && <span>({reports.length})</span>}
            </button>
            <button onClick={() => setActiveMenu('products')} className={`flex-none md:w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeMenu === 'products' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'}`}>المنتجات</button>
            <button onClick={() => setActiveMenu('appSettings')} className={`flex-none md:w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeMenu === 'appSettings' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>الإعدادات</button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="hidden md:flex justify-end mb-6">
            <BackButton />
        </div>
        {activeMenu === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <h3 className="text-slate-400">إجمالي المنتجات</h3>
                    <p className="text-4xl font-black">{products.length}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <h3 className="text-slate-400">إجمالي المستخدمين</h3>
                    <p className="text-4xl font-black">{users.length}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <h3 className="text-slate-400">تحميلات التطبيق</h3>
                    <p className="text-4xl font-black">{downloadCount}</p>
                </div>
            </div>
        )}

        {activeMenu === 'verifications' && (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">طلبات توثيق الحسابات</h2>
                <div className="grid gap-4">
                    {verifications.length === 0 && <p className="text-slate-500">لا توجد طلبات توثيق حالياً.</p>}
                    {verifications.map(req => (
                        <div key={req.id} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col md:flex-row gap-6 items-center">
                            <img src={req.docUrl} alt="ID" className="w-full md:w-64 h-40 object-cover rounded-xl cursor-pointer" onClick={() => window.open(req.docUrl)} />
                            <div className="flex-1">
                                <h4 className="text-lg font-bold">{req.userEmail}</h4>
                                <p className="text-slate-400 text-sm">تاريخ الطلب: {new Date(req.createdAt).toLocaleDateString('ar-EG')}</p>
                                <div className="flex gap-2 mt-4">
                                    <button onClick={() => handleVerifyUser(req.userId, req.id, 'approved')} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-bold">قبول التوثيق</button>
                                    <button onClick={() => handleVerifyUser(req.userId, req.id, 'rejected')} className="bg-rose-600 hover:bg-rose-700 px-6 py-2 rounded-lg font-bold">رفض</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeMenu === 'reports' && (
             <div className="space-y-6">
                 <h2 className="text-2xl font-bold">بلاغات المنتجات</h2>
                 <div className="grid gap-4">
                    {reports.map(rep => (
                        <div key={rep.id} className="bg-slate-800 p-4 rounded-xl border border-rose-500/30">
                            <p className="font-bold text-rose-400">{rep.type}</p>
                            <p>{rep.reason}</p>
                            <div className="mt-4 flex gap-2">
                                <button onClick={() => handleResolveReport(rep.productId, rep.id, 'delete_product', rep.user)} className="bg-rose-600 px-4 py-2 rounded-lg">حذف المنتج</button>
                                <button className="bg-slate-700 px-4 py-2 rounded-lg">تجاهل</button>
                            </div>
                        </div>
                    ))}
                 </div>
             </div>
        )}

        {activeMenu === 'carousel' && (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">إعلانات السلايدر (Carousel)</h2>
                    <button onClick={handleCreateCarouselAd} className="bg-indigo-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2">
                        <PlusCircle size={20} /> إضافة للسلايدر
                    </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {carouselAds.map(ad => (
                        <div key={ad.id} className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 group">
                            <div className="relative aspect-video">
                                <img src={ad.imageUrl} className="w-full h-full object-cover" />
                                <div className="absolute top-2 right-2">
                                     <button onClick={() => handleDeleteItem('carousel_ads', ad.id)} className="bg-rose-600 p-2 rounded-lg text-white shadow-lg">
                                        <Trash2 size={18} />
                                     </button>
                                </div>
                                <div className="absolute top-2 left-2 bg-slate-900/80 px-3 py-1 rounded-lg text-xs font-bold">
                                    الترتيب: {ad.order}
                                </div>
                            </div>
                            <div className="p-4">
                                <h4 className="font-bold text-lg mb-1">{ad.title}</h4>
                                <p className="text-slate-400 text-sm line-clamp-2">{ad.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeMenu === 'ads' && (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">إدارة الإعلانات</h2>
                    <button onClick={handleCreateAd} className="bg-accent text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2">
                        <PlusCircle size={20} /> إضافة إعلان
                    </button>
                </div>
                <div className="grid gap-4">
                    {ads.map(ad => (
                        <div key={ad.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                            <div>
                                <p className="font-bold text-accent">{ad.note || 'إعلان بدون عنوان'}</p>
                                <p className="text-xs text-slate-400 capitalize">{ad.position}</p>
                            </div>
                            <button onClick={() => handleDeleteItem('global_ads', ad.id)} className="text-rose-500 p-2 hover:bg-rose-500/10 rounded-lg">
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeMenu === 'products' && (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">إدارة المنتجات ({products.length})</h2>
                <div className="grid gap-4">
                    {products.map(p => (
                        <div key={p.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center group">
                            <div className="flex items-center gap-4">
                                <img src={p.img || (p.images?.[0])} className="w-12 h-12 rounded-lg object-cover" />
                                <div>
                                    <p className="font-bold">{p.title}</p>
                                    <p className="text-xs text-slate-400">{p.userEmail || p.user}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleDeleteItem('products', p.id)} className="text-rose-500 p-2 hover:bg-rose-500/10 rounded-lg">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeMenu === 'appSettings' && (
            <div className="space-y-6 max-w-4xl">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Settings className="text-indigo-400" />
                    إعدادات النظام والتحكم
                </h2>
                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-3xl -mr-16 -mt-16 group-hover:bg-accent/20 transition-all rounded-full" />
                        <h3 className="font-black flex items-center gap-2 text-accent text-2xl mb-6">
                            <Download size={24} /> 
                            تحديثات التطبيق (APK)
                        </h3>
                        
                        <div className="grid md:grid-cols-2 gap-8 mb-8">
                            <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-700/50 flex flex-col justify-center">
                                <p className="text-slate-400 text-sm font-bold mb-1">الإصدار الحالي للسيرفر</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black text-white">v{appVersionCode}</span>
                                    <span className="text-emerald-500 text-sm font-black flex items-center gap-1">
                                        <CheckCircle size={14} /> نشط
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex items-center">
                                <button 
                                    onClick={async () => {
                                        const confirmed = await Swal.fire({
                                            title: 'بث تحديث جديد؟',
                                            text: `سيتم رفع الإصدار إلى v${(appVersionCode || 0) + 1} وسيقوم التطبيق بإجبار جميع المستخدمين على التحديث.`,
                                            icon: 'warning',
                                            showCancelButton: true,
                                            confirmButtonText: 'نعم، بث التحديث الآن 🚀',
                                            cancelButtonText: 'تراجع',
                                            confirmButtonColor: '#e11d48'
                                        });
                                        if (confirmed.isConfirmed) {
                                            await updateDoc(doc(db, "global_settings", "app"), { 
                                                versionCode: (appVersionCode || 0) + 1,
                                                forceUpdate: true 
                                            });
                                            Swal.fire('تم البث!', 'أي مستخدم يفتح التطبيق سيظهر له التحديث الإجباري.', 'success');
                                        }
                                    }}
                                    className="w-full bg-rose-600 hover:bg-rose-700 text-white p-6 rounded-2xl font-black shadow-xl shadow-rose-900/40 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 text-xl"
                                >
                                    <Download size={28} />
                                    بث تحديث إجباري للمستخدمين
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-slate-400 mr-2">مستودع GitHub (user/repo)</label>
                                    <input 
                                        value={githubRepo} 
                                        onChange={e => setGithubRepo(e.target.value)} 
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl p-4 outline-none focus:border-accent transition-colors font-mono"
                                        placeholder="lebinhytt-spec/ainelhadjelstore"
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1">سيتم جلب آخر APK تلقائياً من هذا المستودع.</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-slate-400 mr-2">رابط APK يدوي (اختياري)</label>
                                    <input 
                                        value={appLink} 
                                        onChange={e => setAppLink(e.target.value)} 
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl p-4 outline-none focus:border-accent transition-colors"
                                        placeholder="رابط مباشر للملف..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-400 mr-2">ملاحظات التحديث</label>
                                <textarea 
                                    value={releaseNotes} 
                                    onChange={e => setReleaseNotes(e.target.value)} 
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl p-4 outline-none focus:border-accent transition-colors min-h-[120px]"
                                    placeholder="اكتب هنا التحسينات التي تمت في هذا الإصدار..."
                                />
                            </div>
                        </div>

                        <div className="mt-10 border-t border-slate-700/50 pt-10">
                             <h3 className="font-black flex items-center gap-2 text-blue-400 text-xl mb-6">
                                <Smartphone size={24} /> 
                                إعلانات AdMob (الهاتف)
                             </h3>
                             <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-slate-400 mr-2">App ID</label>
                                    <input value={admobAppId} onChange={e => setAdmobAppId(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl p-4 outline-none focus:border-blue-400 transition-colors font-mono" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-slate-400 mr-2">Banner Ad Unit ID</label>
                                    <input value={admobAdUnitId} onChange={e => setAdmobAdUnitId(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl p-4 outline-none focus:border-blue-400 transition-colors font-mono" />
                                </div>
                             </div>
                        </div>

                        <div className="mt-10 border-t border-slate-700/50 pt-10">
                             <h3 className="font-black flex items-center gap-2 text-indigo-400 text-xl mb-6">
                                <Database size={24} /> 
                                إعدادات الهوية (Brand)
                             </h3>
                             <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-slate-400 mr-2">رابط لوجو الموقع/التطبيق</label>
                                    <input 
                                        value={appLogoUrl} 
                                        onChange={e => setAppLogoUrl(e.target.value)} 
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl p-4 outline-none focus:border-indigo-400 transition-colors"
                                        placeholder="URL for the app logo..."
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1">هذا الشعار سيظهر في شريط التنقل وصفحة الترحيب.</p>
                                </div>
                             </div>
                        </div>

                        <div className="mt-10">
                            <button 
                                onClick={async () => {
                                    await updateDoc(doc(db, "global_settings", "app"), { 
                                        downloadLink: appLink,
                                        githubRepo,
                                        releaseNotes,
                                        admobAppId,
                                        admobAdUnitId,
                                        appLogoUrl
                                    });
                                    Swal.fire({
                                        title: 'حُفظت الإعدادات',
                                        icon: 'success',
                                        toast: true,
                                        position: 'top-end',
                                        showConfirmButton: false,
                                        timer: 3000
                                    });
                                }}
                                className="bg-white text-slate-950 px-12 py-4 rounded-2xl font-black shadow-xl hover:bg-slate-100 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <Database size={20} />
                                حفظ كافة الإعدادات
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}
