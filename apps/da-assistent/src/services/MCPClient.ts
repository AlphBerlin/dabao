import { Anthropic } from "@anthropic-ai/sdk";
import {
  MessageParam,
  Tool,
} from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { promisify } from 'util';
import readline from "readline/promises";
import dotenv from "dotenv";
import winston from 'winston';
import fs from 'fs';

dotenv.config();

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/dabao-assistant.log' })
  ],
});

// Ensure logs directory exists
try {
  if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
  }
} catch (err) {
  console.error('Failed to create logs directory:', err);
}

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is not set");
}

// Context for the Dabao app to help guide responses
const DABAO_CONTEXT = `
You are Da, the Dabao App Assistant. Dabao is a loyalty and rewards platform that helps businesses engage customers.
Key features of Dabao include:
- Customer loyalty program management
- Membership tiers with different benefits
- Campaign creation and tracking
- Vouchers and promotions
- Telegram integration for marketing
- Analytics and reporting

You can help users with various tasks related to customer management, campaigns, tiers, vouchers, and Telegram integration.
Always be helpful, concise, and provide specific information when possible.
`;

/**
 * DabaoMCPClient - Enhanced MCP client for Dabao App with gRPC support
 * Connects to Dabao MCP server and provides access to all loyalty program features
 */
class DabaoMCPClient {
  private mcp: Client;
  private anthropic: Anthropic;
  private transport: StdioClientTransport | null = null;
  private tools: Tool[] = [];
  private grpcClient: any = null;
  private serverPath: string;
  private chatHistory: { role: 'user' | 'assistant', content: string }[] = [];
  private projectContext: { projectId?: string, customerId?: string } = {};

  constructor(serverPath?: string) {
    this.serverPath = serverPath || "/Users/ajithberlin/alphberlin/repos/dabao.in/dabao/apps/dabao-mcp-server/dist/index.js";
    
    // Set up Anthropic client with error handling
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your-anthropic-api-key') {
      logger.warn('Missing or invalid Anthropic API key - Claude features will not work');
      // Create a mock client that will show appropriate error messages
      this.anthropic = {
        messages: {
          create: async () => {
            throw new Error("Anthropic API key not configured. Please set ANTHROPIC_API_KEY in your .env file.");
          }
        }
      } as any;
    } else {
      this.anthropic = new Anthropic({
        apiKey,
      });
    }
    
    this.mcp = new Client({ name: "dabao-assistant", version: "1.0.0" });
    logger.info("DabaoMCPClient initialized");
  }

  /**
   * Connect to the Dabao MCP server
   */
  async connect() {
    try {
      logger.info(`Connecting to Dabao MCP server at: ${this.serverPath}`);
      
      if (!fs.existsSync(this.serverPath)) {
        throw new Error(`Server script not found at path: ${this.serverPath}`);
      }

      this.transport = new StdioClientTransport({
        command: process.execPath,
        args: [this.serverPath],
      });
      
      await this.mcp.connect(this.transport);
      
      const toolsResult = await this.mcp.listTools();
      this.tools = toolsResult.tools.map((tool) => {
        return {
          name: tool.name,
          description: tool.description,
          input_schema: tool.inputSchema,
        };
      });

      logger.info(`Connected to Dabao MCP server with ${this.tools.length} tools available`);
      console.log("Da Assistant connected to Dabao MCP server successfully!");
      console.log(`Available tools: ${this.tools.map(({ name }) => name).join(', ')}`);
      
      return true;
    } catch (e) {
      logger.error("Failed to connect to Dabao MCP server", { error: e });
      console.error("Failed to connect to Dabao MCP server: ", e);
      throw e;
    }
  }

  /**
   * Connect to gRPC chat service
   * @param protoPath Path to the proto file
   * @param serviceEndpoint gRPC service endpoint
   */
  async connectGrpc(protoPath: string, serviceEndpoint: string) {
    try {
      logger.info(`Connecting to gRPC service at: ${serviceEndpoint}`);
      
      const packageDefinition = protoLoader.loadSync(protoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
      });
      
      const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
      
      // Handle potentially undefined service safely
      if (protoDescriptor && typeof protoDescriptor === 'object') {
        // Access chat package and service using type assertion and property access
        const chatPackage = protoDescriptor['chat'] as any;
        
        if (chatPackage && typeof chatPackage === 'object' && chatPackage.ChatService) {
          this.grpcClient = new chatPackage.ChatService(
            serviceEndpoint,
            grpc.credentials.createInsecure()
          );
          
          logger.info("Connected to gRPC chat service");
          console.log("Connected to gRPC chat service successfully!");
          
          return true;
        } else {
          throw new Error("ChatService not found in the proto definition");
        }
      } else {
        throw new Error("Invalid proto descriptor returned");
      }
    } catch (e) {
      logger.error("Failed to connect to gRPC service", { error: e });
      console.error("Failed to connect to gRPC service: ", e);
      return false;
    }
  }
  
  /**
   * Process a user query using Claude and the MCP tools
   * @param query User's query text
   * @returns Formatted response
   */
  async processQuery(query: string): Promise<string> {
    try {
      logger.info("Processing user query", { query });
      
      // Add to chat history
      this.chatHistory.push({ role: 'user', content: query });
      
      // Extract context for query processing (if mentioned in query)
      this.extractContextFromQuery(query);
      
      // Build system message with Dabao context and any project context
      const systemMessage = this.buildSystemMessage();
      
      const messages: MessageParam[] = [
        {
          role: "user",
          content: query,
        },
      ];
    
      const response = await this.anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        system: systemMessage,
        messages,
        tools: this.tools,
      });
    
      const finalText = [];
      const toolResults = [];
    
      for (const content of response.content) {
        if (content.type === "text") {
          finalText.push(content.text);
        } else if (content.type === "tool_use") {
          const toolName = content.name;
          const toolArgs = content.input as { [x: string]: unknown } | undefined;
    
          // Log tool usage
          logger.info(`Using tool: ${toolName}`, { args: toolArgs });
          
          try {
            const result = await this.mcp.callTool({
              name: toolName,
              arguments: toolArgs,
            });
            
            toolResults.push(result);
            finalText.push(
              `[Using ${toolName}...]`
            );
            
            // Add result to messages for continued conversation
            messages.push({
              role: "user",
              content: result.content as string,
            });
            
            // Get follow-up response after tool use
            const followupResponse = await this.anthropic.messages.create({
              model: "claude-3-5-sonnet-20241022",
              max_tokens: 1000,
              system: systemMessage,
              messages,
            });
            
            const followupText = followupResponse!.content[0]?.type === "text" ? 
                               followupResponse!.content[0]?.text : "";
            finalText.push(followupText);
            
            // Update chat history
            this.chatHistory.push({ role: 'assistant', content: followupText });
          } catch (error) {
            logger.error(`Error calling tool ${toolName}`, { error });
            finalText.push(`I encountered an error while using ${toolName}: ${error}`);
          }
        }
      }
    
      const response_text = finalText.join("\n");
      return response_text;
    } catch (error) {
      logger.error("Error processing query", { error });
      return `I'm sorry, I encountered an error processing your query: ${error}`;
    }
  }

  /**
   * Extract project and customer context from query
   */
  private extractContextFromQuery(query: string): void {
    // Extract projectId if mentioned (common format: project-xxxx)
    const projectMatch = query.match(/project[- ]id[: ]?([a-zA-Z0-9-_]+)/i) || 
                       query.match(/for project[: ]?([a-zA-Z0-9-_]+)/i);
    if (projectMatch && projectMatch[1]) {
      this.projectContext.projectId = projectMatch[1];
      logger.info(`Extracted project context: ${this.projectContext.projectId}`);
    }
    
    // Extract customerId if mentioned (common format: customer-xxxx)
    const customerMatch = query.match(/customer[- ]id[: ]?([a-zA-Z0-9-_]+)/i) ||
                         query.match(/for customer[: ]?([a-zA-Z0-9-_]+)/i);
    if (customerMatch && customerMatch[1]) {
      this.projectContext.customerId = customerMatch[1];
      logger.info(`Extracted customer context: ${this.projectContext.customerId}`);
    }
  }

  /**
   * Build system message with context information
   */
  private buildSystemMessage(): string {
    let systemMessage = DABAO_CONTEXT;
    
    if (this.projectContext.projectId) {
      systemMessage += `\nCurrently working with project: ${this.projectContext.projectId}`;
    }
    
    if (this.projectContext.customerId) {
      systemMessage += `\nCurrently working with customer: ${this.projectContext.customerId}`;
    }
    
    return systemMessage;
  }
  
  /**
   * Send message through gRPC chat service
   * @param message Message to send
   * @returns Response from gRPC service
   */
  async sendGrpcMessage(message: string): Promise<string> {
    if (!this.grpcClient) {
      throw new Error("gRPC client not connected");
    }
    
    try {
      const sendMessage = promisify(this.grpcClient.sendMessage.bind(this.grpcClient));
      const response = await sendMessage({ content: message });
      return response.content;
    } catch (error) {
      logger.error("Error sending gRPC message", { error });
      throw error;
    }
  }

  /**
   * Interactive chat loop in console
   */
  async chatLoop() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  
    try {
      console.log("\n🔥 Da Assistant is ready to help with your Dabao tasks!");
      console.log("Type 'help' to see available commands or 'quit' to exit.");
  
      while (true) {
        const message = await rl.question("\nYou: ");
        
        if (message.toLowerCase() === "quit" || message.toLowerCase() === "exit") {
          console.log("Da Assistant: Goodbye! Have a great day. 👋");
          break;
        }

        if (message.toLowerCase() === "help") {
          this.showHelp();
          continue;
        }

        if (message.toLowerCase() === "tools") {
          this.showAvailableTools();
          continue;
        }
        
        console.log("\nDa Assistant is thinking... 🤔");
        
        try {
          const response = await this.processQuery(message);
          console.log("\nDa Assistant: " + response);
        } catch (error) {
          console.error("Error: ", error);
          console.log("\nDa Assistant: I'm sorry, I encountered an error processing your request.");
        }
      }
    } catch (error) {
      logger.error("Error in chat loop", { error });
      console.error("An unexpected error occurred:", error);
    } finally {
      rl.close();
    }
  }

  /**
   * Show help information
   */
  private showHelp() {
    console.log(`
Da Assistant Help:
-----------------
- Ask questions about customers, campaigns, tiers, vouchers, or Telegram integration
- Type 'tools' to see available tools
- Type 'quit' or 'exit' to end the session

Example queries:
- "Show me active campaigns for project-abc123"
- "Create a new voucher for project-xyz789"
- "Check tier eligibility for customer-123"
- "Get Telegram analytics for project-def456"
    `);
  }

  /**
   * Show available tools
   */
  private showAvailableTools() {
    console.log("\nAvailable Tools:");
    console.log("-----------------");
    this.tools.forEach(tool => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });
  }
  
  /**
   * Clean up resources before shutdown
   */
  async cleanup() {
    logger.info("Cleaning up resources");
    if (this.transport) {
      await this.mcp.close();
    }
    if (this.grpcClient) {
      this.grpcClient.close();
    }
  }
}

export { DabaoMCPClient };