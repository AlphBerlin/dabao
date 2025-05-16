// Utility functions for generating cryptographically secure tokens and keys
import crypto from 'crypto';
import { customAlphabet } from 'nanoid';

// Create a custom nanoid function with specific characters for API keys
const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 
  32
);

/**
 * Generate a cryptographically secure API key
 * Format: dbao_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 */
export function generateApiKey(): string {
  const prefix = 'dbao_live_'; // Use different prefixes for live/test environments
  const randomPart = nanoid();
  
  return `${prefix}${randomPart}`;
}

/**
 * Generate a cryptographically secure client secret
 * Returns a 64-character hex string
 */
export function generateSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Securely hash an API key for storage
 * Don't use this if you need to retrieve the original API key later
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Verify an API key against its hash
 */
export function verifyApiKey(apiKey: string, hashedApiKey: string): boolean {
  const hash = hashApiKey(apiKey);
  return crypto.timingSafeEqual(
    Buffer.from(hash), 
    Buffer.from(hashedApiKey)
  );
}

/**
 * Generate a verification token for domain verification
 */
export function generateVerificationToken(): string {
  return `dbao-verify-${crypto.randomBytes(16).toString('hex')}`;
}
