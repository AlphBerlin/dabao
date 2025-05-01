/**
 * User Settings API module
 * Handles all API calls related to user account settings
 */

// The base API URL can change between environments (local vs production)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

// User settings-specific endpoints
const USER_SETTINGS_API = {
  GET: `${API_BASE_URL}/user/settings`,
  UPDATE: `${API_BASE_URL}/user/settings`,
};

export interface UserSettings {
  language: string;
  currency: string;
  notifications: {
    marketing: boolean;
    orderUpdates: boolean;
    loyaltyUpdates: boolean;
    pushNotifications: boolean;
  };
}

// Get current user settings
export async function getUserSettings(): Promise<UserSettings> {
  try {
    const response = await fetch(USER_SETTINGS_API.GET, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user settings: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user settings:', error);
    // Return default settings if fetch fails
    return {
      language: 'en',
      currency: 'usd',
      notifications: {
        marketing: true,
        orderUpdates: true,
        loyaltyUpdates: true,
        pushNotifications: true,
      },
    };
  }
}

// Update user settings
export async function updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  try {
    const response = await fetch(USER_SETTINGS_API.UPDATE, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Failed to update settings: ${errorData.message || response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
}

// Update user password
export async function updatePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Invalid password' }));
      throw new Error(errorData.message || 'Failed to update password');
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
}