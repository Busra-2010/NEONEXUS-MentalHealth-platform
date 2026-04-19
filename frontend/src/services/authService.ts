import { apiClient, ApiError } from './api';
import { API_CONFIG } from './api';
import { User, UserRole } from '../types';

// Request/Response types for authentication
export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

export interface RegistrationRequest {
  // Personal Info
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  dateOfBirth: string;
  
  // Role-specific fields
  role: UserRole;
  
  // Student fields
  studentId?: string;
  yearOfStudy?: string;
  department?: string;
  
  // Counselor fields
  licenseNumber?: string;
  specialization?: string[];
  experienceYears?: string;
  qualifications?: string[];
  
  // Peer volunteer fields
  volunteerMotivation?: string;
  previousExperience?: string;
  
  // Terms and conditions
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
  emailNotifications: boolean;
}

export interface RegistrationResponse {
  success: boolean;
  message: string;
  user?: {
    id: number;
    username?: string;
    email: string;
    institutionId?: string;
    role: UserRole;
  };
}

export interface AuthUser {
  id: number;
  username?: string;
  email: string;
  role: UserRole;
  institutionId?: string;
  profile?: any;
}

class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Login function
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>(
        API_CONFIG.ENDPOINTS.LOGIN,
        credentials
      );

      if (response.success && response.token) {
        // Store the token in localStorage
        localStorage.setItem('authToken', response.token);
        
        // Store user data if available
        if (response.user) {
          localStorage.setItem('userData', JSON.stringify(response.user));
        }
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Login failed. Please try again.');
    }
  }

  // Registration function
  async register(registrationData: RegistrationRequest): Promise<RegistrationResponse> {
    try {
      // Transform the registration data to match backend expectations
      const requestData = {
        username: registrationData.email.split('@')[0], // Generate username from email
        email: registrationData.email,
        password: registrationData.password,
        confirmPassword: registrationData.confirmPassword,
        institutionId: registrationData.studentId || 'DEFAULT_INST', // Use student ID as institution ID for now
        fullName: registrationData.fullName,
        phone: registrationData.phone,
        dateOfBirth: registrationData.dateOfBirth,
        role: registrationData.role,
        
        // Role-specific data
        ...(registrationData.role === 'student' && {
          studentId: registrationData.studentId,
          yearOfStudy: registrationData.yearOfStudy,
          department: registrationData.department,
        }),
        
        ...(registrationData.role === 'counselor' && {
          licenseNumber: registrationData.licenseNumber,
          specialization: registrationData.specialization,
          experienceYears: registrationData.experienceYears,
          qualifications: registrationData.qualifications,
        }),
        
        ...(registrationData.role === 'peer_volunteer' && {
          volunteerMotivation: registrationData.volunteerMotivation,
          previousExperience: registrationData.previousExperience,
        }),
        
        // Terms and conditions
        agreeToTerms: registrationData.agreeToTerms,
        agreeToPrivacy: registrationData.agreeToPrivacy,
        emailNotifications: registrationData.emailNotifications,
      };

      const response = await apiClient.post<RegistrationResponse>(
        API_CONFIG.ENDPOINTS.REGISTER,
        requestData
      );

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Registration failed. Please try again.');
    }
  }

  // Counselor login
  async counselorLogin(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>(
        '/auth/counselor/login',
        credentials
      );

      if (response.success && response.token) {
        localStorage.setItem('authToken', response.token);
        if (response.user) {
          localStorage.setItem('userData', JSON.stringify(response.user));
        }
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Counselor login failed. Please try again.');
    }
  }

  // Admin login
  async adminLogin(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>(
        '/auth/admin/login',
        credentials
      );

      if (response.success && response.token) {
        localStorage.setItem('authToken', response.token);
        if (response.user) {
          localStorage.setItem('userData', JSON.stringify(response.user));
        }
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Admin login failed. Please try again.');
    }
  }

  // Logout function
  async logout(): Promise<void> {
    try {
      await apiClient.post(API_CONFIG.ENDPOINTS.LOGOUT);
    } catch (error) {
      // Even if the API call fails, we should still clear local storage
      console.warn('Logout API call failed, but clearing local storage anyway');
    } finally {
      // Clear stored authentication data
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    return !!token;
  }

  // Get current user from localStorage
  getCurrentUser(): AuthUser | null {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        return null;
      }
    }
    return null;
  }

  // Get authentication token
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Verify token with backend
  async verifyToken(): Promise<boolean> {
    try {
      const response = await apiClient.get<{success: boolean; valid: boolean}>('/auth/verify');
      return response.success && response.valid;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
export default authService;