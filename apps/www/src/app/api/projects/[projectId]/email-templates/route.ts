import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerUser } from "@/lib/auth";
import { z } from "zod";
import { EmailTemplateStatus, EmailTemplateType } from "@/lib/api/email-templates";

// GET /api/projects/[projectId]/email-templates
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {projectId} =await params;
    // Parse query params for filtering
    const url = new URL(request.url);
    const categoryId = url.searchParams.get("categoryId") || undefined;
    const type = url.searchParams.get("type") as EmailTemplateType | undefined;
    const status = url.searchParams.get("status") as EmailTemplateStatus | undefined;

    // Build filter conditions
    const where: any = {
      projectId: projectId,
      ...(categoryId && { categoryId }),
      ...(type && { type }),
      ...(status && { status }),
    };

    // Fetch templates with their active versions and categories
    const templates = await db.emailTemplate.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        versions: {
          where: {
            isActive: true,
          },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching email templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// Schema for creating a template
const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.enum(["TRANSACTIONAL", "MARKETING", "NOTIFICATION", "CUSTOM"]),
  subject: z.string().min(1, "Subject is required"),
  previewText: z.string().optional(),
  categoryId: z.string().optional(),
  htmlContent: z.string().optional(),
  textContent: z.string().optional(),
  variables: z.array(z.string()).optional(),
});

// POST /api/projects/[projectId]/email-templates
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
const { projectId } = await params;
    const body = await request.json();
    
    // Validate request body
    const validationResult = createTemplateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      type,
      subject,
      previewText,
      categoryId,
      htmlContent,
      textContent,
      variables,
    } = validationResult.data;

    // Check if category exists if categoryId is provided
    if (categoryId) {
      const category = await db.emailTemplateCategory.findUnique({
        where: {
          id: categoryId,
          projectId: projectId,
        },
      });

      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 400 }
        );
      }
    }

    // Create the template
    const template = await db.emailTemplate.create({
      data: {
        projectId: projectId,
        name,
        description,
        type,
        status: "DRAFT",
        subject,
        previewText,
        categoryId,
      },
    });

    // If HTML content is provided, create initial version
    if (htmlContent) {
      await db.emailTemplateVersion.create({
        data: {
          templateId: template.id,
          version: 1,
          htmlContent,
          textContent,
          variables,
          isActive: false,
        },
      });
    }

    // Return the created template
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}