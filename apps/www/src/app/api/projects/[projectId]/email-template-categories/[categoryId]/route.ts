import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerUser } from "@/lib/auth";
import { z } from "zod";

// GET /api/projects/[projectId]/email-template-categories/[categoryId]
export async function GET(
    request: NextRequest,
    { params }: { params: { projectId: string; categoryId: string } }
) {
    try {
        const user = await getServerUser();
        if (!user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const category = await db.emailTemplateCategory.findUnique({
            where: {
                id: params.categoryId,
                projectId: params.projectId,
            },
            include: {
                emailTemplates: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        status: true,
                        createdAt: true,
                    },
                },
            },
        });

        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        return NextResponse.json(category);
    } catch (error) {
        console.error("Error fetching email template category:", error);
        return NextResponse.json(
            { error: "Failed to fetch category" },
            { status: 500 }
        );
    }
}

// Schema for updating category
const updateCategorySchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    description: z.string().optional().nullable(),
});

// PUT /api/projects/[projectId]/email-template-categories/[categoryId]
export async function PUT(
    request: NextRequest,
    { params }: { params: { projectId: string; categoryId: string } }
) {
    try {
        const user = await getServerUser();
        if (!user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        // Validate request body
        const validationResult = updateCategorySchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.errors },
                { status: 400 }
            );
        }

        // Check if category exists
        const existingCategory = await db.emailTemplateCategory.findUnique({
            where: {
                id: params.categoryId,
                projectId: params.projectId,
            },
        });

        if (!existingCategory) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        // Check if the new name conflicts with an existing category
        if (validationResult.data.name && validationResult.data.name !== existingCategory.name) {
            const categoryWithSameName = await db.emailTemplateCategory.findFirst({
                where: {
                    projectId: params.projectId,
                    name: validationResult.data.name,
                    id: {
                        not: params.categoryId,
                    },
                },
            });

            if (categoryWithSameName) {
                return NextResponse.json(
                    { error: "A category with this name already exists" },
                    { status: 400 }
                );
            }
        }

        // Update the category
        const category = await db.emailTemplateCategory.update({
            where: {
                id: params.categoryId,
            },
            data: {
                name: validationResult.data.name,
                description: validationResult.data.description === null ? null : validationResult.data.description,
            },
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error("Error updating email template category:", error);
        return NextResponse.json(
            { error: "Failed to update category" },
            { status: 500 }
        );
    }
}

// DELETE /api/projects/[projectId]/email-template-categories/[categoryId]
export async function DELETE(
    request: NextRequest,
    { params }: { params: { projectId: string; categoryId: string } }
) {
    try {
        const user = await getServerUser();
        if (!user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if category exists
        const category = await db.emailTemplateCategory.findUnique({
            where: {
                id: params.categoryId,
                projectId: params.projectId,
            },
            include: {
                _count: {
                    select: {
                        emailTemplates: true,
                    },
                },
            },
        });

        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        // Check if category has templates
        if (category._count.emailTemplates > 0) {
            return NextResponse.json(
                { error: "Cannot delete a category with templates. Move or delete the templates first." },
                { status: 400 }
            );
        }

        // Delete the category
        await db.emailTemplateCategory.delete({
            where: {
                id: params.categoryId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting email template category:", error);
        return NextResponse.json(
            { error: "Failed to delete category" },
            { status: 500 }
        );
    }
}