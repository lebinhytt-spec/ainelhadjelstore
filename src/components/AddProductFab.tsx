import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useAd } from "../context/AdContext";
import Swal from "sweetalert2";
import { addDoc, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import { Plus, Camera, Image as ImageIcon, Wand2, MapPin, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import imageCompression from "browser-image-compression";
import { analyzeProductImage, suggestPrice } from "../services/aiService";

export default function AddProductFab() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [priceAdvice, setPriceAdvice] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  
  const [form, setForm] = useState({
    title: "",
    price: "",
    category: "",
    description: "",
    location: "كل الولايات",
    phone: "",
    condition: "new" as "new" | "used"
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
      
      newFiles.forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const runAIAnalysis = async () => {
    if (previewImages.length === 0) {
      Swal.fire("تنبيه", "يرجى رفع صورة أولاً ليقوم الذكاء الاصطناعي بتحليلها", "warning");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeProductImage(previewImages[0]);
      if (result) {
        setForm(prev => ({
          ...prev,
          title: result.title || prev.title,
          description: result.description || prev.description,
          category: result.category || prev.category
        }));
        setPriceAdvice(`اقتراح الذكاء الاصطناعي: حالة المنتج تبدو ${result.priceStatus === 'Great' ? 'ممتازة' : 'جيدة'}`);
        Swal.fire({
            title: "تم التحليل!",
            text: "قام الذكاء الاصطناعي بكتابة الوصف وتحديد الفئة تلقائياً.",
            icon: "success",
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 3000
        });
      }
    } catch (e) {
      console.error(e);
      Swal.fire("خطأ", "فشل تحليل الصورة بالذكاء الاصطناعي", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const checkPrice = async () => {
      if (!form.title) return;
      const advice = await suggestPrice(form.title, form.category);
      if (advice) setPriceAdvice(advice);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (files.length === 0) {
        Swal.fire("خطأ", "يرجى إضافة صورة واحدة على الأقل", "error");
        return;
    }

    setIsUploading(true);
    try {
        const imageUrls = [];
        const compressionOptions = {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1200,
            useWebWorker: true
        };

        for (const file of files) {
            // Compress image
            const compressedFile = await imageCompression(file, compressionOptions);
            const fileRef = ref(storage, `products/${Date.now()}_${file.name}`);
            await uploadBytes(fileRef, compressedFile);
            const url = await getDownloadURL(fileRef);
            imageUrls.push(url);
        }

        await addDoc(collection(db, "products"), {
            ...form,
            images: imageUrls,
            user: user.email,
            userId: user.uid,
            date: new Date().getTime(),
            views: 0,
            likes: [],
            isArchived: false
        });

        // Notify all users about new product (simulated)
        // In a real app, this would be a FCM call
        
        Swal.fire("تم بنجاح!", "تم نشر إعلانك وهو الآن متاح للجميع.", "success");
        setIsOpen(false);
        // Reset form
        setForm({ title: "", price: "", category: "", description: "", location: "كل الولايات", phone: "", condition: "new" });
        setFiles([]);
        setPreviewImages([]);
    } catch (error) {
        console.error(error);
        Swal.fire("خطأ", "حدث خطأ أثناء النشر", "error");
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => user ? setIsOpen(true) : Swal.fire("تنبيه", "سجل دخولك أولاً لتتمكن من النشر", "info")}
        className="fixed bottom-24 left-6 w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 active:scale-95 transition-all"
      >
        <Plus size={32} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative w-full max-w-2xl bg-card rounded-[2rem] border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b flex justify-between items-center glass">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Camera className="text-primary" /> إضافة إعلان جديد
                </h2>
                <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <Plus className="rotate-45" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Image Upload Area */}
                <div className="space-y-4">
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                        {previewImages.map((img, i) => (
                            <img key={i} src={img} className="w-24 h-24 rounded-2xl object-cover border-2 border-primary/20 shrink-0" alt="" />
                        ))}
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-24 h-24 rounded-2xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center text-primary/60 hover:bg-primary/5 transition-all shrink-0"
                        >
                            <ImageIcon size={24} />
                            <span className="text-[10px] font-bold mt-1">أضف صور</span>
                        </button>
                    </div>
                    <input type="file" hidden multiple ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
                    
                    {previewImages.length > 0 && (
                        <button 
                            type="button"
                            onClick={runAIAnalysis}
                            disabled={isAnalyzing}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-70"
                        >
                            {isAnalyzing ? <Loader2 className="animate-spin" /> : <Wand2 size={18} />}
                            وصف تلقائي بالذكاء الاصطناعي (Gemini)
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold">العنوان</label>
                        <input 
                            required
                            value={form.title}
                            onChange={e => setForm({...form, title: e.target.value})}
                            onBlur={checkPrice}
                            placeholder="مثال: آيفون 15 برور ماكس"
                            className="w-full p-3 bg-muted rounded-xl outline-none focus:ring-2 ring-primary transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold">السعر (دج)</label>
                        <input 
                            required
                            type="number"
                            value={form.price}
                            onChange={e => setForm({...form, price: e.target.value})}
                            placeholder="0.00"
                            className="w-full p-3 bg-muted rounded-xl outline-none focus:ring-2 ring-primary transition-all"
                        />
                        {priceAdvice && <p className="text-[10px] text-primary flex items-center gap-1 animate-in slide-in-from-right-2"><Sparkles size={10} /> {priceAdvice}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold">الفئة</label>
                    <select 
                        required
                        value={form.category}
                        onChange={e => setForm({...form, category: e.target.value})}
                        className="w-full p-3 bg-muted rounded-xl outline-none focus:ring-2 ring-primary transition-all"
                    >
                        <option value="">اختر الفئة</option>
                        <option value="سيارات">سيارات</option>
                        <option value="إلكترونيات">إلكترونيات</option>
                        <option value="عقارات">عقارات</option>
                        <option value="أثاث">أثاث</option>
                        <option value="ملابس">ملابس</option>
                        <option value="أخرى">أخرى</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold">الوصف</label>
                    <textarea 
                        required
                        rows={4}
                        value={form.description}
                        onChange={e => setForm({...form, description: e.target.value})}
                        placeholder="اكتب تفاصيل المنتج بوضوح..."
                        className="w-full p-3 bg-muted rounded-xl outline-none focus:ring-2 ring-primary transition-all resize-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold">الموقع</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3.5 text-muted-foreground" size={16} />
                            <input 
                                value={form.location}
                                onChange={e => setForm({...form, location: e.target.value})}
                                className="w-full pl-10 p-3 bg-muted rounded-xl outline-none focus:ring-2 ring-primary transition-all" 
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold">رقم الهاتف</label>
                        <input 
                            required
                            value={form.phone}
                            onChange={e => setForm({...form, phone: e.target.value})}
                            placeholder="05XXXXXXXX"
                            className="w-full p-3 bg-muted rounded-xl outline-none focus:ring-2 ring-primary transition-all" 
                        />
                    </div>
                </div>

                <button 
                    disabled={isUploading}
                    className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    {isUploading ? <Loader2 className="animate-spin" /> : "نشر الإعلان الآن 🚀"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
