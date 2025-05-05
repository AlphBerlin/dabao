// API functions for Telegram bot integration

import { handleApiError } from './utils';

// Types for Telegram Settings
export interface TelegramSettings {
  id: string;
  projectId: string;
  botToken: string;
  botUsername: string;
  webhookUrl: string | null;
  welcomeMessage: string | null;
  helpMessage: string | null;
  enableCommands: boolean;
  createdAt: string;
  updatedAt: string;
}

// Type for Telegram analytics
export interface TelegramAnalytics {
  totalUsers: number;
  activeUsers: number;
  messagesSent: number;
  messagesReceived: number;
  subscribedUsers: number;
  unsubscribedUsers: number;
  userGrowth: { date: string; count: number }[];
  messageActivity: { date: string; sent: number; received: number }[];
}

// Type for Telegram campaign stats
export interface TelegramCampaignStats {
  id: string;
  name: string;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  clickCount: number;
}

// Type for Telegram commands
export interface TelegramCommand {
  id: string;
  projectId: string;
  command: string;
  description: string;
  response: string | null;
  type: TelegramCommandType;
  isEnabled: boolean;
  sortOrder: number;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

// Enum for Telegram command types
export enum TelegramCommandType {
  TEXT_RESPONSE = "TEXT_RESPONSE",
  BUTTON_MENU = "BUTTON_MENU",
  POINTS_INFO = "POINTS_INFO",
  MEMBERSHIP_INFO = "MEMBERSHIP_INFO", 
  COUPON_GENERATOR = "COUPON_GENERATOR",
  CUSTOM_ACTION = "CUSTOM_ACTION"
}

/**
 * Fetch Telegram settings for a project
 */
export async function fetchTelegramSettings(projectId: string): Promise<TelegramSettings | null> {
  try {
    const response = await fetch(`/api/projects/${projectId}/integrations/telegram`);
    if (!response.ok) {
      if (response.status === 404) {
        return null; // Settings don't exist yet
      }
      return handleApiError(response);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Telegram settings:', error);
    throw error;
  }
}

/**
 * Create or update Telegram settings
 */
export async function saveTelegramSettings(projectId: string, settings: Partial<TelegramSettings>): Promise<TelegramSettings> {
  try {
    const response = await fetch(`/api/projects/${projectId}/integrations/telegram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    
    if (!response.ok) {
      return handleApiError(response);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving Telegram settings:', error);
    throw error;
  }
}

/**
 * Delete Telegram integration
 */
export async function deleteTelegramIntegration(projectId: string): Promise<void> {
  try {
    const response = await fetch(`/api/projects/${projectId}/integrations/telegram`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      return handleApiError(response);
    }
  } catch (error) {
    console.error('Error deleting Telegram integration:', error);
    throw error;
  }
}

/**
 * Fetch Telegram analytics
 */
export async function fetchTelegramAnalytics(
  projectId: string,
  period: 'day' | 'week' | 'month' | 'year' = 'month'
): Promise<TelegramAnalytics> {
  try {
    const response = await fetch(
      `/api/projects/${projectId}/integrations/telegram/analytics?period=${period}`
    );
    
    if (!response.ok) {
      return handleApiError(response);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching Telegram analytics:', error);
    throw error;
  }
}

/**
 * Fetch Telegram campaign statistics
 */
export async function fetchTelegramCampaigns(projectId: string): Promise<TelegramCampaignStats[]> {
  try {
    const response = await fetch(`/api/projects/${projectId}/integrations/telegram/campaigns`);
    
    if (!response.ok) {
      return handleApiError(response);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching Telegram campaigns:', error);
    throw error;
  }
}

/**
 * Fetch Telegram commands for a project
 */
export async function fetchTelegramCommands(projectId: string): Promise<TelegramCommand[]> {
  try {
    const response = await fetch(`/api/projects/${projectId}/integrations/telegram/commands`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return []; // No commands exist yet
      }
      return handleApiError(response);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching Telegram commands:', error);
    throw error;
  }
}

/**
 * Create a new Telegram command
 */
export async function createTelegramCommand(projectId: string, command: Partial<TelegramCommand>): Promise<TelegramCommand> {
  try {
    const response = await fetch(`/api/projects/${projectId}/integrations/telegram/commands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    });
    
    if (!response.ok) {
      return handleApiError(response);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating Telegram command:', error);
    throw error;
  }
}

/**
 * Update an existing Telegram command
 */
export async function updateTelegramCommand(projectId: string, commandId: string, command: Partial<TelegramCommand>): Promise<TelegramCommand> {
  try {
    const response = await fetch(`/api/projects/${projectId}/integrations/telegram/commands?commandId=${commandId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    });
    
    if (!response.ok) {
      return handleApiError(response);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating Telegram command:', error);
    throw error;
  }
}

/**
 * Delete a Telegram command
 */
export async function deleteTelegramCommand(projectId: string, commandId: string): Promise<void> {
  try {
    const response = await fetch(`/api/projects/${projectId}/integrations/telegram/commands?commandId=${commandId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      return handleApiError(response);
    }
  } catch (error) {
    console.error('Error deleting Telegram command:', error);
    throw error;
  }
}

/**
 * Reorder Telegram commands
 */
export async function reorderTelegramCommands(projectId: string, commandIds: string[]): Promise<TelegramCommand[]> {
  try {
    const response = await fetch(`/api/projects/${projectId}/integrations/telegram/commands`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'reorder',
        commandIds,
      }),
    });
    
    if (!response.ok) {
      return handleApiError(response);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error reordering Telegram commands:', error);
    throw error;
  }
}
