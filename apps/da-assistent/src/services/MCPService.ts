import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { EventEmitter } from 'events';

// Interface for chat message format
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  metadata?: Record<string, string>;
}

// Interface for chat completion request
export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  client_id?: string;
  session_id?: string;
  parameters?: Record<string, string>;
}

// Interface for chat completion response
export interface ChatResponse {
  message?: ChatMessage;
  error?: string;
}

// Interface for a tool
export interface Tool {
  name: string;
  description: string;
  input_schema: string; // JSON Schema as string
}

// Interface for listing tools request
export interface ListToolsRequest {
  client_id?: string;
}

// Interface for listing tools response
export interface ListToolsResponse {
  tools: Tool[];
}

// Interface for calling a tool request
export interface CallToolRequest {
  name: string;
  arguments: string; // JSON serialized arguments
  client_id?: string;
  session_id?: string;
}

// Interface for calling a tool response
export interface CallToolResponse {
  content: string; // Can be text or JSON
  error?: string;
}

/**
 * Service for communicating with the MCP server via gRPC
 */
export class MCPService extends EventEmitter {
  private client: any;
  private isConnected: boolean = false;
  private readonly PROTO_PATH: string;

  /**
   * Initialize the MCP service
   * 
   * @param serverAddress - The address of the MCP gRPC server (host:port)
   */
  constructor(private serverAddress: string) {
    super();
    this.PROTO_PATH = path.resolve(__dirname, '../../proto/mcp.proto');
  }

  /**
   * Connect to the MCP server
   */
  async connect(): Promise<void> {
    try {
      // Load the protobuf definition
      const packageDefinition = protoLoader.loadSync(this.PROTO_PATH, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });
      
      // Load the package definition
      const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
      
      // Create the client
      this.client = new (protoDescriptor.mcp as any).MCPService(
        this.serverAddress,
        grpc.credentials.createInsecure()
      );
      
      this.isConnected = true;
      console.log(`Connected to MCP server at ${this.serverAddress}`);
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      throw error;
    }
  }

  /**
   * Check if connected to the MCP server
   */
  private checkConnection(): void {
    if (!this.isConnected || !this.client) {
      throw new Error('Not connected to MCP server. Call connect() first.');
    }
  }

  /**
   * Send a chat request to the MCP server
   * 
   * @param request - The chat request
   * @returns The response from the model
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    this.checkConnection();
    return new Promise((resolve, reject) => {
      this.client.chat(request, (error: Error | null, response: ChatResponse) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Send a chat request and stream the response
   * 
   * @param request - The chat request
   * @returns Event emitter that emits 'data', 'error', and 'end' events
   */
  chatStream(request: ChatRequest): EventEmitter {
    this.checkConnection();
    const emitter = new EventEmitter();
    
    try {
      const call = this.client.chatStream(request);
      
      call.on('data', (chunk: ChatResponse) => {
        emitter.emit('data', chunk);
      });
      
      call.on('error', (error: Error) => {
        emitter.emit('error', error);
      });
      
      call.on('end', () => {
        emitter.emit('end');
      });
    } catch (error) {
      setImmediate(() => {
        emitter.emit('error', error);
      });
    }
    
    return emitter;
  }

  /**
   * List available tools from the MCP server
   * 
   * @param request - Optional parameters for the request
   * @returns List of available tools
   */
  async listTools(request: ListToolsRequest = {}): Promise<ListToolsResponse> {
    this.checkConnection();
    return new Promise((resolve, reject) => {
      this.client.listTools(request, (error: Error | null, response: ListToolsResponse) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Call a tool on the MCP server
   * 
   * @param request - The tool call request
   * @returns The result of the tool call
   */
  async callTool(request: CallToolRequest): Promise<CallToolResponse> {
    this.checkConnection();
    return new Promise((resolve, reject) => {
      this.client.callTool(request, (error: Error | null, response: CallToolResponse) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Close the connection to the MCP server
   */
  async disconnect(): Promise<void> {
    if (this.isConnected && this.client) {
      this.client.close();
      this.isConnected = false;
      console.log('Disconnected from MCP server');
    }
  }
}