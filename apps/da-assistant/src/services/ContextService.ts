import { PrismaService } from './prismaService';
import { UserContext, OrganizationContext, ProjectContext } from '../middleware/context/contextTypes';

/**
 * Service to manage server context information
 * Handles fetching user, organization, and project details
 */
export class ContextService {
  private static instance: ContextService;
  private prisma: PrismaService;

  private constructor() {
    this.prisma = PrismaService.getInstance();
  }

  /**
   * Get a singleton instance of ContextService
   */
  public static getInstance(): ContextService {
    if (!ContextService.instance) {
      ContextService.instance = new ContextService();
    }
    return ContextService.instance;
  }

  /**
   * Get user details from the database using supabase user id
   * @param supabaseUserId - The Supabase user ID
   * @returns User context object or null if user not found
   */
  async getUserBySupabaseId(supabaseUserId: string): Promise<UserContext | null> {
    try {
      const user = await this.prisma.prisma.user.findUnique({
        where: { supabaseUserId }
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        supabaseUserId: user.supabaseUserId
      };
    } catch (error) {
      console.error('Error fetching user by Supabase ID:', error);
      return null;
    }
  }

  /**
   * Get user's organizations with role information
   * @param userId - The database user ID
   * @returns Array of organization context objects
   */
  async getUserOrganizations(userId: string): Promise<OrganizationContext[]> {
    try {
      const userOrgs = await this.prisma.prisma.userOrganization.findMany({
        where: { userId },
        include: {
          organization: true
        }
      });

      return userOrgs.map(userOrg => ({
        id: userOrg.organization.id,
        name: userOrg.organization.name,
        slug: userOrg.organization.slug,
        userRole: userOrg.role
      }));
    } catch (error) {
      console.error('Error fetching user organizations:', error);
      return [];
    }
  }

  /**
   * Get user's primary organization (first found or with OWNER role)
   * @param userId - The database user ID
   * @returns Primary organization context object or null if none found
   */
  async getUserPrimaryOrganization(userId: string): Promise<OrganizationContext | null> {
    try {
      const organizations = await this.getUserOrganizations(userId);
      
      if (organizations.length === 0) {
        return null;
      }
      
      // Try to find an organization where user is an owner
      const ownerOrg = organizations.find(org => org.userRole === 'OWNER');
      if (ownerOrg) {
        return ownerOrg;
      }
      
      // Otherwise return the first organization
      return organizations[0]!;
    } catch (error) {
      console.error('Error fetching user primary organization:', error);
      return null;
    }
  }

  /**
   * Get projects for an organization
   * @param organizationId - The organization ID
   * @returns Array of project context objects
   */
  async getOrganizationProjects(organizationId: string): Promise<ProjectContext[]> {
    try {
      const projects = await this.prisma.prisma.project.findMany({
        where: { organizationId }
      });

      return projects.map(project => ({
        id: project.id,
        name: project.name,
        slug: project.slug,
        organizationId: project.organizationId
      }));
    } catch (error) {
      console.error('Error fetching organization projects:', error);
      return [];
    }
  }

  /**
   * Get project details by project ID
   * @param projectId - The project ID
   * @returns Project context object or null if not found
   */
  async getProject(projectId: string): Promise<ProjectContext | null> {
    try {
      const project = await this.prisma.prisma.project.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        return null;
      }

      return {
        id: project.id,
        name: project.name,
        slug: project.slug,
        organizationId: project.organizationId
      };
    } catch (error) {
      console.error('Error fetching project details:', error);
      return null;
    }
  }

  /**
   * Check if a user has access to a project
   * @param userId - The user ID
   * @param projectId - The project ID
   * @returns Boolean indicating if user has access
   */
  async hasProjectAccess(userId: string, projectId: string): Promise<boolean> {
    try {
      const project = await this.prisma.prisma.project.findUnique({
        where: { id: projectId },
        select: { organizationId: true }
      });

      if (!project) {
        return false;
      }

      const userOrg = await this.prisma.prisma.userOrganization.findFirst({
        where: {
          userId,
          organizationId: project.organizationId
        }
      });

      return !!userOrg;
    } catch (error) {
      console.error('Error checking project access:', error);
      return false;
    }
  }
}