import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { User, UserRole } from './types';

// Mock user data for testing
export const createMockUser = (role: UserRole = 'student', overrides: Partial<User> = {}): User => ({
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  role,
  institutionId: 'TEST123',
  isActive: true,
  isVerified: true,
  languagePreference: 'en',
  createdAt: '2024-01-01T00:00:00Z',
  profile: role === 'student' ? {
    fullName: 'Test Student',
    yearOfStudy: 3,
    department: 'Computer Science',
    preferences: {
      language: 'en',
      notifications: true,
      anonymousMode: false
    }
  } : role === 'counselor' ? {
    fullName: 'Dr. Test Counselor',
    licenseNumber: 'PSY123456',
    specialization: ['Anxiety', 'Depression'],
    experienceYears: 5,
    qualifications: ['PhD Psychology'],
    languages: ['English'],
    isAvailable: true,
    rating: 4.8,
    totalSessions: 100
  } : {
    fullName: 'Test Admin',
    institution: 'Test University'
  },
  ...overrides
});

// Custom render function that includes providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </ErrorBoundary>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Mock functions for testing
export const mockNavigate = jest.fn();
export const mockLocation = {
  pathname: '/dashboard',
  search: '',
  hash: '',
  state: null,
  key: 'test'
};

// Mock React Router hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation
}));

// Mock window.alert for tests
global.alert = jest.fn();

// Mock window.matchMedia (required for responsive tests)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
(global as any).IntersectionObserver = class IntersectionObserver {
  root: Element | Document | null = null;
  rootMargin: string = '0px';
  thresholds: ReadonlyArray<number> = [0];
  
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.root = options?.root || null;
    this.rootMargin = options?.rootMargin || '0px';
    this.thresholds = options?.threshold ? 
      (Array.isArray(options.threshold) ? options.threshold : [options.threshold]) : [0];
  }
  
  observe(): void {}
  disconnect(): void {}
  unobserve(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
};

// Helper to test mental health sensitive components
export const renderWithMentalHealthContext = (
  component: React.ReactElement,
  options: {
    user?: User;
    crisisMode?: boolean;
    anonymousMode?: boolean;
  } = {}
) => {
  const { user = createMockUser(), crisisMode = false, anonymousMode = false } = options;
  
  return customRender(component, {
    // Pass any additional context needed for mental health components
  });
};

// Test data generators
export const generateMoodData = (count: number = 7) => {
  return Array.from({ length: count }, (_, index) => ({
    mood: Math.floor(Math.random() * 5) + 1,
    date: new Date(Date.now() - (count - index - 1) * 24 * 60 * 60 * 1000).toISOString(),
    notes: `Test mood entry ${index + 1}`
  }));
};

export const generateResourceData = (count: number = 5) => {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    title: `Test Resource ${index + 1}`,
    description: `This is a test resource description for resource ${index + 1}`,
    type: ['video', 'audio', 'pdf', 'article'][index % 4] as any,
    category: ['Stress Relief', 'Sleep', 'Academic Pressure', 'Anxiety'][index % 4] as any,
    language: 'en' as any,
    tags: [`tag${index + 1}`, `test`],
    difficultyLevel: 'beginner' as any,
    isFeatured: index === 0,
    isActive: true,
    viewCount: Math.floor(Math.random() * 1000) + 100,
    rating: 4.5,
    ratingCount: 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
};