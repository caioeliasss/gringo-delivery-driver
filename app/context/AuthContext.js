// app/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "../firebase/config";
import { getMotoboyMe } from "../services/api";
import socketService from "../services/socketService";
import eventService from "../services/eventService";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [motoboyData, setMotoboyData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      // If user is logged in, get their motoboy data
      if (currentUser) {
        try {
          const response = await getMotoboyMe();
          setMotoboyData(response.data);
        } catch (error) {
          console.error("Error fetching motoboy data:", error);
        }
      } else {
        setMotoboyData(null);
      }

      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  // Registration with email and password
  const register = async (email, password) => {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };

  // Login with email and password
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return userCredential; // Return the entire userCredential object
    } catch (error) {
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      // Disconnect from socket and event services
      socketService.disconnect();
      eventService.disconnect();

      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  // Update profile function
  const updateUserProfile = async (displayName) => {
    try {
      if (user) {
        await updateProfile(user, { displayName });
        // Force refresh the user
        setUser({ ...user, displayName });
      }
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    motoboyData,
    loading,
    register,
    login,
    logout,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};
