/**
 * Database helper for PostgreSQL connections
 * Provides a clean interface for database operations
 */

import pg from 'pg';
import { DB_CONFIG } from './config';
import { logger } from '../logging/logger';

// Create a connection pool
const pool = new pg.Pool({
  connectionString: DB_CONFIG.url,
  max: DB_CONFIG.maxConnections,
  idleTimeoutMillis: DB_CONFIG.idleTimeout,
});

// Log database events
pool.on('connect', () => {
  logger.debug('Database connection established');
});

pool.on('error', (error) => {
  logger.error('Database connection error', error);
});

/**
 * Execute a database query
 * @param text SQL query text
 * @param params Query parameters
 * @returns Query result
 */
export async function query<T = any>(
  text: string, 
  params: any[] = []
): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    
    logger.debug('Executed query', { 
      query: text.replace(/\s+/g, ' ').trim(),
      duration,
      rows: result.rowCount 
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Query error', {
      query: text.replace(/\s+/g, ' ').trim(),
      duration,
      error: (error as Error).message
    });
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 * @returns PostgreSQL client
 */
export async function getClient(): Promise<pg.PoolClient> {
  try {
    return await pool.connect();
  } catch (error) {
    logger.error('Error acquiring client from pool', {
      error: (error as Error).message
    });
    throw error;
  }
}

/**
 * Execute a transaction with the provided callback
 * @param callback Transaction callback
 * @returns Result of the callback
 */
export async function transaction<T>(
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction rolled back', {
      error: (error as Error).message
    });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Check if the database is accessible
 * @returns True if connected, false otherwise
 */
export async function checkConnection(): Promise<boolean> {
  try {
    await query('SELECT NOW()');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Initialize the database by creating required tables
 */
export async function initializeDatabase(): Promise<void> {
  try {
    logger.info('Initializing database');
    
    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(200) NOT NULL,
        roles JSONB NOT NULL DEFAULT '["user"]',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create refresh_tokens table
    await query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        token VARCHAR(200) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);
    
    // Create campaigns table
    await query(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        scheduled_at TIMESTAMPTZ,
        created_by VARCHAR(50) NOT NULL,
        metadata JSONB,
        CONSTRAINT fk_user FOREIGN KEY(created_by) REFERENCES users(id)
      )
    `);
    
    // Create telegram_messages table
    await query(`
      CREATE TABLE IF NOT EXISTS telegram_messages (
        id VARCHAR(50) PRIMARY KEY,
        campaign_id VARCHAR(50),
        chat_id VARCHAR(100) NOT NULL,
        message_text TEXT NOT NULL,
        sent_at TIMESTAMPTZ,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        sent_by VARCHAR(50) NOT NULL,
        use_markdown BOOLEAN DEFAULT FALSE,
        media_urls JSONB,
        telegram_message_id VARCHAR(100),
        metadata JSONB,
        CONSTRAINT fk_campaign FOREIGN KEY(campaign_id) REFERENCES campaigns(id),
        CONSTRAINT fk_user FOREIGN KEY(sent_by) REFERENCES users(id)
      )
    `);
    
    // Create templates table
    await query(`
      CREATE TABLE IF NOT EXISTS message_templates (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(100),
        supports_variables BOOLEAN DEFAULT FALSE,
        required_variables JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by VARCHAR(50) NOT NULL,
        CONSTRAINT fk_user FOREIGN KEY(created_by) REFERENCES users(id)
      )
    `);
    
    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Database initialization failed', {
      error: (error as Error).message
    });
    throw error;
  }
}

// Export the pool for direct access if needed
export const dbPool = pool;

// Default export
export default {
  query,
  getClient,
  transaction,
  checkConnection,
  initializeDatabase,
  pool
};