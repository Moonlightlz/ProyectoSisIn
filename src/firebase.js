// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDrqrF-vuH3JIVxaa51khjE_CNAht1tnL8",
  authDomain: "calzado-caabf.firebaseapp.com",
  projectId: "calzado-caabf",
  storageBucket: "calzado-caabf.firebasestorage.app",
  messagingSenderId: "452170673789",
  appId: "1:452170673789:web:ee384bdab480dfdae40b14",
  measurementId: "G-GRTF629QG2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, analytics };
export default app;