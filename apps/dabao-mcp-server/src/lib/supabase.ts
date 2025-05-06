/**
 * Supabase client for authentication
 */
import { createClient } from '@supabase/supabase-js';
import { logger } from '../logging/logger.js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  logger.error('Missing Supabase credentials');
  throw new Error('Missing Supabase credentials');
}

// Client for user-facing operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for backend operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Get a user session from a JWT token
 * @param token The JWT token
 * @returns The user session or null if invalid
 */
export const getSession = async (token: string) => {
  try {
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      logger.warn('Failed to validate token', { error: error?.message });
      return null;
    }
    
    return {
      user: data.user,
    };
  } catch (error) {
    logger.error('Failed to validate token', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    return null;
  }
};

/**
 * Create a new user in Supabase
 * @param email User email
 * @param password User password
 * @returns The created user or null if an error occurred
 */
export const createUser = async (email: string, password: string) => {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    
    if (error) {
      logger.error('Failed to create user', { error: error.message, email });
      return null;
    }
    
    logger.info('User created successfully', { email, id: data.user.id });
    return data.user;
  } catch (error) {
    logger.error('Failed to create user', { 
      error: error instanceof Error ? error.message : String(error),
      email 
    });
    return null;
  }
};

/**
 * Delete a user from Supabase
 * @param id Supabase user ID
 * @returns True if successful, false otherwise
 */
export const deleteUser = async (id: string) => {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    
    if (error) {
      logger.error('Failed to delete user', { error: error.message, id });
      return false;
    }
    
    logger.info('User deleted successfully', { id });
    return true;
  } catch (error) {
    logger.error('Failed to delete user', { 
      error: error instanceof Error ? error.message : String(error),
      id 
    });
    return false;
  }
};

export default {
  supabase,
  supabaseAdmin,
  getSession,
  createUser,
  deleteUser
};