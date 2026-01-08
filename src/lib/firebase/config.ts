// Firebase SDK imports
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCUNgYrV8jJoNwKb-8iytQpYfpzK91Y18I",
    authDomain: "merchplace-prod.firebaseapp.com",
    projectId: "merchplace-prod",
    storageBucket: "merchplace-prod.firebasestorage.app",
    messagingSenderId: "1037973177634",
    appId: "1:1037973177634:web:1f0da69601a726de10517b",
    measurementId: "G-NYFK9R4N11"
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
