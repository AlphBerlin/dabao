// Helper utility for retrying async operations with exponential backoff
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
    shouldRetry?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 500,
    maxDelay = 5000,
    factor = 2,
    shouldRetry = (error: any) => 
      error?.status === 429 || 
      (error?.error?.status === 429) ||
      (error?.message && error.message.includes('rate limit'))
  } = options;

  let lastError: any;
  let delay = initialDelay;

  for (let retries = 0; retries <= maxRetries; retries++) {
    try {
      // Wait before retrying (except for the first attempt)
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        // Update delay for next attempt using exponential backoff
        delay = Math.min(delay * factor, maxDelay);
      }
      
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // If this is the last retry or we shouldn't retry this error, throw it
      if (retries === maxRetries || !shouldRetry(error)) {
        throw error;
      }
      
      console.warn(`Request failed, retrying (${retries+1}/${maxRetries})`, error);
    }
  }

  // This should not be reachable, but TypeScript requires it
  throw lastError;
}
