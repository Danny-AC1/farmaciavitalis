// @ts-ignore: firebase/app types mismatch in some environments
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// These values come from process.env injected by Vite
const firebaseConfig = {
  apiKey: "AIzaSyAwKeSl4THLigVktHJMrQ_doRetucaTTSM",
  authDomain: "farmaciavitalis-a6606.firebaseapp.com",
  projectId: "farmaciavitalis-a6606",
  storageBucket: "farmaciavitalis-a6606.firebasestorage.app",
  messagingSenderId: "851814294042",
  appId: "1:851814294042:web:bed21ddd740033b71d67a3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);