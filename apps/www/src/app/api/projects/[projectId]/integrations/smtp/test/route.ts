import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { smtpSettingsSchema } from "@/lib/api/smtp";
import { createTransport } from "nodemailer";
import { createClient } from "@/lib/supabase/server";
import { hasProjectAccess } from "@/lib/auth/project-access";

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

        // Create a transporter with the provided SMTP settings
        const transporter = createTransport({
            host: validatedData.host,
            port: validatedData.port,
            secure: validatedData.secure,
            auth: {
                user: validatedData.username,
                pass: validatedData.password,
            },
            tls: {
                // Do not fail on invalid certificates
                rejectUnauthorized: false,
            },
        });

        // Verify the SMTP connection
        try {
            await transporter.verify();

            return NextResponse.json({
                success: true,
                message: "SMTP connection successful",
            });
        } catch (error: any) {
            console.error("SMTP verification error:", error);

            return NextResponse.json({
                success: false,
                message: `SMTP connection failed: ${error.message}`,
            }, { status: 200 }); // Still return 200 for frontend handling
        }
    } catch (error: any) {
        console.error("Error testing SMTP connection:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors, success: false }, { status: 400 });
        }
        return NextResponse.json({
            success: false,
            message: "Internal server error",
        }, { status: 500 });
    }
}