import { useState } from "react";
import { ChevronRight, ChevronLeft, PlayCircle } from "lucide-react";
import CustomVideoPlayer from "./CustomVideoPlayer";

export default function ImageGallery({ images, fallback }: { images: string[], fallback?: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const displayImages = images?.length > 0 ? images : (fallback ? [fallback] : []);

  if (displayImages.length === 0) return null;

  const isVideo = (url: string) => {
    if (!url) return false;
    if (url.startsWith('data:video/')) return true;
    return /\.(mp4|webm|mov|ogg|avi)($|\?)/i.test(url.toLowerCase()) || url.includes('/video%2F') || url.includes('%2Fvideo');
  };

  return (
    <div className="relative w-full mb-6">
      <div className="w-full bg-slate-900 rounded-2xl overflow-hidden relative group shadow-inner flex items-center justify-center min-h-[300px] max-h-[500px]">
        {isVideo(displayImages[currentIndex]) ? (
            <CustomVideoPlayer 
              src={displayImages[currentIndex]} 
              className="w-full h-full max-h-[500px] transition-opacity duration-300"
            />
        ) : (
            <img 
              src={displayImages[currentIndex]} 
              className="w-full h-auto max-h-[500px] object-contain transition-opacity duration-300" 
              alt={`Product ${currentIndex + 1}`} 
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x450?text=صورة+غير+متاحة'; }}
            />
        )}
        {displayImages.length > 1 && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1)); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 backdrop-blur-md text-white p-2.5 rounded-full transition-all opacity-0 group-hover:opacity-100 transform hover:scale-110 shadow-lg"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1)); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 backdrop-blur-md text-white p-2.5 rounded-full transition-all opacity-0 group-hover:opacity-100 transform hover:scale-110 shadow-lg"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10 bg-black/30 px-3 py-2 rounded-full backdrop-blur-md">
              {displayImages.map((_, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white w-6 shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-white/50 w-2 hover:bg-white/80'}`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      
      {displayImages.length > 1 && (
        <div className="flex gap-3 mt-4 overflow-x-auto pb-4 snap-x scroll-smooth scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          {displayImages.map((img, idx) => (
            <button 
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative flex-none w-24 h-24 rounded-xl overflow-hidden border-2 transition-all duration-300 ${idx === currentIndex ? 'border-accent shadow-[0_4px_12px_rgba(255,102,0,0.3)] scale-105' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-95'}`}
            >
              {isVideo(img) ? (
                 <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                    <PlayCircle className="w-8 h-8 text-white/80" />
                 </div>
              ) : (
                <img src={img} className="w-full h-full object-cover" alt={`Thumbnail ${idx + 1}`} onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100x100?text=x'; }} />
              )}
              <div className={`absolute inset-0 bg-black/20 transition-opacity ${idx === currentIndex ? 'opacity-0' : 'opacity-100 hover:opacity-0'}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
