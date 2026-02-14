import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Replace with your actual Firebase config
// const firebaseConfig = {
//   apiKey: "YOUR_API_KEY",
//   authDomain: "YOUR_AUTH_DOMAIN",
//   projectId: "YOUR_PROJECT_ID",
//   storageBucket: "YOUR_STORAGE_BUCKET",
//   messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
//   appId: "YOUR_APP_ID"
// };

const firebaseConfig = {
  apiKey: "AIzaSyDrs2FNzYv1DwKJ88CaPSswT3xG6WDx7Co",
  authDomain: "huraplatform.firebaseapp.com",
  projectId: "huraplatform",
  storageBucket: "huraplatform.firebasestorage.app",
  messagingSenderId: "667928426849",
  appId: "1:667928426849:web:1938c86da413516added20",
  measurementId: "G-2J1XX0QKML"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
