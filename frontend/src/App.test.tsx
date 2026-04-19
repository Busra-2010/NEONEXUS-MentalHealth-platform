import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock matchMedia for window since JSDOM doesn't support it
beforeAll(() => {
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
});

test('renders the login page initially', () => {
  render(<App />);
  // The login page header should be present
  const loginHeaderElements = screen.getAllByText(/Welcome to NEONEXUS|Sign in to your account/i);
  expect(loginHeaderElements.length).toBeGreaterThan(0);
});
