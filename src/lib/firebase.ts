import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyA-UBjl3gfA2TqKaU2rxeUD7B1jzwHYt_s",
    authDomain: "my-web-app-e0aab.firebaseapp.com",
    projectId: "my-web-app-e0aab",
    storageBucket: "my-web-app-e0aab.firebasestorage.app",
    messagingSenderId: "587933634891",
    appId: "1:587933634891:web:135ffd828cf13267a8d8ce"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
