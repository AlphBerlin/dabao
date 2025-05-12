import { z } from "zod";

// SMTP Settings Interface
export interface SmtpSettings {
  id: string;
  projectId: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password?: string; // Not returned from API when fetched
  senderName: string;
  senderEmail: string;
  createdAt: string;
  updatedAt: string;
}

// Schema for validating SMTP settings
export const smtpSettingsSchema = z.object({
  host: z.string().min(1, "SMTP host is required"),
  port: z.number().int().min(1, "Port must be at least 1").max(65535, "Port must be at most 65535"),
  secure: z.boolean().default(true),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required").optional(),
  senderName: z.string().min(1, "Sender name is required"),
  senderEmail: z.string().email("Invalid sender email"),
});

export type SmtpSettingsInput = z.infer<typeof smtpSettingsSchema>;

// Fetch SMTP settings for a project
export async function fetchSmtpSettings(projectId: string): Promise<SmtpSettings | null> {
  try {
    const response = await fetch(`/api/projects/${projectId}/integrations/smtp`);
    
    if (response.status === 404) {
      // No settings found
      return null;
    }
    
    if (!response.ok) {
      throw new Error("Failed to fetch SMTP settings");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching SMTP settings:", error);
    return null;
  }
}

// Save (create or update) SMTP settings
export async function saveSmtpSettings(projectId: string, data: SmtpSettingsInput): Promise<SmtpSettings> {
  const response = await fetch(`/api/projects/${projectId}/integrations/smtp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to save SMTP settings");
  }

  return await response.json();
}

// Delete SMTP integration
export async function deleteSmtpIntegration(projectId: string): Promise<void> {
  const response = await fetch(`/api/projects/${projectId}/integrations/smtp`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete SMTP integration");
  }
}

// Test SMTP connection
export async function testSmtpConnection(projectId: string, data: SmtpSettingsInput): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`/api/projects/${projectId}/integrations/smtp/test`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return await response.json();
}

// Send test email using configured SMTP
export async function sendTestEmail(projectId: string, recipient: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`/api/projects/${projectId}/integrations/smtp/send-test`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ recipient }),
  });

  return await response.json();
}