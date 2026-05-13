import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdCarousel() {
  const [ads, setAds] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const q = query(collection(db, "carousel_ads"), orderBy("order", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const data: any[] = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setAds(data);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [ads]);

  if (ads.length === 0) return null;

  const next = () => setCurrentIndex((currentIndex + 1) % ads.length);
  const prev = () => setCurrentIndex((currentIndex - 1 + ads.length) % ads.length);

  const AdContent = ({ ad }: { ad: any }) => (
    <div className="absolute inset-x-0 bottom-6 sm:bottom-10 px-6 sm:px-12 text-white text-right" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <h3 className="text-xl sm:text-4xl font-black mb-2 sm:mb-3 tracking-tight drop-shadow-lg">
          {ad.title}
        </h3>
        <p className="text-white/90 text-xs sm:text-xl font-medium max-w-3xl line-clamp-2 leading-relaxed drop-shadow-md">
          {ad.description}
        </p>
      </motion.div>
    </div>
  );

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
      <div className="relative h-64 sm:h-auto sm:aspect-[21/7] w-full overflow-hidden rounded-[32px] shadow-2xl border border-white/5 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={ads[currentIndex].id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 cursor-pointer"
            onClick={() => {
              if (ads[currentIndex].link) {
                window.open(ads[currentIndex].link, '_blank');
              }
            }}
          >
            <img 
              src={ads[currentIndex].imageUrl} 
              alt={ads[currentIndex].title}
              className="w-full h-full object-cover transition-opacity duration-300"
              loading={currentIndex === 0 ? "eager" : "lazy"}
            />
            {/* High-quality overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
            
            <AdContent ad={ads[currentIndex]} />
          </motion.div>
        </AnimatePresence>

        {/* Improved Dots for performance */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2.5 z-20">
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ease-out ${currentIndex === i ? 'w-10 bg-primary' : 'w-1.5 bg-white/40 hover:bg-white/60'}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
          <button onClick={prev} className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white pointer-events-auto hover:bg-black/50 transition-all">
            <ChevronRight size={24} />
          </button>
          <button onClick={next} className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white pointer-events-auto hover:bg-black/50 transition-all">
            <ChevronLeft size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
