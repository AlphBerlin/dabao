import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { casbinEnforcer, ACTION_TYPES, RESOURCE_TYPES } from '@/lib/casbin/enforcer';
import { AuthTokenService } from '@/lib/services/auth-token-service';

export type HandlerWithProject = (
  req: NextRequest,
  { params }: { params: { projectId: string; [key: string]: string } }
) => Promise<NextResponse>;

/**
 * Middleware factory for securing API routes with authorization checks
 * @param handler The route handler function
 * @param resource The resource being accessed (e.g., 'customer', 'reward')
 * @param action The action being performed (e.g., 'read', 'create')
 * @param options Additional options
 */
export function withAuthorization(
  handler: HandlerWithProject,
  resource: string,
  action: string,
  options: {
    allowToken?: boolean; // Allow API token authentication
    requireAuth?: boolean; // Require authentication (defaults to true)
  } = {}
) {
  const { allowToken = true, requireAuth = true } = options;

  return async function authorizedHandler(
    req: NextRequest,
    context: { params: { projectId: string; [key: string]: string } }
  ) {
    try {
      const projectId = (await context.params).projectId;

      // Initialize Casbin enforcer if needed
      await casbinEnforcer.init();

      // Check for token authentication first if allowed
      if (allowToken) {
        const authHeader = req.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          
          // Check if this is a valid token with appropriate permissions
          const hasPermission = await AuthTokenService.checkTokenPermission(
            token,
            resource,
            action,
            projectId
          );

          if (hasPermission) {
            // Token has permission, proceed with the handler
            return handler(req, context);
          }
        }
      }

      // If we're still here, try user-based authorization
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        if (requireAuth) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        } else {
          // Skip authorization if not required
          return handler(req, context);
        }
      }

      // Find user in database
      const dbUser = await prisma.user.findUnique({
        where: { supabaseUserId: user.id },
        select: { id: true }
      });

      if (!dbUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Check if user has permission to perform the action on the resource
      const hasPermission = await casbinEnforcer.enforce(
        dbUser.id,
        resource,
        action,
        projectId
      );

      if (!hasPermission) {
        return NextResponse.json({ 
          error: `Insufficient permissions to ${action} ${resource}` 
        }, { status: 403 });
      }

      // User has permission, proceed with the handler
      return handler(req, context);
    } catch (error) {
      console.error('Error in authorization middleware:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}

/**
 * Middleware factory for securing API routes with organization-level authorization
 * @param handler The route handler function
 * @param resource The resource being accessed
 * @param action The action being performed
 */
export function withOrgAuthorization(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>,
  resource: string,
  action: string
) {
  return async function authorizedHandler(req: NextRequest, context: any) {
    try {
      // Initialize Casbin enforcer if needed
      await casbinEnforcer.init();

      // Get organization ID from header or cookie
      const orgId = req.headers.get('x-org-id') || req.cookies.get('orgId')?.value;
      
      if (!orgId) {
        return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
      }

      // Get authenticated user from Supabase
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Find user in database
      const dbUser = await prisma.user.findUnique({
        where: { supabaseUserId: user.id },
        select: { id: true }
      });

      if (!dbUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Check if user has permission to perform the action on the resource
      const hasPermission = await casbinEnforcer.enforce(
        dbUser.id,
        resource,
        action,
        orgId
      );

      if (!hasPermission) {
        return NextResponse.json({ 
          error: `Insufficient permissions to ${action} ${resource}` 
        }, { status: 403 });
      }

      // User has permission, proceed with the handler
      return handler(req, context);
    } catch (error) {
      console.error('Error in organization authorization middleware:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}