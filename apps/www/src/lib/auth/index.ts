import { createClient } from "../supabase/server";
// Authentication utilities for API routes and middleware
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const getServerUser = async () => {
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user
}
/**
 * Helper to wrap API routes with authentication
 * 
 * @param handler The API route handler function
 * @returns A wrapped handler that checks authentication before executing
 */
export function withAuth(handler: (
  req: NextRequest, 
  context: any
) => Promise<NextResponse>) {
  return async (req: NextRequest, context: any) => {
    try {
      // Get authenticated user from Supabase
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return NextResponse.json({
          error: 'Unauthorized',
          message: 'Authentication required'
        }, { status: 401 });
      }
      
      // The user ID from Supabase
      const userId = user.id;
      
      // Check project access if projectId is in the context
      if (context.params?.projectId) {
        const projectId = context.params.projectId;
        
        // Simple project access check - adjust based on your schema
        const project = await db.project.findFirst({
          where: {
            id: projectId
          }
        });
        
        if (!project) {
          return NextResponse.json({
            error: 'Forbidden',
            message: 'Project not found or you do not have access'
          }, { status: 403 });
        }
      }
      
      // Add the user to the request context
      context.auth = { 
        userId,
        user
      };
      
      // Call the original handler with the authenticated request
      return handler(req, context);
    } catch (error: any) {
      console.error('Authentication error:', error);
      return NextResponse.json({
        error: 'Authentication error',
        message: error.message
      }, { status: 500 });
    }
  };
}

/**
 * Get the current authenticated user
 * Returns null if not authenticated
 */
export async function auth() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }
    
    // Return the user session object
    return {
      user: {
        id: user.id,
        email: user.email,
        // Add other user properties as needed
      }
    };
  } catch (error) {
    console.error('Error getting auth session:', error);
    return null;
  }
}

/**
 * Check if the user has permission for a specific project
 */
export async function checkProjectPermission(userId: string, projectId: string) {
  try {
    // Check if project exists and user has access
    const project = await db.project.findFirst({
      where: {
        id: projectId
      }
    });
    
    return !!project;
  } catch (error) {
    console.error('Project permission check error:', error);
    return false;
  }
}
