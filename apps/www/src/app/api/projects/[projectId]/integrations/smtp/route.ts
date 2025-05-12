import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { smtpSettingsSchema } from "@/lib/api/smtp";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { hasProjectAccess } from "@/lib/auth/project-access";

// GET - Fetch SMTP settings
export async function GET(
    req: NextRequest,
    { params }: { params: { projectId: string } }
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        const { projectId } = await params;

        // Verify the user has access to this project
        if (!hasProjectAccess(user.id, projectId)) {
            return new NextResponse("Project not found or access denied", { status: 404 });
        }

        // Get SMTP settings
        const smtpSettings = await db.smtpConfig.findUnique({
            where: {
                projectId,
            },
            select: {
                id: true,
                projectId: true,
                host: true,
                port: true,
                secure: true,
                username: true,
                senderName: true,
                senderEmail: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!smtpSettings) {
            return new NextResponse("SMTP settings not found", { status: 404 });
        }

        return NextResponse.json(smtpSettings);
    } catch (error: any) {
        console.error("Error fetching SMTP settings:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// POST - Create or update SMTP settings
export async function POST(
    req: NextRequest,
    { params }: { params: { projectId: string } }
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        const { projectId } = await params;

        // Verify the user has access to this project
        if (!hasProjectAccess(user.id, projectId)) {
            return new NextResponse("Project not found or access denied", { status: 404 });
        }

        // Parse and validate the request body
        const body = await req.json();
        const validatedData = smtpSettingsSchema.parse(body);

        // Check if SMTP settings already exist
        const existingSettings = await db.smtpConfig.findUnique({
            where: {
                projectId,
            },
        });

        let smtpSettings;
        if (existingSettings) {
            // Update existing settings
            // If no password is provided, keep the old one
            const updateData: any = {
                host: validatedData.host,
                port: validatedData.port,
                secure: validatedData.secure,
                username: validatedData.username,
                senderName: validatedData.senderName,
                senderEmail: validatedData.senderEmail,
            };

            if (validatedData.password) {
                updateData.password = validatedData.password;
            }

            smtpSettings = await db.smtpConfig.update({
                where: {
                    projectId,
                },
                data: updateData,
                select: {
                    id: true,
                    projectId: true,
                    host: true,
                    port: true,
                    secure: true,
                    username: true,
                    senderName: true,
                    senderEmail: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
        } else {
            // Create new settings
            if (!validatedData.password) {
                return new NextResponse("Password is required for new SMTP configuration", { status: 400 });
            }

            smtpSettings = await db.smtpConfig.create({
                data: {
                    projectId,
                    host: validatedData.host,
                    port: validatedData.port,
                    secure: validatedData.secure,
                    username: validatedData.username,
                    password: validatedData.password,
                    senderName: validatedData.senderName,
                    senderEmail: validatedData.senderEmail,
                },
                select: {
                    id: true,
                    projectId: true,
                    host: true,
                    port: true,
                    secure: true,
                    username: true,
                    senderName: true,
                    senderEmail: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
        }

        return NextResponse.json(smtpSettings);
    } catch (error: any) {
        console.error("Error saving SMTP settings:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// DELETE - Remove SMTP settings
export async function DELETE(
    req: NextRequest,
    { params }: { params: { projectId: string } }
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        const { projectId } = await params;

        // Verify the user has access to this project
        if (!hasProjectAccess(user.id, projectId)) {
            return new NextResponse("Project not found or access denied", { status: 404 });
        }

        // Delete SMTP settings
        await db.smtpConfig.delete({
            where: {
                projectId,
            },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error: any) {
        console.error("Error deleting SMTP settings:", error);
        if (error.code === 'P2025') {
            return new NextResponse("SMTP settings not found", { status: 404 });
        }
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}