import { logger } from "../logging/logger.js";

/**
 * Log an audit event for tracking user actions
 * This is a simplified mock implementation that just logs to console
 * In a production setup, this would write to database or external audit service
 * 
 * @param {string} eventType - The type of event being audited
 * @param {string} resource - The resource being accessed
 * @param {string} userId - The user ID performing the action
 * @param {string} outcome - The outcome of the action (success/failure)
 * @param {object} metadata - Additional metadata about the event
 * @returns {Promise<void>}
 */
export async function auditLog(
  eventType,
  resource,
  userId,
  outcome,
  metadata = {}
) {
  try {
    logger.info(`Audit: ${eventType} on ${resource} - ${outcome}`, {
      audit: true,
      eventType,
      resource,
      userId,
      outcome,
      metadata,
    });
    
    // In a real implementation, you would save to database
    // Using mock implementation for now
    return Promise.resolve();
  } catch (error) {
    logger.error("Failed to log audit event", {
      error,
      eventType,
      resource,
      userId,
    });
    return Promise.resolve(); // Don't fail if audit logging fails
  }
}