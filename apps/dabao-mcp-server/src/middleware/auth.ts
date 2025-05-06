import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import jwt from "jsonwebtoken";
import { logger, logAuditEvent } from "../logging/logger.js";
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { supabase, getSession } from '../lib/supabase.js';

const prisma = new PrismaClient();

// Types for authentication
export interface User {
  id: string;
  username: string;
  roles: string[];
}

export interface AuthToken {
  userId: string;
  username: string;
  roles: string[];
  exp: number;
}

// Role-based permissions mapping
const rolePermissions = {
  admin: ["*"], // Admins can do anything
  manager: [
    "campaign:read", "campaign:write", "campaign:delete", 
    "telegram:read", "telegram:write",
    "analytics:read"
  ],
  user: [
    "campaign:read", 
    "telegram:read", 
    "analytics:read"
  ],
  guest: ["campaign:read"]
};

// Instead of using middleware, we'll intercept requests with request handlers
export function setupAuthMiddleware(server: Server) {
  // Wrap original handlers with authentication logic
  const originalHandlers = server['_requestHandlers'];
  
  if (originalHandlers) {
    for (const [schema, handler] of originalHandlers.entries()) {
      server['_requestHandlers'].set(schema, async (request: any) => {
        try {
          // Skip auth for certain non-sensitive operations
          if (request.type === "list_resources" || request.type === "list_tools") {
            return await handler(request);
          }

          // Get token from request headers or params
          const token = extractToken(request);
          if (!token) {
            logger.warn("Authentication failed: No token provided");
            throw new Error("Authentication required");
          }

          // Verify token and extract user info
          const user = await verifyToken(token);
          if (!user) {
            logAuditEvent("unknown", "authentication", "token", "failed", { reason: "Invalid token" });
            throw new Error("Invalid authentication token");
          }

          // Check permission for the requested operation
          if (!hasPermission(user, request)) {
            logAuditEvent(user.id, "authorization", request.type, "denied", { 
              roles: user.roles,
              requestedOperation: request.type
            });
            throw new Error("Permission denied");
          }

          // Add user to request context for downstream handlers
          request.context = {
            ...request.context,
            user
          };

          logAuditEvent(user.id, "authentication", "token", "success", { 
            roles: user.roles,
            requestedOperation: request.type
          });

          // Call the original handler
          return await handler(request);
        } catch (error: any) {
          logger.error(`Auth middleware error: ${error.message}`);
          throw error;
        }
      });
    }
  }
}

// Extract token from request
function extractToken(request: any): string | null {
  // From authorization header
  if (request.headers?.authorization) {
    const parts = request.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      return parts[1];
    }
  }
  
  // From query parameter
  if (request.params?.token) {
    return request.params.token;
  }
  
  // From body
  if (request.body?.token) {
    return request.body.token;
  }
  
  return null;
}

// Verify JWT token and extract user information
export async function verifyToken(token: string): Promise<User | null> {
  try {
    const secret = process.env.JWT_SECRET || "default_secret_change_in_production";
    const decoded = jwt.verify(token, secret) as AuthToken;
    
    if (!decoded || !decoded.userId || !decoded.username) {
      return null;
    }
    
    return {
      id: decoded.userId,
      username: decoded.username,
      roles: decoded.roles || ["guest"]
    };
  } catch (error) {
    logger.error(`Token verification failed: ${(error as Error).message}`);
    return null;
  }
}

// Check if user has permission for the requested operation
export function hasPermission(user: User, request: any): boolean {
  // Admin can do anything
  if (user.roles.includes("admin")) {
    return true;
  }
  
  // Determine required permission based on request type
  const requiredPermission = getRequiredPermission(request);
  if (!requiredPermission) {
    return true; // No specific permission required
  }
  
  // Check if any of the user's roles grants the required permission
  return user.roles.some(role => {
    const permissions = rolePermissions[role as keyof typeof rolePermissions] || [];
    return permissions.includes("*") || permissions.includes(requiredPermission);
  });
}

// Map request types to required permissions
function getRequiredPermission(request: any): string | null {
  const type = request.type;
  const params = request.params || {};
  
  // Map MCP request types to permission strings
  switch (type) {
    case "call_tool":
      if (params.name?.startsWith("campaign")) {
        return params.name.includes("read") ? "campaign:read" : "campaign:write";
      } else if (params.name?.startsWith("telegram")) {
        return params.name.includes("read") ? "telegram:read" : "telegram:write";
      } else if (params.name?.startsWith("analytics")) {
        return "analytics:read";
      }
      break;
    case "read_resource":
      if (params.uri?.includes("campaign")) {
        return "campaign:read";
      } else if (params.uri?.includes("telegram")) {
        return "telegram:read";
      } else if (params.uri?.includes("analytics")) {
        return "analytics:read";
      }
      break;
    default:
      return null;
  }
  
  return null;
}

// Function to generate a new token for a user
export function generateToken(user: User): { token: string; refreshToken: string; expiresAt: number } {
  const secret = process.env.JWT_SECRET || "default_secret_change_in_production";
  const refreshSecret = process.env.JWT_REFRESH_SECRET || "default_refresh_secret_change_in_production";
  
  // Token expiration (1 hour)
  const expiresIn = 3600;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
  
  // Create token payload
  const payload: AuthToken = {
    userId: user.id,
    username: user.username,
    roles: user.roles,
    exp: expiresAt
  };
  
  // Generate tokens
  const token = jwt.sign(payload, secret);
  const refreshToken = jwt.sign({ userId: user.id }, refreshSecret, { expiresIn: "7d" });
  
  logAuditEvent(user.id, "token_generation", "auth", "success", { roles: user.roles });
  
  return {
    token,
    refreshToken,
    expiresAt
  };
}

/**
 * Authentication middleware
 * Validates session tokens and attaches user information to the request
 */

/**
 * Types for authenticated request
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    supabaseId: string;
    email: string;
    roles: string[];
  };
}

/**
 * Middleware to check if user is authenticated
 */
export const authenticate = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    // Validate token with Supabase
    const session = await getSession(token);
    if (!session) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { supabaseId: session.user.id },
      include: { roles: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      supabaseId: user.supabaseId,
      email: user.email,
      roles: user.roles.map((role: { name: string }) => role.name)
    };

    next();
  } catch (error) {
    logger.error('Authentication error', { 
      error: error instanceof Error ? error.message : String(error),
      path: req.path
    });
    
    return res.status(500).json({ message: 'Authentication error' });
  }
};

/**
 * Middleware to check if user has specific roles
 * @param allowedRoles The roles that are allowed to access the route
 */
export const authorize = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

/**
 * Middleware to check for API key authorization
 */
export const apiKeyAuth = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return res.status(401).json({ message: 'API key is required' });
    }

    // Find the API key in the database
    const keyRecord = await prisma.aPIKey.findUnique({
      where: { key: apiKey }
    });

    if (!keyRecord) {
      return res.status(401).json({ message: 'Invalid API key' });
    }

    // Check if key is expired
    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      return res.status(401).json({ message: 'API key has expired' });
    }

    // Attach API key info to request
    (req as any).apiKey = {
      id: keyRecord.id,
      name: keyRecord.name,
      permissions: keyRecord.permissions
    };

    next();
  } catch (error) {
    logger.error('API key authentication error', { 
      error: error instanceof Error ? error.message : String(error),
      path: req.path
    });
    
    return res.status(500).json({ message: 'Authentication error' });
  }
};

export default {
  authenticate,
  authorize,
  apiKeyAuth
};