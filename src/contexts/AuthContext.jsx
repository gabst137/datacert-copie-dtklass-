// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth } from '../config/firebase';

// Create authentication context
const AuthContext = createContext({
  currentUser: null,
  login: () => {},
  register: () => {},
  logout: () => {},
  loginWithGoogle: () => {},
  loading: true
});

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper function to get error messages
function getErrorMessage(error) {
  switch (error.code) {
    case 'auth/user-not-found':
      return 'No user found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
}

// Authentication provider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Register new user
  async function register(email, password) {
    try {
      setLoading(true);
      // Set persistence before creating user
      await setPersistence(auth, browserLocalPersistence);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // Optimistically update context so UI doesn't wait for observer
      setCurrentUser(result.user);
      setLoading(false);
      return result;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  // Login user
  async function login(email, password) {
    try {
      setLoading(true);
      // Set persistence before signing in
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithEmailAndPassword(auth, email, password);
      // Optimistically update context so routing doesn't wait
      setCurrentUser(result.user);
      setLoading(false);
      return result;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  // Logout user
  async function logout() {
    try {
      setLoading(true);
      await signOut(auth);
      setCurrentUser(null);
      setLoading(false);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  // Google sign-in
  async function loginWithGoogle() {
    try {
      setLoading(true);
      await setPersistence(auth, browserLocalPersistence);
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      const result = await signInWithPopup(auth, provider);
      setCurrentUser(result.user);
      setLoading(false);
      return result;
    } catch (error) {
      // Handle popup closed by user
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled.');
      }
      throw new Error(getErrorMessage(error));
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    // Safety timeout to avoid long blank states if Firebase is slow
    const timeoutId = setTimeout(() => setLoading(false), 5000);

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setCurrentUser(user);
        setLoading(false);
        clearTimeout(timeoutId);
      },
      (error) => {
        console.error('Auth state change error:', error);
        setLoading(false);
        clearTimeout(timeoutId);
      }
    );

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  // Context value
  const value = {
    currentUser,
    login,
    register,
    logout,
    loginWithGoogle,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
