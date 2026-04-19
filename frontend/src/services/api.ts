// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  TIMEOUT: 30000,
  ENDPOINTS: {
    // Authentication
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH_TOKEN: '/auth/refresh',
    LOGOUT: '/auth/logout',
    
    // Users
    USER_PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    
    // Mental Health
    MOOD_CHECK_INS: '/mental-health/mood-check-ins',
    ASSESSMENTS: '/mental-health/assessments',
    
    // Appointments
    COUNSELORS: '/appointments/counselors',
    BOOK_APPOINTMENT: '/appointments/book',
    USER_APPOINTMENTS: '/appointments/user',
    CANCEL_APPOINTMENT: '/appointments/cancel',
    
    // Resources
    RESOURCES: '/resources',
    RESOURCE_CATEGORIES: '/resources/categories',
    RESOURCE_BY_ID: '/resources',
    
    // Chat (legacy)
    CHAT_SESSIONS: '/chat/sessions',
    CHAT_MESSAGES: '/chat/messages',
    CHAT_CRISIS_ALERT: '/chat/crisis-alert',

    // Chat API (multilingual chatbot module)
    CHAT_SESSION: '/chat/session',
    CHAT_MESSAGE: '/chat/message',
    CHAT_SCREENING_START: '/chat/screening/start',
    CHAT_SCREENING_ANSWER: '/chat/screening/answer',
    CHAT_SCREENING_RESULTS: '/chat/screening/results',
    
    // Notifications
    NOTIFICATIONS: '/notifications',
    MARK_READ: '/notifications/mark-read',
  }
};

// HTTP Client with error handling
class ApiClient {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Default headers
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const config: RequestInit = {
      ...options,
      headers,
      signal: controller.signal,
    };

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          response.status,
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ApiError) {
        throw error;
      } else if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError(0, 'Request timed out', { originalError: error });
      }
      
      // Handle network errors
      throw new ApiError(0, 'Network error occurred', { originalError: error });
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return this.request<T>(endpoint + (url.search || ''), {
      method: 'GET',
    });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// Custom API Error class
export class ApiError extends Error {
  public status: number;
  public data?: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }

  get isNetworkError() {
    return this.status === 0;
  }

  get isAuthError() {
    return this.status === 401 || this.status === 403;
  }

  get isServerError() {
    return this.status >= 500;
  }

  get isClientError() {
    return this.status >= 400 && this.status < 500;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;