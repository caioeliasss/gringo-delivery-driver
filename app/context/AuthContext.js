// app/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ouvinte de mudanças na autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Limpar ouvinte no desmonte
    return () => unsubscribe();
  }, []);

  // Registro com campos adicionais (email, senha, celular, CPF)
  const register = async (email, password, phoneNumber, cpf, name) => {
    try {
      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Adicionar displayName
      await updateProfile(userCredential.user, {
        displayName: name,
      });

      // Armazenar campos adicionais no Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        phoneNumber,
        cpf,
        name,
        createdAt: new Date().toISOString(),
      });

      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };

  // Login com email e senha
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar o contexto de autenticação
export const useAuth = () => {
  return useContext(AuthContext);
};
