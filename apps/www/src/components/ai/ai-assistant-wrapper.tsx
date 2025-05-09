"use client";

import React from 'react';
import { ChatProvider } from './chat-context';
import { ResizableChatPanel } from './resizable-chat-panel';

interface AIAssistantWrapperProps {
  mcpServerUrl: string;
  botName?: string;
  botAvatar?: string;
  clientId?: string;
  debug?: boolean;
}

/**
 * AIAssistantWrapper is a component that provides a chat interface for the AI assistant.
 * It includes both the context provider and the UI components needed for the chat.
 */
export const AIAssistantWrapper: React.FC<AIAssistantWrapperProps> = ({
  mcpServerUrl,
  botName = 'Dabao Assistant',
  botAvatar = '/images/bot-avatar.png',
  clientId,
  debug = false,
}) => {
  // Log configuration in debug mode
  if (debug) {
    console.log('AIAssistantWrapper initialized with:', {
      mcpServerUrl,
      botName,
      clientId: clientId || 'undefined (using default)',
      debug
    });
  }
  
  // Initial welcome message from the assistant
  const initialMessages = [
    {
      id: 'welcome-1',
      role: 'assistant' as const,
      content: `👋 Hi there! I'm your ${botName}. How can I help you today?`,
      timestamp: new Date(),
    }
  ];

  return (
    <ChatProvider 
      mcpServerUrl={mcpServerUrl}
      clientId={clientId}
      initialMessages={initialMessages}
      debug={debug}
    >
      <ResizableChatPanel
        botName={botName}
        botAvatar={botAvatar}
        showConnectionStatus={debug}
      />
    </ChatProvider>
  );
};