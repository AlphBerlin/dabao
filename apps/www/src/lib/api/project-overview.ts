/**
 * Project Overview API Functions
 * 
 * This module contains functions to fetch project analytics, statistics,
 * events, and chart data for the project overview dashboard.
 */

export interface ProjectStats {
  totalCustomers: number;
  customerGrowth: number;
  activeCustomers: number;
  totalRewards: number;
  redeemedRewards: number;
  totalPointsIssued: number;
  totalRewardValue: number;
  conversionRate: number;
}

export interface ProjectEvent {
  type: string;
  title: string;
  description: string;
  timeAgo: string;
  customerId?: string;
  customerName?: string;
  campaignId?: string;
  campaignName?: string;
  timestamp: Date;
  pointsAmount?: number;
  rewardId?: string;
  rewardName?: string;
  metadata?: any;
}

export interface ChartDataPoint {
  date: string;
  displayDate: string;
  value: number;
}

export type TimeframeOption = '7d' | '30d' | '90d' | 'all';

/**
 * Fetches project statistics based on the provided timeframe
 * @param projectId The ID of the project
 * @param timeframe Time period for the statistics (7d, 30d, 90d, all)
 * @returns Promise resolving to project statistics
 */
export async function fetchProjectStats(
  projectId: string,
  timeframe: TimeframeOption = '7d'
): Promise<ProjectStats> {
  try {
    const response = await fetch(
      `/api/projects/${projectId}/stats?timeframe=${timeframe}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching project stats: ${response.statusText}`);
    }

    const data = await response.json();
    return data.stats;
  } catch (error) {
    console.error('Failed to fetch project stats:', error);
    throw error;
  }
}

/**
 * Fetches recent events for the project
 * @param projectId The ID of the project
 * @param limit Maximum number of events to retrieve
 * @returns Promise resolving to an array of events
 */
export async function fetchProjectEvents(
  projectId: string,
  limit: number = 5
): Promise<ProjectEvent[]> {
  try {
    const response = await fetch(
      `/api/projects/${projectId}/events?limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching project events: ${response.statusText}`);
    }

    const data = await response.json();
    return data.events;
  } catch (error) {
    console.error('Failed to fetch project events:', error);
    throw error;
  }
}

/**
 * Fetches chart data for customer activity
 * @param projectId The ID of the project
 * @param timeframe Time period for the chart data (7d, 30d, 90d, all)
 * @returns Promise resolving to chart data points
 */
export async function fetchActivityChartData(
  projectId: string,
  timeframe: TimeframeOption = '7d'
): Promise<ChartDataPoint[]> {
  try {
    const response = await fetch(
      `/api/projects/${projectId}/activity-chart?timeframe=${timeframe}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching activity chart data: ${response.statusText}`);
    }

    const data = await response.json();
    return data.chartData;
  } catch (error) {
    console.error('Failed to fetch activity chart data:', error);
    throw error;
  }
}

/**
 * Fetches all project overview data at once
 * @param projectId The ID of the project
 * @param timeframe Time period for the data (7d, 30d, 90d, all)
 * @param eventLimit Maximum number of events to retrieve
 * @returns Promise resolving to an object containing all project overview data
 */
export async function fetchProjectOverviewData(
  projectId: string,
  timeframe: TimeframeOption = '7d',
  eventLimit: number = 5
) {
  try {
    const [stats, events, chartData] = await Promise.all([
      fetchProjectStats(projectId, timeframe),
      fetchProjectEvents(projectId, eventLimit),
      fetchActivityChartData(projectId, timeframe)
    ]);

    return {
      stats,
      events,
      chartData
    };
  } catch (error) {
    console.error('Failed to fetch project overview data:', error);
    throw error;
  }
}

/**
 * Helper function for formatting timestamps to "time ago" format
 * @param timestamp The timestamp to format
 * @returns String representation of how long ago the timestamp was
 */
export function formatTimeAgo(timestamp: Date | string): string {
  const now = new Date();
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}m ago`;
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  } else {
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }
}