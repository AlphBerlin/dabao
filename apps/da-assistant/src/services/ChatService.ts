import { PrismaClient, Message, Session } from '@prisma/client';
import { TokenCounter } from '../utils/tokenCounter';

// Enum for message types
export enum MessageType {
  TEXT = 'TEXT',
  MEDIA = 'MEDIA'
}

// Enum for message status
export enum MessageStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  FAILED = 'FAILED'
}

/**
 * Service to manage chat sessions and message history
 */
export class ChatService {
  private prisma: PrismaClient;
  private tokenCounter: TokenCounter;
  private readonly MAX_TOKEN_LENGTH = 8000; // Maximum token length for context window
  private readonly RECENT_MESSAGES_COUNT = 20; // Number of recent messages to include by default
  
  constructor() {
    this.prisma = new PrismaClient();
    this.tokenCounter = new TokenCounter();
  }
  
  /**
   * Create a new chat session
   * 
   * @param userId - ID of the user creating the session
   * @param title - Optional title for the session
   * @returns The created session
   */
  async createSession(userId: string, title?: string): Promise<Session> {
    return this.prisma.session.create({
      data: {
        userId,
        title: title || `Chat session ${new Date().toLocaleDateString()}`
      }
    });
  }
  
  /**
   * Get a session by ID
   * 
   * @param sessionId - ID of the session to retrieve
   * @returns The session or null if not found
   */
  async getSession(sessionId: string): Promise<Session | null> {
    return this.prisma.session.findUnique({
      where: { id: sessionId }
    });
  }
  
  /**
   * Get all sessions for a user
   * 
   * @param userId - ID of the user
   * @returns Array of sessions
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    return this.prisma.session.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    });
  }
  
  /**
   * Save a message to the database
   * 
   * @param sessionId - ID of the session
   * @param content - Content of the message
   * @param senderId - ID of the sender
   * @param type - Type of message (TEXT, MEDIA, etc)
   * @param status - Status of the message
   * @param metadata - Optional metadata for the message
   * @returns The created message
   */
  async saveMessage(
    sessionId: string, 
    content: string, 
    senderId: string,
    type: MessageType = MessageType.TEXT,
    status: MessageStatus = MessageStatus.SENT,
    metadata?: any
  ): Promise<Message> {
    return this.prisma.message.create({
      data: {
        sessionId,
        content,
        senderId,
        type,
        status,
        metadata: metadata ? metadata : undefined,
        sentAt: new Date()
      }
    });
  }
  
  /**
   * Get recent messages for a session
   * 
   * @param sessionId - ID of the session
   * @param count - Number of messages to retrieve (default: 20)
   * @returns Array of recent messages
   */
  async getRecentMessages(sessionId: string, count: number = this.RECENT_MESSAGES_COUNT): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: count,
    });
  }
  
  /**
   * Get all messages for a session
   * 
   * @param sessionId - ID of the session
   * @returns Array of all messages
   */
  async getAllMessages(sessionId: string): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' }
    });
  }
  
  /**
   * Generate a summary of older messages when the history exceeds token limit
   * 
   * @param sessionId - ID of the session
   * @returns A summary of older messages
   */
  async summarizeOlderMessages(sessionId: string): Promise<string> {
    // Get all messages for the session
    const allMessages = await this.getAllMessages(sessionId);
    
    // Check if we need to summarize (if the total token count exceeds our limit)
    const tokenCount = await this.tokenCounter.countTokens(
      allMessages.map(msg => msg.content).join(' ')
    );
    
    if (tokenCount <= this.MAX_TOKEN_LENGTH) {
      return ''; // No need to summarize yet
    }
    
    // Keep the most recent messages directly and summarize older ones
    const recentMessages = allMessages.slice(-this.RECENT_MESSAGES_COUNT);
    const olderMessages = allMessages.slice(0, -this.RECENT_MESSAGES_COUNT);
    
    if (olderMessages.length === 0) {
      return ''; // No older messages to summarize
    }
    
    // Simple summarization strategy - extract key information
    // In a real implementation, you might use a model-based approach
    // Here we'll create a summary based on the older messages
    const summary = `This conversation includes ${olderMessages.length} older messages where the user and assistant discussed: ${
      olderMessages
        .filter(m => m.content.length > 10) // Filter out very short messages
        .slice(-5) // Take a few of the most recent older messages
        .map(m => m.content.substring(0, 100)) // Truncate long messages
        .join('; ')
    }`;
    
    // Save the summary in the session
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { summary }
    });
    
    return summary;
  }
  
  /**
   * Get the conversation context for a new message
   * This combines the session summary (if available) with recent messages
   * 
   * @param sessionId - ID of the session
   * @returns Context for the conversation
   */
  async getConversationContext(sessionId: string): Promise<{ 
    messages: Message[], 
    summary: string | null 
  }> {
    // Get the session data including the summary
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    // Get recent messages
    const recentMessages = await this.getRecentMessages(sessionId);
    
    // Check if we need to generate a summary
    if (!session.summary && recentMessages.length > this.RECENT_MESSAGES_COUNT) {
      await this.summarizeOlderMessages(sessionId);
      // Fetch the updated session with summary
      const updatedSession = await this.getSession(sessionId);
      if (updatedSession) {
        return {
          messages: recentMessages.reverse(), // Reverse to get chronological order
          summary: updatedSession.summary
        };
      }
    }
    
    return {
      messages: recentMessages.reverse(), // Reverse to get chronological order
      summary: session.summary
    };
  }
  
  /**
   * Update session metadata (like title or summary)
   * 
   * @param sessionId - ID of the session to update
   * @param data - Data to update
   * @returns The updated session
   */
  async updateSession(sessionId: string, data: Partial<Omit<Session, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Session> {
    return this.prisma.session.update({
      where: { id: sessionId },
      data
    });
  }
  
  /**
   * Delete a session and all its messages
   * 
   * @param sessionId - ID of the session to delete
   * @returns True if successful
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      // First delete all messages in the session
      await this.prisma.message.deleteMany({
        where: { sessionId }
      });
      
      // Then delete the session itself
      await this.prisma.session.delete({
        where: { id: sessionId }
      });
      
      return true;
    } catch (error) {
      console.error('Failed to delete session:', error);
      return false;
    }
  }
}