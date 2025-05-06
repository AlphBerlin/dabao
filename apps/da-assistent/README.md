# Dabao MCP Server

A Model Context Protocol server implementation for Dabao SaaS, providing an intelligent interface for campaign management, Telegram message composition and delivery, and analytics.

## Features

- **gRPC Communication**: Efficient communication between frontend and server
- **Intent Recognition**: Maps natural language user requests to specific actions
- **Secure Authentication**: JWT-based authentication with role-based access control
- **Campaign Management**: Create, edit, schedule, and delete campaigns
- **Telegram Integration**: Compose and deliver messages to Telegram
- **Analytics and Reporting**: Track performance metrics and generate reports
- **Comprehensive Logging**: Audit trails for security compliance

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Telegram Bot Token (for messaging features)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
cd apps/dabao-mcp-server
npm install
```

3. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

4. Update the environment variables in `.env` with your specific configuration.

### Development

To run the server in development mode:

```bash
npm run dev
```

### Production Build

To build and run in production:

```bash
npm run build
npm start
```

### Docker

Build and run using Docker:

```bash
docker build -t dabao-mcp-server .
docker run -p 50051:50051 --env-file .env dabao-mcp-server
```

## Usage

### Authentication

All API calls require authentication. First obtain a JWT token:

```typescript
// Example client code
const client = new AuthServiceClient('localhost:50051');
const response = await client.authenticate({
  username: 'user@example.com',
  password: 'password'
});

const token = response.token;
```

### Making Requests

Use the token in the metadata for subsequent requests:

```typescript
// Example client code
const metadata = new Metadata();
metadata.set('authorization', `Bearer ${token}`);

const mcpClient = new MCPServiceClient('localhost:50051');
const response = await mcpClient.processRequest({
  user_id: 'user123',
  intent: 'campaign.list',
  parameters: {},
  session_id: 'session123'
}, metadata);
```

### Chat Interface

The MCP server supports bidirectional streaming for chat interactions:

```typescript
// Example client code
const metadata = new Metadata();
metadata.set('authorization', `Bearer ${token}`);

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
```

## API Reference

The MCP server exposes the following services:

- `MCPService`: Core service for chat and request processing
- `AuthService`: Authentication and token management
- `CampaignService`: Campaign management operations
- `TelegramService`: Messaging operations
- `AnalyticsService`: Reporting and analytics

For detailed API reference, see the Protocol Buffer definitions in `proto/mcp.proto`.

## Architecture

The server is structured as follows:

- `proto/`: Protocol Buffer definitions
- `src/`: Source code
  - `auth/`: Authentication and authorization
  - `intents/`: Intent recognition system
  - `logging/`: Comprehensive logging
  - `middleware/`: Request processing middleware
  - `services/`: Service implementations
  - `utils/`: Helper utilities

## Security

The MCP server implements several security measures:

- JWT-based authentication with refresh tokens
- Role-based access control
- Rate limiting to prevent abuse
- Comprehensive security logging
- Input validation and sanitization

## License

MIT
