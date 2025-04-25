// app/firebase/config.js
import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FIREBASE_CONFIG } from "../../env";

// Initialize Firebase com as configurações do arquivo env.js
const app = initializeApp(FIREBASE_CONFIG);

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
