import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { casbinEnforcer, ACTION_TYPES, RESOURCE_TYPES } from '@/lib/casbin/enforcer';
import { PolicyManager } from '@/lib/casbin/policy-manager';
import { AuthTokenService } from '@/lib/services/auth-token-service';

// Schema for token creation
const createTokenSchema = z.object({
  policyType: z.string().min(1, "Policy type is required"),
  expiresInDays: z.number().int().nonnegative().optional(),
  userId: z.string().optional(),
});

// Schema for creating an API token
const createApiTokenSchema = z.object({
  scope: z.enum(["read", "write", "admin"], {
    errorMap: () => ({ message: "Scope must be one of: read, write, admin" }),
  }),
  expiresInDays: z.number().int().nonnegative().optional(),
});

// Schema for creating a custom policy
const createPolicyTypeSchema = z.object({
  name: z.string().min(1, "Policy name is required"),
  resources: z.array(z.string()).min(1, "At least one resource is required"),
  actions: z.array(z.string()).min(1, "At least one action is required"),
});

/**
 * GET /api/projects/[projectId]/authtokens
 * Get all auth tokens for a specific project
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = params.projectId;
    
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to read auth tokens
    const canReadTokens = await PolicyManager.canUserAccessInProject(
      dbUser.id,
      RESOURCE_TYPES.AUTH_TOKEN,
      ACTION_TYPES.READ,
      projectId
    );

    if (!canReadTokens) {
      return NextResponse.json({ error: 'Insufficient permissions to read auth tokens' }, { status: 403 });
    }

    // Get all tokens for this project
    const tokens = await AuthTokenService.getTokensForProject(projectId);
    
    return NextResponse.json({ tokens });
  } catch (error) {
    console.error("Error getting auth tokens:", error);
    return NextResponse.json({ error: "Failed to get auth tokens" }, { status: 500 });
  }
}

/**
 * POST /api/projects/[projectId]/authtokens
 * Create a new auth token for a specific project
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = params.projectId;
    
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create auth tokens
    const canCreateTokens = await PolicyManager.canUserAccessInProject(
      dbUser.id,
      RESOURCE_TYPES.AUTH_TOKEN,
      ACTION_TYPES.CREATE,
      projectId
    );

    if (!canCreateTokens) {
      return NextResponse.json({ error: 'Insufficient permissions to create auth tokens' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await req.json();
    
    // Check which token creation flow is being used
    if (body.policyType !== undefined) {
      // Standard token creation flow
      const validationResult = createTokenSchema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json({ 
          error: "Validation error", 
          details: validationResult.error.format() 
        }, { status: 400 });
      }
      
      const { policyType, expiresInDays, userId } = validationResult.data;
      
      // Create the token
      const token = await AuthTokenService.createToken(projectId, policyType, expiresInDays, userId);
      
      return NextResponse.json({ 
        message: "Auth token created successfully",
        token
      });
    } else if (body.scope !== undefined) {
      // API token with predefined scope
      const validationResult = createApiTokenSchema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json({ 
          error: "Validation error", 
          details: validationResult.error.format() 
        }, { status: 400 });
      }
      
      const { scope, expiresInDays } = validationResult.data;
      
      // Create an API token with the specified scope
      const token = await AuthTokenService.createApiToken(projectId, scope, expiresInDays);
      
      return NextResponse.json({ 
        message: "API token created successfully",
        token
      });
    } else {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error creating auth token:", error);
    return NextResponse.json({ error: "Failed to create auth token" }, { status: 500 });
  }
}

/**
 * POST /api/projects/[projectId]/authtokens/policytypes
 * Create a new policy type for tokens
 */
export async function POST(
  req: NextRequest,
  { params, nextUrl }: { params: { projectId: string }, nextUrl: URL }
) {
  // Only handle if the path includes 'policytypes'
  if (!nextUrl.pathname.endsWith('/policytypes')) {
    return undefined; // Let the other POST handler handle it
  }
  
  try {
    const projectId = params.projectId;
    
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage policies
    const canManagePolicies = await PolicyManager.canUserAccessInProject(
      dbUser.id,
      RESOURCE_TYPES.POLICY,
      ACTION_TYPES.MANAGE,
      projectId
    );

    if (!canManagePolicies) {
      return NextResponse.json({ error: 'Insufficient permissions to create policy types' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = createPolicyTypeSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: "Validation error", 
        details: validationResult.error.format() 
      }, { status: 400 });
    }
    
    const { name, resources, actions } = validationResult.data;
    
    // Create the policy type
    const success = await AuthTokenService.createPolicyType(projectId, name, resources, actions);
    
    if (success) {
      return NextResponse.json({ 
        message: "Policy type created successfully",
        policyType: { name, resources, actions, domain: projectId }
      });
    } else {
      return NextResponse.json({ error: "Failed to create policy type" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error creating policy type:", error);
    return NextResponse.json({ error: "Failed to create policy type" }, { status: 500 });
  }
}