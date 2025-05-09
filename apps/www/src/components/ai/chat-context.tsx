"use client";

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { MCPClient, ChatResponse } from '@/lib/services/mcp-client';
import { Subscription } from 'rxjs';

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
  isConnected: boolean;
  connectionError: string | null;
  sendMessage: (content: string) => void;
  toggleChat: () => void;
  clearMessages: () => void;
  testConnection: () => Promise<boolean>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: React.ReactNode;
  mcpServerUrl: string;
  clientId?: string;
  initialMessages?: Message[];
  debug?: boolean;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
  mcpServerUrl,
  clientId = 'web-user',
  initialMessages = [],
  debug = false,
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const mcpClientRef = useRef<MCPClient>(new MCPClient(mcpServerUrl, debug));
  const sessionIdRef = useRef<string>(`session-${Date.now()}`);
  const activeSubscriptionRef = useRef<Subscription | null>(null);
  
  // Test connection to server on initial load
  useEffect(() => {
    const testConnection = async () => {
      try {
        const connected = await mcpClientRef.current.testConnection();
        setIsConnected(connected);
        if (!connected) {
          setConnectionError('Unable to connect to chat server');
          console.error('Failed to connect to chat server');
        } else {
          setConnectionError(null);
          if (debug) console.log('Successfully connected to chat server');
        }
      } catch (error) {
        setIsConnected(false);
        setConnectionError(`Error connecting to chat server: ${error}`);
        console.error('Error testing connection:', error);
      }
    };
    
    testConnection();
  }, [mcpServerUrl, debug]);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    sessionIdRef.current = `session-${Date.now()}`;
    
    // Cancel any ongoing subscription
    if (activeSubscriptionRef.current) {
      activeSubscriptionRef.current.unsubscribe();
      activeSubscriptionRef.current = null;
    }
  }, []);
  
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      const connected = await mcpClientRef.current.testConnection();
      setIsConnected(connected);
      setConnectionError(connected ? null : 'Unable to connect to chat server');
      return connected;
    } catch (error) {
      setIsConnected(false);
      setConnectionError(`Error connecting to chat server: ${error}`);
      console.error('Error testing connection:', error);
      return false;
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    // Check connection first
    if (!isConnected) {
      try {
        const connected = await testConnection();
        if (!connected) {
          // Add a system message indicating connection issues
          setMessages(prev => [...prev, {
            id: `system-${Date.now()}`,
            role: 'system',
            content: 'Unable to connect to chat server. Please try again later.',
            timestamp: new Date()
          }]);
          return;
        }
      } catch (error) {
        console.error('Connection test failed before sending message:', error);
        // Continue anyway and hope for the best
      }
    }

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

    // Cancel any previous subscription
    if (activeSubscriptionRef.current) {
      activeSubscriptionRef.current.unsubscribe();
    }

    try {
      // Prepare request format for the MCP service
      const chatMessages = messages
        .filter((msg) => !msg.pending && msg.role !== 'system')
        .concat(userMessage)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      // Set up the gRPC stream
      const stream = mcpClientRef.current.chatStream({
        messages: chatMessages,
        client_id: clientId,
        session_id: sessionIdRef.current,
      });
      
      let responseText = '';
      
      // Subscribe to the stream
      activeSubscriptionRef.current = stream.subscribe({
        next: (response: ChatResponse) => {
          if (response.message?.content) {
            responseText += response.message.content;
            
            // Update the placeholder message with the accumulated response
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === placeholderId
                  ? { ...msg, content: responseText, pending: false }
                  : msg
              )
            );
          }
          
          // Handle error in response
          if (response.error) {
            console.error('Error in chat response:', response.error);
            // Update message to show error
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === placeholderId
                  ? {
                      ...msg,
                      content: `Error: ${response.error}`,
                      pending: false,
                    }
                  : msg
              )
            );
          }
        },
        error: (error) => {
          console.error('Error in gRPC stream:', error);
          // Update the placeholder with error message
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === placeholderId
                ? {
                    ...msg,
                    content: 'Sorry, there was an error communicating with the assistant. Please try again.',
                    pending: false,
                  }
                : msg
            )
          );
          setIsLoading(false);
          activeSubscriptionRef.current = null;
          setIsConnected(false); // Mark as disconnected since we got an error
        },
        complete: () => {
          setIsLoading(false);
          activeSubscriptionRef.current = null;
          // If we got a complete without any content, show an error
          if (!responseText) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === placeholderId
                  ? {
                      ...msg,
                      content: 'The assistant provided an empty response. Please try again.',
                      pending: false,
                    }
                  : msg
              )
            );
          } else {
            setIsConnected(true); // Mark as connected since we got a successful response
            setConnectionError(null);
          }
        }
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update the placeholder with error message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === placeholderId
            ? {
                ...msg,
                content: 'Sorry, there was an error sending your message. Please try again.',
                pending: false,
              }
            : msg
        )
      );
      setIsLoading(false);
      setIsConnected(false);
      setConnectionError(`Error: ${error}`);
    }
  }, [messages, clientId, isConnected, testConnection]);

  // Clean up subscription when component unmounts
  useEffect(() => {
    return () => {
      if (activeSubscriptionRef.current) {
        activeSubscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isOpen,
        isLoading,
        isConnected,
        connectionError,
        sendMessage,
        toggleChat,
        clearMessages,
        testConnection
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