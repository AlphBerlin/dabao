import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createTransport } from "nodemailer";
import { createClient } from "@/lib/supabase/server";
import { hasProjectAccess } from "@/lib/auth/project-access";
import { smtpSettingsSchema } from "@/lib/api/smtp";

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const {projectId} = await params;

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
        pass: validatedData.password || "",
      },
      tls: {
        // Do not fail on invalid certificates
        rejectUnauthorized: false,
      },
    });
    
    // Verify the connection
    await transporter.verify();
    
    return NextResponse.json({ 
      success: true, 
      message: "SMTP connection successful" 
    });
    
  } catch (error: any) {
    console.error("SMTP connection test failed:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: "Invalid SMTP settings",
        errors: error.errors,
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: false,
      message: error.message || "Unknown error occurred" 
    }, { 
      status: 200 // Still return 200 as it's a test result, not a server error
    });
  }
}