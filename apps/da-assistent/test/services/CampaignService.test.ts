import { createClients, promisifyMethods, authenticateUser, createAuthMetadata, generateTestData } from '../testHelpers.js';
import * as grpc from '@grpc/grpc-js';

describe('CampaignService', () => {
  const clients = createClients();
  const methods = promisifyMethods(clients);
  let authToken: string;
  let metadata: grpc.Metadata;
  let adminMetadata: grpc.Metadata;
  let testCampaignId: string;
  
  beforeAll(async () => {
    try {
      // Authenticate as a regular user
      const userResponse = await authenticateUser(methods.auth.authenticate);
      authToken = userResponse.token;
      metadata = createAuthMetadata(authToken);
      
      // Authenticate as an admin user
      const adminResponse = await authenticateUser(methods.auth.authenticate, 'admin@example.com', 'adminPassword');
      adminMetadata = createAuthMetadata(adminResponse.token);
    } catch (error:any) {
      console.error('Setup failed:', error);
      throw error;
    }
  });

  describe('ListCampaigns', () => {
    it('should list campaigns with pagination', async () => {
      try {
        const request = {
          page: 1,
          page_size: 10
        };
        
        const response = await methods.campaign.listCampaigns(request, metadata);
        
        expect(response).toBeDefined();
        expect(Array.isArray(response.campaigns)).toBe(true);
        expect(typeof response.total_count).toBe('number');
        expect(response.page).toBe(request.page);
        expect(response.page_size).toBe(request.page_size);
      } catch (error:any) {
        console.error('ListCampaigns error:', error);
        throw error;
      }
    });

    it('should respect page and page size parameters', async () => {
      try {
        // Request first page with smaller size
        const requestPage1 = {
          page: 1,
          page_size: 5
        };
        
        const responsePage1 = await methods.campaign.listCampaigns(requestPage1, metadata);
        
        // Request second page with same size
        const requestPage2 = {
          page: 2,
          page_size: 5
        };
        
        const responsePage2 = await methods.campaign.listCampaigns(requestPage2, metadata);
        
        expect(responsePage1).toBeDefined();
        expect(responsePage2).toBeDefined();
        expect(responsePage1.page).toBe(1);
        expect(responsePage2.page).toBe(2);
        
        // Check that we got different results on different pages
        if (responsePage1.campaigns.length > 0 && responsePage2.campaigns.length > 0) {
          const firstIdPage1 = responsePage1.campaigns[0].id;
          const firstIdPage2 = responsePage2.campaigns[0].id;
          expect(firstIdPage1).not.toBe(firstIdPage2);
        }
      } catch (error:any) {
        console.error('Pagination error:', error);
        throw error;
      }
    });

    it('should filter campaigns based on criteria', async () => {
      try {
        // Request with filter
        const requestFiltered = {
          page: 1,
          page_size: 10,
          filter: 'status=DRAFT' // Filter for draft campaigns
        };
        
        const responseFiltered = await methods.campaign.listCampaigns(requestFiltered, metadata);
        
        expect(responseFiltered).toBeDefined();
        
        // Check if all returned campaigns match the filter
        responseFiltered.campaigns.forEach((campaign:any) => {
          expect(campaign.status).toBe(0); // DRAFT status is 0
        });
      } catch (error:any) {
        console.error('Filter error:', error);
        throw error;
      }
    });
  });

  describe('CreateCampaign', () => {
    it('should create a campaign with required fields', async () => {
      try {
        const testData = generateTestData();
        const request = {
          name: testData.campaign.name,
          description: testData.campaign.description
        };
        
        const response = await methods.campaign.createCampaign(request, adminMetadata);
        
        expect(response).toBeDefined();
        expect(response.id).toBeDefined();
        expect(response.name).toBe(request.name);
        expect(response.description).toBe(request.description);
        expect(response.status).toBe(0); // DRAFT
        expect(response.created_at).toBeDefined();
        expect(response.updated_at).toBeDefined();
        expect(response.created_by).toBeDefined();
        
        // Save ID for later tests
        testCampaignId = response.id;
      } catch (error:any) {
        console.error('CreateCampaign error:', error);
        throw error;
      }
    });

    it('should create a campaign with metadata', async () => {
      try {
        const testData = generateTestData();
        const request = {
          name: testData.campaign.name,
          description: testData.campaign.description,
          metadata: testData.campaign.metadata
        };
        
        const response = await methods.campaign.createCampaign(request, adminMetadata);
        
        expect(response).toBeDefined();
        expect(response.id).toBeDefined();
        expect(response.metadata).toBeDefined();
        
        // Check that metadata was saved correctly
        Object.entries(request.metadata).forEach(([key, value]) => {
          expect(response.metadata[key]).toBe(value);
        });
      } catch (error:any) {
        console.error('CreateCampaign with metadata error:', error);
        throw error;
      }
    });

    it('should reject creation without name', async () => {
      try {
        const request = {
          // No name provided
          description: 'Campaign without name should fail'
        };
        
        await methods.campaign.createCampaign(request, adminMetadata);
        
        // Should not reach here
        fail('Campaign creation should fail without a name');
      } catch (error:any) {
        expect(error).toBeDefined();
        expect(error.code).toBe(grpc.status.INVALID_ARGUMENT);
      }
    });

    it('should reject creation without admin permissions', async () => {
      try {
        const testData = generateTestData();
        const request = {
          name: testData.campaign.name,
          description: testData.campaign.description
        };
        
        // Use regular user metadata instead of admin
        await methods.campaign.createCampaign(request, metadata);
        
        // Should not reach here
        fail('Campaign creation should fail without admin permissions');
      } catch (error:any) {
        expect(error).toBeDefined();
        expect(error.code).toBe(grpc.status.PERMISSION_DENIED);
      }
    });
  });

  describe('GetCampaign', () => {
    it('should retrieve a campaign by ID', async () => {
      try {
        // Use the ID from the creation test
        expect(testCampaignId).toBeDefined();
        
        const request = {
          id: testCampaignId
        };
        
        const response = await methods.campaign.getCampaign(request, metadata);
        
        expect(response).toBeDefined();
        expect(response.id).toBe(testCampaignId);
        expect(response.name).toBeDefined();
        expect(response.status).toBeDefined();
      } catch (error:any) {
        console.error('GetCampaign error:', error);
        throw error;
      }
    });

    it('should return error for non-existent campaign', async () => {
      try {
        const request = {
          id: 'non_existent_campaign_id'
        };
        
        await methods.campaign.getCampaign(request, metadata);
        
        // Should not reach here
        fail('GetCampaign should fail for non-existent ID');
      } catch (error:any) {
        expect(error).toBeDefined();
        expect(error.code).toBe(grpc.status.NOT_FOUND);
      }
    });
  });

  describe('UpdateCampaign', () => {
    it('should update campaign fields', async () => {
      try {
        // Use the ID from the creation test
        expect(testCampaignId).toBeDefined();
        
        const updateRequest = {
          id: testCampaignId,
          name: 'Updated Campaign Name',
          description: 'Updated campaign description'
        };
        
        const response = await methods.campaign.updateCampaign(updateRequest, adminMetadata);
        
        expect(response).toBeDefined();
        expect(response.id).toBe(testCampaignId);
        expect(response.name).toBe(updateRequest.name);
        expect(response.description).toBe(updateRequest.description);
        expect(response.updated_at).toBeDefined();
        
        // Verify with a get request
        const getResponse = await methods.campaign.getCampaign({ id: testCampaignId }, metadata);
        expect(getResponse.name).toBe(updateRequest.name);
        expect(getResponse.description).toBe(updateRequest.description);
      } catch (error:any) {
        console.error('UpdateCampaign error:', error);
        throw error;
      }
    });

    it('should update campaign status', async () => {
      try {
        expect(testCampaignId).toBeDefined();
        
        const updateRequest = {
          id: testCampaignId,
          status: 2 // ACTIVE
        };
        
        const response = await methods.campaign.updateCampaign(updateRequest, adminMetadata);
        
        expect(response).toBeDefined();
        expect(response.status).toBe(updateRequest.status);
        
        // Verify with a get request
        const getResponse = await methods.campaign.getCampaign({ id: testCampaignId }, metadata);
        expect(getResponse.status).toBe(updateRequest.status);
      } catch (error:any) {
        console.error('UpdateCampaign status error:', error);
        throw error;
      }
    });

    it('should reject updates without admin permissions', async () => {
      try {
        expect(testCampaignId).toBeDefined();
        
        const updateRequest = {
          id: testCampaignId,
          name: 'Unauthorized Update'
        };
        
        // Use regular user metadata instead of admin
        await methods.campaign.updateCampaign(updateRequest, metadata);
        
        // Should not reach here
        fail('Campaign update should fail without admin permissions');
      } catch (error:any) {
        expect(error).toBeDefined();
        expect(error.code).toBe(grpc.status.PERMISSION_DENIED);
      }
    });
  });

  describe('ScheduleCampaign', () => {
    it('should schedule a campaign for future activation', async () => {
      try {
        expect(testCampaignId).toBeDefined();
        
        // Schedule for tomorrow
        const scheduledTime = new Date(Date.now() + 86400000).toISOString();
        const request = {
          id: testCampaignId,
          scheduled_at: scheduledTime
        };
        
        const response = await methods.campaign.scheduleCampaign(request, adminMetadata);
        
        expect(response).toBeDefined();
        expect(response.id).toBe(testCampaignId);
        expect(response.scheduled_at).toBe(scheduledTime);
        expect(response.status).toBe(1); // SCHEDULED
        
        // Verify with a get request
        const getResponse = await methods.campaign.getCampaign({ id: testCampaignId }, metadata);
        expect(getResponse.scheduled_at).toBe(scheduledTime);
        expect(getResponse.status).toBe(1); // SCHEDULED
      } catch (error:any) {
        console.error('ScheduleCampaign error:', error);
        throw error;
      }
    });

    it('should reject scheduling with invalid date format', async () => {
      try {
        expect(testCampaignId).toBeDefined();
        
        const request = {
          id: testCampaignId,
          scheduled_at: 'invalid-date-format'
        };
        
        await methods.campaign.scheduleCampaign(request, adminMetadata);
        
        // Should not reach here
        fail('Campaign scheduling should fail with invalid date format');
      } catch (error:any) {
        expect(error).toBeDefined();
        expect(error.code).toBe(grpc.status.INVALID_ARGUMENT);
      }
    });
  });

  describe('DeleteCampaign', () => {
    let campaignToDelete: string;
    
    // First create a campaign to delete
    beforeAll(async () => {
      try {
        const testData = generateTestData();
        const createRequest = {
          name: `Campaign to delete ${testData.uniqueId()}`,
          description: 'This campaign will be deleted'
        };
        
        const response = await methods.campaign.createCampaign(createRequest, adminMetadata);
        campaignToDelete = response.id;
      } catch (error:any) {
        console.error('Failed to create test campaign for deletion:', error);
      }
    });
    
    it('should delete a campaign', async () => {
      try {
        expect(campaignToDelete).toBeDefined();
        
        const request = {
          id: campaignToDelete
        };
        
        const response = await methods.campaign.deleteCampaign(request, adminMetadata);
        
        expect(response).toBeDefined();
        expect(response.success).toBe(true);
        
        // Verify campaign is deleted
        try {
          await methods.campaign.getCampaign({ id: campaignToDelete }, metadata);
          // Should not reach here
          fail('GetCampaign should fail for deleted campaign');
        } catch (error:any) {
          expect(error).toBeDefined();
          expect(error.code).toBe(grpc.status.NOT_FOUND);
        }
      } catch (error:any) {
        console.error('DeleteCampaign error:', error);
        throw error;
      }
    });

    it('should reject deletion without admin permissions', async () => {
      try {
        // Try to delete the main test campaign
        expect(testCampaignId).toBeDefined();
        
        const request = {
          id: testCampaignId
        };
        
        // Use regular user metadata instead of admin
        await methods.campaign.deleteCampaign(request, metadata);
        
        // Should not reach here
        fail('Campaign deletion should fail without admin permissions');
      } catch (error:any) {
        expect(error).toBeDefined();
        expect(error.code).toBe(grpc.status.PERMISSION_DENIED);
      }
    });
  });
});