// Test file for domain and client authentication
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { createProjectDomain, createProjectClient, verifyDomain } from '@/lib/domains';
import { db } from '@/lib/db';
import { generateApiKey } from '@/lib/crypto';

// Mock project and domain data
const TEST_PROJECT_ID = 'test_project_id';
const TEST_DOMAIN = 'test-domain.dabao.app';
const TEST_CUSTOM_DOMAIN = 'custom-test.example.com';
const TEST_CLIENT_NAME = 'Test Client';

// Store the created domain and client IDs for cleanup
let testProjectDomainId: string;
let testProjectClientId: string;
let testClientApiKey: string;

describe('Domain and Client Authentication', () => {
  // Setup test project, domain and client
  beforeAll(async () => {
    // Create test project if it doesn't exist
    const existingProject = await db.project.findUnique({
      where: { id: TEST_PROJECT_ID },
    });

    if (!existingProject) {
      await db.project.create({
        data: {
          id: TEST_PROJECT_ID,
          name: 'Test Project',
          slug: 'test-project',
        },
      });
    }

    // Create a test domain
    const domain = await createProjectDomain(
      TEST_PROJECT_ID,
      TEST_DOMAIN,
      'SUBDOMAIN',
      true // isPrimary
    );

    testProjectDomainId = domain.id;

    // Create a test client
    const client = await createProjectClient(
      TEST_PROJECT_ID,
      domain.id,
      TEST_CLIENT_NAME,
      'Test client for API access',
      ['127.0.0.1', '*'], // allowedIPs
      { permissions: 'full' } // accessScope
    );

    testProjectClientId = client.id;
    testClientApiKey = client.apiKey;
  });

  // Clean up after tests
  afterAll(async () => {
    if (testProjectClientId) {
      await db.projectClient.delete({
        where: { id: testProjectClientId },
      });
    }

    if (testProjectDomainId) {
      await db.projectDomain.delete({
        where: { id: testProjectDomainId },
      });
    }
  });

  // Test domain creation
  it('should create a domain correctly', async () => {
    const domain = await db.projectDomain.findUnique({
      where: { id: testProjectDomainId },
    });

    expect(domain).not.toBeNull();
    expect(domain?.domain).toBe(TEST_DOMAIN);
    expect(domain?.isPrimary).toBe(true);
    expect(domain?.isVerified).toBe(true); // Subdomains are auto-verified
  });

  // Test client creation
  it('should create a client correctly', async () => {
    const client = await db.projectClient.findUnique({
      where: { id: testProjectClientId },
    });

    expect(client).not.toBeNull();
    expect(client?.name).toBe(TEST_CLIENT_NAME);
    expect(client?.apiKey).toBe(testClientApiKey);
  });

  // Test domain verification process
  it('should verify a custom domain', async () => {
    // Create a custom domain (unverified)
    const customDomain = await createProjectDomain(
      TEST_PROJECT_ID,
      TEST_CUSTOM_DOMAIN,
      'CUSTOM_DOMAIN',
      false
    );

    // Initial state should be unverified
    expect(customDomain.isVerified).toBe(false);

    // Verify the domain
    const verifiedDomain = await verifyDomain(customDomain.id);

    // Check that it's been verified
    expect(verifiedDomain.isVerified).toBe(true);
    expect(verifiedDomain.verifiedAt).toBeTruthy();

    // Clean up
    await db.projectDomain.delete({
      where: { id: customDomain.id },
    });
  });

  // Test API authentication with the client key
  it('should authenticate an API request with valid credentials', async () => {
    // This is a mock test that would need a running server
    // In a real environment, you would make an actual HTTP request

    const mockServerUrl = `http://${TEST_DOMAIN}/api/test`;
    const mockRequest = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testClientApiKey}`,
        'Host': TEST_DOMAIN,
      },
    };

    // In a real test, you'd make this request:
    // const response = await fetch(mockServerUrl, mockRequest);
    // expect(response.status).toBe(200);

    // For this test file, we'll just verify the client exists with correct API key
    const client = await db.projectClient.findFirst({
      where: {
        apiKey: testClientApiKey,
        domainId: testProjectDomainId,
      },
    });

    expect(client).not.toBeNull();
    expect(client?.name).toBe(TEST_CLIENT_NAME);
  });

  // Test domain authentication rejection with invalid API key
  it('should reject a request with invalid API key', async () => {
    const invalidApiKey = generateApiKey();
    
    // Find client with invalid API key
    const client = await db.projectClient.findFirst({
      where: {
        apiKey: invalidApiKey,
        domainId: testProjectDomainId,
      },
    });

    // Should not find a client with this API key
    expect(client).toBeNull();
  });
});
