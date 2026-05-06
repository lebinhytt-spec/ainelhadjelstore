import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { collection, onSnapshot, orderBy, query, doc, getDoc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth, ADMIN_EMAIL } from "../context/AuthContext";
import { useAd } from "../context/AdContext";
import AdsContainer from "../components/AdsContainer";
import Navbar from "../components/Navbar";
import AddProductFab from "../components/AddProductFab";
import ImageGallery from "../components/ImageGallery";
import Footer from "../components/Footer";
import SellerReviews from "../components/SellerReviews";
import ProductComments from "../components/ProductComments";
import TopProgressBar from "../components/TopProgressBar";
import { Filter, Store, PhoneCall, Trash2, Crown, X, Flag, Heart, Share2, ArrowUp, ShoppingBag, Grid, Home as HomeIcon, LayoutGrid, Smartphone, Wrench, Shirt, Gem, Package, Car, Building2, User, FileText, Camera } from "lucide-react";
import Swal from "sweetalert2";

export default function Home() {
  const { user, isAdmin } = useAuth();
  const { withAd } = useAd();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [ads, setAds] = useState<{ top: any[], bottom: any[], inFeed: any[] }>({
    top: [], bottom: [], inFeed: []
  });
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    const unsubscribeAds = onSnapshot(query(collection(db, "global_ads"), orderBy("date", "desc")), (snap) => {
      let topAds: any[] = [];
      let bottomAds: any[] = [];
      let inFeedAds: any[] = [];
      snap.forEach(doc => {
        const ad = { id: doc.id, ...doc.data() } as any;
        if (ad.position === "top") topAds.push(ad);
        else if (ad.position === "bottom") bottomAds.push(ad);
        else if (ad.position === "in_feed") inFeedAds.push(ad);
      });
      // Shuffle array utility
      const shuffle = (array: any[]) => {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
          randomIndex = Math.floor(Math.random() * currentIndex);
          currentIndex--;
          [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
      };
      
      setAds({ 
        top: shuffle(topAds), 
        bottom: shuffle(bottomAds), 
        inFeed: shuffle(inFeedAds) 
      });
    });

    const unsubscribeProducts = onSnapshot(query(collection(db, "products"), orderBy("date", "desc")), (snap) => {
      const prods: any[] = [];
      snap.forEach(doc => {
        prods.push({ id: doc.id, ...doc.data() });
      });
      setProducts(prods);

      setIsLoading(false);
    });

    return () => {
      unsubscribeAds();
      unsubscribeProducts();
    };
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      const params = new URLSearchParams(location.search);
      const sharedProductId = params.get('product');
      if (sharedProductId) {
          const sharedProd = products.find(p => p.id === sharedProductId || p.shortCode === sharedProductId);
          if (sharedProd) {
              setSelectedProduct(sharedProd);
              // Clear URL so we don't reopen it if user closes modal and browses around
              navigate(location.pathname, { replace: true });
          }
      }
    }
  }, [location.search, products]);

  const [activeTab, setActiveTab] = useState<"all" | "favorites">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("الكل");
  const [selectedCondition, setSelectedCondition] = useState<string>("الكل");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const categories = ["الكل", "عقارات", "سيارات", "أجهزة إلكترونية", "خدمات", "ملابس", "أخرى"];
  const conditions = ["الكل", "جديد", "مستعمل"];

  const filteredProducts = products.filter(p => {
      const term = searchTerm.toLowerCase().trim();
      let matchesSearch = true;
      if (term) {
          const searchWords = term.split(/\s+/);
          const combinedString = `${p.title || ''} ${p.desc || ''} ${p.category || ''} ${p.shortCode || ''}`.toLowerCase();
          matchesSearch = searchWords.every(word => combinedString.includes(word));
      }
      const matchesCategory = selectedCategory === "الكل" || p.category === selectedCategory;
      const matchesCondition = selectedCondition === "الكل" || p.condition === selectedCondition;
      const price = Number(p.price) || 0;
      const matchesMin = minPrice === "" || price >= minPrice;
      const matchesMax = maxPrice === "" || price <= maxPrice;

      if (activeTab === "favorites") {
          return matchesSearch && matchesCategory && matchesCondition && matchesMin && matchesMax && user && p.likes?.includes(user.email);
      }
      return matchesSearch && matchesCategory && matchesCondition && matchesMin && matchesMax;
  });

  const [displayedCount, setDisplayedCount] = useState(12);
  const observer = useRef<IntersectionObserver | null>(null);

  const lastProductElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && displayedCount < filteredProducts.length) {
        setDisplayedCount(prev => prev + 12);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, displayedCount, filteredProducts.length]);

  useEffect(() => {
      setDisplayedCount(12);
  }, [searchTerm, selectedCategory, selectedCondition, minPrice, maxPrice, activeTab]);

  const now = new Date().getTime();

  const [animatedHeartId, setAnimatedHeartId] = useState<string | null>(null);

  const handleLike = async (productId: string, e?: any) => {
    if (e) e.stopPropagation();
    if (!user) {
      Swal.fire("تنبيه", "سجل دخولك للإعجاب", "info");
      return;
    }
    const productRef = doc(db, "products", productId);
    const pDoc = await getDoc(productRef);
    if (!pDoc.exists()) return;
    
    let likes = pDoc.data().likes || [];
    const hasLiked = likes.includes(user.email);
    
    if (hasLiked) {
      likes = likes.filter((e: string) => e !== user.email);
    } else {
      likes.push(user.email);
      setAnimatedHeartId(productId);
      setTimeout(() => setAnimatedHeartId(null), 1500);
    }
    await updateDoc(productRef, { likes });
    
    // update current selected product if open
    if (selectedProduct && selectedProduct.id === productId) {
        setSelectedProduct({ ...selectedProduct, likes });
    }
  };

  const handleShare = async (product: any) => {
    const codeToShare = product.shortCode || product.id;
    const shareUrl = `http://ainelhadjelstore.kesug.com/?product=${codeToShare}`;
    const shareData = {
      title: product.title,
      text: `شاهد ${product.title} على متجر عين الحجل!`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Error sharing", err);
      }
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      Swal.fire("تم النسخ", "تم نسخ رابط المنتج بنجاح", "success");
    }
  };

  const handleRequestVip = async (product: any) => {
      try {
        await addDoc(collection(db, "vip_requests"), {
            productId: product.id,
            user: user?.email,
            phone: product.phone,
            status: 'pending',
            date: new Date().getTime()
        });
        Swal.fire('تم الإرسال', 'سيتصل بك المدير قريباً لتثبيت منتجك', 'success');
      } catch (err) {
          Swal.fire('خطأ', 'حدث خطأ أثناء الإرسال', 'error');
      }
  };

  const handleReportProduct = async (productId: string) => {
    if (!user) {
      Swal.fire("تنبيه", "سجل دخولك لتتمكن من الإبلاغ", "warning");
      return;
    }
    const { value: form } = await Swal.fire({
      title: 'الإبلاغ عن منتج',
      html: `
        <div class="flex flex-col gap-3 text-right" dir="rtl">
          <label class="block text-sm font-bold text-slate-700">نوع البلاغ</label>
          <select id="report-type" class="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-rose-500 text-right bg-white">
            <option value="محتوى غير لائق">محتوى غير لائق</option>
            <option value="احتيال / نصب">احتيال / نصب</option>
            <option value="إعلان مكرر">إعلان مكرر</option>
            <option value="معلومات غير صحيحة">معلومات غير صحيحة</option>
            <option value="أخرى">أخرى</option>
          </select>
          <label class="block text-sm font-bold text-slate-700 mt-2">تفاصيل إضافية</label>
          <textarea id="report-reason" class="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-rose-500 text-right min-h-[100px]" placeholder="اكتب تفاصيل البلاغ هنا..."></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'إرسال البلاغ',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444',
      preConfirm: () => {
        return {
          type: (document.getElementById('report-type') as HTMLSelectElement).value,
          reason: (document.getElementById('report-reason') as HTMLTextAreaElement).value
        }
      }
    });

    if (form) {
      try {
        await addDoc(collection(db, `products/${productId}/reports`), {
          user: user.email,
          type: form.type,
          reason: form.reason || 'لم يتم تقديم تفاصيل إضافية',
          date: new Date().getTime()
        });
        Swal.fire('تم الإرسال', 'تم استلام بلاغك وسنقوم بمراجعته قريباً.', 'success');
      } catch (err) {
        Swal.fire('خطأ', 'حدث خطأ أثناء إرسال البلاغ', 'error');
      }
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const { isConfirmed } = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: "سيتم حذف هذا المنتج نهائياً ولا يمكن التراجع عن ذلك!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم، احذفه!',
      cancelButtonText: 'إلغاء'
    });

    if (isConfirmed) {
      try {
        await deleteDoc(doc(db, "products", productId));
        if (selectedProduct?.id === productId) {
            setSelectedProduct(null);
        }
        Swal.fire('تم الحذف!', 'تم حذف المنتج بنجاح.', 'success');
      } catch (error) {
        Swal.fire('خطأ', 'حدث خطأ أثناء الحذف', 'error');
      }
    }
  };

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const renderFeed = () => {
    const items = [];
    let adIndex = 0;
    
    const productsToRender = filteredProducts.slice(0, displayedCount);

    for (let i = 0; i < productsToRender.length; i++) {
        const d = productsToRender[i];
        const isVIP = d.featuredUntil > now;
        const likesCount = d.likes ? d.likes.length : 0;

        const isVideoURL = (url: string) => url && (url.startsWith('data:video/') || /\.(mp4|webm|mov|ogg|avi)($|\?)/i.test(url.toLowerCase()) || url.includes('/video%2F'));
        const thumbnail = (d.images && d.images.length > 0) ? (d.images.find((img: string) => !isVideoURL(img)) || d.images[0]) : (d.img || 'https://via.placeholder.com/600x450?text=عقار+أو+سيارة');

        const isLastElement = i === productsToRender.length - 1;

        const soldCount = d.id ? (parseInt(d.id.substring(0, 5), 16) % 900) + 10 : 0;
        const rating = d.id ? ((parseInt(d.id.substring(5, 8), 16) % 20) / 10 + 3.0).toFixed(1) : "4.5";

        items.push(
            <div 
                ref={isLastElement ? lastProductElementRef : null}
                key={d.id} 
                onClick={() => withAd(() => setSelectedProduct(d))}
                className={`group relative flex flex-col bg-white rounded-[24px] overflow-hidden border shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl cursor-pointer ${d.isOffer ? 'border-rose-200 hover:shadow-rose-500/20' : 'border-slate-100 hover:shadow-accent/10'}`}
            >
                {isVIP && (
                    <div className="absolute top-4 right-4 bg-gradient-to-tr from-amber-500 to-amber-300 text-white px-3 py-1.5 rounded-xl text-xs font-black z-20 shadow-lg shadow-amber-500/30 flex items-center gap-1.5 backdrop-blur-md">
                        <Crown className="w-3.5 h-3.5" /> VIP
                    </div>
                )}
                {d.isOffer && (
                    <div className="absolute top-4 left-4 bg-gradient-to-tr from-rose-600 to-rose-400 text-white px-3 py-1.5 rounded-xl text-xs font-black z-20 shadow-lg shadow-rose-500/30 flex items-center gap-1.5 backdrop-blur-md">
                         تخفيض
                    </div>
                )}
                <div className="w-full aspect-[4/3] bg-slate-100 overflow-hidden relative">
                    <img 
                        src={thumbnail} 
                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" 
                        alt={d.title}
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x450?text=صورة+غير+متاحة'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-80 transition-opacity duration-500"></div>
                    
                    <div className="absolute bottom-3 right-3 left-3 flex justify-between items-end">
                        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-white/50">
                            <p className="font-black text-lg sm:text-xl ltr text-accent" dir="ltr">{d.price} <span className="text-xs font-bold text-slate-500">دج</span></p>
                        </div>
                        <span 
                            onClick={(e) => handleLike(d.id, e)}
                            className="relative flex items-center justify-center w-10 h-10 bg-white/90 backdrop-blur-md hover:bg-rose-50 rounded-full shadow-lg border border-white/50 transition-all cursor-pointer hover:scale-110 active:scale-95 z-20 group/heart"
                        >
                            <Heart className={`w-5 h-5 transition-transform duration-300 ${likesCount > 0 ? 'fill-rose-500 text-rose-500' : 'text-slate-400 group-hover/heart:text-rose-400'} ${animatedHeartId === d.id ? 'scale-150 rotate-12' : ''}`} />
                            {animatedHeartId === d.id && (
                                <span className="absolute -top-10 bg-rose-500 text-white text-xs px-2 py-1 rounded-full shadow-lg animate-bounce whitespace-nowrap z-30 pointer-events-none">
                                    ❤️
                                </span>
                            )}
                        </span>
                    </div>
                </div>
                
                <div className="p-4 sm:p-5 flex flex-col flex-1 gap-2 bg-white">
                    <div className="flex justify-between items-start gap-2">
                        {d.category && <span className="text-[10px] sm:text-xs font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-lg w-fit">{d.category}</span>}
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                            <svg className="w-3.5 h-3.5 fill-amber-400 text-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                            <span className="text-xs font-bold text-amber-600">{rating}</span>
                        </div>
                    </div>
                    
                    <h3 className={`font-black text-sm sm:text-base leading-snug line-clamp-2 mt-1 transition-colors ${d.isOffer ? 'text-rose-600' : 'text-slate-800'}`}>
                        {d.title}
                    </h3>
                    
                    <div className="pt-3 mt-auto border-t border-slate-100 flex items-center justify-between">
                        <span className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <span className="truncate max-w-[120px]">{d.user.split('@')[0]}</span>
                        </span>
                        
                        <span className="text-xs font-bold text-accent group-hover:underline underline-offset-4 decoration-accent/30 pointer-events-none">
                            عرض التفاصيل &larr;
                        </span>
                    </div>
                </div>
            </div>
        );

        if ((i + 1) % 4 === 0 && ads.inFeed.length > 0) {
            const ad = ads.inFeed[adIndex % ads.inFeed.length];
            items.push(
                <div key={`ad-${i}`} className="bg-slate-50 border border-dashed border-accent rounded-[15px] p-2 flex flex-col items-center justify-center">
                    <AdsContainer code={ad.code} />
                </div>
            );
            adIndex++;
        }
    }
    return items;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopProgressBar isLoading={isLoading} />
      <Navbar onSearch={setSearchTerm} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-12">
        
        {/* Hero Banner Section */}
        {!searchTerm && activeTab === "all" && (
            <div className="relative rounded-3xl overflow-hidden bg-slate-900 shadow-2xl flex flex-col md:flex-row items-center border border-slate-700/50">
                {/* Background effects */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 z-0"></div>
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-slate-900 via-slate-800 to-slate-900 z-0"></div>
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent/20 blur-3xl rounded-full z-0 pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 blur-3xl rounded-full z-0 pointer-events-none"></div>

                <div className="relative z-20 flex-1 p-6 sm:p-8 md:p-12 text-center md:text-right flex flex-col justify-center w-full">
                    <div className="inline-flex items-center justify-center md:justify-start gap-2 mb-3 sm:mb-4">
                        <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10 text-accent" />
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                            Ain El Hadjel <span className="text-accent">STORE</span>
                        </h1>
                    </div>
                    
                    <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-4 leading-tight drop-shadow-md">
                        أول متجر إلكتروني <br/>
                        <span className="bg-accent text-white px-3 sm:px-4 py-1 rounded-xl text-3xl sm:text-4xl md:text-6xl mt-2 inline-block shadow-lg shadow-accent/30">في عين الحجل</span>
                    </h2>
                    
                    <p className="text-base sm:text-lg md:text-xl text-slate-300 font-medium mb-6 sm:mb-8 max-w-lg mx-auto md:mx-0">
                        منتجات متنوعة وخدمات محلية من أهل بلدنا. تسوق بكل سهولة وأمان وادعم الاقتصاد المحلي.
                    </p>

                    <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8 w-full">
                        <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 p-2 sm:p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                            <Store className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 mb-1.5 sm:mb-2" />
                            <h3 className="text-white font-bold text-[10px] sm:text-sm">خدمات محلية</h3>
                            <p className="text-slate-400 text-[9px] sm:text-xs mt-1 hidden sm:block">كل ما تحتاجه من مكان واحد</p>
                        </div>
                        <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 p-2 sm:p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                            <Gem className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400 mb-1.5 sm:mb-2" />
                            <h3 className="text-white font-bold text-[10px] sm:text-sm">جودة موثوقة</h3>
                            <p className="text-slate-400 text-[9px] sm:text-xs mt-1 hidden sm:block">من محليين تثق بهم</p>
                        </div>
                        <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 p-2 sm:p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                            <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400 mb-1.5 sm:mb-2" />
                            <h3 className="text-white font-bold text-[10px] sm:text-sm">تسوق بسهولة</h3>
                            <p className="text-slate-400 text-[9px] sm:text-xs mt-1 hidden sm:block">منتجات متنوعة بأسعار مناسبة</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                        <button 
                            onClick={() => { document.getElementById('filters-btn')?.scrollIntoView({ behavior: 'smooth' }) }}
                            className="bg-gradient-to-r from-accent to-orange-500 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-black text-base sm:text-lg transition-all hover:scale-105 shadow-xl shadow-accent/30 flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                            تسوق الآن وادعم اقتصادنا
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Categories Quick Links */}
        {!searchTerm && activeTab === "all" && (
            <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 mb-8 overflow-hidden w-full">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                        <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6 text-accent" /> الأقسام
                    </h3>
                    <button onClick={() => { document.getElementById('filters-btn')?.click() }} className="text-xs sm:text-sm font-bold text-slate-500 hover:text-accent whitespace-nowrap">
                        عرض الكل
                    </button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 sm:gap-6">
                    {[
                        { label: 'سيارات', icon: Car, color: 'bg-blue-100 text-blue-600', val: 'سيارات' },
                        { label: 'عقارات', icon: Building2, color: 'bg-emerald-100 text-emerald-600', val: 'عقارات' },
                        { label: 'هواتف', icon: Smartphone, color: 'bg-indigo-100 text-indigo-600', val: 'أجهزة إلكترونية' },
                        { label: 'خدمات', icon: Wrench, color: 'bg-amber-100 text-amber-600', val: 'خدمات' },
                        { label: 'ملابس', icon: Shirt, color: 'bg-rose-100 text-rose-600', val: 'ملابس' },
                        { label: 'وظائف', icon: FileText, color: 'bg-cyan-100 text-cyan-600', val: 'أخرى' },
                        { label: 'المزيد', icon: LayoutGrid, color: 'bg-slate-100 text-slate-600', val: 'الكل' },
                    ].map((cat, i) => (
                        <button 
                            key={i} 
                            onClick={async () => {
                                setIsFiltersOpen(true);
                                setSelectedCategory(cat.val);
                                // ensure filter is displayed
                                setTimeout(() => window.scrollTo({ top: 500, behavior: 'smooth'}), 100);
                            }}
                            className="flex flex-col items-center gap-1.5 sm:gap-2 group transition-transform active:scale-95"
                        >
                            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-[14px] sm:rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md ${cat.color}`}>
                                <cat.icon className="w-5 h-5 sm:w-8 sm:h-8" />
                            </div>
                            <span className="text-[10px] sm:text-sm font-bold text-slate-600 group-hover:text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis w-full text-center px-0.5">{cat.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* Top Ads */}
        {ads.top.length > 0 && activeTab === "all" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {ads.top.slice(0, 12).map((ad, i) => <AdsContainer key={i} code={ad.code} />)}
          </div>
        )}

        {/* Tabs and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl w-full sm:w-auto overflow-x-auto hide-scroll-bar">
              <button 
                  onClick={() => setActiveTab("all")}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm sm:text-base transition-all whitespace-nowrap ${activeTab === "all" ? "bg-white text-accent shadow-sm shadow-slate-200" : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"}`}
              >
                  كل الإعلانات
              </button>
              <button 
                  onClick={() => {
                      if (!user) {
                          Swal.fire("تنبيه", "سجل دخولك لرؤية المفضلة", "info");
                          return;
                      }
                      setActiveTab("favorites");
                  }}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm sm:text-base flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === "favorites" ? "bg-white text-rose-500 shadow-sm shadow-slate-200" : "text-slate-500 hover:text-rose-500 hover:bg-slate-200/50"}`}
              >
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5" /> مفضلتي
              </button>
            </div>
            
            <button 
              id="filters-btn"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={`flex items-center justify-center gap-2 font-bold px-5 py-2.5 rounded-xl transition-all sm:ml-auto w-full sm:w-fit ${isFiltersOpen ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:text-accent shadow-sm'}`}
            >
              <Filter className="w-5 h-5" /> تصفية
            </button>
        </div>

        {/* Filters Panel */}
        {isFiltersOpen && (
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 sm:p-6 mb-6 flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-top-4 duration-300 flex-wrap">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-bold text-slate-600 mb-2">التصنيف</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-accent focus:outline-none appearance-none font-medium"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-bold text-slate-600 mb-2">الحالة</label>
              <select 
                value={selectedCondition} 
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-accent focus:outline-none appearance-none font-medium"
              >
                {conditions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-sm font-bold text-slate-600 mb-2">السعر الأدنى</label>
              <input 
                type="number" 
                value={minPrice} 
                onChange={(e) => setMinPrice(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="أدنى السعر" 
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-accent focus:outline-none font-medium"
              />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-sm font-bold text-slate-600 mb-2">السعر الأقصى</label>
              <input 
                type="number" 
                value={maxPrice} 
                onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="أقصى السعر" 
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-accent focus:outline-none font-medium"
              />
            </div>
            <div className="flex items-end w-full md:w-auto">
              <button 
                onClick={() => { setSelectedCategory("الكل"); setSelectedCondition("الكل"); setMinPrice(""); setMaxPrice(""); }}
                className="w-full px-6 py-2.5 text-slate-500 font-bold hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
              >
                مسح
              </button>
            </div>
          </div>
        )}

        {/* Store Grid */}
        {isLoading ? (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            </div>
        ) : (
            <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
                  {renderFeed()}
                </div>
                
                {displayedCount < filteredProducts.length && (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                    </div>
                )}

                {filteredProducts.length === 0 && (
                    <div className="text-center py-20 text-slate-400 font-medium bg-white/50 rounded-3xl border border-slate-100">
                        <Store className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>لا توجد منتجات تطابق بحثك حالياً.</p>
                    </div>
                )}
            </>
        )}

        {/* Bottom Ads */}
        {ads.bottom.length > 0 && activeTab === "all" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-12">
            {ads.bottom.slice(0, 12).map((ad, i) => <AdsContainer key={i} code={ad.code} />)}
          </div>
        )}

      </main>

      <Footer />

      <AddProductFab />

      {/* Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4">
            <div 
                className="bg-white w-full h-full sm:h-auto sm:max-w-4xl sm:max-h-[90vh] sm:rounded-3xl shadow-2xl overflow-y-auto relative p-4 sm:p-10 animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
            >
                <div className="sticky top-0 right-0 z-30 flex justify-end pb-2 sm:hidden bg-white/90 backdrop-blur-md -mx-4 -mt-4 px-4 pt-4 shadow-sm mb-4">
                     <button 
                         onClick={() => setSelectedProduct(null)}
                         className="bg-slate-100 p-2 rounded-full text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent"
                     >
                         <X className="w-6 h-6" />
                     </button>
                </div>
                <button 
                    onClick={() => setSelectedProduct(null)}
                    className="hidden sm:block absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-full text-slate-600 hover:bg-rose-500 hover:text-white transition z-20 shadow-sm"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Image Gallery */}
                <ImageGallery 
                    images={selectedProduct.images || []} 
                    fallback={selectedProduct.img} 
                />

                {selectedProduct.video && (
                    <iframe src={selectedProduct.video} className="w-full h-[300px] sm:h-[400px] lg:h-[450px] rounded-xl border-none mb-4" title="Video" />
                )}

                <div className="flex flex-col sm:flex-row justify-between items-start mt-2 gap-4">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 leading-tight">{selectedProduct.title}</h2>
                    {selectedProduct.shortCode && (
                        <div className="flex gap-2 shrink-0">
                            <span className="text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md whitespace-nowrap">
                                كود: {selectedProduct.shortCode}
                            </span>
                        </div>
                    )}
                </div>
                <h3 className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-accent to-orange-300 text-transparent bg-clip-text mt-3" dir="ltr">{selectedProduct.price} <span className="text-xl sm:text-2xl font-bold text-accent drop-shadow-none">دج</span></h3>
                
                <p className="bg-slate-50 p-4 sm:p-5 rounded-xl sm:rounded-2xl mt-4 text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-wrap border border-slate-100">
                    {selectedProduct.desc}
                </p>

                <a 
                    href={`tel:${selectedProduct.phone}`} 
                    className="flex w-full bg-emerald-500 text-white justify-center py-3.5 sm:py-4 rounded-xl text-lg sm:text-xl font-black mt-6 hover:bg-emerald-600 hover:-translate-y-1 transition shadow-lg shadow-emerald-500/30 items-center gap-2"
                >
                    <PhoneCall className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span>إتصل بالبائع ({selectedProduct.phone})</span>
                </a>

                <div className="flex flex-wrap sm:flex-nowrap gap-3 mt-4">
                    <button 
                        onClick={() => handleLike(selectedProduct.id)}
                        className="flex-1 bg-slate-100 text-slate-800 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition relative"
                    >
                        <Heart className={`w-5 h-5 transition-transform duration-300 ${selectedProduct.likes?.includes(user?.email) ? 'fill-rose-500 text-rose-500' : 'text-slate-500'} ${animatedHeartId === selectedProduct.id ? 'scale-150 rotate-12 fill-rose-500 text-rose-500' : ''}`} />
                        إعجاب ({selectedProduct.likes?.length || 0})
                        {animatedHeartId === selectedProduct.id && (
                            <span className="absolute -top-8 right-1/2 transform translate-x-1/2 bg-rose-500 text-white text-xs px-3 py-1.5 rounded-full shadow-lg animate-bounce whitespace-nowrap z-30">
                                تم الإعجاب ❤️
                            </span>
                        )}
                    </button>

                    <button 
                        onClick={() => handleShare(selectedProduct)}
                        className="flex-1 bg-slate-100 text-slate-800 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition"
                    >
                        <Share2 className="w-5 h-5 text-indigo-500" />
                        مشاركة
                    </button>
                    
                    {(user?.email === selectedProduct.user) && (
                        <button 
                            onClick={() => handleRequestVip(selectedProduct)}
                            className="flex-1 bg-amber-400 text-slate-900 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-amber-500 transition"
                        >
                            <Crown className="w-5 h-5" />
                            ترقية VIP
                        </button>
                    )}

                    {(user?.email === selectedProduct.user) && (
                        <button 
                            onClick={async () => {
                                try {
                                    await updateDoc(doc(db, "products", selectedProduct.id), {
                                        date: new Date().getTime()
                                    });
                                    Swal.fire('تم', 'تم إعادة نشر الإعلان بنجاح ليرتفع للأعلى', 'success');
                                    setSelectedProduct(null);
                                } catch (e) {
                                    Swal.fire('خطأ', 'تعذر إعادة النشر', 'error');
                                }
                            }}
                            className="flex-none bg-indigo-500 text-white p-3 rounded-xl hover:bg-indigo-600 transition"
                            title="إعادة النشر (للأعلى)"
                        >
                            <ArrowUp className="w-5 h-5" />
                        </button>
                    )}
                    {(user?.email === selectedProduct.user || isAdmin) && (
                        <button 
                            onClick={() => handleDeleteProduct(selectedProduct.id)}
                            className="flex-none bg-rose-500 text-white p-3 rounded-xl hover:bg-rose-600 transition"
                            title="حذف المنتج"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>
                <div className="mt-4 flex justify-center">
                    <button 
                        onClick={() => handleReportProduct(selectedProduct.id)}
                        className="text-slate-400 hover:text-rose-500 font-medium text-sm flex items-center gap-1.5 transition"
                    >
                        <Flag className="w-4 h-4" /> الإبلاغ عن هذا الإعلان
                    </button>
                </div>

                {/* Seller's other products */}
                {(() => {
                    const sellerProducts = products.filter(p => p.user === selectedProduct.user && p.id !== selectedProduct.id);
                    if (sellerProducts.length === 0) return null;
                    return (
                        <div className="mt-8 border-t border-slate-100 pt-6">
                            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Store className="w-5 h-5 text-accent" /> إعلانات أخرى لنفس البائع</h4>
                            <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scroll-bar" dir="rtl">
                                {sellerProducts.map(p => {
                                    const isVideo = (url: string) => url && (url.startsWith('data:video/') || /\.(mp4|webm|mov|ogg|avi)($|\?)/i.test(url.toLowerCase()) || url.includes('/video%2F'));
                                    const thumb = (p.images && p.images.length > 0) ? (p.images.find((img: string) => !isVideo(img)) || p.images[0]) : (p.img || 'https://via.placeholder.com/150');
                                    return (
                                        <div key={p.id} onClick={() => setSelectedProduct(p)} className="flex-none w-40 sm:w-48 bg-slate-50 rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition border border-slate-100 snap-start">
                                            <img src={thumb} className="w-full h-28 sm:h-32 object-cover" />
                                            <div className="p-3">
                                                <h5 className="font-bold text-xs sm:text-sm text-slate-800 truncate">{p.title}</h5>
                                                <p className="text-accent font-black mt-1 text-sm sm:text-base" dir="ltr">{p.price} دج</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    );
                })()}

                {/* Seller Reviews */}
                <SellerReviews sellerEmail={selectedProduct.user} currentUserEmail={user?.email} />

                {/* Product Comments */}
                <ProductComments productId={selectedProduct.id} productOwner={selectedProduct.user} />
            </div>
        </div>
      )}

      {/* Scroll to Top */}
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-24 left-8 w-12 h-12 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-xl z-30 hover:scale-110 hover:-translate-y-2 transition-all duration-300 focus:outline-none"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
