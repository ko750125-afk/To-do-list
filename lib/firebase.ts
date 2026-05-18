import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "gen-lang-client-0701799372",
  appId: "1:198841776420:web:7b50bca4a61f28a2f95bb1",
  databaseURL: "https://gen-lang-client-0701799372-default-rtdb.asia-southeast1.firebasedatabase.app",
  storageBucket: "gen-lang-client-0701799372.firebasestorage.app",
  apiKey: "AIzaSyDGlcpvw4zTeNJKSG1YiTYregI8B4VyfzM",
  authDomain: "gen-lang-client-0701799372.firebaseapp.com",
  messagingSenderId: "198841776420",
  measurementId: "G-BWPTPYX4HC"
};

// 중복 초기화 방지 패턴 적용
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
