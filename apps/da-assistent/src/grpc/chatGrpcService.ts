import * as grpc from '@grpc/grpc-js';
import { ChatService } from '../services/ChatService.js';
import { DabaoMCPClient } from '../services/MCPClient.js';
import { logger } from '../logging/logger.js';
import { auditLog } from '../lib/audit.js';

// Define types for gRPC calls and requests
type GrpcCallback = (error: Error | null | any, response?: any) => void;
type GrpcRequest = {
  request: {
    content: string;
    user_id?: string;
    project_id?: string;
    session_id?: string;
    metadata?: Record<string, any>;
  };
  metadata: any;
};

/**
 * ChatGrpcService - Implements gRPC chat service methods
 * Uses the ChatService which integrates with MCP client for all operations
 */
export class ChatGrpcService {
  private chatService: ChatService;
  private mcpClient: DabaoMCPClient | null = null;
  
  constructor(chatService: ChatService) {
    this.chatService = chatService;
  }
  
  /**
   * Set the MCP client instance
   */
  public setMcpClient(client: DabaoMCPClient): void {
    this.mcpClient = client;
    // Pass the MCP client's internal client to the chat service
    if (client && client.getMcpClient) {
      this.chatService.setMcpClient(client.getMcpClient());
    }
    logger.info('MCP client connected to gRPC chat service');
  }
  
  /**
   * Handle the SendMessage gRPC method
   */
  public async sendMessage(call: GrpcRequest, callback: GrpcCallback): Promise<void> {
    try {
      const { content, user_id: userId, project_id: projectId, session_id: sessionId, metadata } = call.request;
      
      // Use existing session or create new one
      const session = sessionId ? sessionId : undefined;
      
      // Process the message through chat service (which uses intent recognition and MCP client)
      const startTime = Date.now();
      const response = await this.chatService.processMessage(
        session || 'default',
        content,
        userId,
        projectId
      );
      const processingTime = Date.now() - startTime;
      
      // Audit the interaction
      auditLog('chat_message', 'grpc_chat', userId || 'anonymous', 'success', {
        sessionId: response.sessionId,
        processingTime,
        projectId
      }).catch((error: any) => {
        logger.error('Failed to log audit event', { 
          error: error instanceof Error ? error.message : String(error), 
          eventType: 'chat_message', 
          resource: 'grpc_chat', 
          userId 
        });
      });
      
      // Return response to client
      callback(null, {
        content: response.content,
        session_id: response.sessionId,
        tools_used: [],  // Could be populated from intent if needed
        metadata: {
          processing_time_ms: processingTime,
          model_used: 'dabao-intent',
          cached: false
        },
        status_code: 200
      });
    } catch (error: any) {
      logger.error('Error processing chat message', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      // Create a proper Error object instead of casting
      const grpcError: any = new Error(`Internal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      grpcError.code = grpc.status.INTERNAL;
      callback(grpcError);
    }
  }
  
  /**
   * Handle the ChatStream gRPC method for bidirectional streaming
   */
  public chatStream(call: any): void {
    let currentSessionId: string | undefined;
    let userId: string | undefined;
    let projectId: string | undefined;
    
    // Handle incoming messages
    call.on('data', async (request: any) => {
      try {
        const { content, user_id, project_id, session_id, metadata } = request;
        userId = user_id || userId;
        projectId = project_id || projectId;
        
        // Use existing session or create a new one
        currentSessionId = session_id || currentSessionId;
        if (!currentSessionId) {
          const newSession = this.chatService.createSession(userId, projectId);
          currentSessionId = newSession.id;
        }
        
        // Process message
        const startTime = Date.now();
        const response = await this.chatService.processMessage(
          currentSessionId,
          content,
          userId,
          projectId
        );
        const processingTime = Date.now() - startTime;
        
        // Audit the interaction
        auditLog('chat_stream_message', 'grpc_chat', userId || 'anonymous', 'success', {
          sessionId: currentSessionId,
          processingTime
        }).catch((error: any) => {
          logger.error('Failed to log stream audit event', { 
            error: error instanceof Error ? error.message : String(error) 
          });
        });
        
        // Send response back through the stream
        call.write({
          content: response.content,
          session_id: currentSessionId,
          tools_used: [],
          metadata: {
            processing_time_ms: processingTime,
            model_used: 'dabao-intent',
            cached: false
          },
          status_code: 200
        });
      } catch (error: any) {
        logger.error('Error processing stream message', { 
          error: error instanceof Error ? error.message : String(error), 
          sessionId: currentSessionId 
        });
        call.write({
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          session_id: currentSessionId,
          metadata: {
            processing_time_ms: 0,
            model_used: 'error',
            cached: false
          },
          status_code: 500
        });
      }
    });
    
    // Handle stream end
    call.on('end', () => {
      if (currentSessionId) {
        logger.info(`Chat stream ended for session ${currentSessionId}`);
      }
      call.end();
    });
    
    // Handle errors
    call.on('error', (error: any) => {
      logger.error('gRPC stream error', { 
        error: error instanceof Error ? error.message : String(error), 
        sessionId: currentSessionId 
      });
    });
  }
}