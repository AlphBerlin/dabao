import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerUser } from "@/lib/auth";
import { z } from "zod";

// GET /api/projects/[projectId]/email-templates/[templateId]/versions/[versionId]
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string; templateId: string; versionId: string } }
) {
  try {
    const user = await getServerUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if template exists and belongs to the project
    const template = await db.emailTemplate.findUnique({
      where: {
        id: params.templateId,
        projectId: params.projectId,
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Fetch the version
    const version = await db.emailTemplateVersion.findUnique({
      where: {
        id: params.versionId,
        templateId: params.templateId,
      },
    });

    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    return NextResponse.json(version);
  } catch (error) {
    console.error("Error fetching template version:", error);
    return NextResponse.json(
      { error: "Failed to fetch template version" },
      { status: 500 }
    );
  }
}

// Schema for updating a version
const updateVersionSchema = z.object({
  isActive: z.boolean().optional(),
});

// PATCH /api/projects/[projectId]/email-templates/[templateId]/versions/[versionId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string; templateId: string; versionId: string } }
) {
  try {
    const user = await getServerUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    const validationResult = updateVersionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Check if template exists and belongs to the project
    const template = await db.emailTemplate.findUnique({
      where: {
        id: params.templateId,
        projectId: params.projectId,
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Check if version exists
    const existingVersion = await db.emailTemplateVersion.findUnique({
      where: {
        id: params.versionId,
        templateId: params.templateId,
      },
    });

    if (!existingVersion) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Begin transaction for activation if needed
    let updatedVersion;
    
    if (validationResult.data.isActive === true) {
      updatedVersion = await db.$transaction(async (tx) => {
        // Deactivate all other versions
        await tx.emailTemplateVersion.updateMany({
          where: {
            templateId: params.templateId,
            isActive: true,
          },
          data: {
            isActive: false,
          },
        });

        // Update template status to PUBLISHED
        await tx.emailTemplate.update({
          where: {
            id: params.templateId,
          },
          data: {
            status: "PUBLISHED",
          },
        });

        // Update this version
        return tx.emailTemplateVersion.update({
          where: {
            id: params.versionId,
          },
          data: {
            isActive: true,
            publishedAt: new Date(),
          },
        });
      });
    } else {
      // Simple update for non-activation changes
      updatedVersion = await db.emailTemplateVersion.update({
        where: {
          id: params.versionId,
        },
        data: validationResult.data,
      });
    }

    return NextResponse.json(updatedVersion);
  } catch (error) {
    console.error("Error updating template version:", error);
    return NextResponse.json(
      { error: "Failed to update template version" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId]/email-templates/[templateId]/versions/[versionId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string; templateId: string; versionId: string } }
) {
  try {
    const user = await getServerUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if template exists and belongs to the project
    const template = await db.emailTemplate.findUnique({
      where: {
        id: params.templateId,
        projectId: params.projectId,
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Check if version exists and is not active
    const version = await db.emailTemplateVersion.findUnique({
      where: {
        id: params.versionId,
        templateId: params.templateId,
      },
    });

    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    if (version.isActive) {
      return NextResponse.json(
        { error: "Cannot delete active version" },
        { status: 400 }
      );
    }

    // Delete the version
    await db.emailTemplateVersion.delete({
      where: {
        id: params.versionId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template version:", error);
    return NextResponse.json(
      { error: "Failed to delete template version" },
      { status: 500 }
    );
  }
}