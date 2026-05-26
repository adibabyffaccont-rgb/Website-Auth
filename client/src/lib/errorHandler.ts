/**
 * Comprehensive Error Handling Utility
 * Provides consistent error handling and user-friendly messages across the app
 */

import { toast as showToast } from "@/hooks/use-toast";

// Error message mapping for common errors
const ERROR_MESSAGES: Record<string, string> = {
  // Authentication errors
  'Invalid credentials': 'The email or password you entered is incorrect. Please try again.',
  'User not found': 'No account found with this email address.',
  'Email already exists': 'An account with this email already exists. Please log in instead.',
  'Invalid token': 'Your session has expired. Please log in again.',
  'Unauthorized': 'You do not have permission to perform this action.',
  
  // User creation errors
  'Username already exists': 'This username is already taken. Please choose a different one.',
  'Username already exists in this application': 'This username is already registered for this application. Please choose a different username.',
  'Invalid or expired license key': 'The license key you entered is invalid or has expired. Please check and try again.',
  'License key has reached maximum user limit': 'This license key has reached its maximum user limit. Please use a different license key.',
  
  // Application errors
  'Application not found': 'The requested application does not exist or has been deleted.',
  'Access denied': 'You do not have permission to access this resource.',
  
  // Network errors
  'Network request failed': 'Unable to connect to the server. Please check your internet connection and try again.',
  'Failed to fetch': 'Unable to connect to the server. Please check your internet connection.',
  
  // Validation errors
  'Invalid input': 'Please check your input and make sure all required fields are filled correctly.',
  'Required field missing': 'Please fill in all required fields.',
  'Invalid email format': 'Please enter a valid email address.',
  'Password too short': 'Password must be at least 8 characters long.',
  
  // GitHub/Storage errors
  'Bad credentials': 'GitHub authentication failed. Please check your configuration.',
  'Repository not found': 'The data repository could not be found. Please contact support.',
};

/**
 * Get a user-friendly error message
 */
export function getUserFriendlyMessage(error: any): string {
  // If error is a string
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || error;
  }
  
  // If error has a message property
  if (error?.message) {
    const message = error.message;
    
    // Check for known error patterns
    for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
      if (message.includes(key)) {
        return value;
      }
    }
    
    // Return the original message if no mapping found
    return message;
  }
  
  // Default error message
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Extract error details from various error formats
 */
export function extractErrorDetails(error: any): { title: string; description: string } {
  // Handle ZodError with validation errors
  if (error?.errors && Array.isArray(error.errors)) {
    const errorMessages = error.errors
      .map((err: any) => `${err.path?.join('.')}: ${err.message}`)
      .join(', ');
    return {
      title: 'Validation Error',
      description: errorMessages || 'Please check your input and try again.',
    };
  }
  
  // Handle standard error objects
  if (error?.message) {
    const message = getUserFriendlyMessage(error.message);
    
    // Determine title based on error type
    let title = 'Error';
    if (message.includes('permission') || message.includes('Unauthorized')) {
      title = 'Permission Denied';
    } else if (message.includes('not found')) {
      title = 'Not Found';
    } else if (message.includes('already exists')) {
      title = 'Already Exists';
    } else if (message.includes('invalid') || message.includes('incorrect')) {
      title = 'Invalid Input';
    } else if (message.includes('expired')) {
      title = 'Expired';
    } else if (message.includes('connection') || message.includes('network')) {
      title = 'Connection Error';
    }
    
    return { title, description: message };
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return {
      title: 'Error',
      description: getUserFriendlyMessage(error),
    };
  }
  
  // Default error
  return {
    title: 'Error',
    description: 'An unexpected error occurred. Please try again.',
  };
}

/**
 * Show error toast with proper formatting
 */
export function showError(error: any, customTitle?: string) {
  const { title, description } = extractErrorDetails(error);
  
  showToast({
    variant: "destructive",
    title: customTitle || title,
    description: description,
    duration: 5000, // Show errors for 5 seconds
  });
}

/**
 * Show success toast
 */
export function showSuccess(title: string, description?: string) {
  showToast({
    variant: "success",
    title: title,
    description: description,
    duration: 4000,
  });
}

/**
 * Show warning toast
 */
export function showWarning(title: string, description?: string) {
  showToast({
    variant: "warning",
    title: title,
    description: description,
    duration: 5000,
  });
}

/**
 * Show info toast
 */
export function showInfo(title: string, description?: string) {
  showToast({
    variant: "default",
    title: title,
    description: description,
    duration: 4000,
  });
}

/**
 * Handle API errors with automatic retry suggestion for network issues
 */
export function handleApiError(error: any, context?: string) {
  const { title, description } = extractErrorDetails(error);
  
  // Add context to title if provided
  const finalTitle = context ? `${context}: ${title}` : title;
  
  // Check if it's a network error
  const isNetworkError = 
    description.includes('connection') || 
    description.includes('network') ||
    description.includes('fetch') ||
    error?.name === 'NetworkError' ||
    error?.name === 'TypeError';
  
  showToast({
    variant: "destructive",
    title: finalTitle,
    description: isNetworkError 
      ? `${description} Would you like to try again?`
      : description,
    duration: 5000,
  });
}

/**
 * Validate form fields and show errors
 */
export function validateAndShowErrors(fields: Record<string, any>, requiredFields: string[]): boolean {
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    if (!fields[field] || (typeof fields[field] === 'string' && !fields[field].trim())) {
      missingFields.push(field);
    }
  }
  
  if (missingFields.length > 0) {
    showError({
      message: `Please fill in the following required fields: ${missingFields.join(', ')}`,
    }, 'Missing Required Fields');
    return false;
  }
  
  return true;
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorContext?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleApiError(error, errorContext);
      throw error; // Re-throw for component-level handling if needed
    }
  }) as T;
}

