import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import StudentDashboard from './pages/StudentDashboard';
import CounselorDashboard from './pages/CounselorDashboard';
import PeerSupportDashboard from './pages/PeerSupportDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ChatBot from './pages/ChatBot';
import Appointments from './pages/Appointments';
import Resources from './pages/Resources';
import Community from './pages/Community';
import MentalHealthScreeningPage from './pages/MentalHealthScreening';
import ProfileSettings from './pages/ProfileSettings';
import ErrorBoundary from './components/ErrorBoundary';
import { PageLoader, OfflineIndicator } from './components/ui';
import { MoodCheckIn } from './types';
import Navigation from './components/ui/Navigation';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider, useToast } from './contexts/NotificationContext';
import { register as registerSW, initializeInstallPrompt } from './utils/serviceWorker';

// ---------------------------------------------------------------------------
// Inner app shell — consumes AuthContext
// ---------------------------------------------------------------------------
function AppContent() {
  const {
    currentUser,
    isLoading,
    loginError,
    registrationError,
    login,
    register,
    logout,
  } = useAuth();
  const toast = useToast();

  // Initialise PWA features once
  React.useEffect(() => {
    registerSW({
      onSuccess: () => toast.success('App ready for offline use!'),
      onUpdate: () => toast.info('New version available', 'Please refresh the page to update'),
      onOffline: () => toast.warning('You are now offline', 'Some features may be limited'),
      onOnline: () => toast.success('Connection restored!'),
    });
    initializeInstallPrompt();
  }, [toast]);

  // --- Handler adapters (keep page component signatures unchanged) ---------

  const handleLogin = async (credentials: { email: string; password: string; role: any }) => {
    await login(credentials.email, credentials.password, credentials.role);
  };

  const handleRegister = async (registrationData: any) => {
    await register(registrationData);
  };

  const handleMoodSubmit = (mood: MoodCheckIn) => {
    console.log('Mood submitted:', mood);
    // TODO: wire to backend API (POST /api/assessments/mood)
    toast.success(`Mood check-in submitted! You're feeling: ${mood.mood}/5`);
  };

  // --- Route guards -------------------------------------------------------

  const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return currentUser ? <>{children}</> : <Navigate to="/login" replace />;
  };

  const CommunityLayout = () => {
    if (!currentUser) return <Navigate to="/login" replace />;
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation
          userRole={currentUser.role}
          userName={currentUser.profile?.fullName || currentUser.username}
          onLogout={logout}
        />
        <Community />
      </div>
    );
  };

  const DashboardRoute = () => {
    if (!currentUser) return <Navigate to="/login" replace />;
    switch (currentUser.role) {
      case 'student':
        return <StudentDashboard user={currentUser} onLogout={logout} onMoodSubmit={handleMoodSubmit} />;
      case 'counselor':
        return <CounselorDashboard user={currentUser} onLogout={logout} />;
      case 'peer_volunteer':
        return <PeerSupportDashboard user={currentUser} onLogout={logout} />;
      case 'admin':
        return <AdminDashboard user={currentUser} onLogout={logout} />;
      default:
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome, {currentUser.profile?.fullName}!
              </h1>
              <p className="text-gray-600 mb-6">
                Dashboard for role '{currentUser.role}' is not available.
              </p>
              <button onClick={logout} className="px-4 py-2 bg-neon-blue-500 text-white rounded-lg hover:bg-neon-blue-600 transition-colors">
                Logout
              </button>
            </div>
          </div>
        );
    }
  };

  // --- Loading state -------------------------------------------------------

  if (isLoading && !currentUser) {
    return <PageLoader text="Signing you in..." />;
  }

  // --- Render --------------------------------------------------------------

  return (
    <LanguageProvider>
      <ErrorBoundary>
        <Router>
          <Routes>
            {/* Public */}
            <Route
              path="/login"
              element={
                currentUser ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <LoginPage
                    onLogin={handleLogin}
                    onRegister={handleRegister}
                    isLoading={isLoading}
                    error={loginError}
                    registrationError={registrationError}
                  />
                )
              }
            />

            {/* Protected */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardRoute /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatBot user={currentUser || undefined} onLogout={logout} /></ProtectedRoute>} />
            <Route path="/appointments" element={<ProtectedRoute><Appointments user={currentUser || undefined} onLogout={logout} /></ProtectedRoute>} />
            <Route path="/resources" element={<ProtectedRoute><Resources user={currentUser || undefined} onLogout={logout} /></ProtectedRoute>} />
            <Route path="/forum" element={<ProtectedRoute><CommunityLayout /></ProtectedRoute>} />
            <Route path="/screening" element={<ProtectedRoute><MentalHealthScreeningPage user={currentUser || undefined} onLogout={logout} /></ProtectedRoute>} />
            <Route path="/profile-settings" element={<ProtectedRoute><ProfileSettings user={currentUser || undefined} onLogout={logout} /></ProtectedRoute>} />
            <Route path="/privacy-settings" element={<ProtectedRoute><ProfileSettings user={currentUser || undefined} onLogout={logout} /></ProtectedRoute>} />

            {/* Defaults */}
            <Route path="/" element={<Navigate to={currentUser ? "/dashboard" : "/login"} replace />} />
            <Route path="*" element={<Navigate to={currentUser ? "/dashboard" : "/login"} replace />} />
          </Routes>
        </Router>
      </ErrorBoundary>
    </LanguageProvider>
  );
}

// ---------------------------------------------------------------------------
// Root App — wraps providers
// ---------------------------------------------------------------------------
function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <AppContent />
          <OfflineIndicator />
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
