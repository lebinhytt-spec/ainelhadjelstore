import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  emailLogin: (email: string, pass: string) => Promise<void>;
  emailRegister: (email: string, pass: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  logout: async () => {},
  emailLogin: async () => {},
  emailRegister: async () => {},
});

export const ADMIN_EMAIL = "lebinhytt@gmail.com";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Save/Update basic user info in Firestore
        const userRef = doc(db, "users", user.uid);
        try {
          const userSnap = await getDoc(userRef);
          const userData: any = {
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            lastLogin: serverTimestamp(),
          };

          // Only set registrationDate if it doesn't exist
          if (!userSnap.exists() || !userSnap.data().registrationDate) {
            userData.registrationDate = serverTimestamp();
          }

          await setDoc(userRef, userData, { merge: true });
        } catch (error) {
          console.error("Error updating user record:", error);
        }
      }
      
      setLoading(false);
    });

    // Safety timeout: if auth takes more than 8 seconds, skip loading screen
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 8000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const emailLogin = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass).then(() => {});
  
  const emailRegister = async (email: string, pass: string, name: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(res.user, { displayName: name });
  };

  const logout = () => signOut(auth);

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, logout, emailLogin, emailRegister }}>
      {loading ? (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50 dark:bg-[#020617] transition-colors duration-500">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-10 h-10 bg-primary/10 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-white animate-pulse">متجر عين الحجل</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">جاري التحميل...</p>
          </div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
