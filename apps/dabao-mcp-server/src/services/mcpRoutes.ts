import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { logger, withPerformanceTracking } from "../logging/logger.js";
import { IntentRecognizer } from "../intents/intentRecognizer.js";

// Create an instance of the intent recognizer
const intentRecognizer = new IntentRecognizer();

export function setupRoutes(server: Server) {
  // List available resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    logger.info("Listing MCP resources");
    
    return {
      resources: [
        {
          uri: "mcp://dabao/campaigns",
          mimeType: "application/json",
          name: "Campaigns",
        },
        {
          uri: "mcp://dabao/telegram/templates",
          mimeType: "application/json",
          name: "Telegram Templates",
        },
        {
          uri: "mcp://dabao/analytics/overview",
          mimeType: "application/json",
          name: "Analytics Overview",
        },
      ],
    };
  });

  // Handle reading resources
  server.setRequestHandler(
    ReadResourceRequestSchema,
    withPerformanceTracking(async (request) => {
      const uri = request.params.uri;
      logger.info(`Reading resource: ${uri}`);

      // Extract resource type from URI
      const resourceType = extractResourceTypeFromUri(uri);
      
      try {
        let content: any;
        
        switch (resourceType) {
          case "campaigns":
            content = await getResourceContent("campaigns");
            break;
          case "telegram/templates":
            content = await getResourceContent("telegram_templates");
            break;
          case "analytics/overview":
            content = await getResourceContent("analytics_overview");
            break;
          default:
            throw new Error(`Unknown resource: ${uri}`);
        }

        return {
          contents: [
            {
              uri: uri,
              mimeType: "application/json",
              text: JSON.stringify(content, null, 2),
            },
          ],
        };
      } catch (error: any) {
        logger.error(`Error reading resource ${uri}: ${error.message}`);
        throw error;
      }
    }, "read_resource"),
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.info("Listing MCP tools");
    
    return {
      tools: [
        {
          name: "process_text",
          description: "Process a text query and execute the corresponding intent",
          inputSchema: {
            type: "object",
            properties: {
              text: { type: "string" },
              userId: { type: "string" },
              sessionId: { type: "string", optional: true },
              context: { 
                type: "object", 
                additionalProperties: { type: "string" },
                optional: true
              },
            },
            required: ["text", "userId"],
          },
        },
        {
          name: "campaign_create",
          description: "Create a new campaign",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string", optional: true },
              tags: { 
                type: "array", 
                items: { type: "string" },
                optional: true
              },
              scheduledDate: { type: "string", optional: true },
            },
            required: ["name"],
          },
        },
        {
          name: "campaign_list",
          description: "List all campaigns",
          inputSchema: {
            type: "object",
            properties: {
              page: { type: "number", optional: true },
              pageSize: { type: "number", optional: true },
              filter: { type: "string", optional: true },
            },
          },
        },
        {
          name: "telegram_send",
          description: "Send a telegram message",
          inputSchema: {
            type: "object",
            properties: {
              chatId: { type: "string" },
              message: { type: "string" },
              useMarkdown: { type: "boolean", optional: true },
            },
            required: ["chatId", "message"],
          },
        },
        {
          name: "analytics_get",
          description: "Get analytics data",
          inputSchema: {
            type: "object",
            properties: {
              campaignId: { type: "string", optional: true },
              startDate: { type: "string", optional: true },
              endDate: { type: "string", optional: true },
              type: { type: "string", optional: true },
            },
          },
        },
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(
    CallToolRequestSchema,
    withPerformanceTracking(async (request) => {
      const toolName = request.params.name;
      const args = request.params.arguments || {};
      const user = request.context?.user;
      
      logger.info(`Tool call: ${toolName}`, { args });
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      try {
        switch (toolName) {
          case "process_text": {
            const { text, userId, sessionId, context = {} } = args;
            
            if (!text || typeof text !== "string") {
              throw new Error("Text parameter is required");
            }
            
            const intent = await intentRecognizer.recognizeIntent(text, context);
            
            return {
              content: [
                {
                  type: "text",
                  text: intent.response,
                },
                {
                  type: "application/json",
                  text: JSON.stringify({
                    actions: intent.actions || [],
                    requiresFollowup: intent.requiresFollowup || false,
                    updatedContext: intent.updatedContext || context,
                  }),
                },
              ],
              isError: false,
            };
          }
            
          case "campaign_create": {
            const result = await intentRecognizer.executeIntent(
              "campaign.create", 
              args, 
              user
            );
            
            return {
              content: [
                { type: "text", text: result.message },
                { 
                  type: "application/json", 
                  text: JSON.stringify(result.data || {}) 
                },
              ],
              isError: !result.success,
            };
          }
            
          case "campaign_list": {
            const result = await intentRecognizer.executeIntent(
              "campaign.list", 
              args, 
              user
            );
            
            return {
              content: [
                { type: "text", text: result.message },
                { 
                  type: "application/json", 
                  text: JSON.stringify(result.data || {}) 
                },
              ],
              isError: !result.success,
            };
          }
            
          case "telegram_send": {
            const result = await intentRecognizer.executeIntent(
              "telegram.send", 
              {
                chatId: args.chatId,
                message: args.message,
                useMarkdown: args.useMarkdown
              }, 
              user
            );
            
            return {
              content: [
                { type: "text", text: result.message },
                { 
                  type: "application/json", 
                  text: JSON.stringify(result.data || {}) 
                },
              ],
              isError: !result.success,
            };
          }
            
          case "analytics_get": {
            const result = await intentRecognizer.executeIntent(
              "analytics.overview", 
              args, 
              user
            );
            
            return {
              content: [
                { type: "text", text: result.message },
                { 
                  type: "application/json", 
                  text: JSON.stringify(result.data || {}) 
                },
              ],
              isError: !result.success,
            };
          }
            
          default:
            throw new Error(`Unknown tool: ${toolName}`);
        }
      } catch (error: any) {
        logger.error(`Error calling tool ${toolName}: ${error.message}`);
        
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }, "call_tool"),
  );

  logger.info("MCP routes have been set up");
}

// Helper function to extract resource type from URI
function extractResourceTypeFromUri(uri: string): string {
  try {
    const url = new URL(uri);
    return url.pathname.replace(/^\//, "");
  } catch (error) {
    // If URI can't be parsed as URL, try to extract path component
    const parts = uri.split("://");
    if (parts.length > 1) {
      const pathParts = parts[1].split("/");
      return pathParts.slice(1).join("/");
    }
  }
  
  return "";
}

// Helper function to get resource content
async function getResourceContent(resourceType: string): Promise<any> {
  // Mock implementations
  switch (resourceType) {
    case "campaigns":
      return {
        campaigns: [
          {
            id: "campaign_1",
            name: "Summer Sale",
            description: "Summer promotion campaign",
            status: "ACTIVE",
            created_at: new Date().toISOString(),
          },
          {
            id: "campaign_2",
            name: "Welcome Flow",
            description: "New user onboarding",
            status: "SCHEDULED",
            created_at: new Date().toISOString(),
            scheduled_at: new Date(Date.now() + 86400000).toISOString(),
          },
        ],
      };
    
    case "telegram_templates":
      return {
        templates: [
          {
            id: "template_1",
            name: "Welcome Message",
            content: "Welcome to our channel! 👋",
          },
          {
            id: "template_2",
            name: "Promotion",
            content: "🎉 Special offer: {{offer}} - Limited time only! 🎉",
          },
        ],
      };
    
    case "analytics_overview":
      return {
        overview: {
          total_campaigns: 10,
          active_campaigns: 3,
          total_subscribers: 5432,
          messages_sent: 12345,
          engagement_rate: "23.5%",
          period: "Last 30 days",
        },
      };
    
    default:
      return {};
  }
}