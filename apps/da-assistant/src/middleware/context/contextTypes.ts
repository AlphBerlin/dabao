import { Request } from 'express';
import { User, Organization, Project } from '@prisma/client';

// Define what our server context will contain
export interface ServerContext {
  user: UserContext | null;
  organization: OrganizationContext | null;
  project: ProjectContext | null;
}

// User context with necessary user information
export interface UserContext {
  id: string;
  email: string;
  name?: string | null;
  supabaseUserId?: string | null;
}

// Organization context with necessary organization information
export interface OrganizationContext {
  id: string;
  name: string;
  slug: string;
  userRole?: string;
}

// Project context with necessary project information
export interface ProjectContext {
  id: string;
  name: string;
  slug: string;
  organizationId: string;
}

// Extend the Express Request interface to include our server context
declare global {
  namespace Express {
    interface Request {
      context: ServerContext;
    }
  }
}