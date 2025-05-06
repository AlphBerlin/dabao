import { logger, logAuditEvent } from "../logging/logger.js";

// Define custom error types 
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Permission denied') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`Resource not found: ${resource}`);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends Error {
  constructor() {
    super('Rate limit exceeded');
    this.name = 'RateLimitError';
  }
}

/**
 * Error boundary utility to safely execute a function and handle any errors
 * @param fn Function to execute
 * @param userId User ID for logging
 * @param operation Name of the operation being performed
 * @param fallbackValue Optional fallback value to return on error
 * @returns Result of the function or fallback value
 */
export async function withErrorBoundary<T>(
  fn: () => Promise<T>,
  userId: string,
  operation: string,
  fallbackValue?: T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    // Log the error with context
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error(`Error in ${operation}`, {
      userId,
      operation,
      error: errorMessage,
      stack: errorStack
    });
    
    // Log an audit event for security-related errors
    if (
      error instanceof AuthenticationError ||
      error instanceof AuthorizationError ||
      error instanceof RateLimitError
    ) {
      logAuditEvent(
        userId,
        'error',
        operation,
        'failed',
        { error: errorMessage }
      );
    }
    
    // If a fallback value was provided, return it
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }
    
    // Otherwise, rethrow the error
    throw error;
  }
}

/**
 * Converts an error to a standardized error response object
 * @param error The error to convert
 * @returns Standardized error response object
 */
export function toErrorResponse(error: unknown): {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  }
} {
  if (error instanceof ValidationError) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message
      }
    };
  } else if (error instanceof AuthenticationError) {
    return {
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: error.message
      }
    };
  } else if (error instanceof AuthorizationError) {
    return {
      success: false,
      error: {
        code: 'AUTHORIZATION_ERROR',
        message: error.message
      }
    };
  } else if (error instanceof NotFoundError) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: error.message
      }
    };
  } else if (error instanceof RateLimitError) {
    return {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: error.message
      }
    };
  } else {
    // Generic error or unknown error type
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: errorMessage
      }
    };
  }
}

/**
 * Recoverable error handler that attempts to recover from certain types of errors
 * @param fn Function to execute
 * @param retries Number of retry attempts
 * @param delay Delay between retries in milliseconds
 * @returns Result of the function or throws if all retries fail
 */
export async function withRecovery<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry for certain error types
      if (
        error instanceof ValidationError ||
        error instanceof AuthenticationError ||
        error instanceof AuthorizationError
      ) {
        throw error;
      }
      
      // If we've used all our retries, throw the last error
      if (attempt === retries) {
        throw error;
      }
      
      // Log the retry attempt
      logger.warn(`Retrying operation (${attempt + 1}/${retries})`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never happen due to the throws above, but TypeScript doesn't know that
  throw lastError;
}