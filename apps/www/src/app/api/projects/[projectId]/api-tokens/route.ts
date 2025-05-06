import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { z } from "zod";
import { randomUUID } from "crypto";

// Schema for creating a new API token
const CreateApiTokenSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string(),
  expiryDays: z.number().int().positive().optional(),
  permissions: z.array(z.string()).optional(),
});

// Function to verify project access
async function verifyProjectAccess(projectId: string, userId: string) {
  const userOrg = await db.userOrganization.findFirst({
    where: {
      userId,
      organization: {
        projects: {
          some: {
            id: projectId,
          },
        },
      },
    },
    include: {
      organization: {
        projects: {
          where: { id: projectId },
          select: { id: true }
        }
      }
    }
  });

  if (!userOrg || userOrg.organization.projects.length === 0) {
    return false;
  }
  
  return true;
}

// Function to create a secure API token
function generateApiToken(): string {
  // In production, you might want to use a more sophisticated method
  return `dabao_${randomUUID().replace(/-/g, '')}_${Date.now().toString(36)}`;
}

// GET handler for retrieving API tokens
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    
    // Check if user has access to this project
    const hasAccess = await verifyProjectAccess(projectId, user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have access to this project" },
        { status: 403 }
      );
    }

    // Get API keys from the database
    const apiKeys = await db.apiKey.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    });

    // Map to the format expected by the frontend
    const formattedTokens = apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      type: "Project", // Default type, can be customized
      status: key.expiresAt && new Date(key.expiresAt) < new Date() ? "expired" : "active",
      lastUsed: key.lastUsedAt?.toISOString() || null,
      expiresAt: key.expiresAt?.toISOString() || null,
      permissions: ["*"], // Default permissions, can be customized
    }));

    return NextResponse.json(formattedTokens);
  } catch (error) {
    console.error("Error fetching API tokens:", error);
    return NextResponse.json(
      { error: "Failed to fetch API tokens" },
      { status: 500 }
    );
  }
}

// POST handler for creating a new API token
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    
    // Check if user has access to this project
    const hasAccess = await verifyProjectAccess(projectId, user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have access to this project" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = CreateApiTokenSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { name, type, expiryDays, permissions = ["*"] } = validationResult.data;
    
    // Calculate expiry date if specified
    let expiresAt = null;
    if (expiryDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);
    }
    
    // Generate a secure API token
    const token = generateApiToken();
    
    // Create the API key in the database
    const apiKey = await db.apiKey.create({
      data: {
        name,
        key: token,
        projectId,
        expiresAt,
      }
    });
    
    // Format the response
    const response = {
      id: apiKey.id,
      name: apiKey.name,
      type,
      status: "active",
      lastUsed: null,
      expiresAt: apiKey.expiresAt?.toISOString() || null,
      token, // Only returned once upon creation
      permissions,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error creating API token:", error);
    return NextResponse.json(
      { error: "Failed to create API token" },
      { status: 500 }
    );
  }
}