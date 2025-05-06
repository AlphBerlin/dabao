/**
 * Configuration module for Dabao MCP Server
 * Centralizes all configurable settings and loads them from environment variables
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

// Server configuration
export const SERVER_CONFIG = {
  name: 'dabao-mcp-server',
  version: process.env.npm_package_version || '0.6.2',
  environment: process.env.NODE_ENV || 'development',
  grpcPort: parseInt(process.env.GRPC_PORT || '50051', 10),
  enableStdio: process.env.ENABLE_STDIO === 'true',
};

// Authentication configuration
export const AUTH_CONFIG = {
  jwtSecret: process.env.JWT_SECRET || 'default_secret_change_in_production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_change_in_production',
  jwtExpiry: parseInt(process.env.JWT_EXPIRY || '3600', 10), // Default: 1 hour
  refreshTokenExpiry: parseInt(process.env.REFRESH_TOKEN_EXPIRY || '604800', 10), // Default: 7 days
};

// Database configuration
export const DB_CONFIG = {
  url: process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/dabao',
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
  idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
};

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10), // Default: 1 minute
};

// Logging configuration
export const LOGGING_CONFIG = {
  level: process.env.LOG_LEVEL || 'info',
  enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true',
  logDir: process.env.LOG_DIR || 'logs',
  includeTimestamp: true,
};

// Telegram API configuration
export const TELEGRAM_CONFIG = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || '',
  apiUrl: 'https://api.telegram.org',
};

// Intent recognition configuration
export const INTENT_CONFIG = {
  confidenceThreshold: parseFloat(process.env.INTENT_CONFIDENCE_THRESHOLD || '0.6'),
  contextExpirySeconds: parseInt(process.env.CONTEXT_EXPIRY_SECONDS || '3600', 10), // Default: 1 hour
};

/**
 * Validate critical configuration
 * Throws an error if any required configuration is missing
 */
export function validateConfig(): void {
  const missingVars: string[] = [];

  // Check production environment
  if (SERVER_CONFIG.environment === 'production') {
    // In production, JWT secrets must be set
    if (AUTH_CONFIG.jwtSecret === 'default_secret_change_in_production') {
      missingVars.push('JWT_SECRET');
    }
    
    if (AUTH_CONFIG.jwtRefreshSecret === 'default_refresh_secret_change_in_production') {
      missingVars.push('JWT_REFRESH_SECRET');
    }
    
    // Database URL must be set
    if (DB_CONFIG.url === 'postgres://user:password@localhost:5432/dabao') {
      missingVars.push('DATABASE_URL');
    }

    // Telegram bot token might be required depending on features
    if (TELEGRAM_CONFIG.botToken === '' && TELEGRAM_CONFIG.webhookUrl !== '') {
      missingVars.push('TELEGRAM_BOT_TOKEN');
    }
  }

  // If any required variables are missing, throw an error
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

/**
 * Get a resolved path within the project
 * @param relativePath Path relative to project root
 * @returns Absolute path
 */
export function resolveProjectPath(relativePath: string): string {
  return path.resolve(process.cwd(), relativePath);
}

// Export a default config object
export default {
  server: SERVER_CONFIG,
  auth: AUTH_CONFIG,
  db: DB_CONFIG,
  rateLimit: RATE_LIMIT_CONFIG,
  logging: LOGGING_CONFIG,
  telegram: TELEGRAM_CONFIG,
  intent: INTENT_CONFIG,
  validate: validateConfig,
  resolvePath: resolveProjectPath,
};