import {
  isValidEmail,
  isValidPassword,
  isValidPhone,
  isValidName,
  isValidAge,
  isValidMoodRating,
  containsCrisisKeywords,
  isValidAppointmentTime,
  sanitizeText,
  validateMentalHealthNote
} from '../validation';

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    it('validates correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('student@university.edu')).toBe(true);
    });

    it('rejects invalid email formats', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user@domain')).toBe(false);
    });

    it('handles edge cases', () => {
      expect(isValidEmail(null as any)).toBe(false);
      expect(isValidEmail(undefined as any)).toBe(false);
      expect(isValidEmail('  test@example.com  ')).toBe(true); // trimmed
    });
  });

  describe('isValidPassword', () => {
    it('validates strong passwords', () => {
      expect(isValidPassword('Password123')).toEqual({ isValid: true });
      expect(isValidPassword('MySecure1Password')).toEqual({ isValid: true });
    });

    it('rejects weak passwords with specific messages', () => {
      expect(isValidPassword('')).toEqual({
        isValid: false,
        message: 'Password is required'
      });

      expect(isValidPassword('short')).toEqual({
        isValid: false,
        message: 'Password must be at least 8 characters long'
      });

      expect(isValidPassword('password123')).toEqual({
        isValid: false,
        message: 'Password must contain at least one uppercase letter'
      });

      expect(isValidPassword('PASSWORD123')).toEqual({
        isValid: false,
        message: 'Password must contain at least one lowercase letter'
      });

      expect(isValidPassword('Password')).toEqual({
        isValid: false,
        message: 'Password must contain at least one number'
      });
    });
  });

  describe('isValidPhone', () => {
    it('validates Indian phone number formats', () => {
      expect(isValidPhone('9876543210')).toBe(true);
      expect(isValidPhone('+919876543210')).toBe(true);
      expect(isValidPhone('919876543210')).toBe(true);
      expect(isValidPhone('+91 9876543210')).toBe(true);
      expect(isValidPhone('+91-9876543210')).toBe(true);
    });

    it('rejects invalid phone numbers', () => {
      expect(isValidPhone('1234567890')).toBe(false); // doesn't start with 7/8/9
      expect(isValidPhone('987654321')).toBe(false); // too short
      expect(isValidPhone('98765432100')).toBe(false); // too long
      expect(isValidPhone('')).toBe(false);
    });
  });

  describe('isValidName', () => {
    it('validates proper names', () => {
      expect(isValidName('John Doe')).toBe(true);
      expect(isValidName("O'Connor")).toBe(true);
      expect(isValidName('Mary-Jane')).toBe(true);
      expect(isValidName('Priya Sharma')).toBe(true);
    });

    it('rejects invalid names', () => {
      expect(isValidName('')).toBe(false);
      expect(isValidName('A')).toBe(false); // too short
      expect(isValidName('John123')).toBe(false); // contains numbers
      expect(isValidName('John@Doe')).toBe(false); // contains special chars
    });
  });

  describe('isValidAge', () => {
    it('validates appropriate age range for mental health platform', () => {
      expect(isValidAge(13)).toBe(true);
      expect(isValidAge(18)).toBe(true);
      expect(isValidAge(25)).toBe(true);
      expect(isValidAge(100)).toBe(true);
    });

    it('rejects ages outside appropriate range', () => {
      expect(isValidAge(12)).toBe(false);
      expect(isValidAge(101)).toBe(false);
      expect(isValidAge(-5)).toBe(false);
      expect(isValidAge(0)).toBe(false);
    });
  });

  describe('isValidMoodRating', () => {
    it('validates mood scale (1-5)', () => {
      expect(isValidMoodRating(1)).toBe(true);
      expect(isValidMoodRating(3)).toBe(true);
      expect(isValidMoodRating(5)).toBe(true);
    });

    it('rejects invalid mood ratings', () => {
      expect(isValidMoodRating(0)).toBe(false);
      expect(isValidMoodRating(6)).toBe(false);
      expect(isValidMoodRating(-1)).toBe(false);
    });
  });

  describe('containsCrisisKeywords', () => {
    it('detects crisis keywords in English', () => {
      expect(containsCrisisKeywords('I want to kill myself')).toBe(true);
      expect(containsCrisisKeywords('suicide is the only option')).toBe(true);
      expect(containsCrisisKeywords("I can't go on anymore")).toBe(true);
      expect(containsCrisisKeywords('better off dead')).toBe(true);
    });

    it('detects crisis keywords in other languages', () => {
      expect(containsCrisisKeywords('मैं आत्महत्या करना चाहता हूं')).toBe(true);
      expect(containsCrisisKeywords('خودکشی کرنا چاہتا ہوں')).toBe(true);
    });

    it('returns false for non-crisis text', () => {
      expect(containsCrisisKeywords('I feel sad today')).toBe(false);
      expect(containsCrisisKeywords('I need help with anxiety')).toBe(false);
      expect(containsCrisisKeywords('feeling stressed about exams')).toBe(false);
    });

    it('handles edge cases', () => {
      expect(containsCrisisKeywords('')).toBe(false);
      expect(containsCrisisKeywords(null as any)).toBe(false);
    });
  });

  describe('isValidAppointmentTime', () => {
    beforeEach(() => {
      // Mock current time to make tests predictable
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01T10:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('validates future appointments during working hours', () => {
      const result = isValidAppointmentTime('2024-01-02', '14:00');
      expect(result.isValid).toBe(true);
    });

    it('rejects past appointments', () => {
      const result = isValidAppointmentTime('2023-12-31', '14:00');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Appointment must be scheduled for a future time');
    });

    it('rejects appointments outside working hours', () => {
      const earlyResult = isValidAppointmentTime('2024-01-02', '08:00');
      expect(earlyResult.isValid).toBe(false);
      expect(earlyResult.message).toBe('Appointments are only available between 9 AM and 6 PM');

      const lateResult = isValidAppointmentTime('2024-01-02', '19:00');
      expect(lateResult.isValid).toBe(false);
      expect(lateResult.message).toBe('Appointments are only available between 9 AM and 6 PM');
    });
  });

  describe('sanitizeText', () => {
    it('removes script tags and HTML', () => {
      expect(sanitizeText('<script>alert("xss")</script>Hello')).toBe('Hello');
      expect(sanitizeText('<div>Hello <b>world</b></div>')).toBe('Hello world');
    });

    it('trims whitespace', () => {
      expect(sanitizeText('  hello world  ')).toBe('hello world');
    });

    it('handles empty and null inputs', () => {
      expect(sanitizeText('')).toBe('');
      expect(sanitizeText(null as any)).toBe('');
      expect(sanitizeText(undefined as any)).toBe('');
    });
  });

  describe('validateMentalHealthNote', () => {
    it('validates normal mental health notes', () => {
      const result = validateMentalHealthNote('Feeling anxious about upcoming exams');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('Feeling anxious about upcoming exams');
    });

    it('sanitizes HTML from notes', () => {
      const result = validateMentalHealthNote('<script>alert("test")</script>I feel sad');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('I feel sad');
    });

    it('rejects notes that are too long', () => {
      const longNote = 'a'.repeat(1001);
      const result = validateMentalHealthNote(longNote);
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Note must be less than 1000 characters');
    });

    it('handles empty notes gracefully', () => {
      const result = validateMentalHealthNote('');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('');
    });
  });
});