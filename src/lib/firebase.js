import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

let app;
let isReal = false;

// We check if the minimum required config exists
if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "" && !firebaseConfig.apiKey.includes("your_")) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    isReal = true;
  } catch (err) {
    console.error("Firebase initialization failed:", err);
    app = null;
  }
} else {
  // En producción, no queremos asustar con "DEMO MODE" si estamos usando MySQL/Render
  console.info("Firebase Auth not configured. Primary authentication via Render API enabled.");
}

export const auth = app ? getAuth(app) : { 
  isReal: false,
  isMock: true, // Mantenemos por compatibilidad de tipos pero ya no disparará la lógica de datos demo en AuthContext
  onAuthStateChanged: (cb) => { 
    setTimeout(() => cb(null), 100); 
    return () => {}; 
  } 
};

export const db = app ? getFirestore(app) : null;
export const googleProvider = new GoogleAuthProvider();
