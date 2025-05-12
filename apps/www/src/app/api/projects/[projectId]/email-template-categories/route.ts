import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerUser } from "@/lib/auth";
import { z } from "zod";

// GET /api/projects/[projectId]/email-template-categories
export async function GET(
    request: NextRequest,
    { params }: { params: { projectId: string } }
) {
    try {
        const user = await getServerUser();
        if (!user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const categories = await db.emailTemplateCategory.findMany({
            where: {
                projectId: params.projectId,
            },
            include: {
                _count: {
                    select: {
                        emailTemplates: true,
                    },
                },
            },
            orderBy: {
                name: "asc",
            },
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error("Error fetching email template categories:", error);
        return NextResponse.json(
            { error: "Failed to fetch categories" },
            { status: 500 }
        );
    }
}

// Schema for creating category
const createCategorySchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
});

// POST /api/projects/[projectId]/email-template-categories
export async function POST(
    request: NextRequest,
    { params }: { params: { projectId: string } }
) {
    try {
        const user = await getServerUser();
        if (!user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        // Validate request body
        const validationResult = createCategorySchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.errors },
                { status: 400 }
            );
        }

        // Check if category with the same name already exists
        const existingCategory = await db.emailTemplateCategory.findFirst({
            where: {
                projectId: params.projectId,
                name: validationResult.data.name,
            },
        });

        if (existingCategory) {
            return NextResponse.json(
                { error: "A category with this name already exists" },
                { status: 400 }
            );
        }

        // Create the category
        const category = await db.emailTemplateCategory.create({
            data: {
                projectId: params.projectId,
                name: validationResult.data.name,
                description: validationResult.data.description,
            },
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error("Error creating email template category:", error);
        return NextResponse.json(
            { error: "Failed to create category" },
            { status: 500 }
        );
    }
}