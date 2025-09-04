import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Dashboard from './components/Dashboard';
import ProjectPage from './components/ProjectPage';
import FlowPage from './components/FlowPage';
import './App.css'

function App() {
  // State-based navigation inside the protected workspace
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedFlow, setSelectedFlow] = useState(null);

  const clearFlow = () => setSelectedFlow(null);
  const clearProject = () => {
    setSelectedProject(null);
    setSelectedFlow(null);
  };

  return (
    <AuthProvider>
      <NotificationProvider>
      <BrowserRouter>
        <ErrorBoundary>
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
                  {selectedFlow ? (
                    <FlowPage
                      projectId={selectedProject?.id}
                      flow={selectedFlow}
                      onBack={clearFlow}
                    />
                  ) : (
                    <Dashboard onOpenFlow={(flow) => { setSelectedProject({ id: flow.projectId }); setSelectedFlow(flow); }} />
                  )}
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/projects/:projectId"
              element={
                <ProtectedRoute>
                  <ProjectPage onOpenFlow={(flow) => setSelectedFlow(flow)} />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/dashboard/projects/:projectId/flows/:flowId"
              element={
                <ProtectedRoute>
                  <FlowPage onBack={() => window.history.back()} />
                </ProtectedRoute>
              }
            />
            
            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
        </ErrorBoundary>
      </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App
