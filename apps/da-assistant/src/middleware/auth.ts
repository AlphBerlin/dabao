import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin, createSupabaseClient } from '../lib/supabase/client';

/**
 * Middleware to verify authenticated requests
 * Checks for a valid JWT token in the Authorization header
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization token' });
  }
  
  const token = authHeader.split(' ')[1] as string;
  
  try {
    // Verify the token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Add user to request object for use in route handlers
    req.user = user;
    
    // Create a Supabase client with the user's token for the current request
    req.supabase = createSupabaseClient(token);
    
    next();
  } catch (error: any) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Failed to authenticate user' });
  }
};

// Optional middleware that attaches user if present but doesn't require auth
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Set anonymous client if no token
    req.supabase = supabaseAdmin;
    return next();
  }
  
  const token = authHeader.split(' ')[1] as string;
  
  try {
    // Verify the token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (!error && user) {
      // Add user to request if valid
      req.user = user;
      req.supabase = createSupabaseClient(token);
    } else {
      // Fall back to anonymous client
      req.supabase = supabaseAdmin;
    }
    
    next();
  } catch (error) {
    // Fall back to anonymous client on error
    req.supabase = supabaseAdmin;
    next();
  }
};