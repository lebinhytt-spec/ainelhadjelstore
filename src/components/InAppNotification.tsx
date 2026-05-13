import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';

export default function InAppNotification() {
  const { user } = useAuth();
  const [lastNotif, setLastNotif] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Listen for the absolute latest notification
    const q = query(
      collection(db, 'notifications'), 
      where('user', '==', user.email),
      orderBy('date', 'desc'),
      limit(1)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const data = snap.docs[0].data();
        const notif = { id: snap.docs[0].id, ...data } as any;
        
        // Only show if it's new (created in the last 10 seconds)
        const now = new Date().getTime();
        const notifDate = notif.date || 0;
        if (notifDate > now - 10000) {
          setLastNotif(notif);
          setShow(true);
          const timer = setTimeout(() => setShow(false), 5000);
          return () => clearTimeout(timer);
        }
      }
    });

    return () => unsub();
  }, [user]);

  return (
    <AnimatePresence>
      {show && lastNotif && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 20, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[999] bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border border-primary/20 p-4 flex items-start gap-3 cursor-pointer"
          dir="rtl"
          onClick={() => setShow(false)}
        >
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
            <Bell className="text-primary" size={20} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-slate-900 dark:text-white">إشعار جديد</p>
            <p className="text-sm text-slate-500 line-clamp-2">{lastNotif.text}</p>
          </div>
          <button className="text-slate-400">
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
