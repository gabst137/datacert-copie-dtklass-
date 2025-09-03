# Firebase 7 Development Guide

Complete documentation for building a Business Process Management App with Firebase Authentication, Firestore, and React Router.

## Table of Contents

1. [Dependencies](#dependencies)
2. [Firebase Configuration](#firebase-configuration)
3. [Authentication Setup](#authentication-setup)
4. [React Context for Auth](#react-context-for-auth)
5. [React Router Configuration](#react-router-configuration)
6. [Protected Routes](#protected-routes)
7. [Component Examples](#component-examples)
8. [Best Practices](#best-practices)

## Dependencies

### 1. Install Firebase Dependencies

```bash
# Install Firebase SDK for authentication and Firestore
npm install firebase

# Install React Router for navigation
npm install react-router-dom
```

### Key Firebase Packages:
- **firebase/app**: Core Firebase app initialization
- **firebase/auth**: Authentication services
- **firebase/firestore**: Cloud Firestore database

## Firebase Configuration

### 1. Environment Variables (.env.local)

Create a `.env.local` file in your project root:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### 2. Firebase Configuration File (src/config/firebase.js)

```javascript
// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase configuration object
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Connect to emulators in development
if (process.env.NODE_ENV === 'development') {
  // Connect to Auth emulator
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  
  // Connect to Firestore emulator
  connectFirestoreEmulator(db, 'localhost', 8080);
}

export default app;
```

### 3. Firestore Settings and Initialization

```javascript
// Advanced Firestore configuration
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';

// Initialize Firestore with custom settings
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    cacheSizeBytes: 50 * 1024 * 1024, // 50 MB cache
  }),
  ignoreUndefinedProperties: true,
  experimentalAutoDetectLongPolling: true
});

// Alternative: Basic initialization
// const db = getFirestore(app);
```

## Authentication Setup

### 1. Authentication Context (src/contexts/AuthContext.jsx)

```jsx
// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
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

// Authentication provider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Register new user
  function register(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  // Login user
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Logout user
  function logout() {
    return signOut(auth);
  }

  // Google sign-in
  function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
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
```

### 2. Authentication State Management

```javascript
// Example of auth state persistence configuration
import { setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';

// Set persistence to local (survives browser restart)
await setPersistence(auth, browserLocalPersistence);

// Alternative: Session persistence (tab lifetime only)
// await setPersistence(auth, browserSessionPersistence);
```

## React Context for Auth

### Context API Implementation Pattern

```jsx
// src/contexts/AuthContext.jsx - Enhanced version
import { createContext, useContext, useReducer, useEffect } from 'react';
import { auth } from '../config/firebase';

// Auth state reducer
function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_STATE_CHANGED':
      return {
        ...state,
        user: action.payload,
        loading: false,
        initialized: true
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    default:
      return state;
  }
}

// Initial auth state
const initialState = {
  user: null,
  loading: true,
  error: null,
  initialized: false
};

// Create contexts for state and dispatch
const AuthStateContext = createContext();
const AuthDispatchContext = createContext();

// Custom hooks
export function useAuthState() {
  const context = useContext(AuthStateContext);
  if (!context) {
    throw new Error('useAuthState must be used within AuthProvider');
  }
  return context;
}

export function useAuthDispatch() {
  const context = useContext(AuthDispatchContext);
  if (!context) {
    throw new Error('useAuthDispatch must be used within AuthProvider');
  }
  return context;
}

// Enhanced AuthProvider
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth, 
      (user) => {
        dispatch({ type: 'AUTH_STATE_CHANGED', payload: user });
      },
      (error) => {
        dispatch({ type: 'AUTH_ERROR', payload: error.message });
      }
    );

    return unsubscribe;
  }, []);

  return (
    <AuthStateContext.Provider value={state}>
      <AuthDispatchContext.Provider value={dispatch}>
        {children}
      </AuthDispatchContext.Provider>
    </AuthStateContext.Provider>
  );
}
```

## React Router Configuration

### 1. Router Setup (src/App.jsx)

```jsx
// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

### 2. Advanced Route Configuration

```jsx
// src/routes.jsx - Centralized route configuration
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RootLayout from './components/layouts/RootLayout';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Dashboard from './components/Dashboard';
import Projects from './components/Projects';
import ProjectDetails from './components/ProjectDetails';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      // Public routes
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'signup',
        element: <Signup />,
      },
      
      // Protected routes
      {
        path: 'dashboard',
        element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
      },
      {
        path: 'projects',
        element: <ProtectedRoute><Projects /></ProtectedRoute>,
        children: [
          {
            path: ':id',
            element: <ProjectDetails />,
          }
        ]
      },
      
      // Default redirect
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]);
```

## Protected Routes

### 1. Protected Route Component

```jsx
// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth status
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    // Save the attempted location for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
```

### 2. Advanced Route Protection

```jsx
// src/components/ProtectedRoute.jsx - Enhanced version
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthState } from '../contexts/AuthContext';

function ProtectedRoute({ children, requiredRole = null }) {
  const { user, loading, initialized } = useAuthState();
  const location = useLocation();

  // Wait for auth to initialize
  if (!initialized || loading) {
    return <LoadingSpinner />;
  }

  // Redirect if not authenticated
  if (!user) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Check role-based access (if implemented)
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

// Role-specific route wrapper
export function AdminRoute({ children }) {
  return (
    <ProtectedRoute requiredRole="admin">
      {children}
    </ProtectedRoute>
  );
}

export default ProtectedRoute;
```

## Component Examples

### 1. Login Component

```jsx
// src/components/auth/Login.jsx
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination after login
  const from = location.state?.from || '/dashboard';

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (error) {
      setError('Failed to log in: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (error) {
      setError('Failed to log in with Google: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <button
              disabled={loading}
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Sign in with Google
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
```

### 2. Dashboard Component

```jsx
// src/components/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;

    // Create query for user's projects
    const q = query(
      collection(db, `companies/${currentUser.uid}/projects`),
      orderBy('createdAt', 'desc')
    );

    // Listen for real-time updates
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projectsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Business Process Manager</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {currentUser?.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Projects</h2>
          
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No projects found. Create your first project!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {project.projectName}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Created: {project.createdAt?.toDate().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
```

### 3. Signup Component

```jsx
// src/components/auth/Signup.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      setError('');
      setLoading(true);
      await register(email, password);
      navigate('/dashboard');
    } catch (error) {
      setError('Failed to create account: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div>
            <input
              type="email"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <input
              type="password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <input
              type="password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div>
            <button
              disabled={loading}
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
```

## Best Practices

### 1. Error Handling

```javascript
// Enhanced error handling for Firebase operations
import { FirebaseError } from 'firebase/app';

function getErrorMessage(error) {
  if (error instanceof FirebaseError) {
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
      case 'permission-denied':
        return 'You do not have permission to perform this action.';
      default:
        return error.message;
    }
  }
  return 'An unexpected error occurred.';
}

// Usage in components
try {
  await login(email, password);
} catch (error) {
  setError(getErrorMessage(error));
}
```

### 2. Loading States

```jsx
// Centralized loading component
function LoadingSpinner({ size = 'default', message = 'Loading...' }) {
  const sizeClasses = {
    small: 'h-4 w-4',
    default: 'h-8 w-8',
    large: 'h-16 w-16'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`animate-spin rounded-full border-b-2 border-indigo-600 ${sizeClasses[size]}`}></div>
      <p className="mt-4 text-gray-600 text-sm">{message}</p>
    </div>
  );
}
```

### 3. Security Rules Example

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Companies - users can only access their own company data
    match /companies/{companyId} {
      allow read, write: if request.auth != null && request.auth.uid == companyId;
      
      // Projects within a company
      match /projects/{projectId} {
        allow read, write: if request.auth != null && request.auth.uid == companyId;
        
        // Flows within projects
        match /flows/{flowId} {
          allow read, write: if request.auth != null && request.auth.uid == companyId;
          
          // Form submissions within flows
          match /formData/{submissionId} {
            allow read, write: if request.auth != null && request.auth.uid == companyId;
          }
        }
      }
    }
  }
}
```

### 4. Environment-Specific Configuration

```javascript
// src/config/firebase.js - Production-ready configuration
const isEmulator = process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_EMULATOR === 'true';

// Connect to emulators only in development with explicit flag
if (isEmulator) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (error) {
    console.warn('Emulator connection failed:', error);
  }
}
```

### 5. Performance Optimization

```jsx
// Memoized context values to prevent unnecessary re-renders
import { useMemo, useCallback } from 'react';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Memoized auth functions
  const login = useCallback(async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  }, []);

  const register = useCallback(async (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  }, []);

  const logout = useCallback(async () => {
    return signOut(auth);
  }, []);

  // Memoized context value
  const value = useMemo(() => ({
    currentUser,
    login,
    register,
    logout,
    loading
  }), [currentUser, login, register, logout, loading]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
```

## Summary

This comprehensive guide provides everything needed to implement Firebase Authentication and Firestore with React Router for your Business Process Management application. Key implementation steps:

1. **Install** Firebase and React Router dependencies
2. **Configure** Firebase with environment variables
3. **Set up** authentication context with React Context API  
4. **Implement** protected routes with React Router
5. **Create** login, signup, and dashboard components
6. **Apply** security rules and best practices

The architecture separates concerns effectively:
- Firebase configuration is centralized
- Authentication state is managed via React Context
- Routes are protected based on authentication status
- Components are reusable and maintainable

`★ Insight ─────────────────────────────────────`
- **Context Pattern**: Using separate contexts for state and dispatch prevents unnecessary re-renders when only one aspect changes
- **Route Protection**: The pattern of saving attempted routes for post-login redirect provides excellent UX
- **Error Handling**: Centralized Firebase error mapping makes user experience much more polished
`─────────────────────────────────────────────────`