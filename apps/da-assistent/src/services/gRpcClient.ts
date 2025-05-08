import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import { IMCPClient, ListToolsRequest, ListToolsResponse, CallToolRequest, CallToolResponse } from '../proto/mcp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * gRPC client implementation for the MCP service
 */
export class GrpcMCPClient implements IMCPClient {
  private client: any;
  private isConnected: boolean = false;

  /**
   * Initialize the gRPC client for MCP communication
   * @param serverAddress - The address of the MCP gRPC server (e.g., "localhost:50051")
   */
  constructor(private serverAddress: string) {}

  /**
   * Connect to the MCP server
   */
  async connect(): Promise<void> {
    // Calculate the proto path relative to the current file
    const protoPath = path.resolve(__dirname, '../../proto/mcp.proto');
    
    // Load the protobuf definition
    const packageDefinition = protoLoader.loadSync(protoPath, {
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
  }

  /**
   * List available tools from the MCP server
   * @param request - ListToolsRequest parameters
   * @returns Promise resolving to list of available tools
   */
  async listTools(request: ListToolsRequest): Promise<ListToolsResponse> {
    if (!this.isConnected) {
      throw new Error('Client not connected to server');
    }

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
   * @param request - CallToolRequest parameters
   * @returns Promise resolving to the tool's response
   */
  async callTool(request: CallToolRequest): Promise<CallToolResponse> {
    if (!this.isConnected) {
      throw new Error('Client not connected to server');
    }

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
  async close(): Promise<void> {
    if (this.isConnected && this.client) {
      this.client.close();
      this.isConnected = false;
      console.log('Disconnected from MCP server');
    }
  }
}