import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authService, LoginRequest } from '../services/authService';
import { User, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginError: string | null;
  registrationError: string | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (registrationData: any) => Promise<void>;
  logout: () => void;
  clearErrors: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider manages authentication state and provides login/register/logout
 * methods to the entire app. It first tries to restore a session from localStorage
 * via token verification. If the backend is unreachable, it falls back to mock
 * data so the app remains demoable without a running server.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true initially to check for existing session
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  // On mount, check for existing auth token
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        if (authService.isAuthenticated()) {
          const isValid = await authService.verifyToken();
          if (isValid) {
            const storedUser = authService.getCurrentUser();
            if (storedUser) {
              // Reconstruct a User object from stored data
              setCurrentUser(storedUser as unknown as User);
            }
          } else {
            // Token invalid, clear storage
            await authService.logout();
          }
        }
      } catch (error) {
        console.warn('Session restore failed:', error);
        await authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  const login = useCallback(async (email: string, password: string, role: UserRole) => {
    setIsLoading(true);
    setLoginError(null);

    try {
      const response = await authService.login({ email, password });

      if (response.success && response.user) {
        setCurrentUser(response.user);
      } else {
        setLoginError(response.message || 'Login failed. Please try again.');
      }
    } catch (error: any) {
      // If backend is unreachable, fall back to mock data for demo purposes
      if (error.isNetworkError || error.status === 0) {
        console.warn('Backend unreachable, using mock login');
        const mockUser = createMockUser(email, role);
        setCurrentUser(mockUser);
      } else {
        setLoginError(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (registrationData: any) => {
    setIsLoading(true);
    setRegistrationError(null);

    try {
      const response = await authService.register(registrationData);

      if (response.success) {
        // Registration successful — user can now log in
        setRegistrationError(null);
      } else {
        setRegistrationError(response.message || 'Registration failed.');
      }
    } catch (error: any) {
      if (error.isNetworkError || error.status === 0) {
        console.warn('Backend unreachable, simulating registration');
        // Simulate successful registration
      } else {
        setRegistrationError(error.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setCurrentUser(null);
    setLoginError(null);
    setRegistrationError(null);
  }, []);

  const clearErrors = useCallback(() => {
    setLoginError(null);
    setRegistrationError(null);
  }, []);

  const value: AuthContextType = {
    currentUser,
    isLoading,
    isAuthenticated: !!currentUser,
    loginError,
    registrationError,
    login,
    register,
    logout,
    clearErrors
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to access auth context from any component
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ---------------------------------------------------------------------------
// Mock user factory — used when the backend is unreachable so the frontend
// is still demoable on its own.
// ---------------------------------------------------------------------------
function createMockUser(email: string, role: UserRole): User {
  const baseUser = {
    id: 1,
    username: email.split('@')[0],
    email,
    role,
    institutionId: 'UNIV123',
    isActive: true,
    isVerified: true,
    languagePreference: 'en' as const,
    createdAt: new Date().toISOString(),
  };

  switch (role) {
    case 'student':
      return {
        ...baseUser,
        profile: {
          fullName: 'Kabir Kumar',
          yearOfStudy: 3,
          department: 'Computer Science',
          preferences: {
            language: 'en' as const,
            notifications: true,
            anonymousMode: false,
          },
        },
      };
    case 'counselor':
      return {
        ...baseUser,
        profile: {
          fullName: 'Dr. Aasha Akhtar',
          licenseNumber: 'PSY123456',
          specialization: ['Anxiety', 'Depression'],
          experienceYears: 8,
          qualifications: ['PhD Psychology', 'Licensed Clinical Psychologist'],
          languages: ['English', 'Hindi'],
          isAvailable: true,
          rating: 4.8,
          totalSessions: 245,
        },
      };
    case 'admin':
      return {
        ...baseUser,
        profile: {
          fullName: 'Admin User',
          institution: 'University Mental Health Center',
        },
      };
    default:
      return {
        ...baseUser,
        profile: {
          fullName: email.split('@')[0],
          institution: 'University',
        },
      };
  }
}

export default AuthContext;
