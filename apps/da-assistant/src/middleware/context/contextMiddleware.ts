import { Request, Response, NextFunction } from 'express';
import { ContextService } from '../../services/ContextService';
import { ServerContext } from './contextTypes';

/**
 * Middleware that populates the request with context information
 * Uses the authenticated user from auth middleware to fetch additional context
 */
export const populateContext = async (req: Request, res: Response, next: NextFunction) => {
  // Initialize empty context
  const context: ServerContext = {
    user: null,
    organization: null,
    project: null
  };

  // Only proceed if we have an authenticated user from auth middleware
  if (req.user && req.user.id) {
    try {
      const contextService = ContextService.getInstance();
      
      // Get user details from database
      const user = await contextService.getUserBySupabaseId(req.user.id);
      
      if (user) {
        context.user = user;
        
        // Get user's primary organization
        context.organization = await contextService.getUserPrimaryOrganization(user.id);
        
        // If organization is found, get a primary project if available
        if (context.organization) {
          const projects = await contextService.getOrganizationProjects(context.organization.id);
          if (projects.length > 0) {
            context.project = projects[0]!;
          }
        }
      }
    } catch (error) {
      console.error('Error populating context:', error);
    }
  }

  // Attach the context to the request
  req.context = context;
  next();
};

/**
 * Helper middleware to ensure a user context is available
 * Returns 401 if no user context is found
 */
export const requireUserContext = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.context || !req.context.user) {
    return res.status(401).json({ error: 'User context not available' });
  }
  next();
};

/**
 * Helper middleware to ensure an organization context is available
 * Returns 404 if no organization context is found
 */
export const requireOrgContext = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.context || !req.context.organization) {
    return res.status(404).json({ error: 'Organization context not available' });
  }
  next();
};

/**
 * Helper middleware to ensure a project context is available
 * Returns 404 if no project context is found
 */
export const requireProjectContext = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.context || !req.context.project) {
    return res.status(404).json({ error: 'Project context not available' });
  }
  next();
};

/**
 * Middleware to set project context from URL parameter
 * Requires that the user context is already populated
 */
export const setProjectContextFromParam = (paramName: string = 'projectId') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.context || !req.context.user) {
      return res.status(401).json({ error: 'User context not available' });
    }
    
    const projectId = req.params[paramName];
    if (!projectId) {
      return next();
    }
    
    try {
      const contextService = ContextService.getInstance();
      
      // Check if user has access to this project
      const hasAccess = await contextService.hasProjectAccess(req.context.user.id, projectId);
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Not authorized to access this project' });
      }
      
      // Get project details
      const project = await contextService.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      // Update the context with the project information
      req.context.project = project;
      
      // If organization isn't populated, add it too
      if (!req.context.organization) {
        const orgContextService = ContextService.getInstance();
        const org = await orgContextService.getUserPrimaryOrganization(req.context.user.id);
        req.context.organization = org;
      }
      
      next();
    } catch (error) {
      console.error('Error setting project context:', error);
      return res.status(500).json({ error: 'Failed to set project context' });
    }
  };
};