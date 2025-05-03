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
