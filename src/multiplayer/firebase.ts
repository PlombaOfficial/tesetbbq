import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDeUKwm5foGd8ZMsOOe1xooVXDWWJmCKzQ",
  authDomain: "reallybbq.firebaseapp.com",
  projectId: "reallybbq",
  storageBucket: "reallybbq.firebasestorage.app",
  messagingSenderId: "335386034979",
  appId: "1:335386034979:web:73172f9d3f15bae847c296",
  measurementId: "G-008WCYDC8Z"
};

// Initialize Firebase safely
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
