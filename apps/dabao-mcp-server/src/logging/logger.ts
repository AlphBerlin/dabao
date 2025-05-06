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

export default {
  logger,
  logAuditEvent
};