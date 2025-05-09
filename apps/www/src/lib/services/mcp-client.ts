/**
 * MCP Service gRPC Client
 * Handles communication with the Model Context Protocol (MCP) gRPC server
 */

import { grpc } from '@improbable-eng/grpc-web';
import { Observable, Subject } from 'rxjs';

// These types should match your protobuf definitions
export interface ChatMessage {
  role: string;
  content: string;
  metadata?: Record<string, string>;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  client_id?: string;
  session_id?: string;
  parameters?: Record<string, string>;
}

export interface ChatResponse {
  message?: ChatMessage;
  error?: string;
}

// Define the proto service descriptor manually since we can't rely on generated code
const MCPServiceClient = {
  serviceName: 'mcp.MCPService',
  ChatStream: {
    methodName: 'ChatStream',
    requestStream: false,
    responseStream: true,
    requestType: {
      serializeBinary: (request: ChatRequest) => {
        // In a real implementation, this would use the protobuf generated code
        // Convert request to JSON and then to binary
        return new TextEncoder().encode(
          JSON.stringify(request)
        );
      }
    },
    responseType: {
      deserializeBinary: (bytes: Uint8Array) => {
        // In a real implementation, this would use the protobuf generated code
        // For now we'll use a simple implementation that parses JSON
        const text = new TextDecoder().decode(bytes);
        try {
          return JSON.parse(text) as ChatResponse;
        } catch (e) {
          console.error('Failed to parse response:', e);
          return { error: 'Failed to parse response' };
        }
      }
    }
  }
};

/**
 * gRPC client for MCPService that follows the provided protobuf definition
 */
export class MCPClient {
  private host: string;
  private debug: boolean;

  constructor(serverUrl: string, debug: boolean = false) {
    // Ensure the URL doesn't have the http:// or https:// prefix
    // gRPC-web expects host without protocol
    this.host = serverUrl.replace(/^(http|https):\/\//, '');
    this.debug = debug;
    
    if (this.debug) {
      console.log(`MCPClient initialized with host: ${this.host}`);
    }
  }

  /**
   * Stream chat messages from the MCP server via gRPC-web
   * This follows the protobuf definition: rpc ChatStream (ChatRequest) returns (stream ChatResponse)
   */
  chatStream(request: ChatRequest): Observable<ChatResponse> {
    const subject = new Subject<ChatResponse>();
    
    if (this.debug) {
      console.log('Sending chatStream request:', request);
    }
    
    // Try with FetchTransport first since it's more likely to work with standard gRPC servers
    this.attemptChatStreamWithTransport(request, subject, 'fetch');
    
    return subject.asObservable();
  }
  
  /**
   * Attempts to create a chat stream using the specified transport
   */
  private attemptChatStreamWithTransport(
    request: ChatRequest, 
    subject: Subject<ChatResponse>,
    transportType: 'websocket' | 'fetch' = 'fetch'
  ): void {
    // Set up appropriate transport
    const transport = transportType === 'websocket' 
      ? grpc.WebsocketTransport()
      : grpc.FetchTransport();
      
    if (this.debug) {
      console.log(`Attempting chat stream with ${transportType} transport to ${this.host}`);
    }
    
    // Prepare metadata/headers for the gRPC call
    const metadata = new grpc.Metadata();
    
    // Create a gRPC-web client
    const client = grpc.client(
      {
        host: this.host,
        serviceName: MCPServiceClient.serviceName,
        methodName: MCPServiceClient.ChatStream.methodName,
        requestStream: MCPServiceClient.ChatStream.requestStream,
        responseStream: MCPServiceClient.ChatStream.responseStream,
      },
      {
        transport,
        debug: this.debug,
      }
    );

    // Set up message handlers
    client.onMessage((message: grpc.ProtobufMessage) => {
      try {
        if (this.debug) {
          console.log('Received message:', message);
        }
        
        const response = MCPServiceClient.ChatStream.responseType.deserializeBinary(
          message.frameData
        );
        subject.next(response);
      } catch (error) {
        console.error('Error parsing message:', error);
        subject.next({ error: `Failed to parse message: ${error}` });
      }
    });

    client.onEnd((code: grpc.Code, message: string | undefined, trailers: grpc.Metadata) => {
      if (code === grpc.Code.OK) {
        if (this.debug) {
          console.log('Stream completed successfully');
        }
        subject.complete();
      } else {
        console.error(`gRPC stream ended with error ${code}: ${message}`);
        
        // If using fetch and it failed, try with websocket transport instead
        if (transportType === 'fetch') {
          console.log('Fetch transport failed, trying websocket transport...');
          this.attemptChatStreamWithTransport(request, subject, 'websocket');
        } else {
          // Both transports failed
          subject.error(new Error(`gRPC error: ${message || code}`));
        }
      }
    });

    // Set up error handler for connection issues
    client.onHeaders((headers: grpc.Metadata) => {
      if (this.debug) {
        console.log('Received headers:', headers);
      }
    });

    // Start the request with error handling
    try {
      client.start(metadata);
      
      // Send the request and finish
      const serializedRequest = MCPServiceClient.ChatStream.requestType.serializeBinary(request);
      client.send({ data: serializedRequest });
      client.finishSend();
      
      if (this.debug) {
        console.log('Request sent successfully');
      }
    } catch (err) {
      console.error('Error starting gRPC client:', err);
      if (transportType === 'fetch') {
        console.log('Error with fetch transport, trying websocket transport...');
        this.attemptChatStreamWithTransport(request, subject, 'websocket');
      } else {
        subject.error(new Error(`Failed to connect: ${err}`));
      }
    }
  }

  /**
   * Send a non-streaming chat request (uses streaming endpoint and returns final message)
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    return new Promise<ChatResponse>((resolve, reject) => {
      let finalResponse: ChatResponse | null = null;
      
      this.chatStream(request).subscribe({
        next: (response) => {
          // Keep updating with the latest response
          finalResponse = response;
        },
        error: (error) => {
          console.error('Chat request failed:', error);
          reject(error);
        },
        complete: () => {
          if (finalResponse) {
            resolve(finalResponse);
          } else {
            reject(new Error('No response received from server'));
          }
        }
      });
    });
  }
  
  /**
   * Test the connection to the server
   */
  async testConnection(): Promise<boolean> {
    try {
      if (this.debug) {
        console.log(`Testing connection to gRPC server at: ${this.host}`);
      }
      
      const testRequest: ChatRequest = {
        messages: [{
          role: 'system',
          content: 'Connection test'
        }],
        client_id: 'connection-test',
      };
      
      // Create a promise that times out after 5 seconds
      const timeoutPromise = new Promise<ChatResponse>((_, reject) => {
        setTimeout(() => reject(new Error('Connection test timeout')), 5000);
      });
      
      // Race between the actual request and the timeout
      await Promise.race([
        this.chat(testRequest),
        timeoutPromise
      ]);
      
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}