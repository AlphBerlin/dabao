import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import fs from 'fs';

/**
 * Simple MCP client for the Da AI Assistant
 * Connects to an MCP server to process requests
 */
export class MCPClient {
  private mcp: Client;
  private transport: StdioClientTransport | null = null;
  private tools: any[] = [];
  private serverPath: string;
  private chatHistory: { role: 'user' | 'assistant', content: string }[] = [];

  /**
   * Create a new MCP client
   * @param serverPath Path to the MCP server executable
   */
  constructor(serverPath?: string) {
    this.serverPath = serverPath || process.env.MCP_SERVER_PATH || "./apps/dabao-mcp-server/dist/index.js";
    this.mcp = new Client({ name: "da-assistant", version: "1.0.0" });
    console.log("MCPClient initialized");
  }

  /**
   * Connect to the MCP server
   */
  async connect(): Promise<boolean> {
    try {
      console.log(`Connecting to MCP server at: ${this.serverPath}`);
      
      // Check if the server path exists
      if (!fs.existsSync(this.serverPath)) {
        throw new Error(`Server script not found at path: ${this.serverPath}`);
      }

      // Create transport and connect
      this.transport = new StdioClientTransport({
        command: process.execPath,
        args: [this.serverPath],
      });
      
      await this.mcp.connect(this.transport);
      
      // Get available tools
      const toolsResult = await this.mcp.listTools();
      this.tools = toolsResult.tools;
      
      console.log(`Connected to MCP server with ${this.tools.length} tools available`);
      console.log(`Available tools: ${this.tools.map(({ name }) => name).join(', ')}`);
      
      return true;
    } catch (error) {
      console.error("Failed to connect to MCP server", error);
      throw error;
    }
  }

  /**
   * Process a request using the MCP server
   * @param query User's query text
   * @returns Response from the MCP server
   */
  async processRequest(query: string): Promise<string> {
    try {
      console.log("Processing request:", query);
      
      // Add to chat history
      this.chatHistory.push({ role: 'user', content: query });
      
      // Check if we need to use a specific tool based on the query
      // This is a simplified implementation - in a real system, you'd have a more sophisticated
      // intent recognition system to select appropriate tools
      const toolToUse = this.findBestToolForQuery(query);
      
      let response = '';
      
      if (toolToUse) {
        console.log(`Using tool: ${toolToUse.name}`);
        try {
          // Call the tool with minimal arguments
          const result = await this.mcp.callTool({
            name: toolToUse.name,
            arguments: {},
          });
          
          response = `Using ${toolToUse.name}: ${result.content}`;
        } catch (error) {
          console.error(`Error calling tool ${toolToUse.name}`, error);
          response = `I tried to use ${toolToUse.name} to help with your request, but encountered an error.`;
        }
      } else {
        // Default response for when no specific tool is identified
        response = `I'm Da, your AI assistant. I understood your query: "${query}". How can I assist you further?`;
      }
      
      // Add response to history
      this.chatHistory.push({ role: 'assistant', content: response });
      return response;
    } catch (error) {
      console.error("Error processing request", error);
      return `I'm sorry, I encountered an error processing your request: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Find the best tool for a given query
   * This is a very simple implementation that just looks for keywords
   * In a real system, you would use a more sophisticated NLU system
   */
  private findBestToolForQuery(query: string): any | null {
    // Simple keyword matching
    const queryLower = query.toLowerCase();
    
    for (const tool of this.tools) {
      // If the tool name or description contains words from the query
      if (
        tool.name.toLowerCase().includes(queryLower) ||
        (tool.description && tool.description.toLowerCase().includes(queryLower))
      ) {
        return tool;
      }
    }
    
    return null;
  }

  /**
   * Clean up resources before shutdown
   */
  async cleanup(): Promise<void> {
    console.log("Cleaning up resources");
    if (this.transport) {
      await this.mcp.close();
    }
  }
}