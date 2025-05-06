import { logger, logAuditEvent } from "../logging/logger.js";
import { z } from "zod";

// Request rate limiting
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;  // 100 requests per minute

/**
 * Checks if a request from a user is within rate limits
 * @param userId The ID of the user making the request
 * @returns Boolean indicating if the request is allowed
 */
export function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const key = `rate_limit:${userId}`;
  
  // Get current rate limit entry or create a new one
  const entry = rateLimits.get(key) || {
    count: 0,
    resetAt: now + RATE_LIMIT_WINDOW
  };
  
  // Reset if the window has expired
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + RATE_LIMIT_WINDOW;
  }
  
  // Check if the user has exceeded the limit
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    logger.warn(`Rate limit exceeded for user ${userId}`);
    logAuditEvent(userId, "rate_limit", "api", "exceeded", {
      count: entry.count,
      limit: RATE_LIMIT_MAX_REQUESTS,
      windowMs: RATE_LIMIT_WINDOW
    });
    return false;
  }
  
  // Increment the count and update the map
  entry.count++;
  rateLimits.set(key, entry);
  
  return true;
}

/**
 * Generic function to validate request against a Zod schema
 * @param data The data to validate
 * @param schema The Zod schema to validate against
 * @returns Validated data or throws an error
 */
export function validateRequest<T>(data: unknown, schema: z.ZodType<T>): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      logger.error(`Validation error: ${errorMessages}`);
      throw new Error(`Validation failed: ${errorMessages}`);
    }
    throw error;
  }
}

/**
 * Sanitizes object data to prevent data leakage
 * @param data The data object to sanitize
 * @param allowedFields Array of field names that are allowed
 * @returns Sanitized data object
 */
export function sanitizeOutput<T extends Record<string, any>>(
  data: T,
  allowedFields: string[]
): Partial<T> {
  const sanitized: Partial<T> = {};
  
  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      sanitized[field as keyof T] = data[field];
    }
  }
  
  return sanitized;
}

/**
 * Error handling middleware that properly formats and logs errors
 * @param error The error to handle
 * @returns Properly formatted error response
 */
export function handleError(error: unknown): { 
  message: string; 
  code: string; 
  details?: string;
} {
  if (error instanceof Error) {
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.message
      };
    } else if (error.name === 'AuthenticationError') {
      return {
        message: 'Authentication failed',
        code: 'AUTH_FAILED',
      };
    } else if (error.name === 'NotFoundError') {
      return {
        message: 'Resource not found',
        code: 'NOT_FOUND',
      };
    }
    
    // Generic error handling
    logger.error(`Unhandled error: ${error.message}`, { stack: error.stack });
    return {
      message: error.message || 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
    };
  }
  
  // Unknown error type
  logger.error('Unknown error type', { error });
  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };
}

// Schema definitions for request validation
export const CampaignCreateSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  scheduledDate: z.string().optional(),
});

export const TelegramMessageSchema = z.object({
  chatId: z.string().min(1, "Chat ID is required"),
  message: z.string().min(1, "Message is required"),
  useMarkdown: z.boolean().optional(),
  mediaUrls: z.array(z.string()).optional(),
  silent: z.boolean().optional(),
  replyToMessageId: z.string().optional(),
});

export const AnalyticsRequestSchema = z.object({
  campaignId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  metrics: z.array(z.string()).optional(),
});

export const ReportRequestSchema = z.object({
  reportType: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  parameters: z.record(z.string()).optional(),
  format: z.enum(['pdf', 'csv', 'json']).optional().default('pdf'),
});