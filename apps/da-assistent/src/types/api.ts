/**
 * Type definitions for API contracts
 * These types help ensure consistent interfaces between the server and clients
 */

// Base types
export interface BaseResponse {
  success: boolean;
  error?: ErrorResponse;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Auth types
export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse extends BaseResponse {
  token?: string;
  refreshToken?: string;
  expiresAt?: number;
  userId?: string;
  roles?: string[];
}

export interface TokenValidationRequest {
  token: string;
}

export interface TokenValidationResponse extends BaseResponse {
  valid?: boolean;
  userId?: string;
  roles?: string[];
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Campaign types
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
  scheduledAt?: string;
  createdBy: string;
  metadata?: Record<string, string>;
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED'
}

export interface CampaignListRequest {
  page?: number;
  pageSize?: number;
  filter?: string;
}

export interface CampaignListResponse extends BaseResponse {
  campaigns?: Campaign[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
}

export interface CampaignCreateRequest {
  name: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface CampaignResponse extends BaseResponse {
  campaign?: Campaign;
}

export interface CampaignUpdateRequest {
  id: string;
  name?: string;
  description?: string;
  status?: CampaignStatus;
  metadata?: Record<string, string>;
}

export interface CampaignScheduleRequest {
  id: string;
  scheduledAt: string;
}

// Telegram types
export interface TelegramMessageRequest {
  chatId: string;
  text: string;
  useMarkdown?: boolean;
  mediaUrls?: string[];
  silent?: boolean;
  replyToMessageId?: string;
}

export interface TelegramMessageResponse extends BaseResponse {
  messageId?: string;
}

export interface ReceiveMessagesRequest {
  offset?: number;
}

export interface TelegramMessageEvent {
  messageId: string;
  chatId: string;
  userId: string;
  text: string;
  mediaUrls?: string[];
  timestamp: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category?: string;
  supportsVariables: boolean;
  requiredVariables?: string[];
}

export interface GetTemplatesRequest {
  category?: string;
}

export interface GetTemplatesResponse extends BaseResponse {
  templates?: MessageTemplate[];
}

// Analytics types
export interface CampaignMetricsRequest {
  campaignId: string;
  startDate?: string;
  endDate?: string;
  metrics?: string[];
}

export interface TimeSeriesData {
  metric: string;
  timestamps: string[];
  values: number[];
}

export interface CampaignMetricsResponse extends BaseResponse {
  campaignId?: string;
  metrics?: Record<string, number>;
  timeSeries?: TimeSeriesData[];
}

export interface EngagementDataRequest {
  startDate?: string;
  endDate?: string;
  segment?: string;
}

export interface SegmentData {
  segmentName: string;
  engagementRate: number;
  userCount: number;
}

export interface EngagementDataResponse extends BaseResponse {
  overallEngagementRate?: number;
  segments?: SegmentData[];
}

export interface ReportRequest {
  reportType: string;
  startDate: string;
  endDate: string;
  parameters?: Record<string, string>;
  format?: 'pdf' | 'csv' | 'json';
}

export interface ReportResponse extends BaseResponse {
  reportId?: string;
  downloadUrl?: string;
  expiresAt?: string;
}

// Intent recognition types
export interface IntentRequest {
  text: string;
  userId: string;
  sessionId?: string;
  context?: Record<string, string>;
}

export interface Intent {
  name: string;
  response: string;
  actions?: Action[];
  updatedContext?: Record<string, string>;
  requiresFollowup?: boolean;
}

export interface Action {
  type: string;
  resourceId: string;
  parameters: Record<string, string>;
}

export interface IntentResponse extends BaseResponse {
  intent?: Intent;
}