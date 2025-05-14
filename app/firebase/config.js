// app/firebase/config.js
import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Initialize Firebase com as configurações do arquivo env.js
const app = initializeApp({
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
});

// Inicialize o Auth
let auth;

// Tente utilizar a persistência com AsyncStorage para React Native
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  console.log("Firebase Auth inicializado com AsyncStorage");
} catch (error) {
  // Fallback para web ou se houver erro
  auth = getAuth(app);
  console.log(
    "Firebase Auth inicializado sem persistência personalizada:",
    error.message
  );
}

// Inicialize Firestore
const db = getFirestore(app);

export { auth, db };
export default app;
