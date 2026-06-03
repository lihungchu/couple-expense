import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBW1DS9-rvbpFBXaPdlf7obCGXc7Phm5kA",
  authDomain: "couple-expense-6ff5e.firebaseapp.com",
  projectId: "couple-expense-6ff5e",
  storageBucket: "couple-expense-6ff5e.firebasestorage.app",
  messagingSenderId: "556730491665",
  appId: "1:556730491665:web:d19b92ef9d0cef70a622b0",
  measurementId: "G-S1WEWHHW8L"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export { onAuthStateChanged, signInWithPopup, signOut };
