/**
 * Log an audit event for tracking user actions
 * 
 * @param eventType - The type of event being audited
 * @param resource - The resource being accessed
 * @param userId - The user ID performing the action
 * @param outcome - The outcome of the action (success/failure)
 * @param metadata - Additional metadata about the event
 * @returns Promise that resolves when logging is complete
 */
export function auditLog(
  eventType: string,
  resource: string,
  userId: string,
  outcome: string,
  metadata?: Record<string, any>
): Promise<void>;