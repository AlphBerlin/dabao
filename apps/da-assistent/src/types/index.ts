/**
 * Shared type definitions for MCP (Model Context Protocol) services
 */

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
  arguments: string | any; // JSON serialized arguments or direct object
  client_id?: string;
  session_id?: string;
}

// Interface for calling a tool response
export interface CallToolResponse {
  content: string; // Can be text or JSON
  error?: string;
}