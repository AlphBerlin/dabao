import { z } from "zod";

// Define the SMTP settings schema
export const smtpSettingsSchema = z.object({
  host: z.string().min(1, "SMTP host is required"),
  port: z.number().int().positive("Port must be a positive integer"),
  secure: z.boolean().default(true),
  username: z.string().min(1, "Username is required"),
  // Password is optional when updating existing settings
  password: z.string().optional(),
  senderName: z.string().min(1, "Sender name is required"),
  senderEmail: z.string().email("Must be a valid email address"),
});

// Define the type based on the schema
export type SmtpSettingsInput = z.infer<typeof smtpSettingsSchema>;

// Add other fields for the full SMTP settings
export interface SmtpSettings extends SmtpSettingsInput {
  id: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

// API functions
export async function fetchSmtpSettings(projectId: string): Promise<SmtpSettings | null> {
  const response = await fetch(`/api/projects/${projectId}/integrations/smtp`);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch SMTP settings');
  }
  return response.json();
}

export async function saveSmtpSettings(projectId: string, data: SmtpSettingsInput): Promise<SmtpSettings> {
  const response = await fetch(`/api/projects/${projectId}/integrations/smtp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to save SMTP settings');
  }
  
  return response.json();
}

export async function deleteSmtpIntegration(projectId: string): Promise<void> {
  const response = await fetch(`/api/projects/${projectId}/integrations/smtp`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete SMTP settings');
  }
}

interface TestConnectionResult {
  success: boolean;
  message?: string;
}

export async function testSmtpConnection(projectId: string, data: SmtpSettingsInput): Promise<TestConnectionResult> {
  const response = await fetch(`/api/projects/${projectId}/integrations/smtp/test-connection`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  return response.json();
}

export async function sendTestEmail(projectId: string, recipient: string): Promise<TestConnectionResult> {
  const response = await fetch(`/api/projects/${projectId}/integrations/smtp/send-test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ recipient }),
  });
  
  return response.json();
}