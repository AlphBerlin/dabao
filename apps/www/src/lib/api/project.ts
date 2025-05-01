/**
 * Project API module
 * Handles all API calls related to projects with pagination and search
 */

import { Project } from "@prisma/client";
import { getCookie } from "@/lib/utils/cookies";

// The base API URL can change between environments (local vs production)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

// Project-specific endpoints
const PROJECT_API = {
  LIST: `${API_BASE_URL}/projects`,
  CREATE: `${API_BASE_URL}/projects`,
  GET: (id: string) => `${API_BASE_URL}/projects/${id}`,
  UPDATE: (id: string) => `${API_BASE_URL}/projects/${id}`,
  DELETE: (id: string) => `${API_BASE_URL}/projects/${id}`,
  SETTINGS: (id: string) => `${API_BASE_URL}/projects/${id}/settings`,
};

// Interface for project settings
export interface ProjectSettings {
  pointsName: string;
  primaryColor: string;
  referralEnabled: boolean;
  [key: string]: any; // Allow for additional settings
}

// Interface for pagination parameters
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Interface for paginated response
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }
}

/**
 * Helper function to get common request headers including organization ID
 */
async function getRequestHeaders(): Promise<HeadersInit> {

  // Get organization ID from cookie
  const orgId = await getCookie('orgId');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Add organization ID header if available
  if (orgId) {
    headers['x-org-id'] = orgId;
  }
  
  return headers;
}

/**
 * Get all projects for the current user with pagination and search
 */
export async function getProjects(params: PaginationParams = {}): Promise<PaginatedResponse<Project>> {
  const { 
    page = 1, 
    pageSize = 10, 
    search = '', 
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = params;

  try {
    // Build URL with query parameters
    const url = new URL(PROJECT_API.LIST, window.location.origin);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('pageSize', pageSize.toString());
    
    if (search) {
      url.searchParams.append('search', search);
    }
    
    if (status) {
      url.searchParams.append('status', status);
    }
    
    url.searchParams.append('sortBy', sortBy);
    url.searchParams.append('sortOrder', sortOrder);

    const headers = await getRequestHeaders();

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch projects');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
}

/**
 * Get a single project by ID
 */
export async function getProject(id: string): Promise<Project> {
  try {
    const headers = await getRequestHeaders();
    
    const response = await fetch(PROJECT_API.GET(id), {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch project');
    }

    return response.json();
  } catch (error) {
    console.error(`Error fetching project ${id}:`, error);
    throw error;
  }
}

/**
 * Update project settings
 */
export async function updateProjectSettings(id: string, settings: ProjectSettings): Promise<Project> {
  try {
    const headers = await getRequestHeaders();
    
    const response = await fetch(PROJECT_API.SETTINGS(id), {
      method: 'PATCH',
      headers,
      credentials: 'include',
      body: JSON.stringify({ settings }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update project settings');
    }

    return response.json();
  } catch (error) {
    console.error(`Error updating project settings for ${id}:`, error);
    throw error;
  }
}

/**
 * Create a new project
 */
export async function createProject(data: { 
  name: string; 
  description?: string;
  slug?: string;
  settings?: Partial<ProjectSettings> 
}): Promise<Project> {
  try {
    const headers = await getRequestHeaders();
    
    const response = await fetch(PROJECT_API.CREATE, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create project');
    }

    return response.json();
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<void> {
  try {
    const headers = await getRequestHeaders();
    
    const response = await fetch(PROJECT_API.DELETE(id), {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete project');
    }
  } catch (error) {
    console.error(`Error deleting project ${id}:`, error);
    throw error;
  }
}