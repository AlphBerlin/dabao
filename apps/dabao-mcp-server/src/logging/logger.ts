/**
 * Logger module using Winston
 * Provides structured logging for the application
 */

import winston from 'winston';
import { PrismaClient } from '@prisma/client';

// Prisma client instance for audit logging
const prisma = new PrismaClient();

// Configure Winston logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'mcp-server' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // File transport for production
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// Add file transports only in production
if (process.env.NODE_ENV === 'production') {
  // Remove console transport in production if needed
  // logger.remove(winston.transports.Console);
}

/**
 * Log an audit event to both Winston and the database
 * @param userId The ID of the user who performed the action
 * @param eventType The type of event (e.g., 'authentication', 'message_creation')
 * @param resource The resource being accessed (e.g., 'message', 'user')
 * @param outcome The outcome of the event (e.g., 'success', 'failure')
 * @param metadata Additional metadata about the event
 */
export async function logAuditEvent(
  userId: string,
  eventType: string,
  resource: string,
  outcome: string,
  metadata: Record<string, any> = {}
) {
  try {
    // Log to Winston
    logger.info(`Audit: ${eventType} on ${resource} - ${outcome}`, {
      audit: true,
      userId,
      eventType,
      resource,
      outcome,
      metadata
    });

    // Log to database
    await prisma.auditLog.create({
      data: {
        userId,
        eventType,
        resource,
        outcome,
        metadata: metadata as any
      }
    });
  } catch (error) {
    logger.error('Failed to log audit event', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      eventType,
      resource
    });
  }
}

/**
 * Performance tracking wrapper function
 * Wraps a function and logs its execution time
 * @param func The function to wrap
 * @param operation The operation name to log
 * @returns The wrapped function with performance logging
 */
export function withPerformanceTracking<T extends (...args: any[]) => Promise<any>>(
  func: T,
  operation: string
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const start = performance.now();
    try {
      const result = await func(...args);
      const end = performance.now();
      logger.debug(`Performance: ${operation} completed in ${(end - start).toFixed(2)}ms`);
      return result;
    } catch (error) {
      const end = performance.now();
      logger.warn(`Performance: ${operation} failed after ${(end - start).toFixed(2)}ms`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }) as T;
}

/**
 * Log performance metrics
 * Use this to log manual performance metrics in code
 * @param operation The operation name
 * @param durationMs The duration in milliseconds
 * @param metadata Additional context
 */
export function logPerformance(
  operation: string, 
  durationMs: number, 
  metadata: Record<string, any> = {}
): void {
  logger.debug(`Performance: ${operation} took ${durationMs.toFixed(2)}ms`, {
    performance: true,
    operation,
    durationMs,
    ...metadata
  });
}

export default {
  logger,
  logAuditEvent,
  withPerformanceTracking,
  logPerformance
};