# Dabao MCP Server API Documentation

This document provides a comprehensive guide to the Dabao Model Context Protocol (MCP) Server APIs. The server follows a gRPC-based architecture with Protocol Buffers for efficient communication.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Services](#services)
   - [MCPService](#mcpservice)
   - [AuthService](#authservice)
   - [CampaignService](#campaignservice)
   - [TelegramService](#telegramservice)
   - [AnalyticsService](#analyticsservice)
4. [Error Handling](#error-handling)
5. [Data Types](#data-types)
6. [Usage Examples](#usage-examples)

## Overview

The Dabao MCP Server provides an intelligent interface for campaign management, messaging, and analytics. It uses gRPC for efficient client-server communication with the following main features:

- Bidirectional streaming for chat interactions
- Authentication and token management
- Campaign management
- Telegram message composition and delivery
- Analytics and reporting

## Authentication

All API calls require authentication using JWT tokens. Authentication is handled by the `AuthService`.

### Obtaining a Token

```typescript
const response = await authClient.authenticate({
  username: "user@example.com",
  password: "password"
});

const token = response.token;
const refreshToken = response.refresh_token;
```

### Using the Token

Include the token in the metadata for all subsequent requests:

```typescript
const metadata = new grpc.Metadata();
metadata.set('authorization', `Bearer ${token}`);

// Use metadata in service calls
const response = await mcpClient.processRequest(request, metadata);
```

### Token Validation

```typescript
const response = await authClient.validateToken({
  token: "your-jwt-token"
});

if (response.valid) {
  console.log(`Valid token for user: ${response.user_id}`);
}
```

### Token Refresh

```typescript
const response = await authClient.refreshToken({
  refresh_token: "your-refresh-token"
});

const newToken = response.token;
```

## Services

### MCPService

The core service that handles chat interactions and request processing.

#### RPC Methods

##### `Chat(stream ChatRequest) returns (stream ChatResponse)`

Bidirectional streaming RPC for chat-based interactions.

**Request Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| user_id | string | Unique identifier for the user |
| message | string | The chat message content |
| context | map<string, string> | Key-value pairs of contextual information |
| session_id | string | Session identifier (optional) |

**Response Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| message | string | Response message |
| actions | repeated Action | List of actions to perform |
| context | map<string, string> | Updated context information |
| requires_followup | bool | Whether a follow-up is expected |

**Example:**

```typescript
const chatStream = mcpClient.chat(metadata);

// Send a message
chatStream.write({
  user_id: 'user123',
  message: 'Create a campaign called Summer Sale',
  context: {},
  session_id: 'session123'
});

// Receive response
chatStream.on('data', (response) => {
  console.log('Response:', response.message);
  console.log('Actions:', response.actions);
});

// Handle end of stream
chatStream.on('end', () => {
  console.log('Chat session ended');
});
```

##### `ProcessRequest(RequestMessage) returns (ResponseMessage)`

Process a single user request with a specific intent.

**Request Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| user_id | string | Unique identifier for the user |
| intent | string | The intent to execute |
| parameters | map<string, string> | Parameters for the intent |
| session_id | string | Session identifier (optional) |

**Response Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| message | string | Response message |
| success | bool | Whether the request was successful |
| error_code | string | Error code (if any) |
| error_message | string | Detailed error message (if any) |
| payload | bytes | Additional data as serialized JSON |

**Example:**

```typescript
const response = await mcpClient.processRequest({
  user_id: 'user123',
  intent: 'campaign.list',
  parameters: { page: '1', page_size: '10' },
  session_id: 'session123'
}, metadata);

console.log('Success:', response.success);
console.log('Message:', response.message);

if (response.success) {
  const payload = JSON.parse(Buffer.from(response.payload).toString());
  console.log('Data:', payload);
}
```

##### `StreamEvents(EventStreamRequest) returns (stream EventMessage)`

Stream events for real-time updates.

**Request Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| user_id | string | Unique identifier for the user |
| event_types | repeated string | Types of events to subscribe to |

**Response Parameters (stream):**

| Field | Type | Description |
|-------|------|-------------|
| event_type | string | Type of event |
| payload | bytes | Event data as serialized JSON |
| timestamp | string | Event timestamp |

**Example:**

```typescript
const eventStream = mcpClient.streamEvents({
  user_id: 'user123',
  event_types: ['campaign_update', 'telegram_message']
}, metadata);

eventStream.on('data', (event) => {
  console.log('Event type:', event.event_type);
  console.log('Timestamp:', event.timestamp);
  const payload = JSON.parse(Buffer.from(event.payload).toString());
  console.log('Payload:', payload);
});

eventStream.on('end', () => {
  console.log('Event stream ended');
});
```

### AuthService

The service that handles authentication and token management.

#### RPC Methods

##### `Authenticate(AuthRequest) returns (AuthResponse)`

Authenticate a user and get a JWT token.

**Request Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| username | string | User's username or email |
| password | string | User's password |

**Response Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| token | string | JWT token for authentication |
| refresh_token | string | Token for refreshing the JWT |
| expires_at | uint64 | Token expiration timestamp |
| user_id | string | User's unique identifier |
| roles | repeated string | User's roles/permissions |

##### `ValidateToken(TokenValidationRequest) returns (TokenValidationResponse)`

Validate an existing token.

**Request Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| token | string | JWT token to validate |

**Response Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| valid | bool | Whether the token is valid |
| user_id | string | User's unique identifier (if valid) |
| roles | repeated string | User's roles/permissions (if valid) |

##### `RefreshToken(RefreshTokenRequest) returns (AuthResponse)`

Refresh an expired token.

**Request Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| refresh_token | string | Refresh token |

**Response Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| token | string | New JWT token |
| refresh_token | string | New refresh token |
| expires_at | uint64 | New token expiration timestamp |
| user_id | string | User's unique identifier |
| roles | repeated string | User's roles/permissions |

### CampaignService

The service that handles campaign management operations.

#### RPC Methods

##### `ListCampaigns(ListCampaignsRequest) returns (ListCampaignsResponse)`

List all campaigns with pagination.

**Request Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| page | uint32 | Page number (1-based) |
| page_size | uint32 | Number of items per page |
| filter | string | Filter expression (optional) |

**Response Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| campaigns | repeated Campaign | List of campaigns |
| total_count | uint32 | Total number of campaigns |
| page | uint32 | Current page number |
| page_size | uint32 | Number of items per page |

**Example:**

```typescript
const response = await campaignClient.listCampaigns({
  page: 1,
  page_size: 10,
  filter: "status=ACTIVE"
}, metadata);

console.log(`Found ${response.total_count} campaigns`);
response.campaigns.forEach((campaign, index) => {
  console.log(`${index + 1}. ${campaign.name} (${getStatusName(campaign.status)})`);
});
```

##### `GetCampaign(GetCampaignRequest) returns (Campaign)`

Get details of a specific campaign.

**Request Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Campaign ID |

**Response Parameters:**

A full Campaign object (see [Data Types](#data-types)).

##### `CreateCampaign(CreateCampaignRequest) returns (Campaign)`

Create a new campaign.

**Request Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| name | string | Campaign name |
| description | string | Campaign description (optional) |
| metadata | map<string, string> | Additional campaign metadata (optional) |

**Response Parameters:**

A full Campaign object (see [Data Types](#data-types)).

**Example:**

```typescript
const campaign = await campaignClient.createCampaign({
  name: "Summer Sale 2025",
  description: "Promotional campaign for summer products",
  metadata: { "category": "seasonal", "target": "all_users" }
}, metadata);

console.log(`Created campaign: ${campaign.id} - ${campaign.name}`);
```

##### `UpdateCampaign(UpdateCampaignRequest) returns (Campaign)`

Update an existing campaign.

**Request Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Campaign ID |
| name | string | New campaign name (optional) |
| description | string | New campaign description (optional) |
| status | CampaignStatus | New campaign status (optional) |
| metadata | map<string, string> | Updated metadata (optional) |

**Response Parameters:**

A full Campaign object (see [Data Types](#data-types)).

##### `DeleteCampaign(DeleteCampaignRequest) returns (DeleteCampaignResponse)`

Delete a campaign.

**Request Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Campaign ID |

**Response Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| success | bool | Whether deletion was successful |

##### `ScheduleCampaign(ScheduleCampaignRequest) returns (Campaign)`

Schedule a campaign for future activation.

**Request Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Campaign ID |
| scheduled_at | string | Scheduled activation date/time (ISO 8601) |

**Response Parameters:**

A full Campaign object (see [Data Types](#data-types)).

### TelegramService

The service that handles Telegram message composition and delivery.

#### RPC Methods

##### `SendMessage(TelegramMessageRequest) returns (TelegramMessageResponse)`

Compose and send a Telegram message.

**Request Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| chat_id | string | Telegram chat ID |
| text | string | Message content |
| use_markdown | bool | Whether to parse markdown in the message (optional) |
| media_urls | repeated string | URLs of media to include (optional) |
| silent | bool | Whether to send silently (optional) |
| reply_to_message_id | string | Message ID to reply to (optional) |

**Response Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| success | bool | Whether the message was sent successfully |
| message_id | string | ID of the sent message |

##### `ReceiveMessages(ReceiveMessagesRequest) returns (stream TelegramMessageEvent)`

Stream incoming messages from Telegram.

**Request Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| offset | int64 | Message offset to start from (optional) |

**Response Parameters (stream):**

| Field | Type | Description |
|-------|------|-------------|
| message_id | string | Telegram message ID |
| chat_id | string | Telegram chat ID |
| user_id | string | Telegram user ID |
| text | string | Message content |
| media_urls | repeated string | URLs of media in the message |
| timestamp | string | Message timestamp |

##### `GetTemplates(GetTemplatesRequest) returns (GetTemplatesResponse)`

Get message templates for Telegram.

**Request Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| category | string | Template category filter (optional) |

**Response Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| templates | repeated MessageTemplate | List of message templates |

### AnalyticsService

The service that handles analytics and reporting.

#### RPC Methods

##### `GetCampaignMetrics(CampaignMetricsRequest) returns (CampaignMetricsResponse)`

Get performance metrics for a campaign.

**Request Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| campaign_id | string | Campaign ID |
| start_date | string | Start date for metrics (ISO 8601) |
| end_date | string | End date for metrics (ISO 8601) |
| metrics | repeated string | Specific metrics to retrieve (optional) |

**Response Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| campaign_id | string | Campaign ID |
| metrics | map<string, double> | Key-value pairs of metrics |
| time_series | repeated TimeSeriesData | Time series data for metrics |

##### `GetEngagementData(EngagementDataRequest) returns (EngagementDataResponse)`

Get user engagement data.

**Request Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| start_date | string | Start date (ISO 8601) |
| end_date | string | End date (ISO 8601) |
| segment | string | User segment filter (optional) |

**Response Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| overall_engagement_rate | double | Overall engagement rate |
| segments | repeated SegmentData | Engagement data by segment |

##### `GenerateReport(ReportRequest) returns (ReportResponse)`

Generate a custom analytics report.

**Request Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| report_type | string | Type of report to generate |
| start_date | string | Start date (ISO 8601) |
| end_date | string | End date (ISO 8601) |
| parameters | map<string, string> | Additional parameters for the report |
| format | string | Report output format (e.g., "pdf", "csv") |

**Response Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| report_id | string | Generated report ID |
| download_url | string | URL to download the report |
| expires_at | string | When the download URL expires |

## Error Handling

All service methods may return gRPC error statuses with appropriate error codes and details:

| Error Code | Description |
|------------|-------------|
| INVALID_ARGUMENT | Missing or invalid request parameters |
| UNAUTHENTICATED | Failed authentication or invalid token |
| PERMISSION_DENIED | User lacks required permissions |
| NOT_FOUND | Requested resource does not exist |
| INTERNAL | Server-side error |
| UNAVAILABLE | Service temporarily unavailable |
| DEADLINE_EXCEEDED | Request timeout |

Example error handling:

```typescript
try {
  const response = await mcpClient.processRequest(request, metadata);
} catch (error) {
  console.error(`Error code: ${error.code}`);
  console.error(`Error details: ${error.details}`);
  
  // Handle specific error codes
  if (error.code === grpc.status.UNAUTHENTICATED) {
    // Handle authentication error
  }
}
```

## Data Types

### Campaign

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| name | string | Campaign name |
| description | string | Campaign description |
| status | CampaignStatus | Current status |
| created_at | string | Creation timestamp (ISO 8601) |
| updated_at | string | Last update timestamp (ISO 8601) |
| scheduled_at | string | Scheduled activation timestamp (ISO 8601) |
| created_by | string | User ID of creator |
| metadata | map<string, string> | Additional metadata |

### CampaignStatus

Enum representing possible campaign statuses:

| Value | Name | Description |
|-------|------|-------------|
| 0 | DRAFT | Campaign is in draft state |
| 1 | SCHEDULED | Campaign is scheduled for the future |
| 2 | ACTIVE | Campaign is currently active |
| 3 | COMPLETED | Campaign has completed its run |
| 4 | PAUSED | Campaign is temporarily paused |
| 5 | CANCELLED | Campaign was cancelled |

### MessageTemplate

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| name | string | Template name |
| content | string | Template content |
| category | string | Template category |
| supports_variables | bool | Whether the template supports variables |
| required_variables | repeated string | Required variables for this template |

### TimeSeriesData

| Field | Type | Description |
|-------|------|-------------|
| metric | string | Metric name |
| timestamps | repeated string | Series of timestamps |
| values | repeated double | Corresponding values |

### SegmentData

| Field | Type | Description |
|-------|------|-------------|
| segment_name | string | Segment identifier |
| engagement_rate | double | Engagement rate for this segment |
| user_count | uint32 | Number of users in this segment |

### Action

| Field | Type | Description |
|-------|------|-------------|
| type | string | Action type |
| resource_id | string | Related resource identifier |
| parameters | map<string, string> | Action parameters |

## Usage Examples

### Complete Authentication Flow

```typescript
// Create authentication client
const authClient = new mcpProto.AuthService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

// Authenticate
const authResponse = await authClient.authenticate({
  username: "user@example.com",
  password: "password"
});

// Store tokens
const token = authResponse.token;
const refreshToken = authResponse.refresh_token;

// Create metadata with token
const metadata = new grpc.Metadata();
metadata.set('authorization', `Bearer ${token}`);

// Use in other service calls
// ...

// When token expires, refresh it
const refreshResponse = await authClient.refreshToken({
  refresh_token: refreshToken
});

// Update the stored tokens
const newToken = refreshResponse.token;
const newRefreshToken = refreshResponse.refresh_token;
```

### Campaign Management Workflow

```typescript
// Create campaign client
const campaignClient = new mcpProto.CampaignService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

// Create metadata with token
const metadata = new grpc.Metadata();
metadata.set('authorization', `Bearer ${token}`);

// Create a new campaign
const campaign = await campaignClient.createCampaign({
  name: "Holiday Promotion",
  description: "Special offers for the holiday season",
  metadata: { "category": "seasonal" }
}, metadata);

console.log(`Created campaign: ${campaign.id}`);

// Schedule the campaign
const scheduledCampaign = await campaignClient.scheduleCampaign({
  id: campaign.id,
  scheduled_at: new Date(Date.now() + 86400000).toISOString() // Tomorrow
}, metadata);

console.log(`Campaign scheduled for: ${scheduledCampaign.scheduled_at}`);

// List all campaigns
const listResponse = await campaignClient.listCampaigns({
  page: 1,
  page_size: 10
}, metadata);

console.log(`Found ${listResponse.total_count} campaigns:`);
listResponse.campaigns.forEach((c) => {
  console.log(`- ${c.name} (${getStatusName(c.status)})`);
});
```

### Analytics Reporting

```typescript
// Create analytics client
const analyticsClient = new mcpProto.AnalyticsService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

// Create metadata with token
const metadata = new grpc.Metadata();
metadata.set('authorization', `Bearer ${token}`);

// Get campaign metrics
const metricsResponse = await analyticsClient.getCampaignMetrics({
  campaign_id: "campaign_123",
  start_date: "2025-01-01T00:00:00Z",
  end_date: "2025-01-31T23:59:59Z",
  metrics: ["opens", "clicks", "conversions"]
}, metadata);

console.log("Campaign Metrics:");
Object.entries(metricsResponse.metrics).forEach(([key, value]) => {
  console.log(`- ${key}: ${value}`);
});

// Generate a report
const reportResponse = await analyticsClient.generateReport({
  report_type: "campaign_performance",
  start_date: "2025-01-01T00:00:00Z",
  end_date: "2025-01-31T23:59:59Z",
  parameters: {
    "campaign_id": "campaign_123",
    "include_demographics": "true"
  },
  format: "pdf"
}, metadata);

console.log(`Report ready for download: ${reportResponse.download_url}`);
console.log(`Link expires at: ${reportResponse.expires_at}`);
```