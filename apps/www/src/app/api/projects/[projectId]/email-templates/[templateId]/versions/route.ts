import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerUser } from "@/lib/auth";
import { z } from "zod";

// GET /api/projects/[projectId]/email-templates/[templateId]/versions
export async function GET(
    request: NextRequest,
    { params }: { params: { projectId: string; templateId: string } }
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

        // Fetch all versions
        const versions = await db.emailTemplateVersion.findMany({
            where: {
                templateId: params.templateId,
            },
            orderBy: {
                version: "desc",
            },
        });

        return NextResponse.json(versions);
    } catch (error) {
        console.error("Error fetching template versions:", error);
        return NextResponse.json(
            { error: "Failed to fetch template versions" },
            { status: 500 }
        );
    }
}

// Schema for creating a version
const createVersionSchema = z.object({
    html: z.string().min(1, "HTML content is required"),
    plainText: z.string().optional(),
    name: z.string().optional(),
    isActive: z.boolean().default(false),
    variables: z.array(z.string()).optional(),
});

// POST /api/projects/[projectId]/email-templates/[templateId]/versions
export async function POST(
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
        const validationResult = createVersionSchema.safeParse(body);
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

        // Get the latest version number
        const latestVersion = await db.emailTemplateVersion.findFirst({
            where: {
                templateId: params.templateId,
            },
            orderBy: {
                version: "desc",
            },
            select: {
                version: true,
            },
        });

        const nextVersion = latestVersion ? latestVersion.version + 1 : 1;
        const { html: htmlContent, plainText: textContent, variables, isActive: setActive, name } = validationResult.data;

        // Begin transaction
        const version = await db.$transaction(async (tx) => {
            // If setActive is true, deactivate all other versions
            if (setActive) {
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
            }

            // Create new version
            const newVersion = await tx.emailTemplateVersion.create({
                data: {
                    templateId: params.templateId,
                    version: nextVersion,
                    htmlContent,
                    textContent: textContent || null,
                    variables: variables || [],
                    isActive: setActive,
                    publishedAt: setActive ? new Date() : null,
                },
            });

            return newVersion;
        });

        return NextResponse.json(version);
    } catch (error) {
        console.error("Error creating template version:", error);
        return NextResponse.json(
            { error: "Failed to create template version" },
            { status: 500 }
        );
    }
}