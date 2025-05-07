import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import { MCPClient } from './mcpClient.js';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to proto file
const PROTO_PATH = path.join(process.cwd(), "proto/mcp.proto");

// MCP client instance to communicate with MCP server
let mcpClient: MCPClient;

/**
 * Initialize the Da AI Assistant gRPC server
 */
export async function startServer(serverPort = 50051, mcpServerPath?: string) {
  try {
    console.log('Starting Da AI Assistant gRPC server...');
    
    // Create and connect MCP client
    mcpClient = new MCPClient(mcpServerPath);
    await mcpClient.connect();
    console.log('Connected to MCP server successfully');
    
    // Load proto file
    const packageDefinition = await protoLoader.load(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    
    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
    const mcpProto = (protoDescriptor.dabao as any)?.mcp;
    
    if (!mcpProto) {
      throw new Error('Failed to load MCP proto definitions');
    }
    
    // Create server instance
    const server = new grpc.Server();
    
    // Implement the MCP service
    server.addService(mcpProto.MCPService.service, {
      // Bidirectional streaming for chat
      chat: (call:any) => {
        console.log('New chat session started');
        
        // Handle incoming messages
        call.on('data', async (request:any) => {
          try {
            console.log(`Received message: ${request.message}`);
            
            // Process message through MCP client
            const response = await mcpClient.processRequest(request.message);
            
            // Send response back
            call.write({
              message: response,
              actions: [],
              context: request.context || {},
              requires_followup: false
            });
          } catch (error) {
            console.error('Error processing chat message:', error);
            call.write({
              message: "I encountered an error processing your request. Please try again.",
              actions: [],
              context: {},
              requires_followup: false
            });
          }
        });
        
        // Handle end of conversation
        call.on('end', () => {
          console.log('Chat session ended');
          call.end();
        });
      },
      
      // Process a single request
      processRequest: async (call:any, callback:any) => {
        try {
          const { intent, parameters } = call.request;
          console.log(`Processing request: ${intent || 'No intent provided'}`);
          
          // Process the request through MCP client
          const response = await mcpClient.processRequest(intent || '');
          
          callback(null, {
            message: response,
            success: true,
            error_code: '',
            error_message: '',
            payload: Buffer.from(JSON.stringify(parameters || {}))
          });
        } catch (error) {
          console.error('Error in processRequest:', error);
          callback({
            code: grpc.status.INTERNAL,
            message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      },
      
      // Stream events for real-time updates (minimal implementation)
      streamEvents: (call:any) => {
        const request = call.request;
        console.log(`Started event stream, types: ${request.event_types?.join(', ') || 'none'}`);
        
        // This would typically connect to an event bus/pubsub system
        // For demonstration, we'll just send a periodic event
        const interval = setInterval(() => {
          const timestamp = new Date().toISOString();
          call.write({
            event_type: 'status_update',
            payload: Buffer.from(JSON.stringify({ timestamp, status: 'active' })),
            timestamp
          });
        }, 10000); // Every 10 seconds
        
        call.on('cancelled', () => {
          clearInterval(interval);
          console.log('Event stream ended');
        });
      }
    });
    
    // Start the server
    return new Promise<grpc.Server>((resolve, reject) => {
      server.bindAsync(
        `0.0.0.0:${serverPort}`,
        grpc.ServerCredentials.createInsecure(),
        (error, port) => {
          if (error) {
            console.error(`Failed to start gRPC server: ${error}`);
            reject(error);
            return;
          }
          
          server.start();
          console.log(`Da AI Assistant gRPC server running at 0.0.0.0:${port}`);
          resolve(server);
        }
      );
    });
  } catch (error) {
    console.error('Failed to initialize gRPC server:', error);
    throw error;
  }
}

// Helper function to stop the server
export function stopServer(server: grpc.Server): Promise<void> {
  return new Promise<void>((resolve) => {
    server.tryShutdown(() => {
      console.log('gRPC server shut down');
      resolve();
    });
  });
}