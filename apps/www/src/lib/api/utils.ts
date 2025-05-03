/**
 * Handles API errors and provides standardized error handling
 */
export async function handleApiError(response: Response): Promise<never> {
  let errorData;
  try {
    errorData = await response.json();
  } catch (e) {
    errorData = { message: `HTTP error ${response.status}` };
  }

  const error = new Error(
    errorData.message || `API error (${response.status})`
  ) as Error & { status?: number; code?: string };
  
  error.status = response.status;
  if (errorData.code) {
    error.code = errorData.code;
  }
  
  throw error;
}
