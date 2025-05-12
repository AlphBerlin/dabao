/**
 * Base API client for making HTTP requests
 * This file provides a standardized way to make API calls throughout the application
 */

// API base URL - modify as needed for your environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

// Common request headers
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

// Request types
export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions {
  method?: RequestMethod;
  headers?: Record<string, string>;
  body?: any;
  credentials?: RequestCredentials;
  cache?: RequestCache;
}

/**
 * Make an API request with standardized error handling
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body,
    credentials = 'include',
    cache = 'default',
  } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const requestOptions: RequestInit = {
    method,
    headers: {
      ...DEFAULT_HEADERS,
      ...headers,
    },
    credentials,
    cache,
  };

  if (body) {
    requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, requestOptions);
    
    // Check if the response is successful
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: 'An unknown error occurred',
      }));
      
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    
    // Check for empty response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return response.text() as unknown as T;
  } catch (error) {
    console.error(`API request failed for ${url}:`, error);
    throw error;
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T = any>(endpoint: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body: any, options: Omit<RequestOptions, 'method'> = {}) =>
    apiRequest<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T = any>(endpoint: string, body: any, options: Omit<RequestOptions, 'method'> = {}) =>
    apiRequest<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T = any>(endpoint: string, body: any, options: Omit<RequestOptions, 'method'> = {}) =>
    apiRequest<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T = any>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

/**
 * API response types
 */
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}