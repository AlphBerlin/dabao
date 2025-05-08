/**
 * Manual TypeScript definitions for MCP gRPC service
 */

export interface Tool {
  name: string;
  description: string;
  input_schema: string; // JSON Schema as string
}

export interface ListToolsRequest {
  client_id?: string;
}

export interface ListToolsResponse {
  tools: Tool[];
}

export interface CallToolRequest {
  name: string;
  arguments: string; // JSON serialized arguments
  client_id?: string;
  session_id?: string;
}

export interface CallToolResponse {
  content: string; // Can be text or JSON
  error?: string;
}

// Interface for the MCP gRPC client
export interface IMCPClient {
  listTools(request: ListToolsRequest): Promise<ListToolsResponse>;
  callTool(request: CallToolRequest): Promise<CallToolResponse>;
  close(): Promise<void>;
}