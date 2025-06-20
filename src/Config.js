import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyApsVMczoOJYNnwgvPmobRuPQ08yll5gDQ",
  authDomain: "alpek-consultancy.firebaseapp.com",
  projectId: "alpek-consultancy",
  storageBucket: "alpek-consultancy.firebasestorage.app",
  messagingSenderId: "395931296143",
  appId: "1:395931296143:web:c8da4727863fb790372bfa",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
