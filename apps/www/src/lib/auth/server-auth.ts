import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { casbinEnforcer } from '@/lib/casbin/enforcer';
import { PolicyManager } from '@/lib/casbin/policy-manager';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

/**
 * Server-side function to check if a user has permission to perform an action on a resource
 * @param projectId The ID of the project
 * @param resource The resource to check permissions for
 * @param action The action to check permissions for
 */
export async function checkPermission(projectId: string, resource: string, action: string): Promise<boolean> {
    try {
        // Initialize Casbin enforcer
        if (!casbinEnforcer.isInitialized()) {
            await casbinEnforcer.init();
        }

        // Get authenticated user from Supabase
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return false;
        }

        // Find user in database
        const dbUser = await prisma.user.findUnique({
            where: { supabaseUserId: user.id },
            select: { id: true }
        });

        if (!dbUser) {
            return false;
        }

        console.log(dbUser.id,
            resource,
            action,
            projectId, await casbinEnforcer.enforce(
                dbUser.id,
                resource,
                action,
                projectId
            ))
        // Check if user has permission
        return casbinEnforcer.enforce(
            dbUser.id,
            resource,
            action,
            projectId
        );
    } catch (error) {
        console.error('Error checking permission:', error);
        return false;
    }
}

/**
 * Server-side function to check if a user has a specific role or higher in a project
 * @param projectId The ID of the project
 * @param minRole The minimum role required
 */
export async function checkRole(projectId: string, minRole: UserRole): Promise<boolean> {
    try {
        // Get authenticated user from Supabase
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return false;
        }

        // Find user in database
        const dbUser = await prisma.user.findUnique({
            where: { supabaseUserId: user.id },
            select: { id: true }
        });

        if (!dbUser) {
            return false;
        }

        // Check if user has the required role
        return PolicyManager.hasRoleForProject(
            dbUser.id,
            projectId,
            minRole
        );
    } catch (error) {
        console.error('Error checking role:', error);
        return false;
    }
}

/**
 * Server-side function to require authentication and redirect if not authenticated
 * @param redirectTo Where to redirect unauthenticated users
 */
export async function requireAuth(redirectTo: string = '/login') {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect(redirectTo);
    }

    return session;
}

/**
 * Server-side function to require specific permission and redirect if not authorized
 * @param projectId The ID of the project
 * @param resource The resource to check permissions for
 * @param action The action to check permissions for
 * @param redirectTo Where to redirect unauthorized users
 */
export async function requirePermission(
    projectId: string,
    resource: string,
    action: string,
    redirectTo: string = '/dashboard'
) {
    // First require auth
    const session = await requireAuth();

    // Then check permission
    const hasPermission = await checkPermission(projectId, resource, action);

    if (!hasPermission) {
        redirect(redirectTo);
    }

    return { session, hasPermission };
}

/**
 * Server-side function to require specific role and redirect if not authorized
 * @param projectId The ID of the project
 * @param minRole The minimum role required
 * @param redirectTo Where to redirect unauthorized users
 */
export async function requireRole(
    projectId: string,
    minRole: UserRole,
    redirectTo: string = '/dashboard'
) {
    // First require auth
    const session = await requireAuth();

    // Then check role
    const hasRole = await checkRole(projectId, minRole);

    if (!hasRole) {
        redirect(redirectTo);
    }

    return { session, hasRole };
}