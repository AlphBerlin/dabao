// Domain and client management controller

import { db } from '@/lib/db';
import { generateApiKey, generateSecret } from '@/lib/crypto';
import { customAlphabet } from 'nanoid';

// Generate client IDs with a custom alphabet for readability
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 10);

/**
 * Create a new domain for a project
 */
export async function createProjectDomain(
  projectId: string,
  domain: string,
  type: 'PRIMARY' | 'SUBDOMAIN' | 'CUSTOM_DOMAIN' | 'ALIAS',
  isPrimary: boolean = false
) {
  // Generate a verification token if this is a custom domain
  const verificationToken = type === 'CUSTOM_DOMAIN' ? `verify-${nanoid()}` : null;
  
  const projectDomain = await db.projectDomain.create({
    data: {
      projectId,
      domain,
      type,
      isPrimary,
      isVerified: type !== 'CUSTOM_DOMAIN', // Auto-verify non-custom domains
      verificationToken,
      dnsSettings: type === 'CUSTOM_DOMAIN' 
        ? {
            verification: {
              type: 'TXT',
              name: `_dabao-verify.${domain}`,
              value: verificationToken
            },
            records: [
              {
                type: 'CNAME',
                name: domain,
                value: 'platform.dabao.in'
              }
            ]
          } 
        : null,
    },
  });

  return projectDomain;
}

/**
 * Verify a custom domain using TXT record
 */
export async function verifyDomain(domainId: string) {
  // In a real implementation, check the DNS record here
  // For this example, we'll simply mark it as verified

  const domain = await db.projectDomain.findUnique({
    where: { id: domainId }
  });

  if (!domain) {
    throw new Error('Domain not found');
  }

  return await db.projectDomain.update({
    where: { id: domainId },
    data: {
      isVerified: true,
      verifiedAt: new Date(),
    }
  });
}

/**
 * Create a client for a domain
 */
export async function createProjectClient(
  projectId: string,
  domainId: string,
  name: string,
  description: string | null = null,
  allowedIPs: string[] = ['*'],
  accessScope: Record<string, any> = { permissions: 'full' },
  expiresAt: Date | null = null
) {
  const clientId = `client_${nanoid()}`;
  const clientSecret = generateSecret();
  const apiKey = generateApiKey();

  const projectClient = await db.projectClient.create({
    data: {
      projectId,
      domainId,
      name,
      description,
      clientId,
      clientSecret,
      apiKey,
      allowedIPs,
      accessScope,
      expiresAt,
    },
  });

  return projectClient;
}

/**
 * Get all domains for a project
 */
export async function getProjectDomains(projectId: string) {
  return await db.projectDomain.findMany({
    where: { projectId },
    include: {
      clients: true,
    },
  });
}

/**
 * Get all clients for a domain
 */
export async function getDomainClients(domainId: string) {
  return await db.projectClient.findMany({
    where: { domainId },
  });
}

/**
 * Check if a client has access to specific resources
 */
export function checkClientAccess(client: any, resource: string) {
  if (!client || !client.accessScope) {
    return false;
  }

  // Full access permission
  if (client.accessScope.permissions === 'full') {
    return true;
  }

  // Check resource-specific permissions
  if (client.accessScope.resources && client.accessScope.resources.includes(resource)) {
    return true;
  }

  return false;
}
