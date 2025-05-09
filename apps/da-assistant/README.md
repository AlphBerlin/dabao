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

All endpoints are prefixed with `/api`.

### Sessions

#### Create a new chat session
- **URL**: `/api/sessions`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "userId": "string", // Required: ID of the user creating the session
    "title": "string"   // Optional: Title for the chat session
  }
  ```
- **Success Response**:
  - **Code**: 201 Created
  - **Content**:
    ```json
    {
      "sessionId": "string" // ID of the newly created session
    }
    ```
- **Error Response**:
  - **Code**: 400 Bad Request
    ```json
    {
      "error": "userId is required"
    }
    ```
  - **Code**: 500 Internal Server Error
    ```json
    {
      "error": "Failed to create session"
    }
    ```

#### Delete a chat session
- **URL**: `/api/sessions/:sessionId`
- **Method**: `DELETE`
- **URL Parameters**:
  - `sessionId`: ID of the session to delete
- **Success Response**:
  - **Code**: 204 No Content
- **Error Response**:
  - **Code**: 400 Bad Request
    ```json
    {
      "error": "sessionId is required"
    }
    ```
  - **Code**: 404 Not Found
    ```json
    {
      "error": "Session not found"
    }
    ```
  - **Code**: 500 Internal Server Error
    ```json
    {
      "error": "Failed to delete session"
    }
    ```

### Messages

#### Get all messages in a session
- **URL**: `/api/sessions/:sessionId/messages`
- **Method**: `GET`
- **URL Parameters**:
  - `sessionId`: ID of the session to retrieve messages from
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "messages": [
        {
          // Message object fields
        }
      ]
    }
    ```
- **Error Response**:
  - **Code**: 400 Bad Request
    ```json
    {
      "error": "sessionId is required"
    }
    ```
  - **Code**: 500 Internal Server Error
    ```json
    {
      "error": "Failed to get messages"
    }
    ```

#### Send a message to the assistant
- **URL**: `/api/sessions/:sessionId/messages`
- **Method**: `POST`
- **URL Parameters**:
  - `sessionId`: ID of the session to send a message to
- **Request Body**:
  ```json
  {
    "userId": "string",    // Required: ID of the user sending the message
    "content": "string",   // Required: Content of the message
    "parameters": {        // Optional: Additional parameters for the message
      // Model parameters (temperature, etc.)
    }
  }
  ```
- **Success Response**:
  - **Code**: 200 OK
  - **Content**: 
    ```json
    {
      "response": {
        // ChatResponse object
      }
    }
    ```
- **Error Response**:
  - **Code**: 400 Bad Request
    ```json
    {
      "error": "userId and content are required"
    }
    ```
  - **Code**: 500 Internal Server Error
    ```json
    {
      "error": "Failed to send message"
    }
    ```

#### Stream a chat response
- **URL**: `/api/sessions/:sessionId/messages/stream`
- **Method**: `POST`
- **URL Parameters**:
  - `sessionId`: ID of the session to stream a response from
- **Request Body**:
  ```json
  {
    "userId": "string",    // Required: ID of the user sending the message
    "content": "string",   // Required: Content of the message
    "parameters": {        // Optional: Additional parameters for the message
      // Model parameters (temperature, etc.)
    }
  }
  ```
- **Success Response**:
  - **Code**: 200 OK
  - **Content**: Server-Sent Events (SSE) stream with the following event formats:
    ```
    data: {"content": "chunk of response text"}
    
    data: {"done": true}
    ```
- **Error Response**:
  - **Code**: 400 Bad Request
    ```json
    {
      "error": "userId and content are required"
    }
    ```
  - **Code**: 500 Internal Server Error
    ```json
    {
      "error": "Failed to stream message"
    }
    ```
  - In the stream:
    ```
    data: {"error": "error message"}
    ```

### Simple Chat

#### One-off chat (no session tracking)
- **URL**: `/api/chat`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "message": "string",   // Required: Message content
    "parameters": {        // Optional: Additional parameters for the message
      // Model parameters (temperature, etc.)
    }
  }
  ```
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    ```json
    {
      "response": {
        // ChatResponse object
      }
    }
    ```
- **Error Response**:
  - **Code**: 400 Bad Request
    ```json
    {
      "error": "message is required"
    }
    ```
  - **Code**: 500 Internal Server Error
    ```json
    {
      "error": "Failed to process chat"
    }
    ```

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
