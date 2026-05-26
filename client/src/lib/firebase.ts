import { initializeApp, getApps, type FirebaseApp } from "firebase/app";

// Firebase config is provided via Vite env variables (VITE_*)
// Make sure to set these in a .env file at the project root.
const firebaseConfig = {
  apiKey: "AIzaSyAaR5hQP2si48BfPIOwjsvbiNobC8AP_tg",
  authDomain: "adicheatsauth.firebaseapp.com",
  projectId: "adicheatsauth",
  storageBucket: "adicheatsauth.firebasestorage.app",
  messagingSenderId: "1032982338563",
  appId: "1:1032982338563:web:bbb1102fe937cbb4b6c236",
  measurementId: "G-21BCM5XST6"
};

export function getFirebaseApp(): FirebaseApp | null {
  // If required fields are missing, return null (feature disabled)
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) return null;
  if (getApps().length === 0) {
    initializeApp(firebaseConfig);
  }
  return getApps()[0] || null;
}


