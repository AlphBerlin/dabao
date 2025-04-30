/**
 * Organization API module
 * Handles all API calls related to organizations
 */

// The base API URL can change between environments (local vs production)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

// Organization-specific endpoints
const ORGANIZATION_API = {
  LIST: `${API_BASE_URL}/organizations`,
  CREATE: `${API_BASE_URL}/organizations`,
  GET: (id: string) => `${API_BASE_URL}/organizations/${id}`,
  UPDATE: (id: string) => `${API_BASE_URL}/organizations/${id}`,
  DELETE: (id: string) => `${API_BASE_URL}/organizations/${id}`,
  USER_ORGS: `${API_BASE_URL}/user/organizations`,
};

export interface CreateOrganizationData {
  name: string;
  type: string;
  plan: string;
  billingEmail?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  billingEmail: string;
  address?: string;
  logo?: string;
  settings?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Fetch organizations for the current user
export async function getUserOrganizations(): Promise<Organization[]> {
  try {
    const response = await fetch(ORGANIZATION_API.USER_ORGS, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user organizations: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user organizations:', error);
    return [];
  }
}

// Check if the user has any organizations
export async function hasOrganizations(): Promise<boolean> {
  try {
    const organizations = await getUserOrganizations();
    return organizations.length > 0;
  } catch (error) {
    console.error('Error checking user organizations:', error);
    return false;
  }
}

// Create a new organization
export async function createOrganization(data: CreateOrganizationData): Promise<Organization | null> {
  try {
    const response = await fetch(ORGANIZATION_API.CREATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Failed to create organization: ${errorData.message || response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating organization:', error);
    throw error;
  }
}

// Additional organization API methods can be added here as needed