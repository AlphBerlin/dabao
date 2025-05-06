import { expect, it, describe, vi, afterEach, beforeEach } from 'vitest';
import {
  fetchProjectStats,
  fetchProjectEvents,
  fetchActivityChartData,
  fetchProjectOverviewData,
  formatTimeAgo
} from '../project-overview';

// Mock global fetch
global.fetch = vi.fn();

describe('Project Overview API Functions', () => {
  const mockProjectId = 'project-123';
  
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchProjectStats', () => {
    it('should fetch project stats with the correct parameters', async () => {
      const mockResponse = {
        stats: {
          totalCustomers: 100,
          customerGrowth: 5,
          activeCustomers: 42,
          totalRewards: 30,
          redeemedRewards: 15,
          totalPointsIssued: 5000,
          totalRewardValue: 1500,
          conversionRate: 50
        }
      };
      
      // Mock the fetch response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });
      
      const result = await fetchProjectStats(mockProjectId, '30d');
      
      // Verify fetch was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/projects/${mockProjectId}/stats?timeframe=30d`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      
      // Verify the result matches the mock response
      expect(result).toEqual(mockResponse.stats);
    });
    
    it('should handle errors when fetching project stats', async () => {
      // Mock a failed response
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error'
      });
      
      // Expect the function to throw an error
      await expect(fetchProjectStats(mockProjectId)).rejects.toThrow();
    });
  });
  
  describe('fetchProjectEvents', () => {
    it('should fetch project events with the correct parameters', async () => {
      const mockEvents = [
        {
          type: 'ACTIVITY',
          title: 'Customer activity',
          description: 'Purchase activity recorded',
          timeAgo: '5m ago',
          timestamp: new Date()
        }
      ];
      
      // Mock the fetch response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: mockEvents })
      });
      
      const result = await fetchProjectEvents(mockProjectId, 10);
      
      // Verify fetch was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/projects/${mockProjectId}/events?limit=10`,
        expect.objectContaining({
          method: 'GET'
        })
      );
      
      // Verify the result matches the mock response
      expect(result).toEqual(mockEvents);
    });
  });
  
  describe('fetchActivityChartData', () => {
    it('should fetch activity chart data with the correct parameters', async () => {
      const mockChartData = [
        { date: '2025-05-01', displayDate: 'May 1', value: 12 },
        { date: '2025-05-02', displayDate: 'May 2', value: 15 }
      ];
      
      // Mock the fetch response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ chartData: mockChartData })
      });
      
      const result = await fetchActivityChartData(mockProjectId, '7d');
      
      // Verify fetch was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/projects/${mockProjectId}/activity-chart?timeframe=7d`,
        expect.any(Object)
      );
      
      // Verify the result matches the mock response
      expect(result).toEqual(mockChartData);
    });
  });
  
  describe('fetchProjectOverviewData', () => {
    it('should fetch all project overview data in parallel', async () => {
      const mockStats = { totalCustomers: 100 };
      const mockEvents = [{ type: 'ACTIVITY' }];
      const mockChartData = [{ date: '2025-05-01', value: 10 }];
      
      // Mock the individual fetch functions
      const fetchStatsOriginal = vi.spyOn({ fetchProjectStats }, 'fetchProjectStats')
        .mockResolvedValue(mockStats as any);
      
      const fetchEventsOriginal = vi.spyOn({ fetchProjectEvents }, 'fetchProjectEvents')
        .mockResolvedValue(mockEvents as any);
      
      const fetchChartDataOriginal = vi.spyOn({ fetchActivityChartData }, 'fetchActivityChartData')
        .mockResolvedValue(mockChartData as any);
      
      const result = await fetchProjectOverviewData(mockProjectId, '30d', 5);
      
      // Verify all functions were called with correct parameters
      expect(fetchStatsOriginal).toHaveBeenCalledWith(mockProjectId, '30d');
      expect(fetchEventsOriginal).toHaveBeenCalledWith(mockProjectId, 5);
      expect(fetchChartDataOriginal).toHaveBeenCalledWith(mockProjectId, '30d');
      
      // Verify the combined result structure
      expect(result).toEqual({
        stats: mockStats,
        events: mockEvents,
        chartData: mockChartData
      });
    });
  });
  
  describe('formatTimeAgo', () => {
    it('should format time differences in seconds', () => {
      const now = new Date();
      const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);
      
      expect(formatTimeAgo(thirtySecondsAgo)).toBe('30s ago');
    });
    
    it('should format time differences in minutes', () => {
      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      
      expect(formatTimeAgo(tenMinutesAgo)).toBe('10m ago');
    });
    
    it('should format time differences in hours', () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      
      expect(formatTimeAgo(twoHoursAgo)).toBe('2h ago');
    });
    
    it('should format time differences in days', () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      
      expect(formatTimeAgo(threeDaysAgo)).toBe('3d ago');
    });
  });
});