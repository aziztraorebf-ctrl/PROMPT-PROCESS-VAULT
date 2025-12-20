import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuration Firebase PROD
const firebaseConfig = {
  apiKey: "AIzaSyDa0DWWJB4Ha7QLSEaKNBzl5R9zebNUoqg",
  authDomain: "prompt-and-process-vault.firebaseapp.com",
  projectId: "prompt-and-process-vault",
  storageBucket: "prompt-and-process-vault.firebasestorage.app",
  messagingSenderId: "399543017104",
  appId: "1:399543017104:web:626e7d4d1ec9e77e0e0215"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);