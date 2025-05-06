/**
 * Common API utilities for error handling and response processing
 */

/**
 * Custom API Error class that extends Error with status code
 */
export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

/**
 * Handle API errors uniformly across the application
 * 
 * @param error The caught error
 * @param defaultMessage Default message to display if not an ApiError
 * @returns The result of the error handling, typically rethrows or returns a default value
 */
export function handleApiError<T>(error: unknown, defaultMessage: string): T {
  console.error('API Error:', error);
  
  if (error instanceof ApiError) {
    throw error;
  }
  
  if (error instanceof Error) {
    throw new ApiError(error.message);
  }
  
  throw new ApiError(defaultMessage);
}

/**
 * Helper function to check if a response is successful
 */
export function checkResponse(response: Response, errorMessage: string): void {
  if (!response.ok) {
    throw new ApiError(
      `${errorMessage}: ${response.statusText}`, 
      response.status
    );
  }
}

/**
 * Parse JSON with error handling
 */
export async function parseJSON<T>(response: Response): Promise<T> {
  try {
    return await response.json() as T;
  } catch (error) {
    throw new ApiError('Failed to parse JSON response');
  }
}