/**
 * Cookie utility functions for managing cookies in browser environment
 */

/**
 * Get a cookie value by name
 * @param name The name of the cookie to get
 * @returns The cookie value or undefined if not found
 */
export async function getCookie(name: string): Promise<string | undefined> {
  if (typeof document === 'undefined') {
    return undefined;
  }
  
  const cookies = document.cookie.split(';');
  
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i]!.trim();
    
    // Check if this cookie has the name we're looking for
    if (cookie.startsWith(name + '=')) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  
  return undefined;
}

/**
 * Set a cookie with the given name and value
 * @param name The name of the cookie
 * @param value The value to store
 * @param options Additional cookie options
 */
export function setCookie(
  name: string,
  value: string,
  options: {
    days?: number;
    path?: string;
    domain?: string;
    sameSite?: 'strict' | 'lax' | 'none';
    secure?: boolean;
  } = {}
): void {
  if (typeof document === 'undefined') {
    return;
  }
  
  const { days = 30, path = '/', domain, sameSite = 'lax', secure = true } = options;
  
  // Calculate expiration date
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  
  // Build cookie string
  let cookieString = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=${path}`;
  
  if (domain) {
    cookieString += `; domain=${domain}`;
  }
  
  cookieString += `; samesite=${sameSite}`;
  
  if (secure) {
    cookieString += '; secure';
  }
  
  document.cookie = cookieString;
}

/**
 * Delete a cookie by setting its expiration in the past
 * @param name The name of the cookie to delete
 * @param path The path of the cookie
 * @param domain The domain of the cookie
 */
export function deleteCookie(name: string, path = '/', domain?: string): void {
  if (typeof document === 'undefined') {
    return;
  }
  
  let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
  
  if (domain) {
    cookieString += `; domain=${domain}`;
  }
  
  document.cookie = cookieString;
}

/**
 * Get all cookies as an object
 * @returns Object with all cookies
 */
export function getAllCookies(): Record<string, string> {
  if (typeof document === 'undefined') {
    return {};
  }
  
  return document.cookie.split(';').reduce((cookies, cookie) => {
    const [name, value] = cookie.trim().split('=').map(c => c.trim());
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
    return cookies;
  }, {} as Record<string, string>);
}