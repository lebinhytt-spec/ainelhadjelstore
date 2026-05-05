import { create } from 'zustand';
import { collection, onSnapshot, query, where, getDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface NotificationState {
  notifications: any[];
  unreadCount: number;
  loading: boolean;
  prefs: any;
  init: (userEmail: string) => () => void;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  updatePrefs: (newPrefs: any, userEmail: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  prefs: {},
  init: (userEmail: string) => {
    set({ loading: true });
    
    // Listen to user preferences
    const unsubPrefs = onSnapshot(doc(db, "user_prefs", userEmail), (docSnap) => {
        if (docSnap.exists()) {
            set({ prefs: docSnap.data() });
        } else {
            set({ prefs: { admin: true, comments: true } });
        }
    });

    // Listen to notifications
    const unsubNotifs = onSnapshot(
      query(collection(db, "notifications"), where("user", "==", userEmail)),
      (snap) => {
        const notifs: any[] = [];
        let unread = 0;
        snap.forEach(d => {
            const data = { id: d.id, ...d.data() } as any;
            notifs.push(data);
            if (!data.read) unread++;
        });
        notifs.sort((a, b) => b.date - a.date);
        
        set((state) => {
            // Apply preferences filtering
            const filteredNotifs = notifs.filter(n => {
                if (n.type === 'admin' && state.prefs.admin === false) return false;
                if (n.type === 'comment' && state.prefs.comments === false) return false;
                return true;
            });
            return { notifications: filteredNotifs, unreadCount: filteredNotifs.filter(n => !n.read).length, loading: false };
        });
      }
    );

    return () => {
      unsubPrefs();
      unsubNotifs();
    };
  },
  markAllAsRead: async () => {
    const { notifications } = get();
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach(n => {
        batch.update(doc(db, "notifications", n.id), { read: true });
    });
    await batch.commit();
  },
  clearNotifications: async () => {
    const { notifications } = get();
    const batch = writeBatch(db);
    notifications.forEach(n => {
        batch.update(doc(db, "notifications", n.id), { hidden: true }); // better to soft delete or just delete
        // If the system physically deletes:
        batch.delete(doc(db, "notifications", n.id));
    });
    await batch.commit();
    set({ notifications: [], unreadCount: 0 });
  },
  updatePrefs: async (newPrefs: any, userEmail: string) => {
    set({ prefs: newPrefs });
  }
}));
