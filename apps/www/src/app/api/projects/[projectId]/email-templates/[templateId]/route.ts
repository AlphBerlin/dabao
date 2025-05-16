import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerUser } from "@/lib/auth";
import { z } from "zod";

// GET /api/projects/[projectId]/email-templates/[templateId]
export async function GET(
    request: NextRequest,
    { params }: { params: { projectId: string; templateId: string } }
) {
    try {
        const user = await getServerUser();
        if (!user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const template = await db.emailTemplate.findUnique({
            where: {
                id: params.templateId,
                projectId: params.projectId,
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                versions: {
                    orderBy: {
                        version: "desc",
                    },
                },
            },
        });

        if (!template) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        return NextResponse.json(template);
    } catch (error) {
        console.error("Error fetching email template:", error);
        return NextResponse.json(
            { error: "Failed to fetch template" },
            { status: 500 }
        );
    }
}

// Schema for updating a template
const updateTemplateSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    description: z.string().optional().nullable(),
    subject: z.string().min(1, "Subject is required").optional(),
    previewText: z.string().optional().nullable(),
    categoryId: z.string().optional().nullable(),
    type: z.enum(["TRANSACTIONAL", "MARKETING", "NOTIFICATION", "CUSTOM"]).optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

// PUT /api/projects/[projectId]/email-templates/[templateId]
export async function PUT(
    request: NextRequest,
    { params }: { params: { projectId: string; templateId: string } }
) {
    try {
        const user = await getServerUser();
        if (!user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        // Validate request body
        const validationResult = updateTemplateSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.errors },
                { status: 400 }
            );
        }

        // Check if template exists
        const existingTemplate = await db.emailTemplate.findUnique({
            where: {
                id: params.templateId,
                projectId: params.projectId,
            },
        });

        if (!existingTemplate) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        // If categoryId is provided, check if category exists
        if (validationResult.data.categoryId) {
            const category = await db.emailTemplateCategory.findUnique({
                where: {
                    id: validationResult.data.categoryId,
                    projectId: params.projectId,
                },
            });

            if (!category) {
                return NextResponse.json(
                    { error: "Category not found" },
                    { status: 400 }
                );
            }
        }

        // Update the template
        const template = await db.emailTemplate.update({
            where: {
                id: params.templateId,
            },
            data: {
                ...validationResult.data,
                // Handle nulls explicitly
                description: validationResult.data.description === null ? null : validationResult.data.description,
                previewText: validationResult.data.previewText === null ? null : validationResult.data.previewText,
                categoryId: validationResult.data.categoryId === null ? null : validationResult.data.categoryId,
            },
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
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error("Error updating email template:", error);
        return NextResponse.json(
            { error: "Failed to update template" },
            { status: 500 }
        );
    }
}

// DELETE /api/projects/[projectId]/email-templates/[templateId]
export async function DELETE(
    request: NextRequest,
    { params }: { params: { projectId: string; templateId: string } }
) {
    try {
        const user = await getServerUser();
        if (!user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if template exists
        const template = await db.emailTemplate.findUnique({
            where: {
                id: params.templateId,
                projectId: params.projectId,
            },
        });

        if (!template) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        // Delete all versions of the template
        await db.emailTemplateVersion.deleteMany({
            where: {
                templateId: params.templateId,
            },
        });

        // Delete the template
        await db.emailTemplate.delete({
            where: {
                id: params.templateId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting email template:", error);
        return NextResponse.json(
            { error: "Failed to delete template" },
            { status: 500 }
        );
    }
}