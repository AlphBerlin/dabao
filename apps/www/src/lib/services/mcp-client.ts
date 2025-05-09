/**
 * MCP Service Client
 * Handles communication with the Model Context Protocol (MCP) gRPC server
 */

interface ChatMessage {
  role: string;
  content: string;
  metadata?: Record<string, string>;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  client_id?: string;
  session_id?: string;
  parameters?: Record<string, string>;
}

interface ChatResponse {
  message?: ChatMessage;
  error?: string;
}

export class MCPClient {
  private serverUrl: string;
  
  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }
  
  /**
   * Streams chat messages from the MCP server
   */
  async chatStream(request: ChatRequest): Promise<ReadableStream<ChatResponse>> {
    try {
      const response = await fetch(`${this.serverUrl}/ChatStream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        throw new Error(`Error connecting to MCP server: ${response.status}`);
      }
      
      // Create a TransformStream to parse the SSE stream into JSON objects
      const transform = new TransformStream({
        transform: (chunk, controller) => {
          // Expected format: "data: {json}\n\n"
          const text = new TextDecoder().decode(chunk);
          const messages = text.split('\n\n')
            .filter(msg => msg.startsWith('data: '))
            .map(msg => JSON.parse(msg.substring(6)));
            
          messages.forEach(msg => controller.enqueue(msg));
        }
      });
      
      return response.body!
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(transform);
    } catch (error) {
      console.error('Error in chatStream:', error);
      throw error;
    }
  }
  
  /**
   * Sends a chat message and gets a response (non-streaming)
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.serverUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        throw new Error(`Error connecting to MCP server: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in chat:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}