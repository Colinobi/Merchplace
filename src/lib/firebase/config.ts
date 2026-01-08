// Firebase SDK imports
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration (from environment variables)
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (prevent re-initialization in Next.js hot reload)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firebase services
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Analytics (only in browser to avoid SSR errors)
let analytics = null;
if (typeof window !== "undefined") {
    import("firebase/analytics").then(({ getAnalytics }) => {
        analytics = getAnalytics(app);
    });
}

export { app, db, storage, auth, analytics };
