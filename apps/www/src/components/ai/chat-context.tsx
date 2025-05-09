"use client";

import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { MCPClient } from '@/lib/services/mcp-client';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  pending?: boolean;
}

interface ChatContextType {
  messages: Message[];
  isOpen: boolean;
  isLoading: boolean;
  sendMessage: (content: string) => void;
  toggleChat: () => void;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: React.ReactNode;
  mcpServerUrl: string;
  clientId?: string;
  initialMessages?: Message[];
}

export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
  mcpServerUrl,
  clientId = 'web-user',
  initialMessages = []
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mcpClientRef = useRef<MCPClient>(new MCPClient(mcpServerUrl));
  const sessionIdRef = useRef<string>(`session-${Date.now()}`);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    sessionIdRef.current = `session-${Date.now()}`;
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Create user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    // Add user message to state
    setMessages((prev) => [...prev, userMessage]);
    
    // Create placeholder for assistant response
    const placeholderId = `assistant-${Date.now()}`;
    const placeholder: Message = {
      id: placeholderId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      pending: true,
    };
    
    setMessages((prev) => [...prev, placeholder]);
    setIsLoading(true);

    try {
      // Prepare request format for the MCP service
      const chatMessages = messages
        .filter((msg) => !msg.pending)
        .concat(userMessage)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      // Create stream for real-time updates
      const stream = await mcpClientRef.current.chatStream({
        messages: chatMessages,
        client_id: clientId,
        session_id: sessionIdRef.current,
      });
      
      // Process streaming response
      const reader = stream.getReader();
      let responseText = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        // Update message content if there is new content
        if (value?.message?.content) {
          responseText += value.message.content;
          
          // Update the placeholder message with the accumulated response
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === placeholderId
                ? { ...msg, content: responseText, pending: false }
                : msg
            )
          );
        }
        
        // Handle error case
        if (value?.error) {
          throw new Error(value.error);
        }
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update the placeholder with error message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === placeholderId
            ? {
                ...msg,
                content: 'Sorry, there was an error processing your request.',
                pending: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [messages, clientId]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isOpen,
        isLoading,
        sendMessage,
        toggleChat,
        clearMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};