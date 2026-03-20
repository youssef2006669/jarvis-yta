import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDC9PRh1b_ESYw4qDyHSeGEUVgGtDWxL2k",
  authDomain: "jarvis-yta.firebaseapp.com",
  projectId: "jarvis-yta",
  storageBucket: "jarvis-yta.firebasestorage.app",
  messagingSenderId: "203598264451",
  appId: "1:203598264451:web:17ef7aebdfbed1fbb103b6",
  measurementId: "G-YQ6F8SVRL5"
};

// 1. Initialize App (Singleton)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// 2. Initialize Firestore safely
// We check if the app is already initialized to prevent Next.js from crashing on refresh
export const db = getApps().length > 0 
  ? getFirestore(app) 
  : initializeFirestore(app, {
      experimentalForceLongPolling: true, 
      localCache: persistentLocalCache(),
    });