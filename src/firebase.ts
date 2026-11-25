import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyA0rFjZrOsYEOFFj-PA7zcqEW6tQm_TmgM",
  authDomain: "modcx3d.firebaseapp.com",
  projectId: "modcx3d",
  storageBucket: "modcx3d.firebasestorage.app",
  messagingSenderId: "610497830189",
  appId: "1:610497830189:web:1497c79cdae1e7238347a4",
  measurementId: "G-R2KRSCLLT9"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Analytics conditionally as it requires a browser environment with support
export const analyticsPromise = isSupported().then((supported) => {
  if (supported) {
    return getAnalytics(app);
  }
  return null;
});
