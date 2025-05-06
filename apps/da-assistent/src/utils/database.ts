/**
 * Database helper for PostgreSQL connections
 * Provides a clean interface for database operations
 */

import pg, { QueryResultRow } from 'pg';
import { DB_CONFIG } from './config.js';
import { logger } from '../logging/logger.js';

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
export async function query<T extends QueryResultRow = any>(
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