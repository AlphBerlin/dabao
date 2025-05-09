# Da Assistent AI Chatbot

A fully-featured AI chatbot application that connects to a gRPC-based Model Context Protocol (MCP) server, with persistent chat history using Prisma ORM.

## Features

- ✅ gRPC communication with MCP server
- ✅ Session-based chat with persistent history
- ✅ Prisma ORM integration for database storage
- ✅ Long-term memory through session summarization
- ✅ Support for multiple users with isolated sessions
- ✅ Streaming responses for real-time interaction
- ✅ RESTful API for integration with front-end applications

## System Architecture

The system consists of several key components:

1. **MCPService**: Communicates with the MCP server via gRPC
2. **ChatService**: Manages chat sessions and message history using Prisma
3. **AssistantService**: Combines MCPService and ChatService to create a fully-featured assistant
4. **ConfigService**: Manages application configuration
5. **REST API**: Exposes the assistant functionality through HTTP endpoints

## Setup

### Prerequisites

- Node.js 16 or higher
- PostgreSQL database
- MCP server running (with gRPC interface)

### Installation

1. Copy the sample environment file and configure it with your settings:

```bash
cp sample.env .env
```

2. Install dependencies:

```bash
pnpm install
```

3. Generate Prisma client:

```bash
pnpm db:generate
```

4. Run database migrations:

```bash
pnpm db:migrate
```

### Running the Application

Start the development server:

```bash
pnpm dev
```

For production:

```bash
pnpm build
pnpm start
```

## API Endpoints

### Sessions

- `GET /api/sessions/:userId` - Get all chat sessions for a user
- `POST /api/sessions` - Create a new chat session
- `DELETE /api/sessions/:sessionId` - Delete a chat session

### Messages

- `GET /api/sessions/:sessionId/messages` - Get all messages in a session
- `POST /api/sessions/:sessionId/messages` - Send a message to the assistant
- `POST /api/sessions/:sessionId/messages/stream` - Send a message and stream the response

### Simple Chat

- `POST /api/chat` - One-off messaging (creates temporary session)

## Memory Management

Da Assistent intelligently manages conversation history:

1. **Recent Memory**: Keeps the last 20 messages in each session for immediate context
2. **Long-term Memory**: Automatically summarizes older messages when the history exceeds token limits
3. **System Summary**: Prepends a summary of previous conversations to maintain continuity

## Examples

### Create a New Session

```bash
curl -X POST http://localhost:3100/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123", "title": "Customer Support Chat"}'
```

### Send a Message

```bash
curl -X POST http://localhost:3100/api/sessions/SESSION_ID/messages \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "content": "How can I reset my password?",
    "parameters": {
      "temperature": 0.7
    }
  }'
```

### Get Chat History

```bash
curl -X GET http://localhost:3100/api/sessions/SESSION_ID/messages
```

## Database Schema

The application uses Prisma ORM with the following core models:

- **Session**: Tracks conversation sessions with user information and summaries
- **Message**: Stores individual messages with content, sender, and metadata
- **Media**: Manages media attachments within messages (images, files, etc.)
- **AuditLog**: Tracks system activity for security and debugging

## License

MIT
