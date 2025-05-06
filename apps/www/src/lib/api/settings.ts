import { ApiError, handleApiError } from "./common";

/**
 * API functions for project settings
 */

/**
 * Branding related API calls
 */
export interface BrandingSettings {
  id?: string;
  projectId: string;
  name: string;
  logo: string | null;
  favicon: string | null;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
  customDomain?: string | null;
  mascot?: string | null;
}

export async function getBrandingSettings(projectId: string): Promise<BrandingSettings> {
  const response = await fetch(`/api/projects/${projectId}/branding`);
  if (!response.ok) {
    throw new Error(`Failed to fetch branding settings: ${response.statusText}`);
  }
  return response.json();
}

export async function updateBrandingSettings(data: BrandingSettings): Promise<BrandingSettings> {
  const response = await fetch(`/api/projects/${data.projectId}/branding`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update branding settings: ${response.statusText}`);
  }
  
  return response.json();
}

export async function generateImage(projectId: string, prompt: string, type: 'logo' | 'mascot'): Promise<{ url: string }> {
  const response = await fetch(`/api/projects/${projectId}/branding/generate-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, type }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to generate image: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * API Token related API calls
 */
export interface ApiToken {
  id: string;
  name: string;
  type: string;
  status: "active" | "expired";
  lastUsed: string | null;
  expiresAt: string | null;
  token?: string;
  permissions: string[];
}

export async function getApiTokens(projectId: string): Promise<ApiToken[]> {
  const response = await fetch(`/api/projects/${projectId}/api-tokens`);
  if (!response.ok) {
    throw new Error(`Failed to fetch API tokens: ${response.statusText}`);
  }
  return response.json();
}

export async function createApiToken(projectId: string, data: {
  name: string;
  type: string;
  expiryDays: number;
  permissions: string[];
}): Promise<ApiToken> {
  const response = await fetch(`/api/projects/${projectId}/api-tokens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create API token: ${response.statusText}`);
  }
  
  return response.json();
}

export async function revokeApiToken(projectId: string, tokenId: string): Promise<void> {
  const response = await fetch(`/api/projects/${projectId}/api-tokens/${tokenId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to revoke API token: ${response.statusText}`);
  }
}

/**
 * User management related API calls
 */
export interface ProjectUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "pending" | "inactive";
  joinedAt: string | null;
  lastActive: string | null;
  avatar?: string;
}

export interface Organization {
  id: string;
  name: string;
}


export async function getOrganizations(projectId: string): Promise<Organization[]> {
  const response = await fetch(`/api/projects/${projectId}/organizations`);
  if (!response.ok) {
    throw new Error(`Failed to fetch organizations: ${response.statusText}`);
  }
  return response.json();
}


export async function removeUser(projectId: string, userId: string): Promise<void> {
  const response = await fetch(`/api/projects/${projectId}/users/${userId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to remove user: ${response.statusText}`);
  }
}

export async function resendInvite(projectId: string, userId: string): Promise<void> {
  const response = await fetch(`/api/projects/${projectId}/users/${userId}/resend-invite`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to resend invite: ${response.statusText}`);
  }
}

/**
 * Billing and subscription related API calls
 */
export interface PlanInfo {
  name: string;
  price: number;
  billingCycle: string;
  status: "active" | "canceled" | "past_due";
  startDate: string;
  nextBillingDate: string;
  features: string[];
}

export interface License {
  id: string;
  name: string;
  status: "active" | "expired" | "revoked";
  type: string;
  seats: number;
  usedSeats: number;
  expiresAt: string;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  date: string;
  description: string;
  status: "completed" | "pending" | "failed";
}

export interface CreditInfo {
  credits: number;
  maxCredits: number;
}

export async function getCreditInfo(projectId: string): Promise<CreditInfo> {
  const response = await fetch(`/api/projects/${projectId}/billing/credits`);
  if (!response.ok) {
    throw new Error(`Failed to fetch credit info: ${response.statusText}`);
  }
  return response.json();
}

export async function getPlanInfo(projectId: string): Promise<PlanInfo> {
  const response = await fetch(`/api/projects/${projectId}/billing/plan`);
  if (!response.ok) {
    throw new Error(`Failed to fetch plan info: ${response.statusText}`);
  }
  return response.json();
}

export async function getLicenses(projectId: string): Promise<License[]> {
  const response = await fetch(`/api/projects/${projectId}/billing/licenses`);
  if (!response.ok) {
    throw new Error(`Failed to fetch licenses: ${response.statusText}`);
  }
  return response.json();
}

export async function getTransactions(projectId: string): Promise<Transaction[]> {
  const response = await fetch(`/api/projects/${projectId}/billing/transactions`);
  if (!response.ok) {
    throw new Error(`Failed to fetch transactions: ${response.statusText}`);
  }
  return response.json();
}

export async function purchaseCredits(projectId: string, amount: number): Promise<{ success: boolean; transaction: Transaction }> {
  const response = await fetch(`/api/projects/${projectId}/billing/credits/purchase`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to purchase credits: ${response.statusText}`);
  }
  
  return response.json();
}

export async function changePlan(projectId: string, planName: string): Promise<PlanInfo> {
  const response = await fetch(`/api/projects/${projectId}/billing/plan`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ planName }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to change plan: ${response.statusText}`);
  }
  
  return response.json();
}

export async function createLicense(projectId: string, data: {
  name: string;
  type: string;
  seats: number;
}): Promise<License> {
  const response = await fetch(`/api/projects/${projectId}/billing/licenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create license: ${response.statusText}`);
  }
  
  return response.json();
}

export async function revokeLicense(projectId: string, licenseId: string): Promise<void> {
  const response = await fetch(`/api/projects/${projectId}/billing/licenses/${licenseId}/revoke`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to revoke license: ${response.statusText}`);
  }
}

// Types for Settings API
export interface ProjectSettings {
  name: string;
  description?: string;
  slug: string;
  logo?: string;
  customDomain?: string;
  theme?: Record<string, any>;
}

export interface BillingInfo {
  id: string;
  plan: string;
  status: string;
  currency: string;
  amount: number;
  interval: string;
  trialEndsAt?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export interface InviteUserData {
  email: string;
  role: string;
}

// Get project settings
export async function getProjectSettings(projectId: string): Promise<ProjectSettings> {
  try {
    const response = await fetch(`/api/projects/${projectId}/settings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new ApiError('Failed to fetch project settings', response.status);
    }

    return await response.json();
  } catch (error) {
    return handleApiError(error, 'Failed to fetch project settings');
  }
}

// Update project settings
export async function updateProjectSettings(
  projectId: string, 
  settings: Partial<ProjectSettings>
): Promise<ProjectSettings> {
  try {
    const response = await fetch(`/api/projects/${projectId}/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new ApiError('Failed to update project settings', response.status);
    }

    return await response.json();
  } catch (error) {
    return handleApiError(error, 'Failed to update project settings');
  }
}

// Update project theme
export async function updateProjectTheme(
  projectId: string,
  theme: Record<string, any>
): Promise<ProjectSettings> {
  try {
    const response = await fetch(`/api/projects/${projectId}/settings/theme`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ theme }),
    });

    if (!response.ok) {
      throw new ApiError('Failed to update project theme', response.status);
    }

    return await response.json();
  } catch (error) {
    return handleApiError(error, 'Failed to update project theme');
  }
}

// Upload logo
export async function uploadLogo(
  projectId: string,
  file: File
): Promise<{ logoUrl: string }> {
  try {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await fetch(`/api/projects/${projectId}/branding/logo`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new ApiError('Failed to upload logo', response.status);
    }

    return await response.json();
  } catch (error) {
    return handleApiError(error, 'Failed to upload logo');
  }
}


// Delete an API token
export async function deleteApiToken(
  projectId: string,
  tokenId: string
): Promise<void> {
  try {
    const response = await fetch(`/api/projects/${projectId}/api-tokens/${tokenId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new ApiError('Failed to delete API token', response.status);
    }
  } catch (error) {
    return handleApiError(error, 'Failed to delete API token');
  }
}

// User Management

// Get project users
export async function getProjectUsers(projectId: string): Promise<ProjectUser[]> {
  try {
    const response = await fetch(`/api/projects/${projectId}/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new ApiError('Failed to fetch project users', response.status);
    }

    return await response.json();
  } catch (error) {
    return handleApiError(error, 'Failed to fetch project users');
  }
}

// Invite user to project
export async function inviteUser(
  projectId: string,
  data: InviteUserData
): Promise<{ id: string; email: string; role: string }> {
  try {
    const response = await fetch(`/api/projects/${projectId}/users/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new ApiError('Failed to invite user', response.status);
    }

    return await response.json();
  } catch (error) {
    return handleApiError(error, 'Failed to invite user');
  }
}

// Update user role
export async function updateUserRole(
  projectId: string,
  userId: string,
  role: string
): Promise<{ id: string; role: string }> {
  try {
    const response = await fetch(`/api/projects/${projectId}/users/${userId}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      throw new ApiError('Failed to update user role', response.status);
    }

    return await response.json();
  } catch (error) {
    return handleApiError(error, 'Failed to update user role');
  }
}

// Remove user from project
export async function removeUserFromProject(
  projectId: string,
  userId: string
): Promise<void> {
  try {
    const response = await fetch(`/api/projects/${projectId}/users/${userId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new ApiError('Failed to remove user', response.status);
    }
  } catch (error) {
    return handleApiError(error, 'Failed to remove user');
  }
}

// Billing

// Get project billing information
export async function getProjectBilling(projectId: string): Promise<BillingInfo> {
  try {
    const response = await fetch(`/api/projects/${projectId}/billing`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new ApiError('Failed to fetch billing information', response.status);
    }

    return await response.json();
  } catch (error) {
    return handleApiError(error, 'Failed to fetch billing information');
  }
}

// Update subscription plan
export async function updateSubscription(
  projectId: string,
  data: { plan: string; interval?: string }
): Promise<BillingInfo> {
  try {
    const response = await fetch(`/api/projects/${projectId}/billing/subscription`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new ApiError('Failed to update subscription', response.status);
    }

    return await response.json();
  } catch (error) {
    return handleApiError(error, 'Failed to update subscription');
  }
}

// Get billing portal URL
export async function getBillingPortalUrl(projectId: string): Promise<{ url: string }> {
  try {
    const response = await fetch(`/api/projects/${projectId}/billing/portal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new ApiError('Failed to get billing portal URL', response.status);
    }

    return await response.json();
  } catch (error) {
    return handleApiError(error, 'Failed to get billing portal URL');
  }
}