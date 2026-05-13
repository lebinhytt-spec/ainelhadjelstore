import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

export default function HighResBanner() {
  const [ads, setAds] = useState<any[]>([]);
  const [index, setIndex] = useState(0);

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
      setIndex((prev) => (prev + 1) % ads.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [ads]);

  if (ads.length === 0) return null;

  return (
    <div className="w-full h-full overflow-hidden relative group">
      <AnimatePresence mode="wait">
        <motion.div
           key={ads[index].id}
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           transition={{ duration: 1 }}
           className="absolute inset-0"
        >
          <img 
            src={ads[index].imageUrl} 
            className="w-full h-full object-cover"
            alt="Sponsored"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6 text-white text-right" dir="rtl">
             <h4 className="font-black text-lg line-clamp-1">{ads[index].title}</h4>
             <p className="text-xs text-white/70 line-clamp-1">{ads[index].description}</p>
             {ads[index].link && (
               <span className="mt-2 text-[10px] font-black text-accent">إعلان ممول &larr;</span>
             )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
