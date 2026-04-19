/**
 * Validation utility functions for NEONEXUS Mental Health Platform
 * Handles form validation, input sanitization, and data validation
 */

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Password validation regex (at least 8 characters, 1 uppercase, 1 lowercase, 1 number)
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

/**
 * Phone number validation regex (Indian format)
 */
const PHONE_REGEX = /^(\+91[\-\s]?)?[0]?(91)?[789]\d{9}$/;

/**
 * Validates email address format
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
};

/**
 * Validates password strength
 */
export const isValidPassword = (password: string): { isValid: boolean; message?: string } => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }

  if (!/\d/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }

  return { isValid: true };
};

/**
 * Validates phone number format (Indian)
 */
export const isValidPhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') return false;
  return PHONE_REGEX.test(phone.trim());
};

/**
 * Validates name format (no numbers, special characters)
 */
export const isValidName = (name: string): boolean => {
  if (!name || typeof name !== 'string') return false;
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  return nameRegex.test(name.trim()) && name.trim().length >= 2;
};

/**
 * Validates age (between 13-100 for mental health platform)
 */
export const isValidAge = (age: number): boolean => {
  return typeof age === 'number' && age >= 13 && age <= 100;
};

/**
 * Validates mood rating (1-5 scale)
 */
export const isValidMoodRating = (rating: number): boolean => {
  return typeof rating === 'number' && rating >= 1 && rating <= 5;
};

/**
 * Validates institution ID format
 */
export const isValidInstitutionId = (id: string): boolean => {
  if (!id || typeof id !== 'string') return false;
  // Basic format: letters, numbers, and hyphens, 3-20 characters
  const idRegex = /^[A-Za-z0-9\-]{3,20}$/;
  return idRegex.test(id.trim());
};

/**
 * Sanitizes text input by removing potentially harmful characters
 */
export const sanitizeText = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  
  // Remove script tags and other potentially harmful content
  const sanitized = text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .trim();
    
  return sanitized;
};

/**
 * Validates and sanitizes user input for mental health notes
 */
export const validateMentalHealthNote = (note: string): { isValid: boolean; sanitized: string; message?: string } => {
  if (!note || typeof note !== 'string') {
    return { isValid: true, sanitized: '' }; // Optional field
  }

  if (note.length > 1000) {
    return { 
      isValid: false, 
      sanitized: '', 
      message: 'Note must be less than 1000 characters' 
    };
  }

  const sanitized = sanitizeText(note);
  return { isValid: true, sanitized };
};

/**
 * Validates crisis detection keywords (basic implementation)
 */
export const containsCrisisKeywords = (text: string): boolean => {
  if (!text || typeof text !== 'string') return false;
  
  const crisisKeywords = [
    'suicide', 'kill myself', 'end it all', 'no point living', 'want to die',
    'hurt myself', 'can\'t go on', 'better off dead', 'suicide plan',
    // Hindi keywords
    'आत्महत्या', 'मरना चाहता हूं', 'जीने का मन नहीं', 'खुद को मारना',
    // Urdu keywords
    'خودکشی', 'مرنا چاہتا ہوں', 'زندگی سے تنگ'
  ];

  const lowerText = text.toLowerCase();
  return crisisKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
};

/**
 * Validates appointment booking time
 */
export const isValidAppointmentTime = (date: string, time: string): { isValid: boolean; message?: string } => {
  const appointmentDate = new Date(`${date} ${time}`);
  const now = new Date();
  
  if (appointmentDate <= now) {
    return { isValid: false, message: 'Appointment must be scheduled for a future time' };
  }
  
  const diffHours = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (diffHours < 1) {
    return { isValid: false, message: 'Appointment must be at least 1 hour in advance' };
  }
  
  // Check if it's within working hours (9 AM - 6 PM)
  const hour = appointmentDate.getHours();
  if (hour < 9 || hour >= 18) {
    return { isValid: false, message: 'Appointments are only available between 9 AM and 6 PM' };
  }
  
  return { isValid: true };
};

/**
 * Validates form data against a schema
 */
export const validateForm = <T extends Record<string, any>>(
  data: T,
  schema: Record<keyof T, (value: any) => boolean | { isValid: boolean; message?: string }>
): { isValid: boolean; errors: Partial<Record<keyof T, string>> } => {
  const errors: Partial<Record<keyof T, string>> = {};
  let isValid = true;

  Object.keys(schema).forEach((key) => {
    const validator = schema[key as keyof T];
    const value = data[key as keyof T];
    const result = validator(value);

    if (typeof result === 'boolean') {
      if (!result) {
        errors[key as keyof T] = `${key} is invalid`;
        isValid = false;
      }
    } else if (!result.isValid) {
      errors[key as keyof T] = result.message || `${key} is invalid`;
      isValid = false;
    }
  });

  return { isValid, errors };
};