import { logger } from "../logging/logger.js";

/**
 * Simple audit logging module
 * 
 * Logs audit events for tracking user actions
 */

/**
 * Log an audit event
 * 
 * @param {string} eventType - The type of event being audited
 * @param {string} resource - The resource being accessed
 * @param {string} userId - The user ID performing the action
 * @param {string} outcome - The outcome of the action (success/failure)
 * @param {Object} metadata - Additional metadata about the event
 * @returns {Promise<void>} Promise that resolves when logging is complete
 */
export async function auditLog(eventType, resource, userId, outcome, metadata = {}) {
  console.log(`[AUDIT] ${eventType} | ${resource} | ${userId} | ${outcome} | ${JSON.stringify(metadata)}`);
  return Promise.resolve();
}