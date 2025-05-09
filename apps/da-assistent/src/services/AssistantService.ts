import { EventEmitter } from 'events';
import { ChatService, MessageType, MessageStatus } from './ChatService';
import { MCPService } from './MCPService';
import { ChatMessage, ChatRequest } from '../types';
import { Message } from '@prisma/client';

/**
 * Service that combines the ChatService and MCPService to create
 * a fully-featured assistant with persistent history
 */
export class AssistantService extends EventEmitter {
  private mcpService: MCPService;
  private chatService: ChatService;
  private readonly assistantId = 'da-assistant';
  private readonly defaultModel = process.env.DEFAULT_MODEL || 'claude-3-opus-20240229';
  
  /**
   * Initialize the assistant service
   * 
   * @param mcpServerAddress - The address of the MCP gRPC server
   */
  constructor(mcpServerAddress: string) {
    super();
    this.mcpService = new MCPService();
    this.chatService = new ChatService();
  }
  
  /**
   * Connect to required services
   */
  async connect(): Promise<void> {
    await this.mcpService.connect();
  }
  
  /**
   * Disconnect from services
   */
  async disconnect(): Promise<void> {
    await this.mcpService.disconnect();
  }
  
  /**
   * Format internal messages to the format expected by the MCP server
   * 
   * @param messages - Messages from the database
   * @returns Messages formatted for the MCP service
   */
  private formatMessagesForModel(messages: Message[], systemSummary: string | null): ChatMessage[] {
    const formattedMessages: ChatMessage[] = [];
    
    // If there's a system summary, add it as the first message
    if (systemSummary) {
      formattedMessages.push({
        role: 'system',
        content: systemSummary
      });
    }
    
    // Add all messages in the conversation
    for (const message of messages) {
      // Determine if this is a user or assistant message based on senderId
      const role = message.senderId === this.assistantId ? 'assistant' : 'user';
      
      formattedMessages.push({
        role,
        content: message.content
      });
    }
    
    return formattedMessages;
  }
  
  /**
   * Create a new chat session
   * 
   * @param userId - ID of the user
   * @param title - Optional title for the session
   * @returns The session ID
   */
  async createSession(userId: string, title?: string): Promise<string> {
    const session = await this.chatService.createSession(userId, title);
    return session.id;
  }
  
  /**
   * Send a message to the assistant and get a response
   * 
   * @param sessionId - ID of the session
   * @param userId - ID of the user sending the message
   * @param message - Content of the message
   * @param parameters - Optional parameters for the model
   * @returns The assistant's response
   */
  async sendMessage(
    sessionId: string, 
    userId: string, 
    message: string,
    parameters: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
    } = {}
  ): Promise<string> {
    // First, save the user message to the database
    await this.chatService.saveMessage(
      sessionId,
      message,
      userId,
      MessageType.TEXT,
      MessageStatus.SENT
    );
    
    // Get the conversation context (messages + summary)
    const context = await this.chatService.getConversationContext(sessionId);
    
    // Format messages for the model
    const formattedMessages = this.formatMessagesForModel(context.messages, context.summary);
    
    // Create the chat request
    const chatRequest: ChatRequest = {
      messages: formattedMessages,
      model: parameters.model || this.defaultModel,
      temperature: parameters.temperature || 0.7,
      max_tokens: parameters.max_tokens || 4096,
      client_id: userId,
      session_id: sessionId
    };
    
    // Send the request to the MCP server
    const response = await this.mcpService.chat(chatRequest);
    
    if (response.error) {
      throw new Error(`Error from MCP server: ${response.error}`);
    }
    
    if (!response.message || !response.message.content) {
      throw new Error('Empty response from MCP server');
    }
    
    const assistantResponse = response.message.content;
    
    // Save the assistant's response to the database
    await this.chatService.saveMessage(
      sessionId,
      assistantResponse,
      this.assistantId,
      MessageType.TEXT,
      MessageStatus.SENT
    );
    
    // Update the session's summary if needed
    await this.chatService.summarizeOlderMessages(sessionId);
    
    return assistantResponse;
  }
  
  /**
   * Send a message to the assistant and stream the response
   * 
   * @param sessionId - ID of the session
   * @param userId - ID of the user sending the message
   * @param message - Content of the message
   * @param parameters - Optional parameters for the model
   * @returns Event emitter that emits 'data', 'error', and 'end' events
   */
  async sendMessageStream(
    sessionId: string, 
    userId: string, 
    message: string,
    parameters: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
    } = {}
  ): Promise<EventEmitter> {
    // First, save the user message to the database
    await this.chatService.saveMessage(
      sessionId,
      message,
      userId,
      MessageType.TEXT,
      MessageStatus.SENT
    );
    
    // Get the conversation context (messages + summary)
    const context = await this.chatService.getConversationContext(sessionId);
    
    // Format messages for the model
    const formattedMessages = this.formatMessagesForModel(context.messages, context.summary);
    
    // Create the chat request
    const chatRequest: ChatRequest = {
      messages: formattedMessages,
      model: parameters.model || this.defaultModel,
      temperature: parameters.temperature || 0.7,
      max_tokens: parameters.max_tokens || 4096,
      client_id: userId,
      session_id: sessionId
    };
    
    // Create an event emitter for the response
    const responseEmitter = new EventEmitter();
    
    // Send the request to the MCP server and stream the response
    const mcpStream = this.mcpService.chatStream(chatRequest);
    
    let fullResponse = '';
    
    mcpStream.on('data', (chunk) => {
      if (chunk.error) {
        responseEmitter.emit('error', new Error(`Error from MCP server: ${chunk.error}`));
        return;
      }
      
      if (chunk.message && chunk.message.content) {
        fullResponse += chunk.message.content;
        responseEmitter.emit('data', chunk.message.content);
      }
    });
    
    mcpStream.on('error', (error) => {
      responseEmitter.emit('error', error);
    });
    
    mcpStream.on('end', async () => {
      if (fullResponse) {
        // Save the assistant's complete response to the database
        await this.chatService.saveMessage(
          sessionId,
          fullResponse,
          this.assistantId,
          MessageType.TEXT,
          MessageStatus.SENT
        );
        
        // Update the session's summary if needed
        await this.chatService.summarizeOlderMessages(sessionId);
      }
      
      responseEmitter.emit('end');
    });
    
    return responseEmitter;
  }
  
  /**
   * Get all sessions for a user
   * 
   * @param userId - ID of the user
   * @returns List of sessions
   */
  async getUserSessions(userId: string) {
    return this.chatService.getUserSessions(userId);
  }
  
  /**
   * Get all messages for a session
   * 
   * @param sessionId - ID of the session
   * @returns List of messages
   */
  async getSessionMessages(sessionId: string) {
    return this.chatService.getAllMessages(sessionId);
  }
  
  /**
   * Delete a session
   * 
   * @param sessionId - ID of the session to delete
   * @returns Whether the deletion was successful
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    return this.chatService.deleteSession(sessionId);
  }
}