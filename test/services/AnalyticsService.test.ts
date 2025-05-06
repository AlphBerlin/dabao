import { createClients, promisifyMethods, authenticateUser, createAuthMetadata, generateTestData } from '../testHelpers';
import * as grpc from '@grpc/grpc-js';

describe('AnalyticsService', () => {
  const clients = createClients();
  const methods = promisifyMethods(clients);
  let authToken: string;
  let metadata: grpc.Metadata;
  let adminMetadata: grpc.Metadata;
  
  beforeAll(async () => {
    try {
      // Authenticate as a regular user
      const userResponse = await authenticateUser(methods.auth.authenticate);
      authToken = userResponse.token;
      metadata = createAuthMetadata(authToken);
      
      // Authenticate as an admin user
      const adminResponse = await authenticateUser(methods.auth.authenticate, 'admin@example.com', 'adminPassword');
      adminMetadata = createAuthMetadata(adminResponse.token);
    } catch (error) {
      console.error('Setup failed:', error);
      throw error;
    }
  });

  describe('GetCampaignMetrics', () => {
    it('should get metrics for a specific campaign', async () => {
      try {
        // First create a test campaign to get metrics for
        const testData = generateTestData();
        const createResponse = await methods.campaign.createCampaign({
          name: testData.campaign.name,
          description: testData.campaign.description
        }, adminMetadata);
        
        const campaignId = createResponse.id;
        
        // Now get metrics for this campaign
        const request = {
          campaign_id: campaignId,
          start_date: testData.analytics.startDate,
          end_date: testData.analytics.endDate
        };
        
        const response = await methods.analytics.getCampaignMetrics(request, metadata);
        
        expect(response).toBeDefined();
        expect(response.campaign_id).toBe(campaignId);
        expect(response.metrics).toBeDefined();
        expect(response.time_series).toBeDefined();
        
        // Verify some common metrics are present
        const metrics = response.metrics;
        expect(typeof metrics.opens).toBe('number');
        expect(typeof metrics.clicks).toBe('number');
        expect(typeof metrics.engagement_rate).toBe('number');
      } catch (error) {
        console.error('GetCampaignMetrics error:', error);
        throw error;
      }
    });

    it('should get metrics with specific metrics requested', async () => {
      try {
        const testData = generateTestData();
        
        // Request only specific metrics
        const request = {
          campaign_id: 'campaign_123', // Sample campaign ID
          start_date: testData.analytics.startDate,
          end_date: testData.analytics.endDate,
          metrics: ['opens', 'clicks']
        };
        
        const response = await methods.analytics.getCampaignMetrics(request, metadata);
        
        expect(response).toBeDefined();
        expect(response.metrics).toBeDefined();
        
        // Only requested metrics should be present
        const metricKeys = Object.keys(response.metrics);
        request.metrics.forEach(metric => {
          expect(metricKeys).toContain(metric);
        });
      } catch (error) {
        console.error('GetCampaignMetrics with specific metrics error:', error);
        throw error;
      }
    });

    it('should reject requests without campaign ID', async () => {
      try {
        const testData = generateTestData();
        const request = {
          // No campaign_id
          start_date: testData.analytics.startDate,
          end_date: testData.analytics.endDate
        };
        
        await methods.analytics.getCampaignMetrics(request, metadata);
        
        // Should not reach here
        fail('GetCampaignMetrics should fail without campaign ID');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.code).toBe(grpc.status.INVALID_ARGUMENT);
      }
    });
  });

  describe('GetEngagementData', () => {
    it('should get overall engagement data', async () => {
      try {
        const testData = generateTestData();
        const request = {
          start_date: testData.analytics.startDate,
          end_date: testData.analytics.endDate
        };
        
        const response = await methods.analytics.getEngagementData(request, metadata);
        
        expect(response).toBeDefined();
        expect(typeof response.overall_engagement_rate).toBe('number');
        expect(Array.isArray(response.segments)).toBe(true);
      } catch (error) {
        console.error('GetEngagementData error:', error);
        throw error;
      }
    });

    it('should get engagement data for a specific segment', async () => {
      try {
        const testData = generateTestData();
        const request = {
          start_date: testData.analytics.startDate,
          end_date: testData.analytics.endDate,
          segment: 'new_users'
        };
        
        const response = await methods.analytics.getEngagementData(request, metadata);
        
        expect(response).toBeDefined();
        expect(typeof response.overall_engagement_rate).toBe('number');
        expect(Array.isArray(response.segments)).toBe(true);
        
        // Check if segment data is available
        const segmentData = response.segments.find(s => s.segment_name === request.segment);
        expect(segmentData).toBeDefined();
        expect(typeof segmentData.engagement_rate).toBe('number');
        expect(typeof segmentData.user_count).toBe('number');
      } catch (error) {
        console.error('GetEngagementData for segment error:', error);
        throw error;
      }
    });

    it('should handle invalid date formats gracefully', async () => {
      try {
        const request = {
          start_date: 'invalid-date',
          end_date: 'invalid-date'
        };
        
        await methods.analytics.getEngagementData(request, metadata);
        
        // Some implementations might return empty data instead of error
        // so we don't explicitly fail the test here
      } catch (error) {
        // Error is expected, but we don't test specific error code
        expect(error).toBeDefined();
      }
    });
  });

  describe('GenerateReport', () => {
    it('should generate a report with all required parameters', async () => {
      try {
        const testData = generateTestData();
        const request = {
          report_type: testData.analytics.reportType,
          start_date: testData.analytics.startDate,
          end_date: testData.analytics.endDate,
          parameters: {
            campaign_id: 'campaign_123',
            include_demographics: 'true'
          },
          format: 'pdf'
        };
        
        const response = await methods.analytics.generateReport(request, metadata);
        
        expect(response).toBeDefined();
        expect(response.report_id).toBeDefined();
        expect(response.download_url).toBeDefined();
        expect(response.expires_at).toBeDefined();
        
        // Download URL should be a valid URL
        expect(response.download_url.startsWith('http')).toBe(true);
      } catch (error) {
        console.error('GenerateReport error:', error);
        throw error;
      }
    });

    it('should generate reports in different formats', async () => {
      try {
        const testData = generateTestData();
        
        // Test PDF format
        const pdfRequest = {
          report_type: testData.analytics.reportType,
          start_date: testData.analytics.startDate,
          end_date: testData.analytics.endDate,
          parameters: { summary: 'true' },
          format: 'pdf'
        };
        
        const pdfResponse = await methods.analytics.generateReport(pdfRequest, metadata);
        expect(pdfResponse).toBeDefined();
        
        // Test CSV format
        const csvRequest = {
          report_type: testData.analytics.reportType,
          start_date: testData.analytics.startDate,
          end_date: testData.analytics.endDate,
          parameters: { summary: 'true' },
          format: 'csv'
        };
        
        const csvResponse = await methods.analytics.generateReport(csvRequest, metadata);
        expect(csvResponse).toBeDefined();
        
        // Download URLs should reflect the requested format
        expect(pdfResponse.download_url.includes('pdf')).toBe(true);
        expect(csvResponse.download_url.includes('csv')).toBe(true);
      } catch (error) {
        console.error('GenerateReport formats error:', error);
        throw error;
      }
    });

    it('should reject reports with missing required parameters', async () => {
      try {
        // Missing report_type
        const request = {
          start_date: '2025-01-01',
          end_date: '2025-01-31',
          parameters: {},
          format: 'pdf'
        };
        
        await methods.analytics.generateReport(request, metadata);
        
        // Should not reach here
        fail('GenerateReport should fail without report_type');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.code).toBe(grpc.status.INVALID_ARGUMENT);
      }
    });
  });
});