// app/firebase/config.js
import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Configuração do Firebase - tenta usar variáveis de ambiente com fallback para valores diretos
const firebaseConfig = {
  apiKey: "AIzaSyBh-mZCvYaGg_LrtNbb1Ho8e5AZWIauDn4",
  authDomain: "gringo-delivery.firebaseapp.com",
  projectId: "gringo-delivery",
  storageBucket: "gringo-delivery.firebasestorage.app",
  messagingSenderId: "960529837513",
  appId: "1:960529837513:web:b0d49f17513b7c2dd04c18",
};
// Inicialize o Firebase
const app = initializeApp(firebaseConfig);

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
