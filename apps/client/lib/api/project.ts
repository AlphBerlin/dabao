/**
 * Project API module
 * Handles all API calls related to projects
 */

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

export interface ProjectSettings {
  pointsName: string;
  primaryColor: string;
  referralEnabled: boolean;
  [key: string]: any; // Allow for additional settings
}

export interface Project {
  id: string;
  name: string;
  settings: ProjectSettings;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all projects for the current user
 */
export async function getProjects(): Promise<Project[]> {
  try {
    const response = await fetch(PROJECT_API.LIST, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch projects');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching projects:', error);
    // Return a mock project for development
    return [
      {
        id: '1',
        name: 'Default Project',
        settings: {
          pointsName: 'Points',
          primaryColor: '#3e63dd',
          referralEnabled: true,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
  }
}

/**
 * Get a single project by ID
 */
export async function getProject(id: string): Promise<Project> {
  try {
    const response = await fetch(PROJECT_API.GET(id), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const response = await fetch(PROJECT_API.SETTINGS(id), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
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
export async function createProject(data: { name: string; settings?: Partial<ProjectSettings> }): Promise<Project> {
  try {
    const response = await fetch(PROJECT_API.CREATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const response = await fetch(PROJECT_API.DELETE(id), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
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