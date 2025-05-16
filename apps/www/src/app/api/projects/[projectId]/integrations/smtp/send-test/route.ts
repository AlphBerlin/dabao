import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createTransport } from "nodemailer";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { hasProjectAccess } from "@/lib/auth/project-access";

// Schema for validating test email request
const testEmailSchema = z.object({
  recipient: z.string().email("Invalid email address"),
});

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

    if (!hasProjectAccess(user.id,projectId)) {  
      return new NextResponse("Project not found or access denied", { status: 404 });
    }

    // Parse and validate the request body
    const body = await req.json();
    const { recipient } = testEmailSchema.parse(body);

    // Get SMTP settings from the database
    const smtpSettings = await db.smtpConfig.findUnique({
      where: {
        projectId,
      },
    });

    if (!smtpSettings) {
      return NextResponse.json({
        success: false,
        message: "SMTP settings not configured",
      }, { status: 400 });
    }

    // Create a transporter with the SMTP settings
    const transporter = createTransport({
      host: smtpSettings.host,
      port: smtpSettings.port,
      secure: smtpSettings.secure,
      auth: {
        user: smtpSettings.username,
        pass: smtpSettings.password,
      },
      tls: {
        // Do not fail on invalid certificates
        rejectUnauthorized: false,
      },
    });

    // Create the test email
    const testEmail = {
      from: `"${smtpSettings.senderName}" <${smtpSettings.senderEmail}>`,
      to: recipient,
      subject: "Test Email from Your Application",
      text: `
Hello,

This is a test email sent from your application to verify that your SMTP configuration is working correctly.

If you're receiving this email, it means your SMTP settings are configured properly.

Here are your current SMTP settings:
- Host: ${smtpSettings.host}
- Port: ${smtpSettings.port}
- Secure: ${smtpSettings.secure ? 'Yes' : 'No'}
- Username: ${smtpSettings.username}
- Sender: ${smtpSettings.senderName} <${smtpSettings.senderEmail}>

You can now send emails from your application!

Regards,
Your Application Team
      `,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
  <h2 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Test Email Successful!</h2>
  
  <p>Hello,</p>
  
  <p>This is a test email sent from your application to verify that your SMTP configuration is working correctly.</p>
  
  <p><strong>If you're receiving this email, it means your SMTP settings are configured properly.</strong></p>
  
  <div style="background-color: #f5f5f5; border-left: 4px solid #2d8cff; padding: 15px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #333;">Your Current SMTP Settings:</h3>
    <ul style="padding-left: 20px;">
      <li><strong>Host:</strong> ${smtpSettings.host}</li>
      <li><strong>Port:</strong> ${smtpSettings.port}</li>
      <li><strong>Secure:</strong> ${smtpSettings.secure ? 'Yes' : 'No'}</li>
      <li><strong>Username:</strong> ${smtpSettings.username}</li>
      <li><strong>Sender:</strong> ${smtpSettings.senderName} &lt;${smtpSettings.senderEmail}&gt;</li>
    </ul>
  </div>
  
  <p>You can now send emails from your application!</p>
  
  <p>Regards,<br>Your Application Team</p>
  
  <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
    This is an automated test email. Please do not reply to this message.
  </div>
</div>
      `,
    };

    try {
      // Send the test email
      await transporter.sendMail(testEmail);
      
      // Update last tested timestamp
      await db.smtpConfig.update({
        where: {
          projectId,
        },
        data: {
          lastTestedAt: new Date(),
        },
      });
      
      return NextResponse.json({
        success: true,
        message: "Test email sent successfully",
      });
    } catch (error: any) {
      console.error("Error sending test email:", error);
      
      return NextResponse.json({
        success: false,
        message: `Failed to send test email: ${error.message}`,
      }, { status: 200 }); // Still return 200 for frontend handling
    }
  } catch (error: any) {
    console.error("Error in test email endpoint:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: "Invalid request data",
        errors: error.errors,
      }, { status: 400 });
    }
    return NextResponse.json({
      success: false,
      message: "Internal server error",
    }, { status: 500 });
  }
}