import { IntentRecognizer } from '../intents/intentRecognizer.js';
import { logger, logPerformance } from '../logging/logger.js';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { v4 as uuidv4 } from 'uuid';

// Define chat message types
export interface ChatMessage {
  id: string;
  sessionId: string;
  userId?: string;
  content: string;
  timestamp: Date;
  role: 'user' | 'assistant';
  projectId?: string;
}

export interface ChatSession {
  id: string;
  userId?: string;
  projectId?: string;
  startTime: Date;
  lastActivity: Date;
  context: Record<string, string>;
  messages: ChatMessage[];
}

/**
 * ChatService - Manages chat interactions using intent recognition and MCP Client
 */
export class ChatService {
  private intentRecognizer: IntentRecognizer;
  private activeSessions: Map<string, ChatSession>;
  private mcpClient: Client | null = null;
  
  constructor() {
    this.intentRecognizer = new IntentRecognizer();
    this.activeSessions = new Map();
  }
  
  /**
   * Connect MCP client to the chat service and intent recognizer
   */
  public setMcpClient(client: Client): void {
    this.mcpClient = client;
    this.intentRecognizer.setMcpClient(client);
    logger.info('MCP client connected to chat service');
  }
  
  /**
   * Create a new chat session
   */
  public createSession(userId?: string, projectId?: string): ChatSession {
    const sessionId = `session_${Date.now()}_${uuidv4().substring(0, 8)}`;
    
    const session: ChatSession = {
      id: sessionId,
      userId,
      projectId,
      startTime: new Date(),
      lastActivity: new Date(),
      context: {},
      messages: []
    };
    
    if (projectId) {
      session.context.projectId = projectId;
    }
    
    this.activeSessions.set(sessionId, session);
    logger.info(`Chat session started: ${sessionId}`, { userId });
    
    return session;
  }
  
  /**
   * Process a message from a user and generate a response
   */
  public async processMessage(
    sessionId: string,
    message: string,
    userId?: string,
    projectId?: string
  ): Promise<ChatMessage> {
    const start = performance.now();
    
    try {
      // Get or create session
      let session = this.activeSessions.get(sessionId);
      if (!session) {
        session = this.createSession(userId, projectId);
      }
      
      // Update session
      session.lastActivity = new Date();
      if (projectId && !session.projectId) {
        session.projectId = projectId;
        session.context.projectId = projectId;
      }
      
      // Add user message to session
      const userMessage: ChatMessage = {
        id: uuidv4(),
        sessionId,
        userId,
        projectId,
        content: message,
        timestamp: new Date(),
        role: 'user'
      };
      session.messages.push(userMessage);
      
      // Process with intent recognizer
      const intent = await this.intentRecognizer.recognizeIntent(message, session.context);
      
      // Update context with any extracted entities
      if (intent.mcpToolParams) {
        if (intent.mcpToolParams.projectId && !session.context.projectId) {
          session.context.projectId = intent.mcpToolParams.projectId;
        }
        if (intent.mcpToolParams.customerId && !session.context.customerId) {
          session.context.customerId = intent.mcpToolParams.customerId;
        }
      }
      
      // Execute MCP tool if available
      const responseText = await this.intentRecognizer.executeMcpTool(intent);
      
      // Create assistant response message
      const responseMessage: ChatMessage = {
        id: uuidv4(),
        sessionId,
        userId,
        projectId,
        content: responseText,
        timestamp: new Date(),
        role: 'assistant'
      };
      session.messages.push(responseMessage);
      
      logger.info(`Processed message for user ${userId || 'anonymous'}, intent: ${intent.name}`);
      
      return responseMessage;
    } finally {
      const end = performance.now();
      logPerformance('message_processing', end - start, { sessionId });
    }
  }
  
  /**
   * Get messages for a specific session
   */
  public getSessionMessages(sessionId: string): ChatMessage[] {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return [];
    }
    return [...session.messages];
  }
  
  /**
   * Get active session by ID
   */
  public getSession(sessionId: string): ChatSession | undefined {
    return this.activeSessions.get(sessionId);
  }
  
  /**
   * End a chat session
   */
  public endSession(sessionId: string): boolean {
    return this.activeSessions.delete(sessionId);
  }
  
  /**
   * Clean up old sessions (utility method for maintenance)
   */
  public cleanupOldSessions(maxAgeMs: number = 3600000): number {
    const cutoffTime = new Date(Date.now() - maxAgeMs);
    let cleanedCount = 0;
    
    this.activeSessions.forEach((session, id) => {
      if (session.lastActivity < cutoffTime) {
        this.activeSessions.delete(id);
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} inactive chat sessions`);
    }
    
    return cleanedCount;
  }
}