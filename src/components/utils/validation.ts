// Centralized Form Validation Utility
// This file contains reusable validation rules and helper functions

export type ValidationRule = (value: string, allValues?: Record<string, string>) => string | null;

// ===========================================
// Phone Number Formatting Utility
// ===========================================

/**
 * Formats a phone number to US format: (XXX) XXX-XXXX
 * Strips all non-digits and formats as user types
 */
export const formatPhoneNumber = (value: string): string => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Limit to 10 digits
  const limitedDigits = digits.slice(0, 10);
  
  // Format based on length
  if (limitedDigits.length === 0) {
    return '';
  } else if (limitedDigits.length <= 3) {
    return `(${limitedDigits}`;
  } else if (limitedDigits.length <= 6) {
    return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3)}`;
  } else {
    return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
  }
};

/**
 * Extracts only digits from a formatted phone number
 */
export const extractPhoneDigits = (value: string): string => {
  return value.replace(/\D/g, '');
};

// Individual validation rules
export const rules = {
  required: (fieldName: string): ValidationRule => (value) =>
    value?.trim() ? null : `${fieldName} is required`,

  email: (): ValidationRule => (value) => {
    if (!value?.trim()) return null; // Let required rule handle empty
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : 'Please enter a valid email address';
  },

  minLength: (min: number, fieldName: string): ValidationRule => (value) => {
    if (!value?.trim()) return null;
    return value.length >= min ? null : `${fieldName} must be at least ${min} characters`;
  },

  maxLength: (max: number, fieldName: string): ValidationRule => (value) => {
    if (!value?.trim()) return null;
    return value.length <= max ? null : `${fieldName} must be less than ${max} characters`;
  },

  password: (): ValidationRule => (value) => {
    if (!value?.trim()) return null;
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
    return null;
  },

  matchesField: (fieldName: string, fieldLabel: string): ValidationRule => (value, allValues) =>
    value === allValues?.[fieldName] ? null : `Passwords do not match`,

  phone: (): ValidationRule => (value) => {
    if (!value?.trim()) return null;
    // Extract only digits from the input
    const digitsOnly = value.replace(/\D/g, '');
    // Must be exactly 10 digits
    if (digitsOnly.length !== 10) {
      return 'Phone number must be exactly 10 digits';
    }
    return null;
  },

  positiveNumber: (fieldName: string): ValidationRule => (value) => {
    if (!value?.trim()) return null;
    const num = parseFloat(value);
    return !isNaN(num) && num > 0 ? null : `${fieldName} must be a positive number`;
  },

  name: (): ValidationRule => (value) => {
    if (!value?.trim()) return null;
    if (value.trim().length < 2) return 'Name must be at least 2 characters';
    if (!/^[a-zA-Z\s'-]+$/.test(value)) return 'Name can only contain letters, spaces, hyphens, and apostrophes';
    return null;
  },
};

// Validate a single field against multiple rules
export const validateField = (
  value: string,
  validators: ValidationRule[],
  allValues?: Record<string, string>
): string | null => {
  for (const validator of validators) {
    const error = validator(value, allValues);
    if (error) return error;
  }
  return null;
};

// Validate entire form
export const validateForm = (
  values: Record<string, string>,
  validationSchema: Record<string, ValidationRule[]>
): Record<string, string | null> => {
  const errors: Record<string, string | null> = {};
  
  for (const [field, validators] of Object.entries(validationSchema)) {
    errors[field] = validateField(values[field] || '', validators, values);
  }
  
  return errors;
};

// Check if form has any errors
export const hasErrors = (errors: Record<string, string | null>): boolean => {
  return Object.values(errors).some((error) => error !== null);
};

// Pre-defined validation schemas for common forms
export const loginSchema = {
  email: [rules.required('Email'), rules.email()],
  password: [rules.required('Password')],
};

export const signupSchema = {
  name: [rules.required('Full name'), rules.name(), rules.minLength(2, 'Name')],
  email: [rules.required('Email'), rules.email()],
  password: [rules.required('Password'), rules.password()],
  confirmPassword: [rules.required('Confirm password'), rules.matchesField('password', 'Password')],
};

export const profileSchema = {
  name: [rules.required('Full name'), rules.name()],
  phone: [rules.phone()],
  height: [rules.positiveNumber('Height')],
  weight: [rules.positiveNumber('Weight')],
};

// Doctor form validation schema (for Add Doctor in Admin)
export const addDoctorSchema = {
  name: [rules.required('Full name'), rules.name(), rules.minLength(2, 'Name')],
  email: [rules.required('Email'), rules.email()],
  specialization: [rules.required('Specialization')],
  phone: [rules.required('Phone number'), rules.phone()],
  licenseNumber: [rules.required('License number'), rules.minLength(3, 'License number')],
  password: [rules.required('Password'), rules.password()],
  confirmPassword: [rules.required('Confirm password'), rules.matchesField('password', 'Password')],
};

// Doctor profile edit validation schema
export const editDoctorSchema = {
  name: [rules.required('Full name'), rules.name(), rules.minLength(2, 'Name')],
  specialization: [rules.required('Specialization')],
  phone: [rules.phone()],
  licenseNumber: [rules.minLength(3, 'License number')],
  experience: [rules.positiveNumber('Experience')],
};
