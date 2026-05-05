import { Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useAd } from "../context/AdContext";
import Swal from "sweetalert2";
import { addDoc, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase";

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/webp', 0.6));
        } else {
            resolve(img.src);
        }
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const compressVideo = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;
    
    video.onloadedmetadata = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 320;
      let width = video.videoWidth;
      let height = video.videoHeight;
      if (width > MAX_WIDTH) {
        height = Math.round(height * MAX_WIDTH / width);
        width = MAX_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No canvas context');

      video.currentTime = 0;
      video.play().catch(reject);

      let stream;
      try {
          stream = canvas.captureStream(15);
      } catch (e) {
          return reject('captureStream unsupported');
      }

      let mimeType = 'video/webm;codecs=vp8';
      let options = { mimeType, videoBitsPerSecond: 150000 };
      if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
          options = { mimeType, videoBitsPerSecond: 150000 };
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
          options = { mimeType: '', videoBitsPerSecond: 150000 };
      }

      const recorder = new MediaRecorder(stream, options);
      const chunks: Blob[] = [];

      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: options.mimeType || 'video/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
      };

      recorder.start();

      const draw = () => {
        // Limit to 5 seconds to ensure very small filesize (fits within Firestore limits)
        if (video.paused || video.ended || video.currentTime > 5) {
          recorder.stop();
          video.pause();
          URL.revokeObjectURL(video.src);
          return;
        }
        ctx.drawImage(video, 0, 0, width, height);
        requestAnimationFrame(draw);
      };

      video.onplay = () => draw();
    };
    video.onerror = () => reject('Error playing video');
  });
};

export default function AddProductFab() {
  const { user } = useAuth();
  const { withAd } = useAd();

  const handlePublish = async () => {
    if (!user) {
      Swal.fire("تنبيه", "سجل دخولك لتتمكن من البيع", "warning");
      return;
    }

      const startPublish = async () => {
        let defaultPhone = '';
        try {
            if (user.email) {
                const { getDoc, doc } = await import("firebase/firestore");
                const uDoc = await getDoc(doc(db, "users", user.email));
                if (uDoc.exists()) {
                    defaultPhone = uDoc.data().phone || '';
                }
            }
        } catch(e) {}

        const { value: form, isConfirmed } = await Swal.fire({
          title: 'إضافة منتج للسوق',
          html: `
            <div class="flex flex-col gap-3 text-right" dir="rtl">
              <input id="p-title" class="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-accent text-right" placeholder="اسم المنتج">
              <div class="flex gap-2 mb-3">
                <input id="p-price" type="number" class="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-accent text-right" placeholder="السعر (دج)">
                <select id="p-category" class="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-accent text-right bg-white appearance-none">
                  <option value="عقارات">عقارات</option>
                  <option value="سيارات">سيارات</option>
                  <option value="أجهزة إلكترونية">أجهزة إلكترونية</option>
                  <option value="خدمات">خدمات</option>
                  <option value="ملابس">ملابس</option>
                  <option value="أخرى" selected>أخرى</option>
                </select>
              </div>
              <select id="p-condition" class="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-accent text-right bg-white mb-3">
                  <option value="جديد">جديد</option>
                  <option value="مستعمل">مستعمل</option>
              </select>
              <input id="p-phone" type="tel" value="${defaultPhone}" class="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-accent text-right" placeholder="رقم الهاتف">
              <textarea id="p-desc" class="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-accent text-right min-h-[100px]" placeholder="الوصف"></textarea>
              <div class="text-right border border-slate-300 rounded-lg p-3 bg-slate-50">
                  <label class="block text-sm font-bold text-slate-700 mb-2">صور المنتج (حد أقصى 4 صور وفيديوهات)</label>
                  <input type="file" id="p-images-file" multiple accept="image/*,video/*" class="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 cursor-pointer">
              </div>
              <input id="p-vid" class="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-accent text-right" placeholder="رابط فيديو تضمين (اختياري)">
              <div class="flex items-center gap-2 mt-1">
                <input type="checkbox" id="p-offer" class="w-5 h-5 accent-rose-500 cursor-pointer">
                <label for="p-offer" class="text-slate-700 font-bold cursor-pointer">تعليم كعرض خاص / تخفيض (يظهر باللون الأحمر)</label>
              </div>
            </div>
          `,
          confirmButtonText: 'نشر المنتج',
          confirmButtonColor: '#ff6600',
          showCancelButton: true,
          cancelButtonText: 'إلغاء',
          preConfirm: () => {
            const title = (document.getElementById('p-title') as HTMLInputElement).value;
            if (!title) {
              Swal.showValidationMessage('يرجى إدخال اسم المنتج');
              return false;
            }
            
            const fileInput = document.getElementById('p-images-file') as HTMLInputElement;
            let filesArray: File[] = [];
            if (fileInput.files) {
                filesArray = Array.from(fileInput.files);
            }

            return { 
                title, 
                price: (document.getElementById('p-price') as HTMLInputElement).value, 
                category: (document.getElementById('p-category') as HTMLSelectElement).value,
                condition: (document.getElementById('p-condition') as HTMLSelectElement).value,
                phone: (document.getElementById('p-phone') as HTMLInputElement).value, 
                desc: (document.getElementById('p-desc') as HTMLTextAreaElement).value, 
                files: filesArray, 
                video: (document.getElementById('p-vid') as HTMLInputElement).value,
                isOffer: (document.getElementById('p-offer') as HTMLInputElement).checked
            };
          }
        });

        if (isConfirmed && form) {
          try {
            Swal.fire({
                title: 'جاري النشر...',
                html: 'جاري حفظ بيانات الإعلان...<br>نرجو الانتظار قليلاً.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const imageUrls: string[] = [];

            if (form.files && form.files.length > 0) {
                const filesToProcess = form.files.slice(0, 4);
                // Sort so images are processed and pushed before videos
                filesToProcess.sort((a: File, b: File) => {
                    const aIsVideo = a.type.startsWith('video/') ? 1 : 0;
                    const bIsVideo = b.type.startsWith('video/') ? 1 : 0;
                    return aIsVideo - bIsVideo;
                });

                for (let i = 0; i < filesToProcess.length; i++) {
                    const file = filesToProcess[i];
                    if (file.type.startsWith('video/')) {
                        try {
                            const base64Video = await compressVideo(file);
                            imageUrls.push(base64Video);
                        } catch(e) {
                            console.error("Video compression failed", e);
                        }
                    } else {
                        try {
                            const base64Image = await compressImage(file);
                            imageUrls.push(base64Image);
                        } catch(e) {
                            console.error("Image compression failed", e);
                        }
                    }
                }
            }

            const shortCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            await addDoc(collection(db, "products"), {
              title: form.title,
              price: form.price,
              category: form.category || 'أخرى',
              condition: form.condition || 'جديد',
              phone: form.phone,
              desc: form.desc,
              images: imageUrls,
              video: form.video,
              isOffer: form.isOffer,
              user: user?.email,
              date: new Date().getTime(),
              likes: [],
              featuredUntil: 0,
              shortCode
            });
            Swal.fire("مبروك", "تم عرض منتجك بنجاح", "success");
          } catch (error: any) {
            console.error("Upload error:", error);
            Swal.fire("خطأ", "حدث خطأ أثناء النشر، يرجى المحاولة مرة أخرى.", "error");
          }
        }
    };

    withAd(startPublish);
  };

  return (
    <button 
      onClick={handlePublish}
      className="fixed bottom-8 left-8 w-14 h-14 rounded-full bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/40 z-40 hover:scale-110 hover:rotate-90 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-accent/50"
    >
      <Plus className="w-6 h-6" />
    </button>
  );
}

