import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";
import { logger, withPerformanceTracking, logAuditEvent } from "../logging/logger.js";
import { IntentRecognizer } from "../intents/intentRecognizer.js";
import { verifyToken } from "../middleware/auth.js";

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to proto file
const PROTO_PATH = path.join(__dirname, "../../proto/mcp.proto");

// Intent recognizer instance
const intentRecognizer = new IntentRecognizer();

// Initialize gRPC server
export async function initGrpcServer(): Promise<grpc.Server> {
  try {
    // Load proto file
    const packageDefinition = await protoLoader.load(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    
    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
    // We need to safely access without causing TypeScript errors
    const dabao = protoDescriptor.dabao as any;
    const mcpProto = dabao?.mcp || {};
    
    // Create new server instance
    const server = new grpc.Server();
    
    // Add services to the server
    addMCPService(server, mcpProto);
    addAuthService(server, mcpProto);
    addCampaignService(server, mcpProto);
    addTelegramService(server, mcpProto);
    addAnalyticsService(server, mcpProto);
    
    logger.info("gRPC server initialized with all services");
    return server;
  } catch (error: unknown) {
    logger.error(`Failed to initialize gRPC server: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

// Implement the MCP service
function addMCPService(server: grpc.Server, protoDescriptor: any) {
  server.addService(protoDescriptor.MCPService?.service || {}, {
    // Bidirectional streaming for chat
    chat: (call: any) => {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      let userId: string = 'unknown';
      let context: Record<string, string> = {};
      
      logger.info(`Chat session started: ${sessionId}`);
      
      // Handle incoming messages
      call.on('data', async (request: any) => {
        try {
          // Update session context
          userId = request.user_id || userId;
          context = { ...context, ...request.context };
          
          // Process message through intent recognition
          const startTime = performance.now();
          const intent = await intentRecognizer.recognizeIntent(request.message, context);
          const endTime = performance.now();
          
          logger.info(`Processed message for user ${userId}, intent: ${intent.name}`);
          logAuditEvent(userId, "chat_message", "mcp", "success", { 
            sessionId, 
            intent: intent.name,
            processingTime: endTime - startTime 
          });
          
          // Send response back
          call.write({
            message: intent.response,
            actions: intent.actions || [],
            context: intent.updatedContext || {},
            requires_followup: intent.requiresFollowup || false
          });
        } catch (error: any) {
          logger.error(`Error processing chat message: ${error.message}`);
          call.write({
            message: "I encountered an error processing your request. Please try again.",
            actions: [],
            context: context,
            requires_followup: false
          });
        }
      });
      
      // Handle end of conversation
      call.on('end', () => {
        logger.info(`Chat session ended: ${sessionId} for user: ${userId}`);
        call.end();
      });
    },
    
    // Process a single request
    processRequest: withPerformanceTracking(async (call, callback) => {
      try {
        const request = call.request;
        const user = await authenticateRequest(call);
        
        if (!user) {
          callback({
            code: grpc.status.UNAUTHENTICATED,
            message: "Authentication failed"
          });
          return;
        }
        
        // Process the requested intent
        const result = await intentRecognizer.executeIntent(request.intent, request.parameters || {}, user);
        
        callback(null, {
          message: result.message,
          success: true,
          payload: Buffer.from(JSON.stringify(result.data || {}))
        });
        
      } catch (error: any) {
        logger.error(`Error in processRequest: ${error.message}`);
        callback({
          code: grpc.status.INTERNAL,
          message: error.message
        });
      }
    }, "processRequest"),
    
    // Stream events to client
    streamEvents: (call: any) => {
      const request = call.request;
      const eventTypes = request.event_types || ['default'];
      const userId = request.user_id;
      
      logger.info(`Started event stream for user ${userId}, types: ${eventTypes.join(', ')}`);
      
      // This would typically connect to an event bus/pubsub system
      // For demonstration, we'll just send a periodic event
      const interval = setInterval(() => {
        const timestamp = new Date().toISOString();
        eventTypes.forEach((eventType: string) => {
          call.write({
            event_type: eventType,
            payload: Buffer.from(JSON.stringify({ timestamp, userId })),
            timestamp
          });
        });
      }, 10000); // Every 10 seconds
      
      call.on('cancelled', () => {
        clearInterval(interval);
        logger.info(`Event stream ended for user ${userId}`);
      });
    }
  });
  
  logger.info("MCP service added to gRPC server");
}

// Implement the Auth service
function addAuthService(server: grpc.Server, protoDescriptor: any) {
  server.addService(protoDescriptor.AuthService?.service || {}, {
    authenticate: withPerformanceTracking(async (call, callback) => {
      try {
        const { username, password } = call.request;
        
        // In a real implementation, this would validate against a user database
        // For demo purposes, we're using a mock implementation
        
        if (!username || !password) {
          callback({
            code: grpc.status.INVALID_ARGUMENT,
            message: "Username and password are required"
          });
          return;
        }
        
        // Mock user lookup - replace with actual database lookup
        const user = {
          id: `user_${Math.floor(Math.random() * 10000)}`,
          username,
          // Assign roles based on username for demo purposes
          roles: username.includes("admin") ? ["admin"] : 
                 username.includes("manager") ? ["manager"] : ["user"]
        };
        
        // Import here to avoid circular dependency
        const { generateToken } = await import("../middleware/auth.js");
        const tokenData = generateToken(user);
        
        callback(null, {
          token: tokenData.token,
          refresh_token: tokenData.refreshToken,
          expires_at: tokenData.expiresAt,
          user_id: user.id,
          roles: user.roles
        });
        
      } catch (error: any) {
        logger.error(`Authentication error: ${error.message}`);
        callback({
          code: grpc.status.INTERNAL,
          message: "Authentication failed"
        });
      }
    }, "authenticate"),
    
    validateToken: withPerformanceTracking(async (call, callback) => {
      try {
        const { token } = call.request;
        const user = await verifyToken(token);
        
        if (!user) {
          callback(null, { valid: false });
          return;
        }
        
        callback(null, {
          valid: true,
          user_id: user.id,
          roles: user.roles
        });
        
      } catch (error: any) {
        logger.error(`Token validation error: ${error.message}`);
        callback({
          code: grpc.status.INTERNAL,
          message: "Token validation failed"
        });
      }
    }, "validateToken"),
    
    refreshToken: withPerformanceTracking(async (call: any, callback: any) => {
      try {
        const { refresh_token } = call.request;
        
        // Validate refresh token - in a real implementation, check against database
        // For demo purposes, we'll use a simple JWT verification
        
        const secret = process.env.JWT_REFRESH_SECRET || "default_refresh_secret_change_in_production";
        
        // Fixed the async issue in the Promise callback
        const decoded = await new Promise((resolve, reject) => {
          import("jsonwebtoken").then(jwt => {
            jwt.verify(refresh_token, secret, (err: any, decoded: any) => {
              if (err) reject(err);
              else resolve(decoded);
            });
          }).catch(err => reject(err));
        });
        
        if (!decoded || !(decoded as any).userId) {
          callback({
            code: grpc.status.INVALID_ARGUMENT,
            message: "Invalid refresh token"
          });
          return;
        }
        
        // Mock user lookup - replace with database lookup
        const userId = (decoded as any).userId;
        const user = {
          id: userId,
          username: `user_${userId.substring(5)}`, // Extract from user id
          roles: ["user"] // Default role - in real app, get from database
        };
        
        // Generate new tokens
        const { generateToken } = await import("../middleware/auth.js");
        const tokenData = generateToken(user);
        
        callback(null, {
          token: tokenData.token,
          refresh_token: tokenData.refreshToken,
          expires_at: tokenData.expiresAt,
          user_id: user.id,
          roles: user.roles
        });
        
      } catch (error: unknown) {
        logger.error(`Token refresh error: ${error instanceof Error ? error.message : String(error)}`);
        callback({
          code: grpc.status.INTERNAL,
          message: "Token refresh failed"
        });
      }
    }, "refreshToken")
  });
  
  logger.info("Auth service added to gRPC server");
}

// Implement the Campaign service
function addCampaignService(server: grpc.Server, protoDescriptor: any) {
  server.addService(protoDescriptor.CampaignService?.service || {}, {
    // Add proper typing to call and callback parameters
    listCampaigns: withPerformanceTracking(async (call: any, callback: any) => {
      try {
        const user = await authenticateRequest(call);
        if (!user) {
          callback({
            code: grpc.status.UNAUTHENTICATED,
            message: "Authentication failed"
          });
          return;
        }
        
        // In a real implementation, fetch from database
        // Mock response for demo
        const campaigns = Array.from({ length: 10 }, (_, i) => ({
          id: `campaign_${i + 1}`,
          name: `Test Campaign ${i + 1}`,
          description: `This is a sample campaign ${i + 1}`,
          status: i % 5, // Random status
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          scheduled_at: i % 2 === 0 ? new Date(Date.now() + 86400000).toISOString() : "",
          created_by: user.id,
          metadata: { key: `value${i}` }
        }));
        
        callback(null, {
          campaigns,
          total_count: 100, // Mock total
          page: call.request.page || 1,
          page_size: call.request.page_size || 10
        });
        
      } catch (error: any) {
        logger.error(`Error in listCampaigns: ${error.message}`);
        callback({
          code: grpc.status.INTERNAL,
          message: error.message
        });
      }
    }, "listCampaigns"),
    
    createCampaign: withPerformanceTracking(async (call: any, callback: any) => {
      try {
        const user = await authenticateRequest(call);
        if (!user) {
          callback({
            code: grpc.status.UNAUTHENTICATED,
            message: "Authentication failed"
          });
          return;
        }
        
        // Check permission - only admin and manager can create
        if (!user.roles.includes('admin') && !user.roles.includes('manager')) {
          callback({
            code: grpc.status.PERMISSION_DENIED,
            message: "You don't have permission to create campaigns"
          });
          return;
        }
        
        const { name, description, metadata } = call.request;
        
        // Validate input
        if (!name || name.trim() === '') {
          callback({
            code: grpc.status.INVALID_ARGUMENT,
            message: "Campaign name is required"
          });
          return;
        }
        
        // In a real implementation, save to database
        // Mock response for demo
        const campaign = {
          id: `campaign_${Date.now()}`,
          name,
          description: description || "",
          status: 0, // DRAFT
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          scheduled_at: "",
          created_by: user.id,
          metadata: metadata || {}
        };
        
        logAuditEvent(user.id, "create", "campaign", "success", { 
          campaignId: campaign.id,
          campaignName: campaign.name
        });
        
        callback(null, campaign);
        
      } catch (error: any) {
        logger.error(`Error in createCampaign: ${error.message}`);
        callback({
          code: grpc.status.INTERNAL,
          message: error.message
        });
      }
    }, "createCampaign")
    
    // Add other campaign service methods here
  });
  
  logger.info("Campaign service added to gRPC server");
}

// Implement the Telegram service
function addTelegramService(server: grpc.Server, protoDescriptor: any) {
  server.addService(protoDescriptor.TelegramService.service, {
    // Implement telegram service methods
    // For brevity, implementing just one method as an example
    
    sendMessage: withPerformanceTracking(async (call, callback) => {
      try {
        const user = await authenticateRequest(call);
        if (!user) {
          callback({
            code: grpc.status.UNAUTHENTICATED,
            message: "Authentication failed"
          });
          return;
        }
        
        const { chat_id, text, use_markdown } = call.request;
        
        // Validate input
        if (!chat_id || !text) {
          callback({
            code: grpc.status.INVALID_ARGUMENT,
            message: "Chat ID and text are required"
          });
          return;
        }
        
        // In a real implementation, send to Telegram API
        // Mock response for demo
        const messageId = `msg_${Date.now()}`;
        
        logAuditEvent(user.id, "send", "telegram_message", "success", { 
          chatId: chat_id,
          messageId,
          useMarkdown: use_markdown
        });
        
        callback(null, {
          success: true,
          message_id: messageId
        });
        
      } catch (error: any) {
        logger.error(`Error in sendMessage: ${error.message}`);
        callback({
          code: grpc.status.INTERNAL,
          message: error.message
        });
      }
    }, "sendMessage")
    
    // Add other telegram service methods here
  });
  
  logger.info("Telegram service added to gRPC server");
}

// Implement the Analytics service
function addAnalyticsService(server: grpc.Server, protoDescriptor: any) {
  server.addService(protoDescriptor.AnalyticsService.service, {
    // Implement analytics service methods
    // For brevity, implementing just one method as an example
    
    getCampaignMetrics: withPerformanceTracking(async (call, callback) => {
      try {
        const user = await authenticateRequest(call);
        if (!user) {
          callback({
            code: grpc.status.UNAUTHENTICATED,
            message: "Authentication failed"
          });
          return;
        }
        
        const { campaign_id, metrics = [] } = call.request;
        
        // Validate input
        if (!campaign_id) {
          callback({
            code: grpc.status.INVALID_ARGUMENT,
            message: "Campaign ID is required"
          });
          return;
        }
        
        // In a real implementation, fetch from analytics database
        // Mock response for demo
        const mockMetrics: Record<string, number> = {
          opens: Math.floor(Math.random() * 1000),
          clicks: Math.floor(Math.random() * 500),
          conversions: Math.floor(Math.random() * 100),
          engagement_rate: Math.random() * 0.5,
          bounce_rate: Math.random() * 0.3
        };
        
        const timeSeries = [
          {
            metric: "opens",
            timestamps: Array.from({ length: 7 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - (6 - i));
              return date.toISOString().split('T')[0];
            }),
            values: Array.from({ length: 7 }, () => Math.floor(Math.random() * 200))
          },
          {
            metric: "clicks",
            timestamps: Array.from({ length: 7 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - (6 - i));
              return date.toISOString().split('T')[0];
            }),
            values: Array.from({ length: 7 }, () => Math.floor(Math.random() * 100))
          }
        ];
        
        callback(null, {
          campaign_id,
          metrics: mockMetrics,
          time_series: timeSeries
        });
        
      } catch (error: any) {
        logger.error(`Error in getCampaignMetrics: ${error.message}`);
        callback({
          code: grpc.status.INTERNAL,
          message: error.message
        });
      }
    }, "getCampaignMetrics")
    
    // Add other analytics service methods here
  });
  
  logger.info("Analytics service added to gRPC server");
}

// Helper function to authenticate gRPC requests
async function authenticateRequest(call: any) {
  try {
    const metadata = call.metadata.getMap();
    const token = metadata.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return null;
    }
    
    return await verifyToken(token);
  } catch (error) {
    logger.error(`Authentication error: ${(error as Error).message}`);
    return null;
  }
}